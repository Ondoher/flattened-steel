# H61 Execution

Status: complete; production unchanged. Accepted N1 screen00391 selects k=.35;
identity00392, recurrence00394 and full40-band00395 qualify. Reports00393/00396
retain progress;00397 owns the final B1 scores and inspected images. Final
verifier00398 passes. No numerical job remains active. Baseline05185b92.
The [results](outgoing-focus-results.md) own findings and links; the
[plan](outgoing-focus-plan.md) owns registration.

## Decisions

1. Warp a reconstruction domain, not an integration rule: no outgoing Jacobian
   factors; F68 weights and directions remain fixed.
2. In the receiver-local cache, the Sun direction changes by solar row. Apply
   forward and inverse maps using that row, including final cubic solar taps.
3. Read actual live J and Float32 cumulative J fields through a GPU query pass,
   then retain the existing CPU cubic/altitude/Q30 equation. Avoid changing the
   original final-view equation or retaining full textures on disk.
4. Bound the screen to three registered wavelengths and three warp strengths;
   only one candidate proceeds, and only after the N1 gate passes.

5. Initial source checking exposed a tuple-contract mismatch in proof-only
   vectors; construct an explicit three-component tuple. The B1 figure API uses
   the existing typed dynamic-import boundary to avoid checking unrelated legacy
   script internals. Browser closure validation rejected host-only assert code
   before allocation; split pure numerical geometry from host verification.
   No numerical result was produced by those failed startup checks.

6. The registered N1 gate selects k=.35: mean residual1.67066 to0.23514mW
   (-85.93%) at three wavelengths, with all three witnesses improved. k=.75
   gives0.57301; k=.5 gives0.60892. Mean improvement is not assumed monotonic.
7. The full-boundary identity query pass replays all four original cumulative
   stages within1.83e-7 relative, well below5e-6. Keep GPU Float32 angular
   reconstruction rounding distinct from the candidate's geometric changes.

8. The three-band N4 screen improves all witnesses against matched independent
   N1-4:3.57822 to2.17112,2.62518 to2.07847,2.02356 to0.63817mW. Expand
   the selected candidate to all40 wavelengths/all1377 B1 rays as authorized;
   this checks the actual recurrence rather than a frozen later-order increment.
9. Keep source snapshots fixed throughout00395. Existing full-sky comparison
   routines and all planned figures/proofs were authored and type-checked before
   the full build began. New reports consume immutable numerical outputs only.

10. The full B1 aggregate passes despite coarser background:0.639% better than
    Corrected60 and0.249% better than Original40. Retain all17 interval results,
    including three small regressions; do not claim improvement at every time.
11. A new unreferenced node-diagram helper was authored during the full build.
    It could not alter the in-flight bundle; final report imports it only after
    the numerical run sealed. The diagram deduplicates seams for display.
12. Qualification uses temporary cumulative GPU textures to preserve actual
    Float32 grouping. Report their306.3MiB separately from unchanged node count
    and compiler field storage; do not assign that observer overhead to production.
13. Scientific completion is the registered N1/recurrence/B1 test. Keep runtime
    promotion, twilight, local-source adaptation and further warp optimization
    explicitly unselected; preserve prior evidence and the still-open experiment.


14. The staged diff check found an extra final blank line and a whitespace-only
    line in new source. Cleaned those formatting issues, repeated local types
    and staged validation; no numerical equation or evidence changed.

## Verification

Local source type checks, self-review, immutable post-run proof00398 and image
inspection pass. Geometry unit/inverse errors are1.45e-15/2.00e-15; positive tap
mass differs from one by at most2.23e-16. Identity full-boundary replay is1.83e-7.
All numerical/report runs391-398 are accepted with no source or heartbeat failure;
owned browser profiles and scratch are cleaned. Dedicated reviewers/audits remain
disabled. Checkpoint advice is separate; no production compliance claim.

Full B1 scores:Original40 11.6229140283,Corrected60 11.6684823920,Sun-focused
11.5939588570mW.14/17 intervals improve versus Corrected60; original-baseline gate
passes. Full37-new-channel build wall314.9s, median5.97s/range4.43-26.92s; three
screen packets reused exactly. Final retained649.65MiB/scratch0, within bounds.

## Reproduction

```text
node experiments/sky-accuracy-dials/outgoing-focus/run.mjs n1
node experiments/sky-accuracy-dials/outgoing-focus/run.mjs orders 1
node experiments/sky-accuracy-dials/outgoing-focus/run.mjs orders 0.35
node experiments/sky-accuracy-dials/outgoing-focus/run.mjs orders 0.35 --full --reuse <00394-root>
node experiments/sky-accuracy-dials/outgoing-focus/report.mjs <00391-root> <00392-root> <00394-root> <00395-root>
node experiments/sky-accuracy-dials/outgoing-focus/verify.mjs <00391-root> <00392-root> <00393-root> <00394-root> <00395-root> <00396-root> <00397-root>
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```

Every execution allocates a new run. Saved runs remain immutable. Local checkpoint
message is preapproved by independent-execution; no push or promotion is selected.
