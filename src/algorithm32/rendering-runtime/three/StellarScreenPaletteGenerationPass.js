import {PixelMath} from '../../math/PixelMath.js';
import {GLSL_DIRECTIVE_PREFIX} from './consts.js';
import {CelestialRenderViewSnapshot} from './CelestialRenderViewSnapshot.js';

const SOURCE_TEXTURE_NAME = 'algorithm32-stellar-generation-source';
const SCREEN_INDEX_TEXTURE_NAME = 'algorithm32-stellar-screen-index';
const PALETTE_TEXTURE_NAME = 'algorithm32-stellar-palette';
const ZERO_SCREEN_INDEX_TEXTURE_NAME = 'algorithm32-stellar-screen-index-zero';
const ZERO_PALETTE_TEXTURE_NAME = 'algorithm32-stellar-palette-zero';

/** Composer-compatible owner of stellar generation execution and active/staging GPU resources. */
export class StellarScreenPaletteGenerationPass {
	/** Composer pass flags. */
	enabled = true;
	needsSwap = false;
	clear = false;
	renderToScreen = false;
	/** Current published generation. @type {StellarScreenPaletteGeneration | null} */
	_activeGeneration;
	/** Public staging transaction facts. @type {StellarScreenPalettePublicationState['staging']} */
	_stagingState;
	/** Reason active bindings are not consumable. @type {CelestialGenerationDirtyReason | null} */
	_dirtyReason;

	/**
	 * Create the standard-pipeline stellar generation pass.
	 *
	 * @param {StellarScreenPaletteGenerationPassConfiguration} configuration - Fixed source, geometry, and renderer facts.
	 */
	constructor(configuration) {
		this._THREE = configuration.THREE;
		this._sourceOwner = configuration.source;
		this._geometry = configuration.geometry;
		this._observation = configuration.observation;
		this._camera = configuration.camera;
		this._viewportSize = PixelMath.acceptPixelSize(configuration.viewportSize, 'Stellar generation viewport');
		this._logger = configuration.logger ?? null;
		this._sourceTable = this._sourceOwner.createStellarGenerationSourceTable();
		this._geometryContribution = this._geometry.createStellarGenerationShaderContribution({
			observation: this._observation,
		});
		this._stages = this._sourceOwner.createStellarGenerationStages({
			geometry: this._geometry,
			observation: this._observation,
		});
		this._assertStageContract();
		this._layout = this._stages[0].stellarLayout;
		this._sourceTexture = this._createSourceTexture();
		this._zeroScreenIndexTexture = this._createZeroScreenIndexTexture();
		this._zeroPaletteTexture = this._createZeroPaletteTexture();
		this._disposedTargets = new WeakSet();
		this._createdTargetCount = 0;
		this._disposedTargetCount = 0;
		this._generationCount = 0;
		this._failedGenerationCount = 0;
		this._reusedFrameCount = 0;
		this._contextLossCount = 0;
		this._lastError = null;
		this._activePair = null;
		this._stagingPair = null;
		this._activeGeneration = null;
		this._stagingState = null;
		this._dirtyReason = 'initial';
		this._disposed = false;
		this._createStageDraws();
	}

	/** Require the exact qualified two-stage layout before resource construction. */
	_assertStageContract() {
		if (
			this._stages.length !== 2 ||
			this._stages[0].id !== 'celestial-generation.stellar-point-index' ||
			this._stages[1].id !== 'celestial-generation.stellar-sparse-palette' ||
			this._stages[0].outputs[0]?.format !== 'R16UI' ||
			this._stages[1].outputs[0]?.format !== 'R32F' ||
			this._stages[0].policyIdentity !== this._stages[1].policyIdentity
		) {
			throw new RangeError('Stellar runtime requires the qualified point-index and sparse-palette stages.');
		}
	}

	/** Remove a GLSL version directive before handing GLSL3 source to Three. */
	_stripGlslVersion(source) {
		return source.replace(new RegExp(`^${GLSL_DIRECTIVE_PREFIX}version\\s+300\\s+es\\s*\\n`), '');
	}

	/** Create the immutable source-table data texture. */
	_createSourceTexture() {
		const THREE = this._THREE;
		const layout = this._sourceTable.layout;
		const texture = new THREE.DataTexture(
			this._sourceTable.copyValues(),
			layout.componentCount,
			layout.memberCount,
			THREE.RedFormat,
			THREE.FloatType,
		);
		texture.name = SOURCE_TEXTURE_NAME;
		texture.internalFormat = 'R32F';
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		texture.generateMipmaps = false;
		texture.flipY = false;
		texture.unpackAlignment = 1;
		texture.needsUpdate = true;
		return texture;
	}

	/** Create the format-compatible exact-zero integer texture used while no matching pair is consumable. */
	_createZeroScreenIndexTexture() {
		const THREE = this._THREE;
		const texture = new THREE.DataTexture(
			new Uint16Array([0]),
			1,
			1,
			THREE.RedIntegerFormat,
			THREE.UnsignedShortType,
		);
		texture.name = ZERO_SCREEN_INDEX_TEXTURE_NAME;
		texture.internalFormat = 'R16UI';
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.needsUpdate = true;
		return texture;
	}

	/** Create the exact-zero native-channel palette paired with the integer fallback. */
	_createZeroPaletteTexture() {
		const THREE = this._THREE;
		const texture = new THREE.DataTexture(
			new Float32Array(this._layout.channelCount),
			1,
			this._layout.channelCount,
			THREE.RedFormat,
			THREE.FloatType,
		);
		texture.name = ZERO_PALETTE_TEXTURE_NAME;
		texture.internalFormat = 'R32F';
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.needsUpdate = true;
		return texture;
	}

	/** Create one stage uniform map from fixed geometry declarations. */
	_createUniforms(includeScreenIndex) {
		const THREE = this._THREE;
		const uniforms = {
			uStellarGenerationSource: {value: this._sourceTexture},
		};
		if (includeScreenIndex) uniforms.uStellarScreenIndex = {value: null};
		for (const uniform of this._geometryContribution.uniforms) {
			let value = uniform.defaultValue;
			if (uniform.type === 'mat4') {
				value = new THREE.Matrix4().fromArray(/** @type {readonly number[]} */ (uniform.defaultValue));
			}
			if (uniform.type === 'ivec2') {
				value = new THREE.Vector2(.../** @type {[number, number]} */ (uniform.defaultValue));
			}
			uniforms[uniform.name] = {value};
		}
		return uniforms;
	}

	/** Create the fixed point and fullscreen draw objects. */
	_createStageDraws() {
		const THREE = this._THREE;
		this._pointUniforms = this._createUniforms(false);
		this._paletteUniforms = this._createUniforms(true);
		this._pointMaterial = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3 ?? '300 es',
			vertexShader: this._stripGlslVersion(this._stages[0].vertexShaderSource),
			fragmentShader: this._stripGlslVersion(this._stages[0].fragmentShaderSource),
			uniforms: this._pointUniforms,
			depthTest: true,
			depthWrite: true,
			depthFunc: THREE.LessDepth,
			blending: THREE.NoBlending,
		});
		this._paletteMaterial = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3 ?? '300 es',
			vertexShader: this._stripGlslVersion(this._stages[1].vertexShaderSource),
			fragmentShader: this._stripGlslVersion(this._stages[1].fragmentShaderSource),
			uniforms: this._paletteUniforms,
			depthTest: false,
			depthWrite: false,
			blending: THREE.NoBlending,
		});
		this._pointGeometry = new THREE.BufferGeometry();
		this._pointGeometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(this._layout.memberCount * 3), 3),
		);
		this._paletteGeometry = new THREE.BufferGeometry();
		this._paletteGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
		this._pointObject = new THREE.Points(this._pointGeometry, this._pointMaterial);
		this._paletteObject = new THREE.Mesh(this._paletteGeometry, this._paletteMaterial);
		this._pointObject.frustumCulled = false;
		this._paletteObject.frustumCulled = false;
		this._pointScene = new THREE.Scene();
		this._paletteScene = new THREE.Scene();
		this._drawCamera = new THREE.Camera();
		this._pointScene.add(this._pointObject);
		this._paletteScene.add(this._paletteObject);
	}

	/** Create one renderer-owned staging output pair. */
	_createOutputPair(generationIdentity) {
		const THREE = this._THREE;
		let screenIndexTarget = null;
		let paletteTarget = null;
		try {
			screenIndexTarget = new THREE.WebGLRenderTarget(this._viewportSize.width, this._viewportSize.height, {
				format: THREE.RedIntegerFormat,
				type: THREE.UnsignedShortType,
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter,
				wrapS: THREE.ClampToEdgeWrapping,
				wrapT: THREE.ClampToEdgeWrapping,
				generateMipmaps: false,
				depthBuffer: true,
				stencilBuffer: false,
			});
			this._createdTargetCount += 1;
			screenIndexTarget.texture.name = SCREEN_INDEX_TEXTURE_NAME;
			screenIndexTarget.texture.internalFormat = 'R16UI';
			paletteTarget = new THREE.WebGLRenderTarget(this._layout.entryCapacity, this._layout.channelCount, {
				format: THREE.RedFormat,
				type: THREE.FloatType,
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter,
				wrapS: THREE.ClampToEdgeWrapping,
				wrapT: THREE.ClampToEdgeWrapping,
				generateMipmaps: false,
				depthBuffer: false,
				stencilBuffer: false,
			});
			this._createdTargetCount += 1;
			paletteTarget.texture.name = PALETTE_TEXTURE_NAME;
			paletteTarget.texture.internalFormat = 'R32F';
			return {generationIdentity, screenIndexTarget, paletteTarget};
		} catch (error) {
			this._disposeTarget(screenIndexTarget);
			this._disposeTarget(paletteTarget);
			throw error;
		}
	}

	/** Dispose one target at most once. */
	_disposeTarget(target) {
		if (!target || this._disposedTargets.has(target)) return;
		this._disposedTargets.add(target);
		target.dispose?.();
		this._disposedTargetCount += 1;
	}

	/** Dispose both targets in one internal pair. */
	_disposePair(pair) {
		if (!pair) return;
		this._disposeTarget(pair.screenIndexTarget);
		this._disposeTarget(pair.paletteTarget);
	}

	/** Apply one exact view snapshot to both stage uniform maps. */
	_applyView(view, pair) {
		for (const uniforms of [this._pointUniforms, this._paletteUniforms]) {
			uniforms.uStellarModelViewProjectionMatrix.value.fromArray(view.modelViewProjectionMatrix);
			uniforms.uStellarInverseProjectionMatrix.value.fromArray(view.inverseProjectionMatrix);
			uniforms.uStellarViewportSize.value.set(view.viewportSize.width, view.viewportSize.height);
		}
		this._paletteUniforms.uStellarScreenIndex.value = pair.screenIndexTarget.texture;
	}

	/** Clear one integer or floating target through the renderer's WebGL2 context. */
	_clearTarget(renderer, target, integer, clearDepth) {
		renderer.setRenderTarget(target);
		const gl = renderer.getContext?.();
		if (!gl?.clearBufferuiv || !gl?.clearBufferfv) {
			throw new TypeError('Stellar generation requires a WebGL2 renderer context.');
		}
		if (integer) gl.clearBufferuiv(gl.COLOR, 0, new Uint32Array([0, 0, 0, 0]));
		else gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
		if (clearDepth) {
			gl.clearDepth(1);
			gl.clear(gl.DEPTH_BUFFER_BIT);
		}
	}

	/** Execute both qualified stages and atomically publish only after both return. */
	_generate(renderer, view, identity) {
		const pair = this._createOutputPair(identity.generationIdentity);
		this._stagingPair = pair;
		this._stagingState = {
			id: identity.generationIdentity,
			compatibility: identity.compatibility,
			transients: [{id: `${identity.generationIdentity}:order-depth`, ownerStageId: this._stages[0].id}],
		};
		const previousTarget = renderer.getRenderTarget?.() ?? null;
		const previousAutoClear = renderer.autoClear;
		try {
			this._applyView(view, pair);
			renderer.autoClear = false;
			this._clearTarget(renderer, pair.screenIndexTarget, true, true);
			renderer.render(this._pointScene, this._drawCamera);
			this._clearTarget(renderer, pair.paletteTarget, false, false);
			renderer.render(this._paletteScene, this._drawCamera);

			const previousPair = this._activePair;
			this._activePair = pair;
			this._activeGeneration = {
				id: identity.generationIdentity,
				compatibility: identity.compatibility,
				screenIndex: /** @type {StellarScreenPaletteThreeOutputResource} */ ({
					id: `${identity.generationIdentity}:screen-index`,
					format: /** @type {const} */ ('R16UI'),
					width: view.viewportSize.width,
					height: view.viewportSize.height,
					texture: pair.screenIndexTarget.texture,
				}),
				palette: /** @type {StellarScreenPaletteThreeOutputResource} */ ({
					id: `${identity.generationIdentity}:palette`,
					format: /** @type {const} */ ('R32F'),
					width: this._layout.entryCapacity,
					height: this._layout.channelCount,
					texture: pair.paletteTarget.texture,
				}),
				layout: this._layout,
				completion: /** @type {const} */ ('complete'),
			};
			this._stagingPair = null;
			this._stagingState = null;
			this._dirtyReason = null;
			this._generationCount += 1;
			this._disposePair(previousPair);
		} catch (error) {
			this._failedGenerationCount += 1;
			this._lastError = error instanceof Error ? error.message : String(error);
			this._disposePair(pair);
			this._stagingPair = null;
			this._stagingState = null;
			this._logger?.warn?.('Stellar screen-palette generation failed; retaining the prior publication.', error);
		} finally {
			renderer.autoClear = previousAutoClear;
			renderer.setRenderTarget(previousTarget);
		}
	}

	/** Ordered stage descriptions installed by this participant. */
	get stages() {
		return [...this._stages];
	}

	/** Current active/staging publication state. */
	get publicationState() {
		return {active: this._activeGeneration, staging: this._stagingState, dirtyReason: this._dirtyReason};
	}

	/** Return exact-zero/null bindings unless the active pair matches the current view. */
	bindingValues() {
		if (!this._activePair || this._dirtyReason !== null) {
			return {
				'runtime.celestial.stellarScreenIndex': null,
				'runtime.celestial.stellarPalette': null,
			};
		}
		return {
			'runtime.celestial.stellarScreenIndex': this._activePair.screenIndexTarget.texture,
			'runtime.celestial.stellarPalette': this._activePair.paletteTarget.texture,
		};
	}

	/** Return format-compatible active or exact-zero textures for the installed consumer uniforms. */
	consumerBindingValues() {
		const active = this.bindingValues();
		return {
			'runtime.celestial.stellarScreenIndex':
				active['runtime.celestial.stellarScreenIndex'] ?? this._zeroScreenIndexTexture,
			'runtime.celestial.stellarPalette': active['runtime.celestial.stellarPalette'] ?? this._zeroPaletteTexture,
		};
	}

	/** Return format-compatible exact-zero textures without consulting active publication state. */
	zeroConsumerBindingValues() {
		return {
			'runtime.celestial.stellarScreenIndex': this._zeroScreenIndexTexture,
			'runtime.celestial.stellarPalette': this._zeroPaletteTexture,
		};
	}

	/** Mark active output unusable until a matching generation commits. */
	markDirty(reason) {
		if (this._disposed) return;
		this._dirtyReason = reason;
	}

	/** Compile both generation programs before first render. */
	async prepare(renderer) {
		if (this._disposed) throw new Error('Cannot prepare disposed stellar generation stages.');
		if (typeof renderer.compileAsync === 'function') {
			await renderer.compileAsync(this._pointScene, this._drawCamera);
			await renderer.compileAsync(this._paletteScene, this._drawCamera);
			return;
		}
		renderer.compile(this._pointScene, this._drawCamera);
		renderer.compile(this._paletteScene, this._drawCamera);
	}

	/** Resize view-dependent outputs and make the active pair incompatible. */
	setSize(width, height) {
		const viewportSize = PixelMath.createPixelSize(width, height, 'Stellar generation viewport');
		if (viewportSize.width === this._viewportSize.width && viewportSize.height === this._viewportSize.height)
			return;
		this._viewportSize = viewportSize;
		this.markDirty('view');
	}

	/** Run generation before later composer passes whenever exact view compatibility is absent. */
	render(renderer) {
		if (this._disposed || !this.enabled) return;
		try {
			const view = CelestialRenderViewSnapshot.capture(this._camera, this._viewportSize);
			const identity = this._sourceOwner.createStellarGenerationIdentity({
				geometry: this._geometry,
				observation: this._observation,
				view,
			});
			if (this._activeGeneration?.id === identity.generationIdentity && this._dirtyReason === null) {
				this._reusedFrameCount += 1;
				return;
			}
			if (this._activeGeneration?.id !== identity.generationIdentity) this.markDirty('view');
			this._generate(renderer, view, identity);
		} catch (error) {
			this._failedGenerationCount += 1;
			this._lastError = error instanceof Error ? error.message : String(error);
			this._logger?.warn?.('Stellar view capture failed; publishing exact-zero stellar bindings.', error);
		}
	}

	/** Invalidate all renderer handles after WebGL context loss. */
	handleContextLoss() {
		if (this._disposed) return;
		this._contextLossCount += 1;
		this._disposePair(this._stagingPair);
		this._disposePair(this._activePair);
		this._stagingPair = null;
		this._stagingState = null;
		this._activePair = null;
		this._activeGeneration = null;
		this._dirtyReason = 'context-restoration';
	}

	/** Require normal regeneration after renderer context restoration. */
	handleContextRestoration() {
		if (this._disposed) return;
		this._sourceTexture.needsUpdate = true;
		this._zeroScreenIndexTexture.needsUpdate = true;
		this._zeroPaletteTexture.needsUpdate = true;
		this._dirtyReason = 'context-restoration';
	}

	/** Return lifecycle, identity, and resource diagnostics. */
	getDiagnostics() {
		return {
			status: this._disposed ? 'disposed' : 'ready',
			generationCount: this._generationCount,
			failedGenerationCount: this._failedGenerationCount,
			reusedFrameCount: this._reusedFrameCount,
			contextLossCount: this._contextLossCount,
			createdTargetCount: this._createdTargetCount,
			disposedTargetCount: this._disposedTargetCount,
			lastError: this._lastError,
			publicationState: this.publicationState,
		};
	}

	/** Dispose active, staging, input, program, and geometry resources exactly once. */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this.enabled = false;
		this._disposePair(this._stagingPair);
		this._disposePair(this._activePair);
		this._stagingPair = null;
		this._activePair = null;
		this._stagingState = null;
		this._activeGeneration = null;
		this._dirtyReason = 'initial';
		this._sourceTexture.dispose?.();
		this._zeroScreenIndexTexture.dispose?.();
		this._zeroPaletteTexture.dispose?.();
		this._pointMaterial.dispose?.();
		this._paletteMaterial.dispose?.();
		this._pointGeometry.dispose?.();
		this._paletteGeometry.dispose?.();
	}
}
