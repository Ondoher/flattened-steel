# Algorithm32 Helper Ownership Target Plan

Status: Step 4.5.3 target design and all Step 4.5.4-4.5.5 migrations are
complete as of 2026-08-04. This document and its four target appendices remain
the canonical ownership and migration-batch design for
[reconciliation Step 4.5](./reconciliation-plan.md#45-reconcile-helper-ownership-as-code-moves).
The recorded source identity is the immutable planning input; the execution
results below own the current Step 4.5.4-4.5.5 state.

## Authority And Decision Boundary

The plan covers the 711 authoritative `current path + symbol + role` rows in
the [Step 4.5.1 inventory](./helper-ownership-inventory.md) and preserves every
[Step 4.5.2 disposition](./helper-ownership-classification.md). It belongs to the
production source identity:

`4aeeb00102d4713f3f31f219cdf9d71092a64d241279fd7e60411f0e84e090af`

The appendices own the exact final path, final owner and symbol, allowed
action, affected consumers, declaration and JSDoc impact, dependency
direction, focused behavior coverage, and execution batch for every row:

- [Foundation targets](./helper-ownership-target-plan-foundation.md)
- [Physical targets](./helper-ownership-target-plan-physical.md)
- [Runtime targets](./helper-ownership-target-plan-runtime.md)
- [Profile and test-support targets](./helper-ownership-target-plan-support.md)

This plan applies the following fixed rules:

- Class-specific private support stays on its class or returns as a private
  instance method. Exact duplicate wrappers reuse existing public instance
  methods, and exported class-level spectral contracts become the recorded
  public statics. No row targets a private static support method.
- A class-independent operation joins the nearest existing namespace when
  that namespace already owns its semantics. A new PascalCase namespace is
  selected only for a cohesive method set with broad applicability beyond one
  class.
- An ordinary module survives only for one inseparable algorithm, component,
  profile-data owner, or test-only transaction that a namespace would
  misstate.
- Construction-callable survival and profile completeness were reserved for
  Step 4.5.5 during target design. Their semantic owner and inseparable
  migration cohort were fixed here, so the completed decision left no wrapper
  seam or split class transaction.
- A multi-export module splits function-by-function. No compatibility alias,
  duplicate export, speculative barrel, unrelated grouping, or new
  single-function namespace is permitted.
- Callable descriptions remain action-oriented. Namespace, class, interface,
  type, property, constant, and value descriptions state what the entity is
  or represents.

## Exact Row And Action Closure

| Partition | Rows | Keep | Return | Independent | Target appendix |
| --- | ---: | ---: | ---: | ---: | --- |
| Foundation | 193 | 44 | 17 | 132 | [Foundation](./helper-ownership-target-plan-foundation.md) |
| Physical | 323 | 159 | 120 | 44 | [Physical](./helper-ownership-target-plan-physical.md) |
| Runtime | 181 | 83 | 74 | 24 | [Runtime](./helper-ownership-target-plan-runtime.md) |
| Profile and test support | 14 | 0 | 0 | 14 | [Support](./helper-ownership-target-plan-support.md) |
| **Total** | **711** | **286** | **211** | **214** | |

The action totals close independently of the disposition totals because a
retained class-independent namespace method is still a `retain` action and a
construction-shaped row keeps its semantic disposition while deferring its
callable form.

| Planned action family | Rows | Exact treatment |
| --- | ---: | --- |
| Retain current class or namespace operation | 354 | No owner move; retain as verification input. |
| Return support to a class | 144 | Move to the exact class method named by its appendix row: private instance support, existing public-instance reuse, or recorded public class-level contract. |
| Move or coalesce into an existing namespace | 18 | Sixteen moves plus two duplicate runtime clock identities. |
| Move into a selected new namespace | 76 | Twenty cohesive namespace owners; construction-gated owners remain atomic. |
| Retain an ordinary algorithm or component entity | 7 | Six ordinary algorithm rows and one React component row. |
| Defer callable form to Step 4.5.5 | 107 | Ninety-five production construction candidates, two additional profile operations, and ten test-only construction rows. |
| Retain profile values pending completeness | 3 | Exact Native-15 owner remains fixed. |
| Retain existing test namespace method | 1 | `ShaderBuilderTestSupport.pixelSize` stays test-only. |
| Remove unused operation | 1 | Remove only `sourcePathLimitDistanceToMeters`. |
| **Total** | **711** | |

## Namespace Owners

Twenty PascalCase namespace modules are selected. Ten were established by
Step 4.5.4; ten were gated on a construction, class-boundary, or inseparable
cross-partition dependency until Step 4.5.5. Each gated owner was created only
with its complete recorded method set; no partial or one-method holding
namespace was introduced.

| Exact namespace owner | Cohesive responsibility | Earliest transaction |
| --- | --- | --- |
| `utils/validation/ValueValidation.js` / `ValueValidation` | General scalar and structural value acceptance/defaulting | `FN1-validation` with `PH-01` additions |
| `utils/time/TimeMath.js` / `TimeMath` | Duration conversion and monotonic millisecond time | Atomic `FN3-time` + `RT-06-time` |
| `utils/identity/CanonicalValueHash.js` / `CanonicalValueHash` | Canonical serialization and synchronous SHA-256 identity | `FN4-identity` |
| `utils/identity/StableValueHash.js` / `StableValueHash` | Stable cycle-aware serialization and FNV-1a identity | `FN4-identity` |
| `geometry/shared/GeometryDirections.js` / `GeometryDirections` | Geometry-neutral direction and Three-vector conversion | `PH-02` |
| `geometry/shared/GeometryVisualRequestValues.js` / `GeometryVisualRequestValues` | Geometry endpoint-shadow and visual request values | `PH-02` |
| `light-sources/shared/LightSourceRequestValues.js` / `LightSourceRequestValues` | Source request irradiance and direction boundaries | `PH-03` |
| `light-sources/shared/three/SceneLightingMath.js` / `SceneLightingMath` | Source-independent scene-light intensity ranges | `PH-03` |
| `light-sources/shared/three/ThreeLighting.js` / `ThreeLighting` | Shared Three layer, scene, and shadow operations | `PH-03` |
| `adapters/react/Algorithm32R3FValues.js` / `Algorithm32R3FValues` | R3F viewport-packet and render-priority values | `RT-01-r3f-values` after `FC6` |
| `gpu-assembler/base/ShaderSource.js` / `ShaderSource` | Deterministic GLSL scalar, array, and vector formatting | `RT-03-shader-source` |
| `utils/math/PixelMath.js` / `PixelMath` | Pixel size/distance acceptance, construction, defaults, viewport-count normalization, and shader values | `FC6-pixel-values` |
| `quantities/units/UnitMath.js` / `UnitMath` | Unit family, value, conversion, copying, and normalization operations | `FC1-unit-values` |
| `quantities/spectral/SpectralMath.js` / `SpectralMath` | Spectral-packet arithmetic, mapping, interpretation, and provenance | `FN5-spectral-math` after `FC2`/`FC3` |
| `transport/ScatteringOrderFieldOperations.js` / `ScatteringOrderFieldOperations` | Scattering-order field lifecycle, rollback, build, and accumulation | `FC4-field-operations` |
| `adapters/react/Algorithm32Bindings.js` / `Algorithm32Bindings` | Adapter runtime binding-value creation and mutation | `RTF-01-react-bindings` |
| `adapters/react/Algorithm32ThreeResources.js` / `Algorithm32ThreeResources` | Request-backed Three resource resolution and construction | `RTF-02-react-three-resources` |
| `gpu-assembler/base/ShaderContributions.js` / `ShaderContributions` | Provider-neutral direct shader declarations | `RTF-03-shader-contributions` |
| `gpu-assembler/cache-pass/CacheBuildModules.js` / `CacheBuildModules` | Cache-build declaration construction, binding naming, and identity | `RTF-04-cache-build-modules` |
| `gpu-runtime/cache/CacheValues.js` / `CacheValues` | Runtime cache data and plan-identity values | `RTF-05-cache-values` |

Existing `ScalarMath`, `VectorMath`, `ArrayMath`, `DistanceMath`, and
`SceneMath` receive only their demonstrated equivalent operations. Existing
namespace methods otherwise remain in place. The existing test-only
`ShaderBuilderTestSupport` namespace remains separate from production.

## Class Returns And Ordinary Owners

Every class return has an exact target in its appendix. Same-file support
becomes a private instance method; external support moves with its complete
consumer and declaration transaction. Public static construction facades are
not silently recast as private support: their callable form was reserved for
Step 4.5.5 while their semantic class owner remained fixed.

The physical partition's only size-sensitive return is the distant CPU cache
cohort. Moving all 43 rows directly onto `DistantSunCacheProvider` would
produce about 1,954 raw lines. `PH-F8` instead fixes three persistent,
configured class owners:

| Final class | Projected lines | Responsibility |
| --- | ---: | --- |
| `DistantSunCacheProvider` | 875-925 | Provider orchestration, field allocation, recurrence, and final cache result |
| `DistantSunCpuPrimaryEvaluator` | 500-575 | Primary spectral, J1/L1, phase, and transmittance evaluation |
| `DistantSunCpuMultipleScatteringEvaluator` | 570-650 | Stored-field transport, later orders, directions/positions, and ground reflection |

The evaluators are provider-owned stateful collaborators, not factories or
namespace substitutes. Other physical receiving classes project below 930
lines. All eight runtime receiving classes project below 1,000 lines; the
largest is `ThreeCacheBackend` at a conservative 855 lines. Every receiving
batch has an exact post-format line-count gate.

The settled production ordinary exceptions are:

- `transport/later-order-scattering-density.js`, one closure-producing
  recurrence transaction retained because its configured-kernel construction
  is inseparable from the algorithm;
- `transport/scattering-density-transport.js`, one ordered path-integration
  algorithm after shared math and rollback extraction;
- `light-sources/local-sun/local-sun-geometry-pairing.js`, one explicit
  local-Sun geometry invariant; and
- `adapters/react/Algorithm32R3FAtmosphereComposer.jsx`, a React component
  entity rather than a utility owner.

Native-15 profile data and the two test-only support owners remain ordinary
within their profile/test domains. They are not production utility
exceptions.

## Collision And Multi-Export Closure

Seven row-to-row final-target collisions are intentional consolidations:

| Final method | Source-row resolution |
| --- | --- |
| `ArrayMath.multiplyToFloat64` | Merge the calculator and scattering-transport implementations. |
| `DistanceMath.positionAlongRay` | Merge the calculator and scattering-transport ray translations. |
| `ScatteringOrderFieldOperations.zeroMutableField` | Merge the two identical rollback helpers. |
| `ScalarMath.clamp` | Reuse the existing method for the geometry wrapper under ordered bounds. |
| `SceneMath.positionInSceneUnits` | Reuse the existing method for `scenePositionInUnits`. |
| `ValueValidation.booleanOrDefault` | Merge the geometry and Three-lighting implementations. |
| `TimeMath.nowMilliseconds` | Merge the executor and performance-timer clocks. |

The foundation appendix also resolves the W27 wrappers onto existing
`CubedSphereDirectionDomain` methods and keeps the basis-specific tolerance
separate from generic scalar comparison. Similar names with different units,
accepted shapes, diagnostics, or physical meaning do not merge.

All 24 multi-export production modules have function-level targets:

| Appendix | Modules | Resolution owner |
| --- | ---: | --- |
| Foundation | 11 | [Multi-export and mixed-module resolution](./helper-ownership-target-plan-foundation.md#multi-export-and-mixed-module-resolution) |
| Physical | 9 | [Collision/split decisions and atomic physical batches](./helper-ownership-target-plan-physical.md#collision-and-split-resolution) |
| Runtime | 4 | [Collision, split, and ordinary-module resolution](./helper-ownership-target-plan-runtime.md#collision-split-and-ordinary-module-resolution) |
| **Total** | **24** | Every export has its own authoritative row. |

No mixed module survives merely to preserve co-location. Retirement occurs
only after every cohort in that module reaches its final owner, so no
half-wrapper seam or compatibility re-export is introduced.

## Step 4.5.4 Dependency-Safe Execution

The appendices own exact row membership and focused gates. Step 4.5.4 executes
only immediate rows; it does not pre-empt a Step 4.5.5 callable decision.
Independent transactions may run sequentially in either order when none of
these required edges applies:

1. Establish `FN1-validation` before physical `PH-01`, unit `FC1`, or pixel
   `FC6` consumers.
2. Establish `FN2-shared-math` before its physical/class and field consumers.
3. Execute `FN3-time` and `RT-06-time` as one transaction; there is never a
   partial one-method `TimeMath`.
4. Establish both identity namespaces in `FN4-identity` before spectral,
   cache-value, reuse-key, or assembler identity cohorts.
5. Run physical `PH-01` before `PH-02` and `PH-03`; run `PH-03` before the
   shared `FC6-pixel-values` retirement of the two old ordinary modules.
6. Run `PH-04` before its inseparable atmosphere/synchronizer construction
   cohort `PH-F3`.
7. Runtime immediate batches execute as `RT-02`, `RT-03`, `RT-04`, `RT-05`,
   the combined time transaction, then `RT-07`. `RT-01` follows `FC6` so its
   two-method R3F namespace never strands the viewport normalizer or becomes
   a temporary one-method owner; later `RTF*` batches own every
   construction-gated remainder and old-module retirement.

Step 4.5.5 then decides and executes the atomic `FC1`-`FC8`, `FN5`,
`PH-F1`-`PH-F9`, post-`FC6` `RT-01`, `RTF-01`-`RTF-09`, and
`TSF-01`-`TSF-03` cohorts under the prerequisites recorded in the appendices.
The five Native-15
construction-shaped operations are part of the 95 production candidates; its
two acceptance operations and three profile values are separately tracked so
the ledgers do not double count them. The ten test-only construction rows are
not production factory candidates and never enter a production import or
batch.

## Step 4.5.4 Execution Result

All 89 immediate target rows are implemented: 20 foundation rows, 51 physical
rows, and 18 runtime rows. The ten immediately eligible namespace owners are
now complete, 31 class-specific rows have returned to their recorded classes,
and the one removal row deleted `sourcePathLimitDistanceToMeters`. The six
fully superseded ordinary modules are gone. The shared light-source request
module retains exactly its two `FC6-pixel-values` exports, and neither
`PixelMath` nor `Algorithm32R3FValues` exists early.

The completed transactions are `FN1`-`FN4`, `PH-01`-`PH-04`, `RT-02` through
`RT-07`, with `FN3-time` and `RT-06-time` executed atomically. All `FC*`,
`FN5`, `PH-F*`, post-`FC6` `RT-01`, `RTF*`, and `TSF*` cohorts remain under
Step 4.5.5. No construction callable or profile decision was pre-empted.

Focused gates and both type checks pass. The 295-file formatter scope, 438-
spec Node regression, 5-spec Three/WebGL lane, 3-spec Flat32 UI lane, and
1-spec policy lane pass. Exact namespace/export, retired-path/symbol,
deferred-seam, import-resolution, 152-module cycle, 52-class size, whitespace,
newline, and diff checks also pass.

## Step 4.5.5 Execution Result

All 264 gated rows are complete: 57 foundation, 115 physical, 78 runtime,
and 14 profile/test-support rows. Every one of the 157 non-deferred rows
occupies its exact planned owner and symbol. Of the 95 production construction
candidates, 80 survive with a demonstrated lifecycle, resource-allocation,
reusable orchestration, cohesive-namespace, inseparable-algorithm, or typed
profile-construction contract; 15 identity wrappers or one-shot construction
callables were removed. The two additional profile acceptance operations stay
private to the Native-15 profile owner. All ten test construction rows remain
test-only, and production imports neither test-support owner.

The 80 retained production construction operations comprise 61 class-owned
operations, 16 broadly reusable methods in cohesive namespaces, and three
ordinary operations: the inseparable later-order physical algorithm pair and
the typed Native-15 profile builder. No compatibility alias, duplicate factory
path, unsupported ordinary factory module, descriptor, or manifest was
introduced. Thirty-seven superseded paths are gone: 33 JavaScript files and
four declarations, with zero current source references.

The Native-15 profile has one typed default: 15 view-path intervals, 20
source-path transmittance intervals, 15 cache-transport intervals, cumulative
scattering through order 4, and no reflective ground. Its override type lists
every configurable selection and documents the fixed Native-15 facts,
runtime-owned exclusions, and all direct-40 paper-comparison differences. The
spectral-basis and source-packet hashes remain
`sha256:a03a3c7f45d9bd4ff8adf6482e9d1aac1acd72423758ecf797ac24f6dffba891`
and
`sha256:b501bad3f86702dbef751b7def0cd9bf189f56816bd54750063a1933591d751e`.
The complete default profile identity is
`sha256:a0174e3f8cfb02103d6c18af94a4fd11dbec0a1c84d6ad981b2a5b9fb37852d3`.

The settled tree contains 287 files, including 279 JavaScript, JSX, and
ambient-declaration files and 131 production JavaScript/JSX modules. All
focused gates, both type checks, the complete formatter scope, the 456-spec
Node regression, 5-spec Three/WebGL lane, 3-spec Flat32 UI lane, and 1-spec
policy lane pass. Exact row, owner, export, retired-path, test-containment,
import, cycle, class-size, whitespace, final-newline, and diff gates pass. The
largest class is `ThreeCacheBackend` at 915 lines. The independent Step 4.5.6
closure audit reproduces the exact tree and owner dispositions, resolves all
599 relative clauses with zero cycles, and passes the focused 166-spec helper
gate plus every required broad and hygiene gate. Step 4.5 is complete, and
[Step 5](./reconciliation-plan.md#5-reconcile-ambient-types) subsequently closed
the ambient declaration surface. Steps 6.1-6.3 are complete, and Step 7.1 is current.

## Verification Contract

Every implementation batch must run its appendix's focused behavior and
identity gates, both type checks when affected, the complete Algorithm32
formatter check, exact retired path/export and duplicate-symbol scans,
declaration placement and JSDoc checks, relative-import and cycle checks,
post-format class-size checks, whitespace/newline checks, and
`git diff --check`. Construction batches additionally pin allocation
freshness, object identity, error timing, cleanup/rollback order, declaration
ordering, and shader/cache content hashes where those contracts apply.

Step 4.5.3 itself closes when:

- all 711 classification identities have one target row and one batch;
- the partition and global row keys are unique and exact;
- all 95 production construction candidates defer callable form without
  losing their semantic owner or inseparable support;
- all 24 multi-export modules and all target collisions are explicit;
- the sole unused operation is removed rather than given a speculative owner;
- no selected namespace is an unrelated grouping or planned one-method
  holding module;
- every receiving class has a compliant size projection and implementation
  gate; and
- the production source identity remains unchanged.

Those design conditions and the independent Step 4.5.6 closure pass. Steps
4.5.4-4.5.6, Step 5, and Steps 6.1-6.3 are complete. Step 7.1 is the current
reconciliation substep.
