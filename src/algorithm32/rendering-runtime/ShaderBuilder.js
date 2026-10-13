import {Algorithm32ShaderAssembler} from '../shader-assembly/runtime/Algorithm32ShaderAssembler.js';
import {Algorithm32Transport as DefaultAlgorithm32Transport} from '../atmospheric-transport/Algorithm32Transport.js';
import DistanceMath from '../math/DistanceMath.js';
import SceneMath from '../math/SceneMath.js';
import {PixelMath} from '../math/PixelMath.js';
import {ShaderAssemblyPreparer} from './ShaderAssemblyPreparer.js';
import {EMPTY_SHADER_BUILD_CONTEXT} from './consts.js';
import {ShaderRuntimeInstaller} from './three/ShaderRuntimeInstaller.js';

/** Renderer-facing coordinator for Algorithm32 runtime shader builds. */
export class ShaderBuilder {
	/**
	 * Facade-owned shared model consumed by shader builds.
	 *
	 * @type {SharedModel}
	 */
	_model;

	/**
	 * Deterministic assembly-preparation collaborator.
	 *
	 * @type {ShaderAssemblyPreparer}
	 */
	_assemblyPreparer;

	/**
	 * Three runtime-installation collaborator.
	 *
	 * @type {ShaderRuntimeInstaller}
	 */
	_runtimeInstaller;

	/**
	 * Last accepted facade configuration snapshot.
	 *
	 * @type {ConfigSnapshot | undefined}
	 */
	_lastConfig;

	/**
	 * Whether this builder has been disposed.
	 *
	 * @type {boolean}
	 */
	_disposed = false;

	/**
	 * Creates a runtime shader build coordinator for one facade-owned model.
	 *
	 * @param {ShaderBuilderDependencies} dependencies - The shared model and optional implementation collaborators.
	 */
	constructor(dependencies) {
		this._model = dependencies.model;
		const assembler =
			dependencies.assembler === undefined ? new Algorithm32ShaderAssembler() : dependencies.assembler;
		const transport =
			dependencies.transport === undefined ? new DefaultAlgorithm32Transport() : dependencies.transport;
		this._assemblyPreparer = new ShaderAssemblyPreparer({
			model: this._model,
			assembler,
			transport,
		});
		this._runtimeInstaller = new ShaderRuntimeInstaller(this._model);
	}

	/**
	 * Facade-owned shared model consumed by shader builds.
	 *
	 * @returns {SharedModel} - The shared model.
	 */
	get model() {
		return this._model;
	}

	/**
	 * Called by ShaderBuilder request validation to accept an optional scene scale.
	 *
	 * @param {unknown} value - The candidate scene scale.
	 * @param {string} label - The diagnostic label.
	 * @returns {void} - No return value.
	 */
	_acceptSceneScale(value, label) {
		if (value !== undefined) {
			SceneMath.assertSceneScale(value, label);
		}
	}

	/**
	 * Called by ShaderBuilder request validation to accept an optional positive distance.
	 *
	 * @param {unknown} value - The candidate distance.
	 * @param {string} label - The diagnostic label.
	 * @returns {void} - No return value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_acceptPositiveDistance(value, label) {
		if (value === undefined) {
			return;
		}

		DistanceMath.assertDistance(value, label);

		if (DistanceMath.toMeters(/** @type {Distance} */ (value)) <= 0) {
			throw new RangeError(`${label} must be positive.`);
		}
	}

	/**
	 * Called by ShaderBuilder request validation to accept an optional facade configuration snapshot.
	 *
	 * @param {unknown} value - The candidate configuration snapshot.
	 * @returns {void} - No return value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_acceptShaderBuildConfig(value) {
		if (value === undefined) {
			return;
		}

		const snapshot = /** @type {ConfigSnapshot} */ (value);
		const shader = snapshot.config.shader;

		if (shader !== undefined) {
			if (shader.mode !== undefined && (typeof shader.mode !== 'string' || shader.mode.trim().length === 0)) {
				throw new TypeError('Shader build config.shader.mode must be a non-empty string when supplied.');
			}

			this._acceptSceneScale(shader.sceneScale, 'Shader build config.shader.sceneScale');
			this._acceptPositiveDistance(shader.sceneDepthMax, 'Shader build config.shader.sceneDepthMax');
		}
	}

	/**
	 * Called by ShaderBuilder request validation to accept runtime scene-capture options.
	 *
	 * @param {ShaderSetupRequest} setup - The setup request.
	 * @returns {void} - No return value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_acceptShaderSetupOptions(setup) {
		this._acceptSceneScale(setup.sceneScale, 'Shader setup sceneScale');
		this._acceptPositiveDistance(setup.sceneDepthMax, 'Shader setup sceneDepthMax');

		if (setup.performanceCallback !== undefined && typeof setup.performanceCallback !== 'function') {
			throw new TypeError('Shader setup performanceCallback must be a function when supplied.');
		}
	}

	/**
	 * Called by ShaderBuilder request validation to accept optional build and setup values.
	 *
	 * @param {ShaderBuildRequest} request - The candidate build request.
	 * @returns {void} - No return value.
	 */
	_acceptShaderBuildRequestOptions(request) {
		this._acceptShaderBuildConfig(request.config);
		this._acceptShaderSetupOptions(request.setup);
	}

	/**
	 * Called by ShaderBuilder public operations to reject use after disposal.
	 *
	 * @returns {void} - No return value.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('ShaderBuilder has been disposed.');
		}
	}

	/**
	 * Called by ShaderBuilder.build to validate setup-time attachment and automatic-cache requirements.
	 *
	 * @param {ShaderBuildRequest} request - The candidate build request.
	 * @returns {void} - No return value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_assertBuildRequest(request) {
		const {setup} = request;

		PixelMath.acceptPixelSize(setup.viewportSize, 'Shader setup viewportSize');
		this._acceptShaderBuildRequestOptions(request);

		if (
			!this._assemblyPreparer.hasAssemblyInputs(request) &&
			this._assemblyPreparer.canAssembleFromConfiguredModel() &&
			!setup.cacheBackend
		) {
			throw new TypeError('Configured Algorithm32 shader setup requires cacheBackend.');
		}
	}

	/**
	 * Called by ShaderBuilder.build to create the source-cache lifecycle context for automatic assembly.
	 * Cache construction rejection or cancellation is propagated after a newly created controller is disposed. Callers must discard a rejected result and treat cancellation as an incomplete operation.
	 *
	 * @param {ShaderBuildRequest} request - The accepted build request.
	 * @returns {Promise<ShaderBuildContext>} - The setup-time build context.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	async _createBuildContext(request) {
		if (
			this._assemblyPreparer.hasAssemblyInputs(request) ||
			!this._assemblyPreparer.canAssembleFromConfiguredModel()
		) {
			return EMPTY_SHADER_BUILD_CONTEXT;
		}

		const scatteringCacheControllerIdentity = {
			source: this.model.lightSource,
			backend: request.setup.cacheBackend,
			scheduler: request.setup.cacheBuildScheduler ?? null,
		};
		const previous = request.previousBuildResult;
		const previousIdentity = previous?.scatteringCacheControllerIdentity;
		const canReuseController = Boolean(
			previous?.scatteringCacheController &&
			previousIdentity &&
			previousIdentity.source === scatteringCacheControllerIdentity.source &&
			previousIdentity.backend === scatteringCacheControllerIdentity.backend &&
			previousIdentity.scheduler === scatteringCacheControllerIdentity.scheduler,
		);

		const scatteringCacheController = canReuseController
			? previous.scatteringCacheController
			: this.model.lightSource.createCacheController({
					model: this.model,
					backend: request.setup.cacheBackend,
					scheduler: request.setup.cacheBuildScheduler,
				});

		/** @type {DistantSunCelestialCacheController | null} */
		let distantSunCelestialCacheController = null;
		/** @type {DistantSunCelestialCacheResource | null} */
		let distantSunCelestialCache = null;
		/** @type {DistantSunCelestialCacheControllerIdentity | null} */
		let distantSunCelestialCacheIdentity = null;
		let createdDistantSunCelestialCacheController = false;
		/** @type {StellarPointSetCacheController | null} */
		let stellarPointSetCacheController = null;
		/** @type {StellarPointSetCacheResource | null} */
		let stellarPointSetCache = null;
		/** @type {StellarPointSetCacheControllerIdentity | null} */
		let stellarPointSetCacheIdentity = null;
		let createdStellarPointSetCacheController = false;
		/** @type {FlatFiniteSunCacheController | null} */
		let flatFiniteSunCacheController = null;
		/** @type {FlatFiniteSunCacheResource | null} */
		let flatFiniteSunCache = null;
		/** @type {FlatFiniteSunCacheControllerIdentity | null} */
		let flatFiniteSunCacheIdentity = null;
		let createdFlatFiniteSunCacheController = false;
		/** @type {CelestialQueryPacket | null} */
		let celestialQueryPacket = null;

		try {
			const scatteringCache = await scatteringCacheController.createScatteringCache({
				signal: request.signal,
				...(request.setup.otherOwnedGpuBytes === undefined
					? {}
					: {otherOwnedGpuBytes: request.setup.otherOwnedGpuBytes}),
			});
			const roster = this.model.celestialSources;

			if (roster != null) {
				const geometry = /** @type {GeometryModel & CelestialGeometryCapability} */ (this.model.geometry);
				const observation = this.model.profile.models.sourcePlacement.observation;
				const placements = geometry.resolveCelestialPlacements({roster, observation});
				celestialQueryPacket = geometry.createCelestialQueryPacket(roster, placements);
			}

			return {
				automaticAssembly: true,
				scatteringCacheController,
				scatteringCache,
				scatteringCacheControllerIdentity,
				createdScatteringCacheController: !canReuseController,
				distantSunCelestialCacheController,
				distantSunCelestialCache,
				distantSunCelestialCacheIdentity,
				createdDistantSunCelestialCacheController,
				celestialQueryPacket,
				stellarPointSetCacheController,
				stellarPointSetCache,
				stellarPointSetCacheIdentity,
				createdStellarPointSetCacheController,
				flatFiniteSunCacheController,
				flatFiniteSunCache,
				flatFiniteSunCacheIdentity,
				createdFlatFiniteSunCacheController,
				mainRequiredSymbols: this._assemblyPreparer.mainRequiredShaderSymbols(roster != null),
			};
		} catch (error) {
			try {
				this._disposeCreatedCacheControllers({
					...EMPTY_SHADER_BUILD_CONTEXT,
					scatteringCacheController,
					createdScatteringCacheController: !canReuseController,
					distantSunCelestialCacheController,
					createdDistantSunCelestialCacheController,
					stellarPointSetCacheController,
					createdStellarPointSetCacheController,
					flatFiniteSunCacheController,
					createdFlatFiniteSunCacheController,
				});
			} catch (cleanupError) {
				throw new AggregateError(
					[error, cleanupError],
					'Cache construction and controller cleanup both failed.',
				);
			}
			throw error;
		}
	}

	/**
	 * Called by ShaderBuilder failure handling to dispose every distinct controller created by an incomplete build.
	 *
	 * @param {ShaderBuildContext} buildContext - The incomplete automatic-build context.
	 * @returns {void} - No return value.
	 * @throws {Error} - When one controller cannot be disposed.
	 * @throws {AggregateError} - When multiple controllers cannot be disposed.
	 */
	_disposeCreatedCacheControllers(buildContext) {
		/** @type {Set<ShaderBuildOwnedCacheController>} */
		const createdControllers = new Set();
		if (buildContext.createdScatteringCacheController && buildContext.scatteringCacheController) {
			createdControllers.add(buildContext.scatteringCacheController);
		}
		if (buildContext.createdDistantSunCelestialCacheController && buildContext.distantSunCelestialCacheController) {
			createdControllers.add(buildContext.distantSunCelestialCacheController);
		}
		if (buildContext.createdStellarPointSetCacheController && buildContext.stellarPointSetCacheController) {
			createdControllers.add(buildContext.stellarPointSetCacheController);
		}
		if (buildContext.createdFlatFiniteSunCacheController && buildContext.flatFiniteSunCacheController) {
			createdControllers.add(buildContext.flatFiniteSunCacheController);
		}

		const disposalErrors = [];
		for (const controller of createdControllers) {
			try {
				controller.dispose();
			} catch (error) {
				disposalErrors.push(error);
			}
		}
		if (disposalErrors.length === 1) {
			throw disposalErrors[0];
		}
		if (disposalErrors.length > 1) {
			throw new AggregateError(disposalErrors, 'Shader build controller disposal failed.');
		}
	}

	/**
	 * Call this method to build the runtime shader artifacts needed by a Three composer attachment.
	 * The promise rejects for invalid setup, incompatible shader declarations, runtime installation failure,
	 * or source-cache cancellation, disposing only lifecycle resources created by the failed build. Callers must discard a rejected result and treat cancellation as an incomplete operation.
	 *
	 * @param {ShaderBuildRequest} request - The accepted shader build request.
	 * @returns {Promise<ShaderBuildResult>} - The built runtime shader artifact packet.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	async build(request) {
		this._assertUsable();
		this._assertBuildRequest(request);

		const buildContext = await this._createBuildContext(request);

		try {
			const assembly = this._assemblyPreparer.assembleIfRequested(request, buildContext);
			const runtime = assembly ? this._runtimeInstaller.install(request, assembly, buildContext) : null;
			/** @type {ShaderBuildResult} */
			const result = {
				modelVersion: this.model.version,
				setup: request.setup,
				...(assembly ? {assembly, bindingRequirements: assembly.bindingRequirements} : {}),
				...(runtime ? {runtime} : {}),
				...(runtime?.celestialGenerationParticipant
					? {celestialGenerationParticipant: runtime.celestialGenerationParticipant}
					: {}),
				scatteringCacheController: buildContext.scatteringCacheController,
				scatteringCache: buildContext.scatteringCache,
				scatteringCacheControllerIdentity: buildContext.scatteringCacheControllerIdentity,
				distantSunCelestialCacheController: buildContext.distantSunCelestialCacheController,
				distantSunCelestialCache: buildContext.distantSunCelestialCache,
				distantSunCelestialCacheIdentity: buildContext.distantSunCelestialCacheIdentity,
				stellarPointSetCacheController: buildContext.stellarPointSetCacheController,
				stellarPointSetCache: buildContext.stellarPointSetCache,
				stellarPointSetCacheIdentity: buildContext.stellarPointSetCacheIdentity,
				flatFiniteSunCacheController: buildContext.flatFiniteSunCacheController,
				flatFiniteSunCache: buildContext.flatFiniteSunCache,
				flatFiniteSunCacheIdentity: buildContext.flatFiniteSunCacheIdentity,
				diagnostics: {
					status: runtime ? 'installed' : assembly ? 'assembled' : 'deferred',
				},
			};

			return result;
		} catch (error) {
			try {
				this._disposeCreatedCacheControllers(buildContext);
			} catch (cleanupError) {
				throw new AggregateError(
					[error, cleanupError],
					'Algorithm32 shader build and controller cleanup both failed.',
				);
			}
			throw error;
		}
	}

	/**
	 * Call this method to retain a new accepted facade configuration snapshot.
	 *
	 * @param {ConfigSnapshot} config - The accepted configuration snapshot.
	 * @returns {void} - No return value.
	 */
	refreshConfig(config) {
		this._assertUsable();
		this._lastConfig = config;
	}

	/**
	 * Call this method to terminate the runtime shader build coordinator lifecycle.
	 *
	 * @returns {void} - No return value.
	 */
	dispose() {
		this._disposed = true;
	}
}
