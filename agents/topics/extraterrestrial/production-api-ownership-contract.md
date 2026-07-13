# Extraterrestrial Production API And Ownership Contract

Status: Step 1 reviewed contract, complete, reconciled to production checkpoint
`c70baca629aef61c2c28c57595fa43d3af9d5047`, and amended through 2026-08-22
for the mandatory Flat/local finite-Sun family, additive celestial capability
interfaces, separate source-family cache controllers, neutral GPU-field
execution, Step 6.2 live-composition request boundaries, and the retained
stellar screen-generation ownership/refresh decisions. The active distant-Sun
branch-integrated cache research is separately owned and does not amend this
production contract. This document owns the API, ownership, invalidation,
lifecycle, and candidate-delta decisions for the
extraterrestrial production integration. It is an implementation input to the
[Production Integration API Plan](production-integration-api-plan.md), not
authorization to copy candidate files into production.

The public API, behavioral-interface, physical authority, invalidation, and
lifecycle decisions in this contract remain current. The completed Algorithm32
feature reorganization has been reconciled into the owner table below; those
paths are the production targets for Step 3. A later path or behavior change
requires an explicit contract amendment.

The 2026-08-10 reconciliation adds one mandatory normalization rule: the
public legacy facade name remains `LegacyConfig.celestialSources`, while the
complete retained execution contract is
`Algorithm32ExecutionProfile.models.celestialSources`. Explicit-profile
configuration has no duplicate top-level roster. `SharedModel` exposes the
profile-owned value for convenience, but neither `ConfigSnapshot` nor another
model snapshot becomes an executable second authority.

## Scope And Evidence

The reviewed evidence is the closed Stage 12 baseline-to-candidate delta under
`scripts/extraterrestrial/`. A path-sorted SHA-256 audit reproduces exactly 48
changed files: 26 additions and 22 modifications. The audit identity over each
row's status, relative path, baseline hash, and candidate hash is
`sha256:5c93c0d10a40c758ef3bba6f50d05254b82014f3e2a3e40540c1dfdfda2ad9ea`.

The candidate proves behavior; it does not determine production paths, public
names, class boundaries, ambient-type placement, or export shape. Production
must conform to the reconciled Algorithm32 tree and current repository
standards. No experiment runner, fixture, generated artifact, default export
alias, descriptor-era helper, or candidate-only diagnostic API is promoted.

Production requires two distinct capability families. The first implementation
tranche is `spherical-sun-stars-radial-v1`: spherical geometry, the configured
distant uniform Sun, and the reviewed epoch-anchored 500-star field transformed
for construction-time location and observation time. The second
mandatory tranche is `flat-local-finite-sun-v1`: Flat geometry and the
simulator-configured finite local Sun disk. The optional configuration boundary
permits a Sun-only spherical intermediate while Step 7 is not yet implemented,
but final promotion requires both complete families.

## Reviewed Decisions

| ID  | Decision                         | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Public configuration name        | `LegacyConfig.celestialSources` is the sole caller-authored top-level name; `Config.celestial` is rejected and receives no alias. Complete profiles retain `models.celestialSources`.                                                                                                                                                                                                                                                                                                                                                   |
| P2  | Observation and placement        | The normalized profile roster contains immutable source definitions. The clock supplies one fixed observation snapshot for the installed configuration; geometry owns the catalog-epoch through that observation-time/location transform. Runtime coordination supplies current camera/view bindings. Source providers do not publish time-frozen model directions. |
| P3  | Refresh boundary                 | A camera/projection/viewport change marks the stellar screen pair dirty and the installed standard render pipeline regenerates it before valid consumption. A different clock/location snapshot uses explicit static configuration replacement. Live clock updates and every other animation are deferred. |
| P4  | Cancellation and supersession    | A newer scene/facade construction request or disposal cancels staging. Cancellation and supersession reject with `AbortError`; the installed scene, facade, cache resources, config, shader, and bindings remain valid.                                                                                                                                                                                                                                                                                                                 |
| P5  | Sun authority                    | The configured `DistantSunLightSource` remains the sole Sun radiometry, angular-radius, and direct-atmosphere-transport owner, additively implements `DistantSunCelestialSource`, and is referenced exactly by the celestial roster. No parallel distant-Sun adapter is required.                                                                                                                                                                                                                                                       |
| P6  | Star authority                   | A `StellarPointSetCelestialSource` implementation exposes the definition that owns catalog identity, the exact 500-member selection, canonical directions, and native-15 apparent irradiance packets. V magnitude or B-V is never consumed as runtime radiometry.                                                                                                                                                                                                                                                                       |
| P7  | Geometry authority and mediation | Geometry owns every coordinate transform, including celestial/source/receiver-to-model mapping, horizon/support classification, build paths, cache coordinates, stencils, and construction-time query-packet preparation. Algorithm32 mediates every request for those transforms. Callers, placement helpers, light sources, caches, and renderer adapters do not independently project coordinates.                                                                                                                                   |
| P8  | Cache authority                  | Distant-Sun and Flat finite-Sun atmospheric caches retain their semantic owners. The stellar screen matrix/palette are instead shader-built outputs of an ordered standard render-pipeline generation stage. Runtime assembly installs that stage before its O(1) consumer and preserves separate identities and lifecycle for unlike resources. |
| P9  | Runtime composition              | The runtime produces separate `pathRadiance` and `celestialRadiance`, then forms `preDisplayRadiance` exactly once before Color.                                                                                                                                                                                                                                                                                                                                                                                                        |
| P10 | Public diagnostics               | Candidate sky-meter reads, manual sky-meter refresh, and `CelestialFrameEvaluator` are qualification-only and are not public production API.                                                                                                                                                                                                                                                                                                                                                                                            |
| P11 | Export shape                     | Production classes use one named export per class file. Candidate default aliases and the two-class controller file are rejected.                                                                                                                                                                                                                                                                                                                                                                                                       |
| P12 | Required and deferred families   | Flat/local finite Sun is a mandatory second production family with its own public roster. Fixed-snapshot epoch-relative stellar placement and camera/view regeneration belong to this port. All live clock updates, source motion, Earth-rotation animation, interpolation, and other animation are deferred with transformed-source twilight replacement, HDR sky metering/adaptation, Moon, opacity/order, profiled disks, and catalog expansion. |
| P13 | Local Sun authority              | One `FiniteLocalSunSourceDefinition` owns radius, static center height, uniform surface radiance, and profile. The existing configured `LocalSunLightSource`, visible disk, and direct illumination all consume that same definition.                                                                                                                                                                                                                                                                                                   |
| P14 | Additive celestial capabilities  | Existing public contracts remain intact. `CelestialSource` plus its distant-Sun, finite-local-Sun, and stellar specializations are structural capability interfaces that different classes may implement; they do not create a parallel class hierarchy. Every intended implementation declares each interface through a class-level `@implements` tag. The existing distant- and local-Sun classes implement both `LightSourceModel` and their celestial capability; the stellar implementation need not implement `LightSourceModel`. |

**P15 — execution-profile normalization:** legacy configuration accepts the
public roster and normalization retains that exact reference inside
`Algorithm32ExecutionProfile.models`. Explicit-profile configuration supplies
the roster only through its model bundle. All downstream production owners
read the retained profile; no caller repeats celestial options on cache,
geometry, shader, or runtime requests.

When celestial sources are enabled, Native-15 profile construction derives
identity from normalized executable roster facts: roster id and family,
ordered source ids and kinds, source-definition physical values, packet content
hashes, catalog/selection hashes, and member order. It does not serialize or
hash implementation object identity. When the roster is null, the existing
Native-15 profile content hash remains unchanged. A profile `contentHash`
remains provenance metadata and is never substituted for the dependency-level
celestial cache identity.

**P16 — retained scattering interlock:** the current Star-compatible
production scattering algorithm is frozen throughout celestial integration.
Optional seams may not change its reflected-ordinary-68 domains, frames,
equations, pass graph, reconstruction, interpolation, ground behavior, cache
identities, shader sources, runtime values, resource shape, or numerical
results. A neutral GPU executor is extracted only if those authorities remain
exact; otherwise celestial construction receives a separate executor. P16
takes precedence over implementation reuse. Sharing GPU execution code is
desirable only when it is behaviorally invisible to the retained scattering
path; it is not a requirement and does not authorize rewriting that path.
The verification authority is current production output and structure, not a
recreated or executed retired Star fixture.

## Public Contract

The family, roster, source-definition, and public celestial capability
declarations belong in
`src/algorithm32/interfaces/celestial-source/types.d.ts`. The legacy `Config`
property, execution-profile model field, and facade replacement/handle
declarations belong in
`src/algorithm32/interfaces/algorithm32/types.d.ts`. Geometry-specific
construction-time time/location contracts live with their concrete geometry
implementation.
The existing `LocalSunLightSourceConfig` and `LightSourceModel` declarations
remain at their current owners. Source implementations may use narrower
internal contracts, but they must not expose a private type through a public
surface.

The intended ambient shapes are:

```ts
/**
 * Supported production celestial capability family.
 *
 * - **"spherical-sun-stars-radial-v1"** - A spherical distant uniform Sun
 *   and optional epoch-anchored stellar point set, transformed for the
 *   construction-time location and observation time, over the radial cache
 *   domain.
 * - **"flat-local-finite-sun-v1"** - A Flat finite local Sun whose disk
 *   definition and construction-time placement are resolved together.
 */
type CelestialCapabilityFamily = 'spherical-sun-stars-radial-v1' | 'flat-local-finite-sun-v1';

/**
 * Supported production celestial source kind.
 *
 * - **"distant-uniform-sun"** - The visible disk of the configured
 *   atmospheric distant Sun.
 * - **"static-stellar-point-set"** - The reviewed fixed-epoch stellar roster.
 * - **"finite-local-sun"** - The simulator-configured finite local Sun disk.
 */
type CelestialSourceKind = 'distant-uniform-sun' | 'static-stellar-point-set' | 'finite-local-sun';

/**
 * Named right-handed celestial coordinate frame.
 *
 * - **"celestial-rh-v1"** - Longitude zero at +X, positive longitude toward
 *   +Y, and north at +Z.
 */
type CelestialFrame = 'celestial-rh-v1';

/**
 * Supported celestial time scale.
 *
 * - **"utc"** - An ISO-8601 UTC instant.
 */
type CelestialTimeScale = 'utc';

/** Epoch attached to source placement and observation state. */
type CelestialEpoch = Readonly<{
	/** ISO-8601 instant with an explicit UTC offset. */
	readonly instant: string;
	/** Time scale used to interpret the instant. */
	readonly timeScale: CelestialTimeScale;
}>;

/** Immutable celestial view derived from the configured atmospheric distant Sun. */
type DistantSunCelestialSourceDefinition = Readonly<{
	/** Stable celestial source identifier. */
	readonly id: string;
	/** Source-kind discriminator. */
	readonly kind: 'distant-uniform-sun';
	/** Positive apparent angular radius retained from the light-source configuration. */
	readonly angularRadius: Angle;
	/** Uniform spectral radiance derived from the light source's apparent irradiance and disk support. */
	readonly surfaceRadiance: SpectralRadiancePacket;
	/** Uniform-disk profile required by the first family. */
	readonly profile: 'uniform-disk';
}>;

/** Static source definition shared by local-Sun lighting and visible-disk paths. */
type FiniteLocalSunSourceDefinition = Readonly<{
	/** Stable celestial and atmospheric source identifier. */
	readonly id: string;
	/** Source-kind discriminator. */
	readonly kind: 'finite-local-sun';
	/** Physical body radius. */
	readonly radius: Distance;
	/** Static center height required by the accepted source-relative domain. */
	readonly centerHeight: Distance;
	/** Uniform surface spectral radiance used by both lighting and disk rendering. */
	readonly surfaceRadiance: SpectralRadiancePacket;
	/** Uniform-disk profile required by this family. */
	readonly profile: 'uniform-disk';
}>;

/** Identity of the reviewed stellar catalog and selection. */
type StellarCatalogIdentity = Readonly<{
	/** Stable catalog identifier. */
	readonly catalogId: string;
	/** Versioned upstream catalog label. */
	readonly catalogVersion: string;
	/** SHA-256 identity of the checked source input. */
	readonly catalogSha256: string;
	/** Stable 500-member selection-policy identifier. */
	readonly selectionId: string;
	/** SHA-256 identity of the ordered selected records. */
	readonly selectionSha256: string;
	/** Coordinate frame used by every member direction. */
	readonly frame: CelestialFrame;
	/** Epoch of the canonical member directions. */
	readonly epoch: CelestialEpoch;
}>;

/** Static stellar member supplied by the selected catalog source. */
type StellarSourceMemberDefinition = Readonly<{
	/** Stable member identifier. */
	readonly id: string;
	/** Canonical unit direction in the catalog frame. */
	readonly direction: UnitVector3;
	/** Apparent top-of-atmosphere native-basis irradiance density. */
	readonly spectralIrradiance: SpectralIrradiancePacket;
}>;

/** Static first-family stellar point-set source. */
type StellarPointSetSourceDefinition = Readonly<{
	/** Stable aggregate source identifier. */
	readonly id: string;
	/** Source-kind discriminator. */
	readonly kind: 'static-stellar-point-set';
	/** Catalog and selection identity. */
	readonly catalog: StellarCatalogIdentity;
	/** Exactly 500 members in canonical selection order. */
	readonly members: readonly StellarSourceMemberDefinition[];
}>;

/** Common public capability implemented by a configured celestial source. */
interface CelestialSource {
	/** Stable source identity used by roster and cache compatibility. */
	readonly id: string;
	/** Source-kind discriminator. */
	readonly kind: CelestialSourceKind;
	/** Immutable source-specific static definition. */
	readonly celestialSourceDefinition:
		DistantSunCelestialSourceDefinition | FiniteLocalSunSourceDefinition | StellarPointSetSourceDefinition;
}

/** Capability implemented by a configured distant atmospheric Sun. */
interface DistantSunCelestialSource extends CelestialSource {
	/** Distant-Sun discriminator. */
	readonly kind: 'distant-uniform-sun';
	/** Static distant-Sun definition backed by this light-source owner. */
	readonly celestialSourceDefinition: DistantSunCelestialSourceDefinition;
}

/** Capability implemented by a configured finite local atmospheric Sun. */
interface FiniteLocalSunCelestialSource extends CelestialSource {
	/** Finite-local-Sun discriminator. */
	readonly kind: 'finite-local-sun';
	/** Static finite-Sun definition shared by lighting and disk transport. */
	readonly celestialSourceDefinition: FiniteLocalSunSourceDefinition;
}

/** Capability implemented by a configured static stellar point-set source. */
interface StellarPointSetCelestialSource extends CelestialSource {
	/** Static-stellar-point-set discriminator. */
	readonly kind: 'static-stellar-point-set';
	/** Static catalog-backed stellar definition. */
	readonly celestialSourceDefinition: StellarPointSetSourceDefinition;
}

/** Immutable capability roster for the spherical distant-Sun and star family. */
type SphericalSunStarsSourceRoster = Readonly<{
	/** Stable roster identity. */
	readonly id: string;
	/** Selected capability family. */
	readonly family: 'spherical-sun-stars-radial-v1';
	/** Exact configured light-source object implementing the distant-Sun capability. */
	readonly sun: DistantSunCelestialSource;
	/** Stellar capability implementation, omitted only during the bounded Sun-first port. */
	readonly stars?: StellarPointSetCelestialSource | null;
}>;

/** Immutable capability roster for the mandatory Flat/local finite-Sun family. */
type FlatLocalFiniteSunSourceRoster = Readonly<{
	/** Stable roster identity. */
	readonly id: string;
	/** Selected capability family. */
	readonly family: 'flat-local-finite-sun-v1';
	/** Exact configured light-source object implementing the finite-local capability. */
	readonly localSun: FiniteLocalSunCelestialSource;
}>;

/** Immutable celestial capability roster accepted by the production facade. */
type CelestialSourceRoster = SphericalSunStarsSourceRoster | FlatLocalFiniteSunSourceRoster;

/** Optional cancellation input for one static config replacement. */
type ConfigReplacementOptions = Readonly<{
	/** Caller cancellation for this replacement transaction. */
	readonly signal?: AbortSignal;
}>;
```

The current execution-profile and facade declarations change as follows:

```ts
type LegacyConfig = {
	// Existing required and optional Algorithm32 configuration.
	celestialSources?: CelestialSourceRoster | null;
};

type Algorithm32ExecutionModels = Readonly<{
	// Existing complete profile model fields.
	readonly celestialSources: CelestialSourceRoster | null;
}>;

type ExecutionProfileConfig = {
	profile: Algorithm32ExecutionProfile;
	celestialSources?: never;
};

interface ShaderHandle {
	setConfig(config: Config, options?: ConfigReplacementOptions): Promise<ConfigSnapshot>;
}
```

For the legacy form, `ConfigSnapshot.config.celestialSources` retains the
accepted immutable roster reference. Algorithm32 copies only the containing
configuration wrapper; it does not clone or freeze caller-owned source
objects. Normalization retains the same reference at
`profile.models.celestialSources`, which is the downstream authority. An
explicit profile supplies that model field directly and cannot also supply a
top-level roster. Roster members are interface implementations supplied by the
application, while their `celestialSourceDefinition` properties expose the
immutable static facts used for validation, identity, and cache
construction.

Celestial interfaces are orthogonal capabilities, not base classes and not
replacements for existing contracts. An implementation class declares every
intended interface in its source JSDoc. The existing distant- and local-Sun
classes therefore retain their existing `LightSourceModel` behavior while
removing caller-computed model placement from their constructors and adding
geometry configuration plus the appropriate celestial getters:

```js
/**
 * Physical distant-Sun source facade for atmospheric and endpoint lighting.
 *
 * @implements {LightSourceModel}
 * @implements {GeometryConfigurableLightSource}
 * @implements {DistantSunCelestialSource}
 */
export class DistantSunLightSource {
	// Existing constructor and LightSourceModel methods remain.
	get id() {}
	get kind() {}
	get celestialSourceDefinition() {}
}

/**
 * Finite local-Sun physical source and public integration facade.
 *
 * @implements {LightSourceModel}
 * @implements {GeometryConfigurableLightSource}
 * @implements {FiniteLocalSunCelestialSource}
 */
export class LocalSunLightSource {
	// Existing constructor and LightSourceModel methods remain.
	get id() {}
	get kind() {}
	get celestialSourceDefinition() {}
}
```

The spherical roster's `sun` must be the exact configured
`Config.lightSource` object, structurally satisfying both `LightSourceModel`
and `DistantSunCelestialSource`. Its stable
`DistantSunCelestialSourceDefinition` is derived from the existing normalized
irradiance and positive angular radius and exposes the uniform surface
radiance used by the visible disk. Existing zero-angular-radius use remains
valid when celestial sources are disabled but cannot satisfy the spherical
finite-disk ingress.

For the Flat/local family, the roster's `localSun` must be the exact configured
`Config.lightSource` object, structurally satisfying both `LightSourceModel`
and `FiniteLocalSunCelestialSource`. Its `celestialSourceDefinition` is a
stable normalized view derived from the existing construction inputs: radius
is retained, center height is the normalized Flat vertical position, and
uniform surface radiance is derived from the reference irradiance, reference
spectral incident scale, reference distance, and finite positive radius. This
makes local-Sun radiometry a single-owner input for atmospheric illumination
and visible-disk rendering without changing existing atmospheric-only
construction when the celestial roster is null. A zero-radius source remains
valid for existing atmospheric-only use but cannot satisfy the finite-disk
family ingress.

The stellar roster member is any application- or production-supplied class
that declares `@implements {StellarPointSetCelestialSource}` and exposes an
accepted immutable `StellarPointSetSourceDefinition`. It is not an atmospheric
light source and is not required to implement `LightSourceModel`. The standard
production stellar implementation belongs under `implementation/star-field/`,
but its class identity is not part of the public contract.

### Public method behavior

- Construction accepts `celestialSources` only when its family, capability
  interfaces, source IDs and kinds, exact configured-light-source identity,
  exposed definitions, catalog identity, member count/order, packet
  quantities, units, basis, hashes, and immutable roster structure are valid.
- The atmospheric light source is configured through the separate Algorithm32
  construction boundary before cache work begins; this does not configure its
  celestial capability or any other celestial source.
- `setupShader()` installs the normal stellar generation and consumer stages;
  the configured clock/location snapshot supplies fixed observation bindings,
  while runtime coordination supplies current camera/view bindings through the
  standard render-pipeline state.
- `setConfig()` stages the complete facade, scattering cache, every required
  source-family celestial cache resource, shader, runtime bindings, and
  geometry-derived query packet before publication.
- Camera, projection, or viewport changes update standard runtime bindings and
  mark the stellar matrix/palette dirty. The installed generation stage
  refreshes them before the consumer may sample. The clock/location snapshot
  remains fixed; changing it uses static replacement, and live updating it is
  deferred.
- Calls after disposal throw. Disposal remains idempotent.

## Internal Contracts And Current Owners

All internal contracts are ambient and live in the nearest included
`types.d.ts`; no `import(...)` bridge or inline complex callable shape is
permitted.

| Contract or responsibility                                                                           | Selected production owner                                                                                                         | Visibility                                                                                        |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Public roster, source definitions, capability interfaces, replacement options, and handle signatures | `src/algorithm32/interfaces/celestial-source/types.d.ts` and `interfaces/algorithm32/types.d.ts`                                  | Public API                                                                                        |
| Facade acceptance, config copying, prepared replacement, and snapshots                               | `src/algorithm32/implementation/algorithm32/Algorithm32.js`                                                                       | Public class with private support                                                                 |
| Static transaction, supersession, publication, and disposal                                          | `src/algorithm32/implementation/algorithm32/Algorithm32ShaderHandle.js`                                                           | Private class returned through the public `ShaderHandle` interface                                |
| Profile-held immutable roster and model accessor                                                     | `src/algorithm32/profiles/types.d.ts`, `profiles/native-15/`, and `implementation/algorithm32/model/SharedModel.js`               | Complete execution-profile contract plus implementation-private accessor                          |
| Source-provider, source-identity, and source-fragment behavioral contracts                           | `src/algorithm32/celestial-source-support/types.d.ts`                                                                             | Internal production interfaces implemented with explicit `@implements` tags                       |
| Existing distant atmospheric Sun plus additive celestial capability                                  | `src/algorithm32/implementation/distant-sun/DistantSunLightSource.js` and `implementation/distant-sun/types.d.ts`                 | Existing public class implementing two public interfaces                                          |
| Standard stellar catalog/source implementation and photometry                                        | `src/algorithm32/implementation/star-field/`                                                                                      | Public standard implementation of the stellar capability interface with a feature-private closure |
| Existing finite local Sun atmospheric light source plus additive celestial capability                | `src/algorithm32/implementation/local-sun/LocalSunLightSource.js` and `implementation/local-sun/types.d.ts`                       | Existing public class implementing two public interfaces                                          |
| Geometry capability, query packet, placement result, support classification, and stencils            | `src/algorithm32/interfaces/geometry/types.d.ts` and `geometry-support/types.d.ts`                                                | Public capability interface plus internal data contracts                                          |
| Spherical first-family domain implementation                                                         | `src/algorithm32/implementation/spherical-earth/celestial/SphericalCelestialContributionDomain.js` with its dedicated declaration | Spherical-Earth feature-private implementation                                                    |
| Flat/local finite-body placement, support, atmosphere segment, and construction-time center binding  | `src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js` and `implementation/flat-earth/types.d.ts`                       | Internal production interface                                                                     |
| Atmosphere cache-build contribution                                                                  | `src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js` and `interfaces/atmosphere/types.d.ts`               | Public implementation plus global interface                                                       |
| Shared celestial cache data contracts, binding keys, cache-set view, and composition support         | `src/algorithm32/celestial-contribution-cache/`                                                                                   | Non-public cross-source vocabulary; not an aggregate cache controller                             |
| Distant-Sun celestial cache plan, controller, resource, and lookup                                   | `src/algorithm32/implementation/distant-sun/celestial/`                                                                           | Feature-private semantic cache implementation                                                     |
| Stellar point-set cache plan, controller, resource, and lookup                                       | `src/algorithm32/implementation/star-field/`                                                                                      | Feature-private semantic cache implementation                                                     |
| Flat finite-Sun cache plan, controller, resource, and lookup                                         | `src/algorithm32/implementation/local-sun/celestial/`                                                                             | Feature-private semantic cache implementation                                                     |
| Neutral scalar-field GPU execution and renderer resource installation                                | `src/algorithm32/gpu-cache-runtime/` plus public `src/algorithm32/implementation/three-cache-backend/`                            | Internal mechanics with no scattering or celestial descriptor ownership                           |
| Deterministic celestial shader declarations                                                          | `src/algorithm32/shader-assembly/`                                                                                                | Internal production interface                                                                     |
| Celestial runtime assembly and exact pre-Color addition                                              | `src/algorithm32/rendering-runtime/ShaderAssemblyPreparer.js` and `src/algorithm32/atmospheric-transport/Algorithm32Transport.js` | Internal production interface                                                                     |
| Three query, camera, viewport, and matched scene-hit bindings                                        | `src/algorithm32/rendering-runtime/three/`                                                                                        | Internal implementation                                                                           |
| Color conversion                                                                                     | `src/algorithm32/implementation/{bruneton-color,ferwerda-color}/`; no sky-meter API in this port                                  | Public selectable implementations and private conversion closures                                 |

The following named internal contracts are required before implementation can
cross their seams. Behavioral seams are interfaces; immutable requests,
results, identities, plans, packets, stencils, and bindings are data types.
Every class selected to implement a behavioral seam declares the relevant
interface with `@implements`:

- `CelestialSourceProvider`, `CelestialSourceIdentity`,
  `CelestialCacheFragmentSpec`, and `CelestialCacheBuildRequest`;
- `CelestialGeometryCapability`, `CelestialResolvedPlacement`,
  `CelestialBuildSample`, `CelestialReceiverStencil`,
  `CelestialDirectionStencil`, `CelestialQueryPacket`, and
  `CelestialCacheShaderContributionRequest`;
- `DistantSunCelestialCachePlan`, `DistantSunCelestialCacheResource`,
  `DistantSunCelestialRuntimeBindings`, and
  `DistantSunCelestialLiveShaderContributionRequest`;
- `StellarPointSetCachePlan`, `StellarPointSetCacheResource`,
  `StellarPointSetRuntimeBindings`, `FlatFiniteSunCachePlan`,
  `FlatFiniteSunCacheResource`, `FlatFiniteSunRuntimeBindings`, the
  corresponding controller identities, and the read-only `CelestialCacheSet`.

In that list, `CelestialSourceProvider` and
`CelestialGeometryCapability` are new behavioral interfaces. Each
source-family controller owns an explicit contract matching its resource; it
is not required to implement the scattering controller contract merely because
both use GPU fields. The neutral GPU executor does not implement a celestial
controller interface. The existing atmosphere, shader-build, runtime-backend,
transport, and handle classes continue to implement their established
interfaces as celestial methods are added. The remaining names are data
contracts and do not receive artificial interfaces.

No separate celestial-specific shader-build records are introduced. The
existing `ShaderBuildContext` and `ShaderBuildResult` data contracts carry
distinct optional slots for each celestial cache family, as specified below.
This keeps shader construction and lifecycle ownership on the established
production boundary without creating a parallel celestial build protocol.

Step 6.2 adds one private `ShaderBuildContext.celestialQueryPacket` slot for
the complete geometry-derived packet used by enabled assembly; it is not
published through `ShaderBuildResult`. Geometry receives that packet through
`CelestialCacheShaderContributionRequest`. The distant-Sun live consumer's
narrower request adds only the configured source. Live camera, viewport, and
scene values remain renderer bindings rather than request or cache-identity
facts. The exact contract details and verification are owned by the
[Step 6 live-composition reconciliation](step-6-live-sun-composition-reconciliation.md#exact-contracts-selected-in-step-62).

The Flat/local family additionally requires
`FiniteLocalSunSourceDefinition`, `FiniteLocalSunPlacementState`,
`FlatLocalFiniteSunSourceRoster`, `FlatLocalFiniteSunLiveState`,
`FlatFiniteSunCachePlan`, and `FlatFiniteSunRuntimeBindings`. These are named
contracts on the same public or nearest internal ambient surfaces above; they
are not inline candidate shapes.

`ShaderBuildContext` and `ShaderBuildResult` must replace the current generic
scattering slots directly and add distinct celestial slots:

```ts
type ShaderBuildResult = {
	// Existing model, setup, assembly, runtime, and diagnostics fields.
	readonly scatteringCacheController?: CacheController | null;
	readonly scatteringCache?: GpuScatteringCache | null;
	readonly scatteringCacheControllerIdentity?: ShaderCacheControllerIdentity | null;
	readonly distantSunCelestialCacheController?: DistantSunCelestialCacheController | null;
	readonly distantSunCelestialCache?: DistantSunCelestialCacheResource | null;
	readonly distantSunCelestialCacheIdentity?: DistantSunCelestialCacheControllerIdentity | null;
	readonly stellarPointSetCacheController?: StellarPointSetCacheController | null;
	readonly stellarPointSetCache?: StellarPointSetCacheResource | null;
	readonly stellarPointSetCacheIdentity?: StellarPointSetCacheControllerIdentity | null;
	readonly flatFiniteSunCacheController?: FlatFiniteSunCacheController | null;
	readonly flatFiniteSunCache?: FlatFiniteSunCacheResource | null;
	readonly flatFiniteSunCacheIdentity?: FlatFiniteSunCacheControllerIdentity | null;
};
```

No `cacheController`, `cache`, or `cacheControllerIdentity` compatibility alias
survives that migration. Celestial resources use direct constants owned by
`celestial-contribution-cache/consts.js`; the accepted keys are
`cache.celestial.sunTransport`, `cache.celestial.starTransport`, and
`cache.celestial.localSunRadiance`. Generic GPU runtime types may accept a
typed value key, but do not own celestial identity.

Current production requires the following exact separation before a celestial
build can use the shared GPU mechanics:

- define one named `CacheRuntimeValueKey` union containing the existing
  `cache.cumulativeScatteringDensity` key and the three celestial keys;
- define a neutral `GpuFieldExecutionPlan`, `GpuFieldPass`, and
  `GpuFieldArtifact` beneath the scattering-cache adapter. They contain field
  storage, declared modules, dependencies, output selection, diagnostics, and
  cleanup, but no scattering order and no celestial source kind;
- pass the caller-selected binding key into
  `CacheGpuBackend.createRuntimeBinding(request)` through a named
  `CacheRuntimeBindingRequest` containing `field` and `valueKey`;
- retain scattering order, recurrence, cumulative-result selection, and
  `ScatteringCacheDescriptor` construction exclusively in the scattering
  adapter; and
- let every celestial controller construct its own descriptor, execute one
  field plan, and wrap the resulting artifact. The rendering transaction
  collects the required independently completed resources before installing
  their bindings and shader together.

The generic runtime may route typed values but may not interpret a celestial
key, roster, source kind, or controller/resource identity.

## Construction And Invalidation Matrix

| Input change                                                                                                                                                                          | Field generation                                        | Live/runtime effect                                                                             | Contract result                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Omit or set `celestialSources` to `null`                                                                                                                                              | Dispose after successful replacement                    | Remove celestial bindings and contribute exact zero                                             | Accepted disabled state                                       |
| Roster ID, family, layer presence/order, capability implementation, source ID/kind, exposed source definition, catalog/selection identity, member order, celestial packet, or profile | Rebuild each affected semantic resource                 | Publish the complete successor cache set and bindings with the successor shader transaction     | Accepted when within family                                   |
| Atmosphere optical state or direct-transport contract                                                                                                                                 | Rebuild affected resources                              | Replace the complete installed cache set                                                        | Accepted                                                      |
| Geometry family/domain/model frame/stencil/horizon contract                                                                                                                           | Rebuild affected resources or reject unsupported family | Replace the complete cache set and query packet                                                 | Accepted only for the matching spherical or Flat/local family |
| Spectral basis/channel order/density semantics                                                                                                                                        | Rebuild affected resources                              | Replace the complete cache set and shader compatibility                                         | Native-15 celestial packets must match                        |
| Cache representation, precision, packing, or backend capability identity                                                                                                              | Rebuild/repack only through an explicit compatible plan | Replace resources                                                                               | Stellar screen products use unsigned-integer index plus `R32F` palette |
| Configured stellar clock/location snapshot or catalog epoch                                                                                                                           | Construct a static successor configuration              | Generation stage applies the epoch-relative transform from that fixed snapshot                   | Accepted replacement; live update deferred                   |
| Distant-Sun placement or another construction-owned geometry fact                                                                                                                     | Follow that owner's declared replacement boundary       | Geometry derives the compatible placement and query state                                       | Accepted only with compatible complete state                  |
| Flat/local time, location, or semantic subsolar point                                                                                                                                 | Rebuild in a successor facade/scene                     | Flat geometry derives the successor center/radius and complete cache inputs during construction | Required replacement; no in-place update                      |
| Flat/local center height, physical radius, surface radiance, atmosphere, or source-relative domain policy                                                                             | Rebuild finite-Sun resource                             | Await complete cache-set replacement                                                            | Required Flat/local behavior                                  |
| Camera, projection, FOV, viewport, or pixel ratio                                                                                                                                     | Reuse atmospheric fields; mark stellar screen pair dirty | Standard generation stage refreshes matrix/palette before the O(1) consumer                     | Accepted in-pipeline refresh                                  |
| Scene hit/depth/visibility                                                                                                                                                            | Reuse                                                   | Renderer live visibility only                                                                   | Accepted                                                      |
| Color/display state                                                                                                                                                                   | Reuse                                                   | Color-owned update only                                                                         | Accepted; HDR sky adaptation deferred                         |
| Receiver outside the declared domain                                                                                                                                                  | Do not rebuild in frame                                 | Celestial term becomes exact zero with bounded diagnostic                                       | Accepted failure behavior                                     |
| Moon, another finite body, opacity/ordering, profiled disk, or unsupported source count                                                                                               | No candidate resource                                   | Reject before allocation                                                                        | Deferred capability                                           |

The complete profile is a transport container, not one indivisible cache key.
For this tranche, an enabled celestial roster requires the Native-15 basis and
aligned source packets; a non-Native profile is accepted only with
`celestialSources: null`. Atmospheric incoming-direction quadrature and
outgoing scattering reconstruction affect `pathRadiance` but are not inputs to
the direct celestial fields, so changing ordinary-34 to reflected-68 does not
by itself invalidate a celestial resource. Spectral basis, atmosphere direct
transport, geometry boundary/frame behavior, source definitions, celestial
domain/layout, and backend representation remain resource-identity inputs.

## Transaction And Lifecycle Contract

One shader handle owns at most one installed resource from each enabled
celestial cache family and the corresponding source-family controllers.

```text
installed scene/facade/cache set
  -> construct candidate geometry and facade from external time/location
  -> validate candidate config and geometry-derived placement
  -> derive direct identities and exact reuse decision
  -> stage every required celestial resource and shader/runtime binding
  -> cancellation/supersession/failure: dispose candidate only
  -> success: application swaps the complete scene/facade
  -> dispose retired scene/facade/cache resources exactly once
```

- Exact physical-field, representation, runtime-compatibility, and controller
  identities govern reuse. Descriptors are not validation or behavior inputs.
- A newer `setConfig()` aborts an older staging request. Caller cancellation
  and handle disposal use the same abort path.
- A failed, cancelled, or superseded build never mutates the installed scene,
  facade, config, source roster, query state, shader, resources, or bindings.
- Camera/view changes refresh the shader-built stellar screen products inside
  the installed standard render pipeline. The configured clock/location
  snapshot is fixed; all animation remains deferred.
- Complete shader/scene transaction publication prevents a Sun resource from
  pairing with the wrong stellar member table or a partially built stellar
  field. Individual controllers need not share a generation identity.
- Each controller owns its resource, not the externally supplied backend.
  Replacement and final disposal are idempotent and dispose every owned
  resource exactly once.
- Context restoration never republishes a CPU-built stellar screen product.
  It reallocates the standard runtime targets and reruns the installed
  generation stage for the configured clock/location snapshot and current view
  identity before the
  consumer may sample.

## Complete Candidate-Delta Classification

Classification applies to the candidate export or to the changed behavior of
an existing export. `Internal` means a production collaborator boundary;
`detail` means no stable exported contract is promised. Every candidate
default alias is rejected even when the named class is retained.

| Candidate file                                             | Exported symbol or changed surface                                                                                  | Classification                                                    | Production disposition                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Algorithm32.js`                                           | `Algorithm32`                                                                                                       | Public API                                                        | Adapt `Config.celestialSources`; retain the reconciled facade owner.                                                                                                                                                                       |
| `Algorithm32ShaderHandle.js`                               | `Algorithm32ShaderHandle`                                                                                           | Public API; candidate live-state and sky methods rejected         | Preserve static replacement/lifecycle behavior; do not add `updateCelestialState` or the four sky read/refresh methods.                                                                                                                    |
| `atmospheres/CanonicalAtmosphere.js`                       | `CanonicalAtmosphere.createCelestialCacheBuildModule`                                                               | Internal                                                          | Adapt as the atmosphere-owned celestial build contribution.                                                                                                                                                                                |
| `caches/celestial/CelestialContributionCacheController.js` | `CelestialContributionCacheGeneration`, `CelestialContributionCacheController`, default alias                       | Historical G2 lifecycle proof                                     | Do not promote this synthetic aggregate controller or generation. Transfer its cancellation, last-valid preservation, cleanup, and idempotent-disposal invariants to the source-family controllers and complete ShaderBuilder transaction. |
| `caches/celestial/CelestialFrameEvaluator.js`              | `CelestialFrameEvaluator`, default alias                                                                            | Qualification-only                                                | Do not port; production tests may create fresh private oracles without a runtime export.                                                                                                                                                   |
| `caches/celestial/CelestialRuntimeParticipant.js`          | `CelestialRuntimeParticipant`, default alias                                                                        | Qualification-only adapter                                        | Reject monolith; split roster, source, geometry, and cache responsibilities.                                                                                                                                                               |
| `caches/celestial/CpuStarPointSetCache.js`                 | `CpuStarPointSetCache` and default alias                                                                            | Qualification-only oracle                                         | Do not promote as production construction. The standard render-pipeline generation shader owns matrix/palette output; CPU logic may support independent tests only.                                                                        |
| `caches/celestial/CpuSunDiskRadianceCache.js`              | `CpuSunDiskRadianceCache` and default alias                                                                         | Internal                                                          | Adapt the logical CPU Sun field under `implementation/distant-sun/celestial`; named export only.                                                                                                                                           |
| `caches/celestial/DistantSunCelestialSource.js`            | `DistantSunCelestialSource` and default alias                                                                       | Behavior input for a public capability interface                  | Define the structural `DistantSunCelestialSource` interface and implement it additively on the existing `DistantSunLightSource`. No candidate class, parallel adapter, or default alias survives.                                          |
| `caches/celestial/FiniteLocalSunCelestialSource.js`        | `FiniteLocalSunCelestialSource` and default alias                                                                   | Behavior input for a public mandatory-family capability interface | Define the structural `FiniteLocalSunCelestialSource` interface and implement it additively on the existing `LocalSunLightSource`. No candidate class, parallel light source, or default alias survives.                                   |
| `caches/celestial/FlatFiniteSunGpuCache.js`                | `FlatFiniteSunGpuCache` and default alias                                                                           | Internal mandatory-family interface                               | Retain the finite-Sun resource wrapper under the local-Sun feature; use a named export and exact finite-Sun terminology.                                                                                                                   |
| `caches/celestial/FlatFiniteSunGpuCacheController.js`      | `FlatFiniteSunGpuCacheController` and default alias                                                                 | Internal candidate wrapper                                        | Retain the separate finite-Sun controller behavior under the local-Sun feature; adapt naming, ownership, cancellation, and named exports.                                                                                                  |
| `caches/celestial/FlatFiniteSunGpuPlan.js`                 | `FLAT_FINITE_SUN_CACHE_VALUE_KEY`, `createFlatFiniteSunGpuBuildPlan`, default alias                                 | Mandatory-family details                                          | Retain the distinct finite-Sun plan under the local-Sun feature, move the direct key to shared celestial constants, remove fake scattering order, and reject the default alias.                                                            |
| `caches/celestial/FlatFiniteSunPrimaryCache.js`            | `FlatFiniteSunPrimaryCache` and default alias                                                                       | Internal mandatory-family interface                               | Adapt as the exact logical finite-Sun field; replace the vague `Primary` name and reject the default alias.                                                                                                                                |
| `caches/celestial/PrimaryCelestialCache.js`                | `PrimaryCelestialCache` and default alias                                                                           | Internal candidate wrapper                                        | Reject vague `Primary` naming; retain an exact distant-Sun logical field owned by the distant-Sun feature.                                                                                                                                 |
| `caches/celestial/PrimaryCelestialGpuCache.js`             | `PrimaryCelestialGpuCache` and default alias                                                                        | Internal                                                          | Retain its resource/binding behavior as a distinct distant-Sun cache resource; replace `Primary` naming and reject the default alias.                                                                                                      |
| `caches/celestial/PrimaryCelestialGpuCacheController.js`   | `PrimaryCelestialGpuCacheController` and default alias                                                              | Internal candidate wrapper                                        | Retain the separate distant-Sun controller behavior under the distant-Sun feature; replace vague `Primary` naming and reject the default alias.                                                                                            |
| `caches/celestial/PrimaryCelestialGpuPlan.js`              | `createPrimaryCelestialGpuBuildPlan` and default alias                                                              | Detail                                                            | Retain as a distinct distant-Sun plan, remove fake scattering order and scattering-descriptor coupling, replace `Primary` naming, and reject the default alias.                                                                            |
| `caches/celestial/PrimaryCelestialR32FRepresentation.js`   | `PrimaryCelestialR32FRepresentation` and default alias                                                              | Detail                                                            | Reuse reconciled cache storage/layout owners; do not create a second representation class.                                                                                                                                                 |
| `caches/celestial/StellarCelestialSource.js`               | `StellarCelestialSource` and default alias                                                                          | Standard implementation of a public capability interface          | Adapt under `implementation/star-field` as a named-only class declaring `@implements {StellarPointSetCelestialSource}`; the interface, not this concrete class, is the public configuration contract.                                      |
| `caches/celestial/StellarPointSetGpuCache.js`              | `StellarPointSetGpuCache` and default alias                                                                         | Superseded candidate resource                                     | Do not promote the cache resource. Standard rendering-runtime active/staging targets own the shader-built stellar matrix/palette.                                                                                                           |
| `caches/celestial/StellarSpectralPhotometry.js`            | `StellarSpectralPhotometry` and default alias                                                                       | Internal                                                          | Adapt under `implementation/star-field` after Step 7 provenance review; named export only.                                                                                                                                                 |
| `caches/celestial/TiledStarPointSetCache.js`               | `STELLAR_POINT_SET_CACHE_VALUE_KEY`, `TiledStarPointSetCache`, `createTiledStarPointSetGpuBuildPlan`, default alias | Rejected historical representation                               | Do not promote the tiled field, plan, key, or alias. The sparse screen matrix/palette generation stage replaces them directly.                                                                                                              |
| `caches/celestial/TiledStarPointSetGpuCacheController.js`  | `TiledStarPointSetGpuCacheController` and default alias                                                             | Rejected historical wrapper                                      | Do not promote. Standard runtime stage/output lifecycle replaces this controller.                                                                                                                                                           |
| `caches/gpu/CacheGpuExecutor.js`                           | `CacheGpuExecutor`                                                                                                  | Internal                                                          | Extract neutral one-field GPU execution. Keep scattering descriptor/order handling in a scattering adapter; reject the candidate's fake celestial order and scattering-descriptor result.                                                  |
| `caches/gpu/cacheRuntimeContracts.js`                      | `CUMULATIVE_SCATTERING_CACHE_VALUE_KEY`, `PRIMARY_CELESTIAL_CACHE_VALUE_KEY`                                        | Detail                                                            | Preserve scattering ownership; move direct celestial keys to `celestial-contribution-cache/consts.js`; reject `PRIMARY_CELESTIAL_CACHE_VALUE_KEY`.                                                                                         |
| `caches/gpu/types.d.ts`                                    | `CacheBuildPlan`, `CacheRuntimeBinding`, `CacheGpuBackend` changes                                                  | Internal                                                          | Split scattering plan semantics from neutral one-field execution and generalize only typed value-key plumbing; GPU runtime owns no celestial identity.                                                                                     |
| `color/BrunetonColorDisplayModel.js`                       | `radianceToPhotopicLuminance`, sky adaptation, and HDR scene-boundary changes                                       | Split disposition                                                 | Keep photopic sky adaptation deferred. The half-float scene target and peak-channel normalization are promoted narrowly to preserve highlight chromaticity while retaining the established production display proxy.                       |
| `color/SkyIlluminanceProbe.js`                             | `SkyIlluminanceProbe`                                                                                               | Qualification-only/deferred                                       | Do not port or expose. HDR meter design remains separate.                                                                                                                                                                                  |
| `color/types.d.ts`                                         | `DisplayConversionDescriptor` changes                                                                               | Deferred capability                                               | Do not port in this step sequence.                                                                                                                                                                                                         |
| `composition/CelestialSpectralComposer.js`                 | `CelestialSpectralComposer` and default alias                                                                       | Detail                                                            | Preserve the one-addition behavior in existing transport/rendering owners; no one-method class or default alias.                                                                                                                           |
| `geometries/FlatEarthGeometry.js`                          | sky probe and finite-celestial methods                                                                              | Internal mandatory family, except sky probe deferred              | Port construction-time finite-body placement, support, atmosphere path, and binding; reject sky-meter behavior.                                                                                                                            |
| `geometries/SkyIlluminanceProbePlan.js`                    | `createSkyIlluminanceProbePlan`                                                                                     | Qualification-only/deferred                                       | Do not port.                                                                                                                                                                                                                               |
| `geometries/SphericalCelestialContributionDomain.js`       | `SphericalCelestialContributionDomain` default export                                                               | Internal                                                          | Adapt to the exact spherical owner with a named-only class export.                                                                                                                                                                         |
| `geometries/SphericalEarthGeometry.js`                     | celestial domain/query/cache methods and sky probe method                                                           | Internal, except sky probe deferred                               | Adapt first-family geometry methods and retain typed factories/capabilities needed by the separate distant-Sun and stellar resources; reject sky-meter behavior.                                                                           |
| `implementation/consts.js`                                 | `GLSL_DIRECTIVE_PREFIX`, `EMPTY_SHADER_BUILD_CONTEXT` changes                                                       | Detail                                                            | Extend the reconciled rendering context directly; do not retain candidate-era owner paths.                                                                                                                                                 |
| `implementation/ShaderBuilder.js`                          | `ShaderBuilder` celestial orchestration                                                                             | Internal                                                          | Adapt into current `rendering-runtime/ShaderBuilder.js` with the ordered stellar generation/consumer stages and source-local Sun tile beside retained atmospheric-cache owners.                                                            |
| `implementation/ShaderRuntimePass.js`                      | `ShaderRuntimePass` celestial/sky bindings                                                                          | Internal with deferred sky portion                                | Extend the current Three runtime path for ordered generation targets/stages and celestial consumer bindings; reject sky-meter bindings.                                                                                                    |
| `light-sources/FiniteLocalSunLightSource.js`               | `FiniteLocalSunLightSource` and default alias                                                                       | Rejected replacement class; behavior input only                   | Do not port this parallel class or its constructor. Adapt the reviewed finite-disk capability onto the existing named-only `LocalSunLightSource` while preserving its constructor and `LightSourceModel` surface.                          |
| `light-sources/LocalSunCacheController.js`                 | `LocalSunCacheController` changes                                                                                   | Internal mandatory-family migration                               | Adapt or replace the old local-source controller so direct lighting and the visible disk share one static source definition.                                                                                                               |
| `light-sources/LocalSunCacheSource.js`                     | `spectralBasis` addition                                                                                            | Internal mandatory-family migration                               | Adapt the required spectral-basis seam without retaining a second radiometry owner.                                                                                                                                                        |
| `models/SharedModel.js`                                    | `SharedModel.celestial`                                                                                             | Internal                                                          | Replace it with a `celestialSources` accessor over `profile.models.celestialSources`; do not retain independent mutable model state.                                                                                                       |
| `shader/Algorithm32ShaderAssembler.js`                     | `Algorithm32ShaderAssembler` celestial slots                                                                        | Internal                                                          | Adapt deterministic slots into the reconciled assembler owner.                                                                                                                                                                             |
| `shader/types.d.ts`                                        | `ShaderSourceSlot` changes                                                                                          | Internal                                                          | Add named celestial query/raster/composition slots at the reconciled ambient owner.                                                                                                                                                        |
| `three/ThreeCacheBackend.js`                               | `ThreeCacheBackend` value-key behavior                                                                              | Atmospheric-cache implementation evidence                         | Keep the cache backend out of stellar screen generation. Reuse only general private-handle/state-restoration/cleanup patterns in the standard rendering-runtime Three owner.                                                               |
| `transport/Algorithm32Transport.js`                        | `Algorithm32Transport` celestial composition requirements                                                           | Internal                                                          | Own separate celestial state and the exact one-time pre-Color addition.                                                                                                                                                                    |
| `types/Color.d.ts`                                         | `Color` sky/adaptation surface                                                                                      | Deferred capability                                               | Do not port candidate delta.                                                                                                                                                                                                               |
| `types/types.d.ts`                                         | HDR `SceneDisplayCompositionRequest` change                                                                         | Deferred public-contract replacement                              | Keep the established production request name and color-space contract. The renderer target may carry HDR values; no candidate sky-adaptation API or replacement public shape is promoted.                                                  |

Every one of the 48 file rows and every candidate top-level export is covered.
Existing exports keep their current visibility unless the table identifies the
candidate change as deferred. No candidate symbol is implicitly accepted by
omission.

## Required Capability Envelopes

The spherical family accepts only:

- `spherical-sun-stars-radial-v1` with `SphericalEarthGeometry`;
- exactly one `DistantSunCelestialSource`, which is the configured
  `DistantSunLightSource` object and exposes one immutable derived definition;
- zero stars during the bounded Sun-first intermediate, then exactly the
  reviewed 500-member epoch-anchored `StellarPointSetCelestialSource`, with
  catalog directions transformed by construction-time latitude/longitude and
  observation-time offset from the catalog epoch, for completed promotion;
- canonical native-15 spectral packets, a shader-built unsigned-integer screen
  matrix, and a shader-built entry-major `R32F` palette;
- geometry-owned receiver and distant-Sun live updates inside the declared
  spherical domain;
- additive Sun/star composition with no celestial foreground graph; and
- normal Algorithm32 facade, ShaderBuilder, shader-handle, and Three runtime
  installation.

The mandatory Flat/local family accepts only:

- `flat-local-finite-sun-v1` with `FlatEarthGeometry`;
- exactly one `FiniteLocalSunCelestialSource`, which is the configured
  `LocalSunLightSource` object and exposes one shared
  `FiniteLocalSunSourceDefinition`;
- unit-bearing physical radius and center height plus one native-15 uniform
  surface-radiance packet;
- one geometry-owned model-frame center derived during construction from the
  configured time/location and semantic subsolar placement; any change creates
  a complete successor geometry, facade, scene, and cache set;
- exact finite-disk ray support and apparent solid angle;
- source-to-receiver atmosphere transport ending at the finite body;
- direct illumination derived from the same radiance by integration over the
  receiver-visible solid angle, without a second inverse-square multiplier;
- a scalar R32F resource and source-family controller lifecycle inside the
  complete shader/scene transaction; and
- normal Algorithm32 facade, ShaderBuilder, shader-handle, and Three runtime
  installation with matched scene visibility.

The ingress rejects missing or incompatible capability interfaces, a roster
Sun that is not the exact configured light-source object, cross-family
roster/geometry combinations, a distant source in Flat/local configuration, a
finite source in the spherical family, independently scaled visible and
atmospheric Suns, a local-center height that conflicts with the static source
definition, Moon or other bodies, opacity, mutual ordering, eclipses, profiled
disks, dynamic stellar member rosters, unsupported source counts, non-native
stellar packets, camera state inside an atmospheric-field identity, omission of
camera/time/location from the stellar screen-product identity, and any
configured-but-missing cache or geometry-derived construction state.

## Step 1 Review Closure

The review confirms:

- all 48 candidate-delta files and their exports are classified;
- `LegacyConfig.celestialSources` is the sole top-level public configuration
  name and complete profiles retain the same roster at
  `models.celestialSources`;
- every public type and method has one canonical ambient owner;
- every internal source, geometry, cache, assembly, runtime, and composition
  contract has an exact production owner;
- every relevant input is classified as rebuild, live refresh, renderer-only,
  Color-only, exact zero, or rejection;
- failure, caller cancellation, supersession, exact reuse, atomic replacement,
  last-valid preservation, context-loss boundary, and idempotent disposal are
  explicit; and
- the spherical and mandatory Flat/local family envelopes and all remaining
  deferred capabilities are explicit.

No production source changed while completing this contract. Step 1 is
complete. The next authorized plan item is Step 3, which may add the typed
optional production seams defined here; it still may not wholesale-copy the
candidate tree.
