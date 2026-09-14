# Sky Accuracy Dials: Hypothesis Report And Scientific Handoff

The campaign **partially achieved the original objective**. It investigated
altitude, angular sampling, integration, reconstruction, scattering orders and
their relationships. It qualified local predictions for source integration,
recurrence transport integration, and sufficiently refined altitude-segmented
view integration, plus one source/transport combination. It did **not** establish
a general set of controls that predictably increases or decreases physical
accuracy or Kider agreement across all these factors.

The strongest broader result is an explanation, supported by controlled
comparisons, of why additional samples can worsen measurement agreement:
different numerical errors can compensate for each other, reconstruction can
alter the response to refinement, and a correct prediction of radiance change
does not imply an improvement in a measured score.

This report records the original expectations, how they were tested, successes,
failures and limits. It is the scientific handoff for the next stage. No new
experiments were run to write it. The [status](status.md) owns execution,
storage and review evidence; the [design](design.md) owns the experimental
boundary. The campaign being finished does not mean its broader objective is
fully solved.

## Reading The Evidence

A **locked prediction** was recorded before its target configuration executed.
An **exploratory comparison** had a qualitative mechanism question but no frozen
numerical forecast. A **retrospective diagnosis** explains an already observed
result. A **manufactured proof** isolates a mathematical mechanism in a simplified
case. These categories support different strengths of conclusion.

Original prediction claims below follow retained definitions and prediction
records, rather than treating the current design or a later explanation as an
original forecast. All 17 Kider measurements were already known. The withheld
quantity was a finer configuration's output, not unseen measurement data.

### Setup, notation and units

The physical control uses the matched Direct40 inputs, fixed atmosphere and
ground, surface observer, fitted Sun/observer geometry, collimated source,
Z180 solar grid and anchored numerical policy within the Basic Bruneton B1
physical boundary.

- P is the retained altitude-node count: baseline P48.
- W is the outgoing cubed-sphere face width: baseline W27.
- I is incoming quadrature count: baseline Fibonacci F68.
- S is source optical-depth interval count: baseline 20.
- T is recurrence-path interval count: baseline 40.
- Q is final-view integration count: baseline quadratic-path Q30.
- Jn is pure scattering-density order n; Cn is its cumulative field through n.
  The baseline evaluates C4 using the existing cubic solar reconstruction.
- D1 denotes continuous first order evaluated at the same finite source/view
  quadrature. It is a reconstruction reference, not an exact continuum solution.
- V(field) denotes final-view reconstruction and integration of that field.
  L(Cn) is the resulting cumulative radiance; L1 in the recurrence is transported
  first-order radiance used when constructing J2.

Unless explicitly stated otherwise, RMSE and spectral RMS values below are in
**mW m^-2 sr^-1 nm^-1**. Internal evidence uses W. Lower Kider RMSE is better;
a positive candidate-minus-control RMSE change is worse. Spectral response RMS
measures the size of a model change, not its error against Kider.

| Evidence scope             | Conditions and directions                     | Numerical wavelengths           | Kider score wavelengths                  |
| -------------------------- | --------------------------------------------- | ------------------------------- | ---------------------------------------- |
| Screening                  | 09:30, 11:15, 13:30; 81 rays each             | Channels 0, 8, 16, 24, 30, 39   | First five of those channels             |
| Full N4 evaluation         | All 17 times; 81 rays each                    | All 40 channels                 | Registered channels 0-30: 42,687 scalars |
| Full prediction assessment | The 14 times outside the screen; 81 rays each | All 40 channels: 45,360 scalars | Channels 0-30: 35,154 scalars            |
| N6 diagnostic              | All 17 times; 81 rays each                    | Channels 0 and 8                | Those two channels only: 360 and 454 nm  |

For full prediction tests, coarse and medium outputs at all 17 times were
available before the finer target ran. The fourteen-condition assessment tests
a new intervention at those conditions; it does not establish extrapolation
from only three conditions without their lower-level outputs.

The fixed gate requires at least 90% scalar sign agreement above the
1e-8 W implementation floor and at most 25% relative spectral-vector error
in **every** declared condition/angular group. The floor bounds implementation
repeatability; it is not measurement uncertainty. The 84 full-assessment groups
overlap and are not 84 independent trials.

For a smooth second-order integration error, doubling a count predicts that
the next radiance change will be one quarter of the previous change. This
quarter-change model is tested below without relaxing failed gates. For
incoming product quadrature, both angular dimensions double, so total sample
count quadruples.

## Hypothesis 1: Baseline Parity Bounds Harness And Arithmetic Differences

**Original prediction.** The contained evaluator should reproduce the retained
production baseline to a small numerical tolerance. Repeating a configuration
and checking matched CPU results should put arithmetic/harness differences far
below the effects under investigation. Geometry and physical inputs should
remain fixed while numerical controls change.

**Test.** Reproduced Native48 screening and full spectra, checked the Native51
development comparison, repeated selected baseline outputs, and fixed the
prediction floor before target runs. Independent equation/scorer proofs checked
the score algebra and prediction admission. N6 runs additionally checked the
original four-order prefix.

**Outcome.** Full Native48 parity covers 55,080 scalars, with maximum absolute
difference 1.045e-13 W and no failures. The matched Native51 comparison also
passes. The final proof run includes 43 positive/negative admission checks.
Two execution failures were retained and corrected in later runs: the initial
empty L1 callback and the summary's mistaken admission of the separate N6
schema. Neither failed output was used as accepted scientific evidence.

**Conclusion.** Ordinary baseline mismatch or repeat noise does not explain
the much larger measured responses. This is a reproducibility control, not a
precision dial: there was no systematic float-precision or geometry sweep, and
agreement with the same numerical implementation cannot exclude a shared bias.

Evidence: baseline/parity runs 00003-00006, 00044, 00054-00055; final
[proofs](../../../../../tmp/experiments/sky-accuracy-dials/runs/00088-equation-proofs/result.json).
The authenticated inventory retains failed runs 00002 and 00087.

## Hypothesis 2: More View Samples Follow A Smooth Convergence Law

**Original prediction.** Changing final-view Q30 to Q60 and Q120 with fixed
recurrence controls should isolate view integration. After observing Q30/Q60,
the locked model predicted Q60-to-Q120 as one quarter of Q30-to-Q60.

**Test.** Q30/Q60 shared a capture with the required query supports; Q120 used
a separate capture with matched recurrence controls. All 72 retained fixed
projection probes matched exactly across those captures; these are probes,
not full-field hashes. Evaluated cached cumulative, grouped and continuous
first-order controls. The prediction was sealed in run 00007 before target
00008 and assessed in 00009.

**Outcome.** The cached prediction fails all 18 screening groups. Low-elevation
group sign agreement is only about 9-13%, with vector errors about 353-869%.
Screened Kider RMSE changes 11.824512 -> 11.840731 -> 11.842697.

A retrospective vector comparison is particularly informative: the later
cached change has 0.25450 times the earlier change's norm, close to one quarter,
but their cosine is only 0.30140. The pooled quarter-model vector error is
117.17%. The same comparison for continuous first order gives norm ratio
0.25147, cosine 0.9999994 and only 0.594% vector error.

**Conclusion.** A nearly correct total correction size can hide the wrong
spatial/spectral response. Increasing Q is not a qualified predictive dial for
the original reconstructed field at these levels. The continuous comparison
supports nonsmooth cache reconstruction as a contributor; it does not uniquely
attribute the failure to one interpolation boundary.

Evidence: [original prediction](../../../../../tmp/experiments/sky-accuracy-dials/runs/00007-prediction/prediction.json)
and [failed assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00009-prediction-check/result.json).

## Hypothesis 3: Aligning View Intervals With Altitude Knots Restores Predictability

**Original prediction.** After the preceding failure, split a ray at every
physical cache altitude knot. Keeping derivative changes out of interval
interiors should make a smooth second-order model more reliable. Outgoing
angular reconstruction can still introduce boundaries.

**Test.** Used midpoint subdivisions per altitude segment. First locked the
1/2-to-4 prediction; after its failure, retained the same quarter-change law
and tested 2/4-to-8. For the P48 benchmark rays, these settings correspond to
48/96/192/384 view steps. The full finer prediction used run 00078's lower
levels, registration 00079, target 00080 and assessment 00081.

**Outcome.** The coarse 1/2-to-4 model gets 100% of significant signs right but
fails the near-Sun magnitude gate, with a maximum group error of 27.70%.
The finer 2/4-to-8 model passes all 84 full-assessment groups: 100% sign
agreement, maximum vector error 7.55%.

| Substeps per altitude segment | Full Kider RMSE | 12:30 RMSE |
| ----------------------------: | --------------: | ---------: |
|                             2 |       11.450246 |  18.410335 |
|                             4 |       11.437391 |  18.434745 |
|                             8 |       11.434806 |  18.441589 |

**Conclusion.** This supplies a locally qualified integration dial once
sufficiently refined, and supports altitude-knot crossings as one important
source of unpredictability. Finer settings improve the aggregate score within
this ladder while worsening 12:30, and all remain slightly worse in aggregate
than original Q30. There is no qualification for arbitrary combinations with
other controls or for a universal convergence threshold.

Provenance detail: the later target definitions reuse coarse-case prose about
a held level 4. Their authoritative numeric
[prediction](../../../../../tmp/experiments/sky-accuracy-dials/runs/00079-prediction/prediction.json)
and selector specify held level 8 from 2/4. The [coarse failure](../../../../../tmp/experiments/sky-accuracy-dials/runs/00034-prediction-check/result.json)
and [finer pass](../../../../../tmp/experiments/sky-accuracy-dials/runs/00081-prediction-check/result.json)
are both preserved.

## Hypothesis 4: Source Optical-Depth Sampling Has A Predictable Response

**Original prediction.** The initial S20-to-S40 experiment stated that finer
source optical-depth integration changes J1 and its descendants. It did not
preregister a brightening magnitude or Kider improvement. After observing that
pair, the numerical prediction for S80 used the quarter-change law.

**Test.** Varied S20/40/80 with other controls fixed, checked where changes first
appear, and locked screening and full finer-level predictions before targets.
A later representation comparison separated cached and continuous first order.

**Outcome.** Source refinement brightens the sampled sky. S40-to-S80 passes
every screening group, then all 84 full-assessment groups with 100% sign
agreement and maximum vector error 9.66%. Full Kider RMSE worsens monotonically
11.419630 -> 11.595982 -> 11.659505, while 12:30 improves
18.513209 -> 18.322975 -> 18.276461.

**Conclusion.** Source count is a locally predictable response dial, including
a predictable worsening of aggregate Kider agreement. A plausible mechanism is
that overestimated optical depth dims sunlight through exp(-tau), so correcting
that estimate brightens it. The runs establish the net response, not a theorem
for all source paths or atmospheres. The representation interaction below
shows why this dial's score trend cannot be transferred unchanged to a
different first-order reconstruction.

Evidence: original qualitative definition 00016; screen registration/target/check
00022/00026/00035; full registration/target/
[assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00061-prediction-check/result.json)
00058/00060/00061.

## Hypothesis 5: Recurrence-Path Sampling Has A Predictable Response

**Original prediction.** The initial T40-to-T80 experiment stated that path
refinement leaves J1 unchanged but changes transported L1 and J2 onward.
It was an exploratory mechanism test. The later T160 prediction locked the
quarter-change model after observing T40/T80.

**Test.** Varied T40/80/160 with identical source/grid controls, checked first
affected orders, and performed screening and full finer-level predictions.
Manufactured homogeneous-medium checks isolated integration bias without
requiring cache interpolation error.

**Outcome.** Transport refinement darkens the sampled sky. T80-to-T160 passes
all screening groups and all 84 full-assessment groups, with 100% sign
agreement and maximum vector error 2.85%. Full Kider RMSE improves
11.419630 -> 11.325263 -> 11.312726, while 12:30 worsens
18.513209 -> 18.545771 -> 18.558429.

For a homogeneous medium with extinction kappa and step Delta, let
x = kappa Delta / 2. The radiance trapezoid/exact ratio is x/tanh(x) > 1;
the midpoint/exact ratio is x/sinh(x) < 1. The retained proof checks these
opposing biases over multiple optical depths and counts.

**Conclusion.** Transport count is another locally predictable dial. Source
and transport integration can have opposing effects because they integrate
different quantities. L1 transport evaluates direct scattering density without
using cached J, so an initial transport bias need not originate in
interpolation. The atmospheric transport change also includes inner attenuation
effects; the homogeneous proof does not isolate every atmospheric term.

Evidence: original definition 00017; screen 00023/00027/00036; full 00059/00062/
[00063 assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00063-prediction-check/result.json);
[homogeneous proofs](../../../../../tmp/experiments/sky-accuracy-dials/runs/00088-equation-proofs/result.json).

## Hypothesis 6: Near-Ground Nodes Mainly Correct A Local First-Order Bias

**Original prediction.** P51 was a known development comparison: refining the
lowest altitude interval should reduce positive first-order reconstruction bias,
with smaller later-order changes. The stronger locked P55 model predicted C4
using the baseline plus an analytically modeled cached-J1 change, neglecting
higher-order and grouping changes. P63 was a further exploratory refinement,
without a locked numerical prediction.

**Test.** Compared P48/51/55/63, retaining physical conditions and other controls.
Computed a first-order-only P55 predictor before its target, then compared
first/higher contributions and analytic-first-order substitutions.

**Outcome.** The P55 first-order response is predicted extremely closely:
2.993181 modeled versus 2.993175 observed RMS. However, the omitted higher
cumulative-increment response is 1.645942 RMS, with 87.21% of its change energy
below 20 degrees elevation. Only 5/18 groups pass the complete C4 prediction.
All three near-Sun groups pass; the whole-condition vector errors are
37.71-49.07%.

| Retained altitude nodes | Screened Kider RMSE |
| ----------------------: | ------------------: |
|                      48 |           11.824512 |
|                      51 |           12.033665 |
|                      55 |           12.031371 |
|                      63 |           12.017071 |

P51-to-P55 and P55-to-P63 responses diminish to 0.279047 and 0.188483 RMS,
but their mean changes are positive. The initial dimming trend does not
continue as a single monotone radiance law. Replacing cached first order with
analytic first order leaves 42.61% of the original P48-to-P55 C4 sensitivity.

**Conclusion.** Near-ground reconstruction error is real, but its effect is not
confined to the first-order correction or to a small local patch. Regenerated
higher orders materially change the answer. The first-order-only prediction
is falsified globally. Diminishing sensitivity at finer grids is useful
evidence, but does not qualify altitude count as an accuracy dial.

Evidence: [J1 prediction](../../../../../tmp/experiments/sky-accuracy-dials/runs/00011-prediction/prediction.json),
target 00012, [assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00014-prediction-check/result.json),
development 00013, refinement 00030 and
[representation contrast](../../../../../tmp/experiments/sky-accuracy-dials/runs/00038-representation/result.json).

## Hypothesis 7: More Outgoing Directions Resolve The Sharp Solar Lobe

**Original prediction.** W39 should change reconstruction most near sharp phase
gradients; continuous first order should not depend on W. W51 tested another,
nonnested grid. Neither test locked a numerical correction, and the W51
definition explicitly assumed no monotone Kider guarantee.

**Test.** Compared W27/39/51 at otherwise fixed controls, mapped the response
around the Sun, and repeated the comparison with analytic first order.

**Outcome.** Screened Kider RMSE improves 11.824512 -> 11.785169 -> 11.774356.
Relative to W27, W39/W51 C4 changes have RMS 0.102264/0.134506, with
80.43%/84.06% of squared change within 15 degrees of the Sun. With analytic
first order, sensitivities fall to 0.016011/0.018184 RMS.

Estimated core field memory grows from 148.65 MiB at W27 to 305.27 MiB at W39
and 518.84 MiB at W51, before driver and other overhead.

**Conclusion.** Most observed outgoing-grid sensitivity belongs to first-order
reconstruction near the solar lobe, with a smaller later-order component.
The measurements support that localization and a modest screened improvement.
They do not supply a reliable W-to-error law, full-spectrum qualification,
or a general justification for the increased memory.

Evidence: original targets 00020 and 00029; their representation selectors and
scores in the [consolidated scorecard](../../../../../tmp/experiments/sky-accuracy-dials/runs/00098-campaign-summary/scorecard.json).

## Hypothesis 8: Better Incoming Quadrature Gives Predictable Angular Convergence

**Original prediction.** More accurately distributed positive-weight directions
should improve phase-weighted integration, leave J1 unchanged and affect J2
onward. GL32/128 were exploratory. The later locked predictions applied the
quarter-change model to GL128-to-512 and then GL512-to-2048.

**Test.** Used Gauss-Legendre cosine by uniform-azimuth rules of 4x8, 8x16,
16x32 and 32x64 directions. Checked constant-illumination phase integration
over 263 outgoing orientations, actual recurrence outputs, exact J1 invariance,
and the two locked finer-level predictions.

| Incoming rule | Maximum manufactured Mie normalization error (dimensionless) | Screened Kider RMSE |
| ------------- | -----------------------------------------------------------: | ------------------: |
| F68           |                                                    0.4093005 |           11.824512 |
| GL32          |                                                    0.3539210 |           12.027234 |
| GL128         |                                                    0.0195278 |           11.722944 |
| GL512         |                                                 0.0000968524 |           11.582828 |
| GL2048        |                                             0.00000000154982 |           11.557899 |

**Outcome.** Manufactured accuracy improves dramatically, and finer GL rules
improve the screened measured score. Both actual-sky predictions nevertheless
fail all 18 groups. In the latest test, response RMS decreases
0.654444 -> 0.146392, a ratio of 0.223689, but the response vector rotates
23.76 degrees. Significant sign agreement falls as low as 83.33% and maximum
group vector error reaches 77.77%.

J1 and C1 remain exactly unchanged. The latest response starts at C2, with
79.78% of squared C4 change below 20 degrees elevation. A retrospective removal
of unscored channel 39 still leaves all groups failing the magnitude gate;
the failure is not solely an irrelevant-channel effect.

**Conclusion.** More incoming samples demonstrably improve the phase-only
integral and measured fit here. They have not supplied a reliable count-to-sky
response law. The real integrand is phase multiplied by transported,
reconstructed radiance, whose angular variation is absent from the manufactured
test. A shrinking total correction is insufficient when its pattern changes.

Evidence: [phase proofs](../../../../../tmp/experiments/sky-accuracy-dials/runs/00088-equation-proofs/result.json);
first registration/target/check 00024/00028/00037; finer
[prediction](../../../../../tmp/experiments/sky-accuracy-dials/runs/00089-prediction/prediction.json),
target 00090, [failed assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00091-prediction-check/result.json)
and [J1 invariance](../../../../../tmp/experiments/sky-accuracy-dials/runs/00092-j1-invariance/result.json).

## Hypothesis 9: Direct First Order Exposes Cache Reconstruction Bias

**Original prediction.** Direct phase, density and source transmittance should
remove first-order cache reconstruction bias. Nonlinear cubic interpolation
also requires a grouping control: interpolation of a sum need not equal the
sum of interpolations. These were exploratory comparisons, not locked score
forecasts.

**Test.** On identical recurrence fields, compared cumulative V(C4), grouped
V(J1) + V(J2+J3+J4), and D1 + V(J2+J3+J4). Kept the alternative frozen
replacement V(C4) - V(C1) + D1 distinct. Manufactured checks confirmed cubic
nonadditivity.

**Outcome.** Grouping alone is tiny on the screening baseline: spectral
difference 0.000279 RMS and Kider RMSE 11.824512 -> 11.824516.
Analytic-first-order replacement changes spectra by 3.510107 RMS and worsens
the aggregate screen to 12.166559. At 09:30 it improves the condition score
12.606171 -> 12.032144, while the other two screen times worsen.

**Conclusion.** Removing a known reconstruction approximation does not
guarantee better measurement agreement. Grouping must be controlled for valid
attribution, but grouping alone is not the dominant observed error here.
Analytic J1 is still evaluated with finite quadrature; keeping existing higher
fields does not create a fully regenerated alternative solver.

Evidence: baseline multi-representation capture 00003,
[nonlinear controls](../../../../../tmp/experiments/sky-accuracy-dials/runs/00043-equation-proofs/result.json),
and scorecard selectors. The complete source/transport representation
relationships are assessed separately below.

## Hypothesis 10: Factoring Out Density Reduces Altitude Reconstruction Error

**Original prediction.** Cache separate Rayleigh/Mie lighting coefficients and
apply the physical density at the query altitude. This should reduce the error
from interpolating rapidly changing density together with lighting. This was
an exploratory first-order diagnostic, not a locked quantitative prediction.

**Test.** Constructed species lighting fields S_R and S_M containing source
irradiance, source transmittance and phase. Reconstructed those fields, then
evaluated J1 = beta_R(h) S_R + beta_M(h) S_M. Compared raw and factored J1
against continuous first order at the same source/view quadrature on P48 and
P55. Split-species controls checked grouping/rounding. Kider substitution
kept the later cumulative increment frozen.

| Grid | Raw J1 error RMS | Factored J1 error RMS | Kider RMSE before -> frozen substitution |
| ---- | ---------------: | --------------------: | ---------------------------------------: |
| P48  |         3.510169 |              0.391449 |                   11.824512 -> 12.307846 |
| P55  |         0.535137 |              0.170411 |                   12.031371 -> 12.215453 |

**Outcome.** P48-to-P55 first-order sensitivity drops from 2.99318 to 0.292768
RMS, about a 90.2% reduction. Grouping/rounding controls are orders of magnitude
smaller than this improvement. Nevertheless, both frozen substitutions worsen
measured fit.

**Conclusion.** Density factorization strongly reduces the specific
reconstruction error tested. It also provides direct evidence of compensating
errors: removing much of that error exposes a larger measured discrepancy.
A factorized multiple-scattering solver was not built or qualified. Combined J
does not contain enough information to recover two independent species
coefficients; that representation needs explicit fields and a regenerated
recurrence before broader claims can be tested.

Evidence: [P48 method](../../../../../tmp/experiments/sky-accuracy-dials/runs/00041-density-n1/method.json)
and [P55 method](../../../../../tmp/experiments/sky-accuracy-dials/runs/00042-density-n1/method.json),
with their retained definitions, results and derivations.

## Hypothesis 11: Fractional Solar-Angle Interpolation Is A Small Contributor

**Original prediction.** The working expectation was that the existing Z180
fractional-angle interpolation would be a small contributor, especially around
noon. No numerical forecast was locked.

**Test.** Evaluated linear and existing cubic solar reconstruction on identical
fields and the same Z180 grid at the three screen times.

**Outcome.** The C4 difference is 0.013796 RMS. Linear reconstruction changes
screened Kider RMSE 11.824512 -> 11.826757.

**Conclusion.** This controlled operator change is small relative to altitude,
incoming and transport effects in the tested setup. It does not qualify another
solar grid, prove either operator exact, or directly test the original
noon-specific expectation: 12:30 was not one of these three screening times.

Evidence: both operators are retained in
[run 00033](../../../../../tmp/experiments/sky-accuracy-dials/runs/00033-baseline-scr/definition.json)
and indexed by the consolidated scorecard.

## Hypothesis 12: Scattering Truncation Remains Material And Depends On Sampling

**Original prediction status.** This was an adaptive diagnostic after finding
a material blue fourth-order contribution. The recorded design asked whether
omitted orders remained material and how sampling affected them; it contained
no frozen numerical N5/N6 forecast or promise of better Kider fit.

**Test.** Extended the actual recurrence to J6 for baseline, T160 and I512,
using the same physical inputs. Each run passed exact J1-J4/C1-C4 prefix
checks and 44,064 matched evaluator comparisons. The scope is all 17 times
and 81 rays but only 360 and 454 nm.

| Numerical configuration | Two-channel N4 RMSE |        N5 |        N6 |
| ----------------------- | ------------------: | --------: | --------: |
| Baseline                |           12.521009 | 14.200475 | 15.188428 |
| Transport 160           |           11.728520 | 12.965571 | 13.669930 |
| Incoming 512            |           12.005820 | 13.258211 | 13.963405 |

**Outcome.** The pooled condition score worsens at both added orders at every
time. The 360 nm channel worsens strongly; 454 nm improves in aggregate.
Added radiance is positive and diminishing on every sampled ray. Both
quadrature refinements reduce the fifth/sixth effective additions everywhere,
but those additions remain material. Low-elevation directions carry about
66-72% of squared N6-minus-N4 change; near-Sun directions carry only 1.24-1.37%.

Here an effective addition means L(Cn) - L(Cn-1). Nonlinear cubic reconstruction
means it is not a separately integrated pure Jn contribution.

**Conclusion.** More orders are not a monotone measured-accuracy control.
Refined sampling reduces later additions, demonstrating interaction between
truncation and numerical integration. There is no infinite-order reference,
proven geometric tail bound or full-spectrum N6 qualification. Picking an
earlier order because it fits Kider better would select cancellation, not
establish convergence.

Evidence: definitions, prefix/parity analysis and scores in
[baseline N6](../../../../../tmp/experiments/sky-accuracy-dials/runs/00047-n6-baseline/definition.json),
[T160 N6](../../../../../tmp/experiments/sky-accuracy-dials/runs/00085-n6-t160/definition.json),
and [I512 N6](../../../../../tmp/experiments/sky-accuracy-dials/runs/00086-n6-i512/definition.json).
These two-channel scores must not be compared directly with the full N4 table.

## Relationship Tests: Which Controls Can Be Combined Predictably?

For a complete two-factor comparison, define the spectral interaction
I_AB = L_AB - L_A - L_B + L_0. The relative values below divide its norm by
the sum of the two main-effect norms. A small global ratio does not guarantee
a small error in every angular group.

| Relationship        | Original prediction and test                                                          | Interaction RMS | Relative interaction | Outcome                          |
| ------------------- | ------------------------------------------------------------------------------------- | --------------: | -------------------: | -------------------------------- |
| S20->40 x T40->80   | Locked additive forecast before joint screen                                          |        0.041220 |               2.093% | All 18 groups pass               |
| S20->80 x T40->160  | Locked additive forecast at fourteen times; full 17-time factorial measured afterward |        0.051496 |               2.395% | All 84 forecast groups pass      |
| F68->I128 x T40->80 | Locked additive forecast before joint screen                                          |        0.662616 |              19.640% | Rejected; 9/18 groups pass       |
| P48->51 x T40->80   | Planned qualitative test of path/reconstruction coupling; no numerical forecast       |        0.283596 |               6.093% | Material coupling measured       |
| W27->39 x F68->I128 | Planned qualitative test of incoming/outgoing coupling; no numerical forecast         |        0.013656 |               0.542% | Weak coupling at tested settings |

The first, third, fourth and fifth rows use six-channel screening spectra.
The second uses all 40 channels at all 17 times for the measured interaction.
Stored SSE contrasts in these factorial artifacts share those selections;
they are not registered 31-channel B1 SSE.

**Source x transport conclusion.** Their independently measured brightening
and darkening approximately add within the registered gates. The full forecast
has minimum group sign agreement 95.63% and maximum vector error 19.44%.
This is the one prospectively qualified pair. Predictable does not mean
beneficial: full Kider RMSE becomes 11.453643 versus baseline 11.419630.

**Incoming x transport conclusion.** Both affect J2 onward and show substantial
low-elevation responses. Their additive prediction fails despite high sign
agreement; maximum group vector error is 63.22%. The shared recurrence creates
material coupling at these settings. There was no full 17-time validation of
this pair.

**Other pairs conclusion.** Altitude/transport and outgoing/incoming factorials
measure relationships that a future predictor must consider. They do not
constitute passed prospective magnitude forecasts or prove independence at
other settings.

Evidence: screen predictions 00045/00046, targets 00048/00049, checks
[00050](../../../../../tmp/experiments/sky-accuracy-dials/runs/00050-prediction-check/result.json)/
[00051](../../../../../tmp/experiments/sky-accuracy-dials/runs/00051-prediction-check/result.json),
factorials 00052/00053; full prediction 00064, target 00065,
[check 00066](../../../../../tmp/experiments/sky-accuracy-dials/runs/00066-prediction-check/result.json),
factorial 00067. The unforecast pairs use targets 00031/00032 and factorials
00039/00040.

### Reconstruction interaction and score cancellation are different

**Diagnostic question.** After observing opposite source-refinement score
trends under cached and analytic first order, test whether reconstruction
amplifies the response, or whether the same response is helping different
baseline residuals. These complete comparisons were retrospective, not locked
predictions.

**Test.** Compared source S20/40/80 and transport T40/T160 with grouped cached
first order versus analytic first order, using all 17x81x40 numerical samples
and registered 31-channel scores. Grouping was held consistent.

| Source intervals | Grouped cached-J1 full Kider RMSE | Analytic-J1 full Kider RMSE |
| ---------------: | --------------------------------: | --------------------------: |
|               20 |                         11.419607 |                   11.590149 |
|               40 |                         11.595963 |                   11.519967 |
|               80 |                         11.659487 |                   11.509234 |

**Outcome.** Source refinement has a real representation interaction of
0.319331 RMS, about 27.45% of the cached source-response norm. Cached
first-order reconstruction amplifies the source response in this comparison,
most strongly at 09:30.

However, that interaction is not the main reason the score trend reverses.
For baseline residual e = L - measurement and radiance change delta,

`deltaSSE = 2 e dot delta + norm(delta)^2`.

Using the same cached-source change with the analytic baseline residual already
predicts an improvement. The actual interaction reduces that improvement.

Transport supplies a cleaner control: its representation interaction is only
5.87e-15 RMS, effectively roundoff. Almost exactly the same radiance change
improves grouped Kider RMSE by 0.106902 but worsens analytic-first-order RMSE
by 0.033721.

**Conclusion.** Both mechanisms exist. Reconstruction can change a refinement's
radiance response, and baseline error cancellation can reverse the benefit of
an otherwise identical response. A score reversal alone cannot establish
interpolation amplification. Even additive radiance changes can have
nonadditive SSE because the score is quadratic.

Evidence: [source-by-representation report](../../../../../tmp/experiments/sky-accuracy-dials/runs/00095-source-repr/report.md)
and [transport-by-representation control](../../../../../tmp/experiments/sky-accuracy-dials/runs/00096-transport-repr/report.md).

## Where The Remaining Errors Are Concentrated

**Diagnostic question.** The user proposed tracing the worst 12:30 points,
early-morning behavior and scattering-order contributions. This analysis maps
already observed residuals; it does not isolate their physical cause.

**Test.** Compared full registered baseline spectra with S80/T160, retaining
every point's residual, Sun separation, elevation and effective first/higher
contributions. Used equal weights over the 81 rays and 31 registered channels.

| Time  | Condition RMSE, baseline -> finer | Worst grid point | Point RMSE, baseline -> finer | Point share of condition SSE |
| ----- | --------------------------------: | ---------------- | ----------------------------: | ---------------------------: |
| 09:30 |              13.24549 -> 13.30226 | (4,7)            |          57.95220 -> 52.51182 |             23.63% -> 19.24% |
| 10:15 |                9.28501 -> 9.54492 | (3,6)            |          30.66851 -> 33.91823 |             13.47% -> 15.59% |
| 12:30 |              18.51321 -> 18.28861 | (3,5)            |        137.07112 -> 133.89514 |             67.68% -> 66.17% |

**Outcome.** The worst location remains the same in 16/17 conditions.
At 09:30, the worst point is 7.37 degrees from the Sun and too dim;
brightening helps it. Neighboring points (5,7) and (3,7) are already too bright
in every scored channel, so brightening hurts them. The 10:15 worst point is
too bright, while the 12:30 worst point, 5.11 degrees from the Sun, remains
too dim in every scored channel.

The noon hotspot alone contributes 10.46% of baseline all-time SSE and 9.92%
after refinement. In contrast, at 13:00-13:30 low-elevation directions
contribute about 57-62% of condition SSE and contain the worst points.

**Conclusion.** Integration refinement explains only a small part of the large
persistent noon residual. Time and Sun proximity alone do not determine whether
brightening helps. Errors are not uniformly solar, and the N6 broad
low-elevation response differs from the concentrated solar discrepancy.
Persistent locations do not prove shared physical inaccuracies: phase behavior,
atmosphere, reconstruction, geometry, measurement footprint and measurement
error remain possible contributors.

Evidence: [spatial report](../../../../../tmp/experiments/sky-accuracy-dials/runs/00097-residuals/report.md),
[all-time point table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00097-residuals/points.csv),
and [noon figure](../../../../../tmp/experiments/sky-accuracy-dials/runs/00097-residuals/noon-residuals.svg).
The figure uses grid indices and equal before/after color scales, not an
equal-angle dome.

## Full-Score Results And Forecast Calibration

These rows use all 17 times, 81 directions and 31 registered channels.
Except for the named intervention, they retain P48/W27/F68, cumulative N4,
original Q30 view integration and the physical control.

| Source intervals | Transport intervals | Full Kider RMSE | 12:30 RMSE |
| ---------------: | ------------------: | --------------: | ---------: |
|               20 |                  40 |       11.419630 |  18.513209 |
|               40 |                  40 |       11.595982 |  18.322975 |
|               80 |                  40 |       11.659505 |  18.276461 |
|               20 |                  80 |       11.325263 |  18.545771 |
|               20 |                 160 |       11.312726 |  18.558429 |
|               80 |                 160 |       11.453643 |  18.288612 |

The sealed spectral predictions imply score forecasts through the residual
equation above. The following values use only the fourteen intervention-held
conditions. They are derived score forecasts, not an additional acceptance
gate fitted after execution.

| Intervention                              | Predicted aggregate RMSE change | Observed aggregate RMSE change | Largest per-time forecast error |
| ----------------------------------------- | ------------------------------: | -----------------------------: | ------------------------------: |
| Source 40->80                             |                       +0.055487 |                      +0.061363 |                        0.025759 |
| Transport 80->160                         |                       -0.010294 |                      -0.010264 |                        0.001228 |
| Source 80 + transport 160 versus original |                       +0.050984 |                      +0.043382 |                        0.036659 |
| Segmented view 4->8                       |                       -0.002123 |                      -0.002227 |                        0.001206 |

The campaign contains 13 locked prediction assessments: seven passed and six
were rejected. Repeated screens and full checks are related validations, not
13 independent discoveries. All failures retain their original thresholds.

## Factors Not Resolved By This Campaign

| Factor                                    | What was established                                            | What remains untested or unqualified                                                                          |
| ----------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| RGB conversion and app graying            | B1 scores spectral radiance before RGB/display processing       | No app color/display experiment was performed; RGB cannot cause differences in these retained spectral scores |
| Atmosphere, aerosol phase/profile, ground | Physical inputs remained fixed to isolate numerical changes     | No parameter or alternative-physics sweep; no identification of the noon hotspot's physical cause             |
| Measurement geometry and footprint        | Existing fitted geometry and point samples were preserved       | No independent geometry calibration or finite instrument-footprint experiment                                 |
| Precision and geometry robustness         | Matched baseline, repeatability and prefix checks passed        | No systematic precision ladder, alternate root solver or geometry perturbation study                          |
| Factorized higher-order fields            | First-order density diagnostic strongly improved reconstruction | No regenerated factorized multiple-scattering solver                                                          |
| Angular and altitude error laws           | Local sensitivities and some interactions were measured         | No generally successful quantitative predictor or comprehensive full-score ladder                             |
| Scattering tail                           | N5/N6 additions remain material in two channels                 | No full-spectrum N6 or converged infinite-order reference                                                     |
| Transfer and combinations                 | One source/transport pair passed prospective tests              | No universal combination rule, other-atmosphere validation or true horizon/sunset qualification               |

The lowest benchmark ray is about 12.1 degrees above the horizon. References
to low elevation or a retained "near-horizon" group must not be read as proof
for grazing rays. No measurement-uncertainty model was established, so small
score differences are not claims of statistical significance.

## Overall Conclusion And Carry-Forward

The campaign did more than solve a single integration problem: it tested a
broad set of mechanisms and obtained direct evidence for several forms of
compensation and coupling. Its **validated tuning capability is narrower than
that investigation**. Three integration controls and one pair have local
prospective support. Altitude, angular resolution, representation and order
count do not yet form a general predictable accuracy model.

The combined explanation is:

1. Integration rules can introduce opposite radiance biases even without
   interpolation. Source attenuation and transported radiance are different
   integrals, so increasing both counts need not move the answer the same way.
2. Reconstructed fields introduce changes in slope and angular structure.
   A finer integrator can sample those features differently, breaking a smooth
   response model even when the correction's total size appears reasonable.
3. A local reconstruction change propagates through higher scattering orders.
   The P55 first-order prediction was accurate for its component but incomplete
   for the full sky.
4. Numerical convergence and measurement fit are different questions.
   Density factorization improves a controlled numerical reference while
   worsening Kider. The transport representation control shows that even an
   unchanged radiance response can reverse its score benefit when the baseline
   residual changes.
5. Order truncation is coupled to sampling. Added orders remain material and
   their contribution decreases under finer transport/incoming integration,
   but there is no established converged reference.
6. The largest remaining measurement residuals are not explained by the
   integration controls alone. Their spatial persistence narrows where to
   investigate but does not identify a unique physical cause.

For the next stage, the useful deliverable is a **qualified local prediction
method and a map of unresolved mechanisms**, not a single recommended "high
accuracy" preset. Numerical-reference error, predicted spectral response and
Kider agreement should remain separate reported quantities.

The following are carry-forward proposals, not completed experiments:

- Establish a progressively converged reference with explicit remaining-error
  estimates before treating lower Kider RMSE as evidence of numerical accuracy.
- Test regenerated coefficient-based representations, since frozen J1
  substitutions cannot determine their higher-order behavior.
- Develop angular and altitude response models that predict spatial/spectral
  patterns as well as total correction size; retain failed gates.
- Extend combination tests where mechanisms share the recurrence, especially
  incoming integration with transport and representation changes.
- Trace the persistent solar hotspot with controlled phase, geometry or
  footprint hypotheses only after their numerical controls are explicit.
- Repeat successful predictions on new physical/observer conditions before
  making general accuracy-setting claims.

Predictability was achieved in a limited, useful region of the algorithm.
Understanding enough to tune the whole algorithm predictably remains work
for the next stage.

## Evidence Package

All scientific evidence resides under
`tmp/experiments/sky-accuracy-dials/runs/`; numbered references in this report
identify those immutable run directories. The consolidated summary records
parent inputs, selectors, equations, implementation/tool identities, material
parameters and artifact hashes.

- [Consolidated report and reproducibility guide](../../../../../tmp/experiments/sky-accuracy-dials/runs/00098-campaign-summary/report.md)
  indexes model selectors, costs, prediction scopes and normalized CSV joins.
- [Machine-readable scorecard](../../../../../tmp/experiments/sky-accuracy-dials/runs/00098-campaign-summary/scorecard.json)
  retains complete numerical rows, including separate N6 indexes.
- [Summary verification](../../../../../tmp/experiments/sky-accuracy-dials/runs/00098-campaign-summary/verification.json)
  checks the retained inventory and independently reconstructs scores.
- [Full 17-time Kider curves](../../../../../tmp/experiments/sky-accuracy-dials/runs/00098-campaign-summary/figures/006-kider.svg)
  and [combined source/transport forecast](../../../../../tmp/experiments/sky-accuracy-dials/runs/00098-campaign-summary/figures/prediction-10-0.svg)
  show the qualified controls.
- [Status and reproduction commands](status.md) own the 99-run inventory,
  storage totals, source verification and execution instructions.

Qualified integration counts change work without enlarging the baseline cache
grid. Recorded full-run elapsed times include browser/setup/capture overhead,
so they are not isolated kernel benchmarks. Outgoing-grid memory estimates
exclude additional runtime overhead. No production promotion or display
change follows automatically from these results.
