import { CanonicalAtmosphere } from
	'../../atmospheres/CanonicalAtmosphere.js';
import { CachePassAssembler } from
	'../../caches/gpu/CachePassAssembler.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
} from '../../domains/consts.js';
import { FlatEarthGeometry } from
	'../../geometries/FlatEarthGeometry.js';
import {
	UniformLambertianGroundBoundary,
} from '../../ground-boundaries/index.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../../quantities/index.js';
import {
	createLocalSunShellFactCache,
} from '../create-local-sun-shell-fact-cache.js';
import {
	createLocalSunCacheBuildPlan,
} from '../local-sun-cache-plan.js';
import {
	LOCAL_SUN_CACHE_FINGERPRINT_SCHEMA_REVISION,
	LOCAL_SUN_CACHE_PLAN_ID,
	LOCAL_SUN_GPU_FIELD_PROVENANCE_IDENTITY,
} from '../local-sun-consts.js';
import { LocalSunCacheSource } from '../LocalSunCacheSource.js';
import LocalSunConstructionDomainSelection from
	'../LocalSunConstructionDomainSelection.js';
import { LocalSunLightSource } from '../LocalSunLightSource.js';

describe('local-Sun GPU cache plan', () => {
	it('emits the exact N1, N2, and N4 replacement graphs', () => {
		const owners = createOwners();
		const domainSelection =
			createBoundedDomainSelection(owners.geometry);
		const createPlan = (maximumScatteringOrder) =>
			createLocalSunCacheBuildPlan({
				...owners,
				domainSelection,
				maximumScatteringOrder,
			});
		const n1 = createPlan(1);
		const n2 = createPlan(2);
		const n4 = createPlan(4);

		expect(passGraph(n1)).toEqual([
			{
				id: 'local-sun-primary-j1',
				kind: 'primary-j1',
				order: 1,
				inputs: [],
				output: 'local-sun-j1',
			},
			{
				id: 'local-sun-copy-j1-to-jthrough1',
				kind: 'accumulate',
				order: 1,
				inputs: ['local-sun-j1'],
				output: 'local-sun-j-through-1',
			},
		]);
		expect(passGraph(n2)).toEqual([
			{
				id: 'local-sun-primary-j1',
				kind: 'primary-j1',
				order: 1,
				inputs: [],
				output: 'local-sun-j1',
			},
			{
				id: 'local-sun-direct-l1',
				kind: 'direct-l1',
				order: 1,
				inputs: [],
				output: 'local-sun-l1',
			},
			{
				id: 'local-sun-scatter-l1-to-j2',
				kind: 'scatter',
				order: 2,
				inputs: ['local-sun-l1'],
				output: 'local-sun-j2',
			},
			{
				id: 'local-sun-add-j1-j2-to-jthrough2',
				kind: 'accumulate',
				order: 2,
				inputs: ['local-sun-j1', 'local-sun-j2'],
				output: 'local-sun-j-through-2',
			},
		]);
		expect(n4.passes.map(({ id }) => id)).toEqual([
			'local-sun-primary-j1',
			'local-sun-direct-l1',
			'local-sun-scatter-l1-to-j2',
			'local-sun-add-j1-j2-to-jthrough2',
			'local-sun-transport-j2-to-l2',
			'local-sun-scatter-l2-to-j3',
			'local-sun-add-jthrough2-j3-to-jthrough3',
			'local-sun-transport-j3-to-l3',
			'local-sun-scatter-l3-to-j4',
			'local-sun-add-jthrough3-j4-to-jthrough4',
		]);
		expect([n1.result, n2.result, n4.result]).toEqual([
			'local-sun-j-through-1',
			'local-sun-j-through-2',
			'local-sun-j-through-4',
		]);
		expect(n4.passes.filter(({ kind }) =>
			kind === 'transport' || kind === 'scatter')
			.flatMap(({ inputs }) => inputs)
			.some((id) => id.includes('j-through'))).toBeFalse();
	});

	it('creates no N1/N2 packed transport and reuses one N4 logical data value', () => {
		const owners = createOwners();
		const domainSelection =
			createBoundedDomainSelection(owners.geometry);
		const transportSpy = spyOn(
			owners.geometry,
			'createTransportData',
		).and.callThrough();

		const n1 = createLocalSunCacheBuildPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 1,
		});
		const n2 = createLocalSunCacheBuildPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 2,
		});
		expect(transportSpy).not.toHaveBeenCalled();
		expect(n1.resources.packedTransportData.value).toBe(0);
		expect(n2.resources.packedTransportData.value).toBe(0);

		const n4 = createLocalSunCacheBuildPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 4,
		});
		expect(transportSpy).toHaveBeenCalledTimes(1);
		expect(transportSpy.calls.mostRecent().args[0].intervalCount)
			.toBe(15);
		const transportPasses = n4.passes.filter(
			({ kind }) => kind === 'transport',
		);
		const firstSources = findBinding(
			transportPasses[0],
			'flat-geometry-transport-sources',
		).value;
		const secondSources = findBinding(
			transportPasses[1],
			'flat-geometry-transport-sources',
		).value;
		const firstCoefficients = findBinding(
			transportPasses[0],
			'flat-geometry-transport-coefficients',
		).value;
		const secondCoefficients = findBinding(
			transportPasses[1],
			'flat-geometry-transport-coefficients',
		).value;

		expect(secondSources).toBe(firstSources);
		expect(secondCoefficients).toBe(firstCoefficients);
		expect(n4.resources.packedTransportData).toEqual({
			value: (
				firstSources.values.length
				+ firstCoefficients.values.length
			) * Float32Array.BYTES_PER_ELEMENT,
			units: 'bytes',
		});
	});

	it('reports selected-domain source, field, and packed-transport payloads', () => {
		const owners = createOwners();
		const domains =
			LocalSunConstructionDomainSelection.fromGeometry(
				owners.geometry,
			);
		const scatteringFieldStorage =
			domains.positionCount
			* domains.outgoingDirectionCount
			* domains.spectralChannelCount
			* Float32Array.BYTES_PER_ELEMENT;
		const radianceFieldStorage =
			domains.positionCount
			* domains.incomingDirectionCount
			* domains.spectralChannelCount
			* Float32Array.BYTES_PER_ELEMENT;
		const transportData =
			owners.geometry.createTransportData({
				atmosphere: owners.atmosphere,
				domains,
				intervalCount: 15,
			});
		const packedTransportStorage = (
			transportData.sources.values.length
			+ transportData.coefficients.values.length
		) * Float32Array.BYTES_PER_ELEMENT;

		expect(owners.shellFactCache.resourceUsage).toEqual({
			boundaries: {
				value: 16_392,
				units: 'bytes',
			},
			heldIncidentScales: {
				value: 16_384,
				units: 'bytes',
			},
			total: {
				value: 32_776,
				units: 'bytes',
			},
		});
		expect(scatteringFieldStorage).toBe(74_795_400);
		expect(radianceFieldStorage).toBe(581_400);
		expect(
			4 * scatteringFieldStorage
			+ 3 * radianceFieldStorage,
		).toBe(300_925_800);
		expect(transportData.queryCount).toBe(9_690);
		expect(transportData.tapCount).toBe(236);
		expect(packedTransportStorage).toBe(164_652_480);
	});

	it('binds the 2,049 R32F boundaries only to shell-held J1', () => {
		const owners = createOwners();
		const domainSelection =
			createBoundedDomainSelection(owners.geometry);
		const plan = createLocalSunCacheBuildPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 4,
		});
		const shellBindings = plan.passes.flatMap((pass) =>
			pass.modules.flatMap((module) =>
				module.bindings.filter(({ spec }) =>
					spec.id.includes('local-sun-shell'))
					.map((binding) => ({
						passId: pass.id,
						binding,
					}))),
		);
		const boundaryBinding = shellBindings.find(
			({ binding }) =>
				binding.spec.id === 'local-sun-shell-boundaries',
		);
		const expectedBoundaries = Array.from(Float32Array.from(
			owners.shellFactCache.boundaries,
		));

		expect(shellBindings.map(({ passId }) => passId)
			.every((id) => id === 'local-sun-primary-j1'))
			.toBeTrue();
		expect(boundaryBinding.binding.value.shape).toEqual([2049]);
		expect(boundaryBinding.binding.value.values)
			.toEqual(expectedBoundaries);
		expect(boundaryBinding.binding.value.values.length * 4)
			.toBe(8196);
		expect(plan.passes.flatMap(({ modules }) => modules)
			.flatMap(({ bindings }) => bindings)
			.filter(({ spec }) => spec.kind === 'data')
			.some(({ value }) => value.quantity.includes('held')))
			.toBeFalse();
	});

	it('assembles continuous direct L1 without a shell symbol or input field', () => {
		const owners = createOwners();
		const plan = createLocalSunCacheBuildPlan({
			...owners,
			domainSelection:
				createBoundedDomainSelection(owners.geometry),
			maximumScatteringOrder: 2,
		});
		const pass = plan.passes.find(
			({ id }) => id === 'local-sun-direct-l1',
		);
		const output = plan.fields.find(
			({ id }) => id === pass.output,
		);
		const shader = new CachePassAssembler().assemble(pass, output);

		expect(pass.inputs).toEqual([]);
		expect(shader.source).toContain(
			'cacheReusableBoundaryDistance(',
		);
		expect(shader.source).toContain(
			'cacheSourceDirection(samplePosition)',
		);
		expect(shader.source).toContain(
			'cachePathTransmittance(\n'
				+ '\t\t\tsamplePosition,',
		);
		expect(shader.source).toContain(
			'cacheSourceIrradiance(\n'
				+ '\t\t\t\tsamplePosition,',
		);
		expect(shader.source).not.toContain('Shell');
		expect(shader.source).not.toContain('shell');
	});

	it('routes omitted, zero, and nonzero ground through pure-order inputs', () => {
		const owners = createOwners();
		const domainSelection =
			createBoundedDomainSelection(owners.geometry);
		const omitted = createLocalSunCacheBuildPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 4,
		});
		const zero = createLocalSunCacheBuildPlan({
			...owners,
			domainSelection,
			groundBoundary: createReflectiveGround(0, 'zero-ground'),
			maximumScatteringOrder: 4,
		});
		const nonzero = createLocalSunCacheBuildPlan({
			...owners,
			domainSelection,
			groundBoundary:
				createReflectiveGround(0.25, 'nonzero-ground'),
			maximumScatteringOrder: 4,
		});

		expect(reflectiveInputs(omitted)).toEqual([
			['local-sun-l1'],
			['local-sun-l2'],
			['local-sun-l3'],
		]);
		for (const plan of [zero, nonzero]) {
			expect(reflectiveInputs(plan)).toEqual([
				['local-sun-l1'],
				['local-sun-l2', 'local-sun-l1'],
				['local-sun-l3', 'local-sun-l2'],
			]);
			expect(plan.passes.filter(({ kind }) => kind === 'scatter')
				.every(({ modules }) => modules.some(
					({ owner }) => owner === 'ground',
				))).toBeTrue();
		}
		expect(zero.descriptorDefinition.constructionIdentities.boundary)
			.not.toEqual(
				omitted.descriptorDefinition.constructionIdentities.boundary,
			);
		expect(nonzero.descriptorDefinition.constructionIdentities.boundary)
			.not.toEqual(
				zero.descriptorDefinition.constructionIdentities.boundary,
			);
	});

	it('publishes only replacement schema identities through the selected controller', () => {
		const owners = createOwners();
		const plan = createLocalSunCacheBuildPlan({
			...owners,
			domainSelection:
				createBoundedDomainSelection(owners.geometry),
			maximumScatteringOrder: 4,
		});

		expect(plan.identity.id).toBe(LOCAL_SUN_CACHE_PLAN_ID);
		expect(LOCAL_SUN_CACHE_PLAN_ID).toBe(
			'algorithm32-local-sun-cache-construction-v3',
		);
		expect(LOCAL_SUN_CACHE_FINGERPRINT_SCHEMA_REVISION).toBe(
			'algorithm32-local-sun-gpu-cache-fingerprint-v3',
		);
		expect(LOCAL_SUN_GPU_FIELD_PROVENANCE_IDENTITY).toBe(
			'algorithm32-local-sun-gpu-fields-v3',
		);
		expect(plan.fields.every(({ descriptor }) =>
			descriptor.id.endsWith('-field-v2')
			&& descriptor.provenanceIdentity
				=== LOCAL_SUN_GPU_FIELD_PROVENANCE_IDENTITY))
			.toBeTrue();
		expect(plan.descriptorDefinition.id).toMatch(/-gpu-cache-n4-v3$/u);
		expect(plan.descriptorDefinition.controls.id).toMatch(
			/-gpu-n4-controls-v2$/u,
		);
		expect(plan.descriptorDefinition.constructionIdentities.source.id)
			.toBe(
				'algorithm32-local-sun-light-source-cache-construction-v2',
			);
		expect(plan.descriptorDefinition.constructionIdentities.geometry.id)
			.toBe('algorithm32-flat-earth-cache-construction-v3');
		expect(plan.passes.flatMap(({ modules }) => modules)
			.filter(({ owner }) => owner === 'lightSource')
			.every(({ id }) => id.endsWith('-module-v2')))
			.toBeTrue();
		expect(plan.passes.flatMap(({ modules }) => modules)
			.filter(({ owner }) => owner === 'geometry')
			.every(({ id }) => id.endsWith('-module-v3')))
			.toBeTrue();

		const controller = owners.physicalSource.createCacheController({
			backend: /** @type {any} */ ({
				capabilities: {
					id: 'local-sun-plan-controller-capabilities',
				},
			}),
		});

		expect(controller.active).toBeNull();
		controller.dispose();
	});
});

function passGraph(plan) {
	return plan.passes.map((pass) => ({
		id: pass.id,
		kind: pass.kind,
		order: pass.order,
		inputs: pass.inputs,
		output: pass.output,
	}));
}

function findBinding(pass, id) {
	return pass.modules.flatMap(({ bindings }) => bindings)
		.find(({ spec }) => spec.id === id);
}

function reflectiveInputs(plan) {
	return plan.passes
		.filter(({ kind }) => kind === 'scatter')
		.map(({ inputs }) => inputs);
}

function createOwners() {
	const sourcePosition = {
		coordinates: [4_800_000, 0, 4_800_000],
		units: 'meters',
	};
	const geometry = new FlatEarthGeometry({
		observerPosition: {
			coordinates: [0, 0, 5],
			units: 'meters',
		},
		sourcePosition,
		topAltitude: { value: 100_000, units: 'meters' },
		cacheRadialMaximum: {
			value: 4_800_000,
			units: 'meters',
		},
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const physicalSource = new LocalSunLightSource({
		sourceKey: 'local-sun-plan-test',
		position: sourcePosition,
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
	});
	const shellFactCache = createLocalSunShellFactCache({
		sourceConfiguration: physicalSource.configuration,
	});
	const source = new LocalSunCacheSource({
		source: physicalSource,
		shellFactCache,
	});

	return {
		atmosphere,
		geometry,
		physicalSource,
		shellFactCache,
		source,
	};
}

function createBoundedDomainSelection(geometry) {
	return LocalSunConstructionDomainSelection.fromGeometry(geometry, {
		id: 'local-sun-plan-z2-rho2-paired-f34-w3',
		zCount: 2,
		rhoCount: 2,
		outgoingDirectionDomainOwner:
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
		radiancePackingId:
			'local-sun-plan-z2-rho2-paired-f34-radiance',
		scatteringDensityPackingId:
			'local-sun-plan-z2-rho2-w3-density',
	});
}

function createReflectiveGround(value, id) {
	const albedo = createSpectralPacket({
		quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
		units: SPECTRAL_UNITS.DIMENSIONLESS,
		basis: NATIVE_15_SPECTRAL_BASIS,
		values: Array(15).fill(value),
		provenanceIdentity: `${id}-albedo`,
	});

	return new UniformLambertianGroundBoundary({ id, albedo });
}
