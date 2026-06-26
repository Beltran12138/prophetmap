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

## Known Governance Gaps (v1.0)

1. **No per-ticker change log** — physicalConstraint/aiContribution changes leave no audit trail. Future: add `_changeLog: [{date, field, from, to, reason}]` per ticker.
2. **Experimental graduation not fully defined** — IONQ/RGTI graduation requires: fault-tolerant qubit demo (<0.1% logical error rate). Needs explicit threshold per experimental ticker.
3. **watchlist → active trigger not automated** — currently manual. Future: `update-valuations.js` should flag when watchlist ticker pricingScore ≤ 2.5 for 5 consecutive trading days.
4. **Sector benchmarks update is manual** — no automation for refreshing P/E and EV/Revenue medians. Risk: stale benchmarks distort pricing scores silently.
5. **No position-size guidance** — ProphetMap generates alpha signals, not portfolio weights. Users must apply their own sizing rules (e.g., Kelly criterion, equal-weight by funnel score).
