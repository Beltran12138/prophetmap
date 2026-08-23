#!/usr/bin/env node
// Do the two qualitative gates measure two different things?
//
// The funnel admits a ticker when physicalConstraint >= 4 OR moatCapture >= 4.
// That OR is only worth two checks if the two fields disagree with each other
// often enough. This reads the frozen roster and reports how many independent
// dimensions the gate actually has, by Kish effective sample size.
//
// Reads data/ab-track/frozen-2026-08-17.json only. Writes nothing.

const fs = require('fs');
const path = require('path');

const FROZEN = path.join(__dirname, '..', 'data', 'ab-track', 'frozen-2026-08-17.json');
const FIELDS = ['physicalConstraint', 'moatCapture', 'aiContribution'];
const GATE = ['physicalConstraint', 'moatCapture'];
const CUT = 4;

function ranks(xs) {
  const order = xs.map((v, i) => i).sort((a, b) => xs[a] - xs[b]);
  const r = new Array(xs.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && xs[order[j + 1]] === xs[order[i]]) j++;
    const avg = (i + j) / 2 + 1;                 // ties share the mean rank
    for (let k = i; k <= j; k++) r[order[k]] = avg;
    i = j + 1;
  }
  return r;
}

function pearson(a, b) {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma, y = b[i] - mb;
    num += x * y; da += x * x; db += y * y;
  }
  const den = Math.sqrt(da * db);
  return den ? num / den : 0;
}

// Kish effective sample size for an equally weighted set of correlated
// estimators: n^2 / sum of the whole correlation matrix.
function neff(fields, rho) {
  const n = fields.length;
  if (n === 0) return 0;
  let s = n;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) s += 2 * rho[key(fields[i], fields[j])];
  return (n * n) / s;
}

const key = (a, b) => [a, b].sort().join('~');

// n_eff read off one roster is a point estimate. A number used to argue that
// someone else's confidence is overstated has to report its own, so resample
// tickers with replacement and take the percentile interval. The resample is
// over tickers — the unit that was drawn from the world — not over cells:
// resampling cells would break the within-ticker link between the three fields
// and return an interval that is too narrow, which is the flattering direction.
// Seeded, so the number on screen is the same one every run.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function neffOf(sample, fields) {
  const c = {};
  fields.forEach(f => { c[f] = ranks(sample.map(t => t[f])); });
  const r = {};
  for (let i = 0; i < fields.length; i++)
    for (let j = i + 1; j < fields.length; j++)
      r[key(fields[i], fields[j])] = pearson(c[fields[i]], c[fields[j]]);
  return neff(fields, r);
}

function bootstrapCI(fields, draws, seed) {
  const rnd = mulberry32(seed);
  const out = [];
  for (let d = 0; d < draws; d++) {
    const sample = new Array(roster.length);
    for (let i = 0; i < roster.length; i++)
      sample[i] = roster[Math.floor(rnd() * roster.length)];
    const v = neffOf(sample, fields);
    if (Number.isFinite(v)) out.push(v);
  }
  out.sort((a, b) => a - b);
  const at = p => out[Math.min(out.length - 1, Math.max(0, Math.round(p * (out.length - 1))))];
  return { lo: at(0.025), hi: at(0.975), n: out.length };
}

const frozen = JSON.parse(fs.readFileSync(FROZEN, 'utf8'));
const roster = frozen.roster.filter(t => FIELDS.every(f => typeof t[f] === 'number'));

console.log('');
console.log('核心闸门 · 27 层 AI 产业链选股模型');
console.log(`  physicalConstraint（物理约束） >= ${CUT}`);
console.log(`  OR  moatCapture（护城河捕获） >= ${CUT}`);
console.log('');
console.log(`读取 ${path.relative(path.join(__dirname, '..'), FROZEN).replace(/\\/g, '/')}`);
console.log(`冻结于 ${frozen._meta.frozenAt} · ${roster.length} 个标的，三个维度全部有分`);
console.log('');

const col = {};
FIELDS.forEach(f => { col[f] = ranks(roster.map(t => t[f])); });

const rho = {};
for (let i = 0; i < FIELDS.length; i++)
  for (let j = i + 1; j < FIELDS.length; j++) {
    const a = FIELDS[i], b = FIELDS[j];
    rho[key(a, b)] = pearson(col[a], col[b]);
  }

console.log('秩相关');
Object.keys(rho).sort((x, y) => rho[y] - rho[x]).forEach(k => {
  const [a, b] = k.split('~');
  const v = rho[k];
  console.log(`  ${a.padEnd(19)} ~ ${b.padEnd(19)} ${v >= 0 ? '+' : ''}${v.toFixed(2)}`);
});
console.log('');

const nGate = neff(GATE, rho), nAll = neff(FIELDS, rho);
console.log('有效维度数  (Kish n_eff)');
console.log(`  闸门用的两个   n_eff = ${nGate.toFixed(2)} / 2      效率 ${Math.round(nGate / 2 * 100)}%`);
console.log(`  三个维度全算   n_eff = ${nAll.toFixed(2)} / 3      效率 ${Math.round(nAll / 3 * 100)}%`);
console.log('');
if (nGate < 1.6) {
  console.log(`  ! 这个闸门用了两个维度，实际上只有 ${nGate.toFixed(2)} 个。`);
  console.log('');
}

const ci = bootstrapCI(GATE, 1000, 20260823);
console.log(`这个 ${nGate.toFixed(2)} 自己的测量误差  (bootstrap ${ci.n} 次，对标的重抽)`);
console.log(`  95% 区间   [${ci.lo.toFixed(2)}, ${ci.hi.toFixed(2)}]`);
console.log('');

// The one line that has to survive a projector. Rules printed rather than
// aligned: CJK cell width varies by terminal, and a box that comes apart on
// the night is worse than no box.
const RULE = '─'.repeat(56);
console.log(RULE);
console.log(`  ▶  这道闸用了 2 个维度，实际只有 ${nGate.toFixed(2)} 个`);
if (ci.hi < 2) {
  console.log(`     95% 区间 [${ci.lo.toFixed(2)}, ${ci.hi.toFixed(2)}] —— 上界仍然 < 2`);
}
console.log(RULE);
console.log('');

const pc = roster.filter(t => t.physicalConstraint >= CUT).length;
const mc = roster.filter(t => t.moatCapture >= CUT).length;
const both = roster.filter(t => t.physicalConstraint >= CUT && t.moatCapture >= CUT).length;
const pass = roster.filter(t => t.physicalConstraint >= CUT || t.moatCapture >= CUT).length;

console.log('闸门通过情况');
console.log(`  通过            ${String(pass).padStart(2)} / ${roster.length}     (${Math.round(pass / roster.length * 100)}%)`);
console.log(`  只靠 pc 进来     ${String(pass - mc).padStart(2)}`);
console.log(`  只靠 moat 进来   ${String(pass - pc).padStart(2)}`);
console.log(`  两者都满足       ${String(both).padStart(2)}`);
console.log('');
console.log('注：这里用的是原始秩相关，没有条件化在任何结局变量上——');
console.log('    gate A 的结局本身尚未可测（见 GOVERNANCE.md Gap #13）。');
console.log('    所以这个数是相关性的上界读法，不是「控制标签后」的读法。');
console.log('');
