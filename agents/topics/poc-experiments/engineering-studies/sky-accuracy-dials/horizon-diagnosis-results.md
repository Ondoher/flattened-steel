# Gray Horizon: Bounded Diagnosis Results

The selected Flat gray band is already present in the pre-display radiance, and
a cache-free continuous N1 reference reproduces it. The shared exponential display
mapping reduces RGB channel separation further. This isolates a physical-formulation
and display question; increasing cache accuracy alone does not recover the expected
orange in the measured Flat view. Orange remains the owner's expected outcome.

The distant case also loses channel separation through the shared display mapping,
but retains a stronger blue bias before display. A common physical-input defect
across both modes is still a hypothesis. This pass does not establish distant N4
numerical accuracy or identify a calibrated physical parameter correction.

## Frozen Cases And Observations

Accepted [00239 paired observation](../../../../../tmp/experiments/sky-accuracy-dials/runs/00239-horizon-stages/sealed.json)
uses the current built application, authenticated deployed shared distant package
`9a30749c6d4e6c23d7a84839788c068133051fbbd9bd93d07de8b18a6ee432ec`,
its selected monotone-cubic solar interpolation, and packed compact local N1.
The ordinary distant case is N4. Neither cache is exported or altered.

Both cases resolve San Jose, 37.3382 degrees latitude and -121.8863 degrees
longitude, with the application's 2024-06-20 date basis to
`2024-06-20T20:08:46.261Z`. The distant control reads **Solar noon**; local reads
**Flat 0**, the zero-degree closest preset. The observer is five meters above
the surface. The recorded camera has a 50-degree vertical field of view and
640 by 480 viewport. Sampling corrects its approximately 0.286-degree downward
pitch. Exact screen coordinates, physical ray directions, segment lengths,
camera quaternion, source selections and display illuminance are retained.

The experiment-served bundle adds only access to the application and constructed
runtime passes, and chooses initial state through the existing control resolvers.
It does not change production files. Each observational material borrows the exact
live cache uniforms and runs the installed transport, then exposes its stages on
a one-pixel RGBA32F target. An unchanged-output shader control must agree within
0.0001 per display channel. Original/derived shaders, served bundle snapshots,
startup injection, tool identities and authenticated input identities are retained.

There are 36 recorded rays at six elevations and three horizontal screen positions.
Ten intersect scene objects or ground and are explicitly excluded from sky
attribution. All twelve center rays are sky-only. These frozen default-camera
views are not pixel registrations of the owner's screenshots; their azimuths must
not be generalized to every horizon heading.

Hardware: RTX 2060, ANGLE D3D11, Chrome 154.0.8037.98. This is an accuracy
observation at a small viewport, not a frame-rate or full-resolution qualification.

## Where The Color Changes

Center-ray measurements below use the same six physical elevations in each mode.
Channel spread is `(max(R,G,B) - min(R,G,B)) / max(R,G,B)`. It describes RGB
separation, not perceptual color difference; raw and encoded values belong to
different stages and are not interchangeable chromaticities.

| Elevation | Distant raw spread | Distant display spread | Flat raw spread | Flat display spread |
| --- | ---: | ---: | ---: | ---: |
| 0.05 degrees | 44.12% | 23.60% | 19.16% | 14.39% |
| 0.25 degrees | 43.03% | 22.46% | 18.31% | 13.64% |
| 1 degree | 39.79% | 19.03% | 10.38% | 7.36% |
| 3 degrees | 42.43% | 18.67% | 2.40% | 1.51% |
| 10 degrees | 61.83% | 35.40% | 44.71% | 32.47% |
| 20 degrees | 68.27% | 48.54% | 56.69% | 46.51% |

At Flat 3 degrees, pre-display RGB is `(2947.27, 2978.98, 3019.84)` and mapped
RGB is approximately `(0.5783, 0.5822, 0.5872)`. The gray band is therefore
present before the display stage. The shared response further narrows channel
separation; it does not turn an orange pre-display input into gray in this case.

Accepted [00243 assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00243-horizon-assess/sealed.json)
validates all 26 sky rays against the selected CPU p2 display equation. Maximum
absolute display-channel discrepancy is `7.64e-8`. Both GPU observations record
zero GL error. No unexplained extra display operation is needed to account for
these measured shader-stage values. Browser compositing and screenshot pixel
registration are outside that statement.

## Cache-Free Flat Reference

Accepted [00240 reference](../../../../../tmp/experiments/sky-accuracy-dials/runs/00240-horizon-ref/sealed.json)
independently integrates local single scattering along the six center rays, using
the same Native15 source, medium, finite-source position/dilution and segment
endpoints. It uses binary64 composite Simpson integration with 2048 and 4096
intervals and exact exponential source/view extinction columns. It performs no
cache interpolation, packed lookup or held-shell source reconstruction.

| Elevation | Cached raw RGB | Continuous raw RGB |
| --- | --- | --- |
| 0.05 degrees | 1834.24, 1929.92, 2268.84 | 1826.22, 1924.62, 2266.64 |
| 0.25 degrees | 1882.84, 1973.57, 2304.80 | 1873.04, 1966.68, 2301.29 |
| 1 degree | 2205.62, 2203.53, 2458.67 | 2189.50, 2191.97, 2451.57 |
| 3 degrees | 2947.27, 2978.98, 3019.84 | 2938.57, 2974.72, 3016.42 |
| 10 degrees | 1944.75, 2566.42, 3517.12 | 1937.14, 2563.36, 3517.42 |
| 20 degrees | 1220.07, 1737.75, 2816.89 | 1210.13, 1729.15, 2807.63 |

Maximum reference refinement is `1.32e-6` relative across all six rays and fifteen
channels, or 0.000132%. Maximum cache/reference discrepancy is 1.56% for a spectral
channel and 0.83% for a projected RGB channel. At the neutral 3-degree band, the
largest projected discrepancy is about 0.30%. This comparison does not make cache
error zero, but places it well below the missing-orange effect in these samples.

The reference is an independent numerical approximation to the same local N1
equation, not an independent atmospheric observation or a validation of the physical
assumptions. It does not qualify distant N4, other azimuths or higher local orders.

## What Balances Out

Accepted [00241 species attribution](../../../../../tmp/experiments/sky-accuracy-dials/runs/00241-horizon-species/sealed.json)
reuses 00240's authenticated total and splits the emission into Rayleigh and Mie
terms while retaining combined extinction. At Flat 3 degrees:

| Contribution | Raw R | Raw G | Raw B |
| --- | ---: | ---: | ---: |
| Rayleigh emission | 2346.73 | 2488.27 | 2634.44 |
| Mie emission | 591.84 | 486.45 | 381.99 |
| Combined | 2938.57 | 2974.72 | 3016.42 |

The warm Mie contribution is present. Its red-minus-blue difference offsets most
of the Rayleigh blue-minus-red difference, leaving a nearly neutral total. Species
spectra add to the prior total within `9.1e-15` relative. These are physical source
partitions at fixed extinction, not atmospheres with one species removed.

Mapping the species separately and adding their encoded RGB does not reproduce
mapping their sum. At 3 degrees the display interaction
`D(Rayleigh+Mie) - D(Rayleigh) - D(Mie) + D(0)` is approximately
`(-0.07914, -0.06875, -0.05694)`. This is measured nonlinear display interaction,
not evidence of numerical-error cancellation or a replacement rendering equation.

There is also a small numerical compensation: at 3 degrees, cache error adds
about `(8.70, 4.26, 3.42)` to the continuous raw RGB. It slightly reduces the
reference's blue bias and channel spread. Removing this error would not introduce
the expected orange. Improving an accuracy dial can therefore move this particular
appearance measure in an undesired direction. This bounded result does not establish
an accuracy law, aerosol retrieval or broader cancellation campaign.

## Resources And Recovery

Total retained evidence is **403,866,106 bytes** after 00243: **5,206,447 new
bytes**, about 4.97 MiB, within the continuation's 16 MiB envelope and the overall
512 MiB limit. Owned scratch is absent. Historical packages through 00235 remain
consumed and unchanged. These totals are measured after sealing 00243.

The successful paired job takes **62.061 seconds** including its setup and shutdown.
The earlier partial browser attempt takes 50.583 seconds; both browser attempts
total **112.644 seconds**, below ten minutes. Reference numerical work takes
0.554 seconds and species work 0.716 seconds inside their recorded computation
windows; those figures exclude run allocation, sealing and orchestration.

Recovery evidence is preserved:

- **00236:** startup failed on the NVM Node alias before browser launch. A recovery
  record seals the failed attempt and verifies scratch removal. Its interrupted
  startup heartbeat does not meet normal measurement-run verification; it is not
  accepted scientific evidence.
- **00237:** Chrome path normalization failed before browser launch. It is sealed
  failed and passes structural verification.
- **00238:** distant observations succeeded; the local frame stores its shader
  outside the distant runtime composer. The partial run is sealed failed. Its
  downward-camera ray placement is superseded by 00239, not relabeled as the final
  control.
- **00242:** the first assessment correctly rejected intersecting scene rays as
  sky samples. The failed assessment remains intact; 00243 explicitly excludes
  those rays and retains their identities.

Accepted 00239, 00240, 00241 and 00243, plus structurally valid failed attempts,
pass the immutable verifier. No old artifact was overwritten or discarded.

## Questions And Decisions

1. **Which lane?** Resume Sky Accuracy Dials, preserving its existing roots,
   standards and evidence; the owner selected diagnosis, not production changes.
2. **Where do temporary files go?** Scientific output follows the user-supplied
   experiment boundary under `tmp/experiments/sky-accuracy-dials/`. Review and
   orchestration records use `.codex-tmp/`; the general execution skill does not
   move scientific evidence outside its governing experiment contract.
3. **How to match the screenshots?** Freeze the named application controls and
   recorded default camera. Do not infer unprovided heading, date or exact pixels.
4. **Rebuild or change caches?** Borrow the installed owners and record their
   stages. Retain authenticated bundle snapshots and source derivation identities.
5. **Which numerical reference?** A matched continuous local N1 calculation;
   avoid presenting the older distant Kider solver as a local or N4 oracle.
6. **How to resolve startup failures?** Use Node's physical path, normalize Chrome's
   Windows path, and observe the local frame-owned pass. Preserve failed attempts;
   no global installation or production source change is needed.
7. **How to type imported production owners?** Include their canonical ambient
   declarations in the experiment config instead of duplicating or suppressing them.
8. **How to compare serialized zero coordinates?** Compare the canonical JSON
   numerical inputs, which normalizes signed zero, while retaining exact artifact
   hash checks. This corrects a reuse preflight without changing physical inputs.
9. **How to isolate species?** Partition emission at fixed total extinction and
   check additivity. Do not describe it as removing aerosols or regenerating N4.
10. **What to do with intersecting rays?** Retain and exclude them from sky-only
    attribution; keep their separate scene-boundary identities.
11. **Change rendering now?** Keep this pass diagnostic. Do not fit saturation,
    alter aerosol inputs or qualify an orange-horizon fix from these results.

## Verification And Handoff

The [implementation review record](../../../../../.codex-tmp/review-standards/session-8u9Kwg/summary.md)
owns the matching mapped primary/audit receipt. Scientific results above do not
substitute for that gate. Local type checking and focused self-verifying runners
are required; no experiment unit-test tree is introduced.

H0-H2's bounded scientific questions are answered within the stated limits. The
next scientific package should test a specific physical/formulation contrast or
obtain an independently matched distant N4 reference, with azimuth explicitly
controlled. That follow-up is not an automatic extension of this consumed package.
