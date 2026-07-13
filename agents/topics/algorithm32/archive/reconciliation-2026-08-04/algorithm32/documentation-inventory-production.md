# Algorithm32 Documentation Inventory: Production JavaScript And JSX

Status: generated Step 6.3 closure appendix for the settled source identity
`sha256:7d7810f7b69b7516bfdd25058360d62cd4b586176d7692ca90fd5655f1398832`. The canonical scope, schema, counts, and
completion decision are owned by the
[Algorithm32 documentation inventory](./documentation-inventory.md).

This appendix covers **1742** documentable rows in **131** files.
Line numbers belong to the recorded source identity. `Current documentation`
records the detected description form and a bounded excerpt; it does not
records the completed Step 6 description form. `Contract inventory` records
the completed tag and special-case evidence.

## `src/algorithm32/adapters/react/Algorithm32AtmosphereComposer.js`

Source: [src/algorithm32/adapters/react/Algorithm32AtmosphereComposer.js](../../../../../../src/algorithm32/adapters/react/Algorithm32AtmosphereComposer.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 15 | class | `Algorithm32AtmosphereComposer` | `<module>` | descriptive-other: Object that wraps arbitrary Three/R3F children in a production Algorithm32 composer c... | entity/value | none |
| 22 | method | `_createDefaultAlgorithm32` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to create the default Algorithm32 facade. | called-by | params 1/1; returns tagged |
| 32 | method | `_createDefaultBindingValues` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to create the default mutable renderer bind... | called-by | params 1/1; returns tagged |
| 42 | method | `_createDefaultRenderTarget` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to create the default scene-color render ta... | called-by | params 1/1; returns tagged |
| 56 | method | `_shallowEqualObject` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to compare two shallow object snapshots. It... | called-by | params 2/2; returns tagged |
| 77 | callback | `leftKeys.every::<callback@77:8>` | `_shallowEqualObject` | called-by: Called by Array.prototype.every to test one collection value against the shared condi... | called-by | params 1/1; returns tagged |
| 87 | method | `_disposeMaterial` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to dispose one Three material or material c... | called-by | params 1/1 |
| 105 | method | `_disposeThreeObject` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to dispose one Three object and its owned g... | called-by | params 1/1 |
| 119 | callback | `candidate?.traverse::<callback@119:8>` | `_disposeThreeObject` | called-by: Called by the scene traversal to process one traversed scene object. | called-by | params 1/1 |
| 126 | field | `defaultProps` | `Algorithm32AtmosphereComposer` | descriptive-other: Default props value. | entity/value | none |
| 150 | method | `_composerInputsChanged` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to check whether renderer inputs require co... | called-by | params 1/1; returns tagged |
| 164 | method | `_setupInputsChanged` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to check whether Algorithm32 setup inputs c... | called-by | params 1/1; returns tagged |
| 183 | method | `_canRefreshRuntimeConfig` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to check whether an installed handle can tr... | called-by | params 1/1; returns tagged |
| 203 | method | `_requiredObjectsInputsFor` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to select the prop values that determine re... | called-by | params 1/1; returns tagged |
| 222 | method | `_updateBackground` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to apply the configured solid-scene backgro... | called-by | params 1/1 |
| 238 | method | `_updateBindingValues` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to update caller-owned binding values for o... | called-by | params 2/2 |
| 258 | method | `_isCurrentSetup` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to check whether an asynchronous setup gene... | called-by | params 1/1; returns tagged |
| 267 | method | `_viewportSize` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to resolve the current unit-bearing viewpor... | called-by | returns tagged |
| 277 | method | `_setStateIfMounted` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to publish state through React or update pr... | called-by | params 1/1 |
| 293 | method | `_disposeRuntime` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to dispose the active shader handle and Alg... | called-by | none |
| 309 | method | `_disposeComposer` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to dispose the active composer and render-t... | called-by | none |
| 324 | method | `_disposeRequiredObjects` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to dispose all currently owned required Thr... | called-by | none |
| 339 | method | `_acceptRequiredObjectsPacket` | `Algorithm32AtmosphereComposer` | called-by: Called by required-object synchronization to accept a result at the composer boundary. | called-by | params 1/1; returns tagged |
| 349 | method | `_syncRequiredObjects` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to reconcile geometry- and source-owned Thr... | called-by | params 1/1 |
| 396 | method | `_recreateComposer` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to recreate the composer and its initial re... | called-by | none |
| 432 | method | `_ensureComposer` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to create the composer when its required re... | called-by | none |
| 443 | method | `_setupRuntime` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to start one generation-safe Algorithm32 sh... | called-by | none |
| 516 | callback | `algorithm32 .setupShader(setupRequest) .then::<callback@516:9>` | `_setupRuntime` | called-by: Called by the promise continuation to handle one callback invocation. | called-by | params 1/1 |
| 547 | callback | `algorithm32 .setupShader(setupRequest) .then( /** * Called by the promise continuation to handle one callback invocation. * @param shaderHandle - The shader handle value accepted by the operation. */ (shaderHandle) => { if (this._pendingSetupCancellation === setupCancellation) { this._pendingSetupCancellation = null; } if (!this._isCurrentSetup(generation)) { shaderHandle.dispose(); algorithm32.dispose(); return; } this._algorithm32 = algorithm32; this._shaderHandle = shaderHandle; this._bindingValues = bindingValues; previousShaderHandle?.dispose?.(); previousAlgorithm32?.dispose?.(); this._setStateIfMounted({ setupError: null, shaderReady: true, }); this.props.onSetupReady?.({ algorithm32, bindingValues, shaderHandle, solidScene: this._solidScene, }); }, ) .catch::<callback@547:9>` | `_setupRuntime` | called-by: Called by the promise rejection handler to handle one callback invocation. | called-by | params 1/1 |
| 571 | method | `_refreshRuntimeConfig` | `Algorithm32AtmosphereComposer` | called-by: Called by algorithm32 atmosphere composer to rebuild the active attachment transactio... | called-by | none |
| 588 | callback | `shaderHandle .setConfig(this.props.config) .then::<callback@588:82>` | `_refreshRuntimeConfig` | called-by: Called by the promise continuation to handle one callback invocation. | called-by | none |
| 608 | callback | `shaderHandle .setConfig(this.props.config) .then( /** Called by the promise continuation to handle one callback invocation. */ () => { if (!this._isCurrentSetup(generation) \|\| shaderHandle !== this._shaderHandle) { return; } this._setStateIfMounted({ setupError: null, shaderReady: true, }); this.props.onSetupReady?.({ algorithm32: this._algorithm32, bindingValues: this._bindingValues, shaderHandle, solidScene: this._solidScene, }); }, ) .catch::<callback@608:9>` | `_refreshRuntimeConfig` | called-by: Called by the promise rejection handler to handle one callback invocation. | called-by | params 1/1 |
| 628 | constructor | `<anonymous@628:2>` | `Algorithm32AtmosphereComposer` | creates: Creates an Algorithm32 atmosphere composer. | creates | params 1/1 |
| 661 | method | `componentDidMount` | `Algorithm32AtmosphereComposer` | call-this-method: Call this method to mount the composer and start runtime setup. | active-callable | none |
| 673 | method | `componentDidUpdate` | `Algorithm32AtmosphereComposer` | call-this-method: Call this method to reconcile composer and runtime state after prop changes. | active-callable | params 1/1 |
| 702 | method | `componentWillUnmount` | `Algorithm32AtmosphereComposer` | call-this-method: Call this method to dispose runtime and renderer resources before unmounting. | active-callable | none |
| 716 | method | `renderAlgorithm32Frame` | `Algorithm32AtmosphereComposer` | call-this-method: Call this method to called by the R3F bridge on each frame. It returns the value from... | active-callable | params 2/2; returns tagged |
| 732 | method | `getSolidScene` | `Algorithm32AtmosphereComposer` | call-this-method: Call this method to return the composer scene that receives endpoint children. | active-callable | returns tagged |
| 741 | method | `getFallbackScene` | `Algorithm32AtmosphereComposer` | call-this-method: Call this method to return the scene the bridge should render while Algorithm32 is no... | active-callable | returns tagged |
| 750 | method | `render` | `Algorithm32AtmosphereComposer` | call-this-method: Call this method to render children directly or portal them into the solid scene. | active-callable | returns tagged |

## `src/algorithm32/adapters/react/Algorithm32Bindings.js`

Source: [src/algorithm32/adapters/react/Algorithm32Bindings.js](../../../../../../src/algorithm32/adapters/react/Algorithm32Bindings.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | constant | `Algorithm32Bindings` | `<module>` | descriptive-other: Adapter-owned runtime binding-value creation and mutation methods. | entity/value | none |
| 14 | method | `create` | `Algorithm32Bindings` | call-this-method: Call this method to create fresh mutable binding values for the common Algorithm32 ca... | active-callable | params 2/2; returns tagged; throws 1 |
| 44 | method | `update` | `Algorithm32Bindings` | call-this-method: Call this method to update common Algorithm32 camera bindings from one live Three fra... | active-callable | params 1/1 |

## `src/algorithm32/adapters/react/Algorithm32R3FAtmosphereComposer.jsx`

Source: [src/algorithm32/adapters/react/Algorithm32R3FAtmosphereComposer.jsx](../../../../../../src/algorithm32/adapters/react/Algorithm32R3FAtmosphereComposer.jsx)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 13 | function | `Algorithm32R3FAtmosphereComposer` | `<module>` | call-this-method: Call this function to provide React Three Fiber renderer state to the class-based Alg... | active-callable | params 1/1; returns tagged |
| 22 | callback | `useFrame::<callback@22:7>` | `Algorithm32R3FAtmosphereComposer` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2 |

## `src/algorithm32/adapters/react/Algorithm32R3FValues.js`

Source: [src/algorithm32/adapters/react/Algorithm32R3FValues.js](../../../../../../src/algorithm32/adapters/react/Algorithm32R3FValues.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `Algorithm32R3FValues` | `<module>` | descriptive-other: R3F viewport-packet and render-priority value methods. | entity/value | none |
| 11 | method | `viewportSize` | `Algorithm32R3FValues` | call-this-method: Call this method to resolve a positive integer viewport size from R3F size state. | active-callable | params 1/1; returns tagged |
| 26 | method | `renderPriority` | `Algorithm32R3FValues` | call-this-method: Call this method to resolve the optional R3F render priority. It returns the value fr... | active-callable | params 1/1; returns tagged; throws 1 |

## `src/algorithm32/adapters/react/Algorithm32ThreeResources.js`

Source: [src/algorithm32/adapters/react/Algorithm32ThreeResources.js](../../../../../../src/algorithm32/adapters/react/Algorithm32ThreeResources.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | constant | `Algorithm32ThreeResources` | `<module>` | descriptive-other: Request-backed Three resource resolution and construction methods. | entity/value | none |
| 13 | method | `resolveOwnerRequest` | `Algorithm32ThreeResources` | call-this-method: Call this method to resolve an owner request from a direct value or request factory. | active-callable | params 2/2; returns tagged |
| 29 | method | `createRequiredThreeObjects` | `Algorithm32ThreeResources` | call-this-method: Call this method to create geometry- and light-source-owned Three objects required by... | active-callable | params 1/1; returns tagged |
| 66 | constant | `object` | `createRequiredThreeObjects` | descriptive-other: Request-backed Three resource resolution and construction methods. | entity/value | none |
| 91 | method | `createSceneColorRenderTarget` | `Algorithm32ThreeResources` | call-this-method: Call this method to create the default Algorithm32 scene-color render target. | active-callable | params 1/1; returns tagged; throws 1 |

## `src/algorithm32/adapters/react/consts.js`

Source: [src/algorithm32/adapters/react/consts.js](../../../../../../src/algorithm32/adapters/react/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `DEFAULT_ALGORITHM32_SCENE_SCALE` | `<module>` | descriptive-other: Default algorithm32 scene scale constant. | entity/value | none |

## `src/algorithm32/adapters/react/index.js`

Source: [src/algorithm32/adapters/react/index.js](../../../../../../src/algorithm32/adapters/react/index.js)

No independently documentable declaration or callable target; this is a re-export-only barrel.

## `src/algorithm32/atmospheres/canonical/CanonicalAtmosphere.js`

Source: [src/algorithm32/atmospheres/canonical/CanonicalAtmosphere.js](../../../../../../src/algorithm32/atmospheres/canonical/CanonicalAtmosphere.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 21 | class | `CanonicalAtmosphere` | `<module>` | descriptive-other: Canonical atmosphere profile used by Algorithm32 transport. | entity/value | none |
| 30 | method | `_exponentialDensity` | `CanonicalAtmosphere` | called-by: Called by CanonicalAtmosphere to evaluate an exponential density profile at one altit... | called-by | params 2/2; returns tagged |
| 40 | method | `_rayleighPhaseFunction` | `CanonicalAtmosphere` | called-by: Called by CanonicalAtmosphere to evaluate its Rayleigh phase function. [3] | called-by | params 1/1; returns tagged |
| 52 | method | `_miePhaseFunction` | `CanonicalAtmosphere` | called-by: Called by CanonicalAtmosphere to evaluate its Cornette-Shanks-style Mie phase functio... | called-by | params 2/2; returns tagged |
| 71 | method | `_wavelengthMicrometersForChannel` | `CanonicalAtmosphere` | called-by: Called by CanonicalAtmosphere to resolve one validated basis-channel wavelength in mi... | called-by | params 1/1; returns tagged |
| 85 | method | `_createAtmospherePacket` | `CanonicalAtmosphere` | called-by: Called by CanonicalAtmosphere to create one atmosphere-owned typed spectral result wi... | called-by | params 4/4; returns tagged |
| 105 | method | `_assertPositiveFinite` | `CanonicalAtmosphere` | called-by: Called by CanonicalAtmosphere to require a positive finite scalar. | called-by | params 2/2; throws 1 |
| 120 | method | `_assertConstants` | `CanonicalAtmosphere` | called-by: Called by CanonicalAtmosphere to validate its accepted physical constants. | called-by | params 1/1; throws 2 |
| 153 | method | `_atmosphereConstantsBlock` | `CanonicalAtmosphere` | called-by: Called by CanonicalAtmosphere to create its shared atmosphere-constant GLSL block. | called-by | params 2/2; returns tagged |
| 161 | callback | `spectralBasis.channels.map::<callback@161:8>` | `wavelengthMicrometers` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 182 | constructor | `<anonymous@182:2>` | `CanonicalAtmosphere` | creates: Creates a canonical atmosphere from sourced constants and a spectral basis. | creates | params 1/1 |
| 203 | accessor-get | `constants` | `CanonicalAtmosphere` | descriptive-other: Value that returns the immutable atmosphere constants. | entity/value | returns tagged |
| 212 | accessor-get | `spectralBasis` | `CanonicalAtmosphere` | descriptive-other: Value that returns the validated spectral basis. | entity/value | returns tagged |
| 221 | accessor-get | `id` | `CanonicalAtmosphere` | descriptive-other: Value that identifies this configured atmosphere model instance for compatibility. | entity/value | returns tagged |
| 231 | method | `createCacheModule` | `CanonicalAtmosphere` | call-this-method: Call this method to supply the canonical medium, phase, and source-transmittance prog... | active-callable | params 1/1; returns tagged |
| 254 | callback | `this._spectralBasis.channels.map::<callback@254:9>` | `wavelengthData` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 317 | callback | `([ ['rayleigh-scale-height', 'uCacheRayleighScaleHeight', this._constants.rayleighScaleHeight], ['mie-scale-height', 'uCacheMieScaleHeight', this._constants.mieScaleHeight], [ 'rayleigh-coefficient-scale', 'uCacheRayleighCoefficientScale', { value: this._constants.rayleighCoefficientScale, units: 'm^-1 micrometers^4', }, ], [ 'mie-angstrom-alpha', 'uCacheMieAngstromAlpha', { value: this._constants.mieAngstromAlpha, units: '1', }, ], [ 'mie-angstrom-beta', 'uCacheMieAngstromBeta', { value: this._constants.mieAngstromBeta, units: '1', }, ], [ 'mie-single-scattering-albedo', 'uCacheMieSingleScatteringAlbedo', { value: this._constants.mieSingleScatteringAlbedo, units: '1', }, ], [ 'mie-phase-g', 'uCacheMiePhaseG', { value: this._constants.miePhaseFunctionG, units: '1', }, ], ]).map::<callback@317:9>` | `bindings` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 484 | method | `rayleighScatteringCoefficientAt` | `CanonicalAtmosphere` | call-this-method: Call this method to return Rayleigh scattering coefficient for a wavelength. | active-callable | params 1/1; returns tagged |
| 497 | method | `mieExtinctionCoefficientAt` | `CanonicalAtmosphere` | call-this-method: Call this method to return Mie extinction coefficient for a wavelength. | active-callable | params 1/1; returns tagged |
| 513 | method | `_zero` | `CanonicalAtmosphere` | called-by: Called by canonical atmosphere to return a readonly zero-valued spectrum for the conf... | called-by | returns tagged |
| 519 | callback | `Array.from::<callback@519:8>` | `_zero` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 528 | method | `_zeroMutable` | `CanonicalAtmosphere` | called-by: Called by canonical atmosphere to return mutable zero-valued working storage for the ... | called-by | returns tagged |
| 534 | callback | `Array.from::<callback@534:8>` | `_zeroMutable` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 543 | method | `_createShaderContribution` | `CanonicalAtmosphere` | called-by: Called by canonical atmosphere to create the geometry-neutral runtime medium sampler ... | called-by | returns tagged |
| 593 | method | `sampleMedium` | `CanonicalAtmosphere` | call-this-method: Call this method to sample wavelength-aligned medium coefficients at a geometry-resol... | active-callable | params 1/1; returns tagged |
| 610 | callback | `this._spectralBasis.channels.map::<callback@610:8>` | `rayleighScatteringValues` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 621 | callback | `this._spectralBasis.channels.map::<callback@621:8>` | `mieExtinctionValues` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 630 | callback | `mieExtinctionValues.map::<callback@630:8>` | `mieScatteringValues` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 639 | callback | `rayleighScatteringValues.map::<callback@639:8>` | `extinctionValues` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 647 | callback | `rayleighScatteringValues.map::<callback@647:8>` | `scatteringValues` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 715 | method | `integrateOpticalDepth` | `CanonicalAtmosphere` | call-this-method: Call this method to integrate optical depth and transmittance over a geometry-built a... | active-callable | params 1/1; returns tagged |
| 766 | callback | `opticalDepth.map::<callback@766:10>` | `transmittance` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 785 | method | `samplePhase` | `CanonicalAtmosphere` | call-this-method: Call this method to sample Rayleigh and Mie phase functions for a pair of directions. | active-callable | params 1/1; returns tagged |
| 809 | method | `createShaderContribution` | `CanonicalAtmosphere` | call-this-method: Call this method to create the geometry-neutral atmosphere-owned shader contribution. | active-callable | returns tagged |

## `src/algorithm32/atmospheres/canonical/consts.js`

Source: [src/algorithm32/atmospheres/canonical/consts.js](../../../../../../src/algorithm32/atmospheres/canonical/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | constant | `ATMOSPHERE_CACHE_SYMBOLS_BY_PASS` | `<module>` | descriptive-other: Base construction capabilities supplied by the atmosphere, keyed by cache pass. | entity/value | none |
| 19 | constant | `ATMOSPHERE_CACHE_REQUIREMENTS_BY_PASS` | `<module>` | descriptive-other: Base construction dependencies of the atmosphere, keyed by cache pass. | entity/value | none |
| 28 | constant | `ATMOSPHERE_FINITE_SEGMENT_TRANSMITTANCE_SYMBOL` | `<module>` | descriptive-other: Shader symbol for finite-segment transmittance used by reflected ground radiance. | entity/value | none |
| 36 | constant | `CANONICAL_ATMOSPHERE_CONSTANTS` | `<module>` | descriptive-other: Value that stores the accepted canonical atmosphere constants. | entity/value | none |

## `src/algorithm32/color/bruneton/BrunetonColorDisplayModel.js`

Source: [src/algorithm32/color/bruneton/BrunetonColorDisplayModel.js](../../../../../../src/algorithm32/color/bruneton/BrunetonColorDisplayModel.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 14 | class | `BrunetonColorDisplayModel` | `<module>` | descriptive-other: Object that converts completed Algorithm32 spectral radiance through the accepted E8 ... | entity/value | none |
| 21 | constructor | `<anonymous@21:2>` | `BrunetonColorDisplayModel` | creates: Creates the display model. | creates | params 1/1 |
| 34 | field | `_displayConstants` | `BrunetonColorDisplayModel` | descriptive-other: Value that stores the accepted display constants. | entity/value | none |
| 42 | field | `_displayLinearSrgbByChannel` | `BrunetonColorDisplayModel` | descriptive-other: Value that stores the native-15 linear-sRGB projection rows. | entity/value | none |
| 49 | accessor-get | `id` | `BrunetonColorDisplayModel` | descriptive-other: Value that identifies this configured color conversion instance. | entity/value | returns tagged |
| 58 | accessor-get | `displayConstants` | `BrunetonColorDisplayModel` | descriptive-other: Value that returns the accepted display constants. | entity/value | returns tagged |
| 70 | method | `_acceptDisplayConstants` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to accept a display-constant packet at the cla... | called-by | params 1/1; returns tagged; throws 2 |
| 106 | method | `_acceptSpectralRadiance` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to accept spectral radiance on the canonical d... | called-by | params 1/1; returns tagged |
| 123 | method | `_acceptSpectralTransmittance` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to accept spectral transmittance on the canoni... | called-by | params 1/1; returns tagged |
| 140 | method | `_average` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to average one nonempty trusted numerical coll... | called-by | params 1/1; returns tagged |
| 156 | method | `_rendererLinearSrgbChannelToDisplayRgb` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to apply the standard sRGB display transfer to... | called-by | params 1/1; returns tagged |
| 172 | method | `_displayRgbChannelToLinearSrgb` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to invert the Figure 1 exponential bridge for ... | called-by | params 1/1; returns tagged |
| 185 | method | `_cieColorMatchingValuesAt` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to interpolate the official 1-nanometer CIE ro... | called-by | params 1/1; returns tagged; throws 1 |
| 222 | method | `_spectralRadianceValuesToLinearSrgb` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to project trusted native-15 radiance values t... | called-by | params 1/1; returns tagged |
| 253 | method | `_buildDisplayLinearSrgbByChannel` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to build the exact per-channel projection weig... | called-by | returns tagged |
| 279 | method | `_mapLinearSrgbChannelToDisplay` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to apply the exposed final Figure 1 display ma... | called-by | params 1/1; returns tagged |
| 288 | method | `_displayConstantsBlock` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to build the display constants GLSL block. | called-by | returns tagged |
| 302 | method | `_displayComposeBlock` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to build the production captured-scene composi... | called-by | returns tagged |
| 370 | method | `_displayEncodeBlock` | `BrunetonColorDisplayModel` | called-by: Called by bruneton color display model to build the exposed display output mapping GL... | called-by | returns tagged |
| 387 | method | `linearSrgbToDisplayRgb` | `BrunetonColorDisplayModel` | call-this-method: Call this method to apply the accepted Figure 1 exponential display mapping. | active-callable | params 1/1; returns tagged |
| 401 | method | `rendererLinearSrgbToDisplayRgb` | `BrunetonColorDisplayModel` | call-this-method: Call this method to apply the renderer-to-display transfer used by the production com... | active-callable | params 1/1; returns tagged |
| 415 | method | `displayRgbToLinearSrgb` | `BrunetonColorDisplayModel` | call-this-method: Call this method to invert the accepted Figure 1 exponential mapping for captured sce... | active-callable | params 1/1; returns tagged |
| 429 | method | `spectralTransmittanceToRgbBands` | `BrunetonColorDisplayModel` | call-this-method: Call this method to collapse native spectral transmittance into the production three ... | active-callable | params 1/1; returns tagged |
| 445 | method | `radianceToLinearSrgb` | `BrunetonColorDisplayModel` | call-this-method: Call this method to convert canonical spectral radiance to linear sRGB through E8. | active-callable | params 1/1; returns tagged |
| 457 | method | `radianceToDisplayRgb` | `BrunetonColorDisplayModel` | call-this-method: Call this method to convert canonical spectral radiance through E8 and the display ma... | active-callable | params 1/1; returns tagged |
| 467 | method | `convert` | `BrunetonColorDisplayModel` | call-this-method: Call this method to convert completed spectral radiance into display-facing channels. | active-callable | params 1/1; returns tagged |
| 480 | method | `composeSceneLinearSrgb` | `BrunetonColorDisplayModel` | call-this-method: Call this method to compose spectral path radiance over captured scene RGB using the ... | active-callable | params 1/1; returns tagged |
| 505 | method | `composeSceneDisplayRgb` | `BrunetonColorDisplayModel` | call-this-method: Call this method to compose spectral path radiance over captured scene RGB and encode... | active-callable | params 1/1; returns tagged |
| 514 | method | `createShaderContribution` | `BrunetonColorDisplayModel` | call-this-method: Call this method to create the Color-owned spectral composition and display contribut... | active-callable | returns tagged |

## `src/algorithm32/color/bruneton/consts.js`

Source: [src/algorithm32/color/bruneton/consts.js](../../../../../../src/algorithm32/color/bruneton/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | constant | `CIE_1931_2_DEG_NATIVE_15_SOURCE_ROWS` | `<module>` | descriptive-other: Value that stores the official CIE 1931 2-degree 1-nanometer rows that bracket every ... | entity/value | none |
| 41 | constant | `FIGURE1_DISPLAY_CONSTANTS` | `<module>` | descriptive-other: Value that stores the accepted display-conversion constants for the Figure 1 adapter. | entity/value | none |

## `src/algorithm32/domains/direction/cubed-sphere/consts.js`

Source: [src/algorithm32/domains/direction/cubed-sphere/consts.js](../../../../../../src/algorithm32/domains/direction/cubed-sphere/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER` | `<module>` | descriptive-other: Supported executable source-local cubed-sphere owners. | entity/value | none |
| 9 | constant | `CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER` | `<module>` | descriptive-other: Cubed sphere w9 direction domain owner constant. | entity/value | none |
| 14 | constant | `CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER` | `<module>` | descriptive-other: Cubed sphere w27 direction domain owner constant. | entity/value | none |
| 20 | constant | `CUBED_SPHERE_W27_DIRECTION_COUNT` | `<module>` | descriptive-other: Established W27 direction count. | entity/value | none |
| 23 | constant | `CUBED_SPHERE_W27_FACES` | `<module>` | descriptive-other: Established W27 face definitions. | entity/value | none |
| 26 | constant | `CUBED_SPHERE_W27_UNIT_VECTORS` | `<module>` | descriptive-other: Established W27 unit vectors. | entity/value | none |

## `src/algorithm32/domains/direction/cubed-sphere/CubedSphereDirectionDomain.js`

Source: [src/algorithm32/domains/direction/cubed-sphere/CubedSphereDirectionDomain.js](../../../../../../src/algorithm32/domains/direction/cubed-sphere/CubedSphereDirectionDomain.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | class | `CubedSphereDirectionDomain` | `<module>` | descriptive-other: Executable boundary-inclusive cubed-sphere reconstruction domain. | entity/value | none |
| 12 | field | `id` | `CubedSphereDirectionDomain` | descriptive-other: Unique identifier for the executable domain. | entity/value | none |
| 19 | field | `faceWidth` | `CubedSphereDirectionDomain` | descriptive-other: Number of nodes along one face edge. | entity/value | none |
| 26 | field | `cellWidth` | `CubedSphereDirectionDomain` | descriptive-other: Number of cells along one face edge. | entity/value | none |
| 33 | field | `faceNodeCount` | `CubedSphereDirectionDomain` | descriptive-other: Number of nodes on one face. | entity/value | none |
| 40 | field | `directionCount` | `CubedSphereDirectionDomain` | descriptive-other: Total number of directions in the domain. | entity/value | none |
| 47 | field | `faces` | `CubedSphereDirectionDomain` | descriptive-other: Ordered executable face definitions. | entity/value | none |
| 54 | field | `unitVectors` | `CubedSphereDirectionDomain` | descriptive-other: Source-local unit vectors in flattened storage order. | entity/value | none |
| 61 | field | `integrationWeights` | `CubedSphereDirectionDomain` | descriptive-other: Absent integration weights for this reconstruction-only domain. | entity/value | none |
| 68 | field | `positiveFaceCenterIndices` | `CubedSphereDirectionDomain` | descriptive-other: Flattened positive-axis face-center indices. | entity/value | none |
| 76 | method | `_canonicalZero` | `CubedSphereDirectionDomain` | called-by: Called by domain construction and lookup to canonicalize signed zero without changing... | called-by | params 1/1; returns tagged |
| 87 | method | `_acceptDefinition` | `CubedSphereDirectionDomain` | called-by: Called by construction to accept one complete supported domain definition. | called-by | params 1/1; returns tagged; throws 1 |
| 103 | method | `_createFaces` | `CubedSphereDirectionDomain` | called-by: Called by construction to copy the selected literal face convention. | called-by | returns tagged |
| 146 | callback | `[ { id: 'positive-x', normal: [1, 0, 0], uAxis: [0, 1, 0], vAxis: [0, 0, 1], }, { id: 'negative-x', normal: [-1, 0, 0], uAxis: [0, -1, 0], vAxis: [0, 0, 1], }, { id: 'positive-y', normal: [0, 1, 0], uAxis: [-1, 0, 0], vAxis: [0, 0, 1], }, { id: 'negative-y', normal: [0, -1, 0], uAxis: [1, 0, 0], vAxis: [0, 0, 1], }, { id: 'positive-z', normal: [0, 0, 1], uAxis: [1, 0, 0], vAxis: [0, 1, 0], }, { id: 'negative-z', normal: [0, 0, -1], uAxis: [-1, 0, 0], vAxis: [0, 1, 0], }, ].map::<callback@146:8>` | `_createFaces` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 161 | method | `_copyVector` | `CubedSphereDirectionDomain` | called-by: Called by face construction to copy one exact vector with canonical zero components. | called-by | params 1/1; returns tagged |
| 171 | method | `_createUnitVectors` | `CubedSphereDirectionDomain` | called-by: Called by construction to generate source-local vectors in the retained binary64 oper... | called-by | params 1/1; returns tagged |
| 179 | callback | `Array.from::<callback@179:8>` | `_createUnitVectors` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 190 | method | `_createSourceLocalDirection` | `CubedSphereDirectionDomain` | called-by: Called by domain generation to create one source-local cubed-sphere vector. | called-by | params 2/2; returns tagged |
| 203 | callback | `[0, 1, 2].map::<callback@203:8>` | `cubePoint` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 222 | method | `_createPositiveFaceCenterIndices` | `CubedSphereDirectionDomain` | called-by: Called by construction to create the selected positive-axis face-center indices. | called-by | params 1/1; returns tagged |
| 238 | method | `_normalize` | `CubedSphereDirectionDomain` | called-by: Called by domain generation to normalize one nonzero vector. | called-by | params 1/1; returns tagged |
| 257 | method | `_assertIndex` | `CubedSphereDirectionDomain` | called-by: Called by addressing methods to assert one zero-based integer index. | called-by | params 3/3; throws 1 |
| 271 | method | `_assertUnitDirection` | `CubedSphereDirectionDomain` | called-by: Called by stencil resolution to validate one source-local unit direction. | called-by | params 2/2; returns tagged; throws 1 |
| 292 | method | `_selectDominantFace` | `CubedSphereDirectionDomain` | called-by: Called by stencil resolution to select the dominant face using retained face-order ti... | called-by | params 2/2; returns tagged |
| 314 | method | `_normalizedCoordinateToGrid` | `CubedSphereDirectionDomain` | called-by: Called by stencil resolution to map a normalized face coordinate onto the node grid. | called-by | params 2/2; returns tagged |
| 325 | method | `_gridLocation` | `CubedSphereDirectionDomain` | called-by: Called by stencil resolution to resolve one grid coordinate into its retained interpo... | called-by | params 2/2; returns tagged |
| 355 | method | `_addTap` | `CubedSphereDirectionDomain` | called-by: Called by stencil resolution to add one positive interpolation tap and combine duplic... | called-by | params 3/3 |
| 370 | method | `_createNormalizedStencil` | `CubedSphereDirectionDomain` | called-by: Called by stencil resolution to normalize accumulated interpolation taps in insertion... | called-by | params 1/1; returns tagged; throws 1 |
| 387 | callback | `weights.reduce::<callback@387:8>` | `total` | called-by: Called by Array.prototype.reduce to accumulate one collection value. | called-by | params 2/2; returns tagged |
| 406 | constructor | `<anonymous@406:2>` | `CubedSphereDirectionDomain` | creates: Creates one supported source-local cubed-sphere domain. | creates | params 1/1 |
| 439 | method | `flattenNodeIndex` | `CubedSphereDirectionDomain` | call-this-method: Call this method to flatten a face-local node in face-major, v-major, u-minor order. | active-callable | params 3/3; returns tagged |
| 453 | method | `unflattenNodeIndex` | `CubedSphereDirectionDomain` | call-this-method: Call this method to reverse the selected flattened storage order. | active-callable | params 1/1; returns tagged |
| 474 | method | `resolveStencil` | `CubedSphereDirectionDomain` | call-this-method: Call this method to resolve the retained dominant-face bilinear construction stencil.... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/domains/direction/fibonacci/consts.js`

Source: [src/algorithm32/domains/direction/fibonacci/consts.js](../../../../../../src/algorithm32/domains/direction/fibonacci/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | constant | `FIBONACCI_34_DIRECTION_DOMAIN_OWNER` | `<module>` | descriptive-other: Selected executable spherical/distant Fibonacci-34 quadrature. | entity/value | none |
| 8 | constant | `PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER` | `<module>` | descriptive-other: Selected executable paired-Fibonacci-34 incoming quadrature. | entity/value | none |

## `src/algorithm32/domains/direction/fibonacci/Fibonacci34DirectionDomain.js`

Source: [src/algorithm32/domains/direction/fibonacci/Fibonacci34DirectionDomain.js](../../../../../../src/algorithm32/domains/direction/fibonacci/Fibonacci34DirectionDomain.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `Fibonacci34DirectionDomain` | `<module>` | descriptive-other: Object that owns the executable spherical/distant Fibonacci-34 quadrature. | entity/value | none |
| 9 | field | `id` | `Fibonacci34DirectionDomain` | descriptive-other: Id value. | entity/value | none |
| 16 | field | `directionCount` | `Fibonacci34DirectionDomain` | descriptive-other: Direction count value. | entity/value | none |
| 23 | field | `unitVectors` | `Fibonacci34DirectionDomain` | descriptive-other: Unit vectors value. | entity/value | none |
| 30 | field | `integrationWeights` | `Fibonacci34DirectionDomain` | descriptive-other: Integration weights value. | entity/value | none |
| 39 | method | `_createUnitVectors` | `Fibonacci34DirectionDomain` | called-by: Called by the constructor to copy the exact selected production vectors. Pinning thes... | called-by | returns tagged |
| 80 | callback | `[ [-6.118005084603635e-17, 2.5299871800168635e-18, -1], [0.2583867092358571, 0.21776859209109395, -0.9411764705882353], [-0.06047561872892965, -0.4666861758575938, -0.8823529411764706], [-0.32625572688193644, 0.4640651986900299, -0.8235294117647058], [0.6293498265705433, -0.1383607939065001, -0.7647058823529411], [-0.6128542713455739, -0.3551615771725794, -0.7058823529411765], [0.22818601419818665, 0.7274929702870527, -0.6470588235294118], [0.34275994505487156, -0.7324580935591514, -0.5882352941176471], [-0.784182423271093, 0.3236991047619375, -0.5294117647058824], [0.8288129085212791, 0.3026811448889182, -0.47058823529411775], [-0.4200200543211491, -0.8087230557846601, -0.4117647058823529], [-0.24289760303025734, 0.9035669761526882, -0.35294117647058826], [0.8064353434318656, -0.5129881543978481, -0.29411764705882354], [-0.9570668804538879, -0.1692916552549343, -0.23529411764705882], [0.5988899689069839, 0.7811459125096165, -0.17647058823529416], [0.0868185942832923, -0.9892531027178263, -0.11764705882352941], [-0.7360920478942543, 0.6743206132207334, -0.058823529411764705], [1, 0, 0], [-0.7360920478942543, -0.6743206132207334, 0.058823529411764705], [0.0868185942832923, 0.9892531027178263, 0.11764705882352941], [0.5988899689069839, -0.7811459125096165, 0.17647058823529416], [-0.9570668804538879, 0.1692916552549343, 0.23529411764705882], [0.8064353434318656, 0.5129881543978481, 0.29411764705882354], [-0.24289760303025734, -0.9035669761526882, 0.35294117647058826], [-0.4200200543211491, 0.8087230557846601, 0.4117647058823529], [0.8288129085212791, -0.3026811448889182, 0.47058823529411775], [-0.784182423271093, -0.3236991047619375, 0.5294117647058824], [0.34275994505487156, 0.7324580935591514, 0.5882352941176471], [0.22818601419818665, -0.7274929702870527, 0.6470588235294118], [-0.6128542713455739, 0.3551615771725794, 0.7058823529411765], [0.6293498265705433, 0.1383607939065001, 0.7647058823529411], [-0.32625572688193644, -0.4640651986900299, 0.8235294117647058], [-0.06047561872892965, 0.4666861758575938, 0.8823529411764706], [0.2583867092358571, -0.21776859209109395, 0.9411764705882353], ].map::<callback@80:8>` | `_createUnitVectors` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 85 | constructor | `<anonymous@85:2>` | `Fibonacci34DirectionDomain` | creates: Creates the fixed production Fibonacci-34 incoming quadrature. | creates | none |
| 95 | callback | `Array.from::<callback@95:9>` | `Fibonacci34DirectionDomain` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |

## `src/algorithm32/domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js`

Source: [src/algorithm32/domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js](../../../../../../src/algorithm32/domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `PairedFibonacci34DirectionDomain` | `<module>` | descriptive-other: Object that owns the executable paired-Fibonacci-34 incoming quadrature. | entity/value | none |
| 9 | field | `id` | `PairedFibonacci34DirectionDomain` | descriptive-other: Id value. | entity/value | none |
| 16 | field | `directionCount` | `PairedFibonacci34DirectionDomain` | descriptive-other: Direction count value. | entity/value | none |
| 23 | field | `pairCount` | `PairedFibonacci34DirectionDomain` | descriptive-other: Number of paired directions. | entity/value | none |
| 30 | field | `unitVectors` | `PairedFibonacci34DirectionDomain` | descriptive-other: Unit vectors value. | entity/value | none |
| 37 | field | `integrationWeights` | `PairedFibonacci34DirectionDomain` | descriptive-other: Integration weights value. | entity/value | none |
| 49 | method | `_createUnitVectors` | `PairedFibonacci34DirectionDomain` | called-by: Called by the constructor to copy the exact selected production vectors. Pinning thes... | called-by | returns tagged |
| 90 | callback | `[ [0.029411764705882353, 0.9995673804686135, 0], [-0.029411764705882353, -0.9995673804686135, 0], [0.08823529411764706, -0.7344928888297714, -0.6728556525217496], [-0.08823529411764706, 0.7344928888297714, 0.6728556525217496], [0.14705882352941177, 0.08647521023124194, 0.9853404185547286], [-0.14705882352941177, -0.08647521023124194, -0.9853404185547286], [0.20588235294117646, 0.5954041234944898, -0.7765992444453981], [-0.20588235294117646, -0.5954041234944898, 0.7765992444453981], [0.2647058823529412, -0.9495879623539826, 0.16796873994931993], [-0.2647058823529412, 0.9495879623539826, -0.16796873994931993], [0.3235294117647059, 0.7983765439406489, 0.5078618058178509], [-0.3235294117647059, -0.7983765439406489, -0.5078618058178509], [0.38235294117647056, -0.23987862412859257, -0.892336525118117], [-0.38235294117647056, 0.23987862412859257, 0.892336525118117], [0.4411764705882353, -0.41362735298985337, 0.7964142983761122], [-0.4411764705882353, 0.41362735298985337, -0.7964142983761122], [0.5, 0.813476104932415, -0.29708016881640964], [-0.5, -0.813476104932415, 0.29708016881640964], [0.5588235294117647, -0.7665473823801899, -0.3164196162406141], [-0.5588235294117647, 0.7665473823801899, 0.3164196162406141], [0.6176470588235294, 0.333335975491162, 0.712319617987599], [-0.6176470588235294, -0.333335975491162, -0.712319617987599], [0.6764705882352942, 0.22041348246789388, -0.7027129143533443], [-0.6764705882352942, -0.22041348246789388, 0.7027129143533443], [0.7352941176470589, -0.5863953004239032, 0.3398280626940532], [-0.7352941176470589, 0.5863953004239032, -0.3398280626940532], [0.7941176470588235, 0.5935884415205595, 0.13049875372183153], [-0.7941176470588235, -0.5935884415205595, -0.13049875372183153], [0.8529411764705882, -0.3002216107411105, -0.4270343474768535], [-0.8529411764705882, 0.3002216107411105, 0.4270343474768535], [0.9117647058823529, -0.05278100354538891, 0.40730736154900044], [-0.9117647058823529, 0.05278100354538891, -0.40730736154900044], [0.9705882352941176, 0.18408593454310446, -0.1551478205197947], [-0.9705882352941176, -0.18408593454310446, 0.1551478205197947], ].map::<callback@90:8>` | `_createUnitVectors` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 95 | constructor | `<anonymous@95:2>` | `PairedFibonacci34DirectionDomain` | creates: Creates the fixed production paired-Fibonacci-34 quadrature. | creates | none |
| 103 | callback | `Array.from::<callback@103:9>` | `integrationWeights` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |

## `src/algorithm32/domains/index.js`

Source: [src/algorithm32/domains/index.js](../../../../../../src/algorithm32/domains/index.js)

No independently documentable declaration or callable target; this is a re-export-only barrel.

## `src/algorithm32/domains/position/spherical-native/consts.js`

Source: [src/algorithm32/domains/position/spherical-native/consts.js](../../../../../../src/algorithm32/domains/position/spherical-native/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `NATIVE_4_POSITION_DOMAIN_OWNER` | `<module>` | descriptive-other: Supported executable native spherical position owners. | entity/value | none |
| 9 | constant | `NATIVE_16_POSITION_DOMAIN_OWNER` | `<module>` | descriptive-other: Native 16 position domain owner constant. | entity/value | none |
| 14 | constant | `NATIVE_48_POSITION_DOMAIN_OWNER` | `<module>` | descriptive-other: Native 48 position domain owner constant. | entity/value | none |
| 20 | constant | `NATIVE_48_POSITION_COUNT` | `<module>` | descriptive-other: Established Native-48 position count. | entity/value | none |
| 23 | constant | `NATIVE_48_POSITION_NODES` | `<module>` | descriptive-other: Established Native-48 position nodes. | entity/value | none |

## `src/algorithm32/domains/position/spherical-native/SphericalNativePositionDomain.js`

Source: [src/algorithm32/domains/position/spherical-native/SphericalNativePositionDomain.js](../../../../../../src/algorithm32/domains/position/spherical-native/SphericalNativePositionDomain.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `SphericalNativePositionDomain` | `<module>` | descriptive-other: Executable native spherical position lattice. | entity/value | none |
| 9 | field | `id` | `SphericalNativePositionDomain` | descriptive-other: Unique identifier for the executable domain. | entity/value | none |
| 16 | field | `count` | `SphericalNativePositionDomain` | descriptive-other: Number of nodes in the native spherical lattice. | entity/value | none |
| 23 | field | `nodes` | `SphericalNativePositionDomain` | descriptive-other: Executable nodes in native storage order. | entity/value | none |
| 30 | field | `bottomRadius` | `SphericalNativePositionDomain` | descriptive-other: Unit-bearing ground radius used to generate the domain. | entity/value | none |
| 37 | field | `topRadius` | `SphericalNativePositionDomain` | descriptive-other: Unit-bearing atmosphere-top radius used to generate the domain. | entity/value | none |
| 46 | method | `_acceptDefinition` | `SphericalNativePositionDomain` | called-by: Called by construction to accept one complete supported domain definition. | called-by | params 1/1; returns tagged; throws 1 |
| 66 | method | `_createNodes` | `SphericalNativePositionDomain` | called-by: Called by construction to generate native nodes in the retained binary64 operation or... | called-by | params 3/3; returns tagged |
| 76 | callback | `Array.from::<callback@76:8>` | `_createNodes` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 100 | constructor | `<anonymous@100:2>` | `SphericalNativePositionDomain` | creates: Creates one supported native spherical position lattice. | creates | params 1/1 |

## `src/algorithm32/extraterrestrial/sun/FlatSynchronizer.js`

Source: [src/algorithm32/extraterrestrial/sun/FlatSynchronizer.js](../../../../../../src/algorithm32/extraterrestrial/sun/FlatSynchronizer.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | constant | `MILLISECONDS_PER_DAY` | `<module>` | descriptive-other: Milliseconds per day constant. | entity/value | none |
| 7 | constant | `MILLISECONDS_PER_SECOND` | `<module>` | descriptive-other: Milliseconds per second constant. | entity/value | none |
| 9 | constant | `SECONDS_PER_DAY` | `<module>` | descriptive-other: Seconds per day constant. | entity/value | none |
| 11 | constant | `MINUTES_PER_DAY` | `<module>` | descriptive-other: Minutes per day constant. | entity/value | none |
| 13 | constant | `DEGREES_PER_ORBIT` | `<module>` | descriptive-other: Degrees per orbit constant. | entity/value | none |
| 15 | constant | `RADIANS_PER_DEGREE` | `<module>` | descriptive-other: Radians per degree constant. | entity/value | none |
| 18 | class | `FlatSynchronizer` | `<module>` | descriptive-other: Flat-world Sun synchronization state for app-owned local Sun setup. | entity/value | none |
| 20 | field | `_calibrationMode` | `FlatSynchronizer` | descriptive-other: Selected calibration mode. @type {FlatSynchronizationMode \| null} | entity/value | none |
| 30 | method | `_positiveModulo` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to resolve a positive modulo for orbit and longitude calcu... | called-by | params 2/2; returns tagged |
| 41 | method | `_normalizeLongitude` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to normalize a longitude to `[-180, 180)` and canonicalize... | called-by | params 1/1; returns tagged |
| 54 | method | `_createPositionPacket` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to create one synchronized position packet from accepted o... | called-by | params 1/1; returns tagged |
| 79 | method | `_isLeapYear` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to determine whether one year contains 366 days. | called-by | params 1/1; returns tagged |
| 89 | method | `_utcDayOfYear` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to resolve the one-based UTC day of year. | called-by | params 1/1; returns tagged |
| 103 | method | `_fractionalYearRadians` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to resolve the NOAA-style fractional-year angle for one UT... | called-by | params 1/1; returns tagged |
| 122 | method | `_solarDeclinationDegrees` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to approximate solar declination for one fractional-year a... | called-by | params 1/1; returns tagged |
| 142 | method | `_equationOfTime` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to approximate the equation of time for one fractional-yea... | called-by | params 1/1; returns tagged |
| 160 | method | `_createWorldAnchor` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to create the UTC world anchor for one target date. | called-by | params 1/1; returns tagged |
| 189 | method | `_dateFromIsoTimestamp` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to convert one canonical ISO timestamp into a Date while r... | called-by | params 2/2; returns tagged; throws 1 |
| 212 | method | `_closestPointFrom` | `FlatSynchronizer` | called-by: Called by FlatSynchronizer to resolve a closest-approach point into latitude and norm... | called-by | params 1/1; returns tagged; throws 1 |
| 227 | method | `_assertWorldMode` | `FlatSynchronizer` | called-by: Called by flat synchronizer to fail loudly when position resolution is requested befo... | called-by | throws 1 |
| 238 | method | `calibrateToWorld` | `FlatSynchronizer` | call-this-method: Call this method to select world-synchronized calibration. | active-callable | returns tagged |
| 250 | method | `getPosition` | `FlatSynchronizer` | call-this-method: Call this method to resolve the synchronized flat Sun latitude/longitude for an insta... | active-callable | params 1/1; returns tagged |
| 282 | method | `getPositionFromClosest` | `FlatSynchronizer` | call-this-method: Call this method to resolve a position from a supplied closest-approach point and orb... | active-callable | params 3/3; returns tagged |
| 311 | method | `getTimeFromClosest` | `FlatSynchronizer` | call-this-method: Call this method to resolve the orbit time from a date, closest-approach point, and a... | active-callable | params 3/3; returns tagged |

## `src/algorithm32/geometry/flat/consts.js`

Source: [src/algorithm32/geometry/flat/consts.js](../../../../../../src/algorithm32/geometry/flat/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `FLAT_GEOMETRY_BOUNDARY_EPSILON` | `<module>` | descriptive-other: Shared numerical tolerance for flat plane and dome intersections. | entity/value | none |
| 5 | constant | `FLAT_GEOMETRY_IDENTITY_MATRIX4` | `<module>` | descriptive-other: Identity transform used before a renderer supplies live matrices. | entity/value | none |
| 12 | constant | `FLAT_OBSERVER_LOCAL_SCENE_FRAME` | `<module>` | descriptive-other: Selected observer-local mapping for z-up flat model space. | entity/value | none |
| 23 | constant | `FLAT_LOCAL_CACHE_DEFAULT_Z_NODE_FRACTIONS` | `<module>` | descriptive-other: Production local-cache altitude placement over the configured top. | entity/value | none |
| 50 | constant | `FLAT_LOCAL_CACHE_DEFAULT_RHO_NODE_FRACTIONS` | `<module>` | descriptive-other: Production local-cache radial placement over the configured bound. | entity/value | none |
| 72 | constant | `FLAT_ATMOSPHERE_PATH_DEFAULT_INTERVAL_COUNT` | `<module>` | descriptive-other: Generic geometry-only path discretization used when a direct caller omits one. Source... | entity/value | none |
| 80 | constant | `FLAT_LOCAL_CACHE_RHO_ZERO_RADIAL_DIRECTION` | `<module>` | descriptive-other: Rotationally arbitrary but deterministic radial representative used at the source sub... | entity/value | none |
| 83 | constant | `FLAT_GEOMETRY_CACHE_SYMBOLS_BY_PASS` | `<module>` | descriptive-other: Reusable construction capabilities supplied by flat geometry. | entity/value | none |
| 92 | constant | `FLAT_GEOMETRY_GROUND_REFLECTION_SYMBOL` | `<module>` | descriptive-other: Flat hit and construction-index reflective capability. | entity/value | none |

## `src/algorithm32/geometry/flat/FlatEarthGeometry.js`

Source: [src/algorithm32/geometry/flat/FlatEarthGeometry.js](../../../../../../src/algorithm32/geometry/flat/FlatEarthGeometry.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 20 | class | `FlatEarthGeometry` | `<module>` | descriptive-other: Flat z-up geometry for local-source atmosphere transport. | entity/value | none |
| 29 | method | `_deriveObserverCenteredDomeFacts` | `FlatEarthGeometry` | called-by: Called by FlatEarthGeometry to derive the configured final-view-only observer dome. I... | called-by | params 2/2; returns tagged; throws 1 |
| 81 | method | `_scaledDistanceNodes` | `FlatEarthGeometry` | called-by: Called by FlatEarthGeometry to scale one selected dimensionless node-placement profil... | called-by | params 2/2; returns tagged |
| 87 | callback | `fractions.map::<callback@87:8>` | `_scaledDistanceNodes` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 102 | method | `_cacheAxisNodes` | `FlatEarthGeometry` | called-by: Called by FlatEarthGeometry to normalize one optional explicit cache axis. It returns... | called-by | params 4/4; returns tagged; throws 1 |
| 118 | callback | `values.map::<callback@118:8>` | `_cacheAxisNodes` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged; throws 1 |
| 138 | constructor | `<anonymous@138:2>` | `FlatEarthGeometry` | creates: Creates flat Earth geometry for one observer, local source, and atmosphere domain. | creates | params 1/1; throws 2 |
| 236 | accessor-get | `configuration` | `FlatEarthGeometry` | descriptive-other: The immutable normalized geometry configuration. | entity/value | returns tagged |
| 245 | accessor-get | `runtimeDiagnostics` | `FlatEarthGeometry` | descriptive-other: The bounded runtime diagnostics recorded by tolerant paths. | entity/value | returns tagged |
| 254 | accessor-get | `id` | `FlatEarthGeometry` | descriptive-other: The compatibility identifier for this configured geometry model. | entity/value | returns tagged |
| 265 | method | `createLocalSunCachePositionDomain` | `FlatEarthGeometry` | call-this-method: Call this method to create the selected flattened z-major, rho-minor local position d... | active-callable | params 1/1; returns tagged |
| 279 | method | `createTransportData` | `FlatEarthGeometry` | call-this-method: Call this method to build packed local Jk-to-Lk transport data. The radial source fra... | active-callable | params 1/1; returns tagged |
| 289 | method | `createCacheModule` | `FlatEarthGeometry` | call-this-method: Call this method to create flat construction coordinates and symbols for one cache pass. | active-callable | params 1/1; returns tagged |
| 302 | method | `_diagnose` | `FlatEarthGeometry` | called-by: Called by FlatEarthGeometry to record one bounded runtime diagnostic. | called-by | params 4/4 |
| 322 | method | `distanceToTopAtmosphereBoundary` | `FlatEarthGeometry` | call-this-method: Call this method to resolve distance to the top atmosphere plane. It returns the valu... | active-callable | params 2/2; returns tagged |
| 346 | method | `distanceToGroundBoundary` | `FlatEarthGeometry` | call-this-method: Call this method to resolve distance to the ground plane. It returns the value from t... | active-callable | params 2/2; returns tagged |
| 369 | method | `resolveGroundIntersection` | `FlatEarthGeometry` | call-this-method: Call this method to resolve the nearest flat-ground hit along a physical ray. It retu... | active-callable | params 1/1; returns tagged |
| 394 | method | `distanceToObserverCenteredDomeBoundary` | `FlatEarthGeometry` | call-this-method: Call this method to resolve distance to the observer-centered dome boundary when conf... | active-callable | params 2/2; returns tagged |
| 442 | method | `_resolveFlatExitDistance` | `FlatEarthGeometry` | called-by: Called by FlatEarthGeometry to resolve the nearest configured flat-atmosphere exit di... | called-by | params 3/3; returns tagged |
| 453 | callback | `[ this.distanceToGroundBoundary(originPosition, direction), this.distanceToTopAtmosphereBoundary(originPosition, direction), this.distanceToObserverCenteredDomeBoundary(originPosition, direction), ].filter::<callback@453:8>` | `candidates` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 495 | method | `resolveAtmosphereCoordinate` | `FlatEarthGeometry` | call-this-method: Call this method to resolve flat model-space position into altitude-only atmosphere c... | active-callable | params 1/1; returns tagged |
| 532 | method | `_buildAtmospherePathSamples` | `FlatEarthGeometry` | called-by: Called by FlatEarthGeometry to build trapezoidal atmosphere-path samples over a norma... | called-by | params 4/4; returns tagged; throws 1 |
| 560 | method | `createShaderContribution` | `FlatEarthGeometry` | call-this-method: Call this method to create the geometry-owned flat shader contribution. | active-callable | returns tagged |
| 570 | method | `resolveViewRaySegment` | `FlatEarthGeometry` | call-this-method: Call this method to resolve a finite view ray segment for atmosphere transport. | active-callable | params 1/1; returns tagged |
| 608 | method | `resolveAtmospherePath` | `FlatEarthGeometry` | call-this-method: Call this method to resolve a model-space ray into an atmosphere path. Conditional re... | active-callable | params 1/1; returns tagged; throws 1 |
| 696 | method | `resolveSourceRelativePosition` | `FlatEarthGeometry` | call-this-method: Call this method to resolve a sample point into local source-relative facts. | active-callable | params 1/1; returns tagged |
| 742 | method | `resolveScatteringCachePositionStencil` | `FlatEarthGeometry` | call-this-method: Call this method to resolve bilinear final-view interpolation over the selected z/rho... | active-callable | params 1/1; returns tagged |
| 753 | method | `resolveScatteringCacheConstructionPositionStencil` | `FlatEarthGeometry` | call-this-method: Call this method to resolve bilinear construction interpolation over the selected z/r... | active-callable | params 1/1; returns tagged |
| 764 | method | `expressScatteringCacheDirection` | `FlatEarthGeometry` | call-this-method: Call this method to express a physical outgoing direction in the radial/tangent/verti... | active-callable | params 1/1; returns tagged |
| 775 | method | `resolveScatteringCacheDirectionStencil` | `FlatEarthGeometry` | call-this-method: Call this method to resolve a physical outgoing direction through W27 reconstruction. | active-callable | params 1/1; returns tagged |
| 786 | method | `expressPhysicalScatteringCacheDirection` | `FlatEarthGeometry` | call-this-method: Call this method to express one radial-frame cache direction in physical model space. | active-callable | params 1/1; returns tagged |
| 799 | method | `resolveCacheBuildRay` | `FlatEarthGeometry` | call-this-method: Call this method to resolve a source-owned cache coordinate into its reusable physica... | active-callable | params 1/1; returns tagged |
| 810 | method | `mapObserverLocalScenePointToModelPosition` | `FlatEarthGeometry` | call-this-method: Call this method to map an observer-local scene point to flat model-space meters. | active-callable | params 2/2; returns tagged |
| 820 | method | `mapObserverLocalSceneDirectionToModelDirection` | `FlatEarthGeometry` | call-this-method: Call this method to map an observer-local scene direction to flat model-space direction. | active-callable | params 1/1; returns tagged |
| 831 | method | `mapGroundOffsetToScenePoint` | `FlatEarthGeometry` | call-this-method: Call this method to map an app-authored ground offset to the configured Three scene p... | active-callable | params 2/2; returns tagged |
| 842 | method | `projectScenePointToGroundAlongDirection` | `FlatEarthGeometry` | call-this-method: Call this method to project a scene point to the flat ground plane along a scene dire... | active-callable | params 2/2; returns tagged |
| 853 | method | `mapModelPositionToObserverLocalScenePoint` | `FlatEarthGeometry` | call-this-method: Call this method to map a flat model-space position to an observer-local scene point. | active-callable | params 2/2; returns tagged |
| 864 | method | `createThreeEndpointObjects` | `FlatEarthGeometry` | call-this-method: Call this method to create geometry-owned Three ground endpoint objects. | active-callable | params 1/1; returns tagged |
| 875 | method | `resolveSceneDepthMax` | `FlatEarthGeometry` | call-this-method: Call this method to resolve the scene-depth capture cap for geometry-owned flat endpo... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/geometry/flat/FlatGeometryCacheModuleProvider.js`

Source: [src/algorithm32/geometry/flat/FlatGeometryCacheModuleProvider.js](../../../../../../src/algorithm32/geometry/flat/FlatGeometryCacheModuleProvider.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 9 | class | `FlatGeometryCacheModuleProvider` | `<module>` | descriptive-other: Provider of geometry-owned flat cache-build modules. | entity/value | none |
| 18 | method | `_createDirectionCacheData` | `FlatGeometryCacheModuleProvider` | called-by: Called by FlatGeometryCacheModuleProvider to pack three-component local directions fo... | called-by | params 3/3; returns tagged |
| 29 | callback | `directions.flatMap::<callback@29:9>` | `_createDirectionCacheData` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 1/1; returns tagged |
| 39 | constructor | `<anonymous@39:2>` | `FlatGeometryCacheModuleProvider` | creates: Creates the flat geometry cache-module provider for one normalized configuration. | creates | params 1/1 |
| 50 | method | `createCacheModule` | `FlatGeometryCacheModuleProvider` | call-this-method: Call this method to create flat construction coordinates and symbols for one cache pass. | active-callable | params 1/1; returns tagged |
| 73 | callback | `domains.positionNodes.flatMap::<callback@73:9>` | `coordinateValues` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 1/1; returns tagged |

## `src/algorithm32/geometry/flat/FlatGeometryShaderContributor.js`

Source: [src/algorithm32/geometry/flat/FlatGeometryShaderContributor.js](../../../../../../src/algorithm32/geometry/flat/FlatGeometryShaderContributor.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 9 | class | `FlatGeometryShaderContributor` | `<module>` | descriptive-other: Provider of the geometry-owned runtime shader contribution for flat atmosphere transp... | entity/value | none |
| 15 | constructor | `<anonymous@15:2>` | `FlatGeometryShaderContributor` | creates: Creates the flat geometry shader contributor for one normalized configuration. | creates | params 1/1 |
| 24 | method | `createShaderContribution` | `FlatGeometryShaderContributor` | call-this-method: Call this method to create the geometry-owned flat shader contribution. Conditional r... | active-callable | returns tagged |
| 41 | callback | `facts.cacheAltitudeNodes.map::<callback@41:8>` | `cacheAltitudeNodesMeters` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 48 | callback | `facts.cacheRadialNodes.map::<callback@48:8>` | `cacheRadialNodesMeters` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |

## `src/algorithm32/geometry/flat/FlatScatteringCacheGeometry.js`

Source: [src/algorithm32/geometry/flat/FlatScatteringCacheGeometry.js](../../../../../../src/algorithm32/geometry/flat/FlatScatteringCacheGeometry.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 11 | class | `FlatScatteringCacheGeometry` | `<module>` | descriptive-other: Flat scattering-cache coordinates, physical directions, rays, and packed transport. | entity/value | none |
| 20 | method | `_uniformDistanceNodes` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to create evenly spaced nodes over one closed p... | called-by | params 2/2; returns tagged; throws 1 |
| 32 | callback | `Array.from::<callback@32:8>` | `_uniformDistanceNodes` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 43 | method | `_localCacheDirectionFrame` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to resolve the radial, tangent, and vertical lo... | called-by | params 2/2; returns tagged |
| 68 | method | `_localCacheDirection` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to express one physical direction in the local ... | called-by | params 3/3; returns tagged |
| 86 | method | `_physicalCacheDirection` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to express one local radial-frame direction in ... | called-by | params 3/3; returns tagged |
| 107 | method | `_cacheAxisStencil` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to resolve one scalar against an ordered physic... | called-by | params 2/2; returns tagged |
| 173 | method | `_flattenPositionIndex` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to flatten one z-major, rho-minor position index. | called-by | params 3/3; returns tagged |
| 184 | method | `_cachePositionDomainAxes` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to read selected local executable position axes. | called-by | params 2/2; returns tagged |
| 204 | method | `_cacheRadialBoundaryDistance` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to resolve the positive exit from the selected ... | called-by | params 4/4; returns tagged |
| 232 | method | `_resolveReusableBoundary` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to resolve one reusable construction ray's near... | called-by | params 2/2; returns tagged; throws 1 |
| 257 | callback | `[ { kind: 'ground', distance: this._geometry.distanceToGroundBoundary(originPosition, direction), }, { kind: 'top-atmosphere', distance: this._geometry.distanceToTopAtmosphereBoundary(originPosition, direction), }, { kind: 'cache-radial-boundary', distance: this._cacheRadialBoundaryDistance( origin, direction, this._configuration.cacheRadialMaximum.value, this._configuration.sourceSubpoint.coordinates, ), }, ].filter::<callback@257:8>` | `candidates` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 271 | callback | `candidates.reduce::<callback@271:9>` | `_resolveReusableBoundary` | called-by: Called by Array.prototype.reduce to accumulate one collection value. It returns the c... | called-by | params 2/2; returns tagged |
| 282 | constructor | `<anonymous@282:2>` | `FlatScatteringCacheGeometry` | creates: Creates the flat scattering-cache geometry paired with one physical geometry owner. | creates | params 2/2 |
| 296 | method | `createLocalSunCachePositionDomain` | `FlatScatteringCacheGeometry` | call-this-method: Call this method to create the selected flattened z-major, rho-minor local position d... | active-callable | params 1/1; returns tagged; throws 1 |
| 375 | method | `_createTransportQueryTaps` | `FlatScatteringCacheGeometry` | called-by: Called by FlatScatteringCacheGeometry to build one local position-major transport query. | called-by | params 1/1; returns tagged |
| 456 | method | `createTransportData` | `FlatScatteringCacheGeometry` | call-this-method: Call this method to build packed local Jk-to-Lk transport data. The radial source fra... | active-callable | params 1/1; returns tagged; throws 1 |
| 485 | callback | `tapsByQuery.map::<callback@485:9>` | `tapCount` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 536 | method | `resolveScatteringCachePositionStencil` | `FlatScatteringCacheGeometry` | call-this-method: Call this method to resolve bilinear final-view interpolation over the selected z/rho... | active-callable | params 1/1; returns tagged |
| 576 | method | `resolveScatteringCacheConstructionPositionStencil` | `FlatScatteringCacheGeometry` | call-this-method: Call this method to resolve bilinear construction interpolation over the selected z/r... | active-callable | params 1/1; returns tagged |
| 588 | method | `expressScatteringCacheDirection` | `FlatScatteringCacheGeometry` | call-this-method: Call this method to express a physical outgoing direction in the radial/tangent/verti... | active-callable | params 1/1; returns tagged |
| 606 | method | `resolveScatteringCacheDirectionStencil` | `FlatScatteringCacheGeometry` | call-this-method: Call this method to resolve a physical outgoing direction through W27 reconstruction. | active-callable | params 1/1; returns tagged |
| 618 | method | `expressPhysicalScatteringCacheDirection` | `FlatScatteringCacheGeometry` | call-this-method: Call this method to express one radial-frame cache direction in physical model space. | active-callable | params 1/1; returns tagged |
| 635 | method | `resolveCacheBuildRay` | `FlatScatteringCacheGeometry` | call-this-method: Call this method to resolve a source-owned cache coordinate into its reusable physica... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/geometry/flat/three/ExactFlatGroundObject.js`

Source: [src/algorithm32/geometry/flat/three/ExactFlatGroundObject.js](../../../../../../src/algorithm32/geometry/flat/three/ExactFlatGroundObject.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | constant | `EPSILON` | `<module>` | descriptive-other: Epsilon constant. | entity/value | none |
| 9 | class | `ExactFlatGroundObject` | `<module>` | descriptive-other: Object that provides an exact flat ground endpoint for Three raycasters. | entity/value | none |
| 17 | constructor | `<anonymous@17:2>` | `ExactFlatGroundObject` | creates: Creates an exact flat ground endpoint. | creates | params 1/1; throws 1 |
| 69 | method | `raycast` | `ExactFlatGroundObject` | call-this-method: Call this method to intersect a Three raycaster with the exact observer-local ground ... | active-callable | params 2/2 |

## `src/algorithm32/geometry/flat/three/FlatGeometrySceneAdapter.js`

Source: [src/algorithm32/geometry/flat/three/FlatGeometrySceneAdapter.js](../../../../../../src/algorithm32/geometry/flat/three/FlatGeometrySceneAdapter.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 14 | class | `FlatGeometrySceneAdapter` | `<module>` | descriptive-other: Observer-local scene mapping and Three endpoint adaptation for flat geometry. | entity/value | none |
| 21 | method | `_flatGroundExtentMeters` | `FlatGeometrySceneAdapter` | called-by: Called by FlatGeometrySceneAdapter to resolve a renderable flat-ground extent in meters. | called-by | params 1/1; returns tagged |
| 32 | callback | `[ configuration.sceneSkyRayLimit?.value, configuration.observerCenteredDome?.maxObserverViewRayExtent.value, configuration.topAltitude.value * 20, 10000, ].filter::<callback@32:8>` | `extentCandidates` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 45 | method | `_cameraPositionMetersOrNull` | `FlatGeometrySceneAdapter` | called-by: Called by FlatGeometrySceneAdapter to resolve an optional camera position in flat mod... | called-by | params 2/2; returns tagged |
| 83 | method | `_createVisualMaterial` | `FlatGeometrySceneAdapter` | called-by: Called by FlatGeometrySceneAdapter to create the visual ground material requested by ... | called-by | params 1/1; returns tagged |
| 115 | method | `_modelPositionToObserverLocalScenePoint` | `FlatGeometrySceneAdapter` | called-by: Called by FlatGeometrySceneAdapter to convert one model position into the observer-lo... | called-by | params 2/2; returns tagged |
| 130 | constructor | `<anonymous@130:2>` | `FlatGeometrySceneAdapter` | creates: Creates the flat geometry scene adapter for one normalized configuration. | creates | params 1/1 |
| 142 | method | `mapObserverLocalScenePointToModelPosition` | `FlatGeometrySceneAdapter` | call-this-method: Call this method to map an observer-local scene point to flat model-space meters. | active-callable | params 2/2; returns tagged |
| 162 | method | `mapObserverLocalSceneDirectionToModelDirection` | `FlatGeometrySceneAdapter` | call-this-method: Call this method to map an observer-local scene direction to flat model-space direction. | active-callable | params 1/1; returns tagged |
| 179 | method | `mapGroundOffsetToScenePoint` | `FlatGeometrySceneAdapter` | call-this-method: Call this method to map an app-authored ground offset to the configured Three scene p... | active-callable | params 2/2; returns tagged |
| 197 | method | `projectScenePointToGroundAlongDirection` | `FlatGeometrySceneAdapter` | call-this-method: Call this method to project a scene point to the flat ground plane along a scene dire... | active-callable | params 2/2; returns tagged |
| 225 | method | `mapModelPositionToObserverLocalScenePoint` | `FlatGeometrySceneAdapter` | call-this-method: Call this method to map a flat model-space position to an observer-local scene point. | active-callable | params 2/2; returns tagged |
| 239 | method | `createThreeEndpointObjects` | `FlatGeometrySceneAdapter` | call-this-method: Call this method to create geometry-owned Three ground endpoint objects. Conditional ... | active-callable | params 1/1; returns tagged |
| 323 | method | `resolveSceneDepthMax` | `FlatGeometrySceneAdapter` | call-this-method: Call this method to resolve the scene-depth capture cap for geometry-owned flat endpo... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/geometry/shared/GeometryDirections.js`

Source: [src/algorithm32/geometry/shared/GeometryDirections.js](../../../../../../src/algorithm32/geometry/shared/GeometryDirections.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 11 | function | `directionTuple` | `<module>` | called-by: Called by this module to accept one finite three-component direction tuple. | called-by | params 2/2; returns tagged; throws 1 |
| 27 | function | `normalizeDirection` | `<module>` | called-by: Called by this module to normalize a finite non-zero direction at an ingress. | called-by | params 2/2; returns tagged; throws 1 |
| 46 | function | `normalizeTrustedDirection` | `<module>` | called-by: Called by this module to normalize an accepted non-zero direction without repeating i... | called-by | params 2/2; returns tagged; throws 1 |
| 63 | function | `threeVectorTuple` | `<module>` | called-by: Called by this module to read a Three-style vector at a renderer ingress. | called-by | params 2/2; returns tagged; throws 1 |
| 81 | constant | `GeometryDirections` | `<module>` | descriptive-other: Geometry-neutral direction and Three-vector conversion operations. | entity/value | none |

## `src/algorithm32/geometry/shared/GeometryVisualRequestValues.js`

Source: [src/algorithm32/geometry/shared/GeometryVisualRequestValues.js](../../../../../../src/algorithm32/geometry/shared/GeometryVisualRequestValues.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | function | `clampByte` | `<module>` | called-by: Called by this module to clamp a display channel to a byte. | called-by | params 1/1; returns tagged |
| 22 | function | `endpointShadowOrNull` | `<module>` | called-by: Called by this module to normalize an optional endpoint shadow-receiver request. It r... | called-by | params 1/1; returns tagged; throws 1 |
| 57 | function | `displayRgbaOrNull` | `<module>` | called-by: Called by this module to normalize optional display RGBA channels. It returns the val... | called-by | params 1/1; returns tagged; throws 1 |
| 69 | callback | `value.every::<callback@69:8>` | `displayRgbaOrNull` | called-by: Called by Array.prototype.every to test one collection value against the shared condi... | called-by | params 1/1; returns tagged |
| 90 | function | `materialLightingOrDefault` | `<module>` | called-by: Called by this module to resolve visual material lighting with its basic-material def... | called-by | params 1/1; returns tagged; throws 1 |
| 101 | constant | `GeometryVisualRequestValues` | `<module>` | descriptive-other: Geometry endpoint-shadow and visual request-value operations. | entity/value | none |

## `src/algorithm32/geometry/spherical/consts.js`

Source: [src/algorithm32/geometry/spherical/consts.js](../../../../../../src/algorithm32/geometry/spherical/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `SPHERICAL_GROUND_BOUNDARY_ROUNDOFF_ULPS` | `<module>` | descriptive-other: Floating-point ULP allowance for spherical ground-boundary intersections. | entity/value | none |
| 5 | constant | `SPHERICAL_GEOMETRY_IDENTITY_MATRIX4` | `<module>` | descriptive-other: Identity matrix for default spherical geometry shader bindings. | entity/value | none |
| 12 | constant | `SPHERICAL_MODEL_SPACE_SCENE_FRAME` | `<module>` | descriptive-other: Direct model-space scene frame for spherical geometry. | entity/value | none |
| 20 | constant | `SCATTERING_CACHE_BASIS_TOLERANCE` | `<module>` | descriptive-other: Accepted executable source-frame basis tolerance. | entity/value | none |
| 23 | constant | `FIBONACCI_REFERENCE_SWITCH_DOT` | `<module>` | descriptive-other: Dot-product threshold for the alternate Fibonacci reference axis. | entity/value | none |
| 30 | constant | `SCATTERING_CACHE_X_AXIS` | `<module>` | descriptive-other: Positive x axis for spherical scattering-cache frames. | entity/value | none |
| 36 | constant | `SCATTERING_CACHE_Y_AXIS` | `<module>` | descriptive-other: Positive y axis for spherical scattering-cache frames. | entity/value | none |
| 42 | constant | `SCATTERING_CACHE_Z_AXIS` | `<module>` | descriptive-other: Positive z axis for spherical scattering-cache frames. | entity/value | none |
| 45 | constant | `SPHERICAL_GEOMETRY_CACHE_SYMBOLS_BY_PASS` | `<module>` | descriptive-other: Construction capabilities supplied by spherical geometry for each cache pass. | entity/value | none |
| 54 | constant | `SPHERICAL_GEOMETRY_GROUND_REFLECTION_SYMBOL` | `<module>` | descriptive-other: Spherical hit and retained-index reflective capability symbol. | entity/value | none |

## `src/algorithm32/geometry/spherical/SphericalEarthGeometry.js`

Source: [src/algorithm32/geometry/spherical/SphericalEarthGeometry.js](../../../../../../src/algorithm32/geometry/spherical/SphericalEarthGeometry.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 11 | class | `SphericalEarthGeometry` | `<module>` | descriptive-other: Spherical radial geometry for distant-source atmosphere transport. | entity/value | none |
| 18 | method | `_makeObserverLocalSceneFrame` | `SphericalEarthGeometry` | called-by: Called by SphericalEarthGeometry construction to derive the observer-local scene frame. | called-by | params 1/1; returns tagged |
| 49 | method | `_normalizeSceneFrame` | `SphericalEarthGeometry` | called-by: Called by SphericalEarthGeometry construction to select the executable scene-to-model... | called-by | params 2/2; returns tagged; throws 2 |
| 74 | constructor | `<anonymous@74:2>` | `SphericalEarthGeometry` | creates: Creates spherical Earth geometry for the configured radii, observer, source, and cach... | creates | params 1/1; throws 2 |
| 144 | accessor-get | `configuration` | `SphericalEarthGeometry` | descriptive-other: The immutable normalized geometry configuration. | entity/value | returns tagged |
| 153 | accessor-get | `id` | `SphericalEarthGeometry` | descriptive-other: The compatibility identifier for this configured geometry model. | entity/value | returns tagged |
| 163 | method | `createTransportData` | `SphericalEarthGeometry` | call-this-method: Call this method to build geometry-resolved packed Jk-to-Lk transport data. | active-callable | params 1/1; returns tagged |
| 173 | method | `createCacheModule` | `SphericalEarthGeometry` | call-this-method: Call this method to create spherical construction coordinates and symbols for one cac... | active-callable | params 1/1; returns tagged |
| 184 | method | `distanceToTopAtmosphereBoundary` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve distance to the top atmosphere sphere. | active-callable | params 2/2; returns tagged |
| 203 | method | `distanceToGroundBoundary` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve distance to the ground sphere when the ray hits it. | active-callable | params 2/2; returns tagged |
| 231 | method | `resolveGroundIntersection` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve the nearest spherical ground hit along a physical ray. It... | active-callable | params 1/1; returns tagged |
| 258 | method | `_resolveAtmosphereExitDistance` | `SphericalEarthGeometry` | called-by: Called by spherical ray resolution to select the first atmosphere or ground boundary. | called-by | params 2/2; returns tagged |
| 276 | method | `_originAtAltitude` | `SphericalEarthGeometry` | called-by: Called by spherical path and cache construction to place one altitude along observer up. | called-by | params 1/1; returns tagged |
| 289 | method | `resolveAtmosphereCoordinate` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve model-space position into altitude-only atmosphere coordi... | active-callable | params 1/1; returns tagged |
| 303 | method | `resolveScatteringCacheConstructionPosition` | `SphericalEarthGeometry` | call-this-method: Call this method to reconstruct one executable native construction position. | active-callable | params 1/1; returns tagged |
| 313 | method | `resolveGroundRelativePosition` | `SphericalEarthGeometry` | call-this-method: Call this method to express a model-space position relative to the observer-side grou... | active-callable | params 1/1; returns tagged |
| 333 | method | `_buildAtmospherePathSamples` | `SphericalEarthGeometry` | called-by: Called by atmosphere-path resolution to build trapezoidal samples over a normalized r... | called-by | params 4/4; returns tagged; throws 1 |
| 362 | method | `_blockedPath` | `SphericalEarthGeometry` | called-by: Called by atmosphere-path resolution to build a zero-length path blocked by spherical... | called-by | params 1/1; returns tagged |
| 380 | method | `altitudeToCacheBinIndex` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve an altitude into the retained construction cache bin. | active-callable | params 1/1; returns tagged |
| 389 | method | `createShaderContribution` | `SphericalEarthGeometry` | call-this-method: Call this method to create the geometry-owned spherical shader contribution. | active-callable | returns tagged |
| 400 | method | `resolveViewRaySegment` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve a finite view ray segment for atmosphere transport. | active-callable | params 1/1; returns tagged; throws 1 |
| 442 | method | `resolveAtmospherePath` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve a model-space ray into an atmosphere path. It returns the... | active-callable | params 1/1; returns tagged |
| 501 | method | `resolveSourceRelativePosition` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve the configured distant source-relative directions. | active-callable | params 1/1; returns tagged |
| 523 | method | `resolveScatteringCachePositionStencil` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve final-view interpolation over the actual Native-48 altitu... | active-callable | params 1/1; returns tagged |
| 533 | method | `resolveScatteringCacheConstructionPositionStencil` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve the retained containing-altitude-bin construction lookup. | active-callable | params 1/1; returns tagged |
| 543 | method | `expressScatteringCacheDirection` | `SphericalEarthGeometry` | call-this-method: Call this method to express a physical direction in the executable W27 frame. | active-callable | params 1/1; returns tagged |
| 553 | method | `resolveScatteringCacheDirectionStencil` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve a physical outgoing direction through W27 reconstruction. | active-callable | params 1/1; returns tagged |
| 563 | method | `expressPhysicalScatteringCacheDirection` | `SphericalEarthGeometry` | call-this-method: Call this method to express one W27 scattering direction in physical model space. | active-callable | params 1/1; returns tagged |
| 573 | method | `expressPhysicalIncomingRadianceDirection` | `SphericalEarthGeometry` | call-this-method: Call this method to express one incoming-radiance direction in physical model space. | active-callable | params 1/1; returns tagged |
| 583 | method | `expressPhysicalOutgoingScatteringDirection` | `SphericalEarthGeometry` | call-this-method: Call this method to express one outgoing-scattering direction in physical model space. | active-callable | params 1/1; returns tagged |
| 594 | method | `mapObserverLocalScenePointToModelPosition` | `SphericalEarthGeometry` | call-this-method: Call this method to map an observer-local scene point into spherical model space. | active-callable | params 2/2; returns tagged |
| 604 | method | `mapObserverLocalSceneDirectionToModelDirection` | `SphericalEarthGeometry` | call-this-method: Call this method to map an observer-local scene direction into spherical model space. | active-callable | params 1/1; returns tagged |
| 614 | method | `resolveCacheBuildRay` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve a cache-owned coordinate into its construction ray. It re... | active-callable | params 1/1; returns tagged |
| 644 | method | `mapGroundOffsetToScenePoint` | `SphericalEarthGeometry` | call-this-method: Call this method to map an app-authored ground offset into the configured Three scene. | active-callable | params 2/2; returns tagged |
| 656 | method | `projectScenePointToGroundAlongDirection` | `SphericalEarthGeometry` | call-this-method: Call this method to project a scene point to the local spherical ground. | active-callable | params 3/3; returns tagged |
| 666 | method | `createThreeEndpointObjects` | `SphericalEarthGeometry` | call-this-method: Call this method to create geometry-owned Three ground endpoint objects. | active-callable | params 1/1; returns tagged |
| 676 | method | `resolveSceneDepthMax` | `SphericalEarthGeometry` | call-this-method: Call this method to resolve the scene-depth cap for spherical endpoints. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/geometry/spherical/SphericalGeometryCacheModuleProvider.js`

Source: [src/algorithm32/geometry/spherical/SphericalGeometryCacheModuleProvider.js](../../../../../../src/algorithm32/geometry/spherical/SphericalGeometryCacheModuleProvider.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 8 | class | `SphericalGeometryCacheModuleProvider` | `<module>` | descriptive-other: Geometry-owned spherical cache-construction module provider. | entity/value | none |
| 15 | constructor | `<anonymous@15:2>` | `SphericalGeometryCacheModuleProvider` | creates: Creates a spherical cache-module provider for normalized geometry and cache coordinates. | creates | params 2/2 |
| 28 | method | `_createDirectionCacheData` | `SphericalGeometryCacheModuleProvider` | called-by: Called by cache-module construction to pack three-component direction rows. | called-by | params 3/3; returns tagged |
| 39 | callback | `directions.flatMap::<callback@39:9>` | `_createDirectionCacheData` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 1/1; returns tagged |
| 50 | method | `createCacheModule` | `SphericalGeometryCacheModuleProvider` | call-this-method: Call this method to create spherical coordinates and symbols for one cache pass. | active-callable | params 1/1; returns tagged |
| 82 | callback | `domains.positionNodes.map::<callback@82:10>` | `positionData` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |

## `src/algorithm32/geometry/spherical/SphericalGeometryShaderContributor.js`

Source: [src/algorithm32/geometry/spherical/SphericalGeometryShaderContributor.js](../../../../../../src/algorithm32/geometry/spherical/SphericalGeometryShaderContributor.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 8 | class | `SphericalGeometryShaderContributor` | `<module>` | descriptive-other: Geometry-owned spherical final-view shader contribution provider. | entity/value | none |
| 14 | constructor | `<anonymous@14:2>` | `SphericalGeometryShaderContributor` | creates: Creates a spherical shader contributor for normalized geometry. | creates | params 1/1 |
| 23 | method | `createShaderContribution` | `SphericalGeometryShaderContributor` | call-this-method: Call this method to create the geometry-owned spherical shader contribution. | active-callable | returns tagged |
| 40 | callback | `NATIVE_48_POSITION_NODES.map::<callback@40:8>` | `cachePositionNodesMeters` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |

## `src/algorithm32/geometry/spherical/SphericalScatteringCacheGeometry.js`

Source: [src/algorithm32/geometry/spherical/SphericalScatteringCacheGeometry.js](../../../../../../src/algorithm32/geometry/spherical/SphericalScatteringCacheGeometry.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 21 | class | `SphericalScatteringCacheGeometry` | `<module>` | descriptive-other: Spherical cache-coordinate, source-frame, stencil, and transport operations. | entity/value | none |
| 28 | method | `_canonicalZero` | `SphericalScatteringCacheGeometry` | called-by: Called by spherical frame construction and conversion to preserve positive zero in ve... | called-by | params 1/1; returns tagged |
| 39 | method | `_dot` | `SphericalScatteringCacheGeometry` | called-by: Called by spherical frame construction and conversion to evaluate a dot product in re... | called-by | params 2/2; returns tagged |
| 50 | method | `_subtract` | `SphericalScatteringCacheGeometry` | called-by: Called by spherical frame construction to subtract one three-component vector from an... | called-by | params 2/2; returns tagged |
| 61 | method | `_scale` | `SphericalScatteringCacheGeometry` | called-by: Called by spherical frame construction to scale one vector with canonical zero compon... | called-by | params 2/2; returns tagged |
| 76 | method | `_cross` | `SphericalScatteringCacheGeometry` | called-by: Called by spherical frame construction to evaluate one three-component cross product. | called-by | params 2/2; returns tagged |
| 91 | method | `_normalizeWithSquareRoot` | `SphericalScatteringCacheGeometry` | called-by: Called by Fibonacci frame construction and conversion to normalize in retained square... | called-by | params 1/1; returns tagged; throws 1 |
| 107 | method | `_normalizeWithHypot` | `SphericalScatteringCacheGeometry` | called-by: Called by W27 frame construction and conversion to normalize in retained hypot order. | called-by | params 1/1; returns tagged; throws 1 |
| 126 | method | `_leastAlignedCartesianAxis` | `SphericalScatteringCacheGeometry` | called-by: Called by W27 frame construction to select the least-aligned Cartesian fallback with ... | called-by | params 1/1; returns tagged |
| 133 | callback | `[SCATTERING_CACHE_X_AXIS, SCATTERING_CACHE_Y_AXIS, SCATTERING_CACHE_Z_AXIS].reduce::<callback@133:8>` | `_leastAlignedCartesianAxis` | called-by: Called by Array.prototype.reduce to accumulate one collection value. It returns the c... | called-by | params 2/2; returns tagged |
| 146 | method | `_createW27Frame` | `SphericalScatteringCacheGeometry` | called-by: Called by both W27 conversion directions to create their shared source-aligned physic... | called-by | params 1/1; returns tagged |
| 170 | method | `_physicalDirectionInFrame` | `SphericalScatteringCacheGeometry` | called-by: Called by cache-direction conversion to express one trusted source-local direction th... | called-by | params 3/3; returns tagged |
| 199 | method | `_physicalFibonacciDirection` | `SphericalScatteringCacheGeometry` | called-by: Called by transport and incoming-radiance conversion to express one Fibonacci directi... | called-by | params 2/2; returns tagged |
| 220 | method | `_physicalW27Direction` | `SphericalScatteringCacheGeometry` | called-by: Called by outgoing-scattering conversion to express one W27 direction in physical space. | called-by | params 2/2; returns tagged |
| 231 | method | `_localW27Direction` | `SphericalScatteringCacheGeometry` | called-by: Called by spherical cache lookup and transport to express a physical direction in the... | called-by | params 2/2; returns tagged |
| 246 | constructor | `<anonymous@246:2>` | `SphericalScatteringCacheGeometry` | creates: Creates spherical scattering-cache operations for normalized geometry. | creates | params 1/1 |
| 256 | method | `_cachePositionAtAltitude` | `SphericalScatteringCacheGeometry` | called-by: Called by transport packing and construction-position resolution to place one altitud... | called-by | params 1/1; returns tagged |
| 270 | method | `_transportGroundDistance` | `SphericalScatteringCacheGeometry` | called-by: Called by transport packing to resolve the first positive ground intersection. | called-by | params 2/2; returns tagged |
| 293 | method | `_transportTopDistance` | `SphericalScatteringCacheGeometry` | called-by: Called by transport packing to resolve the selected positive top-atmosphere distance. | called-by | params 2/2; returns tagged |
| 310 | method | `_transportPositionIndex` | `SphericalScatteringCacheGeometry` | called-by: Called by transport packing to resolve the retained containing-altitude-bin index. | called-by | params 2/2; returns tagged |
| 324 | method | `_createTransportQueryTaps` | `SphericalScatteringCacheGeometry` | called-by: Called by transport packing to build one position-major query in the selected operati... | called-by | params 1/1; returns tagged |
| 399 | method | `usesDefaultConstructionDomains` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to detect the selected production construction lattice. | active-callable | params 1/1; returns tagged |
| 415 | method | `assertConstructionDomainAlignment` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to require geometry and source-domain alignment. | active-callable | params 1/1; throws 1 |
| 430 | method | `createTransportData` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to build geometry-resolved packed Jk-to-Lk transport data. Condition... | active-callable | params 1/1; returns tagged |
| 439 | callback | `domains.incomingUnitVectors.map::<callback@439:8>` | `physicalDirections` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 446 | callback | `physicalDirections.map::<callback@446:8>` | `directionStencils` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 476 | callback | `tapsByQuery.map::<callback@476:9>` | `tapCount` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 529 | method | `altitudeToCacheBinIndex` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to resolve an altitude into the retained construction cache bin. | active-callable | params 1/1; returns tagged |
| 546 | method | `resolveScatteringCacheConstructionPosition` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to reconstruct one executable native construction position. | active-callable | params 1/1; returns tagged |
| 558 | method | `resolveScatteringCachePositionStencil` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to resolve final-view interpolation over the actual Native-48 altitu... | active-callable | params 1/1; returns tagged |
| 609 | method | `resolveScatteringCacheConstructionPositionStencil` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to resolve the retained containing-altitude-bin construction lookup. | active-callable | params 1/1; returns tagged |
| 626 | method | `expressScatteringCacheDirection` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to express a physical direction in the executable W27 frame. | active-callable | params 1/1; returns tagged |
| 636 | method | `resolveScatteringCacheDirectionStencil` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to resolve a physical outgoing direction through W27 reconstruction. | active-callable | params 1/1; returns tagged |
| 646 | method | `expressPhysicalScatteringCacheDirection` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to express one W27 scattering direction in physical model space. | active-callable | params 1/1; returns tagged |
| 656 | method | `expressPhysicalIncomingRadianceDirection` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to express one incoming-radiance direction in physical space. | active-callable | params 1/1; returns tagged |
| 666 | method | `expressPhysicalOutgoingScatteringDirection` | `SphericalScatteringCacheGeometry` | call-this-method: Call this method to express one outgoing-scattering direction in physical space. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/geometry/spherical/three/ExactSphereGroundObject.js`

Source: [src/algorithm32/geometry/spherical/three/ExactSphereGroundObject.js](../../../../../../src/algorithm32/geometry/spherical/three/ExactSphereGroundObject.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | class | `ExactSphereGroundObject` | `<module>` | descriptive-other: Object that provides an exact spherical ground endpoint for Three raycasters. | entity/value | none |
| 14 | constructor | `<anonymous@14:2>` | `ExactSphereGroundObject` | creates: Creates an exact spherical ground endpoint. | creates | params 1/1; throws 1 |
| 57 | method | `raycast` | `ExactSphereGroundObject` | call-this-method: Call this method to intersect a Three raycaster with the exact sphere. | active-callable | params 2/2 |

## `src/algorithm32/geometry/spherical/three/SphericalGeometrySceneAdapter.js`

Source: [src/algorithm32/geometry/spherical/three/SphericalGeometrySceneAdapter.js](../../../../../../src/algorithm32/geometry/spherical/three/SphericalGeometrySceneAdapter.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 13 | class | `SphericalGeometrySceneAdapter` | `<module>` | descriptive-other: Spherical geometry adaptation for Three scene coordinates, endpoints, and depth bounds. | entity/value | none |
| 19 | constructor | `<anonymous@19:2>` | `SphericalGeometrySceneAdapter` | creates: Creates a spherical Three scene adapter for normalized geometry. | creates | params 1/1 |
| 31 | method | `_positiveFiniteOrDefault` | `SphericalGeometrySceneAdapter` | called-by: Called by local patch construction to resolve a positive finite value with fallback. | called-by | params 2/2; returns tagged; throws 1 |
| 50 | method | `_optionalSceneDistance` | `SphericalGeometrySceneAdapter` | called-by: Called by ground-mesh policy acceptance to normalize one optional scene distance. It ... | called-by | params 2/2; returns tagged |
| 67 | method | `_projectScenePointToSphereSurface` | `SphericalGeometrySceneAdapter` | called-by: Called by ground projection to project a scene point radially to a sphere surface. | called-by | params 4/4; returns tagged |
| 87 | method | `_intersectSceneRayWithSphere` | `SphericalGeometrySceneAdapter` | called-by: Called by ground projection to intersect a scene ray with a scene-unit sphere. It ret... | called-by | params 4/4; returns tagged |
| 104 | callback | `[-halfLinearCoefficient - root, -halfLinearCoefficient + root] .filter::<callback@104:9>` | `distances` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 111 | callback | `[-halfLinearCoefficient - root, -halfLinearCoefficient + root] .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param distance - The distance value accepted by the operation. * @returns - The callback result returned to its caller. */ (distance) => Number.isFinite(distance) && distance >= -Number.EPSILON, ) .map::<callback@111:9>` | `distances` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 119 | callback | `[-halfLinearCoefficient - root, -halfLinearCoefficient + root] .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param distance - The distance value accepted by the operation. * @returns - The callback result returned to its caller. */ (distance) => Number.isFinite(distance) && distance >= -Number.EPSILON, ) .map( /** * Called by Array.prototype.map to transform one collection value. * @param distance - The distance value accepted by the operation. * @returns - The callback result returned to its caller. */ (distance) => Math.max(0, distance), ) .sort::<callback@119:9>` | `distances` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 143 | method | `_isLocalSphereProjectionHit` | `SphericalGeometrySceneAdapter` | called-by: Called by ground projection to decide whether a sphere hit belongs to the local patch. | called-by | params 5/5; returns tagged |
| 168 | method | `_projectOntoTangentPlane` | `SphericalGeometrySceneAdapter` | called-by: Called by ground-offset mapping to project a direction onto the local tangent plane. | called-by | params 2/2; returns tagged; throws 1 |
| 190 | method | `_sceneDistanceToNonNegativeUnits` | `SphericalGeometrySceneAdapter` | called-by: Called by ground projection to normalize a non-negative scene distance. | called-by | params 2/2; returns tagged; throws 1 |
| 205 | method | `_cameraPositionMetersOrNull` | `SphericalGeometrySceneAdapter` | called-by: Called by scene-depth resolution to resolve an optional camera position. It returns t... | called-by | params 2/2; returns tagged |
| 249 | method | `_endpointPositionMetersListOrNull` | `SphericalGeometrySceneAdapter` | called-by: Called by scene-depth resolution to resolve optional endpoint positions. It returns t... | called-by | params 2/2; returns tagged; throws 1 |
| 259 | callback | `request.endpointPositions.map::<callback@259:9>` | `_endpointPositionMetersListOrNull` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 288 | callback | `positions.map::<callback@288:8>` | `_endpointPositionMetersListOrNull` | called-by: Called by Array.prototype.map to transform one collection value. It returns the value... | called-by | params 1/1; returns tagged |
| 310 | method | `_endpointExtentMetersOrNull` | `SphericalGeometrySceneAdapter` | called-by: Called by scene-depth resolution to resolve an optional endpoint extent. It returns t... | called-by | params 3/3; returns tagged |
| 320 | callback | `endpointPositionMeters.reduce::<callback@320:9>` | `_endpointExtentMetersOrNull` | called-by: Called by Array.prototype.reduce to accumulate one collection value. | called-by | params 2/2; returns tagged |
| 350 | method | `_sphereSurfaceYAt` | `SphericalGeometrySceneAdapter` | called-by: Called by local patch construction to resolve the visible sphere surface height. | called-by | params 4/4; returns tagged |
| 365 | method | `_normalizeGroundVisualMeshRequest` | `SphericalGeometrySceneAdapter` | called-by: Called by endpoint construction to normalize the spherical ground visual-mesh policy.... | called-by | params 1/1; returns tagged; throws 2 |
| 404 | method | `_createLocalSphericalGroundPatchGeometry` | `SphericalGeometrySceneAdapter` | called-by: Called by endpoint construction to create a visual patch sampled from the analytic sp... | called-by | params 1/1; returns tagged |
| 484 | method | `_createVisualMaterial` | `SphericalGeometrySceneAdapter` | called-by: Called by endpoint construction to create the requested visual ground material. Condi... | called-by | params 1/1; returns tagged |
| 515 | method | `_scenePointToModelPosition` | `SphericalGeometrySceneAdapter` | called-by: Called by scene mapping to convert one Three scene point into model coordinates. It r... | called-by | params 2/2; returns tagged |
| 537 | method | `_sceneDirectionToModelDirection` | `SphericalGeometrySceneAdapter` | called-by: Called by scene mapping to convert one Three direction into the model frame. It retur... | called-by | params 1/1; returns tagged |
| 560 | method | `mapObserverLocalScenePointToModelPosition` | `SphericalGeometrySceneAdapter` | call-this-method: Call this method to map an observer-local scene point into spherical model space. | active-callable | params 2/2; returns tagged |
| 573 | method | `mapObserverLocalSceneDirectionToModelDirection` | `SphericalGeometrySceneAdapter` | call-this-method: Call this method to map an observer-local scene direction into spherical model space. | active-callable | params 1/1; returns tagged |
| 586 | method | `mapGroundOffsetToScenePoint` | `SphericalGeometrySceneAdapter` | call-this-method: Call this method to map an app-authored ground offset into the configured Three scene. | active-callable | params 2/2; returns tagged |
| 627 | method | `projectScenePointToGroundAlongDirection` | `SphericalGeometrySceneAdapter` | call-this-method: Call this method to project a scene point to the local spherical ground. It returns t... | active-callable | params 3/3; returns tagged |
| 692 | method | `createThreeEndpointObjects` | `SphericalGeometrySceneAdapter` | call-this-method: Call this method to create geometry-owned Three ground endpoint objects. Conditional ... | active-callable | params 1/1; returns tagged |
| 788 | method | `resolveSceneDepthMax` | `SphericalGeometrySceneAdapter` | call-this-method: Call this method to resolve the scene-depth cap for spherical endpoints. | active-callable | params 1/1; returns tagged |
| 794 | callback | `scenePointToModelPosition` | `scenePointToModelPosition` | called-by: Called by scene point to model position to scene point to model position. | called-by | params 2/2; returns tagged |

## `src/algorithm32/gpu-assembler/base/ShaderContributions.js`

Source: [src/algorithm32/gpu-assembler/base/ShaderContributions.js](../../../../../../src/algorithm32/gpu-assembler/base/ShaderContributions.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `ShaderContributions` | `<module>` | descriptive-other: Provider-neutral construction methods for direct shader assembly declarations. | entity/value | none |
| 9 | method | `createShaderContribution` | `ShaderContributions` | call-this-method: Call this method to create one complete shader contribution from partial owner-provid... | active-callable | params 1/1; returns tagged |
| 33 | method | `createShaderSourceBlock` | `ShaderContributions` | call-this-method: Call this method to create one ordered GLSL source block for deterministic assembly. | active-callable | params 4/4; returns tagged |
| 46 | method | `createShaderUniformDeclaration` | `ShaderContributions` | call-this-method: Call this method to create one shader uniform declaration with an optional default. | active-callable | params 4/4; returns tagged |
| 64 | method | `createShaderTextureDeclaration` | `ShaderContributions` | call-this-method: Call this method to create one shader texture declaration for a runtime value. | active-callable | params 3/3; returns tagged |
| 79 | method | `createShaderBindingRequirement` | `ShaderContributions` | call-this-method: Call this method to create one runtime shader binding requirement. | active-callable | params 6/6; returns tagged |

## `src/algorithm32/gpu-assembler/base/ShaderSource.js`

Source: [src/algorithm32/gpu-assembler/base/ShaderSource.js](../../../../../../src/algorithm32/gpu-assembler/base/ShaderSource.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | function | `formatFloat` | `<module>` | called-by: Called by this module to format one finite number for deterministic GLSL source. It r... | called-by | params 1/1; returns tagged |
| 22 | function | `formatFloatArray` | `<module>` | called-by: Called by this module to format numeric array entries for deterministic GLSL source. | called-by | params 1/1; returns tagged |
| 29 | callback | `values .map::<callback@29:8>` | `formatFloatArray` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 41 | function | `formatVec3` | `<module>` | called-by: Called by this module to format one three-component GLSL vector. | called-by | params 1/1; returns tagged |
| 46 | constant | `ShaderSource` | `<module>` | descriptive-other: Deterministic GLSL value-source formatting methods. | entity/value | none |

## `src/algorithm32/gpu-assembler/cache-pass/CacheBuildModules.js`

Source: [src/algorithm32/gpu-assembler/cache-pass/CacheBuildModules.js](../../../../../../src/algorithm32/gpu-assembler/cache-pass/CacheBuildModules.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `CacheBuildModules` | `<module>` | descriptive-other: Cache-build declaration identity, binding naming, and construction methods. | entity/value | none |
| 11 | method | `fieldInputBindingName` | `CacheBuildModules` | call-this-method: Call this method to derive an injective GLSL-safe input sampler name from a logical f... | active-callable | params 1/1; returns tagged |
| 19 | callback | `Array.from::<callback@19:8>` | `encoded` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 1/1; returns tagged |
| 30 | method | `bindingIdentity` | `CacheBuildModules` | call-this-method: Call this method to derive stable identity metadata from one typed shader binding val... | active-callable | params 1/1; returns tagged |
| 54 | method | `createBuildModule` | `CacheBuildModules` | call-this-method: Call this method to construct one owner module and derive its descriptive content ide... | active-callable | params 1/1; returns tagged |
| 61 | callback | `[...definition.blocks].sort::<callback@61:8>` | `blocks` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 70 | callback | `[...definition.bindings].sort::<callback@70:8>` | `bindings` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 87 | callback | `bindings.map::<callback@87:9>` | `identity` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |

## `src/algorithm32/gpu-assembler/cache-pass/CachePassAssembler.js`

Source: [src/algorithm32/gpu-assembler/cache-pass/CachePassAssembler.js](../../../../../../src/algorithm32/gpu-assembler/cache-pass/CachePassAssembler.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | constant | `OWNER_ORDER` | `<module>` | descriptive-other: Owner order constant. | entity/value | none |
| 8 | constant | `CACHE_OUTPUT_NAME` | `<module>` | descriptive-other: Cache output name constant. | entity/value | none |
| 10 | constant | `GLSL_PREPROCESSOR_PREFIX` | `<module>` | descriptive-other: Glsl preprocessor prefix constant. | entity/value | none |
| 13 | class | `CachePassAssembler` | `<module>` | descriptive-other: Renderer-neutral assembler of owner modules into cache-pass shaders. | entity/value | none |
| 20 | method | `_ownerIndex` | `CachePassAssembler` | called-by: Called by module comparison to resolve one owner's deterministic tie-break position. ... | called-by | params 1/1; returns tagged |
| 32 | method | `_compareModules` | `CachePassAssembler` | called-by: Called by module ordering to compare independent modules without using arrival order. | called-by | params 2/2; returns tagged |
| 46 | method | `_orderModules` | `CachePassAssembler` | called-by: Called by assembly to resolve trusted module dependencies into deterministic source o... | called-by | params 1/1; returns tagged |
| 60 | callback | `visit` | `visit` | called-by: Called by visit to visit. | called-by | params 1/1 |
| 71 | callback | `module.requires .map::<callback@71:10>` | `visit` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 80 | callback | `module.requires .map( /** * Called by Array.prototype.map to transform one collection value. * @param symbol - The symbol value accepted by the operation. * @returns - The callback result returned to its caller. */ (symbol) => providers.get(symbol), ) .filter(Boolean) .sort::<callback@80:10>` | `visit` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 95 | callback | `[...modules] .sort::<callback@95:9>` | `_orderModules` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 107 | method | `_collectBlocks` | `CachePassAssembler` | called-by: Called by source assembly to collect source blocks with their deterministic module po... | called-by | params 1/1; returns tagged |
| 114 | callback | `modules.flatMap::<callback@114:8>` | `_collectBlocks` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 2/2; returns tagged |
| 120 | callback | `module.blocks.map::<callback@120:10>` | `_collectBlocks` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 135 | method | `_phaseSource` | `CachePassAssembler` | called-by: Called by source assembly to select one phase's source in explicit block order. | called-by | params 2/2; returns tagged |
| 142 | callback | `blocks .filter::<callback@142:9>` | `_phaseSource` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 150 | callback | `blocks .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param entry - The entry value accepted by the operation. * @returns - The callback result returned to its caller. */ (entry) => entry.block.phase === phase, ) .sort::<callback@150:9>` | `_phaseSource` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 160 | callback | `blocks .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param entry - The entry value accepted by the operation. * @returns - The callback result returned to its caller. */ (entry) => entry.block.phase === phase, ) .sort( /** * Called by Array.prototype.sort to compare two collection values. * @param left - The left value accepted by the operation. * @param right - The right value accepted by the operation. * @returns - The callback result returned to its caller. */ (left, right) => left.moduleIndex - right.moduleIndex \|\| left.block.order - right.block.order \|\| left.block.id.localeCompare(right.block.id), ) .map::<callback@160:9>` | `_phaseSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 171 | method | `_defineLiteral` | `CachePassAssembler` | called-by: Called by source assembly to emit one stable preprocessor literal. Conditional result... | called-by | params 1/1; returns tagged |
| 181 | method | `_uniformDeclaration` | `CachePassAssembler` | called-by: Called by source assembly to place a GLSL array suffix after a binding name. It retur... | called-by | params 1/1; returns tagged |
| 195 | method | `_collectBindings` | `CachePassAssembler` | called-by: Called by assembly to collect trusted bindings in deterministic declaration order. | called-by | params 1/1; returns tagged |
| 202 | callback | `modules .flatMap::<callback@202:9>` | `_collectBindings` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 1/1; returns tagged |
| 210 | callback | `modules .flatMap( /** * Called by Array.prototype.flatMap to transform and flatten one collection value. * @param module - The module value accepted by the operation. * @returns - The callback result returned to its caller. */ (module) => module.bindings, ) .sort::<callback@210:9>` | `_collectBindings` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 221 | method | `_indentMainSource` | `CachePassAssembler` | called-by: Called by source assembly to indent a main-phase block without changing its internal ... | called-by | params 1/1; returns tagged |
| 229 | callback | `source .split('\\n') .map::<callback@229:9>` | `_indentMainSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 242 | method | `_assembleSource` | `CachePassAssembler` | called-by: Called by assembly to compose one deterministic construction fragment shader body. | called-by | params 3/3; returns tagged |
| 249 | callback | `pass.inputs .map::<callback@249:9>` | `inputDeclarations` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 259 | callback | `bindings .filter::<callback@259:9>` | `defineSource` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 266 | callback | `bindings .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param binding - The binding value accepted by the operation. * @returns - The callback result returned to its caller. */ (binding) => binding.spec.kind === 'define', ) .map::<callback@266:9>` | `defineSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 278 | callback | `bindings .filter::<callback@278:9>` | `uniformSource` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 285 | callback | `bindings .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param binding - The binding value accepted by the operation. * @returns - The callback result returned to its caller. */ (binding) => binding.spec.kind !== 'define', ) .map::<callback@285:9>` | `uniformSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 316 | method | `assemble` | `CachePassAssembler` | call-this-method: Call this method to assemble one accepted logical pass and executor-resolved output f... | active-callable | params 2/2; returns tagged |
| 338 | callback | `modules.map::<callback@338:9>` | `shaderIdentifier` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |

## `src/algorithm32/gpu-assembler/cache-pass/consts.js`

Source: [src/algorithm32/gpu-assembler/cache-pass/consts.js](../../../../../../src/algorithm32/gpu-assembler/cache-pass/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `CACHE_WAVELENGTH_LAYER_BINDING_NAME` | `<module>` | descriptive-other: Name of the executor-owned wavelength-layer uniform. | entity/value | none |

## `src/algorithm32/gpu-assembler/runtime/Algorithm32ShaderAssembler.js`

Source: [src/algorithm32/gpu-assembler/runtime/Algorithm32ShaderAssembler.js](../../../../../../src/algorithm32/gpu-assembler/runtime/Algorithm32ShaderAssembler.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | constant | `OWNER_ORDER` | `<module>` | descriptive-other: Owner order constant. | entity/value | none |
| 18 | constant | `SOURCE_SLOTS` | `<module>` | descriptive-other: Source slots constant. | entity/value | none |
| 39 | constant | `MAIN_HOOK_SLOTS` | `<module>` | descriptive-other: Main hook slots constant. | entity/value | none |
| 52 | constant | `GLSL_DIRECTIVE_PREFIX` | `<module>` | descriptive-other: Glsl directive prefix constant. | entity/value | none |
| 55 | class | `Algorithm32ShaderAssembler` | `<module>` | descriptive-other: Deterministic assembler for validated owner contributions and GLSL source. | entity/value | none |
| 62 | method | `_createShaderValidationError` | `Algorithm32ShaderAssembler` | called-by: Called by assembly to create a setup-time validation error with structured details. | called-by | params 1/1; returns tagged |
| 82 | method | `_listEntries` | `Algorithm32ShaderAssembler` | called-by: Called by source assembly to read one contribution list property. | called-by | params 2/2; returns tagged |
| 92 | method | `_ownerIndex` | `Algorithm32ShaderAssembler` | called-by: Called by contribution ordering to resolve one owner's stable sort position. Conditio... | called-by | params 1/1; returns tagged |
| 105 | method | `_compareContributions` | `Algorithm32ShaderAssembler` | called-by: Called by source assembly to compare contributions by owner order and identifier. | called-by | params 2/2; returns tagged |
| 116 | method | `_compareByContributionThenLine` | `Algorithm32ShaderAssembler` | called-by: Called by source assembly to compare line entries within contribution groups. | called-by | params 2/2; returns tagged |
| 128 | method | `_blocksForSlot` | `Algorithm32ShaderAssembler` | called-by: Called by fragment assembly to collect ordered source blocks for one shader slot. | called-by | params 3/3; returns tagged |
| 135 | callback | `contributions .flatMap::<callback@135:9>` | `_blocksForSlot` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 1/1; returns tagged |
| 142 | callback | `this._listEntries(contribution, property) .filter::<callback@142:12>` | `_blocksForSlot` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 149 | callback | `this._listEntries(contribution, property) .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param block - The block value accepted by the operation. * @returns - The callback result returned to its caller. */ (block) => block.slot === slot, ) .map::<callback@149:12>` | `_blocksForSlot` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 161 | callback | `contributions .flatMap( /** * Called by Array.prototype.flatMap to transform and flatten one collection value. * @param contribution - The contribution value accepted by the operation. * @returns - The callback result returned to its caller. */ (contribution) => this._listEntries(contribution, property) .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param block - The block value accepted by the operation. * @returns - The callback result returned to its caller. */ (block) => block.slot === slot, ) .map( /** * Called by Array.prototype.map to transform one collection value. * @param block - The block value accepted by the operation. * @returns - The callback result returned to its caller. */ (block) => ({ contribution, block, }), ), ) .sort::<callback@161:9>` | `_blocksForSlot` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 171 | callback | `contributions .flatMap( /** * Called by Array.prototype.flatMap to transform and flatten one collection value. * @param contribution - The contribution value accepted by the operation. * @returns - The callback result returned to its caller. */ (contribution) => this._listEntries(contribution, property) .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param block - The block value accepted by the operation. * @returns - The callback result returned to its caller. */ (block) => block.slot === slot, ) .map( /** * Called by Array.prototype.map to transform one collection value. * @param block - The block value accepted by the operation. * @returns - The callback result returned to its caller. */ (block) => ({ contribution, block, }), ), ) .sort( /** * Called by Array.prototype.sort to compare two collection values. * @param left - The left value accepted by the operation. * @param right - The right value accepted by the operation. * @returns - The callback result returned to its caller. */ (left, right) => left.block.order - right.block.order \|\| this._compareContributions(left.contribution, right.contribution) \|\| left.block.id.localeCompare(right.block.id), ) .map::<callback@171:9>` | `_blocksForSlot` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 182 | method | `_assembleFragmentShader` | `Algorithm32ShaderAssembler` | called-by: Called by assembly to build fragment shader source for sorted contributions. | called-by | params 1/1; returns tagged |
| 189 | callback | `contributions .flatMap::<callback@189:9>` | `defineSource` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 1/1; returns tagged |
| 195 | callback | `this._listEntries(contribution, 'defines').map::<callback@195:11>` | `defineSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 207 | callback | `contributions .flatMap( /** * Called by Array.prototype.flatMap to transform and flatten one collection value. * @param contribution - The contribution value accepted by the operation. * @returns - The callback result returned to its caller. */ (contribution) => this._listEntries(contribution, 'defines').map( /** * Called by Array.prototype.map to transform one collection value. * @param line - The line value accepted by the operation. * @returns - The callback result returned to its caller. */ (line) => ({ contribution, line, }), ), ) .sort::<callback@207:9>` | `defineSource` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 214 | callback | `contributions .flatMap( /** * Called by Array.prototype.flatMap to transform and flatten one collection value. * @param contribution - The contribution value accepted by the operation. * @returns - The callback result returned to its caller. */ (contribution) => this._listEntries(contribution, 'defines').map( /** * Called by Array.prototype.map to transform one collection value. * @param line - The line value accepted by the operation. * @returns - The callback result returned to its caller. */ (line) => ({ contribution, line, }), ), ) .sort( /** * Called by Array.prototype.sort to compare two collection values. * @param left - The left value accepted by the operation. * @param right - The right value accepted by the operation. * @returns - The callback result returned to its caller. */ (left, right) => this._compareByContributionThenLine(left, right), ) .map::<callback@214:9>` | `defineSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 223 | callback | `contributions .flatMap::<callback@223:9>` | `uniformSource` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 1/1; returns tagged |
| 230 | callback | `this._listEntries(contribution, 'uniforms').map::<callback@230:12>` | `uniformSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 237 | callback | `this._listEntries(contribution, 'textures').map::<callback@237:12>` | `uniformSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 244 | callback | `[ ...this._listEntries(contribution, 'uniforms').map( /** * Called by Array.prototype.map to transform one collection value. * @param uniform - The uniform value accepted by the operation. * @returns - The callback result returned to its caller. */ (uniform) => `uniform ${uniform.type} ${uniform.name};`, ), ...this._listEntries(contribution, 'textures').map( /** * Called by Array.prototype.map to transform one collection value. * @param texture - The texture value accepted by the operation. * @returns - The callback result returned to its caller. */ (texture) => `uniform ${texture.type} ${texture.name};`, ), ].map::<callback@244:11>` | `uniformSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 256 | callback | `contributions .flatMap( /** * Called by Array.prototype.flatMap to transform and flatten one collection value. * @param contribution - The contribution value accepted by the operation. * @returns - The callback result returned to its caller. */ (contribution) => [ ...this._listEntries(contribution, 'uniforms').map( /** * Called by Array.prototype.map to transform one collection value. * @param uniform - The uniform value accepted by the operation. * @returns - The callback result returned to its caller. */ (uniform) => `uniform ${uniform.type} ${uniform.name};`, ), ...this._listEntries(contribution, 'textures').map( /** * Called by Array.prototype.map to transform one collection value. * @param texture - The texture value accepted by the operation. * @returns - The callback result returned to its caller. */ (texture) => `uniform ${texture.type} ${texture.name};`, ), ].map( /** * Called by Array.prototype.map to transform one collection value. * @param line - The line value accepted by the operation. * @returns - The callback result returned to its caller. */ (line) => ({ contribution, line, }), ), ) .sort::<callback@256:9>` | `uniformSource` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 263 | callback | `contributions .flatMap( /** * Called by Array.prototype.flatMap to transform and flatten one collection value. * @param contribution - The contribution value accepted by the operation. * @returns - The callback result returned to its caller. */ (contribution) => [ ...this._listEntries(contribution, 'uniforms').map( /** * Called by Array.prototype.map to transform one collection value. * @param uniform - The uniform value accepted by the operation. * @returns - The callback result returned to its caller. */ (uniform) => `uniform ${uniform.type} ${uniform.name};`, ), ...this._listEntries(contribution, 'textures').map( /** * Called by Array.prototype.map to transform one collection value. * @param texture - The texture value accepted by the operation. * @returns - The callback result returned to its caller. */ (texture) => `uniform ${texture.type} ${texture.name};`, ), ].map( /** * Called by Array.prototype.map to transform one collection value. * @param line - The line value accepted by the operation. * @returns - The callback result returned to its caller. */ (line) => ({ contribution, line, }), ), ) .sort( /** * Called by Array.prototype.sort to compare two collection values. * @param left - The left value accepted by the operation. * @param right - The right value accepted by the operation. * @returns - The callback result returned to its caller. */ (left, right) => this._compareByContributionThenLine(left, right), ) .map::<callback@263:9>` | `uniformSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 271 | callback | `SOURCE_SLOTS.map::<callback@271:8>` | `functionSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 280 | callback | `MAIN_HOOK_SLOTS.map::<callback@280:8>` | `hookSource` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 312 | field | `_validator` | `Algorithm32ShaderAssembler` | descriptive-other: Value that stores the compatibility validator used before source assembly. | entity/value | none |
| 319 | constructor | `<anonymous@319:2>` | `Algorithm32ShaderAssembler` | creates: Creates a shader assembler with an optional compatibility collaborator. | creates | params 1/1 |
| 333 | method | `assemble` | `Algorithm32ShaderAssembler` | call-this-method: Call this method to assemble one shader request after validating contribution compati... | active-callable | params 1/1; returns tagged; throws 1 |
| 346 | callback | `[...request.contributions].sort::<callback@346:8>` | `contributions` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |
| 355 | callback | `contributions .flatMap::<callback@355:9>` | `bindingRequirements` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 1/1; returns tagged |
| 363 | callback | `contributions .flatMap( /** * Called by Array.prototype.flatMap to transform and flatten one collection value. * @param contribution - The contribution value accepted by the operation. * @returns - The callback result returned to its caller. */ (contribution) => contribution.bindingRequirements, ) .sort::<callback@363:9>` | `bindingRequirements` | called-by: Called by Array.prototype.sort to compare two collection values. | called-by | params 2/2; returns tagged |

## `src/algorithm32/gpu-assembler/runtime/ShaderCompatibilityValidator.js`

Source: [src/algorithm32/gpu-assembler/runtime/ShaderCompatibilityValidator.js](../../../../../../src/algorithm32/gpu-assembler/runtime/ShaderCompatibilityValidator.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `ShaderCompatibilityValidator` | `<module>` | descriptive-other: Object that validates executable symbol relationships between shader contributions. | entity/value | none |
| 9 | method | `validate` | `ShaderCompatibilityValidator` | call-this-method: Call this method to validate one shader assembly request. Conditional result values a... | active-callable | params 1/1; returns tagged |
| 37 | callback | `[...providedBySymbol.entries()] .filter::<callback@37:9>` | `duplicateProvidedSymbols` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 44 | callback | `[...providedBySymbol.entries()] .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param input1 - The destructured input accepted by the operation. * @returns - The callback result returned to its caller. */ ([, providers]) => providers.length > 1, ) .map::<callback@44:9>` | `duplicateProvidedSymbols` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 52 | callback | `duplicateProvidedSymbols.forEach::<callback@52:8>` | `validate` | called-by: Called by Array.prototype.forEach to process one collection value. | called-by | params 1/1 |
| 66 | callback | `requiredSymbolList.filter::<callback@66:8>` | `missingRequiredSymbols` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 73 | callback | `missingRequiredSymbols.forEach::<callback@73:8>` | `validate` | called-by: Called by Array.prototype.forEach to process one collection value. | called-by | params 1/1 |
| 84 | callback | `providedSymbols .filter::<callback@84:9>` | `unusedProvidedSymbols` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 92 | callback | `unusedProvidedSymbols.forEach::<callback@92:8>` | `validate` | called-by: Called by Array.prototype.forEach to process one collection value. | called-by | params 1/1 |

## `src/algorithm32/gpu-runtime/cache/CacheGpuExecutor.js`

Source: [src/algorithm32/gpu-runtime/cache/CacheGpuExecutor.js](../../../../../../src/algorithm32/gpu-runtime/cache/CacheGpuExecutor.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `MAXIMUM_PROBE_SCALAR_COUNT` | `<module>` | descriptive-other: Maximum probe scalar count constant. | entity/value | none |
| 6 | constant | `R32F_BYTES_PER_SCALAR` | `<module>` | descriptive-other: R32 f bytes per scalar constant. | entity/value | none |
| 9 | class | `CacheGpuExecutor` | `<module>` | descriptive-other: Renderer-neutral GPU executor for trusted cache build plans. | entity/value | none |
| 16 | method | `_fieldStorageBytes` | `CacheGpuExecutor` | called-by: Called by execution diagnostics to calculate scalar payload bytes for one field alloc... | called-by | params 1/1; returns tagged |
| 26 | method | `_packedDataBytes` | `CacheGpuExecutor` | called-by: Called by execution diagnostics to calculate packed-data bytes uploaded with one pass. | called-by | params 1/1; returns tagged |
| 33 | callback | `shader.bindings .filter::<callback@33:9>` | `_packedDataBytes` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 41 | callback | `shader.bindings .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param binding - The binding value accepted by the operation. * @returns - The callback result returned to its caller. */ (binding) => binding.spec.kind === 'data', ) .reduce::<callback@41:9>` | `_packedDataBytes` | called-by: Called by Array.prototype.reduce to accumulate one collection value. | called-by | params 2/2; returns tagged |
| 53 | method | `_bytes` | `CacheGpuExecutor` | called-by: Called by execution diagnostics to carry a byte count as a unit-bearing value. | called-by | params 1/1; returns tagged |
| 63 | method | `_createAbortError` | `CacheGpuExecutor` | called-by: Called by cancellation boundaries to create an ordinary abort error without a DOM run... | called-by | params 1/1; returns tagged |
| 76 | method | `_requireActiveExecution` | `CacheGpuExecutor` | called-by: Called by execution to enforce executor lifecycle and caller cancellation at safe bou... | called-by | params 1/1; throws 1 |
| 94 | method | `_boundedCoordinate` | `CacheGpuExecutor` | called-by: Called by probe acceptance to require one coordinate within an executable field extent. | called-by | params 3/3; returns tagged; throws 1 |
| 109 | method | `_acceptProbeCoordinate` | `CacheGpuExecutor` | called-by: Called by probe acceptance to copy one selected scalar coordinate at the execution bo... | called-by | params 3/3; returns tagged |
| 123 | method | `_indexPlan` | `CacheGpuExecutor` | called-by: Called by execution to index the fields and remaining consumers of one trusted plan. | called-by | params 1/1; returns tagged |
| 130 | callback | `plan.fields.map::<callback@130:9>` | `fieldSpecs` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 139 | callback | `plan.fields.map::<callback@139:9>` | `consumerCounts` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 159 | method | `_acceptProbes` | `CacheGpuExecutor` | called-by: Called by option acceptance to validate bounded diagnostic probe requests. It returns... | called-by | params 3/3; returns tagged; throws 1 |
| 187 | callback | `probe.coordinates.map::<callback@187:9>` | `coordinates` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 199 | callback | `coordinates.map::<callback@199:9>` | `coordinateKeys` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 222 | method | `_acceptExecutionOptions` | `CacheGpuExecutor` | called-by: Called by execution to accept runtime options against indexed plan fields. | called-by | params 2/2; returns tagged |
| 240 | method | `_acceptProbeResult` | `CacheGpuExecutor` | called-by: Called by execution to validate finite diagnostic values returned through the probe API. | called-by | params 2/2; returns tagged; throws 1 |
| 266 | method | `_releaseResource` | `CacheGpuExecutor` | called-by: Called by execution cleanup to dispose one owned resource before removing its ownersh... | called-by | params 2/2 |
| 278 | method | `_cleanOwnedResources` | `CacheGpuExecutor` | called-by: Called by failed execution to attempt every remaining cleanup in reverse ownership or... | called-by | params 2/2; returns tagged |
| 306 | method | `_createArtifact` | `CacheGpuExecutor` | called-by: Called by successful execution to create the result owner with idempotent field dispo... | called-by | params 4/4; returns tagged |
| 315 | method | `dispose` | `_createArtifact` | call-this-method: Call this method to dispose. | active-callable | none |
| 326 | field | `_backend` | `CacheGpuExecutor` | descriptive-other: Renderer-specific GPU construction backend. @type {CacheGpuBackend} | entity/value | none |
| 328 | field | `_assembler` | `CacheGpuExecutor` | descriptive-other: Provider-neutral cache-pass assembler. @type {CacheAssembler} | entity/value | none |
| 330 | field | `_disposed` | `CacheGpuExecutor` | descriptive-other: Whether the executor is unavailable for new work. | entity/value | none |
| 332 | field | `_executing` | `CacheGpuExecutor` | descriptive-other: Whether the executor currently owns an active execution transaction. | entity/value | none |
| 339 | constructor | `<anonymous@339:2>` | `CacheGpuExecutor` | creates: Creates a renderer-neutral executor for one backend and cache-pass assembler. | creates | params 1/1 |
| 354 | method | `execute` | `CacheGpuExecutor` | call-this-method: Call this method to execute one complete staging graph and retain only its cumulative... | active-callable | params 2/2; returns tagged; throws 2; async outcome mentioned |
| 377 | callback | `plan.passes.map::<callback@377:9>` | `shaders` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 419 | callback | `pass.inputs.map::<callback@419:10>` | `inputs` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 515 | method | `dispose` | `CacheGpuExecutor` | call-this-method: Call this method to mark the executor unavailable without disposing its backend. | active-callable | none |

## `src/algorithm32/gpu-runtime/cache/CacheValues.js`

Source: [src/algorithm32/gpu-runtime/cache/CacheValues.js](../../../../../../src/algorithm32/gpu-runtime/cache/CacheValues.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `CacheValues` | `<module>` | descriptive-other: Runtime cache-data and plan-identity construction methods. | entity/value | none |
| 11 | method | `createData` | `CacheValues` | call-this-method: Call this method to copy packed cache data and derive its stable metadata identity. | active-callable | params 1/1; returns tagged |
| 35 | method | `createPlanIdentity` | `CacheValues` | call-this-method: Call this method to derive descriptive identity for one complete source-owned logical... | active-callable | params 4/4; returns tagged |
| 44 | callback | `fields.map::<callback@44:9>` | `body` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 54 | callback | `passes.map::<callback@54:9>` | `body` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 65 | callback | `pass.modules.map::<callback@65:11>` | `body` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |

## `src/algorithm32/gpu-runtime/cache/consts.js`

Source: [src/algorithm32/gpu-runtime/cache/consts.js](../../../../../../src/algorithm32/gpu-runtime/cache/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `CUMULATIVE_SCATTERING_CACHE_VALUE_KEY` | `<module>` | descriptive-other: Stable runtime value key for one attachment's cumulative scattering field. | entity/value | none |

## `src/algorithm32/gpu-runtime/cache/three/ThreeCacheBackend.js`

Source: [src/algorithm32/gpu-runtime/cache/three/ThreeCacheBackend.js](../../../../../../src/algorithm32/gpu-runtime/cache/three/ThreeCacheBackend.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | constant | `MAXIMUM_PROBE_SCALAR_COUNT` | `<module>` | descriptive-other: Maximum scalar count accepted by one cache probe request. | entity/value | none |
| 12 | constant | `CANONICAL_UNIT_SCALE` | `<module>` | descriptive-other: Canonical multipliers for units accepted by the GPU boundary. | entity/value | none |
| 35 | constant | `FULLSCREEN_VERTEX_SHADER` | `<module>` | descriptive-other: Fullscreen-triangle vertex shader shared by cache construction passes. | entity/value | none |
| 48 | constant | `BACKEND_RECORDS` | `<module>` | descriptive-other: Private state keyed by opaque backend handle. | entity/value | none |
| 54 | constant | `FIELD_RECORDS` | `<module>` | descriptive-other: Private state keyed by opaque field handle. | entity/value | none |
| 60 | constant | `PROGRAM_RECORDS` | `<module>` | descriptive-other: Private state keyed by opaque program handle. | entity/value | none |
| 66 | constant | `RUNTIME_BINDING_RECORDS` | `<module>` | descriptive-other: Private state keyed by runtime binding. | entity/value | none |
| 68 | module-field | `backendSequence` | `<module>` | descriptive-other: Monotonic identity sequence for backend handles. | entity/value | none |
| 71 | class | `ThreeCacheBackend` | `<module>` | descriptive-other: Three/WebGL2 adapter for Algorithm32's opaque GPU cache backend. | entity/value | none |
| 81 | method | `_boundedIndex` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to require one integer within inclusive API bounds. | called-by | params 3/3; returns tagged; throws 1 |
| 98 | method | `_captureRendererState` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to capture every renderer and WebGL state value temporari... | called-by | params 3/3; returns tagged |
| 107 | callback | `<anonymous@107:102>` | `_captureRendererState` | called-by: Called by capture renderer state to handle one invocation of the declared operation. | called-by | none |
| 125 | method | `_withRendererState` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to execute renderer work while preserving caller-owned st... | called-by | params 2/2; returns tagged |
| 144 | method | `_createScalarArrayTarget` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to allocate and configure one private scalar R32F array r... | called-by | params 4/4; returns tagged |
| 172 | method | `_assertFramebufferComplete` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to require a complete R32F framebuffer for one selected a... | called-by | params 3/3; throws 1 |
| 189 | method | `_inspectCapabilities` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to inspect and validate renderer capabilities required by... | called-by | params 2/2; returns tagged; throws 1 |
| 238 | callback | `this._withRendererState::<callback@238:9>` | `_inspectCapabilities` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 255 | method | `_requireBackendRecord` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to require the active private state for one opaque backen... | called-by | params 1/1; returns tagged; throws 1 |
| 271 | method | `_disposeField` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to dispose one field handle and its private renderer reso... | called-by | params 1/1 |
| 293 | method | `_disposeProgram` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to dispose one program handle and every private resource ... | called-by | params 1/1; throws 1 |
| 322 | method | `_createFieldHandle` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to create an opaque disposable field handle for a private... | called-by | params 2/2; returns tagged |
| 328 | method | `dispose` | `field` | call-this-method: Call this method to dispose. | active-callable | none |
| 343 | method | `_createProgramHandle` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to create an opaque disposable program handle for private... | called-by | params 2/2; returns tagged |
| 348 | method | `dispose` | `program` | call-this-method: Call this method to dispose. | active-callable | none |
| 364 | method | `_createRuntimeBindingHandle` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to create an opaque runtime-binding identity for a privat... | called-by | params 3/3; returns tagged |
| 382 | method | `_requireRuntimeBindingField` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to require the active field associated with one opaque ru... | called-by | params 2/2; returns tagged; throws 1 |
| 402 | method | `_requireFieldRecord` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to require one active opaque field owned by the supplied ... | called-by | params 3/3; returns tagged; throws 2 |
| 424 | method | `_requireProgramRecord` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to require one active opaque program owned by the supplie... | called-by | params 2/2; returns tagged; throws 2 |
| 445 | method | `_canonicalUnitScalar` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to resolve a supported unit value to its canonical GPU sc... | called-by | params 2/2; returns tagged; throws 1 |
| 461 | method | `_isDataBinding` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to determine whether one typed binding carries packed dat... | called-by | params 1/1; returns tagged |
| 472 | method | `_isUniformBinding` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to determine whether one typed binding carries a uniform ... | called-by | params 1/1; returns tagged |
| 484 | method | `_uniformValue` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to resolve one typed binding value to its Three uniform r... | called-by | params 2/2; returns tagged |
| 521 | method | `_createDataTexture` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to allocate and configure one privately owned scalar text... | called-by | params 2/2; returns tagged |
| 552 | method | `_createMaterialBindings` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to configure material uniforms and collect the private da... | called-by | params 2/2; returns tagged; throws 1 |
| 565 | callback | `bindings.forEach::<callback@565:9>` | `_createMaterialBindings` | called-by: Called by Array.prototype.forEach to process one collection value. | called-by | params 1/1 |
| 599 | method | `_createProgramResources` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to allocate the private fullscreen-pass resource cohort f... | called-by | params 2/2; returns tagged; throws 1 |
| 654 | method | `_applySubmissionBindings` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to apply submission-time uniforms and opaque input fields... | called-by | params 4/4 |
| 685 | method | `_acceptProbeCoordinate` | `ThreeCacheBackend` | called-by: Called by ThreeCacheBackend to accept one selected scalar coordinate at the readback ... | called-by | params 3/3; returns tagged |
| 712 | constructor | `<anonymous@712:2>` | `ThreeCacheBackend` | creates: Creates a Three/WebGL2 cache backend after validating the renderer's scalar-array cap... | creates | params 1/1; throws 1 |
| 739 | method | `allocateField` | `ThreeCacheBackend` | call-this-method: Call this method to allocate one opaque scalar-array cache field owned by this backend. | active-callable | params 1/1; returns tagged; throws 2 |
| 773 | method | `compile` | `ThreeCacheBackend` | call-this-method: Call this method to allocate and compile one opaque cache program while preserving ca... | active-callable | params 1/1; returns tagged; throws 1; async outcome mentioned |
| 792 | callback | `this._withRendererState::<callback@792:9>` | `compile` | called-by: Called by the surrounding operation to handle one callback invocation. Conditional re... | called-by | returns tagged |
| 813 | method | `submitLayer` | `ThreeCacheBackend` | call-this-method: Call this method to submit one cache wavelength layer while restoring every caller-ow... | active-callable | params 1/1; throws 1 |
| 822 | callback | `this._withRendererState::<callback@822:82>` | `submitLayer` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | none |
| 840 | method | `createRuntimeBinding` | `ThreeCacheBackend` | call-this-method: Call this method to create one opaque runtime binding for a resident field owned by t... | active-callable | params 1/1; returns tagged; throws 1 |
| 862 | method | `installRuntimeBindings` | `ThreeCacheBackend` | call-this-method: Call this method to resolve opaque cache handles inside the renderer adapter and inst... | active-callable | params 1/1; throws 2 |
| 885 | method | `readSelectedScalars` | `ThreeCacheBackend` | call-this-method: Call this method to read selected field scalars while restoring caller-owned renderer... | active-callable | params 1/1; returns tagged; throws 1; async outcome mentioned |
| 897 | callback | `request.coordinates.map::<callback@897:8>` | `coordinates` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 905 | callback | `this._withRendererState::<callback@905:8>` | `samples` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 911 | callback | `coordinates.map::<callback@911:10>` | `samples` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 943 | method | `dispose` | `ThreeCacheBackend` | call-this-method: Call this method to dispose every field and program owned by this adapter. Cleanup co... | active-callable | throws 1 |

## `src/algorithm32/ground-boundaries/index.js`

Source: [src/algorithm32/ground-boundaries/index.js](../../../../../../src/algorithm32/ground-boundaries/index.js)

No independently documentable declaration or callable target; this is a re-export-only barrel.

## `src/algorithm32/ground-boundaries/shared/cache/consts.js`

Source: [src/algorithm32/ground-boundaries/shared/cache/consts.js](../../../../../../src/algorithm32/ground-boundaries/shared/cache/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `CANONICAL_BLACK_GROUND_MODULE_ID` | `<module>` | descriptive-other: Stable identifier for the shared omitted-boundary module without source-kind coupling. | entity/value | none |
| 5 | constant | `CANONICAL_BLACK_GROUND_CACHE_MODULE_DEFINITION` | `<module>` | descriptive-other: Canonical zero-reflection cache-module definition for omitted reflective ground. | entity/value | none |

## `src/algorithm32/ground-boundaries/uniform-lambertian/consts.js`

Source: [src/algorithm32/ground-boundaries/uniform-lambertian/consts.js](../../../../../../src/algorithm32/ground-boundaries/uniform-lambertian/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `UNIFORM_LAMBERTIAN_GROUND_MODEL` | `<module>` | descriptive-other: Value that identifies the uniform Lambertian spectral ground model. | entity/value | none |
| 5 | constant | `DEFAULT_UNIFORM_LAMBERTIAN_GROUND_ID` | `<module>` | descriptive-other: Value that identifies an explicitly configured uniform Lambertian boundary by default. | entity/value | none |
| 8 | constant | `LAMBERTIAN_BRDF_SCALE` | `<module>` | descriptive-other: Value that converts hemispherical Lambertian reflectance into BRDF. | entity/value | none |
| 11 | constant | `UNIFORM_LAMBERTIAN_BRDF_PROVENANCE_PREFIX` | `<module>` | descriptive-other: Value that identifies packets derived by the uniform Lambertian boundary. | entity/value | none |
| 14 | constant | `GROUND_CACHE_REFLECTANCE_SYMBOL` | `<module>` | descriptive-other: Value that identifies the interchangeable ground-BRDF construction capability. | entity/value | none |
| 17 | constant | `UNIFORM_LAMBERTIAN_GROUND_CACHE_MODULE_ID` | `<module>` | descriptive-other: Value that identifies the uniform Lambertian ground's construction module. | entity/value | none |
| 20 | constant | `UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_ID` | `<module>` | descriptive-other: Value that identifies the typed spectral BRDF construction binding. | entity/value | none |
| 23 | constant | `UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_NAME` | `<module>` | descriptive-other: Name the typed spectral BRDF construction binding in GLSL. | entity/value | none |
| 26 | constant | `UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BLOCK_ID` | `<module>` | descriptive-other: Value that identifies the uniform Lambertian BRDF accessor source block. | entity/value | none |
| 29 | constant | `UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_FUNCTION_NAME` | `<module>` | descriptive-other: Name the uniform Lambertian BRDF accessor in construction GLSL. | entity/value | none |

## `src/algorithm32/ground-boundaries/uniform-lambertian/UniformLambertianGroundBoundary.js`

Source: [src/algorithm32/ground-boundaries/uniform-lambertian/UniformLambertianGroundBoundary.js](../../../../../../src/algorithm32/ground-boundaries/uniform-lambertian/UniformLambertianGroundBoundary.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 23 | class | `UniformLambertianGroundBoundary` | `<module>` | descriptive-other: Object that owns an explicitly configured spatially uniform Lambertian BRDF. | entity/value | none |
| 30 | field | `_brdf` | `UniformLambertianGroundBoundary` | descriptive-other: Brdf value. | entity/value | none |
| 39 | constructor | `<anonymous@39:2>` | `UniformLambertianGroundBoundary` | creates: Creates a boundary from profile-supplied spectral reflectance. | creates | params 1/1 |
| 62 | method | `_acceptAlbedo` | `UniformLambertianGroundBoundary` | called-by: Called by uniform lambertian ground boundary to accept a physical spectral hemispheri... | called-by | params 1/1; returns tagged; throws 1 |
| 76 | callback | `albedo.values.some::<callback@76:9>` | `_acceptAlbedo` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 1/1; returns tagged |
| 91 | method | `_createBrdfPacket` | `UniformLambertianGroundBoundary` | called-by: Called by uniform lambertian ground boundary to create the typed Lambertian BRDF packet. | called-by | params 1/1; returns tagged |
| 103 | callback | `albedo.values.map::<callback@103:10>` | `_createBrdfPacket` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 117 | method | `evaluateBrdf` | `UniformLambertianGroundBoundary` | call-this-method: Call this method to evaluate the uniform spectral BRDF on the requested exact basis. | active-callable | params 1/1; returns tagged |
| 129 | method | `createCacheModule` | `UniformLambertianGroundBoundary` | call-this-method: Call this method to contribute the typed Lambertian BRDF used by reflective cache pas... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/distant-sun/cache/consts.js`

Source: [src/algorithm32/light-sources/distant-sun/cache/consts.js](../../../../../../src/algorithm32/light-sources/distant-sun/cache/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 18 | constant | `DISTANT_SUN_CACHE_SYMBOLS_BY_PASS` | `<module>` | descriptive-other: Value that declares the base construction capabilities supplied by a distant Sun. | entity/value | none |
| 27 | constant | `DISTANT_SUN_CACHE_REQUIREMENTS_BY_PASS` | `<module>` | descriptive-other: Value that declares the base construction dependencies of a distant Sun. | entity/value | none |
| 52 | constant | `DISTANT_SUN_CACHE_IRRADIANCE_SYMBOL` | `<module>` | descriptive-other: Value that identifies source-owned spectral irradiance for direct ground reflection. | entity/value | none |
| 55 | constant | `DISTANT_SUN_GPU_FIELD_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Value that identifies source-owned GPU field provenance across construction domains. | entity/value | none |
| 58 | constant | `DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Value that identifies the production implementation used by distant-Sun CPU fields. | entity/value | none |
| 61 | constant | `DISTANT_SUN_CPU_PURE_J1_ID` | `<module>` | descriptive-other: Value that identifies the selected distant-Sun primary scattering-density CPU field. | entity/value | none |
| 63 | constant | `DISTANT_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Distant sun cpu primary scattering provenance identity constant. | entity/value | none |
| 66 | constant | `DISTANT_SUN_PRIMARY_SCATTERING_DIRECTION_TOLERANCE` | `<module>` | descriptive-other: Distant sun primary scattering direction tolerance constant. | entity/value | none |
| 73 | constant | `SOURCE_LOCAL_TOWARD_DISTANT_SUN` | `<module>` | descriptive-other: Source local toward distant sun constant. | entity/value | none |
| 76 | constant | `DISTANT_SUN_CPU_PURE_L1_ID` | `<module>` | descriptive-other: Value that identifies the selected distant-Sun direct-primary CPU field. | entity/value | none |
| 78 | constant | `DISTANT_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Distant sun cpu primary radiance provenance identity constant. | entity/value | none |
| 81 | constant | `DISTANT_SUN_PRIMARY_DIRECTION_TOLERANCE` | `<module>` | descriptive-other: Distant sun primary direction tolerance constant. | entity/value | none |
| 84 | constant | `UNIT_VECTOR_TOLERANCE` | `<module>` | descriptive-other: Tolerance used to accept normalized distant-Sun physical directions. | entity/value | none |
| 87 | constant | `W27_POSITIVE_X_FACE_CENTER_INDEX` | `<module>` | descriptive-other: W27 is face-major with 27-by-27 faces; each center uses u = v = 13. | entity/value | none |
| 89 | constant | `W27_POSITIVE_Y_FACE_CENTER_INDEX` | `<module>` | descriptive-other: W27 positive y face center index constant. | entity/value | none |
| 91 | constant | `W27_POSITIVE_Z_FACE_CENTER_INDEX` | `<module>` | descriptive-other: W27 positive z face center index constant. | entity/value | none |
| 94 | constant | `DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT` | `<module>` | descriptive-other: Value that stores the executable production CPU path-integration interval count. | entity/value | none |
| 97 | constant | `DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION` | `<module>` | descriptive-other: Value that stores the native production distant-Sun construction-domain selection. | entity/value | none |
| 108 | constant | `NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION` | `<module>` | descriptive-other: Value that stores the reduced Native16/W9 full-field production selection. | entity/value | none |
| 119 | constant | `NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION` | `<module>` | descriptive-other: Value that stores the tiny Native4/W3 explicit-zero production selection. | entity/value | none |
| 134 | constant | `DISTANT_SUN_CPU_FIRST_ORDER_CACHE_OPTIONS` | `<module>` | descriptive-other: Source-owned CPU N1 cache options. | entity/value | none |
| 144 | constant | `DISTANT_SUN_CPU_SECOND_ORDER_CACHE_OPTIONS` | `<module>` | descriptive-other: Source-owned CPU N2 cache options. | entity/value | none |

## `src/algorithm32/light-sources/distant-sun/cache/DistantSunCache.js`

Source: [src/algorithm32/light-sources/distant-sun/cache/DistantSunCache.js](../../../../../../src/algorithm32/light-sources/distant-sun/cache/DistantSunCache.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | constant | `CUMULATIVE_SCATTERING_SAMPLER_NAME` | `<module>` | descriptive-other: Cumulative scattering sampler name constant. | entity/value | none |
| 8 | class | `DistantSunCache` | `<module>` | descriptive-other: Owner of one completed distant-Sun cumulative GPU cache artifact. | entity/value | none |
| 15 | field | `_artifact` | `DistantSunCache` | descriptive-other: Artifact value. | entity/value | none |
| 16 | field | `_disposed` | `DistantSunCache` | descriptive-other: Disposed value. | entity/value | none |
| 25 | constructor | `<anonymous@25:2>` | `DistantSunCache` | creates: Creates a distant sun cache instance that takes ownership of one completely construct... | creates | params 1/1 |
| 34 | method | `getRuntimeBindings` | `DistantSunCache` | call-this-method: Call this method to return the opaque bindings for the privately owned cumulative field. | active-callable | returns tagged; throws 1 |
| 47 | method | `createShaderContribution` | `DistantSunCache` | call-this-method: Call this method to contribute the source-owned final-view tensor-product lookup. Geo... | active-callable | returns tagged; throws 1 |
| 113 | method | `dispose` | `DistantSunCache` | call-this-method: Call this method to release the completed cumulative GPU field exactly once. | active-callable | none |

## `src/algorithm32/light-sources/distant-sun/cache/DistantSunCacheController.js`

Source: [src/algorithm32/light-sources/distant-sun/cache/DistantSunCacheController.js](../../../../../../src/algorithm32/light-sources/distant-sun/cache/DistantSunCacheController.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 18 | class | `DistantSunCacheController` | `<module>` | descriptive-other: Controller for distant-Sun GPU cache construction within one runtime attachment. | entity/value | none |
| 25 | field | `_source` | `DistantSunCacheController` | descriptive-other: Source value. | entity/value | none |
| 32 | field | `_backend` | `DistantSunCacheController` | descriptive-other: Backend value. | entity/value | none |
| 39 | field | `_scheduler` | `DistantSunCacheController` | descriptive-other: Scheduler value. | entity/value | none |
| 46 | field | `_executor` | `DistantSunCacheController` | descriptive-other: Executor value. | entity/value | none |
| 53 | field | `_active` | `DistantSunCacheController` | descriptive-other: Active value. | entity/value | none |
| 60 | field | `_activeReuseKey` | `DistantSunCacheController` | descriptive-other: Active reuse key value. | entity/value | none |
| 67 | field | `_tail` | `DistantSunCacheController` | descriptive-other: Tail value. | entity/value | none |
| 74 | field | `_latestCancellation` | `DistantSunCacheController` | descriptive-other: Latest cancellation value. | entity/value | none |
| 75 | field | `_generation` | `DistantSunCacheController` | descriptive-other: Generation value. | entity/value | none |
| 76 | field | `_disposed` | `DistantSunCacheController` | descriptive-other: Disposed value. | entity/value | none |
| 84 | method | `_createAbortError` | `DistantSunCacheController` | called-by: Called by distant sun cache controller to create one ordinary cancellation error with... | called-by | params 1/1; returns tagged |
| 97 | method | `_acceptMaximumScatteringOrder` | `DistantSunCacheController` | called-by: Called by distant sun cache controller to accept one supported construction maximum. | called-by | params 1/1; returns tagged; throws 1 |
| 113 | method | `_acceptConstructionDomainSelection` | `DistantSunCacheController` | called-by: Called by DistantSunCacheController to accept the default or one explicit source-owne... | called-by | params 1/1; returns tagged; throws 1 |
| 135 | method | `_acceptConstructionOptions` | `DistantSunCacheController` | called-by: Called by DistantSunCacheController to accept direct-plan options while retaining pro... | called-by | params 2/2; returns tagged; throws 1 |
| 166 | method | `_createPureScatteringField` | `DistantSunCacheController` | called-by: Called by DistantSunCacheController to create a pure outgoing Jk field specification ... | called-by | params 2/2; returns tagged |
| 182 | method | `_createPureRadianceField` | `DistantSunCacheController` | called-by: Called by DistantSunCacheController to create a pure incoming Lk field specification ... | called-by | params 2/2; returns tagged |
| 198 | method | `_createCumulativeScatteringField` | `DistantSunCacheController` | called-by: Called by DistantSunCacheController to create a cumulative J-through-N field specific... | called-by | params 2/2; returns tagged |
| 219 | method | `_createPassContext` | `DistantSunCacheController` | called-by: Called by DistantSunCacheController to create one pass context from source-owned grap... | called-by | params 8/8; returns tagged |
| 239 | method | `_createLayoutModule` | `DistantSunCacheController` | called-by: Called by DistantSunCacheController to create the source-owned scalar output-layout m... | called-by | params 1/1; returns tagged |
| 290 | method | `_createPass` | `DistantSunCacheController` | called-by: Called by DistantSunCacheController to create one pass from only the concrete owner m... | called-by | params 1/1; returns tagged |
| 296 | callback | `definition.contributors.map::<callback@296:8>` | `modules` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 317 | callback | `definition.context.inputs.map::<callback@317:9>` | `_createPass` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 332 | method | `_createReuseKey` | `DistantSunCacheController` | called-by: Called by DistantSunCacheController reuse checks to derive the complete controller-lo... | called-by | params 2/2; returns tagged |
| 348 | method | `_acceptSpectralBasis` | `DistantSunCacheController` | called-by: Called by distant sun cache controller to require the selected native basis across ev... | called-by | params 2/2; throws 1 |
| 367 | method | `_acceptBuildRequest` | `DistantSunCacheController` | called-by: Called by distant sun cache controller to accept semantic values at the source-owned ... | called-by | params 2/2; returns tagged; throws 1 |
| 388 | method | `_linkCancellation` | `DistantSunCacheController` | called-by: Called by distant sun cache controller to link caller cancellation to one controller-... | called-by | params 2/2; returns tagged |
| 390 | callback | `<anonymous@390:98>` | `_linkCancellation` | called-by: Called by link cancellation to handle one invocation of the declared operation. | called-by | none |
| 395 | callback | `abort` | `abort` | called-by: Called by abort to abort. | called-by | returns tagged |
| 401 | callback | `<anonymous@401:8>` | `_linkCancellation` | called-by: Called by link cancellation to handle one invocation of the declared operation. | called-by | returns tagged |
| 410 | constructor | `<anonymous@410:2>` | `DistantSunCacheController` | creates: Creates one per-runtime distant-Sun cache controller. | creates | params 1/1 |
| 425 | accessor-get | `active` | `DistantSunCacheController` | descriptive-other: Active value. | entity/value | returns tagged |
| 438 | method | `createBuildPlan` | `DistantSunCacheController` | call-this-method: Call this method to derive the exact selected N1, N2, or N4 source-owned build graph ... | active-callable | params 1/1; returns tagged; throws 1 |
| 711 | method | `_requireCurrentGeneration` | `DistantSunCacheController` | called-by: Called by distant sun cache controller to require one generation to remain the live c... | called-by | params 2/2; throws 1 |
| 725 | method | `_executeGeneration` | `DistantSunCacheController` | called-by: Called by distant sun cache controller to build, reuse, or atomically publish one acc... | called-by | params 3/3; returns tagged; throws 1; async outcome mentioned |
| 766 | method | `createScatteringCache` | `DistantSunCacheController` | call-this-method: Call this method to construct or reuse one complete cumulative scattering cache. Newe... | active-callable | params 1/1; returns tagged |
| 789 | callback | `predecessor.then::<callback@789:8>` | `operation` | called-by: Called by the promise continuation to handle one callback invocation. | called-by | returns tagged |
| 792 | callback | `operation.then::<callback@792:81>` | `createScatteringCache` | called-by: Called by the promise continuation to handle one callback invocation. | called-by | none |
| 793 | callback | `operation.then::<callback@793:81>` | `createScatteringCache` | called-by: Called by the promise continuation to handle one callback invocation. | called-by | none |
| 797 | callback | `operation.finally::<callback@797:82>` | `createScatteringCache` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | none |
| 807 | method | `dispose` | `DistantSunCacheController` | call-this-method: Call this method to cancel staging and release the active cache without owning the ba... | active-callable | none |

## `src/algorithm32/light-sources/distant-sun/cache/DistantSunCacheProvider.js`

Source: [src/algorithm32/light-sources/distant-sun/cache/DistantSunCacheProvider.js](../../../../../../src/algorithm32/light-sources/distant-sun/cache/DistantSunCacheProvider.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 23 | class | `DistantSunCacheProvider` | `<module>` | descriptive-other: Distant-Sun cache construction, recurrence, and controller provider. | entity/value | none |
| 28 | field | `_source` | `DistantSunCacheProvider` | descriptive-other: Configured physical source facade. | entity/value | none |
| 33 | field | `_configuration` | `DistantSunCacheProvider` | descriptive-other: Immutable normalized source configuration. | entity/value | none |
| 38 | field | `_primaryEvaluator` | `DistantSunCacheProvider` | descriptive-other: Provider-owned primary J1/L1 evaluator. | entity/value | none |
| 43 | field | `_multipleScatteringEvaluator` | `DistantSunCacheProvider` | descriptive-other: Provider-owned later-order and stored-field evaluator. | entity/value | none |
| 51 | constructor | `<anonymous@51:2>` | `DistantSunCacheProvider` | creates: Creates a cache provider for one configured distant-Sun facade. | creates | params 2/2 |
| 70 | method | `_createField` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider field allocators to create one source- owned binary... | called-by | params 1/1; returns tagged |
| 87 | callback | `Array.from::<callback@87:15>` | `order` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 110 | method | `_createPureRadianceField` | `DistantSunCacheProvider` | called-by: Called by provider-owned primary and multiple-scattering evaluation to allocate one i... | called-by | params 1/1; returns tagged |
| 128 | method | `_createPureScatteringDensityField` | `DistantSunCacheProvider` | called-by: Called by provider-owned recurrence and primary evaluation to allocate one independen... | called-by | params 1/1; returns tagged |
| 146 | method | `_createCumulativeScatteringDensityField` | `DistantSunCacheProvider` | called-by: Called by cumulative-result construction to allocate one independently mutable cumula... | called-by | params 1/1; returns tagged |
| 167 | method | `_boundaryFieldIdentitySuffix` | `DistantSunCacheProvider` | called-by: Called by CPU recurrence construction to derive the boundary-dependent field suffix w... | called-by | params 1/1; returns tagged |
| 187 | method | `_resolveConstructionOptions` | `DistantSunCacheProvider` | called-by: Called by completed CPU recurrence construction to report the exact executed options ... | called-by | params 2/2; returns tagged |
| 209 | method | `_buildCumulativeResult` | `DistantSunCacheProvider` | called-by: Called by CPU recurrence construction to allocate, accumulate, and seal the final cum... | called-by | params 1/1; returns tagged |
| 237 | method | `_buildCpuCache` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to construct the complete source-owned CPU recurren... | called-by | params 1/1; returns tagged |
| 359 | method | `createCacheModule` | `DistantSunCacheProvider` | call-this-method: Call this method to create the source-owned program portions for one cache pass. | active-callable | params 1/1; returns tagged |
| 561 | method | `createCacheController` | `DistantSunCacheProvider` | call-this-method: Call this method to create one cache controller for a renderer attachment. | active-callable | params 1/1; returns tagged |
| 575 | method | `_hasReflectiveCpuGround` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to identify the reflective branch of the public CPU... | called-by | params 1/1; returns tagged |
| 585 | method | `_resolveConstructionDomainSelection` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to resolve the default or explicitly selected execu... | called-by | params 1/1; returns tagged |
| 597 | method | `_acceptCpuTransportIntervalCount` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to accept one executable CPU path-integration inter... | called-by | params 2/2; returns tagged; throws 1 |
| 613 | method | `_createCpuScatteringKernel` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to create one order-specific CPU scattering kernel ... | called-by | params 2/2; returns tagged |
| 646 | method | `_buildCpuTransportedRadiance` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to build one boundary-identified pure stored-field ... | called-by | params 2/2; returns tagged |
| 667 | method | `_createCpuRecurrenceOperations` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to bind source-owned CPU recurrence methods for N2. | called-by | params 1/1; returns tagged |
| 680 | method | `_createCpuFourthOrderRecurrenceOperations` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to bind source-owned CPU recurrence methods for N4. | called-by | params 1/1; returns tagged |
| 694 | method | `_acceptCpuRecurrenceProfile` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to select the omitted-ground default and verify exp... | called-by | params 1/1; returns tagged; throws 1 |
| 725 | method | `_assertStoredFieldTransportGeometry` | `DistantSunCacheProvider` | called-by: Called by DistantSunCacheProvider to require the geometry operations used only by N=4... | called-by | params 1/1; throws 1 |
| 748 | method | `buildCpuScatteringCache` | `DistantSunCacheProvider` | call-this-method: Call this method to build one complete nonresident CPU scattering result. Plain sourc... | active-callable | params 1/1; returns tagged; throws 1 |
| 828 | method | `buildCpuPrimaryRadianceField` | `DistantSunCacheProvider` | call-this-method: Call this method to build the source-owned direct CPU primary-radiance field. This fo... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/distant-sun/cache/DistantSunConstructionDomainSelection.js`

Source: [src/algorithm32/light-sources/distant-sun/cache/DistantSunConstructionDomainSelection.js](../../../../../../src/algorithm32/light-sources/distant-sun/cache/DistantSunConstructionDomainSelection.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | class | `DistantSunConstructionDomainSelection` | `<module>` | descriptive-other: Object that owns one coherent executable construction-domain selection for distant-Su... | entity/value | none |
| 11 | field | `_outgoingDirectionDomainOwner` | `DistantSunConstructionDomainSelection` | descriptive-other: Outgoing direction domain owner value. | entity/value | none |
| 19 | field | `kind` | `DistantSunConstructionDomainSelection` | descriptive-other: Kind value. | entity/value | none |
| 26 | field | `id` | `DistantSunConstructionDomainSelection` | descriptive-other: Id value. | entity/value | none |
| 33 | field | `positionDomain` | `DistantSunConstructionDomainSelection` | descriptive-other: Position domain value. | entity/value | none |
| 40 | field | `positionNodes` | `DistantSunConstructionDomainSelection` | descriptive-other: Position nodes value. | entity/value | none |
| 47 | field | `positionCount` | `DistantSunConstructionDomainSelection` | descriptive-other: Position count value. | entity/value | none |
| 54 | field | `bottomRadius` | `DistantSunConstructionDomainSelection` | descriptive-other: Bottom radius value. | entity/value | none |
| 61 | field | `topRadius` | `DistantSunConstructionDomainSelection` | descriptive-other: Top radius value. | entity/value | none |
| 68 | field | `incomingDirectionDomain` | `DistantSunConstructionDomainSelection` | descriptive-other: Incoming direction domain value. | entity/value | none |
| 75 | field | `incomingUnitVectors` | `DistantSunConstructionDomainSelection` | descriptive-other: Incoming unit vectors value. | entity/value | none |
| 82 | field | `incomingIntegrationWeights` | `DistantSunConstructionDomainSelection` | descriptive-other: Incoming integration weights value. | entity/value | none |
| 89 | field | `incomingDirectionCount` | `DistantSunConstructionDomainSelection` | descriptive-other: Incoming direction count value. | entity/value | none |
| 96 | field | `outgoingDirectionDomain` | `DistantSunConstructionDomainSelection` | descriptive-other: Outgoing direction domain value. | entity/value | none |
| 103 | field | `outgoingUnitVectors` | `DistantSunConstructionDomainSelection` | descriptive-other: Outgoing unit vectors value. | entity/value | none |
| 110 | field | `outgoingDirectionCount` | `DistantSunConstructionDomainSelection` | descriptive-other: Outgoing direction count value. | entity/value | none |
| 117 | field | `outgoingPositiveFaceCenterIndices` | `DistantSunConstructionDomainSelection` | descriptive-other: Outgoing positive face center indices value. | entity/value | none |
| 124 | field | `spectralBasis` | `DistantSunConstructionDomainSelection` | descriptive-other: Spectral basis value. | entity/value | none |
| 131 | field | `spectralChannelCount` | `DistantSunConstructionDomainSelection` | descriptive-other: Spectral channel count value. | entity/value | none |
| 138 | field | `radiancePacking` | `DistantSunConstructionDomainSelection` | descriptive-other: Radiance packing value. | entity/value | none |
| 145 | field | `scatteringDensityPacking` | `DistantSunConstructionDomainSelection` | descriptive-other: Scattering density packing value. | entity/value | none |
| 154 | constructor | `<anonymous@154:2>` | `DistantSunConstructionDomainSelection` | creates: Creates one coherent construction-domain selection and its executable packings. | creates | params 1/1 |
| 193 | method | `resolveOutgoingDirectionStencil` | `DistantSunConstructionDomainSelection` | call-this-method: Call this method to resolve one source-local outgoing reconstruction stencil. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/distant-sun/cache/DistantSunCpuCache.js`

Source: [src/algorithm32/light-sources/distant-sun/cache/DistantSunCpuCache.js](../../../../../../src/algorithm32/light-sources/distant-sun/cache/DistantSunCpuCache.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 13 | class | `DistantSunCpuCache` | `<module>` | descriptive-other: Object that owns the resident cumulative CPU field for one completed distant-Sun buil... | entity/value | none |
| 20 | field | `_cumulativeReader` | `DistantSunCpuCache` | descriptive-other: Cumulative reader value. | entity/value | none |
| 27 | field | `_sampleProvenanceIdentity` | `DistantSunCpuCache` | descriptive-other: Provenance identity of the stored samples. | entity/value | none |
| 35 | constructor | `<anonymous@35:2>` | `DistantSunCpuCache` | creates: Creates a distant sun cpu cache instance that consumes one completed N1, N2, or N4 di... | creates | params 1/1 |
| 47 | accessor-get | `sampleProvenanceIdentity` | `DistantSunCpuCache` | descriptive-other: Provenance identity of the stored samples. | entity/value | returns tagged |
| 57 | method | `_requireCumulativeReader` | `DistantSunCpuCache` | called-by: Called by distant sun cpu cache to require the resident reader while this cache remai... | called-by | returns tagged; throws 1 |
| 71 | method | `sampleResolved` | `DistantSunCpuCache` | call-this-method: Call this method to sample all wavelengths from geometry/domain-resolved physical ste... | active-callable | params 1/1; returns tagged |
| 111 | method | `dispose` | `DistantSunCpuCache` | call-this-method: Call this method to release this cache's resident reader. Repeated disposal is safe. | active-callable | none |

## `src/algorithm32/light-sources/distant-sun/cache/DistantSunCpuMultipleScatteringEvaluator.js`

Source: [src/algorithm32/light-sources/distant-sun/cache/DistantSunCpuMultipleScatteringEvaluator.js](../../../../../../src/algorithm32/light-sources/distant-sun/cache/DistantSunCpuMultipleScatteringEvaluator.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 21 | class | `DistantSunCpuMultipleScatteringEvaluator` | `<module>` | descriptive-other: Stored-field transport, later-order scattering, and ground-reflection evaluator. | entity/value | none |
| 26 | field | `_source` | `DistantSunCpuMultipleScatteringEvaluator` | descriptive-other: Configured physical source captured for the provider lifetime. | entity/value | none |
| 31 | field | `_configuration` | `DistantSunCpuMultipleScatteringEvaluator` | descriptive-other: Normalized source configuration captured for the provider lifetime. | entity/value | none |
| 36 | field | `_fieldAllocators` | `DistantSunCpuMultipleScatteringEvaluator` | descriptive-other: Provider-owned field allocation operations. | entity/value | none |
| 45 | constructor | `<anonymous@45:2>` | `DistantSunCpuMultipleScatteringEvaluator` | creates: Creates a multiple-scattering evaluator for one configured distant-Sun provider. | creates | params 3/3 |
| 59 | method | `_assertUnitVector` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by later-order evaluation to require one finite normalized physical direction. | called-by | params 2/2; returns tagged; throws 1 |
| 77 | method | `_assertMatchingSourceDirections` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by later-order evaluation to require matching physical source axes at the geom... | called-by | params 2/2; throws 1 |
| 85 | callback | `directionToSource.some::<callback@85:9>` | `_assertMatchingSourceDirections` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 2/2; returns tagged |
| 100 | method | `_dot` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by later-order evaluation to compute one dot product in the selected productio... | called-by | params 2/2; returns tagged |
| 112 | method | `_cross` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by later-order evaluation to compute one cross product in the selected product... | called-by | params 2/2; returns tagged |
| 129 | method | `_assertPhysicalCubedSphereBasis` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by later-order evaluation to apply the one-time cubed-sphere basis acceptance ... | called-by | params 2/2; throws 1 |
| 154 | method | `_assertAdapterRequest` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by later-order evaluation to bind provider-captured source facts and check num... | called-by | params 1/1; returns tagged |
| 192 | method | `_createPhysicalPositionResolver` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by kernel construction to precompute geometry-owned physical positions for eve... | called-by | params 2/2; returns tagged |
| 198 | callback | `domainSelection.positionNodes.map::<callback@198:8>` | `physicalPositions` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 206 | callback | `<anonymous@206:8>` | `_createPhysicalPositionResolver` | called-by: Called by create physical position resolver to handle one invocation of the declared ... | called-by | params 1/1; returns tagged |
| 218 | method | `_createPhysicalDirectionResolvers` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by kernel construction to precompute the distinct physical incoming and outgoi... | called-by | params 2/2; returns tagged |
| 224 | callback | `domainSelection.incomingUnitVectors.map::<callback@224:8>` | `physicalIncomingDirections` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 235 | callback | `domainSelection.outgoingUnitVectors.map::<callback@235:8>` | `physicalOutgoingDirections` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 248 | callback | `incoming` | `_createPhysicalDirectionResolvers` | called-by: Called by create physical direction resolvers to incoming. | called-by | params 1/1; returns tagged |
| 253 | callback | `outgoing` | `_createPhysicalDirectionResolvers` | called-by: Called by create physical direction resolvers to outgoing. | called-by | params 1/1; returns tagged |
| 264 | method | `_groundIlluminationReader` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by reflective-ground evaluation to select pure L(k-2) as the only higher-order... | called-by | params 1/1; returns tagged |
| 282 | method | `_groundPathTransmittance` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by reflective-ground evaluation to integrate atmosphere transmittance for one ... | called-by | params 4/4; returns tagged |
| 303 | method | `_groundToPositionTransmittance` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by reflective-ground evaluation to preserve the exact unit- transmittance shor... | called-by | params 4/4; returns tagged |
| 329 | method | `_directGroundReflectedRadiance` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by J2 ground evaluation to compute direct-source reflected radiance at one gro... | called-by | params 4/4; returns tagged |
| 374 | method | `_readGroundIllumination` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by indirect ground evaluation to read one exact-direction spectrum through a g... | called-by | params 4/4; returns tagged |
| 406 | method | `_indirectGroundReflectedRadiance` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by higher-order ground evaluation to integrate pure L(k-2) illumination into r... | called-by | params 8/8; returns tagged |
| 463 | method | `_createGroundIncomingRadianceContributor` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by reflective kernel construction to create the captured ground contribution i... | called-by | params 2/2; returns tagged |
| 470 | callback | `<anonymous@470:8>` | `_createGroundIncomingRadianceContributor` | called-by: Called by create ground incoming radiance contributor to handle one invocation of the... | called-by | params 1/1 |
| 527 | method | `createLaterOrderScatteringKernel` | `DistantSunCpuMultipleScatteringEvaluator` | call-this-method: Call this method to create the configured distant-Sun physical later-order scattering... | active-callable | params 1/1; returns tagged |
| 575 | method | `_resolveDistantSunBuildCoordinate` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by stored-field transport to resolve one native-altitude cache coordinate in t... | called-by | params 2/2; returns tagged |
| 596 | method | `_normalizeTransportRequest` | `DistantSunCpuMultipleScatteringEvaluator` | called-by: Called by stored-field transport to resolve source-owned executable facts before outp... | called-by | params 1/1; returns tagged |
| 620 | method | `buildTransportedRadiance` | `DistantSunCpuMultipleScatteringEvaluator` | call-this-method: Call this method to allocate and build one distant-Sun pure Lk field through the sele... | active-callable | params 1/1; returns tagged |
| 646 | callback | `resolvePositionStencil` | `buildTransportedRadiance` | called-by: Called by build transported radiance to resolve position stencil. | called-by | params 1/1; returns tagged |
| 655 | callback | `resolveDirectionStencil` | `buildTransportedRadiance` | called-by: Called by build transported radiance to resolve direction stencil. | called-by | params 1/1; returns tagged |
| 660 | callback | `resolveBuildCoordinate` | `buildTransportedRadiance` | called-by: Called by build transported radiance to resolve build coordinate. | called-by | params 1/1; returns tagged |
| 666 | callback | `resolvePhysicalRadianceDirection` | `buildTransportedRadiance` | called-by: Called by build transported radiance to resolve physical radiance direction. | called-by | params 1/1; returns tagged |

## `src/algorithm32/light-sources/distant-sun/cache/DistantSunCpuPrimaryEvaluator.js`

Source: [src/algorithm32/light-sources/distant-sun/cache/DistantSunCpuPrimaryEvaluator.js](../../../../../../src/algorithm32/light-sources/distant-sun/cache/DistantSunCpuPrimaryEvaluator.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 24 | class | `DistantSunCpuPrimaryEvaluator` | `<module>` | descriptive-other: Primary spectral, J1, direct L1, phase, and source-transmittance evaluator. | entity/value | none |
| 29 | field | `_source` | `DistantSunCpuPrimaryEvaluator` | descriptive-other: Configured physical source captured for the provider lifetime. | entity/value | none |
| 34 | field | `_configuration` | `DistantSunCpuPrimaryEvaluator` | descriptive-other: Normalized source configuration captured for the provider lifetime. | entity/value | none |
| 39 | field | `_fieldAllocators` | `DistantSunCpuPrimaryEvaluator` | descriptive-other: Provider-owned field allocation operations. | entity/value | none |
| 48 | constructor | `<anonymous@48:2>` | `DistantSunCpuPrimaryEvaluator` | creates: Creates a primary evaluator for one configured distant-Sun provider. | creates | params 3/3 |
| 62 | method | `_requireUnitVector` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by primary evaluation to require a normalized three-component direction. | called-by | params 2/2; returns tagged; throws 1 |
| 77 | method | `_selectNativeProfile` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by primary evaluation to select the native profile and its direct-source packet. | called-by | params 1/1; returns tagged |
| 96 | method | `_assertDirectLightingSemantics` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by direct L1 evaluation to check one direct-source sample against the selected... | called-by | params 2/2; returns tagged; throws 1 |
| 106 | callback | `sourceIrradiance.values.some::<callback@106:9>` | `_assertDirectLightingSemantics` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 2/2; returns tagged |
| 125 | method | `_resolvePrimaryRadianceBuildRequest` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by direct L1 evaluation to resolve physical collaborators and identities befor... | called-by | params 1/1; returns tagged |
| 163 | method | `_writeRadianceSpectrum` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by direct L1 evaluation to write one complete spectral sample into the output ... | called-by | params 5/5 |
| 183 | method | `createSpectralCalculator` | `DistantSunCpuPrimaryEvaluator` | call-this-method: Call this method to create the canonical spectral calculator shared by direct L1, lat... | active-callable | params 1/1; returns tagged |
| 207 | method | `buildPrimaryRadiance` | `DistantSunCpuPrimaryEvaluator` | call-this-method: Call this method to build sealed physical pure L1 over the selected position, incomin... | active-callable | params 1/1; returns tagged; throws 1 |
| 289 | method | `_assertNormalizedDirection` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by primary J1 evaluation to preserve the normalized-direction numerical contra... | called-by | params 2/2; throws 1 |
| 303 | method | `_assertNativeAtmosphereBasis` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by primary J1 evaluation to require an atmosphere aligned with the native spec... | called-by | params 1/1 |
| 318 | method | `_resolvePrimaryScatteringBuildRequest` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by primary J1 evaluation to resolve trusted physical collaborators, defaults, ... | called-by | params 1/1; returns tagged |
| 352 | method | `_resolveDirectLighting` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by primary J1 evaluation to bind direct-source channel values to the selected ... | called-by | params 2/2; returns tagged; throws 1 |
| 367 | callback | `sourceIrradiance.values.some::<callback@367:9>` | `_resolveDirectLighting` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 2/2; returns tagged |
| 387 | method | `_resolveSourceTransmittance` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by primary J1 evaluation to resolve sample-to-source transmittance for one phy... | called-by | params 1/1; returns tagged |
| 411 | method | `_primaryScatteringDensity` | `DistantSunCpuPrimaryEvaluator` | called-by: Called by primary J1 evaluation to compute one physical spectral scattering-density s... | called-by | params 6/6; returns tagged |
| 435 | method | `buildPrimaryScatteringDensity` | `DistantSunCpuPrimaryEvaluator` | call-this-method: Call this method to build sealed physical pure J1 over the selected position, outgoin... | active-callable | params 1/1; returns tagged; throws 1 |
| 453 | callback | `domainSelection.outgoingUnitVectors.map::<callback@453:8>` | `sourceLocalPhaseSamples` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 493 | callback | `rayleighScatteringPerMeter.some::<callback@493:11>` | `buildPrimaryScatteringDensity` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 2/2; returns tagged |

## `src/algorithm32/light-sources/distant-sun/cache/DistantSunFieldPacking.js`

Source: [src/algorithm32/light-sources/distant-sun/cache/DistantSunFieldPacking.js](../../../../../../src/algorithm32/light-sources/distant-sun/cache/DistantSunFieldPacking.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `DistantSunFieldPacking` | `<module>` | descriptive-other: Object that owns executable direction-fastest storage for one distant-Sun field. | entity/value | none |
| 9 | field | `kind` | `DistantSunFieldPacking` | descriptive-other: Kind value. | entity/value | none |
| 17 | field | `id` | `DistantSunFieldPacking` | descriptive-other: Id value. | entity/value | none |
| 24 | field | `directionCount` | `DistantSunFieldPacking` | descriptive-other: Direction count value. | entity/value | none |
| 31 | field | `positionCount` | `DistantSunFieldPacking` | descriptive-other: Position count value. | entity/value | none |
| 38 | field | `wavelengthCount` | `DistantSunFieldPacking` | descriptive-other: Wavelength count value. | entity/value | none |
| 45 | field | `scalarCount` | `DistantSunFieldPacking` | descriptive-other: Scalar count value. | entity/value | none |
| 54 | constructor | `<anonymous@54:2>` | `DistantSunFieldPacking` | creates: Creates source-owned executable packing from typed logical field counts. | creates | params 1/1 |
| 74 | method | `_assertIndex` | `DistantSunFieldPacking` | called-by: Called by distant sun field packing to require one zero-based safe integer within an ... | called-by | params 3/3; throws 1 |
| 87 | method | `offset` | `DistantSunFieldPacking` | call-this-method: Call this method to return one direction-fastest linear scalar offset. | active-callable | params 1/1; returns tagged |
| 102 | method | `coordinatesAt` | `DistantSunFieldPacking` | call-this-method: Call this method to recover logical coordinates from one declared scalar offset. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/distant-sun/DistantSunLightSource.js`

Source: [src/algorithm32/light-sources/distant-sun/DistantSunLightSource.js](../../../../../../src/algorithm32/light-sources/distant-sun/DistantSunLightSource.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | class | `DistantSunLightSource` | `<module>` | descriptive-other: Physical distant-Sun source facade for atmospheric and endpoint lighting. | entity/value | none |
| 15 | field | `_configuration` | `DistantSunLightSource` | descriptive-other: Immutable normalized source configuration. | entity/value | none |
| 20 | field | `_cacheProvider` | `DistantSunLightSource` | descriptive-other: Source-owned cache construction and lifecycle provider. | entity/value | none |
| 25 | field | `_shaderContributor` | `DistantSunLightSource` | descriptive-other: Source-owned final-view shader contributor. | entity/value | none |
| 30 | field | `_sceneAdapter` | `DistantSunLightSource` | descriptive-other: Source-owned Three scene-lighting adapter. | entity/value | none |
| 38 | constructor | `<anonymous@38:2>` | `DistantSunLightSource` | creates: Creates a distant-Sun light source from physical direction, irradiance, and apparent ... | creates | params 1/1; throws 1 |
| 71 | accessor-get | `configuration` | `DistantSunLightSource` | descriptive-other: Immutable normalized source configuration. | entity/value | returns tagged |
| 80 | accessor-get | `id` | `DistantSunLightSource` | descriptive-other: Compatibility identifier for the configured source model. | entity/value | returns tagged |
| 90 | method | `createCacheModule` | `DistantSunLightSource` | call-this-method: Call this method to create the source-owned construction module for one cache pass. | active-callable | params 1/1; returns tagged |
| 100 | method | `createCacheController` | `DistantSunLightSource` | call-this-method: Call this method to create one distant-Sun cache controller for a renderer attachment. | active-callable | params 1/1; returns tagged |
| 114 | method | `buildCpuScatteringCache` | `DistantSunLightSource` | call-this-method: Call this method to build one complete nonresident CPU scattering result. Plain sourc... | active-callable | params 1/1; returns tagged |
| 127 | method | `buildCpuPrimaryRadianceField` | `DistantSunLightSource` | call-this-method: Call this method to build the source-owned direct CPU primary-radiance field. This fo... | active-callable | params 1/1; returns tagged |
| 136 | method | `sampleDirectLighting` | `DistantSunLightSource` | call-this-method: Call this method to sample direct source lighting at a transport point. | active-callable | returns tagged |
| 153 | method | `resolveSceneLightScales` | `DistantSunLightSource` | call-this-method: Call this method to resolve neutral local scene-light scales for the distant source. | active-callable | params 1/1; returns tagged |
| 163 | method | `addSceneLighting` | `DistantSunLightSource` | call-this-method: Call this method to add or create source-owned scene lighting for endpoint rendering. | active-callable | params 1/1; returns tagged |
| 174 | method | `configureThreeShadowObject` | `DistantSunLightSource` | call-this-method: Call this method to configure an app-authored Three object tree for source shadows. | active-callable | params 2/2; returns tagged |
| 183 | method | `resolveSourcePathLimit` | `DistantSunLightSource` | call-this-method: Call this method to resolve the source path limit for a directional source. | active-callable | returns tagged |
| 195 | method | `createShaderContribution` | `DistantSunLightSource` | call-this-method: Call this method to create the light-source-owned distant-Sun shader contribution. | active-callable | returns tagged |

## `src/algorithm32/light-sources/distant-sun/DistantSunShaderContributor.js`

Source: [src/algorithm32/light-sources/distant-sun/DistantSunShaderContributor.js](../../../../../../src/algorithm32/light-sources/distant-sun/DistantSunShaderContributor.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | class | `DistantSunShaderContributor` | `<module>` | descriptive-other: Distant-Sun final-view shader contribution provider. | entity/value | none |
| 9 | field | `_configuration` | `DistantSunShaderContributor` | descriptive-other: Immutable normalized source configuration. | entity/value | none |
| 16 | constructor | `<anonymous@16:2>` | `DistantSunShaderContributor` | creates: Creates a shader contributor for one normalized distant-Sun configuration. | creates | params 1/1 |
| 26 | method | `createShaderContribution` | `DistantSunShaderContributor` | call-this-method: Call this method to create the source-owned distant-Sun shader contribution. | active-callable | returns tagged |

## `src/algorithm32/light-sources/distant-sun/three/consts.js`

Source: [src/algorithm32/light-sources/distant-sun/three/consts.js](../../../../../../src/algorithm32/light-sources/distant-sun/three/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `DEFAULT_DISTANT_SUN_SCENE_AMBIENT_INTENSITY_RANGE` | `<module>` | descriptive-other: Default ambient intensity range for distant-Sun endpoint lighting. | entity/value | none |
| 8 | constant | `DISTANT_SUN_SHADOW_REQUEST_PROPERTIES` | `<module>` | descriptive-other: Supported properties of a distant-Sun shadow request. | entity/value | none |
| 11 | constant | `DISTANT_SUN_SHADOW_OBJECT_REQUEST_PROPERTIES` | `<module>` | descriptive-other: Supported properties of one distant-Sun shadow-object request. | entity/value | none |

## `src/algorithm32/light-sources/distant-sun/three/DistantSunSceneLightingAdapter.js`

Source: [src/algorithm32/light-sources/distant-sun/three/DistantSunSceneLightingAdapter.js](../../../../../../src/algorithm32/light-sources/distant-sun/three/DistantSunSceneLightingAdapter.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 15 | class | `DistantSunSceneLightingAdapter` | `<module>` | descriptive-other: Distant-Sun adaptation for scene-light scaling and Three lighting objects. | entity/value | none |
| 20 | field | `_source` | `DistantSunSceneLightingAdapter` | descriptive-other: Configured physical source facade. | entity/value | none |
| 25 | field | `_configuration` | `DistantSunSceneLightingAdapter` | descriptive-other: Immutable normalized source configuration. | entity/value | none |
| 33 | constructor | `<anonymous@33:2>` | `DistantSunSceneLightingAdapter` | creates: Creates a Three scene-lighting adapter for one distant-Sun facade. | creates | params 2/2 |
| 46 | method | `_smoothStep` | `DistantSunSceneLightingAdapter` | called-by: Called by DistantSunSceneLightingAdapter to map a value smoothly between two edges. I... | called-by | params 3/3; returns tagged |
| 65 | method | `_dot` | `DistantSunSceneLightingAdapter` | called-by: Called by DistantSunSceneLightingAdapter to calculate the dot product of two vectors. | called-by | params 2/2; returns tagged |
| 80 | method | `_assertOnlyProperties` | `DistantSunSceneLightingAdapter` | called-by: Called by DistantSunSceneLightingAdapter to reject non-canonical properties at its sh... | called-by | params 4/4; throws 1 |
| 86 | callback | `Object.keys(value).find::<callback@86:8>` | `unexpectedProperty` | called-by: Called by Array.prototype.find to test one collection value for selection. | called-by | params 1/1; returns tagged |
| 106 | method | `_normalizeShadowObjectRequest` | `DistantSunSceneLightingAdapter` | called-by: Called by DistantSunSceneLightingAdapter to normalize one shadow-object request. | called-by | params 4/4; returns tagged; throws 1 |
| 246 | method | `_normalizeShadowRequest` | `DistantSunSceneLightingAdapter` | called-by: Called by DistantSunSceneLightingAdapter to normalize the canonical shadow request. I... | called-by | params 3/3; returns tagged; throws 2 |
| 281 | callback | `shadow.objects.map::<callback@281:8>` | `objects` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged; throws 1 |
| 317 | method | `_applyDirectionalShadow` | `DistantSunSceneLightingAdapter` | called-by: Called by DistantSunSceneLightingAdapter to apply normalized directional shadow setti... | called-by | params 2/2 |
| 348 | method | `_createDirectionalLight` | `DistantSunSceneLightingAdapter` | called-by: Called by DistantSunSceneLightingAdapter to create one directional light and target p... | called-by | params 1/1; returns tagged |
| 391 | method | `resolveSceneLightScales` | `DistantSunSceneLightingAdapter` | call-this-method: Call this method to resolve neutral local scene-light scales for a distant source. | active-callable | params 1/1; returns tagged |
| 435 | method | `_createThreeAmbientLight` | `DistantSunSceneLightingAdapter` | called-by: Called by DistantSunSceneLightingAdapter to create the source-owned ambient fill light. | called-by | params 1/1; returns tagged; throws 2 |
| 468 | method | `addSceneLighting` | `DistantSunSceneLightingAdapter` | call-this-method: Call this method to add or create source-owned endpoint scene lighting. | active-callable | params 1/1; returns tagged; throws 2 |
| 531 | callback | `shadowObjects.map::<callback@531:11>` | `sourceLights` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 558 | callback | `sourceLights.map::<callback@558:8>` | `sceneObjects` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 566 | callback | `sourceLights.map::<callback@566:9>` | `lights` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 614 | method | `configureThreeShadowObject` | `DistantSunSceneLightingAdapter` | call-this-method: Call this method to configure an app-authored Three object tree for source shadows. | active-callable | params 2/2; returns tagged |

## `src/algorithm32/light-sources/local-sun/cache/consts.js`

Source: [src/algorithm32/light-sources/local-sun/cache/consts.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME` | `<module>` | descriptive-other: Value that identifies the completed local-Sun cumulative runtime sampler. | entity/value | none |
| 5 | constant | `LOCAL_SUN_CACHE_PLAN_ID` | `<module>` | descriptive-other: Value that identifies the source-owned local-Sun cache construction graph. | entity/value | none |
| 8 | constant | `LOCAL_SUN_CACHE_REUSE_KEY_SCHEMA_REVISION` | `<module>` | descriptive-other: Value that identifies the deterministic local-Sun GPU cache reuse-key schema. | entity/value | none |
| 15 | constant | `LOCAL_SUN_SHELL_COUNT` | `<module>` | descriptive-other: Accepted fixed local-Sun shell-fact count. | entity/value | none |
| 22 | constant | `LOCAL_SUN_SHELL_BOUNDARY_COUNT` | `<module>` | descriptive-other: Local sun shell boundary count constant. | entity/value | none |
| 24 | constant | `LOCAL_SUN_SHELL_SEARCH_ITERATION_COUNT` | `<module>` | descriptive-other: Value that selects the fixed higher-index shell-boundary search iteration count. | entity/value | none |
| 26 | constant | `LOCAL_SUN_SHELL_MAP_RADIUS_METERS` | `<module>` | descriptive-other: Local sun shell map radius meters constant. | entity/value | none |
| 28 | constant | `LOCAL_SUN_SHELL_ATMOSPHERE_APEX_METERS` | `<module>` | descriptive-other: Local sun shell atmosphere apex meters constant. | entity/value | none |
| 30 | constant | `LOCAL_SUN_SHELL_FACT_ID` | `<module>` | descriptive-other: Local sun shell fact id constant. | entity/value | none |
| 33 | constant | `LOCAL_SUN_DEFAULT_Z_NODE_COUNT` | `<module>` | descriptive-other: Value that stores the selected local-Sun z-by-rho position-grid dimensions. | entity/value | none |
| 35 | constant | `LOCAL_SUN_DEFAULT_RHO_NODE_COUNT` | `<module>` | descriptive-other: Local sun default rho node count constant. | entity/value | none |
| 38 | constant | `LOCAL_SUN_CONSTRUCTION_DOMAIN_ID` | `<module>` | descriptive-other: Value that identifies the source-owned local-Sun construction domain and packings. | entity/value | none |
| 40 | constant | `LOCAL_SUN_RADIANCE_PACKING_ID` | `<module>` | descriptive-other: Local sun radiance packing id constant. | entity/value | none |
| 42 | constant | `LOCAL_SUN_SCATTERING_DENSITY_PACKING_ID` | `<module>` | descriptive-other: Local sun scattering density packing id constant. | entity/value | none |
| 46 | constant | `LOCAL_SUN_CPU_FIELD_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Value that identifies local-Sun binary64 field algorithms. | entity/value | none |
| 48 | constant | `LOCAL_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Local sun cpu primary scattering provenance identity constant. | entity/value | none |
| 51 | constant | `LOCAL_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Local sun cpu primary radiance provenance identity constant. | entity/value | none |
| 54 | constant | `LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Local sun cpu recurrence provenance identity constant. | entity/value | none |
| 58 | constant | `LOCAL_SUN_CACHE_SHADER_CONTRIBUTION_ID` | `<module>` | descriptive-other: Value that identifies the completed local-Sun cumulative runtime shader contribution. | entity/value | none |
| 66 | constant | `LOCAL_SUN_CACHE_SYMBOLS_BY_PASS` | `<module>` | descriptive-other: Value that declares the construction capabilities supplied by the local point Sun. | entity/value | none |
| 80 | constant | `LOCAL_SUN_CACHE_REQUIREMENTS_BY_PASS` | `<module>` | descriptive-other: Value that declares the construction dependencies of the local point Sun. | entity/value | none |
| 105 | constant | `LOCAL_SUN_CACHE_IRRADIANCE_SYMBOL` | `<module>` | descriptive-other: Value that identifies position-dependent source irradiance used by reflected J2. | entity/value | none |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunCache.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunCache.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunCache.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | class | `LocalSunCache` | `<module>` | descriptive-other: Object that owns one completed local-Sun cumulative GPU cache artifact. | entity/value | none |
| 13 | field | `_artifact` | `LocalSunCache` | descriptive-other: Artifact value. | entity/value | none |
| 20 | field | `_resources` | `LocalSunCache` | descriptive-other: Resources value. | entity/value | none |
| 21 | field | `_disposed` | `LocalSunCache` | descriptive-other: Disposed value. | entity/value | none |
| 32 | constructor | `<anonymous@32:2>` | `LocalSunCache` | creates: Creates a local sun cache instance that takes ownership of one completely constructed... | creates | params 2/2 |
| 42 | accessor-get | `resources` | `LocalSunCache` | descriptive-other: Resources value. | entity/value | returns tagged |
| 51 | method | `getRuntimeBindings` | `LocalSunCache` | call-this-method: Call this method to return opaque bindings for the privately owned cumulative field. | active-callable | returns tagged; throws 1 |
| 65 | method | `createShaderContribution` | `LocalSunCache` | call-this-method: Call this method to contribute the local cache's bilinear-position and W27-direction ... | active-callable | returns tagged; throws 1 |
| 137 | method | `dispose` | `LocalSunCache` | call-this-method: Call this method to release the completed cumulative GPU field exactly once. | active-callable | none |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunCacheController.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunCacheController.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunCacheController.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 16 | class | `LocalSunCacheController` | `<module>` | descriptive-other: Controller for local-Sun GPU cache construction within one runtime attachment. | entity/value | none |
| 18 | field | `_source` | `LocalSunCacheController` | descriptive-other: Configured local-Sun cache contributor. @type {LocalSunCacheBuildSource} | entity/value | none |
| 20 | field | `_backend` | `LocalSunCacheController` | descriptive-other: Externally owned GPU backend. @type {CacheGpuBackend} | entity/value | none |
| 22 | field | `_scheduler` | `LocalSunCacheController` | descriptive-other: Optional cache-build scheduler. @type {CacheBuildScheduler \| undefined} | entity/value | none |
| 24 | field | `_executor` | `LocalSunCacheController` | descriptive-other: Renderer-neutral cache-plan executor. @type {CacheGpuExecutor} | entity/value | none |
| 26 | field | `_active` | `LocalSunCacheController` | descriptive-other: Atomically published local-Sun cache. @type {LocalSunCache \| null} | entity/value | none |
| 28 | field | `_activeReuseKey` | `LocalSunCacheController` | descriptive-other: Reuse identity of the active cache. @type {string \| null} | entity/value | none |
| 30 | field | `_tail` | `LocalSunCacheController` | descriptive-other: Serialized completion tail for controller generations. @type {Promise<void>} | entity/value | none |
| 32 | field | `_latestCancellation` | `LocalSunCacheController` | descriptive-other: Cancellation owner for the latest generation. @type {AbortController \| null} | entity/value | none |
| 34 | field | `_generation` | `LocalSunCacheController` | descriptive-other: Monotonic controller generation. @type {number} | entity/value | none |
| 36 | field | `_disposed` | `LocalSunCacheController` | descriptive-other: Controller disposal state. @type {boolean} | entity/value | none |
| 46 | method | `_createPureScatteringField` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to create a pure outgoing Jk field specification on... | called-by | params 2/2; returns tagged |
| 61 | method | `_createPureRadianceField` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to create a pure incoming Lk field specification on... | called-by | params 2/2; returns tagged |
| 76 | method | `_createCumulativeScatteringField` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to create a cumulative J-through-N field specificat... | called-by | params 2/2; returns tagged |
| 96 | method | `_createPassContext` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to create one pass context from source-owned graph ... | called-by | params 7/7; returns tagged |
| 117 | method | `_createLayoutModule` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to create the source-owned scalar output-layout mod... | called-by | params 1/1; returns tagged |
| 168 | method | `_createPass` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to create one pass from only the concrete owner mod... | called-by | params 1/1; returns tagged |
| 174 | callback | `definition.contributors.map::<callback@174:8>` | `modules` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 196 | callback | `definition.context.inputs.map::<callback@196:9>` | `_createPass` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 210 | method | `_addTransportPass` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to append one stored-field transport pass. | called-by | params 2/2 |
| 236 | method | `_addScatterAndAccumulatePasses` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to append one pure scatter and cumulative-add pair ... | called-by | params 2/2 |
| 296 | method | `_createReuseKey` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController reuse checks to derive the complete controller-loca... | called-by | params 2/2; returns tagged |
| 311 | method | `_createAbortError` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to create one ordinary cancellation error without r... | called-by | params 1/1; returns tagged |
| 324 | method | `_acceptMaximumScatteringOrder` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to accept one supported construction maximum. | called-by | params 1/1; returns tagged; throws 1 |
| 343 | method | `_acceptSpectralBasis` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to require the selected native basis across every p... | called-by | params 2/2; throws 1 |
| 364 | method | `_acceptBuildRequest` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to accept semantic values at the source-owned const... | called-by | params 2/2; returns tagged; throws 1 |
| 392 | method | `_linkCancellation` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to link caller cancellation to one controller-owned... | called-by | params 2/2; returns tagged |
| 394 | callback | `<anonymous@394:98>` | `_linkCancellation` | called-by: Called by link cancellation to handle one invocation of the declared operation. | called-by | none |
| 400 | callback | `abort` | `abort` | called-by: Called by abort to abort. | called-by | returns tagged |
| 407 | callback | `<anonymous@407:8>` | `_linkCancellation` | called-by: Called by link cancellation to handle one invocation of the declared operation. | called-by | returns tagged |
| 420 | method | `_requireCurrentGeneration` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to require one generation to remain the live contro... | called-by | params 2/2; throws 1 |
| 437 | method | `_executeGeneration` | `LocalSunCacheController` | called-by: Called by LocalSunCacheController to build, reuse, or atomically publish one accepted... | called-by | params 3/3; returns tagged; throws 1; async outcome mentioned |
| 481 | constructor | `<anonymous@481:2>` | `LocalSunCacheController` | creates: Creates one per-runtime local-Sun cache controller without taking ownership of its GP... | creates | params 1/1 |
| 495 | accessor-get | `active` | `LocalSunCacheController` | descriptive-other: Atomically published active local-Sun cache. | entity/value | returns tagged |
| 507 | method | `createBuildPlan` | `LocalSunCacheController` | call-this-method: Call this method to derive the exact selected N1, N2, or N4 source-owned build graph ... | active-callable | params 1/1; returns tagged |
| 717 | method | `createScatteringCache` | `LocalSunCacheController` | call-this-method: Call this method to construct or reuse one complete cumulative scattering cache. Newe... | active-callable | params 1/1; returns tagged |
| 741 | callback | `predecessor.then::<callback@741:8>` | `operation` | called-by: Called by the promise continuation to handle one callback invocation. | called-by | returns tagged |
| 744 | callback | `operation.then::<callback@744:81>` | `createScatteringCache` | called-by: Called by the promise continuation to handle one callback invocation. | called-by | none |
| 745 | callback | `operation.then::<callback@745:81>` | `createScatteringCache` | called-by: Called by the promise continuation to handle one callback invocation. | called-by | none |
| 749 | callback | `operation.finally::<callback@749:82>` | `createScatteringCache` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | none |
| 765 | method | `dispose` | `LocalSunCacheController` | call-this-method: Call this method to cancel staging and release the active cache without taking owners... | active-callable | none |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunCacheProvider.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunCacheProvider.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunCacheProvider.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 25 | class | `LocalSunCacheProvider` | `<module>` | descriptive-other: Cache construction and attachment provider for one finite local Sun. | entity/value | none |
| 30 | field | `_source` | `LocalSunCacheProvider` | descriptive-other: Physical local-Sun facade retained for dynamic dispatch. | entity/value | none |
| 35 | field | `_configuration` | `LocalSunCacheProvider` | descriptive-other: Normalized physical source configuration retained by reference. | entity/value | none |
| 40 | field | `_constructionShellFactCache` | `LocalSunCacheProvider` | descriptive-other: Eager source-owned shell facts shared by construction attachments. | entity/value | none |
| 45 | field | `_constructionLightSource` | `LocalSunCacheProvider` | descriptive-other: Eager construction-only shell-held light source. | entity/value | none |
| 54 | method | `_boundaryFieldIdentitySuffix` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to distinguish explicit boundaries while preserving o... | called-by | params 1/1; returns tagged |
| 74 | method | `_optionsFor` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to express the accepted CPU graph options without res... | called-by | params 2/2; returns tagged |
| 90 | method | `_buildPrimaryRadiance` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to build the finite local Sun's continuous direct-pri... | called-by | params 1/1; returns tagged; throws 1 |
| 181 | method | `_buildPrimaryScatteringDensity` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to build the local point Sun's pure primary scatterin... | called-by | params 1/1; returns tagged; throws 1 |
| 280 | method | `_buildTransportedRadiance` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to build one pure L2 or L3 field by transporting a st... | called-by | params 1/1; returns tagged |
| 306 | callback | `resolvePositionStencil` | `_buildTransportedRadiance` | called-by: Called by build transported radiance to resolve position stencil. | called-by | params 1/1; returns tagged |
| 316 | callback | `resolveDirectionStencil` | `_buildTransportedRadiance` | called-by: Called by build transported radiance to resolve direction stencil. | called-by | params 1/1; returns tagged |
| 321 | callback | `resolveBuildCoordinate` | `_buildTransportedRadiance` | called-by: Called by build transported radiance to resolve build coordinate. | called-by | params 1/1; returns tagged |
| 343 | callback | `resolvePhysicalRadianceDirection` | `_buildTransportedRadiance` | called-by: Called by build transported radiance to resolve physical radiance direction. | called-by | params 1/1; returns tagged |
| 363 | method | `_readGroundIllumination` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to read one exact incoming-direction spectrum across ... | called-by | params 4/4; returns tagged |
| 388 | method | `_groundPathTransmittance` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to integrate one ground-owned atmosphere path. It ret... | called-by | params 4/4; returns tagged |
| 413 | method | `_groundToPositionTransmittance` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to resolve exact ground-contact or transported return... | called-by | params 4/4; returns tagged |
| 436 | method | `_dot` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to return one three-vector dot product. | called-by | params 2/2; returns tagged |
| 450 | method | `_directGroundReflectedRadiance` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to evaluate direct local-source reflection at one gro... | called-by | params 4/4; returns tagged |
| 507 | method | `_indirectGroundReflectedRadiance` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to integrate pure L(k-2) illumination into one ground... | called-by | params 5/5; returns tagged |
| 519 | callback | `request.domainSelection.incomingUnitVectors.map::<callback@519:8>` | `physicalIncomingDirections` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 566 | method | `_createGroundIncomingRadianceContributor` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to create the inherited direct-J2 or pure L(k-2) grou... | called-by | params 1/1; returns tagged |
| 574 | callback | `<anonymous@574:8>` | `_createGroundIncomingRadianceContributor` | called-by: Called by create ground incoming radiance contributor to handle one invocation of the... | called-by | params 1/1 |
| 627 | method | `_createLaterOrderScatteringKernel` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to create the local-Sun adapter for the shared pure L... | called-by | params 1/1; returns tagged |
| 649 | callback | `resolvePhysicalPosition` | `_createLaterOrderScatteringKernel` | called-by: Called by create later order scattering kernel to resolve physical position. | called-by | params 1/1; returns tagged |
| 654 | callback | `resolvePhysicalIncomingDirection` | `_createLaterOrderScatteringKernel` | called-by: Called by create later order scattering kernel to resolve physical incoming direction. | called-by | params 1/1; returns tagged |
| 663 | callback | `resolvePhysicalOutgoingDirection` | `_createLaterOrderScatteringKernel` | called-by: Called by create later order scattering kernel to resolve physical outgoing direction. | called-by | params 1/1; returns tagged |
| 680 | method | `_acceptCpuProfile` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to accept the native profile and its reflective-bound... | called-by | params 1/1; returns tagged; throws 1 |
| 708 | method | `_acceptCpuSourceTransmittanceIntervalCount` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to accept the source-owned or explicitly diagnostic l... | called-by | params 1/1; returns tagged; throws 1 |
| 727 | method | `_acceptCpuTransportIntervalCount` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to accept the caller override or selected profile's c... | called-by | params 2/2; returns tagged; throws 1 |
| 743 | method | `_createCpuRecurrenceOperations` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to bind the unchanged pure-order operations to this l... | called-by | params 1/1; returns tagged |
| 749 | callback | `createScatteringKernel` | `_createCpuRecurrenceOperations` | called-by: Called by create cpu recurrence operations to create scattering kernel. | called-by | params 1/1; returns tagged |
| 765 | callback | `buildTransportedRadiance` | `_createCpuRecurrenceOperations` | called-by: Called by create cpu recurrence operations to build transported radiance. | called-by | params 1/1; returns tagged |
| 788 | method | `_buildCpuCache` | `LocalSunCacheProvider` | called-by: Called by LocalSunCacheProvider to construct the local-Sun binary64 recurrence for re... | called-by | params 1/1; returns tagged |
| 876 | constructor | `<anonymous@876:2>` | `LocalSunCacheProvider` | creates: Creates the cache provider and its eager construction-only source state. | creates | params 1/1 |
| 895 | method | `createCacheController` | `LocalSunCacheProvider` | call-this-method: Call this method to create one local-Sun cache controller for a renderer attachment. | active-callable | params 1/1; returns tagged |
| 915 | method | `buildCpuScatteringCache` | `LocalSunCacheProvider` | call-this-method: Call this method to build one complete nonresident local-Sun binary64 cache result. C... | active-callable | params 1/1; returns tagged; throws 1 |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunCacheSource.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunCacheSource.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunCacheSource.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 13 | class | `LocalSunCacheSource` | `<module>` | descriptive-other: Object that supplies local point-Sun primary and dynamic source facts to GPU passes. | entity/value | none |
| 20 | field | `_source` | `LocalSunCacheSource` | descriptive-other: Source value. | entity/value | none |
| 27 | field | `_shellFactCache` | `LocalSunCacheSource` | descriptive-other: Shell fact cache value. | entity/value | none |
| 34 | field | `_shellBoundaryData` | `LocalSunCacheSource` | descriptive-other: Shell boundary data value. | entity/value | none |
| 43 | method | `_createBindings` | `LocalSunCacheSource` | called-by: Called by local sun cache source to create pass-scoped source bindings. | called-by | params 2/2; returns tagged |
| 171 | method | `_createBlocks` | `LocalSunCacheSource` | called-by: Called by local sun cache source to create source shader functions for one pass. | called-by | params 2/2; returns tagged |
| 443 | constructor | `<anonymous@443:2>` | `LocalSunCacheSource` | creates: Creates a local sun cache source instance that binds the configured source and its pr... | creates | params 1/1 |
| 461 | accessor-get | `configuration` | `LocalSunCacheSource` | descriptive-other: Value that returns the configured physical source facts. | entity/value | returns tagged |
| 472 | method | `createResourceReport` | `LocalSunCacheSource` | call-this-method: Call this method to report actual retained facts, upload data, logical transport, and... | active-callable | params 2/2; returns tagged |
| 490 | method | `createCacheModule` | `LocalSunCacheSource` | call-this-method: Call this method to supply the dynamic point-source direction, irradiance, and primar... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunConstructionDomainSelection.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunConstructionDomainSelection.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunConstructionDomainSelection.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 17 | class | `LocalSunConstructionDomainSelection` | `<module>` | descriptive-other: Coherent executable z-by-rho, paired-Fibonacci-34, and cubed-sphere selection for loc... | entity/value | none |
| 19 | field | `_outgoingDirectionDomainOwner` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable outgoing-direction owner. @type {CubedSphereDirectionDomain} | entity/value | none |
| 22 | field | `kind` | `LocalSunConstructionDomainSelection` | descriptive-other: Construction-domain contract kind. @readonly @type {"local-sun-construction-domain-se... | entity/value | none |
| 24 | field | `id` | `LocalSunConstructionDomainSelection` | descriptive-other: Unique identifier for the construction-domain selection. @readonly @type {string} | entity/value | none |
| 26 | field | `positionDomain` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable position domain. @readonly @type {LocalSunPositionDomainOwner} | entity/value | none |
| 28 | field | `positionNodes` | `LocalSunConstructionDomainSelection` | descriptive-other: Z-major, rho-fast flattened position nodes. @readonly @type {readonly PositionDomainN... | entity/value | none |
| 30 | field | `zNodes` | `LocalSunConstructionDomainSelection` | descriptive-other: Ordered altitude nodes. @readonly @type {readonly Distance[]} | entity/value | none |
| 32 | field | `rhoNodes` | `LocalSunConstructionDomainSelection` | descriptive-other: Ordered radial nodes. @readonly @type {readonly Distance[]} | entity/value | none |
| 34 | field | `zCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of altitude nodes. @readonly @type {number} | entity/value | none |
| 36 | field | `rhoCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of radial nodes. @readonly @type {number} | entity/value | none |
| 38 | field | `positionCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of flattened position nodes. @readonly @type {number} | entity/value | none |
| 40 | field | `spectralBasis` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable spectral basis. @readonly @type {SpectralBasis} | entity/value | none |
| 42 | field | `spectralChannelCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of executable spectral channels. @readonly @type {number} | entity/value | none |
| 44 | field | `incomingDirectionDomain` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable incoming-direction domain. @readonly @type {PairedFibonacci34DirectionDomain} | entity/value | none |
| 46 | field | `incomingUnitVectors` | `LocalSunConstructionDomainSelection` | descriptive-other: Paired-Fibonacci-34 incoming unit vectors. @readonly @type {readonly UnitVector3[]} | entity/value | none |
| 48 | field | `incomingIntegrationWeights` | `LocalSunConstructionDomainSelection` | descriptive-other: Paired-Fibonacci-34 solid-angle weights. @readonly @type {SolidAngleWeights} | entity/value | none |
| 50 | field | `incomingDirectionCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of executable incoming directions. @readonly @type {number} | entity/value | none |
| 52 | field | `outgoingDirectionDomain` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable outgoing-direction domain. @readonly @type {CubedSphereDirectionDomain} | entity/value | none |
| 54 | field | `outgoingUnitVectors` | `LocalSunConstructionDomainSelection` | descriptive-other: Cubed-sphere outgoing unit vectors. @readonly @type {readonly UnitVector3[]} | entity/value | none |
| 56 | field | `outgoingDirectionCount` | `LocalSunConstructionDomainSelection` | descriptive-other: Number of executable outgoing directions. @readonly @type {number} | entity/value | none |
| 58 | field | `outgoingPositiveFaceCenterIndices` | `LocalSunConstructionDomainSelection` | descriptive-other: Positive-axis cubed-sphere face-center addresses. @readonly @type {CubedSpherePositiv... | entity/value | none |
| 60 | field | `radiancePacking` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable incoming-radiance packing. @readonly @type {LocalSunFieldPacking} | entity/value | none |
| 62 | field | `scatteringDensityPacking` | `LocalSunConstructionDomainSelection` | descriptive-other: Executable outgoing scattering-density packing. @readonly @type {LocalSunFieldPacking} | entity/value | none |
| 69 | constructor | `<anonymous@69:2>` | `LocalSunConstructionDomainSelection` | creates: Creates one source-owned construction-domain selection. | creates | params 1/1 |
| 111 | method | `resolveOutgoingDirectionStencil` | `LocalSunConstructionDomainSelection` | call-this-method: Call this method to resolve one source-local outgoing direction through the selected ... | active-callable | params 1/1; returns tagged |
| 123 | method | `fromGeometry` | `LocalSunConstructionDomainSelection` | call-this-method: Call this method to derive the selected production domain from active flat geometry a... | active-callable | params 2/2; returns tagged |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunConstructionLightSource.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunConstructionLightSource.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunConstructionLightSource.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | class | `LocalSunConstructionLightSource` | `<module>` | descriptive-other: Adapt one continuous local Sun to the shell-held primary-J1 construction contract wit... | entity/value | none |
| 14 | field | `_source` | `LocalSunConstructionLightSource` | descriptive-other: Source value. | entity/value | none |
| 21 | field | `_shellFactCache` | `LocalSunConstructionLightSource` | descriptive-other: Shell fact cache value. | entity/value | none |
| 30 | constructor | `<anonymous@30:2>` | `LocalSunConstructionLightSource` | creates: Creates one construction-only light-source collaborator. | creates | params 1/1 |
| 40 | accessor-get | `id` | `LocalSunConstructionLightSource` | descriptive-other: Value that identifies the configured physical source. | entity/value | returns tagged |
| 50 | method | `resolveSourcePathLimit` | `LocalSunConstructionLightSource` | call-this-method: Call this method to resolve the physical source's finite path limit. | active-callable | params 1/1; returns tagged |
| 60 | method | `createCacheController` | `LocalSunConstructionLightSource` | call-this-method: Call this method to preserve the physical source's fail-closed controller boundary. | active-callable | params 1/1; returns tagged |
| 70 | method | `sampleDirectLighting` | `LocalSunConstructionLightSource` | call-this-method: Call this method to sample the construction-only shell-held primary-J1 amplitude. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunCpuCache.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunCpuCache.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunCpuCache.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 13 | class | `LocalSunCpuCache` | `<module>` | descriptive-other: Object that owns the resident cumulative binary64 field for one completed local-Sun b... | entity/value | none |
| 20 | field | `_cumulativeReader` | `LocalSunCpuCache` | descriptive-other: Cumulative reader value. | entity/value | none |
| 27 | field | `_sampleProvenanceIdentity` | `LocalSunCpuCache` | descriptive-other: Provenance identity of the stored samples. | entity/value | none |
| 35 | constructor | `<anonymous@35:2>` | `LocalSunCpuCache` | creates: Creates a local sun cpu cache instance that consumes one completed local-Sun N1, N2, ... | creates | params 1/1 |
| 47 | accessor-get | `sampleProvenanceIdentity` | `LocalSunCpuCache` | descriptive-other: Provenance identity of the stored samples. | entity/value | returns tagged |
| 57 | method | `_requireCumulativeReader` | `LocalSunCpuCache` | called-by: Called by local sun cpu cache to require a live resident reader. | called-by | returns tagged; throws 1 |
| 71 | method | `sampleResolved` | `LocalSunCpuCache` | call-this-method: Call this method to sample all channels from geometry-resolved z-by-rho and W stencils. | active-callable | params 1/1; returns tagged |
| 109 | method | `dispose` | `LocalSunCpuCache` | call-this-method: Call this method to release the resident reader. Repeated disposal is safe. | active-callable | none |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunCpuFields.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunCpuFields.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunCpuFields.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | class | `LocalSunCpuFields` | `<module>` | descriptive-other: Binary64 field-family allocator for a local-Sun cache. | entity/value | none |
| 13 | method | `_createField` | `LocalSunCpuFields` | called-by: Called by LocalSunCpuFields to allocate one field from source-owned executable facts. | called-by | params 1/1; returns tagged |
| 29 | callback | `Array.from::<callback@29:15>` | `order` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 49 | method | `createPureRadiance` | `LocalSunCpuFields` | call-this-method: Call this method to create one mutable pure incoming-radiance field with source-owned... | active-callable | params 1/1; returns tagged |
| 66 | method | `createPureScatteringDensity` | `LocalSunCpuFields` | call-this-method: Call this method to create one mutable pure outgoing scattering-density field with so... | active-callable | params 1/1; returns tagged |
| 83 | method | `createCumulativeScatteringDensity` | `LocalSunCpuFields` | call-this-method: Call this method to create one mutable cumulative outgoing scattering-density field w... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunFieldPacking.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunFieldPacking.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunFieldPacking.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `LocalSunFieldPacking` | `<module>` | descriptive-other: Object that owns executable direction-fastest storage for one local-Sun field. | entity/value | none |
| 9 | field | `kind` | `LocalSunFieldPacking` | descriptive-other: Kind value. | entity/value | none |
| 16 | field | `id` | `LocalSunFieldPacking` | descriptive-other: Id value. | entity/value | none |
| 23 | field | `directionCount` | `LocalSunFieldPacking` | descriptive-other: Direction count value. | entity/value | none |
| 30 | field | `positionCount` | `LocalSunFieldPacking` | descriptive-other: Position count value. | entity/value | none |
| 37 | field | `wavelengthCount` | `LocalSunFieldPacking` | descriptive-other: Wavelength count value. | entity/value | none |
| 44 | field | `scalarCount` | `LocalSunFieldPacking` | descriptive-other: Scalar count value. | entity/value | none |
| 51 | constructor | `<anonymous@51:2>` | `LocalSunFieldPacking` | creates: Creates local-Sun storage from accepted logical dimensions. | creates | params 1/1 |
| 69 | method | `_assertIndex` | `LocalSunFieldPacking` | called-by: Called by local sun field packing to require a zero-based safe integer within a bound. | called-by | params 3/3; throws 1 |
| 81 | method | `offset` | `LocalSunFieldPacking` | call-this-method: Call this method to return the direction-fastest scalar offset. | active-callable | params 1/1; returns tagged |
| 98 | method | `coordinatesAt` | `LocalSunFieldPacking` | call-this-method: Call this method to recover logical coordinates from one scalar offset. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/local-sun/cache/LocalSunShellFactCache.js`

Source: [src/algorithm32/light-sources/local-sun/cache/LocalSunShellFactCache.js](../../../../../../src/algorithm32/light-sources/local-sun/cache/LocalSunShellFactCache.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | class | `LocalSunShellFactCache` | `<module>` | descriptive-other: Fixed N=2048 local-Sun construction-fact owner with copy-returning accessors. | entity/value | none |
| 18 | method | `_copySourceFacts` | `LocalSunShellFactCache` | called-by: Called by local sun shell fact cache to copy the physical source facts that own the s... | called-by | params 1/1; returns tagged |
| 44 | method | `_deriveWholeFlatWorldSourceDomain` | `LocalSunShellFactCache` | called-by: Called by local sun shell fact cache to derive the accepted whole-flat-world source-d... | called-by | params 1/1; returns tagged; throws 1 |
| 96 | method | `_createEqualInverseSquareBoundaries` | `LocalSunShellFactCache` | called-by: Called by local sun shell fact cache to create all exact binary64 boundary radii. | called-by | params 1/1; returns tagged |
| 120 | method | `_continuousIncidentScale` | `LocalSunShellFactCache` | called-by: Called by local sun shell fact cache to evaluate the normalized source's continuous i... | called-by | params 2/2; returns tagged |
| 135 | method | `_createHeldIncidentScales` | `LocalSunShellFactCache` | called-by: Called by local sun shell fact cache to create the arithmetic-mean incident amplitude... | called-by | params 2/2; returns tagged |
| 154 | field | `id` | `LocalSunShellFactCache` | descriptive-other: Executable shell-fact owner identity. | entity/value | none |
| 161 | field | `_boundaries` | `LocalSunShellFactCache` | descriptive-other: Ordered shell-boundary radii in meters. | entity/value | none |
| 167 | field | `_heldIncidentScales` | `LocalSunShellFactCache` | descriptive-other: Held dimensionless incident scale for each shell. | entity/value | none |
| 173 | field | `_minimumDistance` | `LocalSunShellFactCache` | descriptive-other: Minimum represented source distance. | entity/value | none |
| 179 | field | `_maximumDistance` | `LocalSunShellFactCache` | descriptive-other: Maximum represented source distance. | entity/value | none |
| 187 | constructor | `<anonymous@187:2>` | `LocalSunShellFactCache` | creates: Creates a local sun shell fact cache instance that calls this constructor to create o... | creates | params 1/1 |
| 211 | accessor-get | `shellCount` | `LocalSunShellFactCache` | descriptive-other: Executable shell count. | entity/value | returns tagged |
| 220 | accessor-get | `boundaryCount` | `LocalSunShellFactCache` | descriptive-other: Executable boundary count. | entity/value | returns tagged |
| 229 | accessor-get | `minimumDistance` | `LocalSunShellFactCache` | descriptive-other: Executable lower clamp. | entity/value | returns tagged |
| 238 | accessor-get | `maximumDistance` | `LocalSunShellFactCache` | descriptive-other: Executable upper clamp. | entity/value | returns tagged |
| 247 | accessor-get | `boundaries` | `LocalSunShellFactCache` | descriptive-other: Independent copy of all ordered meter boundaries. | entity/value | returns tagged |
| 256 | accessor-get | `heldIncidentScales` | `LocalSunShellFactCache` | descriptive-other: Independent copy of all held dimensionless incident scales. | entity/value | returns tagged |
| 265 | accessor-get | `resourceUsage` | `LocalSunShellFactCache` | descriptive-other: Retained binary64 payload without mutable storage exposure. | entity/value | returns tagged |
| 291 | method | `resolveShell` | `LocalSunShellFactCache` | call-this-method: Call this method to resolve higher-index boundary ownership and the precomputed held ... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/local-sun/consts.js`

Source: [src/algorithm32/light-sources/local-sun/consts.js](../../../../../../src/algorithm32/light-sources/local-sun/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE` | `<module>` | descriptive-other: Value that selects the default endpoint ambient-light intensity range. | entity/value | none |
| 8 | constant | `LOCAL_SUN_TRANSPORT_INTERVAL_COUNT` | `<module>` | descriptive-other: Value that selects the production local-cache transport interval count. | entity/value | none |
| 11 | constant | `LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT` | `<module>` | descriptive-other: Value that selects production local-source optical-depth integration intervals. | entity/value | none |
| 14 | constant | `LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID` | `<module>` | descriptive-other: Value that identifies the local point Sun at the shared final-view assembly boundary. | entity/value | none |

## `src/algorithm32/light-sources/local-sun/local-sun-geometry-pairing.js`

Source: [src/algorithm32/light-sources/local-sun/local-sun-geometry-pairing.js](../../../../../../src/algorithm32/light-sources/local-sun/local-sun-geometry-pairing.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 13 | function | `assertLocalSunGeometryPairing` | `<module>` | call-this-method: Call this function to require flat geometry's derived source-relative frame to use th... | active-callable | params 2/2; throws 1 |
| 23 | callback | `sourcePositionMeters.some::<callback@23:8>` | `assertLocalSunGeometryPairing` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 2/2; returns tagged |

## `src/algorithm32/light-sources/local-sun/LocalSunLightSource.js`

Source: [src/algorithm32/light-sources/local-sun/LocalSunLightSource.js](../../../../../../src/algorithm32/light-sources/local-sun/LocalSunLightSource.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 13 | class | `LocalSunLightSource` | `<module>` | descriptive-other: Finite local-Sun physical source and public integration facade. | entity/value | none |
| 18 | field | `_configuration` | `LocalSunLightSource` | descriptive-other: Normalized physical source configuration retained by reference. | entity/value | none |
| 23 | field | `_cacheProvider` | `LocalSunLightSource` | descriptive-other: Source-owned cache construction and attachment provider. | entity/value | none |
| 28 | field | `_shaderContributor` | `LocalSunLightSource` | descriptive-other: Source-owned final-view shader contribution provider. | entity/value | none |
| 33 | field | `_sceneLightingAdapter` | `LocalSunLightSource` | descriptive-other: Source-owned endpoint scene-lighting adapter. | entity/value | none |
| 43 | constructor | `<anonymous@43:2>` | `LocalSunLightSource` | creates: Creates a finite local Sun with normalized physical and integration facts. | creates | params 1/1; throws 2 |
| 112 | accessor-get | `configuration` | `LocalSunLightSource` | descriptive-other: Immutable normalized source configuration snapshot. | entity/value | returns tagged |
| 121 | accessor-get | `id` | `LocalSunLightSource` | descriptive-other: Configured source model identity used for compatibility. | entity/value | returns tagged |
| 130 | method | `createShaderContribution` | `LocalSunLightSource` | call-this-method: Call this method to declare the local point Sun during final-view assembly. | active-callable | returns tagged |
| 140 | method | `createCacheController` | `LocalSunLightSource` | call-this-method: Call this method to create one local-Sun cache controller for a renderer attachment. | active-callable | params 1/1; returns tagged |
| 150 | method | `buildCpuScatteringCache` | `LocalSunLightSource` | call-this-method: Call this method to build one complete nonresident local-Sun binary64 cache result. | active-callable | params 1/1; returns tagged |
| 161 | method | `sampleDirectLighting` | `LocalSunLightSource` | call-this-method: Call this method to sample direct lighting from the finite source. Conditional result... | active-callable | params 1/1; returns tagged; throws 1 |
| 222 | method | `resolveSceneLightScales` | `LocalSunLightSource` | call-this-method: Call this method to resolve neutral local scene-light scales for the finite source. | active-callable | params 1/1; returns tagged |
| 232 | method | `addSceneLighting` | `LocalSunLightSource` | call-this-method: Call this method to add or create source-owned endpoint scene lighting. | active-callable | params 1/1; returns tagged |
| 243 | method | `configureThreeShadowObject` | `LocalSunLightSource` | call-this-method: Call this method to configure an app-authored Three object tree for source shadows. | active-callable | params 2/2; returns tagged |
| 253 | method | `resolveSourcePathLimit` | `LocalSunLightSource` | call-this-method: Call this method to resolve the finite source path limit for one sample. Conditional ... | active-callable | params 1/1; returns tagged |

## `src/algorithm32/light-sources/local-sun/LocalSunShaderContributor.js`

Source: [src/algorithm32/light-sources/local-sun/LocalSunShaderContributor.js](../../../../../../src/algorithm32/light-sources/local-sun/LocalSunShaderContributor.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | class | `LocalSunShaderContributor` | `<module>` | descriptive-other: Final-view shader-contribution provider for one finite local Sun. | entity/value | none |
| 12 | field | `_configuration` | `LocalSunShaderContributor` | descriptive-other: Normalized physical source configuration retained by reference. | entity/value | none |
| 19 | constructor | `<anonymous@19:2>` | `LocalSunShaderContributor` | creates: Creates a shader-contribution provider for one normalized local source. | creates | params 1/1 |
| 29 | method | `createShaderContribution` | `LocalSunShaderContributor` | call-this-method: Call this method to declare the configured point Sun during final-view assembly. The ... | active-callable | returns tagged |

## `src/algorithm32/light-sources/local-sun/three/LocalSunSceneLightingAdapter.js`

Source: [src/algorithm32/light-sources/local-sun/three/LocalSunSceneLightingAdapter.js](../../../../../../src/algorithm32/light-sources/local-sun/three/LocalSunSceneLightingAdapter.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 13 | class | `LocalSunSceneLightingAdapter` | `<module>` | descriptive-other: Endpoint scene-lighting and Three adaptation for a finite local Sun. | entity/value | none |
| 18 | field | `_source` | `LocalSunSceneLightingAdapter` | descriptive-other: Physical local-Sun facade retained for dynamic lighting dispatch. | entity/value | none |
| 23 | field | `_configuration` | `LocalSunSceneLightingAdapter` | descriptive-other: Normalized physical source configuration retained by reference. | entity/value | none |
| 32 | method | `_endpointSceneLightScalePolicyOrDefault` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to normalize the endpoint scene-light scale po... | called-by | params 1/1; returns tagged; throws 1 |
| 51 | method | `_distanceAttenuationPolicyForDirectionalShadow` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to describe the directional shadow attenuation... | called-by | params 1/1; returns tagged |
| 63 | method | `_distanceAttenuationPolicyForPointLight` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to describe the point-light attenuation policy... | called-by | params 1/1; returns tagged |
| 75 | method | `_createSourcePointLight` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to create a local-source point light. | called-by | params 1/1; returns tagged |
| 108 | method | `_oppositeDirectionalFillDirection` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to resolve the opposite fill direction. | called-by | params 1/1; returns tagged |
| 125 | method | `_directionBetweenScenePoints` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to resolve the direction between two scene poi... | called-by | params 2/2; returns tagged |
| 137 | method | `_createShadowDirectionalLight` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to create a directional shadow light from the ... | called-by | params 1/1; returns tagged |
| 209 | method | `_createOppositeDirectionalFillLight` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to create an opposite-direction endpoint fill ... | called-by | params 1/1; returns tagged |
| 253 | method | `_createSourceDirectionFalloffFillLight` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to create a source-direction falloff endpoint ... | called-by | params 1/1; returns tagged |
| 305 | method | `_normalizeShadowObjectRequest` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to normalize one shadow object request. | called-by | params 2/2; returns tagged; throws 1 |
| 442 | method | `_normalizeShadowRequest` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to normalize the canonical shadow request. It ... | called-by | params 1/1; returns tagged; throws 1 |
| 465 | callback | `shadow.objects.map::<callback@465:8>` | `objects` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 490 | method | `_endpointIndirectFillPolicyOrDefault` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to normalize the endpoint indirect-fill policy... | called-by | params 1/1; returns tagged; throws 1 |
| 513 | method | `_endpointIndirectFillRequestOrNull` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to normalize an optional endpoint indirect-fil... | called-by | params 1/1; returns tagged; throws 1 |
| 554 | method | `_endpointIndirectFillRole` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to resolve the endpoint indirect-fill metadata... | called-by | params 1/1; returns tagged |
| 571 | method | `_endpointIndirectFillDirection` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to resolve endpoint indirect-fill direction me... | called-by | params 2/2; returns tagged |
| 589 | constructor | `<anonymous@589:2>` | `LocalSunSceneLightingAdapter` | creates: Creates the endpoint scene-lighting adapter for one configured local source. | creates | params 1/1 |
| 601 | method | `resolveSceneLightScales` | `LocalSunSceneLightingAdapter` | call-this-method: Call this method to resolve neutral local scene-light scales for a finite source. | active-callable | params 1/1; returns tagged |
| 625 | method | `_resolveEndpointLightingFacts` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to resolve normalized source-owned endpoint li... | called-by | params 1/1; returns tagged |
| 676 | method | `_createThreeAmbientLight` | `LocalSunSceneLightingAdapter` | called-by: Called by LocalSunSceneLightingAdapter to create the source-owned ambient fill light. | called-by | params 1/1; returns tagged; throws 2 |
| 714 | method | `addSceneLighting` | `LocalSunSceneLightingAdapter` | call-this-method: Call this method to add or create source-owned endpoint scene lighting. | active-callable | params 1/1; returns tagged; throws 1 |
| 782 | callback | `shadowObjects.map::<callback@782:11>` | `sourceDrivenLights` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 903 | method | `configureThreeShadowObject` | `LocalSunSceneLightingAdapter` | call-this-method: Call this method to configure an app-authored Three object tree for source shadows. | active-callable | params 2/2; returns tagged |

## `src/algorithm32/light-sources/shared/cache/consts.js`

Source: [src/algorithm32/light-sources/shared/cache/consts.js](../../../../../../src/algorithm32/light-sources/shared/cache/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `DEFAULT_CACHE_TRANSPORT_INTERVAL_COUNT` | `<module>` | descriptive-other: Value that stores the executable production path-integration interval count. | entity/value | none |
| 5 | constant | `SUPPORTED_CACHE_SCATTERING_ORDERS` | `<module>` | descriptive-other: Value that identifies supported first-release cumulative cache maxima. | entity/value | none |
| 12 | constant | `DEFAULT_CACHE_CONSTRUCTION_OPTIONS` | `<module>` | descriptive-other: Direct cache-construction options for the default N4 graph. | entity/value | none |

## `src/algorithm32/light-sources/shared/cache/CpuDirectionalSpectralField.js`

Source: [src/algorithm32/light-sources/shared/cache/CpuDirectionalSpectralField.js](../../../../../../src/algorithm32/light-sources/shared/cache/CpuDirectionalSpectralField.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | class | `CpuDirectionalSpectralField` | `<module>` | descriptive-other: Object that owns one mutable-then-sealed binary64 directional spectral field. The res... | entity/value | none |
| 9 | field | `id` | `CpuDirectionalSpectralField` | descriptive-other: Id value. | entity/value | none |
| 16 | field | `provenanceIdentity` | `CpuDirectionalSpectralField` | descriptive-other: Provenance identity value. | entity/value | none |
| 23 | field | `order` | `CpuDirectionalSpectralField` | descriptive-other: Order value. | entity/value | none |
| 30 | field | `_offset` | `CpuDirectionalSpectralField` | descriptive-other: Offset value. | entity/value | none |
| 37 | field | `_values` | `CpuDirectionalSpectralField` | descriptive-other: Values value. | entity/value | none |
| 44 | field | `_isSealed` | `CpuDirectionalSpectralField` | descriptive-other: Is sealed value. | entity/value | none |
| 53 | constructor | `<anonymous@53:2>` | `CpuDirectionalSpectralField` | creates: Creates binary64 CPU storage from direct field facts and executable packing. | creates | params 1/1 |
| 75 | accessor-get | `scalarCount` | `CpuDirectionalSpectralField` | descriptive-other: Scalar count value. | entity/value | returns tagged |
| 84 | accessor-get | `isSealed` | `CpuDirectionalSpectralField` | descriptive-other: Is sealed value. | entity/value | returns tagged |
| 97 | method | `_finiteScalar` | `CpuDirectionalSpectralField` | called-by: Called by CpuDirectionalSpectralField writers to validate one finite scalar before fi... | called-by | params 2/2; returns tagged; throws 1 |
| 111 | method | `_assertMutable` | `CpuDirectionalSpectralField` | called-by: Called by cpu directional spectral field to assert mutable. | called-by | throws 1 |
| 126 | method | `_validatedOffset` | `CpuDirectionalSpectralField` | called-by: Called by cpu directional spectral field to validate one scalar storage offset. | called-by | params 2/2; returns tagged; throws 2 |
| 144 | method | `_resolveOffset` | `CpuDirectionalSpectralField` | called-by: Called by cpu directional spectral field to resolve and validate one logical field co... | called-by | params 1/1; returns tagged |
| 153 | method | `createWriter` | `CpuDirectionalSpectralField` | call-this-method: Call this method to create a mutation capability while the field remains mutable. A c... | active-callable | returns tagged |
| 163 | callback | `writeScalar` | `writeScalar` | called-by: Called by write scalar to write one scalar addressed by logical field coordinates. | called-by | params 2/2 |
| 177 | callback | `writeScalarAtOffset` | `writeScalarAtOffset` | called-by: Called by write scalar at offset to write one scalar addressed by its dense storage o... | called-by | params 2/2 |
| 189 | callback | `fill` | `fill` | called-by: Called by fill to fill every resident scalar with one value. | called-by | params 1/1 |
| 210 | method | `seal` | `CpuDirectionalSpectralField` | call-this-method: Call this method to end mutation permanently and make reader creation available. | active-callable | returns tagged |
| 221 | method | `createReader` | `CpuDirectionalSpectralField` | call-this-method: Call this method to create a read capability after the field has been sealed. | active-callable | returns tagged; throws 1 |
| 232 | callback | `readScalar` | `readScalar` | called-by: Called by read scalar to read one scalar addressed by logical field coordinates. | called-by | params 1/1; returns tagged |
| 240 | callback | `readScalarAtOffset` | `readScalarAtOffset` | called-by: Called by read scalar at offset to read one scalar addressed by its dense storage off... | called-by | params 1/1; returns tagged |

## `src/algorithm32/light-sources/shared/cache/index.js`

Source: [src/algorithm32/light-sources/shared/cache/index.js](../../../../../../src/algorithm32/light-sources/shared/cache/index.js)

No independently documentable declaration or callable target; this is a re-export-only barrel.

## `src/algorithm32/light-sources/shared/LightSourceRequestValues.js`

Source: [src/algorithm32/light-sources/shared/LightSourceRequestValues.js](../../../../../../src/algorithm32/light-sources/shared/LightSourceRequestValues.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 12 | function | `acceptSourceIrradiance` | `<module>` | called-by: Called by this module to accept source spectral irradiance at a light-source boundary. | called-by | params 2/2; returns tagged; throws 1 |
| 24 | callback | `packet.values.some::<callback@24:8>` | `acceptSourceIrradiance` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 1/1; returns tagged |
| 42 | function | `normalizeDirection` | `<module>` | called-by: Called by this module to normalize a non-zero direction at a light-source request bou... | called-by | params 2/2; returns tagged; throws 2 |
| 58 | constant | `LightSourceRequestValues` | `<module>` | descriptive-other: Physical light-source request acceptance and normalization methods. | entity/value | none |

## `src/algorithm32/light-sources/shared/three/SceneLightingMath.js`

Source: [src/algorithm32/light-sources/shared/three/SceneLightingMath.js](../../../../../../src/algorithm32/light-sources/shared/three/SceneLightingMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | function | `clamp01` | `<module>` | called-by: Called by this module to clamp a trusted calculation result to the unit interval. | called-by | params 1/1; returns tagged |
| 23 | function | `ambientIntensityRangeOrDefault` | `<module>` | called-by: Called by this module to accept optional scene ambient-intensity bounds. | called-by | params 3/3; returns tagged; throws 1 |
| 47 | function | `scaleRange` | `<module>` | called-by: Called by this module to scale a unit percentage into an accepted intensity range. | called-by | params 2/2; returns tagged |
| 52 | constant | `SceneLightingMath` | `<module>` | descriptive-other: Scene-light intensity range acceptance and scaling methods. | entity/value | none |

## `src/algorithm32/light-sources/shared/three/ThreeLighting.js`

Source: [src/algorithm32/light-sources/shared/three/ThreeLighting.js](../../../../../../src/algorithm32/light-sources/shared/three/ThreeLighting.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | function | `layerIndexOrNull` | `<module>` | called-by: Called by this module to resolve an optional Three layer index, defaulting only omiss... | called-by | params 1/1; returns tagged; throws 1 |
| 30 | function | `applyLayerIndex` | `<module>` | called-by: Called by this module to apply an accepted optional Three layer index. | called-by | params 2/2 |
| 47 | function | `addObjectsToScene` | `<module>` | called-by: Called by this module to add created lighting objects to a supplied Three scene in so... | called-by | params 2/2 |
| 68 | function | `configureShadowObject` | `<module>` | called-by: Called by this module to configure an app-authored Three object tree for source-owned... | called-by | params 3/3; returns tagged; throws 1 |
| 105 | callback | `configureNode` | `configureNode` | called-by: Called by ThreeLighting.configureShadowObject to configure one accepted Three shadow ... | called-by | params 1/1 |
| 148 | constant | `ThreeLighting` | `<module>` | descriptive-other: Three object, layer, scene, and shadow configuration methods. | entity/value | none |

## `src/algorithm32/profiles/index.js`

Source: [src/algorithm32/profiles/index.js](../../../../../../src/algorithm32/profiles/index.js)

No independently documentable declaration or callable target; this is a re-export-only barrel.

## `src/algorithm32/profiles/native-15/consts.js`

Source: [src/algorithm32/profiles/native-15/consts.js](../../../../../../src/algorithm32/profiles/native-15/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `CANONICAL_SPECTRAL_CHANNELS` | `<module>` | descriptive-other: Accepted canonical Native-15 spectral channels. @type {readonly SpectralChannelConsta... | entity/value | none |
| 96 | constant | `PROFILE_SCHEMA_REVISION` | `<module>` | descriptive-other: Native production-profile schema revision. | entity/value | none |
| 99 | constant | `PHYSICAL_PROFILE_SCHEMA_REVISION` | `<module>` | descriptive-other: Native physical-profile schema revision. | entity/value | none |
| 102 | constant | `NUMERICAL_PROFILE_SCHEMA_REVISION` | `<module>` | descriptive-other: Native numerical-profile schema revision. | entity/value | none |
| 105 | constant | `DEFAULT_PROFILE_ID` | `<module>` | descriptive-other: Default native production-profile identifier. | entity/value | none |
| 108 | constant | `DEFAULT_PROFILE_REVISION` | `<module>` | descriptive-other: Default native production-profile revision. | entity/value | none |
| 111 | constant | `DEFAULT_PROFILE_ROLE` | `<module>` | descriptive-other: Native production-profile role. | entity/value | none |
| 114 | constant | `SOURCE_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Canonical Native-15 source-packet provenance identity. | entity/value | none |
| 117 | constant | `NATIVE_15_SPECTRAL_CHANNEL_COUNT` | `<module>` | descriptive-other: Executable Native-15 spectral layer count. | entity/value | none |

## `src/algorithm32/profiles/native-15/native-15-profile.js`

Source: [src/algorithm32/profiles/native-15/native-15-profile.js](../../../../../../src/algorithm32/profiles/native-15/native-15-profile.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 31 | function | `assertNativeSourcePacket` | `<module>` | called-by: Called by profile construction to require the Native-15 irradiance-density boundary. | called-by | params 1/1 |
| 47 | function | `acceptNativeGroundAlbedo` | `<module>` | called-by: Called by profile construction to accept a Native-15 ground-albedo packet. | called-by | params 1/1; returns tagged; throws 1 |
| 63 | callback | `albedo.values.some::<callback@63:8>` | `acceptNativeGroundAlbedo` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 1/1; returns tagged |
| 80 | constant | `NATIVE_15_SPECTRAL_BASIS` | `<module>` | descriptive-other: Native 15-channel production wavelength basis. This is the Algorithm32 production bas... | entity/value | none |
| 89 | callback | `CANONICAL_SPECTRAL_CHANNELS.map::<callback@89:7>` | `NATIVE_15_SPECTRAL_BASIS` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 105 | constant | `NATIVE_SOURCE_IRRADIANCE_DENSITY` | `<module>` | descriptive-other: Native top-of-atmosphere source irradiance-density packet. The legacy canonical-data ... | entity/value | none |
| 116 | callback | `CANONICAL_SPECTRAL_CHANNELS.map::<callback@116:8>` | `NATIVE_SOURCE_IRRADIANCE_DENSITY` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 123 | constant | `DEFAULT_NATIVE_PHYSICAL_PROFILE` | `<module>` | descriptive-other: Default native physical atmosphere profile without a reflective ground. @type {Native... | entity/value | none |
| 175 | constant | `DEFAULT_NATIVE_NUMERICAL_PROFILE` | `<module>` | descriptive-other: Default native numerical profile. Cache construction options remain direct numerical ... | entity/value | none |
| 209 | function | `createNativeProductionProfile` | `<module>` | call-this-method: Call this function to construct a readonly Native-15 production profile. Supplying an... | active-callable | params 1/1; returns tagged; throws 2 |
| 296 | constant | `DEFAULT_NATIVE_PRODUCTION_PROFILE` | `<module>` | descriptive-other: Default readonly Native-15 production profile. @type {NativeProductionProfile} | entity/value | none |

## `src/algorithm32/quantities/index.js`

Source: [src/algorithm32/quantities/index.js](../../../../../../src/algorithm32/quantities/index.js)

No independently documentable declaration or callable target; this is a re-export-only barrel.

## `src/algorithm32/quantities/spectral/consts.js`

Source: [src/algorithm32/quantities/spectral/consts.js](../../../../../../src/algorithm32/quantities/spectral/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `SPECTRAL_SAMPLE_SEMANTICS` | `<module>` | descriptive-other: Supported interpretation for every spectral channel. | entity/value | none |
| 7 | constant | `SPECTRAL_BASIS_SCHEMA_REVISION` | `<module>` | descriptive-other: Current spectral-basis schema revision. | entity/value | none |
| 10 | constant | `CANONICAL_CHANNEL_UNITS` | `<module>` | descriptive-other: Canonical unit spelling for spectral-channel centers and widths. | entity/value | none |
| 13 | constant | `SPECTRAL_QUANTITIES` | `<module>` | descriptive-other: Supported spectral physical quantities keyed by public role. | entity/value | none |
| 29 | constant | `SPECTRAL_UNITS` | `<module>` | descriptive-other: Canonical units used by supported spectral quantities. | entity/value | none |
| 44 | constant | `ALLOWED_SPECTRAL_QUANTITIES` | `<module>` | descriptive-other: Complete set of accepted spectral quantities. | entity/value | none |
| 51 | constant | `SPECTRAL_QUANTITY_UNITS` | `<module>` | descriptive-other: Canonical units keyed by spectral quantity. | entity/value | none |

## `src/algorithm32/quantities/spectral/SpectralBasis.js`

Source: [src/algorithm32/quantities/spectral/SpectralBasis.js](../../../../../../src/algorithm32/quantities/spectral/SpectralBasis.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | class | `SpectralBasis` | `<module>` | descriptive-other: Immutable ordered wavelength-bin basis with canonical physical identity. | entity/value | none |
| 16 | method | `_nearlyEqual` | `SpectralBasis` | called-by: Called by SpectralBasis construction to compare derived binary64 bin boundaries at th... | called-by | params 2/2; returns tagged |
| 29 | method | `_normalizeChannels` | `SpectralBasis` | called-by: Called by SpectralBasis construction to validate and normalize ordered channels into ... | called-by | params 1/1; returns tagged; throws 1 |
| 45 | callback | `value.map::<callback@45:8>` | `channels` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged; throws 2 |
| 112 | constructor | `<anonymous@112:2>` | `SpectralBasis` | creates: Creates a validated spectral basis with normalized ordered channels and a canonical c... | creates | params 1/1; throws 2 |
| 157 | method | `assert` | `SpectralBasis` | call-this-method: Call this method to assert that a candidate is a validated spectral basis. | active-callable | params 2/2; returns tagged; throws 1 |
| 175 | method | `assertCompatible` | `SpectralBasis` | call-this-method: Call this method to assert that two bases have identical ordered physical content and... | active-callable | params 3/3; throws 1 |
| 189 | method | `toJSON` | `SpectralBasis` | call-this-method: Call this method to return the plain readonly spectral-basis identity. | active-callable | returns tagged |

## `src/algorithm32/quantities/spectral/SpectralMath.js`

Source: [src/algorithm32/quantities/spectral/SpectralMath.js](../../../../../../src/algorithm32/quantities/spectral/SpectralMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 14 | function | `assertResultInterpretation` | `<module>` | called-by: Called by this module to assert that an operation declares both parts of its result i... | called-by | params 2/2; returns tagged; throws 1 |
| 38 | function | `acceptOperationOptions` | `<module>` | called-by: Called by this module to accept optional spectral-operation provenance at a public bo... | called-by | params 2/2; returns tagged; throws 1 |
| 62 | function | `acceptMappingResult` | `<module>` | called-by: Called by this module to accept an optional spectral-mapping result interpretation. I... | called-by | params 1/1; returns tagged; throws 1 |
| 95 | function | `resolveProvenanceIdentity` | `<module>` | called-by: Called by this module to accept explicit provenance or derive it only when the explic... | called-by | params 3/3; returns tagged; throws 1 |
| 108 | function | `derivedProvenanceIdentity` | `<module>` | called-by: Called by this module to derive deterministic provenance for one spectral-packet oper... | called-by | params 3/3; returns tagged |
| 118 | function | `zeroSpectralPacket` | `<module>` | called-by: Called by this module to create a fresh zero-valued packet with an explicit physical ... | called-by | params 1/1; returns tagged |
| 130 | callback | `Array.from::<callback@130:8>` | `zeroSpectralPacket` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 145 | function | `oneSpectralPacket` | `<module>` | called-by: Called by this module to create a fresh one-valued packet with an explicit physical i... | called-by | params 1/1; returns tagged |
| 157 | callback | `Array.from::<callback@157:8>` | `oneSpectralPacket` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 175 | function | `scaleSpectralPacket` | `<module>` | called-by: Called by this module to scale a spectral packet without changing its physical interp... | called-by | params 3/3; returns tagged; throws 1 |
| 192 | callback | `checked.values.map::<callback@192:8>` | `scaleSpectralPacket` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 200 | callback | `resolveProvenanceIdentity::<callback@200:8>` | `scaleSpectralPacket` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 214 | function | `addSpectralPackets` | `<module>` | called-by: Called by this module to add packets with identical quantity, units, basis, and sampl... | called-by | params 3/3; returns tagged; throws 1 |
| 233 | callback | `checkedLeft.values.map::<callback@233:8>` | `addSpectralPackets` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 241 | callback | `resolveProvenanceIdentity::<callback@241:8>` | `addSpectralPackets` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 255 | function | `multiplySpectralPackets` | `<module>` | called-by: Called by this module to multiply compatible packets under an explicit result quantit... | called-by | params 3/3; returns tagged; throws 1 |
| 270 | callback | `checkedLeft.values.map::<callback@270:8>` | `multiplySpectralPackets` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 278 | callback | `resolveProvenanceIdentity::<callback@278:8>` | `multiplySpectralPackets` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 297 | function | `divideSpectralPackets` | `<module>` | called-by: Called by this module to divide compatible packets under an explicit result quantity ... | called-by | params 3/3; returns tagged; throws 2 |
| 309 | callback | `checkedDenominator.values.some::<callback@309:8>` | `divideSpectralPackets` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 1/1; returns tagged |
| 326 | callback | `checkedNumerator.values.map::<callback@326:8>` | `divideSpectralPackets` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 334 | callback | `resolveProvenanceIdentity::<callback@334:8>` | `divideSpectralPackets` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 352 | function | `mapSpectralPacket` | `<module>` | called-by: Called by this module to map packet values while retaining or explicitly replacing th... | called-by | params 3/3; returns tagged; throws 1 |
| 373 | callback | `checked.values.map::<callback@373:8>` | `mapSpectralPacket` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 381 | callback | `resolveProvenanceIdentity::<callback@381:8>` | `mapSpectralPacket` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 391 | constant | `SpectralMath` | `<module>` | descriptive-other: Spectral-packet arithmetic, mapping, interpretation, and provenance methods. | entity/value | none |

## `src/algorithm32/quantities/spectral/SpectralPacket.js`

Source: [src/algorithm32/quantities/spectral/SpectralPacket.js](../../../../../../src/algorithm32/quantities/spectral/SpectralPacket.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | class | `SpectralPacket` | `<module>` | descriptive-other: Immutable spectral value with its complete interpretation and physical identity. | entity/value | none |
| 16 | method | `_requireQuantity` | `SpectralPacket` | called-by: Called by SpectralPacket construction to accept one supported physical quantity. | called-by | params 1/1; returns tagged; throws 1 |
| 32 | method | `_unitsForQuantity` | `SpectralPacket` | called-by: Called by SpectralPacket construction to select the canonical units for one accepted ... | called-by | params 1/1; returns tagged |
| 44 | method | `normalizeUnits` | `SpectralPacket` | call-this-method: Call this method to normalize supported punctuation variants to canonical spectral-un... | active-callable | params 1/1; returns tagged |
| 62 | method | `_normalizeValues` | `SpectralPacket` | called-by: Called by SpectralPacket construction to copy and validate one spectral numeric vector. | called-by | params 2/2; returns tagged; throws 2 |
| 84 | constructor | `<anonymous@84:2>` | `SpectralPacket` | creates: Creates a validated spectral packet with normalized interpretation, independently own... | creates | params 1/1; throws 2 |
| 142 | method | `assert` | `SpectralPacket` | call-this-method: Call this method to assert a packet and its optional expected interpretation. | active-callable | params 2/2; returns tagged; throws 1 |
| 179 | method | `assertCompatible` | `SpectralPacket` | call-this-method: Call this method to assert that two packets use compatible bases and any caller-selec... | active-callable | params 3/3; returns tagged; throws 1 |
| 204 | method | `toJSON` | `SpectralPacket` | call-this-method: Call this method to return the plain readonly spectral-packet identity. | active-callable | returns tagged |

## `src/algorithm32/quantities/units/consts.js`

Source: [src/algorithm32/quantities/units/consts.js](../../../../../../src/algorithm32/quantities/units/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `UNIT_FAMILIES` | `<module>` | descriptive-other: Unit families with explicit conversion support. | entity/value | none |

## `src/algorithm32/quantities/units/UnitMath.js`

Source: [src/algorithm32/quantities/units/UnitMath.js](../../../../../../src/algorithm32/quantities/units/UnitMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 11 | function | `family` | `<module>` | called-by: Called by this module to create independently owned metadata for one compatible unit ... | called-by | params 2/2; returns tagged |
| 26 | function | `conversion` | `<module>` | called-by: Called by this module to create conversion metadata for one unit spelling. | called-by | params 2/2; returns tagged |
| 35 | constant | `UNIT_CONVERSIONS` | `<module>` | descriptive-other: Conversion metadata keyed by supported unit spelling. | entity/value | none |
| 65 | function | `createUnitValue` | `<module>` | called-by: Called by this module to accept an exact unit-value definition and create an independ... | called-by | params 1/1; returns tagged; throws 1 |
| 96 | function | `assertUnitValue` | `<module>` | called-by: Called by this module to assert the exact public unit-value shape. | called-by | params 2/2; returns tagged; throws 1 |
| 122 | function | `isUnitValue` | `<module>` | called-by: Called by this module to test whether a value conforms to the unit-value contract wit... | called-by | params 1/1; returns tagged |
| 139 | function | `copyUnitValue` | `<module>` | called-by: Called by this module to copy an accepted unit value into an independently owned packet. | called-by | params 2/2; returns tagged; throws 1 |
| 154 | function | `convertUnitValue` | `<module>` | called-by: Called by this module to convert one unit value to compatible target units. Unknown b... | called-by | params 3/3; returns tagged; throws 1 |
| 188 | function | `normalizeUnitValue` | `<module>` | called-by: Called by this module to normalize one unit value to a caller-selected canonical unit... | called-by | params 3/3; returns tagged; throws 1 |
| 193 | constant | `UnitMath` | `<module>` | descriptive-other: Unit-family, unit-value, conversion, copying, and normalization operations. | entity/value | none |

## `src/algorithm32/runtime/facade/Algorithm32.js`

Source: [src/algorithm32/runtime/facade/Algorithm32.js](../../../../../../src/algorithm32/runtime/facade/Algorithm32.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | constant | `SUPPORTED_PATH_SAMPLE_DISTRIBUTIONS` | `<module>` | descriptive-other: Supported path sample distributions constant. | entity/value | none |
| 14 | class | `Algorithm32` | `<module>` | descriptive-other: Object that provides the primary production facade for Algorithm32. | entity/value | none |
| 21 | field | `_config` | `Algorithm32` | descriptive-other: Value that stores the current accepted configuration. | entity/value | none |
| 29 | field | `_version` | `Algorithm32` | descriptive-other: Value that stores the current facade-local configuration version. | entity/value | none |
| 37 | field | `_model` | `Algorithm32` | descriptive-other: Value that stores the facade-owned shared model. | entity/value | none |
| 45 | field | `_reference` | `Algorithm32` | descriptive-other: Value that stores the CPU/reference implementation collaborator. | entity/value | none |
| 53 | field | `_shaderBuilder` | `Algorithm32` | descriptive-other: Value that stores the runtime shader builder. | entity/value | none |
| 61 | field | `_shaderHandles` | `Algorithm32` | descriptive-other: Value that tracks handles created by this facade. | entity/value | none |
| 69 | field | `_disposed` | `Algorithm32` | descriptive-other: Value that tracks whether this facade has been disposed. | entity/value | none |
| 77 | method | `_copyConfig` | `Algorithm32` | called-by: Called by algorithm32 to copy facade configuration without cloning consumer-owned mod... | called-by | params 1/1; returns tagged |
| 103 | method | `_assertOptionalIntervalCount` | `Algorithm32` | called-by: Called by configuration acceptance to allow an omitted interval count or require a po... | called-by | params 2/2; throws 1 |
| 114 | method | `_createConfigSnapshot` | `Algorithm32` | called-by: Called by algorithm32 to create the current configuration snapshot. | called-by | returns tagged |
| 129 | method | `_acceptConfigValues` | `Algorithm32` | called-by: Called by algorithm32 to accept semantic configuration values at the public facade bo... | called-by | params 1/1; throws 2 |
| 167 | method | `_prepareConfig` | `Algorithm32` | called-by: Called by algorithm32 to prepare config and implementation collaborators without publ... | called-by | params 1/1; returns tagged |
| 207 | method | `_commitPreparedConfig` | `Algorithm32` | called-by: Called by algorithm32 to publish one fully prepared configuration after its dependent... | called-by | params 1/1; returns tagged; throws 1 |
| 232 | method | `_discardPreparedConfig` | `Algorithm32` | called-by: Called by algorithm32 to dispose collaborators belonging to an unpublished configurat... | called-by | params 1/1 |
| 247 | method | `_replaceConfig` | `Algorithm32` | called-by: Called by algorithm32 to replace config and implementation collaborators synchronously. | called-by | params 1/1; returns tagged |
| 258 | constructor | `<anonymous@258:2>` | `Algorithm32` | creates: Creates a facade for one configured Algorithm32 simulation/render context. | creates | params 1/1 |
| 271 | method | `_createShaderBuildRequest` | `Algorithm32` | called-by: Called by algorithm32 to create the internal shader build request from public setup f... | called-by | params 3/3; returns tagged |
| 297 | method | `_assertUsable` | `Algorithm32` | called-by: Called by algorithm32 to assert that the facade is still usable. | called-by | throws 1 |
| 309 | method | `_forgetShaderHandle` | `Algorithm32` | called-by: Called by algorithm32 to forget a disposed shader handle. | called-by | params 1/1 |
| 318 | accessor-get | `config` | `Algorithm32` | descriptive-other: Value that returns the current canonical configuration snapshot. The returned packet ... | entity/value | returns tagged |
| 331 | method | `setConfig` | `Algorithm32` | call-this-method: Call this method to replace the facade configuration with a new complete configuratio... | active-callable | params 1/1; returns tagged |
| 345 | method | `setupShader` | `Algorithm32` | call-this-method: Call this method to build and attach the runtime shader integration. The returned han... | active-callable | params 1/1; returns tagged; throws 1; async outcome mentioned |
| 377 | method | `evaluate` | `Algorithm32` | call-this-method: Call this method to run one CPU/reference Algorithm32 evaluation request. The returne... | active-callable | params 1/1; returns tagged |
| 388 | method | `dispose` | `Algorithm32` | call-this-method: Call this method to dispose resources owned by this facade. | active-callable | none |

## `src/algorithm32/runtime/facade/Algorithm32ShaderHandle.js`

Source: [src/algorithm32/runtime/facade/Algorithm32ShaderHandle.js](../../../../../../src/algorithm32/runtime/facade/Algorithm32ShaderHandle.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | class | `Algorithm32ShaderHandle` | `<module>` | descriptive-other: Control one installed Algorithm32 runtime shader integration. | entity/value | none |
| 12 | constructor | `<anonymous@12:2>` | `Algorithm32ShaderHandle` | creates: Creates a shader handle. | creates | params 1/1 |
| 28 | method | `_disposeBuildResult` | `Algorithm32ShaderHandle` | called-by: Called by algorithm32 shader handle to dispose runtime resources owned by the current... | called-by | params 2/2 |
| 44 | method | `_assertUsable` | `Algorithm32ShaderHandle` | called-by: Called by algorithm32 shader handle to assert that the handle is still usable. | called-by | throws 1 |
| 57 | method | `setConfig` | `Algorithm32ShaderHandle` | call-this-method: Call this method to replace facade config and refresh runtime shader resources. Repla... | active-callable | params 1/1; returns tagged; throws 1; async outcome mentioned |
| 109 | method | `prepare` | `Algorithm32ShaderHandle` | call-this-method: Call this method to prepare the installed runtime program for a nonblocking first fra... | active-callable | params 1/1; async outcome mentioned |
| 119 | method | `getDiagnostics` | `Algorithm32ShaderHandle` | call-this-method: Call this method to return runtime shader diagnostics. It returns the value from the ... | active-callable | returns tagged |
| 141 | method | `dispose` | `Algorithm32ShaderHandle` | call-this-method: Call this method to dispose resources owned by this handle. | active-callable | none |

## `src/algorithm32/runtime/model/SharedModel.js`

Source: [src/algorithm32/runtime/model/SharedModel.js](../../../../../../src/algorithm32/runtime/model/SharedModel.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | class | `SharedModel` | `<module>` | descriptive-other: Aggregate the canonical Algorithm32 configuration/facts component models. | entity/value | none |
| 14 | constructor | `<anonymous@14:2>` | `SharedModel` | creates: Creates the shared configuration/facts model for one facade instance. | creates | params 1/1 |
| 30 | accessor-get | `version` | `SharedModel` | descriptive-other: Value that returns the facade-local shared model version. | entity/value | returns tagged |
| 39 | accessor-get | `lightSource` | `SharedModel` | descriptive-other: Value that returns the configured light-source model. | entity/value | returns tagged |
| 48 | accessor-get | `atmosphere` | `SharedModel` | descriptive-other: Value that returns the configured atmosphere model. | entity/value | returns tagged |
| 57 | accessor-get | `geometry` | `SharedModel` | descriptive-other: Value that returns the configured geometry model. | entity/value | returns tagged |
| 66 | accessor-get | `spectral` | `SharedModel` | descriptive-other: Value that returns the configured spectral model. | entity/value | returns tagged |

## `src/algorithm32/runtime/model/SpectralModel.js`

Source: [src/algorithm32/runtime/model/SpectralModel.js](../../../../../../src/algorithm32/runtime/model/SpectralModel.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | class | `SpectralModel` | `<module>` | descriptive-other: Object that owns the canonical spectral basis and spectral channel shape for one Algo... | entity/value | none |
| 11 | method | `_acceptBasis` | `SpectralModel` | called-by: Called by spectral model to accept a spectral basis at the model ownership boundary. | called-by | params 1/1; returns tagged |
| 22 | constructor | `<anonymous@22:2>` | `SpectralModel` | creates: Creates a spectral component model from accepted spectral configuration. | creates | params 1/1 |
| 34 | accessor-get | `basis` | `SpectralModel` | descriptive-other: Value that returns the canonical spectral basis. | entity/value | returns tagged |
| 43 | accessor-get | `wavelengths` | `SpectralModel` | descriptive-other: Value that returns the active wavelength samples. | entity/value | returns tagged |
| 49 | callback | `this._basis.channels.map::<callback@49:8>` | `SpectralModel` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 58 | accessor-get | `channelCount` | `SpectralModel` | descriptive-other: Value that returns the active spectral channel count. | entity/value | returns tagged |
| 67 | accessor-get | `version` | `SpectralModel` | descriptive-other: Value that returns the facade-local spectral model version. | entity/value | returns tagged |
| 78 | method | `getWavelength` | `SpectralModel` | call-this-method: Call this method to return the wavelength for one active channel. | active-callable | params 1/1; returns tagged; throws 1 |
| 92 | method | `replaceBasis` | `SpectralModel` | call-this-method: Call this method to replace the active spectral basis. | active-callable | params 1/1; returns tagged |

## `src/algorithm32/runtime/reference/Reference.js`

Source: [src/algorithm32/runtime/reference/Reference.js](../../../../../../src/algorithm32/runtime/reference/Reference.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 5 | class | `Reference` | `<module>` | descriptive-other: Object that runs CPU/reference Algorithm32 evaluations against a configured shared mo... | entity/value | none |
| 12 | method | `_resolveViewRay` | `Reference` | called-by: Called by reference to resolve a view-ray request, defaulting only an absent value. C... | called-by | params 1/1; returns tagged |
| 22 | field | `_model` | `Reference` | descriptive-other: Value that stores the facade-owned shared model consumed by reference evaluations. | entity/value | none |
| 30 | field | `_calculator` | `Reference` | descriptive-other: Value that stores the shared spectral calculator. | entity/value | none |
| 38 | field | `_scatteringCache` | `Reference` | descriptive-other: Value that stores the configured default cumulative CPU scattering cache. | entity/value | none |
| 46 | field | `_executionOptions` | `Reference` | descriptive-other: Value that stores numerical execution options. | entity/value | none |
| 55 | constructor | `<anonymous@55:2>` | `Reference` | creates: Creates a CPU/reference algorithm execution collaborator. | creates | params 1/1 |
| 79 | accessor-get | `model` | `Reference` | descriptive-other: Value that gets the facade-owned shared model consumed by reference evaluations. | entity/value | returns tagged |
| 88 | accessor-get | `calculator` | `Reference` | descriptive-other: Value that gets the shared spectral calculator. | entity/value | returns tagged |
| 100 | method | `_resolvePathIntervalCount` | `Reference` | called-by: Called by reference to resolve the path interval count for one evaluation. | called-by | params 1/1; returns tagged; throws 1 |
| 124 | method | `_resolveScatteringCache` | `Reference` | called-by: Called by reference to resolve the cumulative CPU scattering cache for one evaluation... | called-by | params 1/1; returns tagged; throws 1 |
| 149 | method | `_createEvaluationResult` | `Reference` | called-by: Called by reference to create the public spectral evaluation result from resolved pat... | called-by | params 3/3; returns tagged |
| 165 | method | `evaluate` | `Reference` | call-this-method: Call this method to evaluate Algorithm32 spectral radiance and transmittance for one ... | active-callable | params 1/1; returns tagged |
| 183 | method | `dispose` | `Reference` | call-this-method: Call this method to dispose resources owned by the reference execution collaborator. | active-callable | none |

## `src/algorithm32/runtime/rendering/consts.js`

Source: [src/algorithm32/runtime/rendering/consts.js](../../../../../../src/algorithm32/runtime/rendering/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `EMPTY_SHADER_BUILD_CONTEXT` | `<module>` | descriptive-other: Value that stores the default context for assembly-only shader builds. | entity/value | none |

## `src/algorithm32/runtime/rendering/ShaderAssemblyPreparer.js`

Source: [src/algorithm32/runtime/rendering/ShaderAssemblyPreparer.js](../../../../../../src/algorithm32/runtime/rendering/ShaderAssemblyPreparer.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | class | `ShaderAssemblyPreparer` | `<module>` | descriptive-other: Deterministic shader-assembly preparation for the configured Algorithm32 model. | entity/value | none |
| 13 | field | `_model` | `ShaderAssemblyPreparer` | descriptive-other: Facade-owned shared model consumed during shader preparation. | entity/value | none |
| 20 | field | `_assembler` | `ShaderAssemblyPreparer` | descriptive-other: Generic shader assembler used to produce final source. | entity/value | none |
| 27 | field | `_transport` | `ShaderAssemblyPreparer` | descriptive-other: Core transport provider used by automatic assembly. | entity/value | none |
| 34 | constructor | `<anonymous@34:2>` | `ShaderAssemblyPreparer` | creates: Creates a deterministic shader-assembly preparer for one shared model. | creates | params 1/1 |
| 47 | method | `hasAssemblyInputs` | `ShaderAssemblyPreparer` | call-this-method: Call this method to determine whether a request supplies low-level assembly inputs. | active-callable | params 1/1; returns tagged |
| 57 | method | `canAssembleFromConfiguredModel` | `ShaderAssemblyPreparer` | call-this-method: Call this method to determine whether the configured model can provide a complete sha... | active-callable | returns tagged |
| 74 | method | `mainRequiredShaderSymbols` | `ShaderAssemblyPreparer` | call-this-method: Call this method to obtain the transport symbols required by automatic assembly. | active-callable | returns tagged |
| 85 | method | `_shouldAddRuntimeContribution` | `ShaderAssemblyPreparer` | called-by: Called by assembleIfRequested to determine whether generic runtime initial state is r... | called-by | params 2/2; returns tagged |
| 91 | callback | `contributions.some::<callback@91:8>` | `providesRuntime` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 1/1; returns tagged |
| 102 | callback | `contributions.some::<callback@102:9>` | `needsRuntime` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 1/1; returns tagged |
| 114 | method | `_runtimeTypesBlock` | `ShaderAssemblyPreparer` | called-by: Called by _createRuntimeShaderContribution to create the shared runtime type and help... | called-by | params 1/1; returns tagged |
| 177 | method | `_runtimeInitialStateBlock` | `ShaderAssemblyPreparer` | called-by: Called by _createRuntimeShaderContribution to create the shared runtime initial-state... | called-by | returns tagged |
| 203 | method | `_createRuntimeShaderContribution` | `ShaderAssemblyPreparer` | called-by: Called by _collectContributions to create the shared Three runtime contribution. | called-by | returns tagged |
| 299 | method | `_collectContributions` | `ShaderAssemblyPreparer` | called-by: Called by assembleIfRequested to collect explicit and provider-owned shader contribut... | called-by | params 2/2; returns tagged |
| 346 | method | `assembleIfRequested` | `ShaderAssemblyPreparer` | call-this-method: Call this method to assemble source when explicit or automatic inputs require it. | active-callable | params 2/2; returns tagged |

## `src/algorithm32/runtime/rendering/ShaderBuilder.js`

Source: [src/algorithm32/runtime/rendering/ShaderBuilder.js](../../../../../../src/algorithm32/runtime/rendering/ShaderBuilder.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 11 | class | `ShaderBuilder` | `<module>` | descriptive-other: Renderer-facing coordinator for Algorithm32 runtime shader builds. | entity/value | none |
| 17 | field | `_model` | `ShaderBuilder` | descriptive-other: Facade-owned shared model consumed by shader builds. | entity/value | none |
| 24 | field | `_assemblyPreparer` | `ShaderBuilder` | descriptive-other: Deterministic assembly-preparation collaborator. | entity/value | none |
| 31 | field | `_runtimeInstaller` | `ShaderBuilder` | descriptive-other: Three runtime-installation collaborator. | entity/value | none |
| 38 | field | `_lastConfig` | `ShaderBuilder` | descriptive-other: Last accepted facade configuration snapshot. | entity/value | none |
| 45 | field | `_disposed` | `ShaderBuilder` | descriptive-other: Whether this builder has been disposed. | entity/value | none |
| 52 | constructor | `<anonymous@52:2>` | `ShaderBuilder` | creates: Creates a runtime shader build coordinator for one facade-owned model. | creates | params 1/1 |
| 71 | accessor-get | `model` | `ShaderBuilder` | descriptive-other: Facade-owned shared model consumed by shader builds. | entity/value | returns tagged |
| 82 | method | `_acceptSceneScale` | `ShaderBuilder` | called-by: Called by ShaderBuilder request validation to accept an optional scene scale. | called-by | params 2/2 |
| 96 | method | `_acceptPositiveDistance` | `ShaderBuilder` | called-by: Called by ShaderBuilder request validation to accept an optional positive distance. | called-by | params 2/2; throws 1 |
| 115 | method | `_acceptShaderBuildConfig` | `ShaderBuilder` | called-by: Called by ShaderBuilder request validation to accept an optional facade configuration... | called-by | params 1/1; throws 1 |
| 140 | method | `_acceptShaderSetupOptions` | `ShaderBuilder` | called-by: Called by ShaderBuilder request validation to accept runtime scene-capture options. | called-by | params 1/1; throws 1 |
| 155 | method | `_acceptShaderBuildRequestOptions` | `ShaderBuilder` | called-by: Called by ShaderBuilder request validation to accept optional build and setup values. | called-by | params 1/1 |
| 166 | method | `_assertUsable` | `ShaderBuilder` | called-by: Called by ShaderBuilder public operations to reject use after disposal. | called-by | throws 1 |
| 179 | method | `_assertBuildRequest` | `ShaderBuilder` | called-by: Called by ShaderBuilder.build to validate setup-time attachment and automatic-cache r... | called-by | params 1/1; throws 1 |
| 202 | method | `_createBuildContext` | `ShaderBuilder` | called-by: Called by ShaderBuilder.build to create the source-cache lifecycle context for automa... | called-by | params 1/1; returns tagged; throws 1; async outcome mentioned |
| 270 | method | `build` | `ShaderBuilder` | call-this-method: Call this method to build the runtime shader artifacts needed by a Three composer att... | active-callable | params 1/1; returns tagged; throws 1; async outcome mentioned |
| 314 | method | `refreshConfig` | `ShaderBuilder` | call-this-method: Call this method to retain a new accepted facade configuration snapshot. | active-callable | params 1/1 |
| 324 | method | `dispose` | `ShaderBuilder` | call-this-method: Call this method to terminate the runtime shader build coordinator lifecycle. | active-callable | none |

## `src/algorithm32/runtime/rendering/three/consts.js`

Source: [src/algorithm32/runtime/rendering/three/consts.js](../../../../../../src/algorithm32/runtime/rendering/three/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `GLSL_DIRECTIVE_PREFIX` | `<module>` | descriptive-other: Value that stores the leading character used by GLSL preprocessor directives. | entity/value | none |

## `src/algorithm32/runtime/rendering/three/SceneInputCapture.js`

Source: [src/algorithm32/runtime/rendering/three/SceneInputCapture.js](../../../../../../src/algorithm32/runtime/rendering/three/SceneInputCapture.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | class | `SceneInputCapture` | `<module>` | descriptive-other: Composer-compatible pass that captures renderer-produced Algorithm32 scene inputs. | entity/value | none |
| 18 | method | `_createRenderTarget` | `SceneInputCapture` | called-by: Called by scene input capture to create a WebGL render target for one scene-input tex... | called-by | params 4/4; returns tagged |
| 45 | method | `_optionalFiniteCoordinate` | `SceneInputCapture` | called-by: Called by scene input capture to accept an optional finite coordinate or its absent-v... | called-by | params 3/3; returns tagged; throws 1 |
| 65 | method | `_assertFiniteVector3` | `SceneInputCapture` | called-by: Called by scene input capture to assert that a vector-like value contains finite coor... | called-by | params 2/2; throws 1 |
| 85 | method | `_updateCameraWorldPosition` | `SceneInputCapture` | called-by: Called by scene input capture to update a vector-like value from camera world position. | called-by | params 2/2 |
| 109 | method | `_createVector3` | `SceneInputCapture` | called-by: Called by scene input capture to create a vector initialized to the camera world posi... | called-by | params 2/2; returns tagged |
| 122 | method | `_distanceVertexShader` | `SceneInputCapture` | called-by: Called by scene input capture to provide the shared distance-capture vertex shader. | called-by | returns tagged |
| 140 | method | `_distanceFragmentShader` | `SceneInputCapture` | called-by: Called by scene input capture to provide the distance-packing fragment shader. | called-by | returns tagged |
| 172 | method | `_hitVertexShader` | `SceneInputCapture` | called-by: Called by scene input capture to provide the shared hit-mask vertex shader. | called-by | returns tagged |
| 186 | method | `_hitFragmentShader` | `SceneInputCapture` | called-by: Called by scene input capture to provide the hit-mask fragment shader. | called-by | returns tagged |
| 204 | method | `_createDepthMaterial` | `SceneInputCapture` | called-by: Called by scene input capture to create the override material that packs camera dista... | called-by | params 4/4; returns tagged |
| 236 | method | `_createHitMaterial` | `SceneInputCapture` | called-by: Called by scene input capture to create the override material that writes an explicit... | called-by | params 1/1; returns tagged |
| 257 | method | `_resizeRenderTarget` | `SceneInputCapture` | called-by: Called by scene input capture to resize one render target. | called-by | params 3/3 |
| 275 | method | `_readRendererClearState` | `SceneInputCapture` | called-by: Called by scene input capture to read renderer clear state when the renderer exposes it. | called-by | params 2/2; returns tagged |
| 298 | method | `_restoreRendererClearState` | `SceneInputCapture` | called-by: Called by scene input capture to restore captured renderer clear state. | called-by | params 2/2 |
| 312 | method | `_hideSceneInputExcludedObjects` | `SceneInputCapture` | called-by: Called by scene input capture to hide visible scene content excluded from Algorithm32... | called-by | params 1/1; returns tagged |
| 323 | callback | `scene.traverse::<callback@323:8>` | `_hideSceneInputExcludedObjects` | called-by: Called by the scene traversal to process one traversed scene object. | called-by | params 1/1 |
| 346 | method | `_restoreSceneInputExcludedObjects` | `SceneInputCapture` | called-by: Called by scene input capture to restore objects hidden by the scene-input capture fi... | called-by | params 1/1 |
| 357 | field | `enabled` | `SceneInputCapture` | descriptive-other: Capture-execution flag. | entity/value | none |
| 364 | field | `needsSwap` | `SceneInputCapture` | descriptive-other: Composer buffer-swap requirement after this pass. | entity/value | none |
| 371 | field | `clear` | `SceneInputCapture` | descriptive-other: Composer-buffer clear requirement before drawing. | entity/value | none |
| 378 | field | `renderToScreen` | `SceneInputCapture` | descriptive-other: Direct-to-screen rendering flag. | entity/value | none |
| 385 | field | `_THREE` | `SceneInputCapture` | descriptive-other: Caller-provided Three namespace. | entity/value | none |
| 392 | field | `_scene` | `SceneInputCapture` | descriptive-other: Live scene to capture. | entity/value | none |
| 399 | field | `_camera` | `SceneInputCapture` | descriptive-other: Live capture camera. | entity/value | none |
| 407 | field | `_depthTarget` | `SceneInputCapture` | descriptive-other: Value that renders target carrying packed scene-hit distance. | entity/value | none |
| 415 | field | `_hitTarget` | `SceneInputCapture` | descriptive-other: Value that renders target carrying the explicit scene-hit mask. | entity/value | none |
| 422 | field | `_depthMaterial` | `SceneInputCapture` | descriptive-other: Override material that packs hit distance. | entity/value | none |
| 429 | field | `_hitMaterial` | `SceneInputCapture` | descriptive-other: Override material that captures hit coverage. | entity/value | none |
| 436 | field | `_viewportSize` | `SceneInputCapture` | descriptive-other: Unit-bearing viewport dimensions. | entity/value | none |
| 443 | field | `_sceneScale` | `SceneInputCapture` | descriptive-other: Renderer scene-to-physical scale. | entity/value | none |
| 450 | field | `_sceneDepthMax` | `SceneInputCapture` | descriptive-other: Largest representable scene distance. | entity/value | none |
| 457 | field | `_frameCount` | `SceneInputCapture` | descriptive-other: Completed capture-frame count. | entity/value | none |
| 464 | field | `_disposed` | `SceneInputCapture` | descriptive-other: Owned-resource disposal state. | entity/value | none |
| 471 | field | `_depthPerformanceTimer` | `SceneInputCapture` | descriptive-other: Optional depth-pass performance timer. | entity/value | none |
| 478 | field | `_hitPerformanceTimer` | `SceneInputCapture` | descriptive-other: Optional hit-pass performance timer. | entity/value | none |
| 487 | constructor | `<anonymous@487:2>` | `SceneInputCapture` | creates: Creates a scene input capture instance that calls this constructor to create reusable... | creates | params 1/1; throws 2 |
| 539 | accessor-get | `depthTexture` | `SceneInputCapture` | descriptive-other: Packed scene-depth texture. | entity/value | returns tagged |
| 548 | accessor-get | `hitTexture` | `SceneInputCapture` | descriptive-other: Explicit scene-hit mask texture. | entity/value | returns tagged |
| 557 | accessor-get | `viewportSize` | `SceneInputCapture` | descriptive-other: Unit-bearing viewport dimensions. | entity/value | returns tagged |
| 566 | method | `bindingValues` | `SceneInputCapture` | call-this-method: Call this method to return binding values produced by this capture helper. | active-callable | returns tagged |
| 580 | method | `_assertUsable` | `SceneInputCapture` | called-by: Called by scene input capture to assert that capture resources are still usable. | called-by | throws 1 |
| 596 | method | `_renderWithOverride` | `SceneInputCapture` | called-by: Called by scene input capture to render one override-material capture pass and restor... | called-by | params 4/4; throws 1 |
| 647 | method | `setSize` | `SceneInputCapture` | call-this-method: Call this method to resize owned capture resources. | active-callable | params 2/2 |
| 664 | method | `capture` | `SceneInputCapture` | call-this-method: Call this method to capture scene depth and hit mask for one render frame. | active-callable | params 1/1 |
| 686 | method | `render` | `SceneInputCapture` | call-this-method: Call this method to capture scene inputs for one composer invocation. | active-callable | params 1/1 |
| 695 | method | `getDiagnostics` | `SceneInputCapture` | call-this-method: Call this method to return capture diagnostics for runtime inspection. Conditional re... | active-callable | returns tagged |
| 714 | method | `dispose` | `SceneInputCapture` | call-this-method: Call this method to dispose owned capture resources. | active-callable | none |

## `src/algorithm32/runtime/rendering/three/ShaderPassPerformanceTimer.js`

Source: [src/algorithm32/runtime/rendering/three/ShaderPassPerformanceTimer.js](../../../../../../src/algorithm32/runtime/rendering/three/ShaderPassPerformanceTimer.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 6 | class | `ShaderPassPerformanceTimer` | `<module>` | descriptive-other: Optional pass-local performance timer for Algorithm32 shader diagnostics. | entity/value | none |
| 13 | field | `_nextSampleId` | `ShaderPassPerformanceTimer` | descriptive-other: Value that tracks globally unique sample ids for callback correlation. | entity/value | none |
| 21 | field | `_passName` | `ShaderPassPerformanceTimer` | descriptive-other: Value that stores the pass name reported to callbacks. | entity/value | none |
| 29 | field | `_callback` | `ShaderPassPerformanceTimer` | descriptive-other: Value that stores the caller-provided performance callback. | entity/value | none |
| 37 | field | `_pendingQueries` | `ShaderPassPerformanceTimer` | descriptive-other: Value that stores pending GPU timer queries. | entity/value | none |
| 45 | field | `_cpuStartTimes` | `ShaderPassPerformanceTimer` | descriptive-other: Value that stores accepted CPU start timestamps by active sample. | entity/value | none |
| 53 | field | `_querySupport` | `ShaderPassPerformanceTimer` | descriptive-other: Value that stores cached timer-query support. | entity/value | none |
| 61 | field | `_sampleIntervalFrames` | `ShaderPassPerformanceTimer` | descriptive-other: Value that stores how often pass invocations should create a measured sample. | entity/value | none |
| 69 | field | `_maxPendingQueries` | `ShaderPassPerformanceTimer` | descriptive-other: Value that stores the maximum unresolved GPU timer queries this timer may hold. | entity/value | none |
| 76 | field | `_frameIndex` | `ShaderPassPerformanceTimer` | descriptive-other: Count pass invocations for sampling cadence. | entity/value | none |
| 84 | constructor | `<anonymous@84:2>` | `ShaderPassPerformanceTimer` | creates: Creates an optional shader pass performance timer. | creates | params 1/1; throws 1 |
| 108 | accessor-get | `enabled` | `ShaderPassPerformanceTimer` | descriptive-other: Value that returns true when a callback should receive samples. | entity/value | returns tagged |
| 121 | method | `_optionalPositiveInteger` | `ShaderPassPerformanceTimer` | called-by: Called by the constructor to accept a positive integer option or default an absent va... | called-by | params 3/3; returns tagged; throws 1 |
| 139 | method | `_emit` | `ShaderPassPerformanceTimer` | called-by: Called by shader pass performance timer to emit one sample without letting callback f... | called-by | params 1/1 |
| 157 | method | `_resolveQuerySupport` | `ShaderPassPerformanceTimer` | called-by: Called by shader pass performance timer to resolve WebGL2 timer-query support for the... | called-by | params 1/1; returns tagged |
| 197 | method | `poll` | `ShaderPassPerformanceTimer` | call-this-method: Call this method to poll pending GPU queries and emit resolved elapsed-time samples. | active-callable | params 1/1 |
| 237 | method | `begin` | `ShaderPassPerformanceTimer` | call-this-method: Call this method to begin timing one pass invocation. It returns the value from the f... | active-callable | params 2/2; returns tagged |
| 291 | method | `end` | `ShaderPassPerformanceTimer` | call-this-method: Call this method to end timing one pass invocation and emit the immediate CPU sample. | active-callable | params 3/3 |
| 340 | method | `dispose` | `ShaderPassPerformanceTimer` | call-this-method: Call this method to dispose pending GPU timer queries. | active-callable | none |

## `src/algorithm32/runtime/rendering/three/ShaderRuntimeInstaller.js`

Source: [src/algorithm32/runtime/rendering/three/ShaderRuntimeInstaller.js](../../../../../../src/algorithm32/runtime/rendering/three/ShaderRuntimeInstaller.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 9 | class | `ShaderRuntimeInstaller` | `<module>` | descriptive-other: Three composer installation for assembled Algorithm32 runtime shaders. | entity/value | none |
| 15 | field | `_model` | `ShaderRuntimeInstaller` | descriptive-other: Facade-owned shared model used to resolve geometry runtime facts. | entity/value | none |
| 22 | constructor | `<anonymous@22:2>` | `ShaderRuntimeInstaller` | creates: Creates a Three runtime installer for one facade-owned shared model. | creates | params 1/1 |
| 33 | method | `_removeComposerPass` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to remove a pass from a composer that exposes a remo... | called-by | params 2/2 |
| 57 | method | `_normalizeShaderUniformValue` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to normalize an accepted setup value at the GLSL uni... | called-by | params 2/2; returns tagged |
| 80 | method | `_resolveBindingValue` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to resolve a uniform value from setup-provided value... | called-by | params 2/2; returns tagged |
| 96 | method | `_createUniformValueRefresher` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to create a render-time refresh for caller-owned mut... | called-by | params 3/3; returns tagged |
| 102 | callback | `assembly.contributions.flatMap::<callback@102:8>` | `liveUniforms` | called-by: Called by Array.prototype.flatMap to transform and flatten one collection value. | called-by | params 1/1; returns tagged |
| 109 | callback | `contribution.uniforms .filter::<callback@109:11>` | `liveUniforms` | called-by: Called by Array.prototype.filter to test whether one collection value is retained. | called-by | params 1/1; returns tagged |
| 116 | callback | `contribution.uniforms .filter( /** * Called by Array.prototype.filter to test whether one collection value is retained. * @param uniform - The uniform value accepted by the operation. * @returns - The callback result returned to its caller. */ (uniform) => Object.hasOwn(bindingValues, uniform.valueKey), ) .map::<callback@116:11>` | `liveUniforms` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 123 | callback | `<anonymous@123:110>` | `_createUniformValueRefresher` | called-by: Called by create uniform value refresher to handle one invocation of the declared ope... | called-by | none |
| 137 | method | `_hasAvailableBindingValue` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to determine whether a prepared required binding has... | called-by | params 2/2; returns tagged |
| 152 | method | `_assemblyUsesValueKey` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to determine whether an accepted assembly references... | called-by | params 2/2; returns tagged |
| 185 | method | `_geometrySceneDepthMax` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to resolve the geometry-owned scene-depth cap fallback. | called-by | params 3/3; returns tagged; throws 1 |
| 202 | callback | `[x, y, z].every::<callback@202:10>` | `_geometrySceneDepthMax` | called-by: Called by Array.prototype.every to test one collection value against the shared condi... | called-by | params 1/1; returns tagged |
| 227 | method | `_runtimeSceneInputCaptureConfig` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to create scene-input capture configuration from set... | called-by | params 2/2; returns tagged; throws 1 |
| 266 | method | `_hasAvailableUniformDefault` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to determine whether a required uniform has an owner... | called-by | params 2/2; returns tagged |
| 291 | method | `_createRuntimeSceneInputBindings` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to create renderer-produced scene input bindings nee... | called-by | params 3/3; returns tagged |
| 358 | method | `_assertRequiredBindingsAvailable` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to require setup values for every required shader bi... | called-by | params 3/3; throws 1 |
| 366 | callback | `runtimeBindings?.bindings.map::<callback@366:10>` | `cacheValueKeys` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 401 | method | `_createUniforms` | `ShaderRuntimeInstaller` | called-by: Called by ShaderRuntimeInstaller to create runtime uniforms from contribution declara... | called-by | params 2/2; returns tagged |
| 432 | method | `install` | `ShaderRuntimeInstaller` | call-this-method: Call this method to install an assembled Algorithm32 shader on a Three composer when ... | active-callable | params 3/3; returns tagged; throws 2 |
| 506 | callback | `prepare` | `install` | called-by: Called by install to prepare. | called-by | params 1/1; returns tagged |
| 507 | callback | `dispose` | `install` | called-by: Called by install to dispose. | called-by | none |
| 518 | callback | `getDiagnostics` | `install` | called-by: Called by install to read diagnostics. | called-by | returns tagged |

## `src/algorithm32/runtime/rendering/three/ShaderRuntimePass.js`

Source: [src/algorithm32/runtime/rendering/three/ShaderRuntimePass.js](../../../../../../src/algorithm32/runtime/rendering/three/ShaderRuntimePass.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 8 | class | `ShaderRuntimePass` | `<module>` | descriptive-other: Composer-compatible fullscreen shader pass owned by ShaderBuilder. | entity/value | none |
| 14 | method | `_fullscreenVertexShader` | `ShaderRuntimePass` | called-by: Called by shader runtime pass to return a fullscreen GLSL3 vertex shader. | called-by | returns tagged |
| 33 | method | `_stripGlslVersion` | `ShaderRuntimePass` | called-by: Called by shader runtime pass to strip a GLSL version directive before passing GLSL3 ... | called-by | params 1/1; returns tagged |
| 43 | field | `enabled` | `ShaderRuntimePass` | descriptive-other: Value that tracks whether the pass participates in composer rendering. | entity/value | none |
| 51 | field | `needsSwap` | `ShaderRuntimePass` | descriptive-other: Value that tracks whether the composer should swap buffers after this pass. | entity/value | none |
| 59 | field | `clear` | `ShaderRuntimePass` | descriptive-other: Value that tracks whether the pass should clear before drawing. | entity/value | none |
| 67 | field | `renderToScreen` | `ShaderRuntimePass` | descriptive-other: Value that tracks whether this pass renders directly to the screen. | entity/value | none |
| 75 | field | `_uniforms` | `ShaderRuntimePass` | descriptive-other: Value that stores runtime uniforms. | entity/value | none |
| 83 | field | `_material` | `ShaderRuntimePass` | descriptive-other: Value that stores the Three shader material. | entity/value | none |
| 91 | field | `_geometry` | `ShaderRuntimePass` | descriptive-other: Value that stores the fullscreen geometry. | entity/value | none |
| 99 | field | `_mesh` | `ShaderRuntimePass` | descriptive-other: Value that stores the fullscreen mesh. | entity/value | none |
| 107 | field | `_scene` | `ShaderRuntimePass` | descriptive-other: Value that stores the internal pass scene. | entity/value | none |
| 115 | field | `_camera` | `ShaderRuntimePass` | descriptive-other: Value that stores the internal pass camera. | entity/value | none |
| 123 | field | `_sourceHash` | `ShaderRuntimePass` | descriptive-other: Value that stores the source hash for diagnostics. | entity/value | none |
| 131 | field | `_logger` | `ShaderRuntimePass` | descriptive-other: Value that stores optional runtime logger. | entity/value | none |
| 139 | field | `_sceneInputCapture` | `ShaderRuntimePass` | descriptive-other: Value that stores optional renderer-produced scene input texture provider. | entity/value | none |
| 147 | field | `_refreshUniformValues` | `ShaderRuntimePass` | descriptive-other: Value that stores the builder-owned live-uniform refresh operation. | entity/value | none |
| 155 | field | `_viewportSize` | `ShaderRuntimePass` | descriptive-other: Value that stores the unit-bearing viewport dimensions. | entity/value | none |
| 163 | field | `_frameCount` | `ShaderRuntimePass` | descriptive-other: Value that tracks render count. | entity/value | none |
| 171 | field | `_renderErrorCount` | `ShaderRuntimePass` | descriptive-other: Value that tracks non-fatal render errors. | entity/value | none |
| 179 | field | `_lastRenderError` | `ShaderRuntimePass` | descriptive-other: Value that stores the last render error message. | entity/value | none |
| 187 | field | `_disposed` | `ShaderRuntimePass` | descriptive-other: Value that tracks whether this pass has been disposed. | entity/value | none |
| 195 | field | `_performanceTimer` | `ShaderRuntimePass` | descriptive-other: Value that stores optional runtime pass performance timer. | entity/value | none |
| 203 | constructor | `<anonymous@203:2>` | `ShaderRuntimePass` | creates: Creates an installed runtime shader pass. | creates | params 1/1 |
| 241 | accessor-get | `material` | `ShaderRuntimePass` | descriptive-other: Value that returns the material owned by the pass. | entity/value | returns tagged |
| 250 | accessor-get | `uniforms` | `ShaderRuntimePass` | descriptive-other: Value that returns the uniforms owned by the pass. | entity/value | returns tagged |
| 261 | method | `prepare` | `ShaderRuntimePass` | call-this-method: Call this method to compile and link the runtime program without blocking the frame l... | active-callable | params 1/1; throws 1; async outcome mentioned |
| 281 | method | `setSize` | `ShaderRuntimePass` | call-this-method: Call this method to react to composer resize notifications. | active-callable | params 2/2 |
| 299 | method | `render` | `ShaderRuntimePass` | call-this-method: Call this method to render the fullscreen shader pass for one composer invocation. | active-callable | params 3/3 |
| 359 | method | `getDiagnostics` | `ShaderRuntimePass` | call-this-method: Call this method to return internal pass diagnostics. Conditional result values are s... | active-callable | returns tagged |
| 376 | method | `dispose` | `ShaderRuntimePass` | call-this-method: Call this method to dispose resources owned by the pass. | active-callable | none |

## `src/algorithm32/transport/Algorithm32Transport.js`

Source: [src/algorithm32/transport/Algorithm32Transport.js](../../../../../../src/algorithm32/transport/Algorithm32Transport.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | class | `Algorithm32Transport` | `<module>` | descriptive-other: Implement the source- and geometry-neutral final-view transport. | entity/value | none |
| 15 | method | `mainRequiredShaderSymbols` | `Algorithm32Transport` | call-this-method: Call this method to return symbols needed by the complete Algorithm32 shader main path. | active-callable | returns tagged |
| 24 | method | `createShaderContribution` | `Algorithm32Transport` | call-this-method: Call this method to create the one cumulative-cache transport contribution. | active-callable | params 1/1; returns tagged |
| 74 | method | `_resolveTransportOptions` | `Algorithm32Transport` | called-by: Called by algorithm32 transport to resolve already-accepted executable options for fi... | called-by | params 1/1; returns tagged |
| 87 | method | `_transportPathSampleHelper` | `Algorithm32Transport` | called-by: Called by algorithm32 transport to build the selected view-path sampling GLSL helper.... | called-by | params 1/1; returns tagged |
| 168 | method | `_cumulativeTransportBlock` | `Algorithm32Transport` | called-by: Called by algorithm32 transport to integrate one already-cumulative local scattering-... | called-by | params 1/1; returns tagged |

## `src/algorithm32/transport/cache/CacheOperations.js`

Source: [src/algorithm32/transport/cache/CacheOperations.js](../../../../../../src/algorithm32/transport/cache/CacheOperations.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 13 | class | `CacheOperations` | `<module>` | descriptive-other: Object that supplies source-independent scatter, transport, and accumulation programs. | entity/value | none |
| 20 | method | `createCacheModule` | `CacheOperations` | call-this-method: Call this method to create cache module. | active-callable | params 1/1; returns tagged |
| 35 | method | `_cacheCoordinate` | `CacheOperations` | called-by: Called by cache operations to emit the exact scalar-field coordinate selected by the ... | called-by | returns tagged |
| 48 | method | `_groundReflectionSource` | `CacheOperations` | called-by: Called by cache operations to add production reflected incoming radiance before phase... | called-by | params 1/1; returns tagged |
| 93 | method | `_directGroundReflectionSource` | `CacheOperations` | called-by: Called by cache operations to emit production direct-source Lambertian ground illumin... | called-by | returns tagged |
| 119 | method | `_indirectGroundReflectionSource` | `CacheOperations` | called-by: Called by cache operations to emit production pure L(k - 2) ground-illumination integ... | called-by | params 1/1; returns tagged |
| 171 | method | `_scatterBlocks` | `CacheOperations` | called-by: Called by cache operations to promote production pure L(k - 1) to the pure Jk scatter... | called-by | params 1/1; returns tagged |
| 235 | method | `_transportBlocks` | `CacheOperations` | called-by: Called by cache operations to promote production geometry-packed pure Jk to the pure ... | called-by | params 1/1; returns tagged |
| 283 | method | `_accumulateBlocks` | `CacheOperations` | called-by: Called by cache operations to copy or add accepted identical-domain J fields into cum... | called-by | params 1/1; returns tagged |
| 290 | callback | `context.inputs.map::<callback@290:8>` | `terms` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 315 | method | `_operationBlocks` | `CacheOperations` | called-by: Called by cache operations to select executable source for one trusted operation cont... | called-by | params 1/1; returns tagged |
| 333 | method | `_operationBindings` | `CacheOperations` | called-by: Called by cache operations to supply compile-time operation options from executable f... | called-by | params 1/1; returns tagged |
| 357 | method | `_operationRequirements` | `CacheOperations` | called-by: Called by cache operations to add reflective dependencies only when the plan selected... | called-by | params 1/1; returns tagged |

## `src/algorithm32/transport/cache/consts.js`

Source: [src/algorithm32/transport/cache/consts.js](../../../../../../src/algorithm32/transport/cache/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | constant | `CACHE_OPERATION_REQUIREMENTS` | `<module>` | descriptive-other: Value that declares the base owner symbols required by each cache operation. | entity/value | none |
| 28 | constant | `REFLECTIVE_SCATTER_REQUIREMENTS` | `<module>` | descriptive-other: Value that declares the additional capabilities used only by reflective scatter. | entity/value | none |
| 37 | constant | `CACHE_GROUND_CONSTRUCTION_POSITION_TAP_COUNT` | `<module>` | descriptive-other: Fix the geometry-to-reflective-scatter construction-position stencil width. | entity/value | none |

## `src/algorithm32/transport/consts.js`

Source: [src/algorithm32/transport/consts.js](../../../../../../src/algorithm32/transport/consts.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `ALGORITHM32_PRODUCTION_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Value that identifies the selected production later-order scattering implementation. | entity/value | none |
| 6 | constant | `ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY` | `<module>` | descriptive-other: Value that identifies fields constructed by the selected production transport impleme... | entity/value | none |
| 10 | constant | `ALGORITHM32_TRANSPORT_MAIN_SYMBOLS` | `<module>` | descriptive-other: Name the complete final-view Algorithm32 shader main dependency set. | entity/value | none |
| 22 | constant | `TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME` | `<module>` | descriptive-other: Name the runtime path-interval uniform and its owner-facing value key. | entity/value | none |
| 24 | constant | `TRANSPORT_PATH_INTERVAL_COUNT_VALUE_KEY` | `<module>` | descriptive-other: Transport path interval count value key constant. | entity/value | none |

## `src/algorithm32/transport/later-order-scattering-density.js`

Source: [src/algorithm32/transport/later-order-scattering-density.js](../../../../../../src/algorithm32/transport/later-order-scattering-density.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 26 | function | `resolvePhysicalIncomingDirections` | `<module>` | called-by: Called by the physical recurrence to resolve every incoming-domain vector independent... | called-by | params 4/4; returns tagged |
| 34 | callback | `Array.from::<callback@34:7>` | `resolvePhysicalIncomingDirections` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 57 | function | `readIncomingRadianceAtPosition` | `<module>` | called-by: Called by the physical recurrence to read the production exact-node incoming L spectr... | called-by | params 4/4; returns tagged |
| 65 | callback | `Array.from::<callback@65:7>` | `readIncomingRadianceAtPosition` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 87 | function | `buildPhysicalScatteringOrder` | `<module>` | called-by: Called by the returned scattering-order kernel to execute one accepted physical pure-... | called-by | params 2/2 |
| 185 | function | `createPhysicalLaterOrderScatteringKernel` | `<module>` | call-this-method: Call this function to create a fresh synchronous selected-production physical `L(k - ... | active-callable | params 1/1; returns tagged |
| 194 | method | `buildPureScatteringOrder` | `createPhysicalLaterOrderScatteringKernel` | call-this-method: Call this method to build one physical pure-scattering order synchronously. | active-callable | params 1/1 |

## `src/algorithm32/transport/scattering-density-transport.js`

Source: [src/algorithm32/transport/scattering-density-transport.js](../../../../../../src/algorithm32/transport/scattering-density-transport.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 25 | function | `sampleScatteringDensity` | `<module>` | called-by: Called by this module to sample one spectrum through position-major, direction-minor ... | called-by | params 4/4; returns tagged |
| 64 | function | `integrateScatteringDensityAlongPath` | `<module>` | called-by: Called by this module to integrate stored pure scattering density along one geometry-... | called-by | params 9/9; returns tagged |
| 132 | function | `transportPureScatteringDensity` | `<module>` | call-this-method: Call this function to transport one sealed pure stored scattering-density field `Jk` ... | active-callable | params 1/1; returns tagged; throws 2 |

## `src/algorithm32/transport/ScatteringOrderFieldOperations.js`

Source: [src/algorithm32/transport/ScatteringOrderFieldOperations.js](../../../../../../src/algorithm32/transport/ScatteringOrderFieldOperations.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 9 | function | `assertSealedField` | `<module>` | called-by: Called by this module to require an input field to be sealed before it can be consumed. | called-by | params 2/2; throws 1 |
| 23 | function | `assertMutableField` | `<module>` | called-by: Called by this module to require a field to remain mutable while it is an output target. | called-by | params 2/2; throws 1 |
| 37 | function | `createRevocableWriter` | `<module>` | called-by: Called by this module to limit a writer capability to a caller-controlled lifetime. R... | called-by | params 1/1; returns tagged |
| 46 | function | `assertActive` | `createRevocableWriter` | called-by: Called by the revocable writer methods to reject use after revocation. | called-by | throws 1 |
| 60 | function | `writeScalar` | `createRevocableWriter` | called-by: Called by a scattering-order kernel to write one scalar through the active coordinate... | called-by | params 2/2 |
| 73 | function | `writeScalarAtOffset` | `createRevocableWriter` | called-by: Called by a scattering-order kernel to write one scalar through the active dense offs... | called-by | params 2/2 |
| 85 | function | `fill` | `createRevocableWriter` | called-by: Called by a scattering-order kernel to fill the active output field with one scalar. | called-by | params 1/1 |
| 96 | function | `revoke` | `createRevocableWriter` | called-by: Called by field orchestration to revoke every subsequent write through this capability. | called-by | none |
| 122 | function | `zeroMutableField` | `<module>` | called-by: Called by this module to restore a mutable output to deterministic zero after a faile... | called-by | params 2/2 |
| 137 | function | `buildNextScatteringOrder` | `<module>` | called-by: Called by this module to build one pure scattering-density order from the preceding p... | called-by | params 1/1; returns tagged; throws 2 |
| 176 | callback | `Promise.resolve(result).catch::<callback@176:9>` | `buildNextScatteringOrder` | called-by: Called by the promise rejection handler to handle one callback invocation. | called-by | returns tagged |
| 199 | function | `accumulatePureScatteringFields` | `<module>` | called-by: Called by this module to sum contiguous sealed pure scattering-density orders into on... | called-by | params 1/1; returns tagged; throws 3 |
| 213 | callback | `request.pureFields.map::<callback@213:8>` | `pureFields` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged; throws 1 |
| 232 | callback | `pureFields.map::<callback@232:8>` | `readers` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 257 | constant | `ScatteringOrderFieldOperations` | `<module>` | descriptive-other: Scattering-order field lifecycle, rollback, build, and accumulation operations. | entity/value | none |

## `src/algorithm32/transport/spectral/SpectralCalculator.js`

Source: [src/algorithm32/transport/spectral/SpectralCalculator.js](../../../../../../src/algorithm32/transport/spectral/SpectralCalculator.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 11 | class | `SpectralCalculator` | `<module>` | descriptive-other: Object that owns reusable spectral calculations shared by reference evaluation and so... | entity/value | none |
| 20 | method | `_calculatorProvenance` | `SpectralCalculator` | called-by: Called by SpectralCalculator to create deterministic provenance for one result. | called-by | params 3/3; returns tagged |
| 32 | method | `_acceptInverseSolidAngle` | `SpectralCalculator` | called-by: Called by SpectralCalculator to accept one inverse-solid-angle value without conversion. | called-by | params 2/2; returns tagged; throws 1 |
| 51 | method | `_zeroSpectralValues` | `SpectralCalculator` | called-by: Called by SpectralCalculator to create zero-valued binary64 working storage. This imp... | called-by | params 1/1; returns tagged |
| 61 | method | `_oneSpectralValues` | `SpectralCalculator` | called-by: Called by SpectralCalculator to create unit-valued binary64 working storage. | called-by | params 1/1; returns tagged |
| 71 | method | `_sourceTransmittanceValues` | `SpectralCalculator` | called-by: Called by SpectralCalculator to convert finite optical depth to transmittance. | called-by | params 1/1; returns tagged |
| 78 | callback | `Float64Array.from::<callback@78:8>` | `_sourceTransmittanceValues` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 1/1; returns tagged |
| 90 | method | `_trapezoidSegmentTransmittanceValues` | `SpectralCalculator` | called-by: Called by SpectralCalculator to compute trapezoid transmittance over one meter segment. | called-by | params 3/3; returns tagged |
| 98 | callback | `Float64Array.from::<callback@98:8>` | `_trapezoidSegmentTransmittanceValues` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 112 | method | `_phaseWeightedScatteringValues` | `SpectralCalculator` | called-by: Called by SpectralCalculator to combine scattering coefficients with phase values. | called-by | params 4/4; returns tagged |
| 125 | callback | `Float64Array.from::<callback@125:8>` | `_phaseWeightedScatteringValues` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 140 | method | `_directInScatteringValues` | `SpectralCalculator` | called-by: Called by SpectralCalculator to compute direct in-scattering over one meter path meas... | called-by | params 5/5; returns tagged |
| 154 | callback | `Float64Array.from::<callback@154:8>` | `_directInScatteringValues` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 170 | method | `_accumulateSpectralValues` | `SpectralCalculator` | called-by: Called by SpectralCalculator to accumulate one spectrum into working storage. | called-by | params 2/2 |
| 183 | constructor | `<anonymous@183:2>` | `SpectralCalculator` | creates: Creates a spectral calculator from stable calculation collaborators. | creates | params 1/1 |
| 192 | accessor-get | `dependencies` | `SpectralCalculator` | descriptive-other: Value that returns the stable calculation dependencies. | entity/value | returns tagged |
| 205 | method | `_acceptPacket` | `SpectralCalculator` | called-by: Called by spectral calculator to accept one packet with an exact interpretation and b... | called-by | params 4/4; returns tagged |
| 217 | method | `buildEndpointTrapezoidPathIntegrationPoints` | `SpectralCalculator` | call-this-method: Call this method to build endpoint/trapezoid integration points for a geometry-resolv... | active-callable | params 2/2; returns tagged; throws 1 |
| 250 | method | `computeSourceTransmittance` | `SpectralCalculator` | call-this-method: Call this method to compute source-path transmittance from finite source optical depth. | active-callable | params 1/1; returns tagged |
| 278 | method | `computeTrapezoidSegmentTransmittance` | `SpectralCalculator` | call-this-method: Call this method to compute endpoint/trapezoid transmittance for one view-path segment. | active-callable | params 3/3; returns tagged |
| 331 | method | `computeDirectScattering` | `SpectralCalculator` | call-this-method: Call this method to combine Rayleigh and Mie scattering coefficients with phase values. | active-callable | params 4/4; returns tagged |
| 386 | method | `computeDirectInScattering` | `SpectralCalculator` | call-this-method: Call this method to compute direct light-source in-scattering for one path point. | active-callable | params 5/5; returns tagged |
| 460 | method | `computeDirectRadiance` | `SpectralCalculator` | call-this-method: Call this method to compute source-owned direct-primary radiance for cache constructi... | active-callable | params 2/2; returns tagged |
| 577 | method | `computeRadiance` | `SpectralCalculator` | call-this-method: Call this method to integrate one cumulative local scattering-density cache along a g... | active-callable | params 3/3; returns tagged |

## `src/algorithm32/utils/identity/CanonicalValueHash.js`

Source: [src/algorithm32/utils/identity/CanonicalValueHash.js](../../../../../../src/algorithm32/utils/identity/CanonicalValueHash.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 9 | function | `serializeCanonicalValue` | `<module>` | called-by: Called by this module to serialize one value for canonical content identity. It retur... | called-by | params 1/1; returns tagged |
| 17 | callback | `Array.from::<callback@17:8>` | `serializeCanonicalValue` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 1/1; returns tagged |
| 30 | callback | `Object.keys(source) .sort() .map::<callback@30:9>` | `serializeCanonicalValue` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 46 | function | `rotateRight` | `<module>` | called-by: Called by this module to rotate one unsigned 32-bit word right. | called-by | params 2/2; returns tagged |
| 57 | function | `sha256Value` | `<module>` | called-by: Called by this module to compute a synchronous browser-safe SHA-256 identity for cano... | called-by | params 1/1; returns tagged |
| 124 | callback | `Array.from::<callback@124:7>` | `sha256Value` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 1/1; returns tagged |
| 129 | constant | `SHA256_CONSTANTS` | `<module>` | descriptive-other: SHA-256 round constants in algorithm-defined order. | entity/value | none |
| 141 | constant | `CanonicalValueHash` | `<module>` | descriptive-other: Canonical value serialization and synchronous SHA-256 identity methods. | entity/value | none |

## `src/algorithm32/utils/identity/StableValueHash.js`

Source: [src/algorithm32/utils/identity/StableValueHash.js](../../../../../../src/algorithm32/utils/identity/StableValueHash.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 9 | function | `serializeStableValue` | `<module>` | called-by: Called by this module to serialize one value with cycle-aware stable ordering. It ret... | called-by | params 2/2; returns tagged; throws 1 |
| 55 | callback | `value .map::<callback@55:9>` | `serializeStableValue` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 76 | callback | `viewEntries .map::<callback@76:9>` | `serializeStableValue` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 98 | callback | `Object.keys(value) .sort() .map::<callback@98:8>` | `entries` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 113 | function | `stableStringify` | `<module>` | called-by: Called by this module to serialize a value with sorted object keys and stable typed-a... | called-by | params 1/1; returns tagged |
| 124 | function | `stableHash` | `<module>` | called-by: Called by this module to create a deterministic browser-safe FNV-1a identity for shad... | called-by | params 1/1; returns tagged |
| 137 | constant | `StableValueHash` | `<module>` | descriptive-other: Cycle-aware stable serialization and FNV-1a identity methods. | entity/value | none |

## `src/algorithm32/utils/math/AngleMath.js`

Source: [src/algorithm32/utils/math/AngleMath.js](../../../../../../src/algorithm32/utils/math/AngleMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `DEGREES_TO_RADIANS` | `<module>` | descriptive-other: Degrees to radians constant. | entity/value | none |
| 6 | constant | `RADIANS_TO_DEGREES` | `<module>` | descriptive-other: Radians to degrees constant. | entity/value | none |
| 8 | constant | `DEGREES` | `<module>` | descriptive-other: Degrees constant. | entity/value | none |
| 10 | constant | `RADIANS` | `<module>` | descriptive-other: Radians constant. | entity/value | none |
| 18 | function | `inDegrees` | `<module>` | called-by: Called by this module to create an angle packet in degrees. | called-by | params 1/1; returns tagged |
| 31 | function | `inRadians` | `<module>` | called-by: Called by this module to create an angle packet in radians. | called-by | params 1/1; returns tagged |
| 44 | function | `toRadians` | `<module>` | called-by: Called by this module to return an angle packet value in radians. It returns the valu... | called-by | params 1/1; returns tagged |
| 58 | function | `toDegrees` | `<module>` | called-by: Called by this module to return an angle packet value in degrees. It returns the valu... | called-by | params 1/1; returns tagged |
| 73 | function | `add` | `<module>` | called-by: Called by this module to add two angle packets and return the result in the left pack... | called-by | params 2/2; returns tagged |
| 87 | function | `subtract` | `<module>` | called-by: Called by this module to subtract one angle packet from another and return the result... | called-by | params 2/2; returns tagged |
| 101 | function | `scale` | `<module>` | called-by: Called by this module to scale an angle packet by a scalar factor. | called-by | params 2/2; returns tagged |
| 116 | function | `assertAngle` | `<module>` | called-by: Called by this module to assert that an angle packet uses the production angle unit c... | called-by | params 2/2; throws 1 |
| 138 | function | `wrapRadians` | `<module>` | called-by: Called by this module to wrap an angle in radians. | called-by | params 2/2; returns tagged |
| 149 | function | `wrapDegrees` | `<module>` | called-by: Called by this module to wrap an angle in degrees. | called-by | params 2/2; returns tagged |

## `src/algorithm32/utils/math/ArrayMath.js`

Source: [src/algorithm32/utils/math/ArrayMath.js](../../../../../../src/algorithm32/utils/math/ArrayMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | function | `zeros` | `<module>` | called-by: Called by this module to create a fixed-length numeric array filled with zero. | called-by | params 1/1; returns tagged |
| 13 | callback | `Array.from::<callback@13:7>` | `zeros` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 24 | function | `fill` | `<module>` | called-by: Called by this module to create a fixed-length numeric array filled with one value. | called-by | params 2/2; returns tagged |
| 30 | callback | `Array.from::<callback@30:7>` | `fill` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 41 | function | `add` | `<module>` | called-by: Called by this module to add two numeric arrays element by element. | called-by | params 2/2; returns tagged |
| 48 | callback | `left.map::<callback@48:7>` | `add` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 59 | function | `multiply` | `<module>` | called-by: Called by this module to multiply two numeric arrays element by element. | called-by | params 2/2; returns tagged |
| 66 | callback | `left.map::<callback@66:7>` | `multiply` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 78 | function | `multiplyToFloat64` | `<module>` | called-by: Called by this module to multiply two array-like numeric values into binary64 storage... | called-by | params 2/2; returns tagged |
| 86 | callback | `Float64Array.from::<callback@86:7>` | `multiplyToFloat64` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | params 2/2; returns tagged |
| 96 | function | `mean` | `<module>` | called-by: Called by this module to compute the arithmetic mean of numeric array values. It retu... | called-by | params 1/1; returns tagged |
| 108 | callback | `values.reduce::<callback@108:8>` | `mean` | called-by: Called by Array.prototype.reduce to accumulate one collection value. | called-by | params 2/2; returns tagged |
| 121 | function | `weightedSum` | `<module>` | called-by: Called by this module to compute the weighted sum of numeric array values. | called-by | params 2/2; returns tagged |
| 129 | callback | `values.reduce::<callback@129:7>` | `weightedSum` | called-by: Called by Array.prototype.reduce to accumulate one collection value. | called-by | params 3/3; returns tagged |
| 141 | function | `map` | `<module>` | called-by: Called by this module to map numeric array values into a new array. | called-by | params 2/2; returns tagged |

## `src/algorithm32/utils/math/DistanceMath.js`

Source: [src/algorithm32/utils/math/DistanceMath.js](../../../../../../src/algorithm32/utils/math/DistanceMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `METERS_PER_KILOMETER` | `<module>` | descriptive-other: Meters per kilometer constant. | entity/value | none |
| 4 | constant | `METERS` | `<module>` | descriptive-other: Meters constant. | entity/value | none |
| 6 | constant | `KILOMETERS` | `<module>` | descriptive-other: Kilometers constant. | entity/value | none |
| 14 | function | `inKilometers` | `<module>` | called-by: Called by this module to create a distance packet in kilometers. | called-by | params 1/1; returns tagged |
| 27 | function | `inMeters` | `<module>` | called-by: Called by this module to create a distance packet in meters. | called-by | params 1/1; returns tagged |
| 40 | function | `toMeters` | `<module>` | called-by: Called by this module to return a distance packet value in meters. It returns the val... | called-by | params 1/1; returns tagged |
| 54 | function | `toKilometers` | `<module>` | called-by: Called by this module to return a distance packet value in kilometers. It returns the... | called-by | params 1/1; returns tagged |
| 69 | function | `add` | `<module>` | called-by: Called by this module to add two distance packets and return the result in the left p... | called-by | params 2/2; returns tagged |
| 83 | function | `subtract` | `<module>` | called-by: Called by this module to subtract one distance packet from another and return the res... | called-by | params 2/2; returns tagged |
| 97 | function | `scale` | `<module>` | called-by: Called by this module to scale a distance packet by a scalar factor. | called-by | params 2/2; returns tagged |
| 112 | function | `assertDistance` | `<module>` | called-by: Called by this module to assert that a distance packet uses the production distance u... | called-by | params 2/2; throws 1 |
| 135 | function | `assertDistanceSeries` | `<module>` | called-by: Called by this module to assert one ordered distance series at a system boundary. | called-by | params 2/2; throws 1 |
| 155 | callback | `candidate.values.some::<callback@155:8>` | `assertDistanceSeries` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 1/1; returns tagged |
| 170 | function | `assertPosition` | `<module>` | called-by: Called by this module to assert one physical position at a system boundary. | called-by | params 2/2; throws 1 |
| 190 | callback | `candidate.coordinates.some::<callback@190:8>` | `assertPosition` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 1/1; returns tagged |
| 203 | function | `toMetersSeries` | `<module>` | called-by: Called by this module to normalize an accepted distance series to local meter scalars. | called-by | params 1/1; returns tagged |
| 210 | callback | `series.values.map::<callback@210:7>` | `toMetersSeries` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 220 | function | `toMetersPosition` | `<module>` | called-by: Called by this module to normalize an accepted physical position to local meter scalars. | called-by | params 1/1; returns tagged |
| 233 | function | `acceptPositionInMeters` | `<module>` | called-by: Called by this module to accept a physical position and normalize its coordinates to ... | called-by | params 2/2; returns tagged |
| 245 | function | `positionInMeters` | `<module>` | called-by: Called by this module to create a physical position from meter coordinates. | called-by | params 1/1; returns tagged |
| 258 | function | `positiveMetersOrDefault` | `<module>` | called-by: Called by this module to resolve a positive physical distance in meters with an omiss... | called-by | params 3/3; returns tagged; throws 1 |
| 280 | function | `optionalMeters` | `<module>` | called-by: Called by this module to normalize an optional physical distance to meters. It return... | called-by | params 2/2; returns tagged |
| 298 | function | `positionAlongRay` | `<module>` | called-by: Called by this module to resolve a unit-bearing position along one physical ray while... | called-by | params 3/3; returns tagged |

## `src/algorithm32/utils/math/index.js`

Source: [src/algorithm32/utils/math/index.js](../../../../../../src/algorithm32/utils/math/index.js)

No independently documentable declaration or callable target; this is a re-export-only barrel.

## `src/algorithm32/utils/math/PixelMath.js`

Source: [src/algorithm32/utils/math/PixelMath.js](../../../../../../src/algorithm32/utils/math/PixelMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `PIXEL_UNITS` | `<module>` | descriptive-other: Pixel units constant. | entity/value | none |
| 5 | constant | `PixelMath` | `<module>` | descriptive-other: Pixel size, distance, defaulting, viewport, and shader-value methods. | entity/value | none |
| 14 | method | `assertPositivePixelCount` | `PixelMath` | call-this-method: Call this method to assert one positive integral pixel count. | active-callable | params 2/2; throws 1 |
| 28 | method | `acceptPixelSize` | `PixelMath` | call-this-method: Call this method to accept one exact unit-bearing pixel-size packet at a production b... | active-callable | params 2/2; returns tagged; throws 1 |
| 62 | method | `createPixelSize` | `PixelMath` | call-this-method: Call this method to convert a required renderer width/height pair into a fresh canoni... | active-callable | params 3/3; returns tagged |
| 81 | method | `sizeOrDefault` | `PixelMath` | call-this-method: Call this method to accept a pixel-size packet while defaulting only an omitted value... | active-callable | params 3/3; returns tagged |
| 91 | method | `pixelSizeToShaderValue` | `PixelMath` | call-this-method: Call this method to normalize an accepted pixel size to the numeric GLSL vec2 shape. | active-callable | params 1/1; returns tagged |
| 103 | method | `acceptPixelDistance` | `PixelMath` | call-this-method: Call this method to accept one exact non-negative pixel-distance packet. | active-callable | params 2/2; returns tagged; throws 1 |
| 136 | method | `createPixelDistance` | `PixelMath` | call-this-method: Call this method to create a fresh scalar pixel-distance packet from a normalized loc... | active-callable | params 2/2; returns tagged |
| 148 | method | `distanceOrDefault` | `PixelMath` | call-this-method: Call this method to accept a pixel-distance packet while defaulting only an omitted v... | active-callable | params 3/3; returns tagged |
| 160 | method | `viewportCountOrDefault` | `PixelMath` | call-this-method: Call this method to normalize one optional positive viewport dimension. It returns th... | active-callable | params 2/2; returns tagged; throws 1 |

## `src/algorithm32/utils/math/SampleMath.js`

Source: [src/algorithm32/utils/math/SampleMath.js](../../../../../../src/algorithm32/utils/math/SampleMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 11 | function | `nearestSampleIndex` | `<module>` | called-by: Called by this module to find the nearest sample index in an ordered numeric sample a... | called-by | params 3/3; returns tagged |
| 47 | function | `padSamples` | `<module>` | called-by: Called by this module to return samples padded before and after with one value. | called-by | params 2/2; returns tagged |
| 58 | callback | `Array.from::<callback@58:8>` | `padSamples` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 66 | callback | `Array.from::<callback@66:8>` | `padSamples` | called-by: Called by the surrounding operation to handle one callback invocation. | called-by | returns tagged |
| 78 | function | `isMonotonic` | `<module>` | called-by: Called by this module to check whether samples are monotonic in one direction. | called-by | params 2/2; returns tagged |
| 108 | function | `walkSamples` | `<module>` | called-by: Called by this module to return sample/index pairs in traversal order. | called-by | params 2/2; returns tagged |
| 116 | callback | `samples.map::<callback@116:7>` | `indexes` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 128 | callback | `indexes.map::<callback@128:7>` | `walkSamples` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 143 | function | `sampleSignature` | `<module>` | called-by: Called by this module to create a deterministic signature for an ordered numeric samp... | called-by | params 2/2; returns tagged |
| 153 | callback | `samples .map::<callback@153:8>` | `sampleSignature` | called-by: Called by Array.prototype.map to transform one collection value. Conditional result v... | called-by | params 1/1; returns tagged |

## `src/algorithm32/utils/math/ScalarMath.js`

Source: [src/algorithm32/utils/math/ScalarMath.js](../../../../../../src/algorithm32/utils/math/ScalarMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 7 | function | `isFiniteNumber` | `<module>` | called-by: Called by this module to check whether a value is a finite number. | called-by | params 1/1; returns tagged |
| 19 | function | `clamp` | `<module>` | called-by: Called by this module to clamp a number to an inclusive range. | called-by | params 3/3; returns tagged |
| 32 | function | `wrap` | `<module>` | called-by: Called by this module to wrap a value into the half-open range [min, max). | called-by | params 3/3; returns tagged |
| 47 | function | `inRange` | `<module>` | called-by: Called by this module to check whether a number is inside a range. | called-by | params 4/4; returns tagged |
| 65 | function | `nearlyEqual` | `<module>` | called-by: Called by this module to check whether two numbers are equal within a tolerance. | called-by | params 3/3; returns tagged |
| 79 | function | `lerp` | `<module>` | called-by: Called by this module to linearly interpolate between two values. | called-by | params 3/3; returns tagged |
| 91 | function | `formatNumber` | `<module>` | called-by: Called by this module to format a number using deterministic precision and trimming o... | called-by | params 2/2; returns tagged |

## `src/algorithm32/utils/math/SceneMath.js`

Source: [src/algorithm32/utils/math/SceneMath.js](../../../../../../src/algorithm32/utils/math/SceneMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 4 | constant | `SCENE_UNITS` | `<module>` | descriptive-other: Scene units constant. | entity/value | none |
| 6 | constant | `METERS_PER_SCENE_UNIT` | `<module>` | descriptive-other: Meters per scene unit constant. | entity/value | none |
| 14 | function | `inSceneUnits` | `<module>` | called-by: Called by this module to create one scene-distance packet from a local scene scalar. | called-by | params 1/1; returns tagged |
| 24 | function | `positionInSceneUnits` | `<module>` | called-by: Called by this module to create one scene-position packet from local scene coordinates. | called-by | params 1/1; returns tagged |
| 34 | function | `scaleInMetersPerSceneUnit` | `<module>` | called-by: Called by this module to create one scene-scale packet. | called-by | params 1/1; returns tagged |
| 46 | function | `assertSceneDistance` | `<module>` | called-by: Called by this module to assert one scene distance at a system boundary. | called-by | params 2/2; throws 1 |
| 65 | function | `assertScenePosition` | `<module>` | called-by: Called by this module to assert one scene position at a system boundary. | called-by | params 2/2; throws 1 |
| 80 | callback | `candidate.coordinates.some::<callback@80:8>` | `assertScenePosition` | called-by: Called by Array.prototype.some to test one collection value for a matching condition. | called-by | params 1/1; returns tagged |
| 95 | function | `assertSceneScale` | `<module>` | called-by: Called by this module to assert one scene scale at a system boundary. | called-by | params 2/2; throws 1 |
| 117 | function | `toMeters` | `<module>` | called-by: Called by this module to normalize an accepted scene distance to a local meter scalar. | called-by | params 2/2; returns tagged |
| 128 | function | `toMetersPosition` | `<module>` | called-by: Called by this module to normalize an accepted scene position to local meter coordina... | called-by | params 2/2; returns tagged |
| 143 | function | `toSceneUnits` | `<module>` | called-by: Called by this module to normalize an accepted physical distance to a local scene sca... | called-by | params 2/2; returns tagged |
| 154 | function | `toScenePosition` | `<module>` | called-by: Called by this module to normalize an accepted physical position to local scene coord... | called-by | params 2/2; returns tagged |
| 166 | function | `scaleFromRequest` | `<module>` | called-by: Called by this module to resolve and validate a scene scale from a request. | called-by | params 1/1; returns tagged |
| 182 | function | `positionOrDefault` | `<module>` | called-by: Called by this module to accept an optional scene position with an omission default. | called-by | params 4/4; returns tagged |
| 200 | function | `distanceOrDefault` | `<module>` | called-by: Called by this module to accept an optional scene distance with an omission default. | called-by | params 4/4; returns tagged |

## `src/algorithm32/utils/math/VectorMath.js`

Source: [src/algorithm32/utils/math/VectorMath.js](../../../../../../src/algorithm32/utils/math/VectorMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | function | `filled` | `<module>` | called-by: Called by this module to create a numeric vector filled with one value. | called-by | params 2/2; returns tagged |
| 20 | function | `zero` | `<module>` | called-by: Called by this module to create a numeric vector filled with zeroes. | called-by | params 1/1; returns tagged |
| 30 | function | `ones` | `<module>` | called-by: Called by this module to create a numeric vector filled with ones. | called-by | params 1/1; returns tagged |
| 43 | function | `add` | `<module>` | called-by: Called by this module to add two numeric vectors. | called-by | params 2/2; returns tagged |
| 56 | function | `subtract` | `<module>` | called-by: Called by this module to subtract one numeric vector from another. | called-by | params 2/2; returns tagged |
| 63 | callback | `left.map::<callback@63:7>` | `subtract` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 75 | function | `scale` | `<module>` | called-by: Called by this module to scale a numeric vector. | called-by | params 2/2; returns tagged |
| 81 | callback | `vector.map::<callback@81:7>` | `scale` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 1/1; returns tagged |
| 95 | function | `addScaled` | `<module>` | called-by: Called by this module to add a scaled vector to another vector. | called-by | params 3/3; returns tagged |
| 102 | callback | `base.map::<callback@102:7>` | `addScaled` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | params 2/2; returns tagged |
| 115 | function | `dot` | `<module>` | called-by: Called by this module to compute the dot product of two numeric vectors. | called-by | params 2/2; returns tagged |
| 123 | callback | `left.reduce::<callback@123:7>` | `dot` | called-by: Called by Array.prototype.reduce to accumulate one collection value. | called-by | params 3/3; returns tagged |
| 137 | function | `cross` | `<module>` | called-by: Called by this module to compute the cross product of two 3D tuples. | called-by | params 2/2; returns tagged |
| 152 | function | `length` | `<module>` | called-by: Called by this module to compute the Euclidean norm of a numeric vector. | called-by | params 1/1; returns tagged |
| 165 | function | `distance` | `<module>` | called-by: Called by this module to compute the Euclidean distance between two numeric vectors. | called-by | params 2/2; returns tagged |
| 179 | function | `normalize` | `<module>` | called-by: Called by this module to normalize a numeric vector. It returns the value from the fi... | called-by | params 2/2; returns tagged |
| 188 | callback | `vector.map::<callback@188:8>` | `normalize` | called-by: Called by Array.prototype.map to transform one collection value. | called-by | returns tagged |
| 202 | function | `isFiniteVector` | `<module>` | called-by: Called by this module to check whether every vector value is finite. | called-by | params 1/1; returns tagged |
| 214 | function | `isNormalized` | `<module>` | called-by: Called by this module to check whether a vector has unit length within tolerance. | called-by | params 2/2; returns tagged |

## `src/algorithm32/utils/math/WavelengthMath.js`

Source: [src/algorithm32/utils/math/WavelengthMath.js](../../../../../../src/algorithm32/utils/math/WavelengthMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | constant | `NANOMETERS_PER_MICROMETER` | `<module>` | descriptive-other: Nanometers per micrometer constant. | entity/value | none |
| 4 | constant | `NANOMETERS` | `<module>` | descriptive-other: Nanometers constant. | entity/value | none |
| 6 | constant | `MICROMETERS` | `<module>` | descriptive-other: Micrometers constant. | entity/value | none |
| 14 | function | `inMicrometers` | `<module>` | called-by: Called by this module to create a wavelength packet in micrometers. | called-by | params 1/1; returns tagged |
| 27 | function | `inNanometers` | `<module>` | called-by: Called by this module to create a wavelength packet in nanometers. | called-by | params 1/1; returns tagged |
| 40 | function | `toNanometers` | `<module>` | called-by: Called by this module to return a wavelength packet value in nanometers. It returns t... | called-by | params 1/1; returns tagged |
| 54 | function | `toMicrometers` | `<module>` | called-by: Called by this module to return a wavelength packet value in micrometers. It returns ... | called-by | params 1/1; returns tagged |
| 69 | function | `add` | `<module>` | called-by: Called by this module to add two wavelength packets and return the result in the left... | called-by | params 2/2; returns tagged |
| 83 | function | `subtract` | `<module>` | called-by: Called by this module to subtract one wavelength packet from another and return the r... | called-by | params 2/2; returns tagged |
| 97 | function | `scale` | `<module>` | called-by: Called by this module to scale a wavelength packet by a scalar factor. | called-by | params 2/2; returns tagged |
| 112 | function | `assertWavelength` | `<module>` | called-by: Called by this module to assert that a wavelength packet uses the production waveleng... | called-by | params 2/2; throws 1 |

## `src/algorithm32/utils/time/TimeMath.js`

Source: [src/algorithm32/utils/time/TimeMath.js](../../../../../../src/algorithm32/utils/time/TimeMath.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 8 | function | `durationInSeconds` | `<module>` | called-by: Called by this module to create one duration packet from seconds. | called-by | params 1/1; returns tagged |
| 19 | function | `durationFromMilliseconds` | `<module>` | called-by: Called by this module to convert milliseconds into a duration packet. | called-by | params 1/1; returns tagged |
| 30 | function | `durationFromNanoseconds` | `<module>` | called-by: Called by this module to convert nanoseconds into a duration packet. | called-by | params 1/1; returns tagged |
| 40 | function | `nowMilliseconds` | `<module>` | called-by: Called by this module to read a monotonic millisecond clock when available, with epoc... | called-by | returns tagged |
| 45 | constant | `TimeMath` | `<module>` | descriptive-other: Time conversion and clock methods. | entity/value | none |

## `src/algorithm32/utils/validation/ValueValidation.js`

Source: [src/algorithm32/utils/validation/ValueValidation.js](../../../../../../src/algorithm32/utils/validation/ValueValidation.js)

| Line | Kind | Symbol | Container | Current documentation | Required form | Contract inventory |
| ---: | --- | --- | --- | --- | --- | --- |
| 9 | function | `isTypedArray` | `<module>` | called-by: Called by this module to test whether a value is an accepted typed array. | called-by | params 1/1; returns tagged |
| 22 | function | `finiteNumberOrDefault` | `<module>` | called-by: Called by this module to resolve an optional finite number at a request boundary. It ... | called-by | params 3/3; returns tagged; throws 1 |
| 42 | function | `requiredString` | `<module>` | called-by: Called by this module to accept a non-empty string. | called-by | params 2/2; returns tagged; throws 1 |
| 58 | function | `positiveInteger` | `<module>` | called-by: Called by this module to accept a positive safe integer. | called-by | params 2/2; returns tagged; throws 1 |
| 75 | function | `booleanOrDefault` | `<module>` | called-by: Called by this module to resolve a boolean with a default used only for omission. It ... | called-by | params 3/3; returns tagged; throws 1 |
| 96 | function | `stringOrDefault` | `<module>` | called-by: Called by this module to resolve a nonempty string with an omission default. | called-by | params 3/3; returns tagged; throws 1 |
| 113 | function | `optionalString` | `<module>` | called-by: Called by this module to resolve an optional nonempty string without treating null as... | called-by | params 2/2; returns tagged |
| 130 | function | `positiveIntegerOrDefault` | `<module>` | called-by: Called by this module to resolve a positive safe integer with an omission default. | called-by | params 3/3; returns tagged; throws 1 |
| 148 | function | `requiredStringOrDefault` | `<module>` | called-by: Called by this module to accept a non-empty string with an omission default. Conditio... | called-by | params 3/3; returns tagged |
| 153 | constant | `ValueValidation` | `<module>` | descriptive-other: General scalar and structural value validation operations. | entity/value | none |

