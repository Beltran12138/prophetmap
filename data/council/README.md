# Council transcripts

Raw, unedited responses from external models consulted on framework-level
questions. Archived so a later session can check what was actually said against
what was reported, rather than trusting the synthesis.

Read these as **inputs, not conclusions**. Each has been checked against
measurement and each has been found wrong in at least one place — see the
CHANGELOG entry for the corresponding date.

| Date | Question | Models | Outcome |
|---|---|---|---|
| 2026-07-30 | Should PEG remain the primary pricing indicator? Arbitration between PEG and pricingScore? Should margin capture become a fifth dimension? | Grok, DeepSeek (**MiMo timed out — 2 of 3**) | Split on Q1 (Grok: demote PEG; DeepSeek: keep + veto). Agreed on Q2. **Both wrong on Q3** — both recommended adding the dimension; four candidate formulations were tested against six tickers and all four failed. |
| 2026-09-09 | Should prophetmap / assay / decision-confidence / agent-tool-interop be merged? What is the correct unit of integration? What does the traffic reading support? | Grok, DeepSeek, Fable 5.1, Gemini 3.8 Flash (**4 of 4 answered**) | Unanimous against merging. **Both of the asker's supporting arguments were overturned** — see the correction note below. 3 of 4 independently attacked the *convergent validity* claim on the same word: **domain independence is not observer independence.** 🔴 **The asker supplied a false fact** (see below). |
| 2026-09-09 (B) | Red-team five methodology criteria the asker generated in a single day: are they repackaged existing concepts, and what is the counterexample to each? | Grok, DeepSeek, Fable 5.1, Gemini 3.8 Flash (**4 of 4 answered**) | **4 of 4 judged all five to be repackagings, with citations.** Two panelists independently found that **criterion 4 and criterion 5 contradict each other** on the asker’s own example. The asker’s nominated *strongest* criterion was the most damaged. See scoring below. |

---

## Correction — 2026-09-09 session: the asker fed the panel a false premise

The question package for the 2026-09-09 council described prophetmap as a **private repository**.
**It is not, and was not.** This repository has been public throughout. The claim was written from
memory and was never checked, and it contradicted the asker's own notes, which state plainly that
prophetmap is a public repo.

**What that invalidates, specifically:**

| Panelist | Claim, now void |
|---|---|
| DeepSeek | "private repo -> GitHub surface is zero" (Q4 ranking) |
| Fable 5.1 | "a pre-registration inside a private repo does not exist as far as reputation is concerned - nobody can verify it" (Q4 ranking) |
| Gemini 3.8 Flash | "the core prophetmap is an inaccessible private repository" (Q5 failure mode) |
| Grok | "it cannot earn GitHub reputation (private)" (Q4 ranking) |

**And it invalidates the chair's own arbitration.** The chair proposed publishing a hash and
timestamp of the frozen roster so the pre-registration could be externally verified. That was
already fully implemented, publicly, three weeks earlier: `CHANGELOG.md` v2.9.18 (2026-09-03)
states *"Ask git, do not store a hash. A digest written by the process that can rewrite the file
proves nothing. The freeze must have exactly one commit and a clean worktree. Verified:
`frozen-2026-08-17.json` @ `9c38e6d`."* **The public git history of this repository is the anchor.**

**What survives the correction:** the unanimous verdict against merging; the four-way ranking that
put `assay` first; the demolition of the GitHub-traffic evidence (Gap #18 provenance); and the
`domain independence != observer independence` critique. None of those depend on repository
visibility.

**What changes:** the 2-2 split on whether to keep investing in prophetmap loses its strongest
argument for divestment. The remaining arguments on that side - heaviest sunk cost, payoff locked
until 2027-08, and reputational downside of published stock calls - stand on their own.

**Two things worth recording about how the panel behaved.** Grok opened by stating that anything
marked *asker-reported* would be treated as input and not as independent verification. Fable 5.1
listed *"whether prophetmap is permanently private"* as missing information it needed. **The panel
quarantined the claim correctly. The asker was the one who labelled a guess as a fact** - which is,
with some irony, family 2 of the failure table these four projects exist to document.

---

## Chair pre-registration and scoring — 2026-09-09

`chair-preregistration.txt` was written **before the question package was sent** and archived
verbatim. Its purpose is narrow: a chair who reads four dissenting answers can always say
*"that is roughly what I thought"* afterwards. Writing the position and, more importantly, four
**falsifiable predictions about how the panel would behave** removes that escape.

The same discipline this repository applies to its own A/B window - register before you look -
applied to the person reading the panel.

**Result: all four predictions were wrong, and wrong in the same direction.**

| # | Prediction (written before sending) | Outcome |
|---|---|---|
| P1 | At least 2 of 4 will recommend merging or a monorepo, because convergence is the default answer | **0 of 4.** Several called Q1 a false binary: code, product and brand are three different questions |
| P2 | No panelist will spontaneously flag the attribution problem in the GitHub traffic reading in Q1/Q2 | **2 of 4 flagged it in Q1.** Note the test was compromised by its own design - Q3 asked about that reading directly and was visible while they answered Q1 |
| P3 | At least 1 of 4 will read "integration" as productisation or commercialisation | **0 of 4.** All four held the stated constraint - amateur hours, reputation not revenue |
| P4 | The common answer on the failure mode will be "readers face four repos, cognitive load is high" | **0 of 4 said that** (Grok rejected it outright: most people never see four repos). **3 of 4 independently produced the sharper failure mode** the chair had privately marked as the one that would cost a point |

**The chair also lost on substance.** Both supporting arguments for the position were overturned
(see the correction above and Gap #18 in `GOVERNANCE.md`), and on the ranking question the chair
was the only participant whose pair nobody shared: chair kept `prophetmap` + `agent-tool-interop`;
all four panelists ranked `assay` first, and `agent-tool-interop` last or second-to-last.
The diagnosis is in the transcripts: the chair ranked by **investment already made**, the panel
ranked by **whether the finding can be restated by a stranger in one sentence.**

**The verdict survived. The argument did not.** That asymmetry is the reason the transcripts are
archived rather than summarised.

---

## Council B scoring — 2026-09-09

`2026-09-09-B/chair-preregistration.txt` was written **before the package was sent** and archived
byte-verified. Unlike the first council that day, this one carried a deliberate design change: the
chair’s four predictions in council A had all been of the form *"the panel will fail to notice X"*
and all four were wrong. So three of the six predictions here were deliberately set as *"the panel
**will** do X"*.

| # | Prediction (written before sending) | Outcome |
|---|---|---|
| P1 | ≥2 of 4 will give criterion 1 a specific name (paltering, or atomic claim decomposition) | **4 of 4** — all landed on FActScore / FEVER. Grok additionally **rejected** the chair’s own first guess: paltering is speaker-side, this criterion is reader-side |
| P2 | 4 of 4 will call criterion 3 commonplace **with a specific citation**, not a vague category | **4 of 4** — Marshall 1890 total-revenue test, price-volume-mix, SNA 2008 ch.15 |
| P3 | ≥1 of 4 will cite Teece 1986 / the value-capture branch | **4 of 4** |
| P4 | **No** panelist will identify the disjunctive-conclusion defect in criterion 5 | **Fable did** — named it *"二择一结论"* and recommended cutting it |
| P5 | Q3 answers will be dispersed — no criterion drawing ≥3 of 4 | **3 of 4 chose criterion 3** |
| P6 | ≥1 of 4 will note the five criteria share one underlying structure | **0 of 4** — but two independently found something sharper (below) |

**3 of 6. Across both councils, every prediction of the form "the panel will not do X" failed
(0 of 6 survived); every prediction of the form "the panel will do X" held (3 of 3).** The chair’s
pessimistic behavioural predictions carry no information and should stop being made.

### The finding the chair did not predict

Grok and Fable **independently** observed that **criteria 4 and 5 contradict each other on the
asker’s own worked example.** Criterion 4 instructs him to hunt for an irreplaceable upstream
single point holding **>95% share** (Ajinomoto Fine-Techno, ABF film). Criterion 5 says a single
company’s capacity divided by the claimed global TAM approaching **1** signals a fake TAM.
Ajinomoto satisfies both and receives opposite verdicts — written the same day, in the same
session, by the same person, and not noticed.

Fable filed this as evidence for the premise stated in the question package itself: *domain
independence is not observer independence.* The package handed the panel that sentence as
background; the panel used it on the asker.

### Substance: both of the chair’s positions were overturned

- **Nominated strongest — criterion 4 — was the most damaged.** Its only operational discriminator
  (*"did the prepaying party also fund the capex?"*) was falsified by 3 of 4 with the same case:
  **ASML’s 2012 Customer Co-Investment Program** — Intel, TSMC and Samsung put in €1.38B of R&D
  funding plus €3.85B of equity, exactly the criterion’s trigger, and ASML went on to hold the
  strongest pricing power in the chain. The missing variable, named by Fable: **replaceability.**
  Customer capex can mean the supplier is irreplaceable — the signal runs both ways. DeepSeek
  separately broke the other half: rent accrues to the owner of the **scarce asset**, and a scarce
  asset need not be capacity at all (mineral rights, patents, licences, spectrum).
- **Nominated weakest — criterion 5 — drew only 1 of 4.** Three chose criterion 3, and for a
  stronger reason than the chair had: not that it is commonplace, but that its **non-commonplace**
  part (forcing a ticker into "lives on volume" or "lives on price") **outputs the wrong sign** —
  operating leverage, mix-versus-price, and profit attribution each break the binary.

### Convergence

Four panelists, four independent searches, landing on the same counterexamples: **ASML 2012 three
times, Tesla’s 2014 Gigafactory announcement twice, "the sole supplier *is* the market" four times,
the 4-versus-5 contradiction twice.** Council A’s central criticism was that four self-built cases
observed by one person do not constitute convergent validity. This time they were four observers.

### One more, on the chair’s own application

Fable checked the founding instance of criterion 1 and found the chair had **not decomposed his own
sentence completely**: the clauses *"in July"* and *"Jensen Huang publicly confirmed"* never entered
his table. Verified afterwards by the chair: the fanless / 100%-liquid-cooling claim traces to the
**CES keynote of 6 January 2026**, not July. The criterion therefore needs a spec for what counts
as a clause — time, attribution, scope quantifiers, and superlatives all do.
*(Coverage denominator: one source. "Announced in January" is verified; "not repeated in July" is not.)*

## 2026-10-03 — eval-awareness instance, blind classification (`2026-10-03-eval-awareness/`)

One target instance (B: the emotions paper ran its blackmail experiment on an earlier snapshot because the released one is "too evaluation-aware to ever blackmail"), with a decoy (A: clean held-out benchmark) and a positive control (C: the negotiation-game probe field from the family table). Members: grok, dsh, Fable 5.1, agy. Package held only family definition sentences, not the table's examples.

**Scoring against the sealed pre-registration:** decoy A → 0 by 4/4 (predicted ≥3); control C → family 6 by 4/4 (predicted ≥3); target B → sub-form 6s by 4/4 (predicted), but only 2/4 say the definition applies *literally*. The clause "adapts to any probe design; samples do not converge" is not evidenced by B (grok and Fable flagged this). No member says B forces a new family; 4/4.

**What the chair missed:** 4/4, answering the falsification question, separated a layer the chair had folded into family 6. The published numbers come from a *different object*, chosen because it still misbehaves. That layer is family 4 (availability: the snapshot that has data is the one that blackmails; Fable, grok, agy as alternative) and, in the news write-up, family 2 (one name, two objects; dsh, agy, grok). Fable and agy independently put the headline "the released version rarely does this" under **family 1**: "unmeasurable" was reported as a low rate. Fable also pried a premise the package did not ask about: "evaluation-awareness" is the authors' attribution, and if the released model still blackmails ~0% in deployment-indistinguishable scenarios, the honest reading is 0 (it is simply better aligned).

**Round two skipped:** the 2-vs-4 split on layer (b) resolves on reading. In the paper the substitution is disclosed, so family 4 applies; under one name in the news, family 2 applies.


## 2026-11-28 — failure families, nine instances classified one by one (`2026-11-28-failure-families-3/`)

Nine instances, shuffled and unlabelled: one **positive control** (family 2's founding form — the two
USDT vendor scores, 69 under `authority_control` and 1 under `tradability`), five instances the chair
had already filed as new family-2 cases, two the chair had filed as **near-miss negatives** (instances
family 2 must reject), and one whose source text carries the derived unit as its own label. Members:
agy (Gemini 4 Argon High), Fable 5.2, dsh. The package held the eight main definition sentences, the
two registered questions under family 2 and the one registered precondition under family 8 — no
examples from the table, and no statement of the chair's position.

**Independence, declared before dispatch and not after.** Seven of the nine instances were already
written up in the chair's private notes, which three of the four members can read. So the round was
registered as **non-independent for Fable and dsh** and independent only for agy, whose headless mode
refuses every tool — the one structural blind channel. The contamination grep (`.md|SEALED|prereg|
failure-families|CLAUDE|framework_`) returned 0 for all three voters.

**grok produced no vote, and the way it did is the most useful single result.** It timed out at 900s
having written 296 bytes, all of it an announcement that it was going to read the authority: *"I will
first find the boundaries of these eight families and the existing rulings in the authoritative
source"* and *"the same-day family-table discussion archive already has boundary rulings. I will read
the authoritative source and the registered rulings first."* The same-day archive is exactly the
chair's notes written that morning. This is the second measured confirmation that assuming an agent
reads only its working directory is the wrong prior — and it arrived in the same sentence in which the
agent declined to answer from the package alone. It also settles, after the fact, that declaring
non-independence in advance was right: scored as a 4/4 blind round, everything below would be void.

**Scoring against the sealed pre-registration.** Positive control → family 2 by 3/3 (so the
disagreements below are not noise). Substantive positions: 7 written, 3.5 survived. Behavioural
predictions: 6 written, 3 survived. Verdict-type predictions: 0 written, per the standing ban.
Weak links: 4 claimed, 3 verified by the chair against the primary source.

**What the chair had backwards.** (a) The instance where *one number carries two constructs* — the
same figure, 133 billion, used in adjacent paragraphs for 2025 total equipment sales and for 2026
300mm equipment spending — had been filed as "family 2's most hidden entrance". All three ruled it
**out of table**, on the same reading: the main definition says *two numbers share a label*, and this
is *two labels sharing a number*, which the sentence excludes on its face. The finding is therefore
not a hidden entrance but a **mirror gap** in the table. (b) A second instance had been filed as
family 2 and is **family 8** by 3/3; Fable and dsh independently noted that family 8's precondition
*passes* here, because the conversion needs only `100% − x` and that quantity is in the record — which
is family 8's own `converting changes the conclusion`. (c) **Both near-miss negatives were classified
into family 2** (3/3 and 2/3), and the two reasons the chair had used to keep them out — "the source
itself inserts an explicit separating clause" and "the gap between the two definitions is fully
explained by an independent known mechanism" — are **not registered questions for family 2**. Using an
unregistered criterion to push an instance out of a family is the mirror image of the completeness
rule, which forbids "the main definition catches it and every question passes it".

**What they pried that the package never asked.** All three independently demanded the *vintage* of
the forecast: which publication date, which revision. Two forecasts from the **same institution** under
the **same label** at **different release dates** are not a `vendor pair`, and no family in the table
holds them; the three retreated to out-of-table, undecidable and a reluctant family 3 respectively.
This is the round's highest-information output and appears nowhere in the chair's sealed positions.

**One chair reading moved a verdict.** All three said they could not decide that instance without
knowing which calendar year "this year" meant. The article's own opening sentence names it — *"SEMICON
West returned to San Francisco in 2026"* — and the sentence carrying the figure adds *"in 2026 alone"*.
With the year fixed, agy's "transcription year mismatch" reading is refuted, Fable's conditional branch
collapses, and dsh's family 3 survives only as a same-year revision difference. The missing quantity was
an artifact of the chair's own excerpting: the sentence that dates the article had been cut out of the
package. *(Coverage denominator: one of four source clippings re-read in full for this check.)*

**Behavioural predictions: the two that failed share a defect.** Both were conditioned on a
classification outcome — "at least one member will cite the separating clause" requires first ruling the
instance out, and "at least one will file it under family 8" is a verdict. The three that survived are
unconditional: whether a field gets filled, whether a string appears in the output, whether anyone
questions a quotation. A behavioural prediction whose truth depends on a verdict inherits the verdict's
unpredictability; the existing ban covers only the explicit form.

**Round two skipped.** The two live splits both reduce on reading rather than on debate: one needs the
original market definition, which is not in the clipping, and the other's dissenting reason is flagged
as second-order risk by the dissenter itself.

**Nothing in the family table changed.** `docs/failure-families.md` was not modified in this round.
