import { CanonicalAtmosphere } from '../../atmospheres/CanonicalAtmosphere.js';
import { CachePassAssembler } from '../../caches/gpu/CachePassAssembler.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../../geometries/SphericalEarthGeometry.js';
import {
	UniformLambertianGroundBoundary,
} from '../../ground-boundaries/index.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../profiles/native-15-profile.js';
import {
	createSpectralPacket,
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../../quantities/index.js';
import {
	cacheFieldInputBindingName,
} from '../../caches/gpu/cacheBuildContracts.js';
import { DistantSunLightSource } from '../DistantSunLightSource.js';
import { createDistantSunCacheBuildPlan } from '../distant-sun-cache-plan.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';

describe('distant-Sun executable GPU owner modules', () => {
	it('assembles source-owned physical J1 and direct L1 programs', () => {
		const plan = createDistantSunCacheBuildPlan({
			...createOwners(),
			maximumScatteringOrder: 2,
		});
		const assembler = new CachePassAssembler();
		const primary = assemblePass(plan, assembler, 'distant-sun-primary-j1');
		const direct = assemblePass(plan, assembler, 'distant-sun-direct-l1');

		expect(primary.source).toContain('float cachePrimaryJ1(');
		expect(primary.source).toContain('cachePathTransmittance(');
		expect(primary.source).toContain('cacheOutgoingLocalDirection(directionIndex)');
		expect(primary.source).toContain('a32CacheOutput = cachePrimaryJ1(');
		expect(direct.source).toContain('float cacheDirectL1(');
		expect(direct.source).toContain('CACHE_TRANSPORT_INTERVAL_COUNT 15');
		expect(direct.source).toContain('cacheIncomingDirection(');
		expect(direct.source).toContain('viewTransmittance *= exp(');
		expect(direct.source).toContain('a32CacheOutput = cacheDirectL1(');
		expect(`${primary.source}\n${direct.source}`).not.toContain('invariant');
	});

	it('supplies Native48, W27, Fibonacci34, and source-owned direction data', () => {
		const plan = createDistantSunCacheBuildPlan({
			...createOwners(),
			maximumScatteringOrder: 2,
		});
		const primaryGeometry = moduleByOwner(plan.passes[0], 'geometry');
		const directGeometry = moduleByOwner(plan.passes[1], 'geometry');
		const scatterGeometry = moduleByOwner(plan.passes[2], 'geometry');
		const scatterSource = moduleByOwner(plan.passes[2], 'lightSource');

		expect(dataShape(primaryGeometry, 'spherical-geometry-position-nodes'))
			.toEqual([48]);
		expect(dataShape(primaryGeometry, 'spherical-geometry-outgoing-directions'))
			.toEqual([3, 4374]);
		expect(dataShape(directGeometry, 'spherical-geometry-incoming-directions'))
			.toEqual([3, 34]);
		expect(dataShape(scatterGeometry, 'spherical-geometry-incoming-weights'))
			.toEqual([34]);
		expect(scatterSource.provides).toContain('lightSource.direction');
		expect(scatterSource.bindings.filter(
			({ spec }) => spec.id === 'distant-sun-source-direction',
		).length).toBe(1);
	});

	it('packs reusable scalar transport taps in Star query and layer order', () => {
		const { atmosphere, geometry } = createOwners();
		const data = geometry.createTransportData({
			atmosphere,
			domains: DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
			directionToSource: [0, 1, 0],
			intervalCount: 1,
		});

		expect(data.queryCount).toBe(48 * 34);
		expect(data.tapCount).toBeGreaterThan(0);
		expect(data.sources.shape).toEqual([
			data.tapCount * 3,
			data.queryCount,
		]);
		expect(data.coefficients.shape).toEqual([
			data.tapCount,
			data.queryCount,
			15,
		]);
		expect(data.sources.values.length)
			.toBe(data.tapCount * data.queryCount * 3);
		expect(data.coefficients.values.length)
			.toBe(data.tapCount * data.queryCount * 15);
		expect(data.sources.values.some((value, index) =>
			index % 3 === 2 && value === 1)).toBeTrue();
		expect(data.coefficients.values.some((value) => value > 0)).toBeTrue();
	});

	it('packs the same transport algorithm over the reduced Native16/W9 lattice', () => {
		const domains =
			NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
		const { atmosphere, geometry } = createOwners(
			domains.positionCount,
		);
		const data = geometry.createTransportData({
			atmosphere,
			domains,
			directionToSource: [0, 1, 0],
			intervalCount: 1,
		});
		const activeSources = [];

		for (let offset = 0;
			offset < data.sources.values.length;
			offset += 3) {
			if (data.sources.values[offset + 2] === 1) {
				activeSources.push({
					directionIndex: data.sources.values[offset],
					positionIndex: data.sources.values[offset + 1],
				});
			}
		}

		expect(data.queryCount).toBe(16 * 34);
		expect(data.sources.id).toContain(domains.id);
		expect(data.coefficients.id).toContain(domains.id);
		expect(activeSources.length).toBeGreaterThan(0);
		expect(activeSources.every(({ directionIndex }) =>
			Number.isInteger(directionIndex)
				&& directionIndex >= 0
				&& directionIndex < domains.outgoingDirectionCount,
		)).toBeTrue();
		expect(activeSources.every(({ positionIndex }) =>
			Number.isInteger(positionIndex)
				&& positionIndex >= 0
				&& positionIndex < domains.positionCount,
		)).toBeTrue();
	});

	it('assembles direct and pure-radiance ground reflection through owner capabilities', () => {
		const plan = createDistantSunCacheBuildPlan({
			...createOwners(),
			groundBoundary: createGroundBoundary(0.5),
			maximumScatteringOrder: 4,
		});
		const assembler = new CachePassAssembler();
		const j2Pass = passById(plan, 'distant-sun-scatter-l1-to-j2');
		const j3Pass = passById(plan, 'distant-sun-scatter-l2-to-j3');
		const j4Pass = passById(plan, 'distant-sun-scatter-l3-to-j4');
		const j2 = assemblePass(plan, assembler, j2Pass.id);
		const j3 = assemblePass(plan, assembler, j3Pass.id);
		const j4 = assemblePass(plan, assembler, j4Pass.id);

		for (const shader of [j2, j3, j4]) {
			expect(shader.source).toContain('float cacheGroundBrdf(');
			expect(shader.source).toContain('bool cacheGroundBoundaryHit(');
			expect(shader.source).toContain(
				'float cacheFiniteSegmentTransmittance(',
			);
			expect(shader.source).toContain('if (distanceMeters == 0.0) return 1.0;');
			expect(shader.source).toContain('float cacheSourceIrradiance(');
		}

		const j2Operation = moduleByOwner(j2Pass, 'transport').blocks[0].source;
		const j3Operation = moduleByOwner(j3Pass, 'transport').blocks[0].source;
		const j4Operation = moduleByOwner(j4Pass, 'transport').blocks[0].source;
		expect(j2Operation).toContain(
			'cacheSourceIrradiance(\n'
				+ '\t\t\t\t\t\tgroundPositionMeters,\n'
				+ '\t\t\t\t\t\ta32CacheWavelengthLayer',
		);
		expect(j2Operation).toContain(
			'cacheSourceDirection(groundPositionMeters)',
		);
		expect(j2Operation).toContain('* sourceCosine\n\t\t\t\t\t* groundBrdf;');
		expect(j3Operation).toContain(cacheFieldInputBindingName('distant-sun-l1'));
		expect(j4Operation).toContain(cacheFieldInputBindingName('distant-sun-l2'));
		expect(j3Operation).toContain('groundConstructionPositionIndices');
		expect(j3Operation).toContain('groundConstructionPositionWeights');
		expect(j3Operation).toContain('groundPositionTapIndex < 4');
		expect(j3Operation).toContain(').r * groundPositionWeight;');
		expect(j3Operation).toContain('cacheIncomingWeight(groundIncomingIndex)');
		expect(j3Operation).not.toContain('distant-sun-j-through');
		expect(j4Operation).not.toContain('distant-sun-j-through');
		expect(j3.source).toContain(
			'positionIndices = ivec4(positionIndex, 0, 0, 0);',
		);
		expect(j3.source).toContain(
			'positionWeights = vec4(1.0, 0.0, 0.0, 0.0);',
		);
	});

	it('guards explicit-zero BRDF before reflection-only hit, path, and field work', () => {
		const plan = createDistantSunCacheBuildPlan({
			...createOwners(),
			groundBoundary: createGroundBoundary(0),
			maximumScatteringOrder: 4,
		});
		const j3Pass = passById(plan, 'distant-sun-scatter-l2-to-j3');
		const ground = moduleByOwner(j3Pass, 'ground');
		const operation = moduleByOwner(j3Pass, 'transport').blocks[0].source;
		const guardIndex = operation.indexOf(
			'float groundBrdf = cacheGroundBrdf(a32CacheWavelengthLayer);',
		);
		const hitIndex = operation.indexOf('if (cacheGroundBoundaryHit(');
		const finitePathIndex = operation.indexOf(
			'cacheFiniteSegmentTransmittance(',
		);
		const illuminationIndex = operation.indexOf(
			cacheFieldInputBindingName('distant-sun-l1'),
		);

		expect(ground.bindings[0].value.values)
			.toEqual(Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0));
		expect(operation).toContain('if (groundBrdf != 0.0) {');
		expect(guardIndex).toBeGreaterThanOrEqual(0);
		expect(hitIndex).toBeGreaterThan(guardIndex);
		expect(illuminationIndex).toBeGreaterThan(hitIndex);
		expect(finitePathIndex).toBeGreaterThan(illuminationIndex);
	});

	it('keeps omitted-ground scatter modules free of reflective work', () => {
		const plan = createDistantSunCacheBuildPlan({
			...createOwners(),
			maximumScatteringOrder: 4,
		});

		for (const passId of [
			'distant-sun-scatter-l1-to-j2',
			'distant-sun-scatter-l2-to-j3',
			'distant-sun-scatter-l3-to-j4',
		]) {
			const pass = passById(plan, passId);
			const assembled = assemblePass(
				plan,
				new CachePassAssembler(),
				passId,
			);
			expect(moduleByOwner(pass, 'ground').bindings).toEqual([]);
			expect(assembled.source).not.toContain('cacheGroundBoundaryHit(');
			expect(assembled.source).not.toContain(
				'cacheFiniteSegmentTransmittance(',
			);
			expect(assembled.source).not.toContain('cacheSourceIrradiance(');
		}
	});
});

function createOwners(positionCount = 48) {
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
		cacheAltitudeBinCount: positionCount,
		cacheBoundaryAltitude: { value: 2, units: 'meters' },
		sourceTransmittanceIntervalCount: 20,
	});
	const source = new DistantSunLightSource({
		directionToLight: [0, 1, 0],
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: { value: 0.004675, units: 'radians' },
	});

	return { atmosphere, geometry, source };
}

function assemblePass(plan, assembler, passId) {
	const pass = passById(plan, passId);
	const output = plan.fields.find(({ id }) => id === pass.output);
	return assembler.assemble(pass, output);
}

function passById(plan, passId) {
	return plan.passes.find(({ id }) => id === passId);
}

function moduleByOwner(pass, owner) {
	return pass.modules.find((module) => module.owner === owner);
}

function dataShape(module, bindingId) {
	return module.bindings.find(({ spec }) => spec.id === bindingId).value.shape;
}

function createGroundBoundary(reflectance) {
	const albedo = createSpectralPacket({
		quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
		units: SPECTRAL_UNITS.DIMENSIONLESS,
		basis: NATIVE_15_SPECTRAL_BASIS,
		values: Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(reflectance),
		provenanceIdentity: `gpu-owner-test-ground-${reflectance}`,
	});

	return new UniformLambertianGroundBoundary({
		id: `gpu-owner-test-ground-${reflectance}`,
		albedo,
	});
}
