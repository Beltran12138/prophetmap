#!/usr/bin/env node
// Which of these tickers would the gate have let in?
//
// Takes a plain list of symbols — from a broker, a watchlist, anywhere — and
// reports each one against the frozen roster and the qualitative gate. It
// reads symbols only. No quantity, no cost basis, no P&L: those are not
// inputs to the question and carrying them here would put them in the output.
//
// Reads data/ab-track/frozen-2026-08-17.json only. Writes nothing.
//
//   node scripts/portfolio-gate.js NVDA AMD TSM
//   node scripts/portfolio-gate.js --file tickers.txt
//   echo "NVDA AMD" | node scripts/portfolio-gate.js

const fs = require('fs');
const path = require('path');

const FROZEN = path.join(__dirname, '..', 'data', 'ab-track', 'frozen-2026-08-17.json');
const CUT = 4;

function readSymbols(argv) {
  const fileIdx = argv.indexOf('--file');
  let text;
  if (fileIdx !== -1) {
    text = fs.readFileSync(argv[fileIdx + 1], 'utf8');
  } else {
    const inline = argv.filter(a => !a.startsWith('--'));
    if (inline.length) text = inline.join(' ');
    else text = fs.readFileSync(0, 'utf8');            // stdin
  }
  // Split on anything that is not part of a ticker, uppercase, dedupe.
  return [...new Set(
    text.split(/[^A-Za-z0-9.\-]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
  )];
}

const argv = process.argv.slice(2);
const symbols = readSymbols(argv);
if (!symbols.length) {
  console.error('给我一组代码：node scripts/portfolio-gate.js NVDA AMD TSM');
  process.exit(1);
}

const frozen = JSON.parse(fs.readFileSync(FROZEN, 'utf8'));
const byTicker = new Map();
for (const t of frozen.roster) byTicker.set(String(t.symbol).toUpperCase(), t);

const rows = symbols.map(sym => {
  const t = byTicker.get(sym);
  if (!t) return { sym, known: false };
  const pc = t.physicalConstraint, mc = t.moatCapture;
  const scored = typeof pc === 'number' && typeof mc === 'number';
  return {
    sym, known: true, scored, pc, mc,
    pass: scored ? (pc >= CUT || mc >= CUT) : null,
    only: scored ? (pc >= CUT && mc >= CUT ? 'both' : pc >= CUT ? 'pc' : mc >= CUT ? 'moat' : null) : null,
  };
});

console.log('');
console.log('核心闸门 · 27 层 AI 产业链选股模型');
console.log(`  physicalConstraint（物理约束） >= ${CUT}  OR  moatCapture（护城河捕获） >= ${CUT}`);
console.log(`  这个闸门用了两个维度，有效维度数 1.43（见 scripts/construct-check.js）`);
console.log('');
console.log(`读取 data/ab-track/frozen-2026-08-17.json · 冻结于 ${frozen._meta.frozenAt}`);
console.log(`收到 ${symbols.length} 个代码。只读代码，不读数量、成本、盈亏。`);
console.log('');

const pad = Math.max(6, ...rows.map(r => r.sym.length)) + 2;
for (const r of rows) {
  if (!r.known) {
    console.log(`  ${r.sym.padEnd(pad)} 不在这 87 个标的里——闸门从来没看过它`);
    continue;
  }
  if (!r.scored) {
    console.log(`  ${r.sym.padEnd(pad)} 在名单里，但两个维度没打完分`);
    continue;
  }
  const how = r.only === 'both' ? '两个维度都够'
    : r.only === 'pc' ? '只靠 physicalConstraint 一个维度进来'
    : r.only === 'moat' ? '只靠 moatCapture 一个维度进来'
    : '两个维度都不够';
  const verdict = r.pass ? '通过' : '被拦';
  console.log(`  ${r.sym.padEnd(pad)} pc=${r.pc} moat=${r.mc}   ${verdict}   ${how}`);
}
console.log('');

const known = rows.filter(r => r.known && r.scored);
const passed = known.filter(r => r.pass);
const single = passed.filter(r => r.only === 'pc' || r.only === 'moat');

console.log('小结');
console.log(`  这组代码里有 ${known.length} 个被这个闸门评过分`);
console.log(`  其中 ${passed.length} 个通过`);
console.log(`  通过的里面有 ${single.length} 个是靠单一维度进来的`);
console.log('');
if (single.length) {
  console.log(`  ! 那 ${single.length} 个，名义上过的是「两个维度的或」，`);
  console.log('    实际上只有一个维度对它们说了话——而这两个维度本身相关 +0.40。');
  console.log('');
}
console.log('注：这不是投资建议，也不是对这些标的的判断。');
console.log('    它回答的只有一件事：这道闸在这些标的上，实际用了几个维度。');
console.log('');
