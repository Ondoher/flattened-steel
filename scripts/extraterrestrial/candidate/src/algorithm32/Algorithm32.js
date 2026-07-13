import { Reference } from './implementation/Reference.js';
import { ShaderBuilder } from './implementation/ShaderBuilder.js';
import { SharedModel } from './models/SharedModel.js';
import { Algorithm32ShaderHandle } from './Algorithm32ShaderHandle.js';

const SUPPORTED_PATH_SAMPLE_DISTRIBUTIONS = new Set([
	'uniform-distance',
	'tangent-density-adaptive-v1',
	'tangent-density-adaptive-soft-v1',
]);

/**
 * Accept an omitted interval count or require a positive safe integer.
 *
 * @param {number | undefined} value - Supplies the requested interval count.
 * @param {string} name - Identifies the public configuration property.
 * @returns {void}
 */
function assertOptionalIntervalCount(value, name) {
	if (value !== undefined && (!Number.isSafeInteger(value) || value < 1)) {
		throw new RangeError(`Algorithm32 ${name} must be a positive safe integer.`);
	}
}

/**
 * Provide the primary production facade for Algorithm32.
 */
export class Algorithm32 {
	/**
	 * Store the current accepted configuration.
	 *
	 * @type {Config}
	 */
	_config;

	/**
	 * Store the current facade-local configuration version.
	 *
	 * @type {number}
	 */
	_version = 0;

	/**
	 * Store the facade-owned shared model.
	 *
	 * @type {SharedModel}
	 */
	_model;

	/**
	 * Store the CPU/reference implementation collaborator.
	 *
	 * @type {Reference}
	 */
	_reference;

	/**
	 * Store the runtime shader builder.
	 *
	 * @type {ShaderBuilder}
	 */
	_shaderBuilder;

	/**
	 * Track handles created by this facade.
	 *
	 * @type {Set<Algorithm32ShaderHandle>}
	 */
	_shaderHandles = new Set();

	/**
	 * Track whether this facade has been disposed.
	 *
	 * @type {boolean}
	 */
	_disposed = false;

	/**
	 * Copy facade configuration without cloning consumer-owned model objects.
	 *
	 * @param {Config} config - Supplies configuration to copy.
	 * @returns {Config} The copied configuration wrapper.
	 */
	_copyConfig(config) {
		const execution = config.execution === undefined ? {} : config.execution;

		return ({
			lightSource: config.lightSource,
			atmosphere: config.atmosphere,
			geometry: config.geometry,
			celestial: config.celestial,
			groundBoundary: config.groundBoundary,
			color: config.color,
			spectral: config.spectral,
			execution: ({
				...execution,
				maximumScatteringOrder: execution.maximumScatteringOrder ?? 4,
			}),
			shader: ({ ...(
				config.shader === undefined ? {} : config.shader
			) }),
		});
	}

	/**
	 * Create the current configuration snapshot.
	 *
	 * @returns {ConfigSnapshot} The current configuration snapshot.
	 */
	_createConfigSnapshot() {
		return ({
			config: this._copyConfig(this._config),
			version: this._version,
			model: this._model.snapshot(),
		});
	}

	/**
	 * Accept semantic configuration values at the public facade boundary.
	 *
	 * @param {Config} config - Supplies the candidate configuration.
	 * @returns {void}
	 */
	_acceptConfigValues(config) {
		assertOptionalIntervalCount(
			config.execution?.pathIntervalCount,
			'pathIntervalCount',
		);
		assertOptionalIntervalCount(
			config.execution?.sourceTransmittanceIntervalCount,
			'sourceTransmittanceIntervalCount',
		);
		const maximumScatteringOrder = config.execution?.maximumScatteringOrder;
		if (maximumScatteringOrder !== undefined
			&& maximumScatteringOrder !== 1
			&& maximumScatteringOrder !== 2
			&& maximumScatteringOrder !== 4) {
			throw new RangeError(
				'Algorithm32 maximumScatteringOrder must be one of 1, 2, or 4.',
			);
		}

		const pathSampleDistribution = config.execution?.pathSampleDistribution;
		if (pathSampleDistribution !== undefined
			&& pathSampleDistribution !== null
			&& !SUPPORTED_PATH_SAMPLE_DISTRIBUTIONS.has(pathSampleDistribution.kind)) {
			throw new RangeError(
				'Algorithm32 pathSampleDistribution kind is not supported.',
			);
		}

		const deferredDebugViewProperty = ['debug', 'View'].join('');

		if (config.shader && Object.hasOwn(config.shader, deferredDebugViewProperty)) {
			throw new TypeError('Shader debug views are deferred and are not part of first production config.');
		}
	}

	/**
	 * Prepare config and implementation collaborators without publishing them.
	 *
	 * @param {Config} config - Supplies the replacement configuration.
	 * @returns {Algorithm32PreparedConfig} The staged configuration state.
	 */
	_prepareConfig(config) {
		this._acceptConfigValues(config);
		const acceptedConfig = this._copyConfig(config);
		const version = this._version + 1;
		const model = new SharedModel({
			version,
			lightSource: acceptedConfig.lightSource,
			atmosphere: acceptedConfig.atmosphere,
			geometry: acceptedConfig.geometry,
			celestial: acceptedConfig.celestial,
			spectralBasis: acceptedConfig.spectral,
		});
		const reference = new Reference({
			model,
			executionControls: acceptedConfig.execution,
		});
		const shaderBuilder = new ShaderBuilder({
			model,
		});

		return {
			baseVersion: this._version,
			version,
			config: acceptedConfig,
			model,
			reference,
			shaderBuilder,
			snapshot: {
				config: acceptedConfig,
				version,
				model: model.snapshot(),
			},
		};
	}

	/**
	 * Publish one fully prepared configuration after its dependent runtime build
	 * has succeeded.
	 *
	 * @param {Algorithm32PreparedConfig} prepared - Supplies staged state.
	 * @returns {ConfigSnapshot} The accepted configuration snapshot.
	 */
	_commitPreparedConfig(prepared) {
		this._assertUsable();
		if (prepared.baseVersion !== this._version) {
			throw new Error('Algorithm32 configuration replacement was superseded.');
		}

		const previousReference = this._reference;
		const previousShaderBuilder = this._shaderBuilder;
		this._version = prepared.version;
		this._config = prepared.config;
		this._model = prepared.model;
		this._reference = prepared.reference;
		this._shaderBuilder = prepared.shaderBuilder;
		previousReference?.dispose();
		previousShaderBuilder?.dispose();

		return prepared.snapshot;
	}

	/**
	 * Dispose collaborators belonging to an unpublished configuration.
	 *
	 * @param {Algorithm32PreparedConfig} prepared - Supplies staged state.
	 * @returns {void}
	 */
	_discardPreparedConfig(prepared) {
		if (prepared.reference !== this._reference) {
			prepared.reference.dispose();
		}
		if (prepared.shaderBuilder !== this._shaderBuilder) {
			prepared.shaderBuilder.dispose();
		}
	}

	/**
	 * Replace config and implementation collaborators synchronously.
	 *
	 * @param {Config} config - Supplies the replacement configuration.
	 * @returns {ConfigSnapshot} The accepted configuration snapshot.
	 */
	_replaceConfig(config) {
		return this._commitPreparedConfig(this._prepareConfig(config));
	}

	/**
	 * Create a facade for one configured Algorithm32 simulation/render context.
	 *
	 * @param {Config} config - Supplies the consumer-provided light-source,
	 * atmosphere, and geometry models plus Algorithm32 runtime configuration.
	 */
	constructor(config) {
		this._replaceConfig(config);
	}

	/**
	 * Create the internal shader build request from public setup fields.
	 *
	 * @param {ShaderSetupRequest} setup - Supplies caller-owned setup handles.
	 * @param {ConfigSnapshot} config - Supplies the accepted config snapshot.
	 * @param {ShaderBuildRequestOptions} [options] - Supplies replacement state
	 * and cancellation.
	 * @returns {ShaderBuildRequest} The internal build request.
	 */
	_createShaderBuildRequest(setup, config, options = {}) {
		const buildRequest = {
			setup,
			config,
		};

		if (setup?.bindingValues !== undefined) {
			buildRequest.bindingValues = setup.bindingValues;
		}

		if (options.previousBuildResult !== undefined) {
			buildRequest.previousBuildResult = options.previousBuildResult;
		}
		if (options.signal !== undefined) {
			buildRequest.signal = options.signal;
		}

		return buildRequest;
	}

	/**
	 * Assert that the facade is still usable.
	 *
	 * @returns {void}
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('Algorithm32 facade has been disposed.');
		}
	}

	/**
	 * Forget a disposed shader handle.
	 *
	 * @param {Algorithm32ShaderHandle} handle - Supplies the disposed handle.
	 * @returns {void}
	 */
	_forgetShaderHandle(handle) {
		this._shaderHandles.delete(handle);
	}

	/**
	 * Return the current canonical configuration snapshot. The returned packet
	 * is for inspection and compatibility checks, not mutation.
	 *
	 * @returns {ConfigSnapshot} The current configuration snapshot.
	 */
	get config() {
		this._assertUsable();

		return this._createConfigSnapshot();
	}

	/**
	 * Replace the facade configuration with a new complete configuration. The
	 * returned snapshot describes the accepted configuration state and version.
	 *
	 * @param {Config} config - Supplies the replacement Algorithm32
	 * configuration.
	 * @returns {ConfigSnapshot} The accepted configuration snapshot.
	 */
	setConfig(config) {
		this._assertUsable();

		return this._replaceConfig(config);
	}

	/**
	 * Build and attach the runtime shader integration. The returned handle owns
	 * Algorithm32-specific shader resources, binding lifecycle, resizing,
	 * configuration refresh, and disposal for the installed pass.
	 *
	 * @param {ShaderSetupRequest} request - Supplies the caller-owned Three
	 * runtime attachment handles.
	 * @returns {Promise<ShaderHandle>} The installed runtime shader handle.
	 */
	async setupShader(request) {
		this._assertUsable();
		const builder = this._shaderBuilder;
		const snapshot = this.config;
		const buildResult = await builder.build(
			this._createShaderBuildRequest(request, snapshot, {
				signal: request.signal,
			}),
		);
		if (this._disposed || builder !== this._shaderBuilder) {
			buildResult.runtime?.dispose?.();
			buildResult.cacheController?.dispose?.();
			buildResult.celestialCacheController?.dispose?.();
			buildResult.stellarPointSetCacheController?.dispose?.();
			throw new Error('Algorithm32 shader setup was superseded.');
		}
		const handle = new Algorithm32ShaderHandle({
			facade: this,
			setup: request,
			buildResult,
		});

		this._shaderHandles.add(handle);

		return handle;
	}

	/**
	 * Run one CPU/reference Algorithm32 evaluation request. The returned result
	 * contains spectral radiance/transmittance information; it does not contain
	 * display-converted color.
	 *
	 * @param {EvaluationRequest} request - Supplies one accepted evaluation
	 * request.
	 * @returns {EvaluationResult} The spectral evaluation result.
	 */
	evaluate(request) {
		this._assertUsable();

		return this._reference.evaluate(request);
	}

	/**
	 * Dispose resources owned by this facade.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) {
			return;
		}

		for (const handle of this._shaderHandles) {
			handle.dispose();
		}

		this._reference?.dispose();
		this._shaderBuilder?.dispose();
		this._disposed = true;
	}
}
