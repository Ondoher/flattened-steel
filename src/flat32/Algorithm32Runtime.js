import * as THREE from 'three';

import {Algorithm32Bindings, ThreeCacheBackend} from '../algorithm32/implementation/index.js';
import {SceneMath} from '../algorithm32/math/index.js';
import {SphericalDistantMode} from './SphericalDistantMode.js';
import DistantSunSharedCache from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCache.js';

/**
 * Own one transactional production Algorithm32 attachment for Flat32.
 *
 * @implements {Flat32AlgorithmRuntimeCapability}
 */
export class Algorithm32Runtime {
	/**
	 * Creates one runtime candidate with independently owned scene and endpoint capabilities.
	 *
	 * @param {Flat32RuntimeConfiguration} configuration - Scene, mode and lifecycle collaborators.
	 */
	constructor(configuration) {
		this._sceneRuntime = configuration.sceneRuntime;
		this._endpointScene = configuration.endpointScene;
		this._mode = configuration.mode;
		this._onFailure = configuration.onFailure;
		this._preparedComposer = configuration.composer ?? null;
		this._preparedRenderTarget = configuration.composerRenderTarget ?? null;
		this._deferPublication = configuration.deferPublication === true;
		this._atmosphereEnabled = configuration.atmosphereEnabled !== false;
		this._performanceCallback = configuration.performanceCallback;
		this._ownsComposer = this._preparedComposer !== null;
		/** @type {import('three/examples/jsm/postprocessing/EffectComposer.js').EffectComposer | null} */
		this._composer = null;
		/** @type {ThreeCacheBackend | null} */
		this._cacheBackend = null;
		/** @type {ShaderHandle | null} */
		this._shaderHandle = null;
		/** @type {Record<string, unknown> | null} */
		this._bindingValues = null;
		/** @type {AbortController | null} */
		this._setupCancellation = null;
		/** @type {string[]} */
		this._shaderErrors = [];
		this._setupGeneration = 0;
		this._runtimeFrameCount = 0;
		this._cacheYieldCount = 0;
		this._installed = false;
		this._published = false;
		this._disposed = false;
		/** Live selection cancellation owner. @type {AbortController | null} */
		this._liveCancellation = null;
		/** Predictive refill cancellation owner. @type {AbortController | null} */
		this._predictionCancellation = null;
		/** Last installed runtime summary. @type {Flat32AtmosphereSummary | null} */
		this._lastSummary = null;
		this._removeContextLifecycleParticipant = this._sceneRuntime.addContextLifecycleParticipant(this);
		this._renderAtmosphereFrame = this._renderAtmosphereFrame.bind(this);
		this._yieldCacheBuildControl = this._yieldCacheBuildControl.bind(this);
		this._captureShaderError = this._captureShaderError.bind(this);
		this._handleShaderWarning = this._handleShaderWarning.bind(this);
		this._cacheBuildScheduler = {
			yieldControl: this._yieldCacheBuildControl,
		};
	}

	/** Call this method to determine whether the installed mode supports stable shared-cache scene changes.
	 *
	 * @returns {boolean} - Whether a live shared attachment is installed.
	 */
	canUpdateSharedScene() {
		return (
			this._installed &&
			this._mode instanceof SphericalDistantMode &&
			this._mode.lightSource.sharedCacheAttachment !== null
		);
	}

	/** Call this method after publication to refill look-ahead slots released by the former visible scene.
	 *
	 * @param {DistantSunSharedScenePublication} attachment - Stable cache owner.
	 * @param {number} ordinal - Unchanged visible scene.
	 * @returns {Promise<void>} - Bounded background preparation; failures hold the visible frame.
	 */
	async _refillSharedPrediction(attachment, ordinal) {
		this._predictionCancellation?.abort();
		const cancellation = (this._predictionCancellation = new AbortController());
		try {
			const candidate = await attachment.prepareScene(ordinal, {}, cancellation.signal);
			if (!candidate) return;
			await this._sceneRuntime.atFrameBoundary(() => {
				cancellation.signal.throwIfAborted();
				this._assertUsable();
				attachment.publishPrepared(candidate.snapshot.generation);
				this._sceneRuntime.canvas.dataset.flat32SharedGeneration = String(candidate.snapshot.generation);
			}, cancellation.signal);
		} catch {
			if (this._predictionCancellation === cancellation) attachment.cancelPreparation();
		} finally {
			if (this._predictionCancellation === cancellation) this._predictionCancellation = null;
		}
	}

	/** Call this method to prepare then publish a coherent distant scene without rebuilding the runtime.
	 *
	 * @param {Flat32ApplicationState} state - Requested application observation.
	 * @param {Flat32SharedSceneUpdateRequest} request - Cancellation and optional premeasured physical environment.
	 * @returns {Promise<Flat32AtmosphereSummary>} - Updated stable-runtime summary.
	 */
	async updateSharedScene(state, request) {
		this._assertUsable();
		if (!this.canUpdateSharedScene()) throw new Error('Installed runtime does not support shared scene changes.');
		this._liveCancellation?.abort();
		this._predictionCancellation?.abort();
		this._predictionCancellation = null;
		const cancellation = (this._liveCancellation = new AbortController());
		const abort = () => cancellation.abort(request.signal.reason);
		request.signal.throwIfAborted();
		request.signal.addEventListener('abort', abort, {once: true});
		const mode = /** @type {SphericalDistantMode} */ (this._mode);
		const attachment = mode.lightSource.sharedCacheAttachment;
		let view;
		let committed = false;
		try {
			const prepared = mode.prepareLiveScene(state.observation);
			const degrees = prepared.sceneState.solarZenithDegrees;
			const ordinal = degrees >= 108 ? null : Math.floor(degrees + 0.5);
			const candidate = await attachment.prepareScene(ordinal, {}, cancellation.signal);
			if (!candidate)
				throw new Error(
					attachment.diagnostics().lastError || 'Shared scene preparation held the previous frame.',
				);
			view = new DistantSunSharedCache(this._cacheBackend, candidate);
			const measurement = await this._shaderHandle.prepareReceiverEnvironmentLight({
				THREE,
				renderer: this._sceneRuntime.renderer,
				backend: this._cacheBackend,
				geometry: prepared.sceneState.geometry,
				lightSource: prepared.source,
				observation: state.observation,
				scatteringCache: view,
				identity: `flat32-shared:${candidate.snapshot.generation}:${state.observation.instant}:${degrees}`,
				signal: cancellation.signal,
				environmentSample: request.environmentSample,
			});
			cancellation.signal.throwIfAborted();
			await this._sceneRuntime.atFrameBoundary(() => {
				cancellation.signal.throwIfAborted();
				this._assertUsable();
				attachment.publishPrepared(candidate.snapshot.generation);
				prepared.publish();
				this._bindingValues['lightSource.direction'] = new THREE.Vector3(
					...prepared.sceneState.directionToSourceModel,
				);
				this._shaderHandle.publishReceiverEnvironmentLight(measurement, state.observation);
				this._endpointScene.updateDistantSunLighting(
					prepared.sceneState.directionToSourceModel,
					mode.algorithm32.receiverLight,
					mode.algorithm32.config.config.color,
				);
				this._sceneRuntime.refreshShadowMaps();
				this._sceneRuntime.canvas.dataset.flat32SharedSceneOrdinal =
					ordinal === null ? 'dark' : String(ordinal);
				this._sceneRuntime.canvas.dataset.flat32SharedGeneration = String(candidate.snapshot.generation);
				committed = true;
			}, cancellation.signal);
			this._lastSummary = {...this._lastSummary, ...mode.describe(), runtimeFrameCount: this._runtimeFrameCount};
			if (ordinal !== null && attachment.diagnostics().predictedScene === -1)
				void this._refillSharedPrediction(attachment, ordinal);
			return this._lastSummary;
		} finally {
			if (!committed && this._liveCancellation === cancellation) attachment.cancelPreparation();
			view?.dispose();
			request.signal.removeEventListener('abort', abort);
			if (this._liveCancellation === cancellation) this._liveCancellation = null;
		}
	}

	/**
	 * Call this method to inspect installed rendering state without exposing shader handles.
	 * Disposed runtimes throw.
	 *
	 * @returns {Flat32RuntimeEvidenceSnapshot} - Caller-owned diagnostic snapshot.
	 */
	describeEvidence() {
		this._assertUsable();
		const diagnostics = this._shaderHandle?.getDiagnostics();
		if (
			diagnostics &&
			(typeof diagnostics !== 'object' ||
				!('status' in diagnostics) ||
				typeof diagnostics.status !== 'string' ||
				!('modelVersion' in diagnostics) ||
				typeof diagnostics.modelVersion !== 'number')
		) {
			throw new Error('Algorithm32 shader evidence lacks installation/version facts.');
		}
		/** Verified renderer-independent facts. @type {Flat32ShaderEvidenceSnapshot | null} */
		const facts = /** @type {Flat32ShaderEvidenceSnapshot | null} */ (diagnostics ?? null);
		const shader = facts ? {status: facts.status, modelVersion: facts.modelVersion} : null;
		return {
			installed: this._installed,
			frameCount: this._runtimeFrameCount,
			shader,
			shaderErrors: [...this._shaderErrors],
		};
	}

	/** Release renderer-owned resources while their invalid WebGL context remains lost. */
	handleContextLoss() {
		if (this._disposed) return;
		this._liveCancellation?.abort();
		this._predictionCancellation?.abort();
		this._shaderHandle?.handleContextLoss?.();
		this._disposeSetupResources();
		if (this._ownsComposer) {
			this._composer?.dispose();
			this._preparedRenderTarget?.dispose();
		}
	}

	/** Rebuild all renderer-owned atmosphere and stellar resources through normal setup after restoration. */
	async handleContextRestoration() {
		if (this._disposed) return;
		if (this._mode instanceof SphericalDistantMode) this._mode.prepareContextRestoration();
		await this.setup();
	}

	/**
	 * Normalize a caught setup or frame failure for presentation.
	 *
	 * @param {unknown} error - Supplies the caught value.
	 * @returns {string} Return a readable message.
	 */
	_errorMessage(error) {
		return error instanceof Error ? error.message : String(error);
	}

	/**
	 * Require the runtime to remain usable.
	 *
	 * @returns {void}
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('Flat32 Algorithm32 runtime is disposed.');
		}
	}

	/**
	 * Yield one cache-build boundary to browser rendering and heartbeat tasks.
	 *
	 * @returns {Promise<void>} Resolve on a later browser task.
	 */
	_yieldCacheBuildControl() {
		this._cacheYieldCount += 1;
		this._sceneRuntime.canvas.dataset.flat32CacheYieldCount = String(this._cacheYieldCount);

		return new Promise((resolve) => window.setTimeout(resolve, 0));
	}

	/**
	 * Throw shader-pass warnings so a candidate cannot publish after failure.
	 *
	 * @param {string} message - Describes the warning boundary.
	 * @param {unknown} error - Supplies the underlying failure.
	 * @returns {never}
	 */
	_handleShaderWarning(message, error) {
		if (error instanceof Error) {
			throw error;
		}

		throw new Error(`${message}: ${String(error)}`);
	}

	/**
	 * Capture concise WebGL compiler and linker diagnostics.
	 *
	 * @param {WebGLRenderingContext} context - Supplies shader log access.
	 * @param {WebGLProgram} program - Supplies the linked program.
	 * @param {WebGLShader} vertexShader - Supplies the vertex shader.
	 * @param {WebGLShader} fragmentShader - Supplies the fragment shader.
	 * @returns {void}
	 */
	_captureShaderError(context, program, vertexShader, fragmentShader) {
		const programLog = context.getProgramInfoLog(program)?.trim() ?? '';
		const vertexLog = context.getShaderInfoLog(vertexShader)?.trim() ?? '';
		const fragmentLog = context.getShaderInfoLog(fragmentShader)?.trim() ?? '';
		const details = [programLog, vertexLog, fragmentLog].filter((message) => message.length > 0);

		this._shaderErrors.push(
			details.length > 0 ? details.join(' | ') : 'WebGL reported an Algorithm32 shader link failure.',
		);
	}

	/**
	 * Drain the current WebGL error queue.
	 *
	 * @param {WebGL2RenderingContext} context - Supplies WebGL error state.
	 * @returns {number[]} Return the drained numeric error identities.
	 */
	_drainWebGlErrors(context) {
		let errors = [];

		for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
			errors.push(error);
		}

		return errors;
	}

	/**
	 * Resolve the physical scene-depth cap from all installed endpoint bounds.
	 *
	 * @returns {Distance} Return the geometry-owned cap.
	 */
	_resolveSceneDepthMax() {
		const camera = this._sceneRuntime.camera;
		const cameraPosition = camera.getWorldPosition(new THREE.Vector3());

		return this._mode.geometry.resolveSceneDepthMax({
			camera,
			cameraScenePosition: SceneMath.positionInSceneUnits([cameraPosition.x, cameraPosition.y, cameraPosition.z]),
			sceneScale: this._mode.sceneScale,
			endpointScenePositions: this._endpointScene.getSceneDepthEndpointPositions(),
		});
	}

	/**
	 * Refresh the mutable Algorithm32 camera bindings.
	 *
	 * @returns {void}
	 */
	_updateBindingValues() {
		if (this._bindingValues === null) {
			throw new Error('Flat32 Algorithm32 bindings are unavailable.');
		}

		Algorithm32Bindings.update({
			bindingValues: this._bindingValues,
			camera: this._sceneRuntime.camera,
			props: {
				config: this._mode.algorithm32.config.config,
				sceneScale: this._mode.sceneScale,
			},
		});
	}

	/** Publish concise celestial generation state for application diagnostics and regression gates. */
	_publishCelestialDiagnostics(diagnostics) {
		const canvas = this._sceneRuntime.canvas;
		const brightnessProxy = this._mode.algorithm32?.brightnessProxy?.value;
		if (canvas?.dataset && Number.isFinite(brightnessProxy)) {
			canvas.dataset.flat32ColorBrightnessProxy = String(brightnessProxy);
		}
		const celestial = diagnostics?.runtime?.celestialGeneration;
		if (celestial) {
			this._sceneRuntime.canvas.dataset.flat32CelestialGenerationStatus = celestial.status;
		}
		const sun = celestial?.sun;
		if (sun) {
			this._sceneRuntime.canvas.dataset.flat32SunTileGenerationStatus = sun.status;
			this._sceneRuntime.canvas.dataset.flat32SunTileGenerationCount = String(sun.generationCount);
			this._sceneRuntime.canvas.dataset.flat32SunTileGenerationCompletion =
				sun.publicationState?.active?.completion ?? 'none';
			this._sceneRuntime.canvas.dataset.flat32SunTileCoveragePolicy = sun.policyIdentity;
		}
		const stellar = diagnostics?.runtime?.stellarGeneration;
		if (!stellar) return;
		this._sceneRuntime.canvas.dataset.flat32StellarGenerationStatus = stellar.status;
		this._sceneRuntime.canvas.dataset.flat32StellarGenerationCount = String(stellar.generationCount);
		this._sceneRuntime.canvas.dataset.flat32StellarGenerationCompletion =
			stellar.publicationState?.active?.completion ?? 'none';
	}

	/**
	 * Read one immediately rendered default-framebuffer pixel.
	 *
	 * @param {WebGL2RenderingContext} context - Supplies framebuffer access.
	 * @returns {readonly [number, number, number, number]} Return RGBA bytes.
	 */
	_readOutputPixel(context) {
		const viewportSize = this._sceneRuntime.viewportSize;
		const pixel = new Uint8Array(4);

		context.readPixels(
			Math.floor(viewportSize.width / 2),
			Math.floor(viewportSize.height / 2),
			1,
			1,
			context.RGBA,
			context.UNSIGNED_BYTE,
			pixel,
		);

		return /** @type {const} */ ([pixel[0], pixel[1], pixel[2], pixel[3]]);
	}

	/**
	 * Read the scene-color pixel retained in the composer's input buffer.
	 *
	 * EffectComposer swaps its read and write buffers after the final runtime
	 * pass. That pass renders to the screen, so the post-swap write buffer is
	 * the buffer populated by the preceding scene RenderPass.
	 *
	 * @param {THREE.WebGLRenderer} renderer - Supplies render-target readback.
	 * @returns {readonly [number, number, number, number]} Return renderer-linear RGBA values.
	 */
	_readSceneInputPixel(renderer) {
		if (this._composer === null) {
			throw new Error('Flat32 atmosphere composer is unavailable.');
		}

		const target = this._composer.writeBuffer;
		const previousTarget = renderer.getRenderTarget();
		const context = /** @type {WebGL2RenderingContext} */ (renderer.getContext());
		const pixel = new Float32Array(4);

		try {
			renderer.setRenderTarget(target);
			context.readPixels(
				Math.floor(target.width / 2),
				Math.floor(target.height / 2),
				1,
				1,
				context.RGBA,
				context.FLOAT,
				pixel,
			);
		} finally {
			renderer.setRenderTarget(previousTarget);
		}

		return /** @type {const} */ ([pixel[0], pixel[1], pixel[2], pixel[3]]);
	}

	/**
	 * Require one real composed frame before publishing the candidate runtime.
	 *
	 * @returns {Flat32AtmospherePreflight} Return verified frame facts.
	 */
	_preflightComposedFrame() {
		if (this._composer === null || this._shaderHandle === null) {
			throw new Error('Flat32 Algorithm32 preflight resources are unavailable.');
		}

		const renderer = this._sceneRuntime.renderer;
		const context = /** @type {WebGL2RenderingContext} */ (renderer.getContext());
		const previousCheckShaderErrors = renderer.debug.checkShaderErrors;
		const previousShaderErrorHandler = renderer.debug.onShaderError;

		this._shaderErrors.length = 0;
		this._drainWebGlErrors(context);
		renderer.debug.checkShaderErrors = true;
		renderer.debug.onShaderError = this._captureShaderError;

		try {
			this._updateBindingValues();
			this._composer.render(0);
			const sceneInputPixel = this._readSceneInputPixel(renderer);
			const outputPixel = this._readOutputPixel(context);
			const diagnostics = /** @type {Flat32ShaderDiagnostics} */ (this._shaderHandle.getDiagnostics());
			this._publishCelestialDiagnostics(diagnostics);
			const programs = /** @type {readonly Flat32ProgramInfo[]} */ (
				/** @type {unknown} */ (renderer.info.programs)
			);
			const failedPrograms = programs.filter((program) => program.diagnostics?.runnable === false);
			const webGlErrors = this._drainWebGlErrors(context);

			if (
				diagnostics.status !== 'installed' ||
				(diagnostics.runtime?.frameCount ?? 0) < 1 ||
				(diagnostics.runtime?.renderErrorCount ?? 0) !== 0
			) {
				throw new Error(
					diagnostics.runtime?.lastRenderError ?? 'Algorithm32 did not complete its preflight frame.',
				);
			}
			if (this._shaderErrors.length > 0) {
				throw new Error(`Algorithm32 shader link failed: ${this._shaderErrors.join(' | ')}`);
			}
			if (failedPrograms.length > 0) {
				throw new Error('Algorithm32 created a non-runnable WebGL program.');
			}
			if (webGlErrors.length > 0) {
				throw new Error(`Algorithm32 preflight left WebGL errors: ${webGlErrors.join(', ')}.`);
			}
			return {
				diagnostics,
				outputPixel,
				sceneInputPixel,
			};
		} finally {
			renderer.debug.checkShaderErrors = previousCheckShaderErrors;
			renderer.debug.onShaderError = previousShaderErrorHandler;
		}
	}

	/**
	 * Dispose resources created for a setup attempt, retaining the composer.
	 *
	 * @returns {void}
	 */
	_disposeSetupResources() {
		this._shaderHandle?.dispose();
		this._shaderHandle = null;
		this._bindingValues = null;
		this._cacheBackend?.dispose();
		this._cacheBackend = null;
		this._installed = false;
	}

	/**
	 * Render one installed Algorithm32 frame or restore the direct fallback.
	 *
	 * @returns {void}
	 */
	_renderAtmosphereFrame() {
		if (!this._installed || this._composer === null) {
			return;
		}

		try {
			this._updateBindingValues();
			this._composer.render();
			const diagnostics =
				/** @type {{
				 *   runtime?: {
				 *     frameCount?: number,
				 *     renderErrorCount?: number,
				 *     lastRenderError?: string | null
				 *   }
				 * }} */ (this._shaderHandle?.getDiagnostics());
			this._publishCelestialDiagnostics(diagnostics);

			if ((diagnostics.runtime?.renderErrorCount ?? 0) !== 0) {
				throw new Error(diagnostics.runtime?.lastRenderError ?? 'Algorithm32 runtime frame failed.');
			}
			this._runtimeFrameCount += 1;
			this._sceneRuntime.canvas.dataset.flat32AtmosphereFrameCount = String(this._runtimeFrameCount);
		} catch (error) {
			this._installed = false;
			this._sceneRuntime.restoreDirectRendering();
			this._onFailure(
				`Atmosphere rendering failed; the direct scene remains active. ${this._errorMessage(error)}`,
			);
		}
	}

	/**
	 * Build, preflight, and atomically install the production atmosphere.
	 *
	 * @returns {Promise<Flat32AtmosphereSummary>} Resolve with installed facts.
	 */
	async setup() {
		this._assertUsable();
		const generation = ++this._setupGeneration;
		const setupStarted = performance.now();
		const cancellation = new AbortController();

		this._setupCancellation?.abort();
		this._setupCancellation = cancellation;
		this._composer = this._preparedComposer ?? this._sceneRuntime.prepareAtmosphereComposer();
		const sceneDepthMax = this._resolveSceneDepthMax();
		this._bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
		if (this._mode instanceof SphericalDistantMode && this._mode.lightSource.configuration.sharedCache)
			this._bindingValues['lightSource.direction'] = new THREE.Vector3(
				...this._mode.lightSource.configuration.directionToLight,
			);
		this._cacheBackend = new ThreeCacheBackend({
			THREE,
			renderer: this._sceneRuntime.renderer,
		});
		this._updateBindingValues();

		try {
			this._shaderHandle = await this._mode.algorithm32.setupShader({
				THREE,
				composer: this._composer,
				scene: this._sceneRuntime.scene,
				camera: this._sceneRuntime.camera,
				viewportSize: this._sceneRuntime.viewportSize,
				sceneScale: this._mode.sceneScale,
				sceneDepthMax,
				bindingValues: this._bindingValues,
				cacheBackend: this._cacheBackend,
				cacheBuildScheduler: this._cacheBuildScheduler,
				signal: cancellation.signal,
				logger: /** @type {Console} */ (
					/** @type {unknown} */ ({
						warn: this._handleShaderWarning,
					})
				),
				performanceCallback: this._performanceCallback,
				performanceSampleIntervalFrames: 1,
				performanceMaxPendingQueries: 4,
			});
			if (this._disposed || cancellation.signal.aborted || generation !== this._setupGeneration) {
				let error = new Error('Flat32 Algorithm32 setup was superseded.');

				error.name = 'AbortError';
				throw error;
			}
			await this._shaderHandle.prepare(this._sceneRuntime.renderer);
			if (this._disposed || cancellation.signal.aborted || generation !== this._setupGeneration) {
				let error = new Error('Flat32 Algorithm32 preparation was superseded.');

				error.name = 'AbortError';
				throw error;
			}
			await this._shaderHandle.measureReceiverEnvironmentLight({
				THREE,
				renderer: this._sceneRuntime.renderer,
				backend: this._cacheBackend,
				signal: cancellation.signal,
			});
			if (this._disposed || cancellation.signal.aborted || generation !== this._setupGeneration) {
				let error = new Error('Flat32 receiver-light measurement was superseded.');

				error.name = 'AbortError';
				throw error;
			}
			if (this._mode.describe().pairing === 'spherical/distant') {
				const distantMode = /** @type {SphericalDistantMode} */ (this._mode);
				const color = distantMode.algorithm32.config.config.color;
				this._endpointScene.updateDistantSunLighting(
					distantMode.geometry.configuration.directionToSource,
					distantMode.algorithm32.receiverLight,
					color,
				);
				this._sceneRuntime.refreshShadowMaps();
			}
			const preflight = this._preflightComposedFrame();
			const modeSummary = this._mode.describe();
			const runtimeDiagnostics =
				/** @type {{
				 *   runtime?: {
				 *     frameCount?: number,
				 *     renderErrorCount?: number
				 *   }
				 * }} */ (preflight.diagnostics);

			this._runtimeFrameCount = runtimeDiagnostics.runtime?.frameCount ?? 1;
			this._installed = true;
			this._sceneRuntime.canvas.dataset.flat32AtmosphereFrameCount = String(this._runtimeFrameCount);
			this._sceneRuntime.canvas.dataset.flat32AtmosphereOutputPixel = preflight.outputPixel.join(',');
			this._sceneRuntime.canvas.dataset.flat32AtmosphereSceneInputPixel = preflight.sceneInputPixel.join(',');
			if (!this._deferPublication) this.publish();

			this._lastSummary = /** @type {Flat32AtmosphereSummary} */ ({
				...modeSummary,
				runtimeFrameCount: this._runtimeFrameCount,
				renderErrorCount: runtimeDiagnostics.runtime?.renderErrorCount ?? 0,
				sceneDepthMax,
				setupDurationMilliseconds: performance.now() - setupStarted,
				outputPixel: preflight.outputPixel,
				sceneInputPixel: preflight.sceneInputPixel,
			});
			return this._lastSummary;
		} catch (error) {
			this._sceneRuntime.restoreDirectRendering();
			this._disposeSetupResources();
			throw error;
		} finally {
			if (this._setupCancellation === cancellation) {
				this._setupCancellation = null;
			}
		}
	}

	/** Atomically make a successfully preflighted runtime visible. */
	publish() {
		this._assertUsable();
		if (!this._installed) {
			throw new Error('Cannot publish Flat32 atmosphere before preflight.');
		}

		this._published = true;
		this._publishSelectedRenderOperation();
	}

	/** Apply the diagnostic composition selection to a published runtime. */
	_publishSelectedRenderOperation() {
		if (this._atmosphereEnabled) {
			this._sceneRuntime.installRenderOperation(this._renderAtmosphereFrame);
		} else {
			this._sceneRuntime.restoreDirectRendering();
		}
	}

	/** Select atmosphere composition or direct Three rendering without rebuilding resources. */
	setAtmosphereEnabled(enabled) {
		this._assertUsable();
		if (typeof enabled !== 'boolean') {
			throw new TypeError('Flat32 atmosphere enabled state must be boolean.');
		}
		this._atmosphereEnabled = enabled;
		if (this._published && this._installed) this._publishSelectedRenderOperation();
	}

	/**
	 * Restore direct rendering and release Algorithm32 resources in order.
	 *
	 * @returns {void}
	 */
	dispose({restoreRendering = true} = {}) {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this._liveCancellation?.abort();
		this._predictionCancellation?.abort();
		this._predictionCancellation = null;
		this._published = false;
		this._removeContextLifecycleParticipant();
		this._setupGeneration += 1;
		this._setupCancellation?.abort();
		this._setupCancellation = null;
		if (restoreRendering) this._sceneRuntime.restoreDirectRendering();
		this._shaderHandle?.dispose();
		this._shaderHandle = null;
		this._mode.dispose();
		this._bindingValues = null;
		this._cacheBackend?.dispose();
		this._cacheBackend = null;
		if (this._ownsComposer) {
			this._composer?.dispose();
			this._preparedRenderTarget?.dispose();
		}
		this._composer = null;
		this._installed = false;
	}
}
