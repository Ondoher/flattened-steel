# Algorithm32 Reconciliation Inventory

Status: complete for Step 1.1 on 2026-08-01. This is the file-by-file
classification for the pre-retirement committed Algorithm32 tree
5f17471509162e6877de2cc45d0daf0e0ec2cb99 (285 files). The detailed
This baseline intentionally includes files later retired by Steps 1.2 and 1.3.
Current reconciliation findings and retirement decisions remain owned by the
[reconciliation ledger](../extraterrestrial/reconciliation.md).

## Classification Rules

- **Owner** identifies the Algorithm32 subsystem responsible for the file.
- **Surface** identifies its reconciliation role: a public facade, subsystem
  entry, ambient contract, internal implementation, test-only artifact, or
  data/configuration/documentation. It does not by itself promise a stable
  external API.
- Star retirement data is classified under A1 even where its current location
  is a production fixture folder.

## File Inventory

| Path | Category | Owner | Surface |
| --- | --- | --- | --- |
| `_tests/algorithm32-facade.spec.js` | Node test specification | Algorithm32 core tests | Test-only |
| `_tests/Algorithm32ShaderHandle.spec.js` | Node test specification | Algorithm32 core tests | Test-only |
| `_tests/fixtures.spec.js` | Node test specification | Algorithm32 core tests | Test-only |
| `_tests/scaffold.spec.js` | Node test specification | Algorithm32 core tests | Test-only |
| `_tests/utils.spec.js` | Node test specification | Algorithm32 core tests | Test-only |
| `Algorithm32.js` | Production facade | Algorithm32 core | Public runtime facade |
| `Algorithm32ShaderHandle.js` | Production shader handle | Algorithm32 core | Public shader-handle API |
| `atmospheres/_tests/CanonicalAtmosphere.spec.js` | Node test specification | Algorithm32 atmospheres | Test-only |
| `atmospheres/CanonicalAtmosphere.js` | Production implementation | Algorithm32 atmospheres | Internal implementation |
| `atmospheres/consts.js` | Internal constants module | Algorithm32 atmospheres | Internal implementation |
| `atmospheres/types.d.ts` | Ambient declaration | Algorithm32 atmospheres | Ambient contract surface |
| `caches/_tests/CacheDescriptors.spec.js` | Node test specification | Algorithm32 caches | Test-only |
| `caches/_tests/CpuDirectionalSpectralField.spec.js` | Node test specification | Algorithm32 caches | Test-only |
| `caches/_tests/DenseScalarArrayLayout.spec.js` | Node test specification | Algorithm32 caches | Test-only |
| `caches/CacheConstructionControlsDescriptor.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/consts.js` | Internal constants module | Algorithm32 caches | Internal implementation |
| `caches/CpuDirectionalSpectralField.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/cpuDirectionalSpectralFields.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/DenseScalarArrayLayout.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/DirectionalSpectralFieldDescriptor.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/gpu/_tests/CacheGpuExecutor.spec.js` | Node test specification | Algorithm32 caches | Test-only |
| `caches/gpu/_tests/CacheOperations.spec.js` | Node test specification | Algorithm32 caches | Test-only |
| `caches/gpu/_tests/CachePassAssembler.spec.js` | Node test specification | Algorithm32 caches | Test-only |
| `caches/gpu/cacheBuildContracts.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/gpu/CacheGpuExecutor.d.ts` | Ambient declaration | Algorithm32 caches | Ambient contract surface |
| `caches/gpu/CacheGpuExecutor.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/gpu/CacheOperations.d.ts` | Ambient declaration | Algorithm32 caches | Ambient contract surface |
| `caches/gpu/CacheOperations.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/gpu/CachePassAssembler.d.ts` | Ambient declaration | Algorithm32 caches | Ambient contract surface |
| `caches/gpu/CachePassAssembler.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/gpu/cacheRuntimeContracts.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/gpu/canonical-black-ground.d.ts` | Ambient declaration | Algorithm32 caches | Ambient contract surface |
| `caches/gpu/canonical-black-ground.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/gpu/consts.js` | Internal constants module | Algorithm32 caches | Internal implementation |
| `caches/gpu/types.d.ts` | Ambient declaration | Algorithm32 caches | Ambient contract surface |
| `caches/index.js` | Subsystem entry module | Algorithm32 caches | Subsystem entry surface |
| `caches/ScalarArrayTextureLayout.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/ScatteringCacheDescriptor.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `caches/SelectedCacheContract.js` | Production implementation | Algorithm32 caches | Internal implementation |
| `color/_tests/bruneton-color-display-model.spec.js` | Node test specification | Algorithm32 color | Test-only |
| `color/_tests/consts.js` | Test-support module | Algorithm32 color | Test-only |
| `color/BrunetonColorDisplayModel.js` | Production implementation | Algorithm32 color | Internal implementation |
| `color/consts.js` | Internal constants module | Algorithm32 color | Internal implementation |
| `color/types.d.ts` | Ambient declaration | Algorithm32 color | Ambient contract surface |
| `constants/_tests/Algorithm32CanonicalData.spec.js` | Node test specification | Algorithm32 constants | Test-only |
| `constants/Algorithm32CanonicalData.js` | Production implementation | Algorithm32 constants | Internal implementation |
| `constants/types.d.ts` | Ambient declaration | Algorithm32 constants | Ambient contract surface |
| `descriptors/descriptorSupport.js` | Production implementation | Algorithm32 descriptors | Internal implementation |
| `descriptors/types.d.ts` | Ambient declaration | Algorithm32 descriptors | Ambient contract surface |
| `domains/_tests/cubed-sphere-direction-domain.spec.js` | Node test specification | Algorithm32 domains | Test-only |
| `domains/_tests/CubedSphereW27DirectionDomain.spec.js` | Node test specification | Algorithm32 domains | Test-only |
| `domains/_tests/DirectionDomainDescriptor.spec.js` | Node test specification | Algorithm32 domains | Test-only |
| `domains/_tests/Fibonacci34DirectionDomain.spec.js` | Node test specification | Algorithm32 domains | Test-only |
| `domains/_tests/Native48PositionDomain.spec.js` | Node test specification | Algorithm32 domains | Test-only |
| `domains/_tests/paired-fibonacci-34-direction-domain.spec.js` | Node test specification | Algorithm32 domains | Test-only |
| `domains/_tests/PositionDomainDescriptor.spec.js` | Node test specification | Algorithm32 domains | Test-only |
| `domains/_tests/spherical-native-position-domain.spec.js` | Node test specification | Algorithm32 domains | Test-only |
| `domains/consts.js` | Internal constants module | Algorithm32 domains | Internal implementation |
| `domains/CubedSphereDirectionDomain.js` | Production implementation | Algorithm32 domains | Internal implementation |
| `domains/CubedSphereW27DirectionDomain.js` | Production implementation | Algorithm32 domains | Internal implementation |
| `domains/DirectionDomainDescriptor.js` | Production implementation | Algorithm32 domains | Internal implementation |
| `domains/domain-consts.js` | Internal constants module | Algorithm32 domains | Internal implementation |
| `domains/domainDescriptorSupport.js` | Production implementation | Algorithm32 domains | Internal implementation |
| `domains/Fibonacci34DirectionDomain.js` | Production implementation | Algorithm32 domains | Internal implementation |
| `domains/index.js` | Subsystem entry module | Algorithm32 domains | Subsystem entry surface |
| `domains/Native48PositionDomain.js` | Production implementation | Algorithm32 domains | Internal implementation |
| `domains/PairedFibonacci34DirectionDomain.js` | Production implementation | Algorithm32 domains | Internal implementation |
| `domains/PositionDomainDescriptor.js` | Production implementation | Algorithm32 domains | Internal implementation |
| `domains/SphericalNativePositionDomain.js` | Production implementation | Algorithm32 domains | Internal implementation |
| `domains/types.d.ts` | Ambient declaration | Algorithm32 domains | Ambient contract surface |
| `evidence.md` | Current documentation | Algorithm32 core | Documentation |
| `fixtures/_tests/Algorithm32StarLegacyL1Fixture.spec.js` | Node test specification | Algorithm32 fixtures | Test-only |
| `fixtures/_tests/GpuCacheParityPolicy.spec.js` | Node test specification | Algorithm32 fixtures | Test-only |
| `fixtures/_tests/local-sun-gpu-cache-parity-policy.spec.js` | Node test specification | Algorithm32 fixtures | Test-only |
| `fixtures/_tests/RuntimeCacheParityPolicy.spec.js` | Node test specification | Algorithm32 fixtures | Test-only |
| `fixtures/algorithm32-star-legacy-34-j2-compatibility.json` | Star retirement fixture, policy, or output | Algorithm32 fixtures | A1 retirement data |
| `fixtures/analytic-invariants.json` | Checked immutable fixture | Algorithm32 fixtures | Test data contract |
| `fixtures/gpu-cache-parity-policy.json` | Hand-maintained policy | Algorithm32 fixtures | Test data/configuration |
| `fixtures/local-sun-gpu-cache-parity-policy.json` | Hand-maintained policy | Algorithm32 fixtures | Test data/configuration |
| `fixtures/local-sun-gpu-cache-parity-policy-v1-rejected-z5-rho5.json` | Hand-maintained policy | Algorithm32 fixtures | Test data/configuration |
| `fixtures/runtime-cache-parity-policy.json` | Hand-maintained policy | Algorithm32 fixtures | Test data/configuration |
| `geometries/_tests/flat-earth-geometry.spec.js` | Node test specification | Algorithm32 geometries | Test-only |
| `geometries/_tests/spherical-earth-geometry.spec.js` | Node test specification | Algorithm32 geometries | Test-only |
| `geometries/consts.js` | Internal constants module | Algorithm32 geometries | Internal implementation |
| `geometries/FlatEarthGeometry.js` | Production implementation | Algorithm32 geometries | Internal implementation |
| `geometries/geometryCoordinates.js` | Production implementation | Algorithm32 geometries | Internal implementation |
| `geometries/geometryRequestNormalization.js` | Production implementation | Algorithm32 geometries | Internal implementation |
| `geometries/scattering-cache-direction-frames.js` | Production implementation | Algorithm32 geometries | Internal implementation |
| `geometries/SphericalEarthGeometry.js` | Production implementation | Algorithm32 geometries | Internal implementation |
| `geometries/types.d.ts` | Ambient declaration | Algorithm32 geometries | Ambient contract surface |
| `ground-boundaries/_tests/uniform-lambertian-ground-boundary.spec.js` | Node test specification | Algorithm32 ground-boundaries | Test-only |
| `ground-boundaries/consts.js` | Internal constants module | Algorithm32 ground-boundaries | Internal implementation |
| `ground-boundaries/index.js` | Subsystem entry module | Algorithm32 ground-boundaries | Subsystem entry surface |
| `ground-boundaries/types.d.ts` | Ambient declaration | Algorithm32 ground-boundaries | Ambient contract surface |
| `ground-boundaries/UniformLambertianGroundBoundary.js` | Production implementation | Algorithm32 ground-boundaries | Internal implementation |
| `implementation/_tests/reference-orchestration.spec.js` | Node test specification | Algorithm32 implementation | Test-only |
| `implementation/_tests/scene-input-capture.spec.js` | Node test specification | Algorithm32 implementation | Test-only |
| `implementation/_tests/shader-builder.spec.js` | Node test specification | Algorithm32 implementation | Test-only |
| `implementation/_tests/shader-pass-performance-timer.spec.js` | Node test specification | Algorithm32 implementation | Test-only |
| `implementation/_tests/shader-runtime-pass.spec.js` | Node test specification | Algorithm32 implementation | Test-only |
| `implementation/_tests/SpectralCalculator.spec.js` | Node test specification | Algorithm32 implementation | Test-only |
| `implementation/consts.js` | Internal constants module | Algorithm32 implementation | Internal implementation |
| `implementation/Reference.js` | Production implementation | Algorithm32 implementation | Internal implementation |
| `implementation/SceneInputCapture.js` | Production implementation | Algorithm32 implementation | Internal implementation |
| `implementation/ShaderBuilder.js` | Production implementation | Algorithm32 implementation | Internal implementation |
| `implementation/ShaderPassPerformanceTimer.js` | Production implementation | Algorithm32 implementation | Internal implementation |
| `implementation/ShaderRuntimePass.js` | Production implementation | Algorithm32 implementation | Internal implementation |
| `implementation/SpectralCalculator.js` | Production implementation | Algorithm32 implementation | Internal implementation |
| `implementation/spectralNumericKernels.js` | Production implementation | Algorithm32 implementation | Internal implementation |
| `implementation/types.d.ts` | Ambient declaration | Algorithm32 implementation | Ambient contract surface |
| `jsconfig.json` | Type/build configuration | Algorithm32 core | Configuration |
| `light-sources/_tests/DistantSphericalOwnerShaderContributions.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/DistantSunCache.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/DistantSunCacheController.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/DistantSunCachePlan.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/distant-sun-construction-domain-selection.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/DistantSunCpuCache.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/distant-sun-cpu-cache-build.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/DistantSunCpuFields.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/DistantSunFieldPacking.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/DistantSunGpuOwnerModules.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/distant-sun-later-order-scattering-density.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/distant-sun-light-source.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/distant-sun-primary-radiance.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/distant-sun-scattering-density-transport.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/flat-synchronizer.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/local-sun-cache.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/local-sun-cache-controller.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/local-sun-cache-plan.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/LocalSunConstructionLightSource.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/local-sun-cpu-cache.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/LocalSunLightSource.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/LocalSunShellFactCache.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/NativeN4CpuGpuParityOracle.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/spectralTestValues.js` | Test-support module | Algorithm32 light-sources | Test-only |
| `light-sources/_tests/ThreeShadowObjectConfigurator.spec.js` | Node test specification | Algorithm32 light-sources | Test-only |
| `light-sources/consts.js` | Internal constants module | Algorithm32 light-sources | Internal implementation |
| `light-sources/create-local-sun-shell-fact-cache.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/DistantSunCache.d.ts` | Ambient declaration | Algorithm32 light-sources | Ambient contract surface |
| `light-sources/DistantSunCache.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/DistantSunCacheController.d.ts` | Ambient declaration | Algorithm32 light-sources | Ambient contract surface |
| `light-sources/DistantSunCacheController.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/distant-sun-cache-fingerprint.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/distant-sun-cache-plan.d.ts` | Ambient declaration | Algorithm32 light-sources | Ambient contract surface |
| `light-sources/distant-sun-cache-plan.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/DistantSunConstructionDomainSelection.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/DistantSunCpuCache.d.ts` | Ambient declaration | Algorithm32 light-sources | Ambient contract surface |
| `light-sources/DistantSunCpuCache.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/distant-sun-cpu-cache-build.d.ts` | Ambient declaration | Algorithm32 light-sources | Ambient contract surface |
| `light-sources/distant-sun-cpu-cache-build.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/DistantSunCpuFields.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/DistantSunFieldPacking.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/distant-sun-later-order-scattering-density.d.ts` | Ambient declaration | Algorithm32 light-sources | Ambient contract surface |
| `light-sources/distant-sun-later-order-scattering-density.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/DistantSunLightSource.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/distant-sun-primary-radiance.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/distant-sun-primary-scattering-density.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/distant-sun-scattering-density-transport.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/fixtures/algorithm32-production-native-n4-cpu-gpu-parity-oracle.json` | Checked immutable fixture | Algorithm32 light-sources | Test data contract |
| `light-sources/fixtures/algorithm32-star-legacy-l1-parity.json` | Star retirement fixture, policy, or output | Algorithm32 light-sources | A1 retirement data |
| `light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-comparison-policy.json` | Star retirement fixture, policy, or output | Algorithm32 light-sources | A1 retirement data |
| `light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-comparison-report.json` | Star retirement fixture, policy, or output | Algorithm32 light-sources | A1 retirement data |
| `light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-gold.json` | Star retirement fixture, policy, or output | Algorithm32 light-sources | A1 retirement data |
| `light-sources/fixtures/star-parity-consts.js` | Internal constants module | Algorithm32 light-sources | Internal implementation |
| `light-sources/FlatSynchronizer.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/lightSourceRequestValues.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunCache.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunCacheController.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/local-sun-cache-fingerprint.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/local-sun-cache-plan.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunCacheSource.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunConstructionDomainSelection.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunConstructionLightSource.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/local-sun-consts.js` | Internal constants module | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunCpuCache.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/local-sun-cpu-cache-build.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunCpuFields.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunFieldPacking.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/local-sun-geometry-pairing.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/local-sun-later-order-scattering-density.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunLightSource.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/local-sun-primary-radiance.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/local-sun-primary-scattering-density.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/local-sun-scattering-density-transport.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/LocalSunShellFactCache.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/threeLightingSupport.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/ThreeShadowObjectConfigurator.js` | Production implementation | Algorithm32 light-sources | Internal implementation |
| `light-sources/types.d.ts` | Ambient declaration | Algorithm32 light-sources | Ambient contract surface |
| `models/_tests/SharedModel.spec.js` | Node test specification | Algorithm32 models | Test-only |
| `models/_tests/SpectralModel.spec.js` | Node test specification | Algorithm32 models | Test-only |
| `models/SharedModel.js` | Production implementation | Algorithm32 models | Internal implementation |
| `models/SpectralModel.js` | Production implementation | Algorithm32 models | Internal implementation |
| `models/types.d.ts` | Ambient declaration | Algorithm32 models | Ambient contract surface |
| `profiles/_tests/native-15-profile.spec.js` | Node test specification | Algorithm32 profiles | Test-only |
| `profiles/consts.js` | Internal constants module | Algorithm32 profiles | Internal implementation |
| `profiles/index.js` | Subsystem entry module | Algorithm32 profiles | Subsystem entry surface |
| `profiles/native-15-profile.js` | Production implementation | Algorithm32 profiles | Internal implementation |
| `profiles/types.d.ts` | Ambient declaration | Algorithm32 profiles | Ambient contract surface |
| `quantities/_tests/descriptorSupport.spec.js` | Node test specification | Algorithm32 quantities | Test-only |
| `quantities/_tests/SpectralBasis.spec.js` | Node test specification | Algorithm32 quantities | Test-only |
| `quantities/_tests/spectral-packet.spec.js` | Node test specification | Algorithm32 quantities | Test-only |
| `quantities/_tests/UnitValue.spec.js` | Node test specification | Algorithm32 quantities | Test-only |
| `quantities/consts.js` | Internal constants module | Algorithm32 quantities | Internal implementation |
| `quantities/index.js` | Subsystem entry module | Algorithm32 quantities | Subsystem entry surface |
| `quantities/spectralBases.js` | Production implementation | Algorithm32 quantities | Internal implementation |
| `quantities/SpectralBasis.js` | Production implementation | Algorithm32 quantities | Internal implementation |
| `quantities/spectralBasisContract.js` | Production implementation | Algorithm32 quantities | Internal implementation |
| `quantities/SpectralMath.js` | Production implementation | Algorithm32 quantities | Internal implementation |
| `quantities/SpectralPacket.js` | Production implementation | Algorithm32 quantities | Internal implementation |
| `quantities/spectral-packet-contract.js` | Production implementation | Algorithm32 quantities | Internal implementation |
| `quantities/spectral-packets.js` | Production implementation | Algorithm32 quantities | Internal implementation |
| `quantities/types.d.ts` | Ambient declaration | Algorithm32 quantities | Ambient contract surface |
| `quantities/UnitValue.js` | Production implementation | Algorithm32 quantities | Internal implementation |
| `react/_tests/Algorithm32ReactUtils.spec.js` | Node test specification | Algorithm32 react | Test-only |
| `react/Algorithm32AtmosphereComposer.js` | Production implementation | Algorithm32 react | Internal implementation |
| `react/Algorithm32R3FAtmosphereComposer.jsx` | React component | Algorithm32 react | Component surface |
| `react/Algorithm32ReactUtils.js` | Production implementation | Algorithm32 react | Internal implementation |
| `react/consts.js` | Internal constants module | Algorithm32 react | Internal implementation |
| `react/index.js` | Subsystem entry module | Algorithm32 react | Subsystem entry surface |
| `README.md` | Current documentation | Algorithm32 core | Documentation |
| `references.md` | Current documentation | Algorithm32 core | Documentation |
| `references/README.md` | Current documentation | Algorithm32 references | Documentation |
| `references/source-registry.json` | Scaffold-history data | Algorithm32 references | Documentation support |
| `shader/_tests/algorithm32-shader-assembler.spec.js` | Node test specification | Algorithm32 shader | Test-only |
| `shader/_tests/shader-compatibility-validator.spec.js` | Node test specification | Algorithm32 shader | Test-only |
| `shader/_tests/shaderContribution.spec.js` | Node test specification | Algorithm32 shader | Test-only |
| `shader/_tests/shader-descriptor-builder.spec.js` | Node test specification | Algorithm32 shader | Test-only |
| `shader/Algorithm32ShaderAssembler.js` | Production implementation | Algorithm32 shader | Internal implementation |
| `shader/shaderCollectionValidation.js` | Production implementation | Algorithm32 shader | Internal implementation |
| `shader/ShaderCompatibilityValidator.js` | Production implementation | Algorithm32 shader | Internal implementation |
| `shader/shaderContribution.js` | Production implementation | Algorithm32 shader | Internal implementation |
| `shader/ShaderDescriptorBuilder.js` | Production implementation | Algorithm32 shader | Internal implementation |
| `shader/stableHash.js` | Production implementation | Algorithm32 shader | Internal implementation |
| `shader/types.d.ts` | Ambient declaration | Algorithm32 shader | Ambient contract surface |
| `three/_tests/algorithm32-star-ground-parity.star-parity.js` | Browser test specification | Algorithm32 three | Test-only |
| `three/_tests/ExactFlatGroundObject.spec.js` | Node test specification | Algorithm32 three | Test-only |
| `three/_tests/ExactSphereGroundObject.spec.js` | Node test specification | Algorithm32 three | Test-only |
| `three/_tests/local-sun-cpu-parity-worker.js` | Test-support module | Algorithm32 three | Test-only |
| `three/_tests/local-sun-gpu-parity.browser.js` | Browser test specification | Algorithm32 three | Test-only |
| `three/_tests/local-sun-gpu-parity-support.js` | Test-support module | Algorithm32 three | Test-only |
| `three/_tests/ProductionGpuCacheParity.browser.js` | Browser test specification | Algorithm32 three | Test-only |
| `three/_tests/stage10-spectral-composition.browser.js` | Browser test specification | Algorithm32 three | Test-only |
| `three/_tests/star-ground-gpu-parity-consts.js` | Test-support module | Algorithm32 three | Test-only |
| `three/_tests/StarGroundGpuParityHarness.js` | Test-support module | Algorithm32 three | Test-only |
| `three/_tests/ThreeCacheBackend.spec.js` | Node test specification | Algorithm32 three | Test-only |
| `three/_tests/ThreeWebGL.browser.js` | Browser test specification | Algorithm32 three | Test-only |
| `three/ExactFlatGroundObject.js` | Production implementation | Algorithm32 three | Internal implementation |
| `three/ExactSphereGroundObject.js` | Production implementation | Algorithm32 three | Internal implementation |
| `three/ThreeCacheBackend.d.ts` | Ambient declaration | Algorithm32 three | Ambient contract surface |
| `three/ThreeCacheBackend.js` | Production implementation | Algorithm32 three | Internal implementation |
| `three/types.d.ts` | Ambient declaration | Algorithm32 three | Ambient contract surface |
| `transport/_tests/algorithm32-transport.spec.js` | Node test specification | Algorithm32 transport | Test-only |
| `transport/_tests/later-order-scattering-density.spec.js` | Node test specification | Algorithm32 transport | Test-only |
| `transport/_tests/scattering-density-transport.spec.js` | Node test specification | Algorithm32 transport | Test-only |
| `transport/_tests/scattering-order-field-operations.spec.js` | Node test specification | Algorithm32 transport | Test-only |
| `transport/Algorithm32Transport.js` | Production implementation | Algorithm32 transport | Internal implementation |
| `transport/consts.js` | Internal constants module | Algorithm32 transport | Internal implementation |
| `transport/later-order-scattering-density.d.ts` | Ambient declaration | Algorithm32 transport | Ambient contract surface |
| `transport/later-order-scattering-density.js` | Production implementation | Algorithm32 transport | Internal implementation |
| `transport/scattering-density-transport.js` | Production implementation | Algorithm32 transport | Internal implementation |
| `transport/scattering-order-field-operations.js` | Production implementation | Algorithm32 transport | Internal implementation |
| `transport/types.d.ts` | Ambient declaration | Algorithm32 transport | Ambient contract surface |
| `types.d.ts` | Ambient declaration | Algorithm32 core | Ambient contract surface |
| `types/AtmosphereModel.d.ts` | Ambient declaration | Algorithm32 shared types | Ambient contract surface |
| `types/Color.d.ts` | Ambient declaration | Algorithm32 shared types | Ambient contract surface |
| `types/ExtraterrestrialSource.d.ts` | Ambient declaration | Algorithm32 shared types | Ambient contract surface |
| `types/GeometryModel.d.ts` | Ambient declaration | Algorithm32 shared types | Ambient contract surface |
| `types/GroundBoundary.d.ts` | Ambient declaration | Algorithm32 shared types | Ambient contract surface |
| `types/LightSourceModel.d.ts` | Ambient declaration | Algorithm32 shared types | Ambient contract surface |
| `types/ScatteringCache.d.ts` | Ambient declaration | Algorithm32 shared types | Ambient contract surface |
| `types/types.d.ts` | Ambient declaration | Algorithm32 shared types | Ambient contract surface |
| `utils/_tests/PixelMath.spec.js` | Node test specification | Algorithm32 utils | Test-only |
| `utils/AngleMath.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/ArrayMath.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/DistanceMath.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/durationValues.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/MathUtils.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/numericValues.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/PixelMath.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/SampleMath.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/ScalarMath.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/SceneMath.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/types.d.ts` | Ambient declaration | Algorithm32 utils | Ambient contract surface |
| `utils/VectorMath.js` | Production implementation | Algorithm32 utils | Internal implementation |
| `utils/WavelengthMath.js` | Production implementation | Algorithm32 utils | Internal implementation |
