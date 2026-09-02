import SceneMath from '../../math/SceneMath.js';
import {PixelMath} from '../../math/PixelMath.js';
import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {GLSL_DIRECTIVE_PREFIX} from './consts.js';
import {CelestialRenderViewSnapshot} from './CelestialRenderViewSnapshot.js';

const TILE_SAMPLES_PER_PIXEL = 16;
const TILE_MARGIN_PIXELS = 2;
const TILE_TEXTURE_NAME = 'algorithm32-sun-continuous-coverage-tile';
const ZERO_TILE_TEXTURE_NAME = 'algorithm32-sun-continuous-coverage-zero';
const COVERAGE_POLICY_ID = 'analytic-circular-disk-pixel-overlap-field-s16-v1';

/** Composer-compatible generation pass for one compact source-local Sun coverage tile. */
export class SunDiskTileGenerationPass {
	enabled = true;
	needsSwap = false;
	clear = false;
	renderToScreen = false;

	/**
	 * Create one distant or finite source-local tile generator.
	 *
	 * @param {SunDiskTileGenerationPassConfiguration} configuration - Source, geometry, renderer, and view facts.
	 */
	constructor(configuration) {
		this._THREE = configuration.THREE;
		this._roster = configuration.roster;
		this._geometry = configuration.geometry;
		this._observation = configuration.observation;
		this._camera = configuration.camera;
		this._sceneScale = configuration.sceneScale;
		this._viewportSize = PixelMath.acceptPixelSize(configuration.viewportSize, 'Sun tile viewport');
		this._logger = configuration.logger ?? null;
		this._source =
			this._roster.family === 'spherical-sun-stars-radial-v1' ? this._roster.sun : this._roster.localSun;
		this._definition = this._source.celestialSourceDefinition;
		this._placement = this._geometry.resolveCelestialPlacements({
			roster: this._roster,
			observation: this._observation,
		})[0];
		this._zeroTexture = this._createZeroTexture();
		this._disposedTargets = new WeakSet();
		this._activeTarget = null;
		this._activeGeneration = /** @type {CelestialSunTileGeneration | null} */ (null);
		this._desiredProjection = null;
		this._dirtyReason = /** @type {CelestialGenerationDirtyReason | null} */ ('initial');
		this._generationCount = 0;
		this._failedGenerationCount = 0;
		this._reusedFrameCount = 0;
		this._createdTargetCount = 0;
		this._disposedTargetCount = 0;
		this._contextLossCount = 0;
		this._lastError = null;
		this._disposed = false;
		this._createDraw();
	}

	/** Remove the GLSL version directive before passing GLSL3 source to Three. */
	_stripGlslVersion(source) {
		return source.replace(new RegExp(`^${GLSL_DIRECTIVE_PREFIX}version\\s+300\\s+es\\s*\\n`), '');
	}

	/** Create the exact-zero fallback tile. */
	_createZeroTexture() {
		const THREE = this._THREE;
		const texture = new THREE.DataTexture(new Float32Array([0]), 1, 1, THREE.RedFormat, THREE.FloatType);
		texture.name = ZERO_TILE_TEXTURE_NAME;
		texture.internalFormat = 'R32F';
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		texture.generateMipmaps = false;
		texture.needsUpdate = true;
		return texture;
	}

	/** Create the fixed analytic coverage shader draw. */
	_createDraw() {
		const THREE = this._THREE;
		const vertexShader = `#version 300 es
precision highp float;

void main() {
	vec2 position = gl_VertexID == 0
		? vec2(-1.0, -1.0)
		: (gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0));
	gl_Position = vec4(position, 0.0, 1.0);
}`;
		const fragmentShader = `#version 300 es
precision highp float;
precision highp int;

uniform float uSunRadiusPixels;
uniform float uSunTileSamplesPerPixel;
uniform vec2 uSunTileResolution;
layout(location = 0) out highp float outSunCoverage;

float sunCross(vec2 left, vec2 right) {
	return left.x * right.y - left.y * right.x;
}

float sunSectorOrTriangle(vec2 left, vec2 right, float radiusPixels) {
	vec2 midpoint = 0.5 * (left + right);
	if (dot(midpoint, midpoint) <= radiusPixels * radiusPixels) {
		return 0.5 * sunCross(left, right);
	}
	return 0.5 * radiusPixels * radiusPixels
		* atan(sunCross(left, right), dot(left, right));
}

float sunCircleSegmentArea(vec2 left, vec2 right, float radiusPixels) {
	vec2 delta = right - left;
	float a = dot(delta, delta);
	float b = 2.0 * dot(left, delta);
	float c = dot(left, left) - radiusPixels * radiusPixels;
	float first = 0.0;
	float second = 0.0;
	float discriminant = b * b - 4.0 * a * c;
	if (a > 0.0 && discriminant > 0.0) {
		float root = sqrt(discriminant);
		first = clamp((-b - root) / (2.0 * a), 0.0, 1.0);
		second = clamp((-b + root) / (2.0 * a), 0.0, 1.0);
	}
	vec2 point0 = left;
	vec2 point1 = mix(left, right, min(first, second));
	vec2 point2 = mix(left, right, max(first, second));
	vec2 point3 = right;
	return sunSectorOrTriangle(point0, point1, radiusPixels)
		+ sunSectorOrTriangle(point1, point2, radiusPixels)
		+ sunSectorOrTriangle(point2, point3, radiusPixels);
}

float sunCircularDiskPixelCoverage(vec2 pixelCenter, float radiusPixels) {
	vec2 bottomLeft = pixelCenter + vec2(-0.5, -0.5);
	vec2 bottomRight = pixelCenter + vec2(0.5, -0.5);
	vec2 topRight = pixelCenter + vec2(0.5, 0.5);
	vec2 topLeft = pixelCenter + vec2(-0.5, 0.5);
	float area = sunCircleSegmentArea(bottomLeft, bottomRight, radiusPixels)
		+ sunCircleSegmentArea(bottomRight, topRight, radiusPixels)
		+ sunCircleSegmentArea(topRight, topLeft, radiusPixels)
		+ sunCircleSegmentArea(topLeft, bottomLeft, radiusPixels);
	return clamp(abs(area), 0.0, 1.0);
}

void main() {
	vec2 relativePixelCenter = (gl_FragCoord.xy - 0.5 * uSunTileResolution)
		/ uSunTileSamplesPerPixel;
	outSunCoverage = sunCircularDiskPixelCoverage(relativePixelCenter, uSunRadiusPixels);
}`;
		this._uniforms = {
			uSunRadiusPixels: {value: 1},
			uSunTileSamplesPerPixel: {value: TILE_SAMPLES_PER_PIXEL},
			uSunTileResolution: {value: new THREE.Vector2(1, 1)},
		};
		this._material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3 ?? '300 es',
			vertexShader: this._stripGlslVersion(vertexShader),
			fragmentShader: this._stripGlslVersion(fragmentShader),
			uniforms: this._uniforms,
			depthTest: false,
			depthWrite: false,
			blending: THREE.NoBlending,
		});
		this._geometryResource = new THREE.BufferGeometry();
		this._geometryResource.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
		this._mesh = new THREE.Mesh(this._geometryResource, this._material);
		this._mesh.frustumCulled = false;
		this._scene = new THREE.Scene();
		this._drawCamera = new THREE.Camera();
		this._scene.add(this._mesh);
		this._stages = /** @type {readonly CelestialGenerationStageDescription[]} */ ([
			{
				id: 'celestial-generation.sun-continuous-coverage-tile',
				order: 120,
				topology: 'fullscreen-triangles',
				vertexCount: 3,
				vertexShaderSource: vertexShader,
				fragmentShaderSource: fragmentShader,
				depthPolicy: 'disabled',
				outputs: [
					{
						id: 'celestial.sun.coverage-tile',
						format: 'R32F',
						persistence: 'published',
						shape: 'source-local-continuous-coverage',
						clearValue: 0,
					},
				],
				dependencies: [],
				bindingRequirements: [],
				completionBoundary: 'publication',
				sourceHash: CanonicalValueHash.sha256Value({policy: COVERAGE_POLICY_ID, vertexShader, fragmentShader}),
			},
		]);
	}

	/** Multiply one column-major matrix by one four-vector. */
	_multiplyMatrixVector(matrix, vector) {
		return [0, 1, 2, 3].map(
			(row) =>
				matrix[row] * vector[0] +
				matrix[4 + row] * vector[1] +
				matrix[8 + row] * vector[2] +
				matrix[12 + row] * vector[3],
		);
	}

	/** Resolve screen placement, apparent scale, compact shape, and reuse identity. */
	_projection(view) {
		let modelCenter;
		let homogeneous;
		let angularRadiusRadians;
		let sourceVisible = true;
		if (this._placement.kind === 'distant-uniform-sun' && this._definition.kind === 'distant-uniform-sun') {
			if (typeof this._geometry.expressCelestialDirectionInScene !== 'function') {
				throw new TypeError('Distant Sun projection requires geometry model-to-scene direction mapping.');
			}
			modelCenter = this._geometry.expressCelestialDirectionInScene(this._placement.directionToSource);
			homogeneous = 0;
			angularRadiusRadians = this._definition.angularRadius.value;
			sourceVisible = this._placement.support.classification !== 'empty';
		} else if (this._placement.kind === 'finite-local-sun' && this._definition.kind === 'finite-local-sun') {
			modelCenter = SceneMath.toScenePosition(this._placement.center, this._sceneScale);
			homogeneous = 1;
			const cameraWorldMatrix = CelestialRenderViewSnapshot._invertMatrix4([
				...this._camera.matrixWorldInverse.elements,
			]);
			const cameraPosition = cameraWorldMatrix.slice(12, 15);
			const distanceSceneUnits = Math.hypot(
				modelCenter[0] - cameraPosition[0],
				modelCenter[1] - cameraPosition[1],
				modelCenter[2] - cameraPosition[2],
			);
			const radiusSceneUnits = SceneMath.toSceneUnits(this._definition.radius, this._sceneScale);
			angularRadiusRadians = Math.asin(
				Math.min(1, radiusSceneUnits / Math.max(distanceSceneUnits, radiusSceneUnits)),
			);
		} else {
			throw new RangeError('Sun tile requires one supported geometry-resolved Sun placement.');
		}

		const clip = this._multiplyMatrixVector(view.modelViewProjectionMatrix, [...modelCenter, homogeneous]);
		const centerPixels =
			sourceVisible && clip[3] > 0
				? [
						((clip[0] / clip[3] + 1) * view.viewportSize.width) / 2,
						((clip[1] / clip[3] + 1) * view.viewportSize.height) / 2,
					]
				: [-1000000, -1000000];
		const focalPixels = Math.abs(this._camera.projectionMatrix.elements[5]) * view.viewportSize.height * 0.5;
		const radiusPixels = Math.max(Number.EPSILON, Math.tan(angularRadiusRadians) * focalPixels);
		const halfExtentPixels = Math.ceil(radiusPixels + TILE_MARGIN_PIXELS);
		const resolution = 2 * halfExtentPixels * TILE_SAMPLES_PER_PIXEL;
		const identity = CanonicalValueHash.sha256Value({
			policy: COVERAGE_POLICY_ID,
			source: this._source.describeCelestialSourceIdentity(),
			sourceVisible,
			projectionScale: focalPixels,
			radiusPixels,
			resolution,
		});
		return {identity, centerPixels, radiusPixels, resolution, sourceVisible};
	}

	/** Create one staging R32F coverage target. */
	_createTarget(projection) {
		const THREE = this._THREE;
		const target = new THREE.WebGLRenderTarget(projection.resolution, projection.resolution, {
			format: THREE.RedFormat,
			type: THREE.FloatType,
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			wrapS: THREE.ClampToEdgeWrapping,
			wrapT: THREE.ClampToEdgeWrapping,
			generateMipmaps: false,
			depthBuffer: false,
			stencilBuffer: false,
		});
		target.texture.name = TILE_TEXTURE_NAME;
		target.texture.internalFormat = 'R32F';
		this._createdTargetCount += 1;
		return target;
	}

	/** Dispose one render target exactly once. */
	_disposeTarget(target) {
		if (!target || this._disposedTargets.has(target)) return;
		this._disposedTargets.add(target);
		target.dispose?.();
		this._disposedTargetCount += 1;
	}

	/** Generate and atomically replace one complete coverage tile. */
	_generate(renderer, projection) {
		let target = null;
		const previousTarget = renderer.getRenderTarget?.() ?? null;
		const previousAutoClear = renderer.autoClear;
		try {
			target = this._createTarget(projection);
			this._uniforms.uSunRadiusPixels.value = projection.radiusPixels;
			this._uniforms.uSunTileResolution.value.set(projection.resolution, projection.resolution);
			renderer.autoClear = false;
			renderer.setRenderTarget(target);
			const gl = renderer.getContext?.();
			if (!gl?.clearBufferfv) throw new TypeError('Sun tile generation requires a WebGL2 renderer context.');
			gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
			renderer.render(this._scene, this._drawCamera);
			const retired = this._activeTarget;
			this._activeTarget = target;
			this._activeGeneration = /** @type {CelestialSunTileGeneration} */ ({
				id: projection.identity,
				viewIdentity: projection.identity,
				coverage: {
					id: `${projection.identity}:sun-coverage`,
					format: 'R32F',
					width: projection.resolution,
					height: projection.resolution,
					texture: target.texture,
				},
				surfaceRadiance: this._definition.surfaceRadiance,
				claimPolicy: 'any-positive-coverage-opaque',
				completion: 'complete',
			});
			target = null;
			this._dirtyReason = null;
			this._generationCount += 1;
			this._disposeTarget(retired);
		} catch (error) {
			this._failedGenerationCount += 1;
			this._lastError = error instanceof Error ? error.message : String(error);
			this._disposeTarget(target);
			this._logger?.warn?.('Sun coverage-tile generation failed; retaining the prior publication.', error);
		} finally {
			renderer.autoClear = previousAutoClear;
			renderer.setRenderTarget(previousTarget);
		}
	}

	get stages() {
		return [...this._stages];
	}

	get publicationState() {
		return {active: this._activeGeneration, staging: null, dirtyReason: this._dirtyReason};
	}

	/** Return nullable active values for joint-publication gating. */
	bindingValues() {
		if (
			!this._activeTarget ||
			!this._desiredProjection ||
			this._activeGeneration?.id !== this._desiredProjection.identity ||
			this._dirtyReason !== null
		) {
			return null;
		}
		return {
			'runtime.celestial.sunCoverageTile': this._activeTarget.texture,
			'runtime.celestial.sunScreenCenterPixels': [...this._desiredProjection.centerPixels],
			'runtime.celestial.sunTileResolution': [
				this._desiredProjection.resolution,
				this._desiredProjection.resolution,
			],
			'runtime.celestial.sunTileSamplesPerPixel': TILE_SAMPLES_PER_PIXEL,
			'runtime.celestial.sunSurfaceRadiance': [...this._definition.surfaceRadiance.values],
		};
	}

	/** Return format-compatible exact-zero values until the desired tile is complete. */
	consumerBindingValues() {
		return this.bindingValues() ?? this.zeroConsumerBindingValues();
	}

	/** Return an exact-zero tile with the unchanged shared source spectrum. */
	zeroConsumerBindingValues() {
		return {
			'runtime.celestial.sunCoverageTile': this._zeroTexture,
			'runtime.celestial.sunScreenCenterPixels': [-1000000, -1000000],
			'runtime.celestial.sunTileResolution': [1, 1],
			'runtime.celestial.sunTileSamplesPerPixel': 1,
			'runtime.celestial.sunSurfaceRadiance': [...this._definition.surfaceRadiance.values],
		};
	}

	markDirty(reason) {
		if (this._disposed) return;
		this._dirtyReason = reason;
	}

	async prepare(renderer) {
		if (this._disposed) throw new Error('Cannot prepare a disposed Sun tile generation stage.');
		if (typeof renderer.compileAsync === 'function') await renderer.compileAsync(this._scene, this._drawCamera);
		else renderer.compile(this._scene, this._drawCamera);
	}

	setSize(width, height) {
		const viewportSize = PixelMath.createPixelSize(width, height, 'Sun tile viewport');
		if (viewportSize.width === this._viewportSize.width && viewportSize.height === this._viewportSize.height)
			return;
		this._viewportSize = viewportSize;
		this.markDirty('view');
	}

	render(renderer) {
		if (this._disposed || !this.enabled) return;
		try {
			const view = CelestialRenderViewSnapshot.capture(this._camera, this._viewportSize);
			const projection = this._projection(view);
			this._desiredProjection = projection;
			if (this._activeGeneration?.id === projection.identity) {
				this._dirtyReason = null;
				this._reusedFrameCount += 1;
				return;
			}
			this._dirtyReason = 'view';
			this._generate(renderer, projection);
		} catch (error) {
			this._failedGenerationCount += 1;
			this._lastError = error instanceof Error ? error.message : String(error);
			this._dirtyReason = 'view';
			this._logger?.warn?.('Sun tile projection failed; publishing exact-zero Sun coverage.', error);
		}
	}

	handleContextLoss() {
		if (this._disposed) return;
		this._contextLossCount += 1;
		this._disposeTarget(this._activeTarget);
		this._activeTarget = null;
		this._activeGeneration = null;
		this._dirtyReason = 'context-restoration';
	}

	handleContextRestoration() {
		if (this._disposed) return;
		this._zeroTexture.needsUpdate = true;
		this._dirtyReason = 'context-restoration';
	}

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
			policyIdentity: COVERAGE_POLICY_ID,
			sourceVisibility:
				this._placement.kind === 'distant-uniform-sun'
					? this._placement.support.classification
					: 'finite-source',
			publicationState: this.publicationState,
		};
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this.enabled = false;
		this._disposeTarget(this._activeTarget);
		this._activeTarget = null;
		this._activeGeneration = null;
		this._zeroTexture.dispose?.();
		this._material.dispose?.();
		this._geometryResource.dispose?.();
	}
}
