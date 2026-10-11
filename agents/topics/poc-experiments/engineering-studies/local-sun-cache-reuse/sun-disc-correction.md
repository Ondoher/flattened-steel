# Contained Sun Disc Correction

The Sun circle/pixel correction remains a contained experimental candidate.
The primary agent mistakenly edited shared production code; the owner corrected
that scope. Both production source files and the existing spec were restored,
and the newly added production regression test was removed. Git diff confirms
no remaining changes to those production files. Promotion was not authorized.

The review baseline was captured before changes in
`.codex-tmp/review-standards/session-Jc97MB/baseline.json`. Implementation
completion requires its matching exit-0 CLEAN
[primary/audit receipt](../../../../../.codex-tmp/review-standards/session-Jc97MB/validation.json).
A missing, stale or non-CLEAN receipt keeps source completion open. Historical
P5 and readback receipts retain their original frozen scope.

The experiment-local `sun-coverage/correction.js` derives candidate GLSL from
authenticated original shader inputs. The candidate generator rejects disjoint
pixel squares before summing signed areas. Its consumer repeats the intersection
test at the output pixel to prevent linear tile filtering from leaking into
zero-overlap pixels. The diagnostic supplies the radius uniform locally.
Intersecting pixels retain the existing analytic overlap and s16 interpolation.
The default experimental application and production retain the original coverage.
The separately selected Flat180 comparisons below derive the candidate into
their new capture bundles without changing either default.

The earlier [diagnostic](sun-disc-coverage.md) and all P5 images/runs remain
immutable evidence. No display gain, spectral conversion, tone mapping or
physical model changes are part of this correction.

## Verification And Images

The immutable [00686 contained GPU proof](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00686-sun-coverage-fix/result.json)
authenticates original 00679 shader/input evidence, reproduces the original
outside-coverage defect, checks restored production shader text agrees with that
original, then derives and executes the experiment-local candidate GLSL.
All 21 cases have exact-zero coverage in disjoint tile and output-pixel samples.
The cases include captured Flat180, five radii from 0.2395 to 4 pixels, and four
subpixel placements. Every intersecting tile value matches the original exactly
on this ANGLE/NVIDIA RTX2060/D3D11 configuration. The proof admits at most 5e-6
absolute difference; observed difference is zero. It does not establish universal
GPU behavior or absolute overlap error bounds for the inherited area formula.

The four captured centre pixels retain coverage `0.04505744949` each. Their
independent near-quarter-circle expectation is `pi * radius^2 / 4`; the proof
checks agreement within 1e-5. No illumination was reduced in an intersecting
pixel merely to change its appearance.

Preserved trial [Flat0](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00684-p5-celestial/flat-0-sun.png),
[Flat90](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00684-p5-celestial/flat-90-sun.png)
and [Flat180](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00684-p5-celestial/flat-180-sun.png)
images retain the frozen P5 Sun-only controls and physical/display settings.
The trial Flat180 fringe is removed while its bright core remains. These images
were captured while the erroneous production edits were present; their source
inventories preserve that fact. They are immutable comparison evidence, not
current application integration or production promotion. Original proof 00682
and its guard 00681 also retain their original trial identities.

The contained authored-source type check passes. Earlier production-test results
and reviews describe the withdrawn trial only. Final completion requires the
new contained request and audits; earlier reports are not relabeled. Maintained
production regression coverage belongs to a later authorized promotion, while
this experiment uses its immutable focused proof runner.

The contained proof used the default resource guard in immutable
[00685](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00685-resource-bound/result.json).
The trial capture's guard remains 00683. An initial sandbox process-launch failure
is retained in 00680. No browser profile or execution lock remains after cleanup.

## Why The Core Remains White

Each centre pixel contains about 4.5 percent of the Sun's surface radiance,
attenuated once along the view path. This is an absolute radiance calculation;
4.5 percent is not a display channel value of 0.045. Even a small portion of the
Sun can greatly exceed the display range of the surrounding sky.

The selected p2 response uses ambient receiver illuminance to apply an
achromatic gain, then the inherited per-channel exponential:
`display = 1 - exp(-max(linearRGB * gain, 0) * K)`.
All three sufficiently bright positive channels approach one, removing their
visible differences and quantizing the core to white. Atmospheric transmission
can redden the spectrum without producing an orange saturated core. The
[shared gain/encoding implementation](../../../../../src/algorithm32/implementation/color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js)
owns this inherited p2 operation. No Sun-specific display adjustment was made;
changing highlight appearance would be a separate display-policy decision.

## Normal Bruneton Flat180 Comparison

The owner requested the same Flat180 image with the normal Bruneton color model.
The new immutable [00688 image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00688-p5-celestial/flat-180-sun.png)
selects the unmodified `BrunetonColorDisplayModel`, retaining the frozen Flat180
control, N4 shell atmosphere, black physical ground, disabled ozone, Sun-facing
camera, 720 by 414 output and contained disjoint-circle coverage correction.
No Sun-specific exposure or spectral adjustment is applied. The sky is much
darker than the p2 trial; the four central Sun pixels still saturate to white.

The experiment-owned `bruneton-sun-variant.js` derives four module adaptations
only while bundling: producer/consumer coverage guards and radius binding,
normal Bruneton selection, and one-state capture with its scene-occlusion proof.
Exact source anchors and unchanged input text are required. Its
[input inventory](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00688-p5-celestial/inputs.json)
records original and derived module hashes, operations, all executable sources
and bundle/worker identities. Shared production files are read-only and have
no Git changes. The previous trial and all earlier runs remain immutable.

The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00688-p5-celestial/result.json)
has one Flat180 row, one cache, successful scene occlusion and no WebGL error.
CPU/GPU Native15 transmission differs by at most `7.45921e-8` absolute;
the apparent radius remains `0.2395174411` pixels. Browser execution took
36.1 seconds. The default [00687 resource guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00687-resource-bound/result.json)
passed; peak private bytes were 4.04 GiB and minimum free memory 12.50 GiB.
Browser profile and execution lock were removed before sealing.

The local authored-source type check passes. Capture-adapter source completion
requires the matching primary/audit validation at
`.codex-tmp/review-standards/session-LZ0o7D/validation.json`; numerical capture
success alone does not complete that gate. This comparison does not select
the normal Bruneton model as the experiment default or authorize promotion.

Reproduce this comparison with:

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=bruneton-180
```

## Latest P2 Combined Flat180 Follow-Up

The owner requested another Flat180 capture, returning to the latest color
model after the plain-Bruneton comparison, before selecting further trials.
New immutable [00690 combined image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00690-p5-celestial/flat-180-combined.png)
retains the current Flat32 p2 factory, enables the same 2,000-member stellar
catalog and applies the contained Sun coverage correction. The physical
atmosphere, frozen Flat180 control, 720 by 414 Sun-facing camera and star
presentation/brightness settings are unchanged. Production remains read-only.

The existing bundle adapter now accepts the explicit `p2-combined` preset.
The [input inventory](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00690-p5-celestial/inputs.json)
records equal original/derived hashes for `rotation-model.js`: the color
factory is retained verbatim. The single-state browser adaptation skips motion
encoding while retaining star, scene-occlusion, lifecycle and cancellation proofs.
No preview or film was generated.

The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00690-p5-celestial/result.json)
reports one cache, one Flat180 row, successful lifecycle/cancellation and scene
occlusion, and no WebGL error. All 2,000 stellar members pass the existing
CPU/GPU checks; 1,035 pixels are occupied, with 34 collision pixels. Continuous
projection residual is at most 0.00388 pixel, palette relative residual
`1.27e-7` and sampled stellar-consumer residual `4.90e-8`.

The [star-only diagnostic](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00690-p5-celestial/flat-180-stars.png)
is very faint, rather than exact black. Direct PNG inspection with Python/Pillow
(`Image.getextrema` and counting pixels for which any RGB channel is nonzero)
finds ten nonzero pixels and maxima R=3, G=4, B=5 out of 255. The identical
inspection of the immutable original 00674 star-only PNG gives the same counts
and maxima. This corrects the earlier visibility description; the correction
does not change the original PNG or its source evidence. The separate
[occupancy diagnostic](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00690-p5-celestial/flat-180-star-index.png)
marks placement independently of brightness. No stellar gain adjustment is
selected in this follow-up.

Browser execution took 48.794 seconds. The default
[00689 resource guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00689-resource-bound/result.json)
passed; peak private bytes were approximately 4.06 GiB and minimum free memory
12.61 GiB. Profile and execution lock are absent after cleanup. Local authored
JavaScript type checking passes. Completion of this expanded adapter is governed
by the matching exit-0 CLEAN primary/audit receipt at
`.codex-tmp/review-standards/session-yA31N8/validation.json`. Earlier receipts
retain their frozen source scope and do not qualify this expanded adapter.

Reproduce this still-only combined capture with:

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-combined-180
```

## Camera Facing Away From The Sun

The owner selected the same current-p2 Flat180 state with camera yaw turned
180 degrees. New immutable [00696 combined image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00696-p5-celestial/flat-180-combined.png)
changes only view orientation. Camera position and upward pitch remain fixed,
as do source/time, atmosphere, stars, current p2 response and contained Sun
correction. Production remains read-only. No preview or film is generated.

The experiment-owned `celestial-camera-turn.js` applies the world-up half-turn
and verifies the horizontal direction components reverse while the vertical
component remains unchanged. The cache object and camera position are retained,
and the finite Sun moves behind the camera with the off-screen consumer sentinel.
The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00696-p5-celestial/result.json)
retains before/after directions and those camera-only assertions. The
[input inventory](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00696-p5-celestial/inputs.json)
owns source/bundle identities and the exact adaptation recipe. This is a change
of camera azimuth at unchanged elevation, not a change of Sun orbital position.

Sun-facing transport and opaque-scene checks run before the turn. The actual
turned view then receives a fresh complete stellar projection check. All 2,000
members agree between CPU and GPU that none falls in this view. Every screen
index and Native15 empty-palette sentinel is zero. The
[star-only](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00696-p5-celestial/flat-180-stars.png)
and [occupancy](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00696-p5-celestial/flat-180-star-index.png)
diagnostics are therefore empty. The explicit camera preset permits this fully
verified empty view; ordinary Sun-facing qualification still requires occupied
pixels. No occupied-pixel spectral/consumer probe is claimed here:
`maxConsumerRelative` is null and `consumerSpectrum` is empty.

The original orientation is restored before existing lifecycle/cancellation
checks. They pass, as do the one-cache gate and zero WebGL-error check. Browser
execution took 46.861 seconds. Default
[00695 resource guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00695-resource-bound/result.json)
passed with approximately 4.18 GiB private peak and 12.77 GiB minimum free memory.
Profile and execution lock are absent after cleanup. Local JavaScript type
checking passes. Source completion for this expanded unit requires the matching
exit-0 CLEAN primary/audit receipt at
`.codex-tmp/review-standards/session-LzWAdN/validation.json`; preceding receipts
retain their frozen scope.

Failed attempts remain immutable: 00692 rejected an ambiguous restoration
anchor before rendering, then 00694 exposed the positive-star assumption when
the actual turned field was empty. Their guards are 00691 and 00693. The final
adapter narrows the source anchor and explicitly verifies empty-star behavior
instead of changing star placement or physical brightness.

Reproduce the turned still with:

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-combined-away-180
```

## Upward Camera And New Capture Size

The owner selected an upward view after the empty horizon-centered camera
trial, then selected 1024 by 768 pixels for rendering going forward. New
immutable [00700 combined image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00700-p5-celestial/flat-180-combined.png)
retains the same physical Flat180 state, current p2 color, original 2,000-star
catalog, camera position and contained Sun correction. Its camera keeps the
opposite-Sun azimuth and points 65 degrees above the horizon. The Sun remains
behind the camera. Catalog expansion and a stellar brightness change were
discussed but are not implemented by this capture.

The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00700-p5-celestial/result.json)
and [recipe](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00700-p5-celestial/recipe.json)
record the 1024-by-768 raster. All 2,000 catalog members pass CPU/GPU projection
checks; five screen pixels are occupied, with no collisions. Maximum continuous
projection difference is 0.02127 pixel; palette relative residual is 7.09e-8
and the occupied-pixel consumer residual is 4.38e-8. Native15 stellar consumer
values are positive. The
[occupancy diagnostic](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00700-p5-celestial/flat-180-star-index.png)
marks those five pixels. The
[star-only PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00700-p5-celestial/flat-180-stars.png)
is exact black after unchanged display conversion and 8-bit encoding. Python
Pillow inspection of all RGB pixels gives extrema zero in every channel and
zero nonzero pixels. This image verifies placement and spectral execution;
it does not demonstrate perceptually visible stars or resolve their brightness.

The same request first completed at the prior 720-by-414 raster in immutable
00698, guarded by 00697. Six stars occupied that wider-aspect view; its star-only
PNG is also exact black. The owner's resolution update arrived during that run.
00700 has a narrower horizontal field at the same 70-degree vertical FOV, so
its five-star count is not a comparison at identical framing. Earlier evidence
and its dimensions remain unchanged.

The celestial launcher now selects 1024 by 768 explicitly. Its browser reads
that recipe; camera aspect, shader viewport, stellar raster readback, occupancy
PNG and Sun-radius proof use actual dimensions. The lifecycle resize proof
uses half of the active size and restores that size. The upward preset requires
positive occupied-star evidence; it does not use the earlier empty-view exception.
Source/bundle/derivation identities are recorded in the
[input inventory](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00700-p5-celestial/inputs.json).
The original camera orientation is restored before lifecycle and cancellation
checks. Production source and tests retain no Git diff.

Browser execution took 46.795 seconds. The default
[00699 resource guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00699-resource-bound/result.json)
passed with approximately 4.03 GiB private peak and 12.78 GiB minimum free memory.
One-cache, scene-occlusion, lifecycle, cancellation and zero WebGL-error gates
pass. The browser profile and execution lock are absent after cleanup. No
preview or film was generated. Local JavaScript type checking passes. Source
completion requires the matching exit-0 CLEAN primary/audit receipt at
`.codex-tmp/review-standards/session-1QWUyd/validation.json`; earlier receipts
retain their frozen scope.

Reproduce the upward still with:

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-combined-away-up-180
```

Reproduce the coverage proof with:

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- prove-sun-coverage-fix.js
```
