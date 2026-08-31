import * as THREE from '../../../../../../node_modules/three/build/three.module.js';
import {NATIVE_48_POSITION_DOMAIN_OWNER} from '../../../../sampling-domains/position/spherical-native/consts.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/direction/cubed-sphere/consts.js';
import {SOLAR_ZENITH_180_DOMAIN_OWNER} from '../../../../sampling-domains/solar-zenith/consts.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../../profiles/native-15/native-15-profile.js';
import DistantSunSceneCache from '../DistantSunSceneCache.js';
import DistantSunSceneCacheLedger from '../DistantSunSceneCacheLedger.js';

function createLedger() {
	return new DistantSunSceneCacheLedger({
		sceneSun: {
			id: 'san-jose-nautical-twilight',
			instant: '2024-06-21T04:26:03.503Z',
			directionToSourceUpEastNorth: [-0.16946677586889025, -0.7579900644516986, 0.6298667113517853],
			sourceIdentity: 'algorithm32-native-distant-collimated-sun-v1',
		},
		support: {
			id: 'san-jose-fixed-observer-complete-rotation-v1',
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			observerAltitude: {value: 1.7, units: 'meters'},
			observerSolarZenith: {value: (99.75863153048778 * Math.PI) / 180, units: 'radians'},
			completeCameraRotation: true,
			arbitraryShortenedEndpoint: true,
		},
		positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
		solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
		outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
}

function texture(id, storage, valueKey) {
	return {
		id,
		storage,
		backendId: 'compile-proof',
		runtimeBinding: {id: `${id}:binding`, valueKey, fieldId: id, backendId: 'compile-proof'},
		dispose() {},
	};
}

describe('Distant-Sun point-local scene-cache shader', () => {
	it('compiles the complete ledger and exact-seam lookup on WebGL2', async () => {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('webgl2', {antialias: false, depth: false, stencil: false});
		if (!context) throw new Error('Point-local scene-cache proof requires WebGL2.');
		const renderer = new THREE.WebGLRenderer({canvas, context});
		const ledger = createLedger();
		const cache = new DistantSunSceneCache({
			manifest: {
				record: {
					cacheIdentity: 'compile-proof',
					exactSeamPayload: {byteLength: 150_227_160},
					logicalToUniqueIndex: {byteLength: 8_748},
				},
				requireCacheIdentity() {},
			},
			ledger,
			cumulativeTexture: texture(
				'values',
				{format: 'RGBA32F', width: 648, height: 27, layers: ledger.retainedBlockCount},
				'cache.sceneCumulativeScatteringDensity',
			),
			directionIndexTexture: texture(
				'index',
				{format: 'R16UI', width: 4374, height: 1, layers: 1},
				'cache.sceneLogicalToUniqueDirection',
			),
		});
		const lookup = cache.createShaderContribution().functions[0].code;
		const material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3,
			vertexShader: 'in vec3 position; void main() { gl_Position = vec4(position, 1.0); }',
			fragmentShader: `precision highp float;
precision highp int;
const int SPECTRAL_CHANNEL_COUNT = 15;
struct SpectralValue { float channels[15]; };
struct AtmosphereCoordinate { float altitudeMeters; };
struct CachePositionStencil { ivec2 indices; vec2 weights; };
struct CacheDirectionStencil { ivec4 indices; vec4 weights; };
uniform highp sampler2DArray uDistantSunSceneCumulativeCache;
uniform highp usampler2D uDistantSunLogicalToUniqueDirection;
CachePositionStencil resolveScatteringCachePositionStencil(AtmosphereCoordinate coordinate) {
	return CachePositionStencil(ivec2(0), vec2(1.0, 0.0));
}
vec3 directionToAtmosphericSource(vec3 positionMeters) { return normalize(vec3(-0.2, -0.75, 0.63)); }
${lookup}
layout(location = 0) out vec4 outputColor;
void main() {
	SpectralValue value = sampleCumulativeScatteringDensity(
		vec3(6360001.7, 0.0, 0.0), AtmosphereCoordinate(1.7), vec3(0.0, 1.0, 0.0)
	);
	outputColor = vec4(value.channels[0]);
}`,
		});
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
		);
		const mesh = new THREE.Mesh(geometry, material);
		const scene = new THREE.Scene();
		scene.add(mesh);

		try {
			await renderer.compileAsync(scene, new THREE.Camera());
			expect(context.getError()).toBe(context.NO_ERROR);
		} finally {
			cache.dispose();
			geometry.dispose();
			material.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
			canvas.remove();
		}
	});
});
