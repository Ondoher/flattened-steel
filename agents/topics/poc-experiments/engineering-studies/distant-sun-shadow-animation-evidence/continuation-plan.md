# Distant-Sun Creative Animation Follow-Up Plan

Status: F0 diagnosis complete; F1 cache built and awaiting owner disposition;
F2 closed without a renderer change; F3 transferred to the contained
[Distant-Sun Recording Strobing Experiment](../distant-sun-recording-strobing/README.md).

## Objective

Revise **The Hours** through a new contained continuation that addresses these
appearance concerns in order:

1. frequent gray color along the lower horizon;
2. insufficient visibility of one-pixel stars on large displays; and
3. unchoreographed brightness flashing.

The accepted `1788974488678-creative-animation` run is the immutable comparison
parent. Every diagnostic, cache, frame, video, and verification artifact from
this continuation must be written into a new run below
`tmp/experiments/distant-sun-shadow-animation-evidence/runs/`.

## Boundaries

- Authored continuation code and controls remain below
  `experiments/distant-sun-shadow-animation-evidence/`.
- Production source, other experiments, the accepted film, and its independent
  verification remain read-only. F1 may build a new production-format cache
  package root and configure the local app to consume it; the currently
  selected production package remains preserved for rollback.
- The first phase tests ozone removal as a hypothesis. It must not describe
  ozone as the cause unless the matched comparison supports that conclusion.
- Each phase freezes the accepted timeline, camera score, scene, materials,
  lighting policy, renderer, resolution, frame cadence, and encoding settings
  except for the single variable named by that phase.
- A rejected candidate is retained as rejected evidence. A retry or correction
  receives a new run id.
- No candidate changes production behavior. Any accepted behavior that should
  ship requires a separate production design, implementation plan, and
  qualification boundary.

## Comparison Control

Before changing appearance, add a continuation harness that can reproduce
selected accepted-film states and record:

- parent run, source revision, module hashes, cache package and manifest hashes,
  renderer/browser/GPU identities, output dimensions, and display settings;
- exact animation time, astronomical instant, solar zenith, camera state,
  cache identity, cache-bin transition state, receiver-light identity,
  photopic illuminance, adaptation luminance, and exposure bindings;
- lossless native-resolution frames at the selected checkpoints;
- fixed lower-horizon, sky, terrain, and star-field regions of interest; and
- per-frame region statistics at a bounded diagnostic resolution, including
  RGB means, luma percentiles, and adjacent-frame differences.

Use morning twilight, sunrise, daylight near each horizon, sunset, evening
twilight, and full darkness as the initial checkpoint set. Add the exact frames
where the baseline trace changes cache identity or reports `modeChanged`.

Completeness: the control reproduces the accepted source state closely enough
for aligned frame comparison, authenticates every parent input, and changes no
accepted artifact.

## F0 — Brightness-Flash Diagnosis

Run this diagnosis before changing ozone, star rendering, or brightness
behavior. It locates and records the source of the flashing but does not apply
the correction.

- Produce a per-frame brightness trace for the whole image and fixed sky,
  horizon, terrain, and star regions.
- Mark every cache-bin change, cache identity change, `modeChanged` frame,
  receiver-light sample boundary, exposure/adaptation update, stellar-palette
  regeneration, camera transition, and authored fade on the same timeline.
- Score each frame's adjacent-frame brightness step and its deviation from its
  two neighbors. Retain lossless frames before, at, and after every strong
  outlier.
- Measure how strongly outliers align with hard one-degree cache swaps. If that
  does not account for the flashing, repeat the strongest intervals with a
  fixed camera and with sky, scene lighting, exposure, and stars isolated in
  turn.
- Record each visible flash interval, measured magnitude, correlated state
  transition, confidence, and remaining alternative explanation.

Completeness: every owner-visible flash has a bounded causal diagnosis or a
specific isolation run needed to distinguish the remaining candidates. No
smoothing, cache blending, or other correction is introduced in F0.

### F0 Result

Complete. Diagnostic run `1789171222384-creative-strobing-diagnosis` decoded
and measured all 1,800 frames of the immutable accepted film at 320 by 180. It
correlated whole-frame and upper, horizon, and lower-region luma with every
retained cache transition and physical scene-light value.

The ordinary adjacent-frame brightness slope does not implicate cache swaps:
the full-frame mean absolute step is 0.427 display-code values at a swap and
0.568 away from swaps. That measure mixes intended sunrise, sunset, and camera
motion with flashing. The two-sided temporal curvature measure isolates the
one-frame reversals that appear as flashes. Its cache-boundary mean is 0.407
for the full frame versus 0.080 away from boundaries, a 5.08-fold increase;
the upper-sky ratio is 7.01, the horizon ratio is 3.98, and the lower-region
ratio is 3.72. Cache-adjacent frames account for 33 of the 40 strongest
full-frame curvature events while representing about 10.6 percent of eligible
frames. Thirty of those top 40 events reverse brightness direction.

The strongest reversals recur in morning/evening pairs at matching solar
zeniths and straddle `modeChanged` publication frames. In contrast, retained
sky ambient, ground bounce, directional, and combined ambient intensities all
have smaller mean steps at cache transitions than between them. Camera curves
are continuous, and the largest monotonic brightness changes at the 12- and
48-second horizon crossings are a separate sunrise/sunset ramp rather than the
recurring flash signature.

Diagnosis: hard publication of complete one-degree atmosphere-cache states is
the demonstrated owner of the recurring brightness flashes. Interpolated
physical scene lighting is excluded as the primary cause. A few isolated
non-cache extrema align with authored solar/camera keyframes and do not form
the repeated strobing pattern. F0 changed no rendering behavior; F3 will test a
cache-compatible continuity correction after F1 and F2 are decided.

The diagnosis artifact set is
`d11dfb90549a3d0df8dc9a540b2c416ace03dc01a4c5774c25449d68cf9cd4e0`;
`diagnosis.json` is
`2a8bad6e945534578b1ab89692152eee2509cde72160d8ab6a3bd487babfafeb` and
the exact decoded pixel trace is
`aa080773e5ddf061f4cb8cba3596291786a02fc1d9ca9ae2daf6009525fdb285`.

## F1 — Ozone-Free Cache Ablation

### Build

- Rebuild the complete production cache inventory with ozone absorption
  disabled. Keep the production Native15 basis, dimensions, reconstruction,
  numerical schedule, one-degree binning, darkness boundary, and runtime
  package format.
- Use explicit disabled-ozone configuration and zero ozone cross sections.
  Assign new atmosphere, numerical, cache, catalog, and package identities so
  the result cannot be confused with the current ozone-enabled package.
- Write the 109 rebuilt bins and their packaged runtime catalog into a new
  generated package root. Do not overwrite or remove
  `server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1`.
- Verify package hashes, logical dimensions, complete 0-through-108-degree bin
  coverage, loader admission, and finite cache values.

### Inspect In Flat32

- The tracked production selection points the ordinary Flat32 application at
  the new package. No environment override, rendering change, or special
  comparison UI is required.
- The owner will run the normal watcher and server and inspect the lower
  horizon across the desired locations and times.
- The resolver and package loader have already authenticated the selected
  ozone-free identity before visual inspection.

### F1 Build Result

The complete ozone-free package was accepted in generated run
`2026-09-12T00-24-02-253Z-703e6867-62cf-43b2-a2e0-faa218aaa9a2` and installed
without modifying the former package. Its package-set identity is
`2243c1ab2c2d529131759b32d72cee2a2e4b32098e1cc450c0d48cf34ed4edc7`;
`package-set.json` is 3,268 bytes with SHA-256
`cfb287edddcbeabb90224af61e6d253fc0ff78b92eb3bb6dc50b758cb3c3ac4e`.
The package contains 109 scenes and 89 blocks in 505,753,993 bytes. Generation
used atmosphere identity `algorithm32-canonical-no-ozone-v1`, numerical
identity `algorithm32-native48-z180-w27-f68-native15-n4-q30-no-ozone-v1`,
disabled absorption, zero Dobson units, zero maximum ozone density, and 48 zero
cross sections.

The final verifier authenticated every compressed block, reconstructed all
17,227,670,880 logical scene bytes, and admitted representative illuminated
and dark selections through the production service and router. The production
selection now names this package. The browser admits the existing RTX 2060,
Chrome 153, ANGLE D3D11 dual-atlas memory policy from the authenticated server
selection. The client validates the supplied evidence format, target GPU,
browser major version, ANGLE backend, and byte budget against the running
environment; it contains no package or qualification identity allowlist.
Package choice remains a server deployment concern. The regenerated package
retains the qualified block layout, decoded sizes, atlas allocation, and
transition lifecycle. F1 remains open only for the owner's visual horizon
decision.

### Gate

The owner decides visually whether the ozone-free cache improves the lower
horizon. Record that decision and the inspected catalog identity. If rejected,
stop F1 with the existing package still selected. If accepted, retain the new
package for later animation work. Do not add matched-film renders, automated
color scoring, or further horizon diagnosis unless the owner requests it after
inspecting the app.

## F2 — Resolution-Aware Star Footprint

Disposition: closed without a renderer change. Direct inspection in the native
application found the existing stars acceptable. The concern is specific to
the recording or later presentation path, so no footprint experiment or
production pixel-count adjustment is warranted now. Reopen this phase only if
recorded-star visibility becomes a material problem.

### Measure

- Reproduce the accepted opening and closing star fields at native 4K and at
  representative presentation sizes. Retain the exact camera, stellar roster,
  palette, exposure, and adaptation state.
- Measure isolated-star peak code value, footprint area, integrated RGB,
  retained star count, close-pair merging, and encode/downscale survival.
- Record display-resolution and viewing assumptions explicitly. Pixel count
  alone is not an angular-visibility claim without display size and viewing
  distance.

### Candidates

- Compare the current one-pixel control with bounded two- and three-pixel
  footprints.
- Evaluate constant-integrated-energy and bounded constant-peak variants
  separately so footprint growth is not silently coupled to a brightness
  increase.
- Prefer a resolution-aware footprint derived from the rendered pixel angular
  pitch and a declared minimum presentation angle. Clamp it to the smallest
  tested footprint that remains noticeable and does not turn the field into
  disks or merge neighboring stars excessively.
- Keep stellar color, catalog ordering, magnitude relationships, adaptation,
  and temporal state fixed during this phase.

### Gate

Select the smallest footprint policy that is visibly reliable on the declared
large-display profiles, survives the target encode/downscale path, preserves
relative stellar appearance, and passes full-field crowding and close-pair
inspection. Record the selected kernel, energy rule, angular assumption,
clamps, and exact before/after metrics.

The owner disposition satisfies this gate by retaining the one-pixel control
and deferring recording-specific mitigation. No candidate was built.

## F3 — Brightness-Flash Correction

Transferred to the contained
[Distant-Sun Recording Strobing Experiment](../distant-sun-recording-strobing/README.md).
That experiment owns the fresh current-package control, recording-path
isolation, candidate correction, and qualification. This section retains the
original correction outline as historical planning context.

### Correct

Apply one correction to the demonstrated owner of each flash:

- cache discontinuity: blend compatible adjacent cache states over a recorded
  interval while keeping source direction and publication coherent;
- receiver-light or exposure discontinuity: interpolate in the physically
  appropriate quantity before applying the display transform and retain
  requested-versus-published identities;
- stellar regeneration discontinuity: keep the prior palette until the
  replacement is complete, then publish atomically or cross-fade compatible
  palettes;
- authored camera or title transition: adjust only the creative score if the
  event is not intended.

Do not add a generic temporal filter before locating the source. Any smoothing
must declare latency, state reset, cache-transition, seek, and first-frame
behavior and must remain deterministic under trace replay.

### Gate

No owner-visible unchoreographed flash remains in the targeted intervals.
Every baseline outlier has a named cause and disposition, and the corrected
trace has no new adjacent-frame luma or chromaticity outlier at cache,
receiver-light, exposure, stellar, camera, or fade boundaries. Intended dawn,
sunrise, sunset, and title changes remain intact.

## F4 — Final Film And Verification

- Render one new native-4K, 30-fps, 60-second candidate from the accepted
  timeline using the selected F1-F3 decisions.
- Retain all 1,800 scene states, per-frame diagnostic trace, representative
  lossless captures, consumed cache manifests, derivation identities, and the
  encoded film.
- Independently verify containment, immutable-parent hashes, duration, cadence,
  dimensions, decoding, terminal manifests, star preservation, and all three
  phase decisions.
- Compare the new film with the accepted parent at the predeclared horizon,
  star, and brightness checkpoints and obtain explicit owner acceptance.

Completeness: the continuation closes only when F1, F2, and F3 each have a
recorded decision and the final candidate is independently verified and
owner-accepted. The original accepted film remains valid historical evidence
regardless of the continuation result.

## Execution Order

1. Implement the comparison control.
2. Execute F0 and record the strobing diagnosis without changing behavior.
3. Execute and decide F1.
4. Record the F2 no-change disposition from native app inspection.
5. Execute and decide F3 using the F0 diagnosis.
6. Render, verify, and review F4.

Do not combine candidate variables across phases before the earlier phase has
been decided; otherwise the result cannot identify which change caused an
improvement or regression.
