# Sky Accuracy Dials: Agent Handoff

**Paused at the owner's request after the final test.** No experiment process
is running, and no follow-on test has been started. Findings, status and the
active-topic entry are updated. Do not resume automatically; wait for the
owner to ask to continue.

## Read First

The [findings brief](accuracy-findings-brief.md) is the concise practical result.
The [status](status.md) owns current execution, costs and verification gates.
The [control map](accuracy-controls.md) covers the full set of controls; the
[detailed findings](attribution-results.md) own quantitative claims and evidence.
Read the [adaptive plan](attribution-plan.md) before any subsequently authorized
execution. Do not reread the entire historical experiment just to answer status.

## Conclusions To Preserve

- Corrected first-order representation restores a predictable source-count
  response on the selected probes. The held S320 prediction is the strongest
  current accuracy-dial result; its complete-view and wider-domain limits remain.
- The angular coordinate correction removes an identified error in an
  experimental Sun-aligned rule. Its approximately 99% central improvement is
  not a measured improvement over the production baseline. Atmospheric channel
  0 passes; channel 8 remains unqualified under its frozen reference criterion.
- The existing first-radiance generation pass evaluates direct scattering at
  each query. Cached final-view J1 reconstruction does not feed that pass.
  Therefore correcting that reconstruction alone leaves higher orders unchanged.
  Source-integration counts and higher-order transport changes are different
  interventions that do require descendant regeneration.
- Numerical biases and measurement residuals can compensate. Kider fit does
  not establish scientific correctness, and a worsening Kider score does not
  invalidate an independently demonstrated component correction.

## Resume Boundary

The single [registered regional test](angular-theta-regions-plan.md) is closed
with accepted run **00223-at-regions**. Both concentration predictions, all
89 implementation checks, 50 manufactured checks and the full POC type check
pass. The remaining channel-8 atmospheric refinement response concentrates
near the horizon. This does not establish absolute angular error or change
00222's reference admission. The accepted seal SHA-256 is
`be5fb27da63f11f784da051d9981efbe9c74b55d4b6d42b709b65338cda4534e`.
Its source is `experiments/sky-accuracy-dials/continuation/angular-theta-regions/`;
the run CLI rejects another attempt in this closed package. No follow-on test
is admitted by completing it.

The recommended next substantial milestone, after the owner resumes, is to
extend corrected cached first-order reconstruction to complete morning/noon
viewing rays at fixed source count and fixed higher fields. Register the scope,
prediction, reference criteria and resource admission before execution. Do not
automatically spend the last GPU attempt or start another angular count ladder.

## Operational Constraints

- Production source is read-only; experiment documentation may be updated in
  its owning locations. Preserve historical runs and consumed plans unchanged.
- Tracked implementation belongs under `experiments/sky-accuracy-dials/`;
  output belongs under `tmp/experiments/sky-accuracy-dials/`. Do not delete
  retained evidence. No future owner cleanup is counted as available capacity.
- Formal reviews and checkpoint monitoring are suspended at the owner's
  direction to conserve credits. Local proofs and the full POC type check are
  required for changed code, but do not close the deferred review gate.
- The deferred source baseline remains the earlier manual checkpoint
  `871690d334b4339f7aaee516dcc140dd00a3edaf`, message
  `Checkpoint strobing improvements and sky accuracy experiments`.
  The new paused-state checkpoint is identified in Git history by
  `Checkpoint sky accuracy attribution and paused handoff`. It does not
  replace the baseline for the outstanding source review.
- Use `C:/Users/gande/AppData/Roaming/nvm/v25.4.0/node.exe`. Run stages serially.
  Source snapshots cover the whole experiment: freeze its source and consumed
  plan during evidence execution, and authenticate identities at finalization.
- Consult the current resource ledger before admission. The cap remains 512 MiB
  total evidence, 256 MiB continuation evidence, C5 124 MiB, eight CPU-job hours,
  36 GPU attempts and a 40 GiB free-space floor. Through 00223, 35 GPU attempts
  are consumed. The status contains exact retained-byte and CPU totals.

The broader scientific objective is incomplete. The planned break is owner
directed, not a claim that every control or complete solver has qualified.
