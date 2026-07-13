# Stellar Screen-Palette Production Port Plan

Status: paused production-promotion plan, current through 2026-08-22.
Production Work Plan steps 1 through 6 are complete. The owner rejected the
Step 7 Ferwerda path and reset Color to a contained Bruneton-derived model.
Runs `000466` and `000467` accept that replacement for the required
spherical/distant and Flat/local sky matrices; production remains unchanged
and Step 8 is not yet eligible. Step 7 is the preserved resumption point after
the current distant-Sun solar-zenith cache design/plan, not active work.

This document owns execution order and current state for promoting the accepted
stellar screen-index/native-15 palette and resolved Sun integration into
`src/algorithm32` and `src/flat32`. The
[Stellar Screen-Palette Cache Design](stellar-screen-palette-design.md) remains
the representation authority. The completed
[Stellar Rendering Plan](stellar-rendering-plan.md) and immutable runs remain
read-only experimental evidence.

## Authorization and Boundaries

The project owner explicitly authorized changing from the contained experiment
to production porting. Production writes under `src/algorithm32` and
`src/flat32` are now in scope. All writes remain inside this repository. Git
reads are allowed; Git writes, commits, resets, checkouts, rebases, merges, and
other index/history mutations remain prohibited.

The existing dirty worktree is intentional. Inventory and preserve unrelated
user changes. Do not overwrite uncertain production edits. Historical
Algorithm32-Star material and every immutable extraterrestrial run remain
read-only. New generated qualification evidence belongs in a newly allocated
immutable run under `tmp/extraterrestrial/`; never reopen an earlier run.

Production unit and browser regression tests are now appropriate. Contained
proof runners remain evidence and must not become production runtime
dependencies.

## Checkpoint Handoff State

Repository `HEAD` is `ac603ee` (`successful celestial experiments, next work
port to production`). That checked-in baseline contains the successful
contained implementation, its current design/plan records, and this focused
production-port plan. At the step-1 starting point, the working tree contained
only continuity and design refinements. Subsequent authorized production work
has completed the step-2 contracts and step-3 source, geometry, shader-source,
and ingress-policy implementation through substep 3.6; the current status is
owned by the Work Plan below.

The tracked contained implementation that matters to the port is:

- `SunDiskScreenPaletteComposer.js`: retains the historical four-sample path,
  adds 512-segment projected-boundary/pixel-square clipping with continuous
  binary64 coverage, and accepts either coverage form when composing spectra;
- `ScreenPaletteCelestialRuntimeParticipant.js`: adapts the integer matrix and
  native-15 palette to the existing celestial shader seam, declares integer-
  sampler precision, masks scene hits, and applies transmittance once;
- `render-sun-layer-three-scenes.js` and its browser participant: rebuild the
  fixed stellar palettes, compose geometric Sun coverage, disable legacy Sun
  and stellar raster contributions, and render through retained atmosphere and
  Color.

The source-local Sun tile selected for production is now implemented directly
in the standard production pipeline. It was never added to containment. The
contained three-scene path still materializes a full-screen composed
index/palette and remains only its support, energy, transport, masking, and
visual oracle.
Likewise, fractional-claim palette entries, Moon rendering, celestial ambient,
and extended shadows are future seam requirements, not current code.

Run `000435-sun-layer-screen-palette-three-scenes` was independently reverified
at this checkpoint: 22 artifacts, 1,987,359 bytes, artifact-set SHA-256
`15a983c091886402d6a5a3cd0110f9c02b6682697513ec90c267ac59d6c026b0`.
Its sunset disk owns 12 cache pixels (10 fractional, two full) and conserves
`4.2355923983` projected pixel areas. Its night PNG is byte-identical to the
prior accepted night image, proving scene masking removes the below-horizon
tile contribution. Runs `000432`, `000433`, and `000434` remain preserved
failed predecessors for the obsolete zero-cache assertion, a mistyped night-
reference hash, and omitted explicit zero-coverage JSON fields respectively.

One accepted limitation is easy to lose during handoff: `000435` applies the
existing `state.sceneHitMask` after palette lookup and masks the whole celestial
pixel. It does not combine geometric disk overlap with fractional geometry or
horizon coverage. This explains why the cache footprint grew to 12 pixels while
the horizon render can still look small. Match this behavior during the port;
do not silently add subpixel scene masking while implementing the Sun tile.

Steps 1 through 6 are complete. Step 7 remains the resumption point after
visual audit found
that its candidate mixes absolute atmosphere/stellar radiance with relative
renderer RGB, double-applies source brightness to Flat32 scene geometry, and
clips the stellar point-source range. Those contracts must be reconciled before
step 8's immutable integrated production qualification. The stellar generation, source-local Sun
tile, O(1) atmosphere consumer, atomic cutover, unconditional Flat32 Ferwerda
Color path, unchanged Bruneton comparison baseline, and Flat32 lifecycle are
qualified.

The pre-step-8 Flat32 night audit found and corrected a publication-gate defect.
After `EffectComposer` completes its final swap, the direct-scene diagnostic is
read from `writeBuffer`, which retains the preceding `RenderPass` result, rather
than the unwritten peer. Scene and composed-output color are diagnostic only
and are never publication predicates: a completely black frame is valid.
Preflight requires only a completed installed runtime frame, runnable programs,
and no captured shader/runtime/WebGL errors. The real Flat32 Chrome/WebGL2
inventory covers the explicit completely-black-frame control.

The following San Jose sunset audit found a separate celestial projection
defect. The Sun tile and stellar generation shader had passed geometry's
model-space directions directly to Three's scene-camera matrix even though
Flat32 uses a non-identity observer-local scene frame. Spherical geometry now
owns the inverse model-to-scene direction transform, and both generation paths
apply it before projection. For the exact sunset preset
`2024-06-21T03:26:03.503Z`, the local/model direction is approximately
`[-0.86599246, 0.50005652, 0.00073452]` while the correct Three scene direction
is `[-0.86599246, 0.00073452, -0.50005652]`; the source therefore lies on the
horizon instead of using north as screen-up. The source tile remains the
analytic circular continuous-coverage disk with the unchanged physical
`0.004675`-radian angular radius.

The final pre-step-8 Color audit corrected an incomplete Step 7 hookup.
Flat32 had continued to construct Bruneton, and an initial repair incorrectly
copied the immutable noon, sunset, and night proof values into runtime
condition branches. Both errors are removed. Both Flat32 modes now always
construct Ferwerda. A subsequent ownership audit removed the setup-time
atmosphere-cache readback and 4-by-8 sky quadrature. Setup now asks
`LocalLightLevelCalculator` for camera-independent source-light measurements.
It photopically projects receiver-local native-15 source irradiance; full-source
`sourceBrightness` scales local scene lighting while geometry-supported
`brightnessProxy` drives adaptation. There is no elevation/twilight formula,
framebuffer, atmosphere probe, timestamp/location branch, or named-condition
table. CPU and
GLSL replace an externally supplied exact zero only with `1e-6 cd m^-2` before
evaluating the Ferwerda logarithms.

## Step 1 Production Starting-Point Reconciliation

Status: complete on 2026-08-18. This section is the current-state handoff for
Work Plan step 2. It records the production tree that was inspected; it does
not accept the existing visible-celestial algorithms.

The project owner classified the existing production stellar and visible-Sun
implementations as failures and authorized their direct replacement. They are
therefore not compatibility constraints and must not survive behind a fallback,
feature switch, alias, or alternate roster family. The retained constraint is
behavioral ownership outside those failed render paths: each physical Sun
continues to own atmospheric illumination/scattering inputs, geometry continues
to own placement and projection, atmosphere continues to own path radiance and
transmittance, and Color remains the one source-independent display boundary.

### Read-only repository state

The reconciliation inspected `HEAD` `ac603ee` and the complete `src/algorithm32`
and `src/flat32` inventories. `git status --short`, `git diff --name-status`, and
`git diff --stat` reported changes only to:

- `agents/topics/active-topic.md`;
- this production-port plan;
- `agents/topics/extraterrestrial/stellar-screen-palette-design.md`;
- `agents/topics/extraterrestrial/production-integration-api-plan.md`; and
- `agents/topics/extraterrestrial/production-api-ownership-contract.md`.

No production or Flat32 source, test, manifest, fixture, or generated output is
dirty. The checked-in failed celestial implementations described below are
baseline code, not uncommitted work. Both current static baselines pass:

```text
npm run typecheck:algorithm32
npm run typecheck:flat32
```

No runtime source was changed and no experiment or historical evidence was
opened for writing during reconciliation.

### Production inventory and classification

| Surface | Exact current owners | Classification and port decision |
| --- | --- | --- |
| Public source roster and ingress | `interfaces/algorithm32/types.d.ts`, `interfaces/celestial-source/types.d.ts`, `celestial-source-support/{types.d.ts, CelestialSourceRoster.js, CelestialSourceSupport.js}` | Reusable ingress location, but the vague `celestial-rh-v1` frame, old radial family identity, cache-fragment contract, and cache-construction capability requirements are superseded. Replace them with the explicit FK5/J2000 source frame, observation/camera view identity, screen-palette generation, and disk-tile contracts. Keep exact 500-member, packet, hash, source/Sun identity, and roster/source-equality validation. |
| Reviewed stellar source data | `implementation/star-field/{consts.js, StellarPointSetSource.js}` and `implementation/index.js` | Reuse the checked 500 ordered member records, catalog/selection/input hashes, native-15 packets, and public `StellarPointSetSource`. Remove the old tiled-layout constant and replace the source's old tiled-controller factory. Correct the catalog-frame contract; the stored directions are catalog-frame inputs, not already Earth-fixed model directions. |
| Failed stellar cache and live raster | `implementation/star-field/{StellarPointSetCpuCache.js, StellarPointSetGpuBuilder.js, StellarPointSetCacheController.js, StellarPointSetCacheResource.js, types.d.ts}` | Superseded. It builds a `352 x 210 x 15` tiled `R32F` member-by-receiver/direction field, embeds member directions in that field, loops over all 500 members per fragment, and applies transport before live projection. Replace it with a first-class generation shader in the standard Algorithm32 render pipeline; that stage produces a screen-sized unsigned-integer index and entry-major native-15 `R32F` palette before one O(1) atmosphere/Color-stage lookup. The contained CPU builder is an oracle, not the production construction path. |
| Spherical celestial geometry | `implementation/spherical-earth/SphericalEarthGeometry.js`, `implementation/spherical-earth/celestial/{SphericalCelestialContributionDomain.js, types/SphericalCelestialContributionDomain.d.ts}` | Retain spherical atmosphere/ground geometry, observation ownership, scene/model mapping, view-ray reconstruction, receiver/horizon facts, and distant-Sun placement. Replace the celestial 11-by-13 radial transport domain, stencils, build samples, and four-sample support contribution. Stellar placement must transform each catalog direction by receiver latitude/longitude and the observation-time offset from the catalog epoch. The current production helper applies latitude/longitude but does not consume the observation instant, so restore the missing epoch-relative time transform under geometry ownership; run `000406` is the accepted fixed-observation evidence for that complete transform. Split the 794-line mixed class rather than adding another responsibility as it approaches the class-size limit. |
| Failed distant visible Sun | `implementation/distant-sun/celestial/{DistantSunCelestialCpuCache.js, DistantSunCelestialGpuBuilder.js, DistantSunCelestialCacheController.js, DistantSunCelestialCacheResource.js, consts.js, types.d.ts}` and the celestial methods/imports in `implementation/distant-sun/DistantSunLightSource.js` | Superseded as a visible renderer. Remove the 11-by-13 transported-radiance field and four-quarter-sample live raster. Retain `DistantSunLightSource` radiometry, angular support, atmospheric scattering-cache controller, scene-lighting adapter, and geometry-installed direction. The replacement tile uses the same source spectrum and placement without changing its illumination role. |
| Failed Flat finite visible Sun | `implementation/local-sun/celestial/{FlatFiniteSunGpuBuilder.js, FlatFiniteSunCacheController.js, FlatFiniteSunCacheResource.js, consts.js, types.d.ts}` and the celestial methods/imports in `implementation/local-sun/LocalSunLightSource.js` | Superseded as a visible renderer. Remove the one-texel field, four-quarter-sample raster, and fragment-owned extinction loop. Retain finite-source position/radius/radiometry, inverse-square atmospheric-light behavior, scattering-cache ownership, and scene-lighting adapter. The shared disk-tile contract has distant-angular and finite-physical placement adapters; it does not merge their atmospheric scattering caches. |
| Shared celestial resource vocabulary | `celestial-contribution-cache/{types.d.ts, consts.js}`, `geometry-support/types.d.ts`, and `interfaces/cache-backend/types.d.ts` | Placement is reusable. Replace the three old `sunTransport`, `starTransport`, and `localSunRadiance` binding keys with independently owned stellar-index, stellar-palette, and Sun-tile bindings. Keep `CacheBackend` and the scalar atmospheric field executor unchanged; the shader-written `R16UI`/`R32F` active/staging targets and tile coverage belong to standard rendering-runtime stage contracts, not the cache-build subsystem. |
| Existing cache GPU adapter | `implementation/three-cache-backend/{ThreeCacheBackend.js, types.d.ts, types/ThreeCacheBackend.d.ts}` | Retain as the atmospheric cache backend and read-only implementation-pattern evidence for capability checks, private handles, renderer-state restoration, and exactly-once cleanup. Do not extend or invoke it for the screen-palette generation stage. The standard rendering-runtime Three adapter owns that stage's transient and retained targets. |
| Shader build, stages, and publication | `rendering-runtime/{ShaderBuilder.js, ShaderAssemblyPreparer.js, types.d.ts, consts.js}`, `rendering-runtime/three/{ShaderRuntimeInstaller.js, ShaderRuntimePass.js, types.d.ts}`, and `implementation/algorithm32/{Algorithm32.js, Algorithm32ShaderHandle.js}` | Reuse the configured-model assembly, scene capture, common transport/Color order, failure cleanup, handle-level replacement, and controller collection. Extend the normal runtime installer/pass model with an ordered stellar generation stage before its O(1) atmosphere/Color consumer; no cache-build detour or sidecar pass is allowed. Replace the three old celestial controller/resource slots with one stellar stage/output-pair slot and one source-local Sun-tile slot. Initial cutover installs compatible stages, valid outputs, bindings, and consumer atomically; later camera/view refreshes swap active/staging pairs at a standard stage boundary without rebuilding the shader graph. The clock supplies the fixed observation snapshot used for placement; reacting to later clock updates is deferred. |
| Flat32 integration | `flat32/{SphericalDistantMode.js, FlatLocalMode.js, Algorithm32Runtime.js, ThreeSceneRuntime.js, types.d.ts}` | Retain mode/facade ownership, scene, camera, bindings, direct fallback, mode transaction, pointer look, and physical lighting. Replace only roster family wiring and visible-celestial refresh. `Algorithm32Runtime` retains the configured clock/location snapshot, publishes current camera/viewport bindings, and marks the installed generation stage dirty for view changes; it must not request a complete shader rebuild for ordinary view motion. All live clock updating and other animation is deferred. `ThreeSceneRuntime` currently stops and requires reload after context restoration; extend the normal pipeline path so targets are reallocated and regenerated before consumption, without changing unrelated scene ownership. |
| Scene lighting and Color | `implementation/scene-lighting/LocalLightLevelCalculator.js`, distant/local Sun Three lighting adapters, `flat32/LocalSunSceneLighting.js`, scene capture, `Algorithm32Transport.js`, and `BrunetonColorDisplayModel.js` | Retain unchanged. Direct and diffuse lighting, shadows, exposure policy, atmosphere path radiance, captured scene RGB, and Color are not screen-palette data. The new shader adds only `transmittance * boundaryRadiance` once before the existing spectral composition. |
| Tests | Adjacent `_tests` under the owners above plus `flat32/_tests` | Retain test placement and the Node/real-WebGL/Flat32 lanes. Replace assertions that canonize tiled member transport, 500-member fragment loops, radial celestial fields, old binding keys, subpixel scene-hit sampling, or four-sample Sun coverage. Retain and adapt observable ingress, source identity, assembly ordering, failure preservation, cancellation, reuse, disposal, scene capture, Color, mode transaction, and application fallback tests. |

### Lifecycle and live-view findings

Two current mechanics cannot be copied into the replacement even though their
own focused tests pass:

1. The old source controllers publish a replacement and immediately dispose
   their prior resource before the successor shader runtime is installed.
   Because `ShaderBuilder` may reuse a controller across builds, the still-live
   prior shader can temporarily reference a disposed texture. Initial cutover
   must stage the generation/tile/consumer programs, produce compatible valid
   outputs, install their bindings, commit the complete pipeline, and only then
   retire the old set. Later camera/view refreshes write an inactive
   matrix/palette pair and swap it only after all generation passes complete.
   Failure, cancellation, or supersession disposes only staging resources.
2. The stellar product is camera/viewport dependent, while Flat32 currently
   mutates camera bindings every frame without rebuilding celestial resources.
   Camera projection, orientation, or viewport identity therefore invalidates
   the screen palette. The clock/location snapshot and source product remain
   fixed for the installed configuration. A stale generation must
   never be sampled against a changed view. The runtime either publishes the
   matching generation at the frame boundary or supplies exact-zero stars until
   a compatible generation is ready. Camera orientation changes only Sun-tile
   placement when projection scale remains compatible; source motion and live
   clock updates are deferred. A scale,
   projection, support, sampling-policy, or viewport incompatibility rebuilds
   the tile. Screen-palette invalidation marks the output pair dirty; the
   installed standard render pipeline reruns its generation stage before valid
   consumption. It does not rebuild the whole ShaderBuilder graph, and CPU code
   does not reconstruct or upload the matrix or palette.

Whole-pixel scene masking remains after the stellar lookup and Sun-tile merge,
matching `000435`. The port does not retain the old per-quarter-sample scene-hit
queries and does not introduce fractional geometry/horizon claims.

### Exact step-2 edit boundary

Step 2 is contract and ownership work only. It may edit the following existing
files:

- public/ingress contracts:
  `src/algorithm32/interfaces/algorithm32/types.d.ts`,
  `src/algorithm32/interfaces/celestial-source/types.d.ts`,
  and `src/algorithm32/interfaces/geometry/types.d.ts`;
- shared internal contracts:
  `src/algorithm32/celestial-source-support/types.d.ts`,
  `src/algorithm32/celestial-contribution-cache/types.d.ts`,
  `src/algorithm32/shader-assembly/base/types.d.ts`,
  `src/algorithm32/shader-assembly/runtime/types.d.ts`,
  `src/algorithm32/shader-assembly/runtime/types/Algorithm32ShaderAssembler.d.ts`,
  `src/algorithm32/rendering-runtime/types.d.ts`, and
  `src/algorithm32/rendering-runtime/three/types.d.ts`,
  `src/algorithm32/rendering-runtime/three/types/ShaderRuntimeInstaller.d.ts`,
  and `src/algorithm32/rendering-runtime/three/types/ShaderRuntimePass.d.ts`;
- feature contracts:
  `src/algorithm32/implementation/star-field/types.d.ts`,
  `src/algorithm32/implementation/distant-sun/celestial/types.d.ts`,
  `src/algorithm32/implementation/local-sun/celestial/types.d.ts`,
  and `src/algorithm32/implementation/spherical-earth/celestial/types/SphericalCelestialContributionDomain.d.ts`;
- ingress/identity implementations needed to make the direct contract
  replacement executable:
  `src/algorithm32/celestial-source-support/CelestialSourceRoster.js`,
  `src/algorithm32/celestial-source-support/CelestialSourceSupport.js`,
  `src/algorithm32/implementation/star-field/StellarPointSetSource.js`, and
  the identity/layout header in
  `src/algorithm32/implementation/star-field/consts.js`; and
- focused adjacent contract tests:
  `src/algorithm32/celestial-source-support/_tests/CelestialSourceSupport.spec.js`,
  `src/algorithm32/implementation/star-field/_tests/StellarPointSetSource.spec.js`,
  `src/algorithm32/implementation/algorithm32/_tests/algorithm32-facade.spec.js`,
  and a new adjacent source-roster contract spec only if the existing facade
  spec cannot express the ingress behavior without duplicating its setup.

Step 2 may add ambient declarations below the existing owner directories, but
it may not add a builder, GPU allocation, shader contribution, runtime binding,
Flat32 activation, catalog parser, proof runner, compatibility alias, or second
roster family. The new declarations define:

- explicit FK5/J2000 catalog epoch, configured clock/location snapshot, and the
  required epoch-relative time-transform identity, with no live clock update;
- renderer-neutral camera/viewport view snapshots and exact compatibility;
- runtime-generation requests, dirty/completion identities, and active/staging
  products for an unsigned-integer screen index and native-15 palette;
- opaque generation-shader, transient-work, output-resource, and runtime-binding
  contracts;
- a first-class standard render-pipeline generation participant with ordered
  multi-output execution before its O(1) consumer, including vertex/fragment
  sources, point/fullscreen topology, depth/order state, clears, formats,
  dependencies, and completion boundaries;
- continuous source-local disk-tile generations and distant/finite placement;
- staged, commit, abort, context-loss, restoration, replacement, and
  exactly-once disposal outcomes; and
- one complete celestial publication transaction that keeps the existing
  visible implementation active until cutover, but provides no fallback after
  the replacement is committed.

All other production and Flat32 files remain outside step 2. In particular,
the old builders/resources/controllers are removed or rewritten only in Work
Plan steps 3 through 6, the standard rendering-runtime Three stage
implementation changes only in step 4, `ThreeCacheBackend` remains unchanged,
and shader/Flat32 wiring changes only in steps 5 and 6.

### Standards-conformance ledger

| Authority and concern | Current state | Resolved port rule |
| --- | --- | --- |
| Architecture / implementation ownership | `star-field`, distant/local Sun, geometry, renderer, and shared-support placement is mostly feature-correct. The failed radial cache leaks its representation into source, geometry, shader, and backend contracts. | Keep feature closures and the genuine cross-feature celestial owner; replace representation-specific contracts directly. No feature imports another feature's private implementation. |
| REMVC / Flat32 ownership | Modes configure facades and `Algorithm32Runtime` owns renderer attachment; this conforms. | Preserve those owners. Camera/view invalidation stays in runtime coordination, not React/view or source data. |
| Code conventions / naming and class shape | Class filenames are generally conforming. The 794-line mixed spherical celestial class is near the 1,000-line limit. Failed stellar code uses `Object.freeze`, compressed methods, and incomplete callable JSDoc; these are in-scope deviations, not precedents. | Split projection from obsolete radial-cache behavior; use PascalCase class files, `consts.js` for constants, private instance helpers, tabs/Prettier, and no `Object.freeze`. Superseded nonconforming files are removed rather than normalized for their own sake. |
| Types and JSDoc | Ambient placement is established, but frame/family/cache types canonize the failed representation and some declarations describe properties as generic “values.” | Replace canonical declarations and consumers together, use named string unions, document purpose/units/lifecycle per property, and add `@implements` only to intentional capabilities. No inline import types, shadow aliases, or old/new switches. |
| Validation | Roster/source/backend ingress validation exists and is reusable. Failed cache classes repeat internal checks and use descriptors as executable validation inputs. | Validate semantic frame, source, view, capacity, runtime-stage GPU capability, and lifecycle at their genuine ingress. Internal generation stages trust accepted types/constants; hashes identify/reuse but never recover executable facts. |
| Cache and physical ownership | Existing star and distant-Sun fields pre-transport each source and couple atmosphere identity to the resource. | Stellar palette and Sun tile contain top-of-atmosphere native-15 boundary data only. Atmosphere transmittance stays live and is applied exactly once after O(1) lookup/merge. Atmospheric scattering caches remain separate and unchanged. |
| Shader assembly and Color | Deterministic provider assembly, scene capture, spectral composition, and common Color conform. Existing celestial providers implement the failed loops/raster and old binding keys. | Retain the assembly skeleton and one Color boundary; replace celestial providers/keys atomically with one constant-time compositor. No catalog loop, sidecar renderer, duplicate Sun, or source-specific Color branch. |
| Lifecycle | Existing controllers cover cancellation and cleanup but can dispose a resource before successor runtime publication; Flat32 restoration is reload-only. | Install the generation and consumer stages atomically, use staged output pairs for refresh, reject stale view generations, restore by rerunning the normal generation stage from retained immutable source and current frame inputs, and give every transient and persistent GPU handle exactly one terminal outcome. No exception is approved. |
| Diagnostics | Existing shader/resource descriptors contain diagnostics; the repository has no accepted general production diagnostic API. | Retain only identity and bounded verification facts already consumed by lifecycle/tests. Do not add logging, reporting, or descriptor-driven algorithm selection. |
| Testing | Adjacent Node and browser placement conforms; current tests assert failed algorithms. | Replace obsolete assertions with accepted projection, collision, packing, O(1) shader, atomic lifecycle, context restoration, scene-mask, and visual-oracle behavior. Use real WebGL for integer/float texture behavior and production Flat32 browser tests for application publication. |
| Algorithm source evidence | Existing production Stage 12 documents point to the failed radial/tiled family. | This focused plan and the accepted immutable runs are the selected independent authority. Production does not import them. The older Stage 12 representation is superseded current-state prose, not an implementation fallback. |

There is no required standards exception and no unresolved in-scope ownership
decision. Pre-existing deviations outside the failed celestial paths are not
part of this port and will not be silently normalized.

## Accepted Promotion Oracles

- `000406-stellar-screen-palette-fixed-observation-projection-proof`: catalog
  direction through observation and camera to classified pixel.
- `000409-stellar-screen-palette-exact-cpu-builder-proof`: physical oracle for
  projection outcomes, exact collision sums, resolved per-pixel spectra,
  binary32 packing, and capacity. Its compact numeric palette indices are not
  the production shader layout.
- `000411-stellar-screen-palette-indexed-gpu-resource-proof`: `R16UI` matrix,
  `R32F` palette, O(1) lookup, restoration, replacement, and disposal. Its
  uploaded compact layout is format/behavior evidence, not the production
  sparse shader layout.
- `000412-stellar-screen-palette-atmosphere-composition-proof`: one index fetch,
  fixed 15-channel palette fetch, scene masking, and transmittance exactly once.
- `000427-sun-over-stellar-screen-palette-proof`: ordered Sun ownership,
  spectral scaling, and absence of duplicate legacy Sun contribution.
- `000435-sun-layer-screen-palette-three-scenes`: current geometric disk/pixel
  overlap and the solar-noon, sunset, and sunset-plus-three-hour visual oracle.

Artifact hashes and detailed claims remain owned by the completed experiment
documents and sealed manifests. Promotion tests compare against these oracles;
production never loads their generated files at runtime. Because production
uses sparse member-addressed shader outputs while the contained oracle used
compact CPU indices, acceptance compares member classification, resolved
per-pixel spectra, conservation, packing bounds, and consumer results rather
than requiring matrix or palette bytes to be identical.

## Selected Production Architecture

Stars publish one view-dependent screen-sized unsigned-integer index and one
native-15 contribution palette. Index zero is the exact-zero entry. The base
shader layout reserves `memberIndex + 1` for each canonical member, selects the
lowest colliding member as the pixel representative, and stores exact zero in
unused/nonrepresentative slots. Geometry owns and supplies the epoch-relative
time/location and camera projection operations; the ordered generation shader
executes them and accumulates same-pixel spectra in canonical order. The later
consumer performs O(1) lookup with no live-stage catalog traversal, applies
view transmittance once, and passes the common result to unchanged Color.

The production Sun retains its current atmospheric-light ownership for direct
illumination and scattering. Its visible disk moves to a compact source-local
coverage tile plus one shared native-15 spectrum. The celestial shader places
and fractionally merges this tile over the stellar palette. Production should
port this tile directly rather than first adopting the experiment's temporary
full-screen flattened Sun matrix. The old visible Sun raster remains active
until the new resource is installed atomically, then becomes inactive in the
same publication transaction so no frame contains duplicate Sun radiance.

The tile seam must permit a later Moon tile, fractional claim, phase/albedo,
celestial ambient, and extended shadows, but this port implements none of that
Moon behavior. Bruneton remains the unchanged comparison model. The accepted
experimental data-driven Ferwerda cone/rod behavior is promoted afterward as a
separate source-independent Color model; it must not be patched into Bruneton
or introduced as a celestial-source branch. Camera emulation and temporal
adaptation remain out of scope.

## Work Plan

### Standards Gate

Every port step must conform to the repository authorities in
[Repository Standards](../standards/README.md), especially Architecture, Code
Conventions, Type Conventions, JSDoc Conventions, and Testing. Algorithm32-
specific review is governed by the current
[Production README](../algorithm32/production/README.md),
[Architecture Boundaries](../algorithm32/production/architecture-boundaries.md),
[Current Dataflow](../algorithm32/production/current-dataflow.md), the selected
[Cache Design](../algorithm32/cache/README.md), and the applicable production
implementation gates. Load and apply the focused sections during
reconciliation rather than copying their rules into this plan.

For each proposed production change, record the owning standard, whether the
current tree already conforms, and how the proposed boundary preserves or
repairs conformance. Do not silently normalize unrelated legacy code. Any
necessary exception must be explicit, narrowly owned, and resolved before the
affected implementation step begins.

### 1. Reconcile the production starting point — complete

Inventory current `src/algorithm32` and `src/flat32` celestial, cache, shader,
facade, scene-lighting, and test surfaces. Classify existing dirty stellar work
as reusable, superseded, conflicting, or unrelated. Compare current production
contracts with the accepted screen-palette design and record the smallest safe
edit set. Compare module placement, REMVC/feature boundaries, naming,
validation, types/JSDoc, cache ownership, shader assembly, lifecycle,
diagnostics, and test placement against the standards gate above. Distinguish
pre-existing unrelated deviations from in-scope issues. Do not implement during
this step.

Exit condition: one current-state reconciliation identifies exact production
owners, files, retained behavior, obsolete paths, conflicts, and the step-2
edit boundary without changing runtime code. It also contains a standards-
conformance ledger with no unresolved in-scope ownership or exception decision.

### 2. Establish production contracts and ownership

Status: complete on 2026-08-18. The production source now declares its reviewed
catalog as FK5/J2000 mean equatorial at the explicit J2000 UTC epoch and exposes
the canonical ordered member table as immutable shader input. Geometry owns the
fixed IAU-2000/USNO epoch-relative observation transform and renderer-neutral
view snapshot contract. Rendering runtime owns ordered standard-pipeline stage
descriptions, sparse `R16UI`/`R32F` output identities, transient work,
active/staging publication, dirty/completion checks, cancellation, atomic
commit/abort, context restoration, and exactly-once terminal outcomes. Distant
and finite Sun owners now have separate continuous-coverage source-local tile
requests with the any-positive opaque-claim policy.

No builder, GPU allocation, shader behavior, runtime binding implementation,
cache-backend extension, or Flat32 activation was added. Algorithm32 and Flat32
static checks pass, as do the focused stellar source, celestial support, and
facade contract specs. The full Algorithm32 run reaches 540 of 541 passing
specs; its sole failure is an unrelated existing expectation that omits the
current `color.exposure-modifier` binding from the distant-spherical assembled
binding list. The same failure reproduces when run alone.

Add or reconcile internal types for catalog members, fixed clock/location
snapshot, camera/view
identity, ordered runtime-generation stages, sparse member-addressed products,
active/staging GPU resources, runtime bindings, and source-local disk tiles.
Assign facade, geometry, source, rendering runtime, shader, and Flat32
ownership. Define dirty/completion identity, stage ordering, cancellation,
atomic cutover/refresh, context loss, restoration, replacement, and exactly-
once disposal before behavior lands. Do not extend the atmospheric cache-build
backend for these standard render-pipeline outputs.

Exit condition: type/static checks and focused contract tests pass without
changing atmospheric-only output.

### 3. Port stellar source data, projection, and the generation shader

Status: complete on 2026-08-18. Substeps 3.1 through 3.9 are qualified and the
production boundary remains free of allocator, execution-lifecycle, consumer,
and Flat32 activation behavior.

Execute this step through the following ordered substeps:

#### 3.1 Define the immutable shader-input layout

Status: complete on 2026-08-18. Production now materializes one private
member-major binary32 table with exactly 18 `R32F` scalars per canonical row:
three FK5/J2000 direction components followed by 15 native irradiance channels.
The canonical row address is the member index. The 500-row upload copy is
36,000 bytes and has packed-table identity
`sha256:93dec8deb8bf5594778f523d0d01454194dbe0b052e812cf3fd67e1a20bc4d51`.
Callers receive independent value, member-id, epoch, and layout snapshots, so
they cannot mutate the source-owned table. Focused tests exhaustively compare
all 9,000 scalars with the reviewed source after binary32 conversion and prove
that the fixed row contains no capacity for projected pixels, collision
results, palette indices, or other screen-product values.
Algorithm32 and Flat32 static checks pass, and the focused source/support specs
pass. The full Algorithm32 run reaches 541 of 542 passing specs; its sole
failure remains the independently reproducible unrelated expectation that
omits the current `color.exposure-modifier` shader binding.

Port only reviewed catalog/photometry inputs and production-owned parser logic.
Pack the 500 members in canonical order with their FK5/J2000 directions and
native-15 irradiance packets. The canonical array position is the member index.
Prove that this table contains no projected pixels, collision results, palette
indices, or other screen-product values.

#### 3.2 Implement the epoch-relative geometry transform

Status: complete on 2026-08-18. Spherical geometry now contributes the
production GLSL for IAU 2000 three-angle FK5/J2000 precession, USNO mean
sidereal time, receiver longitude/latitude, local east/north/up, and the
configured scene-frame mapping. The fixed UTC instant is decomposed into
Julian centuries, zero-hour days, and hours-since-zero before binary32 upload;
the shader never receives a precision-destroying approximately 2.46-million-
day scalar. Clock/location bindings update only at configuration replacement.

Add geometry-owned shader operations for IAU 2000 three-angle precession from
the catalog epoch to the fixed configured observation time, USNO mean sidereal
rotation, receiver longitude/latitude, and conversion into local
east/north/up. Verify known transformed directions against the immutable
fixed-observation projection oracle. This is a configuration snapshot, not a
live clock or animation path.

#### 3.3 Implement camera, horizon, and viewport classification

Status: complete on 2026-08-18. The geometry contribution transforms local ENU
directions through the frame-supplied model/view/projection matrix, rejects a
nonpositive local-up component or nonpositive camera depth, and assigns exact
top-left-origin pixels through half-open screen coordinates. It also owns the
inverse-projection solid-angle operation used by the palette stage. A different
clock/location snapshot changes geometry and stage identity; it is not a live
update path.

Transform local directions through the renderer-neutral camera/view snapshot.
Classify every member as unsupported/invalid, below horizon, outside the
half-open viewport, or assigned to one exact top-left-origin pixel. Preserve
the accepted perspective and pixel-boundary conventions.

#### 3.4 Implement the stellar point stage

Status: complete on 2026-08-18. The first standard stage submits exactly 500
points, fetches each canonical direction from the immutable `R32F` member row,
writes `memberIndex + 1` to a cleared `R16UI` viewport target, and uses a
cleared transient depth target plus monotonically increasing canonical depth
so the lowest member wins every collision. Rejected members are clipped before
rasterization. After substep 3.6 binds the validated numerical policy into
shader provenance, the stage source identity for the fixed San Jose observation
is `fnv1a32:4f4ca7a3`.

Create the standard-pipeline point shader with one submitted point per
canonical member. Eligible members write `memberIndex + 1`; rejected members
write nothing. Use the declared deterministic order/depth policy so the lowest
canonical member represents every collided pixel.

#### 3.5 Implement the sparse palette stage

Status: complete on 2026-08-18. The second standard stage covers the fixed
`entryCapacity x 15` address space, writes exact zero for entry zero and every
unused/nonrepresentative candidate, reprojects each candidate, and confirms
its `R16UI` matrix ownership. A selected representative visits all 500 members
in canonical order, converts each same-pixel irradiance channel to radiance by
the exact projected pixel solid angle, and accumulates into its `R32F` scalar.
It depends on the completed point-index output and is the publication-boundary
stage. After substep 3.6 binds the validated numerical policy into shader
provenance, its fixed-observation source identity is `fnv1a32:502a34cb`.

Algorithm32 and Flat32 static checks and all five focused Node contract specs
pass. A focused WebGL2 compile/link run passed before the final split-Julian-
time precision refinement; the environment rejected the requested Chrome
launch for rerunning the post-refinement shader and that final browser check is
therefore still owned by substep 3.8. The full Node suite now reaches 549 of
550 passing specs after substep 3.6; the sole failure remains the unrelated existing
`color.exposure-modifier` binding-list expectation.

Create the entry-major fullscreen palette shader. Entry zero writes exact zero.
Each candidate entry reprojects its member and confirms that the index matrix
selected it as the representative. Unused and nonrepresentative entries write
zero. Representative entries accumulate all same-pixel native-15 packets in
canonical member order and pack the result as binary32.

#### 3.6 Enforce capacity and numerical policy

Status: complete on 2026-08-18. A dedicated generation-ingress policy now
derives and validates the sparse layout before shader construction. It requires
reserved zero, candidate slot `memberIndex + 1`, `entryCapacity = memberCount +
1`, `R16UI` screen indices, entry-major `R32F`, and exactly 15 native channels.
The inclusive `R16UI` boundary accepts 65,535 members and 65,536 entries; the
next member is rejected before stage construction without wrapping,
overwriting, dropping, allocation, or execution.

Both stellar stages publish the same named numerical policy and its canonical
identity. The policy fixes geometry-owned IAU-2000/USNO fixed-observation
projection, top-left row-major half-open viewport assignment, unit-weight
one-pixel point response, lowest-canonical-member collision representation,
canonical-member-order accumulation, exact perspective pixel solid angle from
two spherical triangles, and entry-major binary32 `R32F` packing. The accepted
500-member policy identity is
`sha256:c8f9fd657ac42b6fdc1c531f105fbc79feedf89176415d6dcc190de90c3f4247`.
Policy-bound point and palette source identities are respectively
`fnv1a32:4f4ca7a3` and `fnv1a32:502a34cb`. Algorithm32 and Flat32 static checks
and all eight focused generation-stage specs pass. The full Algorithm32 suite
passes 549 of 550 specs; its sole failure is the pre-existing
`color.exposure-modifier` binding-list expectation described above.

Require `entryCapacity = memberCount + 1`, validate the highest candidate index
against `R16UI`, and reject overflow without wrapping, overwriting, or dropping
members. Identify the projection, collision, accumulation, and binary32 packing
policies used by the generation.

#### 3.7 Derive generation and compatibility identities

Status: complete on 2026-08-18. Production now derives independently addressable
source/policy, fixed-observation/epoch-transform, and camera/projection/viewport
identities, then hashes their exact tuple as the generation identity. View
identity is recomputed from the perspective kind, both 16-value finite
matrices, and positive integer viewport; a caller-supplied identity that does
not match those facts is rejected. Equivalent value snapshots reuse identity,
an observation-only replacement preserves source and view compatibility, and a
view-only replacement preserves source and observation compatibility.

For the fixed 32 by 20 qualification view, the source, observation, view, and
complete generation identities are respectively
`sha256:b7d6447e9b7e29add4f0a24d6d94d9dd26c6f51b1b810538d4859793788087e7`,
`sha256:b2bd1287f80229c6d2d201f28597497d35043aa7247cfd3643c6291d3500de85`,
`sha256:bff251cf07f6a051fa3492c2460e51b6b8e15b1b05c3aee83385f194164e114b`,
and `sha256:db3030438bd3698567598fc600b94504d2e31d7f7c80d24ea768c1d84c4c411a`.
The standard generation request now carries this resolved identity as the
step-4 execution, completion, and consumption boundary.

Derive exact identities from the immutable source table, fixed observation and
epoch transform, camera/projection/viewport snapshot, sparse layout, and
numerical policies. These identities become the step-4 dirty and completion
boundary; a generation may not be consumed under a different identity.

#### 3.8 Qualify the shader logic

Status: complete on 2026-08-18. The production browser qualification compiles
and executes the actual point and sparse-palette shaders against an independent
test-only fixed-observation CPU oracle.
The adjacent production browser spec now compiles and executes the actual point
and sparse-palette shaders against an independent test-only fixed-observation
CPU oracle. Its 32 by 20 control classifies all 500 members, producing 52
occupied pixels from 59 in-view members, including 48 unique pixels and four
collision pixels. The assertions cover exact screen indices, empty pixels,
below-horizon and off-view outcomes, reserved and nonrepresentative zero
entries, every resolved native-15 value, per-channel conservation, binary32
relative residual, and index bounds. Test resources are deleted after readback;
no production allocator or CPU-authored persistent output was added.

Algorithm32 and Flat32 static checks plus all 11 focused Node specifications
pass. The full Algorithm32 suite passes 552 of 553 specifications; its sole
failure remains the pre-existing `color.exposure-modifier` binding-list
expectation. The owner explicitly confirmed that
`npm run test:algorithm32:three` is always authorized. The unfocused browser
inventory exceeded the outer 900-second command limit without reporting a
stellar failure. Its documented focused form then ran real Chrome Headless
151/WebGL2 and passed both stellar specifications in 1.62 seconds, with the
other 12 browser specifications intentionally skipped by the grep filter.

Compare production shader results with the immutable CPU oracle for member
classification, exact pixel assignment, empty/unique/colliding cases, resolved
per-pixel native-15 spectra, conservation, reserved-zero behavior, binary32
packing bounds, and capacity rejection. Compact CPU and sparse GPU numeric
palette indices are not required to match.

#### 3.9 Confirm the step boundary

Status: complete on 2026-08-18. The assembled and tested production surface
contains only immutable source input, geometry GLSL, ordered stage declarations,
capacity/numerical-policy validation, exact identity derivation, Node contracts,
and the adjacent real-WebGL2 browser qualification. A dependency audit found no
contained experiment, atmospheric cache backend, `GpuFieldExecutor`, Three, or
WebGL dependency in the production source owners added by step 3. CPU code does
not construct either persistent output; only the adjacent browser oracle
allocates test resources for readback and deletes them afterward.

No production render-target allocator, active/staging execution, Flat32
activation, atmosphere/Color consumer, contained runner import, rejected dense
field, or CPU matrix/palette construction path was added. Atomic publication,
injected execution-failure preservation, and production transient/persistent
resource disposal begin with step 4 because they require the allocator and
execution lifecycle expressly excluded from step 3.

Finish with assembled and tested generation-stage shader source and
declarations. CPU code may supply immutable source/view inputs and verify
readback but may not construct either persistent output. Do not port
experimental runners or the rejected dense member-by-transport field. Do not
add production render-target allocation, active/staging GPU publication,
Flat32 activation, or the atmosphere/Color consumer during this step; those
belong to steps 4 and 5.

Exit condition: production shader tests reproduce accepted fixed-observation
classification, resolved per-pixel spectra, collision conservation, and packing
bounds against the immutable CPU oracle. Tests separately prove the sparse
member-addressed matrix/palette contract and dirty/completion identity; compact
CPU and sparse GPU numeric palette indices are not required to match. Atomic
execution-failure behavior and production transient-resource disposal remain
step-4 lifecycle gates because step 3 intentionally owns no production GPU
allocator or executor.

### 4. Port generation-stage execution, indexed GPU resources, and lifecycle

Status: complete on 2026-08-18. `StellarScreenPaletteGenerationPass` is a
composer-compatible first-class standard-pipeline pass installed after any
scene-input capture and immediately before the assembled runtime consumer. It
uploads only the immutable member table, executes the qualified point-index
and sparse-palette shaders into staging `R16UI` and `R32F` render targets, and
publishes the pair only after both stages return successfully. Its live camera
snapshot derives exact projection, view-matrix, inverse-projection, and pixel-
viewport identity at the frame boundary. Unchanged identity reuses the active
pair; dirty or changed view regenerates without rebuilding the shader graph.

Allocation and execution failures dispose every partial staging target while
retaining the previous complete pair. A dirty incompatible pair exposes null,
exact-zero-seam bindings until a matching generation commits. Successful swap
disposes the retired pair exactly once. Resize, explicit invalidation, context
loss/restoration, preparation, renderer-state restoration, and idempotent
terminal disposal are implemented on the same participant. The build result
exposes that participant for later runtime lifecycle wiring; no atmosphere/
Color consumer or Flat32 activation was added.

Four focused Node lifecycle specifications cover view identity, exact reuse,
atomic staging visibility, injected second-stage failure, retry, partial-
allocation cleanup, resize, context lifecycle, installer order, joint removal,
and exactly-once disposal. Algorithm32 and Flat32 static checks pass. The full
Algorithm32 Node inventory passes 556 of 557 specifications; the only failure
is the pre-existing stale `color.exposure-modifier` binding-list expectation.
The focused Chrome Headless 151/WebGL2 gate passes all three stellar
specifications. It compiles and executes both generation stages, validates the
sparse outputs against the independent 500-member oracle, performs the live
unsigned-index/native-15 shader fetch, refreshes into a new pair, completes a
real `WEBGL_lose_context` restoration cycle, regenerates, and reproduces the
same resolved spectra before exact cleanup.

Extend the normal rendering-runtime installer/pass path—not `CacheBackend` or
`GpuFieldExecutor`—to allocate active/staging integer index and `R32F` palette
targets for the standard generation stage and bind only the completed active
pair. Preserve exact reuse, dirty/completion identity, frame-stage ordering,
partial-allocation cleanup, stage-boundary swap, context restoration by normal
pipeline regeneration, and exactly-once terminal handling for transient and
persistent resources.

Exit condition: real browser/WebGL2 generation-shader readback and live shader
fetch resolve the same binary32 per-pixel spectra as the CPU oracle for empty,
unique, collision, refresh, and restored cases while independently satisfying
the sparse index/palette layout.

### 5. Integrate the stellar palette into Algorithm32 and Flat32

Status: complete on 2026-08-18. The reviewed stellar source now contributes a
fixed-cost standard-pipeline consumer with one unsigned screen-index fetch and
15 entry-major native-channel fetches. Exact zero exits before palette access,
whole-pixel scene masking exits before either visible contribution, and each
resolved top-of-atmosphere channel is multiplied by the already computed view-
path transmittance exactly once before entering common spectral composition and
the unchanged Color boundary. The assembler declares integer-sampler precision
and orders this contribution after the retained visible-Sun celestial
initializer and before common spectral composition.

Automatic configured-model construction no longer creates, builds, reuses,
binds, or assembles the failed tiled stellar transport cache or its live 500-
member fragment loop. The legacy classes remain preserved for the later step-8
retirement gate, but no active standard runtime path reaches them. The standard
runtime refreshes consumer uniforms from the generation participant immediately
after generation. Format-compatible exact-zero `R16UI` and native-15 `R32F`
fallback inputs make initial, dirty, failed, and restoration frames safe without
inventing a CPU screen product.

`Algorithm32ShaderHandle` exposes view-dirty and WebGL lifecycle forwarding.
Flat32 registers its Algorithm32 attachment with the Three scene context owner,
lets composer resize invalidate and regenerate the pair without rebuilding the
shader graph, pauses on context loss, and on restoration rebuilds all renderer-
owned atmosphere and stellar resources through normal setup before resuming
frames. Spherical/distant mode activates stars; Flat/local and null-roster paths
remain atmospheric-only compatible. Failed transactional replacement still
retains the last valid published mode.

Algorithm32 and Flat32 static checks pass. Thirty-two focused Node
specifications pass. The full Algorithm32 inventory passes all 560
specifications after reconciling the distant-spherical binding-list expectation
with the assembled `color.exposure-modifier` requirement. Focused Chrome Headless
151/WebGL2 passes all four stellar specifications, including assembled consumer
transmittance and scene masking against the CPU oracle. The built Flat32
application passes all five browser specifications in 132.5 seconds, covering
production activation, mode replacement, resize regeneration, real context
loss and complete resource rebuild, resumed rendering, and disposal.

Install the ordered standard-pipeline generation and consumer contributions.
The consumer resolves the index and 15 channels, respects scene masking,
applies atmosphere transmittance exactly once, and enters common Color. Wire
facade creation, prepared configuration, shader assembly, bindings, and Flat32
integration without a sidecar renderer or live-stage catalog loop.

Exit condition: atmospheric-only compatibility is unchanged; enabled stellar
scenes reproduce the accepted lookup/composition oracle and survive application
setup, same-pipeline camera/view refresh, failure, restoration, and
disposal without recompiling the shader graph for ordinary view motion.

### 6. Port the source-local Sun tile and cut over atomically

Status: complete on 2026-08-19. `SunDiskTileGenerationPass` is an ordered
standard-pipeline stage that publishes a compact `R32F` continuous-coverage
tile plus one shared native-15 Sun spectrum. It supports distant angular and
finite physical sources, uses a fixed 16-texel-per-screen-pixel sampling scale
with linear filtering, and evaluates analytic circle/pixel-square overlap in
the generation shader. The physical Sun remains a sphere; this visible-renderer
contract intentionally represents it as a circular screen disk rather than an
off-axis ellipse. Camera orientation therefore changes placement without
changing tile identity, while viewport, focal projection scale, apparent
support, or raster-policy changes regenerate it.

`CelestialGenerationPass` jointly gates the optional stellar pair and required
Sun tile. Installation prepares and publishes both before enabling the scene
capture and shared celestial consumer. Replacement prepares the successor with
the live renderer before committing configuration or disposing the prior
attachment; a failed Sun publication retains the prior complete attachment.
The shared consumer tests the Sun first, treats any positive coverage as its
opaque claim, scales radiance by continuous coverage, applies view-path
transmittance once, and performs the accepted whole-pixel scene mask before
either layer. Automatic construction no longer reaches either failed visible-
Sun cache implementation, while each Sun remains the atmospheric illuminant.

Static Algorithm32 and Flat32 checks pass. The complete Algorithm32 inventory
passes all 563 specifications. Focused Chrome Headless 151/WebGL2 passes all
five generation/consumer specifications, including fractional tile readback
and projected circular-area conservation. The rebuilt Flat32 browser inventory
passes all five application and lifecycle specifications, including atomic
replacement and context restoration. Failure retention, compatible-scale
reuse, FOV invalidation, restoration, and exactly-once disposal also pass in
focused Node coverage.

A post-step visual audit found that the tile pass still projected the distant
Sun when geometry had classified its support as `empty`. This produced the
enlarged white circular object in the San Jose three-hours-after-sunset view;
it was not a stellar point. The pass now publishes an off-screen Sun placement
for `empty` support while retaining the completed tile resource and joint
publication contract. Diagnostics expose the geometry classification. The
night WebGL gate uses the natural San Jose placement and proves that the
remaining nonzero screen pixels equal the one-pixel stellar matrix exactly.

Build the compact disk-local continuous-coverage tile at compatible projection
scale as its ordered standard-pipeline stage, retain one shared native-15 Sun
spectrum, and place/merge it in the celestial consumer over stars. Define
filtering and placement at tile edges. For this port, coverage greater than zero
is the independent opaque claim and continuous coverage only scales Sun
radiance; do not introduce the future fractional-claim composition rule or
dynamically rewrite the stellar palette.
The physical source remains a sphere, while visible rasterization intentionally
uses a circular projected disk. Do not replace that rendering simplification
with an off-axis ellipse or add perspective-conic shape to tile identity.
Reuse across camera orientation; invalidate on incompatible viewport,
FOV/projection, disk support, sampling policy, or scale. Source motion and live
clock updates are deferred. Preserve the existing production Sun as atmospheric
illuminant.

Disable the old visible Sun raster only when the new tile generation publishes
successfully. A failed build retains the prior complete visible-celestial
generation. No frame may receive both implementations.

Exit condition: production support, continuous overlap fractions, projected
energy, transmittance, scene masking, and three-scene images match `000435`;
filtering, scale reuse/invalidation, replacement, restoration, and disposal
also pass.

### 7. Port the experimental Color behavior as a new model

Status: the implemented production Ferwerda candidate passes mechanical gates,
but the owner's daylight, sunset, and stellar visual audit rejects its sky
appearance. The owner reset this step to the contained
`BrunetonSourceLuminanceLiftColorDisplayModel`, now qualified by runs `000466`
and `000467`. Production remains unchanged while the paired captures await
owner review; a production port must be defined as a separate step before this
section can become complete. The rejected `FerwerdaColorDisplayModel` remains
a separately exported production Color owner and the diagnostic history below
explains why it is not a tuning input for the replacement.

Flat32 always constructs Ferwerda. At shader setup the facade obtains its one
condition-wide `brightnessProxy` from `LocalLightLevelCalculator`. The
calculator photopically projects source-owned receiver irradiance after
geometry-owned visible support. It does not inspect elevation, source kind,
camera orientation, framebuffer contents, atmosphere caches, location/time
tables, or named-condition branches. An exact no-light result is raised
to `1e-6 cd m^-2` before the Ferwerda logarithms. The model accepts only
identity exposure, so the port cannot acquire an unqualified exposure-tuning
path.

The post-port San Jose audit additionally corrected the scene bridge:
renderer-linear scene RGB is no longer sRGB-encoded and interpreted as Bruneton
display output. Its channel ratios are retained while source-owned
`sourceBrightness` supplies the explicit relative-RGB-to-luminance scale. This
removes the inverse-Bruneton amplification exposed when rods activate and
prevents absolute atmospheric path radiance from washing out dimensionless
foreground color at noon. Flat32's demonstration lighting also uses zero, not
`0.02`, as its distant-Sun ambient minimum after twilight. The accepted
Ferwerda cone/rod equations are unchanged.

CPU and GLSL share the accepted native-15 E8 projection and retained scene-RGB
composition bridge, then apply exactly one Ferwerda display boundary to the
complete composed stimulus. The shader contains no Sun, stellar, catalog, or
framebuffer classification. Its two Ferwerda runtime uniforms are the facade-
owned adaptation proxy and source-owned scene-luminance scale. Model selection
remains the existing caller-owned `Color` configuration seam.
`BrunetonColorDisplayModel` was not changed by this step and remains comparison
and regression evidence only; it is not selected by either Flat32 mode.

The production CPU controls reproduce immutable-run values for solar noon
(`5070.201700912994 cd m^-2`), sunset (`3632.4668027619023 cd m^-2`), and the
qualified night reference (`0.001 cd m^-2`). Focused Chrome Headless
151/WebGL2 compiles and executes all three configured shaders and matches their
CPU outputs. Both static checks, the rebuilt Flat32 production/test bundles,
all 575 Algorithm32 specifications, and all eight Flat32 browser specifications
pass. The browser inventory executes the production application bundle and
asserts the published runtime state.

Create a separate production Color model for the accepted condition-wide
Ferwerda cone/rod display behavior exercised by immutable runs `000421` and
`000424`. Preserve `BrunetonColorDisplayModel` unchanged as a selectable
baseline. The new model consumes the complete composed native-15 field and its
declared receiver-local brightness proxy; it may share neutral spectral
projection utilities, but it may not inherit a celestial-source branch, modify
stellar or Sun radiometry, or treat the disk and stars separately.

Port only the accepted experimental equations, units, fixed display condition,
and data-derived adaptation boundary. Keep framebuffer-derived adaptation,
temporal smoothing, camera emulation, Moon/diffuse scene-light aggregation, and
ad-hoc tuning deferred. Wire model selection through the existing Color
ownership seam so every pixel still crosses exactly one Color boundary.

Exit condition: focused CPU and shader comparisons reproduce the accepted
Ferwerda controls for noon, sunset, and the fixed night reference; Bruneton
output remains unchanged; both models consume the same pre-Color spectral
composition; and no celestial shader contains model-specific display logic.

#### 7.1 Retained sky-reconciliation rejection record

Status: superseded rejection record. The owner-selected direct-source Bruneton
luminance-lift path and its immediate port decision are owned by
[Immediate Next Step](#immediate-next-step). The subsections below retain the
mechanical Ferwerda work and rejection evidence; they are not the active Color
tuning plan.

Foreground color and renderer-unit luminance are deferred within this same
production-port topic. They are excluded from the following implementation,
tuning, and acceptance gates. The former objective was to keep the sky close to
unchanged Bruneton in bright conditions while progressively increasing the
visibility of dim celestial objects as receiver-local light fades.

Spherical/distant and Flat/local are co-equal production targets. A result that
passes only the San Jose distant-Sun controls is incomplete. Shared
point-presentation, lighting-calculator, Ferwerda, camera-invariance, and Color
contracts may not encode spherical geometry, infinite source distance, solar
time, or a distant-Sun discriminator. Geometry-specific placement and physical
source sampling remain behind their existing interfaces.

##### A. Freeze isolated production controls

Status: implemented on 2026-08-19. Production integration diagnostics now
select the exact `640 x 400`, 78-degree, north-facing/+25-degree-elevation San
Jose control camera and expose separate unchanged-Bruneton and fixed-`0.001 cd
m^-2` Ferwerda Color controls. Ordinary Flat32 still selects live Ferwerda
unconditionally; the reference values exist only behind explicit diagnostic
configuration and in the frozen test fixture. The final unobstructed captures
and state record are under
`tmp/extraterrestrial/production-integration/step7ab-sky-review-v5/`. The
diagnostic explicitly publishes the fixed value through Algorithm32's
facade-owned adaptation binding; a model default alone is insufficient because
the live facade binding supersedes it.

Add production integration controls matching immutable run
`000435-sun-layer-screen-palette-three-scenes`:

- `640 x 400`, 78-degree vertical field of view;
- the same San Jose location, sunset-facing camera, and noon, sunset, and
  sunset-plus-three-hours observations;
- black or masked foreground;
- fixed test-only Ferwerda inputs `5070.201700912994`,
  `3632.4668027619023`, and `0.001 cd m^-2`; and
- separate unchanged-Bruneton and Ferwerda captures.

Record pre-Color sky radiance, transported stellar palette values,
post-Color output, `brightnessProxy`, cone scale, rod scale/blend, visible-star
count, stellar output range, and clipped-star count. Fixed control values are
oracles only and may not become runtime condition branches.

Exit condition: the control can distinguish palette/Color parity from the
live brightness-calculator result and produces repeatable production captures.

##### B. Correct the one-pixel stellar contract

Status: implementation and mechanical qualification complete on 2026-08-19;
owner review of the final capture remains open. The production palette now
multiplies catalog spectral irradiance by the fixed camera-independent
`60999.839486002405` one-pixel presentation scale. Its provenance is the
`1.639348576039236e-5 sr` center pixel of run `000435`, but no live viewport,
field of view, projection, or pixel position participates at runtime. The
geometry shader's projected-pixel-solid-angle functions are removed from this
path. Policy identity is
`sha256:babbd5aedf036080d05b2196a638cd4b40eac75a80e7b02fc1f05ed7148cfd60`.

Real WebGL2 qualification proves GPU/CPU native-15 parity, collision
conservation through the fixed scale, exact one-pixel occupancy, and identical
palette values for an uncollided member at `32 x 20 / 120 degrees`, `64 x 40 /
120 degrees`, and `64 x 40 / 78 degrees`. The exact reference-camera Ferwerda
capture has no exact-white pixel and peaks at byte `207`, versus `235` in
`000435`. It exposes `52` nonblack one-pixel stars over byte range `6..207`,
where `000435` exposed `32` over `43..235`. This faint-end population difference
is recorded for owner review; do not hide it with another stellar gain or
viewport-dependent threshold. The unchanged-Bruneton control remains black at
the same condition. Flat/local `Flat 180` also renders successfully through
the same built production bundle, with a receiver-local brightness proxy of
`963.9629451914163 cd m^-2`.

Remove live projected pixel solid angle from stellar brightness. Generation
continues to project each eligible catalog member to exactly one pixel and sum
all 15 channels for collisions, but the assigned palette spectrum is derived
from catalog data through one camera-independent presentation calibration.
Viewport dimensions and field of view may affect placement, membership, and
collisions but not the member's assigned brightness. Atmosphere transmittance,
scene masking, Sun ownership, and the common Ferwerda equations remain
unchanged.

Qualify first at the run-`000435` reference view:

- all 500 experimental and production source spectra remain exactly equal;
- the night control retains 32 visible one-pixel stars;
- no stellar pixel is exact white;
- the reference peak-byte range remains close to 43 through 235; and
- brightness ordering and spectral color remain catalog-driven.

Then repeat at `320 x 200`, `640 x 400`, `1280 x 800`, and the current host
viewport, with 50-, 78-, and 100-degree vertical fields of view. For each
member that remains visible and uncollided, the assigned palette value must be
identical. Transported/display values may differ only because atmospheric path,
visibility, collision membership, or scene masking changed. Every member still
occupies exactly one raster pixel.

Exit condition: viewport/FOV invariance passes. Final reference acceptance is
pending owner review of the recorded `52`-versus-`32` faint-end difference;
live adaptation work must not compensate for it implicitly.

##### B.1 Ferwerda survival prerequisite for Step C

Status: complete on 2026-08-19. Step C may not use a new adaptation proxy until
the fixed one-pixel catalog signal has demonstrably survived the existing
source-independent cone/rod boundary. The production prerequisite follows all
500 camera-independent catalog spectra through the actual CPU Ferwerda model
at `5070.201700912994`, `3632.4668027619023`, `100`, `10`, `1`, `0.1`, `0.01`,
and `0.001 cd m^-2`. For every condition it requires finite bounded output, no
fully black or fully white star, retention of more than 96 percent of distinct
pre-Color luminance values, pre/post luminance rank correlation above `0.9999`,
and strict ordering of a fixed faint-spectrum `0.01/0.1/1` brightness ladder.
Mean displayed stellar luminance must rise monotonically as adaptation falls;
the matrix explicitly crosses cone-only daylight into greater-than-`0.9999`
rod blend at night.

The complete production GPU capture at the fixed night control is the visual
integration counterpart: it includes one-pixel generation, atmospheric
transmittance, masking, and Ferwerda, and retains 52 distinct nonblack points
without white clipping. Existing focused WebGL tests independently establish
GPU/CPU Ferwerda parity and one-pixel viewport/FOV invariance. This gate proves
survival; it does not erase the separately recorded `52`-versus-`32` and
`207`-versus-`235` comparison differences.

##### C. Define the light-based world-adaptation proxy

Status: paused resumption work. A 2026-08-19 implementation attempt proved
that the existing source-owned `ambientLightScale` is not an acceptable input.
In the distant
source it is a smoothstep of source/up dot product, so consuming it would make
adaptation position-based while merely moving that policy below the lighting
calculator. The candidate reproduced plausible noon and sunset values, but its
first response left `1054.4116389094586 cd m^-2` at sunset plus one hour and
then snapped to zero; a steeper fitted response exposed stars at plus one hour
but washed the remaining twilight field gray/white. Both candidates are
rejected and were removed from production. Their non-overwriting diagnostic
captures remain under `tmp/extraterrestrial/production-integration/` as
`step7c-light-proxy-review-v1`, `v2`, and `v3`.

The next implementation must begin with a unit-bearing receiver-local
environment-light contribution, not a renderer intensity or source-position
curve. `LocalLightLevelCalculator` may aggregate that contribution with direct
light, but the producer must describe actual received light and preserve the
same physical contract for distant/spherical and finite Flat/local sources.

The production transport inventory establishes the reusable input. Both
source/geometry pairings atomically publish the same native-15 cumulative
scattering-density cache through
`cache.sampleCumulativeScatteringDensity`; `Algorithm32Transport` already
integrates that field with view-path transmittance into spectral incoming
radiance. No existing runtime artifact stores receiver-local environmental
irradiance, and the GPU cache has no CPU-readable radiance aggregate.

The selected next seam is therefore a lighting-owned, fixed-cost hemispherical
irradiance reduction executed after cache publication and before Color binding:

```text
E_environment(lambda) = integral over upper hemisphere
                        L_receiver(lambda, omega) cos(theta) d(omega)
brightnessProxy = photopic(E_environment) / pi
```

It reuses the normal cache and path-transport functions for a fixed,
camera-independent quadrature and reduces directly to one native-15 packet.
This is not a framebuffer or camera sky probe: it has no viewport, FOV, camera
orientation, rendered scene, or sampled display pixels, and Atmosphere does
not publish an adaptation value. The lighting calculator owns the physical
irradiance result and its photopic projection. The same reduction shader and
contract apply to spherical/distant and Flat/local; only their existing
geometry/cache contributors differ. A GPU readback is permitted at lighting
state publication, never per frame. CPU `Reference.evaluate` with a resident
CPU scattering cache is the independent oracle, not the live implementation.

The renderer-neutral first slice is implemented. Production now publishes one
frozen 32-direction cosine-weighted upper-hemisphere quadrature with weights
that sum to pi, and `LocalLightLevelCalculator` reduces validated native-basis
spectral-radiance samples to a unit-bearing environmental-irradiance packet.
`ReceiverEnvironmentLightController` owns identity reuse, complete-batch
validation, atomic publication, prior-result retention on failure, and terminal
disposal. Uniform-radiance proof gives exactly `E = pi L` and the expected
photopic `E_v / pi` proxy.

The renderer-specific reduction slice is also complete.
`ReceiverEnvironmentLightGpuReducer` packs the fixed batch into the cache-field
shape, performs one weighted `R32F` array reduction, and bounds readback to the
native-15 result. A real WebGL2 test compares a nonuniform 32-direction batch
with the CPU reducer and passes. Algorithm32 typecheck, that focused browser
gate, and all 581 specifications pass. This gate proves reduction arithmetic
and readback, not atmospheric transport. Next, feed the batch from the active
common path-radiance shader and cumulative-scattering cache for
spherical/distant and Flat/local, establish CPU/GPU transport parity for both,
then proceed to facade binding and visual acceptance.

The common-transport sampler slice is implemented and accepted for
active-cache transport parity. `ReceiverEnvironmentLightTransportShader` assembles the
normal geometry, atmosphere, light-source, cache, and
`Algorithm32Transport.evaluatePathRadiance` contributions with only a fixed
32-direction runtime ingress and native-channel diagnostic output. The matching
GPU sampler performs fifteen 32-by-1 channel draws; the CPU sampler invokes
`Reference.evaluate` for the identical geometry-mapped directions. Static
assembly uses the real spherical/distant and Flat/local owners. A real WebGL2
zero-extinction/constant-density micro-gate matches geometry-resolved path
lengths for both pairings.

That gate exposed and corrected a frame error: the quadrature contract is
receiver-local Z-up, while `mapObserverLocalSceneDirectionToModelDirection`
accepts scene-local Y-up. Both CPU and GPU samplers now apply the explicit
`[x, z, y]` conversion before geometry mapping. The WebGL gate separately
proves that a manufactured nonzero `R32F` resident field survives the cache's
opaque runtime binding and drives the expected transported radiance. The
earlier zero was isolated to applying production interpolation stencils to an
artificial constant field without its complete production domain context, not
to the opaque binding. Full active N4 production-cache interpolation and
CPU-reference transport parity now pass for every one of the 32-by-15 samples
for both pairings. The maximum absolute residual is
`1.262631788082058e-7` for spherical/distant and
`1.5092505500913234e-7` for Flat/local; maximum relative residuals are
`3.406749278603959e-6` and `5.744122862304174e-7`, respectively.

This acceptance is deliberately compositional. The independent CPU
`Reference.evaluate` path samples a readback of the complete active cumulative
field, proving production interpolation and common-path transport, while the
existing sealed binary64-versus-R32F construction gates remain the owner of
cache-construction parity. A separate attempt to construct a fresh independent
binary64 N4 cache in Chrome exceeded the 15-minute harness limit before
sampling and is not counted as a pass. The next step is atomic
controller/facade publication of the accepted sampler-plus-reducer result.

That live publication is now implemented through the installed shader handle.
It supplies the active cache, complete live binding overlay, and model version
to the common-path sampler, uses the GPU reducer, atomically publishes through
`ReceiverEnvironmentLightController`, and updates the facade-owned Ferwerda
binding before preflight. The first review is not accepted. San Jose sunset
plus three hours produces `0.06158098018022135 cd m^-2` and faint visible
stars, while the unchanged Bruneton control remains black. Flat/local Flat 180
produces exact-zero environment adaptation and a white Ferwerda frame. Preserve
both results as diagnostics; investigate the Flat/local zero transport result
and Ferwerda's zero-condition output independently before expanding the time
matrix or tuning any scale.
These results are owned by rejected immutable run
`000436-production-step7c-live-environment-review`, artifact-set SHA-256
`8490600834c188a77b230d1e0a2d8c83789912b711a1e1aaeb11a4fc6966da1a`.
The preceding unnumbered output directory is retained only as a noncanonical
mistake and must not be cited as qualification evidence.
Expanded paired visual evidence is rejected immutable run
`000437-production-step7c-live-environment-review`, artifact-set SHA-256
`fe84671ceaf8b80dd4500d8161970b1d49eca81195ad5ef990b004bf0277d6ae`.
Its camera centers the San Jose sunset direction and the Union Glacier Flat 180
finite source. Each Ferwerda panel is adjacent to its unchanged Bruneton
control. The run exposes a lifecycle defect: every spherical condition reports
the identical `0.06158098018022135 cd m^-2` proxy, so the setup measurement is
not refreshed by subsequent time/config transitions. Correct invalidation and
republication before using this matrix for appearance acceptance.

The `000437` Bruneton panels are superseded as controls. They still used the
later facade exposure modifier inside `BrunetonColorDisplayModel` and installed
the replacement visible celestial pass, including the Sun tile. Pure Bruneton
is restored to the original fixed Figure-1 transform with no adaptation or
exposure uniform. Bruneton diagnostic modes retain Sun illumination/scattering
but set the visible celestial roster to null, excluding both the replacement
Sun disk and stars. Replacement rejected review run
`000438-production-step7c-live-environment-review`, artifact-set SHA-256
`c060bc9ad2249533c4db1276c91b04fa66757e9b2c1fb6dff2e426d7d6691f28`,
hard-fails if a Bruneton page reports celestial generation.

Rejected run `000440-production-step7c-live-environment-review` must not be
used for Ferwerda acceptance. It changed the intended environmental adaptation
measurement by adding the geometry-supported direct-source proxy. That makes
the adaptation track direct source visibility and restores the sunset/horizon
cliff already rejected by the owner. The aggregation is reverted. Retain
`000440` only as evidence of the failed intent change. Diagnose why the
environment-only path reports the implausibly constant
`0.06158098018022135 cd m^-2` across the spherical sequence; do not compensate
with source brightness, source position, named conditions, or Color changes.

Rejected immutable reruns `000442`, `000443`, and `000444` preserve successive
checks of the live-binding, receiver-camera, and cache-reuse hypotheses. All
three reproduce the same spherical constant and Flat/local exact zero;
therefore none is a fixed comparison or appearance evidence. Run `000444` has
artifact-set SHA-256
`a3ec0bdf72cd3d7396e794345b3fe0dbdefcdd74021c366675e46024c6ace5f8`.
The speculative cache-identity change was removed after it failed to alter the
measurement. Receiver-environment sampling remains deliberately independent
of live view-camera bindings. Before another visual rerun, record the complete
32-by-15 transported batch and reduced native-15 irradiance for noon, sunset,
night, and Union Glacier Flat/local, and compare each stage against the CPU
reference. This stage-local evidence must identify the first collapse before
any further production correction.

Immutable diagnostic/comparison run
`000450-production-step7c-live-environment-review` resolves that collapse.
Its verified 26-artifact set has SHA-256
`a8c8feee6355d11441ef6d417f8a5bc2a0520efed0b496a4c43c4c9b29902629`.
The GPU environment shader had been assembled from the complete production
model, including the visible celestial roster, even though this pass measures
diffuse atmospheric transport only. Explicitly excluding visible celestial
contributors from the measurement assembly restores GPU/CPU agreement:
`5596.483031/5596.475964` at noon, `443.740432/443.740470` at sunset,
`0.001708338/0.001708336` at sunset plus one hour, exact zero for both at plus
two and three hours, and `59.045246/59.044989 cd m^-2` for Union Glacier
Flat/local. The raw 32-by-15 batches and both native-15 reductions are retained
in the run.

Run `000450` is numerically successful but visually rejected. Its paired
captures show that correct physical adaptation values still make Ferwerda much
brighter than pure Bruneton at daylight and sunset, and wash the plus-one-hour
ground white. The retained defect therefore lies downstream from light
measurement to the absolute-luminance/display relationship in Ferwerda. Do not
rescale the now-qualified proxy or reintroduce a source-position curve to hide
that Color-boundary problem.

Immutable stage-trace run
`000451-production-step7c-live-environment-review` locates the sunset failure
inside that Color boundary. At the qualified `443.740432 cd m^-2` sunset
adaptation, Ferwerda has cone scale `0.1060447233` and exact-zero rod blend.
The sampled sunset-horizon spectrum projects to linear RGB approximately
`[4082.96, 1197.71, 852.06]`; the cone response is
`[432.98, 127.01, 90.36] cd m^-2`. Dividing each channel by the fixed
`80 cd m^-2` display maximum and hard-clamping produces `[1, 1, 1]`, while
unchanged Bruneton maps the identical spectrum to approximately
`[0.6975, 0.2958, 0.2208]`. Center and side-horizon samples also clip one or
more cone channels. The excessive sunset brightness is therefore neither a
rod contribution, transport error, nor proxy-publication error; it is the
hard per-channel display-maximum clipping in the current Ferwerda mapping.
Define and qualify a source-independent highlight/display-capacity mapping
before changing production Color. Do not alter the cone/rod response or the
qualified environment proxy to conceal the clipping.

### Follow-up: Flat/local Bruneton symmetric horizon lobes

If this paused follow-up is explicitly resumed, first resolve the retained
adaptation lifecycle defect, then diagnose the
bilaterally symmetric bright lobes around the centered finite source in the
pure-Bruneton Union Glacier Flat 180 control from run `000438`. This is a
Bruneton/transport diagnostic, not a Ferwerda tuning input. Preserve the pure
control: fixed Figure-1 Color, no adaptation/exposure uniform, and no visible
celestial generation.

The investigation must distinguish among:

- actual symmetry in the finite-source atmosphere solution;
- mirrored or folded outgoing-direction coordinates;
- cubed-sphere seam or interpolation-stencil duplication;
- source-position/cache-domain symmetry introduced at Flat 180;
- model-to-scene or camera-frame reflection; and
- display-only amplification of a smaller physical radiance feature.

Record native-15 path radiance before Color along a horizontal angular sweep
through the source, including source-centered and equal-angle left/right
samples. Compare CPU `Reference.evaluate`, GPU common transport, cache field
samples, and the final Bruneton RGB. Repeat with a small source azimuth offset:
a physical lobe should move with the source, a camera/frame defect should move
with the view, and a domain/seam artifact should remain locked to cache
coordinates. Include spherical/distant and a non-180 Flat/local condition as
controls. Do not change transport, interpolation, or Color until the first
stage at which the unwanted symmetry appears is identified.

The browser gates are separated by cost. Default `npm run karma:flat32` runs
the cache-independent basic acceptance inventory and skips the full production
scene/cache lifecycle. `npm run karma:flat32:full` is the explicit N4 gate with
a 15-minute inactivity allowance. `npm run test:acceptance:lighting` composes
both typechecks, the Algorithm32 suite (including installed-cache sampler,
GPU-reducer, controller, and facade-publication coverage), the Flat32 build,
and the short browser gate. Full N4 cache reconstruction remains mandatory for
promotion evidence but is no longer the default edit loop.

Replace the rejected direct-source-only proxy with a
`LocalLightLevelCalculator` aggregate of actual receiver-local direct and
ambient/environment lighting contributions. The calculator owns the scalar;
Color receives no position, source kind, time, camera, viewport, or named
condition. Atmosphere continues to own composition and transport and must not
publish an adaptation-specific diffuse-irradiance product. Distant and
finite/local sources use the same contribution contract; finite/local direct
light retains inverse-square behavior.

Before integration, compare candidate light calculations against the accepted
relationship represented by the experimental controls. Noon and sunset must
remain in a similar photopic range even though direct-source visibility changes
greatly, and the result must then fall continuously into a rod-dominant night
range. A scalar ratio applied only to direct source brightness is already
rejected by the recorded noon/sunset evidence.

Run a ten-minute sweep from one hour before sunset through three hours after
sunset. Record the proxy, cone/rod parameters, sky luminance distribution,
visible-star count, and clipped-star count. Require no discontinuity at sunset
or at loss of direct disk support, star emergence by approximately sunset plus
one hour, no washed-out sky transition, and no collapse of stellar brightness
variation. Camera rotation and viewport changes must leave the proxy exactly
unchanged.

For Flat/local, sweep source distance at one, two, and four times a reference
distance. Direct contribution should follow approximately `1`, `1/4`, and
`1/16` without introducing solar-time or horizon policy into Color.

Flat/local is a full acceptance matrix, not a supplementary assertion. Use a
fixed receiver and finite local source to cover:

- the reference source position and radiometry;
- two-times and four-times source distance, proving inverse-square response;
- equal-distance positions in multiple directions, proving that camera or
  world orientation does not change the measured source brightness;
- a source-support/occlusion transition owned by Flat geometry, proving that
  visibility changes the received contribution without a Sun or time branch;
- bright, intermediate, dim, and exact-zero light states, proving continuous
  cone/rod behavior and the declared zero policy;
- camera rotations, 50-/78-/100-degree FOVs, and multiple viewport sizes,
  proving adaptation invariance; and
- the same unchanged Bruneton-versus-Ferwerda sky diagnostics used by the
  spherical controls wherever the Flat/local atmosphere produces sky
  radiance.

If the current Flat/local roster has no stellar family, record that explicitly
rather than claiming a Flat stellar visual result. The one-pixel point-source
palette contract must nevertheless remain geometry-neutral so a later Flat
unresolved source does not reintroduce live-pixel brightness normalization.

Exit condition: one source-agnostic, camera-independent light measurement
passes the complete spherical and Flat/local matrices without named scene
controls, and both modes bind the same Ferwerda adaptation contract.

##### D. Integrate unchanged Ferwerda and validate the sky

Bind the accepted live proxy to the existing Ferwerda adaptation input without
changing the published threshold, cone, rod, display-condition, atmosphere,
Sun, stellar radiometry, or transport equations. Do not add another exposure
curve, stellar mapper, or framebuffer adaptation path.

Sky-only acceptance requires:

- solar-noon output remains close to unchanged Bruneton, retains the sky
  gradient and hue, and has zero rod contribution;
- sunset retains its warm horizon relationship without global darkness or
  clipping;
- dim-object visibility increases progressively as light fades;
- the plus-three-hours reference retains multiple stellar brightness levels,
  no exact-white stars, and a dark sky background; and
- camera rotation, resize, and FOV changes satisfy the adaptation and stellar
  invariants above.

Run these sky gates separately for spherical/distant and Flat/local. A
spherical pass cannot waive a Flat/local failure, and no mode-specific Color
equation or brightness-proxy branch may be introduced to make the matrices
pass independently.

Use the fixed controls first to prove production parity, then the live
calculator to prove the transition. Do not tune adaptation to conceal a
stellar-palette failure, tune stellar calibration to conceal an adaptation
failure, or use foreground appearance as a sky input.

Exit condition: the owner accepts the noon, sunset, plus-one-hour through
plus-three-hours, resize/FOV, camera-rotation, and Flat/local sky controls.

##### E. Complete regression gate

Run Algorithm32 and Flat32 type checks, all Algorithm32 Node specifications,
focused stellar/Ferwerda shader tests, real-WebGL palette readback, Flat32
production and browser-test builds, and the complete Flat32 Chrome inventory.
Update current-state documents with exact results and retain run `000435`
unchanged as the comparison oracle.

Exit condition: every mechanical and visual sky gate passes. Sky acceptance
does not qualify the deferred foreground, and step 8 remains blocked until the
owner explicitly decides the promotion boundary.

### 8. Qualify the integrated production path

Run focused Node, shader assembly, browser/WebGL2, Algorithm32, Flat32, and
application-level regression coverage. Record production file inventories,
commands, environment, numerical comparisons, captures, and derivation in a
new immutable `tmp/extraterrestrial` run. Verify unchanged Bruneton baseline
output, the separate Ferwerda model, and the absence of legacy/double celestial
contributions.

Exit condition: the immutable promotion run is accepted and independently
reverified, required regression commands pass, production and Flat32 operate
through the selected path, and current-state documents identify any remaining
release work.

### 9. Retire superseded production paths

Only after step 8 acceptance, remove production code made unreachable by the
new stellar palette and Sun-tile path. Do not delete historical experimental
sources or evidence. Re-run the accepted production gates after cleanup.

Exit condition: no obsolete visible Sun or dense stellar runtime path remains
reachable, all cleanup is covered, and the accepted implementation has one
owner per responsibility.

## Deferred Beyond This Port

- Moon implementation, fractional-claim palette entries, phase/terminator and
  grayscale albedo;
- full-Moon direct lighting, moonlit-sky ambient/adaptation, and extended-range
  shadow qualification;
- temporal adaptation and animation smoothing;
- all live clock updates, Earth-rotation animation, source motion, and other
  celestial animation;
- qualified-close palette sharing and `Uint8` index rewriting;
- catalog expansion, source-roster mutation, proper motion, and other stellar
  evolution beyond the required catalog-epoch-to-observation-time transform;
- point-spread, seeing, glare, bloom, or artistic visibility treatment;
- ad-hoc Color tuning outside the accepted Ferwerda model; and
- camera emulation.

## Immediate Next Step

Current owner-directed work is a contained nautical-twilight diagnosis, not a
production port. Run `000493` first combined the exact run-`000466`
plus-one-hour scene/product/Color with contained 300-DU ozone, reflected F68,
and W39. Its 585 pre-Color Native-15 probes locate the two lobes in atmospheric
path radiance itself: F68 makes the horizontal peaks nearly mirror-equal but
does not remove their topology, and blue-wavelength energy is positive yet
never dominant. Accepted follow-up run
`000494-san-jose-nautical-twilight-ozone-f68-camera-patch-preview`
(`74f1724881af45188802a178819a8e737bb94f5c3d05c7b3112a18e365b84084`)
holds that configuration fixed and raises outgoing interpolation to W77 density
over the entire rendered camera frustum (`15821` total stored directions,
`256000/256000` view rays on the patch). It leaves `98.0391%` of pixels exact;
all remaining channel changes are one byte, while lobe contrast and horizon
variation increase slightly. The camera-facing outgoing-density hypothesis is
therefore not supported at this tested resolution. Do not port either
diagnostic configuration to production. The subsequent owner direction is the
solar-zenith cache handoff recorded below, not another stellar-port variable.

Accepted orientation diagnostic
`000495-san-jose-nautical-twilight-ozone-f68-front-back`
(`b00b3ab3e0f8641ebf6668a35bb888cf00f098e971400e9a3967502a938fca3c`)
then reuses one exact run-`000493` cache and shader handle for the existing
sunset-facing camera and a camera whose azimuth is exactly 180 degrees behind.
The front capture is byte-identical to `000493`. After excluding the 43 copied
front-camera screen-palette pixels, the near-horizon display-luminance mean is
`17.4655` toward sunset and `2.61116` behind; the corresponding smoothed
horizontal peak-to-center ratios are `4.219` and `1.465`. The strong pair is
therefore source-facing rather than fixed to the screen. Because the outgoing
cache frame is itself source-relative, this control does not distinguish
source physics from a source-relative cache defect; the W77 experiment only
rules down the tested outgoing interpolation density. The minimum lies on the
projected azimuth of the below-horizon Sun, so the current best description is
a source-axis luminance valley with bright flanks, not two independent lobes.
The run alone does not establish whether that valley is physical or a
transport/cache defect. Accepted follow-up run
`000497-san-jose-nautical-twilight-actual-point-j1-control`
(`3460c9e3b4d450757861ad57ef9ae459d0a34b2d52af729611a68638cae82877`)
then holds the ozone/F68/W39/N4 cache and presentation fixed while adding only
actual-point direct first-order branch radiance. Its converged three-ray oracle
closes `97.20795%` of the center/flank deficit. This strongly supports missing
solar-zenith/terminator state, while remaining a hybrid that does not correct
J2--J4. Do not port any diagnostic configuration to production.

The owner has selected the missing spherical solar-zenith state as the next
architecture question. The canonical
[distant-Sun solar-zenith cache design](../algorithm32/cache/solar-zenith-cache-design.md)
records cumulative Native15 branch-integral semantics and the unresolved
origin-indexed versus canonical-prefix coordinate fork. Its
[contained execution plan](../algorithm32/cache/distant-sun-solar-zenith-cache-plan.md)
owns the offline truth solver, checkpoint study, compiler, bounded residency,
and qualification sequence. This is a handoff out of the stellar port; it does
not change production or select a local-Sun field.

### Paused Stellar-Port Resumption Work

The remainder of this section is preserved for when the owner explicitly
resumes the stellar/Color port; it is not the current immediate step.

On resumption, review the accepted contained paired captures from runs `000466`
and `000467`. If the owner accepts their appearance, define a separate production-port step
for `BrunetonSourceLuminanceLiftColorDisplayModel`; do not port by copying the
experimental harness. Production Ferwerda, its diffuse environment proxy, and
its cone/rod/display-capacity mapping are rejected appearance paths and are not
tuning inputs for this model.

The accepted contained Color rule is deliberately small. Receiver-local direct
source irradiance is multiplied by atmosphere transmittance and reduced to
`E_v / pi`. A smooth logarithmic Hermite curve maps `>= 5 cd m^-2` to exact
gamma `1`, `<= 0.001 cd m^-2` to gamma `0.125`, and interpolates between them.
Color first applies unchanged Bruneton Figure-1 RGB, then raises its photopic
luminance to that condition-wide gamma while scaling all three channels
together. Its effective luminance gain is capped at `32768`, so arbitrarily
small nonzero background values cannot receive arbitrarily large relative
gain. It has no rods, cones, scattered-light measurement, source kind,
location, time, camera, viewport, or named-scene branch.

Immutable run `000466-bruneton-source-luminance-lift-spherical-comparison`
(`62f912ac0fdbfac432b58e3c094a76a3a792f6afbda12de2ee6af7a5fddbd250`)
owns six sunset-facing San Jose Bruneton-left comparisons. Noon, sunset minus
30 minutes, and sunset are byte-identical to Bruneton. At sunset plus 30
minutes the new frame peaks at byte `191`; plus one hour retains `32` sampled
stellar pixels with a byte-`130` peak and all `32` RGB values distinct, and plus
two hours retains `30` sampled pixels with a byte-`71` peak and `29` distinct
RGB values. No dark-scene sampled star is exact white. The gain cap reduces the
one-hour frame's mean photopic display level to less than 15 percent of the
30-minute frame. Preserved run `000464` is visually rejected because its
uncapped power lift exposed sub-byte residual twilight as a bright orange field.

Immutable run `000467-bruneton-source-luminance-lift-flat-local-comparison`
(`b6eda32ac4e3f185f23550c11a230b50ccfecab7df2126e692abed8da3ab803a`)
owns Union Glacier Flat/local Flat `0`, `90`, and `180` comparisons pointed at
the Flat-180 bearing. Atmosphere-transmitted direct local luminance decreases
with finite-source distance from `8242.7070` through `292.2412` to
`79.7075 cd m^-2`; all remain on exact gamma one and every new-model capture
is byte-identical to Bruneton. Both terminal runs independently reverify.
Immutable run `000468-bruneton-capped-luminance-lift-supersession-proof`
(`57668f959127627d84d12069567bd56b194b6edc093a31513c78114f74ac5a64`)
verifies runs `000464`, `000466`, and `000467`, records the exact capped-gain
equation and parameters, and owns the rejected-to-corrected one-hour derivation.
