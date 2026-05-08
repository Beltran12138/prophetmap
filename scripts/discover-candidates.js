/**
 * discover-candidates.js
 *
 * Monthly candidate discovery via Yahoo Finance peer recommendations.
 *
 * Method:
 *   1. For each active equity ticker, fetch Yahoo Finance recommendations (peers)
 *   2. Aggregate peer mentions across the universe
 *   3. Filter: not in universe + market cap ≥ $1B + mentioned by ≥2 existing tickers
 *   4. Optional: DeepSeek drafts thesis + falsification signals for top candidates
 *
 * NEVER writes to universe.json. Surfaces candidates only.
 * Output: data/audit/YYYY-MM-DD-discover.md
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });
const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');

const UNIVERSE_PATH = path.join(__dirname, '../data/universe.json');
const LAYERS_PATH = path.join(__dirname, '../data/layers.json');
const AUDIT_DIR = path.join(__dirname, '../data/audit');

const RATE_LIMIT_MS = 500;
const MIN_PEER_MENTIONS = 2;
const MIN_MARKETCAP_B = 1;
const TOP_CANDIDATES = 15;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

const useDeepSeek = !!process.env.DEEPSEEK_API_KEY;
const deepseek = useDeepSeek ? new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
}) : null;

async function getRecommendations(symbol) {
  try {
    const recs = await yahooFinance.recommendationsBySymbol(symbol);
    return recs?.recommendedSymbols?.map((r) => r.symbol) || [];
  } catch {
    return [];
  }
}

async function getQuoteBasic(symbol) {
  try {
    const q = await yahooFinance.quote(symbol);
    return {
      symbol,
      name: q?.longName || q?.shortName || symbol,
      price: q?.regularMarketPrice,
      marketCap: q?.marketCap ? Math.round(q.marketCap / 1e9) : null,
      sector: q?.sector,
      industry: q?.industry,
    };
  } catch {
    return null;
  }
}

async function draftThesis(candidate, suggestedLayer, layerDescription) {
  if (!deepseek) return null;
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `You are a quantitative equity analyst for an AI supply chain investment framework. Draft a concise investment thesis (2-3 sentences) and exactly 3 falsification signals for the given ticker positioned in the given layer.

Output strict JSON:
{
  "thesis": "<2-3 sentence forward-looking thesis tied to the layer's role>",
  "thesisFalsification": ["<signal 1>", "<signal 2>", "<signal 3>"],
  "estimatedPhysicalConstraint": <1-5>,
  "estimatedAiContribution": <0.0-1.0>,
  "fitConfidence": "<high|medium|low>"
}

Falsification signals must be observable, specific events that would invalidate the thesis (not generic risks).`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            ticker: candidate,
            suggestedLayer,
            layerDescription,
          }),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 600,
    });
    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  const universe = JSON.parse(fs.readFileSync(UNIVERSE_PATH, 'utf8'));
  const layersData = JSON.parse(fs.readFileSync(LAYERS_PATH, 'utf8'));
  const layerMap = Object.fromEntries(layersData.layers.map((l) => [l.id, l]));
  const existingSymbols = new Set(universe.tickers.map((t) => t.symbol));

  const peerCounts = new Map();

  const equityTickers = universe.tickers.filter(
    (t) => t.status === 'active' && t.assetClass !== 'crypto'
  );
  console.log(`[ProphetMap Discover] Querying peers for ${equityTickers.length} active equity tickers...`);

  for (const ticker of equityTickers) {
    process.stdout.write(`  ${ticker.symbol}... `);
    const peers = await getRecommendations(ticker.symbol);
    await sleep(RATE_LIMIT_MS);

    for (const peer of peers) {
      if (existingSymbols.has(peer)) continue;
      if (!peerCounts.has(peer)) {
        peerCounts.set(peer, { count: 0, layers: new Set(), sources: [] });
      }
      const entry = peerCounts.get(peer);
      entry.count++;
      entry.layers.add(ticker.layer);
      entry.sources.push(ticker.symbol);
    }
    console.log(`${peers.length} peers`);
  }

  const candidates = [...peerCounts.entries()]
    .filter(([, info]) => info.count >= MIN_PEER_MENTIONS)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, TOP_CANDIDATES);

  console.log(`\n[ProphetMap Discover] Found ${candidates.length} candidates (≥${MIN_PEER_MENTIONS} peer mentions)`);

  const candidateDetails = [];
  for (const [symbol, info] of candidates) {
    process.stdout.write(`  ${symbol} quote... `);
    const quote = await getQuoteBasic(symbol);
    await sleep(RATE_LIMIT_MS);

    if (!quote || !quote.marketCap || quote.marketCap < MIN_MARKETCAP_B) {
      console.log('skipped (small/missing)');
      continue;
    }

    const layerHints = [...info.layers];
    let thesisDraft = null;
    if (useDeepSeek && layerHints.length > 0) {
      const suggestedLayer = layerHints[0];
      const layerDescription = layerMap[suggestedLayer]?.description || '';
      thesisDraft = await draftThesis(symbol, suggestedLayer, layerDescription);
      await sleep(RATE_LIMIT_MS);
    }

    candidateDetails.push({
      ...quote,
      peerCount: info.count,
      peerSources: info.sources,
      layerHints,
      thesisDraft,
    });
    console.log(`$${quote.marketCap}B, sector: ${quote.sector || '?'}`);
  }

  const lines = [
    `# ProphetMap Candidate Discovery — ${today()}`,
    '',
    `**Method**: Yahoo Finance peer recommendations from each active ticker; aggregated mentions.`,
    `**Filters**: ≥${MIN_PEER_MENTIONS} peer mentions, market cap ≥ $${MIN_MARKETCAP_B}B, not in universe.`,
    `**DeepSeek thesis drafting**: ${useDeepSeek ? 'enabled' : 'disabled (DEEPSEEK_API_KEY not set)'}`,
    '',
    '---',
    '',
    candidateDetails.length === 0
      ? '_No new candidates this cycle._'
      : `## Top ${candidateDetails.length} Candidates`,
    '',
    ...candidateDetails.flatMap((c) => [
      `### ${c.symbol} — ${c.name}`,
      `- **Market cap**: $${c.marketCap}B`,
      `- **Sector / Industry**: ${c.sector || '?'} / ${c.industry || '?'}`,
      `- **Peer mentions**: ${c.peerCount} (sources: ${c.peerSources.join(', ')})`,
      `- **Suggested layer(s)**: ${c.layerHints.join(', ')}`,
      ...(c.thesisDraft && !c.thesisDraft.error
        ? [
            '',
            `**Draft thesis** (DeepSeek):`,
            `> ${c.thesisDraft.thesis || '_no thesis drafted_'}`,
            '',
            `**Estimated metrics**:`,
            `- physicalConstraint: ${c.thesisDraft.estimatedPhysicalConstraint ?? '?'}`,
            `- aiContribution: ${c.thesisDraft.estimatedAiContribution ?? '?'}`,
            `- fit confidence: ${c.thesisDraft.fitConfidence ?? '?'}`,
            '',
            `**Draft falsification signals**:`,
            ...((c.thesisDraft.thesisFalsification || []).map((f) => `- ${f}`)),
          ]
        : []),
      '',
      '---',
      '',
    ]),
    '',
    '_Candidates surfaced for manual review. universe.json updates require human approval._',
  ];

  if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });
  const outPath = path.join(AUDIT_DIR, `${today()}-discover.md`);
  fs.writeFileSync(outPath, lines.join('\n'));

  console.log(`[ProphetMap Discover] ${candidateDetails.length} candidates surfaced. Report: ${outPath}`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `candidates=${candidateDetails.length}\n`);
  }
}

main().catch((err) => {
  console.error('[ProphetMap Discover] Fatal:', err);
  process.exit(1);
});
