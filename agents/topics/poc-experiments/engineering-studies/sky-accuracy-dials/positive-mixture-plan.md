# H113-H119: follow the positive illumination-mixture lead

Status: selected local investigation completed; no both-profile qualified survivor.
The [results](positive-mixture-results.md) own conclusions and the
[execution record](positive-mixture-execution.md) owns decisions and verification.
H113-H115 local work and permitted follow-ons were executed; H116-H118 remained
conditional and untriggered. H119 accepted replay is 00618. Original gates below
remain unchanged. Production promotion remains separate; the experiment is open.

## Outcome and starting evidence

Determine whether the fixed positive midpoint is a transferable illumination
representation, understand its improvements and regressions, and establish a
practical cache-building implementation if the evidence supports one. This is
an exploratory investigation followed by conditional implementation and full-cache
qualification. A useful answer can be negative, but absence of an efficient
prototype is not proof that the representation is impractical.

The midpoint is `bMix = .5*bH100 + .5*bSector`, with universal coefficient .5,
the same 4096 illumination samples and physical support. Average actual phase
weights K before raw-numerator/denominator reduction. Do not average displayed
colors or assume averaging normalized radiance is equivalent. H100 and sector
are illumination interpolation models, not separate atmospheres or species.

Known facts, owned by the prior results and accepted 00594:

- Exact phase moments and polar knot-tangency splits qualify a small binary64
  CPU weight engine; the initial GPU quadrature remains numerically unqualified.
- Sector-only fails the near-Sun raw-Mie gain. The fixed midpoint passes both
  exposed Toronto gains after accepted 00593's numerical refinement.
- Only four decisive fields were evaluated for the midpoint. Joint protection
  remains precision-limited; broader robustness, native cost, N4 and B1 are unknown.
- Toronto sideways total error is +0.2461%, versus H100 -2.0165% and A +3.9345%.
  Paper sideways is -1.6837%, worse than A +0.1945%. These are local J2 errors,
  not full-cache RMSE. Better totals can still contain component cancellation.
- Nine phase primitives, 32 manufactured cases and 40 limiting configurations
  are reusable within their exact model/material/geometry identities.
- Eight reserved H97 physical tuples remain unexposed. The old 22 target IDs
  contain only 21 unique exposed geometries; no old field becomes fresh here.

Authenticate and reuse accepted 00583 registration, 00587 calibrated H100
weights, 00588 measured costs, 00590 sector fields/weights, 00591 mixture and
protection, 00592 manufactured proofs, 00593 refined decisions and 00594 replay.
Their parent ledgers identify illumination, physical histories and whole controls.
The [prior execution record](illumination-basis-execution.md) owns recovery and
timings. Never modify old runs; incompatibility invalidates only affected reuse.
Treat 00582 as its disclosed failed-launch receipt, not accepted numerical data.

Completion: answer the mechanism, transfer and practicality questions at the
scope actually earned; retain reviewable evidence, limitations and a resumption
point. Full success additionally requires native recurrence/protected twilight
and no-regression paper scores. Production promotion is separate.

## Sequence and early evidence

The first executable step after selection is H113 registration and a retained-data
attribution image. H114 accuracy work and H115 engineering can proceed independently
after registration. Neither requires the other to have already succeeded.

| Milestone | Outcome / dependencies | Evidence and initial elapsed estimate |
| --- | --- | --- |
| H113 | Freeze comparisons and reproduce the lead from retained data | Identity ledger and signed component image; about 20 min |
| H114 | Establish why it helps and test local transfer/protection; after H113 | Regional contribution maps, 12/36-field errors and uncertainty; about 20-60 min |
| H115 | Demonstrate or bound efficient weight generation; after H113 | GPU parity and complete error/work/storage plots; about 40-80 min for engine/assembly pilots |
| H116 | Qualify exposed robustness, then reserved cases; conditional | Both constructions/profiles, whole controls and confidence report; unknown until H114/H115 throughput |
| H117 | Establish native recurrence, actual cost and twilight protection; conditional | Pure/cumulative J2-J4, measured build and protected spectra; unknown until native pilot |
| H118 | Establish paper score and scene behavior; conditional | 17 interval scores, domes and matched scenes; unknown until admitted build timing |
| H119 | Preserve and report the executed investigation; applies throughout | Final replay, results, decisions and explicit untriggered work; about 20 min for local closure |

Initial expectation: first useful attribution within 20-40 minutes, and a local
accuracy/practicality decision in roughly 80-160 minutes including authoring and
analysis. These are estimates, not deadlines or summed GPU timings. Measure the
first block, revise estimates before expansion, and separate setup, integration,
upload, dispatch, readback, verification and elapsed time. At 60 minutes assess
progress/resources; continue while distinct useful progress warrants it.

Publish images through commentary and the execution record when useful evidence
arrives. Do not wait for milestone completion or render every run. Use shared
scales and readable case labels. Three-band error/contribution maps are numerical
diagrams, not sky colors. Actual swatches/scenes need complete 15/40-band spectra.
Each milestone ends with a concise report in the one execution record: completed
work/evidence, observations versus interpretation, uncertainty/cost/verification,
and advance/refine/reject/inconclusive disposition with its next action.

## H113: register the fixed lead and meaningful controls

1. Initialize `positive-mixture-execution.md`, authenticate parents, measure
   storage and reproduce the four existing midpoint values and gain decisions.
   Use 00593's refined bounds; the 00591 image retains older envelope labels.
2. Freeze .5 mixing, k=.5, construction 1, fixed Rayleigh, phase/SSA, source,
   transport and normalization identities. Bands 3/5/8 are 469.6667/532.3333/
   626.3333 nm. Preserve floors: paper 4.742795497816345e-14 and Toronto
   4.888931382758012e-14. Use the registered point/witness selectors.
3. Keep A original, constant-cell integrated phase, H100, sector, midpoint and
   complete Sun1024/1408/2048/4096 controls distinguishable. Choose whole
   comparators before results; never combine one control's speed with another's
   accuracy. Exact-engine parity is not physical-reference agreement.
4. Register the inherited gains, joint protection, numerical/path precision,
   exposed/fresh status and finite-history covariance. For the practical route,
   define each field error as `abs(Jcandidate-Jreference)/max(abs(Jreference),
   profileFloor)`. Use the same fields for each candidate/control: deduplicated
   geometry x registered constructions x bands, with equal field weights within
   each profile; report the per-profile mean and maximum error separately.
   Require both profiles to pass, not an average that offsets one against the
   other. Use paired reference-history resamples to form the joint maximum of
   mean/worst candidate-minus-factor*control contrasts across both profiles;
   require its one-sided upper bound <=0. Keep the exploratory Toronto gains,
   joint protection and combined accuracy/cost route as separate required decisions.
   Save exact derivative equations, artifact/tool identities and material parameters.
5. Publish the four-field signed component image with the paper tradeoff visible.

Gate: incompatible evidence holds its comparison, not independent valid work.
Reproducing the lead qualifies continued investigation, not a newly independent
confirmation or practical method. Finish the H113 report before new variants.

## H114: identify the mechanism and resolve local protection

Keep the coefficient fixed; this is not a search for the best mixture fraction.

1. Attribute the retained change exactly. For H100 weights K0, sector weights
   Ksector and deltaK=Ksector-K0,
   let S0=sum(K0*L), D0=sum(K0), deltaS=sum(deltaK*L), deltaD=sum(deltaK).
   For blend amount t=.5, the normalized Mie change is
   `beta*t*(deltaS*D0-S0*deltaD)/(D0*(D0+t*deltaD))`.
   Here beta is the frozen spectral aerosol scattering coefficient multiplying
   the phase-weighted incoming illumination. With identical support and
   partition-of-unity bases, exact integration gives deltaD=0. Test that invariant
   against the combined independent integration envelope; diagnose any larger
   difference as an integration/support defect, not a physical normalization gain.
   Retain raw species/numerator, D, normalized Mie, Rayleigh and total separately.
   Check this identity against direct blended-weight reduction.
2. Map signed donor/patch contributions by Sun separation, ground/horizontal
   support, polar ring and sector boundary. A constant-L subtraction may expose
   angular redistribution only if its nonzero deltaD term is retained exactly.
   These are algebraic attributions, not independent per-patch physical errors.
   Reference-matched component residuals distinguish correction from cancellation.
3. Extend the midpoint to the existing two witnesses x both profiles x 3 bands
   (12 fields), reusing qualified weights/L/oracles where identities match.
   Then the registered six-point panel (36 fields) if no resolved protection
   failure already rejects it. Keep k=.35 as a known-adverse sensitivity control,
   not a new parameter sweep. Do not force new illumination merely for symmetry.
4. Evaluate the original Toronto gains versus A: >=50% smaller near-Sun red
   raw-Mie defect and >=20% smaller sideways-green total-J error. Every protected
   case uses `errorCandidate-errorSun4096-max(.2*errorSun4096,.02)` in the inherited
   floor-normalized absolute-error units. Retain joint maximum as well as profile
   mean/worst; an upper confidence bound must be nonpositive for protection.
5. Use inherited 2000 paired shared-history bootstrap resamples, seed 1013904223,
   preserving bands/groups/profile histories. Retain the original one-sided
   decisions. Numerical plus path envelopes must be <=10% of the active decision
   bound distance; unresolved is not passed. Refine only an attainable uncertainty
   that could change the decision: same-model integration, signed finite-path
   contrast, or genuinely needed physical histories, identified separately.
6. Preserve 64/128 path contrasts; >1% species/raw/normalized changes trigger 256.
   Sub-percent changes still need tighter checks at close bounds. A finite-path
   difference is not a continuous-transport error certificate. New physical
   references must target local J2, not substitute libRadtran observer radiance.

Gate: a resolved protected regression rejects the fixed midpoint for qualification,
but its attributed mechanism may earn one bounded distinct follow-on under H119.
Precision-limited protection earns targeted resolution when worthwhile, not an
automatic halt. These local checks remain available without H115 cost admission.
Do not broaden an already rejected unchanged variant. Publish transfer/component
maps and the H114 report, including every paper regression.

## H115: find a practical engine without changing the physical model

The reference is the qualified CPU moment engine, not the unqualified original
GPU rule. Start with a GPU engine pilot and composable assembly optimizations,
keeping the midpoint exactly fixed; one qualified measured route is sufficient:

1. **GPU split-moment integration.** Reuse support geometry and knot topology;
   integrate zeroth/first phase moments over the actual phase-table segments and
   turning points, including polar tangencies. Stream bounded outgoing/patch
   blocks. Use stable forward-angle coordinates and qualify GPU precision against
   binary64. Test near/sideways, ground/altitude and aligned/near-aligned cases.
2. **Shared assembly and exact phase reuse.** Assemble midpoint weights directly
   from the two bases rather than retaining both dense tensors. Factor repeated
   geometry/phase moments; reuse only under exact geometry, phase-table, outgoing,
   basis/support and spectral identities. Measure whether bounded streaming,
   fused accumulation and amortized upload make the admitted CPU or GPU engine
   practical. This is an optimization of either engine, not necessarily a second
   independent integration method, physical representation or accuracy gain.
   If the GPU pilot fails, permit a diagnosed alternative engine under H119 rather
   than requiring two implementations or blindly repeating the failed quadrature.

Choose pilot sizes using the first measured block. Reuse code/math proofs rather
than restarting a generic quadrature sweep. Never silently rescale phase mass,
clip negative weights, drop polar knots or change the Toronto phase model to make
a fast route pass. Require original <=1 ppm mass defect, nonnegative finite K,
two successive TV changes <=.0005, independent same-model output envelope <=.1%
of reference/floor, and stricter H114 decision-sensitive precision when needed.
Reuse manufactured/limiting checks only where the changed engine permits it.

Measure cold/warm preparation, geometry, CPU/GPU transfer, integration, complete
R/M/D reductions, scheduling/readback, memory, retained scratch and reuse over
bands/orders. Use at least three repeat timings and outgoing blocks 1/4/16 on
representative admitted cases. Retain GPU as preferred execution; a slow CPU
calibration is neither an intrinsic cost lower bound nor a GPU build benchmark.

Freeze a whole-comparator cost model including unchanged transport and all costs
needed to apply the candidate. Preserve the original practical route: >=20%
mean/worst error gain at projected total build <=1.25x comparator, or >=25% build
reduction with mean/worst within 10%, plus joint protection. Apply H113's joint
error statistic with factor .8 for the accuracy route or 1.1 for the speed route;
register the timing statistic/variability and corresponding 1.25/.75 cost ratio
before measurements. A projection is only
provisional admission; actual native cost must later confirm it. If the source
native comparator cannot be authenticated/measured, report cost inconclusive and
resolve it with a bounded comparator pilot, not a point-kernel proxy.

Do not allocate the estimated 22.5 TiB dense all-band tensor. Row-specific support,
ground changes, order barriers and phase identities constrain reuse. Account for
retaining weights versus recomputing across global orders. A compressed or
approximate K route is a new numerical approximation: prove its actual error,
charge it, and preserve the uncompressed reference.

Gate: reject a failing implementation, not the representation. After each pilot
identify the measured bottleneck. If it suggests a distinct feasible repair,
register and run its smallest discriminating pilot under H119. Missing native
performance blocks expensive native/full-cache qualification; it does not stop
H114 or cheap retained-data accuracy transfer. Publish error/work and storage
plots, including failed GPU attempts and unmatched cross-device limitations.

## H116: exposed robustness, then genuinely fresh qualification

After H114 local gains/protection, a retained-data screen on the 21 unique exposed
geometries, both profiles and 3 bands may proceed without practical admission.
Charge missing illumination/weights and require a pilot/estimate before new broad
work. Cost-limited retained comparisons are scientific-only, not native admission.
This intentionally changes the old H109 sequencing for authenticated retained-data
science: practical admission is not required to inspect already available cases.
New broad illumination/reference generation still needs a measured pilot and
declared estimate; it is not automatically earned by those retained comparisons.
Test both physical constructions before qualification; preserve deduplication and
complete Sun controls. Do not fit .5 or select individual favorable control stats.

Fresh work requires a frozen finalist with joint exposed gains/protection and a
measured plausible H115 cost route. Freeze method, comparator, precision ceilings,
seeds and decision quantities before exposing any of the eight reserved H97 tuples.
Freeze the joint maximum protection statistic, H113's per-profile mean/worst
statistics, numerical/reference refinement ceilings and response to inconclusive
results. One finalist uses one-sided 95%; two use 97.5% each. Acquire matched
independent local J2 histories and retain covariance. Attainable precision-only
refinement may resolve an inconclusive frozen comparison, but must not change
the method, comparator or pass criteria after exposure. Every exposed reserved
tuple remains exposed, including unresolved results; method changes return to
development and cannot reuse those tuples as fresh confirmation.
Register an absolute night-signal criterion when appropriate; zero sampled light
alone is insufficient. A fresh failure rejects qualification and remains exposed.

Gate: a resolved exposed regression rejects that configuration before fresh/native
work. Joint physical accuracy and provisional cost earn H117; unresolved quantities
hold only their claims while attainable measurements are evaluated. Report exposed
science separately from prospective qualification and cost.

## H117-H118: conditional native and full-cache qualification

H117: adapt an admitted engine within this experiment, preserving physical basis/
direction identities across rows, bands, orders and ground support. Runtime stays
lookup-only; no live per-pixel phase integration or experiment runtime import.
Register pure J2/J3/J4 and cumulative N4, whole native comparator, numerical error
and physical-reference scope, actual time/memory and sunset+60-minute protection
before pilot results. Include inherited production twilight and matched corrected/
focused controls. Correct recurrence identities alone do not prove physical N4
accuracy. Measure the native pilot, update the full-build estimate, then require
joint pilot protection/recurrence and a plausible complete-build projection to
authorize one bounded full build. Record actual complete-build time/memory and
the matched comparator cost; reuse that very build for H118 spectra rather than
requiring a duplicate build merely to collect scores. A pilot alone cannot pass
the actual H115 total-cost criterion. If complete cost fails, reject practical
qualification; any cheap scoring of already produced spectra is diagnostic only.
Reject only the failed configuration; preserve supported local findings and
diagnose its cause.

H118: run the unchanged paper atmosphere/source/grass setup, 40 wavelengths,
31 scored bands, all 17 intervals x 81 dome rays. Match or improve both named
H61 Focused60 and H55 Original40 aggregate RMSE controls; publish every interval
and dome comparison. No atmosphere/exposure fitting. Render matched 15-band
paper/Toronto noon, sunset, +30/+60-minute scenes with common display settings.
Final qualification requires both measured complete-build H115 cost and paper/
protection criteria; provisional pilot timing alone never establishes that result.
Publish complete-spectrum interval results and images as available. Failure of
paper RMSE rejects full-cache qualification even if local physics improved.
No production promotion is included. Estimates for H117/H118 remain unknown
until admitted pilots provide actual build throughput and storage demand.

## H119: adaptive continuation, recovery and completion

Keep scientific promise and implementation readiness as separate decisions.
A passing local lead with an identifiable unresolved measurement or bottleneck
must receive the smallest worthwhile resolving investigation, rather than being
closed merely because full-cache admission is not yet established.

Before each evidence-driven branch, record its supporting evidence, distinct
mechanism, falsifiable prediction, exact changed variable, protected cases,
estimated work/storage and pass/fail/inconclusive consequence. Keep at most two
live alternatives. Normally one diagnosed repair per mechanism; a second needs
new evidence. Reassess two waves that only transfer error. These are progress
decisions, not owner-approval pauses or automatic review rounds.

Permitted branches include a phase-moment implementation/precision/scheduling
repair; a separately registered species-integration diagnostic when matched
component evidence identifies unchanged Rayleigh as a limit (the initial fixed-
Rayleigh midpoint remains its immutable control); geometry-driven reconstruction
addressing an attributed boundary defect;
or a bounded approximation with an independently measured error envelope. A new
representation must retain positivity, partition, physical support, numerical
parity and both-profile protection. Freeze its parameters before measuring gains.
Do not optimize mixture fractions against exposed reference outcomes, sweep grids
without a mechanism, weaken old gates or reopen protected evidence.

End the selected investigation only after executed-route verification and when
no qualified survivor or distinct worthwhile bounded lead remains, or an actual
external constraint prevents the remaining necessary work. Explain evidence and
scope for each rejection, precision limit and cost limitation. Do not claim that
an unmeasured practical route failed. Conditional work not earned is untriggered.
No obligation exists to exhaust every conceivable alternative.

Use one `positive-mixture-execution.md` for decisions/milestone reports and one
`positive-mixture-results.md` for conclusions/artifact links when execution starts.
Do not create them as fictional execution evidence now. Preserve completed work
on interruption: hashes, next smallest action, timings, exposure status, unresolved
checks and failures. Diagnose/retry only affected work in new immutable runs.

Keep authored source below `experiments/sky-accuracy-dials/`, generated output
below `tmp/experiments/sky-accuracy-dials/`, owning docs here. Derive canonical
roots from repository identity, reject symlinks/junctions, retain full derivation
chains and never edit source during its snapshot-bound run. Use physical Node
`C:/Users/gande/AppData/Roaming/nvm/v25.4.0/node.exe`; the default Node junction
caused the prior launch failure. Use the existing approved browser-host route
when required; preserve failures and do not widen scientific gates for host errors.

Initial retention is approximately 1145.47 MiB under 1152 MiB. Measure before
allocating; estimate another 8-24 MiB for initial compact evidence, including
immutable manifests, with broad/native storage unknown until pilots. Keep 2 MiB
seal reserve, 1 GiB live scratch allowance and 40 GiB free disk. Standing owner
authority permits justified recorded retention amendments without repeated routine
approval requests. Preserve prior evidence; clean only owned reproducible scratch
under the existing design contract. Do not impose frontend cache-size guards.

After authored code changes run local types and focused scientific proof runners;
no experimental unit-test tree or native helper binaries. Final replay authenticates
parents, derivative identities, changed-engine/model proofs, uncertainty/path
decisions, exposure status, performance claims, figures and cleanup for the actual
route. Dedicated standards reviewers/audits remain disabled. Checkpoint adviser
monitoring remains separate, with local checkpoints when execution authority permits.

## Scoped plan critique and handoff

Required once by create-plan: read-only second-agent critique of this coherent
draft and the prior result/decision summary. Trigger: draft ready. Question:
does it pursue the promising lead without confusing prototype cost, mathematical
accuracy, transfer and full-cache qualification; are gates and adaptive continuation
executable, bounded and consistent with both atmospheres? Scope: this plan,
H105-H112 results, and only relevant inherited criteria if needed. Completion:
primary incorporates suggestions unless clearly contrary to owner goals and saves
the disposition here. It gates planning handoff only, not a new execution approval.

No additional reviews are scheduled. Any newly needed discretionary review must
first specify reason, trigger, precise question, smallest affected artifacts,
completion condition and whether it gates work. Anticipated branches use H119
without restarting critique. This cannot enable disabled standards reviewers.

Critique disposition: completed one read-only second-agent pass. All six
recommendations were incorporated: explicit phase-mass conservation and beta;
executable both-profile mean/worst cost-route statistics; pilot versus measured
complete-build admission; composable assembly optimizations rather than two
mandatory engines; frozen fresh statistics/refinement/exposure handling; and
the explicit sequencing change permitting retained-data science without practical
admission. No suggestions were rejected. Paper comparisons against A remain
visible without being confused with the separate Sun4096 protection gate.
Primary self-review checks the revised plan's scope, links and gate sequence.
Execution handoff: the selected investigation is complete as recorded in the
results and execution record. The critique above remains planning evidence,
not scientific verification; accepted 00618 owns the final executed-route replay.
