const FACE_WIDTH = 39;
const CELL_WIDTH = FACE_WIDTH - 1;
const FACE_NODE_COUNT = FACE_WIDTH * FACE_WIDTH;
const DIRECTION_COUNT = 6 * FACE_NODE_COUNT;
const EXACT_NODE_TOLERANCE = 1e-12;

const FACE_DEFINITIONS = Object.freeze([
	['positive-x', [1, 0, 0], [0, 1, 0], [0, 0, 1]],
	['negative-x', [-1, 0, 0], [0, -1, 0], [0, 0, 1]],
	['positive-y', [0, 1, 0], [-1, 0, 0], [0, 0, 1]],
	['negative-y', [0, -1, 0], [1, 0, 0], [0, 0, 1]],
	['positive-z', [0, 0, 1], [1, 0, 0], [0, 1, 0]],
	['negative-z', [0, 0, -1], [-1, 0, 0], [0, 1, 0]],
].map(([id, normal, uAxis, vAxis]) => Object.freeze({
	id,
	normal: Object.freeze(normal),
	uAxis: Object.freeze(uAxis),
	vAxis: Object.freeze(vAxis),
})));

function canonicalZero(value) {
	return value === 0 ? 0 : value;
}

function dot(left, right) {
	return left[0] * right[0]
		+ left[1] * right[1]
		+ left[2] * right[2];
}

function normalize(vector) {
	const length = Math.hypot(...vector);
	if (!Number.isFinite(length) || length === 0) {
		throw new RangeError('Cubed-sphere direction must be finite and nonzero.');
	}
	return Object.freeze([
		canonicalZero(vector[0] / length),
		canonicalZero(vector[1] / length),
		canonicalZero(vector[2] / length),
	]);
}

/** Flatten one W39 face node. */
export function flattenW39NodeIndex(faceIndex, uIndex, vIndex) {
	for (const [value, count, label] of [
		[faceIndex, 6, 'faceIndex'],
		[uIndex, FACE_WIDTH, 'uIndex'],
		[vIndex, FACE_WIDTH, 'vIndex'],
	]) {
		if (!Number.isInteger(value) || value < 0 || value >= count) {
			throw new RangeError(`${label} must be an integer in [0, ${count}).`);
		}
	}
	return faceIndex * FACE_NODE_COUNT + vIndex * FACE_WIDTH + uIndex;
}

/** Return the exact generated source-local vector for one flattened node. */
export function createW39UnitVector(index) {
	if (!Number.isInteger(index) || index < 0 || index >= DIRECTION_COUNT) {
		throw new RangeError(`W39 index must be in [0, ${DIRECTION_COUNT}).`);
	}
	const faceIndex = Math.floor(index / FACE_NODE_COUNT);
	const localIndex = index - faceIndex * FACE_NODE_COUNT;
	const vIndex = Math.floor(localIndex / FACE_WIDTH);
	const uIndex = localIndex - vIndex * FACE_WIDTH;
	const face = FACE_DEFINITIONS[faceIndex];
	const uNumerator = 2 * uIndex - CELL_WIDTH;
	const vNumerator = 2 * vIndex - CELL_WIDTH;
	const cubePoint = [0, 1, 2].map((component) => canonicalZero(
		face.normal[component] * CELL_WIDTH
		+ face.uAxis[component] * uNumerator
		+ face.vAxis[component] * vNumerator,
	));
	const firstProjection = normalize(cubePoint);
	return normalize(firstProjection);
}

/** Create one executable W39 lattice under a named physical frame. */
export function createCubedSphereW39DirectionDomain({id, frame}) {
	if (typeof id !== 'string' || id.length === 0) {
		throw new TypeError('W39 domain id must be non-empty.');
	}
	if (typeof frame !== 'string' || frame.length === 0) {
		throw new TypeError('W39 frame must be non-empty.');
	}
	const unitVectors = Object.freeze(Array.from(
		{length: DIRECTION_COUNT},
		(_unused, index) => createW39UnitVector(index),
	));
	const center = (FACE_WIDTH - 1) / 2;

	return Object.freeze({
		id,
		kind: 'reconstruction-direction-domain',
		frame,
		faceWidth: FACE_WIDTH,
		cellWidth: CELL_WIDTH,
		faceNodeCount: FACE_NODE_COUNT,
		directionCount: DIRECTION_COUNT,
		faces: FACE_DEFINITIONS,
		unitVectors,
		positiveFaceCenterIndices: Object.freeze({
			positiveX: flattenW39NodeIndex(0, center, center),
			positiveY: flattenW39NodeIndex(2, center, center),
			positiveZ: flattenW39NodeIndex(4, center, center),
		}),
		interpolation: 'dominant-face bilinear',
		seamStorage: 'duplicate identical physical edge and corner nodes',
		provenance: Object.freeze({
			policyId: 'contained-spherical-cubed-sphere-w39-outgoing-v1',
			comparisonPath:
				'scripts/extraterrestrial/stellar-screen-palette/DoubledOutgoingSphericalEarthGeometry.js',
			generatorComparisonPath:
				'src/algorithm32/sampling-domains/direction/cubed-sphere/CubedSphereDirectionDomain.js',
		}),
	});
}

function gridLocation(coordinate) {
	const rounded = Math.round(coordinate);
	if (Math.abs(coordinate - rounded) <= EXACT_NODE_TOLERANCE) {
		return {lower: rounded, upper: rounded, fraction: 0, exact: true};
	}
	const lower = Math.floor(coordinate);
	return {
		lower,
		upper: Math.min(lower + 1, FACE_WIDTH - 1),
		fraction: coordinate - lower,
		exact: false,
	};
}

/** Resolve the retained dominant-face bilinear W39 stencil. */
export function resolveW39Stencil(direction) {
	const unit = normalize(direction);
	let faceIndex = 0;
	let selectedProjection = Number.NEGATIVE_INFINITY;
	for (let index = 0; index < FACE_DEFINITIONS.length; index += 1) {
		const projection = dot(unit, FACE_DEFINITIONS[index].normal);
		if (projection > selectedProjection) {
			selectedProjection = projection;
			faceIndex = index;
		}
	}
	const face = FACE_DEFINITIONS[faceIndex];
	const denominator = dot(unit, face.normal);
	const u = Math.max(-1, Math.min(1, dot(unit, face.uAxis) / denominator));
	const v = Math.max(-1, Math.min(1, dot(unit, face.vAxis) / denominator));
	const uLocation = gridLocation((u + 1) * CELL_WIDTH * 0.5);
	const vLocation = gridLocation((v + 1) * CELL_WIDTH * 0.5);
	const taps = new Map();
	const addTap = (uIndex, vIndex, weight) => {
		if (weight === 0) return;
		const index = flattenW39NodeIndex(faceIndex, uIndex, vIndex);
		taps.set(index, (taps.get(index) ?? 0) + weight);
	};
	addTap(
		uLocation.lower,
		vLocation.lower,
		(1 - uLocation.fraction) * (1 - vLocation.fraction),
	);
	addTap(
		uLocation.upper,
		vLocation.lower,
		uLocation.fraction * (1 - vLocation.fraction),
	);
	addTap(
		uLocation.lower,
		vLocation.upper,
		(1 - uLocation.fraction) * vLocation.fraction,
	);
	addTap(
		uLocation.upper,
		vLocation.upper,
		uLocation.fraction * vLocation.fraction,
	);
	const entries = [...taps.entries()];
	const total = entries.reduce((sum, entry) => sum + entry[1], 0);
	return Object.freeze({
		indices: Object.freeze(entries.map((entry) => entry[0])),
		weights: Object.freeze(entries.map((entry) => entry[1] / total)),
	});
}

export const W39_DIRECTION_COUNT = DIRECTION_COUNT;
export const W39_FACE_WIDTH = FACE_WIDTH;
