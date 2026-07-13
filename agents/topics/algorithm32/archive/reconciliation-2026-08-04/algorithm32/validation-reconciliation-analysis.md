# Algorithm32 Validation Reconciliation Analysis

Status: Steps 2.4 through 2.8 are complete on 2026-08-01. This document converts the
module-level dispositions in the [validation candidate inventory](./validation-inventory.md)
into a method-level reconciliation scope. The
[reconciliation ledger](../extraterrestrial/reconciliation.md) remains the
owner of the ingress map and completion evidence.

## Boundary Decision

Algorithm32's supported application boundary is the `Algorithm32` facade,
its configuration constructors, and its renderer/Three adapters. A method
being exported from an implementation file does not by itself make every
value supplied to that method external. The traced production calls below
show whether the value was created by an earlier accepted Algorithm32 owner.

Keep a check when it enforces a physical or numerical invariant, a supported
value, resource/lifecycle state, or an actual external configuration or
renderer input. Remove a check when it only re-proves JavaScript object
shape, member presence, array shape, or a descriptor record after a typed
Algorithm32 producer created the value.

## Traced Removal Batches

| Batch | Paths and methods | Provenance of the value | Reconciliation action |
| --- | --- | --- | --- |
| 2.4.1 | `implementation/Reference.js`: constructor dependency and optional-calculator shape checks; `evaluate()` request-wrapper check | `Algorithm32._prepareConfig()` constructs every production `Reference`; `Algorithm32.evaluate()` is its only production caller. | Complete. Removed the redundant shape/member checks. `_resolvePathIntervalCount()` remains because an evaluation request can override that numerical value, and `_resolveScatteringCache()` remains because cache availability is execution state. |
| 2.4.1 | `implementation/SpectralCalculator.js`: constructor wrapper check, `_assertRaySegment()`, `_assertPathIntegrationPoints()`, `_assertCollaborators()`, and their call sites | Production callers create the calculator in `Reference`, distant-Sun cache construction, and local-Sun cache construction. Ray segments come from geometry; integration points come from this calculator; collaborators come from the accepted shared model or source build. | Complete. Removed these downstream object/member and produced-data checks. The positive `pathIntervalCount` check remains until its caller-owned semantic rule is explicitly centralized; packet/unit compatibility checks remain because they establish physical quantity semantics. |
| 2.4.2 | `atmospheres/CanonicalAtmosphere.js`: outer `configuration` and `constants` object guards; `sampleMedium()` coordinate-distance assertion; `integrateOpticalDepth()` path-array and sample-measure assertions; `samplePhase()` direction assertions | Constructor values are a configuration ingress. Later coordinates, paths, measures, and directions come from geometry, the calculator, or source/cache transport; production call sites do not deserialize or otherwise accept them externally. | Complete. Removed wrapper/shape and repeated downstream checks. Constructor physical checks for finite constants, positive scale heights, accepted spectral basis, and positive wavelengths remain. |
| 2.4.3 | `geometries/FlatEarthGeometry.js`: `_assertFlatGeometryDescriptor()`, its call, the redundant descriptor-frame object check, and re-normalization of descriptor-owned fallback direction | `ShaderBuilder._collectContributions()` supplies a descriptor built from the accepted shared model. The spherical contribution already trusts that same descriptor path. | Complete. Removed the descriptor validation path and consume the typed descriptor facts directly. Geometry configuration validation and shader construction behavior remain. |
| 2.4.3 | `FlatEarthGeometry` and `SphericalEarthGeometry`: wrapper/member checks in `resolveAtmospherePath()`, `resolveSourceRelativePosition()`, and `resolveCacheBuildRay()` | `resolveAtmospherePath()` is called only by calculator/source transport. `resolveSourceRelativePosition()` is called only by calculator/local-source transport. `resolveCacheBuildRay()` is called only by cache-build loops. Each caller supplies values produced by a geometry, light-source, or selected domain owner. | Complete. Removed the repeated request/member and unit-shape checks. Physical boundary calculations, interval/sample-count semantics, and zero-vector numerical-degeneracy handling remain. |

## Checks Explicitly Retained

| Area | Reason to retain |
| --- | --- |
| `Reference._resolvePathIntervalCount()` | A caller can supply an evaluation-level interval count; positivity is a numerical ingress fact. |
| Spectral packet and unit acceptance in `SpectralCalculator` | Quantity, unit, spectral-basis compatibility, and finite packet-value semantics are physical contracts, not merely object shape. |
| `CanonicalAtmosphere` finite/positive constants and wavelength checks | These are physical configuration semantics at its constructor and coefficient boundary. |
| `geometry-coordinates.js` and `geometry-request-normalization.js` normalizers | They receive facade evaluation data, geometry configuration, or renderer/Three adapter data. Their finite positions, normalized directions, supported options, distance units, and resource values are genuine ingress semantics. |
| `scattering-cache-direction-frames.js` normalization guards | A zero or non-finite *derived* vector is a numerical degeneracy, not an input-shape assertion; it prevents invalid frame construction. |
| Geometry constructors, construction-domain alignment, cache counts, and path sample counts | These enforce physical geometry, selected-domain, and resource/numerical constraints at their owning construction boundaries. |

## Required Test Reconciliation

The affected behavior suites are
`implementation/_tests/SpectralCalculator.spec.js`,
`atmospheres/_tests/CanonicalAtmosphere.spec.js`,
`geometries/_tests/flat-earth-geometry.spec.js`, and
`geometries/_tests/spherical-earth-geometry.spec.js`.

Remove only expectations for rejected internal object shapes or descriptor
record mutation. Retain tests for accepted configurations, calculated
radiance/transmittance, physical boundary outcomes, finite and ordered
geometry, and cache construction. A test must not move the removed source
shape assertions into a different implementation seam.

## Execution Order

Perform batches 2.4.1, 2.4.2, and 2.4.3 independently. After each batch,
run `npm run typecheck:algorithm32`, the affected specifications, and a
focused scan showing the retired method/check is gone. Complete the full
Algorithm32 Node regression only after all three batches are integrated.

Batch 2.4.1 verification passed: `npm run typecheck:algorithm32` and the
complete `npm run test:algorithm32` regression passed with 460 specs and zero
failures in 102.07 seconds. The available Jasmine name filter selected zero
specifications, so the completed full regression is the retained behavior
evidence for this batch.

Batch 2.4.2 verification passed: `npm run typecheck:algorithm32` and the
complete `npm run test:algorithm32` regression passed with 460 specs and zero
failures in 110.229 seconds.

Batch 2.4.3 verification passed: `npm run typecheck:algorithm32` and the
complete `npm run test:algorithm32` regression passed with 460 specs and zero
failures in 110.62 seconds.

## Step 2.5 Remaining Candidate Dispositions

This trace discharges every remaining module labelled **Mixed** or
**Rehome/remove** in the initial inventory. A row records the methods actually
examined, the value provenance, and the resulting action; a module label is no
longer treated as removal authority.

| Module | Methods and traced owner | Disposition |
| --- | --- | --- |
| `Algorithm32.js` | `_prepareConfig()`, `_createShaderBuildRequest()`, and facade lifecycle methods; application callers supply the facade config and setup. | Complete. Review confirmed no remaining config/request wrapper or collaborator-member revalidation. Supported orders/features, interval and resource values, and disposal/cache lifecycle semantics remain. |
| `caches/CpuDirectionalSpectralField.js` | Constructor, `_validatedOffset()`, writer and reader capabilities; concrete CPU cache builders construct it and writer callers supply scalar values. | Retain. Extent, integer offset, finite scalar, sealed-state, and bounds checks own storage and lifecycle semantics. |
| `caches/cpuDirectionalSpectralFields.js` | `assertCpuDirectionalSpectralField()`; no production caller exists, only the barrel re-export and its unit expectation. | **Batch 2.6.** Retire the unused structural assertion, its barrel export, and its assertion-only test expectation. |
| `caches/gpu/CacheGpuExecutor.js` | Constructor and `execute()`; cache controllers supply plans while the backend is a live external GPU resource. | Retain. Backend availability, cancellation, execution state, pass count, finite samples, resource ownership, and disposal are environment/lifecycle or resource semantics. |
| `caches/gpu/CachePassAssembler.js` | Plan/pass assembly helpers; cache-plan owners supply typed controls and field layouts. | Retain. Pass ordering, output layout, binding extent, and enabled/disabled cache decisions select executable GPU work rather than merely proving object shape. |
| `color/BrunetonColorDisplayModel.js` | Constructor, `_acceptDisplayConstants()`, RGB conversion methods, and composition; callers supply display configuration and RGB/spectral values. | Complete in 2.8. Removed configuration-record and RGB tuple shape guards. Positive finite tone-map constants, finite matrix coefficients, required 3x3 transform dimensions, spectral packet/unit/basis compatibility, and display conversion semantics remain. |
| `descriptors/descriptorSupport.js` | `requiredString()` and positive-count helpers; factories call them while creating identity metadata. | Retain. The descriptor-record assertion was already removed in Step 2.3; remaining identifier/count checks establish descriptor identity, not executable validation through metadata. |
| `implementation/SceneInputCapture.js` | Constructor, camera-world-position handling, `_renderWithOverride()`, and `capture()`; `ShaderBuilder` creates the capture while Three scene, camera, renderer, and namespace are external runtime objects. | Complete in 2.8. Removed configuration/scene/camera/renderer wrappers that only proved type or presence. Actual Three constructor and renderer-method capability checks, finite derived camera position, positive depth/viewport/scene scale, target ownership, and disposal state remain. |
| `implementation/ShaderBuilder.js` | Constructor, `acceptCollaborator()`, `_assertBuildRequest()`, and `build()`; `Algorithm32` is the sole production constructor and creates every build request. | **Batch 2.7.** Remove dependency, model, collaborator, request, and setup wrapper/member checks. Retain viewport/resource values, cache-backend requirement, cancellation, attachment behavior, and disposal lifecycle. |
| `light-sources/distant-sun-cache-plan.js` | Construction-control acceptance and plan creation; selected production domains and caller configuration supply the inputs. | Complete in 2.8. Removed the plain controls-record check. Selected-domain identity, scattering-order agreement, positive transport interval count, and field-layout/resource semantics remain. |
| `light-sources/DistantSunFieldPacking.js` | Constructor and `_assertIndex()`; selected domains create the packing and field readers/writers use its offsets. | Retain. Integer index and dense-offset bounds are executable packing semantics that prevent invalid storage addressing. |
| `light-sources/distant-sun-later-order-scattering-density.js` | `assertAdapterRequest()`, direction/basis agreement helpers, and kernel creation; `DistantSunLightSource` supplies accepted geometry/source/cache facts. | Retain. Unit-vector normalization, source-direction agreement, and cubed-sphere physical-basis alignment protect numerical and physical correctness; this initial module label was over-broad. |
| `light-sources/distant-sun-primary-radiance.js` | `requireUnitVector()` and `assertDirectLightingSemantics()`; accepted source and light models produce the direct-lighting result. | Retain. Direction normalization and spectral basis/quantity compatibility are physical radiance semantics, not generic record validation. |
| `light-sources/distant-sun-primary-scattering-density.js` | Normalized-direction/basis helpers and scattering kernel; selected source, atmosphere, and geometry owners produce the inputs. | Retain. Native-basis compatibility and unit-direction checks preserve the physical scattering calculation. |
| `light-sources/light-source-request-values.js` | Source irradiance, ambient range, scene position/distance, identifier, and direction normalizers; public light-source configuration supplies the values. | Complete in 2.8. Removed plain range-record and vector-array shape checks. Spectral packet units/quantity/basis, finite range endpoints, scene-unit conversion, nonempty identifiers, finite direction components, and nonzero normalization remain. |
| `light-sources/local-sun-cache-plan.js` | Construction-control acceptance and plan creation; selected domains and local-Sun configuration supply the values. | Complete. Review confirmed no plain controls-record check remains. Pairing compatibility, selected-domain identity, order agreement, positive transport count, and layout/resource semantics remain. |
| `light-sources/LocalSunFieldPacking.js` | Constructor and `_assertIndex()`; selected local-Sun domains create the packing. | Retain. Integer index and dense-offset bounds are executable packing semantics. |
| `light-sources/LocalSunLightSource.js` | Constructor and public source configuration helpers; callers provide local-source physical configuration. | Complete in 2.8. Removed configuration-record, primitive type/member, and extra-property guards. Source identity, finite position and irradiance, positive reference distance, nonnegative radius/scale, falloff, interval count, and cache lifecycle semantics remain. |
| `models/SpectralModel.js` | Constructor, `_acceptBasis()`, `replaceBasis()`, and `getWavelength()`; `SharedModel` is the only production constructor and facade configuration supplies the spectral basis. | Complete. Review confirmed no dependency-record revalidation remains. Spectral-basis compatibility and integer in-range wavelength lookup remain because they determine the physical spectral model and executable indexing. |
| `quantities/SpectralMath.js` | Exported arithmetic helpers; callers can directly invoke them with numerical and packet values. | Retain. Arithmetic domains, finite values, quantity, unit, and basis compatibility are public physical-value semantics. |
| `quantities/spectral-packets.js` | Packet construction and compatibility helpers; public quantity and light-source owners use them. | Retain. Packet units, quantity, basis, channel count, finite values, and provenance are the canonical physical packet contract. |
| `react/Algorithm32ReactUtils.js` | React/Three props normalization and render-target helpers; React supplies props and Three objects at an external adapter boundary. | Complete in 2.8. Removed props-record, member, and callback-packet shape checks. Three capability, pixel/resource limits, render priority, scene depth/scale, replacement, and cleanup lifecycle checks remain. |
| `shader/Algorithm32ShaderAssembler.js` | Constructor and `assemble()`; `ShaderBuilder` is the sole production creator/caller. | **Batch 2.7.** Remove configuration, validator, and request/collection wrapper checks. Retain compatibility-validator results, symbol conflicts, duplicate bindings, contribution order, and deterministic source assembly. |
| `shader/shaderCollectionValidation.js` | `acceptOptionalArray()` and `acceptShaderAssemblyCollections()`; `ShaderBuilder` builds each collection from typed contribution owners. | **Batch 2.7.** Remove array/object shape acceptance. Retain actual contribution compatibility rules in `ShaderCompatibilityValidator` and contribution constructors. |
| `shader/ShaderDescriptorBuilder.js` | `build()` and config/object helper functions; `ShaderBuilder` is the sole production caller and passes an accepted model/config snapshot. | **Batch 2.7.** Remove trusted request, model, snapshot, config-section, cache-descriptor, and Color-member shape checks. Retain descriptor id, compatibility-tag, mode, and deterministic fingerprint semantics. |
| `transport/scattering-order-field-operations.js` | `buildNextScatteringOrder()`, `accumulatePureScatteringFields()`, field-state checks, writer activity, and finite sum; CPU cache builders invoke them. | Retain. Mutable/sealed state, writer lifetime, non-aliasing, synchronous kernel execution, and finite accumulation preserve resource ownership and numerical validity. |
| `utils/ScalarMath.js` | Exported scalar operations. | Retain. Finite arithmetic-domain checks are the utility's public numerical contract. |
| `utils/VectorMath.js` | Exported vector operations. | Retain. Finite/nonzero normalization and vector arithmetic domains are public numerical contracts; downstream array-shape checks were removed in Step 2.4. |

The earlier `CanonicalAtmosphere`, `FlatEarthGeometry`,
`SphericalEarthGeometry`, `geometry-coordinates`,
`geometry-request-normalization`, `scattering-cache-direction-frames`,
`Reference`, and `SpectralCalculator` entries are already discharged by Step
2.4. `DenseScalarArrayLayout` and the descriptor-record assertion are
discharged by Step 2.3. No other remaining initial candidate contains a
confirmed redundant validation after this trace.

## Follow-up Batches

| Batch | Scope | Complete when |
| --- | --- | --- |
| 2.6 | Complete. Retired `assertCpuDirectionalSpectralField()` from `caches/cpuDirectionalSpectralFields.js`, its barrel re-export, and its assertion-only specification expectation. | Production has no field assertion API whose only function is structural checking. Field lifecycle/storage behavior remains covered; type checking and the 460-spec Node regression passed. |
| 2.7 | Complete. Retired `shader/shaderCollectionValidation.js` and removed repeated checks from `implementation/ShaderBuilder.js`, `shader/Algorithm32ShaderAssembler.js`, `shader/ShaderCompatibilityValidator.js`, and `shader/ShaderDescriptorBuilder.js`. | Internal typed handoffs have no repeated object/member/array validation. Shader contribution, symbol, deterministic-assembly, resource, and lifecycle semantics remain covered; type checking and the 453-spec Node regression passed. |
| 2.8 | Complete. Removed shape-only configuration, callback-packet, RGB-tuple, scene/camera/renderer, cache-control, request-record, local-source, and React viewport guards. `Algorithm32.js`, `local-sun-cache-plan.js`, and `SpectralModel.js` were reviewed and already had no qualifying guard. | Each removed guard only proved ambient-contract shape. Finite, physical, supported-value, resource, capability, and lifecycle checks retain a named owner and behavior coverage; type checking and the 450-spec Node regression passed. |
| 2.9 | Inventory and retire descriptor factories, `describe()` snapshots, hashes, fingerprints, compatibility tags, descriptor-only types, and propagation paths that exist only for deferred diagnostics, reporting, provenance, or future cache persistence. | Each retained item has an active executable or public consumer. Live physical values, cache storage/layout/addressing, resource plans, shader symbols and deterministic assembly remain owner-owned; no metadata-only descriptor path controls runtime behavior. |

Each batch must update or remove only tests that assert a rejected trusted
shape. The existing physical, numerical, shader-compatibility, resource, and
lifecycle behavior tests remain required. Run the Algorithm32 type check,
affected specifications, a retired-check scan, and the full Algorithm32 Node
regression after each batch.
