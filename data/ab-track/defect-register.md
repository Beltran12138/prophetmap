# Defect register — frozen A/B window 2026-08-17 → 2027-08-17

Append-only. One entry per defect found **after** the freeze commit `9c38e6d` that violates none of the seven pre-registered rules. Classification and the rules themselves are in `GOVERNANCE.md`, section *Post-freeze defect rule (v2.9.21)*.

Every entry must carry:

| field | why it is mandatory |
|---|---|
| **Rule** | 1 / 2 / 3, from the Q1 / Q2 test. Stated, not implied. |
| **Affected names in F** | **computed by running code against committed inputs, never assembled by hand.** The script and its output go in the entry. |
| **Scoring days observed at entry** | a register written on day 24 is not a register written on day 0, and the reader is entitled to discount it. |
| **How it was found** | *reading code* or *looking at returns*. If a defect was found by noticing a name performing badly, then any subset that excludes it is correlated with the observed returns, and a secondary analysis on that subset is contaminated before it is written. |

⚠️ **This register is not a discount coupon.** A gate result that is cited as valid when it passes and blamed on this register when it fails has been read in bad faith. `GOVERNANCE.md` closes both directions explicitly.

---

## Entry 1 — Gap #20 · layer id is an unvalidated foreign key

- **Recorded** 2026-09-10 · **Defect found** 2026-09-09 · `GOVERNANCE.md` Gap #20
- **Rule 1** (G-defect). Q1 = NO: `update-valuations.js` chooses a benchmark when a score is *written*; nothing in it runs when `ab-track.js` computes returns from frozen membership and price files.
- **Scoring days observed at entry: 17** (2026-08-18 → 2026-09-09)
- **How it was found: reading code.** Traced while correcting the repository's own description, which claimed a 19-layer model where `layers.json` defines 27. No return series was consulted, and no name was selected for inspection because of its performance. **The affected list is therefore uncorrelated with observed returns**, and a secondary analysis excluding these names is admissible under the secondary-analysis clause.
- **Affected names in F — 12 of 87 (13.8%), all 12 inside the frozen roster:**

  `ASTS · AXTI · CCJ · CGNX · CRCL · ISRG · MOG · PH · RKLB · TSLA · TTMI · VPG`

  Computed by set-comparing `frozen-2026-08-17.json:roster` against the layer ids present in `sector-benchmarks.json`, over the committed `universe.json`. Not assembled by hand.

  ```
  frozen roster                      87 = 82 equities + 5 crypto
  universe.json today                89 = 84 equities + 5 crypto
  delta                              MKSI, KLIC — added at watchlist under Gap #13,
                                     excluded from gate A, absent from F
  layers used by equities but absent
  from sector-benchmarks.json         L11_FUEL · L5_5 · L8_OPT_MAT · L_DCOMP · L_EMBI · L_SPACE
  frozen names in those layers        12  (12 of 12 affected equities are in F)
  frozen names missing from universe   0
  ```

- ⭐ **This entry settles a discrepancy three of the four external reviewers flagged**: Gap #20 reports "12/84" while the freeze is 87. **Both denominators are correct and they are different.** 84 is today's equity count; 87 is the frozen roster including 5 crypto lines. One reviewer hypothesised a silent three-row truncation in the pipeline. There is none.
- ⚠️ **Effect is on the explanation, not the arithmetic.** For these 12, forward P/E and EV/Revenue — 55% of the composite — were measured against a hardcoded constant (P/E 22, EV/Rev 5) rather than layer peers. That determined which names entered F. It does not touch the equal-weighted return of F, which is computed from prices.

---

## Entry 2 — Gap #18 · the discovery candidate set is generated from the universe

- **Recorded** 2026-09-10 · `GOVERNANCE.md` Gap #18
- **Rule 1** (G-defect, upstream). Q1 = NO. `exitDoesNotRemove` means `universe.json` cannot alter the frozen roster in either direction, so discovery cannot reach this experiment at all.
- **Affected names in F: none.** The defect governs which names could ever have been *found*, not which are in F or what they returned.
- **Scoring days observed at entry: 17** · **How it was found: reading code**, after the repository's owner asked whether the project could only ever evaluate the few dozen names already in it.
- **What it does bear on: external validity, and only that.** A gate A pass licenses *"given this pool, the screen discriminates"*. It does not license *"the screen finds outperformers"*, because the pool is the one-hop Yahoo-peer neighbourhood of what was already held.

---

## Entry 3 — Gap #19 · a candidate surfaced three consecutive months with no verdict required

- **Recorded** 2026-09-10 · `GOVERNANCE.md` Gap #19
- **Rule 1** (operational, upstream of G). Q1 = NO.
- **Affected names in F: none.**
- **Scoring days observed at entry: 17** · **How it was found: reading the monthly reports**
- Listed here only so the register is the complete set of what was known at day 24, rather than a curated subset. **A register that holds only the flattering defects is worse than none.**

---

## Entry 4 — Gap #10 · layer assignment silently selects the benchmark

- **Recorded** 2026-09-10 · `GOVERNANCE.md` Gap #10
- **Rule 1** (G-defect). Q1 = NO, same path as Entry 1.
- **Affected names in F: not yet computed.** Entry 1's defect has a mechanical definition (*layer absent from the benchmark file*); this one does not — it asks whether a name's layer is the *right* layer, which is a judgement, not a set operation.
- ⛔ **Deliberately left uncomputed rather than estimated.** A hand-assembled list here would violate this register's own rule, and a judgement made at day 24 with returns visible is exactly the contamination the "how it was found" field exists to catch.
- **Consequence, stated so it is not discovered later**: the secondary analysis permitted before 2027-02-17 can exclude Entry 1's names and **cannot** exclude Gap #10's, because Gap #10's set does not exist in a form anyone can register blind.

---

## Entry 5 — Gap #21 · the evaluation path E was never anchored, and moved on day 17

- **Recorded** 2026-09-10 · **Defect occurred** 2026-09-03 · `GOVERNANCE.md` Gap #21
- **Rule 2** (E-defect). Q1 = YES — the trading calendar is consumed inside `buildSegments`, on E's execution path. Q2 = NO — the calendar is in neither F nor the seven rules.
- **Entered retroactively.** The change predates the rule that classifies it by seven days. Rule 2's before/after requirement was nonetheless satisfied at the time, in `ffbef15`'s commit message.
- **Before / after, from that commit:**

  ```
  same score files, byte-identical      n = 9        n = 11
  SMH close 2026-08-28                  null         553.11
  paired t                              -1.14        -1.63
  ```

  The two runs differed only by the network route the price feed was fetched over.

- **Baseline anchored today, and its lateness is part of the record:**

  ```
  scripts/ab-track.js   blob 057aed8   last touched ffbef15 (2026-09-03)
  anchored at           HEAD of 2026-09-10, day 24 of the window
  changed inside window ff6bb41, ffbef15 — both 2026-09-03, day 17
  ```

- ⚠️ **Anchoring E on day 24 does not anchor days 1 through 24.** E's stability over that stretch is unverified and must be discounted, not assumed.
- ⛔ **The calendar itself remains unfrozen.** Pinning it now is permitted by Rule 2 but would not be blind — 17 scoring days are already observed. Deferred to the mid-check of 2027-02-17, where the choice is: pin it, or state in the final report that **n was never frozen**. Silence is not one of the options.
