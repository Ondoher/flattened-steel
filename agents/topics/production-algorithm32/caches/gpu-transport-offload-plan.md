# Flat/Local GPU Transport Offload Plan

Focus: Cache construction, storage, reconstruction, loading, and optimization.

Related owners: [interaction-prototypes](../../poc-flat32/interaction-prototypes/gpu-transport-offload-plan.md), [qualification](../qualification/gpu-transport-offload-plan.md), [execution-profiles](../execution-profiles/gpu-transport-offload-plan.md).

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
