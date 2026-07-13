# Flat/Local GPU Transport Offload Plan

Status: fused production cutover implemented; selected default-profile
numerical qualification passes. The remaining work is the explicitly
identified diagnostic/visual qualification gap and final documentation
closure.

## Objective

First replace the fixed-width Flat/local stored-field transport kernel with an
exact indexed CPU-built representation. Then remove that representation from
the production path by fusing geometry-resolved `J2 -> L2` and `J3 -> L3`
transport into GPU cache passes. The final production Flat/local N4 path must
not construct, hash, materialize, copy, bind, or upload either a fixed-width
or indexed CPU transport kernel.

The indexed CPU builder is a temporary representation-preservation control and
the practical pre-fusion regression baseline. It is not an independent
physical authority, production runtime fallback, or reason to wait for a full
default-N4 CPU cache build. Distant-Sun transport is unchanged until
separately measured and authorized.

The local-Sun shell boundary table is not part of this correction. Its 2,049
R32F values occupy 8,196 bytes and are not the measured 72.7-second bottleneck.

## User-Selected Quality Presets

Flat/local quality is selected by the user through named presets. A preset is
one complete, immutable construction profile: maximum scattering order,
position and direction domains, transport interval count, and every other
fact that changes the cache result or its resource use. The selected preset
is a direct plan and reuse-key input. Changing it constructs a replacement
cache; the application never silently substitutes a lower preset.

The current z19/rho15, paired-plus-rotated-Fibonacci-68, W27, native-15,
15-interval N4 profile is the default maximum-quality preset. Its direction
invariants, production execution, and Flat180 visual correction are qualified
directly. The immutable paired-Fibonacci-34 binary64 and indexed-R32F
authorities remain a focused proof of the unchanged fused transport operation;
they are not relabeled as authorities for the new quadrature. Lower presets are intentional approximations, not failed
instances of the default. They require fixed declared parameters and must
compile, construct, remain finite and nonnegative, preserve lifecycle and
publication behavior, and report their selected identity. They do not require
numerical or visual parity with the default authority. Do not measure,
compare, threshold, or otherwise qualify a lower preset's correctness loss
against the default preset; only the default receives authority comparison.

This transaction does not invent lower preset values or select them from
hardware measurements. Their availability and user-facing presentation are
application decisions outside this plan. The implementation determines the
GPU capabilities it actually requires; capability observations do not permit
silent quality substitution.

## Fixed Architecture Decision

Keep the logical pass kind `transport`. Add one generic transport-owned cache
contributor named `IntegratedCacheTransport`. The source-specific controllers
select concrete contributors when they construct their plans:

```text
Flat/local N4 transport:
    Flat geometry
    + canonical atmosphere
    + IntegratedCacheTransport
    + local cache layout

Spherical/distant N4 transport:
    spherical packed-transport geometry
    + existing CacheOperations
    + distant cache layout
```

No shared implementation may branch on a source id, geometry id, class name,
or descriptor to select these algorithms. In particular, do not add a
`localSun`, `flat`, `distantSun`, or `spherical` conditional to
`IntegratedCacheTransport`, `CacheOperations`, `CachePassAssembler`,
`CacheGpuExecutor`, `ThreeCacheBackend`, or the atmosphere. A conditional on
the already-selected logical pass kind remains valid inside a concrete
contributor.

The local source does not contribute to `Jk -> Lk` for `k >= 2`. Flat geometry
owns the configured source-relative construction frame and ray, while generic
transport consumes the already-constructed pure `Jk` field.

## Indexed Transport Interim Transaction

Before the fused implementation, replace the 236-slot padded transport table
with a canonical compressed-sparse-row layout. It preserves the current
algorithm exactly: every active tap keeps its query order, source direction,
source position, and coefficient; only absent padding is removed.

```text
queryOffsets[queryCount + 1]       // CSR row starts; final value is activeTapCount
sourceDirectionIndices[activeTapCount]
sourcePositionNodeIds[activeTapCount]
coefficients[activeTapCount][15]
```

For the default profile, `queryCount` remains 9,690 and the streamed control
records `activeTapCount` as 677,983 rather than
`9,690 * 236 = 2,286,840`. Keep direction
and position indices separate 32-bit arrays initially; do not add pair
packing while establishing representation equivalence. The expected transport
payload is approximately 46,141,608 bytes, excluding the existing small
shell facts. That figure is a planning estimate and a diagnostic, not an
acceptance budget.

The fixed-width builder is the only control for this representation change.
Its active rows establish exact indexed contents; they do not establish an
independent physical result. Do not block this phase on materializing the
complete default-N4 CPU cache. Once the indexed builder and indexed GPU path
pass their exact representation and selected-output checks, freeze that
indexed result as the pre-fusion regression baseline. Retired Star material is
not a baseline, fixture, dependency, or executable check.

## Baseline Facts

For the pre-fusion `z19 * rho15`, paired-Fibonacci-34, W27, native-15 baseline:

- 285 position nodes;
- 9,690 position/direction transport queries;
- 236 fixed packed taps per query;
- 6,860,520 source/address scalars;
- 34,302,600 coefficient scalars;
- 164,652,480 packed transport bytes; and
- approximately 72.7 seconds of synchronous main-thread preparation in the
  measured Flat 0 construction.

The pre-fusion implementation constructed this payload in
`LocalSunCacheController.createBuildPlan()`, copies and hashes it through
`CacheValues.createData()`, copies it again into backend Float32 textures for
each compiled transport program, and uses it from the packed loop in
`CacheOperations`.

One fused pass produces `34 * 285 * 15 = 145,350` R32F output scalars. At 16
path points and up to 16 combined position/direction reads per point, the
upper work estimate is 37,209,600 `Jk` reads per pass and 74,419,200 reads for
both N4 transport passes. This is construction-only GPU work and must be
measured on declared hardware.

The spherical/distant comparison has 48 positions, 1,632 queries, 64 taps,
7,520,256 packed bytes, and approximately 5.45 seconds of preparation. These
measurements diagnose the current implementation; they are not performance
budgets.

## Target N4 Graph

The ten existing logical passes and every field id remain in the same order:

```text
1.  local-sun-primary-j1              -> J1
2.  local-sun-direct-l1               -> L1
3.  scatter L1                        -> J2
4.  accumulate J1 + J2                -> Jthrough2
5.  integrated transport J2           -> L2
6.  scatter L2                        -> J3
7.  accumulate Jthrough2 + J3         -> Jthrough3
8.  integrated transport J3           -> L3
9.  scatter L3                        -> J4
10. accumulate Jthrough3 + J4         -> Jthrough4
```

Only passes 5 and 8 change their module composition. Field allocation,
last-consumer release, cancellation boundaries, failure cleanup, and atomic
publication remain executor-owned and unchanged.

## Concrete Shader Contracts

### Integrated transport contributor

Add:

```text
src/algorithm32/atmospheric-transport/cache/IntegratedCacheTransport.js
src/algorithm32/atmospheric-transport/cache/types/IntegratedCacheTransport.d.ts
src/algorithm32/atmospheric-transport/cache/_tests/IntegratedCacheTransport.spec.js
```

`IntegratedCacheTransport` implements `CacheBuildContributor` and creates one
module with this contract:

```text
id:
    algorithm32-cache-integrated-transport-operation-v1
owner:
    transport
provides:
    cache.operation.transport
requires:
    atmosphere.medium
    geometry.cachePosition
    geometry.integratedTransportRay
    geometry.constructionPositionStencil
    geometry.constructionDirectionStencil
    cache.storedScatteringDensity
    cache.outputLayout
```

The contributor accepts only the ordinary `CacheBuildContext`. It uses
`context.options.transportIntervalCount` as the sole accepted executable
stored-field interval count. `context.pathIntervalCount` remains the
direct-L1-only path control. The contributor does not inspect
`context.domains`, `context.transportData`, owner ids, descriptors, or
concrete classes to choose an algorithm.

It supplies these pass defines:

```text
CACHE_TRANSPORT_INTERVAL_COUNT = 15
CACHE_TRANSPORT_POSITION_TAP_COUNT = 4
CACHE_TRANSPORT_DIRECTION_TAP_COUNT = 4
```

### Cache layout contribution

For a local transport pass,
`LocalSunCacheController._createLayoutModule()` additionally provides
`cache.storedScatteringDensity` and emits:

```glsl
float cacheStoredScatteringDensity(
	int directionIndex,
	int positionIndex,
	int wavelengthIndex
);
```

The helper reads the pass's one pure input field using
`CacheBuildModules.fieldInputBindingName(context.inputs[0].id)`. This keeps
logical field addressing and sampler identity with the cache layout rather
than with physical transport.

The layout module must add no runtime validation for this trusted internal
shape. The source-owned plan and ambient contracts guarantee that an
integrated transport pass has exactly one pure scattering-density input with
selected-outgoing-domain-by-position-by-spectral storage. Production uses
W27/native-15, while the bounded qualification lane may supply W3/native-15.

### Flat geometry contribution

For `context.kind === 'transport'`, `FlatGeometryCacheModuleProvider` provides
the following GLSL surface:

```glsl
struct CacheTransportRay {
	vec3 originMeters;
	vec3 direction;
	float distanceMeters;
	bool endsOnGround;
};

struct CachePositionStencil {
	ivec4 indices;
	vec4 weights;
};

struct CacheDirectionStencil {
	ivec4 indices;
	vec4 weights;
};

CacheTransportRay cacheIntegratedTransportRay(
	int positionIndex,
	int incomingDirectionIndex
);

CachePositionStencil cacheConstructionPositionStencil(
	vec3 positionMeters
);

CacheDirectionStencil cacheConstructionDirectionStencil(
	vec3 positionMeters,
	vec3 physicalDirection
);
```

The transport module uses only the existing small physical/domain facts:

- the flattened z/rho position-node texture;
- the selected paired-Fibonacci incoming direction texture (68 directions in the current default);
- configured source position and source subpoint;
- top altitude, radial maximum, and rho-zero fallback direction;
- z and rho counts; and
- outgoing cubed-sphere face width and face-node count.

The cubed-sphere values come from the selected executable domain. Do not
hard-code W27 constants because bounded qualification uses W3.

Position-axis reads use the existing flattened node texture:

```text
z node zIndex     -> texel (0, zIndex * CACHE_RHO_COUNT)
rho node rhoIndex -> texel (1, rhoIndex)
flat index        -> zIndex * CACHE_RHO_COUNT + rhoIndex
```

The GPU functions preserve these CPU-authority details:

- ground, then top, then radial boundary consideration;
- an equal-distance tie retains the earlier boundary;
- the terminal ground point is snapped to exactly `z = 0`;
- the path's physical direction stays fixed while the radial/tangent frame is
  recomputed at every sample point;
- rho zero uses the configured fallback radial direction;
- z/rho lookup clamps endpoints and preserves exact-node reduction;
- cubed-sphere lookup uses the retained face order and strict dominant-face
  comparisons; and
- W lookup preserves the `1e-10` exact-grid threshold, face-local bilinear
  order, and positive-weight behavior.

The already-qualified runtime implementations in
`FlatGeometryShaderContributor` are the implementation model. The initial
offload ports their behavior into the construction module and proves direct
CPU parity. A broader shared shader-source refactor is not part of this
transaction.

### Atmosphere contribution

For `context.kind === 'transport'`, `CanonicalAtmosphere` provides
`atmosphere.medium` and emits the existing wavelength-specific
`cacheExtinction(positionMeters, wavelengthIndex)` implementation.

Do not emit phase or source-transmittance functions for transport. Distant
transport remains unchanged because its controller does not select an
atmosphere module for the packed pass.

### Fused fragment algorithm

One fragment represents one selected paired-Fibonacci output direction, one
z-major/rho-minor position, and the executor-selected native-15 wavelength
layer. The exact operation order is:

```text
outputDirectionIndex = int(gl_FragCoord.x)
outputPositionIndex = int(gl_FragCoord.y)
wavelengthIndex = a32CacheWavelengthLayer

ray = cacheIntegratedTransportRay(outputPositionIndex, outputDirectionIndex)
intervalLength = ray.distanceMeters / 15
transmittance = 1
previousExtinction = unset
radiance = 0

for pointIndex = 0 through 15:
    samplePosition = ray.origin + ray.direction * intervalLength * pointIndex
    if final point and ray.endsOnGround: samplePosition.z = 0
    extinction = cacheExtinction(samplePosition, wavelengthIndex)
    if pointIndex > 0:
        transmittance *= exp(
            -0.5 * (previousExtinction + extinction) * intervalLength
        )
    positionStencil = cacheConstructionPositionStencil(samplePosition)
    directionStencil = cacheConstructionDirectionStencil(
        samplePosition,
        ray.direction
    )
    density = sum of the 4 x 4 nonzero weighted Jk reads
    measure = intervalLength * (endpoint ? 0.5 : 1)
    radiance += transmittance * density * measure
    previousExtinction = extinction

a32CacheOutput = radiance
```

The packed authority aggregates duplicate `(position, direction)` addresses
in binary64 and later accumulates Float32 coefficients. The fused shader
traverses the unaggregated sequence and performs geometry, extinction, and
accumulation in highp Float32. Bit identity is therefore not an acceptance
requirement; the existing R32F numerical policy remains binding.

## Implementation Transaction

Each step is a reviewable stopping point. Do not combine the planner cutover
with unresolved numerical or lifecycle failures.

| Track           | Current step    | Status                      | Completion evidence                                            |
| --------------- | --------------- | --------------------------- | -------------------------------------------------------------- |
| Indexed interim | Indexed Step 0  | complete                    | Selected binary64 values, fixed-row hashes, and CSR contract   |
| Indexed interim | Indexed Step 1  | complete                    | Exact fixed-row-to-CSR equivalence                             |
| Indexed interim | Indexed Step 2  | complete                    | Selected physical L2/L3 GPU parity with fixed-width control    |
| Indexed interim | Indexed Step 3  | complete                    | Sealed selected indexed-R32F pre-fusion snapshot               |
| Final offload   | Fused Steps 0–4 | production cutover complete | Zero packed Flat payload and selected default authority parity |
| Final offload   | Fused Steps 5–7 | qualification follow-up     | Observability, visual decision, and documentation closure      |

### Implemented fused result

On 2026-08-07, the production local N4 planner stopped calling every fixed or
indexed Flat transport builder. Both stored-field transport passes now
assemble Flat geometry, canonical atmosphere, `IntegratedCacheTransport`, and
the local layout module. Flat transport source/coefficient bindings and packed
accessors are absent, while the concrete CPU fixed/indexed builders remain
diagnostic authorities. `packedTransportData` is exactly zero for N1, N2, and
N4. Spherical/distant transport remains packed and continues to use
`CacheOperations`.

The complete default N4 production graph compiled and executed in WebGL2 and
compared 960 selected `L2` plus 960 selected `L3` scalars independently with
both sealed authorities. All comparisons passed. The largest observed
relative residual was `4.9479290364892576e-5`; the largest absolute residual
was `0.000028294111174886893`. The software-renderer diagnostic completed the
executor transaction in 10,099.2 ms with real timer yields and recorded:

- `224,386,200` bytes peak logical field storage;
- `63,024` bytes peak packed auxiliary data;
- `224,386,200` bytes peak tracked storage; and
- `74,795,400` bytes resident result storage.

The rebuilt Flat32 application lane passed 3/3 in 53.181 seconds, compared
with the earlier 3m41s observation of the same lane while the indexed CPU
builder was active. Timing remains diagnostic, and this environment reported
the Microsoft Basic Render Driver rather than supported hardware.

### Indexed Step 0: Freeze the representation contract

Current fixed-row control evidence: 9,690 queries, 677,983 active taps, a
236-tap maximum row, and the following default-profile hashes:

```text
queryOffsets: baa118fb4dc90d2e2f77168a84d540180eae9f9abc48afd7b012489803f82b55
sources:      a51930904df40590c7b03ee5a3e6f55db9d6f1492e23948a341d8a0c95392eef
coefficients: 1b237a8cd101311424a08e9290767115ccc801d12f2e27fbdf3820b3575969c3
```

The selected binary64 evaluator completed without building a default-N4 CPU
cache. It captured 960 `L2` and 960 `L3` values in 543,939.5172 milliseconds,
with a final 98,701 memoized dependency spectra. The sealed policy is
`algorithm32-local-sun-gpu-transport-offload-policy-v1`, SHA-256
`bb2275097780fbc2ffb69bf0fa47aeb927fcf97ce818a86e47381b49e1a5bdc5`.
Its CPU snapshot SHA-256 is
`dd4bdbf87ca05b9a7c45bf849fcc625d1aef1b90fe824ba8e33b424473e44430`.

Work:

- Record the default-profile query count, maximum fixed row width, active-tap
  count, index element types, coefficient shape, byte accounting, and query
  enumeration order.
- Capture the declared selected direct binary64 CPU values without building a
  complete default-N4 CPU cache. The evaluator must compute only the selected
  recurrence queries and record its inputs and results; it is the default
  correctness reference for those declared values.
- Add a focused control that enumerates current fixed rows and records stable
  hashes for the complete active-tap sequence and the `queryOffsets` sequence.
  It may construct transport data, but must not construct a complete N4 CPU
  cache or depend on an archived experiment.
- Define selected `L2` and `L3` output probes for the later indexed GPU-path
  check. These prove the representation is consumable, not independent
  physical authority.

Gate:

- The contract identifies every value needed to reconstruct each current
  active fixed-width row without padding.
- Focused evidence records the selected direct binary64 values, exact
  active-tap count, and stable control hashes. No full default-N4 CPU cache
  materialization is required.

Status: complete. The fixed-width control and selected CPU values are sealed
as the Indexed Step 1 representation-preservation inputs.

### Indexed Step 1: Build and verify the CSR transport data

Status: complete. The two-pass CSR builder completed in 76 seconds and
produced 9,690 offsets, 677,983 active taps, and 46,141,608 transport bytes.
Its query-offset, source-address, and Float32 coefficient SHA-256 values match
the sealed Indexed Step 0 controls exactly. The production planner remains on
the fixed-width path until Indexed Step 2 provides its GPU consumer.

Work:

- Add the canonical indexed transport data type and CPU builder beside the
  current fixed builder.
- Emit contiguous query ranges, separate direction and position arrays, and
  ordered native-15 coefficient tuples.
- Compare every indexed tap against its corresponding active fixed-width tap:
  query order, source addresses, coefficient values, row lengths, first and
  final offsets, and complete sequence hashes must agree exactly.
- Keep the fixed builder only as an internal transition control. Do not add a
  selectable product algorithm or a distant-Sun change.

Gate:

- The indexed representation has no padding entries and reconstructs every
  active fixed-width row exactly.
- Default-profile byte accounting and bounds are reported; any discrepancy is
  diagnosed before the GPU consumer work begins.

### Indexed Step 2: Consume the indexed data in the existing GPU transport path

Status: complete. The indexed GPU resources pack the 677,983 active taps
across 16,384-column R32F 2D textures (42 tap rows) rather than attempting an
invalid 677,983-by-1 texture. The matching shader derives each CSR address from
its linear index. The complete physical N4 browser run compared 960 selected
probes for each of L2 and L3 between fixed-width and indexed transport; every
value met the declared R32F bound. The run completed in 2 minutes 10.8 seconds
without an oversized-DataTexture warning. It recorded 46,858,240 bytes of
indexed packed data, including 2D row padding, versus 164,652,480 bytes
fixed-width.

Work:

- Add an indexed packed transport shader path that reads a query range and
  loops only over its active taps. The runtime lookup remains O(1) per output
  sample; the variable-length loop exists only during cache construction.
- Bind the offsets, source indices, and coefficients with explicit integer and
  float sampler contracts. Preserve the existing `J2 -> L2` and `J3 -> L3`
  recurrence, fields, layer count, and cancellation boundaries.
- Compare selected default-profile indexed GPU `L2` and `L3` results with the
  fixed-width GPU control under the current R32F comparison rule.

Gate:

- The indexed GPU path consumes no fixed-width transport bindings and performs
  no padded-tap iterations.
- Selected indexed and fixed-width GPU outputs meet the declared R32F bound.
  This is an exact algorithm-preservation gate, not a comparison between
  quality presets.

### Indexed Step 3: Promote the indexed interim baseline

Status: complete historical interim. The local N4 planner temporarily created the
indexed GPU representation. Its public request no longer selects a packed
alternative, and its required geometry contract no longer includes the packed
builder. Before fusion, the focused production-default browser run executed selected L2/L3
probes with indexed transport bindings only: no fixed source or coefficient
binding was present. It recorded 46,858,240 indexed packed bytes. Focused local
and distant plan specifications pass. The remaining evidence-freezing work is
owned in detail by Fused Step 0's immutable indexed-R32F snapshot procedure.

Work:

- Cut the local N4 planner to the indexed transport payload and remove the
  fixed-width Flat/local transport payload from its production bindings.
- Freeze the indexed representation evidence and selected indexed `L2`/`L3`
  GPU results as the pre-fusion regression baseline.
- Record construction, resource, compilation, responsiveness, lifecycle, and
  hardware observations as diagnostics only.

Gate:

- The production local planner constructs only indexed Flat/local transport
  data; fixed-width Flat/local payload allocation and binding are zero.
- The selected default output checks pass, and distant-Sun behavior remains
  unchanged.

### Fused Step 0: Restore and freeze the fusion baseline

Fusion-baseline seal:

```text
status: sealed-selected-numerical-authorities
policyId: algorithm32-local-sun-gpu-transport-offload-policy-v2
policySha256: 4fe5c88cc8f23ea3e20acbc85533a3a3e17e230a395fb1533df88d4e60364543
cpuSnapshotSha256: c2a2018c5c3d5db0e737c695439365a976220b1c914c94c5e7dcaf2a88b27b9e
indexedR32fSnapshotSha256: 656d29e15a67876f6aaff12cec6c5d3c77bd4068f7d629ade76ee12f1ac59325
visualBaselines: unavailable; sealed policy records null
```

The numerical authorities are immutable and passed the fused candidate. The
pre-fusion transaction did not seal visual baselines, so visual parity cannot
be retroactively claimed from this policy. That evidence gap must be resolved
by an explicit plan decision before the whole transaction is marked complete.

Files:

```text
src/algorithm32/implementation/local-sun/cache/fixtures/
    local-sun-gpu-transport-offload-policy.json
src/algorithm32/implementation/local-sun/cache/_tests/
    local-sun-gpu-transport-authority.js
    local-sun-gpu-transport-authority-worker.js
    local-sun-gpu-transport-baseline.browser.js
    local-sun-gpu-transport-image-extraction.js
    local-sun-gpu-transport-policy.spec.js
```

Work:

- Recreate a current production-owned local GPU comparison lane from current
  production interfaces. Do not copy, import, execute, or depend on retired
  Star or sealed Stage 12 sources.
- Freeze the indexed plan fields, pass order, domain identities, 15-interval
  controls, ground configuration, and selected indexed-R32F outputs.
- Use Indexed Step 0's selected direct binary64 evaluator without materializing
  the complete default-N4 CPU cache.
- Treat the indexed-R32F snapshot as a regression baseline for this exact
  implementation transition, not as independent physical authority.
- Hash retained CPU-authority inputs, domain/profile constants, the policy,
  and frozen result fixtures. Record files that the candidate will modify only
  as baseline provenance; their old hashes are not post-cutover source
  preconditions.
- Freeze the Flat 0, 135, and 180 capture configurations, baseline image
  hashes, selected pixel coordinates/regions, and pixel-extraction rule before
  observing the fused candidate.
- Record five cold and five warm baseline runs on a hardware-accelerated
  browser. Record the GPU, driver, OS, browser, viewport, renderer, and
  whether hardware acceleration is active. These measurements are diagnostic
  baselines, not performance acceptance budgets.
- Freeze the maximum GPU timer-query pending age used to terminate diagnostic
  polling; it is a lifecycle limit, not an allowance to pass without results.
- Define the steady-frame sample count and percentile for diagnostic reporting.
  Do not establish per-run, median, combined-transport, or setup-time
  pass/fail budgets in this transaction.
- Inventory and report `peakPackedDataStorage` and `peakTrackedStorage` from
  the post-cutover bindings. These are resource diagnostics, not acceptance
  limits.
- SwiftShader is conformance-only. Record its differences from the completed
  implementation's observed hardware capabilities without using it to define
  production capability requirements.

Gate:

- Indexed-R32F values and visual baselines authenticate as immutable snapshots.
- The focused policy specification authenticates schemas, immutable hashes,
  probe coordinates, visual extraction coordinates, and all declared limits
  independently of the browser lane.
- The policy identifies the default preset as the sole authority-qualified
  profile.
- On passage, seal the policy, indexed-R32F snapshot, visual baselines,
  selected-output results, extraction helper and rules, coordinates, hashes, and
  declared limits against further edits. Record the policy's SHA-256 in a dedicated
  Fused Step 0 seal entry in this canonical plan; the policy JSON must not claim to
  authenticate its own hash.
- Any later change to sealed evidence rejects the current candidate. Revise
  the policy id, recreate and reseal the complete baseline, and do so before
  observing output from a replacement candidate.
- The indexed implementation passes the numerical, lifecycle, and visual
  baseline portions of the lane. Its measured time and memory are recorded as
  the losing baseline; timing observations establish no candidate pass/fail
  threshold.

### Fused Step 1: Add types and the transport-owned contributor

Status: complete. The generic contributor and its positive assembled-pass
contract are implemented; focused specifications and type checking pass.

Files:

```text
src/algorithm32/atmospheric-transport/cache/IntegratedCacheTransport.js
src/algorithm32/atmospheric-transport/cache/types/IntegratedCacheTransport.d.ts
src/algorithm32/atmospheric-transport/cache/_tests/IntegratedCacheTransport.spec.js
```

Work:

- Add `IntegratedCacheTransport` with the fixed module contract above.
- Bind `CACHE_TRANSPORT_INTERVAL_COUNT` directly from
  `context.options.transportIntervalCount`; do not add a second transport
  interval fact to the pass context.
- Keep `CacheBuildContext.transportData`, `CacheTransportData`,
  `CacheTransportDataProvider`, and `CacheOperations._transportBlocks()`
  unchanged for distant transport.
- Add positive assembly tests for required capabilities, fixed loop bounds,
  one layout-owned input sampler, and one scalar output.

Gate:

- Type checking and focused Node specifications pass.
- No shared source/geometry algorithm-selection branch exists.
- Distant `CacheOperations` source and tests remain unchanged.

### Fused Step 2: Add flat geometry and atmosphere GPU capabilities

Status: complete for the production shader capabilities. Flat geometry owns
the integrated ray and construction stencils, canonical atmosphere exposes
transport extinction, and bounded W3 plus production W27 module contracts
pass their focused specifications.

Files:

```text
src/algorithm32/implementation/flat-earth/FlatGeometryCacheModuleProvider.js
src/algorithm32/implementation/flat-earth/consts.js
src/algorithm32/implementation/flat-earth/_tests/flat-earth-geometry.spec.js
src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js
src/algorithm32/implementation/canonical-atmosphere/consts.js
src/algorithm32/implementation/canonical-atmosphere/_tests/CanonicalAtmosphere.spec.js
```

Work:

- Include transport in the flat physical-domain and incoming-direction
  contribution conditions.
- Add `CACHE_Z_COUNT` and executable cubed-sphere defines.
- Add boundary-kind retention, transport-ray construction, z/rho stencil,
  and W stencil shader blocks.
- Retain the existing packed source/coefficient accessors and bindings through
  Step 3 so the still-active production planner remains executable. During
  this transitional step one geometry module may provide both packed and
  integrated capabilities; the selected operation module determines which
  capability is called. Do not add an algorithm-selection flag or source-kind
  branch.
- Make canonical atmosphere medium/extinction available to transport without
  adding phase or source transmittance.
- Compare CPU and GLSL ray/stencil results at exact nodes, interiors, clamps,
  ground/top/radial exits, rho zero, axis crossing, W face centers, seams,
  ties, and corners.
- Canonicalize a fixed four-slot GPU stencil before comparing it with a CPU
  stencil: discard zero-weight slots, coalesce duplicate indices in retained
  order, require every active weight to be positive, and require the active
  weight sum to be within `2e-6` of one.
- Require boundary kind and canonicalized indices to be exact. Compare
  direction components and stencil weights with `2e-6` absolute tolerance.
  Compare ray distances with
  `max(1e-3 meters, 8 * float32Ulp(Math.fround(cpuDistance)))` absolute
  tolerance, using one policy-owned Float32 ULP implementation.

Gate:

- The existing packed local plan still assembles and executes while the new
  integrated geometry symbols are available for the isolated Step 3 proof.
- Bounded W3 and production W27 shaders compile in real WebGL2.
- Every declared edge vector resolves to the exact boundary kind and
  canonicalized indices, with ray and weight values inside the declared
  Float32 limits.

### Fused Step 3: Prove the fused pass before planner cutover

Status: complete. The complete production N4 graph compiled in WebGL2,
executed every wavelength layer, remained finite and nonnegative at all
selected probes, and passed both sealed numerical authorities.

The browser-only manufactured-field micro-gate also passes. It executes a
test-only R32F `J2` seed pass followed directly by the production fused
`J2 -> L2` pass, with no primary, scatter, accumulation, or higher-order pass.
Six selected seed readbacks are exact for both an exactly representable
constant field and a deterministic injective index-coded field. Across all
4,080 bounded z2/rho2, paired-plus-rotated-Fibonacci-68, W3, native-15 outputs, the
zero-extinction constant-field comparison has a maximum relative residual of
`2.659928618671587e-7`, and the index-coded/canonical-extinction CPU comparison
has a maximum relative residual of `1.0797289489264222e-6`. Both pass the
unchanged R32F radiance bound, all compiled renderer programs remain runnable,
and the run reports no WebGL error. The observed Microsoft Basic Render Driver
result is conformance evidence only, not supported-hardware performance
evidence.

Files:

```text
src/algorithm32/implementation/local-sun/cache/_tests/
    local-sun-gpu-transport.browser.js
src/algorithm32/implementation/three-cache-backend/_tests/
    three-webgl.browser.js
```

Work:

- Import the sealed Fused Step 0 authority and image-extraction helpers read-only;
  candidate coverage lives in this separate browser file and never edits a
  sealed evidence surface.
- Build a complete test-only two-pass plan. A seed pass writes the manufactured
  R32F `J` field using an ordinary cache shader, and the integrated transport
  pass consumes that field. Do not add field-upload behavior to the production
  backend.
- Make seed values exactly representable in R32F. The CPU comparison consumes
  the same `Math.fround` seed recipe, and the test reads selected seed scalars
  back to prove bit identity before comparing transport.
- Prove the analytic zero-extinction constant-field invariant
  `L = J * resolvedRayLength` with a test-only atmosphere module that provides
  zero extinction. Do not add a zero-extinction mode to
  `CanonicalAtmosphere`.
- Use an index-coded deterministic `J` field with canonical extinction to
  expose addressing, interpolation, and frame errors.
- Until Step 4 removes the legacy geometry branch, supply only bounded dummy
  packed transport data required to construct the transitional geometry
  module. The integrated operation never samples those bindings, and the
  dummy payload is not part of the numerical authority.
- Exercise all 15 wavelength layers and assert finite nonnegative output and
  no WebGL error or shader warning.
- Measure shader compile time and one complete layer on the minimum supported
  hardware before the controller selects the pass.

Gate:

- The micro-gate passes every analytic and CPU-selected query.
- A single wavelength-layer draw remains observable and cancellation continues
  to occur only at the existing layer boundary; measured latency is diagnostic.
- No driver compile failure occurs on declared supported hardware.

### Fused Step 4: Cut over only the local N4 planner

Status: complete. Plan/reuse schemas are v4, the ten-pass recurrence is
unchanged, both fused passes use the selected four contributors, Flat packed
transport storage is zero, and output-targeted compile/submission failures for
both `L2` and `L3` preserve the prior cache and release candidate resources.

Files:

```text
src/algorithm32/implementation/local-sun/cache/LocalSunCacheController.js
src/algorithm32/implementation/local-sun/cache/consts.js
src/algorithm32/implementation/local-sun/cache/types.d.ts
src/algorithm32/implementation/local-sun/cache/types/LocalSunCacheController.d.ts
src/algorithm32/implementation/local-sun/cache/LocalSunCacheSource.js
src/algorithm32/implementation/local-sun/cache/_tests/
    local-sun-cache-plan.spec.js
    local-sun-cache-controller.spec.js
```

Work:

- Instantiate `IntegratedCacheTransport` beside `CacheOperations`.
  `CacheOperations` continues to own scatter and accumulate in the local
  graph.
- Change both local transport pass requests to carry atmosphere and the
  integrated contributor. The existing construction options carry the one
  stored-field transport interval count.
- Select contributors `[geometry, atmosphere, integratedTransport]` for
  `J2 -> L2` and `J3 -> L3`.
- Delete the production call to `request.geometry.createTransportData()`.
- In the same change, delete the flat transport source/coefficient bindings,
  packed accessors, and transitional dual-capability support retained through
  Step 3. The committed cutover must not leave a selectable packed Flat path.
- Remove `transportData` from local pass options and local transport-pass
  request types.
- Remove `createTransportData()` from the required
  `LocalSunCacheBuildGeometry` production shape. Retain the concrete geometry
  method for diagnostic CPU authority.
- Extend the local layout module with
  `cache.storedScatteringDensity` only for transport.
- Retain `packedTransportData` as a zero-valued accounting metric, not as a
  payload. Update `LocalSunCachePlanResourceFacts` and
  `LocalSunCacheResourceReport` to document that contract, and set it to
  exactly zero without constructing transport data.
- Bump the local plan and reuse-key schema revisions. Keep field ids, domain
  ids, interval count, maximum-order behavior, and runtime sampler identity.
- Replace expensive plan tests that materialize the complete packed kernel
  with positive fused-graph and arithmetic resource contracts.

Gate:

- N1 and N2 plan graphs and numerical output remain unchanged.
- N4 retains ten passes and the same recurrence dependencies.
- Both local transport shaders include geometry, atmosphere, integrated
  transport, and layout modules, with no transport sources or coefficient
  textures.
- The bounded complete N4 result satisfies both frozen numerical authorities,
  and the production-domain selected `L2` and `L3` probes satisfy both
  authorities under the Step 6 limits.
- Both production fused shaders compile in real WebGL2 on declared hardware.
- Cancellation, supersession, compilation failure, and a manufactured layer
  failure in either fused pass preserve the previously published cache and
  release every candidate-owned field and program.
- Distant N1, N2, and N4 plan, shader, packed bindings, hashes, and selected
  outputs remain unchanged.

### Fused Step 5: Make responsiveness and timing observable

Status: deferred diagnostic follow-up. Removing synchronous CPU transport
construction fixes the causal Flat-switch stall. The planned paint barrier,
execution identities, and timer-query diagnostics are not implemented and are
not claimed by the current result.

Files:

```text
src/algorithm32/implementation/local-sun/cache/LocalSunCacheController.js
src/algorithm32/interfaces/cache-backend/types.d.ts
src/algorithm32/gpu-cache-runtime/CacheGpuExecutor.js
src/algorithm32/gpu-cache-runtime/types.d.ts
src/algorithm32/gpu-cache-runtime/types/CacheGpuExecutor.d.ts
src/algorithm32/gpu-cache-runtime/_tests/CacheGpuExecutor.spec.js
src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js
src/algorithm32/implementation/three-cache-backend/types.d.ts
src/algorithm32/implementation/three-cache-backend/types/ThreeCacheBackend.d.ts
src/algorithm32/implementation/three-cache-backend/_tests/ThreeCacheBackend.spec.js
src/algorithm32/implementation/three-cache-backend/
    ThreeCacheLayerPerformanceTimer.js
    types/ThreeCacheLayerPerformanceTimer.d.ts
    _tests/three-cache-layer-performance-timer.spec.js
src/flat32/Flat32Application.js
src/flat32/Algorithm32Runtime.js
src/flat32/types.d.ts
src/flat32/_tests/flat32-application.browser.js
```

Work:

- Yield through the accepted cache scheduler before local plan creation, then
  recheck cancellation and generation before proceeding.
- After `showAtmosphereSetup()`, cross a two-`requestAnimationFrame` barrier
  before `switchTo()`. The browser has a paint opportunity between the first
  and second callbacks. In the second callback, verify that the setup DOM state
  is still published, record button-to-second-rAF as the paint-confirmed upper
  bound, and only then release construction.
- Record plan preparation around `createBuildPlan()`.
- Record shader assembly and compilation separately from submission.
- Retain `submissionDuration` as CPU wall time including executor yields; do
  not label it GPU time.
- Give each `CacheGpuExecutor.execute()` transaction an opaque,
  process-unique `executionId`. Add `executionId` and `passId` to
  `CacheLayerSubmission`, populated by the executor, so renderer timing never
  infers logical identity from shader or field names and repeated builds
  cannot mix samples. Publish the execution id in completed build diagnostics
  for qualification polling.
- Add one backend-neutral `closeExecution()` contract with a named
  `completed`, `cancelled`, or `failed` disposition. The executor calls it
  exactly once from its transaction cleanup path, including failures before
  the first layer. A close failure participates in the executor's existing
  cleanup-error aggregation rather than masking the construction result.
- Add an optional performance callback and pending-query capacity to
  `ThreeCacheBackend` construction. When the callback is absent, do not create
  a timer or issue queries.
- Let `ThreeCacheBackend` own a narrow
  `ThreeCacheLayerPerformanceTimer`. It begins and ends one
  `EXT_disjoint_timer_query_webgl2` query around each layer draw and emits
  samples containing execution id, pass id, output field id, layer,
  availability, disjoint state, and elapsed duration. It does not import
  `rendering-runtime/three/ShaderPassPerformanceTimer`; that class is behavior
  guidance only, not a dependency.
- On a `completed` close, retain that execution's unresolved queries for
  post-publication polling. On a `cancelled` or `failed` close, immediately
  delete only that execution's unresolved queries and report their terminal
  state. Give the timer the policy-frozen maximum pending age so polling also
  deletes and reports successful-build queries that time out.
- Configure at least 256 pending queries in qualification so all 150 N4 layer
  submissions can remain represented even under GPU backlog. Poll before each
  draw and expose an explicit `pollPerformanceSamples(executionId)` operation
  and execution-keyed pending count on the concrete Three backend.
- After artifact publication, the qualification browser harness keeps the
  backend alive and polls the completed artifact's execution id on animation
  frames until every expected query resolves or the frozen pending-age timeout
  expires. It aggregates exactly 15 valid layer samples for each fused pass
  from that execution and sums them into per-pass GPU duration.
- Dispose every unresolved query on timeout, cancellation, failure, or backend
  disposal. Report unsupported, pending, failed, and disjoint states
  explicitly.
- Do not call `gl.finish()` and do not delay ordinary artifact publication for
  diagnostic query readback.
- Keep one draw and one cancellation/yield opportunity per wavelength layer.

Gate:

- The setup state completes a browser paint before plan construction begins.
- Plan preparation produces no browser long task.
- Timings distinguish button-to-second-rAF, plan, assembly, compile, CPU
  submit, GPU elapsed when timer-query support is available, total setup, and
  steady-frame cost. They are diagnostics for the selected preset, not
  acceptance budgets.
- When timer-query support is available, qualification records 15 completed,
  available, nondisjoint GPU samples for each fused pass and one matching
  completed execution id. Unsupported, pending, failed, timed-out, cancelled,
  mixed-id, or disjoint samples are explicitly reported and cannot be
  represented as successful GPU timing data.
- Backend tests prove that completed executions retain queries only until
  drain, cancelled and failed executions immediately reach zero pending
  queries, timed-out completed queries are deleted, and two successive
  execution ids cannot exchange samples.
- Cancellation and supersession during the initial yield and either fused
  pass preserve the last published cache.

### Fused Step 6: Run the default numerical gate and collect diagnostics

Status: selected transport-output numerical gate, manufactured-field
micro-gate, and current default Flat180 visual correction complete. Broader
field, ground-matrix, and supported-hardware diagnostics remain. The sealed
pre-fusion policy contains no visual baseline, so no pre-fusion visual parity
claim is possible; the 68-direction production default instead has retained
current visual evidence owned by the focused Flat180 diagnostic.

The current production-owned browser lane performs the matrix below. Routine
tests must not construct the complete 165 MB CPU kernel. Use bounded domains,
selected direct CPU queries, and the frozen indexed pre-fusion results.

Except where this step explicitly compares the sealed 34-direction transport
profile with its frozen numerical authority, every listed check, threshold, resource value,
timing, lifecycle observation, and intermediate gate is diagnostic. It may
identify later optimization or hardening work, but does not determine whether
this transaction is complete.

Diagnostic groups, except for the default-preset numerical and visual authority
comparisons:

1. Shader micro-gate over manufactured fields and all geometry edges.
2. Bounded z2/rho2, paired-plus-rotated-Fibonacci-68, W3, native-15,
   15-interval manufactured transport comparison.
3. Sealed z19/rho15/W27/F34/native-15 transport-only selected probes for both
   `L2` and `L3`.
4. Omitted, explicit-zero, and 0.25 Lambertian ground cases.
5. Cancellation, supersession, compile failure, layer-submission failure,
   reuse, replacement, publication, and disposal injection.
6. Flat 0, 135, and 180 renderer-faithful N4 captures.
7. Hardware-accelerated cold and warm timing and resource measurements.
8. Explicit spherical/distant packed-transport regression.

The applicable numerical authority compares every selected R32F scalar in
`J1`, `L1`, `J2`, `L2`, `J3`, `L3`, `J4`, and `Jthrough4`, plus the N1 and N2
prefix runs, against the sealed indexed pre-fusion snapshot. Indexed Step 0's
selected direct binary64 values provide the independent selected-query check.
Exact prefix and copy invariants remain bit-identical.

For the default maximum-quality preset's `L2`, `L3`, and every downstream field affected by either fused pass, run
both comparisons independently:

1. Candidate R32F output against Indexed Step 0's frozen selected direct
   binary64 CPU values.
2. Candidate R32F output against the immutable pre-fusion indexed-R32F
   snapshot.

The candidate must satisfy the declared R32F bound against both authorities;
agreement with one does not excuse a failure against the other. Manufactured
field comparisons use the exact `Math.fround` seed recipe whose selected GPU
seed readbacks were proven bit-identical in Step 3.

The default preset's production transport-only probe set uses position indices
`0, 14, 15, 16, 207, 268, 270, 284`, incoming indices
`0, 1, 4, 5, 8, 9, 32, 33`, and all 15 wavelengths. This yields 960 probes
per radiance field and remains below the executor's per-field probe limit.

The ground matrix compares exactly 3,300 scalars per case across `J1`, `L1`,
`J2`, `L2`, `J3`, `L3`, `J4`, and `Jthrough4`, including the N1 and N2 prefix
contracts:

- Omitted ground and explicit zero ground must be bit-identical for every
  scalar.
- Ground reflectance `0.25` must leave `J1` and `L1` bit-identical to the zero
  case and must change at least one scalar in every later field affected by
  ground reflection.
- Every cumulative scattering-density result must equal the ordered sum of
  its pure scattering-density inputs under the existing R32F accumulation
  contract.

The `0.25` case proves parity with the current implemented behavior. Keep its
status as implementation parity with independent reflective-ground validation
still pending; this transaction does not promote it to a validated physical
oracle.

The accepted comparison rule is:

```text
abs(actual - authority) <= absoluteTolerance
    + relativeTolerance * abs(authority)
```

The unchanged R32F limits are:

| Quantity                           | Absolute tolerance | Relative tolerance |
| ---------------------------------- | -----------------: | -----------------: |
| Pure radiance, including L2 and L3 |             `2e-9` |            `0.005` |
| Pure scattering density            |            `2e-12` |            `0.005` |
| Cumulative scattering density      |            `8e-12` |            `0.005` |

Also report maximum and p95 absolute, relative, and ULP residuals. Those
diagnostics do not replace the pass/fail limits.

The sealed policy has no selected visual pixels. The focused
[Flat180 diagnostic](flat180-star-production-diagnostic-plan.md) therefore owns
the current default's frozen camera, lobe region, causal counterfactual,
production capture, and measurements. It establishes that paired-Fibonacci-34
substantially reduced the old ordinary-Fibonacci imbalance but retained a
finite orientation-dependent N4 residual, and that the paired-plus-rotated
68-direction default removes the broad one-sided lobe while preserving the
immediately preceding clean orders and the fused transport architecture.

### Fused Step 7: Close current-state documentation and resume integration

Files to refresh after the required completion outcomes pass:

```text
agents/topics/algorithm32/cache/cache-design.md
agents/topics/algorithm32/production/current-dataflow.md
agents/topics/algorithm32/production/flat32-migration-inventory.md
agents/topics/algorithm32/flat-local/README.md
src/algorithm32/README.md
agents/topics/algorithm32/flat-local/gpu-transport-offload-plan.md
agents/topics/active-topic.md
```

Work:

- Replace the packed Flat/local dataflow with the fused construction path.
- Record exact numerical, lifecycle, browser, hardware, timing, and resource
  results at their canonical owners.
- Mark this plan complete after the required structural outcomes and the
  default-preset numerical and visual authority comparisons pass. Record every
  other observation as diagnostic evidence.
- Resume extraterrestrial production integration at its preserved Step 3
  boundary.

## Resource Reporting

Expected invariant resource facts after cutover:

| Resource                                       |            Expected value |
| ---------------------------------------------- | ------------------------: |
| Local shell facts                              |            `32,776` bytes |
| Local shell boundary texture                   |             `8,196` bytes |
| Flat packed transport data                     |                 `0` bytes |
| Resident final W27/z19/rho15/native-15 J field |        `74,795,400` bytes |
| Peak logical field storage                     |       `224,386,200` bytes |
| Peak packed fact-data storage                  | Recorded diagnostic value |
| Peak tracked storage                           | Recorded diagnostic value |

The zero Flat packed-transport fact is an observed required structural outcome
of this offload. The remaining resource values are default-preset diagnostics.

The old 164,652,480-byte transport payload and approximately
389,675,392-byte tracked peak are baselines to eliminate. Executor
`peakPackedDataStorage` is not required to be zero because it also counts
legitimate small wavelength, position, direction, and source-fact data.
Completion requires that no binding or allocation contains Flat/local
transport sources or coefficients and that every retained plan/source metric
for that payload reports exactly zero bytes.

Record all other cold and warm resource observations for future optimization
without comparing them against a limit.

## Capability And Observability Rules

Required structural outcomes for the default preset:

- packed Flat transport storage is zero;
- no CPU transport query/tap loop runs in the production planner; and
- `J2 -> L2` and `J3 -> L3` use the fused GPU contributor.

The implemented path requires WebGL2, fragment `highp` float/int arithmetic,
R32F array render targets, float sampling through `sampler2D` and
`sampler2DArray`, `texelFetch`, a texture width of at least 4,374 for the W27
field, and at least 15 array layers for native-15. It no longer requires the
indexed interim's 16,384-wide transport textures. The conformance environment
reported a 16,384 maximum texture size, 2,048 array layers, and
`EXT_color_buffer_float`; supported-hardware confirmation remains diagnostic
follow-up.

The completed implementation determines its required GPU capabilities. Record
the WebGL2, R32F array-render-target, float-sampling, precision, texture
size/layer, and shader facts it actually uses. Timing, compilation,
responsiveness, lifecycle, visual, and resource observations are diagnostics
for later optimization; they are not quality-selection inputs or pass/fail
budgets in this transaction.

If one fused layer makes the selected preset unacceptably slow, report that
experience or let the user choose a separately declared lower preset. A future
change may investigate bounded position-row submissions while preserving one
wavelength output and exact math. Do not combine all wavelength layers into
one uninterruptible draw.

If compilation dominates, separately investigate canonical positional input
sampler names so the `L2` and `L3` programs can share source and compiled
program identity. Do not broaden `CachePassAssembler` during the initial
cutover without measured need.

If GPU execution performs poorly, profile stencil search, random W27 reads,
exponentials, and duplicate shader compilation before proposing extra storage.
A preliminary GPU pass that recreates the padded 165 MB kernel is not an
accepted fallback. Any compact GPU-kernel alternative requires a separate
memory/performance comparison and explicit authorization.

## Verification Commands

Run focused scopes throughout the transaction, then the complete gates:

```text
npm run typecheck:algorithm32
npm run typecheck:flat32
npm run test:algorithm32
npm run karma
npm run test:algorithm32:three
npm run test:ui:flat32
npm run build
npx prettier --check <changed authored files>
git diff --check
```

Browser capability evidence must use hardware acceleration on a real GPU.
Software-renderer runs establish conformance only and cannot establish the
required GPU capability contract.

## Exit Boundary

This work is complete only when all of the following are true:

- `createBuildPlan()` performs no Flat transport table construction;
- `J2 -> L2` and `J3 -> L3` use the fused GPU contributor;
- shared executor, assembler, backend, atmosphere, and transport code contain
  no local-Sun algorithm-selection branch;
- distant-Sun transport remains behaviorally unchanged;
- the default maximum-quality preset passes its frozen numerical and visual
  authority comparisons;
- production allocates zero CPU or GPU packed Flat transport bytes.
