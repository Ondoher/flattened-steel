import {
	BrunetonColorDisplayModel,
	CanonicalAtmosphere,
	DistantSunLightSource,
	SphericalEarthGeometry,
} from '../../../implementation/index.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../implementation/canonical-atmosphere/consts.js';
import {ShaderAssemblyPreparer} from '../../../rendering-runtime/ShaderAssemblyPreparer.js';
import DistantSunSceneCache from '../../../implementation/distant-sun/cache/DistantSunSceneCache.js';
import DistantSunSceneCacheLedger from '../../../implementation/distant-sun/cache/DistantSunSceneCacheLedger.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../sampling-domains/index.js';
import {Algorithm32Transport} from '../../../atmospheric-transport/Algorithm32Transport.js';
import {Algorithm32ShaderAssembler} from '../Algorithm32ShaderAssembler.js';

describe('distant spherical owner shader contributions', /** Called by Jasmine to register the named test suite. */ () => {
	it('keeps source radiometry in cache construction and contributes only direction at runtime', /** Called by Jasmine to exercise the named behavior. */ () => {
		const baseline = createDistantSource().createShaderContribution();
		expect(baseline.provides).toEqual(['light.directionToAtmosphericSource']);
		expect(baseline.requires).toEqual([]);
		expect(baseline.mainHooks).toEqual([]);
		expect(shaderCode(baseline)).toContain('vec3 directionToAtmosphericSource(vec3 positionMeters)');
		expect(shaderCode(baseline)).not.toContain('IRRADIANCE');
		expect(shaderCode(baseline)).not.toContain('sourcePathTransmittance');
	});

	it('declares the complete cumulative-cache runtime symbol set', /** Called by Jasmine to exercise the named behavior. */ () => {
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

	it('creates the five owners for the distant spherical cumulative-cache path', /** Called by Jasmine to exercise the named behavior. */ () => {
		const contributions = createOwnerContributions();

		expect(
			contributions.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param contribution - The contribution value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (contribution) => contribution.id,
			),
		).toEqual([
			'geometry-spherical-earth',
			'atmosphere-canonical',
			'light-distant-sun',
			'cache-distant-sun-point-local-scene',
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
		expect(contributions[0].requires).toContain('light.directionToAtmosphericSource');
		expect(contributions[2].uniforms[0]).toEqual(
			jasmine.objectContaining({
				name: 'uDistantSunDirection',
				type: 'vec3',
				valueKey: 'lightSource.direction',
			}),
		);
		expect(Math.hypot(...contributions[2].uniforms[0].defaultValue)).toBeCloseTo(1, 12);
		expect(contributions[3].textures[0]).toEqual({
			name: 'uDistantSunSceneCumulativeCache',
			type: 'sampler2DArray',
			valueKey: 'cache.sceneCumulativeScatteringDensity',
		});
		expect(contributions[3].textures[1].type).toBe('usampler2D');
		expect(contributions[4].requires).toEqual([
			'atmosphere.sampleMedium',
			'geometry.resolveAtmosphereCoordinate',
			'cache.sampleCumulativeScatteringDensity',
		]);
	});

	it('contributes no incident-cache policy or runtime strategy from the source', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const contribution = source.createShaderContribution();

		expect(contribution.provides).toEqual(['light.directionToAtmosphericSource']);
		expect(contribution.functions[0].slot).toBe('sampleLightSource');
	});

	it('assembles Native-48, W27, cumulative sampling, and transport into one shader', /** Called by Jasmine to exercise the named behavior. */ () => {
		const transport = new Algorithm32Transport();
		const model = /** @type {Algorithm32ExecutionModel} */ (
			/** @type {unknown} */ ({
				version: 0,
				spectral: {basis: NATIVE_15_SPECTRAL_BASIS},
				profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}},
			})
		);
		const assembly = new ShaderAssemblyPreparer({
			model,
			assembler: new Algorithm32ShaderAssembler(),
			transport,
		}).assembleIfRequested({
			setup: /** @type {ShaderSetupRequest} */ ({}),
			contributions: [
				...createOwnerContributions(),
				new BrunetonColorDisplayModel().createShaderContribution({model}),
			],
			mainRequiredSymbols: transport.mainRequiredShaderSymbols(),
			systemProvidedSymbols: [],
		});

		expect(assembly.status).toBe('accepted');
		expect(assembly.fragmentShaderSource).toContain('precision highp sampler2DArray;');
		expect(assembly.fragmentShaderSource).toContain('uniform sampler2DArray uDistantSunSceneCumulativeCache;');
		expect(assembly.fragmentShaderSource).toContain('uniform usampler2D uDistantSunLogicalToUniqueDirection;');
		expect(assembly.fragmentShaderSource).toContain('const int GEOMETRY_CACHE_POSITION_COUNT = 48;');
		expect(assembly.fragmentShaderSource).toContain(
			'CacheDirectionStencil resolveScatteringCacheDirectionStencil(',
		);
		expect(assembly.fragmentShaderSource).toContain('SpectralValue sampleCumulativeScatteringDensity(');
		expect(assembly.fragmentShaderSource).toContain(
			'sampleCumulativeScatteringDensity(\n\t\t\tpositionMeters,\n\t\t\tatmosphereCoordinate,\n\t\t\tstate.ray.direction',
		);
		expect(assembly.fragmentShaderSource).toContain(
			'MediumSample medium = sampleAtmosphere(atmosphereCoordinate);',
		);
		expect(assembly.fragmentShaderSource).not.toContain('incidentRadiance');
		expect(assembly.fragmentShaderSource).not.toContain('CACHE_INCIDENT');
		expect(
			assembly.bindingRequirements.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param binding - The binding value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (binding) => binding.id,
			),
		).toEqual([
			'cache.distant-scene-cumulative',
			'cache.distant-scene-direction-index',
			'geometry.camera-ground-relative-position',
			'runtime.depth-texture',
			'runtime.scene-color-texture',
			'runtime.scene-hit-texture',
			'runtime.viewport-size',
		]);
	});

	it('uses the configured geometry owner directly', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createSphericalGeometry();
		const contribution = geometry.createShaderContribution();

		expect(contribution.id).toBe('geometry-spherical-earth');
		expect(shaderCode(contribution)).toContain('const float GEOMETRY_BOTTOM_RADIUS_METERS = 6360000.0;');
	});
});

/**
 * Called by this module to create owner contributions.
 * @returns - The result produced by the operation.
 */
function createOwnerContributions() {
	const source = new DistantSunLightSource({
		angularRadius: {value: 0.004675, units: 'radians'},
	});
	const geometry = createSphericalGeometry(source);
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
	});
	const cache = createGpuCache();
	const transport = new Algorithm32Transport();
	const model = /** @type {Algorithm32ExecutionModel} */ (
		/** @type {unknown} */ ({
			profile: {
				numerical: {viewPath: {intervalCount: 15, sampleDistribution: null}},
			},
		})
	);

	return [
		geometry.createShaderContribution(),
		atmosphere.createShaderContribution(),
		source.createShaderContribution(),
		cache.createShaderContribution(),
		transport.createShaderContribution({model}),
	];
}

/**
 * Called by this module to create gpu cache.
 * @returns - The result produced by the operation.
 */
function createGpuCache() {
	const sceneSun = {
		id: 'test-scene',
		instant: '2026-03-20T12:00:00.000Z',
		directionToSourceUpEastNorth: [1, 0, 0],
		sourceIdentity: 'algorithm32-native-distant-collimated-sun-v1',
	};
	const ledger = new DistantSunSceneCacheLedger({
		sceneSun,
		support: {
			id: 'test-support',
			bottomRadius: distance(6360000),
			topRadius: distance(6420000),
			observerAltitude: distance(2),
			observerSolarZenith: {value: 0, units: 'radians'},
			completeCameraRotation: true,
			arbitraryShortenedEndpoint: true,
		},
		positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
		solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
		outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const texture = (id, storage, valueKey) => ({
		id,
		storage,
		backendId: 'owner-contribution-backend',
		runtimeBinding: {id: `${id}:binding`, valueKey, fieldId: id, backendId: 'owner-contribution-backend'},
		dispose() {},
	});
	return new DistantSunSceneCache({
		manifest: {
			record: {
				cacheIdentity: 'test-scene-cache',
				exactSeamPayload: {byteLength: ledger.retainedBlockCount * 4058 * 15 * 4},
				logicalToUniqueIndex: {byteLength: 8748},
			},
			requireCacheIdentity() {},
		},
		ledger,
		cumulativeTexture: texture(
			'scene-values',
			{format: 'RGBA32F', width: 648, height: 27, layers: ledger.retainedBlockCount},
			'cache.sceneCumulativeScatteringDensity',
		),
		directionIndexTexture: texture(
			'scene-index',
			{format: 'R16UI', width: 4374, height: 1, layers: 1},
			'cache.sceneLogicalToUniqueDirection',
		),
	});
}

/**
 * Called by this module to create spherical geometry.
 * @returns - The result produced by the operation.
 */
function createSphericalGeometry(lightSource = null) {
	const geometry = new SphericalEarthGeometry({
		bottomRadius: distance(6360000),
		topRadius: distance(6420000),
		observerHeight: distance(2),
		observerUpDirection: [1, 0, 0],
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: distance(2),
		sourceTransmittanceIntervalCount: 20,
	});
	geometry.configureLightSource({
		lightSource: lightSource ?? {
			geometryPlacementKind: 'distant-direction',
			configureGeometryPlacement() {},
		},
		observation: {
			instant: '2026-03-20T12:00:00.000Z',
			location: {
				latitude: {value: 0, units: 'degrees'},
				longitude: {value: -90, units: 'degrees'},
			},
		},
	});

	return geometry;
}

/**
 * Called by this module to create distant source.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createDistantSource(overrides = {}) {
	const source = new DistantSunLightSource({
		angularRadius: {value: 0.004675, units: 'radians'},
		...overrides,
	});
	source.configureGeometryPlacement({kind: 'distant-direction', directionToLight: [0, 1, 0]});

	return source;
}

/**
 * Called by this module to shader code.
 * @param contribution - The contribution value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function shaderCode(contribution) {
	return contribution.functions
		.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param block - The block value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (block) => block.code,
		)
		.join('\n');
}

/**
 * Called by this module to distance.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function distance(value) {
	return {value, units: 'meters'};
}
