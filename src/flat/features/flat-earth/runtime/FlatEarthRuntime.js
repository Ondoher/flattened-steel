import {PointerLookController} from './PointerLookController.js';
import DistanceMath from '../../../../algorithm32/math/DistanceMath.js';
import {FlatEarthGraphics} from './FlatEarthGraphics.js';
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {Algorithm32} from '../../../../algorithm32/implementation/algorithm32/Algorithm32.js';
import {Algorithm32Bindings} from '../../../../algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ColorResetAltitudeHalfV1ColorDisplayModel} from '../../../../algorithm32/implementation/color-reset-altitude-half-v1/ColorResetAltitudeHalfV1ColorDisplayModel.js';
import {DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY} from '../../../../algorithm32/implementation/color-reset-altitude-half-v1/consts.js';

/**
 * Owns one canvas and production Algorithm32 flat/local frame without importing the Flat32 test bed.
 *
 * @implements {FlatEarthRuntimeCapability}
 */
export class FlatEarthRuntime {
	/**
	 * Creates renderer/camera resources for one mounted feature view.
	 *
	 * @param {HTMLCanvasElement} canvas - Mounted presentation surface.
	 * @param {FlatEarthModelService} model - Registered scoped camera capability.
	 * @param {string} viewId - Exact mounted view identity.
	 * @param {(error: Error) => void} onFailure - Owning session's failure observer.
	 * @param {(change: FlatEarthCameraChange) => void} onCameraChange - Camera state accepted by the session.
	 * @param {FlatEarthGraphicsResources} [graphics] - Startup context and cache transferred to this view.
	 */
	constructor(canvas, model, viewId, onFailure, onCameraChange, graphics = new FlatEarthGraphics(canvas)) {
		this.graphics = graphics;
		this.canvas = canvas;
		this.model = model;
		this.viewId = viewId;
		let camera = model.getCamera(viewId);
		this.onFailure = onFailure;
		this.onCameraChange = onCameraChange;
		this.lookStatus = /** @type {FlatEarthCameraState['lookStatus']} */ ('idle');
		this.disposed = false;
		/** @type {SceneScale} */
		this.sceneScale = {value: 1000, units: 'meters-per-scene-unit'};
		this.renderer = graphics.renderer;
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.camera = new THREE.PerspectiveCamera(camera.fieldOfViewDegrees, 1, 0.0001, 50000);
		this.camera.position.set(0, camera.observerHeightMeters / this.sceneScale.value, 0);
		this.camera.quaternion.fromArray(camera.orientation);
		this._onLookChange = this._onLookChange.bind(this);
		this.pointerLook = new PointerLookController(
			canvas,
			this.camera,
			(status) => {
				this.lookStatus = status;
				this._reportCamera();
			},
			this._onLookChange,
		);
		/** @type {PreparedLocalSunFrame|null} */
		this.active = null;
		this.backend = graphics.backend;
		this.frames = graphics.frames;
		graphics.stageFrame = (request) => this._stage(request);
		void graphics.warm().catch((error) => {
			if (!this.disposed) {
				this.onFailure(error);
			}
		});
		/** @type {Promise<void>|null} */
		this.pending = null;
		/** @type {number|null} */
		this._renderRequest = null;
		this._onContextLost = this._onContextLost.bind(this);
		canvas.addEventListener('webglcontextlost', this._onContextLost);
		this.resizeObserver = new ResizeObserver(() => this._resize());
		this.resizeObserver.observe(canvas);
		this._resize();
	}

	/**
	 * Called after native input or camera commands to report accepted orientation without mutating the model.
	 */
	_reportCamera() {
		this.onCameraChange({
			orientation: /** @type {FlatEarthCameraOrientation} */ (this.camera.quaternion.toArray()),
			lookStatus: this.lookStatus,
		});
	}

	/**
	 * Called by actual mouse rotation to redraw the retained scene and report the accepted pose.
	 */
	_onLookChange() {
		try {
			this.camera.updateMatrixWorld(true);
			if (this.active) {
				this._support(this.active.profile);
			}
			this._requestRender();
			this._reportCamera();
		} catch (error) {
			this.camera.quaternion.fromArray(this.model.getCamera(this.viewId).orientation);
			this.onFailure(error);
		}
	}

	/**
	 * Called by actual camera changes to coalesce on-demand redraws without creating a simulation clock.
	 */
	_requestRender() {
		if (this.disposed || !this.active || this._renderRequest != null) {
			return;
		}
		this._renderRequest = requestAnimationFrame(() => {
			this._renderRequest = null;
			if (this.disposed) {
				return;
			}
			try {
				this.active?.contents.renderFrame();
			} catch (error) {
				this.onFailure(error);
			}
		});
	}

	/**
	 * Call this method to change framing on the retained camera without replacing cache or scene objects.
	 *
	 * @param {number} degrees - Accepted vertical perspective FOV.
	 */
	setFieldOfView(degrees) {
		let previous = this.camera.fov;
		try {
			this.camera.fov = degrees;
			this.camera.updateProjectionMatrix();
			if (this.active) {
				this._support(this.active.profile);
			}
			this._requestRender();
			this._reportCamera();
		} catch (error) {
			this.camera.fov = previous;
			this.camera.updateProjectionMatrix();
			throw error;
		}
	}

	/**
	 * Call this method to point at the Sun belonging to the displayed physical observation.
	 */
	centerOnSun() {
		if (!this.active) {
			return;
		}
		let profile = this.active.profile;
		let geometry = /** @type {FlatEarthPhysicalGeometry} */ (profile.models.geometry);
		let target = geometry.mapModelPositionToObserverLocalScenePoint(
			profile.models.lightSource.configuration.position,
			{sceneScale: this.sceneScale},
		);
		try {
			this.camera.lookAt(...target.coordinates);
			this.camera.updateMatrixWorld(true);
			this._support(this.active.profile);
			this._requestRender();
			this._reportCamera();
		} catch (error) {
			this.camera.quaternion.fromArray(this.model.getCamera(this.viewId).orientation);
			throw error;
		}
	}

	/**
	 * Called by frame preparation to stage requested elevation without moving the displayed camera.
	 *
	 * @param {Distance} height - Requested physical elevation.
	 * @returns {FlatEarthThreeCamera} - Independent camera for the candidate.
	 */
	_cameraAtHeight(height) {
		let camera = this.camera.clone();
		camera.position.y = DistanceMath.toMeters(height) / this.sceneScale.value;
		camera.updateMatrixWorld(true);
		return camera;
	}

	/**
	 * Called by the canvas to report a recoverable context failure to its session.
	 *
	 * @param {Event} event - Native graphics-context loss.
	 */
	_onContextLost(event) {
		event.preventDefault();
		this.active = null;
		try {
			this.frames.handleContextLoss();
		} catch (error) {
			this.onFailure(error);
			return;
		}
		this.onFailure(new Error('The graphics context was lost. Retry after it recovers.'));
	}

	/**
	 * Called by layout changes to resize the owned camera and displayed composer.
	 */
	_resize() {
		if (this.disposed) {
			return;
		}
		let {width, height} = this.canvas.getBoundingClientRect();
		if (width <= 0 || height <= 0) {
			return;
		}
		this.renderer.setSize(Math.round(width), Math.round(height), false);
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		if (this.active) {
			try {
				this.active.contents.renderFrame();
			} catch (error) {
				this.onFailure(error);
			}
		}
	}

	/**
	 * Called by preparation/resize to read the actual drawing-buffer dimensions.
	 *
	 * @returns {PixelSize} - Drawing-buffer size in physical pixels.
	 */
	_viewport() {
		let size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
		return {width: size.x, height: size.y, units: 'pixels'};
	}

	/**
	 * Called before rendering to update the exact camera and physical display bindings.
	 *
	 * @param {FlatEarthPreparedScene} frame - Complete prepared frame.
	 */
	_updateBindings(frame) {
		Algorithm32Bindings.update({
			bindingValues: frame.bindings,
			camera: frame.camera,
			props: {config: frame.algorithm.config.config, sceneScale: this.sceneScale},
		});
		let color = frame.color;
		frame.bindings[DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY] = color.displayAdaptationIlluminance(
			frame.algorithm.totalHorizontalIlluminance,
			{value: 0, units: 'meters'},
		).value;
	}

	/**
	 * Called at publication and layout changes to size all frame-owned targets.
	 *
	 * @param {FlatEarthPreparedScene} frame - Prepared frame.
	 */
	_resizeFrame(frame) {
		let size = this._viewport();
		frame.composer.setSize(size.width, size.height);
	}

	/**
	 * Call this method to build and publish one exact shared location/time observation.
	 *
	 * @param {GeometryObservation} observation - Exact shared location and timestamp.
	 * @param {AbortSignal} signal - Session update cancellation.
	 * @param {Distance} [observerHeight] - Requested height, defaulting to the accepted model value.
	 * @returns {Promise<void>} - Completion after atomic frame publication.
	 */
	async prepare(
		observation,
		signal,
		observerHeight = {value: this.model.getCamera(this.viewId).observerHeightMeters, units: 'meters'},
	) {
		this.pending = this._prepare(observation, signal, observerHeight);
		try {
			await this.pending;
		} finally {
			this.pending = null;
		}
	}

	/**
	 * Called by the session's serial update lane to prepare a complete unpublished candidate.
	 *
	 * @param {GeometryObservation} observation - Exact requested observation.
	 * @param {AbortSignal} signal - Cancellation checked before every publication.
	 * @param {Distance} observerHeight - Exact requested elevation for this candidate.
	 * @returns {Promise<void>} - Completion after publication or cleanup of a failed candidate.
	 */
	async _prepare(observation, signal, observerHeight) {
		signal.throwIfAborted();
		await this.graphics.warm();
		signal.throwIfAborted();
		let profile = FlatEarthGraphics.createProfile(observation, {
			value: DistanceMath.toMeters(observerHeight),
			units: 'meters',
		});
		let frame = await this.frames.prepareLocalFrame(
			{
				profile,
				viewRays: [this._support(profile, this._cameraAtHeight(observerHeight))],
				presentationIdentity: 'flat-earth-native15-altitude-half-v1',
				// No additional cache payload is held outside the frame controller; display targets belong to this renderer.
				otherOwnedGpuBytes: {value: 0, units: 'bytes'},
			},
			signal,
		);
		signal.throwIfAborted();
		if (this.disposed) {
			throw new DOMException('Scene released.', 'AbortError');
		}
		let publication = this.frames.publishPreparedLocalFrame(frame, () => {
			try {
				frame.contents.sceneView?.publish();
				frame.contents.renderFrame();
			} catch (error) {
				frame.contents.sceneView?.revert();
				throw error;
			}
		});
		this.active = frame;
		this.pointerLook.start();
		if (publication.retirementErrors.length) {
			throw new AggregateError(publication.retirementErrors, 'Previous scene release failed.');
		}
	}

	/**
	 * Called by preparation and rendering to let geometry validate the actual perspective cone.
	 *
	 * @param {LocalSunCompactConstructionProfile} profile - Exact live geometry and physical cache support.
	 * @param {FlatEarthThreeCamera} [camera] - Candidate or retained live camera.
	 * @returns {LocalSunFrameSupportRay} - Geometry-owned complete supported ray envelope.
	 */
	_support(profile, camera = this.camera) {
		let geometry = /** @type {FlatEarthPhysicalGeometry} */ (profile.models.geometry);
		camera.updateMatrixWorld(true);
		let direction = camera.getWorldDirection(new THREE.Vector3());
		let position = camera.getWorldPosition(new THREE.Vector3());
		let tangent = Math.tan((camera.getEffectiveFOV() * Math.PI) / 360);
		return geometry.resolveCompactViewSupport({
			origin: geometry.mapObserverLocalScenePointToModelPosition(
				{coordinates: [position.x, position.y, position.z], units: 'scene-units'},
				{sceneScale: this.sceneScale},
			),
			forward: geometry.mapObserverLocalSceneDirectionToModelDirection([direction.x, direction.y, direction.z]),
			halfAngle: {value: Math.atan(Math.hypot(tangent, tangent * camera.aspect)), units: 'radians'},
			coverageRadius: profile.domains.topology.coverageRadius,
		});
	}

	/**
	 * Called by the engine frame controller to stage a complete shader, light measurement, and renderer aggregate.
	 *
	 * @param {LocalSunFrameStageRequest} request - Exact live profile and admitted canonical cache lease.
	 * @returns {Promise<LocalSunPreparedFrameContents>} - Complete unpublished scene operation.
	 */
	async _stage(request) {
		let {profile, signal} = request;
		let observation = profile.models.geometry.configuration.observation;
		let geometry = /** @type {FlatEarthPhysicalGeometry} */ (profile.models.geometry);
		let source = /** @type {FlatEarthLocalSun} */ (profile.models.lightSource);
		let camera = this._cameraAtHeight({
			value: geometry.configuration.observerPosition.coordinates[2],
			units: 'meters',
		});
		let candidateHeight = camera.position.y;
		let previousHeight = this.camera.position.y;
		let color = new ColorResetAltitudeHalfV1ColorDisplayModel();
		let algorithm = new Algorithm32({
			profile: profile.createExecutionProfile({
				id: 'flat-earth-local-sun',
				family: 'flat-local-finite-sun-v1',
				localSun: source,
			}),
			color,
		});
		let scene = new THREE.Scene();
		scene.background = new THREE.Color(0x000000);
		let endpoints = geometry.createThreeEndpointObjects({
			sceneScale: this.sceneScale,
			visualMaterialLighting: 'lambert',
		});
		for (let object of [...endpoints.visualObjects, ...endpoints.raycastObjects]) {
			scene.add(/** @type {THREE.Object3D} */ (object));
		}
		let sourcePosition = geometry.mapModelPositionToObserverLocalScenePoint(source.configuration.position, {
			sceneScale: this.sceneScale,
		});
		source.addSceneLighting({
			sourceRelativePosition: geometry.resolveSourceRelativePosition({
				position: geometry.configuration.observerPosition,
			}),
			THREE,
			scene,
			sourcePosition,
			observerPosition: {coordinates: [0, camera.position.y, 0], units: 'scene-units'},
		});
		let viewportSize = this._viewport();
		let target = new THREE.WebGLRenderTarget(viewportSize.width, viewportSize.height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			type: THREE.HalfFloatType,
			format: THREE.RGBAFormat,
			depthBuffer: true,
			stencilBuffer: false,
		});
		target.texture.colorSpace = THREE.LinearSRGBColorSpace;
		let composer = new EffectComposer(this.renderer, target);
		composer.addPass(new RenderPass(scene, camera));
		let backend = this.backend;
		let sceneDepthMax = geometry.resolveSceneDepthMax({camera, sceneScale: this.sceneScale});
		let bindings = Algorithm32Bindings.create(THREE, sceneDepthMax);
		let frame = {algorithm, scene, composer, bindings, color, camera};
		let staged = false;
		try {
			this._updateBindings(frame);
			let handle = await algorithm.setupShader({
				THREE,
				composer,
				scene,
				camera,
				viewportSize,
				sceneScale: this.sceneScale,
				sceneDepthMax,
				bindingValues: bindings,
				cacheBackend: backend,
				preparedScatteringCacheController: request.cacheController,
				signal,
				cacheBuildScheduler: {
					yieldControl: async () => {
						signal.throwIfAborted();
						await new Promise((resolve) => setTimeout(resolve, 0));
						signal.throwIfAborted();
					},
				},
			});
			await handle.prepare(this.renderer);
			let receiverLight = await handle.prepareReceiverEnvironmentLight({
				THREE,
				renderer: this.renderer,
				backend,
				geometry,
				lightSource: source,
				observation,
				scatteringCache: request.cacheController.active,
				identity: request.identity,
				signal,
			});
			handle.publishReceiverEnvironmentLight(receiverLight, observation);
			signal.throwIfAborted();
			this._resizeFrame(frame);
			this._updateBindings(frame);
			this._support(profile, camera);
			composer.renderToScreen = false;
			composer.render();
			let diagnostics = /** @type {FlatEarthShaderDiagnostics} */ (handle.getDiagnostics());
			if ((diagnostics.runtime?.frameCount ?? 0) < 1 || (diagnostics.runtime?.renderErrorCount ?? 0) > 0) {
				throw new Error('The scene shader did not complete a frame.');
			}
			if (
				this.renderer.info.programs.some(
					(program) => /** @type {FlatEarthProgramDiagnostics} */ (program).diagnostics?.runnable === false,
				)
			) {
				throw new Error('The scene shader could not be compiled.');
			}
			let context = this.renderer.getContext();
			let previousTarget = this.renderer.getRenderTarget();
			let pixel = new Float32Array(4);
			try {
				this.renderer.setRenderTarget(composer.readBuffer);
				context.readPixels(0, 0, 1, 1, context.RGBA, context.FLOAT, pixel);
				if (context.getError() !== context.NO_ERROR || pixel.some((value) => !Number.isFinite(value))) {
					throw new Error('The scene output could not be read back as finite pixels.');
				}
			} finally {
				this.renderer.setRenderTarget(previousTarget);
			}
			signal.throwIfAborted();
			staged = true;
			return {
				shaderReady: true,
				sceneView: {
					publish: () => {
						previousHeight = this.camera.position.y;
						this.camera.position.y = candidateHeight;
						this.camera.updateMatrixWorld(true);
					},
					revert: () => {
						this.camera.position.y = previousHeight;
						this.camera.updateMatrixWorld(true);
					},
				},
				receiverLight,
				bindingValues: bindings,
				celestialInputs: {
					observation,
					sourcePosition: source.configuration.position,
					receiverPosition: geometry.configuration.observerPosition,
					sourceRadius: source.configuration.radius,
					stellarAdaptationLuminance: receiverLight.stellarAdaptationLuminance,
					receiverLightIdentity: receiverLight.identity,
				},
				renderFrame: () => {
					camera.copy(this.camera);
					this._support(profile, camera);
					this._resizeFrame(frame);
					this._updateBindings(frame);
					composer.renderToScreen = true;
					composer.render();
				},
				dispose: () => this._releaseFrame(frame),
			};
		} finally {
			if (!staged) {
				this._releaseFrame(frame);
			}
		}
	}

	/**
	 * Called when a candidate or displayed frame retires to release every owned resource.
	 *
	 * @param {FlatEarthPreparedScene} frame - Retired complete or partial frame.
	 * @returns {void} - All frame-local resources released; the frame controller owns its cache lease.
	 */
	_releaseFrame(frame) {
		let errors = [];
		for (let release of [
			() => frame.algorithm.dispose(),
			() => frame.composer.dispose(),
			() => {
				frame.scene.traverse((object) => {
					if (object instanceof THREE.Mesh) {
						object.geometry.dispose();
						let materials = Array.isArray(object.material) ? object.material : [object.material];
						for (let material of materials) {
							material.dispose();
						}
					}
				});
			},
		]) {
			try {
				release();
			} catch (error) {
				errors.push(error);
			}
		}
		if (errors.length) {
			throw new AggregateError(errors, 'Scene resource release failed.');
		}
	}

	/**
	 * Call this method after session cancellation to retire pending and displayed resources.
	 *
	 * @returns {Promise<void>} - Completion after owned graphics resources are released.
	 */
	async dispose() {
		if (this.disposed) {
			return;
		}
		this.disposed = true;
		this.pointerLook.dispose();
		if (this._renderRequest != null) {
			cancelAnimationFrame(this._renderRequest);
			this._renderRequest = null;
		}
		this.resizeObserver.disconnect();
		this.canvas.removeEventListener('webglcontextlost', this._onContextLost);
		let errors = [];
		for (let release of [
			() => this.frames.dispose(),
			async () => {
				try {
					await this.pending;
				} catch (error) {
					if (error instanceof AggregateError) {
						errors.push(error);
					}
				}
			},
			() => this.graphics.dispose(),
		]) {
			try {
				await release();
			} catch (error) {
				errors.push(error);
			}
		}
		this.active = null;
		if (errors.length) {
			throw new AggregateError(errors, 'Renderer release failed.');
		}
	}
}
