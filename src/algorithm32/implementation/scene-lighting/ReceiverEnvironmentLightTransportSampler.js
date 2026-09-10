import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../spectral-values/index.js';
import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from './ReceiverEnvironmentLightQuadrature.js';
import {
	DIRECTION_TEXTURE_VALUE_KEY,
	OUTPUT_CHANNEL_VALUE_KEY,
	ReceiverEnvironmentLightTransportShader,
} from './ReceiverEnvironmentLightTransportShader.js';

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec3 position;
out vec2 screenTextureCoordinates;
void main() {
	screenTextureCoordinates = position.xy * 0.5 + 0.5;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/** Three/WebGL2 sampler that executes common path transport for the fixed receiver hemisphere. */
export class ReceiverEnvironmentLightTransportSampler {
	constructor(request) {
		this._THREE = request.THREE;
		this._renderer = request.renderer;
		this._backend = request.backend;
		this._model = request.model;
		this._cache = request.scatteringCache;
		this._bindingValues = request.bindingValues ?? {};
		this._programRetention = request.programRetention;
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
		const values = new Float32Array(RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length * 4);
		for (const [index, sample] of RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.entries()) {
			const directionSceneLocal = /** @type {UnitVector3} */ ([
				sample.directionLocal[0],
				sample.directionLocal[2],
				sample.directionLocal[1],
			]);
			const modelDirection =
				this._model.geometry.mapObserverLocalSceneDirectionToModelDirection(directionSceneLocal);
			values.set(modelDirection, index * 4);
			values[index * 4 + 3] = 1;
		}
		const texture = new THREE.DataTexture(
			values,
			RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length,
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
					: Object.hasOwn(uniform, 'defaultValue')
						? uniform.defaultValue
						: null;
				uniforms[uniform.name] = {
					value: this._normalizeUniform(uniform.type, value),
				};
			}
			for (const texture of contribution.textures) {
				uniforms[texture.name] = {
					value: texture.valueKey === DIRECTION_TEXTURE_VALUE_KEY ? directionTexture : null,
				};
			}
		}
		return uniforms;
	}

	/** Execute the active cache transport and return one native radiance packet per fixed direction. */
	async sample(request = {}) {
		if (request.signal?.aborted)
			throw new DOMException('Receiver environment-light transport was aborted.', 'AbortError');
		const THREE = this._THREE;
		const assembly = new ReceiverEnvironmentLightTransportShader().create({
			model: this._model,
			scatteringCache: this._cache,
		});
		const directionTexture = this._createDirectionTexture();
		let uniforms = this._createUniforms(assembly, directionTexture);
		const cacheUniforms = {};
		for (const contribution of assembly.contributions) {
			for (const texture of contribution.textures) {
				if (texture.valueKey !== DIRECTION_TEXTURE_VALUE_KEY)
					cacheUniforms[texture.valueKey] = uniforms[texture.name];
			}
		}
		this._backend.installRuntimeBindings({bindings: this._cache.getRuntimeBindings(), uniforms: cacheUniforms});

		const retained = this._programRetention;
		if (retained?.material && retained.shaderSource !== assembly.fragmentShaderSource) {
			retained.material.dispose();
			retained.material = null;
		}
		const material =
			retained?.material ??
			new THREE.RawShaderMaterial({
				glslVersion: THREE.GLSL3 ?? '300 es',
				vertexShader: VERTEX_SHADER.replace(/^#version 300 es\s*/u, ''),
				fragmentShader: assembly.fragmentShaderSource.replace(/^#version 300 es\s*/u, ''),
				uniforms,
				depthTest: false,
				depthWrite: false,
				blending: THREE.NoBlending,
			});
		if (material.uniforms !== uniforms) {
			for (const [name, uniform] of Object.entries(uniforms)) material.uniforms[name].value = uniform.value;
			uniforms = material.uniforms;
		}
		material.uniformsNeedUpdate = true;
		if (retained) {
			retained.material = material;
			retained.shaderSource = assembly.fragmentShaderSource;
		}
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
		const target = new THREE.WebGLRenderTarget(RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length, 1, {
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
			{length: RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length},
			() => new Float32Array(this._model.spectral.basis.channelCount),
		);
		try {
			if (typeof this._renderer.compileAsync === 'function') {
				await this._renderer.compileAsync(scene, camera);
			} else {
				this._renderer.compile(scene, camera);
			}
			const pixels = new Float32Array(RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length * 4);
			for (let channelIndex = 0; channelIndex < this._model.spectral.basis.channelCount; channelIndex += 1) {
				if (request.signal?.aborted)
					throw new DOMException('Receiver environment-light transport was aborted.', 'AbortError');
				uniforms.uReceiverEnvironmentOutputChannel.value = channelIndex;
				this._renderer.setRenderTarget(target);
				this._renderer.render(scene, camera);
				this._renderer.readRenderTargetPixels(
					target,
					0,
					0,
					RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length,
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
			if (!retained) material.dispose();
			directionTexture.dispose();
		}
		return values.map(
			(channelValues) =>
				/** @type {SpectralRadiancePacket} */ (
					new SpectralPacket({
						basis: this._model.spectral.basis,
						quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
						units: SPECTRAL_UNITS.RADIANCE_DENSITY,
						semantics: 'contiguous-wavelength-bin-average',
						values: channelValues,
						provenanceIdentity: `receiver-environment-common-transport:${assembly.sourceHash}`,
					})
				),
		);
	}
}
