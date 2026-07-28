# ProphetMap Universe Governance

Three-tier maintenance system: automated daily, quarterly human review, event-triggered structural changes.

---

## Tier 1 — Automated (daily, no human)

| What | Script | Output |
|------|--------|--------|
| Pricing score (1-5) | `update-valuations.js` | `data/scores/YYYY-MM-DD.json` |
| Thesis falsification proximity | `analyze-signals.js` | `data/alerts/YYYY-MM-DD.json` |
| Critical signal GitHub Issue | `daily.yml` workflow | Auto-issue with `critical-signal` label |

**No action required unless alert generated.**

---

## Tier 2 — Quarterly Human Review

Trigger: first week of earnings season — January, April, July, October.

### Checklist

- [ ] Re-score `physicalConstraint` for all tickers (1-5 scale)
  - Criteria: has new technology emerged that reduces physical scarcity?
  - Document change reason in `_lastReviewed` field
- [ ] Re-score `aiContribution` for all tickers
  - Criteria: based on latest earnings guidance and segment disclosures
  - Flag if dropped below 20% for two consecutive quarters → consider removal
- [ ] Update `data/sector-benchmarks.json`
  - Refresh `medianForwardPE` and `medianEVRevenue` from FactSet/Bloomberg consensus
- [ ] Review `watchlist` tickers
  - Promote to `active` if: thesis has confirmed catalyst + pricingScore ≤ 3 for 30+ days
  - Archive if: no thesis catalyst in 6 months
- [ ] Review `experimental` tickers
  - Graduate to `active` if: defined graduation threshold met (see per-ticker thesis)
  - Archive if: 12 months with no measurable technology progress signal
- [ ] Backfill `supplyChainEvidence` + `catalysts` on existing `active` `primary` tickers (rolling)
  - Target: every `primary` carries ≥1 external evidence entry and ≥1 dated catalyst, oldest-unverified first
  - A `primary` that cannot be evidenced externally after one full review cycle → reconsider `primary` role (it is a narrative pick, not a verified chokepoint)
  - Mark a catalyst whose `date` has passed with no thesis movement as a soft falsification flag for that ticker

---

## Tier 3 — Event-Triggered Structural Changes

### ADD a ticker

**Trigger (any of):**
- IPO or spinoff with demonstrable AI exposure
- Existing company announces material AI business pivot (>30% of forward revenue)
- Layer has <2 primary tickers and a gap in representation is identified
- Quarterly review identifies a structural blind spot in the chain

**Gate criteria (ALL must pass):**
- Market cap ≥ $1B USD
- AI contribution thesis articulable in one sentence
- `aiContribution` estimate ≥ 0.20
- Layer assignment unambiguous
- At least 2 specific, falsifiable `thesisFalsification` signals can be written
- Not a duplicate of existing ticker's thesis (check overlap)
- **≥1 `supplyChainEvidence` entry** — at least one EXTERNAL proof (patent cross-reference / teardown / regulatory filing / third-party report) that the ticker actually occupies its mapped chokepoint. Company IR self-report or press release does NOT count. If the only basis for chain position is the company's own claim, the entry is narrative, not a chokepoint — do not add as `primary`; `secondary`/`watchlist` only, with the gap noted.
- **≥1 `catalysts` entry with a dated event** — `timeToRealize` of `near`/`mid` must be backed by at least one concrete dated catalyst (`{date, event, source}`), not asserted. A `far` ticker may omit but should note why no catalyst is datable yet.

**Process:** PR to `data/universe.json` with full schema entry including thesis, falsification signals, supply-chain evidence, and catalysts.

> **Provenance (v2.5.0, 2026-06-18):** the `supplyChainEvidence` + `catalysts` gates were distilled from the Serenity Taiwan-CPO methodology (TechFlow 2026-06-09) — **method borrowed, tickers rejected** (KOL talking own book = reverse indicator; Taiwan small-caps outside US universe by design). The two transferable disciplines: (1) verify chain membership by external fingerprint, not IR; (2) date the catalyst instead of saying "future." Per `inspired_loop` discipline this was a template change, not a portfolio motion.

---

### REMOVE a ticker

**Trigger (any of):**
- `analyze-signals.js` reports falsification signal proximity = 3 (confirmed) for any signal
- `aiContribution` estimated < 0.15 for two consecutive quarterly reviews
- M&A: ticker absorbed into another universe member
- Market cap falls below $500M for 30+ consecutive days
- `experimental` ticker with no technology milestone in 18 months

**Process:**
1. Change `status` to `"archived"`
2. Add `_archivedReason` field with date and one-line reason
3. Ticker remains in file for historical record — never hard-deleted

---

### CHANGE layer assignment

**Trigger:**
- Technology disruption makes a ticker more relevant to an adjacent layer
- Layer merge/split event (see below)

**Process:** Update `layer` and `layerRole` fields + document in `_changeLog` within ticker entry.

---

### MODIFY layer architecture (layers.json)

**New layer criteria (ALL must pass):**
- ≥ 3 distinct tickers that fit without forcing
- Clear physical constraint descriptor distinct from all existing layers
- AI transmission logic — how does AI demand propagate FROM the layer above?
- At least 2 specific falsification signals for the layer's `auditCriteria`

**Layer merge criteria:**
- Distinct theses no longer differentiated (e.g., L2_5 inference layer merges back to L2 if NVDA captures >65% inference market share — its own falsification signal)
- Fewer than 2 tickers remain after removals

**Layer split criteria:**
- Layer has >6 active tickers with materially different thesis drivers
- Physical constraint rating differs by ≥2 points between sub-groups

**Process:** PR to `data/layers.json` with updated schema + corresponding `data/universe.json` ticker reassignments.

---

### CHANGE a layer's `peers` list (v2.8.0)

`peers` in `data/sector-benchmarks.json` sets the layer's median Forward P/E and EV/Revenue, which together drive **55% of every pricingScore in that layer**. It is the single highest-leverage manual input in the system and it had no rule until now.

**Two failures this rule exists to prevent, both observed:**

1. **Self-reference.** Until 2026-07-28 `update-benchmarks.js` never read `peers` at all and sampled universe members only — a layer's "sector median" was the median of the book, so it could not look expensive relative to itself. L6 held one member (MU), making its median *equal to MU*, pinning both deviations at 0 and rendering 55% of its pricingScore informationless. Reading `peers` fixed half of it; the other half is that a peer list made of holdings restores the same defect. As of 2026-07-28, **L0's peers were MSFT/AMZN/META/ORCL — 4/4 universe members, i.e. still fully self-referential.**
2. **Silent re-rating.** Adding CRDO to L8_NET moved the layer median −23% and **single-handedly knocked the holding ANET out of PASS** (v2.7.1). A watchlist addition re-rated an existing position through a shared benchmark.

**Rules (ALL must hold):**

- **≥ 2 external peers** — declared peers that are NOT universe members in that layer. `update-benchmarks.js` counts these, writes `_externalPeerCount`, and flags `_selfReferential: true` below the threshold. It does not auto-fix.
- **≥ 4 valid names** in the combined sample (peers ∪ members) with live ratios. Below 3 the script already writes `_degenerate: true`; treat such a median as advisory and do not let a PASS rest on it.
- **Business-model match** — a peer must earn money the same way as the layer, not merely sit in the same end market. Mixing structurally different margin and capital-intensity profiles (e.g. DRAM alongside HDD, or a fabless designer alongside a contract assembler) produces a median that describes no real company. Note the mismatch in the entry if a compromise is unavoidable.
- **A watchlist addition must never silently re-rate a holding.** Before accepting a peer-list change, re-run `update-valuations.js` and record the pricingScore delta for **every** ticker in the layer, not just the new one. If a holding's funnel state flips, that flip is a *methodology* event and must be labelled as such — it is not a buy/sell signal.
- **Record the change** in the layer's benchmark entry with date, reason, and the observed rating delta.

**Removing a peer is as consequential as adding one** — JNPR (acquired by HPE) leaving L8_NET moved ANET's pricingScore 3.0 → 4.0. Delisted or acquired peers must be replaced, not merely deleted.

---

## Conceptual Frame — Solvability × Capture (v2.6.0)

The two structural screening axes are not redundant; together they form a 2×2.

**Axis 1 — AI-Solvability** (Hassabis, YC 2026-04-29). His three conditions for where today's methods reliably find the needle: (1) a combinatorial search space too large for brute force, (2) a *cleanly definable objective function* to ascend, (3) enough data — or an in-distribution simulator to synthesize it. The more a domain satisfies all three, the faster "doing the thing" commoditizes: anyone with data + compute converges on the solution. `physicalConstraint` is the inverse proxy — a low score means no physical chokepoint, i.e. high solvability.

**Axis 2 — Value-Capture** (`moatCapture`, Guo 2026). Given the thing *gets* solved, WHO keeps the value.

The axes are orthogonal, and Hassabis self-certifies it: protein folding satisfied all three solvability conditions, DeepMind solved it, then **open-sourced AlphaFold for free**. Capture moved downstream to Isomorphic (proprietary compound data + clinical + licensing). **Solved ≠ defensible.**

|  | **Capture HIGH** (moatCapture ≥ 4) | **Capture LOW** (moatCapture ≤ 2) |
|---|---|---|
| **Solvable HIGH** (physicalConstraint low) | Non-physical moat — the rescues (PLTR, META, GOOG, QCOM): cheap to build, but licensing / liability / data / habit lock holds | **Supplier-trap** — cheap AND undefensible (CLS, SMCI, miner-hosts). Pricing alone promotes them; the trap flag is the counterweight |
| **Solvable LOW** (physical chokepoint) | Physical + capture both (ASML, TSM, ISRG): strongest quadrant | Commodity price-taker (FCX, EOG, AA): physical-geographic moat leaks to spot pricing |

The funnel's defensibility gate — `physicalConstraint ≥ 4 OR moatCapture ≥ 4` — is exactly "strong on at least one axis." The supplier-trap warning fires on the bottom-left cell.

**Boundary — do not misread the solvability axis as a trading signal.** Condition (2), a definable objective function, is the real bottleneck and the one that silently fails in markets: prices are reflexive (your own bet deforms the objective's landscape), "maximize return" Goodharts the instant it becomes the optimization target, and condition (3)'s "in-distribution" excludes the regime shifts that actually matter. This frame screens the *business* solvability of universe names — it is NOT a claim that an AlphaGo-for-trading exists.

> **Provenance (v2.6.0, 2026-06-26):** the `moatCapture` dimension came from Guo's "what's left of the moat" essay (TechFlow 2026-06-11); this 2×2 fuses it with Hassabis's three-condition heuristic (YC 2026-04-29). Both are KOL/founder sources read under `vc_pitch_source_bias` discipline — Hassabis's self-interest runs toward AGI-capex optimism, so only the falsifiable, cuts-against-interest claims were kept. Per `inspired_loop`, this is a documentation/thesis change, not a portfolio motion.

---

## Conceptual Frame — Constraint Decay & the Expectation Denominator (v2.8.0)

Two observations about fields that already existed, not two new dimensions. Both are **zero-weight surfacing**: no gate reads either, and this release changed no ticker's PASS/FAIL state.

### 1. `physicalConstraint` conflates two constraints that decay at different speeds

ASML scores 5 on multi-year EUV process lead time. CRH scores 4 on aggregate transport-radius economics. The five `L9_MINER_CONVERT` names score 4–5 on **already-permitted grid interconnect and energised capacity**. These are not the same asset:

- **tech** — process, IP, accumulated know-how. Decays endogenously, along a roadmap that is visible years ahead in capex and R&D disclosure.
- **geo** — transport radius, mineral rights, siting, interconnect queue position, permitted capacity. **Rented from a jurisdiction, not owned.** Decays exogenously: a tax incentive, a permitting reform, or a competitor's capacity coming online resets it on no schedule you can observe from the filings.
- **regulatory** — licence, approval, liability, defence contract.
- **unclassified** — the score has no physical referent. This tag currently marks a real debt: LINK and ETH carry `physicalConstraint = 4` for what is network effect, not physics. Flagged, deliberately **not** silently repriced.

Current distribution across the 52 tickers with pc ≥ 4: **33 tech · 12 geo · 5 regulatory · 2 unclassified**.

**Falsifiable claim:** geo-type pc ≥ 4 names underperform tech-type pc ≥ 4 names on a risk-adjusted basis over a full cycle, because the funnel currently credits both as if permanent. If after 12 months there is no separation between the two cohorts, this distinction is decoration and should be deleted rather than promoted to a gate.

### 2. Every gate is denominated in expectation except one

`aiContribution` is a share of **forward** revenue growth. `pricingScore` leans on forward P/E and analyst target prices. Backlog, capex guidance and order books — the evidence base for most AI-chain theses — are the same species: statements of intent, which are the cheapest thing to produce in a capex cycle and the first thing to be revised.

Worse, `aiContribution` is a **hand-set static value in `universe.json`** while its denominator moves daily. Consensus can be marked down for a quarter with the funnel showing no change at all.

`realizationCheck` records the two things intent cannot fake:

- `estimateRevision` — +1y consensus EPS now vs 90 days ago. The direction the whole forward-looking apparatus is being repriced in.
- `surpriseHitRate` — beats over the last four reported quarters, and average surprise. Whether this issuer historically delivers on the bar it was given.

**Known limitation:** Yahoo exposes a revision history for EPS but not for revenue, so the revision leg is EPS-based while `aiContribution` is revenue-denominated. It is a proxy and is labelled as one.

**Deliberately not a gate.** A revision filter is momentum wearing fundamental clothing — it would buy names whose estimates are already being marked up, which is exactly the crowded, late, reflexive trade the A/B discipline treats as a reverse indicator. It earns a gate only if the audit trail shows revision divergence leading funnel-state changes, not trailing them.

> **Provenance (v2.8.0, 2026-07-28):** prompted by a Thai FDI report (BlockBeats 2026-07-23) in which "investment applications" — an intent number — rose 80% and were read as realised industrial capability. The transferable defects were the two above: geographic moats are rented and decay exogenously, and an intent metric quietly substituted for a delivery metric. Per `techpull_gate`, the expectation-denominator problem was already latent in the v2.7.1 self-reference work; the news supplied the analogy, not the motive. Per `inspired_loop`, this is an instrumentation change and **not a portfolio motion** — no PASS/FAIL state moved.

---

## Known Governance Gaps (v1.0)

1. **No per-ticker change log** — physicalConstraint/aiContribution changes leave no audit trail. Future: add `_changeLog: [{date, field, from, to, reason}]` per ticker.
2. **Experimental graduation not fully defined** — IONQ/RGTI graduation requires: fault-tolerant qubit demo (<0.1% logical error rate). Needs explicit threshold per experimental ticker.
3. **watchlist → active trigger not automated** — currently manual. Future: `update-valuations.js` should flag when watchlist ticker pricingScore ≤ 2.5 for 5 consecutive trading days.
4. **Sector benchmarks update is manual** — ~~no automation~~ resolved in part: `update-benchmarks.js` now recomputes medians weekly. Remaining risk: **peer selection** is still the manual input driving 55% of every pricingScore. Rules defined in § CHANGE a layer's `peers` list (v2.8.0); enforcement is surfacing-only, so a self-referential layer warns but still computes.
5. **No position-size guidance** — ProphetMap generates alpha signals, not portfolio weights. Users must apply their own sizing rules (e.g., Kelly criterion, equal-weight by funnel score).
6. **`constraintType` unset for pc < 4 tickers** (v2.8.0) — only the 52 names that clear the defensibility gate on physical grounds are classified, since only they use the score. A ticker promoted past pc 4 in a quarterly review must be classified at the same time.
7. **`physicalConstraint` is metaphorical for crypto** (v2.8.0) — LINK and ETH hold pc = 4 for network effects, not physics, and are tagged `unclassified`. Either a crypto-native defensibility measure is defined or their pc scores are restated; until then their defensibility gate result is not comparable to an equity's.
