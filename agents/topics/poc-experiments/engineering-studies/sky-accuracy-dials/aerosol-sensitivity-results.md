# Aerosol Phase and Albedo Sensitivity: Results

## Conclusion

**Current interpretation scope:** at the owner's request, use only the four
tested wavelengths within the retrieved aerosol bands, 454-712.5 nm. Exclude
the unsupported 360 nm endpoint extension from this diagnosis. The
[supported-wavelength breakdown](#supported-wavelength-interpretation) shows
that phase alone and albedo alone improve both control rays; their combination
overshoots. The original five-wavelength results below remain historical
evidence and are not removed from the benchmark.

**A regionally plausible aerosol alternative moves the visible mismatch in the
right direction without restoring numerical inaccuracies.** On the six fixed
away-Sun rays, replacing both phase shape and scattering albedo reduces RMSE
across the four tested 454-712.5 nm wavelengths by about **39.1%**. Both isolated
changes also improve that aggregate.

The original five-wavelength result does **not** meet the broader desired
pattern: the 360 nm excess worsens, both previously well-matched control rays
worsen in five-wavelength RMSE, and the morning aggregate worsens. On the
supported subset, joint control-ray overshoot and morning low-ray harm remain.
This supports aerosol-input
sensitivity, not adoption of these particular properties or identification
of the actual Ithaca aerosol state. Keep the numerical-correction adoption hold.

## Fixed evidence

The [registered plan](aerosol-sensitivity-plan.md) is consumed. No extra
parameter search, retry or full-sky benchmark was run.

- Accepted [00234 aerosol data](../../../../../tmp/experiments/sky-accuracy-dials/runs/00234-aerosol-data/sealed.json):
  `7eb777a0156a6b4d1492e3befe84814362de9968cbfb36e37fac01fdd2404939`.
- Accepted [00235 GPU comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00235-aerosol-screen/sealed.json):
  `df04eb7ad6d325d206b5c78a62792364344130b4afeb9d326f78261b79899da1`.
- [Complete results](../../../../../tmp/experiments/sky-accuracy-dials/runs/00235-aerosol-screen/results.json.gz)
  own all means, sampling intervals, paired changes, order contributions,
  interaction terms, scores and numerical checks.
- [Exact physical inputs](../../../../../tmp/experiments/sky-accuracy-dials/runs/00235-aerosol-screen/inputs.json.gz)
  and [batch means](../../../../../tmp/experiments/sky-accuracy-dials/runs/00235-aerosol-screen/batches.json.gz)
  retain the derivation inputs. Sources and actual shaders are preserved in
  the run, including their identities.

The six rays and five wavelengths are the unchanged [00232 selection](alternate-rays-results.md#fixed-selection-and-execution).
The new control repeats the original physical atmosphere through the direct
solver, rather than using approximate production radiance. All four cases
recompute all orders in expectation. Extinction, aerosol height profile,
molecular scattering, geometry, Sun spectrum and ground properties stay fixed.

## Regional aerosol input and limitations

Use the single Toronto AERONET retrieval at **2013-05-27 13:19:01 UTC**, chosen
before sky evaluation by the recorded quality flag. Phase and SSA come from
the same site, time and instrument. No aerosol values were tuned to Kider.
The [NASA service](https://aeronet.gsfc.nasa.gov/print_web_data_help_v3_inv.html)
supplied the original text records and provenance URLs retained in 00234.

| Retrieved wavelength | Scattering albedo | Reported mean cosine | Mean cosine of the implemented normalized table |
| -------------------- | ----------------: | -------------------: | ----------------------------------------------: |
| 440 nm               |            0.9429 |             0.656192 |                                        0.646302 |
| 675 nm               |            0.9398 |             0.629978 |                                        0.621574 |
| 870 nm               |            0.9117 |             0.644994 |                                        0.637291 |
| 1020 nm              |            0.8840 |             0.660828 |                                        0.653681 |

SSA is **Level 1.5 exploratory data**. The corresponding Level 2 response
contains missing SSA values; it does not certify these absorption estimates.
The selected row satisfies the reported inversion flag excluding the Level 2
AOD threshold, and its coincident 440 nm AOD is about 0.103. That retrieved
AOD is metadata here: it was not substituted into our extinction model.
Toronto is regional context, not a co-located Ithaca measurement.

The phase implementation uses all 83 supplied angular nodes, linearly
interpolates in scattering cosine and explicitly normalizes the integral.
The raw cosine integrals range from 2.0209 to 2.0296, versus nominal 2 in
the source convention. The implemented mean-cosine differences above expose
the finite-table representation limitation; they are not statistical errors
or evidence that the original retrieval is wrong. This is a physically
normalized approximation to the supplied shape, not an exact reconstruction
of the retrieval's internal optical calculation.

Between bands, interpolate normalized phase and SSA linearly in wavelength.
**360 nm uses the 440 nm endpoint unchanged** because no shorter band was
provided. Its outcome tests this extension, not independently measured UV
properties. Both input and sampling use the same declared phase function.
Material phase tables are not cached radiance or attenuation fields.

## Selected-set scores

RMSE in spectral mW m^-2 sr^-1 nm^-1. These are selected-ray scores, not the
full Bruneton benchmark. Differences from 00232's last digits are sampling
variation; the original control reproduction check passes.

| Comparison                      | Original direct control | Phase only | Albedo only |   Both |
| ------------------------------- | ----------------------: | ---------: | ----------: | -----: |
| All 30 scalars                  |                  13.162 |     11.377 |      12.394 | 11.341 |
| 454-712.5 nm, 24 scalars        |                  12.716 |      9.752 |      10.442 |  7.744 |
| 360 nm, 6 scalars               |                  14.811 |     16.335 |      18.220 | 20.082 |
| Morning, all five wavelengths   |                   7.615 |      7.614 |       8.942 |  9.394 |
| Afternoon, all five wavelengths |                  16.984 |     14.175 |      15.076 | 13.000 |

The joint all-scalar reduction is about **13.8%**. Its small aggregate
advantage over phase alone is only 0.036 mW; do not turn that point-estimate
ranking into a precision claim. The stronger visible improvement is partly
offset by UV harm. Phase, albedo and both improve the point-estimate absolute
error in 18, 19 and 16 of the 30 scalars respectively; aggregate improvement
does not imply most benefit comes from uniformly improved rays.

### Ray transfer

| Ray           | Original direct control | Phase only | Albedo only |   Both |
| ------------- | ----------------------: | ---------: | ----------: | -----: |
| 09:30 high    |                   6.511 |      5.257 |       5.711 |  4.793 |
| 09:30 low     |                  10.240 |     10.721 |      13.188 | 14.091 |
| 09:30 control |                   5.167 |      5.597 |       5.776 |  6.574 |
| 13:30 high    |                   8.031 |      7.222 |       6.418 |  5.813 |
| 13:30 low     |                  27.264 |     22.001 |      23.817 | 19.457 |
| 13:30 control |                   7.587 |      8.158 |       8.566 |  9.727 |

All three interventions improve both high-sky rays and the afternoon low ray,
but worsen the morning low ray and both control rays. The earlier control-ray
label denotes favorable original agreement, not independently known physical
correctness. Their regressions are part of the result, not exclusions.

## Concrete changes in the previously identified cases

### Supported-wavelength interpretation

For the owner's follow-up, exclude 360 nm from interpretation because the
retrieval has no supporting UV band. The four remaining tested wavelengths
are interpolated between measured aerosol bands, not exact retrieval channels.
Historical five-wavelength results above remain unchanged.

Recompute each ray's RMSE from the retained `results.json.gz` residuals at
454, 548, 642 and 712.5 nm as `1000 * sqrt(sum(residual^2) / 4)`; geometry
comes from the same run's `inputs.json.gz`. This is a read-only regrouping
of 00235, with no new transport execution or fitted parameters.

| Ray               |     Elevation | Sun separation | Original | Phase only | Albedo only |   Both |
| ----------------- | ------------: | -------------: | -------: | ---------: | ----------: | -----: |
| Morning high      | 90.00 degrees |  48.94 degrees |    6.664 |      4.614 |       5.151 |  2.714 |
| Morning low       | 12.12 degrees | 122.51 degrees |    4.139 |      5.444 |       7.225 |  9.092 |
| Morning control   | 53.37 degrees |  83.40 degrees |    1.144 |      0.906 |       0.779 |  2.053 |
| Afternoon high    | 71.92 degrees |  39.86 degrees |    8.644 |      7.463 |       6.149 |  4.708 |
| Afternoon low     | 12.12 degrees |  56.10 degrees |   28.788 |     21.473 |      23.133 | 15.259 |
| Afternoon control | 33.75 degrees |  78.03 degrees |    1.956 |      1.430 |       1.389 |  3.248 |

This restriction changes the isolated-intervention conclusion for the controls:
**each intervention separately improves both control-ray RMSEs; combining
them worsens both.** At 548 nm, their small initial deficits become excesses
under the joint change. That is overshoot relative to the observations, not
proof that either imported property is independently correct.

All three rays at roughly 40-56 degrees from the Sun improve; the two controls
near 78-83 degrees overshoot under the joint change; the morning low ray at
123 degrees worsens. The low rays share elevation but differ in Sun angle and
time. Therefore elevation alone cannot explain the split. Six selected rays
do not isolate angle from illumination geometry or atmospheric time variation.

Scattering order also differs: at 548 nm in the original direct control,
second and later orders contribute about 36% of morning low-ray radiance,
versus 20% for morning high and 17% for afternoon high. These fractions are
`(second.mean + higher.mean) / total.mean` from the same retained results.
Thus observer-Sun angle does not describe every scattering event, and changed
albedo affects a mixture of direct and repeatedly scattered contributions.
Extinction, aerosol vertical distribution, ground reflection and atmospheric
variation remain untested physical alternatives, not attributed causes.

### Signed 548 nm witnesses

At 548 nm, joint changes to the direct residual are:

| Ray               | Original residual | Joint residual | Joint radiance change, with paired 95% sampling half-width |
| ----------------- | ----------------: | -------------: | ---------------------------------------------------------: |
| Morning high      |            -6.720 |         -2.464 |                                           +4.255 +/- 0.068 |
| Morning low       |            +3.664 |         +9.945 |                                           +6.282 +/- 0.111 |
| Morning control   |            -1.076 |         +2.065 |                                           +3.142 +/- 0.053 |
| Afternoon high    |            -8.175 |         -4.121 |                                           +4.053 +/- 0.073 |
| Afternoon low     |           -31.482 |        -14.086 |                                          +17.397 +/- 0.134 |
| Afternoon control |            -1.908 |         +3.214 |                                           +5.122 +/- 0.063 |

The afternoon low-ray deficit therefore shrinks substantially under accurate
transport with changed physical inputs. It previously benefited from excess
light caused by the old approximation. This is direct support for the
hypothesis that physical assumptions can account for part of the deficit
that numerical errors had concealed.

At 360 nm, the same afternoon low ray gains 10.969 +/- 0.152 mW under the
joint change and its excess grows to +31.010 mW. The morning low excess grows
to +25.732 mW. Phase alone barely changes the morning low 360 nm value:
+0.010 +/- 0.115 mW, the one unresolved radiance-change direction among the
90 case-versus-control comparisons.

Phase/albedo effects are not exactly additive. The retained interaction
`both - phase - albedo + control` ranges from about -0.010 to +1.864 mW.
Use the actual joint calculation rather than adding isolated score gains.

## What this establishes, and what it does not

1. **Established directional sensitivity:** changing plausible aerosol
   properties improves important visible deficits even with accurate transport.
   The original numerical bias is not necessary to obtain that improvement.
2. **The unsupported violet extension is excluded from the current diagnosis:**
   its retained result worsens, but this does not assess measured UV aerosol
   properties. Even within the supported wavelengths, control overshoot and
   morning low-ray harm show that broad brightening is insufficient.
3. **Richer parameterization is not yet isolated:** the phase intervention
   changes mean directionality, detailed shape and wavelength dependence
   together. A different single-g law might supply part of the benefit. The
   SSA intervention also primarily raises its overall level from 0.8 to
   roughly 0.94 over the tested visible wavelengths; this does not establish
   that spectral variation itself caused the improvement.
4. **No unique physical attribution:** the imported state is regional and
   uncertain, geometry remains unchanged, and original aerosol amount/profile
   may also be inappropriate. No percentage of the total mismatch is assigned
   uniquely to aerosols.
5. **No completed numerical/physical interaction factorial:** this tests
   phase by albedo using the direct solver. It does not recompute the old
   approximate production algorithm under the new properties, so it does not
   measure how all of its original cancellation terms would change.

The narrow next scientific distinction, if further work is chosen, is whether
the useful response comes mainly from changed mean directionality/SSA level
or requires the extra angular/spectral shape. Preserve this as a question,
not an automatic new sweep. The source-refinement production follow-up remains
separate. This result qualifies neither production promotion nor the imported
Toronto atmosphere as a replacement benchmark.

### Numerical and physical cancellation

The owner suggested that changing aerosol properties may disturb old
cancellations, allowing other corrections to restore agreement. That is a
plausible physical-input hypothesis; control regressions alone do not rule it
out. Distinguish numerical errors masking physical-model residuals from two
incorrect physical assumptions masking one another. Neither establishes which
additional correction would be justified.

The latest experiment already uses direct transport without the identified
cache reconstruction, phase interpolation or finite-order truncation mechanisms.
It evaluates the tabulated alternative phase through its explicitly declared
normalized representation, and includes all orders in expectation. Numerical
integration and sampling remain approximate with the checks reported below.
This is not a claim that all solver errors are impossible or that every earlier
production repair was literally copied into this separate solver.

Production has not incorporated the deferred corrections. Applying those same
identified corrections again cannot by itself explain remaining discrepancies
in the direct-reference results. Remaining physical inputs, observation
assumptions and untested numerical effects must retain their separate status.

A crossed comparison was discussed: original versus corrected numerical
evaluation, each under original versus alternative aerosol inputs. The latest
phase-by-albedo experiment fills the direct-reference side; the original
approximate algorithm under the new aerosol state has not been evaluated.
That missing comparison could measure changes in the numerical-correction
score penalty. It would not identify the actual atmosphere, and no new run
or resource allocation was selected by discussing it.

Any proposed additional correction needs independent mathematical or physical
support as well as a favorable residual pattern. A lower score alone can
represent a new cancellation. The unresolved near-term questions remain mean
directionality versus detailed phase shape, albedo level versus spectral
variation, and the cause of joint control overshoot. None authorizes an
automatic parameter sweep.

## Verification and bounded cost

- Full experiment type check and **110,024** deterministic input/sampling checks
  pass. Manufactured flat/sloped distributions, normalization, inverse CDF,
  first moment and Float32 table mass are covered.
- GPU vacuum, direct ground and absorption cases pass. Actual GPU sampling
  of all five imported wavelength distributions matches their expected moments
  within the fixed statistical/arithmetic allowance.
- **120/120** CPU/GPU first-order comparisons pass. Every control query
  reproduces 00232 within its combined sampling/arithmetic allowance.
- **120/120** sampling targets and **120/120** attenuation/termination
  refinement targets pass. Marginal radiance sampling half-widths are
  **0.043-0.253 mW**. They exclude systematic instrument, model, table
  representation and GPU arithmetic uncertainty.
- **19,200 main batches**, **157,286,400 paths**, including 1,048,576 main
  reference paths per scalar/case. All orders are included in expectation;
  no safety-cap failures. Common seeds enable paired contrasts.
- Main GPU calls: **79.52 seconds**. Charged GPU-job time including setup,
  proofs and retention: **138.267 seconds**. Data acquisition charges
  **48.330 CPU-job seconds**. No additional atmospheric run was performed.
- Retained data/run bytes: **260,834 / 1,200,300**, within their registered
  forecasts. GPU scratch peaked at **18,749,841 bytes** and is absent.
  Immutable seals and complete campaign accounting pass.

Historical evidence and production behavior remain unchanged. Formal
reviewers remain suspended; checkpoint advice remains blocked by the existing
calibration gate. The package is complete and no execution remains active.
