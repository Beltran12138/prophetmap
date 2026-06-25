/**
 * update-valuations.js
 *
 * Fetches real-time pricing data for all universe tickers via yahoo-finance2,
 * computes the four-dimensional pricing score, and writes results to
 * data/scores/YYYY-MM-DD.json.
 *
 * Pricing score algorithm (1=cheap/unpriced, 5=expensive/fully-priced):
 *   30% — Forward P/E deviation from layer sector median
 *   25% — EV/Revenue deviation from layer sector median
 *   25% — Analyst consensus upside (inverted — low upside = more priced in)
 *   20% — 6-month momentum vs SPY (outperformance = more priced in)
 *
 * Cyclical value-trap gate (opt-in per ticker via "cyclical": true): raises the
 *   pricingScore of peak-cycle cyclicals whose low forward P/E (built on peak EPS)
 *   would otherwise misread as cheap. See cyclicalTrapAdjustment().
 *
 * Funnel pass: physicalConstraint >= 4 AND aiContribution >= 0.30
 *              AND timeToRealize != "far" AND pricingScore <= 3
 *              (pricingScore here is the cyclical-trap-adjusted "effective" score)
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });
const fs = require('fs');
const path = require('path');

const UNIVERSE_PATH = path.join(__dirname, '../data/universe.json');
const BENCHMARKS_PATH = path.join(__dirname, '../data/sector-benchmarks.json');
const SCORES_DIR = path.join(__dirname, '../data/scores');

const RATE_LIMIT_MS = 400; // ms between Yahoo Finance requests

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sixMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d;
}

/**
 * Clamp a value between min and max.
 */
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Compute pricing score component from a ratio deviation.
 * deviation = (actual - median) / median
 * +100% above median -> score 5, at median -> 3, -60% below -> 1
 */
function deviationToScore(actual, median) {
  if (actual == null || median == null || median === 0) return null;
  const deviation = (actual - median) / Math.abs(median);
  return clamp(3 + deviation * 2.5, 1, 5);
}

/**
 * Fetch 6-month price return for a symbol.
 * Returns decimal (e.g. 0.35 for +35%) or null on error.
 */
async function get6mReturn(symbol) {
  try {
    const rows = await yahooFinance.historical(symbol, {
      period1: sixMonthsAgo(),
      period2: new Date(),
      interval: '1mo',
    });
    if (!rows || rows.length < 2) return null;
    const first = rows[0].close;
    const last = rows[rows.length - 1].close;
    return (last - first) / first;
  } catch {
    return null;
  }
}

/**
 * Compute weighted pricing score (1-5) from fetched data.
 */
function computePricingScore(quote, summary, return6m, spy6m, benchmarks) {
  const scores = {};
  let totalWeight = 0;
  let weightedSum = 0;

  // Component 1: Forward P/E (30%)
  const fwdPE = summary?.defaultKeyStatistics?.forwardPE;
  // Negative forward P/E = net loss (negative forward EPS). deviationToScore would
  // read the negative value as far-below-median and misjudge a loss-maker as "cheap"
  // (score 1). A company with no forward profit is the opposite of cheap on this
  // dimension — treat net-loss as maximally-priced/risky (score 5).
  const s1 = (fwdPE != null && fwdPE < 0)
    ? 5
    : deviationToScore(fwdPE, benchmarks.medianForwardPE);
  if (s1 != null) {
    scores.forwardPE = { value: fwdPE, benchmark: benchmarks.medianForwardPE, score: Math.round(s1 * 10) / 10 };
    weightedSum += s1 * 0.30;
    totalWeight += 0.30;
  }

  // Component 2: EV/Revenue (25%)
  const evr = summary?.defaultKeyStatistics?.enterpriseToRevenue;
  const s2 = deviationToScore(evr, benchmarks.medianEVRevenue);
  if (s2 != null) {
    scores.evRevenue = { value: evr, benchmark: benchmarks.medianEVRevenue, score: Math.round(s2 * 10) / 10 };
    weightedSum += s2 * 0.25;
    totalWeight += 0.25;
  }

  // Component 3: Analyst upside — inverted (25%)
  const targetPrice = summary?.financialData?.targetMeanPrice;
  const currentPrice = quote?.regularMarketPrice;
  if (targetPrice != null && currentPrice != null && currentPrice > 0) {
    const upside = (targetPrice - currentPrice) / currentPrice;
    // 50% upside -> score 1, 0% upside -> score 3, -25% downside -> score 5
    const s3 = clamp(3 - upside * 4, 1, 5);
    scores.analystUpside = {
      targetPrice,
      currentPrice,
      upside: Math.round(upside * 1000) / 10,
      score: Math.round(s3 * 10) / 10,
    };
    weightedSum += s3 * 0.25;
    totalWeight += 0.25;
  }

  // Component 4: 6-month momentum vs SPY (20%)
  if (return6m != null && spy6m != null) {
    const relMomentum = return6m - spy6m;
    // +60% vs SPY -> score 5, at SPY -> 3, -60% vs SPY -> 1
    const s4 = clamp(3 + relMomentum * 3.33, 1, 5);
    scores.momentum6m = {
      ticker6m: Math.round(return6m * 1000) / 10,
      spy6m: Math.round(spy6m * 1000) / 10,
      relative: Math.round(relMomentum * 1000) / 10,
      score: Math.round(s4 * 10) / 10,
    };
    weightedSum += s4 * 0.20;
    totalWeight += 0.20;
  }

  if (totalWeight === 0) return { pricingScore: null, components: scores, dataQuality: 'insufficient' };

  // Rescale to full weight
  const pricingScore = Math.round((weightedSum / totalWeight) * 10) / 10;
  const dataQuality = totalWeight >= 0.75 ? 'good' : totalWeight >= 0.5 ? 'partial' : 'low';

  return { pricingScore, components: scores, dataQuality };
}

/**
 * Cyclical value-trap gate (opt-in via ticker.cyclical === true; no-op otherwise).
 *
 * For strongly cyclical names (memory, commodities, shipping), record-high margins
 * depress forward P/E (peak EPS in the denominator), which the base pricingScore
 * misreads as "cheap" — the classic value trap. This adjustment RAISES pricingScore
 * (toward expensive/late-cycle) when the value-trap signature is present, so the
 * funnel does not wave a peak-cycle cyclical through on a mirage low forward P/E.
 *
 * Signal 1 (primary, industry-agnostic): trailingPE / forwardPE >= 2 means the market
 *   prices forward EPS to surge — a low forward P/E built on peak-cycle earnings.
 * Signal 2 (confirmation): gross margin at/above the ticker's cyclical-peak threshold.
 *
 * Returns a delta in [0, 1.5] added to pricingScore (clamped 1-5 by the caller).
 */
function cyclicalTrapAdjustment(ticker, quote, summary) {
  if (!ticker.cyclical) return { applied: false, delta: 0, reasons: [] };

  const fwdPE = summary?.defaultKeyStatistics?.forwardPE;
  const trailPE = quote?.trailingPE ?? summary?.defaultKeyStatistics?.trailingPE ?? null;
  const grossMargin = summary?.financialData?.grossMargins; // decimal, e.g. 0.74
  const peakGM = ticker.cyclicalPeakGM ?? 0.60;

  const reasons = [];
  let delta = 0;

  if (fwdPE != null && trailPE != null && fwdPE > 0 && trailPE > 0 && trailPE / fwdPE >= 2) {
    delta += 1.0;
    reasons.push(`trailPE/fwdPE ${(trailPE / fwdPE).toFixed(1)}x — forward EPS priced to surge; low fwdPE is a peak-cycle value trap`);
  }
  if (grossMargin != null && grossMargin >= peakGM) {
    delta += 0.5;
    reasons.push(`grossMargin ${(grossMargin * 100).toFixed(0)}% >= cyclical-peak ${(peakGM * 100).toFixed(0)}%`);
  }

  return { applied: delta > 0, delta: Math.round(delta * 10) / 10, reasons };
}

/**
 * Determine funnel pass/fail.
 */
function evaluateFunnel(ticker, pricingScore) {
  const { physicalConstraint, aiContribution, timeToRealize, moatCapture } = ticker;
  const reasons = [];
  const warnings = [];

  // Defensibility gate (Guo 2026 moat thesis): survives commoditization via a
  // PHYSICAL chokepoint OR a non-physical moat — either suffices. moatCapture
  // absent (not yet assessed) => 0 => falls back to the physical gate alone.
  const moat = typeof moatCapture === 'number' ? moatCapture : 0;
  if (physicalConstraint < 4 && moat < 4) {
    reasons.push(`defensibility: physicalConstraint ${physicalConstraint} < 4 AND moatCapture ${moatCapture ?? 'n/a'} < 4`);
  }
  // Supplier-trap WARNING (not a fail): the moat accrues upstream (component
  // vendor) or downstream (customer/incumbent), not to this ticker.
  if (typeof moatCapture === 'number' && moatCapture <= 2) {
    warnings.push(`supplier-trap: moatCapture ${moatCapture} — moat accrues to incumbent/customer, ticker is a replaceable vendor`);
  }
  if (aiContribution < 0.30) reasons.push(`aiContribution ${aiContribution} < 0.30`);
  if (timeToRealize === 'far') reasons.push('timeToRealize = far');
  if (pricingScore != null && pricingScore > 3) reasons.push(`pricingScore ${pricingScore} > 3`);
  if (pricingScore == null) reasons.push('pricingScore unavailable');

  return { pass: reasons.length === 0, failReasons: reasons, warnings };
}

async function main() {
  const universe = JSON.parse(fs.readFileSync(UNIVERSE_PATH, 'utf8'));
  const { benchmarks } = JSON.parse(fs.readFileSync(BENCHMARKS_PATH, 'utf8'));

  const activeTickers = universe.tickers.filter(
    (t) => t.status === 'active' || t.status === 'watchlist'
  );

  console.log(`[ProphetMap] Fetching valuations for ${activeTickers.length} tickers...`);

  // Fetch SPY 6-month return first
  console.log('[ProphetMap] Fetching SPY 6m return...');
  const spy6m = await get6mReturn('SPY');
  await sleep(RATE_LIMIT_MS);

  const results = [];
  const errors = [];

  for (const ticker of activeTickers) {
    const sym = ticker.symbol;
    process.stdout.write(`  ${sym}... `);

    try {
      // Serialize to avoid Yahoo Finance rate-limit on concurrent requests
      const quote = await yahooFinance.quote(sym);
      await sleep(RATE_LIMIT_MS);
      const summary = await yahooFinance.quoteSummary(sym, {
        modules: ['defaultKeyStatistics', 'financialData', 'recommendationTrend'],
      });
      await sleep(RATE_LIMIT_MS);
      const return6m = await get6mReturn(sym);
      await sleep(RATE_LIMIT_MS);

      const layerBenchmarks = benchmarks[ticker.layer] || benchmarks.default;
      const { pricingScore, components, dataQuality } = computePricingScore(
        quote, summary, return6m, spy6m, layerBenchmarks
      );

      // Cyclical value-trap gate: raises pricingScore for peak-cycle cyclicals
      // whose low forward P/E (peak EPS denominator) misreads as "cheap".
      const cyclicalTrap = cyclicalTrapAdjustment(ticker, quote, summary);
      const effectivePricingScore = pricingScore != null
        ? Math.round(clamp(pricingScore + cyclicalTrap.delta, 1, 5) * 10) / 10
        : null;

      const funnel = evaluateFunnel(ticker, effectivePricingScore);

      const numAnalysts = summary?.financialData?.numberOfAnalystOpinions ?? null;
      const recommendMean = summary?.financialData?.recommendationMean ?? null;
      const pegRaw = summary?.defaultKeyStatistics?.pegRatio ?? null;
      const pegRatio = pegRaw != null && isFinite(pegRaw) ? Math.round(pegRaw * 100) / 100 : null;
      const pegBand = pegRatio == null ? 'N/A'
        : pegRatio <= 1.0 ? 'cheap'
        : pegRatio <= 1.5 ? 'fair'
        : pegRatio <= 2.5 ? 'rich'
        : 'overpriced';

      results.push({
        symbol: sym,
        layer: ticker.layer,
        physicalConstraint: ticker.physicalConstraint,
        aiContribution: ticker.aiContribution,
        timeToRealize: ticker.timeToRealize,
        moatCapture: ticker.moatCapture ?? null,
        moatLocks: ticker.moatLocks ?? null,
        price: quote?.regularMarketPrice ?? null,
        marketCap: quote?.marketCap ? Math.round(quote.marketCap / 1e9) : null,
        pricingScore: effectivePricingScore,
        rawPricingScore: pricingScore,
        cyclicalTrap: cyclicalTrap.applied ? cyclicalTrap : null,
        pegRatio,
        pegBand,
        funnelPass: funnel.pass,
        funnelFailReasons: funnel.failReasons,
        funnelWarnings: funnel.warnings,
        components,
        dataQuality,
        analystRecommendMean: recommendMean,
        numberOfAnalysts: numAnalysts,
        fetchedAt: new Date().toISOString(),
      });

      const passLabel = funnel.pass ? '✅ PASS' : '  ----';
      const trapLabel = cyclicalTrap.applied ? ` ⚠cyclical+${cyclicalTrap.delta} (raw ${pricingScore})` : '';
      console.log(`${passLabel} (pricing=${effectivePricingScore ?? 'N/A'}${trapLabel}, peg=${pegRatio ?? 'N/A'} [${pegBand}], dq=${dataQuality})`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      errors.push({ symbol: sym, error: err.message });
      await sleep(RATE_LIMIT_MS);
    }
  }

  // Sort: funnel passes first, then by pricingScore ascending (most opportunity first)
  results.sort((a, b) => {
    if (a.funnelPass !== b.funnelPass) return a.funnelPass ? -1 : 1;
    return (a.pricingScore ?? 99) - (b.pricingScore ?? 99);
  });

  const output = {
    date: today(),
    spy6mReturn: spy6m != null ? Math.round(spy6m * 1000) / 10 : null,
    funnelPassCount: results.filter((r) => r.funnelPass).length,
    totalFetched: results.length,
    errors,
    results,
  };

  if (!fs.existsSync(SCORES_DIR)) fs.mkdirSync(SCORES_DIR, { recursive: true });
  const outPath = path.join(SCORES_DIR, `${today()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\n[ProphetMap] ✅ Written to ${outPath}`);
  console.log(`[ProphetMap] Funnel passes: ${output.funnelPassCount} / ${results.length}`);
  if (errors.length > 0) console.log(`[ProphetMap] Errors: ${errors.map((e) => e.symbol).join(', ')}`);

  // Watchlist promotion check: flag tickers with pricingScore ≤ 2.5 for 5 consecutive trading days
  const watchlistSymbols = new Set(
    universe.tickers.filter((t) => t.status === 'watchlist').map((t) => t.symbol)
  );
  if (watchlistSymbols.size > 0) {
    const scoreFiles = fs.readdirSync(SCORES_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .slice(-5);

    const PROMOTION_THRESHOLD = 2.5;
    const CONSECUTIVE_DAYS = 5;
    const promotionCandidates = [];

    for (const sym of watchlistSymbols) {
      let consecutiveDays = 0;
      for (const file of scoreFiles) {
        try {
          const day = JSON.parse(fs.readFileSync(path.join(SCORES_DIR, file), 'utf8'));
          const entry = day.results?.find((r) => r.symbol === sym);
          if (entry?.pricingScore != null && entry.pricingScore <= PROMOTION_THRESHOLD) {
            consecutiveDays++;
          } else {
            consecutiveDays = 0;
          }
        } catch { consecutiveDays = 0; }
      }
      if (consecutiveDays >= CONSECUTIVE_DAYS) {
        const todayEntry = results.find((r) => r.symbol === sym);
        promotionCandidates.push({ symbol: sym, pricingScore: todayEntry?.pricingScore, days: consecutiveDays });
      }
    }

    if (promotionCandidates.length > 0) {
      console.log('\n[ProphetMap] ⬆ WATCHLIST PROMOTION CANDIDATES (pricing ≤ 2.5 for 5+ days):');
      for (const c of promotionCandidates) {
        console.log(`  ${c.symbol} — pricingScore ${c.pricingScore?.toFixed(1)} for ${c.days} consecutive days`);
        console.log(`  Action: set status="active" in universe.json to begin signal analysis`);
      }
      // Emit for GitHub Actions annotation
      process.stdout.write(`\n::notice::Watchlist promotion candidates: ${promotionCandidates.map((c) => c.symbol).join(', ')}\n`);
    }
  }
}

main().catch((err) => {
  console.error('[ProphetMap] Fatal:', err);
  process.exit(1);
});
