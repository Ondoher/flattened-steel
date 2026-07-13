# Algorithm32 Helper Ownership Inventory

Status: Step 4.5.1 complete on 2026-08-03. This document and its three
production-row appendices are the canonical classification input for
[reconciliation Step 4.5](./reconciliation-plan.md#45-reconcile-helper-ownership-as-code-moves).
They record the settled tree without choosing a Step 4.5.2 disposition or a
future namespace target.

## Scope And Source Identity

The inventory covers all **148** production JavaScript/JSX modules under
`src/algorithm32`, excluding `_tests` and browser specifications, plus only
exported test-support operations reused by another specification. Consumer
tracing covers **236** current JavaScript/JSX modules under
`src/algorithm32` and `src/flat32`, follows named/default/star re-exports
through current barrels, and records same-module and same-class references.
A separate current-source review found no additional live script consumer.

The source identity is the SHA-256 of each production module's relative path
and bytes in sorted path order:

`4aeeb00102d4713f3f31f219cdf9d71092a64d241279fd7e60411f0e84e090af`

Line numbers and consumer edges in the appendices belong to that identity.
Later implementation steps must refresh an affected row rather than treating
this snapshot as a permanent source-location oracle.

## Taxonomy

- `class-support` contains every underscore-prefixed production class method.
  Five receiver-verified calls from `Algorithm32ShaderHandle` back into
  `Algorithm32` are included as cross-module consumers.
- `class-public-internal` is a conservative candidate category: a public
  instance method or accessor read or invoked by another member of its own
  class. It does not recategorize that member as private or decide that it
  should move.
- `class-static-operation` contains every public static callable on a
  production class.
- `module-local-function` contains every non-exported top-level callable.
- `exported-function` contains every directly exported top-level callable,
  including the default-exported React component.
- `namespace-method` contains every function exposed through an existing
  namespace-style method owner.

Constructors, ordinary public class APIs with no same-class support use,
nested anonymous callbacks, and object-literal protocol methods are behavior
of their class or enclosing operation rather than separate helper rows.
Public collaborator methods called only by another class remain the
collaborator's class API. This boundary keeps Step 4.5 focused on helper and
module ownership without silently turning a full public-API inventory into
helper candidates.

Each row records the current path and form, nearest owner/domain path,
syntactic inputs, documented output (or the absence of a usable `@returns`
type), instance or mutable module-state dependence, lexical lifecycle terms,
and consumers. Lifecycle terms are evidence flags, not ownership decisions.
`[re-export]` identifies a barrel edge; the direct-use count excludes those
edges. `<module-initializer>` is a current module-initialization consumer.

## Production Summary

| Role | Rows |
| --- | ---: |
| Underscore class support | 245 |
| Public/accessor internal-use candidate | 41 |
| Public static operation | 4 |
| Module-local function | 207 |
| Exported top-level function | 128 |
| Namespace method | 72 |
| **Total production operations** | **697** |

The production registry covers **102** function-bearing modules,
**65** class declarations, and **44** classes with at
least one scoped class-operation candidate. All top-level callable owners are
function declarations; there is no top-level arrow/function-expression owner.

### Domain distribution

| Root owner/domain | Function-bearing modules | Class support | Public internal-use | Static | Module-local | Exported | Namespace | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `adapters` | 3 | 23 | 0 | 0 | 2 | 8 | 0 | 33 |
| `atmospheres` | 1 | 3 | 3 | 0 | 8 | 0 | 0 | 14 |
| `color` | 1 | 13 | 8 | 0 | 0 | 0 | 0 | 21 |
| `domains` | 6 | 21 | 1 | 0 | 0 | 5 | 0 | 27 |
| `extraterrestrial` | 1 | 1 | 0 | 0 | 11 | 0 | 0 | 12 |
| `geometry` | 11 | 49 | 16 | 0 | 13 | 21 | 0 | 99 |
| `gpu-assembler` | 4 | 0 | 0 | 0 | 18 | 10 | 0 | 28 |
| `gpu-runtime` | 3 | 0 | 0 | 0 | 39 | 2 | 0 | 41 |
| `ground-boundaries` | 2 | 2 | 0 | 0 | 0 | 1 | 0 | 3 |
| `light-sources` | 33 | 60 | 0 | 4 | 66 | 37 | 0 | 167 |
| `profiles` | 2 | 0 | 0 | 0 | 6 | 1 | 0 | 7 |
| `quantities` | 7 | 0 | 0 | 0 | 8 | 24 | 0 | 32 |
| `runtime` | 10 | 48 | 12 | 0 | 19 | 0 | 0 | 79 |
| `transport` | 6 | 25 | 1 | 0 | 12 | 4 | 0 | 42 |
| `utils` | 12 | 0 | 0 | 0 | 5 | 15 | 72 | 92 |

## Authoritative Production Row Partitions

The complete 697-row registry is partitioned by mutually exclusive root
sets. A row's authoritative identity is `current path + symbol + role`.

| Appendix | Roots | Rows |
| --- | --- | ---: |
| [Foundation rows](./helper-ownership-inventory-foundation.md) | `utils`, `quantities`, `domains`, `transport`, `references` | 193 |
| [Physical rows](./helper-ownership-inventory-physical.md) | `atmospheres`, `color`, `geometry`, `ground-boundaries`, `light-sources`, `extraterrestrial`, `profiles` | 323 |
| [Runtime rows](./helper-ownership-inventory-runtime.md) | `adapters`, `gpu-assembler`, `gpu-runtime`, `runtime` | 181 |
| **Total** | All production roots | **697** |

## Existing Namespace Owners

The settled tree has **8** namespace owners and **72**
namespace methods. Every method has its own authoritative row in the
foundation appendix.

| Path | Namespace | Method rows | Current module consumers |
| --- | --- | ---: | --- |
| `utils/math/AngleMath.js` | `AngleMath` | 10 | `src/algorithm32/extraterrestrial/sun/FlatSynchronizer.js`<br>`src/algorithm32/light-sources/distant-sun/DistantSunLightSource.js`<br>`src/algorithm32/utils/math/_tests/utils.spec.js`<br>`src/algorithm32/utils/math/index.js [re-export]`<br>`src/flat32/LocationTimeController.js` |
| `utils/math/ArrayMath.js` | `ArrayMath` | 7 | `src/algorithm32/utils/math/VectorMath.js`<br>`src/algorithm32/utils/math/_tests/utils.spec.js`<br>`src/algorithm32/utils/math/index.js [re-export]` |
| `utils/math/DistanceMath.js` | `DistanceMath` | 12 | `src/algorithm32/adapters/react/algorithm32-react-utils.js`<br>`src/algorithm32/atmospheres/canonical/CanonicalAtmosphere.js`<br>`src/algorithm32/geometry/flat/FlatEarthGeometry.js`<br>`src/algorithm32/geometry/flat/FlatGeometryCacheModuleProvider.js`<br>`src/algorithm32/geometry/flat/FlatGeometryShaderContributor.js`<br>`src/algorithm32/geometry/flat/FlatScatteringCacheGeometry.js`<br>`src/algorithm32/geometry/flat/three/FlatGeometrySceneAdapter.js`<br>`src/algorithm32/geometry/shared/geometry-coordinates.js`<br>`src/algorithm32/geometry/shared/geometry-request-normalization.js`<br>`src/algorithm32/geometry/spherical/SphericalEarthGeometry.js`<br>`src/algorithm32/geometry/spherical/SphericalGeometryCacheModuleProvider.js`<br>`src/algorithm32/geometry/spherical/SphericalScatteringCacheGeometry.js`<br>`src/algorithm32/geometry/spherical/three/SphericalGeometrySceneAdapter.js`<br>`src/algorithm32/light-sources/distant-sun/cache/distant-sun-later-order-scattering-density.js`<br>`src/algorithm32/light-sources/local-sun/LocalSunLightSource.js`<br>`src/algorithm32/light-sources/local-sun/cache/local-sun-later-order-scattering-density.js`<br>`src/algorithm32/light-sources/local-sun/local-sun-geometry-pairing.js`<br>`src/algorithm32/runtime/rendering/ShaderBuilder.js`<br>`src/algorithm32/runtime/rendering/three/SceneInputCapture.js`<br>`src/algorithm32/runtime/rendering/three/ShaderRuntimeInstaller.js`<br>`src/algorithm32/transport/scattering-density-transport.js`<br>`src/algorithm32/transport/spectral/SpectralCalculator.js`<br>`src/algorithm32/utils/math/SceneMath.js`<br>`src/algorithm32/utils/math/_tests/utils.spec.js`<br>`src/algorithm32/utils/math/index.js [re-export]`<br>`src/flat32/FlatLocalMode.js` |
| `utils/math/SampleMath.js` | `SampleMath` | 5 | `src/algorithm32/utils/math/_tests/utils.spec.js`<br>`src/algorithm32/utils/math/index.js [re-export]` |
| `utils/math/ScalarMath.js` | `ScalarMath` | 6 | `src/algorithm32/color/bruneton/BrunetonColorDisplayModel.js`<br>`src/algorithm32/utils/math/_tests/utils.spec.js`<br>`src/algorithm32/utils/math/index.js [re-export]` |
| `utils/math/SceneMath.js` | `SceneMath` | 10 | `src/algorithm32/adapters/react/algorithm32-react-utils.js`<br>`src/algorithm32/adapters/react/consts.js`<br>`src/algorithm32/geometry/flat/three/ExactFlatGroundObject.js`<br>`src/algorithm32/geometry/flat/three/FlatGeometrySceneAdapter.js`<br>`src/algorithm32/geometry/shared/geometry-coordinates.js`<br>`src/algorithm32/geometry/spherical/three/ExactSphereGroundObject.js`<br>`src/algorithm32/geometry/spherical/three/SphericalGeometrySceneAdapter.js`<br>`src/algorithm32/light-sources/distant-sun/three/DistantSunSceneLightingAdapter.js`<br>`src/algorithm32/light-sources/local-sun/three/LocalSunSceneLightingAdapter.js`<br>`src/algorithm32/light-sources/shared/light-source-request-values.js`<br>`src/algorithm32/runtime/rendering/ShaderBuilder.js`<br>`src/algorithm32/runtime/rendering/three/SceneInputCapture.js`<br>`src/algorithm32/runtime/rendering/three/ShaderRuntimeInstaller.js`<br>`src/algorithm32/utils/math/_tests/utils.spec.js`<br>`src/algorithm32/utils/math/index.js [re-export]`<br>`src/flat32/Algorithm32Runtime.js` |
| `utils/math/VectorMath.js` | `VectorMath` | 14 | `src/algorithm32/atmospheres/canonical/CanonicalAtmosphere.js`<br>`src/algorithm32/geometry/flat/FlatEarthGeometry.js`<br>`src/algorithm32/geometry/flat/FlatScatteringCacheGeometry.js`<br>`src/algorithm32/geometry/flat/three/FlatGeometrySceneAdapter.js`<br>`src/algorithm32/geometry/shared/geometry-coordinates.js`<br>`src/algorithm32/geometry/spherical/SphericalEarthGeometry.js`<br>`src/algorithm32/geometry/spherical/SphericalGeometryShaderContributor.js`<br>`src/algorithm32/geometry/spherical/SphericalScatteringCacheGeometry.js`<br>`src/algorithm32/geometry/spherical/three/SphericalGeometrySceneAdapter.js`<br>`src/algorithm32/light-sources/distant-sun/DistantSunLightSource.js`<br>`src/algorithm32/light-sources/distant-sun/cache/_tests/distant-sun-later-order-scattering-density.spec.js`<br>`src/algorithm32/light-sources/shared/light-source-request-values.js`<br>`src/algorithm32/transport/spectral/SpectralCalculator.js`<br>`src/algorithm32/utils/math/_tests/utils.spec.js`<br>`src/algorithm32/utils/math/index.js [re-export]` |
| `utils/math/WavelengthMath.js` | `WavelengthMath` | 8 | `src/algorithm32/atmospheres/canonical/CanonicalAtmosphere.js`<br>`src/algorithm32/utils/math/_tests/utils.spec.js`<br>`src/algorithm32/utils/math/index.js [re-export]` |

## Multi-Export Function Modules

Exactly **24** production modules export more than one
top-level function. Every named export below has a separate authoritative
production row; current co-location is not an ownership conclusion.

| Module | Exported function rows | Symbols |
| --- | ---: | --- |
| `adapters/react/algorithm32-react-utils.js` | 7 | `acceptAlgorithm32RequiredThreeObjectsPacket`, `createAlgorithm32BindingValues`, `updateAlgorithm32BindingValues`, `createAlgorithm32RequiredThreeObjects`, `createAlgorithm32SceneColorRenderTarget`, `algorithm32ViewportSize`, `algorithm32RenderPriority` |
| `domains/direction/cubed-sphere/cubed-sphere-w27-direction-domain.js` | 4 | `createCubedSphereW27DirectionDomain`, `flattenCubedSphereW27NodeIndex`, `unflattenCubedSphereW27NodeIndex`, `createCubedSphereW27DirectionStencil` |
| `geometry/shared/geometry-coordinates.js` | 8 | `directionTuple`, `positionToMeters`, `positionInMeters`, `scenePositionInUnits`, `normalizeDirection`, `normalizeTrustedDirection`, `sceneScaleFromRequest`, `threeVectorTuple` |
| `geometry/shared/geometry-request-normalization.js` | 10 | `stringOrDefault`, `optionalString`, `geometryEndpointShadowRequestOrNull`, `positiveDistanceMetersOrDefault`, `optionalDistanceToMeters`, `sourcePathLimitDistanceToMeters`, `positiveIntegerOrDefault`, `displayRgbaOrNull`, `visualMaterialLightingOrDefault`, `clamp` |
| `geometry/spherical/scattering-cache-direction-frames.js` | 3 | `physicalFibonacciDirection`, `physicalW27Direction`, `localW27Direction` |
| `gpu-assembler/base/shader-contribution.js` | 8 | `createShaderContribution`, `createShaderSourceBlock`, `createShaderUniformDeclaration`, `createShaderTextureDeclaration`, `createShaderBindingRequirement`, `formatShaderFloat`, `formatShaderFloatArray`, `formatShaderVec3` |
| `gpu-assembler/cache-pass/cache-build-contracts.js` | 2 | `cacheFieldInputBindingName`, `createCacheBuildModule` |
| `gpu-runtime/cache/cache-values.js` | 2 | `createCacheData`, `createCachePlanIdentity` |
| `light-sources/distant-sun/cache/distant-sun-cache-plan.js` | 2 | `createDistantSunCacheLayoutModule`, `createDistantSunCacheBuildPlan` |
| `light-sources/distant-sun/cache/distant-sun-cpu-fields.js` | 3 | `createDistantSunCpuPureRadianceField`, `createDistantSunCpuPureScatteringDensityField`, `createDistantSunCpuCumulativeScatteringDensityField` |
| `light-sources/distant-sun/cache/distant-sun-primary-radiance.js` | 2 | `createDistantSunCpuSpectralCalculator`, `buildDistantSunCpuPrimaryRadiance` |
| `light-sources/local-sun/cache/local-sun-cache-plan.js` | 2 | `createLocalSunCacheLayoutModule`, `createLocalSunCacheBuildPlan` |
| `light-sources/shared/light-source-request-values.js` | 10 | `acceptSourceIrradiance`, `clamp01`, `sceneAmbientIntensityRangeOrDefault`, `scaleRange`, `scenePositionOrDefault`, `sceneDistanceOrDefault`, `pixelSizeOrDefault`, `pixelDistanceOrDefault`, `requiredStringOrDefault`, `normalizeDirection` |
| `light-sources/shared/three/three-lighting-support.js` | 5 | `layerIndexOrNull`, `applyLayerIndex`, `assertOnlyProperties`, `addLightingObjectsToScene`, `configureThreeShadowObject` |
| `quantities/spectral/spectral-bases.js` | 3 | `createSpectralBasis`, `assertSpectralBasis`, `assertCompatibleSpectralBases` |
| `quantities/spectral/spectral-math.js` | 7 | `zeroSpectralPacket`, `oneSpectralPacket`, `scaleSpectralPacket`, `addSpectralPackets`, `multiplySpectralPackets`, `divideSpectralPackets`, `mapSpectralPacket` |
| `quantities/spectral/spectral-packet-contract.js` | 4 | `requireSpectralQuantity`, `spectralUnitsForQuantity`, `normalizeSpectralUnits`, `normalizeSpectralValues` |
| `quantities/spectral/spectral-packets.js` | 3 | `createSpectralPacket`, `assertSpectralPacket`, `assertCompatibleSpectralPackets` |
| `quantities/units/unit-values.js` | 6 | `createUnitValue`, `assertUnitValue`, `isUnitValue`, `copyUnitValue`, `convertUnitValue`, `normalizeUnitValue` |
| `transport/scattering-order-field-operations.js` | 2 | `buildNextScatteringOrder`, `accumulatePureScatteringFields` |
| `utils/identity/value-hashes.js` | 3 | `sha256Value`, `stableStringify`, `stableHash` |
| `utils/math/pixel-math.js` | 5 | `acceptPixelSize`, `createPixelSize`, `pixelSizeToShaderValue`, `acceptPixelDistance`, `createPixelDistance` |
| `utils/time/duration-values.js` | 3 | `durationInSeconds`, `durationFromMilliseconds`, `durationFromNanoseconds` |
| `utils/validation/value-assertions.js` | 4 | `isTypedArray`, `finiteNumberOrDefault`, `requiredString`, `positiveInteger` |

## Factory And Profile Inputs

No named `*Factory` class, module, namespace, or export exists in the scoped
tree. The lexical construction audit tags 95 `create*`, `build*`, or public
`from*` operations as classification candidates only. A construction-shaped
name does not establish an architectural factory.

| Candidate role | Rows |
| --- | ---: |
| `class-static-operation` | 4 |
| `module-local-function` | 47 |
| `exported-function` | 44 |
| **Total** | **95** |

The Native-15 owner has **7** production profile operations, already
tagged in the physical appendix:

| Production row reference | Form |
| --- | --- |
| `profiles/native-15/consts.js:createSpectralChannel` | module-local function |
| `profiles/native-15/native-15-profile.js:createNativePhysicalProfile` | module-local function |
| `profiles/native-15/native-15-profile.js:createNativePhysicalProfileWithGround` | module-local function |
| `profiles/native-15/native-15-profile.js:createNativeNumericalProfile` | module-local function |
| `profiles/native-15/native-15-profile.js:assertNativeSourcePacket` | module-local function |
| `profiles/native-15/native-15-profile.js:acceptNativeGroundAlbedo` | module-local function |
| `profiles/native-15/native-15-profile.js:createNativeProductionProfile` | named exported function |

It also owns the following **3** exported profile values. These
are authoritative non-callable inventory rows and therefore do not appear in
the production-operation appendices.

| Current path | Line | Symbol | Type | Current owner/domain | Consumers |
| --- | ---: | --- | --- | --- | --- |
| `profiles/native-15/native-15-profile.js` | 131 | `DEFAULT_NATIVE_PHYSICAL_PROFILE` | `NativePhysicalProfile` | `profiles/native-15` | `src/algorithm32/profiles/index.js [re-export]`<br>`src/algorithm32/profiles/native-15/_tests/native-15-profile.spec.js` |
| `profiles/native-15/native-15-profile.js` | 181 | `DEFAULT_NATIVE_NUMERICAL_PROFILE` | `NativeNumericalProfile` | `profiles/native-15` | `src/algorithm32/profiles/index.js [re-export]`<br>`src/algorithm32/profiles/native-15/_tests/native-15-profile.spec.js` |
| `profiles/native-15/native-15-profile.js` | 249 | `DEFAULT_NATIVE_PRODUCTION_PROFILE` | `NativeProductionProfile` | `profiles/native-15` | `src/algorithm32/light-sources/distant-sun/cache/DistantSunCacheProvider.js`<br>`src/algorithm32/light-sources/distant-sun/cache/distant-sun-primary-radiance.js`<br>`src/algorithm32/light-sources/distant-sun/cache/distant-sun-primary-scattering-density.js`<br>`src/algorithm32/light-sources/local-sun/cache/LocalSunCacheProvider.js`<br>`src/algorithm32/light-sources/local-sun/cache/_tests/local-sun-cpu-cache.spec.js`<br>`src/algorithm32/profiles/index.js [re-export]`<br>`src/algorithm32/profiles/native-15/_tests/native-15-profile.spec.js`<br>`src/flat32/FlatLocalMode.js`<br>`src/flat32/SphericalDistantMode.js` |

Whether these values and creator together satisfy the complete profile
standard is deliberately deferred to Step 4.5.5.

## Reused Exported Test Support

Exactly **11** exported test-support operations are reused
outside their defining support module. These are authoritative inventory
rows in addition to the 697 production rows.

| Current path | Line | Symbol | Form | Inputs | Output | State/lifecycle evidence | Consumers |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `light-sources/shared/_tests/spectral-test-values.js` | 35 | `createTestSourceIrradiance` | named exported test-support function | `values, basis` | `SpectralIrradiancePacket` | `none` | `src/algorithm32/light-sources/distant-sun/_tests/distant-sun-light-source.spec.js`<br>`src/algorithm32/light-sources/local-sun/_tests/LocalSunLightSource.spec.js`<br>`src/algorithm32/light-sources/local-sun/cache/_tests/LocalSunConstructionLightSource.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 14 | `ShaderBuilderTestSupport.pixelSize` | ShaderBuilderTestSupport test-support namespace method | `width, height` | `value [no @returns type]` | `none` | `src/algorithm32/runtime/rendering/_tests/shader-builder-assembly.spec.js`<br>`src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 18 | `ShaderBuilderTestSupport.createAutomaticShaderModel` | ShaderBuilderTestSupport test-support namespace method | `controller` | `value [no @returns type]` | `none; lexical lifecycle terms: Controller, controller` | `src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 73 | `ShaderBuilderTestSupport.createShaderCacheDouble` | ShaderBuilderTestSupport test-support namespace method | `none` | `value [no @returns type]` | `none; lexical lifecycle terms: dispose` | `src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 117 | `ShaderBuilderTestSupport.createCacheControllerDouble` | ShaderBuilderTestSupport test-support namespace method | `cache` | `value [no @returns type]` | `none; lexical lifecycle terms: dispose` | `src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 125 | `ShaderBuilderTestSupport.createCacheBackendDouble` | ShaderBuilderTestSupport test-support namespace method | `none` | `value [no @returns type]` | `none` | `src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 139 | `ShaderBuilderTestSupport.createTransportDouble` | ShaderBuilderTestSupport test-support namespace method | `none` | `value [no @returns type]` | `none` | `src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 163 | `ShaderBuilderTestSupport.createColorDouble` | ShaderBuilderTestSupport test-support namespace method | `none` | `value [no @returns type]` | `none` | `src/algorithm32/runtime/rendering/_tests/shader-builder-assembly.spec.js`<br>`src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 198 | `ShaderBuilderTestSupport.createContribution` | ShaderBuilderTestSupport test-support namespace method | `overrides` | `ShaderContribution` | `none` | `src/algorithm32/runtime/rendering/_tests/shader-builder-assembly.spec.js`<br>`src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 247 | `ShaderBuilderTestSupport.createComposerDouble` | ShaderBuilderTestSupport test-support namespace method | `none` | `object` | `none` | `src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | 268 | `ShaderBuilderTestSupport.createThreeDouble` | ShaderBuilderTestSupport test-support namespace method | `none` | `object` | `none; lexical lifecycle terms: RenderTarget, dispose` | `src/algorithm32/runtime/rendering/_tests/shader-builder-runtime.spec.js` |

The complete Step 4.5.1 registry therefore contains **711**
authoritative rows: 697 production operations, 3 profile values, and 11
reused test-support operations.

## Consumer Closure

All class-support, conservative public-internal, public-static, module-local,
and namespace rows have at least one traced consumer. One exported production
function has no live import, re-export, or same-module use:

| Current path | Line | Symbol | Current form |
| --- | ---: | --- | --- |
| `geometry/shared/geometry-request-normalization.js` | 145 | `sourcePathLimitDistanceToMeters` | named exported function |

That explicit `None located` result is a traced absence and becomes a
Step 4.5.2 disposition input; it is not an unresolved edge.

## Production Module Coverage

Every production JavaScript/JSX module appears exactly once below, including
modules with zero scoped operations. Counts use the role order defined above.

| Current module | Class support | Public internal-use | Static | Module-local | Exported | Namespace | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `adapters/react/Algorithm32AtmosphereComposer.js` | 23 | 0 | 0 | 0 | 0 | 0 | 23 |
| `adapters/react/Algorithm32R3FAtmosphereComposer.jsx` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `adapters/react/algorithm32-react-utils.js` | 0 | 0 | 0 | 2 | 7 | 0 | 9 |
| `adapters/react/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `adapters/react/index.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `atmospheres/canonical/CanonicalAtmosphere.js` | 3 | 3 | 0 | 8 | 0 | 0 | 14 |
| `atmospheres/canonical/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `color/bruneton/BrunetonColorDisplayModel.js` | 13 | 8 | 0 | 0 | 0 | 0 | 21 |
| `color/bruneton/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | 17 | 1 | 0 | 0 | 0 | 0 | 18 |
| `domains/direction/cubed-sphere/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `domains/direction/cubed-sphere/cubed-sphere-w27-direction-domain.js` | 0 | 0 | 0 | 0 | 4 | 0 | 4 |
| `domains/direction/fibonacci/Fibonacci34DirectionDomain.js` | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js` | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `domains/direction/fibonacci/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `domains/index.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `domains/position/spherical-native/SphericalNativePositionDomain.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `domains/position/spherical-native/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `domains/position/spherical-native/native-48-position-domain.js` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `extraterrestrial/sun/FlatSynchronizer.js` | 1 | 0 | 0 | 11 | 0 | 0 | 12 |
| `geometry/flat/FlatEarthGeometry.js` | 6 | 4 | 0 | 0 | 0 | 0 | 10 |
| `geometry/flat/FlatGeometryCacheModuleProvider.js` | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `geometry/flat/FlatGeometryShaderContributor.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `geometry/flat/FlatScatteringCacheGeometry.js` | 10 | 4 | 0 | 0 | 0 | 0 | 14 |
| `geometry/flat/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `geometry/flat/three/ExactFlatGroundObject.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `geometry/flat/three/FlatGeometrySceneAdapter.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `geometry/shared/geometry-coordinates.js` | 0 | 0 | 0 | 0 | 8 | 0 | 8 |
| `geometry/shared/geometry-request-normalization.js` | 0 | 0 | 0 | 2 | 10 | 0 | 12 |
| `geometry/spherical/SphericalEarthGeometry.js` | 6 | 3 | 0 | 0 | 0 | 0 | 9 |
| `geometry/spherical/SphericalGeometryCacheModuleProvider.js` | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `geometry/spherical/SphericalGeometryShaderContributor.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `geometry/spherical/SphericalScatteringCacheGeometry.js` | 5 | 5 | 0 | 0 | 0 | 0 | 10 |
| `geometry/spherical/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `geometry/spherical/scattering-cache-direction-frames.js` | 0 | 0 | 0 | 11 | 3 | 0 | 14 |
| `geometry/spherical/three/ExactSphereGroundObject.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `geometry/spherical/three/SphericalGeometrySceneAdapter.js` | 16 | 0 | 0 | 0 | 0 | 0 | 16 |
| `gpu-assembler/base/shader-contribution.js` | 0 | 0 | 0 | 0 | 8 | 0 | 8 |
| `gpu-assembler/cache-pass/CachePassAssembler.js` | 0 | 0 | 0 | 10 | 0 | 0 | 10 |
| `gpu-assembler/cache-pass/cache-build-contracts.js` | 0 | 0 | 0 | 1 | 2 | 0 | 3 |
| `gpu-assembler/cache-pass/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `gpu-assembler/runtime/Algorithm32ShaderAssembler.js` | 0 | 0 | 0 | 7 | 0 | 0 | 7 |
| `gpu-assembler/runtime/ShaderCompatibilityValidator.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `gpu-runtime/cache/CacheGpuExecutor.js` | 0 | 0 | 0 | 15 | 0 | 0 | 15 |
| `gpu-runtime/cache/cache-values.js` | 0 | 0 | 0 | 0 | 2 | 0 | 2 |
| `gpu-runtime/cache/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `gpu-runtime/cache/three/ThreeCacheBackend.js` | 0 | 0 | 0 | 24 | 0 | 0 | 24 |
| `ground-boundaries/index.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `ground-boundaries/shared/cache/canonical-black-ground.js` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `ground-boundaries/shared/cache/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `ground-boundaries/uniform-lambertian/UniformLambertianGroundBoundary.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `ground-boundaries/uniform-lambertian/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/distant-sun/DistantSunLightSource.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/distant-sun/DistantSunShaderContributor.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/distant-sun/cache/DistantSunCache.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/distant-sun/cache/DistantSunCacheController.js` | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| `light-sources/distant-sun/cache/DistantSunCacheProvider.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `light-sources/distant-sun/cache/DistantSunConstructionDomainSelection.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/distant-sun/cache/DistantSunCpuCache.js` | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `light-sources/distant-sun/cache/DistantSunFieldPacking.js` | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `light-sources/distant-sun/cache/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/distant-sun/cache/distant-sun-cache-plan.js` | 0 | 0 | 0 | 8 | 2 | 0 | 10 |
| `light-sources/distant-sun/cache/distant-sun-cache-reuse-key.js` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `light-sources/distant-sun/cache/distant-sun-cpu-cache-build.js` | 0 | 0 | 0 | 3 | 1 | 0 | 4 |
| `light-sources/distant-sun/cache/distant-sun-cpu-fields.js` | 0 | 0 | 0 | 1 | 3 | 0 | 4 |
| `light-sources/distant-sun/cache/distant-sun-later-order-scattering-density.js` | 0 | 0 | 0 | 15 | 1 | 0 | 16 |
| `light-sources/distant-sun/cache/distant-sun-primary-radiance.js` | 0 | 0 | 0 | 5 | 2 | 0 | 7 |
| `light-sources/distant-sun/cache/distant-sun-primary-scattering-density.js` | 0 | 0 | 0 | 7 | 1 | 0 | 8 |
| `light-sources/distant-sun/cache/distant-sun-scattering-density-transport.js` | 0 | 0 | 0 | 3 | 1 | 0 | 4 |
| `light-sources/distant-sun/three/DistantSunSceneLightingAdapter.js` | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| `light-sources/distant-sun/three/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/local-sun/LocalSunLightSource.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/local-sun/LocalSunShaderContributor.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/local-sun/cache/LocalSunCache.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/local-sun/cache/LocalSunCacheController.js` | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| `light-sources/local-sun/cache/LocalSunCacheProvider.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `light-sources/local-sun/cache/LocalSunCacheSource.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `light-sources/local-sun/cache/LocalSunConstructionDomainSelection.js` | 0 | 0 | 1 | 0 | 0 | 0 | 1 |
| `light-sources/local-sun/cache/LocalSunConstructionLightSource.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/local-sun/cache/LocalSunCpuCache.js` | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `light-sources/local-sun/cache/LocalSunCpuFields.js` | 1 | 0 | 3 | 0 | 0 | 0 | 4 |
| `light-sources/local-sun/cache/LocalSunFieldPacking.js` | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `light-sources/local-sun/cache/LocalSunShellFactCache.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/local-sun/cache/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/local-sun/cache/create-local-sun-shell-fact-cache.js` | 0 | 0 | 0 | 5 | 1 | 0 | 6 |
| `light-sources/local-sun/cache/local-sun-cache-plan.js` | 0 | 0 | 0 | 8 | 2 | 0 | 10 |
| `light-sources/local-sun/cache/local-sun-cache-reuse-key.js` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `light-sources/local-sun/cache/local-sun-cpu-cache-build.js` | 0 | 0 | 0 | 2 | 1 | 0 | 3 |
| `light-sources/local-sun/cache/local-sun-later-order-scattering-density.js` | 0 | 0 | 0 | 7 | 1 | 0 | 8 |
| `light-sources/local-sun/cache/local-sun-primary-radiance.js` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `light-sources/local-sun/cache/local-sun-primary-scattering-density.js` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `light-sources/local-sun/cache/local-sun-scattering-density-transport.js` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `light-sources/local-sun/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/local-sun/local-sun-geometry-pairing.js` | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `light-sources/local-sun/three/LocalSunSceneLightingAdapter.js` | 17 | 0 | 0 | 0 | 0 | 0 | 17 |
| `light-sources/shared/cache/CpuDirectionalSpectralField.js` | 3 | 0 | 0 | 1 | 0 | 0 | 4 |
| `light-sources/shared/cache/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/shared/cache/index.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `light-sources/shared/light-source-request-values.js` | 0 | 0 | 0 | 0 | 10 | 0 | 10 |
| `light-sources/shared/three/three-lighting-support.js` | 0 | 0 | 0 | 1 | 5 | 0 | 6 |
| `profiles/index.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `profiles/native-15/consts.js` | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| `profiles/native-15/native-15-profile.js` | 0 | 0 | 0 | 5 | 1 | 0 | 6 |
| `quantities/index.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `quantities/spectral/SpectralBasis.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `quantities/spectral/SpectralPacket.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `quantities/spectral/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `quantities/spectral/spectral-bases.js` | 0 | 0 | 0 | 0 | 3 | 0 | 3 |
| `quantities/spectral/spectral-basis-contract.js` | 0 | 0 | 0 | 1 | 1 | 0 | 2 |
| `quantities/spectral/spectral-math.js` | 0 | 0 | 0 | 5 | 7 | 0 | 12 |
| `quantities/spectral/spectral-packet-contract.js` | 0 | 0 | 0 | 0 | 4 | 0 | 4 |
| `quantities/spectral/spectral-packets.js` | 0 | 0 | 0 | 0 | 3 | 0 | 3 |
| `quantities/units/consts.js` | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| `quantities/units/unit-values.js` | 0 | 0 | 0 | 1 | 6 | 0 | 7 |
| `runtime/facade/Algorithm32.js` | 10 | 1 | 0 | 1 | 0 | 0 | 12 |
| `runtime/facade/Algorithm32ShaderHandle.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `runtime/model/SharedModel.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `runtime/model/SpectralModel.js` | 1 | 1 | 0 | 0 | 0 | 0 | 2 |
| `runtime/reference/Reference.js` | 4 | 2 | 0 | 0 | 0 | 0 | 6 |
| `runtime/rendering/ShaderAssemblyPreparer.js` | 5 | 1 | 0 | 0 | 0 | 0 | 6 |
| `runtime/rendering/ShaderBuilder.js` | 8 | 1 | 0 | 0 | 0 | 0 | 9 |
| `runtime/rendering/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `runtime/rendering/three/SceneInputCapture.js` | 2 | 4 | 0 | 16 | 0 | 0 | 22 |
| `runtime/rendering/three/ShaderPassPerformanceTimer.js` | 2 | 2 | 0 | 2 | 0 | 0 | 6 |
| `runtime/rendering/three/ShaderRuntimeInstaller.js` | 12 | 0 | 0 | 0 | 0 | 0 | 12 |
| `runtime/rendering/three/ShaderRuntimePass.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `runtime/rendering/three/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `transport/Algorithm32Transport.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `transport/cache/CacheOperations.js` | 10 | 0 | 0 | 0 | 0 | 0 | 10 |
| `transport/cache/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `transport/consts.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `transport/later-order-scattering-density.js` | 0 | 0 | 0 | 3 | 1 | 0 | 4 |
| `transport/scattering-density-transport.js` | 0 | 0 | 0 | 5 | 1 | 0 | 6 |
| `transport/scattering-order-field-operations.js` | 0 | 0 | 0 | 4 | 2 | 0 | 6 |
| `transport/spectral/SpectralCalculator.js` | 12 | 1 | 0 | 0 | 0 | 0 | 13 |
| `utils/identity/value-hashes.js` | 0 | 0 | 0 | 3 | 3 | 0 | 6 |
| `utils/math/AngleMath.js` | 0 | 0 | 0 | 1 | 0 | 10 | 11 |
| `utils/math/ArrayMath.js` | 0 | 0 | 0 | 0 | 0 | 7 | 7 |
| `utils/math/DistanceMath.js` | 0 | 0 | 0 | 0 | 0 | 12 | 12 |
| `utils/math/SampleMath.js` | 0 | 0 | 0 | 0 | 0 | 5 | 5 |
| `utils/math/ScalarMath.js` | 0 | 0 | 0 | 0 | 0 | 6 | 6 |
| `utils/math/SceneMath.js` | 0 | 0 | 0 | 0 | 0 | 10 | 10 |
| `utils/math/VectorMath.js` | 0 | 0 | 0 | 0 | 0 | 14 | 14 |
| `utils/math/WavelengthMath.js` | 0 | 0 | 0 | 0 | 0 | 8 | 8 |
| `utils/math/index.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `utils/math/pixel-math.js` | 0 | 0 | 0 | 1 | 5 | 0 | 6 |
| `utils/time/duration-values.js` | 0 | 0 | 0 | 0 | 3 | 0 | 3 |
| `utils/validation/value-assertions.js` | 0 | 0 | 0 | 0 | 4 | 0 | 4 |

## Completion Checks

- Production source identity: unchanged during this read-only implementation
  audit.
- Production modules: 148 expected, 148 covered exactly once.
- Production row identities: 697 expected, 697 unique, zero duplicate
  `path + symbol + role` keys.
- Partition closure: 193 + 323 + 181 = 697.
- Multi-export closure: 24 modules, with every exported function represented
  by its own production row.
- Consumer closure: zero unresolved class-support, public-internal, static,
  module-local, or namespace row; one explicitly unused exported function.
- Profile closure: seven operation rows plus three exported value rows.
- Reused test-support closure: 11 unique rows.
- Named factory-owner inventory: zero; 95 lexical construction-shaped
  candidates remain undisposed.

Step 4.5.1 is complete. The canonical
[Step 4.5.2 classification](./helper-ownership-classification.md) now assigns
every authoritative row a keep-on-class, return-to-class, or
class-independent disposition. The canonical
[Step 4.5.3 target plan](./helper-ownership-target-plan.md) now assigns each row
one exact owner and dependency-safe batch. Step 4.5.4 implemented and gated
all 89 immediate rows on 2026-08-04; this inventory remains the immutable
pre-migration identity record. Step 4.5.5 implemented and gated all 264
construction/profile/test-support rows on 2026-08-04. The independent Step
4.5.6 audit reproduced the settled inventory and closed helper ownership with
no finding or exception. Reconciliation
[Step 5](./reconciliation-plan.md#5-reconcile-ambient-types) then closed the
ambient declaration surface. Steps 6.1-6.3 are complete, and Step 7.1 is current.
