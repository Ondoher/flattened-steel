import {
	transportPureScatteringDensity,
} from '../transport/scattering-density-transport.js';
import {
	ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY,
} from '../transport/consts.js';
import LocalSunCpuFields from './LocalSunCpuFields.js';
import {
	LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
} from './local-sun-consts.js';

/**
 * Build one pure local-Sun radiance field by transporting a stored pure Jk.
 *
 * Continuous direct L1 is source-owned. This generic stored-field operation
 * is restricted to J2 to L2 and J3 to L3.
 *
 * @param {LocalSunScatteringDensityTransportRequest} request - Supplies Jk and physical owners.
 * @returns {CpuDirectionalSpectralFieldContract} The sealed pure Lk field.
 */
export function buildLocalSunCpuTransportedRadiance(request) {
	const order = request.scatteringOrder;
	const domainSelection = request.domainSelection;
	const outputRadiance = LocalSunCpuFields.createPureRadiance({
		id: request.id
			?? `algorithm32-local-sun-cpu-pure-l${order}-stored-transport-v1`,
		order,
		provenanceIdentity:
			ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY,
		domainSelection,
	});

	return transportPureScatteringDensity({
		scatteringDensity: request.scatteringDensity,
		outputRadiance,
		geometry: request.geometry,
		atmosphere: request.atmosphere,
		calculator: request.calculator,
		scatteringOrder: order,
		positionNodes: domainSelection.positionNodes,
		positionCount: domainSelection.positionCount,
		radianceUnitVectors:
			domainSelection.incomingUnitVectors,
		radianceDirectionCount:
			domainSelection.incomingDirectionCount,
		spectralChannelCount:
			domainSelection.spectralChannelCount,
		resolvePositionStencil: ({
			position,
			atmosphereCoordinate,
		}) =>
			request.geometry
				.resolveScatteringCacheConstructionPositionStencil({
					position,
					atmosphereCoordinate,
					positionAxes: domainSelection,
				}),
		resolveDirectionStencil: (direction) =>
			domainSelection.resolveOutgoingDirectionStencil(direction),
		resolveBuildCoordinate: (coordinate) => ({
			coordinateKey:
				`local-z${domainSelection.zCount}`
				+ `-rho${domainSelection.rhoCount}`
				+ `-fibonacci${domainSelection.incomingDirectionCount}`
				+ `:${coordinate.positionIndex}:${coordinate.directionIndex}`,
			coordinates: [
				coordinate.positionIndex,
				coordinate.directionIndex,
			],
			zBinIndex:
				/** @type {number} */ (
					coordinate.positionNode.metadata.zIndex
				),
			rhoBinIndex:
				/** @type {number} */ (
					coordinate.positionNode.metadata.rhoIndex
				),
			altitude:
				/** @type {Distance} */ (
					coordinate.positionNode.metadata.z
				),
			rho:
				/** @type {Distance} */ (
					coordinate.positionNode.metadata.rho
				),
			incomingDirection: coordinate.incomingDirection,
			directionIndex: coordinate.directionIndex,
			metadata: {
				position:
					coordinate.positionNode.metadata.position,
				positionIndex: coordinate.positionIndex,
			},
		}),
		resolvePhysicalRadianceDirection: (coordinate) =>
			request.geometry.expressPhysicalScatteringCacheDirection({
				position:
					/** @type {Position} */ (
						coordinate.positionNode.metadata.position
				),
				cacheDirection: coordinate.cacheDirection,
			}),
		pathIntervalCount:
			request.pathIntervalCount
			?? LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
		onProgress: request.onProgress,
	});
}
