import {
	DEFAULT_CACHE_CONSTRUCTION_CONTROLS,
	createCacheConstructionControlsDescriptor,
} from '../caches/CacheConstructionControlsDescriptor.js';
import {
	BLACK_GROUND_BOUNDARY_IDENTITY,
	createScatteringCacheDescriptor,
} from '../caches/ScatteringCacheDescriptor.js';
import {
	accumulatePureScatteringFields,
	buildNextScatteringOrder,
} from '../transport/scattering-order-field-operations.js';
import {
	createDistantSunCpuCumulativeScatteringDensityField,
	createDistantSunCpuPureScatteringDensityField,
} from './DistantSunCpuFields.js';
import {
	buildDistantSunCpuPrimaryRadiance,
} from './distant-sun-primary-radiance.js';
import {
	buildDistantSunCpuPrimaryScatteringDensity,
} from './distant-sun-primary-scattering-density.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	DISTANT_SUN_CPU_FIRST_ORDER_CACHE_CONTROLS,
	DISTANT_SUN_CPU_SECOND_ORDER_CACHE_CONTROLS,
	DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
} from './consts.js';

/**
 * Add the executable boundary owner's identity to result metadata.
 *
 * @param {DistantSunCpuCacheBuildRequest} request - Supplies the typed build request.
 * @returns {ScatteringCacheConstructionIdentitiesDefinition}
 * Return construction identities with the executable boundary identity.
 */
function createConstructionIdentities(request) {
	const boundary = request.groundBoundary == null
		? BLACK_GROUND_BOUNDARY_IDENTITY
		: request.groundBoundary.describe();

	return {
		...request.constructionIdentities,
		boundary,
	};
}

/**
 * Distinguish every boundary-dependent field while preserving omitted-black
 * field identities exactly.
 *
 * @param {CacheDescriptorIdentity} boundary - Supplies the normalized boundary identity.
 * @returns {string} Return an id suffix, or the empty omitted-black suffix.
 */
function boundaryFieldIdentitySuffix(boundary) {
	if (boundary.id === BLACK_GROUND_BOUNDARY_IDENTITY.id
		&& boundary.contentHash === BLACK_GROUND_BOUNDARY_IDENTITY.contentHash) {
		return '';
	}

	return `-ground-${boundary.contentHash}`;
}

/**
 * Emit order-specific cache metadata after executable construction is
 * complete. The descriptor does not select or control numerical work.
 *
 * @param {SupportedCacheScatteringOrder} maximumScatteringOrder - Supplies
 * the completed graph.
 * @param {number} transportIntervalCount - Supplies the executed interval
 * count.
 * @returns {CacheConstructionControlsDescriptor} Return result metadata.
 */
function describeConstructionControls(
	maximumScatteringOrder,
	transportIntervalCount,
) {
	if (transportIntervalCount === DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT) {
		return maximumScatteringOrder === 1
			? DISTANT_SUN_CPU_FIRST_ORDER_CACHE_CONTROLS
			: maximumScatteringOrder === 2
				? DISTANT_SUN_CPU_SECOND_ORDER_CACHE_CONTROLS
				: DEFAULT_CACHE_CONSTRUCTION_CONTROLS;
	}

	return createCacheConstructionControlsDescriptor({
		id: `algorithm32-distant-sun-cpu-n${maximumScatteringOrder}`
			+ `-transport-${transportIntervalCount}-controls-v1`,
		transportIntervalCount,
		maximumScatteringOrder,
	});
}

/**
 * Finish the final cumulative field and its nonresident cache descriptor.
 *
 * @param {object} request - Supplies completed pure fields and cache identity.
 * @param {SupportedCacheScatteringOrder} request.maximumScatteringOrder - Supplies the final order.
 * @param {readonly CpuDirectionalSpectralFieldContract[]} request.pureScatteringDensityByOrder - Supplies J1 through JN.
 * @param {ScatteringCacheConstructionIdentitiesDefinition} request.constructionIdentities - Supplies physical identities.
 * @param {string} request.boundaryIdentitySuffix - Supplies the boundary-dependent field suffix.
 * @param {DistantSunConstructionDomainSelection} request.domainSelection -
 * Supplies executable field domains.
 * @param {number} request.transportIntervalCount - Supplies the executed
 * path-integration interval count.
 * @returns {{
 *   cumulativeScatteringDensity: CpuDirectionalSpectralFieldContract,
 *   descriptor: ScatteringCacheDescriptor,
 * }} Return the sealed cumulative field and descriptor.
 */
function buildCumulativeResult(request) {
	const maximumScatteringOrder = request.maximumScatteringOrder;
	const boundaryIdentitySuffix = request.boundaryIdentitySuffix;
	const cumulativeScatteringDensity =
		createDistantSunCpuCumulativeScatteringDensityField({
			id: `algorithm32-distant-sun-cpu-j-through-${maximumScatteringOrder}-v1${boundaryIdentitySuffix}`,
			cumulativeThroughOrder: maximumScatteringOrder,
			provenanceIdentity:
				`algorithm32-distant-sun-cpu-recurrence-through-${maximumScatteringOrder}-v1${boundaryIdentitySuffix}`,
			domainSelection: request.domainSelection,
		});

	accumulatePureScatteringFields({
		pureFields: request.pureScatteringDensityByOrder,
		cumulativeField: cumulativeScatteringDensity,
		packing: request.domainSelection.scatteringDensityPacking,
	});
	const cumulativeDescriptor =
		/** @type {PublishableCumulativeScatteringDensityFieldDescriptor} */ (
			cumulativeScatteringDensity.descriptor
		);
	const controls = describeConstructionControls(
		maximumScatteringOrder,
		request.transportIntervalCount,
	);
	const descriptor = createScatteringCacheDescriptor({
		id: `algorithm32-distant-sun-cpu-scattering-cache-n${maximumScatteringOrder}-v1`,
		field: cumulativeDescriptor,
		incomingDirectionDomain: request.domainSelection.incomingDirectionDomain,
		controls,
		constructionIdentities: request.constructionIdentities,
	});

	return { cumulativeScatteringDensity, descriptor };
}

/**
 * Construct the complete source-owned CPU recurrence for requested N=1, N=2,
 * or N=4. N=2 stops after J2. N=4 transports only J2 and J3, and no
 * cumulative field ever enters recurrence.
 *
 * @param {DistantSunCpuCacheBuildRequest} request - Supplies physical collaborators and internal recurrence operations.
 * @returns {DistantSunCpuCacheResult} Return the complete nonresident CPU result.
 */
export function buildDistantSunCpuCache(request) {
	const constructionIdentities = createConstructionIdentities(request);
	const boundaryIdentitySuffix = boundaryFieldIdentitySuffix(
		/** @type {CacheDescriptorIdentity} */ (constructionIdentities.boundary),
	);
	const maximumScatteringOrder = request.maximumScatteringOrder;
	const transportIntervalCount = request.transportIntervalCount
		?? DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT;
	const domainSelection = request.domainSelection
		?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

	const pureJ1 = buildDistantSunCpuPrimaryScatteringDensity({
		...request,
		domainSelection,
	});
	if (maximumScatteringOrder === 1) {
		const cumulative = buildCumulativeResult({
			maximumScatteringOrder,
			pureScatteringDensityByOrder: [pureJ1],
			constructionIdentities,
			boundaryIdentitySuffix,
			domainSelection,
			transportIntervalCount,
		});

		return {
			maximumScatteringOrder,
			pureScatteringDensityByOrder: [pureJ1],
			pureRadianceByOrder: [],
			cumulativeScatteringDensity: cumulative.cumulativeScatteringDensity,
			descriptor: cumulative.descriptor,
		};
	}

	const multipleScatteringRequest = /** @type {DistantSunCpuCacheBuildRequestN2 | DistantSunCpuCacheBuildRequestN4} */ (request);
	const operations = multipleScatteringRequest.operations;
	const pureL1 = buildDistantSunCpuPrimaryRadiance({
		...multipleScatteringRequest,
		domainSelection,
		transportIntervalCount,
	});
	const pureScatteringDensityByOrder = [pureJ1];
	const pureRadianceByOrder = [pureL1];
	let previousRadiance = pureL1;

	for (let scatteringOrder = 2;
		scatteringOrder <= maximumScatteringOrder;
		scatteringOrder += 1) {
		const outputScattering = createDistantSunCpuPureScatteringDensityField({
			id: `algorithm32-distant-sun-cpu-pure-j${scatteringOrder}-v1${boundaryIdentitySuffix}`,
			order: scatteringOrder,
			provenanceIdentity: operations.scatteringProvenanceIdentity,
			domainSelection,
		});
		const groundIlluminationRadiance = scatteringOrder < 3
			? null
			: pureRadianceByOrder[scatteringOrder - 3];
		const pureScatteringDensity = buildNextScatteringOrder({
			previousRadiance,
			outputScattering,
			kernel: operations.createScatteringKernel({
				scatteringOrder: /** @type {2 | 3 | 4} */ (scatteringOrder),
				groundIlluminationRadiance,
			}),
		});
		pureScatteringDensityByOrder.push(pureScatteringDensity);

		if (scatteringOrder < maximumScatteringOrder) {
			const transportedScatteringOrder =
				/** @type {2 | 3} */ (scatteringOrder);
			const transportedRadiance =
				/** @type {DistantSunCpuTransportedRadianceBuilder} */ (
					operations.buildTransportedRadiance
				)({
					scatteringDensity: pureScatteringDensity,
					scatteringOrder:
						transportedScatteringOrder,
					id: `algorithm32-distant-sun-cpu-pure-l${transportedScatteringOrder}-v1${boundaryIdentitySuffix}`,
				});
			pureRadianceByOrder.push(transportedRadiance);
			previousRadiance = transportedRadiance;
		}
	}

	const cumulative = buildCumulativeResult({
		maximumScatteringOrder,
		pureScatteringDensityByOrder,
		constructionIdentities,
		boundaryIdentitySuffix,
		domainSelection,
		transportIntervalCount,
	});
	if (maximumScatteringOrder === 2) {
		return {
			maximumScatteringOrder,
			pureScatteringDensityByOrder:
				/** @type {readonly [CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract]} */ (
					[
						pureScatteringDensityByOrder[0],
						pureScatteringDensityByOrder[1],
					]
				),
			pureRadianceByOrder:
				/** @type {readonly [CpuDirectionalSpectralFieldContract]} */ (
					[pureRadianceByOrder[0]]
				),
			cumulativeScatteringDensity: cumulative.cumulativeScatteringDensity,
			descriptor: cumulative.descriptor,
		};
	}

	return {
		maximumScatteringOrder,
		pureScatteringDensityByOrder:
			/** @type {readonly [CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract]} */ (
				[
					pureScatteringDensityByOrder[0],
					pureScatteringDensityByOrder[1],
					pureScatteringDensityByOrder[2],
					pureScatteringDensityByOrder[3],
				]
			),
		pureRadianceByOrder:
			/** @type {readonly [CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract]} */ (
				[
					pureRadianceByOrder[0],
					pureRadianceByOrder[1],
					pureRadianceByOrder[2],
				]
			),
		cumulativeScatteringDensity: cumulative.cumulativeScatteringDensity,
		descriptor: cumulative.descriptor,
	};
}
