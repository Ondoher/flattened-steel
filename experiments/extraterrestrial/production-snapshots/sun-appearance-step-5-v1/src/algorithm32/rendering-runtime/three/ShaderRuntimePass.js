import {ShaderPassPerformanceTimer} from './ShaderPassPerformanceTimer.js';
import {PixelMath} from '../../math/PixelMath.js';
import {GLSL_DIRECTIVE_PREFIX} from './consts.js';

/**
 * Composer-compatible fullscreen shader pass owned by ShaderBuilder.
 */
export class ShaderRuntimePass {
	/**
	 * Called by shader runtime pass to return a fullscreen GLSL3 vertex shader.
	 *
	 * @returns {string} - Return the vertex shader source.
	 */
	_fullscreenVertexShader() {
		return `${GLSL_DIRECTIVE_PREFIX}version 300 es
precision highp float;
in vec3 position;
out vec2 screenTextureCoordinates;

void main() {
	screenTextureCoordinates = position.xy * 0.5 + 0.5;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
	}

	/**
	 * Called by shader runtime pass to strip a GLSL version directive before passing GLSL3 source to Three.
	 *
	 * @param {string} source - Supplies shader source.
	 * @returns {string} - Return source without its version directive.
	 */
	_stripGlslVersion(source) {
		return source.replace(new RegExp(`^${GLSL_DIRECTIVE_PREFIX}version\\s+300\\s+es\\s*\\n`), '');
	}

	/**
	 * Value that tracks whether the pass participates in composer rendering.
	 *
	 * @type {boolean}
	 *
	 */
	enabled = true;

	/**
	 * Value that tracks whether the composer should swap buffers after this pass.
	 *
	 * @type {boolean}
	 *
	 */
	needsSwap = false;

	/**
	 * Value that tracks whether the pass should clear before drawing.
	 *
	 * @type {boolean}
	 *
	 */
	clear = false;

	/**
	 * Value that tracks whether this pass renders directly to the screen.
	 *
	 * @type {boolean}
	 *
	 */
	renderToScreen = false;

	/**
	 * Value that stores runtime uniforms.
	 *
	 * @type {ShaderRuntimeUniformMap}
	 *
	 */
	_uniforms;

	/**
	 * Value that stores the Three shader material.
	 *
	 * @type {ShaderRuntimePassMaterial}
	 *
	 */
	_material;

	/**
	 * Value that stores the fullscreen geometry.
	 *
	 * @type {ShaderRuntimePassGeometry}
	 *
	 */
	_geometry;

	/**
	 * Value that stores the fullscreen mesh.
	 *
	 * @type {ShaderRuntimePassMesh}
	 *
	 */
	_mesh;

	/**
	 * Value that stores the internal pass scene.
	 *
	 * @type {ShaderRuntimePassScene}
	 *
	 */
	_scene;

	/**
	 * Value that stores the internal pass camera.
	 *
	 * @type {ShaderRuntimePassCamera}
	 *
	 */
	_camera;

	/**
	 * Value that stores the source hash for diagnostics.
	 *
	 * @type {string}
	 *
	 */
	_sourceHash;

	/**
	 * Value that stores optional runtime logger.
	 *
	 * @type {Console | null}
	 *
	 */
	_logger;

	/**
	 * Value that stores optional renderer-produced scene input texture provider.
	 *
	 * @type {SceneInputCapture | null}
	 *
	 */
	_sceneInputCapture;

	/**
	 * Value that stores the builder-owned live-uniform refresh operation.
	 *
	 * @type {(() => void) | null}
	 *
	 */
	_refreshUniformValues;

	/**
	 * Value that stores the optional operation executed after live uniforms are current and before the normal Color draw.
	 *
	 * @type {ShaderRuntimePreRenderOperation | null}
	 */
	_beforeRender;

	/**
	 * Value that stores the unit-bearing viewport dimensions.
	 *
	 * @type {PixelSize}
	 *
	 */
	_viewportSize;

	/**
	 * Value that tracks render count.
	 *
	 * @type {number}
	 *
	 */
	_frameCount = 0;

	/**
	 * Value that tracks non-fatal render errors.
	 *
	 * @type {number}
	 *
	 */
	_renderErrorCount = 0;

	/**
	 * Value that stores the last render error message.
	 *
	 * @type {string | null}
	 *
	 */
	_lastRenderError = null;

	/**
	 * Value that tracks whether this pass has been disposed.
	 *
	 * @type {boolean}
	 *
	 */
	_disposed = false;

	/**
	 * Value that stores optional runtime pass performance timer.
	 *
	 * @type {ShaderPassPerformanceTimer | null}
	 *
	 */
	_performanceTimer = null;

	/**
	 * Creates an installed runtime shader pass.
	 *
	 * @param {ShaderRuntimePassConfiguration} configuration - Supplies pass setup.
	 *
	 */
	constructor(configuration) {
		const THREE = /** @type {ShaderRuntimePassResourceNamespace} */ (configuration.THREE);
		this._uniforms = configuration.uniforms;
		this._sourceHash = configuration.sourceHash;
		this._logger = configuration.logger === undefined ? null : configuration.logger;
		this._sceneInputCapture =
			configuration.sceneInputCapture === undefined ? null : configuration.sceneInputCapture;
		this._refreshUniformValues = configuration.refreshUniformValues ?? null;
		this._beforeRender = configuration.beforeRender ?? null;
		this._viewportSize = configuration.viewportSize;
		this._performanceTimer =
			configuration.performanceCallback !== undefined
				? new ShaderPassPerformanceTimer({
						passName: 'algorithm32-runtime-shader',
						performanceCallback: configuration.performanceCallback,
						sampleIntervalFrames: configuration.performanceSampleIntervalFrames,
						maxPendingQueries: configuration.performanceMaxPendingQueries,
					})
				: null;
		this._material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3 ?? '300 es',
			vertexShader: this._stripGlslVersion(this._fullscreenVertexShader()),
			fragmentShader: this._stripGlslVersion(configuration.fragmentShaderSource),
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
	 * Value that returns the material owned by the pass.
	 *
	 * @returns {unknown} - Return the shader material.
	 */
	get material() {
		return this._material;
	}

	/**
	 * Value that returns the uniforms owned by the pass.
	 *
	 * @returns {ShaderRuntimeUniformMap} - Return the uniforms.
	 */
	get uniforms() {
		return this._uniforms;
	}

	/**
	 * Call this method to compile and link the runtime program without blocking the frame loop when the renderer supports parallel shader compilation. Preparation rejects when the pass is disposed or renderer compilation fails; it is not cancellable once started.
	 *
	 * @param {ShaderRuntimePassRenderer} renderer - Owns the WebGL program.
	 * @returns {Promise<void>} - Resolve when the program is ready for first use.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	async prepare(renderer) {
		if (this._disposed) {
			throw new Error('Cannot prepare a disposed Algorithm32 shader pass.');
		}

		if (typeof renderer.compileAsync === 'function') {
			await renderer.compileAsync(this._scene, this._camera);
			return;
		}

		renderer.compile(this._scene, this._camera);
	}

	/**
	 * Call this method to react to composer resize notifications.
	 *
	 * @param {number} width - Supplies the width in pixels.
	 * @param {number} height - Supplies the height in pixels.
	 * @returns {void} -
	 */
	setSize(width, height) {
		this._viewportSize = PixelMath.createPixelSize(width, height, 'ShaderRuntimePass.setSize viewport');
		const viewportUniform = this._uniforms.uViewportSizePixels;

		if (viewportUniform) {
			viewportUniform.value = PixelMath.pixelSizeToShaderValue(this._viewportSize);
		}
	}

	/**
	 * Call this method to render the fullscreen shader pass for one composer invocation.
	 *
	 * @param {ShaderRuntimePassRenderer} renderer - Supplies the active renderer.
	 * @param {ShaderRuntimePassRenderTarget} writeBuffer - Supplies the composer write buffer.
	 * @param {ShaderRuntimePassRenderTarget} readBuffer - Supplies the
	 * composer buffer containing the already-rendered scene color.
	 * @param {number} [deltaTimeSeconds] - Supplies composer frame time in seconds.
	 * @returns {void} -
	 */
	render(renderer, writeBuffer, readBuffer, deltaTimeSeconds = 0) {
		if (this._disposed || !this.enabled) {
			return;
		}

		try {
			this._refreshUniformValues?.();
			this._beforeRender?.(renderer, deltaTimeSeconds);

			if (this._uniforms.uSceneColorTexture) {
				this._uniforms.uSceneColorTexture.value = readBuffer?.texture ?? null;
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
				const diagnosticTexture = /** @type {ShaderRuntimePassTexture | undefined} */ (writeBuffer?.texture);
				const performanceSample =
					this._performanceTimer?.begin?.(renderer, {
						frameCount: this._frameCount,
						sourceHash: this._sourceHash,
						renderToScreen: this.renderToScreen,
						targetName: this.renderToScreen ? 'screen' : (diagnosticTexture?.name ?? null),
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
	 * Call this method to return internal pass diagnostics. Conditional result values are selected from the accepted input and current state.
	 *
	 * @returns {unknown} - Return diagnostics.
	 */
	getDiagnostics() {
		return {
			status: this._disposed ? 'disposed' : 'ready',
			sourceHash: this._sourceHash,
			frameCount: this._frameCount,
			renderErrorCount: this._renderErrorCount,
			lastRenderError: this._lastRenderError,
			viewportSize: this._viewportSize,
			sceneInputCapture: this._sceneInputCapture?.getDiagnostics?.() ?? null,
		};
	}

	/**
	 * Call this method to dispose resources owned by the pass.
	 *
	 * @returns {void} -
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
