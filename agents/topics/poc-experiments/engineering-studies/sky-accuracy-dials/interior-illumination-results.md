# H120-H125: independent interior-illumination results

The diagnostic question is answered: **reconstructing illumination between
incoming directions introduces substantial local scattering error, even when
the stored illumination samples and integration weights are accurate.** It also
creates cancellations that can make a small combined error misleading.

H125 final replay and local types pass in
[accepted00634](../../../../../tmp/experiments/sky-accuracy-dials/runs/00634-h125-int-proof/summary.json).
The [execution record](interior-illumination-execution.md)
owns consequential decisions, milestone reports and recovery; the
[plan](interior-illumination-plan.md) retains the unchanged gates. Production is
unchanged and the experiment remains open.

## What was measured

This is spherical, distant-Sun, black-boundary **L1-to-J2** transport at six exposed
geometries, two registered optical profiles and three bands: 469.6667, 532.3333
and 626.3333nm. Toronto means the registered aerosol phase/SSA variant, not a
reconstruction of actual Toronto weather. These are local source-density errors,
not observer radiance, sky colors, N4 results or paper B1 RMSE.

H100, curved-sector and their fixed .5 midpoint share the same4096 incoming
nodes, construction1 and k=.5. An independent continuous first-scattering oracle
evaluates both original nodes and physical directions inside their angular cells.
It uses separate radial-shell/path/column calculations, actual optical inputs,
hardware GPU batches and selected binary64 checks. It does not obtain light from
the cache or its interpolation. Incoming Rayleigh-origin and aerosol-origin
light remain separate.

The12initial physical fields use131072angular queries each. The24additional
transfer fields use8192each. Common queries preserve paired model/band comparisons;
32batch means supply empirical95%intervals. Finite view/column/GPU envelopes
include their sampled upper uncertainty in the final decisions. These are finite
qualification checks, not global truncation certificates or simultaneous
confidence guarantees for every correlated comparison. All eight H97 fresh
physical tuples remain unexposed.

## Which calculation contributes the error

For a fixed outgoing direction, the three Mie terms are:

```text
integration error    = calculated operator - integral of old reconstructed light
nodal-input error    = integral of old reconstructed light
                      - integral reconstructed from independent nodal light
reconstruction error = integral reconstructed from independent nodal light
                      - integral of directly evaluated interior light
```

The unchanged outgoing-Rayleigh residual and continuous-total/reference remainder
complete the signed total budget. Its algebraic closure is checked separately;
closure alone does not validate the physics.

The maximum absolute nodal-input effect through the inherited calibrated positive
operators is **0.0132%** across108model/field comparisons. Signed and absolute
nodal effects are nearly identical at the initial witnesses, so their small net
input error is not hiding substantial nodal cancellation in that audit. This
does not certify every individual node at arbitrary relative precision.

Fixed-midpoint reconstruction estimates, percent of matched J2/reference floor:

| Profile / original view | Blue | Green | Red |
| --- | ---: | ---: | ---: |
| Paper, near Sun | -0.4079 | -0.4557 | -0.1928* |
| Paper, opposite Sun | -1.4931 | -1.4729 | -1.1477 |
| Toronto, near Sun | -0.5981 | -1.3291 | -1.7206* |
| Toronto, opposite Sun | -0.3143 | +0.3587 | +0.9803* |

An asterisk means the strict combined precision/materiality gate remains unresolved,
even where the sign is clear. Materiality requires more than0.2%, sufficient
combined precision, and a numerical envelope within10%of the resolved threshold
distance. In particular, Toronto near-Sun red's sampling halfwidth is0.1136percentage
points, exceeding the planned precision ceiling before its numerical envelope is
added. No threshold was relaxed. The [native field table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00633-h125-int-report/field-results.csv)
contains every model, sampling halfwidth, numerical envelope and decision flag.

Independent same-model angular controls isolate integration error without a noisy
subtraction of two whole angular estimates. Reconstruction exceeds half the
absolute three-component Mie budget at three qualified midpoint witnesses:

| Witness | Reconstruction | Conservative95%lower share of absolute Mie budget |
| --- | ---: | ---: |
| Paper, opposite Sun, blue | -1.4931% | 94.7% |
| Paper, opposite Sun, red | -1.1477% | 92.1% |
| Toronto, near Sun, green | -1.3291% | 96.5% |

These shares use absolute component magnitudes, so a cancelling signed denominator
cannot manufacture dominance. Alignment with final total error is a separate
question: paper opposite red's total-error interval remains unresolved. Toronto
near-Sun red has a large estimated share but is not declared precision-qualified.
The [anchor ledger](../../../../../tmp/experiments/sky-accuracy-dials/runs/00633-h125-int-report/anchors.json)
preserves those distinctions and the original admission labels of reused controls.
The additional [Toronto green control](../../../../../tmp/experiments/sky-accuracy-dials/runs/00629-h122-tor-cdf/summary.json)
has its own0.05%diagnostic tolerance; it does not pass an older tighter candidate
protection gate by relabeling it.

## Where cancellation appears

Reconstruction depends on both geometry and optical profile. High-Sun ground
midpoint errors are small; lower Sun and altitude change their sign and size.
The [H123 milestone table](interior-illumination-execution.md#h123-physical-transfer-complete-extra-outgoing-checks-follow)
records all24transfer estimates. Of72correlated model/transfer comparisons,
7are qualified material,36qualified small and29unresolved.

Different reconstructions can give opposing errors with identical nodal light.
At paper opposite-Sun red, H100 gives-2.8883%, sector+0.5929%, and the midpoint
-1.1477%. Toronto opposite-Sun red similarly gives-3.0453%,+5.0059%and+0.9803%.
The midpoint can suppress one discrepancy without recovering the true angular
illumination function.

The origin split provides a second, concrete cancellation. At paper low-Sun,
ground-level green, incoming Rayleigh-origin light contributes **-0.1734%** and
aerosol-origin light **+0.1747%**, leaving only **+0.0013%** combined reconstruction
error. Both feed the same outgoing Mie integral; this is not a correction to
outgoing Rayleigh scattering. Conversely, Toronto near-Sun red has two negative
contributions, about-0.2379%and-1.4827%. Its deficit is mostly aerosol-origin light.
Paper opposite-Sun red is mostly Rayleigh-origin light.

In total,47of108model/field comparisons have separately resolved opposing-origin
signs, including17of36midpoint fields. These are correlated comparisons across
six geometries, not47independent physical validations. The
[origin table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00633-h125-int-report/origin-errors.csv)
and [full origin bounds](../../../../../tmp/experiments/sky-accuracy-dials/runs/00632-h123-int-origins/summary.json)
retain component intervals and pointwise cancellation.

## The causal repair did not qualify

H124 replaced the two-ring polar blend with interpolation in the known source
phase curve, separately for each incoming origin. It preserved positive weights,
constants, nodal values, azimuth donors and support fallbacks. Parameters were
frozen before independent new-seed evaluation.

None of36model fields meets the registered50%absolute-error reduction requirement;
all paired rejection bounds resolve. Ratios range from0.914to1.029: roughly8.6%
improvement to2.9%worsening. No changed-operator calibration, full protection,
native implementation or full-cache work was earned.

An instructive post-hoc illustration comes from paper near-Sun red. The rule
reduces its phase-weighted absolute reconstruction error from1.1523%to1.0543%,
an8.5%improvement. Yet its signed deficit grows from-0.1928%to-0.3915%.
Improving angular agreement can remove cancellation and worsen the signed integral.
This does not establish a B1/RMSE regression or satisfy the failed50%repair gate.
The [causal record](../../../../../tmp/experiments/sky-accuracy-dials/runs/00630-h124-phase-warp/summary.json)
and [paired cancellation replay](../../../../../tmp/experiments/sky-accuracy-dials/runs/00634-h125-int-proof/cancellation-examples.json)
retain both metrics. The paired absolute-error change, including the numerical
envelope, is-0.0980percentage points with95%bounds[-0.1079,-0.0882].

This rejects the tested phase-coordinate repair. It does not reject the measured
reconstruction error, every phase-factored model, or a future better representation.
The remaining transport-amplitude and physical-support curvature has not been
isolated into a justified replacement calculation. That is the next research
question, rather than a reason to fit another mixture to reference totals.

## Verification and limits

Useful controls and native artifacts are collected in
[accepted00633](../../../../../tmp/experiments/sky-accuracy-dials/runs/00633-h125-int-report/summary.json).
H123 also evaluates72model/outgoing comparisons by rotating local azimuth90and180
degrees at unchanged elevation. It reuses the original full-support query density
and measured light, changing only physical phase weighting. New-view variance can
be larger; there is no matched independent J2 truth at those rotated directions.
Their percentages use the original-direction scale. They cannot establish total
accuracy or borrow the original reference.

Accepted H125 replays108signed decompositions,36causal comparisons,72extra-outgoing
derivatives and108origin splits, including actual query streams, inherited input/
operator/reference inventories, source identities, reservations, cleanup and local
types. The old00622startup heartbeat gap remains a monitoring failure; accepted
00623separately authenticates and replays its numerical data. No seal or progress
record was repaired in place. The inherited00610/00611recovery also remains
historical evidence, not a newly passed monitoring record.

Dispatch measurements include browser transfer/readback and shared-host scheduling;
they are not isolated GPU kernel timings or native-cache build costs. The
[timing record](../../../../../tmp/experiments/sky-accuracy-dials/runs/00634-h125-int-proof/performance.json)
measures about90.7minutes through final verification, including authoring,
inspection, I/O and overlapping work. Transfer took11.5minutes, the three-group
ceiling wave22.5minutes, and the final Toronto group6.0minutes. They are not
additive estimates of pure GPU time. Final retained evidence is about1292.1MiB,
scratch0, under the1408MiBallowance. The execution record owns resource decisions. Source and
generated evidence remain contained and prior runs immutable. No images of data
tables, sky swatches, scene renders, standards reviewers or independent audits were
needed. Checkpoint advice remains separate.

The supported conclusion is **material between-direction reconstruction bias with
demonstrable cancellation**, not a universally broken cache or an established
production correction. N3/N4 propagation, full40-wavelength B1, twilight behavior,
production promotion and actual horizon appearance remain outside this completed
diagnostic scope.
