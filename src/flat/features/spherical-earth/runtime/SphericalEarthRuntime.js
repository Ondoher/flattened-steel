import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {PointerLookController} from '../../../common/PointerLookController.js';
import {Algorithm32} from '../../../../algorithm32/implementation/algorithm32/Algorithm32.js';
import {Algorithm32Bindings} from '../../../../algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ThreeCacheBackend} from '../../../../algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {SphericalEarthGeometry} from '../../../../algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {DistantSunLightSource} from '../../../../algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import DistantSunSharedCache from '../../../../algorithm32/implementation/distant-sun/cache/DistantSunSharedCache.js';
import {CanonicalAtmosphere} from '../../../../algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {ColorResetAltitudeHalfV1ColorDisplayModel} from '../../../../algorithm32/implementation/color-reset-altitude-half-v1/ColorResetAltitudeHalfV1ColorDisplayModel.js';
import {
	NeutralLambertianSceneLighting,
	NEUTRAL_LAMBERTIAN_REFLECTANCE,
} from '../../../../algorithm32/implementation/scene-lighting/NeutralLambertianSceneLighting.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../../../../algorithm32/profiles/native-15/native-15-profile.js';
import {NATIVE_48_POSITION_DOMAIN_OWNER} from '../../../../algorithm32/sampling-domains/index.js';
import DistanceMath from '../../../../algorithm32/math/DistanceMath.js';
import AngleMath from '../../../../algorithm32/math/AngleMath.js';
import {SphericalEarthShaderPresentation} from './SphericalEarthShaderPresentation.js';

/**
 * Retains one spherical scene and independently owned GPU attachment for a mounted view.
 *
 * @implements {SphericalEarthRuntimeCapability}
 */
export class SphericalEarthRuntime {
	/**
	 * Creates camera/context resources; physical preparation begins after attachment.
	 *
	 * @param {HTMLCanvasElement} canvas - Exact mounted surface.
	 * @param {SphericalEarthModelService} model - Registered scoped camera state.
	 * @param {string} viewId - Exact mounted view.
	 * @param {(error: Error) => void} onFailure - Session failure intent.
	 * @param {(change: SphericalEarthCameraChange) => void} onCameraChange - Accepted native pose.
	 * @param {StellarCatalogService} stellar - Shared immutable stellar capability.
	 * @param {DistantSunCacheService} cache - Shared package and transport capability.
	 */
	constructor(canvas, model, viewId, onFailure, onCameraChange, stellar, cache) {
		this.canvas = canvas;
		this.model = model;
		this.viewId = viewId;
		this.onFailure = onFailure;
		this.onCameraChange = onCameraChange;
		this.stellar = stellar;
		this.cache = cache;
		this.disposed = false;
		this.contextLost = false;
		/** @type {Promise<void>|null} */
		this.release = null;
		this.sceneScale = /** @type {SceneScale} */ ({value: 1000, units: 'meters-per-scene-unit'});
		this.renderer = new THREE.WebGLRenderer({canvas, antialias: false});
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.NoToneMapping;
		this.renderer.setPixelRatio(window.devicePixelRatio);
		try {
			this.backend = new ThreeCacheBackend({THREE, renderer: this.renderer});
		} catch (error) {
			this.renderer.dispose();
			throw error;
		}
		let accepted = model.getCamera(viewId);
		this.camera = new THREE.PerspectiveCamera(accepted.fieldOfViewDegrees, 1, 0.0001, 1200);
		this.camera.position.y = accepted.observerHeightMeters / this.sceneScale.value;
		this.camera.quaternion.fromArray(accepted.orientation);
		this.lookStatus = /** @type {SceneLookStatus} */ ('idle');
		this.pointerLook = new PointerLookController(
			canvas,
			this.camera,
			(status) => {
				this.lookStatus = status;
				this._reportCamera();
			},
			() => {
				this._requestRender();
				this._reportCamera();
			},
		);
		/** @type {SphericalEarthPreparedScene|null} */
		this.frame = null;
		/** @type {SphericalEarthSceneFacts|null} */
		this.current = null;
		/** @type {Promise<SphericalEarthFramePublication>|null} */
		this.pending = null;
		/** @type {number|null} */
		this.renderRequest = null;
		this.counters = {builds: 0, updates: 0, renders: 0};
		this._onContextLost = this._onContextLost.bind(this);
		canvas.addEventListener('webglcontextlost', this._onContextLost);
		this.resizeObserver = new ResizeObserver(() => this._resize());
		this.resizeObserver.observe(canvas);
		this._resize();
	}

	/**
	 * Called by physical preparation to create independent geometry without changing the displayed scene.
	 *
	 * @param {GeometryObservation} observation - Exact absolute time and location.
	 * @param {Distance} height - Requested physical eye height.
	 * @returns {SphericalEarthSceneFacts} - Geometry-derived solar placement.
	 */
	_facts(observation, height) {
		let profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
		let geometry = new SphericalEarthGeometry({
			bottomRadius: profile.physical.geometry.bottomRadius,
			topRadius: profile.physical.geometry.topRadius,
			observerHeight: height,
			observerUpDirection: [0, 0, 1],
			sceneFrame: {kind: 'observer-local'},
			cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN_OWNER.count,
			cacheBoundaryAltitude: NATIVE_48_POSITION_DOMAIN_OWNER.nodes[0].coordinate,
			sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
		});
		let placement = geometry.resolveDistantSunSceneState(observation);
		return {
			geometry,
			observation,
			height,
			direction: placement.directionToSourceModel,
			zenith: AngleMath.toDegrees(placement.observerSolarZenith),
		};
	}

	/**
	 * Called by native input to report accepted orientation through the session.
	 */
	_reportCamera() {
		this.onCameraChange({
			orientation: /** @type {SphericalEarthCameraOrientation} */ (this.camera.quaternion.toArray()),
			lookStatus: this.lookStatus,
		});
	}

	/**
	 * Called by layout changes to resize only retained drawing targets.
	 */
	_resize() {
		if (this.disposed || this.contextLost) {
			return;
		}
		let {width, height} = this.canvas.getBoundingClientRect();
		if (width <= 0 || height <= 0) {
			return;
		}
		this.renderer.setSize(Math.round(width), Math.round(height), false);
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		if (this.frame) {
			let size = this._viewport();
			this.frame.composer.setSize(size.width, size.height);
			this._requestRender();
		}
	}

	/**
	 * Called by preparation to read physical pixel dimensions.
	 *
	 * @returns {PixelSize} - Exact drawing-buffer dimensions.
	 */
	_viewport() {
		let size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
		return {width: size.x, height: size.y, units: 'pixels'};
	}

	/**
	 * Called by shader preparation and drawing to update owned live bindings without rebuilding the program.
	 */
	_bindings() {
		let frame = this.frame;
		Algorithm32Bindings.update({
			bindingValues: frame.bindings,
			camera: this.camera,
			props: {config: frame.algorithm.config.config, sceneScale: this.sceneScale},
		});
		frame.bindings['geometry.sceneDepthMax'] = frame.geometry.resolveSceneDepthMax({
			camera: this.camera,
			sceneScale: this.sceneScale,
			endpointScenePositions: frame.depthEndpoints,
		});
		frame.bindings['lightSource.direction'] = new THREE.Vector3(...frame.source.configuration.directionToLight);
		frame.bindings['transport.pathIntervalCount'] =
			DistanceMath.toMeters(frame.geometry.configuration.observerHeight) === 40000 ? 120 : 30;
		SphericalEarthShaderPresentation.apply(frame, this.model.getShaderOptions(this.viewId));
	}

	/**
	 * Called by scene publication and redraw to draw one complete observation.
	 */
	_render() {
		if (!this.frame || this.disposed || this.contextLost) {
			return;
		}
		this.camera.updateMatrixWorld(true);
		this._bindings();
		SphericalEarthShaderPresentation.render(
			this.frame,
			this.renderer,
			this.model.getShaderOptions(this.viewId).mode,
		);
		this.counters.renders++;
	}

	/**
	 * Called by camera/layout changes to coalesce on-demand redraws.
	 */
	_requestRender() {
		if (this.renderRequest != null || !this.current || this.disposed || this.contextLost) {
			return;
		}
		this.renderRequest = requestAnimationFrame(() => {
			this.renderRequest = null;
			try {
				this._render();
			} catch (error) {
				this.onFailure(error);
			}
		});
	}

	/**
	 * Call this method to change vertical perspective without requesting cache data.
	 *
	 * @param {number} degrees - Accepted perspective angle.
	 */
	setFieldOfView(degrees) {
		this.camera.fov = degrees;
		this.camera.updateProjectionMatrix();
		this._requestRender();
	}

	/**
	 * Call this method to redraw the model's selected sky presentation.
	 */
	refreshShaderOptions() {
		this._requestRender();
	}

	/**
	 * Call this method to aim at the Sun belonging to the currently displayed observation.
	 */
	centerOnSun() {
		if (!this.current) {
			return;
		}
		let [east, north, up] = this.current.direction;
		this.camera.lookAt(east, this.camera.position.y + up, -north);
		this._requestRender();
		this._reportCamera();
	}

	/**
	 * Called by the context to mark a recoverable renderer failure.
	 *
	 * @param {Event} event - Native context event.
	 */
	_onContextLost(event) {
		this.contextLost = true;
		event.preventDefault();
		this.onFailure(new Error('The graphics context was lost. Retry after recovery.'));
		void this.dispose().catch((error) => {
			console.error('Spherical Earth lost-context cleanup failed.', error);
		});
	}

	/**
	 * Call this method to prepare and publish one exact requested observation.
	 *
	 * @param {GeometryObservation} observation - Shared physical inputs.
	 * @param {AbortSignal} signal - Session cancellation.
	 * @param {Distance} height - Requested physical eye height.
	 * @returns {Promise<SphericalEarthFramePublication>} - Complete publication and separate cleanup failures.
	 */
	async prepare(observation, signal, height) {
		let facts = this._facts(observation, height);
		this.pending = this.frame ? this._update(facts, signal) : this._build(facts, signal);
		try {
			return await this.pending;
		} finally {
			this.pending = null;
		}
	}

	/**
	 * Called for the first complete observation to construct the scene and shader once.
	 *
	 * @param {SphericalEarthSceneFacts} facts - Geometry-derived placement.
	 * @param {AbortSignal} signal - Independent view cancellation.
	 * @returns {Promise<SphericalEarthFramePublication>} - Initial complete publication.
	 */
	async _build(facts, signal) {
		let [stellar, selection] = await Promise.all([
			this.stellar.load(signal),
			this.cache.select(facts.zenith, signal),
		]);
		signal.throwIfAborted();
		let geometry = facts.geometry;
		let source = new DistantSunLightSource({
			angularRadius: {value: 0.004675, units: 'radians'},
			sharedCache: selection,
		});
		let color = new ColorResetAltitudeHalfV1ColorDisplayModel({
			presentationFilterRegistry: stellar.presentationFilters,
		});
		let algorithm = new Algorithm32({
			lightSource: source,
			geometry,
			atmosphere: new CanonicalAtmosphere(),
			groundBoundary: null,
			celestialSources: {
				id: 'spherical-earth-sun-stars',
				family: 'spherical-sun-stars-radial-v1',
				sun: source,
				stars: stellar.source,
			},
			color,
			presentationFilterRegistry: stellar.presentationFilters,
			observation: facts.observation,
			sourcePlacement: {kind: 'distant-direction', directionToLight: facts.direction},
			execution: {
				pathIntervalCount: 30,
				pathSampleDistribution: {kind: 'quadratic-near-observer-v1'},
				maximumScatteringOrder: 4,
			},
		});
		let scene = new THREE.Scene();
		scene.background = new THREE.Color(0);
		let endpoints = geometry.createThreeEndpointObjects({
			sceneScale: this.sceneScale,
			groundExtent: {value: 1800000, units: 'meters'},
			visualMaterialColor: 0x4fa33d,
			visualMaterialLighting: 'lambert',
			widthSegments: 512,
			heightSegments: 512,
			groundVisualMesh: {
				kind: 'local-spherical-patch',
				xExtent: {value: 900, units: 'scene-units'},
				zMin: {value: -900, units: 'scene-units'},
				zMax: {value: 900, units: 'scene-units'},
			},
		});
		for (let object of [...endpoints.visualObjects, ...endpoints.raycastObjects]) {
			scene.add(/** @type {THREE.Object3D} */ (object));
		}
		let depthEndpoints = this._depthEndpoints(endpoints.visualObjects);
		let direct = new THREE.DirectionalLight(0xffffff, 0),
			diffuse = new THREE.HemisphereLight(0xffffff, 0, 0),
			ambientLight = new THREE.AmbientLight(0xffffff, 0);
		scene.add(direct, direct.target, diffuse, ambientLight);
		let size = this._viewport();
		let target = new THREE.WebGLRenderTarget(size.width, size.height, {
			type: THREE.HalfFloatType,
			format: THREE.RGBAFormat,
			depthBuffer: true,
			stencilBuffer: false,
		});
		target.texture.colorSpace = THREE.LinearSRGBColorSpace;
		let composer = new EffectComposer(this.renderer, target);
		composer.addPass(new RenderPass(scene, this.camera));
		this.camera.position.y = DistanceMath.toMeters(facts.height) / this.sceneScale.value;
		let sceneDepthMax = geometry.resolveSceneDepthMax({
			camera: this.camera,
			sceneScale: this.sceneScale,
			endpointScenePositions: depthEndpoints,
		});
		let bindings = Algorithm32Bindings.create(THREE, sceneDepthMax);
		this.frame = {
			algorithm,
			geometry,
			source,
			scene,
			camera: this.camera,
			color,
			composer,
			bindings,
			depthEndpoints,
			direct,
			diffuse,
			ambientLight,
			lighting: {lights: [direct, diffuse]},
			sunLightIntensities: [0, 0],
			handle: null,
		};
		try {
			this._bindings();
			let handle = await algorithm.setupShader({
				THREE,
				composer,
				scene,
				camera: this.camera,
				viewportSize: size,
				sceneScale: this.sceneScale,
				sceneDepthMax,
				bindingValues: bindings,
				cacheBackend: this.backend,
				signal,
				cacheBuildScheduler: {yieldControl: () => new Promise((resolve) => setTimeout(resolve, 0))},
			});
			this.frame.handle = handle;
			await handle.prepare(this.renderer);
			await handle.measureReceiverEnvironmentLight({
				THREE,
				renderer: this.renderer,
				backend: this.backend,
				signal,
			});
			signal.throwIfAborted();
			this._lighting(facts.direction, algorithm.receiverLight);
			this._render();
			let diagnostics = /** @type {SphericalEarthShaderDiagnostics} */ (handle.getDiagnostics());
			if (
				(diagnostics.runtime?.frameCount ?? 0) < 1 ||
				(diagnostics.runtime?.renderErrorCount ?? 0) > 0 ||
				this.renderer.info.programs.some(
					(program) =>
						/** @type {SphericalEarthProgramDiagnostics} */ (program).diagnostics?.runnable === false,
				)
			) {
				throw new Error('The spherical shader did not complete a valid frame.');
			}
			this.current = facts;
			this.counters.builds++;
			this.pointerLook.start();
			return {retirementErrors: []};
		} catch (error) {
			this._releaseFrame();
			throw error;
		}
	}

	/**
	 * Called by observation updates to prepare matching cache and receiver facts on the retained scene.
	 *
	 * @param {SphericalEarthSceneFacts} facts - New independent physical state.
	 * @param {AbortSignal} signal - Session cancellation.
	 * @returns {Promise<SphericalEarthFramePublication>} - Atomic publication with separate retirement failures.
	 */
	async _update(facts, signal) {
		let frame = this.frame,
			attachment = frame.source.sharedCacheAttachment;
		let source = new DistantSunLightSource({
			angularRadius: frame.source.configuration.angularRadius,
			sourceIrradiance: frame.source.configuration.sourceIrradiance,
		});
		facts.geometry.configureLightSource({
			lightSource: source,
			observation: facts.observation,
			placement: {kind: 'distant-direction', directionToLight: facts.direction},
		});
		let ordinal = facts.zenith >= 108 ? null : Math.floor(facts.zenith + 0.5);
		let candidate = await attachment.prepareScene(ordinal, {}, signal);
		if (!candidate) {
			throw new Error(
				attachment.diagnostics().lastError || 'Spherical cache preparation held the previous scene.',
			);
		}
		let view = new DistantSunSharedCache(this.backend, candidate);
		let previous = this._facts(this.current.observation, this.current.height);
		let previousSource = new DistantSunLightSource({angularRadius: source.configuration.angularRadius});
		previous.geometry.configureLightSource({
			lightSource: previousSource,
			observation: previous.observation,
			placement: {kind: 'distant-direction', directionToLight: previous.direction},
		});
		let oldLight = frame.algorithm.receiverLight;
		let publishGeometry = frame.geometry.prepareSharedPublication(facts.geometry, frame.source);
		let restoreGeometry = frame.geometry.prepareSharedPublication(previous.geometry, frame.source);
		let publishSource = frame.source.prepareSharedDirection(facts.direction, ordinal);
		let restoreSource = frame.source.prepareSharedDirection(
			previous.direction,
			previous.zenith >= 108 ? null : Math.floor(previous.zenith + 0.5),
		);
		let installed = false;
		try {
			let measurement = await frame.handle.prepareReceiverEnvironmentLight({
				THREE,
				renderer: this.renderer,
				backend: this.backend,
				geometry: facts.geometry,
				lightSource: source,
				observation: facts.observation,
				scatteringCache: view,
				identity: `spherical:${this.viewId}:${candidate.snapshot.generation}:${facts.observation.instant}`,
				signal,
			});
			signal.throwIfAborted();
			let publication = attachment.installPrepared(candidate.snapshot.generation, () => {
				installed = true;
				publishSource();
				publishGeometry();
				this.camera.position.y = DistanceMath.toMeters(facts.height) / this.sceneScale.value;
				frame.handle.publishReceiverEnvironmentLight(measurement, facts.observation);
				this._lighting(facts.direction, measurement);
				this._render();
			});
			this.current = facts;
			this.counters.updates++;
			return {retirementErrors: publication.retirementErrors};
		} catch (error) {
			if (installed) {
				restoreSource();
				restoreGeometry();
				this.camera.position.y = DistanceMath.toMeters(previous.height) / this.sceneScale.value;
				frame.handle.publishReceiverEnvironmentLight(oldLight, previous.observation);
				this._lighting(previous.direction, oldLight);
				this._render();
			}
			attachment.cancelPreparation();
			throw error;
		} finally {
			view.dispose();
		}
	}

	/**
	 * Called once to retain the fixed ground's scene-space bounds for live depth encoding.
	 *
	 * @param {readonly unknown[]} objects - Geometry-owned visual endpoints.
	 * @returns {ScenePosition[]} - Corners covering all visible ground through the supported horizon.
	 */
	_depthEndpoints(objects) {
		/** @type {ScenePosition[]} */
		let positions = [];
		for (let object of objects) {
			let bounds = new THREE.Box3().setFromObject(/** @type {THREE.Object3D} */ (object), true);
			for (let x of [bounds.min.x, bounds.max.x]) {
				for (let y of [bounds.min.y, bounds.max.y]) {
					for (let z of [bounds.min.z, bounds.max.z]) {
						positions.push({coordinates: [x, y, z], units: 'scene-units'});
					}
				}
			}
		}
		return positions;
	}

	/**
	 * Called by physical publication to bridge receiver spectra into the neutral Lambertian renderer lights.
	 *
	 * @param {UnitVector3} direction - Model-space direction to Sun.
	 * @param {ReceiverEnvironmentLightMeasurement} measurement - Complete physical measurement.
	 */
	_lighting(direction, measurement) {
		let frame = this.frame;
		let response = new NeutralLambertianSceneLighting().evaluate({
			identity: measurement.identity + ':spherical-ground',
			directNormal: measurement.directNormal,
			diffuseIrradiance: measurement.diffuseHorizontal,
			surfaceNormal: direction,
			directionToSource: direction,
		});
		for (let [light, packet] of [
			[frame.direct, response.directRadiance],
			[frame.diffuse, response.diffuseRadiance],
		]) {
			let rgb = frame.color
				.radianceToLinearSrgb(/** @type {SpectralRadiancePacket} */ (packet))
				.map((value) => (value * Math.PI) / NEUTRAL_LAMBERTIAN_REFLECTANCE);
			let toneMap = frame.color.displayConstants.paperFigure1ToneMapK;
			rgb = rgb.map((value) => {
				let display = 1 - Math.exp(-Math.max(value, 0) * toneMap);
				return display <= 0.04045 ? display / 12.92 : ((display + 0.055) / 1.055) ** 2.4;
			});
			let peak = Math.max(...rgb.map(Math.abs));
			let target = /** @type {THREE.Light} */ (light);
			target.color.setRGB(
				.../** @type {[number,number,number]} */ (rgb.map((value) => (peak ? value / peak : 0))),
			);
			target.intensity = peak;
		}
		frame.direct.position.set(direction[0], direction[2], -direction[1]);
		frame.sunLightIntensities = frame.lighting.lights.map((light) => light.intensity);
	}

	/**
	 * Called by failure/disposal to retire all owned scene resources.
	 */
	_releaseFrame() {
		let frame = this.frame;
		this.frame = null;
		if (!frame) {
			return;
		}
		let errors = [];
		let releases = [() => frame.algorithm.dispose(), () => frame.composer.dispose()];
		frame.scene.traverse((object) => {
			if (object instanceof THREE.Mesh) {
				releases.push(() => object.geometry.dispose());
				let materials = Array.isArray(object.material) ? object.material : [object.material];
				for (let material of materials) {
					releases.push(() => material.dispose());
				}
			}
		});
		for (let release of releases) {
			try {
				release();
			} catch (error) {
				errors.push(error);
			}
		}
		if (errors.length) {
			throw new AggregateError(errors, 'Spherical scene resource retirement failed.');
		}
	}

	/**
	 * Call this method to distinguish retryable preparation failure from invalid graphics ownership.
	 *
	 * @returns {boolean} - Whether the last complete scene can remain displayed during retry.
	 */
	canRetryRetained() {
		return Boolean(
			this.current &&
			this.frame &&
			!this.disposed &&
			!this.contextLost &&
			!this.renderer.getContext().isContextLost(),
		);
	}

	/**
	 * Call this method after session cancellation to release pending work, GPU resources and listeners.
	 *
	 * @returns {Promise<void>} - Completed release.
	 */
	dispose() {
		if (!this.release) {
			this.disposed = true;
			this.release = this._dispose();
		}
		return this.release;
	}

	/**
	 * Called once to retire resources before a lost context can restore obsolete native handles.
	 *
	 * @returns {Promise<void>} - Exact shared release completion.
	 */
	async _dispose() {
		this.pointerLook.dispose();
		this.resizeObserver.disconnect();
		this.canvas.removeEventListener('webglcontextlost', this._onContextLost);
		if (this.renderRequest != null) {
			cancelAnimationFrame(this.renderRequest);
			this.renderRequest = null;
		}
		let errors = [];
		try {
			await this.pending;
		} catch (error) {
			if (error instanceof AggregateError) {
				errors.push(error);
			}
		}
		for (let release of [() => this._releaseFrame(), () => this.backend.dispose(), () => this.renderer.dispose()]) {
			try {
				release();
			} catch (error) {
				errors.push(error);
			}
		}
		if (errors.length) {
			throw new AggregateError(errors, 'Spherical renderer cleanup failed.');
		}
	}
}
