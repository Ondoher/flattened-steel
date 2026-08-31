import {ReceiverEnvironmentLightTransportCpuSampler} from '../ReceiverEnvironmentLightTransportCpuSampler.js';
import {ReceiverEnvironmentLightTransportShader} from '../ReceiverEnvironmentLightTransportShader.js';
import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from '../ReceiverEnvironmentLightQuadrature.js';
import {CanonicalAtmosphere} from '../../canonical-atmosphere/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../canonical-atmosphere/consts.js';
import {DistantSunLightSource} from '../../distant-sun/DistantSunLightSource.js';
import {createDistantSunSceneCacheFixture} from '../../distant-sun/cache/_tests/create-distant-sun-scene-cache-fixture.js';
import {SphericalEarthGeometry} from '../../spherical-earth/SphericalEarthGeometry.js';
import {LocalSunCache} from '../../local-sun/cache/LocalSunCache.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {createDefaultAuthorityOwners} from '../../local-sun/cache/_tests/local-sun-gpu-transport-authority.js';

function artifact(id) {
	return {
		runtimeBindings: {
			backendId: 'test',
			bindings: [{id, valueKey: 'cache.cumulativeScatteringDensity', fieldId: id, backendId: 'test'}],
		},
		dispose() {},
	};
}

function model(owners) {
	return {
		...owners,
		groundBoundary: null,
		spectral: {basis: NATIVE_15_SPECTRAL_BASIS},
		profile: {numerical: {viewPath: {intervalCount: 4, sampleDistribution: null}}},
	};
}

describe('Receiver environment-light common transport', () => {
	it('maps the canonical local directions through geometry before invoking the CPU oracle', () => {
		const calls = [];
		const reference = {
			model: {
				geometry: {
					mapObserverLocalSceneDirectionToModelDirection(direction) {
						return [direction[1], direction[2], direction[0]];
					},
				},
			},
			evaluate(request) {
				calls.push(request.viewRay.direction);
				return {pathRadiance: {direction: request.viewRay.direction}};
			},
		};
		const result = new ReceiverEnvironmentLightTransportCpuSampler({reference}).sample();
		expect(result).toHaveSize(32);
		expect(calls).toHaveSize(32);
		expect(calls[0]).toEqual([
			RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE[0].directionLocal[2],
			RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE[0].directionLocal[1],
			RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE[0].directionLocal[0],
		]);
	});

	it('replaces only camera reconstruction while preserving geometry-owned path and stencil code', () => {
		const base = {
			id: 'geometry-test',
			requires: [
				'runtime.initialState',
				'runtime.depthTexture',
				'runtime.sceneHitTexture',
				'light.directionToAtmosphericSource',
			],
			functions: [
				{id: 'geometry-reconstruct-helper', slot: 'reconstructRay', order: 0, code: 'camera reconstruction'},
				{id: 'geometry-path-helper', slot: 'resolvePathBounds', order: 0, code: 'geometry path'},
				{id: 'geometry-stencil-helper', slot: 'sampleScatteringCache', order: 0, code: 'geometry stencils'},
			],
		};
		const contribution = new ReceiverEnvironmentLightTransportShader()._geometryContribution(base);
		expect(contribution.requires).toEqual(['runtime.initialState', 'light.directionToAtmosphericSource']);
		expect(contribution.functions[0].code).toContain('texelFetch(uReceiverEnvironmentDirections');
		expect(contribution.functions[1]).toBe(base.functions[1]);
		expect(contribution.functions[2]).toBe(base.functions[2]);
	});

	it('assembles the same common transport for production-shaped spherical/distant and Flat/local owners', () => {
		const atmosphere = new CanonicalAtmosphere({constants: CANONICAL_ATMOSPHERE_CONSTANTS});
		const distant = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
		const spherical = new SphericalEarthGeometry({
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			observerHeight: {value: 2, units: 'meters'},
			observerUpDirection: [1, 0, 0],
			cacheAltitudeBinCount: 48,
			cacheBoundaryAltitude: {value: 2, units: 'meters'},
			sourceTransmittanceIntervalCount: 4,
		});
		spherical.configureLightSource({
			lightSource: distant,
			observation: {
				instant: '2026-03-20T12:00:00.000Z',
				location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: -90, units: 'degrees'}},
			},
		});
		const sphericalAssembly = new ReceiverEnvironmentLightTransportShader().create({
			model: model({geometry: spherical, atmosphere, lightSource: distant}),
			scatteringCache: createDistantSunSceneCacheFixture(),
		});

		const localOwners = createDefaultAuthorityOwners();
		const localAssembly = new ReceiverEnvironmentLightTransportShader().create({
			model: model(localOwners),
			scatteringCache: new LocalSunCache(artifact('local-field'), {
				construction: {value: 0, units: 'bytes'},
				resident: {value: 0, units: 'bytes'},
			}),
		});

		for (const assembly of [sphericalAssembly, localAssembly]) {
			expect(assembly.fragmentShaderSource).toContain('void evaluatePathRadiance(inout ShaderState state)');
			expect(assembly.fragmentShaderSource).toContain('texelFetch(uReceiverEnvironmentDirections');
			expect(assembly.fragmentShaderSource).toContain(
				'state.pathRadiance.channels[uReceiverEnvironmentOutputChannel]',
			);
		}
		expect(sphericalAssembly.fragmentShaderSource).toContain('ivec2 indices;');
		expect(localAssembly.fragmentShaderSource).toContain('ivec4 indices;');
	});
});
