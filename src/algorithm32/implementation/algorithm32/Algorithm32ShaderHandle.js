/**
 * Control one installed Algorithm32 runtime shader integration.
 */
export class Algorithm32ShaderHandle {
	/** Shared cache-object identities preserve cross-handle packet provenance. */
	static _receiverLightCacheIdentities = new WeakMap();
	/** Next shared cache identity; independent of handle rebuild generations. */
	static _nextReceiverLightCacheIdentity = 1;

	/** Called by receiver preparation to identify one installed cache object.
	 *
	 * @param {GpuScatteringCache} cache - Installed cache object.
	 * @returns {string} - Stable runtime-local cache identity.
	 */
	_receiverLightCacheIdentity(cache) {
		let identity = Algorithm32ShaderHandle._receiverLightCacheIdentities.get(cache);
		if (identity === undefined) {
			identity = `runtime-cache-${Algorithm32ShaderHandle._nextReceiverLightCacheIdentity}`;
			Algorithm32ShaderHandle._nextReceiverLightCacheIdentity += 1;
			Algorithm32ShaderHandle._receiverLightCacheIdentities.set(cache, identity);
		}
		return identity;
	}
	/**
	 * Creates a shader handle.
	 *
	 * @param {Algorithm32ShaderHandleState} state - Supplies facade, setup, and
	 * build state.
	 *
	 */
	constructor(state) {
		this._facade = state.facade;
		this._setup = state.setup;
		this._buildResult = state.buildResult;
		this._disposed = false;
		this._generation = 0;
		this._rebuildCancellation = null;
		this._renderer = null;
		this._receiverProgramRetention = {material: null, shaderSource: ''};
		this._receiverReducer = null;
	}

	/**
	 * Called by the shader handle to collect every independently owned controller from one build result.
	 *
	 * @param {ShaderBuildResult | null | undefined} buildResult - The build result whose controllers are collected.
	 * @returns {ShaderBuildOwnedCacheControllers} - The distinct controller collection.
	 */
	_cacheControllers(buildResult) {
		return /** @type {ShaderBuildOwnedCacheControllers} */ (
			[
				buildResult?.scatteringCacheController,
				buildResult?.distantSunCelestialCacheController,
				buildResult?.stellarPointSetCacheController,
				buildResult?.flatFiniteSunCacheController,
			].filter(
				/**
				 * Called by Array.prototype.filter to retain one owned cache controller.
				 *
				 * @param {ShaderBuildOwnedCacheController | null | undefined} controller - The candidate controller.
				 * @returns {controller is ShaderBuildOwnedCacheController} - Whether the controller is present.
				 */
				(controller) => controller !== null && controller !== undefined,
			)
		);
	}

	/**
	 * Called by algorithm32 shader handle to dispose runtime resources owned by the current build result.
	 *
	 * @param {ShaderBuildResult | null | undefined} buildResult - The build result whose resources are retired.
	 * @param {ShaderBuildPreservedCacheControllers} preservedControllers - The controllers retained by another build result.
	 * @returns {void} - No return value.
	 */
	_disposeBuildResult(buildResult = this._buildResult, preservedControllers = new Set()) {
		let disposalErrors = [];
		try {
			buildResult?.runtime?.dispose?.();
		} catch (error) {
			disposalErrors.push(error);
		}
		for (const controller of new Set(this._cacheControllers(buildResult))) {
			if (!preservedControllers.has(controller)) {
				try {
					controller.dispose();
				} catch (error) {
					disposalErrors.push(error);
				}
			}
		}
		if (disposalErrors.length === 1) {
			throw disposalErrors[0];
		}
		if (disposalErrors.length > 1) {
			throw new AggregateError(disposalErrors, 'Algorithm32 shader resource disposal failed.');
		}
	}

	/**
	 * Called by algorithm32 shader handle to assert that the handle is still usable.
	 *
	 * @returns {void} -
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('Algorithm32 shader handle has been disposed.');
		}
	}

	/**
	 * Call this method to replace facade config and refresh runtime shader resources. Replacement failure rejects while retaining the prior installed configuration; cancellation or supersession rejects with an abort error and callers must discard the rejected snapshot.
	 *
	 * @param {Config} config - Supplies the replacement facade config.
	 * @param {ConfigReplacementOptions} [options] - Supplies optional caller cancellation.
	 * @returns {Promise<ConfigSnapshot>} - The accepted config snapshot.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	async setConfig(config, options = {}) {
		this._assertUsable();
		if (options.signal?.aborted) {
			let error = new Error('Algorithm32 shader rebuild was aborted by the caller.');
			error.name = 'AbortError';
			throw error;
		}
		this._generation += 1;
		const generation = this._generation;
		this._rebuildCancellation?.abort();
		const cancellation = new AbortController();
		const abortFromCaller = () => cancellation.abort();
		options.signal?.addEventListener('abort', abortFromCaller, {once: true});
		this._rebuildCancellation = cancellation;
		const prepared = this._facade._prepareConfig(config);
		let nextBuildResult = null;
		let committed = false;

		try {
			nextBuildResult = await prepared.shaderBuilder.build(
				this._facade._createShaderBuildRequest(this._setup, prepared.snapshot, {
					previousBuildResult: this._buildResult,
					signal: cancellation.signal,
				}),
			);
			if (this._renderer) {
				await nextBuildResult.runtime?.prepare?.(this._renderer);
			}
			if (this._disposed || cancellation.signal.aborted || generation !== this._generation) {
				let error = new Error('Algorithm32 shader rebuild was superseded.');
				error.name = 'AbortError';
				throw error;
			}

			const snapshot = this._facade._commitPreparedConfig(prepared);
			committed = true;
			const previousBuildResult = this._buildResult;
			this._buildResult = nextBuildResult;
			this._disposeBuildResult(previousBuildResult, new Set(this._cacheControllers(nextBuildResult)));

			return snapshot;
		} catch (error) {
			if (!committed) {
				if (nextBuildResult) {
					this._disposeBuildResult(nextBuildResult, new Set(this._cacheControllers(this._buildResult)));
				}
				this._facade._discardPreparedConfig(prepared);
			}
			throw error;
		} finally {
			options.signal?.removeEventListener('abort', abortFromCaller);
			if (this._rebuildCancellation === cancellation) {
				this._rebuildCancellation = null;
			}
		}
	}

	/**
	 * Call this method to prepare the installed runtime program for a nonblocking first frame. Preparation rejects when the handle is disposed or runtime compilation fails; it is not cancellable once started.
	 *
	 * @param {ShaderRuntimePassRenderer} renderer - Supplies the runtime renderer.
	 * @returns {Promise<void>} - Resolve when the runtime program is ready.
	 */
	async prepare(renderer) {
		this._assertUsable();
		await this._buildResult.runtime?.prepare?.(renderer);
		this._renderer = renderer;
	}

	/** Call this method to measure a complete candidate receiver state without altering the visible facade.
	 *
	 * @param {Algorithm32ReceiverPreparationRequest} request - Candidate geometry, source, cache, and GPU capabilities.
	 * @returns {Promise<ReceiverEnvironmentLightMeasurement>} - Complete unpublished receiver measurement.
	 */
	async prepareReceiverEnvironmentLight(request) {
		this._assertUsable();
		request.signal?.throwIfAborted();
		const model = Object.create(this._facade._model);
		Object.defineProperties(model, {
			geometry: {value: request.geometry},
			lightSource: {value: request.lightSource},
			celestialSources: {value: null},
		});
		const calculator = new LocalLightLevelCalculator({lightSource: request.lightSource});
		const roster = this._facade._model.celestialSources;
		const candidateSource = /** @type {LightSourceModel & DistantSunCelestialSource} */ (request.lightSource);
		if (roster?.family === 'spherical-sun-stars-radial-v1' && candidateSource.kind !== 'distant-uniform-sun')
			throw new RangeError('Distant receiver preparation requires its paired distant source.');
		const candidateRoster =
			roster?.family === 'spherical-sun-stars-radial-v1' ? {...roster, sun: candidateSource} : null;
		const directLight = calculator.measureConfiguredReceiverDirectLight({
			geometry: request.geometry,
			atmosphere: model.atmosphere,
			observation: request.observation,
			celestialSources: candidateRoster,
		});
		if (request.environmentSample) {
			return calculator.combineReceiverLight({
				identity: request.identity,
				directNormal: directLight.directNormal,
				directHorizontal: directLight.directHorizontal,
				diffuseHorizontal: request.environmentSample.diffuseHorizontal,
				stellarAdaptationLuminance: request.environmentSample.stellarAdaptationLuminance,
			});
		}
		const controller = new ReceiverEnvironmentLightController({
			calculator,
			directLight,
			identity: request.identity,
		});
		const sampler = new ReceiverEnvironmentLightTransportSampler({
			THREE: request.THREE,
			renderer: request.renderer,
			backend: request.backend,
			model,
			scatteringCache: request.scatteringCache,
			programRetention: this._receiverProgramRetention,
		});
		const reducer = (this._receiverReducer ??= new ReceiverEnvironmentLightGpuReducer({
			backend: request.backend,
			retainProgram: true,
		}));
		try {
			const measurement = await controller.build({
				identity: request.identity,
				signal: request.signal,
				sampleIncomingRadiance: () => sampler.sample({signal: request.signal}),
				reduceIncomingRadiance: (radiances) => reducer.reduce({radiances, signal: request.signal}),
			});
			this._assertUsable();
			request.signal?.throwIfAborted();
			return measurement;
		} finally {
			controller.dispose();
		}
	}

	/** Call this method to install complete receiver light and celestial observation at the live scene boundary.
	 *
	 * @param {ReceiverEnvironmentLightMeasurement} measurement - Complete candidate lighting.
	 * @param {GeometryObservation} observation - Matching accepted observation.
	 * @returns {void}
	 */
	publishReceiverEnvironmentLight(measurement, observation) {
		this._assertUsable();
		this._facade._adoptPreparedReceiverLight(measurement);
		this._buildResult.runtime?.publishObservation?.(observation);
	}

	/** Call this method to measure the active common-path environment and publish complete receiver light atomically. */
	async measureReceiverEnvironmentLight({THREE, renderer, backend, signal, diagnostics = false}) {
		this._assertUsable();
		const buildResult = this._buildResult;
		const scatteringCache = buildResult.scatteringCache;
		if (!scatteringCache)
			throw new Error('Receiver environment-light measurement requires an active scattering cache.');
		const measurementModel = Object.create(this._facade._model);
		Object.defineProperty(measurementModel, 'celestialSources', {value: null, enumerable: true});
		const sampler = new ReceiverEnvironmentLightTransportSampler({
			THREE,
			renderer,
			backend,
			model: measurementModel,
			scatteringCache,
			programRetention: this._receiverProgramRetention,
		});
		const reducer = (this._receiverReducer ??= new ReceiverEnvironmentLightGpuReducer({
			backend,
			retainProgram: true,
		}));
		const residentPromise = diagnostics
			? backend.readRuntimeBindingField(scatteringCache.getRuntimeBindings().bindings[0])
			: null;
		let gpuRadiancesPromise = null;
		const sampleGpuRadiances = () => (gpuRadiancesPromise ??= sampler.sample({signal}));
		const measurement = await this._facade._publishReceiverEnvironmentLight({
			identity: `receiver-environment-light:model-${buildResult.modelVersion}:profile-${this._facade._model.profile.contentHash}:${this._receiverLightCacheIdentity(scatteringCache)}`,
			signal,
			sampleIncomingRadiance: sampleGpuRadiances,
			reduceIncomingRadiance: (radiances) => reducer.reduce({radiances, signal}),
		});
		if (!diagnostics) return measurement;
		const gpuRadiances = await sampleGpuRadiances();
		const resident = await residentPromise;
		const basis = this._facade._model.spectral.basis;
		const geometry = this._facade._model.geometry;
		const cpuCache = {
			sampleProvenanceIdentity: 'receiver-environment-live-cache-readback-oracle',
			sampleCumulativeScatteringDensity(request) {
				const positionStencil = geometry.resolveScatteringCachePositionStencil({
					position: request.context.position,
					atmosphereCoordinate: request.context.atmosphereCoordinate,
				});
				const directionStencil = geometry.resolveScatteringCacheDirectionStencil({
					position: request.context.position,
					physicalOutgoingDirection: request.context.physicalOutgoingDirection,
				});
				let values = new Float64Array(basis.channelCount);
				for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
					for (let directionTap = 0; directionTap < directionStencil.indices.length; directionTap += 1) {
						const positionIndex = positionStencil.indices[positionTap];
						const directionIndex = directionStencil.indices[directionTap];
						const weight = positionStencil.weights[positionTap] * directionStencil.weights[directionTap];
						for (let channelIndex = 0; channelIndex < basis.channelCount; channelIndex += 1) {
							values[channelIndex] +=
								resident.values[
									(channelIndex * resident.storage.height + positionIndex) * resident.storage.width +
										directionIndex
								] * weight;
						}
					}
				}
				return /** @type {SpectralScatteringDensityPacket} */ (
					new SpectralPacket({
						basis,
						quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
						units: SPECTRAL_UNITS.SCATTERING_DENSITY,
						semantics: basis.semantics,
						values,
						provenanceIdentity: 'receiver-environment-live-cache-readback-oracle',
					})
				);
			},
			dispose() {},
		};
		const cpuRadiances = new ReceiverEnvironmentLightTransportCpuSampler({
			reference: new Reference({model: this._facade._model, scatteringCache: cpuCache}),
		}).sample();
		const cpuIrradiance = this._facade._localLightLevelCalculator.measureEnvironmentIrradiance({
			samples: cpuRadiances.map((spectralRadiance, index) => ({
				spectralRadiance,
				irradianceWeightSteradians: RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE[index].irradianceWeightSteradians,
			})),
		});
		const cpuReceiverLight = this._facade._localLightLevelCalculator.combineReceiverLight({
			identity: `${measurement.identity}:cpu-diagnostic`,
			directNormal: measurement.directNormal,
			directHorizontal: measurement.directHorizontal,
			diffuseHorizontal: cpuIrradiance,
		});
		const cpuBrightnessProxy = cpuReceiverLight.totalHorizontalLuminanceProxy;
		const reference = new Reference({model: this._facade._model, scatteringCache: cpuCache});
		const ferwerda = new FerwerdaColorDisplayModel({
			adaptation: {
				kind: FERWERDA_ADAPTATION_KINDS.BRIGHTNESS_PROXY,
				luminance: cpuBrightnessProxy,
				provenanceId: 'live-stage-diagnostic',
			},
		});
		const bruneton = new BrunetonColorDisplayModel();
		const camera = /** @type {any} */ (buildResult.setup.camera);
		camera.updateProjectionMatrix?.();
		camera.updateMatrixWorld?.();
		const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
		const stageRays = [
			{id: 'upper-sky', ndc: [0, 0.5]},
			{id: 'center-sky', ndc: [0, 0]},
			{id: 'sunset-horizon', ndc: [0, -0.55]},
			{id: 'side-horizon', ndc: [0.65, -0.55]},
		].map(({id, ndc}) => {
			const point = new THREE.Vector3(ndc[0], ndc[1], 0.5).unproject(camera);
			const sceneDirection = point.sub(cameraPosition).normalize();
			const modelDirection = this._facade._model.geometry.mapObserverLocalSceneDirectionToModelDirection([
				sceneDirection.x,
				sceneDirection.y,
				sceneDirection.z,
			]);
			const spectrum = reference.evaluate({viewRay: {direction: modelDirection}}).pathRadiance;
			const linearSrgb = ferwerda.radianceToLinearSrgb(spectrum);
			const luminance = linearSrgb.reduce(
				(sum, value, index) => sum + Math.max(0, value) * [0.2126, 0.7152, 0.0722][index],
				0,
			);
			const cone = linearSrgb.map((value) => ferwerda.parameters.coneScale * Math.max(0, value));
			const rod = ferwerda.parameters.rodScale * ferwerda.parameters.rodBlend * luminance;
			const normalized = cone.map((value) =>
				Math.min(1, Math.max(0, (value + rod) / ferwerda.parameters.displayMaximumLuminance)),
			);
			return {
				id,
				ndc,
				spectrum: Array.from(spectrum.values),
				linearSrgb,
				luminance,
				parameters: ferwerda.parameters,
				cone,
				rod,
				normalized,
				ferwerdaDisplayRgb: ferwerda.linearSrgbToDisplayRgb(linearSrgb),
				brunetonDisplayRgb: bruneton.linearSrgbToDisplayRgb(
					/** @type {readonly [number, number, number]} */ (/** @type {unknown} */ (linearSrgb)),
				),
			};
		});
		return {
			...measurement,
			diagnostics: {
				gpuRadiances: gpuRadiances.map((packet) => Array.from(packet.values)),
				cpuRadiances: cpuRadiances.map((packet) => Array.from(packet.values)),
				gpuDiffuseHorizontal: Array.from(measurement.diffuseHorizontal.values),
				cpuDiffuseHorizontal: Array.from(cpuIrradiance.values),
				gpuTotalHorizontal: Array.from(measurement.totalHorizontal.values),
				cpuTotalHorizontal: Array.from(cpuReceiverLight.totalHorizontal.values),
				gpuTotalHorizontalIlluminanceLux: measurement.photopicTotalHorizontalIlluminance.value,
				cpuTotalHorizontalIlluminanceLux: cpuReceiverLight.photopicTotalHorizontalIlluminance.value,
				stageRays,
			},
		};
	}

	/** Call this method to mark renderer-owned celestial view products incompatible without rebuilding the shader graph. */
	markCelestialViewDirty() {
		this._assertUsable();
		this._buildResult.celestialGenerationParticipant?.markDirty('view');
	}

	/** Call this method to invalidate renderer-owned celestial handles after WebGL context loss. */
	handleContextLoss() {
		this._assertUsable();
		this._receiverProgramRetention.material?.dispose();
		this._receiverProgramRetention.material = null;
		this._receiverReducer?.dispose();
		this._receiverReducer = null;
		this._buildResult.celestialGenerationParticipant?.handleContextLoss();
	}

	/** Call this method to require normal celestial regeneration after WebGL context restoration. */
	handleContextRestoration() {
		this._assertUsable();
		this._buildResult.celestialGenerationParticipant?.handleContextRestoration();
	}

	/**
	 * Call this method to return runtime shader diagnostics. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @returns {unknown} - Runtime or deferred diagnostics.
	 */
	getDiagnostics() {
		this._assertUsable();

		if (this._buildResult.runtime) {
			return {
				status: 'installed',
				modelVersion: this._buildResult.modelVersion,
				runtime: this._buildResult.runtime.getDiagnostics(),
			};
		}

		return {
			status: 'deferred',
			modelVersion: this._buildResult.modelVersion,
		};
	}

	/**
	 * Call this method to dispose resources owned by this handle.
	 *
	 * @returns {void} -
	 */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this._generation += 1;
		this._rebuildCancellation?.abort();
		this._rebuildCancellation = null;
		const buildResult = this._buildResult;
		this._receiverProgramRetention.material?.dispose();
		this._receiverProgramRetention.material = null;
		this._receiverReducer?.dispose();
		this._receiverReducer = null;
		this._buildResult = null;
		try {
			this._disposeBuildResult(buildResult);
		} finally {
			this._facade._forgetShaderHandle(this);
		}
	}
}
import {ReceiverEnvironmentLightGpuReducer} from '../scene-lighting/ReceiverEnvironmentLightGpuReducer.js';
import {LocalLightLevelCalculator} from '../scene-lighting/LocalLightLevelCalculator.js';
import {ReceiverEnvironmentLightController} from '../scene-lighting/ReceiverEnvironmentLightController.js';
import {ReceiverEnvironmentLightTransportCpuSampler} from '../scene-lighting/ReceiverEnvironmentLightTransportCpuSampler.js';
import {ReceiverEnvironmentLightTransportSampler} from '../scene-lighting/ReceiverEnvironmentLightTransportSampler.js';
import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from '../scene-lighting/ReceiverEnvironmentLightQuadrature.js';
import {Reference} from '../../reference-execution/Reference.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../spectral-values/index.js';
import {FerwerdaColorDisplayModel} from '../ferwerda-color/FerwerdaColorDisplayModel.js';
import {FERWERDA_ADAPTATION_KINDS} from '../ferwerda-color/consts.js';
import {BrunetonColorDisplayModel} from '../bruneton-color/BrunetonColorDisplayModel.js';
