import { ShaderPassPerformanceTimer } from './ShaderPassPerformanceTimer.js';
import DistanceMath from '../utils/DistanceMath.js';
import SceneMath from '../utils/SceneMath.js';
import { createPixelSize } from '../utils/PixelMath.js';

/**
 * Create a WebGL render target for one scene input texture.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {number} widthPixels - Supplies the target width in pixels.
 * @param {number} heightPixels - Supplies the target height in pixels.
 * @param {string} name - Supplies the texture diagnostic name.
 * @returns {import('three').WebGLRenderTarget} Return render target.
 */
function createRenderTarget(THREE, widthPixels, heightPixels, name) {
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
 * Return an optional finite coordinate or its absent-value default.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {number} fallback - Supplies the fallback.
	 * @param {string} label - Supplies the diagnostic label.
	 * @returns {number} Return the accepted coordinate.
 */
function optionalFiniteCoordinate(value, fallback, label) {
	if (value === undefined) {
		return fallback;
	}

	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${label} must be a finite number when supplied.`);
	}

	return value;
}

/**
 * Assert that a vector-like value contains finite coordinates.
 *
 * @param {unknown} value - Supplies the vector-like value.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {void}
 */
function assertFiniteVector3(value, label) {
	if (!value || typeof value !== 'object') {
		throw new TypeError(`${label} must contain finite x, y, and z coordinates.`);
	}

	const vector = /** @type {{ x?: unknown, y?: unknown, z?: unknown }} */ (value);

	if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y) || !Number.isFinite(vector.z)) {
		throw new TypeError(`${label} must contain finite x, y, and z coordinates.`);
	}
}

/**
 * Update a vector-like value from camera world position.
 *
 * @param {import('three').Camera} camera - Supplies the active camera.
 * @param {import('three').Vector3} target - Supplies the vector to mutate.
 * @returns {void}
 */
function updateCameraWorldPosition(camera, target) {
	if (typeof camera?.getWorldPosition === 'function') {
		camera.getWorldPosition(target);
		assertFiniteVector3(target, 'SceneInputCapture camera world position');
		return;
	}

	if (target && typeof target.set === 'function') {
		target.set(
			optionalFiniteCoordinate(camera?.position?.x, 0, 'SceneInputCapture camera.position.x'),
			optionalFiniteCoordinate(camera?.position?.y, 0, 'SceneInputCapture camera.position.y'),
			optionalFiniteCoordinate(camera?.position?.z, 0, 'SceneInputCapture camera.position.z'),
		);
	}
}

/**
 * Create a vector initialized to the camera world position.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {import('three').Camera} camera - Supplies the active camera.
 * @returns {import('three').Vector3} Return vector.
 */
function createVector3(THREE, camera) {
	const vector = new THREE.Vector3();
	updateCameraWorldPosition(camera, vector);

	return vector;
}

/**
 * Return the shared distance-capture vertex shader.
 *
 * @returns {string} Return shader source.
 */
function distanceVertexShader() {
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
 * Return the distance-packing fragment shader.
 *
 * @returns {string} Return shader source.
 */
function distanceFragmentShader() {
	return `
precision highp float;

uniform vec3 uCameraWorldPosition;
uniform float uMetersPerSceneUnit;
uniform float uSceneDepthMaxMeters;
varying vec3 vWorldPosition;

vec3 packNormalizedDistance24(float value) {
	float normalized = clamp(value, 0.0, 1.0);
	float packed = floor(normalized * 16777214.0 + 0.5);
	float red = floor(packed / 65536.0);
	packed -= red * 65536.0;
	float green = floor(packed / 256.0);
	float blue = packed - green * 256.0;
	return vec3(red, green, blue) / 255.0;
}

void main() {
	float distanceMeters = distance(vWorldPosition, uCameraWorldPosition) * uMetersPerSceneUnit;
	gl_FragColor = vec4(packNormalizedDistance24(distanceMeters / uSceneDepthMaxMeters), 1.0);
}
`;
}

/**
 * Return the shared hit-mask vertex shader.
 *
 * @returns {string} Return shader source.
 */
function hitVertexShader() {
	return `
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
}

/**
 * Return the hit-mask fragment shader.
 *
 * @returns {string} Return shader source.
 */
function hitFragmentShader() {
	return `
void main() {
	gl_FragColor = vec4(1.0);
}
`;
}

/**
 * Create the override material that packs camera distance into RGB.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {import('three').Camera} camera - Supplies the active camera.
 * @param {SceneScale} sceneScale - Supplies the accepted scene unit scale.
 * @param {Distance} sceneDepthMax - Supplies the accepted depth cap.
 * @returns {import('three').ShaderMaterial} Return material.
 */
function createDepthMaterial(THREE, camera, sceneScale, sceneDepthMax) {
	const metersPerSceneUnit = sceneScale.value;
	const sceneDepthMaxMeters = DistanceMath.toMeters(sceneDepthMax);
	const material = new THREE.ShaderMaterial({
		uniforms: {
			uCameraWorldPosition: {
				value: createVector3(THREE, camera),
			},
			uMetersPerSceneUnit: {
				value: metersPerSceneUnit,
			},
			uSceneDepthMaxMeters: {
				value: sceneDepthMaxMeters,
			},
		},
		vertexShader: distanceVertexShader(),
		fragmentShader: distanceFragmentShader(),
	});

	material.depthTest = true;
	material.depthWrite = true;

	return material;
}

/**
 * Create the override material that writes an explicit hit mask.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @returns {import('three').ShaderMaterial} Return material.
 */
function createHitMaterial(THREE) {
	const material = new THREE.ShaderMaterial({
		vertexShader: hitVertexShader(),
		fragmentShader: hitFragmentShader(),
	});

	material.depthTest = true;
	material.depthWrite = true;

	return material;
}

/**
 * Resize one render target.
 *
 * @param {import('three').WebGLRenderTarget} target - Supplies the render target.
 * @param {number} widthPixels - Supplies target width in pixels.
 * @param {number} heightPixels - Supplies target height in pixels.
 * @returns {void}
 */
function resizeRenderTarget(target, widthPixels, heightPixels) {
	if (typeof target?.setSize === 'function') {
		target.setSize(widthPixels, heightPixels);
		return;
	}

	target.width = widthPixels;
	target.height = heightPixels;
}

/**
 * Read renderer clear state when the renderer exposes it.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {import('three').WebGLRenderer} renderer - Supplies the active renderer.
 * @returns {{ color: import('three').Color, alpha: number } | null} Return clear state or null.
 */
function readRendererClearState(THREE, renderer) {
	if (
		typeof renderer.getClearColor !== 'function'
		|| typeof renderer.getClearAlpha !== 'function'
		|| typeof THREE?.Color !== 'function'
	) {
		return null;
	}

	return {
		color: renderer.getClearColor(new THREE.Color()),
		alpha: renderer.getClearAlpha(),
	};
}

/**
 * Restore renderer clear state when it was captured.
 *
 * @param {import('three').WebGLRenderer} renderer - Supplies the active renderer.
 * @param {{ color: import('three').Color, alpha: number } | null} clearState - Supplies captured state.
 * @returns {void}
 */
function restoreRendererClearState(renderer, clearState) {
	if (!clearState || typeof renderer.setClearColor !== 'function') {
		return;
	}

	renderer.setClearColor(clearState.color, clearState.alpha);
}

/**
 * Hide objects that are visible scene content but not Algorithm32 scene inputs.
 *
 * @param {import('three').Scene} scene - Supplies the scene to traverse.
 * @returns {Array<{ object: import('three').Object3D, visible: boolean }>} Return visibility snapshots.
 */
function hideSceneInputExcludedObjects(scene) {
	const hiddenObjects = [];

	if (typeof scene?.traverse !== 'function') {
		return hiddenObjects;
	}

	scene.traverse((object) => {
		if (object?.userData?.algorithm32SceneInput !== false || object.visible === false) {
			return;
		}

		hiddenObjects.push({
			object,
			visible: object.visible,
		});
		object.visible = false;
	});

	return hiddenObjects;
}

/**
 * Restore objects hidden by the scene-input capture filter.
 *
 * @param {Array<{ object: import('three').Object3D, visible: boolean }>} hiddenObjects - Supplies visibility snapshots.
 * @returns {void}
 */
function restoreSceneInputExcludedObjects(hiddenObjects) {
	for (const entry of hiddenObjects) {
		entry.object.visible = entry.visible;
	}
}

/**
 * Composer-compatible pass that captures renderer-produced scene inputs
 * consumed by the Algorithm32 runtime shader.
 */
export class SceneInputCapture {
	/**
	 * Track whether capture runs during rendering.
	 *
	 * @type {boolean}
	 */
	enabled = true;

	/**
	 * Track whether the composer should swap buffers after this pass.
	 *
	 * @type {boolean}
	 */
	needsSwap = false;

	/**
	 * Track whether the pass should clear composer buffers before drawing.
	 *
	 * @type {boolean}
	 */
	clear = false;

	/**
	 * Track whether this capture pass renders directly to the screen.
	 *
	 * @type {boolean}
	 */
	renderToScreen = false;

	/**
	 * Store the caller-provided Three namespace.
	 *
	 * @type {typeof import('three')}
	 */
	_THREE;

	/**
	 * Store the live scene to capture.
	 *
	 * @type {import('three').Scene}
	 */
	_scene;

	/**
	 * Store the live camera to capture from.
	 *
	 * @type {import('three').Camera}
	 */
	_camera;

	/**
	 * Store the render target carrying packed scene-hit distance.
	 *
	 * @type {import('three').WebGLRenderTarget}
	 */
	_depthTarget;

	/**
	 * Store the render target carrying explicit scene-hit mask.
	 *
	 * @type {import('three').WebGLRenderTarget}
	 */
	_hitTarget;

	/**
	 * Store the override material that packs hit distance.
	 *
	 * @type {import('three').ShaderMaterial}
	 */
	_depthMaterial;

	/**
	 * Store the override material that captures hit coverage.
	 *
	 * @type {import('three').ShaderMaterial}
	 */
	_hitMaterial;

	/**
	 * Store unit-bearing viewport dimensions.
	 *
	 * @type {PixelSize}
	 */
	_viewportSize;

	/**
	 * Store the renderer scene-to-physical scale.
	 *
	 * @type {SceneScale}
	 */
	_sceneScale;

	/**
	 * Store the largest representable scene distance.
	 *
	 * @type {Distance}
	 */
	_sceneDepthMax;

	/**
	 * Count completed capture frames.
	 *
	 * @type {number}
	 */
	_frameCount = 0;

	/**
	 * Track whether owned GPU resources have been disposed.
	 *
	 * @type {boolean}
	 */
	_disposed = false;

	/**
	 * Store optional depth-pass performance timer.
	 *
	 * @type {ShaderPassPerformanceTimer | null}
	 */
	_depthPerformanceTimer = null;

	/**
	 * Store optional hit-pass performance timer.
	 *
	 * @type {ShaderPassPerformanceTimer | null}
	 */
	_hitPerformanceTimer = null;

	/**
	 * Create reusable scene input capture resources.
	 *
	 * @param {SceneInputCaptureConfiguration} configuration - Supplies the
	 * renderer attachment and capture policy.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('Scene input capture configuration is required.');
		}

		const THREE = /** @type {typeof import('three')} */ (configuration.THREE);

		for (const constructorName of ['WebGLRenderTarget', 'ShaderMaterial', 'Vector3']) {
			if (typeof THREE?.[constructorName] !== 'function') {
				throw new TypeError(`Scene input capture requires THREE.${constructorName}.`);
			}
		}

		if (!configuration.scene || typeof configuration.scene !== 'object') {
			throw new TypeError('Scene input capture requires scene.');
		}

		if (!configuration.camera || typeof configuration.camera !== 'object') {
			throw new TypeError('Scene input capture requires camera.');
		}

		this._THREE = THREE;
		this._scene = /** @type {import('three').Scene} */ (configuration.scene);
		this._camera = /** @type {import('three').Camera} */ (configuration.camera);
		this._sceneScale = configuration.sceneScale === undefined
			? SceneMath.scaleInMetersPerSceneUnit(1)
			: configuration.sceneScale;
		this._sceneDepthMax = configuration.sceneDepthMax === undefined
			? DistanceMath.inMeters(100000)
			: configuration.sceneDepthMax;
		SceneMath.assertSceneScale(this._sceneScale, 'SceneInputCapture.sceneScale');
		DistanceMath.assertDistance(this._sceneDepthMax, 'SceneInputCapture.sceneDepthMax');

		if (DistanceMath.toMeters(this._sceneDepthMax) <= 0) {
			throw new RangeError('SceneInputCapture.sceneDepthMax must be positive.');
		}

		this._viewportSize = configuration.viewportSize;
		const widthPixels = this._viewportSize.width;
		const heightPixels = this._viewportSize.height;
		this._depthTarget = createRenderTarget(THREE, widthPixels, heightPixels, 'Algorithm32.scene-depth-rgb24');
		this._hitTarget = createRenderTarget(THREE, widthPixels, heightPixels, 'Algorithm32.scene-hit-r8');
		this._depthMaterial = createDepthMaterial(
			THREE,
			this._camera,
			this._sceneScale,
			this._sceneDepthMax,
		);
		this._hitMaterial = createHitMaterial(THREE);

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
	 * Return the packed scene-depth texture.
	 *
	 * @returns {unknown} Return texture.
	 */
	get depthTexture() {
		return this._depthTarget.texture;
	}

	/**
	 * Return the explicit scene-hit mask texture.
	 *
	 * @returns {unknown} Return texture.
	 */
	get hitTexture() {
		return this._hitTarget.texture;
	}

	/**
	 * Return unit-bearing viewport dimensions.
	 *
	 * @returns {PixelSize} Return viewport dimensions.
	 */
	get viewportSize() {
		return this._viewportSize;
	}

	/**
	 * Return binding values produced by this capture helper.
	 *
	 * @returns {SceneInputCaptureBindingValues} Return runtime binding values.
	 */
	bindingValues() {
		return {
			'runtime.sceneDepthTexture': this.depthTexture,
			'runtime.sceneHitTexture': this.hitTexture,
			'runtime.viewportSize': this.viewportSize,
		};
	}

	/**
	 * Assert that capture resources are still usable.
	 *
	 * @returns {void}
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('SceneInputCapture has been disposed.');
		}
	}

	/**
	 * Render one override-material capture pass and restore renderer state.
	 *
	 * @param {import('three').WebGLRenderer} renderer - Supplies the active renderer.
	 * @param {import('three').WebGLRenderTarget} target - Supplies the render target.
	 * @param {import('three').Material} material - Supplies the scene override material.
	 * @param {ShaderPassPerformanceTimer | null} performanceTimer - Supplies optional timer.
	 * @returns {void}
	 */
	_renderWithOverride(renderer, target, material, performanceTimer = null) {
		if (typeof renderer.setRenderTarget !== 'function') {
			throw new TypeError('Scene input capture requires renderer.setRenderTarget().');
		}

		if (typeof renderer.render !== 'function') {
			throw new TypeError('Scene input capture requires renderer.render().');
		}

		const previousTarget = typeof renderer.getRenderTarget === 'function'
			? renderer.getRenderTarget()
			: null;
		const previousOverrideMaterial = this._scene.overrideMaterial;
		const previousBackground = this._scene.background;
		const previousClearState = readRendererClearState(this._THREE, renderer);
		const hiddenObjects = hideSceneInputExcludedObjects(this._scene);
		const performanceSample = performanceTimer?.begin?.(renderer, {
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
			restoreSceneInputExcludedObjects(hiddenObjects);
			restoreRendererClearState(renderer, previousClearState);
			renderer.setRenderTarget(previousTarget);
		}
	}

	/**
	 * Resize owned capture resources.
	 *
	 * @param {number} width - Supplies the viewport width.
	 * @param {number} height - Supplies the viewport height.
	 * @returns {void}
	 */
	setSize(width, height) {
		this._assertUsable();

		this._viewportSize = createPixelSize(
			width,
			height,
			'SceneInputCapture.setSize viewport',
		);
		const widthPixels = this._viewportSize.width;
		const heightPixels = this._viewportSize.height;

		resizeRenderTarget(this._depthTarget, widthPixels, heightPixels);
		resizeRenderTarget(this._hitTarget, widthPixels, heightPixels);
	}

	/**
	 * Capture scene depth and hit mask for one render frame.
	 *
	 * @param {import('three').WebGLRenderer} renderer - Supplies the active Three renderer.
	 * @returns {void}
	 */
	capture(renderer) {
		this._assertUsable();

		if (!this.enabled) {
			return;
		}

		if (!renderer || typeof renderer !== 'object') {
			throw new TypeError('Scene input capture requires renderer.');
		}

		updateCameraWorldPosition(this._camera, this._depthMaterial.uniforms.uCameraWorldPosition.value);
		this._renderWithOverride(renderer, this._depthTarget, this._depthMaterial, this._depthPerformanceTimer);
		this._renderWithOverride(renderer, this._hitTarget, this._hitMaterial, this._hitPerformanceTimer);
		this._frameCount += 1;
	}

	/**
	 * Capture scene inputs for one composer invocation.
	 *
	 * @param {import('three').WebGLRenderer} renderer - Supplies the active Three renderer.
	 * @returns {void}
	 */
	render(renderer) {
		this.capture(renderer);
	}

	/**
	 * Return capture diagnostics for runtime inspection.
	 *
	 * @returns {unknown} Return diagnostics.
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
	 * Dispose owned capture resources.
	 *
	 * @returns {void}
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
