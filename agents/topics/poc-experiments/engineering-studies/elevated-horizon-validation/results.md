# Elevated Horizon Validation Results

Status: complete and verified on 2026-10-23. Production is unchanged. The
experiment remains selected for owner follow-up; no closure/promotion is implied.

## Conclusion

**libRadtran independently reproduces the low-contrast horizon with the current
Bruneton atmosphere at 10 km.** Production GPU N4 brightness is within 1.3% of
its all-order reference across the six sampled limb rays. The actual ground/depth
boundary is sharp; atmospheric path radiance dominates the displayed ground near
it. This supports the appearance under the selected physical assumptions, not a
claim that those assumptions describe actual atmospheric conditions in San Jose.

Aerosols strengthen the effect, but are not its sole cause. Removing them increases
contrast and transmission while substantial molecular scattering remains. The
results do not support treating this appearance as a broken cache or applying an
unvalidated rendering fix to restore a conspicuous edge.

## M1 - A matched elevated reference

The existing libRadtran 2.0.1-MYSTIC executable and data authenticate through a
contained Node/Python adapter. Fully spherical scalar backward transport, VROOM
off, 10 km sensor, R=6360 km, top=60 km, executable native-15 source/coefficient
values, exponential molecular/aerosol profiles and analytic Cornette-Shanks g=.7
are matched. No Toronto measured properties, ozone, default aerosol model, fitted
exposure or refraction is introduced.

The analytic horizon is -3.210884957 degrees below local horizontal. The case is
anti-solar San Jose solar noon, 2024-06-20, 50 degree vertical FOV. User screenshots
lack original pixel metadata; this is a reproducible registered case rather than
a claim of screenshot pixel correspondence.

A vacuum/white-surface MYSTIC control verifies ray signs independently: 0.1 degree
below the true horizon receives the analytically expected Lambertian reflected
source; 0.1 degree above returns zero. Every actual app ground/sky classification
in the checked camera column agrees with the analytic sphere, at about 0.082 degree
per pixel near the boundary.

Raw runs: 00002 pilot, 00003/00010 six-seed baseline, 00004 refined layers, 00008
actual GPU pass, 00017 geometry. The pilot uses exact native centers
438.33/563.67/657.67 nm rather than introducing new input interpolation at
450/550/650 nm. Final comparisons use all 15 channels.

The native channels are bin-average densities. Their optical coefficients and
source density are held constant within matching bins; CIE functions are integrated
across each bin. External wavelength labels index this discrete model. No point
sample is silently relabelled as integrated energy, and no continuous real-world
spectral convergence is claimed.

Disposition: reference usable. The installed cache has black ground, so a matched
neutral spectral-ground feedback scan would require a new controlled calculation.
That optional branch was not earned. The actual green RGB scene is assessed
separately, without inventing spectral reflectance from RGB.

## M2 - Horizon spectra and actual app compositing

- [Comparison strip](../../../../../tmp/experiments/elevated-horizon-validation/runs/00019-baseline-report/comparison.html)
- [Spectra plot](../../../../../tmp/experiments/elevated-horizon-validation/runs/00019-baseline-report/spectra.svg)
- [All spectra, contrasts and component data](../../../../../tmp/experiments/elevated-horizon-validation/runs/00019-baseline-report/analysis.json)
- [Brightness CSV](../../../../../tmp/experiments/elevated-horizon-validation/runs/00019-baseline-report/brightness.csv)

The strip uses common bin-integrated CIE conversion and production p2 exposure at
126972.69 lux. It is a sparse, registered nearest-ray strip, not a scene photograph
or smoothed boundary. Spectral plot connecting lines are presentation only. The
actual app capture and GPU readback are in run 00008.

| Horizon offset | libRadtran Y (cd/m2) | GPU Q30 Y | Relative difference |
| -------------: | -------------------: | --------: | ------------------: |
|  -1.00 degrees |    7327.28 +/- 10.61 |   7240.98 |             -1.178% |
|  -0.10 degrees |    8331.41 +/- 20.80 |   8280.52 |             -0.611% |
|  -0.02 degrees |    8439.21 +/- 25.92 |   8387.69 |             -0.610% |
|  +0.02 degrees |    8493.20 +/- 23.92 |   8383.41 |             -1.293% |
|  +0.10 degrees |    8592.04 +/- 21.87 |   8497.58 |             -1.099% |
|  +1.00 degrees |    9527.62 +/- 23.22 |   9517.00 |             -0.112% |

Intervals are empirical Student 95% half-widths over six independent replicate
vectors, not formal correctness bounds. Joint vectors retain covariance in
contrast. Doubling optical layers changes the tested limb Y by about -0.0053%
below and -0.0099% above. Paired-seed intervals remain well below the 1% layer
criterion. Both upper-sky controls and every native-band residual/uncertainty are
retained; the conclusion is not based solely on a favorable luminance aggregate.
The maximum native-band residual across these rays is about 6.3%, chiefly at
375.7 nm; brightness agreement is not perfect spectral agreement. That residual
is retained without attributing it to a specific order/cache mechanism. It does
not supply evidence for a large visible horizon-boundary error.

Signed paired contrast is C=(Y_above-Y_below)/(Y_above+Y_below). Small C means
nearly equal brightness; it is not a transmission percentage.

|  Paired offsets |        libRadtran C | GPU Q30 C | GPU Q120 C |
| --------------: | ------------------: | --------: | ---------: |
| +/-0.02 degrees | .003188 +/- .000203 |  -.000255 |    .002975 |
| +/-0.10 degrees | .015400 +/- .000932 |   .012937 |    .015561 |
| +/-1.00 degrees | .130546 +/- .001370 |   .135817 |    .135365 |

A real but small view-quadrature residual exists: Q30 slightly inverts the tiny
contrast at +/-0.02 degrees. Q120 moves it close to the external result, changing
contrast by about .0032, far below the registered .03 diagnostic threshold.
Refinement does not restore a conspicuous edge. No production intervals changed.

The installed cache retains cumulative N4 only. The small total residual and
independently low contrast did not earn an order-resolved cache rebuild. N4 versus
all-orders remains a truncation limitation; no pure-order error attribution is
claimed. This explicitly narrows the initial order-readback task under the plan's
requirement to earn deeper cache/order diagnosis.

The actual green-scene check is separate from the controlled black-ground scan.
At the nearest sampled pixel about .108 degrees below the limb, ground is 275.6 km
away. GPU transmittance near 564 nm is .006061, versus .006023 from an independent
optical-depth integral: about .63% difference. Only about .16% of that pixel's
pre-display green component comes from transmitted ground input. At the roughly
one-degree-below control the ground contribution is below 3% in each RGB component.
These fractions depend on this scene's lighting and material.

Replaying path-plus-transmitted-ground display composition agrees within
1.01e-7 per encoded channel. No depth-mask mismatch occurs in the checked column.
This identifies atmospheric loss of contrast in this case, rather than broad
image blur or an incorrectly placed geometric boundary.

Disposition: baseline low contrast supported; small numerical differences retained.
No universal accuracy or production-failure claim follows.

## M3 - Aerosol-loading mechanism controls

[Profile colors](../../../../../tmp/experiments/elevated-horizon-validation/runs/00018-profile-report/profiles.html)
and [spectra/uncertainty](../../../../../tmp/experiments/elevated-horizon-validation/runs/00018-profile-report/profiles.json).

Molecular density, source, geometry, aerosol vertical shape, SSA, phase, black
boundary and display stay fixed. Only aerosol extinction/scattering loading changes.
These are external calculations, not changed production caches or recommendations.
This table uses matched three-seed cohorts; the baseline table above uses six.

| Aerosols | Y below / above (cd/m2) | C at +/-0.1 degrees | Ground-ray T at 564 nm |
| -------: | ----------------------: | ------------------: | ---------------------: |
|     100% |         8329.1 / 8592.2 |   .01555 +/- .00098 |                .005571 |
|      50% |         8607.7 / 8963.9 |   .02027 +/- .00472 |                .024703 |
|       0% |         8952.9 / 9947.4 |   .05262 +/- .00207 |                .109544 |

Zero aerosols clearly increases contrast and transmission, but leaves substantial
molecular haze. The smaller 50% contrast change is not decisively separated from
baseline at this precision. No preferred intermediate loading is selected.

One degree from the high noon Sun, Y means are about 537, 535 and 533 cd/m2 for
100/50/0% aerosols. Sampling intervals overlap widely (about +/-42 to +/-52 cd/m2).
A loading effect there is unresolved; this does not establish preserved solar
glow at ground level. A larger photon campaign to resolve this secondary effect
at 10 km was not earned by the horizon question.

Disposition: aerosols strengthen loss of contrast, but are not its sole cause.
Vertical redistribution, new observed profiles, other elevations/azimuths and
production promotion were not triggered.

## M4 - Synthesis, recovery and limits

A sharp shader-off silhouette and fuzzy atmosphere-on image are compatible: the
first shows geometry, while the second includes hundreds of kilometres of optical
path and added scattered light. This comparison independently tests those effects
at the elevated boundary. It does not identify the best real clear-sky profile.

Retain this calculation as supported for the registered case. A future profile
choice should specify aerosol optical depth and vertical structure, preferably
from measured conditions. The small Q30 residual can be a separate investigation;
it is not supported as a remedy for the missing visible edge.

Recovery preserved all prior runs. An initial app inspection selected a lifecycle
wrapper instead of the composer pass. An extra seed batch hit a WSL cold-start
timeout; a longer startup allowance and successful doctor resolved it without
service restart. The first one-band vacuum control exposed the output-spline
minimum and was corrected with three wavelengths. A report produced data but
could not finalize Git metadata in the sandbox; it lacks a manifest and is excluded.
Only authenticated accepted parents are consumed.

Initial runs inventoried source at finalization; copied CLI/worker, executed input
decks, optical libraries, physical exports and solver identities remain authoritative.
Later runs snapshot experiment source at start. This provenance limitation is
explicit; no earlier output was rewritten to conceal it.

Owned browsers and servers close through harness cleanup. There was no service
restart, native compilation, dependency installation, standards review, production
update or resumption of another experiment. Self-verifying proof runners and local
type checking provide verification; no experimental test-framework suite was added.

The [execution log](execution-log.md) records decisions/recovery. The [status](status.md)
owns final verification, measured costs and the resumption point.

## Verification and measured costs

[Final verification](../../../../../tmp/experiments/elevated-horizon-validation/runs/00020-final-verify/verification.json)
authenticates 4402 artifacts, matching solver inputs/source quantities, optical
columns, the selected production package, analytic vacuum radiance, app depth
classification, finite-path transmittance, component compositing and type checks.
All pass. Format checks and authored-source self-review accompany the handoff;
no standards-compliance review or new B1 score is claimed.

There are 79 successful external scientific cases. Their measured tool invocation
time totals 427.743 seconds (7.13 minutes), including launch/authentication rather
than pure solver CPU time. Implementation, three GPU app initializations, failed
attempts, analysis and verification are additional elapsed work.

Retained output was 1798.99 MiB (about 1.76 GiB) at final verification, above the
initial 50-150 MiB guidance. Three browser profiles retain about 1.15 GiB, primarily
HTTP-cached package blocks; copied optical inputs and raw provenance account for
the rest. These are retained disk bytes, not ongoing memory allocation. Prior
runs remain immutable. A future harness can disable browser HTTP caching before
navigation; this campaign does not delete sealed browser evidence.
