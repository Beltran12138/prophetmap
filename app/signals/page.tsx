export const dynamic = 'force-dynamic';

import { getLatestAlerts, riskColor, type AlertEntry } from '@/lib/data';

const PROXIMITY_LABEL: Record<number, string> = {
  0: 'none',
  1: 'early signs',
  2: 'approaching',
  3: 'CONFIRMED',
};

const PROXIMITY_COLOR: Record<number, string> = {
  0: '#334155',
  1: '#ca8a04',
  2: '#ea580c',
  3: '#dc2626',
};

function AlertCard({ entry }: { entry: AlertEntry }) {
  const a = entry.assessment;
  // Skip null assessments and error-only assessments (Gemini JSON parse failures)
  if (!a || !('overallRisk' in a) || !a.overallRisk) return null;
  const rColor = riskColor(a.overallRisk);
  const confirmedCount = a.signals?.filter((s) => s.proximity === 3).length ?? 0;
  const approachingCount = a.signals?.filter((s) => s.proximity === 2).length ?? 0;

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${rColor}30`,
        background: '#0d1117',
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid #1e293b',
          background: `${rColor}10`,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{entry.symbol}</span>
        <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{entry.layer}</span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            color: rColor,
            border: `1px solid ${rColor}50`,
            background: `${rColor}15`,
          }}
        >
          {a.overallRisk.toUpperCase()}
        </span>
        {!a.thesisIntact && (
          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#dc2626', border: '1px solid #dc262650', background: '#dc262615' }}>
            THESIS BROKEN
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#334155' }}>
          {new Date(entry.analyzedAt).toLocaleString()}
        </span>
      </div>

      {/* Thesis */}
      <div style={{ padding: '8px 16px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #1e1e2e' }}>
        {entry.thesis}
      </div>

      {/* Key watch item */}
      <div style={{ padding: '8px 16px', fontSize: 12, color: '#94a3b8', background: '#0a0a0f' }}>
        <span style={{ color: '#475569', marginRight: 6 }}>▶ Watch:</span>
        {a.keyWatchItem}
      </div>

      {/* Signals */}
      {a.signals && a.signals.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid #1e1e2e' }}>
          {a.signals.map((sig, i) => {
            const pColor = PROXIMITY_COLOR[sig.proximity] ?? '#334155';
            const pLabel = PROXIMITY_LABEL[sig.proximity] ?? String(sig.proximity);
            return (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span
                  style={{
                    minWidth: 90,
                    fontSize: 10,
                    fontWeight: 700,
                    color: pColor,
                    padding: '2px 6px',
                    border: `1px solid ${pColor}40`,
                    borderRadius: 3,
                    textAlign: 'center',
                  }}
                >
                  {pLabel}
                </span>
                <div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{sig.signal}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sig.evidence}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary counts */}
      {(confirmedCount > 0 || approachingCount > 0) && (
        <div style={{ padding: '6px 16px', background: '#dc262610', borderTop: '1px solid #dc262630', fontSize: 11 }}>
          {confirmedCount > 0 && <span style={{ color: '#dc2626', marginRight: 12 }}>⚠ {confirmedCount} signal(s) CONFIRMED</span>}
          {approachingCount > 0 && <span style={{ color: '#ea580c' }}>⚡ {approachingCount} signal(s) approaching</span>}
        </div>
      )}
    </div>
  );
}

export default function SignalsPage() {
  const alerts = getLatestAlerts();

  if (!alerts) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 18, color: '#475569', marginBottom: 12 }}>No signal data found.</div>
        <div style={{ fontSize: 13, color: '#334155' }}>
          Set <code style={{ color: '#94a3b8' }}>DEEPSEEK_API_KEY</code> then run:
        </div>
        <code
          style={{
            display: 'block',
            marginTop: 12,
            padding: '12px 20px',
            background: '#0d1117',
            border: '1px solid #1e293b',
            borderRadius: 8,
            color: '#84cc16',
            fontSize: 13,
          }}
        >
          node scripts/analyze-signals.js
        </code>
      </div>
    );
  }

  const sortedAlerts = [...alerts.alerts].sort((a, b) => {
    const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (riskOrder[a.assessment?.overallRisk ?? 'low'] ?? 3) - (riskOrder[b.assessment?.overallRisk ?? 'low'] ?? 3);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>Thesis Signal Feed</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
            {alerts.date} · {alerts.totalAnalyzed} tickers analyzed · Gemini 2.5 Flash
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
          {alerts.criticalCount > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#475569' }}>CRITICAL</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>{alerts.criticalCount}</div>
            </div>
          )}
          {alerts.highCount > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#475569' }}>HIGH</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ea580c' }}>{alerts.highCount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Critical summary */}
      {alerts.criticalAndHigh.length > 0 && (
        <div
          style={{
            marginBottom: 20,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #dc262640',
            background: '#dc262610',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 6 }}>⚠ Requires immediate review</div>
          {alerts.criticalAndHigh.map((c) => (
            <div key={c.symbol} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: riskColor(c.risk) }}>{c.symbol}</span>
              {' — '}{c.watch}
            </div>
          ))}
        </div>
      )}

      {/* All alerts */}
      <div>
        {sortedAlerts.map((entry) => (
          <AlertCard key={entry.symbol} entry={entry} />
        ))}
      </div>
    </div>
  );
}
