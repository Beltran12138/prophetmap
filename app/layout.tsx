import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProphetMap — AI Chain Signal Radar',
  description: 'AI industry chain transmission map for US equity alpha discovery',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: '#0a0a0f', color: '#e2e8f0' }}>
        <header style={{ borderBottom: '1px solid #1e1e2e', padding: '12px 24px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 32 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                ◈ ProphetMap
              </span>
              <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>AI Chain Signal Radar</span>
            </div>
            <nav style={{ display: 'flex', gap: 4 }}>
              {[
                { href: '/', label: 'Chain Map' },
                { href: '/funnel', label: 'Funnel' },
                { href: '/signals', label: 'Signals' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#94a3b8',
                    textDecoration: 'none',
                    border: '1px solid transparent',
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: '#475569' }}>
              open source · MIT
            </div>
          </div>
        </header>
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
