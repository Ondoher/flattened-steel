import {
	DEFAULT_CACHE_CONSTRUCTION_CONTROLS,
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
import { createScalarArrayTextureLayout } from '../caches/ScalarArrayTextureLayout.js';
import { CacheOperations } from '../caches/gpu/CacheOperations.js';
import {
	createCanonicalBlackGroundCacheModule,
} from '../caches/gpu/canonical-black-ground.js';
import {
	createCacheBuildModule,
	createCacheOwnerIdentity,
	createCachePlanIdentity,
} from '../caches/gpu/cacheBuildContracts.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_15_SPECTRAL_CHANNEL_COUNT,
} from '../profiles/native-15-profile.js';
import DistantSunConstructionDomainSelection from
	'./DistantSunConstructionDomainSelection.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	DISTANT_SUN_GPU_FIELD_PROVENANCE_IDENTITY,
} from './consts.js';

/**
 * Accept the default or one explicit source-owned construction lattice.
 *
 * @param {unknown} value - Supplies the optional selection.
 * @returns {DistantSunConstructionDomainSelection} The accepted selection.
 */
function acceptConstructionDomainSelection(value) {
	const selection = value === undefined
		? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION
		: value;
	if (!(selection instanceof DistantSunConstructionDomainSelection)) {
		throw new TypeError(
			'Distant-Sun GPU domainSelection must be a production '
				+ 'construction-domain selection.',
		);
	}
	return selection;
}

/**
 * Accept direct-plan controls while retaining production defaults on omission.
 *
 * @param {CacheConstructionControlsDescriptor | undefined} value - Supplies
 * optional comparison controls.
 * @param {SupportedCacheScatteringOrder} maximumScatteringOrder - Supplies
 * the requested plan maximum.
 * @returns {CacheConstructionControlsDescriptor} The accepted controls.
 */
function acceptConstructionControls(value, maximumScatteringOrder) {
	const controls = value ?? createCacheConstructionControlsDescriptor({
		id: `algorithm32-distant-sun-gpu-n${maximumScatteringOrder}-controls-v1`,
		transportIntervalCount:
			DEFAULT_CACHE_CONSTRUCTION_CONTROLS.transportIntervalCount,
		maximumScatteringOrder,
	});
	if (!controls || typeof controls !== 'object' || Array.isArray(controls)) {
		throw new TypeError(
			'Distant-Sun GPU constructionControls must be an object.',
		);
	}
	if (!Number.isInteger(controls.transportIntervalCount)
		|| controls.transportIntervalCount < 1) {
		throw new RangeError(
			'Distant-Sun GPU constructionControls transportIntervalCount must be a positive integer.',
		);
	}
	if (controls.maximumScatteringOrder !== maximumScatteringOrder) {
		throw new RangeError(
			'Distant-Sun GPU constructionControls must match the requested maximum scattering order.',
		);
	}

	return controls;
}

/**
 * Create executable storage and descriptive layouts from one shared lattice.
 *
 * @param {DistantSunConstructionDomainSelection} domains - Supplies the
 * selected executable construction domains.
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
	const defaultSelection =
		domains === DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	/** @type {CacheFieldStorage} */
	const scatteringStorage = {
		format: 'R32F',
		width: domains.outgoingDirectionCount,
		height: domains.positionCount,
		layers: NATIVE_15_SPECTRAL_CHANNEL_COUNT,
	};
	/** @type {CacheFieldStorage} */
	const radianceStorage = {
		format: 'R32F',
		width: domains.incomingDirectionCount,
		height: domains.positionCount,
		layers: NATIVE_15_SPECTRAL_CHANNEL_COUNT,
	};

	return {
		scattering: {
			directionDomain: domains.outgoingDirectionDomain,
			storage: scatteringStorage,
			layout: createScalarArrayTextureLayout({
				id: defaultSelection
					? 'algorithm32-distant-sun-w27-r32f-layout-v1'
					: `${domains.id}-outgoing-r32f-layout-v1`,
				directionCount: scatteringStorage.width,
				positionCount: scatteringStorage.height,
				wavelengthCount: scatteringStorage.layers,
			}),
		},
		radiance: {
			directionDomain: domains.incomingDirectionDomain,
			storage: radianceStorage,
			layout: createScalarArrayTextureLayout({
				id: defaultSelection
					? 'algorithm32-distant-sun-fibonacci-34-r32f-layout-v1'
					: `${domains.id}-incoming-r32f-layout-v1`,
				directionCount: radianceStorage.width,
				positionCount: radianceStorage.height,
				wavelengthCount: radianceStorage.layers,
			}),
		},
	};
}

/**
 * Create one selected source-owned GPU field specification.
 *
 * @param {{
 *   id: string,
 *   quantity: "spectral-radiance-density" | "spectral-scattering-density",
 *   units: "W m^-2 sr^-1 nm^-1" | "W m^-3 sr^-1 nm^-1",
 *   directionRole: "incoming-radiance" | "outgoing-scattering-density",
 *   directionDomain: DirectionDomainDescriptor,
 *   storage: CacheFieldStorage,
 *   layout: ScalarArrayTextureLayoutDescriptor,
 *   order: SpectralFieldOrder,
 *   domains: DistantSunConstructionDomainSelection,
 * }} definition - Supplies logical field facts.
 * @returns {CacheFieldSpec} Return the field specification.
 */
function createFieldSpec(definition) {
	const defaultSelection =
		definition.domains
			=== DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const descriptor = /** @type {GpuCacheFieldDescriptor} */ (
		createDirectionalSpectralFieldDescriptor({
			id: defaultSelection
				? `algorithm32-${definition.id}-field-v1`
				: `${definition.domains.id}-${definition.id}-field-v1`,
			quantity: definition.quantity,
			units: definition.units,
			directionRole: definition.directionRole,
			basis: NATIVE_15_SPECTRAL_BASIS,
			positionDomain: definition.domains.positionDomain,
			directionDomain: definition.directionDomain,
			precision: 'binary32',
			layout: definition.layout,
			order: definition.order,
			provenanceIdentity: DISTANT_SUN_GPU_FIELD_PROVENANCE_IDENTITY,
		})
	);

	return {
		id: definition.id,
		storage: definition.storage,
		descriptor,
	};
}

/**
 * Create the pure outgoing Jk field specification.
 *
 * @param {1 | 2 | 3 | 4} order - Supplies the pure scattering order.
 * @param {DistantSunConstructionDomainSelection} domains - Supplies selected
 * construction domains.
 * @param {ReturnType<typeof createFieldDomainFacts>} fieldDomains - Supplies
 * executable field shapes.
 * @returns {CacheFieldSpec} Return the field specification.
 */
function createPureScatteringField(order, domains, fieldDomains) {
	return createFieldSpec({
		id: `distant-sun-j${order}`,
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
 * Create one pure incoming Lk field specification.
 *
 * @param {1 | 2 | 3} order - Supplies the pure radiance order.
 * @param {DistantSunConstructionDomainSelection} domains - Supplies selected
 * construction domains.
 * @param {ReturnType<typeof createFieldDomainFacts>} fieldDomains - Supplies
 * executable field shapes.
 * @returns {CacheFieldSpec} Return the field specification.
 */
function createPureRadianceField(order, domains, fieldDomains) {
	return createFieldSpec({
		id: `distant-sun-l${order}`,
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
 * Create one cumulative JthroughN field specification.
 *
 * @param {1 | 2 | 3 | 4} order - Supplies the cumulative maximum.
 * @param {DistantSunConstructionDomainSelection} domains - Supplies selected
 * construction domains.
 * @param {ReturnType<typeof createFieldDomainFacts>} fieldDomains - Supplies
 * executable field shapes.
 * @returns {CacheFieldSpec} Return the field specification.
 */
function createCumulativeScatteringField(order, domains, fieldDomains) {
	return createFieldSpec({
		id: `distant-sun-j-through-${order}`,
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
 * Create one pass context from source-owned graph facts.
 *
 * @param {CachePassKind} kind - Supplies the pass kind.
 * @param {CacheOrder} order - Supplies the scattering order.
 * @param {readonly CacheFieldSpec[]} inputs - Supplies pure/cumulative inputs.
 * @param {CacheFieldSpec} output - Supplies the logical output.
 * @param {CacheConstructionControlsDescriptor} controls - Supplies controls.
 * @param {CacheConstructionDomains} domains - Supplies executable domains.
 * @param {CacheTransportData} [transportData] - Supplies shared packed transport taps.
 * @param {CacheGroundReflection} [groundReflection] - Supplies reflective illumination facts.
 * @returns {CacheBuildContext} Return the context.
 */
function createPassContext(
	kind,
	order,
	inputs,
	output,
	controls,
	domains,
	transportData,
	groundReflection,
) {
	return {
		kind,
		order,
		inputs,
		output,
		controls,
		domains,
		...(transportData ? { transportData } : {}),
		...(groundReflection ? { groundReflection } : {}),
	};
}

/**
 * Create the source-owned scalar output-layout module for one pass.
 *
 * @param {CacheBuildContext} context - Supplies the resolved pass.
 * @returns {CacheBuildModule} Return the layout module.
 */
export function createDistantSunCacheLayoutModule(context) {
	const storage = context.output.storage;

	return createCacheBuildModule({
		id: `algorithm32-distant-sun-${context.output.id}-layout-module-v1`,
		owner: 'cache',
		provides: ['cache.outputLayout'],
		requires: [],
		blocks: [],
		bindings: [
			{
				spec: {
					id: 'distant-sun-cache-direction-count',
					name: 'CACHE_DIRECTION_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: storage.width,
			},
			{
				spec: {
					id: 'distant-sun-cache-position-count',
					name: 'CACHE_POSITION_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: storage.height,
			},
			{
				spec: {
					id: 'distant-sun-cache-wavelength-count',
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
 * Create one pass and request only the concrete owner modules needed by that
 * operation.
 *
 * @param {{
 *   id: string,
 *   context: CacheBuildContext,
 *   contributors: readonly CacheBuildContributor[],
 *   includeGround?: boolean,
 *   groundBoundary?: CacheBuildContributor | null,
 * }} definition - Supplies pass construction facts.
 * @returns {CachePass} Return the pass.
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
	modules.push(createDistantSunCacheLayoutModule(definition.context));
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
 * Derive the exact selected N1, N2, or N4 build graph.
 *
 * @param {DistantSunCacheBuildPlanRequest} request - Supplies the concrete owners and requested maximum.
 * @returns {CacheBuildPlan} Return the source-owned plan.
 */
export function createDistantSunCacheBuildPlan(request) {
	if (request.maximumScatteringOrder !== 1
		&& request.maximumScatteringOrder !== 2
		&& request.maximumScatteringOrder !== 4) {
		throw new RangeError(
			'Distant-Sun cache plan supports maximum scattering order 1, 2, or 4.',
		);
	}
	const groundBoundary =
		/** @type {(GroundBoundary & CacheBuildContributor) | null} */ (
			request.groundBoundary ?? null
		);
	const maximumScatteringOrder = request.maximumScatteringOrder;
	const domains = acceptConstructionDomainSelection(
		request.domainSelection,
	);
	const fieldDomains = createFieldDomainFacts(domains);
	const controls = acceptConstructionControls(
		request.constructionControls,
		maximumScatteringOrder,
	);
	const transportData = maximumScatteringOrder === 4
		? request.geometry.createTransportData({
			atmosphere: request.atmosphere,
			domains,
			directionToSource: request.source.configuration.directionToLight,
			intervalCount: controls.transportIntervalCount,
		})
		: undefined;
	const j1 = createPureScatteringField(1, domains, fieldDomains);
	const fields = [j1];
	const passes = [];
	const operations = new CacheOperations();
	const primaryContext = createPassContext(
		'primary-j1',
		1,
		[],
		j1,
		controls,
		domains,
	);

	const primaryPass = createPass({
		id: 'distant-sun-primary-j1',
		context: primaryContext,
		contributors: [request.geometry, request.atmosphere, request.source],
	});
	passes.push(primaryPass);

	/** @type {CacheFieldSpec} */
	let cumulative;
	if (maximumScatteringOrder === 1) {
		cumulative = createCumulativeScatteringField(
			1,
			domains,
			fieldDomains,
		);
		fields.push(cumulative);
		passes.push(createPass({
			id: 'distant-sun-accumulate-j1',
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
			id: 'distant-sun-direct-l1',
			context: createPassContext(
				'direct-l1',
				1,
				[],
				l1,
				controls,
				domains,
			),
			contributors: [request.geometry, request.atmosphere, request.source],
		}));
		passes.push(createPass({
			id: 'distant-sun-scatter-l1-to-j2',
			context: createPassContext(
				'scatter',
				2,
				[l1],
				j2,
				controls,
				domains,
				undefined,
				groundBoundary === null
					? undefined
					: { kind: 'direct-source' },
			),
			contributors: [
				request.geometry,
				request.atmosphere,
				request.source,
				operations,
			],
			includeGround: true,
			groundBoundary,
		}));
		passes.push(createPass({
			id: 'distant-sun-accumulate-j1-j2',
			context: createPassContext(
				'accumulate',
				2,
				[j1, j2],
				cumulativeThrough2,
				controls,
				domains,
			),
			contributors: [operations],
		}));

		if (maximumScatteringOrder === 2) {
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
			passes.push(createPass({
				id: 'distant-sun-transport-j2-to-l2',
				context: createPassContext(
					'transport',
					2,
					[j2],
					l2,
					controls,
					domains,
					transportData,
				),
				contributors: [
					request.geometry,
					operations,
				],
			}));
			passes.push(createPass({
				id: 'distant-sun-scatter-l2-to-j3',
				context: createPassContext(
					'scatter',
					3,
					groundBoundary === null ? [l2] : [l2, l1],
					j3,
					controls,
					domains,
					undefined,
					groundBoundary === null
						? undefined
						: {
							kind: 'pure-radiance',
							illumination: l1,
						},
				),
				contributors: [
					request.geometry,
					request.atmosphere,
					request.source,
					operations,
				],
				includeGround: true,
				groundBoundary,
			}));
			passes.push(createPass({
				id: 'distant-sun-accumulate-j-through-2-j3',
				context: createPassContext(
					'accumulate',
					3,
					[cumulativeThrough2, j3],
					cumulativeThrough3,
					controls,
					domains,
				),
				contributors: [operations],
			}));
			passes.push(createPass({
				id: 'distant-sun-transport-j3-to-l3',
				context: createPassContext(
					'transport',
					3,
					[j3],
					l3,
					controls,
					domains,
					transportData,
				),
				contributors: [
					request.geometry,
					operations,
				],
			}));
			passes.push(createPass({
				id: 'distant-sun-scatter-l3-to-j4',
				context: createPassContext(
					'scatter',
					4,
					groundBoundary === null ? [l3] : [l3, l2],
					j4,
					controls,
					domains,
					undefined,
					groundBoundary === null
						? undefined
						: {
							kind: 'pure-radiance',
							illumination: l2,
						},
				),
				contributors: [
					request.geometry,
					request.atmosphere,
					request.source,
					operations,
				],
				includeGround: true,
				groundBoundary,
			}));
			passes.push(createPass({
				id: 'distant-sun-accumulate-j-through-3-j4',
				context: createPassContext(
					'accumulate',
					4,
					[cumulativeThrough3, j4],
					cumulativeThrough4,
					controls,
					domains,
				),
				contributors: [operations],
			}));
			cumulative = cumulativeThrough4;
		}
	}

	const descriptorDefinition = {
		id: domains === DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION
			? `algorithm32-distant-sun-gpu-cache-n${maximumScatteringOrder}-v1`
			: `${domains.id}-gpu-cache-n${maximumScatteringOrder}-v1`,
		field: cumulative.descriptor,
		incomingDirectionDomain: domains.incomingDirectionDomain,
		controls,
		constructionIdentities: {
			source: createCacheOwnerIdentity(
				'lightSource',
				'algorithm32-distant-sun-light-source-cache-construction-v1',
				passes,
			),
			atmosphere: createCacheOwnerIdentity(
				'atmosphere',
				'algorithm32-canonical-atmosphere-cache-construction-v1',
				passes,
			),
			geometry: createCacheOwnerIdentity(
				'geometry',
				'algorithm32-spherical-earth-cache-construction-v1',
				passes,
			),
			boundary: groundBoundary === null
				? BLACK_GROUND_BOUNDARY_IDENTITY
				: groundBoundary.describe(),
		},
	};
	const identity = createCachePlanIdentity(
		'algorithm32-distant-sun-cache-construction-v1',
		fields,
		passes,
	);
	const plan = /** @type {CacheBuildPlan} */ ({
		identity,
		descriptorDefinition,
		fields,
		passes,
		result: cumulative.id,
	});

	return plan;
}
