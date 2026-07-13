# Algorithm32 Helper Ownership Target Plan: Foundation Rows

Status: canonical Step 4.5.3 target-design appendix for the foundation
partition. All 20 immediate `FN1`-`FN4` rows were implemented and gated by
Step 4.5.4 on 2026-08-04. All 57 `FC1`-`FC8` and `FN5` rows were implemented
and gated by Step 4.5.5 on 2026-08-04. Future-tense row language below remains
the approved target record; the current result is owned by the
[main target plan](./helper-ownership-target-plan.md#step-455-execution-result).

The plan classifies targets for source identity
`4aeeb00102d4713f3f31f219cdf9d71092a64d241279fd7e60411f0e84e090af`.
Its authoritative identity is `current path + symbol + role`, matching
[the foundation inventory](./helper-ownership-inventory-foundation.md) and
[the foundation classification](./helper-ownership-classification-foundation.md).

A namespace target means one PascalCase module with one namespace-object
export and the listed methods; it does not authorize a barrel alias or an
additional named-function compatibility export. Existing namespace rows stay
where they are. Construction-shaped rows use `FC*` batches and do not move
ahead of the Step 4.5.5 callable-form decision. Non-construction support that
is inseparable from one of those rows travels in the same atomic `FC*`
transaction. `FN*` identifies ordinary foundation namespace/class
transactions, while `FN0*` records no-op retention.

## Authoritative Target Rows

| Current path | Symbol | Role | Disposition | Final owner path | Final owner/symbol | Action | Batch |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `domains/direction/cubed-sphere/cubed-sphere-w27-direction-domain.js` | `createCubedSphereW27DirectionDomain` | `exported-function` | `return-to-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain.<construction callable form deferred>` | `defer-construction-form-to-4.5.5` | `FC7-cubed-w27` |
| `domains/direction/cubed-sphere/cubed-sphere-w27-direction-domain.js` | `flattenCubedSphereW27NodeIndex` | `exported-function` | `return-to-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain.flattenNodeIndex (public instance; existing)` | `move-to-class` | `FC7-cubed-w27` |
| `domains/direction/cubed-sphere/cubed-sphere-w27-direction-domain.js` | `unflattenCubedSphereW27NodeIndex` | `exported-function` | `return-to-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain.unflattenNodeIndex (public instance; existing)` | `move-to-class` | `FC7-cubed-w27` |
| `domains/direction/cubed-sphere/cubed-sphere-w27-direction-domain.js` | `createCubedSphereW27DirectionStencil` | `exported-function` | `return-to-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain.resolveStencil (public instance; callable form deferred)` | `defer-construction-form-to-4.5.5` | `FC7-cubed-w27` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._canonicalZero` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._canonicalZero` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._acceptDefinition` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._acceptDefinition` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createFaces` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createFaces` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._copyVector` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._copyVector` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createUnitVectors` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createUnitVectors` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createSourceLocalDirection` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createSourceLocalDirection` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createPositiveFaceCenterIndices` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createPositiveFaceCenterIndices` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._normalize` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._normalize` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._assertIndex` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._assertIndex` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._assertUnitDirection` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._assertUnitDirection` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._selectDominantFace` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._selectDominantFace` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._dot` | `class-support` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.dot (existing)` | `move-to-existing-namespace` | `FN2-shared-math` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._clamp` | `class-support` | `class-independent` | `utils/math/ScalarMath.js` | `ScalarMath.clamp (existing; ordered finite bounds)` | `move-to-existing-namespace` | `FN2-shared-math` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._normalizedCoordinateToGrid` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._normalizedCoordinateToGrid` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._gridLocation` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._gridLocation` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._addTap` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._addTap` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createNormalizedStencil` | `class-support` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain._createNormalizedStencil` | `retain` | `FN0-retain-class` |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain.flattenNodeIndex` | `class-public-internal` | `keep-on-class` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | `CubedSphereDirectionDomain.flattenNodeIndex` | `retain` | `FN0-retain-class` |
| `domains/direction/fibonacci/Fibonacci34DirectionDomain.js` | `Fibonacci34DirectionDomain._createUnitVectors` | `class-support` | `keep-on-class` | `domains/direction/fibonacci/Fibonacci34DirectionDomain.js` | `Fibonacci34DirectionDomain._createUnitVectors` | `retain` | `FN0-retain-class` |
| `domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js` | `PairedFibonacci34DirectionDomain._createUnitVectors` | `class-support` | `keep-on-class` | `domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js` | `PairedFibonacci34DirectionDomain._createUnitVectors` | `retain` | `FN0-retain-class` |
| `domains/position/spherical-native/native-48-position-domain.js` | `createNative48PositionDomain` | `exported-function` | `return-to-class` | `domains/position/spherical-native/SphericalNativePositionDomain.js` | `SphericalNativePositionDomain.<construction callable form deferred>` | `defer-construction-form-to-4.5.5` | `FC8-native-48` |
| `domains/position/spherical-native/SphericalNativePositionDomain.js` | `SphericalNativePositionDomain._acceptDefinition` | `class-support` | `keep-on-class` | `domains/position/spherical-native/SphericalNativePositionDomain.js` | `SphericalNativePositionDomain._acceptDefinition` | `retain` | `FN0-retain-class` |
| `domains/position/spherical-native/SphericalNativePositionDomain.js` | `SphericalNativePositionDomain._createNodes` | `class-support` | `keep-on-class` | `domains/position/spherical-native/SphericalNativePositionDomain.js` | `SphericalNativePositionDomain._createNodes` | `retain` | `FN0-retain-class` |
| `quantities/spectral/spectral-bases.js` | `createSpectralBasis` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralBasis.js` | `SpectralBasis.<construction callable form deferred>` | `defer-construction-form-to-4.5.5` | `FC2-spectral-basis` |
| `quantities/spectral/spectral-bases.js` | `assertSpectralBasis` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralBasis.js` | `SpectralBasis.assert (public static)` | `move-to-class` | `FC2-spectral-basis` |
| `quantities/spectral/spectral-bases.js` | `assertCompatibleSpectralBases` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralBasis.js` | `SpectralBasis.assertCompatible (public static)` | `move-to-class` | `FC2-spectral-basis` |
| `quantities/spectral/spectral-basis-contract.js` | `nearlyEqual` | `module-local-function` | `return-to-class` | `quantities/spectral/SpectralBasis.js` | `SpectralBasis._nearlyEqual (private instance)` | `move-to-class` | `FC2-spectral-basis` |
| `quantities/spectral/spectral-basis-contract.js` | `normalizeSpectralBasisChannels` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralBasis.js` | `SpectralBasis._normalizeChannels (private instance)` | `move-to-class` | `FC2-spectral-basis` |
| `quantities/spectral/spectral-math.js` | `assertResultInterpretation` | `module-local-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.assertResultInterpretation` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `acceptOperationOptions` | `module-local-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.acceptOperationOptions` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `acceptMappingResult` | `module-local-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.acceptMappingResult` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `resolveProvenanceIdentity` | `module-local-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.resolveProvenanceIdentity` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `derivedProvenanceIdentity` | `module-local-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.derivedProvenanceIdentity` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `zeroSpectralPacket` | `exported-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.zeroSpectralPacket` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `oneSpectralPacket` | `exported-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.oneSpectralPacket` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `scaleSpectralPacket` | `exported-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.scaleSpectralPacket` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `addSpectralPackets` | `exported-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.addSpectralPackets` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `multiplySpectralPackets` | `exported-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.multiplySpectralPackets` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `divideSpectralPackets` | `exported-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.divideSpectralPackets` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-math.js` | `mapSpectralPacket` | `exported-function` | `class-independent` | `quantities/spectral/SpectralMath.js` | `SpectralMath.mapSpectralPacket` | `move-to-new-namespace` | `FN5-spectral-math` |
| `quantities/spectral/spectral-packet-contract.js` | `requireSpectralQuantity` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralPacket.js` | `SpectralPacket._requireQuantity (private instance)` | `move-to-class` | `FC3-spectral-packet` |
| `quantities/spectral/spectral-packet-contract.js` | `spectralUnitsForQuantity` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralPacket.js` | `SpectralPacket._unitsForQuantity (private instance)` | `move-to-class` | `FC3-spectral-packet` |
| `quantities/spectral/spectral-packet-contract.js` | `normalizeSpectralUnits` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralPacket.js` | `SpectralPacket.normalizeUnits (public static)` | `move-to-class` | `FC3-spectral-packet` |
| `quantities/spectral/spectral-packet-contract.js` | `normalizeSpectralValues` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralPacket.js` | `SpectralPacket._normalizeValues (private instance)` | `move-to-class` | `FC3-spectral-packet` |
| `quantities/spectral/spectral-packets.js` | `createSpectralPacket` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralPacket.js` | `SpectralPacket.<construction callable form deferred>` | `defer-construction-form-to-4.5.5` | `FC3-spectral-packet` |
| `quantities/spectral/spectral-packets.js` | `assertSpectralPacket` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralPacket.js` | `SpectralPacket.assert (public static)` | `move-to-class` | `FC3-spectral-packet` |
| `quantities/spectral/spectral-packets.js` | `assertCompatibleSpectralPackets` | `exported-function` | `return-to-class` | `quantities/spectral/SpectralPacket.js` | `SpectralPacket.assertCompatible (public static)` | `move-to-class` | `FC3-spectral-packet` |
| `quantities/units/consts.js` | `family` | `module-local-function` | `class-independent` | `quantities/units/UnitMath.js` | `UnitMath.family` | `move-to-new-namespace` | `FC1-unit-values` |
| `quantities/units/unit-values.js` | `conversion` | `module-local-function` | `class-independent` | `quantities/units/UnitMath.js` | `UnitMath.conversion` | `move-to-new-namespace` | `FC1-unit-values` |
| `quantities/units/unit-values.js` | `createUnitValue` | `exported-function` | `class-independent` | `quantities/units/UnitMath.js` | `UnitMath.createUnitValue` | `defer-construction-form-to-4.5.5` | `FC1-unit-values` |
| `quantities/units/unit-values.js` | `assertUnitValue` | `exported-function` | `class-independent` | `quantities/units/UnitMath.js` | `UnitMath.assertUnitValue` | `move-to-new-namespace` | `FC1-unit-values` |
| `quantities/units/unit-values.js` | `isUnitValue` | `exported-function` | `class-independent` | `quantities/units/UnitMath.js` | `UnitMath.isUnitValue` | `move-to-new-namespace` | `FC1-unit-values` |
| `quantities/units/unit-values.js` | `copyUnitValue` | `exported-function` | `class-independent` | `quantities/units/UnitMath.js` | `UnitMath.copyUnitValue` | `move-to-new-namespace` | `FC1-unit-values` |
| `quantities/units/unit-values.js` | `convertUnitValue` | `exported-function` | `class-independent` | `quantities/units/UnitMath.js` | `UnitMath.convertUnitValue` | `move-to-new-namespace` | `FC1-unit-values` |
| `quantities/units/unit-values.js` | `normalizeUnitValue` | `exported-function` | `class-independent` | `quantities/units/UnitMath.js` | `UnitMath.normalizeUnitValue` | `move-to-new-namespace` | `FC1-unit-values` |
| `transport/Algorithm32Transport.js` | `Algorithm32Transport._resolveTransportOptions` | `class-support` | `keep-on-class` | `transport/Algorithm32Transport.js` | `Algorithm32Transport._resolveTransportOptions` | `retain` | `FN0-retain-class` |
| `transport/Algorithm32Transport.js` | `Algorithm32Transport._transportPathSampleHelper` | `class-support` | `keep-on-class` | `transport/Algorithm32Transport.js` | `Algorithm32Transport._transportPathSampleHelper` | `retain` | `FN0-retain-class` |
| `transport/Algorithm32Transport.js` | `Algorithm32Transport._cumulativeTransportBlock` | `class-support` | `keep-on-class` | `transport/Algorithm32Transport.js` | `Algorithm32Transport._cumulativeTransportBlock` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._cacheCoordinate` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._cacheCoordinate` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._groundReflectionSource` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._groundReflectionSource` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._directGroundReflectionSource` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._directGroundReflectionSource` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._indirectGroundReflectionSource` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._indirectGroundReflectionSource` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._scatterBlocks` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._scatterBlocks` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._transportBlocks` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._transportBlocks` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._accumulateBlocks` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._accumulateBlocks` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._operationBlocks` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._operationBlocks` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._operationBindings` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._operationBindings` | `retain` | `FN0-retain-class` |
| `transport/cache/CacheOperations.js` | `CacheOperations._operationRequirements` | `class-support` | `keep-on-class` | `transport/cache/CacheOperations.js` | `CacheOperations._operationRequirements` | `retain` | `FN0-retain-class` |
| `transport/later-order-scattering-density.js` | `resolvePhysicalIncomingDirections` | `module-local-function` | `class-independent` | `transport/later-order-scattering-density.js` | `resolvePhysicalIncomingDirections (module-local)` | `retain-ordinary` | `FC5-later-order-kernel` |
| `transport/later-order-scattering-density.js` | `readIncomingRadianceAtPosition` | `module-local-function` | `class-independent` | `transport/later-order-scattering-density.js` | `readIncomingRadianceAtPosition (module-local)` | `retain-ordinary` | `FC5-later-order-kernel` |
| `transport/later-order-scattering-density.js` | `buildPhysicalScatteringOrder` | `module-local-function` | `class-independent` | `transport/later-order-scattering-density.js` | `buildPhysicalScatteringOrder (module-local callable form deferred)` | `defer-construction-form-to-4.5.5` | `FC5-later-order-kernel` |
| `transport/later-order-scattering-density.js` | `createPhysicalLaterOrderScatteringKernel` | `exported-function` | `class-independent` | `transport/later-order-scattering-density.js` | `createPhysicalLaterOrderScatteringKernel (named export callable form deferred)` | `defer-construction-form-to-4.5.5` | `FC5-later-order-kernel` |
| `transport/scattering-density-transport.js` | `multiply` | `module-local-function` | `class-independent` | `utils/math/ArrayMath.js` | `ArrayMath.multiplyToFloat64` | `move-to-existing-namespace` | `FN2-shared-math` |
| `transport/scattering-density-transport.js` | `positionAlongRay` | `module-local-function` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.positionAlongRay` | `move-to-existing-namespace` | `FN2-shared-math` |
| `transport/scattering-density-transport.js` | `sampleScatteringDensity` | `module-local-function` | `class-independent` | `transport/scattering-density-transport.js` | `sampleScatteringDensity (module-local)` | `retain-ordinary` | `FN0-retain-ordinary` |
| `transport/scattering-density-transport.js` | `integrateScatteringDensityAlongPath` | `module-local-function` | `class-independent` | `transport/scattering-density-transport.js` | `integrateScatteringDensityAlongPath (module-local)` | `retain-ordinary` | `FN0-retain-ordinary` |
| `transport/scattering-density-transport.js` | `zeroMutableField` | `module-local-function` | `class-independent` | `transport/ScatteringOrderFieldOperations.js` | `ScatteringOrderFieldOperations.zeroMutableField` | `move-to-new-namespace` | `FC4-field-operations` |
| `transport/scattering-density-transport.js` | `transportPureScatteringDensity` | `exported-function` | `class-independent` | `transport/scattering-density-transport.js` | `transportPureScatteringDensity (named export)` | `retain-ordinary` | `FN0-retain-ordinary` |
| `transport/scattering-order-field-operations.js` | `assertSealedField` | `module-local-function` | `class-independent` | `transport/ScatteringOrderFieldOperations.js` | `ScatteringOrderFieldOperations.assertSealedField` | `move-to-new-namespace` | `FC4-field-operations` |
| `transport/scattering-order-field-operations.js` | `assertMutableField` | `module-local-function` | `class-independent` | `transport/ScatteringOrderFieldOperations.js` | `ScatteringOrderFieldOperations.assertMutableField` | `move-to-new-namespace` | `FC4-field-operations` |
| `transport/scattering-order-field-operations.js` | `createRevocableWriter` | `module-local-function` | `class-independent` | `transport/ScatteringOrderFieldOperations.js` | `ScatteringOrderFieldOperations.createRevocableWriter (callable form deferred)` | `defer-construction-form-to-4.5.5` | `FC4-field-operations` |
| `transport/scattering-order-field-operations.js` | `zeroMutableField` | `module-local-function` | `class-independent` | `transport/ScatteringOrderFieldOperations.js` | `ScatteringOrderFieldOperations.zeroMutableField` | `move-to-new-namespace` | `FC4-field-operations` |
| `transport/scattering-order-field-operations.js` | `buildNextScatteringOrder` | `exported-function` | `class-independent` | `transport/ScatteringOrderFieldOperations.js` | `ScatteringOrderFieldOperations.buildNextScatteringOrder (callable form deferred)` | `defer-construction-form-to-4.5.5` | `FC4-field-operations` |
| `transport/scattering-order-field-operations.js` | `accumulatePureScatteringFields` | `exported-function` | `class-independent` | `transport/ScatteringOrderFieldOperations.js` | `ScatteringOrderFieldOperations.accumulatePureScatteringFields` | `move-to-new-namespace` | `FC4-field-operations` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._calculatorProvenance` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._calculatorProvenance` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._acceptInverseSolidAngle` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._acceptInverseSolidAngle` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._zeroSpectralValues` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._zeroSpectralValues` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._oneSpectralValues` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._oneSpectralValues` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._sourceTransmittanceValues` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._sourceTransmittanceValues` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._trapezoidSegmentTransmittanceValues` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._trapezoidSegmentTransmittanceValues` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._phaseWeightedScatteringValues` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._phaseWeightedScatteringValues` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._directInScatteringValues` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._directInScatteringValues` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._multiplySpectralValues` | `class-support` | `class-independent` | `utils/math/ArrayMath.js` | `ArrayMath.multiplyToFloat64` | `move-to-existing-namespace` | `FN2-shared-math` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._accumulateSpectralValues` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._accumulateSpectralValues` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator.dependencies` | `class-public-internal` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator.dependencies` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._acceptPacket` | `class-support` | `keep-on-class` | `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._acceptPacket` | `retain` | `FN0-retain-class` |
| `transport/spectral/SpectralCalculator.js` | `SpectralCalculator._addScaled` | `class-support` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.positionAlongRay` | `move-to-existing-namespace` | `FN2-shared-math` |
| `utils/identity/value-hashes.js` | `serializeCanonicalValue` | `module-local-function` | `class-independent` | `utils/identity/CanonicalValueHash.js` | `CanonicalValueHash.serializeCanonicalValue` | `move-to-new-namespace` | `FN4-identity` |
| `utils/identity/value-hashes.js` | `rotateRight` | `module-local-function` | `class-independent` | `utils/identity/CanonicalValueHash.js` | `CanonicalValueHash.rotateRight` | `move-to-new-namespace` | `FN4-identity` |
| `utils/identity/value-hashes.js` | `sha256Value` | `exported-function` | `class-independent` | `utils/identity/CanonicalValueHash.js` | `CanonicalValueHash.sha256Value` | `move-to-new-namespace` | `FN4-identity` |
| `utils/identity/value-hashes.js` | `serializeStableValue` | `module-local-function` | `class-independent` | `utils/identity/StableValueHash.js` | `StableValueHash.serializeStableValue` | `move-to-new-namespace` | `FN4-identity` |
| `utils/identity/value-hashes.js` | `stableStringify` | `exported-function` | `class-independent` | `utils/identity/StableValueHash.js` | `StableValueHash.stableStringify` | `move-to-new-namespace` | `FN4-identity` |
| `utils/identity/value-hashes.js` | `stableHash` | `exported-function` | `class-independent` | `utils/identity/StableValueHash.js` | `StableValueHash.stableHash` | `move-to-new-namespace` | `FN4-identity` |
| `utils/math/AngleMath.js` | `inDegrees` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.inDegrees` | `retain` | `FN0-retain-namespace` |
| `utils/math/AngleMath.js` | `inRadians` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.inRadians` | `retain` | `FN0-retain-namespace` |
| `utils/math/AngleMath.js` | `toRadians` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.toRadians` | `retain` | `FN0-retain-namespace` |
| `utils/math/AngleMath.js` | `toDegrees` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.toDegrees` | `retain` | `FN0-retain-namespace` |
| `utils/math/AngleMath.js` | `add` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.add` | `retain` | `FN0-retain-namespace` |
| `utils/math/AngleMath.js` | `subtract` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.subtract` | `retain` | `FN0-retain-namespace` |
| `utils/math/AngleMath.js` | `scale` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.scale` | `retain` | `FN0-retain-namespace` |
| `utils/math/AngleMath.js` | `assertAngle` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.assertAngle` | `retain` | `FN0-retain-namespace` |
| `utils/math/AngleMath.js` | `wrap` | `module-local-function` | `class-independent` | `utils/math/ScalarMath.js` | `ScalarMath.wrap` | `move-to-existing-namespace` | `FN2-shared-math` |
| `utils/math/AngleMath.js` | `wrapRadians` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.wrapRadians` | `retain` | `FN0-retain-namespace` |
| `utils/math/AngleMath.js` | `wrapDegrees` | `namespace-method` | `class-independent` | `utils/math/AngleMath.js` | `AngleMath.wrapDegrees` | `retain` | `FN0-retain-namespace` |
| `utils/math/ArrayMath.js` | `zeros` | `namespace-method` | `class-independent` | `utils/math/ArrayMath.js` | `ArrayMath.zeros` | `retain` | `FN0-retain-namespace` |
| `utils/math/ArrayMath.js` | `fill` | `namespace-method` | `class-independent` | `utils/math/ArrayMath.js` | `ArrayMath.fill` | `retain` | `FN0-retain-namespace` |
| `utils/math/ArrayMath.js` | `add` | `namespace-method` | `class-independent` | `utils/math/ArrayMath.js` | `ArrayMath.add` | `retain` | `FN0-retain-namespace` |
| `utils/math/ArrayMath.js` | `multiply` | `namespace-method` | `class-independent` | `utils/math/ArrayMath.js` | `ArrayMath.multiply` | `retain` | `FN0-retain-namespace` |
| `utils/math/ArrayMath.js` | `mean` | `namespace-method` | `class-independent` | `utils/math/ArrayMath.js` | `ArrayMath.mean` | `retain` | `FN0-retain-namespace` |
| `utils/math/ArrayMath.js` | `weightedSum` | `namespace-method` | `class-independent` | `utils/math/ArrayMath.js` | `ArrayMath.weightedSum` | `retain` | `FN0-retain-namespace` |
| `utils/math/ArrayMath.js` | `map` | `namespace-method` | `class-independent` | `utils/math/ArrayMath.js` | `ArrayMath.map` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `inKilometers` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.inKilometers` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `inMeters` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.inMeters` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `toMeters` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.toMeters` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `toKilometers` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.toKilometers` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `add` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.add` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `subtract` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.subtract` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `scale` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.scale` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `assertDistance` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.assertDistance` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `assertDistanceSeries` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.assertDistanceSeries` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `assertPosition` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.assertPosition` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `toMetersSeries` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.toMetersSeries` | `retain` | `FN0-retain-namespace` |
| `utils/math/DistanceMath.js` | `toMetersPosition` | `namespace-method` | `class-independent` | `utils/math/DistanceMath.js` | `DistanceMath.toMetersPosition` | `retain` | `FN0-retain-namespace` |
| `utils/math/pixel-math.js` | `assertPositivePixelCount` | `module-local-function` | `class-independent` | `utils/math/PixelMath.js` | `PixelMath.assertPositivePixelCount` | `move-to-new-namespace` | `FC6-pixel-values` |
| `utils/math/pixel-math.js` | `acceptPixelSize` | `exported-function` | `class-independent` | `utils/math/PixelMath.js` | `PixelMath.acceptPixelSize` | `move-to-new-namespace` | `FC6-pixel-values` |
| `utils/math/pixel-math.js` | `createPixelSize` | `exported-function` | `class-independent` | `utils/math/PixelMath.js` | `PixelMath.createPixelSize (callable form deferred)` | `defer-construction-form-to-4.5.5` | `FC6-pixel-values` |
| `utils/math/pixel-math.js` | `pixelSizeToShaderValue` | `exported-function` | `class-independent` | `utils/math/PixelMath.js` | `PixelMath.pixelSizeToShaderValue` | `move-to-new-namespace` | `FC6-pixel-values` |
| `utils/math/pixel-math.js` | `acceptPixelDistance` | `exported-function` | `class-independent` | `utils/math/PixelMath.js` | `PixelMath.acceptPixelDistance` | `move-to-new-namespace` | `FC6-pixel-values` |
| `utils/math/pixel-math.js` | `createPixelDistance` | `exported-function` | `class-independent` | `utils/math/PixelMath.js` | `PixelMath.createPixelDistance (callable form deferred)` | `defer-construction-form-to-4.5.5` | `FC6-pixel-values` |
| `utils/math/SampleMath.js` | `nearestSampleIndex` | `namespace-method` | `class-independent` | `utils/math/SampleMath.js` | `SampleMath.nearestSampleIndex` | `retain` | `FN0-retain-namespace` |
| `utils/math/SampleMath.js` | `padSamples` | `namespace-method` | `class-independent` | `utils/math/SampleMath.js` | `SampleMath.padSamples` | `retain` | `FN0-retain-namespace` |
| `utils/math/SampleMath.js` | `isMonotonic` | `namespace-method` | `class-independent` | `utils/math/SampleMath.js` | `SampleMath.isMonotonic` | `retain` | `FN0-retain-namespace` |
| `utils/math/SampleMath.js` | `walkSamples` | `namespace-method` | `class-independent` | `utils/math/SampleMath.js` | `SampleMath.walkSamples` | `retain` | `FN0-retain-namespace` |
| `utils/math/SampleMath.js` | `sampleSignature` | `namespace-method` | `class-independent` | `utils/math/SampleMath.js` | `SampleMath.sampleSignature` | `retain` | `FN0-retain-namespace` |
| `utils/math/ScalarMath.js` | `isFiniteNumber` | `namespace-method` | `class-independent` | `utils/math/ScalarMath.js` | `ScalarMath.isFiniteNumber` | `retain` | `FN0-retain-namespace` |
| `utils/math/ScalarMath.js` | `clamp` | `namespace-method` | `class-independent` | `utils/math/ScalarMath.js` | `ScalarMath.clamp` | `retain` | `FN0-retain-namespace` |
| `utils/math/ScalarMath.js` | `inRange` | `namespace-method` | `class-independent` | `utils/math/ScalarMath.js` | `ScalarMath.inRange` | `retain` | `FN0-retain-namespace` |
| `utils/math/ScalarMath.js` | `nearlyEqual` | `namespace-method` | `class-independent` | `utils/math/ScalarMath.js` | `ScalarMath.nearlyEqual` | `retain` | `FN0-retain-namespace` |
| `utils/math/ScalarMath.js` | `lerp` | `namespace-method` | `class-independent` | `utils/math/ScalarMath.js` | `ScalarMath.lerp` | `retain` | `FN0-retain-namespace` |
| `utils/math/ScalarMath.js` | `formatNumber` | `namespace-method` | `class-independent` | `utils/math/ScalarMath.js` | `ScalarMath.formatNumber` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `inSceneUnits` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.inSceneUnits` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `positionInSceneUnits` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.positionInSceneUnits` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `scaleInMetersPerSceneUnit` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.scaleInMetersPerSceneUnit` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `assertSceneDistance` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.assertSceneDistance` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `assertScenePosition` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.assertScenePosition` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `assertSceneScale` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.assertSceneScale` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `toMeters` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.toMeters` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `toMetersPosition` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.toMetersPosition` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `toSceneUnits` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.toSceneUnits` | `retain` | `FN0-retain-namespace` |
| `utils/math/SceneMath.js` | `toScenePosition` | `namespace-method` | `class-independent` | `utils/math/SceneMath.js` | `SceneMath.toScenePosition` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `filled` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.filled` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `zero` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.zero` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `ones` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.ones` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `add` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.add` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `subtract` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.subtract` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `scale` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.scale` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `addScaled` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.addScaled` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `dot` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.dot` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `cross` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.cross` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `length` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.length` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `distance` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.distance` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `normalize` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.normalize` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `isFiniteVector` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.isFiniteVector` | `retain` | `FN0-retain-namespace` |
| `utils/math/VectorMath.js` | `isNormalized` | `namespace-method` | `class-independent` | `utils/math/VectorMath.js` | `VectorMath.isNormalized` | `retain` | `FN0-retain-namespace` |
| `utils/math/WavelengthMath.js` | `inMicrometers` | `namespace-method` | `class-independent` | `utils/math/WavelengthMath.js` | `WavelengthMath.inMicrometers` | `retain` | `FN0-retain-namespace` |
| `utils/math/WavelengthMath.js` | `inNanometers` | `namespace-method` | `class-independent` | `utils/math/WavelengthMath.js` | `WavelengthMath.inNanometers` | `retain` | `FN0-retain-namespace` |
| `utils/math/WavelengthMath.js` | `toNanometers` | `namespace-method` | `class-independent` | `utils/math/WavelengthMath.js` | `WavelengthMath.toNanometers` | `retain` | `FN0-retain-namespace` |
| `utils/math/WavelengthMath.js` | `toMicrometers` | `namespace-method` | `class-independent` | `utils/math/WavelengthMath.js` | `WavelengthMath.toMicrometers` | `retain` | `FN0-retain-namespace` |
| `utils/math/WavelengthMath.js` | `add` | `namespace-method` | `class-independent` | `utils/math/WavelengthMath.js` | `WavelengthMath.add` | `retain` | `FN0-retain-namespace` |
| `utils/math/WavelengthMath.js` | `subtract` | `namespace-method` | `class-independent` | `utils/math/WavelengthMath.js` | `WavelengthMath.subtract` | `retain` | `FN0-retain-namespace` |
| `utils/math/WavelengthMath.js` | `scale` | `namespace-method` | `class-independent` | `utils/math/WavelengthMath.js` | `WavelengthMath.scale` | `retain` | `FN0-retain-namespace` |
| `utils/math/WavelengthMath.js` | `assertWavelength` | `namespace-method` | `class-independent` | `utils/math/WavelengthMath.js` | `WavelengthMath.assertWavelength` | `retain` | `FN0-retain-namespace` |
| `utils/time/duration-values.js` | `durationInSeconds` | `exported-function` | `class-independent` | `utils/time/TimeMath.js` | `TimeMath.durationInSeconds` | `move-to-new-namespace` | `FN3-time` |
| `utils/time/duration-values.js` | `durationFromMilliseconds` | `exported-function` | `class-independent` | `utils/time/TimeMath.js` | `TimeMath.durationFromMilliseconds` | `move-to-new-namespace` | `FN3-time` |
| `utils/time/duration-values.js` | `durationFromNanoseconds` | `exported-function` | `class-independent` | `utils/time/TimeMath.js` | `TimeMath.durationFromNanoseconds` | `move-to-new-namespace` | `FN3-time` |
| `utils/validation/value-assertions.js` | `isTypedArray` | `exported-function` | `class-independent` | `utils/validation/ValueValidation.js` | `ValueValidation.isTypedArray` | `move-to-new-namespace` | `FN1-validation` |
| `utils/validation/value-assertions.js` | `finiteNumberOrDefault` | `exported-function` | `class-independent` | `utils/validation/ValueValidation.js` | `ValueValidation.finiteNumberOrDefault` | `move-to-new-namespace` | `FN1-validation` |
| `utils/validation/value-assertions.js` | `requiredString` | `exported-function` | `class-independent` | `utils/validation/ValueValidation.js` | `ValueValidation.requiredString` | `move-to-new-namespace` | `FN1-validation` |
| `utils/validation/value-assertions.js` | `positiveInteger` | `exported-function` | `class-independent` | `utils/validation/ValueValidation.js` | `ValueValidation.positiveInteger` | `move-to-new-namespace` | `FN1-validation` |

## Namespace Owners

| Final namespace | Foundation identities | Final methods | Boundary and dependency rule |
| --- | ---: | ---: | --- |
| `utils/validation/ValueValidation.js` / `ValueValidation` | 4 | 4 | General structural/scalar validation. It is a leaf and may also receive the physical partition's exact general defaulting methods; domain-specific request normalization stays outside. |
| `utils/math/ScalarMath.js` / `ScalarMath` | 2 moved, 6 retained | 7 after deduplication | Reuse `clamp`; add `wrap`. Clamp replacement is valid only for the recorded ordered finite bounds. |
| `utils/math/VectorMath.js` / `VectorMath` | 1 moved, 14 retained | 14 after deduplication | Reuse existing `dot` for the current canonical three-vector calls. |
| `utils/math/ArrayMath.js` / `ArrayMath` | 2 moved, 7 retained | 8 after deduplication | Add one `multiplyToFloat64` method retaining left-length `Float64Array.from` allocation and evaluation. |
| `utils/math/DistanceMath.js` / `DistanceMath` | 2 moved, 12 retained | 13 after deduplication | Add one `positionAlongRay` method with explicit meter normalization and three component expressions. |
| `utils/math/PixelMath.js` / `PixelMath` | 6 foundation; 9 cross-partition | 9 | Pixel-size/distance acceptance, construction, assertion, defaults, viewport-count normalization, and shader conversion. Physical `sizeOrDefault`/`distanceOrDefault` and runtime `viewportCountOrDefault` join this owner atomically. |
| `utils/time/TimeMath.js` / `TimeMath` | 3 | 3 | Duration conversions; the runtime partition's two duplicate `nowMilliseconds` rows coalesce into the same owner, producing a cohesive four-method time namespace. |
| `utils/identity/CanonicalValueHash.js` / `CanonicalValueHash` | 3 | 3 | Canonical value serialization and synchronous browser-safe SHA-256; depends only on `ValueValidation.isTypedArray`. |
| `utils/identity/StableValueHash.js` / `StableValueHash` | 3 | 3 | Cycle-aware stable serialization and FNV-1a identity. It stays separate from physical/canonical content identity. |
| `quantities/units/UnitMath.js` / `UnitMath` | 8 | 8 | Unit-family metadata plus structural value creation, validation, copying, conversion, and normalization. `consts.js -> UnitMath -> ValueValidation`; `UnitMath` must not import `consts.js`. |
| `quantities/spectral/SpectralMath.js` / `SpectralMath` | 12 | 12 | Packet arithmetic, mapping, result interpretation, and provenance after the class-owned basis/packet boundaries settle. |
| `transport/ScatteringOrderFieldOperations.js` / `ScatteringOrderFieldOperations` | 7 | 6 | Field lifecycle, rollback, next-order build, and accumulation; the two exact `zeroMutableField` rows collapse into one method. |

The eight pre-existing math namespaces remain sole-symbol modules. No new
single-function namespace or speculative barrel is planned.
Each namespace description is a noun phrase that states the method-set it
represents. Each namespace method and moved class method keeps an
action-oriented callable description with complete parameter and return tags;
property, constant, type, class, and interface descriptions remain
noun-oriented.

## Ordinary-Module Exceptions

| Final ordinary owner | Identities | Why a namespace would misstate the contract |
| --- | --- | --- |
| `transport/later-order-scattering-density.js` | 4 total: 2 `retain-ordinary`, 2 construction-form deferrals | One exported closure-producing physical-recurrence transaction owns the three private stages. Step 4.5.5 decides whether that reusable orchestration factory survives; its support stays atomic with it in `FC5-later-order-kernel`. |
| `transport/scattering-density-transport.js` | 3 retained ordinary rows after shared math/rollback extraction | One exported ordered path-integration algorithm owns private sampling and integration stages. A namespace would either expose implementation sequencing or create a one-method public namespace. |

These are the only foundation ordinary-module exceptions. Their numerical
order, callback/closure lifecycle, cleanup timing, and error timing remain
part of their ordinary callable contracts.

## Multi-Export And Mixed-Module Resolution

| Current module | Exact split or retirement |
| --- | --- |
| `cubed-sphere-w27-direction-domain.js` | Factory and stencil callable forms wait for Step 4.5.5; flatten/unflatten collapse onto existing `CubedSphereDirectionDomain` instance methods. Retire the wrapper module atomically in `FC7-cubed-w27` if the construction decision permits. |
| `spectral-bases.js` plus `spectral-basis-contract.js` | Construction form waits; assertion/compatibility become public `SpectralBasis` statics and channel normalization plus fixed-tolerance comparison become private instance methods. Move `SPECTRAL_SAMPLE_SEMANTICS`, `SPECTRAL_BASIS_SCHEMA_REVISION`, and the canonical channel-unit constant to `quantities/spectral/consts.js`, then retire both ordinary helper modules. |
| `spectral-packets.js` plus `spectral-packet-contract.js` | Construction form waits; assertion/compatibility and public unit normalization become public `SpectralPacket` statics; quantity, quantity-unit, and value normalization become private instance methods. Consumers import `SPECTRAL_QUANTITIES` and `SPECTRAL_UNITS` directly from `consts.js`; retire both ordinary helper modules rather than retain a re-export seam. |
| `spectral-math.js` | All five local helpers and seven exports become methods of `SpectralMath`; the ordinary file and individual named re-exports retire. |
| `unit-values.js` plus `consts.js:family` | All eight identities converge on `UnitMath`; `UNIT_FAMILIES` remains in `consts.js` and imports `UnitMath.family`. |
| `later-order-scattering-density.js` | Remains one ordinary factory/algorithm transaction pending `FC5`; no helper is split ahead of the callable-form decision. |
| `scattering-density-transport.js` | `multiply` and `positionAlongRay` move to existing math namespaces, rollback moves to field operations, and the ordered sampling/integration algorithm remains ordinary. |
| `scattering-order-field-operations.js` | Converts atomically to `ScatteringOrderFieldOperations`; nested revocable-writer closure functions travel intact and are not separate rows. |
| `value-hashes.js` | Canonical serialization/SHA and stable serialization/FNV split into two namespaces; the old default `stableHash` alias retires with no compatibility export. |
| `pixel-math.js` | Converts atomically to `PixelMath`; its two construction callables wait for Step 4.5.5 with their accept/assert support. |
| `duration-values.js` | Its three exports become `TimeMath` methods alongside the runtime partition's coalesced clock method. |
| `value-assertions.js` | Its four exports become `ValueValidation` methods; physical general validation additions join directly, not through aliases. |

## Target Collisions

| Target | Source identities | Resolution |
| --- | --- | --- |
| `CubedSphereDirectionDomain.flattenNodeIndex` | W27 flatten wrapper plus the retained class method | Delete the wrapper and update callers to the existing instance owner; do not duplicate the method. |
| `CubedSphereDirectionDomain.unflattenNodeIndex` | W27 unflatten wrapper plus the existing public instance method | Reuse the existing class method. |
| `CubedSphereDirectionDomain.resolveStencil` | W27 stencil wrapper plus the existing public instance method | Step 4.5.5 decides callable exposure; the implementation remains the existing class method. |
| `VectorMath.dot` | `CubedSphereDirectionDomain._dot` plus retained namespace method | Reuse the existing method; gate canonical three-vector output and signed-zero-insensitive current behavior. |
| `ScalarMath.clamp` | `CubedSphereDirectionDomain._clamp` plus retained namespace method | Reuse only under current ordered finite bounds; physical equivalent clamps may share the same target under that precondition. |
| `ArrayMath.multiplyToFloat64` | Calculator `_multiplySpectralValues` plus transport `multiply` | One method retains their identical `Float64Array.from` body. |
| `DistanceMath.positionAlongRay` | Calculator `_addScaled` plus transport `positionAlongRay` | One method retains meter normalization, component order, returned coordinate copy, and `meters` units. |
| `ScatteringOrderFieldOperations.zeroMutableField` | Both transport `zeroMutableField` locals | One method retains identical loops, writer calls, and rollback timing. |
| `SpectralBasis._nearlyEqual` versus `ScalarMath.nearlyEqual` | Similar names, different contracts | No collision: the fixed 32-ULP scaled bin-boundary rule remains private to `SpectralBasis`. |
| `CanonicalValueHash` versus `StableValueHash` | Former mixed hash module | No collision: algorithm, serialization, error, and identity semantics remain separate. |

## Immediate Step 4.5.4 Transactions

| Order / batch | Moves | Consumer and import groups | Declarations and JSDoc | Dependency direction and focused gate |
| --- | --- | --- | --- | --- |
| 1 / `FN1-validation` | Four value assertions to `ValueValidation` | Quantity/unit/spectral ingress; geometry and Three adapters; light-source request values; profiles; ground/color; direct validation specs. Replace named imports with the namespace object and remove the old path/export. | Preserve predicate narrowing, defaults, labels, exception classes, and method-oriented JSDoc. No new ambient value type; physical additions keep their owning parameter contracts. | Leaf namespace. Run `value-assertions.spec.js`, directly affected quantity/profile/request specs, both type checks, formatter, old-export/path, cycle, and diff gates. |
| 2 / `FN2-shared-math` | Dot/clamp reuse; one Float64 multiply; one unit-bearing ray-position method; scalar wrap | `CubedSphereDirectionDomain`, `SpectralCalculator`, `scattering-density-transport.js`, and `AngleMath`; coordinate with physical equivalent clamps. | Update `utils/math/types.d.ts` only if a callable contract is declared there. Preserve exact array allocation, three-coordinate order, units, bounds, and diagnostics in JSDoc. | Class/domain/transport owners depend on math, never conversely. Run `utils.spec.js`, both cubed-sphere specs, `SpectralCalculator.spec.js`, `scattering-density-transport.spec.js`, Flat32 type check, equivalence snapshots, imports/cycles, and diff. |
| 3 / `FN3-time` | Three duration functions to `TimeMath`; accept runtime's coalesced `nowMilliseconds` | `FlatSynchronizer`, `CacheGpuExecutor`, `ShaderPassPerformanceTimer`, runtime timing helpers, and their specs. | Existing `Duration` contract remains in `quantities/units/types.d.ts`; move callable JSDoc and retain unit/conversion order. | Time namespace is a leaf. Run flat-synchronizer, cache-executor, shader-pass-timer specs, both type checks, old-path/export, cycle, and diff gates. |
| 4 / `FN4-identity` | Split six hash identities into canonical and stable namespaces | Spectral classes/math; GPU cache values; distant/local reuse keys and CPU builds; cache-build contracts; cache/runtime assemblers; identity specs. Remove named/default old imports together. | No new ambient type. Preserve canonical/stable supported-value sets, signed zero, typed arrays, cycle errors, SHA/FNV prefixes, and algorithm-oriented JSDoc. | Both namespaces depend only on leaves; no cache/quantity/assembler reverse edge. Run `value-hashes.spec.js`, cache identity/reuse specs, assembler specs, exact hash snapshots, default-alias scan, imports/cycles, and diff. |

## Step 4.5.5-Gated Atomic Transactions

A construction candidate does not move by itself in Step 4.5.4. Step 4.5.5
first records whether its callable survives, becomes a class/namespace method,
or is removed in favor of direct construction. Then the complete `FC*`
transaction below executes atomically, including inseparable support and
consumer updates. No temporary wrapper, compatibility export, or single-
function holding module is permitted.

| Order / batch | Atomic owner transaction | Consumer and import groups | Declarations and JSDoc | Dependency direction and focused gate |
| --- | --- | --- | --- | --- |
| 1 / `FC1-unit-values` | Build `UnitMath` from eight identities; decide `createUnitValue`; keep conversion table with the namespace and `UNIT_FAMILIES` in `consts.js`. | Quantities barrel, native profile, spectral basis/calculator, Bruneton color, both source Three adapters, unit specs. | Preserve `quantities/units/types.d.ts`; move all callable JSDoc and exact shape/unit diagnostics. | After `FN1`. Enforce `consts.js -> UnitMath -> ValueValidation` with no reverse edge. Run unit, profile, color, adapter, and spectral acceptance specs plus type/format/import/cycle/diff gates. |
| 2 / `FC2-spectral-basis` | Return five identities to `SpectralBasis`; decide its construction callable; move the schema, sample-semantics, and canonical channel-unit constants into `quantities/spectral/consts.js`; retire both ordinary basis helper modules. | Quantities barrel; CanonicalAtmosphere; ground; distant primary scattering; packet/model consumers; basis and downstream specs. | Update public static and private instance JSDoc plus `quantities/spectral/types.d.ts` only for affected ambient contracts. Give each moved constant a noun-oriented value description. Preserve channel ordering, unit normalization, fixed tolerance, diagnostics, content hash, and identity. | After `FN4` and `FC1`. Run `SpectralBasis.spec.js`, atmosphere/ground/model consumers, exact boundary/error/hash snapshots, retired-file/export, type/format/import/cycle/diff gates. |
| 3 / `FC3-spectral-packet` | Return seven identities to `SpectralPacket`; decide its construction callable; retire both ordinary packet helper modules and point constant consumers directly at `quantities/spectral/consts.js`. | Quantities barrel; atmosphere, ground, color, profile, source caches, models, rendering/reference, calculator; packet specs. | Public static `assert`, `assertCompatible`, `normalizeUnits`; private instance quantity/value support. Preserve `quantities/spectral/types.d.ts`, packet identity, basis checks, errors, and JSDoc. | After `FC2`. Run spectral-packet, ground/color/profile/cache/model/calculator specs and exact quantity/unit/hash snapshots plus retired-file/export and standard gates. |
| 4 / `FN5-spectral-math` | Convert all twelve spectral-math rows to `SpectralMath` after class boundaries settle. | Quantities barrel; LocalSun light/construction source; GPU contribution coverage; packet/math tests. | Existing spectral operation/result/provenance types remain in `quantities/spectral/types.d.ts`; move complete method JSDoc. | After `FC2`, `FC3`, and `FN4`. Run spectral-packet math, LocalSun, GPU contribution, calculator, provenance/hash/error snapshots, and standard gates. |
| 5 / `FC4-field-operations` | Convert field operations to one namespace, merge both rollback helpers, and decide revocable-writer/next-order construction forms with their support intact. | Distant/local CPU cache builds; retained scattering transport rollback import; field-operation and cache specs. | Preserve field/kernel/writer contracts in `light-sources/shared/cache/types.d.ts` and transport JSDoc; nested writer closure methods remain nested. | After `FN2`. Namespace may depend on field protocols/math, never source owners. Run field-operation, scattering-density, both source CPU build/cache specs, rollback/error-order snapshots, and standard gates. |
| 6 / `FC5-later-order-kernel` | Decide the ordinary kernel factory/build form with all three private recurrence stages in one transaction. | Distant/local later-order source adapters and their cache builders; transport declaration and focused source specs. | Update `transport/later-order-scattering-density.d.ts` only if the retained callable shape changes; preserve callback order, closure capture, physical units, and JSDoc. | After field/class prerequisites. Run distant later-order, local CPU cache, scattering-density transport, order/provenance snapshots, and standard gates. |
| 7 / `FC6-pixel-values` | Convert the six foundation rows, two physical defaulting rows, and runtime viewport-count row to the complete nine-method `PixelMath`; decide size/distance construction forms together with acceptance/assertion support. | React/R3F adapter, shared light-source request values, ShaderBuilder, scene capture, runtime pass/installer, and pixel specs. The dependent two-method `Algorithm32R3FValues` transaction follows without an interim one-method owner. | Preserve pixel contracts in `quantities/units/types.d.ts`, exact key checks, exception classes, undefined-to-one viewport default, flooring, units, and method JSDoc. | After `FN1` and `PH-03`. Run pixel, React utility, light-source request, ShaderBuilder, scene/runtime-pass specs, Flat32 type/UI checks, and standard gates. |
| 8 / `FC7-cubed-w27` | Collapse W27 wrappers onto the existing class and decide domain/stencil callable forms; retire wrapper exports atomically. | Domains barrel; flat/spherical cache geometry; cubed specs; spherical geometry, distant cache, and transport specs. | Preserve cubed types in `domains/direction/cubed-sphere/types.d.ts`, public instance JSDoc, addressing diagnostics, tie order, weights, and binary64 identity. | After `FN2`. Run both cubed specs and every stencil consumer, exact vector/address/stencil/hash snapshots, Flat32 type check, and standard gates. |
| 9 / `FC8-native-48` | Decide Native-48 construction form on `SphericalNativePositionDomain` and retire the wrapper if direct construction wins. | Domains barrel and both spherical-native specs. | Preserve spherical-native types, option validation, exact node formula/order, ids, and constructor JSDoc. | Independent after validation leaves. Run both spherical-native specs, exact node/id snapshots, and standard gates. |

## Closure And Ambiguities

- Authoritative classification identities: 193.
- Planned identities: 193 unique `current path + symbol + role` keys.
- Missing, duplicate, or extra identities: 0.
- `retain`: 116.
- `move-to-class`: 12.
- `move-to-existing-namespace`: 7.
- `move-to-new-namespace`: 41.
- `retain-ordinary`: 5.
- `defer-construction-form-to-4.5.5`: 12.
- Final new namespace owners: 8, containing 46 foundation identities and
  45 methods after the rollback collision merge.
- Existing namespace targets: `ScalarMath`, `VectorMath`, `ArrayMath`,
  and `DistanceMath`; 7 moved identities resolve to 5 methods.
- Ordinary exceptions: 2 modules and 7 identities when their 2 deferred
  construction rows are included.
- Genuine target ambiguities: none. Callable retention/removal for the twelve
  tagged construction candidates is deliberately a Step 4.5.5 decision, not
  an unresolved Step 4.5.3 owner ambiguity.
