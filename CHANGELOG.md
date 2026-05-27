# Changelog

All notable universe / layers / framework changes, dated.

---

## 2026-05-27 — INTC Added to L5 Secondary + MU "National-Champion" Falsification

Inspired by sell-side analyst raising MU PT from $535 to $1,625 (2.65× consensus PT $613) and Trump-administration semiconductor narrative. User proposed "US 国运股" framing — INTC唯一替代 TSM, MU唯一替代三星海力士. Framework explicitly REJECTS pricing-immunity grant. Universe `v2.2.1 → v2.2.2`. Net: **+1 new ticker (INTC L5 secondary), +2 thesisFalsification signals on MU, no portfolio motion**.

### Framework reaffirmation (no v0.7 reversal)

Same structural rejection as 2026-05-26 NVDA permanent-core elevation: "national champion" thesis is a faith-statement absent falsification conditions. Encoded into framework via:
- Thesis enters universe via standard ticker add (INTC) — runs daily funnel like every other ticker
- "National-champion" risk encoded as testable falsification signals on both MU and INTC (CHIPS Act delay/rescission; competitor US-fab ramp)
- NO override on pricingScore, NO pricing-immune bucket. Same logic that rejected NVDA permanent-core also rejects MU/INTC permanent-core.

### v2.2.2 — INTC Initial Add + MU Thesis Hardening

**INTC** (Intel) added to L5 secondary:
- `physicalConstraint: 4` (advanced packaging + 18A foundry capacity is real capital infrastructure)
- `aiContribution: 0.30` (border — Gaudi failed, but 18A external customer pipeline + AI-related foundry contracts pending)
- `timeToRealize: mid` (18A commercial ramp 2026-27)
- `layerRole: secondary` — TSM remains L5 primary because TSM Arizona fab is already producing N4, scheduled N3 by 2025, N2 by 2027. The "INTC唯一替代 TSM" framing is contradicted by current TSM Arizona output.
- 5 thesisFalsification signals: 18A yield gate, foundry external revenue floor, server CPU share decline, gross margin recovery, CHIPS Act rescission (shared signal with MU).
- Expected funnel outcome: FAIL on momentum/pricing dimensions when scored. Active status ≠ portfolio motion — universe entry only.

**MU** (Micron) thesisFalsification expanded:
- **+1**: CHIPS Act funding delayed/rescinded under Trump 2.0 (signal: Boise or Clay NY grant disbursement >12mo behind schedule). Shared with INTC.
- **+1**: Samsung Taylor TX + SK Hynix Indiana achieve >$3B combined US-domiciled memory revenue by C2027 — "only US alternative to Korean memory duopoly" framing invalidated on facts.

### Current funnel state (no change from 2026-05-26 scoring)

| Ticker | pricingScore | Consensus upside | mom6m | funnel |
|---|---|---|---|---|
| NVDA | 2.3 | +37% | +15.5% | ✅ PASS |
| AVGO | 2.9 | +16% | +19.7% | ✅ PASS |
| TSM | 2.8 | +16% | +33.1% | ✅ PASS |
| MU | 3.7 | −18% | +163% | ❌ FAIL |

If user's "US semiconductor national-champion" thesis is valid, framework already surfaces three better captures (NVDA, AVGO, TSM) — all funnel-PASS — over MU/INTC (both expected funnel-FAIL on entry).

### Inspired-loop guard

Per `feedback_inspired_loop.md` memory: 24h pause from sell-side report reading (2026-05-27 morning) before portfolio motion. This commit is universe maintenance + thesis hardening, NOT portfolio entry.

**Universe state:** 79 tickers, v2.2.2, active 48 / watchlist 29 / experimental 2.

---

## 2026-05-26 (afternoon) — ORCL thesisFalsification Response

Same-day discipline response to Gemini signal analysis result. Universe `v2.2.0 → v2.2.1`.

### v2.2.1 — ORCL active → watchlist

- **ORCL** (L0 secondary) demoted `active → watchlist`. Gemini signal analysis (alerts/2026-05-26.json) fired thesisFalsification #3 "OCI revenue growth falls below 30% YoY for two consecutive quarters" at **proximity=2** — single-quarter confirmation on record (Q reported 21.7% YoY, already below 30% threshold). Risk classified medium (not high/critical) but `thesisIntact=false`.
- Per ALAB v2.1.3 precedent: thesisFalsification trigger ≠ universe removal, only status downgrade. Two-quarter confirmation requires next earnings to reaffirm.
- `_note` added with re-entry conditions: (a) OCI single-quarter growth recovers >30% YoY, (b) management materially reframes Stargate/AI infra thesis with credible client wins, (c) forward P/E compresses to <15 with growth re-acceleration.
- **Cross-implication monitoring**: GOOG (L1) cloud revenue Q2 2026 — if growth also decel <30% YoY, escalate L0/L1 hyperscaler thesis review.

**Signal scope:** 48 active tickers analyzed. 0 critical / 0 high / 10 medium / 38 low. 1 thesisIntact=false (ORCL). SMCI maxProx=2 but thesis intact. 5 L9_MINER_CONVERT watchlist tickers not analyzed (analysisScope=active only). 4 metrics-fetch failures: COHR, RNDR, TAO, FIL.

**Universe state:** 78 tickers, v2.2.1, active 47 / watchlist 29 / experimental 2.

---

## 2026-05-26 — L9_MINER_CONVERT Sublayer + Inspired-Loop Guard

Session inspired by Meng Xing (Wuyuan Capital) "全员 token-maxxing" essay surfacing crypto-miner-to-AI-HPC pivot thesis (Leopold Aschenbrenner Situational Awareness Capital framing). Universe `v2.1.8 → v2.2.0`. Net: **+1 new sublayer, +5 new tickers, all watchlist (no active promotions)**.

### Layers (unchanged)

Layer count remains 27. New sublayer **L9_MINER_CONVERT** added without renumbering — parallel to L9 (data center REITs EQIX/DLR + construction FLR + cement CRH).

### Universe `v2.1.8 → v2.2.0`

#### v2.2.0 — Crypto miner → AI HPC pivot cohort

New sublayer **L9_MINER_CONVERT** disambiguates bitcoin/crypto miners with executed AI HPC pivots from L9 greenfield data center REITs and L7 pure-play AI cloud (CRWV remains L7 primary — already converted entity, not pivoting miner).

Thesis: Existing crypto miners hold power PPA + grid interconnect queue + land permits acquired 2017-2023 mining cycle. Post-2024 anti-data-center community resistance makes greenfield 18-36m moot. Miner sites with already-permitted MW capacity become physical bottleneck arbitrage when repurposed for AI HPC. Leopold Aschenbrenner Situational Awareness thesis vector.

**Cohort added (all watchlist, default per [[portfolio_decisions_2026Q2]] memory):**

- **APLD** L9_MINER_CONVERT primary (PC=5/AI=0.55/near). Polaris Forge ND + CoreWeave 15-yr ~250MW + Macquarie ~$5B strategic. Cohort leader.
- **CIFR** L9_MINER_CONVERT primary (PC=5/AI=0.45/near). Fluidstack 200MW Barber Lake TX + Block strategic equity. Stargate-adjacent.
- **WULF** L9_MINER_CONVERT primary (PC=5/AI=0.45/near). Lake Mariner NY nuclear-adjacent + Google debt backstop + Core42/Fluidstack lease. Cost-of-capital arbitrage differentiator.
- **IREN** L9_MINER_CONVERT secondary (PC=4/AI=0.35/mid). Childress TX 750MW + Microsoft AI cloud anchor. Incremental pivot, larger mining residual.
- **HUT** L9_MINER_CONVERT secondary (PC=4/AI=0.30/mid). Vega TX + Highrise compute partnership. Borderline AI dimension, weakest cohort confidence.

**Discipline notes:**
- All status=watchlist per portfolio_decisions_2026Q2 inspired-loop guard — 2025 prior run +200%~+1000% means much of pivot narrative priced in
- Entry triggers per-ticker include pricingScore ≤3.0 sustained 5 days + anchor lease milestone confirmed + peg threshold
- Manual sourcing via essay-driven thesis, NOT audit-script. Documented as such to maintain audit-vs-narrative separation.

**Source-bias warning logged:** Meng Xing (Wuyuan Capital LP letter genre) + Leopold Aschenbrenner (SAC fundraising literature) both have fund interest aligned with pivot thesis. See [[framework_vc_pitch_source_bias]] memory for three-layer deconstruction protocol applied.

**Rejected from cohort:**
- **CRWV** — already L7 primary (pure-play AI cloud after Core Scientific acquisition completion). Not a pivoting miner; not dual-listed.
- **MARA / RIOT** — no executed hyperscaler-class AI lease as of 2026-05-26. AI commentary only. Re-evaluate at next quarterly disclosure.
- **BTBT / BITF** — sub-$1B mcap or insufficient disclosure for ProphetMap entry threshold.

---

## 2026-05-19 → 2026-05-20 — Major Universe Expansion + Framework Discipline Sprint

Session resulting in **14 commits**, universe `v2.0.0 → v2.1.8`, layers `v1.2.0 → v1.4.0`. Net: **+2 new layers, +1 new chain, +5 new tickers, +9 status/note refinements**.

### Layers `v1.2.0 → v1.4.0`

- **New chain "E"**: 国防 AI 链 (Schmidt framework public-equity proxy)
- **New layer L11_FUEL** (position 11.5, chain B): Nuclear fuel feedstock — disambiguates uranium mining + Westinghouse JV from L11 reactor operators. PC=4. CCJ migrated from L11 bridge role.
- **New layer L_DEF** (position 99, chain E): Defense AI — drones, autonomous combat systems, defense software. PC=4. Houses AVAV (primary) + KTOS (secondary).

Layer count: 25 → 27.

### Universe `v2.0.0 → v2.1.8` (chronological)

#### v2.0.0 — Optical superCycle expansion
- **LITE** added to L8_OPT primary (PC=5/AI=0.80/near). EML 200G monopoly + NVDA $2B strategic lock-in + CPO external laser optionality.
- **TSEM** added to L3_5 secondary (PC=3/AI=0.50/mid). Silicon photonics foundry, technology-agnostic.

#### v2.1.0 — Nuclear fuel feedstock layer
- **CCJ** migrated from L11 bridge → L11_FUEL primary. New layer created after discovering L11/L12 already cover power generation + grid (anti-sycophancy correction to initial L_PWR proposal).

#### v2.1.1 — Live pricing housekeeping
- **ALAB** `_note`: pricingScore=3.8 funnel-fail documented; status remains active (thesis intact, entry timing failed).
- **LITE** `_note`: pricingScore=3.7 fail BUT peg=0.63 cheap — conflicting signal documented.
- **TSEM** demoted active → watchlist (triple-fail: PC=3<4 + pricingScore=4.1 + peg=7.15).
- **CCJ** demoted active → watchlist same day as migration (pricingScore=3.8 + peg=1.92 rich; Buffett observation: VST pricing=1.7 / CEG pricing=2.0 cheaper than CCJ — uranium narrative priced in ahead of fundamentals).

#### v2.1.2 — CRH promotion via G3 static-field re-eval
- **CRH** promoted watchlist → active. AI 0.18 → 0.32 (2026 Q1 Americas Materials disclosure: data center mega-campus = 25-30% of incremental cement demand). TTR far → mid (backlog already realizing). Four-dim full pass (PC=4/AI=0.32/TTR=mid/pricing=1.6). Audit-script promotion candidate + framework G3 validation both required for honest promotion.

#### v2.1.3 — ALAB thesisFalsification trigger response
- **ALAB** demoted active → watchlist. Gemini signal analysis flagged thesisFalsification signal #4 (Forward P/S >40x) at proximity=2 — pre-declared falsification condition fired same day. Discipline: thesisFalsification trigger ≠ universe removal, only status downgrade.

#### v2.1.4 — Defense AI layer + Schmidt path proxies
- **AVAV** added to L_DEF primary, watchlist (PC=4/AI=0.65/near). Tactical drones + loitering munitions, Q1 revenue +143% YoY. Schmidt framework's White Stork public-equity proxy.
- **KTOS** added to L_DEF secondary, watchlist (PC=4/AI=0.70/mid). Strategic autonomous combat aircraft + hypersonics testbed.

Manual screen of 13 defense candidates; 11 rejected (RTX/LMT/NOC/GD/HII/CW/BAH/LDOS/TDY/etc — mega-cap mismatch or AI marginal).

Powell Jobs path (medical/education AI) candidates screened: 8 tested, **0 pass funnel** (DUOL/TEM/RXRX/SDGR/VEEV/HIMS/COUR/CHGG all PC<4). Confirms framework rule that Powell Jobs path is retail-inaccessible.

#### v2.1.5 — AVAV/KTOS live pricing transparency
- **AVAV** `_note`: live pricingScore=2.8 (PASS) + peg=1.57 rich. Four-dim funnel pass same-day as addition. Status held at watchlist per self-imposed entry rules (5-day sustained pricing + Q2 BlueHalo synergies confirmation).
- **KTOS** `_note`: live pricingScore=3.0 borderline + peg=36.41 [severely overpriced]. New entry trigger added: peg <5.0 requirement.

#### v2.1.6 — Audit-vs-framework gap documentation
- **FLR / OKLO / SMR / AA** all received `_note` documenting audit promotion candidacy + framework rejection reason. Pattern: pricing-only audit signal vs PC/AI/TTR framework rejection. No status changes; transparency-only commit.

#### v2.1.7 — CPO slip falsification triggers
- **GLW** thesisFalsification 3 → 5: added CPO commercial deployment slip + segment growth <25% YoY checks (GLW 50% non-AI business mix). Anchored to Jensen Huang 2026-05-08 Corning partnership statement evaluation (narrative-stage hype, requires tempo verification).
- **COHR** thesisFalsification 3 → 4: added CPO slip generic trigger.
- **LITE** unchanged (existing NVDA GB300 copper-persistence trigger already covers CPO slip).

#### v2.1.8 — Utility scarcity narrative break trigger
- **CEG** thesisFalsification 3 → 4: utility scarcity narrative break trigger anchored to Berkshire Greg Abel 2026-05-03 statement ("energy demand still far below peak load capacity") + current CEG peg=3.74 [overpriced] signal.
- **VST** thesisFalsification 3 → 4: ERCOT load forecast revised >15% OR Abel-style disclosure of underutilized peak proves Texas tightness was temporary.

### Tools

#### `scripts/discover-candidates.js` hardened
Gemini prompt now requires mandatory industry verification step before thesis drafting. Bug surfaced when 3 candidates (ADI/ACLS/LSCC) were mis-framed by Gemini (EDA / materials / materials labels for analog-IC / equipment / FPGA companies). New output fields: `industryVerified`, `correctedLayer`, `correctionReason`.

#### `scripts/analyze-signals.js` watchlist opt-in
New env var `INCLUDE_WATCHLIST=true` extends signal analysis to watchlist tickers (Schmidt-path AVAV/KTOS previously invisible to falsification monitoring). Watchlist tickers excluded from critical/high issue creation — informational only.

### Universe state (post-session)
- **73 unique tickers** (was 67)
- **27 layers** (was 25)
- **5 chains** (was 4 active + experimental)
- Status distribution: 48 active / 23 watchlist / 2 experimental
- Funnel pass count: 11-14 depending on day (CRH/AVAV bring layer-level wins to L9/L_DEF)

### Methodology meta-learnings
- **Discovery script blind spots**: Yahoo Finance peer algo has mega-cap proximity bias. Cross-narrative candidates (defense AI / medical AI) require manual ticker-list screening.
- **layerRole filter gotcha**: Universe inspection must enumerate `primary/secondary/bridge` — not just `primary/secondary`. Two same-type errors in this session resulted from filtering by `primary/secondary` alone (missing CCJ bridge role and L11/L12 prior coverage).
- **G3 re-evaluation method**: When audit surfaces a promotion candidate that the framework rejects on static fields, look for recent disclosure (e.g., Q1 earnings segment data) that materially updates AI/TTR/PC. CRH was the only ticker among 5 candidates with such evidence; FLR/OKLO/SMR/AA all rejected.
- **thesisFalsification discipline**: When Gemini signal proximity ≥2 fires a pre-declared falsification condition, status must change (downgrade), otherwise falsification field becomes cosmetic. ALAB was the test case.
- **MCEO statement Buffett-rule**: Jensen Huang (Corning), Greg Abel (utility), and Peter Thiel (Panthalassa) statements during this session were all evaluated as narrative-stage with source bias. Not entry signals. Multiple statements with directly contradicting framing (Abel "peak underutilized" vs Schmidt/NVDA "shortage") indicate priced-in incompleteness — pricingScore becomes the arbitration mechanism.

---

## Pre-2026-05-19 history

See git log for individual commits. Key prior milestones:
- `v1.0.0` (2026-05-04): Initial universe of ~50 tickers, 19-layer architecture
- `v1.5.0` (2026-05-14): Universe scope locked to US equities + Crypto only
- `v1.6.0` (2026-05-15): IPO-day no-build rule established (Cerebras IPO trigger)
- `v1.7.0` (2026-05-11): CRH initial watchlist addition

---

_Authored 2026-05-20. This changelog tracks structural and discipline changes; daily pricing data lives in `data/scores/` and signal data in `data/alerts/`._
