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

#### Layer proposals evaluated and rejected

Kept so a rejected proposal is not re-litigated from scratch, and so the reason is auditable if it changes.

**Grid-scale / behind-the-meter storage — REJECTED 2026-07-29, conditionally.** Proposed off a Goldman Sachs report (2026-07-16) framing storage as the fastest route around the interconnect queue.

| Criterion | Verdict |
|---|---|
| ≥3 tickers that fit without forcing | **FAIL** — see below |
| Distinct physical constraint descriptor | **PASS**, cleanly |
| AI transmission logic | **PASS** |
| ≥2 layer falsification signals | **PASS** (drafted, unused) |

The constraint argument is genuinely physical and is the strongest part of the proposal: GPU load swings 0→100% in milliseconds; gas turbines tolerate roughly two start-stops per day and there are reports of new combined-cycle units failing shafts inside seven months under load cycling; grid expansion runs 4–8 years against 12–18 months for storage deployment. That is a distinct constraint — **deployment speed and ramp rate**, not generation capacity (L11), not equipment lead time (L12), not fuel (L13). Demand denominator is independently sourced: BloombergNEF puts US data centers at ~20% of national electricity by 2035 against 5.9% today, 12% by 2030.

**It fails on ticker supply.** US-listed, investable, and not already placed: FLNC is the only real candidate. NRGV is a sub-$3 name the same report rates Neutral; SHLS's BESS line is guided to $30–35M of 2026 revenue, i.e. immaterial. TSLA already sits in `L_EMBI` and its energy business is guided at ~21% of 2028 revenue, so it is a partial-exposure name, not a pure play. CATL, LGES, Samsung SDI and 阳光电源 are outside the book's stated edge circle. **One name is not a layer** — it is a ticker, and forcing a layer around it produces exactly the self-referential benchmark the v2.8.0 peer rule exists to prevent.

**Two substantive objections, recorded because they would survive even if the ticker count were met:**

1. **Value capture is unresolved between the cell and the integrator.** CATL holds roughly 30% of the global storage-battery market. FLNC is a systems integrator, not a cell manufacturer. If scarcity sits in cell capacity, the value accrues to names outside the edge circle; if it sits in integration, FLNC has a claim. The report's "arms dealer" framing blurs the two, and the proposal cannot be scored without resolving it.
2. **FLNC's stated moat is a gatekeeper permission** — exclusive battery partner status for NVIDIA's DSX Vera Rubin reference architecture. Per §3a that is the licensee sense, and NVIDIA has every commercial incentive to multi-source a reference-architecture component. **Third independent instance of the queue test, and the first on a candidate this file itself proposed.**

**Reopen if:** two further US-listed pure-play storage names reach investable scale, OR the cell-versus-integrator capture question resolves toward integration with evidence. Source bias noted: the originating report is sell-side, carries FLNC at Buy with the price target raised $20 → $22, and rates other names in the same note Neutral and Sell.

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

Current distribution across the **50** tickers with pc ≥ 4: **32 tech · 12 geo · 4 regulatory · 2 unclassified**. *(Recounted 2026-07-29. The previously stated "52 · 33 tech · 5 regulatory" was stale by one in two buckets before this commit; one further regulatory name left the pc ≥ 4 cohort in v2.9.4, see §3.)*

**Falsifiable claim:** geo-type pc ≥ 4 names underperform tech-type pc ≥ 4 names on a risk-adjusted basis over a full cycle, because the funnel currently credits both as if permanent. If after 12 months there is no separation between the two cohorts, this distinction is decoration and should be deleted rather than promoted to a gate.

### 2. Every gate is denominated in expectation except one

`aiContribution` is a share of **forward** revenue growth. `pricingScore` leans on forward P/E and analyst target prices. Backlog, capex guidance and order books — the evidence base for most AI-chain theses — are the same species: statements of intent, which are the cheapest thing to produce in a capex cycle and the first thing to be revised.

Worse, `aiContribution` is a **hand-set static value in `universe.json`** while its denominator moves daily. Consensus can be marked down for a quarter with the funnel showing no change at all.

`realizationCheck` records the two things intent cannot fake:

- `estimateRevision` — +1y consensus EPS now vs 90 days ago. The direction the whole forward-looking apparatus is being repriced in.
- `surpriseHitRate` — beats over the last four reported quarters, and average surprise. Whether this issuer historically delivers on the bar it was given.

**Known limitation:** Yahoo exposes a revision history for EPS but not for revenue, so the revision leg is EPS-based while `aiContribution` is revenue-denominated. It is a proxy and is labelled as one.

**Deliberately not a gate.** A revision filter is momentum wearing fundamental clothing — it would buy names whose estimates are already being marked up, which is exactly the crowded, late, reflexive trade the A/B discipline treats as a reverse indicator. It earns a gate only if the audit trail shows revision divergence leading funnel-state changes, not trailing them.

### 3. `constraintType: "regulatory"` — queue or chokepoint? (v2.9.4)

§1 lists `regulatory` as a constraint kind but attaches no test to it. This is the test.

A regulatory constraint earns `physicalConstraint ≥ 4` only if the licence is **rationed** — that is, if the number of grants is capped by something other than the regulator's own throughput. The discriminating measurement is not "is this hard to get?" but **"at what rate are competitors clearing it, and is there a ceiling on how many can?"**

| | Test | Example |
|---|---|---|
| **Chokepoint** — pc ≥ 4 earned | Grants are capped by a scarce underlying thing | Exclusive spectrum (finite MHz); classified programme access; an installed base carrying its own clearance |
| **Queue** — pc ≥ 4 not earned | Any qualified applicant can enter; the only limit is processing time | An open application window |

**Applied 2026-07-29 to CRCL.** The rating asserted a chokepoint on stablecoin-issuer licensing. Measurement: the OCC granted conditional national trust charters to Circle, Ripple, Paxos, Fidelity Digital Assets and BitGo in December 2025 and to Stripe's Bridge in February 2026, with applications pending from Coinbase, Crypto.com, Protego, Morgan Stanley, Payoneer, Zerohash and World Liberty Financial. **Eleven firms clearing inside roughly three months is a queue.** `physicalConstraint` re-rated **4 → 3**. `funnelPass` unchanged — `moatCapture = 4` carries the defensibility OR-gate alone, verified by offline simulation before the edit.

**Reversibility is part of the test.** The ABA and the Bank Policy Institute have both urged the OCC to slow approvals pending GENIUS Act rulemaking. If the pace stops, the constraint is rationed again and the rating should be restored. This is recorded as an explicit re-check in the CRCL `falsificationObservations` entry, not left as a matter of judgement.

**NOT applied to the other four `constraintType: "regulatory"` holdings** — ISRG (pc 5), ASTS (pc 5), AVAV (pc 4), KTOS (pc 4). They were **not audited** in this commit and **no view is recorded on them**. Their constraints are prima facie of a different species (device clearance on an installed base, exclusive spectrum, defence programme access), but "prima facie" is not a measurement. **Open item.**

#### 3a. Generalised to `moatLocks: "licensing"` — but first, the field means two opposite things (v2.9.5)

The queue-vs-chokepoint test above was written against `constraintType`. `constraintType: "regulatory"` covers 5 tickers; **`moatLocks: "licensing"` covers 14**, which is the range the test should actually sweep. Sweeping it surfaced a defect in the field itself, which has to be resolved before the test can be applied.

**`licensing` is used for two economically opposite positions:**

| Sense | Who you are | What it is | Test that applies |
|---|---|---|---|
| **Licensor** — you collect | You *are* the gatekeeper; others pay you a royalty | A genuine moat. Its decay is substitution of your IP, not withdrawal of a permission | **Not** the queue test. Test is: can the payers switch? |
| **Licensee** — you hold a permit | A gatekeeper granted you admission | **A revocable permission, not an asset.** Widening the gate dilutes it without anyone taking anything from you | **The queue test** |

Confirmed from the tickers' own `moatFalsification` text, not inferred:

- **QCOM** — *"Modem SEP royalties erode (Apple in-house) AND AI-edge fails to replace **the licensing stream**"* → licensor.
- **ARM** — *"RISC-V open ISA displaces Arm in key sockets — **licensing moat was switching-cost, not necessity**"* → licensor.
- **OKLO** — *"NRC licensing fails/delays … (pre-revenue; **licensing IS the moat and the bottleneck**)"* → licensee.
- **SMR** — *"First and only NRC-certified small modular reactor design … design certification remains as competitive moat"* → licensee.

**Rule.** The queue test applies to the **licensee** sense only — 12 of the 14. For the licensor sense (QCOM, ARM) a widening gate is irrelevant or even favourable; the correct falsifier is substitution, which both tickers already carry.

**Two independent instances now support the test**, from unrelated domains inside eight days of each other:

| Gatekeeper | Widening | Rate |
|---|---|---|
| OCC — stablecoin issuer trust charters | 5 conditional (Dec 2025) → +Bridge (Feb 2026) → 7 pending | 11 firms / ~83 days |
| Anthropic — Project Glasswing frontier-model access | 45 orgs (2026-04-07) → 195 orgs (2026-06-02), 15+ countries | 150 additions / ~8 weeks |

The Glasswing case is the cleaner demonstration because the gatekeeper is **paying to widen** — up to $100M in usage credits. **When admission is subsidised, admission is not scarce**, and the direction of the subsidy is the direction of the scarcity. Anything of the form "company X has privileged access to Y" should be run through this before it is treated as a screen.

**Scan result — the two single-lock exposures.** Of the 12 licensee-sense tickers, ten carry at least one other lock, so the test cannot collapse their rating on its own. **Two carry `moatLocks: ["licensing"]` and nothing else, both rated `moatCapture: 4`:**

- **OKLO** — `moatCapture 4`, sole lock. Its own `moatFalsification` concedes *"licensing IS the moat and the bottleneck"*. Measured gate movement: **10 CFR Part 53 took effect 2026-04-29**, a risk-informed technology-inclusive path created under NEIMA specifically to shorten non-light-water reviews. Additionally, Oklo's Aurora is still in **Combined License Application review** — i.e. the sole lock is **prospective, not held**.
- **SMR (NuScale)** — `moatCapture 4`, sole lock, and unlike OKLO the licence is genuinely **held**: the only SMR developer with full NRC certification, two approved designs. But the lead is compressing on measurement: the uprated 77 MWe review took **22 months against 41 months** for the original. Its existing `moatFalsification` tests conversion-to-orders, **not** gate widening — so the widening is currently an **unencoded** risk.

**Neither is re-rated in this commit.** Both are `status: watchlist` (no position), the gate-widening measurement above is from secondary coverage rather than NRC dockets read directly, and the CRCL precedent of the same day holds: a rating moves on measurement of the ticker, not on a rule newly written. **Open item, first check 2026-12-31** — whether any second SMR design clears certification under Part 53, which is the event that converts SMR's lock from held-and-narrowing to diluted.

---

> **Provenance (v2.8.0, 2026-07-28):** prompted by a Thai FDI report (BlockBeats 2026-07-23) in which "investment applications" — an intent number — rose 80% and were read as realised industrial capability. The transferable defects were the two above: geographic moats are rented and decay exogenously, and an intent metric quietly substituted for a delivery metric. Per `techpull_gate`, the expectation-denominator problem was already latent in the v2.7.1 self-reference work; the news supplied the analogy, not the motive. Per `inspired_loop`, this is an instrumentation change and **not a portfolio motion** — no PASS/FAIL state moved.

---

## Structurally Self-Referential Layers (v2.9.3) — CLOSED, not outstanding

`_selfReferential: true` currently fires on 9 of 22 layers. **The flag cannot distinguish two states that call for opposite responses:**

| state | meaning | correct response |
|---|---|---|
| **under-populated** | nobody has done the work of finding external comparables | do the work |
| **structurally unanchorable** | qualifying external comparables **do not exist** | stop looking, record why |

Read as the first when it is the second, the flag becomes a standing invitation to "fix" it by declaring a badly-matched peer — which silently re-rates every holding in the layer. That is not hypothetical: adding CRDO to L8_NET moved the median −23% and knocked ANET out of PASS (v2.7.1); JNPR leaving L8_NET moved ANET's pricingScore 3.0 → 4.0.

**A layer recorded here is a decided question, not a backlog item. Do not "fix" it.**

### L2 — Training Silicon · `_externalPeerCount: 0` · PERMANENT

Recorded 2026-07-28 (v2.9.2/2.9.3). The layer is a duopoly plus private companies:

- **NVDA, AMD** — universe holdings, so they cannot de-self-reference the median
- **CBRS** (Cerebras) — the obvious third public name, already a universe holding
- **Groq, SambaNova, Tenstorrent** — private, no public ratios
- Adjacent public names (fabless designers at other points of the stack) fail the **business-model match** rule harder than INTC did, and INTC was removed for precisely that reason

**Consequence, stated plainly: 55% of every L2 pricingScore is anchored on a median of the book itself, and no amount of peer-list work will change that.** NVDA, AMD and CBRS cannot look expensive relative to a group that is composed of NVDA, AMD and CBRS. Treat an L2 pricing verdict as a *within-layer ranking*, never as a statement about absolute valuation.

This is the honest state. It was previously masked: until v2.9.2 the peer-independence test was layer-scoped, so INTC — an L5 holding — was counted as L2's one external reference, and the layer reported `_externalPeerCount: 1`.

**L0 (Hyperscaler / Foundation Models) is the same shape and is NOT yet recorded here** — its declared peers MSFT/AMZN/META/ORCL are 4/4 holdings, but whether a qualifying external hyperscaler exists has not been researched. Under-populated and structurally unanchorable are indistinguishable for L0 until someone looks.

---

## Known Governance Gaps (v1.0)

1. **No per-ticker change log** — physicalConstraint/aiContribution changes leave no audit trail. Future: add `_changeLog: [{date, field, from, to, reason}]` per ticker.
2. **Experimental graduation not fully defined** — IONQ/RGTI graduation requires: fault-tolerant qubit demo (<0.1% logical error rate). Needs explicit threshold per experimental ticker.
3. **watchlist → active trigger not automated** — currently manual. Future: `update-valuations.js` should flag when watchlist ticker pricingScore ≤ 2.5 for 5 consecutive trading days.
4. **Sector benchmarks update is manual** — ~~no automation~~ resolved in part: `update-benchmarks.js` now recomputes medians weekly. Remaining risk: **peer selection** is still the manual input driving 55% of every pricingScore. Rules defined in § CHANGE a layer's `peers` list (v2.8.0); enforcement is surfacing-only, so a self-referential layer warns but still computes.
5. **No position-size guidance** — ProphetMap generates alpha signals, not portfolio weights. Users must apply their own sizing rules (e.g., Kelly criterion, equal-weight by funnel score).
6. **`constraintType` unset for pc < 4 tickers** (v2.8.0) — only the 52 names that clear the defensibility gate on physical grounds are classified, since only they use the score. A ticker promoted past pc 4 in a quarterly review must be classified at the same time.
7. **`physicalConstraint` is metaphorical for crypto** (v2.8.0) — LINK and ETH hold pc = 4 for network effects, not physics, and are tagged `unclassified`. Either a crypto-native defensibility measure is defined or their pc scores are restated; until then their defensibility gate result is not comparable to an equity's. *Partially addressed in v2.9.3*: the crypto funnel now carries the same `OR moatCapture >= 4` clause as the equity funnel, which gives a network-effect moat somewhere honest to live. The restatement itself — lowering the metaphorical pc scores and letting `moatCapture` carry the defensibility — **would** move ratings and is deliberately not done.
8. **The two `pricingScore` scales are not economically identical** (v2.9.3) — equity `deviationToScore` uses slope 2.5, crypto `devToScore` uses slope 1.5, so crypto scores are compressed toward 3.0. Reaching the shared `PRICING_ENTER` of 2.8 requires −13.3% below median for a token versus −8% for an equity: **the same constant is materially stricter for crypto.** The constants are shared anyway, because `pricingScore` is consumed as one cross-asset scale everywhere else — `lib/data.ts` `pricingColor()`/`pricingBg()` apply identical breakpoints with no `assetClass` branch. Harmonising the slope would re-rate every crypto member in one commit and is therefore a recorded decision, not a pending fix.
9. **Hysteresis anchoring is keyed on symbol alone in `update-valuations.js`** (v2.9.3) — `loadPreviousFunnelState()` builds `map[r.symbol]`, so in a file containing two rows for one symbol the last row silently wins. Harmless from v2.9.1 onward (`assetClass` now prevents duplicates), but every scores file through 2026-07-27 contains such duplicates, so any backfill or historical replay resolves them by file order. `update-crypto-valuations.js` filters on `assetClass === 'crypto'` and is not affected.
10. **Layer assignment silently determines the benchmark, so near-identical businesses in different layers get non-comparable `pricingScore`s** (v2.9.7) — **ALAB sits in `L3` and CRDO in `L2_5`.** Astera Labs (PCIe/CXL retimers) and Credo (SerDes, active electrical cables) are the closest comparables either one has; they are priced against entirely different peer medians, so their scores cannot be read side by side. **ALAB's L3 placement is NOT an error** — its `thesis` states "adjacent to but distinct from L3 EDA layer" and its `_changeLog` records the choice as deliberate, using `layerRole: secondary` to mark the sub-thesis. The gap is structural, not clerical: `layerRole: secondary` distinguishes the thesis but not the benchmark, so a secondary-role ticker is still measured against the primary role's median (ALAB against SNPS/CDNS, i.e. EDA multiples). **Deliberately not fixed here.** Moving ALAB would re-rate it through a different benchmark, which is precisely the silent re-rating the v2.8.0 peer rule exists to prevent, and ALAB's own `_note` carries pre-declared re-evaluation triggers (`pricingScore ≤3.0 for 5+ days`, or forward P/S compressing below 35x) that are nowhere near met — it printed 4.0 on 2026-07-29. A fix belongs in a quarterly review with the full layer delta measured, not in a news-driven commit. *Worth noting the precedent that makes ALAB a good example: it was demoted active → watchlist on 2026-05-19 the same day its pre-declared falsifier #4 (forward P/S >40x) fired. When a falsifier is measurable and someone is looking, the mechanism works.*

11. **`moatLocks` has no value for *effective scale*** (v2.9.11) — measured distribution across the book: `integration 61 · userHabit 18 · licensing 14 · privateData 4 · liability 3`. Mapped against the five-moat taxonomy those cover intangibles (`licensing`/`privateData`), switching costs (`integration`) and cost advantage (carried by `physicalConstraint`'s `geo` type), but **two are unhoused**:
    - **Network effect** — already a recorded debt, Gap #7. LINK and ETH hold `physicalConstraint = 4` for what is network effect, tagged `unclassified`.
    - **Effective scale** — a market whose total addressable economics support only a few profitable participants, so a *rational* entrant declines to enter even though nothing bars entry. **Not the same mechanism as the queue-vs-chokepoint test in §3.** That test asks whether *permission* is rationed; effective scale asks whether *economics* are. A licence queue can be wide open while the third entrant still loses money. Names whose defensibility is of this kind currently have nowhere to sit and are absorbed into `integration` or carried by `physicalConstraint`.

    **Not fixed here.** Adding a sixth lock value re-rates nothing by itself (`moatLocks` feeds no gate; `moatCapture` is the scored field), but assigning it to existing tickers would require re-reading 87 `moatFalsification` strings, and a lock reassignment that moved any `moatCapture` would be a silent re-rate of the kind the v2.8.0 peer rule prohibits. **Open item — classify at the next quarterly review, one ticker at a time, with the `moatFalsification` text quoted as the evidence.**

12. **A-track gate B records *whether* a call was non-consensus, not *which kind*** (v2.9.11) — gate B of the A/B falsification discipline requires ≥3 timestamped cases satisfying "pricingScore ≤ 3.0 at signal, not what Jensen/Leopold were pitching at the time, and eventually right." **"Non-consensus" is currently a boolean.** Mauboussin's BAIT taxonomy splits the sources of structural inefficiency four ways — *behavioral* (a participant behaves so as to make price and value diverge), *analytical* (all participants hold near-identical information and some analyse it better — via skill, faster updating, **operating on a different time scale**, or anticipating a change in expectations), *informational* (some hold information others do not and can trade the asymmetry), *technical* (participants must buy or sell for reasons unrelated to fundamental value — mandates, index rules, forced liquidation).

    Mauboussin states the use case directly: *"Documenting the perceived reason for mispricing and evaluating whether the mispricing dissipates for the right reasons is an effective way to assess process."*

    **Why this matters more than it looks.** ProphetMap has no informational channel (every input is public) and reads no sentiment, so **structurally it can only produce analytical and technical edge** — and within analytical, mostly the *different-time-scale* branch, which is what `timeToRealize` is. Therefore: **if the reconstructed A-track cases classify mainly as behavioral, the alpha is not coming from the machine and gate B passing would be a false positive.** That is a falsifier gate B cannot currently generate about itself.

    **Proposed, not implemented:** one `inefficiencyType` enum field on the A-track blotter, filled at signal time, four values, no gate reads it. Zero blast radius on the funnel. Reviewed at the 12-month A/B mid-check alongside gates A and B.

> **Provenance (v2.9.11, 2026-08-12):** both items came out of triaging a 30-source NotebookLM export (桌面 `投研金融/`) against this project. #11's taxonomy and #12's BAIT framework are from Mauboussin, *Who Is On the Other Side?* (Counterpoint Global). Of the 24 non-empty sources in that export, **21 were judged to have no interface with this project and were discarded** — including three generated Claude-skill drafts, whose Buffett-style financial screens (`cumulative capex / cumulative net income < 50%`) would exclude TSM, ASML and AMAT, i.e. the defining members of the strongest quadrant, and whose Driehaus relative-strength rule is the momentum filter §2 of the v2.8.0 frame explicitly refuses. Per `inspired_loop` and `techpull_gate`: **documentation only, no portfolio motion, no ticker's PASS/FAIL state moved, no field added.**

13. **Gate A was never measurable, and the reason was not the window length** (v2.9.12) — the standing assumption was that gate A could not be evaluated because no A-track blotter existed and the 12-month window had not elapsed. Both halves are wrong. `data/scores/` has carried daily `funnelPass` and `price` for every ticker since 2026-05-04 — **76 files, 102 calendar days, 74% coverage, price present on 84/84 rows.** The outcome data was never missing. What was missing is that **the experiment's conditions were edited while the experiment ran**:

    - **Membership look-ahead.** All **87/87** tickers carry `addedDate` *after* the 2026-05-04 scoring start (79 in May, 4 in June, 4 in July). A name added in July was selected with June's realised returns already visible.
    - **Post-hoc re-scoring.** **39** `_changeLog` entries touching `physicalConstraint`/`moatCapture` are dated inside the window.
    - **Survivorship.** Demotion removes a ticker from the pass-set going forward — e.g. `TSEM 2026-05-19: Demoted active → watchlist, pricingScore=4.1 + peg=7.15 + PC=3 triple-fail`. The basket sheds losers by construction.

    **Measured, so the size of the contamination is on the record** (64 adjacent-trading-day segments, 2026-05-04 → 2026-08-14, equal-weight, rebalanced each scoring day; reproduce with `node scripts/ab-track.js --diagnostic`):

    | basket | cum | geoAnn | volAnn | ann/vol |
    |---|---:|---:|---:|---:|
    | pass-set | **+8.55%** | +38.1% | 37.4% | **+1.02** |
    | FAIL-set | −12.16% | −40.0% | 44.7% | −0.90 |
    | all-universe | −8.72% | −30.2% | 42.5% | −0.71 |
    | SMH | −1.16% | −4.5% | 54.6% | −0.08 |

    **pass-set minus all-universe: +0.263%/day, t = +1.76, n = 64 — NOT SIGNIFICANT at 5%.** A headline "+9.71pp over SMH, risk-adjusted 1.02 vs −0.08" would have been available here and would have been wrong twice over: not significant, and computed on conditions edited mid-flight.

    **Single-factor attribution makes the contamination specific rather than theoretical.** Same basket size, cheapest-first, same 64 segments:

    | | cum |
    |---|---:|
    | full funnel | **+8.55%** |
    | `pricingScore` only | +2.15% |
    | `momentum6m` only (20% weight) | +3.13% |
    | `analystUpside` only (25%) | +1.32% |
    | `evRevenue` only (25%) | −1.53% |
    | `forwardPE` only (30% weight) | **−4.93%** |

    The elaborate four-component pricing composite contributes **+2.15%** on its own; the full funnel returns **+8.55%**. The residual ≈ +6.4pp therefore comes from the hand-scored gates — `physicalConstraint`, `moatCapture`, `aiContribution` — **which are precisely the fields edited 39 times inside the window.** The excess is concentrated exactly where the contamination is. Separately worth recording: the heaviest-weighted component, `forwardPE` at 30%, is the *worst* single factor over this span.

    **What partially survives.** The pass-set/FAIL-set spread of **20.7pp** shares one universe on both sides, so universe-selection bias largely cancels in the difference. It remains exposed to the 39 re-scorings and to survivorship. **Treat as a weak signal that the funnel discriminates; never as evidence gate A passed.**

    **Fixed by freezing, not by waiting.** Letting the existing window run to 2027-05 would not help — the same three defects would still be present at expiry. `data/ab-track/frozen-2026-08-17.json` pins the 87-name roster with its `pc`/`moatCapture`/`aiContribution`/`timeToRealize` values and pre-registers the basket rules (equal weight; adjacent trading days only, gaps dropped not bridged; **demotion or removal from `universe.json` does not remove a name from the frozen roster**; start at the first scores file strictly after the freeze date, since this freeze was authored with knowledge of everything up to 2026-08-14; report the paired t alongside every return). Window restarts **2026-08-17 → 2027-08-17**, mid-check 2027-02-17, non-executing.

    **The cost is stated rather than buried: the first 3.4 months of A-track record are void and the clock restarts.** That is worse-sounding and better than presenting a contaminated number in 2027-05.

    **Delete clause.** If at 2027-08-17 gate A still cannot be evaluated because these pre-registered rules were violated, the correct action is to record that **the test failed to run** — not to freeze a third time. A screen that keeps restarting its own exam has answered the question.

> **Provenance (v2.9.12, 2026-08-17):** surfaced while triaging a personal crypto book against this project — the question asked was whether a crypto line could be merged into ProphetMap. It cannot and need not: `RNDR/TAO/FIL/LINK/ETH` have been in the universe since 2026-05-06 with their own `update-crypto-valuations.js`, and a holdings review is a different instrument from an idea screen (that table lives outside this repo, at `~/crypto-portfolio/`). The transferable finding was methodological: **a falsifier needs two legs — a mechanism leg (does it behave like the thesis says) and a delivery leg (did it pay what the thesis implies)** — established on BTC, where the mechanism leg fired in 98.4% of rolling windows yet was far weaker evidence than the delivery leg (36-month return tied with gold at 2.2× the volatility). Applying the delivery leg to this engine is what exposed Gap #13. A scan of all **320** `thesisFalsification` entries found **23.4%** carry both a threshold and a deadline and **2.5% (8)** reference price/valuation at all — of which **7 are pricing entry gates, not thesis falsifiers**. *(That scan's mechanism/business-delivery split was discarded as unreliable: the regex missed 60.3% of entries because business metrics appear as "seat growth"/"ARPU"/"MAU"/"contracts". Only the valuation-term count is trustworthy, since that vocabulary is closed.)* Per `inspired_loop` and `techpull_gate`: **documentation and a read-only measurement script; no ticker's PASS/FAIL state moved, no scoring field changed, no portfolio motion.**

14. **Key-person dependency is not a dimension, and the one entry that treats it correctly is unreplicated** (v2.9.13) — scanning all **87** tickers' `thesis` + `thesisFalsification` + `moatFalsification` + `_note`:

    - **Explicit person names: 3.** `SPCX` (Musk), `OKLO` (Altman), `TSLA` (Musk).
    - **Role words (`founder`/`CEO`/`leadership`/`succession`/`chairman`): 7 hits, 0 true positives.** `TSM`'s "process **leadership**" is technical lead; `VRT`/`MOD`'s "thermal **management**" is a product category; `APLD`'s is "Macquarie Asset **Management**"; and `ORCL`/`GLW`/`CAT`'s "management" denotes *the disclosing party*, not a person the thesis rests on. **Coverage of key-person risk as an acknowledged risk is therefore 1 of 87.**

    **The three person-name entries use the concept three incompatible ways, which is the actual finding:**

    | ticker | how the person appears | verdict |
    |---|---|---|
    | `OKLO` F4 | *"Sam Altman OpenAI distraction reduces direct backing or strategic relevance"* | **correct form** — negative, event-driven — but carries no `MEASURE:` and no `CHECK:` date, unlike `GLW` F6/F7 and `CAT` F7/F8 written to the current standard |
    | `TSLA` `_note` | *"Musk admiration is not a thesis"* (2026-05-08 clearing rationale) | **the principle is already stated** — but it lives in one ticker's note, was never promoted to a rule, and therefore binds no other ticker |
    | `SPCX` `thesis` | *"AI/datacenter is the forward value-driver per Musk 'space-based AI is the only way to scale'"* | **a founder's promotional claim carried as evidence for the forward value-driver, undiscounted** |

    **The third row breaks a rule this document already has.** The v2.6.0 provenance note commits to reading KOL/founder sources under `vc_pitch_source_bias` and keeping only the falsifiable, cuts-against-interest claims. `GLW` F7 applies it explicitly — *"Weeks's claim … is management assertion, not evidence, and is a **report-good source on exactly the contested point**"*. `SPCX` quotes the single most report-good source available on SPCX's own AI value-driver and applies no discount. **The rule exists; its application is inconsistent at ticker level.**

    **Names where the omission is load-bearing, not cosmetic:**
    - **`PLTR`** — `moatCapture = 5`, active, thesis is government/enterprise systems-of-record. All three falsifiers are budget, competitor, and ARR growth. **None reference Karp**, though the government penetration the thesis rests on is not separable from him.
    - **`META`** — thesis core is *"Llama open-source strategy locks in ecosystem"*. Open-sourcing is a single-person decision under dual-class control. F2 tests *"Llama ecosystem fails to reach 1M enterprise deployments"* — **but a decision to close the weights needs no ecosystem failure to occur.** The falsifier tests the wrong variable.
    - **`NVDA`** — `moatCapture = 5`, no key-person clause.

    **The direction has to be negative, and that is the whole point.** As a positive factor ("visionary founder → premium") the concept is unpriceable *and* unfalsifiable in exactly the way §Conceptual Frame rejects elsewhere: up is vision vindicated, down is the market not yet understanding, and "*truly* top-tier founder" resolves after the fact. A separate objection is fatal on its own — **founder quality is universally observable, so it cannot be an alpha source unless one first argues it is systematically mispriced**, which the pitch form of this idea never does. Inverted, it becomes ordinary and testable: *if this person left tomorrow, how many `thesisFalsification` lines would need rewriting immediately?* That has an answer. "How much is the vision worth" does not. *(Recorded as the strongest counter-evidence to a negative-only framing: founder-CEO firms are reported to outperform in the academic literature — **from memory, uncited, treat as unverified**. Even if it holds, it is a binary, cross-sectional, portfolio-level effect, not a per-name valuation input, and it is not what the pitch form claims.)*

    **Proposed, not implemented** — same shape as Gap #12's `inefficiencyType`: one enum on the ticker, `keyPersonRisk: none | operational | thesis-load-bearing`, assigned by the counterfactual above rather than by any judgement of the person's ability. **No gate reads it; blast radius on the funnel is zero.** To keep it from decaying into the same qualitative mush it exists to replace, anchor `thesis-load-bearing` to a public, binary, checkable fact — **dual-class or super-voting control** — so the classification has something outside the analyst's opinion holding it in place. Assign at a quarterly review, one ticker at a time, quoting the `thesis` text as the evidence, per Gap #11's method. **Explicitly not doing:** adding any positive/credit field, or letting this touch `moatCapture`, `physicalConstraint`, or any PASS/FAIL state.

> **Provenance (v2.9.13, 2026-08-29):** prompted by a Tom Lee interview (2026-08-16, via BlockBeats) arguing that in the AI era founder vision has become a core pricing factor — AI can copy technology but not direction — and that Fundstrat holds Robinhood substantially *because of* Vlad Tenev, "not simply on valuation or short-term data." Read under `vc_pitch_source_bias`, the Robinhood position is the shallow book. The deeper one: **Lee chairs BitMine, the largest ETH treasury company.** A DAT's model requires the share price to hold a premium to NAV, and that premium's support is precisely the claim that a star principal is itself priceable — **this is talking his own valuation mechanism, not merely his book.** His three exemplars (Altman, Anthropic's founders, Musk) are all selected after winning; the 2021 roster assembled with identical language included SBF, Do Kwon, Neumann and Holmes. **What was adopted here is the inversion, not the claim.** Per `inspired_loop` and `techpull_gate`: **documentation only — no field added, no ticker edited, no scoring change, no portfolio motion.**

15. **The universe is built up the supply chain while the frame says capture moves down it** (v2.9.14) — this is a **coverage** gap, not a field gap, and it contradicts a claim this document already makes. §Conceptual Frame — Solvability × Capture states the mechanism plainly: DeepMind solved protein folding, **open-sourced AlphaFold for free**, and capture moved *downstream* to Isomorphic. The universe is constructed in the opposite direction.

    | | tickers |
    |---|---:|
    | upstream 19 layers (silicon, packaging, DC, power, materials) | **55** |
    | `L0` platform + `L1` "AI需求/应用层" combined | **6** |

    **`L1` is named for the application layer and contains no application-layer company.** Its two members are `GOOG` (hyperscale platform) and `PLTR` (government/enterprise systems-of-record). Checked against twelve pure application/SaaS names — `CRM · NOW · WDAY · SNOW · ADBE · TEAM · DDOG · MDB · HUBS · ZS · INTU` — **eleven are absent**; the twelfth, `PANW`, is present under `L10` for its security identity, not as a SaaS name.

    **The cost is measurable, not hypothetical.** Over the six months 2026-02-22 → 2026-08-28, equal-weight:

    | basket | return |
    |---|---:|
    | `CRM · ADBE · NOW · WDAY · SNOW` | **+50.9%** |
    | `MSFT · GOOGL · META · NVDA · AMZN · AVGO` | +14.4% |
    | **spread** | **+36.5pp** |

    **A candidate mechanism, and it is observable in the financials rather than asserted:** the distribution layer holds the AI capex-race's only position that does not pay the bill. Comparing operating to free cash flow isolates it —

    | | P/OCF | P/FCF | ratio | FCF margin |
    |---|---:|---:|---:|---:|
    | GOOGL | 22.83 | 79.57 | **3.5×** | 11.95% |
    | MSFT | 20.84 | 56.92 | **2.7×** | 20.19% |
    | **CRM** | 13.38 | **13.90** | **1.04×** | **34.49%** |

    A name whose P/OCF and P/FCF nearly coincide is not funding the buildout. **`capex` intensity is therefore a cheap, public, continuous proxy for which side of the supply/capture divide a ticker sits on** — and no field in this repo reads it.

    **Three instances across three unrelated industries** (the third is what makes this structural rather than an AI-cycle artifact):

    | domain | supply / discovery side | capture side |
    |---|---|---|
    | drug discovery | XBI, ten-year CAGR/vol **0.36** | **LLY 1.09** — and its engine, GLP-1, is conventional pharmacology, not AI |
    | semiconductors | fabless startups | **TSM / ASML** — already the frame's strongest quadrant |
    | AI software | labs carrying the capex | **enterprise SaaS**, +36.5pp over six months |

    **What is genuinely new here, stated narrowly.** The *concept* is not new — v2.6.0 argued it from AlphaFold, in this same drug-discovery domain, on 2026-06-26. New are (a) **realised return data** on both sides of the divide rather than a conceptual argument, (b) the **capex proxy** for locating the divide, and (c) the finding that **the universe's construction makes the frame's own central claim unobservable from inside the engine** — structurally the same defect as Gap #12, where gate B cannot generate the falsifier that would invalidate it.

    **Deliberately not fixed here, and the reason matters.** Adding application-layer names is a Tier 3 ADD requiring full four-dimension scoring per ticker, and doing it in a commentary-driven commit is precisely the mid-flight edit that voided the first A-track window (Gap #13). It also **must not be done inside the frozen A/B window** — `data/ab-track/frozen-2026-08-17.json` pins an 87-name roster, and new tickers cannot join it. **Open item for a quarterly review after 2027-08-17**, or a deliberate decision that this engine screens the AI *supply chain* by design and cedes the application layer — which would be a legitimate answer, but should be written down as a choice rather than left as an accident of construction.

    **Addendum (v2.9.17, 2026-08-31) — a fourth domain instance, and a caveat this gap's own proxy needs.**

    Mass-capacity storage. Measured capex intensity, most recent obtainable period (stockanalysis.com, pulled 2026-08-31):

    | | capex / revenue | gross margin | in universe |
    |---|---:|---:|---|
    | **Micron** (DRAM/HBM, IDM) | **28.0%** TTM · 42.4% FY2025 | 72.6% | **yes** — `L6`, the only storage name |
    | **Seagate** (mass-capacity HDD) | **4.7%** FY2026 · **2.9%** FY2025 | 45.6% | no |
    | **Western Digital** (mass-capacity HDD) | **3.2%** FY2026 | 48.9% | no |

    By this gap's own proxy, the engine holds the storage name that **pays** the buildout bill and omits the two that do not. Same construction bias, fourth industry.

    First-party operating data behind it (Seagate FQ4 FY2026 earnings call via Blocks & Files 2026-07-30; WDC FQ4 FY2026 via the same, 2026-08-06):

    | | |
    |---|---|
    | Seagate capacity shipped | **218 EB, +34% Y/Y**; nearline **195 EB, +43% Y/Y**; non-nearline −10% |
    | Seagate price per EB | **+10% Y/Y**; an analyst read the September-quarter guide as implying ~20% |
    | Seagate capacity policy | *"In the face of sustained demand, Seagate is not adding disk drive unit manufacturing capacity"* |
    | Seagate forward book | *"the vast majority of our nearline exabytes are now allocated into calendar 2028"* |
    | WDC | revenue **+44% Y/Y** on *"strong exabyte growth and favorable pricing dynamics"*; price per TB "high teens" |

    The decomposition closes against an independently reported figure: Seagate data-centre revenue **+57%** = volume **+43%** × price **+9.8%**, against the **+10%** management reported. **Volume contributes 79% of the growth, price 21%.**

    ⭐ **The caveat, and it lands on item (b) above.** `capex` intensity was recorded here as *"a cheap, public, continuous proxy for which side of the supply/capture divide a ticker sits on."* It is **mechanism-blind**. Low intensity can mean **downstream and not paying for the buildout** (CRM, P/OCF-to-P/FCF 1.04×) or **upstream and refusing to expand** (Seagate, a duopoly explicitly declining to add units while demand runs). Both print a high FCF margin; both read identically on the proxy; **their durability is opposite.** The first persists as long as the layer structure does. The second ends the quarter someone adds capacity or the duopoly breaks — and a book that cannot tell them apart will hold the second thinking it owns the first. **The proxy locates the divide but is silent on why a ticker sits on that side, and the reason is what dates it.**

    **Recorded, not promoted.** Adding `STX`/`WDC` is a Tier 3 ADD barred inside the frozen A/B window (`data/ab-track/frozen-2026-08-17.json`, 87 names) until **2027-08-17** — the same bar this gap already carries for the application layer. No field added, no ticker touched, no score changed.

> **Provenance (v2.9.14, 2026-08-29):** surfaced while testing a widely-circulated X thread (2026-02-22) claiming Chinese AI model exports are frictionless high-value trade, that AI is a better business than SaaS on four grounds, and — in the replies — that `long AI / short retail and legacy software` "must win." Six months of record were available, so it was measured rather than argued: the China-AI proxy basket returned **−19.0%** (the only negative group) and the short-SaaS leg lost **36.5pp**. Of the thread's four stated grounds, "marginal cost near zero" inverts AI and SaaS, and "data flywheel" contradicts the thread's own claim that cheap latecomers will displace incumbents — a flywheel that strong would forbid it. Its one correct observation, that capex suppresses FCF and compresses tech valuations, was confirmed via the P/OCF–P/FCF spread above but drew the wrong conclusion twice (P/FCF is not comparable across margin structures — the same construct error as comparing P/F across crypto categories; and "capex will slow" assumes capex is optional rather than a competitive operating cost that converts into depreciation). **The thread was mostly wrong and still located a real gap — because it was tested rather than rebutted.** Per `inspired_loop` and `techpull_gate`: **documentation only — no ticker added, no field created, no scoring change, no portfolio motion.**

16. **Two unstated assumptions about competitors, and the first one voids the moat Gap #11 says is homeless** (v2.9.15)

    **A — Every capture score assumes the rival wants a return on capital.**

    Gap #11 names **effective scale** as one of two unhoused moats: *"a market whose total addressable economics support only a few profitable participants, so a **rational** entrant declines to enter even though nothing bars entry."*

    The word carrying the load is **rational**. `moatCapture`, `moatLocks` and the supplier-trap flag all price a rival that maximises return on capital. **A rival optimising for supply security rather than return is not deterred by "the fourth entrant loses money" — that is the outcome it is willing to buy.** Measured readout of the one decade-long natural experiment available:

    | | figure | source |
    |---|---|---|
    | 大基金 I + II + III registered capital | ¥987.2bn + ¥2,041.5bn + ¥3,440bn = **¥6,468.7bn** (≈ $90bn at ~7.2) | 21jingji / EEO |
    | CXMT global DRAM share, Q2 2026 (**revenue**) | **7%**, #4 | Counterpoint |
    | Samsung / SK hynix / Micron, same quarter | 39% / 26% / 25% | Counterpoint |
    | YMTC global NAND share, Q1 2026 (**revenue**) | **13%**, up from 8% in Q1 2025 | Counterpoint |
    | YMTC, Q2 2026 (**bit shipments**) | **#3**, ahead of Micron / Kioxia / SanDisk | Counterpoint |
    | CXMT stated target | **30% by 2030**, explicitly *"bottlenecked by access to advanced chipmaking tools"* | Tom's Hardware |

    **This is not the rule already recorded at § Structurally Self-Referential Layers.** That rule reads: when a *gatekeeper* subsidises admission, admission is not scarce. This one reads: when a *rival's capital* is subsidised, the industry's pricing power is not scarce. Same shape — **the direction of the subsidy is the direction of the scarcity** — different object. **The generalisation worth recording is that the subsidy rule applies to competitors, not only to gatekeepers**, and nothing in the book currently runs it in that direction.

    ⭐ **The consequence inverts the conclusion people draw from it.** The Solvability × Capture frame already holds that *solved ≠ defensible* — AlphaFold was open-sourced and capture moved downstream. Applied to industrial policy the same logic reads: **supply-side solved = capture-side destroyed, for the winner too.** An entrant that does not need a return competes price to cost; the oligopoly that made memory investable after 2013 is the thing being dismantled. So "the state programme succeeds" and "the equities of that programme compound" are **two propositions, not one** — and the historical precedent usually cited for the first (Korea, 2009) supports the second only because that price war *ended* and left three players. A fourth participant with no return constraint is the condition under which it does not end.

    **Where it would bite in this book:** any ticker whose defensibility rests on "only N players can be profitable here." Not scored, not surfaced, no field reads it.

    **B — `cyclicalTrap` fires on the way in; nothing records the way out.**

    `timeToRealize` measures how long until a thesis *pays*. **There is no field for how long capital is locked up if the thesis is wrong**, and the dispersion on that question is larger than the dispersion the engine does measure. Monthly closes, dot-com peak to reclaim (Yahoo, independently pulled 2026-08-30):

    | | 2000 peak | trough | drawdown | **years to reclaim peak** |
    |---|---:|---:|---:|---:|
    | **MU** | $81.50 (2000-06) | $7.99 (2002-12) | −90.2% | **20.5** |
    | **SK hynix** | ₩516,600 (2000-02) | ₩2,835 (2003-02) | **−99.5%** | **25.6** |
    | **Samsung Elec** | ₩7,380 (2000-05) | ₩2,810 (2001-08) | −61.9% | **1.8** |
    | NASDAQ Composite | 3,940 (1999-11) | 1,321 (2002-11) | −66.5% | 14.0 |

    **Same country, same industry, same crash, and a 14× spread in recovery time between Samsung and SK hynix.** The intra-sector dispersion exceeds the sector-versus-index dispersion. The apparent determinant is diversification away from the commodity — Samsung carried handsets, foundry and displays; SK hynix was near-pure memory — and **no field in this repo measures revenue concentration in the cyclical product.** A `cyclicalTrap` flag tells a holder the entry is expensive; it says nothing about whether being wrong costs two years or twenty-five.

    **What is genuinely new here, stated narrowly.** Most of what prompted this entry was already covered and is **not** claimed as new:
    - The cyclical value trap itself is an **implemented engine gate** (`cyclicalTrap`, on the trailing/forward ratio), and CHANGELOG v2.9.6 already made the argument in stronger form — *"the 5.0 is arithmetically correct and economically empty, which is what a cyclical value trap is."*
    - MU's cycle top is already an **open pre-registered watchlist item** (CYCLE-PEAK DETECTION, opened 2026-07-29) whose falsifier is better than anything here: *gross margin declines sequentially for two consecutive quarters from the 2026 peak **while HBM bit shipments still grow*** — which separates a pricing turn from a demand turn. First check FQ4 FY2026. **Nothing in this entry substitutes for that test.**
    - The subsidy → non-scarcity rule already exists in its gatekeeper form.

    New are (a) the subsidy rule **extended from gatekeeper to competitor**, (b) the observation that **effective scale is specifically the moat a return-agnostic entrant voids** — so housing it per Gap #11 would not make it protective, which is a reason to house it *with* that caveat rather than a reason to skip it, and (c) **recovery asymmetry as a missing axis, with measured dispersion**.

    **Two observations recorded without being promoted to tests.** (i) A cycle-average denominator: market cap $1.05T against five-year mean net income of **$12.5bn** (FY2022 $8.69bn · FY2023 **−$5.83bn** · FY2024 $0.78bn · FY2025 $8.54bn · TTM $50.47bn) is **83.8×**, against trailing 21.0× and forward 6.49× — a minor addition to an argument the repo already makes by a different route. (ii) ~~A peer-price divergence: the Korean peers topped in 2026-05 while MU had not yet rolled over.~~ **WITHDRAWN 2026-08-31 — the observation was false and the direction it implied was inverted.** Re-pulled from a two-year Yahoo series: SK hynix topped **2026-06-22**, Samsung **2026-06-18**, MU **2026-06-25** — all three inside seven days — and on the same 2026-08-28 close sat at **−43.4% / −29.1% / −23.1%**, i.e. MU's drawdown was the *shallowest*, not absent. MU has no 2026-03 high; its Q1 maximum was **$524.60 on 2026-04-27**, which the 2026-08-28 close of **$932.90** is **+77.8%** above. **There is no divergence to record.** The −23.1% printed here as Samsung's figure is in fact MU's; the −3.9% and the "2026-03 high" do not reproduce from any series and are withdrawn. The entry was flagged when written as *"explicitly not offered as a substitute for the registered falsifier"*, so nothing downstream consumed it — but it was recorded as evidence pointing the opposite way from the record, which is why it is corrected rather than deleted.

    **Deliberately not fixed here.** No field added, no ticker touched, no score changed. Adding a `returnAgnosticRival` or `cyclicalConcentration` dimension would re-rate members inside the frozen A/B window (`data/ab-track/frozen-2026-08-17.json`, 87 names) and is barred until **2027-08-17**. Open item for the quarterly review after that date, alongside Gap #11's effective-scale classification — the two should be done together, because the second is the reason the first is not sufficient.

> **Provenance (v2.9.15, 2026-08-30):** surfaced while reading an X thread (2026-05-04/06) arguing that DRAM has no long-run fair price, that Korea's state-backed counter-cyclical capex killed Qimonda and Elpida, and therefore that Chinese state capital will take the memory market within roughly a decade. The history is sound and the mechanism is correctly identified; the prediction transfers the mechanism without its initial condition — **the 2009 rivals were unfunded, while the 2026 incumbents have just banked the largest cash generation in the industry's history** (MU TTM net income $50.5bn, FCF $26.2bn). The thread also lists three failure modes — cost curve, capital endurance, ecosystem path — and then uses only one, while the cited source for the 30%-by-2030 target names tool access as the binding constraint, which state capital does not relieve. Two internal contradictions were left unresolved by the thread itself: an oligopoly is invoked to argue the sector can no longer bleed, yet **MU's FY2023 shows 2.67% gross margin, −23.0% operating margin, −$5.83bn net and −$6.1bn FCF with that oligopoly fully in place**; and the accompanying ticker list contradicts the thesis, since the mechanism it describes destroys equity capture for the winner. Per `inspired_loop` and `techpull_gate`: **documentation only — no ticker added, no field created, no scoring change, no portfolio motion.** Prior-art check ran before drafting and removed three of the five candidate findings.

17. **The regulatory test has no export-control branch, and intake never asks whether the named driver is the marginal buyer** (v2.9.16)

    **A — §3 and §3a classify regulatory constraints from the holder's side only.**

    §3 asks whether a permission the ticker *needs* is rationed (queue vs chokepoint). §3a splits `moatLocks: "licensing"` into **licensee** (you pay) and **licensor** (you collect). Both attach the permission to the ticker.

    A third structure is unclassified: **a foreign government rations an input the ticker consumes.** The queue test does not apply — nobody is standing in a line — and the licensor/licensee split does not either, because the restricting party is not a counterparty at all.

    The discriminating question is not how wide the gate is. It is **what the restriction is aimed at: the material, or the location of the conversion step.**

    **Test, one line:** *while the input is restricted, is downstream capacity being added anywhere?* If yes, supply is not scarce — it has **moved**, and the chokepoint relocates to a party this book may not be able to own.

    Worked case, which answers itself:

    | | |
    |---|---|
    | Restricted input | high-purity tungsten powder; China tightened tungsten export controls from 2025 |
    | Claimed effect | two Japanese WF₆ producers (Kanto Denka + Central Glass, together ~1/4 of global supply) halted production **2026-07-01** |
    | Capacity being added | **a Chinese producer announced +1,000 t/yr of WF₆** |
    | Reading | the restriction targets the **location of conversion**, not the material. Not an embargo — an onshoring of the value-added step |

    Under the relocation reading a **price** window is expected (qualifying a new precursor supplier is slow) and a **volume** crisis is not. *(Base rate, from memory and uncited — treat as unverified: the 2022 neon restriction and the 2010 rare-earth embargo both produced order-of-magnitude price spikes without a volume crisis, and mean-reverted inside roughly three years.)*

    **Known limitation, landed knowingly.** The universe holds **no materials or precursor ticker**: a full-repo sweep for `tungsten|WF6|钨` returns exactly one hit, an auto-ingested news headline at `data/alerts/2026-05-19.json:1008`. This branch has nothing to apply to today and is recorded on the judgement that the structure recurs (rare earths, gallium/germanium, neon, HF, photoresist), not on a live case. A rule with no current subject is weaker than Gap #15's and Gap #16's, both of which carried an applied case; that is stated here rather than discovered later.

    **B — nothing at intake asks what share of an input's demand the named driver actually is.**

    §ADD a ticker requires **`supplyChainEvidence`** — external proof the ticker occupies its mapped chokepoint. That tests **occupancy**. It does not test **attribution**: whether the demand story used to justify the mapping is the buyer actually setting the price.

    The two fail differently. A tungsten miner genuinely occupies the tungsten chokepoint. But **~2/3 of global tungsten demand is cemented carbide** — cutting tools, drill bits — and semiconductors are a fraction of the remainder *(exact share unknown; deliberately not estimated)*. Price is therefore set by global manufacturing volumes and by scrap recycling, both **price-elastic in the direction a scarcity pitch must deny**. AI is in the headline and is not the marginal buyer.

    **Test, one line, at intake rather than at scoring:** *before accepting "X is a bottleneck for AI", state what share of X's demand AI is.* If that share is small or unknown, the AI thesis is not the reason to own X — whatever else is true about X.

    This is the mirror of the question §Layer proposals already asks of FLNC/CATL. That one asks **who captures** a demand everyone agrees exists; this one asks **whether the named demand is the one setting the price**.

    **Where it would have bitten:** `data/alerts/` ingests exactly this class of headline — the 2026-05-19 tungsten-mining item above. Nothing was done with it, which was the right outcome, but it was right by omission rather than by a rule.

    **What is genuinely new here, stated narrowly.** Prior-art removed more than it left. **Not** claimed as new:
    - **Interested-source discipline** — §ADD already reads *"Company IR self-report or press release does NOT count … the entry is narrative, not a chokepoint."* The prompting article's sole origin is the CEO of a tungsten miner, relayed by ZeroHedge and then BlockBeats: three hops, one interested origin, zero independent verification. The existing rule disposes of it.
    - **Commodity moat leaking to spot** — §Solvability × Capture already places commodity price-takers (FCX, EOG, AA) in the *"physical-geographic moat leaks to spot pricing"* cell.
    - **Subsidised rival destroys scarcity** — the +1,000 t/yr add is an **instance** of Gap #16 A, written one day earlier, not a new rule.
    - **"Has new technology reduced physical scarcity?"** — already a Tier 2 criterion.

    New are **(a)** the **export-control branch** of the regulatory test, with the material-vs-location discriminator, and **(b)** the **demand-attribution check at intake**, distinct from the occupancy check that already exists.

    **One hypothesis proposed and killed by its own data.** The conjecture was that tungsten equities are a downstream-memory beta wearing an upstream label — 中钨高新, 厦门钨业 and SK hynix all topped on **2026-06-22**, the same day. Trailing-year daily log-return correlation says no: the two tungsten names against SK hynix are **0.25 / 0.28** and against MU **0.18 / 0.20**, versus a **0.33** SK hynix—MU benchmark and **0.84** between the two tungsten names themselves. The shared peak date reflects one common risk turn in late June, not a shared cash-flow driver. *(Two incidental readings kept: Kanto Denka—SK hynix is **0.52**, above the SK hynix—MU benchmark; Almonty correlates with SOXX at **0.40** but with SK hynix at **0.12**.)*

    **Deliberately not fixed here.** No field added, no ticker touched, no score changed. Both branches are intake/classification rules and neither can be enforced before the frozen A/B window expires **2027-08-17** without re-rating members. Open item for the quarterly review after that date.

> **Provenance (v2.9.16, 2026-08-31):** surfaced while testing a BlockBeats item (2026-08-23) relaying ZeroHedge relaying Almonty Industries' CEO on a global tungsten shortage said to threaten AI and memory manufacturing. Tested at the equity level rather than argued. Over **2026-08-21 → 08-31**, the article's own window, the two named victims moved **−1.2%** (Kanto Denka 4047.T) and **+1.0%** (Central Glass 4044.T), and the Chinese tungsten names **−3.4%** (中钨高新) and **−2.2%** (章源钨业). Central Glass's 52-week high is **2026-08-14** and it sits **−2.4%** off it — the strongest name in the sample is one of the two firms framed as casualties. The 2026-07-01 halt is not identifiable in the cross-section either: over 06-25 → 07-31 Kanto Denka fell **−34.2%** while SK hynix fell **−41.1%** and MU **−32.2%** in the same window. **Equity prices are not evidence of physical availability**, and this does not settle a claim about inventories — no inventory figure appears anywhere in the source, which is the single most decision-relevant number and is absent. **Registered falsifier for the reading recorded here:** a memory maker states in a filing or on an earnings call that WF₆ availability constrained wafer output or capex (not "monitoring"); or WF₆ spot realises +70–90% while DRAM/NAND bit guidance is cut in the same quarter; or either Japanese producer discloses a material earnings impact from the halt. **None by 2027 FQ2 → this was a price story with a scarcity headline.** The same session withdrew a false observation from Gap #16 (see (ii) above). Per `inspired_loop` and `techpull_gate`: **documentation only — no ticker added, no field created, no scoring change, no portfolio motion.** Prior-art check ran before drafting and removed four of six candidate findings; a fifth was killed by the correlation data above.

