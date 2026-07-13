import { ShaderPassPerformanceTimer } from './ShaderPassPerformanceTimer.js';
import {
	createPixelSize,
	pixelSizeToShaderValue,
} from '../utils/PixelMath.js';
import { GLSL_DIRECTIVE_PREFIX } from './consts.js';

/**
 * Composer-compatible fullscreen shader pass owned by ShaderBuilder.
 */
export class ShaderRuntimePass {
	/**
	 * Return a fullscreen GLSL3 vertex shader.
	 *
	 * @returns {string} Return the vertex shader source.
	 */
	_fullscreenVertexShader() {
		return `${GLSL_DIRECTIVE_PREFIX}version 300 es
precision highp float;
in vec3 position;
out vec2 vUv;

void main() {
	vUv = position.xy * 0.5 + 0.5;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
	}

	/**
	 * Strip a GLSL version directive before passing GLSL3 source to Three.
	 *
	 * @param {string} source - Supplies shader source.
	 * @returns {string} Return source without its version directive.
	 */
	_stripGlslVersion(source) {
		return source.replace(
			new RegExp(`^${GLSL_DIRECTIVE_PREFIX}version\\s+300\\s+es\\s*\\n`),
			'',
		);
	}

	/**
	 * Track whether the pass participates in composer rendering.
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
	 * Track whether the pass should clear before drawing.
	 *
	 * @type {boolean}
	 */
	clear = false;

	/**
	 * Track whether this pass renders directly to the screen.
	 *
	 * @type {boolean}
	 */
	renderToScreen = false;

	/**
	 * Store runtime uniforms.
	 *
	 * @type {Record<string, { value: unknown }>}
	 */
	_uniforms;

	/**
	 * Store the Three shader material.
	 *
	 * @type {import('three').RawShaderMaterial}
	 */
	_material;

	/**
	 * Store the fullscreen geometry.
	 *
	 * @type {import('three').PlaneGeometry}
	 */
	_geometry;

	/**
	 * Store the fullscreen mesh.
	 *
	 * @type {import('three').Mesh}
	 */
	_mesh;

	/**
	 * Store the internal pass scene.
	 *
	 * @type {import('three').Scene}
	 */
	_scene;

	/**
	 * Store the internal pass camera.
	 *
	 * @type {import('three').OrthographicCamera}
	 */
	_camera;

	/**
	 * Store the source hash for diagnostics.
	 *
	 * @type {string}
	 */
	_sourceHash;

	/**
	 * Store optional runtime logger.
	 *
	 * @type {Console | null}
	 */
	_logger;

	/**
	 * Store optional renderer-produced scene input texture provider.
	 *
	 * @type {SceneInputCapture | null}
	 */
	_sceneInputCapture;

	/**
	 * Store the builder-owned live-uniform refresh operation.
	 *
	 * @type {(() => void) | null}
	 */
	_refreshUniformValues;

	/** Store an optional Color-owned pre-render operation. */
	_beforeRender;

	/**
	 * Store the unit-bearing viewport dimensions.
	 *
	 * @type {PixelSize}
	 */
	_viewportSize;

	/**
	 * Track render count.
	 *
	 * @type {number}
	 */
	_frameCount = 0;

	/**
	 * Track non-fatal render errors.
	 *
	 * @type {number}
	 */
	_renderErrorCount = 0;

	/**
	 * Store the last render error message.
	 *
	 * @type {string | null}
	 */
	_lastRenderError = null;

	/**
	 * Track whether this pass has been disposed.
	 *
	 * @type {boolean}
	 */
	_disposed = false;

	/**
	 * Store optional runtime pass performance timer.
	 *
	 * @type {ShaderPassPerformanceTimer | null}
	 */
	_performanceTimer = null;

	/**
	 * Create an installed runtime shader pass.
	 *
	 * @param {ShaderRuntimePassConfiguration} configuration - Supplies pass setup.
	 */
	constructor(configuration) {
		const THREE = /** @type {typeof import('three')} */ (configuration.THREE);
		this._uniforms = configuration.uniforms;
		this._sourceHash = configuration.sourceHash;
		this._logger = configuration.logger === undefined ? null : configuration.logger;
		this._sceneInputCapture = configuration.sceneInputCapture === undefined
			? null
			: configuration.sceneInputCapture;
		this._refreshUniformValues = configuration.refreshUniformValues ?? null;
		this._beforeRender = configuration.beforeRender ?? null;
		this._viewportSize = configuration.viewportSize;
		this._performanceTimer = configuration.performanceCallback !== undefined
			? new ShaderPassPerformanceTimer({
				passName: 'algorithm32-runtime-shader',
				performanceCallback: configuration.performanceCallback,
				sampleIntervalFrames: configuration.performanceSampleIntervalFrames,
				maxPendingQueries: configuration.performanceMaxPendingQueries,
			})
			: null;
		this._material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3 ?? '300 es',
			vertexShader: this._stripGlslVersion(
				this._fullscreenVertexShader(),
			),
			fragmentShader: this._stripGlslVersion(
				configuration.fragmentShaderSource,
			),
			uniforms: this._uniforms,
			depthTest: false,
			depthWrite: false,
		});
		this._geometry = new THREE.PlaneGeometry(2, 2);
		this._mesh = new THREE.Mesh(this._geometry, this._material);
		this._scene = new THREE.Scene();
		this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this._scene.add(this._mesh);
	}

	/**
	 * Return the material owned by the pass.
	 *
	 * @returns {unknown} Return the shader material.
	 */
	get material() {
		return this._material;
	}

	/**
	 * Return the uniforms owned by the pass.
	 *
	 * @returns {Record<string, { value: unknown }>} Return the uniforms.
	 */
	get uniforms() {
		return this._uniforms;
	}

	/**
	 * Compile and link the runtime program without blocking the frame loop when
	 * the renderer supports parallel shader compilation.
	 *
	 * @param {import('three').WebGLRenderer} renderer - Owns the WebGL program.
	 * @returns {Promise<void>} Resolve when the program is ready for first use.
	 */
	async prepare(renderer) {
		if (this._disposed) {
			throw new Error(
				'Cannot prepare a disposed Algorithm32 shader pass.',
			);
		}

		if (typeof renderer.compileAsync === 'function') {
			await renderer.compileAsync(this._scene, this._camera);
			return;
		}

		renderer.compile(this._scene, this._camera);
	}

	/**
	 * React to composer resize notifications.
	 *
	 * @param {number} width - Supplies the width in pixels.
	 * @param {number} height - Supplies the height in pixels.
	 * @returns {void}
	 */
	setSize(width, height) {
		this._viewportSize = createPixelSize(
			width,
			height,
			'ShaderRuntimePass.setSize viewport',
		);
		const viewportUniform = this._uniforms.uViewportSizePixels;

		if (viewportUniform) {
			viewportUniform.value = pixelSizeToShaderValue(this._viewportSize);
		}
	}

	/**
	 * Render the fullscreen shader pass for one composer invocation.
	 *
	 * @param {import('three').WebGLRenderer} renderer - Supplies the active renderer.
	 * @param {import('three').WebGLRenderTarget} writeBuffer - Supplies the composer write buffer.
	 * @param {import('three').WebGLRenderTarget} readBuffer - Supplies the
	 * composer buffer containing the already-rendered scene color.
	 * @returns {void}
	 */
	render(renderer, writeBuffer, readBuffer) {
		if (this._disposed || !this.enabled) {
			return;
		}

		try {
			this._refreshUniformValues?.();
			this._beforeRender?.(renderer);

			if (this._uniforms.uSceneColorTexture) {
				this._uniforms.uSceneColorTexture.value =
					readBuffer?.texture ?? null;
			}

			if (this._sceneInputCapture) {
				if (this._uniforms.uSceneDepthTexture) {
					this._uniforms.uSceneDepthTexture.value = this._sceneInputCapture.depthTexture;
				}

				if (this._uniforms.uSceneHitTexture) {
					this._uniforms.uSceneHitTexture.value = this._sceneInputCapture.hitTexture;
				}
			}

			if (typeof renderer?.setRenderTarget === 'function') {
				renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
			}

			if (this.clear && typeof renderer?.clear === 'function') {
				renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
			}

			if (typeof renderer?.render === 'function') {
				const performanceSample = this._performanceTimer?.begin?.(renderer, {
					frameCount: this._frameCount,
					sourceHash: this._sourceHash,
					renderToScreen: this.renderToScreen,
					targetName: this.renderToScreen ? 'screen' : writeBuffer?.texture?.name ?? null,
				}) ?? null;

				try {
					renderer.render(this._scene, this._camera);
				} finally {
					this._performanceTimer?.end?.(renderer, performanceSample);
				}
			}

			this._frameCount += 1;
		} catch (error) {
			this._renderErrorCount += 1;
			this._lastRenderError = error instanceof Error ? error.message : String(error);
			this._logger?.warn?.('Algorithm32 shader pass render failed; keeping the previous composer state.', error);
		}
	}

	/**
	 * Return internal pass diagnostics.
	 *
	 * @returns {unknown} Return diagnostics.
	 */
	getDiagnostics() {
		return {
			status: this._disposed ? 'disposed' : 'ready',
			sourceHash: this._sourceHash,
			frameCount: this._frameCount,
			renderErrorCount: this._renderErrorCount,
			lastRenderError: this._lastRenderError,
			viewportSize: this._viewportSize,
			hasBeforeRender: this._beforeRender !== null,
			sceneInputCapture: this._sceneInputCapture?.getDiagnostics?.() ?? null,
		};
	}

	/**
	 * Dispose resources owned by the pass.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this.enabled = false;
		this._performanceTimer?.dispose?.();
		this._material?.dispose?.();
		this._geometry?.dispose?.();
	}
}
