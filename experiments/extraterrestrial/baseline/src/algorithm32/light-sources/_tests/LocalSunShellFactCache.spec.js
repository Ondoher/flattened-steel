import {
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../profiles/native-15-profile.js';
import {
	LOCAL_SUN_SHELL_BOUNDARY_COUNT,
	LOCAL_SUN_SHELL_COUNT,
} from '../local-sun-consts.js';
import {
	createLocalSunShellFactCache,
} from '../create-local-sun-shell-fact-cache.js';

const STAR_BOUNDARY_PROBES = [
	[0, 4705737.689283371],
	[1, 4706847.119876376],
	[1024, 6542491.776534779],
	[2047, 25104970.895387642],
	[2048, 25275084.66397966],
];
const STAR_HELD_SCALE_PROBES = [
	[0, 1.0402187545163528],
	[1, 1.0397283257905379],
	[1023, 0.5385101680075774],
	[1024, 0.5380197392817625],
	[2047, 0.036311152772986896],
];

describe('LocalSunShellFactCache', () => {
	it('matches the fixed Star N=2048 boundary and held-scale facts', () => {
		const cache = createFacts();
		const boundaries = cache.boundaries;
		const heldScales = cache.heldIncidentScales;

		expect(cache.descriptor.shellCount)
			.toBe(LOCAL_SUN_SHELL_COUNT);
		expect(cache.descriptor.boundaryCount)
			.toBe(LOCAL_SUN_SHELL_BOUNDARY_COUNT);
		expect(boundaries.length)
			.toBe(LOCAL_SUN_SHELL_BOUNDARY_COUNT);
		expect(heldScales.length)
			.toBe(LOCAL_SUN_SHELL_COUNT);
		for (let index = 1; index < boundaries.length; index += 1) {
			expect(boundaries[index])
				.toBeGreaterThan(boundaries[index - 1]);
		}
		for (const [index, expected] of STAR_BOUNDARY_PROBES) {
			expect(boundaries[index]).toBe(expected);
		}
		for (const [index, expected] of STAR_HELD_SCALE_PROBES) {
			expect(heldScales[index]).toBe(expected);
		}
	});

	it('uses higher-index ownership at exact internal boundaries', () => {
		const cache = createFacts();

		for (const index of [1, 1024, 2047]) {
			const boundary = cache.boundaries[index];

			expect(cache.resolveShell(
				boundary - Number.EPSILON * boundary,
			).shellIndex).toBe(index - 1);
			expect(cache.resolveShell(boundary).shellIndex)
				.toBe(index);
			expect(cache.resolveShell(
				boundary + Number.EPSILON * boundary,
			).shellIndex).toBe(index);
		}
		expect(cache.resolveShell(-1).shellIndex).toBe(0);
		expect(cache.resolveShell(Number.MAX_VALUE).shellIndex)
			.toBe(LOCAL_SUN_SHELL_COUNT - 1);
	});

	it('returns independent executable fact copies', () => {
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

	it('changes identity with a physical source fact', () => {
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

		expect(moved.descriptor.identity)
			.not.toBe(baseline.descriptor.identity);
		expect(resized.descriptor.identity)
			.not.toBe(baseline.descriptor.identity);
	});
});

function createFacts(overrides = {}) {
	return createLocalSunShellFactCache({
		sourceConfiguration: {
			position: {
				coordinates: [4_800_000, 0, 4_800_000],
				units: 'meters',
			},
			sourceIrradiance:
				NATIVE_SOURCE_IRRADIANCE_DENSITY,
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
			...overrides,
		},
	});
}
