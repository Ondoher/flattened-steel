import {ShaderPassPerformanceTimer} from './ShaderPassPerformanceTimer.js';
import DistanceMath from '../../math/DistanceMath.js';
import SceneMath from '../../math/SceneMath.js';
import {PixelMath} from '../../math/PixelMath.js';

/** Composer-compatible pass that captures renderer-produced Algorithm32 scene inputs. */
export class SceneInputCapture {
	/**
	 * Called by scene input capture to create a WebGL render target for one scene-input texture.
	 *
	 * @param {SceneInputCaptureResourceNamespace} THREE - The Three resource namespace.
	 * @param {number} widthPixels - The target width in pixels.
	 * @param {number} heightPixels - The target height in pixels.
	 * @param {string} name - The texture diagnostic name.
	 * @returns {SceneInputCaptureRenderTarget} - The render target.
	 *
	 */
	_createRenderTarget(THREE, widthPixels, heightPixels, name) {
		const target = new THREE.WebGLRenderTarget(widthPixels, heightPixels, {
			depthBuffer: true,
			stencilBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.UnsignedByteType,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
		});

		if (target.texture && typeof target.texture === 'object') {
			target.texture.name = name;
			target.texture.generateMipmaps = false;
		}

		return target;
	}

	/**
	 * Called by scene input capture to accept an optional finite coordinate or its absent-value default.
	 *
	 * @param {unknown} value - The candidate value.
	 * @param {number} fallback - The fallback value.
	 * @param {string} label - The diagnostic label.
	 * @returns {number} - The accepted coordinate.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_optionalFiniteCoordinate(value, fallback, label) {
		if (value === undefined) {
			return fallback;
		}

		if (typeof value !== 'number' || !Number.isFinite(value)) {
			throw new TypeError(`${label} must be a finite number when supplied.`);
		}

		return value;
	}

	/**
	 * Called by scene input capture to assert that a vector-like value contains finite coordinates.
	 *
	 * @param {unknown} value - The vector-like value.
	 * @param {string} label - The diagnostic label.
	 * @returns {void} - No value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_assertFiniteVector3(value, label) {
		if (!value || typeof value !== 'object') {
			throw new TypeError(`${label} must contain finite x, y, and z coordinates.`);
		}

		const vector = /** @type {SceneInputCaptureVectorLike} */ (value);

		if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y) || !Number.isFinite(vector.z)) {
			throw new TypeError(`${label} must contain finite x, y, and z coordinates.`);
		}
	}

	/**
	 * Called by scene input capture to update a vector-like value from camera world position.
	 *
	 * @param {SceneInputCaptureCamera} camera - The active camera.
	 * @param {SceneInputCaptureVector} target - The vector to mutate.
	 * @returns {void} - No value.
	 *
	 */
	_updateCameraWorldPosition(camera, target) {
		if (typeof camera?.getWorldPosition === 'function') {
			camera.getWorldPosition(target);
			this._assertFiniteVector3(target, 'SceneInputCapture camera world position');
			return;
		}

		if (target && typeof target.set === 'function') {
			target.set(
				this._optionalFiniteCoordinate(camera?.position?.x, 0, 'SceneInputCapture camera.position.x'),
				this._optionalFiniteCoordinate(camera?.position?.y, 0, 'SceneInputCapture camera.position.y'),
				this._optionalFiniteCoordinate(camera?.position?.z, 0, 'SceneInputCapture camera.position.z'),
			);
		}
	}

	/**
	 * Called by scene input capture to create a vector initialized to the camera world position.
	 *
	 * @param {SceneInputCaptureResourceNamespace} THREE - The Three resource namespace.
	 * @param {SceneInputCaptureCamera} camera - The active camera.
	 * @returns {SceneInputCaptureVector} - The initialized vector.
	 *
	 */
	_createVector3(THREE, camera) {
		const vector = new THREE.Vector3();
		this._updateCameraWorldPosition(camera, vector);

		return vector;
	}

	/**
	 * Called by scene input capture to provide the shared distance-capture vertex shader.
	 *
	 * @returns {string} - The shader source.
	 *
	 */
	_distanceVertexShader() {
		return `
varying vec3 vWorldPosition;

void main() {
	vec4 worldPosition = modelMatrix * vec4(position, 1.0);
	vWorldPosition = worldPosition.xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
	}

	/**
	 * Called by scene input capture to provide the distance-packing fragment shader.
	 *
	 * @returns {string} - The shader source.
	 *
	 */
	_distanceFragmentShader() {
		return `
precision highp float;

uniform vec3 uCameraWorldPosition;
uniform float uMetersPerSceneUnit;
uniform float uSceneDepthMaxMeters;
varying vec3 vWorldPosition;

vec3 packNormalizedDistance24(float value) {
	float normalized = clamp(value, 0.0, 1.0);
	float packed = floor(normalized * 16777214.0 + 0.5);
	float redByteValue = floor(packed / 65536.0);
	packed -= redByteValue * 65536.0;
	float green = floor(packed / 256.0);
	float blue = packed - green * 256.0;
	return vec3(redByteValue, green, blue) / 255.0;
}

void main() {
	float distanceMeters = distance(vWorldPosition, uCameraWorldPosition) * uMetersPerSceneUnit;
	gl_FragColor = vec4(packNormalizedDistance24(distanceMeters / uSceneDepthMaxMeters), 1.0);
}
`;
	}

	/**
	 * Called by scene input capture to provide the shared hit-mask vertex shader.
	 *
	 * @returns {string} - The shader source.
	 *
	 */
	_hitVertexShader() {
		return `
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
	}

	/**
	 * Called by scene input capture to provide the hit-mask fragment shader.
	 *
	 * @returns {string} - The shader source.
	 *
	 */
	_hitFragmentShader() {
		return `
void main() {
	gl_FragColor = vec4(1.0);
}
`;
	}

	/**
	 * Called by scene input capture to create the override material that packs camera distance into RGB.
	 *
	 * @param {SceneInputCaptureResourceNamespace} THREE - The Three resource namespace.
	 * @param {SceneInputCaptureCamera} camera - The active camera.
	 * @param {SceneScale} sceneScale - The accepted scene-unit scale.
	 * @param {Distance} sceneDepthMax - The accepted depth cap.
	 * @returns {SceneInputCaptureMaterial} - The depth override material.
	 *
	 */
	_createDepthMaterial(THREE, camera, sceneScale, sceneDepthMax) {
		const metersPerSceneUnit = sceneScale.value;
		const sceneDepthMaxMeters = DistanceMath.toMeters(sceneDepthMax);
		const material = new THREE.ShaderMaterial({
			uniforms: {
				uCameraWorldPosition: {
					value: this._createVector3(THREE, camera),
				},
				uMetersPerSceneUnit: {
					value: metersPerSceneUnit,
				},
				uSceneDepthMaxMeters: {
					value: sceneDepthMaxMeters,
				},
			},
			vertexShader: this._distanceVertexShader(),
			fragmentShader: this._distanceFragmentShader(),
		});

		material.depthTest = true;
		material.depthWrite = true;

		return material;
	}

	/**
	 * Called by scene input capture to create the override material that writes an explicit hit mask.
	 *
	 * @param {SceneInputCaptureResourceNamespace} THREE - The Three resource namespace.
	 * @returns {SceneInputCaptureMaterial} - The hit-mask override material.
	 *
	 */
	_createHitMaterial(THREE) {
		const material = new THREE.ShaderMaterial({
			vertexShader: this._hitVertexShader(),
			fragmentShader: this._hitFragmentShader(),
		});

		material.depthTest = true;
		material.depthWrite = true;

		return material;
	}

	/**
	 * Called by scene input capture to resize one render target.
	 *
	 * @param {SceneInputCaptureRenderTarget} target - The render target.
	 * @param {number} widthPixels - The target width in pixels.
	 * @param {number} heightPixels - The target height in pixels.
	 * @returns {void} - No value.
	 *
	 */
	_resizeRenderTarget(target, widthPixels, heightPixels) {
		if (typeof target?.setSize === 'function') {
			target.setSize(widthPixels, heightPixels);
			return;
		}

		target.width = widthPixels;
		target.height = heightPixels;
	}

	/**
	 * Called by scene input capture to read renderer clear state when the renderer exposes it.
	 *
	 * @param {SceneInputCaptureResourceNamespace} THREE - The Three resource namespace.
	 * @param {SceneInputCaptureRenderer} renderer - The active renderer.
	 * @returns {SceneInputCaptureRendererClearState | null} - The captured clear state, or null when unavailable.
	 *
	 */
	_readRendererClearState(THREE, renderer) {
		if (
			typeof renderer.getClearColor !== 'function' ||
			typeof renderer.getClearAlpha !== 'function' ||
			typeof THREE?.Color !== 'function'
		) {
			return null;
		}

		return {
			color: renderer.getClearColor(new THREE.Color()),
			alpha: renderer.getClearAlpha(),
		};
	}

	/**
	 * Called by scene input capture to restore captured renderer clear state.
	 *
	 * @param {SceneInputCaptureRenderer} renderer - The active renderer.
	 * @param {SceneInputCaptureRendererClearState | null} clearState - The captured clear state.
	 * @returns {void} - No value.
	 *
	 */
	_restoreRendererClearState(renderer, clearState) {
		if (!clearState || typeof renderer.setClearColor !== 'function') {
			return;
		}

		renderer.setClearColor(clearState.color, clearState.alpha);
	}

	/**
	 * Called by scene input capture to hide visible scene content excluded from Algorithm32 scene inputs. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {SceneInputCaptureScene} scene - The scene to traverse.
	 * @returns {SceneInputCaptureVisibilitySnapshot[]} - The hidden-object visibility snapshots.
	 */
	_hideSceneInputExcludedObjects(scene) {
		const hiddenObjects = [];

		if (typeof scene?.traverse !== 'function') {
			return hiddenObjects;
		}

		scene.traverse(
			/**
			 * Called by the scene traversal to process one traversed scene object.
			 * @param object - The object value accepted by the operation.
			 */ (object) => {
				if (object?.userData?.algorithm32SceneInput !== false || object.visible === false) {
					return;
				}

				hiddenObjects.push({
					object,
					visible: object.visible,
				});
				object.visible = false;
			},
		);

		return hiddenObjects;
	}

	/**
	 * Called by scene input capture to restore objects hidden by the scene-input capture filter.
	 *
	 * @param {SceneInputCaptureVisibilitySnapshot[]} hiddenObjects - The visibility snapshots.
	 * @returns {void} - No value.
	 *
	 */
	_restoreSceneInputExcludedObjects(hiddenObjects) {
		for (const entry of hiddenObjects) {
			entry.object.visible = entry.visible;
		}
	}

	/**
	 * Capture-execution flag.
	 *
	 * @type {boolean}
	 */
	enabled = true;

	/**
	 * Composer buffer-swap requirement after this pass.
	 *
	 * @type {boolean}
	 */
	needsSwap = false;

	/**
	 * Composer-buffer clear requirement before drawing.
	 *
	 * @type {boolean}
	 */
	clear = false;

	/**
	 * Direct-to-screen rendering flag.
	 *
	 * @type {boolean}
	 */
	renderToScreen = false;

	/**
	 * Caller-provided Three namespace.
	 *
	 * @type {SceneInputCaptureResourceNamespace}
	 */
	_THREE;

	/**
	 * Live scene to capture.
	 *
	 * @type {SceneInputCaptureScene}
	 */
	_scene;

	/**
	 * Live capture camera.
	 *
	 * @type {SceneInputCaptureCamera}
	 */
	_camera;

	/**
	 * Value that renders target carrying packed scene-hit distance.
	 *
	 * @type {SceneInputCaptureRenderTarget}
	 *
	 */
	_depthTarget;

	/**
	 * Value that renders target carrying the explicit scene-hit mask.
	 *
	 * @type {SceneInputCaptureRenderTarget}
	 *
	 */
	_hitTarget;

	/**
	 * Override material that packs hit distance.
	 *
	 * @type {SceneInputCaptureMaterial}
	 */
	_depthMaterial;

	/**
	 * Override material that captures hit coverage.
	 *
	 * @type {SceneInputCaptureMaterial}
	 */
	_hitMaterial;

	/**
	 * Unit-bearing viewport dimensions.
	 *
	 * @type {PixelSize}
	 */
	_viewportSize;

	/**
	 * Renderer scene-to-physical scale.
	 *
	 * @type {SceneScale}
	 */
	_sceneScale;

	/**
	 * Largest representable scene distance.
	 *
	 * @type {Distance}
	 */
	_sceneDepthMax;
	/** Frame-owned physical depth scale, when the caller updates camera/scene support.
	 * @type {(() => Distance) | null}
	 */
	_resolveSceneDepthMax;

	/**
	 * Completed capture-frame count.
	 *
	 * @type {number}
	 */
	_frameCount = 0;

	/**
	 * Owned-resource disposal state.
	 *
	 * @type {boolean}
	 */
	_disposed = false;

	/**
	 * Optional depth-pass performance timer.
	 *
	 * @type {ShaderPassPerformanceTimer | null}
	 */
	_depthPerformanceTimer = null;

	/**
	 * Optional hit-pass performance timer.
	 *
	 * @type {ShaderPassPerformanceTimer | null}
	 */
	_hitPerformanceTimer = null;

	/**
	 * Creates a scene input capture instance that calls this constructor to create reusable scene-input capture resources.
	 *
	 * @param {SceneInputCaptureConfiguration} configuration - The renderer attachment and capture policy.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	constructor(configuration) {
		const THREE = /** @type {SceneInputCaptureResourceNamespace} */ (configuration.THREE);

		for (const constructorName of ['WebGLRenderTarget', 'ShaderMaterial', 'Vector3']) {
			if (typeof THREE?.[constructorName] !== 'function') {
				throw new TypeError(`Scene input capture requires THREE.${constructorName}.`);
			}
		}

		this._THREE = THREE;
		this._scene = configuration.scene;
		this._camera = configuration.camera;
		this._sceneScale =
			configuration.sceneScale === undefined ? SceneMath.scaleInMetersPerSceneUnit(1) : configuration.sceneScale;
		this._sceneDepthMax =
			configuration.sceneDepthMax === undefined ? DistanceMath.inMeters(100000) : configuration.sceneDepthMax;
		this._resolveSceneDepthMax = configuration.resolveSceneDepthMax ?? null;
		if (this._resolveSceneDepthMax !== null && typeof this._resolveSceneDepthMax !== 'function')
			throw new TypeError('SceneInputCapture.resolveSceneDepthMax must be a function.');
		SceneMath.assertSceneScale(this._sceneScale, 'SceneInputCapture.sceneScale');
		DistanceMath.assertDistance(this._sceneDepthMax, 'SceneInputCapture.sceneDepthMax');

		if (DistanceMath.toMeters(this._sceneDepthMax) <= 0) {
			throw new RangeError('SceneInputCapture.sceneDepthMax must be positive.');
		}

		this._viewportSize = configuration.viewportSize;
		const widthPixels = this._viewportSize.width;
		const heightPixels = this._viewportSize.height;
		this._depthTarget = this._createRenderTarget(THREE, widthPixels, heightPixels, 'Algorithm32.scene-depth-rgb24');
		this._hitTarget = this._createRenderTarget(THREE, widthPixels, heightPixels, 'Algorithm32.scene-hit-r8');
		this._depthMaterial = this._createDepthMaterial(THREE, this._camera, this._sceneScale, this._sceneDepthMax);
		this._hitMaterial = this._createHitMaterial(THREE);

		if (typeof configuration.performanceCallback === 'function') {
			this._depthPerformanceTimer = new ShaderPassPerformanceTimer({
				passName: 'algorithm32-scene-depth-capture',
				performanceCallback: configuration.performanceCallback,
				sampleIntervalFrames: configuration.performanceSampleIntervalFrames,
				maxPendingQueries: configuration.performanceMaxPendingQueries,
			});
			this._hitPerformanceTimer = new ShaderPassPerformanceTimer({
				passName: 'algorithm32-scene-hit-capture',
				performanceCallback: configuration.performanceCallback,
				sampleIntervalFrames: configuration.performanceSampleIntervalFrames,
				maxPendingQueries: configuration.performanceMaxPendingQueries,
			});
		}
	}

	/**
	 * Packed scene-depth texture.
	 *
	 * @returns {unknown} - The texture.
	 */
	get depthTexture() {
		return this._depthTarget.texture;
	}

	/**
	 * Explicit scene-hit mask texture.
	 *
	 * @returns {unknown} - The texture.
	 */
	get hitTexture() {
		return this._hitTarget.texture;
	}

	/**
	 * Unit-bearing viewport dimensions.
	 *
	 * @returns {PixelSize} - The viewport dimensions.
	 */
	get viewportSize() {
		return this._viewportSize;
	}

	/**
	 * Call this method to return binding values produced by this capture helper.
	 *
	 * @returns {SceneInputCaptureBindingValues} - The runtime binding values.
	 */
	bindingValues() {
		return {
			'runtime.sceneDepthTexture': this.depthTexture,
			'runtime.sceneHitTexture': this.hitTexture,
			'runtime.viewportSize': this.viewportSize,
		};
	}

	/**
	 * Called by scene input capture to assert that capture resources are still usable.
	 *
	 * @returns {void} - No value.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('SceneInputCapture has been disposed.');
		}
	}

	/**
	 * Called by scene input capture to render one override-material capture pass and restore renderer state.
	 *
	 * @param {SceneInputCaptureRenderer} renderer - The active renderer.
	 * @param {SceneInputCaptureRenderTarget} target - The render target.
	 * @param {SceneInputCaptureMaterial} material - The scene override material.
	 * @param {ShaderPassPerformanceTimer | null} performanceTimer - The optional timer.
	 * @returns {void} - No value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_renderWithOverride(renderer, target, material, performanceTimer = null) {
		if (typeof renderer.setRenderTarget !== 'function') {
			throw new TypeError('Scene input capture requires renderer.setRenderTarget().');
		}

		if (typeof renderer.render !== 'function') {
			throw new TypeError('Scene input capture requires renderer.render().');
		}

		const previousTarget = typeof renderer.getRenderTarget === 'function' ? renderer.getRenderTarget() : null;
		const previousOverrideMaterial = this._scene.overrideMaterial;
		const previousBackground = this._scene.background;
		const previousClearState = this._readRendererClearState(this._THREE, renderer);
		const hiddenObjects = this._hideSceneInputExcludedObjects(this._scene);
		const performanceSample =
			performanceTimer?.begin?.(renderer, {
				frameCount: this._frameCount,
				viewportSize: this._viewportSize,
				sceneDepthMax: this._sceneDepthMax,
				sceneScale: this._sceneScale,
				renderTargetName: target?.texture?.name ?? null,
			}) ?? null;

		try {
			this._scene.overrideMaterial = material;
			this._scene.background = null;
			renderer.setRenderTarget(target);
			if (typeof renderer.setClearColor === 'function') {
				renderer.setClearColor(0x000000, 0);
			}
			if (typeof renderer.clear === 'function') {
				renderer.clear(true, true, true);
			}
			renderer.render(this._scene, this._camera);
		} finally {
			performanceTimer?.end?.(renderer, performanceSample);
			this._scene.overrideMaterial = previousOverrideMaterial;
			this._scene.background = previousBackground;
			this._restoreSceneInputExcludedObjects(hiddenObjects);
			this._restoreRendererClearState(renderer, previousClearState);
			renderer.setRenderTarget(previousTarget);
		}
	}

	/**
	 * Call this method to resize owned capture resources.
	 *
	 * @param {number} width - The viewport width.
	 * @param {number} height - The viewport height.
	 * @returns {void} - No value.
	 */
	setSize(width, height) {
		this._assertUsable();

		this._viewportSize = PixelMath.createPixelSize(width, height, 'SceneInputCapture.setSize viewport');
		const widthPixels = this._viewportSize.width;
		const heightPixels = this._viewportSize.height;

		this._resizeRenderTarget(this._depthTarget, widthPixels, heightPixels);
		this._resizeRenderTarget(this._hitTarget, widthPixels, heightPixels);
	}

	/**
	 * Call this method to capture scene depth and hit mask for one render frame.
	 *
	 * @param {SceneInputCaptureRenderer} renderer - The active Three renderer.
	 * @returns {void} - No value.
	 * @throws {TypeError} - The live depth resolver supplies an invalid physical distance.
	 * @throws {RangeError} - The live depth range is not positive.
	 */
	capture(renderer) {
		this._assertUsable();

		if (!this.enabled) {
			return;
		}

		if (this._resolveSceneDepthMax) {
			const depthMax = this._resolveSceneDepthMax();
			DistanceMath.assertDistance(depthMax, 'SceneInputCapture.sceneDepthMax');
			const depthMaxMeters = DistanceMath.toMeters(depthMax);
			if (depthMaxMeters <= 0) throw new RangeError('SceneInputCapture.sceneDepthMax must be positive.');
			this._sceneDepthMax = depthMax;
			this._depthMaterial.uniforms.uSceneDepthMaxMeters.value = depthMaxMeters;
		}

		this._updateCameraWorldPosition(
			this._camera,
			/** @type {SceneInputCaptureVector} */ (this._depthMaterial.uniforms.uCameraWorldPosition.value),
		);
		this._renderWithOverride(renderer, this._depthTarget, this._depthMaterial, this._depthPerformanceTimer);
		this._renderWithOverride(renderer, this._hitTarget, this._hitMaterial, this._hitPerformanceTimer);
		this._frameCount += 1;
	}

	/**
	 * Call this method to capture scene inputs for one composer invocation.
	 *
	 * @param {SceneInputCaptureRenderer} renderer - The active Three renderer.
	 * @returns {void} - No value.
	 */
	render(renderer) {
		this.capture(renderer);
	}

	/**
	 * Call this method to return capture diagnostics for runtime inspection. Conditional result values are selected from the accepted input and current state.
	 *
	 * @returns {SceneInputCaptureDiagnostics} - The diagnostics snapshot.
	 */
	getDiagnostics() {
		return {
			kind: 'algorithm32-scene-input-capture-pass',
			status: this._disposed ? 'disposed' : 'ready',
			capturePolicy: 'renderer-override-material-distance-plus-hit-mask',
			sceneDepthEncoding: 'rgb24-normalized-physical-distance',
			sceneHitMaskEncoding: 'r8-explicit-hit-mask',
			sceneDepthMax: this._sceneDepthMax,
			sceneScale: this._sceneScale,
			viewportSize: this._viewportSize,
			frameCount: this._frameCount,
		};
	}

	/**
	 * Call this method to dispose owned capture resources.
	 *
	 * @returns {void} - No value.
	 */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this.enabled = false;
		this._depthPerformanceTimer?.dispose?.();
		this._hitPerformanceTimer?.dispose?.();
		this._depthMaterial?.dispose?.();
		this._hitMaterial?.dispose?.();
		this._depthTarget?.dispose?.();
		this._hitTarget?.dispose?.();
	}
}
