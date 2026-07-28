# Changelog

All notable universe / layers / framework changes, dated.

---

## 2026-07-28 — v2.8.0: constraint-decay tagging + expectation-vs-delivery check + peer-selection rule

Three instrumentation changes. **All zero-weight — no gate reads any new field, and the PASS set is byte-identical before and after: the same 20 names** (AMAT, AMKR, AVAV, AVGO, CDNS, COHR, CRCL, CRH, GLW, GOOG, KTOS, LIN, LRCX, META, NVDA, QCOM, SNPS, TER, TSM, TTMI), with the same 4 fetch errors (RNDR, TAO, FIL, MOG). This is deliberate: v2.7.1 had just demonstrated how easily an engine change re-rates holdings, so this release measures without moving anything.

### 1. `physicalConstraint` conflated two constraints that decay at different speeds

ASML holds pc=5 on EUV process lead time. CRH holds pc=4 on aggregate transport-radius economics. The five `L9_MINER_CONVERT` names hold pc=4–5 on **already-permitted grid interconnect**. The funnel credits all three as equally durable, but a technology constraint decays endogenously along a roadmap visible in filings, while a geographic one is **rented from a jurisdiction** and resets on a permitting reform or a competitor's capacity coming online — exogenous, and on no schedule you can observe.

New `constraintType` on the 52 tickers with pc ≥ 4 (only they use the score): **33 tech · 12 geo · 5 regulatory · 2 unclassified**. Surfaced in the funnel's Phys column.

The `unclassified` tag is a real finding, not a placeholder: **LINK and ETH carry `physicalConstraint = 4` for what is network effect, not physics.** Tagged rather than silently repriced — restating them would move their gate result, which is exactly what this release refuses to do. Logged as governance gap #7.

**Falsifiable claim:** geo-type pc ≥ 4 names underperform tech-type on a risk-adjusted basis over a full cycle. If no separation appears in 12 months, this tag is decoration and should be deleted, not promoted to a gate.

### 2. Every gate is denominated in expectation except the new one

`aiContribution` is a share of **forward** revenue growth; `pricingScore` leans on forward P/E and analyst targets. Backlog, capex guidance and order books are all the same species — intent, the cheapest thing to produce in a capex cycle. Worse, `aiContribution` is a **hand-set static value in `universe.json`** while its denominator moves daily: consensus can be marked down for a quarter with the funnel showing nothing.

New `realizationCheck` records what intent cannot fake — `estimateRevision` (+1y consensus EPS now vs 90d ago) and `surpriseHitRate` (beats over the last four reported quarters). Coverage: revision 76/80, surprise 78/80.

Two implementation notes that cost a rewrite each:

- **A percentage off a loss-making base is fake precision.** The first run printed ASTS at **−1836%** and RKLB at −471%, purely from a small negative base. Endpoints that are losses or near-zero are now flagged `meaningful: false` and render as `NM ↑/↓` with the raw endpoints (ASTS reads `NM(0.04→-0.65)`), standard not-meaningful convention.
- **A zero-weight diagnostic must never be able to fail a ticker.** Bundling `earningsTrend`/`earningsHistory` into the main `quoteSummary` call **dropped OKLO, SPCX and LINK out of the run entirely** — Yahoo omits `epsActual`/`surprisePercent` for loss-makers, which fails the library's schema and throws for the whole request. Now fetched via a separate lenient client, with the payload recovered from `FailedYahooValidationError.result`. Costs one extra request per ticker. The main client still validates strictly — no gate-feeding field is ever read from an unvalidated response.

**Deliberately not a gate.** A revision filter is momentum in fundamental clothing: it buys names whose estimates are already being marked up, which is the crowded, reflexive trade the A/B discipline treats as a reverse indicator. It earns a gate only if the audit trail shows revision divergence *leading* funnel-state changes.

### 3. Peer selection — the v2.7.1 open gap now has a rule, and the rule found more damage

v2.7.1 closed with peer-list selection identified as "a subjective knob controlling 55% of every pricingScore, with no rule governing it." Rule now written in GOVERNANCE.md § CHANGE a layer's `peers` list: ≥2 external peers, ≥4 valid names, business-model match, and **every peer-list change must be accepted only after recording the pricingScore delta for every ticker in the layer** — the CRDO incident in reverse.

`update-benchmarks.js` now counts external peers, writes `_externalPeerCount` / `_selfReferential`, and reports. Two findings on first run:

- **Reading `peers` only fixed half the self-reference.** A peer list made of holdings restores the defect. **L0's peers were MSFT/AMZN/META/ORCL — 4/4 universe members**, so its "sector median" was still literally the median of the book. 7 layers with entries fall below 2 external peers: L0 (0), L2, L2_5, L3, L4, L7, L14 (1 each).
- **8 layers have no benchmark entry at all**, so they silently fall back to `benchmarks.default` — a single cross-industry placeholder of forward PE 22 / EV-Rev 5. **This covers 24 of 86 tickers (28%), of which 18 hold pc ≥ 4** — meaning they have already cleared the defensibility gate and pricing is the only substantive gate left, measured against a placeholder. Affected: L5_5 (TTMI), L8_OPT_MAT (AXTI), L11_FUEL (CCJ), L_DCOMP, L_EMBI (ISRG, CGNX…), L_SPACE (RKLB, ASTS, MOG), L_DEF (AVAV, KTOS), L9_MINER_CONVERT (APLD, CIFR, IREN, WULF, HUT).

Both are **surfaced, not fixed.** Declaring peers for 8 layers would re-rate 24 tickers in one commit — precisely the move the new rule forbids without a recorded delta. Benchmark medians in this commit are unchanged from v2.7.1; only `_externalPeerCount` / `_selfReferential` were added.

> **Provenance (v2.8.0, 2026-07-28):** prompted by a Thai FDI report (BlockBeats 2026-07-23) in which investment *applications* rose 80% and were read as realised industrial capability. Two transferable defects: geographic moats are rented and decay exogenously, and an intent metric had quietly been substituted for a delivery metric. Per `techpull_gate` the expectation-denominator problem was already latent in the v2.7.1 self-reference work — the news supplied the analogy, not the motive. Per `inspired_loop` this is an instrumentation change and **not a portfolio motion**; the identical PASS set is the evidence.

---

## 2026-07-28 — v2.8.1: CAT downgraded pc 4 → 3, CMI added (L12)

Triggered by a SemiAnalysis piece on behind-the-meter power (BlockBeats relay, 2026-07-21) brought in as **supporting** evidence for the CAT position added earlier the same day. The research cut the score instead.

### First, the relayed numbers were wrong

The relay reported "~1GW signed this year, >4GW/year in 2027-2028." The actual SemiAnalysis report is titled *US Grid Constraints: Towards **40GW+** of Behind-The-Meter Datacenter by 2028?* and forecasts US datacenter buildout from +21GW in 2026 to +84GW by 2030, BTM powering **over half** of new US datacenters from 2028, and BTM equipment TAM crossing **50GW/year by 2029**, from a model tracking 40,000 power plants that has national grid headroom turning negative in 2027.

Individual orders falsify the 1GW figure directly: INNIO × VoltaGrid 2.3GW, CAT × AIP "Monarch" 2GW, CAT × ProPetro PROPWR 2.1GW, Vantage Stargate Frontier 2.58GW. CAT alone holds six publicly announced contracts of ≥1GW each. **The relayed version understated the forecast by one to two orders of magnitude.**

### CAT: physicalConstraint 4 → 3, `constraintType` removed

The original 4 rested on multi-year lead times and management's "supply-constrained, not demand-constrained" framing — assessed **without market-share data**. Three findings:

1. **CAT is third.** INNIO/Jenbacher has ~8.3GW of announced projects, exceeding Rolls-Royce (3.7GW) **plus** Caterpillar (3.6GW) combined. Six or more credible vendors compete.
2. **Latent capacity dissolves the queue** (Thunder Said Energy): only ~15GW of engine manufacturing is dedicated to the power sector today, against a ~250GW pool across marine and heavy-duty that can be redirected at modest cost. Categorically unlike a fab — 3-5 years, tens of billions, physically irreversible. **The shortage is a pricing artifact, not a physical constraint.**
3. **The speed edge is compressing.** Q1-2026 orders deliver in 2028 — a 24-30 month window that has erased the historical advantage over gas turbines, though it still beats grid interconnect at 36-84 months.

Three falsification signals added: **bridge-not-destination** (Latitude Media's *Open Circuit* challenge to this very forecast — operators pushing hardest for off-grid concede they eventually want grid service, which would make 2027-2029 a one-time transition wave rather than a plateau); a **market-share gate**; and a **delivery-vs-intent gate** anchored on the v2.8.0 `realizationCheck` baseline.

**Net effect on the PASS set: none.** CAT failed before (pricing 2.9 > 2.8 entry) and fails now. What changed is the **category** of failure — from AXTI-type "right physics, wrong price" to MOD-type structural disqualification. The distinction is load-bearing: an AXTI-type failure is re-evaluated when price falls, a MOD-type failure is not.

Recorded as a counterweight so this is not one-sided: CAT's demand evidence is unusually hard (six 1GW+ contracts, $51.2B backlog, cancellation penalties and prepayments before it commits capital) and its delivery record is solid (3 of 4 quarters beat, +8.6% average surprise). **CAT is a good business with a real order book; it is not a chokepoint.**

### CMI added — L12 secondary, watchlist, pc=3 / ai=0.35 / near / mc=3 → FAIL

A genuine coverage gap: INNIO is Advent-held private and Rolls-Royce trades OTC pink (out of scope per v1.10), so **CAT and CMI are the only public vehicles in this trade**. Covering only CAT made its apparent prominence in the universe a survivorship artifact of the investable set rather than of the competitive set.

Fails defensibility on the same vendor-agnostic latent-capacity argument. Pricing is **not** the binding constraint — CMI has the lowest forward PE in L12 (18.5 vs a ~29.5 layer median) and scored **2.2**. Another MOD-pattern name: cheap and structurally disqualified.

Three things the numbers say that the engine-boom narrative does not:

- **The central tension**: CMI's stronghold is **standby** power while CAT's focus is **prime** power — and the structural shift being underwritten here is precisely backup-to-prime. **CMI leads the segment being displaced.** Its 2028 backlog makes this an erosion, not a cliff.
- **Consolidated growth is +2.7%** (heavy-duty truck units −16%, engine segment −4%). The datacenter unit is genuinely strong — ~$3.5B expected 2026 revenue, record 22.7% EBITDA margin — and is being **fully absorbed by cyclical decline elsewhere**. A great division inside a company whose consolidated numbers don't express it is not an AI-chain instrument.
- **`realizationCheck` earned its keep on the first name it was applied to**: CMI beat consensus in only **1 of 4** quarters — the worst in L12 (PWR 4/4, CAT 3/4, GEV 2/4) — with +1y EPS revised up only 4.7% over 90 days vs CAT's 9.1%. The cheapest forward PE in the layer sits on the weakest delivery record in the layer.

### Peer-selection rule compliance (v2.8.0), logged in full

Adding CMI moved L12's medians: forward PE **31.9 → 29.5**, EV/Revenue **6.2 → 5.7**. Per the rule, `update-valuations.js` was re-run and the delta recorded for **every** member, not just the addition:

| Ticker | before | after |
|---|---|---|
| CAT | 2.9 | 2.9 |
| GEV | 3.0 | 3.0 |
| PWR | 2.6 | 2.6 |

**Observed delta: zero. No funnel state flipped.** The median moved ~7% but no member sat near a rounding boundary. Rule checks: `_externalPeerCount` = 2 (EMR, ROK) meets the ≥2 minimum; combined sample n=6 meets the ≥4 minimum; business-model match holds. **The margin is thin** — losing either EMR or ROK would drop L12 below the external-peer floor and flag it `_selfReferential`. Logged in the layer's `_changeLog`.

---

## 2026-07-28 — v2.7.1: benchmark self-reference fix + pricing hysteresis + CRDO relayer

Three engine changes, all triggered by defects surfaced during the v2.7.0 work.

### 1. `sector-benchmarks.json` was self-referential (the big one)

`update-benchmarks.js` grouped `universe.tickers` by layer and took the median of the holdings themselves. The declared `peers` field — which lists EXTERNAL comparables — **was never read**. Consequences:

- A layer could not look expensive relative to itself. L8_COOL's median forward PE was 28, computed from VRT (32.6) and ETN (25.3) — two names already carrying AI premium. Using premium-priced holdings to define "normal" means nobody registers as expensive.
- **Six layers were degenerate** (<3 members): L1, L6, L8_NET, L10, L13, L_EXP_QC. **L6 held exactly one member (MU), so its median WAS MU** — deviation pinned at 0, score pinned at 3, and 55% of MU's pricingScore carried zero information. This is a partial explanation for the long-standing "pricingScore vs PEG divergence" logged in framework v1.1: the pricing dimension structurally could not see MU as cheap. After the fix MU's raw score reads **2.2** (peg 0.14).

Fix: sample = declared `peers` ∪ universe members, deduped; iterate every layer with a benchmark entry rather than only layers holding members; write `_degenerate: true` when the live sample is under 3.

Median shifts (old → new forward PE): **L6 5.6 → 26.8**, L1 41.4 → 21.6, L8_NET 37.6 → 23.4, L10 98.3 → 60.7, L9 35.2 → 24.9, L8_COOL 28 → 22, L2_5 24.5 → 26.6.

Peer-list corrections: **IIVI removed from L8_OPT** (II-VI renamed to Coherent in 2022 — it was the same company listed twice), replaced with CIEN/AAOI/FN. **JNPR removed from L8_NET** — Juniper was acquired by HPE and returns no fundamentals; replaced with HPE/EXTR.

### 2. Pricing gate now has hysteresis

Hard cut at 3.0 replaced with an asymmetric band: **enter a pass at ≤2.8, lose an existing pass only above 3.2.** LITE crossed the old threshold 6 times in 16 sessions, so any single-day PASS record was unusable as an audit trail — which directly contaminated the A/B discipline's Gate B requirement for timestamped PASS names. Scores inside the band now carry `inHysteresisBand: true` plus a warning that the state is held over and is not a fresh signal. State anchors on the most recent scores file strictly before today, so same-day re-runs are idempotent. **15 of 80 tickers currently sit inside the band** — the borderline population is large, which is the point.

### 3. CRDO moved L8_NET → L2_5 (same day it was added)

Not a taxonomy call. Placing CRDO in L8_NET dropped that layer's median forward PE from 31.1 to 23.9 (−23%) because only 3 live samples remained after JNPR delisted, and that one addition by itself pushed **ANET — an actual holding — out of funnel PASS**. A watchlist addition must not be able to re-rate an existing position through a shared benchmark; that is contamination, not signal. L2_5 carries 5 members and the direct competitor (MRVL, same SerDes/optical-DSP/retimer product set), so it is both more robust and more comparable on business model.

### ⚠ Rating changes here are METHODOLOGY-DRIVEN and are NOT sell triggers

`funnelPass → false` is listed as a thesis-exit trigger in the investment framework. **That rule assumes the methodology is held constant.** Three names went PASS → FAIL in this run:

| Ticker | pricing | Cause |
|---|---|---|
| VRT | 2.9 → 3.6 | benchmark fix (73% of the shift) + MOD's addition to the layer |
| ANET | 3.0 → 4.0 | benchmark fix — its old PASS was self-referential (median = itself) |
| LINK | 2.75 → 3.8 | equity-script artifact; crypto is scored by `update-crypto-valuations.js`, `dq=low` |

None of these reflect a fundamental change. Treat 2026-07-28 as a **new baseline** and resume monitoring from here; a PASS → FAIL that occurs under a *stable* methodology is the signal the framework rule was written for.

### Open governance gap (not resolved)

Peer-list selection is now a subjective knob controlling 55% of every pricingScore, with no rule governing it. Swapping JNPR for HPE/EXTR moved ANET's EV/Revenue benchmark from 20.9 to 5.4 and its score from 3.0 to 4.0 — because CSCO/HPE/EXTR are low-growth incumbents while ANET is high-growth. Whether that is the right comparison set is a judgment call nobody has written a rule for. Candidate rule: peers must be ≥4 live names, business-model-matched, and changes to a peer list must be logged with the rating deltas they cause.

---

## 2026-07-28 — v2.7.0: L8_OPT CPO re-evaluation + 3 watchlist adds (CRDO / CAT / MOD)

Triggered by a sell-side note (Goldman raising 中际旭创 2026-28 EPS by 65%/108%/119%) that omitted co-packaged optics entirely. 中际旭创 itself is A-share and **out of scope by the v1.5/v1.10 universe boundary — not added**; the re-evaluation was run on the US-listed optical layer instead.

### What the live run found

The optical layer was re-priced independently of the AI mainline over July 2026: **GLW −36.2%, COHR −32.0%, MRVL −31.9%, LITE −16.9%** from 2026-06-25 to 2026-07-28, while **NVDA +0.6% and AVGO +0.7%** were flat. Sector-specific derate, not a broad risk-off. Media attribution: institutional concern over near-term CPO deployment timing (early June, Tower Semi leading declines) followed by valuation/positioning resets in July with no company-specific catalyst. Fundamentals accelerated through the derate (COHR datacenter+comms +41% YoY; LITE revenue +90% YoY).

**The 2026-05-20 CPO-slip signals on GLW and COHR partially fired.** They were written as narrative-tempo checks against Jensen's Corning announcement; the July derate is the first time they paid.

### Capture answer (the question the re-evaluation was run to answer)

CPO moves capture toward **architecture-neutral positions**, readable straight off the existing `moatCapture` column:

- **mc=5** — TSM / ASML / SNPS / CDNS / NVDA. TSM is the clean winner: CPO is an advanced-packaging problem (COUPE), so it sells one more layer in the CPO era than in the pluggable era.
- **mc=4** — **GLW** is the only L8_OPT name here, on the premise that glass and fiber are required under *both* architectures.
- **mc=3** — **LITE, COHR**. Real component barriers (InP/EML capacity), but product form is dictated by the downstream architecture.
- Pure module assembly (the AAOI tier) is the exposed segment and is **correctly absent** from the universe.

### Falsification hardening (3 tickers, no dimension changes)

Existing CPO signals all required predicting CPO *timing*. Added gates that read off reported numbers instead:

1. **GLW** — architecture-neutrality break, aimed directly at the mc=4 premise: CPO fiber-array-unit sourcing migrating to the packaging tier (TSMC COUPE / ASE) with a measurable divergence test (optical enterprise/DC sub-segment <15% YoY for 2 quarters *while* hyperscaler CPO ports grow >50%). Check 2027-03-31.
2. **COHR** — quantified supercycle-peak gate: datacenter+comms growth <20% YoY for 2 consecutive quarters (baseline +41% in FQ3 FY2026). Direction-agnostic — COHR derates whether CPO arrives early (socket loss) or late (multiple compression). First check **2026-08-12** (FQ4 report).
3. **LITE** — two conversion gates on the three-track thesis: ELS+OCS must reach 15% of quarterly revenue by FQ4 FY2027, and the disclosed CY27H1 CPO order must convert to revenue with OCS backlog holding above $400M. Rationale: FQ3 FY2026 disclosures (a booked CPO order, >$400M OCS backlog) are the first hard evidence that **CPO does not uniformly kill optical suppliers** — it removes the module and the DSP but still needs an external shared laser source. That makes the thesis testable, so it now carries conversion gates.

### Three watchlist adds

| Ticker | Layer | PC | AI | ttr | mc | pricing | Funnel |
|---|---|---|---|---|---|---|---|
| CRDO | L8_NET secondary | 4 | 0.85 | near | 3 | 3.0 | PASS (borderline) |
| CAT | L12 secondary | 4 | 0.40 | near | 3 | 3.0 | PASS (borderline) |
| MOD | L8_COOL secondary | 3 | 0.70 | near | 2 | 1.9 | **FAIL** (defensibility) |

- **CRDO** — the copper vector, and the only counterparty in the universe to the optical layer: every L8_OPT name is long the same architectural outcome, CRDO is short it. PC=4 assigned for consistency with the ALAB precedent (fabless interconnect silicon), *not* for fab lead time. **Layer placement is provisional** — spans L2_5 (peer MRVL) and L8_NET; a dedicated `L8_ICONN` sublayer was considered and **rejected** because `sector-benchmarks.json` derives layer medians from a peer list, and a single-member layer yields a degenerate median (deviation 0 → pricingScore pinned at 3). Benchmark sensitivity is material: L8_NET medianForwardPE 37.6 vs L2_5 24.5. **pegRatio = N/A** — per the AXTI/CIFR/WULF precedent, sustained N/A means an unmonitorable thesis; re-check in 2-3 weeks.
- **CAT** — inverts the usual failure mode: a slow-growing industrial (+22% revenue) that passes the AI gate on incremental-growth accounting, using the **CRH v2.1.2 convention** (Power & Energy is ~42% of revenue but includes oil & gas; datacenter-driven generation is the dominant source of *incremental* growth as construction decelerates). aiContribution=0.40 is discounted for the oil & gas share and is **the load-bearing assumption** — CAT reports no separate datacenter revenue line, so falsification signal #1 tests that number directly. Layer L12 because peer GEV is CAT's direct gas-turbine competitor.
- **MOD** — retained deliberately as the layer's **counter-example**, not as a candidate. Fastest growth (+47.5% revenue, +158% datacenter in FQ4), cheapest inputs (forward PE 20.3 vs L8_COOL median 28.0; EV/Rev 3.99 vs 8.3), largest analyst upside (+47.9%) — and it fails **both** arms of the defensibility OR-gate. Gross margin 23.0%, **down 190bps YoY while revenue grew 23%**: a supplier with pricing power does not absorb cost and tariff increases during its own demand boom. Direct comparator VRT sits in the same layer at 37.2% GM and mc=4. Coverage caveat: 7 analysts, near the AXTI thin-coverage threshold.

All three are `secondary` + `watchlist`, so the Tier-3 ADD gate requiring `supplyChainEvidence` for `primary` role is not triggered; CAT and MOD carry one filing-sourced evidence entry each, CRDO carries none (recorded as such rather than fabricated).

### Engine defect found, not fixed

`funnelPass` is a hard cut at `pricingScore <= 3.0` with no hysteresis. LITE crossed the threshold **6 times in 16 trading sessions** (2.8–3.5 range) through July. Any single-day PASS/FAIL record is therefore noise, which directly contaminates the A/B discipline's Gate B requirement to produce timestamped PASS names — one can retroactively pick a date to support either conclusion. `audit-universe.js` already applies a 5-consecutive-day rule for *promotion* candidates; the same debouncing does not exist on `funnelPass` itself. Suggested fix (not implemented): asymmetric band — enter PASS at ≤2.8, exit at >3.2, or require N consecutive days.

Also noted: `sector-benchmarks.json` lists `IIVI` as an L8_OPT peer. II-VI renamed to Coherent (COHR) in 2022 — the same company is counted twice in the layer median.

---

## 2026-06-25 — schema v2.6.0: `moatCapture` 5th dimension (Guo 2026 moat thesis)

Triggered by user reading Sarah Guo's "what's the moat when models eat everything" essay (深潮 TechFlow, 2026-06-11). Core transferable insight: **"moat exists" != "the startup captures it"** — value can be real yet accrue to the incumbent above (component vendor) or the customer below, leaving the AI supplier a replaceable vendor. This is a private-correctness axis **orthogonal to `physicalConstraint`** (which covers PHYSICAL lead-time only). Per `inspired_loop` discipline this is a tooling/schema change, not a portfolio motion.

### v2.6.0 — three new fields + a defensibility gate

1. **`moatCapture`** (1-5): WHO captures the private-correctness moat. 1=pure supplier (moat accrues up/downstream, replaceable), 3=contested, 5=the entity holds the private ground truth / license / liability / user habit a smarter model still cannot enter. A `physicalConstraint=1` ticker can be `moatCapture=5` (PLTR).
2. **`moatLocks`**: subset of {licensing, liability, privateData, userHabit, integration} — the NON-physical locks (physical lead-time stays in `physicalConstraint`, not double-counted).
3. **`moatFalsification`**: condition under which the moat is shown to accrue elsewhere / be absorbed.

**Funnel change**: single gate `physicalConstraint>=4` → defensibility gate `physicalConstraint>=4 OR moatCapture>=4` (survive commoditization via a physical chokepoint OR a non-physical moat). **Supplier-trap** (`moatCapture<=2`) is a WARNING, not an auto-fail; `audit-universe.js` also annotates (does not veto) cheap-valuation promotion candidates that are supplier-traps (human decides — automation-boundary principle).

**Effect (2026-06-25)**: 81/81 active+watchlist seeded (analyst judgment, each falsifiable). Net structural effect over a pure-physical gate = **4 moat-rescued passes** (META, GOOG, PLTR, QCOM) — names `pc<4` the old gate would have killed. PLTR reconciles with the standing "唯一公开 capture" thesis. ai/timeToRealize/pricing gates still correctly block TSLA (price), EQIX (far), OKLO/SMR (ai<0.30). 18 supplier-traps surfaced; FLR + AA flagged in promotion candidates.

---

## 2026-06-18 — schema v2.5.0: `supplyChainEvidence` + `catalysts` thesis fields (method borrowed from Serenity, tickers rejected)

Triggered by user asking whether the Serenity Taiwan-CPO methodology (TechFlow 深潮, 2026-06-09, "新股神" 9-stock Taiwan AI supply-chain list) is worth borrowing. Verdict: **method yes, tickers no.** Serenity is an anonymous X KOL talking his own book (long Win/均华/鑫创), picks are small-cap + no-coverage = exactly where a following moves price and the caller benefits — a reverse-indicator profile, same class as the framework's existing "Jensen 喊单 = 反向指标" rule. His "台股无泡沫" blanket claim is a 报喜 stance already cracking (Broadcom 6/3 AI guide miss → SOX −10.26% 6/5 + KOSPI 熔断 6/8), and his valuation rests on "management lowballs guidance so forward PE will look cheap" — the same narrative-bridge disease flagged on Securitize's EBITDA ramp. The 9 tickers are Taiwan small-caps **outside the US universe by design** — not added.

**What WAS transferable** (two disciplines distilled into the thesis schema, no new tickers, no portfolio motion):

### v2.5.0 — two new OPTIONAL thesis fields + ADD gates

1. **`supplyChainEvidence`** — array of `{claim, source, type}`, type ∈ `{patent|teardown|filing|thirdparty|contract}`. EXTERNAL proof the ticker occupies its mapped chokepoint (Serenity's model: Hunterbrook/Citrini confirmed FOCI in TSMC COUPE via 22-channel FAU **patent cross-reference**, not IR). Company IR self-report / press release explicitly does NOT count. Directly serves the existing `tag_fact_sources` + `no_fabrication` disciplines: chain membership must be sourced, not asserted.
2. **`catalysts`** — array of `{date, event, source}`. Dates the `timeToRealize` field (Serenity's model: COUPE 2026 mass-production as a hard time anchor). A passed catalyst date with no thesis movement becomes a soft falsification flag.

**ADD gate (Tier 3) now requires:** ≥1 `supplyChainEvidence` entry (else not eligible for `primary` — narrative ≠ chokepoint) + ≥1 dated `catalysts` entry for `near`/`mid` tickers. **Tier 2 quarterly review** adds rolling backfill of both fields on existing `active primary` tickers (a primary that can't be externally evidenced after one cycle → reconsider its `primary` role).

Schema-only change: 83 tickers unchanged, no scores/alerts affected, no funnel-logic change. Per `inspired_loop` discipline (KOL memo → 24h no-position-motion), this is a template hardening, not a trade.

---

## 2026-06-03 — TER added (L4 back-end test) + VPG added (L_EMBI tactile-sensing) + scope-law correction

Triggered by user's OWN coverage-audit (not external slop): "化工 / PCB / 材料 / 精密仪器 四赛道是不是遗漏了" + follow-on embodied/commercial-space scope-expansion reasoning. This closed an 11-trigger inspired-bombardment week (2026-05-26 → 06-03) — see memory `vc_pitch_source_bias` case #1-5. The `inspired_loop` delta-gate (built mid-week) classified the ticker-chasing parts as net=0 and routed only genuine framework-coverage questions to deep analysis. Universe `v2.2.3 → v2.2.5`, 79 → 81 tickers.

### v2.2.4 — TER (Teradyne) added to L4 secondary

Back-end test (ATE) duopoly with Advantest — complements L4 front-end WFE (AMAT/LRCX/ASML/KLAC). Chip test is the under-covered back-end chokepoint; intensity rises with HBM stacking, chiplets, advanced packaging. Static funnel gate PASS (pc=4 / aic=0.40 / near); pricingScore TBD by next `update-valuations` run. **First funnel-PASS-eligible new name of the 11-trigger week** (vs INTC / HPE / 800V-cluster / SIVE, all expected funnel-FAIL) — because test is a genuine ASML-tier duopoly chokepoint. Surfaced via user coverage-audit (化工→L3_5 / PCB→L5_5 / 精密仪器→L4 KLAC all already covered; only back-end test was a true gap). VPG-as-precision-instrument was REJECTED (industrial force/weighing sensors, not an AI chokepoint).

### v2.2.5 — VPG (Vishay Precision Group) added to L_EMBI watchlist

Tactile/force-sensing periphery of embodied AI (strain gauges / load cells for humanoid force-feedback). Complements PH (actuation/motion) on the sensing axis. **Expected funnel FAIL** (aiContribution=0.08 << 0.30, physicalConstraint=2 — precision sensors have competitors, not a chokepoint). Added per user "B2" decision as a tracking handle only, NOT a funnel candidate; same watchlist-periphery tier as PH. The funnel-PASS embodied chokepoints remain ISRG/CGNX.

### Scope-law correction + 3rd repeat of the grep-existing-layers error (self-audit)

User proposed treating electrification / humanoid / commercial-space as scope extensions of the AI core. Assistant initially argued embodied must be a SEPARATE sibling map (claiming aiContribution would "break" downstream). **This was refuted by the framework's own existing structure**: embodied is already an in-map layer `L_EMBI` (since v0.6 / 2026-05-08 — ISRG primary pc5/aic0.75 + CGNX primary pc4/aic0.65 active; PH/TSLA secondary watchlist), and commercial space is already `L_SPACE` (RKLB/ASTS primary + MOG secondary). aiContribution is fully coherent for embodied because **embodied AI IS an AI application, not a separate core**. Corrected scope-law (encoded in memory `investment_framework` v2.1): chokepoint-trace is core-agnostic; the discipline is **toll-booth (own the mandatory gate) vs OEM-betting (gambling on which Tesla/Figure/Unitree wins)** — orthogonal to upstream/downstream. The "embodied的MU/LITE/VRT" the user sought ALREADY EXIST as ISRG/CGNX. Electrification already covered at L11/L12/L8_COOL (CEG/VST/GEV/VRT/ETN). Commercial space conceded as FOMO by user (SpaceX = private, await IPO; L_SPACE already covers public vehicles).

**Methodology meta — 3rd instance of the same error.** v1.7 already logged two "missed existing layer/role" errors (L11/L12 already covered power; CCJ bridge role). This session nearly built a duplicate EmbodiedMap sibling before grepping that L_EMBI already exists — grepped tickers but not layer names. **Reinforced rule: before extending OR creating a layer, grep the layer name (`L_*`) + full layerRole scan to confirm it does not already exist.**

---

## 2026-05-27 (afternoon) — CBRS thesisFalsification Expansion + Inspired-Loop 4-in-48h Test

Triggered by heterogeneous-inference essay (SemiAnalysis-style long-form analysis of GTC 2026 + Cerebras + Groq architecture). User-proposed "布局这个赛道和概念" framing. Framework REJECTS new entry but hardens existing CBRS watchlist falsifications. Universe `v2.2.2 → v2.2.3`. Net: **+4 thesisFalsification signals on CBRS (existing watchlist entry), no new tickers, no portfolio motion**.

### Self-audit: ticker-existence verification gap

Initial response to this session incorrectly stated CBRS was "private equity, reject per framework_thiel_bypass" before grep-verifying universe contents. CBRS had been in universe at L2 secondary watchlist since 2026-05-15 (v1.8.0, IPO+1 day add) with comprehensive watchlistReason already documenting G42 concentration + P/S >1000x funnel-fail + lockup expiry watch. **Lesson: Hard Stop discipline 'before quoting holdings/universe state, verify source' applies to assertions ABOUT universe state, not just persisted memory.** Duplicate L6 secondary entry was created, then removed; falsifications merged into original L2 entry.

### v2.2.3 — CBRS Falsification Hardening

CBRS (Cerebras Systems, L2 secondary, status=watchlist since 2026-05-15) thesisFalsification expanded 3 → 7:

**Original (2026-05-15):**
1. G42 customer concentration (~85%) materially reduces
2. FY26 revenue >$1B (vs FY24 $78M)
3. Stock <$100 (P/S <30x) post-lockup unwind

**Added (essay-derived, 2026-05-27):**
4. Gross margin remains negative or <10% through C2027 (Groq peer-economics suggest SRAM-route unit economics unviable absent VC subsidy — GM −50% on $40M rev / $60M cost in 2025)
5. AWS Trainium + Cerebras disaggregated inference integration stalls (strategic moat hinges on this partnership reaching production)
6. NVDA Rubin + LPX (post-Groq acquisition) achieves >800 tok/s in production at competitive TCO — token-speed differentiation collapses
7. HBM4 (22TB/s+ per stack) closes SRAM bandwidth advantage to <5x by 2027 — long-term moat erodes as SRAM scaling plateaus on N3E (SRAM cell shrink near zero)

**Cross-implication:** Falsification #6 fires simultaneously with NVDA thesis-reinforcement (NVDA system-level integration is bull case for NVDA). Falsification #7 also applies to all SRAM-route accelerator startups (d-Matrix, MatX, SambaNova — none currently in universe per private-equity reject rule).

watchlistReason updated to document 2026-05-27 essay re-confirmation. Lockup expiry watch remains 2026-11-14. Re-entry conditions unchanged: (a) price <$100 OR (b) FY26 revenue >$1B OR (c) G42 dependency <50%.

### Inspired-Loop Bombardment Test: 4-in-48h

| # | Date | Trigger | Motion proposed | Framework verdict |
|---|---|---|---|---|
| 1 | 2026-05-26 AM | Meng Xing essay (Wuyuan VC) | NVDA permanent-core elevation | ✅ Reject (v0.7 structural) |
| 2 | 2026-05-26 PM | Lao Wu (qinbafrank) 5 essays | CN/HK ticker basket | ✅ Reject (universe v1.5 scope) |
| 3 | 2026-05-27 AM | MU sell-side $1,625 PT + Trump tweet | MU/INTC national-champion entry | ✅ Encode as falsification, not buy |
| 4 | 2026-05-27 PM | Heterogeneous-inference essay | "Layout the heterogeneous-inference racetrack" | ✅ Reject (thesis priced into NVDA/AVGO; CBRS already watchlist) |

**Net result of 4 inspirations:** 0 portfolio motions, 1 new universe entry (INTC L5 secondary active, expected funnel-FAIL), 7 thesisFalsification signals added across MU (+2) / INTC (+5 initial) / CBRS (+4). Framework `feedback_inspired_loop` cooldown (24h) holds against bombardment frequency (12h average inter-trigger).

**Universe state:** 79 tickers, v2.2.3, active 48 / watchlist 29 / experimental 2.

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
