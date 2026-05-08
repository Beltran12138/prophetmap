/**
 * audit-layers.js
 *
 * Monthly layer structure audit. Computes quantitative metrics per layer and
 * surfaces auditCriteria text alongside metrics for human evaluation.
 *
 * Metrics:
 *   - Average pricingScore (latest + 30d)
 *   - Funnel pass count (latest + 30d avg)
 *   - Inter-layer correlation matrix (top entries)
 *
 * NEVER writes to layers.json. Surfaces for manual review.
 * Output: data/audit/YYYY-MM-DD-layers.md
 */

const fs = require('fs');
const path = require('path');

const UNIVERSE_PATH = path.join(__dirname, '../data/universe.json');
const LAYERS_PATH = path.join(__dirname, '../data/layers.json');
const SCORES_DIR = path.join(__dirname, '../data/scores');
const AUDIT_DIR = path.join(__dirname, '../data/audit');

const LOOKBACK_DAYS = 30;
const TOP_CORRELATIONS = 15;
const MIN_DAYS_FOR_CORRELATION = 20; // Below this, correlation values are statistical noise

const today = () => new Date().toISOString().slice(0, 10);

function readScores() {
  if (!fs.existsSync(SCORES_DIR)) return [];
  return fs.readdirSync(SCORES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .slice(-LOOKBACK_DAYS)
    .map((f) => JSON.parse(fs.readFileSync(path.join(SCORES_DIR, f), 'utf8')));
}

function mean(arr) {
  const v = arr.filter((x) => x != null && isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function correlation(x, y) {
  const pairs = x.map((xi, i) => [xi, y[i]]).filter(([a, b]) => a != null && b != null);
  if (pairs.length < 5) return null;
  const xs = pairs.map(([a]) => a);
  const ys = pairs.map(([, b]) => b);
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < pairs.length; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

function main() {
  const layersData = JSON.parse(fs.readFileSync(LAYERS_PATH, 'utf8'));
  const universe = JSON.parse(fs.readFileSync(UNIVERSE_PATH, 'utf8'));
  const scoreFiles = readScores();

  console.log(`[ProphetMap Layer Audit] ${layersData.layers.length} layers | ${scoreFiles.length} days of scores`);

  const layerMetrics = {};
  for (const layer of layersData.layers) {
    const tickersInLayer = universe.tickers.filter((t) => t.layer === layer.id);
    const symbolsInLayer = new Set(tickersInLayer.map((t) => t.symbol));

    const dailyAvgScore = scoreFiles.map((s) => {
      const entries = (s.results || []).filter((r) => symbolsInLayer.has(r.symbol));
      return mean(entries.map((e) => e.pricingScore));
    });
    const dailyPassCount = scoreFiles.map((s) =>
      (s.results || []).filter((r) => symbolsInLayer.has(r.symbol) && r.funnelPass).length
    );

    layerMetrics[layer.id] = {
      tickerCount: tickersInLayer.length,
      avgScore30d: mean(dailyAvgScore),
      latestScore: dailyAvgScore[dailyAvgScore.length - 1],
      avgPassCount30d: mean(dailyPassCount),
      latestPassCount: dailyPassCount[dailyPassCount.length - 1] || 0,
      scoreSeries: dailyAvgScore,
    };
  }

  const correlationsSkipped = scoreFiles.length < MIN_DAYS_FOR_CORRELATION;
  const correlations = [];
  const layerIds = Object.keys(layerMetrics);

  if (!correlationsSkipped) {
    for (let i = 0; i < layerIds.length; i++) {
      for (let j = i + 1; j < layerIds.length; j++) {
        const a = layerIds[i];
        const b = layerIds[j];
        const r = correlation(layerMetrics[a].scoreSeries, layerMetrics[b].scoreSeries);
        if (r != null) correlations.push({ a, b, r });
      }
    }
    correlations.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  }

  // Flag potentially redundant layers (correlation > 0.85)
  const mergeFlags = correlations.filter((c) => Math.abs(c.r) > 0.85);

  const lines = [
    `# ProphetMap Layer Audit — ${today()}`,
    '',
    `**Layers**: ${layersData.layers.length} (layers v${layersData.version})`,
    `**Universe**: ${universe.tickers.length} tickers`,
    `**Lookback**: ${scoreFiles.length} days of scores`,
    '',
    '---',
    '',
    `## Per-Layer Metrics`,
    '',
    `| Layer | Tickers | Latest Score | 30d Avg | Latest PASS | 30d Avg PASS |`,
    `| --- | --- | --- | --- | --- | --- |`,
    ...layersData.layers.map((l) => {
      const m = layerMetrics[l.id];
      return `| ${l.id} (${l.nameEn}) | ${m.tickerCount} | ${m.latestScore?.toFixed(2) ?? 'N/A'} | ${m.avgScore30d?.toFixed(2) ?? 'N/A'} | ${m.latestPassCount} | ${m.avgPassCount30d?.toFixed(1) ?? 'N/A'} |`;
    }),
    '',
    `## Top ${TOP_CORRELATIONS} Inter-Layer Correlations (avg pricingScore, ${LOOKBACK_DAYS}d)`,
    '',
    correlationsSkipped
      ? `_⚠️ **Correlation analysis skipped** — only ${scoreFiles.length} days of scores available (need ≥${MIN_DAYS_FOR_CORRELATION}). Below this threshold, correlations are statistical noise. Re-run after data accumulation._`
      : '',
    ...(correlationsSkipped ? [] : [
      `| Layer A | Layer B | Pearson r |`,
      `| --- | --- | --- |`,
      ...correlations.slice(0, TOP_CORRELATIONS).map((c) => `| ${c.a} | ${c.b} | ${c.r.toFixed(3)} |`),
    ]),
    '',
    `## ⚠️ Merge Flags (correlation > 0.85)`,
    '',
    correlationsSkipped
      ? '_Skipped — insufficient data._'
      : mergeFlags.length === 0
      ? '_None — no layer pairs strongly correlated._'
      : '',
    ...(correlationsSkipped ? [] : mergeFlags.map((c) => `- **${c.a}** vs **${c.b}**: r=${c.r.toFixed(3)} — review whether layers are tracking the same underlying signal`)),
    '',
    `## Layer Audit Criteria (manual review)`,
    '',
    ...layersData.layers.flatMap((l) => {
      const m = layerMetrics[l.id];
      const ac = l.auditCriteria || {};
      return [
        `### ${l.id} — ${l.nameEn}`,
        `**Latest score**: ${m.latestScore?.toFixed(2) ?? 'N/A'} | **30d avg**: ${m.avgScore30d?.toFixed(2) ?? 'N/A'} | **Latest PASS**: ${m.latestPassCount}/${m.tickerCount}`,
        '',
        ...(ac.mergeCondition ? [`- **Merge condition**: ${ac.mergeCondition}`] : []),
        ...(ac.splitCondition ? [`- **Split condition**: ${ac.splitCondition}`] : []),
        ...(ac.deleteCondition ? [`- **Delete condition**: ${ac.deleteCondition}`] : []),
        ...(ac.falsificationSignals?.length
          ? [
              `- **Falsification signals**:`,
              ...ac.falsificationSignals.map((s) => `  - ${s}`),
            ]
          : []),
        '',
      ];
    }),
    '',
    '---',
    '',
    '_Layer structure changes require manual review. AuditCriteria are natural language; metrics provide quantitative context for human evaluation._',
  ];

  if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });
  const outPath = path.join(AUDIT_DIR, `${today()}-layers.md`);
  fs.writeFileSync(outPath, lines.join('\n'));

  console.log(`[ProphetMap Layer Audit] Merge flags: ${mergeFlags.length} | Report: ${outPath}`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `merge_flags=${mergeFlags.length}\n`);
  }
}

main();
