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
 * Funnel pass: (physicalConstraint >= 4 OR moatCapture >= 4)
 *              AND aiContribution >= 0.30 AND timeToRealize != "far"
 *              AND the pricing gate below
 *              (pricingScore here is the cyclical-trap-adjusted "effective" score)
 *
 * Pricing gate has HYSTERESIS (added 2026-07-28): enter a pass at <= 2.8, lose an
 *   existing pass only above 3.2. The old hard cut at 3.0 made borderline names
 *   flip repeatedly — LITE crossed it 6 times in 16 sessions in July 2026 — which
 *   made any single-day PASS record unusable as an audit trail. Scores inside the
 *   band carry inHysteresisBand=true and a warning: state is held over from the
 *   prior session, it is not a fresh signal.
 *
 * realizationCheck (added 2026-07-28, v2.8.0): ZERO WEIGHT, no gate reads it.
 *   The funnel's aiContribution gate is a share of FORWARD revenue growth — i.e. it
 *   is denominated in analyst expectation, not in delivered revenue. Backlog, capex
 *   guidance and order books are all the same species: an intent number. This block
 *   surfaces the two legs that separate intent from delivery, so a name can never
 *   again pass on expectation alone without that being visible:
 *     - estimateRevision: is the expectation itself being marked up or down (90d)?
 *     - surpriseHitRate:  historically, did this issuer actually deliver on it?
 *   Fetched in a SEPARATE, failure-swallowing request — the earnings modules fail
 *   schema validation for loss-makers and took OKLO/SPCX/LINK down entirely when
 *   bundled into the main call. A zero-weight diagnostic must not be able to fail a
 *   ticker. See CHANGELOG v2.8.0 for why this is surfacing-only and not a gate.
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

// Separate client for the zero-weight realizationCheck modules only. Yahoo omits
// epsActual/epsEstimate/surprisePercent for loss-making and pre-revenue issuers, which
// fails the library's schema and throws — so this client keeps the validator quiet and
// the caller recovers the raw payload from err.result. Kept apart from the main client
// so no gate-feeding field is ever read from an unvalidated response.
const yahooLenient = new YahooFinance({
  suppressNotices: ['ripHistorical', 'yahooSurvey'],
  validation: { logErrors: false },
});
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
      // Daily bars, not '1mo'. Yahoo labels a monthly bar with the month start and
      // closes it at month end, so period1 = "six months ago today" was snapping the
      // anchor forward to the END of the following month: measured 2026-07-28, GLW's
      // "6-month" return ran from the 2026-02 month-end close, a 5-month window. The
      // window length therefore oscillated between 5 and 6 months with the day of the
      // month. Consistent across tickers and against SPY, so the relative comparison
      // survived — but a field named 6m must measure 6m, and the anchor moving on its
      // own schedule is the kind of drift that shows up later as an unexplained
      // regime change in the momentum component.
      interval: '1d',
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

  if (totalWeight === 0) {
    return { pricingScore: null, components: scores, dataQuality: 'insufficient', totalWeight: 0 };
  }

  // Rescale to full weight
  const pricingScore = Math.round((weightedSum / totalWeight) * 10) / 10;
  const dataQuality = totalWeight >= 0.75 ? 'good' : totalWeight >= 0.5 ? 'partial' : 'low';

  return { pricingScore, components: scores, dataQuality, totalWeight };
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
 * Pricing applicability gate (v2.9.0). GATING — an inapplicable pricing dimension
 * FAILS the funnel.
 *
 * pricingScore is a composite of four equity-market ratios. For some universe
 * members those ratios do not merely read badly — they do not exist. Scoring them
 * anyway emits a number that looks like a measurement and is not one, and that
 * number was deciding funnel state: on 2026-07-28 LINK's only fail reason was
 * `pricingScore 3.8 > 3.2 (exit threshold)`, and that 3.8 was built from two
 * components (EV/Revenue 25% + momentum 20%) rescaled to full weight.
 *
 * For crypto members it was worse than thin — it was the wrong asset. This script
 * passes the bare universe symbol to Yahoo, which resolves it against the US
 * equity/ETF namespace. Verified 2026-07-28:
 *   LINK  declared Chainlink  ($9B)   -> Interlink Electronics, a $74M NasdaqCM microcap
 *   ETH   declared Ethereum   ($310B) -> Grayscale Ethereum Mini Trust ETF
 *   TAO   declared Bittensor          -> Invesco China Real Estate ETF
 *   FIL, RNDR                         -> no fundamentals / no quote (failed loudly — safe)
 * The first three are the dangerous class: a wrong answer that validates. There is
 * no safe naive repair inside this script either — `TAO-USD` resolves to "Together
 * As One", not Bittensor.
 *
 * The correct crypto pricing path ALREADY EXISTS: `update-crypto-valuations.js`
 * runs immediately after this script in CI, prices L_DCOMP members off CoinGecko +
 * DeFiLlama via the `coingeckoId` already declared in universe.json, and merges its
 * rows in. It deduplicates on line 318 with
 *   base.results = base.results.filter((r) => r.assetClass !== 'crypto')
 * — and that filter has never matched anything, because THIS script never wrote an
 * `assetClass` field. Net effect in the committed record: `data/scores/2026-07-28.json`
 * as produced by CI carried TWO rows for LINK (one at $4.55 = Interlink Electronics,
 * one at $8.40 = Chainlink) and two for ETH ($18.31 Grayscale ETF, $1919.63 Ethereum),
 * with funnelPassCount counting across both. Every row now carries assetClass so the
 * dedupe works, and crypto rows written here are deliberate placeholders that the
 * crypto script replaces.
 *
 * Policy: inapplicable => the pricing gate fails. "We cannot price this" must never
 * collapse into "this is attractively priced", and the recorded reason must be the
 * honest one rather than a fabricated numeric comparison.
 */
const PRICING_MIN_WEIGHT = 0.55; // fwdPE(0.30) + EV/Rev(0.25); under this the composite is a stub

function assessPricingApplicability(ticker, components, totalWeight) {
  if (ticker.assetClass === 'crypto') {
    return {
      applicable: false,
      reason:
        'crypto asset — forward P/E, EV/Revenue and analyst price targets do not exist for a token, '
        + 'and the bare symbol resolves against the US equity/ETF namespace '
        + '(verified 2026-07-28: LINK→Interlink Electronics, ETH→Grayscale ETF, TAO→Invesco China Real Estate ETF). '
        + 'Price via coingeckoId, not this pipeline.',
    };
  }

  const fwdPE = components?.forwardPE?.value;
  const evr = components?.evRevenue?.value;
  if (!((fwdPE != null && fwdPE > 0) || (evr != null && evr > 0))) {
    return {
      applicable: false,
      reason:
        'no fundamental anchor — neither a positive forward P/E nor an EV/Revenue ratio; '
        + 'any score would rest entirely on analyst targets and price momentum',
    };
  }

  if (totalWeight != null && totalWeight < PRICING_MIN_WEIGHT) {
    return {
      applicable: false,
      reason:
        `component coverage ${Math.round(totalWeight * 100)}% < ${Math.round(PRICING_MIN_WEIGHT * 100)}% — `
        + 'the composite is a rescaled stub, not a four-factor score',
    };
  }

  return { applicable: true, reason: null };
}

/**
 * Derating signature (v2.9.0). SURFACING ONLY — zero weight, no gate reads it.
 *
 * The mistake this encodes: on 2026-07-28 GLW fell 15.6% on an earnings beat while
 * `momentum6m` read -28.1% vs SPY, consensus +1y EPS had been revised UP 8.9% in 90
 * days, and the company had beaten four quarters straight. That combination was read
 * here as "the market is discounting terminal value" — the CPO architecture thesis
 * breaking. It was wrong. GLW ran $90.67 (2025-12-29) -> intraday record $271.78
 * (2026-06-29) -> $120.89: a -55.7% drawdown that is still +117.5% over twelve
 * months. Nothing was being derated; a parabola was deflating.
 *
 * `momentum6m` cannot separate those because it compares two endpoints, and the whole
 * distinction lives in the path between them. This adds the path term (drawdown from
 * the 52-week high) and the longer endpoint (52-week change):
 *
 *   momentum-unwind        deep drawdown BUT still up over 12m — giving back a prior
 *                          advance; says nothing about the thesis
 *   architectural-derating deep drawdown AND flat/down over 12m AND estimates rising
 *                          AND the company beating — the market is rejecting an
 *                          earnings stream it is simultaneously marking up, which can
 *                          only be a claim about the years beyond the estimate horizon
 *
 * Not a gate, deliberately: the rule has zero validated observations, and its first
 * draft would have fired on GLW today and been wrong. Calibrate on live cases before
 * letting it move the PASS set. Both inputs come from modules already fetched — this
 * costs no additional requests.
 */
const DERATING_DRAWDOWN = -0.30;

function computeDeratingSignature(quote, summary, realizationCheck) {
  const ddPct = quote?.fiftyTwoWeekHighChangePercent;              // decimal, negative
  const chg52w = summary?.defaultKeyStatistics?.['52WeekChange'];  // decimal
  if (ddPct == null || !isFinite(ddPct)) return null;

  const rev = realizationCheck?.estimateRevision;
  const hit = realizationCheck?.surpriseHitRate;
  const estimatesRising = rev?.direction === 'up' && rev?.meaningful === true;
  const delivering = hit != null && hit.hitRate >= 0.5;

  let signature = 'none';
  if (ddPct <= DERATING_DRAWDOWN) {
    if (chg52w == null) signature = 'drawdown-unclassified';
    else if (chg52w > 0) signature = 'momentum-unwind';
    else if (estimatesRising && delivering) signature = 'architectural-derating';
    else signature = 'drawdown-unclassified';
  }

  return {
    signature,
    drawdownFrom52wHigh: Math.round(ddPct * 1000) / 10,
    change52w: chg52w != null ? Math.round(chg52w * 1000) / 10 : null,
    estimatesRising,
    delivering,
    note:
      signature === 'momentum-unwind'
        ? 'deep drawdown but positive 12m return — unwinding a prior advance, NOT evidence of a broken thesis'
        : signature === 'architectural-derating'
        ? 'down over 12m while estimates rise and the company beats — market is discounting beyond the estimate horizon; re-read this ticker\'s thesisFalsification entries'
        : null,
  };
}

/**
 * Expectation-vs-delivery diagnostic. SURFACING ONLY — returns a record, never a
 * score, and no gate reads it.
 *
 * Why it exists: every structural field the funnel gates on is forward-looking.
 * `aiContribution` is a share of FORWARD revenue growth; the pricing score leans on
 * forward P/E and analyst target prices. All of it is intent, and intent is the
 * cheapest thing in an investment cycle to produce. This block records the two
 * checks that intent cannot fake:
 *
 *   estimateRevision — the +1y consensus EPS now vs 90 days ago. Rising means the
 *     expectation embedded in every other field is being marked UP; falling means the
 *     denominator of aiContribution is quietly shrinking while the static, hand-set
 *     aiContribution value in universe.json stays put. That silent divergence is the
 *     exact failure mode this is here to expose.
 *   surpriseHitRate — of the last four reported quarters, how many beat consensus,
 *     and by how much on average. A long run of misses under a rising revision trend
 *     is the classic late-cycle signature.
 *
 * Deliberate limitation: Yahoo exposes a revision history for EPS (`epsTrend`) but
 * not for revenue, so the revision leg is EPS-based while `aiContribution` is
 * revenue-denominated. It is a proxy, and is labelled as one — do not read it as a
 * direct revenue-guidance delta.
 */
function computeRealizationCheck(summary) {
  const trend = summary?.earningsTrend?.trend || [];
  const history = summary?.earningsHistory?.history || [];

  // Revision leg: +1y is the horizon the funnel's mid/near timeToRealize implies.
  //
  // A percentage change is only meaningful when BOTH endpoints are positive EPS of
  // some size. Off a loss-making or near-zero base the ratio explodes and reads as a
  // catastrophe that is not there — on 2026-07-28 ASTS printed -1836% and RKLB -471%
  // purely from a small negative base. Those are marked meaningful:false and carry
  // the raw endpoints instead, so a reader sees "-0.42 → -1.90 EPS" rather than a
  // fake percentage. Standard NM (not meaningful) convention.
  const MIN_MEANINGFUL_BASE = 0.25;
  let estimateRevision = null;
  const y1 = trend.find((t) => t.period === '+1y');
  const now = y1?.epsTrend?.current;
  const ago = y1?.epsTrend?.['90daysAgo'];
  if (now != null && ago != null && isFinite(now) && isFinite(ago) && ago !== 0) {
    const meaningful = ago >= MIN_MEANINGFUL_BASE && now > 0;
    estimateRevision = {
      horizon: '+1y',
      basis: 'eps',
      current: Math.round(now * 100) / 100,
      ago90d: Math.round(ago * 100) / 100,
      meaningful,
      changePct: meaningful ? Math.round(((now - ago) / ago) * 1000) / 10 : null,
      // Direction survives even when the ratio does not — a loss-maker being marked
      // deeper into loss is still information, just not a percentage.
      direction: now > ago ? 'up' : now < ago ? 'down' : 'flat',
    };
  }

  // Delivery leg: did the issuer actually clear the bar it was given?
  let surpriseHitRate = null;
  const reported = history
    .map((h) => h.surprisePercent)
    .filter((v) => v != null && isFinite(v));
  if (reported.length > 0) {
    const beats = reported.filter((v) => v > 0).length;
    const avg = reported.reduce((a, b) => a + b, 0) / reported.length;
    surpriseHitRate = {
      quarters: reported.length,
      beats,
      hitRate: Math.round((beats / reported.length) * 100) / 100,
      avgSurprisePct: Math.round(avg * 1000) / 10,
    };
  }

  if (estimateRevision == null && surpriseHitRate == null) return null;
  return { estimateRevision, surpriseHitRate };
}

/**
 * Determine funnel pass/fail.
 */
// Pricing-gate hysteresis. pricingScore is continuous and noisy day to day; a
// hard cut at 3.0 made borderline names flip PASS/FAIL repeatedly (LITE crossed
// it 6 times in 16 sessions during July 2026). Any single-day PASS record is then
// meaningless — one can retroactively pick a date to support either conclusion,
// which directly contaminates the A/B discipline's requirement for timestamped
// PASS names. Asymmetric band: harder to enter than to stay.
const PRICING_ENTER = 2.8; // must be <= this to newly qualify
const PRICING_EXIT = 3.2;  // must exceed this to lose an existing pass

// PEG staleness detector (added 2026-07-30, v2.9.10). `pegRatio` below is Yahoo's
// PRECOMPUTED defaultKeyStatistics field, not a function of the live price this
// script already holds. Measured 2026-07-22 -> 07-29: of 49 tickers that moved
// more than 5%, 22 (45%) carried a byte-identical pegRatio. AMKR is the clearest
// case — price 60.30 -> 45.98 -> 44.27, forward P/E 23.0 -> 17.6 -> 15.5 (-33%),
// pegRatio 0.76 -> 0.76 -> 0.76, unchanged to the basis point. That is impossible
// for a live ratio. PEG is the holder's declared PRIMARY pricing indicator, so a
// frozen value is not a cosmetic defect; it silently freezes the decision rule.
//
// NOT claimed: any directional bias. Zero tickers rose more than 5% in that window,
// so the up-move sample is empty and the asymmetry was not testable.
//
// This flag does NOT gate anything. pegRatio feeds no funnel condition and no
// component of pricingScore — verified by grep across scripts/ and lib/ — so
// nothing here can move funnelPass. It marks the number as unusable for the day.
const PEG_STALE_PRICE_MOVE = 5.0; // percent move against the anchor that should have moved PEG

// Minimum growth rate below which PEG carries no information: the denominator
// approaches zero and the ratio diverges regardless of valuation. KTOS printed
// pegRatio 36.41 on 2026-07-29 and was banded "overpriced" alongside genuinely
// expensive names, which is a category error — it is not expensive, it is
// unmeasurable. Both council models (Grok, DeepSeek, 2026-07-30) proposed this
// same guard independently.
const PEG_MIN_GROWTH = 0.03;

function evaluateFunnel(ticker, pricingScore, previousPass, applicability) {
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

  // Pricing gate with hysteresis. Threshold depends on the prior state: a name
  // already passing keeps passing until it exceeds PRICING_EXIT; a name not
  // passing must reach PRICING_ENTER to qualify. Names inside the 2.8-3.2 band
  // are marked so the borderline state is visible rather than silently sticky.
  let inBand = false;
  if (applicability && applicability.applicable === false) {
    // Fail-closed. Hysteresis is deliberately not consulted: a name cannot coast on a
    // prior PASS that was itself granted on an inapplicable number.
    reasons.push(`pricing dimension not applicable — ${applicability.reason}`);
  } else if (pricingScore == null) {
    reasons.push('pricingScore unavailable');
  } else {
    const threshold = previousPass ? PRICING_EXIT : PRICING_ENTER;
    if (pricingScore > threshold) {
      reasons.push(
        `pricingScore ${pricingScore} > ${threshold}` +
        (previousPass ? ' (exit threshold — was passing)' : ' (entry threshold)')
      );
    }
    if (pricingScore > PRICING_ENTER && pricingScore <= PRICING_EXIT) {
      inBand = true;
      warnings.push(
        `pricing-hysteresis-band: ${pricingScore} sits in ${PRICING_ENTER}-${PRICING_EXIT}; ` +
        `state held at ${previousPass ? 'PASS' : 'FAIL'} from prior session — not a fresh signal`
      );
    }
  }

  return { pass: reasons.length === 0, failReasons: reasons, warnings, inHysteresisBand: inBand };
}

/**
 * Load the prior session's funnelPass state, used as the hysteresis anchor.
 * Reads the most recent scores file strictly BEFORE today, so re-running on the
 * same day is idempotent (it does not read its own output and ratchet itself).
 * Missing history => empty map => every ticker must clear the stricter entry
 * threshold, which is the correct conservative default.
 */
function loadPreviousFunnelState() {
  try {
    if (!fs.existsSync(SCORES_DIR)) return {};
    const todayFile = `${today()}.json`;
    const files = fs.readdirSync(SCORES_DIR)
      .filter((f) => f.endsWith('.json') && f < todayFile)
      .sort();
    if (files.length === 0) return {};
    const prev = JSON.parse(fs.readFileSync(path.join(SCORES_DIR, files[files.length - 1]), 'utf8'));
    const map = {};
    for (const r of prev.results || []) map[r.symbol] = r.funnelPass === true;
    console.log(`[ProphetMap] Hysteresis anchor: ${files[files.length - 1]} (${Object.keys(map).length} tickers)`);
    return map;
  } catch (err) {
    console.log(`[ProphetMap] Could not load previous funnel state (${err.message}) — using entry threshold for all`);
    return {};
  }
}

/**
 * Prior-session PEG and price, keyed by symbol — the anchor the staleness check
 * compares against. Reads the same file loadPreviousFunnelState() reads, in a
 * separate pass on purpose: the hysteresis anchor is load-bearing for funnelPass
 * and is deliberately not refactored to carry a second payload.
 */
function loadPreviousPegAnchor() {
  try {
    if (!fs.existsSync(SCORES_DIR)) return {};
    const todayFile = `${today()}.json`;
    const files = fs.readdirSync(SCORES_DIR)
      .filter((f) => f.endsWith('.json') && f < todayFile)
      .sort();
    if (files.length === 0) return {};
    const file = files[files.length - 1];
    const prev = JSON.parse(fs.readFileSync(path.join(SCORES_DIR, file), 'utf8'));
    const map = {};
    for (const r of prev.results || []) {
      map[r.symbol] = { peg: r.pegRatio ?? null, price: r.price ?? null, date: prev.date ?? file.replace('.json', '') };
    }
    return map;
  } catch (err) {
    console.log(`[ProphetMap] Could not load previous PEG anchor (${err.message}) — staleness undetectable this run`);
    return {};
  }
}

/**
 * PEG recomputed from the live price this script already holds, as a DIAGNOSTIC
 * ONLY. It is emitted alongside Yahoo's pegRatio and deliberately does NOT replace
 * it, and deliberately carries NO band.
 *
 * Why not replace: measured 2026-07-30 across MU / AMKR / NVDA / QCOM / GOOG / KTOS,
 * this value diverges from Yahoo's by -97% to +1505%. It is a DIFFERENT METRIC, not
 * a repaired one — Yahoo's pegRatio could not be reproduced from any obtainable
 * field, so its growth denominator is unknown. The holder's decision bands
 * (1.0 / 1.5 / 2.5) are calibrated to Yahoo's scale. Swapping the number underneath
 * those bands would re-rate the entire book silently, which is exactly what the
 * v2.8.0 peer rule prohibits. Re-banding requires a historical distribution study
 * and is a framework decision, not an engineering one.
 *
 * Denominator: the textbook PEG uses a long-term (+5y) growth estimate. Yahoo
 * returned NULL for `+5y` on EVERY ticker tested on 2026-07-30, so +1y is the only
 * obtainable rate and the basis is recorded per-ticker so the two are never confused.
 *
 * MEASURED BEHAVIOUR, 2026-07-30 dry run — two of four known PEG failure modes are
 * fixed and two are NOT. Recorded as measured, not as intended:
 *   #1 MU peak-cycle EPS  — NOT FIXED, made worse. Yahoo 0.13, self 0.04; both
 *      "cheap", both on the same peak-EPS denominator. cyclicalTrap catches this,
 *      PEG does not, in any formulation.
 *   #2 KTOS denominator   — NOT FIXED, INVERTED. Yahoo 36.41 "overpriced", self 0.99
 *      "cheap". The growth floor does NOT fire here: +1y growth is 40.5%, well clear
 *      of it. KTOS's distortion lives in trailing EPS of 0.15 against forward 1.09,
 *      a 7x jump off a near-zero base, which neither ratio expresses. Yahoo's number
 *      at least reads as an outlier; the self-computed one reads as a buy.
 *   #3 QCOM shrinking rev — FIXED. Yahoo 0.51 "cheap" on revenue contracting 3.5%
 *      YoY; self returns null because +1y growth is 1.7%, under the floor.
 *   #4 staleness          — FIXED by construction; the value is a function of the
 *      live price.
 * NOTE ON THE FLOOR: both council models (2026-07-30) proposed PEG_MIN_GROWTH
 * independently and both proposed it to catch KTOS. On measurement it catches QCOM
 * and not KTOS. The guard is worth keeping — it is doing real work — but it is not
 * doing the work it was designed for, and that is recorded rather than tidied away.
 * ALSO: GOOG, a core holding, returns null (expected contraction, +1y growth
 * -28.5%). Correct behaviour for a ratio undefined on negative growth, but it means
 * this diagnostic is silent on some of the largest positions.
 */
function computeSelfPeg(quote, summary, earningsSummary) {
  const price = quote?.regularMarketPrice ?? null;
  const fwdEps = summary?.defaultKeyStatistics?.forwardEps ?? quote?.epsForward ?? null;
  const trend = earningsSummary?.earningsTrend?.trend ?? [];
  const ltgRaw = trend.find((t) => t.period === '+5y')?.growth ?? null;
  const g1yRaw = trend.find((t) => t.period === '+1y')?.growth ?? null;

  const ltg = ltgRaw != null && isFinite(ltgRaw) ? ltgRaw : null;
  const g1y = g1yRaw != null && isFinite(g1yRaw) ? g1yRaw : null;
  const growth = ltg ?? g1y;
  const basis = ltg != null ? '+5y' : (g1y != null ? '+1y' : null);

  if (price == null || fwdEps == null || fwdEps <= 0) {
    return { value: null, basis, reason: 'forward EPS unavailable or non-positive' };
  }
  if (growth == null) return { value: null, basis: null, reason: 'no analyst growth estimate available' };
  if (growth <= 0) {
    return { value: null, basis, reason: `growth ${(growth * 100).toFixed(1)}% <= 0 — PEG undefined for expected contraction` };
  }
  if (growth < PEG_MIN_GROWTH) {
    return { value: null, basis, reason: `growth ${(growth * 100).toFixed(1)}% < ${(PEG_MIN_GROWTH * 100).toFixed(0)}% — denominator near zero, ratio carries no information` };
  }

  const fwdPE = price / fwdEps;
  return { value: Math.round((fwdPE / (growth * 100)) * 100) / 100, basis, reason: null };
}

/**
 * Flags Yahoo's pegRatio as unusable for the day when it did not move through a
 * price move that must have moved it. Conservative by construction: it fires only
 * on byte-identical equality, so a PEG that moved even slightly is treated as live.
 */
function detectPegStale(pegRatio, price, anchor) {
  if (!anchor || anchor.peg == null || anchor.price == null || pegRatio == null || price == null) {
    return { stale: false, detail: null };
  }
  const pxDelta = (price / anchor.price - 1) * 100;
  if (Math.abs(pxDelta) < PEG_STALE_PRICE_MOVE) return { stale: false, detail: null };
  if (pegRatio !== anchor.peg) return { stale: false, detail: null };
  return {
    stale: true,
    detail:
      `pegRatio unchanged at ${pegRatio} while price moved ${pxDelta >= 0 ? '+' : ''}${pxDelta.toFixed(1)}% ` +
      `since ${anchor.date} (${anchor.price} -> ${price}) — Yahoo precomputed field has not refreshed; ` +
      `treat pegBand as unusable for this session`,
  };
}

async function main() {
  const universe = JSON.parse(fs.readFileSync(UNIVERSE_PATH, 'utf8'));
  const { benchmarks } = JSON.parse(fs.readFileSync(BENCHMARKS_PATH, 'utf8'));
  const previousFunnel = loadPreviousFunnelState();
  const pegAnchor = loadPreviousPegAnchor();

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

    // Crypto members never enter the equity pipeline. Not a rate-limit saving: the
    // bare symbol resolves to an unrelated US-listed security often enough that
    // fetching at all is what creates the wrong number. See assessPricingApplicability.
    if (ticker.assetClass === 'crypto') {
      const applicability = assessPricingApplicability(ticker, {}, 0);
      const funnel = evaluateFunnel(ticker, null, previousFunnel[sym] === true, applicability);
      results.push({
        symbol: sym,
        layer: ticker.layer,
        // REQUIRED: update-crypto-valuations.js dedupes on this field before merging
        // its own rows. Omitting it is what produced duplicate LINK/ETH rows.
        assetClass: 'crypto',
        physicalConstraint: ticker.physicalConstraint,
        constraintType: ticker.constraintType ?? null,
        aiContribution: ticker.aiContribution,
        timeToRealize: ticker.timeToRealize,
        moatCapture: ticker.moatCapture ?? null,
        moatLocks: ticker.moatLocks ?? null,
        price: null,
        marketCap: ticker.marketCap ?? null,
        pricingScore: null,
        rawPricingScore: null,
        pricingApplicable: false,
        pricingInapplicableReason: applicability.reason,
        cyclicalTrap: null,
        pegRatio: null,
        pegBand: 'N/A',
        funnelPass: funnel.pass,
        funnelFailReasons: funnel.failReasons,
        funnelWarnings: funnel.warnings,
        previousFunnelPass: previousFunnel[sym] ?? null,
        inHysteresisBand: false,
        realizationCheck: null,
        deratingSignature: null,
        components: {},
        dataQuality: 'not-applicable',
        analystRecommendMean: null,
        numberOfAnalysts: null,
        fetchedAt: new Date().toISOString(),
      });
      console.log('  ---- (pricing not applicable: crypto — skipped equity pipeline)');
      continue;
    }

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

      // Fetched SEPARATELY and swallowed on failure, deliberately. These modules fail
      // yahoo-finance2 schema validation for pre-revenue and loss-making names —
      // earningsHistory omits epsActual/surprisePercent, which the library treats as a
      // hard error. Bundled into the main quoteSummary call it took the whole ticker
      // down with it: OKLO, SPCX and LINK all dropped out of the run on 2026-07-28.
      // A zero-weight diagnostic must never be able to fail a ticker that the gates
      // would otherwise score. Costs one extra request per ticker.
      let earningsSummary = null;
      try {
        earningsSummary = await yahooLenient.quoteSummary(sym, {
          modules: ['earningsTrend', 'earningsHistory'],
        });
      } catch (err) {
        // FailedYahooValidationError carries the unvalidated payload on .result — the
        // missing fields are precisely the ones a loss-maker has no value for, and the
        // rest of the response is intact. Anything else degrades to null.
        earningsSummary = err?.name === 'FailedYahooValidationError' ? (err.result ?? null) : null;
      }
      await sleep(RATE_LIMIT_MS);

      const layerBenchmarks = benchmarks[ticker.layer] || benchmarks.default;
      const { pricingScore, components, dataQuality, totalWeight } = computePricingScore(
        quote, summary, return6m, spy6m, layerBenchmarks
      );

      // Applicability is judged BEFORE the score is allowed to gate anything.
      const applicability = assessPricingApplicability(ticker, components, totalWeight);

      // Cyclical value-trap gate: raises pricingScore for peak-cycle cyclicals
      // whose low forward P/E (peak EPS denominator) misreads as "cheap".
      const cyclicalTrap = cyclicalTrapAdjustment(ticker, quote, summary);
      const effectivePricingScore = pricingScore != null
        ? Math.round(clamp(pricingScore + cyclicalTrap.delta, 1, 5) * 10) / 10
        : null;

      const funnel = evaluateFunnel(ticker, effectivePricingScore, previousFunnel[sym] === true, applicability);

      const numAnalysts = summary?.financialData?.numberOfAnalystOpinions ?? null;
      const recommendMean = summary?.financialData?.recommendationMean ?? null;
      const pegRaw = summary?.defaultKeyStatistics?.pegRatio ?? null;
      const pegRatio = pegRaw != null && isFinite(pegRaw) ? Math.round(pegRaw * 100) / 100 : null;
      const pegBand = pegRatio == null ? 'N/A'
        : pegRatio <= 1.0 ? 'cheap'
        : pegRatio <= 1.5 ? 'fair'
        : pegRatio <= 2.5 ? 'rich'
        : 'overpriced';

      // Diagnostics only — neither gates anything. See computeSelfPeg / detectPegStale.
      const selfPeg = computeSelfPeg(quote, summary, earningsSummary);
      const pegStaleness = detectPegStale(pegRatio, quote?.regularMarketPrice ?? null, pegAnchor[sym]);

      const realizationCheck = computeRealizationCheck(earningsSummary);
      const deratingSignature = computeDeratingSignature(quote, summary, realizationCheck);

      results.push({
        symbol: sym,
        layer: ticker.layer,
        assetClass: ticker.assetClass ?? 'equity',
        physicalConstraint: ticker.physicalConstraint,
        constraintType: ticker.constraintType ?? null,
        aiContribution: ticker.aiContribution,
        timeToRealize: ticker.timeToRealize,
        moatCapture: ticker.moatCapture ?? null,
        moatLocks: ticker.moatLocks ?? null,
        price: quote?.regularMarketPrice ?? null,
        marketCap: quote?.marketCap ? Math.round(quote.marketCap / 1e9) : null,
        pricingScore: effectivePricingScore,
        rawPricingScore: pricingScore,
        pricingApplicable: applicability.applicable,
        pricingInapplicableReason: applicability.reason,
        cyclicalTrap: cyclicalTrap.applied ? cyclicalTrap : null,
        pegRatio,
        pegBand,
        pegStale: pegStaleness.stale,
        pegStaleDetail: pegStaleness.detail,
        pegSelf: selfPeg.value,
        pegSelfBasis: selfPeg.basis,
        pegSelfUnavailableReason: selfPeg.reason,
        funnelPass: funnel.pass,
        funnelFailReasons: funnel.failReasons,
        funnelWarnings: funnel.warnings,
        previousFunnelPass: previousFunnel[sym] ?? null,
        inHysteresisBand: funnel.inHysteresisBand === true,
        realizationCheck,
        deratingSignature,
        components,
        dataQuality,
        analystRecommendMean: recommendMean,
        numberOfAnalysts: numAnalysts,
        fetchedAt: new Date().toISOString(),
      });

      const passLabel = funnel.pass ? '✅ PASS' : '  ----';
      const trapLabel = cyclicalTrap.applied ? ` ⚠cyclical+${cyclicalTrap.delta} (raw ${pricingScore})` : '';
      const bandLabel = funnel.inHysteresisBand ? ' ~band' : '';
      const revObj = realizationCheck?.estimateRevision;
      const hit = realizationCheck?.surpriseHitRate;
      const revStr = revObj == null ? 'N/A'
        : revObj.meaningful ? `${revObj.changePct > 0 ? '+' : ''}${revObj.changePct}%`
        : `NM(${revObj.ago90d}→${revObj.current})`;
      const realLabel = revObj != null || hit != null
        ? `, rev90d=${revStr}, beats=${hit ? `${hit.beats}/${hit.quarters}` : 'N/A'}`
        : '';
      const sigLabel = deratingSignature && deratingSignature.signature !== 'none'
        ? `, sig=${deratingSignature.signature}(dd${deratingSignature.drawdownFrom52wHigh}%/12m${deratingSignature.change52w ?? '?'}%)`
        : '';
      const pegLabel = pegStaleness.stale
        ? ` !STALE(self=${selfPeg.value ?? 'n/a'})`
        : (selfPeg.value != null ? ` self=${selfPeg.value}` : '');
      console.log(`${passLabel}${bandLabel} (pricing=${effectivePricingScore ?? 'N/A'}${trapLabel}, peg=${pegRatio ?? 'N/A'} [${pegBand}]${pegLabel}${realLabel}, dq=${dataQuality}${sigLabel})`);
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
