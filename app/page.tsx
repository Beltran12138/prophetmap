export const dynamic = 'force-dynamic';

import { getLatestScores, getLayers, flattenLayers, pricingColor, pricingBg, type LayerDef, type TickerScore } from '@/lib/data';

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n != null);
  if (!valid.length) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function ScoreBadge({ score, pass }: { score: number | null; pass?: boolean }) {
  const color = pricingColor(score);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        border: `1px solid ${color}40`,
        background: `${color}18`,
        color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {pass && <span style={{ color: '#22c55e' }}>✓</span>}
      {score != null ? score.toFixed(1) : '—'}
    </span>
  );
}

function TickerChip({ t }: { t: TickerScore }) {
  const color = pricingColor(t.pricingScore);
  return (
    <span
      title={`PC=${t.physicalConstraint} AI=${Math.round(t.aiContribution * 100)}% ${t.funnelPass ? '✓ PASS' : t.funnelFailReasons.join(', ')}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        borderRadius: 5,
        border: `1px solid ${color}50`,
        background: `${color}14`,
        color: '#cbd5e1',
        fontSize: 12,
        cursor: 'default',
      }}
    >
      {t.funnelPass && <span style={{ color: '#22c55e', fontSize: 10 }}>●</span>}
      <span style={{ fontWeight: 600, color: t.funnelPass ? '#f8fafc' : '#94a3b8' }}>{t.symbol}</span>
      <span style={{ color, fontSize: 11 }}>{t.pricingScore?.toFixed(1) ?? '—'}</span>
    </span>
  );
}

function LayerRow({
  layer,
  tickers,
  depth = 0,
}: {
  layer: LayerDef;
  tickers: TickerScore[];
  depth?: number;
}) {
  const layerTickers = tickers.filter((t) => t.layer === layer.id);
  const avgScore = avg(layerTickers.map((t) => t.pricingScore));
  const passCount = layerTickers.filter((t) => t.funnelPass).length;
  const bg = pricingBg(avgScore);
  const color = pricingColor(avgScore);
  const isLeading = layer.isLeadingIndicator;

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${color}30`,
        background: bg,
        padding: '12px 16px',
        marginLeft: depth * 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: layerTickers.length ? 10 : 0 }}>
        {/* Layer ID */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#475569',
            minWidth: 52,
            fontFamily: 'monospace',
          }}
        >
          {layer.id}
        </span>

        {/* Chain badge */}
        <span
          style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 3,
            background: layer.chain === 'A' ? '#1e3a5f' : '#1e3a2e',
            color: layer.chain === 'A' ? '#60a5fa' : '#4ade80',
            fontWeight: 600,
          }}
        >
          {layer.chain}
        </span>

        {/* Leading indicator tag */}
        {isLeading && (
          <span style={{ fontSize: 10, color: '#818cf8', padding: '1px 6px', border: '1px solid #4338ca50', borderRadius: 3 }}>
            LEADING
          </span>
        )}

        {/* Layer name */}
        <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>{layer.nameEn}</span>
        <span style={{ fontSize: 11, color: '#475569' }}>{layer.name}</span>

        {/* Avg score */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {passCount > 0 && (
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
              {passCount}/{layerTickers.length} PASS
            </span>
          )}
          <ScoreBadge score={avgScore} />
        </div>
      </div>

      {/* Ticker chips */}
      {layerTickers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {layerTickers.map((t) => (
            <TickerChip key={t.symbol} t={t} />
          ))}
        </div>
      )}

      {/* Sublayers (L8 parallel) */}
      {layer.sublayers && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${layer.sublayers.length}, 1fr)`, gap: 8, marginTop: 10 }}>
          {layer.sublayers.map((sub) => (
            <LayerRow key={sub.id} layer={sub} tickers={tickers} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const scores = getLatestScores();
  const layers = getLayers();

  if (!scores) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80, color: '#475569' }}>
        <p style={{ fontSize: 18 }}>No score data found.</p>
        <code style={{ fontSize: 13, color: '#64748b' }}>node scripts/update-valuations.js</code>
      </div>
    );
  }

  const tickers = scores.results;
  const passCount = scores.funnelPassCount;
  const allPasses = tickers.filter((t) => t.funnelPass);
  const overallAvg = avg(tickers.map((t) => t.pricingScore));

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>AI Chain Transmission Map</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
            {scores.date} · {scores.totalFetched} tickers · SPY 6m {scores.spy6mReturn != null ? `${scores.spy6mReturn > 0 ? '+' : ''}${scores.spy6mReturn}%` : '—'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
          <Stat label="Universe Avg" value={overallAvg?.toFixed(1) ?? '—'} color={pricingColor(overallAvg)} />
          <Stat label="Funnel PASS" value={`${passCount} / ${scores.totalFetched}`} color="#22c55e" />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 11, color: '#475569' }}>
        <span>Pricing score:</span>
        {[
          { label: '≤2.0 Opportunity', color: '#16a34a' },
          { label: '2.0–2.5 Cheap', color: '#84cc16' },
          { label: '2.5–3.0 Fair', color: '#ca8a04' },
          { label: '3.0–3.5 Rich', color: '#ea580c' },
          { label: '>3.5 Overpriced', color: '#dc2626' },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 8 }}>· ● green dot = funnel PASS</span>
      </div>

      {/* PASS summary bar */}
      {allPasses.length > 0 && (
        <div
          style={{
            marginBottom: 20,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #16a34a40',
            background: '#052e1630',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>● FUNNEL PASS</span>
          {allPasses.map((t) => (
            <span key={t.symbol} style={{ fontSize: 12, color: '#f8fafc', fontWeight: 700 }}>
              {t.symbol}
              <span style={{ color: pricingColor(t.pricingScore), marginLeft: 4, fontSize: 11 }}>
                {t.pricingScore?.toFixed(1)}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Chain layers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {layers.map((layer, i) => (
          <div key={layer.id}>
            <LayerRow layer={layer} tickers={tickers} />
            {i < layers.length - 1 && (
              <div className="chain-arrow" style={{ paddingLeft: 26 }}>↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, color: '#475569' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
