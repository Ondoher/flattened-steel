import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../controls/production-v1/src/algorithm32/spectral-values/index.js';
import {
	DIRECTION_TEXTURE_VALUE_KEY,
	OUTPUT_CHANNEL_VALUE_KEY,
} from '../controls/production-v1/src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportShader.js';
import {Cr2ReceiverDiffuseTransportShader} from './Cr2ReceiverDiffuseTransportShader.js';

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec3 position;
out vec2 screenTextureCoordinates;
void main() {
	screenTextureCoordinates = position.xy * 0.5 + 0.5;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/**
 * Contained parameterized copy of the production receiver-environment
 * transport sampler. It changes only the declared direction quadrature; the
 * active cache and common Q30 path-radiance shader remain unchanged.
 */
export class Cr2ReceiverDiffuseTransportSampler {
	constructor(request) {
		if (!request?.quadrature || !Array.isArray(request.quadrature.samples)) {
			throw new TypeError('CR2 receiver diffuse sampler requires a quadrature.');
		}
		this._THREE = request.THREE;
		this._renderer = request.renderer;
		this._backend = request.backend;
		this._model = request.model;
		this._cache = request.scatteringCache;
		this._quadrature = request.quadrature;
		this._bindingValues = request.bindingValues ?? {};
	}

	_normalizeUniform(type, value) {
		const THREE = this._THREE;
		if (type === 'mat4' && Array.isArray(value)) return new THREE.Matrix4().fromArray(value);
		if ((type === 'vec2' || type === 'ivec2') && Array.isArray(value)) return new THREE.Vector2(...value);
		if ((type === 'vec3' || type === 'ivec3') && Array.isArray(value)) return new THREE.Vector3(...value);
		return value;
	}

	_createDirectionTexture() {
		const THREE = this._THREE;
		const values = new Float32Array(this._quadrature.sampleCount * 4);
		for (const [index, sample] of this._quadrature.samples.entries()) {
			const directionSceneLocal = /** @type {UnitVector3} */ ([
				sample.directionLocal[0],
				sample.directionLocal[2],
				sample.directionLocal[1],
			]);
			const modelDirection = this._model.geometry.mapObserverLocalSceneDirectionToModelDirection(
				directionSceneLocal,
			);
			values.set(modelDirection, index * 4);
			values[index * 4 + 3] = 1;
		}
		const texture = new THREE.DataTexture(
			values,
			this._quadrature.sampleCount,
			1,
			THREE.RGBAFormat,
			THREE.FloatType,
		);
		texture.internalFormat = 'RGBA32F';
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.needsUpdate = true;
		return texture;
	}

	_createUniforms(assembly, directionTexture) {
		const uniforms = {};
		for (const contribution of assembly.contributions) {
			for (const uniform of contribution.uniforms) {
				const value = Object.hasOwn(this._bindingValues, uniform.valueKey)
					? this._bindingValues[uniform.valueKey]
					: Object.hasOwn(uniform, 'defaultValue') ? uniform.defaultValue : null;
				uniforms[uniform.name] = {value: this._normalizeUniform(uniform.type, value)};
			}
			for (const texture of contribution.textures) {
				uniforms[texture.name] = {
					value: texture.valueKey === DIRECTION_TEXTURE_VALUE_KEY ? directionTexture : null,
				};
			}
		}
		return uniforms;
	}

	/** Execute common path transport for every declared quadrature direction. */
	async sample(request = {}) {
		if (request.signal?.aborted) {
			throw new DOMException('CR2 receiver diffuse transport was aborted.', 'AbortError');
		}
		const THREE = this._THREE;
		const assembly = new Cr2ReceiverDiffuseTransportShader(
			this._quadrature.sampleCount,
		).create({
			model: this._model,
			scatteringCache: this._cache,
		});
		const directionTexture = this._createDirectionTexture();
		const uniforms = this._createUniforms(assembly, directionTexture);
		const cacheUniforms = {};
		for (const contribution of assembly.contributions) {
			for (const texture of contribution.textures) {
				if (texture.valueKey !== DIRECTION_TEXTURE_VALUE_KEY) {
					cacheUniforms[texture.valueKey] = uniforms[texture.name];
				}
			}
		}
		this._backend.installRuntimeBindings({
			bindings: this._cache.getRuntimeBindings(),
			uniforms: cacheUniforms,
		});

		const material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3 ?? '300 es',
			vertexShader: VERTEX_SHADER.replace(/^#version 300 es\s*/u, ''),
			fragmentShader: assembly.fragmentShaderSource.replace(/^#version 300 es\s*/u, ''),
			uniforms,
			depthTest: false,
			depthWrite: false,
			blending: THREE.NoBlending,
		});
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
		);
		const scene = new THREE.Scene();
		const mesh = new THREE.Mesh(geometry, material);
		mesh.frustumCulled = false;
		scene.add(mesh);
		const camera = new THREE.Camera();
		const target = new THREE.WebGLRenderTarget(this._quadrature.sampleCount, 1, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			depthBuffer: false,
			stencilBuffer: false,
		});
		target.texture.internalFormat = 'RGBA32F';
		const previousTarget = this._renderer.getRenderTarget();
		const values = Array.from(
			{length: this._quadrature.sampleCount},
			() => new Float32Array(this._model.spectral.basis.channelCount),
		);
		try {
			if (typeof this._renderer.compileAsync === 'function') {
				await this._renderer.compileAsync(scene, camera);
			} else {
				this._renderer.compile(scene, camera);
			}
			const pixels = new Float32Array(this._quadrature.sampleCount * 4);
			for (
				let channelIndex = 0;
				channelIndex < this._model.spectral.basis.channelCount;
				channelIndex += 1
			) {
				if (request.signal?.aborted) {
					throw new DOMException('CR2 receiver diffuse transport was aborted.', 'AbortError');
				}
				uniforms.uReceiverEnvironmentOutputChannel.value = channelIndex;
				this._renderer.setRenderTarget(target);
				this._renderer.render(scene, camera);
				this._renderer.readRenderTargetPixels(
					target,
					0,
					0,
					this._quadrature.sampleCount,
					1,
					pixels,
				);
				for (let directionIndex = 0; directionIndex < values.length; directionIndex += 1) {
					values[directionIndex][channelIndex] = pixels[directionIndex * 4];
				}
			}
		} finally {
			this._renderer.setRenderTarget(previousTarget);
			target.dispose();
			geometry.dispose();
			material.dispose();
			directionTexture.dispose();
		}
		return {
			quadratureId: this._quadrature.id,
			shaderSourceHash: assembly.sourceHash,
			radiances: values.map(
				(channelValues) => /** @type {SpectralRadiancePacket} */ (new SpectralPacket({
					basis: this._model.spectral.basis,
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					semantics: this._model.spectral.basis.semantics,
					values: channelValues,
					provenanceIdentity:
						`color-reset-cr2-common-transport:${this._quadrature.id}:${assembly.sourceHash}`,
				})),
			),
		};
	}
}
