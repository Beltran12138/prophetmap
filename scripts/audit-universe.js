/**
 * audit-universe.js
 *
 * Weekly universe audit. Surfaces candidate changes — never writes to universe.json.
 *
 * Checks:
 *   1. Watchlist → active promotion candidates (pricingScore ≤ 2.5 for 5+ consecutive days)
 *   2. Active → watchlist demotion candidates (DeepSeek risk=high/critical for 30d window)
 *   3. Experimental graduation reminder (IONQ/RGTI _graduation criteria check)
 *
 * Output: data/audit/YYYY-MM-DD-universe.md
 * GitHub Actions outputs: promotions, demotions counts (for issue creation)
 */

const fs = require('fs');
const path = require('path');

const UNIVERSE_PATH = path.join(__dirname, '../data/universe.json');
const SCORES_DIR = path.join(__dirname, '../data/scores');
const ALERTS_DIR = path.join(__dirname, '../data/alerts');
const AUDIT_DIR = path.join(__dirname, '../data/audit');

const PROMOTION_THRESHOLD = 2.5;
const PROMOTION_DAYS = 5;
const DEMOTION_LOOKBACK = 30;
const DEMOTION_RATIO = 0.7; // 70% of recent days at high/critical → demote

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({
      file: f,
      data: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
    }));
}

function checkPromotion(ticker, scoreFiles) {
  const recent = scoreFiles.slice(-PROMOTION_DAYS);
  if (recent.length < PROMOTION_DAYS) return null;

  let consecutive = 0;
  let scoreLog = [];
  for (const { data } of recent) {
    const entry = data.results?.find((r) => r.symbol === ticker.symbol);
    const ps = entry?.pricingScore;
    scoreLog.push(ps != null ? ps.toFixed(2) : 'N/A');
    if (ps != null && ps <= PROMOTION_THRESHOLD) {
      consecutive++;
    } else {
      consecutive = 0;
    }
  }
  if (consecutive >= PROMOTION_DAYS) {
    return {
      symbol: ticker.symbol,
      layer: ticker.layer,
      reason: `pricingScore ≤ ${PROMOTION_THRESHOLD} for ${consecutive} consecutive days`,
      scoreSeries: scoreLog.join(' → '),
    };
  }
  return null;
}

function checkDemotion(ticker, alertFiles) {
  const recent = alertFiles.slice(-DEMOTION_LOOKBACK);
  if (recent.length < 5) return null; // Not enough data

  let highRiskDays = 0;
  let totalDays = 0;
  let watchItems = [];
  for (const { data } of recent) {
    const entry = data.alerts?.find((a) => a.symbol === ticker.symbol);
    if (!entry?.assessment) continue;
    totalDays++;
    const risk = entry.assessment.overallRisk;
    if (risk === 'high' || risk === 'critical') {
      highRiskDays++;
      if (entry.assessment.keyWatchItem) watchItems.push(entry.assessment.keyWatchItem);
    }
  }
  if (totalDays === 0) return null;
  const ratio = highRiskDays / totalDays;
  if (ratio >= DEMOTION_RATIO) {
    return {
      symbol: ticker.symbol,
      layer: ticker.layer,
      reason: `risk=high/critical on ${highRiskDays}/${totalDays} days (${Math.round(ratio * 100)}%) — sustained thesis erosion signal`,
      sampleWatchItems: [...new Set(watchItems)].slice(0, 3),
    };
  }
  return null;
}

function checkGraduation(ticker) {
  if (!ticker._graduation) return null;
  return {
    symbol: ticker.symbol,
    layer: ticker.layer,
    proposedStatus: ticker._graduation.graduateTo,
    criteria: ticker._graduation.criteria || [],
    note: 'Criteria are external metrics (revenue, milestones, partnerships) — manual verification required',
  };
}

function main() {
  const universe = JSON.parse(fs.readFileSync(UNIVERSE_PATH, 'utf8'));
  const scoreFiles = readJsonFiles(SCORES_DIR);
  const alertFiles = readJsonFiles(ALERTS_DIR);

  console.log(`[ProphetMap Audit] Universe: ${universe.tickers.length} tickers | Scores: ${scoreFiles.length} days | Alerts: ${alertFiles.length} days`);

  const promotions = [];
  const demotions = [];
  const graduations = [];

  for (const ticker of universe.tickers) {
    if (ticker.status === 'watchlist') {
      const p = checkPromotion(ticker, scoreFiles);
      if (p) promotions.push(p);
    }
    if (ticker.status === 'active') {
      const d = checkDemotion(ticker, alertFiles);
      if (d) demotions.push(d);
    }
    if (ticker.status === 'experimental') {
      const g = checkGraduation(ticker);
      if (g) graduations.push(g);
    }
  }

  const lines = [
    `# ProphetMap Universe Audit — ${today()}`,
    '',
    `**Universe size**: ${universe.tickers.length} tickers (universe v${universe._meta?.version})`,
    `**Score history**: ${scoreFiles.length} days available`,
    `**Alert history**: ${alertFiles.length} days available`,
    '',
    '---',
    '',
    `## Promotion Candidates (Watchlist → Active)`,
    '',
    promotions.length === 0 ? '_None._' : '',
    ...promotions.flatMap((p) => [
      `### ${p.symbol} (${p.layer})`,
      `- **Reason**: ${p.reason}`,
      `- **Score series (last ${PROMOTION_DAYS}d)**: ${p.scoreSeries}`,
      '',
    ]),
    '',
    `## Demotion Candidates (Active → Watchlist)`,
    '',
    demotions.length === 0 ? '_None._' : '',
    ...demotions.flatMap((d) => [
      `### ${d.symbol} (${d.layer})`,
      `- **Reason**: ${d.reason}`,
      ...(d.sampleWatchItems.length ? [
        `- **Sample watch items from DeepSeek**:`,
        ...d.sampleWatchItems.map((w) => `  - ${w}`),
      ] : []),
      '',
    ]),
    '',
    `## Experimental Graduation Reminders`,
    '',
    graduations.length === 0 ? '_None._' : '',
    ...graduations.flatMap((g) => [
      `### ${g.symbol} (${g.layer}) → ${g.proposedStatus}`,
      `_${g.note}_`,
      '',
      ...g.criteria.map((c) => `- [ ] ${c}`),
      '',
    ]),
    '',
    '---',
    '',
    '_This audit surfaces candidates only. universe.json updates require manual review and commit._',
  ];

  if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });
  const outPath = path.join(AUDIT_DIR, `${today()}-universe.md`);
  fs.writeFileSync(outPath, lines.join('\n'));

  console.log(`[ProphetMap Audit] Promotions: ${promotions.length} | Demotions: ${demotions.length} | Graduations: ${graduations.length}`);
  console.log(`[ProphetMap Audit] Report: ${outPath}`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `promotions=${promotions.length}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `demotions=${demotions.length}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `graduations=${graduations.length}\n`);
  }
}

main();
