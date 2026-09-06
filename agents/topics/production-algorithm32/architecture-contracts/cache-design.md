# Algorithm32 Cache Interface Design

Focus: Public engine capabilities, ownership, and dataflow.

Related owners: [caches](../caches/cache-design.md), [engineering-studies](../../poc-experiments/engineering-studies/cache-design.md), [product-behavior](../../production-app/product-behavior/cache-design.md).

## Boundary Overview

```text
Algorithm32AtmosphereComposer
  creates ThreeCacheBackend from its renderer
        |
        v
Algorithm32 / ShaderBuilder
  asks lightSource for one runtime-owned CacheController
        |
        v
source-specific CacheController
  accepts createScatteringCache(request)
  derives executable domains, options, and CacheBuildPlan
  compares a private plan/backend-capability reuse key
        |
        +--> source.createCacheModule(context)
        +--> atmosphere.createCacheModule(context)
        +--> geometry.createCacheModule(context)
        +--> ground.createCacheModule(context), when present
        +--> generic transport/cache modules
        |
        v
CacheGpuExecutor
  CachePassAssembler -> CacheShader -> CacheGpuBackend
        |
        v
CacheBuildArtifact
  cumulative GpuCacheField + opaque runtime binding + diagnostics + disposal
        |
        v
source-specific GpuScatteringCache
  runtime ShaderContribution + opaque runtime binding + disposal
```

Construction assembly and final-view runtime assembly are distinct. The
existing `Algorithm32ShaderAssembler` remains the view/runtime assembler. It
must not become the cache-pass assembler because its camera, scene-depth,
endpoint, and display concerns do not exist during cache construction.


## Public Cache Capabilities

The common cache interface owns lifecycle only. The CPU oracle capability adds
synchronous resolved sampling and physical sample provenance; the GPU
capability instead exposes final-view assembly and opaque bindings without
readback. The common lifetime surface and CPU/GPU capabilities are therefore
separated.

```ts
interface ScatteringCache {
	/** Release resources owned by this cache. Repeated disposal is safe. */
	dispose(): void;
}

interface CpuScatteringCache extends ScatteringCache {
	/** Identify the physical provenance of returned spectral samples. */
	readonly sampleProvenanceIdentity: string;

	/** Sample the CPU oracle from already-resolved physical stencils. */
	sampleResolved(request: ScatteringCacheSampleRequest): SpectralScatteringDensityPacket;
}

interface GpuScatteringCache extends ScatteringCache {
	/** Contribute source-specific final-view lookup and runtime bindings. */
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];

	/** Return opaque bindings for the privately owned cumulative field. */
	getRuntimeBindings(): CacheRuntimeBindings;
}
```

`GpuScatteringCache` exposes no synchronous sampler. Parity and diagnostic
reads use the backend's selected-scalar probe seam and never masquerade as
normal runtime sampling.


## Source-Owned Controller And Factory

`LightSourceModel.createIncidentRadianceCache` is replaced directly. No alias,
fallback reader, old/new switch, or compatibility translation remains.

A configured light-source model may be shared by more than one Algorithm32
instance or renderer. It therefore must not store one global active GPU cache.
The source creates one controller per Algorithm32/runtime attachment. That
source-specific controller owns direct reuse-key comparison, staging
generations, active publication, failure isolation, and disposal for exactly
one consumer.

```ts
interface LightSourceModel {
	readonly id: string;

	createCacheController(request: CacheControllerRequest): CacheController;

	// Existing direct-lighting, source-path, endpoint-lighting, and runtime
	// contribution surfaces remain until separately superseded.
}

type CacheControllerRequest = Readonly<{
	backend: CacheGpuBackend;
	scheduler?: CacheBuildScheduler;
}>;

interface CacheController {
	readonly active: GpuScatteringCache | null;

	createScatteringCache(request: ScatteringCacheBuildRequest): Promise<GpuScatteringCache>;

	dispose(): void;
}
```

The public request supplies physical collaborators and execution capability,
not source-owned cache internals:

```ts
type ScatteringCacheBuildRequest = Readonly<{
	atmosphere: AtmosphereModel & CacheBuildContributor;
	geometry: GeometryModel & CacheBuildContributor;
	groundBoundary?: (GroundBoundary & CacheBuildContributor) | null;
	spectralBasis: SpectralBasis;
	maximumScatteringOrder?: SupportedCacheScatteringOrder;
	signal?: AbortSignal;
}>;
```

The controller defaults an absent `maximumScatteringOrder` to 4. The
source-specific controller, not the caller, derives:

- one coherent executable position/incoming/outgoing domain selection;
- direct pure and cumulative field ids with `CacheFieldStorage`;
- source-owned GPU addressing facts consumed by contributed modules;
- direct `CacheConstructionOptions`;
- the source-specific `J1` and direct `L1` operations;
- the complete N1, N2, or N4 pass graph; and
- one `CacheBuildPlan.identity` over direct graph and source-specific reuse
  facts, followed by the controller-private reuse key that also includes
  backend capabilities.

The retired request properties `field`, `incomingDirectionDomain`, `controls`,
and `gpu: unknown` are not retained.


## Owner Contribution Capability

The cache build uses one structural capability rather than separate long
provider-interface names for atmosphere, geometry, source, and ground.

```ts
interface CacheBuildContributor {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
}
```

The build request uses intersections with the existing domain interfaces.
This keeps `AtmosphereModel`, `GeometryModel`, and `GroundBoundary` focused on
their CPU/runtime contracts while making the stronger GPU construction
capability mandatory exactly where it is consumed.

`createCacheModule` is separate from the existing runtime
`createShaderContribution`. A cache module directly declares construction
GLSL, bindings, and packed physical data for provider-neutral pass assembly.
Its `provides` and `requires` are consumed by `CachePassAssembler`, and its
`contentHash` remains an active deterministic module-order,
assembled-shader, plan, and reuse input. It never receives or returns `THREE`,
a renderer, a camera, a composer, a scene, a material, a render target, or a
live texture.

The source-owned planner calls only the contributors relevant to a pass; an
owner does not manufacture empty modules for unrelated passes.

| Pass                           | Required ownership                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `primary-j1`                   | source, atmosphere, geometry, concrete cache layout                                                       |
| `direct-l1`                    | source, atmosphere, geometry, concrete cache layout                                                       |
| `scatter`                      | atmosphere, geometry/framing, generic cache operations, concrete cache layout, and ground when applicable |
| `transport` spherical/distant  | geometry-owned packed transport kernel and accessors, `CacheOperations`, and distant cache layout         |
| `transport` Flat/local         | Flat geometry rays/stencils, atmosphere extinction, `IntegratedCacheTransport`, and local cache layout    |
| `accumulate`                   | generic cache operations and concrete cache layout                                                        |

The canonical black-ground module supplies the declared zero-reflection seam
for applicable passes. A reflective boundary replaces that module directly;
each contributed module carries its own direct `contentHash`, while the plan's
source-specific reuse facts record the selected boundary's direct `id` or
`null`. Neither changes generic pass ownership.

The atmospheric source owns the construction source direction. Geometry-owned
frame and path shader operations accept that direction as an argument; a
geometry module does not publish a second source-direction binding. This keeps
flat/spherical substitution behind the geometry capability while preventing
contradictory duplicated direction state.

For spherical/distant N4, the planner asks geometry once to resolve and pack
the selected construction rays and interpolation taps. That request supplies
the atmosphere's accepted `sampleMedium` capability, the source-owned physical
direction to the source, and the accepted interval count. Geometry returns
one `CacheTransportData` value, and the planner places that same value in both
transport contexts. The geometry module binds its source addresses and
atmosphere-dependent `T * ds * interpolation` coefficients;
`CacheOperations` applies those coefficients to the pure input field, and the
distant layout supplies field addressing.

For Flat/local N4, the planner constructs no transport table. Each transport
pass contains Flat geometry, canonical atmosphere,
`IntegratedCacheTransport`, and the local layout. Geometry reconstructs the
physical ray and z/rho/W stencils, atmosphere evaluates extinction at each
path point, the layout reads the pure input field, and the integrated
operation accumulates the selected 15-interval path directly in the fragment
shader. The source does not participate in either later-order transport pass.


## Trusted Polymorphic Composition

Source kind and geometry kind remain private implementation choices behind
their interfaces. Generic cache code trusts the ambient/JSDoc contract of each
object and the values constructed by production owners. The source-owned
planner creates the accepted graph, the assembler mechanically orders and
emits its modules, the executor schedules that graph, and the backend realizes
the supplied executable `CacheFieldStorage` facts.

Runtime type checks do not repeat interface shape, trusted contract contents,
module ownership, symbol namespaces, binding types, pass compatibility, or
identity agreement at those internal seams. Executable domain owners,
`CacheFieldSpec`, `CacheBuildModule`, `CacheBuildPlan`, and backend handles are
consumed directly; no parallel owner snapshot or structural metadata packet
proves that they are executable.

The genuine public cache request boundary validates only externally supplied
semantic values and ranges, such as the requested scattering order. The Three
adapter also checks live renderer capabilities and opaque resource
ownership/lifetime because those conditions exist only at runtime. Accepted
internal values and repository constants are trusted thereafter.

Generic cache components may not contain behavior such as:

```js
if (source.kind === 'distant') {
	/* ... */
}
if (source.kind === 'local') {
	/* ... */
}
if (geometry.kind === 'spherical') {
	/* ... */
}
if (geometry.kind === 'flat') {
	/* ... */
}
if (geometry instanceof SphericalEarthGeometry) {
	/* ... */
}
```

A concrete source validates externally supplied radiometry and source values
at its public configuration boundary, then constructs its primary-field
mapping, domains, controller, and modules from trusted values. A concrete
geometry does the same for externally supplied coordinates and bounds. Their
direct ids may participate in the owning plan's reuse facts or diagnostics;
generic code does not select algorithms from those ids.

Consequently, adding the local Sun or flat geometry supplies new concrete
modules, executable domains, and cache classes behind the same interfaces.
It does not add a local/distant or flat/spherical branch to generic assembly,
recurrence, execution, or runtime sampling.
