import { Algorithm32ShaderAssembler } from '../shader/Algorithm32ShaderAssembler.js';
import { ShaderDescriptorBuilder as DefaultShaderDescriptorBuilder } from '../shader/ShaderDescriptorBuilder.js';
import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
	createShaderUniformDescriptor,
} from '../shader/shaderContribution.js';
import { Algorithm32Transport as DefaultAlgorithm32Transport } from '../transport/Algorithm32Transport.js';
import DistanceMath from '../utils/DistanceMath.js';
import SceneMath from '../utils/SceneMath.js';
import { SceneInputCapture } from './SceneInputCapture.js';
import { acceptPixelSize, pixelSizeToShaderValue } from '../utils/PixelMath.js';
import { ShaderRuntimePass } from './ShaderRuntimePass.js';
import {
	acceptOptionalArray,
	acceptShaderContributionCollections,
} from '../shader/shaderCollectionValidation.js';
import { stableHash } from '../shader/stableHash.js';
import { EMPTY_SHADER_BUILD_CONTEXT } from './consts.js';
import { CelestialSpectralComposer } from '../composition/CelestialSpectralComposer.js';

/**
 * Remove a pass from a composer when the composer exposes a removable surface.
 *
 * @param {unknown} composer - Supplies the composer.
 * @param {unknown} pass - Supplies the pass.
 * @returns {void}
 */
function removeComposerPass(composer, pass) {
	const candidate = /** @type {{
	 * removePass?: (pass: unknown) => void,
	 * passes?: unknown[],
	 * }} */ (composer);

	if (typeof candidate?.removePass === 'function') {
		candidate.removePass(pass);
		return;
	}

	if (Array.isArray(candidate?.passes)) {
		const index = candidate.passes.indexOf(pass);

		if (index !== -1) {
			candidate.passes.splice(index, 1);
		}
	}
}

/**
 * Normalize accepted setup packets at the GLSL uniform boundary.
 *
 * @param {string} valueKey - Supplies the logical binding key.
 * @param {unknown} value - Supplies the accepted binding or owner default.
 * @returns {unknown} The shader-compatible scalar, vector, or unchanged value.
 */
function normalizeShaderUniformValue(valueKey, value) {
	if (value == null) {
		return value;
	}

	if (valueKey === 'runtime.viewportSize') {
		return pixelSizeToShaderValue(/** @type {PixelSize} */ (value));
	}

	if (valueKey === 'geometry.sceneTermination' || valueKey === 'geometry.sceneDepthMax') {
		return DistanceMath.toMeters(/** @type {Distance} */ (value));
	}

	return value;
}

/**
 * Resolve a uniform value from setup-provided values or an owner default.
 *
 * @param {Record<string, unknown>} bindingValues - Supplies setup binding values.
 * @param {ShaderUniformDescriptor} uniform - Supplies uniform metadata.
 * @returns {unknown} Return the resolved uniform value.
 */
function resolveBindingValue(bindingValues, uniform) {
	if (Object.hasOwn(bindingValues, uniform.valueKey)) {
		return normalizeShaderUniformValue(
			uniform.valueKey,
			bindingValues[uniform.valueKey],
		);
	}

	return Object.hasOwn(uniform, 'defaultValue') ? uniform.defaultValue : null;
}

/**
 * Create one render-time refresh for caller-owned mutable binding values.
 *
 * @param {ShaderAssemblyResult} assembly - Supplies installed uniform declarations.
 * @param {Record<string, { value: unknown }>} uniforms - Supplies installed uniforms.
 * @param {Record<string, unknown>} bindingValues - Supplies the live caller-owned record.
 * @returns {() => void} Return the uniform refresh operation.
 */
function createUniformValueRefresher(assembly, uniforms, bindingValues) {
	const liveUniforms = assembly.contributions.flatMap((contribution) =>
		contribution.uniforms
			.filter((uniform) => Object.hasOwn(bindingValues, uniform.valueKey))
			.map((uniform) => ({
				declaration: uniform,
				runtime: uniforms[uniform.name],
			})),
	);

	return () => {
		for (const uniform of liveUniforms) {
			uniform.runtime.value = resolveBindingValue(
				bindingValues,
				uniform.declaration,
			);
		}
	};
}

/**
 * Check whether a prepared binding value is usable for a required binding.
 *
 * @param {Record<string, unknown>} bindingValues - Supplies prepared values.
 * @param {string} valueKey - Supplies the runtime binding key.
 * @returns {boolean} True when the key has a non-nullish value.
 */
function hasAvailableBindingValue(bindingValues, valueKey) {
	return Object.hasOwn(bindingValues, valueKey)
		&& bindingValues[valueKey] !== null
		&& bindingValues[valueKey] !== undefined;
}

/**
 * Check whether the accepted assembly references one binding value key.
 *
 * @param {ShaderAssemblyResult} assembly - Supplies accepted shader assembly.
 * @param {string} valueKey - Supplies the binding value key.
 * @returns {boolean} True when assembly references the value key.
 */
function assemblyUsesValueKey(assembly, valueKey) {
	for (const binding of assembly.bindingRequirements) {
		if (binding.valueKey === valueKey) {
			return true;
		}
	}

	for (const contribution of assembly.contributions) {
		for (const uniform of contribution.uniforms) {
			if (uniform.valueKey === valueKey) {
				return true;
			}
		}

		for (const texture of contribution.textures) {
			if (texture.valueKey === valueKey) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Resolve geometry-owned scene-depth cap fallback.
 *
 * @param {GeometryModel | undefined} geometry - Supplies configured geometry.
 * @param {ShaderSetupRequest} setup - Supplies setup-time runtime facts.
 * @param {SceneScale} sceneScale - Supplies the renderer scene-to-physical scale.
 * @returns {Distance | null} Geometry-owned cap or null.
 */
function geometrySceneDepthMax(geometry, setup, sceneScale) {
	if (typeof geometry?.resolveSceneDepthMax !== 'function') {
		return null;
	}

	const camera = /** @type {{ position?: { x?: unknown, y?: unknown, z?: unknown } }} */ (setup.camera);
	let cameraScenePosition = null;

	if (camera?.position) {
		const { x, y, z } = camera.position;

		if (![x, y, z].every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))) {
			throw new TypeError('Shader setup camera position must contain finite coordinates.');
		}

		cameraScenePosition = SceneMath.positionInSceneUnits(
			/** @type {[number, number, number]} */ ([x, y, z]),
		);
	}
	const value = geometry.resolveSceneDepthMax({
		camera: setup.camera,
		cameraScenePosition,
		sceneScale,
	});

	return value ?? null;
}

/**
 * Create scene-input capture configuration from setup and facade config.
 *
 * @param {ShaderBuildRequest} request - Supplies the build request.
 * @param {GeometryModel | undefined} geometry - Supplies the configured geometry.
 * @returns {{ viewportSize: PixelSize, sceneDepthMax: Distance, sceneScale: SceneScale }} Return normalized capture config.
 */
function runtimeSceneInputCaptureConfig(request, geometry) {
	const shaderConfig = request.config?.config?.shader === undefined
		? {}
		: request.config.config.shader;
	const setup = request.setup;
	const sceneScale = setup.sceneScale !== undefined
		? setup.sceneScale
		: shaderConfig.sceneScale !== undefined
			? shaderConfig.sceneScale
			: SceneMath.scaleInMetersPerSceneUnit(1);
	SceneMath.assertSceneScale(sceneScale, 'Shader setup sceneScale');
	const geometryDepthMax = geometrySceneDepthMax(geometry, setup, sceneScale);
	const sceneDepthMax = setup.sceneDepthMax !== undefined
		? setup.sceneDepthMax
		: shaderConfig.sceneDepthMax !== undefined
			? shaderConfig.sceneDepthMax
			: geometryDepthMax === null
				? DistanceMath.inMeters(100000)
				: geometryDepthMax;
	DistanceMath.assertDistance(sceneDepthMax, 'Shader setup sceneDepthMax');

	if (DistanceMath.toMeters(sceneDepthMax) <= 0) {
		throw new RangeError('Shader setup sceneDepthMax must be positive.');
	}

	return {
		viewportSize: setup.viewportSize,
		sceneDepthMax,
		sceneScale,
	};
}

/**
 * Check whether a required uniform has an owner-provided default.
 *
 * @param {readonly ShaderContribution[]} contributions - Supplies accepted contributions.
 * @param {string} valueKey - Supplies the runtime uniform key.
 * @returns {boolean} True when a non-nullish uniform default exists.
 */
function hasAvailableUniformDefault(contributions, valueKey) {
	for (const contribution of contributions) {
		for (const uniform of contribution.uniforms) {
			if (
				uniform.valueKey === valueKey
				&& Object.hasOwn(uniform, 'defaultValue')
				&& uniform.defaultValue !== null
				&& uniform.defaultValue !== undefined
			) {
				return true;
			}
		}
	}

	return false;
}


/**
 * Accept an optional collaborator, defaulting only an absent value.
 *
 * @template {object} Collaborator
 * @param {Collaborator | undefined} value - Supplies the candidate collaborator.
 * @param {() => Collaborator} createDefault - Creates the default collaborator.
 * @param {string} label - Supplies the dependency name.
 * @param {string} methodName - Supplies the required method name.
 * @returns {Collaborator} The accepted collaborator.
 */
function acceptCollaborator(value, createDefault, label, methodName) {
	const collaborator = value === undefined ? createDefault() : value;

	if (!collaborator || typeof collaborator !== 'object') {
		throw new TypeError(`ShaderBuilder ${label} must expose ${methodName}().`);
	}

	const candidate = /** @type {Record<string, unknown>} */ (collaborator);

	if (typeof candidate[methodName] !== 'function') {
		throw new TypeError(`ShaderBuilder ${label} must expose ${methodName}().`);
	}

	return collaborator;
}

/**
 * Accept an optional plain record.
 *
 * @param {unknown} value - Supplies the candidate record.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {object | undefined} The accepted record or undefined.
 */
function acceptOptionalRecord(value, label) {
	if (value === undefined) {
		return undefined;
	}

	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must be an object when supplied.`);
	}

	return value;
}

/**
 * Accept an optional scene scale.
 *
 * @param {unknown} value - Supplies the candidate scale.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {void}
 */
function acceptSceneScale(value, label) {
	if (value !== undefined) {
		SceneMath.assertSceneScale(value, label);
	}
}

/**
 * Accept an optional positive distance.
 *
 * @param {unknown} value - Supplies the candidate distance.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {void}
 */
function acceptPositiveDistance(value, label) {
	if (value === undefined) {
		return;
	}

	DistanceMath.assertDistance(value, label);

	if (DistanceMath.toMeters(/** @type {Distance} */ (value)) <= 0) {
		throw new RangeError(`${label} must be positive.`);
	}
}

/**
 * Accept an optional facade config snapshot used by shader setup.
 *
 * @param {unknown} value - Supplies the candidate config snapshot.
 * @returns {void}
 */
function acceptShaderBuildConfig(value) {
	if (value === undefined) {
		return;
	}

	const snapshot = /** @type {ConfigSnapshot} */ (
		acceptOptionalRecord(value, 'Shader build config')
	);
	const config = /** @type {Config} */ (
		acceptOptionalRecord(snapshot.config, 'Shader build config.config')
	);

	acceptOptionalRecord(config.execution, 'Shader build config.execution');
	const shader = /** @type {ShaderRuntimeConfig | undefined} */ (
		acceptOptionalRecord(config.shader, 'Shader build config.shader')
	);

	if (config.color === null) {
		throw new TypeError('Shader build config.color must not be null.');
	}

	if (shader !== undefined) {
		if (shader.mode !== undefined && (typeof shader.mode !== 'string' || shader.mode.trim().length === 0)) {
			throw new TypeError('Shader build config.shader.mode must be a non-empty string when supplied.');
		}

		acceptSceneScale(shader.sceneScale, 'Shader build config.shader.sceneScale');
		acceptPositiveDistance(shader.sceneDepthMax, 'Shader build config.shader.sceneDepthMax');
	}
}

/**
 * Accept optional setup controls used by runtime scene capture.
 *
 * @param {ShaderSetupRequest} setup - Supplies the setup request.
 * @returns {void}
 */
function acceptShaderSetupOptions(setup) {
	acceptSceneScale(setup.sceneScale, 'Shader setup sceneScale');
	acceptPositiveDistance(setup.sceneDepthMax, 'Shader setup sceneDepthMax');
	acceptOptionalRecord(setup.logger, 'Shader setup logger');

	if (setup.performanceCallback !== undefined && typeof setup.performanceCallback !== 'function') {
		throw new TypeError('Shader setup performanceCallback must be a function when supplied.');
	}
}

/**
 * Accept shader request fields that enter through the setup boundary.
 *
 * @param {ShaderBuildRequest} request - Supplies the candidate build request.
 * @returns {void}
 */
function acceptShaderBuildRequestOptions(request) {
	for (const fieldName of ['contributions', 'mainRequiredSymbols', 'systemProvidedSymbols']) {
		const values = acceptOptionalArray(request[fieldName], `Shader build ${fieldName}`);

		if (fieldName !== 'contributions') {
			for (const value of values) {
				if (typeof value !== 'string' || value.trim().length === 0) {
					throw new TypeError(`Shader build ${fieldName} entries must be non-empty strings.`);
				}
			}
		}
	}

	acceptOptionalRecord(request.descriptor, 'Shader build descriptor');
	acceptOptionalRecord(request.bindingValues, 'Shader build bindingValues');
	acceptShaderBuildConfig(request.config);
	acceptShaderSetupOptions(request.setup);
}

/**
 * Build Algorithm32 runtime shader artifacts from the configured shared model.
 */
export class ShaderBuilder {
	/**
	 * Store the facade-owned shared model consumed by shader builds.
	 *
	 * @type {SharedModel}
	 */
	_model;

	/**
	 * Store the generic shader assembler.
	 *
	 * @type {ShaderAssembler}
	 */
	_assembler;

	/**
	 * Store the shader descriptor builder.
	 *
	 * @type {ShaderDescriptorBuilder}
	 */
	_descriptorBuilder;

	/**
	 * Store the core transport implementation.
	 *
	 * @type {Algorithm32Transport}
	 */
	_transport;

	/**
	 * Store the last accepted config snapshot.
	 *
	 * @type {ConfigSnapshot | undefined}
	 */
	_lastConfig;

	/**
	 * Track whether this builder has been disposed.
	 *
	 * @type {boolean}
	 */
	_disposed = false;

	/**
	 * Create a runtime shader builder.
	 *
	 * @param {ShaderBuilderDependencies} dependencies - Supplies the shared
	 * model and implementation services used to build shader artifacts.
	 */
	constructor(dependencies) {
		if (!dependencies || typeof dependencies !== 'object') {
			throw new TypeError('ShaderBuilder dependencies are required.');
		}

		if (!dependencies.model || typeof dependencies.model !== 'object') {
			throw new TypeError('ShaderBuilder requires a shared model.');
		}

		this._model = dependencies.model;
		this._assembler = acceptCollaborator(
			dependencies.assembler,
			() => new Algorithm32ShaderAssembler(),
			'assembler',
			'assemble',
		);
		this._descriptorBuilder = acceptCollaborator(
			dependencies.descriptorBuilder,
			() => new DefaultShaderDescriptorBuilder(),
			'descriptorBuilder',
			'build',
		);
		this._transport = acceptCollaborator(
			dependencies.transport,
			() => new DefaultAlgorithm32Transport(),
			'transport',
			'createShaderContribution',
		);
	}

	/**
	 * Return the shared model consumed by shader builds.
	 *
	 * @returns {SharedModel} The shared model.
	 */
	get model() {
		return this._model;
	}

	/**
	 * Assert that this builder can still be used.
	 *
	 * @returns {void}
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('ShaderBuilder has been disposed.');
		}
	}

	/**
	 * Assert that a shader build request has the required setup-time
	 * attachment handles.
	 *
	 * @param {ShaderBuildRequest} request - Supplies the candidate build
	 * request.
	 * @returns {void}
	 */
	_assertBuildRequest(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('Shader build request is required.');
		}

		const { setup } = request;

		if (!setup || typeof setup !== 'object') {
			throw new TypeError('Shader setup request is required.');
		}

		for (const fieldName of ['composer', 'scene', 'camera']) {
			if (!setup[fieldName]) {
				throw new TypeError(`Shader setup request requires ${fieldName}.`);
			}
		}

		acceptPixelSize(setup.viewportSize, 'Shader setup viewportSize');
		acceptShaderBuildRequestOptions(request);

		if (!this._hasAssemblyInputs(request)
			&& this._canAssembleFromConfiguredModel()
			&& !setup.cacheBackend) {
			throw new TypeError('Configured Algorithm32 shader setup requires cacheBackend.');
		}
	}

	/**
	 * Check whether the request already supplies low-level assembly inputs.
	 *
	 * @param {ShaderBuildRequest} request - Supplies the build request.
	 * @returns {boolean} True when low-level assembly inputs are present.
	 */
	_hasAssemblyInputs(request) {
		return Boolean(
			request.descriptor
			|| request.contributions
			|| request.mainRequiredSymbols
			|| request.systemProvidedSymbols,
		);
	}

	/**
	 * Check whether the configured model can provide a complete shader path.
	 *
	 * @returns {boolean} True when automatic setup assembly is supported.
	 */
	_canAssembleFromConfiguredModel() {
		return Boolean(
			typeof this.model.geometry?.createShaderContribution === 'function'
			&& typeof this.model.atmosphere?.createShaderContribution === 'function'
			&& typeof this.model.lightSource?.createShaderContribution === 'function'
			&& typeof this.model.lightSource?.createCacheController === 'function'
			&& typeof this._transport?.createShaderContribution === 'function'
			&& typeof this._transport?.mainRequiredShaderSymbols === 'function',
		);
	}

	/**
	 * Check whether the generic runtime initial-state contribution is needed.
	 *
	 * @param {readonly string[]} mainRequiredSymbols - Supplies the active main symbol set.
	 * @param {readonly ShaderContribution[]} contributions - Supplies collected contributions.
	 * @returns {boolean} Return true when runtime contribution should be added.
	 */
	_shouldAddRuntimeContribution(mainRequiredSymbols, contributions) {
		const providesRuntime = contributions.some((contribution) =>
			contribution.provides.includes('runtime.initialState')
			|| contribution.provides.includes('createInitialShaderState'));
		const needsRuntime = mainRequiredSymbols.includes('runtime.initialState')
			|| contributions.some((contribution) => contribution.requires.includes('runtime.initialState'));

		return needsRuntime && !providesRuntime;
	}

	/**
	 * Create the shared runtime type/helper block.
	 *
	 * @param {number} channelCount - Supplies the spectral channel count.
	 * @returns {string} Return GLSL source.
	 */
	_runtimeTypesBlock(channelCount) {
		return `const int SPECTRAL_CHANNEL_COUNT = ${channelCount};

struct SpectralValue {
	float c[${channelCount}];
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
	vec2 uv;
	float sceneDepth;
	float sceneHitMask;
	ViewRay ray;
	PathBounds bounds;
	MediumSample medium;
	SpectralValue pathRadiance;
	SpectralValue celestialRadiance;
	SpectralValue preDisplayRadiance;
	SpectralValue transmittance;
	// EffectComposer supplies an offscreen linear-sRGB half-float scene texture.
	// This remains scene-linear until Color applies the single final display map.
	vec3 sceneLinearSrgb;
	vec4 outputRgba;
};

SpectralValue zeroSpectral() {
	SpectralValue value;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		value.c[channelIndex] = 0.0;
	}
	return value;
}

SpectralValue oneSpectral() {
	SpectralValue value;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		value.c[channelIndex] = 1.0;
	}
	return value;
}`;
	}

	/**
	 * Create the shared runtime initial-state helper block.
	 *
	 * @returns {string} Return GLSL source.
	 */
	_runtimeInitialStateBlock() {
		return `ShaderState createInitialShaderState(vec2 uv) {
	ShaderState state;
	state.uv = uv;
	ivec2 sceneInputPixel = clamp(ivec2(floor(uv * uViewportSizePixels)), ivec2(0), ivec2(uViewportSizePixels) - ivec2(1));
	vec4 sceneDepthSample = texelFetch(uSceneDepthTexture, sceneInputPixel, 0);
	vec4 sceneHitSample = texelFetch(uSceneHitTexture, sceneInputPixel, 0);
	vec3 depthBytes = floor(sceneDepthSample.rgb * 255.0 + 0.5);
	state.sceneDepth = dot(depthBytes, vec3(65536.0, 256.0, 1.0)) / 16777214.0;
	state.sceneHitMask = sceneHitSample.r > 0.5 ? 1.0 : 0.0;
	state.ray = ViewRay(vec3(0.0), vec3(0.0, 0.0, 1.0));
	state.bounds = PathBounds(0.0, 0.0, 0.0, false, false, true);
	state.medium = MediumSample(zeroSpectral(), zeroSpectral(), zeroSpectral(), zeroSpectral());
	state.pathRadiance = zeroSpectral();
	state.celestialRadiance = zeroSpectral();
	state.preDisplayRadiance = zeroSpectral();
	state.transmittance = oneSpectral();
	state.sceneLinearSrgb = texelFetch(uSceneColorTexture, sceneInputPixel, 0).rgb;
	state.outputRgba = vec4(state.sceneLinearSrgb, 1.0);
	return state;
}`;
	}

	/**
	 * Create the shared runtime shader contribution used by assembled setups.
	 *
	 * @param {Algorithm32ShaderDescriptor} descriptor - Supplies the active descriptor.
	 * @returns {ShaderContribution} Return the runtime contribution.
	 */
	_createRuntimeShaderContribution(descriptor) {
		const channelCount = this.model.spectral.basis.channelCount;

		return createShaderContribution({
			id: 'runtime-three-single-camera',
			owner: 'runtime',
			descriptorFingerprint: descriptor.runtime.fingerprint,
			compatibilityTags: descriptor.runtime.compatibilityTags,
			provides: [
				'runtime.initialState',
				'runtime.sceneColorTexture',
				'runtime.depthTexture',
				'runtime.sceneHitTexture',
				'createInitialShaderState',
			],
			requires: [],
			textures: [
				createShaderTextureDescriptor('uSceneColorTexture', 'sampler2D', 'runtime.sceneColorTexture'),
				createShaderTextureDescriptor('uSceneDepthTexture', 'sampler2D', 'runtime.sceneDepthTexture'),
				createShaderTextureDescriptor('uSceneHitTexture', 'sampler2D', 'runtime.sceneHitTexture'),
			],
			uniforms: [
				createShaderUniformDescriptor('uViewportSizePixels', 'vec2', 'runtime.viewportSize'),
			],
			functions: [
				createShaderSourceBlock(
					'runtime-types',
					'declareTypes',
					0,
					this._runtimeTypesBlock(channelCount),
				),
				createShaderSourceBlock(
					'runtime-initial-state',
					'declareHelpers',
					0,
					this._runtimeInitialStateBlock(),
				),
			],
			bindingRequirements: [
				createShaderBindingRequirement('runtime.scene-color-texture', 'runtime', 'texture', 'frame', 'runtime.sceneColorTexture', false),
				createShaderBindingRequirement('runtime.depth-texture', 'runtime', 'texture', 'frame', 'runtime.sceneDepthTexture', true),
				createShaderBindingRequirement('runtime.scene-hit-texture', 'runtime', 'texture', 'frame', 'runtime.sceneHitTexture', true),
				createShaderBindingRequirement('runtime.viewport-size', 'runtime', 'uniform', 'config', 'runtime.viewportSize', true),
			],
		});
	}

	/**
	 * Collect explicit and owner-provided shader contributions.
	 *
	 * @param {ShaderBuildRequest} request - Supplies the build request.
	 * @param {Algorithm32ShaderDescriptor} descriptor - Supplies the descriptor.
	 * @param {ShaderBuildContext} [buildContext] - Supplies automatic setup context.
	 * @returns {readonly ShaderContribution[]} Return collected contributions.
	 */
	_collectContributions(
		request,
		descriptor,
		buildContext = EMPTY_SHADER_BUILD_CONTEXT,
	) {
		const contributions = (request.contributions === undefined ? [] : request.contributions)
			.map((contribution, index) =>
			acceptShaderContributionCollections(contribution, `Shader build contribution ${index}`));
		const providerRequest = {
			descriptor,
			config: request.config,
			setup: request.setup,
			model: this.model,
			cache: buildContext.cache ?? null,
		};
		const providers = [
			this.model.geometry,
			this.model.atmosphere,
			this.model.lightSource,
			buildContext.cache,
			buildContext.automaticAssembly ? this._transport : null,
			request.config?.config?.color,
		];

		for (const provider of providers) {
			if (typeof provider?.createShaderContribution !== 'function') {
				continue;
			}

			const provided = provider.createShaderContribution(providerRequest);
			const providedList = Array.isArray(provided) ? provided : [provided];

			for (const contribution of providedList) {
				if (!contribution || typeof contribution !== 'object') {
					throw new TypeError('Shader contribution provider returned an invalid contribution.');
				}

				contributions.push(acceptShaderContributionCollections(
					contribution,
					`Shader contribution provider result ${contributions.length}`,
				));
			}
		}

		if (buildContext.celestialCache) {
			contributions.push(
				buildContext.celestialCache.createShaderContribution({
					descriptorFingerprint: descriptor.cache.fingerprint,
					compatibilityTags: descriptor.cache.compatibilityTags,
				}),
				buildContext.celestialCache.createLiveShaderContribution({
					descriptorFingerprint: descriptor.cache.fingerprint,
					compatibilityTags: descriptor.cache.compatibilityTags,
				}),
			);
		}
		if (buildContext.stellarPointSetCache) {
			contributions.push(
				buildContext.stellarPointSetCache.createShaderContribution({
					descriptorFingerprint: descriptor.cache.fingerprint,
					compatibilityTags: descriptor.cache.compatibilityTags,
				}),
				buildContext.stellarPointSetCache.createLiveShaderContribution({
					descriptorFingerprint: descriptor.cache.fingerprint,
					compatibilityTags: descriptor.cache.compatibilityTags,
				}),
			);
		}
		if (buildContext.celestialCache || buildContext.stellarPointSetCache) {
			contributions.push(new CelestialSpectralComposer().createShaderContribution({ descriptor }));
		}

		const mainRequiredSymbols = request.mainRequiredSymbols === undefined
			? buildContext.mainRequiredSymbols ?? []
			: request.mainRequiredSymbols;

		if (this._shouldAddRuntimeContribution(mainRequiredSymbols, contributions)) {
			contributions.unshift(this._createRuntimeShaderContribution(descriptor));
		}

		return contributions;
	}

	/**
	 * Assemble shader source when the request includes assembly inputs.
	 *
	 * @param {ShaderBuildRequest} request - Supplies the candidate request.
	 * @param {ShaderBuildContext} [buildContext] - Supplies automatic assembly
	 * inputs created at the setup boundary.
	 * @returns {ShaderAssemblyResult | null} Return assembled source or null.
	 */
	_assembleIfRequested(request, buildContext = EMPTY_SHADER_BUILD_CONTEXT) {
		const shouldAssemble = this._hasAssemblyInputs(request) || buildContext.automaticAssembly;

		if (!shouldAssemble) {
			return null;
		}

		const color = request.config?.config?.color ?? null;
		const descriptor = request.descriptor === undefined ? this._descriptorBuilder.build({
			model: this.model,
			config: request.config,
			color,
			cacheDescriptor: buildContext.cache?.descriptor,
		}) : request.descriptor;

		const contributions = this._collectContributions(request, descriptor, buildContext);

		return this._assembler.assemble({
			descriptor,
			contributions,
			mainRequiredSymbols: request.mainRequiredSymbols === undefined
				? buildContext.mainRequiredSymbols ?? []
				: request.mainRequiredSymbols,
			systemProvidedSymbols: request.systemProvidedSymbols === undefined
				? []
				: request.systemProvidedSymbols,
		});
	}

	/** Create or reuse the optional geometry-owned primary celestial GPU cache. */
	async _createCelestialBuildContext(request) {
		const participant = this.model.celestial;
		if (!participant) {
			return {
				celestialCacheController: null,
				celestialCache: null,
				celestialCacheIdentity: null,
				createdCelestialCacheController: false,
			};
		}
		if (typeof participant.describe !== 'function'
			|| typeof participant.createPrimaryCache !== 'function'
			|| typeof participant.createGpuCacheController !== 'function') {
			throw new TypeError('Configured celestial participant does not satisfy the runtime-cache contract.');
		}
		const backend = request.setup.cacheBackend;
		const identity = {
			backend,
			backendCapabilitiesId: backend.capabilities.id,
			cacheBuildScheduler: request.setup.cacheBuildScheduler ?? null,
			participantFingerprint: stableHash(participant.describe()),
			geometryFingerprint: stableHash(this.model.geometry.describe()),
			atmosphereFingerprint: stableHash(this.model.atmosphere.describe()),
		};
		const previous = request.previousBuildResult;
		const previousIdentity = previous?.celestialCacheIdentity;
		const canReuse = previous?.celestialCacheController
			&& previous?.celestialCache
			&& previousIdentity
			&& previousIdentity.backend === identity.backend
			&& previousIdentity.backendCapabilitiesId === identity.backendCapabilitiesId
			&& previousIdentity.cacheBuildScheduler === identity.cacheBuildScheduler
			&& previousIdentity.participantFingerprint === identity.participantFingerprint
			&& previousIdentity.geometryFingerprint === identity.geometryFingerprint
			&& previousIdentity.atmosphereFingerprint === identity.atmosphereFingerprint;
		if (canReuse) {
			return {
				celestialCacheController: previous.celestialCacheController,
				celestialCache: previous.celestialCache,
				celestialCacheIdentity: identity,
				createdCelestialCacheController: false,
			};
		}
		const canReuseController = previous?.celestialCacheController
			&& previousIdentity?.backend === identity.backend
			&& previousIdentity?.backendCapabilitiesId === identity.backendCapabilitiesId
			&& previousIdentity?.cacheBuildScheduler === identity.cacheBuildScheduler;
		const controller = canReuseController
			? previous.celestialCacheController
			: participant.createGpuCacheController({
				geometry: this.model.geometry,
				backend,
				scheduler: request.setup.cacheBuildScheduler,
			});
		try {
			const primaryCache = participant.createPrimaryCache({
				geometry: this.model.geometry,
				atmosphere: this.model.atmosphere,
			});
			const celestialCache = await controller.build({
				primaryCache,
				sourceId: participant.primarySourceId,
			});
			return {
				celestialCacheController: controller,
				celestialCache,
				celestialCacheIdentity: identity,
				createdCelestialCacheController: !canReuseController,
			};
		} catch (error) {
			if (!canReuseController) controller.dispose();
			throw error;
		}
	}

	/** Create or reuse the optional geometry-owned tiled stellar point-set GPU cache. */
	async _createStellarPointSetBuildContext(request) {
		const participant = this.model.celestial;
		if (!participant?.stellarPointSource) {
			return {
				stellarPointSetCacheController: null,
				stellarPointSetCache: null,
				stellarPointSetCacheIdentity: null,
				createdStellarPointSetCacheController: false,
			};
		}
		if (typeof participant.createStellarPointSetCache !== 'function'
			|| typeof participant.createStellarPointSetGpuCacheController !== 'function') {
			throw new TypeError('Configured celestial participant does not satisfy the stellar runtime-cache contract.');
		}
		const backend = request.setup.cacheBackend;
		const identity = {
			backend,
			backendCapabilitiesId: backend.capabilities.id,
			cacheBuildScheduler: request.setup.cacheBuildScheduler ?? null,
			stellarSourceFingerprint: stableHash(participant.stellarPointSource.describeStaticIdentity()),
			geometryFingerprint: stableHash(this.model.geometry.describe()),
			atmosphereFingerprint: stableHash(this.model.atmosphere.describe()),
		};
		const previous = request.previousBuildResult;
		const previousIdentity = previous?.stellarPointSetCacheIdentity;
		const canReuse = previous?.stellarPointSetCacheController
			&& previous?.stellarPointSetCache
			&& previousIdentity
			&& previousIdentity.backend === identity.backend
			&& previousIdentity.backendCapabilitiesId === identity.backendCapabilitiesId
			&& previousIdentity.cacheBuildScheduler === identity.cacheBuildScheduler
			&& previousIdentity.stellarSourceFingerprint === identity.stellarSourceFingerprint
			&& previousIdentity.geometryFingerprint === identity.geometryFingerprint
			&& previousIdentity.atmosphereFingerprint === identity.atmosphereFingerprint;
		if (canReuse) {
			return {
				stellarPointSetCacheController: previous.stellarPointSetCacheController,
				stellarPointSetCache: previous.stellarPointSetCache,
				stellarPointSetCacheIdentity: identity,
				createdStellarPointSetCacheController: false,
			};
		}
		const canReuseController = previous?.stellarPointSetCacheController
			&& previousIdentity?.backend === identity.backend
			&& previousIdentity?.backendCapabilitiesId === identity.backendCapabilitiesId
			&& previousIdentity?.cacheBuildScheduler === identity.cacheBuildScheduler;
		const controller = canReuseController
			? previous.stellarPointSetCacheController
			: participant.createStellarPointSetGpuCacheController({
				geometry: this.model.geometry,
				backend,
				scheduler: request.setup.cacheBuildScheduler,
			});
		try {
			const tiledCache = participant.createStellarPointSetCache({
				geometry: this.model.geometry,
				atmosphere: this.model.atmosphere,
			});
			const stellarPointSetCache = await controller.build({ tiledCache });
			return {
				stellarPointSetCacheController: controller,
				stellarPointSetCache,
				stellarPointSetCacheIdentity: identity,
				createdStellarPointSetCacheController: !canReuseController,
			};
		} catch (error) {
			if (!canReuseController) controller.dispose();
			throw error;
		}
	}

	/**
	 * Create setup-time cache and contribution context for automatic assembly.
	 *
	 * @param {ShaderBuildRequest} request - Supplies the build request.
	 * @returns {Promise<ShaderBuildContext>} Return the setup build context.
	 */
	async _createBuildContext(request) {
		if (this._hasAssemblyInputs(request) || !this._canAssembleFromConfiguredModel()) {
			return EMPTY_SHADER_BUILD_CONTEXT;
		}

		const config = request.config?.config;
		const maximumScatteringOrder = config?.execution?.maximumScatteringOrder ?? 4;
		const groundBoundary = config?.groundBoundary ?? null;
		const sourceDescriptor = this.model.lightSource.describe();
		const atmosphereDescriptor = this.model.atmosphere.describe();
		const geometryDescriptor = this.model.geometry.describe();
		const boundaryDescriptor = groundBoundary?.describe?.() ?? null;
		const cacheIdentity = {
			backend: request.setup.cacheBackend,
			backendCapabilitiesId: request.setup.cacheBackend.capabilities.id,
			cacheBuildScheduler:
				request.setup.cacheBuildScheduler ?? null,
			sourceFingerprint: stableHash(sourceDescriptor),
			atmosphereFingerprint: stableHash(atmosphereDescriptor),
			geometryFingerprint: stableHash(geometryDescriptor),
			boundaryContentHash: boundaryDescriptor?.contentHash ?? null,
			spectralContentHash: this.model.spectral.basis.contentHash,
			maximumScatteringOrder,
		};
		const previous = request.previousBuildResult;
		const previousIdentity = previous?.cacheIdentity;
		const canReuseController = previous?.cacheController
			&& previous.cache
			&& previousIdentity
			&& previousIdentity.backend === cacheIdentity.backend
			&& previousIdentity.backendCapabilitiesId === cacheIdentity.backendCapabilitiesId
			&& previousIdentity.cacheBuildScheduler
				=== cacheIdentity.cacheBuildScheduler
			&& previousIdentity.sourceFingerprint === cacheIdentity.sourceFingerprint;
		const canReuse = canReuseController
			&& previousIdentity.atmosphereFingerprint === cacheIdentity.atmosphereFingerprint
			&& previousIdentity.geometryFingerprint === cacheIdentity.geometryFingerprint
			&& previousIdentity.boundaryContentHash === cacheIdentity.boundaryContentHash
			&& previousIdentity.spectralContentHash === cacheIdentity.spectralContentHash
			&& previousIdentity.maximumScatteringOrder === cacheIdentity.maximumScatteringOrder;

		if (canReuse) {
			const celestialContext = await this._createCelestialBuildContext(request);
			const stellarPointSetContext = await this._createStellarPointSetBuildContext(request);
			return {
				automaticAssembly: true,
				cacheController: previous.cacheController,
				cache: previous.cache,
				cacheIdentity,
				createdCacheController: false,
				...celestialContext,
				...stellarPointSetContext,
				mainRequiredSymbols: this._transport.mainRequiredShaderSymbols(),
			};
		}

		const cacheController = canReuseController
			? previous.cacheController
			: this.model.lightSource.createCacheController({
				backend: request.setup.cacheBackend,
				scheduler: request.setup.cacheBuildScheduler,
			});

		try {
			const cache = await cacheController.createScatteringCache({
				atmosphere: /** @type {AtmosphereModel & CacheBuildContributor} */ (
					this.model.atmosphere
				),
				geometry: /** @type {GeometryModel & CacheBuildContributor} */ (
					this.model.geometry
				),
				groundBoundary: /** @type {(GroundBoundary & CacheBuildContributor) | null} */ (
					groundBoundary
				),
				spectralBasis: this.model.spectral.basis,
				maximumScatteringOrder,
				signal: request.signal,
			});

			const celestialContext = await this._createCelestialBuildContext(request);
			const stellarPointSetContext = await this._createStellarPointSetBuildContext(request);
			return {
				automaticAssembly: true,
				cacheController,
				cache,
				cacheIdentity,
				createdCacheController: !canReuseController,
				...celestialContext,
				...stellarPointSetContext,
				mainRequiredSymbols: this._transport.mainRequiredShaderSymbols(),
			};
		} catch (error) {
			if (!canReuseController) {
				cacheController.dispose();
			}
			throw error;
		}
	}

	/**
	 * Create renderer-produced scene input bindings needed by the runtime shader.
	 *
	 * @param {object} request - Supplies assembly and setup state.
	 * @param {ShaderBuildRequest} request.request - Supplies the build request.
	 * @param {ShaderAssemblyResult} request.assembly - Supplies accepted shader source.
	 * @param {Record<string, unknown>} request.bindingValues - Supplies known binding values.
	 * @returns {{ readonly sceneInputCapture: SceneInputCapture | null, readonly bindingValues: Record<string, unknown> }} Return scene input bindings.
	 */
	_createRuntimeSceneInputBindings({ request, assembly, bindingValues }) {
		/** @type {Record<string, unknown>} */
		const bindingPatch = {};
		const needsDepthTexture = assemblyUsesValueKey(assembly, 'runtime.sceneDepthTexture');
		const needsHitTexture = assemblyUsesValueKey(assembly, 'runtime.sceneHitTexture');
		const needsViewportSize = assemblyUsesValueKey(assembly, 'runtime.viewportSize');
		const needsSceneDepthMax = assemblyUsesValueKey(assembly, 'geometry.sceneDepthMax');
		const missingDepthTexture = needsDepthTexture
			&& !hasAvailableBindingValue(bindingValues, 'runtime.sceneDepthTexture');
		const missingHitTexture = needsHitTexture
			&& !hasAvailableBindingValue(bindingValues, 'runtime.sceneHitTexture');
		const missingSceneDepthMax = needsSceneDepthMax
			&& !hasAvailableBindingValue(bindingValues, 'geometry.sceneDepthMax');
		let captureConfig = null;
		let sceneInputCapture = null;

		if (missingDepthTexture || missingHitTexture) {
			captureConfig = runtimeSceneInputCaptureConfig(request, this.model.geometry);

			sceneInputCapture = new SceneInputCapture({
				THREE: request.setup.THREE,
				scene: request.setup.scene,
				camera: request.setup.camera,
				performanceCallback: request.setup.performanceCallback,
				performanceSampleIntervalFrames: request.setup.performanceSampleIntervalFrames,
				performanceMaxPendingQueries: request.setup.performanceMaxPendingQueries,
				...captureConfig,
			});
			const captureValues = sceneInputCapture.bindingValues();

			if (missingDepthTexture) {
				bindingPatch['runtime.sceneDepthTexture'] = captureValues['runtime.sceneDepthTexture'];
			}

			if (missingHitTexture) {
				bindingPatch['runtime.sceneHitTexture'] = captureValues['runtime.sceneHitTexture'];
			}

		}

		if (needsViewportSize) {
			bindingPatch['runtime.viewportSize'] = sceneInputCapture
				? sceneInputCapture.viewportSize
				: request.setup.viewportSize;
		}

		if (missingSceneDepthMax) {
			if (!captureConfig) {
				captureConfig = runtimeSceneInputCaptureConfig(request, this.model.geometry);
			}
			bindingPatch['geometry.sceneDepthMax'] = captureConfig.sceneDepthMax;
		}

		return {
			sceneInputCapture,
			bindingValues: bindingPatch,
		};
	}

	/**
	 * Assert that all required shader bindings have setup values.
	 *
	 * @param {object} request - Supplies the accepted assembly and values.
	 * @param {ShaderAssemblyResult} request.assembly - Supplies shader binding requirements.
	 * @param {Record<string, unknown>} request.bindingValues - Supplies prepared binding values.
	 * @param {CacheRuntimeBindings | null} [request.runtimeBindings] - Supplies
	 * opaque cache bindings accepted by the backend.
	 * @returns {void}
	 */
	_assertRequiredBindingsAvailable({ assembly, bindingValues, runtimeBindings = null }) {
		const cacheValueKeys = /** @type {Set<string>} */ (new Set(
			runtimeBindings?.bindings.map((binding) => binding.valueKey) ?? [],
		));
		for (const binding of assembly.bindingRequirements) {
			if (!binding.required) {
				continue;
			}

			if (hasAvailableBindingValue(bindingValues, binding.valueKey)) {
				continue;
			}

			if (binding.kind === 'texture' && cacheValueKeys.has(binding.valueKey)) {
				continue;
			}

			if (binding.kind === 'uniform' && hasAvailableUniformDefault(assembly.contributions, binding.valueKey)) {
				continue;
			}

			throw new TypeError(`Required shader binding ${binding.id} (${binding.valueKey}) is missing.`);
		}
	}

	/**
	 * Create runtime uniforms from contribution declarations.
	 *
	 * @param {object} request - Supplies assembly and binding values.
	 * @param {ShaderAssemblyResult} request.assembly - Supplies the accepted assembly.
	 * @param {Record<string, unknown>} request.bindingValues - Supplies initial values.
	 * @returns {Record<string, { value: unknown }>} Return runtime uniforms.
	 */
	_createUniforms({ assembly, bindingValues }) {
		/** @type {Record<string, { value: unknown }>} */
		const uniforms = {};

		for (const contribution of assembly.contributions) {
			for (const uniform of contribution.uniforms) {
				uniforms[uniform.name] = {
					value: resolveBindingValue(bindingValues, uniform),
				};
			}

			for (const texture of contribution.textures) {
				uniforms[texture.name] = {
					value: Object.hasOwn(bindingValues, texture.valueKey)
						? bindingValues[texture.valueKey]
						: null,
				};
			}
		}

		return uniforms;
	}

	/**
	 * Install a runtime pass when the setup names a composer pass surface.
	 *
	 * @param {ShaderBuildRequest} request - Supplies the build request.
	 * @param {ShaderAssemblyResult} assembly - Supplies accepted shader source.
	 * @param {ShaderBuildContext} [buildContext] - Supplies automatic setup context.
	 * @returns {ShaderRuntimeArtifact | null} Return installed runtime state.
	 */
	_installRuntimeIfPossible(
		request,
		assembly,
		buildContext = EMPTY_SHADER_BUILD_CONTEXT,
	) {
		const composer = /** @type {{ addPass?: (pass: unknown) => void }} */ (request.setup.composer);
		const { THREE } = request.setup;

		if (typeof composer?.addPass !== 'function') {
			return null;
		}

		if (!THREE) {
			throw new TypeError('Shader setup requires THREE when installing a composer pass.');
		}

		let sceneInputCapture = null;
		let pass = null;
		let sceneInputCaptureInstalled = false;
		let passInstalled = false;

		try {
			const preparedBindingValues = request.bindingValues === undefined
				? {}
				: request.bindingValues;
			const runtimeSceneInputs = this._createRuntimeSceneInputBindings({
				request,
				assembly,
				bindingValues: preparedBindingValues,
			});
			sceneInputCapture = runtimeSceneInputs.sceneInputCapture;
			const bindingValues = {
				...preparedBindingValues,
				...runtimeSceneInputs.bindingValues,
			};
			const runtimeBindings = {
				bindings: [
					...(buildContext.cache?.getRuntimeBindings()?.bindings ?? []),
					...(buildContext.celestialCache?.getRuntimeBindings()?.bindings ?? []),
					...(buildContext.stellarPointSetCache?.getRuntimeBindings()?.bindings ?? []),
				],
			};
			this._assertRequiredBindingsAvailable({
				assembly,
				bindingValues,
				runtimeBindings,
			});
			const uniforms = this._createUniforms({
				assembly,
				bindingValues,
			});
			const refreshUniformValues = createUniformValueRefresher(
				assembly,
				uniforms,
				preparedBindingValues,
			);
			if (buildContext.cache || buildContext.celestialCache || buildContext.stellarPointSetCache) {
				/** @type {Record<string, { value: unknown }>} */
				const cacheUniforms = {};
				for (const contribution of assembly.contributions) {
					for (const texture of contribution.textures) {
						if (uniforms[texture.name]) {
							cacheUniforms[texture.valueKey] = uniforms[texture.name];
						}
					}
				}
				for (const runtimeCache of [buildContext.cache, buildContext.celestialCache, buildContext.stellarPointSetCache]) {
					if (!runtimeCache) continue;
					request.setup.cacheBackend.installRuntimeBindings({
						bindings: runtimeCache.getRuntimeBindings(),
						uniforms: cacheUniforms,
					});
				}
			}
			pass = new ShaderRuntimePass({
				THREE,
				fragmentShaderSource: assembly.fragmentShaderSource,
				sourceHash: assembly.sourceHash,
				uniforms,
				viewportSize: request.setup.viewportSize,
				sceneInputCapture,
				refreshUniformValues,
				logger: request.setup.logger === undefined ? null : request.setup.logger,
				performanceCallback: request.setup.performanceCallback,
				performanceSampleIntervalFrames: request.setup.performanceSampleIntervalFrames,
				performanceMaxPendingQueries: request.setup.performanceMaxPendingQueries,
			});

			if (sceneInputCapture) {
				composer.addPass(sceneInputCapture);
				sceneInputCaptureInstalled = true;
			}

			composer.addPass(pass);
			passInstalled = true;

			return {
				prepare: (renderer) => pass.prepare(renderer),
				getUniformValue: (name) => pass.uniforms[name]?.value,
				dispose: () => {
					removeComposerPass(composer, pass);
					pass.dispose();
					if (sceneInputCapture) {
						removeComposerPass(composer, sceneInputCapture);
						sceneInputCapture.dispose();
					}
				},
				getDiagnostics: () => pass.getDiagnostics(),
			};
		} catch (error) {
			if (passInstalled && pass) {
				removeComposerPass(composer, pass);
			}

			if (sceneInputCaptureInstalled && sceneInputCapture) {
				removeComposerPass(composer, sceneInputCapture);
			}

			pass?.dispose?.();
			sceneInputCapture?.dispose?.();
			throw error;
		}
	}

	/**
	 * Build the runtime shader artifacts needed by the facade to attach
	 * Algorithm32 to a Three composer. The returned packet contains the
	 * shader-facing resources, binding description, and lifecycle hooks needed
	 * by the facade or shader handle.
	 *
	 * @param {ShaderBuildRequest} request - Supplies the accepted shader build
	 * request.
	 * @returns {Promise<ShaderBuildResult>} The built runtime shader artifact
	 * packet.
	 */
	async build(request) {
		this._assertUsable();
		this._assertBuildRequest(request);

		const buildContext = await this._createBuildContext(request);

		try {
			const assembly = this._assembleIfRequested(request, buildContext);
			const runtime = assembly
				? this._installRuntimeIfPossible(request, assembly, buildContext)
				: null;
			const result = {
				modelVersion: this.model.version,
				setup: request.setup,
				cacheController: buildContext.cacheController,
				cache: buildContext.cache,
				cacheIdentity: buildContext.cacheIdentity,
				celestialCacheController: buildContext.celestialCacheController,
				celestialCache: buildContext.celestialCache,
				celestialCacheIdentity: buildContext.celestialCacheIdentity,
				stellarPointSetCacheController: buildContext.stellarPointSetCacheController,
				stellarPointSetCache: buildContext.stellarPointSetCache,
				stellarPointSetCacheIdentity: buildContext.stellarPointSetCacheIdentity,
				diagnostics: {
					status: runtime ? 'installed' : assembly ? 'assembled' : 'deferred',
				},
			};

			if (assembly) {
				result.assembly = assembly;
				result.bindingRequirements = assembly.bindingRequirements;
			}

			if (runtime) {
				result.runtime = runtime;
			}

			return result;
		} catch (error) {
			if (buildContext.createdCacheController) buildContext.cacheController?.dispose();
			if (buildContext.createdCelestialCacheController) buildContext.celestialCacheController?.dispose();
			if (buildContext.createdStellarPointSetCacheController) buildContext.stellarPointSetCacheController?.dispose();
			throw error;
		}
	}

	/**
	 * Refresh builder state for a new accepted facade configuration.
	 *
	 * @param {ConfigSnapshot} config - Supplies the accepted configuration
	 * snapshot.
	 * @returns {void}
	 */
	refreshConfig(config) {
		this._assertUsable();
		this._lastConfig = config;
	}

	/**
	 * Dispose resources owned by the runtime shader builder.
	 *
	 * @returns {void}
	 */
	dispose() {
		this._disposed = true;
	}
}
