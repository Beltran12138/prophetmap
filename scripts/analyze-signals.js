/**
 * analyze-signals.js
 *
 * For each active ticker, retrieves latest metrics and analyst revisions,
 * then asks DeepSeek V4 Flash to assess proximity of each falsification signal.
 * Writes to data/alerts/YYYY-MM-DD.json.
 *
 * Output risk levels: low | medium | high | critical
 * "critical" triggers GitHub Actions annotation for human review.
 *
 * Environment variables required:
 *   DEEPSEEK_API_KEY — DeepSeek API key
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });
const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');

const UNIVERSE_PATH = path.join(__dirname, '../data/universe.json');
const ALERTS_DIR = path.join(__dirname, '../data/alerts');
const RATE_LIMIT_MS = 500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function today() {
  return new Date().toISOString().slice(0, 10);
}

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

/**
 * Fetch key metrics and recent news headlines for thesis monitoring.
 * Serializes all Yahoo Finance calls to avoid rate-limit errors.
 */
async function fetchMetrics(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));

    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'financialData',
        'defaultKeyStatistics',
        'recommendationTrend',
        'upgradeDowngradeHistory',
      ],
    });
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));

    // Recent news headlines — grounds DeepSeek analysis in real events
    let newsHeadlines = [];
    try {
      const searchResult = await yahooFinance.search(symbol, { newsCount: 6 });
      newsHeadlines = (searchResult?.news ?? []).slice(0, 6).map((n) => ({
        title: n.title,
        publisher: n.publisher,
        date: n.providerPublishTime
          ? new Date(n.providerPublishTime * 1000).toISOString().slice(0, 10)
          : null,
      }));
    } catch { /* news fetch is non-critical */ }

    const upgrades = summary?.upgradeDowngradeHistory?.history?.slice(0, 10) ?? [];

    return {
      price: quote?.regularMarketPrice,
      priceChange52wPct: quote?.fiftyTwoWeekLow != null && quote?.regularMarketPrice != null
        ? Math.round(((quote.regularMarketPrice - quote.fiftyTwoWeekLow) / quote.fiftyTwoWeekLow) * 1000) / 10
        : null,
      revenueGrowthYoY: summary?.financialData?.revenueGrowth ?? null,
      grossMargins: summary?.financialData?.grossMargins ?? null,
      targetMeanPrice: summary?.financialData?.targetMeanPrice ?? null,
      recommendationMean: summary?.financialData?.recommendationMean ?? null,
      numberOfAnalysts: summary?.financialData?.numberOfAnalystOpinions ?? null,
      recentUpgrades: upgrades.slice(0, 5).map((u) => ({
        date: u.epochGradeDate
          ? new Date(u.epochGradeDate * 1000).toISOString().slice(0, 10)
          : null,
        firm: u.firm,
        toGrade: u.toGrade,
        action: u.action,
      })),
      forwardPE: summary?.defaultKeyStatistics?.forwardPE ?? null,
      shortPercentFloat: summary?.defaultKeyStatistics?.shortPercentOfFloat ?? null,
      recentNews: newsHeadlines,
    };
  } catch {
    return null;
  }
}

/**
 * Ask DeepSeek to assess falsification signal proximity.
 * Returns structured JSON or null on failure.
 */
async function assessSignals(ticker, metrics) {
  const prompt = {
    symbol: ticker.symbol,
    thesis: ticker.thesis,
    layer: ticker.layer,
    physicalConstraint: ticker.physicalConstraint,
    aiContribution: ticker.aiContribution,
    falsificationSignals: ticker.thesisFalsification,
    currentMetrics: metrics,
  };

  const systemMsg = `You are a quantitative equity analyst specializing in technology sector theses.
Assess whether each falsification signal for the given stock is approaching confirmation.
Primary evidence source: the recentNews headlines in currentMetrics (these are real, timestamped headlines).
Secondary: use your training knowledge, but note your cutoff may lag current events — flag uncertainty when relying on training knowledge alone.
Be terse, factual, and contrarian — default to finding problems.
Return ONLY valid JSON matching this exact schema:
{
  "signals": [
    {
      "signal": "<exact signal text>",
      "proximity": 0|1|2|3,
      "evidence": "<1-2 sentences of factual evidence>"
    }
  ],
  "overallRisk": "low|medium|high|critical",
  "keyWatchItem": "<single most important thing to monitor next 30 days>",
  "thesisIntact": true|false
}
Proximity scale: 0=no evidence, 1=early signs, 2=strong evidence/approaching, 3=confirmed/falsified.`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: JSON.stringify(prompt, null, 2) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('[ProphetMap] DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  const universe = JSON.parse(fs.readFileSync(UNIVERSE_PATH, 'utf8'));
  const activeTickers = universe.tickers.filter((t) => t.status === 'active');

  console.log(`[ProphetMap] Analyzing signals for ${activeTickers.length} active tickers...`);

  const alerts = [];
  const critical = [];

  for (const ticker of activeTickers) {
    const sym = ticker.symbol;
    process.stdout.write(`  ${sym}... `);

    const metrics = await fetchMetrics(sym);
    await sleep(RATE_LIMIT_MS);

    if (!metrics) {
      console.log('metrics fetch failed, skipping');
      continue;
    }

    const assessment = await assessSignals(ticker, metrics);
    await sleep(RATE_LIMIT_MS);

    const entry = {
      symbol: sym,
      layer: ticker.layer,
      thesis: ticker.thesis,
      metrics,
      assessment,
      analyzedAt: new Date().toISOString(),
    };

    alerts.push(entry);

    if (assessment?.overallRisk === 'critical' || assessment?.overallRisk === 'high') {
      critical.push({ symbol: sym, risk: assessment.overallRisk, watch: assessment.keyWatchItem });
    }

    const riskLabel = assessment?.overallRisk ?? 'unknown';
    const intact = assessment?.thesisIntact == null ? '?' : assessment.thesisIntact ? 'intact' : 'BROKEN';
    console.log(`[${riskLabel.toUpperCase()}] thesis=${intact}`);
  }

  if (!fs.existsSync(ALERTS_DIR)) fs.mkdirSync(ALERTS_DIR, { recursive: true });

  const output = {
    date: today(),
    totalAnalyzed: alerts.length,
    criticalCount: critical.filter((c) => c.risk === 'critical').length,
    highCount: critical.filter((c) => c.risk === 'high').length,
    criticalAndHigh: critical,
    alerts,
  };

  const outPath = path.join(ALERTS_DIR, `${today()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\n[ProphetMap] ✅ Written to ${outPath}`);

  if (critical.length > 0) {
    console.log('\n⚠️  HIGH/CRITICAL signals detected:');
    critical.forEach((c) => console.log(`  ${c.symbol} [${c.risk.toUpperCase()}]: ${c.watch}`));
    // GitHub Actions: set output for notification step
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_critical=true\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `critical_symbols=${critical.map((c) => c.symbol).join(',')}\n`);
    }
  } else if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_critical=false\n`);
  }
}

main().catch((err) => {
  console.error('[ProphetMap] Fatal:', err);
  process.exit(1);
});
