#!/usr/bin/env node
/**
 * ab-track.js — gate A running measurement against a FROZEN experiment.
 *
 * Why this file exists, stated plainly: `data/scores/` has been recording daily
 * funnelPass state since 2026-05-04, so the *outcome* data was never the missing
 * piece. What was missing was a frozen set of conditions to measure it against.
 * Between 2026-05-04 and 2026-08-14 all 87 tickers were added after the start,
 * physicalConstraint/moatCapture were edited 39 times inside the window, and
 * demoted tickers left the basket. Any number computed over that span carries
 * look-ahead, survivorship, and post-hoc re-scoring at once. See GOVERNANCE.md
 * Gap #13.
 *
 * So the rules are pre-registered in data/ab-track/frozen-YYYY-MM-DD.json and
 * this script only reads them. It does not choose a basket definition at runtime,
 * because choosing one after seeing returns is how a screen passes its own test.
 *
 *   node scripts/ab-track.js               running gate A since the freeze
 *   node scripts/ab-track.js --diagnostic  reproduce the CONTAMINATED pre-freeze
 *                                          measurement, labelled as unusable
 *
 * Reports |t| < 2 as NOT SIGNIFICANT rather than omitting it. A screen that only
 * publishes its favourable statistics is not under test.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCORES = path.join(ROOT, 'data', 'scores');
const ABDIR = path.join(ROOT, 'data', 'ab-track');

// ---------------------------------------------------------------- helpers

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function loadFrozen() {
  const files = fs.readdirSync(ABDIR).filter((f) => f.startsWith('frozen-') && f.endsWith('.json')).sort();
  if (!files.length) {
    console.error('No frozen-*.json in data/ab-track/. gate A cannot be measured without frozen conditions.');
    process.exit(1);
  }
  // Most recent freeze wins. A second freeze is itself an event worth noticing —
  // see the deleteClause: re-freezing twice means the test failed to run.
  const f = files[files.length - 1];
  if (files.length > 1) {
    console.log(`⚠ ${files.length} freeze files present: ${files.join(', ')}`);
    console.log(`  Using ${f}. Repeated re-freezing invalidates the test — see _meta.deleteClause.\n`);
  }
  return { file: f, data: readJSON(path.join(ABDIR, f)) };
}

function scoreDays() {
  return fs.readdirSync(SCORES)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ date: f.slice(0, -5), file: path.join(SCORES, f) }));
}

async function yahooDaily(symbol, range = '1y') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Yahoo ${symbol}: HTTP ${res.status}`);
  const r = (await res.json()).chart.result[0];
  const out = new Map();
  r.timestamp.forEach((t, i) => {
    const c = r.indicators.quote[0].close[i];
    if (c != null) out.set(new Date(t * 1000).toISOString().slice(0, 10), c);
  });
  return out;
}

function stats(xs) {
  const n = xs.length;
  if (n < 2) return null;
  const mu = xs.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (n - 1));
  let cum = 1;
  for (const x of xs) cum *= 1 + x;
  return {
    n,
    cumPct: (cum - 1) * 100,
    geoAnnPct: (Math.pow(cum, 252 / n) - 1) * 100,
    volAnnPct: sd * Math.sqrt(252) * 100,
    mu,
    sd,
  };
}

/** Paired t of (a - b), the only honest way to compare two baskets over the same days. */
function pairedT(a, b) {
  const d = a.map((x, i) => x - b[i]);
  const s = stats(d);
  if (!s) return null;
  return { t: s.mu / (s.sd / Math.sqrt(s.n)), meanDailyPct: s.mu * 100, n: s.n };
}

// ---------------------------------------------------------------- core

/**
 * Build adjacent-trading-day segments. Non-adjacent gaps are DROPPED, not bridged:
 * `data/scores/` has ~74% calendar coverage, and treating a 4-day gap as one
 * "daily" return inflates both the return and the volatility of whichever basket
 * happens to span it.
 */
function buildSegments(days, tradingDays) {
  const idx = new Map(tradingDays.map((d, i) => [d, i]));
  const segs = [];
  let dropped = 0;
  for (let i = 0; i < days.length - 1; i++) {
    const d0 = days[i].date, d1 = days[i + 1].date;
    if (idx.has(d0) && idx.has(d1) && idx.get(d1) - idx.get(d0) === 1) {
      segs.push({ d0, d1, m0: days[i].map, m1: days[i + 1].map });
    } else {
      dropped++;
    }
  }
  return { segs, dropped };
}

function basketReturns(segs, select, log) {
  return segs.map(({ d0, m0, m1 }) => {
    const chosen = select(m0);
    const priced = chosen.filter((s) => m0.get(s)?.price && m1.get(s)?.price);
    const missing = chosen.length - priced.length;
    if (missing > 0 && log) log.push(`${d0}: ${missing} of ${chosen.length} unpriceable, dropped for this segment`);
    if (!priced.length) return 0;
    return priced.reduce((a, s) => a + (m1.get(s).price / m0.get(s).price - 1), 0) / priced.length;
  });
}

function loadDays(filter) {
  return scoreDays()
    .filter((d) => filter(d.date))
    .map(({ date, file }) => {
      const j = readJSON(file);
      const map = new Map();
      for (const r of j.results || []) if (r.price != null) map.set(r.symbol, r);
      return { date, map };
    })
    .filter((d) => d.map.size > 0);
}

function report(label, rows, benchName) {
  console.log(`\n${label}`);
  console.log('  ' + 'basket'.padEnd(26) + 'cum'.padStart(10) + 'geoAnn'.padStart(11) + 'volAnn'.padStart(10) + 'ann/vol'.padStart(10));
  for (const [name, s] of rows) {
    if (!s) { console.log(`  ${name.padEnd(26)}  (insufficient data)`); continue; }
    console.log(
      '  ' + name.padEnd(26) +
      `${s.cumPct >= 0 ? '+' : ''}${s.cumPct.toFixed(2)}%`.padStart(10) +
      `${s.geoAnnPct >= 0 ? '+' : ''}${s.geoAnnPct.toFixed(1)}%`.padStart(11) +
      `${s.volAnnPct.toFixed(1)}%`.padStart(10) +
      `${(s.geoAnnPct / s.volAnnPct >= 0 ? '+' : '')}${(s.geoAnnPct / s.volAnnPct).toFixed(2)}`.padStart(10)
    );
  }
  if (benchName) console.log(`  (benchmark: ${benchName})`);
}

function significance(pass, all) {
  const t = pairedT(pass, all);
  if (!t) return;
  const verdict = Math.abs(t.t) > 2 ? 'SIGNIFICANT at 5%' : '*** NOT SIGNIFICANT ***';
  console.log(`\n  pass-set minus all-universe: ${t.meanDailyPct >= 0 ? '+' : ''}${t.meanDailyPct.toFixed(3)}%/day` +
              `   t = ${t.t >= 0 ? '+' : ''}${t.t.toFixed(2)}   n = ${t.n}   → ${verdict}`);
  if (Math.abs(t.t) <= 2) {
    console.log('  A non-significant excess is not a small win. It is no evidence of a win.');
  }
}

// ---------------------------------------------------------------- modes

async function runLive(frozen) {
  const freezeDate = frozen.data._meta.frozenAt;
  const w = frozen.data._meta.window;
  console.log(`Frozen roster: ${frozen.file}  (${frozen.data.rosterN} tickers)`);
  console.log(`Window: ${w.start} → ${w.end}   mid-check ${w.midCheck} (does not execute)`);
  console.log(`Start rule: first scores file strictly after ${freezeDate}\n`);

  const days = loadDays((d) => d > freezeDate);
  if (days.length < 2) {
    console.log(`Observation days so far: ${days.length}`);
    console.log('\ngate A: NOT YET MEASURABLE — need at least 2 scoring days after the freeze.');
    console.log('This is the correct output today, not an error. The pre-freeze span is');
    console.log('deliberately excluded; run --diagnostic to see why.');
    return;
  }

  const smh = await yahooDaily(frozen.data._meta.benchmark);
  const { segs, dropped } = buildSegments(days, [...smh.keys()].sort());
  console.log(`Observation days: ${days.length}   adjacent segments: ${segs.length}   dropped (non-adjacent): ${dropped}`);
  if (!segs.length) {
    console.log('\ngate A: NOT YET MEASURABLE — no adjacent-trading-day segments yet.');
    return;
  }

  // Membership is read from that day's scores file, never from a later universe.json edit.
  const log = [];
  const pass = basketReturns(segs, (m) => [...m.keys()].filter((s) => m.get(s).funnelPass), log);
  const fail = basketReturns(segs, (m) => [...m.keys()].filter((s) => !m.get(s).funnelPass), log);
  const all = basketReturns(segs, (m) => [...m.keys()], log);
  const bench = segs.map(({ d0, d1 }) => smh.get(d1) / smh.get(d0) - 1);

  report(`gate A running measurement — ${segs[0].d0} → ${segs[segs.length - 1].d1}`, [
    ['pass-set', stats(pass)],
    ['FAIL-set', stats(fail)],
    ['all-universe', stats(all)],
    [frozen.data._meta.benchmark, stats(bench)],
  ], frozen.data._meta.benchmark);
  significance(pass, all);

  // Roster drift: tickers that have left universe.json since the freeze still count.
  const universe = readJSON(path.join(ROOT, 'data', 'universe.json'));
  const live = new Set(universe.tickers.map((t) => t.symbol));
  const gone = frozen.data.roster.filter((r) => !live.has(r.symbol)).map((r) => r.symbol);
  const added = universe.tickers.filter((t) => !frozen.data.roster.some((r) => r.symbol === t.symbol)).map((t) => t.symbol);
  console.log(`\n  roster drift since freeze — left universe: ${gone.length ? gone.join(', ') : 'none'}`);
  console.log(`                              added to universe: ${added.length ? added.join(', ') : 'none'}`);
  if (added.length) console.log('  ⚠ Newly added tickers are NOT in the frozen roster and must not be credited to gate A.');
  if (log.length) console.log(`\n  ${log.length} unpriceable-drop events (first 5):\n   ` + log.slice(0, 5).join('\n   '));
}

async function runDiagnostic(frozen) {
  const freezeDate = frozen.data._meta.frozenAt;
  console.log('=== DIAGNOSTIC: pre-freeze span — CONTAMINATED, NOT gate A evidence ===\n');
  console.log('Three defects, measured not asserted:');
  console.log('  1. every ticker was added after the scoring start (look-ahead on membership)');
  console.log('  2. pc/moatCapture edited inside the window (post-hoc re-scoring)');
  console.log('  3. demoted tickers left the basket (survivorship)');
  console.log('Reproduced here only so the size of the contamination is on the record.\n');

  const days = loadDays((d) => d <= freezeDate);
  if (days.length < 2) { console.log('No pre-freeze data.'); return; }
  const smh = await yahooDaily(frozen.data._meta.benchmark, '1y');
  const { segs, dropped } = buildSegments(days, [...smh.keys()].sort());
  console.log(`Scoring days: ${days.length}   adjacent segments: ${segs.length}   dropped: ${dropped}`);

  const pass = basketReturns(segs, (m) => [...m.keys()].filter((s) => m.get(s).funnelPass));
  const fail = basketReturns(segs, (m) => [...m.keys()].filter((s) => !m.get(s).funnelPass));
  const all = basketReturns(segs, (m) => [...m.keys()]);
  const bench = segs.map(({ d0, d1 }) => smh.get(d1) / smh.get(d0) - 1);

  report(`CONTAMINATED span ${segs[0].d0} → ${segs[segs.length - 1].d1}`, [
    ['pass-set', stats(pass)],
    ['FAIL-set', stats(fail)],
    ['all-universe', stats(all)],
    [frozen.data._meta.benchmark, stats(bench)],
  ], frozen.data._meta.benchmark);
  significance(pass, all);

  // Single-factor attribution: does the elaborate pricing composite earn its complexity?
  const nPass = (m) => Math.max(1, [...m.values()].filter((r) => r.funnelPass).length);
  const topBy = (m, get) => [...m.entries()]
    .map(([s, r]) => [s, get(r)])
    .filter(([, v]) => v != null)
    .sort((a, b) => a[1] - b[1])
    .slice(0, nPass(m))
    .map(([s]) => s);
  const factors = [
    ['pricingScore only', (r) => r.pricingScore],
    ['momentum6m only (20%)', (r) => r.components?.momentum6m?.score],
    ['forwardPE only (30%)', (r) => r.components?.forwardPE?.score],
    ['evRevenue only (25%)', (r) => r.components?.evRevenue?.score],
    ['analystUpside only (25%)', (r) => r.components?.analystUpside?.score],
  ];
  report('single-factor attribution (same basket size, cheapest-first)',
    factors.map(([lab, get]) => [lab, stats(basketReturns(segs, (m) => topBy(m, get)))]));
  console.log('\n  If the full funnel beats every single factor, the excess is coming from the');
  console.log('  hand-scored qualitative gates — which are exactly the fields edited 39 times');
  console.log('  inside this window. That is why this span cannot settle gate A.');
}

// ---------------------------------------------------------------- main

(async () => {
  const frozen = loadFrozen();
  const diagnostic = process.argv.includes('--diagnostic');
  try {
    if (diagnostic) await runDiagnostic(frozen);
    else await runLive(frozen);
  } catch (e) {
    console.error(`\nFailed: ${e.message}`);
    process.exit(1);
  }
})();
