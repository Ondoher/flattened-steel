import {ShaderContributions} from '../shader-assembly/base/ShaderContributions.js';
import {CelestialScreenPaletteConsumerShaderContribution} from '../celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js';
import {EMPTY_SHADER_BUILD_CONTEXT} from './consts.js';

/**
 * Deterministic shader-assembly preparation for the configured Algorithm32 model.
 */
export class ShaderAssemblyPreparer {
	/**
	 * Facade-owned shared model consumed during shader preparation.
	 *
	 * @type {SharedModel}
	 */
	_model;

	/**
	 * Generic shader assembler used to produce final source.
	 *
	 * @type {ShaderAssembler}
	 */
	_assembler;

	/**
	 * Core transport provider used by automatic assembly.
	 *
	 * @type {Algorithm32Transport}
	 */
	_transport;

	/**
	 * Creates a deterministic shader-assembly preparer for one shared model.
	 *
	 * @param {ShaderAssemblyPreparerDependencies} dependencies - The model and assembly collaborators.
	 */
	constructor(dependencies) {
		this._model = dependencies.model;
		this._assembler = dependencies.assembler;
		this._transport = dependencies.transport;
	}

	/**
	 * Call this method to determine whether a request supplies low-level assembly inputs.
	 *
	 * @param {ShaderBuildRequest} request - The shader build request.
	 * @returns {boolean} - True when low-level assembly inputs are present.
	 *
	 */
	hasAssemblyInputs(request) {
		return Boolean(request.contributions || request.mainRequiredSymbols || request.systemProvidedSymbols);
	}

	/**
	 * Call this method to determine whether the configured model can provide a complete shader path.
	 *
	 * @returns {boolean} - True when automatic configured-model assembly is supported.
	 *
	 */
	canAssembleFromConfiguredModel() {
		return Boolean(
			typeof this._model.geometry?.createShaderContribution === 'function' &&
			typeof this._model.atmosphere?.createShaderContribution === 'function' &&
			typeof this._model.lightSource?.createShaderContribution === 'function' &&
			typeof this._model.lightSource?.createCacheController === 'function' &&
			typeof this._transport?.createShaderContribution === 'function' &&
			typeof this._transport?.mainRequiredShaderSymbols === 'function',
		);
	}

	/**
	 * Call this method to obtain the transport symbols required by automatic assembly.
	 *
	 * @param {boolean} [celestialSourcesEnabled] - Whether the completed build includes the live celestial path.
	 * @returns {readonly string[]} - The selected required symbol sequence.
	 *
	 */
	mainRequiredShaderSymbols(celestialSourcesEnabled = false) {
		const symbols = this._transport.mainRequiredShaderSymbols();
		if (!celestialSourcesEnabled) {
			return symbols;
		}
		const colorIndex = symbols.indexOf('color.composeSceneColor');
		return [
			...symbols.slice(0, colorIndex),
			'celestial.evaluateRadiance',
			'composition.composeSpectralRadiance',
			...symbols.slice(colorIndex),
		];
	}

	/**
	 * Called by assembleIfRequested to determine whether generic runtime initial state is required.
	 *
	 * @param {readonly string[]} mainRequiredSymbols - The active main symbol set.
	 * @param {readonly ShaderContribution[]} contributions - The collected contributions.
	 * @returns {boolean} - True when the runtime contribution is required and absent.
	 */
	_shouldAddRuntimeContribution(mainRequiredSymbols, contributions) {
		const providesRuntime = contributions.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param contribution - The contribution value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (contribution) =>
				contribution.provides.includes('runtime.initialState') ||
				contribution.provides.includes('createInitialShaderState'),
		);
		const needsRuntime =
			mainRequiredSymbols.includes('runtime.initialState') ||
			contributions.some(
				/**
				 * Called by Array.prototype.some to test one collection value for a matching condition.
				 * @param contribution - The contribution value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (contribution) => contribution.requires.includes('runtime.initialState'),
			);

		return needsRuntime && !providesRuntime;
	}

	/**
	 * Called by _createRuntimeShaderContribution to create the shared runtime type and helper source.
	 *
	 * @param {number} channelCount - The spectral channel count.
	 * @param {boolean} celestialSourcesEnabled - Whether celestial runtime state is required.
	 * @returns {string} - The exact GLSL source block.
	 */
	_runtimeTypesBlock(channelCount, celestialSourcesEnabled) {
		return `const int SPECTRAL_CHANNEL_COUNT = ${channelCount};

struct SpectralValue {
	float channels[${channelCount}];
};

struct ViewRay {
	vec3 originMeters;
	vec3 direction;
};

struct PathBounds {
	float startDistanceMeters;
	float endDistanceMeters;
	float endpointDistanceMeters;
	bool hasSceneEndpoint;
	bool hasGroundEndpoint;
	bool valid;
};

struct MediumSample {
	SpectralValue rayleighScattering;
	SpectralValue mieScattering;
	SpectralValue scattering;
	SpectralValue extinction;
};

struct ShaderState {
	vec2 textureCoordinates;
	float sceneDepth;
	float sceneHitMask;
	ViewRay ray;
	PathBounds bounds;
	MediumSample medium;
	SpectralValue pathRadiance;
	SpectralValue transmittance;
	vec3 sceneDisplayRgb;
	vec4 outputRgba;
};

SpectralValue zeroSpectral() {
	SpectralValue value;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		value.channels[channelIndex] = 0.0;
	}
	return value;
}

SpectralValue oneSpectral() {
	SpectralValue value;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		value.channels[channelIndex] = 1.0;
	}
	return value;
}`;
	}

	/**
	 * Called by _createRuntimeShaderContribution to create the shared runtime initial-state helper source.
	 *
	 * @param {boolean} celestialSourcesEnabled - Whether celestial runtime state is required.
	 * @returns {string} - The exact GLSL source block.
	 */
	_runtimeInitialStateBlock(celestialSourcesEnabled) {
		return `ShaderState createInitialShaderState(vec2 textureCoordinates) {
	ShaderState state;
	state.textureCoordinates = textureCoordinates;
	ivec2 sceneInputPixel = clamp(ivec2(floor(textureCoordinates * uViewportSizePixels)), ivec2(0), ivec2(uViewportSizePixels) - ivec2(1));
	vec4 sceneDepthSample = texelFetch(uSceneDepthTexture, sceneInputPixel, 0);
	vec4 sceneHitSample = texelFetch(uSceneHitTexture, sceneInputPixel, 0);
	vec3 depthBytes = floor(sceneDepthSample.rgb * 255.0 + 0.5);
	state.sceneDepth = dot(depthBytes, vec3(65536.0, 256.0, 1.0)) / 16777214.0;
	state.sceneHitMask = sceneHitSample.r > 0.5 ? 1.0 : 0.0;
	state.ray = ViewRay(vec3(0.0), vec3(0.0, 0.0, 1.0));
	state.bounds = PathBounds(0.0, 0.0, 0.0, false, false, true);
	state.medium = MediumSample(zeroSpectral(), zeroSpectral(), zeroSpectral(), zeroSpectral());
	state.pathRadiance = zeroSpectral();
	state.transmittance = oneSpectral();
	state.sceneDisplayRgb = texelFetch(uSceneColorTexture, sceneInputPixel, 0).rgb;
	state.outputRgba = vec4(state.sceneDisplayRgb, 1.0);
	return state;
}`;
	}

	/**
	 * Called by _collectContributions to create the shared Three runtime contribution.
	 *
	 * @returns {ShaderContribution} - The fresh runtime contribution.
	 */
	_createRuntimeShaderContribution() {
		const channelCount = this._model.spectral.basis.channelCount;
		const celestialSourcesEnabled = this._model.celestialSources !== null;

		return ShaderContributions.createShaderContribution({
			id: 'runtime-three-single-camera',
			owner: 'runtime',
			provides: [
				'runtime.initialState',
				'runtime.sceneColorTexture',
				'runtime.depthTexture',
				'runtime.sceneHitTexture',
				'createInitialShaderState',
			],
			requires: [],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					'uSceneColorTexture',
					'sampler2D',
					'runtime.sceneColorTexture',
				),
				ShaderContributions.createShaderTextureDeclaration(
					'uSceneDepthTexture',
					'sampler2D',
					'runtime.sceneDepthTexture',
				),
				ShaderContributions.createShaderTextureDeclaration(
					'uSceneHitTexture',
					'sampler2D',
					'runtime.sceneHitTexture',
				),
			],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					'uViewportSizePixels',
					'vec2',
					'runtime.viewportSize',
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'runtime-types',
					'declareTypes',
					0,
					this._runtimeTypesBlock(channelCount, celestialSourcesEnabled),
				),
				ShaderContributions.createShaderSourceBlock(
					'runtime-initial-state',
					'declareHelpers',
					0,
					this._runtimeInitialStateBlock(celestialSourcesEnabled),
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'runtime.scene-color-texture',
					'runtime',
					'texture',
					'frame',
					'runtime.sceneColorTexture',
					false,
				),
				ShaderContributions.createShaderBindingRequirement(
					'runtime.depth-texture',
					'runtime',
					'texture',
					'frame',
					'runtime.sceneDepthTexture',
					true,
				),
				ShaderContributions.createShaderBindingRequirement(
					'runtime.scene-hit-texture',
					'runtime',
					'texture',
					'frame',
					'runtime.sceneHitTexture',
					true,
				),
				ShaderContributions.createShaderBindingRequirement(
					'runtime.viewport-size',
					'runtime',
					'uniform',
					'config',
					'runtime.viewportSize',
					true,
				),
			],
		});
	}

	/**
	 * Called by assembleIfRequested to collect explicit and provider-owned shader contributions.
	 *
	 * @param {ShaderBuildRequest} request - The shader build request.
	 * @param {ShaderBuildContext} [buildContext] - The automatic setup context.
	 * @returns {readonly ShaderContribution[]} - The collected contributions in assembly order.
	 */
	_collectContributions(request, buildContext = EMPTY_SHADER_BUILD_CONTEXT) {
		const contributions = request.contributions === undefined ? [] : [...request.contributions];
		const providerRequest = {
			model: this._model,
		};
		const presentationFilterRegistry = request.config?.config?.presentationFilterRegistry ?? null;
		const providers = [
			this._model.geometry,
			this._model.atmosphere,
			this._model.lightSource,
			buildContext.scatteringCache,
			buildContext.distantSunCelestialCache,
			buildContext.stellarPointSetCache,
			buildContext.flatFiniteSunCache,
			buildContext.automaticAssembly ? this._transport : null,
			presentationFilterRegistry?.enabled === true ? presentationFilterRegistry : null,
			request.config?.config?.color,
		];

		for (const provider of providers) {
			if (typeof provider?.createShaderContribution !== 'function') {
				continue;
			}

			const provided = provider.createShaderContribution(providerRequest);
			const providedList = Array.isArray(provided) ? provided : [provided];

			for (const contribution of providedList) {
				contributions.push(contribution);
			}

			if (provider === this._model.geometry && buildContext.distantSunCelestialCache !== null) {
				if (buildContext.celestialQueryPacket === null) {
					throw new Error('Enabled distant-Sun assembly requires its geometry-derived query packet.');
				}
				contributions.push(
					/** @type {GeometryModel & CelestialGeometryCapability} */ (
						this._model.geometry
					).createCelestialCacheShaderContribution({
						...providerRequest,
						queryPacket: buildContext.celestialQueryPacket,
					}),
				);
			}

			if (provider === buildContext.distantSunCelestialCache) {
				if (buildContext.celestialQueryPacket === null) {
					throw new Error('Enabled distant-Sun live assembly requires its geometry-derived query packet.');
				}
				const roster = /** @type {SphericalSunStarsSourceRoster} */ (this._model.celestialSources);
				contributions.push(
					/** @type {DistantSunCelestialCacheResource} */ (provider).createLiveShaderContribution({
						...providerRequest,
						queryPacket: buildContext.celestialQueryPacket,
						source: /** @type {DistantSunCelestialCacheSource} */ (roster.sun),
					}),
				);
			}

			if (provider === buildContext.stellarPointSetCache) {
				if (buildContext.celestialQueryPacket?.family !== 'spherical-sun-stars-radial-v1') {
					throw new Error('Enabled stellar point-set assembly requires its spherical query packet.');
				}
				contributions.push(
					/** @type {StellarPointSetCacheResource} */ (provider).createLiveShaderContribution({
						...providerRequest,
						queryPacket: buildContext.celestialQueryPacket,
					}),
				);
			}

			if (provider === buildContext.flatFiniteSunCache) {
				if (buildContext.celestialQueryPacket?.family !== 'flat-local-finite-sun-v1') {
					throw new Error('Enabled Flat finite-Sun assembly requires its geometry-derived query packet.');
				}
				const roster = /** @type {FlatLocalFiniteSunSourceRoster} */ (this._model.celestialSources);
				contributions.push(
					/** @type {FlatFiniteSunCacheResource} */ (provider).createLiveShaderContribution({
						...providerRequest,
						source: roster.localSun,
						placement: buildContext.celestialQueryPacket.sun.placement,
					}),
				);
			}
		}

		const roster = this._model.celestialSources;
		if (roster != null) {
			const sun = roster.family === 'spherical-sun-stars-radial-v1' ? roster.sun : roster.localSun;
			contributions.push(
				new CelestialScreenPaletteConsumerShaderContribution({
					includeStars: roster.family === 'spherical-sun-stars-radial-v1' && roster.stars != null,
					filteredStars:
						roster.family === 'spherical-sun-stars-radial-v1' &&
						roster.stars != null &&
						presentationFilterRegistry?.enabled === true,
					surfaceRadiance: sun.celestialSourceDefinition.surfaceRadiance,
				}).createShaderContribution(),
			);
		}

		const mainRequiredSymbols =
			request.mainRequiredSymbols === undefined
				? (buildContext.mainRequiredSymbols ?? [])
				: request.mainRequiredSymbols;

		if (this._shouldAddRuntimeContribution(mainRequiredSymbols, contributions)) {
			contributions.unshift(this._createRuntimeShaderContribution());
		}

		return contributions;
	}

	/**
	 * Call this method to assemble source when explicit or automatic inputs require it.
	 *
	 * @param {ShaderBuildRequest} request - The candidate shader build request.
	 * @param {ShaderBuildContext} [buildContext] - The automatic setup context.
	 * @returns {ShaderAssemblyResult | null} - The assembled source or null when assembly was not requested.
	 *
	 */
	assembleIfRequested(request, buildContext = EMPTY_SHADER_BUILD_CONTEXT) {
		const shouldAssemble = this.hasAssemblyInputs(request) || buildContext.automaticAssembly;

		if (!shouldAssemble) {
			return null;
		}

		const contributions = this._collectContributions(request, buildContext);

		return this._assembler.assemble({
			contributions,
			mainRequiredSymbols:
				request.mainRequiredSymbols === undefined
					? (buildContext.mainRequiredSymbols ?? [])
					: request.mainRequiredSymbols,
			systemProvidedSymbols: request.systemProvidedSymbols === undefined ? [] : request.systemProvidedSymbols,
		});
	}
}
