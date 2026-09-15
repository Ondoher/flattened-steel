# Compensation Attribution: Active Findings

The [findings brief](accuracy-findings-brief.md) gives the practical assessment.
The [attribution plan](attribution-plan.md) owns the adaptive experiment and
prospective tests. This document owns its findings; the earlier
[continuation findings](continuation-results.md) retain the completed C0-C6
results. The broader accuracy-control objective remains active.

Interpret these findings under the owner's clarified
[scientific correctness standard](continuation-goals.md#standard-of-correctness).
Numerical reference and physical-property results establish correctness only
within their declared scopes. Kider score results separately describe
observation agreement; they neither validate nor invalidate a correction.
Historical score gates and failed predictions remain unchanged.

## Independent Viewing-rule Check

The complete morning second-order reference is now admitted in
[00179-p2-ref-assess](../../../../../tmp/experiments/sky-accuracy-dials/runs/00179-p2-ref-assess/report.md).
All twelve outer and ten angular predicates pass. Its spectral P2 values and
empirical allowances are 21.23247279 +/- 0.00076707 mW in channel 0 and
19.82357677 +/- 0.00118931 mW in channel 8. These allowances include incident,
viewing, outer-rule, angular and mapped-coordinate comparisons. This is a
component reference at `p-0930-5-7`, not a complete N4 or seventeen-time oracle.

| Construction                              | Channel 0 error | Channel 8 error | Interpretation                                        |
| ----------------------------------------- | --------------: | --------------: | ----------------------------------------------------- |
| Original H                                |       +1.159643 |       +2.532074 | Matched control                                       |
| Source integration doubled                |       +1.176224 |       +2.549529 | Numerical error increases                             |
| Transport integration doubled             |       +1.135124 |       +2.491522 | Small resolved numerical improvement                  |
| Same incoming count, more azimuth samples |       +1.079190 |       +2.095909 | Resolved distribution benefit at this ray             |
| P48 query-density factoring               |       -0.128985 |       -0.010651 | About 88.9% / 99.6% less error than matched split-raw |
| P55 near-ground nodes                     |       +0.069560 |       +0.051715 | About 94.0% / 98.0% less error than H                 |

Errors are candidate minus physical P2, in mW m^-2 sr^-1 nm^-1. Both
representation/altitude controls pass their four frozen, uncertainty-aware
80% improvement predicates. The candidate outputs were already known; the
independent reference was the held output. The new count registration tests
previously unexecuted candidate settings separately.

The source-integration result shows that more samples can increase error even
against a numerical reference: its second-order error grows by 16.58 / 17.46
microW, well beyond comparison uncertainty. The later
[source-column audit](#source-transmission-a-held-numerical-control) identifies
under-transmission from coarse source integration on the selected columns and
predicts its reduction. Its complete interaction with reconstruction and
transport remains unquantified. Endpoint azimuth placement and raw species regrouping remain
unresolved under the conservative comparison allowance.

After replacing both first and second order, the original morning residuals
fall from 31.08502 / 48.14817 mW to 24.90736 / 28.65856 mW with original
third/fourth contributions frozen. A substantial positive remainder persists.
No missing-tail or physical-model explanation is assigned to that remainder.
The admitted [12:30 comparison](#independent-noon-comparison) confirms the
opposite observation-score response while preserving the numerical improvements.

The final angular batches `00177` and `00178` retain 1,726,534 and 1,953,868
bytes and consumed 983,370 and 604,753 CPU-job milliseconds. The assessment
retains 1,473,309 bytes and consumed 42,706 CPU-job milliseconds; its seal is
`8191227506eb32837359070b3732d157738656c80c15d73ec64c0e74c754f0a1`.
The first reporting invocation stopped before allocating a run because its
requested name exceeded sixteen characters. Shortening only that name allowed
the report to complete; no numerical stage was repeated or altered.

### Independent Noon Comparison

[00200-tr-ref-assess](../../../../../tmp/experiments/sky-accuracy-dials/runs/00200-tr-ref-assess/report.md)
admits the independent physical P2 reference at `p-1230-3-5`. All twelve
viewing-path and ten angular predicates pass. Reference values are
14.79188048 +/- 0.00077357 and 10.74572262 +/- 0.00106568
mW m^-2 sr^-1 nm^-1 in channels 0 and 8. The allowances are empirical numerical
budgets; this remains a two-channel component reference, with later orders
outside its qualification.

| Construction                              | Channel 0 error | Channel 8 error | Numerical finding                         |
| ----------------------------------------- | --------------: | --------------: | ----------------------------------------- |
| Original H                                |     +0.83354007 |     +1.33247554 | Matched control                           |
| Source integration doubled                |     +0.84165192 |     +1.33952195 | Resolved increase in numerical error      |
| Transport integration doubled             |     +0.82023506 |     +1.31275069 | Small resolved reduction                  |
| Same incoming count, more azimuth samples |     +0.74073394 |     +1.09977393 | Resolved distribution benefit             |
| P48 query-density factoring               |     -0.05761396 |     +0.00636086 | 93.09% / 99.52% less error than split-raw |
| P55 near-ground nodes                     |     +0.05046883 |     +0.03203929 | 93.95% / 97.60% less error than H         |

Errors are candidate minus physical P2 in the same mW units. All four frozen,
uncertainty-aware 80% improvement tests pass. The two altitude/representation
controls therefore have numerical support at both selected viewing conditions;
they are not qualified across every direction, wavelength or altitude setting.
The separately tested finer-count forecast still fails and is not superseded
by this result. Endpoint azimuth placement and raw species regrouping remain
unresolved under their comparison allowances.

The observation comparison is separate. With physical P1 already substituted
and original third/fourth contributions frozen, replacing P2 changes the noon
residuals from -56.52853 / -189.14411 to -57.36207 / -190.47659 mW. Both
registered score-regression predictions pass, with their exact compensation
identities. The original positive P2 numerical bias was offsetting part of a
larger measurement shortfall. This explains the score change and does not
invalidate the independently established numerical correction. The remaining
shortfall is not assigned to a particular physical or observational cause.

Source refinement increases P2 error in both the morning and noon comparisons.
The source-column test separately establishes that this refinement reduces
attenuation error. The registered
[matching-sample reconstruction diagnostic](source-reconstruction-plan.md)
tests the first-order source/reconstruction interaction; it does not assume
that this alone accounts for the complete second-order response.

### Admitted reference development

The complete finer Gaussian viewing integral is accepted in
[00174-p2-gauss8-high](../../../../../tmp/experiments/sky-accuracy-dials/runs/00174-p2-gauss8-high/view.json).
Using ordinary radial16/azimuth32 integration, P2 is
`0.021232485005769585 W` in channel 0 and `0.0198235848836511 W` in channel 8.
Its changes from Gauss4 are approximately -0.28225 and -0.62701 microW,
respectively, much smaller than the earlier independent Simpson4/Gauss4
discrepancy. The complete Simpson8 target
[00175-p2-simpson8](../../../../../tmp/experiments/sky-accuracy-dials/runs/00175-p2-simpson8/view.json)
gives `0.02123294275782029 W` and `0.01982442674654738 W` under the same
ordinary fine angular rule. Its differences from Gauss8 are 0.45775 and
0.84186 microW. All twelve original outer-integration predicates pass in
[00176-p2-outer-assess](../../../../../tmp/experiments/sky-accuracy-dials/runs/00176-p2-outer-assess/outer-predictions.json),
including the independently mapped angular placement. Fixed-point angular
refinement and the complete uncertainty budget remain required before
reference qualification. No outer prediction threshold was changed.

Simpson8 retains 1,973,133 bytes and consumed 896,609 CPU-job milliseconds;
its seal SHA-256 is
`554eaa849898f04de2f9d18cfc5dd95c5b521c07f4d73d4a9653efc822a13591`.
The assessment retains 1,566,162 bytes and consumed 39,429 CPU-job milliseconds;
its seal SHA-256 is
`03be8c989b47325e4ffabd445e7850ccf49e265c138accd81b7b8e6d7f63497d`.

The finer Gaussian lower-half run `00167-p2-gauss8-low` completes sixteen
new physical queries and 27,648 incident evaluations with all inner admissions.
The upper-half attempt `00168-p2-gauss8-high` stops at its first point,
8234.249 metres above the ground, after 1,728 incident evaluations. Its retained
eight unresolved witnesses are nearly tangent outward rays. That attempt
does not supply a complete Gaussian8 integral; its retry `00174` reuses only
the previously admitted lower-half points and computes all sixteen upper points.

Both independent fine incident integrations agree closely on these witnesses.
The failure is the original Simpson coarse/fine consistency check, principally
in channel 0; its altitude coordinate produces a sharp Jacobian change near
the start of a nearly tangent ray. Fine agreement does not override this failed
admission gate. A separately registered closest-approach altitude coordinate
tests this explanation without changing physics, tolerances or final admission.
Its first witness attempt `00169-incident-map` reached the five-minute harness
cap because repeated storage checks dominated execution. It remains failed
evidence. The throttled retry
[00170-incident-map](../../../../../tmp/experiments/sky-accuracy-dials/runs/00170-incident-map/reference.json)
passes all eighty preregistered predicates. All eight pairs now resolve; their
fine values remain consistent with both original fine methods under the
unchanged comparison allowances. The original Gauss results are exactly reused
by the conditional fallback.

The new Simpson coarse result's discrepancy from the original fine Gauss value
falls by about 97.1% in channel 0 across these eight rays. The new Simpson
calculation uses about 30.6-30.7% fewer medium evaluations than the original
Simpson calculation. This is evidence for coordinate-induced integration error
on these witnesses, not a Kider improvement or a general convergence law.
A retry fallback must count both original and replacement work, so its total
cost is larger than a new-coordinate calculation alone. Independent local
fallback checks admit all eight replacements within each original combined
Simpson work cap and preserve all old/new fine comparisons.

The accepted witness seal SHA-256 is
`ee564257463ee1bf09297bf7fed46db386d150d5d028e6e8dfa1493e93f48728`.
It retains 1,337,503 bytes; the failed harness attempt retains 1,232,312 bytes.
The original predictions, failed upper-view attempt and all prior numerical
results remain immutable. The fresh upper-view run `00174` subsequently
completes all 27,648 new incident evaluations and all inner admission checks.
Its seal SHA-256 is
`da7d547630579d04a98596e114a1b87014125d0a6475cd68adf342e954bcdb40`;
it retains 1,916,570 bytes and consumed 712,121 CPU-job milliseconds. Original
and fallback work are retained separately, with all attempts preserved.

The complete first coarse comparison remains:

The prospective outer comparison in
[00166-p2-outer-assess](../../../../../tmp/experiments/sky-accuracy-dials/runs/00166-p2-outer-assess/outer-predictions.json)
replays the complete original Gauss4 and new Simpson4 view. All four available
one-percent predictions pass; the eight tighter Gaussian8/Simpson8 comparisons
are explicitly unresolved until their targets exist. The original prediction
plan has SHA-256
`a16aa0528af38bbd6ea111492b21e0e0d906c31508e237d80a144d898fc20d8f`.

At the frozen 09:30 ray, using ordinary radial16/azimuth32 integration:

| Channel |  Gauss4 P2 | Simpson4 P2 | Simpson minus Gauss |
| ------: | ---------: | ----------: | ------------------: |
|       0 | 21.2327673 |  21.2422369 |          +0.0094696 |
|       8 | 19.8242119 |  19.8408993 |          +0.0166874 |

Values are mW m^-2 sr^-1 nm^-1. These changes are about 0.045% and 0.084%
of the respective coarse estimates. The independently mapped angular placement
produces similar outer responses. The outer-method discrepancy is much smaller
than the original cached-to-coarse-P2 differences of approximately 1.159 and
2.531 mW, supporting continued investigation of that numerical error. This
comparison alone does not qualify the physical reference: finer independent
outer checks and fixed-point azimuth refinement remain required.

The Simpson target is
[00165-p2-simpson4](../../../../../tmp/experiments/sky-accuracy-dials/runs/00165-p2-simpson4/view.json),
seal SHA-256 `85fdd14b493e0008d33c220ca98375a54b768b9b2872855172f89b3880fe723c`.
It consumed 857,174 CPU-job milliseconds and retains 1,478,622 bytes. The
assessment seal SHA-256 is
`407104409df063123c02117bff666371a578b4392a25d73a48fe611347f4c1d4`;
it consumed 36,750 CPU-job milliseconds and retains 1,294,240 bytes. Both
cleaned their owned scratch and executed no GPU construction. Scientific
acceptance here records valid evidence and explicit prediction outcomes,
not whole-N4 or Kider accuracy qualification.

## Retained-order decomposition

[00152-a-order-split](../../../../../tmp/experiments/sky-accuracy-dials/runs/00152-a-order-split/report.md)
exactly decomposes the same 160 retained component values used for the original
compensation finding. No new atmospheric integration is involved. Each group
contains 32 selected values; this is neither the full dome nor the seventeen-time
Kider score.

For an independent physical first order P1, measurement M and reconstructed
cumulative orders L1 through L4, the remainder after replacing first order is

`r = (P1 - M) + (L2 - L1) + (L3 - L2) + (L4 - L3)`.

The added-order terms are reconstructed effective contributions. They have not
yet been independently established as accurate higher-order radiances.

| Selected group | Mean P1 - M | Mean order-two addition | Mean order-three addition | Mean order-four addition | Mean remaining residual | RMS remaining residual |
| -------------- | ----------: | ----------------------: | ------------------------: | -----------------------: | ----------------------: | ---------------------: |
| All 160        |     -26.269 |                  13.152 |                     4.351 |                    1.735 |                  -7.031 |                 32.050 |
| 09:30          |     -18.463 |                  15.441 |                     4.686 |                    1.816 |                   3.480 |                 28.019 |
| 10:15          |     -12.530 |                  11.928 |                     3.776 |                    1.525 |                   4.699 |                 13.582 |
| 11:15          |     -18.772 |                  10.907 |                     3.577 |                    1.447 |                  -2.842 |                 25.946 |
| 12:30          |     -40.420 |                  12.832 |                     4.504 |                    1.810 |                 -21.273 |                 52.036 |
| 13:30          |     -41.159 |                  14.654 |                     5.212 |                    2.076 |                 -19.217 |                 28.028 |

All table values are mW m^-2 sr^-1 nm^-1. Positive residual means brighter than
measurement. Across the selected values, 90 residuals are positive and 70 are
negative. Their signs therefore cannot be explained or corrected by adding a
uniform positive contribution alone. Physically nonnegative missing orders
cannot reduce an already-positive residual while all represented contributions
remain fixed. This observation does not establish the actual missing tail or
the accuracy of the retained orders.

## Positive-altitude boundary pilot

[00153-volume-l1-pilot](../../../../../tmp/experiments/sky-accuracy-dials/runs/00153-volume-l1-pilot/reference.json)
evaluated eight incident rays in channels 0 and 8, separating atmospheric first
scattering from direct Lambertian ground reflection. Both original surface
witnesses agree with the previous independent first-order reference within
their combined allowances. The four inward ground-hit heights approach the
finite direct-ground limit as predicted; both one-millimetre checks pass.

The inward escaping ray at 1000 metres is unresolved because the independent
Simpson method reached its subdivision-depth cap. Accordingly, the complete
pilot did **not** pass all scientific predicates. It does not qualify a
second-order viewing-ray reference or a Kider improvement.

Read-only tracing of the experiment's actual recurrence confirms that its
positive-height incoming L1 field already includes direct ground reflection.
The J2 scatter step reads L1 at the same retained position; it does not
interpolate L1 before that scatter. The exact-ground inward-zero convention
therefore creates a difference in the ground J2 knot, and subsequent altitude
interpolation of J2 spreads that difference into the first interval. The
relevant source owners are the experiment's [order kernels](../../../../../experiments/sky-accuracy-dials/orders/kernels.js)
and [view reconstruction](../../../../../experiments/sky-accuracy-dials/numerics/view.js).
This identifies a possible boundary representation error, without establishing
its magnitude or explaining the previous altitude-sampling score regression.

For the frozen outward views from the ground, the physical second-order target
is the view integral of the scattered continuous L1 field, including its
direct-ground part. There is no extra ground-reflection term at the final view's
boundary because that view exits the atmosphere. At the observer endpoint, an
integration rule must distinguish the positive-height limit from the separate
stored inward-zero convention; a single mathematical endpoint has zero path
measure. Compare that reference with grouped N2 minus grouped N1, preserving
the original grouped reconstruction and subtraction allowances.

## Angular development and reference error allocation

[00154-j2-ang-derive](../../../../../tmp/experiments/sky-accuracy-dials/runs/00154-j2-ang-derive/reference.json)
completed the original-sum replay, derived azimuth comparisons and the missing
full-interval radial32/azimuth32 midpoint rule. The subsequent
[00155-j2-ang-dev](../../../../../tmp/experiments/sky-accuracy-dials/runs/00155-j2-ang-dev/reference.json)
stopped after seven new incident evaluations because its first hemisphere16
grazing witness was unresolved. That incomplete development record does not
qualify the later held target.

Read-only instrumentation of both failed witnesses found that their radiance
components passed the deepest local error comparisons. The auxiliary integrand
carrying the optical-column error estimate failed instead. Its small jumps
occur when the inner adaptive column integrators change subdivisions. A local
tolerance proportional to interval length can shrink as quickly as the error
from a jump, so subdividing further does not necessarily satisfy the local test.
These traces are diagnostic observations, not sealed reference results.

The registered global-allocation control is now complete.
[00156-volume-l1-global](../../../../../tmp/experiments/sky-accuracy-dials/runs/00156-volume-l1-global/reference.json)
admits all eight witnesses and passes all 78 predicates without changing the
equations, inner column integrations, quadrature methods, depth cap or final
admission thresholds. Each formerly admitted atmospheric, direct-ground and
total component agrees within its combined comparison allowance. The largest
mean change is 1.672e-9 W m^-2 sr^-1 nm^-1, against an allowance of 6.675e-7.

The allocator retains a complete interval partition and refines its largest
normalized error contribution until every summed component estimate meets its
original whole-integral tolerance. This resolves the auxiliary-error jumps
without discarding them or relaxing the accuracy requirement. Manufactured
global-allocation proofs pass 157 checks; the existing physical and volume
proofs pass 115 and 212 checks. Material discontinuities can still hit the depth
cap, and such failures remain explicit. These are empirical error estimates,
not rigorous bounds.

## Held angular reference

The revised chain comprises
[00157-j2-ang-derive](../../../../../tmp/experiments/sky-accuracy-dials/runs/00157-j2-ang-derive/reference.json),
[00158-j2-ang-dev](../../../../../tmp/experiments/sky-accuracy-dials/runs/00158-j2-ang-dev/reference.json),
[00159-j2-ang-predict](../../../../../tmp/experiments/sky-accuracy-dials/runs/00159-j2-ang-predict/reference.json)
and [00160-j2-ang-fine](../../../../../tmp/experiments/sky-accuracy-dials/runs/00160-j2-ang-fine/reference.json).
The prediction record was sealed before the held fine evaluations. All new
incident rays are admitted; the fine record includes 8,320 new unique incident
rays and 4,160 reused records.

The comparison covers four ground probes, two at 09:30 and two at 12:30, in
channels 0, 8, 24 and 30. At fixed 32 midpoint azimuth samples, full-interval
radial count gives this aggregate local second-order source-density trend:

| Radial samples | RMS difference / RMS held reference |
| -------------- | ----------------------------------: |
| 16             |                            0.34410% |
| 32             |                            0.07659% |
| 64             |                            0.01731% |

These are equally weighted norms over 16 component scalars, not Kider RMSE or
whole-view radiance. The approximately 4.5-fold reductions per doubling are a
retrospective trend, not a prospectively qualified convergence rate.

All 16 held comparisons pass correction-shrinkage, proximity to the independently
mapped radial rule, forecast-envelope and angular-adequacy predicates. However,
the final hemisphere16-to-hemisphere32 improvement is smaller than comparison
uncertainty in every scalar. Consequently none qualifies a resolved magnitude
prediction for that final refinement. The maximum relative reference allowance
is about 0.000990%; small agreement below it is not established true accuracy.

Across six older angular controls and 16 scalars, 83 of 96 comparisons show a
qualified numerical-error reduction and 13 regress. Twelve regressions are
channel 30 at the two morning probes across all six controls; the remaining
one is channel 30 at `p1230-4-4` for full32/azimuth32 midpoint sampling. Thus
angular quadrature also contains compensating errors: strong aggregate
improvement does not imply every individual spectral value improves.

Runs `00152` through `00160` added 14,675,874 retained bytes, with zero scratch
remaining. Total retained evidence is 279,251,030 bytes. No GPU run was added.

## Positive-height second-order pilot

[00161-volume-j2-pilot](../../../../../tmp/experiments/sky-accuracy-dials/runs/00161-volume-j2-pilot/reference.json)
completed all 1,552 independent incident evaluations and passed all 132
scientific predicates. The manufactured angular/geometry proof passed 4,652
checks, with maximum analytic phase-mass error 1.33e-15. The run used 138.2
seconds, 2,340,294 retained bytes and no scratch or GPU work.

At 1 mm, direct ground light supplies 1.31% and 2.37% of local second-order
density in channels 0/8 at the selected 09:30 probe, and 2.15% and 3.83% at the
12:30 probe. These are pilot angular sums, not yet independently qualified
angular estimates or viewing-ray effects. The Rayleigh ground contribution
agrees with the analytic half-hemisphere limit within about 0.0019%, comfortably
inside the registered 0.1% tolerance. All independently evaluated source-plane
mirror checks pass.

The atmosphere-only 1-mm pilot sums differed from the fine exact-ground outward
reference by +0.353%/+0.535% at 09:30 and -0.167%/-0.248% at 12:30. Their physical
points differ, so these are near-boundary comparisons rather than established
angular errors. They motivated the completed radial-by-azimuth factorial and
near-surface-limit prediction below.

The original H capture contains integrated radiances and field hashes, but no
raw J2 values. An exact frozen ground-row reconstruction intervention therefore
requires a new bounded capture of the relevant ground taps. Existing output
cannot reconstruct those values from its hashes or integrated spectra.

## Positive-height angular factorial

[00162-volume-j2-ang](../../../../../tmp/experiments/sky-accuracy-dials/runs/00162-volume-j2-ang/reference.json)
completed all 9,252 new independent incident evaluations and passed all 308
scientific predicates. With the original radial8/azimuth16 pilot cell, its
radial16/azimuth16, radial8/azimuth32 and radial16/azimuth32 cells complete the
factorial at six physical points: 1 mm, 1000 m and 8000 m along each selected
09:30 and 12:30 ray, in channels 0 and 8. Radial counts apply separately to each
of the three geometric incident intervals.

All four component-vector additive predictions pass the registered interaction
norm gate of 25% of the response scale plus propagated incident allowance. The
atmospheric Mie interaction norm is resolved above that allowance and equals
1.1614% of its response scale. The atmospheric Rayleigh, ground Rayleigh and
ground Mie interaction norms remain below their respective incident-allowance
norms; their small observed ratios do not establish resolved interaction
magnitudes or exact independence.

All four refined 1-mm atmosphere comparisons against
[00160](../../../../../tmp/experiments/sky-accuracy-dials/runs/00160-j2-ang-fine/reference.json)
pass the preregistered 0.05% near-surface gate plus combined allowances. Absolute
differences relative to the exact-ground reference are 0.000524%/0.000473% at
09:30 and 0.000255%/0.000230% at 12:30 for channels 0/8. Three differences lie
within the combined incident allowance. Morning channel 0 is slightly above
it: 2.6545e-11 against 2.3963e-11 W m^-3 sr^-1 nm^-1. These compare distinct
physical heights and do not isolate angular error or establish accuracy below
the incident uncertainty.

The [sealed execution](../../../../../tmp/experiments/sky-accuracy-dials/runs/00162-volume-j2-ang/sealed.json)
used 629.856 seconds and added 2,838,741 retained bytes, including its seal.
Its 52,164-byte owned scratch high-water allocation was cleaned to zero; no GPU
job ran.

## Second-order viewing-ray pilot

[00163-p2-view-pilot](../../../../../tmp/experiments/sky-accuracy-dials/runs/00163-p2-view-pilot/view.json)
completed 3,456 incident evaluations and passed all 26 point-level predicates.
The independent geometry, manufactured integral and angular-moment proof passed
13,911 checks; the worker parity/lifecycle proof passed 92 checks. The pilot
evaluates two of the sixteen registered outer nodes on the 09:30 ray: 9.039 m
and 25,975.852 m, in channels 0 and 8. No complete viewing integral is inferred
from these two points.

At the lower point, changing ordinary radial16/azimuth32 to the independently
mapped radial16/azimuth32 placement changes combined local J2 by +4.824e-10 and
+5.660e-10 W m^-3 sr^-1 nm^-1 in channels 0/8, about +0.00945%/+0.00821%.
Both differences exceed their propagated incident allowances. At the upper
point, the corresponding combined differences lie within those allowances.
This localizes remaining placement sensitivity in this two-point comparison;
it does not yet bound its whole-view contribution or identify the best rule.

All observer-to-point transmission comparisons pass their independent column
admission. The run took 135.260 seconds and retained 1,170,705 bytes. Four
workers completed 393.574 summed task-wall seconds; the complete low/high
points took 65.396/37.049 wall seconds. The observed process resident-set peak
was 581,750,784 bytes. Reproducible incident arrays were kept in memory.
These costs admit completing the remaining fourteen outer nodes within the
existing one-hour and four MiB stage limits.

## Complete coarse second-order viewing integral

[00164-p2-view-coarse](../../../../../tmp/experiments/sky-accuracy-dials/runs/00164-p2-view-coarse/view.json)
completed 24,192 new incident evaluations, reused the two exact pilot points,
and passed all 214 admission/identity/ground-envelope predicates. It completes
the sixteen-node Gauss4 outer rule at the selected 09:30 ray. Its 773.799-second
job retained 1,357,220 bytes; the process resident-set peak was 830,656,512 bytes.
Outer quadrature is still unqualified. The following values are coarse physical
estimates, not a completed reference or a full Kider score.

Values are mW m^-2 sr^-1 nm^-1. The physical estimate uses ordinary
radial16/azimuth32 incoming integration.

| Quantity                                              |  Channel 0 |  Channel 8 |
| ----------------------------------------------------- | ---------: | ---------: |
| Original H grouped N2-N1                              |  22.392116 |  22.355650 |
| Coarse physical P2                                    |  21.232767 |  19.824212 |
| H minus coarse physical P2                            |  +1.159349 |  +2.531438 |
| Full-view direct-ground component of P2               |   0.245394 |   0.847287 |
| Ground component within first altitude interval       |   0.116950 |   0.314300 |
| Residual after physical P1 substitution only          | +26.067006 | +31.190638 |
| Residual after physical P1 and coarse P2 substitution | +24.907657 | +28.659199 |

The first-shell ground terms pass their preregistered upper envelopes of
0.250591/0.615598 mW, including propagated allowances. They are much smaller
than the remaining residual. They measure physical ground illumination followed
by one atmospheric scattering; they are not the change from a literal cached
ground-row repair.

Ordinary coarse-to-fine angular refinement changes full-view P2 by
-0.020832/-0.039473 mW. Mapped-fine minus ordinary-fine is only
+0.000016/+0.000069 mW after integration. Opposing local changes partly cancel,
so that last comparison must be accompanied by weighted absolute local
differences when estimating reference uncertainty. Propagated incident
allowances alone are approximately 0.000035/0.000032 mW; they exclude outer and
angular quadrature error.

Authenticating earlier captures shows that P55 altitude sampling and P48
query-density factoring produce second-order values substantially closer to
these coarse estimates than H does. That is a hypothesis for a useful numerical
dial, pending the independently refined reference. The
[refinement registration](second-order-refinement-plan.md) freezes outer-rule
predictions, an uncertainty-aware 80% error-reduction test, further angular
admission, and comparisons spanning source, transport and incoming sampling.
It explicitly distinguishes these new reference predictions from the already
known candidate GPU outputs.

## Existing Higher-order Evidence And Its Compatibility Limit

The new matched H capture
[00171-matched-h-n6](../../../../../tmp/experiments/sky-accuracy-dials/runs/00171-matched-h-n6/predictions.json)
closes the earlier control-compatibility gap for channels 0/8 and all forty C0
probes. Both channels reproduce original N1-N4 sparse fields, cumulative fields,
spectra and complete probe envelopes exactly. All retained six-order view
envelopes are admitted. All eight held positive-increment and finite-ratio
predicates pass at the two selected physical rays.

| Time  | Channel | Fifth-order addition | Sixth-order addition | Total addition |
| ----- | ------: | -------------------: | -------------------: | -------------: |
| 09:30 |       0 |              2.20982 |              1.08235 |        3.29216 |
| 09:30 |       8 |              0.50655 |              0.16145 |        0.66800 |
| 12:30 |       0 |              1.46938 |              0.71916 |        2.18853 |
| 12:30 |       8 |              0.25244 |              0.08058 |        0.33302 |

Values are mW m^-2 sr^-1 nm^-1; these are effective grouped cumulative
increments. Their sixth/fifth ratios are approximately 0.49 in channel 0 and
0.32 in channel 8. Positive added light worsens the selected morning overshoot
and reduces the midday shortfall, both with original N4 and after the physical
P1-only substitution. The separately registered physical P1/P2 substitution
assessment remains unresolved until P2 is admitted. These two finite increments
do not bound orders seven onward or establish N5/N6 recurrence accuracy.

The accepted seal SHA-256 is
`584023be2e9357670bb2df3afbf8d5ad0062df6d12608fd8a726556fdd06ee24`.
The run retains 2,618,501 bytes. The subsequent
[00172-matched-predict](../../../../../tmp/experiments/sky-accuracy-dials/runs/00172-matched-predict/p55-prediction.json)
freezes two altitude-by-order response models before the P55 target. Its
primary damped log-ratio model extrapolates the weakening relative dimming
observed in original orders two through four; the comparison model holds the
last logarithmic step. Both propagate input-envelope uncertainty separately
from unknown model error under the [transfer registration](matched-order-transfer-plan.md).

The target [00173-matched-p55-n6](../../../../../tmp/experiments/sky-accuracy-dials/runs/00173-matched-p55-n6/predictions.json)
is accepted with exact original P55 N1-N4 field, spectrum and envelope parity.
Its complete six-order view envelopes and eight finite-order predicates pass.
The separate altitude-response assessment `00180` preserves the primary model's
failed magnitude criteria, detailed below; successful capture and positive added
orders do not imply that those forecasts passed.
Observed responses include positive later-order P55-minus-H changes in channel
0, while the morning channel-8 response stays negative through order six.
These small responses must be assessed separately from the much larger,
already-known original N4 altitude change.

The prediction seal SHA-256 is
`847e043ff9584b1ac34937cf838e4aa859217b6cd5cabc64a4a5fa2e2208e0fc`,
retaining 1,337,301 bytes. The P55 target seal SHA-256 is
`7f4f417986fa86a1778c69e0e34815b78ac25be70bdf50353a945ab7124843ad`,
retaining 2,244,606 bytes. The two matched GPU runs consumed 105,782 and
87,447 GPU-job milliseconds and cleaned their owned scratch.

The earlier unmatched diagnostics remain:

Read-only authentication of the three retained six-order runs confirms that
both selected rays and channels 0/8 are present. Each run passed exact original
N1-N4 prefix parity against its named four-order parent. Their physical model,
P48/W27 grids and original scene geometry match H, but their numerical controls
do not:

| Accepted six-order run                                                                                             | Incoming / source / transport | Exact four-order parent |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ----------------------- |
| [00047-n6-baseline](../../../../../tmp/experiments/sky-accuracy-dials/runs/00047-n6-baseline/parity-analysis.json) | F68 / S20 / T40               | 00033-baseline-scr      |
| [00085-n6-t160](../../../../../tmp/experiments/sky-accuracy-dials/runs/00085-n6-t160/parity-analysis.json)         | F68 / S20 / T160              | 00027-t160-scr          |
| [00086-n6-i512](../../../../../tmp/experiments/sky-accuracy-dials/runs/00086-n6-i512/parity-analysis.json)         | 16x32 midpoint / S20 / T40    | 00028-i512-scr          |

All three use Q30 global-quadratic final-view integration. H combines
16x32 midpoint/S80/T160 and altitude-segmented view integration with independent
component envelopes. No historical six-order capture has that complete match.

The following are exact retained grouped N6-minus-N4 additions, in
mW m^-2 sr^-1 nm^-1, decoded from the original six-order spectrum layout:

| Historical run | 09:30 ch0 | 09:30 ch8 | 12:30 ch0 | 12:30 ch8 |
| -------------- | --------: | --------: | --------: | --------: |
| 00047          |  4.267217 |  1.319155 |  2.515704 |  0.447712 |
| 00085          |  3.528138 |  0.970777 |  2.257092 |  0.393976 |
| 00086          |  3.438876 |  0.699805 |  2.269235 |  0.344787 |

These finite additions are historically material, especially in channel 0.
They cannot be inserted as H's tail correction into the new P2 attribution.
Both successive historical increments are positive and diminish at the
selected points, but two observed increments and their ratios do not establish
a contraction bound, numerical accuracy of N5/N6, or a bound on N7 onward.
Nonlinear reconstruction and cumulative Float32 arithmetic also make these
effective cumulative increments distinct from independently reconstructed pure
orders. The matched H/P55 captures above provide compatible finite-order
controls; their independent recurrence accuracy and infinite-tail bounds remain
unresolved. The old records remain unchanged.

## Held Altitude-count Predictions

Prediction [00181](../../../../../tmp/experiments/sky-accuracy-dials/runs/00181-alt-p51-predict/prediction.json)
was sealed before the P51 target
[00182](../../../../../tmp/experiments/sky-accuracy-dials/runs/00182-altitude-p51/sealed.json).
It used the original P48 and P55 effective P2 values to predict the new grid's
response with an inverse-square interpolation model. The target changes only
the subdivisions of the first 1875 m interval, from one to four; P55 has eight.
All 640 fixed-field view envelopes pass. The retained intersection of 104
surface J1/J2 taps agrees exactly with original P55. This is a bounded ground
witness, not a full-field equality claim.

The [00183 assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00183-alt-p63-predict/assessment.json)
passes all four prospective sign and 25% magnitude gates and the vector gate.
Responses below are P51 minus P55 in microW m^-2 sr^-1 nm^-1:

| Selected group | Predicted response | Observed response | Absolute prediction error |
| -------------- | -----------------: | ----------------: | ------------------------: |
| 09:30 ch0      |             51.909 |            47.038 |                     4.871 |
| 09:30 ch8      |            118.112 |           108.512 |                     9.600 |
| 12:30 ch0      |             37.289 |            31.875 |                     5.414 |
| 12:30 ch8      |             61.926 |            51.521 |                    10.404 |

The vector error is 15.920 microW against the frozen 36.983 microW threshold.
The smooth model overpredicts each response by about 8.1–16.8%. This establishes
one held count response within the registered range; it does not establish a
universal convergence law or qualify the model beyond these probes. Record
`00183` also freezes both registered P63 forecasts using the admitted P51 value,
before P63 is observed. Their comparison tests whether the smooth-only rule
persists or a competing boundary term better explains the finer response.

The P51 target retains 2,096,641 bytes and consumed 121,726 GPU-job milliseconds.
The assessment/next-prediction record retains 1,492,041 bytes and consumed
81,898 CPU-job milliseconds. Its seal SHA-256 is
`252ae27cc3ed24e7d320cb9654bda5c2a664d31882733d1b1dc1d9a62fba617c`.

The finer target [00184](../../../../../tmp/experiments/sky-accuracy-dials/runs/00184-altitude-p63/sealed.json)
adds sixteen subdivisions within the same first interval. Its 640 envelopes
and bounded shared-knot witness also pass. The held
[00185 assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00185-alt-p63-assess/assessment.json)
preserves the following P63-minus-P55 responses in the same microW units:

| Selected group | Smooth-only forecast | Competing-rate forecast | Observed response | Smooth magnitude | Competing magnitude |
| -------------- | -------------------: | ----------------------: | ----------------: | ---------------- | ------------------- |
| 09:30 ch0      |              -11.759 |                  -9.933 |            -8.291 | Failed           | Passed              |
| 09:30 ch8      |              -27.128 |                 -23.528 |           -18.691 | Failed           | Passed              |
| 12:30 ch0      |               -7.969 |                  -5.939 |            -4.517 | Failed           | Passed              |
| 12:30 ch8      |              -12.880 |                  -8.979 |            -6.133 | Failed           | Failed              |

All eight sign checks pass. Smooth-only fails its vector test, with an
11.860 microW error against an 8.309 microW threshold. Competing-rate passes
the vector test, with 6.017 microW error against 6.937 microW, but its noon
channel-8 local error is 31.7% of the predicted response and fails the original
25% gate. Neither model qualifies across all four groups. No exponent or
threshold was adjusted after observing the target.

The competing model improves every local magnitude prediction and captures
part of the departure from inverse-square behavior. This is consistent with
competing contributions, but does not identify a boundary error: omitted smooth
error terms or changes elsewhere in the regenerated field can also invalidate
the simple law. The separately registered ground intervention tests the
boundary interpretation. The target and assessment
retain 2,114,870 and 1,493,715 bytes and consumed 127,744 GPU-job milliseconds
and 82,890 CPU-job milliseconds. Assessment seal SHA-256:
`4a2a32c9308e04d7f0d021174a9c07c313217e14fbb2bbe6147962fd2d39b92e`.

## Ground Boundary: A Measured Compensating Error

The matched P48 and P55 controls
[00191](../../../../../tmp/experiments/sky-accuracy-dials/runs/00191-ground-p48/p2.json)
and [00192](../../../../../tmp/experiments/sky-accuracy-dials/runs/00192-ground-p55/p2.json)
are accepted. Both preserve historical J1 and unmodified shadow-J2 sparse
hashes, complete non-ground J2 equality and the same L1 texture. Their
independently bounded ground arithmetic passes. All eight held positive-P2
response tests pass.

Restoring the atmospheric-side direct-ground contribution at the ground J2
knot produces these effective P2 changes, in microW m^-2 sr^-1 nm^-1:

| Selected group | P48 correction | P55 correction | P55 / P48 |
| -------------- | -------------: | -------------: | --------: |
| 09:30 ch0      |         99.628 |         13.875 |    13.93% |
| 09:30 ch8      |        257.632 |         34.329 |    13.32% |
| 12:30 ch0      |        104.582 |         13.936 |    13.33% |
| 12:30 ch8      |        211.142 |         27.403 |    12.98% |

The first interpolation interval is eight times narrower in P55. The measured
boundary correction is about 86–87% smaller there. This is a descriptive
interaction result, not a retrospectively invented one-eighth magnitude gate.

At the morning ray, correcting this boundary value increases P2 numerical
error against the independent reference: P48 channel0/ch8 errors rise from
1159.643/2532.074 to 1259.271/2789.705 microW; P55 errors rise from
69.560/51.715 to 83.434/86.044 microW. Thus the missing positive ground
contribution was compensating for a larger positive numerical error. Restoring
the correct local contribution alone cannot remove that other error. The
representation/altitude findings constrain the latter, but these two controls
do not completely partition it among reconstruction, angular and path errors.
The [noon P2 reference](#independent-noon-comparison) is now admitted. The
boundary correction's positive response there is distinct from the larger
positive error removed by the altitude/representation controls.

The earlier `00190` remains failed evidence. Its shader-text mismatch was
traced exactly to ten binary64 cosine literals differing between runtimes;
all had identical Float32 values. The repair retains the browser's actual
common GLSL, checks every other byte exactly, restricts each cosine difference
to two binary64 ULPs with identical Float32 bits, and verifies both complete
shader hashes. Scientific tolerances and the compiler core are unchanged.

## Source Transmission: A Held Numerical Control

Prediction [00188](../../../../../tmp/experiments/sky-accuracy-dials/runs/00188-src-column-pred/prediction.json)
was sealed before the separate S160 target
[00189](../../../../../tmp/experiments/sky-accuracy-dials/runs/00189-src-column-s160/assessment.json).
The pilot uses 32 actual bottom-interval view samples and sixteen supporting
altitude/solar cache anchors across the two selected rays, in channels 0/8.
All 96 scalar references pass independent adaptive Gaussian/Simpson checks.
The finite rule follows the anchored binary64 source-column equations; it does
not claim exact shader arithmetic parity.

The endpoint derivative of the extinction profile predicted the S80-to-S160
optical-depth correction before S160 was evaluated. All 96 optical-depth
magnitude, transmission magnitude, sign, convex-ordering, numerical-improvement
and error-ratio gates pass. All eight sample/knot ray/channel vector magnitude
and sign groups also pass. The independent-reference optical-depth error ratio
is 0.250756–0.251144: doubling the count removes about 74.9% of this error,
close to the predicted three-quarters reduction.

| Group     | Transmission-response prediction error, samples | Supporting knots |
| --------- | ----------------------------------------------: | ---------------: |
| 09:30 ch0 |                                          0.648% |           0.687% |
| 09:30 ch8 |                                          0.716% |           0.743% |
| 12:30 ch0 |                                          0.657% |           0.697% |
| 12:30 ch8 |                                          0.725% |           0.752% |

These percentages compare predicted and observed response vectors; they are
not percentages of total transmitted light. Coarse trapezoidal integration
overestimates optical depth on these convex outward columns, underestimating
transmission. S160 reduces that source-column bias and increases transmitted
light. Together with the earlier downstream regressions and
[finite source/transport factorial](continuation-results.md#finite-source-and-transport-cancellation-without-interpolation),
this separates an improving numerical component from worsening combined errors.
It does not yet assign the entire integrated N1/P2 response to that component.
The nonlinear reconstruction interaction remains explicitly deferred.

This qualifies the numerical source-column response for S80-to-S160 on the
48 tested lit columns, whose source cosines span approximately 0.636–0.937.
It does not qualify a universal source count, a GPU precision claim, a sunrise
or tangent-ray result, or a Kider score-improving setting. It requires no cache
size increase; the finite column evaluations increase from 7,776 to 15,456
for the two species across this pilot. Independent reference work used 89,788
medium evaluations and 192 column calls. The two evidence records retain
1,994,474 and 2,126,339 bytes and consumed 60,631 and 82,567 CPU-job milliseconds,
including authentication and sealing; these are not GPU construction timings.
Target seal SHA-256:
`c9a6232b9ea918917da8eb053d3b79a3680c33c007f0e484f03fa8f6c628a407`.

## Source Error And Reconstruction Error At Matching Samples

[00201-src-reconstruct](../../../../../tmp/experiments/sky-accuracy-dials/runs/00201-src-reconstruct/report.md)
reuses the 32 bottom-interval samples and their independent source columns,
in channels 0 and 8. Its 64 scalar comparisons contain no Kider input or new
physical integration. All source/reconstruction-sign and raw-error-growth
hypotheses pass; two noon density-factoring magnitude hypotheses fail. The run
preserves all 18 passing and two failing predicates.

| Ray / channel | Finite-source effect | Reconstruction remainder | Combined S80 error | Combined S160 error | Factored remainder |
| ------------- | -------------------: | -----------------------: | -----------------: | ------------------: | -----------------: |
| 09:30 / 0     |            -0.228454 |                +4.538366 |          +4.309912 |           +4.480914 |          -0.475729 |
| 09:30 / 8     |            -0.431233 |               +15.186161 |         +14.754927 |          +15.077716 |          -1.072327 |
| 12:30 / 0     |            -0.214283 |                +6.289012 |          +6.074729 |           +6.235147 |          -1.748343 |
| 12:30 / 8     |            -0.350689 |               +16.620239 |         +16.269550 |          +16.532079 |          -3.576587 |

These are fixed positive-weight projections of bottom-interval first-order
density errors, in mW m^-2 sr^-1 nm^-1, not complete viewing integrals. The
exact identity is `R80-D* = (R80-R*) + (R*-D*)`: R* reconstructs independently
evaluated source values at the original cache anchors, while D* uses the
independent source value and continuous density/phase at the actual query.
The reconstruction term includes altitude, outgoing and solar interpolation
and storage, rather than isolating altitude alone.

The negative source bias offsets a positive reconstruction remainder roughly
20 to 47 times larger. S160 reduces source error but raises the combined
projected raw error by 1.61% to 3.97%. All 64 source effects are negative and
all 64 refinement responses positive. Reconstruction error is positive at 62
samples; the two exceptions are the noon samples at 58.593 metres, where
source refinement improves the local raw error. The aggregate result does
not hide those exceptions.

Factoring reduces the projected remainder by 89.51% / 92.94% in the morning
and 72.20% / 78.48% at noon, compared with split-species raw reconstruction.
Both noon results fail the frozen 80% gate. The factored remainder is negative
at every sample. Float32-versus-binary64 centre differences in the retained
projections are around 1e-9 W or smaller; all storage signs are unresolved
under the conservative propagated allowances. These results do not establish
GPU arithmetic parity or attribute the full second-order response.

The manufactured constant-illumination check separately reproduces the exact
density-factored limit and the raw exponential-density interpolation error,
including its quadratic small-cell trend. It does not impose that count law
on a regenerated atmospheric field. All 2,714 focused checks and the POC type
check pass; formal source review remains deferred. The accepted run retains
1,779,253 bytes and used 47,962 CPU-job milliseconds.

## Outgoing Phase Versus Transmission Reconstruction

The accepted [00202 decomposition](../../../../../tmp/experiments/sky-accuracy-dials/runs/00202-phase-recon/report.md)
exactly replays every source/reconstruction row and group from 00201. Starting
from binary64 density-factored reconstruction F, it replaces outgoing
interpolation with analytic phase at each altitude/solar anchor (B), then
applies phase at the actual query after reconstructing transmission alone (A).
The independent continuous density is D. The exact identity is
`F-D=(F-B)+(B-A)+(A-D)`.

These are fixed bottom-interval projections, in **mW m^-2 sr^-1 nm^-1**,
not complete viewing integrals:

| Ray   | Channel | Factored error | Outgoing interpolation | Solar-phase coupling | Transmission reconstruction |
| ----- | ------: | -------------: | ---------------------: | -------------------: | --------------------------: |
| 09:30 |       0 |      -0.475729 |              +0.065663 |            +0.000726 |                   -0.542117 |
| 09:30 |       8 |      -1.072326 |              +0.171363 |            -0.000009 |                   -1.243680 |
| 12:30 |       0 |      -1.748343 |              -1.171719 |            -0.000991 |                   -0.575633 |
| 12:30 |       8 |      -3.576588 |              -2.526087 |            -0.002139 |                   -1.048362 |

Six of eight registered predicates pass. At noon the outgoing contribution
accounts for about 67.02% / 70.63% of the factored remainder; removing it
passes both conservative 50% reduction gates. Solar-phase coupling passes
both 10% magnitude gates. The predicted negative outgoing contribution fails
in both morning channels: it is positive and offsets negative transmission
reconstruction error. Removing it worsens the combined morning error while
eliminating that interpolation contribution. Analytic evaluation of the
declared phase equation does not depend on improving a composite error.

This explains why a uniformly signed angular smoothing hypothesis was too
simple. The result does not establish a universal near-Sun bias or an
outgoing-resolution convergence law. The final transmission term still mixes
altitude and solar interpolation; the solar-phase term is not a complete
solar-grid error estimate. All local contributions and empirical allowances
remain in the artifact. No new optical integrals, GPU jobs or Kider inputs
were used. The 50 additional manufactured checks and full POC type check pass;
formal review remains deferred. The run retains 1,839,794 bytes and used
49,335 CPU-job milliseconds.

The registered [transmission decomposition](transmission-reconstruction-plan.md)
is complete as 00203, described below.

## Altitude Versus Solar Transmission Error

The [00203 crossed-coordinate test](../../../../../tmp/experiments/sky-accuracy-dials/runs/00203-trans-recon/report.md)
adds independent transmission at each sample's solar cosine and its two
original altitude anchors. All 64 coordinates pass the unchanged Gauss/Simpson
reference criteria; 256 rule/scale passes consume 119,616 medium evaluations.
The prior source and phase decompositions replay exactly.

For original transmission reconstruction R, exact-solar altitude interpolation
H and continuous query reference D, `R-D=(R-H)+(H-D)`. With common query density
and phase, the fixed bottom-interval projections are:

| Ray   | Channel | Altitude contribution, mW | Solar contribution, mW |
| ----- | ------: | ------------------------: | ---------------------: |
| 09:30 |       0 |              -0.542120975 |           +0.000003637 |
| 09:30 |       8 |              -1.243683540 |           +0.000003558 |
| 12:30 |       0 |              -0.575623443 |           -0.000009392 |
| 12:30 |       8 |              -1.048353441 |           -0.000008254 |

All twelve frozen hypotheses pass. Altitude causes more than 99.998% of the
transmission remainder in these projections and is negative beyond allowance
at all 64 scalar samples. Solar contributions are resolved, positive morning
and negative noon, but extremely small at these samples. This local result
supports prioritizing altitude representation; it is not a claim that solar
resolution is adequate everywhere or at sunset.

The 41 additional manufactured checks and full POC type check pass. The run
retains 2,056,869 bytes and used 151,325 CPU-job milliseconds, with no GPU job
or measurement comparison. Formal review remains deferred.

This attribution motivates the registered
[column-representation test](column-reconstruction-plan.md): factor the known
exponential starting density out of each species' geometric sunlight column,
then form optical depth and transmission after reconstruction. Its controls
reuse existing independent columns and include the exact finite-top vertical
limit. They change representation, not physical inputs or measured targets.

## Reconstructing The Known Sunlight-Column Structure

The accepted [00204 control](../../../../../tmp/experiments/sky-accuracy-dials/runs/00204-column-recon/report.md)
reuses the exact-solar endpoint columns from 00203. It compares linear geometric
columns, density-factored columns, and density factoring with the known
finite-top plane-parallel term added before normalization and removed after
reconstruction. These are changes of representation of the same spherical
field, not changes to its physical input. The adjusted form exactly recovers
the finite-top vertical manufactured field.

Fixed bottom-interval projections, **mW m^-2 sr^-1 nm^-1**:

| Ray   | Channel | Original transmission interpolation | Linear columns | Density-factored columns | Finite-top adjusted |
| ----- | ------: | ----------------------------------: | -------------: | -----------------------: | ------------------: |
| 09:30 |       0 |                        -0.542120975 |   -0.863924081 |             +0.000103208 |        -0.000001070 |
| 09:30 |       8 |                        -1.243683540 |   -1.470777663 |             +0.000089756 |        -0.000000930 |
| 12:30 |       0 |                        -0.575623443 |   -0.782080613 |             +0.000093913 |        -0.000000123 |
| 12:30 |       8 |                        -1.048353441 |   -1.177365042 |             +0.000072296 |        -0.000000095 |

All 136 frozen predictions pass: 128 scalar and eight projection gates require
at least 99% error reduction, including numerical allowances. The worst
conservative remaining-error ratio among individual samples is 0.000237877
for density factoring and 0.00000421111 for the adjusted form: reductions of
at least 99.9762% and 99.99957%, respectively.

Ordinary linear columns worsen the negative error in every projected group.
Applying the known exponential density structure removes the dominant
interpolation error. Unadjusted factoring leaves a small positive bias; the
finite-top adjustment removes most of it. Both noon adjusted projection signs
are inside their propagated allowances, so their tiny negative centres must
not be interpreted as established physical bias. The adjusted local signs are
39 negative and 25 unresolved. No positive adjusted local error is resolved.

This qualifies a representation control only for the retained samples with
independently integrated exact-solar columns. It does not yet test the original
solar-grid reconstruction, finite source-count interaction, GPU arithmetic,
higher orders or whole-sky error. Those distinctions prevent relabeling a
component solution as a complete algorithm correction.

The 87 new manufactured checks and full POC type check pass; formal source
review remains deferred. The run retains 2,057,455 bytes and used 51,578
CPU-job milliseconds, with no new optical integral, GPU work or Kider input.

## Predictable Source Refinement After Reconstruction Corrections

The accepted [00205 original-grid test](../../../../../tmp/experiments/sky-accuracy-dials/runs/00205-source-grid/report.md)
uses only the original sixteen altitude/solar column anchors to construct its
candidates. It applies analytic query phase and density, the finite-top-adjusted
column representation, and the original solar cubic/altitude weights. The
extra exact-solar diagnostic columns are used only to replay prior evidence,
not to form the new candidates.

Fixed bottom-interval projections, **mW m^-2 sr^-1 nm^-1**:

| Ray   | Channel | Error with independent columns |    S80 error |   S160 error | Remaining error ratio | Response prediction error |
| ----- | ------: | -----------------------------: | -----------: | -----------: | --------------------: | ------------------------: |
| 09:30 |       0 |                   +0.000002751 | -0.159048607 | -0.039968059 |              0.251295 |                   0.6581% |
| 09:30 |       8 |                   +0.000002784 | -0.276401651 | -0.069466430 |              0.251324 |                   0.7235% |
| 12:30 |       0 |                   -0.000009498 | -0.145389927 | -0.036533085 |              0.251277 |                   0.6656% |
| 12:30 |       8 |                   -0.000008195 | -0.223317662 | -0.056119873 |              0.251301 |                   0.7316% |

All twenty frozen group predictions pass, including propagated allowances.
Independent columns retain the registered 99% improvement over the earlier
factored-density remainder. Both finite counts have negative errors at all
64 scalar samples. Doubling source integration removes about 74.87% of error
in every projection, consistent with the quadratic integration expectation.
The analytic endpoint-derivative prediction is propagated through the same
nonlinear reconstruction and predicts the observed response within 0.66-0.73%.

This combination explains the earlier apparent contradiction. In the original
raw representation, source under-transmission offsets larger positive
reconstruction error, so increasing source samples worsens the combined
positive error. With those identified reconstruction errors corrected, the
same refinement reduces the remaining negative error predictably. It is a
controlled component comparison with unchanged physical inputs and no Kider
fitting, not a claim about the full production recurrence.

The source S160 values were already known. This is a preregistered propagation
and combination test; it does not replace validation at a newly withheld count
or establish behavior at grazing angles, sunset, other heights or the whole
spectrum. Retain that qualification when describing the dial. It also does
not measure GPU arithmetic parity or memory cost of a promoted implementation.

The 63 additional manufactured checks and full POC type check pass. The run
retains 2,199,027 bytes and used 52,734 CPU-job milliseconds, without new
source integration, GPU work or measurement input. Formal review is deferred.

## Held Source Refinement With Corrected Reconstruction

The [00208 forecast](../../../../../tmp/experiments/sky-accuracy-dials/runs/00208-s320-predict/forecast.json)
was sealed before [00209](../../../../../tmp/experiments/sky-accuracy-dials/runs/00209-s320-target/report.md)
computed any atmospheric S320 columns. Unlike the previous known-S160
combination, this tests an unexecuted count. All 1,368 baseline replay
comparisons agree exactly, including independent, S80 and S160 reconstructed
values. All sixteen generic S160 column pairs reproduce the prior columns
before the target integrator runs.

The prediction uses the known endpoint-derivative response at S160 and the
same corrected column reconstruction. All twelve group predictions and all
192 local predicates pass, including allowance-aware negative error, error
ratio and response accuracy tests.

| Ray   | Channel | S160 error (W m^-2 sr^-1 nm^-1) |     S320 error | S320/S160 magnitude | Response prediction error |
| ----- | ------: | ------------------------------: | -------------: | ------------------: | ------------------------: |
| 09:30 |       0 |                  -3.99680590e-5 | -1.00030672e-5 |           0.2502765 |                   0.1647% |
| 09:30 |       8 |                  -6.94664301e-5 | -1.73877340e-5 |           0.2503041 |                   0.1811% |
| 12:30 |       0 |                  -3.65330853e-5 | -9.15164893e-6 |           0.2505030 |                   0.1666% |
| 12:30 |       8 |                  -5.61198731e-5 | -1.40540426e-5 |           0.2504290 |                   0.1831% |

These are fixed bottom-interval projections against the continuous-query
reference. Doubling the source count removes 74.95-74.97% of the remaining
component error. The tighter 0.5% response prediction threshold passes without
fitting a coefficient to target radiance. This supports the expected leading
inverse-square count law after the identified representation errors are
corrected. It explains why refining the same source integral previously
increased the composite error: that refinement removed a compensating dimming
term while larger reconstruction errors remained.

The independent-reference and representation floors are still included. This
does not establish unlimited monotonicity, new geometries, GPU arithmetic
parity, complete viewing radiance or higher-order propagation. Kider values
do not enter the prediction or its correctness tests.

The forecast retains 1,709,368 bytes and used 39,463 CPU-job milliseconds.
The target retains 1,744,249 bytes and used 40,228 CPU-job milliseconds.
Only 7,712 geometry samples / 15,424 species-density evaluations were required;
there were no new adaptive reference solves or GPU jobs. All 107 manufactured
proof checks and the full POC type check pass. Formal source review is deferred.

## Angular Normalization Versus Directional Structure

The accepted [00206 decomposition](../../../../../tmp/experiments/sky-accuracy-dials/runs/00206-angular-bg/report.md)
reuses all incident nodes for the four retained angular rules at
`p-0930-5-7:h1000`. Both original compressed/decompressed identities,
representative and mirror directions, and all original component sums
authenticate and replay. No incident solve is repeated.

A single r16-a32 discrete mean is fixed for each incident component. For each
species, the response splits exactly into that background times the change in
phase mass, plus the response integrating the remaining directional field.
The mean is a diagnostic constant, not an admitted continuous angular mean.
The comparison attributes observed refinement responses, not absolute error
against a newly qualified angular oracle.

| Refinement   | Channel 0 background share | Channel 8 background share | Frozen <=10% result               |
| ------------ | -------------------------: | -------------------------: | --------------------------------- |
| Radial only  |                    12.137% |                    13.911% | Both fail                         |
| Azimuth only |                     9.554% |                     7.314% | Both pass                         |
| Combined     |                    10.022% |                     8.066% | Channel 0 fails; channel 8 passes |

The table shows central ratios; gates also include propagated numerical
allowances. Three of six predictions pass. Directional-field variation
accounts for most of each response, but the constant-background normalization
contribution is larger than the frozen 10% threshold in three cases.
All six background terms share the sign of the corresponding total response.

Rayleigh phase mass agrees with one to rounding on all four rules. Mie phase
mass minus one changes from 0.000792733 at r8-a16 to 0.000003331 at r16-a32.
That is a known constant-field error under the declared normalized phase
function. It does not measure the error for the anisotropic atmosphere.

Atmospheric Mie scattering dominates the observed combined refinement:
its contributions are -5.01657e-9 / -8.55290e-9 density units in channels0/8,
versus net responses -4.79922e-9 / -8.13779e-9. Other terms partly offset that
change; the ground responses are much smaller. This motivates locating the
remaining directional response in incoming-angle space before choosing a
sampling mitigation. These rules split three geometric radial intervals;
they are not the production H full-sphere product rule.

The 24 manufactured checks and full POC type check pass. The run retains
1,917,919 bytes and used 37,867 CPU-job milliseconds. It adds no optical
integrals, GPU jobs or Kider comparison. Formal source review remains deferred.

## Where The Directional Angular Response Originates

The accepted [00207 partition](../../../../../tmp/experiments/sky-accuracy-dials/runs/00207-angular-regions/report.md)
reuses the same morning h1000 incident nodes. Fixed smooth weights partition
the directional response into a Sun-centered part, a radial-tangent band and
the remainder. The Sun weight falls to half at about 16.8 degrees. These are
overlapping smooth attribution weights that sum to one, not hard sky regions.
Each mirrored incident member retains its own phase and partition weight.

All fourteen registered predictions pass: the Sun part has the same resolved
sign and at least half the magnitude of each radial, azimuth and combined
directional response, and the tangent-band contribution is at most 10% of
each combined response, including allowances.

| Refinement   | Channel 0 Sun / directional response | Channel 8 Sun / directional response |
| ------------ | -----------------------------------: | -----------------------------------: |
| Radial only  |                              103.01% |                              144.04% |
| Azimuth only |                              101.91% |                               68.34% |
| Combined     |                              100.61% |                               73.94% |

These central signed ratios can exceed 100% because the other regions partly
cancel the Sun contribution. For combined refinement, the tangent-band shares
are 9.00% and 1.05%. Radial-only channel 0 is different: its tangent contribution
is about 60.2% of the net directional response and is largely offset elsewhere.
Thus a small combined horizon share does not mean radial horizon sampling is
irrelevant. The partition identifies spatial concentration of the observed
discrete responses, not the location or magnitude of absolute angular error.

Together with `00206`, this supports resolving the Sun-centered directional
field as a sampling priority rather than treating phase normalization alone
as the main explanation. It does not qualify a new angular sampling rule,
the production H rule, or complete second-order viewing radiance. No physical
model coefficient or observation score was used to choose the partition.

The 232 manufactured checks and full POC type check pass. The run retains
1,980,063 bytes and used 38,222 CPU-job milliseconds, with no new incident
integration or GPU work. Formal source review remains deferred.

## A Known Angular Integral Separates Sampling From Path Structure

The accepted [00210 benchmark](../../../../../tmp/experiments/sky-accuracy-dials/runs/00210-angular-lobes/report.md)
prescribes incoming radiance as the declared Cornette-Shanks phase function
and integrates its product with the outgoing scattering phase. The independent
Legendre-convolution reference agrees with the separate 64-by-256 angular
cross-check within 2.2e-15 at both frozen geometries. Its truncation bound and
empirical arithmetic allowance remain separate.

All ten registered hypotheses pass. The manufactured phase peaks reproduce
the negative radial, azimuth and combined morning responses, with azimuth
refinement much more effective. Atmospheric path or ground structure is not
required to produce that qualitative behavior. This supplies a sufficient
mechanism; it does not establish that those other effects are absent from the
actual atmospheric response.

| Rule                         | Complete directions | 09:30 integral error (sr^-1) | 12:30 integral error (sr^-1) |
| ---------------------------- | ------------------: | ---------------------------: | ---------------------------: |
| Original r8-a16              |                 384 |               +4.39698230e-3 |               -3.13841246e-3 |
| Radial refinement r16-a16    |                 768 |               +3.99171074e-3 |               -7.74660158e-6 |
| Azimuth refinement r8-a32    |                 768 |               +2.89818024e-4 |               -3.12688229e-3 |
| Combined r16-a32             |               1,536 |               -1.13231169e-6 |               +1.77262796e-6 |
| Radial product 32-by-12      |                 384 |               +8.81668468e-3 |               -3.04750479e-4 |
| Sun-aligned product 32-by-12 |                 384 |               -1.21615175e-6 |               -2.80004875e-9 |

The independent integrals are 0.48846976587733726 and 0.5830795439518767 sr^-1.
The Sun-aligned product reduces absolute error relative to the matched radial
product by 99.9862% and 99.9991%, without changing direction count. Its relative
errors are about 0.000249% and 0.000000480%. The coordinate and azimuth-frame
conventions are explicit in the registration; this is not a cost comparison
between different counts.

Which count matters changes with geometry: radial refinement dominates at
noon in this manufactured field, while azimuth refinement dominates in the
morning. The coarse errors even have opposite signs. This demonstrates why
an undifferentiated direction-count rule cannot predict error reliably.
The phase-aware frame is a promising operational control for this smooth
integrand; ground visibility and atmospheric path features may require an
additional partition or different allocation in the actual integral.

No actual incident radiance, GPU construction or Kider score is computed.
The run retains 1,927,302 bytes and used 37,505 CPU-job milliseconds. Its 60
manufactured checks and the full POC type check pass. Formal review is deferred.

## What Later-order Corrections Cannot Remove

The retrospective [00187 bound](../../../../../tmp/experiments/sky-accuracy-dials/runs/00187-positive-bound/report.md)
uses admitted physical P1 and P2 at `p-0930-5-7`. For any nonnegative sum Q of
later physical scattering orders, `P1+P2+Q-M >= P1+P2-M`. Subtract the original
P1 allowance, complete P2 allowance and operand-scaled arithmetic allowance
to obtain the conditional lower value. Cached third/fourth orders do not enter
this bound.

| Channel | P1+P2 minus measurement, mW | Lower value after numerical allowances, mW | Upward measurement shift needed to erase lower value |
| ------- | --------------------------: | -----------------------------------------: | ---------------------------------------------------: |
| 0       |                   10.954220 |                                  10.953419 |                                              10.255% |
| 8       |                   21.698010 |                                  21.696744 |                                              11.694% |

Even removing every currently cached third/fourth contribution leaves this
positive excess. Correcting later orders to any nonnegative physical solution
cannot erase it under the admitted component error budgets. Thus later-order
numerical error and missing positive scattering cannot explain the entire
remaining morning discrepancy. The comparison is spectral, before application
display conversion.

The percentages are required shifts in the existing measured values, not
measured uncertainty or evidence that the instrument was wrong. The result
remains conditional on empirical numerical reference allowances. Shared
reference bias outside those allowances, physical inputs/model assumptions,
geometry and observation comparison remain possible explanations. This bound
does not identify which is responsible or establish complete N4 accuracy.
A negative bound at another condition would give no upper bound on its tail.

The source and 15 focused algebra checks pass locally; formal review remains
deferred. The accepted seal SHA-256 is
`cf2437416ceb94f08991a56357a9cc920eee6af1175616ace6f1658efa984369`.

## Atmospheric Angular Frame: Overshoot And Reference Limit

The [registered atmospheric frame comparison](angular-frame-plan.md) is assessed
in [00217-af-assess](../../../../../tmp/experiments/sky-accuracy-dials/runs/00217-af-assess/report.md).
All five numerical stages `00212`-`00216` complete their incident, component,
geometry and independent mirror checks. They evaluate one morning point at
1000 m, in channels 0 and 8. The two predicted negative total responses pass;
the other four registered accuracy predicates remain unresolved because both
combined angular references fail the predeclared uncertainty criterion.

The following provisional errors are candidate minus the mean of the finest
Sun and radial results, in **10^-9 W m^-3 sr^-1 nm^-1**. They are scattering
source densities, not viewing radiance or RMSE. The final column is the
reference allowance; each error additionally carries its own small incident
and arithmetic allowance, retained in the assessment.

| Channel | Original radial 384 directions | Sun 384 directions | Sun 1536 directions | Reference allowance |
| ------: | -----------------------------: | -----------------: | ------------------: | ------------------: |
|       0 |                      +4.852893 |         -10.392915 |           -0.847685 |            1.612578 |
|       8 |                      +8.221113 |         -17.632467 |           -1.180625 |            2.231310 |

Within this empirical envelope, the coarse Sun construction overshoots and
has larger absolute error than the original. This is a diagnostic comparison,
not a passed angular-accuracy qualification: the reference uncertainty exceeds
the frozen limit of 10% of the original error lower bound. The two finest
radial rules differ by only 6.26e-16 and 1.80e-14 in the unscaled density units,
whereas Sun16-to-Sun32 changes by 7.95e-10 and 1.10e-9. That last Sun refinement
dominates the conservative allowance. Agreement within one coordinate family
does not remove this independent-coordinate evidence.

The atmosphere Mie term dominates the coarse change. Component effects are
not uniform: the two channel-0 ground references are admitted and both reject
the predicted coarse 80% improvement, while their first Sun refinement passes
the 50% reduction criterion. In channel 8, ground responses oppose the total
decrease, but their absolute-error qualification remains unresolved. No total
response is used to hide those component differences.

The earlier successful phase-product benchmark used a different polar-node
distribution and azimuth origin. Therefore its success did not establish
that this boundary-aware construction resolves the same lobe. The prospective
[frame/placement control](angular-frame-control-plan.md) separates those two
construction changes using the known analytic integral and no new atmospheric
incident solves. It tests whether node placement alone explains the failure
before assigning the remaining error to attenuation or visibility structure.

The six records retain **6,676,308 bytes**, use **1,344,882 CPU-job
milliseconds**, and contain 19,402 incident evaluations, including independent
mirror witnesses. No GPU job, full cache or Kider input is used. Source
geometry, runner and assessment proofs pass 89, 27 and 15 checks respectively;
the full POC type check passes. Formal source review remains deferred. The
assessment seal SHA-256 is
`888e8a467bd976e3b55a989163c6b44ad0a87e5907d1e6d98cdce01bea42c417`.

## The Boundary-Split Rule Also Fails On A Known Smooth Field

The [matched analytic control](angular-frame-control-plan.md) is accepted as
[00218-af-control](../../../../../tmp/experiments/sky-accuracy-dials/runs/00218-af-control/report.md).
The original manufactured result replays exactly, all 19 implementation checks
pass, and the independent analytic reference is admitted. Fourteen of seventeen
scientific predictions pass. The failed predictions are the coarse split rule's
0.01% product-error limit and the coarse/medium split rules' Mie normalization
limits. Their geometry, positive weights and total solid angle remain valid.

| Sun-axis construction                                | Directions | Signed relative error in the known phase-product integral |
| ---------------------------------------------------- | ---------: | --------------------------------------------------------: |
| Original unpartitioned32x12, outgoing azimuth origin |        384 |                                             -0.000248972% |
| Unpartitioned32x12, radial azimuth origin            |        384 |                                             -0.000105110% |
| Unpartitioned24x16, radial azimuth origin            |        384 |                                             -0.000036270% |
| Three physical intervals, 8 nodes each x16 azimuths  |        384 |                                                -1.885734% |
| Three physical intervals, 16 nodes each x32 azimuths |       1536 |                                                -0.096752% |
| Three physical intervals, 32 nodes each x64 azimuths |       6144 |                                                -0.010286% |

Rotating the azimuth origin preserves the original accuracy threshold. Holding
that origin, the same sixteen azimuths and the same 384 directions fixed,
replacing the unpartitioned polar nodes with the physical interval construction
introduces a large negative error. Thus the placement change alone produces
the failure on a known smooth field; additional atmospheric attenuation,
visibility or ground variation is not required. Even the 6144-direction split
rule is less accurate on this manufactured integral than the 384-direction
unpartitioned control. This does not establish the unpartitioned rule's
accuracy for an actual atmosphere with physical boundaries.

The split refinements remove 94.87% and 89.37% of their preceding absolute
errors, passing both registered 50% predicates. Mie phase-mass errors are
-0.1480%, -0.02114% and -0.002678% at the three split resolutions; normalizing
a constant field and accurately integrating a directional field are distinct
requirements. No phase renormalization was applied.

The next attribution question is whether the poor placement merely allocates
too few nodes to a peak or also loses the azimuth cancellations that make a
Sun-polar cosine rule smooth after angular averaging. The existing physical
splits make the polar nodes depend on azimuth. An exact-zero azimuth component
and an endpoint-coordinate control can distinguish those explanations cheaply.
This remains a hypothesis; `00218` identifies the construction responsible but
does not yet identify its complete asymptotic error mechanism.

This record retains **494,386 bytes**, uses **73,016 CPU-job milliseconds**,
and performs no atmospheric integration or GPU job. All 84 manufactured proof
checks and the full POC type check pass; formal review remains deferred. Its
seal SHA-256 is
`0e6a899f7b0658fac209066458c4b3529d04138eb7aff87f6b2350f8455f65f0`.

## Endpoint Regularity Explains The Fine Angular Error

The [endpoint/cancellation control](angular-endpoint-plan.md) is accepted as
[00219-af-endpoint](../../../../../tmp/experiments/sky-accuracy-dials/runs/00219-af-endpoint/report.md).
All 44 implementation checks and 20 of 21 scientific gates pass. A half-turn
about the Sun separates the phase field into even and odd azimuth components;
the latter has exactly zero sphere integral. The original shared-polar-node
rule preserves this cancellation within arithmetic allowance. The physical
split rule introduces a nonzero odd component.

| Original split rule | Odd component's signed share of total phase error | Remaining even error |
| ------------------- | ------------------------------------------------: | -------------------: |
| 8x16                |                                          55.2844% |        -0.0041188592 |
| 16x32               |                                          96.7121% |        -0.0000155386 |
| 32x64               |                                          99.9998% |            -9.27e-11 |

The coarse 80% attribution prediction fails: both the even and odd components
matter at that resolution. The two finer attribution predictions pass. This
separates the coarse peak-resolution error from the slower endpoint error,
which dominates after refinement. These are signed terms of an exact
decomposition, not fractions of unrelated error norms.

An independent smooth Cartesian polynomial has exactly zero sphere integral
but becomes square-root-shaped at the poles in the cosine coordinate. Its
split-rule bias is positive as predicted. At fixed azimuth64 its n16/n32/n64
values are 0.0019980550, 0.0002587427 and 0.0000330121, with successive ratios
about 0.12950 and 0.12759. Doubling azimuth at n32 barely changes this bias or
the odd phase error; both 1% azimuth-control gates pass.

The endpoint law predicts the new n64 values using the fixed factor
`(32.5/64.5)^3 = 0.1279295697`. Its magnitude discrepancy is **0.269%** for
the polynomial and **3.734%** for the odd phase component; both signs and both
25% prediction gates pass. The formula was preregistered and its scalar
forecast was formed before evaluating n64 in the same evidence record, as
the plan explicitly specifies. This is not a separately sealed scalar forecast.
The [plan](angular-endpoint-plan.md#governing-expectation) gives the mathematical
derivation and primary asymptotic reference, with the finite-count scope stated.

The matched n16/azimuth64 coordinate control preserves the same physical
boundaries and number of samples, but integrates polar angle with its
sin(theta) solid-angle Jacobian. It reduces the known phase-product error
from -0.0004726050 to +6.3923e-8, a **99.9865% reduction**, and reduces the
polynomial bias to -2.77e-14, inside its 3.01e-11 arithmetic allowance.
Both registered 99% improvement gates pass. No weights were renormalized.

This establishes an endpoint/azimuth-cancellation mechanism and a corrective
coordinate control on the isolated fields. The coarse rule also has a material
even-component error, so one mechanism does not explain its entire loss.
The subsequent atmospheric test below measures that coordinate change on
actual incident radiance. Neither this isolated control nor that local test
establishes a production improvement.

This record retains **539,058 bytes** and uses **71,508 CPU-job milliseconds**,
with no atmospheric integration or GPU job. Its 81 manufactured proof checks
and the complete POC type check pass; formal review remains deferred. The seal
SHA-256 is
`be5d89cab17e47d10975f7a942dbe715d6f862814cc2b8775d153f7d4f9dfe7f`.

## Correcting The Coordinate On Actual Atmospheric Radiance

The [registered atmospheric test](angular-theta-plan.md) is complete as
[pilot 00220](../../../../../tmp/experiments/sky-accuracy-dials/runs/00220-at-pilot/reference.json),
[fine 00221](../../../../../tmp/experiments/sky-accuracy-dials/runs/00221-at-fine/reference.json)
and [assessment 00222](../../../../../tmp/experiments/sky-accuracy-dials/runs/00222-at-assess/report.md).
The pilot replaces cosine-polar integration with polar-angle integration and
its sin(theta) Jacobian, preserving the physical intervals, model and 1,536
full directions of the experimental Sun-aligned mu16/azimuth32 control.
This comparison repairs that experimental rule; it is not a measured 99%
improvement over the original production algorithm.

The fine rule uses 6,144 directions. Its comparison with separately evaluated
radial32/radial64 rules supplies an empirical reference allowance, including
both families' refinement, their disagreement and incident integration
uncertainty. The registered 10% reference-precision gate remains unchanged.

| Channel | Matched mu16 error | Theta16 error | Reference allowance | Central error reduction | Registered combined result                      |
| ------: | -----------------: | ------------: | ------------------: | ----------------------: | ----------------------------------------------- |
|       0 |       -9.00395e-10 |  -8.86649e-12 |         4.04106e-11 |                99.0153% | Reference and at-least-80% reduction pass       |
|       8 |        -1.25775e-9 |  +8.25572e-11 |         1.89322e-10 |                93.4361% | Reference precision fails; reduction unresolved |

Values are scattering densities in W m^-3 sr^-1 nm^-1 at the selected morning
h1000 point. The channel-0 error reduction is **93.7080%** under the full
candidate, control and reference allowances. The channel-8 central percentage
is descriptive only; it does not pass the registered accuracy qualification.
Of the four registered predictions, both positive-response predictions and
the channel-0 improvement pass; channel-8 improvement remains unresolved.

The atmospheric Mie term dominates the corrected mu16 deficit. In channel 0
its independent component reference and improvement gate also pass. Ground
component changes remain separate and small relative to the total correction;
their precision gates do not support independent accuracy claims. The
channel-8 ground-Rayleigh coordinate response is negative, illustrating why
a combined positive response cannot be assigned to every physical component.

After the coordinate change, theta16-to-theta32 changes channel 0 by
`(+8.86765 +/- 9.07403)e-12`, unresolved under its incident/arithmetic allowance,
and channel 8 by `(-82.5199 +/- 9.71372)e-12`, a resolved remaining response.
The latter comprises atmospheric Rayleigh -37.2546e-12, atmospheric Mie
-51.8904e-12 and a compensating ground sum +6.6250e-12. The fine theta and
radial64 combined values agree within incident allowances, but this agreement
does not erase the larger preceding refinement term from the reference budget.
The [regional follow-up](angular-theta-regions-plan.md) below locates that
remaining response using saved nodes.

This supports the identified coordinate mechanism on actual atmospheric
radiance at one point. It establishes neither transfer to another geometry,
complete viewing radiance, later recurrence, GPU arithmetic nor Kider benefit.
The three records retain **2,537,334 bytes** and charge **410,030 CPU-job
milliseconds**. Pilot/fine evaluate 770/3,074 incident directions, including
independent mirror witnesses. Geometry, assessment and runner proofs pass
90, 11 and 23 checks, respectively; the complete POC type check passes.
Formal review remains deferred.

## The Remaining Theta Response Concentrates Near The Horizon

The [saved-node regional test](angular-theta-regions-plan.md) is accepted as
[00223-at-regions](../../../../../tmp/experiments/sky-accuracy-dials/runs/00223-at-regions/report.md).
Both registered channel-8 atmospheric predictions pass: the horizon-weighted
response has the same resolved sign as the complete atmospheric response and
contributes at least half its magnitude under the full uncertainty allowances.
All 89 implementation checks and 50 manufactured proof checks pass, as does
the full POC type check. Original physical component rows and mirror admissions
replay exactly; region sums use arithmetic-only checks for their shared-input
accounting identities.

| Channel 8, atmospheric fine-minus-pilot response |    Value | Allowance |
| ------------------------------------------------ | -------: | --------: |
| All directions                                   | -89.1450 |    9.7224 |
| Sun-weighted                                     |  -0.9732 |    3.0125 |
| Horizon-weighted                                 | -92.0098 |    0.9672 |
| Other directions                                 |  +3.8380 |    5.7427 |

Units are 1e-12 W m^-3 sr^-1 nm^-1. The horizon contribution is **103.2137%**
of the central net atmospheric response. Values above 100% reflect cancellation
in the computed central terms; the small Sun and other responses individually
overlap zero under their incident allowances. Atmospheric Rayleigh and Mie
both contribute to the resolved negative horizon response. The ground sum
changes by +6.6251e-12, partly offsetting the atmosphere and yielding the
combined -82.5199e-12 response. Channel 0's combined response remains unresolved,
although its horizon-weighted contribution is positive and resolved.

This supports the predeclared concentration hypothesis after the coordinate
correction. It separates the remaining response from the earlier Sun-centered
phase/endpoint error and identifies near-horizon structure as a local sampling
priority. It still attributes a difference between two existing rules, not
absolute angular error. Both polar and azimuth counts changed, so neither axis
is separately identified. The channel-8 reference-precision failure in 00222
remains unchanged; no production, full-sky or Kider improvement follows.

The run retains **1,111,538 bytes** and charges **94,457 CPU-job milliseconds**.
No new incident integration, GPU job or incident-array artifact was created.
The generic run allocator did create **141,910 bytes** of disposable scratch
ownership metadata and verified its removal. This is a literal exception to
the plan's no-scratch wording, not an extra numerical dataset; the original
plan is preserved and all resource caps pass. The accepted seal SHA-256 is
`be5fb27da63f11f784da051d9981efbe9c74b55d4b6d42b709b65338cda4534e`.

This was the owner's requested final test before a break. Execution is paused;
the [handoff](handoff.md) records the resumption boundary. No further angular
ladder or other experiment was started. Formal review remains deferred.

## Current conclusion

The morning physical P2 reference is adequate and both altitude/density controls
pass their registered component-error reductions. These claims cover the two
selected morning channels. The first held altitude count passes its response
predictions, while the finer count exposes their range limit. A competing-rate
model explains more of that response but still fails one local gate. The
independent second physical condition now passes all reference and registered
altitude/representation improvement checks. This extends component support to
both selected rays and channels, while preserving the failed finer-count law.
The boundary intervention identifies a missing contribution whose dimming
error offsets a larger positive P2 error. The held source-column test passes,
establishing predictable component convergence. Matching-sample attribution
now demonstrates that negative source error offsets a much larger positive
raw reconstruction error. After density factoring, outgoing interpolation
and transmission reconstruction can also compensate, with different signs
at the two viewing geometries. The complete transport interaction remains
unquantified.

The held scalar order forecast is assessed in
[00180-p55-assess](../../../../../tmp/experiments/sky-accuracy-dials/runs/00180-p55-assess/assessment.json).
The primary damped model fails the aggregate 25% magnitude criterion
and three of four local magnitude criteria. Its prediction-error norm is
`1.208391757033995e-5 W`, versus `2.5421832701018835e-5 W` for the comparison
model. Seven signs resolve and agree. The remaining morning channel-8 sixth-order
prediction is inside its comparison floor and stays unresolved. Both the
comparison noninferiority and conservative superiority tests favor the primary
model, but its absolute accuracy gates fail: it is not a qualified tuning rule.
The accepted assessment preserves that scientific failure. Its seal SHA-256 is
`9ce21f51ce7d432518acd3fdce8ec32388aad686d49b3fcec2b1ed2558b3885d`;
it retains 1,445,941 bytes and consumed 35,062 CPU-job milliseconds.

The implementation explains why a one-ray ratio model can be incomplete.
The [scatter and transport kernels](../../../../../experiments/sky-accuracy-dials/orders/kernels.js)
act on the whole angular and altitude field and are linear in previous-field
values in exact arithmetic. The raw propagated recurrence's
[sampling functions](../../../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js)
use linear solar interpolation. Fixed-medium attenuation does not depend on
the previous radiance field. GPU arithmetic still introduces rounding.

P55 [inserts seven near-ground nodes](../../../../../experiments/sky-accuracy-dials/numerics/profile.js)
at multiples of 234.375 metres below 1875 metres while preserving original
nodes. This changes the interpolation brackets, computed receiver fields and
subsequent transport. It also changes the final altitude-segmented viewing
abscissae and weights. For recurrence operators K48/K55 and a grid-transfer
operator P, the error evolves as
`e_n = K55 e_(n-1) + (K55 P - P K48) L48_(n-1)`.
Projected ratios at one ray do not determine either full-field term.

Separately, [monotone-cubic solar reconstruction](../../../../../experiments/sky-accuracy-dials/numerics/math.js)
in the final view is not additive, and
[grouped higher fields](../../../../../experiments/sky-accuracy-dials/orders/view.js)
are left-folded in Float32 before reconstruction. An effective grouped
increment `G_n-G_(n-1)` therefore need not equal an independently reconstructed
pure Jn contribution. These are mechanisms a fuller predictor must distinguish;
the held scalar forecast alone does not measure which dominates its misses.

The remaining discrepancy has mixed signs, so one missing positive scattering
term cannot explain every selected error. The new nonnegative-order bound
further excludes later-order errors as the entire explanation for the selected
morning excess, under the admitted first/second-order references. Error allocation and the coordinate
used to integrate nearly tangent rays are now tested operational controls that
resolve distinct reference failures at unchanged tolerances. Their benefits
come from addressing identified numerical structure, rather than fitting a
compensating brightness offset to Kider.
Radial sampling substantially reduces aggregate local second-order angular
error, while the individual regressions expose further cancellation.

The ground-boundary mechanism is traced, and the coarse physical viewing
integral shows a small first-shell ground-light contribution relative to the
remaining morning residual. The literal cached-row intervention now passes
and measures its compensating effect on both altitude grids. The positive-height
angular factorial and completed morning reference pass their registered
predictions. Current work prioritizes error attribution; the independent
12:30 reference passes the registered contrasting-residual test. The matching-sample source and phase diagnostics are complete. The crossed-coordinate references now identify altitude as the dominant
remaining transmission reconstruction error. The density-factored source-column controls and original-grid interaction now
pass their registered predictions. They restore predictable source refinement
on the tested first-order component; higher-order angular and transport
errors remain distinct outstanding sources.
The held S320 test now validates that restored source-count behavior on a
new count. The independent phase-product benchmark establishes a second
mechanism: directional peaks can be sampled very differently by radial and
azimuth refinement, with the dominant error changing between viewing geometries.
A Sun-aligned frame improves that manufactured integral at unchanged sample
count. This separates a real quadrature difficulty from a generic normalization
problem. The actual boundary-aware atmospheric construction does not yet
qualify: its coarse rule overshoots the finer results and the registered
reference allowance remains too large. The matched analytic control now
isolates polar node placement as sufficient to produce the large error,
without additional atmospheric structure. Exact physical boundaries and a
larger total count do not ensure that a quadrature resolves the integrand.
The endpoint control now separates those effects: the coarsest rule has two
material errors, while lost azimuth cancellation dominates the finer rules.
An endpoint-derived law predicts a new count, and the matched polar-angle
control sharply reduces the known integral's error. The matched atmospheric
coordinate test now passes its channel-0 component accuracy criterion, while
channel 8 retains an unresolved accuracy gate and a resolved refinement
response. The saved-node partition now locates that remaining response mainly
near the horizon under its registered uncertainty tests. That is evidence for
a local corrective mechanism and remaining sampling priority, not a production
performance claim. The successful
first-order controls improve agreement with the declared equations; they are
not fitted compensating offsets. Complete recurrence qualification remains open.

These component findings do not establish a new overall Kider improvement or
yet separate all higher-order numerical error, missing orders and physical
or measurement assumptions. The owner requested a break after 00223. Execution
is paused with no following test started, and formal verification remains
deferred. The [findings brief](accuracy-findings-brief.md) and [handoff](handoff.md)
give the useful outcomes and the next substantive recommendation.
