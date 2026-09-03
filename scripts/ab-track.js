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
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCORES = path.join(ROOT, 'data', 'scores');
const ABDIR = path.join(ROOT, 'data', 'ab-track');
const RUNLOG = path.join(ABDIR, 'run-log.jsonl');

/**
 * Fields the freeze pins. `_meta.preRegisteredRules.noReweighting` promises these
 * are frozen at the roster values — but until 2026-09-03 nothing checked it, and
 * the promise sat in a JSON file that any edit could contradict silently.
 *
 * Why these four and not the whole record: they are the inputs to funnelPass.
 * Editing them does not rewrite history (membership is read from that day's
 * scores file), it changes what TOMORROW's scores file will say — forward
 * contamination, not retroactive. That is the leak the freeze was written to
 * stop and the one it could not see.
 */
const PINNED_FIELDS = ['physicalConstraint', 'moatCapture', 'aiContribution', 'timeToRealize'];

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

// ------------------------------------------------- enforcement (added 2026-09-03)
//
// Before this block the freeze was a pre-registration, not an enforcement: five of
// the seven preRegisteredRules were executed by the code, `noReweighting` was not
// executed at all, and nothing detected an edit to the freeze file itself. The
// purpose line said "Nothing in this file is edited after frozenAt" — a promise,
// not a constraint. These three checks turn the promise into a constraint.
//
// What they can and cannot do, stated plainly: they stop self-deception, not
// fraud. Anyone who wants to cheat can amend the history and re-run. That is the
// correct scope — pre-registration in science defends against the author fooling
// himself, and the reader who needs more than that has git.

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/**
 * Integrity anchor. No hash is stored anywhere, deliberately: a hash written by
 * the same process that can rewrite the file proves nothing. git already holds an
 * external, timestamped anchor, so the check is "ask git", not "compute a digest".
 *
 * A frozen file that has been committed more than once has been edited after
 * frozenAt. Per _meta.deleteClause the correct response is to record that the test
 * failed to run — so this exits non-zero rather than printing a warning. A warning
 * would leave this a diagnosis; the whole point is that it is not one.
 */
function integrityCheck(frozenFile) {
  const rel = path.posix.join('data', 'ab-track', frozenFile);
  let commits, dirty;
  try {
    commits = git(['log', '--format=%H', '--', rel]).split('\n').filter(Boolean);
    dirty = git(['status', '--porcelain', '--', rel]).length > 0;
  } catch (e) {
    // Not a git checkout, or git missing. Skip loudly: a check that silently does
    // not run is worse than no check, because it still occupies the "verified" slot.
    console.log('⚠ integrity: git unavailable — freeze integrity NOT verified this run.\n');
    return { verified: false, commits: null, dirty: null };
  }
  if (commits.length === 0) {
    console.log(`⚠ integrity: ${frozenFile} is not committed — nothing anchors it. NOT verified.\n`);
    return { verified: false, commits: 0, dirty };
  }
  if (commits.length > 1 || dirty) {
    const why = [
      commits.length > 1 ? `${commits.length} commits touch it (expected exactly 1)` : null,
      dirty ? 'uncommitted local modifications present' : null,
    ].filter(Boolean).join('; ');
    // Returned, not exited. The deleteClause asks that a violated test be RECORDED
    // as having failed to run; the first version of this check exited here, which
    // refused the run without recording it — enforcing the rule by breaking it.
    return { verified: false, commits: commits.length, dirty, violation: why };
  }
  return { verified: true, commits: 1, dirty: false, sha: commits[0].slice(0, 7) };
}

/**
 * noReweighting enforcement. The pre-existing drift block below compares the SET
 * of symbols; this compares the VALUES of the four pinned fields for the symbols
 * that are in both. Those are different leaks: a ticker leaving the universe is
 * visible and already handled, a moatCapture quietly going 3 → 4 is not.
 *
 * Additions are not a violation — Gap #13 already allows them and excludes them
 * from gate A. Only edits to a frozen roster member violate the rule.
 */
function scoreDrift(frozen) {
  const universe = readJSON(path.join(ROOT, 'data', 'universe.json'));
  const live = new Map(universe.tickers.map((t) => [t.symbol, t]));
  const changed = [];
  for (const r of frozen.data.roster) {
    const t = live.get(r.symbol);
    if (!t) continue; // handled by the exit/roster-drift report, not a reweighting
    for (const f of PINNED_FIELDS) {
      if (JSON.stringify(norm(t[f])) !== JSON.stringify(norm(r[f]))) {
        changed.push(`${r.symbol}.${f}: frozen ${JSON.stringify(r[f])} → live ${JSON.stringify(t[f])}`);
      }
    }
  }
  return changed;
}

/**
 * Absent key and explicit null mean the same thing in this schema, and the freeze
 * normalised one into the other: IONQ and RGTI carry no `moatCapture` key in
 * universe.json at all (they are the only two), while the frozen roster records
 * `null`. The first version of this check compared JSON.stringify directly and
 * flagged both as reweighting violations — a check that fires on a difference in
 * how emptiness is spelled would have to be switched off within a day, and a check
 * that gets switched off is worse than none.
 *
 * Deliberately narrow: only undefined↔null collapse. A field going 3 → null is
 * still a violation, because that is a value being removed, not a spelling.
 */
function norm(v) {
  return v === undefined || v === null ? null : v;
}

/**
 * Trial bookkeeping. Applying a deflated Sharpe ratio needs the number of trials,
 * and the reason nobody supplies it is that nobody records it — self-reported
 * counts are systematically low because a look you regretted does not feel like a
 * trial. So the count is taken here rather than asked for.
 *
 * Append-only by convention and by git: a deleted line shows up in the diff.
 * `--diagnostic` runs are logged too but marked, because they are declared
 * contaminated and produce no gate A evidence — counting them would inflate the
 * trial count in the one direction that flatters the screen.
 */
function appendRun(entry) {
  fs.appendFileSync(RUNLOG, JSON.stringify(entry) + '\n', 'utf-8');
}

function runLogSummary() {
  if (!fs.existsSync(RUNLOG)) return null;
  const rows = fs.readFileSync(RUNLOG, 'utf-8').split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
  const live = rows.filter((r) => r.mode === 'live');
  // Two numbers, deliberately not collapsed into one: runs counts how often the
  // result was looked at, distinctEnd counts how many genuinely different result
  // sets existed. Ten runs on the same day is one observation and ten looks, and
  // which of those is "the" trial count is the caller's call, not this script's.
  const ok = live.filter((r) => !r.error);
  return {
    runs: ok.length,
    distinctEnd: new Set(ok.map((r) => r.lastDay).filter(Boolean)).size,
    diagnostic: rows.filter((r) => r.mode === 'diagnostic').length,
    errors: live.length - ok.length,
  };
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

  // noReweighting, enforced. Checked BEFORE any price is fetched: a violated
  // experiment should fail the same way whether or not Yahoo is reachable.
  const drift = scoreDrift(frozen);
  if (drift.length) {
    console.error('=== gate A: TEST FAILED TO RUN ===\n');
    console.error(`preRegisteredRules.noReweighting was violated — ${drift.length} pinned field(s) edited`);
    console.error('on tickers that are in the frozen roster:\n');
    for (const d of drift.slice(0, 20)) console.error(`  ${d}`);
    if (drift.length > 20) console.error(`  … and ${drift.length - 20} more`);
    console.error('\nThese fields feed funnelPass, so editing them changes which tickers enter');
    console.error('the basket on FUTURE scoring days. The freeze cannot see that happen and');
    console.error('the returns would look clean.\n');
    console.error('Per _meta.deleteClause: record that the test failed to run. Do not re-freeze,');
    console.error('and do not relax this check — the check is the experiment.');
    // Thrown rather than exited so main() records it. See integrityCheck.
    throw new Error(`noReweighting violated: ${drift.length} pinned field(s) edited (${drift.slice(0, 3).join('; ')}${drift.length > 3 ? '; …' : ''})`);
  }
  console.log(`noReweighting: ${PINNED_FIELDS.length} pinned fields × ${frozen.data.rosterN} roster tickers verified unchanged`);

  const days = loadDays((d) => d > freezeDate);
  if (days.length < 2) {
    console.log(`Observation days so far: ${days.length}`);
    console.log('\ngate A: NOT YET MEASURABLE — need at least 2 scoring days after the freeze.');
    console.log('This is the correct output today, not an error. The pre-freeze span is');
    console.log('deliberately excluded; run --diagnostic to see why.');
    return { segments: 0, note: 'not-yet-measurable' };
  }

  const smh = await yahooDaily(frozen.data._meta.benchmark);
  const { segs, dropped } = buildSegments(days, [...smh.keys()].sort());
  console.log(`Observation days: ${days.length}   adjacent segments: ${segs.length}   dropped (non-adjacent): ${dropped}`);
  if (!segs.length) {
    console.log('\ngate A: NOT YET MEASURABLE — no adjacent-trading-day segments yet.');
    return { segments: 0, note: 'no-adjacent-segments' };
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

  const t = pairedT(pass, all);
  const ps = stats(pass), as = stats(all), bs = stats(bench);
  return {
    segments: segs.length,
    lastDay: segs[segs.length - 1].d1,
    passCumPct: ps && +ps.cumPct.toFixed(4),
    allCumPct: as && +as.cumPct.toFixed(4),
    benchCumPct: bs && +bs.cumPct.toFixed(4),
    t: t && +t.t.toFixed(4),
    n: t && t.n,
  };
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

  // Integrity runs for BOTH modes: --diagnostic reads frozenAt and benchmark from
  // the same file, so an edited freeze makes that output untrustworthy as well.
  const integrity = integrityCheck(frozen.file);
  if (integrity.violation) {
    console.error('=== gate A: TEST FAILED TO RUN ===\n');
    console.error(`The frozen conditions were modified after frozenAt: ${integrity.violation}.`);
    console.error('\nPer _meta.deleteClause the correct action is to RECORD that the test');
    console.error('failed to run — not to re-freeze, and not to relax this check.');
    appendRun({
      ts: new Date().toISOString(),
      mode: diagnostic ? 'diagnostic' : 'live',
      frozenFile: frozen.file,
      integrityVerified: false,
      error: `integrity: ${integrity.violation}`,
    });
    console.error('\n(recorded in run-log.jsonl)');
    process.exit(1);
  }
  if (integrity.verified) {
    console.log(`Freeze integrity: ${frozen.file} @ ${integrity.sha}, 1 commit, clean — verified against git.`);
  }

  const prior = runLogSummary();
  if (prior) {
    console.log(`Prior runs on record: ${prior.runs} live (${prior.distinctEnd} distinct end-dates)` +
                `, ${prior.diagnostic} diagnostic, ${prior.errors} failed.`);
  }
  console.log();

  let result, failed = null;
  try {
    result = diagnostic ? await runDiagnostic(frozen) : await runLive(frozen);
  } catch (e) {
    failed = e.message;
  }

  appendRun({
    ts: new Date().toISOString(),
    mode: diagnostic ? 'diagnostic' : 'live',
    frozenFile: frozen.file,
    frozenSha: integrity.sha || null,
    integrityVerified: integrity.verified,
    ...(failed ? { error: failed } : result || {}),
  });

  if (failed) {
    console.error(`\nFailed: ${failed}`);
    console.error('(the attempt is still recorded in run-log.jsonl — a run that errored is');
    console.error(' still a run, and omitting it would understate the trial count)');
    process.exit(1);
  }

  if (!diagnostic) {
    const now = runLogSummary();
    console.log(`\n  trials on record: ${now.runs} live run(s), ${now.distinctEnd} distinct result set(s).`);
    console.log('  When gate A is finally evaluated at 2027-08-17, the threshold must be raised');
    console.log('  for the number of looks taken, not for the number remembered. That is what');
    console.log('  this log is for; it deliberately does not apply the correction itself,');
    console.log('  because choosing the trial definition after seeing the returns is the error');
    console.log('  the freeze exists to prevent.');
  }
})();
