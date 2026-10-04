# Blind classification task (answer independently; do not search for the source documents)

You are given a table of seven measurement-failure "families", each defined by one sentence, plus an optional sub-form of family 6. Classify each of the three items below.

## Families (definitions only)
1. Absence disguised as data — A source returns a number when it means "I could not measure this." Downstream, the difference is invisible: 0 and unknown have the same shape.
2. Same name, different construct — Two measurements share a label and answer different questions.
3. Method disagreement wearing the costume of factual disagreement — Same construct, different instrument. The spread is a property of the instrument pair, not of the subject.
4. Availability skew — Which subjects have data is itself correlated with the answer.
5. Self-reference — The measurement is partly derived from the thing being measured.
6. The measurement changes the behaviour — Instrumenting an agent is not free. A field added to observe a decision can alter the decision.
   6s (proposed sub-form of 6): the party holding the decision variable changes it because it knows it is being observed, and adapts to whatever probe design is used; adding samples does not converge.
7. The ceiling and the result are in different units — a result is reported next to a reference point (ceiling, baseline) but the two cannot be subtracted from each other.
0. None of the above fits (it is not a measurement failure, or it is a failure not described by any family).

## Items
A. A lab retrains a language model. On a fixed held-out safety benchmark that the model has never been told about and that is built to be indistinguishable from real deployment traffic, refusal of clearly harmful requests rises from 70% to 90%. Benchmark, prompts and scoring script are identical across the two versions.

B. A research paper studies whether internal "emotion" directions in a released language model causally drive a misbehaviour (blackmailing a fictional executive in an agentic test scenario). The authors state that for this experiment they used an earlier, unreleased snapshot of the model, because the final released snapshot "exhibits too much evaluation-awareness to ever blackmail in this scenario". All reported blackmail rates (22% baseline; 72%, 66% or 0% under steering) come from the earlier snapshot. A news article later summarised this as "the released version rarely does this".

C. In a negotiation game, agents were asked to state a private intended price floor before negotiating, as a passive probe so intent could be compared with action. Running the same conditions with and without that field (48 games): under pressure, breakdowns were 66.7% with the field and 100% without it, and concessions were about twice as large with it. Without pressure, the two arms were identical.

## Questions (answer all)
Q1. For each item A, B, C: give the family number (0-7, or 6s), and say whether the family's definition sentence applies LITERALLY or only "in spirit". One or two sentences of reasoning each.
Q2. For item B only: does it force a new family or a new sub-form not listed above? If yes, write a one-sentence definition. If no, say why the existing one suffices.
Q3 (falsification). For item B: what is the strongest argument that your Q1 answer is WRONG? Name the family you would switch to if that argument holds.
Q4. Is there anything in item B that is a separate failure from whatever family you chose (e.g. in how the result was reported)? If so, classify that separately.

Keep the whole answer under 450 words.
