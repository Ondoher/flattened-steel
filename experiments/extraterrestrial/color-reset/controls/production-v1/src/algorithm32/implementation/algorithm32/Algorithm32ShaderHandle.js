/**
 * Control one installed Algorithm32 runtime shader integration.
 */
export class Algorithm32ShaderHandle {
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
		const disposalErrors = [];
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
			const error = new Error('Algorithm32 shader rebuild was aborted by the caller.');
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
				const error = new Error('Algorithm32 shader rebuild was superseded.');
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

	/** Measure the active common-path environment and publish its Ferwerda proxy atomically. */
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
		});
		const reducer = new ReceiverEnvironmentLightGpuReducer({backend});
		const residentPromise = diagnostics
			? backend.readRuntimeBindingField(scatteringCache.getRuntimeBindings().bindings[0])
			: null;
		let gpuRadiancesPromise = null;
		const sampleGpuRadiances = () => (gpuRadiancesPromise ??= sampler.sample({signal}));
		const measurement = await this._facade._publishReceiverEnvironmentLight({
			identity: `receiver-environment-light:model-${buildResult.modelVersion}:${buildResult.scatteringCacheControllerIdentity ?? 'active-cache'}`,
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
				const values = new Float64Array(basis.channelCount);
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
		const cpuBrightnessProxy =
			this._facade._localLightLevelCalculator.measureDirectIrradiance(cpuIrradiance).adaptingLuminanceProxy;
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
				gpuIrradiance: Array.from(measurement.spectralIrradiance.values),
				cpuIrradiance: Array.from(cpuIrradiance.values),
				gpuBrightnessProxy: measurement.brightnessProxy.value,
				cpuBrightnessProxy: cpuBrightnessProxy.value,
				stageRays,
			},
		};
	}

	/** Mark renderer-owned celestial view products incompatible without rebuilding the shader graph. */
	markCelestialViewDirty() {
		this._assertUsable();
		this._buildResult.celestialGenerationParticipant?.markDirty('view');
	}

	/** Invalidate renderer-owned celestial handles after WebGL context loss. */
	handleContextLoss() {
		this._assertUsable();
		this._buildResult.celestialGenerationParticipant?.handleContextLoss();
	}

	/** Require normal celestial regeneration after WebGL context restoration. */
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
		this._buildResult = null;
		try {
			this._disposeBuildResult(buildResult);
		} finally {
			this._facade._forgetShaderHandle(this);
		}
	}
}
import {ReceiverEnvironmentLightGpuReducer} from '../scene-lighting/ReceiverEnvironmentLightGpuReducer.js';
import {ReceiverEnvironmentLightTransportCpuSampler} from '../scene-lighting/ReceiverEnvironmentLightTransportCpuSampler.js';
import {ReceiverEnvironmentLightTransportSampler} from '../scene-lighting/ReceiverEnvironmentLightTransportSampler.js';
import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from '../scene-lighting/ReceiverEnvironmentLightQuadrature.js';
import {Reference} from '../../reference-execution/Reference.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../spectral-values/index.js';
import {FerwerdaColorDisplayModel} from '../ferwerda-color/FerwerdaColorDisplayModel.js';
import {FERWERDA_ADAPTATION_KINDS} from '../ferwerda-color/consts.js';
import {BrunetonColorDisplayModel} from '../bruneton-color/BrunetonColorDisplayModel.js';
