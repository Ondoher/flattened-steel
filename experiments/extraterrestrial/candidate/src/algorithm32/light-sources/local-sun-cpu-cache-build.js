import {
	BLACK_GROUND_BOUNDARY_IDENTITY,
	createScatteringCacheDescriptor,
} from '../caches/ScatteringCacheDescriptor.js';
import {
	accumulatePureScatteringFields,
	buildNextScatteringOrder,
} from '../transport/scattering-order-field-operations.js';
import LocalSunCpuFields from './LocalSunCpuFields.js';
import {
	buildLocalSunCpuPrimaryScatteringDensity,
} from './local-sun-primary-scattering-density.js';
import {
	buildLocalSunCpuPrimaryRadiance,
} from './local-sun-primary-radiance.js';
import {
	LOCAL_SUN_CPU_FIRST_ORDER_CACHE_CONTROLS,
	LOCAL_SUN_CPU_FOURTH_ORDER_CACHE_CONTROLS,
	LOCAL_SUN_CPU_SECOND_ORDER_CACHE_CONTROLS,
} from './local-sun-consts.js';

/**
 * Normalize the executable boundary identity.
 *
 * @param {LocalSunCpuCacheBuildRequest} request - Supplies construction facts.
 * @returns {ScatteringCacheConstructionIdentitiesDefinition} The complete identities.
 */
function constructionIdentitiesFor(request) {
	const boundary = request.groundBoundary == null
		? BLACK_GROUND_BOUNDARY_IDENTITY
		: request.groundBoundary.describe();

	return {
		...request.constructionIdentities,
		boundary,
	};
}

/**
 * Distinguish explicit boundaries while preserving omitted-black field ids.
 *
 * @param {CacheDescriptorIdentity} boundary - Supplies boundary identity.
 * @returns {string} The field-id suffix.
 */
function boundaryFieldIdentitySuffix(boundary) {
	return boundary.id === BLACK_GROUND_BOUNDARY_IDENTITY.id
		&& boundary.contentHash
			=== BLACK_GROUND_BOUNDARY_IDENTITY.contentHash
		? ''
		: `-ground-${boundary.contentHash}`;
}

/**
 * Select local transport controls for the requested graph.
 *
 * @param {SupportedCacheScatteringOrder} order - Supplies maximum order.
 * @returns {CacheConstructionControlsDescriptor} The controls.
 */
function controlsFor(order) {
	if (order === 1) {
		return LOCAL_SUN_CPU_FIRST_ORDER_CACHE_CONTROLS;
	}

	return order === 2
		? LOCAL_SUN_CPU_SECOND_ORDER_CACHE_CONTROLS
		: LOCAL_SUN_CPU_FOURTH_ORDER_CACHE_CONTROLS;
}

/**
 * Construct the local-Sun binary64 recurrence for requested N1, N2, or N4.
 *
 * Local recurrence constructs continuous direct L1 independently of
 * shell-held J1. Stored-field transport begins at J2 to L2, and no cumulative
 * field feeds recurrence.
 *
 * @param {LocalSunCpuCacheBuildRequest} request - Supplies physical owners and operations.
 * @returns {LocalSunCpuCacheResult} The completed nonresident result.
 */
export function buildLocalSunCpuCache(request) {
	const maximumScatteringOrder = request.maximumScatteringOrder;
	const constructionIdentities = constructionIdentitiesFor(request);
	const boundarySuffix = boundaryFieldIdentitySuffix(
		/** @type {CacheDescriptorIdentity} */ (
			constructionIdentities.boundary
		),
	);
	const pureJ1 = buildLocalSunCpuPrimaryScatteringDensity({
		...request,
		id: `algorithm32-local-sun-cpu-pure-j1-v1${boundarySuffix}`,
	});
	const pureScatteringDensityByOrder = [pureJ1];
	const pureRadianceByOrder = [];

	if (maximumScatteringOrder > 1) {
		let previousRadiance =
			buildLocalSunCpuPrimaryRadiance({
				geometry: request.geometry,
				calculator: request.calculator,
				domainSelection:
					request.domainSelection,
				id:
					`algorithm32-local-sun-cpu-pure-l1-direct-v2${boundarySuffix}`,
				onProgress: request.onProgress,
			});
		pureRadianceByOrder.push(previousRadiance);

		for (let scatteringOrder = 2;
			scatteringOrder <= maximumScatteringOrder;
			scatteringOrder += 1) {
			const outputScattering =
				LocalSunCpuFields.createPureScatteringDensity({
					id:
						`algorithm32-local-sun-cpu-pure-j${scatteringOrder}-v1${boundarySuffix}`,
					order: scatteringOrder,
					provenanceIdentity:
						request.operations
							.scatteringProvenanceIdentity,
					domainSelection: request.domainSelection,
				});
			const pureScatteringDensity =
				buildNextScatteringOrder({
					previousRadiance,
					outputScattering,
					kernel:
						request.operations.createScatteringKernel({
							scatteringOrder:
								/** @type {2 | 3 | 4} */ (
									scatteringOrder
								),
							groundIlluminationRadiance:
								scatteringOrder < 3
									? null
									: pureRadianceByOrder[
										scatteringOrder - 3
									],
						}),
				});
			pureScatteringDensityByOrder.push(
				pureScatteringDensity,
			);

			if (scatteringOrder < maximumScatteringOrder) {
				previousRadiance =
					request.operations.buildTransportedRadiance({
						scatteringDensity:
							pureScatteringDensity,
						scatteringOrder:
							/** @type {2 | 3} */ (
								scatteringOrder
							),
						id:
							`algorithm32-local-sun-cpu-pure-l${scatteringOrder}-v1${boundarySuffix}`,
					});
				pureRadianceByOrder.push(previousRadiance);
			}
		}
	}

	const cumulativeScatteringDensity =
		LocalSunCpuFields.createCumulativeScatteringDensity({
			id:
				`algorithm32-local-sun-cpu-j-through-${maximumScatteringOrder}-v1${boundarySuffix}`,
			cumulativeThroughOrder: maximumScatteringOrder,
			provenanceIdentity:
				`algorithm32-local-sun-cpu-recurrence-through-${maximumScatteringOrder}-v1${boundarySuffix}`,
			domainSelection: request.domainSelection,
		});
	request.onProgress?.({
		phase: 'accumulation',
		order: maximumScatteringOrder,
		completed: 0,
		total: cumulativeScatteringDensity.scalarCount,
	});
	accumulatePureScatteringFields({
		pureFields: pureScatteringDensityByOrder,
		cumulativeField: cumulativeScatteringDensity,
		packing: request.domainSelection.scatteringDensityPacking,
	});
	request.onProgress?.({
		phase: 'accumulation',
		order: maximumScatteringOrder,
		completed: cumulativeScatteringDensity.scalarCount,
		total: cumulativeScatteringDensity.scalarCount,
	});
	const descriptor = createScatteringCacheDescriptor({
		id:
			`algorithm32-local-sun-cpu-scattering-cache-n${maximumScatteringOrder}-v1`,
		field:
			/** @type {PublishableCumulativeScatteringDensityFieldDescriptor} */ (
				cumulativeScatteringDensity.descriptor
			),
		incomingDirectionDomain:
			request.domainSelection.incomingDirectionDomain,
		controls: controlsFor(maximumScatteringOrder),
		constructionIdentities,
	});

	return /** @type {LocalSunCpuCacheResult} */ ({
		maximumScatteringOrder,
		pureScatteringDensityByOrder,
		pureRadianceByOrder,
		cumulativeScatteringDensity,
		descriptor,
	});
}
