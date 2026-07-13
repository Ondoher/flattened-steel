import {NATIVE_SOURCE_IRRADIANCE_DENSITY} from '../../../../profiles/native-15/native-15-profile.js';
import {LOCAL_SUN_SHELL_BOUNDARY_COUNT, LOCAL_SUN_SHELL_COUNT, LOCAL_SUN_SHELL_FACT_ID} from '../consts.js';
import {LocalSunShellFactCache} from '../LocalSunShellFactCache.js';
import {LocalSunCacheSource} from '../LocalSunCacheSource.js';

/** Boundary probes constant. */
const BOUNDARY_PROBES = [
	[0, 4705737.689283371],
	[1, 4706847.119876376],
	[1024, 6542491.776534779],
	[2047, 25104970.895387642],
	[2048, 25275084.66397966],
];
/** Held scale probes constant. */
const HELD_SCALE_PROBES = [
	[0, 1.0402187545163528],
	[1, 1.0397283257905379],
	[1023, 0.5385101680075774],
	[1024, 0.5380197392817625],
	[2047, 0.036311152772986896],
];

describe('LocalSunShellFactCache', /** Called by Jasmine to register the named test suite. */ () => {
	it('matches the fixed production N=2048 boundary and held-scale facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const cache = createFacts();
		const boundaries = cache.boundaries;
		const heldScales = cache.heldIncidentScales;

		expect(cache.id).toBe(LOCAL_SUN_SHELL_FACT_ID);
		expect(cache.shellCount).toBe(LOCAL_SUN_SHELL_COUNT);
		expect(cache.boundaryCount).toBe(LOCAL_SUN_SHELL_BOUNDARY_COUNT);
		expect(cache.minimumDistance).toEqual({value: boundaries[0], units: 'meters'});
		expect(cache.maximumDistance.units).toBe('meters');
		expect(cache.maximumDistance.value).toBeCloseTo(boundaries[boundaries.length - 1], 7);
		expect(boundaries.length).toBe(LOCAL_SUN_SHELL_BOUNDARY_COUNT);
		expect(heldScales.length).toBe(LOCAL_SUN_SHELL_COUNT);
		for (let index = 1; index < boundaries.length; index += 1) {
			expect(boundaries[index]).toBeGreaterThan(boundaries[index - 1]);
		}
		for (const [index, expected] of BOUNDARY_PROBES) {
			expect(boundaries[index]).toBe(expected);
		}
		for (const [index, expected] of HELD_SCALE_PROBES) {
			expect(heldScales[index]).toBe(expected);
		}
	});

	it('uses higher-index ownership at exact internal boundaries', /** Called by Jasmine to exercise the named behavior. */ () => {
		const cache = createFacts();

		for (const index of [1, 1024, 2047]) {
			const boundary = cache.boundaries[index];

			expect(cache.resolveShell(boundary - Number.EPSILON * boundary).shellIndex).toBe(index - 1);
			expect(cache.resolveShell(boundary).shellIndex).toBe(index);
			expect(cache.resolveShell(boundary + Number.EPSILON * boundary).shellIndex).toBe(index);
		}
		expect(cache.resolveShell(-1).shellIndex).toBe(0);
		expect(cache.resolveShell(Number.MAX_VALUE).shellIndex).toBe(LOCAL_SUN_SHELL_COUNT - 1);
	});

	it('returns independent executable fact copies', /** Called by Jasmine to exercise the named behavior. */ () => {
		const cache = createFacts();
		const originalBoundary = cache.boundaries[0];
		const originalScale = cache.heldIncidentScales[0];
		const boundaries = cache.boundaries;
		const heldScales = cache.heldIncidentScales;

		boundaries[0] = 0;
		heldScales[0] = 0;

		expect(cache.boundaries[0]).toBe(originalBoundary);
		expect(cache.heldIncidentScales[0]).toBe(originalScale);
	});

	it('retains its owner id while deriving source-dependent executable facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const baseline = createFacts();
		const moved = createFacts({
			position: {
				coordinates: [4_800_001, 0, 4_800_000],
				units: 'meters',
			},
		});
		const resized = createFacts({
			radius: {
				value: 25_750,
				units: 'meters',
			},
		});

		expect(moved.id).toBe(baseline.id);
		expect(resized.id).toBe(baseline.id);
		expect(moved.boundaries).not.toEqual(baseline.boundaries);
		expect(moved.heldIncidentScales).not.toEqual(baseline.heldIncidentScales);
		expect(resized.boundaries).toEqual(baseline.boundaries);
		expect(resized.heldIncidentScales).toEqual(baseline.heldIncidentScales);
	});

	it('gives uploaded boundary data its own content identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const baselineConfiguration = createSourceConfiguration();
		const movedConfiguration = createSourceConfiguration({
			position: {
				coordinates: [4_800_001, 0, 4_800_000],
				units: 'meters',
			},
		});
		const baseline = new LocalSunCacheSource({
			source: {configuration: baselineConfiguration},
			shellFactCache: new LocalSunShellFactCache({
				sourceConfiguration: baselineConfiguration,
			}),
		});
		const moved = new LocalSunCacheSource({
			source: {configuration: movedConfiguration},
			shellFactCache: new LocalSunShellFactCache({
				sourceConfiguration: movedConfiguration,
			}),
		});
		const context = /** @type {CacheBuildContext} */ (/** @type {unknown} */ ({kind: 'primary-j1'}));
		const baselineData = /** @type {CacheData} */ (
			baseline.createCacheModule(context).bindings.find(
				/**
				 * Called by Array.prototype.find to test one collection value for selection.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({spec: fieldSpecification}) => fieldSpecification.id === 'local-sun-shell-boundaries',
			)?.value
		);
		const movedData = /** @type {CacheData} */ (
			moved.createCacheModule(context).bindings.find(
				/**
				 * Called by Array.prototype.find to test one collection value for selection.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({spec: fieldSpecification}) => fieldSpecification.id === 'local-sun-shell-boundaries',
			)?.value
		);

		expect(baselineData.id).toBe(`${LOCAL_SUN_SHELL_FACT_ID}-r32f-boundaries-v1`);
		expect(baselineData.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/u);
		expect(movedData.contentHash).not.toBe(baselineData.contentHash);
	});
});

/**
 * Called by this module to create facts.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createFacts(overrides = {}) {
	return new LocalSunShellFactCache({
		sourceConfiguration: createSourceConfiguration(overrides),
	});
}

/**
 * Called by this module to create source configuration.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createSourceConfiguration(overrides = {}) {
	return /** @type {LocalSunLightSourceConfiguration} */ ({
		sourceKey: 'local-sun-shell-fact-test',
		position: {
			coordinates: [4_800_000, 0, 4_800_000],
			units: 'meters',
		},
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		referenceDistance: {
			value: 4_800_000,
			units: 'meters',
		},
		referenceSpectralIncidentScale: 1,
		radius: {
			value: 25_749.504,
			units: 'meters',
		},
		distanceFalloff: true,
		sourceTransmittanceIntervalCount: 15,
		...overrides,
	});
}
