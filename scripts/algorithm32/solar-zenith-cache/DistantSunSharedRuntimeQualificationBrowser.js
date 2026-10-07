import {Flat32Application} from '../../../src/flat32/Flat32Application.js';
import {Algorithm32Runtime} from '../../../src/flat32/Algorithm32Runtime.js';
import {DistantSunLightSource} from '../../../src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import ReferenceDenseController from '../../../src/algorithm32/implementation/distant-sun/cache/_tests/reference/DistantSunSceneCacheController.js';
import {SphericalDistantMode} from '../../../src/flat32/SphericalDistantMode.js';
import {ReceiverEnvironmentLightTransportSampler} from '../../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportSampler.js';
import {ReceiverEnvironmentLightGpuReducer} from '../../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightGpuReducer.js';
import {createDistantSunSceneCacheHttpResolver} from '../../../src/flat32/DistantSunSceneCacheResolver.js';
import {loadBrightest2000StellarCatalogPackage} from '../../../src/flat32/Brightest2000StellarCatalogPackageLoader.js';
import {loadHumanVisionFilterPackage} from '../../../src/flat32/HumanVisionFilterPackageLoader.js';
import {createDistantSunSceneState} from '../../../src/flat32/DistantSunSceneState.js';
import {ATMOSPHERE_OBSERVER_HEIGHT, ATMOSPHERE_OBSERVER_UP_DIRECTION} from '../../../src/flat32/consts.js';

/** Production application owner used only by the immutable qualification runner. */
export default class DistantSunSharedRuntimeQualificationBrowser {
	/** Blocks already checked against the independent oracle. */
	_probedBlocks = new Set();

	/** Call this method to require the concrete production owner before proof-only inspection.
	 *
	 * @returns {Algorithm32Runtime} - Current production runtime; incompatible owners throw.
	 */
	_runtime() {
		const runtime = this._application._modeController._activeRuntime;
		if (!(runtime instanceof Algorithm32Runtime))
			throw new Error('Qualification requires the production runtime owner.');
		return runtime;
	}

	/** Call this method to require the production shell before inspecting state.
	 *
	 * @returns {HTMLElement} - Installed shell.
	 */
	_shell() {
		const shell = document.querySelector('.flat32-shell');
		if (!(shell instanceof HTMLElement)) throw new Error('Qualification application shell is absent.');
		return shell;
	}

	/** Call this method to require the declared spherical production mode.
	 *
	 * @returns {SphericalDistantMode} - Current mode.
	 */
	_mode() {
		const mode = this._runtime()._mode;
		if (!(mode instanceof SphericalDistantMode)) throw new Error('Qualification changed its declared geometry.');
		return mode;
	}

	/** Call this method to prepare an observation at the requested solar zenith on the afternoon arc.
	 *
	 * @param {number} degrees - Target solar zenith.
	 *
	 * @param {GeometryObservation} [original] - Observation whose afternoon arc is searched.
	 *
	 * @returns {GeometryObservation} - Numerically resolved observation.
	 */
	_observation(degrees, original = this._application._state.observation) {
		const epoch = Date.parse(original.instant);
		const evaluate = (milliseconds) => {
			const observation = {...original, instant: new Date(milliseconds).toISOString()};
			return {
				observation,
				degrees: createDistantSunSceneState({
					observation,
					observerHeight: ATMOSPHERE_OBSERVER_HEIGHT,
					observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
				}).solarZenithDegrees,
			};
		};
		let left, right;
		for (let offset = -12; offset < 12; offset++) {
			const a = evaluate(epoch + offset * 3600000),
				b = evaluate(epoch + (offset + 1) * 3600000);
			if (a.degrees <= degrees && b.degrees >= degrees) {
				left = epoch + offset * 3600000;
				right = left + 3600000;
				break;
			}
		}
		if (left === undefined) throw new Error('Requested angle is outside the afternoon arc.');
		for (let iteration = 0; iteration < 32; iteration++) {
			const middle = (left + right) / 2;
			if (evaluate(middle).degrees < degrees) left = middle;
			else right = middle;
		}
		return evaluate(right).observation;
	}

	/** Call this method after each real frame to verify the visible cache and light selection.
	 *
	 * @returns {void}
	 */
	_observeFrame() {
		const application = this._application,
			mode = this._mode();
		const frame = mode.lightSource.sharedCacheAttachment?.active?._frame;
		if (!frame) return;
		const direction = mode.lightSource.configuration.directionToLight,
			up = mode.geometry.configuration.observerUpDirection;
		const angle =
			(Math.acos(
				Math.max(
					-1,
					Math.min(
						1,
						direction.reduce((sum, value, index) => sum + value * up[index], 0),
					),
				),
			) *
				180) /
			Math.PI;
		const ordinal = angle >= 108 ? null : Math.floor(angle + 0.5);
		const identity = mode.algorithm32.receiverLight.identity;
		const coherent =
			ordinal === frame.snapshot.sceneOrdinal &&
			direction.every(
				(value, index) => Math.abs(value - mode.geometry.configuration.directionToSource[index]) < 1e-12,
			) &&
			application._endpointScene._lighting._lights.every(
				(light) => light.userData.receiverLightIdentity === identity,
			);
		this._coherence.frames++;
		this._coherence.peakGpuBytes = Math.max(
			this._coherence.peakGpuBytes,
			mode.lightSource.sharedCacheAttachment.diagnostics().gpuBytes,
		);
		this._coherence.peakPinnedBytes = Math.max(
			this._coherence.peakPinnedBytes,
			application._sharedCacheAssets._ownedTransport?.diagnostics().retention.pinnedBytes ?? 0,
		);
		this._coherence.peakHeapBytes = Math.max(
			this._coherence.peakHeapBytes,
			/** @type {SharedQualificationPerformance} */ (performance).memory?.usedJSHeapSize ?? 0,
		);
		if (!coherent && this._coherence.failures.length < 16)
			this._coherence.failures.push({ordinal, actual: frame.snapshot.sceneOrdinal, identity});
		if (this._coherence.generations.at(-1)?.generation !== frame.snapshot.generation)
			this._coherence.generations.push({generation: frame.snapshot.generation, ordinal, identity});
	}

	/** Call this method to collect live data without changing the application.
	 *
	 * @returns {SharedQualificationSnapshot} - Coherence, allocation, shader, and GPU facts.
	 */
	snapshot() {
		const application = this._application,
			runtime = this._runtime();
		const renderer = application._sceneRuntime.renderer,
			gl = renderer.getContext();
		const extension = gl.getExtension('WEBGL_debug_renderer_info');
		const mode = this._mode(),
			attachment = mode.lightSource.sharedCacheAttachment;
		return {
			canvas: {...application._sceneRuntime.canvas.dataset},
			direction: [...mode.lightSource.configuration.directionToLight],
			geometryDirection: [...mode.geometry.configuration.directionToSource],
			receiverIdentity: mode.algorithm32.receiverLight.identity,
			sameRuntime: runtime === this._initialRuntime,
			sameHandle: runtime._shaderHandle === this._initialHandle,
			programs: renderer.info.programs.map((program) => program.id),
			rendererMemory: {...renderer.info.memory},
			cache: attachment?.diagnostics(),
			transport: application._sharedCacheAssets._ownedTransport?.diagnostics(),
			glError: gl.getError(),
			drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
			gpu: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
			heapBytes: /** @type {SharedQualificationPerformance} */ (performance).memory?.usedJSHeapSize,
			coherence: this._coherence,
		};
	}

	/** Call this method to capture the complete rendered framebuffer independently of timing.
	 *
	 * @returns {Promise<SharedQualificationPixels>} - Exact byte pixels for full-frame control comparison.
	 */
	async pixels() {
		await new Promise((resolve) => requestAnimationFrame(resolve));
		const runtime = this._runtime();
		runtime._renderAtmosphereFrame();
		const gl = this._application._sceneRuntime.renderer.getContext();
		const bytes = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
		gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
		let binary = '';
		for (let start = 0; start < bytes.length; start += 32768)
			binary += String.fromCharCode(...bytes.subarray(start, start + 32768));
		return {width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, base64: btoa(binary)};
	}

	/** Call this method to compare real resident GPU packets with independent dense control bits.
	 *
	 * @returns {Promise<SharedQualificationProbe>} - Exact tested block and scalar counts.
	 */
	async probe() {
		this._probedBlocks ??= new Set();
		const runtime = this._runtime();
		const atlas = this._mode().lightSource.sharedCacheAttachment._controller._atlas;
		let scalars = 0,
			blocks = 0;
		for (const slot of atlas.getSlots()) {
			if (this._probedBlocks.has(slot.block.id)) continue;
			const oracle = await (await fetch(`oracle/${slot.block.id}`)).json();
			for (let start = 0; start < oracle.samples.length; start += 256) {
				const samples = oracle.samples.slice(start, start + 256);
				const values = runtime._cacheBackend.readTextureTexels(
					atlas.array,
					samples.map((sample) => ({
						x: sample.packet * 162 + sample.face * 27 + sample.u,
						y: sample.row * 27 + sample.v,
						layer: slot.index,
					})),
				);
				const bits = new Uint32Array(values.buffer, values.byteOffset, values.length);
				for (let index = 0; index < samples.length; index++)
					for (let component = 0; component < 4; component++) {
						if (bits[index * 4 + component] !== samples[index].expected[component])
							throw new Error(
								`Dense GPU oracle mismatch: ${slot.block.id}, sample ${start + index}, component ${component}.`,
							);
						scalars++;
					}
			}
			blocks++;
			this._probedBlocks.add(slot.block.id);
		}
		return {blocks, scalars, totalBlocks: this._probedBlocks.size};
	}

	/** Call this method to change only the observation through the production mode controller.
	 *
	 * @param {number} degrees - Requested scene angle.
	 *
	 * @returns {Promise<SharedQualificationTransition>} - Timing and coherent state after publication.
	 */
	async transition(degrees) {
		const started = performance.now(),
			before = this.snapshot();
		this._samples = [];
		const state = {...this._application._state, observation: this._observation(degrees)};
		await this._application._modeController.switchTo('spherical-distant', state);
		await new Promise((resolve) => requestAnimationFrame(resolve));
		return {
			degrees,
			elapsedMilliseconds: performance.now() - started,
			before,
			after: this.snapshot(),
			samples: [...this._samples],
			preparationStages: this._preparationStages.splice(0),
		};
	}

	/** Call this method to measure completed frames and GPU queries without recording overhead.
	 *
	 * @param {number} count - Completed frames to observe.
	 *
	 * @returns {Promise<SharedQualificationMeasurement>} - Separate wall and GPU query evidence.
	 */
	async measure(count) {
		const renderer = this._application._sceneRuntime.renderer,
			gl = renderer.getContext(),
			durations = [];
		this._samples = [];
		for (let index = 0; index < count; index++) {
			const started = performance.now();
			await new Promise((resolve) => requestAnimationFrame(resolve));
			gl.finish();
			durations.push(performance.now() - started);
		}
		return {durations, samples: [...this._samples], state: this.snapshot()};
	}

	/** Call this method to exercise actual supersession, bounded misses, darkness, and restored observation.
	 *
	 * @returns {Promise<SharedQualificationLifecycle>} - Application lifecycle evidence.
	 */
	async lifecycle() {
		const application = this._application;
		const state = application._state;
		const superseded = application._modeController.switchTo('spherical-distant', {
			...state,
			observation: this._observation(90),
		});
		const newest = application._modeController.switchTo('spherical-distant', {
			...state,
			observation: this._observation(91),
		});
		const selections = await Promise.all([superseded, newest]);
		if (selections[0] !== null) throw new Error('Superseded runtime request published.');
		const beforeMiss = this.snapshot();
		let held = false;
		try {
			await this.transition(20);
		} catch {
			held = true;
		}
		const afterMiss = this.snapshot();
		if (
			held &&
			(beforeMiss.cache.sceneOrdinal !== afterMiss.cache.sceneOrdinal ||
				beforeMiss.receiverIdentity !== afterMiss.receiverIdentity)
		)
			throw new Error('Bounded seek did not preserve the complete visible state.');
		if (!held && afterMiss.cache.sceneOrdinal !== 20)
			throw new Error('Qualified seek did not publish its requested scene.');
		const dark = await this.transition(108.001);
		if (dark.after.cache.gpuBytes !== 0 || dark.after.cache.sceneOrdinal !== null)
			throw new Error('Darkness retained data atlas resources.');
		await this.transition(107.75);
		const beforeLoss = this.snapshot(),
			gl = application._sceneRuntime.renderer.getContext(),
			extension = gl.getExtension('WEBGL_lose_context');
		if (!extension) throw new Error('Context-loss injection is unavailable.');
		extension.loseContext();
		await new Promise((resolve) => setTimeout(resolve, 150));
		extension.restoreContext();
		const deadline = performance.now() + 60000;
		while (application._sceneRuntime.canvas.dataset.flat32ContextState !== 'restored') {
			const error = document.getElementById('flat32-error')?.textContent;
			if (error) throw new Error(`Context restoration failed: ${error}`);
			if (performance.now() > deadline)
				throw new Error(
					`Context restoration timed out: ${document.querySelector('.flat32-shell').textContent}`,
				);
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		await new Promise((resolve) => requestAnimationFrame(resolve));
		const afterLoss = this.snapshot();
		if (
			afterLoss.cache.sceneOrdinal !== beforeLoss.cache.sceneOrdinal ||
			JSON.stringify(afterLoss.direction) !== JSON.stringify(beforeLoss.direction) ||
			afterLoss.glError !== 0
		)
			throw new Error('Context restoration selected a stale scene.');
		return {supersession: true, beforeMiss, afterMiss, dark, beforeLoss, afterLoss};
	}

	/** Call this method after visible qualification to probe the entire inventory while rendering is paused.
	 *
	 * @returns {Promise<SharedQualificationInventoryEntry[]>} - Exact GPU proof across all 109 catalog controls.
	 */
	async completeInventory() {
		const sceneRuntime = this._application._sceneRuntime;
		sceneRuntime._started = false;
		cancelAnimationFrame(sceneRuntime._frameRequest);
		const attachment = this._mode().lightSource.sharedCacheAttachment;
		let candidate = await attachment.prepareScene(null);
		attachment.publishPrepared(candidate.snapshot.generation);
		const evidence = [];
		for (let ordinal = 0; ordinal <= 108; ordinal++) {
			candidate = await attachment.prepareScene(ordinal);
			if (!candidate) throw new Error(`Complete GPU inventory could not prepare scene ${ordinal}.`);
			attachment.publishPrepared(candidate.snapshot.generation);
			evidence.push({ordinal, ...(await this.probe()), diagnostics: attachment.diagnostics()});
		}
		if (this._probedBlocks.size !== 89) throw new Error('Complete GPU oracle omitted a block.');
		return evidence;
	}

	/** Call this method to release all application and Worker resources after qualification.
	 *
	 * @returns {void}
	 */
	dispose() {
		this._application?.dispose();
		this._restoreReferenceController?.();
		this._restoreReferenceController = undefined;
		for (const {owner, method, operation} of this._instrumentedMethods ?? []) owner.prototype[method] = operation;
		this._instrumentedMethods = [];
	}
	/** Call this method to start the real production application with an explicit qualification selection.
	 *
	 * @param {SharedQualificationSelection} selection - Shared candidate or dense control.
	 * @param {number} [initialDegrees] - Initial physical input, including the dark boundary.
	 * @param {Flat32FixedColorModelId} [colorModel] - Explicit application color selection; omission retains P9.
	 *
	 * @returns {Promise<SharedQualificationSnapshot>} - Initial measured application state.
	 */
	async start(selection, initialDegrees = 90, colorModel = 'color-reset-slope-078-p9') {
		if (selection === 'dense') {
			const original = DistantSunLightSource.prototype.createCacheController;
			DistantSunLightSource.prototype.createCacheController = function (request) {
				return this.configuration.sceneCacheAsset
					? new ReferenceDenseController({
							backend: request.backend,
							asset: this.configuration.sceneCacheAsset,
						})
					: original.call(this, request);
			};
			this._restoreReferenceController = () => {
				DistantSunLightSource.prototype.createCacheController = original;
			};
		}
		this._samples = [];
		this._preparationStages = [];
		this._instrumentedMethods = [];
		for (const [owner, method] of /** @type {const} */ ([
			[ReceiverEnvironmentLightTransportSampler, 'sample'],
			[ReceiverEnvironmentLightGpuReducer, 'reduce'],
		])) {
			const operation = owner.prototype[method],
				stages = this._preparationStages;
			this._instrumentedMethods.push({owner, method, operation});
			owner.prototype[method] = async function (request) {
				const started = performance.now();
				try {
					return await operation.call(this, request);
				} finally {
					stages.push({operation: method, milliseconds: performance.now() - started});
				}
			};
		}
		const definition = await loadBrightest2000StellarCatalogPackage();
		const human = await loadHumanVisionFilterPackage();
		const resolver = createDistantSunSceneCacheHttpResolver(
			`api/${selection}`,
			{
				requestJson: async (request) => (await fetch(request.route, {signal: request.signal})).json(),
			},
			selection === 'shared' ? 'scene-caches/' : 'dense-caches/',
		);
		this._application = new Flat32Application(document.getElementById('main-content'), {
			colorDisplayModelConfiguration: {model: colorModel},
			initialFlatTimeIndex: 2,
			cameraFieldOfViewDegrees: 78,
			brightest2000StellarCatalogDefinition: definition,
			scotopicLuminanceWeights: human.scotopicLuminanceWeights,
			presentationFilters: [
				{
					id: 'human-mesopic-luminance-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: true,
					parameters: {maximumRodContribution: 0.5},
				},
				{
					id: 'human-low-light-chroma-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: true,
					parameters: {maximumChromaRetention: 0.65},
				},
			],
			resolveDistantSunSceneCacheAsset: resolver,
			performanceCallback: (sample) => {
				this._samples.push(sample);
				if (this._samples.length > 4096) this._samples.shift();
			},
		});
		if (selection === 'dense') {
			// Qualification-only control adapter; the production application rejects dense selections.
			this._application._prepareSphericalDistantMode = async function (state, request) {
				const scene = this._createSphericalDistantSceneState(state);
				const url = new URL('api/dense', location.href);
				url.searchParams.set('solarZenithDegrees', String(scene.solarZenithDegrees));
				const value = await (await fetch(url, {signal: request.signal})).json();
				request.signal.throwIfAborted();
				return this._createSphericalDistantMode(scene, value.asset, value.status);
			};
		}
		// Select the ordinary San Jose preset so the qualification route includes sunset and darkness.
		const locationController = this._application._locationTimeController;
		const defaultStart = locationController.start.bind(locationController);
		locationController.start = () => locationController._resolveState({...defaultStart(), locationIndex: 0});
		const selectTime = locationController.selectTime.bind(locationController);
		locationController.selectTime = (state, index) => {
			const selected = selectTime(state, index);
			return {...selected, observation: this._observation(initialDegrees, selected.observation)};
		};
		this._application.start();
		const deadline = performance.now() + 180000;
		while (!['ready', 'atmosphere-failed'].includes(this._shell().dataset.flat32State)) {
			if (performance.now() > deadline) throw new Error('Qualification setup timed out.');
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		if (this._shell().dataset.flat32State !== 'ready') throw new Error(this._shell().textContent);
		this._initialRuntime = this._runtime();
		this._initialHandle = this._initialRuntime._shaderHandle;
		this._coherence = {
			frames: 0,
			failures: [],
			generations: [],
			peakGpuBytes: 0,
			peakPinnedBytes: 0,
			peakHeapBytes: 0,
		};
		const sceneRuntime = this._application._sceneRuntime,
			render = sceneRuntime._renderOperation;
		sceneRuntime._renderOperation = () => {
			render();
			this._observeFrame();
		};
		return this.snapshot();
	}
}

globalThis.sharedQualification = new DistantSunSharedRuntimeQualificationBrowser();
