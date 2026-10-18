# H68 independent-execution summary

The owner requested the Sun-focused incoming-grid test using the global
independent-execution skill. The [plan](incoming-sun-plan.md) owns scope and
[results](incoming-sun-results.md) own scientific facts and image links.

Completed: nine rule/count configurations across four H67 sunset points and
three wavelengths,108 GPU cases, explicit Jacobian/MIS weights, raw and normalized
J2 comparisons, three inspected figures, exact baseline replay and accepted00450
verification of immutable00449. No full fields or new external references.

## Questions and decisions

1. Where should temporary/generated material go? Use the experiment's declared
   `tmp/experiments/sky-accuracy-dials/` boundary, following the owner's explicit
   repository/experiment containment instruction over the skill's generic
   `.codex-tmp/` default. Source and this durable summary are intended repository
   deliverables under their established owners.
2. Which physical comparison? Reuse the exact four H67 targets, three bands and
   independent local J2 estimates; changing time, atmosphere or outgoing direction
   would confound the incoming-grid hypothesis.
3. What counts?68/256/1024 distinguish redistribution from additional evaluations.
   This is a frozen screen, not an unlimited search or an unseen validation set.
4. What focus parameters? Fix k=.35, hybrid50:50 and Cauchy radial-cosine width0.1
   before execution. These are reasonable prototype choices, not fitted optima.
5. How to weight the nodes? Use analytic solid-angle map Jacobians and balance
   mixture density. Retain constant and first-moment residuals; do not force them
   to pass through a hidden weight rescale.
6. Which aerosol operator? Compare existing normalized Mie J2 as primary and raw
   quadrature as secondary. Neither normalization nor its removal is silently
   adopted as a production correction.
7. How to limit GPU work and preserve evidence? Reuse the qualified continuous L1
   evaluator, use at most256 directions per draw, stream compact incident values
   and retain every case. Keep one GPU job active and reuse parent means rather
   than rerun Monte Carlo/libRadtran.
8. What if path convergence fails? Pair64/128 and add256 only above1% J2 change.
   All cases remain below0.01505%, so the registered extra work is unnecessary.
9. How to repair the signed-zero verifier rejection? Preserve finalized00449;
   compare regenerated geometry in its exact JSON representation, where-0 and0
   serialize identically. No numerical tolerance is relaxed and no numerical
   work repeated. Record the complete new read-only verification in00450.
10. Does a small local mean error select a production grid? No. Report every
    case, worst error and manufactured controls. Sun256 is a useful intermediate
    candidate; fine Sun/hybrid1024 trade mean against worst error. Do not select
    a global winner or claim a full-cache/paper result.
11. Does this require another disk amendment or experiment reviewers? No. All
    evidence fits the existing736MiB allowance. Follow the owner-directed
    no-review experiment policy; local types/scientific proofs remain required.
12. What to do with the related dirty tree? Ask the existing checkpoint adviser
    about the coherent H62-H68 experimental unit. The invoked independent-execution
    skill preapproves its suggested local commit message and local checkpoint;
    no push or publication is authorized. Git history and the final handoff own
    the resulting commit identity.

## Verification and measurements

Local experiment type checking, exact retained-input checks, map proofs,
108-case reduction replay, unique case/grid inventory, three visual inspections,
document links and whitespace checks pass. The scientific screen needs no unit
test tree or dedicated standards review. The checkpoint adviser judges semantic
checkpoint coherence only, not scientific correctness or standards compliance.

The numerical/report execution took185.611seconds before sealing. Summed measured
case work was42.072seconds and97056 directions including view controls. These
measurements include setup/readback and do not measure a complete cache build.
Source authoring, analysis, verification and Git work are separate from that
numerical execution time. No model-credit or pure-reasoning time is inferred.

Final evidence totals and scientific limits are owned by the results document.
Production is unchanged and no job is active. Full recurrence, paper RMSE,
noon/twilight qualification and product integration are explicitly deferred;
the local test itself has no remaining scientific blocker. Resume only against
an owner-selected follow-on; do not automatically launch those larger campaigns.

## Local checkpoint

The checkpoint adviser identifies the complete related H62-H68 dirty tree as a
coherent experimental investigation. Its preauthorized message is:

```text
Diagnose Toronto dusk angular transport

- add matched scene and independent-reference evidence
- isolate J2 incoming integration and focused quadrature
- preserve qualified failures and experimental resource limits
```

Git history records the resulting local checkpoint identity; the final handoff
reports its hash and remaining worktree state. Generated numerical evidence stays
ignored under the experiment root. No push, tag, publication or production
promotion is part of this checkpoint.
