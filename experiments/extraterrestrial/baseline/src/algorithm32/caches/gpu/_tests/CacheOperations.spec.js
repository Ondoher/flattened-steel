import { CanonicalAtmosphere } from '../../../atmospheres/CanonicalAtmosphere.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../../constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../../../geometries/SphericalEarthGeometry.js';
import {
	createDistantSunCacheBuildPlan,
} from '../../../light-sources/distant-sun-cache-plan.js';
import { DistantSunLightSource } from '../../../light-sources/DistantSunLightSource.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../../profiles/native-15-profile.js';
import { cacheFieldInputBindingName } from '../cacheBuildContracts.js';
import { CacheOperations } from '../CacheOperations.js';

/**
 * Resolve one required logical field from a manufactured plan.
 *
 * @param {CacheBuildPlan} plan - Supplies the plan.
 * @param {string} id - Supplies the logical field id.
 * @returns {CacheFieldSpec} Return the resolved field.
 */
function field(plan, id) {
	return /** @type {CacheFieldSpec} */ (
		plan.fields.find((candidate) => candidate.id === id)
	);
}

/** Create the selected structural N2 plan used by operation checks. */
function createPlan() {
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: { value: 2, units: 'meters' },
		observerUpDirection: [1, 0, 0],
		directionToSource: [0, 1, 0],
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: { value: 2, units: 'meters' },
		sourceTransmittanceIntervalCount: 20,
	});
	const source = new DistantSunLightSource({
		directionToLight: [0, 1, 0],
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: { value: 0.004675, units: 'radians' },
	});

	return createDistantSunCacheBuildPlan({
		source,
		atmosphere,
		geometry,
		maximumScatteringOrder: 2,
	});
}

describe('CacheOperations', () => {
	it('emits Star-compatible L1 to J2 scattering over the executable incoming width', () => {
		const plan = createPlan();
		const operations = new CacheOperations();
		const l1 = field(plan, 'distant-sun-l1');
		const j2 = field(plan, 'distant-sun-j2');
		const scatter = operations.createCacheModule({
			kind: 'scatter',
			order: 2,
			inputs: [l1],
			output: j2,
			controls: plan.descriptorDefinition.controls,
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
		expect(scatter.bindings).toEqual([jasmine.objectContaining({
			spec: jasmine.objectContaining({
				name: 'CACHE_INCOMING_DIRECTION_COUNT',
				kind: 'define',
			}),
			value: 34,
		})]);
		expect(scatter.blocks.length).toBe(1);
		const source = scatter.blocks[0].source;
		expect(source).toContain('incomingIndex < CACHE_INCOMING_DIRECTION_COUNT');
		expect(source).toContain('cacheIncomingWeight(incomingIndex)');
		expect(source).toContain('cacheRayleighScattering(');
		expect(source).toContain('cacheMieScattering(');
		expect(source).toContain('cacheRayleighPhase(');
		expect(source).toContain('cacheMiePhase(');
		expect(source).toContain(cacheFieldInputBindingName(l1.id));
		expect(source).toContain('a32CacheOutput = scatteringDensity;');
	});

	it('emits the selected one-field copy and two-field cumulative add', () => {
		const plan = createPlan();
		const operations = new CacheOperations();
		const j1 = field(plan, 'distant-sun-j1');
		const j2 = field(plan, 'distant-sun-j2');
		const cumulative = field(plan, 'distant-sun-j-through-2');
		const copy = operations.createCacheModule({
			kind: 'accumulate',
			order: 1,
			inputs: [j1],
			output: cumulative,
			controls: plan.descriptorDefinition.controls,
		});
		const add = operations.createCacheModule({
			kind: 'accumulate',
			order: 2,
			inputs: [j1, j2],
			output: cumulative,
			controls: plan.descriptorDefinition.controls,
		});

		expect(copy.provides).toEqual(['cache.operation.accumulate']);
		expect(copy.requires).toEqual(['cache.outputLayout']);
		expect(copy.blocks[0].source).toContain(cacheFieldInputBindingName(j1.id));
		expect(copy.blocks[0].source).not.toContain('\n\t+ texelFetch');
		expect(add.blocks[0].source).toContain(cacheFieldInputBindingName(j1.id));
		expect(add.blocks[0].source).toContain(cacheFieldInputBindingName(j2.id));
		expect(add.blocks[0].source).toContain('\n\t+ texelFetch');
	});

	it('emits Star-compatible packed-tap Jk to Lk transport', () => {
		const plan = createPlan();
		const operations = new CacheOperations();
		const j2 = field(plan, 'distant-sun-j2');
		const l1 = field(plan, 'distant-sun-l1');
		const l2 = { ...l1, id: 'distant-sun-l2' };
		const transport = operations.createCacheModule({
			kind: 'transport',
			order: 2,
			inputs: [j2],
			output: l2,
			controls: plan.descriptorDefinition.controls,
		});
		const source = transport.blocks[0].source;

		expect(transport.provides).toEqual(['cache.operation.transport']);
		expect(transport.requires).toEqual([
			'cache.outputLayout',
			'geometry.transportPath',
		]);
		expect(source).toContain('tapIndex < CACHE_TRANSPORT_TAP_COUNT');
		expect(source).toContain('ivec3 source = cacheTransportSource(');
		expect(source).toContain('cacheTransportCoefficient(');
		expect(source).toContain(cacheFieldInputBindingName(j2.id));
		expect(source).toContain('radiance += density * coefficient;');
		expect(source).toContain('a32CacheOutput = radiance;');
	});
});
