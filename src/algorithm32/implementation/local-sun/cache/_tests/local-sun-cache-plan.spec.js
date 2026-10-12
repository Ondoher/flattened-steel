import {
	CanonicalAtmosphere,
	FlatEarthGeometry,
	UniformLambertianGroundBoundary,
} from '../../../../implementation/index.js';
import {CachePassAssembler} from '../../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../../implementation/canonical-atmosphere/consts.js';
import {CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/direction/cubed-sphere/consts.js';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/direction/fibonacci/consts.js';
import {
	createNativeExecutionProfile,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../../../profiles/native-15/native-15-profile.js';
import {LocalSunShellFactCache} from '../LocalSunShellFactCache.js';
import {LocalSunCacheController} from '../LocalSunCacheController.js';
import {
	LOCAL_SUN_CACHE_PLAN_ID,
	LOCAL_SUN_CACHE_REUSE_KEY_SCHEMA_REVISION,
	LOCAL_SUN_CONSTRUCTION_DOMAIN_ID,
	LOCAL_SUN_RADIANCE_PACKING_ID,
	LOCAL_SUN_SCATTERING_DENSITY_PACKING_ID,
} from '../consts.js';
import {LocalSunCacheSource} from '../LocalSunCacheSource.js';
import LocalSunConstructionDomainSelection from '../LocalSunConstructionDomainSelection.js';
import {LocalSunLightSource} from '../../LocalSunLightSource.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../../../distant-sun/cache/consts.js';
import {SpectralBasis, SPECTRAL_SAMPLE_SEMANTICS} from '../../../../spectral-values/index.js';

describe('local-Sun GPU cache plan', /** Called by Jasmine to register the named test suite. */ () => {
	it('derives fresh default and override construction-domain selections', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {geometry} = createOwners();
		const first = LocalSunConstructionDomainSelection.fromGeometry(geometry);
		const second = LocalSunConstructionDomainSelection.fromGeometry(geometry);
		const overridden = LocalSunConstructionDomainSelection.fromGeometry(geometry, {
			zCount: 2,
			rhoCount: 2,
		});

		expect(first).not.toBe(second);
		expect(first.positionDomain).not.toBe(second.positionDomain);
		expect(first.radiancePacking).not.toBe(second.radiancePacking);
		expect(first.scatteringDensityPacking).not.toBe(second.scatteringDensityPacking);
		expect(first.id).toBe(LOCAL_SUN_CONSTRUCTION_DOMAIN_ID);
		expect(first.incomingDirectionDomain).toBe(REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER);
		expect(first.incomingDirectionDomain).toBe(
			DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION.incomingDirectionDomain,
		);
		expect(first.incomingUnitVectors).toBe(REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors);
		expect(first.incomingIntegrationWeights).toBe(
			REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.integrationWeights,
		);
		expect(first.radiancePacking.id).toBe(LOCAL_SUN_RADIANCE_PACKING_ID);
		expect(first.scatteringDensityPacking.id).toBe(LOCAL_SUN_SCATTERING_DENSITY_PACKING_ID);
		expect(overridden.id).toBe('algorithm32-local-sun-z2-rho2-reflection-completed-fibonacci68-w27-v1');
		expect(overridden.radiancePacking.id).toBe(
			'algorithm32-local-sun-z2-rho2-reflection-completed-fibonacci68-radiance-packing-v1',
		);
		expect(overridden.scatteringDensityPacking.id).toBe(
			'algorithm32-local-sun-z2-rho2-w27-scattering-density-packing-v1',
		);
	});

	it('constructs a direct-40 local profile adapter with exact packing round trips', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {geometry} = createOwners();
		const native = LocalSunConstructionDomainSelection.fromGeometry(geometry, {zCount: 2, rhoCount: 2});
		const basis = new SpectralBasis({
			id: 'test-local-direct-40-basis',
			semantics: SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
			channels: Array.from({length: 40}, (_unused, index) => ({
				id: `sample-${index}`,
				center: {value: 360 + index * 10, units: 'nanometers'},
				width: {value: 10, units: 'nanometers'},
			})),
		});
		const profile = /** @type {Algorithm32ExecutionProfile} */ (
			/** @type {unknown} */ ({
				kind: 'algorithm32-execution-profile',
				id: 'test-local-direct-40-profile',
				spectral: {basis},
				domains: {
					positions: native.positionDomain,
					incomingDirections: native.incomingDirectionDomain,
					outgoingDirections: native.outgoingDirectionDomain,
				},
			})
		);
		const selection = LocalSunConstructionDomainSelection.fromProfile(profile);
		const coordinates = {
			directionIndex: selection.outgoingDirectionCount - 1,
			positionIndex: selection.positionCount - 1,
			wavelengthIndex: 39,
		};
		const offset = selection.scatteringDensityPacking.offset(coordinates);

		expect(selection.spectralBasis).toBe(basis);
		expect(selection.spectralChannelCount).toBe(40);
		expect(selection.radiancePacking.wavelengthCount).toBe(40);
		expect(selection.scatteringDensityPacking.coordinatesAt(offset)).toEqual(coordinates);
	});

	it('emits the exact N1, N2, and N4 replacement graphs', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owners = createOwners();
		const domainSelection = createBoundedDomainSelection(owners.geometry);
		/**
		 * Called by build plan to build plan.
		 * @param maximumScatteringOrder - The maximum scattering order value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ const buildPlan = (maximumScatteringOrder) =>
			createPlan({
				...owners,
				domainSelection,
				maximumScatteringOrder,
			});
		const firstOrderResult = buildPlan(1);
		const secondOrderResult = buildPlan(2);
		const fourthOrderResult = buildPlan(4);

		expect(passGraph(firstOrderResult)).toEqual([
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
		expect(passGraph(secondOrderResult)).toEqual([
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
		expect(
			fourthOrderResult.passes.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({id}) => id,
			),
		).toEqual([
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
		expect([firstOrderResult.result, secondOrderResult.result, fourthOrderResult.result]).toEqual([
			'local-sun-j-through-1',
			'local-sun-j-through-2',
			'local-sun-j-through-4',
		]);
		expect(
			fourthOrderResult.passes
				.filter(
					/**
					 * Called by Array.prototype.filter to test whether one collection value is retained.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({kind}) => kind === 'transport' || kind === 'scatter',
				)
				.flatMap(
					/**
					 * Called by Array.prototype.flatMap to transform and flatten one collection value.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({inputs}) => inputs,
				)
				.some(
					/**
					 * Called by Array.prototype.some to test one collection value for a matching condition.
					 * @param id - The id value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (id) => id.includes('j-through'),
				),
		).toBeFalse();
	});

	it('builds both N4 transport passes from fused GPU contributors with zero packed payload', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owners = createOwners();
		const domainSelection = createBoundedDomainSelection(owners.geometry);

		const firstOrderResult = createPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 1,
		});
		const secondOrderResult = createPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 2,
		});
		expect(firstOrderResult.resources.packedTransportData.value).toBe(0);
		expect(secondOrderResult.resources.packedTransportData.value).toBe(0);

		const fourthOrderResult = createPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 4,
		});
		const transportPasses = fourthOrderResult.passes.filter(
			/**
			 * Called by Array.prototype.filter to test whether one collection value is retained.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ ({kind}) => kind === 'transport',
		);

		expect(transportPasses.length).toBe(2);
		for (const pass of transportPasses) {
			expect(pass.modules.map(({owner}) => owner)).toEqual(['geometry', 'atmosphere', 'transport', 'cache']);
			const output = fourthOrderResult.fields.find(({id}) => id === pass.output);
			const shader = new CachePassAssembler().assemble(pass, output);
			expect(shader.source).toContain('cacheIntegratedTransportRay(');
			expect(shader.source).toContain('cacheExtinction(');
			expect(shader.source).toContain('cacheConstructionPositionStencil(');
			expect(shader.source).toContain('cacheConstructionDirectionStencil(');
			expect(shader.source).toContain('cacheStoredScatteringDensity(');
		}
		expect(fourthOrderResult.resources.packedTransportData).toEqual({value: 0, units: 'bytes'});
	});

	it('reports selected-domain source, field, and packed-transport payloads', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owners = createOwners();
		const domains = LocalSunConstructionDomainSelection.fromGeometry(owners.geometry);
		const scatteringFieldStorage =
			domains.positionCount *
			domains.outgoingDirectionCount *
			domains.spectralChannelCount *
			Float32Array.BYTES_PER_ELEMENT;
		const radianceFieldStorage =
			domains.positionCount *
			domains.incomingDirectionCount *
			domains.spectralChannelCount *
			Float32Array.BYTES_PER_ELEMENT;
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
		expect(radianceFieldStorage).toBe(1_162_800);
		expect(4 * scatteringFieldStorage + 3 * radianceFieldStorage).toBe(302_670_000);
	});

	it('binds the 2,049 R32F boundaries only to shell-held J1', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owners = createOwners();
		const domainSelection = createBoundedDomainSelection(owners.geometry);
		const plan = createPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 4,
		});
		const shellBindings = plan.passes.flatMap(
			/**
			 * Called by Array.prototype.flatMap to transform and flatten one collection value.
			 * @param pass - The pass value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (pass) =>
				pass.modules.flatMap(
					/**
					 * Called by Array.prototype.flatMap to transform and flatten one collection value.
					 * @param module - The module value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (module) =>
						module.bindings
							.filter(
								/**
								 * Called by Array.prototype.filter to test whether one collection value is retained.
								 * @param input1 - The destructured input accepted by the operation.
								 * @returns - The callback result returned to its caller.
								 */ ({spec: fieldSpecification}) => fieldSpecification.id.includes('local-sun-shell'),
							)
							.map(
								/**
								 * Called by Array.prototype.map to transform one collection value.
								 * @param binding - The binding value accepted by the operation.
								 * @returns - The callback result returned to its caller.
								 */ (binding) => ({
									passId: pass.id,
									binding,
								}),
							),
				),
		);
		const boundaryBinding = shellBindings.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ ({binding}) => binding.spec.id === 'local-sun-shell-boundaries',
		);
		const expectedBoundaries = Array.from(Float32Array.from(owners.shellFactCache.boundaries));

		expect(
			shellBindings
				.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({passId: passIdentifier}) => passIdentifier,
				)
				.every(
					/**
					 * Called by Array.prototype.every to test one collection value against the shared condition.
					 * @param id - The id value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (id) => id === 'local-sun-primary-j1',
				),
		).toBeTrue();
		expect(boundaryBinding.binding.value.shape).toEqual([2049]);
		expect(boundaryBinding.binding.value.values).toEqual(expectedBoundaries);
		expect(boundaryBinding.binding.value.values.length * 4).toBe(8196);
		expect(
			plan.passes
				.flatMap(
					/**
					 * Called by Array.prototype.flatMap to transform and flatten one collection value.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({modules}) => modules,
				)
				.flatMap(
					/**
					 * Called by Array.prototype.flatMap to transform and flatten one collection value.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({bindings}) => bindings,
				)
				.filter(
					/**
					 * Called by Array.prototype.filter to test whether one collection value is retained.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({spec: fieldSpecification}) => fieldSpecification.kind === 'data',
				)
				.some(
					/**
					 * Called by Array.prototype.some to test one collection value for a matching condition.
					 * @param value1 - The value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({value}) => value.quantity.includes('held'),
				),
		).toBeFalse();
	});

	it('assembles continuous direct L1 without a shell symbol or input field', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owners = createOwners();
		const plan = createPlan({
			...owners,
			domainSelection: createBoundedDomainSelection(owners.geometry),
			maximumScatteringOrder: 2,
		});
		const pass = plan.passes.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ ({id}) => id === 'local-sun-direct-l1',
		);
		const output = plan.fields.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ ({id}) => id === pass.output,
		);
		const shader = new CachePassAssembler().assemble(pass, output);

		expect(pass.inputs).toEqual([]);
		expect(shader.source).toContain('cacheReusableBoundaryDistance(');
		expect(shader.source).toContain('cacheSourceDirection(samplePosition)');
		expect(shader.source).toContain('cachePathTransmittance(\n' + '\t\t\tsamplePosition,');
		expect(shader.source).toContain('cacheSourceIrradiance(\n' + '\t\t\t\tsamplePosition,');
		expect(shader.source).not.toContain('Shell');
		expect(shader.source).not.toContain('shell');
	});

	it('routes omitted and grass ground through pure-order inputs', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owners = createOwners();
		const domainSelection = createBoundedDomainSelection(owners.geometry);
		const omitted = createPlan({
			...owners,
			domainSelection,
			maximumScatteringOrder: 4,
		});
		const grass = createPlan({
			...owners,
			domainSelection,
			groundBoundary: createReflectiveGround('grass-ground'),
			maximumScatteringOrder: 4,
		});
		const omittedGroundModules = omitted.passes
			.filter(
				/**
				 * Called by Array.prototype.filter to test whether one collection value is retained.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({kind}) => kind === 'scatter',
			)
			.flatMap(
				/**
				 * Called by Array.prototype.flatMap to transform and flatten one collection value.
				 * @param pass - The pass value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (pass) =>
					pass.modules.filter(
						/**
						 * Called by Array.prototype.filter to test whether one collection value is retained.
						 * @param input1 - The destructured input accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ ({owner}) => owner === 'ground',
					),
			);

		expect(reflectiveInputs(omitted)).toEqual([['local-sun-l1'], ['local-sun-l2'], ['local-sun-l3']]);
		expect(
			omittedGroundModules.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({id}) => id,
			),
		).toEqual(Array(3).fill('algorithm32-canonical-black-ground-scatter-module-v1'));
		expect(
			omittedGroundModules.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({contentHash}) => contentHash,
			),
		).toEqual(Array(3).fill('sha256:2efea10b56b1a9f7761f0ad47b705d6a77fd6bcb65dc2657e08328aa60f24daf'));
		expect(new Set(omittedGroundModules).size).toBe(3);
		expect(
			omittedGroundModules.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({provides}) => provides.length === 1 && provides[0] === 'ground.reflectance',
			),
		).toBeTrue();
		for (const plan of [grass]) {
			expect(reflectiveInputs(plan)).toEqual([
				['local-sun-l1'],
				['local-sun-l2', 'local-sun-l1'],
				['local-sun-l3', 'local-sun-l2'],
			]);
			expect(
				plan.passes
					.filter(
						/**
						 * Called by Array.prototype.filter to test whether one collection value is retained.
						 * @param input1 - The destructured input accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ ({kind}) => kind === 'scatter',
					)
					.every(
						/**
						 * Called by Array.prototype.every to test one collection value against the shared condition.
						 * @param input1 - The destructured input accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ ({modules}) =>
							modules.some(
								/**
								 * Called by Array.prototype.some to test one collection value for a matching condition.
								 * @param input1 - The destructured input accepted by the operation.
								 * @returns - The callback result returned to its caller.
								 */ ({owner}) => owner === 'ground',
							),
					),
			).toBeTrue();
		}
		expect(grass.identity.contentHash).not.toBe(omitted.identity.contentHash);
	});

	it('publishes only replacement schema identities through the selected controller', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owners = createOwners();
		const plan = createPlan({
			...owners,
			domainSelection: createBoundedDomainSelection(owners.geometry),
			maximumScatteringOrder: 4,
		});

		expect(plan.identity.id).toBe(LOCAL_SUN_CACHE_PLAN_ID);
		expect(LOCAL_SUN_CACHE_PLAN_ID).toBe('algorithm32-local-sun-cache-construction-v4');
		expect(LOCAL_SUN_CACHE_REUSE_KEY_SCHEMA_REVISION).toBe('algorithm32-local-sun-gpu-cache-reuse-key-v4');
		expect(
			plan.fields.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({id, storage}) =>
					typeof id === 'string' &&
					storage.format === 'R32F' &&
					storage.width > 0 &&
					storage.height > 0 &&
					storage.layers === 15,
			),
		).toBeTrue();
		expect(plan.result).toBe('local-sun-j-through-4');
		expect(plan.identity.contentHash).toMatch(/^sha256:/u);
		expect(
			plan.passes
				.flatMap(
					/**
					 * Called by Array.prototype.flatMap to transform and flatten one collection value.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({modules}) => modules,
				)
				.filter(
					/**
					 * Called by Array.prototype.filter to test whether one collection value is retained.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({owner}) => owner === 'lightSource',
				)
				.every(
					/**
					 * Called by Array.prototype.every to test one collection value against the shared condition.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({id}) => id.endsWith('-module-v2'),
				),
		).toBeTrue();
		expect(
			plan.passes
				.flatMap(
					/**
					 * Called by Array.prototype.flatMap to transform and flatten one collection value.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({modules}) => modules,
				)
				.filter(
					/**
					 * Called by Array.prototype.filter to test whether one collection value is retained.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({owner}) => owner === 'geometry',
				)
				.every(
					/**
					 * Called by Array.prototype.every to test one collection value against the shared condition.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ({id}) => id.endsWith('-module-v4'),
				),
		).toBeTrue();

		const controller = owners.physicalSource.createCacheController({
			model: createModel(owners, LocalSunConstructionDomainSelection.fromGeometry(owners.geometry), 4),
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

/**
 * Called by this module to create plan.
 * @param request - The request accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createPlan(request) {
	const model = createModel(request, request.domainSelection, request.maximumScatteringOrder, request.groundBoundary);
	const controller = new LocalSunCacheController({
		model,
		source: request.source,
		backend: /** @type {CacheGpuBackend} */ ({
			capabilities: {
				id: 'local-sun-cache-plan-test-capabilities',
			},
		}),
	});

	try {
		return controller.createBuildPlan();
	} finally {
		controller.dispose();
	}
}

/**
 * Called by this module to create the immutable model retained by one plan controller.
 * @param owners - The physical and cache owners.
 * @param domains - The executable construction domains.
 * @param maximumScatteringOrder - The requested cumulative scattering order.
 * @param groundBoundary - The optional ground boundary.
 * @returns - The aggregate model double.
 */
function createModel(owners, domains, maximumScatteringOrder, groundBoundary = null) {
	return /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			lightSource: owners.physicalSource,
			atmosphere: owners.atmosphere,
			geometry: owners.geometry,
			groundBoundary,
			profile: createNativeExecutionProfile({
				lightSource: owners.physicalSource,
				atmosphere: owners.atmosphere,
				geometry: owners.geometry,
				groundBoundary,
				observation: owners.geometry.configuration.observation,
				domains: {
					positions: domains.positionDomain,
					incomingDirections: domains.incomingDirectionDomain,
					outgoingDirections: domains.outgoingDirectionDomain,
				},
				execution: {maximumScatteringOrder},
			}),
		})
	);
}

/**
 * Called by this module to pass graph.
 * @param plan - The plan value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function passGraph(plan) {
	return plan.passes.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param pass - The pass value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (pass) => ({
			id: pass.id,
			kind: pass.kind,
			order: pass.order,
			inputs: pass.inputs,
			output: pass.output,
		}),
	);
}

/**
 * Called by this module to reflective inputs.
 * @param plan - The plan value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function reflectiveInputs(plan) {
	return plan.passes
		.filter(
			/**
			 * Called by Array.prototype.filter to test whether one collection value is retained.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ ({kind}) => kind === 'scatter',
		)
		.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ ({inputs}) => inputs,
		);
}

/**
 * Called by this module to create owners.
 * @returns - The result produced by the operation.
 */
function createOwners() {
	const geometry = new FlatEarthGeometry({
		observerPosition: {
			coordinates: [0, 0, 5],
			units: 'meters',
		},
		topAltitude: {value: 100_000, units: 'meters'},
		localLightSourceHeight: {value: 4_800_000, units: 'meters'},
		projectionRadius: {value: 48_000_000, units: 'meters'},
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
	});
	const physicalSource = new LocalSunLightSource({
		sourceKey: 'local-sun-plan-test',
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
	geometry.configureLightSource({
		lightSource: physicalSource,
		observation: {
			instant: '2026-03-20T12:00:00.000Z',
			location: {
				latitude: {value: -0.27940210679735955, units: 'degrees'},
				longitude: {value: -1.5903827852862762, units: 'degrees'},
			},
		},
	});
	const shellFactCache = new LocalSunShellFactCache({
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

/**
 * Called by this module to create bounded domain selection.
 * @param geometry - The geometry value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createBoundedDomainSelection(geometry) {
	return LocalSunConstructionDomainSelection.fromGeometry(geometry, {
		id: 'local-sun-plan-z2-rho2-paired-rotated-f68-w3',
		zCount: 2,
		rhoCount: 2,
		outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
		radiancePackingId: 'local-sun-plan-z2-rho2-paired-rotated-f68-radiance',
		scatteringDensityPackingId: 'local-sun-plan-z2-rho2-w3-density',
	});
}

/**
 * Called by this module to create reflective ground.
 * @param id - The id value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createReflectiveGround(id) {
	return new UniformLambertianGroundBoundary({id, material: 'grass'});
}
