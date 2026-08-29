import {resolveW39Stencil} from '../domains/cubedSphereW39DirectionDomain.js';
import {
	createActualPointSourceFrame,
	createRepresentativeActualPoint,
	expressActualPointDirectionInWorld,
	expressWorldDirectionInActualPointFrame,
} from '../geometry/ActualPointCoordinates.js';
import {
	addScaled,
	intersectRaySphere,
	normalize,
	resolveAtmosphereBranch,
	resolveDistantSourceVisibility,
	splitAtmosphereBranch,
} from '../geometry/SphericalAtmosphereGeometry.js';

function resolveLinearNodeStencil(nodes, value, readValue, label) {
	if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
	const first = readValue(nodes[0]);
	const last = readValue(nodes.at(-1));
	if (value <= first) return Object.freeze({indices: Object.freeze([0]), weights: Object.freeze([1]), clamped: value < first});
	if (value >= last) return Object.freeze({indices: Object.freeze([nodes.length - 1]), weights: Object.freeze([1]), clamped: value > last});
	let lower = 0;
	let upper = nodes.length - 1;
	while (upper - lower > 1) {
		const middle = Math.floor((lower + upper) / 2);
		if (readValue(nodes[middle]) <= value) lower = middle;
		else upper = middle;
	}
	const lowerValue = readValue(nodes[lower]);
	const upperValue = readValue(nodes[upper]);
	if (value === lowerValue) return Object.freeze({indices: Object.freeze([lower]), weights: Object.freeze([1]), clamped: false});
	if (value === upperValue) return Object.freeze({indices: Object.freeze([upper]), weights: Object.freeze([1]), clamped: false});
	const fraction = (value - lowerValue) / (upperValue - lowerValue);
	return Object.freeze({
		indices: Object.freeze([lower, upper]),
		weights: Object.freeze([1 - fraction, fraction]),
		clamped: false,
	});
}

export function resolveAltitudeStencil(positionDomain, altitudeMeters) {
	return resolveLinearNodeStencil(
		positionDomain.nodes,
		altitudeMeters,
		(node) => node.altitudeMeters,
		'altitudeMeters',
	);
}

export function resolveSolarZenithStencil(solarZenithDomain, degrees) {
	return resolveLinearNodeStencil(
		solarZenithDomain.nodes,
		degrees,
		(node) => node.solarZenithDegrees,
		'solarZenithDegrees',
	);
}

function createActualPointState({point, worldOutgoingDirection, buildRequest}) {
	const spec = buildRequest.transportSpec;
	const directionToSource = [0, 0, 1];
	const frame = createActualPointSourceFrame({point, directionToSource});
	const localOutgoingDirection = expressWorldDirectionInActualPointFrame(
		frame,
		worldOutgoingDirection,
	);
	const altitudeMeters = frame.radiusMeters - spec.planet.bottomRadiusMeters;
	return Object.freeze({
		point,
		radiusMeters: frame.radiusMeters,
		altitudeMeters,
		muS: frame.muS,
		solarZenithDegrees: frame.solarZenithDegrees,
		frame,
		worldOutgoingDirection,
		localOutgoingDirection,
		stencils: Object.freeze({
			altitude: resolveAltitudeStencil(spec.domains.position, altitudeMeters),
			solarZenith: resolveSolarZenithStencil(
				spec.domains.solarZenith,
				frame.solarZenithDegrees,
			),
			outgoing: resolveW39Stencil(localOutgoingDirection),
		}),
		sourceVisibility: resolveDistantSourceVisibility({
			point,
			directionToSource,
			bottomRadiusMeters: spec.planet.bottomRadiusMeters,
		}),
	});
}

/** Packet for direct/scattering evaluation at one solver-grid state. */
export function createDirectQueryPacket({
	buildRequest,
	positionIndex,
	solarZenithIndex,
	outgoingDirectionIndex,
}) {
	const spec = buildRequest.transportSpec;
	const position = spec.domains.position.nodes[positionIndex];
	const solarZenith = spec.domains.solarZenith.nodes[solarZenithIndex];
	const localOutgoing = spec.domains.outgoing.unitVectors[outgoingDirectionIndex];
	if (!position || !solarZenith || !localOutgoing) {
		return Object.freeze({valid: false, reason: 'domain-index-out-of-range'});
	}
	const point = createRepresentativeActualPoint({
		radiusMeters: spec.planet.bottomRadiusMeters + position.altitudeMeters,
		muS: solarZenith.muS,
	});
	const frame = createActualPointSourceFrame({
		point,
		directionToSource: [0, 0, 1],
	});
	const worldOutgoingDirection = expressActualPointDirectionInWorld(
		frame,
		localOutgoing,
	);
	return Object.freeze({
		valid: true,
		kind: 'actual-point-direct-query-v1',
		indices: Object.freeze({positionIndex, solarZenithIndex, outgoingDirectionIndex}),
		state: createActualPointState({point, worldOutgoingDirection, buildRequest}),
	});
}

/** Packet for a complete J-to-L transport branch at one solver-grid state. */
export function createTransportQueryPacket({
	buildRequest,
	positionIndex,
	solarZenithIndex,
	transportDirectionLocal,
	intervalCount = buildRequest.transportSpec.numerical.transportIntervalCount,
}) {
	if (!Number.isInteger(intervalCount) || intervalCount <= 0) {
		throw new RangeError('intervalCount must be a positive integer.');
	}
	const spec = buildRequest.transportSpec;
	const position = spec.domains.position.nodes[positionIndex];
	const solarZenith = spec.domains.solarZenith.nodes[solarZenithIndex];
	if (!position || !solarZenith) {
		return Object.freeze({valid: false, reason: 'domain-index-out-of-range'});
	}
	const point = createRepresentativeActualPoint({
		radiusMeters: spec.planet.bottomRadiusMeters + position.altitudeMeters,
		muS: solarZenith.muS,
	});
	const frame = createActualPointSourceFrame({
		point,
		directionToSource: [0, 0, 1],
	});
	const localDirection = normalize(transportDirectionLocal, 'transportDirectionLocal');
	const worldDirection = expressActualPointDirectionInWorld(
		frame,
		localDirection,
	);
	const originState = createActualPointState({
		point,
		worldOutgoingDirection: worldDirection,
		buildRequest,
	});
	const branch = resolveAtmosphereBranch({
		origin: point,
		direction: worldDirection,
		bottomRadiusMeters: spec.planet.bottomRadiusMeters,
		topRadiusMeters: spec.planet.topRadiusMeters,
	});
	if (!branch.valid) return Object.freeze({valid: false, reason: branch.reason});
	const split = splitAtmosphereBranch({
		branch,
		directionToSource: [0, 0, 1],
		bottomRadiusMeters: spec.planet.bottomRadiusMeters,
	});
	const samples = Object.freeze(Array.from({length: intervalCount}, (_unused, index) => {
		const distanceMeters = branch.lengthMeters * (index + 0.5) / intervalCount;
		return Object.freeze({
			index,
			distanceMeters,
			weightMeters: branch.lengthMeters / intervalCount,
			state: createActualPointState({
				point: addScaled(branch.origin, branch.direction, distanceMeters),
				worldOutgoingDirection: branch.direction,
				buildRequest,
			}),
		});
	}));
	return Object.freeze({
		valid: true,
		kind: 'actual-point-transport-query-v1',
		originState,
		transportDirectionLocal: localDirection,
		transportDirectionWorld: worldDirection,
		branch,
		split,
		samples,
	});
}

function firstNonnegativeRoot(intersection) {
	return intersection.rootsMeters.find((root) => root >= -1e-7) ?? null;
}

/** Resolve one rectangular scene-page node to its actual forward ray point. */
export function createProjectionQueryPacket({
	buildRequest,
	scenePageIndex = 0,
	positionIndex,
	outgoingDirectionIndex,
}) {
	const page = buildRequest.scenePageRequests[scenePageIndex];
	if (!page) return Object.freeze({valid: false, reason: 'scene-page-index-out-of-range'});
	const position = page.domains.position.nodes[positionIndex];
	const canonicalRayDirection = page.domains.outgoing.unitVectors[outgoingDirectionIndex];
	if (!position || !canonicalRayDirection) {
		return Object.freeze({valid: false, reason: 'domain-index-out-of-range'});
	}
	const spec = buildRequest.transportSpec;
	const observerRadius = spec.planet.bottomRadiusMeters + page.observer.heightMeters;
	const observerPoint = Object.freeze([0, 0, observerRadius]);
	const shellRadius = spec.planet.bottomRadiusMeters + position.altitudeMeters;
	const shellIntersection = intersectRaySphere({
		origin: observerPoint,
		direction: canonicalRayDirection,
		radiusMeters: shellRadius,
	});
	const distanceMeters = firstNonnegativeRoot(shellIntersection);
	if (distanceMeters === null) {
		return Object.freeze({valid: false, reason: 'no-forward-altitude-shell-intersection'});
	}
	const groundDistance = firstNonnegativeRoot(intersectRaySphere({
		origin: observerPoint,
		direction: canonicalRayDirection,
		radiusMeters: spec.planet.bottomRadiusMeters,
	}));
	if (groundDistance !== null && groundDistance < distanceMeters - 1e-7) {
		return Object.freeze({valid: false, reason: 'ground-occluded-altitude-shell'});
	}
	const point = addScaled(observerPoint, canonicalRayDirection, distanceMeters);
	const directionToSource = page.canonicalFrame.directionToSourceCanonical;
	const frame = createActualPointSourceFrame({point, directionToSource});
	const localOutgoingDirection = expressWorldDirectionInActualPointFrame(
		frame,
		canonicalRayDirection,
	);
	return Object.freeze({
		valid: true,
		kind: 'scene-page-projection-query-v1',
		pageId: page.id,
		indices: Object.freeze({scenePageIndex, positionIndex, outgoingDirectionIndex}),
		observerPoint,
		canonicalRayDirection,
		distanceMeters,
		point,
		radiusMeters: frame.radiusMeters,
		altitudeMeters: frame.radiusMeters - spec.planet.bottomRadiusMeters,
		muS: frame.muS,
		solarZenithDegrees: frame.solarZenithDegrees,
		localOutgoingDirection,
		transportStencils: Object.freeze({
			position: resolveAltitudeStencil(spec.domains.position, position.altitudeMeters),
			solarZenith: resolveSolarZenithStencil(spec.domains.solarZenith, frame.solarZenithDegrees),
			outgoing: resolveW39Stencil(localOutgoingDirection),
		}),
		sourceVisibility: resolveDistantSourceVisibility({
			point,
			directionToSource,
			bottomRadiusMeters: spec.planet.bottomRadiusMeters,
		}),
	});
}
