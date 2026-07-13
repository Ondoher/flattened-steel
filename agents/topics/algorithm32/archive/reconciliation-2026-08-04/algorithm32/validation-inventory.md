# Algorithm32 Validation Candidate Inventory

Status: Step 2.2 inventory, Step 2.5 method-level disposition, and Steps 2.6
through 2.8 implementation are complete on 2026-08-01. This document is the detailed disposition record for the 72
executable modules identified by the baseline validation scan. The
[method-level analysis](./validation-reconciliation-analysis.md) owns the
remaining candidate decisions and follow-up batches; the
[reconciliation ledger](../extraterrestrial/reconciliation.md) owns the
ingress map, work status, and verification record.

Surviving modules use their current filenames below. The original baseline
paths remain preserved in the
[reconciliation inventory](./reconciliation-inventory.md).

The current lexical scan finds 74 matching files because
`caches/index.js` re-exports an assertion and `three/types.d.ts` contains
`typeof import(...)`; neither performs runtime validation. They are excluded
from the 72-module executable inventory.

## Disposition Terms

- **Keep semantic** — the module owns a public physical-data, supported-value,
  numerical-domain, or resource-bound ingress check.
- **Keep environment/lifecycle** — the module owns a real capability,
  cancellation, resource-ownership, resize, or disposal check.
- **Mixed** — retain the listed semantic or lifecycle checks, while Step 2.3
  or 2.4 removes or relocates its listed structural checks.
- **Rehome/remove** — its checks are trusted-downstream JavaScript
  shape/member validation or descriptor validation, not an ingress owner.
- **No local check** — a lexical match in a public re-export or generic
  implementation is not local runtime validation.

| Module | Disposition | Owner and required follow-up |
| --- | --- | --- |
| `Algorithm32.js` | Keep semantic/lifecycle | Keep facade-supported order, interval, path-distribution, unsupported-feature, and disposal checks. Step 2.8 review confirmed no config wrapper or collaborator-member revalidation remains. |
| `Algorithm32ShaderHandle.js` | Keep environment/lifecycle | Own handle refresh, supersession, resource replacement, and disposal state; do not add structural revalidation of accepted setup. |
| `atmospheres/CanonicalAtmosphere.js` | Mixed | Keep atmosphere constant and spectral-basis physical checks at constructor ingress. Rehome repeated collaborator/packet shape checks in 2.4. |
| `caches/CpuDirectionalSpectralField.js` | Mixed | Keep field extent, channel-count, and storage-bound semantics at its factory boundary; classify descriptor/member checks as trusted-downstream. |
| `caches/cpuDirectionalSpectralFields.js` | Rehome/remove | Retired by Step 2.6: its exported field assertion was structural consumer checking only. Field construction remains the semantic owner. |
| `caches/DenseScalarArrayLayout.js` | Rehome/remove | `assertDenseScalarArrayLayout()` is test-only and its descriptor-shape path is the explicit 2.3 removal target. |
| `caches/gpu/CacheGpuExecutor.js` | Mixed | Keep backend availability, cancellation, resource ownership, and disposal checks. Classify assembler/backend object-shape checks in 2.4. |
| `caches/gpu/CachePassAssembler.js` | Mixed | Keep plan-order, output-layout, and resource-bound semantics at assembly ingress. Classify trusted module/field member checks in 2.4. |
| `color/BrunetonColorDisplayModel.js` | Mixed | Keep finite display constants and color-conversion semantics at configuration ingress. Classify display-constant record shape checks in 2.4. |
| `descriptors/descriptorSupport.js` | Mixed | Keep primitive identifier and positive-count normalization at public factories. Remove or relocate `assertImmutableDescriptorRecord()`; descriptors cannot validate executable facts. |
| `domains/CubedSphereDirectionDomain.js` | Keep semantic | Own direction normalization, finite vector, and stencil/index-domain constraints at domain construction. |
| `domains/CubedSphereW27DirectionDomain.js` | Keep semantic | Own W27 node-index and direction-stencil bounds at the public domain utility boundary. |
| `domains/Native48PositionDomain.js` | Keep semantic | Own supported position-domain option and altitude-node semantics. |
| `geometries/FlatEarthGeometry.js` | Mixed | Keep unit-bearing position/distance, positive extent, optional limit, and cache-node semantic checks at constructor ingress. Rehome downstream coordinate shape checks in 2.4. |
| `geometries/geometry-coordinates.js` | Mixed | Keep coordinate unit conversion, finite position, and direction-normalization semantics only when called from a public geometry ingress; remove duplicate downstream record checks in 2.4. |
| `geometries/geometry-request-normalization.js` | Mixed | Keep supported endpoint/material choices, finite distances, and positive counts while normalizing an external geometry request; classify plain-object/member checks in 2.4. |
| `geometries/scattering-cache-direction-frames.js` | Rehome/remove | Cache-frame calculations consume accepted unit directions; local vector/member checks are downstream validation. |
| `geometries/SphericalEarthGeometry.js` | Mixed | Keep ordered positive radii, physical boundary altitude, normalized directions, and positive count semantics at constructor ingress. Rehome downstream coordinate shape checks in 2.4. |
| `ground-boundaries/UniformLambertianGroundBoundary.js` | Keep semantic | Own boundary id, spectral packet units/quantity, and reflectance-in-[0,1] checks. |
| `implementation/Reference.js` | Rehome/remove | Reference evaluation receives accepted facade models and packets; its object/member validation is an explicit 2.4 target. |
| `implementation/SceneInputCapture.js` | Keep environment/lifecycle | Keep Three constructor availability, scene-depth positivity, scene-scale/viewport semantics, render-target ownership, and capture lifecycle. Step 2.8 removed scene/camera/renderer shape checks. |
| `implementation/ShaderBuilder.js` | Mixed | Keep viewport, binding requirement, cancellation, cache-resource, and build/disposal semantics at attachment ingress. Classify setup collaborator shape checks in 2.4. |
| `implementation/ShaderPassPerformanceTimer.js` | Keep environment/lifecycle | Own optional timer-query capability, query availability, pending-query budget, callback failure isolation, and disposal. |
| `implementation/ShaderRuntimePass.js` | Keep environment/lifecycle | Own installed-pass resources, resize, binding lifecycle, and disposal; accepted assembly objects are trusted. |
| `implementation/SpectralCalculator.js` | Rehome/remove | Calculator inputs have crossed facade/model/geometry ingress; repeated packet and collaborator shape checks are an explicit 2.4 target. |
| `light-sources/DistantSunCacheController.js` | Keep environment/lifecycle | Own cache-controller creation, replacement, cancellation, backend ownership, and disposal state. |
| `light-sources/distant-sun-cache-plan.js` | Mixed | Keep selected domain/order, layout extent, and cache-plan resource semantics; classify trusted request/descriptor member checks in 2.4. |
| `light-sources/DistantSunFieldPacking.js` | Rehome/remove | Packing receives selected domains and accepted fields; its structural checks belong at plan/field construction ingress. |
| `light-sources/distant-sun-later-order-scattering-density.js` | Rehome/remove | Later-order kernel consumes accepted source/geometry/cache contracts; local object/member checks are downstream. |
| `light-sources/DistantSunLightSource.js` | Keep semantic | Own source direction, irradiance packet, finite nonnegative angular radius, and source configuration semantics. |
| `light-sources/distant-sun-primary-radiance.js` | Rehome/remove | Primary-radiance calculation consumes accepted fields and source configuration; structural validation is downstream. |
| `light-sources/distant-sun-primary-scattering-density.js` | Rehome/remove | Primary-scattering calculation consumes accepted fields and source configuration; structural validation is downstream. |
| `light-sources/FlatSynchronizer.js` | Keep environment/lifecycle | Own live Three scene synchronization, replacement, visibility, and owned-object cleanup. |
| `light-sources/light-source-request-values.js` | Keep semantic | Keep source-request physical units, finite positions, supported strings, and pixel/distance semantics at source ingress. Step 2.8 removed plain range-record and vector-array shape checks. |
| `light-sources/LocalSunCacheController.js` | Keep environment/lifecycle | Own cache-controller creation, replacement, cancellation, backend ownership, and disposal state. |
| `light-sources/local-sun-cache-plan.js` | Mixed | Keep selected domain/order, layout extent, and cache-plan resource semantics; classify trusted request/descriptor member checks in 2.4. |
| `light-sources/LocalSunFieldPacking.js` | Rehome/remove | Packing receives selected domains and accepted fields; its structural checks belong at plan/field construction ingress. |
| `light-sources/local-sun-geometry-pairing.js` | Keep semantic | Own the source/geometry physical compatibility rule at cache construction ingress. |
| `light-sources/LocalSunLightSource.js` | Keep semantic/lifecycle | Keep source key, finite position/irradiance, positive reference distance, nonnegative radius/scale, falloff, and interval-count semantics. Step 2.8 removed configuration, primitive/member, and extra-property shape guards. |
| `light-sources/three-lighting-support.js` | Keep environment/lifecycle | Own available Three layer/object operations and scene-object ownership; do not use property enumeration as general contract validation. |
| `light-sources/ThreeShadowObjectConfigurator.js` | Keep environment/lifecycle | Own applicable Three shadow-object capabilities and controlled external object mutation. |
| `models/SpectralModel.js` | Keep semantic | The facade owns dependency-record shape; Step 2.8 review confirmed the model already trusts it. Model-level basis compatibility and wavelength bounds remain physical/indexing semantics. |
| `profiles/native-15-profile.js` | Keep semantic | Own supported profile options, scattering depth, and documented native-profile controls at caller ingress. |
| `quantities/index.js` | No local check | This is a public re-export surface; its lexical matches name validators implemented by their owning modules. |
| `quantities/spectral-bases.js` | Keep semantic | Own spectral-basis compatibility and accepted basis semantics at public quantity ingress. |
| `quantities/SpectralBasis.js` | Keep semantic | Own basis schema, supported bin semantics, required id, finite ordered channel widths, and basis identity. |
| `quantities/spectral-basis-contract.js` | Keep semantic | Own channel normalization, finite wavelength/bin-width checks, and non-overlapping ordered-bin semantics. |
| `quantities/SpectralMath.js` | Mixed | Keep public arithmetic-domain checks where an operation can be called externally; rehome packet-shape checks when inputs are already accepted. |
| `quantities/SpectralPacket.js` | Keep semantic | Own supported quantity/unit, basis/semantics compatibility, finite value count, and provenance identity at packet construction ingress. |
| `quantities/spectral-packet-contract.js` | Keep semantic | Own quantity/unit normalization, compatible channel count, and finite spectral-value semantics. |
| `quantities/spectral-packets.js` | Mixed | Keep public packet construction and compatibility semantics; classify repeated packet record checks at internal consumers in 2.4. |
| `quantities/UnitValue.js` | Keep semantic | Own unit-family membership, finite value, supported conversion, and unit-bearing value normalization. |
| `react/Algorithm32AtmosphereComposer.js` | Keep environment/lifecycle | Own React attachment availability, setup replacement, resize, and cleanup lifecycle. |
| `react/Algorithm32ReactUtils.js` | Mixed | Keep caller-provided Three constructors, render priority, pixel size, render-target resource limits, and scene-depth lifecycle. Classify props packet shape checks in 2.4. |
| `shader/Algorithm32ShaderAssembler.js` | Mixed | Keep shader contribution compatibility, symbol resolution, duplicate/conflict, and assembly-order semantics; trusted contribution record shape is a 2.4 candidate. |
| `shader/shaderCollectionValidation.js` | Mixed | Retired by Step 2.7. Its optional-array and contribution-record normalization only re-proved trusted internal ambient contracts; shader compatibility remains owned by `ShaderCompatibilityValidator`. |
| `shader/ShaderCompatibilityValidator.js` | Keep semantic | Own required/provided shader symbols, binding compatibility, and duplicate/conflict rules at assembly ingress. |
| `shader/shader-contribution.js` | Keep semantic | Own shader contribution id, symbol, hook order, shader-source, and binding requirement semantics at contribution construction ingress. |
| `shader/ShaderDescriptorBuilder.js` | Mixed | Keep descriptor identity and compatibility-tag semantics; accepted facade/model snapshot shape is trusted and its checks are 2.4 candidates. |
| `shader/stable-hash.js` | No local check | `typeof` dispatch supports deterministic serialization; it does not reject an external contract or validate executable behavior. |
| `three/ExactFlatGroundObject.js` | Keep environment/lifecycle | Own Three geometry/material availability, ground-object allocation, scene attachment, and disposal. |
| `three/ExactSphereGroundObject.js` | Keep environment/lifecycle | Own Three geometry/material availability, ground-object allocation, scene attachment, and disposal. |
| `three/ThreeCacheBackend.js` | Keep environment/lifecycle | Own WebGL2, extension, precision, framebuffer, texture-limit, field-resource, and disposal checks. |
| `transport/scattering-order-field-operations.js` | Mixed | Keep scattering-order and field-resource semantics at operation entry; trusted field record/member checks are 2.4 candidates. |
| `utils/AngleMath.js` | Keep semantic | Own supported angle units, finite values, and conversion semantics at public utility ingress. |
| `utils/DistanceMath.js` | Keep semantic | Own supported distance units, finite values, position dimensions, and conversion semantics at public utility ingress. |
| `utils/numeric-values.js` | Keep semantic | Own finite fallback/default normalization at the public numeric utility boundary. |
| `utils/PixelMath.js` | Keep semantic | Own pixel units, positive finite dimensions/distances, and shader conversion semantics. |
| `utils/ScalarMath.js` | Mixed | Keep exported arithmetic-domain checks where callers can supply scalars; rehome downstream packet/object checks. |
| `utils/SceneMath.js` | Keep semantic | Own finite scene scale, supported scene units, and scene/physical conversion semantics. |
| `utils/VectorMath.js` | Mixed | Keep numerical vector invariants such as nonzero normalizable length at its public utility boundary; do not use structural array checks downstream. |
| `utils/WavelengthMath.js` | Keep semantic | Own wavelength unit, finite-value, and conversion semantics at public utility ingress. |

The table records the initial module-level classification, not final removal
authority. Its completed Step 2.3/2.4 actions and every remaining method-level
decision are owned by the
[method-level validation analysis](./validation-reconciliation-analysis.md).

## Confirmed Implementation Targets

- **Step 2.3:** remove `assertDenseScalarArrayLayout()` and the
  `assertImmutableDescriptorRecord()` descriptor-validation path after
  preserving factory-owned semantic checks. The source-shape scaffold suite
  was already retired in Step 1.3.
- **Step 2.4:** complete. It removed confirmed repeated structural checks in
  `Reference.js`, `SpectralCalculator.js`, `CanonicalAtmosphere.js`, and the
  named geometry paths while preserving their explicit semantic checks.
- **Step 2.5:** complete. It assigns a method-level disposition to every
  initially remaining **Mixed** or **Rehome/remove** candidate. The only
  confirmed follow-up work is batches 2.6 through 2.8 in the
  [method-level analysis](./validation-reconciliation-analysis.md#follow-up-batches).

No missing semantic ingress check is confirmed. Do not add a new runtime
object-shape check unless a later trace shows an untyped external input can
reach a semantic owner without validation.
