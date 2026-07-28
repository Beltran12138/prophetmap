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

// Constraint-type marker. Deliberately loud on 'geo': a geographic/permitting moat is
// rented from a jurisdiction, so it decays exogenously (policy, new capacity) rather
// than on a technology roadmap. 'unclassified' = the pc score has no physical referent.
const CONSTRAINT_TAG: Record<string, { label: string; color: string; title: string }> = {
  tech: { label: 'tech', color: '#818cf8', title: 'Process / IP / lead-time know-how — broken by the next technology generation (endogenous, visible in roadmaps)' },
  geo: { label: 'geo', color: '#fbbf24', title: 'Transport radius / mineral rights / siting / grid interconnect — broken by policy, permitting or new capacity. EXOGENOUS and faster-decaying than a tech constraint.' },
  regulatory: { label: 'reg', color: '#38bdf8', title: 'License / approval / liability / defence contract' },
  unclassified: { label: '?', color: '#f87171', title: 'physicalConstraint score has no physical referent (metaphorical) — flagged classification debt, not yet fixed' },
};

function RealizationCell({ t }: { t: TickerScore }) {
  const rev = t.realizationCheck?.estimateRevision;
  const hit = t.realizationCheck?.surpriseHitRate;
  if (!rev && !hit) return <span style={{ fontSize: 11, color: '#475569' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rev && (
        <span
          title={
            `+1y consensus EPS ${rev.ago90d} → ${rev.current} over 90d. ` +
            (rev.meaningful
              ? `Rising = the expectation every forward field depends on is being marked up; falling = aiContribution's denominator is shrinking while its hand-set value in universe.json stays put.`
              : `NM (not meaningful): an endpoint is a loss or near zero, so a percentage would be fake precision. Direction only: revised ${rev.direction}.`)
          }
          style={{
            fontSize: rev.meaningful ? 12 : 11,
            fontWeight: 600,
            color: !rev.meaningful ? '#64748b' : rev.changePct! > 0 ? '#22c55e' : '#ef4444',
          }}
        >
          {rev.meaningful
            ? `${rev.changePct! > 0 ? '+' : ''}${rev.changePct}%`
            : `NM ${rev.direction === 'up' ? '↑' : rev.direction === 'down' ? '↓' : '→'}`}
        </span>
      )}
      {hit && (
        <span
          title={`Last ${hit.quarters} reported quarters: ${hit.beats} beat consensus, average surprise ${hit.avgSurprisePct}%`}
          style={{ fontSize: 10, color: hit.beats === hit.quarters ? '#64748b' : '#fbbf24' }}
        >
          {hit.beats}/{hit.quarters} beat
        </span>
      )}
    </div>
  );
}

function TickerRow({ t, rank }: { t: TickerScore; rank: number }) {
  const pColor = pricingColor(t.pricingScore);
  const upside = t.components.analystUpside?.upside;
  const ctag = t.constraintType ? CONSTRAINT_TAG[t.constraintType] : null;

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
        <Bar value={t.physicalConstraint} max={5} color={ctag?.color ?? '#818cf8'} />
        {ctag && (
          <span
            title={ctag.title}
            style={{ fontSize: 10, color: ctag.color, fontWeight: 600, letterSpacing: 0.3 }}
          >
            {ctag.label}
          </span>
        )}
      </td>
      <td style={{ padding: '10px 12px' }}>
        {t.moatCapture != null ? (
          <span
            title={(t.moatLocks ?? []).join(', ') || 'no non-physical lock'}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: t.moatCapture >= 4 ? '#34d399' : t.moatCapture <= 2 ? '#f87171' : '#fbbf24',
            }}
          >
            {t.moatCapture}{t.moatCapture <= 2 ? ' ⚠' : ''}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: '#475569' }}>—</span>
        )}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <Bar value={Math.round(t.aiContribution * 5)} max={5} color="#34d399" />
        <span style={{ fontSize: 10, color: '#64748b' }}>{Math.round(t.aiContribution * 100)}%</span>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <RealizationCell t={t} />
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
    .filter((t) => !t.funnelPass && t.pricingScore != null && t.pricingScore <= 3.5 && (t.physicalConstraint >= 3 || (t.moatCapture ?? 0) >= 3))
    .sort((a, b) => (a.pricingScore ?? 99) - (b.pricingScore ?? 99))
    .slice(0, 10);

  const tableHeader = (
    <tr style={{ borderBottom: '2px solid #1e293b' }}>
      {['#', 'Symbol', 'Layer', 'Phys', 'Moat', 'AI%', 'Real.', 'Time', 'Pricing', 'Price', 'Mkt Cap', 'Analyst↑', 'P/E note'].map((h) => (
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
          {scores.date} · Pass criteria: defensibility (physicalConstraint ≥ 4 OR moatCapture ≥ 4) · aiContribution ≥ 30% · timeToRealize ≠ far · pricingScore hysteresis (enter ≤ 2.8, exit &gt; 3.2) · Moat ⚠ = supplier-trap (≤ 2)
        </div>
        <div style={{ fontSize: 11, color: '#334155', marginTop: 6, lineHeight: 1.6 }}>
          Phys carries a constraint-type tag — <span style={{ color: '#818cf8', fontWeight: 600 }}>tech</span> decays on a technology roadmap,{' '}
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>geo</span> is rented from a jurisdiction and decays exogenously (policy, permitting, new capacity),{' '}
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>reg</span> is licence/liability,{' '}
          <span style={{ color: '#f87171', fontWeight: 600 }}>?</span> means the score has no physical referent. Zero weight — no gate reads it.
          <br />
          Real. = expectation-vs-delivery: 90d revision of +1y consensus EPS, and beats over the last four reported quarters. Every other column is forward-looking; this one is not. Also zero weight.
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
            Near-miss criteria: (physicalConstraint ≥ 3 OR moatCapture ≥ 3) AND pricingScore ≤ 3.5. Not full passes — shown for monitoring.
          </div>
        </section>
      )}
    </div>
  );
}
