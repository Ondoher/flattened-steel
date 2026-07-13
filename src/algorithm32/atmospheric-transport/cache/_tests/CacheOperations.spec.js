import {CanonicalAtmosphere, DistantSunLightSource, SphericalEarthGeometry} from '../../../implementation/index.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../implementation/canonical-atmosphere/consts.js';
import {DistantSunCacheController} from '../../../implementation/distant-sun/cache/DistantSunCacheController.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../../../implementation/distant-sun/cache/consts.js';
import {createNativeExecutionProfile, NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/native-15/native-15-profile.js';
import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheOperations} from '../CacheOperations.js';

/** Test construction options constant. */
const TEST_CONSTRUCTION_OPTIONS = {
	transportIntervalCount: 15,
	maximumScatteringOrder: 2,
};

/**
 * Called by this module to resolve one required logical field from a manufactured plan.
 *
 * @param {CacheBuildPlan} plan - Supplies the plan.
 * @param {string} id - Supplies the logical field id.
 * @returns {CacheFieldSpec} - Return the resolved field.
 */
function field(plan, id) {
	return /** @type {CacheFieldSpec} */ (
		plan.fields.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param candidate - The candidate value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (candidate) => candidate.id === id,
		)
	);
}

/**
 * Called by this module to create the selected structural N2 plan used by operation checks.
 * @returns - The result produced by the operation.
 */
function createPlan() {
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
	});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: {value: 2, units: 'meters'},
		observerUpDirection: [1, 0, 0],
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: {value: 2, units: 'meters'},
		sourceTransmittanceIntervalCount: 20,
	});
	const source = new DistantSunLightSource({
		angularRadius: {value: 0.004675, units: 'radians'},
	});
	geometry.configureLightSource({
		lightSource: source,
		observation: {
			instant: '2026-03-20T12:00:00.000Z',
			location: {
				latitude: {value: 0, units: 'degrees'},
				longitude: {value: -90, units: 'degrees'},
			},
		},
	});
	const observation = geometry.configuration.observation;
	const domains = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const model = /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			lightSource: source,
			atmosphere,
			geometry,
			groundBoundary: null,
			profile: createNativeExecutionProfile({
				lightSource: source,
				atmosphere,
				geometry,
				groundBoundary: null,
				observation,
				domains: {
					positions: domains.positionDomain,
					incomingDirections: domains.incomingDirectionDomain,
					outgoingDirections: domains.outgoingDirectionDomain,
				},
				execution: TEST_CONSTRUCTION_OPTIONS,
			}),
		})
	);

	const controller = new DistantSunCacheController({
		model,
		backend: /** @type {CacheGpuBackend} */ ({}),
	});
	const plan = controller.createBuildPlan();
	controller.dispose();

	return plan;
}

describe('CacheOperations', /** Called by Jasmine to register the named test suite. */ () => {
	it('emits production-compatible L1 to J2 scattering over the executable incoming width', /** Called by Jasmine to exercise the named behavior. */ () => {
		const plan = createPlan();
		const operations = new CacheOperations();
		const primaryRadiance = field(plan, 'distant-sun-l1');
		const secondOrderScatteringDensity = field(plan, 'distant-sun-j2');
		const scatter = operations.createCacheModule({
			kind: 'scatter',
			order: 2,
			inputs: [primaryRadiance],
			output: secondOrderScatteringDensity,
			options: TEST_CONSTRUCTION_OPTIONS,
		});

		expect(scatter.owner).toBe('transport');
		expect(scatter.provides).toEqual(['cache.operation.scatter']);
		expect(scatter.requires).toEqual([
			'atmosphere.medium',
			'atmosphere.phase',
			'cache.outputLayout',
			'geometry.cachePosition',
			'geometry.sourceFrame',
			'lightSource.direction',
		]);
		expect(scatter.bindings).toEqual([
			jasmine.objectContaining({
				spec: jasmine.objectContaining({
					name: 'CACHE_INCOMING_DIRECTION_COUNT',
					kind: 'define',
				}),
				value: 68,
			}),
		]);
		expect(scatter.blocks.length).toBe(1);
		const source = scatter.blocks[0].source;
		expect(source).toContain('incomingIndex < CACHE_INCOMING_DIRECTION_COUNT');
		expect(source).toContain('cacheIncomingWeight(incomingIndex)');
		expect(source).toContain('cacheRayleighScattering(');
		expect(source).toContain('cacheMieScattering(');
		expect(source).toContain('cacheRayleighPhase(');
		expect(source).toContain('cacheMiePhase(');
		expect(source).toContain(CacheBuildModules.fieldInputBindingName(primaryRadiance.id));
		expect(source).toContain('a32CacheOutput = scatteringDensity;');
	});

	it('emits the selected one-field copy and two-field cumulative add', /** Called by Jasmine to exercise the named behavior. */ () => {
		const plan = createPlan();
		const operations = new CacheOperations();
		const primaryScatteringDensity = field(plan, 'distant-sun-j1');
		const secondOrderScatteringDensity = field(plan, 'distant-sun-j2');
		const cumulative = field(plan, 'distant-sun-j-through-2');
		const copy = operations.createCacheModule({
			kind: 'accumulate',
			order: 1,
			inputs: [primaryScatteringDensity],
			output: cumulative,
			options: TEST_CONSTRUCTION_OPTIONS,
		});
		const additionModule = operations.createCacheModule({
			kind: 'accumulate',
			order: 2,
			inputs: [primaryScatteringDensity, secondOrderScatteringDensity],
			output: cumulative,
			options: TEST_CONSTRUCTION_OPTIONS,
		});

		expect(copy.provides).toEqual(['cache.operation.accumulate']);
		expect(copy.requires).toEqual(['cache.outputLayout']);
		expect(copy.blocks[0].source).toContain(CacheBuildModules.fieldInputBindingName(primaryScatteringDensity.id));
		expect(copy.blocks[0].source).not.toContain('\n\t+ texelFetch');
		expect(additionModule.blocks[0].source).toContain(
			CacheBuildModules.fieldInputBindingName(primaryScatteringDensity.id),
		);
		expect(additionModule.blocks[0].source).toContain(
			CacheBuildModules.fieldInputBindingName(secondOrderScatteringDensity.id),
		);
		expect(additionModule.blocks[0].source).toContain('\n\t+ texelFetch');
	});

	it('emits production-compatible packed-tap Jk to Lk transport', /** Called by Jasmine to exercise the named behavior. */ () => {
		const plan = createPlan();
		const operations = new CacheOperations();
		const secondOrderScatteringDensity = field(plan, 'distant-sun-j2');
		const primaryRadiance = field(plan, 'distant-sun-l1');
		const secondOrderRadiance = {...primaryRadiance, id: 'distant-sun-l2'};
		const transport = operations.createCacheModule({
			kind: 'transport',
			order: 2,
			inputs: [secondOrderScatteringDensity],
			output: secondOrderRadiance,
			options: TEST_CONSTRUCTION_OPTIONS,
		});
		const source = transport.blocks[0].source;

		expect(transport.provides).toEqual(['cache.operation.transport']);
		expect(transport.requires).toEqual(['cache.outputLayout', 'geometry.transportPath']);
		expect(source).toContain('cacheTransportTapStart(outputDirectionIndex, outputPositionIndex)');
		expect(source).toContain('tapIndex < cacheTransportTapEnd(outputDirectionIndex, outputPositionIndex)');
		expect(source).toContain('ivec3 source = cacheTransportSource(');
		expect(source).toContain('cacheTransportCoefficient(');
		expect(source).toContain(CacheBuildModules.fieldInputBindingName(secondOrderScatteringDensity.id));
		expect(source).toContain('radiance += density * coefficient;');
		expect(source).toContain('a32CacheOutput = radiance;');
	});
});
