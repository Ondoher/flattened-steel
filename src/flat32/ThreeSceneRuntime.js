import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';

import {
	ATMOSPHERE_SCENE_COLOR_TARGET_NAME,
	CAMERA_FAR_SCENE_UNITS,
	CAMERA_FIELD_OF_VIEW_DEGREES,
	CAMERA_LOOK_AT_SCENE,
	CAMERA_NEAR_SCENE_UNITS,
	CAMERA_POSITION_SCENE,
	LOCAL_SUN_SHADOW_MAP_SIZE,
	LOCAL_SUN_SHADOW_UPDATE_POLICY,
	SCENE_BACKGROUND_COLOR,
} from './consts.js';

/** Renderer-owned scene, presentation targets and frame-boundary publication.
 *
 * @implements {Flat32SceneRuntimeCapability}
 */
export class ThreeSceneRuntime {
	/** Pending application publications consumed before the next complete render.
	 *
	 * @type {Set<Flat32FrameBoundaryOperation>}
	 */
	_frameBoundaryOperations = new Set();
	/** Dirty state retained while hidden or suspended. */
	_renderRequested = false;
	/** Prevent publications within a frame from scheduling duplicate callbacks. */
	_rendering = false;
	/** Restored-context publication boundary before rendering resumes; never enabled while context is lost. */
	_restoringContext = false;

	/** Call this method to publish one prepared state immediately before the next render operation.
	 * During restored-context reconstruction, publication executes while rendering is suspended.
	 * Disposed, stopped or lost-context owners reject; wait for a running/restoring owner.
	 * Cancellation and callback failures propagate; discard or repair that candidate before retrying.
	 *
	 * @param {() => void} operation - Synchronous complete-state publication.
	 * @param {AbortSignal} signal - Caller-owned cancellation.
	 * @returns {Promise<void>} - Completion at the frame boundary.
	 */
	atFrameBoundary(operation, signal) {
		if (this._disposed || (!this._started && !this._restoringContext))
			return Promise.reject(new Error('Scene renderer is not running.'));
		signal.throwIfAborted();
		if (this._frameCadence === 'manual' || this._restoringContext) {
			try {
				operation();
				return Promise.resolve();
			} catch (error) {
				return Promise.reject(error);
			}
		}
		if (this._frameBoundaryOperations.size >= 4)
			return Promise.reject(new Error('Frame publication queue is full.'));
		return new Promise((resolve, reject) => {
			const pending = {
				operation,
				resolve,
				reject,
				signal,
				cancel: () => {
					this._frameBoundaryOperations.delete(pending);
					signal.removeEventListener('abort', pending.cancel);
					reject(signal.reason);
				},
			};
			signal.addEventListener('abort', pending.cancel, {once: true});
			this._frameBoundaryOperations.add(pending);
			this.requestRender();
		});
	}
	/**
	 * Creates a scene renderer with caller-selected cadence. Invalid cadence throws.
	 *
	 * @param {HTMLCanvasElement} canvas - Receives the solid scene.
	 * @param {(message: string) => void} onFailure - Reports browser failures.
	 * @param {Flat32SceneRuntimeConfiguration} [configuration] - Rendering cadence; on-demand browser frames by default.
	 */
	constructor(canvas, onFailure, configuration = {}) {
		const frameCadence = configuration.frameCadence ?? 'on-demand';
		if (!['on-demand', 'animation-frame', 'manual'].includes(frameCadence)) {
			throw new RangeError('Flat32 frame cadence must be on-demand, animation-frame or manual.');
		}
		this._frameCadence = frameCadence;
		const sceneColorPrecision = configuration.sceneColorPrecision ?? 'float16';
		if (!['float16', 'float32'].includes(sceneColorPrecision))
			throw new RangeError('Flat32 scene color precision is unsupported.');
		this._sceneColorPrecision = sceneColorPrecision;
		this._canvas = canvas;
		this._onFailure = onFailure;
		this._scene = new THREE.Scene();
		this._scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
		this._camera = new THREE.PerspectiveCamera(
			CAMERA_FIELD_OF_VIEW_DEGREES,
			1,
			CAMERA_NEAR_SCENE_UNITS,
			CAMERA_FAR_SCENE_UNITS,
		);
		this._camera.position.set(...CAMERA_POSITION_SCENE);
		this._camera.lookAt(...CAMERA_LOOK_AT_SCENE);
		/** @type {THREE.WebGLRenderer | null} */
		this._renderer = null;
		/** @type {EffectComposer | null} */
		this._composer = null;
		/** @type {THREE.WebGLRenderTarget | null} */
		this._composerRenderTarget = null;
		/** @type {RenderPass | null} */
		this._renderPass = null;
		/** @type {EffectComposer | null} */
		this._directDisplayComposer = null;
		/** @type {ShaderPass | null} */
		this._directDisplayPass = null;
		this._directDisplayEnabled = false;
		/** @type {Flat32RenderOperation} */
		this._renderOperation = this._renderDirectScene.bind(this);
		/** @type {number | null} */
		this._frameRequest = null;
		this._frameCount = 0;
		/** @type {PixelSize | null} */
		this._viewportSize = null;
		this._started = false;
		this._resumeAfterContextRestoration = false;
		/** @type {Set<Flat32ContextLifecycleParticipant>} */
		this._contextLifecycleParticipants = new Set();
		this._disposed = false;
		this._renderFrame = this._renderFrame.bind(this);
		this._handleContextLost = this._handleContextLost.bind(this);
		this._handleContextRestored = this._handleContextRestored.bind(this);
		this._handleResize = this._handleResize.bind(this);
		this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
	}

	/**
	 * Normalize a caught render failure for presentation.
	 *
	 * @param {unknown} error - Supplies the caught value.
	 * @returns {string} Return a readable message.
	 */
	_errorMessage(error) {
		return error instanceof Error ? error.message : String(error);
	}

	/**
	 * Require the live renderer.
	 *
	 * @returns {THREE.WebGLRenderer} Return the renderer.
	 */
	_requireRenderer() {
		if (this._renderer === null) {
			throw new Error('Flat32 Three renderer is unavailable.');
		}

		return this._renderer;
	}

	/**
	 * Reject hardware that Three would otherwise silently downscale.
	 *
	 * @param {THREE.WebGLRenderer} renderer - Supplies WebGL capabilities.
	 * @returns {void}
	 */
	_requireShadowMapCapabilities(renderer) {
		const context = renderer.getContext();
		const maxTextureSize = Number(context.getParameter(context.MAX_TEXTURE_SIZE));
		const maxRenderbufferSize = Number(context.getParameter(context.MAX_RENDERBUFFER_SIZE));
		const maxViewportDimensions = context.getParameter(context.MAX_VIEWPORT_DIMS);
		const maxViewportWidth = Number(maxViewportDimensions[0]);
		const maxViewportHeight = Number(maxViewportDimensions[1]);

		this._canvas.dataset.flat32ShadowMaxTextureSize = String(maxTextureSize);
		this._canvas.dataset.flat32ShadowMaxRenderbufferSize = String(maxRenderbufferSize);
		this._canvas.dataset.flat32ShadowMaxViewportWidth = String(maxViewportWidth);
		this._canvas.dataset.flat32ShadowMaxViewportHeight = String(maxViewportHeight);
		if (
			maxTextureSize < LOCAL_SUN_SHADOW_MAP_SIZE ||
			maxRenderbufferSize < LOCAL_SUN_SHADOW_MAP_SIZE ||
			maxViewportWidth < LOCAL_SUN_SHADOW_MAP_SIZE ||
			maxViewportHeight < LOCAL_SUN_SHADOW_MAP_SIZE
		) {
			throw new Error('Flat32 requires 4096-pixel WebGL shadow-map support.');
		}
	}

	/**
	 * Enable one static update of the source application's PCF shadow maps.
	 *
	 * @param {THREE.WebGLRenderer} renderer - Owns the shadow-map renderer.
	 * @returns {void}
	 */
	_configureShadowMaps(renderer) {
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.autoUpdate = false;
		renderer.shadowMap.needsUpdate = true;
		if (THREE.PCFShadowMap !== undefined) {
			renderer.shadowMap.type = THREE.PCFShadowMap;
			this._canvas.dataset.flat32ShadowMapType = 'pcf';
		} else if (THREE.PCFSoftShadowMap !== undefined) {
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			this._canvas.dataset.flat32ShadowMapType = 'pcf-soft';
		}
		this._canvas.dataset.flat32ShadowMaps = 'enabled';
		this._canvas.dataset.flat32ShadowMapUpdates = LOCAL_SUN_SHADOW_UPDATE_POLICY;
	}

	/**
	 * Return the containing viewport's current logical-pixel dimensions.
	 *
	 * @returns {PixelSize} Return the resolved viewport dimensions.
	 */
	_resolveViewportSize() {
		const viewport = this._canvas.parentElement;
		const bounds = viewport?.getBoundingClientRect() ?? this._canvas.getBoundingClientRect();
		const width = Math.round(bounds.width);
		const height = Math.round(bounds.height);

		if (width <= 0 || height <= 0) {
			throw new Error('Flat32 requires a visible, nonzero host viewport.');
		}

		return {width, height, units: 'pixels'};
	}

	/**
	 * Return the current device-pixel ratio used by renderer and composer.
	 *
	 * @returns {number} Return a positive device-pixel ratio.
	 */
	_resolvePixelRatio() {
		return Math.max(1, window.devicePixelRatio || 1);
	}

	/**
	 * Configure the canvas, camera, and post-processing targets for its host.
	 *
	 * @returns {void}
	 */
	_configureViewport() {
		const renderer = this._requireRenderer();
		const drawingBufferSize = new THREE.Vector2();
		const viewportSize = this._resolveViewportSize();
		const pixelRatio = this._resolvePixelRatio();
		const expectedDrawingBufferWidth = Math.floor(viewportSize.width * pixelRatio);
		const expectedDrawingBufferHeight = Math.floor(viewportSize.height * pixelRatio);

		this._camera.aspect = viewportSize.width / viewportSize.height;
		this._camera.updateProjectionMatrix();
		renderer.setPixelRatio(pixelRatio);
		renderer.setSize(viewportSize.width, viewportSize.height, false);
		renderer.getDrawingBufferSize(drawingBufferSize);
		if (drawingBufferSize.x !== expectedDrawingBufferWidth || drawingBufferSize.y !== expectedDrawingBufferHeight) {
			throw new Error('Flat32 could not create the requested host-sized drawing buffer.');
		}
		this._viewportSize = viewportSize;
		this._canvas.dataset.flat32ViewportWidth = String(viewportSize.width);
		this._canvas.dataset.flat32ViewportHeight = String(viewportSize.height);
		this._canvas.dataset.flat32PixelRatio = String(pixelRatio);
		this._composer?.setPixelRatio(pixelRatio);
		this._composer?.setSize(viewportSize.width, viewportSize.height);
		this._directDisplayComposer?.setPixelRatio(pixelRatio);
		this._directDisplayComposer?.setSize(viewportSize.width, viewportSize.height);
	}

	/** Create the display-only path for inspecting the linear HDR Three scene. */
	_createDirectDisplayComposer() {
		const renderer = this._requireRenderer();
		const viewportSize = this.viewportSize;
		const composer = new EffectComposer(renderer, this._createComposerRenderTarget());
		const renderPass = new RenderPass(this._scene, this._camera);
		let displayPass = new ShaderPass({
			uniforms: {
				tDiffuse: {value: null},
			},
			vertexShader: `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
			fragmentShader: `
uniform sampler2D tDiffuse;
varying vec2 vUv;
void main() {
	vec4 sceneLinear = texture2D(tDiffuse, vUv);
	vec3 nonnegative = max(sceneLinear.rgb, vec3(0.0));
	float peakChannel = max(max(nonnegative.r, nonnegative.g), nonnegative.b);
	vec3 bounded = peakChannel > 1.0 ? nonnegative / peakChannel : nonnegative;
	gl_FragColor = vec4(bounded, sceneLinear.a);
	#include <colorspace_fragment>
}
`,
		});

		displayPass.material.name = 'flat32-direct-three-display-boundary';
		composer.setPixelRatio(this._resolvePixelRatio());
		composer.setSize(viewportSize.width, viewportSize.height);
		composer.addPass(renderPass);
		composer.addPass(displayPass);
		this._directDisplayComposer = composer;
		this._directDisplayPass = displayPass;
		this._canvas.dataset.flat32DirectDisplayBoundary = 'bruneton-renderer-linear-to-display-srgb-v1';
	}

	/**
	 * Synchronize the scene when its browser host changes size.
	 *
	 * @returns {void}
	 */
	_handleResize() {
		if (this._disposed || !this._started) {
			return;
		}

		this._configureViewport();
		this.requestRender();
	}

	/** Request one complete browser frame, coalescing changes until it renders.
	 * Hidden, stopped and lost-context owners retain the request until resumed.
	 * Manual cadence remains entirely caller-owned; disposed owners ignore requests.
	 * @returns {void} - At most one browser callback is pending.
	 */
	requestRender() {
		if (this._disposed || this._frameCadence === 'manual') return;
		this._renderRequested = true;
		if (!this._started || document.hidden || this._rendering || this._frameRequest !== null) return;
		this._frameRequest = window.requestAnimationFrame(this._renderFrame);
	}

	/** Suspend GPU drawing while hidden and redraw the accepted state when visible.
	 * @returns {void} - Pending publications remain queued for the next visible frame.
	 */
	_handleVisibilityChange() {
		if (document.hidden) {
			if (this._frameRequest !== null) window.cancelAnimationFrame(this._frameRequest);
			this._frameRequest = null;
			return;
		}
		this.requestRender();
	}

	/**
	 * Create the scene-color target owned by the composer.
	 *
	 * @returns {THREE.WebGLRenderTarget} Return the new render target.
	 */
	_createComposerRenderTarget() {
		const viewportSize = this.viewportSize;
		let target = new THREE.WebGLRenderTarget(viewportSize.width, viewportSize.height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			type: this._sceneColorPrecision === 'float32' ? THREE.FloatType : THREE.HalfFloatType,
			depthBuffer: true,
			stencilBuffer: false,
		});

		target.texture.name = ATMOSPHERE_SCENE_COLOR_TARGET_NAME;
		target.texture.colorSpace = THREE.NoColorSpace;
		return target;
	}

	/**
	 * Render the ordinary scene without Algorithm32.
	 *
	 * @returns {void}
	 */
	_renderDirectScene() {
		const renderer = this._requireRenderer();

		// Algorithm32 captures depth and hit masks with transient override
		// materials and offscreen targets. Direct inspection owns an explicit
		// clean boundary instead of inheriting any composer/capture state.
		renderer.setRenderTarget(null);
		renderer.autoClear = true;
		this._scene.overrideMaterial = null;
		if (!this._directDisplayEnabled) {
			renderer.render(this._scene, this._camera);
			return;
		}
		if (this._directDisplayComposer === null) {
			throw new Error('Flat32 direct Three display boundary is unavailable.');
		}
		this._directDisplayComposer.render();
	}

	/**
	 * Render queued publications and one active frame; idle on-demand owners stop here.
	 *
	 * @returns {void}
	 */
	_renderFrame() {
		this._frameRequest = null;
		if (this._disposed || !this._started) {
			return;
		}
		// The first synchronous frame allocates Three's shadow maps before the
		// application checks its startup resources. Later hidden frames wait.
		if (this._frameCadence !== 'manual' && document.hidden && this._frameCount > 0) {
			this._renderRequested = true;
			return;
		}

		this._rendering = true;
		try {
			for (const pending of this._frameBoundaryOperations) {
				this._frameBoundaryOperations.delete(pending);
				pending.signal.removeEventListener('abort', pending.cancel);
				try {
					pending.signal.throwIfAborted();
					pending.operation();
					pending.resolve();
				} catch (error) {
					pending.reject(error);
				}
			}
			// Publications above are included in this frame. Only changes raised
			// during rendering itself require a successor frame.
			this._renderRequested = false;
			this._renderOperation();
			this._frameCount += 1;
			this._canvas.dataset.flat32FrameCount = String(this._frameCount);
		} catch (error) {
			this._started = false;
			this._frameRequest = null;
			this._onFailure(`Flat32 frame rendering failed: ${this._errorMessage(error)}`);
		} finally {
			this._rendering = false;
		}
		if (this._started && (this._frameCadence === 'animation-frame' || this._renderRequested)) this.requestRender();
	}

	/**
	 * Stop rendering after WebGL context loss.
	 *
	 * @param {Event} event - Supplies the browser context-loss event.
	 * @returns {void}
	 */
	_handleContextLost(event) {
		event.preventDefault();
		this._resumeAfterContextRestoration = this._started;
		this._started = false;
		if (this._frameRequest !== null) {
			window.cancelAnimationFrame(this._frameRequest);
			this._frameRequest = null;
		}
		for (const participant of this._contextLifecycleParticipants) participant.handleContextLoss();
		// Detach Three's old-context disposal listeners before the renderer replaces its GL caches.
		// The CPU geometry/material objects remain usable and upload again after restoration.
		this._scene?.traverse((object) => {
			if (object instanceof THREE.Mesh) {
				object.geometry.dispose();
				const materials = Array.isArray(object.material) ? object.material : [object.material];
				for (const material of materials) material.dispose();
			}
			if (
				object instanceof THREE.DirectionalLight ||
				object instanceof THREE.SpotLight ||
				object instanceof THREE.PointLight
			) {
				object.shadow.dispose();
				object.shadow.map = null;
				object.shadow.mapPass = null;
				object.shadow.needsUpdate = true;
			}
		});
		this._composer?.dispose();
		this._composerRenderTarget?.dispose();
		this._directDisplayComposer?.dispose();
		this._directDisplayPass?.dispose();
		this._canvas.dataset.flat32ContextState = 'lost';
	}

	/**
	 * Keep restoration explicit because owned Three resources were invalidated.
	 *
	 * @returns {Promise<void>} Resolve after every renderer resource owner has rebuilt.
	 */
	async _handleContextRestored() {
		this._restoringContext = true;
		try {
			for (const participant of this._contextLifecycleParticipants) {
				await participant.handleContextRestoration();
			}
			if (this._disposed) return;
			this._configureViewport();
			this._canvas.dataset.flat32ContextState = 'restored';
			if (this._resumeAfterContextRestoration) {
				this._started = true;
				this.requestRender();
			}
		} catch (error) {
			this._resumeAfterContextRestoration = false;
			this._onFailure(`WebGL context restoration failed: ${this._errorMessage(error)}`);
		} finally {
			this._restoringContext = false;
		}
	}

	/** Call this method to register one renderer-resource owner across context cycles.
	 *
	 * @param {Flat32ContextLifecycleParticipant} participant - Context loss and restoration owner.
	 * @returns {Flat32ContextLifecycleRemoval} - Remove this participant from future context cycles.
	 */
	addContextLifecycleParticipant(participant) {
		if (this._disposed) throw new Error('Cannot register context lifecycle on a disposed Three runtime.');
		this._contextLifecycleParticipants.add(participant);
		return () => this._contextLifecycleParticipants.delete(participant);
	}

	/**
	 * Return the scene owned by this runtime.
	 *
	 * @returns {THREE.Scene} Return the scene.
	 */
	get scene() {
		return this._scene;
	}

	/**
	 * Return the canvas owned by this runtime.
	 *
	 * @returns {HTMLCanvasElement} Return the canvas.
	 */
	get canvas() {
		return this._canvas;
	}

	/**
	 * Return the live camera owned by this runtime.
	 *
	 * @returns {THREE.PerspectiveCamera} Return the camera.
	 */
	get camera() {
		return this._camera;
	}

	/**
	 * Return the live renderer owned by this runtime.
	 *
	 * @returns {THREE.WebGLRenderer} Return the renderer.
	 */
	get renderer() {
		return this._requireRenderer();
	}

	/** Call this method to request one new shadow-map render after a source-state change. */
	refreshShadowMaps() {
		this._requireRenderer().shadowMap.needsUpdate = true;
		this.requestRender();
	}

	/**
	 * Return the current unit-bearing host viewport size.
	 *
	 * @returns {PixelSize} Return the viewport dimensions.
	 */
	get viewportSize() {
		if (this._viewportSize === null) {
			throw new Error('Flat32 host viewport is unavailable.');
		}

		return {...this._viewportSize};
	}

	/**
	 * Call this method to create or return the host-sized composer and its ordinary base render pass.
	 *
	 * @returns {EffectComposer} Return the live composer.
	 */
	prepareAtmosphereComposer() {
		if (this._disposed) {
			throw new Error('Cannot prepare a composer on a disposed Three runtime.');
		}
		if (this._composer !== null) {
			return this._composer;
		}

		const candidate = this.createAtmosphereComposer();

		this._composer = /** @type {EffectComposer} */ (candidate.composer);
		this._composerRenderTarget = /** @type {THREE.WebGLRenderTarget} */ (candidate.renderTarget);
		this._renderPass = /** @type {RenderPass} */ (candidate.renderPass);

		return this._composer;
	}

	/** Call this method to create an isolated composer for transactional Algorithm32 preparation.
	 * Allocation or disposal-state failures throw; discard the incomplete candidate.
	 * @param {Flat32SceneViewSelection} [view] - Isolated candidate view, or this host's accepted view.
	 * @returns {Flat32AtmosphereComposerResources} - Independently owned composition resources.
	 */
	createAtmosphereComposer(view = {scene: this._scene, camera: this._camera}) {
		if (this._disposed) {
			throw new Error('Cannot create a composer on a disposed Three runtime.');
		}
		const renderTarget = this._createComposerRenderTarget();
		const composer = new EffectComposer(this._requireRenderer(), renderTarget);
		const renderPass = new RenderPass(
			/** @type {THREE.Scene} */ (view.scene),
			/** @type {THREE.PerspectiveCamera} */ (view.camera),
		);

		composer.setPixelRatio(this._resolvePixelRatio());
		composer.setSize(this.viewportSize.width, this.viewportSize.height);
		composer.addPass(renderPass);
		return {composer, renderTarget, renderPass};
	}

	/** Call this method to publish one prepared visual scene and camera before its next complete frame.
	 * Disposed owners throw; discard the candidate. The caller retains the previous view for rollback.
	 * @param {Flat32SceneViewSelection} view - Complete renderer-owned view with surface-anchored endpoints.
	 * @returns {void} - Scene and camera installed together; existing direct display resources are retained.
	 */
	publishSceneView(view) {
		if (this._disposed) throw new Error('Cannot publish a view on a disposed renderer.');
		this._scene = /** @type {THREE.Scene} */ (view.scene);
		this._camera = /** @type {THREE.PerspectiveCamera} */ (view.camera);
		const pass = /** @type {RenderPass} */ (this._directDisplayComposer?.passes[0]);
		if (pass) {
			pass.scene = this._scene;
			pass.camera = this._camera;
		}
		this.refreshShadowMaps();
	}

	/**
	 * Call this method to atomically replace direct rendering with one validated frame operation.
	 *
	 * @param {Flat32RenderOperation} operation - Renders one complete frame.
	 * @returns {void}
	 */
	installRenderOperation(operation) {
		if (this._disposed) {
			throw new Error('Cannot install rendering on a disposed Three runtime.');
		}

		this._renderOperation = operation;
		this._directDisplayEnabled = false;
		this._canvas.dataset.flat32RenderPath = 'algorithm32';
		this.requestRender();
	}

	/**
	 * Call this method to restore the ordinary scene as the active frame operation.
	 *
	 * @returns {void}
	 */
	restoreDirectRendering() {
		if (this._disposed) {
			return;
		}

		this._directDisplayEnabled = true;
		this._renderOperation = this._renderDirectScene.bind(this);
		this._canvas.dataset.flat32RenderPath = 'direct-three';
		this.requestRender();
	}

	/**
	 * Call this method to create the renderer and begin the frame loop.
	 *
	 * @returns {void}
	 */
	start() {
		if (this._disposed) {
			throw new Error('Cannot start a disposed Flat32 Three runtime.');
		}
		if (this._started) {
			return;
		}

		this._renderer = new THREE.WebGLRenderer({
			antialias: true,
			canvas: this._canvas,
			powerPreference: 'high-performance',
		});
		this._renderer.outputColorSpace = THREE.SRGBColorSpace;
		this._renderer.toneMapping = THREE.NoToneMapping;
		this._requireShadowMapCapabilities(this._renderer);
		this._configureShadowMaps(this._renderer);
		this._canvas.dataset.flat32Renderer = 'webgl2';
		this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
		this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);
		this._configureViewport();
		this._createDirectDisplayComposer();
		window.addEventListener('resize', this._handleResize);
		document.addEventListener('visibilitychange', this._handleVisibilityChange);
		this._canvas.dataset.flat32RenderPath = 'direct-three';
		this._started = true;
		if (this._frameCadence !== 'manual') this._renderFrame();
	}

	/**
	 * Call this method to render exactly one complete manual-cadence frame.
	 * Disposed, stopped, or browser-cadence runtimes reject the operation. Render
	 * failure is reported through the configured handler and also throws to the caller.
	 *
	 * @returns {number} - Completed render count after this frame.
	 */
	stepFrame() {
		if (this._disposed || !this._started || this._frameCadence !== 'manual') {
			throw new Error('Flat32 frame stepping requires a running manual-cadence runtime.');
		}
		this._renderFrame();
		if (!this._started) throw new Error('Flat32 manual frame failed.');
		return this._frameCount;
	}

	/**
	 * Call this method to stop frames, detach browser listeners, and release the renderer.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		for (const pending of this._frameBoundaryOperations) {
			pending.signal.removeEventListener('abort', pending.cancel);
			pending.reject(new Error('Scene renderer was disposed before publication.'));
		}
		this._frameBoundaryOperations.clear();
		this._started = false;
		this._resumeAfterContextRestoration = false;
		if (this._frameRequest !== null) {
			window.cancelAnimationFrame(this._frameRequest);
			this._frameRequest = null;
		}
		this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
		this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
		window.removeEventListener('resize', this._handleResize);
		document.removeEventListener('visibilitychange', this._handleVisibilityChange);
		this._contextLifecycleParticipants.clear();
		this._renderOperation = this._renderDirectScene.bind(this);
		this._composer?.dispose();
		this._composerRenderTarget?.dispose();
		this._renderPass = null;
		this._composer = null;
		this._composerRenderTarget = null;
		this._directDisplayComposer?.dispose();
		this._directDisplayPass?.dispose();
		this._directDisplayComposer = null;
		this._directDisplayPass = null;
		this._directDisplayEnabled = false;
		this._renderer?.dispose();
		this._renderer = null;
	}
}
