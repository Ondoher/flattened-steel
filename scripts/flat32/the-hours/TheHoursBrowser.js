import * as THREE from 'three';
import {ThreeSceneRuntime} from '../../../src/flat32/ThreeSceneRuntime.js';
import {ModeController} from '../../../src/flat32/ModeController.js';
import {Algorithm32Runtime} from '../../../src/flat32/Algorithm32Runtime.js';
import {SphericalDistantMode} from '../../../src/flat32/SphericalDistantMode.js';
import {DistantSunLightSource} from '../../../src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import SharedDistantCacheAssets from '../../../src/flat32/SharedDistantCacheAssets.js';
import {createDistantSunSceneState} from '../../../src/flat32/DistantSunSceneState.js';
import {
	ATMOSPHERE_OBSERVER_HEIGHT,
	ATMOSPHERE_OBSERVER_UP_DIRECTION,
	ATMOSPHERE_SCENE_SCALE,
	ATMOSPHERE_SOURCE_ANGULAR_RADIUS,
} from '../../../src/flat32/consts.js';
import {
	NeutralLambertianSceneLighting,
	NEUTRAL_LAMBERTIAN_REFLECTANCE,
} from '../../../src/algorithm32/implementation/scene-lighting/NeutralLambertianSceneLighting.js';
import {loadBrightest2000StellarCatalogPackage} from '../../../src/flat32/Brightest2000StellarCatalogPackageLoader.js';
import {loadHumanVisionFilterPackage} from '../../../src/flat32/HumanVisionFilterPackageLoader.js';
import {TheHoursRecorder} from './TheHoursRecorder.js';
import {SolarPosition} from '../../../src/algorithm32/geometry-support/solar/SolarPosition.js';
import AngleMath from '../../../src/algorithm32/math/AngleMath.js';
import {TheHoursObservatoryScene} from './TheHoursObservatoryScene.js';
import {TheHoursObservatoryCamera} from './TheHoursObservatoryCamera.js';
import {TheHoursDesertSceneLighting} from './TheHoursDesertSceneLighting.js';
import {TheHoursRandom} from './TheHoursRandom.js';
import {TheHoursSolarClock} from './TheHoursSolarClock.js';
import {TheHoursLightingSamples} from './TheHoursLightingSamples.js';
import {TheHoursFrameMeasurement} from './TheHoursFrameMeasurement.js';

/** Production-owned offline scene session; normal owners retain all shader and geometry mutation. */
export class TheHoursBrowser {
	/**
	 * Creates a session around authenticated original choreography and measured target admission.
	 *
	 * @param {TheHoursBrowserConfiguration} configuration - Complete selected proof controls.
	 */
	constructor(configuration) {
		this._configuration = configuration;
		this._clock = new TheHoursSolarClock(configuration.original);
		this._samples = new TheHoursLightingSamples();
		this._assets = new SharedDistantCacheAssets();
		this._frames = [];
		this._failures = [];
		this._measurement = new TheHoursFrameMeasurement();
		/** Active mode received from its owning controller publication callback. @type {SphericalDistantMode | null} */
		this._mode = null;
		/** Created runtime candidate owned through the normal controller lifecycle. @type {Algorithm32Runtime | null} */
		this._runtime = null;
	}

	/**
	 * Called by the byte bridge to encode a bounded chunk without a large argument spread.
	 *
	 * @param {Uint8Array} bytes - Complete bounded chunk.
	 * @returns {string} - Base64 bridge payload.
	 */
	_encodeBytes(bytes) {
		let binary = '';
		for (let offset = 0; offset < bytes.length; offset += 0x8000)
			binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
		return btoa(binary);
	}

	/**
	 * Called by scene preparation to resolve the exact production geometry and astronomy.
	 *
	 * @param {Flat32ApplicationState} state - Complete original observation.
	 * @returns {Flat32DistantSunSceneState<SphericalDistantMode['geometry']>} - Exact physical scene state.
	 */
	_sceneState(state) {
		return createDistantSunSceneState({
			observation: state.observation,
			observerHeight: ATMOSPHERE_OBSERVER_HEIGHT,
			observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
		});
	}

	/**
	 * Called by the mode transaction to construct its production-selected spherical mode.
	 *
	 * @param {Flat32ModeKind} kind - Requested supported mode.
	 * @param {Flat32ApplicationState} state - Exact observation and configuration.
	 * @param {Flat32SharedSceneUpdateRequest} request - Caller-owned cancellation.
	 * @returns {Promise<SphericalDistantMode>} - Authenticated native production mode.
	 */
	async _createMode(kind, state, request) {
		if (kind !== 'spherical-distant') throw new Error('The Hours requires spherical/distant production.');
		const sceneState = this._sceneState(state);
		const ordinal = sceneState.solarZenithDegrees >= 108 ? null : Math.floor(sceneState.solarZenithDegrees + 0.5);
		const sharedCache = await this._assets.select(
			this._configuration.asset,
			ordinal,
			request.signal,
			this._sceneRuntime.renderer.getContext(),
		);
		return new SphericalDistantMode({
			sceneState,
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			sourceAngularRadius: ATMOSPHERE_SOURCE_ANGULAR_RADIUS,
			maximumScatteringOrder: 4,
			sharedCache,
			distantSunCacheState: ordinal === null ? 'dark' : 'ready',
			colorDisplayModelConfiguration: {model: this._configuration.colorModel},
			stellarCatalog: 'brightest-2000',
			brightest2000StellarCatalogDefinition: this._catalog,
			presentationFilters: this._configuration.originalPresentationFilters,
			scotopicLuminanceWeights: this._vision.scotopicLuminanceWeights,
		});
	}

	/**
	 * Called by presentation to retain the original opening and closing typography.
	 *
	 * @param {number} seconds - Original score position.
	 * @returns {void} - Presentation overlay complete.
	 */
	_drawTitles(seconds) {
		const context = this._presentationContext;
		const {width, height} = this._configuration;
		const opening = Math.min(1, seconds / 0.8, (5 - seconds) / 1.2);
		const closing = Math.min(1, (seconds - 56) / 1.6, (60 - seconds) / 0.8);
		const opacity = Math.max(0, opening, closing);
		if (opacity === 0) return;
		const scale = width / 3840;
		context.save();
		context.globalAlpha = opacity * 0.9;
		context.fillStyle = '#e5dfcf';
		context.textAlign = 'left';
		context.font = `${46 * scale}px Georgia, serif`;
		context.fillText(opening > 0 ? 'THE HOURS' : 'THE HOURS / ALGORITHM32', width * 0.055, height * 0.9);
		context.globalAlpha = opacity * 0.65;
		context.font = `${22 * scale}px Arial, sans-serif`;
		context.fillText(opening > 0 ? 'An observatory of light' : 'One day. One sky.', width * 0.055, height * 0.925);
		context.restore();
	}

	/**
	 * Called by preparation and rendering to publish an exact observation through normal production transactions.
	 *
	 * @param {number} seconds - Original score position.
	 * @param {boolean} interpolate - Whether to use retained measured environment endpoints.
	 * @returns {Promise<Flat32DistantSunSceneState<SphericalDistantMode['geometry']>>} - Complete matching physical state.
	 */
	async _publish(seconds, interpolate) {
		const state = this._clock.stateAt(seconds);
		const summary = await this._controller.switchTo(
			'spherical-distant',
			state,
			interpolate ? {environmentSample: this._samples.sample(seconds)} : {},
		);
		if (!summary || this._failures.length)
			throw new Error(this._failures.join('\n') || 'The Hours publication was superseded.');
		return this._sceneState(state);
	}

	/** Called by the score to install one authenticated exact native camera pose.
	 *
	 * @param {TheHoursCameraSnapshot} camera - Original frame or selected control pose.
	 * @returns {void} - Complete projection and scene matrices updated.
	 */
	_applyCamera(camera) {
		const live = this._sceneRuntime.camera;
		live.position.fromArray(camera.positionMeters.map((value) => value / 1000));
		live.up.set(0, 1, 0);
		live.fov = camera.fieldOfViewDegrees;
		live.lookAt(
			.../** @type {[number, number, number]} */ (
				camera.positionMeters.map((value, axis) => value / 1000 + camera.viewDirection[axis])
			),
		);
		live.updateProjectionMatrix();
		live.updateMatrixWorld(true);
	}

	/**
	 * Called by capture and encoding to render one complete native frame.
	 *
	 * @param {number} seconds - Exact original score time.
	 * @returns {Promise<void>} - Native presentation and complete scene trace retained.
	 */
	async _render(seconds) {
		const sceneState = await this._publish(seconds, true);
		const directionToSunScene = sceneState.geometry.expressCelestialDirectionInScene(
			sceneState.directionToSourceModel,
		);
		let camera = this._director.apply({
			animationSeconds: seconds,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			directionToSunScene,
		});
		if (this._configuration.fixedCamera) {
			camera = this._configuration.fixedCamera;
		} else {
			const original = this._configuration.original.frames[Math.round(seconds * 30)];
			const delta = Math.max(
				...camera.positionMeters.map((value, axis) => Math.abs(value - original.camera.positionMeters[axis])),
				...camera.viewDirection.map((value, axis) => Math.abs(value - original.camera.viewDirection[axis])),
				Math.abs(camera.fieldOfViewDegrees - original.camera.fieldOfViewDegrees),
				Math.abs(camera.elevationDegrees - original.camera.elevationDegrees),
			);
			if (delta > 1e-10) throw new Error('Original native camera choreography differs beyond binary64 rounding.');
			if (Math.abs(sceneState.solarZenithDegrees - original.solarZenithDegrees) > 1e-10)
				throw new Error('Original solar zenith differs.');
			camera = original.camera;
		}
		this._applyCamera(camera);
		this._observatory.update(seconds, Math.max(0, Math.cos((sceneState.solarZenithDegrees * Math.PI) / 180)));
		this._sceneRuntime.stepFrame();
		const runtime = this._runtime.describeEvidence();
		if (!runtime.installed || runtime.shaderErrors.length || this._failures.length)
			throw new Error('Algorithm32 fell back or failed while recording.');
		const gl = this._sceneRuntime.renderer.getContext();
		if (
			gl.isContextLost() ||
			gl.drawingBufferWidth !== this._configuration.width ||
			gl.drawingBufferHeight !== this._configuration.height
		)
			throw new Error('Native drawing buffer is unavailable or mismatched.');
		this._presentationContext.drawImage(this._sceneRuntime.canvas, 0, 0);
		if (!this._configuration.fixedCamera) this._drawTitles(seconds);
		const receiverLight = this._mode.algorithm32.receiverLight;
		const color = this._mode.algorithm32.config.config.color;
		const attachment = this._mode.lightSource.sharedCacheAttachment;
		const sharedCache = attachment.diagnostics();
		if (sharedCache.gpuBytes > 859963392 || sharedCache.failures !== 0)
			throw new Error('Shared cache exceeded its unchanged two-atlas budget or failed.');
		const ordinal = sceneState.solarZenithDegrees >= 108 ? null : Math.floor(sceneState.solarZenithDegrees + 0.5);
		if (
			sharedCache.sceneOrdinal !== ordinal ||
			this._lighting.describe().receiverLightIdentity !== receiverLight.identity
		)
			throw new Error('Cache/source/receiver lighting publication is incoherent.');
		this._frames.push({
			animationSeconds: seconds,
			instant: sceneState.observation.instant,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			directionToSunModel: sceneState.directionToSourceModel,
			camera,
			sourceRegions: this._measurement.measure(this._presentation),
			cacheIdentity: this._configuration.asset.packageSetIdentity,
			sharedScene: ordinal === null ? 'dark' : String(ordinal),
			sharedCache,
			receiverLightIdentity: receiverLight.identity,
			receiverLight,
			lighting: this._lighting.describe(),
			runtime,
			color: {model: color.id, illuminanceLux: receiverLight.photopicTotalHorizontalIlluminance.value},
		});
	}

	/**
	 * Called by the recorder to preserve the current native presentation as lossless PNG.
	 *
	 * @param {number} slot - Output presentation slot.
	 * @returns {Promise<unknown>} - Parent-owned artifact receipt.
	 */
	async _capture(slot) {
		const bytes = new Uint8Array(await (await this._presentation.convertToBlob({type: 'image/png'})).arrayBuffer());
		return window.__theHoursCapture(slot, this._encodeBytes(bytes));
	}

	/**
	 * Call this method to prepare the production scene and retain actual one-second environment measurements.
	 * Any package, capability or physical-measurement failure rejects the run.
	 *
	 * @returns {Promise<void>} - Complete measured environment table.
	 */
	async prepare() {
		this._catalog = await loadBrightest2000StellarCatalogPackage();
		this._vision = await loadHumanVisionFilterPackage();
		const canvas = document.querySelector('canvas');
		this._sceneRuntime = new ThreeSceneRuntime(canvas, (message) => this._failures.push(message), {
			frameCadence: 'manual',
			sceneColorPrecision: this._configuration.sceneColorPrecision,
		});
		this._sceneRuntime.start();
		const initial = this._sceneState(this._clock.stateAt(this._configuration.startSeconds));
		const geometry = initial.geometry;
		geometry.configureLightSource({
			lightSource: new DistantSunLightSource({angularRadius: ATMOSPHERE_SOURCE_ANGULAR_RADIUS}),
			observation: initial.observation,
			placement: {kind: 'distant-direction', directionToLight: initial.directionToSourceModel},
		});
		this._observatory = new TheHoursObservatoryScene({
			three: THREE,
			scene: this._sceneRuntime.scene,
			geometry,
			random: new TheHoursRandom(),
			seed: 3202609,
			sunriseDirectionScene: this._configuration.original.solar.sunriseDirectionScene,
			sunsetDirectionScene: this._configuration.original.solar.sunsetDirectionScene,
		});
		this._lighting = new TheHoursDesertSceneLighting({
			three: THREE,
			parent: this._sceneRuntime.scene,
			neutralLambertianClass: NeutralLambertianSceneLighting,
			neutralReflectance: NEUTRAL_LAMBERTIAN_REFLECTANCE,
			shadowExtentMeters: 450,
			shadowFocusMeters: [0, 12, 0],
		});
		const endpoint = {
			updateDistantSunLighting: (direction, receiver, color) =>
				this._lighting.updateFromDistantSun(direction, receiver, color),
			getSceneDepthEndpointPositions: () => this._observatory.getSceneDepthEndpointPositions(),
		};
		this._controller = new ModeController({
			sceneRuntime: this._sceneRuntime,
			endpointScene: endpoint,
			createMode: this._createMode.bind(this),
			createRuntime: (configuration) => {
				this._runtime = new Algorithm32Runtime(configuration);
				return this._runtime;
			},
			onPreparing: () => undefined,
			onReverted: () => undefined,
			onFailure: (message) => this._failures.push(message),
			onPublished: (_kind, mode) => {
				this._mode = /** @type {SphericalDistantMode} */ (mode);
			},
		});
		this._director = new TheHoursObservatoryCamera({camera: this._sceneRuntime.camera, durationSeconds: 60});
		this._presentation = new OffscreenCanvas(this._configuration.width, this._configuration.height);
		this._presentationContext = this._presentation.getContext('2d', {alpha: false});
		const first = Math.max(0, Math.floor(this._configuration.startSeconds) - 1);
		const last = Math.min(
			60,
			Math.ceil(this._configuration.startSeconds + this._configuration.durationSeconds) + 1,
		);
		for (let seconds = first; seconds <= last; seconds += 1) {
			await this._publish(seconds, false);
			this._samples.add(seconds, this._mode.algorithm32.receiverLight);
			await window.__theHoursProgress({
				phase: 'measured-lighting',
				completed: seconds - first + 1,
				total: last - first + 1,
			});
		}
		await window.__theHoursWriteJson('lighting-samples.json', this._samples.describe());
	}

	/**
	 * Call this method to record every ideal slot through the original reusable recording workflow.
	 * Native lossless frames are retained for every short-proof slot; final-film captures
	 * include the named early publications and authored milestone frames.
	 *
	 * @returns {Promise<TheHoursBrowserResult>} - Complete frame trace and independent recording facts.
	 */
	async record() {
		const facts = await new TheHoursRecorder({
			...this._configuration,
			presentation: this._presentation,
			render: this._render.bind(this),
			capture: this._capture.bind(this),
		}).record();
		return {...facts, frames: this._frames, scene: this._observatory.describe()};
	}

	/** Call this method to exercise each of the 109 representative scenes through normal production publication.
	 * A synthetic great-circle observer route covers zeniths unavailable in the film's
	 * fixed San Jose day. Scene 108 uses 107.75 degrees, within its visible half-degree
	 * interval; explicit darkness remains the ordinary cutoff at 108 degrees.
	 *
	 * @returns {Promise<TheHoursSceneTraversalResult>} - Actual complete source/receiver/cache and resource facts.
	 */
	async qualifyScenes() {
		const seed = this._clock.stateAt(30),
			subsolar = SolarPosition.resolveSubsolarLocation(seed.observation.instant);
		const latitude = AngleMath.toRadians(subsolar.latitude),
			longitude = AngleMath.toRadians(subsolar.longitude);
		/** Complete actual production publications. @type {TheHoursSceneTraversalCase[]} */
		let scenes = [];
		for (let ordinal = 0; ordinal <= 108; ordinal += 1) {
			const targetZenithDegrees = ordinal === 108 ? 107.75 : ordinal,
				angle = (targetZenithDegrees * Math.PI) / 180;
			const observerLatitude = Math.asin(Math.sin(latitude) * Math.cos(angle));
			const rawLongitude = longitude + Math.atan2(Math.sin(angle), Math.cos(latitude) * Math.cos(angle));
			const state = {
				...seed,
				locationLabel: `Synthetic complete-cache qualification ${ordinal}`,
				observation: {
					...seed.observation,
					location: {
						latitude: AngleMath.inRadians(observerLatitude),
						longitude: AngleMath.inRadians(Math.atan2(Math.sin(rawLongitude), Math.cos(rawLongitude))),
					},
				},
			};
			const result = await this._controller.switchTo('spherical-distant', state);
			if (!result || this._failures.length) throw new Error('Complete-scene publication failed.');
			const scene = this._sceneState(state),
				cache = this._mode.lightSource.sharedCacheAttachment.diagnostics();
			this._sceneRuntime.stepFrame();
			const receiver = this._mode.algorithm32.receiverLight,
				lighting = this._lighting.describe(),
				runtime = this._runtime.describeEvidence();
			if (
				Math.abs(scene.solarZenithDegrees - targetZenithDegrees) > 1e-5 ||
				cache.sceneOrdinal !== ordinal ||
				cache.failures ||
				cache.gpuBytes > 859963392 ||
				lighting.receiverLightIdentity !== receiver.identity ||
				!runtime.installed ||
				runtime.shaderErrors.length
			)
				throw new Error(`Scene ${ordinal} failed coherent native publication.`);
			scenes.push({
				ordinal,
				targetZenithDegrees,
				actualZenithDegrees: scene.solarZenithDegrees,
				observation: state.observation,
				sourceDirection: [...this._mode.geometry.configuration.directionToSource],
				cache,
				receiver,
				lighting,
				runtime,
			});
			await window.__theHoursProgress({phase: 'complete-scene-publication', completed: ordinal + 1, total: 109});
		}
		return {
			scenes,
			count: scenes.length,
			maximumCacheGpuBytes: Math.max(...scenes.map((scene) => scene.cache.gpuBytes)),
			pass: scenes.length === 109,
		};
	}

	/**
	 * Call this method to release owners in reverse lifecycle order after proof completion or failure.
	 *
	 * @returns {void} - Session resources released.
	 */
	dispose() {
		this._controller?.dispose();
		this._assets.dispose();
		this._lighting?.dispose();
		this._observatory?.dispose();
		this._sceneRuntime?.dispose();
	}
}
