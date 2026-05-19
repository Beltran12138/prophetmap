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
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const UNIVERSE_PATH = path.join(__dirname, '../data/universe.json');
const LAYERS_PATH = path.join(__dirname, '../data/layers.json');
const AUDIT_DIR = path.join(__dirname, '../data/audit');

const RATE_LIMIT_MS = 500;
const MIN_PEER_MENTIONS = 2;
const MIN_MARKETCAP_B = 1;
const TOP_CANDIDATES = 15;
const MODEL_ID = 'gemini-2.5-flash';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

const apiKey = (process.env.GEMINI_API_KEY || '').replace(/^﻿/, '').trim();
const useGemini = !!apiKey;
const ai = useGemini ? new GoogleGenAI({ apiKey }) : null;

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
    let sector = null;
    let industry = null;
    let businessSummary = null;
    try {
      const sum = await yahooFinance.quoteSummary(symbol, { modules: ['summaryProfile'] });
      sector = sum?.summaryProfile?.sector || null;
      industry = sum?.summaryProfile?.industry || null;
      businessSummary = sum?.summaryProfile?.longBusinessSummary?.slice(0, 600) || null;
    } catch {
      // summaryProfile fetch optional — quote alone still returns basic data
    }
    return {
      symbol,
      name: q?.longName || q?.shortName || symbol,
      price: q?.regularMarketPrice,
      marketCap: q?.marketCap ? Math.round(q.marketCap / 1e9) : null,
      sector: q?.sector || sector,
      industry: q?.industry || industry,
      businessSummary,
    };
  } catch {
    return null;
  }
}

async function draftThesis(candidate, suggestedLayer, layerDescription, quoteContext) {
  if (!ai) return null;
  const systemMsg = `You are a quantitative equity analyst for an AI supply chain investment framework.

STEP 1 — INDUSTRY VERIFICATION (mandatory first step):
Read the provided industry / sector / businessSummary fields carefully. Identify what the company ACTUALLY does in physical/operational terms. Do NOT rely on the peer-suggested layer hint — that hint comes from a Yahoo Finance peer algorithm which has documented mismatch errors (e.g., classifying FPGA makers as materials suppliers, classifying analog IC vendors as EDA, etc.).

STEP 2 — LAYER CORRECTION:
Compare the suggested layer description against the verified industry. If they mismatch, output a corrected layer in "correctedLayer" and explain in "correctionReason". If they match, set "correctedLayer" equal to the suggested layer.

STEP 3 — THESIS DRAFTING (only on verified layer):
Draft a 2-3 sentence forward-looking thesis tied to the CORRECTED layer's role, plus exactly 3 falsification signals (observable, specific events — not generic risks).

STEP 4 — METRIC ESTIMATION:
Be honest about aiContribution. If the company's revenue is primarily driven by non-AI segments (EV/auto/industrial/consumer), aiContribution should reflect actual AI exposure (likely <0.30), not narrative attachment.

Output strict JSON:
{
  "industryVerified": "<actual industry per business summary>",
  "correctedLayer": "<layer id matching verified industry>",
  "correctionReason": "<why corrected, or 'matches suggested' if no change>",
  "thesis": "<2-3 sentence thesis tied to correctedLayer>",
  "thesisFalsification": ["<signal 1>", "<signal 2>", "<signal 3>"],
  "estimatedPhysicalConstraint": <1-5>,
  "estimatedAiContribution": <0.0-1.0>,
  "fitConfidence": "<high|medium|low>"
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: JSON.stringify({
        ticker: candidate,
        suggestedLayer,
        layerDescription,
        industry: quoteContext?.industry || 'unknown',
        sector: quoteContext?.sector || 'unknown',
        businessSummary: quoteContext?.businessSummary || 'unavailable',
      }),
      config: {
        systemInstruction: systemMsg,
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 1500,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const content = response.text;
    if (!content) {
      console.warn(`    Gemini empty response for ${candidate}`);
      return { error: 'empty response' };
    }
    return JSON.parse(content);
  } catch (e) {
    console.warn(`    Gemini error for ${candidate}: ${e.message}`);
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
    if (useGemini && layerHints.length > 0) {
      const suggestedLayer = layerHints[0];
      const layerDescription = layerMap[suggestedLayer]?.description || '';
      thesisDraft = await draftThesis(symbol, suggestedLayer, layerDescription, quote);
      await sleep(RATE_LIMIT_MS * 2);
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
    `**Gemini thesis drafting**: ${useGemini ? 'enabled (gemini-2.5-flash)' : 'disabled (GEMINI_API_KEY not set)'}`,
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
            `**Industry verification**: ${c.thesisDraft.industryVerified ?? '?'}`,
            `**Corrected layer**: ${c.thesisDraft.correctedLayer ?? '?'} ${c.thesisDraft.correctedLayer && c.layerHints[0] && c.thesisDraft.correctedLayer !== c.layerHints[0] ? '⚠️ (differs from suggested)' : ''}`,
            `**Correction reason**: ${c.thesisDraft.correctionReason ?? '_n/a_'}`,
            '',
            `**Draft thesis** (Gemini, on corrected layer):`,
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
