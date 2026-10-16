# H39: Reducing The Low-Altitude Aerosol Layer

Owner-selected physical hypothesis test, 2026-10-16. The tentative working
conclusion is that the cache is not broken; this test changes a physical input
to the independent solver and does not search for a cache defect.

## Registered Method

Compare aerosol amounts 100%, 75%, 50%, 25% and zero in the existing exponential
layer. Scale all 15 aerosol extinction coefficients by that factor; scattering
changes with extinction at fixed single-scattering albedo 0.8. Keep its 1.2 km
scale height and phase g=0.7 fixed. This scales the existing profile amplitude;
it is not an altitude-cutoff intervention. About 92% of this profile's vertical
column is below 3 km.

Hold the authenticated H34 San Jose closest point source, molecular atmosphere,
observer, directions, ray endpoints and source normalization fixed. Measure all
18 registered rays at N1 using independent binary64 integration at 64/128 nodes.
Retain spectra, physical luminance, CIE xy, Rayleigh/Mie contributions, distance
bins, horizon/3-degree and horizon/10-degree ratios and extended-domain controls.
Use a 1% relative luminance change as the practical brightness threshold, with
0.2% refinement/parity requirements; report numerical resolution separately.
Do not require monotonic brightening or a preferred color.

Reuse immutable qualified capture 00281 through accepted qualification 00285,
and authenticate the actual bundled dependency graph before reusing its GPU
observer. Produce actual matched-camera independent N1 images for 100%, 50%
and zero aerosol using fixed exposure/display uniforms and scene lighting.
Ground/review objects supply unchanged scene context; this test does not predict
their relighting. GPU image probes must match binary64 spectra within 0.2%.
Use the GPU for images, short binary64 calculations for independent control.

This is a single-scattering sensitivity test. It cannot transfer the previous
all-order estimates to modified aerosol inputs. No production edit, full-cache
candidate, paper-RMSE campaign or physical-parameter adoption is selected.
Keep every parent immutable and write derivatives into a new owned run.

## Results And Execution

Accepted [run 00287](../../../../../tmp/experiments/sky-accuracy-dials/runs/00287-h39-aerosol/sealed.json)
supports the brightening hypothesis for the low horizon at N1.
The [actual comparison images](../../../../../tmp/experiments/sky-accuracy-dials/runs/00287-h39-aerosol/comparison.svg)
show independent N1 at 100%, 50% and zero aerosol, left to right. Source, camera
and display are fixed. All earlier evidence and production remain unchanged.

For the 0.05-degree away-facing ray:

| Aerosol remaining | Luminance, cd/m² | Change from baseline | Horizon / 3-degree brightness |
| --- | ---: | ---: | ---: |
| 100% | 1932.72 | baseline | 0.650 |
| 75% | 2252.45 | +16.5% | 0.650 |
| 50% | 2777.42 | +43.7% | 0.678 |
| 25% | 3816.89 | +97.5% | 0.779 |
| Zero | 6933.36 | +258.7% | 1.166 |

The lowest tested ray also brightens toward and across the source for each
reduction. This is not universal sky brightening: at 20 degrees toward the
source, halving aerosol dims the ray by 8.0%; removing it dims that ray by 17.4%.
The [full summary](../../../../../tmp/experiments/sky-accuracy-dials/runs/00287-h39-aerosol/summary.json)
and [spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00287-h39-aerosol/rays.json)
retain all 90 ray/case measurements, additive species and distance partitions.

## Physical Interpretation

At half aerosol, the low away-ray Rayleigh contribution rises from 1290.54 to
2224.58 cd/m² while the aerosol contribution falls from 642.18 to 552.84 cd/m².
The gain in molecularly scattered light reaching the observer exceeds the loss
of aerosol-scattered light. Both source-leg and observer-leg aerosol attenuation
change together; this experiment does not separate their individual effects.

The fraction of that ray's light originating within 50 km falls from 96.1% to
85.7% at half aerosol and 47.7% at zero aerosol. The reduced extinction admits
more distant contributions. At half aerosol, the 3-degree band also brightens
by 37.7%, so the low-horizon dip remains: it is still 32.2% dimmer than that band.
The zero-aerosol endmember reverses the contrast, with the lowest ray 16.6%
brighter than the 3-degree band.

The color response is not a uniform shift toward blue. The away-horizon CIE xy
changes from (0.29948, 0.31443) to (0.30024, 0.31716) at half aerosol and
(0.33568, 0.34617) at zero. Strong reduction gives a warmer, more nearly white
displayed horizon; the actual images show the result without exposure fitting.
Zero aerosol is a diagnostic endmember, not an adopted physical setting.

This supports a physical explanation for the original appearance under the
declared aerosol loading. It adds no evidence of a cache defect, and does not
by itself select a physically preferable atmosphere or predict all-order changes.

## Qualification And Resource Record

The 100% independent baseline reproduces all retained N1 spectra within 1e-12
relative. Every case passes the 64/128-node refinement bound. Both new GPU images
pass direct binary64 parity; the largest relative spectral residual is about
0.000603%, far below the registered 0.2% qualification bound. Practical horizon
brightness changes exceed the registered 1% threshold.

The parent capture remains failed. Accepted 00285 supplies its original scoped
artifact qualification. This run additionally authenticates the complete saved
bundle dependency graph against current sources and qualifies reused observer
bundles through fresh medium/camera equality and CPU/GPU spectral parity; it
does not relabel the entire failed parent accepted. Its baseline image and exact
bundle/input identities remain recorded in the new derivation chain.

The public command `npm --prefix experiments/sky-accuracy-dials run horizon:aerosol`
was exercised using canonical Node v25.4.0. Numerical capture took 215.192 seconds,
including observer setup and two GPU images. Scratch high-water was 24,123,650
bytes and verified cleanup left no scratch. Retention and free disk remain inside
the experiment budget. No free-memory admission guard or production rule was added.

The local type check and required mapped source review are separate implementation
gates. The baseline and current review unit are recorded under
`.codex-tmp/review-standards/session-hVrMzn/`; final source completion is owned by
that session's `validation.json`. One coherent review covers the bounded source,
types, public command, topic updates and relevant unchanged collaborators. No
additional numerical sweep or production change is selected by this result.
