import {resolveW39Stencil} from '../san-jose-nautical-cache-poc/domains/cubedSphereW39DirectionDomain.js';
import {
	createActualPointSourceFrame,
	expressWorldDirectionInActualPointFrame,
} from '../san-jose-nautical-cache-poc/geometry/ActualPointCoordinates.js';
import {lookupPackedRow} from './buildInventoryLedger.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from './sceneCacheContract.js';

function linearStencil(nodes, value, maximumValue = nodes.at(-1)) {
	if (!Number.isFinite(value) || value < nodes[0] || value > maximumValue) {
		throw new RangeError('Point-local coordinate is outside declared support.');
	}
	if (value >= nodes.at(-1)) return [{index: nodes.length - 1, weight: 1}];
	const exactIndex = nodes.findIndex((node) => Math.abs(value - node) <= 1e-7);
	if (exactIndex >= 0) return [{index: exactIndex, weight: 1}];
	let lower = 0;
	let upper = nodes.length - 1;
	while (upper - lower > 1) {
		const middle = Math.floor((lower + upper) / 2);
		if (nodes[middle] <= value) lower = middle;
		else upper = middle;
	}
	if (value === nodes[lower]) return [{index: lower, weight: 1}];
	if (value === nodes[upper]) return [{index: upper, weight: 1}];
	const fraction = (value - nodes[lower]) / (nodes[upper] - nodes[lower]);
	return [{index: lower, weight: 1 - fraction}, {index: upper, weight: fraction}];
}

function zenithNodes() {
	const grid = CONTRACT.domains.solarZenith;
	return Array.from({length: grid.count},
		(_unused, index) => grid.firstCenterDegrees + index * grid.spacingDegrees);
}

export function createPointLocalQuery({
	point,
	worldOutgoingDirection,
	directionToSource,
	ledger,
}) {
	const frame = createActualPointSourceFrame({point, directionToSource});
	const altitudeMeters = frame.radiusMeters - ledger.rows[0].altitudeMeters
		- CONTRACT.scenes[0].support.bottomRadiusMeters;
	const localOutgoingDirection = expressWorldDirectionInActualPointFrame(
		frame, worldOutgoingDirection);
	const altitude = linearStencil(CONTRACT.domains.altitude.nodesMeters,
		altitudeMeters, CONTRACT.scenes[0].support.topRadiusMeters
			- CONTRACT.scenes[0].support.bottomRadiusMeters);
	const solarZenith = linearStencil(zenithNodes(), frame.solarZenithDegrees, 180);
	const outgoing = resolveW39Stencil(localOutgoingDirection);
	const taps = new Map();
	for (const a of altitude) for (const z of solarZenith) {
		const packedRow = lookupPackedRow(ledger, a.index, z.index);
		for (let index = 0; index < outgoing.indices.length; index += 1) {
			const key = `${packedRow}:${outgoing.indices[index]}`;
			taps.set(key, (taps.get(key) ?? 0)
				+ a.weight * z.weight * outgoing.weights[index]);
		}
	}
	const entries = [...taps.entries()].map(([key, weight]) => {
		const [packedRow, directionIndex] = key.split(':').map(Number);
		return {packedRow, directionIndex, weight};
	});
	const weightSum = entries.reduce((sum, tap) => sum + tap.weight, 0);
	return {
		altitudeMeters,
		muS: frame.muS,
		solarZenithDegrees: frame.solarZenithDegrees,
		localOutgoingDirection,
		altitudeStencil: altitude,
		solarZenithStencil: solarZenith,
		outgoingStencil: outgoing,
		taps: entries,
		weightSum,
	};
}

export function sampleNative15(payload, ledger, query) {
	const width = CONTRACT.domains.outgoingPoc.count;
	const height = ledger.retainedBlockCount;
	if (!(payload instanceof Float32Array)
		|| payload.length !== width * height * CONTRACT.domains.spectral.count) {
		throw new RangeError('Native15 payload shape does not match its ledger.');
	}
	return Float64Array.from({length: CONTRACT.domains.spectral.count},
		(_unused, wavelengthIndex) => query.taps.reduce((sum, tap) => sum
			+ tap.weight * payload[(wavelengthIndex * height + tap.packedRow) * width
				+ tap.directionIndex], 0));
}
