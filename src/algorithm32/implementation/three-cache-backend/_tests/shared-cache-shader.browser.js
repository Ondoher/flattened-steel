import * as THREE from '../../../../../node_modules/three/build/three.module.js';
import {ThreeCacheBackend} from '../ThreeCacheBackend.js';
import DistantSunSharedCache from '../../distant-sun/cache/DistantSunSharedCache.js';

describe('Shared packet shader lookup', () => {
	it('decodes integer metadata, retrieves every Native15 component, and preserves a stable program through darkness', () => {
		const renderer = new THREE.WebGLRenderer({canvas: document.createElement('canvas')});
		renderer.setSize(1, 1, false);
		const backend = new ThreeCacheBackend({THREE, renderer});
		const target = new THREE.WebGLRenderTarget(1, 1, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthBuffer: false,
		});
		const geometry = new THREE.PlaneGeometry(2, 2);
		let material;
		try {
			const array = backend.allocatePersistentArray({
				id: 'shader-packets',
				valueKey: 'cache.sharedPacketAtlas',
				storage: {format: 'RGBA32F', width: 648, height: 1728, layers: 24},
				maximumBytes: 429981696,
			});
			const values = new Float32Array(648 * 1728 * 4);
			for (let channel = 0; channel < 15; channel++)
				for (let face = 0; face < 6; face++)
					for (let v = 0; v < 27; v++)
						for (let u = 0; u < 27; u++) {
							const x = Math.floor(channel / 4) * 162 + face * 27 + u;
							const y = 63 * 27 + v;
							values[(y * 648 + x) * 4 + (channel % 4)] = 0.25 + channel / 32;
						}
			backend.uploadPersistentArrayLayer({array, layer: 23, identity: 'shader-oracle', values});
			const rows = new Uint16Array(109 * 2).fill(65535);
			rows.set([23, 63], 0);
			rows.set([23, 63], 108 * 2);
			const rowTexture = backend.uploadImmutableTexture({
				id: 'shader-rows',
				valueKey: 'cache.sharedRowAddress',
				storage: {format: 'RG16UI', width: 1, height: 109, layers: 1},
				values: rows,
			});
			const ledgerTexture = backend.uploadImmutableTexture({
				id: 'shader-ledger',
				valueKey: 'cache.sharedAltitudeLedger',
				storage: {format: 'RGBA32I', width: 48, height: 109, layers: 1},
				values: new Int32Array(48 * 109 * 4),
			});
			const cache = new DistantSunSharedCache(backend, {
				snapshot: {generation: 1, status: 'ready', sceneOrdinal: 0},
				bindings: [array.runtimeBinding, rowTexture.runtimeBinding, ledgerTexture.runtimeBinding],
			});
			const contribution = cache.createShaderContribution();
			const uniforms = {uGroup: {value: 0}};
			for (const declaration of contribution.uniforms)
				uniforms[declaration.name] = {value: declaration.defaultValue};
			const cacheUniforms = {};
			for (const declaration of contribution.textures)
				cacheUniforms[declaration.valueKey] = uniforms[declaration.name] = {value: null};
			backend.installRuntimeBindings({bindings: cache.getRuntimeBindings(), uniforms: cacheUniforms});
			const declarations = [...contribution.uniforms, ...contribution.textures]
				.map((item) => `uniform ${item.type} ${item.name};`)
				.join('\n');
			material = new THREE.RawShaderMaterial({
				glslVersion: THREE.GLSL3,
				uniforms,
				depthTest: false,
				depthWrite: false,
				vertexShader: 'in vec3 position; void main() { gl_Position = vec4(position, 1.0); }',
				fragmentShader: `precision highp float;
precision highp int;
precision highp sampler2DArray;
precision highp usampler2D;
precision highp isampler2D;
#define SPECTRAL_CHANNEL_COUNT 15
struct SpectralValue { float channels[15]; };
struct AtmosphereCoordinate { float altitude; };
struct CachePositionStencil { ivec2 indices; vec2 weights; };
CachePositionStencil resolveScatteringCachePositionStencil(AtmosphereCoordinate coordinate) {
 CachePositionStencil result; result.indices = ivec2(0); result.weights = vec2(1.0,0.0); return result;
}
vec3 directionToAtmosphericSource(vec3 position) { return vec3(0.0,0.0,1.0); }
${declarations}
uniform int uGroup;
out vec4 outputColor;
${contribution.functions[0].code}
void main() {
 AtmosphereCoordinate coordinate; coordinate.altitude = 0.0;
 SpectralValue value = sampleCumulativeScatteringDensity(vec3(0.0,0.0,6371000.0), coordinate, vec3(1.0,0.0,0.0));
 vec4 result = vec4(0.0);
 for (int component = 0; component < 4; component++) if (uGroup*4+component < 15) result[component] = value.channels[uGroup*4+component];
 outputColor = result;
}`,
			});
			const scene = new THREE.Scene();
			scene.add(new THREE.Mesh(geometry, material));
			const camera = new THREE.Camera();
			const pixels = new Float32Array(4);
			for (const ordinal of [0, 108]) {
				uniforms.uDistantSunSharedScene.value = ordinal;
				for (let group = 0; group < 4; group++) {
					uniforms.uGroup.value = group;
					renderer.setRenderTarget(target);
					renderer.render(scene, camera);
					renderer.readRenderTargetPixels(target, 0, 0, 1, 1, pixels);
					for (let component = 0; component < 4; component++) {
						const channel = group * 4 + component;
						expect(pixels[component]).toBe(channel < 15 ? 0.25 + channel / 32 : 0);
					}
				}
			}
			const programs = renderer.info.programs.length;
			uniforms.uDistantSunSharedDark.value = 1;
			cache.publish({snapshot: {generation: 2, status: 'dark', sceneOrdinal: null}, bindings: []});
			backend.installRuntimeBindings({bindings: cache.getRuntimeBindings(), uniforms: cacheUniforms});
			array.dispose();
			rowTexture.dispose();
			ledgerTexture.dispose();
			renderer.render(scene, camera);
			renderer.readRenderTargetPixels(target, 0, 0, 1, 1, pixels);
			expect(Array.from(pixels)).toEqual([0, 0, 0, 0]);
			expect(renderer.getContext().getError()).toBe(0);
			expect(renderer.info.programs.length).toBe(programs);
			cache.dispose();
		} finally {
			renderer.setRenderTarget(null);
			material?.dispose();
			geometry.dispose();
			target.dispose();
			backend.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	});
});
