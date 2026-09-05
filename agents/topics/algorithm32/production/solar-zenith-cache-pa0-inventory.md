# Solar-Zenith Cache PA0 Production Migration Inventory

Status: PA0 complete on 2026-08-29. This is a read-only production audit and
frozen migration contract. No production source, build descriptor, test, or
application behavior changed while producing it.

This document owns the PA0 file inventory, replacement boundaries, acceptance
contract, and rollback seams for adopting the qualified distant-Sun
point-local scene cache. Numerical values and contained evidence remain owned
by the [solar-zenith cache design](../cache/solar-zenith-cache-design.md). The
[production-adoption plan](solar-zenith-cache-adoption-plan.md) owns execution
status after PA0.

## Authorities Applied

The audit applies the canonical standards selected by the current
[standards manifest](../../standards/manifest.md), the applicable
[repository overlay](../../standards/overlay.md), and the
[Algorithm32 production boundaries](architecture-boundaries.md). In
particular:

- production recasts the qualified numerical contract; it does not import a
  contained experiment or its runner;
- each executable fact has one canonical owner;
- the obsolete distant-Sun receiver-column contract is replaced directly,
  with no aliases, fallback readers, translation bridge, or old/new runtime
  switch; the replacement remains behind Algorithm32's generic geometry/cache
  interface and does not make spherical or solar-zenith facts universal;
- geometry owns physical coordinates and ray termination, while the concrete
  distant-Sun cache owns its ledger, packing, addressing, and lifecycle;
- renderer resources remain opaque outside the backend;
- generated cache payloads are build artifacts, not canonical source or
  hand-edited `dist` content;
- public ingress validates manifest, identity, shape, bounds, hashes, and
  capabilities once; accepted internal seams trust typed values; and
- numerical acceptance uses predeclared independent evidence rather than
  production agreement or images alone.

Historical Algorithm32-Star material remains immutable and comparison-only.
The contained solar-zenith sources and immutable runs remain evidence and
recast inputs, not production runtime dependencies.

## Frozen Production Target

The production replacement is one source-owned resident distant-Sun cache:

```text
C4(altitude, localSolarZenith, sourceRelativeOutgoingDirection, Native15)
Native48 / Z180 / W27 / reflection-completed F68 / N4 / Q30
```

The stored quantity is cumulative local spectral scattering density
`J1 + J2 + J3 + J4`. The uncompressed R32F Native15 payload is the correctness
oracle. The selected stored form contains 4,058 unique W27 directions plus an
exact `Uint16` logical-W27-to-unique-direction map. The cache lookup is at most
`2 altitude x 2 solar-zenith x 4 direction = 16` spectral taps.

The cache is identified by the complete scene Sun state, atmosphere, geometry,
ground, source, spectral basis, recurrence, numerical domains, scene support,
ledger, codec, precision, compiler, and content hashes. A request resolves
only an exact compatible asset. Missing or incompatible state fails before
publication; it is never clamped to a nearby Sun state and never substitutes
spectral zero.

The first qualified support remains the fixed San Jose observer, complete
camera rotation, and every Geometry-shortened endpoint from zero through the
first object, ground, or atmosphere exit. Broader camera translation or other
locations require separately closed ledgers and assets. One complete cache is
published atomically per exact Sun state. Continuous interpolation and
continuous Sun animation remain deferred.

The import boundary remains generic across both supported production
pairings. Shared Algorithm32 transport supplies a physical sample context:

```text
physical position
atmosphere coordinate
physical outgoing direction
```

The active geometry and concrete cache interpret that context through their
own implementation. Spherical/distant resolves altitude, local solar zenith,
and source-relative W27. Flat/local continues to resolve its z/rho position
stencil and local-source-relative W27. Shared transport does not inspect a
pairing tag, `mu_s`, packed-row ledger, or source kind, and the generic
interface does not require Flat/local to implement a solar-zenith dimension.

## Current Production Flow And Defect Boundary

Current spherical/distant production stores a rectangular receiver-column
field:

```text
Native48 altitude x W27 outgoing direction x Native15
```

Construction places every altitude node on the observer-up radial column.
Runtime geometry resolves altitude and source-relative W27 stencils, and
`DistantSunCache` samples the rectangular field. The missing coordinate is the
actual path point's local solar zenith. Current runtime construction is
therefore not merely a different packing of the selected field; it constructs
a different field.

The production cutover retains this outer flow:

```text
Geometry endpoint
  -> Algorithm32 live view integration
  -> actual path point
  -> source-specific cumulative cache query
  -> Native15 path radiance + transmittance
  -> existing scene/celestial composition and display boundary
```

It replaces only the distant-Sun cache coordinate, resident representation,
construction source, and the selected view quadrature. Ground and object
intersections continue to shorten the ray before integration. Local Sun,
Flat geometry, atmosphere ownership, celestial caches, scene capture, and
color remain outside the numerical replacement.

## Production Owner And File Inventory

### Direct contract and transport replacement

| File                                                                                     | Current responsibility                                                            | PA disposition                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/algorithm32/interfaces/algorithm32/types.d.ts`                                      | Execution interval count and optional path-sample distribution.                   | Add the selected quadratic-near-observer distribution identity; Q30 becomes the spherical/distant production selection without creating a second transport API.                                                                                                                                           |
| `src/algorithm32/interfaces/geometry/types.d.ts`                                         | Physical view endpoint plus cache position/direction stencil contracts.           | Replace the shared runtime sampling seam with a pairing-neutral physical sample context. Each geometry retains its concrete coordinate reconstruction. Do not add solar-zenith facts to the generic interface and do not add a parallel point-local method beside the old receiver-column method.         |
| `src/algorithm32/atmospheric-transport/types.d.ts` and `types/Algorithm32Transport.d.ts` | CPU/runtime transport and sample-distribution contracts.                          | Recast the pairing-neutral physical cache-sample context and the Q30 distribution as canonical ambient contracts. The context is equally valid for spherical/distant and flat/local.                                                                                                                      |
| `src/algorithm32/atmospheric-transport/Algorithm32Transport.js`                          | Shader view transmittance, one cache lookup per path node, and path accumulation. | Retain one source/geometry-neutral loop and Geometry endpoint; select 30 intervals for the adopted spherical/distant profile with `t_i=t_end(i/30)^2`, distance-midpoint evaluation, and exact segment weights. Pass the same physical sample context to either concrete cache; do not branch on pairing. |
| `src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js`                   | Binary64/reference view integration.                                              | Mirror the same endpoint and Q30 rule and query the source-specific CPU cache through the physical packet. It remains a reference/evidence surface, not a production cache builder.                                                                                                                       |
| `src/algorithm32/profiles/native-15/native-15-profile.js` and `types.d.ts`               | Native numerical defaults and profile identity.                                   | Make the adopted Q30 rule an explicit profile fact. A change in interval count or distribution changes profile/cache compatibility identity.                                                                                                                                                              |

The existing tangent-density adaptive choices are separate production
policies. They neither satisfy nor alias the qualified Q30 rule.

### Spherical geometry owners

| File                                                                                             | Current responsibility                                                                                                    | PA disposition                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js`                       | Source placement, actual spherical position, ground/top termination, atmosphere coordinate, and cache stencil delegation. | Retain termination and actual position. Expose actual altitude, local radial up, `mu_s`, and source-relative outgoing framing through the direct replacement query contract.                                                               |
| `src/algorithm32/implementation/spherical-earth/SphericalScatteringCacheGeometry.js`             | Native48 interpolation and observer-column source/W27 frames.                                                             | Retain Native48 and W27 executable domain math behind the generic geometry boundary; replace observer-column assumptions with actual-point local-Sun framing. Do not map packed rows here because the scene ledger belongs to the cache.   |
| `src/algorithm32/implementation/spherical-earth/SphericalGeometryShaderContributor.js`           | Shader altitude reconstruction and W27 stencil resolution.                                                                | Retain precision-preserving ground-relative altitude reconstruction. Add actual-point local solar zenith/source frame; publish physical coordinates, not resident row addresses.                                                           |
| `src/algorithm32/implementation/spherical-earth/SphericalGeometryCacheModuleProvider.js`         | Runtime GPU construction rays and rectangular receiver-column lookup.                                                     | It is not reusable unchanged. Recast only its spherical ray/visibility/atmosphere-boundary formulas into the offline compiler. Remove the distant receiver-column construction use at PA7; preserve any still-used non-distant capability. |
| `src/algorithm32/implementation/spherical-earth/types.d.ts` and adjacent class declaration files | Spherical configuration and class surfaces.                                                                               | Replace affected query/configuration types directly and document units and failure behavior.                                                                                                                                               |

### Distant-Sun cache owners

| File                                                                                               | Current responsibility                                                                                                | PA disposition                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/algorithm32/implementation/distant-sun/DistantSunLightSource.js`                              | Configured source identity, source direction, cache-controller factory, CPU diagnostic entrypoints, and shader facts. | Retain source physics and factory ownership. Include exact scene-cache asset identity/resolver input in the configured source/model boundary. Runtime cache creation becomes asset-backed.                         |
| `src/algorithm32/implementation/distant-sun/cache/DistantSunCacheController.js`                    | Runtime GPU plan creation, reuse, serialized generation, cancellation, atomic publication, and disposal.              | Retain generation, reuse, failure preservation, publication, supersession, and disposal semantics. Replace runtime recurrence execution with exact manifest resolution, load, validation, upload, and publication. |
| `src/algorithm32/implementation/distant-sun/cache/DistantSunCache.js`                              | One R32F binding and two-position/four-direction rectangular lookup.                                                  | Own the resident payload, ledger, exact logical-to-unique direction map, multiple opaque bindings, 16-tap lookup, out-of-support failure, and resource disposal.                                                   |
| `src/algorithm32/implementation/distant-sun/cache/DistantSunConstructionDomainSelection.js`        | Native48/F68/W27/Native15 rectangular construction domains.                                                           | Split reusable executable domain owners from scene inventory. The runtime cache consumes manifest identities; the offline compiler consumes the same canonical domains plus Z180 and the packed ledger.            |
| `src/algorithm32/implementation/distant-sun/cache/DistantSunFieldPacking.js`                       | Direction-fastest rectangular `(direction, position, wavelength)` offsets.                                            | Replace distant-scene resident addressing with `(uniqueDirection, packedRow, wavelength)` plus the exact logical-W27 index. Do not change local-Sun packing.                                                       |
| `src/algorithm32/implementation/distant-sun/cache/DistantSunCacheProvider.js`                      | CPU recurrence, GPU owner modules, runtime controller creation, and source-specific field allocation.                 | Retain CPU/reference entrypoints only where required for independent conformance. Move the selected GPU recurrence into the production-owned offline compiler recast; runtime no longer invokes it.                |
| `src/algorithm32/implementation/distant-sun/cache/types.d.ts` and adjacent class declaration files | Distant cache fields, plans, controller, requests, and diagnostics.                                                   | Add canonical manifest, ledger, asset, codec, compatibility, load, resource, and lifecycle types. Remove retired rectangular/runtime-build shapes in the same producer-consumer changes.                           |
| `src/algorithm32/implementation/distant-sun/cache/consts.js`                                       | Source cache constants and identities.                                                                                | Own schema/codec identities only when executable consumers use them; descriptors remain diagnostic and cannot drive indexing.                                                                                      |

New production owners are required for the packed-row ledger, exact scene
manifest acceptance, immutable asset loading, and seam-decoded addressing.
They belong in the distant-Sun implementation closure, not a generic utility
folder. Class files remain one class per file and supporting complex contracts
remain ambient types in the nearest included `types.d.ts`.

### Generic GPU and renderer infrastructure

| File                                                                                                 | Current responsibility                                                                             | PA disposition                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/algorithm32/gpu-cache-runtime/types.d.ts`                                                       | R32F construction fields, plans, artifacts, and bindings.                                          | Keep render-target construction fields R32F. Add a distinct immutable resident-asset upload contract rather than widening executable construction indexing through metadata.                                           |
| `src/algorithm32/gpu-cache-runtime/CacheGpuExecutor.js`, `GpuFieldExecutor.js`, and `CacheValues.js` | Generic runtime construction graph.                                                                | Unchanged for local Sun and other GPU builders. They are not the runtime scene-cache loader. Reuse of their deterministic pass machinery by the offline compiler is optional and must not retain runtime construction. |
| `src/algorithm32/interfaces/cache-backend/types.d.ts`                                                | Opaque R32F allocation, execution, and runtime binding.                                            | Add typed immutable texture upload/binding support for R32F values and the R16UI logical-direction map, with capability and byte-shape checks. Raw Three resources remain private.                                     |
| `src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js` and declarations           | WebGL2 allocation, upload during pass execution, opaque bindings, install, readback, and disposal. | Add state-neutral immutable asset upload and integer-texture binding/install. Retain capability checks, context ownership, diagnostic readback, and exact disposal.                                                    |
| `src/algorithm32/rendering-runtime/ShaderBuilder.js`                                                 | Attachment-owned controller creation, cache await, candidate cleanup, and result assembly.         | Structurally reusable. It continues to await one complete cache and never sees a manifest payload, ledger internals, or raw texture. Tests must prove failed asset preparation preserves the prior installed result.   |
| `src/algorithm32/rendering-runtime/ShaderAssemblyPreparer.js`                                        | Collects cache contribution with geometry/source/transport.                                        | Structurally reusable; consume the replacement cache contribution only.                                                                                                                                                |
| `src/algorithm32/rendering-runtime/three/ShaderRuntimeInstaller.js`                                  | Collects and installs opaque binding groups.                                                       | Existing multi-binding collection is reusable; extend accepted value keys/formats without exposing textures.                                                                                                           |
| `src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js`                                       | Per-frame runtime binding and captured-scene input.                                                | No numerical change. Verify bindings remain stable across frames and after restoration.                                                                                                                                |

The current `CacheFieldStorage` is deliberately not changed into a union that
lets integer asset metadata masquerade as an executable R32F render field.
Construction storage and immutable resident asset storage are separate typed
contracts.

The corresponding Flat/local owners remain implementations of the same
generic import contract:

```text
src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js
src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js
src/algorithm32/implementation/flat-earth/FlatGeometryShaderContributor.js
src/algorithm32/implementation/local-sun/cache/LocalSunCache.js
src/algorithm32/implementation/local-sun/cache/LocalSunCpuCache.js
```

They require compatibility edits and regression tests if the shared method
shape changes, but they do not acquire Z180, scene-Sun assets, Q30, or the
distant-Sun packed-row ledger. This is one generic interface with two concrete
implementations, not a universal cache layout.

### Application, build, and asset consumers

| File                                                                                          | Current responsibility                                                                        | PA disposition                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/flat32/SphericalDistantMode.js`                                                          | Creates spherical geometry, distant Sun, Native15 profile, and N4 facade for an observation.  | Resolve the exact scene-cache asset identity and select Q30. It must not silently use the previous runtime cache when no matching asset exists.                                                                                                                                                           |
| `src/flat32/Algorithm32Runtime.js`                                                            | Backend, scheduler, setup, preflight, context restoration, publication, and ordered disposal. | Retain candidate isolation and publication. Replace construction-yield diagnostics for the distant asset path with load/upload diagnostics while leaving local construction scheduling intact.                                                                                                            |
| `src/flat32/ModeController.js`                                                                | Whole-mode candidate preparation and atomic publication.                                      | Retain as the application rollback/preservation owner. Unsupported or failed assets do not publish a mismatched mode.                                                                                                                                                                                     |
| `src/flat32/LocationTimeController.js`, `Flat32Application.js`, `consts.js`, and `types.d.ts` | Three locations, time presets, and arbitrary hour/minute offsets.                             | These controls currently produce more exact spherical Sun states than the qualified asset set. PA6/PA7 may claim only states present in the production support manifest. Exposed unsupported states must fail explicitly or be represented accurately as unavailable; they may not select a nearby cache. |
| `builds/flat32.json`                                                                          | Flat32 source, browser-test, and copied-resource output.                                      | Declare the cache manifest and payload deliverables explicitly. Runtime URLs derive from emitted `dest`; source-tree and `tmp` paths are forbidden.                                                                                                                                                       |
| `polylith.json` and `src/flat32/index.js`                                                     | Build selection and runtime activation.                                                       | Expected unchanged unless the final asset packaging mechanism requires an explicit selected build input. Inclusion and activation must be verified separately.                                                                                                                                            |

Cache payloads are generated deliverables and must not be committed merely to
make a local source URL work. PA2 must emit a content-addressed production
artifact package. The selected deployment/build input then copies that package
through an explicit descriptor. It may be served as ordinary static content
and does not require a runtime cache-building server. `tmp/extraterrestrial`
remains evidence storage and cannot become a production asset root.

## Contained-To-Production Recast Map

| Contained owner                                    | Qualified behavior                                                                     | Production treatment                                                                                                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sceneCacheContract.js`                            | C4 semantics, domains, support, scene identity.                                        | Recast into canonical ambient production contracts and executable domain owners; do not import it.                                                                                              |
| `buildInventoryLedger.js`                          | Interpolation-closed per-altitude Z180 rows and packed addressing.                     | Reimplement as a production offline compiler owner with analytic and dense closure proofs. The emitted ledger is validated at runtime but remains the indexing authority of `DistantSunCache`.  |
| `PointLocalGpuRecurrence.js`                       | Actual-point Native15 N4/F68 construction and boundary policy.                         | Recast into the production-owned offline compiler using production atmosphere/source/geometry/domain facts. No copied experiment class layout or runtime import.                                |
| `PointLocalSceneCacheRuntime.js`                   | Actual altitude, local solar zenith, source-relative direction, and 16-tap CPU lookup. | Recast across spherical geometry plus `DistantSunCache`; use production W27, not contained W39 helpers.                                                                                         |
| `P6Quadratic30QualificationRenderer.js` and traces | Qualified Q30 view integration.                                                        | Recast into shared production CPU/shader transport with an explicit distribution identity.                                                                                                      |
| `runP9W27AssetBrowser.js`                          | Complete W27 asset emission.                                                           | Replace with a deterministic production asset compiler command and content-addressed manifest.                                                                                                  |
| `runP9LifecycleBrowser.js`                         | Load/upload/publication/replacement/restoration/resource evidence.                     | Express through the existing production controller, backend, runtime, and ModeController lifecycle.                                                                                             |
| `runP10SeamDedupBrowser.js`                        | Exact 4,374-to-4,058 direction codec and GPU probes.                                   | Recast as production asset encoding plus cache-owned decode. Preserve uncompressed oracle output separately.                                                                                    |
| B1 and six-scene runners                           | Independent external and visual qualification.                                         | Retain as isolated evidence lanes that measure production against sealed external/control inputs. They may import production only to measure it, never to generate their independent authority. |

## Asset And Failure Contract

One manifest identifies exactly one complete cache and contains at least:

- schema, semantic quantity, units, basis, and bin semantics;
- scene Sun direction and source radiometric identity;
- atmosphere, planet, ground, recurrence, order, and boundary identities;
- Native48, Z180, F68, logical W27, unique W27, Native15, and Q30 identities;
- scene support and packed-row ledger identity;
- uncompressed-oracle and exact-seam-derivative parent identities;
- every payload byte length, scalar count, texture shape, format, and SHA-256;
- compiler source/tool identity and complete derivation chain; and
- supported backend requirements and exact resource-byte ledger.

Manifest acceptance is a genuine external ingress. It rejects malformed,
unknown, unsupported, hash-mismatched, non-finite, negative, non-bijective,
out-of-bounds, or incompatible material before GPU publication. Later lookup
uses accepted executable structures directly; it does not repeatedly validate
descriptive metadata.

Failure policy is frozen:

- missing or incompatible asset: reject candidate setup;
- cancellation or supersession: dispose candidate host/GPU resources and
  publish nothing;
- partial upload or context loss: preserve the last complete cache and rebuild
  candidate resources from the retained validated asset;
- successful replacement: publish the complete binding group, then dispose
  the replaced cache;
- unsupported lookup: fail a proof/test or candidate setup; never clamp to a
  retained zenith row or return zero; and
- disposal: release payload staging, unique-value texture, index texture, and
  bindings exactly once in owner order.

## Frozen Verification Lanes

### Contract and deterministic Node lane

At minimum, update or add focused adjacent Jasmine coverage for:

- `interfaces/algorithm32`, geometry, cache-backend, GPU-runtime, atmospheric
  transport, native profile, and distant-cache ambient contracts;
- `Algorithm32Transport` Q30 endpoints, midpoint positions, weights, zero and
  shortened segments, and CPU/shader rule agreement;
- `SphericalEarthGeometry`, `SphericalScatteringCacheGeometry`, and
  `SphericalGeometryShaderContributor` actual-point altitude, `mu_s`, local
  frame, Native48, W27 face/edge/seam, terminator, and ground boundary cases;
- `DistantSunCache` 16-tap addressing, exact seam decode, ledger boundaries,
  missing-row rejection, all Native15 channels, and disposal;
- `DistantSunCacheController` exact reuse, incompatible rebuild, cancellation,
  supersession, failure preservation, atomic publication, restoration, and
  resource diagnostics;
- `ThreeCacheBackend` R32F/R16UI asset upload, capability rejection, binding
  install, renderer-state restoration, readback, and disposal;
- `ShaderBuilder` and runtime installer opaque multi-binding flow and failed
  candidate cleanup; and
- `SphericalDistantMode`, `Algorithm32Runtime`, `ModeController`, and Flat32
  state-to-asset identity behavior.

Existing files affected by those contracts include:

```text
src/algorithm32/atmospheric-transport/_tests/algorithm32-transport.spec.js
src/algorithm32/atmospheric-transport/_tests/scattering-density-transport.spec.js
src/algorithm32/atmospheric-transport/spectral/_tests/SpectralCalculator.spec.js
src/algorithm32/implementation/algorithm32/_tests/algorithm32-facade.spec.js
src/algorithm32/implementation/distant-sun/_tests/distant-sun-light-source.spec.js
src/algorithm32/implementation/distant-sun/cache/_tests/DistantSunCache.spec.js
src/algorithm32/implementation/distant-sun/cache/_tests/DistantSunCacheController.spec.js
src/algorithm32/implementation/distant-sun/cache/_tests/DistantSunFieldPacking.spec.js
src/algorithm32/implementation/distant-sun/cache/_tests/DistantSunGpuOwnerModules.spec.js
src/algorithm32/implementation/spherical-earth/_tests/spherical-earth-geometry.spec.js
src/algorithm32/implementation/three-cache-backend/_tests/ThreeCacheBackend.spec.js
src/algorithm32/rendering-runtime/_tests/shader-builder-assembly.spec.js
src/algorithm32/rendering-runtime/_tests/shader-builder-runtime.spec.js
src/algorithm32/shader-assembly/runtime/_tests/DistantSphericalOwnerShaderContributions.spec.js
src/flat32/_tests/flat32-application.browser.js
src/flat32/_tests/mode-controller.browser.js
```

Flat/local specs are regression consumers of the shared direct replacement;
they must remain green but do not adopt Z180 or Q30 by implication.

### Real WebGL and application lanes

- `npm run test:algorithm32:three` proves actual R32F/R16UI allocation,
  upload, exact decoded probes, opaque binding installation, context
  restoration, and cleanup on a real browser renderer.
- `npm run test:ui:flat32` proves a manifest-backed spherical/distant mode,
  ordinary endpoint scene capture, ground and atmosphere endpoints, failed
  replacement preservation, and direct-scene fallback.
- The full-cache browser selection remains explicit; a reduced field may prove
  mechanics but cannot satisfy resource or final numerical gates.

### Independent numerical and visual lanes

Thresholds are frozen before production candidate inspection:

- Direct40 B1 aggregate RMSE at or below
  `11.820391604126252 mW m^-2 sr^-1 nm^-1`;
- matched Native15 B1 at or below the previous model's
  `12.586323005727962` score;
- exact decoded equality with the uncompressed Native15 oracle;
- Q30 sparse magnitude error at or below `2%` and normalized spectral-shape
  error at or below `0.002` against the retained high-resolution integration;
- exact Geometry endpoint class and length for atmosphere, ground, and
  object-shortened rays; and
- all six B1 figures and all requested scene renders emitted regardless of
  gate outcome.

The production lane also compares sealed contained outputs at declared sparse
physical probes, but contained agreement does not replace B1 or the
independent high-resolution quadrature reference.

### Resource and lifecycle lane

The logical bounds remain named-hardware evidence, not universal limits:

- largest uncompressed declared scene: `162,187,920` bytes;
- largest projected exact-seam scene: `150,479,388` bytes including its
  logical-direction index;
- accepted nautical exact-seam payload: `150,235,908` bytes;
- atomic replacement: two resident complete caches;
- replacement plus retained host staging: three complete payload equivalents;
  and
- opaque driver overhead reported only when actually observable.

Qualification records load, validation, host staging, upload, first frame,
steady frame, restoration, transition, and disposal on named hardware.

### Repository gates

Before selection:

```text
npm run typecheck:algorithm32
npm run typecheck:flat32
npm run test:algorithm32
npm run test:algorithm32:three
npm run test:ui:flat32
npm run build:flat32
git diff --check
```

Affected source is formatted through the pinned repository formatter. Passing
spec counts are recorded with the exact command and environment but do not
stand in for physical evidence.

## Replacement And Rollback Boundaries

PA1 through PA4 prepare a direct replacement of the distant-Sun
receiver-column implementation while preserving one pairing-neutral
Algorithm32 cache/geometry import contract. The accepted production state
never exposes both receiver-column and point-local distant-Sun APIs or a
selectable old/new distant strategy. Shared producers, spherical/distant and
flat/local consumers, types, and tests change together; retired shapes are
deleted in the same integration change.

Rollback is provided by:

- the pre-adoption Git/release artifact;
- immutable contained and production qualification records;
- atomic runtime candidate publication, which preserves the last complete
  installed cache during failed preparation; and
- application direct-scene fallback when no atmosphere runtime has ever been
  published.

Rollback is not a runtime feature flag. After PA7 selection, no receiver-column
implementation remains reachable in production. Before PA7, candidate work
may live on an unselected development branch, but a shipped build contains one
strategy.

## PA0 Findings And Readiness

PA0 found no architectural roadblock to PA1. The existing controller,
ShaderBuilder, runtime installer, ModeController, and opaque-backend lifecycle
provide the correct outer seams. The numerical and storage internals are a
direct distant-Sun replacement, not an extension of the receiver-column
tensor. The shared import seam remains pairing-neutral and supports the
existing flat/local implementation without importing solar-zenith coordinates
into that implementation.

Three constraints are now explicit:

1. the offline compiler must be a production-owned recast and cannot be a
   runtime import from `scripts/extraterrestrial`;
2. production support is the exact set of manifest-backed Sun states, so the
   current arbitrary Flat32 globe offsets cannot be claimed supported until
   matching assets exist; and
3. asset packaging must be an explicit content-addressed build input rather
   than committed generated output or a `tmp` dependency.

The owner subsequently authorized PA1 and PA2. Their current execution status,
exact rebuild identities, and next step are owned by the
[production-adoption plan](solar-zenith-cache-adoption-plan.md); this PA0 audit
remains the frozen migration and acceptance contract.
