/**
 * update-crypto-valuations.js
 *
 * Fetches on-chain metrics for L_DCOMP crypto assets from CoinGecko + DeFiLlama.
 * Computes crypto-native pricingScore and merges results into data/scores/YYYY-MM-DD.json.
 *
 * Pricing score components (each mapped to 1-5 scale, weights renormalized on missing data):
 *   35% — Market Cap / Protocol Revenue (P/Rev) vs L_DCOMP median
 *   35% — Market Cap / TVL (P/TVL) vs L_DCOMP median
 *   30% — 6-month price momentum vs ETH (inverted: outperformance = expensive)
 *
 * APIs used (no API keys required):
 *   CoinGecko free tier: api.coingecko.com/api/v3
 *   DeFiLlama: api.llama.fi
 */

const fs = require('fs');
const path = require('path');

const SCORES_DIR = path.join(__dirname, '../data/scores');
const UNIVERSE_PATH = path.join(__dirname, '../data/universe.json');
const RATE_LIMIT_MS = 8000; // CoinGecko free tier: aggressive delay between history calls

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── API helpers ────────────────────────────────────────────────────────────

async function cgFetch(endpoint) {
  const res = await fetch(`https://api.coingecko.com/api/v3${endpoint}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'prophetmap/1.1' },
  });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}: ${endpoint}`);
  return res.json();
}

async function llamaFetch(endpoint) {
  const res = await fetch(`https://api.llama.fi${endpoint}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`DeFiLlama HTTP ${res.status}: ${endpoint}`);
  return res.json();
}

// ─── Data fetchers ──────────────────────────────────────────────────────────

// Batch-fetch current market data for all crypto tickers in one CoinGecko call
async function fetchBatchMarketData(tickers) {
  const ids = tickers.map((t) => t.coingeckoId).join(',');
  try {
    const data = await cgFetch(
      `/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=20&page=1&sparkline=false`
    );
    const map = {};
    for (const coin of data) {
      map[coin.id] = {
        price: coin.current_price ?? null,
        marketCapUSD: coin.market_cap ?? null,
        volume24hUSD: coin.total_volume ?? null,
      };
    }
    return map;
  } catch (e) {
    console.warn(`  CoinGecko /markets batch failed: ${e.message}`);
    return {};
  }
}

async function fetchCryptoMetrics(ticker, batchMarket) {
  const m = {
    price: batchMarket[ticker.coingeckoId]?.price ?? null,
    marketCapUSD: batchMarket[ticker.coingeckoId]?.marketCapUSD ?? null,
    volume24hUSD: batchMarket[ticker.coingeckoId]?.volume24hUSD ?? null,
    priceChange6mPct: null,
    tvlUSD: null,
    annualRevenueUSD: null,
  };

  // 6-month price history for momentum (with 429 retry)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const hist = await cgFetch(`/coins/${ticker.coingeckoId}/market_chart?vs_currency=usd&days=180&interval=daily`);
      const prices = hist.prices ?? [];
      if (prices.length >= 2) {
        const now = prices[prices.length - 1][1];
        const ago = prices[0][1];
        if (ago > 0) m.priceChange6mPct = ((now - ago) / ago) * 100;
      }
      break;
    } catch (e) {
      if (e.message.includes('429') && attempt < 3) {
        console.warn(`    CoinGecko 429, waiting ${15 * attempt}s before retry ${attempt + 1}/3...`);
        await sleep(15000 * attempt);
      } else {
        console.warn(`    CoinGecko history: ${e.message}`);
        break;
      }
    }
  }
  await sleep(RATE_LIMIT_MS);

  // DeFiLlama TVL
  if (ticker.defiLlamaSlug) {
    try {
      const proto = await llamaFetch(`/protocol/${ticker.defiLlamaSlug}`);
      const chainTvls = proto.currentChainTvls ?? {};
      const sum = Object.values(chainTvls).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
      m.tvlUSD = sum > 0 ? sum : (proto.tvl ?? null);
    } catch (e) {
      console.warn(`    DeFiLlama TVL: ${e.message}`);
    }
    await sleep(RATE_LIMIT_MS);

    // DeFiLlama protocol fees → annualized revenue
    try {
      const fees = await llamaFetch(`/summary/fees/${ticker.defiLlamaSlug}?dataType=dailyFees`);
      const total30d = fees.total30d ?? null;
      if (total30d != null) m.annualRevenueUSD = total30d * (365 / 30);
    } catch (e) {
      console.warn(`    DeFiLlama fees: ${e.message}`);
    }
    await sleep(RATE_LIMIT_MS);
  }

  return m;
}

async function fetchEth6mReturn() {
  try {
    const hist = await cgFetch('/coins/ethereum/market_chart?vs_currency=usd&days=180&interval=daily');
    const prices = hist.prices ?? [];
    if (prices.length >= 2) {
      const now = prices[prices.length - 1][1];
      const ago = prices[0][1];
      if (ago > 0) return ((now - ago) / ago) * 100;
    }
  } catch {}
  return null;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function median(arr) {
  const s = [...arr].filter((v) => v != null && isFinite(v)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

// Deviation from median → 1-5 score (0% deviation = 3.0)
function devToScore(deviation) {
  return Math.min(5, Math.max(1, Math.round((3.0 + deviation * 1.5) * 10) / 10));
}

function computeScore(ticker, metrics, ethReturn, medians) {
  const scores = [];
  const weights = [];
  const components = {};

  // P/Rev component
  if (metrics.marketCapUSD && metrics.annualRevenueUSD > 0 && medians.pRev != null) {
    const pRev = metrics.marketCapUSD / metrics.annualRevenueUSD;
    const dev = (pRev - medians.pRev) / medians.pRev;
    const score = devToScore(dev);
    components.pRev = { value: Math.round(pRev), benchmark: Math.round(medians.pRev), score };
    scores.push(score);
    weights.push(0.35);
  }

  // P/TVL component
  if (metrics.marketCapUSD && metrics.tvlUSD > 0 && medians.pTvl != null) {
    const pTvl = metrics.marketCapUSD / metrics.tvlUSD;
    const dev = (pTvl - medians.pTvl) / medians.pTvl;
    const score = devToScore(dev);
    components.pTvl = { value: Math.round(pTvl * 100) / 100, benchmark: Math.round(medians.pTvl * 100) / 100, score };
    scores.push(score);
    weights.push(0.35);
  }

  // Momentum vs ETH component
  if (metrics.priceChange6mPct != null) {
    const relReturn = ticker.symbol === 'ETH' ? 0 : metrics.priceChange6mPct - (ethReturn ?? 0);
    // +50% outperformance → score 4.5 (expensive); -50% → score 1.5 (cheap relative momentum)
    const score = Math.min(5, Math.max(1, Math.round((3.0 + (relReturn / 50) * 1.5) * 10) / 10));
    components.momentum6m = {
      ownReturn: Math.round(metrics.priceChange6mPct * 10) / 10,
      ethReturn: ethReturn != null ? Math.round(ethReturn * 10) / 10 : null,
      relReturn: Math.round(relReturn * 10) / 10,
      score,
    };
    scores.push(score);
    weights.push(0.30);
  }

  if (!scores.length) return { pricingScore: null, components, dataQuality: 'no_data' };

  const totalW = weights.reduce((a, b) => a + b, 0);
  const raw = scores.reduce((sum, s, i) => sum + s * weights[i], 0) / totalW;
  const pricingScore = Math.round(raw * 100) / 100;
  const dataQuality = scores.length === 3 ? 'full' : scores.length === 2 ? 'partial' : 'minimal';

  return { pricingScore, components, dataQuality };
}

function evaluateFunnel(ticker, pricingScore) {
  const failReasons = [];
  if (ticker.physicalConstraint < 4) failReasons.push(`PC=${ticker.physicalConstraint}<4`);
  if (ticker.aiContribution < 0.30) failReasons.push(`AI=${Math.round(ticker.aiContribution * 100)}%<30%`);
  if (ticker.timeToRealize === 'far') failReasons.push('time=far');
  if (pricingScore == null || pricingScore > 3.0) failReasons.push(`pricing=${pricingScore ?? 'N/A'}>3.0`);
  return { pass: failReasons.length === 0, failReasons };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const universe = JSON.parse(fs.readFileSync(UNIVERSE_PATH, 'utf8'));
  const cryptoTickers = universe.tickers.filter(
    (t) => t.assetClass === 'crypto' && t.status === 'active'
  );

  if (!cryptoTickers.length) {
    console.log('[ProphetMap Crypto] No active crypto tickers.');
    return;
  }

  console.log(`[ProphetMap Crypto] Processing ${cryptoTickers.length} tickers: ${cryptoTickers.map((t) => t.symbol).join(', ')}`);

  // ETH 6m return as momentum reference (fetched before batch to avoid rate limit collision)
  process.stdout.write('  ETH 6m reference... ');
  const ethReturn = await fetchEth6mReturn();
  console.log(`${ethReturn?.toFixed(1) ?? 'N/A'}%`);
  await sleep(RATE_LIMIT_MS);

  // Batch-fetch current market data (1 API call for all tickers)
  process.stdout.write('  Batch market data... ');
  const batchMarket = await fetchBatchMarketData(cryptoTickers);
  await sleep(RATE_LIMIT_MS);
  console.log(`got ${Object.keys(batchMarket).length}/${cryptoTickers.length} tickers`);

  // Fetch 6m history + DeFiLlama per ticker (serialized, rate-limited)
  const metricsMap = {};
  for (const t of cryptoTickers) {
    process.stdout.write(`  ${t.symbol} history+llama... `);
    metricsMap[t.symbol] = await fetchCryptoMetrics(t, batchMarket);
    console.log('done');
  }

  // Compute L_DCOMP layer medians
  const pRevValues = cryptoTickers.map((t) => {
    const m = metricsMap[t.symbol];
    return m.marketCapUSD && m.annualRevenueUSD > 0 ? m.marketCapUSD / m.annualRevenueUSD : null;
  });
  const pTvlValues = cryptoTickers.map((t) => {
    const m = metricsMap[t.symbol];
    return m.marketCapUSD && m.tvlUSD > 0 ? m.marketCapUSD / m.tvlUSD : null;
  });

  const layerMedians = { pRev: median(pRevValues), pTvl: median(pTvlValues) };
  console.log(`\n[ProphetMap Crypto] L_DCOMP medians — P/Rev: ${layerMedians.pRev?.toFixed(0) ?? 'N/A'}, P/TVL: ${layerMedians.pTvl?.toFixed(2) ?? 'N/A'}`);

  // Score each ticker
  const results = [];
  for (const t of cryptoTickers) {
    const m = metricsMap[t.symbol];
    const { pricingScore, components, dataQuality } = computeScore(t, m, ethReturn, layerMedians);
    const funnel = evaluateFunnel(t, pricingScore);

    results.push({
      symbol: t.symbol,
      layer: t.layer,
      assetClass: 'crypto',
      physicalConstraint: t.physicalConstraint,
      aiContribution: t.aiContribution,
      timeToRealize: t.timeToRealize,
      price: m.price,
      marketCap: m.marketCapUSD ? Math.round(m.marketCapUSD / 1e9) : null,
      pricingScore,
      funnelPass: funnel.pass,
      funnelFailReasons: funnel.failReasons,
      components,
      dataQuality,
      analystRecommendMean: null,
      numberOfAnalysts: null,
      cryptoMetrics: {
        tvlUSD: m.tvlUSD ? Math.round(m.tvlUSD / 1e6) : null,
        annualRevenueUSD: m.annualRevenueUSD ? Math.round(m.annualRevenueUSD / 1e6) : null,
        volume24hUSD: m.volume24hUSD ? Math.round(m.volume24hUSD / 1e6) : null,
        priceChange6mPct: m.priceChange6mPct != null ? Math.round(m.priceChange6mPct * 10) / 10 : null,
      },
      fetchedAt: new Date().toISOString(),
    });

    const label = funnel.pass ? '✅ PASS' : '  ----';
    console.log(`${label} ${t.symbol} — pricing=${pricingScore ?? 'N/A'}, dq=${dataQuality}, failReasons=[${funnel.failReasons.join(', ')}]`);
  }

  // Merge into today's scores file (read-modify-write)
  if (!fs.existsSync(SCORES_DIR)) fs.mkdirSync(SCORES_DIR, { recursive: true });
  const outPath = path.join(SCORES_DIR, `${today()}.json`);

  let base = {
    date: today(),
    spy6mReturn: null,
    funnelPassCount: 0,
    totalFetched: 0,
    errors: [],
    results: [],
  };
  if (fs.existsSync(outPath)) {
    base = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  // Remove prior crypto entries (idempotent re-run)
  base.results = base.results.filter((r) => r.assetClass !== 'crypto');
  base.results.push(...results);
  base.funnelPassCount = base.results.filter((r) => r.funnelPass).length;
  base.totalFetched = base.results.length;

  fs.writeFileSync(outPath, JSON.stringify(base, null, 2));
  console.log(`\n[ProphetMap Crypto] ✅ Merged ${results.length} crypto entries into ${outPath}`);
  console.log(`[ProphetMap Crypto] Total funnel passes (equity + crypto): ${base.funnelPassCount} / ${base.totalFetched}`);
}

main().catch((err) => {
  console.error('[ProphetMap Crypto] Fatal:', err);
  process.exit(1);
});
