# Algorithm32 Cache Interface Design

Focus: Cache construction, storage, reconstruction, loading, and optimization.

Related owners: [engineering-studies](../../poc-experiments/engineering-studies/cache-design.md), [architecture-contracts](../architecture-contracts/cache-design.md), [product-behavior](../../production-app/product-behavior/cache-design.md).

## Authority And Scope

This document owns the production cache's software interfaces, assembly
boundaries, renderer-adapter boundary, concrete class roles, and the software
realization of resource lifecycle. The
[selected cache contract](cache-contract.md) is the umbrella authority for
field meaning, recurrence, frozen numerical domains, construction options,
ground participation, invalidation semantics, runtime calculation, and
completion-evidence categories. The
[spatial reconstruction contract](spatial-reconstruction.md) owns the exact
final-view position lookup and its evidence. The
[outgoing reconstruction contract](outgoing-reconstruction.md) owns the exact
W27 direction lookup and its evidence. The
[shared-block optimization design](distant-sun-cache-optimization-design.md)
owns the promoted distant-Sun representation and runtime adaptation; its
[rollout record](../../../../archives/topics/production-algorithm32-release-20260911/agents/topics/production-algorithm32/caches/shared-runtime-rollout.md) owns current deployment selection.
The earlier [solar-zenith cache design](solar-zenith-cache-design.md) remains
the numerical point-local representation owner. Its
[distant-Sun execution plan](../../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/cache/distant-sun-solar-zenith-cache-plan.md) owns the
contained phase order and evidence gates. The
[production implementation plan](../architecture-contracts/production-implementation-plan.md)
owns delivery order and implementation status.

This document consumes those numerical contracts; it does not restate or
replace them. Interface examples below describe how accepted calculations are
assembled and owned, not an independent numerical specification.
The explicitly labeled flat/local proposal is a research design only. If it is
promoted, its selected numerical facts move to the cache contract and a
flat/local reconstruction authority rather than becoming normative here by
proximity to the accepted interfaces.

The design retains the accepted production algorithms and logical data shapes.
It does not retain the retired experiment's API shape, raw Three.js resource
exposure, CPU-uploaded primary fields, or manual browser-harness lifecycle.


## Implementation Status

The executable staging surface through Stage 5 is complete and accepted. It
includes the
ambient contracts, common/CPU/GPU capability split, direct CPU-cache rename,
deterministic assembler, trusted typed executor, executable
`CacheFieldStorage` allocation facts, bounded probes, shared black-ground
module, opaque Three/WebGL2 backend, source-owned primary `J1` and direct
`L1`, generic scatter/transport/accumulation programs, and exact N1, N2, and
N4 plans. Spherical/distant N4 reuses one geometry-packed,
atmosphere-dependent transport kernel through `CacheOperations`. Flat/local
N4 instead reconstructs rays and stencils and evaluates extinction directly
inside both GPU transport passes through `IntegratedCacheTransport`; it
constructs and uploads no packed transport kernel. Neither plan produces
`L4`. The executor records exact logical field and packed-data payloads as
unit-bearing byte values while releasing every non-result field after its
final consumer.

The accepted software-renderer evidence covers exact N1 copy, bit-identical
shared N2/N4 values, selected-only readback, result-only retention, and
cleanup under the unchanged predeclared bounds. The
[baseline import status](../architecture-contracts/baseline-import-status.md) owns the
exact comparison counts, observed error, and artifact-memory results. Exact
literal pinning of the ordinary Fibonacci-34 parent data plus deterministic
reflection completion gives Node and browser runtimes the same current
Fibonacci-68 executable vectors and weights.

That software-renderer result establishes staging-path conformance, not
supported-hardware performance. Hardware timing and resource budgets remain
open.

The Stage 6/7 controller and runtime surface is present. `DistantSunCache`
owns one completed artifact, `DistantSunCacheController` owns one assembler,
executor, serialized generation stream, direct plan/backend-capability reuse
key, and atomically published active cache, and the public build request
carries only physical collaborators, basis, order, and cancellation. Focused Jasmine
coverage establishes exact reuse, changed-owner rebuilds, independent
controllers, complete N1/N2/default-N4 publication, failure preservation,
external cancellation, A-to-B-to-A supersession, and exactly-once owned-result
disposal without backend disposal.

`createCacheController` is the one public source cache factory. `ShaderBuilder`
awaits its cumulative cache, consumes the cache-owned final-view contribution,
and asks the backend to install the opaque binding. The composer owns the
backend after every attachment that uses it. CPU and shader final-view paths
receive geometry-resolved Native-48 and W27 stencils and perform one cumulative
lookup per path point; no incident-cache API, CPU upload, direct-view term, or
compatibility path remains.

Stage 9 also implements the separate `LocalSunCpuCache`, `LocalSunCache`, and
`LocalSunCacheController` through the same generic recurrence, executor,
backend, publication, and runtime boundaries. Its selected position domain is
the scaled 19-by-15 `z`/source-subpoint-`rho` grid. For the qualified 100 km by
4.8 Mm case, its current production realization has 285 position nodes,
9,690 transport output queries, 74,795,400 resident bytes, zero packed
transport bytes, 63,024 peak packed auxiliary bytes, and 224,386,200 peak
tracked logical bytes in the selected software-renderer proof. The
[flat/local promotion register](unresolved-research.md) owns the
selection, exact evidence, and claim limits.


## Design Goals

The interface must make these facts structural:

- the atmospheric light source owns the complete cache design, primary `J1`
  and direct `L1`, selected executable domains, direct field storage, and build
  graph, while its per-runtime controller owns reuse-key comparison, staging,
  and atomic publication for one consumer;
- atmosphere, geometry, ground, source, and generic transport contribute only
  the construction behavior they own;
- generic construction depends only on typed interface contracts and
  executable field/storage facts; it never asks whether a source is local or
  distant or whether geometry is flat or spherical;
- the generic recurrence accepts only a pure preceding field and never a
  cumulative field;
- the JavaScript executor owns pass and wavelength-layer orchestration while
  GPU programs perform the field work;
- Three.js and WebGL remain behind one renderer adapter;
- normal construction performs no full CPU readback;
- the CPU implementation remains an oracle rather than a second production
  construction strategy;
- failed, cancelled, or superseded staging work cannot damage the active
  cache; and
- the final runtime retains only the cumulative GPU field.


## Packed Transport Data Seam For Spherical/Distant

The spherical/distant packed kernel crosses one explicit
provider/request/context seam:

```ts
type CacheTransportData = Readonly<{
	queryCount: number;
	tapCount: number;
	sources: CacheData;
	coefficients: CacheData;
}>;

type CacheTransportDataRequest = Readonly<{
	atmosphere: Pick<AtmosphereModel, 'sampleMedium'>;
	domains: CacheConstructionDomains;
	directionToSource: UnitVector3;
	intervalCount: number;
}>;

interface CacheTransportDataProvider {
	createTransportData(request: CacheTransportDataRequest): CacheTransportData;
}
```

For spherical/distant construction, queries are position-major over the
Native-48 position nodes and current reflection-completed Fibonacci-68
radiance directions. `sources` has
shape `[tapCount * 3, queryCount]` and stores, per tap, the W27 source-direction
index, Native-48 source-position index, and active flag. `coefficients` has
shape `[tapCount, queryCount, 15]` and stores the wavelength-major spectral
transport coefficient in meters. Both are scalar `CacheData`; the backend
privately realizes their `sampler2D` and `sampler2DArray` resources.

For the spherical/distant plan, `CacheTransportData` is direct executable
construction input. Its `sources`
and `coefficients` are `CacheData` values whose retained `contentHash` values
identify their normalized packed content for module and plan reuse. The
provider owns ray bounds, retained construction lookup, W27 stencils, path
integration, and packing. The source-owned planner owns when the provider is
called and which pass contexts receive the returned kernel. The generic
transport operation owns only the packed-tap loop and scalar field
read/accumulation; the assembler, executor, and backend do not reconstruct
physical transport.

This fixed maximum-tap representation remains selected only for
spherical/distant transport. Flat/local has no production
`CacheTransportData`; its completed indexed interim is retained only as
sealed transition evidence and must not be confused with the proposed
addition of a map-relative physical invariant.

The distant-source plan request reflects this requirement without burdening
smaller graphs: N1 and N2 require a `CacheBuildContributor` geometry, while N4
requires `CacheBuildContributor & CacheTransportDataProvider` and an
atmosphere that supplies both construction modules and `sampleMedium`.


## Build Module Contract

```ts
type CacheBuildOwner = 'lightSource' | 'atmosphere' | 'geometry' | 'ground' | 'transport' | 'cache';

type CachePassKind = 'primary-j1' | 'direct-l1' | 'scatter' | 'transport' | 'accumulate';

type CacheOrder = 1 | 2 | 3 | 4;

type CacheShaderPhase = 'declare' | 'function' | 'main';

type CacheShaderBlock = Readonly<{
	id: string;
	phase: CacheShaderPhase;
	order: number;
	source: string;
}>;

type CacheBindingKind = 'uniform' | 'data' | 'define';
type CacheBindingFrequency = 'build' | 'pass' | 'layer';

type CacheData = Readonly<{
	id: string;
	quantity: string;
	units: string;
	shape: readonly number[];
	values: readonly number[];
	contentHash: string;
}>;

type CacheBindingValue = number | boolean | UnitValue | Position | UnitVector3 | SpectralPacket | CacheData;

type CacheBindingSpec = Readonly<{
	id: string;
	name: string;
	kind: CacheBindingKind;
	shaderType: string;
	frequency: CacheBindingFrequency;
}>;

type CacheBinding = CacheUniformBinding | CacheDataBinding | CacheDefineBinding;

type CacheBuildModule = Readonly<{
	id: string;
	owner: CacheBuildOwner;
	provides: readonly string[];
	requires: readonly string[];
	blocks: readonly CacheShaderBlock[];
	bindings: readonly CacheBinding[];
	contentHash: string;
}>;
```

Bindings are declarative and typed. The ambient `CacheUniformBinding`,
`CacheDataBinding`, and `CacheDefineBinding` variants pair each shader type and
frequency with the value it accepts. Bare numbers and booleans are limited to
dimensionless/discrete shader values; durable physical scalars use
unit-bearing `UnitValue` contracts, and property names do not encode units. The
backend normalizes accepted values to its canonical scalar representation
once at the CPU/GPU boundary. A binding never exposes a Three.js texture or
WebGL enum through this contract. `CacheData` is normalized packed data, not a
renderer resource; its quantity, units, shape, and content identity remain
explicit. Backend-created textures or buffers that carry it stay private.

Modules use symbol provision and requirement sets so the assembler can derive
stable dependency order independently of contribution arrival order. The
source-owned graph supplies a complete, typed module set; the assembler does
not defensively revalidate those repository-owned definitions. `contentHash`
covers the module's blocks, binding specifications, and the stable content
identities of its values; object identity and contribution arrival order never
enter shader identity.

This retirement does not weaken physical spectral identity. Accepted
`SpectralBasis` and `SpectralPacket` content identities, compatibility checks,
semantics, units, and provenance remain owned by the spectral contracts and
enter cache construction wherever an executable consumer requires them.


## Field And Pass Contracts

Build plans refer to logical fields by source-owned ids. A field specification
contains only the direct allocation request and no live resource or parallel
field snapshot.

```ts
type CacheFieldId = string;

type CacheFieldStorage = Readonly<{
	format: 'R32F';
	width: number;
	height: number;
	layers: number;
}>;

type CacheFieldSpec = Readonly<{
	id: CacheFieldId;
	storage: CacheFieldStorage;
}>;

interface CacheConstructionDomains {
	readonly id: string;
	readonly positionDomain: PositionDomain;
	readonly positionNodes: readonly PositionDomainNode[];
	readonly positionCount: number;
	readonly incomingDirectionDomain: DirectionDomain;
	readonly incomingUnitVectors: readonly UnitVector3[];
	readonly incomingIntegrationWeights: SolidAngleWeights;
	readonly incomingDirectionCount: number;
	readonly outgoingDirectionDomain: DirectionDomain;
	readonly outgoingUnitVectors: readonly UnitVector3[];
	readonly outgoingDirectionCount: number;
	resolveOutgoingDirectionStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;
}

type CacheGroundReflection =
	| Readonly<{
			kind: 'direct-source';
	  }>
	| Readonly<{
			kind: 'pure-radiance';
			illumination: CacheFieldSpec;
	  }>;

type CacheBuildContext = Readonly<{
	kind: CachePassKind;
	order: CacheOrder;
	inputs: readonly CacheFieldSpec[];
	output: CacheFieldSpec;
	options: CacheConstructionOptions;
	domains: CacheConstructionDomains;
	/** Present when a direct-radiance pass executes an interval count. */
	pathIntervalCount?: number;
	/** Present only for a selected packed transport implementation. */
	transportData?: CacheTransportData;
	/** Present only when a reflective scatter pass consumes ground work. */
	groundReflection?: CacheGroundReflection;
}>;

type CachePass = Readonly<{
	id: string;
	kind: CachePassKind;
	order: CacheOrder;
	inputs: readonly CacheFieldId[];
	output: CacheFieldId;
	modules: readonly CacheBuildModule[];
}>;

type CacheBuildPlan = Readonly<{
	identity: CacheReuseIdentity;
	fields: readonly CacheFieldSpec[];
	passes: readonly CachePass[];
	result: CacheFieldId;
}>;
```

`CacheBuildContext` is the resolved view supplied to contributors while the
plan stores ids. The executor mechanically creates the field registry and
consumer counts required to run the trusted source-owned graph. Successful
execution returns the completed field and its runtime binding directly; it
does not construct a second cache-part declaration.

The plan's direct `CacheReuseIdentity` covers each logical field's `id` and
`storage`, every pass, and each participating module's `id`, `owner`, and
actively consumed `contentHash`. Source-specific planners add only demonstrated
reuse facts: the coherent domain-selection id, direct position/incoming/
outgoing domain-owner ids, and the selected ground-boundary `id` or `null`.
The controller then combines `plan.identity` with measured backend capabilities
in a private reuse key. The executor consumes the fields, passes, storage, and
modules directly; it does not recompute identity to validate them.

The source-owned planner, typed contracts, and focused graph tests make these
states unrepresentable in a production plan:

- a cumulative field entering `scatter` or `transport`;
- a density field entering `scatter` where pure radiance is required;
- a radiance field entering `accumulate`;
- mismatched position or spectral domains;
- assuming incoming and outgoing direction indices are identities; and
- producing `L4` for a requested N4 build.

`accumulate` has three valid shapes:

1. one pure `J1` input initializes `Jthrough1` for an N1 build;
2. pure `J1` and pure `J2` initialize `Jthrough2` for an N2 or N4 build; or
3. one cumulative `Jthrough(k-1)` input plus pure `Jk` produces
   `Jthroughk`.

These explicit cumulative outputs avoid relabeling a pure field as a
cumulative field, keep field roles truthful, and preserve the accepted
separate cumulative-add operation without adding an unnecessary N2/N4 copy.


## Plan Conformance To The Numerical Contract

The source-owned `CacheBuildPlan` translates the recurrence and requested N1,
N2, or N4 dependency graph defined in
[cache-contract.md](cache-contract.md#stored-quantity-and-recurrence) one for
one. The cache contract remains numerical authority; the tables below record
the exact software pass realization needed for assembly and resource
lifetime.

The ordered pass graphs are shown below. Field notation maps directly to the
concrete ids: `Jk` is `distant-sun-j{k}`, `Lk` is
`distant-sun-l{k}`, and `Jthroughk` is
`distant-sun-j-through-{k}`.

| Build | Pass id                                 | Kind         | Inputs            | Output      |
| ----- | --------------------------------------- | ------------ | ----------------- | ----------- |
| N1    | `distant-sun-primary-j1`                | `primary-j1` | none              | `J1`        |
| N1    | `distant-sun-accumulate-j1`             | `accumulate` | `J1`              | `Jthrough1` |
| N2    | `distant-sun-primary-j1`                | `primary-j1` | none              | `J1`        |
| N2    | `distant-sun-direct-l1`                 | `direct-l1`  | none              | `L1`        |
| N2    | `distant-sun-scatter-l1-to-j2`          | `scatter`    | `L1`              | `J2`        |
| N2    | `distant-sun-accumulate-j1-j2`          | `accumulate` | `J1`, `J2`        | `Jthrough2` |
| N4    | `distant-sun-primary-j1`                | `primary-j1` | none              | `J1`        |
| N4    | `distant-sun-direct-l1`                 | `direct-l1`  | none              | `L1`        |
| N4    | `distant-sun-scatter-l1-to-j2`          | `scatter`    | `L1`              | `J2`        |
| N4    | `distant-sun-accumulate-j1-j2`          | `accumulate` | `J1`, `J2`        | `Jthrough2` |
| N4    | `distant-sun-transport-j2-to-l2`        | `transport`  | `J2`              | `L2`        |
| N4    | `distant-sun-scatter-l2-to-j3`          | `scatter`    | `L2`              | `J3`        |
| N4    | `distant-sun-accumulate-j-through-2-j3` | `accumulate` | `Jthrough2`, `J3` | `Jthrough3` |
| N4    | `distant-sun-transport-j3-to-l3`        | `transport`  | `J3`              | `L3`        |
| N4    | `distant-sun-scatter-l3-to-j4`          | `scatter`    | `L3`              | `J4`        |
| N4    | `distant-sun-accumulate-j-through-3-j4` | `accumulate` | `Jthrough3`, `J4` | `Jthrough4` |

The N1 and N2 entries are complete plans, not prefixes that execute the N4
tail. N1 constructs no `L1`. N2 constructs no `L2`. N4 constructs no `L4`.
Every recurrence input is a pure field; no `JthroughN` field enters a scatter
or transport pass.

The plan representation adds only the storage/publication `accumulate`
operations shown above. Those operations initialize or extend cumulative
storage; they are not scattering orders. Positive graph tests establish this
structure without downstream structural revalidation.

Lifetimes follow the exact ordered consumer lists. In N1, `J1` is released
after `distant-sun-accumulate-j1`, and `Jthrough1` is retained. In N2, `L1` is
released after `distant-sun-scatter-l1-to-j2`; `J1` and `J2` are released after
`distant-sun-accumulate-j1-j2`; and `Jthrough2` is retained.

For N4, the executor applies these last-consumer releases:

| Completed pass                          | Fields released after the pass | Field retained or still live |
| --------------------------------------- | ------------------------------ | ---------------------------- |
| `distant-sun-scatter-l1-to-j2`          | `L1`                           | `J1`, `J2`                   |
| `distant-sun-accumulate-j1-j2`          | `J1`                           | `J2`, `Jthrough2`            |
| `distant-sun-transport-j2-to-l2`        | `J2`                           | `Jthrough2`, `L2`            |
| `distant-sun-scatter-l2-to-j3`          | `L2`                           | `Jthrough2`, `J3`            |
| `distant-sun-accumulate-j-through-2-j3` | `Jthrough2`                    | `J3`, `Jthrough3`            |
| `distant-sun-transport-j3-to-l3`        | `J3`                           | `Jthrough3`, `L3`            |
| `distant-sun-scatter-l3-to-j4`          | `L3`                           | `Jthrough3`, `J4`            |
| `distant-sun-accumulate-j-through-3-j4` | `Jthrough3`, `J4`              | retained result `Jthrough4`  |

`Jthrough4` has no consumers and is the only field transferred to the
successful artifact. Physical pooling may reuse released resources, but it
cannot change this logical graph or extend a field's ownership. The executor
allocates each pass output before releasing that pass's last-use inputs, so
memory diagnostics include that transition peak.


## Construction Shader Assembly

```ts
type CacheShader = Readonly<{
	id: string;
	source: string;
	sourceHash: string;
	bindings: readonly CacheBinding[];
	output: CacheFieldSpec;
}>;

interface CacheAssembler {
	assemble(pass: CachePass, output: CacheFieldSpec): CacheShader;
}

class CachePassAssembler implements CacheAssembler {
	assemble(pass: CachePass, output: CacheFieldSpec): CacheShader;
}
```

The executor resolves the pass's logical output id through its field registry
and supplies that trusted `CacheFieldSpec` to the assembler. The assembler
orders the source-owned modules, emits one complete construction fragment
shader, and records its stable identity. It does not revalidate owner symbols,
binding types, or repository constants. It also does not resolve plan ids,
allocate resources, compile renderer programs, submit work, read results, or
manage cache lifecycle. `CacheBuildModule` is the direct provider declaration
consumed here; there is no nested assembly packet. The fullscreen vertex
shader may remain a backend/executor constant because it carries no physical
ownership.

The renderer backend owns the GLSL version directive because it also owns the
rendering API and vertex shader. `CachePassAssembler` owns construction define
emission so define literals participate directly in deterministic source
identity; the backend consumes those typed bindings and does not emit a second
define.


## GPU Backend

The backend is the only cache-construction surface that knows the rendering
API. Physics-facing objects never accept raw Three.js or WebGL objects.

```ts
interface GpuCacheField {
	readonly id: CacheFieldId;
	readonly storage: CacheFieldStorage;
	readonly backendId: string;
	dispose(): void;
}

interface CacheGpuProgram {
	readonly id: string;
	readonly sourceHash: string;
	dispose(): void;
}

type CacheLayerSubmission = Readonly<{
	program: CacheGpuProgram;
	inputs: readonly Readonly<{
		id: CacheFieldId;
		field: GpuCacheField;
	}>[];
	output: GpuCacheField;
	layer: number;
	bindings: readonly CacheBinding[];
}>;

interface CacheRuntimeBinding {
	readonly id: string;
	readonly valueKey: 'cache.cumulativeScatteringDensity';
	readonly fieldId: CacheFieldId;
	readonly backendId: string;
}

type CacheRuntimeBindings = Readonly<{
	backendId: string;
	bindings: readonly CacheRuntimeBinding[];
}>;

type CacheRuntimeBindingInstallRequest = Readonly<{
	bindings: CacheRuntimeBindings;
	uniforms: Record<string, {value: unknown}>;
}>;

type CacheGpuCapabilities = Readonly<{
	id: string;
	api: string;
	scalarFormat: 'R32F';
	supportsArrayRenderTargets: boolean;
	supportsFloatSampling: boolean;
	maximumTextureSize: number;
	maximumArrayLayers: number;
}>;

type CacheProbeRequest = Readonly<{
	field: GpuCacheField;
	coordinates: readonly DirectionalSpectralFieldCoordinates[];
}>;

type CacheProbe = Readonly<{
	field: CacheFieldId;
	coordinates: readonly DirectionalSpectralFieldCoordinates[];
}>;

interface CacheProbeReader {
	readSelectedScalars(request: CacheProbeRequest): Promise<CacheProbeResult>;
}

type CacheProbeResult = Readonly<{
	fieldId: CacheFieldId;
	samples: readonly Readonly<{
		coordinates: DirectionalSpectralFieldCoordinates;
		value: number;
	}>[];
}>;

interface CacheGpuBackend {
	readonly id: string;
	readonly capabilities: CacheGpuCapabilities;

	allocateField(field: CacheFieldSpec): GpuCacheField;

	compile(shader: CacheShader): CacheGpuProgram | Promise<CacheGpuProgram>;

	/** Submit one layer and restore every renderer state value before returning. */
	submitLayer(request: CacheLayerSubmission): void;

	createRuntimeBinding(field: GpuCacheField): CacheRuntimeBinding;

	installRuntimeBindings(request: CacheRuntimeBindingInstallRequest): void;

	dispose(): void;
}
```

`GpuCacheField`, `CacheGpuProgram`, and `CacheRuntimeBinding` are opaque
renderer-neutral handles. A field exposes only its direct logical id,
executable storage facts, and owning backend id without exposing its resource.
A runtime binding exposes its binding id, shader value key, logical field id,
and backend id. A Three implementation may privately hold an R32F array target,
texture, material, scene, and camera; none cross this interface.

The backend checks the live renderer's required WebGL2, R32F array-target,
sampler, size, layer, and precision capabilities when that external runtime
enters the adapter. Allocation and submission then use `CacheFieldStorage`,
not a second field description. Every `submitLayer` call captures and restores
renderer state internally, including failure paths; the renderer-neutral
executor relies on that state-neutral contract. A controller's direct reuse
key includes the complete measured capability value because it can change plan
realization.

Real Three/WebGL conformance is exercised through the standalone browser lane
owned by the [testing topic](../qualification/testing-contract.md). That lane tests the
backend and executor against an actual browser renderer without making the
browser harness part of the production cache interface.

`CacheProbeReader` is a separate optional diagnostic capability. A concrete
Three adapter used by diagnostics may implement both interfaces, but
`ScatteringCacheBuildRequest` and normal construction accept only
`CacheGpuBackend`. This prevents production execution from acquiring a
readback dependency accidentally. The probe reads only declared scalar
coordinates; there is no full-field readback method. A diagnostic request
declares a logical `CacheProbe` by field id before execution. The executor
resolves it to a live-field `CacheProbeRequest` immediately after the producing
pass and before that field's last-consumer release.


## GPU Executor

```ts
type CacheExecutionOptions = Readonly<{
	scheduler?: CacheBuildScheduler;
	signal?: AbortSignal;
	probeReader?: CacheProbeReader;
	probes?: readonly CacheProbe[];
}>;

interface CacheBuildScheduler {
	/** Yield at an executor-declared safe boundary. */
	yieldControl(): Promise<void>;
}

type CachePassDiagnostic = Readonly<{
	id: string;
	submissionDuration?: Duration;
	probe?: CacheProbeResult;
}>;

type CacheBuildMemoryDiagnostics = Readonly<{
	peakFieldStorage: UnitValue<'bytes'>;
	peakPackedDataStorage: UnitValue<'bytes'>;
	peakTrackedStorage: UnitValue<'bytes'>;
	residentFieldStorage: UnitValue<'bytes'>;
}>;

type CacheBuildDiagnostics = Readonly<{
	passes: readonly CachePassDiagnostic[];
	memory: CacheBuildMemoryDiagnostics;
}>;

type CacheBuildArtifact = Readonly<{
	result: GpuCacheField;
	runtimeBindings: CacheRuntimeBindings;
	diagnostics: CacheBuildDiagnostics;
	dispose(): void;
}>;

class CacheGpuExecutor {
	constructor(
		request: Readonly<{
			backend: CacheGpuBackend;
			assembler: CacheAssembler;
		}>,
	);

	execute(plan: CacheBuildPlan, options?: CacheExecutionOptions): Promise<CacheBuildArtifact>;

	dispose(): void;
}
```

The executor owns:

- dependency order;
- shader assembly and compilation;
- logical-field to live-resource mapping;
- the JavaScript pass loop;
- the JavaScript wavelength-layer loop;
- staging resource cleanup;
- last-consumer release and pooling;
- cancellation checks and cooperative scheduler yields;
- selected-value probe requests;
- exact logical field, packed-data, tracked-peak, and resident byte
  diagnostics; and
- reliance on the backend's state-neutral submission contract.

The GPU program owns the parallel position/direction work and its declared
incoming-direction or path-tap loop. The JavaScript executor never loops over
individual cache positions, directions, or spectral scalar values.

Memory diagnostics are required on every successful artifact. All four values
carry `units: "bytes"`; the property names identify the measurement rather
than encoding a unit. `peakFieldStorage` is the maximum sum of live logical
R32F field payloads, including the transition where a pass output has been
allocated but its final-use inputs have not yet been released.
`peakPackedDataStorage` is the maximum scalar `CacheData` payload bound by one
pass. `peakTrackedStorage` is the maximum, evaluated per pass, of live field
payload plus that pass's packed data. `residentFieldStorage` is the completed
cumulative result's R32F payload.

These are exact logical payload counts: R32F and packed scalar data each count
four bytes per scalar. They do not claim renderer-driver allocation size and
exclude texture alignment, framebuffer/program objects, implementation
temporaries, and other backend overhead. Hardware performance acceptance may
supplement these required logical diagnostics with renderer-specific
measurements without changing this contract.

The artifact is the direct successful result: one cumulative `GpuCacheField`,
its opaque `CacheRuntimeBindings`, diagnostics, and idempotent disposal. It
does not publish a second cache-part description or construction snapshot.


## Concrete Production Classes

The existing CPU resident class is renamed directly. The old name is not kept
as an alias.

```ts
class DistantSunCpuCache implements CpuScatteringCache {
	constructor(buildResult: DistantSunCpuCacheResult);
	readonly sampleProvenanceIdentity: string;
	sampleResolved(request: ScatteringCacheSampleRequest): SpectralScatteringDensityPacket;
	dispose(): void;
}

class DistantSunCache implements GpuScatteringCache {
	constructor(artifact: CacheBuildArtifact);
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
	getRuntimeBindings(): CacheRuntimeBindings;
	dispose(): void;
}
```

`LocalSunCpuCache` exposes the same direct CPU capability and
`sampleProvenanceIdentity`. `LocalSunCache` exposes the same GPU capability and
additionally reports its source facts, boundary upload, zero-valued packed
transport metric, and executor memory through `LocalSunCacheResourceReport`.
Neither concrete cache
exposes a parallel cache snapshot. The nonresident CPU build results retain
their pure fields, final cumulative field, requested maximum order, and direct
`CacheConstructionOptions`; the resident CPU caches retain only the cumulative
reader and its physical sample provenance.

The source exposes a controller factory and retained CPU oracle operations;
plan construction remains a source-owned implementation detail of the
controller.

```ts
class DistantSunLightSource implements LightSourceModel {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;

	createCacheController(request: CacheControllerRequest): DistantSunCacheController;

	buildCpuScatteringCache(request: DistantSunCpuCacheRequest): DistantSunCpuCacheResult;
}

class DistantSunCacheController implements CacheController {
	constructor(
		request: Readonly<{
			source: DistantSunLightSource;
			backend: CacheGpuBackend;
			scheduler?: CacheBuildScheduler;
		}>,
	);

	readonly active: DistantSunCache | null;

	createScatteringCache(request: ScatteringCacheBuildRequest): Promise<DistantSunCache>;

	dispose(): void;
}
```

The existing physical model classes gain the structural construction
capability while retaining their CPU and view/runtime surfaces:

```ts
class CanonicalAtmosphere implements AtmosphereModel, CacheBuildContributor {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
}

class SphericalEarthGeometry implements GeometryModel, CacheBuildContributor, CacheTransportDataProvider {
	createTransportData(request: CacheTransportDataRequest): CacheTransportData;
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
}
```

`UniformLambertianGroundBoundary` implements `CacheBuildContributor`. A null
boundary selects the canonical black-ground
module owned by the cache construction package; callers do not need a
placeholder ground object. A reflective ground supplies direct `id`, `model`,
and spectral `albedo` facts plus its executable BRDF/module behavior. The plan
records its `id`; omission remains `null` and has no synthetic content hash.

Generic scatter, packed transport, and accumulation modules are supplied by
the source-independent `CacheOperations` contributor. The separate
`IntegratedCacheTransport` contributor owns fused physical-path transport.
Neither contains a source-specific primary branch or selects behavior from a
source or geometry identity.

```ts
class CacheOperations implements CacheBuildContributor {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
}

class IntegratedCacheTransport implements CacheBuildContributor {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
}
```

The renderer adapter is concrete and isolated:

```ts
class ThreeCacheBackend implements CacheGpuBackend, CacheProbeReader {
	constructor(
		request: Readonly<{
			THREE: unknown;
			renderer: unknown;
		}>,
	);

	readonly id: string;
	readonly capabilities: CacheGpuCapabilities;
	allocateField(field: CacheFieldSpec): GpuCacheField;
	compile(shader: CacheShader): CacheGpuProgram;
	submitLayer(request: CacheLayerSubmission): void;
	createRuntimeBinding(field: GpuCacheField): CacheRuntimeBinding;
	readSelectedScalars(request: CacheProbeRequest): Promise<CacheProbeResult>;
	dispose(): void;
}
```


## Numerical Authority

The [selected cache contract](cache-contract.md) owns the retained production
algorithms and logical data shapes. This design maps that calculation into
production interfaces; it does not establish numerical authority from
interface examples. Current and future acceptance must follow the
[production conformance rules](../architecture-contracts/architecture-boundaries.md#algorithm-source-promotion-and-conformance)
with a newly selected independent authority in a new isolated evidence lane.
The retired Star source is historical only and is not an executable authority
or regression oracle.

The production software surface does not promote:

- raw `THREE`, renderer, target, texture, material, scene, or camera values in
  physics requests or cache results;
- caller-selected domains, layouts, options, or recurrence operations;
- a browser harness manually assembling source-owned order graphs;
- CPU-uploaded `J1` or `L1` as the production primary path;
- normal full-field readback;
- unit-bearing property suffixes;
- runtime `Object.freeze`; or
- compatibility aliases for the incident-radiance strategy.


## Lifecycle And Publication

Resource ownership follows this sequence:

1. The per-runtime source controller validates the external request's semantic
   values and ranges and chooses N1, N2, or default N4.
2. The controller creates a generation-scoped `CacheBuildPlan`, derives a
   private reuse key from `plan.identity` and backend capabilities, returns the
   active cache on equality, or starts a staging execution.
3. The executor owns every allocated staging field and program until success.
4. The executor releases pure/intermediate resources after their final
   consumer and returns one `CacheBuildArtifact` containing the completed
   cumulative field and its backend-created opaque runtime bindings.
5. The controller wraps the artifact in `DistantSunCache` only after the complete
   requested graph succeeds.
6. If the generation is still current, the controller atomically publishes the
   new cache and then disposes the previously active cache.
7. Failure, cancellation, or supersession disposes all staging resources and
   leaves the active cache usable.
8. `createScatteringCache` resolves only with the cache that became active. It
   never returns a partial or superseded cache.
9. Controller disposal cancels staging work and disposes its active cache.
   Source model disposal does not implicitly dispose another runtime's
   controller. Backend disposal remains the composer/renderer adapter's
   responsibility.

One controller-owned executor is intentionally single-flight. Each newer valid
request advances the generation, aborts the previous generation, and waits for
that execution to settle before starting replacement work. A superseded call
rejects with `AbortError`. This also covers active A, staging B, then requested
A: B is cancelled and the already-active A is returned after B has cleaned up.

Reuse-key equality may reuse only the current controller's active cache. The
key contains the direct `CacheBuildPlan.identity` and the complete measured
backend capability record. The plan identity already covers the result field
through its direct id/storage, every pass and module, the selected executable
domain ids, and the selected ground-boundary id or `null`. Source and
atmosphere values consumed by modules enter through those modules' retained
`contentHash`; packed `CacheData` bindings contribute their own retained
`contentHash`. The controller's per-backend scope supplies resource ownership,
so a process-local sequential backend id is not part of the key. Signals,
schedulers, cameras, objects, scene/display state, observer height, and legacy
incident-cache policy are not transport inputs. Executable fields, passes,
storage, modules, and backend handles continue to drive execution directly.


## Runtime Integration Surface

`ShaderSetupRequest` gains one typed property:

```ts
readonly cacheBackend: CacheGpuBackend;
```

`Algorithm32AtmosphereComposer` creates `ThreeCacheBackend` because it already
owns the renderer and Three namespace. It passes the backend into
`Algorithm32.setupShader` and disposes it after all caches using it have been
disposed.

Stage 7 extends the backend-owned runtime seam so the adapter installs an
opaque `CacheRuntimeBinding` into the renderer material/uniform target. The
public binding never exposes a Three texture, render target, or other raw
renderer resource.

`ShaderBuilder` creates and retains one source controller for its Algorithm32
runtime attachment, then remains asynchronous. Its configured-model path
changes from:

```text
create incident cache -> fill CPU coordinates -> upload CPU payload
```

to:

```text
await controller.createScatteringCache -> accept opaque runtime bindings and
the cache-owned ShaderContribution
```

The old `_buildSourceCreatedIncidentRadianceCache` and
`_createCacheTexturePayloads` path is removed. `ShaderResourceBuilder` no
longer uploads the production scattering cache from CPU arrays. The runtime
assembler consumes the GPU cache's ordinary `ShaderContribution`; it does not
receive the construction plan, pure fields, or backend programs.

Each shader result/handle attachment owns its controller and active cache.
Configuration replacement stages the next attachment first, preserves the
installed controller/cache if construction fails, and only after success
atomically swaps the attachment and disposes the previous controller/cache.
The composer-owned backend is disposed after every attachment using it.
`ExecutionConfig.maximumScatteringOrder` selects 1, 2, or 4 and defaults to 4.

The CPU reference path makes the same direct conceptual cutover: final-view
evaluation consumes cumulative values through `CpuScatteringCache` and does
not retain `IncidentRadianceSampling`, a direct-view term, or an incident-
direction loop. Direct-primary `L1` remains only the source-owned construction
seed. Generic reference/runtime code does not branch on distant/local source
kind or spherical/flat geometry kind.

Final-view shader reconstruction follows the same resolved-coordinate seam as
the CPU path. Geometry first produces one `AtmosphereCoordinate` for the view
ray sample. Atmosphere consumes that coordinate directly, and geometry derives
the actual-node position stencil and source-framed W27 direction stencil. The
concrete cache sampler accepts only those two stencils and owns only its fixed
direction/position/wavelength addressing; it does not receive a physical
position, source kind, geometry kind, domain-owner snapshot, or texture-derived
coordinate.

The CPU-facing geometry surface exposes those two resolved operations directly:

```ts
interface GeometryModel {
	resolveScatteringCachePositionStencil(
		request: ScatteringCachePositionStencilRequest,
	): ScatteringCachePositionStencil;

	resolveScatteringCacheDirectionStencil(request: ScatteringCacheDirectionRequest): ScatteringCacheDirectionStencil;
}
```

Generic final-view CPU transport does not import W27 or ask geometry only for an
intermediate source-frame direction. The shader contribution provides the
equivalent two stencil functions behind the same geometry ownership boundary.

Spherical geometry reconstructs altitude from the frame-updated
`geometry.cameraGroundRelativePosition` vector and the ray offset. That vector
is the model-space camera position minus the geometry-owned ground anchor
`bottomRadius * observerUpDirection`, normalized to meters before entering the
shader. The rationalized radial/transverse calculation does not subtract two
Earth-scale float32 radii, so submeter offsets at Native-48 nodes and former
boundaries remain representable. `geometry.cameraWorldPosition` remains the
physical ray origin; both values must describe the same camera frame.

Before observing Stage 7 output, check in the runtime parity policy covering
all Native-48 nodes, endpoint clamps, former altitude boundaries, W27 exact
nodes/interiors/seams/corners, completed rays, no-double-count behavior, and
N1/N2/N4 selection. This policy is runtime acceptance plumbing, not new
numerical research.


## Current Acceptance Boundary

The implemented staging surface follows these accepted decisions:

- the common/CPU/GPU cache split is accepted;
- `CacheBuildContributor.createCacheModule` is the selected owner seam;
- the source-owned request excludes domains, layouts, options, and injected
  recurrence operations;
- typed composition and execution depend on interface contracts and executable
  storage facts without inspecting concrete source or geometry kinds;
- `CacheTransportDataProvider.createTransportData` is the spherical-geometry
  seam for the distant packed atmosphere-dependent kernel; its transport
  passes contain geometry, `CacheOperations`, and distant layout modules;
- Flat/local transport constructs no packed kernel; its passes contain Flat
  geometry, atmosphere, `IntegratedCacheTransport`, and local layout modules;
- `accumulate(J1)` initializes N1, while `accumulate(J1, J2)` initializes
  N2/N4 cumulative storage;
- the source-owned typed plan never places cumulative fields on a recurrence
  input;
- the exact N1, N2, and N4 pass graphs and last-consumer lifetimes are the ones
  recorded in this document, and N4 produces no `L4`;
- construction and runtime shader assemblers remain separate;
- `CacheBuildModule` and `ShaderContribution` remain the direct provider
  declarations consumed by those separate assemblers; no nested assembly
  object is interposed;
- `CacheFieldSpec` contains only direct `id` and `storage`, and
  `CacheBuildPlan` contains only `identity`, `fields`, `passes`, and `result`;
- `CacheGpuBackend` exposes only opaque field/program/binding handles;
- `CacheGpuExecutor` owns JavaScript pass/layer orchestration and staging
  cleanup and returns required unit-bearing logical-memory diagnostics;
- the direct build artifact retains only the cumulative GPU field, its opaque
  runtime bindings, diagnostics, and disposal;
- the accepted Flat/local cache remains the scaled 19-by-15
  `z`/source-subpoint-`rho` domain with geometry-owned four-tap bilinear
  reconstruction, fused GPU transport, and exactly zero packed Flat transport
  storage;
- every source-owned plan conforms to the recurrence and order policy in the
  selected numerical contract; and
- direct replacement removes the incident-cache strategy without a
  compatibility bridge.

The dome-aware nonlinear position topology remains outside this acceptance
boundary. The exact ragged Flat transport companion was completed as an
interim representation-equivalence control and then superseded by fused
transport; it is not a production strategy or fallback. Neither historical
surface may change production direct contracts, reuse keys, construction,
publication, or runtime sampling.

The Stage 4.1-through-5 numerical gate is closed. The accepted real-browser
software-renderer evidence establishes exact N1 accumulation, bit-identical
shared N2/N4 field values, cumulative pure-order sums, both N4 transport
passes, selected-only readback, result-only retention, and cleanup under the
unchanged binary32 bounds. The
[baseline import status](../architecture-contracts/baseline-import-status.md) owns the
exact comparison and artifact-memory results. Exact ordinary Fibonacci-34
parent data plus deterministic reflection completion gives identical current
Fibonacci-68 executable vectors and weights in Node and browser runtimes.
Supported-hardware timing and resource budgets remain open because
the accepted run used a software renderer.

The per-runtime `DistantSunCacheController` implements direct reuse-key
comparison, serialized generation supersession, failure isolation, and atomic
publication.
The Stage 7 direct replacement connects that controller to the public source
boundary, the cache-owned final-view sampler, and opaque backend binding with
no second accepted runtime path. Full release parity and supported-hardware
budgets remain follow-on acceptance work rather than alternate implementation
strategies.

The focused Stage 7 real-WebGL gate exercises opaque-binding addressing,
cumulative CPU/GLSL traversal, and automatic public setup for requested N1,
N2, and N4. This isolates runtime addressing, integration, and ownership; it
is not the release-grade binary64 complete-ray oracle. The
[baseline import status](../architecture-contracts/baseline-import-status.md) owns exact
run results and the combined nine-spec browser-lane environment limitation.
