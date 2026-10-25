# Measured Clean Horizon Profiles Experiment Status

Status: requested illustrative scene campaign complete, with reference limitations.
The experiment remains selected for owner review, with no production promotion
or automatic closure. Earlier M1 measured-profile qualification is inconclusive.

## Matched native raster follow-up complete

[Final PNG page and paired reading guide](../../../../../tmp/experiments/clean-horizon-profiles/runs/00106-raster-assess/index.html)
and [owning findings](scene-results.md#matched-native-raster-horizon-comparison)
complete the requested comparison. New libRadtran pixel footprints match two actual
native4K columns by96rows at500m/2km.6144 three-seed cases are accepted in00102;
00105 validates raw spectra/inputs and composes the pixels,00106 adds both
quadrature orders' paired metrics while preserving every image byte. Browser,
local types, image/geometry/RGB and installed-tool checks pass their stated bounds.

Both methods show the pale shoulder and ground step. Production's selected2km
sky-side rise is stronger, with consistent2x2/4x4 results; the500m shoulder difference
remains within uncertainty. Broader gray-band error persists. Pointwise intervals,
N4/all-orders, reference discretization and common-surface-hybrid limits remain
explicit. No numerical cause is isolated or production change promoted. Earlier
provisional images and interrupted/pilot evidence remain immutable. No further
investigation is automatically selected.

## Current result

[Scene results](scene-results.md) owns the current model, appearance, reference
errors, uncertainty checks, cost and verification. [Open the complete gallery](../../../../../tmp/experiments/clean-horizon-profiles/runs/00055-scene-gallery/index.html).
All San Jose Globe noon and sunset views at5m,100m,500m,2km and40km are rendered,
each with matched Bruneton, native/fixed/lower exposure, metadata and PNG download.
Two additional images test phase shape at500m sunset and upper aerosols at40km sunset.

The explicitly ARM-informed model reuses December2023 surface/AERONET/lidar data
with documented near-field, humidity, phase/spectral and upper-layer assumptions.
It is not measured San Jose weather. Its AOD550 is0.02102 versus the nearby
observed0.01708; the residual is retained. No new credentials/downloads were needed.

Near-ground noon views are less gray; sunset is brighter around the Sun. The40km
limb remains broad and bright. Phase shape is a major uncertainty. Source-field
replay disagrees substantially with spherical MYSTIC at500m sunset, so the
adapter is illustrative rather than fully validated. Direct-transmission and
GPU sampler representation checks pass their stated bounds. No order-tail bound,
five-seed benefit confirmation or full uncertainty/convergence grid is claimed.

## Owner-review horizon-band diagnosis

[Scene results](scene-results.md#owner-review-follow-up-bright-rim-and-gray-band)
owns the focused diagnosis.00062-horizon-bands contains the original/fine/path-only
comparison and verification. Upper bright/gray bands originate in atmospheric
path radiance;480 view intervals and exact-sphere ground clipping do not remove
them. New spherical reference rays show a physical gradient plus a cached-field
brightness/color distortion. The executed height test below separates final height lookup from build propagation;
remaining angular/field errors are unresolved. No fix or profile
change is promoted; the images should not be called fully validated.

## Height-hypothesis test complete

[Height-test findings](scene-results.md#height-resolution-hypothesis-test) and
[comparison gallery](../../../../../tmp/experiments/clean-horizon-profiles/runs/00072-height-results/index.html)
own the executed58/76-height study. Height lookup changes the gray band; rebuilding
orders with the original lookup changes little. Local height convergence is tight,
but dense readout worsens nearby reference errors and the bright rim remains.
The upper band's direct interpolation issue is1875-3125m, not the originally
suspected0-1875m gap. Lower/upper lookup splits establish that localization.
No height-only fix or production update is promoted.

## Thin-rim ground alignment test complete

[Ground-alignment findings](scene-results.md#thin-white-rim-ground-object-versus-exact-sphere-test)
and [direct image/mask comparison](../../../../../tmp/experiments/clean-horizon-profiles/runs/00074-ground-alignment/index.html)
own the endpoint test. Original/refined meshes disagree with the sphere at2/1
isolated pixels at500m and0/0 at2km. The2,048sky rim pixels at each height have
identical linear/display color after4x triangles. Small depth/coverage differences
exist but do not explain the continuous line. Near-limb radiance remains unvalidated;
no production geometry change is promoted.

## Actual analytic shader branch test complete

[Actual-compiler findings](scene-results.md#actual-compiler-analytic-ground-intersection-test)
and [image comparison](../../../../../tmp/experiments/clean-horizon-profiles/runs/00079-analytic-results/index.html)
own the corrected target. Actual compiler GLSL at7800cache-anchor queries has
hit differences only at exact tangency. In the live A/B, about294000ground paths
per view are shortened with attenuation preserved. All2048sky-rim pixels at each
height retain exactly their original linear/display color. The continuous rim
and gray band remain. This tests emitted intersection arithmetic and live
termination, not the cached field's cross-boundary interpolation. No fix promoted.

## Larger native horizon images complete

[Resolution findings](scene-results.md#larger-native-renders-and-preview-scale-appearance)
and [full-width /1:1viewer](../../../../../tmp/experiments/clean-horizon-profiles/runs/00082-resolution-view/index.html)
provide true2048x1152 and4096x2304noon renders at500m/2km, matching the original
1024views. All color/depth/hit/viewport dimensions are verified. Enlarged crops
show a bright shoulder and sky/ground step; sampled sky profiles have no separate
isolated one-pixel luma peak. Small previews can emphasize its sharp appearance;
the native transition and broad gray band remain. No physical-correctness claim.
The contained harness repair resizes the actual staged composer; production's
resize lifecycle remains unchanged.00080is the retained partial-resize attempt;
00081is the verified capture,00082the checked interactive viewer and report.

## Fine vertical libRadtran trace complete

[Final trace findings](scene-results.md#fine-vertical-spherical-libradtran-comparison)
and [three-seed profile/spectra viewer](../../../../../tmp/experiments/clean-horizon-profiles/runs/00091-vertical-results/index.html)
own the completed570-case comparison:95directions at each of500m/2km, three
independent100000photon seeds, same ARM-informed atmosphere and actual production
GPU shader/cache path.00084reference and00091final checks are accepted.

The broad limb/gray-band structure occurs in MYSTIC too, but production exaggerates
it. Around1.2degrees production is8.1%darker at500m and14.5%brighter at2km; closest
limb samples are3.9%brighter /5.5%darker.30to480view intervals changes Y by at most
0.51%/0.69%. Source-field/order/reference approximations remain unseparated; missing
higher orders alone cannot account for a positive production error. This is a
sky-above-limb trace, not ground-edge validation or a fully qualified atmosphere.

00083/00085and00088retain image/spectral/angle proof;00086contains isolated plotting
libraries.00090is the earlier explicitly provisional preview. All source spectra,
pointwise uncertainty, color samples and CSVs are saved. No further run, cache
build, profile tuning or production change is automatically selected.

## Across-limb combined trace complete

[Combined findings](scene-results.md#combined-trace-across-the-opaque-ground-boundary)
and [final viewer](../../../../../tmp/experiments/clean-horizon-profiles/runs/00095-limb-results/index.html)
add210 successful reference cases below/across the limb while preserving the570
old cases. The260-direction result supports a real opaque-ground radiance step.
Across adjacent4Kpixels, the reference with the common captured RGB surface drops
27.49% versus production26.86% at500m, and6.56% versus6.60% at2km, before display
tone mapping. The reference surface composition is an explicitly labeled hybrid,
not a reflective-ground libRadtran simulation. Broad above-horizon gray-band
errors remain separate.00092-00095 capture/reference/proof/report are accepted;
source types, physical inputs, immutable reuse and browser checks pass their
stated bounds. Production is unchanged; no new investigation is selected.

## Verification and next boundary

All20 primary frames and two uncertainty frames were inspected at native size.
No broad black strip or stale frame was observed; thin pixel-scale limb steps
remain visible. Native GPU versus CPU display replay is within one RGB byte.
Noon/sunset/noon and5m/40km/5m transitions match fresh-state captures within one byte.
Final verification00057 is accepted:11,060 artifacts rehashed, gallery modes and
time filters checked in a real browser, local authored types passed. Earlier M1 evidence and failed attempts remain immutable.

The owner may compare the gallery and choose any follow-on. No production cache,
profile or display changed; no promotion is proposed from unresolved accuracy.
Do not repeat downloads or completed cache builds without changed inputs.
[Execution log](execution-log.md) owns decisions and local checkpoints.

## Standards provenance and lifecycle

Permanent assignment: experiments -> experiment (base plus types.md). No
experiment-specific standards set, deeper assignment or overlay was added;
there is no temporary configuration to restore at closure. Dedicated experiment
standards reviewers and audits remain disabled; checkpoint monitoring is active.
No standards-compliance result follows from that policy.
