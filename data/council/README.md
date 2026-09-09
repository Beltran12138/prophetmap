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
