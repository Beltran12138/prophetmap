# ProphetMap

**AI Industry Chain Transmission Map** — an open-source US equity alpha engine built on the thesis that AI capex flows through a predictable 19-layer physical supply chain. ProphetMap tracks where that capital flows, scores each ticker against four independent dimensions, and surfaces buy-signal candidates before consensus catches up.

Live: **[prophetmap.vercel.app](https://prophetmap.vercel.app)**

---

## The Core Idea

AI demand doesn't teleport to software companies. It travels through a physical chain:

```
Foundation Models (L0)
  → AI Chips (L1)
  → GPU Compute (L2)
  → Advanced Packaging (L2.5)
  → Data Center Build-out (L3)
  → Power Infrastructure (L4)
  → Cooling Systems (L5)
  → Networking Fabric (L6)
  → Memory & Storage (L7)
  → Semiconductor Equipment (L8a) / Materials (L8b)
  → EDA & IP (L9)
  → AI Software & Middleware (L10)
  → Edge & Robotics (L11)
  → AI Applications (L12)
  → Crypto & Decentralized Compute (L13)
  → Commodities & Materials (L14)
```

Each layer has **physical bottlenecks** (fab lead times, power permits, optical fiber manufacturing) that create durable pricing power — the kind that's harder to compete away than software margins.

---

## Four-Dimension Funnel

Every ticker is scored against four independent dimensions. A ticker must pass **all four** to qualify as a buy signal:

| Dimension | Pass Threshold | What It Measures |
|-----------|---------------|-----------------|
| `physicalConstraint` | ≥ 4 | Moat depth: how hard is it to replicate this position? (1=pure software, 5=hard physical monopoly with multi-year lead times) |
| `aiContribution` | ≥ 30% | What % of forward revenue growth is directly attributable to the AI thesis? |
| `timeToRealize` | ≠ far | How soon does the thesis cash flow? (`near` = <12m, `mid` = 12-36m, `far` = 36m+) |
| `pricingScore` | ≤ 3.0 | Is the market already pricing in the thesis? (1=deep value opportunity, 5=fully priced euphoria) |

The `pricingScore` is computed live from Yahoo Finance data using a weighted composite:

```
30% × Forward P/E deviation from layer median
25% × EV/Revenue deviation from layer median
25% × Analyst consensus upside (inverted — low upside = high score)
20% × 6-month price momentum vs SPY
```

---

## Three Views

| View | URL | What You See |
|------|-----|-------------|
| Chain Map | `/` | All 19 layers with tickers colored by pricing score. Green dot = funnel PASS. |
| Funnel | `/funnel` | PASS table sorted by pricing score + near-miss watchlist |
| Signals | `/signals` | DeepSeek V4 Flash thesis falsification proximity assessment per ticker |

---

## Running Locally

```bash
git clone https://github.com/Beltran12138/prophetmap.git
cd prophetmap
npm install

# Required for signal analysis only
cp .env.local.example .env.local
# Add DEEPSEEK_API_KEY=sk-...

# Update sector benchmarks (run once or weekly)
node scripts/update-benchmarks.js

# Update pricing scores (live Yahoo Finance data, ~6 min for 44 tickers)
node scripts/update-valuations.js

# Analyze thesis falsification signals via DeepSeek
node scripts/analyze-signals.js

# Start the dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Automation

GitHub Actions runs two jobs automatically:

- **`update-benchmarks`** — Every Monday 12:00 UTC. Recomputes layer-median P/E and EV/Revenue benchmarks from live data. Without this, pricing scores drift as sector valuations shift.
- **`update-daily`** — Weekdays 14:30 UTC (after US market close). Updates pricing scores + DeepSeek signal analysis. Commits to `data/` and triggers a Vercel redeploy.

**Secrets required** (GitHub repo → Settings → Secrets):
- `DEEPSEEK_API_KEY` — [platform.deepseek.com](https://platform.deepseek.com)
- `VERCEL_DEPLOY_HOOK` — Vercel project → Settings → Git → Deploy Hooks

---

## Universe & Governance

42 tickers across 15 layers. Defined in `data/universe.json` with static fields (thesis, physical constraint score, AI contribution estimate). Dynamic pricing scores written daily to `data/scores/YYYY-MM-DD.json`.

Governance protocol in `GOVERNANCE.md`. Three-tier structure:
- **Automated daily** — pricing scores, signal proximity
- **Quarterly human review** — benchmark recalibration, thesis validity
- **Event-triggered** — ADD/REMOVE decisions when new physical bottlenecks emerge or theses break

---

## Tech Stack

- **Next.js 15** App Router, server components, `force-dynamic` rendering
- **Yahoo Finance 2** (v3) for live market data
- **DeepSeek V4 Flash** for thesis falsification assessment
- **GitHub Actions** for automated data pipeline
- **Vercel** for deployment

---

## Why This Exists

Institutional coverage of AI infrastructure is dense at L0 (NVDA, MSFT) and sparse at L2.5–L5. The most durable alpha historically comes from identifying physical bottlenecks before consensus: the company that builds what AI needs next, not what it needs now.

ProphetMap is the tool I built to systematize that search — keeping personal portfolio decisions separate from the objective signal engine.

---

## License

MIT
