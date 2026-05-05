export const dynamic = 'force-dynamic';

import { getLatestScores, pricingColor, type TickerScore } from '@/lib/data';

function TimeTag({ t }: { t: string }) {
  const color = t === 'near' ? '#22c55e' : t === 'mid' ? '#ca8a04' : '#6b7280';
  return (
    <span style={{ color, fontSize: 11, fontWeight: 600 }}>{t.toUpperCase()}</span>
  );
}

function Bar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 3 }}
        />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function TickerRow({ t, rank }: { t: TickerScore; rank: number }) {
  const pColor = pricingColor(t.pricingScore);
  const upside = t.components.analystUpside?.upside;

  return (
    <tr style={{ borderBottom: '1px solid #1e293b' }}>
      <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12 }}>#{rank}</td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>{t.symbol}</span>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{t.layer}</span>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <Bar value={t.physicalConstraint} max={5} color="#818cf8" />
      </td>
      <td style={{ padding: '10px 12px' }}>
        <Bar value={Math.round(t.aiContribution * 5)} max={5} color="#34d399" />
        <span style={{ fontSize: 10, color: '#64748b' }}>{Math.round(t.aiContribution * 100)}%</span>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <TimeTag t={t.timeToRealize} />
      </td>
      <td style={{ padding: '10px 12px' }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: pColor,
            padding: '2px 10px',
            borderRadius: 5,
            border: `1px solid ${pColor}40`,
            background: `${pColor}18`,
          }}
        >
          {t.pricingScore?.toFixed(1) ?? '—'}
        </span>
      </td>
      <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 13 }}>
        {t.price != null ? `$${t.price.toFixed(2)}` : '—'}
      </td>
      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>
        {t.marketCap != null ? `$${t.marketCap}B` : '—'}
      </td>
      <td style={{ padding: '10px 12px' }}>
        {upside != null ? (
          <span style={{ color: upside > 0 ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: 13 }}>
            {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
          </span>
        ) : '—'}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 11, color: '#475569', maxWidth: 180 }}>
        {t.components.forwardPE && (
          <span>PE {t.components.forwardPE.value.toFixed(0)} vs {t.components.forwardPE.benchmark}</span>
        )}
      </td>
    </tr>
  );
}

export default function FunnelPage() {
  const scores = getLatestScores();

  if (!scores) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80, color: '#475569' }}>
        <p>No data. Run: <code>node scripts/update-valuations.js</code></p>
      </div>
    );
  }

  const passes = scores.results.filter((t) => t.funnelPass);
  const nearMisses = scores.results
    .filter((t) => !t.funnelPass && t.pricingScore != null && t.pricingScore <= 3.5 && t.physicalConstraint >= 3)
    .sort((a, b) => (a.pricingScore ?? 99) - (b.pricingScore ?? 99))
    .slice(0, 10);

  const tableHeader = (
    <tr style={{ borderBottom: '2px solid #1e293b' }}>
      {['#', 'Symbol', 'Layer', 'Phys', 'AI%', 'Time', 'Pricing', 'Price', 'Mkt Cap', 'Analyst↑', 'P/E note'].map((h) => (
        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#475569', fontWeight: 600 }}>
          {h}
        </th>
      ))}
    </tr>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>Four-Dimension Funnel</div>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
          {scores.date} · Pass criteria: physicalConstraint ≥ 4 · aiContribution ≥ 30% · timeToRealize ≠ far · pricingScore ≤ 3.0
        </div>
      </div>

      {/* PASS section */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', marginBottom: 10 }}>
          ● FUNNEL PASS — {passes.length} tickers
        </div>
        {passes.length === 0 ? (
          <div style={{ color: '#475569', padding: 20, border: '1px solid #1e293b', borderRadius: 8 }}>
            No tickers pass all four criteria today.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #1e293b' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0d1117' }}>
              <thead>{tableHeader}</thead>
              <tbody>
                {passes.map((t, i) => <TickerRow key={t.symbol} t={t} rank={i + 1} />)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Near-miss section */}
      {nearMisses.length > 0 && (
        <section>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ca8a04', marginBottom: 10 }}>
            ◌ NEAR MISS — PC ≥ 3, pricing ≤ 3.5 (watchlist candidates)
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #1e293b' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0d1117' }}>
              <thead>{tableHeader}</thead>
              <tbody>
                {nearMisses.map((t, i) => <TickerRow key={t.symbol} t={t} rank={i + 1} />)}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: '#334155', marginTop: 8 }}>
            Near-miss criteria: physicalConstraint ≥ 3 AND pricingScore ≤ 3.5. Not full passes — shown for monitoring.
          </div>
        </section>
      )}
    </div>
  );
}
