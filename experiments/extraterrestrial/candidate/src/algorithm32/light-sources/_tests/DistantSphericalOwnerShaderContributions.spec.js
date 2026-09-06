import { CanonicalAtmosphere } from '../../atmospheres/CanonicalAtmosphere.js';
import { BrunetonColorDisplayModel } from '../../color/BrunetonColorDisplayModel.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../../constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../../geometries/SphericalEarthGeometry.js';
import { ShaderBuilder } from '../../implementation/ShaderBuilder.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../profiles/index.js';
import { scaleSpectralPacket } from '../../quantities/index.js';
import { Algorithm32ShaderAssembler } from '../../shader/Algorithm32ShaderAssembler.js';
import { Algorithm32Transport } from '../../transport/Algorithm32Transport.js';
import { DistantSunCache } from '../DistantSunCache.js';
import { DistantSunLightSource } from '../DistantSunLightSource.js';

describe('distant spherical owner shader contributions', () => {
	it('keeps source radiometry in cache construction and contributes only direction at runtime', () => {
		const descriptor = createDescriptor();
		const baseline = createDistantSource().createShaderContribution({ descriptor });
		const brighter = createDistantSource({
			sourceIrradiance: scaleSpectralPacket(
				NATIVE_SOURCE_IRRADIANCE_DENSITY,
				2,
			),
		}).createShaderContribution({ descriptor });

		expect(baseline.provides).toEqual(['light.directionToAtmosphericSource']);
		expect(baseline.requires).toEqual([]);
		expect(baseline.mainHooks).toEqual([]);
		expect(baseline.functions).toEqual(brighter.functions);
		expect(shaderCode(baseline)).toContain(
			'vec3 directionToAtmosphericSource(vec3 positionMeters)',
		);
		expect(shaderCode(baseline)).not.toContain('IRRADIANCE');
		expect(shaderCode(baseline)).not.toContain('sourcePathTransmittance');
	});

	it('declares the complete cumulative-cache runtime symbol set', () => {
		expect(new Algorithm32Transport().mainRequiredShaderSymbols()).toEqual([
			'runtime.initialState',
			'geometry.reconstructViewRay',
			'geometry.resolveAtmospherePath',
			'atmosphere.sampleMedium',
			'cache.sampleCumulativeScatteringDensity',
			'transport.evaluatePathRadiance',
			'color.composeSceneColor',
			'color.encodeOutput',
		]);
	});

	it('creates the five owners for the distant spherical cumulative-cache path', () => {
		const contributions = createOwnerContributions(createDescriptor());

		expect(contributions.map((contribution) => contribution.id)).toEqual([
			'geometry-spherical-earth',
			'atmosphere-canonical',
			'light-distant-sun',
			'cache-distant-sun-cumulative-scattering',
			'transport-algorithm32-cumulative-cache',
		]);
		expect(contributions[0].provides).toEqual([
			'geometry.reconstructViewRay',
			'geometry.resolveAtmospherePath',
			'geometry.atmosphereCoordinateTypes',
			'geometry.resolveAtmosphereCoordinate',
			'geometry.scatteringCacheStencilTypes',
			'geometry.resolveScatteringCachePositionStencil',
			'geometry.resolveScatteringCacheDirectionStencil',
		]);
		expect(contributions[0].requires).toContain(
			'light.directionToAtmosphericSource',
		);
		expect(contributions[2].uniforms[0]).toEqual({
			name: 'uDistantSunDirection',
			type: 'vec3',
			valueKey: 'lightSource.direction',
			defaultValue: [0, 1, 0],
		});
		expect(contributions[3].textures[0]).toEqual({
			name: 'uCumulativeScatteringDensityCache',
			type: 'sampler2DArray',
			valueKey: 'cache.cumulativeScatteringDensity',
		});
		expect(contributions[4].requires).toEqual([
			'atmosphere.sampleMedium',
			'geometry.resolveAtmosphereCoordinate',
			'geometry.resolveScatteringCachePositionStencil',
			'geometry.resolveScatteringCacheDirectionStencil',
			'cache.sampleCumulativeScatteringDensity',
		]);
	});

	it('exposes no incident-cache policy or runtime strategy from the source', () => {
		const source = createDistantSource();
		const description = source.describe();
		const contribution = source.createShaderContribution({
			descriptor: createDescriptor(description),
		});

		expect(description.incidentRadianceCachePolicy).toBeUndefined();
		expect(contribution.provides).toEqual([
			'light.directionToAtmosphericSource',
		]);
		expect(contribution.functions[0].slot).toBe('sampleLightSource');
	});

	it('assembles Native-48, W27, cumulative sampling, and transport into one shader', () => {
		const descriptor = createDescriptor();
		const transport = new Algorithm32Transport();
		const assembly = new Algorithm32ShaderAssembler().assemble({
			descriptor,
			contributions: [
				createRuntimeContribution(descriptor),
				...createOwnerContributions(descriptor),
				new BrunetonColorDisplayModel().createShaderContribution({ descriptor }),
			],
			mainRequiredSymbols: transport.mainRequiredShaderSymbols(),
			systemProvidedSymbols: [],
		});

		expect(assembly.status).toBe('accepted');
		expect(assembly.fragmentShaderSource).toContain(
			'precision highp sampler2DArray;',
		);
		expect(assembly.fragmentShaderSource).toContain(
			'uniform sampler2DArray uCumulativeScatteringDensityCache;',
		);
		expect(assembly.fragmentShaderSource).toContain(
			'const int GEOMETRY_CACHE_POSITION_COUNT = 48;',
		);
		expect(assembly.fragmentShaderSource).toContain(
			'CacheDirectionStencil resolveScatteringCacheDirectionStencil(',
		);
		expect(assembly.fragmentShaderSource).toContain(
			'SpectralValue sampleCumulativeScatteringDensity(',
		);
		expect(assembly.fragmentShaderSource).toContain(
			'sampleCumulativeScatteringDensity(\n\t\t\tpositionStencil,\n\t\t\tdirectionStencil',
		);
		expect(assembly.fragmentShaderSource).toContain(
			'MediumSample medium = sampleAtmosphere(atmosphereCoordinate);',
		);
		expect(assembly.fragmentShaderSource).not.toContain('incidentRadiance');
		expect(assembly.fragmentShaderSource).not.toContain('CACHE_INCIDENT');
		expect(assembly.bindingRequirements.map((binding) => binding.id)).toEqual([
			'cache.cumulative-scattering-density',
			'geometry.camera-ground-relative-position',
			'runtime.depth-texture',
			'runtime.scene-color-texture',
			'runtime.scene-hit-texture',
			'runtime.viewport-size',
		]);
	});

	it('uses the configured geometry owner without descriptor-driven switching', () => {
		const geometry = createSphericalGeometry();
		const contribution = geometry.createShaderContribution({
			descriptor: createDescriptor(null, {
				geometry: { kind: 'flat-earth-geometry' },
			}),
		});

		expect(contribution.id).toBe('geometry-spherical-earth');
		expect(shaderCode(contribution)).toContain(
			'const float GEOMETRY_BOTTOM_RADIUS_METERS = 6360000.0;',
		);
	});
});

function createOwnerContributions(descriptor) {
	const geometry = createSphericalGeometry();
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const source = createDistantSource();
	const cache = createGpuCache();
	const transport = new Algorithm32Transport();

	return [
		geometry.createShaderContribution({ descriptor }),
		atmosphere.createShaderContribution({ descriptor }),
		source.createShaderContribution({ descriptor }),
		cache.createShaderContribution({ descriptor }),
		transport.createShaderContribution({ descriptor }),
	];
}

function createGpuCache() {
	return new DistantSunCache(/** @type {CacheBuildArtifact} */ (/** @type {unknown} */ ({
		descriptor: { id: 'owner-contribution-cache' },
		runtimeBindings: {
			backendId: 'owner-contribution-backend',
			bindings: [{
				id: 'owner-contribution-binding',
				valueKey: 'cache.cumulativeScatteringDensity',
				descriptor: { id: 'owner-contribution-field' },
				backendId: 'owner-contribution-backend',
			}],
		},
		dispose() {},
	})));
}

function createRuntimeContribution(descriptor) {
	return new ShaderBuilder({
		model: {
			version: 0,
			spectral: { basis: NATIVE_15_SPECTRAL_BASIS },
		},
	})._createRuntimeShaderContribution(descriptor);
}

function createSphericalGeometry() {
	return new SphericalEarthGeometry({
		bottomRadius: distance(6360000),
		topRadius: distance(6420000),
		observerHeight: distance(2),
		observerUpDirection: [1, 0, 0],
		directionToSource: [0, 1, 0],
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: distance(2),
		sourceTransmittanceIntervalCount: 20,
	});
}

function createDistantSource(overrides = {}) {
	return new DistantSunLightSource({
		directionToLight: [0, 1, 0],
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: { value: 0.004675, units: 'radians' },
		...overrides,
	});
}

function createDescriptor(lightFacts = null, overrides = {}) {
	const geometryFacts = overrides.geometry ?? {
		kind: 'spherical-earth-geometry',
		bottomRadius: distance(6360000),
		topRadius: distance(6420000),
		observerHeight: distance(2),
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: distance(2),
		sourceTransmittanceIntervalCount: 20,
		sceneFrame: {
			kind: 'observer-local',
			up: [1, 0, 0],
			right: [0, 1, 0],
			forward: [0, 0, -1],
		},
	};
	const sourceFacts = lightFacts ?? {
		kind: 'distant-sun-light-source',
		directionToLight: [0, 1, 0],
	};

	return {
		descriptorId: 'descriptor',
		variantId: 'variant',
		fingerprint: 'descriptor',
		compatibilityTags: [],
		spectralBasis: createSection('basis', { channelCount: 15 }),
		geometry: createSection('geometry', geometryFacts),
		atmosphere: createSection('atmosphere', {
			kind: 'canonical-atmosphere',
			constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		}),
		lightSource: createSection('light-source', sourceFacts),
		cache: createSection('cache', {
			kind: 'scattering-cache',
			fieldQuantity: 'spectral-scattering-density',
		}),
		transport: createSection('transport', {
			execution: { pathIntervalCount: 15 },
		}),
		color: createSection('color', {}),
		runtime: createSection('runtime', {}),
	};
}

function createSection(fingerprint, facts) {
	return {
		descriptorId: fingerprint,
		fingerprint,
		compatibilityTags: [fingerprint],
		facts,
	};
}

function shaderCode(contribution) {
	return contribution.functions.map((block) => block.code).join('\n');
}

function distance(value) {
	return { value, units: 'meters' };
}
