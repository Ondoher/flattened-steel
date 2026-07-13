import {CanonicalAtmosphere, SphericalEarthGeometry} from '../../../../implementation/index.js';
import {CachePassAssembler} from '../../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../../implementation/canonical-atmosphere/consts.js';
import {UniformLambertianGroundBoundary} from '../../../../implementation/index.js';
import {
	createNativeExecutionProfile,
	NATIVE_15_SPECTRAL_BASIS,
} from '../../../../profiles/native-15/native-15-profile.js';
import {CacheBuildModules} from '../../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {DistantSunLightSource} from '../../DistantSunLightSource.js';
import {DistantSunCacheController} from '../DistantSunCacheController.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';

describe('distant-Sun executable GPU owner modules', /** Called by Jasmine to register the named test suite. */ () => {
	it('assembles source-owned physical J1 and direct L1 programs', /** Called by Jasmine to exercise the named behavior. */ () => {
		const plan = createControllerPlan({
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

	it('supplies Native48, W27, reflection-completed Fibonacci68, and source-owned direction data', /** Called by Jasmine to exercise the named behavior. */ () => {
		const plan = createControllerPlan({
			...createOwners(),
			maximumScatteringOrder: 2,
		});
		const primaryGeometry = moduleByOwner(plan.passes[0], 'geometry');
		const directGeometry = moduleByOwner(plan.passes[1], 'geometry');
		const scatterGeometry = moduleByOwner(plan.passes[2], 'geometry');
		const scatterSource = moduleByOwner(plan.passes[2], 'lightSource');

		expect(dataShape(primaryGeometry, 'spherical-geometry-position-nodes')).toEqual([48]);
		expect(dataShape(primaryGeometry, 'spherical-geometry-outgoing-directions')).toEqual([3, 4374]);
		expect(dataShape(directGeometry, 'spherical-geometry-incoming-directions')).toEqual([3, 68]);
		expect(dataShape(scatterGeometry, 'spherical-geometry-incoming-weights')).toEqual([68]);
		expect(scatterSource.provides).toContain('lightSource.direction');
		expect(
			scatterSource.bindings.filter(
				/**
				 * Called by Array.prototype.filter to test whether one collection value is retained.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({spec: fieldSpecification}) => fieldSpecification.id === 'distant-sun-source-direction',
			).length,
		).toBe(1);
	});

	it('packs reusable scalar transport taps in production query and layer order', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {atmosphere, geometry} = createOwners();
		const data = geometry.createTransportData({
			atmosphere,
			domains: DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
			directionToSource: [0, 1, 0],
			intervalCount: 1,
		});

		expect(data.queryCount).toBe(48 * 68);
		expect(data.tapCount).toBeGreaterThan(0);
		expect(data.sources.shape).toEqual([data.tapCount * 3, data.queryCount]);
		expect(data.coefficients.shape).toEqual([data.tapCount, data.queryCount, 15]);
		expect(data.sources.values.length).toBe(data.tapCount * data.queryCount * 3);
		expect(data.coefficients.values.length).toBe(data.tapCount * data.queryCount * 15);
		expect(
			data.sources.values.some(
				/**
				 * Called by Array.prototype.some to test one collection value for a matching condition.
				 * @param value - The value accepted by the operation.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (value, index) => index % 3 === 2 && value === 1,
			),
		).toBeTrue();
		expect(
			data.coefficients.values.some(
				/**
				 * Called by Array.prototype.some to test one collection value for a matching condition.
				 * @param value - The value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (value) => value > 0,
			),
		).toBeTrue();
	});

	it('packs the same transport algorithm over the reduced Native16/W9 lattice', /** Called by Jasmine to exercise the named behavior. */ () => {
		const domains = NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
		const {atmosphere, geometry} = createOwners(domains.positionCount);
		const data = geometry.createTransportData({
			atmosphere,
			domains,
			directionToSource: [0, 1, 0],
			intervalCount: 1,
		});
		const activeSources = [];

		for (let offset = 0; offset < data.sources.values.length; offset += 3) {
			if (data.sources.values[offset + 2] === 1) {
				activeSources.push({
					directionIndex: data.sources.values[offset],
					positionIndex: data.sources.values[offset + 1],
				});
			}
		}

		expect(data.queryCount).toBe(16 * 68);
		expect(data.sources.id).toContain(domains.id);
		expect(data.coefficients.id).toContain(domains.id);
		expect(activeSources.length).toBeGreaterThan(0);
		expect(
			activeSources.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({directionIndex}) =>
					Number.isInteger(directionIndex) &&
					directionIndex >= 0 &&
					directionIndex < domains.outgoingDirectionCount,
			),
		).toBeTrue();
		expect(
			activeSources.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({positionIndex}) =>
					Number.isInteger(positionIndex) && positionIndex >= 0 && positionIndex < domains.positionCount,
			),
		).toBeTrue();
	});

	it('assembles GPU-integrated spherical transport without packed transport data', /** Called by Jasmine to exercise the named behavior. */ () => {
		const plan = createControllerPlan({
			...createOwners(),
			maximumScatteringOrder: 4,
		});
		const shader = assemblePass(plan, new CachePassAssembler(), 'distant-sun-transport-j2-to-l2');

		expect(shader.source).toContain('CacheTransportRay cacheIntegratedTransportRay(');
		expect(shader.source).toContain('bool cacheIncomingRayBlockedByGround(');
		expect(shader.source).toContain('uCacheIncomingGroundContactMask');
		expect(shader.source).toContain(
			'float constantTerm = heightMeters\n' + '\t\t* (radiusMeters + uCacheGeometryBottomRadius);',
		);
		expect(shader.source).toContain('return halfLinearCoefficient < 0.0 && discriminant >= 0.0;');
		expect(shader.source).toContain('CachePositionStencil cacheConstructionPositionStencil(');
		expect(shader.source).toContain('CacheDirectionStencil cacheConstructionDirectionStencil(');
		expect(shader.source).toContain('cacheStoredScatteringDensity(');
		expect(shader.source).toContain('pointIndex <= CACHE_TRANSPORT_INTERVAL_COUNT');
		expect(shader.bindings.some(({spec}) => spec.id === 'spherical-geometry-transport-sources')).toBeFalse();
		expect(shader.bindings.some(({spec}) => spec.id === 'spherical-geometry-transport-coefficients')).toBeFalse();
		expect(
			shader.bindings.some(({spec}) => spec.id === 'spherical-geometry-incoming-ground-contact-mask'),
		).toBeTrue();
	});

	it('assembles direct and pure-radiance ground reflection through owner capabilities', /** Called by Jasmine to exercise the named behavior. */ () => {
		const plan = createControllerPlan({
			...createOwners(),
			groundBoundary: createGroundBoundary(),
			maximumScatteringOrder: 4,
		});
		const assembler = new CachePassAssembler();
		const secondOrderScatteringPass = passById(plan, 'distant-sun-scatter-l1-to-j2');
		const thirdOrderScatteringPass = passById(plan, 'distant-sun-scatter-l2-to-j3');
		const fourthOrderScatteringPass = passById(plan, 'distant-sun-scatter-l3-to-j4');
		const secondOrderScatteringDensity = assemblePass(plan, assembler, secondOrderScatteringPass.id);
		const thirdOrderScatteringDensity = assemblePass(plan, assembler, thirdOrderScatteringPass.id);
		const fourthOrderScatteringDensity = assemblePass(plan, assembler, fourthOrderScatteringPass.id);

		for (const shader of [
			secondOrderScatteringDensity,
			thirdOrderScatteringDensity,
			fourthOrderScatteringDensity,
		]) {
			expect(shader.source).toContain('float cacheGroundBrdf(');
			expect(shader.source).toContain('bool cacheGroundBoundaryHit(');
			expect(shader.source).toContain('float cacheFiniteSegmentTransmittance(');
			expect(shader.source).toContain('if (distanceMeters == 0.0) return 1.0;');
			expect(shader.source).toContain('float cacheSourceIrradiance(');
		}

		const j2Operation = moduleByOwner(secondOrderScatteringPass, 'transport').blocks[0].source;
		const j3Operation = moduleByOwner(thirdOrderScatteringPass, 'transport').blocks[0].source;
		const j4Operation = moduleByOwner(fourthOrderScatteringPass, 'transport').blocks[0].source;
		expect(j2Operation).toContain(
			'cacheSourceIrradiance(\n' + '\t\t\t\t\t\tgroundPositionMeters,\n' + '\t\t\t\t\t\ta32CacheWavelengthLayer',
		);
		expect(j2Operation).toContain('cacheSourceDirection(groundPositionMeters)');
		expect(j2Operation).toContain('* sourceCosine\n\t\t\t\t\t* groundBrdf;');
		expect(j3Operation).toContain(CacheBuildModules.fieldInputBindingName('distant-sun-l1'));
		expect(j4Operation).toContain(CacheBuildModules.fieldInputBindingName('distant-sun-l2'));
		expect(j3Operation).toContain('groundConstructionPositionIndices');
		expect(j3Operation).toContain('groundConstructionPositionWeights');
		expect(j3Operation).toContain('groundPositionTapIndex < 4');
		expect(j3Operation).toContain(').r * groundPositionWeight;');
		expect(j3Operation).toContain('cacheIncomingWeight(groundIncomingIndex)');
		expect(j3Operation).not.toContain('distant-sun-j-through');
		expect(j4Operation).not.toContain('distant-sun-j-through');
		expect(thirdOrderScatteringDensity.source).toContain('positionIndices = ivec4(positionIndex, 0, 0, 0);');
		expect(thirdOrderScatteringDensity.source).toContain('positionWeights = vec4(1.0, 0.0, 0.0, 0.0);');
	});

	it('keeps omitted-ground scatter modules free of reflective work', /** Called by Jasmine to exercise the named behavior. */ () => {
		const plan = createControllerPlan({
			...createOwners(),
			maximumScatteringOrder: 4,
		});
		const omittedGroundModules = [];

		for (const passIdentifier of [
			'distant-sun-scatter-l1-to-j2',
			'distant-sun-scatter-l2-to-j3',
			'distant-sun-scatter-l3-to-j4',
		]) {
			const pass = passById(plan, passIdentifier);
			const assembled = assemblePass(plan, new CachePassAssembler(), passIdentifier);
			const groundModule = moduleByOwner(pass, 'ground');
			omittedGroundModules.push(groundModule);
			expect(groundModule).toEqual({
				id: 'algorithm32-canonical-black-ground-scatter-module-v1',
				owner: 'ground',
				provides: ['ground.reflectance'],
				requires: [],
				blocks: [],
				bindings: [],
				contentHash: 'sha256:2efea10b56b1a9f7761f0ad47b705d6a77fd6bcb65dc2657e08328aa60f24daf',
			});
			expect(assembled.source).not.toContain('cacheGroundBoundaryHit(');
			expect(assembled.source).not.toContain('cacheFiniteSegmentTransmittance(');
			expect(assembled.source).not.toContain('cacheSourceIrradiance(');
		}

		expect(new Set(omittedGroundModules).size).toBe(3);
		for (let index = 1; index < omittedGroundModules.length; index += 1) {
			expect(omittedGroundModules[index].provides).not.toBe(omittedGroundModules[0].provides);
			expect(omittedGroundModules[index].requires).not.toBe(omittedGroundModules[0].requires);
			expect(omittedGroundModules[index].blocks).not.toBe(omittedGroundModules[0].blocks);
			expect(omittedGroundModules[index].bindings).not.toBe(omittedGroundModules[0].bindings);
		}
	});
});

/**
 * Called by this module to create one controller-owned plan for direct physical-module inspection.
 * @param request - The request accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createControllerPlan(request) {
	const {source, atmosphere, geometry, groundBoundary = null, maximumScatteringOrder} = request;
	const domains = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const model = /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			lightSource: source,
			atmosphere,
			geometry,
			groundBoundary,
			profile: createNativeExecutionProfile({
				lightSource: source,
				atmosphere,
				geometry,
				groundBoundary,
				observation: geometry.configuration.observation,
				domains: {
					positions: domains.positionDomain,
					incomingDirections: domains.incomingDirectionDomain,
					outgoingDirections: domains.outgoingDirectionDomain,
				},
				execution: {maximumScatteringOrder},
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

/**
 * Called by this module to create owners.
 * @param positionCount - The position count value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createOwners(positionCount = 48) {
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
	});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: {value: 2, units: 'meters'},
		observerUpDirection: [1, 0, 0],
		cacheAltitudeBinCount: positionCount,
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

	return {atmosphere, geometry, source};
}

/**
 * Called by this module to assemble pass.
 * @param plan - The plan value accepted by the operation.
 * @param assembler - The assembler value accepted by the operation.
 * @param passIdentifier - The pass identifier accepted by the operation.
 * @returns - The result produced by the operation.
 */
function assemblePass(plan, assembler, passIdentifier) {
	const pass = passById(plan, passIdentifier);
	const output = plan.fields.find(
		/**
		 * Called by Array.prototype.find to test one collection value for selection.
		 * @param input1 - The destructured input accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ ({id}) => id === pass.output,
	);
	return assembler.assemble(pass, output);
}

/**
 * Called by this module to pass by id.
 * @param plan - The plan value accepted by the operation.
 * @param passIdentifier - The pass identifier accepted by the operation.
 * @returns - The result produced by the operation.
 */
function passById(plan, passIdentifier) {
	return plan.passes.find(
		/**
		 * Called by Array.prototype.find to test one collection value for selection.
		 * @param input1 - The destructured input accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ ({id}) => id === passIdentifier,
	);
}

/**
 * Called by this module to module by owner.
 * @param pass - The pass value accepted by the operation.
 * @param owner - The owner value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function moduleByOwner(pass, owner) {
	return pass.modules.find(
		/**
		 * Called by Array.prototype.find to test one collection value for selection.
		 * @param module - The module value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (module) => module.owner === owner,
	);
}

/**
 * Called by this module to data shape.
 * @param module - The module value accepted by the operation.
 * @param bindingId - The binding id value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function dataShape(module, bindingId) {
	return module.bindings.find(
		/**
		 * Called by Array.prototype.find to test one collection value for selection.
		 * @param input1 - The destructured input accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ ({spec: fieldSpecification}) => fieldSpecification.id === bindingId,
	).value.shape;
}

/**
 * Called by this module to create ground boundary.
 * @returns - The result produced by the operation.
 */
function createGroundBoundary() {
	return new UniformLambertianGroundBoundary({
		id: 'gpu-owner-test-grass-ground',
		material: 'grass',
	});
}
