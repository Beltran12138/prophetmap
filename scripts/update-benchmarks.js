/**
 * update-benchmarks.js
 *
 * Auto-computes sector median Forward P/E and EV/Revenue for each layer
 * by fetching live data for all universe tickers, then writes computed
 * values back into data/sector-benchmarks.json.
 *
 * Run: node scripts/update-benchmarks.js
 * Cadence: weekly via GitHub Actions (Mondays before market open)
 *
 * Sample = declared `peers` (EXTERNAL comparables) UNION universe members of the
 * layer, deduped. Using universe members alone is self-referential: the holdings
 * define what "normal valuation" is, so a layer cannot look expensive relative to
 * itself. Worse, a layer with a single universe member produced a median equal to
 * that member, pinning its forwardPE and evRevenue deviations at 0 (score 3) —
 * 55% of its pricingScore carried no information at all. The `peers` field was
 * declared for exactly this purpose but was never read until 2026-07-28.
 *
 * Falls back to existing static value if fewer than 2 data points available.
 * `_degenerate: true` is written when the live sample is under 3 — the median is
 * then too thin to anchor a pricing deviation and should be treated as advisory.
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });
const fs = require('fs');
const path = require('path');

const UNIVERSE_PATH = path.join(__dirname, '../data/universe.json');
const BENCHMARKS_PATH = path.join(__dirname, '../data/sector-benchmarks.json');
const RATE_LIMIT_MS = 450;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function median(arr) {
  const clean = arr.filter((v) => v != null && isFinite(v) && v > 0);
  if (clean.length === 0) return null;
  clean.sort((a, b) => a - b);
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 === 0
    ? Math.round(((clean[mid - 1] + clean[mid]) / 2) * 10) / 10
    : Math.round(clean[mid] * 10) / 10;
}

async function fetchKeyRatios(symbol) {
  try {
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: ['defaultKeyStatistics'],
    });
    return {
      forwardPE: summary?.defaultKeyStatistics?.forwardPE ?? null,
      evRevenue: summary?.defaultKeyStatistics?.enterpriseToRevenue ?? null,
    };
  } catch {
    return { forwardPE: null, evRevenue: null };
  }
}

async function main() {
  const universe = JSON.parse(fs.readFileSync(UNIVERSE_PATH, 'utf8'));
  const benchmarksFile = JSON.parse(fs.readFileSync(BENCHMARKS_PATH, 'utf8'));

  // Group active/watchlist tickers by layer
  const byLayer = {};
  for (const t of universe.tickers) {
    if (t.status === 'experimental') continue;
    if (!byLayer[t.layer]) byLayer[t.layer] = [];
    byLayer[t.layer].push(t.symbol);
  }

  // Compute for every layer that has a benchmark entry, not just layers that
  // currently hold universe members — otherwise a layer whose members were all
  // demoted keeps a stale median indefinitely.
  const layers = [...new Set([
    ...Object.keys(benchmarksFile.benchmarks).filter((k) => k !== 'default'),
    ...Object.keys(byLayer),
  ])];
  console.log(`[ProphetMap] Computing benchmarks for ${layers.length} layers...`);

  let updatedCount = 0;

  for (const layerId of layers) {
    // External peers first, then universe members — deduped. See header note on
    // why universe-only sampling is self-referential.
    const declaredPeers = benchmarksFile.benchmarks[layerId]?.peers || [];
    const symbols = [...new Set([...declaredPeers, ...(byLayer[layerId] || [])])];
    if (symbols.length === 0) {
      console.log(`  ${layerId}... no peers and no universe members, skipping`);
      continue;
    }
    process.stdout.write(`  ${layerId} (${symbols.join(', ')})... `);

    const ratios = [];
    for (const sym of symbols) {
      const r = await fetchKeyRatios(sym);
      ratios.push(r);
      await sleep(RATE_LIMIT_MS);
    }

    const forwardPEs = ratios.map((r) => r.forwardPE);
    const evRevenues = ratios.map((r) => r.evRevenue);

    const computedPE = median(forwardPEs);
    const computedEVR = median(evRevenues);

    const existing = benchmarksFile.benchmarks[layerId];
    if (!existing) {
      console.log('no benchmark entry, skipping');
      continue;
    }

    let changed = false;
    if (computedPE != null) {
      existing.medianForwardPE = computedPE;
      existing._computedForwardPE = computedPE;
      changed = true;
    }
    if (computedEVR != null) {
      existing.medianEVRevenue = computedEVR;
      existing._computedEVRevenue = computedEVR;
      changed = true;
    }

    if (changed) {
      existing._lastComputed = new Date().toISOString().slice(0, 10);
      existing._sampleSize = ratios.filter((r) => r.forwardPE != null || r.evRevenue != null).length;
      // A median over fewer than 3 live points cannot anchor a deviation — flag it
      // rather than letting it silently drive 55% of every pricingScore in the layer.
      existing._degenerate = existing._sampleSize < 3 || undefined;
      updatedCount++;
      const warn = existing._degenerate ? ' ⚠ DEGENERATE (<3 samples)' : '';
      console.log(`PE=${computedPE ?? 'N/A'}, EV/R=${computedEVR ?? 'N/A'} (n=${existing._sampleSize})${warn}`);
    } else {
      console.log('no data — kept static values');
    }
  }

  benchmarksFile._meta.lastUpdated = new Date().toISOString().slice(0, 10);
  benchmarksFile._meta.lastComputedBy = 'update-benchmarks.js';

  fs.writeFileSync(BENCHMARKS_PATH, JSON.stringify(benchmarksFile, null, 2));
  console.log(`\n[ProphetMap] ✅ Updated ${updatedCount}/${layers.length} layers in sector-benchmarks.json`);
}

main().catch((err) => {
  console.error('[ProphetMap] Fatal:', err);
  process.exit(1);
});
