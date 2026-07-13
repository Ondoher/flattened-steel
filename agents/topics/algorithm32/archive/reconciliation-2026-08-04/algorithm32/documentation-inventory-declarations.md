# Algorithm32 Documentation Inventory: Ambient Declarations

Status: generated Step 6.3 closure appendix for the settled source identity
`sha256:7d7810f7b69b7516bfdd25058360d62cd4b586176d7692ca90fd5655f1398832`. The canonical scope, schema, counts, and
completion decision are owned by the
[Algorithm32 documentation inventory](./documentation-inventory.md).

This appendix covers **3059** documentable rows in **81** files.
Line numbers belong to the recorded source identity. `Current documentation`
records the detected description form and a bounded excerpt; it does not
records the completed Step 6 description form. `Contract inventory` records
the completed tag and special-case evidence.

## `src/algorithm32/adapters/react/types.d.ts`

Source: [src/algorithm32/adapters/react/types.d.ts](../../../../../../src/algorithm32/adapters/react/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `Algorithm32BindingValues` | `<module>` | descriptive-other: Mutable shader binding values owned by the Algorithm32 host adapter. | entity/value | none |
| 5 | type | `Algorithm32BindingsMatrix4` | `<module>` | descriptive-other: Matrix operations required by the Algorithm32 camera-binding adapter. | entity/value | none |
| 11 | method | `copy` | `Algorithm32BindingsMatrix4` | call-this-method: Call this method to copy one camera matrix into the mutable binding matrix. | active-callable | params 1/1; returns tagged |
| 15 | type | `Algorithm32BindingsVector3` | `<module>` | descriptive-other: Vector operations required by the Algorithm32 camera-binding adapter. | entity/value | none |
| 17 | property | `x` | `Algorithm32BindingsVector3` | descriptive-other: World or model-space x coordinate. | entity/value | none |
| 19 | property | `y` | `Algorithm32BindingsVector3` | descriptive-other: World or model-space y coordinate. | entity/value | none |
| 21 | property | `z` | `Algorithm32BindingsVector3` | descriptive-other: World or model-space z coordinate. | entity/value | none |
| 26 | method | `clone` | `Algorithm32BindingsVector3` | call-this-method: Call this method to create an independent vector with the same coordinates. | active-callable | returns tagged |
| 34 | method | `set` | `Algorithm32BindingsVector3` | call-this-method: Call this method to replace all three mutable coordinates. | active-callable | params 3/3; returns tagged |
| 38 | type | `Algorithm32BindingsThreeNamespace` | `<module>` | descriptive-other: Three constructor surface required by Algorithm32 camera-binding creation. | entity/value | none |
| 40 | property | `Matrix4` | `Algorithm32BindingsThreeNamespace` | descriptive-other: Matrix constructor used for mutable camera bindings. | entity/value | none |
| 42 | property | `Vector3` | `Algorithm32BindingsThreeNamespace` | descriptive-other: Vector constructor used for mutable camera bindings. | entity/value | none |
| 46 | type | `Algorithm32BindingsCamera` | `<module>` | descriptive-other: Live camera surface required by one Algorithm32 binding update. | entity/value | none |
| 48 | property | `projectionMatrixInverse` | `Algorithm32BindingsCamera` | descriptive-other: Inverse camera projection matrix. | entity/value | none |
| 50 | property | `matrixWorld` | `Algorithm32BindingsCamera` | descriptive-other: Camera world matrix. | entity/value | none |
| 52 | property | `position` | `Algorithm32BindingsCamera` | descriptive-other: Mutable camera-local position. | entity/value | none |
| 54 | method | `updateProjectionMatrix` | `Algorithm32BindingsCamera` | call-this-method: Call this method to update the camera projection matrix. | active-callable | none |
| 56 | method | `updateMatrixWorld` | `Algorithm32BindingsCamera` | call-this-method: Call this method to update the camera world matrix. | active-callable | none |
| 62 | method | `getWorldPosition` | `Algorithm32BindingsCamera` | call-this-method: Call this method to write the current world position into a target vector. | active-callable | params 1/1; returns tagged |
| 66 | type | `Algorithm32BindingsUpdateRequest` | `<module>` | descriptive-other: Live camera and configuration state for one binding update. | entity/value | none |
| 68 | property | `bindingValues` | `Algorithm32BindingsUpdateRequest` | descriptive-other: Mutable shader binding values. | entity/value | none |
| 70 | property | `camera` | `Algorithm32BindingsUpdateRequest` | descriptive-other: Active Three camera. | entity/value | none |
| 72 | property | `props` | `Algorithm32BindingsUpdateRequest` | descriptive-other: Geometry configuration and scene scale. | entity/value | none |
| 74 | property | `config` | `Algorithm32BindingsUpdateRequest` | descriptive-other: Active Algorithm32 configuration. | entity/value | none |
| 76 | property | `sceneScale` | `Algorithm32BindingsUpdateRequest` | descriptive-other: Renderer scene-to-physical scale. | entity/value | none |
| 81 | type | `Algorithm32ThreeResourcesRequest` | `<module>` | descriptive-other: Adapter context for geometry- and light-source-owned Three resources. | entity/value | none |
| 83 | property | `config` | `Algorithm32ThreeResourcesRequest` | descriptive-other: Optional Algorithm32 configuration. | entity/value | none |
| 85 | property | `THREE` | `Algorithm32ThreeResourcesRequest` | descriptive-other: Optional Three namespace. | entity/value | none |
| 87 | property | `sceneScale` | `Algorithm32ThreeResourcesRequest` | descriptive-other: Optional renderer scene-to-physical scale. | entity/value | none |
| 89 | property | `geometryEndpointRequest` | `Algorithm32ThreeResourcesRequest` | descriptive-other: Optional geometry endpoint request or request factory. | entity/value | none |
| 91 | property | `lightingRequest` | `Algorithm32ThreeResourcesRequest` | descriptive-other: Optional lighting request or request factory. | entity/value | none |
| 95 | type | `Algorithm32ThreeOwnerRequest` | `<module>` | descriptive-other: Resolved owner-specific fields supplied to a geometry or lighting request. | entity/value | none |
| 98 | type | `Algorithm32SceneInputObject` | `<module>` | descriptive-other: Scene object carrying optional Algorithm32 scene-input metadata. | entity/value | none |
| 100 | property | `userData` | `Algorithm32SceneInputObject` | descriptive-other: Mutable owner metadata. | entity/value | none |
| 104 | type | `Algorithm32RequiredThreeObjectsMetadata` | `<module>` | descriptive-other: Geometry and lighting metadata for one required-object packet. | entity/value | none |
| 106 | property | `geometry` | `Algorithm32RequiredThreeObjectsMetadata` | descriptive-other: Geometry-owner metadata. | entity/value | none |
| 108 | property | `lighting` | `Algorithm32RequiredThreeObjectsMetadata` | descriptive-other: Light-source-owner metadata. | entity/value | none |
| 112 | type | `Algorithm32RequiredThreeObjects` | `<module>` | descriptive-other: Geometry- and light-source-owned Three objects required by Algorithm32. | entity/value | none |
| 114 | property | `objects` | `Algorithm32RequiredThreeObjects` | descriptive-other: Combined scene objects in deterministic owner order. | entity/value | none |
| 116 | property | `endpointObjects` | `Algorithm32RequiredThreeObjects` | descriptive-other: Geometry-owned endpoint objects, when available. | entity/value | none |
| 118 | property | `lightingObjects` | `Algorithm32RequiredThreeObjects` | descriptive-other: Light-source-owned lighting objects, when available. | entity/value | none |
| 120 | property | `metadata` | `Algorithm32RequiredThreeObjects` | descriptive-other: Owner metadata. | entity/value | none |
| 124 | type | `Algorithm32SceneColorTextureDataType` | `<module>` | descriptive-other: Numeric Three data-type identifier accepted by a scene-color texture. | entity/value | none |
| 128 | type | `Algorithm32SceneColorRenderTargetOptions` | `<module>` | descriptive-other: Texture configuration supplied to the scene-color render-target constructor. | entity/value | none |
| 130 | property | `minFilter` | `Algorithm32SceneColorRenderTargetOptions` | descriptive-other: Linear minification filter identifier. | entity/value | none |
| 132 | property | `magFilter` | `Algorithm32SceneColorRenderTargetOptions` | descriptive-other: Linear magnification filter identifier. | entity/value | none |
| 134 | property | `format` | `Algorithm32SceneColorRenderTargetOptions` | descriptive-other: RGBA pixel-format identifier. | entity/value | none |
| 136 | property | `type` | `Algorithm32SceneColorRenderTargetOptions` | descriptive-other: Selected texture data-type identifier. | entity/value | none |
| 138 | property | `depthBuffer` | `Algorithm32SceneColorRenderTargetOptions` | descriptive-other: Depth-buffer allocation state. | entity/value | none |
| 140 | property | `stencilBuffer` | `Algorithm32SceneColorRenderTargetOptions` | descriptive-other: Stencil-buffer allocation state. | entity/value | none |
| 144 | type | `Algorithm32SceneColorTexture` | `<module>` | descriptive-other: Mutable texture metadata exposed by an Algorithm32 scene-color target. | entity/value | none |
| 146 | property | `type` | `Algorithm32SceneColorTexture` | descriptive-other: Texture data-type identifier. | entity/value | none |
| 148 | property | `name` | `Algorithm32SceneColorTexture` | descriptive-other: Mutable diagnostic texture name. | entity/value | none |
| 150 | property | `colorSpace` | `Algorithm32SceneColorTexture` | descriptive-other: Mutable renderer color-space identifier. | entity/value | none |
| 154 | type | `Algorithm32SceneColorRenderTarget` | `<module>` | descriptive-other: Scene-color render target returned to the Algorithm32 host adapter. | entity/value | none |
| 156 | property | `width` | `Algorithm32SceneColorRenderTarget` | descriptive-other: Allocated pixel width. | entity/value | none |
| 158 | property | `height` | `Algorithm32SceneColorRenderTarget` | descriptive-other: Allocated pixel height. | entity/value | none |
| 160 | property | `texture` | `Algorithm32SceneColorRenderTarget` | descriptive-other: Target-owned scene-color texture. | entity/value | none |
| 166 | method | `setSize` | `Algorithm32SceneColorRenderTarget` | call-this-method: Call this method to replace the allocated target dimensions. | active-callable | params 2/2 |
| 168 | method | `dispose` | `Algorithm32SceneColorRenderTarget` | call-this-method: Call this method to release target-owned renderer resources. | active-callable | none |
| 172 | type | `Algorithm32SceneColorThreeNamespace` | `<module>` | descriptive-other: Three constants and constructor required by scene-color target construction. | entity/value | none |
| 174 | property | `UnsignedByteType` | `Algorithm32SceneColorThreeNamespace` | descriptive-other: Unsigned-byte texture data-type identifier. | entity/value | none |
| 176 | property | `LinearFilter` | `Algorithm32SceneColorThreeNamespace` | descriptive-other: Linear texture-filter identifier. | entity/value | none |
| 178 | property | `RGBAFormat` | `Algorithm32SceneColorThreeNamespace` | descriptive-other: RGBA pixel-format identifier. | entity/value | none |
| 180 | property | `WebGLRenderTarget` | `Algorithm32SceneColorThreeNamespace` | descriptive-other: Value that renders-target constructor used for scene-color allocation. | entity/value | none |
| 188 | type | `Algorithm32SceneColorRenderTargetRequest` | `<module>` | descriptive-other: Construction request for the default Algorithm32 scene-color render target. | entity/value | none |
| 190 | property | `THREE` | `Algorithm32SceneColorRenderTargetRequest` | descriptive-other: Three namespace used for target construction. | entity/value | none |
| 192 | property | `viewportSize` | `Algorithm32SceneColorRenderTargetRequest` | descriptive-other: Unit-bearing target size. | entity/value | none |
| 194 | property | `type` | `Algorithm32SceneColorRenderTargetRequest` | descriptive-other: Optional texture data type. | entity/value | none |
| 196 | property | `name` | `Algorithm32SceneColorRenderTargetRequest` | descriptive-other: Optional texture name. | entity/value | none |
| 198 | property | `colorSpace` | `Algorithm32SceneColorRenderTargetRequest` | descriptive-other: Optional texture color space. | entity/value | none |

## `src/algorithm32/adapters/react/types/Algorithm32AtmosphereComposer.d.ts`

Source: [src/algorithm32/adapters/react/types/Algorithm32AtmosphereComposer.d.ts](../../../../../../src/algorithm32/adapters/react/types/Algorithm32AtmosphereComposer.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `Algorithm32DefaultBindingValuesRequest` | `<module>` | descriptive-other: Renderer setup values used by the default composer binding-value constructor. | entity/value | none |
| 4 | property | `THREE` | `Algorithm32DefaultBindingValuesRequest` | descriptive-other: Three namespace used to construct mutable binding values. | entity/value | none |
| 6 | property | `props` | `Algorithm32DefaultBindingValuesRequest` | descriptive-other: Active composer properties required by binding-value construction. | entity/value | none |
| 8 | property | `sceneDepthMax` | `Algorithm32DefaultBindingValuesRequest` | descriptive-other: Optional geometry-owned scene-depth cap. | entity/value | none |
| 13 | type | `Algorithm32RequiredObjectsPacket` | `<module>` | descriptive-other: Required-object packet accepted from a default or caller-provided adapter constructor. | entity/value | none |
| 15 | property | `objects` | `Algorithm32RequiredObjectsPacket` | descriptive-other: Combined scene objects in deterministic owner order. | entity/value | none |

## `src/algorithm32/atmospheres/canonical/types.d.ts`

Source: [src/algorithm32/atmospheres/canonical/types.d.ts](../../../../../../src/algorithm32/atmospheres/canonical/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `CanonicalAtmosphereConfig` | `<module>` | descriptive-other: Type that configures the canonical Algorithm32 atmosphere profile. | entity/value | none |
| 4 | property | `constants` | `CanonicalAtmosphereConfig` | descriptive-other: Value that stores atmosphere constants. | entity/value | none |
| 7 | property | `spectralBasis` | `CanonicalAtmosphereConfig` | descriptive-other: Value that stores the wavelength basis used by atmosphere calculations. | entity/value | none |
| 11 | type | `CanonicalAtmosphereConstants` | `<module>` | descriptive-other: Type that stores constants for canonical atmosphere density, scattering, and phase. | entity/value | none |
| 13 | property | `bottomRadius` | `CanonicalAtmosphereConstants` | descriptive-other: Value that stores the spherical ground radius with its physical unit. | entity/value | none |
| 16 | property | `topRadius` | `CanonicalAtmosphereConstants` | descriptive-other: Value that stores the spherical top-of-atmosphere radius with its physical unit. | entity/value | none |
| 19 | property | `rayleighScaleHeight` | `CanonicalAtmosphereConstants` | descriptive-other: Value that stores Rayleigh scale height with its physical unit. | entity/value | none |
| 22 | property | `mieScaleHeight` | `CanonicalAtmosphereConstants` | descriptive-other: Value that stores Mie scale height with its physical unit. | entity/value | none |
| 25 | property | `rayleighCoefficientScale` | `CanonicalAtmosphereConstants` | descriptive-other: Value that stores Rayleigh beta coefficient scale with wavelength in micrometers. | entity/value | none |
| 28 | property | `mieAngstromAlpha` | `CanonicalAtmosphereConstants` | descriptive-other: Value that stores Angstrom aerosol alpha. | entity/value | none |
| 31 | property | `mieAngstromBeta` | `CanonicalAtmosphereConstants` | descriptive-other: Value that stores Angstrom aerosol beta. | entity/value | none |
| 34 | property | `mieSingleScatteringAlbedo` | `CanonicalAtmosphereConstants` | descriptive-other: Value that stores Mie single-scattering albedo. | entity/value | none |
| 37 | property | `miePhaseFunctionG` | `CanonicalAtmosphereConstants` | descriptive-other: Value that stores Mie phase asymmetry parameter. | entity/value | none |
| 40 | property | `ozoneAbsorptionEnabled` | `CanonicalAtmosphereConstants` | descriptive-other: Value that identifies whether ozone absorption participates in the selected profile. | entity/value | none |

## `src/algorithm32/atmospheres/canonical/types/CanonicalAtmosphere.d.ts`

Source: [src/algorithm32/atmospheres/canonical/types/CanonicalAtmosphere.d.ts](../../../../../../src/algorithm32/atmospheres/canonical/types/CanonicalAtmosphere.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `CacheBindingValue` | `<module>` | descriptive-other: Carry one supported cache-construction binding value. | entity/value | none |

## `src/algorithm32/atmospheres/types.d.ts`

Source: [src/algorithm32/atmospheres/types.d.ts](../../../../../../src/algorithm32/atmospheres/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | interface | `AtmosphereModel` | `<module>` | descriptive-other: Contract that provides configured Algorithm32 atmosphere-medium facts used by algorit... | entity/value | none |
| 4 | property | `id` | `AtmosphereModel` | descriptive-other: Value that identifies this configured atmosphere model instance for compatibility and... | entity/value | none |
| 7 | property | `spectralBasis` | `AtmosphereModel` | descriptive-other: Value that stores the validated wavelength basis shared by atmosphere outputs. | entity/value | none |
| 15 | method | `sampleMedium` | `AtmosphereModel` | call-this-method: Call this method to sample medium coefficients at one geometry-resolved atmosphere co... | active-callable | params 1/1; returns tagged |
| 23 | method | `integrateOpticalDepth` | `AtmosphereModel` | call-this-method: Call this method to integrate optical depth along one geometry-owned atmosphere path. | active-callable | params 1/1; returns tagged |
| 31 | method | `samplePhase` | `AtmosphereModel` | call-this-method: Call this method to sample Rayleigh and Mie phase facts for an incoming/outgoing dire... | active-callable | params 1/1; returns tagged |
| 39 | method | `createShaderContribution` | `AtmosphereModel` | call-this-method: Call this method to optionally contribute atmosphere-owned shader source, symbols, an... | active-callable | params 1/1; returns tagged |
| 42 | type | `ScatteringPhaseRequest` | `<module>` | descriptive-other: Incoming/outgoing direction pair for phase evaluation. | entity/value | none |
| 44 | property | `incomingDirection` | `ScatteringPhaseRequest` | descriptive-other: Value that stores the incoming physical direction. | entity/value | none |
| 46 | property | `viewDirection` | `ScatteringPhaseRequest` | descriptive-other: Value that stores the evaluated view direction. | entity/value | none |
| 49 | type | `AtmosphereSample` | `<module>` | descriptive-other: Medium coefficients sampled at one atmosphere coordinate. | entity/value | none |
| 51 | property | `extinction` | `AtmosphereSample` | descriptive-other: Value that stores total extinction coefficients. | entity/value | none |
| 54 | property | `scattering` | `AtmosphereSample` | descriptive-other: Value that stores total scattering coefficients. | entity/value | none |
| 57 | property | `rayleighScattering` | `AtmosphereSample` | descriptive-other: Value that stores Rayleigh scattering coefficients. | entity/value | none |
| 60 | property | `mieScattering` | `AtmosphereSample` | descriptive-other: Value that stores Mie scattering coefficients. | entity/value | none |
| 63 | property | `mieExtinction` | `AtmosphereSample` | descriptive-other: Value that stores Mie extinction coefficients. | entity/value | none |
| 66 | property | `absorption` | `AtmosphereSample` | descriptive-other: Value that stores absorption coefficients. | entity/value | none |
| 69 | property | `density` | `AtmosphereSample` | descriptive-other: Value that stores normalized density facts used to derive the coefficients. | entity/value | none |
| 72 | type | `OpticalDepthSample` | `<module>` | descriptive-other: Optical-depth integration output. | entity/value | none |
| 75 | property | `blockedByGround` | `OpticalDepthSample` | descriptive-other: Value that identifies a normally integrated atmosphere path. | entity/value | none |
| 77 | property | `opticalDepth` | `OpticalDepthSample` | descriptive-other: Value that stores finite spectral optical depth. | entity/value | none |
| 79 | property | `transmittance` | `OpticalDepthSample` | descriptive-other: Value that stores the corresponding finite spectral transmittance. | entity/value | none |
| 83 | property | `blockedByGround` | `OpticalDepthSample` | descriptive-other: Value that identifies a path obstructed by the ground boundary. | entity/value | none |
| 85 | property | `opticalDepth` | `OpticalDepthSample` | descriptive-other: Ground obstruction has no finite atmosphere-only optical depth. | entity/value | none |
| 87 | property | `transmittance` | `OpticalDepthSample` | descriptive-other: Value that stores zero spectral transmittance for the obstructed path. | entity/value | none |
| 90 | type | `PhaseSample` | `<module>` | descriptive-other: Phase-function values for one incoming/outgoing direction pair. | entity/value | none |
| 92 | property | `rayleighPhase` | `PhaseSample` | descriptive-other: Value that stores Rayleigh phase value with inverse-solid-angle units. | entity/value | none |
| 95 | property | `miePhase` | `PhaseSample` | descriptive-other: Value that stores Mie phase value with inverse-solid-angle units. | entity/value | none |

## `src/algorithm32/color/bruneton/types.d.ts`

Source: [src/algorithm32/color/bruneton/types.d.ts](../../../../../../src/algorithm32/color/bruneton/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `Figure1DisplayConstants` | `<module>` | descriptive-other: Type that stores constants used by the accepted Figure 1 display conversion. | entity/value | none |
| 4 | property | `conversionKind` | `Figure1DisplayConstants` | descriptive-other: Value that identifies the display conversion. | entity/value | none |
| 7 | property | `outputColorSpace` | `Figure1DisplayConstants` | descriptive-other: Value that identifies the output color space. | entity/value | none |
| 10 | property | `maxLuminousEfficacy` | `Figure1DisplayConstants` | descriptive-other: Value that stores maximum luminous efficacy with its physical unit. | entity/value | none |
| 13 | property | `brunetonComparisonToneMapExposureScale` | `Figure1DisplayConstants` | descriptive-other: Value that stores the accepted comparison exposure scalar. | entity/value | none |
| 16 | property | `paperFigure1ToneMapK` | `Figure1DisplayConstants` | descriptive-other: Value that stores the accepted Figure 1 exponential tone-map coefficient. | entity/value | none |
| 19 | property | `xyzToLinearSrgbMatrix` | `Figure1DisplayConstants` | descriptive-other: Value that stores the XYZ-to-linear-sRGB matrix. | entity/value | none |
| 22 | property | `demoGammaPowerOmitted` | `Figure1DisplayConstants` | descriptive-other: Value that records whether the demo gamma power is intentionally omitted. | entity/value | none |
| 25 | property | `demoWhitePointOmitted` | `Figure1DisplayConstants` | descriptive-other: Value that records whether the demo white point is intentionally omitted. | entity/value | none |
| 29 | type | `BrunetonColorDisplayModelConfiguration` | `<module>` | descriptive-other: Optional construction values for one Bruneton display model. | entity/value | none |
| 31 | property | `displayConstants` | `BrunetonColorDisplayModelConfiguration` | descriptive-other: Figure 1 constants supplied instead of the canonical defaults. | entity/value | none |

## `src/algorithm32/color/bruneton/types/BrunetonColorDisplayModel.d.ts`

Source: [src/algorithm32/color/bruneton/types/BrunetonColorDisplayModel.d.ts](../../../../../../src/algorithm32/color/bruneton/types/BrunetonColorDisplayModel.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `BrunetonLinearSrgbChannelWeights` | `<module>` | descriptive-other: Native-15 linear-sRGB projection weights grouped by display channel. | entity/value | none |
| 4 | property | `r` | `BrunetonLinearSrgbChannelWeights` | descriptive-other: Red-channel projection weight for each native spectral channel. | entity/value | none |
| 6 | property | `g` | `BrunetonLinearSrgbChannelWeights` | descriptive-other: Green-channel projection weight for each native spectral channel. | entity/value | none |
| 8 | property | `b` | `BrunetonLinearSrgbChannelWeights` | descriptive-other: Blue-channel projection weight for each native spectral channel. | entity/value | none |

## `src/algorithm32/color/types.d.ts`

Source: [src/algorithm32/color/types.d.ts](../../../../../../src/algorithm32/color/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | interface | `Color` | `<module>` | descriptive-other: Contract that provides caller-owned conversion from Algorithm32 spectral output to di... | entity/value | none |
| 4 | property | `id` | `Color` | descriptive-other: Value that identifies this configured color conversion instance for compatibility che... | entity/value | none |
| 13 | method | `convert` | `Color` | call-this-method: Call this method to convert one spectral sample into display-facing color values. The... | active-callable | params 1/1; returns tagged |
| 20 | method | `composeSceneLinearSrgb` | `Color` | call-this-method: Call this method to project path radiance through E8, then combine it with the captur... | active-callable | params 1/1; returns tagged |
| 27 | method | `composeSceneDisplayRgb` | `Color` | call-this-method: Call this method to compose the captured scene and atmospheric path at the display bo... | active-callable | params 1/1; returns tagged |
| 35 | method | `createShaderContribution` | `Color` | call-this-method: Call this method to optionally contribute display-conversion shader source, symbols, ... | active-callable | params 1/1; returns tagged |
| 38 | type | `ColorConversionRequest` | `<module>` | descriptive-other: Inputs needed to convert Algorithm32 spectral output to display-facing color data. | entity/value | none |
| 40 | property | `radiance` | `ColorConversionRequest` | descriptive-other: Value that stores completed spectral radiance aligned to the active spectral basis. | entity/value | none |
| 49 | type | `SceneDisplayColorSpace` | `<module>` | descriptive-other: Color-space interpretation of captured scene display channels. - **"linear-srgb"** - ... | entity/value | union bullets 2/2 |
| 52 | type | `SceneDisplayCompositionRequest` | `<module>` | descriptive-other: Type that describes the production display-boundary composition of spectral atmospher... | entity/value | none |
| 54 | property | `pathRadiance` | `SceneDisplayCompositionRequest` | descriptive-other: Value that stores spectral radiance added along the view path. | entity/value | none |
| 57 | property | `transmittance` | `SceneDisplayCompositionRequest` | descriptive-other: Value that stores spectral transmittance accumulated inside the atmosphere. | entity/value | none |
| 60 | property | `sceneDisplayRgb` | `SceneDisplayCompositionRequest` | descriptive-other: Value that stores the captured scene RGB supplied to the display compositor. | entity/value | none |
| 63 | property | `sceneColorSpace` | `SceneDisplayCompositionRequest` | descriptive-other: Value that identifies whether the captured values are renderer-linear sRGB or are alr... | entity/value | none |
| 68 | property | `applySceneTransmittance` | `SceneDisplayCompositionRequest` | descriptive-other: Bypass scene attenuation for a background/no-endpoint path. | entity/value | none |
| 71 | type | `ColorSample` | `<module>` | descriptive-other: Display-facing color values produced from Algorithm32 spectral output. | entity/value | none |
| 73 | property | `channels` | `ColorSample` | descriptive-other: Value that stores display color channels in the converter's output color space. | entity/value | none |
| 76 | property | `colorSpace` | `ColorSample` | descriptive-other: Value that stores the output color space used by the channel values. | entity/value | none |

## `src/algorithm32/domains/direction/cubed-sphere/types.d.ts`

Source: [src/algorithm32/domains/direction/cubed-sphere/types.d.ts](../../../../../../src/algorithm32/domains/direction/cubed-sphere/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `CubedSphereDirectionDomainDefinition` | `<module>` | descriptive-other: Definition of one supported executable cubed-sphere direction domain. | entity/value | none |
| 4 | property | `id` | `CubedSphereDirectionDomainDefinition` | descriptive-other: Unique identifier for the executable domain. | entity/value | none |
| 6 | property | `faceWidth` | `CubedSphereDirectionDomainDefinition` | descriptive-other: Supported boundary-inclusive number of nodes along each face edge. | entity/value | none |
| 10 | type | `CubedSphereFace` | `<module>` | descriptive-other: Right-handed definition of one cubed-sphere face. | entity/value | none |
| 12 | property | `id` | `CubedSphereFace` | descriptive-other: Unique identifier for the face. | entity/value | none |
| 14 | property | `normal` | `CubedSphereFace` | descriptive-other: Outward unit normal of the face. | entity/value | none |
| 16 | property | `uAxis` | `CubedSphereFace` | descriptive-other: Unit vector of the face-local horizontal axis. | entity/value | none |
| 18 | property | `vAxis` | `CubedSphereFace` | descriptive-other: Unit vector of the face-local vertical axis. | entity/value | none |
| 22 | type | `CubedSphereNodeAddress` | `<module>` | descriptive-other: Face-local address of one flattened cubed-sphere node. | entity/value | none |
| 24 | property | `faceIndex` | `CubedSphereNodeAddress` | descriptive-other: Zero-based index of the containing face. | entity/value | none |
| 26 | property | `faceId` | `CubedSphereNodeAddress` | descriptive-other: Unique identifier of the containing face. | entity/value | none |
| 28 | property | `uIndex` | `CubedSphereNodeAddress` | descriptive-other: Zero-based horizontal index within the face. | entity/value | none |
| 30 | property | `vIndex` | `CubedSphereNodeAddress` | descriptive-other: Zero-based vertical index within the face. | entity/value | none |
| 34 | type | `CubedSpherePositiveFaceCenterIndices` | `<module>` | descriptive-other: Flattened indices of the positive-axis cubed-sphere face centers. | entity/value | none |
| 36 | property | `positiveX` | `CubedSpherePositiveFaceCenterIndices` | descriptive-other: Flattened index of the positive-X face center. | entity/value | none |
| 38 | property | `positiveY` | `CubedSpherePositiveFaceCenterIndices` | descriptive-other: Flattened index of the positive-Y face center. | entity/value | none |
| 40 | property | `positiveZ` | `CubedSpherePositiveFaceCenterIndices` | descriptive-other: Flattened index of the positive-Z face center. | entity/value | none |
| 44 | interface | `CubedSphereDirectionDomain` | `<module>` | descriptive-other: Executable boundary-inclusive cubed-sphere direction domain. | entity/value | none |
| 46 | property | `faceWidth` | `CubedSphereDirectionDomain` | descriptive-other: Number of nodes along one face edge. | entity/value | none |
| 48 | property | `cellWidth` | `CubedSphereDirectionDomain` | descriptive-other: Number of cells along one face edge. | entity/value | none |
| 50 | property | `faceNodeCount` | `CubedSphereDirectionDomain` | descriptive-other: Number of nodes on one face. | entity/value | none |
| 52 | property | `faces` | `CubedSphereDirectionDomain` | descriptive-other: Executable face definitions in flattening order. | entity/value | none |
| 54 | property | `positiveFaceCenterIndices` | `CubedSphereDirectionDomain` | descriptive-other: Flattened indices of the positive-axis face centers. | entity/value | none |
| 62 | method | `flattenNodeIndex` | `CubedSphereDirectionDomain` | call-this-method: Call this method to flatten one face-local node. | active-callable | params 3/3; returns tagged |
| 68 | method | `unflattenNodeIndex` | `CubedSphereDirectionDomain` | call-this-method: Call this method to reverse one flattened node index. | active-callable | params 1/1; returns tagged |
| 74 | method | `resolveStencil` | `CubedSphereDirectionDomain` | call-this-method: Call this method to resolve one source-local direction into reconstruction taps. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/domains/direction/cubed-sphere/types/CubedSphereDirectionDomain.d.ts`

Source: [src/algorithm32/domains/direction/cubed-sphere/types/CubedSphereDirectionDomain.d.ts](../../../../../../src/algorithm32/domains/direction/cubed-sphere/types/CubedSphereDirectionDomain.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `CubedSphereDirectionGenerationFacts` | `<module>` | descriptive-other: Numerical facts used while generating one cubed-sphere direction domain. | entity/value | none |
| 4 | property | `faceWidth` | `CubedSphereDirectionGenerationFacts` | descriptive-other: Number of nodes along each face edge. | entity/value | none |
| 6 | property | `cellWidth` | `CubedSphereDirectionGenerationFacts` | descriptive-other: Number of cells along each face edge. | entity/value | none |
| 8 | property | `faceNodeCount` | `CubedSphereDirectionGenerationFacts` | descriptive-other: Number of nodes on each face. | entity/value | none |
| 10 | property | `directionCount` | `CubedSphereDirectionGenerationFacts` | descriptive-other: Total number of directions in the domain. | entity/value | none |
| 12 | property | `faces` | `CubedSphereDirectionGenerationFacts` | descriptive-other: Ordered definitions of the six cubed-sphere faces. | entity/value | none |
| 16 | type | `CubedSphereGridLocation` | `<module>` | descriptive-other: Interpolation location of one continuous face-grid coordinate. | entity/value | none |
| 18 | property | `lower` | `CubedSphereGridLocation` | descriptive-other: Lower node index of the interpolation pair. | entity/value | none |
| 20 | property | `upper` | `CubedSphereGridLocation` | descriptive-other: Upper node index of the interpolation pair. | entity/value | none |
| 22 | property | `fraction` | `CubedSphereGridLocation` | descriptive-other: Fractional weight of the upper node. | entity/value | none |
| 24 | property | `exact` | `CubedSphereGridLocation` | descriptive-other: Whether the coordinate lands exactly on one node. | entity/value | none |

## `src/algorithm32/domains/direction/fibonacci/types.d.ts`

Source: [src/algorithm32/domains/direction/fibonacci/types.d.ts](../../../../../../src/algorithm32/domains/direction/fibonacci/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | interface | `Fibonacci34DirectionDomain` | `<module>` | descriptive-other: Contract that describes the executable Fibonacci-34 incoming quadrature owner. | entity/value | none |
| 3 | property | `integrationWeights` | `Fibonacci34DirectionDomain` | descriptive-other: Integration weights value. | entity/value | none |
| 7 | interface | `PairedFibonacci34DirectionDomain` | `<module>` | descriptive-other: Contract that describes the executable paired-Fibonacci-34 incoming quadrature owner. | entity/value | none |
| 9 | property | `pairCount` | `PairedFibonacci34DirectionDomain` | descriptive-other: Value that stores the fixed number of positive/antipodal direction pairs. | entity/value | none |
| 10 | property | `integrationWeights` | `PairedFibonacci34DirectionDomain` | descriptive-other: Integration weights value. | entity/value | none |

## `src/algorithm32/domains/position/spherical-native/types.d.ts`

Source: [src/algorithm32/domains/position/spherical-native/types.d.ts](../../../../../../src/algorithm32/domains/position/spherical-native/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `SphericalNativePositionDomainDefinition` | `<module>` | descriptive-other: Definition of one supported executable spherical native position domain. | entity/value | none |
| 4 | property | `id` | `SphericalNativePositionDomainDefinition` | descriptive-other: Unique identifier for the executable domain. | entity/value | none |
| 6 | property | `count` | `SphericalNativePositionDomainDefinition` | descriptive-other: Supported number of nodes in the native spherical lattice. | entity/value | none |
| 10 | interface | `SphericalNativePositionDomain` | `<module>` | descriptive-other: Executable native spherical position domain. | entity/value | none |
| 12 | property | `bottomRadius` | `SphericalNativePositionDomain` | descriptive-other: Unit-bearing ground radius used to generate the domain. | entity/value | none |
| 14 | property | `topRadius` | `SphericalNativePositionDomain` | descriptive-other: Unit-bearing atmosphere-top radius used to generate the domain. | entity/value | none |

## `src/algorithm32/domains/types.d.ts`

Source: [src/algorithm32/domains/types.d.ts](../../../../../../src/algorithm32/domains/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `PositionDomainNode` | `<module>` | descriptive-other: Type that describes one ordered physical position node. | entity/value | none |
| 4 | property | `index` | `PositionDomainNode` | descriptive-other: Value that stores the owner-local ordered index. | entity/value | none |
| 7 | property | `coordinate` | `PositionDomainNode` | descriptive-other: Value that stores the physical node coordinate. | entity/value | none |
| 10 | property | `role` | `PositionDomainNode` | descriptive-other: Value that identifies the node's selected construction role. | entity/value | none |
| 13 | property | `metadata` | `PositionDomainNode` | descriptive-other: Value that stores additional immutable identity data. | entity/value | none |
| 17 | type | `PositionDomainNodeDefinition` | `<module>` | descriptive-other: Type that supplies one physical position node in its owner-selected canonical units. | entity/value | none |
| 19 | property | `index` | `PositionDomainNodeDefinition` | descriptive-other: Value that stores the index. | entity/value | none |
| 21 | property | `coordinate` | `PositionDomainNodeDefinition` | descriptive-other: Value that stores the coordinate. | entity/value | none |
| 23 | property | `role` | `PositionDomainNodeDefinition` | descriptive-other: Value that identifies the selected role. | entity/value | none |
| 25 | property | `metadata` | `PositionDomainNodeDefinition` | descriptive-other: Value that stores the metadata. | entity/value | none |
| 29 | interface | `PositionDomain` | `<module>` | descriptive-other: Contract that describes one executable ordered physical position domain. | entity/value | none |
| 31 | property | `id` | `PositionDomain` | descriptive-other: Value that identifies the executable domain. | entity/value | none |
| 33 | property | `count` | `PositionDomain` | descriptive-other: Value that stores the executable position count. | entity/value | none |
| 35 | property | `nodes` | `PositionDomain` | descriptive-other: Value that stores executable ordered position nodes. | entity/value | none |
| 39 | type | `SolidAngleWeights` | `<module>` | descriptive-other: Type that stores solid-angle quadrature weights. | entity/value | none |
| 41 | property | `values` | `SolidAngleWeights` | descriptive-other: Value that stores one weight per direction. | entity/value | none |
| 44 | property | `units` | `SolidAngleWeights` | descriptive-other: Value that identifies the weight unit. | entity/value | none |
| 48 | interface | `DirectionDomain` | `<module>` | descriptive-other: Contract that describes one executable physical direction domain. | entity/value | none |
| 50 | property | `id` | `DirectionDomain` | descriptive-other: Value that identifies the executable domain. | entity/value | none |
| 52 | property | `directionCount` | `DirectionDomain` | descriptive-other: Value that stores the executable direction count. | entity/value | none |
| 54 | property | `unitVectors` | `DirectionDomain` | descriptive-other: Value that stores executable unit vectors. | entity/value | none |
| 56 | property | `integrationWeights` | `DirectionDomain` | descriptive-other: Value that stores integration weights, or null when the domain is not quadrature. | entity/value | none |

## `src/algorithm32/extraterrestrial/sun/types.d.ts`

Source: [src/algorithm32/extraterrestrial/sun/types.d.ts](../../../../../../src/algorithm32/extraterrestrial/sun/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | type | `FlatSynchronizationMode` | `<module>` | descriptive-other: Calibration mode for a flat-world synchronized local Sun position. - **"world"** - UT... | entity/value | union bullets 2/2 |
| 10 | type | `FlatSynchronizationClosestPoint` | `<module>` | descriptive-other: Caller-supplied closest-approach point for flat-Sun synchronization. | entity/value | none |
| 12 | property | `latitude` | `FlatSynchronizationClosestPoint` | descriptive-other: Closest-approach latitude. | entity/value | none |
| 14 | property | `longitude` | `FlatSynchronizationClosestPoint` | descriptive-other: Closest-approach longitude. | entity/value | none |
| 18 | type | `FlatSynchronizedPosition` | `<module>` | descriptive-other: Flat-world synchronized local Sun position. | entity/value | none |
| 20 | property | `mode` | `FlatSynchronizedPosition` | descriptive-other: Calibration mode used to produce this position. | entity/value | none |
| 23 | property | `latitude` | `FlatSynchronizedPosition` | descriptive-other: Resolved flat Sun latitude. | entity/value | none |
| 26 | property | `longitude` | `FlatSynchronizedPosition` | descriptive-other: Resolved flat Sun longitude. | entity/value | none |
| 29 | property | `startLatitude` | `FlatSynchronizedPosition` | descriptive-other: Latitude where the standard Sun is overhead for the UTC date. | entity/value | none |
| 32 | property | `startLongitude` | `FlatSynchronizedPosition` | descriptive-other: Daily orbit anchor longitude. | entity/value | none |
| 35 | property | `startTime` | `FlatSynchronizedPosition` | descriptive-other: Orbit anchor as an ISO timestamp. | entity/value | none |
| 38 | property | `orbitAngle` | `FlatSynchronizedPosition` | descriptive-other: Orbit angle elapsed since the anchor. | entity/value | none |
| 41 | property | `elapsed` | `FlatSynchronizedPosition` | descriptive-other: Signed elapsed time from the anchor. | entity/value | none |
| 44 | property | `orbitPeriod` | `FlatSynchronizedPosition` | descriptive-other: Fixed daily orbit period. | entity/value | none |

## `src/algorithm32/extraterrestrial/sun/types/FlatSynchronizer.d.ts`

Source: [src/algorithm32/extraterrestrial/sun/types/FlatSynchronizer.d.ts](../../../../../../src/algorithm32/extraterrestrial/sun/types/FlatSynchronizer.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `FlatSynchronizerPositionRequest` | `<module>` | descriptive-other: Accepted orbit facts used to construct one synchronized position packet. | entity/value | none |
| 4 | property | `mode` | `FlatSynchronizerPositionRequest` | descriptive-other: Calibration mode represented by the position. | entity/value | none |
| 7 | property | `startLatitude` | `FlatSynchronizerPositionRequest` | descriptive-other: Latitude at the daily orbit anchor. | entity/value | none |
| 10 | property | `startLongitude` | `FlatSynchronizerPositionRequest` | descriptive-other: Longitude at the daily orbit anchor. | entity/value | none |
| 13 | property | `startTime` | `FlatSynchronizerPositionRequest` | descriptive-other: Daily orbit anchor as an ISO timestamp. | entity/value | none |
| 16 | property | `orbitAngle` | `FlatSynchronizerPositionRequest` | descriptive-other: Clockwise orbit angle elapsed since the anchor. | entity/value | none |
| 19 | property | `elapsed` | `FlatSynchronizerPositionRequest` | descriptive-other: Signed elapsed time from the anchor. | entity/value | none |
| 23 | type | `FlatSynchronizerWorldAnchor` | `<module>` | descriptive-other: UTC world anchor used by flat-Sun synchronization calculations. | entity/value | none |
| 25 | property | `startLatitude` | `FlatSynchronizerWorldAnchor` | descriptive-other: Latitude where the standard Sun is overhead for the UTC date. | entity/value | none |
| 28 | property | `startLongitude` | `FlatSynchronizerWorldAnchor` | descriptive-other: Greenwich longitude for the daily world anchor. | entity/value | none |
| 31 | property | `startTime` | `FlatSynchronizerWorldAnchor` | descriptive-other: Greenwich apparent solar-noon instant for the UTC date. | entity/value | none |

## `src/algorithm32/geometry/flat/three/types.d.ts`

Source: [src/algorithm32/geometry/flat/three/types.d.ts](../../../../../../src/algorithm32/geometry/flat/three/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ExactFlatGroundObjectConfig` | `<module>` | descriptive-other: Type that configures an exact flat Three ground endpoint. | entity/value | none |
| 4 | property | `center` | `ExactFlatGroundObjectConfig` | descriptive-other: Value that stores the plane center with its scene unit. | entity/value | none |
| 7 | property | `width` | `ExactFlatGroundObjectConfig` | descriptive-other: Value that stores the plane width with its scene unit. | entity/value | none |
| 10 | property | `depth` | `ExactFlatGroundObjectConfig` | descriptive-other: Value that stores the plane depth with its scene unit. | entity/value | none |
| 13 | property | `sceneScale` | `ExactFlatGroundObjectConfig` | descriptive-other: Value that stores the renderer scene-to-physical scale. | entity/value | none |
| 16 | property | `spectralReferenceId` | `ExactFlatGroundObjectConfig` | descriptive-other: Value that stores optional material/profile id. | entity/value | none |
| 19 | property | `name` | `ExactFlatGroundObjectConfig` | descriptive-other: Value that stores optional object name. | entity/value | none |

## `src/algorithm32/geometry/flat/three/types/FlatGeometrySceneAdapter.d.ts`

Source: [src/algorithm32/geometry/flat/three/types/FlatGeometrySceneAdapter.d.ts](../../../../../../src/algorithm32/geometry/flat/three/types/FlatGeometrySceneAdapter.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `FlatRawVector3` | `<module>` | descriptive-other: Raw three-component vector used only by flat scene adaptation. | entity/value | none |
| 5 | type | `FlatThreeCameraCandidate` | `<module>` | descriptive-other: Minimal Three camera packet used while resolving flat scene depth. | entity/value | none |
| 7 | property | `position` | `FlatThreeCameraCandidate` | descriptive-other: Optional Three position value. | entity/value | none |

## `src/algorithm32/geometry/flat/types.d.ts`

Source: [src/algorithm32/geometry/flat/types.d.ts](../../../../../../src/algorithm32/geometry/flat/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `FlatEarthGeometryConfig` | `<module>` | descriptive-other: Type that configures flat Earth atmosphere geometry. | entity/value | none |
| 4 | property | `observerPosition` | `FlatEarthGeometryConfig` | descriptive-other: Value that stores observer position with its physical unit. | entity/value | none |
| 7 | property | `sourcePosition` | `FlatEarthGeometryConfig` | descriptive-other: Value that stores the source-owned local-light position paired into geometry for sour... | entity/value | none |
| 10 | property | `topAltitude` | `FlatEarthGeometryConfig` | descriptive-other: Value that stores top atmosphere altitude with its physical unit. | entity/value | none |
| 13 | property | `cacheRadialMaximum` | `FlatEarthGeometryConfig` | descriptive-other: Value that stores the reusable local-cache radial construction bound. This is a cache... | entity/value | none |
| 16 | property | `sceneSkyRayLimit` | `FlatEarthGeometryConfig` | descriptive-other: Value that stores optional sky ray cap with its physical unit for unbounded flat rays. | entity/value | none |
| 19 | property | `observerCenteredDome` | `FlatEarthGeometryConfig` | descriptive-other: Value that stores optional observer-centered dome configuration. | entity/value | none |
| 22 | property | `runtimeDiagnosticLimit` | `FlatEarthGeometryConfig` | descriptive-other: Value that stores diagnostic retention limit. | entity/value | none |
| 25 | property | `cacheAltitudeNodes` | `FlatEarthGeometryConfig` | descriptive-other: Value that stores optional explicit altitude nodes for the local cache. Omission scal... | entity/value | none |
| 28 | property | `cacheRadialNodes` | `FlatEarthGeometryConfig` | descriptive-other: Value that stores optional explicit source-subpoint radial nodes for the local cache.... | entity/value | none |
| 32 | type | `FlatEarthGeometryConfiguration` | `<module>` | descriptive-other: Type that stores normalized executable flat geometry configuration. | entity/value | none |
| 34 | property | `observerPosition` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores the normalized observer position. | entity/value | none |
| 36 | property | `sourcePosition` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores the normalized finite-source position. | entity/value | none |
| 38 | property | `sourceSubpoint` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores the source projection on the ground plane. | entity/value | none |
| 40 | property | `topAltitude` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores the top atmosphere altitude. | entity/value | none |
| 42 | property | `sceneSkyRayLimit` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores the optional final-view parallel-ray cap. | entity/value | none |
| 44 | property | `observerCenteredDome` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores the optional final-view-only observer dome. | entity/value | none |
| 46 | property | `runtimeDiagnosticLimit` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores retained diagnostic capacity. | entity/value | none |
| 48 | property | `observerLocalSceneFrame` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores the observer-local scene frame. | entity/value | none |
| 49 | property | `up` | `FlatEarthGeometryConfiguration` | descriptive-other: Up value. | entity/value | none |
| 50 | property | `right` | `FlatEarthGeometryConfiguration` | descriptive-other: Right value. | entity/value | none |
| 51 | property | `forward` | `FlatEarthGeometryConfiguration` | descriptive-other: Forward value. | entity/value | none |
| 54 | property | `cacheAltitudeNodes` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores selected local-cache altitude nodes. | entity/value | none |
| 56 | property | `cacheRadialNodes` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores selected local-cache radial nodes. | entity/value | none |
| 58 | property | `cacheAltitudeNodesExplicit` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that records whether altitude nodes entered through explicit configuration. | entity/value | none |
| 60 | property | `cacheRadialNodesExplicit` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that records whether radial nodes entered through explicit configuration. | entity/value | none |
| 62 | property | `cacheRadialMaximum` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores the selected reusable radial construction bound. | entity/value | none |
| 64 | property | `cacheRadialFallbackDirection` | `FlatEarthGeometryConfiguration` | descriptive-other: Value that stores the deterministic radial axis at rho zero. | entity/value | none |
| 68 | type | `FlatScatteringCacheGeometryOwner` | `<module>` | descriptive-other: Physical flat-geometry operations required by scattering-cache construction. | entity/value | none |
| 76 | method | `distanceToTopAtmosphereBoundary` | `FlatScatteringCacheGeometryOwner` | call-this-method: Call this method to resolve distance to the top atmosphere boundary. | active-callable | params 2/2; returns tagged |
| 85 | method | `distanceToGroundBoundary` | `FlatScatteringCacheGeometryOwner` | call-this-method: Call this method to resolve distance to the ground boundary. | active-callable | params 2/2; returns tagged |
| 93 | method | `resolveAtmosphereCoordinate` | `FlatScatteringCacheGeometryOwner` | call-this-method: Call this method to resolve a physical position into atmosphere coordinates. | active-callable | params 1/1; returns tagged |
| 97 | type | `FlatLocalCachePositionNodeMetadata` | `<module>` | descriptive-other: Type that stores one flattened flat/local position node's physical metadata. | entity/value | none |
| 99 | property | `position` | `FlatLocalCachePositionNodeMetadata` | descriptive-other: Value that stores its canonical representative physical position. | entity/value | none |
| 101 | property | `z` | `FlatLocalCachePositionNodeMetadata` | descriptive-other: Value that stores altitude above the ground plane. | entity/value | none |
| 103 | property | `rho` | `FlatLocalCachePositionNodeMetadata` | descriptive-other: Value that stores horizontal distance from the source subpoint. | entity/value | none |
| 105 | property | `zIndex` | `FlatLocalCachePositionNodeMetadata` | descriptive-other: Value that stores the altitude-axis index. | entity/value | none |
| 107 | property | `rhoIndex` | `FlatLocalCachePositionNodeMetadata` | descriptive-other: Value that stores the radial-axis index. | entity/value | none |
| 111 | type | `FlatLocalCachePositionDomainRequest` | `<module>` | descriptive-other: Type that selects one geometry-owned flat/local position domain. | entity/value | none |
| 113 | property | `zCount` | `FlatLocalCachePositionDomainRequest` | descriptive-other: Value that selects generated altitude-node count when explicit nodes are absent. | entity/value | none |
| 115 | property | `rhoCount` | `FlatLocalCachePositionDomainRequest` | descriptive-other: Value that selects generated radial-node count when explicit nodes are absent. | entity/value | none |
| 119 | type | `FlatLocalCachePositionDomain` | `<module>` | descriptive-other: Type that exposes one coherent executable flat/local position-domain selection. | entity/value | none |
| 121 | property | `id` | `FlatLocalCachePositionDomain` | descriptive-other: Value that identifies the executable position domain. | entity/value | none |
| 123 | property | `nodes` | `FlatLocalCachePositionDomain` | descriptive-other: Value that stores flattened z-major, rho-minor executable nodes. | entity/value | none |
| 125 | property | `zNodes` | `FlatLocalCachePositionDomain` | descriptive-other: Value that stores executable altitude nodes. | entity/value | none |
| 127 | property | `rhoNodes` | `FlatLocalCachePositionDomain` | descriptive-other: Value that stores executable radial nodes. | entity/value | none |
| 129 | property | `zCount` | `FlatLocalCachePositionDomain` | descriptive-other: Value that stores altitude-axis extent. | entity/value | none |
| 131 | property | `rhoCount` | `FlatLocalCachePositionDomain` | descriptive-other: Value that stores radial-axis extent. | entity/value | none |
| 133 | property | `count` | `FlatLocalCachePositionDomain` | descriptive-other: Value that stores flattened position extent. | entity/value | none |
| 137 | type | `FlatLocalCachePositionDomainAxes` | `<module>` | descriptive-other: Type that stores executable flat/local position axes recovered from a domain. | entity/value | none |
| 139 | property | `zNodes` | `FlatLocalCachePositionDomainAxes` | descriptive-other: Value that stores altitude nodes. | entity/value | none |
| 141 | property | `rhoNodes` | `FlatLocalCachePositionDomainAxes` | descriptive-other: Value that stores radial nodes. | entity/value | none |
| 143 | property | `zCount` | `FlatLocalCachePositionDomainAxes` | descriptive-other: Value that stores altitude-axis extent. | entity/value | none |
| 145 | property | `rhoCount` | `FlatLocalCachePositionDomainAxes` | descriptive-other: Value that stores radial-axis extent. | entity/value | none |
| 149 | type | `FlatScatteringCachePositionStencilRequest` | `<module>` | descriptive-other: Type that supplies flat/local position reconstruction with optional executable axes. | entity/value | none |
| 152 | property | `positionAxes` | `FlatScatteringCachePositionStencilRequest` | descriptive-other: Value that selects explicit executable axes for a bounded construction domain. | entity/value | none |
| 156 | type | `FlatScatteringCacheFramedDirectionRequest` | `<module>` | descriptive-other: Type that supplies the physical position required by a local radial direction frame. | entity/value | none |
| 159 | property | `position` | `FlatScatteringCacheFramedDirectionRequest` | descriptive-other: Value that stores the physical position whose radial frame is active. | entity/value | none |
| 163 | type | `FlatLocalCacheConstructionDomains` | `<module>` | descriptive-other: Type that supplies the flat executable axes added to shared construction domains. | entity/value | none |
| 167 | property | `spectralChannelCount` | `FlatLocalCacheConstructionDomains` | descriptive-other: Value that stores the executable spectral channel extent. | entity/value | none |
| 176 | type | `FlatCacheTransportDataRequestExcludedProperty` | `<module>` | descriptive-other: Shared transport-request property replaced by the flat/local specialization. - **"dir... | entity/value | union bullets 2/2 |
| 179 | type | `FlatCacheTransportDataRequest` | `<module>` | descriptive-other: Type that supplies local geometry transport packing without a fixed source direction.... | entity/value | none |
| 183 | property | `domains` | `FlatCacheTransportDataRequest` | descriptive-other: Value that supplies local executable position axes with shared domains. | entity/value | none |
| 188 | type | `FlatObserverCenteredDomeConfig` | `<module>` | descriptive-other: Type that configures an observer-centered flat atmosphere dome. | entity/value | none |
| 190 | property | `centerPolicy` | `FlatObserverCenteredDomeConfig` | descriptive-other: Value that stores the dome center policy. | entity/value | none |
| 193 | property | `apexAltitude` | `FlatObserverCenteredDomeConfig` | descriptive-other: Value that stores dome apex altitude with its physical unit. | entity/value | none |
| 196 | property | `maxObserverViewRayExtent` | `FlatObserverCenteredDomeConfig` | descriptive-other: Value that stores maximum observer view-ray extent with its physical unit. | entity/value | none |
| 200 | type | `FlatObserverCenteredDomeFacts` | `<module>` | descriptive-other: Type that stores derived observer-centered dome facts. | entity/value | none |
| 202 | property | `centerPolicy` | `FlatObserverCenteredDomeFacts` | descriptive-other: Value that identifies the center policy. | entity/value | none |
| 204 | property | `apexAltitude` | `FlatObserverCenteredDomeFacts` | descriptive-other: Value that stores the apex altitude. | entity/value | none |
| 206 | property | `maxObserverViewRayExtent` | `FlatObserverCenteredDomeFacts` | descriptive-other: Value that stores the max observer view ray extent. | entity/value | none |
| 208 | property | `observerAltitude` | `FlatObserverCenteredDomeFacts` | descriptive-other: Value that stores the observer altitude. | entity/value | none |
| 210 | property | `sphereCenter` | `FlatObserverCenteredDomeFacts` | descriptive-other: Value that stores the sphere center. | entity/value | none |
| 212 | property | `sphereRadius` | `FlatObserverCenteredDomeFacts` | descriptive-other: Value that stores the sphere radius. | entity/value | none |

## `src/algorithm32/geometry/flat/types/FlatEarthGeometry.d.ts`

Source: [src/algorithm32/geometry/flat/types/FlatEarthGeometry.d.ts](../../../../../../src/algorithm32/geometry/flat/types/FlatEarthGeometry.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `FlatEarthGeometryNodePlacementFractions` | `<module>` | descriptive-other: Ordered dimensionless node-placement fractions used only by FlatEarthGeometry. | entity/value | none |
| 5 | type | `FlatEarthGeometryNormalizedMeterRay` | `<module>` | descriptive-other: Normalized physical ray in meters used only by flat atmosphere-path sampling. | entity/value | none |
| 7 | property | `origin` | `FlatEarthGeometryNormalizedMeterRay` | descriptive-other: Physical ray origin in meters. | entity/value | none |
| 9 | property | `direction` | `FlatEarthGeometryNormalizedMeterRay` | descriptive-other: Normalized physical ray direction. | entity/value | none |

## `src/algorithm32/geometry/flat/types/FlatScatteringCacheGeometry.d.ts`

Source: [src/algorithm32/geometry/flat/types/FlatScatteringCacheGeometry.d.ts](../../../../../../src/algorithm32/geometry/flat/types/FlatScatteringCacheGeometry.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `FlatLocalCacheDirectionFrame` | `<module>` | descriptive-other: Right-handed local radial/tangent/vertical direction frame. | entity/value | none |
| 4 | property | `radial` | `FlatLocalCacheDirectionFrame` | descriptive-other: Horizontal direction away from the source subpoint. | entity/value | none |
| 6 | property | `tangent` | `FlatLocalCacheDirectionFrame` | descriptive-other: Horizontal positive tangent direction. | entity/value | none |
| 8 | property | `vertical` | `FlatLocalCacheDirectionFrame` | descriptive-other: Model-space vertical direction. | entity/value | none |
| 12 | type | `FlatCacheAxisStencil` | `<module>` | descriptive-other: Interpolation stencil on one ordered flat-cache axis. | entity/value | none |
| 14 | property | `lowerIndex` | `FlatCacheAxisStencil` | descriptive-other: Lower node index. | entity/value | none |
| 16 | property | `upperIndex` | `FlatCacheAxisStencil` | descriptive-other: Upper node index. | entity/value | none |
| 18 | property | `lowerWeight` | `FlatCacheAxisStencil` | descriptive-other: Lower interpolation weight. | entity/value | none |
| 20 | property | `upperWeight` | `FlatCacheAxisStencil` | descriptive-other: Upper interpolation weight. | entity/value | none |
| 24 | type | `FlatLocalCacheBuildCoordinateMetadata` | `<module>` | descriptive-other: Flat/local coordinate metadata used by generic transport. | entity/value | none |
| 26 | property | `position` | `FlatLocalCacheBuildCoordinateMetadata` | descriptive-other: Physical construction position. | entity/value | none |
| 28 | property | `positionIndex` | `FlatLocalCacheBuildCoordinateMetadata` | descriptive-other: Flattened position index when useful. | entity/value | none |
| 38 | type | `FlatReusableBoundaryKind` | `<module>` | descriptive-other: Domain edge selected as one reusable flat-cache construction boundary. - **"ground"**... | entity/value | union bullets 3/3 |
| 41 | type | `FlatReusableBoundary` | `<module>` | descriptive-other: Selected reusable construction boundary. | entity/value | none |
| 43 | property | `kind` | `FlatReusableBoundary` | descriptive-other: Selected domain edge. | entity/value | none |
| 45 | property | `distance` | `FlatReusableBoundary` | descriptive-other: Physical distance to the edge in meters. | entity/value | none |
| 49 | type | `FlatTransportTap` | `<module>` | descriptive-other: Aggregated packed transport tap. | entity/value | none |
| 51 | property | `sourceDirectionIndex` | `FlatTransportTap` | descriptive-other: Source scattering-direction index. | entity/value | none |
| 53 | property | `sourcePositionIndex` | `FlatTransportTap` | descriptive-other: Source position index. | entity/value | none |
| 55 | property | `coefficients` | `FlatTransportTap` | descriptive-other: Coefficient for each spectral channel. | entity/value | none |
| 59 | type | `FlatTransportQueryRequest` | `<module>` | descriptive-other: Physical inputs for one flat/local packed transport query. | entity/value | none |
| 61 | property | `atmosphere` | `FlatTransportQueryRequest` | descriptive-other: Atmosphere-owned medium sampling. | entity/value | none |
| 63 | property | `domains` | `FlatTransportQueryRequest` | descriptive-other: Exact executable position and outgoing-direction domains. | entity/value | none |
| 65 | property | `positionNode` | `FlatTransportQueryRequest` | descriptive-other: Output position node. | entity/value | none |
| 67 | property | `cacheDirection` | `FlatTransportQueryRequest` | descriptive-other: Local outgoing radiance direction. | entity/value | none |
| 69 | property | `intervalCount` | `FlatTransportQueryRequest` | descriptive-other: Selected path interval count. | entity/value | none |

## `src/algorithm32/geometry/shared/types.d.ts`

Source: [src/algorithm32/geometry/shared/types.d.ts](../../../../../../src/algorithm32/geometry/shared/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `GroundIntersection` | `<module>` | descriptive-other: Type that describes a geometry-owned ground hit. | entity/value | none |
| 4 | property | `position` | `GroundIntersection` | descriptive-other: Value that stores the physical position. | entity/value | none |
| 6 | property | `normal` | `GroundIntersection` | descriptive-other: Value that stores the outward unit normal. | entity/value | none |
| 8 | property | `distance` | `GroundIntersection` | descriptive-other: Value that stores the physical distance. | entity/value | none |
| 12 | type | `AtmosphereCoordinate` | `<module>` | descriptive-other: Type that describes an atmosphere coordinate resolved by geometry. | entity/value | none |
| 14 | property | `altitude` | `AtmosphereCoordinate` | descriptive-other: Value that stores altitude above the active atmosphere bottom boundary. | entity/value | none |
| 17 | property | `rho` | `AtmosphereCoordinate` | descriptive-other: Value that stores optional horizontal distance from a finite source subpoint when req... | entity/value | none |
| 21 | type | `AtmospherePathSample` | `<module>` | descriptive-other: Type that describes one sampled atmosphere path point. | entity/value | none |
| 23 | property | `atmosphereCoordinate` | `AtmospherePathSample` | descriptive-other: Value that stores the atmosphere coordinate represented by this path sample. | entity/value | none |
| 26 | property | `measure` | `AtmospherePathSample` | descriptive-other: Value that stores the effective path measure represented by this sample. | entity/value | none |
| 29 | property | `intervalLengthFromPrevious` | `AtmospherePathSample` | descriptive-other: Value that stores the interval length from the previous sample. | entity/value | none |
| 33 | type | `AtmospherePathRequest` | `<module>` | descriptive-other: Type that describes a request to resolve a physical ray into an atmosphere path. | entity/value | none |
| 35 | property | `ray` | `AtmospherePathRequest` | descriptive-other: Value that stores the model-space ray to resolve. | entity/value | none |
| 37 | property | `startDistance` | `AtmospherePathRequest` | descriptive-other: Value that stores the optional path start distance. | entity/value | none |
| 39 | property | `endDistance` | `AtmospherePathRequest` | descriptive-other: Value that stores the optional explicit path end distance. | entity/value | none |
| 41 | property | `sourcePathLimit` | `AtmospherePathRequest` | descriptive-other: Value that stores the optional source-owned path limit. | entity/value | none |
| 43 | property | `sampleCount` | `AtmospherePathRequest` | descriptive-other: Value that stores the optional integration sample count. | entity/value | none |
| 47 | type | `AtmospherePath` | `<module>` | descriptive-other: Type that describes a geometry-owned atmosphere path for optical-depth integration. | entity/value | none |
| 49 | property | `start` | `AtmospherePath` | descriptive-other: Value that stores the start coordinate. | entity/value | none |
| 52 | property | `end` | `AtmospherePath` | descriptive-other: Value that stores the end coordinate. | entity/value | none |
| 55 | property | `length` | `AtmospherePath` | descriptive-other: Value that stores total physical path length. | entity/value | none |
| 58 | property | `samples` | `AtmospherePath` | descriptive-other: Value that stores optional integration samples. | entity/value | none |
| 61 | property | `blockedByGround` | `AtmospherePath` | descriptive-other: Value that stores true when the path is blocked by ground before reaching the source. | entity/value | none |
| 64 | property | `metadata` | `AtmospherePath` | descriptive-other: Value that stores owner-specific metadata for validation or diagnostics. | entity/value | none |
| 68 | type | `SourceRelativePosition` | `<module>` | descriptive-other: Type that describes a position in the source-owned frame after geometry resolution. | entity/value | none |
| 70 | property | `directionFromSource` | `SourceRelativePosition` | descriptive-other: Value that stores the direction from the source toward the sample point. | entity/value | none |
| 73 | property | `directionToSource` | `SourceRelativePosition` | descriptive-other: Value that stores the direction from the sample point toward the source when useful. | entity/value | none |
| 76 | property | `distanceFromSource` | `SourceRelativePosition` | descriptive-other: Value that stores measured distance from the finite source, or null for directional s... | entity/value | none |
| 79 | property | `radialDistanceFromSourceSubpoint` | `SourceRelativePosition` | descriptive-other: Value that stores radial distance from the source subpoint when the active cache fami... | entity/value | none |
| 82 | property | `altitude` | `SourceRelativePosition` | descriptive-other: Value that stores resolved physical altitude when the active cache family needs it. | entity/value | none |
| 85 | property | `metadata` | `SourceRelativePosition` | descriptive-other: Value that stores owner-specific metadata for validation or diagnostics. | entity/value | none |
| 89 | type | `Ray` | `<module>` | descriptive-other: Type that describes one model-space ray. | entity/value | none |
| 91 | property | `origin` | `Ray` | descriptive-other: Value that stores the model-space ray origin. | entity/value | none |
| 94 | property | `direction` | `Ray` | descriptive-other: Value that stores the normalized model-space ray direction. | entity/value | none |
| 98 | type | `RaySegment` | `<module>` | descriptive-other: Type that describes a finite geometry-resolved view ray segment. | entity/value | none |
| 100 | property | `ray` | `RaySegment` | descriptive-other: Value that stores the ray integrated by Algorithm32. | entity/value | none |
| 103 | property | `startDistance` | `RaySegment` | descriptive-other: Value that stores the starting physical distance along the ray. | entity/value | none |
| 106 | property | `endDistance` | `RaySegment` | descriptive-other: Value that stores the ending physical distance along the ray. | entity/value | none |
| 109 | property | `metadata` | `RaySegment` | descriptive-other: Value that stores optional geometry-owned endpoint or boundary metadata. | entity/value | none |
| 118 | type | `GeometryViewRayGroundBoundaryMode` | `<module>` | descriptive-other: Ground-boundary ownership mode for one geometry-resolved view ray. - **"clip"** - Geo... | entity/value | union bullets 2/2 |
| 121 | type | `GeometryViewRayRequest` | `<module>` | descriptive-other: Type that supplies optional geometry-owned facts used to resolve one finite view ray. | entity/value | none |
| 123 | property | `origin` | `GeometryViewRayRequest` | descriptive-other: Override the geometry's configured observer origin. | entity/value | none |
| 125 | property | `direction` | `GeometryViewRayRequest` | descriptive-other: Override the geometry's configured view direction. | entity/value | none |
| 127 | property | `endDistance` | `GeometryViewRayRequest` | descriptive-other: Limit the resolved segment to an earlier physical endpoint. | entity/value | none |
| 129 | property | `groundBoundaryMode` | `GeometryViewRayRequest` | descriptive-other: Value that selects whether spherical ground clips the ray or is owned by a scene hit. | entity/value | none |
| 133 | type | `GeometryGroundProjectionRequest` | `<module>` | descriptive-other: Type that configures geometry-owned scene-point projection to the ground receiver. | entity/value | none |
| 135 | property | `sceneScale` | `GeometryGroundProjectionRequest` | descriptive-other: Value that stores the renderer scene-to-physical scale. | entity/value | none |
| 141 | property | `surfaceTolerance` | `GeometryGroundProjectionRequest` | descriptive-other: Treat points already this close to, or inside, the local surface as belonging to the ... | entity/value | none |
| 144 | property | `maxLocalDistance` | `GeometryGroundProjectionRequest` | descriptive-other: Value that rejects ray hits farther than this scene-unit distance from the original p... | entity/value | none |
| 147 | property | `localNormalDotMin` | `GeometryGroundProjectionRequest` | descriptive-other: Value that rejects ray hits whose surface normal dot with the local projected surface... | entity/value | none |
| 156 | type | `GeometryVisualMaterialLighting` | `<module>` | descriptive-other: Visual-material lighting policy for geometry-owned endpoint objects. - **"basic"** - ... | entity/value | union bullets 2/2 |
| 159 | type | `GeometryThreeEndpointObjectsRequest` | `<module>` | descriptive-other: Geometry-owned Three endpoint-object construction request. | entity/value | none |
| 161 | property | `sceneScale` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Renderer scene-to-physical scale. | entity/value | none |
| 164 | property | `spectralReferenceId` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Optional material or profile identifier for the endpoint objects. | entity/value | none |
| 166 | property | `visualMaterialColor` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Optional Three numeric material color. | entity/value | none |
| 169 | property | `visualMaterialDisplayRgba` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Optional display-space material RGBA channels. | entity/value | none |
| 172 | property | `visualMaterialLighting` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Visual-ground material lighting policy. | entity/value | none |
| 175 | property | `shadow` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Optional renderer shadow-receiver configuration for visual endpoint objects. | entity/value | none |
| 178 | property | `groundExtent` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Optional flat-ground render extent override. | entity/value | none |
| 181 | property | `widthSegments` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Visual-geometry width or radial segment count. | entity/value | none |
| 184 | property | `heightSegments` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Visual-geometry height or depth segment count. | entity/value | none |
| 190 | property | `groundVisualMesh` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Spherical-ground visual receiver mesh; the exact raycast endpoint remains the ground-... | entity/value | none |
| 193 | property | `name` | `GeometryThreeEndpointObjectsRequest` | descriptive-other: Optional base object name. | entity/value | none |
| 197 | type | `GeometryEndpointShadowRequest` | `<module>` | descriptive-other: Geometry-owned visual-endpoint shadow-receiver request. | entity/value | none |
| 199 | property | `enabled` | `GeometryEndpointShadowRequest` | descriptive-other: Whether geometry-owned ground shadow receiving is enabled. | entity/value | none |
| 202 | property | `receiveShadow` | `GeometryEndpointShadowRequest` | descriptive-other: Whether the visual endpoint receives Three shadows. | entity/value | none |
| 205 | property | `shadowPolicy` | `GeometryEndpointShadowRequest` | descriptive-other: Optional shadow-policy metadata. | entity/value | none |
| 209 | type | `GeometryEndpointShadowRequestCandidate` | `<module>` | descriptive-other: Unknown-valued form of a geometry endpoint-shadow request at ingress. | entity/value | none |
| 211 | property | `enabled` | `GeometryEndpointShadowRequestCandidate` | descriptive-other: Candidate enablement value. | entity/value | none |
| 214 | property | `receiveShadow` | `GeometryEndpointShadowRequestCandidate` | descriptive-other: Candidate shadow-receiving value. | entity/value | none |
| 217 | property | `shadowPolicy` | `GeometryEndpointShadowRequestCandidate` | descriptive-other: Candidate shadow-policy value. | entity/value | none |
| 221 | type | `GeometryThreeEndpointObjects` | `<module>` | descriptive-other: Geometry-owned Three endpoint objects. | entity/value | none |
| 223 | property | `visualObjects` | `GeometryThreeEndpointObjects` | descriptive-other: Visible objects for the application scene or composer render. | entity/value | none |
| 226 | property | `raycastObjects` | `GeometryThreeEndpointObjects` | descriptive-other: Exact raycast/input objects for scene-hit ownership. | entity/value | none |
| 229 | property | `metadata` | `GeometryThreeEndpointObjects` | descriptive-other: Owner-specific placement, scale, and material metadata. | entity/value | none |
| 233 | type | `GeometrySceneDepthMaxRequest` | `<module>` | descriptive-other: Type that configures geometry-owned scene-depth cap resolution. | entity/value | none |
| 235 | property | `camera` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that provides the active camera when available. | entity/value | none |
| 238 | property | `cameraPosition` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that provides camera position in physical coordinates. | entity/value | none |
| 241 | property | `cameraScenePosition` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that provides camera position in renderer scene coordinates. | entity/value | none |
| 244 | property | `sceneScale` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that stores the renderer scene-to-physical scale. | entity/value | none |
| 250 | property | `groundExtent` | `GeometrySceneDepthMaxRequest` | descriptive-other: Override geometry-owned endpoint extent when the geometry uses a finite ground plane. | entity/value | none |
| 253 | property | `minimum` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that stores the smallest acceptable cap. | entity/value | none |
| 256 | property | `endpointExtent` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that provides one physical endpoint extent. | entity/value | none |
| 259 | property | `endpointPosition` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that provides one physical endpoint position. | entity/value | none |
| 262 | property | `endpointPositions` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that provides physical endpoint positions. | entity/value | none |
| 265 | property | `endpointSceneExtent` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that provides one renderer-scene endpoint extent. | entity/value | none |
| 268 | property | `endpointScenePosition` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that provides one renderer-scene endpoint position. | entity/value | none |
| 271 | property | `endpointScenePositions` | `GeometrySceneDepthMaxRequest` | descriptive-other: Value that provides renderer-scene endpoint positions. | entity/value | none |

## `src/algorithm32/geometry/spherical/three/types.d.ts`

Source: [src/algorithm32/geometry/spherical/three/types.d.ts](../../../../../../src/algorithm32/geometry/spherical/three/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ExactSphereGroundObjectConfig` | `<module>` | descriptive-other: Type that configures an exact spherical Three ground endpoint. | entity/value | none |
| 4 | property | `radius` | `ExactSphereGroundObjectConfig` | descriptive-other: Value that stores the sphere radius with its scene unit. | entity/value | none |
| 7 | property | `center` | `ExactSphereGroundObjectConfig` | descriptive-other: Value that stores the sphere center with its scene unit. | entity/value | none |
| 10 | property | `sceneScale` | `ExactSphereGroundObjectConfig` | descriptive-other: Value that stores the renderer scene-to-physical scale. | entity/value | none |
| 13 | property | `spectralReferenceId` | `ExactSphereGroundObjectConfig` | descriptive-other: Value that stores optional material/profile id. | entity/value | none |
| 16 | property | `name` | `ExactSphereGroundObjectConfig` | descriptive-other: Value that stores optional object name. | entity/value | none |

## `src/algorithm32/geometry/spherical/three/types/SphericalGeometrySceneAdapter.d.ts`

Source: [src/algorithm32/geometry/spherical/three/types/SphericalGeometrySceneAdapter.d.ts](../../../../../../src/algorithm32/geometry/spherical/three/types/SphericalGeometrySceneAdapter.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `SphericalSceneVector3` | `<module>` | descriptive-other: Three-component scene vector used only by spherical scene adaptation. | entity/value | none |
| 12 | type | `SphericalScenePointToModelPosition` | `<module>` | descriptive-other: Type used by SphericalGeometrySceneAdapter to map a scene point to its physical model... | entity/value | none |
| 18 | callback | `<function-type>` | `SphericalScenePointToModelPosition` | called-by: Called by spherical scene point to model position to handle one invocation of the dec... | called-by | params 2/2; returns tagged |
| 21 | type | `SphericalSphereRayHit` | `<module>` | descriptive-other: Non-negative sphere-ray intersection used by spherical ground projection. | entity/value | none |
| 23 | property | `distance` | `SphericalSphereRayHit` | descriptive-other: Distance from the ray origin in scene units. | entity/value | none |
| 25 | property | `point` | `SphericalSphereRayHit` | descriptive-other: Intersection point in scene units. | entity/value | none |
| 29 | type | `SphericalGroundVisualMeshCandidate` | `<module>` | descriptive-other: Untrusted property packet used while accepting a spherical visual-mesh request. | entity/value | none |
| 31 | property | `kind` | `SphericalGroundVisualMeshCandidate` | descriptive-other: Candidate mesh kind. | entity/value | none |
| 33 | property | `xExtent` | `SphericalGroundVisualMeshCandidate` | descriptive-other: Candidate local-patch half width. | entity/value | none |
| 35 | property | `zMin` | `SphericalGroundVisualMeshCandidate` | descriptive-other: Candidate local-patch minimum depth coordinate. | entity/value | none |
| 37 | property | `zMax` | `SphericalGroundVisualMeshCandidate` | descriptive-other: Candidate local-patch maximum depth coordinate. | entity/value | none |
| 39 | property | `surfaceLift` | `SphericalGroundVisualMeshCandidate` | descriptive-other: Candidate visual surface lift. | entity/value | none |
| 43 | type | `SphericalGroundVisualMesh` | `<module>` | descriptive-other: Normalized spherical visual-mesh request used by endpoint construction. | entity/value | none |
| 45 | property | `kind` | `SphericalGroundVisualMesh` | descriptive-other: Selected mesh kind. | entity/value | none |
| 47 | property | `xExtent` | `SphericalGroundVisualMesh` | descriptive-other: Optional local-patch half width. | entity/value | none |
| 49 | property | `zMin` | `SphericalGroundVisualMesh` | descriptive-other: Optional local-patch minimum depth coordinate. | entity/value | none |
| 51 | property | `zMax` | `SphericalGroundVisualMesh` | descriptive-other: Optional local-patch maximum depth coordinate. | entity/value | none |
| 53 | property | `surfaceLift` | `SphericalGroundVisualMesh` | descriptive-other: Optional visual surface lift. | entity/value | none |
| 57 | type | `SphericalLocalGroundPatchRequest` | `<module>` | descriptive-other: Internal request for sampled local spherical ground-patch construction. | entity/value | none |
| 59 | property | `radius` | `SphericalLocalGroundPatchRequest` | descriptive-other: Sphere radius in scene units. | entity/value | none |
| 61 | property | `widthSegments` | `SphericalLocalGroundPatchRequest` | descriptive-other: Horizontal segment count. | entity/value | none |
| 63 | property | `heightSegments` | `SphericalLocalGroundPatchRequest` | descriptive-other: Depth segment count. | entity/value | none |
| 65 | property | `observerAltitude` | `SphericalLocalGroundPatchRequest` | descriptive-other: Observer altitude in scene units. | entity/value | none |
| 67 | property | `center` | `SphericalLocalGroundPatchRequest` | descriptive-other: Sphere center in scene units. | entity/value | none |
| 69 | property | `groundVisualMesh` | `SphericalLocalGroundPatchRequest` | descriptive-other: Normalized visual-mesh request. | entity/value | none |
| 73 | type | `SphericalThreeCameraCandidate` | `<module>` | descriptive-other: Minimal Three camera packet used while resolving scene depth. | entity/value | none |
| 75 | property | `position` | `SphericalThreeCameraCandidate` | descriptive-other: Optional Three position value. | entity/value | none |

## `src/algorithm32/geometry/spherical/types.d.ts`

Source: [src/algorithm32/geometry/spherical/types.d.ts](../../../../../../src/algorithm32/geometry/spherical/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | type | `SphericalGroundVisualMeshKind` | `<module>` | descriptive-other: Supported spherical ground visual-receiver mesh kind. - **"sphere"** - The complete s... | entity/value | union bullets 2/2 |
| 10 | type | `SphericalGroundVisualMeshRequest` | `<module>` | descriptive-other: Type that configures the optional spherical ground visual receiver mesh. | entity/value | none |
| 12 | property | `kind` | `SphericalGroundVisualMeshRequest` | descriptive-other: Selected visual mesh shape. | entity/value | none |
| 17 | property | `xExtent` | `SphericalGroundVisualMeshRequest` | descriptive-other: Override local patch half width in scene units. | entity/value | none |
| 22 | property | `zMin` | `SphericalGroundVisualMeshRequest` | descriptive-other: Override local patch minimum forward/depth coordinate in scene units. | entity/value | none |
| 27 | property | `zMax` | `SphericalGroundVisualMeshRequest` | descriptive-other: Override local patch maximum forward/depth coordinate in scene units. | entity/value | none |
| 34 | property | `surfaceLift` | `SphericalGroundVisualMeshRequest` | descriptive-other: Lift local patch vertices outward from the spherical surface in scene units. This is ... | entity/value | none |
| 38 | type | `SphericalEarthGeometryConfig` | `<module>` | descriptive-other: Type that configures spherical Earth atmosphere geometry. | entity/value | none |
| 40 | property | `bottomRadius` | `SphericalEarthGeometryConfig` | descriptive-other: Value that stores ground radius with its physical unit. | entity/value | none |
| 43 | property | `topRadius` | `SphericalEarthGeometryConfig` | descriptive-other: Value that stores top atmosphere radius with its physical unit. | entity/value | none |
| 46 | property | `observerHeight` | `SphericalEarthGeometryConfig` | descriptive-other: Value that stores observer height above the ground radius with its physical unit. | entity/value | none |
| 49 | property | `observerUpDirection` | `SphericalEarthGeometryConfig` | descriptive-other: Value that stores observer up direction. | entity/value | none |
| 52 | property | `sceneFrame` | `SphericalEarthGeometryConfig` | descriptive-other: Value that stores how Three scene directions map into spherical model space. | entity/value | none |
| 55 | property | `directionToSource` | `SphericalEarthGeometryConfig` | descriptive-other: Value that stores the configured direction from a sample toward the source. | entity/value | none |
| 58 | property | `cacheAltitudeBinCount` | `SphericalEarthGeometryConfig` | descriptive-other: Value that stores the selected spherical cache position-domain node count. | entity/value | none |
| 61 | property | `cacheBoundaryAltitude` | `SphericalEarthGeometryConfig` | descriptive-other: Value that stores minimum cache altitude with its physical unit. | entity/value | none |
| 64 | property | `sourceTransmittanceIntervalCount` | `SphericalEarthGeometryConfig` | descriptive-other: Value that stores source-path optical-depth integration interval count. | entity/value | none |
| 73 | type | `SphericalEarthSceneFrameKind` | `<module>` | descriptive-other: Type that selects how Three scene axes map into spherical model space. - **"observer-... | entity/value | union bullets 2/2 |
| 76 | type | `SphericalEarthSceneFrameConfig` | `<module>` | descriptive-other: Type that configures scene-direction basis mapping for spherical shader setup. | entity/value | none |
| 80 | property | `kind` | `SphericalEarthSceneFrameConfig` | descriptive-other: Use observer-local axes or direct model-space axes. | entity/value | none |
| 84 | type | `SphericalEarthSceneFrame` | `<module>` | descriptive-other: Type that stores a normalized scene-to-model frame owned by spherical geometry. | entity/value | none |
| 86 | property | `kind` | `SphericalEarthSceneFrame` | descriptive-other: Value that identifies how Three scene axes map into spherical model space. | entity/value | none |
| 88 | property | `up` | `SphericalEarthSceneFrame` | descriptive-other: Value that stores the model-space up direction. | entity/value | none |
| 90 | property | `right` | `SphericalEarthSceneFrame` | descriptive-other: Value that stores the model-space right direction. | entity/value | none |
| 92 | property | `forward` | `SphericalEarthSceneFrame` | descriptive-other: Value that stores the model-space forward direction. | entity/value | none |
| 96 | type | `SphericalEarthGeometryConfiguration` | `<module>` | descriptive-other: Type that stores normalized executable spherical geometry configuration. | entity/value | none |
| 98 | property | `bottomRadius` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the normalized ground radius. | entity/value | none |
| 100 | property | `topRadius` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the normalized top-atmosphere radius. | entity/value | none |
| 102 | property | `observerHeight` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the normalized observer height above ground. | entity/value | none |
| 104 | property | `observerUpDirection` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the observer's model-space up direction. | entity/value | none |
| 106 | property | `observerLocalSceneFrame` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the derived observer-local frame. | entity/value | none |
| 108 | property | `sceneFrame` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the selected executable scene-to-model frame. | entity/value | none |
| 110 | property | `directionToSource` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the direction from a sample toward the source. | entity/value | none |
| 112 | property | `cacheAltitudeBinCount` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the selected cache altitude-bin count. | entity/value | none |
| 114 | property | `cacheBoundaryAltitude` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the normalized minimum cache altitude. | entity/value | none |
| 116 | property | `sourceTransmittanceIntervalCount` | `SphericalEarthGeometryConfiguration` | descriptive-other: Value that stores the source-path integration interval count. | entity/value | none |

## `src/algorithm32/geometry/spherical/types/SphericalEarthGeometry.d.ts`

Source: [src/algorithm32/geometry/spherical/types/SphericalEarthGeometry.d.ts](../../../../../../src/algorithm32/geometry/spherical/types/SphericalEarthGeometry.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `SphericalAtmospherePathRay` | `<module>` | descriptive-other: Normalized physical ray used only by spherical atmosphere-path sampling. | entity/value | none |
| 4 | property | `origin` | `SphericalAtmospherePathRay` | descriptive-other: Physical ray origin in meters. | entity/value | none |
| 6 | property | `direction` | `SphericalAtmospherePathRay` | descriptive-other: Normalized physical ray direction. | entity/value | none |

## `src/algorithm32/geometry/spherical/types/SphericalScatteringCacheGeometry.d.ts`

Source: [src/algorithm32/geometry/spherical/types/SphericalScatteringCacheGeometry.d.ts](../../../../../../src/algorithm32/geometry/spherical/types/SphericalScatteringCacheGeometry.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ScatteringCacheDirectionFrame` | `<module>` | descriptive-other: Source-aligned physical direction basis used by spherical cache conversion. | entity/value | none |
| 4 | property | `xAxis` | `ScatteringCacheDirectionFrame` | descriptive-other: Physical source-aligned X axis. | entity/value | none |
| 6 | property | `yAxis` | `ScatteringCacheDirectionFrame` | descriptive-other: Physical source-aligned Y axis. | entity/value | none |
| 8 | property | `zAxis` | `ScatteringCacheDirectionFrame` | descriptive-other: Physical source-aligned Z axis. | entity/value | none |
| 17 | type | `SphericalDirectionFrameNormalization` | `<module>` | descriptive-other: Normalization order retained by one spherical cache-direction frame. - **"fibonacci"*... | entity/value | union bullets 2/2 |
| 20 | type | `SphericalTransportTap` | `<module>` | descriptive-other: Aggregated transport tap used only by spherical transport packing. | entity/value | none |
| 22 | property | `sourceDirectionIndex` | `SphericalTransportTap` | descriptive-other: Source direction index in the selected construction domain. | entity/value | none |
| 24 | property | `sourcePositionIndex` | `SphericalTransportTap` | descriptive-other: Source position index in the selected construction domain. | entity/value | none |
| 26 | property | `coefficients` | `SphericalTransportTap` | descriptive-other: Spectral path coefficients for the aggregated tap. | entity/value | none |
| 30 | type | `SphericalTransportQueryRequest` | `<module>` | descriptive-other: Internal physical request for one spherical transport query. | entity/value | none |
| 32 | property | `atmosphere` | `SphericalTransportQueryRequest` | descriptive-other: Atmosphere medium sampler for path extinction. | entity/value | none |
| 34 | property | `direction` | `SphericalTransportQueryRequest` | descriptive-other: Physical incoming-radiance direction. | entity/value | none |
| 36 | property | `directionStencil` | `SphericalTransportQueryRequest` | descriptive-other: Outgoing-domain interpolation stencil for the physical direction. | entity/value | none |
| 38 | property | `intervalCount` | `SphericalTransportQueryRequest` | descriptive-other: Accepted transport integration interval count. | entity/value | none |
| 40 | property | `positionCount` | `SphericalTransportQueryRequest` | descriptive-other: Selected construction position count. | entity/value | none |
| 42 | property | `positionNode` | `SphericalTransportQueryRequest` | descriptive-other: Selected construction position node. | entity/value | none |

## `src/algorithm32/geometry/types.d.ts`

Source: [src/algorithm32/geometry/types.d.ts](../../../../../../src/algorithm32/geometry/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `GeometrySourceRelativePositionRequest` | `<module>` | descriptive-other: Model-space facts for source-relative position resolution. | entity/value | none |
| 4 | property | `position` | `GeometrySourceRelativePositionRequest` | descriptive-other: Physical model-space sample position. | entity/value | none |
| 6 | property | `atmosphereCoordinate` | `GeometrySourceRelativePositionRequest` | descriptive-other: Geometry-resolved atmosphere coordinate for the sample, when available. | entity/value | none |
| 8 | property | `viewDirection` | `GeometrySourceRelativePositionRequest` | descriptive-other: Normalized model-space view direction at the sample, when available. | entity/value | none |
| 12 | type | `GeometrySceneScaleRequest` | `<module>` | descriptive-other: Scene-scale facts for geometry-owned scene/model mapping. | entity/value | none |
| 14 | property | `sceneScale` | `GeometrySceneScaleRequest` | descriptive-other: Renderer scene-to-physical scale. | entity/value | none |
| 18 | type | `GeometryGroundOffsetScenePointRequest` | `<module>` | descriptive-other: Scene-scale and ground-height facts for geometry-owned ground-offset mapping. | entity/value | none |
| 21 | property | `heightAboveGround` | `GeometryGroundOffsetScenePointRequest` | descriptive-other: Requested height above the geometry-owned ground. | entity/value | none |
| 25 | interface | `GeometryModel` | `<module>` | descriptive-other: Contract that provides configured Algorithm32 geometry facts used by algorithm execut... | entity/value | none |
| 27 | property | `id` | `GeometryModel` | descriptive-other: Value that identifies this configured geometry model instance for compatibility and c... | entity/value | none |
| 35 | method | `resolveViewRaySegment` | `GeometryModel` | call-this-method: Call this method to resolve the finite view ray segment Algorithm32 should integrate. | active-callable | params 1/1; returns tagged |
| 43 | method | `resolveAtmosphereCoordinate` | `GeometryModel` | call-this-method: Call this method to resolve model-space position into atmosphere coordinates. | active-callable | params 1/1; returns tagged |
| 51 | method | `resolveGroundRelativePosition` | `GeometryModel` | call-this-method: Call this method to optionally express a model-space position relative to the geometr... | active-callable | params 1/1; returns tagged |
| 60 | method | `resolveAtmospherePath` | `GeometryModel` | call-this-method: Call this method to resolve a model-space path into an atmosphere path for optical de... | active-callable | params 1/1; returns tagged |
| 69 | method | `resolveSourceRelativePosition` | `GeometryModel` | call-this-method: Call this method to resolve a model-space sample into source-relative coordinates. | active-callable | params 1/1; returns tagged |
| 78 | method | `resolveScatteringCachePositionStencil` | `GeometryModel` | call-this-method: Call this method to resolve a physical sample point into actual position-domain cache... | active-callable | params 1/1; returns tagged |
| 89 | method | `resolveScatteringCacheConstructionPositionStencil` | `GeometryModel` | call-this-method: Call this method to resolve the geometry-selected construction-time position lookup. ... | active-callable | params 1/1; returns tagged |
| 100 | method | `expressScatteringCacheDirection` | `GeometryModel` | call-this-method: Call this method to express an outgoing physical direction in the source-relative fra... | active-callable | params 1/1; returns tagged |
| 108 | method | `resolveScatteringCacheDirectionStencil` | `GeometryModel` | call-this-method: Call this method to resolve an outgoing physical direction into the active scattering... | active-callable | params 1/1; returns tagged |
| 116 | method | `resolveGroundIntersection` | `GeometryModel` | call-this-method: Call this method to resolve the physical ground intersection and outward normal for a... | active-callable | params 1/1; returns tagged |
| 125 | method | `resolveCacheBuildRay` | `GeometryModel` | call-this-method: Call this method to optionally resolve a cache-owned build coordinate into the ray se... | active-callable | params 1/1; returns tagged |
| 134 | method | `mapObserverLocalScenePointToModelPosition` | `GeometryModel` | call-this-method: Call this method to optionally map an observer-local Three scene point into the geome... | active-callable | params 2/2; returns tagged |
| 142 | method | `mapObserverLocalSceneDirectionToModelDirection` | `GeometryModel` | call-this-method: Call this method to optionally map an observer-local Three scene direction into the g... | active-callable | params 1/1; returns tagged |
| 151 | method | `mapGroundOffsetToScenePoint` | `GeometryModel` | call-this-method: Call this method to optionally map an app-authored ground offset into the configured ... | active-callable | params 2/2; returns tagged |
| 161 | method | `projectScenePointToGroundAlongDirection` | `GeometryModel` | call-this-method: Call this method to optionally project a renderer scene point onto the geometry-owned... | active-callable | params 3/3; returns tagged |
| 174 | method | `createThreeEndpointObjects` | `GeometryModel` | call-this-method: Call this method to optionally create geometry-owned Three endpoint objects, includin... | active-callable | params 1/1; returns tagged |
| 183 | method | `resolveSceneDepthMax` | `GeometryModel` | call-this-method: Call this method to optionally resolve the default scene-depth capture cap for geomet... | active-callable | params 1/1; returns tagged |
| 191 | method | `createShaderContribution` | `GeometryModel` | call-this-method: Call this method to optionally contribute geometry-owned shader source, symbols, and ... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/gpu-assembler/base/types.d.ts`

Source: [src/algorithm32/gpu-assembler/base/types.d.ts](../../../../../../src/algorithm32/gpu-assembler/base/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 12 | type | `ShaderOwnerId` | `<module>` | descriptive-other: Shader-contribution owner identity. - **"runtime"** - The shared runtime skeleton own... | entity/value | union bullets 7/7 |
| 21 | type | `ShaderUpdateFrequency` | `<module>` | descriptive-other: Expected shader-binding update cadence. - **"setup"** - A value established during ru... | entity/value | union bullets 3/3 |
| 30 | type | `ShaderBindingKind` | `<module>` | descriptive-other: Kind of binding consumed by a shader contribution. - **"uniform"** - A scalar or vect... | entity/value | union bullets 3/3 |
| 48 | type | `ShaderSourceSlot` | `<module>` | descriptive-other: Shader-source assembly slot. - **"declareTypes"** - Type declarations emitted before ... | entity/value | union bullets 12/12 |
| 68 | type | `ShaderContributionConfigurationRequiredProperty` | `<module>` | descriptive-other: Shader-contribution property required before optional fields are supplied. - **"id"**... | entity/value | union bullets 2/2 |
| 71 | type | `ShaderContributionConfiguration` | `<module>` | descriptive-other: Owner-supplied fields for one direct shader contribution. | entity/value | none |
| 75 | type | `ShaderBindingRequirement` | `<module>` | descriptive-other: Runtime shader-binding requirement. | entity/value | none |
| 77 | property | `id` | `ShaderBindingRequirement` | descriptive-other: Stable binding identifier. | entity/value | none |
| 80 | property | `owner` | `ShaderBindingRequirement` | descriptive-other: Owner requesting the binding. | entity/value | none |
| 83 | property | `kind` | `ShaderBindingRequirement` | descriptive-other: Binding kind. | entity/value | none |
| 86 | property | `updateFrequency` | `ShaderBindingRequirement` | descriptive-other: Value that updates frequency. | entity/value | none |
| 89 | property | `valueKey` | `ShaderBindingRequirement` | descriptive-other: Runtime value key used by the binder. | entity/value | none |
| 92 | property | `required` | `ShaderBindingRequirement` | descriptive-other: Requirement for setup failure when the value is unavailable. | entity/value | none |
| 96 | type | `ShaderUniformDeclaration` | `<module>` | descriptive-other: Shader-uniform declaration. | entity/value | none |
| 98 | property | `name` | `ShaderUniformDeclaration` | descriptive-other: GLSL uniform name. | entity/value | none |
| 101 | property | `type` | `ShaderUniformDeclaration` | descriptive-other: GLSL uniform type. | entity/value | none |
| 104 | property | `valueKey` | `ShaderUniformDeclaration` | descriptive-other: Runtime value key. | entity/value | none |
| 107 | property | `defaultValue` | `ShaderUniformDeclaration` | descriptive-other: Optional owner-supplied default used before a live runtime value is available. | entity/value | none |
| 111 | type | `ShaderTextureDeclaration` | `<module>` | descriptive-other: Shader-texture sampler declaration. | entity/value | none |
| 113 | property | `name` | `ShaderTextureDeclaration` | descriptive-other: GLSL texture-uniform name. | entity/value | none |
| 116 | property | `type` | `ShaderTextureDeclaration` | descriptive-other: GLSL sampler type. | entity/value | none |
| 119 | property | `valueKey` | `ShaderTextureDeclaration` | descriptive-other: Runtime value key. | entity/value | none |
| 123 | type | `ShaderSourceBlock` | `<module>` | descriptive-other: Ordered GLSL source block. | entity/value | none |
| 125 | property | `id` | `ShaderSourceBlock` | descriptive-other: Stable block identifier. | entity/value | none |
| 128 | property | `slot` | `ShaderSourceBlock` | descriptive-other: Assembly slot. | entity/value | none |
| 131 | property | `order` | `ShaderSourceBlock` | descriptive-other: Slot-local ordering value. | entity/value | none |
| 134 | property | `code` | `ShaderSourceBlock` | descriptive-other: GLSL source code. | entity/value | none |
| 138 | type | `ShaderContribution` | `<module>` | descriptive-other: Owner-provided shader contribution. | entity/value | none |
| 140 | property | `id` | `ShaderContribution` | descriptive-other: Stable contribution identifier. | entity/value | none |
| 143 | property | `owner` | `ShaderContribution` | descriptive-other: Contribution owner. | entity/value | none |
| 146 | property | `provides` | `ShaderContribution` | descriptive-other: Shader symbols provided by this contribution. | entity/value | none |
| 149 | property | `requires` | `ShaderContribution` | descriptive-other: Shader symbols required by this contribution. | entity/value | none |
| 152 | property | `defines` | `ShaderContribution` | descriptive-other: Define lines emitted before uniforms and functions. | entity/value | none |
| 155 | property | `uniforms` | `ShaderContribution` | descriptive-other: Uniform declarations. | entity/value | none |
| 158 | property | `textures` | `ShaderContribution` | descriptive-other: Texture declarations. | entity/value | none |
| 161 | property | `functions` | `ShaderContribution` | descriptive-other: GLSL function, type, and helper blocks. | entity/value | none |
| 164 | property | `mainHooks` | `ShaderContribution` | descriptive-other: Ordered main-body hook blocks. | entity/value | none |
| 167 | property | `bindingRequirements` | `ShaderContribution` | descriptive-other: Runtime binding requirements. | entity/value | none |
| 170 | property | `diagnostics` | `ShaderContribution` | descriptive-other: Optional owner diagnostics for tests and tooling. | entity/value | none |
| 174 | type | `ShaderContributionRequest` | `<module>` | descriptive-other: Context for an owner-provided shader-contribution method. | entity/value | none |
| 176 | property | `executionOptions` | `ShaderContributionRequest` | descriptive-other: Accepted execution options for configuration-dependent source or binding defaults. | entity/value | none |

## `src/algorithm32/gpu-assembler/cache-pass/types.d.ts`

Source: [src/algorithm32/gpu-assembler/cache-pass/types.d.ts](../../../../../../src/algorithm32/gpu-assembler/cache-pass/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 11 | type | `CacheBuildOwner` | `<module>` | descriptive-other: Owner of one cache-construction module. - **"lightSource"** - The atmospheric light-s... | entity/value | union bullets 6/6 |
| 20 | type | `CacheShaderPhase` | `<module>` | descriptive-other: Construction-shader phase containing one source block. - **"declare"** - Global decla... | entity/value | union bullets 3/3 |
| 23 | type | `CacheShaderBlock` | `<module>` | descriptive-other: Type that supplies one deterministically ordered construction-source block. | entity/value | none |
| 24 | property | `id` | `CacheShaderBlock` | descriptive-other: Id value. | entity/value | none |
| 25 | property | `phase` | `CacheShaderBlock` | descriptive-other: Phase value. | entity/value | none |
| 26 | property | `order` | `CacheShaderBlock` | descriptive-other: Order value. | entity/value | none |
| 27 | property | `source` | `CacheShaderBlock` | descriptive-other: Source value. | entity/value | none |
| 37 | type | `CacheBindingKind` | `<module>` | descriptive-other: Kind of one declarative cache-construction binding. - **"uniform"** - A runtime shade... | entity/value | union bullets 3/3 |
| 46 | type | `CacheBindingFrequency` | `<module>` | descriptive-other: Type that represents the update frequency of one cache-construction binding. - **"bui... | entity/value | union bullets 3/3 |
| 49 | type | `CacheBindingSpec` | `<module>` | descriptive-other: Type that describes one shader binding independently of its value. | entity/value | none |
| 50 | property | `id` | `CacheBindingSpec` | descriptive-other: Id value. | entity/value | none |
| 51 | property | `name` | `CacheBindingSpec` | descriptive-other: Name value. | entity/value | none |
| 52 | property | `kind` | `CacheBindingSpec` | descriptive-other: Kind value. | entity/value | none |
| 53 | property | `shaderType` | `CacheBindingSpec` | descriptive-other: Shader type value. | entity/value | none |
| 54 | property | `frequency` | `CacheBindingSpec` | descriptive-other: Frequency value. | entity/value | none |
| 58 | type | `CacheUniformBinding` | `<module>` | descriptive-other: Pairing of one uniform specification with the value its shader type accepts. | entity/value | none |
| 60 | property | `spec` | `CacheUniformBinding` | descriptive-other: Spec value. | entity/value | none |
| 62 | property | `kind` | `CacheUniformBinding` | descriptive-other: Kind value. | entity/value | none |
| 63 | property | `shaderType` | `CacheUniformBinding` | descriptive-other: Shader type value. | entity/value | none |
| 65 | property | `value` | `CacheUniformBinding` | descriptive-other: Value value. | entity/value | none |
| 68 | property | `spec` | `CacheUniformBinding` | descriptive-other: Spec value. | entity/value | none |
| 70 | property | `kind` | `CacheUniformBinding` | descriptive-other: Kind value. | entity/value | none |
| 71 | property | `shaderType` | `CacheUniformBinding` | descriptive-other: Shader type value. | entity/value | none |
| 73 | property | `value` | `CacheUniformBinding` | descriptive-other: Value value. | entity/value | none |
| 76 | property | `spec` | `CacheUniformBinding` | descriptive-other: Spec value. | entity/value | none |
| 78 | property | `kind` | `CacheUniformBinding` | descriptive-other: Kind value. | entity/value | none |
| 79 | property | `shaderType` | `CacheUniformBinding` | descriptive-other: Shader type value. | entity/value | none |
| 81 | property | `value` | `CacheUniformBinding` | descriptive-other: Value value. | entity/value | none |
| 84 | property | `spec` | `CacheUniformBinding` | descriptive-other: Spec value. | entity/value | none |
| 86 | property | `kind` | `CacheUniformBinding` | descriptive-other: Kind value. | entity/value | none |
| 87 | property | `shaderType` | `CacheUniformBinding` | descriptive-other: Shader type value. | entity/value | none |
| 89 | property | `value` | `CacheUniformBinding` | descriptive-other: Value value. | entity/value | none |
| 92 | property | `spec` | `CacheUniformBinding` | descriptive-other: Spec value. | entity/value | none |
| 94 | property | `kind` | `CacheUniformBinding` | descriptive-other: Kind value. | entity/value | none |
| 95 | property | `shaderType` | `CacheUniformBinding` | descriptive-other: Shader type value. | entity/value | none |
| 97 | property | `value` | `CacheUniformBinding` | descriptive-other: Value value. | entity/value | none |
| 106 | type | `CacheDataShaderType` | `<module>` | descriptive-other: Shader sampler type accepted by one packed cache-data binding. - **"sampler2D"** - A ... | entity/value | union bullets 2/2 |
| 114 | type | `CacheBindingRuntimeFrequency` | `<module>` | descriptive-other: Stable runtime frequency accepted by data and define cache bindings. - **"build"** - ... | entity/value | union bullets 2/2 |
| 117 | type | `CacheDataBinding` | `<module>` | descriptive-other: Pairing of one packed-data specification with its normalized values. | entity/value | none |
| 118 | property | `spec` | `CacheDataBinding` | descriptive-other: Spec value. | entity/value | none |
| 120 | property | `kind` | `CacheDataBinding` | descriptive-other: Kind value. | entity/value | none |
| 121 | property | `shaderType` | `CacheDataBinding` | descriptive-other: Shader type value. | entity/value | none |
| 122 | property | `frequency` | `CacheDataBinding` | descriptive-other: Frequency value. | entity/value | none |
| 124 | property | `value` | `CacheDataBinding` | descriptive-other: Value value. | entity/value | none |
| 133 | type | `CacheDefineScalarType` | `<module>` | descriptive-other: Numeric shader type accepted by one scalar cache definition. - **"int"** - An integer... | entity/value | union bullets 2/2 |
| 136 | type | `CacheDefineBinding` | `<module>` | descriptive-other: Pairing of one compile-time specification with its scalar literal. | entity/value | none |
| 138 | property | `spec` | `CacheDefineBinding` | descriptive-other: Spec value. | entity/value | none |
| 140 | property | `kind` | `CacheDefineBinding` | descriptive-other: Kind value. | entity/value | none |
| 141 | property | `shaderType` | `CacheDefineBinding` | descriptive-other: Shader type value. | entity/value | none |
| 142 | property | `frequency` | `CacheDefineBinding` | descriptive-other: Frequency value. | entity/value | none |
| 144 | property | `value` | `CacheDefineBinding` | descriptive-other: Value value. | entity/value | none |
| 147 | property | `spec` | `CacheDefineBinding` | descriptive-other: Spec value. | entity/value | none |
| 149 | property | `kind` | `CacheDefineBinding` | descriptive-other: Kind value. | entity/value | none |
| 150 | property | `shaderType` | `CacheDefineBinding` | descriptive-other: Shader type value. | entity/value | none |
| 151 | property | `frequency` | `CacheDefineBinding` | descriptive-other: Frequency value. | entity/value | none |
| 153 | property | `value` | `CacheDefineBinding` | descriptive-other: Value value. | entity/value | none |
| 157 | type | `CacheBinding` | `<module>` | descriptive-other: Pairing of one construction binding specification with its typed value. | entity/value | none |
| 160 | type | `CacheBindingIdentity` | `<module>` | descriptive-other: Canonical identity value projected from one typed cache binding. | entity/value | none |
| 168 | property | `id` | `CacheBindingIdentity` | descriptive-other: Optional packed-data identifier. | entity/value | none |
| 170 | property | `contentHash` | `CacheBindingIdentity` | descriptive-other: Canonical content hash for packed data or a spectral packet. | entity/value | none |
| 174 | type | `CacheBuildModuleDefinition` | `<module>` | descriptive-other: Type that supplies one owner module before its stable identity is derived. | entity/value | none |
| 175 | property | `id` | `CacheBuildModuleDefinition` | descriptive-other: Id value. | entity/value | none |
| 176 | property | `owner` | `CacheBuildModuleDefinition` | descriptive-other: Owner value. | entity/value | none |
| 177 | property | `provides` | `CacheBuildModuleDefinition` | descriptive-other: Shader symbols provided by the binding. | entity/value | none |
| 178 | property | `requires` | `CacheBuildModuleDefinition` | descriptive-other: Requires value. | entity/value | none |
| 179 | property | `blocks` | `CacheBuildModuleDefinition` | descriptive-other: Blocks value. | entity/value | none |
| 180 | property | `bindings` | `CacheBuildModuleDefinition` | descriptive-other: Bindings value. | entity/value | none |
| 184 | type | `CacheBuildModule` | `<module>` | descriptive-other: Type that describes one identified owner-supplied construction module. | entity/value | none |
| 186 | property | `contentHash` | `CacheBuildModule` | descriptive-other: Content hash value. | entity/value | none |
| 190 | interface | `CacheBuildContributor` | `<module>` | descriptive-other: Contract that supplies the structural GPU-construction capability owned by a model. | entity/value | none |
| 195 | method | `createCacheModule` | `CacheBuildContributor` | call-this-method: Call this method to create cache module. | active-callable | params 1/1; returns tagged |
| 199 | type | `CacheBuildContext` | `<module>` | descriptive-other: Type that supplies one typed pass view to an owner contributor. | entity/value | none |
| 200 | property | `kind` | `CacheBuildContext` | descriptive-other: Kind value. | entity/value | none |
| 201 | property | `order` | `CacheBuildContext` | descriptive-other: Order value. | entity/value | none |
| 202 | property | `inputs` | `CacheBuildContext` | descriptive-other: Inputs value. | entity/value | none |
| 203 | property | `output` | `CacheBuildContext` | descriptive-other: Output value. | entity/value | none |
| 204 | property | `options` | `CacheBuildContext` | descriptive-other: Options value. | entity/value | none |
| 206 | property | `domains` | `CacheBuildContext` | descriptive-other: Value that supplies the source-selected executable construction lattice. | entity/value | none |
| 208 | property | `pathIntervalCount` | `CacheBuildContext` | descriptive-other: Value that supplies an executable path interval count to a direct-radiance pass. | entity/value | none |
| 210 | property | `transportData` | `CacheBuildContext` | descriptive-other: Value that supplies one precomputed kernel only to a transport pass. | entity/value | none |
| 212 | property | `groundReflection` | `CacheBuildContext` | descriptive-other: Value that supplies reflective-ground work only to a reflective scatter pass. | entity/value | none |

## `src/algorithm32/gpu-assembler/cache-pass/types/CachePassAssembler.d.ts`

Source: [src/algorithm32/gpu-assembler/cache-pass/types/CachePassAssembler.d.ts](../../../../../../src/algorithm32/gpu-assembler/cache-pass/types/CachePassAssembler.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `CacheShaderBlockEntry` | `<module>` | descriptive-other: Source block paired with its deterministic cache-module position. | entity/value | none |
| 4 | property | `block` | `CacheShaderBlockEntry` | descriptive-other: Cache-module shader block. | entity/value | none |
| 6 | property | `moduleIndex` | `CacheShaderBlockEntry` | descriptive-other: Deterministic position of the owning module. | entity/value | none |
| 10 | class | `CachePassAssembler` | `<module>` | descriptive-other: Renderer-neutral assembler of owner modules into cache-pass shaders. | entity/value | none |
| 17 | method | `assemble` | `CachePassAssembler` | call-this-method: Call this method to assemble one logical pass and its executor-resolved output field. | active-callable | params 2/2; returns tagged |

## `src/algorithm32/gpu-assembler/runtime/types.d.ts`

Source: [src/algorithm32/gpu-assembler/runtime/types.d.ts](../../../../../../src/algorithm32/gpu-assembler/runtime/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | type | `ShaderSymbolValidationStatus` | `<module>` | descriptive-other: Outcome of one shader-symbol compatibility validation. - **"accepted"** - Every requi... | entity/value | union bullets 2/2 |
| 10 | type | `ShaderSymbolValidationReport` | `<module>` | descriptive-other: Type for one shader symbol validation report. | entity/value | none |
| 12 | property | `status` | `ShaderSymbolValidationReport` | descriptive-other: Value that stores whether validation accepted or rejected the request. | entity/value | none |
| 15 | property | `providedSymbols` | `ShaderSymbolValidationReport` | descriptive-other: Value that stores sorted provided symbols. | entity/value | none |
| 18 | property | `requiredSymbols` | `ShaderSymbolValidationReport` | descriptive-other: Value that stores sorted required symbols. | entity/value | none |
| 21 | property | `duplicateProvidedSymbols` | `ShaderSymbolValidationReport` | descriptive-other: Value that stores symbols provided by multiple contributions. | entity/value | none |
| 24 | property | `missingRequiredSymbols` | `ShaderSymbolValidationReport` | descriptive-other: Value that stores required symbols not provided by contributions or the runtime skele... | entity/value | none |
| 27 | property | `unusedProvidedSymbols` | `ShaderSymbolValidationReport` | descriptive-other: Value that stores provided symbols not required by the request. | entity/value | none |
| 30 | property | `warnings` | `ShaderSymbolValidationReport` | descriptive-other: Value that stores non-fatal validation messages. | entity/value | none |
| 33 | property | `errors` | `ShaderSymbolValidationReport` | descriptive-other: Value that stores fatal validation messages. | entity/value | none |
| 37 | type | `ShaderAssemblyRequest` | `<module>` | descriptive-other: Type that supplies one shader assembly request. | entity/value | none |
| 39 | property | `contributions` | `ShaderAssemblyRequest` | descriptive-other: Value that stores owner-supplied shader contributions. | entity/value | none |
| 42 | property | `mainRequiredSymbols` | `ShaderAssemblyRequest` | descriptive-other: Value that stores symbols required by the shared main skeleton. | entity/value | none |
| 45 | property | `systemProvidedSymbols` | `ShaderAssemblyRequest` | descriptive-other: Value that stores symbols supplied by the runtime skeleton rather than a contribution. | entity/value | none |
| 49 | type | `ShaderAssemblyResult` | `<module>` | descriptive-other: Type for one accepted shader assembly result. | entity/value | none |
| 51 | property | `status` | `ShaderAssemblyResult` | descriptive-other: Value that stores the accepted assembly status. | entity/value | none |
| 54 | property | `fragmentShaderSource` | `ShaderAssemblyResult` | descriptive-other: Value that stores the assembled fragment shader source. | entity/value | none |
| 57 | property | `sourceHash` | `ShaderAssemblyResult` | descriptive-other: Value that stores a stable hash of the assembled source. | entity/value | none |
| 60 | property | `contributions` | `ShaderAssemblyResult` | descriptive-other: Value that stores sorted accepted contributions. | entity/value | none |
| 63 | property | `validationReport` | `ShaderAssemblyResult` | descriptive-other: Value that stores the validation report used for assembly. | entity/value | none |
| 66 | property | `bindingRequirements` | `ShaderAssemblyResult` | descriptive-other: Value that stores sorted runtime binding requirements. | entity/value | none |
| 69 | property | `diagnostics` | `ShaderAssemblyResult` | descriptive-other: Value that stores internal assembly diagnostics. | entity/value | none |
| 73 | type | `ShaderAssembler` | `<module>` | descriptive-other: Type for a shader assembler collaborator. | entity/value | none |
| 80 | method | `assemble` | `ShaderAssembler` | call-this-method: Call this method to assemble one shader request. | active-callable | params 1/1; returns tagged |
| 84 | type | `ShaderAssemblerConfiguration` | `<module>` | descriptive-other: Type that supplies construction options for the shader assembler. | entity/value | none |
| 86 | property | `validator` | `ShaderAssemblerConfiguration` | descriptive-other: Value that stores an optional validation collaborator. | entity/value | none |
| 90 | interface | `ShaderCompatibilityValidator` | `<module>` | descriptive-other: Contract that describes the compatibility validator consumed by shader assemblers. | entity/value | none |
| 96 | method | `validate` | `ShaderCompatibilityValidator` | call-this-method: Call this method to validate contribution and symbol compatibility. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/gpu-assembler/runtime/types/Algorithm32ShaderAssembler.d.ts`

Source: [src/algorithm32/gpu-assembler/runtime/types/Algorithm32ShaderAssembler.d.ts](../../../../../../src/algorithm32/gpu-assembler/runtime/types/Algorithm32ShaderAssembler.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ShaderConfigurationError` | `<module>` | descriptive-other: Shader-configuration error with its machine-readable failure details. | entity/value | none |
| 4 | property | `code` | `ShaderConfigurationError` | descriptive-other: Stable machine-readable shader-validation failure code. | entity/value | none |
| 7 | property | `details` | `ShaderConfigurationError` | descriptive-other: Compatibility report that caused shader assembly to fail. | entity/value | none |
| 11 | type | `ShaderContributionLineEntry` | `<module>` | descriptive-other: Contribution-owned source line used for deterministic assembly ordering. | entity/value | none |
| 13 | property | `contribution` | `ShaderContributionLineEntry` | descriptive-other: Contribution that owns the source line. | entity/value | none |
| 16 | property | `line` | `ShaderContributionLineEntry` | descriptive-other: Source line ordered within its contribution group. | entity/value | none |
| 25 | type | `ShaderSourceBlockProperty` | `<module>` | descriptive-other: Contribution property containing ordered shader source blocks. - **"functions"** - Fu... | entity/value | union bullets 2/2 |

## `src/algorithm32/gpu-runtime/cache/three/types.d.ts`

Source: [src/algorithm32/gpu-runtime/cache/three/types.d.ts](../../../../../../src/algorithm32/gpu-runtime/cache/three/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ThreeCacheBackendNamespace` | `<module>` | descriptive-other: Three runtime values required by the cache backend boundary. | entity/value | none |
| 4 | property | `REVISION` | `ThreeCacheBackendNamespace` | descriptive-other: Three release-revision runtime value. | entity/value | none |
| 6 | property | `RedFormat` | `ThreeCacheBackendNamespace` | descriptive-other: Red texture-format runtime value. | entity/value | none |
| 8 | property | `FloatType` | `ThreeCacheBackendNamespace` | descriptive-other: Float texture-type runtime value. | entity/value | none |
| 10 | property | `NearestFilter` | `ThreeCacheBackendNamespace` | descriptive-other: Nearest-neighbor filter runtime value. | entity/value | none |
| 12 | property | `ClampToEdgeWrapping` | `ThreeCacheBackendNamespace` | descriptive-other: Edge-clamping wrap runtime value. | entity/value | none |
| 14 | property | `GLSL3` | `ThreeCacheBackendNamespace` | descriptive-other: GLSL 3 version runtime value. | entity/value | none |
| 16 | property | `NoBlending` | `ThreeCacheBackendNamespace` | descriptive-other: Disabled-blending runtime value. | entity/value | none |
| 18 | property | `Vector3` | `ThreeCacheBackendNamespace` | descriptive-other: Three-dimensional vector-constructor runtime value. | entity/value | none |
| 20 | property | `Vector4` | `ThreeCacheBackendNamespace` | descriptive-other: Four-dimensional vector-constructor runtime value. | entity/value | none |
| 22 | property | `WebGLArrayRenderTarget` | `ThreeCacheBackendNamespace` | descriptive-other: Scalar array render-target-constructor runtime value. | entity/value | none |
| 24 | property | `DataTexture` | `ThreeCacheBackendNamespace` | descriptive-other: Two-dimensional data-texture-constructor runtime value. | entity/value | none |
| 26 | property | `DataArrayTexture` | `ThreeCacheBackendNamespace` | descriptive-other: Array data-texture-constructor runtime value. | entity/value | none |
| 28 | property | `BufferGeometry` | `ThreeCacheBackendNamespace` | descriptive-other: Buffer-geometry-constructor runtime value. | entity/value | none |
| 30 | property | `BufferAttribute` | `ThreeCacheBackendNamespace` | descriptive-other: Buffer-attribute-constructor runtime value. | entity/value | none |
| 32 | property | `RawShaderMaterial` | `ThreeCacheBackendNamespace` | descriptive-other: Raw-shader-material-constructor runtime value. | entity/value | none |
| 34 | property | `Mesh` | `ThreeCacheBackendNamespace` | descriptive-other: Mesh-constructor runtime value. | entity/value | none |
| 36 | property | `Scene` | `ThreeCacheBackendNamespace` | descriptive-other: Scene-constructor runtime value. | entity/value | none |
| 38 | property | `Camera` | `ThreeCacheBackendNamespace` | descriptive-other: Camera-constructor runtime value. | entity/value | none |
| 42 | type | `ThreeCacheBackendRenderer` | `<module>` | descriptive-other: Renderer runtime values required by the cache backend boundary. | entity/value | none |
| 44 | property | `capabilities` | `ThreeCacheBackendRenderer` | descriptive-other: Renderer-capabilities runtime value. | entity/value | none |
| 46 | property | `getContext` | `ThreeCacheBackendRenderer` | descriptive-other: WebGL-context-access runtime value. | entity/value | none |
| 48 | property | `getRenderTarget` | `ThreeCacheBackendRenderer` | descriptive-other: Active-render-target-access runtime value. | entity/value | none |
| 50 | property | `getActiveCubeFace` | `ThreeCacheBackendRenderer` | descriptive-other: Active-cube-face-access runtime value. | entity/value | none |
| 52 | property | `getActiveMipmapLevel` | `ThreeCacheBackendRenderer` | descriptive-other: Active-mip-level-access runtime value. | entity/value | none |
| 54 | property | `getViewport` | `ThreeCacheBackendRenderer` | descriptive-other: Viewport-access runtime value. | entity/value | none |
| 56 | property | `getScissor` | `ThreeCacheBackendRenderer` | descriptive-other: Scissor-rectangle-access runtime value. | entity/value | none |
| 58 | property | `getScissorTest` | `ThreeCacheBackendRenderer` | descriptive-other: Scissor-test-state-access runtime value. | entity/value | none |
| 60 | property | `setRenderTarget` | `ThreeCacheBackendRenderer` | descriptive-other: Value that renders-target-selection runtime value. | entity/value | none |
| 62 | property | `setViewport` | `ThreeCacheBackendRenderer` | descriptive-other: Viewport-selection runtime value. | entity/value | none |
| 64 | property | `setScissor` | `ThreeCacheBackendRenderer` | descriptive-other: Scissor-rectangle-selection runtime value. | entity/value | none |
| 66 | property | `setScissorTest` | `ThreeCacheBackendRenderer` | descriptive-other: Scissor-test-selection runtime value. | entity/value | none |
| 68 | property | `compileAsync` | `ThreeCacheBackendRenderer` | descriptive-other: Optional asynchronous compilation runtime value. | entity/value | none |
| 70 | property | `compile` | `ThreeCacheBackendRenderer` | descriptive-other: Synchronous compilation runtime value. | entity/value | none |
| 72 | property | `render` | `ThreeCacheBackendRenderer` | descriptive-other: Scene-rendering runtime value. | entity/value | none |
| 76 | type | `ThreeCacheBackendRequest` | `<module>` | descriptive-other: Three namespace and renderer request accepted by the cache backend. | entity/value | none |
| 78 | property | `THREE` | `ThreeCacheBackendRequest` | descriptive-other: Three runtime namespace adapted by the cache backend. | entity/value | none |
| 80 | property | `renderer` | `ThreeCacheBackendRequest` | descriptive-other: Renderer runtime value adapted by the cache backend. | entity/value | none |
| 84 | type | `ThreeWebglRendererDiagnostic` | `<module>` | descriptive-other: Browser renderer identity and implementation assessment reported by the Three/WebGL l... | entity/value | none |
| 86 | property | `vendor` | `ThreeWebglRendererDiagnostic` | descriptive-other: Renderer-vendor identity reported by WebGL. | entity/value | none |
| 88 | property | `renderer` | `ThreeWebglRendererDiagnostic` | descriptive-other: Renderer implementation identity reported by WebGL. | entity/value | none |
| 90 | property | `assessment` | `ThreeWebglRendererDiagnostic` | descriptive-other: Hardware, software, or unavailable renderer assessment. | entity/value | none |
| 94 | type | `ThreeWebglRendererStateRestoration` | `<module>` | descriptive-other: Captured browser renderer-state restoration operation. | entity/value | none |
| 96 | method | `restore` | `ThreeWebglRendererStateRestoration` | call-this-method: Call this method to restore the captured renderer state. | active-callable | none |
| 100 | type | `ThreeWebglScalarPassResources` | `<module>` | descriptive-other: Browser-owned resources for one fullscreen scalar-writing pass. | entity/value | none |
| 102 | property | `material` | `ThreeWebglScalarPassResources` | descriptive-other: Raw shader material used by the scalar pass. | entity/value | none |
| 104 | property | `geometry` | `ThreeWebglScalarPassResources` | descriptive-other: Fullscreen triangle geometry used by the scalar pass. | entity/value | none |
| 106 | property | `scene` | `ThreeWebglScalarPassResources` | descriptive-other: Scene containing the fullscreen scalar-pass mesh. | entity/value | none |
| 108 | property | `camera` | `ThreeWebglScalarPassResources` | descriptive-other: Camera used to submit the fullscreen scalar pass. | entity/value | none |
| 110 | method | `dispose` | `ThreeWebglScalarPassResources` | call-this-method: Call this method to release the pass-owned material and geometry. | active-callable | none |

## `src/algorithm32/gpu-runtime/cache/three/types/ThreeCacheBackend.d.ts`

Source: [src/algorithm32/gpu-runtime/cache/three/types/ThreeCacheBackend.d.ts](../../../../../../src/algorithm32/gpu-runtime/cache/three/types/ThreeCacheBackend.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ThreeCacheBackendVector3` | `<module>` | descriptive-other: Three-dimensional vector used for one cache shader uniform. | entity/value | none |
| 4 | property | `x` | `ThreeCacheBackendVector3` | descriptive-other: First vector component. | entity/value | none |
| 6 | property | `y` | `ThreeCacheBackendVector3` | descriptive-other: Second vector component. | entity/value | none |
| 8 | property | `z` | `ThreeCacheBackendVector3` | descriptive-other: Third vector component. | entity/value | none |
| 12 | type | `ThreeCacheBackendVector4` | `<module>` | descriptive-other: Four-dimensional vector used to capture one renderer rectangle. | entity/value | none |
| 14 | property | `x` | `ThreeCacheBackendVector4` | descriptive-other: First vector component. | entity/value | none |
| 16 | property | `y` | `ThreeCacheBackendVector4` | descriptive-other: Second vector component. | entity/value | none |
| 18 | property | `z` | `ThreeCacheBackendVector4` | descriptive-other: Third vector component. | entity/value | none |
| 20 | property | `w` | `ThreeCacheBackendVector4` | descriptive-other: Fourth vector component. | entity/value | none |
| 24 | type | `ThreeCacheBackendVector3Constructor` | `<module>` | descriptive-other: Three-dimensional vector constructor used by cache uniforms. | entity/value | none |
| 27 | type | `ThreeCacheBackendVector4Constructor` | `<module>` | descriptive-other: Four-dimensional vector constructor used by renderer-state capture. | entity/value | none |
| 30 | type | `ThreeCacheBackendUniform` | `<module>` | descriptive-other: Mutable Three uniform value installed for a cache shader binding. | entity/value | none |
| 32 | property | `value` | `ThreeCacheBackendUniform` | descriptive-other: Current value supplied to the shader uniform. | entity/value | none |
| 36 | type | `ThreeCacheBackendTexture` | `<module>` | descriptive-other: Mutable Three texture state required by scalar cache resources. | entity/value | none |
| 38 | property | `format` | `ThreeCacheBackendTexture` | descriptive-other: Pixel format of the texture. | entity/value | none |
| 40 | property | `type` | `ThreeCacheBackendTexture` | descriptive-other: Scalar data type of the texture. | entity/value | none |
| 42 | property | `internalFormat` | `ThreeCacheBackendTexture` | descriptive-other: GPU internal format of the texture. | entity/value | none |
| 44 | property | `minFilter` | `ThreeCacheBackendTexture` | descriptive-other: Minification filter of the texture. | entity/value | none |
| 46 | property | `magFilter` | `ThreeCacheBackendTexture` | descriptive-other: Magnification filter of the texture. | entity/value | none |
| 48 | property | `wrapS` | `ThreeCacheBackendTexture` | descriptive-other: Horizontal wrap mode of the texture. | entity/value | none |
| 50 | property | `wrapT` | `ThreeCacheBackendTexture` | descriptive-other: Vertical wrap mode of the texture. | entity/value | none |
| 52 | property | `generateMipmaps` | `ThreeCacheBackendTexture` | descriptive-other: Mipmap-generation state of the texture. | entity/value | none |
| 54 | property | `unpackAlignment` | `ThreeCacheBackendTexture` | descriptive-other: Scalar unpack alignment of the texture. | entity/value | none |
| 56 | property | `needsUpdate` | `ThreeCacheBackendTexture` | descriptive-other: Pending GPU upload state of the texture. | entity/value | none |
| 58 | method | `dispose` | `ThreeCacheBackendTexture` | call-this-method: Call this method to release the texture's renderer resource. | active-callable | none |
| 62 | type | `ThreeCacheBackendScalarArrayTargetOptions` | `<module>` | descriptive-other: Exact constructor options for one scalar R32F array render target. | entity/value | none |
| 64 | property | `format` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: Red pixel format required by the scalar target. | entity/value | none |
| 66 | property | `type` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: Float scalar type required by the scalar target. | entity/value | none |
| 68 | property | `internalFormat` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: R32F GPU internal format required by the scalar target. | entity/value | none |
| 70 | property | `minFilter` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: Nearest-neighbor minification filter required by the scalar target. | entity/value | none |
| 72 | property | `magFilter` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: Nearest-neighbor magnification filter required by the scalar target. | entity/value | none |
| 74 | property | `wrapS` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: Edge-clamping horizontal wrap mode required by the scalar target. | entity/value | none |
| 76 | property | `wrapT` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: Edge-clamping vertical wrap mode required by the scalar target. | entity/value | none |
| 78 | property | `generateMipmaps` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: Disabled mipmap generation for the scalar target. | entity/value | none |
| 80 | property | `depthBuffer` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: Disabled depth buffer for the scalar target. | entity/value | none |
| 82 | property | `stencilBuffer` | `ThreeCacheBackendScalarArrayTargetOptions` | descriptive-other: Disabled stencil buffer for the scalar target. | entity/value | none |
| 86 | type | `ThreeCacheBackendScalarArrayTarget` | `<module>` | descriptive-other: Scalar array render target owned by one cache field. | entity/value | none |
| 88 | property | `texture` | `ThreeCacheBackendScalarArrayTarget` | descriptive-other: Scalar array texture attached to the render target. | entity/value | none |
| 90 | method | `dispose` | `ThreeCacheBackendScalarArrayTarget` | call-this-method: Call this method to release the render target and its texture. | active-callable | none |
| 94 | type | `ThreeCacheBackendScalarArrayTargetConstructor` | `<module>` | descriptive-other: Scalar array render-target constructor used by cache fields. | entity/value | none |
| 102 | type | `ThreeCacheBackendDataTexture` | `<module>` | descriptive-other: Data texture owned by one compiled cache program. | entity/value | none |
| 105 | type | `ThreeCacheBackendDataTextureConstructor` | `<module>` | descriptive-other: Two-dimensional scalar data-texture constructor used by packed bindings. | entity/value | none |
| 112 | type | `ThreeCacheBackendDataArrayTextureConstructor` | `<module>` | descriptive-other: Array scalar data-texture constructor used by packed bindings. | entity/value | none |
| 120 | type | `ThreeCacheBackendBufferAttribute` | `<module>` | descriptive-other: Buffer attribute installed on the fullscreen cache geometry. | entity/value | none |
| 123 | type | `ThreeCacheBackendBufferAttributeConstructor` | `<module>` | descriptive-other: Buffer-attribute constructor used for fullscreen triangle positions. | entity/value | none |
| 129 | type | `ThreeCacheBackendBufferGeometry` | `<module>` | descriptive-other: Buffer geometry owned by one compiled cache program. | entity/value | none |
| 136 | method | `setAttribute` | `ThreeCacheBackendBufferGeometry` | call-this-method: Call this method to install a named vertex attribute. | active-callable | params 2/2; returns tagged |
| 138 | method | `dispose` | `ThreeCacheBackendBufferGeometry` | call-this-method: Call this method to release the geometry's renderer resource. | active-callable | none |
| 142 | type | `ThreeCacheBackendBufferGeometryConstructor` | `<module>` | descriptive-other: Buffer-geometry constructor used for the fullscreen cache pass. | entity/value | none |
| 145 | type | `ThreeCacheBackendRawShaderMaterialOptions` | `<module>` | descriptive-other: Exact constructor options for one raw cache shader material. | entity/value | none |
| 147 | property | `glslVersion` | `ThreeCacheBackendRawShaderMaterialOptions` | descriptive-other: GLSL 3 version required by the cache shader. | entity/value | none |
| 149 | property | `vertexShader` | `ThreeCacheBackendRawShaderMaterialOptions` | descriptive-other: Fullscreen vertex shader source of the cache program. | entity/value | none |
| 151 | property | `fragmentShader` | `ThreeCacheBackendRawShaderMaterialOptions` | descriptive-other: Assembled fragment shader source of the cache program. | entity/value | none |
| 153 | property | `uniforms` | `ThreeCacheBackendRawShaderMaterialOptions` | descriptive-other: Mutable uniform values installed for the cache program. | entity/value | none |
| 155 | property | `blending` | `ThreeCacheBackendRawShaderMaterialOptions` | descriptive-other: Disabled blending mode for scalar cache writes. | entity/value | none |
| 157 | property | `depthTest` | `ThreeCacheBackendRawShaderMaterialOptions` | descriptive-other: Disabled depth test for the fullscreen cache pass. | entity/value | none |
| 159 | property | `depthWrite` | `ThreeCacheBackendRawShaderMaterialOptions` | descriptive-other: Disabled depth writes for the fullscreen cache pass. | entity/value | none |
| 161 | property | `toneMapped` | `ThreeCacheBackendRawShaderMaterialOptions` | descriptive-other: Disabled tone mapping for physical scalar cache values. | entity/value | none |
| 163 | property | `transparent` | `ThreeCacheBackendRawShaderMaterialOptions` | descriptive-other: Opaque material state for scalar cache writes. | entity/value | none |
| 167 | type | `ThreeCacheBackendRawShaderMaterial` | `<module>` | descriptive-other: Raw shader material owned by one compiled cache program. | entity/value | none |
| 169 | property | `uniforms` | `ThreeCacheBackendRawShaderMaterial` | descriptive-other: Mutable uniform values installed for the cache program. | entity/value | none |
| 171 | method | `dispose` | `ThreeCacheBackendRawShaderMaterial` | call-this-method: Call this method to release the material's renderer resource. | active-callable | none |
| 175 | type | `ThreeCacheBackendRawShaderMaterialConstructor` | `<module>` | descriptive-other: Raw-shader-material constructor used for cache programs. | entity/value | none |
| 180 | type | `ThreeCacheBackendMesh` | `<module>` | descriptive-other: Fullscreen mesh owned by one compiled cache program. | entity/value | none |
| 182 | property | `frustumCulled` | `ThreeCacheBackendMesh` | descriptive-other: Frustum-culling state of the fullscreen mesh. | entity/value | none |
| 186 | type | `ThreeCacheBackendMeshConstructor` | `<module>` | descriptive-other: Fullscreen-mesh constructor used for cache programs. | entity/value | none |
| 192 | type | `ThreeCacheBackendScene` | `<module>` | descriptive-other: Private scene containing one fullscreen cache mesh. | entity/value | none |
| 198 | method | `add` | `ThreeCacheBackendScene` | call-this-method: Call this method to attach the fullscreen mesh to the scene. | active-callable | params 1/1; returns tagged |
| 202 | type | `ThreeCacheBackendSceneConstructor` | `<module>` | descriptive-other: Scene constructor used for the fullscreen cache pass. | entity/value | none |
| 205 | type | `ThreeCacheBackendCamera` | `<module>` | descriptive-other: Camera used to submit one fullscreen cache pass. | entity/value | none |
| 208 | type | `ThreeCacheBackendCameraConstructor` | `<module>` | descriptive-other: Camera constructor used for the fullscreen cache pass. | entity/value | none |
| 211 | type | `ThreeCacheBackendResourceNamespace` | `<module>` | descriptive-other: Exact Three resource constructors and constants used inside the cache backend. | entity/value | none |
| 213 | property | `REVISION` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Three release revision used in the backend capability identity. | entity/value | none |
| 215 | property | `RedFormat` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Red texture format constant used by scalar cache resources. | entity/value | none |
| 217 | property | `FloatType` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Float texture data-type constant used by scalar cache resources. | entity/value | none |
| 219 | property | `NearestFilter` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Nearest-neighbor filter constant used by scalar cache resources. | entity/value | none |
| 221 | property | `ClampToEdgeWrapping` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Edge-clamping wrap constant used by scalar cache resources. | entity/value | none |
| 223 | property | `GLSL3` | `ThreeCacheBackendResourceNamespace` | descriptive-other: GLSL 3 version constant used by cache materials. | entity/value | none |
| 225 | property | `NoBlending` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Disabled-blending constant used by cache materials. | entity/value | none |
| 227 | property | `Vector3` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Three-dimensional vector constructor used for shader uniforms. | entity/value | none |
| 229 | property | `Vector4` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Four-dimensional vector constructor used for renderer-state capture. | entity/value | none |
| 231 | property | `WebGLArrayRenderTarget` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Scalar array render-target constructor used for cache fields. | entity/value | none |
| 233 | property | `DataTexture` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Two-dimensional data-texture constructor used for packed bindings. | entity/value | none |
| 235 | property | `DataArrayTexture` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Array data-texture constructor used for packed bindings. | entity/value | none |
| 237 | property | `BufferGeometry` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Buffer-geometry constructor used for the fullscreen cache pass. | entity/value | none |
| 239 | property | `BufferAttribute` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Buffer-attribute constructor used for fullscreen triangle positions. | entity/value | none |
| 241 | property | `RawShaderMaterial` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Raw-shader-material constructor used for cache programs. | entity/value | none |
| 243 | property | `Mesh` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Mesh constructor used for the fullscreen cache pass. | entity/value | none |
| 245 | property | `Scene` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Scene constructor used for the fullscreen cache pass. | entity/value | none |
| 247 | property | `Camera` | `ThreeCacheBackendResourceNamespace` | descriptive-other: Camera constructor used for the fullscreen cache pass. | entity/value | none |
| 251 | type | `ThreeCacheBackendRendererCapabilities` | `<module>` | descriptive-other: Renderer capability facts consumed inside the cache backend. | entity/value | none |
| 253 | property | `isWebGL2` | `ThreeCacheBackendRendererCapabilities` | descriptive-other: WebGL2 support reported by the renderer. | entity/value | none |
| 257 | type | `ThreeCacheBackendRendererOperations` | `<module>` | descriptive-other: Exact renderer operations used inside the cache backend. | entity/value | none |
| 259 | property | `capabilities` | `ThreeCacheBackendRendererOperations` | descriptive-other: Renderer capability facts inspected by the cache boundary. | entity/value | none |
| 264 | method | `getContext` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to access the renderer's WebGL context. | active-callable | returns tagged |
| 269 | method | `getRenderTarget` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to access the renderer's active render target. | active-callable | returns tagged |
| 274 | method | `getActiveCubeFace` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to access the renderer's active cube face. | active-callable | returns tagged |
| 279 | method | `getActiveMipmapLevel` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to access the renderer's active mip level. | active-callable | returns tagged |
| 285 | method | `getViewport` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to copy the renderer viewport into a vector. | active-callable | params 1/1; returns tagged |
| 291 | method | `getScissor` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to copy the renderer scissor rectangle into a vector. | active-callable | params 1/1; returns tagged |
| 296 | method | `getScissorTest` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to access the renderer's scissor-test state. | active-callable | returns tagged |
| 303 | method | `setRenderTarget` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to select a render target, layer, and mip level. | active-callable | params 3/3 |
| 308 | method | `setViewport` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to restore a captured viewport vector. This overload accepts one cap... | active-callable | params 1/1; overload group 2 |
| 316 | method | `setViewport` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to select a numeric viewport rectangle. This overload accepts explic... | active-callable | params 4/4; overload group 2 |
| 321 | method | `setScissor` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to restore a captured scissor vector. This overload accepts one capt... | active-callable | params 1/1; overload group 2 |
| 329 | method | `setScissor` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to select a numeric scissor rectangle. This overload accepts explici... | active-callable | params 4/4; overload group 2 |
| 334 | method | `setScissorTest` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to select whether scissor testing is enabled. | active-callable | params 1/1 |
| 341 | method | `compileAsync` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to optional asynchronous cache-program compilation operation. | active-callable | params 2/2; returns tagged |
| 347 | method | `compile` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to compile one cache-program scene synchronously. | active-callable | params 2/2 |
| 353 | method | `render` | `ThreeCacheBackendRendererOperations` | call-this-method: Call this method to render one cache-program scene. | active-callable | params 2/2 |
| 357 | type | `ThreeCacheBackendRendererRecord` | `<module>` | descriptive-other: Renderer state required by cache operations that temporarily mutate Three. | entity/value | none |
| 359 | property | `THREE` | `ThreeCacheBackendRendererRecord` | descriptive-other: Three namespace used by the renderer. | entity/value | none |
| 361 | property | `renderer` | `ThreeCacheBackendRendererRecord` | descriptive-other: Renderer whose state is preserved around cache work. | entity/value | none |
| 363 | property | `context` | `ThreeCacheBackendRendererRecord` | descriptive-other: WebGL2 context underlying the renderer. | entity/value | none |
| 367 | type | `ThreeCacheBackendCapabilityInspection` | `<module>` | descriptive-other: Accepted capability inspection for one Three cache backend. | entity/value | none |
| 369 | property | `context` | `ThreeCacheBackendCapabilityInspection` | descriptive-other: WebGL2 context accepted by the backend. | entity/value | none |
| 371 | property | `capabilities` | `ThreeCacheBackendCapabilityInspection` | descriptive-other: Validated cache capabilities of the renderer. | entity/value | none |
| 375 | type | `ThreeCacheBackendRecord` | `<module>` | descriptive-other: Private mutable lifecycle state owned by one Three cache backend. | entity/value | none |
| 377 | property | `fields` | `ThreeCacheBackendRecord` | descriptive-other: Active opaque fields owned by the backend. | entity/value | none |
| 379 | property | `programs` | `ThreeCacheBackendRecord` | descriptive-other: Active opaque programs owned by the backend. | entity/value | none |
| 381 | property | `runtimeBindingSequence` | `ThreeCacheBackendRecord` | descriptive-other: Sequence used to identify runtime bindings. | entity/value | none |
| 383 | property | `disposed` | `ThreeCacheBackendRecord` | descriptive-other: Disposal state of the backend. | entity/value | none |
| 387 | type | `ThreeCacheBackendFieldRecord` | `<module>` | descriptive-other: Private mutable lifecycle state for one opaque cache field. | entity/value | none |
| 389 | property | `backend` | `ThreeCacheBackendFieldRecord` | descriptive-other: Backend state that owns the field. | entity/value | none |
| 391 | property | `id` | `ThreeCacheBackendFieldRecord` | descriptive-other: Field identity retained by the opaque handle. | entity/value | none |
| 393 | property | `storage` | `ThreeCacheBackendFieldRecord` | descriptive-other: Executable storage layout of the field. | entity/value | none |
| 395 | property | `target` | `ThreeCacheBackendFieldRecord` | descriptive-other: Scalar array render target allocated for the field. | entity/value | none |
| 397 | property | `disposed` | `ThreeCacheBackendFieldRecord` | descriptive-other: Disposal state of the field. | entity/value | none |
| 401 | type | `ThreeCacheBackendMaterialBindings` | `<module>` | descriptive-other: Uniform map and disposable data textures prepared for one cache program. | entity/value | none |
| 403 | property | `uniforms` | `ThreeCacheBackendMaterialBindings` | descriptive-other: Three uniform values keyed by shader name. | entity/value | none |
| 405 | property | `dataResources` | `ThreeCacheBackendMaterialBindings` | descriptive-other: Disposable textures created from packed data bindings. | entity/value | none |
| 409 | type | `ThreeCacheBackendProgramResources` | `<module>` | descriptive-other: Private Three resources allocated for one compiled cache program. | entity/value | none |
| 411 | property | `geometry` | `ThreeCacheBackendProgramResources` | descriptive-other: Fullscreen triangle geometry used by the cache pass. | entity/value | none |
| 413 | property | `material` | `ThreeCacheBackendProgramResources` | descriptive-other: Raw shader material used by the cache pass. | entity/value | none |
| 415 | property | `scene` | `ThreeCacheBackendProgramResources` | descriptive-other: Private scene containing the fullscreen pass mesh. | entity/value | none |
| 417 | property | `camera` | `ThreeCacheBackendProgramResources` | descriptive-other: Private camera used to submit the fullscreen pass. | entity/value | none |
| 419 | property | `dataResources` | `ThreeCacheBackendProgramResources` | descriptive-other: Disposable textures created from packed data bindings. | entity/value | none |
| 423 | type | `ThreeCacheBackendProgramRecord` | `<module>` | descriptive-other: Private mutable lifecycle state for one opaque cache program. | entity/value | none |
| 425 | property | `backend` | `ThreeCacheBackendProgramRecord` | descriptive-other: Backend state that owns the program. | entity/value | none |
| 427 | property | `output` | `ThreeCacheBackendProgramRecord` | descriptive-other: Output field specification retained by the program. | entity/value | none |
| 429 | property | `disposed` | `ThreeCacheBackendProgramRecord` | descriptive-other: Disposal state of the program. | entity/value | none |
| 433 | type | `ThreeCacheBackendRuntimeBindingRecord` | `<module>` | descriptive-other: Private association between one runtime binding and its owned field. | entity/value | none |
| 435 | property | `backend` | `ThreeCacheBackendRuntimeBindingRecord` | descriptive-other: Backend state that owns the binding. | entity/value | none |
| 437 | property | `field` | `ThreeCacheBackendRuntimeBindingRecord` | descriptive-other: Opaque cache field associated with the binding. | entity/value | none |
| 441 | type | `ThreeCacheBackendRendererStateRestorer` | `<module>` | descriptive-other: Restoration callback for caller-owned renderer state. | entity/value | none |
| 442 | callback | `<function-type>` | `ThreeCacheBackendRendererStateRestorer` | called-by: Called by three cache backend renderer state restorer to handle one invocation of the... | called-by | none |
| 445 | type | `ThreeCacheBackendRendererOperation` | `<module>` | descriptive-other: Renderer operation executed while caller-owned state is preserved. | entity/value | none |
| 449 | callback | `<function-type>` | `ThreeCacheBackendRendererOperation` | called-by: Called by three cache backend renderer operation to handle one invocation of the decl... | called-by | returns tagged |
| 452 | class | `ThreeCacheBackend` | `<module>` | descriptive-other: Three/WebGL2 adapter for Algorithm32's opaque GPU cache backend contract. | entity/value | none |
| 459 | constructor | `<anonymous@459:2>` | `ThreeCacheBackend` | creates: Creates a Three/WebGL2 cache backend after validating the renderer's scalar-array cap... | creates | params 1/1 |
| 462 | field | `id` | `ThreeCacheBackend` | descriptive-other: Unique identity of the backend and its opaque resource handles. | entity/value | none |
| 464 | field | `capabilities` | `ThreeCacheBackend` | descriptive-other: Validated GPU cache capabilities of the adapted renderer. | entity/value | none |
| 473 | method | `allocateField` | `ThreeCacheBackend` | call-this-method: Call this method to allocate one opaque scalar-array cache field owned by this backend. | active-callable | params 1/1; returns tagged |
| 481 | method | `compile` | `ThreeCacheBackend` | call-this-method: Call this method to allocate and compile one opaque cache program while preserving ca... | active-callable | params 1/1; returns tagged |
| 488 | method | `submitLayer` | `ThreeCacheBackend` | call-this-method: Call this method to submit one cache wavelength layer while restoring every caller-ow... | active-callable | params 1/1 |
| 496 | method | `createRuntimeBinding` | `ThreeCacheBackend` | call-this-method: Call this method to create one opaque runtime binding for a resident field owned by t... | active-callable | params 1/1; returns tagged |
| 503 | method | `installRuntimeBindings` | `ThreeCacheBackend` | call-this-method: Call this method to resolve opaque bindings and install their private textures into a... | active-callable | params 1/1 |
| 511 | method | `readSelectedScalars` | `ThreeCacheBackend` | call-this-method: Call this method to read selected field scalars while restoring caller-owned renderer... | active-callable | params 1/1; returns tagged |
| 513 | method | `dispose` | `ThreeCacheBackend` | call-this-method: Call this method to dispose every field and program owned by this adapter. | active-callable | none |

## `src/algorithm32/gpu-runtime/cache/types.d.ts`

Source: [src/algorithm32/gpu-runtime/cache/types.d.ts](../../../../../../src/algorithm32/gpu-runtime/cache/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | type | `CachePassKind` | `<module>` | descriptive-other: Logical cache-construction operation represented by one pass. - **"primary-j1"** - Pr... | entity/value | union bullets 5/5 |
| 13 | type | `CacheOrder` | `<module>` | descriptive-other: Type that identifies one supported internal scattering order. | entity/value | none |
| 16 | type | `CacheData` | `<module>` | descriptive-other: Type that supplies normalized packed physical data without exposing renderer resources. | entity/value | none |
| 17 | property | `id` | `CacheData` | descriptive-other: Id value. | entity/value | none |
| 18 | property | `quantity` | `CacheData` | descriptive-other: Quantity value. | entity/value | none |
| 19 | property | `units` | `CacheData` | descriptive-other: Units value. | entity/value | none |
| 20 | property | `shape` | `CacheData` | descriptive-other: Shape value. | entity/value | none |
| 21 | property | `values` | `CacheData` | descriptive-other: Values value. | entity/value | none |
| 22 | property | `contentHash` | `CacheData` | descriptive-other: Content hash value. | entity/value | none |
| 31 | type | `CacheDataDefinitionExcludedProperty` | `<module>` | descriptive-other: Canonical cache-data property replaced during definition acceptance. - **"contentHash... | entity/value | union bullets 2/2 |
| 34 | type | `CacheDataDefinition` | `<module>` | descriptive-other: Packed physical-data input before copying and stable identity derivation. | entity/value | none |
| 37 | property | `values` | `CacheDataDefinition` | descriptive-other: Array-like scalar payload copied into the cache-data value. | entity/value | none |
| 42 | type | `CachePlanReuseFacts` | `<module>` | descriptive-other: Source-owned facts included in exact cache-plan reuse identity. | entity/value | none |
| 45 | type | `CacheFieldId` | `<module>` | descriptive-other: Type that identifies one source-owned logical field. | entity/value | none |
| 48 | type | `CacheFieldStorage` | `<module>` | descriptive-other: Type that supplies executable R32F allocation facts. | entity/value | none |
| 49 | property | `format` | `CacheFieldStorage` | descriptive-other: Data format of the allocated cache field. | entity/value | none |
| 50 | property | `width` | `CacheFieldStorage` | descriptive-other: Width value. | entity/value | none |
| 51 | property | `height` | `CacheFieldStorage` | descriptive-other: Height value. | entity/value | none |
| 52 | property | `layers` | `CacheFieldStorage` | descriptive-other: Layers value. | entity/value | none |
| 56 | type | `CacheFieldSpec` | `<module>` | descriptive-other: Pairing of one logical field id with its allocation request. | entity/value | none |
| 57 | property | `id` | `CacheFieldSpec` | descriptive-other: Id value. | entity/value | none |
| 58 | property | `storage` | `CacheFieldSpec` | descriptive-other: Storage value. | entity/value | none |
| 62 | type | `CacheGroundReflection` | `<module>` | descriptive-other: Type that describes the reflective illumination source owned by one scatter pass. | entity/value | none |
| 65 | property | `kind` | `CacheGroundReflection` | descriptive-other: Value that selects direct source illumination for J2. | entity/value | none |
| 69 | property | `kind` | `CacheGroundReflection` | descriptive-other: Value that selects pure L(k - 2) illumination for Jk, k >= 3. | entity/value | none |
| 71 | property | `illumination` | `CacheGroundReflection` | descriptive-other: Value that identifies the pure radiance field that illuminates the ground. | entity/value | none |
| 75 | type | `CachePass` | `<module>` | descriptive-other: Type that describes one logical GPU cache-construction pass. | entity/value | none |
| 76 | property | `id` | `CachePass` | descriptive-other: Id value. | entity/value | none |
| 77 | property | `kind` | `CachePass` | descriptive-other: Kind value. | entity/value | none |
| 78 | property | `order` | `CachePass` | descriptive-other: Order value. | entity/value | none |
| 79 | property | `inputs` | `CachePass` | descriptive-other: Inputs value. | entity/value | none |
| 80 | property | `output` | `CachePass` | descriptive-other: Output value. | entity/value | none |
| 81 | property | `modules` | `CachePass` | descriptive-other: Modules value. | entity/value | none |
| 85 | type | `CacheBuildPlan` | `<module>` | descriptive-other: Type that describes a complete source-owned construction graph. | entity/value | none |
| 87 | property | `identity` | `CacheBuildPlan` | descriptive-other: Value that identifies the complete executable logical graph. | entity/value | none |
| 88 | property | `fields` | `CacheBuildPlan` | descriptive-other: Fields value. | entity/value | none |
| 89 | property | `passes` | `CacheBuildPlan` | descriptive-other: Passes value. | entity/value | none |
| 90 | property | `result` | `CacheBuildPlan` | descriptive-other: Result value. | entity/value | none |
| 94 | type | `CacheShader` | `<module>` | descriptive-other: Type that describes one complete construction fragment shader. | entity/value | none |
| 95 | property | `id` | `CacheShader` | descriptive-other: Id value. | entity/value | none |
| 96 | property | `source` | `CacheShader` | descriptive-other: Source value. | entity/value | none |
| 97 | property | `sourceHash` | `CacheShader` | descriptive-other: Source hash value. | entity/value | none |
| 98 | property | `bindings` | `CacheShader` | descriptive-other: Bindings value. | entity/value | none |
| 99 | property | `output` | `CacheShader` | descriptive-other: Output value. | entity/value | none |
| 103 | interface | `CacheAssembler` | `<module>` | descriptive-other: Assemble one logical pass and its executor-resolved output field. | entity/value | none |
| 109 | method | `assemble` | `CacheAssembler` | call-this-method: Call this method to assemble. | active-callable | params 2/2; returns tagged |
| 113 | type | `CacheGpuExecutorConfiguration` | `<module>` | descriptive-other: Construction collaborators for a renderer-neutral cache GPU executor. | entity/value | none |
| 115 | property | `backend` | `CacheGpuExecutorConfiguration` | descriptive-other: Renderer-specific GPU construction backend. | entity/value | none |
| 118 | property | `assembler` | `CacheGpuExecutorConfiguration` | descriptive-other: Provider-neutral cache-pass assembler. | entity/value | none |
| 122 | interface | `GpuCacheField` | `<module>` | descriptive-other: Contract that exposes one opaque resident GPU field. | entity/value | none |
| 123 | property | `id` | `GpuCacheField` | descriptive-other: Id value. | entity/value | none |
| 124 | property | `storage` | `GpuCacheField` | descriptive-other: Storage value. | entity/value | none |
| 125 | property | `backendId` | `GpuCacheField` | descriptive-other: Backend id value. | entity/value | none |
| 126 | method | `dispose` | `GpuCacheField` | call-this-method: Call this method to dispose. | active-callable | none |
| 130 | interface | `CacheGpuProgram` | `<module>` | descriptive-other: Contract that exposes one opaque compiled cache-construction program. | entity/value | none |
| 131 | property | `id` | `CacheGpuProgram` | descriptive-other: Id value. | entity/value | none |
| 132 | property | `sourceHash` | `CacheGpuProgram` | descriptive-other: Source hash value. | entity/value | none |
| 133 | method | `dispose` | `CacheGpuProgram` | call-this-method: Call this method to dispose. | active-callable | none |
| 137 | type | `CacheLayerSubmission` | `<module>` | descriptive-other: Submit one wavelength layer of one construction pass. | entity/value | none |
| 138 | property | `program` | `CacheLayerSubmission` | descriptive-other: Program value. | entity/value | none |
| 139 | property | `inputs` | `CacheLayerSubmission` | descriptive-other: Inputs value. | entity/value | none |
| 140 | property | `id` | `CacheLayerSubmission` | descriptive-other: Id value. | entity/value | none |
| 141 | property | `field` | `CacheLayerSubmission` | descriptive-other: Field value. | entity/value | none |
| 143 | property | `output` | `CacheLayerSubmission` | descriptive-other: Output value. | entity/value | none |
| 144 | property | `layer` | `CacheLayerSubmission` | descriptive-other: Layer value. | entity/value | none |
| 145 | property | `bindings` | `CacheLayerSubmission` | descriptive-other: Bindings value. | entity/value | none |
| 149 | interface | `CacheRuntimeBinding` | `<module>` | descriptive-other: Contract that exposes one opaque runtime binding for a completed field. | entity/value | none |
| 150 | property | `id` | `CacheRuntimeBinding` | descriptive-other: Id value. | entity/value | none |
| 152 | property | `valueKey` | `CacheRuntimeBinding` | descriptive-other: Value that identifies the shader value populated by the owning renderer backend. | entity/value | none |
| 153 | property | `fieldId` | `CacheRuntimeBinding` | descriptive-other: Field id value. | entity/value | none |
| 154 | property | `backendId` | `CacheRuntimeBinding` | descriptive-other: Backend id value. | entity/value | none |
| 158 | type | `CacheRuntimeBindings` | `<module>` | descriptive-other: Group completed cache bindings owned by one backend. | entity/value | none |
| 159 | property | `backendId` | `CacheRuntimeBindings` | descriptive-other: Backend id value. | entity/value | none |
| 160 | property | `bindings` | `CacheRuntimeBindings` | descriptive-other: Bindings value. | entity/value | none |
| 164 | type | `CacheRuntimeBindingInstallRequest` | `<module>` | descriptive-other: Type that supplies renderer-owned uniforms that receive opaque completed-cache bindings. | entity/value | none |
| 165 | property | `bindings` | `CacheRuntimeBindingInstallRequest` | descriptive-other: Bindings value. | entity/value | none |
| 166 | property | `uniforms` | `CacheRuntimeBindingInstallRequest` | descriptive-other: Uniforms value. | entity/value | none |
| 166 | property | `value` | `CacheRuntimeBindingInstallRequest` | descriptive-other: Value value. | entity/value | none |
| 170 | type | `CacheGpuCapabilities` | `<module>` | descriptive-other: Type that describes renderer capabilities that affect construction identity. | entity/value | none |
| 171 | property | `id` | `CacheGpuCapabilities` | descriptive-other: Id value. | entity/value | none |
| 172 | property | `api` | `CacheGpuCapabilities` | descriptive-other: Api value. | entity/value | none |
| 173 | property | `scalarFormat` | `CacheGpuCapabilities` | descriptive-other: Scalar format value. | entity/value | none |
| 174 | property | `supportsArrayRenderTargets` | `CacheGpuCapabilities` | descriptive-other: Supports array render targets value. | entity/value | none |
| 175 | property | `supportsFloatSampling` | `CacheGpuCapabilities` | descriptive-other: Supports float sampling value. | entity/value | none |
| 176 | property | `maximumTextureSize` | `CacheGpuCapabilities` | descriptive-other: Maximum texture size value. | entity/value | none |
| 177 | property | `maximumArrayLayers` | `CacheGpuCapabilities` | descriptive-other: Maximum array layers value. | entity/value | none |
| 181 | type | `CacheProbeRequest` | `<module>` | descriptive-other: Request bounded selected-scalar readback from one live field. | entity/value | none |
| 182 | property | `field` | `CacheProbeRequest` | descriptive-other: Field value. | entity/value | none |
| 183 | property | `coordinates` | `CacheProbeRequest` | descriptive-other: Coordinates value. | entity/value | none |
| 187 | type | `CacheProbe` | `<module>` | descriptive-other: Type that declares selected scalar coordinates for one logical field. | entity/value | none |
| 188 | property | `field` | `CacheProbe` | descriptive-other: Field value. | entity/value | none |
| 189 | property | `coordinates` | `CacheProbe` | descriptive-other: Coordinates value. | entity/value | none |
| 193 | type | `CacheProbeResult` | `<module>` | descriptive-other: Type that returns selected scalar values without exposing full-field readback. | entity/value | none |
| 194 | property | `fieldId` | `CacheProbeResult` | descriptive-other: Field id value. | entity/value | none |
| 195 | property | `samples` | `CacheProbeResult` | descriptive-other: Stored cache-field samples. | entity/value | none |
| 196 | property | `coordinates` | `CacheProbeResult` | descriptive-other: Coordinates value. | entity/value | none |
| 197 | property | `value` | `CacheProbeResult` | descriptive-other: Value value. | entity/value | none |
| 202 | interface | `CacheProbeReader` | `<module>` | descriptive-other: Contract that supplies the optional selected-scalar diagnostic capability. | entity/value | none |
| 207 | method | `readSelectedScalars` | `CacheProbeReader` | call-this-method: Call this method to read selected scalars. | active-callable | params 1/1; returns tagged |
| 211 | interface | `CacheGpuBackend` | `<module>` | descriptive-other: Isolate renderer-specific GPU construction behind opaque handles. | entity/value | none |
| 212 | property | `id` | `CacheGpuBackend` | descriptive-other: Id value. | entity/value | none |
| 213 | property | `capabilities` | `CacheGpuBackend` | descriptive-other: Capabilities value. | entity/value | none |
| 218 | method | `allocateField` | `CacheGpuBackend` | call-this-method: Call this method to allocate field. | active-callable | params 1/1; returns tagged |
| 223 | method | `compile` | `CacheGpuBackend` | call-this-method: Call this method to compile. | active-callable | params 1/1; returns tagged |
| 228 | method | `submitLayer` | `CacheGpuBackend` | call-this-method: Call this method to submit one layer and restore every renderer state value before re... | active-callable | params 1/1 |
| 233 | method | `createRuntimeBinding` | `CacheGpuBackend` | call-this-method: Call this method to create runtime binding. | active-callable | params 1/1; returns tagged |
| 238 | method | `installRuntimeBindings` | `CacheGpuBackend` | call-this-method: Call this method to resolve opaque bindings privately and install their renderer reso... | active-callable | params 1/1 |
| 239 | method | `dispose` | `CacheGpuBackend` | call-this-method: Call this method to dispose. | active-callable | none |
| 243 | interface | `CacheBuildScheduler` | `<module>` | descriptive-other: Yield construction only at executor-declared safe boundaries. | entity/value | none |
| 247 | method | `yieldControl` | `CacheBuildScheduler` | call-this-method: Call this method to yield control. | active-callable | returns tagged |
| 251 | type | `CacheExecutionOptions` | `<module>` | descriptive-other: Type that configures one staging-plan execution. | entity/value | none |
| 252 | property | `scheduler` | `CacheExecutionOptions` | descriptive-other: Scheduler value. | entity/value | none |
| 253 | property | `signal` | `CacheExecutionOptions` | descriptive-other: Signal value. | entity/value | none |
| 254 | property | `probeReader` | `CacheExecutionOptions` | descriptive-other: Probe reader value. | entity/value | none |
| 255 | property | `probes` | `CacheExecutionOptions` | descriptive-other: Probes value. | entity/value | none |
| 259 | type | `CachePassDiagnostic` | `<module>` | descriptive-other: Type that describes diagnostics captured for one completed pass. | entity/value | none |
| 260 | property | `id` | `CachePassDiagnostic` | descriptive-other: Id value. | entity/value | none |
| 261 | property | `submissionDuration` | `CachePassDiagnostic` | descriptive-other: Submission duration value. | entity/value | none |
| 262 | property | `probe` | `CachePassDiagnostic` | descriptive-other: Probe value. | entity/value | none |
| 266 | type | `CacheBuildMemoryDiagnostics` | `<module>` | descriptive-other: Type that records exact logical GPU payload requested during one completed build. | entity/value | none |
| 267 | property | `peakFieldStorage` | `CacheBuildMemoryDiagnostics` | descriptive-other: Peak field storage value. | entity/value | none |
| 268 | property | `peakPackedDataStorage` | `CacheBuildMemoryDiagnostics` | descriptive-other: Peak packed data storage value. | entity/value | none |
| 269 | property | `peakTrackedStorage` | `CacheBuildMemoryDiagnostics` | descriptive-other: Peak tracked storage value. | entity/value | none |
| 270 | property | `residentFieldStorage` | `CacheBuildMemoryDiagnostics` | descriptive-other: Resident field storage value. | entity/value | none |
| 274 | type | `CacheBuildDiagnostics` | `<module>` | descriptive-other: Type that describes diagnostics captured for one completed build. | entity/value | none |
| 275 | property | `passes` | `CacheBuildDiagnostics` | descriptive-other: Passes value. | entity/value | none |
| 276 | property | `memory` | `CacheBuildDiagnostics` | descriptive-other: Memory value. | entity/value | none |
| 280 | type | `CacheBuildArtifact` | `<module>` | descriptive-other: Type that owns the completed staging result and its runtime binding. | entity/value | none |
| 281 | property | `result` | `CacheBuildArtifact` | descriptive-other: Result value. | entity/value | none |
| 282 | property | `runtimeBindings` | `CacheBuildArtifact` | descriptive-other: Runtime bindings value. | entity/value | none |
| 283 | property | `diagnostics` | `CacheBuildArtifact` | descriptive-other: Diagnostics value. | entity/value | none |
| 284 | method | `dispose` | `CacheBuildArtifact` | call-this-method: Call this method to dispose. | active-callable | none |

## `src/algorithm32/gpu-runtime/cache/types/CacheGpuExecutor.d.ts`

Source: [src/algorithm32/gpu-runtime/cache/types/CacheGpuExecutor.d.ts](../../../../../../src/algorithm32/gpu-runtime/cache/types/CacheGpuExecutor.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `CacheIndexedPlan` | `<module>` | descriptive-other: Plan fields and remaining-consumer counts indexed for one execution. | entity/value | none |
| 4 | property | `fieldSpecs` | `CacheIndexedPlan` | descriptive-other: Field specifications keyed by logical field identifier. | entity/value | none |
| 7 | property | `consumerCounts` | `CacheIndexedPlan` | descriptive-other: Remaining pass-consumer counts keyed by logical field identifier. | entity/value | none |
| 11 | type | `CacheAcceptedProbe` | `<module>` | descriptive-other: Accepted diagnostic probe with copied, bounded coordinates. | entity/value | none |
| 13 | property | `field` | `CacheAcceptedProbe` | descriptive-other: Logical field selected by the probe. | entity/value | none |
| 16 | property | `coordinates` | `CacheAcceptedProbe` | descriptive-other: Copied scalar coordinates selected within the field. | entity/value | none |
| 20 | type | `CacheAcceptedExecutionOptions` | `<module>` | descriptive-other: Execution options accepted against the indexed build plan. | entity/value | none |
| 22 | property | `signal` | `CacheAcceptedExecutionOptions` | descriptive-other: Optional cancellation signal. | entity/value | none |
| 25 | property | `scheduler` | `CacheAcceptedExecutionOptions` | descriptive-other: Optional safe-boundary scheduler. | entity/value | none |
| 28 | property | `probeReader` | `CacheAcceptedExecutionOptions` | descriptive-other: Optional selected-scalar readback capability. | entity/value | none |
| 31 | property | `probes` | `CacheAcceptedExecutionOptions` | descriptive-other: Accepted diagnostic probes keyed by logical field identifier. | entity/value | none |
| 35 | class | `CacheGpuExecutor` | `<module>` | descriptive-other: Renderer-neutral GPU executor for trusted cache build plans. | entity/value | none |
| 40 | constructor | `<anonymous@40:2>` | `CacheGpuExecutor` | creates: Creates a renderer-neutral executor for one backend and cache-pass assembler. | creates | params 1/1 |
| 48 | method | `execute` | `CacheGpuExecutor` | call-this-method: Call this method to execute one complete staging graph. | active-callable | params 2/2; returns tagged |
| 51 | method | `dispose` | `CacheGpuExecutor` | call-this-method: Call this method to mark the executor unavailable without disposing its backend. | active-callable | none |

## `src/algorithm32/ground-boundaries/types.d.ts`

Source: [src/algorithm32/ground-boundaries/types.d.ts](../../../../../../src/algorithm32/ground-boundaries/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | interface | `GroundBoundary` | `<module>` | descriptive-other: Contract that provides the configured ground BRDF used during scattering-cache constr... | entity/value | none |
| 4 | property | `id` | `GroundBoundary` | descriptive-other: Value that identifies this configured ground boundary for cache compatibility and lif... | entity/value | none |
| 7 | property | `model` | `GroundBoundary` | descriptive-other: Value that identifies the executable boundary model. | entity/value | none |
| 13 | property | `albedo` | `GroundBoundary` | descriptive-other: Retain the profile-owned spectral hemispherical reflectance accepted by this boundary. | entity/value | none |
| 21 | method | `evaluateBrdf` | `GroundBoundary` | call-this-method: Call this method to evaluate the spectral BRDF at a geometry-owned ground hit. | active-callable | params 1/1; returns tagged |
| 24 | type | `GroundBrdfRequest` | `<module>` | descriptive-other: Inputs for one ground-boundary BRDF evaluation. | entity/value | none |
| 26 | property | `hit` | `GroundBrdfRequest` | descriptive-other: Value that stores the geometry-resolved ground hit. | entity/value | none |
| 28 | property | `incomingDirection` | `GroundBrdfRequest` | descriptive-other: Value that stores the direction from the hit toward the sampled incoming field. | entity/value | none |
| 30 | property | `outgoingDirection` | `GroundBrdfRequest` | descriptive-other: Value that stores the direction from the hit toward the reflected-radiance receiver. | entity/value | none |
| 32 | property | `spectralBasis` | `GroundBrdfRequest` | descriptive-other: Value that stores the exact requested spectral basis. | entity/value | none |

## `src/algorithm32/ground-boundaries/uniform-lambertian/types.d.ts`

Source: [src/algorithm32/ground-boundaries/uniform-lambertian/types.d.ts](../../../../../../src/algorithm32/ground-boundaries/uniform-lambertian/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `UniformLambertianGroundBoundaryOptions` | `<module>` | descriptive-other: Type that configures one spatially uniform Lambertian ground boundary. | entity/value | none |
| 4 | property | `id` | `UniformLambertianGroundBoundaryOptions` | descriptive-other: Value that identifies this explicitly configured boundary. | entity/value | none |
| 6 | property | `albedo` | `UniformLambertianGroundBoundaryOptions` | descriptive-other: Value that supplies the profile-owned spectral hemispherical reflectance. | entity/value | none |

## `src/algorithm32/light-sources/distant-sun/cache/types.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/cache/types.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/cache/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `DistantSunCacheProviderSource` | `<module>` | descriptive-other: Configured facade surface retained by the distant-Sun cache provider. | entity/value | none |
| 5 | type | `DistantSunFieldPackingDefinition` | `<module>` | descriptive-other: Definition of source-owned executable packing for one distant-Sun CPU field. | entity/value | none |
| 7 | property | `id` | `DistantSunFieldPackingDefinition` | descriptive-other: Unique identifier for the field packing. | entity/value | none |
| 9 | property | `directionCount` | `DistantSunFieldPackingDefinition` | descriptive-other: Number of executable directions. | entity/value | none |
| 11 | property | `positionCount` | `DistantSunFieldPackingDefinition` | descriptive-other: Number of executable positions. | entity/value | none |
| 13 | property | `wavelengthCount` | `DistantSunFieldPackingDefinition` | descriptive-other: Number of executable wavelengths. | entity/value | none |
| 17 | interface | `DistantSunFieldPacking` | `<module>` | descriptive-other: Source-owned executable packing for one distant-Sun CPU field. | entity/value | none |
| 19 | property | `kind` | `DistantSunFieldPacking` | descriptive-other: Distant-Sun field-packing contract kind. | entity/value | none |
| 21 | property | `id` | `DistantSunFieldPacking` | descriptive-other: Unique identifier for the field packing. | entity/value | none |
| 23 | property | `directionCount` | `DistantSunFieldPacking` | descriptive-other: Executable direction extent. | entity/value | none |
| 25 | property | `positionCount` | `DistantSunFieldPacking` | descriptive-other: Executable position extent. | entity/value | none |
| 27 | property | `wavelengthCount` | `DistantSunFieldPacking` | descriptive-other: Executable wavelength extent. | entity/value | none |
| 34 | method | `coordinatesAt` | `DistantSunFieldPacking` | call-this-method: Call this method to resolve field coordinates for a flat storage offset. | active-callable | params 1/1; returns tagged |
| 38 | type | `DistantSunConstructionDomainSelectionDefinition` | `<module>` | descriptive-other: Definition of one coherent executable distant-Sun construction-domain selection. | entity/value | none |
| 40 | property | `id` | `DistantSunConstructionDomainSelectionDefinition` | descriptive-other: Unique identifier for the exact position, direction, and packing selection. | entity/value | none |
| 42 | property | `positionDomainOwner` | `DistantSunConstructionDomainSelectionDefinition` | descriptive-other: Owner of the executable spherical-native position facts. | entity/value | none |
| 44 | property | `incomingDirectionDomainOwner` | `DistantSunConstructionDomainSelectionDefinition` | descriptive-other: Owner of the executable incoming-radiance direction facts. | entity/value | none |
| 46 | property | `outgoingDirectionDomainOwner` | `DistantSunConstructionDomainSelectionDefinition` | descriptive-other: Owner of the executable cubed-sphere outgoing-direction facts. | entity/value | none |
| 48 | property | `spectralBasis` | `DistantSunConstructionDomainSelectionDefinition` | descriptive-other: Exact spectral basis that determines the field channel count. | entity/value | none |
| 50 | property | `radiancePackingId` | `DistantSunConstructionDomainSelectionDefinition` | descriptive-other: Identifier for the incoming-radiance field packing. | entity/value | none |
| 52 | property | `scatteringDensityPackingId` | `DistantSunConstructionDomainSelectionDefinition` | descriptive-other: Identifier for the outgoing-scattering field packing. | entity/value | none |
| 56 | interface | `DistantSunConstructionDomainSelection` | `<module>` | descriptive-other: Executable production lattice for distant-Sun construction. | entity/value | none |
| 58 | property | `kind` | `DistantSunConstructionDomainSelection` | descriptive-other: Distant-Sun construction-domain-selection contract kind. | entity/value | none |
| 60 | property | `id` | `DistantSunConstructionDomainSelection` | descriptive-other: Unique identifier for the exact position, direction, and packing selection. | entity/value | none |
| 62 | property | `positionDomain` | `DistantSunConstructionDomainSelection` | descriptive-other: Selected executable physical position domain. | entity/value | none |
| 64 | property | `positionNodes` | `DistantSunConstructionDomainSelection` | descriptive-other: Selected executable position nodes. | entity/value | none |
| 66 | property | `positionCount` | `DistantSunConstructionDomainSelection` | descriptive-other: Selected position extent. | entity/value | none |
| 68 | property | `bottomRadius` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable ground radius. | entity/value | none |
| 70 | property | `topRadius` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable atmosphere-top radius. | entity/value | none |
| 72 | property | `incomingDirectionDomain` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable incoming-radiance direction domain. | entity/value | none |
| 74 | property | `incomingUnitVectors` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable incoming-radiance unit vectors. | entity/value | none |
| 76 | property | `incomingIntegrationWeights` | `DistantSunConstructionDomainSelection` | descriptive-other: Solid-angle integration weight for each incoming direction. | entity/value | none |
| 78 | property | `incomingDirectionCount` | `DistantSunConstructionDomainSelection` | descriptive-other: Incoming-radiance direction extent. | entity/value | none |
| 80 | property | `outgoingDirectionDomain` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable outgoing-scattering direction domain. | entity/value | none |
| 82 | property | `outgoingUnitVectors` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable outgoing-scattering unit vectors. | entity/value | none |
| 84 | property | `outgoingDirectionCount` | `DistantSunConstructionDomainSelection` | descriptive-other: Outgoing-scattering direction extent. | entity/value | none |
| 86 | property | `outgoingPositiveFaceCenterIndices` | `DistantSunConstructionDomainSelection` | descriptive-other: Selected positive-axis face-center indices. | entity/value | none |
| 88 | property | `positiveX` | `DistantSunConstructionDomainSelection` | descriptive-other: Positive-X face-center index. | entity/value | none |
| 90 | property | `positiveY` | `DistantSunConstructionDomainSelection` | descriptive-other: Positive-Y face-center index. | entity/value | none |
| 92 | property | `positiveZ` | `DistantSunConstructionDomainSelection` | descriptive-other: Positive-Z face-center index. | entity/value | none |
| 95 | property | `spectralBasis` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable spectral basis. | entity/value | none |
| 97 | property | `spectralChannelCount` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable spectral channel extent. | entity/value | none |
| 99 | property | `radiancePacking` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable incoming-radiance field packing. | entity/value | none |
| 101 | property | `scatteringDensityPacking` | `DistantSunConstructionDomainSelection` | descriptive-other: Executable outgoing-scattering field packing. | entity/value | none |
| 109 | method | `resolveOutgoingDirectionStencil` | `DistantSunConstructionDomainSelection` | call-this-method: Call this method to resolve one source-local outgoing direction into selected constru... | active-callable | params 1/1; returns tagged |
| 113 | type | `DistantSunCpuPureFieldDefinition` | `<module>` | descriptive-other: Definition of one pure distant-Sun CPU field. | entity/value | none |
| 115 | property | `id` | `DistantSunCpuPureFieldDefinition` | descriptive-other: Unique identifier for the field. | entity/value | none |
| 117 | property | `order` | `DistantSunCpuPureFieldDefinition` | descriptive-other: Pure field order. | entity/value | none |
| 119 | property | `provenanceIdentity` | `DistantSunCpuPureFieldDefinition` | descriptive-other: Optional field provenance identity. | entity/value | none |
| 121 | property | `domainSelection` | `DistantSunCpuPureFieldDefinition` | descriptive-other: Optional executable production domain; omission retains Native48/W27. | entity/value | none |
| 125 | type | `DistantSunCpuPureFieldAllocator` | `<module>` | descriptive-other: Operation that allocates one mutable pure distant-Sun CPU field. | entity/value | none |
| 130 | callback | `<function-type>` | `DistantSunCpuPureFieldAllocator` | called-by: Called by distant-Sun CPU evaluators to allocate one pure field. | called-by | params 1/1; returns tagged |
| 133 | type | `DistantSunCpuPrimaryFieldAllocators` | `<module>` | descriptive-other: Field-allocation operations supplied to the distant-Sun primary evaluator. | entity/value | none |
| 141 | property | `createPureRadianceField` | `DistantSunCpuPrimaryFieldAllocators` | descriptive-other: Value used by the primary evaluator to allocate a pure-radiance field through the own... | entity/value | none |
| 149 | property | `createPureScatteringDensityField` | `DistantSunCpuPrimaryFieldAllocators` | descriptive-other: Value used by the primary evaluator to allocate a pure-scattering-density field throu... | entity/value | none |
| 153 | type | `DistantSunCpuMultipleScatteringFieldAllocators` | `<module>` | descriptive-other: Field-allocation operations supplied to the distant-Sun multiple-scattering evaluator. | entity/value | none |
| 161 | property | `createPureRadianceField` | `DistantSunCpuMultipleScatteringFieldAllocators` | descriptive-other: Value used by the multiple-scattering evaluator to allocate a pure-radiance field thr... | entity/value | none |
| 171 | type | `DistantSunPrimaryScatteringAtmosphereMethod` | `<module>` | descriptive-other: Atmosphere method names required by distant-Sun primary scattering. - **"sampleMedium... | entity/value | union bullets 3/3 |
| 174 | type | `DistantSunPrimaryScatteringAtmosphere` | `<module>` | descriptive-other: Atmosphere surface required for distant-Sun primary scattering density. | entity/value | none |
| 177 | property | `spectralBasis` | `DistantSunPrimaryScatteringAtmosphere` | descriptive-other: Atmosphere spectral basis aligned with its spectral outputs. | entity/value | none |
| 186 | type | `DistantSunPrimaryScatteringGeometryMethod` | `<module>` | descriptive-other: Geometry method names required by distant-Sun primary scattering. - **"resolveAtmosph... | entity/value | union bullets 2/2 |
| 189 | type | `DistantSunPrimaryScatteringGeometry` | `<module>` | descriptive-other: Geometry surface required for primary scattering over the selected position domain. | entity/value | none |
| 198 | method | `resolveCacheBuildRay` | `DistantSunPrimaryScatteringGeometry` | call-this-method: Call this method to resolve one native altitude and source direction into a physical ... | active-callable | params 1/1; returns tagged |
| 207 | type | `DistantSunDirectLightingMethod` | `<module>` | descriptive-other: Direct-lighting method names shared by distant-Sun scattering paths. - **"sampleDirec... | entity/value | union bullets 2/2 |
| 210 | type | `DistantSunPrimaryScatteringLightSource` | `<module>` | descriptive-other: Distant atmospheric source surface required for primary scattering density. | entity/value | none |
| 213 | type | `DistantSunPrimaryScatteringDensityBuildRequest` | `<module>` | descriptive-other: Request for one synchronous distant-Sun pure-J1 CPU construction. | entity/value | none |
| 215 | property | `atmosphere` | `DistantSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Wavelength-aligned physical atmosphere. | entity/value | none |
| 217 | property | `geometry` | `DistantSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Spherical geometry that reconstructs native altitude nodes. | entity/value | none |
| 219 | property | `lightSource` | `DistantSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Distant-source direction and path policy. | entity/value | none |
| 221 | property | `profile` | `DistantSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Optional native typed production profile; omission selects the default. | entity/value | none |
| 223 | property | `id` | `DistantSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Optional pure-J1 field identity override. | entity/value | none |
| 225 | property | `provenanceIdentity` | `DistantSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Optional field provenance identity override. | entity/value | none |
| 227 | property | `domainSelection` | `DistantSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Optional executable production domain; omission retains Native48/W27. | entity/value | none |
| 231 | type | `DistantSunPrimaryRadianceGeometry` | `<module>` | descriptive-other: Spherical geometry required by the source-owned direct-L1 build. | entity/value | none |
| 241 | method | `expressPhysicalIncomingRadianceDirection` | `DistantSunPrimaryRadianceGeometry` | call-this-method: Call this method to express one executable Fibonacci radiance direction in physical s... | active-callable | params 1/1; returns tagged |
| 245 | type | `DistantSunPrimaryRadianceCalculator` | `<module>` | descriptive-other: Canonical calculator surface shared by direct L1 and later-order recurrence. | entity/value | none |
| 248 | type | `DistantSunPrimaryRadianceBuildRequest` | `<module>` | descriptive-other: Request for one synchronous distant-Sun pure-L1 CPU construction. | entity/value | none |
| 251 | property | `geometry` | `DistantSunPrimaryRadianceBuildRequest` | descriptive-other: Spherical geometry and its source-relative direction mapping. | entity/value | none |
| 253 | property | `calculator` | `DistantSunPrimaryRadianceBuildRequest` | descriptive-other: Source-created canonical spectral calculator. | entity/value | none |
| 255 | property | `transportIntervalCount` | `DistantSunPrimaryRadianceBuildRequest` | descriptive-other: Accepted executable path-integration interval count. | entity/value | none |
| 265 | type | `DistantSunCpuSpectralCalculatorRequestExcludedProperty` | `<module>` | descriptive-other: Properties excluded from a distant-Sun CPU spectral-calculator request. - **"calculat... | entity/value | union bullets 3/3 |
| 268 | type | `DistantSunCpuSpectralCalculatorRequest` | `<module>` | descriptive-other: Physical inputs for the one source-owned calculator. | entity/value | none |
| 274 | type | `DistantSunCpuPrimaryScatteringEvaluationRequest` | `<module>` | descriptive-other: Primary-scattering request accepted by the configured evaluator. | entity/value | none |
| 280 | type | `DistantSunCpuPrimaryRadianceEvaluationRequest` | `<module>` | descriptive-other: Primary-radiance request accepted by the configured evaluator. | entity/value | none |
| 283 | type | `DistantSunCpuSpectralCalculatorEvaluationRequest` | `<module>` | descriptive-other: Spectral-calculator request accepted by the configured evaluator. | entity/value | none |
| 286 | type | `DistantSunLaterOrderScatteringGeometry` | `<module>` | descriptive-other: Spherical distant-Sun geometry used by later-order scattering. | entity/value | none |
| 295 | method | `resolveScatteringCacheConstructionPosition` | `DistantSunLaterOrderScatteringGeometry` | call-this-method: Call this method to reconstruct one executable native position through geometry-owned... | active-callable | params 1/1; returns tagged |
| 303 | method | `expressPhysicalIncomingRadianceDirection` | `DistantSunLaterOrderScatteringGeometry` | call-this-method: Call this method to express one executable Fibonacci incoming direction in physical s... | active-callable | params 1/1; returns tagged |
| 311 | method | `expressPhysicalOutgoingScatteringDirection` | `DistantSunLaterOrderScatteringGeometry` | call-this-method: Call this method to express one executable W27 outgoing direction in physical space. | active-callable | params 1/1; returns tagged |
| 321 | type | `DistantSunGroundReflectionGeometryMethod` | `<module>` | descriptive-other: Geometry method names required only by distant-Sun ground reflection. - **"resolveAtm... | entity/value | union bullets 3/3 |
| 325 | type | `DistantSunGroundReflectionGeometry` | `<module>` | descriptive-other: Geometry operations required only by reflective-ground scattering. | entity/value | none |
| 329 | type | `DistantSunGroundReflectionAtmosphere` | `<module>` | descriptive-other: Atmosphere transport required only by reflective-ground scattering. | entity/value | none |
| 333 | type | `DistantSunGroundReflectionLightSource` | `<module>` | descriptive-other: Direct-source operations used by the J2 ground term. | entity/value | none |
| 336 | type | `DistantSunLaterOrderScatteringKernelConfigurationBase` | `<module>` | descriptive-other: Physical collaborators shared by every ground mode. | entity/value | none |
| 338 | property | `domainSelection` | `DistantSunLaterOrderScatteringKernelConfigurationBase` | descriptive-other: Optional executable domains; omission retains production Native48/W27. | entity/value | none |
| 340 | property | `geometry` | `DistantSunLaterOrderScatteringKernelConfigurationBase` | descriptive-other: Spherical native-domain geometry. | entity/value | none |
| 342 | property | `atmosphere` | `DistantSunLaterOrderScatteringKernelConfigurationBase` | descriptive-other: Atmosphere-owned medium and phase sampling. | entity/value | none |
| 344 | property | `calculator` | `DistantSunLaterOrderScatteringKernelConfigurationBase` | descriptive-other: Phase-weighted spectral coefficient calculation. | entity/value | none |
| 346 | property | `directionToLight` | `DistantSunLaterOrderScatteringKernelConfigurationBase` | descriptive-other: Executable physical direction from a sample toward the source. | entity/value | none |
| 348 | property | `groundIlluminationRadiance` | `DistantSunLaterOrderScatteringKernelConfigurationBase` | descriptive-other: Pure L(k-2) field when the requested order can illuminate ground. | entity/value | none |
| 352 | type | `DistantSunBlackGroundScatteringKernelConfiguration` | `<module>` | descriptive-other: Exact omitted-boundary configuration. | entity/value | none |
| 355 | property | `groundBoundary` | `DistantSunBlackGroundScatteringKernelConfiguration` | descriptive-other: Null reflective boundary that preserves the canonical black path. | entity/value | none |
| 364 | type | `DistantSunReflectiveGroundScatteringKernelConfigurationExcludedProperty` | `<module>` | descriptive-other: Base properties replaced by reflective-ground scattering collaborators. - **"geometry... | entity/value | union bullets 2/2 |
| 367 | type | `DistantSunReflectiveGroundScatteringKernelConfiguration` | `<module>` | descriptive-other: Source-owned reflective-ground transport configuration. | entity/value | none |
| 373 | property | `geometry` | `DistantSunReflectiveGroundScatteringKernelConfiguration` | descriptive-other: Geometry-owned ground hits and atmosphere paths. | entity/value | none |
| 375 | property | `atmosphere` | `DistantSunReflectiveGroundScatteringKernelConfiguration` | descriptive-other: Atmosphere-owned optical-depth integration. | entity/value | none |
| 377 | property | `groundBoundary` | `DistantSunReflectiveGroundScatteringKernelConfiguration` | descriptive-other: Configured BRDF owner. | entity/value | none |
| 379 | property | `lightSource` | `DistantSunReflectiveGroundScatteringKernelConfiguration` | descriptive-other: Distant source for direct J2 illumination. | entity/value | none |
| 381 | property | `sourceTransmittanceIntervalCount` | `DistantSunReflectiveGroundScatteringKernelConfiguration` | descriptive-other: Selected source/hit transport interval count. | entity/value | none |
| 385 | type | `DistantSunLaterOrderScatteringKernelConfiguration` | `<module>` | descriptive-other: Distant-Sun later-order kernel configuration independent of its order. | entity/value | none |
| 389 | type | `DistantSunBlackGroundScatteringKernelRequest` | `<module>` | descriptive-other: Omitted-boundary distant-Sun later-order kernel request. | entity/value | none |
| 392 | property | `scatteringOrder` | `DistantSunBlackGroundScatteringKernelRequest` | descriptive-other: Pure Jk order being constructed. | entity/value | none |
| 396 | type | `DistantSunReflectiveGroundScatteringKernelRequest` | `<module>` | descriptive-other: Reflective-ground distant-Sun later-order kernel request. | entity/value | none |
| 399 | property | `scatteringOrder` | `DistantSunReflectiveGroundScatteringKernelRequest` | descriptive-other: Pure Jk order being constructed. | entity/value | none |
| 403 | type | `DistantSunCpuBlackGroundKernelEvaluationRequest` | `<module>` | descriptive-other: Omitted-boundary kernel request accepted by the configured evaluator. | entity/value | none |
| 414 | type | `DistantSunCpuReflectiveGroundKernelEvaluationExcludedProperty` | `<module>` | descriptive-other: Provider-captured properties excluded from reflective-ground evaluator requests. - **... | entity/value | union bullets 2/2 |
| 417 | type | `DistantSunCpuReflectiveGroundKernelEvaluationRequest` | `<module>` | descriptive-other: Reflective-ground kernel request accepted by the configured evaluator. | entity/value | none |
| 423 | type | `DistantSunCpuLaterOrderKernelEvaluationRequest` | `<module>` | descriptive-other: Later-order kernel request accepted by the configured evaluator. | entity/value | none |
| 427 | type | `DistantSunScatteringDensityTransportGeometry` | `<module>` | descriptive-other: Spherical distant-Sun geometry required by stored-field transport. | entity/value | none |
| 436 | method | `expressPhysicalIncomingRadianceDirection` | `DistantSunScatteringDensityTransportGeometry` | call-this-method: Call this method to express one executable Fibonacci radiance direction in physical s... | active-callable | params 1/1; returns tagged |
| 444 | method | `resolveScatteringCacheConstructionPositionStencil` | `DistantSunScatteringDensityTransportGeometry` | call-this-method: Call this method to resolve construction-time position taps from geometry-owned facts. | active-callable | params 1/1; returns tagged |
| 450 | type | `DistantSunScatteringDensityTransportRequest` | `<module>` | descriptive-other: Request for one source-owned distant-Sun stored-field transport build. | entity/value | none |
| 452 | property | `scatteringDensity` | `DistantSunScatteringDensityTransportRequest` | descriptive-other: Sealed Native48/W27/Native-15 pure-Jk input field. | entity/value | none |
| 454 | property | `scatteringOrder` | `DistantSunScatteringDensityTransportRequest` | descriptive-other: Diagnostic J1 or production J2/J3 order being transported. | entity/value | none |
| 456 | property | `geometry` | `DistantSunScatteringDensityTransportRequest` | descriptive-other: Spherical construction and source-frame operations. | entity/value | none |
| 458 | property | `atmosphere` | `DistantSunScatteringDensityTransportRequest` | descriptive-other: Atmosphere medium sampling. | entity/value | none |
| 460 | property | `calculator` | `DistantSunScatteringDensityTransportRequest` | descriptive-other: Endpoint-trapezoid and transmittance operations. | entity/value | none |
| 462 | property | `domainSelection` | `DistantSunScatteringDensityTransportRequest` | descriptive-other: Optional executable production domain; omission retains Native48/W27. | entity/value | none |
| 464 | property | `transportIntervalCount` | `DistantSunScatteringDensityTransportRequest` | descriptive-other: Accepted executable path-integration interval count. | entity/value | none |
| 466 | property | `id` | `DistantSunScatteringDensityTransportRequest` | descriptive-other: Optional allocated pure-Lk field identity override. | entity/value | none |
| 470 | type | `DistantSunCpuCacheResultBase` | `<module>` | descriptive-other: Common completed nonresident CPU cache result data. | entity/value | none |
| 472 | property | `cumulativeScatteringDensity` | `DistantSunCpuCacheResultBase` | descriptive-other: Final sealed cumulative scattering-density field. | entity/value | none |
| 474 | property | `options` | `DistantSunCpuCacheResultBase` | descriptive-other: Cache-construction options that completed. | entity/value | none |
| 478 | type | `DistantSunCpuCacheResultN1` | `<module>` | descriptive-other: Complete requested N=1 CPU build result. | entity/value | none |
| 481 | property | `maximumScatteringOrder` | `DistantSunCpuCacheResultN1` | descriptive-other: Requested recurrence-graph discriminator. | entity/value | none |
| 483 | property | `pureScatteringDensityByOrder` | `DistantSunCpuCacheResultN1` | descriptive-other: Pure J1 field in ascending order. | entity/value | none |
| 485 | property | `pureRadianceByOrder` | `DistantSunCpuCacheResultN1` | descriptive-other: N=1 constructs no transported-radiance field. | entity/value | none |
| 489 | type | `DistantSunCpuCacheResultN2` | `<module>` | descriptive-other: Complete requested N=2 CPU build result. | entity/value | none |
| 492 | property | `maximumScatteringOrder` | `DistantSunCpuCacheResultN2` | descriptive-other: Requested recurrence-graph discriminator. | entity/value | none |
| 494 | property | `pureScatteringDensityByOrder` | `DistantSunCpuCacheResultN2` | descriptive-other: Pure J1 and J2 fields in ascending order. | entity/value | none |
| 499 | property | `pureRadianceByOrder` | `DistantSunCpuCacheResultN2` | descriptive-other: Direct-primary L1 field; N=2 constructs no L2 field. | entity/value | none |
| 503 | type | `DistantSunCpuCacheResultN4` | `<module>` | descriptive-other: Complete requested N=4 CPU build result. | entity/value | none |
| 506 | property | `maximumScatteringOrder` | `DistantSunCpuCacheResultN4` | descriptive-other: Requested recurrence-graph discriminator. | entity/value | none |
| 508 | property | `pureScatteringDensityByOrder` | `DistantSunCpuCacheResultN4` | descriptive-other: Pure J1 through J4 fields in ascending order. | entity/value | none |
| 515 | property | `pureRadianceByOrder` | `DistantSunCpuCacheResultN4` | descriptive-other: Direct L1 followed by transported L2 and L3 fields; L4 is absent. | entity/value | none |
| 528 | type | `DistantSunCpuCacheBuildRequestBaseExcludedProperty` | `<module>` | descriptive-other: Identity properties excluded from the common distant-Sun CPU cache build request. - *... | entity/value | union bullets 2/2 |
| 531 | type | `DistantSunCpuCacheBuildRequestBase` | `<module>` | descriptive-other: Physical collaborators and identities shared by every CPU build. | entity/value | none |
| 537 | property | `groundBoundary` | `DistantSunCpuCacheBuildRequestBase` | descriptive-other: Optional configured BRDF owner; omission retains canonical black ground. | entity/value | none |
| 542 | property | `transportIntervalCount` | `DistantSunCpuCacheBuildRequestBase` | descriptive-other: Optional offline executable interval count; omission retains the production count of 15. | entity/value | none |
| 546 | type | `DistantSunCpuCacheMultipleScatteringBuildRequestBase` | `<module>` | descriptive-other: Stronger geometry surface required when direct L1 is built. | entity/value | none |
| 549 | property | `geometry` | `DistantSunCpuCacheMultipleScatteringBuildRequestBase` | descriptive-other: Geometry surface required for direct L1. | entity/value | none |
| 551 | property | `calculator` | `DistantSunCpuCacheMultipleScatteringBuildRequestBase` | descriptive-other: Source-created calculator shared with direct-primary L1. | entity/value | none |
| 555 | type | `DistantSunCpuCacheRequestN1Base` | `<module>` | descriptive-other: Physical inputs supplied to the source-owned public N=1 build. | entity/value | none |
| 564 | type | `DistantSunCpuCacheMultipleScatteringRequestBaseExcludedProperty` | `<module>` | descriptive-other: Provider-owned properties excluded from public distant-Sun multiple-scattering reques... | entity/value | union bullets 3/3 |
| 567 | type | `DistantSunCpuCacheMultipleScatteringRequestBase` | `<module>` | descriptive-other: Physical inputs supplied to public multiple-scattering builds. | entity/value | none |
| 573 | property | `geometry` | `DistantSunCpuCacheMultipleScatteringRequestBase` | descriptive-other: Geometry surface shared by direct and later-order scattering. | entity/value | none |
| 582 | type | `DistantSunReflectiveGroundProfileExcludedProperty` | `<module>` | descriptive-other: Native-profile sections replaced by explicit reflective-ground facts. - **"spectral"*... | entity/value | union bullets 2/2 |
| 585 | type | `DistantSunReflectiveGroundProfile` | `<module>` | descriptive-other: Explicit profile facts owned by reflective ground. | entity/value | none |
| 591 | property | `spectral` | `DistantSunReflectiveGroundProfile` | descriptive-other: Exact native basis used by the configured boundary. | entity/value | none |
| 594 | property | `basis` | `DistantSunReflectiveGroundProfile` | descriptive-other: Native spectral basis used by the configured boundary. | entity/value | none |
| 597 | property | `physical` | `DistantSunReflectiveGroundProfile` | descriptive-other: Explicitly configured profile-owned albedo. | entity/value | none |
| 600 | property | `ground` | `DistantSunReflectiveGroundProfile` | descriptive-other: Explicit physical ground facts. | entity/value | none |
| 602 | property | `albedo` | `DistantSunReflectiveGroundProfile` | descriptive-other: Profile-owned spectral albedo. | entity/value | none |
| 608 | type | `DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase` | `<module>` | descriptive-other: Multiple-scattering request with the exact omitted-black boundary. | entity/value | none |
| 614 | property | `groundBoundary` | `DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase` | descriptive-other: Null reflective boundary that preserves the canonical black path. | entity/value | none |
| 625 | type | `DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBaseExcludedProperty` | `<module>` | descriptive-other: Properties replaced by an explicit reflective-ground CPU cache request. - **"groundBo... | entity/value | union bullets 4/4 |
| 629 | type | `DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase` | `<module>` | descriptive-other: Multiple-scattering request with an explicit profile-owned boundary. | entity/value | none |
| 635 | property | `geometry` | `DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase` | descriptive-other: Geometry-owned ground hits, position sampling, and paths. | entity/value | none |
| 637 | property | `atmosphere` | `DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase` | descriptive-other: Atmosphere-owned optical-depth integration. | entity/value | none |
| 640 | property | `groundBoundary` | `DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase` | descriptive-other: BRDF owner configured from the same profile albedo. | entity/value | none |
| 642 | property | `profile` | `DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase` | descriptive-other: Explicit profile that owns the boundary albedo. | entity/value | none |
| 646 | type | `DistantSunCpuCacheRequestN1` | `<module>` | descriptive-other: Explicit public N=1 build request without later-order collaborators. | entity/value | none |
| 649 | property | `maximumScatteringOrder` | `DistantSunCpuCacheRequestN1` | descriptive-other: Explicit J1-only pass-graph selection. | entity/value | none |
| 653 | type | `DistantSunCpuCacheBlackGroundRequestN2` | `<module>` | descriptive-other: Omitted-black public N=2 build request. | entity/value | none |
| 656 | property | `maximumScatteringOrder` | `DistantSunCpuCacheBlackGroundRequestN2` | descriptive-other: Explicit J1, L1, and J2 pass-graph selection. | entity/value | none |
| 660 | type | `DistantSunCpuCacheReflectiveGroundRequestN2` | `<module>` | descriptive-other: Reflective-ground public N=2 build request. | entity/value | none |
| 663 | property | `maximumScatteringOrder` | `DistantSunCpuCacheReflectiveGroundRequestN2` | descriptive-other: Explicit J1, L1, and J2 pass-graph selection. | entity/value | none |
| 667 | type | `DistantSunCpuCacheRequestN2` | `<module>` | descriptive-other: Explicit public N=2 build request. | entity/value | none |
| 670 | type | `DistantSunCpuCacheBlackGroundRequestN4` | `<module>` | descriptive-other: Omitted-black explicit or default public N=4 build request. | entity/value | none |
| 676 | property | `maximumScatteringOrder` | `DistantSunCpuCacheBlackGroundRequestN4` | descriptive-other: Explicit or default J1-through-J4 pass-graph selection. | entity/value | none |
| 678 | property | `geometry` | `DistantSunCpuCacheBlackGroundRequestN4` | descriptive-other: Geometry surface required by the complete N4 recurrence. | entity/value | none |
| 683 | type | `DistantSunCpuCacheReflectiveGroundRequestN4` | `<module>` | descriptive-other: Reflective-ground explicit or default public N=4 build request. | entity/value | none |
| 689 | property | `maximumScatteringOrder` | `DistantSunCpuCacheReflectiveGroundRequestN4` | descriptive-other: Explicit or default J1-through-J4 pass-graph selection. | entity/value | none |
| 691 | property | `geometry` | `DistantSunCpuCacheReflectiveGroundRequestN4` | descriptive-other: Geometry surface required by the complete reflective N4 recurrence. | entity/value | none |
| 696 | type | `DistantSunCpuCacheRequestN4` | `<module>` | descriptive-other: Explicit or default public N=4 build request. | entity/value | none |
| 699 | type | `DistantSunCacheControllerPlanRequestBase` | `<module>` | descriptive-other: Owners and options shared by every controller-derived distant-Sun GPU build plan. | entity/value | none |
| 701 | property | `atmosphere` | `DistantSunCacheControllerPlanRequestBase` | descriptive-other: Configured atmosphere construction contributor. | entity/value | none |
| 703 | property | `spectralBasis` | `DistantSunCacheControllerPlanRequestBase` | descriptive-other: Spectral basis value. | entity/value | none |
| 709 | property | `domainSelection` | `DistantSunCacheControllerPlanRequestBase` | descriptive-other: Optional scoped construction lattice; omission retains production Native48/Fibonacci3... | entity/value | none |
| 714 | property | `constructionOptions` | `DistantSunCacheControllerPlanRequestBase` | descriptive-other: Optional direct-plan comparison options; omission retains the production order-specif... | entity/value | none |
| 716 | property | `groundBoundary` | `DistantSunCacheControllerPlanRequestBase` | descriptive-other: Optional executable reflective boundary; omission retains canonical black. | entity/value | none |
| 720 | type | `DistantSunCacheControllerPlanRequestN1OrN2` | `<module>` | descriptive-other: Controller plan request that stops before stored-field transport. | entity/value | none |
| 723 | property | `geometry` | `DistantSunCacheControllerPlanRequestN1OrN2` | descriptive-other: Geometry construction contributor. | entity/value | none |
| 725 | property | `maximumScatteringOrder` | `DistantSunCacheControllerPlanRequestN1OrN2` | descriptive-other: Requested J1-only or J1-through-J2 graph. | entity/value | none |
| 729 | type | `DistantSunCacheControllerPlanRequestN4` | `<module>` | descriptive-other: Controller N4 plan request with packed transport-data ownership. | entity/value | none |
| 732 | property | `atmosphere` | `DistantSunCacheControllerPlanRequestN4` | descriptive-other: Atmosphere contributor with transport sampling. | entity/value | none |
| 734 | property | `geometry` | `DistantSunCacheControllerPlanRequestN4` | descriptive-other: Geometry contributor with packed transport-data construction. | entity/value | none |
| 736 | property | `maximumScatteringOrder` | `DistantSunCacheControllerPlanRequestN4` | descriptive-other: Requested J1-through-J4 graph. | entity/value | none |
| 740 | type | `DistantSunCacheControllerPlanRequest` | `<module>` | descriptive-other: Concrete owner request for one controller-derived distant-Sun GPU plan. | entity/value | none |
| 744 | type | `DistantSunCacheSource` | `<module>` | descriptive-other: Configured distant source used by its per-runtime controller. | entity/value | none |
| 747 | property | `configuration` | `DistantSunCacheSource` | descriptive-other: Normalized source-owned construction values. | entity/value | none |
| 751 | type | `DistantSunCacheControllerConfiguration` | `<module>` | descriptive-other: Construction collaborators for one distant-Sun GPU cache controller. | entity/value | none |
| 753 | property | `source` | `DistantSunCacheControllerConfiguration` | descriptive-other: Configured distant-Sun cache contributor. | entity/value | none |
| 755 | property | `backend` | `DistantSunCacheControllerConfiguration` | descriptive-other: Externally owned GPU backend. | entity/value | none |
| 757 | property | `scheduler` | `DistantSunCacheControllerConfiguration` | descriptive-other: Optional cache-build scheduler. | entity/value | none |
| 766 | type | `DistantSunPrimaryRadianceGeometrySpyMethod` | `<module>` | descriptive-other: Geometry method names observed by the distant-Sun primary-radiance evaluator fixture.... | entity/value | union bullets 2/2 |
| 769 | type | `DistantSunGroundContributionEvaluationOptions` | `<module>` | descriptive-other: Ground-contribution controls for one distant-Sun evaluator fixture. | entity/value | none |
| 771 | property | `scatteringOrder` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Pure J2, J3, or J4 order under evaluation. | entity/value | none |
| 773 | property | `normal` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Physical normal at the selected ground hit. | entity/value | none |
| 775 | property | `sourceTransmittance` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Source-to-ground transmittance scalar. | entity/value | none |
| 777 | property | `groundToPositionTransmittance` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Ground-to-construction-position transmittance scalar. | entity/value | none |
| 779 | property | `groundIlluminationRadiance` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Optional pure L1 ground illumination used by J3. | entity/value | none |
| 781 | property | `reflectiveGround` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Optional explicit-ground selection. | entity/value | none |
| 783 | property | `brdfValue` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Optional explicit BRDF scalar. | entity/value | none |
| 785 | property | `previousRadianceValue` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Optional preceding pure-radiance scalar. | entity/value | none |
| 787 | property | `positionStencil` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Optional construction-position stencil. | entity/value | none |
| 789 | property | `finalViewPositionStencil` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Optional distinct final-view position stencil. | entity/value | none |
| 791 | property | `groundHitDistance` | `DistantSunGroundContributionEvaluationOptions` | descriptive-other: Optional distance to the selected ground hit. | entity/value | none |
| 795 | type | `DistantSunGroundContributionEvaluationResult` | `<module>` | descriptive-other: Selected distant-Sun ground contribution and observed operation counts. | entity/value | none |
| 797 | property | `value` | `DistantSunGroundContributionEvaluationResult` | descriptive-other: Selected output scalar. | entity/value | none |
| 799 | property | `sourcePathCount` | `DistantSunGroundContributionEvaluationResult` | descriptive-other: Number of source-path resolutions. | entity/value | none |
| 801 | property | `returnPathCount` | `DistantSunGroundContributionEvaluationResult` | descriptive-other: Number of return-path resolutions. | entity/value | none |
| 803 | property | `sourceLightingCount` | `DistantSunGroundContributionEvaluationResult` | descriptive-other: Number of direct source-lighting samples. | entity/value | none |
| 805 | property | `positionStencilCount` | `DistantSunGroundContributionEvaluationResult` | descriptive-other: Legacy construction-position stencil count. | entity/value | none |
| 807 | property | `constructionPositionStencilCount` | `DistantSunGroundContributionEvaluationResult` | descriptive-other: Number of construction-position stencil resolutions. | entity/value | none |
| 809 | property | `finalViewPositionStencilCount` | `DistantSunGroundContributionEvaluationResult` | descriptive-other: Number of final-view position stencil resolutions. | entity/value | none |

## `src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCache.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCache.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCache.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `DistantSunCache` | `<module>` | descriptive-other: Owner of one completed distant-Sun cumulative GPU cache artifact. | entity/value | none |
| 7 | constructor | `<anonymous@7:2>` | `DistantSunCache` | creates: Creates a distant sun cache instance that takes ownership of one completely construct... | creates | params 1/1 |
| 13 | method | `getRuntimeBindings` | `DistantSunCache` | call-this-method: Call this method to return opaque bindings for the privately owned cumulative field. | active-callable | returns tagged |
| 19 | method | `createShaderContribution` | `DistantSunCache` | call-this-method: Call this method to contribute the Native-48 by W27 cumulative final-view lookup. | active-callable | returns tagged |
| 22 | method | `dispose` | `DistantSunCache` | call-this-method: Call this method to release the completed cumulative GPU field. Repeated disposal is ... | active-callable | none |

## `src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCacheController.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCacheController.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCacheController.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `DistantSunAcceptedCacheBuildRequest` | `<module>` | descriptive-other: Accepted controller request with normalized distant-Sun GPU construction owners. | entity/value | none |
| 5 | property | `groundBoundary` | `DistantSunAcceptedCacheBuildRequest` | descriptive-other: Accepted reflective boundary or canonical black-ground omission. | entity/value | none |
| 7 | property | `maximumScatteringOrder` | `DistantSunAcceptedCacheBuildRequest` | descriptive-other: Accepted N1, N2, or N4 graph maximum. | entity/value | none |
| 11 | type | `DistantSunCacheFieldDomains` | `<module>` | descriptive-other: Shared executable field storage for scattering and radiance plan fields. | entity/value | none |
| 13 | property | `scattering` | `DistantSunCacheFieldDomains` | descriptive-other: Storage shared by pure and cumulative scattering-density fields. | entity/value | none |
| 16 | property | `radiance` | `DistantSunCacheFieldDomains` | descriptive-other: Storage shared by pure transported-radiance fields. | entity/value | none |
| 20 | type | `DistantSunCachePassDefinition` | `<module>` | descriptive-other: Complete owner inputs for one distant-Sun cache pass. | entity/value | none |
| 22 | property | `id` | `DistantSunCachePassDefinition` | descriptive-other: Stable pass identifier. | entity/value | none |
| 25 | property | `context` | `DistantSunCachePassDefinition` | descriptive-other: Physical and numerical context supplied to every pass contributor. | entity/value | none |
| 28 | property | `contributors` | `DistantSunCachePassDefinition` | descriptive-other: Ordered owners contributing modules to the pass. | entity/value | none |
| 31 | property | `includeGround` | `DistantSunCachePassDefinition` | descriptive-other: Whether the pass includes the selected ground owner. | entity/value | none |
| 34 | property | `groundBoundary` | `DistantSunCachePassDefinition` | descriptive-other: Optional reflective ground contributor; null represents canonical black ground. | entity/value | none |
| 38 | class | `DistantSunCacheController` | `<module>` | descriptive-other: Controller for distant-Sun GPU cache construction within one runtime attachment. | entity/value | none |
| 43 | constructor | `<anonymous@43:2>` | `DistantSunCacheController` | creates: Creates one controller without taking ownership of its backend. | creates | params 1/1 |
| 46 | field | `active` | `DistantSunCacheController` | descriptive-other: Atomically published active cache. | entity/value | none |
| 53 | method | `createBuildPlan` | `DistantSunCacheController` | call-this-method: Call this method to derive one source-owned cache build plan without executing it. | active-callable | params 1/1; returns tagged |
| 60 | method | `createScatteringCache` | `DistantSunCacheController` | call-this-method: Call this method to construct or reuse one complete cumulative scattering cache. | active-callable | params 1/1; returns tagged |
| 63 | method | `dispose` | `DistantSunCacheController` | call-this-method: Call this method to cancel staging and release the active cache without owning the ba... | active-callable | none |

## `src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCacheProvider.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCacheProvider.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCacheProvider.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `DistantSunCpuCumulativeFieldDefinition` | `<module>` | descriptive-other: Definition of one cumulative distant-Sun CPU scattering field. | entity/value | none |
| 4 | property | `id` | `DistantSunCpuCumulativeFieldDefinition` | descriptive-other: Unique identifier for the field. | entity/value | none |
| 6 | property | `cumulativeThroughOrder` | `DistantSunCpuCumulativeFieldDefinition` | descriptive-other: Highest cumulative internal target order; order 3 remains non-publishable. | entity/value | none |
| 8 | property | `provenanceIdentity` | `DistantSunCpuCumulativeFieldDefinition` | descriptive-other: Optional field provenance identity. | entity/value | none |
| 10 | property | `domainSelection` | `DistantSunCpuCumulativeFieldDefinition` | descriptive-other: Optional executable production domain; omission retains Native48/W27. | entity/value | none |
| 14 | type | `DistantSunCpuFieldBuildDefinition` | `<module>` | descriptive-other: Normalized metadata for distant-Sun CPU field allocation. | entity/value | none |
| 16 | property | `id` | `DistantSunCpuFieldBuildDefinition` | descriptive-other: Unique identifier for the field. | entity/value | none |
| 18 | property | `packing` | `DistantSunCpuFieldBuildDefinition` | descriptive-other: Source-owned executable field packing. | entity/value | none |
| 20 | property | `order` | `DistantSunCpuFieldBuildDefinition` | descriptive-other: Pure or cumulative scattering order. | entity/value | none |
| 22 | property | `provenanceIdentity` | `DistantSunCpuFieldBuildDefinition` | descriptive-other: Optional field provenance identity when it differs from the production default. | entity/value | none |
| 24 | property | `domainSelection` | `DistantSunCpuFieldBuildDefinition` | descriptive-other: Executable domain selection used by the provider allocator. | entity/value | none |
| 34 | type | `DistantSunCpuTransportedRadianceBuilder` | `<module>` | descriptive-other: Type used by distant-Sun CPU recurrence orchestration to build one transported- radia... | entity/value | none |
| 39 | callback | `<function-type>` | `DistantSunCpuTransportedRadianceBuilder` | called-by: Called by distant sun cpu transported radiance builder to handle one invocation of th... | called-by | params 1/1; returns tagged |
| 42 | type | `DistantSunCpuCacheOperations` | `<module>` | descriptive-other: Recurrence operations used after source-specific J1 and L1. | entity/value | none |
| 50 | method | `createScatteringKernel` | `DistantSunCpuCacheOperations` | call-this-method: Call this method to create each pure L(k-1) to Jk scattering-density kernel synchrono... | active-callable | params 1/1; returns tagged |
| 52 | property | `scatteringProvenanceIdentity` | `DistantSunCpuCacheOperations` | descriptive-other: Numerical implementation identity of the supplied kernel. | entity/value | none |
| 60 | property | `buildTransportedRadiance` | `DistantSunCpuCacheOperations` | descriptive-other: Value used by recurrence orchestration to build J2 to L2 and J3 to L3 when the select... | entity/value | none |
| 64 | type | `DistantSunCpuCacheBuildRequestN1` | `<module>` | descriptive-other: Internal source-owned N=1 recurrence request. | entity/value | none |
| 67 | property | `maximumScatteringOrder` | `DistantSunCpuCacheBuildRequestN1` | descriptive-other: Explicit J1-only pass-graph selection. | entity/value | none |
| 69 | property | `operations` | `DistantSunCpuCacheBuildRequestN1` | descriptive-other: N=1 accepts no unused later-order operation seam. | entity/value | none |
| 73 | type | `DistantSunCpuCacheBuildRequestN2` | `<module>` | descriptive-other: Internal source-owned N=2 recurrence request. | entity/value | none |
| 76 | property | `maximumScatteringOrder` | `DistantSunCpuCacheBuildRequestN2` | descriptive-other: Explicit J1, L1, and J2 pass-graph selection. | entity/value | none |
| 78 | property | `operations` | `DistantSunCpuCacheBuildRequestN2` | descriptive-other: Pure-scattering kernel operations; transport remains unused. | entity/value | none |
| 82 | type | `DistantSunCpuCacheBuildRequestN4` | `<module>` | descriptive-other: Internal source-owned N=4 recurrence request. | entity/value | none |
| 85 | property | `maximumScatteringOrder` | `DistantSunCpuCacheBuildRequestN4` | descriptive-other: Explicit J1-through-J4 pass-graph selection. | entity/value | none |
| 87 | property | `operations` | `DistantSunCpuCacheBuildRequestN4` | descriptive-other: Complete later-order recurrence operations. | entity/value | none |
| 96 | property | `buildTransportedRadiance` | `DistantSunCpuCacheBuildRequestN4` | descriptive-other: Value used by N4 recurrence orchestration to build stored-field radiance for the next... | entity/value | none |
| 101 | type | `DistantSunCpuCacheBuildRequest` | `<module>` | descriptive-other: Any supported internal source-owned CPU recurrence request. | entity/value | none |
| 105 | type | `DistantSunCpuFourthOrderCacheOperations` | `<module>` | descriptive-other: Complete N4 recurrence operations supplied by the cache provider. | entity/value | none |
| 114 | property | `buildTransportedRadiance` | `DistantSunCpuFourthOrderCacheOperations` | descriptive-other: Value used by N4 recurrence orchestration to build stored-field radiance for the next... | entity/value | none |
| 118 | type | `DistantSunCpuRecurrenceContext` | `<module>` | descriptive-other: Source-owned physical collaborators captured by CPU recurrence methods. | entity/value | none |
| 120 | property | `request` | `DistantSunCpuRecurrenceContext` | descriptive-other: Accepted public multiple-scattering request. | entity/value | none |
| 122 | property | `domainSelection` | `DistantSunCpuRecurrenceContext` | descriptive-other: Accepted executable position and direction domains. | entity/value | none |
| 124 | property | `transportIntervalCount` | `DistantSunCpuRecurrenceContext` | descriptive-other: Accepted executable path-integration interval count. | entity/value | none |
| 126 | property | `calculator` | `DistantSunCpuRecurrenceContext` | descriptive-other: Source-created shared spectral calculator. | entity/value | none |
| 128 | property | `profile` | `DistantSunCpuRecurrenceContext` | descriptive-other: Accepted explicit or omitted-boundary default profile. | entity/value | none |
| 132 | type | `DistantSunCpuCumulativeResultRequest` | `<module>` | descriptive-other: Completed pure fields and identities used to assemble the cumulative result. | entity/value | none |
| 134 | property | `maximumScatteringOrder` | `DistantSunCpuCumulativeResultRequest` | descriptive-other: Final scattering order of the completed recurrence. | entity/value | none |
| 136 | property | `pureScatteringDensityByOrder` | `DistantSunCpuCumulativeResultRequest` | descriptive-other: Pure scattering-density fields in ascending order. | entity/value | none |
| 138 | property | `boundaryIdentitySuffix` | `DistantSunCpuCumulativeResultRequest` | descriptive-other: Boundary-dependent suffix retained by every field identity. | entity/value | none |
| 140 | property | `domainSelection` | `DistantSunCpuCumulativeResultRequest` | descriptive-other: Executable construction-domain selection. | entity/value | none |
| 142 | property | `transportIntervalCount` | `DistantSunCpuCumulativeResultRequest` | descriptive-other: Executed path-integration interval count. | entity/value | none |
| 146 | type | `DistantSunCpuCumulativeResult` | `<module>` | descriptive-other: Sealed cumulative field and executed construction options. | entity/value | none |
| 148 | property | `cumulativeScatteringDensity` | `DistantSunCpuCumulativeResult` | descriptive-other: Final sealed cumulative scattering-density field. | entity/value | none |
| 150 | property | `options` | `DistantSunCpuCumulativeResult` | descriptive-other: Cache-construction options that completed. | entity/value | none |

## `src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCpuCache.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCpuCache.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCpuCache.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `DistantSunCpuCache` | `<module>` | descriptive-other: Object that owns the resident CPU cumulative scattering-density field for one complet... | entity/value | none |
| 7 | constructor | `<anonymous@7:2>` | `DistantSunCpuCache` | creates: Creates a distant sun cpu cache instance that consumes one completed N1, N2, or N4 di... | creates | params 1/1 |
| 10 | field | `sampleProvenanceIdentity` | `DistantSunCpuCache` | descriptive-other: Value that identifies the physical provenance of returned spectral samples. | entity/value | none |
| 17 | method | `sampleResolved` | `DistantSunCpuCache` | call-this-method: Call this method to sample all spectral channels from already-resolved physical stenc... | active-callable | params 1/1; returns tagged |
| 20 | method | `dispose` | `DistantSunCpuCache` | call-this-method: Call this method to release the resident CPU reader. Repeated disposal is safe. | active-callable | none |

## `src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCpuMultipleScatteringEvaluator.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCpuMultipleScatteringEvaluator.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCpuMultipleScatteringEvaluator.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `DistantSunLaterOrderScatteringKernelRequest` | `<module>` | descriptive-other: Source-owned distant-Sun later-order scattering-kernel request. | entity/value | none |
| 6 | type | `DistantSunLaterOrderScatteringContext` | `<module>` | descriptive-other: Source-specific facts accepted once at the adapter boundary. | entity/value | none |
| 8 | property | `request` | `DistantSunLaterOrderScatteringContext` | descriptive-other: Accepted adapter request. | entity/value | none |
| 10 | property | `domainSelection` | `DistantSunLaterOrderScatteringContext` | descriptive-other: Accepted executable position and direction domains. | entity/value | none |
| 14 | type | `DistantSunCpuPhysicalDirectionResolvers` | `<module>` | descriptive-other: Precomputed physical direction resolvers used by one later-order kernel. | entity/value | none |
| 16 | property | `incoming` | `DistantSunCpuPhysicalDirectionResolvers` | descriptive-other: Resolver for selected incoming-radiance directions. | entity/value | none |
| 18 | property | `outgoing` | `DistantSunCpuPhysicalDirectionResolvers` | descriptive-other: Resolver for selected outgoing-scattering directions. | entity/value | none |
| 22 | type | `DistantSunCpuTransportInputs` | `<module>` | descriptive-other: Accepted allocation facts for one stored-field transport build. | entity/value | none |
| 24 | property | `scatteringDensity` | `DistantSunCpuTransportInputs` | descriptive-other: Sealed pure scattering-density input field. | entity/value | none |
| 26 | property | `order` | `DistantSunCpuTransportInputs` | descriptive-other: Pure scattering order transported into radiance. | entity/value | none |
| 28 | property | `id` | `DistantSunCpuTransportInputs` | descriptive-other: Pure-radiance output field identity. | entity/value | none |
| 30 | property | `domainSelection` | `DistantSunCpuTransportInputs` | descriptive-other: Executable construction-domain selection. | entity/value | none |
| 32 | property | `transportIntervalCount` | `DistantSunCpuTransportInputs` | descriptive-other: Executed path-integration interval count. | entity/value | none |

## `src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCpuPrimaryEvaluator.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCpuPrimaryEvaluator.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/cache/types/DistantSunCpuPrimaryEvaluator.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `DistantSunCpuPrimaryProfileFacts` | `<module>` | descriptive-other: Native profile facts selected for one primary evaluation. | entity/value | none |
| 4 | property | `profile` | `DistantSunCpuPrimaryProfileFacts` | descriptive-other: Selected native production profile. | entity/value | none |
| 6 | property | `sourcePacket` | `DistantSunCpuPrimaryProfileFacts` | descriptive-other: Direct-source irradiance-density packet owned by the profile. | entity/value | none |
| 8 | property | `spectralBasis` | `DistantSunCpuPrimaryProfileFacts` | descriptive-other: Native spectral basis used by the evaluation. | entity/value | none |
| 12 | type | `DistantSunCpuPrimaryRadianceInputs` | `<module>` | descriptive-other: Accepted collaborators and identities for one primary-radiance build. | entity/value | none |
| 14 | property | `atmosphere` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Atmosphere used by direct-radiance evaluation. | entity/value | none |
| 16 | property | `geometry` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Geometry used to reconstruct direct-radiance paths. | entity/value | none |
| 18 | property | `lightSource` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Provider-captured configured distant source. | entity/value | none |
| 20 | property | `calculator` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Canonical calculator shared by the recurrence. | entity/value | none |
| 22 | property | `profile` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Selected native production profile. | entity/value | none |
| 24 | property | `spectralBasis` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Native spectral basis used by the evaluation. | entity/value | none |
| 26 | property | `domainSelection` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Executable construction-domain selection. | entity/value | none |
| 28 | property | `transportIntervalCount` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Executed path-integration interval count. | entity/value | none |
| 30 | property | `id` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Pure-radiance field identity. | entity/value | none |
| 32 | property | `provenanceIdentity` | `DistantSunCpuPrimaryRadianceInputs` | descriptive-other: Numerical provenance identity of the field. | entity/value | none |
| 36 | type | `DistantSunCpuPrimaryScatteringInputs` | `<module>` | descriptive-other: Accepted collaborators and identities for one primary-scattering build. | entity/value | none |
| 38 | property | `atmosphere` | `DistantSunCpuPrimaryScatteringInputs` | descriptive-other: Atmosphere used by primary-scattering evaluation. | entity/value | none |
| 40 | property | `geometry` | `DistantSunCpuPrimaryScatteringInputs` | descriptive-other: Geometry used to reconstruct primary-scattering positions. | entity/value | none |
| 42 | property | `lightSource` | `DistantSunCpuPrimaryScatteringInputs` | descriptive-other: Provider-captured configured distant source. | entity/value | none |
| 44 | property | `profile` | `DistantSunCpuPrimaryScatteringInputs` | descriptive-other: Selected native production profile. | entity/value | none |
| 46 | property | `sourcePacket` | `DistantSunCpuPrimaryScatteringInputs` | descriptive-other: Direct-source irradiance-density packet owned by the profile. | entity/value | none |
| 48 | property | `domainSelection` | `DistantSunCpuPrimaryScatteringInputs` | descriptive-other: Executable construction-domain selection. | entity/value | none |
| 50 | property | `id` | `DistantSunCpuPrimaryScatteringInputs` | descriptive-other: Pure-scattering-density field identity. | entity/value | none |
| 52 | property | `provenanceIdentity` | `DistantSunCpuPrimaryScatteringInputs` | descriptive-other: Numerical provenance identity of the field. | entity/value | none |
| 56 | type | `DistantSunCpuDirectLightingInputs` | `<module>` | descriptive-other: Accepted direct-lighting values for primary scattering. | entity/value | none |
| 58 | property | `sourceIrradianceWattsPerSquareMeterPerNanometer` | `DistantSunCpuDirectLightingInputs` | descriptive-other: Top-of-atmosphere source irradiance density by spectral channel. | entity/value | none |
| 60 | property | `directionToLight` | `DistantSunCpuDirectLightingInputs` | descriptive-other: Normalized physical direction from the sample toward the source. | entity/value | none |
| 64 | type | `DistantSunCpuSourceTransmittanceRequest` | `<module>` | descriptive-other: Source-path request used by primary scattering. | entity/value | none |
| 66 | property | `atmosphere` | `DistantSunCpuSourceTransmittanceRequest` | descriptive-other: Atmosphere that integrates source-path optical depth. | entity/value | none |
| 68 | property | `geometry` | `DistantSunCpuSourceTransmittanceRequest` | descriptive-other: Geometry that resolves the bounded atmosphere path. | entity/value | none |
| 70 | property | `raySegment` | `DistantSunCpuSourceTransmittanceRequest` | descriptive-other: Physical ray segment beginning at the cache position. | entity/value | none |
| 72 | property | `sourcePathLimit` | `DistantSunCpuSourceTransmittanceRequest` | descriptive-other: Source-owned path limit for the direct-light ray. | entity/value | none |
| 74 | property | `intervalCount` | `DistantSunCpuSourceTransmittanceRequest` | descriptive-other: Executed source-path integration interval count. | entity/value | none |

## `src/algorithm32/light-sources/distant-sun/three/types.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/three/types.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/three/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `DistantSunSceneLightingSource` | `<module>` | descriptive-other: Facade-owned scene-scale operation used by distant-Sun Three lighting. | entity/value | none |
| 9 | method | `resolveSceneLightScales` | `DistantSunSceneLightingSource` | call-this-method: Call this method to resolve neutral distant-source scene-light scales. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/distant-sun/three/types/DistantSunSceneLightingAdapter.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/three/types/DistantSunSceneLightingAdapter.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/three/types/DistantSunSceneLightingAdapter.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `DistantThreeObject` | `<module>` | descriptive-other: Three object surface used by distant-source lighting. | entity/value | none |
| 4 | property | `name` | `DistantThreeObject` | descriptive-other: Renderer object name. | entity/value | none |
| 6 | property | `position` | `DistantThreeObject` | descriptive-other: Mutable renderer position interface. | entity/value | none |
| 14 | method | `set` | `DistantThreeObject` | call-this-method: Call this method to assign renderer position coordinates. | active-callable | params 1/1 |
| 17 | property | `userData` | `DistantThreeObject` | descriptive-other: Renderer-neutral Algorithm32 metadata. | entity/value | none |
| 21 | type | `DistantThreeDirectionalLight` | `<module>` | descriptive-other: Three directional-light surface used by distant-source lighting. | entity/value | none |
| 23 | property | `target` | `DistantThreeDirectionalLight` | descriptive-other: Directional-light target. | entity/value | none |
| 25 | property | `castShadow` | `DistantThreeDirectionalLight` | descriptive-other: Whether the light casts renderer shadows. | entity/value | none |
| 27 | property | `shadow` | `DistantThreeDirectionalLight` | descriptive-other: Optional renderer shadow configuration. | entity/value | none |
| 29 | property | `mapSize` | `DistantThreeDirectionalLight` | descriptive-other: Optional shadow-map dimensions. | entity/value | none |
| 31 | property | `width` | `DistantThreeDirectionalLight` | descriptive-other: Shadow-map width in pixels. | entity/value | none |
| 33 | property | `height` | `DistantThreeDirectionalLight` | descriptive-other: Shadow-map height in pixels. | entity/value | none |
| 36 | property | `camera` | `DistantThreeDirectionalLight` | descriptive-other: Optional directional shadow-camera state. | entity/value | none |
| 38 | property | `left` | `DistantThreeDirectionalLight` | descriptive-other: Camera left plane in scene units. | entity/value | none |
| 40 | property | `right` | `DistantThreeDirectionalLight` | descriptive-other: Camera right plane in scene units. | entity/value | none |
| 42 | property | `top` | `DistantThreeDirectionalLight` | descriptive-other: Camera top plane in scene units. | entity/value | none |
| 44 | property | `bottom` | `DistantThreeDirectionalLight` | descriptive-other: Camera bottom plane in scene units. | entity/value | none |
| 46 | property | `near` | `DistantThreeDirectionalLight` | descriptive-other: Camera near plane in scene units. | entity/value | none |
| 48 | property | `far` | `DistantThreeDirectionalLight` | descriptive-other: Camera far plane in scene units. | entity/value | none |
| 55 | method | `updateProjectionMatrix` | `DistantThreeDirectionalLight` | call-this-method: Call this method to rebuild renderer projection state after camera changes. | active-callable | none |
| 58 | property | `bias` | `DistantThreeDirectionalLight` | descriptive-other: Renderer shadow bias. | entity/value | none |
| 60 | property | `normalBias` | `DistantThreeDirectionalLight` | descriptive-other: Renderer shadow normal bias in scene units. | entity/value | none |
| 62 | property | `radius` | `DistantThreeDirectionalLight` | descriptive-other: Renderer shadow blur radius in pixels. | entity/value | none |
| 64 | property | `intensity` | `DistantThreeDirectionalLight` | descriptive-other: Renderer shadow intensity. | entity/value | none |
| 69 | type | `DistantThreeNamespace` | `<module>` | descriptive-other: Three constructors used by distant-source lighting. | entity/value | none |
| 71 | property | `Object3D` | `DistantThreeNamespace` | descriptive-other: Three object constructor. | entity/value | none |
| 73 | property | `DirectionalLight` | `DistantThreeNamespace` | descriptive-other: Three directional-light constructor. | entity/value | none |
| 75 | property | `AmbientLight` | `DistantThreeNamespace` | descriptive-other: Three ambient-light constructor. | entity/value | none |
| 79 | type | `DistantSunNormalizedShadowObject` | `<module>` | descriptive-other: Normalized distant-Sun shadow-object settings. | entity/value | none |
| 81 | property | `objectKey` | `DistantSunNormalizedShadowObject` | descriptive-other: Unique caller-visible key for the shadow object. | entity/value | none |
| 83 | property | `layerIndex` | `DistantSunNormalizedShadowObject` | descriptive-other: Optional Three layer index for the shadow camera. | entity/value | none |
| 85 | property | `focus` | `DistantSunNormalizedShadowObject` | descriptive-other: Shadow target in scene units. | entity/value | none |
| 87 | property | `extent` | `DistantSunNormalizedShadowObject` | descriptive-other: Symmetric default shadow extent in scene units. | entity/value | none |
| 89 | property | `lightDistance` | `DistantSunNormalizedShadowObject` | descriptive-other: Directional-light distance in scene units. | entity/value | none |
| 91 | property | `cameraLeft` | `DistantSunNormalizedShadowObject` | descriptive-other: Orthographic camera left plane in scene units. | entity/value | none |
| 93 | property | `cameraRight` | `DistantSunNormalizedShadowObject` | descriptive-other: Orthographic camera right plane in scene units. | entity/value | none |
| 95 | property | `cameraTop` | `DistantSunNormalizedShadowObject` | descriptive-other: Orthographic camera top plane in scene units. | entity/value | none |
| 97 | property | `cameraBottom` | `DistantSunNormalizedShadowObject` | descriptive-other: Orthographic camera bottom plane in scene units. | entity/value | none |
| 99 | property | `cameraNear` | `DistantSunNormalizedShadowObject` | descriptive-other: Shadow-camera near plane in scene units. | entity/value | none |
| 101 | property | `cameraFar` | `DistantSunNormalizedShadowObject` | descriptive-other: Shadow-camera far plane in scene units. | entity/value | none |
| 103 | property | `mapSize` | `DistantSunNormalizedShadowObject` | descriptive-other: Shadow-map dimensions in pixels. | entity/value | none |
| 105 | property | `bias` | `DistantSunNormalizedShadowObject` | descriptive-other: Renderer shadow bias. | entity/value | none |
| 107 | property | `normalBias` | `DistantSunNormalizedShadowObject` | descriptive-other: Renderer normal bias in scene units. | entity/value | none |
| 109 | property | `radius` | `DistantSunNormalizedShadowObject` | descriptive-other: Renderer shadow blur radius in pixels. | entity/value | none |
| 111 | property | `shadowIntensity` | `DistantSunNormalizedShadowObject` | descriptive-other: Renderer shadow intensity. | entity/value | none |
| 115 | type | `DistantSunNormalizedShadowRequest` | `<module>` | descriptive-other: Normalized distant-Sun shadow policy and ordered object settings. | entity/value | none |
| 117 | property | `enabled` | `DistantSunNormalizedShadowRequest` | descriptive-other: Whether shadow-map lighting is enabled. | entity/value | none |
| 119 | property | `objects` | `DistantSunNormalizedShadowRequest` | descriptive-other: Ordered shadow-object settings. | entity/value | none |
| 123 | type | `DistantSunDirectionalLightRequest` | `<module>` | descriptive-other: Inputs for one distant-Sun directional-light and target pair. | entity/value | none |
| 125 | property | `THREE` | `DistantSunDirectionalLightRequest` | descriptive-other: Three constructors for the light and target. | entity/value | none |
| 127 | property | `directionToSource` | `DistantSunDirectionalLightRequest` | descriptive-other: Normalized scene direction toward the source. | entity/value | none |
| 129 | property | `intensity` | `DistantSunDirectionalLightRequest` | descriptive-other: Directional-light intensity. | entity/value | none |
| 131 | property | `focus` | `DistantSunDirectionalLightRequest` | descriptive-other: Target point in scene units. | entity/value | none |
| 133 | property | `lightDistance` | `DistantSunDirectionalLightRequest` | descriptive-other: Light placement distance in scene units. | entity/value | none |
| 135 | property | `shadowObject` | `DistantSunDirectionalLightRequest` | descriptive-other: Optional normalized shadow settings for the light. | entity/value | none |
| 137 | property | `objectIndex` | `DistantSunDirectionalLightRequest` | descriptive-other: Stable ordinal for the generated light and target names. | entity/value | none |
| 141 | type | `DistantSunDirectionalLightPair` | `<module>` | descriptive-other: Created distant-Sun directional light and target pair. | entity/value | none |
| 143 | property | `light` | `DistantSunDirectionalLightPair` | descriptive-other: Created directional light. | entity/value | none |
| 145 | property | `target` | `DistantSunDirectionalLightPair` | descriptive-other: Created directional-light target. | entity/value | none |
| 149 | type | `DistantSunAmbientLightRequest` | `<module>` | descriptive-other: Inputs for one distant-Sun ambient fill light. | entity/value | none |
| 151 | property | `THREE` | `DistantSunAmbientLightRequest` | descriptive-other: Three ambient-light constructor. | entity/value | none |
| 153 | property | `ambientIntensity` | `DistantSunAmbientLightRequest` | descriptive-other: Non-negative ambient intensity. | entity/value | none |

## `src/algorithm32/light-sources/distant-sun/types.d.ts`

Source: [src/algorithm32/light-sources/distant-sun/types.d.ts](../../../../../../src/algorithm32/light-sources/distant-sun/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `DistantSunLightSourceConfig` | `<module>` | descriptive-other: Physical configuration for a distant-Sun light source. | entity/value | none |
| 4 | property | `directionToLight` | `DistantSunLightSourceConfig` | descriptive-other: Normalized or normalizable direction from a sample toward the source. | entity/value | none |
| 7 | property | `sourceIrradiance` | `DistantSunLightSourceConfig` | descriptive-other: Source spectral irradiance with its basis and units. | entity/value | none |
| 10 | property | `angularRadius` | `DistantSunLightSourceConfig` | descriptive-other: Apparent source angular radius. | entity/value | none |
| 20 | type | `DistantSunCpuPrimaryRadianceFieldRequestExcludedProperty` | `<module>` | descriptive-other: Facade-owned properties excluded from a distant-Sun primary-radiance field request. -... | entity/value | union bullets 3/3 |
| 25 | type | `DistantSunCpuPrimaryRadianceFieldRequest` | `<module>` | descriptive-other: Distant-source direct CPU primary-radiance request without the facade-owned source an... | entity/value | none |
| 31 | property | `transportIntervalCount` | `DistantSunCpuPrimaryRadianceFieldRequest` | descriptive-other: Optional offline interval count; omission retains the production count of 15. | entity/value | none |
| 35 | type | `DistantSunCpuCacheResult` | `<module>` | descriptive-other: Complete supported distant-Sun CPU cache result. | entity/value | none |
| 38 | type | `DistantSunCpuCacheRequest` | `<module>` | descriptive-other: Public source-owned N=1, N=2, or default-N=4 CPU cache request. | entity/value | none |
| 42 | type | `DistantSunShadowObjectConfiguration` | `<module>` | descriptive-other: Optional source-shadow flags accepted by the distant-Sun facade. | entity/value | none |
| 44 | property | `castShadow` | `DistantSunShadowObjectConfiguration` | descriptive-other: Whether configured nodes cast shadows. | entity/value | none |
| 46 | property | `receiveShadow` | `DistantSunShadowObjectConfiguration` | descriptive-other: Whether configured nodes receive shadows. | entity/value | none |
| 48 | property | `includeDescendants` | `DistantSunShadowObjectConfiguration` | descriptive-other: Whether descendant nodes receive the same configuration. | entity/value | none |
| 50 | property | `shadowPolicy` | `DistantSunShadowObjectConfiguration` | descriptive-other: Optional shadow-policy metadata override. | entity/value | none |
| 52 | property | `sourceKey` | `DistantSunShadowObjectConfiguration` | descriptive-other: Optional source-key metadata override. | entity/value | none |
| 54 | property | `layerIndex` | `DistantSunShadowObjectConfiguration` | descriptive-other: Optional Three layer index enabled on configured nodes. | entity/value | none |

## `src/algorithm32/light-sources/local-sun/cache/types.d.ts`

Source: [src/algorithm32/light-sources/local-sun/cache/types.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/cache/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LocalSunCacheProviderSource` | `<module>` | descriptive-other: Physical local-Sun facade consumed by cache construction. | entity/value | none |
| 6 | property | `configuration` | `LocalSunCacheProviderSource` | descriptive-other: Complete normalized source configuration retained by the facade. | entity/value | none |
| 10 | type | `LocalSunCacheProviderDefinition` | `<module>` | descriptive-other: Constructor values for a local-Sun cache provider. | entity/value | none |
| 12 | property | `source` | `LocalSunCacheProviderDefinition` | descriptive-other: Physical source facade retained for continuous-lighting dispatch. | entity/value | none |
| 14 | property | `configuration` | `LocalSunCacheProviderDefinition` | descriptive-other: Normalized source configuration retained by reference. | entity/value | none |
| 26 | type | `LocalSunShellFactSourceConfigurationProperty` | `<module>` | descriptive-other: Source-configuration properties retained by local-Sun shell facts. - **"position"** -... | entity/value | union bullets 5/5 |
| 30 | type | `LocalSunShellFactSourceConfiguration` | `<module>` | descriptive-other: Normalized source facts used to derive fixed shell facts. | entity/value | none |
| 36 | type | `LocalSunShellFactCacheConfiguration` | `<module>` | descriptive-other: Construction data for one fixed source-paired shell-fact owner. | entity/value | none |
| 38 | property | `sourceConfiguration` | `LocalSunShellFactCacheConfiguration` | descriptive-other: Normalized physical source facts. | entity/value | none |
| 42 | type | `LocalSunResolvedShell` | `<module>` | descriptive-other: Resolved containing shell. | entity/value | none |
| 44 | property | `shellIndex` | `LocalSunResolvedShell` | descriptive-other: Higher-boundary-owned shell index. | entity/value | none |
| 46 | property | `heldIncidentScale` | `LocalSunResolvedShell` | descriptive-other: Precomputed held incident scale. | entity/value | none |
| 48 | property | `distanceFromSource` | `LocalSunResolvedShell` | descriptive-other: Accepted or clamped source distance. | entity/value | none |
| 50 | property | `clamped` | `LocalSunResolvedShell` | descriptive-other: Requested-distance clamping state. | entity/value | none |
| 54 | type | `LocalSunShellFactResourceUsage` | `<module>` | descriptive-other: Retained binary64 payload owned by the shell-fact cache. | entity/value | none |
| 56 | property | `boundaries` | `LocalSunShellFactResourceUsage` | descriptive-other: Ordered boundary storage. | entity/value | none |
| 58 | property | `heldIncidentScales` | `LocalSunShellFactResourceUsage` | descriptive-other: Held incident-scale storage. | entity/value | none |
| 60 | property | `total` | `LocalSunShellFactResourceUsage` | descriptive-other: Complete retained binary64 payload. | entity/value | none |
| 64 | interface | `LocalSunShellFactCache` | `<module>` | descriptive-other: Fixed N=2048 local-Sun shell facts. | entity/value | none |
| 66 | property | `id` | `LocalSunShellFactCache` | descriptive-other: Executable shell-fact owner identity. | entity/value | none |
| 68 | property | `shellCount` | `LocalSunShellFactCache` | descriptive-other: Executable shell count. | entity/value | none |
| 70 | property | `boundaryCount` | `LocalSunShellFactCache` | descriptive-other: Executable boundary count. | entity/value | none |
| 72 | property | `minimumDistance` | `LocalSunShellFactCache` | descriptive-other: Executable lower clamp. | entity/value | none |
| 74 | property | `maximumDistance` | `LocalSunShellFactCache` | descriptive-other: Executable upper clamp. | entity/value | none |
| 76 | property | `boundaries` | `LocalSunShellFactCache` | descriptive-other: Independent copy of ordered binary64 boundaries. | entity/value | none |
| 78 | property | `heldIncidentScales` | `LocalSunShellFactCache` | descriptive-other: Independent copy of binary64 held incident scales. | entity/value | none |
| 80 | property | `resourceUsage` | `LocalSunShellFactCache` | descriptive-other: Retained binary64 payload without mutable storage exposure. | entity/value | none |
| 86 | method | `resolveShell` | `LocalSunShellFactCache` | call-this-method: Call this method to resolve one finite source distance to its containing shell. | active-callable | params 1/1; returns tagged |
| 90 | type | `LocalSunConstructionContinuousSource` | `<module>` | descriptive-other: Physical local-Sun contract required by J1 construction. | entity/value | none |
| 92 | property | `id` | `LocalSunConstructionContinuousSource` | descriptive-other: Unique identifier for the configured physical source. | entity/value | none |
| 94 | property | `configuration` | `LocalSunConstructionContinuousSource` | descriptive-other: Normalized physical facts used to scale spectral irradiance. | entity/value | none |
| 100 | method | `sampleDirectLighting` | `LocalSunConstructionContinuousSource` | call-this-method: Call this method to sample continuous direct lighting at one physical position. | active-callable | params 1/1; returns tagged |
| 106 | method | `resolveSourcePathLimit` | `LocalSunConstructionContinuousSource` | call-this-method: Call this method to resolve the finite source path limit. | active-callable | params 1/1; returns tagged |
| 112 | method | `createCacheController` | `LocalSunConstructionContinuousSource` | call-this-method: Call this method to create the physical source's cache controller. | active-callable | params 1/1; returns tagged |
| 116 | type | `LocalSunConstructionLightSourceDefinition` | `<module>` | descriptive-other: Continuous source and shell facts for one construction-only local-Sun adapter. | entity/value | none |
| 118 | property | `source` | `LocalSunConstructionLightSourceDefinition` | descriptive-other: Continuous physical source. | entity/value | none |
| 120 | property | `shellFactCache` | `LocalSunConstructionLightSourceDefinition` | descriptive-other: Source-paired executable shell facts. | entity/value | none |
| 124 | type | `LocalSunFieldPackingDefinition` | `<module>` | descriptive-other: Executable scalar-storage dimensions for one local-Sun field. | entity/value | none |
| 126 | property | `id` | `LocalSunFieldPackingDefinition` | descriptive-other: Unique identifier for the packing. | entity/value | none |
| 128 | property | `directionCount` | `LocalSunFieldPackingDefinition` | descriptive-other: Number of directions. | entity/value | none |
| 130 | property | `positionCount` | `LocalSunFieldPackingDefinition` | descriptive-other: Number of flattened positions. | entity/value | none |
| 132 | property | `wavelengthCount` | `LocalSunFieldPackingDefinition` | descriptive-other: Number of spectral channels. | entity/value | none |
| 136 | interface | `LocalSunFieldPacking` | `<module>` | descriptive-other: Executable scalar packing for one local-Sun field. | entity/value | none |
| 138 | property | `kind` | `LocalSunFieldPacking` | descriptive-other: Contract kind for local-Sun field packing. | entity/value | none |
| 140 | property | `id` | `LocalSunFieldPacking` | descriptive-other: Unique identifier for the packing. | entity/value | none |
| 142 | property | `directionCount` | `LocalSunFieldPacking` | descriptive-other: Number of directions. | entity/value | none |
| 144 | property | `positionCount` | `LocalSunFieldPacking` | descriptive-other: Number of positions. | entity/value | none |
| 146 | property | `wavelengthCount` | `LocalSunFieldPacking` | descriptive-other: Number of wavelengths. | entity/value | none |
| 148 | property | `scalarCount` | `LocalSunFieldPacking` | descriptive-other: Number of packed scalars. | entity/value | none |
| 154 | method | `coordinatesAt` | `LocalSunFieldPacking` | call-this-method: Call this method to recover logical coordinates from an offset. | active-callable | params 1/1; returns tagged |
| 158 | type | `LocalSunPositionDomainOwner` | `<module>` | descriptive-other: Geometry-owned executable flattened z-by-rho position domain. | entity/value | none |
| 160 | property | `id` | `LocalSunPositionDomainOwner` | descriptive-other: Unique identifier for the executable position domain. | entity/value | none |
| 162 | property | `nodes` | `LocalSunPositionDomainOwner` | descriptive-other: Z-major, rho-fast flattened position nodes. | entity/value | none |
| 164 | property | `zNodes` | `LocalSunPositionDomainOwner` | descriptive-other: Ordered altitude nodes. | entity/value | none |
| 166 | property | `rhoNodes` | `LocalSunPositionDomainOwner` | descriptive-other: Ordered radial nodes. | entity/value | none |
| 168 | property | `zCount` | `LocalSunPositionDomainOwner` | descriptive-other: Number of altitude nodes. | entity/value | none |
| 170 | property | `rhoCount` | `LocalSunPositionDomainOwner` | descriptive-other: Number of radial nodes. | entity/value | none |
| 172 | property | `count` | `LocalSunPositionDomainOwner` | descriptive-other: Number of flattened position nodes. | entity/value | none |
| 176 | type | `LocalSunConstructionDomainSelectionDefinition` | `<module>` | descriptive-other: Executable owners and identities for one local-Sun construction-domain selection. | entity/value | none |
| 178 | property | `id` | `LocalSunConstructionDomainSelectionDefinition` | descriptive-other: Unique identifier for the coherent domain selection. | entity/value | none |
| 180 | property | `positionDomainOwner` | `LocalSunConstructionDomainSelectionDefinition` | descriptive-other: Geometry-owned executable z-by-rho position domain. | entity/value | none |
| 182 | property | `outgoingDirectionDomainOwner` | `LocalSunConstructionDomainSelectionDefinition` | descriptive-other: Executable outgoing cubed-sphere direction domain. | entity/value | none |
| 184 | property | `spectralBasis` | `LocalSunConstructionDomainSelectionDefinition` | descriptive-other: Spectral basis for every construction field. | entity/value | none |
| 186 | property | `radiancePackingId` | `LocalSunConstructionDomainSelectionDefinition` | descriptive-other: Unique identifier for incoming-radiance packing. | entity/value | none |
| 188 | property | `scatteringDensityPackingId` | `LocalSunConstructionDomainSelectionDefinition` | descriptive-other: Unique identifier for outgoing scattering-density packing. | entity/value | none |
| 192 | interface | `LocalSunConstructionDomainSelection` | `<module>` | descriptive-other: Coherent executable local-Sun construction-domain selection. | entity/value | none |
| 194 | property | `kind` | `LocalSunConstructionDomainSelection` | descriptive-other: Contract kind for a local-Sun construction-domain selection. | entity/value | none |
| 196 | property | `id` | `LocalSunConstructionDomainSelection` | descriptive-other: Unique identifier for the coherent domain selection. | entity/value | none |
| 198 | property | `positionDomain` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable position domain. | entity/value | none |
| 200 | property | `positionNodes` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable z-major, rho-fast flattened positions. | entity/value | none |
| 202 | property | `zNodes` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable altitude nodes. | entity/value | none |
| 204 | property | `rhoNodes` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable radial nodes. | entity/value | none |
| 206 | property | `zCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of altitude nodes. | entity/value | none |
| 208 | property | `rhoCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of radial nodes. | entity/value | none |
| 210 | property | `positionCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of flattened position nodes. | entity/value | none |
| 212 | property | `spectralBasis` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable spectral basis. | entity/value | none |
| 214 | property | `spectralChannelCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of executable spectral channels. | entity/value | none |
| 216 | property | `incomingDirectionDomain` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable incoming-direction domain. | entity/value | none |
| 218 | property | `incomingUnitVectors` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable paired-Fibonacci-34 unit vectors. | entity/value | none |
| 220 | property | `incomingIntegrationWeights` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable paired-Fibonacci-34 solid-angle weights. | entity/value | none |
| 222 | property | `incomingDirectionCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of executable incoming directions. | entity/value | none |
| 224 | property | `outgoingDirectionDomain` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable outgoing-direction domain. | entity/value | none |
| 226 | property | `outgoingUnitVectors` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable cubed-sphere outgoing unit vectors. | entity/value | none |
| 228 | property | `outgoingDirectionCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of executable outgoing directions. | entity/value | none |
| 230 | property | `outgoingPositiveFaceCenterIndices` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable positive-axis face-center addresses. | entity/value | none |
| 232 | property | `radiancePacking` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable incoming-radiance packing. | entity/value | none |
| 234 | property | `scatteringDensityPacking` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable outgoing scattering-density packing. | entity/value | none |
| 240 | method | `resolveOutgoingDirectionStencil` | `LocalSunConstructionDomainSelection` | call-this-method: Call this method to resolve one source-local outgoing direction into W-domain taps. | active-callable | params 1/1; returns tagged |
| 244 | type | `LocalSunConstructionDomainGeometryOptions` | `<module>` | descriptive-other: Optional convergence-domain overrides for a local-Sun construction selection. | entity/value | none |
| 246 | property | `zCount` | `LocalSunConstructionDomainGeometryOptions` | descriptive-other: Optional altitude-node count. | entity/value | none |
| 248 | property | `rhoCount` | `LocalSunConstructionDomainGeometryOptions` | descriptive-other: Optional radial-node count. | entity/value | none |
| 250 | property | `id` | `LocalSunConstructionDomainGeometryOptions` | descriptive-other: Optional selection identifier. | entity/value | none |
| 252 | property | `outgoingDirectionDomainOwner` | `LocalSunConstructionDomainGeometryOptions` | descriptive-other: Optional outgoing direction-domain owner. | entity/value | none |
| 254 | property | `spectralBasis` | `LocalSunConstructionDomainGeometryOptions` | descriptive-other: Optional construction spectral basis. | entity/value | none |
| 256 | property | `radiancePackingId` | `LocalSunConstructionDomainGeometryOptions` | descriptive-other: Optional incoming-radiance packing identifier. | entity/value | none |
| 258 | property | `scatteringDensityPackingId` | `LocalSunConstructionDomainGeometryOptions` | descriptive-other: Optional outgoing scattering-density packing identifier. | entity/value | none |
| 262 | type | `LocalSunConstructionDomainGeometry` | `<module>` | descriptive-other: Geometry contract capable of constructing the local position domain. | entity/value | none |
| 268 | method | `createLocalSunCachePositionDomain` | `LocalSunConstructionDomainGeometry` | call-this-method: Call this method to create geometry-owned z-by-rho nodes. | active-callable | params 1/1; returns tagged |
| 272 | type | `LocalSunCacheBuildGeometry` | `<module>` | descriptive-other: Flat-geometry capabilities required by local-Sun GPU construction. | entity/value | none |
| 277 | property | `configuration` | `LocalSunCacheBuildGeometry` | descriptive-other: Accepted flat physical configuration. | entity/value | none |
| 283 | method | `createTransportData` | `LocalSunCacheBuildGeometry` | call-this-method: Call this method to pack position-dependent local transport taps. | active-callable | params 1/1; returns tagged |
| 287 | type | `LocalSunCacheBuildSource` | `<module>` | descriptive-other: Local source contribution with privately owned shell facts. | entity/value | none |
| 290 | property | `configuration` | `LocalSunCacheBuildSource` | descriptive-other: Normalized physical source facts. | entity/value | none |
| 297 | method | `createResourceReport` | `LocalSunCacheBuildSource` | call-this-method: Call this method to report source facts, uploads, packed transport, and executor stor... | active-callable | params 2/2; returns tagged |
| 301 | type | `LocalSunCacheSourceDefinition` | `<module>` | descriptive-other: Construction owners retained by one local-Sun GPU cache source. | entity/value | none |
| 303 | property | `source` | `LocalSunCacheSourceDefinition` | descriptive-other: Physical source exposing its normalized configuration. | entity/value | none |
| 305 | property | `shellFactCache` | `LocalSunCacheSourceDefinition` | descriptive-other: Source-paired fixed shell facts. | entity/value | none |
| 309 | type | `LocalSunCachePlanResourceFacts` | `<module>` | descriptive-other: Source-owned logical payloads attached to a local build plan. | entity/value | none |
| 311 | property | `packedTransportData` | `LocalSunCachePlanResourceFacts` | descriptive-other: Reused N4 transport payload, or zero bytes for N1 and N2. | entity/value | none |
| 315 | type | `LocalSunCachePlan` | `<module>` | descriptive-other: Generic executable graph extended with local source resource facts. | entity/value | none |
| 318 | property | `resources` | `LocalSunCachePlan` | descriptive-other: Typed resource facts independent of module-binding reconstruction. | entity/value | none |
| 322 | type | `LocalSunCacheResourceReport` | `<module>` | descriptive-other: Actual local-Sun construction and completed-cache payloads. | entity/value | none |
| 324 | property | `sourceFacts` | `LocalSunCacheResourceReport` | descriptive-other: Retained binary64 source facts. | entity/value | none |
| 326 | property | `boundaryTexture` | `LocalSunCacheResourceReport` | descriptive-other: Primary-J1 boundary texture payload. | entity/value | none |
| 328 | property | `packedTransportData` | `LocalSunCacheResourceReport` | descriptive-other: Logical N4 packed-transport payload, or zero bytes for N1 and N2. | entity/value | none |
| 330 | property | `executor` | `LocalSunCacheResourceReport` | descriptive-other: Observed executor field and packed-data peaks and residency. | entity/value | none |
| 334 | type | `LocalSunCacheControllerPlanRequest` | `<module>` | descriptive-other: Physical owners and options for one controller-derived local-Sun GPU build graph. | entity/value | none |
| 336 | property | `atmosphere` | `LocalSunCacheControllerPlanRequest` | descriptive-other: Medium, phase, extinction, and transmittance contributor. | entity/value | none |
| 338 | property | `geometry` | `LocalSunCacheControllerPlanRequest` | descriptive-other: Flat positions, frames, bounds, directions, and transport-data contributor. | entity/value | none |
| 340 | property | `groundBoundary` | `LocalSunCacheControllerPlanRequest` | descriptive-other: Optional reflective boundary; omission selects canonical black ground. | entity/value | none |
| 342 | property | `maximumScatteringOrder` | `LocalSunCacheControllerPlanRequest` | descriptive-other: Requested N1, N2, or N4 graph maximum. | entity/value | none |
| 344 | property | `domainSelection` | `LocalSunCacheControllerPlanRequest` | descriptive-other: Optional non-production lattice for an internal diagnostic build. | entity/value | none |
| 348 | type | `LocalSunCacheControllerConfiguration` | `<module>` | descriptive-other: Construction collaborators for one local-Sun GPU cache controller. | entity/value | none |
| 350 | property | `source` | `LocalSunCacheControllerConfiguration` | descriptive-other: Configured local-Sun cache contributor. | entity/value | none |
| 352 | property | `backend` | `LocalSunCacheControllerConfiguration` | descriptive-other: Externally owned GPU backend. | entity/value | none |
| 354 | property | `scheduler` | `LocalSunCacheControllerConfiguration` | descriptive-other: Optional cache-build scheduler. | entity/value | none |
| 358 | type | `LocalSunCpuPureFieldDefinition` | `<module>` | descriptive-other: Identity, order, provenance, and domains for one local-Sun pure field. | entity/value | none |
| 360 | property | `id` | `LocalSunCpuPureFieldDefinition` | descriptive-other: Unique identifier for the field. | entity/value | none |
| 362 | property | `order` | `LocalSunCpuPureFieldDefinition` | descriptive-other: Pure scattering order. | entity/value | none |
| 364 | property | `provenanceIdentity` | `LocalSunCpuPureFieldDefinition` | descriptive-other: Optional algorithm provenance identity. | entity/value | none |
| 366 | property | `domainSelection` | `LocalSunCpuPureFieldDefinition` | descriptive-other: Coherent executable domains. | entity/value | none |
| 370 | type | `LocalSunCpuCumulativeFieldDefinition` | `<module>` | descriptive-other: Identity, through-order, provenance, and domains for one local-Sun cumulative field. | entity/value | none |
| 372 | property | `id` | `LocalSunCpuCumulativeFieldDefinition` | descriptive-other: Unique identifier for the field. | entity/value | none |
| 374 | property | `cumulativeThroughOrder` | `LocalSunCpuCumulativeFieldDefinition` | descriptive-other: Cumulative through-order. | entity/value | none |
| 376 | property | `provenanceIdentity` | `LocalSunCpuCumulativeFieldDefinition` | descriptive-other: Optional algorithm provenance identity. | entity/value | none |
| 378 | property | `domainSelection` | `LocalSunCpuCumulativeFieldDefinition` | descriptive-other: Coherent executable domains. | entity/value | none |
| 382 | type | `LocalSunPhysicalDirectionGeometry` | `<module>` | descriptive-other: Geometry contract for expressing local source-frame directions. | entity/value | none |
| 388 | method | `expressPhysicalScatteringCacheDirection` | `LocalSunPhysicalDirectionGeometry` | call-this-method: Call this method to express one local cache direction at its physical position. | active-callable | params 1/1; returns tagged |
| 392 | type | `LocalSunConstructionPositionLookupGeometry` | `<module>` | descriptive-other: Geometry contract for resolving local construction taps through executable z/rho axes. | entity/value | none |
| 398 | method | `resolveScatteringCacheConstructionPositionStencil` | `LocalSunConstructionPositionLookupGeometry` | call-this-method: Call this method to resolve one selected local construction-position stencil. | active-callable | params 1/1; returns tagged |
| 404 | type | `LocalSunCpuCacheGeometry` | `<module>` | descriptive-other: Configured flat-geometry capabilities required by local CPU construction. | entity/value | none |
| 411 | property | `configuration` | `LocalSunCpuCacheGeometry` | descriptive-other: Geometry-paired source position. | entity/value | none |
| 415 | type | `LocalSunScatteringDensityTransportGeometry` | `<module>` | descriptive-other: Geometry capabilities required by stored-field local-Sun transport. | entity/value | none |
| 420 | type | `LocalSunScatteringDensityTransportRequest` | `<module>` | descriptive-other: Field, physical collaborators, domains, and options for one stored-field local-Sun tr... | entity/value | none |
| 422 | property | `scatteringDensity` | `LocalSunScatteringDensityTransportRequest` | descriptive-other: Sealed pure J2 or J3 input field. | entity/value | none |
| 424 | property | `scatteringOrder` | `LocalSunScatteringDensityTransportRequest` | descriptive-other: Pure stored order being transported. | entity/value | none |
| 426 | property | `geometry` | `LocalSunScatteringDensityTransportRequest` | descriptive-other: Flat construction and source-frame geometry owner. | entity/value | none |
| 428 | property | `atmosphere` | `LocalSunScatteringDensityTransportRequest` | descriptive-other: Atmosphere medium-sampling owner. | entity/value | none |
| 430 | property | `calculator` | `LocalSunScatteringDensityTransportRequest` | descriptive-other: Path-quadrature and transmittance calculator. | entity/value | none |
| 432 | property | `domainSelection` | `LocalSunScatteringDensityTransportRequest` | descriptive-other: Executable local construction facts. | entity/value | none |
| 434 | property | `pathIntervalCount` | `LocalSunScatteringDensityTransportRequest` | descriptive-other: Accepted stored-field transport interval count. | entity/value | none |
| 436 | property | `id` | `LocalSunScatteringDensityTransportRequest` | descriptive-other: Optional allocated pure-radiance identity. | entity/value | none |
| 438 | property | `onProgress` | `LocalSunScatteringDensityTransportRequest` | descriptive-other: Optional observer of bounded construction progress. | entity/value | none |
| 448 | type | `LocalSunLaterOrderScatteringGeometryMethod` | `<module>` | descriptive-other: Geometry method names required by local-Sun later-order scattering. - **"resolveAtmos... | entity/value | union bullets 3/3 |
| 452 | type | `LocalSunLaterOrderScatteringGeometry` | `<module>` | descriptive-other: Local-geometry capabilities required by later-order scattering and reflection. | entity/value | none |
| 458 | type | `LocalSunLaterOrderScatteringKernelRequest` | `<module>` | descriptive-other: Physical collaborators and options for local-Sun later-order scattering. | entity/value | none |
| 460 | property | `geometry` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Flat scattering and optional ground-geometry owner. | entity/value | none |
| 462 | property | `atmosphere` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Medium, phase, and transmittance owner. | entity/value | none |
| 464 | property | `calculator` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Spectral scattering calculator. | entity/value | none |
| 466 | property | `domainSelection` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Executable position, direction, basis, and packing facts. | entity/value | none |
| 468 | property | `scatteringOrder` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Pure scattering-density order being constructed. | entity/value | none |
| 470 | property | `groundIlluminationRadiance` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Pure L(k-2) field for reflective higher-order ground, or null when unused. | entity/value | none |
| 472 | property | `groundBoundary` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Selected reflective boundary or canonical omission. | entity/value | none |
| 474 | property | `lightSource` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Direct source-lighting owner used only by reflective J2. | entity/value | none |
| 476 | property | `sourceTransmittanceIntervalCount` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Number of source-path transmittance intervals for ground reflection. | entity/value | none |
| 478 | property | `onProgress` | `LocalSunLaterOrderScatteringKernelRequest` | descriptive-other: Optional observer of bounded construction progress. | entity/value | none |
| 482 | type | `LocalSunCpuTransportedRadianceBuilder` | `<module>` | descriptive-other: Callable contract for building one pure transported-radiance field. | entity/value | none |
| 487 | callback | `<function-type>` | `LocalSunCpuTransportedRadianceBuilder` | called-by: Called by local sun cpu transported radiance builder to handle one invocation of the ... | called-by | params 1/1; returns tagged |
| 490 | type | `LocalSunCpuCacheOperations` | `<module>` | descriptive-other: Local pure-order recurrence operation contract. | entity/value | none |
| 496 | method | `createScatteringKernel` | `LocalSunCpuCacheOperations` | call-this-method: Call this method to create one physical pure-order scattering kernel. | active-callable | params 1/1; returns tagged |
| 498 | property | `buildTransportedRadiance` | `LocalSunCpuCacheOperations` | descriptive-other: Stored-field pure L2 or L3 builder. | entity/value | none |
| 500 | property | `scatteringProvenanceIdentity` | `LocalSunCpuCacheOperations` | descriptive-other: Later-order scattering provenance identity. | entity/value | none |
| 504 | type | `LocalSunCpuCacheBuildRequest` | `<module>` | descriptive-other: Physical collaborators, domains, options, and operations for one internal local-Sun C... | entity/value | none |
| 506 | property | `atmosphere` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Atmosphere medium, phase, and transmittance owner. | entity/value | none |
| 508 | property | `geometry` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Flat construction and cache-lookup geometry owner. | entity/value | none |
| 510 | property | `lightSource` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Construction-only shell-held primary-lighting owner. | entity/value | none |
| 512 | property | `profile` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Accepted physical and numerical profile. | entity/value | none |
| 514 | property | `spectralBasis` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Executable spectral basis. | entity/value | none |
| 516 | property | `sourceTransmittanceIntervalCount` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Number of source-path transmittance intervals. | entity/value | none |
| 518 | property | `transportIntervalCount` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Number of cache-transport integration intervals. | entity/value | none |
| 520 | property | `domainSelection` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Executable position, direction, basis, and packing facts. | entity/value | none |
| 522 | property | `calculator` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Spectral transport and scattering calculator. | entity/value | none |
| 524 | property | `groundBoundary` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Selected reflective boundary or canonical omission. | entity/value | none |
| 526 | property | `maximumScatteringOrder` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Requested N1, N2, or N4 construction maximum. | entity/value | none |
| 528 | property | `operations` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Optional recurrence-operation override for the internal diagnostic seam. | entity/value | none |
| 530 | property | `onProgress` | `LocalSunCpuCacheBuildRequest` | descriptive-other: Optional observer of bounded construction progress. | entity/value | none |
| 534 | type | `LocalSunCpuCacheFixtureRecurrenceRequest` | `<module>` | descriptive-other: Isolated recurrence choices accepted by the local-Sun CPU cache fixture. | entity/value | none |
| 536 | property | `maximumScatteringOrder` | `LocalSunCpuCacheFixtureRecurrenceRequest` | descriptive-other: Requested N1, N2, or N4 recurrence maximum. | entity/value | none |
| 538 | property | `primaryLightSource` | `LocalSunCpuCacheFixtureRecurrenceRequest` | descriptive-other: Optional primary-J1 source override. | entity/value | none |
| 540 | property | `profile` | `LocalSunCpuCacheFixtureRecurrenceRequest` | descriptive-other: Optional physical and numerical profile override. | entity/value | none |
| 542 | property | `groundBoundary` | `LocalSunCpuCacheFixtureRecurrenceRequest` | descriptive-other: Optional reflective boundary override. | entity/value | none |
| 546 | type | `LocalSunCpuCacheTestSource` | `<module>` | descriptive-other: Local-Sun facade surface retained by the CPU cache test fixture. | entity/value | none |
| 554 | method | `buildCpuScatteringCache` | `LocalSunCpuCacheTestSource` | call-this-method: Call this method to build one source-owned CPU scattering cache. | active-callable | params 1/1; returns tagged |
| 558 | type | `LocalSunCpuCacheTestProvider` | `<module>` | descriptive-other: Local-Sun provider seams retained by the CPU cache test fixture. | entity/value | none |
| 566 | method | `_buildCpuCache` | `LocalSunCpuCacheTestProvider` | called-by: Called by local sun cpu cache test provider to execute the bounded internal recurrence. | called-by | params 1/1; returns tagged |
| 574 | method | `_createLaterOrderScatteringKernel` | `LocalSunCpuCacheTestProvider` | called-by: Called by local sun cpu cache test provider to construct one later-order scattering k... | called-by | params 1/1; returns tagged |
| 582 | method | `_buildTransportedRadiance` | `LocalSunCpuCacheTestProvider` | called-by: Called by local sun cpu cache test provider to construct one stored-field radiance or... | called-by | params 1/1; returns tagged |
| 586 | type | `LocalSunCpuCacheTestFixture` | `<module>` | descriptive-other: Physical owners, executable domains, and probes retained by a local-Sun CPU cache fix... | entity/value | none |
| 588 | property | `atmosphere` | `LocalSunCpuCacheTestFixture` | descriptive-other: Canonical atmosphere used by the fixture. | entity/value | none |
| 590 | property | `geometry` | `LocalSunCpuCacheTestFixture` | descriptive-other: Flat construction and lookup geometry used by the fixture. | entity/value | none |
| 592 | property | `lightSource` | `LocalSunCpuCacheTestFixture` | descriptive-other: Continuous finite-source facade used by the fixture. | entity/value | none |
| 594 | property | `constructionLightSource` | `LocalSunCpuCacheTestFixture` | descriptive-other: Shell-held primary-J1 adapter used by the fixture. | entity/value | none |
| 596 | property | `cacheProvider` | `LocalSunCpuCacheTestFixture` | descriptive-other: Provider exposing the bounded internal recurrence seams. | entity/value | none |
| 598 | property | `sourceTransmittanceIntervalCount` | `LocalSunCpuCacheTestFixture` | descriptive-other: Source-path transmittance interval count used by the fixture. | entity/value | none |
| 600 | property | `domainSelection` | `LocalSunCpuCacheTestFixture` | descriptive-other: Executable local construction-domain selection. | entity/value | none |
| 602 | property | `probes` | `LocalSunCpuCacheTestFixture` | descriptive-other: Scattering-density coordinates sampled by the fixture. | entity/value | none |
| 604 | property | `radianceProbes` | `LocalSunCpuCacheTestFixture` | descriptive-other: Pure-radiance coordinates sampled by the fixture. | entity/value | none |
| 608 | type | `LocalSunCacheDisposalTestArtifact` | `<module>` | descriptive-other: Completed local-Sun cache artifact double with observable disposal state. | entity/value | none |
| 611 | property | `disposeCount` | `LocalSunCacheDisposalTestArtifact` | descriptive-other: Number of disposal requests completed by the artifact double. | entity/value | none |

## `src/algorithm32/light-sources/local-sun/cache/types/LocalSunCacheController.d.ts`

Source: [src/algorithm32/light-sources/local-sun/cache/types/LocalSunCacheController.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/cache/types/LocalSunCacheController.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LocalSunAcceptedCacheBuildRequest` | `<module>` | descriptive-other: Accepted controller request with normalized local-Sun GPU construction owners. | entity/value | none |
| 5 | property | `groundBoundary` | `LocalSunAcceptedCacheBuildRequest` | descriptive-other: Accepted reflective boundary or canonical black-ground omission. | entity/value | none |
| 7 | property | `geometry` | `LocalSunAcceptedCacheBuildRequest` | descriptive-other: Accepted flat-geometry cache contributor. | entity/value | none |
| 9 | property | `maximumScatteringOrder` | `LocalSunAcceptedCacheBuildRequest` | descriptive-other: Accepted N1, N2, or N4 graph maximum. | entity/value | none |
| 13 | type | `LocalSunCacheFieldDomains` | `<module>` | descriptive-other: Shared executable storage for scattering-density and radiance plan fields. | entity/value | none |
| 15 | property | `scattering` | `LocalSunCacheFieldDomains` | descriptive-other: Storage shared by pure and cumulative scattering-density fields. | entity/value | none |
| 17 | property | `radiance` | `LocalSunCacheFieldDomains` | descriptive-other: Storage shared by pure transported-radiance fields. | entity/value | none |
| 21 | type | `LocalSunCachePassOptions` | `<module>` | descriptive-other: Optional executable facts attached to one local-Sun cache-pass context. | entity/value | none |
| 23 | property | `pathIntervalCount` | `LocalSunCachePassOptions` | descriptive-other: Optional direct-radiance path interval count. | entity/value | none |
| 25 | property | `transportData` | `LocalSunCachePassOptions` | descriptive-other: Optional packed transport data for a stored-field transport pass. | entity/value | none |
| 27 | property | `groundReflection` | `LocalSunCachePassOptions` | descriptive-other: Optional ground-reflection illumination contract for a scatter pass. | entity/value | none |
| 31 | type | `LocalSunCachePassDefinition` | `<module>` | descriptive-other: Complete owner inputs for one local-Sun cache pass. | entity/value | none |
| 33 | property | `id` | `LocalSunCachePassDefinition` | descriptive-other: Stable pass identifier. | entity/value | none |
| 35 | property | `context` | `LocalSunCachePassDefinition` | descriptive-other: Physical and numerical context supplied to every pass contributor. | entity/value | none |
| 37 | property | `contributors` | `LocalSunCachePassDefinition` | descriptive-other: Concrete owners contributing cache-build modules. | entity/value | none |
| 39 | property | `includeGround` | `LocalSunCachePassDefinition` | descriptive-other: Whether the pass includes a ground-boundary contribution. | entity/value | none |
| 41 | property | `groundBoundary` | `LocalSunCachePassDefinition` | descriptive-other: Reflective boundary contributor or canonical black-ground omission. | entity/value | none |
| 45 | type | `LocalSunCacheTransportPassRequest` | `<module>` | descriptive-other: Owners and fields for one local-Sun stored-field transport pass. | entity/value | none |
| 47 | property | `id` | `LocalSunCacheTransportPassRequest` | descriptive-other: Stable pass identifier. | entity/value | none |
| 49 | property | `order` | `LocalSunCacheTransportPassRequest` | descriptive-other: Pure radiance order produced by the pass. | entity/value | none |
| 51 | property | `input` | `LocalSunCacheTransportPassRequest` | descriptive-other: Pure scattering-density input field. | entity/value | none |
| 53 | property | `output` | `LocalSunCacheTransportPassRequest` | descriptive-other: Pure transported-radiance output field. | entity/value | none |
| 55 | property | `options` | `LocalSunCacheTransportPassRequest` | descriptive-other: Accepted cache-construction options. | entity/value | none |
| 57 | property | `domains` | `LocalSunCacheTransportPassRequest` | descriptive-other: Selected local-Sun construction domains. | entity/value | none |
| 59 | property | `transportData` | `LocalSunCacheTransportPassRequest` | descriptive-other: Packed transport taps shared by both N4 transport passes. | entity/value | none |
| 61 | property | `geometry` | `LocalSunCacheTransportPassRequest` | descriptive-other: Flat-geometry cache-module contributor. | entity/value | none |
| 63 | property | `operations` | `LocalSunCacheTransportPassRequest` | descriptive-other: Generic accumulation and transport operation owner. | entity/value | none |
| 67 | type | `LocalSunCacheScatterPassRequest` | `<module>` | descriptive-other: Owners and fields for one local-Sun scatter-and-accumulate pass pair. | entity/value | none |
| 69 | property | `order` | `LocalSunCacheScatterPassRequest` | descriptive-other: Pure scattering-density order produced by the pair. | entity/value | none |
| 71 | property | `previousRadiance` | `LocalSunCacheScatterPassRequest` | descriptive-other: Previous pure transported-radiance field. | entity/value | none |
| 73 | property | `groundIllumination` | `LocalSunCacheScatterPassRequest` | descriptive-other: Earlier pure-radiance field used for ground illumination, when applicable. | entity/value | none |
| 75 | property | `output` | `LocalSunCacheScatterPassRequest` | descriptive-other: Pure scattering-density output field. | entity/value | none |
| 77 | property | `previousCumulative` | `LocalSunCacheScatterPassRequest` | descriptive-other: Previous cumulative scattering-density field. | entity/value | none |
| 79 | property | `cumulative` | `LocalSunCacheScatterPassRequest` | descriptive-other: New cumulative scattering-density field. | entity/value | none |
| 81 | property | `options` | `LocalSunCacheScatterPassRequest` | descriptive-other: Accepted cache-construction options. | entity/value | none |
| 83 | property | `domains` | `LocalSunCacheScatterPassRequest` | descriptive-other: Selected local-Sun construction domains. | entity/value | none |
| 85 | property | `geometry` | `LocalSunCacheScatterPassRequest` | descriptive-other: Flat-geometry cache-module contributor. | entity/value | none |
| 87 | property | `atmosphere` | `LocalSunCacheScatterPassRequest` | descriptive-other: Atmosphere cache-module contributor. | entity/value | none |
| 89 | property | `source` | `LocalSunCacheScatterPassRequest` | descriptive-other: Local-Sun cache-module contributor. | entity/value | none |
| 91 | property | `operations` | `LocalSunCacheScatterPassRequest` | descriptive-other: Generic accumulation and transport operation owner. | entity/value | none |
| 93 | property | `groundBoundary` | `LocalSunCacheScatterPassRequest` | descriptive-other: Reflective boundary contributor or canonical black-ground omission. | entity/value | none |
| 97 | class | `LocalSunCacheController` | `<module>` | descriptive-other: Controller for local-Sun GPU cache construction within one runtime attachment. | entity/value | none |
| 103 | constructor | `<anonymous@103:2>` | `LocalSunCacheController` | creates: Creates one controller without taking ownership of its GPU backend. | creates | params 1/1 |
| 106 | field | `active` | `LocalSunCacheController` | descriptive-other: Atomically published active cache. | entity/value | none |
| 114 | method | `createBuildPlan` | `LocalSunCacheController` | call-this-method: Call this method to derive one source-owned cache build plan without executing it. | active-callable | params 1/1; returns tagged |
| 122 | method | `createScatteringCache` | `LocalSunCacheController` | call-this-method: Call this method to construct or reuse one complete cumulative scattering cache. | active-callable | params 1/1; returns tagged |
| 125 | method | `dispose` | `LocalSunCacheController` | call-this-method: Call this method to cancel staging and release the active cache without owning the ba... | active-callable | none |

## `src/algorithm32/light-sources/local-sun/cache/types/LocalSunCacheProvider.d.ts`

Source: [src/algorithm32/light-sources/local-sun/cache/types/LocalSunCacheProvider.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/cache/types/LocalSunCacheProvider.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 8 | type | `LocalSunPrimaryScatteringDensityGeometryMethod` | `<module>` | descriptive-other: Geometry method names required by local-Sun primary scattering density. - **"resolveA... | entity/value | union bullets 3/3 |
| 12 | type | `LocalSunPrimaryScatteringDensityGeometry` | `<module>` | descriptive-other: Flat-geometry capabilities required by local-Sun primary J1 construction. | entity/value | none |
| 16 | type | `LocalSunPrimaryScatteringDensityBuildRequest` | `<module>` | descriptive-other: Physical collaborators and options for local-Sun primary J1 construction. | entity/value | none |
| 18 | property | `atmosphere` | `LocalSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Atmosphere medium and transmittance owner. | entity/value | none |
| 20 | property | `geometry` | `LocalSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Flat source-relative geometry owner. | entity/value | none |
| 22 | property | `lightSource` | `LocalSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Construction-only shell-held direct-lighting owner. | entity/value | none |
| 24 | property | `spectralBasis` | `LocalSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Executable spectral basis. | entity/value | none |
| 26 | property | `sourceTransmittanceIntervalCount` | `LocalSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Number of source-path transmittance intervals. | entity/value | none |
| 28 | property | `domainSelection` | `LocalSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Executable position, direction, basis, and packing facts. | entity/value | none |
| 30 | property | `id` | `LocalSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Optional allocated pure-J1 identity. | entity/value | none |
| 32 | property | `provenanceIdentity` | `LocalSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Optional primary-J1 provenance identity. | entity/value | none |
| 34 | property | `onProgress` | `LocalSunPrimaryScatteringDensityBuildRequest` | descriptive-other: Optional observer of bounded construction progress. | entity/value | none |
| 38 | type | `LocalSunPrimaryRadianceGeometry` | `<module>` | descriptive-other: Flat-geometry capabilities required by continuous direct-primary L1. | entity/value | none |
| 45 | method | `resolveCacheBuildRay` | `LocalSunPrimaryRadianceGeometry` | call-this-method: Call this method to resolve one construction ray from an executable cache coordinate. | active-callable | params 1/1; returns tagged |
| 49 | type | `LocalSunPrimaryRadianceCalculator` | `<module>` | descriptive-other: Calculator operations required by continuous direct-primary L1. | entity/value | none |
| 52 | type | `LocalSunPrimaryRadianceBuildRequest` | `<module>` | descriptive-other: Geometry, calculator, domains, and options for local-Sun direct-primary L1 construction. | entity/value | none |
| 54 | property | `geometry` | `LocalSunPrimaryRadianceBuildRequest` | descriptive-other: Flat construction-ray and direction-mapping owner. | entity/value | none |
| 56 | property | `calculator` | `LocalSunPrimaryRadianceBuildRequest` | descriptive-other: Continuous direct-radiance path-integration owner. | entity/value | none |
| 58 | property | `domainSelection` | `LocalSunPrimaryRadianceBuildRequest` | descriptive-other: Executable position, incoming-direction, basis, and packing facts. | entity/value | none |
| 60 | property | `pathIntervalCount` | `LocalSunPrimaryRadianceBuildRequest` | descriptive-other: Accepted construction path interval count. | entity/value | none |
| 62 | property | `id` | `LocalSunPrimaryRadianceBuildRequest` | descriptive-other: Optional allocated pure-L1 identity. | entity/value | none |
| 64 | property | `provenanceIdentity` | `LocalSunPrimaryRadianceBuildRequest` | descriptive-other: Optional direct-primary provenance identity. | entity/value | none |
| 66 | property | `onProgress` | `LocalSunPrimaryRadianceBuildRequest` | descriptive-other: Optional observer of bounded construction progress. | entity/value | none |
| 70 | type | `LocalSunReflectiveGroundScatteringKernelRequest` | `<module>` | descriptive-other: Local-Sun later-order request with an explicit reflective ground boundary. | entity/value | none |
| 72 | property | `groundBoundary` | `LocalSunReflectiveGroundScatteringKernelRequest` | descriptive-other: Ground boundary value. | entity/value | none |
| 76 | type | `LocalSunCpuRecurrenceContext` | `<module>` | descriptive-other: Owners captured by local-Sun recurrence callbacks. | entity/value | none |
| 78 | property | `request` | `LocalSunCpuRecurrenceContext` | descriptive-other: Accepted public CPU request. | entity/value | none |
| 80 | property | `calculator` | `LocalSunCpuRecurrenceContext` | descriptive-other: Spectral transport and scattering operations. | entity/value | none |
| 82 | property | `domainSelection` | `LocalSunCpuRecurrenceContext` | descriptive-other: Executable position, direction, basis, and packing facts. | entity/value | none |
| 84 | property | `sourceTransmittanceIntervalCount` | `LocalSunCpuRecurrenceContext` | descriptive-other: Source-path transmittance interval count. | entity/value | none |
| 86 | property | `transportIntervalCount` | `LocalSunCpuRecurrenceContext` | descriptive-other: Cache-transport integration interval count. | entity/value | none |

## `src/algorithm32/light-sources/local-sun/cache/types/LocalSunConstructionDomainSelection.d.ts`

Source: [src/algorithm32/light-sources/local-sun/cache/types/LocalSunConstructionDomainSelection.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/cache/types/LocalSunConstructionDomainSelection.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | class | `LocalSunConstructionDomainSelection` | `<module>` | descriptive-other: Coherent executable z-by-rho, paired-Fibonacci-34, and cubed-sphere selection for loc... | entity/value | none |
| 11 | constructor | `<anonymous@11:2>` | `LocalSunConstructionDomainSelection` | creates: Creates one source-owned construction-domain selection. | creates | params 1/1 |
| 14 | field | `kind` | `LocalSunConstructionDomainSelection` | descriptive-other: Construction-domain contract kind. | entity/value | none |
| 16 | field | `id` | `LocalSunConstructionDomainSelection` | descriptive-other: Unique identifier for the construction-domain selection. | entity/value | none |
| 18 | field | `positionDomain` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable position domain. | entity/value | none |
| 20 | field | `positionNodes` | `LocalSunConstructionDomainSelection` | descriptive-other: Z-major, rho-fast flattened position nodes. | entity/value | none |
| 22 | field | `zNodes` | `LocalSunConstructionDomainSelection` | descriptive-other: Ordered altitude nodes. | entity/value | none |
| 24 | field | `rhoNodes` | `LocalSunConstructionDomainSelection` | descriptive-other: Ordered radial nodes. | entity/value | none |
| 26 | field | `zCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of altitude nodes. | entity/value | none |
| 28 | field | `rhoCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of radial nodes. | entity/value | none |
| 30 | field | `positionCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of flattened position nodes. | entity/value | none |
| 32 | field | `spectralBasis` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable spectral basis. | entity/value | none |
| 34 | field | `spectralChannelCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of executable spectral channels. | entity/value | none |
| 36 | field | `incomingDirectionDomain` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable incoming-direction domain. | entity/value | none |
| 38 | field | `incomingUnitVectors` | `LocalSunConstructionDomainSelection` | descriptive-other: Paired-Fibonacci-34 incoming unit vectors. | entity/value | none |
| 40 | field | `incomingIntegrationWeights` | `LocalSunConstructionDomainSelection` | descriptive-other: Paired-Fibonacci-34 solid-angle weights. | entity/value | none |
| 42 | field | `incomingDirectionCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of executable incoming directions. | entity/value | none |
| 44 | field | `outgoingDirectionDomain` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable outgoing-direction domain. | entity/value | none |
| 46 | field | `outgoingUnitVectors` | `LocalSunConstructionDomainSelection` | descriptive-other: Cubed-sphere outgoing unit vectors. | entity/value | none |
| 48 | field | `outgoingDirectionCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of executable outgoing directions. | entity/value | none |
| 50 | field | `outgoingPositiveFaceCenterIndices` | `LocalSunConstructionDomainSelection` | descriptive-other: Positive-axis cubed-sphere face-center addresses. | entity/value | none |
| 52 | field | `radiancePacking` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable incoming-radiance packing. | entity/value | none |
| 54 | field | `scatteringDensityPacking` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable outgoing scattering-density packing. | entity/value | none |
| 63 | method | `resolveOutgoingDirectionStencil` | `LocalSunConstructionDomainSelection` | call-this-method: Call this method to resolve one source-local outgoing direction through the selected ... | active-callable | params 1/1; returns tagged |
| 73 | method | `fromGeometry` | `LocalSunConstructionDomainSelection` | call-this-method: Call this method to derive the selected production domain from active flat geometry a... | active-callable | params 2/2; returns tagged |

## `src/algorithm32/light-sources/local-sun/cache/types/LocalSunConstructionLightSource.d.ts`

Source: [src/algorithm32/light-sources/local-sun/cache/types/LocalSunConstructionLightSource.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/cache/types/LocalSunConstructionLightSource.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LocalSunContinuousDirectLightingMetadata` | `<module>` | descriptive-other: Continuous direct-light metadata consumed by J1 construction. | entity/value | none |
| 4 | property | `distanceFromSource` | `LocalSunContinuousDirectLightingMetadata` | descriptive-other: Normalized physical source distance. | entity/value | none |
| 6 | property | `incidentScale` | `LocalSunContinuousDirectLightingMetadata` | descriptive-other: Continuous incident scale. | entity/value | none |

## `src/algorithm32/light-sources/local-sun/cache/types/LocalSunCpuFields.d.ts`

Source: [src/algorithm32/light-sources/local-sun/cache/types/LocalSunCpuFields.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/cache/types/LocalSunCpuFields.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LocalSunCpuFieldBuildDefinition` | `<module>` | descriptive-other: Normalized metadata for one local-Sun field allocation. | entity/value | none |
| 4 | property | `id` | `LocalSunCpuFieldBuildDefinition` | descriptive-other: Unique identifier for the allocated field. | entity/value | none |
| 6 | property | `packing` | `LocalSunCpuFieldBuildDefinition` | descriptive-other: Executable local field packing. | entity/value | none |
| 8 | property | `order` | `LocalSunCpuFieldBuildDefinition` | descriptive-other: Pure or cumulative field order. | entity/value | none |
| 10 | property | `provenanceIdentity` | `LocalSunCpuFieldBuildDefinition` | descriptive-other: Optional field-algorithm provenance identity. | entity/value | none |
| 12 | property | `domainSelection` | `LocalSunCpuFieldBuildDefinition` | descriptive-other: Coherent executable domains. | entity/value | none |
| 16 | class | `LocalSunCpuFields` | `<module>` | descriptive-other: Binary64 field-family allocator for a local-Sun cache. | entity/value | none |
| 23 | method | `createPureRadiance` | `LocalSunCpuFields` | call-this-method: Call this method to create one mutable pure incoming-radiance field. | active-callable | params 1/1; returns tagged |
| 31 | method | `createPureScatteringDensity` | `LocalSunCpuFields` | call-this-method: Call this method to create one mutable pure outgoing scattering-density field. | active-callable | params 1/1; returns tagged |
| 39 | method | `createCumulativeScatteringDensity` | `LocalSunCpuFields` | call-this-method: Call this method to create one mutable cumulative outgoing scattering-density field. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/local-sun/cache/types/LocalSunShellFactCache.d.ts`

Source: [src/algorithm32/light-sources/local-sun/cache/types/LocalSunShellFactCache.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/cache/types/LocalSunShellFactCache.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LocalSunShellExecutableSourceFacts` | `<module>` | descriptive-other: Executable normalized source facts used to derive shell values. | entity/value | none |
| 4 | property | `position` | `LocalSunShellExecutableSourceFacts` | descriptive-other: Physical source position. | entity/value | none |
| 6 | property | `referenceDistance` | `LocalSunShellExecutableSourceFacts` | descriptive-other: Inverse-square reference distance. | entity/value | none |
| 8 | property | `referenceSpectralIncidentScale` | `LocalSunShellExecutableSourceFacts` | descriptive-other: Neutral spectral scale at the reference distance. | entity/value | none |
| 10 | property | `radius` | `LocalSunShellExecutableSourceFacts` | descriptive-other: Finite source radius. | entity/value | none |
| 12 | property | `distanceFalloff` | `LocalSunShellExecutableSourceFacts` | descriptive-other: Inverse-square falloff state. | entity/value | none |
| 16 | type | `LocalSunShellExecutableDomain` | `<module>` | descriptive-other: Executable whole-flat-world source-distance domain facts. | entity/value | none |
| 18 | property | `minimumDistance` | `LocalSunShellExecutableDomain` | descriptive-other: Minimum represented source distance. | entity/value | none |
| 20 | property | `maximumDistance` | `LocalSunShellExecutableDomain` | descriptive-other: Maximum represented source distance. | entity/value | none |
| 22 | property | `horizontalOffset` | `LocalSunShellExecutableDomain` | descriptive-other: Source horizontal offset. | entity/value | none |
| 24 | property | `sourceHeight` | `LocalSunShellExecutableDomain` | descriptive-other: Source height. | entity/value | none |
| 26 | property | `mapRadius` | `LocalSunShellExecutableDomain` | descriptive-other: Flat-world map radius. | entity/value | none |
| 28 | property | `atmosphereApex` | `LocalSunShellExecutableDomain` | descriptive-other: Atmosphere apex. | entity/value | none |

## `src/algorithm32/light-sources/local-sun/three/types.d.ts`

Source: [src/algorithm32/light-sources/local-sun/three/types.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/three/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LocalSunSceneLightingSource` | `<module>` | descriptive-other: Physical local-Sun facade contract used by endpoint scene lighting. | entity/value | none |
| 10 | method | `resolveSceneLightScales` | `LocalSunSceneLightingSource` | call-this-method: Call this method to resolve source-owned neutral scene-light scales. | active-callable | params 1/1; returns tagged |
| 14 | type | `LocalSunSceneLightingAdapterDefinition` | `<module>` | descriptive-other: Constructor values for a local-Sun endpoint scene-lighting adapter. | entity/value | none |
| 16 | property | `source` | `LocalSunSceneLightingAdapterDefinition` | descriptive-other: Physical source facade used for dynamically dispatched lighting samples. | entity/value | none |
| 18 | property | `configuration` | `LocalSunSceneLightingAdapterDefinition` | descriptive-other: Normalized source configuration retained by reference. | entity/value | none |

## `src/algorithm32/light-sources/local-sun/three/types/LocalSunSceneLightingAdapter.d.ts`

Source: [src/algorithm32/light-sources/local-sun/three/types/LocalSunSceneLightingAdapter.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/three/types/LocalSunSceneLightingAdapter.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LocalSunPointLightRequest` | `<module>` | descriptive-other: Point-light construction facts owned by the local-Sun scene adapter. | entity/value | none |
| 4 | property | `THREE` | `LocalSunPointLightRequest` | descriptive-other: Three lighting constructors. | entity/value | none |
| 6 | property | `sourceKey` | `LocalSunPointLightRequest` | descriptive-other: Configured source identity. | entity/value | none |
| 8 | property | `intensity` | `LocalSunPointLightRequest` | descriptive-other: Renderer light intensity. | entity/value | none |
| 10 | property | `sourcePosition` | `LocalSunPointLightRequest` | descriptive-other: Source position in scene coordinates. | entity/value | none |
| 12 | property | `observerIncidentScale` | `LocalSunPointLightRequest` | descriptive-other: Physical incident scale at the observer. | entity/value | none |
| 14 | property | `endpointSceneIncidentScale` | `LocalSunPointLightRequest` | descriptive-other: Selected endpoint scene incident scale. | entity/value | none |
| 16 | property | `calibrationScalar` | `LocalSunPointLightRequest` | descriptive-other: Scene-light calibration scalar. | entity/value | none |
| 18 | property | `endpointSceneLightScalePolicy` | `LocalSunPointLightRequest` | descriptive-other: Selected endpoint scene-light scaling policy. | entity/value | none |
| 22 | type | `LocalSunShadowDirectionalLightRequest` | `<module>` | descriptive-other: Directional shadow-light construction facts owned by the local-Sun scene adapter. | entity/value | none |
| 24 | property | `THREE` | `LocalSunShadowDirectionalLightRequest` | descriptive-other: Three lighting constructors. | entity/value | none |
| 26 | property | `sourceKey` | `LocalSunShadowDirectionalLightRequest` | descriptive-other: Configured source identity. | entity/value | none |
| 28 | property | `intensity` | `LocalSunShadowDirectionalLightRequest` | descriptive-other: Renderer light intensity. | entity/value | none |
| 30 | property | `sourcePosition` | `LocalSunShadowDirectionalLightRequest` | descriptive-other: Source position in scene coordinates. | entity/value | none |
| 32 | property | `shadowObject` | `LocalSunShadowDirectionalLightRequest` | descriptive-other: Normalized shadow-object facts. | entity/value | none |
| 34 | property | `objectIndex` | `LocalSunShadowDirectionalLightRequest` | descriptive-other: Ordered shadow-object index. | entity/value | none |
| 36 | property | `sceneObjects` | `LocalSunShadowDirectionalLightRequest` | descriptive-other: Mutable scene-object collection receiving the directional target. | entity/value | none |
| 40 | type | `LocalSunOppositeDirectionalFillLightRequest` | `<module>` | descriptive-other: Opposite-direction endpoint-fill construction facts. | entity/value | none |
| 42 | property | `THREE` | `LocalSunOppositeDirectionalFillLightRequest` | descriptive-other: Three lighting constructors. | entity/value | none |
| 44 | property | `sourceKey` | `LocalSunOppositeDirectionalFillLightRequest` | descriptive-other: Configured source identity. | entity/value | none |
| 46 | property | `intensity` | `LocalSunOppositeDirectionalFillLightRequest` | descriptive-other: Renderer fill intensity. | entity/value | none |
| 48 | property | `directionToSource` | `LocalSunOppositeDirectionalFillLightRequest` | descriptive-other: Unit direction from the observer toward the source. | entity/value | none |
| 50 | property | `focus` | `LocalSunOppositeDirectionalFillLightRequest` | descriptive-other: Fill focus in scene coordinates. | entity/value | none |
| 52 | property | `distance` | `LocalSunOppositeDirectionalFillLightRequest` | descriptive-other: Directional-light placement distance. | entity/value | none |
| 54 | property | `sceneObjects` | `LocalSunOppositeDirectionalFillLightRequest` | descriptive-other: Mutable scene-object collection receiving the directional target. | entity/value | none |
| 58 | type | `LocalSunSourceDirectionFalloffFillLightRequest` | `<module>` | descriptive-other: Source-direction falloff-fill construction facts. | entity/value | none |
| 60 | property | `THREE` | `LocalSunSourceDirectionFalloffFillLightRequest` | descriptive-other: Three lighting constructors. | entity/value | none |
| 62 | property | `sourceKey` | `LocalSunSourceDirectionFalloffFillLightRequest` | descriptive-other: Configured source identity. | entity/value | none |
| 64 | property | `targetIntensity` | `LocalSunSourceDirectionFalloffFillLightRequest` | descriptive-other: Desired point-light intensity at the focus. | entity/value | none |
| 66 | property | `directionToSource` | `LocalSunSourceDirectionFalloffFillLightRequest` | descriptive-other: Unit direction from the observer toward the source. | entity/value | none |
| 68 | property | `focus` | `LocalSunSourceDirectionFalloffFillLightRequest` | descriptive-other: Fill focus in scene coordinates. | entity/value | none |
| 70 | property | `distance` | `LocalSunSourceDirectionFalloffFillLightRequest` | descriptive-other: Point-light placement distance. | entity/value | none |
| 72 | property | `sceneObjects` | `LocalSunSourceDirectionFalloffFillLightRequest` | descriptive-other: Mutable scene-object collection receiving the fill anchor. | entity/value | none |
| 76 | type | `LocalSunEndpointLightingFacts` | `<module>` | descriptive-other: Normalized local-Sun endpoint lighting facts. | entity/value | none |
| 78 | property | `directLighting` | `LocalSunEndpointLightingFacts` | descriptive-other: Physical direct-lighting sample. | entity/value | none |
| 80 | property | `metadata` | `LocalSunEndpointLightingFacts` | descriptive-other: Source-owned sample metadata. | entity/value | none |
| 82 | property | `observerIncidentScale` | `LocalSunEndpointLightingFacts` | descriptive-other: Incident scaling at the observer. | entity/value | none |
| 84 | property | `calibrationScalar` | `LocalSunEndpointLightingFacts` | descriptive-other: Accepted scene-light calibration scalar. | entity/value | none |
| 86 | property | `ambientIntensityRange` | `LocalSunEndpointLightingFacts` | descriptive-other: Accepted ambient intensity bounds. | entity/value | none |
| 88 | property | `min` | `LocalSunEndpointLightingFacts` | descriptive-other: Minimum ambient intensity. | entity/value | none |
| 90 | property | `max` | `LocalSunEndpointLightingFacts` | descriptive-other: Maximum ambient intensity. | entity/value | none |
| 93 | property | `ambientLightScale` | `LocalSunEndpointLightingFacts` | descriptive-other: Unit-bearing ambient light scale. | entity/value | none |
| 95 | property | `endpointSceneLightScalePolicy` | `LocalSunEndpointLightingFacts` | descriptive-other: Endpoint scene-light scaling policy. | entity/value | none |
| 97 | property | `endpointSceneIncidentScale` | `LocalSunEndpointLightingFacts` | descriptive-other: Resulting endpoint incident scale. | entity/value | none |
| 99 | property | `ambientIntensity` | `LocalSunEndpointLightingFacts` | descriptive-other: Resolved ambient intensity. | entity/value | none |
| 103 | type | `LocalSunShadowObjectNormalizationRequest` | `<module>` | descriptive-other: Shadow-object request with its resolved caller-visible identity. | entity/value | none |
| 106 | property | `objectKey` | `LocalSunShadowObjectNormalizationRequest` | descriptive-other: Resolved shadow-object identity. | entity/value | none |
| 110 | type | `LocalSunNormalizedShadowObject` | `<module>` | descriptive-other: Normalized request for one local-Sun shadow object. | entity/value | none |
| 112 | property | `focus` | `LocalSunNormalizedShadowObject` | descriptive-other: Shadow focus in scene coordinates. | entity/value | none |
| 114 | property | `extent` | `LocalSunNormalizedShadowObject` | descriptive-other: Orthographic shadow extent. | entity/value | none |
| 116 | property | `lightDistance` | `LocalSunNormalizedShadowObject` | descriptive-other: Directional-light placement distance. | entity/value | none |
| 118 | property | `cameraLeft` | `LocalSunNormalizedShadowObject` | descriptive-other: Orthographic camera left plane. | entity/value | none |
| 120 | property | `cameraRight` | `LocalSunNormalizedShadowObject` | descriptive-other: Orthographic camera right plane. | entity/value | none |
| 122 | property | `cameraTop` | `LocalSunNormalizedShadowObject` | descriptive-other: Orthographic camera top plane. | entity/value | none |
| 124 | property | `cameraBottom` | `LocalSunNormalizedShadowObject` | descriptive-other: Orthographic camera bottom plane. | entity/value | none |
| 126 | property | `cameraNear` | `LocalSunNormalizedShadowObject` | descriptive-other: Shadow camera near plane. | entity/value | none |
| 128 | property | `cameraFar` | `LocalSunNormalizedShadowObject` | descriptive-other: Shadow camera far plane. | entity/value | none |
| 130 | property | `mapSize` | `LocalSunNormalizedShadowObject` | descriptive-other: Shadow-map pixel dimensions. | entity/value | none |
| 132 | property | `bias` | `LocalSunNormalizedShadowObject` | descriptive-other: Renderer shadow depth bias. | entity/value | none |
| 134 | property | `normalBias` | `LocalSunNormalizedShadowObject` | descriptive-other: Unit-bearing renderer shadow normal bias. | entity/value | none |
| 136 | property | `radius` | `LocalSunNormalizedShadowObject` | descriptive-other: Unit-bearing renderer shadow blur radius. | entity/value | none |
| 138 | property | `shadowIntensity` | `LocalSunNormalizedShadowObject` | descriptive-other: Renderer shadow opacity. | entity/value | none |
| 140 | property | `objectKey` | `LocalSunNormalizedShadowObject` | descriptive-other: Caller-visible shadow-object identity. | entity/value | none |
| 142 | property | `layerIndex` | `LocalSunNormalizedShadowObject` | descriptive-other: Optional renderer layer index. | entity/value | none |
| 146 | type | `LocalSunNormalizedShadowRequest` | `<module>` | descriptive-other: Normalized canonical local-Sun shadow request. | entity/value | none |
| 148 | property | `enabled` | `LocalSunNormalizedShadowRequest` | descriptive-other: Whether source-owned shadow lights are enabled. | entity/value | none |
| 150 | property | `objects` | `LocalSunNormalizedShadowRequest` | descriptive-other: Ordered normalized shadow objects. | entity/value | none |
| 154 | type | `LocalSunNormalizedEndpointIndirectFill` | `<module>` | descriptive-other: Normalized enabled endpoint indirect-fill request. | entity/value | none |
| 156 | property | `enabled` | `LocalSunNormalizedEndpointIndirectFill` | descriptive-other: Enabled fill selection. | entity/value | none |
| 158 | property | `policy` | `LocalSunNormalizedEndpointIndirectFill` | descriptive-other: Selected indirect-fill policy. | entity/value | none |
| 160 | property | `intensityRatio` | `LocalSunNormalizedEndpointIndirectFill` | descriptive-other: Fill intensity relative to the source-driven endpoint light. | entity/value | none |
| 162 | property | `distance` | `LocalSunNormalizedEndpointIndirectFill` | descriptive-other: Fill placement distance in scene units. | entity/value | none |
| 166 | type | `LocalSunAmbientLightRequest` | `<module>` | descriptive-other: Ambient-light construction request with an optional pre-resolved intensity. | entity/value | none |
| 169 | property | `resolvedAmbientIntensity` | `LocalSunAmbientLightRequest` | descriptive-other: Optional pre-resolved ambient intensity. | entity/value | none |
| 173 | type | `LocalThreeLight` | `<module>` | descriptive-other: Common Three light surface used by local-source lighting. | entity/value | none |
| 175 | property | `name` | `LocalThreeLight` | descriptive-other: Renderer light name. | entity/value | none |
| 177 | property | `intensity` | `LocalThreeLight` | descriptive-other: Renderer light intensity. | entity/value | none |
| 179 | property | `position` | `LocalThreeLight` | descriptive-other: Mutable renderer position interface. | entity/value | none |
| 186 | method | `set` | `LocalThreeLight` | call-this-method: Call this method to assign renderer position coordinates. | active-callable | params 1/1 |
| 189 | property | `userData` | `LocalThreeLight` | descriptive-other: Renderer-neutral Algorithm32 metadata. | entity/value | none |
| 191 | property | `castShadow` | `LocalThreeLight` | descriptive-other: Whether the light casts renderer shadows. | entity/value | none |
| 195 | type | `LocalThreeObject` | `<module>` | descriptive-other: Three object surface used by local-source lighting. | entity/value | none |
| 197 | property | `name` | `LocalThreeObject` | descriptive-other: Renderer object name. | entity/value | none |
| 199 | property | `position` | `LocalThreeObject` | descriptive-other: Mutable renderer position interface. | entity/value | none |
| 206 | method | `set` | `LocalThreeObject` | call-this-method: Call this method to assign renderer position coordinates. | active-callable | params 1/1 |
| 209 | property | `userData` | `LocalThreeObject` | descriptive-other: Renderer-neutral Algorithm32 metadata. | entity/value | none |
| 213 | type | `LocalThreeDirectionalLight` | `<module>` | descriptive-other: Three directional-light surface used by a local source. | entity/value | none |
| 215 | property | `target` | `LocalThreeDirectionalLight` | descriptive-other: Directional-light target. | entity/value | none |
| 217 | property | `shadow` | `LocalThreeDirectionalLight` | descriptive-other: Optional renderer shadow configuration. | entity/value | none |
| 219 | property | `mapSize` | `LocalThreeDirectionalLight` | descriptive-other: Optional shadow-map dimensions. | entity/value | none |
| 221 | property | `width` | `LocalThreeDirectionalLight` | descriptive-other: Shadow-map width. | entity/value | none |
| 223 | property | `height` | `LocalThreeDirectionalLight` | descriptive-other: Shadow-map height. | entity/value | none |
| 226 | property | `camera` | `LocalThreeDirectionalLight` | descriptive-other: Optional directional shadow-camera state. | entity/value | none |
| 228 | property | `left` | `LocalThreeDirectionalLight` | descriptive-other: Camera left plane. | entity/value | none |
| 230 | property | `right` | `LocalThreeDirectionalLight` | descriptive-other: Camera right plane. | entity/value | none |
| 232 | property | `top` | `LocalThreeDirectionalLight` | descriptive-other: Camera top plane. | entity/value | none |
| 234 | property | `bottom` | `LocalThreeDirectionalLight` | descriptive-other: Camera bottom plane. | entity/value | none |
| 236 | property | `near` | `LocalThreeDirectionalLight` | descriptive-other: Camera near plane. | entity/value | none |
| 238 | property | `far` | `LocalThreeDirectionalLight` | descriptive-other: Camera far plane. | entity/value | none |
| 244 | method | `updateProjectionMatrix` | `LocalThreeDirectionalLight` | call-this-method: Call this method to rebuild renderer projection state after camera changes. | active-callable | none |
| 247 | property | `bias` | `LocalThreeDirectionalLight` | descriptive-other: Renderer shadow bias. | entity/value | none |
| 249 | property | `normalBias` | `LocalThreeDirectionalLight` | descriptive-other: Renderer shadow normal bias. | entity/value | none |
| 251 | property | `radius` | `LocalThreeDirectionalLight` | descriptive-other: Renderer shadow blur radius. | entity/value | none |
| 253 | property | `intensity` | `LocalThreeDirectionalLight` | descriptive-other: Renderer shadow intensity. | entity/value | none |
| 258 | type | `LocalThreeNamespace` | `<module>` | descriptive-other: Three constructors used by local-source lighting. | entity/value | none |
| 260 | property | `Object3D` | `LocalThreeNamespace` | descriptive-other: Renderer object constructor. | entity/value | none |
| 262 | property | `AmbientLight` | `LocalThreeNamespace` | descriptive-other: Renderer ambient-light constructor. | entity/value | none |
| 264 | property | `PointLight` | `LocalThreeNamespace` | descriptive-other: Renderer point-light constructor. | entity/value | none |
| 266 | property | `DirectionalLight` | `LocalThreeNamespace` | descriptive-other: Renderer directional-light constructor. | entity/value | none |

## `src/algorithm32/light-sources/local-sun/types.d.ts`

Source: [src/algorithm32/light-sources/local-sun/types.d.ts](../../../../../../src/algorithm32/light-sources/local-sun/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LocalSunLightSourceConfig` | `<module>` | descriptive-other: Finite local-Sun source configuration. | entity/value | none |
| 4 | property | `sourceKey` | `LocalSunLightSourceConfig` | descriptive-other: Source-owned identity used for cache compatibility. | entity/value | none |
| 7 | property | `position` | `LocalSunLightSourceConfig` | descriptive-other: Canonical physical position of the finite source. | entity/value | none |
| 10 | property | `sourceIrradiance` | `LocalSunLightSourceConfig` | descriptive-other: Source spectral irradiance with its basis and units. | entity/value | none |
| 13 | property | `referenceDistance` | `LocalSunLightSourceConfig` | descriptive-other: Reference distance for incident-scale calibration. | entity/value | none |
| 16 | property | `referenceSpectralIncidentScale` | `LocalSunLightSourceConfig` | descriptive-other: Neutral spectral incident scale at the reference distance. | entity/value | none |
| 19 | property | `radius` | `LocalSunLightSourceConfig` | descriptive-other: Physical source radius. | entity/value | none |
| 22 | property | `distanceFalloff` | `LocalSunLightSourceConfig` | descriptive-other: Optional inverse-square distance-falloff selection. | entity/value | none |
| 28 | property | `sourceTransmittanceIntervalCount` | `LocalSunLightSourceConfig` | descriptive-other: Optional source-path optical-depth integration interval count. Omission selects the p... | entity/value | none |
| 37 | type | `LocalSunLightSourceConfigurationExcludedProperty` | `<module>` | descriptive-other: Optional input properties replaced by normalized local-Sun configuration values. - **... | entity/value | union bullets 2/2 |
| 40 | type | `LocalSunLightSourceConfiguration` | `<module>` | descriptive-other: Normalized finite local-Sun configuration snapshot. | entity/value | none |
| 46 | property | `distanceFalloff` | `LocalSunLightSourceConfiguration` | descriptive-other: Accepted inverse-square falloff selection. | entity/value | none |
| 48 | property | `sourceTransmittanceIntervalCount` | `LocalSunLightSourceConfiguration` | descriptive-other: Accepted source-path integration interval count. | entity/value | none |
| 52 | type | `LocalSunPhysicalSampleRequest` | `<module>` | descriptive-other: Source-relative physical sample facts accepted by the local Sun. | entity/value | none |
| 54 | property | `sourceRelativePosition` | `LocalSunPhysicalSampleRequest` | descriptive-other: Optional geometry-resolved source-relative position. | entity/value | none |
| 58 | type | `LocalSunThreeShadowConfigurationRequest` | `<module>` | descriptive-other: Shadow-configuration overrides accepted by the local-Sun public facade. | entity/value | none |
| 60 | property | `castShadow` | `LocalSunThreeShadowConfigurationRequest` | descriptive-other: Optional cast-shadow selection. | entity/value | none |
| 62 | property | `receiveShadow` | `LocalSunThreeShadowConfigurationRequest` | descriptive-other: Optional receive-shadow selection. | entity/value | none |
| 64 | property | `includeDescendants` | `LocalSunThreeShadowConfigurationRequest` | descriptive-other: Optional descendant-traversal selection. | entity/value | none |
| 66 | property | `shadowPolicy` | `LocalSunThreeShadowConfigurationRequest` | descriptive-other: Optional source shadow-policy override. | entity/value | none |
| 68 | property | `sourceKey` | `LocalSunThreeShadowConfigurationRequest` | descriptive-other: Optional source identity override. | entity/value | none |
| 70 | property | `layerIndex` | `LocalSunThreeShadowConfigurationRequest` | descriptive-other: Optional renderer layer index. | entity/value | none |
| 74 | type | `LocalSunCpuCacheRequest` | `<module>` | descriptive-other: Physical collaborators supplied to the public local-Sun CPU build. | entity/value | none |
| 76 | property | `atmosphere` | `LocalSunCpuCacheRequest` | descriptive-other: Atmosphere medium, phase, and transmittance owner. | entity/value | none |
| 78 | property | `geometry` | `LocalSunCpuCacheRequest` | descriptive-other: Paired flat geometry owner. | entity/value | none |
| 80 | property | `profile` | `LocalSunCpuCacheRequest` | descriptive-other: Optional native production profile override for a scoped build. | entity/value | none |
| 82 | property | `groundBoundary` | `LocalSunCpuCacheRequest` | descriptive-other: Selected reflective boundary or canonical omission. | entity/value | none |
| 84 | property | `maximumScatteringOrder` | `LocalSunCpuCacheRequest` | descriptive-other: Requested N1, N2, or N4 construction order. | entity/value | none |
| 86 | property | `sourceTransmittanceIntervalCount` | `LocalSunCpuCacheRequest` | descriptive-other: Optional source-path interval override for a scoped CPU diagnostic build. | entity/value | none |
| 88 | property | `transportIntervalCount` | `LocalSunCpuCacheRequest` | descriptive-other: Optional cache-transport interval override for a scoped CPU diagnostic build. | entity/value | none |
| 92 | type | `LocalSunCpuCacheResult` | `<module>` | descriptive-other: Completed local-Sun binary64 cache build. | entity/value | none |
| 94 | property | `maximumScatteringOrder` | `LocalSunCpuCacheResult` | descriptive-other: Requested and completed maximum scattering order. | entity/value | none |
| 96 | property | `pureScatteringDensityByOrder` | `LocalSunCpuCacheResult` | descriptive-other: Sealed pure J fields in ascending order. | entity/value | none |
| 98 | property | `pureRadianceByOrder` | `LocalSunCpuCacheResult` | descriptive-other: Sealed pure L fields in ascending order. | entity/value | none |
| 100 | property | `cumulativeScatteringDensity` | `LocalSunCpuCacheResult` | descriptive-other: Sealed cumulative J-through-N field. | entity/value | none |
| 102 | property | `options` | `LocalSunCpuCacheResult` | descriptive-other: Cache-construction options that completed. | entity/value | none |

## `src/algorithm32/light-sources/shared/cache/types.d.ts`

Source: [src/algorithm32/light-sources/shared/cache/types.d.ts](../../../../../../src/algorithm32/light-sources/shared/cache/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `CacheReuseIdentity` | `<module>` | descriptive-other: Type that identifies one executable cache plan for exact reuse comparison. | entity/value | none |
| 4 | property | `id` | `CacheReuseIdentity` | descriptive-other: Value that identifies this value. | entity/value | none |
| 6 | property | `contentHash` | `CacheReuseIdentity` | descriptive-other: Value that identifies the normalized content. | entity/value | none |
| 10 | type | `SupportedCacheScatteringOrder` | `<module>` | descriptive-other: Type that identifies supported first-release cumulative cache maxima. | entity/value | none |
| 13 | type | `CacheConstructionOptions` | `<module>` | descriptive-other: Type that stores direct options for a selected cache-construction graph. | entity/value | none |
| 15 | property | `transportIntervalCount` | `CacheConstructionOptions` | descriptive-other: Value that stores the transport integration interval count. | entity/value | none |
| 17 | property | `maximumScatteringOrder` | `CacheConstructionOptions` | descriptive-other: Value that stores the requested maximum scattering order. | entity/value | none |
| 21 | type | `SpectralFieldOrder` | `<module>` | descriptive-other: Type that identifies whether a field contains one pure order or a cumulative sum. | entity/value | none |
| 24 | property | `kind` | `SpectralFieldOrder` | descriptive-other: Value that identifies a pure scattering order. | entity/value | none |
| 26 | property | `value` | `SpectralFieldOrder` | descriptive-other: Value that stores the pure scattering-order number. | entity/value | none |
| 30 | property | `kind` | `SpectralFieldOrder` | descriptive-other: Value that identifies the contract kind. | entity/value | none |
| 32 | property | `value` | `SpectralFieldOrder` | descriptive-other: Value that stores the scalar value. | entity/value | none |
| 34 | property | `included` | `SpectralFieldOrder` | descriptive-other: Value that stores the included pure scattering orders. | entity/value | none |
| 38 | type | `SpectralFieldOrderDefinition` | `<module>` | descriptive-other: Type that supplies a field order before executable field construction. | entity/value | none |
| 41 | property | `kind` | `SpectralFieldOrderDefinition` | descriptive-other: Value that identifies a pure scattering order. | entity/value | none |
| 43 | property | `value` | `SpectralFieldOrderDefinition` | descriptive-other: Value that stores the pure scattering-order number. | entity/value | none |
| 47 | property | `kind` | `SpectralFieldOrderDefinition` | descriptive-other: Value that identifies the contract kind. | entity/value | none |
| 49 | property | `value` | `SpectralFieldOrderDefinition` | descriptive-other: Value that stores the scalar value. | entity/value | none |
| 51 | property | `included` | `SpectralFieldOrderDefinition` | descriptive-other: Value that stores the included pure scattering orders. | entity/value | none |
| 55 | type | `DirectionalSpectralFieldCoordinates` | `<module>` | descriptive-other: Address one scalar in a directional spectral field. | entity/value | none |
| 57 | property | `directionIndex` | `DirectionalSpectralFieldCoordinates` | descriptive-other: Value that stores the direction-domain index. | entity/value | none |
| 59 | property | `positionIndex` | `DirectionalSpectralFieldCoordinates` | descriptive-other: Value that stores the position-domain index. | entity/value | none |
| 61 | property | `wavelengthIndex` | `DirectionalSpectralFieldCoordinates` | descriptive-other: Value that stores the wavelength-basis index. | entity/value | none |
| 65 | interface | `DirectionalSpectralFieldPacking` | `<module>` | descriptive-other: Contract that describes the minimum source-owned executable packing used by CPU storage. | entity/value | none |
| 67 | property | `id` | `DirectionalSpectralFieldPacking` | descriptive-other: Value that identifies the executable packing owner. | entity/value | none |
| 70 | property | `scalarCount` | `DirectionalSpectralFieldPacking` | descriptive-other: Value that stores the executable number of addressable scalars. | entity/value | none |
| 78 | method | `offset` | `DirectionalSpectralFieldPacking` | call-this-method: Call this method to resolve the packed scalar offset for field coordinates. | active-callable | params 1/1; returns tagged |
| 86 | method | `coordinatesAt` | `DirectionalSpectralFieldPacking` | call-this-method: Call this method to resolve field coordinates at a packed scalar offset. | active-callable | params 1/1; returns tagged |
| 90 | type | `CpuDirectionalSpectralFieldDefinition` | `<module>` | descriptive-other: Type that configures one private binary64 CPU directional field. | entity/value | none |
| 92 | property | `id` | `CpuDirectionalSpectralFieldDefinition` | descriptive-other: Value that identifies the field. | entity/value | none |
| 94 | property | `provenanceIdentity` | `CpuDirectionalSpectralFieldDefinition` | descriptive-other: Value that identifies the physical provenance of stored values. | entity/value | none |
| 96 | property | `order` | `CpuDirectionalSpectralFieldDefinition` | descriptive-other: Value that identifies the pure or cumulative scattering order. | entity/value | none |
| 98 | property | `packing` | `CpuDirectionalSpectralFieldDefinition` | descriptive-other: Value that stores the source-owned executable packing. | entity/value | none |
| 102 | type | `CpuDirectionalSpectralFieldReader` | `<module>` | descriptive-other: Type that reads sealed CPU field values without exposing resident storage. | entity/value | none |
| 104 | property | `id` | `CpuDirectionalSpectralFieldReader` | descriptive-other: Value that identifies the field. | entity/value | none |
| 106 | property | `provenanceIdentity` | `CpuDirectionalSpectralFieldReader` | descriptive-other: Value that identifies the physical provenance of stored values. | entity/value | none |
| 108 | property | `order` | `CpuDirectionalSpectralFieldReader` | descriptive-other: Value that identifies the pure or cumulative scattering order. | entity/value | none |
| 110 | property | `scalarCount` | `CpuDirectionalSpectralFieldReader` | descriptive-other: Value that stores the number of resident scalar values. | entity/value | none |
| 117 | method | `readScalar` | `CpuDirectionalSpectralFieldReader` | call-this-method: Call this method to read one scalar at physical field coordinates. | active-callable | params 1/1; returns tagged |
| 124 | method | `readScalarAtOffset` | `CpuDirectionalSpectralFieldReader` | call-this-method: Call this method to read one scalar at a packed offset. | active-callable | params 1/1; returns tagged |
| 128 | type | `CpuDirectionalSpectralFieldWriter` | `<module>` | descriptive-other: Mutable capability for an unpublished CPU field without exposed resident storage. | entity/value | none |
| 130 | property | `id` | `CpuDirectionalSpectralFieldWriter` | descriptive-other: Field identifier. | entity/value | none |
| 132 | property | `provenanceIdentity` | `CpuDirectionalSpectralFieldWriter` | descriptive-other: Physical provenance identity of the stored values. | entity/value | none |
| 134 | property | `order` | `CpuDirectionalSpectralFieldWriter` | descriptive-other: Pure or cumulative scattering order represented by the field. | entity/value | none |
| 136 | property | `scalarCount` | `CpuDirectionalSpectralFieldWriter` | descriptive-other: Number of resident scalar values. | entity/value | none |
| 144 | method | `writeScalar` | `CpuDirectionalSpectralFieldWriter` | call-this-method: Call this method to write one scalar at physical field coordinates. | active-callable | params 2/2 |
| 152 | method | `writeScalarAtOffset` | `CpuDirectionalSpectralFieldWriter` | call-this-method: Call this method to write one scalar at a packed offset. | active-callable | params 2/2 |
| 159 | method | `fill` | `CpuDirectionalSpectralFieldWriter` | call-this-method: Call this method to fill every scalar with one value. | active-callable | params 1/1 |
| 163 | interface | `CpuDirectionalSpectralFieldContract` | `<module>` | descriptive-other: Lifecycle contract for one private binary64 CPU field. | entity/value | none |
| 165 | property | `id` | `CpuDirectionalSpectralFieldContract` | descriptive-other: Field identifier. | entity/value | none |
| 167 | property | `provenanceIdentity` | `CpuDirectionalSpectralFieldContract` | descriptive-other: Physical provenance identity of the stored values. | entity/value | none |
| 169 | property | `order` | `CpuDirectionalSpectralFieldContract` | descriptive-other: Pure or cumulative scattering order represented by the field. | entity/value | none |
| 171 | property | `scalarCount` | `CpuDirectionalSpectralFieldContract` | descriptive-other: Number of resident scalar values. | entity/value | none |
| 173 | property | `isSealed` | `CpuDirectionalSpectralFieldContract` | descriptive-other: Whether the field is sealed against subsequent writes. | entity/value | none |
| 179 | method | `createWriter` | `CpuDirectionalSpectralFieldContract` | call-this-method: Call this method to create the unpublished field writer. | active-callable | returns tagged |
| 185 | method | `seal` | `CpuDirectionalSpectralFieldContract` | call-this-method: Call this method to seal the field against further writes. | active-callable | returns tagged |
| 191 | method | `createReader` | `CpuDirectionalSpectralFieldContract` | call-this-method: Call this method to create a reader for the sealed field. | active-callable | returns tagged |
| 195 | type | `ScatteringOrderKernelInvocation` | `<module>` | descriptive-other: Input and output capabilities for one synchronous scattering-order kernel invocation. | entity/value | none |
| 197 | property | `previousRadiance` | `ScatteringOrderKernelInvocation` | descriptive-other: Sealed reader for the preceding pure radiance field. | entity/value | none |
| 199 | property | `outputScattering` | `ScatteringOrderKernelInvocation` | descriptive-other: Mutable writer for the pure scattering output field. | entity/value | none |
| 203 | type | `CpuDirectionalSpectralFieldWriterRevoker` | `<module>` | descriptive-other: Operation that ends the writable lifetime of a directional spectral field writer. | entity/value | none |
| 204 | callback | `<function-type>` | `CpuDirectionalSpectralFieldWriterRevoker` | called-by: Called by a revocable writer owner to end the writer's writable lifetime. | called-by | none |
| 207 | type | `RevocableCpuDirectionalSpectralFieldWriter` | `<module>` | descriptive-other: Writer capability paired with the operation that ends its writable lifetime. | entity/value | none |
| 209 | property | `writer` | `RevocableCpuDirectionalSpectralFieldWriter` | descriptive-other: Writer capability available until revocation. | entity/value | none |
| 211 | property | `revoke` | `RevocableCpuDirectionalSpectralFieldWriter` | descriptive-other: Operation that rejects every subsequent write through the capability. | entity/value | none |
| 218 | interface | `ScatteringOrderKernel` | `<module>` | descriptive-other: Synchronous physical scattering calculation whose output begins at zero and whose int... | entity/value | none |
| 226 | method | `buildPureScatteringOrder` | `ScatteringOrderKernel` | call-this-method: Call this method to build one pure scattering order from the preceding pure radiance. | active-callable | params 1/1 |
| 230 | type | `CpuTransportedRadianceBuildRequest` | `<module>` | descriptive-other: Shared request for one source-owned pure transported-radiance build. | entity/value | none |
| 232 | property | `scatteringDensity` | `CpuTransportedRadianceBuildRequest` | descriptive-other: Sealed pure J2 or J3 input field. | entity/value | none |
| 234 | property | `scatteringOrder` | `CpuTransportedRadianceBuildRequest` | descriptive-other: Pure J2 or J3 order transported into radiance. | entity/value | none |
| 236 | property | `id` | `CpuTransportedRadianceBuildRequest` | descriptive-other: Source-owned pure-radiance output identity. | entity/value | none |
| 240 | type | `CpuScatteringKernelBuildRequest` | `<module>` | descriptive-other: Shared request for one source-owned pure scattering-kernel build. | entity/value | none |
| 242 | property | `scatteringOrder` | `CpuScatteringKernelBuildRequest` | descriptive-other: Pure J2, J3, or J4 order being constructed. | entity/value | none |
| 244 | property | `groundIlluminationRadiance` | `CpuScatteringKernelBuildRequest` | descriptive-other: Pure L(k-2) field for reflective higher-order ground, or null when unused. | entity/value | none |
| 248 | type | `NextScatteringOrderBuildRequest` | `<module>` | descriptive-other: Request for one pure-radiance to pure-scattering field build. | entity/value | none |
| 250 | property | `previousRadiance` | `NextScatteringOrderBuildRequest` | descriptive-other: Preceding pure radiance field. | entity/value | none |
| 252 | property | `outputScattering` | `NextScatteringOrderBuildRequest` | descriptive-other: Pure scattering output field. | entity/value | none |
| 254 | property | `kernel` | `NextScatteringOrderBuildRequest` | descriptive-other: Synchronous scattering kernel. | entity/value | none |
| 258 | type | `PureScatteringFieldAccumulationRequest` | `<module>` | descriptive-other: Request containing contiguous pure scattering fields and their cumulative target. | entity/value | none |
| 260 | property | `pureFields` | `PureScatteringFieldAccumulationRequest` | descriptive-other: Contiguous pure scattering fields. | entity/value | none |
| 262 | property | `cumulativeField` | `PureScatteringFieldAccumulationRequest` | descriptive-other: Cumulative output field. | entity/value | none |
| 264 | property | `packing` | `PureScatteringFieldAccumulationRequest` | descriptive-other: Source-owned executable shared scattering-field packing. | entity/value | none |
| 268 | type | `ScatteringCachePositionStencilRequest` | `<module>` | descriptive-other: Type that describes geometry's physical cache-position stencil request. | entity/value | none |
| 270 | property | `position` | `ScatteringCachePositionStencilRequest` | descriptive-other: Value that stores the physical sample position. | entity/value | none |
| 272 | property | `atmosphereCoordinate` | `ScatteringCachePositionStencilRequest` | descriptive-other: Value that stores geometry's atmosphere coordinate for the physical sample position. | entity/value | none |
| 276 | type | `ScatteringCachePositionStencil` | `<module>` | descriptive-other: Type that describes a weighted position-domain stencil. | entity/value | none |
| 278 | property | `indices` | `ScatteringCachePositionStencil` | descriptive-other: Value that stores the resolved position-domain indices. | entity/value | none |
| 280 | property | `weights` | `ScatteringCachePositionStencil` | descriptive-other: Value that stores the interpolation weights. | entity/value | none |
| 284 | type | `ScatteringCacheDirectionRequest` | `<module>` | descriptive-other: Type that describes geometry's source-frame direction request. | entity/value | none |
| 286 | property | `position` | `ScatteringCacheDirectionRequest` | descriptive-other: Value that stores the physical sample position. | entity/value | none |
| 288 | property | `physicalOutgoingDirection` | `ScatteringCacheDirectionRequest` | descriptive-other: Value that stores the physical outgoing direction. | entity/value | none |
| 292 | type | `ScatteringCacheFramedDirectionRequest` | `<module>` | descriptive-other: Type that describes geometry's inverse source-frame direction request. | entity/value | none |
| 294 | property | `position` | `ScatteringCacheFramedDirectionRequest` | descriptive-other: Value that stores the physical sample position for position-varying source frames. Sp... | entity/value | none |
| 296 | property | `cacheDirection` | `ScatteringCacheFramedDirectionRequest` | descriptive-other: Value that stores the source-local cache direction. | entity/value | none |
| 300 | type | `ScatteringCacheDirectionStencil` | `<module>` | descriptive-other: Type that describes a weighted direction-domain stencil. | entity/value | none |
| 302 | property | `indices` | `ScatteringCacheDirectionStencil` | descriptive-other: Value that stores the resolved direction-domain indices. | entity/value | none |
| 304 | property | `weights` | `ScatteringCacheDirectionStencil` | descriptive-other: Value that stores the interpolation weights. | entity/value | none |
| 308 | type | `ScatteringCacheSampleRequest` | `<module>` | descriptive-other: Type that describes one resolved cumulative-cache sample request. | entity/value | none |
| 310 | property | `positionStencil` | `ScatteringCacheSampleRequest` | descriptive-other: Value that stores the geometry-resolved position stencil. | entity/value | none |
| 312 | property | `directionStencil` | `ScatteringCacheSampleRequest` | descriptive-other: Value that stores the direction-domain stencil. | entity/value | none |
| 316 | type | `ScatteringCacheBuildRequest` | `<module>` | descriptive-other: Type that describes public physical inputs for a source-owned scattering-cache build. | entity/value | none |
| 318 | property | `atmosphere` | `ScatteringCacheBuildRequest` | descriptive-other: Value that supplies the configured atmosphere and its GPU construction contribution. | entity/value | none |
| 320 | property | `geometry` | `ScatteringCacheBuildRequest` | descriptive-other: Value that supplies the configured geometry and its GPU construction contribution. | entity/value | none |
| 322 | property | `groundBoundary` | `ScatteringCacheBuildRequest` | descriptive-other: Value that supplies an optional reflecting boundary and its construction contribution. | entity/value | none |
| 324 | property | `spectralBasis` | `ScatteringCacheBuildRequest` | descriptive-other: Value that supplies the accepted spectral basis. | entity/value | none |
| 326 | property | `maximumScatteringOrder` | `ScatteringCacheBuildRequest` | descriptive-other: Value that selects N1, N2, or default N4 construction. | entity/value | none |
| 328 | property | `signal` | `ScatteringCacheBuildRequest` | descriptive-other: Cancel this construction request. | entity/value | none |
| 332 | type | `CacheBuildCoordinate` | `<module>` | descriptive-other: Type that describes one geometry-resolved coordinate used during cache construction. | entity/value | none |
| 334 | property | `coordinateKey` | `CacheBuildCoordinate` | descriptive-other: Value that stores the stable cache-local coordinate key. | entity/value | none |
| 337 | property | `coordinates` | `CacheBuildCoordinate` | descriptive-other: Value that stores numeric lookup coordinates in cache-owned order. | entity/value | none |
| 340 | property | `altitudeBinIndex` | `CacheBuildCoordinate` | descriptive-other: Value that stores an optional altitude bin index. | entity/value | none |
| 343 | property | `directionIndex` | `CacheBuildCoordinate` | descriptive-other: Value that stores an optional incoming-direction index. | entity/value | none |
| 346 | property | `zBinIndex` | `CacheBuildCoordinate` | descriptive-other: Value that stores an optional source-relative vertical bin index. | entity/value | none |
| 349 | property | `rhoBinIndex` | `CacheBuildCoordinate` | descriptive-other: Value that stores an optional source-relative radial bin index. | entity/value | none |
| 352 | property | `altitude` | `CacheBuildCoordinate` | descriptive-other: Value that stores optional physical altitude for cache construction. | entity/value | none |
| 355 | property | `rho` | `CacheBuildCoordinate` | descriptive-other: Value that stores optional physical source-relative radial distance. | entity/value | none |
| 358 | property | `incomingDirection` | `CacheBuildCoordinate` | descriptive-other: Value that stores the incoming direction represented by the coordinate. | entity/value | none |
| 361 | property | `metadata` | `CacheBuildCoordinate` | descriptive-other: Value that stores owner-specific coordinate metadata. | entity/value | none |
| 365 | interface | `ScatteringCache` | `<module>` | descriptive-other: Contract that provides the common Algorithm32-facing contract for one source-owned, o... | entity/value | none |
| 371 | method | `dispose` | `ScatteringCache` | call-this-method: Call this method to release the resources owned by this cache. Repeated disposal is s... | active-callable | none |
| 375 | interface | `CpuScatteringCache` | `<module>` | descriptive-other: Contract that provides synchronous resolved sampling for a resident CPU oracle cache. | entity/value | none |
| 377 | property | `sampleProvenanceIdentity` | `CpuScatteringCache` | descriptive-other: Value that identifies the physical provenance of returned spectral samples. | entity/value | none |
| 385 | method | `sampleResolved` | `CpuScatteringCache` | call-this-method: Call this method to sample the cache from geometry-resolved physical position and dir... | active-callable | params 1/1; returns tagged |
| 389 | interface | `GpuScatteringCache` | `<module>` | descriptive-other: Contract that provides final-view shader assembly and opaque bindings for a GPU-resid... | entity/value | none |
| 396 | method | `createShaderContribution` | `GpuScatteringCache` | call-this-method: Call this method to contribute source-specific final-view lookup code and bindings. | active-callable | params 1/1; returns tagged |
| 402 | method | `getRuntimeBindings` | `GpuScatteringCache` | call-this-method: Call this method to return opaque runtime bindings for the privately owned cumulative... | active-callable | returns tagged |
| 406 | type | `CacheControllerRequest` | `<module>` | descriptive-other: Type that supplies one renderer attachment's cache-construction capability. | entity/value | none |
| 408 | property | `backend` | `CacheControllerRequest` | descriptive-other: Value that supplies the renderer-owned cache backend. | entity/value | none |
| 410 | property | `scheduler` | `CacheControllerRequest` | descriptive-other: Optional callback that yields construction at executor-declared safe boundaries. | entity/value | none |
| 414 | interface | `CacheController` | `<module>` | descriptive-other: Contract that owns source-specific cache staging and publication for one runtime cons... | entity/value | none |
| 416 | property | `active` | `CacheController` | descriptive-other: Value that stores the complete cache currently published to this consumer. | entity/value | none |
| 423 | method | `createScatteringCache` | `CacheController` | call-this-method: Call this method to construct, reuse, and publish one complete source-owned cache. | active-callable | params 1/1; returns tagged |
| 426 | method | `dispose` | `CacheController` | call-this-method: Call this method to cancel staging and release the active cache. | active-callable | none |

## `src/algorithm32/light-sources/shared/three/types.d.ts`

Source: [src/algorithm32/light-sources/shared/three/types.d.ts](../../../../../../src/algorithm32/light-sources/shared/three/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LightSourceSceneLightScalesRequest` | `<module>` | descriptive-other: Type that configures source-owned neutral scene-light scale resolution. | entity/value | none |
| 4 | property | `sourceRelativePosition` | `LightSourceSceneLightScalesRequest` | descriptive-other: Value that provides source-relative facts for local finite-source light scaling. | entity/value | none |
| 7 | property | `directionToSource` | `LightSourceSceneLightScalesRequest` | descriptive-other: Value that provides the source direction in scene space. | entity/value | none |
| 10 | property | `observerUp` | `LightSourceSceneLightScalesRequest` | descriptive-other: Value that stores local scene up direction at the observer. | entity/value | none |
| 13 | property | `twilightStartSourceUpDot` | `LightSourceSceneLightScalesRequest` | descriptive-other: Value that stores the source-up dot-product value where twilight ambient begins. | entity/value | none |
| 16 | property | `fullAmbientSourceUpDot` | `LightSourceSceneLightScalesRequest` | descriptive-other: Value that stores the source-up dot-product value where ambient reaches full daylight. | entity/value | none |
| 20 | type | `LightSourceSceneLightScales` | `<module>` | descriptive-other: Type that describes source-owned neutral scene-light scales. | entity/value | none |
| 22 | property | `directLightScale` | `LightSourceSceneLightScales` | descriptive-other: Value that stores the neutral direct source-light scale. | entity/value | none |
| 25 | property | `ambientLightScale` | `LightSourceSceneLightScales` | descriptive-other: Value that stores the neutral ambient/fill scene-light scale. | entity/value | none |
| 28 | property | `localLightScale` | `LightSourceSceneLightScales` | descriptive-other: Value that stores the preferred aggregate neutral local-light scale. | entity/value | none |
| 31 | property | `sourceUpDot` | `LightSourceSceneLightScales` | descriptive-other: Value that stores the source direction dot local up direction. | entity/value | none |
| 34 | property | `policy` | `LightSourceSceneLightScales` | descriptive-other: Value that stores owner-specific policy metadata. | entity/value | none |
| 43 | type | `LocalSunEndpointSceneLightScalePolicy` | `<module>` | descriptive-other: Local endpoint scene-light scaling policy. - **"endpoint-material-shading"** - Transp... | entity/value | union bullets 2/2 |
| 52 | type | `LocalSunEndpointIndirectFillPolicy` | `<module>` | descriptive-other: Local endpoint indirect-fill approximation policy. - **"general-ambient-fill"** - Add... | entity/value | union bullets 3/3 |
| 56 | type | `LightSourceThreeLightingRequest` | `<module>` | descriptive-other: Type that configures source-owned Three endpoint lighting object creation. | entity/value | none |
| 58 | property | `THREE` | `LightSourceThreeLightingRequest` | descriptive-other: Value that provides the caller's Three namespace with lighting constructors. | entity/value | none |
| 61 | property | `scene` | `LightSourceThreeLightingRequest` | descriptive-other: Optional callback that provides the Three scene to receive created lighting objects. | entity/value | none |
| 64 | property | `sourceRelativePosition` | `LightSourceThreeLightingRequest` | descriptive-other: Value that provides source-relative facts for local finite-source lighting. | entity/value | none |
| 67 | property | `sourcePosition` | `LightSourceThreeLightingRequest` | descriptive-other: Value that provides the finite source scene-space position for local sources. | entity/value | none |
| 70 | property | `observerPosition` | `LightSourceThreeLightingRequest` | descriptive-other: Value that provides the observer scene-space position used for local source direction. | entity/value | none |
| 73 | property | `focus` | `LightSourceThreeLightingRequest` | descriptive-other: Value that provides the focus/target scene-space point for distant directional lights. | entity/value | none |
| 76 | property | `directionToSource` | `LightSourceThreeLightingRequest` | descriptive-other: Value that provides the source direction in scene space. | entity/value | none |
| 81 | property | `lightDistance` | `LightSourceThreeLightingRequest` | descriptive-other: Override distant directional light placement distance in scene units. | entity/value | none |
| 86 | property | `intensity` | `LightSourceThreeLightingRequest` | descriptive-other: Override distant source Three light intensity. | entity/value | none |
| 89 | property | `calibrationScalar` | `LightSourceThreeLightingRequest` | descriptive-other: Value that stores local source endpoint light calibration scalar. | entity/value | none |
| 92 | property | `ambientIntensity` | `LightSourceThreeLightingRequest` | descriptive-other: Value that stores ambient fill intensity. | entity/value | none |
| 95 | property | `ambientIntensityRange` | `LightSourceThreeLightingRequest` | descriptive-other: Value that stores source-scaled ambient fill intensity bounds. | entity/value | none |
| 98 | property | `endpointIndirectFill` | `LightSourceThreeLightingRequest` | descriptive-other: Value that configures optional endpoint indirect fill for local sources. | entity/value | none |
| 101 | property | `endpointColorStatus` | `LightSourceThreeLightingRequest` | descriptive-other: Value that stores diagnostic endpoint color/shading status. | entity/value | none |
| 106 | property | `endpointSceneLightScalePolicy` | `LightSourceThreeLightingRequest` | descriptive-other: Optional scaling policy for local endpoint scene lights. | entity/value | none |
| 109 | property | `shadow` | `LightSourceThreeLightingRequest` | descriptive-other: Value that configures optional Three shadow-map support. | entity/value | none |
| 113 | type | `LightSourceThreeLightingObjects` | `<module>` | descriptive-other: Type that returns source-owned Three lighting objects. | entity/value | none |
| 115 | property | `lights` | `LightSourceThreeLightingObjects` | descriptive-other: Value that stores Three lights the app should add to the scene/composer render. | entity/value | none |
| 118 | property | `sceneObjects` | `LightSourceThreeLightingObjects` | descriptive-other: Value that stores required non-light scene objects such as directional-light targets. | entity/value | none |
| 121 | property | `metadata` | `LightSourceThreeLightingObjects` | descriptive-other: Value that stores owner-specific placement, intensity, shadow, and scale metadata. | entity/value | none |
| 125 | type | `LightSourceSceneAmbientIntensityRange` | `<module>` | descriptive-other: Type that configures source-scaled ambient intensity bounds. | entity/value | none |
| 127 | property | `min` | `LightSourceSceneAmbientIntensityRange` | descriptive-other: Value that stores the minimum ambient intensity. | entity/value | none |
| 130 | property | `max` | `LightSourceSceneAmbientIntensityRange` | descriptive-other: Value that stores the maximum ambient intensity. | entity/value | none |
| 134 | type | `LightSourceSceneAmbientIntensityBounds` | `<module>` | descriptive-other: Accepted lower and upper bounds for source-scaled ambient intensity. | entity/value | none |
| 136 | property | `min` | `LightSourceSceneAmbientIntensityBounds` | descriptive-other: Minimum ambient-light intensity. | entity/value | none |
| 138 | property | `max` | `LightSourceSceneAmbientIntensityBounds` | descriptive-other: Maximum ambient-light intensity. | entity/value | none |
| 142 | type | `LightSourceThreeShadowRequest` | `<module>` | descriptive-other: Type that configures optional source-owned Three shadow helpers. | entity/value | none |
| 146 | property | `enabled` | `LightSourceThreeShadowRequest` | descriptive-other: Enable or disable shadow object creation/configuration. | entity/value | none |
| 149 | property | `objects` | `LightSourceThreeShadowRequest` | descriptive-other: Value that stores keyed shadow objects. Each object request creates one source-owned ... | entity/value | none |
| 153 | type | `LightSourceThreeShadowObjectRequest` | `<module>` | descriptive-other: Type that configures one source-owned Three shadow object. | entity/value | none |
| 155 | property | `objectKey` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores optional object key metadata. | entity/value | none |
| 158 | property | `layerIndex` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores optional Three layer index used to scope a source-owned shadow came... | entity/value | none |
| 161 | property | `focus` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores the shadow focus/target scene-space point. | entity/value | none |
| 164 | property | `extent` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores orthographic shadow extent in scene units. | entity/value | none |
| 167 | property | `cameraLeft` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores optional asymmetric orthographic shadow camera bounds. | entity/value | none |
| 169 | property | `cameraRight` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores the camera right extent. | entity/value | none |
| 171 | property | `cameraTop` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores the camera top extent. | entity/value | none |
| 173 | property | `cameraBottom` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores the camera bottom extent. | entity/value | none |
| 176 | property | `lightDistance` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores light placement distance in scene units. | entity/value | none |
| 179 | property | `cameraNear` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores shadow camera near plane in scene units. | entity/value | none |
| 182 | property | `cameraFar` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores shadow camera far plane in scene units. | entity/value | none |
| 185 | property | `mapSize` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores shadow-map width and height in pixels. | entity/value | none |
| 188 | property | `bias` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores shadow bias. | entity/value | none |
| 191 | property | `normalBias` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores normal shadow bias in scene units. | entity/value | none |
| 194 | property | `radius` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores Three shadow PCF radius in pixels. | entity/value | none |
| 197 | property | `shadowIntensity` | `LightSourceThreeShadowObjectRequest` | descriptive-other: Value that stores Three shadow opacity for source-owned shadow maps. | entity/value | none |
| 201 | type | `LightSourceThreeEndpointIndirectFillRequest` | `<module>` | descriptive-other: Type that configures optional local endpoint indirect fill lighting. | entity/value | none |
| 205 | property | `enabled` | `LightSourceThreeEndpointIndirectFillRequest` | descriptive-other: Enable or disable indirect fill lighting. | entity/value | none |
| 210 | property | `policy` | `LightSourceThreeEndpointIndirectFillRequest` | descriptive-other: Optional indirect-fill approximation policy. | entity/value | none |
| 213 | property | `intensityRatio` | `LightSourceThreeEndpointIndirectFillRequest` | descriptive-other: Value that stores fill intensity relative to the source-driven endpoint light. | entity/value | none |
| 216 | property | `distance` | `LightSourceThreeEndpointIndirectFillRequest` | descriptive-other: Value that stores fill placement distance in scene units. | entity/value | none |
| 220 | type | `LightSourceThreeShadowOwner` | `<module>` | descriptive-other: Source-owned metadata applied to a configured Three shadow object tree. | entity/value | none |
| 222 | property | `owner` | `LightSourceThreeShadowOwner` | descriptive-other: Identifier of the light-source facade that owns the shadow policy. | entity/value | none |
| 224 | property | `sourceKey` | `LightSourceThreeShadowOwner` | descriptive-other: Stable key of the source that owns the configured object tree. | entity/value | none |
| 226 | property | `shadowPolicy` | `LightSourceThreeShadowOwner` | descriptive-other: Renderer shadow policy associated with the source. | entity/value | none |
| 230 | type | `ThreeShadowNode` | `<module>` | descriptive-other: Mutable Three object surface configured for source shadows. | entity/value | none |
| 232 | property | `castShadow` | `ThreeShadowNode` | descriptive-other: Shadow-casting selection for this object. | entity/value | none |
| 234 | property | `receiveShadow` | `ThreeShadowNode` | descriptive-other: Shadow-receiving selection for this object. | entity/value | none |
| 236 | property | `userData` | `ThreeShadowNode` | descriptive-other: Renderer-neutral Algorithm32 metadata. | entity/value | none |
| 238 | property | `layers` | `ThreeShadowNode` | descriptive-other: Optional renderer layer interface. | entity/value | none |
| 246 | method | `enable` | `ThreeShadowNode` | call-this-method: Call this method to enable one renderer layer. | active-callable | params 1/1 |
| 255 | method | `traverse` | `ThreeShadowNode` | call-this-method: Call this method to traverse this object and its descendants. | active-callable | params 1/1 |
| 259 | type | `ThreeLightingObjectVisitor` | `<module>` | descriptive-other: Operation that visits one renderer object in a lighting subtree. | entity/value | none |
| 263 | callback | `<function-type>` | `ThreeLightingObjectVisitor` | called-by: Called by renderer traversal to visit one lighting object. | called-by | params 1/1 |

## `src/algorithm32/light-sources/shared/types.d.ts`

Source: [src/algorithm32/light-sources/shared/types.d.ts](../../../../../../src/algorithm32/light-sources/shared/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `DirectLightingSample` | `<module>` | descriptive-other: Type that describes direct lighting supplied by a configured light source. | entity/value | none |
| 4 | property | `sourceIrradiance` | `DirectLightingSample` | descriptive-other: Value that stores source spectral irradiance aligned to the active spectral basis. | entity/value | none |
| 7 | property | `directionToLight` | `DirectLightingSample` | descriptive-other: Value that stores the normalized direction from the sample point toward the light. | entity/value | none |
| 10 | property | `sourceTransmittance` | `DirectLightingSample` | descriptive-other: Value that stores source-path transmittance when the source owns a precomputed value. | entity/value | none |
| 13 | property | `metadata` | `DirectLightingSample` | descriptive-other: Value that stores owner-specific metadata for validation or diagnostics. | entity/value | none |
| 17 | type | `SourcePathLimit` | `<module>` | descriptive-other: Type that describes how far a source path may travel before geometry or source policy... | entity/value | none |
| 19 | property | `maxDistance` | `SourcePathLimit` | descriptive-other: Value that stores the maximum source-path distance, or null when the source is direct... | entity/value | none |
| 22 | property | `reason` | `SourcePathLimit` | descriptive-other: Explanation of the source-owned path limit policy. | entity/value | none |

## `src/algorithm32/light-sources/types.d.ts`

Source: [src/algorithm32/light-sources/types.d.ts](../../../../../../src/algorithm32/light-sources/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `LightSourceThreeShadowConfigurationRequest` | `<module>` | descriptive-other: Optional overrides for configuring a Three shadow object tree. | entity/value | none |
| 4 | property | `castShadow` | `LightSourceThreeShadowConfigurationRequest` | descriptive-other: Optional cast-shadow selection. | entity/value | none |
| 6 | property | `receiveShadow` | `LightSourceThreeShadowConfigurationRequest` | descriptive-other: Optional receive-shadow selection. | entity/value | none |
| 8 | property | `includeDescendants` | `LightSourceThreeShadowConfigurationRequest` | descriptive-other: Optional descendant-traversal selection. | entity/value | none |
| 10 | property | `shadowPolicy` | `LightSourceThreeShadowConfigurationRequest` | descriptive-other: Optional source shadow-policy override. | entity/value | none |
| 12 | property | `sourceKey` | `LightSourceThreeShadowConfigurationRequest` | descriptive-other: Optional source identity override. | entity/value | none |
| 14 | property | `layerIndex` | `LightSourceThreeShadowConfigurationRequest` | descriptive-other: Optional renderer layer index. | entity/value | none |
| 18 | interface | `LightSourceModel` | `<module>` | descriptive-other: Contract that provides the configured Algorithm32 light-source facts used by algorith... | entity/value | none |
| 20 | property | `id` | `LightSourceModel` | descriptive-other: Value that identifies this configured light-source model instance for compatibility a... | entity/value | none |
| 28 | method | `createCacheController` | `LightSourceModel` | call-this-method: Call this method to create this source kind's cache controller for one renderer attac... | active-callable | params 1/1; returns tagged |
| 37 | method | `sampleDirectLighting` | `LightSourceModel` | call-this-method: Call this method to sample direct lighting at one geometry-resolved source-relative p... | active-callable | params 1/1; returns tagged |
| 46 | method | `resolveSourcePathLimit` | `LightSourceModel` | call-this-method: Call this method to resolve the source-owned path limit for sample-to-source transmit... | active-callable | params 1/1; returns tagged |
| 54 | method | `createShaderContribution` | `LightSourceModel` | call-this-method: Call this method to optionally contribute light-source-owned shader source, symbols, ... | active-callable | params 1/1; returns tagged |
| 62 | method | `resolveSceneLightScales` | `LightSourceModel` | call-this-method: Call this method to optionally resolve source-owned neutral renderer scene-light scal... | active-callable | params 1/1; returns tagged |
| 70 | method | `addSceneLighting` | `LightSourceModel` | call-this-method: Call this method to add or create optional renderer-lighting helpers for endpoint sce... | active-callable | params 1/1; returns tagged |
| 79 | method | `configureThreeShadowObject` | `LightSourceModel` | call-this-method: Call this method to optionally configure an app-authored Three object or mesh tree to... | active-callable | params 2/2; returns tagged |

## `src/algorithm32/profiles/native-15/types.d.ts`

Source: [src/algorithm32/profiles/native-15/types.d.ts](../../../../../../src/algorithm32/profiles/native-15/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `SpectralChannelConstant` | `<module>` | descriptive-other: Canonical spectral channel before assembly into the Native-15 basis and source packet. | entity/value | none |
| 4 | property | `name` | `SpectralChannelConstant` | descriptive-other: Channel identifier. | entity/value | none |
| 6 | property | `wavelength` | `SpectralChannelConstant` | descriptive-other: Unit-bearing channel-center wavelength. | entity/value | none |
| 8 | property | `sourceIrradiance` | `SpectralChannelConstant` | descriptive-other: Unit-bearing top-of-atmosphere source irradiance density. | entity/value | none |
| 10 | property | `wavelengthBinWidth` | `SpectralChannelConstant` | descriptive-other: Unit-bearing wavelength-bin width. | entity/value | none |
| 14 | type | `NativePhysicalProfile` | `<module>` | descriptive-other: Readonly physical configuration for the Native-15 production profile. | entity/value | none |
| 16 | property | `kind` | `NativePhysicalProfile` | descriptive-other: Native physical-profile kind. | entity/value | none |
| 18 | property | `id` | `NativePhysicalProfile` | descriptive-other: Unique identifier for the physical profile. | entity/value | none |
| 20 | property | `schemaRevision` | `NativePhysicalProfile` | descriptive-other: Physical-profile schema revision. | entity/value | none |
| 22 | property | `revision` | `NativePhysicalProfile` | descriptive-other: Physical-profile value revision. | entity/value | none |
| 24 | property | `role` | `NativePhysicalProfile` | descriptive-other: Production role of the profile. | entity/value | none |
| 26 | property | `comparisonParity` | `NativePhysicalProfile` | descriptive-other: False because this profile does not target paper-comparison parity. | entity/value | none |
| 28 | property | `geometry` | `NativePhysicalProfile` | descriptive-other: Spherical geometry dimensions fixed by the Native-15 physical profile. | entity/value | none |
| 30 | property | `bottomRadius` | `NativePhysicalProfile` | descriptive-other: Unit-bearing ground radius. | entity/value | none |
| 32 | property | `topRadius` | `NativePhysicalProfile` | descriptive-other: Unit-bearing top-of-atmosphere radius. | entity/value | none |
| 35 | property | `atmosphere` | `NativePhysicalProfile` | descriptive-other: Atmospheric constituent constants fixed by the Native-15 physical profile. | entity/value | none |
| 37 | property | `rayleigh` | `NativePhysicalProfile` | descriptive-other: Rayleigh scattering constants. | entity/value | none |
| 39 | property | `scaleHeight` | `NativePhysicalProfile` | descriptive-other: Unit-bearing Rayleigh density scale height. | entity/value | none |
| 41 | property | `coefficientScale` | `NativePhysicalProfile` | descriptive-other: Unit-bearing Rayleigh coefficient scale. | entity/value | none |
| 44 | property | `mie` | `NativePhysicalProfile` | descriptive-other: Mie scattering constants. | entity/value | none |
| 46 | property | `scaleHeight` | `NativePhysicalProfile` | descriptive-other: Unit-bearing Mie density scale height. | entity/value | none |
| 48 | property | `angstromAlpha` | `NativePhysicalProfile` | descriptive-other: Dimensionless Angstrom alpha exponent. | entity/value | none |
| 50 | property | `angstromBeta` | `NativePhysicalProfile` | descriptive-other: Dimensionless Angstrom beta coefficient. | entity/value | none |
| 52 | property | `singleScatteringAlbedo` | `NativePhysicalProfile` | descriptive-other: Dimensionless Mie single-scattering albedo. | entity/value | none |
| 54 | property | `phaseAsymmetry` | `NativePhysicalProfile` | descriptive-other: Dimensionless Mie phase-function asymmetry. | entity/value | none |
| 57 | property | `ozone` | `NativePhysicalProfile` | descriptive-other: Ozone absorption selection. | entity/value | none |
| 59 | property | `absorptionEnabled` | `NativePhysicalProfile` | descriptive-other: Whether ozone absorption is enabled. | entity/value | none |
| 63 | property | `ground` | `NativePhysicalProfile` | descriptive-other: Explicitly configured physical ground facts; absent in the documented default. | entity/value | none |
| 65 | property | `albedo` | `NativePhysicalProfile` | descriptive-other: Profile-owned spectral hemispherical reflectance. | entity/value | none |
| 70 | type | `NativeNumericalProfile` | `<module>` | descriptive-other: Readonly numerical configuration for the Native-15 production profile. | entity/value | none |
| 72 | property | `kind` | `NativeNumericalProfile` | descriptive-other: Native numerical-profile kind. | entity/value | none |
| 74 | property | `id` | `NativeNumericalProfile` | descriptive-other: Unique identifier for the numerical profile. | entity/value | none |
| 76 | property | `schemaRevision` | `NativeNumericalProfile` | descriptive-other: Numerical-profile schema revision. | entity/value | none |
| 78 | property | `revision` | `NativeNumericalProfile` | descriptive-other: Numerical-profile value revision. | entity/value | none |
| 80 | property | `role` | `NativeNumericalProfile` | descriptive-other: Production role of the profile. | entity/value | none |
| 82 | property | `comparisonParity` | `NativeNumericalProfile` | descriptive-other: False because this profile does not target paper-comparison parity. | entity/value | none |
| 84 | property | `viewPath` | `NativeNumericalProfile` | descriptive-other: View-path integration selection, with a documented default of 15 intervals. | entity/value | none |
| 86 | property | `intervalCount` | `NativeNumericalProfile` | descriptive-other: View-path integration interval count. | entity/value | none |
| 89 | property | `sourcePathTransmittance` | `NativeNumericalProfile` | descriptive-other: Source-path transmittance selection, with a documented default of 20 intervals. | entity/value | none |
| 91 | property | `intervalCount` | `NativeNumericalProfile` | descriptive-other: Source-path integration interval count. | entity/value | none |
| 94 | property | `cacheConstruction` | `NativeNumericalProfile` | descriptive-other: Cache-construction selection, with defaults of 15 transport intervals and scattering ... | entity/value | none |
| 98 | type | `NativeSourceIrradianceDensity` | `<module>` | descriptive-other: Runtime-validated Native-15 source irradiance-density packet. | entity/value | none |
| 101 | type | `NativeGroundAlbedo` | `<module>` | descriptive-other: Runtime-validated Native-15 ground-albedo packet. | entity/value | none |
| 112 | type | `NativeProductionProfileOverrides` | `<module>` | descriptive-other: Caller-supplied overrides for the documented Native-15 production default. These are ... | entity/value | none |
| 114 | property | `id` | `NativeProductionProfileOverrides` | descriptive-other: Replacement production-profile identifier. | entity/value | none |
| 116 | property | `revision` | `NativeProductionProfileOverrides` | descriptive-other: Replacement production-profile revision. | entity/value | none |
| 118 | property | `sourceIrradianceDensity` | `NativeProductionProfileOverrides` | descriptive-other: Compatible replacement Native-15 source irradiance density. | entity/value | none |
| 120 | property | `albedo` | `NativeProductionProfileOverrides` | descriptive-other: Explicit Native-15 ground albedo; omission retains the default without reflective gro... | entity/value | none |
| 122 | property | `pathIntervalCount` | `NativeProductionProfileOverrides` | descriptive-other: Replacement positive view-path integration interval count. | entity/value | none |
| 124 | property | `sourceTransmittanceIntervalCount` | `NativeProductionProfileOverrides` | descriptive-other: Replacement positive source-path transmittance interval count. | entity/value | none |
| 126 | property | `transportIntervalCount` | `NativeProductionProfileOverrides` | descriptive-other: Replacement positive cache-transport integration interval count. | entity/value | none |
| 128 | property | `maximumScatteringOrder` | `NativeProductionProfileOverrides` | descriptive-other: Replacement supported maximum scattering order. | entity/value | none |
| 150 | type | `NativeProductionProfile` | `<module>` | descriptive-other: Readonly Native-15 production configuration with one documented default. The default ... | entity/value | none |
| 152 | property | `kind` | `NativeProductionProfile` | descriptive-other: Native production-profile kind. | entity/value | none |
| 154 | property | `id` | `NativeProductionProfile` | descriptive-other: Unique identifier for the production profile. | entity/value | none |
| 156 | property | `schemaRevision` | `NativeProductionProfile` | descriptive-other: Production-profile schema revision. | entity/value | none |
| 158 | property | `revision` | `NativeProductionProfile` | descriptive-other: Production-profile value revision. | entity/value | none |
| 160 | property | `role` | `NativeProductionProfile` | descriptive-other: Production role of the profile. | entity/value | none |
| 162 | property | `comparisonParity` | `NativeProductionProfile` | descriptive-other: False because this profile does not target paper-comparison parity. | entity/value | none |
| 164 | property | `spectral` | `NativeProductionProfile` | descriptive-other: Native-15 spectral selections. | entity/value | none |
| 166 | property | `basis` | `NativeProductionProfile` | descriptive-other: Native-15 bin-average spectral basis. | entity/value | none |
| 168 | property | `sourceIrradianceDensity` | `NativeProductionProfile` | descriptive-other: Native-15 top-of-atmosphere source irradiance density. | entity/value | none |
| 171 | property | `physical` | `NativeProductionProfile` | descriptive-other: Native physical profile, including optional caller-supplied ground albedo. | entity/value | none |
| 173 | property | `numerical` | `NativeProductionProfile` | descriptive-other: Native numerical profile after caller overrides are applied. | entity/value | none |

## `src/algorithm32/quantities/spectral/types.d.ts`

Source: [src/algorithm32/quantities/spectral/types.d.ts](../../../../../../src/algorithm32/quantities/spectral/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | type | `SpectralSampleSemantics` | `<module>` | descriptive-other: Interpretation of each value in an ordered spectral basis. - **"contiguous-wavelength... | entity/value | none |
| 9 | type | `SpectralBasisChannel` | `<module>` | descriptive-other: One named contiguous wavelength bin in a spectral basis. | entity/value | none |
| 11 | property | `id` | `SpectralBasisChannel` | descriptive-other: Identifier unique within the ordered basis. | entity/value | none |
| 13 | property | `center` | `SpectralBasisChannel` | descriptive-other: Physical center wavelength of the bin. | entity/value | none |
| 15 | property | `width` | `SpectralBasisChannel` | descriptive-other: Physical wavelength width of the bin. | entity/value | none |
| 19 | type | `SpectralBasisDefinition` | `<module>` | descriptive-other: Caller-supplied definition for constructing a spectral basis. | entity/value | none |
| 21 | property | `id` | `SpectralBasisDefinition` | descriptive-other: Identifier for the represented spectral basis. | entity/value | none |
| 23 | property | `schemaRevision` | `SpectralBasisDefinition` | descriptive-other: Optional schema revision, with the current revision used when omitted. | entity/value | none |
| 25 | property | `semantics` | `SpectralBasisDefinition` | descriptive-other: Optional channel interpretation, with contiguous bin averages used when omitted. | entity/value | none |
| 27 | property | `channels` | `SpectralBasisDefinition` | descriptive-other: Ordered wavelength bins defining the basis. | entity/value | none |
| 31 | type | `SpectralBasisValue` | `<module>` | descriptive-other: Canonical value and identity contract exposed by a spectral basis. | entity/value | none |
| 33 | property | `kind` | `SpectralBasisValue` | descriptive-other: Contract kind for spectral-basis values. | entity/value | none |
| 35 | property | `id` | `SpectralBasisValue` | descriptive-other: Identifier for the represented spectral basis. | entity/value | none |
| 37 | property | `schemaRevision` | `SpectralBasisValue` | descriptive-other: Schema revision governing the basis value. | entity/value | none |
| 39 | property | `semantics` | `SpectralBasisValue` | descriptive-other: Interpretation of every ordered channel value. | entity/value | none |
| 41 | property | `channels` | `SpectralBasisValue` | descriptive-other: Ordered canonical wavelength bins. | entity/value | none |
| 43 | property | `channelCount` | `SpectralBasisValue` | descriptive-other: Number of ordered wavelength bins. | entity/value | none |
| 45 | property | `contentHash` | `SpectralBasisValue` | descriptive-other: Canonical hash of the complete normalized physical identity. | entity/value | none |
| 49 | type | `SpectralBasisJson` | `<module>` | descriptive-other: Plain serializable value for a spectral basis. | entity/value | none |
| 52 | interface | `SpectralBasis` | `<module>` | descriptive-other: Immutable ordered wavelength-bin basis with canonical physical identity. | entity/value | none |
| 58 | method | `toJSON` | `SpectralBasis` | call-this-method: Call this method to return the plain serializable spectral-basis value. | active-callable | returns tagged |
| 77 | type | `SpectralQuantity` | `<module>` | descriptive-other: Physical quantity carried by a spectral packet. - **"spectral-irradiance-density"** -... | entity/value | union bullets 12/12 |
| 102 | type | `SpectralUnits` | `<module>` | descriptive-other: Canonical unit spelling carried by a supported spectral quantity. - **"1"** - Dimensi... | entity/value | union bullets 7/7 |
| 106 | type | `SpectralPacketDefinition` | `<module>` | descriptive-other: Caller-supplied definition for constructing a spectral packet. | entity/value | none |
| 108 | property | `quantity` | `SpectralPacketDefinition` | descriptive-other: Physical quantity carried by the packet. | entity/value | none |
| 110 | property | `units` | `SpectralPacketDefinition` | descriptive-other: Physical units, normalized to the quantity's canonical spelling during construction. | entity/value | none |
| 112 | property | `basis` | `SpectralPacketDefinition` | descriptive-other: Ordered spectral basis interpreting the packet values. | entity/value | none |
| 114 | property | `semantics` | `SpectralPacketDefinition` | descriptive-other: Optional sample semantics, with the basis semantics used when omitted. | entity/value | none |
| 116 | property | `values` | `SpectralPacketDefinition` | descriptive-other: Ordered channel values copied during construction. | entity/value | none |
| 118 | property | `provenanceIdentity` | `SpectralPacketDefinition` | descriptive-other: Provenance identity for the packet values. | entity/value | none |
| 122 | type | `SpectralPacketValue` | `<module>` | descriptive-other: Canonical value and identity contract exposed by a spectral packet. | entity/value | none |
| 124 | property | `kind` | `SpectralPacketValue` | descriptive-other: Contract kind for spectral-packet values. | entity/value | none |
| 126 | property | `quantity` | `SpectralPacketValue` | descriptive-other: Physical quantity carried by the packet. | entity/value | none |
| 128 | property | `units` | `SpectralPacketValue` | descriptive-other: Canonical units for the physical quantity. | entity/value | none |
| 130 | property | `basis` | `SpectralPacketValue` | descriptive-other: Ordered spectral basis interpreting the values. | entity/value | none |
| 132 | property | `basisHash` | `SpectralPacketValue` | descriptive-other: Canonical content hash of the spectral basis. | entity/value | none |
| 134 | property | `semantics` | `SpectralPacketValue` | descriptive-other: Interpretation shared by every ordered channel value. | entity/value | none |
| 136 | property | `values` | `SpectralPacketValue` | descriptive-other: Independently owned ordered channel values. | entity/value | none |
| 138 | property | `provenanceIdentity` | `SpectralPacketValue` | descriptive-other: Provenance identity for the packet values. | entity/value | none |
| 140 | property | `contentHash` | `SpectralPacketValue` | descriptive-other: Canonical hash of the complete normalized packet identity. | entity/value | none |
| 144 | type | `SpectralPacketJson` | `<module>` | descriptive-other: Plain serializable value for a spectral packet without its live basis owner. | entity/value | none |
| 147 | interface | `SpectralPacket` | `<module>` | descriptive-other: Immutable spectral value with its complete interpretation and physical identity. | entity/value | none |
| 153 | method | `toJSON` | `SpectralPacket` | call-this-method: Call this method to return the plain serializable spectral-packet value. | active-callable | returns tagged |
| 157 | type | `SpectralIrradiancePacket` | `<module>` | descriptive-other: Source spectral irradiance density with its canonical interpretation. | entity/value | none |
| 159 | property | `quantity` | `SpectralIrradiancePacket` | descriptive-other: Quantity value. | entity/value | none |
| 160 | property | `units` | `SpectralIrradiancePacket` | descriptive-other: Units value. | entity/value | none |
| 164 | type | `SpectralRadiancePacket` | `<module>` | descriptive-other: Spectral radiance density with its canonical interpretation. | entity/value | none |
| 166 | property | `quantity` | `SpectralRadiancePacket` | descriptive-other: Quantity value. | entity/value | none |
| 167 | property | `units` | `SpectralRadiancePacket` | descriptive-other: Units value. | entity/value | none |
| 171 | type | `SpectralScatteringDensityPacket` | `<module>` | descriptive-other: Local spectral scattering density with its canonical interpretation. | entity/value | none |
| 173 | property | `quantity` | `SpectralScatteringDensityPacket` | descriptive-other: Quantity value. | entity/value | none |
| 174 | property | `units` | `SpectralScatteringDensityPacket` | descriptive-other: Units value. | entity/value | none |
| 178 | type | `SpectralTransmittancePacket` | `<module>` | descriptive-other: Spectral transmittance with its canonical interpretation. | entity/value | none |
| 180 | property | `quantity` | `SpectralTransmittancePacket` | descriptive-other: Quantity value. | entity/value | none |
| 181 | property | `units` | `SpectralTransmittancePacket` | descriptive-other: Units value. | entity/value | none |
| 185 | type | `SpectralOpticalDepthPacket` | `<module>` | descriptive-other: Spectral optical depth with its canonical interpretation. | entity/value | none |
| 187 | property | `quantity` | `SpectralOpticalDepthPacket` | descriptive-other: Quantity value. | entity/value | none |
| 188 | property | `units` | `SpectralOpticalDepthPacket` | descriptive-other: Units value. | entity/value | none |
| 192 | type | `SpectralExtinctionCoefficientPacket` | `<module>` | descriptive-other: Spectral extinction coefficients with their canonical interpretation. | entity/value | none |
| 194 | property | `quantity` | `SpectralExtinctionCoefficientPacket` | descriptive-other: Quantity value. | entity/value | none |
| 195 | property | `units` | `SpectralExtinctionCoefficientPacket` | descriptive-other: Units value. | entity/value | none |
| 199 | type | `SpectralScatteringCoefficientPacket` | `<module>` | descriptive-other: Spectral scattering coefficients with their canonical interpretation. | entity/value | none |
| 201 | property | `quantity` | `SpectralScatteringCoefficientPacket` | descriptive-other: Quantity value. | entity/value | none |
| 202 | property | `units` | `SpectralScatteringCoefficientPacket` | descriptive-other: Units value. | entity/value | none |
| 206 | type | `SpectralAbsorptionCoefficientPacket` | `<module>` | descriptive-other: Spectral absorption coefficients with their canonical interpretation. | entity/value | none |
| 208 | property | `quantity` | `SpectralAbsorptionCoefficientPacket` | descriptive-other: Quantity value. | entity/value | none |
| 209 | property | `units` | `SpectralAbsorptionCoefficientPacket` | descriptive-other: Units value. | entity/value | none |
| 213 | type | `SpectralPhaseWeightedScatteringCoefficientPacket` | `<module>` | descriptive-other: Phase-weighted spectral scattering with its canonical interpretation. | entity/value | none |
| 215 | property | `quantity` | `SpectralPhaseWeightedScatteringCoefficientPacket` | descriptive-other: Quantity value. | entity/value | none |
| 216 | property | `units` | `SpectralPhaseWeightedScatteringCoefficientPacket` | descriptive-other: Units value. | entity/value | none |
| 220 | type | `SpectralReflectancePacket` | `<module>` | descriptive-other: Spectral reflectance with its canonical interpretation. | entity/value | none |
| 222 | property | `quantity` | `SpectralReflectancePacket` | descriptive-other: Quantity value. | entity/value | none |
| 223 | property | `units` | `SpectralReflectancePacket` | descriptive-other: Units value. | entity/value | none |
| 227 | type | `SpectralBrdfPacket` | `<module>` | descriptive-other: Spectral bidirectional reflectance distribution function. | entity/value | none |
| 229 | property | `quantity` | `SpectralBrdfPacket` | descriptive-other: Quantity value. | entity/value | none |
| 230 | property | `units` | `SpectralBrdfPacket` | descriptive-other: Units value. | entity/value | none |
| 234 | type | `SpectralPacketExpectation` | `<module>` | descriptive-other: Optional interpretation expectations applied when accepting a spectral packet. | entity/value | none |
| 236 | property | `quantity` | `SpectralPacketExpectation` | descriptive-other: Required physical quantity when supplied. | entity/value | none |
| 238 | property | `units` | `SpectralPacketExpectation` | descriptive-other: Required physical units when supplied. | entity/value | none |
| 240 | property | `basis` | `SpectralPacketExpectation` | descriptive-other: Required compatible spectral basis when supplied. | entity/value | none |
| 242 | property | `semantics` | `SpectralPacketExpectation` | descriptive-other: Required sample semantics when supplied. | entity/value | none |
| 246 | type | `SpectralPacketCompatibilityOptions` | `<module>` | descriptive-other: Caller-selected interpretation checks for comparing two spectral packets. | entity/value | none |
| 248 | property | `sameQuantity` | `SpectralPacketCompatibilityOptions` | descriptive-other: Whether both packets must carry the same physical quantity. | entity/value | none |
| 250 | property | `sameUnits` | `SpectralPacketCompatibilityOptions` | descriptive-other: Whether both packets must use the same canonical units. | entity/value | none |
| 252 | property | `sameSemantics` | `SpectralPacketCompatibilityOptions` | descriptive-other: Whether both packets must use the same semantics; enabled unless explicitly false. | entity/value | none |
| 256 | type | `SpectralPacketFactoryDefinition` | `<module>` | descriptive-other: Basis, interpretation, and provenance for a constant-valued spectral packet. | entity/value | none |
| 258 | property | `basis` | `SpectralPacketFactoryDefinition` | descriptive-other: Ordered spectral basis interpreting the packet values. | entity/value | none |
| 260 | property | `quantity` | `SpectralPacketFactoryDefinition` | descriptive-other: Physical quantity carried by the packet. | entity/value | none |
| 262 | property | `units` | `SpectralPacketFactoryDefinition` | descriptive-other: Physical units normalized during packet construction. | entity/value | none |
| 264 | property | `semantics` | `SpectralPacketFactoryDefinition` | descriptive-other: Optional sample semantics, with the basis semantics used when omitted. | entity/value | none |
| 266 | property | `provenanceIdentity` | `SpectralPacketFactoryDefinition` | descriptive-other: Provenance identity for the constant channel values. | entity/value | none |
| 270 | type | `SpectralOperationOptions` | `<module>` | descriptive-other: Optional provenance override for a derived spectral operation. | entity/value | none |
| 272 | property | `provenanceIdentity` | `SpectralOperationOptions` | descriptive-other: Provenance identity used instead of deterministic derivation. | entity/value | none |
| 276 | type | `SpectralResultInterpretation` | `<module>` | descriptive-other: Physical interpretation and optional provenance for a derived spectral result. | entity/value | none |
| 278 | property | `quantity` | `SpectralResultInterpretation` | descriptive-other: Physical quantity carried by the result. | entity/value | none |
| 280 | property | `units` | `SpectralResultInterpretation` | descriptive-other: Physical units normalized during result construction. | entity/value | none |
| 282 | property | `provenanceIdentity` | `SpectralResultInterpretation` | descriptive-other: Provenance identity used instead of deterministic derivation. | entity/value | none |
| 286 | type | `SpectralMappingResult` | `<module>` | descriptive-other: Optional physical interpretation and provenance for a mapped spectral result. | entity/value | none |
| 289 | type | `SpectralProvenanceParameters` | `<module>` | descriptive-other: Operation parameters included in a derived spectral provenance identity. | entity/value | none |
| 297 | type | `SpectralProvenanceIdentityFactory` | `<module>` | descriptive-other: Type used by SpectralMath.resolveProvenanceIdentity to derive an absent provenance id... | entity/value | none |
| 301 | callback | `<function-type>` | `SpectralProvenanceIdentityFactory` | called-by: Called by spectral provenance identity factory to handle one invocation of the declar... | called-by | returns tagged |
| 312 | type | `SpectralPacketMapper` | `<module>` | descriptive-other: Type used by SpectralMath.mapSpectralPacket to transform one ordered channel value. | entity/value | none |
| 319 | callback | `<function-type>` | `SpectralPacketMapper` | called-by: Called by spectral packet mapper to handle one invocation of the declared operation. | called-by | params 3/3; returns tagged |

## `src/algorithm32/quantities/units/types.d.ts`

Source: [src/algorithm32/quantities/units/types.d.ts](../../../../../../src/algorithm32/quantities/units/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `UnitValue` | `<module>` | descriptive-other: Scalar value paired with explicit physical units. | entity/value | none |
| 4 | property | `value` | `UnitValue` | descriptive-other: Scalar magnitude. | entity/value | none |
| 6 | property | `units` | `UnitValue` | descriptive-other: Explicit unit spelling for the magnitude. | entity/value | none |
| 15 | type | `DistanceUnits` | `<module>` | descriptive-other: Unit spelling accepted for a physical distance. - **"meters"** - Distance measured in... | entity/value | union bullets 2/2 |
| 22 | type | `AngleUnits` | `<module>` | descriptive-other: Unit spelling accepted for a physical angle. - **"radians"** - Angle measured in radi... | entity/value | union bullets 2/2 |
| 29 | type | `WavelengthUnits` | `<module>` | descriptive-other: Unit spelling accepted for a physical wavelength. - **"nanometers"** - Wavelength mea... | entity/value | union bullets 2/2 |
| 31 | type | `SolidAngleUnits` | `<module>` | descriptive-other: Type that describes the solid angle units contract. | entity/value | none |
| 33 | type | `InverseSolidAngleUnits` | `<module>` | descriptive-other: Type that describes the inverse solid angle units contract. | entity/value | none |
| 35 | type | `DurationUnits` | `<module>` | descriptive-other: Type that describes the duration units contract. | entity/value | none |
| 37 | type | `SceneDistanceUnits` | `<module>` | descriptive-other: Type that describes the scene distance units contract. | entity/value | none |
| 39 | type | `SceneScaleUnits` | `<module>` | descriptive-other: Type that describes the scene scale units contract. | entity/value | none |
| 46 | type | `InverseDistanceUnits` | `<module>` | descriptive-other: Unit spelling accepted for an inverse physical distance. - **"m^-1"** - Inverse dista... | entity/value | union bullets 2/2 |
| 48 | type | `RayleighCoefficientScaleUnits` | `<module>` | descriptive-other: Type that describes the calibrated Rayleigh coefficient-scale units contract. | entity/value | none |
| 50 | type | `DimensionlessUnits` | `<module>` | descriptive-other: Type that describes the dimensionless units contract. | entity/value | none |
| 52 | type | `PixelUnits` | `<module>` | descriptive-other: Type that describes the pixel units contract. | entity/value | none |
| 55 | type | `Distance` | `<module>` | descriptive-other: Type that describes the distance contract. | entity/value | none |
| 57 | type | `Angle` | `<module>` | descriptive-other: Type that describes the angle contract. | entity/value | none |
| 59 | type | `Wavelength` | `<module>` | descriptive-other: Type that describes the wavelength contract. | entity/value | none |
| 61 | type | `SolidAngle` | `<module>` | descriptive-other: Type that describes the solid angle contract. | entity/value | none |
| 63 | type | `InverseSolidAngle` | `<module>` | descriptive-other: Type that describes the inverse solid angle contract. | entity/value | none |
| 65 | type | `Duration` | `<module>` | descriptive-other: Type that describes the duration contract. | entity/value | none |
| 67 | type | `SceneDistance` | `<module>` | descriptive-other: Type that describes the scene distance contract. | entity/value | none |
| 69 | type | `SceneScale` | `<module>` | descriptive-other: Type that describes the scene scale contract. | entity/value | none |
| 71 | type | `InverseDistance` | `<module>` | descriptive-other: Type that describes the inverse distance contract. | entity/value | none |
| 73 | type | `RayleighCoefficientScale` | `<module>` | descriptive-other: Type that describes the calibrated Rayleigh coefficient scale contract. | entity/value | none |
| 75 | type | `Dimensionless` | `<module>` | descriptive-other: Type that describes the dimensionless contract. | entity/value | none |
| 77 | type | `PixelDistance` | `<module>` | descriptive-other: Scalar pixel-distance value. | entity/value | none |
| 80 | type | `PixelSize` | `<module>` | descriptive-other: Unit-bearing pixel-size value. | entity/value | none |
| 82 | property | `width` | `PixelSize` | descriptive-other: Width in pixels. | entity/value | none |
| 84 | property | `height` | `PixelSize` | descriptive-other: Height in pixels. | entity/value | none |
| 86 | property | `units` | `PixelSize` | descriptive-other: Physical units. | entity/value | none |
| 90 | type | `PixelSizeCandidate` | `<module>` | descriptive-other: Candidate object inspected at a pixel-size boundary. | entity/value | none |
| 92 | property | `width` | `PixelSizeCandidate` | descriptive-other: Candidate width. | entity/value | none |
| 94 | property | `height` | `PixelSizeCandidate` | descriptive-other: Candidate height. | entity/value | none |
| 96 | property | `units` | `PixelSizeCandidate` | descriptive-other: Candidate units. | entity/value | none |
| 100 | type | `PixelDistanceCandidate` | `<module>` | descriptive-other: Candidate object inspected at a pixel-distance boundary. | entity/value | none |
| 102 | property | `value` | `PixelDistanceCandidate` | descriptive-other: Candidate scalar value. | entity/value | none |
| 104 | property | `units` | `PixelDistanceCandidate` | descriptive-other: Candidate units. | entity/value | none |
| 108 | type | `UnitSeries` | `<module>` | descriptive-other: Type that describes the unit series contract. | entity/value | none |
| 110 | property | `values` | `UnitSeries` | descriptive-other: Value that stores the values. | entity/value | none |
| 112 | property | `units` | `UnitSeries` | descriptive-other: Value that identifies the physical units. | entity/value | none |
| 116 | type | `DistanceSeries` | `<module>` | descriptive-other: Type that describes the distance series contract. | entity/value | none |
| 119 | type | `UnitPosition` | `<module>` | descriptive-other: Type that describes the unit position contract. | entity/value | none |
| 121 | property | `coordinates` | `UnitPosition` | descriptive-other: Value that stores the coordinates. | entity/value | none |
| 123 | property | `units` | `UnitPosition` | descriptive-other: Value that identifies the physical units. | entity/value | none |
| 127 | type | `Position` | `<module>` | descriptive-other: Type that describes the position contract. | entity/value | none |
| 129 | type | `ScenePosition` | `<module>` | descriptive-other: Type that describes the scene position contract. | entity/value | none |
| 132 | type | `UnitFamilyContract` | `<module>` | descriptive-other: Public metadata for one supported unit-conversion family. | entity/value | none |
| 134 | property | `canonicalUnits` | `UnitFamilyContract` | descriptive-other: Canonical unit spelling for the family. | entity/value | none |
| 136 | property | `supportedUnits` | `UnitFamilyContract` | descriptive-other: Supported unit spellings for the family. | entity/value | none |
| 140 | type | `UnitConversion` | `<module>` | descriptive-other: Conversion metadata from one unit spelling into its physical-family canonical units. | entity/value | none |
| 142 | property | `family` | `UnitConversion` | descriptive-other: Physical-family identity shared by compatible units. | entity/value | none |
| 144 | property | `scale` | `UnitConversion` | descriptive-other: Value that scales from the unit spelling into the family's canonical units. | entity/value | none |

## `src/algorithm32/references/fixtures/types.d.ts`

Source: [src/algorithm32/references/fixtures/types.d.ts](../../../../../../src/algorithm32/references/fixtures/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | type | `Algorithm32ProductionReferencePointer` | `<module>` | descriptive-other: Point to the exact part of a production reference that supports one implementation de... | entity/value | none |
| 7 | property | `referenceNumber` | `Algorithm32ProductionReferencePointer` | descriptive-other: Value that stores the AMA-style numbered reference entry from references.md. | entity/value | none |
| 10 | property | `sourceId` | `Algorithm32ProductionReferencePointer` | descriptive-other: Value that stores a stable local source identifier when one exists. | entity/value | none |
| 13 | property | `section` | `Algorithm32ProductionReferencePointer` | descriptive-other: Value that stores the section or chapter locator inside the referenced source. | entity/value | none |
| 16 | property | `equation` | `Algorithm32ProductionReferencePointer` | descriptive-other: Value that stores the equation locator inside the referenced source. | entity/value | none |
| 19 | property | `figure` | `Algorithm32ProductionReferencePointer` | descriptive-other: Value that stores the figure locator inside the referenced source. | entity/value | none |
| 22 | property | `table` | `Algorithm32ProductionReferencePointer` | descriptive-other: Value that stores the table locator inside the referenced source. | entity/value | none |
| 25 | property | `row` | `Algorithm32ProductionReferencePointer` | descriptive-other: Value that stores the row, record, wavelength, or dataset-entry locator inside the re... | entity/value | none |
| 28 | property | `locator` | `Algorithm32ProductionReferencePointer` | descriptive-other: Value that stores the page, line, or local artifact locator when that is the clearest... | entity/value | none |
| 31 | property | `localArtifactPath` | `Algorithm32ProductionReferencePointer` | descriptive-other: Value that stores a local curated artifact path when the exact referenced data lives ... | entity/value | none |
| 34 | property | `note` | `Algorithm32ProductionReferencePointer` | descriptive-other: Explanation of how this precise locator supports the cited decision or expected value. | entity/value | none |
| 38 | type | `ProductionFixtureCitationGroup` | `<module>` | descriptive-other: Bracketed production-reference citation and its source-text offset. | entity/value | none |
| 40 | property | `value` | `ProductionFixtureCitationGroup` | descriptive-other: Decimal reference-number text inside the citation brackets. | entity/value | none |
| 42 | property | `index` | `ProductionFixtureCitationGroup` | descriptive-other: Zero-based source-text offset of the opening citation bracket. | entity/value | none |
| 53 | type | `ProductionFixtureLedgerStatus` | `<module>` | descriptive-other: Review state of a production fixture ledger. - **"draft"** - The ledger has a normali... | entity/value | union bullets 2/2 |
| 56 | type | `ProductionFixtureLedger` | `<module>` | descriptive-other: Type that describes a checked-in production fixture ledger. | entity/value | none |
| 58 | property | `kind` | `ProductionFixtureLedger` | descriptive-other: Value that identifies the JSON fixture family. | entity/value | none |
| 61 | property | `id` | `ProductionFixtureLedger` | descriptive-other: Value that identifies this ledger instance. | entity/value | none |
| 64 | property | `status` | `ProductionFixtureLedger` | descriptive-other: Value that describes the review state of the ledger. | entity/value | none |
| 69 | property | `sourcePath` | `ProductionFixtureLedger` | descriptive-other: Preserve the source fixture or artifact path used to promote these rows. | entity/value | none |
| 72 | property | `description` | `ProductionFixtureLedger` | descriptive-other: Value that describes the fixture family and promotion scope. | entity/value | none |
| 75 | property | `rows` | `ProductionFixtureLedger` | descriptive-other: Value that stores the source-backed expectation rows. | entity/value | none |
| 79 | type | `ProductionFixtureRow` | `<module>` | descriptive-other: Type that describes one source-backed fixture expectation row. | entity/value | none |
| 81 | property | `id` | `ProductionFixtureRow` | descriptive-other: Value that identifies the row with a stable dotted id. | entity/value | none |
| 86 | property | `area` | `ProductionFixtureRow` | descriptive-other: Group the row by the transport or support area it exercises. | entity/value | none |
| 91 | property | `quantity` | `ProductionFixtureRow` | descriptive-other: Name the physical or algorithm quantity under test. | entity/value | none |
| 96 | property | `citation` | `ProductionFixtureRow` | descriptive-other: Summarize the source-backed fact using bracket citations. | entity/value | none |
| 101 | property | `references` | `ProductionFixtureRow` | descriptive-other: Point to precise locations in the numbered production reference list. | entity/value | none |
| 104 | property | `assumptions` | `ProductionFixtureRow` | descriptive-other: Value that stores human-reviewable assumptions for the row. | entity/value | none |
| 107 | property | `input` | `ProductionFixtureRow` | descriptive-other: Value that stores the input packet or calculation factors for the row. | entity/value | none |
| 110 | property | `expected` | `ProductionFixtureRow` | descriptive-other: Value that stores the expected values for successful rows. | entity/value | none |
| 113 | property | `expectedError` | `ProductionFixtureRow` | descriptive-other: Value that stores the expected error for loud-failure rows. | entity/value | none |
| 116 | property | `tolerance` | `ProductionFixtureRow` | descriptive-other: Value that stores the tolerance rule by expected-value name. | entity/value | none |
| 119 | property | `independence` | `ProductionFixtureRow` | descriptive-other: Explanation of why the expected value is independent of the production implementation. | entity/value | none |
| 123 | type | `ProductionFixtureExpectedValue` | `<module>` | descriptive-other: Type that describes one expected fixture value. | entity/value | none |
| 125 | property | `value` | `ProductionFixtureExpectedValue` | descriptive-other: Value that stores the expected scalar, array, object, or literal value. | entity/value | none |
| 128 | property | `units` | `ProductionFixtureExpectedValue` | descriptive-other: Value that stores the physical or fixture unit label for the expected value. | entity/value | none |
| 131 | property | `derivation` | `ProductionFixtureExpectedValue` | descriptive-other: Explanation of the hand calculation, source row, or external-tool result behind the e... | entity/value | none |
| 135 | type | `ProductionFixtureError` | `<module>` | descriptive-other: Type that describes one expected fixture error. | entity/value | none |
| 137 | property | `type` | `ProductionFixtureError` | descriptive-other: Value that stores the expected JavaScript error class or Algorithm32 error code. | entity/value | none |
| 140 | property | `messageIncludes` | `ProductionFixtureError` | descriptive-other: Value that stores required message fragments or structured error details. | entity/value | none |
| 143 | property | `derivation` | `ProductionFixtureError` | descriptive-other: Explanation of why the source-backed row should fail loudly. | entity/value | none |
| 153 | type | `ProductionFixtureToleranceMode` | `<module>` | descriptive-other: Comparison mode for one production-fixture expected value. - **"exact"** - Exact stru... | entity/value | union bullets 3/3 |
| 156 | type | `ProductionFixtureTolerance` | `<module>` | descriptive-other: Type that describes how a production fixture expected value should be compared. | entity/value | none |
| 158 | property | `mode` | `ProductionFixtureTolerance` | descriptive-other: Value that stores the tolerance comparison mode. | entity/value | none |
| 161 | property | `value` | `ProductionFixtureTolerance` | descriptive-other: Value that stores the numeric tolerance threshold for approximate comparisons. | entity/value | none |

## `src/algorithm32/runtime/facade/types.d.ts`

Source: [src/algorithm32/runtime/facade/types.d.ts](../../../../../../src/algorithm32/runtime/facade/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ExecutionConfig` | `<module>` | descriptive-other: Type that configures numerical execution behavior for one Algorithm32 facade instance. | entity/value | none |
| 4 | property | `pathIntervalCount` | `ExecutionConfig` | descriptive-other: Value that stores default view-path interval count for CPU/reference evaluation. | entity/value | none |
| 7 | property | `sourceTransmittanceIntervalCount` | `ExecutionConfig` | descriptive-other: Value that stores source transmittance integration count when source paths need it. | entity/value | none |
| 10 | property | `maximumScatteringOrder` | `ExecutionConfig` | descriptive-other: Value that selects the cumulative cache maximum. Omission resolves to order 4 at the ... | entity/value | none |
| 13 | property | `pathSampleDistribution` | `ExecutionConfig` | descriptive-other: Value that stores optional shader transport optimization facts. | entity/value | none |
| 23 | type | `ShaderPathSampleDistributionKind` | `<module>` | descriptive-other: View-path sample-distribution policy. - **"uniform-distance"** - Equal-distance place... | entity/value | union bullets 3/3 |
| 27 | type | `ShaderPathSampleDistribution` | `<module>` | descriptive-other: Type that configures shader view-path sample placement. | entity/value | none |
| 29 | property | `kind` | `ShaderPathSampleDistribution` | descriptive-other: Value that identifies the sample-distribution policy. | entity/value | none |
| 33 | type | `Config` | `<module>` | descriptive-other: Type that configures one Algorithm32 facade instance. | entity/value | none |
| 35 | property | `lightSource` | `Config` | descriptive-other: Value that provides the configured light-source model used by Algorithm32 evaluation ... | entity/value | none |
| 38 | property | `atmosphere` | `Config` | descriptive-other: Value that provides the configured atmosphere model used by Algorithm32 evaluation an... | entity/value | none |
| 41 | property | `geometry` | `Config` | descriptive-other: Value that provides the configured geometry model used by Algorithm32 evaluation and ... | entity/value | none |
| 44 | property | `groundBoundary` | `Config` | descriptive-other: Value that provides the configured ground boundary used by cache construction, or omi... | entity/value | none |
| 47 | property | `color` | `Config` | descriptive-other: Value that provides optional configured display conversion used by shader setup and C... | entity/value | none |
| 50 | property | `spectral` | `Config` | descriptive-other: Value that configures the spectral basis requested by Algorithm32. | entity/value | none |
| 53 | property | `execution` | `Config` | descriptive-other: Value that configures numerical execution behavior. | entity/value | none |
| 56 | property | `shader` | `Config` | descriptive-other: Value that configures optional runtime shader behavior. | entity/value | none |
| 60 | type | `Algorithm32FacadeModelDoubles` | `<module>` | descriptive-other: Production-shaped model doubles used by facade specifications. | entity/value | none |
| 62 | property | `lightSource` | `Algorithm32FacadeModelDoubles` | descriptive-other: Light-source model double. | entity/value | none |
| 64 | property | `atmosphere` | `Algorithm32FacadeModelDoubles` | descriptive-other: Atmosphere model double. | entity/value | none |
| 66 | property | `geometry` | `Algorithm32FacadeModelDoubles` | descriptive-other: Geometry model double. | entity/value | none |
| 70 | type | `ConfigSnapshot` | `<module>` | descriptive-other: Type that describes the accepted configuration state of one facade instance. | entity/value | none |
| 72 | property | `config` | `ConfigSnapshot` | descriptive-other: Value that stores the accepted facade configuration. | entity/value | none |
| 75 | property | `version` | `ConfigSnapshot` | descriptive-other: Value that stores the monotonically increasing configuration version. | entity/value | none |
| 79 | type | `ShaderRuntimeConfig` | `<module>` | descriptive-other: Type that configures optional runtime shader behavior. | entity/value | none |
| 81 | property | `mode` | `ShaderRuntimeConfig` | descriptive-other: Value that selects the runtime shader mode. | entity/value | none |
| 84 | property | `sceneDepthMax` | `ShaderRuntimeConfig` | descriptive-other: Value that stores the largest renderer-produced scene-hit distance encoded for the ru... | entity/value | none |
| 87 | property | `sceneScale` | `ShaderRuntimeConfig` | descriptive-other: Value that stores the renderer scene-to-physical scale. | entity/value | none |
| 90 | property | `cachePolicy` | `ShaderRuntimeConfig` | descriptive-other: Value that configures shader cache/resource policy. | entity/value | none |
| 93 | property | `capabilityPolicy` | `ShaderRuntimeConfig` | descriptive-other: Value that configures runtime capability failure policy. | entity/value | none |
| 96 | property | `renderTargetPolicy` | `ShaderRuntimeConfig` | descriptive-other: Value that configures render-target, HDR, depth, and color-space policy. | entity/value | none |
| 100 | type | `ShaderSetupRequest` | `<module>` | descriptive-other: Type that provides caller-owned Three/runtime handles for shader setup. | entity/value | none |
| 102 | property | `composer` | `ShaderSetupRequest` | descriptive-other: Value that provides the caller's existing postprocess composer. | entity/value | none |
| 105 | property | `scene` | `ShaderSetupRequest` | descriptive-other: Value that provides the scene rendered before the Algorithm32 atmosphere pass. | entity/value | none |
| 108 | property | `camera` | `ShaderSetupRequest` | descriptive-other: Value that provides the camera used to render the scene and derive atmosphere rays. | entity/value | none |
| 111 | property | `THREE` | `ShaderSetupRequest` | descriptive-other: Value that provides the optional Three namespace when the integration needs caller co... | entity/value | none |
| 114 | property | `cacheBackend` | `ShaderSetupRequest` | descriptive-other: Value that provides the composer-owned opaque GPU cache backend used by every cache c... | entity/value | none |
| 117 | property | `cacheBuildScheduler` | `ShaderSetupRequest` | descriptive-other: Optional callback that yields cache construction at executor-defined boundaries. | entity/value | none |
| 120 | property | `signal` | `ShaderSetupRequest` | descriptive-other: Cancel an in-progress source-owned cache construction. | entity/value | none |
| 123 | property | `viewportSize` | `ShaderSetupRequest` | descriptive-other: Value that provides initial viewport dimensions for setup-created runtime resources. ... | entity/value | none |
| 126 | property | `sceneDepthMax` | `ShaderSetupRequest` | descriptive-other: Value that provides the largest renderer-produced scene-hit distance encoded for the ... | entity/value | none |
| 129 | property | `sceneScale` | `ShaderSetupRequest` | descriptive-other: Value that provides the renderer scene-to-physical scale. | entity/value | none |
| 132 | property | `logger` | `ShaderSetupRequest` | descriptive-other: Value that provides an optional runtime logger for non-fatal frame failures. | entity/value | none |
| 135 | property | `performanceCallback` | `ShaderSetupRequest` | descriptive-other: Value that provides an optional shader-pass performance callback. When omitted, the r... | entity/value | none |
| 138 | property | `performanceSampleIntervalFrames` | `ShaderSetupRequest` | descriptive-other: Value that provides the pass invocation cadence for performance timer samples. Defaul... | entity/value | none |
| 143 | property | `performanceMaxPendingQueries` | `ShaderSetupRequest` | descriptive-other: Limit unresolved GPU timer queries per timed pass. Defaults to one. | entity/value | none |
| 146 | property | `bindingValues` | `ShaderSetupRequest` | descriptive-other: Value that provides optional initial runtime binding values by shader value key. | entity/value | none |
| 150 | type | `ShaderBuildRequestOptions` | `<module>` | descriptive-other: Optional lifecycle context for one shader build. | entity/value | none |
| 152 | property | `previousBuildResult` | `ShaderBuildRequestOptions` | descriptive-other: Previously installed result eligible for exact source-controller reuse. | entity/value | none |
| 154 | property | `signal` | `ShaderBuildRequestOptions` | descriptive-other: Cancellation signal for source-owned cache construction. | entity/value | none |
| 158 | type | `Algorithm32PreparedConfig` | `<module>` | descriptive-other: Complete unpublished Algorithm32 facade configuration replacement. | entity/value | none |
| 160 | property | `baseVersion` | `Algorithm32PreparedConfig` | descriptive-other: Facade version against which the replacement was prepared. | entity/value | none |
| 162 | property | `version` | `Algorithm32PreparedConfig` | descriptive-other: Facade version published with the replacement. | entity/value | none |
| 164 | property | `config` | `Algorithm32PreparedConfig` | descriptive-other: Accepted facade configuration. | entity/value | none |
| 166 | property | `model` | `Algorithm32PreparedConfig` | descriptive-other: Prepared shared model. | entity/value | none |
| 168 | property | `reference` | `Algorithm32PreparedConfig` | descriptive-other: Prepared CPU/reference collaborator. | entity/value | none |
| 170 | property | `shaderBuilder` | `Algorithm32PreparedConfig` | descriptive-other: Prepared runtime shader-build coordinator. | entity/value | none |
| 172 | property | `snapshot` | `Algorithm32PreparedConfig` | descriptive-other: Public snapshot corresponding to the prepared replacement. | entity/value | none |
| 176 | interface | `Algorithm32ShaderHandleFacade` | `<module>` | descriptive-other: Facade operations used by one installed Algorithm32 shader handle. | entity/value | none |
| 182 | method | `_prepareConfig` | `Algorithm32ShaderHandleFacade` | called-by: Called by algorithm32 shader handle facade to prepare a replacement facade configurat... | called-by | params 1/1; returns tagged |
| 191 | method | `_createShaderBuildRequest` | `Algorithm32ShaderHandleFacade` | called-by: Called by algorithm32 shader handle facade to create a shader build request from acce... | called-by | params 3/3; returns tagged |
| 202 | method | `_commitPreparedConfig` | `Algorithm32ShaderHandleFacade` | called-by: Called by algorithm32 shader handle facade to publish one completely prepared facade ... | called-by | params 1/1; returns tagged |
| 208 | method | `_discardPreparedConfig` | `Algorithm32ShaderHandleFacade` | called-by: Called by algorithm32 shader handle facade to dispose collaborators belonging to an u... | called-by | params 1/1 |
| 214 | method | `_forgetShaderHandle` | `Algorithm32ShaderHandleFacade` | called-by: Called by algorithm32 shader handle facade to forget one disposed shader handle. | called-by | params 1/1 |
| 218 | type | `Algorithm32ShaderHandleState` | `<module>` | descriptive-other: Facade ownership and installed runtime state for one Algorithm32 shader handle. | entity/value | none |
| 220 | property | `facade` | `Algorithm32ShaderHandleState` | descriptive-other: Facade that owns the handle. | entity/value | none |
| 223 | property | `setup` | `Algorithm32ShaderHandleState` | descriptive-other: Original shader setup request used for rebuilds. | entity/value | none |
| 226 | property | `buildResult` | `Algorithm32ShaderHandleState` | descriptive-other: Currently installed shader build result. | entity/value | none |
| 236 | type | `ShaderPerformanceEvent` | `<module>` | descriptive-other: Shader-pass performance event phase. - **"cpu-submit"** - CPU submission timing sampl... | entity/value | union bullets 3/3 |
| 239 | type | `ShaderPerformanceSample` | `<module>` | descriptive-other: Type that describes one optional shader-pass performance sample. | entity/value | none |
| 241 | property | `passName` | `ShaderPerformanceSample` | descriptive-other: Value that stores the pass that produced the sample. | entity/value | none |
| 244 | property | `event` | `ShaderPerformanceSample` | descriptive-other: Value that stores the event phase for the sample. | entity/value | none |
| 247 | property | `sampleId` | `ShaderPerformanceSample` | descriptive-other: Value that stores the correlated sample id shared by CPU and GPU events. | entity/value | none |
| 250 | property | `timestamp` | `ShaderPerformanceSample` | descriptive-other: Value that stores callback emission time. | entity/value | none |
| 253 | property | `cpuSubmitDuration` | `ShaderPerformanceSample` | descriptive-other: Value that stores CPU submit duration when available. | entity/value | none |
| 256 | property | `gpuDuration` | `ShaderPerformanceSample` | descriptive-other: Value that stores GPU elapsed duration when available. | entity/value | none |
| 259 | property | `gpuAvailable` | `ShaderPerformanceSample` | descriptive-other: Value that stores whether GPU timer query support was available. | entity/value | none |
| 262 | property | `disjoint` | `ShaderPerformanceSample` | descriptive-other: Value that stores whether the GPU disjoint flag invalidated the sample. | entity/value | none |
| 265 | property | `errorMessage` | `ShaderPerformanceSample` | descriptive-other: Value that stores optional failure detail for timer-query setup/readback. | entity/value | none |
| 274 | type | `ShaderPerformanceCallback` | `<module>` | descriptive-other: Operation that receives one completed shader performance sample. | entity/value | none |
| 278 | callback | `<function-type>` | `ShaderPerformanceCallback` | called-by: Called by shader performance measurement to publish one completed sample. | called-by | params 1/1 |
| 283 | interface | `ShaderHandle` | `<module>` | descriptive-other: Control an installed Algorithm32 runtime shader integration. | entity/value | none |
| 290 | method | `prepare` | `ShaderHandle` | call-this-method: Call this method to prepare the installed runtime program for its first render. | active-callable | params 1/1; returns tagged |
| 298 | method | `setConfig` | `ShaderHandle` | call-this-method: Call this method to replace the facade/runtime shader configuration and refresh resou... | active-callable | params 1/1; returns tagged |
| 305 | method | `getDiagnostics` | `ShaderHandle` | call-this-method: Call this method to return deferred shader diagnostics placeholder data. | active-callable | returns tagged |
| 312 | method | `dispose` | `ShaderHandle` | call-this-method: Call this method to dispose resources owned by the installed runtime shader integration. | active-callable | none |
| 316 | type | `EvaluationRequest` | `<module>` | descriptive-other: Type that describes one CPU/reference evaluation request. | entity/value | none |
| 318 | property | `viewRay` | `EvaluationRequest` | descriptive-other: Value that stores an optional geometry-owned view-ray request packet. | entity/value | none |
| 323 | property | `pathIntervalCount` | `EvaluationRequest` | descriptive-other: Override default path interval count for this evaluation. | entity/value | none |
| 326 | property | `scatteringCache` | `EvaluationRequest` | descriptive-other: Override the configured cumulative CPU scattering cache. | entity/value | none |
| 330 | type | `EvaluationResult` | `<module>` | descriptive-other: Type that describes one CPU/reference evaluation result. | entity/value | none |
| 332 | property | `pathRadiance` | `EvaluationResult` | descriptive-other: Value that stores spectral path radiance aligned to the configured spectral basis. | entity/value | none |
| 335 | property | `transmittance` | `EvaluationResult` | descriptive-other: Value that stores spectral transmittance aligned to the configured spectral basis. | entity/value | none |
| 338 | property | `viewRaySegment` | `EvaluationResult` | descriptive-other: Value that stores the geometry-resolved ray segment used for validation. | entity/value | none |
| 341 | property | `pathIntegrationPoints` | `EvaluationResult` | descriptive-other: Value that stores path integration points used for validation. | entity/value | none |

## `src/algorithm32/runtime/model/types.d.ts`

Source: [src/algorithm32/runtime/model/types.d.ts](../../../../../../src/algorithm32/runtime/model/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `SpectralModelDependencies` | `<module>` | descriptive-other: Type that supplies construction dependencies for the spectral component model. | entity/value | none |
| 4 | property | `basis` | `SpectralModelDependencies` | descriptive-other: Value that stores the accepted spectral basis for the facade configuration. | entity/value | none |
| 7 | property | `version` | `SpectralModelDependencies` | descriptive-other: Value that stores the facade-local spectral model version. | entity/value | none |
| 11 | interface | `SpectralModel` | `<module>` | descriptive-other: Contract that describes the public spectral-model surface consumed across Algorithm32. | entity/value | none |
| 13 | property | `basis` | `SpectralModel` | descriptive-other: Value that stores the canonical spectral basis. | entity/value | none |
| 15 | property | `wavelengths` | `SpectralModel` | descriptive-other: Value that stores the ordered unit-bearing channel centers. | entity/value | none |
| 17 | property | `channelCount` | `SpectralModel` | descriptive-other: Value that stores the active spectral channel count. | entity/value | none |
| 19 | property | `version` | `SpectralModel` | descriptive-other: Value that stores the facade-local model version. | entity/value | none |
| 25 | method | `getWavelength` | `SpectralModel` | call-this-method: Call this method to return one unit-bearing wavelength by channel index. | active-callable | params 1/1; returns tagged |
| 31 | method | `replaceBasis` | `SpectralModel` | call-this-method: Call this method to replace the complete accepted basis. | active-callable | params 1/1; returns tagged |
| 35 | type | `SharedModelDependencies` | `<module>` | descriptive-other: Type that supplies construction dependencies for the shared Algorithm32 aggregate model. | entity/value | none |
| 37 | property | `version` | `SharedModelDependencies` | descriptive-other: Value that stores the facade-local model version. | entity/value | none |
| 40 | property | `lightSource` | `SharedModelDependencies` | descriptive-other: Value that stores the configured light-source model. | entity/value | none |
| 43 | property | `atmosphere` | `SharedModelDependencies` | descriptive-other: Value that stores the configured atmosphere model. | entity/value | none |
| 46 | property | `geometry` | `SharedModelDependencies` | descriptive-other: Value that stores the configured geometry model. | entity/value | none |
| 49 | property | `spectralBasis` | `SharedModelDependencies` | descriptive-other: Value that stores the accepted spectral basis used to construct the spectral model. | entity/value | none |
| 53 | interface | `SharedModel` | `<module>` | descriptive-other: Contract that describes the public shared-model surface consumed by runtime collabora... | entity/value | none |
| 55 | property | `version` | `SharedModel` | descriptive-other: Value that stores the facade-local model version. | entity/value | none |
| 57 | property | `lightSource` | `SharedModel` | descriptive-other: Value that stores the configured light source. | entity/value | none |
| 59 | property | `atmosphere` | `SharedModel` | descriptive-other: Value that stores the configured atmosphere. | entity/value | none |
| 61 | property | `geometry` | `SharedModel` | descriptive-other: Value that stores the configured geometry. | entity/value | none |
| 63 | property | `spectral` | `SharedModel` | descriptive-other: Value that stores the canonical spectral model. | entity/value | none |

## `src/algorithm32/runtime/reference/types.d.ts`

Source: [src/algorithm32/runtime/reference/types.d.ts](../../../../../../src/algorithm32/runtime/reference/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ReferenceDependencies` | `<module>` | descriptive-other: Type that supplies construction dependencies for the CPU/reference algorithm executio... | entity/value | none |
| 4 | property | `model` | `ReferenceDependencies` | descriptive-other: Value that stores the facade-owned shared model consumed by reference evaluations. | entity/value | none |
| 7 | property | `scatteringCache` | `ReferenceDependencies` | descriptive-other: Value that stores an optional default cumulative CPU scattering cache for reference e... | entity/value | none |
| 10 | property | `executionOptions` | `ReferenceDependencies` | descriptive-other: Value that stores optional execution options from facade configuration. | entity/value | none |
| 13 | property | `calculator` | `ReferenceDependencies` | descriptive-other: Value that stores an optional calculator double for focused tests. | entity/value | none |
| 17 | interface | `ReferenceExecution` | `<module>` | descriptive-other: CPU/reference execution surface retained by the Algorithm32 facade. | entity/value | none |
| 19 | property | `model` | `ReferenceExecution` | descriptive-other: Facade-owned shared model consumed by reference evaluations. | entity/value | none |
| 22 | property | `calculator` | `ReferenceExecution` | descriptive-other: Shared spectral calculator used by reference evaluations. | entity/value | none |
| 29 | method | `evaluate` | `ReferenceExecution` | call-this-method: Call this method to evaluate spectral radiance and transmittance for one ray request. | active-callable | params 1/1; returns tagged |
| 32 | method | `dispose` | `ReferenceExecution` | call-this-method: Call this method to release resources owned by the reference execution collaborator. | active-callable | none |

## `src/algorithm32/runtime/rendering/three/types.d.ts`

Source: [src/algorithm32/runtime/rendering/three/types.d.ts](../../../../../../src/algorithm32/runtime/rendering/three/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `SceneInputCaptureVectorLike` | `<module>` | descriptive-other: Mutable coordinate candidate exposed by a scene-input capture camera. | entity/value | none |
| 4 | property | `x` | `SceneInputCaptureVectorLike` | descriptive-other: Optional x coordinate. | entity/value | none |
| 6 | property | `y` | `SceneInputCaptureVectorLike` | descriptive-other: Optional y coordinate. | entity/value | none |
| 8 | property | `z` | `SceneInputCaptureVectorLike` | descriptive-other: Optional z coordinate. | entity/value | none |
| 12 | type | `SceneInputCaptureVector` | `<module>` | descriptive-other: Mutable Three vector used at the scene-input camera boundary. | entity/value | none |
| 14 | property | `x` | `SceneInputCaptureVector` | descriptive-other: Current x coordinate. | entity/value | none |
| 16 | property | `y` | `SceneInputCaptureVector` | descriptive-other: Current y coordinate. | entity/value | none |
| 18 | property | `z` | `SceneInputCaptureVector` | descriptive-other: Current z coordinate. | entity/value | none |
| 27 | method | `set` | `SceneInputCaptureVector` | call-this-method: Call this method to replace all three coordinates. | active-callable | params 3/3; returns tagged |
| 31 | type | `SceneInputCaptureCamera` | `<module>` | descriptive-other: Three camera surface exposed to the scene-input capture pass. | entity/value | none |
| 33 | property | `position` | `SceneInputCaptureCamera` | descriptive-other: Optional camera position candidate used when no world-position method exists. | entity/value | none |
| 40 | method | `getWorldPosition` | `SceneInputCaptureCamera` | call-this-method: Call this method to write the camera world position when the camera provides it. | active-callable | params 1/1; returns tagged |
| 44 | type | `SceneInputCaptureObject` | `<module>` | descriptive-other: Three object surface traversed by the scene-input capture pass. | entity/value | none |
| 46 | property | `visible` | `SceneInputCaptureObject` | descriptive-other: Current object visibility. | entity/value | none |
| 48 | property | `userData` | `SceneInputCaptureObject` | descriptive-other: Renderer-neutral object metadata. | entity/value | none |
| 52 | type | `SceneInputCaptureObjectVisitor` | `<module>` | descriptive-other: Operation that visits one object exposed by scene-input traversal. | entity/value | none |
| 56 | callback | `<function-type>` | `SceneInputCaptureObjectVisitor` | called-by: Called by scene-input traversal to visit one exposed object. | called-by | params 1/1 |
| 59 | type | `SceneInputCaptureScene` | `<module>` | descriptive-other: Three scene surface exposed to the scene-input capture pass. | entity/value | none |
| 61 | property | `overrideMaterial` | `SceneInputCaptureScene` | descriptive-other: Current renderer override material. | entity/value | none |
| 63 | property | `background` | `SceneInputCaptureScene` | descriptive-other: Current renderer scene background. | entity/value | none |
| 70 | method | `traverse` | `SceneInputCaptureScene` | call-this-method: Call this method to visit scene objects when traversal is available. | active-callable | params 1/1 |
| 74 | type | `SceneInputCaptureColor` | `<module>` | descriptive-other: Opaque Three color object preserved across scene-input capture. | entity/value | none |
| 77 | type | `SceneInputCaptureTexture` | `<module>` | descriptive-other: Mutable Three texture exposed by the scene-input capture pass. | entity/value | none |
| 79 | property | `name` | `SceneInputCaptureTexture` | descriptive-other: Optional renderer diagnostic name. | entity/value | none |
| 81 | property | `generateMipmaps` | `SceneInputCaptureTexture` | descriptive-other: Optional mipmap-generation flag. | entity/value | none |
| 85 | type | `SceneInputCaptureRenderTarget` | `<module>` | descriptive-other: Three render-target surface used by the scene-input capture pass. | entity/value | none |
| 87 | property | `texture` | `SceneInputCaptureRenderTarget` | descriptive-other: Value that renders-target texture exposed to runtime bindings. | entity/value | none |
| 89 | property | `width` | `SceneInputCaptureRenderTarget` | descriptive-other: Current target width in pixels. | entity/value | none |
| 91 | property | `height` | `SceneInputCaptureRenderTarget` | descriptive-other: Current target height in pixels. | entity/value | none |
| 99 | method | `setSize` | `SceneInputCaptureRenderTarget` | call-this-method: Call this method to resize the target when the renderer provides it. | active-callable | params 2/2 |
| 101 | method | `dispose` | `SceneInputCaptureRenderTarget` | call-this-method: Call this method to release the target when disposal is available. | active-callable | none |
| 105 | type | `SceneInputCaptureRenderer` | `<module>` | descriptive-other: Three renderer surface exposed to the scene-input capture pass. | entity/value | none |
| 112 | method | `setRenderTarget` | `SceneInputCaptureRenderer` | call-this-method: Call this method to select the active render target. | active-callable | params 1/1 |
| 120 | method | `render` | `SceneInputCaptureRenderer` | call-this-method: Call this method to render the configured scene and camera. | active-callable | params 2/2 |
| 125 | method | `getRenderTarget` | `SceneInputCaptureRenderer` | call-this-method: Call this method to return the current render target when available. | active-callable | returns tagged |
| 132 | method | `getClearColor` | `SceneInputCaptureRenderer` | call-this-method: Call this method to copy the current clear color when available. | active-callable | params 1/1; returns tagged |
| 137 | method | `getClearAlpha` | `SceneInputCaptureRenderer` | call-this-method: Call this method to return the current clear alpha when available. | active-callable | returns tagged |
| 145 | method | `setClearColor` | `SceneInputCaptureRenderer` | call-this-method: Call this method to replace the clear color and alpha when available. | active-callable | params 2/2 |
| 154 | method | `clear` | `SceneInputCaptureRenderer` | call-this-method: Call this method to clear selected renderer buffers when available. | active-callable | params 3/3 |
| 158 | type | `SceneInputCaptureThreeNamespace` | `<module>` | descriptive-other: Caller-visible Three namespace boundary for scene-input capture construction. | entity/value | none |
| 160 | property | `WebGLRenderTarget` | `SceneInputCaptureThreeNamespace` | descriptive-other: WebGL render-target constructor runtime value. | entity/value | none |
| 162 | property | `ShaderMaterial` | `SceneInputCaptureThreeNamespace` | descriptive-other: Shader-material constructor runtime value. | entity/value | none |
| 164 | property | `Vector3` | `SceneInputCaptureThreeNamespace` | descriptive-other: Three-dimensional vector constructor runtime value. | entity/value | none |
| 166 | property | `Color` | `SceneInputCaptureThreeNamespace` | descriptive-other: Optional color constructor runtime value. | entity/value | none |
| 168 | property | `RGBAFormat` | `SceneInputCaptureThreeNamespace` | descriptive-other: RGBA texture-format runtime value. | entity/value | none |
| 170 | property | `UnsignedByteType` | `SceneInputCaptureThreeNamespace` | descriptive-other: Unsigned-byte texture-type runtime value. | entity/value | none |
| 172 | property | `NearestFilter` | `SceneInputCaptureThreeNamespace` | descriptive-other: Nearest-neighbor texture-filter runtime value. | entity/value | none |
| 176 | type | `SceneInputCaptureConfiguration` | `<module>` | descriptive-other: Construction data for the renderer-produced scene-input capture pass. | entity/value | none |
| 178 | property | `THREE` | `SceneInputCaptureConfiguration` | descriptive-other: Caller-provided Three namespace boundary. | entity/value | none |
| 181 | property | `scene` | `SceneInputCaptureConfiguration` | descriptive-other: Live scene rendered before the Algorithm32 pass. | entity/value | none |
| 184 | property | `camera` | `SceneInputCaptureConfiguration` | descriptive-other: Live camera used to render the scene. | entity/value | none |
| 187 | property | `viewportSize` | `SceneInputCaptureConfiguration` | descriptive-other: Unit-bearing capture viewport dimensions. | entity/value | none |
| 190 | property | `sceneDepthMax` | `SceneInputCaptureConfiguration` | descriptive-other: Largest representable scene-hit distance. | entity/value | none |
| 193 | property | `sceneScale` | `SceneInputCaptureConfiguration` | descriptive-other: Renderer scene-to-physical scale. | entity/value | none |
| 196 | property | `performanceCallback` | `SceneInputCaptureConfiguration` | descriptive-other: Optional performance callback for capture passes. | entity/value | none |
| 199 | property | `performanceSampleIntervalFrames` | `SceneInputCaptureConfiguration` | descriptive-other: Pass-invocation cadence used for performance samples. | entity/value | none |
| 202 | property | `performanceMaxPendingQueries` | `SceneInputCaptureConfiguration` | descriptive-other: Maximum unresolved GPU queries retained per capture pass. | entity/value | none |
| 206 | type | `SceneInputCaptureBindingValues` | `<module>` | descriptive-other: Runtime binding values produced by the scene-input capture pass. | entity/value | none |
| 208 | property | `runtime.sceneDepthTexture` | `SceneInputCaptureBindingValues` | descriptive-other: Packed depth texture consumed by the runtime shader. | entity/value | none |
| 211 | property | `runtime.sceneHitTexture` | `SceneInputCaptureBindingValues` | descriptive-other: Explicit hit-mask texture consumed by the runtime shader. | entity/value | none |
| 214 | property | `runtime.viewportSize` | `SceneInputCaptureBindingValues` | descriptive-other: Viewport dimensions consumed by the runtime shader. | entity/value | none |
| 223 | type | `SceneInputCaptureStatus` | `<module>` | descriptive-other: Scene-input capture resource lifecycle status. - **"ready"** - Capture resources are ... | entity/value | union bullets 2/2 |
| 226 | type | `SceneInputCaptureDiagnostics` | `<module>` | descriptive-other: Runtime diagnostics for the renderer-owned scene-input capture pass. | entity/value | none |
| 228 | property | `kind` | `SceneInputCaptureDiagnostics` | descriptive-other: Diagnostic kind. | entity/value | none |
| 230 | property | `status` | `SceneInputCaptureDiagnostics` | descriptive-other: Resource lifecycle status. | entity/value | none |
| 232 | property | `capturePolicy` | `SceneInputCaptureDiagnostics` | descriptive-other: Renderer capture policy. | entity/value | none |
| 234 | property | `sceneDepthEncoding` | `SceneInputCaptureDiagnostics` | descriptive-other: Scene-depth texture encoding. | entity/value | none |
| 236 | property | `sceneHitMaskEncoding` | `SceneInputCaptureDiagnostics` | descriptive-other: Scene-hit mask encoding. | entity/value | none |
| 238 | property | `sceneDepthMax` | `SceneInputCaptureDiagnostics` | descriptive-other: Largest representable scene-hit distance. | entity/value | none |
| 240 | property | `sceneScale` | `SceneInputCaptureDiagnostics` | descriptive-other: Renderer scene-to-physical scale. | entity/value | none |
| 242 | property | `viewportSize` | `SceneInputCaptureDiagnostics` | descriptive-other: Current unit-bearing viewport size. | entity/value | none |
| 244 | property | `frameCount` | `SceneInputCaptureDiagnostics` | descriptive-other: Completed capture-frame count. | entity/value | none |
| 248 | interface | `SceneInputCapture` | `<module>` | descriptive-other: Renderer-owned scene-input capture surface. | entity/value | none |
| 250 | property | `depthTexture` | `SceneInputCapture` | descriptive-other: Current depth texture. | entity/value | none |
| 252 | property | `hitTexture` | `SceneInputCapture` | descriptive-other: Current explicit hit-mask texture. | entity/value | none |
| 254 | property | `viewportSize` | `SceneInputCapture` | descriptive-other: Current unit-bearing viewport size. | entity/value | none |
| 259 | method | `bindingValues` | `SceneInputCapture` | call-this-method: Call this method to return runtime binding values for the captured inputs. | active-callable | returns tagged |
| 265 | method | `setSize` | `SceneInputCapture` | call-this-method: Call this method to resize owned targets. | active-callable | params 2/2 |
| 270 | method | `capture` | `SceneInputCapture` | call-this-method: Call this method to capture the configured scene inputs. | active-callable | params 1/1 |
| 275 | method | `render` | `SceneInputCapture` | call-this-method: Call this method to render the capture operation. | active-callable | params 1/1 |
| 280 | method | `getDiagnostics` | `SceneInputCapture` | call-this-method: Call this method to return implementation diagnostics. | active-callable | returns tagged |
| 282 | method | `dispose` | `SceneInputCapture` | call-this-method: Call this method to release owned resources. | active-callable | none |
| 286 | type | `ShaderRuntimeUniform` | `<module>` | descriptive-other: Mutable runtime uniform value installed on a Three shader pass. | entity/value | none |
| 288 | property | `value` | `ShaderRuntimeUniform` | descriptive-other: Current shader-compatible value. | entity/value | none |
| 292 | type | `ShaderRuntimeUniformMap` | `<module>` | descriptive-other: Runtime uniform map keyed by GLSL uniform name or cache value key. | entity/value | none |
| 295 | type | `ShaderRuntimeComposerPassOperation` | `<module>` | descriptive-other: Operation that adds or removes one pass at a renderer-composer boundary. | entity/value | none |
| 299 | callback | `<function-type>` | `ShaderRuntimeComposerPassOperation` | called-by: Called by runtime installation or disposal to update one composer pass. | called-by | params 1/1 |
| 302 | type | `ShaderRuntimeComposer` | `<module>` | descriptive-other: Optional Three composer surfaces used to install and remove runtime passes. | entity/value | none |
| 310 | property | `addPass` | `ShaderRuntimeComposer` | descriptive-other: Value that appends a renderer pass. | entity/value | none |
| 318 | property | `removePass` | `ShaderRuntimeComposer` | descriptive-other: Value that removes a renderer pass. | entity/value | none |
| 320 | property | `passes` | `ShaderRuntimeComposer` | descriptive-other: Mutable ordered renderer passes when no removal method is available. | entity/value | none |
| 324 | type | `ShaderRuntimeArtifact` | `<module>` | descriptive-other: Type for an installed runtime shader artifact. | entity/value | none |
| 331 | method | `prepare` | `ShaderRuntimeArtifact` | call-this-method: Call this method to prepare the installed program for its first render. | active-callable | params 1/1; returns tagged |
| 338 | method | `dispose` | `ShaderRuntimeArtifact` | call-this-method: Call this method to dispose the privately owned installed pass and scene-input resour... | active-callable | none |
| 345 | method | `getDiagnostics` | `ShaderRuntimeArtifact` | call-this-method: Call this method to return internal runtime diagnostics. | active-callable | returns tagged |
| 349 | type | `ShaderRuntimeUniformRefresher` | `<module>` | descriptive-other: Operation that refreshes runtime uniforms from caller-owned live bindings. | entity/value | none |
| 350 | callback | `<function-type>` | `ShaderRuntimeUniformRefresher` | called-by: Called by the runtime pass to refresh uniforms from live bindings. | called-by | none |
| 353 | type | `ShaderRuntimePassConfiguration` | `<module>` | descriptive-other: Type that supplies construction data for the runtime shader pass. | entity/value | none |
| 357 | property | `THREE` | `ShaderRuntimePassConfiguration` | descriptive-other: Caller-provided Three namespace boundary. | entity/value | none |
| 360 | property | `fragmentShaderSource` | `ShaderRuntimePassConfiguration` | descriptive-other: Value that stores the fragment shader source to install. | entity/value | none |
| 363 | property | `sourceHash` | `ShaderRuntimePassConfiguration` | descriptive-other: Value that stores the fragment source hash. | entity/value | none |
| 366 | property | `uniforms` | `ShaderRuntimePassConfiguration` | descriptive-other: Value that stores pass uniforms. | entity/value | none |
| 369 | property | `viewportSize` | `ShaderRuntimePassConfiguration` | descriptive-other: Value that stores the accepted unit-bearing viewport dimensions. | entity/value | none |
| 372 | property | `sceneInputCapture` | `ShaderRuntimePassConfiguration` | descriptive-other: Value that stores optional preceding renderer-produced scene input texture provider. | entity/value | none |
| 375 | property | `refreshUniformValues` | `ShaderRuntimePassConfiguration` | descriptive-other: Refresh uniforms backed by the caller-owned live binding record. | entity/value | none |
| 378 | property | `logger` | `ShaderRuntimePassConfiguration` | descriptive-other: Value that stores an optional runtime logger. | entity/value | none |
| 381 | property | `performanceCallback` | `ShaderRuntimePassConfiguration` | descriptive-other: Value that stores an optional performance callback for the runtime pass. | entity/value | none |
| 384 | property | `performanceSampleIntervalFrames` | `ShaderRuntimePassConfiguration` | descriptive-other: Value that stores the pass invocation cadence used for performance samples. | entity/value | none |
| 387 | property | `performanceMaxPendingQueries` | `ShaderRuntimePassConfiguration` | descriptive-other: Value that stores the maximum unresolved GPU queries retained by the runtime pass. | entity/value | none |
| 391 | type | `ShaderRuntimePassTexture` | `<module>` | descriptive-other: Mutable Three texture surface exposed at the runtime-pass composer boundary. | entity/value | none |
| 393 | property | `name` | `ShaderRuntimePassTexture` | descriptive-other: Optional renderer diagnostic name. | entity/value | none |
| 397 | type | `ShaderRuntimePassRenderTarget` | `<module>` | descriptive-other: Three render-target surface exposed at the runtime-pass composer boundary. | entity/value | none |
| 399 | property | `texture` | `ShaderRuntimePassRenderTarget` | descriptive-other: Optional texture or texture array supplying scene color or renderer diagnostics. | entity/value | none |
| 403 | type | `ShaderRuntimePassRenderer` | `<module>` | descriptive-other: Three renderer surface exposed to the runtime shader pass. | entity/value | none |
| 405 | property | `autoClearColor` | `ShaderRuntimePassRenderer` | descriptive-other: Renderer color-buffer auto-clear flag. | entity/value | none |
| 407 | property | `autoClearDepth` | `ShaderRuntimePassRenderer` | descriptive-other: Renderer depth-buffer auto-clear flag. | entity/value | none |
| 409 | property | `autoClearStencil` | `ShaderRuntimePassRenderer` | descriptive-other: Renderer stencil-buffer auto-clear flag. | entity/value | none |
| 417 | method | `compileAsync` | `ShaderRuntimePassRenderer` | call-this-method: Call this method to compile the private runtime scene and camera asynchronously when ... | active-callable | params 2/2; returns tagged |
| 425 | method | `compile` | `ShaderRuntimePassRenderer` | call-this-method: Call this method to compile the private runtime scene and camera. | active-callable | params 2/2 |
| 432 | method | `setRenderTarget` | `ShaderRuntimePassRenderer` | call-this-method: Call this method to select the active render target when available. | active-callable | params 1/1 |
| 441 | method | `clear` | `ShaderRuntimePassRenderer` | call-this-method: Call this method to clear selected renderer buffers when available. | active-callable | params 3/3 |
| 449 | method | `render` | `ShaderRuntimePassRenderer` | call-this-method: Call this method to render the private runtime scene and camera when available. | active-callable | params 2/2 |
| 453 | type | `ShaderRuntimePassThreeNamespace` | `<module>` | descriptive-other: Caller-visible Three namespace boundary for runtime-pass construction. | entity/value | none |
| 455 | property | `RawShaderMaterial` | `ShaderRuntimePassThreeNamespace` | descriptive-other: Raw shader-material constructor runtime value. | entity/value | none |
| 457 | property | `PlaneGeometry` | `ShaderRuntimePassThreeNamespace` | descriptive-other: Plane-geometry constructor runtime value. | entity/value | none |
| 459 | property | `Mesh` | `ShaderRuntimePassThreeNamespace` | descriptive-other: Mesh constructor runtime value. | entity/value | none |
| 461 | property | `Scene` | `ShaderRuntimePassThreeNamespace` | descriptive-other: Scene constructor runtime value. | entity/value | none |
| 463 | property | `OrthographicCamera` | `ShaderRuntimePassThreeNamespace` | descriptive-other: Orthographic-camera constructor runtime value. | entity/value | none |
| 465 | property | `GLSL3` | `ShaderRuntimePassThreeNamespace` | descriptive-other: Optional GLSL 3 renderer constant. | entity/value | none |

## `src/algorithm32/runtime/rendering/three/types/SceneInputCapture.d.ts`

Source: [src/algorithm32/runtime/rendering/three/types/SceneInputCapture.d.ts](../../../../../../src/algorithm32/runtime/rendering/three/types/SceneInputCapture.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `SceneInputCaptureMaterial` | `<module>` | descriptive-other: Private override-material surface owned by the scene-input capture pass. | entity/value | none |
| 4 | property | `depthTest` | `SceneInputCaptureMaterial` | descriptive-other: Material depth-test flag. | entity/value | none |
| 6 | property | `depthWrite` | `SceneInputCaptureMaterial` | descriptive-other: Material depth-write flag. | entity/value | none |
| 8 | property | `uniforms` | `SceneInputCaptureMaterial` | descriptive-other: Mutable shader uniforms keyed by GLSL name. | entity/value | none |
| 12 | property | `value` | `SceneInputCaptureMaterial` | descriptive-other: Current shader-compatible value. | entity/value | none |
| 16 | method | `dispose` | `SceneInputCaptureMaterial` | call-this-method: Call this method to release the material when disposal is available. | active-callable | none |
| 20 | type | `SceneInputCaptureResourceNamespace` | `<module>` | descriptive-other: Private Three resource-construction surface owned by the scene-input capture pass. | entity/value | none |
| 22 | property | `WebGLRenderTarget` | `SceneInputCaptureResourceNamespace` | descriptive-other: WebGL render-target constructor used for capture textures. | entity/value | none |
| 28 | property | `ShaderMaterial` | `SceneInputCaptureResourceNamespace` | descriptive-other: Shader-material constructor used for scene overrides. | entity/value | none |
| 30 | property | `Vector3` | `SceneInputCaptureResourceNamespace` | descriptive-other: Three-dimensional vector constructor used for camera position. | entity/value | none |
| 32 | property | `Color` | `SceneInputCaptureResourceNamespace` | descriptive-other: Optional color constructor used to preserve renderer clear state. | entity/value | none |
| 34 | property | `RGBAFormat` | `SceneInputCaptureResourceNamespace` | descriptive-other: RGBA texture-format runtime value. | entity/value | none |
| 36 | property | `UnsignedByteType` | `SceneInputCaptureResourceNamespace` | descriptive-other: Unsigned-byte texture-type runtime value. | entity/value | none |
| 38 | property | `NearestFilter` | `SceneInputCaptureResourceNamespace` | descriptive-other: Nearest-neighbor texture-filter runtime value. | entity/value | none |
| 42 | type | `SceneInputCaptureRendererClearState` | `<module>` | descriptive-other: Renderer clear-state snapshot preserved across scene-input capture. | entity/value | none |
| 44 | property | `color` | `SceneInputCaptureRendererClearState` | descriptive-other: Renderer clear color. | entity/value | none |
| 46 | property | `alpha` | `SceneInputCaptureRendererClearState` | descriptive-other: Renderer clear alpha. | entity/value | none |
| 50 | type | `SceneInputCaptureVisibilitySnapshot` | `<module>` | descriptive-other: Visibility snapshot for one scene object excluded from capture. | entity/value | none |
| 52 | property | `object` | `SceneInputCaptureVisibilitySnapshot` | descriptive-other: Scene object hidden during capture. | entity/value | none |
| 54 | property | `visible` | `SceneInputCaptureVisibilitySnapshot` | descriptive-other: Object visibility before capture. | entity/value | none |

## `src/algorithm32/runtime/rendering/three/types/ShaderRuntimeInstaller.d.ts`

Source: [src/algorithm32/runtime/rendering/three/types/ShaderRuntimeInstaller.d.ts](../../../../../../src/algorithm32/runtime/rendering/three/types/ShaderRuntimeInstaller.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ShaderRuntimeBindingValues` | `<module>` | descriptive-other: Accepted runtime binding values keyed by provider-neutral value key. | entity/value | none |
| 5 | type | `ShaderRuntimeCameraCandidate` | `<module>` | descriptive-other: Camera position surface used while resolving geometry-owned scene depth. | entity/value | none |
| 7 | property | `position` | `ShaderRuntimeCameraCandidate` | descriptive-other: Optional candidate position coordinates. | entity/value | none |
| 9 | property | `x` | `ShaderRuntimeCameraCandidate` | descriptive-other: Candidate x coordinate. | entity/value | none |
| 11 | property | `y` | `ShaderRuntimeCameraCandidate` | descriptive-other: Candidate y coordinate. | entity/value | none |
| 13 | property | `z` | `ShaderRuntimeCameraCandidate` | descriptive-other: Candidate z coordinate. | entity/value | none |
| 18 | type | `ShaderRuntimeSceneInputCaptureConfig` | `<module>` | descriptive-other: Normalized scene-input capture configuration resolved during runtime installation. | entity/value | none |
| 20 | property | `viewportSize` | `ShaderRuntimeSceneInputCaptureConfig` | descriptive-other: Unit-bearing viewport dimensions. | entity/value | none |
| 22 | property | `sceneDepthMax` | `ShaderRuntimeSceneInputCaptureConfig` | descriptive-other: Largest representable scene-hit distance. | entity/value | none |
| 24 | property | `sceneScale` | `ShaderRuntimeSceneInputCaptureConfig` | descriptive-other: Renderer scene-to-physical scale. | entity/value | none |
| 28 | type | `ShaderRuntimeSceneInputBindings` | `<module>` | descriptive-other: Renderer-produced scene-input capture state and binding patch. | entity/value | none |
| 30 | property | `sceneInputCapture` | `ShaderRuntimeSceneInputBindings` | descriptive-other: Optional capture pass created for missing renderer inputs. | entity/value | none |
| 32 | property | `bindingValues` | `ShaderRuntimeSceneInputBindings` | descriptive-other: Renderer-produced binding values keyed by provider-neutral value key. | entity/value | none |

## `src/algorithm32/runtime/rendering/three/types/ShaderRuntimePass.d.ts`

Source: [src/algorithm32/runtime/rendering/three/types/ShaderRuntimePass.d.ts](../../../../../../src/algorithm32/runtime/rendering/three/types/ShaderRuntimePass.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ShaderRuntimePassMaterial` | `<module>` | descriptive-other: Private raw shader-material surface owned by the runtime pass. | entity/value | none |
| 4 | method | `dispose` | `ShaderRuntimePassMaterial` | call-this-method: Call this method to release the material when disposal is available. | active-callable | none |
| 8 | type | `ShaderRuntimePassGeometry` | `<module>` | descriptive-other: Private fullscreen geometry surface owned by the runtime pass. | entity/value | none |
| 10 | method | `dispose` | `ShaderRuntimePassGeometry` | call-this-method: Call this method to release the geometry when disposal is available. | active-callable | none |
| 14 | type | `ShaderRuntimePassMesh` | `<module>` | descriptive-other: Private fullscreen mesh object owned by the runtime pass. | entity/value | none |
| 17 | type | `ShaderRuntimePassScene` | `<module>` | descriptive-other: Private scene surface owned by the runtime pass. | entity/value | none |
| 24 | method | `add` | `ShaderRuntimePassScene` | call-this-method: Call this method to attach the fullscreen mesh. | active-callable | params 1/1 |
| 28 | type | `ShaderRuntimePassCamera` | `<module>` | descriptive-other: Private orthographic camera object owned by the runtime pass. | entity/value | none |
| 31 | type | `ShaderRuntimePassResourceNamespace` | `<module>` | descriptive-other: Private Three resource-construction surface owned by the runtime pass. | entity/value | none |
| 33 | property | `RawShaderMaterial` | `ShaderRuntimePassResourceNamespace` | descriptive-other: Raw shader-material constructor used for the runtime program. | entity/value | none |
| 35 | property | `PlaneGeometry` | `ShaderRuntimePassResourceNamespace` | descriptive-other: Plane-geometry constructor used for the fullscreen surface. | entity/value | none |
| 37 | property | `Mesh` | `ShaderRuntimePassResourceNamespace` | descriptive-other: Mesh constructor used for the fullscreen draw. | entity/value | none |
| 42 | property | `Scene` | `ShaderRuntimePassResourceNamespace` | descriptive-other: Scene constructor used for the private fullscreen draw. | entity/value | none |
| 44 | property | `OrthographicCamera` | `ShaderRuntimePassResourceNamespace` | descriptive-other: Orthographic-camera constructor used for the private fullscreen draw. | entity/value | none |
| 53 | property | `GLSL3` | `ShaderRuntimePassResourceNamespace` | descriptive-other: Optional GLSL 3 renderer constant. | entity/value | none |

## `src/algorithm32/runtime/rendering/types.d.ts`

Source: [src/algorithm32/runtime/rendering/types.d.ts](../../../../../../src/algorithm32/runtime/rendering/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ShaderBuilderDependencies` | `<module>` | descriptive-other: Construction dependencies for the runtime shader build coordinator. | entity/value | none |
| 4 | property | `model` | `ShaderBuilderDependencies` | descriptive-other: Facade-owned shared model consumed by shader builds. | entity/value | none |
| 7 | property | `assembler` | `ShaderBuilderDependencies` | descriptive-other: Optional deterministic shader assembler collaborator. | entity/value | none |
| 10 | property | `transport` | `ShaderBuilderDependencies` | descriptive-other: Optional core transport implementation. | entity/value | none |
| 14 | interface | `ShaderBuildCoordinator` | `<module>` | descriptive-other: Runtime shader-build coordination surface retained by the Algorithm32 facade. | entity/value | none |
| 16 | property | `model` | `ShaderBuildCoordinator` | descriptive-other: Facade-owned shared model consumed by shader builds. | entity/value | none |
| 23 | method | `build` | `ShaderBuildCoordinator` | call-this-method: Call this method to build runtime shader artifacts for one attachment request. | active-callable | params 1/1; returns tagged |
| 29 | method | `refreshConfig` | `ShaderBuildCoordinator` | call-this-method: Call this method to retain a new accepted facade configuration snapshot. | active-callable | params 1/1 |
| 32 | method | `dispose` | `ShaderBuildCoordinator` | call-this-method: Call this method to terminate the shader-build coordinator lifecycle. | active-callable | none |
| 36 | type | `ShaderAssemblyPreparerDependencies` | `<module>` | descriptive-other: Construction dependencies for deterministic shader assembly preparation. | entity/value | none |
| 38 | property | `model` | `ShaderAssemblyPreparerDependencies` | descriptive-other: Facade-owned shared model whose providers contribute shader declarations. | entity/value | none |
| 41 | property | `assembler` | `ShaderAssemblyPreparerDependencies` | descriptive-other: Deterministic assembler for accepted provider contributions. | entity/value | none |
| 44 | property | `transport` | `ShaderAssemblyPreparerDependencies` | descriptive-other: Core transport provider for automatic configured-model assembly. | entity/value | none |
| 48 | type | `ShaderBuildRequest` | `<module>` | descriptive-other: Accepted request for runtime shader artifacts. | entity/value | none |
| 50 | property | `setup` | `ShaderBuildRequest` | descriptive-other: Caller-owned Three runtime attachment request. | entity/value | none |
| 53 | property | `config` | `ShaderBuildRequest` | descriptive-other: Accepted facade configuration snapshot. | entity/value | none |
| 56 | property | `contributions` | `ShaderBuildRequest` | descriptive-other: Optional owner-supplied shader contributions. | entity/value | none |
| 59 | property | `mainRequiredSymbols` | `ShaderBuildRequest` | descriptive-other: Optional symbols required by the shared main skeleton. | entity/value | none |
| 62 | property | `systemProvidedSymbols` | `ShaderBuildRequest` | descriptive-other: Optional symbols supplied by the runtime skeleton. | entity/value | none |
| 65 | property | `bindingValues` | `ShaderBuildRequest` | descriptive-other: Optional initial runtime binding values indexed by value key. | entity/value | none |
| 68 | property | `previousBuildResult` | `ShaderBuildRequest` | descriptive-other: Currently installed result considered for exact cache reuse. | entity/value | none |
| 71 | property | `signal` | `ShaderBuildRequest` | descriptive-other: Cancellation signal for source-owned cache construction. | entity/value | none |
| 75 | type | `ShaderBuildResult` | `<module>` | descriptive-other: Runtime shader artifacts produced for facade attachment. | entity/value | none |
| 77 | property | `modelVersion` | `ShaderBuildResult` | descriptive-other: Shared model version used while building the artifacts. | entity/value | none |
| 80 | property | `setup` | `ShaderBuildResult` | descriptive-other: Setup request accepted by the builder. | entity/value | none |
| 83 | property | `assembly` | `ShaderBuildResult` | descriptive-other: Optional accepted shader assembly. | entity/value | none |
| 86 | property | `bindingRequirements` | `ShaderBuildResult` | descriptive-other: Optional sorted shader binding requirements. | entity/value | none |
| 89 | property | `runtime` | `ShaderBuildResult` | descriptive-other: Optional installed runtime pass state. | entity/value | none |
| 92 | property | `cacheController` | `ShaderBuildResult` | descriptive-other: Source-created controller owned by this runtime attachment. | entity/value | none |
| 95 | property | `cache` | `ShaderBuildResult` | descriptive-other: Complete GPU cache published to this attachment. | entity/value | none |
| 98 | property | `cacheControllerIdentity` | `ShaderBuildResult` | descriptive-other: Exact source-controller ownership identity. | entity/value | none |
| 101 | property | `diagnostics` | `ShaderBuildResult` | descriptive-other: Value that builds diagnostics. | entity/value | none |
| 105 | type | `ShaderCacheControllerIdentity` | `<module>` | descriptive-other: Exact ownership inputs for one runtime source-cache controller. | entity/value | none |
| 107 | property | `source` | `ShaderCacheControllerIdentity` | descriptive-other: Live source owner whose controller can be reused. | entity/value | none |
| 109 | property | `backend` | `ShaderCacheControllerIdentity` | descriptive-other: Concrete backend instance across which cache resources never move. | entity/value | none |
| 111 | property | `scheduler` | `ShaderCacheControllerIdentity` | descriptive-other: Optional scheduler owned by the runtime attachment. | entity/value | none |
| 115 | type | `ShaderBuildContext` | `<module>` | descriptive-other: Setup-time lifecycle context for automatic configured-model assembly. | entity/value | none |
| 117 | property | `automaticAssembly` | `ShaderBuildContext` | descriptive-other: Whether the configured model supplies automatic assembly inputs. | entity/value | none |
| 120 | property | `cacheController` | `ShaderBuildContext` | descriptive-other: Controller selected for this runtime attachment. | entity/value | none |
| 123 | property | `cache` | `ShaderBuildContext` | descriptive-other: Optional built cache used as a shader contribution provider. | entity/value | none |
| 126 | property | `cacheControllerIdentity` | `ShaderBuildContext` | descriptive-other: Exact inputs used to decide source-controller reuse. | entity/value | none |
| 129 | property | `createdCacheController` | `ShaderBuildContext` | descriptive-other: Whether this build created and therefore owns a new controller. | entity/value | none |
| 132 | property | `mainRequiredSymbols` | `ShaderBuildContext` | descriptive-other: Default main symbols for automatic assembly. | entity/value | none |

## `src/algorithm32/transport/cache/types.d.ts`

Source: [src/algorithm32/transport/cache/types.d.ts](../../../../../../src/algorithm32/transport/cache/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | type | `CacheTransportData` | `<module>` | descriptive-other: Carry one geometry-resolved transport kernel in the selected production logical shape... | entity/value | none |
| 7 | property | `queryCount` | `CacheTransportData` | descriptive-other: Value that stores the number of position-major output queries. | entity/value | none |
| 9 | property | `tapCount` | `CacheTransportData` | descriptive-other: Value that stores the fixed packed-tap capacity of every query. | entity/value | none |
| 11 | property | `sources` | `CacheTransportData` | descriptive-other: Value that stores direction index, position index, and active flag for every tap. | entity/value | none |
| 13 | property | `coefficients` | `CacheTransportData` | descriptive-other: Value that stores spectral T * ds * interpolation coefficients for every tap. | entity/value | none |
| 17 | interface | `CacheConstructionDomains` | `<module>` | descriptive-other: Contract that exposes one coherent executable construction lattice. | entity/value | none |
| 19 | property | `id` | `CacheConstructionDomains` | descriptive-other: Value that identifies the exact construction-domain selection. | entity/value | none |
| 21 | property | `positionDomain` | `CacheConstructionDomains` | descriptive-other: Value that stores the executable position domain. | entity/value | none |
| 23 | property | `positionNodes` | `CacheConstructionDomains` | descriptive-other: Value that stores executable ordered position nodes. | entity/value | none |
| 25 | property | `positionCount` | `CacheConstructionDomains` | descriptive-other: Value that stores the executable position extent. | entity/value | none |
| 27 | property | `incomingDirectionDomain` | `CacheConstructionDomains` | descriptive-other: Value that stores the executable incoming-radiance direction domain. | entity/value | none |
| 29 | property | `incomingUnitVectors` | `CacheConstructionDomains` | descriptive-other: Value that stores executable incoming-radiance directions. | entity/value | none |
| 31 | property | `incomingIntegrationWeights` | `CacheConstructionDomains` | descriptive-other: Value that stores one integration weight per incoming direction. | entity/value | none |
| 33 | property | `incomingDirectionCount` | `CacheConstructionDomains` | descriptive-other: Value that stores the executable incoming-direction extent. | entity/value | none |
| 35 | property | `outgoingDirectionDomain` | `CacheConstructionDomains` | descriptive-other: Value that stores the executable outgoing-scattering direction domain. | entity/value | none |
| 37 | property | `outgoingUnitVectors` | `CacheConstructionDomains` | descriptive-other: Value that stores executable outgoing-scattering directions. | entity/value | none |
| 39 | property | `outgoingDirectionCount` | `CacheConstructionDomains` | descriptive-other: Value that stores the executable outgoing-direction extent. | entity/value | none |
| 45 | method | `resolveOutgoingDirectionStencil` | `CacheConstructionDomains` | call-this-method: Call this method to resolve one source-local direction through the selected outgoing ... | active-callable | params 1/1; returns tagged |
| 49 | type | `CacheTransportDataRequest` | `<module>` | descriptive-other: Type that supplies physical collaborators for geometry-owned transport packing. | entity/value | none |
| 51 | property | `atmosphere` | `CacheTransportDataRequest` | descriptive-other: Value that supplies atmosphere-owned extinction sampling. | entity/value | none |
| 53 | property | `domains` | `CacheTransportDataRequest` | descriptive-other: Value that supplies the source-selected executable construction lattice. | entity/value | none |
| 55 | property | `directionToSource` | `CacheTransportDataRequest` | descriptive-other: Value that supplies the source-owned physical direction toward the source. | entity/value | none |
| 57 | property | `intervalCount` | `CacheTransportDataRequest` | descriptive-other: Value that supplies the accepted construction path interval count. | entity/value | none |
| 61 | interface | `CacheTransportDataProvider` | `<module>` | descriptive-other: Contract that supplies geometry-resolved packed transport data to a source-owned plan. | entity/value | none |
| 66 | method | `createTransportData` | `CacheTransportDataProvider` | call-this-method: Call this method to create transport data. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/transport/cache/types/CacheOperations.d.ts`

Source: [src/algorithm32/transport/cache/types/CacheOperations.d.ts](../../../../../../src/algorithm32/transport/cache/types/CacheOperations.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `CacheOperations` | `<module>` | descriptive-other: Cache operations object. | entity/value | none |
| 7 | method | `createCacheModule` | `CacheOperations` | call-this-method: Call this method to create cache module. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/transport/later-order-scattering-density.d.ts`

Source: [src/algorithm32/transport/later-order-scattering-density.d.ts](../../../../../../src/algorithm32/transport/later-order-scattering-density.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | function | `createPhysicalLaterOrderScatteringKernel` | `<module>` | call-this-method: Call this function to create the selected physical L(k-1)-to-Jk kernel. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/transport/spectral/types.d.ts`

Source: [src/algorithm32/transport/spectral/types.d.ts](../../../../../../src/algorithm32/transport/spectral/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `SpectralCalculatorDependencies` | `<module>` | descriptive-other: Type that supplies construction dependencies for the shared spectral calculator. | entity/value | none |
| 4 | property | `geometry` | `SpectralCalculatorDependencies` | descriptive-other: Value that stores the configured geometry model. | entity/value | none |
| 7 | property | `atmosphere` | `SpectralCalculatorDependencies` | descriptive-other: Value that stores the configured atmosphere model. | entity/value | none |
| 10 | property | `lightSource` | `SpectralCalculatorDependencies` | descriptive-other: Value that stores the configured light-source model. | entity/value | none |
| 13 | property | `spectralBasis` | `SpectralCalculatorDependencies` | descriptive-other: Value that stores the active spectral basis. | entity/value | none |
| 16 | property | `executionOptions` | `SpectralCalculatorDependencies` | descriptive-other: Value that stores optional numerical execution options. | entity/value | none |
| 25 | type | `PrimaryRadianceCalculatorMethod` | `<module>` | descriptive-other: Spectral-calculator method shared by direct-primary radiance builders. - **"buildEndp... | entity/value | union bullets 2/2 |
| 28 | interface | `SpectralCalculator` | `<module>` | descriptive-other: Contract that describes the shared spectral-calculation surface consumed across Algor... | entity/value | none |
| 30 | property | `dependencies` | `SpectralCalculator` | descriptive-other: Value that stores the accepted calculation dependencies. | entity/value | none |
| 38 | method | `buildEndpointTrapezoidPathIntegrationPoints` | `SpectralCalculator` | call-this-method: Call this method to build endpoint/trapezoid integration points for a finite ray segm... | active-callable | params 2/2; returns tagged |
| 48 | method | `computeSourceTransmittance` | `SpectralCalculator` | call-this-method: Call this method to compute source-path transmittance from finite source optical depth. | active-callable | params 1/1; returns tagged |
| 57 | method | `computeTrapezoidSegmentTransmittance` | `SpectralCalculator` | call-this-method: Call this method to compute endpoint/trapezoid transmittance for one path interval. | active-callable | params 3/3; returns tagged |
| 71 | method | `computeDirectScattering` | `SpectralCalculator` | call-this-method: Call this method to combine scattering coefficients with their phase values. | active-callable | params 4/4; returns tagged |
| 87 | method | `computeDirectInScattering` | `SpectralCalculator` | call-this-method: Call this method to compute direct source in-scattering for one path point. | active-callable | params 5/5; returns tagged |
| 101 | method | `computeDirectRadiance` | `SpectralCalculator` | call-this-method: Call this method to compute source-owned direct-primary radiance for cache construction. | active-callable | params 2/2; returns tagged |
| 113 | method | `computeRadiance` | `SpectralCalculator` | call-this-method: Call this method to integrate cumulative local scattering density over a view ray. | active-callable | params 3/3; returns tagged |
| 121 | type | `PathIntegrationPoint` | `<module>` | descriptive-other: Type that stores one endpoint/trapezoid path integration point. | entity/value | none |
| 123 | property | `pointIndex` | `PathIntegrationPoint` | descriptive-other: Value that stores the point index along the path. | entity/value | none |
| 126 | property | `distanceAlongRay` | `PathIntegrationPoint` | descriptive-other: Value that stores distance along the ray. | entity/value | none |
| 129 | property | `intervalLengthFromPrevious` | `PathIntegrationPoint` | descriptive-other: Value that stores interval length from the previous point. | entity/value | none |
| 132 | property | `trapezoidWeight` | `PathIntegrationPoint` | descriptive-other: Value that stores endpoint/trapezoid weight. | entity/value | none |
| 135 | property | `measure` | `PathIntegrationPoint` | descriptive-other: Value that stores effective path measure represented by this point. | entity/value | none |
| 139 | type | `PathRadiance` | `<module>` | descriptive-other: Type that stores spectral radiance computed along one path. | entity/value | none |
| 141 | property | `pathRadiance` | `PathRadiance` | descriptive-other: Value that stores path-added spectral radiance. | entity/value | none |
| 144 | property | `transmittance` | `PathRadiance` | descriptive-other: Value that stores final view-path transmittance. | entity/value | none |
| 147 | property | `diagnostics` | `PathRadiance` | descriptive-other: Value that stores optional implementation diagnostics for tests and future tooling. | entity/value | none |
| 151 | type | `ComputeRadianceOptions` | `<module>` | descriptive-other: Type that stores the cumulative cache required for one reference radiance computation. | entity/value | none |
| 153 | property | `scatteringCache` | `ComputeRadianceOptions` | descriptive-other: Value that stores the resident cumulative CPU cache to sample. | entity/value | none |

## `src/algorithm32/transport/types.d.ts`

Source: [src/algorithm32/transport/types.d.ts](../../../../../../src/algorithm32/transport/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | type | `PureScatteringDensityTransportGeometryMethod` | `<module>` | descriptive-other: Geometry-model method required by pure scattering-density transport. - **"resolveAtmo... | entity/value | union bullets 2/2 |
| 10 | type | `PureScatteringDensityTransportGeometry` | `<module>` | descriptive-other: Type that describes the geometry surface required by pure scattering-density transpor... | entity/value | none |
| 18 | method | `resolveCacheBuildRay` | `PureScatteringDensityTransportGeometry` | call-this-method: Call this method to resolve one source-owned cache coordinate into its physical const... | active-callable | params 1/1; returns tagged |
| 22 | type | `PureScatteringDensityTransportAtmosphere` | `<module>` | descriptive-other: Type that describes the atmosphere surface required during stored-field transport. | entity/value | none |
| 25 | type | `PureScatteringDensityTransportCalculator` | `<module>` | descriptive-other: Type that describes the spectral-calculator surface used by the selected endpoint tra... | entity/value | none |
| 33 | method | `buildEndpointTrapezoidPathIntegrationPoints` | `PureScatteringDensityTransportCalculator` | call-this-method: Call this method to build endpoint-inclusive trapezoidal integration points. | active-callable | params 2/2; returns tagged |
| 46 | method | `computeTrapezoidSegmentTransmittance` | `PureScatteringDensityTransportCalculator` | call-this-method: Call this method to compute Beer-Lambert transmittance over one trapezoidal path segm... | active-callable | params 3/3; returns tagged |
| 54 | type | `PureScatteringDensityDirectionStencilResolver` | `<module>` | descriptive-other: Type that resolves a source-owned scattering-density direction stencil. Concrete sour... | entity/value | none |
| 59 | callback | `<function-type>` | `PureScatteringDensityDirectionStencilResolver` | called-by: Called by pure scattering density direction stencil resolver to handle one invocation... | called-by | params 1/1; returns tagged |
| 62 | type | `PureScatteringDensityPositionStencilRequest` | `<module>` | descriptive-other: Type that supplies a physical sample to executable construction-position lookup. | entity/value | none |
| 64 | property | `position` | `PureScatteringDensityPositionStencilRequest` | descriptive-other: Value that stores the physical position along the construction ray. | entity/value | none |
| 66 | property | `atmosphereCoordinate` | `PureScatteringDensityPositionStencilRequest` | descriptive-other: Value that stores geometry's atmosphere coordinate at the physical position. | entity/value | none |
| 70 | type | `PureScatteringDensityPositionStencilResolver` | `<module>` | descriptive-other: Type that resolves source-selected executable construction-position taps. | entity/value | none |
| 75 | callback | `<function-type>` | `PureScatteringDensityPositionStencilResolver` | called-by: Called by pure scattering density position stencil resolver to handle one invocation ... | called-by | params 1/1; returns tagged |
| 78 | type | `PureScatteringDensityBuildCoordinateRequest` | `<module>` | descriptive-other: Type that supplies logical field state to a source-owned build-coordinate resolver. | entity/value | none |
| 80 | property | `positionIndex` | `PureScatteringDensityBuildCoordinateRequest` | descriptive-other: Value that stores the position-domain index being transported. | entity/value | none |
| 82 | property | `directionIndex` | `PureScatteringDensityBuildCoordinateRequest` | descriptive-other: Value that stores the radiance-direction index being transported. | entity/value | none |
| 84 | property | `positionNode` | `PureScatteringDensityBuildCoordinateRequest` | descriptive-other: Value that stores the source-owned executable physical position node. | entity/value | none |
| 86 | property | `incomingDirection` | `PureScatteringDensityBuildCoordinateRequest` | descriptive-other: Value that stores the geometry-framed physical construction direction. | entity/value | none |
| 90 | type | `PureScatteringDensityBuildCoordinateResolver` | `<module>` | descriptive-other: Type that resolves a source-owned cache coordinate without teaching generic transport... | entity/value | none |
| 95 | callback | `<function-type>` | `PureScatteringDensityBuildCoordinateResolver` | called-by: Called by pure scattering density build coordinate resolver to handle one invocation ... | called-by | params 1/1; returns tagged |
| 98 | type | `PureScatteringDensityPhysicalRadianceDirectionRequest` | `<module>` | descriptive-other: Type that supplies logical field state to source-owned physical direction mapping. | entity/value | none |
| 100 | property | `positionIndex` | `PureScatteringDensityPhysicalRadianceDirectionRequest` | descriptive-other: Value that stores the position-domain index being transported. | entity/value | none |
| 102 | property | `positionNode` | `PureScatteringDensityPhysicalRadianceDirectionRequest` | descriptive-other: Value that stores the source-owned executable physical position node. | entity/value | none |
| 104 | property | `directionIndex` | `PureScatteringDensityPhysicalRadianceDirectionRequest` | descriptive-other: Value that stores the radiance-direction index being transported. | entity/value | none |
| 106 | property | `cacheDirection` | `PureScatteringDensityPhysicalRadianceDirectionRequest` | descriptive-other: Value that stores the source-owned executable radiance direction. | entity/value | none |
| 110 | type | `PureScatteringDensityPhysicalRadianceDirectionResolver` | `<module>` | descriptive-other: Type that resolves a source-owned radiance direction into physical model space. | entity/value | none |
| 115 | callback | `<function-type>` | `PureScatteringDensityPhysicalRadianceDirectionResolver` | called-by: Called by pure scattering density physical radiance direction resolver to handle one ... | called-by | params 1/1; returns tagged |
| 118 | type | `PureScatteringDensityTransportRequest` | `<module>` | descriptive-other: Type that supplies one pure stored scattering-density to radiance transport build. | entity/value | none |
| 120 | property | `scatteringDensity` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores the sealed pure Jk input field. | entity/value | none |
| 122 | property | `outputRadiance` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores the mutable pure Lk output field. | entity/value | none |
| 124 | property | `geometry` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores geometry-owned construction and frame operations. | entity/value | none |
| 126 | property | `atmosphere` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores atmosphere medium sampling. | entity/value | none |
| 128 | property | `calculator` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores endpoint trapezoid and transmittance operations. | entity/value | none |
| 130 | property | `scatteringOrder` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores the pure scattering order being transported. | entity/value | none |
| 132 | property | `positionNodes` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores source-owned executable position nodes. | entity/value | none |
| 134 | property | `positionCount` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores the executable number of position nodes. | entity/value | none |
| 136 | property | `radianceUnitVectors` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores source-owned executable radiance directions. | entity/value | none |
| 138 | property | `radianceDirectionCount` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores the executable number of radiance directions. | entity/value | none |
| 140 | property | `spectralChannelCount` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores the executable spectral channel count. | entity/value | none |
| 142 | property | `resolvePositionStencil` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores source-selected executable construction-position lookup. | entity/value | none |
| 144 | property | `resolveDirectionStencil` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores the source-owned executable scattering-direction lookup. | entity/value | none |
| 146 | property | `resolveBuildCoordinate` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores the source-owned executable cache-coordinate mapping. | entity/value | none |
| 148 | property | `resolvePhysicalRadianceDirection` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores source-owned radiance-to-physical direction mapping. | entity/value | none |
| 150 | property | `pathIntervalCount` | `PureScatteringDensityTransportRequest` | descriptive-other: Value that stores the selected construction path interval count. | entity/value | none |
| 152 | property | `onProgress` | `PureScatteringDensityTransportRequest` | descriptive-other: Optional callback that reports bounded position progress without changing arithmetic. | entity/value | none |
| 163 | type | `CpuCacheBuildProgressPhase` | `<module>` | descriptive-other: Active phase of one synchronous CPU cache construction update. - **"primary-scatterin... | entity/value | union bullets 4/4 |
| 166 | type | `CpuCacheBuildProgress` | `<module>` | descriptive-other: Type that describes one synchronous CPU cache construction progress update. | entity/value | none |
| 168 | property | `phase` | `CpuCacheBuildProgress` | descriptive-other: Value that identifies the active construction phase. | entity/value | none |
| 170 | property | `order` | `CpuCacheBuildProgress` | descriptive-other: Value that identifies the pure scattering or radiance order. | entity/value | none |
| 172 | property | `completed` | `CpuCacheBuildProgress` | descriptive-other: Report the completed executable position count. | entity/value | none |
| 174 | property | `total` | `CpuCacheBuildProgress` | descriptive-other: Report the total executable position count. | entity/value | none |
| 178 | type | `CpuCacheBuildProgressCallback` | `<module>` | descriptive-other: Observe CPU cache construction progress. | entity/value | none |
| 182 | callback | `<function-type>` | `CpuCacheBuildProgressCallback` | called-by: Called by cpu cache build progress callback to handle one invocation of the declared ... | called-by | params 1/1 |
| 185 | interface | `Algorithm32Transport` | `<module>` | descriptive-other: Contract that describes the runtime transport contribution surface. | entity/value | none |
| 190 | method | `mainRequiredShaderSymbols` | `Algorithm32Transport` | call-this-method: Call this method to return the symbols required by the complete runtime shader main p... | active-callable | returns tagged |
| 196 | method | `createShaderContribution` | `Algorithm32Transport` | call-this-method: Call this method to create the transport-owned shader contribution. | active-callable | params 1/1; returns tagged |
| 200 | type | `LaterOrderScatteringGeometry` | `<module>` | descriptive-other: Type that describes geometry required by the physical later-order scattering kernel. | entity/value | none |
| 208 | type | `LaterOrderScatteringAtmosphereMethod` | `<module>` | descriptive-other: Atmosphere-model method required by later-order scattering. - **"sampleMedium"** - Lo... | entity/value | union bullets 2/2 |
| 211 | type | `LaterOrderScatteringAtmosphere` | `<module>` | descriptive-other: Type that describes atmosphere operations required by later-order scattering. | entity/value | none |
| 214 | type | `LaterOrderScatteringCalculator` | `<module>` | descriptive-other: Type that describes phase-weighted spectral scattering calculation. | entity/value | none |
| 224 | method | `computeDirectScattering` | `LaterOrderScatteringCalculator` | call-this-method: Call this method to combine local Rayleigh and Mie coefficients with one phase pair. | active-callable | params 4/4; returns tagged |
| 233 | type | `LaterOrderScatteringPositionRequest` | `<module>` | descriptive-other: Type that supplies one executable position node to source-owned reconstruction. | entity/value | none |
| 235 | property | `positionIndex` | `LaterOrderScatteringPositionRequest` | descriptive-other: Value that stores the position-domain index. | entity/value | none |
| 237 | property | `positionNode` | `LaterOrderScatteringPositionRequest` | descriptive-other: Value that stores the source-owned executable position node. | entity/value | none |
| 241 | type | `LaterOrderScatteringPositionResolver` | `<module>` | descriptive-other: Reconstruct one source-owned position node in physical model space. | entity/value | none |
| 246 | callback | `<function-type>` | `LaterOrderScatteringPositionResolver` | called-by: Called by later order scattering position resolver to handle one invocation of the de... | called-by | params 1/1; returns tagged |
| 249 | type | `LaterOrderScatteringDirectionRequest` | `<module>` | descriptive-other: Type that supplies one executable direction to source-owned physical mapping. | entity/value | none |
| 251 | property | `positionIndex` | `LaterOrderScatteringDirectionRequest` | descriptive-other: Value that stores the position-domain index. | entity/value | none |
| 253 | property | `positionNode` | `LaterOrderScatteringDirectionRequest` | descriptive-other: Value that stores the source-owned executable position node. | entity/value | none |
| 255 | property | `position` | `LaterOrderScatteringDirectionRequest` | descriptive-other: Value that stores the reconstructed physical position. | entity/value | none |
| 257 | property | `directionIndex` | `LaterOrderScatteringDirectionRequest` | descriptive-other: Value that stores the direction-domain index. | entity/value | none |
| 259 | property | `cacheDirection` | `LaterOrderScatteringDirectionRequest` | descriptive-other: Value that stores the source-owned executable direction vector. | entity/value | none |
| 263 | type | `LaterOrderScatteringDirectionResolver` | `<module>` | descriptive-other: Express one source-local executable direction in physical model space. | entity/value | none |
| 268 | callback | `<function-type>` | `LaterOrderScatteringDirectionResolver` | called-by: Called by later order scattering direction resolver to handle one invocation of the d... | called-by | params 1/1; returns tagged |
| 271 | type | `LaterOrderIncomingRadianceContributionRequest` | `<module>` | descriptive-other: Type that supplies one source-owned incoming-radiance augmentation at a cache node. | entity/value | none |
| 273 | property | `positionIndex` | `LaterOrderIncomingRadianceContributionRequest` | descriptive-other: Value that stores the position-domain index. | entity/value | none |
| 275 | property | `positionNode` | `LaterOrderIncomingRadianceContributionRequest` | descriptive-other: Value that stores the source-owned executable position node. | entity/value | none |
| 277 | property | `position` | `LaterOrderIncomingRadianceContributionRequest` | descriptive-other: Value that stores the reconstructed physical position. | entity/value | none |
| 279 | property | `spectralBasis` | `LaterOrderIncomingRadianceContributionRequest` | descriptive-other: Value that stores the active spectral basis. | entity/value | none |
| 281 | property | `incomingDirectionCount` | `LaterOrderIncomingRadianceContributionRequest` | descriptive-other: Value that stores the executable number of incoming directions. | entity/value | none |
| 283 | property | `physicalIncomingDirections` | `LaterOrderIncomingRadianceContributionRequest` | descriptive-other: Value that stores every incoming direction in physical model space. | entity/value | none |
| 285 | property | `incomingRadiance` | `LaterOrderIncomingRadianceContributionRequest` | descriptive-other: Value that stores mutable pure L(k-1) spectra for source-owned augmentation. | entity/value | none |
| 289 | type | `LaterOrderIncomingRadianceContributor` | `<module>` | descriptive-other: Type that adds source-owned physical radiance before generic phase integration. | entity/value | none |
| 293 | callback | `<function-type>` | `LaterOrderIncomingRadianceContributor` | called-by: Called by later order incoming radiance contributor to handle one invocation of the d... | called-by | params 1/1 |
| 296 | type | `PhysicalLaterOrderScatteringKernelRequest` | `<module>` | descriptive-other: Type that configures the selected physical pure-radiance to pure-scattering kernel. | entity/value | none |
| 298 | property | `geometry` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores geometry-owned atmosphere-coordinate mapping. | entity/value | none |
| 300 | property | `atmosphere` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores atmosphere-owned medium and phase sampling. | entity/value | none |
| 302 | property | `calculator` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores phase-weighted spectral coefficient calculation. | entity/value | none |
| 304 | property | `scatteringOrder` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores the pure scattering order being constructed. | entity/value | none |
| 306 | property | `positionNodes` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores source-owned executable position nodes. | entity/value | none |
| 308 | property | `positionCount` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores the executable number of positions. | entity/value | none |
| 310 | property | `incomingUnitVectors` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores source-owned executable incoming directions. | entity/value | none |
| 312 | property | `incomingDirectionCount` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores the executable number of incoming directions. | entity/value | none |
| 314 | property | `incomingIntegrationWeights` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores executable unit-bearing incoming quadrature weights. | entity/value | none |
| 316 | property | `outgoingUnitVectors` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores source-owned executable outgoing directions. | entity/value | none |
| 318 | property | `outgoingDirectionCount` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores the executable number of outgoing directions. | entity/value | none |
| 320 | property | `spectralBasis` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores the active executable spectral basis. | entity/value | none |
| 322 | property | `spectralChannelCount` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Value that stores the executable spectral channel count. | entity/value | none |
| 324 | property | `resolvePhysicalPosition` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Reconstruct one source-owned position in physical model space. | entity/value | none |
| 326 | property | `resolvePhysicalIncomingDirection` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Express incoming-radiance directions in physical model space. | entity/value | none |
| 328 | property | `resolvePhysicalOutgoingDirection` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Express outgoing-scattering directions in physical model space. | entity/value | none |
| 330 | property | `contributeIncomingRadiance` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Optional callback that augments incoming radiance through a source-owned operation. | entity/value | none |
| 332 | property | `onProgress` | `PhysicalLaterOrderScatteringKernelRequest` | descriptive-other: Optional callback that reports bounded position progress without changing arithmetic. | entity/value | none |
| 336 | type | `LaterOrderScatteringKernelInvocation` | `<module>` | descriptive-other: Type that supplies accepted field readers and writers to the synchronous kernel. | entity/value | none |
| 338 | property | `previousRadiance` | `LaterOrderScatteringKernelInvocation` | descriptive-other: Value that stores the sealed pure L(k-1) reader. | entity/value | none |
| 340 | property | `outputScattering` | `LaterOrderScatteringKernelInvocation` | descriptive-other: Value that stores the mutable pure Jk writer. | entity/value | none |

## `src/algorithm32/transport/types/Algorithm32Transport.d.ts`

Source: [src/algorithm32/transport/types/Algorithm32Transport.d.ts](../../../../../../src/algorithm32/transport/types/Algorithm32Transport.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `Algorithm32ResolvedTransportOptions` | `<module>` | descriptive-other: Executable final-view options resolved for Algorithm32 transport. | entity/value | none |
| 4 | property | `pathIntervalCount` | `Algorithm32ResolvedTransportOptions` | descriptive-other: Accepted path-integration interval count. | entity/value | none |
| 6 | property | `pathSampleDistribution` | `Algorithm32ResolvedTransportOptions` | descriptive-other: Accepted shader path-sample distribution or the default-selection sentinel. | entity/value | none |

## `src/algorithm32/utils/math/types.d.ts`

Source: [src/algorithm32/utils/math/types.d.ts](../../../../../../src/algorithm32/utils/math/types.d.ts)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | type | `ToleranceOptions` | `<module>` | descriptive-other: Type that supplies call-local tolerance behavior. | entity/value | none |
| 4 | property | `epsilon` | `ToleranceOptions` | descriptive-other: Value that stores the accepted absolute tolerance. | entity/value | none |
| 8 | type | `RangeOptions` | `<module>` | descriptive-other: Type that supplies call-local range behavior. | entity/value | none |
| 10 | property | `inclusive` | `RangeOptions` | descriptive-other: Value that stores whether range endpoints are included. | entity/value | none |
| 14 | type | `NumberFormatOptions` | `<module>` | descriptive-other: Type that supplies call-local number formatting behavior. | entity/value | none |
| 16 | property | `precision` | `NumberFormatOptions` | descriptive-other: Value that stores the number of fixed decimal places to emit before trimming. | entity/value | none |
| 19 | property | `trim` | `NumberFormatOptions` | descriptive-other: Value that stores whether trailing fractional zeroes should be removed. | entity/value | none |
| 23 | type | `AngleWrapOptions` | `<module>` | descriptive-other: Type that supplies call-local angle wrapping bounds. | entity/value | none |
| 25 | property | `min` | `AngleWrapOptions` | descriptive-other: Value that stores the inclusive lower wrap bound. | entity/value | none |
| 28 | property | `max` | `AngleWrapOptions` | descriptive-other: Value that stores the exclusive upper wrap bound. | entity/value | none |
| 32 | type | `SceneScaleRequest` | `<module>` | descriptive-other: Request containing an optional renderer scene scale. | entity/value | none |
| 34 | property | `sceneScale` | `SceneScaleRequest` | descriptive-other: Renderer scene-to-physical scale. | entity/value | none |
| 40 | type | `NumericArrayMapper` | `<module>` | descriptive-other: Mapping from one numeric array value to another numeric value. | entity/value | none |
| 47 | callback | `<function-type>` | `NumericArrayMapper` | called-by: Called by numeric array mapper to handle one invocation of the declared operation. | called-by | params 3/3; returns tagged |
| 65 | type | `NearestSampleIndexOptions` | `<module>` | descriptive-other: Type that supplies call-local nearest-sample lookup behavior. | entity/value | none |
| 67 | property | `clamp` | `NearestSampleIndexOptions` | descriptive-other: Value that stores whether out-of-range targets clamp to the nearest endpoint. | entity/value | none |
| 71 | type | `SamplePaddingOptions` | `<module>` | descriptive-other: Type that supplies call-local sample padding behavior. | entity/value | none |
| 73 | property | `before` | `SamplePaddingOptions` | descriptive-other: Value that stores the number of samples to add before the source samples. | entity/value | none |
| 76 | property | `after` | `SamplePaddingOptions` | descriptive-other: Value that stores the number of samples to add after the source samples. | entity/value | none |
| 79 | property | `value` | `SamplePaddingOptions` | descriptive-other: Value that stores the value used for padded samples. | entity/value | none |
| 88 | type | `MonotonicDirection` | `<module>` | descriptive-other: Expected ordering direction for one monotonic sample sequence. - **"ascending"** - Ea... | entity/value | union bullets 2/2 |
| 91 | type | `MonotonicOptions` | `<module>` | descriptive-other: Type that supplies call-local monotonic check behavior. | entity/value | none |
| 93 | property | `direction` | `MonotonicOptions` | descriptive-other: Expected ordering direction of the sample sequence. | entity/value | none |
| 96 | property | `strict` | `MonotonicOptions` | descriptive-other: Value that stores whether equal adjacent samples are rejected. | entity/value | none |
| 105 | type | `SampleWalkDirection` | `<module>` | descriptive-other: Traversal direction for one ordered sample walk. - **"ascending"** - Traversal from t... | entity/value | union bullets 2/2 |
| 108 | type | `SampleWalkOptions` | `<module>` | descriptive-other: Type that supplies call-local sample traversal behavior. | entity/value | none |
| 110 | property | `direction` | `SampleWalkOptions` | descriptive-other: Direction of the ordered sample traversal. | entity/value | none |
| 114 | type | `SampleWalkEntry` | `<module>` | descriptive-other: Type for one sample traversal entry. | entity/value | none |
| 116 | property | `index` | `SampleWalkEntry` | descriptive-other: Value that stores the source sample index. | entity/value | none |
| 119 | property | `value` | `SampleWalkEntry` | descriptive-other: Value that stores the source sample value. | entity/value | none |
| 123 | type | `SampleSignatureOptions` | `<module>` | descriptive-other: Type that supplies call-local sample signature behavior. | entity/value | none |
| 125 | property | `precision` | `SampleSignatureOptions` | descriptive-other: Value that stores the number of fixed decimal places to emit before trimming. | entity/value | none |
| 128 | property | `separator` | `SampleSignatureOptions` | descriptive-other: Value that stores the separator placed between formatted sample values. | entity/value | none |
| 132 | type | `UnitVector3` | `<module>` | descriptive-other: Type that stores one normalized three-dimensional vector. | entity/value | none |

