# Changelog

All notable universe / layers / framework changes, dated.

---

## 2026-09-03 — v2.9.18: the freeze was a pre-registration, not an enforcement — and the rule it could not check was the one it exists for

**Gap #13 addendum. No gap added, no ticker added, no field created, no score changed, no portfolio motion.**

⚠️ **First entry in this lineage to change a non-`.md` file.** Every prior governance commit was documentation plus, at most, a read-only script. This one adds enforcement to `scripts/ab-track.js` and creates `data/ab-track/run-log.jsonl`. Stated up front because "documentation only" was a real constraint and this breaks it deliberately: a rule nothing checks is not a constraint, and seven pre-registered rules had been sitting in a JSON file for 17 days with one of them unexecuted.

### Execution audit of `_meta.preRegisteredRules` — 5 enforced, 1 partial, 1 empty

`membership` · `weighting` · `holdingPeriod` · `startPoint` · `significance` are all executed by the code. `exitDoesNotRemove` is partial. **`noReweighting` was not executed at all** — nothing ever compared `physicalConstraint`/`moatCapture`/`aiContribution`/`timeToRealize` against the frozen roster.

**Why that one matters most.** `membership` blocks *retroactive* re-scoring, because history is read from scores files written at the time. It does not block *forward* contamination: editing `moatCapture` today changes what **tomorrow's** scores file says about `funnelPass`. The basket composition drifts going forward and the returns still look clean. **That is the 39-in-window-re-scorings defect the freeze was written to stop, and the freeze recorded the right values without ever comparing anything to them.** The `pricingScore` hole named in Gap #13 is one instance of this, not the whole of it.

### Three mechanisms

| | mechanism | design note |
|---|---|---|
| 1 | **Integrity anchor** | **Ask git, do not store a hash.** A digest written by the process that can rewrite the file proves nothing. The freeze must have exactly one commit and a clean worktree. Verified: `frozen-2026-08-17.json` @ `9c38e6d` |
| 2 | **`noReweighting` enforced** | four pinned fields × 87 roster members. Additions to `universe.json` are not violations; edits to a frozen member are |
| 3 | **Trial bookkeeping** | `run-log.jsonl`, append-only. DSR needs a trial count; nobody supplies one because nobody records one, and self-reports run low — a look you regretted does not feel like a trial |

**`runs` and `distinctEnd` are reported separately and deliberately not collapsed.** Ten runs on one day is ten looks and one observation. Which is "the" trial count is the reader's call; the script does not apply the correction itself, because choosing the trial definition after seeing the returns is the error the freeze exists to prevent.

### Violations now exit non-zero **and** are recorded

The first implementation exited without logging — **enforcing the delete clause by breaking it.** The clause asks that a violated test be *recorded* as having failed to run.

### Mutation-tested

Breaking each protection kills exactly its own check. `MSFT.moatCapture 3→4` → exit 1, `noReweighting violated` logged. Uncommitted edit to the freeze → exit 1, `integrity` logged. Unmodified → exit 0 with a full result row. Both mutations reverted byte-for-byte against a pre-mutation copy.

### ⚠️ The new check's first run was a false positive, from the family this repo documents

`IONQ` and `RGTI` carry no `moatCapture` key in `universe.json` (the only two of 87); the frozen roster normalised that absence to `null`. A `JSON.stringify` comparison flagged both as violations. **A check that fires on how emptiness is spelled gets switched off within a day.** Fixed by collapsing `undefined ↔ null` only — `3 → null` remains a violation, because that is removal, not spelling.

### Scope, stated rather than implied

**This stops self-deception, not fraud.** Anyone willing to amend history defeats all three mechanisms. That is the correct scope: pre-registration defends against the author fooling himself, and a reader who needs more has the git log.

⚠️ **Not cleaned:** `run-log.jsonl`'s first lines include two mutation-test failures from building this. No `ignore` field was added — **a log with an exemption field is a log with an escape hatch, and the exemption would get used.** Provenance is written in GOVERNANCE.md instead.

### Line endings pinned to the repository — and what checking that safe revealed

**Found while reverting the mutation tests:** `core.autocrlf=true` while `data/universe.json` sat LF in the worktree. `git status` reported clean **from its stat cache, without ever comparing content**; the first git operation to touch it rewrote **3318** line endings (281,769 → 285,087 bytes) with a content diff of **exactly zero** — the worst shape a diff can have, a whole-file change that any real edit could hide inside. autocrlf is per-machine and this repo is cloned on more than one, so the setting drifts; `.gitattributes` (`* text=auto eol=lf`) travels with the repository.

⚠️⚠️ **Checking whether that was safe surfaced something worth more than the fix.** A repo-wide `git add --renormalize .` would have rewritten `frozen-2026-08-17.json`, given it a second commit, and **silently voided the integrity check added in this same release** — the freeze would still be byte-identical in content and the check would still fail. Verified before adding: the repository already stores LF (autocrlf converts on commit), so renormalisation touched **zero blobs** and the freeze still shows 1 commit.

**But the near-miss names a weakness in the check itself: commit count is a proxy for "content unchanged", and the two come apart under any repo-wide operation** — a renormalisation, a formatter, a `filter-branch`. The robust judgement is *"parse the freeze as it stands and as it was first committed, and compare the objects"*, which is immune to line endings, indentation and encoding, and still needs no stored hash (`git show <first-commit>:<path>`). **Not changed here** — this release is already the first to touch non-`.md` files, and swapping the integrity predicate is a separate decision with its own mutation tests. **Recorded as the next thing to fix, with the mechanism named.**

### Current reading (9 adjacent segments, n=9 — reported because omitting it is the habit this file exists to break)

| basket | cum | ann/vol |
|---|---:|---:|
| pass-set | **−2.45%** | −1.63 |
| FAIL-set | −0.41% | −0.45 |
| all-universe | −0.95% | −0.91 |
| SMH | −0.54% | −0.49 |

pass-set minus all-universe **−0.165%/day, t = −1.14, n = 9, NOT SIGNIFICANT**. The pass-set is the worst of the four baskets over this span. **Nine segments settle nothing in either direction**, and that sentence is the same one that would be here if the sign were positive. Window runs to 2027-08-17.

### ⚠️ A fourth gap, found by this entry's own first draft

The paragraph above originally read `n=7` with a positive pass-set, computed while the local checkout was **three scoring days behind origin** (`2026-08-31`, `09-01`, `09-02` existed only on the remote). Same script, same freeze, same rules — **a different answer, because the data the tool could see was not the data that existed.**

`ab-track.js` verifies the freeze against git and the roster against `universe.json`, and has **no check at all that `data/scores/` is current with the remote.** It cannot tell "the window has 9 segments" from "the window has 9 segments *here*". That is the availability failure this project documents, arriving one layer above where it was being looked for: not a missing field inside a record, but a missing record inside a directory.

**Recorded, not fixed** — the fix is one `git fetch` plus a count comparison, but it belongs with a decision about whether this script may touch the network for anything other than prices, and that is a separate call.

---

## 2026-08-31 — v2.9.17: the capex proxy cannot tell "downstream and not paying" from "upstream and refusing to expand"

**Gap #15 addendum. No new gap, no ticker added, no field created, no score changed, no portfolio motion.**

### A fourth domain instance for Gap #15

| | capex / revenue | gross margin | in universe |
|---|---:|---:|---|
| Micron (DRAM/HBM, IDM) | **28.0%** TTM · 42.4% FY2025 | 72.6% | **yes** — `L6`, the only storage name |
| Seagate (mass-capacity HDD) | **4.7%** FY2026 · **2.9%** FY2025 | 45.6% | no |
| Western Digital (mass-capacity HDD) | **3.2%** FY2026 | 48.9% | no |

**The engine holds the storage name that pays the buildout bill and omits the two that do not.**

First-party, Seagate FQ4 FY2026 earnings call: **218 EB shipped, +34% Y/Y**, nearline **195 EB, +43%**, price per EB **+10%**, and *"in the face of sustained demand, Seagate is not adding disk drive unit manufacturing capacity"*, with nearline exabytes *"allocated into calendar 2028."* WDC: revenue +44% on *"strong exabyte growth and favorable pricing dynamics"*, price per TB "high teens."

Decomposition closes against an independent figure: DC revenue +57% = volume +43% × price +9.8% vs the +10% reported. **Volume 79% of growth, price 21%.**

### The caveat — and it is the point of this entry

Gap #15 records capex intensity as *"a cheap, public, continuous proxy for which side of the supply/capture divide a ticker sits on."* **It is mechanism-blind.** Low intensity means either *downstream and not funding the buildout* (CRM) or *upstream and refusing to expand* (Seagate). Identical proxy reading, **opposite durability** — the first lasts as long as the layer structure, the second ends when capacity arrives or the duopoly breaks. A book that cannot separate them will hold the second believing it owns the first.

### v2.9.10's rejection is corroborated by a fresh failure, and the failure was mine

v2.9.10 tested four margin-capture formulations and concluded: *"gross margin conflates pricing power, cost structure and mix, and **the income statement alone cannot separate them**"* — with `price/volume decomposition calls TSM "83% price-driven"` as the worked counter-example, because TSM's COGS is mostly depreciation.

That conclusion was read, quoted, and then **ignored** in this session. Annual COGS growth was used as a volume proxy across five names, producing Micron **+142% revenue on +10% COGS** and the inference that **volume was flat and the surge was ASP**. Primary operating data says the opposite: **capacity shipped grew 34–43% Y/Y.** COGS did not move because **cost per TB is falling fast** (HAMR; 3 TB → 4 TB per disk, which the CFO names as a profitability driver), not because volume was flat.

**The method failed exactly where v2.9.10 predicted, and the right number was one search away in trade press that publishes exabytes shipped quarterly.** Recorded because the repo's own rejected-method list is only useful if a later reader can see it was re-tested and re-failed.

### Source discipline applied to the same call

- **Reported operating metrics** — 218 EB, +34% Y/Y, +10% per EB, "not adding capacity", CY2028 allocation. **Hard.**
- **Attribution** — WDC's CEO: *"Agents generate data at every step of a workflow … we continue to view agentic AI as a structural and step function driver of capacity-oriented storage demand,"* and *"Physical AI accelerates the cycle further."* **Management narrative from the party selling the drives**, held to the same standard §ADD applies to IR self-report. Seagate's own framing is more restrained: AI demand *"builds on demand for traditional data-intensive applications, including video."*

**The volume growth is a fact. Its attribution to AI is a claim by an interested party.** Both are recorded; only the first is treated as evidence.

---

## 2026-08-31 — v2.9.16: a restriction on an input is not the same as a shortage of it, and nothing asks who the marginal buyer is

**GOVERNANCE Gap #17 opened. One false observation withdrawn from Gap #16. No ticker added, no field created, no score changed, no portfolio motion.**

### Correction first — v2.9.15's "peer divergence" was false and pointed the wrong way

Re-pulled two-year Yahoo series while building a benchmark for something else. As of the same 2026-08-28 close:

| | v2.9.15 recorded | actual |
|---|---|---|
| SK hynix top / drawdown | 2026-05 / −37.6% | **2026-06-22** / **−43.4%** |
| Samsung top / drawdown | 2026-05 / −23.1% | **2026-06-18** / **−29.1%** |
| MU top / drawdown | 2026-03 / −3.9% | **2026-06-25** / **−23.1%** |

**All three topped inside seven days; there is no divergence.** MU's drawdown is the shallowest, not absent, and MU has no 2026-03 high at all — its Q1 maximum was $524.60 on 2026-04-27, which the 08-28 close of $932.90 is **+77.8%** above. The −23.1% recorded as Samsung's is MU's; −3.9% and "2026-03" do not reproduce from any series.

The entry was flagged when written as *"explicitly not offered as a substitute for the registered falsifier"*, so **nothing downstream consumed it** — MU's CYCLE-PEAK DETECTION (opened 2026-07-29, gross-margin falsifier, first check FQ4 FY2026) is untouched and remains the only registered test. But the withdrawn observation implied *MU is late to roll over*, and the record says the opposite.

**Not doing the tempting thing:** MU is now −23.1% from its June high while the registered falsifier has not fired. Substituting price action for the registered test is exactly the mid-flight swap that voided the first A-track window (Gap #13). Recorded as context, not as the test firing.

### Prior-art check removed four of six candidates; a fifth was killed by data

| candidate | status |
|---|---|
| interested source → narrative, not chokepoint | ⛔ **already stated** — §ADD: *"Company IR self-report or press release does NOT count"* |
| commodity moat leaks to spot pricing | ⛔ **already stated** — §Solvability × Capture, the FCX/EOG/AA cell |
| subsidised rival destroys scarcity | ⛔ **Gap #16 A**, written one day earlier — the +1,000 t/yr add is an instance, not a rule |
| "has new technology reduced physical scarcity?" | ⛔ **already a Tier 2 criterion** |
| tungsten equities = memory beta in an upstream label | ⛔ **falsified by its own data** — see below |
| export-control branch of the regulatory test | ✅ new |
| demand-attribution check at intake | ✅ new |

### A — the regulatory test only classifies permissions attached to the ticker

§3 tests a rationed permission the ticker needs; §3a splits licensing into licensee/licensor. **A foreign government rationing an input the ticker consumes fits neither** — no queue exists and the restricting party is not a counterparty.

Discriminator: **is the restriction aimed at the material, or at the location of the conversion step?** Test: *while the input is restricted, is downstream capacity being added anywhere?* If yes, supply has **moved**, not vanished.

The prompting case answers itself — China restricted high-purity tungsten powder, two Japanese WF₆ producers (~1/4 of global supply) halted 2026-07-01, and **a Chinese producer announced +1,000 t/yr of WF₆.** That is onshoring of a value-added step, and it predicts a price window rather than a volume crisis.

**Limitation, landed knowingly:** the universe has no materials or precursor ticker. A full-repo sweep for `tungsten|WF6|钨` returns one hit — an auto-ingested headline at `data/alerts/2026-05-19.json:1008`. This branch has nothing to apply to today.

### B — `supplyChainEvidence` tests occupancy, never attribution

A tungsten miner genuinely occupies the tungsten chokepoint. But **~2/3 of global tungsten demand is cemented carbide**, and semiconductors are a fraction of the remainder — so the price is set by manufacturing volumes and scrap recycling, both elastic in the direction the scarcity pitch denies. **AI is in the headline and is not the marginal buyer.**

Test at intake: *before accepting "X is a bottleneck for AI", state what share of X's demand AI is.* Mirror of the FLNC/CATL question — that one asks who captures, this one asks whether the named demand sets the price.

### Measured, and what it did to my own hypothesis

Article window **2026-08-21 → 08-31**: Kanto Denka **−1.2%**, Central Glass **+1.0%**, 中钨高新 **−3.4%**, 章源钨业 **−2.2%**. Central Glass's 52-week high is **2026-08-14** — the strongest name in the sample is one of the two firms framed as casualties. The 07-01 halt is not identifiable in the cross-section: 06-25 → 07-31 Kanto Denka **−34.2%** vs SK hynix **−41.1%** and MU **−32.2%**.

**Hypothesis killed:** tungsten equities as memory beta. 中钨高新/厦门钨业/SK hynix all topped **2026-06-22**, same day — but trailing-year daily log-return correlations are **0.25 / 0.28** to SK hynix and **0.18 / 0.20** to MU, against a **0.33** SK hynix—MU benchmark and **0.84** between the tungsten names. Shared risk turn, not shared cash-flow driver. *(Kept incidentally: Kanto Denka—SK hynix **0.52**, above the benchmark; Almonty—SOXX **0.40** vs Almonty—SK hynix **0.12**.)*

**Equity prices are not evidence of physical availability.** No inventory figure appears anywhere in the source — the most decision-relevant number, absent.

### Registered falsifier

A memory maker states in a filing or on an earnings call that WF₆ availability constrained wafer output or capex (not "monitoring"); **or** WF₆ spot realises +70–90% while DRAM/NAND bit guidance is cut in the same quarter; **or** either Japanese producer discloses a material earnings impact from the halt. **None by 2027 FQ2 → price story with a scarcity headline.**

### Not fixed here

Both branches are intake/classification rules; enforcing either would re-rate members inside the frozen A/B window (`data/ab-track/frozen-2026-08-17.json`, 87 names) — barred until **2027-08-17**.

---

## 2026-08-30 — v2.9.15: the engine prices rivals that want a return, and never asks how long being wrong costs

**GOVERNANCE Gap #16 opened. No ticker added, no field created, no score changed, no portfolio motion.**

### Prior-art check ran first and removed three of five candidate findings

This is recorded because the check is the reason the entry is short.

| candidate | status |
|---|---|
| "forward P/E is a cyclical trap" | ⛔ **already an implemented gate** — `cyclicalTrap` fires on the trailing/forward ratio; CHANGELOG v2.9.6 argued it more strongly: *"the 5.0 is arithmetically correct and economically empty — which is what a cyclical value trap is"* |
| "MU is at a cycle top" | ⛔ **already pre-registered** — CYCLE-PEAK DETECTION opened 2026-07-29, carried in every `data/alerts/*.json` since. Its falsifier is better than the one proposed: *GM declines sequentially for two consecutive quarters from the 2026 peak **while HBM bit shipments still grow*** — which separates a pricing turn from a demand turn. First check FQ4 FY2026 |
| "subsidy destroys scarcity" | ⛔ **already stated** in § Structurally Self-Referential Layers: *"When admission is subsidised, admission is not scarce, and the direction of the subsidy is the direction of the scarcity"* |
| return-agnostic rival voids **effective scale** | ✅ new |
| recovery asymmetry after the trap fires | ✅ new |

### A — the rival's objective function is never stated

Gap #11 lists **effective scale** as unhoused: *"a market whose total addressable economics support only a few profitable participants, so a **rational** entrant declines to enter even though nothing bars entry."* Every capture score in the book prices a return-maximising rival. A rival buying supply security is not deterred by the fourth-entrant-loses-money argument — **that outcome is the thing it is paying for.**

Decade-long readout of the only natural experiment available:

| | figure |
|---|---|
| 大基金 I + II + III registered capital | ¥987.2bn + ¥2,041.5bn + ¥3,440bn = **¥6,468.7bn** (≈ $90bn) |
| CXMT DRAM share, Q2 2026 (revenue) | **7%**, #4 — vs Samsung 39% / SK hynix 26% / Micron 25% |
| YMTC NAND share, Q1 2026 (revenue) | **13%**, from 8% a year earlier |
| YMTC, Q2 2026 (bit shipments) | **#3**, ahead of Micron / Kioxia / SanDisk |
| CXMT target | **30% by 2030**, source names *"access to advanced chipmaking tools"* as the binding constraint |

**The generalisation:** the existing subsidy rule points at gatekeepers; it applies to competitors too, and nothing runs it in that direction. **The consequence inverts the usual reading** — under Solvability × Capture (*solved ≠ defensible*), supply-side solved means capture-side destroyed **for the winner as well**. "The programme succeeds" and "the programme's equities compound" are two propositions. Korea 2009 supports the second only because that price war *ended* and left three players; a participant with no return constraint is the condition under which it does not end.

### B — `timeToRealize` measures when a thesis pays, not what being wrong costs

Monthly closes, dot-com peak to reclaim (Yahoo, independently pulled 2026-08-30):

| | 2000 peak | trough | drawdown | **years to reclaim** |
|---|---:|---:|---:|---:|
| MU | $81.50 | $7.99 | −90.2% | **20.5** |
| SK hynix | ₩516,600 | ₩2,835 | **−99.5%** | **25.6** |
| Samsung Elec | ₩7,380 | ₩2,810 | −61.9% | **1.8** |
| NASDAQ Composite | 3,940 | 1,321 | −66.5% | 14.0 |

**Same country, same industry, same crash, 14× spread between Samsung and SK hynix** — intra-sector dispersion exceeding sector-versus-index dispersion. Apparent determinant is revenue concentration in the cyclical product (Samsung carried handsets, foundry, displays; SK hynix was near-pure memory), and **no field measures it**.

### Recorded, not promoted to tests

- **Cycle-average denominator.** $1.05T market cap against five-year mean net income of **$12.5bn** (FY2022 $8.69bn · FY2023 **−$5.83bn** · FY2024 $0.78bn · FY2025 $8.54bn · TTM $50.47bn) = **83.8×**, vs trailing 21.0× and forward 6.49×. A minor addition to an argument v2.9.6 already makes by a different route.
- **Peer divergence.** ~~Korean peers topped 2026-05 while MU had not yet rolled over.~~ **WITHDRAWN 2026-08-31 — false, and inverted in direction.** All three topped inside seven days (SK hynix **06-22**, Samsung **06-18**, MU **06-25**) and on 2026-08-28 sat at **−43.4% / −29.1% / −23.1%** — MU's drawdown was the *shallowest*, not absent. MU has no 2026-03 high (Q1 max **$524.60**, 2026-04-27; 08-28 close **$932.90** is **+77.8%** above it). See v2.9.16.
- **FY2023 with the oligopoly fully in place:** revenue −49% YoY to $15.54bn, gross margin **2.67%**, operating margin **−23.00%**, net **−$5.83bn**, FCF **−$6.12bn**. Consolidation changed who goes bankrupt, not how much is lost.

### Not fixed here

A `returnAgnosticRival` or `cyclicalConcentration` field would re-rate members inside the frozen A/B window (`data/ab-track/frozen-2026-08-17.json`, 87 names) — barred until **2027-08-17**. Open item for the quarterly review after that date, **paired with Gap #11's effective-scale classification**, because B is the reason A is not sufficient.

---

## 2026-08-29 — v2.9.14: the universe is built up the supply chain; the frame says capture moves down it

`GOVERNANCE.md` Gap #15 only. **No ticker added, no field created, no scoring change.** `funnelPass` cannot move.

### The gap

§Conceptual Frame — Solvability × Capture (v2.6.0) states the mechanism: DeepMind solved protein folding, **open-sourced AlphaFold for free**, capture moved *downstream* to Isomorphic. **The universe is constructed in the opposite direction.**

| | tickers |
|---|---:|
| upstream 19 layers (silicon → packaging → DC → power → materials) | **55** |
| `L0` platform + `L1` "AI需求/应用层" | **6** |

**`L1` is named for the application layer and contains no application-layer company** — its two members are `GOOG` (hyperscale platform) and `PLTR` (government systems-of-record). Of twelve pure application/SaaS names checked (`CRM · NOW · WDAY · SNOW · ADBE · TEAM · DDOG · MDB · HUBS · ZS · INTU`), **eleven are absent**; `PANW` is present under `L10` for its security identity.

### The cost is measurable

Six months, 2026-02-22 → 2026-08-28, equal-weight: SaaS basket **+50.9%** vs mega-cap AI **+14.4%** — a **36.5pp** spread, entirely outside what this engine can see.

### A public, continuous proxy nothing here reads

Comparing operating to free cash flow isolates who funds the buildout:

| | P/OCF | P/FCF | ratio | FCF margin |
|---|---:|---:|---:|---:|
| GOOGL | 22.83 | 79.57 | **3.5×** | 11.95% |
| MSFT | 20.84 | 56.92 | **2.7×** | 20.19% |
| **CRM** | 13.38 | **13.90** | **1.04×** | **34.49%** |

A name whose P/OCF and P/FCF nearly coincide is not paying the capex bill. **`capex` intensity is a cheap proxy for which side of the supply/capture divide a ticker sits on.**

### What is new, stated narrowly

The concept is **not** new — v2.6.0 argued it from AlphaFold, in the same drug-discovery domain, on 2026-06-26. New are: realised return data on both sides rather than a conceptual argument; the capex proxy; and the finding that **the universe's construction makes the frame's own central claim unobservable from inside the engine** — structurally the same defect as Gap #12.

### Not fixed here

Adding application-layer names is a Tier 3 ADD needing full four-dimension scoring, and **must not happen inside the frozen A/B window** (`frozen-2026-08-17.json` pins 87 names). Open item for a quarterly review after 2027-08-17 — or a deliberate decision that this engine screens the AI *supply chain* and cedes the application layer, which is a legitimate answer but should be **written down as a choice rather than left as an accident of construction**.

### Provenance

Surfaced by testing a widely-circulated X thread (2026-02-22) rather than rebutting it. Six months of record existed: the China-AI proxy basket returned **−19.0%** (the only negative group) and the thread's `short SaaS` leg lost **36.5pp**. Of its four grounds for "AI is a better business than SaaS," *marginal cost near zero* inverts AI and SaaS, and *data flywheel* contradicts the thread's own claim that cheap latecomers displace incumbents. Its one correct observation — capex suppresses FCF — drew the wrong conclusion twice (P/FCF is not comparable across margin structures; "capex will slow" assumes capex is optional rather than an operating cost that converts into depreciation). **The thread was mostly wrong and still located a real gap.**

### Also in this release

Date correction: v2.9.13 and Gap #14 were authored **2026-08-29** and initially stamped 2026-08-25 throughout. Corrected in `GOVERNANCE.md`, `CHANGELOG.md` and the mirrored memory files.

---

## 2026-08-29 — v2.9.13: key-person dependency has no home in the schema

`GOVERNANCE.md` Gap #14 only. **No file added, no ticker edited, no field created, no scoring change.** `funnelPass` cannot move.

### What prompted it

A Tom Lee interview (2026-08-16) arguing that founder vision has become a core pricing factor in the AI era — AI copies technology, not direction — with Robinhood held substantially *because of* Vlad Tenev, "not simply on valuation."

Read under `vc_pitch_source_bias`, Robinhood is the shallow book. **Lee chairs BitMine, the largest ETH treasury company**, whose model requires a share-price premium to NAV — and the support for that premium is the claim that a star principal is itself priceable. The pitch defends his own valuation mechanism, not just a position.

**The claim was rejected and its inverse adopted.** Three reasons, any one sufficient:

1. **Unfalsifiable by construction** — up is vision vindicated, down is the market not yet understanding, and "*truly* top-tier founder" resolves after the fact. His exemplars (Altman, Anthropic's founders, Musk) are all selected after winning; the 2021 roster in identical language held SBF, Do Kwon, Neumann, Holmes.
2. **Universally observable, therefore not alpha** — unless one argues it is *systematically mispriced*, which the pitch never attempts.
3. **"Not simply on valuation"** is not a pricing factor. It is a substitute for pricing.

Inverted, it becomes testable: **not "how much is the vision worth" but "if this person left tomorrow, how many falsifier lines need rewriting immediately."**

### What the scan found

Across all 87 tickers' `thesis` / `thesisFalsification` / `moatFalsification` / `_note`:

| | |
|---|---:|
| explicit person names | **3** (`SPCX` Musk · `OKLO` Altman · `TSLA` Musk) |
| role-word hits (`founder`/`CEO`/`leadership`/`succession`) | 7 |
| ...of which true positives | **0** — "process leadership", "thermal management", "Macquarie Asset Management", and three uses of "management" meaning *the disclosing party* |
| **key-person risk acknowledged as a risk** | **1 of 87** |

The three name entries use the concept three incompatible ways: `OKLO` F4 has the right form (negative, event-driven) but lacks the `MEASURE:`/`CHECK:` discipline of `GLW` F6/F7; `TSLA`'s note already states the principle — *"Musk admiration is not a thesis"* — but was never promoted to a rule; and `SPCX` carries a founder's promotional quote as evidence for the forward value-driver **undiscounted**, while `GLW` F7 explicitly discounts a CEO claim as *"a report-good source on exactly the contested point."* **The v2.6.0 source-bias rule exists; its ticker-level application is inconsistent.**

Load-bearing omissions: **`PLTR`** (mc=5, three falsifiers on budget/competitor/ARR, none on Karp) and **`META`**, where the thesis rests on the Llama open-source strategy — a single-person decision under dual-class control — while F2 tests *ecosystem failure*. **Closing the weights requires no ecosystem failure. The falsifier tests the wrong variable.**

### Gap #14 — proposed, not implemented

One enum, `keyPersonRisk: none | operational | thesis-load-bearing`, assigned by the counterfactual rather than by any judgement of the person. **No gate reads it; zero blast radius**, same shape as Gap #12's `inefficiencyType`. `thesis-load-bearing` anchors to a public binary fact — **dual-class or super-voting control** — so the field has something outside the analyst's opinion holding it in place. Assignment belongs in a quarterly review, one ticker at a time, quoting `thesis` text as evidence.

**Explicitly not doing:** any positive/credit field for founder quality, and any contact with `moatCapture`, `physicalConstraint`, or PASS/FAIL state.

---

## 2026-08-17 — v2.9.12: gate A was never measurable · conditions frozen, clock restarted

Two new files (`data/ab-track/frozen-2026-08-17.json`, `scripts/ab-track.js` — read-only) and `GOVERNANCE.md` Gap #13. **No ticker edited, no scoring field changed, no gate added.** `funnelPass` cannot move.

### What prompted it

A personal crypto book was triaged against this project; the question asked was whether a crypto line should be merged in. **It should not, and need not** — see §4. What did transfer was a method, and applying it here found something larger than the question that produced it.

### 1. The method: a falsifier needs two legs

- **Mechanism leg** — does the asset behave the way the thesis says?
- **Delivery leg** — did it pay what the thesis implies?

Established on BTC against a "digital gold" thesis. The mechanism leg fired hard: over 24 months, rolling-90-day BTC-SPX correlation exceeded BTC-GOLD in **98.4%** of windows. But the delivery leg was far more damaging and far simpler: over 36 months BTC returned **+141.1%** against gold's **+137.6%** — tied — at **2.2× the volatility** (47.2% vs 21.3%) and 2.1× the drawdown. "Digital gold" means *better gold*; the measurement says same return, twice the pain.

A falsifier with only the mechanism leg is weaker evidence than it appears to be.

### 2. Applying the delivery leg to this engine

Scan of all **320** `thesisFalsification` entries across 87 tickers:

| | |
|---|---:|
| carry an explicit threshold | 55.9% |
| carry a deadline | 31.2% |
| **carry both** | **23.4%** |
| **reference price / valuation at all** | **2.5% (8)** — and **7 of those 8 are pricing entry gates, not thesis falsifiers** |

The book asks whether the *company* performs. It almost never asks whether the *position* paid.

*Discarded from that scan:* the mechanism/business-delivery split. The regex missed **60.3%** of entries because business metrics appear as "seat growth" / "ARPU" / "MAU" / "contracts". Only the valuation count is trustworthy — that vocabulary is closed. Recorded because a scan that looks rigorous and is not should be labelled, not quietly dropped.

### 3. Gap #13 — the finding that mattered

The standing belief was "gate A can't be evaluated: no blotter, window not elapsed." **Both halves were wrong.** `data/scores/` has carried daily `funnelPass` + `price` since 2026-05-04 — 76 files, price on 84/84 rows. The outcome data was always there. **The conditions were edited while the experiment ran:**

- **87/87** tickers have `addedDate` *after* the scoring start (79 May · 4 Jun · 4 Jul)
- **39** `_changeLog` entries touch `physicalConstraint`/`moatCapture` inside the window
- demotion removes a name from the pass-set going forward (`TSEM 2026-05-19` triple-fail → watchlist)

Measured anyway, so the contamination has a size (64 adjacent-trading-day segments, equal weight; `node scripts/ab-track.js --diagnostic`):

| basket | cum | ann/vol |
|---|---:|---:|
| pass-set | **+8.55%** | **+1.02** |
| FAIL-set | −12.16% | −0.90 |
| all-universe | −8.72% | −0.71 |
| SMH | −1.16% | −0.08 |

**pass-set − all-universe: +0.263%/day, t = +1.76, n = 64 → NOT SIGNIFICANT.** A "+9.71pp over SMH, risk-adjusted 1.02 vs −0.08" headline was available here and would have been wrong twice: not significant, and computed on conditions edited mid-flight.

**Single-factor attribution localises the problem.** `pricingScore` alone returns **+2.15%**; the full funnel returns **+8.55%**. The residual ≈ +6.4pp comes from the hand-scored gates — the same fields edited 39 times. Also: `forwardPE`, the heaviest component at 30% weight, is the **worst** single factor over the span at **−4.93%**.

**Partially surviving:** the pass/FAIL spread of **20.7pp** shares one universe on both sides, so universe-selection bias largely cancels. Weak evidence the funnel discriminates; **not** evidence gate A passed.

**Fixed by freezing, not waiting.** Running the old window to 2027-05 would deliver the same three defects at expiry. Roster and scores pinned in `frozen-2026-08-17.json`; basket rules pre-registered (equal weight · adjacent trading days only · **demotion does not remove a name** · start strictly after the freeze date · paired t reported with every return). Window **2026-08-17 → 2027-08-17**, mid-check 2027-02-17, non-executing.

**Stated cost: the first 3.4 months of A-track record are void and the clock restarts.** Worse-sounding, better than a contaminated number in 2027-05. Delete clause: if the rules are violated again, record that *the test failed to run* — do not freeze a third time.

### 4. What was rejected, and why it is worth recording

| Proposal | Verdict |
|---|---|
| Merge the personal crypto holdings into `universe.json` | **Rejected.** ProphetMap is an idea screen, a holdings book is a portfolio review. Overlap between the two is exactly one name (ETH). BTC/XAUT/XMR and a Dubai property RWA have no AI-supply-chain thesis; `aiContribution` would fail them all, and the repair would be to loosen a gate. Holdings table lives outside this repo at `~/crypto-portfolio/` |
| Build an open-source "crypto investment framework" repo | **Rejected on evidence.** `gh search repos "investment thesis tracker"` returns seven independent attempts built in the last nine months, **all at 0–1 stars**; several are Claude skills rather than software. The data layer is already free and occupied (DefiLlama + CoinGecko), and the P/F denominator critique is public commentary, not an edge |
| Add crypto valuation tooling here | **Unnecessary — it already exists.** `RNDR/TAO/FIL/LINK/ETH` since 2026-05-06, `update-crypto-valuations.js` computing `pRev` (= P/F) and `pTvl` off the same two APIs. Independent hand-calculation of ETH's P/F gave **2,544×** against the script's **2,418×** — two implementations converging is the useful part |

> **Provenance (v2.9.12, 2026-08-17):** method from a personal-portfolio triage, not from a source read. Per `inspired_loop` and `techpull_gate`: documentation plus a read-only measurement script; **no portfolio motion, no PASS/FAIL state moved.** The one live consequence is that this engine's own performance claim is now under conditions that cannot be edited after the fact — which is the point of the exercise and also its main cost.

---

## 2026-08-12 — v2.9.11: two recorded gaps from an external triage · documentation only

No code, no data, no field. `GOVERNANCE.md` Known Governance Gaps gains #11 and #12. **Blast radius: zero** — the diff touches one file and adds no gate, no enum value, and no ticker edit. `funnelPass` cannot move.

### What prompted it

A 30-source knowledge export (桌面 `投研金融/`, NotebookLM `Fin` + `ECON` notebooks, 6.8 MB) was triaged **against this project specifically** — the question asked was not "is this good material" but "does it interface with ProphetMap." Result: **24 sources non-empty, 21 discarded.**

### 1. Gap #11 — `moatLocks` has no value for *effective scale*

Measured distribution: `integration 61 · userHabit 18 · licensing 14 · privateData 4 · liability 3`. Against the five-moat taxonomy, intangibles / switching costs / cost advantage are all housed. **Network effect** is Gap #7 already. **Effective scale** — economics support only a few profitable participants, so a rational entrant declines even with entry unbarred — has nowhere to sit.

**This is a different mechanism from the queue-vs-chokepoint test (§3).** That test asks whether *permission* is rationed. Effective scale asks whether *economics* are. A licence queue can be wide open while the third entrant still loses money.

Not fixed: assigning a sixth lock across 87 tickers requires re-reading each `moatFalsification` string, and any reassignment that moved `moatCapture` would be the silent re-rate the v2.8.0 peer rule prohibits. Deferred to quarterly review, one ticker at a time, evidence quoted.

### 2. Gap #12 — A-track gate B records *whether* non-consensus, not *which kind*

Gate B wants ≥3 timestamped cases of "pS ≤ 3.0 at signal, non-consensus, eventually right." **"Non-consensus" is a boolean.** Mauboussin's BAIT taxonomy (behavioral / analytical / informational / technical) splits it four ways.

The consequence is sharper than a taxonomy usually is: **ProphetMap has no informational channel** (every input is public) **and reads no sentiment**, so structurally it can only produce *analytical* and *technical* edge — and within analytical, mostly the different-time-scale branch, which is what `timeToRealize` already is.

> **If the reconstructed A-track cases classify mainly as behavioral, the alpha is not coming from the machine, and gate B passing would be a false positive.**

That is a falsifier gate B cannot currently generate about itself. Proposed: one `inefficiencyType` enum on the A-track blotter, filled at signal time, read by no gate, reviewed at the 12-month A/B mid-check.

### 3. What was rejected, and why it is worth recording

Three ready-made Claude-skill drafts came with the export. All three were declined for this project:

| Draft | Verdict |
|---|---|
| China Macro-Strategic Analyst | No interface. This is a US-equity chain; no field reads a macro variable, and no PRC ticker exists in the universe |
| Crypto / Meme survival | The crypto members are LINK and ETH on long-horizon infrastructure theses. Different asset class, different horizon |
| US value & growth | **Buffett's screens are calibrated on consumer-staples issuers.** `cumulative capex / cumulative net income < 50%` excludes TSM, ASML and AMAT — the defining members of the physical-plus-capture quadrant. Its Driehaus relative-strength rule (top 10–20% RS) is the momentum filter the v2.8.0 frame refuses by name: *"a revision filter is momentum wearing fundamental clothing."* Only its moat taxonomy and BAIT survived, as #11 and #12 |

The general form, worth keeping: **an imported screen is a construct claim.** Before adopting it, ask whether it was calibrated on a population resembling this universe. Two of the three rejections above are that question answered no.

### Provenance

Mauboussin, *Who Is On the Other Side?* (Counterpoint Global / Morgan Stanley IM). Full text held locally in `~/research-refs/`, **deliberately not committed** — this repo is public and the paper is third-party copyright. Per `inspired_loop` and `techpull_gate`: documentation change, **not a portfolio motion**.

---

## 2026-07-30 — v2.9.10: PEG staleness detector · the fix does not fix what it was supposed to

Engine change, following the v2.9.9 finding that `pegRatio` — the holder's **declared primary pricing indicator** — was frozen on 45% of the names that moved more than 5% in a week.

### 0. Blast radius: zero on the engine, total on the human rule

**`pegRatio` feeds no funnel condition and no `pricingScore` component** — verified by grep across `scripts/` and `lib/`. It is a pure output field consumed by the UI and by the holder's decision bands. **`funnelPass` cannot move on this change.**

**Verification method — stronger than an output diff:** the entire diff to `update-valuations.js` **deletes exactly one line, and it is a `console.log`.** Everything else is pure addition. This is not "I compared the outputs and they matched"; it is "the code producing every pre-existing field is byte-identical." No full-table delta is required because no existing field is computed differently.

### 1. What was NOT done, and why

**Yahoo's `pegRatio` was not replaced.** The v2.9.9 recommendation was to self-compute it. On implementation that turned out to be the wrong instruction:

- **`+5y` long-term growth — the textbook PEG denominator — returns NULL on every ticker tested.** DeepSeek's council proposal (`forward_PE / long_term_growth_estimate`) is **not implementable; the field does not exist.** Fifth instance of the *unmeasurable* defect class this session, this one inside a council recommendation.
- **Yahoo's `pegRatio` cannot be reproduced from any obtainable field**, so its growth denominator is unknown. A self-computed value diverges from it by **−97% to +1505%** across MU / AMKR / NVDA / QCOM / GOOG / KTOS. **It is a different metric, not a repaired one.**
- The holder's bands (1.0 / 1.5 / 2.5) are calibrated to Yahoo's scale. **Swapping the number underneath them would re-rate the whole book silently** — precisely what the v2.8.0 peer rule prohibits. Re-banding needs a historical distribution study and is a framework decision, not an engineering one.

So `pegSelf` ships as a **diagnostic with no band**, alongside the original.

### 2. What shipped

| Field | Purpose |
|---|---|
| `pegStale` / `pegStaleDetail` | fires when `pegRatio` is byte-identical through a >5% price move against the prior session |
| `pegSelf` / `pegSelfBasis` | PEG from the live price; basis recorded per-ticker (`+5y` or `+1y`) so the two are never confused |
| `pegSelfUnavailableReason` | why it is null — contraction, growth floor, or missing forward EPS |

`PEG_MIN_GROWTH = 0.03` — below this the denominator approaches zero and the ratio carries no information.

**`detectPegStale` unit-tested 7/7** against real historical values pulled from stored scores files, including **direction symmetry** (fires on up-moves as well as down). That closes the v2.9.9 caveat that the asymmetry was untestable — it was untestable *in the data*, not in the code.

### 3. The honest scorecard — two of four fixed, and not the two intended

| # | Failure mode | Yahoo | `pegSelf` | Fixed? |
|---|---|---|---|---|
| 1 | MU peak-cycle EPS | 0.13 cheap | **0.04 cheap** | ❌ **worse** |
| 2 | KTOS denominator | 36.41 overpriced | **0.99 cheap** | ❌ **inverted, worse** |
| 3 | QCOM shrinking revenue | 0.51 cheap | **null** (growth 1.7% < floor) | ✅ |
| 4 | staleness | frozen | live | ✅ |

**The most useful finding is about the council itself.** Both models proposed `PEG_MIN_GROWTH` independently, and **both proposed it to catch KTOS. On measurement it catches QCOM and not KTOS** — KTOS's `+1y` growth is 40.5%, nowhere near the floor. Its distortion lives in trailing EPS of 0.15 against forward 1.09, a 7× jump off a near-zero base, **which neither ratio expresses.** The guard is kept because it is doing real work; it is not doing the work it was designed for, and that is recorded rather than tidied away.

**Also recorded:** GOOG, a core holding, returns `null` (expected contraction, `+1y` growth −28.5%). Correct for a ratio undefined on negative growth — but it means the diagnostic is **silent on some of the largest positions.**

### 4. Council — archived, and both members were wrong on Q3

Raw transcripts in `data/council/2026-07-30/`. **2 of 3 models: MiMo timed out on three separate attempts** (documented syntax, `mimo run`, and a short connectivity probe), so it is a connectivity failure, not a prompt failure. Separately, `~/.claude/commands/council.md` carries a **stale invocation** for MiMo.

| | Grok | DeepSeek |
|---|---|---|
| Q1 PEG as primary | **demote** — the failures are definitional, not implementation | **keep + 4 vetoes** — "the problem is data-source corruption, not PEG's logic" |
| Q2 arbitration | identical in spirit — **pricingScore holds the buy gate, PEG can only brake** | same; MU → no buy, CRH → standard not aggressive |
| Q3 margin capture | add as **gate** | add as **incremental trend** |

**Q3: both said add it. Measurement says no.** Four candidate formulations were tested against six tickers and **all four failed, each differently:**

- **DeepSeek's incremental conversion (ΔGP/Δrev, >0.5 = good)** scores **MU +1 in all four quarters** (76.8% → 111.3% → 98.9% → 98.3%) — a ~99% conversion is COGS not moving at all, the exact signature of pure ASP, read as maximum capture quality. It also breaks entirely when revenue declines (3 of 16 quarter-pairs return meaningless numbers).
- **COGS-growth / revenue-growth** calls **AVGO (69.5% GM) "pure pass-through"** at 0.85.
- **Price/volume decomposition** calls **TSM "83% price-driven"** — TSM's COGS is mostly depreciation, fixed, so it does not move with volume.

**Conclusion: gross margin conflates pricing power, cost structure and mix, and the income statement alone cannot separate them.** The GEV #4 and AMKR #4 falsifiers stand precisely *because they attempt no decomposition* — they ask one compound question over four quarters. **Kept as per-ticker falsifiers; NOT promoted to a fifth dimension.**

---

## 2026-07-30 — v2.9.9: AMKR is a worse GEV · and the primary decision indicator was frozen through a 34.6% drawdown

### 1. AMKR — the capture test's second application, and it fails harder

Surfaced by ranking the 26 funnel-passing names on PEG: AMKR came second-cheapest at **0.76** while carrying **`moatCapture: 2`, the lowest capture rating of any name that clears the gate.** Falsifier #4 added to the same specification as GEV #4. **Not a holding** — it sits on the T2 candidate list.

**Gross margin, full year:** FY2022 **18.8%** · FY2023 14.5% · FY2024 14.8% · FY2025 **14.0%**. Four-year peak **18.8%**, so the falsifier's 20% threshold is set **above anything AMKR has achieved in four years.**

**Worse than GEV on three counts:**

| | AMKR | GEV |
|---|---|---|
| Gross margin | **14.0%** (ttm 15.5%) | 20.6% |
| Revenue growth | FY2025 **$6.71B < FY2022 $7.09B** — four years, no net growth | genuine +21.9% |
| Latest quarter | rev $1.99B → $1.89B → **$1.68B** *and* GM 16.7% → **14.2%** — **both lines rolling over together** | n/a |

The +25.6% the screen reports is a TTM comparison against a depressed early-2025 base, not a trend.

**The deciding structural observation:** NVIDIA's **$1.5B prepayment** for Arizona packaging capacity (2026-07-23) argues **FOR** `moatCapture: 2`, not against it. **A supplier that needs its customer to fund its capex has no pricing power** — on a 14% gross margin AMKR cannot self-fund the expansion, so NVIDIA does, and **the party that funds the asset captures the rent.** Same shape as the GOVERNANCE §3/§3a queue test, and the sharpest instance yet: here the gatekeeper is not merely widening access, **it is paying for it.**

**NO RATING MOVED** — the data *corroborates* `moatCapture: 2`, which is precisely why nothing changes. Counter-argument preserved: the four-quarter trend test has not run, Arizona capacity is not in the revenue line, and one sequential decline is not a trend.

### 2. The framework defect — `pegRatio` is stale, and PEG is the declared primary indicator

**AMKR's PEG did not move by one basis point across a 34.6% five-session drawdown:**

| | price | forward P/E | **PEG** |
|---|---|---|---|
| 07-27 | $60.30 | 23.0 | **0.76** |
| 07-28 | $45.98 | 17.6 | **0.76** |
| 07-29 | $44.27 | **15.5** | **0.76** |

Forward P/E fell **33%**. **Arithmetically impossible for a live ratio.**

**Root cause:** `scripts/update-valuations.js:657` reads `summary.defaultKeyStatistics.pegRatio` — a Yahoo **precomputed** field on Yahoo's own refresh cadence, **not derived from the live price the engine already holds.**

**Systemic scope, 2026-07-22 → 07-29: of 49 tickers that moved >5%, 22 (45%) carried a completely unchanged `pegRatio`** — TTMI −32.9%, COHR −30.3%, LITE −29.2%, AMD −23.3%, INTC −22.0%.

**NOT claimed: any directional bias. Zero tickers rose more than 5% in this window — the up-move sample is empty and the asymmetry cannot be tested.**

**This is the fourth PEG failure mode found in one session, all inside a single 26-name list:**

| # | Case | Defect |
|---|---|---|
| 1 | MU 0.13 | denominator is peak-cycle EPS |
| 2 | KTOS 36.41 | denominator → 0; carries no information yet is banded "overpriced" |
| 3 | QCOM 0.54 | EPS growth on revenue **shrinking 3.5% YoY** |
| 4 | **45% of movers** | **the field is stale** |

**Raised as a framework item and deliberately NOT resolved here.** PEG is the holder's declared primary decision indicator; changing it is a framework decision, not a ticker decision.

**Process note.** Verified against `HEAD`: **0 substantive changes across all 87 tickers and all existing falsifier strings — appends only.** `data/scores/*` untouched.

---

## 2026-07-30 — v2.9.8: GEV's falsifiers all tested demand and none tested capture · a purchase bet pre-registered, then reversed by its own audit an hour later

Two items commissioned after a portfolio review found the same shape twice — **a position whose thesis is not in the book** — plus a third that the second item generated on its own: **the open question it raised was answerable immediately, and answering it contradicted the entry that raised it.**

### 0. Correction — the measurement I proposed for GEV could not be taken

The prior session proposed measuring "data-centre customer share of gas-turbine orders." **No source available discloses it at ticker level.** It surfaces, when it surfaces, as an unquantified remark on an earnings call. The measurement was **substituted, not taken**, and the substitution is recorded in the entry rather than quietly performed — because a falsifier written against a non-existent data source is the *unmeasurable* defect class already on file from QCOM #2, and proposing one is the same error as writing one.

### 1. GEV — the review answered a question nobody asked

GEV is the **best-performing position in the holder's book** over six months (+19.8pp vs SPY) and **has never passed the funnel**. Two hypotheses were put up: either `aiContribution 0.20` is too low, or the gain comes from an unwritten non-AI thesis.

**The margin data supports neither. It points at `moatCapture: 4` being too HIGH.**

| | GEV |
|---|---|
| Gross margin | **20.6%** |
| Operating margin | 7.5% |
| Revenue growth | +21.9% YoY |

| Sample | GM range | median |
|---|---|---|
| Power / cooling / industrial (GEV CEG VST CAT CMI PWR PH VRT ETN MOD) | 15.1–38.6% | **27.2%** |
| Names clearing the defensibility gate (NVDA AVGO TSM LIN ANET GLW AMAT CDNS) | 36.4–85.9% | **63.9%** |

Median gap **36.6pp**. Every sampled name above 45% GM clears the gate; nothing in the power complex exceeds 38.6%. **GEV is second-lowest of all 18.** Revenue growing 21.9% on a 20.6% gross margin is demand arriving in the revenue line and not the margin line — pass-through, which is the opposite of capture. One `moatLock` on a 20.6%-GM equipment manufacturer is a weak basis for a 4.

**NO RATING MOVED, and the reason is the counter-argument, not caution.** GEV's margin today is earned on contracts signed before the AI power bid existed. The thesis' own mechanism — 3–5 year lead times — guarantees that pricing power on new orders reaches the income statement with a multi-year lag. **A level test cannot separate "no pricing power" from "not yet converted."** So falsifier #4 is written as a four-quarter *trend* test: fires if GM stays ≤25% through FY2027 on >15% revenue growth. Earliest possible adjudication FQ2 2027.

**The structural hole #4 closes:** three falsifiers, all testing demand (backlog growth, interconnection queue, HVDC substitution), **zero testing whether the bottleneck earns rent** — on a ticker whose entire case is that a bottleneck earns rent.

**Recorded and unresolved:** the holder's realised gain still has no thesis in the book. `aiContribution 0.20` attributes four-fifths of GEV's forward growth to something never written down — therefore with no falsifier and no exit condition. A documentation gap, not a rating gap, and this entry does not close it.

**Secondary, engine unaffected:** GEV's trailing earnings are non-operating-dominated — net margin 23.0% against operating margin 7.5%, forward EPS 24.89 *below* trailing 33.31, two of the last four quarterly prints carrying +316% and +772% surprises that a 20.6% gross margin cannot produce. **One-time items or bad data — not resolved, and nothing here rests on them.** The engine reads forward P/E, and `cyclicalTrap` fires on a *high* trailing/forward ratio while GEV's is 0.75 — wrong direction, cannot misfire.

### 2. MU — a bet written down before the evidence that settles it exists

MU sits in the holder's 2026-07-30 buy basket. The engine says FAIL. **This entry adjudicates nothing; it pre-registers.**

**The purchase bets on exactly one proposition: that `cyclicalPeakGM = 0.55` is stale.** Nothing else in the funnel objects — PC 4, moat 3, aiC 0.55, ttr near all clear. It fails on pricing *alone*, and on pricing only because `cyclicalTrap` adds **+1.5 to a raw 2.1**. Raw 2.1 would rank MU the **fourth-cheapest name in the entire 26-name pass list.** The bet is not that demand is strong; the engine already agrees it is.

**Settle conditions, both directions, committed now:**

| | Condition |
|---|---|
| Bet **wrong** | Falsifier #6 fires — two sequential GM declines while HBM bits still grow |
| Bet **right** | GM holds >65% for four consecutive quarters → the 0.55 parameter is re-set, the trap stops firing, MU reverts toward 2.1 |
| **Neither** | GM drifts 55–65% → parameter neither stale nor validated; re-derive from source rather than defend |

**Asymmetry recorded:** every argument *for* the bet is a demand datum (estimates +52.9% in 90 days, 4-of-4 beats averaging +20.2%, Alphabet's supply-constrained capex raise, Bernstein's 55%-of-incremental-wafer-demand). **The engine's objection is not about demand. None of that evidence touches the claim being bet on.**

### 3. MU, same day, one hour later — the constant was re-derived and it reverses §2

§2 closes by flagging `cyclicalPeakGM = 0.55` as unaudited and asking for it to be re-derived before FQ4. **It was re-derived within the hour. The result does not favour the bet §2 pre-registers.** A third observation entry is appended; §2 is left unedited so the sequence of belief stays legible.

**The deciding row is COGS.**

| Quarter | Revenue | COGS | GM |
|---|---|---|---|
| 2025-05 | $9.30B | $5.79B | 37.7% |
| 2025-08 | $11.31B | $6.26B | 44.7% |
| 2025-11 | $13.64B | $6.00B | 56.0% |
| 2026-02 | $23.86B | $6.11B | 74.4% |
| 2026-05 | **$41.46B** | **$6.40B** | **84.6%** |

**Revenue rose 4.5× over five quarters. COGS rose 11%.** No volume story, no mix story, no cost story — **the entire expansion from 37.7% to 84.6% is ASP.** This is not the cyclicalTrap heuristic being applied; it is the trap's mechanism visible in primary line items. **And the leverage is symmetric:** with COGS flat, every dollar of ASP decline is a dollar of gross profit decline, with no cost base to cushion it. The four quarters reconstruct to $90.3B at 72.6% — an exact match to the figure the engine consumes, so **the engine's input is independently confirmed.**

**The constant is not stale-low. It is generous.** Full-year GM: FY2022 **45.2%**, FY2023 −9.1%, FY2024 22.4%, FY2025 39.8%. **The four-year peak is 45.2% — the constant sits 9.8pp ABOVE it.** *Limitation carried forward: only four fiscal years were obtainable; MU's all-time peak is not in evidence and a longer series could move this.*

**The reductio:** latest-quarter GM **84.6% now exceeds NVIDIA's 74.1%.** A DRAM/NAND manufacturer out-earning, at the gross line, the company with 80–90% accelerator share behind CUDA. Possible in a historic shortage — but definitionally a *peak*, not a regime, unless commodity memory has become more defensible than CUDA. Nobody is arguing that, including the bulls.

**"Forward P/E 5.0 is cheap" rests on a denominator implying $174B of net income.** Forward EPS 153.74 × 1.129B shares. TTM net income is **$50.5B** → consensus needs a further **+244%**. Annualising the best quarter ever printed ($28.24B → $113B) still leaves **+54%** to find. **The 5.0 is arithmetically correct and economically empty — which is what a cyclical value trap is.**

**Counter-evidence, and it is not weak:** 4.5× revenue on flat COGS is *also* what a genuine structural shortage looks like early. If HBM capacity cannot be added faster than demand grows — which this ticker's own thesis asserts — the condition can persist for quarters, and the position can make a lot of money before it turns. **The question is duration, not direction, and nothing measured here dates it.** Alphabet's 2026-07-22 "still supply-constrained … multiple quarters in a row" is first-party and current.

**Constant HELD at 0.55** — corroborated, not changed. No rating moved. Open item from §2 **closed**; successor limitation is the four-year window. **Next check amended:** measure FQ4 sequential margin against **84.6%**, not the already-stale 72.6% TTM. **The COGS line is now the cheapest tell** — revenue decelerating while COGS keeps climbing marks the turn regardless of what margin prints.

**Process note.** No rating moved, no threshold edited, no existing falsifier altered — verified by string comparison against `HEAD` across all 87 tickers and all 318 existing falsifier strings: **0 substantive changes, appends only.** `data/scores/*` untouched, so the 07-30 CI run is unaffected by this release.

---

## 2026-07-29 — v2.9.7: five watchlist triggers measured · MU adjudicated against UBS · a falsifier that cannot be measured · storage layer rejected

Five items commissioned together. **Two of the five began as claims of mine that the measurement contradicted.**

### 0. Correction — the miner-convert cohort's watchlist rationale was never missing

The previous session reported that all five `L9_MINER_CONVERT` tickers sat on watchlist "with no recorded reason." **The `watchlistReason` field was empty; the rationale was not.** Every one carries it in `_note` from the 2026-05-26 addition, together with **conjunctive, quantified entry triggers** — more disciplined than most entries in the book. Reading one field and declaring the record absent is the same error class as the CRCL `risk` field: checking one pipeline and concluding the signal does not exist.

### 1. The five triggers measured — none fires, and the reason matters more than the result

| | pS 07-29 | ≤3.0 for 5 days? | PEG leg | Trigger |
|---|---|---|---|---|
| APLD | 2.8 | ✗ (1 of 5 — was 3.6 on 07-24) | 1.83 ✓ | no |
| CIFR | 2.5 | ✗ (2 of 5 — was 4.2 on 07-24) | **null** — cannot evaluate | no |
| IREN | 2.7 | ✗ (2 of 5) | 3.11 ✗ | no |
| WULF | 3.0 | ✗ (1 of 5, and only at the boundary) | **null** | no |
| HUT | 3.8 | ✗ outright | **null** | no |

**The whole cohort crossed below 3.0 in the last one to two sessions, and the cause was not price.** The layer benchmark was *declared* on 2026-07-28 (v2.8.2) — the layer previously had no entry and used the cross-industry default of forward P/E 22 / EV-Rev 5, replaced by miner peers at 77.2 / 20.6. The benchmark entry already labels this **"A METHODOLOGY EVENT, NOT A BUY SIGNAL."**

**The 5-day persistence leg, written on 2026-05-26, is at this moment doing precisely the job it was written for**: it prevents a change of yardstick from reading as a change in value. Recorded because this is the clearest demonstration in the repo of a pre-committed rule paying for itself.

IREN is the near miss worth naming: its operational leg ("AI revenue >50% of forward 12m guidance") is plausibly met by the 2026-07-20 announcement — AI-cloud run-rate target raised above $4B with ~85% contracted, 480MW in 2026 against ~3MW in 2025. The conditions are conjunctive and both financial legs fail. Also recorded: IREN's 2.7 is driven by **momentum** (6m −49.5%, component score 1.2), not cheapness — its forward P/E is **negative** and correctly scores 5.

### 2. MU — UBS "47% cash return is underpriced" vs the engine's `cyclicalTrap`. **Engine upheld.**

UBS's arithmetic was checked and holds: >$400B cumulative FCF to 2028 against an $868B market cap is 46.1%, matching the cited 47%. **The dispute is not arithmetic, it is the durability of the denominator.**

**Deciding evidence: gross margin 72.6% trailing, against this ticker's own `cyclicalPeakGM` of 0.55** — 17.6pp above a peak the framework set *in advance*. Forward EPS 153.74 against trailing 44.23 is 3.48×. The UBS note argues density leadership, 2XX NAND and LP-DDR position; all may be true and none explains a margin 17.6pp above cycle peak, which is a price phenomenon. **The note does not mention gross margin.**

**The note also contradicts itself**: MU appears as undervalued *and* in the extreme long-crowded cohort (12 of 63 names). A name cannot be both under-owned and extremely crowded. The crowding datum is the more falsifiable of the two and points the other way.

**New falsifier #6 opened — the audit found a real hole.** Five falsifiers on a ticker carrying `cyclical: true` and **not one tests for a cycle turn**; #2 fires at blended margin below 30%, which is a crash, not a turn. #6 measures two consecutive sequential gross-margin declines *while HBM bit shipments still grow* — margin rolling over ahead of volume. **What would reverse this verdict:** gross margin holding above 65% for four quarters would argue the 55% parameter is stale.

### 3. QCOM — the finding is not the crowding

**Falsifier #2 carried a "by 2026" deadline. It has arrived. It CANNOT BE EVALUATED.** "Share of enterprise apps deploying edge inference" is published by no one. A falsifier whose measurement does not exist cannot fire, cannot be refuted, and **silently converts a position into an article of faith while looking disciplined.**

This is a **second class of threshold defect**, distinct from the one already on file: INTC #2 and CRCL #2 were *gameable* — measurable, but reachable by means that do not validate the thesis. QCOM #2 is *unmeasurable* — no source exists at any price. The second is worse; a gameable threshold at least yields a number to argue about. #2 stands as written; successor #4 measures off the company's own segment disclosure.

Also recorded: QCOM is the cheapest active holding after NVDA (pS 1.8, fwd P/E 14.5, PEG 0.54) **and its revenue is shrinking 3.5% YoY**. Those are consistent — 14.5× on declining revenue is a price for decline. And it exposes the sharpest instance of the v2.8.0 denominator problem: `aiContribution` 0.45 is a share of forward revenue *growth*, and forward growth may be near zero. Flagged, not repriced. On the crowding itself: UBS's factor is proprietary; observable short interest is **3.84% of float against MU's 3.21%** — on the public measure the two are close, so the nine-year claim is recorded as reported, not as fact.

### 4. Storage layer — REJECTED, conditionally

Passes three of four new-layer criteria including the physical-constraint test, which is genuinely strong (millisecond GPU ramp; gas turbines limited to ~two starts/day with reported shaft failures inside seven months; 4–8 year grid expansion against 12–18 month storage deployment). **Fails on ticker supply: FLNC is the only real US-listed pure play.** One name is not a layer.

Two objections recorded that would survive even a larger ticker count: (a) capture is unresolved between cell and integrator — CATL holds ~30% of global storage cells and sits outside the edge circle; (b) **FLNC's stated moat is exclusive battery-partner status for NVIDIA's DSX reference architecture — a gatekeeper permission, and NVIDIA has every incentive to multi-source it.** That is the **third independent instance** of the v2.9.5 queue test, and the first on a candidate this file itself proposed.

### 5. ALAB — not a misassignment. Gap #10 instead.

The previous session flagged ALAB's `L3` placement as a probable error. **It is not.** The `thesis` says "adjacent to but distinct from L3 EDA layer" and `_changeLog` records the choice as deliberate. The real defect is structural and is recorded as governance gap #10: **`layerRole: secondary` distinguishes the thesis but not the benchmark**, so ALAB is priced against SNPS/CDNS EDA multiples while its closest comparable, CRDO, is priced against L2_5. **Deliberately not fixed** — moving it would re-rate it through a different benchmark, the exact silent re-rating the v2.8.0 peer rule prohibits, and ALAB's own pre-declared re-evaluation triggers are nowhere near met (it printed 4.0 on 07-29).

**Process note.** No rating moved anywhere in this release. `data/scores/*` untouched. MU `PC 4 / moat 3 / aiC 0.55` and QCOM `PC 3 / moat 4 / aiC 0.45` all held — neither was audited against evidence on those dimensions and neither should move on a positioning datum or a sell-side note.

---

## 2026-07-29 — v2.9.6: GLW competitive-read observation — the first datapoint against a rating strengthened one day earlier

GLW's `moatCapture = 4` was STRENGTHENED on 2026-07-28 off the Q2 print. This entry files the first datapoint pointing the other way, **while it is fresh rather than at the next print** — which is the whole point of the `falsificationObservations` mechanism and the reason the review cadence should not be a function of what publishes.

### 1. What was measured

Innolight (中际旭创, 300308.SZ) is marketing a HK listing at roughly **$7.0B base / $8.0B with greenshoe** — the largest Hong Kong equity offering in seven years. Cornerstones reported as BlackRock, Hillhouse, Temasek, JPMorgan AM, Wellington, 思柏 and 云锋, expected to take close to half the deal. Innolight overtook CATL in May–June 2026 as the largest weight in the CSI 300.

**Falsifier #2 — "Fiber supply glut from Chinese manufacturers compresses GLW pricing by >20%" — NOT TRIGGERED.** No pricing compression is observed or reported. A financing is an input to future supply pressure, not the pressure.

### 2. Two corrections, both to the proposal that generated this entry

**(a) Wrong falsifier.** The session proposal framed this as a test of capture-leak / architecture-neutrality (#6, #7). A competitor raising equity tests neither architecture nor who earns the returns on GLW's own capex. The correct target is **#2**. Filing a real datapoint against a falsifier it cannot move is worse than not filing it.

**(b) Wrong tier — this is the load-bearing qualifier.** Innolight is an **optical module / transceiver** maker. GLW is a **fiber, glass and connector** maker. Falsifier #2 as written says *fiber* glut; Innolight is not a fiber supplier. An $8B recapitalisation of the Chinese transceiver leader is a materially stronger competitive read on **COHR and LITE** — both L8_OPT holdings, both transceiver-tier — than on GLW. The event is filed as *adjacent to* #2 rather than stretched to fit inside it.

### 3. Counter-evidence from the same week

Alphabet reported Q2 2026 on **2026-07-22**: revenue $119.80B (+24%, vs $117.02B consensus), **Google Cloud +82%** to $24.8B, backlog +$50B sequentially to **$514B**, Q2 capex $44.9B (+107% YoY). **Full-year 2026 capex guidance RAISED to $195–205B from $180–190B** — the second consecutive raise. CFO Ashkenazi: *"We're still in a supply-constrained environment … now for multiple quarters in a row."*

The TPU cluster architecture driving the Chinese order book (9,216 liquid-cooled chips per cluster, all-optical OCS interconnect) carries **higher** optical content per unit than a conventional electrical spine. **The market punished the spender** — GOOGL to $329.43 after hours on the capex raise.

### 4. Nothing re-rated

`moatCapture` 4, `physicalConstraint` 4, `constraintType` tech — all HELD. Consistent with the INTC hold ("one observation does not move a rating") and the CRCL rule that ratings move on measurement of the ticker. What the entry establishes is a **dated baseline**: falsifier #2 is now measurable against a specific competitor capitalisation event rather than against a vague sense of "Chinese competition".

**COHR and LITE explicitly NOT audited.** Reading a competitive event straight into ratings for two other tickers is the error this file exists to prevent. **Open item.** Layer state at 07-29 for reference: GLW pS 2.6 / PASS, **COHR pS 2.3 / PASS / PEG 0.92**, LITE pS 3.4 / FAIL — the framework's cheapest name in the layer is also the one most exposed to the read recorded here. Tension noted, not resolved.

---

## 2026-07-29 — v2.9.5: the queue test generalised to `moatLocks: "licensing"` — and a field that means two opposite things

v2.9.4 wrote the queue-vs-chokepoint test against `constraintType`, which covers 5 tickers. The test's real range is `moatLocks: "licensing"`, which covers **14**. Sweeping it surfaced a defect in the field before the test could be applied.

### 1. `licensing` conflates licensor and licensee

Read from the tickers' own `moatFalsification` text, not inferred:

- **QCOM** — *"Modem SEP royalties erode … AND AI-edge fails to replace **the licensing stream**"* → **licensor**. It collects.
- **ARM** — *"RISC-V open ISA displaces Arm — **licensing moat was switching-cost, not necessity**"* → **licensor**.
- **OKLO** — *"NRC licensing fails/delays … **licensing IS the moat and the bottleneck**"* → **licensee**. It holds a permit.
- **SMR** — *"First and only NRC-certified small modular reactor design"* → **licensee**.

Being the gatekeeper and being admitted by one are opposite positions. **The queue test applies to the licensee sense only — 12 of 14.** For a licensor a widening gate is irrelevant or favourable, and the correct falsifier is substitution, which QCOM and ARM already carry.

### 2. Two independent instances now support the test

| Gatekeeper | Widening | Rate |
|---|---|---|
| OCC — stablecoin issuer trust charters | 5 conditional (Dec 2025) → +Bridge (Feb 2026) → 7 pending | 11 firms / ~83 days |
| Anthropic — Project Glasswing frontier-model access | 45 orgs (2026-04-07) → 195 (2026-06-02), 15+ countries | 150 / ~8 weeks |

Glasswing is the cleaner demonstration because the gatekeeper is **paying to widen** — up to $100M in usage credits. **When admission is subsidised, admission is not scarce**, and the direction of the subsidy is the direction of the scarcity. Recorded because "company X has privileged access to Y" is a recurring screen shape that this test kills cheaply.

### 3. Scan result — two single-lock exposures, neither re-rated

Ten of the twelve licensee-sense tickers carry a second lock, so the test cannot collapse them alone. **Two carry `moatLocks: ["licensing"]` and nothing else, both at `moatCapture: 4`:**

- **OKLO** — sole lock, and its own falsifier concedes *"licensing IS the moat and the bottleneck"*. **10 CFR Part 53 took effect 2026-04-29** (risk-informed, technology-inclusive path under NEIMA, written to shorten non-light-water reviews). Aurora is still in **Combined License Application review** — the sole lock is **prospective, not held**.
- **SMR (NuScale)** — sole lock, but genuinely **held**: the only developer with full NRC certification, two approved designs. The lead is compressing on measurement — the uprated 77 MWe review took **22 months against 41** for the original. Its existing falsifier tests conversion-to-orders, **not** gate widening, so the widening is **unencoded**.

**Neither re-rated.** Both `status: watchlist`; the gate measurement is secondary coverage, not NRC dockets read directly; and the CRCL precedent of the same day holds — a rating moves on measurement of the ticker, not on a rule newly written. **First check 2026-12-31.**

### 4. Evaluated and rejected as a screen: "has Glasswing access"

~195 organisations across 15+ countries, including AWS, Apple, Google, Microsoft, NVIDIA, Broadcom, Cisco, JPMorganChase, NYSE, ICE. Empirical test inside this repo: **CRWD and PANW are both members** and the framework rates them differently (moat 4 / active vs moat 3 / watchlist). Membership carries **zero information** for the decision the framework makes. The investable content is the inference bill — ~195 orgs running security workloads at $25/$125 per M tokens, distributed through Bedrock, Vertex and Microsoft Foundry — i.e. an L0–L9 demand datapoint, not a screen.

**Process note.** `data/universe.json` unchanged this commit — no rating moved. GOVERNANCE only. The v2.9.4 `physicalConstraint` re-rating had not yet reached CI when it ran on 07-29 (CRCL still shows PC 4 in `data/scores/2026-07-29.json`); it takes effect on the 07-30 run.

---

## 2026-07-29 — v2.9.4: CRCL falsifier review · `physicalConstraint` 4 → 3 · the regulatory-constraint test

Prompted by two news items — Stripe in talks to acquire OpenRouter at ~$10B, and Stripe/Advent's $60.50/share offer for PayPal. **Neither produced a portfolio motion.** PYPL was evaluated and rejected before reaching the pricing gate; what the news actually did was supply a stress test for a name already held.

### 0. PYPL evaluated and rejected — recorded so it is not re-proposed

Fails the funnel at two independent gates: the defensibility OR-gate (`physicalConstraint` 1–2, `moatCapture` 2–3 — the 8.2× standalone forward P/E against V/MA at ~25× *is* the market's moat verdict) and `aiContribution` (≈0.05–0.10 of forward revenue growth, against a 0.30 floor). It never reaches `pricingScore`, so the apparent 10.2× cheapness is never consulted.

Separately and more fundamentally: **a target's upside is contractually capped at the deal price.** If the merger creates the value the thesis claims, that value accrues to Stripe's shareholders. At $58.73 against a $60.50 bid and a $53.83 sell-side standalone target, the market implies ≈83% completion probability; an independent estimate of 60–70% (Braintree/Stripe horizontal overlap in enterprise acquiring is the antitrust handle) makes the current price rich, not cheap. Not added to the universe, not added to the watchlist.

### 1. CRCL — first formal falsifier review

`falsificationObservations` opened with two entries, matching the GLW v2.9.0 / INTC v2.9.2 format.

**Falsifier #2 (USDC share loss) — NOT TRIGGERED, wide margin.** First-party DeFiLlama series: USDC $63.68B / 24.07% (2025-07-31) → $72.40B / 23.75% (2026-07-29). Supply **+13.7% YoY** against a market that grew 15.8%; share flat inside a 12-month band of 23.00–24.55%. The largest non-USDT challenger is USDS at $6.56B (2.13%), against a threshold requiring roughly $14.5B. `moatCapture` **HELD at 4 on affirmative measurement**, which is a stronger basis than the INTC hold of 2026-07-28 ("one print does not move a rating").

A `thresholdDefect` is recorded: ">20% of USDC market cap share" admits three readings ($14.5B, $61B, or share falling to 19.26%). All three are untriggered today so the ambiguity is not yet load-bearing. **Not edited** — append-don't-edit.

**Falsifier #4 (bank-issued tokenized deposits displace USDC in agent settlement) — NOT TRIGGERED.** KlarnaUSD is the first bank-issued token on Stripe's Tempo, minted through Bridge Open Issuance — but Klarna is not an AI agent platform, KlarnaUSD was on testnet at announcement, and no supply appears in the DeFiLlama registry. What exists is infrastructure capable of hosting the falsifier's scenario, not the scenario.

### 2. Correction — the head-to-head charter claim was wrong

The session discussion preceding this commit asserted that Bridge's OCC charter weakened Circle's regulatory moat **head-to-head**. Wrong on the facts: **Circle received FINAL OCC approval 2026-07-10** (First National Digital Currency Bank, N.A.); Bridge holds only **conditional** approval from 2026-02-12. Circle is ahead, not behind.

A second self-correction is recorded inside the falsifier #2 entry: an intermediate read compared a Nov-2025 secondary datapoint against today's and concluded USDC was shrinking. The first-party series shows a local peak against a local trough. Same class of error as the GLW `momentum6m` read (v2.9.0 §0) — **two-point comparison on a volatile series manufacturing a trend that is not there.**

### 3. `physicalConstraint` 4 → 3, and the test that produced it

The finding that survives measurement is broader than Stripe and does not depend on it. The rating claimed a chokepoint; the OCC has granted national trust charters to **eleven firms in roughly three months**, with more pending. **A constraint eleven competitors clear in a quarter is a queue, not a chokepoint** — the regulator is widening it as policy, not rationing it.

Generalised into GOVERNANCE §"Constraint Decay" **new §3**: a `regulatory` constraint earns pc ≥ 4 only if grants are capped by something other than regulator throughput. Explicitly **not** applied to the other four regulatory-type holdings (ISRG, ASTS, AVAV, KTOS) — not audited, no view recorded, open item.

`funnelPass` **unchanged**, verified by offline simulation of the OR-gate *before* the edit rather than asserted after it. The residual is recorded rather than acted on: `moatLocks` still contains `"licensing"`, which is the same claim `physicalConstraint = 4` was making. With the physical leg withdrawn, **the entire position hangs on `moatCapture = 4`, whose only independent lock is `"integration"`** — and simulation confirms `moatCapture` 4 → 3 would flip the gate to FAIL.

### 4. New falsifier #5 — issuer unbundling

Opened to measure the now load-bearing `"integration"` lock: combined supply of brand-issued stablecoins minted on third-party white-label infrastructure exceeds **$15B (≈20% of USDC supply) by 2027-12-31**. Distinct from #2 — that tests one rival dollar taking share; this tests whether *"a dollar any brand can issue"* takes it collectively, in which case licensing and reserve scale stop being differentiators. Baseline 2026-07-29 ≈$0.15B visible. First check 2026-12-31.

**Process note.** `data/scores/*` untouched. No pipeline run — local UTC has rolled to 07-29 and an after-hours run would write a scores file ahead of CI. The re-rating takes effect on CI's next run. GOVERNANCE's stale pc ≥ 4 distribution line (`52 · 33 tech · 5 regulatory`) was recounted to `50 · 32 tech · 4 regulatory`; it was already off by one in two buckets before this commit.

---

## 2026-07-28 — v2.9.3: crypto funnel aligned with the equity funnel · L2 self-reference recorded as permanent

Three items were tabled at the end of v2.9.2. **The first was withdrawn — the recommendation that produced it was wrong.**

### 0. Correction — the 23KB archive threshold measures `MEMORY.md`, not a topic file

v2.9.2's closing summary flagged that a memory topic file had "crossed the 23KB archive hard-trigger line."

**Wrong.** `memory_schema` §1 sizes that threshold against **`MEMORY.md`**, which is loaded into context every session and is bounded by a 24,400 B hook limit. A topic file is loaded only when read, so its size costs nothing until then. Applying a resident-context budget to a non-resident file is a category error.

Measured: `MEMORY.md` = **21,558 B = 88.4%** of the limit, which lands in the **soft-trigger band (86–94%)** whose prescribed action is *"tell the user, don't act."* The lossless-compression pass the rule requires before any archiving had already been run today — zero residual on both tail classes. **No archiving performed.**

---

### 1. Crypto funnel — the two divergences closed, both measured at zero delta

`update-crypto-valuations.js` had never received two changes the equity funnel got:

**(a) Defensibility gate — `OR moatCapture >= 4` added.**

```js
// before
if (ticker.physicalConstraint < 4) failReasons.push(`PC=${ticker.physicalConstraint}<4`);
// after
const moat = typeof ticker.moatCapture === 'number' ? ticker.moatCapture : 0;
if (ticker.physicalConstraint < 4 && moat < 4) failReasons.push(`defensibility: ...`);
```

**Measured delta: zero.** No L_DCOMP member has `physicalConstraint < 4` **and** `moatCapture >= 4` — LINK and ETH carry mc=4 but already clear pc=4; RNDR, TAO and FIL carry mc=2. The clause closes a divergence that would have produced a silent disagreement the moment a crypto member with pc=3 / mc=4 was added, with nothing reporting it.

This also partially addresses governance gap #7 (`physicalConstraint` is metaphorical for crypto — LINK/ETH hold pc=4 for *network effects*, not physics). The OR clause gives a network-effect moat somewhere honest to live. **Restating the metaphorical pc scores and letting `moatCapture` carry the defensibility would move ratings and is deliberately not done.**

**(b) Pricing gate — hard `> 3.0` cut replaced with the equity hysteresis band 2.8 / 3.2.**

Anchor lookup filters on `assetClass === 'crypto'` rather than keying on symbol, because every scores file through 2026-07-27 contains *both* a crypto row and an equity-namespace collision row per symbol — 07-27 carries LINK at $4.52 (Interlink Electronics, `pass=false`) beside LINK at $8.63 (Chainlink, `pass=true`). A symbol-only lookup resolves that by file order, which is an accident rather than a rule.

**Measured delta on 2026-07-28 data: zero funnel-state changes.**

| | pS | prior | before | after |
|---|---|---|---|---|
| RNDR | 3.40 | FAIL | FAIL | FAIL |
| TAO | 3.50 | FAIL | FAIL | FAIL |
| FIL | 2.86 | FAIL | FAIL | FAIL *(second fail reason added: 2.86 > 2.8 entry)* |
| **LINK** | **2.89** | **PASS** | **PASS** | **PASS — now flagged `pricing-hysteresis-band`** |
| ETH | 4.08 | FAIL | FAIL | FAIL |

**The useful output is not the delta, it is the label.** LINK is the only crypto PASS in the book, and its 2.89 sits inside the 2.8–3.2 band — so that PASS is a state **held from the prior session, not a fresh signal**. Under the old hard cut this was invisible: 2.89 < 3.0 read as an ordinary pass.

**The forward-looking effect is a real tightening and is not being described as free.** Entry moves 3.0 → 2.8. If LINK ever exits above 3.2, re-entry will require ≤ 2.8 where it previously required ≤ 3.0.

**Why the constants were shared rather than scale-adjusted.** The two scales are *not* economically identical — equity `deviationToScore` uses slope **2.5**, crypto `devToScore` uses slope **1.5**, so crypto scores compress toward 3.0 and reaching 2.8 demands **−13.3%** below median versus **−8%** on the equity side. The shared constant is therefore materially stricter for crypto. It is shared anyway because `pricingScore` is already consumed as a single cross-asset scale everywhere else in the system: `lib/data.ts` `pricingColor()` and `pricingBg()` apply the identical 2.0/2.5/3.0/3.5 breakpoints to every row with no `assetClass` branch. A funnel threshold that alone varied by asset class would be the inconsistency. Harmonising the *slope* instead would re-rate every crypto member in one commit — recorded as governance gap #8, not done.

Crypto rows now also emit `moatCapture` and `funnelWarnings`, which the equity rows already carried.

---

### 2. L2 self-reference — recorded as CLOSED, not as a backlog item

New GOVERNANCE.md section **Structurally Self-Referential Layers**, plus a machine-readable `_structurallySelfReferential` block on the L2 benchmark entry.

`_selfReferential: true` fires on **9 of 22** layers, and the flag **cannot distinguish two states that call for opposite responses**:

| state | meaning | correct response |
|---|---|---|
| under-populated | nobody has done the work | do the work |
| structurally unanchorable | qualifying comparables **do not exist** | stop looking, record why |

Read as the first when it is the second, the flag becomes a standing invitation to "fix" it by declaring a badly-matched peer — which silently re-rates every holding in the layer. Not hypothetical: CRDO entering L8_NET moved the median −23% and knocked ANET out of PASS (v2.7.1); JNPR leaving moved ANET 3.0 → 4.0.

**L2 is unanchorable and permanently so.** NVDA and AMD are holdings; CBRS (Cerebras) — the obvious third public name — is also a holding; Groq, SambaNova and Tenstorrent are private; adjacent public fabless designers fail business-model match harder than INTC did, and INTC was removed for exactly that reason in v2.9.2.

**Consequence, stated plainly: 55% of every L2 pricingScore is anchored on a median of the book itself, and no amount of peer-list work will change it.** NVDA, AMD and CBRS cannot look expensive relative to a group composed of NVDA, AMD and CBRS. **An L2 pricing verdict is a within-layer ranking, never a statement about absolute valuation.**

**L0 is the same shape and is deliberately NOT recorded** — its peers MSFT/AMZN/META/ORCL are 4/4 holdings, but whether a qualifying external hyperscaler exists has not been researched. For L0 the two states remain indistinguishable until someone looks, and claiming otherwise would be the same category error as §0.

Two further gaps recorded: **#8** the two pricingScore slopes (above), and **#9** `loadPreviousFunnelState()` in `update-valuations.js` keys `map[r.symbol]` alone, so a duplicated symbol resolves by file order — harmless from v2.9.1 onward but live for any replay of files through 2026-07-27.

---

### Process note

`data/scores` is again untouched: the crypto changes were verified by offline simulation against the stored 07-28 scores with the 07-27 anchor, rather than by running the live pipeline, which would have hit CoinGecko and written an after-hours 2026-07-29 file ahead of CI. Same reasoning as v2.9.2 §2.

Of the three items tabled, **one was withdrawn as based on a wrong reading, one changed no ratings but exposed that the only crypto PASS is a held state, and one was closed as permanently unfixable.** None of them was the "fix" it looked like from the outside.

---

## 2026-07-28 — v2.9.2: INTC falsifier review · L2 peer-list repair · the peer-independence test was measuring the wrong set

Two commissioned items. The second turned out to be three defects, not the one it was commissioned for.

### 1. INTC — first formal L5 falsifier review against a reported quarter

Q2 FY2026, reported 2026-07-23. Two `falsificationObservations` entries opened on `INTC`, same procedure as the GLW review in v2.9.0 (that one was L8_OPT; this is L5).

**Falsifier #2 is the load-bearing one, and it is TRACKING TO TRIGGER.**

| | external foundry revenue |
|---|---|
| FY2024 | $159M (full year) |
| FY2025 | $307M (full year, ~$77M/qtr) |
| Q1 2026 | $174M |
| **Q2 2026** | **$293M** — 5% of the $5.8B segment |
| **H1 2026** | **$467M** |

Threshold: *external customer revenue <$2B by C2026E → IFS strategy structurally fails.*

To clear $2B, H2 must deliver **$1,533M**. Q2 grew +68.4% QoQ; sustaining exactly that rate gives Q3 $493M and Q4 $830M, an FY total of **~$1.80B — still short**. Clearing the bar requires the growth rate to *accelerate*. No marquee external 14A customer is signed (management targets 2H 2026), and 14A does not enter risk production until 2H 2027, so any 2026 external ramp has to come from 18A.

**Decisive next check, Q3 FY2026 (late October):** external ≤ **$400M** fires #2 arithmetically — Q4 would then need $1,133M, a +183% QoQ jump. ≥ **$550M** keeps $2B alive but still demands a further ~79% QoQ step in Q4.

**The threshold has a defect, found by measuring it.** It is a bare dollar figure, and a bare dollar figure can be cleared by an accounting event. Altera was deconsolidated 2025-09-12 (51% of its stock sold), converting Intel-internal wafer volume into third-party external revenue — so the $77M/qtr → $174M step-up is substantially *mechanical*, not customer-won. The falsifier's intent is "can Intel win third-party customers"; on intent it is firing harder than the number shows.

Handled by **opening falsifier #6** rather than editing #2, so the original judgement stays auditable:

> *IFS external revenue growth is reclassification rather than customer acquisition — external foundry revenue excluding deconsolidated-affiliate volume fails to exceed $150M/quarter by Q4 C2026. FIRST CHECK: Q4 FY2026 10-K segment detail.*

Same pattern as GLW #7 vs #6 in v2.9.0. Recorded as a general rule in `_meta.fieldGuide.thesisFalsification`: **append, don't edit.**

**Falsifier #4 — both legs in track, consequence not yet observed.** Non-GAAP GM 41.8%, Q3 guide 42%, neither reaching the 45% floor; capex >$20B for 2026 with 2027 "significantly above", pointing at the >$25B/yr leg in 2027. No equity raise, no capex cut — capex was *raised*. Accumulating, not firing; resolves in 2027.

**Falsifiers #1 and #3 — NOT triggered, and this is real good news that is not being smoothed away.** 18A output beat internal targets ~25%, up >50% QoQ, Panther Lake cost −50% YTD (cost per good die is a yield proxy). Data Center AI $6.3B, +24% QoQ, **+59% YoY**. First named external foundry customer announced (Fortinet, 2026-07-23). Revenue $16.128B vs ~$14.43B consensus; non-GAAP EPS $0.42 vs ~$0.21–0.22; seventh straight quarter above own guidance.

The honest synthesis: **the product side is recovering and the foundry side is unproven — and the price is being paid for the foundry side.** Capex is an input; falsifier #2 measures the output. This quarter Intel raised the input and reported $293M of the output.

**No rating moved.** `moatCapture` HELD at 3, `physicalConstraint` HELD at 4. The integration lock failing to convert into third-party capture argues for 2, but this session already produced one error from re-rating a thesis on a single print (§0 of v2.9.0, GLW). One observation does not move a rating.

**Confidence, explicit.** #2 tracking-to-trigger HIGH · #4 legs in-track HIGH · #1 not-triggered MEDIUM (management-reported, unaudited) · #3 not-triggered MEDIUM-HIGH · **quarterly external-revenue figures MEDIUM-HIGH** — taken from aggregators citing the 10-Q, filing not read directly, and one source reported $800M for Q1 against the $174M carried by others. Two arithmetic caveats are flagged rather than encoded: OCF +$7B alongside adjusted FCF −$8.419B implies ~$15.4B of capex in one quarter, which does not reconcile with >$20B for the year; and the "$100B, more than any semiconductor company" superlative is bounded to *US* tools and plant, which is what makes it true.

`INTC` remains **FAIL on pricing alone** — pricingScore 4.2, forward P/E 43.9 vs the L5 median 18.5, +349.1% over 12 months. Note also that `aiContribution` sits at **exactly 0.30**, precisely on the gate boundary: any downward revision fails the ticker on a second dimension.

---

### 2. L2 peer list — INTC removed

`INTC` was declared a **peer of L2** while its universe entry is **layer L5**. It was simultaneously a constituent of what L2 calls fair value *and*, against L5's foundry median of 18.5, L2's most expensive outlier at forward P/E 43.9.

Two independent grounds for removal, so this is not a close call:

1. **Layer contradiction** — the universe thesis for INTC is explicitly the *foundry* thesis. L5 is the thesis-correct assignment, so the peer list is what was wrong, not the layer. `layer` is unchanged.
2. **Business-model mismatch** — GOVERNANCE.md § *CHANGE a layer's `peers` list* forbids mixing capital-intensity profiles. L2 is fabless high-performance compute silicon; INTC is a capital-intensive IDM carrying a foundry segment that lost $2.1B in the quarter. That is the exact mismatch the rule names.

GOVERNANCE.md requires *delisted or acquired* peers be replaced. INTC is neither, so the rule does not bind — and it is **deliberately not replaced**: L2 has no public external comparable. Training silicon is a duopoly plus private companies (Cerebras is already the universe member CBRS; Groq, SambaNova, Tenstorrent are private). Any substitute would fail business-model-match harder than INTC did.

**Measured rating delta** — GOVERNANCE.md requires it for *every* ticker in the layer, all non-benchmark components frozen at 2026-07-28:

| | pricingScore | forward P/E cmpt | EV/Rev cmpt | funnel |
|---|---|---|---|---|
| NVDA | 2.0 → **2.0** | 1.5 → 1.6 | 2.8 → 2.7 | PASS → PASS |
| AMD | 3.1 → **3.2** | 2.7 → 3.0 | 3.2 → 3.0 | FAIL → FAIL |
| CBRS | 3.3 → **3.3** | 5.0 → 5.0 | 5.0 → 5.0 | FAIL → FAIL |

Median moves: forward P/E 38.8 → **33.6**, EV/Revenue 20.0 → **21.3**, sample 4 → 3.

**The two components offset, which the pre-measurement prediction missed.** Only the forward-P/E effect had been anticipated. INTC's EV/Revenue of 8.75 had been dragging the L2 EV/Revenue median *down*, making L2 members look expensive on that leg; removing it raises the median and makes them look cheaper. Net effect on AMD is **+0.1**, not the one-directional move predicted. No funnel state flipped. `INTC`'s own score is untouched — it is scored against L5.

**Median provenance matters here.** The medians were recomputed from the ratio snapshot already stored in `data/scores/2026-07-28.json`, **not** from a fresh fetch. A live re-run at 2026-07-29 UTC moved medians across 22 layers — including **L6 24.3 → 16.6, a −32% move that would materially re-rate MU**. Bundling that drift into a structural commit is precisely the silent re-rating GOVERNANCE.md exists to prevent. Price drift is left to the scheduled job.

---

### 3. The peer-independence test was measuring the wrong set

Not commissioned. Found while verifying §2 — and it is the reason §2 was invisible.

`update-benchmarks.js` computed:

```js
const externalPeers = declaredPeers.filter((p) => !members.includes(p));
```

`members` is **this layer's** universe tickers. But GOVERNANCE.md §124 states the principle globally — *"a peer list made of holdings restores the same defect"*. **A holding is a holding, whatever layer it sits in.**

| layer | reported external peers | actual | why |
|---|---|---|---|
| **L2** | 1 | **0** | INTC is an L5 holding, counted as L2's external reference |
| **L11** | 2 | **1** | CCJ is an L11_FUEL holding |
| **L_EXP_QC** | 3 | **1** | IONQ/RGTI are that layer's *own* members — invisible to `members` only because `byLayer` skips `status === 'experimental'`, so the layer was declaring its own holdings as external peers |

**All three errors inflate `_externalPeerCount`. All three make the self-reference alarm UNDER-fire.** A diagnostic biased toward reassurance is worse than no diagnostic, and this one had been quietly reassuring since v2.8.0.

Fixed by testing against the whole book, at any status and in any layer:

```js
const universeSymbols = new Set(universe.tickers.map((t) => t.symbol));
const externalPeers = declaredPeers.filter((p) => !universeSymbols.has(p));
```

Surfacing only — **zero pricing impact**. It turns on two new `_selfReferential` alarms (L11, L_EXP_QC) and corrects L2's from a masked 1 to a true 0. Self-referential layers now stand at **9 of 22**: L0, L2, L2_5, L3, L4, L7, L11, L14, L_EXP_QC.

The residual limitation is stated rather than papered over: **55% of every L2 pricingScore is now openly anchored on a median of the book itself.** That is a structural property of a duopoly layer, not a fixable data gap — and it is the honest state the layer-scoped test was hiding.

---

### Process note

§1 was commissioned as a review and produced a falsifier-design fix. §2 was commissioned as a one-line peer edit and produced a systemic diagnostic bug. Both times the extra finding came from **verifying the commissioned change rather than just making it** — the same mechanism that produced v2.9.1, where reading the remote before rebasing exposed two errors in v2.9.0.

---

## 2026-07-28 — v2.9.1: `assetClass` never emitted · true 6-month window

Two fixes, and **both correct claims made in v2.9.0 hours earlier**. Both were found only because the push was rejected and the remote's CI commit had to be read before rebasing.

### 1. The crypto pipeline was never missing — its dedupe key was

v2.9.0 §2 stated: *"`universe.json` already carries `coingeckoId` on every crypto member; **wiring that source is the real fix and is deliberately not done here**."*

**Wrong. It has been wired the whole time.** `scripts/update-crypto-valuations.js` runs immediately after `update-valuations.js` in `daily.yml`, prices L_DCOMP members off CoinGecko + DeFiLlama, and computes a crypto-native score (35% P/Rev, 35% P/TVL, 30% 6m momentum vs ETH). I never opened `scripts/`.

The actual bug is one missing field. The crypto script deduplicates before merging:

```js
base.results = base.results.filter((r) => r.assetClass !== 'crypto');
```

`update-valuations.js` never wrote `assetClass`, so that filter matched nothing and the merge became an append. `lib/data.ts` had declared `assetClass?: 'equity' | 'crypto'` all along — the field was expected and never populated.

The committed record shows the damage. CI's own `0af9b2b` (`data/scores/2026-07-28.json`, 16:27 UTC) carried **two rows for LINK and two for ETH**:

| symbol | price | source | pricingScore | pass |
|---|---|---|---|---|
| LINK | **$4.55** | Interlink Electronics (equity collision) | 3.8 | false |
| LINK | **$8.40** | Chainlink (CoinGecko) | 2.89 | **true** |
| ETH | **$18.31** | Grayscale Mini Trust ETF | 2.8 | false |
| ETH | **$1,919.63** | Ethereum (CoinGecko) | 4.08 | false |

86 rows for 84 tickers, `funnelPassCount` summed across both, and the funnel page renders every row — LINK appeared twice, once as a $4.55 microcap and once as the asset it is supposed to be.

Every row now carries `assetClass`; crypto rows written by the equity script are explicit placeholders the crypto script replaces. Verified after the fix: **84 rows, 84 unique symbols, 79 equity / 5 crypto, zero duplicates.**

Two divergences between the two funnels are now visible and are **left alone**: the crypto path uses a hard `pricing > 3.0` cut with no hysteresis, and its defensibility gate is `physicalConstraint < 4` alone — it never got the `OR moatCapture >= 4` clause. Recorded, not changed; either edit re-rates L_DCOMP by fiat.

### 2. `get6mReturn` was a data error, not a labelling error

v2.9.0 §0 stated the `interval: '1mo'` anchor drift was *"consistent across tickers and against SPY, so relative comparison survives — mislabelled, not corrupted."*

**Wrong.** The snap-to-month-end anchor lands on a different point in each ticker's own path, so the distortion is ticker-specific and large. Switching to `interval: '1d'` moved the 6-month return by:

| | before | after | Δ |
|---|---|---|---|
| AXTI | +13.0% | **+152.3%** | +139pp |
| LITE | −7.2% | **+67.6%** | +75pp |
| ALAB | +123.7% | +55.7% | −68pp |
| MOD | −6.0% | +44.6% | +51pp |
| AMD | +130.6% | +81.8% | −49pp |
| **GLW** | **−19.6%** | **+16.2%** | **+36pp** |
| IREN | −15.9% | −46.0% | −30pp |

SPY itself moved +8.3% → +6.6%.

**This retroactively strengthens §0 of v2.9.0 and makes the original misread worse than described.** The "GLW has been derating for six months" reading was built on a −19.6% six-month return. GLW's true six-month return is **+16.2%**. The decline the terminal-value thesis was constructed to explain did not exist at all.

11 of 84 names moved ≥0.2 pricingScore: LITE 3.1→3.6, AXTI 3.6→4.0, VRT 3.3→3.6, MOD 2.2→2.5, GLW 2.2→2.5, CGNX 3.6→3.9, TSEM 3.7→3.5, TER 2.5→2.7, CRDO 3.1→2.9, CLS 3.0→2.8, APLD 3.5→3.3.

### PASS set: 21 → 23

| | change | why |
|---|---|---|
| **LINK** | restored | the crypto-native row survives dedupe instead of sitting alongside a wrong one; it was passing in CI before this session too |
| **IREN** | FAIL → PASS | 2.9 → 2.7 on the corrected 6-month return |

**IREN's pass is flagged low-confidence and is not a buy signal**, on the same grounds as CIFR in v2.8.2. Its `forwardPE` is **−36.1** (loss-making, scored 5 by the punitive constant); the pass is carried by momentum score 1.2 (it fell 46%) and analyst-upside score 1 (target $81.73 vs price $33.97). `estimateRevision` direction is **down** (−0.37 → −0.48 EPS — a deepening loss), beats are 2/4, and its benchmark is the L9_MINER_CONVERT median that v2.8.2 already flagged as biased by `median()` dropping non-positive values. `deratingSignature` reads momentum-unwind (+129.8% over 12m). A cheaper price on a widening loss is what this row says.

`architectural-derating` still fires on the same six names after the momentum fix — ORCL, KTOS, SMCI, SNPS, PLTR, ISRG — with SNPS now the cheapest name in the universe at pricingScore 1.7.

### Process note

Both errors survived v2.9.0 review and died at `git push`. The rejection forced reading `origin/master` before rebasing, and CI's file contained the duplicate rows in plain sight. The v2.8.1 lesson was *confirm the baseline with `git log` before starting local work*; the sharper version is **read what CI actually produced rather than what you assume the pipeline does** — and, more bluntly, `ls scripts/` before concluding a data path does not exist.

---

## 2026-07-28 — v2.9.0: L8_OPT review against the Q2 print · pricing-applicability gate · derating signature

Triggered by GLW closing **−15.6%** on the day it reported. Three outcomes, and the first one is a correction.

### 0. The read that started this was wrong

GLW's `momentum6m` read **−28.1% vs SPY** while consensus +1y EPS had been revised **up 8.9%** in 90 days and the company had beaten **4 of 4** quarters. COHR (−15.8% / +9.2% / 4-4) and LITE (−16.9% / +12.2% / 4-4) showed the same shape. That combination was read as *the market is discounting terminal value* — i.e. the CPO architecture thesis breaking — and the funnel was accused of being structurally long the falling knife.

Wrong. Measured path:

| GLW | |
|---|---|
| 2025-12-29 | $90.67 |
| 2026-06-29 intraday record | **$271.78** |
| 2026-07-28 | $120.89 |
| drawdown from high | **−55.7%** |
| 12-month return | **+117.5%** |
| YTD | **+33.3%** |

Nothing was being derated. A parabola was deflating, and the decline began 2026-06-30 — twenty sessions of orderly distribution **before** the print, which merely accelerated the last leg.

`momentum6m` cannot see this because it compares two endpoints, and the entire distinction lives in the path between them. A name that fell steadily for six months and a name that nearly tripled and then gave it back both print ≈ −20%.

Two smaller defects fell out of chasing it, both recorded rather than fixed here: `get6mReturn` uses `interval: '1mo'`, so the anchor snaps to a month boundary and the window oscillates between 5 and 6 months depending on the day of month (consistent across tickers and against SPY, so relative comparison survives — mislabelled, not corrupted); and the v2.7.1 `_changeLog` entry on GLW attributed the drawdown to "institutional concern over near-term CPO deployment timing", an attribution never evidenced. That entry now carries an explicit correction rather than being edited away.

### 1. L8_OPT formal review — the falsifier printed, and it printed against the bear case

Falsifier #6 (architecture-neutrality break), written 2026-07-28 with a 2027-03-31 check date, measures *Corning Optical Communications enterprise/DC sub-segment YoY growth <15% for 2 consecutive quarters*. Q2 2026 delivered its first observation:

| | |
|---|---|
| Optical Communications sales | **$2,072M, +32% YoY** |
| **Enterprise Networks** | **+65% YoY** |
| segment net income | $438M, **+77% YoY** |
| segment net margin | 21.1% |

**NOT TRIGGERED — +65% against a <15% trigger, 4.3x the floor, zero of two required quarters.**

And the corroboration runs the other way from mere absence-of-evidence: the same release announced an **NVIDIA agreement to expand Corning's US optical-connectivity capacity 10x** and US fiber capacity >50%, plus a **multiyear multibillion-dollar Amazon agreement**. NVIDIA is the CPO champion; it is scaling capacity *with* Corning, not around it. Weeks added on the call that clusters above ~130,000 GPUs require a **third optical layer** — content per cluster rising with cluster size, which is a physical argument for the layer that holds under either architecture.

**`moatCapture = 4` strengthened.** The stock is the only thing that fell.

New falsifier #7 opened — **capital-intensity capture leak**, testing the same mc=4 premise from the returns side rather than the position side. 2026 capex steps up to ~$2B (from ~$1.7B), concentrated in Optical. mc=4 asserts Corning captures the value of being architecturally required; the competing reading is that Corning funds the buildout on long-term agreements while the customer captures the returns. Weeks's "we price on the value we create for customers" is management assertion on precisely the contested point — a report-good source. MEASURE: segment net margin falls two consecutive quarters while segment sales still grow >20% YoY. BASELINE 21.1%, and the CFO guided margin *up* from here, so a decline contradicts management's own stated expectation. FIRST CHECK: FQ3 2026.

New `falsificationObservations` field on universe tickers. A declared falsifier is only worth its check date if the measurement gets recorded when the date arrives — otherwise "tested and survived" is indistinguishable from "nobody looked", and both read as thesis-intact. Rule: record whether or not it fires, and contradictions carry an explicit `correction` rather than editing the earlier text.

One claim was **not** encoded: an aggregator attributed part of the decline to signalled wireless-carrier capex slowdown. The 8-K carries no such commentary and management stated the Q3 guide was not meant to signal a slowdown. Left as unverified.

### 2. Pricing applicability — GATING, fail-closed

For some members the four pricing ratios do not read badly, they **do not exist**, and scoring them anyway emits a number that looks like a measurement. That number was deciding funnel state: LINK's sole fail reason was `pricingScore 3.8 > 3.2 (exit threshold — was passing)`, built from two components (EV/Rev 25% + momentum 20%) rescaled to full weight.

For crypto members it was not thin — it was **the wrong asset**. The script passes the bare universe symbol to Yahoo, which resolves against the US equity/ETF namespace:

| universe declares | Yahoo returns |
|---|---|
| `LINK` = Chainlink, $9B | **Interlink Electronics** — $74M NasdaqCM microcap, $4.70 |
| `ETH` = Ethereum, $310B | **Grayscale Ethereum Mini Trust ETF**, $18.26 |
| `TAO` = Bittensor | **Invesco China Real Estate ETF** |
| `FIL`, `RNDR` | no fundamentals / no quote — failed loudly, safe |

The first three are the dangerous class: a wrong answer that validates. There is no safe naive repair either — `TAO-USD` resolves to "Together As One", not Bittensor. `universe.json` already carries `coingeckoId` on every crypto member; **wiring that source is the real fix and is deliberately not done here** — it is a new data path, not a bug fix.

`assessPricingApplicability` marks a ticker inapplicable when it is crypto, has no positive forward P/E *and* no EV/Revenue anchor, or has component coverage below 55%. Inapplicable ⇒ the pricing gate **fails**, hysteresis not consulted. "We cannot price this" must never collapse into "this is attractively priced", and the recorded reason must be the honest one rather than a fabricated numeric comparison.

**PASS set unchanged — 21 names, no additions, no removals.** What changed is that the reasons are now true: RNDR/TAO/FIL move from silent fetch errors to recorded FAILs, LINK's fabricated 3.8 is replaced by the collision explanation, ETH and OKLO gain an honest second reason. Crypto members no longer enter the equity pipeline at all, so the wrong number is never produced rather than being produced and then discounted.

A standing policy is now stated rather than hidden: **loss-making names are structurally locked out of the pricing gate** by the `forwardPE < 0 ⇒ score 5` rule. 14 tickers sit there today, all already failing. That is a defensible policy and it is a *policy*, not a measurement.

### 3. Derating signature — SURFACING ONLY, zero weight

Adds the path term `momentum6m` lacks. Both inputs come from modules already fetched; no additional requests.

| signature | condition | reading |
|---|---|---|
| `momentum-unwind` | drawdown ≤ −30% **but** 12m return > 0 | giving back a prior advance — says nothing about the thesis |
| `architectural-derating` | drawdown ≤ −30% **and** 12m ≤ 0 **and** estimates rising **and** beating | market rejecting an earnings stream it is simultaneously marking up — a claim about the years beyond the estimate horizon |
| `drawdown-unclassified` | deep drawdown, estimates not rising or not delivering | ordinary deterioration |

First run: **29 momentum-unwind · 6 architectural-derating · 10 unclassified · 34 none · 5 no-data.**

GLW, COHR and LITE all classify **momentum-unwind** — the instrument built in response to today's crash says today's crash is not what it was read as. AXTI is the extreme case: −70.1% drawdown on a +1990.8% twelve months.

The six `architectural-derating` hits, two of them current PASS holdings:

| | layer | dd% | 12m% | pricingScore | funnel |
|---|---|---|---|---|---|
| ORCL | L0 | −64.9 | −52.0 | 2.1 | fail |
| **KTOS** | L_DEF | −63.9 | −13.4 | 2.4 | **PASS** |
| SMCI | L7 | −54.2 | −49.2 | 1.7 | fail |
| **SNPS** | L3 | −40.6 | −38.8 | 1.9 | **PASS** |
| PLTR | L1 | −40.0 | −15.8 | 3.5 | fail |
| ISRG | L_EMBI | −39.5 | −28.2 | 3.2 | fail |

Note the collision the same run produced: **ORCL is a watchlist promotion candidate** (`pricingScore 2.1 for 5 consecutive days → set status=active`) and simultaneously the deepest architectural-derating hit in the universe. The promotion machinery and the new diagnostic disagree, on purpose and visibly.

**Not a gate, deliberately.** The rule has zero validated observations and its first draft — momentum6m negative + estimates rising + beating, without the path term — would have fired on GLW today and been wrong. Calibrate on live cases before letting it move the PASS set. It earns a gate only if flagged names go on to underperform their layer over a full cycle; if they do not, delete it rather than promote it.

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

## 2026-07-28 — v2.8.2: the 8 unbenchmarked layers — 2 anchored, 6 proven unanchorable

Closing the item v2.8.0 surfaced: 8 layers had no benchmark entry, so **24 tickers (18 of them pc ≥ 4) priced against the cross-industry default of forward PE 22 / EV-Revenue 5.** The task was scoped as "declare peers for 8 layers." Attempting it established that **6 of the 8 cannot be anchored**, for structural reasons rather than effort.

### The default is not neutral noise — it pins 55% of pricingScore at 5.0

Actual ratios in these layers against the 22 / 5 default: APLD 234.7x / 40.9x, RKLB 2108x / 55.2x, ASTS −218x / 211.4x, WULF 84.9x / 69.0x, AXTI 53.5x / 32.2x. `deviationToScore` saturates at 5, so for most of these names **both** the forwardPE and evRevenue components sit pinned at 5.0 and carry no information.

This is structurally the **same defect as the L6 single-member median** found in v2.7.1, inverted: there the components were pinned at 3.0 (neutral), here at 5.0 (maximally expensive).

**Consequence:** names in these layers can essentially only fail the pricing gate — *except where their real ratios happen to sit near 22 / 5 by coincidence.* **TTMI (19.9x / 4.34x), AVAV (34.4x / 4.04x), KTOS (43.6x / 5.65x) and CRCL (33.1x / 5.18x) currently PASS on that coincidence**, not on any sector comparison.

### Anchored: 2 layers

**L9_MINER_CONVERT** — peers MARA / RIOT / CORZ / CLSK / BTDR (5 external, clean model match). Medians 22 → **77.2** and 5 → **20.6**.

| | before | after | |
|---|---|---|---|
| APLD | 3.5 | 3.5 | |
| CIFR | 3.7 | **2.8** | **FAIL → PASS** |
| IREN | 3.4 | 2.9 | |
| WULF | 3.6 | 3.0 | |
| HUT | 4.0 | 4.0 | |

⚠ **The 77.2 must not be read as "the sector trades at 77x."** `median()` filters non-positive values, so the loss-making peers (MARA, RIOT, CLSK, BTDR) drop out and the figure is the midpoint of the *profitable minority* — whose PEs are themselves extreme (CIFR 42x, CORZ 68x, WULF 85x, APLD 235x). Benchmarking against it says only "cheap relative to other very expensive names."

**CIFR's new PASS is low-confidence and should not be traded on**: it rests entirely on that leg, `pegRatio` is N/A (the AXTI unmonitorable precedent), `estimateRevision` is **−11.1%** — consensus being marked *down*, rare in this universe — and it sits exactly on the 2.8 entry threshold. **Methodology event, not a buy signal.**

**L_DEF** — peers DRS / LHX / RCAT. Medians 22 → **34.4** and 5 → **5.6**. AVAV 2.5 → **2.1**, KTOS 2.8 → **2.4**; both were passing and still pass, with more headroom. Model mismatch disclosed: LHX is ~4x larger and a prime contractor, RCAT is a direct product competitor but loss-making so it contributes only to the EV/Revenue leg. Only 2 peers supply a valid forwardPE, so AVAV sits near the median and self-reference is only partly removed. Both passes also look weaker on delivery than on price: **AVAV's +1y consensus EPS was revised DOWN 18% over 90 days with 1 of 4 quarters beating**; KTOS carries pegRatio 36.41.

### Proven unanchorable: 6 layers — recorded in `_meta._unanchorableLayers`, not fabricated

A placeholder is a visible *unknown*; a wrong median is an invisible *known*. Reasons, each specific:

- **L11_FUEL** — insufficient valid sample, not absent peers. Exploration-stage uranium (UEC, NXE, DNN) carries negative forward PE and EV/Revenue of **219x–605x** on near-zero revenue; including them would make CCJ look arbitrarily cheap. Restricting to producers leaves CCJ / LEU / UUUU = n 3, below the ≥4 rule.
- **L5_5** — no comparable US-listed PCB/substrate maker exists (Zhen Ding, Unimicron, Nan Ya are all Taiwan-listed, out of scope per v1.10). The available US names are EMS contract assemblers (BHE 1.05x, SANM 0.90x EV/Rev) — the exact model mismatch the v2.8.0 rule names. **TTMI's current PASS cannot be tested against a real peer set because none exists.**
- **L8_OPT_MAT** — compound-semiconductor substrate peers are almost all non-US (Sumitomo, JX, IQE, Soitec); the nearest US analogue WOLF has negative forward PE. Fewer than 2 valid external peers.
- **L_SPACE** — forwardPE is *meaningless* for the constituents, not merely unanchored: RKLB prints 2108x, ASTS −218x, external PL 6099x. The EV/Revenue leg could be anchored, but a half-anchored layer whose other half is nonsense is worse than an openly flagged placeholder.
- **L_EMBI** — the layer has no single business model, so no peer can match it: surgical robotics (ISRG), machine vision (CGNX), industrial motion (PH), a carmaker (TSLA), sensors (VPG). **This is a layer-definition problem, not a peer-selection problem**; the fix is splitting the layer, which is a separate decision.
- **L_DCOMP** — mixes two asset classes. Five constituents are crypto scored on P/Revenue and P/TVL by a different script, for which an equity forward-PE median is categorically inapplicable; only CRCL is an equity.

### Standing implication

For pre-revenue, loss-making and crypto constituents, `pricingScore` is not a weak signal — it is **inapplicable**, while the funnel still uses it as a hard gate. That is the honest description of the remaining distortion, and it is a design question rather than a data-entry backlog. Not actioned here: fixing it would change the PASS set by fiat.

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
