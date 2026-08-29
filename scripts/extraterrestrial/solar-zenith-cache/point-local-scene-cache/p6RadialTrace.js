import {resolveW39Stencil} from
	'../san-jose-nautical-cache-poc/domains/cubedSphereW39DirectionDomain.js';
import {
	createActualPointSourceFrame,
	expressWorldDirectionInActualPointFrame,
} from '../san-jose-nautical-cache-poc/geometry/ActualPointCoordinates.js';

const WIDTH = 640;
const HEIGHT = 400;
const BOTTOM_RADIUS = 6360000;
const TOP_RADIUS = 6420000;
const WAVELENGTHS = [375.6666666666667,407,438.3333333333333,469.66666666666663,501,532.3333333333333,563.6666666666666,595,626.3333333333333,657.6666666666666,689,720.3333333333333,751.6666666666666,783,814.3333333333333];

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1],
	a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (v) => { const length = Math.hypot(...v); return v.map((x) => x / length); };
const addScaled = (a, b, scale) => a.map((value, index) => value + b[index] * scale);

function roots(origin, direction, radius) {
	const projection = dot(origin, direction);
	const discriminant = projection * projection - (dot(origin, origin) - radius * radius);
	if (discriminant < 0) return [Infinity, Infinity];
	const root = Math.sqrt(Math.max(0, discriminant));
	return [-projection - root, -projection + root];
}

function positiveRoot(values) {
	if (values[0] > 1e-3) return values[0];
	if (values[1] > 1e-3) return values[1];
	return Infinity;
}

function linearStencil(nodes, value) {
	if (value <= nodes[0]) return [{index: 0, weight: 1}];
	if (value >= nodes.at(-1)) return [{index: nodes.length - 1, weight: 1}];
	let upper = 1;
	while (nodes[upper] < value) upper += 1;
	const lower = upper - 1;
	const fraction = (value - nodes[lower]) / (nodes[upper] - nodes[lower]);
	return [{index: lower, weight: 1 - fraction}, {index: upper, weight: fraction}];
}

function packedRow(ledger, altitudeIndex, zenithIndex) {
	const row = ledger.rows[altitudeIndex];
	if (!row || zenithIndex < row.retainedZenith.firstIndex
		|| zenithIndex > row.retainedZenith.lastIndex) {
		throw new RangeError('Diagnostic query is outside the packed ledger.');
	}
	return row.packed.firstRow + zenithIndex - row.retainedZenith.firstIndex;
}

function query({point, direction, sourceDirection, altitudeNodes, ledger}) {
	const frame = createActualPointSourceFrame({point, directionToSource: sourceDirection});
	const altitudeMeters = frame.radiusMeters - BOTTOM_RADIUS;
	const altitudeStencil = linearStencil(altitudeNodes, altitudeMeters);
	const zenithStencil = linearStencil(
		Array.from({length: 180}, (_unused, index) => index + 0.5),
		frame.solarZenithDegrees,
	);
	const localOutgoingDirection = expressWorldDirectionInActualPointFrame(frame, direction);
	const outgoingStencil = resolveW39Stencil(localOutgoingDirection);
	const taps = [];
	for (const altitude of altitudeStencil) for (const zenith of zenithStencil) {
		const row = packedRow(ledger, altitude.index, zenith.index);
		for (let index = 0; index < outgoingStencil.indices.length; index += 1) {
			taps.push({packedRow: row, directionIndex: outgoingStencil.indices[index],
				weight: altitude.weight * zenith.weight * outgoingStencil.weights[index]});
		}
	}
	return {altitudeMeters, muS: frame.muS,
		solarZenithDegrees: frame.solarZenithDegrees, localOutgoingDirection,
		altitudeStencil, zenithStencil, outgoingStencil, taps};
}

function sampleSpectrum(payload, ledger, taps) {
	const height = ledger.retainedBlockCount;
	return Array.from({length: 15}, (_unused, channel) => taps.reduce((sum, tap) =>
		sum + tap.weight * payload[(channel * height + tap.packedRow) * 9126
			+ tap.directionIndex], 0));
}

function extinction(altitudeMeters, channel, ozoneTable) {
	const wavelengthMicrometers = WAVELENGTHS[channel] / 1000;
	const rayleigh = 0.00000124062 * wavelengthMicrometers ** -4
		* Math.exp(-altitudeMeters / 8000);
	const mie = (0.04 / 1200) * wavelengthMicrometers ** -0.8
		* Math.exp(-altitudeMeters / 1200);
	const ozoneScale = altitudeMeters <= 10000 || altitudeMeters >= 40000 ? 0
		: altitudeMeters <= 25000 ? (altitudeMeters - 10000) / 15000
			: (40000 - altitudeMeters) / 15000;
	const coordinate = (WAVELENGTHS[channel] - ozoneTable.minimumNanometers)
		/ ozoneTable.spacingNanometers;
	const lower = Math.floor(coordinate);
	const upper = Math.min(ozoneTable.values.length - 1, lower + 1);
	const fraction = coordinate - lower;
	const ozone = ozoneTable.values[lower] * (1 - fraction)
		+ ozoneTable.values[upper] * fraction;
	return rayleigh + mie + 5.374e18 * ozone * ozoneScale;
}

function cameraDirection(page, screenX, screenY) {
	const azimuth = page.scene.camera.viewAzimuthDegrees * Math.PI / 180;
	const elevation = page.scene.camera.viewElevationDegrees * Math.PI / 180;
	const uen = [Math.sin(elevation), Math.sin(azimuth) * Math.cos(elevation),
		Math.cos(azimuth) * Math.cos(elevation)];
	const frame = page.canonicalFrame;
	const forward = normalize([dot(uen, frame.xAxisUpEastNorth),
		dot(uen, frame.yAxisUpEastNorth), dot(uen, frame.zAxisUpEastNorth)]);
	const right = normalize(cross(forward, [0, 0, 1]));
	const up = normalize(cross(right, forward));
	const ndcX = 2 * (screenX + 0.5) / WIDTH - 1;
	const fragmentY = HEIGHT - 1 - screenY;
	const ndcY = 2 * (fragmentY + 0.5) / HEIGHT - 1;
	const tangent = Math.tan(78 * Math.PI / 360);
	return normalize([0, 1, 2].map((axis) => forward[axis]
		+ right[axis] * ndcX * tangent * WIDTH / HEIGHT
		+ up[axis] * ndcY * tangent));
}

/** Reproduce the renderer's 15 midpoint path samples for one screen pixel. */
export function traceP6Pixel({label, screenX, screenY, buildRequest, payload, ledger}) {
	const page = buildRequest.scenePageRequests[0];
	const direction = cameraDirection(page, screenX, screenY);
	const origin = [0, 0, BOTTOM_RADIUS + 1.7];
	const top = positiveRoot(roots(origin, direction, TOP_RADIUS));
	const ground = positiveRoot(roots(origin, direction, BOTTOM_RADIUS));
	const groundHit = ground < top;
	const lengthMeters = Math.min(top, ground);
	const stepMeters = lengthMeters / 15;
	const altitudeNodes = buildRequest.transportSpec.domains.position.nodes
		.map((node) => node.altitudeMeters);
	const sourceDirection = page.canonicalFrame.directionToSourceCanonical;
	const ozoneTable = buildRequest.transportSpec.atmosphere.ozone.crossSectionTable;
	const radiance = new Array(15).fill(0);
	const transmittance = new Array(15).fill(1);
	const samples = [];
	for (let sampleIndex = 0; sampleIndex < 15; sampleIndex += 1) {
		const distanceMeters = (sampleIndex + 0.5) * stepMeters;
		const point = addScaled(origin, direction, distanceMeters);
		const cacheQuery = query({point, direction, sourceDirection, altitudeNodes, ledger});
		const density = sampleSpectrum(payload, ledger, cacheQuery.taps);
		const contribution = new Array(15);
		for (let channel = 0; channel < 15; channel += 1) {
			const ext = extinction(cacheQuery.altitudeMeters, channel, ozoneTable);
			transmittance[channel] *= Math.exp(-0.5 * ext * stepMeters);
			contribution[channel] = transmittance[channel] * density[channel] * stepMeters;
			radiance[channel] += contribution[channel];
			transmittance[channel] *= Math.exp(-0.5 * ext * stepMeters);
		}
		samples.push({sampleIndex, distanceMeters,
			altitudeMeters: cacheQuery.altitudeMeters,
			solarZenithDegrees: cacheQuery.solarZenithDegrees,
			muS: cacheQuery.muS,
			altitudeStencil: cacheQuery.altitudeStencil,
			zenithStencil: cacheQuery.zenithStencil,
			outgoingIndices: cacheQuery.outgoingStencil.indices,
			outgoingWeights: cacheQuery.outgoingStencil.weights,
			tapCount: cacheQuery.taps.length,
			densityNative15: density,
			pathContributionNative15: contribution});
	}
	return {label, screen: {x: screenX, y: screenY}, direction, groundHit,
		lengthMeters, stepMeters, finalPathRadianceNative15: radiance,
		finalTransmittanceNative15: transmittance, samples};
}

