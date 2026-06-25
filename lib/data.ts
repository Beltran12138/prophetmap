import fs from 'fs';
import path from 'path';

export type TickerScore = {
  symbol: string;
  layer: string;
  assetClass?: 'equity' | 'crypto';
  physicalConstraint: number;
  aiContribution: number;
  timeToRealize: string;
  moatCapture?: number | null;
  moatLocks?: string[] | null;
  price: number | null;
  marketCap: number | null;
  pricingScore: number | null;
  pegRatio?: number | null;
  pegBand?: 'cheap' | 'fair' | 'rich' | 'overpriced' | 'N/A';
  funnelPass: boolean;
  funnelFailReasons: string[];
  funnelWarnings?: string[];
  components: {
    // Equity components
    forwardPE?: { value: number; benchmark: number; score: number };
    evRevenue?: { value: number; benchmark: number; score: number };
    analystUpside?: { targetPrice: number; currentPrice: number; upside: number; score: number };
    momentum6m?: { ticker6m?: number; spy6m?: number; relative?: number; ownReturn?: number; ethReturn?: number; relReturn?: number; score: number };
    // Crypto components
    pRev?: { value: number; benchmark: number; score: number };
    pTvl?: { value: number; benchmark: number; score: number };
  };
  dataQuality: string;
  analystRecommendMean: number | null;
  numberOfAnalysts: number | null;
  cryptoMetrics?: {
    tvlUSD: number | null;
    annualRevenueUSD: number | null;
    volume24hUSD: number | null;
    priceChange6mPct: number | null;
  };
};

export type ScoresFile = {
  date: string;
  spy6mReturn: number | null;
  funnelPassCount: number;
  totalFetched: number;
  results: TickerScore[];
};

export type LayerDef = {
  id: string;
  name: string;
  nameEn: string;
  chain: string;
  position: number;
  status: string;
  isLeadingIndicator?: boolean;
  parallel?: boolean;
  sublayers?: LayerDef[];
};

export type AlertEntry = {
  symbol: string;
  layer: string;
  thesis: string;
  assessment?: {
    signals: { signal: string; proximity: number; evidence: string }[];
    overallRisk: string;
    keyWatchItem: string;
    thesisIntact: boolean;
  };
  analyzedAt: string;
};

export type AlertsFile = {
  date: string;
  totalAnalyzed: number;
  criticalCount: number;
  highCount: number;
  criticalAndHigh: { symbol: string; risk: string; watch: string }[];
  alerts: AlertEntry[];
};

function latestFile(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().reverse();
  return files.length > 0 ? path.join(dir, files[0]) : null;
}

export function getLatestScores(): ScoresFile | null {
  const file = latestFile(path.join(process.cwd(), 'data', 'scores'));
  if (!file) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function getLatestAlerts(): AlertsFile | null {
  const file = latestFile(path.join(process.cwd(), 'data', 'alerts'));
  if (!file) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function getLayers(): LayerDef[] {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'layers.json'), 'utf8'));
  return raw.layers as LayerDef[];
}

// Flatten all layer IDs including sublayers
export function flattenLayers(layers: LayerDef[]): LayerDef[] {
  const result: LayerDef[] = [];
  for (const l of layers) {
    result.push(l);
    if (l.sublayers) result.push(...l.sublayers);
  }
  return result;
}

// Pricing score → hex color
export function pricingColor(score: number | null): string {
  if (score == null) return '#6b7280';
  if (score <= 2.0) return '#16a34a';
  if (score <= 2.5) return '#84cc16';
  if (score <= 3.0) return '#ca8a04';
  if (score <= 3.5) return '#ea580c';
  return '#dc2626';
}

// Pricing score → dark background color
export function pricingBg(score: number | null): string {
  if (score == null) return '#1f2937';
  if (score <= 2.0) return '#052e16';
  if (score <= 2.5) return '#1a2e05';
  if (score <= 3.0) return '#1c1407';
  if (score <= 3.5) return '#1c0d07';
  return '#1c0505';
}

export function riskColor(risk: string): string {
  switch (risk) {
    case 'low': return '#16a34a';
    case 'medium': return '#ca8a04';
    case 'high': return '#ea580c';
    case 'critical': return '#dc2626';
    default: return '#6b7280';
  }
}
