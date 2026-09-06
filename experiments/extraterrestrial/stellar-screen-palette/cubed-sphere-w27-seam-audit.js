/** Read-only CPU and resident-R32F diagnostics for the selected W27 domain. */
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	CUBED_SPHERE_W27_FACES,
	CUBED_SPHERE_W27_UNIT_VECTORS,
	createCubedSphereW27DirectionStencil,
	unflattenCubedSphereW27NodeIndex,
} from '../candidate/src/algorithm32/domains/CubedSphereW27DirectionDomain.js';

const FACE_WIDTH = CUBED_SPHERE_W27_DIRECTION_DOMAIN.topology.faceWidth;
const CELL_WIDTH = FACE_WIDTH - 1;
const DIRECTION_COUNT = CUBED_SPHERE_W27_DIRECTION_DOMAIN.count;
const DEFAULT_READBACK_BATCH_SIZE = 4096;
const DEFAULT_MAXIMUM_READBACK_SCALAR_COUNT = 25_000;
const DEFAULT_LARGEST_DIFFERENCE_COUNT = 32;
const UNIT_DIRECTION_TOLERANCE = 1e-6;
const STENCIL_WEIGHT_TOLERANCE = 1e-12;

/**
 * Retain a scale sweep that stays well below one W27 cell while crossing the
 * domain's exact-node coordinate tolerance from both sides.
 */
const DEFAULT_CUBED_SPHERE_W27_SEAM_EPSILON_RADIANS = [1e-9, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4];

/**
 * Offer a small explicit Native-48/native-15 survey for expensive scalar
 * WebGL readback. GPU callers still have to pass these arrays deliberately;
 * the readback adapter never silently expands to all 48 by 15 coordinates.
 */
const CUBED_SPHERE_W27_REPRESENTATIVE_AXIS_SELECTION = {
	positionIndices: [0, 23, 47],
	wavelengthIndices: [0, 3, 7, 10, 14],
	positionRoles: ['bottom', 'middle', 'top'],
	wavelengthRoles: ['first', 'lower-interior', 'middle', 'upper-interior', 'last'],
};

/** Describe the diagnostic's fixed interpretation without setting pass/fail tolerances. */
const CUBED_SPHERE_W27_SEAM_AUDIT_CONTRACT = {
	schemaId: 'cubed-sphere-w27-seam-audit-v1',
	domainId: CUBED_SPHERE_W27_DIRECTION_DOMAIN.id,
	domainContentHash: CUBED_SPHERE_W27_DIRECTION_DOMAIN.contentHash,
	faceWidth: FACE_WIDTH,
	storedDirectionCount: DIRECTION_COUNT,
	expectedBoundaryStoredNodeCount: 624,
	expectedEdgeGroupCount: 300,
	expectedCornerGroupCount: 8,
	expectedDuplicatePhysicalNodeGroupCount: 308,
	expectedPairComparisonsPerPositionWavelength: 324,
	duplicateComparison: 'exact stored binary value plus absolute and scale-relative delta',
	interpolationComparison:
		'dominant-face bilinear values at equal signed angular epsilon and one-sided slopes from each face alias',
	mutationPolicy: 'read-only; supplied fields and artifacts are never disposed or changed',
	gpuReadbackPolicy: 'explicit position and wavelength subsets plus a default 25000-scalar hard bound',
};

/**
 * Return a fresh copy of the bounded Native-48/native-15 GPU survey axes.
 * Callers pass these arrays explicitly to the readback planner or audit.
 *
 * @returns {object} The representative position and wavelength indices.
 */
export function createCubedSphereW27RepresentativeAxisSelection() {
	return {
		positionIndices: [...CUBED_SPHERE_W27_REPRESENTATIVE_AXIS_SELECTION.positionIndices],
		wavelengthIndices: [...CUBED_SPHERE_W27_REPRESENTATIVE_AXIS_SELECTION.wavelengthIndices],
		positionRoles: [...CUBED_SPHERE_W27_REPRESENTATIVE_AXIS_SELECTION.positionRoles],
		wavelengthRoles: [...CUBED_SPHERE_W27_REPRESENTATIVE_AXIS_SELECTION.wavelengthRoles],
	};
}

/** @returns {number} The greatest common divisor of nonnegative integers. */
function greatestCommonDivisor(left, right) {
	let a = Math.abs(left);
	let b = Math.abs(right);

	while (b !== 0) {
		const remainder = a % b;
		a = b;
		b = remainder;
	}

	return a;
}

/** @returns {number} One three-component dot product. */
function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

/** @returns {number[]} A normalized copy of one nonzero vector. */
function normalize(vector, label) {
	const length = Math.hypot(...vector);
	if (!(length > 0) || !Number.isFinite(length)) {
		throw new RangeError(`${label} must be a finite nonzero vector.`);
	}

	return vector.map((component) => component / length);
}

/** @returns {number[]} One accepted source-local unit direction. */
function requireUnitDirection(value, label) {
	if ((!Array.isArray(value) && !ArrayBuffer.isView(value)) || value.length !== 3) {
		throw new TypeError(`${label} must contain three coordinates.`);
	}

	const direction = Array.from(value);
	if (direction.some((component) => !Number.isFinite(component))) {
		throw new TypeError(`${label} coordinates must be finite.`);
	}
	const length = Math.hypot(...direction);
	if (Math.abs(length - 1) > UNIT_DIRECTION_TOLERANCE) {
		throw new RangeError(`${label} must be unit length.`);
	}

	return direction;
}

/** @returns {number[]} A validated, ascending epsilon sequence. */
function requireEpsilonRadians(values) {
	if (!Array.isArray(values) || values.length === 0) {
		throw new TypeError('W27 seam epsilonRadians must be a nonempty array.');
	}
	const accepted = values.map((value, index) => {
		if (!(value > 0) || !Number.isFinite(value)) {
			throw new RangeError(`W27 seam epsilonRadians[${index}] must be positive and finite.`);
		}
		return value;
	});
	for (let index = 1; index < accepted.length; index += 1) {
		if (!(accepted[index] > accepted[index - 1])) {
			throw new RangeError('W27 seam epsilonRadians must be strictly increasing.');
		}
	}

	return accepted;
}

/** @returns {number[]} The exact integer cube point for one stored node. */
function cubePointForAddress(address) {
	const face = CUBED_SPHERE_W27_FACES[address.faceIndex];
	const uNumerator = 2 * address.uIndex - CELL_WIDTH;
	const vNumerator = 2 * address.vIndex - CELL_WIDTH;

	return [0, 1, 2].map(
		(component) =>
			face.normal[component] * CELL_WIDTH +
			face.uAxis[component] * uNumerator +
			face.vAxis[component] * vNumerator,
	);
}

/**
 * Identify a physical cubed-sphere ray by its reduced integer cube point.
 * This is exact for the boundary-inclusive W27 grid and avoids float bucketing.
 *
 * @returns {string} The stable physical direction key.
 */
function physicalDirectionKeyForAddress(address) {
	const cubePoint = cubePointForAddress(address);
	const divisor = cubePoint.reduce((value, component) => greatestCommonDivisor(value, component), 0);
	if (divisor === 0) {
		throw new Error('A W27 cube point cannot be the zero vector.');
	}

	return cubePoint.map((component) => component / divisor).join(',');
}

/** @returns {string[]} The face-local boundary roles for one address. */
function edgeRolesForAddress(address) {
	const roles = [];
	if (address.uIndex === 0) roles.push('u-min');
	if (address.uIndex === CELL_WIDTH) roles.push('u-max');
	if (address.vIndex === 0) roles.push('v-min');
	if (address.vIndex === CELL_WIDTH) roles.push('v-max');
	return roles;
}

/** @returns {object} A complete immutable-by-convention node address record. */
function describeNodeAddress(index) {
	const address = unflattenCubedSphereW27NodeIndex(index);
	return {
		index,
		...address,
		normalizedU: (2 * address.uIndex - CELL_WIDTH) / CELL_WIDTH,
		normalizedV: (2 * address.vIndex - CELL_WIDTH) / CELL_WIDTH,
		edgeRoles: edgeRolesForAddress(address),
		physicalDirectionKey: physicalDirectionKeyForAddress(address),
	};
}

/** @returns {number} The maximum component delta among aliased directions. */
function maximumAliasComponentDifference(addresses) {
	const reference = CUBED_SPHERE_W27_UNIT_VECTORS[addresses[0].index];
	let maximum = 0;
	for (let aliasIndex = 1; aliasIndex < addresses.length; aliasIndex += 1) {
		const candidate = CUBED_SPHERE_W27_UNIT_VECTORS[addresses[aliasIndex].index];
		for (let component = 0; component < 3; component += 1) {
			maximum = Math.max(maximum, Math.abs(candidate[component] - reference[component]));
		}
	}
	return maximum;
}

/**
 * Enumerate every duplicated physical node in the boundary-inclusive W27
 * storage. Interior edge nodes appear twice and physical corners three times.
 *
 * @returns {object} Complete topology and alias-address records.
 */
export function enumerateCubedSphereW27DuplicateNodes() {
	const groupsByPhysicalDirection = new Map();
	let boundaryStoredNodeCount = 0;

	for (let index = 0; index < DIRECTION_COUNT; index += 1) {
		const address = describeNodeAddress(index);
		if (address.edgeRoles.length === 0) continue;
		boundaryStoredNodeCount += 1;
		const aliases = groupsByPhysicalDirection.get(address.physicalDirectionKey) ?? [];
		aliases.push(address);
		groupsByPhysicalDirection.set(address.physicalDirectionKey, aliases);
	}

	const groups = [...groupsByPhysicalDirection]
		.map(([physicalDirectionKey, aliases]) => {
			aliases.sort((left, right) => left.faceIndex - right.faceIndex);
			const kind = aliases.length === 2 ? 'edge' : aliases.length === 3 ? 'corner' : 'invalid-multiplicity';
			return {
				id: `w27-${kind}-${physicalDirectionKey}`,
				kind,
				physicalDirectionKey,
				physicalDirection: [...CUBED_SPHERE_W27_UNIT_VECTORS[aliases[0].index]],
				addresses: aliases,
				maximumAliasComponentDifference: maximumAliasComponentDifference(aliases),
			};
		})
		.sort((left, right) => left.addresses[0].index - right.addresses[0].index);
	const edgeGroupCount = groups.filter((group) => group.kind === 'edge').length;
	const cornerGroupCount = groups.filter((group) => group.kind === 'corner').length;
	const invalidMultiplicityCount = groups.length - edgeGroupCount - cornerGroupCount;
	const pairComparisonsPerPositionWavelength = groups.reduce(
		(sum, group) => sum + (group.addresses.length * (group.addresses.length - 1)) / 2,
		0,
	);
	const maximumDirectionDifference = groups.reduce(
		(maximum, group) => Math.max(maximum, group.maximumAliasComponentDifference),
		0,
	);
	const countsMatchContract =
		boundaryStoredNodeCount === CUBED_SPHERE_W27_SEAM_AUDIT_CONTRACT.expectedBoundaryStoredNodeCount &&
		edgeGroupCount === CUBED_SPHERE_W27_SEAM_AUDIT_CONTRACT.expectedEdgeGroupCount &&
		cornerGroupCount === CUBED_SPHERE_W27_SEAM_AUDIT_CONTRACT.expectedCornerGroupCount &&
		groups.length === CUBED_SPHERE_W27_SEAM_AUDIT_CONTRACT.expectedDuplicatePhysicalNodeGroupCount &&
		pairComparisonsPerPositionWavelength ===
			CUBED_SPHERE_W27_SEAM_AUDIT_CONTRACT.expectedPairComparisonsPerPositionWavelength &&
		invalidMultiplicityCount === 0;

	if (!countsMatchContract) {
		throw new Error('W27 duplicate-node topology no longer matches the seam-audit contract.');
	}

	return {
		schemaId: 'cubed-sphere-w27-duplicate-node-topology-v1',
		domain: {
			id: CUBED_SPHERE_W27_DIRECTION_DOMAIN.id,
			contentHash: CUBED_SPHERE_W27_DIRECTION_DOMAIN.contentHash,
			faceWidth: FACE_WIDTH,
			storedDirectionCount: DIRECTION_COUNT,
			uniquePhysicalDirectionCount: CUBED_SPHERE_W27_DIRECTION_DOMAIN.topology.uniquePhysicalDirectionCount,
		},
		counts: {
			boundaryStoredNodeCount,
			duplicatePhysicalNodeGroupCount: groups.length,
			edgeGroupCount,
			cornerGroupCount,
			invalidMultiplicityCount,
			pairComparisonsPerPositionWavelength,
			redundantStoredNodeCount: groups.reduce((sum, group) => sum + group.addresses.length - 1, 0),
		},
		checks: {
			countsMatchContract,
			maximumAliasComponentDifference: maximumDirectionDifference,
			physicalDirectionGrouping: 'reduced-exact-integer-cube-point',
		},
		groups,
	};
}

/**
 * Describe the exact W27 dominant-face lookup for an arbitrary source-local
 * direction. Callers may rotate a world/view ray into that frame first.
 *
 * @param {readonly number[]} direction - Supplies one source-local unit ray.
 * @returns {object} Selected face, face/grid coordinates, and complete taps.
 */
export function describeCubedSphereW27DirectionStencil(direction) {
	const acceptedDirection = requireUnitDirection(direction, 'W27 diagnostic direction');
	const stencil = createCubedSphereW27DirectionStencil(acceptedDirection);
	if (stencil.indices.length === 0 || stencil.indices.length !== stencil.weights.length) {
		throw new Error('W27 direction stencil must contain paired taps.');
	}
	const addresses = stencil.indices.map(describeNodeAddress);
	const faceIndex = addresses[0].faceIndex;
	if (addresses.some((address) => address.faceIndex !== faceIndex)) {
		throw new Error('A dominant-face W27 stencil cannot cross stored faces.');
	}
	const face = CUBED_SPHERE_W27_FACES[faceIndex];
	const denominator = dot(acceptedDirection, face.normal);
	const normalizedU = Math.max(-1, Math.min(1, dot(acceptedDirection, face.uAxis) / denominator));
	const normalizedV = Math.max(-1, Math.min(1, dot(acceptedDirection, face.vAxis) / denominator));
	const weightSum = stencil.weights.reduce((sum, weight) => sum + weight, 0);
	if (!Number.isFinite(weightSum) || Math.abs(weightSum - 1) > STENCIL_WEIGHT_TOLERANCE) {
		throw new Error('W27 direction-stencil weights must sum to one.');
	}

	return {
		direction: acceptedDirection,
		selectedFace: {
			index: faceIndex,
			id: face.id,
		},
		faceCoordinates: {
			u: normalizedU,
			v: normalizedV,
		},
		gridCoordinates: {
			u: (normalizedU + 1) * 0.5 * CELL_WIDTH,
			v: (normalizedV + 1) * 0.5 * CELL_WIDTH,
		},
		weightSum,
		taps: stencil.indices.map((index, tapIndex) => ({
			index,
			weight: stencil.weights[tapIndex],
			address: addresses[tapIndex],
		})),
	};
}

/** @returns {number[]} One tangent direction pointing from face A into B. */
function crossingDirection(boundaryDirection, firstFace, secondFace) {
	const normalDifference = [0, 1, 2].map((component) => secondFace.normal[component] - firstFace.normal[component]);
	const radialComponent = dot(normalDifference, boundaryDirection);
	return normalize(
		normalDifference.map((component, index) => component - radialComponent * boundaryDirection[index]),
		'W27 face-boundary crossing direction',
	);
}

/** @returns {number[]} One great-circle offset around a boundary anchor. */
function offsetDirection(boundaryDirection, crossing, radians) {
	const cosine = Math.cos(radians);
	const sine = Math.sin(radians);
	return normalize(
		boundaryDirection.map((component, index) => cosine * component + sine * crossing[index]),
		'W27 epsilon-offset direction',
	);
}

/**
 * Sweep equal angular epsilons onto both stored faces at all 300 interior edge
 * nodes. Corners are reported by topology but omitted from this unambiguous
 * two-face sweep.
 *
 * @param {object} [options] - Supplies optional epsilon values.
 * @returns {object} Every boundary anchor and its left/right stencils.
 */
export function createCubedSphereW27BoundaryStencilSweep(options = {}) {
	const epsilonRadians = requireEpsilonRadians(
		options.epsilonRadians ?? DEFAULT_CUBED_SPHERE_W27_SEAM_EPSILON_RADIANS,
	);
	const topology = options.topology ?? enumerateCubedSphereW27DuplicateNodes();
	const records = [];
	let faceSelectionMismatchCount = 0;

	for (const group of topology.groups) {
		if (group.kind !== 'edge') continue;
		const firstAlias = group.addresses[0];
		const secondAlias = group.addresses[1];
		const firstFace = CUBED_SPHERE_W27_FACES[firstAlias.faceIndex];
		const secondFace = CUBED_SPHERE_W27_FACES[secondAlias.faceIndex];
		const crossing = crossingDirection(group.physicalDirection, firstFace, secondFace);
		const samples = epsilonRadians.map((epsilon) => {
			const firstSide = describeCubedSphereW27DirectionStencil(
				offsetDirection(group.physicalDirection, crossing, -epsilon),
			);
			const secondSide = describeCubedSphereW27DirectionStencil(
				offsetDirection(group.physicalDirection, crossing, epsilon),
			);
			const faceSelectionMatches =
				firstSide.selectedFace.index === firstAlias.faceIndex &&
				secondSide.selectedFace.index === secondAlias.faceIndex;
			if (!faceSelectionMatches) faceSelectionMismatchCount += 1;
			return {
				epsilonRadians: epsilon,
				faceSelectionMatches,
				firstSide,
				secondSide,
			};
		});
		records.push({
			groupId: group.id,
			physicalDirectionKey: group.physicalDirectionKey,
			boundaryDirection: group.physicalDirection,
			crossingDirection: crossing,
			firstAlias,
			secondAlias,
			exactBoundaryStencil: describeCubedSphereW27DirectionStencil(group.physicalDirection),
			samples,
		});
	}

	return {
		schemaId: 'cubed-sphere-w27-boundary-stencil-sweep-v1',
		domainId: CUBED_SPHERE_W27_DIRECTION_DOMAIN.id,
		epsilonRadians,
		anchorCount: records.length,
		sampleCount: records.length * epsilonRadians.length,
		checks: {
			faceSelectionMismatchCount,
			allFaceSelectionsMatch: faceSelectionMismatchCount === 0,
		},
		records,
	};
}

/** @returns {number} A scale-relative difference with exact-zero semantics. */
function relativeDifference(left, right) {
	const scale = Math.max(Math.abs(left), Math.abs(right));
	return scale === 0 ? 0 : Math.abs(right - left) / scale;
}

/** @returns {object} One validated field reader and its dimensions. */
function acceptFieldReader(fieldOrReader, label) {
	if (fieldOrReader === null || typeof fieldOrReader !== 'object') {
		throw new TypeError(`${label} must be a field or reader capability.`);
	}
	const reader = typeof fieldOrReader.createReader === 'function' ? fieldOrReader.createReader() : fieldOrReader;
	if (typeof reader.readScalar !== 'function') {
		throw new TypeError(`${label} must expose createReader() or readScalar().`);
	}
	const descriptor = reader.descriptor ?? fieldOrReader.descriptor;
	if (descriptor?.directionDomain?.contentHash !== CUBED_SPHERE_W27_DIRECTION_DOMAIN.contentHash) {
		throw new TypeError(`${label} must use the selected W27 direction domain.`);
	}
	const positionCount = descriptor.positionDomain?.count;
	const wavelengthCount = descriptor.basis?.channelCount;
	if (
		!Number.isInteger(positionCount) ||
		positionCount < 1 ||
		!Number.isInteger(wavelengthCount) ||
		wavelengthCount < 1
	) {
		throw new TypeError(`${label} descriptor must expose position and wavelength counts.`);
	}

	return {reader, descriptor, positionCount, wavelengthCount};
}

/** @returns {number[]} Validated unique indices, defaulting to the full axis. */
function acceptIndices(values, count, label) {
	if (values === undefined) {
		return Array.from({length: count}, (_unused, index) => index);
	}
	if (!Array.isArray(values) || values.length === 0) {
		throw new TypeError(`${label} must be a nonempty array when supplied.`);
	}
	const seen = new Set();
	for (const value of values) {
		if (!Number.isInteger(value) || value < 0 || value >= count) {
			throw new RangeError(`${label} entries must be integers in [0, ${count}).`);
		}
		if (seen.has(value)) {
			throw new RangeError(`${label} cannot contain duplicate entries.`);
		}
		seen.add(value);
	}
	return [...values];
}

/** @returns {number} One finite stored scalar. */
function readFiniteScalar(reader, coordinates, label) {
	const value = reader.readScalar(coordinates);
	if (!Number.isFinite(value)) {
		throw new TypeError(
			`${label} returned a nonfinite scalar at direction ${coordinates.directionIndex}, position ${coordinates.positionIndex}, wavelength ${coordinates.wavelengthIndex}.`,
		);
	}
	return value;
}

/** Keep the largest records without retaining every scalar comparison. */
function retainLargest(records, record, maximumCount, metricName) {
	if (maximumCount === 0) return;
	if (records.length < maximumCount) {
		records.push(record);
	} else {
		let smallestIndex = 0;
		for (let index = 1; index < records.length; index += 1) {
			if (records[index][metricName] < records[smallestIndex][metricName]) {
				smallestIndex = index;
			}
		}
		if (record[metricName] > records[smallestIndex][metricName]) {
			records[smallestIndex] = record;
		}
	}
}

/** @returns {number} A validated bounded record count. */
function acceptLargestDifferenceCount(value) {
	if (!Number.isInteger(value) || value < 0 || value > 1024) {
		throw new RangeError('W27 largestDifferenceCount must be an integer in [0, 1024].');
	}
	return value;
}

/**
 * Compare every stored alias for every selected physical edge/corner,
 * position, and wavelength. No tolerance changes the exact mismatch count.
 */
function compareDuplicateFieldValues({reader, topology, positionIndices, wavelengthIndices, largestDifferenceCount}) {
	const coordinateSummaries = [];
	const groupSummaries = new Map(
		topology.groups.map((group) => [
			group.id,
			{
				groupId: group.id,
				kind: group.kind,
				physicalDirectionKey: group.physicalDirectionKey,
				addresses: group.addresses,
				pairComparisonCount: 0,
				exactMismatchCount: 0,
				maximumAbsoluteDifference: 0,
				maximumRelativeDifference: 0,
			},
		]),
	);
	const largestDifferences = [];
	let pairComparisonCount = 0;
	let exactMismatchCount = 0;
	let maximumAbsoluteDifference = 0;
	let maximumRelativeDifference = 0;

	for (const positionIndex of positionIndices) {
		for (const wavelengthIndex of wavelengthIndices) {
			const coordinate = {
				positionIndex,
				wavelengthIndex,
				pairComparisonCount: 0,
				exactMismatchCount: 0,
				maximumAbsoluteDifference: 0,
				maximumRelativeDifference: 0,
			};
			for (const group of topology.groups) {
				const values = group.addresses.map((address) =>
					readFiniteScalar(
						reader,
						{
							directionIndex: address.index,
							positionIndex,
							wavelengthIndex,
						},
						'W27 duplicate-value audit',
					),
				);
				const groupSummary = groupSummaries.get(group.id);
				for (let firstIndex = 0; firstIndex < values.length - 1; firstIndex += 1) {
					for (let secondIndex = firstIndex + 1; secondIndex < values.length; secondIndex += 1) {
						const firstValue = values[firstIndex];
						const secondValue = values[secondIndex];
						const signedDifference = secondValue - firstValue;
						const absoluteDifference = Math.abs(signedDifference);
						const relative = relativeDifference(firstValue, secondValue);
						pairComparisonCount += 1;
						coordinate.pairComparisonCount += 1;
						groupSummary.pairComparisonCount += 1;
						if (absoluteDifference !== 0) {
							exactMismatchCount += 1;
							coordinate.exactMismatchCount += 1;
							groupSummary.exactMismatchCount += 1;
						}
						maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, absoluteDifference);
						maximumRelativeDifference = Math.max(maximumRelativeDifference, relative);
						coordinate.maximumAbsoluteDifference = Math.max(
							coordinate.maximumAbsoluteDifference,
							absoluteDifference,
						);
						coordinate.maximumRelativeDifference = Math.max(coordinate.maximumRelativeDifference, relative);
						groupSummary.maximumAbsoluteDifference = Math.max(
							groupSummary.maximumAbsoluteDifference,
							absoluteDifference,
						);
						groupSummary.maximumRelativeDifference = Math.max(
							groupSummary.maximumRelativeDifference,
							relative,
						);
						retainLargest(
							largestDifferences,
							{
								groupId: group.id,
								kind: group.kind,
								positionIndex,
								wavelengthIndex,
								firstAlias: group.addresses[firstIndex],
								secondAlias: group.addresses[secondIndex],
								firstValue,
								secondValue,
								signedDifference,
								absoluteDifference,
								relativeDifference: relative,
							},
							largestDifferenceCount,
							'absoluteDifference',
						);
					}
				}
			}
			coordinateSummaries.push(coordinate);
		}
	}

	largestDifferences.sort((left, right) => right.absoluteDifference - left.absoluteDifference);

	return {
		pairComparisonCount,
		exactMismatchCount,
		allAliasesExactlyEqual: exactMismatchCount === 0,
		maximumAbsoluteDifference,
		maximumRelativeDifference,
		coordinateSummaries,
		groupSummaries: [...groupSummaries.values()],
		largestDifferences,
	};
}

/** @returns {number} Bilinearly sample one scalar from a described stencil. */
function sampleDescribedStencil(reader, stencil, positionIndex, wavelengthIndex) {
	let value = 0;
	for (const tap of stencil.taps) {
		value +=
			tap.weight *
			readFiniteScalar(
				reader,
				{
					directionIndex: tap.index,
					positionIndex,
					wavelengthIndex,
				},
				'W27 interpolation audit',
			);
	}
	return value;
}

/**
 * Evaluate equal-epsilon one-sided reconstruction values and slopes from the
 * same field. The two direct boundary aliases provide independent C0 values;
 * their adjacent bilinear reconstructions provide the C1 diagnostic.
 */
function compareBoundaryInterpolation({
	reader,
	stencilSweep,
	positionIndices,
	wavelengthIndices,
	largestDifferenceCount,
}) {
	const byEpsilon = new Map(
		stencilSweep.epsilonRadians.map((epsilon) => [
			epsilon,
			{
				epsilonRadians: epsilon,
				sampleCount: 0,
				faceSelectionMismatchCount: 0,
				maximumAliasJump: 0,
				maximumSampledSideJump: 0,
				maximumRelativeSampledSideJump: 0,
				maximumAbsoluteSlopeJump: 0,
			},
		]),
	);
	const coordinateSummaries = [];
	const groupSummaries = new Map(
		stencilSweep.records.map((record) => [
			record.groupId,
			{
				groupId: record.groupId,
				physicalDirectionKey: record.physicalDirectionKey,
				firstAlias: record.firstAlias,
				secondAlias: record.secondAlias,
				sampleCount: 0,
				maximumAliasJump: 0,
				maximumSampledSideJump: 0,
				maximumRelativeSampledSideJump: 0,
				maximumAbsoluteSlopeJump: 0,
			},
		]),
	);
	const largestSampledSideJumps = [];
	const largestSlopeJumps = [];
	let sampleCount = 0;
	let maximumAliasJump = 0;
	let maximumSampledSideJump = 0;
	let maximumRelativeSampledSideJump = 0;
	let maximumAbsoluteSlopeJump = 0;

	for (const positionIndex of positionIndices) {
		for (const wavelengthIndex of wavelengthIndices) {
			const coordinate = {
				positionIndex,
				wavelengthIndex,
				maximumAliasJump: 0,
				byEpsilon: stencilSweep.epsilonRadians.map((epsilon) => ({
					epsilonRadians: epsilon,
					sampleCount: 0,
					maximumSampledSideJump: 0,
					maximumRelativeSampledSideJump: 0,
					maximumAbsoluteSlopeJump: 0,
				})),
			};
			const coordinateByEpsilon = new Map(coordinate.byEpsilon.map((entry) => [entry.epsilonRadians, entry]));

			for (const boundary of stencilSweep.records) {
				const firstBoundaryValue = readFiniteScalar(
					reader,
					{
						directionIndex: boundary.firstAlias.index,
						positionIndex,
						wavelengthIndex,
					},
					'W27 first boundary alias',
				);
				const secondBoundaryValue = readFiniteScalar(
					reader,
					{
						directionIndex: boundary.secondAlias.index,
						positionIndex,
						wavelengthIndex,
					},
					'W27 second boundary alias',
				);
				const aliasJump = secondBoundaryValue - firstBoundaryValue;
				const absoluteAliasJump = Math.abs(aliasJump);
				coordinate.maximumAliasJump = Math.max(coordinate.maximumAliasJump, absoluteAliasJump);
				maximumAliasJump = Math.max(maximumAliasJump, absoluteAliasJump);

				for (const sample of boundary.samples) {
					const firstSideValue = sampleDescribedStencil(
						reader,
						sample.firstSide,
						positionIndex,
						wavelengthIndex,
					);
					const secondSideValue = sampleDescribedStencil(
						reader,
						sample.secondSide,
						positionIndex,
						wavelengthIndex,
					);
					const sampledSideJump = secondSideValue - firstSideValue;
					const absoluteSampledSideJump = Math.abs(sampledSideJump);
					const relativeSampledSideJump = relativeDifference(firstSideValue, secondSideValue);
					const firstOneSidedSlope = (firstBoundaryValue - firstSideValue) / sample.epsilonRadians;
					const secondOneSidedSlope = (secondSideValue - secondBoundaryValue) / sample.epsilonRadians;
					const slopeJump = secondOneSidedSlope - firstOneSidedSlope;
					const absoluteSlopeJump = Math.abs(slopeJump);
					const epsilonSummary = byEpsilon.get(sample.epsilonRadians);
					const coordinateEpsilon = coordinateByEpsilon.get(sample.epsilonRadians);
					const groupSummary = groupSummaries.get(boundary.groupId);
					sampleCount += 1;
					epsilonSummary.sampleCount += 1;
					coordinateEpsilon.sampleCount += 1;
					groupSummary.sampleCount += 1;
					if (!sample.faceSelectionMatches) {
						epsilonSummary.faceSelectionMismatchCount += 1;
					}
					for (const summary of [epsilonSummary, coordinateEpsilon, groupSummary]) {
						summary.maximumSampledSideJump = Math.max(
							summary.maximumSampledSideJump,
							absoluteSampledSideJump,
						);
						summary.maximumRelativeSampledSideJump = Math.max(
							summary.maximumRelativeSampledSideJump,
							relativeSampledSideJump,
						);
						summary.maximumAbsoluteSlopeJump = Math.max(
							summary.maximumAbsoluteSlopeJump,
							absoluteSlopeJump,
						);
					}
					epsilonSummary.maximumAliasJump = Math.max(epsilonSummary.maximumAliasJump, absoluteAliasJump);
					groupSummary.maximumAliasJump = Math.max(groupSummary.maximumAliasJump, absoluteAliasJump);
					maximumSampledSideJump = Math.max(maximumSampledSideJump, absoluteSampledSideJump);
					maximumRelativeSampledSideJump = Math.max(maximumRelativeSampledSideJump, relativeSampledSideJump);
					maximumAbsoluteSlopeJump = Math.max(maximumAbsoluteSlopeJump, absoluteSlopeJump);
					const detail = {
						groupId: boundary.groupId,
						physicalDirectionKey: boundary.physicalDirectionKey,
						positionIndex,
						wavelengthIndex,
						epsilonRadians: sample.epsilonRadians,
						faceSelectionMatches: sample.faceSelectionMatches,
						firstAlias: boundary.firstAlias,
						secondAlias: boundary.secondAlias,
						firstBoundaryValue,
						secondBoundaryValue,
						aliasJump,
						firstSideValue,
						secondSideValue,
						sampledSideJump,
						absoluteSampledSideJump,
						relativeSampledSideJump,
						firstOneSidedSlope,
						secondOneSidedSlope,
						slopeJump,
						absoluteSlopeJump,
					};
					retainLargest(largestSampledSideJumps, detail, largestDifferenceCount, 'absoluteSampledSideJump');
					retainLargest(largestSlopeJumps, detail, largestDifferenceCount, 'absoluteSlopeJump');
				}
			}
			coordinateSummaries.push(coordinate);
		}
	}

	largestSampledSideJumps.sort((left, right) => right.absoluteSampledSideJump - left.absoluteSampledSideJump);
	largestSlopeJumps.sort((left, right) => right.absoluteSlopeJump - left.absoluteSlopeJump);

	return {
		sampleCount,
		maximumAliasJump,
		maximumSampledSideJump,
		maximumRelativeSampledSideJump,
		maximumAbsoluteSlopeJump,
		byEpsilon: [...byEpsilon.values()],
		coordinateSummaries,
		groupSummaries: [...groupSummaries.values()],
		largestSampledSideJumps,
		largestSlopeJumps,
	};
}

/**
 * Audit one sealed CPU field or read-only field-reader capability.
 *
 * @param {object} request - Supplies the field and optional bounded axes.
 * @returns {object} Exact alias and bilinear face-boundary comparisons.
 */
export function auditCubedSphereW27Field(request) {
	const accepted = acceptFieldReader(request.field, request.label ?? 'W27 field');
	const topology = request.topology ?? enumerateCubedSphereW27DuplicateNodes();
	const stencilSweep =
		request.stencilSweep ??
		createCubedSphereW27BoundaryStencilSweep({
			topology,
			epsilonRadians: request.epsilonRadians,
		});
	const positionIndices = acceptIndices(request.positionIndices, accepted.positionCount, 'W27 audit positionIndices');
	const wavelengthIndices = acceptIndices(
		request.wavelengthIndices,
		accepted.wavelengthCount,
		'W27 audit wavelengthIndices',
	);
	const largestDifferenceCount = acceptLargestDifferenceCount(
		request.largestDifferenceCount ?? DEFAULT_LARGEST_DIFFERENCE_COUNT,
	);

	return {
		schemaId: 'cubed-sphere-w27-field-seam-audit-v1',
		contract: CUBED_SPHERE_W27_SEAM_AUDIT_CONTRACT,
		field: {
			label: request.label ?? accepted.descriptor.id,
			id: accepted.descriptor.id,
			contentHash: accepted.descriptor.contentHash,
			quantity: accepted.descriptor.quantity,
			units: accepted.descriptor.units,
			precision: accepted.descriptor.precision,
			order: accepted.descriptor.order,
			provenanceIdentity: accepted.descriptor.provenanceIdentity,
		},
		selection: {
			positionIndices,
			wavelengthIndices,
			positionCount: positionIndices.length,
			wavelengthCount: wavelengthIndices.length,
			epsilonRadians: stencilSweep.epsilonRadians,
		},
		topology,
		stencilSweep,
		duplicateValues: compareDuplicateFieldValues({
			reader: accepted.reader,
			topology,
			positionIndices,
			wavelengthIndices,
			largestDifferenceCount,
		}),
		boundaryInterpolation: compareBoundaryInterpolation({
			reader: accepted.reader,
			stencilSweep,
			positionIndices,
			wavelengthIndices,
			largestDifferenceCount,
		}),
	};
}

/** @returns {object[]} W27 outgoing fields retained by one CPU build result. */
function fieldsFromCpuBuildResult(buildResult) {
	if (buildResult === null || typeof buildResult !== 'object') {
		throw new TypeError('W27 CPU build audit requires a build-result object.');
	}
	const pureFields = buildResult.pureScatteringDensityByOrder;
	if (!Array.isArray(pureFields) || pureFields.length === 0) {
		throw new TypeError('W27 CPU build result must expose pureScatteringDensityByOrder.');
	}
	if (buildResult.cumulativeScatteringDensity === undefined) {
		throw new TypeError('W27 CPU build result must expose cumulativeScatteringDensity.');
	}

	return [
		...pureFields.map((field, index) => ({
			label: `pure-scattering-density-j${field.descriptor?.order?.value ?? index + 1}`,
			field,
		})),
		{
			label: `cumulative-scattering-density-through-${buildResult.cumulativeScatteringDensity.descriptor?.order?.value ?? buildResult.maximumScatteringOrder ?? 'unknown'}`,
			field: buildResult.cumulativeScatteringDensity,
		},
	];
}

/**
 * Audit every pure outgoing scattering order plus the cumulative field in one
 * completed distant/spherical or Flat/local CPU build result.
 */
export function auditCubedSphereW27CpuBuildResult(request) {
	const topology = enumerateCubedSphereW27DuplicateNodes();
	const stencilSweep = createCubedSphereW27BoundaryStencilSweep({
		topology,
		epsilonRadians: request.epsilonRadians,
	});
	const fields = fieldsFromCpuBuildResult(request.buildResult).map((entry) => {
		const audit = auditCubedSphereW27Field({
			...request,
			...entry,
			topology,
			stencilSweep,
		});
		return {
			schemaId: audit.schemaId,
			contract: audit.contract,
			field: audit.field,
			selection: audit.selection,
			duplicateValues: audit.duplicateValues,
			boundaryInterpolation: audit.boundaryInterpolation,
		};
	});

	return {
		schemaId: 'cubed-sphere-w27-cpu-build-seam-audit-v1',
		maximumScatteringOrder: request.buildResult.maximumScatteringOrder,
		fieldCount: fields.length,
		topology,
		stencilSweep,
		fields,
	};
}

/** @returns {number[]} All raw direction indices needed by one complete audit. */
function requiredDirectionIndices(topology, stencilSweep) {
	const indices = new Set();
	for (const group of topology.groups) {
		for (const address of group.addresses) indices.add(address.index);
	}
	for (const boundary of stencilSweep.records) {
		for (const sample of boundary.samples) {
			for (const tap of sample.firstSide.taps) indices.add(tap.index);
			for (const tap of sample.secondSide.taps) indices.add(tap.index);
		}
	}
	return [...indices].sort((left, right) => left - right);
}

/** @returns {string} One dense in-memory readback key. */
function scalarCoordinateKey(coordinates) {
	return `${coordinates.wavelengthIndex}:${coordinates.positionIndex}:${coordinates.directionIndex}`;
}

/**
 * Plan a bounded complete selected-scalar readback before touching WebGL. This
 * lets a runner record or reject the exact cost independently of execution.
 */
export function planCubedSphereW27GpuFieldReadback(request) {
	const field = request.field;
	if (field === null || typeof field !== 'object') {
		throw new TypeError('W27 GPU readback plan requires artifact.result as field.');
	}
	if (field.descriptor?.directionDomain?.contentHash !== CUBED_SPHERE_W27_DIRECTION_DOMAIN.contentHash) {
		throw new TypeError('W27 GPU readback field must use the selected W27 domain.');
	}
	if (field.storage?.width !== DIRECTION_COUNT) {
		throw new TypeError('W27 GPU readback field width must equal the W27 direction count.');
	}
	if (request.positionIndices === undefined || request.wavelengthIndices === undefined) {
		throw new TypeError(
			'W27 GPU readback requires explicit positionIndices and wavelengthIndices; use createCubedSphereW27RepresentativeAxisSelection() for the bounded survey.',
		);
	}
	const topology = request.topology ?? enumerateCubedSphereW27DuplicateNodes();
	const stencilSweep =
		request.stencilSweep ??
		createCubedSphereW27BoundaryStencilSweep({
			topology,
			epsilonRadians: request.epsilonRadians,
		});
	const positionIndices = acceptIndices(
		request.positionIndices,
		field.storage.height,
		'W27 GPU readback positionIndices',
	);
	const wavelengthIndices = acceptIndices(
		request.wavelengthIndices,
		field.storage.layers,
		'W27 GPU readback wavelengthIndices',
	);
	const directionIndices = requiredDirectionIndices(topology, stencilSweep);
	const scalarCount = directionIndices.length * positionIndices.length * wavelengthIndices.length;
	const maximumScalarCount = request.maximumScalarCount ?? DEFAULT_MAXIMUM_READBACK_SCALAR_COUNT;
	if (!Number.isSafeInteger(maximumScalarCount) || maximumScalarCount < 1) {
		throw new RangeError('W27 GPU maximumScalarCount must be a positive safe integer.');
	}
	if (scalarCount > maximumScalarCount) {
		throw new RangeError(
			`W27 GPU seam audit requires ${scalarCount} selected scalars, exceeding the declared ${maximumScalarCount} bound.`,
		);
	}
	const coordinates = [];
	for (const wavelengthIndex of wavelengthIndices) {
		for (const positionIndex of positionIndices) {
			for (const directionIndex of directionIndices) {
				coordinates.push({directionIndex, positionIndex, wavelengthIndex});
			}
		}
	}

	return {
		schemaId: 'cubed-sphere-w27-gpu-readback-plan-v1',
		field,
		topology,
		stencilSweep,
		directionIndices,
		positionIndices,
		wavelengthIndices,
		coordinates,
		directionCount: directionIndices.length,
		positionCount: positionIndices.length,
		wavelengthCount: wavelengthIndices.length,
		scalarCount,
		maximumScalarCount,
	};
}

/**
 * Read only the raw R32F texels required by the complete alias/interpolation
 * audit, then run the same CPU comparison logic over that resident field.
 * Pass a cache executor's `artifact.result` as `field` while it remains live.
 */
export async function auditCubedSphereW27ResidentGpuField(request) {
	if (typeof request.backend?.readSelectedScalars !== 'function') {
		throw new TypeError('W27 resident GPU audit requires a backend with readSelectedScalars().');
	}
	const plan = planCubedSphereW27GpuFieldReadback(request);
	const batchSize = request.readbackBatchSize ?? DEFAULT_READBACK_BATCH_SIZE;
	if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > DEFAULT_READBACK_BATCH_SIZE) {
		throw new RangeError('W27 GPU readbackBatchSize must be an integer in [1, 4096].');
	}
	const values = new Map();
	let batchCount = 0;
	for (let offset = 0; offset < plan.coordinates.length; offset += batchSize) {
		const coordinates = plan.coordinates.slice(offset, offset + batchSize);
		const result = await request.backend.readSelectedScalars({
			field: plan.field,
			coordinates,
		});
		if (!Array.isArray(result.samples) || result.samples.length !== coordinates.length) {
			throw new Error('W27 GPU readback returned an incomplete scalar batch.');
		}
		for (let index = 0; index < result.samples.length; index += 1) {
			const sample = result.samples[index];
			const expected = coordinates[index];
			if (
				sample.coordinates.directionIndex !== expected.directionIndex ||
				sample.coordinates.positionIndex !== expected.positionIndex ||
				sample.coordinates.wavelengthIndex !== expected.wavelengthIndex ||
				!Number.isFinite(sample.value)
			) {
				throw new Error('W27 GPU readback returned an invalid or reordered sample.');
			}
			values.set(scalarCoordinateKey(expected), sample.value);
		}
		batchCount += 1;
	}
	if (values.size !== plan.scalarCount) {
		throw new Error('W27 GPU readback did not retain every planned scalar.');
	}

	const reader = {
		descriptor: plan.field.descriptor,
		readScalar(coordinates) {
			const key = scalarCoordinateKey(coordinates);
			if (!values.has(key)) {
				throw new RangeError(`W27 GPU audit did not read scalar ${key}.`);
			}
			return values.get(key);
		},
	};
	const audit = auditCubedSphereW27Field({
		...request,
		field: reader,
		topology: plan.topology,
		stencilSweep: plan.stencilSweep,
		positionIndices: plan.positionIndices,
		wavelengthIndices: plan.wavelengthIndices,
	});

	return {
		...audit,
		schemaId: 'cubed-sphere-w27-resident-r32f-seam-audit-v1',
		readback: {
			mode: 'selected-raw-r32f-scalars-only',
			backendId: request.backend.id,
			fieldId: plan.field.descriptor.id,
			fieldContentHash: plan.field.descriptor.contentHash,
			fieldStorage: {...plan.field.storage},
			directionCount: plan.directionCount,
			positionCount: plan.positionCount,
			wavelengthCount: plan.wavelengthCount,
			scalarCount: plan.scalarCount,
			batchSize,
			batchCount,
		},
	};
}
