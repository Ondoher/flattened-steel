# Algorithm32 Interface And Public Export Contract

Status: Step 3 complete. This document specifies the selected
declaration-only interface tree, public implementation exports,
implementation-local declaration boundary, and intended `@implements`
relationships for the feature-by-feature reorganization. It describes target
contracts only; Step 3 moves or changes no production source.

Baseline: commit `0fb9be9e625012e92ec1128c362f0f8cd1211d39`, source
identity
`sha256:7d7810f7b69b7516bfdd25058360d62cd4b586176d7692ca90fd5655f1398832`.

## Contract Rules

- `interfaces/` contains ambient behavioral interfaces and the public data
  contracts required to express them. It contains no executable module,
  concrete class, controller, cache, adapter, factory, implementation
  selector, test, or fixture.
- A runtime implementation class lives with its feature and uses one
  class-level `@implements {InterfaceName}` tag for every intentional
  behavioral interface in the manifests below.
- A configuration, request, result, descriptor, immutable value, callback,
  or string union remains a type alias unless it independently defines
  substitutable behavior.
- An interface currently named after its only concrete class is a class-shape
  declaration, not proof of a behavioral abstraction. It moves beside that
  class unless this document assigns it a differently named behavior.
- Public implementation modules and `implementation/index.js` use named
  exports only. Default-export compatibility aliases are not retained.
- Ambient interfaces are type contracts, not runtime exports. Profiles remain
  on `profiles/index.js`; they do not enter `implementation/index.js`.
- The global interfaces describe the built-in Algorithm32 capabilities. This
  reorganization does not publish the private cache, domain, shader, or
  construction machinery as a supported third-party implementation SDK.

## Final Global Interface Tree

```text
src/algorithm32/interfaces/
|-- algorithm32/
|   `-- types.d.ts
|-- atmosphere/
|   `-- types.d.ts
|-- cache-backend/
|   `-- types.d.ts
|-- color/
|   `-- types.d.ts
|-- geometry/
|   `-- types.d.ts
|-- ground-boundary/
|   `-- types.d.ts
|-- light-source/
|   `-- types.d.ts
|-- physical-quantities/
|   `-- types.d.ts
`-- spectral-quantities/
    `-- types.d.ts
```

Do not create an extraterrestrial, stellar, or ocean interface folder during
this reorganization. Stage 12 adds the reviewed celestial capability
interfaces when their implementation transaction begins. Ocean remains a
separately designed stretch goal.

### Global behavioral and value interfaces

| Owner                            | Interface                         | Contract                                                                                                                                                                                              |
| -------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interfaces/algorithm32`         | `Algorithm32Facade`               | `config`, synchronous `setConfig`, `setupShader`, `evaluate`, and idempotent `dispose`                                                                                                                |
| `interfaces/algorithm32`         | `ShaderHandle`                    | Installed shader configuration replacement, resize, lifecycle, and disposal surface already declared by the facade types                                                                              |
| `interfaces/atmosphere`          | `AtmosphereModel`                 | Atmosphere identity, basis, medium/optical-depth/phase sampling, and optional shader contribution                                                                                                     |
| `interfaces/cache-backend`       | `CacheGpuBackend`                 | Opaque renderer cache allocation, compilation, layer submission, binding installation, capabilities, and disposal                                                                                     |
| `interfaces/cache-backend`       | `CacheBuildScheduler`             | Optional safe-boundary asynchronous yield capability accepted by public shader setup                                                                                                                  |
| `interfaces/cache-backend`       | `GpuCacheField`                   | Opaque resident field handle returned by a backend                                                                                                                                                    |
| `interfaces/cache-backend`       | `CacheGpuProgram`                 | Opaque compiled construction-program handle returned by a backend                                                                                                                                     |
| `interfaces/cache-backend`       | `CacheRuntimeBinding`             | Opaque completed-field binding returned by a backend                                                                                                                                                  |
| `interfaces/color`               | `Color`                           | Spectral-to-display conversion, scene composition, and optional shader contribution                                                                                                                   |
| `interfaces/geometry`            | `GeometryModel`                   | View/path, semantic source/receiver-to-model transforms, construction-time light-source configuration, atmosphere-coordinate, cache-stencil, ground-hit, scene mapping, endpoint, and shader behavior |
| `interfaces/ground-boundary`     | `GroundBoundary`                  | Boundary identity/model and directional spectral BRDF evaluation                                                                                                                                      |
| `interfaces/light-source`        | `LightSourceModel`                | Direct lighting, source-path limit, cache-controller creation, and optional shader/scene-light behavior                                                                                               |
| `interfaces/light-source`        | `GeometryConfigurableLightSource` | Additive atmospheric-light capability through which geometry installs readonly geometry-resolved placement before source cache construction                                                           |
| `interfaces/spectral-quantities` | `SpectralBasis`                   | Readonly spectral-basis value and serialization contract; not a public constructor                                                                                                                    |
| `interfaces/spectral-quantities` | `SpectralPacket`                  | Readonly typed spectral-packet value and serialization contract; not a public constructor                                                                                                             |

`interfaces/physical-quantities/types.d.ts` contains the current unit-bearing
public value aliases and no interface. The direct public request, result, and
value aliases currently accompanying each global interface move with that
interface. Implementation-only preparation state, resource records, and test
doubles do not.

### Algorithm32 facade contract split

`interfaces/algorithm32/types.d.ts` owns these public names:

- `Algorithm32Facade`, `Config`, `ConfigSnapshot`, `ExecutionConfig`;
- `ShaderRuntimeConfig`, `ShaderSetupRequest`, `ShaderHandle`;
- `EvaluationRequest`, `EvaluationResult`;
- `ShaderPathSampleDistributionKind`, `ShaderPathSampleDistribution`; and
- `ShaderPerformanceEvent`, `ShaderPerformanceSample`, and
  `ShaderPerformanceCallback`.

The following current facade declarations remain implementation-local:

- `Algorithm32FacadeModelDoubles`;
- `ShaderBuildRequestOptions`;
- `Algorithm32PreparedConfig`;
- `Algorithm32ShaderHandleFacade`; and
- `Algorithm32ShaderHandleState`.

The target `Config` contains `lightSource`, `atmosphere`, `geometry`, a required
`observation` value carrying the externally supplied construction-time instant
and location, optional `groundBoundary`, optional `color`, optional
`execution`, and optional `shader`. It contains no `spectral` property. The facade and built-in
implementations resolve the native-15 basis and standard packets internally.

`observation` has the public readonly `GeometryObservation` type. It contains
`instant`, a canonical ISO-8601 UTC string, and `location`, whose `latitude`
and `longitude` are unit-bearing `Angle` values. Observer height and other
model-shape facts remain properties of the selected geometry implementation;
they are not duplicated in the geographic observation.

### Cache-backend declaration split

The current `gpu-runtime/cache/types.d.ts` row is split during the
`three-cache-backend` transaction. The public interface owner receives
`CacheGpuBackend`, `CacheBuildScheduler`, `GpuCacheField`, `CacheGpuProgram`,
`CacheRuntimeBinding`, `CacheGpuCapabilities`, `CacheLayerSubmission`,
`CacheRuntimeBindings`, and `CacheRuntimeBindingInstallRequest`. The
`gpu-cache-runtime` owner retains assembler, execution, diagnostics, probe,
pass, field-layout, and construction-only declarations. `CacheProbeReader`
remains internal diagnostics behavior even though `ThreeCacheBackend`
currently supplies it.

## Public Runtime Export Manifest

The canonical aggregate import path is
`src/algorithm32/implementation/index.js`. Each export is also available from
the named feature module shown below after that feature migrates.

| Named export                       | Canonical feature module                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `Algorithm32`                      | `implementation/algorithm32/Algorithm32.js`                                   |
| `CanonicalAtmosphere`              | `implementation/canonical-atmosphere/CanonicalAtmosphere.js`                  |
| `BrunetonColorDisplayModel`        | `implementation/bruneton-color/BrunetonColorDisplayModel.js`                  |
| `FlatEarthGeometry`                | `implementation/flat-earth/FlatEarthGeometry.js`                              |
| `SphericalEarthGeometry`           | `implementation/spherical-earth/SphericalEarthGeometry.js`                    |
| `UniformLambertianGroundBoundary`  | `implementation/uniform-lambertian-ground/UniformLambertianGroundBoundary.js` |
| `DistantSunLightSource`            | `implementation/distant-sun/DistantSunLightSource.js`                         |
| `LocalSunLightSource`              | `implementation/local-sun/LocalSunLightSource.js`                             |
| `ThreeCacheBackend`                | `implementation/three-cache-backend/ThreeCacheBackend.js`                     |
| `Algorithm32AtmosphereComposer`    | `implementation/react-three/Algorithm32AtmosphereComposer.js`                 |
| `Algorithm32R3FAtmosphereComposer` | `implementation/react-three/Algorithm32R3FAtmosphereComposer.js`              |
| `Algorithm32Bindings`              | `implementation/react-three/Algorithm32Bindings.js`                           |
| `Algorithm32R3FValues`             | `implementation/react-three/Algorithm32R3FValues.js`                          |
| `Algorithm32ThreeResources`        | `implementation/react-three/Algorithm32ThreeResources.js`                     |

No cache controller, cache field, domain, shader contributor, scene adapter,
ground object, reference executor, transport calculator, utility, constant,
fixture, or implementation-local type enters the public implementation
barrel. `Algorithm32ShaderHandle` is returned as `ShaderHandle` and is not a
caller-instantiated export.

## Public Native Profile Surface

`profiles/index.js` remains a separate value surface and exports exactly:

- `DEFAULT_NATIVE_NUMERICAL_PROFILE`;
- `DEFAULT_NATIVE_PHYSICAL_PROFILE`;
- `DEFAULT_NATIVE_PRODUCTION_PROFILE`;
- `NATIVE_15_SPECTRAL_BASIS`;
- `NATIVE_SOURCE_IRRADIANCE_DENSITY`; and
- `createNativeProductionProfile`.

`createNativeProductionProfile` retains identity and numerical overrides:
`id`, `revision`, `pathIntervalCount`,
`sourceTransmittanceIntervalCount`, `transportIntervalCount`, and
`maximumScatteringOrder`. Its target options remove
`sourceIrradianceDensity` and `albedo`; those are public custom-spectral-data
ingresses and are deferred. The exported basis and source packet are readonly
standard values, not factories.

## Public Constructor Contract Deltas

These are direct target replacements applied only in the owning feature
transaction:

| Implementation                    | Target construction rule                                                                                                                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Algorithm32`                     | Accept `Config` without `spectral`; resolve native-15 internally.                                                                                                                                                                                                                          |
| `CanonicalAtmosphere`             | Accept atmosphere constants but no caller spectral basis; use the native-15 basis.                                                                                                                                                                                                         |
| `DistantSunLightSource`           | Accept intrinsic apparent-size controls but no caller-computed model direction and no caller irradiance packet; use the canonical native-15 source packet and receive its construction-time direction through `GeometryConfigurableLightSource`.                                           |
| `LocalSunLightSource`             | Accept intrinsic finite-source controls but no caller-computed model position and no caller irradiance packet; use the canonical native-15 source packet and receive its construction-time position through `GeometryConfigurableLightSource`. The class performs no coordinate transform. |
| `UniformLambertianGroundBoundary` | Require named material `"grass"` plus optional `id`; resolve the owned native-15 albedo packet internally. Omission from `Config` remains black ground. Snow is deferred until its physical profile is selected.                                                                           |
| Other public implementations      | Preserve their current caller-observable constructor contract during rehome.                                                                                                                                                                                                               |

The closed material type is named `UniformLambertianGroundMaterial` and
currently contains only `"grass"`. Grass uses the retained Bruneton comparison
reference. Snow numerical data and citation are later implementation inputs;
adding it requires an explicit contract expansion and does not authorize
placeholder values. Ocean is not a member.

## Required `@implements` Manifest

### Public and public-returned classes

| Class                             | Required interface tags                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Algorithm32`                     | `Algorithm32Facade`, `Algorithm32ShaderHandleFacade`                                                       |
| `Algorithm32ShaderHandle`         | `ShaderHandle`                                                                                             |
| `CanonicalAtmosphere`             | `AtmosphereModel`, `CacheBuildContributor`                                                                 |
| `BrunetonColorDisplayModel`       | `Color`                                                                                                    |
| `FlatEarthGeometry`               | `GeometryModel`, `CacheBuildContributor`, `CacheTransportDataProvider<FlatCacheTransportDataRequest>`      |
| `SphericalEarthGeometry`          | `GeometryModel`, `CacheBuildContributor`, `CacheTransportDataProvider`                                     |
| `UniformLambertianGroundBoundary` | `GroundBoundary`, `CacheBuildContributor`                                                                  |
| `DistantSunLightSource`           | `LightSourceModel`, `GeometryConfigurableLightSource`; Stage 12 later adds `DistantSunCelestialSource`     |
| `LocalSunLightSource`             | `LightSourceModel`, `GeometryConfigurableLightSource`; Stage 12 later adds `FiniteLocalSunCelestialSource` |
| `ThreeCacheBackend`               | `CacheGpuBackend`, `CacheProbeReader`                                                                      |

The React component and value exports use their component/props or value
contracts. They do not receive artificial service-interface tags.

### Internal implementation classes

| Classes                                                                                                                     | Required interface tag                |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `CubedSphereDirectionDomain`, `Fibonacci34DirectionDomain`, `PairedFibonacci34DirectionDomain`                              | `DirectionDomain`                     |
| `SphericalNativePositionDomain`                                                                                             | `PositionDomain`                      |
| `CachePassAssembler`                                                                                                        | `CacheAssembler`                      |
| `ShaderBuilder`                                                                                                             | `ShaderBuildCoordinator`              |
| `Reference`                                                                                                                 | `ReferenceExecution`                  |
| `CpuDirectionalSpectralField`                                                                                               | `CpuDirectionalSpectralFieldContract` |
| `DistantSunFieldPacking`, `LocalSunFieldPacking`                                                                            | `DirectionalSpectralFieldPacking`     |
| `DistantSunConstructionDomainSelection`, `LocalSunConstructionDomainSelection`                                              | `CacheConstructionDomains`            |
| `FlatScatteringCacheGeometry`, `SphericalScatteringCacheGeometry`                                                           | `CacheTransportDataProvider`          |
| `FlatGeometryCacheModuleProvider`, `SphericalGeometryCacheModuleProvider`, `DistantSunCacheProvider`, `LocalSunCacheSource` | `CacheBuildContributor`               |
| `DistantSunCacheController`, `LocalSunCacheController`                                                                      | `CacheController`                     |
| `DistantSunCache`, `LocalSunCache`                                                                                          | `GpuScatteringCache`                  |
| `DistantSunCpuCache`, `LocalSunCpuCache`                                                                                    | `CpuScatteringCache`                  |

No tag is added to object literals that happen to satisfy
`GpuCacheField`, `CacheGpuProgram`, `CacheRuntimeBinding`,
`CacheBuildScheduler`, `CacheProbeReader`, or `ScatteringOrderKernel`.

## Existing Interface Disposition

The 45 current interfaces have these exhaustive dispositions:

- **Global contracts:** `AtmosphereModel`, `Color`, `LightSourceModel`,
  `GeometryConfigurableLightSource`,
  `ShaderHandle`, `SpectralBasis`, `SpectralPacket`, `CacheGpuBackend`,
  `CacheBuildScheduler`, `GpuCacheField`, `CacheGpuProgram`,
  `CacheRuntimeBinding`, `GeometryModel`, and `GroundBoundary`.
- **Non-public behavioral contracts:** `ShaderBuildCoordinator`,
  `Algorithm32ShaderHandleFacade`, `PositionDomain`, `DirectionDomain`,
  `ReferenceExecution`, `CacheAssembler`, `CacheProbeReader`,
  `DirectionalSpectralFieldPacking`, `CpuDirectionalSpectralFieldContract`,
  `ScatteringOrderKernel`, `ScatteringCache`, `CpuScatteringCache`,
  `GpuScatteringCache`, `CacheController`, `CacheBuildContributor`,
  `CacheConstructionDomains`, and `CacheTransportDataProvider`.
- **Implementation-local class-shape declarations, not `@implements`
  interfaces:** `SpectralModel`, `SharedModel`, `SceneInputCapture`,
  `Fibonacci34DirectionDomain`, `PairedFibonacci34DirectionDomain`,
  `SphericalNativePositionDomain`, `Algorithm32Transport`,
  `ShaderCompatibilityValidator`, `CubedSphereDirectionDomain`,
  `LocalSunShellFactCache`, `LocalSunFieldPacking`,
  `LocalSunConstructionDomainSelection`, `SpectralCalculator`,
  `DistantSunFieldPacking`, and `DistantSunConstructionDomainSelection`.

The audit accounts for all 45 current interface declarations plus the new
`Algorithm32Facade` and `GeometryConfigurableLightSource` behavioral
interfaces. After the 15 class-shape declarations are reclassified, the target contains 32 interfaces before Stage
12 adds celestial interfaces. Class-shape declarations
continue to type their classes from the nearest feature-owned
`types/<ClassName>.d.ts`; they do not remain in the interface count after
migration. `LocalSunFieldPacking`, `DistantSunFieldPacking`, and both
construction-domain classes still receive the generic behavior tags listed
above.

`FlatSynchronizer` has no behavioral interface and is not a public export. Its
existing calculations become private synchronization support under
`implementation/flat-earth/synchronization/`. `FlatEarthGeometry` uses that
support to interpret the observation passed by Algorithm32; no
application or local-Sun class calls it directly.

Flat32 retains selection state, labels, and UI preset behavior, but it stops
producing `directionToSource` and `localSourcePosition`. The current
`LocationTimeController._directionToSource` observer-frame calculation moves
into the spherical-Earth feature closure, and
`LocationTimeController._localSourcePosition` projection moves into the
flat-Earth feature closure. The source-relative radial-distance and
`cacheRadialMaximum` calculation currently in `FlatLocalMode` also moves into
`FlatEarthGeometry`, because it is derived from geometry-owned placement and
selects that geometry's cache domain. `SphericalDistantMode` stops accepting or
forwarding `directionToSource`; `FlatLocalMode` stops accepting, retaining, or
reporting an application-computed `sourcePosition`.

Each concrete geometry receives latitude, longitude, and instant through its
source-configuration request and owns the corresponding placement calculation.
Flat32 may continue choosing an instant from its UI presets, including its
sunrise/noon/sunset labels and manual offsets, but it passes only the resulting
observation and does not calculate any model-space source value. Any genuinely identical solar-time
calculation shared by both geometries may be factored into a specifically
named non-public mechanism during manifest review; it does not remain in
Flat32 and does not become a public interface.

All coordinate transforms are owned by the active `GeometryModel` and mediated
by `Algorithm32`. Callers supply observation state to the facade. Algorithm32
asks the selected geometry to configure the candidate atmospheric light source
through `GeometryConfigurableLightSource`; it does not shuttle the resolved
light-source placement back through the facade. No application adapter or
light-source implementation performs a geometry projection. This Step 3
contract makes no change to celestial source interfaces, placement-state
evaluation, geometry query preparation, or celestial cache ownership; those
remain with the later extraterrestrial production stage.

## Construction-Time Spatial Configuration

For the first implementation, time and location are externally supplied in the
facade observation configuration. A time/location change creates replacement
geometry, atmospheric light source, Algorithm32 facade, scene, and complete
source cache state. The application keeps the prior scene installed until the
replacement finishes, then swaps and disposes the prior scene/facade.

After accepting `Config`, Algorithm32 calls
`GeometryModel.configureLightSource(request)` with the candidate
`GeometryConfigurableLightSource` and observation. Geometry resolves the
canonical readonly light-source placement, retains it for its own calculations,
and installs that same placement directly on the light source. The method has
no placement result for Algorithm32 to relay. `FlatEarthGeometry` may use its
private `FlatSynchronizer` support while performing this work.

Successful atmospheric light-source configuration is a strict prerequisite
for every source-cache build, shader contribution, and scene-lighting build.
Algorithm32 must not request a source cache controller or begin CPU or GPU
source-cache construction until
`configureLightSource` completes. Configuration failure discards the candidate
construction transaction without changing the installed scene.

There is no MVP `ConfigSynchronizable` interface, live synchronization
context, clock subscription, or in-place time/location facade method.
Time/location animation and cache reuse across time changes are deferred from
this reorganization but remain mandatory for MVP completion. Production Stage
14 must provide a cache-transform design that avoids rebuilding the complete
source cache for every tick.

### Exact construction-boundary contract

The public geometry declaration owner defines these data contracts:

```ts
/** Geographic receiver location used for construction-time placement. */
type GeographicLocation = Readonly<{
	/** Geodetic latitude in a supported angle unit. */
	readonly latitude: Angle;
	/** Longitude in a supported angle unit. */
	readonly longitude: Angle;
}>;

/** Observation supplied to geometry during facade construction. */
type GeometryObservation = Readonly<{
	/** Exact canonical ISO-8601 UTC instant. */
	readonly instant: string;
	/** Geographic receiver location. */
	readonly location: GeographicLocation;
}>;

/**
 * Geometry-resolved atmospheric light-source placement kind.
 *
 * - **"distant-direction"** - A normalized direction toward an effectively
 *   infinite source.
 * - **"finite-position"** - A finite source center in model coordinates.
 */
type LightSourcePlacementKind = 'distant-direction' | 'finite-position';

/** Geometry-resolved placement installed on an atmospheric light source. */
type GeometryResolvedLightSourcePlacement =
	| Readonly<{
			readonly kind: 'distant-direction';
			readonly directionToLight: UnitVector3;
	  }>
	| Readonly<{
			readonly kind: 'finite-position';
			readonly position: Position;
	  }>;

/** Request through which Algorithm32 asks geometry to bind one light source. */
type GeometryLightSourceConfigurationRequest = Readonly<{
	readonly lightSource: GeometryConfigurableLightSource;
	readonly observation: GeometryObservation;
}>;
```

The behavioral methods are exact:

```ts
interface GeometryConfigurableLightSource {
	readonly geometryPlacementKind: LightSourcePlacementKind;
	configureGeometryPlacement(placement: GeometryResolvedLightSourcePlacement): void;
}

interface GeometryModel {
	configureLightSource(request: GeometryLightSourceConfigurationRequest): void;
	// Existing GeometryModel behavior remains.
}
```

`DistantSunLightSource.geometryPlacementKind` is
`"distant-direction"`; `LocalSunLightSource.geometryPlacementKind` is
`"finite-position"`. A geometry rejects a placement kind it does not support
before mutating either candidate. Installed placements are normalized:
distant directions are unit vectors and finite positions use meters.

Algorithm32 is the public ingress. It requires an exact canonical timestamp
for which `new Date(instant).toISOString() === instant`, a finite latitude in
`[-90 degrees, 90 degrees]`, and a finite longitude in
`[-180 degrees, 180 degrees)`. Geometry performs model-family compatibility,
placement, and coordinate-transform validation. Validation and normalization
occur once; downstream caches trust the accepted placement.

### Exact constructor deltas

- `DistantSunLightSourceConfig` removes `directionToLight` and caller spectral
  irradiance. It retains intrinsic apparent-size controls and uses the owned
  native-15 source packet.
- `SphericalEarthGeometryConfig` removes `directionToSource`. Its observer and
  model-shape properties remain.
- `LocalSunLightSourceConfig` removes `position` and caller spectral
  irradiance. It retains source identity, radius, reference-distance and
  incident-scale calibration, falloff policy, and source-path interval count.
- `FlatEarthGeometryConfig` removes `sourcePosition` and the
  placement-derived `cacheRadialMaximum`. It adds required
  `localLightSourceHeight: Distance` and `projectionRadius: Distance`.
  `projectionRadius` replaces Flat32's direct use of canonical-atmosphere
  bottom radius and makes the flat map scale an explicit geometry fact.
  Geometry derives the finite model position and selects its radial cache
  extent as the greater of the owned profile minimum and the resolved
  observer-to-source radial distance.

The local-Sun height is a Flat geometry placement fact, not an intrinsic
light-source fact. The local source retains physical body radius; geometry
owns center location and altitude in the selected model.

### Binding, identity, and publication

`configureLightSource` and `configureGeometryPlacement` are synchronous. A
fresh geometry/light-source pair accepts exactly one placement binding. An
exact repeat using the same geometry, light source, and observation is an
idempotent no-op so a non-spatial `setConfig()` replacement can reuse the
installed binding. Any attempt to bind either object to a different
observation, counterpart object, placement kind, or resolved placement is
rejected. Placement-dependent source operations, including cache-controller
creation, direct-light sampling, source-path resolution, shader contribution,
and scene-lighting creation, reject before successful binding; intrinsic
identity and configuration inspection remain available.

The source-cache controller identity contains the light-source object,
geometry object, backend, scheduler, normalized observation tuple, and exact
normalized placement tuple. Cache-generation identity additionally contains
the established atmosphere, ground, spectral, execution, representation, and
physical configuration facts. The first implementation never reuses a source
cache across a different observation or placement.

Construction order is fixed:

1. Algorithm32 validates and stages `Config` and its observation.
2. It asks the candidate geometry to configure the candidate atmospheric
   light source.
3. Only after successful binding may shader preparation request a source cache
   controller or begin CPU/GPU cache construction.
4. The complete cache, shader, runtime bindings, and scene are staged without
   mutating the installed generation.
5. Failure, cancellation, or supersession disposes candidate-owned resources
   and preserves the installed scene.
6. Success publishes the complete candidate atomically, after which the
   retired scene, facade, generation, and owned resources are disposed exactly
   once.

A time or location change requires a fresh geometry, light source, facade,
scene, and cache generation in this tranche. Mandatory production Stage 14
owns later animation and cache-transform interfaces. The private factoring of
shared solar-position calculations is a Step 4 manifest decision and cannot
change any contract above.

## Standards Review

The repository [Type Conventions](../../../standards/types.md#interface-types) and
[JSDoc Conventions](../../../standards/jsdoc.md#implemented-interfaces) already
state the required placement and `@implements` rules. Step 3 introduces no new
authoring convention and therefore requires no standards-document change.

## Step 3 Closure

- Every global interface owner and declaration split is selected.
- Every caller-instantiable implementation has one canonical module and one
  reviewed named barrel export.
- Public profiles remain separate from implementations and expose no custom
  spectral builder.
- Every intended current class-to-interface relationship is enumerated.
- Every current interface is classified exactly once.
- Observation ingress, geometry-to-light-source binding, placement types,
  constructor deltas, cache identity, and atomic publication are exact.
- Flat32 retains no model-space source placement or placement-derived cache
  calculation.
- Celestial source contracts are unchanged and deferred to their production
  stage.
- The first feature transaction can create only the interface slice it needs
  without waiting for unrelated features.
- No executable module is assigned to `interfaces/`.

The interface/export audit and construction boundary are complete. Step 3 is
closed; Step 4 is the next authorized plan item.
