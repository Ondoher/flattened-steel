import * as THREE from '../../../../../node_modules/three/build/three.module.js';
import {ThreeCacheBackend} from '../../three-cache-backend/ThreeCacheBackend.js';
import {ReceiverEnvironmentLightGpuReducer} from '../ReceiverEnvironmentLightGpuReducer.js';
import {ReceiverEnvironmentLightTransportSampler} from '../ReceiverEnvironmentLightTransportSampler.js';
import {LocalLightLevelCalculator} from '../LocalLightLevelCalculator.js';
import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from '../ReceiverEnvironmentLightQuadrature.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
	SpectralBasis,
	SpectralPacket,
} from '../../../spectral-values/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
} from '../../../sampling-domains/index.js';
import {GpuFieldExecutor} from '../../../gpu-cache-runtime/GpuFieldExecutor.js';
import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CachePassAssembler} from '../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {DistantSunLightSource} from '../../distant-sun/DistantSunLightSource.js';
import {SphericalEarthGeometry} from '../../spherical-earth/SphericalEarthGeometry.js';
import {
	createDefaultAuthorityOwners,
	createSealedAuthorityDomainSelection,
} from '../../local-sun/cache/_tests/local-sun-gpu-transport-authority.js';

function zeroAtmosphere() {
	return {
		createShaderContribution() {
			return ShaderContributions.createShaderContribution({
				id: 'atmosphere-receiver-environment-zero',
				owner: 'atmosphere',
				provides: ['atmosphere.sampleMedium'],
				requires: ['geometry.atmosphereCoordinateTypes'],
				functions: [
					ShaderContributions.createShaderSourceBlock(
						'atmosphere-receiver-environment-zero-sample',
						'sampleAtmosphere',
						0,
						'MediumSample sampleAtmosphere(AtmosphereCoordinate coordinate) { return MediumSample(zeroSpectral(), zeroSpectral(), zeroSpectral(), zeroSpectral()); }',
					),
				],
			});
		},
	};
}

async function constantCacheArtifact(backend, storage, value) {
	const field = {id: 'receiver-environment-manufactured-cache', storage};
	const module = CacheBuildModules.createBuildModule({
		id: 'receiver-environment-manufactured-cache-module',
		owner: 'cache',
		provides: ['manufactured.cache'],
		requires: [],
		bindings: [],
		blocks: [
			{
				id: 'receiver-environment-manufactured-cache-main',
				phase: 'main',
				order: 0,
				source: `a32CacheOutput = ${value};`,
			},
		],
	});
	const executor = new GpuFieldExecutor({backend, assembler: new CachePassAssembler()});
	const artifact = await executor.execute({
		fields: [field],
		passes: [
			{
				id: 'receiver-environment-manufactured-cache-pass',
				kind: 'seed',
				order: 1,
				inputs: [],
				output: field.id,
				modules: [module],
			},
		],
		result: field.id,
		valueKey: 'cache.cumulativeScatteringDensity',
	});
	executor.dispose();
	return artifact;
}

function transportModel({geometry, lightSource}) {
	return {
		geometry,
		lightSource,
		atmosphere: zeroAtmosphere(),
		groundBoundary: null,
		celestialSources: null,
		spectral: {basis: NATIVE_15_SPECTRAL_BASIS},
		profile: {numerical: {viewPath: {intervalCount: 16, sampleDistribution: null}}},
	};
}

function boundManufacturedCache(artifact) {
	return {
		getRuntimeBindings() {
			return artifact.runtimeBindings;
		},
		createShaderContribution() {
			return ShaderContributions.createShaderContribution({
				id: 'cache-receiver-environment-constant',
				owner: 'cache',
				provides: ['cache.sampleCumulativeScatteringDensity'],
				requires: ['geometry.atmosphereCoordinateTypes'],
				textures: [
					ShaderContributions.createShaderTextureDeclaration(
						'uCumulativeScatteringDensityCache',
						'sampler2DArray',
						'cache.cumulativeScatteringDensity',
					),
				],
				functions: [
					ShaderContributions.createShaderSourceBlock(
						'cache-receiver-environment-constant-sample',
						'sampleScatteringCache',
						0,
						'SpectralValue sampleCumulativeScatteringDensity(vec3 positionMeters, AtmosphereCoordinate atmosphereCoordinate, vec3 physicalOutgoingDirection) { SpectralValue value; for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) value.channels[channelIndex] = texelFetch(uCumulativeScatteringDensityCache, ivec3(0, 0, channelIndex), 0).r; return value; }',
					),
				],
			});
		},
	};
}

describe('Receiver environment-light GPU reduction', () => {
	it('matches the CPU irradiance reduction and restores backend ownership', async () => {
		const canvas = document.createElement('canvas');
		canvas.width = 2;
		canvas.height = 2;
		const context = canvas.getContext('webgl2', {antialias: false, depth: false, stencil: false});
		if (!context) throw new Error('Receiver environment-light GPU proof requires WebGL2.');
		const renderer = new THREE.WebGLRenderer({canvas, context});
		renderer.setSize(32, 1, false);
		const backend = new ThreeCacheBackend({THREE, renderer});
		const basis = new SpectralBasis({
			id: 'receiver-environment-gpu-555nm',
			semantics: SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE,
			channels: [
				{
					id: 'photopic-peak',
					center: {value: 555, units: 'nanometers'},
					width: {value: 1, units: 'nanometers'},
				},
			],
		});
		const radiances = RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.map(
			(_, index) =>
				new SpectralPacket({
					basis,
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values: [0.25 + index / 16],
					provenanceIdentity: `receiver-environment-gpu:${index}`,
				}),
		);
		const calculator = new LocalLightLevelCalculator();
		const cpu = calculator.measureEnvironmentIrradiance({
			samples: radiances.map((spectralRadiance, index) => ({
				spectralRadiance,
				irradianceWeightSteradians: RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE[index].irradianceWeightSteradians,
			})),
		});

		try {
			const gpu = await new ReceiverEnvironmentLightGpuReducer({backend}).reduce({radiances});
			expect(gpu.values[0]).toBeCloseTo(cpu.values[0], 5);
			expect(gpu.quantity).toBe(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY);
			expect(gpu.units).toBe(SPECTRAL_UNITS.IRRADIANCE_DENSITY);
		} finally {
			backend.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
			canvas.remove();
		}
	});
});

describe('Receiver environment-light GPU transport', () => {
	it('matches the zero-extinction constant-density CPU oracle for spherical/distant and Flat/local geometry', async () => {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('webgl2', {antialias: false, depth: false, stencil: false});
		if (!context) throw new Error('Receiver environment-light transport proof requires WebGL2.');
		const renderer = new THREE.WebGLRenderer({canvas, context});
		renderer.setSize(32, 1, false);
		const backend = new ThreeCacheBackend({THREE, renderer});
		const density = 1e-6;
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
		spherical.configureExecutionDomains({
			positions: NATIVE_48_POSITION_DOMAIN_OWNER,
			incomingDirections: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			outgoingDirections: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		});
		const localOwners = createDefaultAuthorityOwners();
		const localDomains = createSealedAuthorityDomainSelection(localOwners.geometry);
		localOwners.geometry.configureExecutionDomains({
			positions: localDomains.positionDomain,
			incomingDirections: localDomains.incomingDirectionDomain,
			outgoingDirections: localDomains.outgoingDirectionDomain,
		});
		const cases = [
			{geometry: spherical, lightSource: distant, storage: {format: 'R32F', width: 27, height: 48, layers: 15}},
			{
				geometry: localOwners.geometry,
				lightSource: localOwners.lightSource,
				storage: {format: 'R32F', width: 27, height: 285, layers: 15},
			},
		];
		try {
			for (const entry of cases) {
				const artifact = await constantCacheArtifact(backend, entry.storage, density);
				const cache = boundManufacturedCache(artifact);
				try {
					const resident = await backend.readRuntimeBindingField(artifact.runtimeBindings.bindings[0]);
					expect(resident.values[0]).toBeCloseTo(density, 8);
					const radiances = await new ReceiverEnvironmentLightTransportSampler({
						THREE,
						renderer,
						backend,
						model: transportModel(entry),
						scatteringCache: cache,
					}).sample();
					expect(radiances).toHaveSize(32);
					for (const [index, radiance] of radiances.entries()) {
						const local = RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE[index].directionLocal;
						const direction = entry.geometry.mapObserverLocalSceneDirectionToModelDirection([
							local[0],
							local[2],
							local[1],
						]);
						const segment = entry.geometry.resolveViewRaySegment({direction});
						const expected = (segment.endDistance.value - segment.startDistance.value) * density;
						expect(radiance.values[0])
							.withContext(`case ${entry.geometry.constructor.name}, direction ${index}`)
							.toBeCloseTo(expected, 3);
					}
				} finally {
					artifact.dispose();
				}
			}
		} finally {
			backend.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
			canvas.remove();
		}
	});
});
