# Sky Accuracy Dials: Agent Handoff

The owner resumed this experiment for [gray horizon diagnosis](horizon-diagnosis-plan.md).
Start there and with the [experiment lifecycle](status.md#experiment-lifecycle).
The scientific context below remains background for evidence reuse.

**Latest completed package: [00235 aerosol sensitivity](aerosol-sensitivity-results.md).**
The fixed direct-solver phase/albedo factorial uses one same-day Toronto
retrieval retained in 00234. Follow the owner's latest restriction: interpret
only 454-712.5 nm, interpolated inside measured aerosol bands. Exclude 360 nm
because it extends the 440 nm endpoint; preserve its historical result and
the original full benchmark. The [supported-wavelength analysis](aerosol-sensitivity-results.md#supported-wavelength-interpretation)
owns the six-ray table and geometry/order breakdown. Phase and albedo each
improve both controls separately; together they overshoot. All three rays
40-56 degrees from the Sun improve under the joint change, while controls
near 78-83 degrees and the morning low ray near 123 degrees worsen. Angle,
time and illumination geometry remain confounded. All numerical targets pass.
Inputs are regional Level 1.5. Do not claim local aerosol identification,
isolated benefit from spectral flexibility, full benchmark gain or production
qualification. The plan is consumed; no run remains active.

**Numerical versus physical correction:** the direct reference avoids the
identified cache/reconstruction errors and includes all scattering orders in
expectation. It does not mean every production repair has been implemented
or every possible solver error excluded. Production is unchanged. Applying
the same identified corrections again cannot explain the remaining direct
residuals. The owner's suggestion that changed physical inputs expose other
cancellations remains plausible, but those other causes are unassigned.
Read [the interpretation boundary](aerosol-sensitivity-results.md#numerical-and-physical-cancellation).

**Next decision is open:** distinguish overall phase directionality/albedo
level from extra angular/spectral shape and explain the control overshoot.
A crossed old/corrected-numerics by old/new-aerosols comparison was discussed
but not executed or selected as a new plan. No automatic sweep, retry or
production promotion follows from these notes. Reuse evidence and favor a
bounded GPU test if the owner chooses further execution.

**Resumption entry:** [follow-up context and hypotheses](follow-up-context.md).
Read it before choosing new work. It preserves the owner's aerosol-model
hypothesis, the distinction between numerical and physical cancellation,
untested alternatives, Kider data availability limits and evidence routing.

**Saved production follow-up:** the owner requested preserving
[source-sample refinement after reconstruction corrections](accuracy-controls.md#saved-production-follow-up-source-sample-refinement)
for later production evaluation. The checkbox owns the prerequisites,
evidence limits and full-solver validation needed. No execution was requested.

## Earlier Context: Completed Packages

These summaries preserve earlier evidence. They do not replace the supported-
wavelength scope or next-decision boundary above.

**Preceding case synthesis: [specific cancellation cases](aerosol-cancellation-evaluation.md).**
The owner suspects aerosol-model weaknesses underlie the score penalties from
correct numerical repairs. Existing evidence supports a broad visible angular
hypothesis and a separate violet spectral target, without identifying their
physical cause. Source refinement after reconstruction correction is an
important score-improving exception; ground-boundary and phase/transmission
cancellation include errors demonstrated without Kider. No new simulation,
parameter change or campaign debit was made for this documentation synthesis.

**Preceding angular analysis: accepted 00233-angular-residual.** Read the
[Sun-angle results](angular-residual-results.md). The retained-data analysis
covers all 17 times/81 rays/31 scoring wavelengths; the centered, away-Sun
comparison uses 1,274 rays. Fixed cubic cosine models trained on 16 times
account for 41.1% of control and 43.6% of reference-mean centered squared
residuals on held times. Positive aggregate skill at all 17 times supports
angular structure, not unique aerosol attribution or a new benchmark score.

Visible deficits around 40-80 degrees repeat across times. The 360 nm excess
has little conditional angular predictability (6.0% control, 2.7% reference
mean). Preserve these as separate diagnostic targets. Held-time ring means
use held observations, geometry uses the original fitted Sun, and all times
come from one morning. Do not use the residual polynomial as a correction.
High-angle coverage is limited; there are no samples above 140 degrees.

The one CPU package is consumed; no execution is active. No atmospheric model
was rerun or physical parameter changed. The [status](status.md) owns resource
usage and deferred review. Reviewers remain suspended; the
[verification boundary](status.md#verification-boundary) owns checkpoint monitoring.
The [00232 results](alternate-rays-results.md)
own the original-atmosphere direct reference reused by 00235 and retain the adoption hold.
The [00231 report](reference-comparison-results.md) owns full regional scores.
Neither retained production capture is a fresh current-source benchmark.

**Reference-model context:** use the owner's
[reference-model accuracy target](reference-model-target.md). A read-only
comparison of retained spectra shows that successful reference models share
much of the large five-ray Kider mismatch. Do not infer failure of our
formulation from those local residuals alone. The direct solver is worse on
the selected subset; its full matched benchmark score remains unmeasured.

**Earlier work: accepted 00230 stochastic direct reference.** Read the
[direct convergence results](direct-convergence-results.md). The owner
explicitly accepted Monte Carlo statistical uncertainty. All 36.7 million
paths in the fixed matrix completed, including coupled ground reflection
and compensated continuation beyond a fixed interaction cutoff. No physical
fields are cached. Fifteen of 20 values meet the preset precision; all solar
attenuation and termination contrasts pass. The large Kider residuals remain.
No run, retry or unused package GPU attempt remains. Formal review is deferred.

The [00229 deterministic results](direct-solver-results.md) remain unchanged,
including their third-order timeout. The stochastic path evaluator resolves
that missing-order comparison at the uncertainty reported for 00230.

**Governing mathematical target.**
The owner found the factor search insufficiently directed and requested an
idealized continuous algorithm. Read [the formulation](idealized-model.md).
It defines a proposed target under the current physical assumptions, including
the coupled ground boundary, and distinguishes it from the observation model.
Do not resume registration or other runs merely from their earlier priority.

The owner next requested a few rays expressing the Kider mismatch. The
[selected five rays](diagnostic-rays.md) now provide exact retained selectors
and four-channel residuals. Begin inspection with the noon B/C contrast pair;
this is a descriptive selection, not authority for a new experiment.

**The solar-registration package is complete through accepted 00228.** Read
its [results](solar-registration-results.md), the
[findings brief](accuracy-findings-brief.md) and [status](status.md).
The preceding remaining-factors package remains closed through 00227.
No scientific run or automatic retry remains active.

The owner's [current decision](status.md#owner-decision-preserve-conclusions-defer-adoption)
preserves the accuracy conclusions below while deferring their adoption until
the Kider mismatch is reconciled. Carry this decision into future work.

The [factor-isolation framework](kider-factor-isolation.md) separates established
numerical effects from remaining geometry, instrument and physical-input
hypotheses. It identifies independent evidence and withheld comparisons needed
for attribution; it is not an executed sensitivity matrix or a new allocation.

## Conclusions To Preserve

- Registration is an estimator limitation as well as a possible physical
  alignment issue: known sharp synthetic skies produce up to 8.6-degree fit
  bias; measured native sky regions disagree near noon. Tested quadrature
  refinement changes original fits by at most 0.2 degrees. Clock-only fitting
  does not improve withheld-time agreement over constant azimuth zero. Do not
  apply fitted offsets; independent capture geometry remains necessary.
- Keep the joint density, phase and sunlight-column corrections. The accepted
  [first GPU pass](targeted-improvements-results.md) greatly reduced known P1
  error while exposing a worse aggregate Kider proxy. Do not restore that bias.
- Accepted 00225 holds corrected P1 fixed and substitutes each retained
  candidate's own higher contribution. Density/altitude controls reduce all
  four known P2 errors but worsen the aggregate proxy. T320 improves it by only
  0.0017 mW. The conditional cache factorial was skipped by its frozen gate.
- H orders five and six increase radiance and worsen every selected time group.
  Independent morning P1+P2 already exceeds the measurements; noon has a large
  deficit. A single brightness adjustment cannot correctly resolve both.
- All 160 selected raw spectral values and 40 original directions reproduce.
  The existing fitted solar azimuth differs from theoretical by 7-17.2 degrees.
  Check acquisition timing, orientation and fit provenance before assigning a
  physical cause. Neither theoretical nor fitted geometry is newly qualified.
- Pointing and cone effects remain unmeasured. 00226 was interrupted without
  output; 00227 timed out during direct DevTools evaluation. No successful
  observation matrix, parity check or score gain exists. The 42 manufactured
  checks and successful type check do not substitute for it.

## Evidence And Source

The [solar-registration plan](solar-registration-plan.md) is consumed. Source
is experiments/sky-accuracy-dials/continuation/solar-registration/. Accepted
00228 retains 612 subset fits, 102 spectral transfers and exact replay of all
17 original azimuths, with 247 manufactured checks. Its complete source derives
from the immutable 00226 snapshot plus the 00228 delta; retain both. There was
no new atmospheric integration or GPU attempt. The single analysis is finished.

The [remaining-factors plan](remaining-factors-plan.md),
[observation plan](remaining-observation-plan.md) and
[one-retry plan](remaining-observation-retry.md) are consumed. Preserve them.
Source is experiments/sky-accuracy-dials/continuation/remaining-factors/.
The result report links exact immutable seals for 00225-00227.

00226 required narrow interruption finalization because closing its owned
browser did not settle the runner. Its original definition/artifact bytes,
recovery source and interruption account remain preserved. No scientific
result depends on its failed execution. Its conservative elapsed charge and
recovery-time scratch measurement are explicitly distinguished from exact
original timing and peak measurements.

00227 reuses 00226's full source snapshot plus an exact changed-source delta.
Do not treat the delta as a standalone snapshot. The transient sample texture
is 85,524,480 bytes and is recorded by digest and reproducible geometry recipe.
The timeout cause remains unconfirmed. Before any future scientific attempt,
prove a small non-radiance browser transfer, preserve one DevTools session for
session-owned object handles, and avoid a single oversized geometry message.
These are implementation follow-ups, not authorization for another GPU run.

## Operational Boundary

- No third observation attempt under the closed remaining-factors package.
  The three-hour execution window opened at 16:39 UTC on 2026-09-15; its GPU
  execution stopped around 17:27 UTC. The subsequent registration analysis
  finished at 17:55:48 UTC, before the same 19:39 UTC deadline. No run is active.
- The status document owns exact remaining bytes, elapsed charges and attempts.
  Both failed browser scratch trees are absent. Prior evidence is immutable.
- Runtime work is loop-free inside each sample and its helpers. Multiple outer
  viewing-ray samples are allowed. Source integration is precomputed.
- Production and other experiments remain read-only. Source/output writes stay
  inside this experiment's declared roots; owning topic documentation is allowed.
- Standards review follows the enabled repository lifecycle and folder mappings.
  Checkpoint advice retains preapproved advised commits/messages and a one-minute
  limit; the [verification boundary](status.md#verification-boundary) owns its state.
- The type check passes; formal source review and full-solver qualification
  remain open. Preserve the deferred baseline and initial dirty-state record
  documented in status.md. Local checks are not a CLEAN standards review.
