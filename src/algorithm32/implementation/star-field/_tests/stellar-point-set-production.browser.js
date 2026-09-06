import * as THREE from '../../../../../node_modules/three/build/three.module.js';

import {
	CanonicalAtmosphere,
	DistantSunLightSource,
	SphericalEarthGeometry,
	StellarPointSetSource,
	ThreeCacheBackend,
} from '../../index.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../canonical-atmosphere/consts.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../../distant-sun/cache/consts.js';
import {createNativeExecutionProfile} from '../../../profiles/native-15/native-15-profile.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {Algorithm32ShaderAssembler} from '../../../shader-assembly/runtime/Algorithm32ShaderAssembler.js';
import {SharedModel} from '../../algorithm32/model/SharedModel.js';

const OBSERVATION = {
	instant: '2026-08-17T04:00:00.000Z',
	location: {latitude: {value: 37.3382, units: 'degrees'}, longitude: {value: -121.8863, units: 'degrees'}},
};

function createRenderer() {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false});
	if (!context || !context.getExtension('EXT_color_buffer_float'))
		throw new Error('Stellar production qualification requires WebGL2 R32F support.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.debug.checkShaderErrors = true;
	renderer.setSize(8, 8, false);
	return {renderer, context};
}

function createFixture() {
	const atmosphere = new CanonicalAtmosphere({constants: CANONICAL_ATMOSPHERE_CONSTANTS});
	const sun = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
	const stars = new StellarPointSetSource();
	const domains = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: {value: 10, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		cacheAltitudeBinCount: domains.positionDomain.nodes.length,
		cacheBoundaryAltitude: domains.positionDomain.nodes.at(-1).coordinate,
		sourceTransmittanceIntervalCount: 20,
	});
	geometry.configureLightSource({
		lightSource: sun,
		observation: OBSERVATION,
		placement: {kind: 'distant-direction', directionToLight: [0, 1, 0]},
	});
	const roster = /** @type {SphericalSunStarsSourceRoster} */ ({
		id: 'stellar-production-browser-roster',
		family: 'spherical-sun-stars-radial-v1',
		sun,
		stars,
	});
	const profile = createNativeExecutionProfile({
		lightSource: sun,
		atmosphere,
		geometry,
		groundBoundary: null,
		observation: OBSERVATION,
		celestialSources: roster,
		domains: {
			positions: domains.positionDomain,
			incomingDirections: domains.incomingDirectionDomain,
			outgoingDirections: domains.outgoingDirectionDomain,
		},
		execution: {sourceTransmittanceIntervalCount: 20, maximumScatteringOrder: 1},
	});
	const model = new SharedModel({version: 1, profile});
	const placements = geometry.resolveCelestialPlacements({roster, observation: OBSERVATION});
	return {model, stars, placement: placements[1], query: geometry.createCelestialQueryPacket(roster, placements)};
}

function createSupportContributions() {
	const runtime = ShaderContributions.createShaderContribution({
		id: 'runtime-stellar-production-proof',
		owner: 'runtime',
		provides: ['runtime.initialState', 'runtime.sceneHitTexture'],
		defines: ['#define SPECTRAL_CHANNEL_COUNT 15'],
		uniforms: [
			ShaderContributions.createShaderUniformDeclaration('uViewportSizePixels', 'vec2', 'runtime.viewportSize'),
		],
		functions: [
			ShaderContributions.createShaderSourceBlock(
				'stellar-proof-types',
				'declareTypes',
				0,
				`struct SpectralValue { float channels[SPECTRAL_CHANNEL_COUNT]; };
struct ViewRay { vec3 originMeters; vec3 direction; };
struct ShaderState { vec2 textureCoordinates; float sceneHitMask; ViewRay ray; };`,
			),
			ShaderContributions.createShaderSourceBlock(
				'stellar-proof-zero',
				'declareHelpers',
				0,
				`SpectralValue zeroSpectral() {
	SpectralValue value;
	for (int index = 0; index < SPECTRAL_CHANNEL_COUNT; index += 1) value.channels[index] = 0.0;
	return value;
}
ShaderState createInitialShaderState(vec2 uv) {
	ShaderState state;
	state.textureCoordinates = uv;
	state.sceneHitMask = 0.0;
	state.ray = ViewRay(vec3(0.0), normalize(vec3(uv * 2.0 - 1.0, 1.0)));
	return state;
}`,
			),
		],
	});
	const geometry = ShaderContributions.createShaderContribution({
		id: 'geometry-stellar-production-proof',
		owner: 'geometry',
		provides: [
			'geometry.celestialCacheStencilTypes',
			'geometry.reconstructViewRay',
			'geometry.resolveStellarPointSetCacheStencil',
		],
		functions: [
			ShaderContributions.createShaderSourceBlock(
				'stellar-proof-stencil',
				'declareTypes',
				1,
				'struct CelestialCacheBilinearStencil { ivec2 receiverIndices; vec2 receiverWeights; ivec2 directionIndices; vec2 directionWeights; bool valid; };',
			),
			ShaderContributions.createShaderSourceBlock(
				'stellar-proof-ray',
				'reconstructRay',
				0,
				'ViewRay reconstructViewRay(vec2 uv) { return ViewRay(vec3(0.0), normalize(vec3(uv * 2.0 - 1.0, 1.0))); }',
			),
			ShaderContributions.createShaderSourceBlock(
				'stellar-proof-query',
				'sampleCelestialCache',
				0,
				'CelestialCacheBilinearStencil resolveStellarPointSetCacheStencil(vec3 directionToSource) { return CelestialCacheBilinearStencil(ivec2(0), vec2(1.0, 0.0), ivec2(0), vec2(1.0, 0.0), directionToSource.z > -2.0); }',
			),
		],
	});
	const sun = ShaderContributions.createShaderContribution({
		id: 'celestial-sun-production-proof',
		owner: 'celestialCache',
		provides: ['celestial.evaluateRadiance'],
		mainHooks: [
			ShaderContributions.createShaderSourceBlock(
				'stellar-proof-celestial-init',
				'evaluateCelestialRadiance',
				0,
				'SpectralValue celestialRadiance = zeroSpectral();',
			),
		],
	});
	const color = ShaderContributions.createShaderContribution({
		id: 'color-stellar-production-proof',
		owner: 'color',
		provides: ['color.encodeOutput'],
		requires: ['celestial.evaluateStellarPointSetRadiance'],
		mainHooks: [
			ShaderContributions.createShaderSourceBlock(
				'stellar-proof-output',
				'encodeOutput',
				0,
				'outColor = vec4(celestialRadiance.channels[0], celestialRadiance.channels[1], celestialRadiance.channels[2], 1.0);',
			),
		],
	});
	return {runtime, geometry, sun, color};
}

describe('Stellar point-set production WebGL path', () => {
	it('constructs, binds, assembles, and compiles the fixed 500-member live shader', async () => {
		const {renderer, context} = createRenderer();
		const backend = new ThreeCacheBackend({THREE, renderer});
		const fixture = createFixture();
		const controller = fixture.stars.createStellarPointSetCacheController({model: fixture.model, backend});
		let material = null;
		let plane = null;
		let target = null;
		try {
			const resource = await controller.build({placement: fixture.placement, query: fixture.query});
			const support = createSupportContributions();
			const assembly = new Algorithm32ShaderAssembler().assemble({
				contributions: [
					support.runtime,
					support.geometry,
					resource.createShaderContribution(),
					support.sun,
					resource.createLiveShaderContribution({queryPacket: fixture.query}),
					support.color,
				],
				mainRequiredSymbols: [
					'runtime.initialState',
					'celestial.evaluateStellarPointSetRadiance',
					'color.encodeOutput',
				],
			});
			const uniforms = {
				uViewportSizePixels: {value: new THREE.Vector2(8, 8)},
				uStellarPointMemberCount: {value: resource.memberCount},
				uStellarPointSetTransportCache: {value: null},
			};
			backend.installRuntimeBindings({
				bindings: resource.getRuntimeBindings(),
				uniforms: {'cache.celestial.starTransport': uniforms.uStellarPointSetTransportCache},
			});
			material = new THREE.RawShaderMaterial({
				glslVersion: THREE.GLSL3,
				vertexShader: `precision highp float;
in vec3 position;
out vec2 screenTextureCoordinates;
void main() { screenTextureCoordinates = position.xy * 0.5 + 0.5; gl_Position = vec4(position, 1.0); }`,
				fragmentShader: assembly.fragmentShaderSource.replace(/^#version\s+300\s+es\s*\n/u, ''),
				uniforms,
			});
			plane = new THREE.PlaneGeometry(2, 2);
			const scene = new THREE.Scene();
			scene.add(new THREE.Mesh(plane, material));
			const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
			target = new THREE.WebGLRenderTarget(8, 8, {depthBuffer: false, stencilBuffer: false});
			renderer.setRenderTarget(target);
			await renderer.compileAsync(scene, camera);
			renderer.render(scene, camera);
			expect(assembly.fragmentShaderSource).toContain('stellarPointSetDirection(memberIndex)');
			expect(uniforms.uStellarPointSetTransportCache.value).not.toBeNull();
			expect(context.getError()).toBe(context.NO_ERROR);
		} finally {
			renderer.setRenderTarget(null);
			target?.dispose();
			plane?.dispose();
			material?.dispose();
			controller.dispose();
			backend.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	});
});
