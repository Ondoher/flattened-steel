# H126-H133: angular reconstruction mechanisms

Status: completed; all five screens, earned follow-ons, final replay and local
types pass. The [execution record](reconstruction-mechanisms-execution.md) owns
decisions, timing, recovery and the completion boundary. The [plan](reconstruction-mechanisms-plan.md)
retains the registered gates and hypothesis ranking. Production is unchanged.

## Main result

Two complementary changes substantially improve the reconstruction of incoming
first-scattered illumination used to build the next scattering order:

1. Separate the known source phase function from the light, interpolate the
   remaining amplitude with a positive shape-preserving polar cubic, then restore
   the source phase.
2. Add a small number of polar rings where curvature in existing cached nodal
   light indicates that the original grid is sparse.

The fixed composition reduces the registered absolute reconstruction-error pool
by **61.5% for paper and72.7% for Toronto**, relative to the experimental4096-node
midpoint baseline. Both profile20%gain gates and all36component protections pass.
No atmosphere parameter, reference total, exposure or mixture fraction was fitted.

These are local mathematical-reconstruction gains, not paper RMSE improvements,
observer spectra, horizon-color results, N4 results or a production-cache change.
Physical-total protection passes9of36cases and remains inconclusive in27; none
is qualified rejected by that test. Consequently no complete practical/physical
replacement is admitted. Inconclusive protection is not evidence of no regression.

## Comparisons on the same independent query cloud

All methods below use seed684729175 and the same36exposed fields, retaining
Rayleigh-origin and aerosol-origin errors separately. The pool is the equally
weighted mean of fieldwise normalized phase-weighted absolute errors,
`A_origins = integral beta_M P_M (abs(e_R)+abs(e_M)) dOmega`.
It cannot obtain a gain merely by cancelling the two origin errors.

| Method | Incoming nodes | Paper error reduction | Toronto error reduction |
| --- | ---: | ---: | ---: |
| Uniformly added polar rings, original interpolation | 4864 | 8.1% | 6.2% |
| Independently measured residual allocation, original interpolation | 4864 | 34.4% | 36.4% |
| Cached-node curvature allocation, original interpolation | 4864 | 42.5% | 49.0% |
| Source-phase factoring plus polar cubic, original grid | 4096 | 34.6% | 47.0% |
| Cached-node allocation plus source-phase-factored polar cubic | 4864 | **61.5%** | **72.7%** |

The original baseline means are1.32185%paper and2.04442%Toronto of the fixed
matched J2/reference floor. The composed means are0.50826% and0.55744%.
These quantities are absolute angular reconstruction budgets, not signed total
errors or RMSE. Profile pools stay separate; no average conceals a profile loss.

[Cubic confirmation and paired decisions](../../../../../tmp/experiments/sky-accuracy-dials/runs/00647-h132-cubic-score/summary.json),
[complete density transfer](../../../../../tmp/experiments/sky-accuracy-dials/runs/00649-h132-dense-wave/summary.json)
and [fixed composition](../../../../../tmp/experiments/sky-accuracy-dials/runs/00650-h132-composition/summary.json)
own the numerical decisions. The
[native method table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00651-h133-mech-report/method-fields.csv)
retains casewise gains and protections. Bootstrap ratios use2000paired batch
resamples with shared band/model indices within each physical receiver/profile;
finite numerical envelopes are added separately. They are empirical bounds, not
simultaneous confidence or global truncation certificates.

## What happened to each hypothesis

### 1. Source phase and transport amplitude: supported, but factoring alone is partial

For this distant-Sun first-scattering problem, the source phase is constant
along a given physical ray, so `L_s(w)=P_source,s(w)*T_s(w)` is an exact
factorization. T is a path-integrated transport amplitude, not local density.
Independent phase-free integration, restored-phase convolution manufactures and
actual nodal reproduction pass.

Factoring alone reproduces a strong Toronto near-Sun red gain, but does not
remove the paper opposite-Sun residual. It changes what is interpolated, unlike
the failed H124 rule that changed polar weights while still interpolating light.
The combined success depends on reconstructing the remaining amplitude better.

### 2. Polar/azimuth interpolation: supported, with coupled contributions

Here polar means the incoming Sun-angle coordinate `m=dot(w,Sun)`; azimuth runs
around that Sun axis. These are incoming directions in the order-building
integral, not the final shader's outgoing cache grid.

The exact-coordinate interventions preserve original donors/weights and independently
evaluate the light at mixed coordinates. At the paper opposite-Sun witness,
exact-polar substitution lowers absolute error much more than exact azimuth.
Toronto near-Sun results are coupled: azimuth matters substantially, especially
after source-phase factoring. Both conditional paths and the interaction remain
in the [coordinate record](../../../../../tmp/experiments/sky-accuracy-dials/runs/00640-h128-coordinates/summary.json).
Factorial closure is a bookkeeping check; it does not by itself prove a cause.

The earned repair uses monotone four-ring Hermite interpolation, separately by
incoming origin, preserving physical support, nodal values and positivity. Its
linear-control mode reproduces the original midpoint to about7e-16relative at
the measured controls. Interval slope arithmetic propagates nodal numerical
uncertainty. Raw-radiance cubic alone worsens Toronto near-Sun green/red;
source-phase factoring is essential to its successful counterpart.

### 3. Physical transitions: not the principal measured explanation

The36-field support screen finds no ground-category donor crossing. Some donors
cross categorical illuminated/shadowed path support. The largest unresolved
case, Toronto opposite-Sun red, receives a retained131072-query refinement:
its absolute origin-resolved crossing contribution is bounded to
**0.1053-0.1414% of J2/floor**, below the registered0.2%materiality threshold.

The [boundary refinement](../../../../../tmp/experiments/sky-accuracy-dials/runs/00645-h129-bound-hi/summary.json)
does not rule out steep continuous transport variation near a horizon or tangent.
True/sham regional matches have limited overlap and are not relabeled a causal
proof. No boundary-split repair is earned.

### 4. Different incoming origins: physically important, no better specialized rule

Rayleigh-origin and aerosol-origin errors remain distinct and can cancel. A
registered raw-cubic Rayleigh / phase-factored-cubic aerosol rule does not improve
the shared factored-cubic pool. Reversing that assignment loses substantial
Toronto benefit. The
[origin-rule comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00644-h130-origin-rule/summary.json)
supports retaining source-phase treatment for aerosol light, without establishing
a benefit from separate specialized cache representations.

### 5. Placement/density: supported; allocate by curvature instead of shifting

Two ordered azimuth offsets and one polar-panel offset preserve node count and
ground/horizontal support. None meets the20%gain screen across the measured
protections. Polar shifting helps some fields and markedly worsens others;
alignment alone is not a universal correction.

Adding12complete64-node rings preserves all4096original directions and adds768
nodes, an18.75%increase in this local incoming table. Uniform allocation improves
little. Independent-residual allocation works better, but needs interior oracle
light and is not a free input to a real builder.

The followed lead uses only actual original cached nodal light:32fixed azimuth
samples per ring, departures from adjacent-ring linear chords, physical polar
widths and equal normalized profile/band/origin shares. It does not use outgoing
phase, interior oracle light or reference totals to choose the added rings.
The rule passes its pilot gate and complete exposed transfer. Its fixed
composition with the cubic is better than either standalone pool.

The experiment shares the allocation across both registered profiles and three
bands. Translating that procedure into a single-profile native builder, its
selection cost, topology/storage contract and whole-build performance remains
unqualified; cached-node training is not a claim of zero computational cost.

## Limits, cost and verification boundary

This is spherical distant-Sun, black-boundary **L1-to-local-J2**, six exposed
geometries, two optical profiles and three bands469.6667/532.3333/626.3333nm.
Toronto is the registered aerosol phase/SSA variant, not actual Toronto weather.
All eight H97 fresh physical tuples remain unexposed. No new libRadtran run,
40-wavelength B1 score, observer color, twilight or full recurrence was measured.

The independent direct-light oracle uses hardware GPU batches with selected
binary64 checks and separate view/column refinements. The physical-total
MC/path-reference halfwidths, roughly0.3-2% of J2/floor, and whole-integral angular
variance limit the stricter0.1percentage-point protection test. Paired output
differences close nine protections without pretending the other27passed. Better
reconstruction can still remove cancellation in the final total.

Cubic slopes depend on light values, so old illumination-independent phase
weights cannot simply be reused. The small host prototype's median1024-query
evaluation is about20.6ms for original interpolation and51.8ms for the
phase-factored cubic, including interval propagation. This is a local JS
measurement, not a native/GPU build benchmark or live shader cost. The density
methods additionally evaluate768new directional nodes; full cache memory and
build time are unmeasured. [Measured stage/cost evidence](../../../../../tmp/experiments/sky-accuracy-dials/runs/00651-h133-mech-report/timing.json)
separates overlapping work from overall elapsed time.

Run00635preserves the failed sandbox Chrome launch;00636reuses completed evidence
and performs only the missing GPU pilot. Run00637preserves its startup heartbeat
failure;00638authenticates and replays its numerical data without retracing.
Neither exception is retroactively passed. No standards reviewers or independent
audits were run; checkpoint advice remains separate.

[Accepted final proof00652](../../../../../tmp/experiments/sky-accuracy-dials/runs/00652-h133-mech-proof/summary.json)
replays the actual amplitude, mixed-coordinate, cubic, boundary, origin,
placement, density and fixed-composition derivatives, including query streams,
node layouts, uncertainty, pooled gates, source/parent identities, independent
numerical controls, fresh-geometry reservations, cleanup and local types.
These correlated replays do not create new independent physical geometries.
Numerical work through final proof took about 59 minutes including authoring,
recovery, analysis and overlapping host work; this is not pure GPU time.
Retained evidence is about 1350 MiB under the unchanged 1408 MiB allowance;
scratch is zero and no job remains.

Primary source-identity, local-link and whitespace checks pass. The authorized
local Git checkpoint could not be created: staging the active-topic update fails
against an object directory with explicit write-deny rules. All source and reports
are preserved in the working tree. The [execution record](reconstruction-mechanisms-execution.md)
records the exact failure and checkpoint-only resumption; no numerical rerun is needed.

The investigation concludes with qualified reconstruction gains and incomplete
physical-total admission. Further native, higher-order,
paper-score, scene or production work requires a newly selected scope; the
experiment remains open and all existing evidence stays immutable.
