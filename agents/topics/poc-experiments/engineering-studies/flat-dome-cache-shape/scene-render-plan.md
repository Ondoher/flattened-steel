# Flat Dome Cache: Three.js Scene Render Plan

Status: R1-R4 complete through independent-execution; integration verified, near-rim accuracy qualified. One read-only plan critique is complete.

## Outcome and Authority

Implement an experiment-local path that **builds a complete dome cache, gives
that cache to an updated atmosphere shader, creates a Three.js scene with a
finite ground object, and renders the scene through that shader**. Final output
is two unannotated 1280x720 PNGs from one location: outward toward the disk rim,
then inward with heading changed exactly 180 degrees. Both use the same completed
GPU cache. This is implementation with a small measured integration pilot.

The owner subsequently selected this plan through independent-execution. That
authorizes its contained implementation, builds, rendering, verification and
adviser-recommended local checkpoints. Production changes, pushing, and unrelated
work remain outside scope. The [status](status.md) owns the next action; the
existing [execution record](execution.md) owns milestone evidence and decisions.

All authored changes stay under `experiments/flat-dome-cache-shape/` and this
owning topic. Generated output stays in new monotonic immutable runs under
`tmp/experiments/flat-dome-cache-shape/runs/`. Production, earlier experiments,
sealed runs, and historical Star evidence remain read-only. This extends the
current experiment; it neither promotes code into the app nor starts another
experiment or changes its lifecycle status.

## Accepted Framing and Implementation Assumptions

The owner delegated height and distance selection, required the observer to
remain inside the dome, and rejected the proposed 5-degree zoom in favor of
a natural FOV. Retain the earlier accepted 90-degree horizontal FOV. The
5-mile/100-m proposal and earlier 88-degrees-south/2-m proposal are superseded.

| Parameter | Selected value and authority |
| --- | --- |
| Distance inside rim | 5,000 m along a radial ground line; agent selection under owner delegation |
| Eye height | 45 m above ground; agent selection under owner delegation |
| Latitude | Approximately 89.95503398 degrees south under the existing North Pole AEQD map |
| Map-frame placement | Observer on positive X, equivalent to longitude 90 degrees east under the existing `[r sin(lon), r cos(lon)]` convention; frame convention, not a new lighting input |
| Headings | Outward `+X`, then inward `-X`; yaw differs exactly 180 degrees, with unchanged roll/up |
| Pitch | Level, 0 degrees, retained from accepted defaults |
| Horizontal FOV | 90 degrees, retained natural framing; derive vertical FOV from 16:9 aspect rather than assigning 90 degrees to Three's vertical-FOV property |
| Final output | Two 1280x720 PNGs; no visible objects except finite ground and atmosphere |
| Source | Same finite point Sun at `[R/2, 0, 4828032]` m as the middle study configuration; inward side, fixed for both views; no visible Sun mesh |
| Cache | N12 quadratic dome-distance slices, counted valid-row support, existing 22 altitude/17 source-distance rows, 96 incoming/98 stored outgoing addresses, Native15, orders J1-J4; starting implementation choice, not a production qualification |
| Display | Existing CIE-to-sRGB conversion and common exposure 0.06; no per-view auto-exposure, white balance, or image fitting |
| Ground appearance | Fixed unlit Native15 spectral scene endpoint using the existing source packet's spectral shape, normalized once to the CIE-Y luminance of sRGB gray96 under the common exposure; record its actual RGB rather than forcing exact channel neutrality |

Ground appearance is an explicit integration assumption, not an owner-selected
albedo. Before rendering, derive and freeze a nonnegative 15-bin ground radiance
packet: use `medium.sourceIrradiance` only as its normalized spectral shape,
assign the endpoint spectral-radiance units, and apply one scalar normalization
so the existing CIE conversion/common exposure produces the luminance of
sRGB96. Record the equation, scalar, complete spectrum, actual RGB and hash.
Do not fit this packet to either image or force exact neutral RGB channels.
For ground hits, compose each bin as `Lair_i + Tview_i * Lground_i` before
XYZ/RGB conversion; for background misses the endpoint is zero. The rendered
ground supplies hit/distance/material identity, not an undefined conversion
from RGB into spectral radiance or an unverified RGB transmittance average.

The cache retains its existing black/absorbing ground transport boundary;
this declared scene endpoint does not add ground-reflection/emission feedback
into the cached scattering solution. Do not claim coupled physical ground
illumination. The fixed contrasting endpoint makes the finite object visible
without changing cache optics or adjusting either image independently.

Under the pinned 100-km-apex cap, the local roof is approximately 49.95725 m,
so the camera's shortest sample-to-dome clearance is approximately 4.95700 m.
The rim is about 0.51565 degrees below the level outward view, roughly 5.76
vertical pixels at the selected projection. A natural FOV cannot produce the
large edge/horizon separation of the rejected telephoto proposal: the shallow
dome constrains an interior camera's height/distance ratio. Make the actual
ground termination distinguishable through its fixed material, correct shader
composition, and native-resolution presentation; do not invent a wall, move
the rim, raise the observer outside the dome, or zoom the final cameras.

## Starting Point and Reuse

- The completed study's [report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00041-m4-report/index.html)
  and verifier `00042` retain numerical/geometry evidence. Reuse their source,
  optical constants, topology, packing, reflection, quadrature, and color
  definitions. The selected near-rim location is not automatically covered by
  its aggregate error numbers; measure targeted errors here.
- `gpu.mjs` currently creates a private raw-WebGL context, builds J2/J3/J4 and
  their cumulative field, queries supplied rays, then deletes textures and
  loses the context. Saved artifacts contain ray results and measurements,
  not a reloadable full cache. A new live cache resource is required.
- `candidate-shader.mjs` contains the tested construction/lookup physics and
  ray integration. Cumulative retention is already numerically checked. Reuse
  its semantics, rather than constructing an unrelated shader or synthesizing
  the final images from stored swatches or CPU per-pixel ray results.
- Production shader/runtime sources are read-only lineage and contract inputs:
  `FlatGeometryShaderContributor`, `FlatCompactCacheShader`,
  `LocalSunShaderContributor`, `ShaderRuntimePass`, `SceneInputCapture`, and
  the Flat application's runtime. The old slab/cylinder lookup and observer-
  centered view dome are not valid substitutes for this cap.
- Existing `ExactFlatGroundObject` is a raycast-only `Object3D` for a rectangular
  plane. It is not the required visible finite disk. Existing scene capture
  uses packed byte targets; inspect range/precision before reuse.
- Installed Three.js is 0.180.0; use the existing dependency, Node, browser,
  Puppeteer, and PNG tooling. No new dependency or native helper is planned.
- The earlier N12 field median was 6.303 s on RTX 2060; compilation and first
  query were each about 50 s. These are planning references, not predictions
  for the Three.js port or a full frame. Directional resolution is much lower
  than production; no production performance inference is permitted.

Preserve earlier evidence. Changed equations, packing, precision, quadrature,
directional support, source, or spectral/order semantics require a distinct
comparison and invalidate only the affected numerical reuse. A different
host adapter alone does not justify rebuilding the earlier sweep or rerunning
the full native guide campaign.

## Intended Code Responsibilities

Proposed experiment-local modules; exact names may follow existing conventions:

- `DomeCacheBuilder`: runs the existing order recurrence into Three-managed
  float render targets on the scene renderer's WebGL context; reports progress.
- `DomeCacheResource`: owns completed cumulative scattering and position/row
  textures plus immutable physical/layout identity; explicitly releases them
  only after all consumers finish. Camera state is not part of its build key.
- `DomeAtmosphereShader` / integration adapter: updates the Flat shader's view,
  scene-input, boundary, and lookup path to consume the new cache; combines
  analytic J1 with cumulative J2-J4 and transmitted scene endpoint radiance.
- `FiniteGroundObject`: actual rendered Three mesh with an exact circular
  boundary and matching color/hit/distance capture semantics.
- `DomeSceneRenderer`: owns Three scene, camera, capture/composition passes,
  physical-to-render transforms, and view-only updates.
- `run-scene-render.mjs`: owns settings, immutable runs, build-once execution,
  PNG/readback evidence, checks, timing, and browser/resource cleanup.
- Ambient `.d.ts` contracts: resource ownership, settings, diagnostics and
  outputs. Use JSDoc next-line descriptions, braces and repository formatting.

Keep the completed study runners reproducible; add adapters rather than
changing their physical meaning or measured algorithm in place. No React,
application registry, settings feature, server, or production integration is
needed for this scene harness.

## Milestones

### R1 - Live Cache and an Authenticated Shader Integration Route

Purpose: resolve resource ownership and shader compatibility before investing
in full-frame rendering.

- [x] Pin source/Three/tool identities, the settings above, exact projection,
  physical/RGB units, and the existing shader lineage to be updated.
- [x] Inspect the public shader/runtime injection boundary. Use it where it
  supports the new layout; otherwise derive narrowly scoped experiment-owned
  geometry/cache contributors and runtime adaptation from those sources. Record
  what is retained/replaced. Do not force the new field through an incompatible
  old compact-cache identity or claim a different sky demo is the requested update.
- [x] Build one N12 field using Three-managed data textures/render targets on
  the same renderer/context used for the scene. Retain the completed cumulative
  resource; release pure-order intermediates after validation. Preserve tiled
  construction and inspect successful allocation on the actual device.
- [x] Use an experiment-owned browser entry/bundle with the installed tooling;
  generated bundles and browser profiles stay under the new run. No app build,
  remote CDN dependency, or production-generated file is required.
- [x] Compare representative field/query values with the existing raw-WebGL
  path, including valid-row support, grazing rays, near-rim samples, reflection,
  and the actual new camera location. Start with a few cheap rays and expand
  only if a difference needs diagnosis. Record numerical tolerances before
  examining differences, using float packing/accumulation bounds and earlier
  retention evidence rather than a newly invented visual error allowance.

Deliverables: reusable builder/resource code, source/setting manifest, actual
build telemetry and allocation facts, and a small parity report. This is the
first useful executable slice; publish its evidence promptly.

Advance when actual textures belong to the scene renderer, values are finite,
resource lifetime is explicit, and adapter differences are resolved or precisely
bounded. Fix a port error before progressing; do not tune the optics/count to
hide it. Binary export/reload is conditional on an actual context/tool boundary
that cannot use a live resource; otherwise defer persistent cache packaging.

Estimate: roughly 2-4 hours authoring/integration, with uncertainty in the shader
injection seam. One measured build updates compilation/build estimates before
the next stage; timings and memory are not arbitrary stop ceilings.

### R2 - Updated Shader Consumes Cache and Scene Ground Inputs

Purpose: establish the requested shader path and its physical boundaries before
using appearance as evidence.

- [x] Retain the existing shader/runtime's camera reconstruction and scene-input
  composition where compatible; replace dome intersections and cache sampling
  with the fixed North Pole cap, finite disk, ragged distance axis, and correct
  directional reflection. Preserve finite-source attenuation and distance falloff.
- [x] Integrate analytic J1 plus the cumulative J2-J4 field once, without
  triple-counting a cumulative texture bound to former pure-order slots.
- [x] Create the actual finite ground mesh and its color/hit/distance capture
  inputs for shader checks. A covering mesh with stable analytic circle discard
  is acceptable; a rectangular infinite plane, low-sided polygon pretending to
  be exact, or raycast-only placeholder is not. Preserve identical disk clipping
  in all passes; an override material must not restore phantom rectangular ground.
- [x] Use renderer-produced ground hit mask, spectral material identity and
  sufficiently precise physical distance to terminate view integration. Resolve
  the fixed Native15 ground packet and composite each bin as
  `air radiance + view transmission * ground endpoint`, then convert to RGB.
  Ground preview RGB is not substituted for its spectral endpoint. Verify
  zero-air/unit-transmission and wavelength-dependent attenuation controls.
  No-hit pixels use
  the actual atmospheric exit; a legacy 100-km sky-ray/depth limit must not
  truncate long near-horizontal paths. Handle vacuum and outside-to-inside
  intervals in auxiliary checks even though the final observer is inside.
- [x] Keep physical map coordinates separate from observer-local Three
  coordinates and unit scale. Preserve low heights near a 20-million-meter
  radius; do not rely on cancellation-prone world-space vertex/depth arithmetic.
- [x] Derive Native15-to-XYZ/linear-sRGB weights from the existing color owner.
  Specify a single exposure/transfer/clipping chain, with Three tone mapping
  and color-space behavior explicit, avoiding a second gamma/exposure operation.
- [x] Compare selected GPU fragment radiances/transmissions with the old query
  evaluator and independent direct/probe calculations. Include both source-relative
  azimuths (outward/opposite Sun and inward/toward Sun), and locate any error in
  port, field approximation, or reference precision separately.

Deliverables: inspectable generated/assembled GLSL with lineage, bound-resource
identities, per-ray parity/physics results, and a concise milestone report.
Final images must come from this GPU shader, not a CPU image generator.

Advance when the correct live field is demonstrably sampled, scene depth/hits
are consumed, single-counted radiance and display conversion agree, and cap/
ground interval controls hold. Poor N12 accuracy at new rays is reported as a
measured limitation; it does not silently trigger another count/distribution
search. An unresolved port or physical-boundary defect holds this milestone.

Estimate: roughly 2-4 hours, dominated by scene-input and precision adaptation.
Reuse existing reference evidence; run new targeted probe samples only where
the new camera rays need reference precision. libRadtran remains a qualified
slab/all-orders guide, not a matching cap oracle; no new full guide campaign.

### R3 - Finite Ground Scene and Early Two-View Pilot

Purpose: prove the complete build-cache/shader/Three.js route and estimate
full-frame rendering cost early.

- [x] Mount the R2 finite ground object in the scene harness and render its
  fixed spectral endpoint through the updated atmosphere. Reuse its authenticated
  color/hit/distance capture path; add no other visible objects.
- [x] Configure the single inside-dome observer, level camera and natural FOV;
  derive outward/inward basis vectors in physical and Three coordinates and
  assert their opposite headings and common origin/up/projection.
- [x] Render an early 320x180 pair with the same 90-degree FOV/aspect, then
  publish actual images and measured scene-capture/view/readback timings.
  This pilot establishes composition/appearance and cost, not final edge detail.
- [x] Also render a small outward rim crop at the final 1280x720 projection and
  exact full-frame pixel centers, for example a 1280x64 band spanning the
  predicted horizon/rim rows. This is a GPU crop of the final projection, not
  a zoom or resized low-resolution image. Check native-scale edge contrast,
  clipping and antialiasing here before paying for both full frames. Keep it
  separate from the final unannotated pair and retain its full-frame rectangle.
- [x] Verify scene draw participation and ground hit/depth against independent
  ray/disk intersections, including rim-adjacent and deliberately outside-disk
  diagnostic rays. Keep any masks/crops separate from the final unannotated pair.
- [x] Track one cache-generation identity and texture/resource identities through
  both headings. Rotation and camera-only controls must not trigger rebuilding
  or height-specific shader variants. Three scene/capture passes may update.

Deliverables: actual low-resolution pair, final-projection rim crop, ground-hit/distance diagnostics,
cache-reuse trace, stage timing and revised final-resolution estimate.

Advance when the finite ground is a real rendered scene input, the native-scale
rim check resolves edge readability or a specific remaining limitation, the observer is
inside, the two views use one completed cache, and both render through the
updated shader. If the edge is hard to distinguish, inspect endpoint contrast,
ground clipping, common display handling and native-size presentation first.
Keep the chosen height/distance/FOV; do not secretly zoom, leave the atmosphere,
add a rim wall, or add extra scene objects to manufacture a dramatic edge.

Estimate: roughly 1-3 hours for scene integration and diagnostics. GPU duration
is unknown until this pilot. The final pair has 16 times the pilot pixel count;
use this only as an initial work estimate, not an assumed linear timing law.

### R4 - Final Pair, Verification, and Handoff

- [x] Before execution, estimate full-size memory/duration using R3. Render
  `outward.png` and `inward.png` at 1280x720, one completed cache, identical
  settings except yaw, no other visible objects, no per-view adjustment.
- [x] If a full-frame draw risks an observed GPU timeout or actual allocation
  limit, use measured tile sizes on the GPU. Preserve the full-image projection,
  pixel centers and seam-free sampling; do not alter FOV or downsample the final
  deliverable. Record any unavoidable failure instead of fabricating a render.
- [x] Retain exact camera/source/material/cache settings, assembled shaders and
  resource identities, raw sampled radiance/transmission and relevant masks,
  per-stage timings, actual allocations, clipped/nonfinite counts, and hashes.
- [x] Inspect both actual PNGs at native size. Confirm that the outward ground
  terminates at the predicted rim and is distinguishable from the scene beyond;
  the inward ground continues toward the disk interior. Do not claim a large
  apparent cliff or a visible opaque dome. If the natural framing still leaves
  the edge inconclusive, report that limitation and its pixel geometry honestly;
  do not call the visual goal achieved merely because files exist.
- [x] Verify selected pixel rays near the rim, horizon, ground, and atmosphere
  exits with independent geometry/probe data. Report actual errors and reference
  uncertainty without applying the earlier aggregate p95 as a guarantee here.
- [x] Check local types after authored code changes, formatting, resource cleanup,
  progress continuity, run/source identities, containment and final artifact hashes.
  Use self-verifying proof runners, not an experimental unit-test tree.
- [x] Publish one concise HTML/Markdown result page linking the two full-resolution
  PNGs, searchable settings/timing/verification tables and raw evidence. Update
  status/entry/execution for resumption and owner review.

Completion: runnable source demonstrates actual cache construction and GPU
shader consumption in Three.js; both required ground-and-atmosphere renders
exist with measured verification and honest visual assessment. A concrete
implementation/visual limitation is preserved as an incomplete or qualified
outcome, not relabeled as success. Production promotion remains separate.

Estimate: roughly 1-2 hours reporting/verification plus render duration, which
must be updated from R3 before full-size work. Total authoring estimate roughly
6-13 hours with substantial uncertainty; elapsed time is a progress review
point, not an execution veto or reason to discard valid evidence.

## Evidence, Recovery, and Reviews

Follow the existing design's real-path, source/output, monotonic-run and
immutable-evidence contracts. Record exact commands, source/tool/input hashes,
cache/layout/optical identities, derivation equations/operations, browser/device
facts, and parent artifacts. Long operations emit progress at transitions and
at least every 30 seconds, including compilation, rendering and final hashing.
Close resources before sealing. Never overwrite old reports or reopen runs.

The build-once requirement applies to both final headings within one rendering
session, not to every development/proof execution sharing one immortal cache.
R1/R2 may build fresh validation fields. R3/R4 may share a still-active session,
or R4 may build one fresh field for its final pair after the pilot has closed.
Record those separate generations honestly; never rebuild between the two final
headings. Publish intermediate evidence while a run is active, then close all
consumers/browser resources before sealing that run.

Publish useful cache/parity evidence, the pilot pair, and the final pair as soon
as each is available. End each milestone with a concise entry in the existing
execution record: deliverables, observations versus interpretation, limits and
verification, disposition and next step. Keep status current and chronology
in that execution record. Diagnose failures and retry only affected work in
new runs. Reuse authenticated unaffected data rather than restarting the study.

Dedicated standards reviewers and independent audits remain disabled. Primary
self-review, local type checks, scientific/visual/evidence verification, and
checkpoint-adviser monitoring remain required. Creating this plan does not
authorize a commit. Future checkpoint actions follow the authority of the
selected execution workflow. No production writes or push is included.

The create-plan skill requires one read-only second-agent critique of the
draft against the owner's goals before handoff. It is a plan critique, not a
standards review or scientific audit. Its completion condition is a recorded
critique and primary reconciliation. No additional discretionary review round
is planned for the anticipated adapter/tiling branches above.

## First Executable Step and Deferred Work

After execution is selected, authenticate the R1 shader/runtime seam and build
one live N12 Three-managed cache resource, with a small same-physics query
comparison. Do not begin by rerunning the full count sweep or native campaign.

Persistent cache export/reload, app integration, UI controls/animation, other
objects, alternative distance distributions, and a broad higher-resolution
accuracy search remain deferred unless an explicit conditional branch above
requires the smallest relevant part or the owner selects further work.

## Plan Critique

One separate agent completed the required read-only critique. Both suggestions
were incorporated: define spectral ground endpoint composition and normalization
instead of leaving RGB-to-spectrum/transmission ambiguous; and add an early
small rim crop at final projection/pixel scale because the broad pilot resolves
the edge by only about1.44 pixels. No suggestions were rejected. The crop is
diagnostic and does not alter the two natural-FOV full-resolution deliverables.
No further discretionary critique or standards review was added. The subsequent
owner-selected execution completed R1-R4; the execution record preserves evidence
and the near-rim accuracy limitation.

## Execution Outcome

R1-R4 are complete. The [scene report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00053-r4-scene-report/index.html)
links the two actual 1280x720 renders from run `00050`, the independent checks in
`00051`, timings, resource cleanup and authenticated artifacts. The selected
inside-dome pose and natural FOV resolve a ground cutoff approximately six pixels
below the horizon. The shader consumes the completed live cache in Three.js.
Near-rim air-radiance errors reach 37.53% against the independent probe; this
qualified accuracy outcome does not inherit the earlier broad-study result.
No extra count/distribution search or production promotion was performed.
The [execution record](execution.md#scene-render-execution) owns decisions and
recovery; the [status](status.md) owns current verification and next action.
