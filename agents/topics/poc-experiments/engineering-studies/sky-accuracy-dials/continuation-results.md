# Sky Accuracy Dials: Continuation Findings

The [plan](continuation-plan.md) owns cases and qualification criteria;
[status](status.md) owns current execution progress and review records.
The [first-campaign report](results.md) remains the owner of earlier findings.

## Consolidated Report And Figures

The [sealed continuation report](../../../../../tmp/experiments/sky-accuracy-dials/runs/00151-c6-closure/report.md)
consolidates the authenticated tables, scoped conclusions and
[complete twelve-figure index](../../../../../tmp/experiments/sky-accuracy-dials/runs/00151-c6-closure/report.md#figures).
Useful entry points for the mechanisms discussed here are:

- [Selected-point change under J1 factoring](../../../../../tmp/experiments/sky-accuracy-dials/runs/00151-c6-closure/c1-selected-point-change.png): selected 09:30/12:30 probes at four channels; not an 81-ray condition score or dome.
- [Adaptive fixed-field view error](../../../../../tmp/experiments/sky-accuracy-dials/runs/00151-c6-closure/c3-adaptive-fixed-field-error.png): forty component probes, with query caps on the horizontal axis rather than runtime duration.
- [Density-by-altitude interaction](../../../../../tmp/experiments/sky-accuracy-dials/runs/00151-c6-closure/c3-density-altitude-interaction.png): three times, 81 rays and six numerical channels at grouped view16.
- [Incoming local J2 discrepancy](../../../../../tmp/experiments/sky-accuracy-dials/runs/00151-c6-closure/c3-local-j2-discrepancy.png): exact-ground source-density outputs with admitted angular allowances; not sky-radiance RMSE.
- [Joint spectral and SSE interaction](../../../../../tmp/experiments/sky-accuracy-dials/runs/00151-c6-closure/c4-sse-interaction.png): separate complete screen conditions, excluding overlapping geometry groups from totals.

The index also separates historical full seventeen-time Kider curves from the
four pages of new three-time screens. No new complete seventeen-time curve or
noon dome is implied. The [C5 decision](../../../../../tmp/experiments/sky-accuracy-dials/runs/00151-c6-closure/c5-decision.json)
retains the missing full-boundary reference admission; it is not an accuracy pass.

## First-Order Accuracy And Error Cancellation

The final-view J1 factorization is a substantial first-order accuracy correction
on the frozen component probes, even though it worsens their N4 measurement fit.
This is a measured example of numerical errors cancelling other discrepancies.

The [physical reference](../../../../../tmp/experiments/sky-accuracy-dials/runs/00109-c1-physical-j1/reference.json)
resolves all 40 selected rays at channels 0/8/24/30 using independent distance
Gauss and square-root-altitude Simpson formulations. A single expanded work
profile raises only Simpson's medium-evaluation cap; tolerances are unchanged.
The [assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00110-c1-j1-assess/report.md)
compares those values with independently integrated frozen H fields.

| Quantity, on the same 160 scalar samples |    Raw J1 | Factored J1 |
| ---------------------------------------- | --------: | ----------: |
| First-order numerical error RMS, mW      |  9.007519 |    1.136737 |
| N4 component measurement RMSE, mW        | 30.858384 |   32.627954 |

First-order error norm falls by 87.38%. All 33 predeclared groups pass the
reference-backed reduction gate; 154 of 160 individual scalar comparisons pass.
The selected points deliberately emphasize difficult regions. These four-channel
component scores are not the full 17-time, 31-channel B1 score.

For measured radiance M and physical first-order reference P, define

```text
r = L4 - M
n = L1 - P
p = L4 - L1 + P - M
r = n + p
SSE = ||n||^2 + ||p||^2 + 2 n·p
```

| Summed term, W² on the 160 samples  |       Raw J1 | Factored J1 |
| ----------------------------------- | -----------: | ----------: |
| First-order numerical-error squares |  0.012981665 | 0.000206747 |
| Remaining-discrepancy squares       |  0.164354106 | 0.164354106 |
| Cancellation/alignment term, 2 n·p  | -0.024977391 | 0.005772489 |
| Total measured residual SSE         |  0.152358379 | 0.170333342 |

The numerical-error term decreases by 0.012774917 W², but the cross term grows
by 0.030749880 W². The resulting measured SSE increases by 0.017974963 W².
The remaining contribution agrees between representations within floating-point
error. Its contents include higher-order numerical errors, omitted scattering
orders and physical/observation discrepancy; this result does not identify it
as physics alone. Full values and propagated allowances are retained in the
[group table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00110-c1-j1-assess/groups.csv).

The causal isolation check passes exact coordinate equality, 18 J2-J4 field
hashes and 29,160 raw cumulative spectral values. Current L1 transport computes
direct scattering analytically, so changing only final-view J1 does not feed
back into the later-order fields. This result is distinct from C3's
density-factored higher-order recurrence.

## View Integration

All 2,560 fixed-field reference envelopes resolve in the two H captures. Every
one of the 192 groups with aligned ordinary screen outputs qualifies local
8-to-16 subdivision improvement. Error16/error8 ranges from 0.250090 to 0.250723;
allowance/reduction ranges from 0.1246% to 1.1750%, below the 20% gate.

For grouped N4 over the aligned 96 probe/channel values, error RMS changes from
0.023327 to 0.005843 mW with raw J1, and from 0.077047 to 0.019274 mW with factored
J1. The 10:15/12:30 references also resolve, but have no aligned ordinary midpoint
captures in these screen runs. Their count comparisons remain unassessed.

This establishes a local numerical control on the captured fields. Near-quartering
is an observed response, not a passed prospective forecast. It does not establish
cache, full-spectrum, scattering-tail or physical-model accuracy. The ordinary
screen's grouped N4/view8 RMSE changes from 11.613895 to 12.117783 mW under J1
factorization; at view16 its regression is still 0.497935 mW. View8 integration
error therefore does not explain most of that score loss. See the
[C1 analysis](../../../../../tmp/experiments/sky-accuracy-dials/runs/00105-c-analysis/report.md).

## C2 Support Evidence And Its Limits

The accepted support proof exercises local J2 quadrature, adaptive bookkeeping
and transfer, fixed-field and physical reference formulations, density recurrence
structure/lifetimes, capture integration, interaction algebra and ladder admission.
The [status](status.md#continuation-execution) owns the exact retained records and
check counts. Synthetic capture checks cover all ordinary screen rays and the
extra-time component support, with uniform reconstruction discrepancies no larger
than 3.47e-18 W.

These are manufactured/source-structure results, not new atmospheric GPU fields,
Kider outcomes or an adequate finite-N4 reference. In particular, the retained
positive-bump aliasing counterexample rules out treating the adaptive indicator
or uniform subdivision 16 as an exact reference. Density lifetime checks use an
inert WebGL dispatch; they do not themselves establish actual shader compilation,
recurrence parity or device memory. The separately authenticated C3 captures
and mechanism assessment provide the atmospheric implementation evidence below.

## Local J2 Angular Reference

The [accepted local J2 record](../../../../../tmp/experiments/sky-accuracy-dials/runs/00113-c2-local-j2/reference.json)
completed all sixteen frozen space/direction/wavelength outputs. Independent
continuous-L1 integration resolves every incident node used by the finite
angular rules. The separate angular adequacy check passes for eleven outputs;
five retain null remaining-error allowances:

| Time  | Probe (x,y) | Channels with unresolved angular allowance |
| ----- | ----------- | ------------------------------------------ |
| 09:30 | (4,7)       | 24                                         |
| 09:30 | (5,7)       | 24                                         |
| 12:30 | (3,5)       | 30                                         |
| 12:30 | (4,4)       | 24, 30                                     |

All five fail the required shrinkage of successive midpoint-rule corrections.
At 8,192 nodes, midpoint/endpoint placement differences are at floating-point
roundoff scale, but that agreement does not establish the missing convergence
condition. More sampling and agreement between two placements are therefore
insufficient by themselves to declare a reference accurate. This nonshrinking
response occurs with continuous CPU L1, so cached-L1 interpolation alone
cannot explain every incoming-quadrature difficulty. It does not establish
that the unknown true error grew.

These are local scattering-density results in W m^-3 sr^-1 nm^-1, not sky
radiance or Kider scores. They retain the exact ground-knot convention of zero
inward L1. Positive-height reflected-ground limits, GPU Float32 packing,
solar/outgoing/altitude reconstruction, finite-N4 accuracy and scattering-tail
accuracy remain outside this reference. The finite-control matrix is reused in
the C3 mechanism assessment below; completion is not a passed prospective
response forecast.

## Finite-Order Ladder And Independent First-Order Accuracy

The [sealed C2 assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00126-c2-ladder-assess/report.md)
authenticates R0-R11 and replaces the interim R1 scoring derivation. It supplies
two complementary examples: near-ground refinement reduces first-order numerical
error while worsening measurement fit, whereas outgoing refinement improves
measurement fit while increasing that numerical error. More samples therefore
cannot be judged by the measurement score or by their count alone.

The ordinary screen uses 09:30, 11:15 and 13:30, all 81 directions and measured
channels 0/8/16/24/30: 1,215 scored scalars. Channel 39 is diagnostic only.
The physical-first comparison uses the separate, deliberately biased set of
40 frozen probes at five times, including 10:15/12:30, and channels 0/8/24/30:
160 scalars. The two scopes have different weights and must not be compared as
if they were the same score. All RMS values below are in mW m^-2 sr^-1 nm^-1.

| Case | Change from parent         | Screen N4 RMSE, view8 | Physical J1 error RMS | Component N4 RMSE |
| ---- | -------------------------- | --------------------: | --------------------: | ----------------: |
| R0   | H: P48/W27/I512/S80/T160   |             11.613895 |              9.007519 |         30.858384 |
| R1   | R0, S160                   |             11.625741 |              9.137311 |         30.869096 |
| R2   | R1, T320                   |             11.619133 |              9.137311 |         30.863971 |
| R3   | R2, P55                    |             11.878874 |              0.987229 |         32.082516 |
| R4   | R3, P63                    |             11.862442 |              0.898792 |         32.088569 |
| R5   | R4, W39                    |             11.819246 |              1.059572 |         31.781549 |
| R6   | R5, W51                    |             11.804786 |              1.083869 |         31.756903 |
| R7   | R6, I2048                  |             11.745305 |              1.083869 |         31.714865 |
| R8   | R7, endpoint-aware azimuth |             11.745305 |              1.083869 |         31.714866 |
| R9   | R7, S80                    |             11.750741 |              0.999077 |         31.733465 |
| R10  | R7, T160                   |             11.748837 |              1.083869 |         31.714954 |
| R11  | R7, P55                    |             11.761029 |              1.184613 |         31.709580 |

R8-R11 branch from R7. P counts altitude nodes, W outgoing face width, I incoming
samples and S/T source/transport intervals. P55/P63 subdivide the original bottom
0-1875 m interval. These are grouped N1-N4 outputs with monotone-cubic Z180 solar
reconstruction. Screen view8 uses eight midpoints per altitude segment, so P
also changes the runtime evaluation count. The physical-first columns use
independently integrated grouped N1 and N4 fields, not the ordinary view8/view16
approximations. Exact scores and components are retained in
[scores.csv](../../../../../tmp/experiments/sky-accuracy-dials/runs/00126-c2-ladder-assess/scores.csv)
and the [physical-first groups](../../../../../tmp/experiments/sky-accuracy-dials/runs/00126-c2-ladder-assess/physical-first-groups.json.gz).

### What The Individual Factors Show

**Source integration:** S80 to S160 in H increases screen RMSE by 0.011846 mW,
mostly at 09:30, and increases independent first-order error from 9.007519 to
9.137311 mW. Subdivision 16 preserves the score regression. Finer source
quadrature has not made the reconstructed first-order result more accurate on
these probes. In the final background, R9 to R7 instead improves screen RMSE
by 0.005436 mW while first-order error still grows, from 0.999077 to 1.083869 mW.
The response of the source dial depends on reconstruction and its alignment
with the remaining discrepancy.

**Transport integration:** T160 to T320 leaves J1 unchanged and improves screen
RMSE by 0.006608 mW initially and 0.003533 mW in the final background. The
assessment passes all 144 available invariance groups. For R1 to R2 on the
component probes, the remaining-discrepancy squares increase by 0.000010700 W²
while the cross term decreases by 0.000061323 W². That small measured gain is
mainly increased cancellation, not evidence of independently resolved
higher-order transport accuracy.

**Near-ground altitude resolution:** P48 to P55 at R2 to R3 reduces first-order
error by 89.20%, but raises screen RMSE by 0.259741 mW. Loss of cancellation
explains the component-score regression, as quantified below. P55 to P63 reduces
first-order error further at both tested backgrounds. It improves each ordinary
screen aggregate while slightly worsening each biased component aggregate.
This is evidence for a first-order accuracy correction with a scope-dependent
measurement response, not a universal score-improving preset.

**Outgoing resolution:** W27 to W39 to W51 lowers screen RMSE at both steps,
but increases physical J1 error from 0.898792 to 1.059572 to 1.083869 mW. The
component score also improves; its gain is dominated by a more negative cross
term while the remaining-discrepancy squares change little. The successive
spectral steps shrink, but their per-time direction cosines are only
0.630-0.752 and their norm ratios range from 0.296 to 0.550. These non-nested
layouts have not established a stable extrapolation law or an outgoing-error
remainder. W51 is the planned layout ceiling, not a convergence certificate.

**Incoming count and placement:** I512 to I2048 leaves J1 unchanged and improves
screen RMSE by 0.059481 mW. Here the component remaining-discrepancy squares
decrease; the cross term becomes slightly less favorable. This is a different
balance from the outgoing result. Endpoint-aware azimuth at I2048 changes the
screen score by only +0.000000524 mW. Such same-count agreement does not bound
angular error: the independent local J2 reference above retains five unresolved
allowances, and no complete J2-J4 angular remainder is established here.

### Signed Component Attribution

The assessment reauthenticates physical J1 reference `00109` and evaluates
`n = L1 - P`, `p = L4 - L1 + P - M` and `r = n + p` at the identical 160
probe/channel pairs. In this ladder, p changes with each construction. It
includes higher-order numerical error, scattering tail and physical/observation
discrepancy; it is not physics alone. The following changes in summed squared
spectral radiance use the same W² shorthand as the C1 decomposition above.
Positive change in total SSE means a worse fit on these component probes.

| Intervention            | Change in n² | Change in p² | Change in 2 n·p | Change in measured SSE |
| ----------------------- | -----------: | -----------: | --------------: | ---------------------: |
| P48 to P55, R2 to R3    | -0.013202533 | +0.000080553 |    +0.025394479 |           +0.012272499 |
| W27 to W51, R4 to R6    | +0.000058711 | -0.000008192 |    -0.003438571 |           -0.003388052 |
| I512 to I2048, R6 to R7 |            0 | -0.000462311 |    +0.000035394 |           -0.000426917 |
| S80 to S160, R9 to R7   | +0.000028259 | -0.000010785 |    -0.000206297 |           -0.000188823 |
| P55 to P63, R11 to R7   | -0.000036566 | -0.000261013 |    +0.000351209 |           +0.000053629 |

The first row removes a large negative numerical bias that had hidden another
discrepancy. The second row adds first-order numerical error while moving it
into better cancellation. Together they directly demonstrate both directions
of the accuracy-versus-score problem. They do not identify the unknown
higher-order numerical error separately from the other contents of p.

All 1,920 scalar J1/decomposition comparisons resolve. The largest absolute
group SSE-identity residual is 1.53e-16 W². Physical J1 is the mean of its
independent Gauss/Simpson formulations, with their retained empirical allowance;
each J1 error allowance adds the matching fixed-field integration allowance.
For a matched R0-to-rung reduction D, the conservative paired U is the L2 norm
of the scalar sums of both error allowances. Gates require `U <= 0.2 D` and
`D > 2 U`. The all-probe group qualifies R3-R11 relative to R0; R0 has zero
reduction and R1/R2 regress. This does not certify every adjacent step or every
subgroup. The allowances are empirical, not statistical confidence intervals
or rigorous whole-solver bounds. Complete group gates, selectors and scalar
terms remain in the compressed physical-first tables.

### Background Dependence And Reference Limits

The [background table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00126-c2-ladder-assess/backgrounds.json.gz)
compares the same intervention at two backgrounds. The vector ranges below use
grouped N4/view16, separately at each of the three screen times, all 81 rays and
all six numerical channels. A cosine near one means a similar spectral response
direction, not similar error or measured benefit.

| Dial         | Initial versus final response | Final/initial norm range | Direction cosine range |
| ------------ | ----------------------------- | -----------------------: | ---------------------: |
| S80 to S160  | R1-R0 versus R7-R9            |            0.7203-0.7621 |          0.9879-0.9930 |
| T160 to T320 | R2-R1 versus R7-R10           |            0.8320-0.9219 |          0.9872-0.9911 |
| P55 to P63   | R4-R3 versus R7-R11           |            1.0206-1.0211 |        0.99969-0.99993 |

Source and transport responses are smaller in the final background, even
though their directions remain similar. P55-to-P63 is much more stable in
shape and grows by about 2.1%. These are measured combined-background effects;
several other controls differ together, so they do not identify individual
factorial interactions. In particular, a similar response vector can reverse
its score effect when the residual it acts upon changes.

All 15,360 captured fixed-field envelopes resolve. Of 2,400 registered local
view groups, 1,392 qualify the 8-to-16 reduction gate, none reject it and 1,008
are unavailable. Missing ordinary views at 10:15/12:30 and empty geometry groups
must not be counted as failed reference integrations. This establishes local
view controls on available captured fields, not recurrence or cache accuracy.
The [adequacy table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00126-c2-ladder-assess/adequacy.csv)
retains missing outgoing/angular remainders and other material terms; the whole
finite-N4 allowance remains null. R7's screen RMSE is 0.131410 mW worse than H
despite its much smaller first-order error. Calling the largest profile the
reference would conceal that unresolved distinction.

These are retrospective mechanism comparisons and local reference checks.
They contain no new prospective prediction, incoming quarter-law retry or
full 17-time/31-channel qualification. Reduced sensitivity, improved J1, a
better Kider score and complete finite-N4 accuracy remain separate claims.

## Operational And Representation Mechanisms

The [sealed C3 assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/report.md)
authenticates ten mechanism captures and both historical H parents. Its
[registered catalog](../../../../../tmp/experiments/sky-accuracy-dials/runs/00127-c-mechanisms/mechanisms.json)
records qualitative questions before execution, with unknown response magnitudes
and no required prospective forecast for these C3 cases. The findings below are
retrospective mechanism tests. C4 owns separate prospective tests.

Ordinary Kider scores retain the three-time, 81-ray, five-measured-channel scope
defined above. Numerical screen vectors include diagnostic channel39. The
40 frozen component probes are deliberately biased, and the four exact-ground
probes have a still narrower scope. Neither represents the full seventeen-time
boundary. The [summary](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/summary.json)
retains selectors, parent identities and complete qualification limits.

### V: Adaptive View Sampling

**Original prediction and test.** The registered hypothesis was that allocating
subdivisions from emission and downstream attenuation responses might reduce
fixed-field integration error at matched total evaluation budgets. The magnitude
was unknown. The same method was tested on H and final-J1-factored H, preserving
each representation's grouping and regenerated higher orders. Uniform and
adaptive evaluations use budgets of 4P, 8P and 16P; every trial query counts.
Independent fixed-field envelopes supply the reference instead of treating
uniform16 as exact. Ordinary N1-N4 parity against both historical parents passes.

**Observed numerical outcome.** Each row below compares N4 on the same 160
component probe/channel values. RMS errors are in mW m^-2 sr^-1 nm^-1. The last
column counts scalar comparisons passing the empirical reduction/worsening
gate, followed by unresolved comparisons.

| Background  | Budget | Uniform error RMS | Adaptive error RMS | Improved / worsened / unresolved |
| ----------- | ------ | ----------------: | -----------------: | -------------------------------- |
| Raw J1      | 4P     |       0.086658131 |        0.007864972 | 160 / 0 / 0                      |
| Raw J1      | 8P     |       0.021827156 |        0.005519018 | 160 / 0 / 0                      |
| Raw J1      | 16P    |       0.005466960 |        0.005468210 | 0 / 0 / 160                      |
| Factored J1 | 4P     |       0.305409402 |        0.042540896 | 158 / 2 / 0                      |
| Factored J1 | 8P     |       0.076546020 |        0.019550702 | 158 / 0 / 2                      |
| Factored J1 | 16P    |       0.019148666 |        0.019177719 | 2 / 1 / 157                      |

The N4 reference-allowance L2 norms are 0.000904593 mW for raw J1 and
0.001765381 mW for factored J1. Across overlapping orders, budgets and backgrounds,
the assessment records 2,553 improved, 15 worsened and 1,272 unresolved scalar
comparisons. These counts are not independent whole-sky samples. The
[adaptive table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/adaptive.json.gz)
retains individual failures and allowances.

At 8P, adaptive RMS is within about 1% of uniform16 for raw J1 and 2.1% for
factored J1. Across 259 prepared rays and six channels, adaptive8 queries
590,768 nodes for raw J1 and 593,512 for factored J1, against a 596,736 cap;
uniform16 requires 1,193,472 nodes. Each ray/channel has caps of 192, 384 and
768 queries at 4P/8P/16P. Adaptive4 uses all 298,368 available queries;
adaptive16 uses 1,186,176 raw and 1,179,888 factored queries. Counts include
rejected trial nodes. The prepared 31P midpoint union is separate construction
work, and successive budget checkpoints are cumulative prefixes that must not
be added. These are observed query-efficiency gains, not measured wall-clock
speedups. The [work table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/adaptive-work.json.gz)
also separates medium evaluations and scalar reconstructions.

The ordinary raw-J1 screen RMSE changes from 11.616379063 to 11.613325603 mW
at 4P and from 11.613894738 to 11.613323728 mW at 8P. Despite local numerical
improvement, raw 13:30 worsens by 0.012353929 and 0.002627579 mW respectively.
Factored-J1 screen RMSE changes from 12.144315511 to 12.114363991 mW at 4P and
from 12.117782696 to 12.111375121 mW at 8P, with improvement at all three times.
At 16P there is no general benefit: the adaptive screen scores are slightly
worse than uniform, by 2.62e-9 mW raw and 0.000009337 mW factored. Exact scores
are retained in [adaptive-scores.csv](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/adaptive-scores.csv).

**Conclusion.** Adaptive allocation is a useful local numerical and
query-efficiency control at the tested lower budgets, with explicit failures
and a practical saturation point. It has no universal monotonic guarantee.
Improved view integration can still worsen a measured time slice, and the
near-uniform16 efficiency result is descriptive rather than a passed
prospective quantitative forecast. Recurrence, cache and whole-N4 accuracy
remain separate questions.

### D: Higher-Order Density Representation

**Original prediction and test.** The registered questions were to measure
species grouping/storage effects before moving density evaluation to query
locations, then test whether that change alters altitude-refinement response.
No magnitude or guaranteed Kider improvement was predicted. A complete
three-representation by two-altitude matrix compares combined raw, split-species
raw and density-factored J2-J4 at P48/P55. It preserves analytic L1 and raw final
J1, uses H's S80/T160/I512/W27 controls, and regenerates affected higher orders.
This distinguishes moving density from merely separating species; Float32
storage and recurrence feedback are not independently isolated.

The ordinary grouped N4 scores below include D and I cases so their measurement
responses can be compared on identical support. Units are mW m^-2 sr^-1 nm^-1.
These P55 cases use H's controls, not C2 R3's S160/T320 background.

| Case           |   View8 RMSE |  View16 RMSE |
| -------------- | -----------: | -----------: |
| H / R0         | 11.613894738 | 11.613319083 |
| D48 split      | 11.613893350 | 11.613317694 |
| D48 factored   | 11.630707233 | 11.631158446 |
| D55 raw        | 11.887073042 | 11.887165449 |
| D55 split      | 11.887072029 | 11.887164436 |
| D55 factored   | 11.909841682 | 11.909809573 |
| I512 endpoint  | 11.613877092 | 11.613301080 |
| I512 aspect    | 11.750294976 | 11.750458821 |
| I2048 endpoint | 11.579667564 | 11.578994348 |

The [ordinary score table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/scores.csv)
retains all times, groups and orders. Positive score change below means worse fit.

**Observed representation outcome.** At view16, combined-to-split N4 response
RMS is only 0.000032102 mW at P48 and 0.000016451 mW at P55 across all 1,458
numerical scalars. Split-to-factored response RMS is 1.230521337 mW at P48 and
0.173814138 mW at P55, with mean changes of -0.847622764 and -0.138338764 mW.
Factoring predominantly darkens the spectral output in this scope. Its Kider
RMSE changes are +0.017840752 mW and +0.022645137 mW. N1 is identical within each
altitude; N2 is the first affected order. The grouping effect is small compared
with moving density evaluation, but it is not assumed to be roundoff alone.

For P48 factoring, the measurement SSE response is the sum of an alignment
term -0.001677591 W² and a squared-change term +0.002181450 W², producing
+0.000503859 W². At P55, both terms are positive: +0.000613364 and +0.000041383
W², producing +0.000654746 W². These are signed response/residual identities,
not a decomposition into independently known higher-order numerical and
physical errors.

**Observed altitude interaction.** Whole-N4 P48-to-P55 response RMS falls from
3.938372070 mW with split raw to 3.361937744 mW with factoring. That roughly
14.64% reduction alone overstates the change in higher-order sensitivity because
the first-order altitude response is unchanged. Subtracting each contrast's N1
vector from its N4 vector gives the following higher-order altitude responses:

| Scope, view16   | Split raw RMS, mW | Factored RMS, mW |
| --------------- | ----------------: | ---------------: |
| All three times |       1.490058435 |      1.473591633 |
| 09:30           |       1.311002838 |      1.163063200 |
| 11:15           |       1.507027195 |      1.539263219 |
| 13:30           |       1.634308114 |      1.671038491 |

The aggregate higher-order norm falls only 1.1051%, while its direction cosine
is 0.736615. The reduction is 10.2963% at N2 and 4.4966% at N3 before shrinking
to 1.1051% at N4. Sensitivity grows at two of the three times. These are grouped
`L_N - L1` responses, not separately reconstructed pure higher-order increments.
The calculation reads the sealed
[spectral layout](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/density-spectrum-layout.json.gz)
and [binary vectors](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/density-spectra.f64.gz),
subtracts matched N1 from N4 altitude-contrast vectors, and computes
`sqrt(sum(delta^2) / count)` over all six channels without pruning.

The density-by-altitude interaction vector has RMS 1.075602120 mW at N4/view16;
grouping-by-altitude is only 0.000030436 mW. The measured factorial SSE interaction
is +0.000150887 W². This must be distinguished from the interaction's correction
to an additive spectral prediction: -0.007845013 W², comprising
`2 r_additive dot interaction = -0.009493515 W²` and
`||interaction||^2 = 0.001648501 W²`. The additive SSE cross term is
+0.007995900 W². The [contrast table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/density-contrasts.json.gz)
retains their exact equations and identities.

**Conclusion.** Density factoring has a substantial, altitude-dependent effect
that the grouping control cannot explain. It does not strongly or uniformly
reduce higher-order altitude sensitivity, and it worsens the aggregate Kider
score at both tested altitudes. Independent integration of each new field
qualifies its final view integration, not the accuracy of its regenerated
recurrence. No complete higher-order reference establishes which representation
is numerically closer to the pinned N4 problem.

### I: Incoming Distribution And Count

**Original prediction and test.** The catalog predicts J1 invariance and J2 as
the first potentially affected density when incoming sampling changes. It
separately tests endpoint-aware azimuth at I512, an equal-count 8-cosine by
64-azimuth rule against 16 by 32, and endpoint count refinement to I2048
(32 by 64). Response magnitudes and Kider improvement were unknown. Ordinary
spectra and four exact-ground probes at 09:30/12:30, channels0/8/24/30, are
compared with the independent continuous-L1/local-J2 reference. H's ground taps
come from V-raw only after generation equality and ordinary N1-N4 parity.

**Observed outcome.** J1 invariance passes. The ordinary screen scores are in
the table above: endpoint placement has a tiny gain, exchanging cosine for
azimuth resolution worsens the score, and the larger endpoint count improves
it. Local source-density outcomes in W m^-3 sr^-1 nm^-1 are more constrained:

| Change                    | Qualified improved | Qualified worsened | Unresolved |
| ------------------------- | -----------------: | -----------------: | ---------: |
| I512 midpoint to endpoint |                  0 |                  0 |         16 |
| I512 16x32 to 8x64 aspect |                  0 |                  7 |          9 |
| Endpoint I512 to I2048    |                  0 |                  0 |         16 |

Placement changes density by at most 3.313761895e-10. The seven qualified aspect
regressions are 09:30 (4,7), channels0/8/30; 09:30 (5,7), channels0/8; and channel0
at both 12:30 probes. Fifteen of sixteen nominal absolute errors increase.
Endpoint count refinement nominally reduces thirteen errors and increases three.
Its descriptive error RMS falls from 2.012745157e-8 to 1.005019246e-8, but none
passes the required allowance gate. That descriptive aggregate includes five
unresolved angular references and is not a qualified error reduction. The
[density table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/incoming-density.json.gz)
preserves all values and null allowances.

**Conclusion.** Distribution matters independently of count, and the tested
trade toward azimuth resolution has clear local failures. Larger endpoint count
has a favorable observed response but insufficient local reference separation
to qualify improvement. Endpoint and aspect cases have no matched finite
binary64 CPU controls; their GPU/reference residuals include finite S/T,
Float32 packing and reconstruction as well as angular error. Eleven adequate
local envelopes cannot establish a full J2-J4 angular remainder or N4 accuracy.

A source-derived explanation remains a hypothesis, not an isolated result.
Here the local cosine is radial/up cosine. The rule retains positive nodes and
their original weights from full-interval Gauss quadrature and prescribes zero
inward L1 at the ground. Both azimuth placements share cosine nodes, so their
agreement cannot test grazing-direction resolution. Outward grazing paths
remain finite but their radiance varies rapidly; the symmetric extension
implicit in the half-rule can have a cusp. A constant hemisphere step alone
is integrated exactly by symmetric weights, so a discontinuity alone does not
explain the five failed envelopes. The aspect result motivates testing this
axis but does not prove that it caused those failures. The relevant source is
[angular.mjs](../../../../../experiments/sky-accuracy-dials/continuation/j2/angular.mjs)
and [physical radiance](../../../../../experiments/sky-accuracy-dials/continuation/reference/physical/radiance.mjs).

### Finite Source And Transport Cancellation Without Interpolation

**Original question and test.** The retained local-J2 controls separate finite
source/transport integration from angular discretization using a complete
S80/S160 by T160/T320 matrix at both midpoint I512 and I2048. This is reference
diagnosis, with no registered prospective response magnitude. The binary64
finite-path calculation uses physical medium/source evaluation at exact ground
geometry; it contains no spatial or solar cache reconstruction. Each finite
result is compared with continuous-L1 integration under the same angular rule.

**Observed outcome.** RMS density differences across all sixteen outputs are:

| Midpoint angular rule | S/T     | Finite-minus-continuous RMS, W m^-3 sr^-1 nm^-1 |
| --------------------- | ------- | ----------------------------------------------: |
| I512                  | 80/160  |                                  1.328753674e-8 |
| I512                  | 160/160 |                                  1.744298189e-8 |
| I512                  | 80/320  |                                  2.087861880e-9 |
| I512                  | 160/320 |                                  3.345387471e-9 |
| I2048                 | 80/160  |                                  1.352529416e-8 |
| I2048                 | 160/160 |                                  1.772289908e-8 |
| I2048                 | 80/320  |                                  2.013047226e-9 |
| I2048                 | 160/320 |                                  3.405480046e-9 |

T320 reduces the aggregate discrepancy substantially, while S160 increases it
at both T levels. At 09:30 (4,7), channel0 and I512, the signed differences are
+1.052578427e-8 for S80/T160, +1.790955980e-8 for S160/T160,
-4.580081014e-9 for S80/T320 and +2.669557359e-9 for S160/T320. Increasing S
worsens absolute error on coarse T but improves it on fine T at this point.
These figures summarize the authenticated
[finite-control table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00139-c3-mech-assess/incoming-finite-controls.json.gz);
the same-rule reference's allowance covers propagated L1 integration only,
not the angular remainder to a continuous angular solution.

H's GPU-minus-matched-I512 finite-CPU density difference has RMS
8.211792786e-9, showing another material distinction between the finite path
calculation and the captured implementation. It must not be silently assigned
entirely to angular error.

**Conclusion.** Nonmonotonic refinement already occurs among source/path
quadratures before spatial interpolation is introduced. The signed example
exposes cancellation between discretization contributions, rather than a
measurement-only effect. Interpolation and recurrence feedback can add further
errors, but they cannot explain every refinement reversal. These local density
controls do not establish a general S/T convergence law or integrated N4 accuracy.

## C4: Prospective Joint Responses

**Original predictions.** Three additive spectral forecasts were sealed before
their respective target captures, using `L_pred = L_A + L_B - L_H` with each
isolated intervention measured on H. The combinations were final-J1 plus
higher-order density factoring; I512 endpoint placement plus T320; and
higher-order density factoring plus I512 endpoint placement. The first was a
causal invariance prediction to roundoff because final J1 does not feed analytic
L1 or the higher-order recurrence. The other two were additive approximations
that deliberately omitted joint recurrence and nonlinear reconstruction effects.
They changed incoming placement, not incoming count, and did not promise a
Kider improvement.

**Test.** Predictions [00141](../../../../../tmp/experiments/sky-accuracy-dials/runs/00141-c-interact-pred/prediction.json),
[00143](../../../../../tmp/experiments/sky-accuracy-dials/runs/00143-c-interact-pred/prediction.json)
and [00145](../../../../../tmp/experiments/sky-accuracy-dials/runs/00145-c-interact-pred/prediction.json)
preceded targets `00142`, `00144` and `00146`. The T320-only control is `00140`.
Each forecast retains eight selectors, grouped N1-N4 at views8/16, with 11,664
predicted spectral scalars across the three-time/six-channel screen. Kider
measurements were already known; target outputs were unexecuted. This is a
prospective intervention test, not held-out measurement validation.

Each selector checks eighteen overlapping time/geometry spectral groups, using
the registered 1e-8 W significance floor, at least 90% sign agreement and at
most 25% relative vector error. Score forecasts separately require the correct
gain direction and error no larger than `max(0.25 * abs(predicted gain), 0.01 mW)`.
A useful aggregate improvement requires at least 0.01 mW at both N4 views.
None of these response gates substitutes for an adequate numerical reference.

**Observed outcomes.** All three targets pass every spectral group: 144
overlapping groups per target, with sign agreement 1 wherever resolved. The
maximum relative vector errors are 9.117406141e-15 for J1+higher,
0.0003600246923 for endpoint+T320, and 0.00006508032545 for higher+endpoint.
Each of the latter two has 36 zero-response N1 groups with null sign agreement;
those are not counted as resolved sign predictions.
Thus all three additive spectral-response predictions pass within their
registered screen scope. The N4/view16 aggregate scores are:

| Combination               |             H RMSE |     Predicted RMSE |        Actual RMSE | Actual gain versus H |
| ------------------------- | -----------------: | -----------------: | -----------------: | -------------------: |
| Final J1 + higher density | 11.613319082765448 | 12.410607994018978 | 12.410607994018982 |   -0.797288911253533 |
| Endpoint + T320           | 11.613319082765448 | 11.606893411865597 | 11.606893180394130 |   +0.006425902371319 |
| Higher density + endpoint | 11.613319082765448 | 11.631111371958909 | 11.631119643990557 |   -0.017800561225108 |

Units are mW m^-2 sr^-1 nm^-1. Positive gain means a better fit. The
[J1+higher assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00147-c-interact-check/assessment.json.gz)
passes all eight score selectors and verifies exact sparse coordinates and 36
matching higher-order field hashes. Its maximum spectral interaction is
5.551115123125783e-17 W, within the retained roundoff allowance. This confirms
the causal separation; the resulting score regression was correctly predicted.

Spectral additivity still allows a material interaction in squared measurement
error. With `dA = L_A - L_H`, `dB = L_B - L_H` and
`e = L_AB - L_A - L_B + L_H`, the measured factorial SSE interaction is

```text
SSE_AB - SSE_A - SSE_B + SSE_H
    = 2 dA dot dB + 2 r_additive dot e + ||e||^2
```

Sum only the three nonoverlapping time groups at N4/view16: 1,215 scored scalars.
For J1+higher, the SSE interaction is 0.008415138121773478 W², almost exactly
the additive cross term 0.008415138121773480 W². The feedback cross term is
-2.843114849e-18 W² and `||e||^2` is 1.310234215e-32 W². Thus a substantial
score interaction can exist even when the fields combine additively to
roundoff; it is predicted by squaring their combined residual.
For endpoint+T320, total SSE interaction is -2.405932521e-8 W², comprising
-1.753073016e-8 additive cross, -6.528607496e-9 feedback cross and
+1.244813591e-14 squared interaction. For higher+endpoint the corresponding
terms are -5.886421160e-7, -8.224395981e-7, +2.337936395e-7 and
+3.842577405e-12 W². Overlapping angular/elevation groups must not be added
to these totals.

The [endpoint+T320 assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00148-c-interact-check/assessment.json.gz)
and [higher+endpoint assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00149-c-interact-check/assessment.json.gz)
each pass six of eight score selectors. Their only failed selectors are N1
at both views: the actual gain is exactly zero, while score accumulation gives
forecast gains of magnitude 3.552713679e-15 to 2.131628207e-14 mW. The strict
direction check therefore fails despite negligible forecast error. These
remain failed score gates in the immutable evidence; they are not relabelled
as passes. Every N2-N4 aggregate and individual-time score forecast passes.
Across all score rows, the largest forecast errors are 5.228240969e-7 mW for
endpoint+T320 and 0.000020183851154 mW for higher+endpoint.

No combination passes the useful N4 gain criterion. Endpoint+T320 improves
the aggregate by 0.006456427 mW at view8 and 0.006425902 mW at view16, both below
0.01 mW. The other combinations regress. Predicting the joint spectrum does
not imply that the spectrum improves measurement agreement.

**Conclusion.** The three registered joint spectral responses are predictable
within this screen. J1+higher additivity has causal and field-hash support;
the other two have small measured interactions within the preregistered gates.
The N1 score failures expose a zero-response direction-gate limitation, while
the material N2-N4 score forecasts hold. These findings establish bounded
response predictability, including predictable regressions. They establish
neither a useful new Kider gain nor reference-backed whole-N4 accuracy.

## Implemented Dials And Their Qualified Scope

These controls are implemented and experimentally exercised. A control becomes
an accuracy dial only for the numerical quantity, reference and domain that
support that claim. No row below qualifies a full-boundary, score-improving
whole-solver preset. Cost descriptions identify work and storage dependencies;
they are not wall-clock speedup estimates. Exact execution debits belong to
the [status](status.md#continuation-execution).

| Dial and exercised range                                              | Location                                          | Measured or numerical-error response                                                                                                                               | Prospective status                                                                                                        | Kider outcome                                                                                                     | Cost and combination restriction                                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Source S20/40/80; S80/160 continuation                                | Generation and matching direct runtime evaluation | Source response persists; independent J1 and finite-path errors can grow on refinement because other contributions offset them.                                    | Inherited local S80 count forecast passed; continuation background comparisons are retrospective.                         | Gain direction changes with representation/background.                                                            | More source-path samples; regenerate J1 and descendants and match analytic runtime S. No universal count law.                |
| Transport T40/80/160/320                                              | Generation and recurrence transport               | J1 density remains invariant; T320 strongly reduces the local finite-path discrepancy, but whole higher-order error is unresolved.                                 | Inherited local count forecast passed; endpoint+T320 spectral forecast passes, with the preserved N1 score-gate failures. | Small H-background gain; joint N4 gain below 0.01 mW.                                                             | More path samples and regenerated descendants; incoming and representation context matter.                                   |
| Uniform altitude-segment view subdivisions 1/2/4/8/16                 | Runtime                                           | Independent fixed-field references qualify local 8-to-16 error reduction; finest view remains approximate.                                                         | Inherited sufficiently refined segmented forecast passed; C1/C2 near-quarter behavior is retrospective.                   | Time and representation can reverse score effects.                                                                | About kP midpoint evaluations per ray/channel at subdivision k; field support must be captured. P changes this cost too.     |
| Adaptive view budgets 4P/8P/16P within dyadic levels 1/2/4/8/16       | Runtime allocation                                | Lower-budget local errors improve on raw/factored J1; adaptive8 approaches uniform16 with roughly half the queried nodes; highest budget saturates.                | C3 is retrospective; no adaptive quantitative forecast is passed.                                                         | Lower-budget aggregate gains, with raw 13:30 regressions and individual numerical failures.                       | Count all trials; prepare 31P support separately. No general monotonic guarantee or measured wall-clock acceleration.        |
| Final J1 raw/grouped, continuous and density-factored representations | Runtime, with required coefficient preparation    | Independent physical-J1 error falls strongly; unchanged higher fields expose lost cancellation.                                                                    | C4 combination with higher density is additive to roundoff and passes all spectral/score selectors.                       | Selected N4 fit and combined aggregate worsen, as predicted.                                                      | Preserve matching analytic L1 and grouping; final-J1 substitution alone does not alter higher recurrence.                    |
| Near-ground P48/51/55/63                                              | Generation, also affecting segmented runtime work | P48-to-P55 removes a large J1 error; higher-order changes survive and extend beyond the edited layer.                                                              | Inherited whole-output altitude forecast failed; continuation refinements and density interaction are retrospective.      | First refinement regresses aggregate score; later effects depend on scope/background.                             | Rebuild fields/support; extra altitude nodes increase storage and kP view work. Whole-altitude redistribution untested.      |
| Outgoing W27/39/51                                                    | Generation                                        | Screen sensitivity shrinks without stable vector direction; W refinement increases independently measured J1 error on selected probes.                             | No qualified width-to-error forecast.                                                                                     | Tested aggregate improves mainly through changed cancellation.                                                    | Larger directional fields; non-nested grids and W51 layout ceiling. Outgoing-by-density combination untested.                |
| Incoming count I512/2048 in continuation                              | Generation                                        | J1 stays invariant; nominal local error often falls, but all endpoint count-reduction comparisons remain below reference qualification.                            | Two inherited simple count forecasts remain failed; C4 placement forecasts do not repair them.                            | Endpoint count improves the screen aggregate.                                                                     | More angular work in J2 onward; local J2 allowances do not bound full N4.                                                    |
| Incoming midpoint/endpoint and I512 16x32 versus8x64                  | Generation                                        | Endpoint change is small; aspect change yields seven qualified local density regressions.                                                                          | C4 placement-by-transport and placement-by-density spectral forecasts pass; their N1 score gates remain failed.           | Aspect worsens aggregate; endpoint-only gain is tiny and joint gains are absent or below the practical threshold. | Equal count does not mean equal angular resolution. Matched finite CPU endpoint/aspect controls are unavailable.             |
| J2-J4 combined raw / split raw / density-factored, P48/P55            | Generation and query reconstruction               | Grouping effect is small; factoring changes fields substantially but reduces aggregate higher-order altitude sensitivity only 1.105%, with increases at two times. | C4 J1 and endpoint joint spectral forecasts pass within their tested settings.                                            | Factoring and both tested density combinations worsen aggregate fit.                                              | Explicit species fields and regenerated higher orders are required; fixed-field integration cannot rank recurrence accuracy. |

## Factor Coverage

This table classifies the evidence for all fifteen factors in the continuation
coverage catalog. Inherited findings retain their original scope in the
[first-campaign report](results.md); they are not new continuation tests.
Reference-backed component accuracy, retrospective response and a qualified
whole-solver dial are different classifications.

| Factor                              | Evidence classification                                  | Established result and remaining limit                                                                                                                                                    |
| ----------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source integration                  | Tested; inherited local forecast                         | S80/S160 response depends on background; physical-J1 and finite-CPU comparisons expose nonmonotonic error. The inherited count forecast does not give a universal remainder or score law. |
| Transport integration               | Tested; inherited local forecast                         | J1 invariance and finite-path error changes are resolved locally; measured benefit can arise through cancellation. Full higher-order transport error remains unbounded.                   |
| Near-ground altitude                | Tested; component accuracy                               | Independent J1 error falls strongly. Higher-order response and score need not improve; arbitrary whole-altitude redistribution is deferred.                                               |
| Outgoing resolution                 | Tested; retrospective response                           | W27/39/51 screen gains accompany increasing J1 error on selected probes. A qualified outgoing remainder and outgoing-by-density experiment are absent.                                    |
| Incoming count                      | Tested; local reference partly unresolved                | I512/I2048 responses and J1 invariance are measured. Five local angular envelopes remain unresolved; no new count-law or complete angular-error claim follows.                            |
| Incoming placement/aspect           | Tested; local failures                                   | The 8x64 rule has seven qualified local density regressions. Endpoint changes do not qualify local improvement; matched finite CPU endpoint/aspect controls are absent.                   |
| Uniform view sampling               | Tested; component accuracy and inherited local forecast  | Independent fixed-field references qualify local subdivision refinement. They preserve any error already in the reconstructed fields.                                                     |
| Adaptive view sampling              | Tested; component accuracy and observed work efficiency  | Lower-budget error and query efficiency improve in both backgrounds with retained exceptions. Saturation and missed-structure risks prevent a universal guarantee.                        |
| Final J1 representation             | Tested; independent component accuracy                   | Factoring sharply reduces physical-J1 error with unchanged later fields; loss of cancellation worsens selected N4 fit.                                                                    |
| Higher-order density representation | Tested; retrospective response                           | Matched grouping control is small; factoring has a large altitude-dependent effect but little uniform higher-order desensitization. Field accuracy remains unresolved.                    |
| Solar interpolation                 | Inherited evidence; grid change deferred                 | Linear/cubic screen differences were small, with no exact operator or alternative solar grid qualified. Continuation preserves monotone-cubic Z180 explicitly.                            |
| Precision                           | Inherited parity plus matched witnesses; sweep deferred  | Parity, exact invariance and binary64 references distinguish some implementation effects. Float32 packing is not isolated from reconstruction/feedback, and no precision ladder was run.  |
| Geometry and ground boundary        | Matched controls; physical boundary test unresolved      | Exact origin/time/grid joins and bounded direction roundoff protect identity. The positive-height reflected-ground limit and geometry calibration are not established.                    |
| Scattering tail                     | Inherited two-channel evidence; broader bound unresolved | N5/N6 additions were material and diminishing but could worsen Kider fit. No full-spectrum N6 or infinite-order reference is qualified.                                                   |
| Physical and observation parameters | Held fixed; alternative models deferred                  | Residuals and their cancellation are measured. No aerosol/phase/profile, ground, instrument-footprint or observation-response correction is identified.                                   |

## Overall Conclusion And Remaining Discrimination

The evidence identifies several distinct controls and failure mechanisms:
near-ground first-order reconstruction, final-view integration and allocation,
source/path quadrature balance, higher-order density representation, outgoing
reconstruction and incoming distribution. It demonstrates both numerical
corrections that worsen measurement fit and score gains that accompany larger
numerical error. Cancellation also occurs without cache interpolation.

The strongest numerical results remain the independent first-order corrections
and local fixed-field view controls. Adaptive allocation improves observed work
efficiency at lower budgets, with explicit exceptions. Density factoring changes
the higher-order problem substantially but offers little uniform altitude
desensitization; incoming count/placement still lack the reference separation
needed for a qualified accuracy dial. Predictable spectral response, reduced
numerical error and improved Kider fit therefore remain separate requirements.
There is no adequate complete N4 oracle and consequently no newly qualified
full-scope, score-improving accuracy dial. That broader objective remains only
partly achieved; it is separate from completion of the plan's bounded tests
and conditional admission decisions.

The dial and coverage tables retain implemented ranges, costs, prospective
status and missing terms. C4 adds successful joint spectral forecasts without
a useful new measurement gain or a complete numerical reference. The
[status](status.md#continuation-execution) owns execution and admission decisions.
The missing complete seventeen-time N4 reference prevents C5 admission;
component and screen evidence cannot substitute for it. Skipping that
conditional phase preserves the experiment's qualification criteria rather
than establishing a new full-scope accuracy claim.

The exact-ground versus positive-height reflected-light boundary remains a
separate physical question: its magnitude, altitude interactions and relevance
to Kider have not been measured under a matched boundary-limit experiment.
Outgoing/angular remainders, other material numerical terms and the scattering
tail also limit broader claims. Further conclusions require those distinctions
to survive the plan's reference and prospective gates.
