# ProphetMap

**AI Industry Chain Transmission Map** — an open-source US equity alpha engine built on the thesis that AI capex flows through a predictable multi-layer physical supply chain. ProphetMap tracks where that capital flows, scores each ticker against five independent dimensions, and surfaces buy-signal candidates before consensus catches up.

Live: **[prophetmap.vercel.app](https://prophetmap.vercel.app)**

Universe: **87 tickers across 28 layers** — universe `v2.9.10` (2026-07-28), latest framework change `v2.9.11` (2026-08-12). See [`CHANGELOG.md`](./CHANGELOG.md) for the full history and [`GOVERNANCE.md`](./GOVERNANCE.md) for the rules that constrain it.

### What actually distinguishes this

The screen is the visible part and the least interesting one. The engine's real
claim is that **a rating may not move quietly**. Three mechanisms enforce it:

- **Pre-declared falsifiers.** Every ticker carries a `thesisFalsification` array —
  observable events, written before the fact, that would invalidate it. A falsifier
  that is written but never tested is not a falsifier, so outcomes are logged in
  `falsificationObservations` **whether or not they fire**; "tested and survived" and
  "nobody looked" must not be the same shape in the file. Two classes of defect are
  recorded rather than hidden: *gameable* thresholds (satisfiable without validating
  the thesis) and *unmeasurable* ones — a falsifier whose expiry passed with no
  published number to test it against can never trigger and never be refuted, which
  turns a position into faith while it still looks like discipline.
- **Methodology events are separated from signals.** When the engine changes, names
  enter and leave the pass set for reasons that have nothing to do with the
  companies. Those commits state the full per-ticker delta up front, and a benchmark
  or peer change is not allowed to re-rate an existing holding as a side effect. The
  pricing gate has hysteresis (2.8 in / 3.2 out) precisely because a single-day
  threshold crossing is not an audit trail.
- **Defects are published, not fixed quietly.** [`GOVERNANCE.md`](./GOVERNANCE.md)
  carries **12 numbered gaps**, several marked *deliberately not fixed* with the
  reason — usually that the fix would silently re-rate names. One layer is recorded as
  **permanently** unanchorable: its external-peer count is 0 because every public
  comparable is either held or private, so its pricing output is a within-layer
  ranking and never an absolute valuation.

An engine allowed to revise its own history can prove anything. These are the
constraints that make the record worth reading.

### One question, three domains

**"Are these sources answering the same question?"**

Most tooling asks whether independent sources *agree*. This one asks whether they are
measuring the same thing at all — two sources can differ by 68 points and both be right.

The same five failure families keep surfacing in three unrelated domains. This repo is
the **self-built-scoring** instance: the one where the rule is turned on its author.

| repo | domain | the question it asks |
|---|---|---|
| [decision-confidence](https://github.com/Beltran12138/decision-confidence) | third-party risk vendors | do these vendors answer the same question? |
| [assay](https://github.com/Beltran12138/assay) | LLM-as-judge | does this metric measure what its name claims? |
| **prophetmap** ← you are here | self-built equity scoring | does my own score survive my own rule? |

Cross-domain evidence → [`failure-families.md`](https://github.com/Beltran12138/decision-confidence/blob/main/docs/failure-families.md)

> **Not investment advice, and deliberately not a portfolio.** ProphetMap emits
> screening signals, not position sizes ([`GOVERNANCE.md`](./GOVERNANCE.md) gap #5).
> The funnel is an **entry** gate: a held name dropping out of the pass set is not a
> sell signal.

---

## The Core Idea

AI demand doesn't teleport to software companies. It travels through a physical chain. Each layer has **physical bottlenecks** (fab lead times, power permits, optical fiber manufacturing, defense contract cycles) that create durable pricing power — the kind harder to compete away than software margins.

The universe is organized into **5 chains × 28 layers**:

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

## Five-Dimension Funnel

Every ticker is scored against five dimensions. Defensibility is an **either/or** —
a physical chokepoint *or* a non-physical moat the company actually captures — and
the remaining gates are conjunctive:

| Dimension | Pass Threshold | What It Measures |
|-----------|---------------|-----------------|
| `physicalConstraint` | **≥ 4 OR** ↓ | Moat depth: how hard is it to replicate this position? (1=pure software, 5=hard physical monopoly with multi-year lead times) |
| `moatCapture` | **≥ 4** (either suffices) | **Who keeps the moat.** A durable moat can exist and accrue entirely to someone else. 1 = pure supplier, the rent goes to the incumbent or the customer; 5 = the company itself holds the licence, the liability, the private ground truth or the user habit. `≤ 2` raises a **supplier-trap warning** — surfaced, never a veto. |
| `aiContribution` | ≥ 0.30 | What % of forward revenue growth is directly attributable to the AI thesis? |
| `timeToRealize` | `near` or `mid` | How soon does the thesis cash flow? (`near` = <12m, `mid` = 12-36m, `far` = 36m+) |
| `pricingScore` | **hysteresis: ≤ 2.8 to enter, > 3.2 to lose** | Is the market already pricing in the thesis? (1=deep value opportunity, 5=fully priced euphoria) |

Two details that are load-bearing rather than cosmetic:

- **The pricing gate has a hysteresis band, not a line.** One name crossed a hard
  3.0 threshold six times in sixteen trading days; a pass that flickers daily cannot
  be used as an audit record. Names sitting inside 2.8–3.2 are flagged as
  *carried over*, not as fresh signals.
- **Unpriceable fails closed.** When the pricing inputs do not apply to a name, the
  result is `pricingApplicable: false` and it does **not** pass. *No way to price it*
  is not the same as *cheap* — and a loss-making company being locked outside the
  gate by `forward P/E < 0` is recorded as a **policy**, not presented as a measurement.

### How the engine itself gets falsified

A screen nobody scores is a hobby. The engine's own claim is under a pre-registered
test with two gates that must both pass:

| | test | why this one |
|---|---|---|
| **Gate A — outcome** | the pass-set basket beats **SMH**, risk-adjusted | the claim is that picking *inside* the chain beats holding the chain. Beating a broad market index would only prove long beta — the most self-flattering benchmark available. |
| **Gate B — process** | ≥ 3 timestamped names that were genuinely non-consensus when the signal fired, and eventually right | an outcome gate alone can be passed by luck in one direction |

Window: 12 months, with a mid-point review that does not execute. Failing either
gate is a **result** — "this screen produces no stock-selection alpha" — not a bug,
and the honest response is to stop running it as if it did.

Gap #12 in [`GOVERNANCE.md`](./GOVERNANCE.md) records the sharpest known weakness of
that test: gate B currently stores *whether* a call was non-consensus but not *which
kind*. Since every input here is public and no sentiment is read, the engine can
structurally only produce analytical and technical edge — so **if the cases turn out
to be mostly behavioural, gate B passing would be a false positive.** That is a
falsifier gate B cannot generate about itself.

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

# Update pricing scores (live Yahoo Finance data, ~10 min for the equity book)
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

**87 tickers across 28 layers** (universe `v2.9.10`). Defined in `data/universe.json` with hand-set static fields (thesis, physicalConstraint, constraintType, moatCapture, moatLocks, moatFalsification, aiContribution estimate, timeToRealize, thesisFalsification signals, falsificationObservations). Dynamic pricing scores written daily to `data/scores/YYYY-MM-DD.json`. Signal alerts written to `data/alerts/YYYY-MM-DD.json`.

Every hand-set field is a judgement, and the ones that gate anything carry a written
falsifier. `constraintType`, `moatLocks` and `falsificationObservations` carry **zero
weight** — no gate reads them. They exist so that a future disagreement has something
specific to attack.

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
