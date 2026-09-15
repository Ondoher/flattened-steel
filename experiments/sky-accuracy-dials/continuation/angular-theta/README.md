# Atmospheric polar-coordinate attribution

The [registered plan](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/angular-theta-plan.md)
owns this isolated `angular-theta-attribution-v1` package. It compares theta
integration against the retained mu control at the original morning h1000 point,
with channels 0 and 8 and unchanged incident physics.

```text
node experiments/sky-accuracy-dials/continuation/angular-theta/run.mjs pilot <C0>
node experiments/sky-accuracy-dials/continuation/angular-theta/run.mjs fine <C0> <pilotRun>
node experiments/sky-accuracy-dials/continuation/angular-theta/run.mjs assess <C0> <pilotRun>
```

`prepareAngularTheta(stage,C0,pilotRun?)` authenticates inputs, source identities,
the original Node executable and current allocation seal without allocating a
run or starting workers. `runAngularTheta` executes exactly one stage. Fine
requires an accepted complete pilot; assessment can retain an unresolved outcome
after a failed pilot or missing fine stage. Every stage is single-use, including
failed attempts, and any assessment terminal closes the package.

The package cap is 8 MiB and twenty CPU-job minutes, including failed records.
Pilot and assessment are capped at 2 MiB and five minutes; fine is capped at
3 MiB and the remaining package time. Each numerical stage preserves 2 MiB
and five minutes for assessment. Fine forecasts double the pilot's compressed
bytes per solve and its aggregate incident milliseconds per solve, divide the
latter across four workers, and add ninety seconds for startup/finalization.
Every job reserves thirty seconds for finalization. Existing disk-floor,
campaign and byte guards remain active.

Completed 256-node batches are compressed and retained before another batch
starts. Finalization flushes available completed nodes after interruption;
unavailable in-flight work remains explicitly marked. Up to eight original
unresolved incident witnesses are retained. `sky-angular-theta-stage-v1`
documents use the unchanged work and batch contracts, and `matrixComplete`
means physical incident and mirror admission. It does not qualify angular
accuracy.

`readAngularThetaRuns` authenticates all package records, including failed
records without a reference document. `readAngularThetaNodes` checks ordered
batch identities and replays exact work counters. `thetaAdmittedDocument`
excludes failed and incomplete stage values from the pure assessment while
their seals and costs remain in its derivation. Inputs/proofs retain the
authenticated 00219 analytic replay supplied by the reader.

Source reconstruction uses the immutable 00210 archive plus complete current
deltas. All source/control identities and the Node executable are rechecked at
finalization. Reuse also checks the exact numerical collaborators consumed by
earlier theta stages.

`thetaRunnerProof()` checks accounting, measured forecasts, single-use closure,
and rejected incomplete or failed assessment inputs without workers or evidence.
Run the geometry and assessment proofs and the full experiment type check before
execution. Formal review remains deferred under the owner's direction. This
package addresses one atmospheric error mechanism; it makes no whole-view,
higher-order or Kider qualification.
