import { CanonicalAtmosphere } from '../../atmospheres/CanonicalAtmosphere.js';
import {
	BLACK_GROUND_BOUNDARY_IDENTITY,
} from '../../caches/ScatteringCacheDescriptor.js';
import {
	createCacheBuildModule,
	createCacheData,
} from '../../caches/gpu/cacheBuildContracts.js';
import { CachePassAssembler } from '../../caches/gpu/CachePassAssembler.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import {
	STAR_PARITY_DISTANT_SUN_CACHE_CONSTRUCTION_CONTROLS,
} from '../fixtures/star-parity-consts.js';
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
import { DistantSunLightSource } from '../DistantSunLightSource.js';
import {
	createDistantSunCacheBuildPlan,
} from '../distant-sun-cache-plan.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';

describe('distant-Sun GPU cache plan', () => {
	it('derives the exact structural N1 graph and only its relevant owner modules', () => {
		const owners = createOwners();
		const plan = createDistantSunCacheBuildPlan({
			...owners,
			maximumScatteringOrder: 1,
		});

		expect(plan.fields.map(({ id }) => id)).toEqual([
			'distant-sun-j1',
			'distant-sun-j-through-1',
		]);
		expect(passGraph(plan)).toEqual([
			{
				id: 'distant-sun-primary-j1',
				kind: 'primary-j1',
				order: 1,
				inputs: [],
				output: 'distant-sun-j1',
			},
			{
				id: 'distant-sun-accumulate-j1',
				kind: 'accumulate',
				order: 1,
				inputs: ['distant-sun-j1'],
				output: 'distant-sun-j-through-1',
			},
		]);
		expect(plan.passes[0].modules.map(({ owner }) => owner)).toEqual([
			'geometry',
			'atmosphere',
			'lightSource',
			'cache',
		]);
		expect(plan.passes[1].modules.map(({ owner }) => owner)).toEqual([
			'transport',
			'cache',
		]);
		expect(plan.passes.flatMap(({ modules }) => modules)
			.some(({ owner }) => owner === 'ground')).toBeFalse();
		expect(plan.result).toBe('distant-sun-j-through-1');
		expect(plan.identity.id)
			.toBe('algorithm32-distant-sun-cache-construction-v1');
		expect(plan.descriptorDefinition.constructionIdentities.source.id)
			.toBe('algorithm32-distant-sun-light-source-cache-construction-v1');
		expect(plan.identity.contentHash).not.toBe(
			plan.descriptorDefinition.constructionIdentities.source.contentHash,
		);
		expect(plan.descriptorDefinition.controls.maximumScatteringOrder).toBe(1);
		expect(plan.descriptorDefinition.controls.transportIntervalCount).toBe(15);
		expect(plan.descriptorDefinition.field.order).toEqual({
			kind: 'cumulative-through',
			value: 1,
			included: [1],
		});
		expect(plan.fields.map(({ storage }) => storage)).toEqual([
			{ format: 'R32F', width: 4374, height: 48, layers: 15 },
			{ format: 'R32F', width: 4374, height: 48, layers: 15 },
		]);
	});

	it('derives primary J1, direct L1, pure J2, and one explicit N2 accumulation', () => {
		const plan = createDistantSunCacheBuildPlan({
			...createOwners(),
			maximumScatteringOrder: 2,
		});

		expect(plan.fields.map(({ id }) => id)).toEqual([
			'distant-sun-j1',
			'distant-sun-l1',
			'distant-sun-j2',
			'distant-sun-j-through-2',
		]);
		expect(passGraph(plan)).toEqual([
			{
				id: 'distant-sun-primary-j1',
				kind: 'primary-j1',
				order: 1,
				inputs: [],
				output: 'distant-sun-j1',
			},
			{
				id: 'distant-sun-direct-l1',
				kind: 'direct-l1',
				order: 1,
				inputs: [],
				output: 'distant-sun-l1',
			},
			{
				id: 'distant-sun-scatter-l1-to-j2',
				kind: 'scatter',
				order: 2,
				inputs: ['distant-sun-l1'],
				output: 'distant-sun-j2',
			},
			{
				id: 'distant-sun-accumulate-j1-j2',
				kind: 'accumulate',
				order: 2,
				inputs: ['distant-sun-j1', 'distant-sun-j2'],
				output: 'distant-sun-j-through-2',
			},
		]);
		const scatterModules = plan.passes[2].modules;
		expect(scatterModules.map(({ owner }) => owner)).toEqual([
			'geometry',
			'atmosphere',
			'lightSource',
			'transport',
			'ground',
			'cache',
		]);
		expect(scatterModules.find(({ owner }) => owner === 'ground')?.provides)
			.toEqual(['ground.reflectance']);
		expect(plan.descriptorDefinition.constructionIdentities.boundary)
			.toBe(BLACK_GROUND_BOUNDARY_IDENTITY);
		expect(plan.result).toBe('distant-sun-j-through-2');

		const assembler = new CachePassAssembler();
		for (const pass of plan.passes) {
			const output = /** @type {CacheFieldSpec} */ (
				plan.fields.find(({ id }) => id === pass.output)
			);
			const shader = assembler.assemble(pass, output);
			expect(shader.output.id).toBe(pass.output);
			expect(shader.source).toContain('void main()');
		}
	});

	it('preserves the established default identities with an explicit default selection', () => {
		const owners = createOwners();
		const implicit = createDistantSunCacheBuildPlan({
			...owners,
			maximumScatteringOrder: 2,
		});
		const explicit = createDistantSunCacheBuildPlan({
			...owners,
			domainSelection:
				DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
			maximumScatteringOrder: 2,
		});

		expect(explicit).toEqual(implicit);
		expect(implicit.descriptorDefinition.id)
			.toBe('algorithm32-distant-sun-gpu-cache-n2-v1');
		expect(implicit.fields.map(({ descriptor }) => descriptor.id)).toEqual([
			'algorithm32-distant-sun-j1-field-v1',
			'algorithm32-distant-sun-l1-field-v1',
			'algorithm32-distant-sun-j2-field-v1',
			'algorithm32-distant-sun-j-through-2-field-v1',
		]);
		expect(implicit.fields.map(
			({ descriptor }) => descriptor.layout.id,
		)).toEqual([
			'algorithm32-distant-sun-w27-r32f-layout-v1',
			'algorithm32-distant-sun-fibonacci-34-r32f-layout-v1',
			'algorithm32-distant-sun-w27-r32f-layout-v1',
			'algorithm32-distant-sun-w27-r32f-layout-v1',
		]);
		const primaryGeometry = implicit.passes[0].modules[0];
		const directGeometry = implicit.passes[1].modules[0];
		expect(primaryGeometry.bindings.find(
			({ spec }) => spec.id === 'spherical-geometry-position-nodes',
		)?.value.id).toBe(
			'algorithm32-spherical-native-48-altitudes-v1',
		);
		expect(primaryGeometry.bindings.find(
			({ spec }) => spec.id === 'spherical-geometry-outgoing-directions',
		)?.value.id).toBe(
			'algorithm32-spherical-w27-directions-v1',
		);
		expect(directGeometry.bindings.find(
			({ spec }) => spec.id === 'spherical-geometry-incoming-directions',
		)?.value.id).toBe(
			'algorithm32-spherical-fibonacci-34-directions-v1',
		);
	});

	it('derives reduced Native16/W9 field and module facts without changing defaults', () => {
		const domains =
			NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
		const plan = createDistantSunCacheBuildPlan({
			...createOwners(domains.positionCount),
			domainSelection: domains,
			maximumScatteringOrder: 2,
		});
		const defaultPlan = createDistantSunCacheBuildPlan({
			...createOwners(),
			maximumScatteringOrder: 2,
		});

		expect(plan.fields.map(({ storage }) => storage)).toEqual([
			{ format: 'R32F', width: 486, height: 16, layers: 15 },
			{ format: 'R32F', width: 34, height: 16, layers: 15 },
			{ format: 'R32F', width: 486, height: 16, layers: 15 },
			{ format: 'R32F', width: 486, height: 16, layers: 15 },
		]);
		expect(plan.descriptorDefinition.field.positionDomain)
			.toBe(domains.positionDomain);
		expect(plan.descriptorDefinition.field.directionDomain)
			.toBe(domains.outgoingDirectionDomain);
		expect(plan.descriptorDefinition.incomingDirectionDomain)
			.toBe(domains.incomingDirectionDomain);
		expect(plan.identity.contentHash).not.toBe(
			defaultPlan.identity.contentHash,
		);
		const primaryGeometry = plan.passes[0].modules[0];
		expect(primaryGeometry.bindings.find(
			({ spec }) => spec.id === 'spherical-geometry-position-nodes',
		)?.value.shape).toEqual([16]);
		expect(primaryGeometry.bindings.find(
			({ spec }) =>
				spec.id === 'spherical-geometry-outgoing-directions',
		)?.value.shape).toEqual([3, 486]);
	});

	it('rejects a geometry whose configured position count differs from the selection', () => {
		expect(() => createDistantSunCacheBuildPlan({
			...createOwners(),
			domainSelection:
				NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
			maximumScatteringOrder: 1,
		})).toThrowError(
			/cacheAltitudeBinCount must match the selected construction position count/u,
		);
	});

	it('derives the exact N4 pure recurrence, cumulative chain, and owner graph', () => {
		const fixture = createN4Owners();
		const plan = createDistantSunCacheBuildPlan({
			...fixture.owners,
			maximumScatteringOrder: 4,
		});

		expect(plan.fields.map(({ id }) => id)).toEqual([
			'distant-sun-j1',
			'distant-sun-l1',
			'distant-sun-j2',
			'distant-sun-j-through-2',
			'distant-sun-l2',
			'distant-sun-j3',
			'distant-sun-j-through-3',
			'distant-sun-l3',
			'distant-sun-j4',
			'distant-sun-j-through-4',
		]);
		expect(passGraph(plan)).toEqual([
			{
				id: 'distant-sun-primary-j1',
				kind: 'primary-j1',
				order: 1,
				inputs: [],
				output: 'distant-sun-j1',
			},
			{
				id: 'distant-sun-direct-l1',
				kind: 'direct-l1',
				order: 1,
				inputs: [],
				output: 'distant-sun-l1',
			},
			{
				id: 'distant-sun-scatter-l1-to-j2',
				kind: 'scatter',
				order: 2,
				inputs: ['distant-sun-l1'],
				output: 'distant-sun-j2',
			},
			{
				id: 'distant-sun-accumulate-j1-j2',
				kind: 'accumulate',
				order: 2,
				inputs: ['distant-sun-j1', 'distant-sun-j2'],
				output: 'distant-sun-j-through-2',
			},
			{
				id: 'distant-sun-transport-j2-to-l2',
				kind: 'transport',
				order: 2,
				inputs: ['distant-sun-j2'],
				output: 'distant-sun-l2',
			},
			{
				id: 'distant-sun-scatter-l2-to-j3',
				kind: 'scatter',
				order: 3,
				inputs: ['distant-sun-l2'],
				output: 'distant-sun-j3',
			},
			{
				id: 'distant-sun-accumulate-j-through-2-j3',
				kind: 'accumulate',
				order: 3,
				inputs: ['distant-sun-j-through-2', 'distant-sun-j3'],
				output: 'distant-sun-j-through-3',
			},
			{
				id: 'distant-sun-transport-j3-to-l3',
				kind: 'transport',
				order: 3,
				inputs: ['distant-sun-j3'],
				output: 'distant-sun-l3',
			},
			{
				id: 'distant-sun-scatter-l3-to-j4',
				kind: 'scatter',
				order: 4,
				inputs: ['distant-sun-l3'],
				output: 'distant-sun-j4',
			},
			{
				id: 'distant-sun-accumulate-j-through-3-j4',
				kind: 'accumulate',
				order: 4,
				inputs: ['distant-sun-j-through-3', 'distant-sun-j4'],
				output: 'distant-sun-j-through-4',
			},
		]);
		expect(plan.passes.map(({ modules }) =>
			modules.map(({ owner }) => owner))).toEqual([
			['geometry', 'atmosphere', 'lightSource', 'cache'],
			['geometry', 'atmosphere', 'lightSource', 'cache'],
			['geometry', 'atmosphere', 'lightSource', 'transport', 'ground', 'cache'],
			['transport', 'cache'],
			['geometry', 'transport', 'cache'],
			['geometry', 'atmosphere', 'lightSource', 'transport', 'ground', 'cache'],
			['transport', 'cache'],
			['geometry', 'transport', 'cache'],
			['geometry', 'atmosphere', 'lightSource', 'transport', 'ground', 'cache'],
			['transport', 'cache'],
		]);
		expect(plan.fields.some(({ id }) => id === 'distant-sun-l4')).toBeFalse();
		expect(plan.result).toBe('distant-sun-j-through-4');
		expect(plan.descriptorDefinition.controls.maximumScatteringOrder).toBe(4);
		expect(plan.descriptorDefinition.controls.transportIntervalCount).toBe(15);
		expect(plan.descriptorDefinition.field.order).toEqual({
			kind: 'cumulative-through',
			value: 4,
			included: [1, 2, 3, 4],
		});
		expect(fixture.transportDataRequestCount()).toBe(1);
		expect(fixture.transportDataRequests[0].domains)
			.toBe(DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION);
		expect(fixture.transportDataRequests[0].intervalCount).toBe(15);
		expect(fixture.transportContexts.length).toBe(2);
		expect(fixture.transportContexts[0].transportData)
			.toBe(fixture.transportData);
		expect(fixture.transportContexts[1].transportData)
			.toBe(fixture.transportData);

		const fieldsById = new Map(plan.fields.map((field) => [field.id, field]));
		for (const pass of plan.passes.filter(
			({ kind }) => kind === 'scatter' || kind === 'transport',
		)) {
			expect(pass.inputs.length).toBe(1);
			expect(fieldsById.get(pass.inputs[0])?.descriptor.order.kind)
				.toBe('pure');
			expect(fieldsById.get(pass.output)?.descriptor.order.kind).toBe('pure');
		}

		const assembler = new CachePassAssembler();
		for (const pass of plan.passes) {
			const output = /** @type {CacheFieldSpec} */ (
				fieldsById.get(pass.output)
			);
			const shader = assembler.assemble(pass, output);
			expect(shader.output.id).toBe(pass.output);
			expect(shader.source).toContain('void main()');
		}
	});

	it('uses frozen 40-interval controls only for an explicit direct plan', () => {
		const fixture = createN4Owners();
		const controls =
			STAR_PARITY_DISTANT_SUN_CACHE_CONSTRUCTION_CONTROLS[4];
		const plan = createDistantSunCacheBuildPlan({
			...fixture.owners,
			maximumScatteringOrder: 4,
			constructionControls: controls,
		});

		expect(plan.descriptorDefinition.controls).toBe(controls);
		expect(fixture.transportDataRequests).toHaveSize(1);
		expect(fixture.transportDataRequests[0].intervalCount).toBe(40);

		expect(() => createDistantSunCacheBuildPlan({
			...createN4Owners().owners,
			maximumScatteringOrder: 4,
			constructionControls:
				STAR_PARITY_DISTANT_SUN_CACHE_CONSTRUCTION_CONTROLS[2],
		})).toThrowError(/must match the requested maximum scattering order/u);
	});

	it('threads one reduced selection through the complete N4 construction graph', () => {
		const domains =
			NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
		const fixture = createN4Owners(domains);
		const plan = createDistantSunCacheBuildPlan({
			...fixture.owners,
			domainSelection: domains,
			maximumScatteringOrder: 4,
		});

		expect(fixture.transportDataRequests).toHaveSize(1);
		expect(fixture.transportDataRequests[0].domains).toBe(domains);
		expect(fixture.transportContexts).toHaveSize(2);
		expect(fixture.transportContexts.every(
			(context) => context.domains === domains,
		)).toBeTrue();
		expect(plan.fields.find(
			({ id }) => id === 'distant-sun-j-through-4',
		)?.storage).toEqual({
			format: 'R32F',
			width: 486,
			height: 16,
			layers: 15,
		});
	});

	it('makes every N4 resource consumer and last-use lifetime explicit in the graph', () => {
		const plan = createDistantSunCacheBuildPlan({
			...createN4Owners().owners,
			maximumScatteringOrder: 4,
		});

		expect(resourceLifetimes(plan)).toEqual({
			'distant-sun-j1': {
				producer: 'distant-sun-primary-j1',
				consumers: ['distant-sun-accumulate-j1-j2'],
				lastConsumer: 'distant-sun-accumulate-j1-j2',
				retained: false,
			},
			'distant-sun-l1': {
				producer: 'distant-sun-direct-l1',
				consumers: ['distant-sun-scatter-l1-to-j2'],
				lastConsumer: 'distant-sun-scatter-l1-to-j2',
				retained: false,
			},
			'distant-sun-j2': {
				producer: 'distant-sun-scatter-l1-to-j2',
				consumers: [
					'distant-sun-accumulate-j1-j2',
					'distant-sun-transport-j2-to-l2',
				],
				lastConsumer: 'distant-sun-transport-j2-to-l2',
				retained: false,
			},
			'distant-sun-j-through-2': {
				producer: 'distant-sun-accumulate-j1-j2',
				consumers: ['distant-sun-accumulate-j-through-2-j3'],
				lastConsumer: 'distant-sun-accumulate-j-through-2-j3',
				retained: false,
			},
			'distant-sun-l2': {
				producer: 'distant-sun-transport-j2-to-l2',
				consumers: ['distant-sun-scatter-l2-to-j3'],
				lastConsumer: 'distant-sun-scatter-l2-to-j3',
				retained: false,
			},
			'distant-sun-j3': {
				producer: 'distant-sun-scatter-l2-to-j3',
				consumers: [
					'distant-sun-accumulate-j-through-2-j3',
					'distant-sun-transport-j3-to-l3',
				],
				lastConsumer: 'distant-sun-transport-j3-to-l3',
				retained: false,
			},
			'distant-sun-j-through-3': {
				producer: 'distant-sun-accumulate-j-through-2-j3',
				consumers: ['distant-sun-accumulate-j-through-3-j4'],
				lastConsumer: 'distant-sun-accumulate-j-through-3-j4',
				retained: false,
			},
			'distant-sun-l3': {
				producer: 'distant-sun-transport-j3-to-l3',
				consumers: ['distant-sun-scatter-l3-to-j4'],
				lastConsumer: 'distant-sun-scatter-l3-to-j4',
				retained: false,
			},
			'distant-sun-j4': {
				producer: 'distant-sun-scatter-l3-to-j4',
				consumers: ['distant-sun-accumulate-j-through-3-j4'],
				lastConsumer: 'distant-sun-accumulate-j-through-3-j4',
				retained: false,
			},
			'distant-sun-j-through-4': {
				producer: 'distant-sun-accumulate-j-through-3-j4',
				consumers: [],
				lastConsumer: null,
				retained: true,
			},
		});
	});

	it('uses explicit boundary modules and retains only the pure ground-illumination fields', () => {
		const owners = createN4Owners().owners;
		const omitted = createDistantSunCacheBuildPlan({
			...owners,
			maximumScatteringOrder: 4,
		});
		const reflectiveBoundary = createGroundBoundary(
			Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0.25),
			'reflective-ground-plan-test',
		);
		const reflectiveContexts = [];
		const reflectiveContributor = {
			describe: () => reflectiveBoundary.describe(),
			createCacheModule: (context) => {
				reflectiveContexts.push(context);
				return reflectiveBoundary.createCacheModule(context);
			},
		};
		const zeroBoundary = createGroundBoundary(
			Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0),
			'zero-ground-plan-test',
		);
		const reflective = createDistantSunCacheBuildPlan({
			...owners,
			groundBoundary: reflectiveContributor,
			maximumScatteringOrder: 4,
		});
		const explicitZero = createDistantSunCacheBuildPlan({
			...owners,
			groundBoundary: zeroBoundary,
			maximumScatteringOrder: 4,
		});

		for (const plan of [reflective, explicitZero]) {
			expect(plan.passes
				.filter(({ kind }) => kind === 'scatter')
				.map(({ inputs }) => inputs)).toEqual([
				['distant-sun-l1'],
				['distant-sun-l2', 'distant-sun-l1'],
				['distant-sun-l3', 'distant-sun-l2'],
			]);
			expect(plan.passes
				.filter(({ kind }) => kind === 'scatter')
				.flatMap(({ modules }) => modules)
				.filter(({ owner }) => owner === 'ground')
				.every(({ id }) =>
					id === 'algorithm32-uniform-lambertian-ground-cache-module-v1'))
				.toBeTrue();
			expect(plan.passes
				.filter(({ kind }) => kind === 'scatter')
				.some(({ inputs }) => inputs.some((input) =>
					input.includes('j-through')))).toBeFalse();
		}

		expect(reflective.descriptorDefinition.constructionIdentities.boundary)
			.toEqual(reflectiveBoundary.describe());
		expect(explicitZero.descriptorDefinition.constructionIdentities.boundary)
			.toEqual(zeroBoundary.describe());
		expect(reflective.identity.contentHash).not.toBe(omitted.identity.contentHash);
		expect(explicitZero.identity.contentHash).not.toBe(omitted.identity.contentHash);
		expect(explicitZero.identity.contentHash).not.toBe(reflective.identity.contentHash);
		expect(reflectiveContexts.map(({ groundReflection }) =>
			groundReflection?.kind === 'pure-radiance'
				? {
					kind: groundReflection.kind,
					illumination: groundReflection.illumination.id,
				}
				: groundReflection)).toEqual([
			{ kind: 'direct-source' },
			{ kind: 'pure-radiance', illumination: 'distant-sun-l1' },
			{ kind: 'pure-radiance', illumination: 'distant-sun-l2' },
		]);

		const lifetimes = resourceLifetimes(reflective);
		expect(lifetimes['distant-sun-l1']).toEqual({
			producer: 'distant-sun-direct-l1',
			consumers: [
				'distant-sun-scatter-l1-to-j2',
				'distant-sun-scatter-l2-to-j3',
			],
			lastConsumer: 'distant-sun-scatter-l2-to-j3',
			retained: false,
		});
		expect(lifetimes['distant-sun-l2']).toEqual({
			producer: 'distant-sun-transport-j2-to-l2',
			consumers: [
				'distant-sun-scatter-l2-to-j3',
				'distant-sun-scatter-l3-to-j4',
			],
			lastConsumer: 'distant-sun-scatter-l3-to-j4',
			retained: false,
		});
	});

	it('returns stable identities and typed owner bindings', () => {
		const owners = createOwners();
		const first = createDistantSunCacheBuildPlan({
			...owners,
			maximumScatteringOrder: 2,
		});
		const second = createDistantSunCacheBuildPlan({
			...owners,
			maximumScatteringOrder: 2,
		});
		const primaryModules = first.passes[0].modules;
		const atmosphere = /** @type {CacheBuildModule} */ (
			primaryModules.find(({ owner }) => owner === 'atmosphere')
		);
		const geometry = /** @type {CacheBuildModule} */ (
			primaryModules.find(({ owner }) => owner === 'geometry')
		);
		const source = /** @type {CacheBuildModule} */ (
			primaryModules.find(({ owner }) => owner === 'lightSource')
		);
		const wavelengthData = atmosphere.bindings
			.find(({ spec }) => spec.id === 'canonical-atmosphere-wavelengths')?.value;
		const positionData = geometry.bindings
			.find(({ spec }) => spec.id === 'spherical-geometry-position-nodes')?.value;

		expect(first.descriptorDefinition.constructionIdentities)
			.toEqual(second.descriptorDefinition.constructionIdentities);
		expect(first.passes.map(({ modules }) =>
			modules.map(({ contentHash }) => contentHash)))
			.toEqual(second.passes.map(({ modules }) =>
				modules.map(({ contentHash }) => contentHash)));
		expect(wavelengthData).toEqual(jasmine.objectContaining({
			quantity: 'wavelength',
			units: 'nanometers',
			shape: [15],
		}));
		expect(positionData).toEqual(jasmine.objectContaining({
			quantity: 'altitude-above-ground',
			units: 'meters',
			shape: [48],
		}));
		expect(source.bindings.find(
			({ spec }) => spec.id === 'distant-sun-source-irradiance',
		)?.value).toBe(NATIVE_SOURCE_IRRADIANCE_DENSITY);
	});

	it('depends on contributor contracts rather than concrete owner kinds', () => {
		const concrete = createOwners();
		const request = {
			source: {
				createCacheModule: (/** @type {CacheBuildContext} */ context) =>
					concrete.source.createCacheModule(context),
			},
			atmosphere: {
				createCacheModule: (/** @type {CacheBuildContext} */ context) =>
					concrete.atmosphere.createCacheModule(context),
			},
			geometry: {
				createCacheModule: (/** @type {CacheBuildContext} */ context) => {
					const module = concrete.geometry.createCacheModule(context);
					return createCacheBuildModule({
						id: `alternate-geometry-${context.kind}-module-v1`,
						owner: 'geometry',
						provides: module.provides,
						requires: module.requires,
						blocks: module.blocks,
						bindings: module.bindings.map((binding, index) => ({
							spec: {
								...binding.spec,
								id: `alternate-geometry-${index}`,
								name: `alternateGeometryBinding${index}`,
							},
							value: binding.value,
						})),
					});
				},
			},
			maximumScatteringOrder: 1,
		};
		const plan = createDistantSunCacheBuildPlan(request);

		expect(plan.result).toBe('distant-sun-j-through-1');
		expect(plan.passes[0].modules.map(({ owner }) => owner))
			.toEqual(['geometry', 'atmosphere', 'lightSource', 'cache']);
		expect(plan.passes[0].modules[0].id)
			.toBe('alternate-geometry-primary-j1-module-v1');
	});

	it('rejects unsupported orders at the planner API', () => {
		const owners = createOwners();

		expect(() => createDistantSunCacheBuildPlan(/** @type {DistantSunCacheBuildPlanRequest} */ (/** @type {unknown} */ ({
			...owners,
			maximumScatteringOrder: 3,
		})))).toThrowError(/supports maximum scattering order 1, 2, or 4/u);
	});

	it('rejects descriptor-shaped objects as executable domain selections', () => {
		expect(() => createDistantSunCacheBuildPlan(
			/** @type {DistantSunCacheBuildPlanRequest} */ (
				/** @type {unknown} */ ({
					...createOwners(),
					domainSelection: {
						id: 'descriptor-only-domain-selection',
					},
					maximumScatteringOrder: 1,
				})
			),
		)).toThrowError(/production construction-domain selection/u);
	});
});

/** @param {CacheBuildPlan} plan - Supplies one plan. */
function passGraph(plan) {
	return plan.passes.map(({ modules: _modules, ...pass }) => pass);
}

/**
 * Derive the executor-relevant lifetime facts encoded by one trusted graph.
 *
 * @param {CacheBuildPlan} plan - Supplies the source-owned plan.
 */
function resourceLifetimes(plan) {
	return Object.fromEntries(plan.fields.map((field) => {
		const producer = plan.passes.find(({ output }) => output === field.id);
		const consumers = plan.passes.filter(({ inputs }) =>
			inputs.includes(field.id));

		return [field.id, {
			producer: producer?.id,
			consumers: consumers.map(({ id }) => id),
			lastConsumer: consumers.at(-1)?.id ?? null,
			retained: field.id === plan.result,
		}];
	}));
}

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
		sourceTransmittanceIntervalCount:
			20,
	});
	const source = new DistantSunLightSource({
		directionToLight: [0, 1, 0],
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: { value: 0.004675, units: 'radians' },
	});

	return { atmosphere, geometry, source };
}

/** Create plan-only N4 owners without building the full physical tap payload. */
function createN4Owners(
	domains = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
) {
	const concrete = createOwners(domains.positionCount);
	const transportData = {
		queryCount: 1,
		tapCount: 1,
		sources: createCacheData({
			id: 'distant-sun-plan-test-transport-sources',
			quantity: 'transport-source-address-and-active-flag',
			units: '1',
			shape: [3, 1],
			values: [0, 0, 1],
		}),
		coefficients: createCacheData({
			id: 'distant-sun-plan-test-transport-coefficients',
			quantity: 'transport-path-coefficient',
			units: 'meters',
			shape: [1, 1, NATIVE_15_SPECTRAL_BASIS.channelCount],
			values: Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(1),
		}),
	};
	let requestCount = 0;
	const transportDataRequests = [];
	const transportContexts = [];
	const geometry = {
		createTransportData: (request) => {
			requestCount += 1;
			transportDataRequests.push(request);
			return transportData;
		},
		createCacheModule: (context) => {
			if (context.kind === 'transport') {
				transportContexts.push(context);
			}
			return concrete.geometry.createCacheModule(context);
		},
	};

	return {
		owners: {
			atmosphere: concrete.atmosphere,
			geometry,
			source: concrete.source,
		},
		transportData,
		transportDataRequests,
		transportContexts,
		transportDataRequestCount: () => requestCount,
	};
}

/**
 * Create one explicit native-basis Lambertian boundary for plan behavior.
 *
 * @param {readonly number[]} values - Supplies native spectral reflectance.
 * @param {string} id - Supplies the boundary and packet identity stem.
 */
function createGroundBoundary(values, id) {
	const albedo = createSpectralPacket({
		quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
		units: SPECTRAL_UNITS.DIMENSIONLESS,
		basis: NATIVE_15_SPECTRAL_BASIS,
		values,
		provenanceIdentity: `${id}-albedo`,
	});

	return new UniformLambertianGroundBoundary({ id, albedo });
}
