# Local-Sun Cache Transfer Assessment

Focus: determine how lessons from the completed distant-Sun cache promotion
could benefit the production flat/local-Sun cache.

## Current Status

The initial source assessment and focused CPU transform probe are complete on
2026-10-08. No production implementation or cache selection changed. Horizontal
source-relative reuse is the strongest next candidate; today's shell policy,
radial-domain selection and controller identity prevent unrestricted reuse.
Full-cache numerical, GPU, timing and appearance qualification remain future work.
Source-review disposition is recorded separately under Assessment Verification.
The owner activated the contained [Local-Sun Cache Reuse experiment](../../poc-experiments/engineering-studies/local-sun-cache-reuse/README.md)
on 2026-10-08; it ended with an accepted contained outcome on 2026-10-11.
Its [closeout](../../poc-experiments/engineering-studies/local-sun-cache-reuse/p7-closeout.md)
owns the subsequent findings and limitations. The owner then selected
[production-port preparation](local-sun-cache-promotion-plan.md), whose
[status](local-sun-cache-promotion-status.md) owns next work. This assessment
remains the owner of the initial findings and immutable probe; its early
unqualified comparisons do not override later evidence or imply production adoption.

## Assessment Questions

- Which numerical stability and lookup precision corrections address mechanisms
  that also exist in the local-Sun path?
- Could interpolation improvements benefit local spatial reconstruction or future
  source-state transitions? Determine the correct coordinates and complete support
  requirements rather than assuming solar-zenith interpolation transfers directly.
- Which storage, GPU execution, residency and coherent publication techniques are
  reusable within the local cache's own resource and lifecycle contracts?
- What independent physical comparisons, CPU/GPU checks, temporal observations
  and hardware measurements would qualify each proposed change?

The applicability inventory and recommended next work are below. These are
recommendations for a later implementation plan, not adopted production changes.

## Sun Angle And Flat Geometry

No independent solar-zenith axis is needed for the current fixed-height,
isotropic finite source in a horizontally uniform flat atmosphere. This is
stronger than merely removing spherical twilight: the local Sun direction is
already determined by sample height and distance from its subpoint.

For source `S = (sx, sy, h)` and sample `p = (x, y, z)`:

```text
rho = sqrt((x - sx)^2 + (y - sy)^2)
distance to Sun = sqrt(rho^2 + (h - z)^2)
cos(solar zenith) = (h - z) / distance to Sun
```

The cache already stores the field over `z`, `rho` and outgoing direction.
Its radial/tangent/vertical frame rotates physical directions into the reusable
source-relative frame. The outgoing-direction dimensions still matter for phase
functions and radiance; eliminating a separate Sun-angle axis does not eliminate
directional scattering. If source height becomes a family parameter, height
needs separate treatment; it cannot be recovered by adding an arbitrary tilt.

The above-ground source has no spherical planet-shadow twilight crossing.
Long source paths, near-horizontal view rays and display response can still
produce large brightness changes and require temporal checks.

Sources: [source-relative position](../../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js:890),
[radial frame](../../../../src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js:42),
[current local lookup](../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCache.js:60).

## Straight Transforms For Sun Position

For a horizontally uniform atmosphere, flat ground with uniform boundary
properties, unchanged source height/radius/spectrum and the same source-centered
construction extent, horizontal translation and rotation about the vertical
preserve the physical transport problem. Transform both sample positions and
ray directions when rotating; translating positions does not translate vectors.

```text
p' = Rz p + (tx, ty, 0)
S' = Rz S + (tx, ty, 0)
direction' = Rz direction
J(S'; p', direction') = J(S; p, direction)   [physical symmetry]
```

Equivalently, sample a canonical cache using `(x - sx, y - sy, z)` and its
source-relative direction frame. The current lookup already does most of this
coordinate work. The useful change would be reusing field storage across Sun
placements, rather than building a separate solar-angle inventory.

This equality is a physical symmetry argument, not a demonstrated bitwise
identity of complete discretized production fields. The focused probe below
checks actual production CPU coordinates and source operations; it does not
qualify every angular frame, scattering order or GPU path.

| Change | Assessment |
| --- | --- |
| Horizontal translation, fixed height and domain | Physically reusable; current shell policy prevents exact unchanged-cache reuse. |
| Rotation about vertical at fixed horizontal offset magnitude | Strongest candidate under current shell policy: its shell domain is unchanged. Full-field and GPU verification remain required. |
| Arbitrary observer/camera change | View evaluation changes; reuse is valid only within qualified cache coverage. Current plan identity retains observation metadata. |
| Source-height change or vertical translation | Not a symmetry of the fixed ground and altitude-dependent atmosphere. Rebuild or qualify a height-indexed family. |
| Tilt or uniform scale | Does not preserve the current atmosphere, ground, source distances and boundary problem. |
| Nonuniform ground or horizontally varying atmosphere | Requires a new applicability assessment; the simple horizontal symmetry no longer follows. |

### Current Barriers

1. **Primary-J1 shell amplitudes depend on absolute source offset.**
   `LocalSunShellFactCache` derives its minimum/maximum distances from a fixed
   whole-world map/dome reference and `hypot(sourceX, sourceY)`. Its 2,048 held
   amplitudes therefore change under translations that change that offset, even
   when the continuous inverse-square source and local transport coordinates
   match. This is a construction-policy dependency, not a spherical twilight
   requirement. It cannot be removed by changing only the reuse key.
2. **The cache radius can change with Sun placement.** Flat geometry selects
   `max(4,800,000 m, horizontal observer-to-source distance)`. The selected radial
   node fractions and construction cylinder consequently change when that
   distance exceeds the minimum. Reuse needs a fixed qualified extent, or a
   genuinely compatible family of domains. Simply enlarging the extent also
   spreads the same node fractions over a larger interval and needs new spatial
   error checks.
3. **Ownership and identity currently bind one placement.** The plan records
   observation and resolved source position, its modules retain placement facts,
   the reuse key includes the complete plan and backend capabilities, and reuse
   occurs only within a controller's active cache. Source/geometry pairing and
   immutable configuration must remain coherent. Reusing storage across
   placements needs a canonical construction identity separated from current
   physical placement, with explicit resource lifetime and publication contracts.

Sources: [shell domain](../../../../src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js:44),
[shell-held J1](../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCacheSource.js:229),
[radius selection](../../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js:334),
[plan identity](../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCacheController.js:624),
[reuse/publication](../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCacheController.js:413),
[source/geometry pairing](../../../../src/algorithm32/implementation/local-sun/local-sun-geometry-pairing.js:17).

### Ways Forward

- First qualify rotation/placement reuse where height, horizontal offset magnitude,
  radial domain and all remaining construction facts match.
- For broader translation reuse, assess a versioned source-centered shell policy
  with fixed bounds. That changes primary J1 and requires numerical qualification;
  preserve the existing policy as the control.
- Alternatively, investigate reusing later-order fields while recomputing the
  placement-dependent J1 contribution. The current graph constructs continuous
  direct L1 separately; shell-held J1 contributes to the cumulative field without
  feeding later-order recurrence. An existing focused CPU check confirms this
  isolation. Preserving today's discretized result would require the matching
  interpolated J1 contribution; subtracting a fresh analytic sample at the query
  would not automatically reproduce it. Cancellation/subtraction precision and
  added storage also need measurement.

Source: [isolated J1 authority check](../../../../src/algorithm32/implementation/local-sun/cache/_tests/local-sun-cpu-cache.spec.js:204).

## Transfer Inventory

| Distant-Sun lesson | Current local path and applicability | Recommendation / proof needed |
| --- | --- | --- |
| Solar-angle cubic interpolation | No independent Sun-angle coordinate is required for a fixed-height local source; direction follows from `z/rho`. | Do not copy this axis or its 109-scene inventory. |
| Shape-preserving cubic reconstruction | Local position lookup is bilinear in `z/rho`; values remain continuous but derivatives can change at knots. | Consider only after a temporal/spatial sweep identifies a real problem. Define nonuniform-grid tangents, end conditions, nonnegativity and CPU/GPU parity. A separable cubic may require 16 position samples instead of four. |
| Complete interpolation support | Local fields are currently fully resident, rather than streamed through a partial shared atlas. | Preserve complete support. Residency retention machinery matters only if paging is later introduced. |
| Explicit high-precision direction weights | Local runtime and fused transport already multiply stencil weights around exact `texelFetch` reads. | Already present; do not count this as a new improvement. Probe seams, knots and the source-axis fallback if adapting storage. |
| Stable near-surface sphere arithmetic | Flat altitude is `z`; ground/top intersections use planes rather than subtraction of Earth-scale radii. | Spherical anchored-height and planet-shadow corrections do not transfer directly. Inspect the existing cylinder quadratic and source-relative float arithmetic where measured error warrants it. |
| Source-relative numerical coordinates | Local CPU construction positions and GPU source bindings can carry large absolute horizontal coordinates. | Canonical source-centered construction could improve both reuse and float precision. Verify transformed CPU/GPU source directions, boundaries and complete rays. |
| Packet storage/read consolidation | Local fields use scalar R32F arrays and up to four position by four direction taps per channel. Distant lookup groups Native15 channels into RGBA packets. | A plausible independent optimization. Fifteen scalar channels require four RGBA planes, adding one padded slot; measure actual read bandwidth, allocations and rendering time. |
| GPU transport offload | The local controller already selects generic `IntegratedCacheTransport`; its current plan reports zero packed transport bytes. | Already implemented structurally. Do not treat older CPU packed-transport resource numbers as current allocations or repeat this offload. |
| Atomic cache/light publication | Local controller already preserves the old complete cache on failed/cancelled execution and replaces it only after generation checks. | Retain this behavior when sharing field storage; qualify placement/source/receiver-light coherence at the application frame boundary. |
| FP32 scene capture and P2 response | Cache fields are already R32F. Ordinary Flat32's P2 selection uses FP32 scene capture for the shared renderer. | No new cache-precision upgrade is implied. Separate display benefits from physical cache-error claims. |
| Hardware qualification | Distant two-atlas qualification is specific to its layout, target and workload. | Measure local construction, shared-storage lifetime, active plus staging memory and frame cost on the supported GPU. Do not borrow distant-cache resource admission as local evidence. |

Sources: [local shader sampling](../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCache.js:116),
[R32F/fused graph](../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCacheController.js:490),
[fused weighted sampling](../../../../src/algorithm32/atmospheric-transport/cache/IntegratedCacheTransport.js:60),
[distant packet sampling](../../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheCubicLookup.js:22),
[shared scene precision](../../../../src/flat32/Flat32ProductionSelections.js:164).

For the selected 285-position/W27/Native15 layout, the scalar resident field is
`285 * 4374 * 15 * 4 = 74,795,400` bytes. Four RGBA32F planes would contain
`79,781,760` bytes before padding/alignment beyond those planes, an increase of
6.67%. For a full four-position/four-direction runtime stencil this changes
240 scalar fetches to 64 vector fetches in a straightforward packed design.
These are layout arithmetic and a possible shader design, not measured speedups
or complete GPU-memory accounting. The selected spectral units remain scalar
quantities regardless of their physical packing.

## Assessment Verification

The focused production CPU probe is
[result.json](../../../../.codex-tmp/local-sun-transfer-20261008/runs/2026-10-08T15-59-46.014Z/result.json),
SHA-256 `3274ac68892b8a291373de208d8032f427e9e0acbb280106dd3d923496fb4d1f`.
Its adjacent seal pins result bytes, source hashes and derivation. The result
also records the executed relative-import source closure, Node version, package
lock identity, parameters and every compared observation.

With source height 4,800,000 m, atmosphere top 100,000 m and unchanged 4,800,000 m
cache radius, 24 samples match CPU source distance, continuous incident scale,
position stencils, local directions and construction-ray limits after a
1,000,000 m horizontal translation or a 90-degree rotation. Rotation preserves
the shell boundaries and held amplitudes. Translation changes held amplitudes
at all 24 samples, with maximum relative difference `0.0005405119762694754`
(0.0540512%). This is a held-source-amplitude difference, not a complete sky
error or a physical-accuracy score. A separate placement at 6,000,000 m expands
the radial domain and changes its nodes. Height/vertical-translation controls
also demonstrate that the original symmetry does not apply vertically.

The probe builds no complete scattering cache and runs no GPU. It does not
establish arbitrary-angle discretized rotation invariance, transform reuse
performance, or full N4 appearance. Those are adoption gates below.

The existing shell-isolation spec was also rerun through the repository's
Jasmine configuration with the `isolates shell-held amplitude` filter: one spec,
zero failures, 18.274 seconds. Its
[log](../../../../.codex-tmp/local-sun-transfer-20261008/shell-isolation-20261008T160133531.log)
supports the J1/later-order separation discussion; it does not qualify transformed
fields.

The [initial assessment review record](../../../../.codex-tmp/review-standards/session-hOJyJW/analysis-validation.json)
records the reviewed assessment before the experiment-plan handoff. It is
separate from numerical/GPU adoption evidence and does not authorize a
production implementation or default switch. Later documentation revisions
require their own applicable review evidence.

## Historical Recommendations

The following recommendations informed the now-ended
[experiment plan](local-sun-cache-reuse-experiment-plan.md). Its accepted results
are preserved by the closeout above. Current work follows the separate
[production port plan](local-sun-cache-promotion-plan.md).

1. Pin the current flat/local profile, actual source trajectory, domain sizes,
   shell policy and hardware resource/timing control. Determine which real
   source positions preserve the same extent and shell domain.
2. Build a bounded comparison of freshly constructed versus canonical transformed
   fields. Start with same-height rotations; include all pure/cumulative orders,
   off-grid positions, source-axis fallback, W27 seams, ground/top/outer boundaries
   and complete rays. Check exact-time direct lighting and source disk separately.
3. Decide whether broader translation should preserve today's primary-shell
   policy through J1 recomputation, or select a newly qualified source-centered
   policy. Keep identity, cancellation, resource ownership and frame publication
   changes explicit.
4. Measure build avoidance and runtime cost. Evaluate packet packing separately;
   change spatial interpolation only if independent numerical/temporal evidence
   shows a benefit. Retain fixed acceptance bounds and preserve failed candidates.

## Existing Owners And Evidence

- [Local cache state](unresolved-research.md) owns the selected spatial domain,
  interpolation, resource facts, source-dependent rebuild behavior and evidence
  limitations.
- [Extension contract](extension-contract.md) owns cache reuse identity and paired
  CPU/GPU completion requirements.
- [GPU transport offload plan](gpu-transport-offload-plan.md) owns the existing
  local transport optimization work; assess its current implementation and status
  before proposing overlapping changes.
- [Distant-Sun promotion status](distant-sun-strobing-promotion-status.md) owns
  accepted corrections, qualification and rejected trials.
- [Distant-Sun release](distant-sun-strobing-release.md) owns active production
  selections and compatible rollback.

Source-position dependence, inverse-square illumination and full atomic rebuilds
are existing local-Sun constraints. Distant-Sun cache reuse does not establish
equivalent reuse for a finite local source. Preserve prior evidence and derive
new comparisons into a new ignored task-owned output root when execution begins.

## Deferred Scene-Lighting Discussion

The owner accepts the existing recording with diffuse/adaptation interpolation
enabled. Its atmospheric sky transport comes from Algorithm32 at each frame's
state; the interpolated lighting inputs can also affect displayed brightness.
That film does not establish identical temporal behavior for fresh per-frame
receiver measurements in the ordinary application.

The owner liked the recording's shadow behavior and deferred API details.
When revisited, compare its shared shadow coverage, full-strength directional
Sun, bias and filtering with ordinary Flat32's object-specific setup. The
recording is the appearance reference; no shadow API change is selected here.
