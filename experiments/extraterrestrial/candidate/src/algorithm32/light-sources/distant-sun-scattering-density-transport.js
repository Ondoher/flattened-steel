/**
 * Adapt source-owned distant-Sun domains to the generic selected-Star
 * `Jk -> Lk` CPU transport operation. Native-altitude cache coordinates,
 * distant source framing, W27 lookup, the selected interval control, output
 * allocation, and provenance remain owned here rather than inferred from
 * descriptor metadata by generic transport.
 */

import {
	transportPureScatteringDensity,
} from '../transport/scattering-density-transport.js';
import {
	ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY,
} from '../transport/consts.js';
import { createDistantSunCpuPureRadianceField } from './DistantSunCpuFields.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from './consts.js';

/**
 * Resolve the native-altitude cache coordinate owned by the distant source.
 *
 * @param {PureScatteringDensityBuildCoordinateRequest} request - Supplies logical field state.
 * @param {DistantSunConstructionDomainSelection} domainSelection - Supplies
 * selected coordinate identity.
 * @returns {CacheBuildCoordinate} Return the native construction coordinate.
 */
function resolveDistantSunBuildCoordinate(request, domainSelection) {
	return {
		coordinateKey:
			`native-${domainSelection.positionCount}`
			+ `-fibonacci-${domainSelection.incomingDirectionCount}`
			+ `:${request.positionIndex}:${request.directionIndex}`,
		coordinates: [request.positionIndex, request.directionIndex],
		altitudeBinIndex: request.positionIndex,
		directionIndex: request.directionIndex,
		altitude: request.positionNode.coordinate,
		incomingDirection: request.incomingDirection,
	};
}

/**
 * Create the distant source's physical radiance-direction resolver.
 *
 * @param {DistantSunScatteringDensityTransportGeometry} geometry - Supplies frame mapping.
 * @returns {PureScatteringDensityPhysicalRadianceDirectionResolver} Return the source-owned resolver.
 */
function createPhysicalRadianceDirectionResolver(geometry) {
	return (request) =>
		geometry.expressPhysicalIncomingRadianceDirection(
			request.cacheDirection,
		);
}

/**
 * Resolve source-owned executable facts before allocating the pure Lk output.
 *
 * @param {DistantSunScatteringDensityTransportRequest} request - Supplies adapter inputs.
 * @returns {{
 *   scatteringDensity: CpuDirectionalSpectralFieldContract,
 *   order: number,
 *   id: string,
 *   domainSelection: DistantSunConstructionDomainSelection,
 *   transportIntervalCount: number,
 * }} Return accepted allocation facts.
 */
function normalizeTransportRequest(request) {
	const domainSelection = request.domainSelection
		?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

	return {
		scatteringDensity: request.scatteringDensity,
		order: request.scatteringOrder,
		id: request.id === undefined
			? `algorithm32-distant-sun-cpu-pure-l${request.scatteringOrder}-stored-transport-v1`
			: request.id,
		domainSelection,
		transportIntervalCount: request.transportIntervalCount,
	};
}

/**
 * Allocate and build one distant-Sun pure Lk through the selected Star
 * stored-field transport. J1 is accepted for diagnostics only; production L1
 * remains the separate direct-primary field.
 *
 * @param {DistantSunScatteringDensityTransportRequest} request - Supplies accepted collaborators and Jk.
 * @returns {CpuDirectionalSpectralFieldContract} Return sealed pure Lk.
 */
export function buildDistantSunCpuTransportedRadiance(request) {
	const {
		scatteringDensity,
		order,
		id,
		domainSelection,
		transportIntervalCount,
	} = normalizeTransportRequest(request);
	const outputRadiance = createDistantSunCpuPureRadianceField({
		id,
		order,
		provenanceIdentity: ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY,
		domainSelection,
	});

	return transportPureScatteringDensity({
		scatteringDensity,
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
				}),
		resolveDirectionStencil: (direction) =>
			domainSelection.resolveOutgoingDirectionStencil(direction),
		resolveBuildCoordinate: (coordinateRequest) =>
			resolveDistantSunBuildCoordinate(
				coordinateRequest,
				domainSelection,
			),
		resolvePhysicalRadianceDirection:
			createPhysicalRadianceDirectionResolver(request.geometry),
		pathIntervalCount: transportIntervalCount,
	});
}
