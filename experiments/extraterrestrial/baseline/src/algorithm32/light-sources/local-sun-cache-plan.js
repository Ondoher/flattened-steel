import {
	createCacheConstructionControlsDescriptor,
} from '../caches/CacheConstructionControlsDescriptor.js';
import {
	DIRECTIONAL_FIELD_QUANTITIES,
	DIRECTIONAL_FIELD_UNITS,
	DIRECTION_DOMAIN_ROLES,
	createDirectionalSpectralFieldDescriptor,
} from '../caches/DirectionalSpectralFieldDescriptor.js';
import {
	BLACK_GROUND_BOUNDARY_IDENTITY,
} from '../caches/ScatteringCacheDescriptor.js';
import { createScalarArrayTextureLayout } from
	'../caches/ScalarArrayTextureLayout.js';
import { CacheOperations } from '../caches/gpu/CacheOperations.js';
import {
	createCanonicalBlackGroundCacheModule,
} from '../caches/gpu/canonical-black-ground.js';
import {
	createCacheBuildModule,
	createCacheOwnerIdentity,
	createCachePlanIdentity,
} from '../caches/gpu/cacheBuildContracts.js';
import LocalSunConstructionDomainSelectionOwner from
	'./LocalSunConstructionDomainSelection.js';
import {
	assertLocalSunGeometryPairing,
} from './local-sun-geometry-pairing.js';
import {
	LOCAL_SUN_CACHE_PLAN_ID,
	LOCAL_SUN_GPU_FIELD_PROVENANCE_IDENTITY,
	LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
} from './local-sun-consts.js';

/**
 * Create executable storage and descriptive layouts from one local lattice.
 *
 * @param {LocalSunConstructionDomainSelection} domains - Supplies domains.
 * @returns {{
 *   scattering: Readonly<{
 *     directionDomain: DirectionDomainDescriptor,
 *     storage: CacheFieldStorage,
 *     layout: ScalarArrayTextureLayoutDescriptor,
 *   }>,
 *   radiance: Readonly<{
 *     directionDomain: DirectionDomainDescriptor,
 *     storage: CacheFieldStorage,
 *     layout: ScalarArrayTextureLayoutDescriptor,
 *   }>,
 * }} The field-domain facts.
 */
function createFieldDomainFacts(domains) {
	/** @type {CacheFieldStorage} */
	const scatteringStorage = {
		format: 'R32F',
		width: domains.outgoingDirectionCount,
		height: domains.positionCount,
		layers: domains.spectralChannelCount,
	};
	/** @type {CacheFieldStorage} */
	const radianceStorage = {
		format: 'R32F',
		width: domains.incomingDirectionCount,
		height: domains.positionCount,
		layers: domains.spectralChannelCount,
	};

	return {
		scattering: {
			directionDomain: domains.outgoingDirectionDomain,
			storage: scatteringStorage,
			layout: createScalarArrayTextureLayout({
				id: `${domains.id}-outgoing-r32f-layout-v1`,
				directionCount: scatteringStorage.width,
				positionCount: scatteringStorage.height,
				wavelengthCount: scatteringStorage.layers,
			}),
		},
		radiance: {
			directionDomain: domains.incomingDirectionDomain,
			storage: radianceStorage,
			layout: createScalarArrayTextureLayout({
				id: `${domains.id}-incoming-r32f-layout-v1`,
				directionCount: radianceStorage.width,
				positionCount: radianceStorage.height,
				wavelengthCount: radianceStorage.layers,
			}),
		},
	};
}

/**
 * Create one source-owned GPU field specification.
 *
 * @param {Readonly<{
 *   id: string,
 *   quantity: "spectral-radiance-density" | "spectral-scattering-density",
 *   units: "W m^-2 sr^-1 nm^-1" | "W m^-3 sr^-1 nm^-1",
 *   directionRole: "incoming-radiance" | "outgoing-scattering-density",
 *   directionDomain: DirectionDomainDescriptor,
 *   storage: CacheFieldStorage,
 *   layout: ScalarArrayTextureLayoutDescriptor,
 *   order: SpectralFieldOrder,
 *   domains: LocalSunConstructionDomainSelection,
 * }>} definition - Supplies logical field facts.
 * @returns {CacheFieldSpec} The field specification.
 */
function createFieldSpec(definition) {
	const descriptor = /** @type {GpuCacheFieldDescriptor} */ (
		createDirectionalSpectralFieldDescriptor({
			id: `${definition.domains.id}-${definition.id}-field-v2`,
			quantity: definition.quantity,
			units: definition.units,
			directionRole: definition.directionRole,
			basis: definition.domains.spectralBasis,
			positionDomain: definition.domains.positionDomain,
			directionDomain: definition.directionDomain,
			precision: 'binary32',
			layout: definition.layout,
			order: definition.order,
			provenanceIdentity: LOCAL_SUN_GPU_FIELD_PROVENANCE_IDENTITY,
		})
	);

	return {
		id: definition.id,
		storage: definition.storage,
		descriptor,
	};
}

/**
 * Create one pure local-Sun scattering-density field.
 *
 * @param {1 | 2 | 3 | 4} order - Supplies pure scattering order.
 * @param {LocalSunConstructionDomainSelection} domains - Supplies domains.
 * @param {ReturnType<typeof createFieldDomainFacts>} fieldDomains - Supplies shapes.
 * @returns {CacheFieldSpec} The field.
 */
function createPureScatteringField(order, domains, fieldDomains) {
	return createFieldSpec({
		id: `local-sun-j${order}`,
		quantity: DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY,
		units: DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY,
		directionRole: DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY,
		directionDomain: fieldDomains.scattering.directionDomain,
		storage: fieldDomains.scattering.storage,
		layout: fieldDomains.scattering.layout,
		order: { kind: 'pure', value: order },
		domains,
	});
}

/**
 * Create one pure transported local-Sun radiance field.
 *
 * @param {1 | 2 | 3} order - Supplies pure radiance order.
 * @param {LocalSunConstructionDomainSelection} domains - Supplies domains.
 * @param {ReturnType<typeof createFieldDomainFacts>} fieldDomains - Supplies shapes.
 * @returns {CacheFieldSpec} The field.
 */
function createPureRadianceField(order, domains, fieldDomains) {
	return createFieldSpec({
		id: `local-sun-l${order}`,
		quantity: DIRECTIONAL_FIELD_QUANTITIES.RADIANCE_DENSITY,
		units: DIRECTIONAL_FIELD_UNITS.RADIANCE_DENSITY,
		directionRole: DIRECTION_DOMAIN_ROLES.INCOMING_RADIANCE,
		directionDomain: fieldDomains.radiance.directionDomain,
		storage: fieldDomains.radiance.storage,
		layout: fieldDomains.radiance.layout,
		order: { kind: 'pure', value: order },
		domains,
	});
}

/**
 * Create one cumulative local-Sun scattering-density field.
 *
 * @param {1 | 2 | 3 | 4} order - Supplies cumulative maximum.
 * @param {LocalSunConstructionDomainSelection} domains - Supplies domains.
 * @param {ReturnType<typeof createFieldDomainFacts>} fieldDomains - Supplies shapes.
 * @returns {CacheFieldSpec} The field.
 */
function createCumulativeScatteringField(order, domains, fieldDomains) {
	return createFieldSpec({
		id: `local-sun-j-through-${order}`,
		quantity: DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY,
		units: DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY,
		directionRole: DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY,
		directionDomain: fieldDomains.scattering.directionDomain,
		storage: fieldDomains.scattering.storage,
		layout: fieldDomains.scattering.layout,
		order: {
			kind: 'cumulative-through',
			value: order,
			included: Array.from({ length: order }, (_unused, index) => index + 1),
		},
		domains,
	});
}

/**
 * Create one logical pass context.
 *
 * @param {CachePassKind} kind - Supplies pass kind.
 * @param {CacheOrder} order - Supplies order.
 * @param {readonly CacheFieldSpec[]} inputs - Supplies input fields.
 * @param {CacheFieldSpec} output - Supplies output field.
 * @param {CacheConstructionControlsDescriptor} controls - Supplies controls.
 * @param {CacheConstructionDomains} domains - Supplies domains.
 * @param {Readonly<{
 *   pathIntervalCount?: number,
 *   transportData?: CacheTransportData,
 *   groundReflection?: CacheGroundReflection,
 * }>} [options] - Supplies pass-specific executable facts.
 * @returns {CacheBuildContext} The context.
 */
function createPassContext(
	kind,
	order,
	inputs,
	output,
	controls,
	domains,
	options = {},
) {
	return {
		kind,
		order,
		inputs,
		output,
		controls,
		domains,
		...(options.pathIntervalCount === undefined
			? {}
			: { pathIntervalCount: options.pathIntervalCount }),
		...(options.transportData === undefined
			? {}
			: { transportData: options.transportData }),
		...(options.groundReflection === undefined
			? {}
			: { groundReflection: options.groundReflection }),
	};
}

/**
 * Create the local-Sun scalar output-layout module.
 *
 * @param {CacheBuildContext} context - Supplies the pass.
 * @returns {CacheBuildModule} The layout module.
 */
export function createLocalSunCacheLayoutModule(context) {
	const storage = context.output.storage;

	return createCacheBuildModule({
		id: `algorithm32-local-sun-${context.output.id}-layout-module-v1`,
		owner: 'cache',
		provides: ['cache.outputLayout'],
		requires: [],
		blocks: [],
		bindings: [
			{
				spec: {
					id: 'local-sun-cache-direction-count',
					name: 'CACHE_DIRECTION_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: storage.width,
			},
			{
				spec: {
					id: 'local-sun-cache-position-count',
					name: 'CACHE_POSITION_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: storage.height,
			},
			{
				spec: {
					id: 'local-sun-cache-wavelength-count',
					name: 'CACHE_WAVELENGTH_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'build',
				},
				value: storage.layers,
			},
		],
	});
}

/**
 * Create one pass from required owner contributors.
 *
 * @param {Readonly<{
 *   id: string,
 *   context: CacheBuildContext,
 *   contributors: readonly CacheBuildContributor[],
 *   includeGround?: boolean,
 *   groundBoundary?: CacheBuildContributor | null,
 * }>} definition - Supplies pass facts.
 * @returns {CachePass} The pass.
 */
function createPass(definition) {
	const modules = definition.contributors.map((contributor) =>
		contributor.createCacheModule(definition.context));

	if (definition.includeGround) {
		modules.push(definition.groundBoundary === null
			|| definition.groundBoundary === undefined
			? createCanonicalBlackGroundCacheModule(definition.context)
			: definition.groundBoundary.createCacheModule(definition.context));
	}

	modules.push(createLocalSunCacheLayoutModule(definition.context));

	return {
		id: definition.id,
		kind: definition.context.kind,
		order: definition.context.order,
		inputs: definition.context.inputs.map((input) => input.id),
		output: definition.context.output.id,
		modules,
	};
}

/**
 * Add a generic stored-field transport pass.
 *
 * @param {CachePass[]} passes - Supplies mutable plan passes.
 * @param {Readonly<{
 *   id: string,
 *   order: 2 | 3,
 *   input: CacheFieldSpec,
 *   output: CacheFieldSpec,
 *   controls: CacheConstructionControlsDescriptor,
 *   domains: LocalSunConstructionDomainSelection,
 *   transportData: CacheTransportData,
 *   geometry: CacheBuildContributor,
 *   operations: CacheOperations,
 * }>} request - Supplies transport facts.
 * @returns {void}
 */
function addTransportPass(passes, request) {
	passes.push(createPass({
		id: request.id,
		context: createPassContext(
			'transport',
			request.order,
			[request.input],
			request.output,
			request.controls,
			request.domains,
			{ transportData: request.transportData },
		),
		contributors: [request.geometry, request.operations],
	}));
}

/**
 * Add one pure scatter and cumulative-add pair.
 *
 * @param {CachePass[]} passes - Supplies mutable plan passes.
 * @param {Readonly<{
 *   order: 2 | 3 | 4,
 *   previousRadiance: CacheFieldSpec,
 *   groundIllumination: CacheFieldSpec | null,
 *   output: CacheFieldSpec,
 *   previousCumulative: CacheFieldSpec,
 *   cumulative: CacheFieldSpec,
 *   controls: CacheConstructionControlsDescriptor,
 *   domains: LocalSunConstructionDomainSelection,
 *   geometry: CacheBuildContributor,
 *   atmosphere: CacheBuildContributor,
 *   source: CacheBuildContributor,
 *   operations: CacheOperations,
 *   groundBoundary: CacheBuildContributor | null,
 * }>} request - Supplies recurrence facts.
 * @returns {void}
 */
function addScatterAndAccumulatePasses(passes, request) {
	const reflectedInputs = request.groundBoundary === null
		|| request.groundIllumination === null
		? [request.previousRadiance]
		: [request.previousRadiance, request.groundIllumination];
	const groundReflection = request.groundBoundary === null
		? undefined
		: request.order === 2
			? { kind: /** @type {const} */ ('direct-source') }
			: {
				kind: /** @type {const} */ ('pure-radiance'),
				illumination: /** @type {CacheFieldSpec} */ (
					request.groundIllumination
				),
			};

	passes.push(createPass({
		id: `local-sun-scatter-l${request.order - 1}-to-j${request.order}`,
		context: createPassContext(
			'scatter',
			request.order,
			reflectedInputs,
			request.output,
			request.controls,
			request.domains,
			{ groundReflection },
		),
		contributors: [
			request.geometry,
			request.atmosphere,
			request.source,
			request.operations,
		],
		includeGround: true,
		groundBoundary: request.groundBoundary,
	}));
	passes.push(createPass({
		id: request.order === 2
			? 'local-sun-add-j1-j2-to-jthrough2'
			: `local-sun-add-jthrough${request.order - 1}`
				+ `-j${request.order}-to-jthrough${request.order}`,
		context: createPassContext(
			'accumulate',
			request.order,
			[request.previousCumulative, request.output],
			request.cumulative,
			request.controls,
			request.domains,
		),
		contributors: [request.operations],
	}));
}

/**
 * Derive the exact local-Sun N1, N2, or N4 GPU build graph.
 *
 * @param {LocalSunCacheBuildPlanRequest} request - Supplies physical owners
 * and requested maximum.
 * @returns {LocalSunCachePlan} The source-owned plan.
 */
export function createLocalSunCacheBuildPlan(request) {
	assertLocalSunGeometryPairing(
		request.source.configuration,
		request.geometry.configuration,
	);

	const groundBoundary =
		/** @type {(GroundBoundary & CacheBuildContributor) | null} */ (
			request.groundBoundary ?? null
		);
	const domains = request.domainSelection
		?? LocalSunConstructionDomainSelectionOwner.fromGeometry(
			request.geometry,
		);
	const fieldDomains = createFieldDomainFacts(domains);
	const controls = createCacheConstructionControlsDescriptor({
		id: `algorithm32-local-sun-gpu-n${request.maximumScatteringOrder}-controls-v2`,
		transportIntervalCount: LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
		maximumScatteringOrder: request.maximumScatteringOrder,
	});
	const transportData = request.maximumScatteringOrder === 4
		? request.geometry.createTransportData({
			atmosphere: request.atmosphere,
			domains,
			intervalCount: LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
		})
		: undefined;
	const operations = new CacheOperations();
	const source = request.source;
	const j1 = createPureScatteringField(1, domains, fieldDomains);
	const fields = [j1];
	/** @type {CachePass[]} */
	const passes = [];

	passes.push(createPass({
		id: 'local-sun-primary-j1',
		context: createPassContext(
			'primary-j1',
			1,
			[],
			j1,
			controls,
			domains,
		),
		contributors: [request.geometry, request.atmosphere, source],
	}));

	/** @type {CacheFieldSpec} */
	let cumulative;

	if (request.maximumScatteringOrder === 1) {
		cumulative = createCumulativeScatteringField(1, domains, fieldDomains);
		fields.push(cumulative);
		passes.push(createPass({
			id: 'local-sun-copy-j1-to-jthrough1',
			context: createPassContext(
				'accumulate',
				1,
				[j1],
				cumulative,
				controls,
				domains,
			),
			contributors: [operations],
		}));
	} else {
		const l1 = createPureRadianceField(1, domains, fieldDomains);
		const j2 = createPureScatteringField(2, domains, fieldDomains);
		const cumulativeThrough2 = createCumulativeScatteringField(
			2,
			domains,
			fieldDomains,
		);
		fields.push(l1, j2, cumulativeThrough2);
		passes.push(createPass({
			id: 'local-sun-direct-l1',
			context: createPassContext(
				'direct-l1',
				1,
				[],
				l1,
				controls,
				domains,
				{
					pathIntervalCount:
						LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
				},
			),
			contributors: [
				request.geometry,
				request.atmosphere,
				source,
			],
		}));
		addScatterAndAccumulatePasses(passes, {
			order: 2,
			previousRadiance: l1,
			groundIllumination: null,
			output: j2,
			previousCumulative: j1,
			cumulative: cumulativeThrough2,
			controls,
			domains,
			geometry: request.geometry,
			atmosphere: request.atmosphere,
			source,
			operations,
			groundBoundary,
		});

		if (request.maximumScatteringOrder === 2) {
			cumulative = cumulativeThrough2;
		} else {
			const l2 = createPureRadianceField(2, domains, fieldDomains);
			const j3 = createPureScatteringField(3, domains, fieldDomains);
			const cumulativeThrough3 = createCumulativeScatteringField(
				3,
				domains,
				fieldDomains,
			);
			const l3 = createPureRadianceField(3, domains, fieldDomains);
			const j4 = createPureScatteringField(4, domains, fieldDomains);
			const cumulativeThrough4 = createCumulativeScatteringField(
				4,
				domains,
				fieldDomains,
			);
			fields.push(
				l2,
				j3,
				cumulativeThrough3,
				l3,
				j4,
				cumulativeThrough4,
			);
			addTransportPass(passes, {
				id: 'local-sun-transport-j2-to-l2',
				order: 2,
				input: j2,
				output: l2,
				controls,
				domains,
				transportData: /** @type {CacheTransportData} */ (transportData),
				geometry: request.geometry,
				operations,
			});
			addScatterAndAccumulatePasses(passes, {
				order: 3,
				previousRadiance: l2,
				groundIllumination: l1,
				output: j3,
				previousCumulative: cumulativeThrough2,
				cumulative: cumulativeThrough3,
				controls,
				domains,
				geometry: request.geometry,
				atmosphere: request.atmosphere,
				source,
				operations,
				groundBoundary,
			});
			addTransportPass(passes, {
				id: 'local-sun-transport-j3-to-l3',
				order: 3,
				input: j3,
				output: l3,
				controls,
				domains,
				transportData: /** @type {CacheTransportData} */ (transportData),
				geometry: request.geometry,
				operations,
			});
			addScatterAndAccumulatePasses(passes, {
				order: 4,
				previousRadiance: l3,
				groundIllumination: l2,
				output: j4,
				previousCumulative: cumulativeThrough3,
				cumulative: cumulativeThrough4,
				controls,
				domains,
				geometry: request.geometry,
				atmosphere: request.atmosphere,
				source,
				operations,
				groundBoundary,
			});
			cumulative = cumulativeThrough4;
		}
	}

	const descriptorDefinition = {
		id: `${domains.id}-gpu-cache-n${request.maximumScatteringOrder}-v3`,
		field: cumulative.descriptor,
		incomingDirectionDomain: domains.incomingDirectionDomain,
		controls,
		constructionIdentities: {
			source: createCacheOwnerIdentity(
				'lightSource',
				'algorithm32-local-sun-light-source-cache-construction-v2',
				passes,
			),
			atmosphere: createCacheOwnerIdentity(
				'atmosphere',
				'algorithm32-canonical-atmosphere-cache-construction-v1',
				passes,
			),
			geometry: createCacheOwnerIdentity(
				'geometry',
				'algorithm32-flat-earth-cache-construction-v3',
				passes,
			),
			boundary: groundBoundary === null
				? BLACK_GROUND_BOUNDARY_IDENTITY
				: groundBoundary.describe(),
		},
	};
	const identity = createCachePlanIdentity(
		LOCAL_SUN_CACHE_PLAN_ID,
		fields,
		passes,
	);

	const packedTransportScalarCount =
		transportData === undefined
			? 0
			: transportData.sources.values.length
				+ transportData.coefficients.values.length;

	return /** @type {LocalSunCachePlan} */ ({
		identity,
		descriptorDefinition,
		fields,
		passes,
		result: cumulative.id,
		resources: {
			packedTransportData: {
				value:
					packedTransportScalarCount
					* Float32Array.BYTES_PER_ELEMENT,
				units: 'bytes',
			},
		},
	});
}
