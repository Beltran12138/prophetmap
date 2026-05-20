# ProphetMap

**AI Industry Chain Transmission Map** — an open-source US equity alpha engine built on the thesis that AI capex flows through a predictable multi-layer physical supply chain. ProphetMap tracks where that capital flows, scores each ticker against four independent dimensions, and surfaces buy-signal candidates before consensus catches up.

Live: **[prophetmap.vercel.app](https://prophetmap.vercel.app)**

Universe: **73 tickers across 27 layers** (v2.1.8, 2026-05-20). See [`CHANGELOG.md`](./CHANGELOG.md) for evolution.

---

## The Core Idea

AI demand doesn't teleport to software companies. It travels through a physical chain. Each layer has **physical bottlenecks** (fab lead times, power permits, optical fiber manufacturing, defense contract cycles) that create durable pricing power — the kind harder to compete away than software margins.

The universe is organized into **5 chains × 27 layers**:

### Chain A — Compute → Physical Infrastructure (mainline)
- **L0** AI Foundation Model & Platform (MSFT, AMZN, META, ORCL)
- **L1** AI Demand & Application (GOOG, PLTR)
- **L2** AI Training Compute (NVDA primary; AMD, CBRS)
- **L2_5** AI Inference & Edge Silicon (QCOM, ARM, MRVL, AVGO)
- **L3** EDA & Chip Design Tools (SNPS, CDNS; ALAB)
- **L3_5** Semiconductor Materials & Specialty Gases (ENTG, LIN; APD, TSEM)
- **L4** Semiconductor Manufacturing Equipment (AMAT, LRCX, ASML, KLAC)
- **L5** Advanced Packaging (AMKR, TSM)
- **L5_5** PCB & Substrates (TTMI)
- **L6** Memory & Storage / HBM (MU)
- **L7** Server OEM & EMS (CLS, CRWV, SMCI; DELL)
- **L8_NET** Data Center Network Interconnect (ANET)
- **L8_COOL** Data Center Cooling & Power (VRT; ETN)
- **L8_OPT** Optical Fiber & Transceiver (GLW, COHR, LITE)
- **L9** Data Center Construction & Real Estate (EQIX, DLR; FLR, CRH)
- **L10** Cybersecurity (CRWD, PANW)

### Chain B — Energy → Physical Resources
- **L11** Clean Baseload & Nuclear Power (CEG; VST, OKLO, SMR)
- **L11_FUEL** Nuclear Fuel Feedstock (CCJ) *(new 2026-05-19)*
- **L12** Grid Equipment & Electrical Infrastructure (GEV, PWR)
- **L13** Natural Gas Production (EOG; EQT)
- **L14** Critical Commodities (FCX, SCCO; AA)

### Chain C — Embodied Intelligence → Physical Execution
- **L_EMBI** Embodied AI Infrastructure (ISRG, CGNX; PH, TSLA)

### Chain D — Space Infrastructure
- **L_SPACE** Space Infrastructure (RKLB, ASTS; MOG)

### Chain E — Defense AI (new 2026-05-19)
- **L_DEF** Defense AI (AVAV; KTOS) — drones, autonomous combat systems

### Parallel — Decentralized AI Infrastructure
- **L_DCOMP** Decentralized AI Infrastructure (RNDR, TAO, FIL, LINK, ETH; CRCL)

### Experimental
- **L_EXP_QC** Quantum Computing (IONQ; RGTI) — graduation criteria in universe.json `_graduation`

---

## Four-Dimension Funnel

Every ticker is scored against four independent dimensions. A ticker must pass **all four** to qualify as a buy signal:

| Dimension | Pass Threshold | What It Measures |
|-----------|---------------|-----------------|
| `physicalConstraint` | ≥ 4 | Moat depth: how hard is it to replicate this position? (1=pure software, 5=hard physical monopoly with multi-year lead times) |
| `aiContribution` | ≥ 0.30 | What % of forward revenue growth is directly attributable to the AI thesis? |
| `timeToRealize` | `near` or `mid` | How soon does the thesis cash flow? (`near` = <12m, `mid` = 12-36m, `far` = 36m+) |
| `pricingScore` | ≤ 3.0 | Is the market already pricing in the thesis? (1=deep value opportunity, 5=fully priced euphoria) |

The `pricingScore` is computed live from Yahoo Finance data using a weighted composite:

```
30% × Forward P/E deviation from layer median
25% × EV/Revenue deviation from layer median
25% × Analyst consensus upside (inverted — low upside = high score)
20% × 6-month price momentum vs SPY
```

Crypto tickers (L_DCOMP) use a separate `pricingScore` formula (35% Market Cap / Protocol Revenue, 35% Market Cap / TVL, 30% 6m momentum vs ETH inverted) computed via `update-crypto-valuations.js`.

---

## Three Views

| View | URL | What You See |
|------|-----|-------------|
| Chain Map | `/` | All layers with tickers colored by pricing score. Green dot = funnel PASS. |
| Funnel | `/funnel` | PASS table sorted by pricing score + near-miss watchlist |
| Signals | `/signals` | Gemini 2.5 Flash thesis falsification proximity assessment per ticker |

---

## thesisFalsification Discipline

Every ticker has an explicit `thesisFalsification` array — observable events that would invalidate the thesis. The signal analysis pipeline (Gemini 2.5 Flash) assesses proximity (0=intact, 1=watch, 2=approaching, 3=imminent) for each signal daily.

**Discipline rule**: When a pre-declared falsification signal fires at proximity ≥2, status must change (e.g., active → watchlist), otherwise the falsification field becomes cosmetic. Distinction maintained: thesis-itself breaks → universe removal; entry-timing thesis fails → status downgrade only.

---

## Running Locally

```bash
git clone https://github.com/Beltran12138/prophetmap.git
cd prophetmap
npm install

# Required for signal analysis
cp .env.local.example .env.local
# Add GEMINI_API_KEY=AI...  (https://aistudio.google.com/apikey)

# Update sector benchmarks (run once or weekly)
node scripts/update-benchmarks.js

# Update pricing scores (live Yahoo Finance data, ~7-10 min for 67 equity tickers)
node scripts/update-valuations.js

# Update crypto pricing scores (CoinGecko + DeFiLlama, no API key)
node scripts/update-crypto-valuations.js

# Analyze thesis falsification signals via Gemini 2.5 Flash
node scripts/analyze-signals.js
# Opt-in to also analyze watchlist tickers (informational, no critical alerts):
INCLUDE_WATCHLIST=true node scripts/analyze-signals.js

# Surface new candidates via Yahoo peer recommendations + Gemini industry verification
node scripts/discover-candidates.js

# Universe audit (promotion/demotion candidates, no writes)
node scripts/audit-universe.js

# Layer audit (correlation, merge flags, layer health)
node scripts/audit-layers.js

# Start the dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Automation

GitHub Actions runs three workflow groups:

- **`daily`** — Weekdays 14:30 UTC (after US market close). `update-valuations` + `update-crypto-valuations` + `analyze-signals`. Commits to `data/` and triggers Vercel redeploy. CRITICAL/HIGH signals create GitHub issues.
- **`update-benchmarks`** — Every Monday 12:00 UTC. Recomputes layer-median P/E and EV/Revenue benchmarks. Without this, pricing scores drift as sector valuations shift.
- **`audit`** — Weekly Sunday 13:00 UTC (universe promotion/demotion) + monthly 1st 11:00 UTC (candidate discovery + layer audit). Surfaces candidates only; never auto-modifies universe.

**Secrets required** (GitHub repo → Settings → Secrets):
- `GEMINI_API_KEY` — [aistudio.google.com](https://aistudio.google.com/apikey)
- `VERCEL_DEPLOY_HOOK` — Vercel project → Settings → Git → Deploy Hooks

Migration note: signal analysis migrated from DeepSeek to Gemini 2.5 Flash on 2026-05-10 due to DeepSeek API geo-restriction blocking GitHub Actions US runners. Local `.env` `DEEPSEEK_API_KEY` reference deprecated.

---

## Universe & Governance

**73 tickers across 27 layers** (v2.1.8). Defined in `data/universe.json` with static fields (thesis, physicalConstraint, aiContribution estimate, timeToRealize, thesisFalsification signals). Dynamic pricing scores written daily to `data/scores/YYYY-MM-DD.json`. Signal alerts written to `data/alerts/YYYY-MM-DD.json`.

Governance protocol in `GOVERNANCE.md`. Three-tier:
- **Automated daily** — pricing scores, signal proximity, Gemini falsification check
- **Quarterly human review** — benchmark recalibration, thesis validity
- **Event-triggered** — ADD/REMOVE decisions when new physical bottlenecks emerge or theses break (with thesisFalsification trigger response discipline)

Universe versioning follows semantic-style:
- **Patch** (`v2.1.x`): `_note` housekeeping, status changes, single-field updates
- **Minor** (`v2.x.0`): new tickers, layer migrations, thesisFalsification additions
- **Major** (`vx.0.0`): new layers, chain restructuring

Each universe change is recorded in the ticker's `_changeLog` array and aggregated in [`CHANGELOG.md`](./CHANGELOG.md).

---

## Tech Stack

- **Next.js 15** App Router, server components, `force-dynamic` rendering
- **Yahoo Finance 2** (v3) for live equity market data
- **CoinGecko + DeFiLlama** for crypto pricing (L_DCOMP layer)
- **Gemini 2.5 Flash** for thesis falsification assessment
- **GitHub Actions** for automated data pipeline
- **Vercel** for deployment

---

## Why This Exists

Institutional coverage of AI infrastructure is dense at L0 (NVDA, MSFT) and sparse at L2_5–L8_OPT (specialty silicon, packaging, optics). The most durable alpha historically comes from identifying physical bottlenecks before consensus: the company that builds what AI needs next, not what it needs now.

Recent expansion (chains B–E) reflects the thesis that AI capex doesn't stop at the rack — it propagates to **power generation (L11/L11_FUEL)**, **grid equipment (L12)**, **commodities (L14)**, **embodied execution (L_EMBI)**, **space (L_SPACE)**, and **defense AI (L_DEF)**. Each chain has its own funnel discipline; the framework rejects cross-narrative drift.

ProphetMap is the tool I built to systematize that search — keeping personal portfolio decisions separate from the objective signal engine.

---

## License

MIT
