# P5-Celestial Delivery

The selected contained integration has accepted numerical delivery in the
[00675 report](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00675-celestial-report/result.json).
Its parent inventory authenticates the early Sun-only images, final combined
capture, matching resource guard and admission/convention proof. Production is
unchanged. The full P6 recording remains unselected.

The owner subsequently selected [human-vision stellar integration](celestial-human-vision.md)
using the globe application's existing filters. That record owns the current
upward 1024-by-768 capture, measured response, unchanged 8-bit visibility and
its separate source-review authority. The original delivery below retains its
physical-presentation evidence and review scope.

Implementation completion is determined only by the matching exit-0 CLEAN
[primary/audit receipt](../../../../../.codex-tmp/review-standards/session-OL6CBp/validation.json).
A missing, stale or non-CLEAN receipt keeps the source-completion gate open.
The baseline was captured before this unit's implementation. Existing P3/P4/P5
receipts retain their original scope.

## Reviewable Images And Preview

The frozen Union Glacier controls begin on December 14, 2024 and continue
into December 15. These three
Sun-facing checks are the standard close/intermediate/far Flat0/90/180 controls;
they are still images from the frozen control set, not the full recording timeline.

| Control | Early Sun-only image | Final combined image |
| --- | --- | --- |
| Flat0 | [Sun PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00648-p5-celestial/flat-0-sun.png) | [Combined PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00674-p5-celestial/flat-0-combined.png) |
| Flat90 | [Sun PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00648-p5-celestial/flat-90-sun.png) | [Combined PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00674-p5-celestial/flat-90-combined.png) |
| Flat180 | [Sun PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00648-p5-celestial/flat-180-sun.png) | [Combined PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00674-p5-celestial/flat-180-combined.png) |

The [physical star-only diagnostic](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00674-p5-celestial/flat-180-stars.png)
retains the selected spectra, transport and display settings, with atmospheric
path radiance and the Sun isolated out. Direct PNG inspection shows ten pixels
with nonzero RGB, with channel maxima R=3, G=4 and B=5 out of 255; it appears
black at ordinary viewing brightness. The earlier description of exact black
quantization was incorrect. The unchanged result is reproduced in the
[latest p2 follow-up](sun-disc-correction.md#latest-p2-combined-flat180-follow-up).
Actual consumer
probes establish positive transported Native15 stellar values; no extra exposure,
night state or brightness multiplier was introduced to make stars visible.
The separately labeled [GPU pixel-occupancy diagnostic](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00674-p5-celestial/flat-180-star-index.png)
marks occupied pixels white. It demonstrates placement, not perceived brightness.

The [two-second combined preview](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00674-p5-celestial/preview.mp4)
has 24 frames at 12 fps, 720 by 414 pixels, AVC. It pans the camera about two
degrees over one unchanged physical state and atmospheric cache. This is the
P5 integration preview; it does not reproduce the full P6 orbit.

## Qualified Behavior And Limits

- The finite Sun shares the atmosphere's position, radius and emission spectrum.
  Its projected centre is checked against the Sun-facing camera, and its
  apparent radius agrees with the independent finite-source calculation.
  Flat0/90/180 radii are approximately 0.961, 0.329 and 0.240 pixels.
- Full-slab Native15 transmission agrees with binary64 exponential columns at
  the physical Sun elevation, zenith, one-degree elevation and the horizontal
  limit. Maximum absolute residual is `8.61e-8`, relative residual `1.53e-6`.
  Sun and stellar consumer probes verify one attenuation multiplication.
- A real opaque mesh goes through the existing scene-hit capture and suppresses
  every celestial channel. The inherited consumer also retains its Sun-before-star
  precedence. Atmospheric path-radiance equations and scene-lighting recipes
  were not changed by this integration.
- All 2,000 catalog members are compared between CPU and GPU in every scene.
  Visible pixels number 1,849 / 888 / 1,035; collision pixels number 62 / 26 / 34.
  GPU ownership retains the lowest canonical member and sums every colliding
  member once. Maximum relative Native15 palette residual is `1.27e-7`.
- Maximum continuous CPU/GPU projection residual is **0.00944 pixel**, below
  the declared 0.1-pixel raster criterion. Integer-floor assignment can differ
  by one pixel at a boundary. Direction-component residuals up to `3.46e-5`
  remain reported. An earlier development check requiring `3e-6` direction
  agreement failed; equivalent polar re-expression did not remove the discrepancy.
  The revised criterion explicitly evaluates the selected raster and preserves
  those failures. It is not an absolute accuracy estimate or proof of a specific
  driver-intrinsic cause.
- Unchanged frames reuse complete celestial generations; observation, camera
  translation, viewport and context callbacks replace incompatible products.
  Static stellar inputs are retained within the live generation owner. Dirty
  joint output is exact zero. A fault between index and palette draws retains
  the old pair without exposing a partial replacement, then recovers.
- Cancellation after complete frame preparation and before publication leaves
  the prior frame/cache active and disposes the cancelled celestial owner.
  All four observed owners finish with created and disposed target counts equal.
  Context recovery uses explicit callbacks, not an induced OS/device failure.
- The three horizontal source states share one atmospheric field. The selected
  [placement and physical assumptions](p5-celestial-design.md#concrete-contained-adapter)
  keep the presentation dome, external source transport and local atmospheric
  cache as separate responsibilities. Black physical ground and disabled ozone
  remain unchanged. Exact dome-rim singularities are outside the sampled locations.

The final browser delivery took **42.689 seconds**, including construction,
three images, GPU readbacks, diagnostics, preview and lifecycle checks. It is
not a pure cache-build timing. Logical admitted peak was 911,303,640 bytes;
sampled private peak was 4,816,113,664 bytes, working-set peak 1,321,259,008 bytes,
and minimum machine-free memory 15,868,903,424 bytes. Host process telemetry is
not physical VRAM accounting. Timing remains informative.

Six negative admission cases verify the phase exception cannot select another
launcher, mix exceptions, lower the reserve, extend the job duration or raise
the owned-process ceiling. The analytic convention proof verifies 15 base-epoch
overhead cases and the shared westward pole rotation. Chrome profiles and the
execution lock are absent after cleanup. The default 8 GiB reserve applies again;
the phase-specific 6 GiB flag is no longer selected and never extends to P6.

## Follow-Up Visual Diagnosis

The owner-selected [Sun coverage readback](sun-disc-coverage.md) confirms false
positive coverage behind the checker-like Flat180 fringe. It preserves the
original delivery and review scope, and qualifies its diagnostic tooling
separately. The subsequently owner-selected [contained correction](sun-disc-correction.md)
owns its new source changes, focused proof and Sun-only images. Original P5
captures remain unchanged; no owner visual acceptance is recorded.

## Decisions, Recovery And Next Action

The [execution summary](../../../../../.codex-tmp/p5-celestial/summary.md)
owns the complete question/decision list and preserved development failures.
The [design basis](p5-celestial-design.md) owns the current placement and cache
abstractions. The report owns reproduction inputs and measurements.

Stop for owner visual review. After visual acceptance and a separate P6
selection, the full film remains Union Glacier on December 14, 2024,
Flat180 through Flat540, with the original distant-film scene setup retained.
Absolute error bars, gray-horizon research, ozone, reflective physical ground,
shared-value optimization and production promotion remain deferred.
