/**
 * Dependency-free deterministic rough-study codecs for nonnegative Native15
 * spectra. This is evidence tooling, not a production asset format.
 */

export const NATIVE15_CHANNEL_COUNT = 15;
export const BLUE_CHANNEL_INDICES = Object.freeze([1, 2, 3]);
export const RED_CHANNEL_INDICES = Object.freeze([8, 9, 10]);
export const RATIO_470_CHANNEL_INDEX = 3;
export const RATIO_626_CHANNEL_INDEX = 8;
export const MAX_LLOYD_ITERATIONS = 8;
export const DEFAULT_MATERIAL_FLOOR = Math.fround(1e-12);

const F32 = Math.fround;
const FNV64_OFFSET = 0xcbf29ce484222325n;
const FNV64_PRIME = 0x100000001b3n;
const FNV64_MASK = 0xffffffffffffffffn;

function assertPositiveInteger(value, label) {
	if (!Number.isSafeInteger(value) || value < 1) {
		throw new RangeError(`${label} must be a positive safe integer.`);
	}
	return value;
}

function assertNonnegativeInteger(value, label) {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new RangeError(`${label} must be a nonnegative safe integer.`);
	}
	return value;
}

function validateIterations(value) {
	assertPositiveInteger(value, 'maxIterations');
	if (value > MAX_LLOYD_ITERATIONS) {
		throw new RangeError(
			`maxIterations must be at most ${MAX_LLOYD_ITERATIONS}.`,
		);
	}
	return value;
}

function validateMaterialFloor(value) {
	const converted = Number(value);
	if (!Number.isFinite(converted) || converted < 0) {
		throw new RangeError('materialFloor must be finite and nonnegative.');
	}
	return converted;
}

function isArrayLikeSpectrum(value) {
	return Array.isArray(value)
		|| (ArrayBuffer.isView(value) && !(value instanceof DataView));
}

function getRecordSpectrum(record, label) {
	if (isArrayLikeSpectrum(record)) {
		return record;
	}
	if (!record || typeof record !== 'object') {
		throw new TypeError(`${label} must contain a Native15 spectrum.`);
	}
	for (const key of ['values', 'spectrum', 'native15', 'truth', 'channels']) {
		if (isArrayLikeSpectrum(record[key])) {
			return record[key];
		}
	}
	throw new TypeError(
		`${label} must provide values, spectrum, native15, truth, or channels.`,
	);
}

/** Convert one spectrum to the Float32 truth domain and validate it. */
export function toFloat32Native15(values, label = 'Native15 spectrum') {
	if (!isArrayLikeSpectrum(values) || values.length !== NATIVE15_CHANNEL_COUNT) {
		throw new RangeError(
			`${label} must contain exactly ${NATIVE15_CHANNEL_COUNT} channels.`,
		);
	}
	const output = new Float32Array(NATIVE15_CHANNEL_COUNT);
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		const source = Number(values[channel]);
		if (!Number.isFinite(source) || source < 0) {
			throw new RangeError(
				`${label}[${channel}] must be finite and nonnegative.`,
			);
		}
		const converted = F32(source);
		if (!Number.isFinite(converted) || converted < 0) {
			throw new RangeError(
				`${label}[${channel}] is outside the finite Float32 domain.`,
			);
		}
		output[channel] = converted === 0 ? 0 : converted;
	}
	return output;
}

function isZeroVector(values, offset = 0) {
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		if (values[offset + channel] !== 0) {
			return false;
		}
	}
	return true;
}

function prepareRecords(records, label) {
	if (!Array.isArray(records) || records.length === 0) {
		throw new TypeError(`${label} must be a nonempty array.`);
	}
	const ids = new Array(records.length);
	const values = new Float32Array(records.length * NATIVE15_CHANNEL_COUNT);
	const exactZero = new Uint8Array(records.length);
	const seenIds = new Set();
	for (let index = 0; index < records.length; index += 1) {
		const record = records[index];
		const id = String(
			record && typeof record === 'object' && !isArrayLikeSpectrum(record)
				&& record.id !== undefined
				? record.id
				: index,
		);
		if (seenIds.has(id)) {
			throw new Error(`${label} contains duplicate record id ${id}.`);
		}
		seenIds.add(id);
		ids[index] = id;
		const spectrum = toFloat32Native15(
			getRecordSpectrum(record, `${label}[${index}]`),
			`${label}[${index}]`,
		);
		values.set(spectrum, index * NATIVE15_CHANNEL_COUNT);
		exactZero[index] = isZeroVector(spectrum) ? 1 : 0;
	}
	return {ids, values, exactZero, count: records.length};
}

/** Convert record spectra to a compact Float32 truth table. */
export function convertNative15TruthRecords(records, label = 'records') {
	return prepareRecords(records, label);
}

function normalizeToFloat32(values, offset = 0) {
	let normSquared = 0;
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		const value = values[offset + channel];
		normSquared += value * value;
	}
	if (!(normSquared > 0) || !Number.isFinite(normSquared)) {
		throw new RangeError('Cannot normalize a zero or nonfinite Native15 vector.');
	}
	let norm = Math.sqrt(normSquared);
	const output = new Float32Array(NATIVE15_CHANNEL_COUNT);
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		output[channel] = F32(values[offset + channel] / norm);
	}
	// A second pass makes the stored Float32 vector the normalization target.
	normSquared = 0;
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		normSquared += output[channel] * output[channel];
	}
	norm = Math.sqrt(normSquared);
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		output[channel] = F32(output[channel] / norm);
	}
	return output;
}

function squaredDistance(a, aOffset, b, bOffset) {
	let total = 0;
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		const difference = a[aOffset + channel] - b[bOffset + channel];
		total += difference * difference;
	}
	return total;
}

function equalVectorBits(a, aOffset, b, bOffset) {
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		if (!Object.is(a[aOffset + channel], b[bOffset + channel])) {
			return false;
		}
	}
	return true;
}

function copyVector(source, sourceOffset, target, targetOffset) {
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		target[targetOffset + channel] = source[sourceOffset + channel];
	}
}

function nearestCenter(values, offset, centers, centerCount, startId = 0) {
	let bestId = startId;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let id = startId; id < centerCount; id += 1) {
		const distance = squaredDistance(
			values,
			offset,
			centers,
			id * NATIVE15_CHANNEL_COUNT,
		);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestId = id;
		}
	}
	return {id: bestId, distance: bestDistance};
}

function farthestFirstSeeds(values, vectorCount, seedCount, initialCenters = null) {
	const seeds = [];
	const centerValues = [];
	if (initialCenters) {
		for (let index = 0; index < initialCenters.length; index += 1) {
			centerValues.push(initialCenters[index]);
		}
	}
	if (centerValues.length === 0 && seedCount > 0) {
		seeds.push(0);
		for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
			centerValues.push(values[channel]);
		}
	}
	while (seeds.length < seedCount) {
		let farthestIndex = 0;
		let farthestDistance = -1;
		const centerCount = centerValues.length / NATIVE15_CHANNEL_COUNT;
		for (let index = 0; index < vectorCount; index += 1) {
			const nearest = nearestCenter(
				values,
				index * NATIVE15_CHANNEL_COUNT,
				centerValues,
				centerCount,
			);
			if (nearest.distance > farthestDistance) {
				farthestDistance = nearest.distance;
				farthestIndex = index;
			}
		}
		seeds.push(farthestIndex);
		for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
			centerValues.push(
				values[farthestIndex * NATIVE15_CHANNEL_COUNT + channel],
			);
		}
	}
	return seeds;
}

function createOccupancy(assignments, entryCount) {
	assertPositiveInteger(entryCount, 'entryCount');
	const counts = new Array(entryCount).fill(0);
	for (let index = 0; index < assignments.length; index += 1) {
		const id = assignments[index];
		if (!Number.isSafeInteger(id) || id < 0 || id >= entryCount) {
			throw new RangeError(`Assignment ${index} has invalid dictionary id ${id}.`);
		}
		counts[id] += 1;
	}
	let occupiedEntryCount = 0;
	let entropyBits = 0;
	for (const count of counts) {
		if (count > 0) {
			occupiedEntryCount += 1;
			const probability = count / assignments.length;
			entropyBits -= probability * Math.log2(probability);
		}
	}
	return {
		entryCount,
		occupiedEntryCount,
		unusedEntryCount: entryCount - occupiedEntryCount,
		zeroIdCount: counts[0],
		counts,
		entropyBits,
	};
}

export function calculateOccupancy(assignments, entryCount) {
	return createOccupancy(assignments, entryCount);
}

function hashUpdateByte(state, byte) {
	return ((state ^ BigInt(byte & 0xff)) * FNV64_PRIME) & FNV64_MASK;
}

function hashLabel(state, label) {
	let next = state;
	for (let index = 0; index < label.length; index += 1) {
		const code = label.charCodeAt(index);
		next = hashUpdateByte(next, code);
		next = hashUpdateByte(next, code >>> 8);
	}
	return hashUpdateByte(next, 0xff);
}

function formatHash(state) {
	return `fnv1a64:${state.toString(16).padStart(16, '0')}`;
}

/** Stable non-cryptographic identity for Float32 values in little-endian form. */
export function hashFloat32Values(values) {
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);
	let state = FNV64_OFFSET;
	for (let index = 0; index < values.length; index += 1) {
		view.setFloat32(0, F32(values[index]), true);
		for (let byte = 0; byte < 4; byte += 1) {
			state = hashUpdateByte(state, view.getUint8(byte));
		}
	}
	return formatHash(state);
}

/** Stable non-cryptographic identity for nonnegative integer values. */
export function hashIntegerValues(values) {
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);
	let state = FNV64_OFFSET;
	for (let index = 0; index < values.length; index += 1) {
		view.setUint32(0, values[index] >>> 0, true);
		for (let byte = 0; byte < 4; byte += 1) {
			state = hashUpdateByte(state, view.getUint8(byte));
		}
	}
	return formatHash(state);
}

function combineHashes(labels) {
	let state = FNV64_OFFSET;
	for (const label of labels) {
		state = hashLabel(state, String(label));
	}
	return formatHash(state);
}

function fitSphericalBaseDictionaryPrepared(
	records,
	dictionarySize,
	maxIterations,
) {
	assertPositiveInteger(dictionarySize, 'dictionarySize');
	validateIterations(maxIterations);
	const nonzeroRecordIndices = [];
	for (let index = 0; index < records.count; index += 1) {
		if (!records.exactZero[index]) {
			nonzeroRecordIndices.push(index);
		}
	}
	const learnedCount = dictionarySize - 1;
	if (learnedCount > nonzeroRecordIndices.length) {
		throw new RangeError(
			`dictionarySize ${dictionarySize} requires ${learnedCount} nonzero `
			+ `training records, but only ${nonzeroRecordIndices.length} exist.`,
		);
	}
	if (learnedCount === 0 && nonzeroRecordIndices.length > 0) {
		throw new RangeError('A nonzero corpus requires at least one nonzero base ID.');
	}
	const shapeValues = new Float32Array(
		nonzeroRecordIndices.length * NATIVE15_CHANNEL_COUNT,
	);
	for (let shapeIndex = 0; shapeIndex < nonzeroRecordIndices.length; shapeIndex += 1) {
		const recordIndex = nonzeroRecordIndices[shapeIndex];
		shapeValues.set(
			normalizeToFloat32(
				records.values,
				recordIndex * NATIVE15_CHANNEL_COUNT,
			),
			shapeIndex * NATIVE15_CHANNEL_COUNT,
		);
	}
	const seedShapeIndices = learnedCount > 0
		? farthestFirstSeeds(
			shapeValues,
			nonzeroRecordIndices.length,
			learnedCount,
		)
		: [];
	let centers = new Float32Array(learnedCount * NATIVE15_CHANNEL_COUNT);
	for (let id = 0; id < learnedCount; id += 1) {
		copyVector(
			shapeValues,
			seedShapeIndices[id] * NATIVE15_CHANNEL_COUNT,
			centers,
			id * NATIVE15_CHANNEL_COUNT,
		);
	}
	let priorAssignments = new Int32Array(nonzeroRecordIndices.length);
	priorAssignments.fill(-1);
	let iterationsPerformed = 0;
	let converged = learnedCount === 0;
	for (let iteration = 0; iteration < maxIterations && learnedCount > 0; iteration += 1) {
		const assignments = new Int32Array(nonzeroRecordIndices.length);
		const sums = Array.from(
			{length: learnedCount},
			() => new Float64Array(NATIVE15_CHANNEL_COUNT),
		);
		const counts = new Uint32Array(learnedCount);
		let assignmentsStable = true;
		for (let shapeIndex = 0; shapeIndex < nonzeroRecordIndices.length; shapeIndex += 1) {
			const nearest = nearestCenter(
				shapeValues,
				shapeIndex * NATIVE15_CHANNEL_COUNT,
				centers,
				learnedCount,
			);
			assignments[shapeIndex] = nearest.id;
			assignmentsStable &&= nearest.id === priorAssignments[shapeIndex];
			counts[nearest.id] += 1;
			for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
				sums[nearest.id][channel] +=
					shapeValues[shapeIndex * NATIVE15_CHANNEL_COUNT + channel];
			}
		}
		const nextCenters = new Float32Array(centers.length);
		let centersStable = true;
		for (let id = 0; id < learnedCount; id += 1) {
			if (counts[id] === 0) {
				copyVector(
					centers,
					id * NATIVE15_CHANNEL_COUNT,
					nextCenters,
					id * NATIVE15_CHANNEL_COUNT,
				);
			} else {
				const normalized = normalizeToFloat32(sums[id]);
				nextCenters.set(normalized, id * NATIVE15_CHANNEL_COUNT);
			}
			centersStable &&= equalVectorBits(
				centers,
				id * NATIVE15_CHANNEL_COUNT,
				nextCenters,
				id * NATIVE15_CHANNEL_COUNT,
			);
		}
		centers = nextCenters;
		priorAssignments = assignments;
		iterationsPerformed = iteration + 1;
		if (assignmentsStable && centersStable) {
			converged = true;
			break;
		}
	}
	const dictionary = new Float32Array(dictionarySize * NATIVE15_CHANNEL_COUNT);
	for (let id = 0; id < learnedCount; id += 1) {
		copyVector(
			centers,
			id * NATIVE15_CHANNEL_COUNT,
			dictionary,
			(id + 1) * NATIVE15_CHANNEL_COUNT,
		);
	}
	const trainingAssignments = new Uint32Array(records.count);
	for (let index = 0; index < records.count; index += 1) {
		if (records.exactZero[index]) {
			trainingAssignments[index] = 0;
			continue;
		}
		const shape = normalizeToFloat32(
			records.values,
			index * NATIVE15_CHANNEL_COUNT,
		);
		trainingAssignments[index] = nearestCenter(
			shape,
			0,
			dictionary,
			dictionarySize,
			1,
		).id;
	}
	return {
		schemaVersion: 'native15-spherical-base-dictionary-v1',
		channelCount: NATIVE15_CHANNEL_COUNT,
		dictionarySize,
		zeroId: 0,
		maxIterations,
		iterationsPerformed,
		converged,
		dictionary,
		dictionaryHash: hashFloat32Values(dictionary),
		seedRecordIds: seedShapeIndices.map(
			(shapeIndex) => records.ids[nonzeroRecordIndices[shapeIndex]],
		),
		trainingAssignments,
		trainingOccupancy: createOccupancy(trainingAssignments, dictionarySize),
	};
}

/** Fit zero-reserved, normalized-L2, nonnegative spherical base codewords. */
export function fitSphericalBaseDictionary(
	records,
	{dictionarySize, maxIterations = MAX_LLOYD_ITERATIONS},
) {
	return fitSphericalBaseDictionaryPrepared(
		prepareRecords(records, 'trainingRecords'),
		dictionarySize,
		maxIterations,
	);
}

function validateBaseDictionary(dictionary) {
	if (!(dictionary instanceof Float32Array)
		|| dictionary.length < NATIVE15_CHANNEL_COUNT
		|| dictionary.length % NATIVE15_CHANNEL_COUNT !== 0) {
		throw new TypeError('baseDictionary must be a Float32Array of Native15 vectors.');
	}
	if (!isZeroVector(dictionary, 0)) {
		throw new Error('Base dictionary ID 0 must be the exact-zero vector.');
	}
	for (let index = NATIVE15_CHANNEL_COUNT; index < dictionary.length; index += 1) {
		if (!Number.isFinite(dictionary[index]) || dictionary[index] < 0) {
			throw new RangeError('Base dictionary values must be finite and nonnegative.');
		}
	}
	return dictionary.length / NATIVE15_CHANNEL_COUNT;
}

function leastSquaresGainF32(truth, truthOffset, shape) {
	let numerator = F32(0);
	let denominator = F32(0);
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		const product = F32(truth[truthOffset + channel] * shape[channel]);
		numerator = F32(numerator + product);
		const square = F32(shape[channel] * shape[channel]);
		denominator = F32(denominator + square);
	}
	if (!(denominator > 0) || !Number.isFinite(numerator)
		|| !Number.isFinite(denominator)) {
		return null;
	}
	const gain = F32(numerator / denominator);
	return Number.isFinite(gain) && gain >= 0 ? gain : null;
}

function reconstructF32(gain, shape, target, targetOffset) {
	let squaredError = 0;
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		const value = F32(gain * shape[channel]);
		target[targetOffset + channel] = value;
	}
}

function candidateBaseGain(truth, truthOffset, dictionary, baseId) {
	const shape = dictionary.subarray(
		baseId * NATIVE15_CHANNEL_COUNT,
		(baseId + 1) * NATIVE15_CHANNEL_COUNT,
	);
	const gain = leastSquaresGainF32(truth, truthOffset, shape);
	if (gain === null) {
		return null;
	}
	const reconstructed = new Float32Array(NATIVE15_CHANNEL_COUNT);
	let squaredError = 0;
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		const value = F32(gain * shape[channel]);
		if (!Number.isFinite(value)) {
			return null;
		}
		reconstructed[channel] = value;
		const difference = truth[truthOffset + channel] - value;
		squaredError += difference * difference;
	}
	return {gain, reconstructed, squaredError};
}

function encodeBaseGainPrepared(records, baseDictionary) {
	const dictionarySize = validateBaseDictionary(baseDictionary);
	if (dictionarySize < 2 && records.exactZero.some((value) => value === 0)) {
		throw new RangeError('A nonzero corpus requires at least one nonzero base ID.');
	}
	const baseIds = new Uint32Array(records.count);
	const gains = new Float32Array(records.count);
	const reconstruction = new Float32Array(records.values.length);
	for (let index = 0; index < records.count; index += 1) {
		if (records.exactZero[index]) {
			continue;
		}
		const truthOffset = index * NATIVE15_CHANNEL_COUNT;
		let best = null;
		let bestId = 1;
		for (let baseId = 1; baseId < dictionarySize; baseId += 1) {
			const candidate = candidateBaseGain(
				records.values,
				truthOffset,
				baseDictionary,
				baseId,
			);
			if (candidate && (!best || candidate.squaredError < best.squaredError)) {
				best = candidate;
				bestId = baseId;
			}
		}
		if (!best) {
			throw new RangeError(`No finite base+gain encoding exists for ${records.ids[index]}.`);
		}
		baseIds[index] = bestId;
		gains[index] = best.gain;
		reconstruction.set(best.reconstructed, truthOffset);
	}
	return {
		schemaVersion: 'native15-base-gain-encoding-v1',
		formula: 'f32(gain * base[channel])',
		baseDictionarySize: dictionarySize,
		baseIds,
		gains,
		reconstruction,
		baseOccupancy: createOccupancy(baseIds, dictionarySize),
		hashes: {
			baseIds: hashIntegerValues(baseIds),
			gains: hashFloat32Values(gains),
			reconstruction: hashFloat32Values(reconstruction),
		},
	};
}

/** Encode records as a zero-reserved base ID plus Float32 LS gain. */
export function encodeBaseGain(records, baseDictionary) {
	return encodeBaseGainPrepared(
		prepareRecords(records, 'records'),
		baseDictionary,
	);
}

function validateAssignments(assignments, recordCount, dictionarySize, label) {
	if (!assignments || assignments.length !== recordCount) {
		throw new RangeError(`${label} must have one entry per record.`);
	}
	for (let index = 0; index < assignments.length; index += 1) {
		const id = Number(assignments[index]);
		if (!Number.isSafeInteger(id) || id < 0 || id >= dictionarySize) {
			throw new RangeError(`${label}[${index}] has invalid ID ${id}.`);
		}
	}
}

function shapeIsNonnegative(baseDictionary, baseId, deltaDictionary, deltaId) {
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		const value = F32(
			baseDictionary[baseId * NATIVE15_CHANNEL_COUNT + channel]
			+ deltaDictionary[deltaId * NATIVE15_CHANNEL_COUNT + channel],
		);
		if (!Number.isFinite(value) || value < 0) {
			return false;
		}
	}
	return true;
}

function makeCombinedShape(baseDictionary, baseId, deltaDictionary, deltaId) {
	const shape = new Float32Array(NATIVE15_CHANNEL_COUNT);
	for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
		shape[channel] = F32(
			baseDictionary[baseId * NATIVE15_CHANNEL_COUNT + channel]
			+ deltaDictionary[deltaId * NATIVE15_CHANNEL_COUNT + channel],
		);
	}
	return shape;
}

function prepareResidualTargets(records, baseDictionary, baseAssignments) {
	const dictionarySize = validateBaseDictionary(baseDictionary);
	validateAssignments(
		baseAssignments,
		records.count,
		dictionarySize,
		'baseAssignments',
	);
	const recordIndices = [];
	for (let index = 0; index < records.count; index += 1) {
		if (records.exactZero[index]) {
			if (baseAssignments[index] !== 0) {
				throw new Error('Exact-zero truth records must use base ID 0.');
			}
			continue;
		}
		if (baseAssignments[index] === 0) {
			throw new Error('Nonzero truth records may not use reserved base ID 0.');
		}
		recordIndices.push(index);
	}
	const values = new Float32Array(recordIndices.length * NATIVE15_CHANNEL_COUNT);
	for (let residualIndex = 0; residualIndex < recordIndices.length; residualIndex += 1) {
		const recordIndex = recordIndices[residualIndex];
		const normalized = normalizeToFloat32(
			records.values,
			recordIndex * NATIVE15_CHANNEL_COUNT,
		);
		const baseOffset = baseAssignments[recordIndex] * NATIVE15_CHANNEL_COUNT;
		for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
			values[residualIndex * NATIVE15_CHANNEL_COUNT + channel] = F32(
				normalized[channel] - baseDictionary[baseOffset + channel],
			);
		}
	}
	return {recordIndices, values};
}

function nearestValidResidualCenter(
	targets,
	targetOffset,
	centers,
	centerCount,
	baseDictionary,
	baseId,
) {
	let bestId = 0;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let id = 0; id < centerCount; id += 1) {
		if (!shapeIsNonnegative(baseDictionary, baseId, centers, id)) {
			continue;
		}
		const distance = squaredDistance(
			targets,
			targetOffset,
			centers,
			id * NATIVE15_CHANNEL_COUNT,
		);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestId = id;
		}
	}
	return {id: bestId, distance: bestDistance};
}

function fitSharedResidualDictionaryPrepared(
	records,
	baseDictionary,
	baseAssignments,
	dictionarySize,
	maxIterations,
) {
	assertPositiveInteger(dictionarySize, 'dictionarySize');
	validateIterations(maxIterations);
	const targets = prepareResidualTargets(
		records,
		baseDictionary,
		baseAssignments,
	);
	const learnedCount = dictionarySize - 1;
	if (learnedCount > targets.recordIndices.length) {
		throw new RangeError(
			`dictionarySize ${dictionarySize} requires ${learnedCount} nonzero `
			+ `training records, but only ${targets.recordIndices.length} exist.`,
		);
	}
	const centers = new Float32Array(dictionarySize * NATIVE15_CHANNEL_COUNT);
	const seedTargetIndices = [];
	for (let learnedIndex = 0; learnedIndex < learnedCount; learnedIndex += 1) {
		let farthestIndex = 0;
		let farthestDistance = -1;
		for (let targetIndex = 0; targetIndex < targets.recordIndices.length; targetIndex += 1) {
			let nearestDistance = Number.POSITIVE_INFINITY;
			for (let existingId = 0; existingId <= learnedIndex; existingId += 1) {
				const distance = squaredDistance(
					targets.values,
					targetIndex * NATIVE15_CHANNEL_COUNT,
					centers,
					existingId * NATIVE15_CHANNEL_COUNT,
				);
				nearestDistance = Math.min(nearestDistance, distance);
			}
			if (nearestDistance > farthestDistance) {
				farthestDistance = nearestDistance;
				farthestIndex = targetIndex;
			}
		}
		seedTargetIndices.push(farthestIndex);
		copyVector(
			targets.values,
			farthestIndex * NATIVE15_CHANNEL_COUNT,
			centers,
			(learnedIndex + 1) * NATIVE15_CHANNEL_COUNT,
		);
	}
	let currentCenters = centers;
	let priorAssignments = new Int32Array(targets.recordIndices.length);
	priorAssignments.fill(-1);
	let iterationsPerformed = 0;
	let converged = learnedCount === 0;
	for (let iteration = 0; iteration < maxIterations && learnedCount > 0; iteration += 1) {
		const assignments = new Int32Array(targets.recordIndices.length);
		const sums = Array.from(
			{length: dictionarySize},
			() => new Float64Array(NATIVE15_CHANNEL_COUNT),
		);
		const counts = new Uint32Array(dictionarySize);
		let assignmentsStable = true;
		for (let targetIndex = 0; targetIndex < targets.recordIndices.length; targetIndex += 1) {
			const recordIndex = targets.recordIndices[targetIndex];
			const nearest = nearestValidResidualCenter(
				targets.values,
				targetIndex * NATIVE15_CHANNEL_COUNT,
				currentCenters,
				dictionarySize,
				baseDictionary,
				baseAssignments[recordIndex],
			);
			assignments[targetIndex] = nearest.id;
			assignmentsStable &&= nearest.id === priorAssignments[targetIndex];
			counts[nearest.id] += 1;
			for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
				sums[nearest.id][channel] +=
					targets.values[targetIndex * NATIVE15_CHANNEL_COUNT + channel];
			}
		}
		const nextCenters = new Float32Array(currentCenters.length);
		let centersStable = true;
		for (let id = 1; id < dictionarySize; id += 1) {
			if (counts[id] === 0) {
				copyVector(
					currentCenters,
					id * NATIVE15_CHANNEL_COUNT,
					nextCenters,
					id * NATIVE15_CHANNEL_COUNT,
				);
			} else {
				for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
					nextCenters[id * NATIVE15_CHANNEL_COUNT + channel] = F32(
						sums[id][channel] / counts[id],
					);
				}
			}
			centersStable &&= equalVectorBits(
				currentCenters,
				id * NATIVE15_CHANNEL_COUNT,
				nextCenters,
				id * NATIVE15_CHANNEL_COUNT,
			);
		}
		currentCenters = nextCenters;
		priorAssignments = assignments;
		iterationsPerformed = iteration + 1;
		if (assignmentsStable && centersStable) {
			converged = true;
			break;
		}
	}
	const trainingAssignments = new Uint32Array(records.count);
	for (let targetIndex = 0; targetIndex < targets.recordIndices.length; targetIndex += 1) {
		const recordIndex = targets.recordIndices[targetIndex];
		trainingAssignments[recordIndex] = nearestValidResidualCenter(
			targets.values,
			targetIndex * NATIVE15_CHANNEL_COUNT,
			currentCenters,
			dictionarySize,
			baseDictionary,
			baseAssignments[recordIndex],
		).id;
	}
	return {
		schemaVersion: 'native15-shared-signed-residual-dictionary-v1',
		channelCount: NATIVE15_CHANNEL_COUNT,
		dictionarySize,
		zeroId: 0,
		maxIterations,
		iterationsPerformed,
		converged,
		dictionary: currentCenters,
		dictionaryHash: hashFloat32Values(currentCenters),
		seedRecordIds: seedTargetIndices.map(
			(targetIndex) => records.ids[targets.recordIndices[targetIndex]],
		),
		trainingAssignments,
		trainingOccupancy: createOccupancy(trainingAssignments, dictionarySize),
	};
}

/**
 * Fit a shared signed residual dictionary for already-fixed base assignments.
 * Delta ID 0 remains exact zero and is a fixed (not averaged) centroid.
 */
export function fitSharedResidualDictionary(
	records,
	{
		baseDictionary,
		baseAssignments,
		dictionarySize,
		maxIterations = MAX_LLOYD_ITERATIONS,
	},
) {
	return fitSharedResidualDictionaryPrepared(
		prepareRecords(records, 'trainingRecords'),
		baseDictionary,
		baseAssignments,
		dictionarySize,
		maxIterations,
	);
}

function validateDeltaDictionary(dictionary) {
	if (!(dictionary instanceof Float32Array)
		|| dictionary.length < NATIVE15_CHANNEL_COUNT
		|| dictionary.length % NATIVE15_CHANNEL_COUNT !== 0) {
		throw new TypeError('deltaDictionary must be a Float32Array of Native15 vectors.');
	}
	if (!isZeroVector(dictionary, 0)) {
		throw new Error('Delta dictionary ID 0 must be the exact-zero vector.');
	}
	for (let index = 0; index < dictionary.length; index += 1) {
		if (!Number.isFinite(dictionary[index])) {
			throw new RangeError('Delta dictionary values must be finite.');
		}
	}
	return dictionary.length / NATIVE15_CHANNEL_COUNT;
}

function encodeSharedDeltaPrepared(
	records,
	baseDictionary,
	baseAssignments,
	deltaDictionary,
) {
	const baseDictionarySize = validateBaseDictionary(baseDictionary);
	const deltaDictionarySize = validateDeltaDictionary(deltaDictionary);
	validateAssignments(
		baseAssignments,
		records.count,
		baseDictionarySize,
		'baseAssignments',
	);
	const baseIds = Uint32Array.from(baseAssignments);
	const deltaIds = new Uint32Array(records.count);
	const gains = new Float32Array(records.count);
	const reconstruction = new Float32Array(records.values.length);
	let rejectedNegativeShapeCandidateCount = 0;
	let recordsWithRejectedNegativeShapeCandidates = 0;
	for (let index = 0; index < records.count; index += 1) {
		if (records.exactZero[index]) {
			if (baseIds[index] !== 0) {
				throw new Error('Exact-zero truth records must use base ID 0.');
			}
			continue;
		}
		if (baseIds[index] === 0) {
			throw new Error('Nonzero truth records may not use reserved base ID 0.');
		}
		const truthOffset = index * NATIVE15_CHANNEL_COUNT;
		let best = null;
		let bestDeltaId = 0;
		let rejectedForRecord = false;
		for (let deltaId = 0; deltaId < deltaDictionarySize; deltaId += 1) {
			if (!shapeIsNonnegative(baseDictionary, baseIds[index], deltaDictionary, deltaId)) {
				rejectedNegativeShapeCandidateCount += 1;
				rejectedForRecord = true;
				continue;
			}
			const shape = makeCombinedShape(
				baseDictionary,
				baseIds[index],
				deltaDictionary,
				deltaId,
			);
			if (isZeroVector(shape)) {
				continue;
			}
			const gain = leastSquaresGainF32(records.values, truthOffset, shape);
			if (gain === null) {
				continue;
			}
			const decoded = new Float32Array(NATIVE15_CHANNEL_COUNT);
			let squaredError = 0;
			let valid = true;
			for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
				const value = F32(gain * shape[channel]);
				if (!Number.isFinite(value) || value < 0) {
					valid = false;
					break;
				}
				decoded[channel] = value;
				const difference = records.values[truthOffset + channel] - value;
				squaredError += difference * difference;
			}
			if (valid && (!best || squaredError < best.squaredError)) {
				best = {gain, decoded, squaredError};
				bestDeltaId = deltaId;
			}
		}
		if (rejectedForRecord) {
			recordsWithRejectedNegativeShapeCandidates += 1;
		}
		if (!best) {
			throw new RangeError(
				`No nonnegative base+delta encoding exists for ${records.ids[index]}.`,
			);
		}
		deltaIds[index] = bestDeltaId;
		gains[index] = best.gain;
		reconstruction.set(best.decoded, truthOffset);
	}
	return {
		schemaVersion: 'native15-base-gain-shared-delta-encoding-v1',
		formula: 'f32(gain * f32(base[channel] + delta[channel]))',
		baseDictionarySize,
		deltaDictionarySize,
		baseIds,
		deltaIds,
		gains,
		reconstruction,
		rejectedNegativeShapeCandidateCount,
		recordsWithRejectedNegativeShapeCandidates,
		baseOccupancy: createOccupancy(baseIds, baseDictionarySize),
		deltaOccupancy: createOccupancy(deltaIds, deltaDictionarySize),
		hashes: {
			baseIds: hashIntegerValues(baseIds),
			deltaIds: hashIntegerValues(deltaIds),
			gains: hashFloat32Values(gains),
			reconstruction: hashFloat32Values(reconstruction),
		},
	};
}

/** Encode fixed bases with a shared signed delta and refitted Float32 LS gain. */
export function encodeBaseGainSharedDelta(
	records,
	{baseDictionary, baseAssignments, deltaDictionary},
) {
	return encodeSharedDeltaPrepared(
		prepareRecords(records, 'records'),
		baseDictionary,
		baseAssignments,
		deltaDictionary,
	);
}

/** Round to nearest integer with ties away from zero. */
export function roundSymmetric(value) {
	if (!Number.isFinite(value)) {
		throw new RangeError('roundSymmetric requires a finite value.');
	}
	return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}

function encodeDirectResidualPrepared(
	records,
	baseDictionary,
	baseAssignments,
	bits,
) {
	if (bits !== 8 && bits !== 16) {
		throw new RangeError('bits must be 8 or 16.');
	}
	const baseDictionarySize = validateBaseDictionary(baseDictionary);
	validateAssignments(
		baseAssignments,
		records.count,
		baseDictionarySize,
		'baseAssignments',
	);
	const maxInteger = bits === 8 ? 127 : 32767;
	const baseIds = Uint32Array.from(baseAssignments);
	const gains = new Float32Array(records.count);
	const scales = new Float32Array(records.count);
	const quantizedResiduals = bits === 8
		? new Int8Array(records.count * NATIVE15_CHANNEL_COUNT)
		: new Int16Array(records.count * NATIVE15_CHANNEL_COUNT);
	const reconstruction = new Float32Array(records.values.length);
	let negativeShapeRecordCount = 0;
	for (let index = 0; index < records.count; index += 1) {
		if (records.exactZero[index]) {
			if (baseIds[index] !== 0) {
				throw new Error('Exact-zero truth records must use base ID 0.');
			}
			continue;
		}
		if (baseIds[index] === 0) {
			throw new Error('Nonzero truth records may not use reserved base ID 0.');
		}
		const truthOffset = index * NATIVE15_CHANNEL_COUNT;
		const normalized = normalizeToFloat32(records.values, truthOffset);
		const residual = new Float32Array(NATIVE15_CHANNEL_COUNT);
		let maxAbsoluteResidual = 0;
		for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
			residual[channel] = F32(
				normalized[channel]
				- baseDictionary[baseIds[index] * NATIVE15_CHANNEL_COUNT + channel],
			);
			maxAbsoluteResidual = Math.max(
				maxAbsoluteResidual,
				Math.abs(residual[channel]),
			);
		}
		const scale = maxAbsoluteResidual === 0
			? 0
			: F32(maxAbsoluteResidual / maxInteger);
		scales[index] = scale;
		const shape = new Float32Array(NATIVE15_CHANNEL_COUNT);
		let hasNegativeShape = false;
		for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
			let quantized = scale === 0
				? 0
				: roundSymmetric(F32(residual[channel] / scale));
			quantized = Math.max(-maxInteger, Math.min(maxInteger, quantized));
			quantizedResiduals[truthOffset + channel] = quantized;
			const decodedResidual = F32(scale * quantized);
			shape[channel] = F32(
				baseDictionary[baseIds[index] * NATIVE15_CHANNEL_COUNT + channel]
				+ decodedResidual,
			);
			hasNegativeShape ||= shape[channel] < 0;
		}
		negativeShapeRecordCount += hasNegativeShape ? 1 : 0;
		const gain = leastSquaresGainF32(records.values, truthOffset, shape);
		if (gain === null) {
			throw new RangeError(
				`No finite direct int${bits} residual encoding exists for ${records.ids[index]}.`,
			);
		}
		gains[index] = gain;
		for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
			reconstruction[truthOffset + channel] = F32(gain * shape[channel]);
		}
	}
	return {
		schemaVersion: `native15-base-gain-direct-int${bits}-residual-v1`,
		formula: 'f32(gain * f32(base[channel] + f32(scale * signedResidual[channel])))',
		bits,
		symmetricIntegerRange: [-maxInteger, maxInteger],
		baseDictionarySize,
		baseIds,
		gains,
		scales,
		quantizedResiduals,
		reconstruction,
		negativeShapeRecordCount,
		baseOccupancy: createOccupancy(baseIds, baseDictionarySize),
		hashes: {
			baseIds: hashIntegerValues(baseIds),
			gains: hashFloat32Values(gains),
			scales: hashFloat32Values(scales),
			quantizedResiduals: hashIntegerValues(quantizedResiduals),
			reconstruction: hashFloat32Values(reconstruction),
		},
	};
}

/** Encode a per-sample signed int8/int16 residual with one Float32 scale. */
export function encodeBaseGainDirectResidual(
	records,
	{baseDictionary, baseAssignments, bits},
) {
	return encodeDirectResidualPrepared(
		prepareRecords(records, 'records'),
		baseDictionary,
		baseAssignments,
		bits,
	);
}

/** Smallest ordinary unsigned scalar width that can address entryCount IDs. */
export function minimumUnsignedIndexBytes(entryCount) {
	assertPositiveInteger(entryCount, 'entryCount');
	if (entryCount <= 0x100) {
		return 1;
	}
	if (entryCount <= 0x10000) {
		return 2;
	}
	if (entryCount <= 0x100000000) {
		return 4;
	}
	throw new RangeError('entryCount exceeds Uint32 addressability.');
}

function checkedByteProduct(factors, label) {
	let product = 1;
	for (const factor of factors) {
		assertNonnegativeInteger(factor, label);
		product *= factor;
		if (!Number.isSafeInteger(product)) {
			throw new RangeError(`${label} exceeds safe integer byte arithmetic.`);
		}
	}
	return product;
}

/** Logical Native15 Float32 payload bytes. */
export function calculateRawNative15Bytes(sampleCount, scalarBytes = 4) {
	return checkedByteProduct(
		[sampleCount, NATIVE15_CHANNEL_COUNT, scalarBytes],
		'raw Native15 bytes',
	);
}

/** Logical bytes for base ID + Float32 gain with one global base dictionary. */
export function calculateBaseGainMemory({
	sampleCount,
	baseDictionarySize,
	baseIndexBytes = minimumUnsignedIndexBytes(baseDictionarySize),
	gainBytes = 4,
	dictionaryScalarBytes = 4,
	dictionaryStoredChannelCount = NATIVE15_CHANNEL_COUNT,
}) {
	const dictionaryBytes = checkedByteProduct(
		[baseDictionarySize, dictionaryStoredChannelCount, dictionaryScalarBytes],
		'base dictionary bytes',
	);
	const perSampleBytes = baseIndexBytes + gainBytes;
	const sampleBytes = checkedByteProduct(
		[sampleCount, perSampleBytes],
		'base+gain sample bytes',
	);
	return {
		dictionaryBytes,
		perSampleBytes,
		sampleBytes,
		totalBytes: dictionaryBytes + sampleBytes,
		baseIndexBytes,
		gainBytes,
	};
}

/** Logical bytes for fixed base ID + shared delta ID + Float32 gain. */
export function calculateSharedDeltaMemory({
	sampleCount,
	baseDictionarySize,
	deltaDictionarySize,
	baseIndexBytes = minimumUnsignedIndexBytes(baseDictionarySize),
	deltaIndexBytes = minimumUnsignedIndexBytes(deltaDictionarySize),
	gainBytes = 4,
	dictionaryScalarBytes = 4,
	dictionaryStoredChannelCount = NATIVE15_CHANNEL_COUNT,
}) {
	const baseDictionaryBytes = checkedByteProduct(
		[baseDictionarySize, dictionaryStoredChannelCount, dictionaryScalarBytes],
		'base dictionary bytes',
	);
	const deltaDictionaryBytes = checkedByteProduct(
		[deltaDictionarySize, dictionaryStoredChannelCount, dictionaryScalarBytes],
		'delta dictionary bytes',
	);
	const perSampleBytes = baseIndexBytes + deltaIndexBytes + gainBytes;
	const sampleBytes = checkedByteProduct(
		[sampleCount, perSampleBytes],
		'shared-delta sample bytes',
	);
	return {
		baseDictionaryBytes,
		deltaDictionaryBytes,
		dictionaryBytes: baseDictionaryBytes + deltaDictionaryBytes,
		perSampleBytes,
		sampleBytes,
		totalBytes: baseDictionaryBytes + deltaDictionaryBytes + sampleBytes,
		baseIndexBytes,
		deltaIndexBytes,
		gainBytes,
	};
}

/** Logical bytes for a direct per-sample int8/int16 Native15 residual. */
export function calculateDirectResidualMemory({
	sampleCount,
	baseDictionarySize,
	bits,
	baseIndexBytes = minimumUnsignedIndexBytes(baseDictionarySize),
	gainBytes = 4,
	scaleBytes = 4,
	dictionaryScalarBytes = 4,
	dictionaryStoredChannelCount = NATIVE15_CHANNEL_COUNT,
}) {
	if (bits !== 8 && bits !== 16) {
		throw new RangeError('bits must be 8 or 16.');
	}
	const dictionaryBytes = checkedByteProduct(
		[baseDictionarySize, dictionaryStoredChannelCount, dictionaryScalarBytes],
		'base dictionary bytes',
	);
	const residualBytes = NATIVE15_CHANNEL_COUNT * (bits / 8);
	const perSampleBytes = baseIndexBytes + gainBytes + scaleBytes + residualBytes;
	const sampleBytes = checkedByteProduct(
		[sampleCount, perSampleBytes],
		'direct-residual sample bytes',
	);
	return {
		dictionaryBytes,
		perSampleBytes,
		residualBytesPerSample: residualBytes,
		sampleBytes,
		totalBytes: dictionaryBytes + sampleBytes,
		baseIndexBytes,
		gainBytes,
		scaleBytes,
		bits,
	};
}

function sortedUniqueSizes(values, label, fallback = null) {
	const selected = values === undefined ? fallback : values;
	if (!Array.isArray(selected) || selected.length === 0) {
		throw new TypeError(`${label} must be a nonempty array.`);
	}
	const output = [...new Set(selected.map((value) => {
		assertPositiveInteger(value, label);
		return value;
	}))];
	output.sort((left, right) => left - right);
	return output;
}

function projectionRecord(kind, sampleCount, memory, rawBytes, parameters) {
	const totalBytes = memory.totalBytes;
	return {
		kind,
		sampleCount,
		parameters,
		...memory,
		rawBytes,
		ratioToRaw: rawBytes === 0 ? 0 : totalBytes / rawBytes,
		reductionFraction: rawBytes === 0 ? 0 : 1 - totalBytes / rawBytes,
		reductionPercent: rawBytes === 0 ? 0 : (1 - totalBytes / rawBytes) * 100,
	};
}

/**
 * Project logical codec bytes. Dictionary sizes include reserved zero ID.
 * `sampleCounts` may be an array, an object keyed by cohort, or one number.
 */
export function createMemoryProjections({
	sampleCount,
	sampleCounts = sampleCount,
	baseSizes,
	sharedDeltaBaseSizes = baseSizes,
	sharedDeltaSizes = [1],
	baseIndexBytes,
	deltaIndexBytes,
	dictionaryScalarBytes = 4,
	dictionaryStoredChannelCount = NATIVE15_CHANNEL_COUNT,
	gainBytes = 4,
	scaleBytes = 4,
} = {}) {
	const normalizedBaseSizes = sortedUniqueSizes(baseSizes, 'baseSizes');
	const normalizedSharedBaseSizes = sortedUniqueSizes(
		sharedDeltaBaseSizes,
		'sharedDeltaBaseSizes',
		normalizedBaseSizes,
	);
	const normalizedDeltaSizes = sortedUniqueSizes(
		sharedDeltaSizes,
		'sharedDeltaSizes',
	);
	let countEntries;
	if (Number.isSafeInteger(sampleCounts)) {
		countEntries = [['samples', sampleCounts]];
	} else if (Array.isArray(sampleCounts)) {
		countEntries = sampleCounts.map((count, index) => [String(index), count]);
	} else if (sampleCounts && typeof sampleCounts === 'object') {
		countEntries = Object.entries(sampleCounts).sort(([left], [right]) =>
			left.localeCompare(right));
	} else {
		throw new TypeError('sampleCount or sampleCounts is required.');
	}
	const cohorts = [];
	for (const [id, count] of countEntries) {
		assertNonnegativeInteger(count, `sampleCounts.${id}`);
		const rawBytes = calculateRawNative15Bytes(count);
		const projections = [{
			kind: 'raw-native15-f32',
			sampleCount: count,
			totalBytes: rawBytes,
			rawBytes,
			ratioToRaw: rawBytes === 0 ? 0 : 1,
			reductionFraction: 0,
			reductionPercent: 0,
			parameters: {},
		}];
		for (const baseDictionarySize of normalizedBaseSizes) {
			const memory = calculateBaseGainMemory({
				sampleCount: count,
				baseDictionarySize,
				baseIndexBytes:
					baseIndexBytes
					?? minimumUnsignedIndexBytes(baseDictionarySize),
				dictionaryScalarBytes,
				dictionaryStoredChannelCount,
				gainBytes,
			});
			projections.push(projectionRecord(
				'base-gain',
				count,
				memory,
				rawBytes,
				{baseDictionarySize},
			));
		}
		for (const baseDictionarySize of normalizedSharedBaseSizes) {
			for (const deltaDictionarySize of normalizedDeltaSizes) {
				const memory = calculateSharedDeltaMemory({
					sampleCount: count,
					baseDictionarySize,
					deltaDictionarySize,
					baseIndexBytes:
						baseIndexBytes
						?? minimumUnsignedIndexBytes(baseDictionarySize),
					deltaIndexBytes:
						deltaIndexBytes
						?? minimumUnsignedIndexBytes(deltaDictionarySize),
					dictionaryScalarBytes,
					dictionaryStoredChannelCount,
					gainBytes,
				});
				projections.push(projectionRecord(
					'base-gain-shared-delta',
					count,
					memory,
					rawBytes,
					{baseDictionarySize, deltaDictionarySize},
				));
			}
			for (const bits of [8, 16]) {
				const memory = calculateDirectResidualMemory({
					sampleCount: count,
					baseDictionarySize,
					bits,
					baseIndexBytes:
						baseIndexBytes
						?? minimumUnsignedIndexBytes(baseDictionarySize),
					dictionaryScalarBytes,
					dictionaryStoredChannelCount,
					gainBytes,
					scaleBytes,
				});
				projections.push(projectionRecord(
					`base-gain-direct-int${bits}-residual`,
					count,
					memory,
					rawBytes,
					{baseDictionarySize, bits},
				));
			}
		}
		cohorts.push({id, sampleCount: count, rawBytes, projections});
	}
	return {
		schemaVersion: 'native15-codec-memory-projections-v1',
		assumptions: {
			channelCount: NATIVE15_CHANNEL_COUNT,
			rawScalarBytes: 4,
			dictionaryScalarBytes,
			dictionaryStoredChannelCount,
			gainBytes,
			scaleBytes,
			indexPolicy: baseIndexBytes === undefined
				&& deltaIndexBytes === undefined
					? 'minimum ordinary unsigned scalar width'
					: 'caller-selected fixed scalar widths',
			baseIndexBytes: baseIndexBytes ?? null,
			deltaIndexBytes: deltaIndexBytes ?? null,
			dictionarySizesIncludeReservedZeroId: true,
		},
		cohorts,
	};
}

function percentile(sorted, fraction) {
	if (sorted.length === 0) {
		return null;
	}
	if (fraction <= 0) {
		return sorted[0];
	}
	const index = Math.min(
		sorted.length - 1,
		Math.ceil(fraction * sorted.length) - 1,
	);
	return sorted[index];
}

function distributionSummary(values, includePercent = false) {
	if (values.length === 0) {
		return {
			count: 0,
			mean: null,
			p50: null,
			p90: null,
			p95: null,
			p99: null,
			max: null,
		};
	}
	const sorted = [...values].sort((left, right) => left - right);
	let sum = 0;
	for (const value of values) {
		sum += value;
	}
	const summary = {
		count: values.length,
		mean: sum / values.length,
		p50: percentile(sorted, 0.5),
		p90: percentile(sorted, 0.9),
		p95: percentile(sorted, 0.95),
		p99: percentile(sorted, 0.99),
		max: sorted[sorted.length - 1],
	};
	if (includePercent) {
		summary.percent = {
			mean: summary.mean * 100,
			p50: summary.p50 * 100,
			p90: summary.p90 * 100,
			p95: summary.p95 * 100,
			p99: summary.p99 * 100,
			max: summary.max * 100,
		};
	}
	return summary;
}

function worstRecord(current, value, recordId, extra = {}) {
	if (!current || value > current.value) {
		return {recordId, value, ...extra};
	}
	return current;
}

function bandSummary(
	records,
	reconstruction,
	indices,
	materialFloor,
) {
	const relativeErrors = [];
	const absoluteErrors = [];
	let truthTotal = 0;
	let reconstructionTotal = 0;
	let worst = null;
	for (let index = 0; index < records.count; index += 1) {
		let truthSum = 0;
		let reconstructedSum = 0;
		for (const channel of indices) {
			truthSum += records.values[index * NATIVE15_CHANNEL_COUNT + channel];
			reconstructedSum +=
				reconstruction[index * NATIVE15_CHANNEL_COUNT + channel];
		}
		truthTotal += truthSum;
		reconstructionTotal += reconstructedSum;
		const absoluteError = Math.abs(reconstructedSum - truthSum);
		const relativeError = absoluteError
			/ Math.max(Math.abs(truthSum), materialFloor * indices.length);
		absoluteErrors.push(absoluteError);
		relativeErrors.push(relativeError);
		worst = worstRecord(worst, relativeError, records.ids[index], {
			truth: truthSum,
			reconstruction: reconstructedSum,
		});
	}
	return {
		indices: [...indices],
		truthTotal,
		reconstructionTotal,
		signedErrorTotal: reconstructionTotal - truthTotal,
		relativeTotalError: Math.abs(reconstructionTotal - truthTotal)
			/ Math.max(Math.abs(truthTotal), materialFloor * indices.length * records.count),
		absoluteError: distributionSummary(absoluteErrors),
		materialFloorRelativeError: distributionSummary(relativeErrors, true),
		worst,
	};
}

function calculateMetricsPrepared(
	records,
	reconstruction,
	materialFloor,
	occupancyOptions = {},
) {
	if (!reconstruction || reconstruction.length !== records.values.length) {
		throw new RangeError('reconstruction must contain one Native15 vector per record.');
	}
	materialFloor = validateMaterialFloor(materialFloor);
	const relativeL2Values = [];
	const materialRelativeValues = [];
	const integratedRelativeValues = [];
	const integratedAbsoluteValues = [];
	const ratioAbsoluteValues = [];
	const ratioRelativeValues = [];
	const channelStates = Array.from(
		{length: NATIVE15_CHANNEL_COUNT},
		() => ({
			truthSquared: 0,
			errorSquared: 0,
			absoluteSum: 0,
			truthSum: 0,
			reconstructionSum: 0,
			maxAbsoluteError: 0,
			worstRecordId: null,
			materialRelative: [],
			negativeCount: 0,
			nonfiniteCount: 0,
		}),
	);
	let truthSquaredTotal = 0;
	let errorSquaredTotal = 0;
	let maxAbsoluteError = 0;
	let minimumReconstruction = Number.POSITIVE_INFINITY;
	let truthIntegratedTotal = 0;
	let reconstructionIntegratedTotal = 0;
	let exactZeroTruthCount = 0;
	let exactZeroPreservedCount = 0;
	let falseZeroCount = 0;
	let reconstructionExactZeroCount = 0;
	let negativeScalarCount = 0;
	let negativeRecordCount = 0;
	let nonfiniteScalarCount = 0;
	let nonfiniteRecordCount = 0;
	let ratioValidCount = 0;
	let ratioTruthDenominatorBelowFloorCount = 0;
	let ratioReconstructionDenominatorBelowFloorCount = 0;
	let truthRatioNumeratorTotal = 0;
	let truthRatioDenominatorTotal = 0;
	let reconstructionRatioNumeratorTotal = 0;
	let reconstructionRatioDenominatorTotal = 0;
	const worstIds = {
		relativeL2: null,
		maxAbsolute: null,
		materialFloorRelative: null,
		integratedSum: null,
		ratio470To626: null,
	};
	for (let index = 0; index < records.count; index += 1) {
		const offset = index * NATIVE15_CHANNEL_COUNT;
		let sampleTruthSquared = 0;
		let sampleErrorSquared = 0;
		let sampleTruthSum = 0;
		let sampleReconstructionSum = 0;
		let reconstructedZero = true;
		let sampleNegative = false;
		let sampleNonfinite = false;
		for (let channel = 0; channel < NATIVE15_CHANNEL_COUNT; channel += 1) {
			const truth = records.values[offset + channel];
			const reconstructed = Number(reconstruction[offset + channel]);
			const channelState = channelStates[channel];
			channelState.truthSquared += truth * truth;
			channelState.truthSum += truth;
			truthSquaredTotal += truth * truth;
			sampleTruthSquared += truth * truth;
			sampleTruthSum += truth;
			if (!Number.isFinite(reconstructed)) {
				nonfiniteScalarCount += 1;
				channelState.nonfiniteCount += 1;
				channelState.errorSquared = Number.POSITIVE_INFINITY;
				channelState.absoluteSum = Number.POSITIVE_INFINITY;
				channelState.reconstructionSum = Number.POSITIVE_INFINITY;
				channelState.maxAbsoluteError = Number.POSITIVE_INFINITY;
				channelState.worstRecordId ??= records.ids[index];
				channelState.materialRelative.push(Number.POSITIVE_INFINITY);
				materialRelativeValues.push(Number.POSITIVE_INFINITY);
				maxAbsoluteError = Number.POSITIVE_INFINITY;
				worstIds.maxAbsolute ??= {
					recordId: records.ids[index],
					channelIndex: channel,
					truth,
					reconstruction: reconstructed,
					value: Number.POSITIVE_INFINITY,
				};
				worstIds.materialFloorRelative = worstRecord(
					worstIds.materialFloorRelative,
					Number.POSITIVE_INFINITY,
					records.ids[index],
					{channelIndex: channel, truth, reconstruction: reconstructed},
				);
				sampleNonfinite = true;
				reconstructedZero = false;
				continue;
			}
			minimumReconstruction = Math.min(minimumReconstruction, reconstructed);
			reconstructedZero &&= reconstructed === 0;
			if (reconstructed < 0) {
				negativeScalarCount += 1;
				channelState.negativeCount += 1;
				sampleNegative = true;
			}
			const difference = reconstructed - truth;
			const absoluteError = Math.abs(difference);
			const squaredError = difference * difference;
			const materialRelative = absoluteError / Math.max(Math.abs(truth), materialFloor);
			channelState.errorSquared += squaredError;
			channelState.absoluteSum += absoluteError;
			channelState.reconstructionSum += reconstructed;
			channelState.materialRelative.push(materialRelative);
			errorSquaredTotal += squaredError;
			sampleErrorSquared += squaredError;
			sampleReconstructionSum += reconstructed;
			materialRelativeValues.push(materialRelative);
			if (absoluteError > channelState.maxAbsoluteError) {
				channelState.maxAbsoluteError = absoluteError;
				channelState.worstRecordId = records.ids[index];
			}
			if (absoluteError > maxAbsoluteError) {
				maxAbsoluteError = absoluteError;
				worstIds.maxAbsolute = {
					recordId: records.ids[index],
					channelIndex: channel,
					truth,
					reconstruction: reconstructed,
					value: absoluteError,
				};
			}
			worstIds.materialFloorRelative = worstRecord(
				worstIds.materialFloorRelative,
				materialRelative,
				records.ids[index],
				{channelIndex: channel, truth, reconstruction: reconstructed},
			);
		}
		negativeRecordCount += sampleNegative ? 1 : 0;
		nonfiniteRecordCount += sampleNonfinite ? 1 : 0;
		if (sampleNonfinite) {
			sampleErrorSquared = Number.POSITIVE_INFINITY;
			sampleReconstructionSum = Number.POSITIVE_INFINITY;
			errorSquaredTotal = Number.POSITIVE_INFINITY;
		}
		if (records.exactZero[index]) {
			exactZeroTruthCount += 1;
			exactZeroPreservedCount += reconstructedZero ? 1 : 0;
		} else {
			const relativeL2 = Math.sqrt(sampleErrorSquared / sampleTruthSquared);
			relativeL2Values.push(relativeL2);
			worstIds.relativeL2 = worstRecord(
				worstIds.relativeL2,
				relativeL2,
				records.ids[index],
			);
			falseZeroCount += reconstructedZero ? 1 : 0;
		}
		reconstructionExactZeroCount += reconstructedZero ? 1 : 0;
		truthIntegratedTotal += sampleTruthSum;
		reconstructionIntegratedTotal += sampleReconstructionSum;
		const integratedAbsolute = Math.abs(sampleReconstructionSum - sampleTruthSum);
		const integratedRelative = integratedAbsolute
			/ Math.max(Math.abs(sampleTruthSum), materialFloor * NATIVE15_CHANNEL_COUNT);
		integratedAbsoluteValues.push(integratedAbsolute);
		integratedRelativeValues.push(integratedRelative);
		worstIds.integratedSum = worstRecord(
			worstIds.integratedSum,
			integratedRelative,
			records.ids[index],
			{truth: sampleTruthSum, reconstruction: sampleReconstructionSum},
		);
		const truthNumerator = records.values[offset + RATIO_470_CHANNEL_INDEX];
		const truthDenominator = records.values[offset + RATIO_626_CHANNEL_INDEX];
		const reconstructionNumerator = reconstruction[offset + RATIO_470_CHANNEL_INDEX];
		const reconstructionDenominator = reconstruction[offset + RATIO_626_CHANNEL_INDEX];
		truthRatioNumeratorTotal += truthNumerator;
		truthRatioDenominatorTotal += truthDenominator;
		reconstructionRatioNumeratorTotal += reconstructionNumerator;
		reconstructionRatioDenominatorTotal += reconstructionDenominator;
		if (!(truthDenominator > materialFloor)) {
			ratioTruthDenominatorBelowFloorCount += 1;
		} else if (!Number.isFinite(reconstructionNumerator)
			|| !Number.isFinite(reconstructionDenominator)
			|| !(reconstructionDenominator > materialFloor)) {
			ratioReconstructionDenominatorBelowFloorCount += 1;
		} else {
			const truthRatio = truthNumerator / truthDenominator;
			const reconstructedRatio = reconstructionNumerator / reconstructionDenominator;
			const absoluteRatioError = Math.abs(reconstructedRatio - truthRatio);
			const relativeRatioError = absoluteRatioError
				/ Math.max(Math.abs(truthRatio), materialFloor);
			ratioAbsoluteValues.push(absoluteRatioError);
			ratioRelativeValues.push(relativeRatioError);
			ratioValidCount += 1;
			worstIds.ratio470To626 = worstRecord(
				worstIds.ratio470To626,
				relativeRatioError,
				records.ids[index],
				{truth: truthRatio, reconstruction: reconstructedRatio},
			);
		}
	}
	const scalarCount = records.count * NATIVE15_CHANNEL_COUNT;
	const truthRms = Math.sqrt(truthSquaredTotal / scalarCount);
	const errorRms = Math.sqrt(errorSquaredTotal / scalarCount);
	const perChannel = channelStates.map((state, channelIndex) => ({
		channelIndex,
		truthSum: state.truthSum,
		reconstructionSum: state.reconstructionSum,
		signedErrorSum: state.reconstructionSum - state.truthSum,
		rmse: Math.sqrt(state.errorSquared / records.count),
		normalizedRmse: state.truthSquared === 0
			? (state.errorSquared === 0 ? 0 : Number.POSITIVE_INFINITY)
			: Math.sqrt(state.errorSquared / state.truthSquared),
		meanAbsoluteError: state.absoluteSum / records.count,
		maxAbsoluteError: state.maxAbsoluteError,
		worstRecordId: state.worstRecordId,
		materialFloorRelativeError: distributionSummary(
			state.materialRelative,
			true,
		),
		negativeCount: state.negativeCount,
		nonfiniteCount: state.nonfiniteCount,
	}));
	const occupancy = {};
	if (occupancyOptions.baseAssignments) {
		occupancy.base = createOccupancy(
			occupancyOptions.baseAssignments,
			occupancyOptions.baseDictionarySize,
		);
	}
	if (occupancyOptions.deltaAssignments) {
		occupancy.delta = createOccupancy(
			occupancyOptions.deltaAssignments,
			occupancyOptions.deltaDictionarySize,
		);
	}
	const blue = bandSummary(
		records,
		reconstruction,
		BLUE_CHANNEL_INDICES,
		materialFloor,
	);
	const red = bandSummary(
		records,
		reconstruction,
		RED_CHANNEL_INDICES,
		materialFloor,
	);
	worstIds.blueBand = blue.worst;
	worstIds.redBand = red.worst;
	return {
		schemaVersion: 'native15-codec-error-metrics-v1',
		recordCount: records.count,
		channelCount: NATIVE15_CHANNEL_COUNT,
		materialFloor,
		relativeL2: distributionSummary(relativeL2Values, true),
		global: {
			truthRms,
			rmse: errorRms,
			normalizedRmse: truthRms === 0
				? (errorRms === 0 ? 0 : Number.POSITIVE_INFINITY)
				: errorRms / truthRms,
			frobeniusRelative: truthSquaredTotal === 0
				? (errorSquaredTotal === 0 ? 0 : Number.POSITIVE_INFINITY)
				: Math.sqrt(errorSquaredTotal / truthSquaredTotal),
			maxAbsoluteError,
		},
		materialFloorRelative: distributionSummary(materialRelativeValues, true),
		integratedChannelSum: {
			truthTotal: truthIntegratedTotal,
			reconstructionTotal: reconstructionIntegratedTotal,
			signedErrorTotal: reconstructionIntegratedTotal - truthIntegratedTotal,
			relativeTotalError: Math.abs(
				reconstructionIntegratedTotal - truthIntegratedTotal,
			) / Math.max(
				Math.abs(truthIntegratedTotal),
				materialFloor * scalarCount,
			),
			absoluteError: distributionSummary(integratedAbsoluteValues),
			materialFloorRelativeError: distributionSummary(
				integratedRelativeValues,
				true,
			),
		},
		bands: {blue, red},
		ratio470To626: {
			numeratorChannelIndex: RATIO_470_CHANNEL_INDEX,
			denominatorChannelIndex: RATIO_626_CHANNEL_INDEX,
			validCount: ratioValidCount,
			truthDenominatorBelowFloorCount: ratioTruthDenominatorBelowFloorCount,
			reconstructionDenominatorBelowFloorCount:
				ratioReconstructionDenominatorBelowFloorCount,
			aggregateTruth: truthRatioDenominatorTotal > materialFloor
				? truthRatioNumeratorTotal / truthRatioDenominatorTotal
				: null,
			aggregateReconstruction:
				reconstructionRatioDenominatorTotal > materialFloor
					? reconstructionRatioNumeratorTotal
						/ reconstructionRatioDenominatorTotal
					: null,
			absoluteError: distributionSummary(ratioAbsoluteValues),
			relativeError: distributionSummary(ratioRelativeValues, true),
		},
		invariants: {
			exactZeroTruthCount,
			exactZeroPreservedCount,
			exactZeroViolatedCount: exactZeroTruthCount - exactZeroPreservedCount,
			reconstructionExactZeroCount,
			falseZeroCount,
			negativeScalarCount,
			negativeRecordCount,
			nonfiniteScalarCount,
			nonfiniteRecordCount,
			minimumReconstruction:
				minimumReconstruction === Number.POSITIVE_INFINITY
					? null
					: minimumReconstruction,
		},
		perChannel,
		worstIds,
		occupancy,
	};
}

/** Calculate Native15 physical/error diagnostics for one reconstruction. */
export function calculateNative15ErrorMetrics({
	truthRecords,
	reconstruction,
	materialFloor = DEFAULT_MATERIAL_FLOOR,
	baseAssignments,
	baseDictionarySize,
	deltaAssignments,
	deltaDictionarySize,
}) {
	return calculateMetricsPrepared(
		prepareRecords(truthRecords, 'truthRecords'),
		reconstruction,
		materialFloor,
		{
			baseAssignments,
			baseDictionarySize,
			deltaAssignments,
			deltaDictionarySize,
		},
	);
}

function normalizeEvaluationCohorts(evaluationCohorts, trainingRecords) {
	let entries;
	if (evaluationCohorts === undefined) {
		entries = [{id: 'training', records: trainingRecords}];
	} else if (Array.isArray(evaluationCohorts)) {
		const isCohortArray = evaluationCohorts.length > 0
			&& evaluationCohorts.every((value) =>
				value && typeof value === 'object' && Array.isArray(value.records));
		entries = isCohortArray
			? evaluationCohorts.map((value) => ({
				id: String(value.id),
				records: value.records,
			}))
			: [{id: 'evaluation', records: evaluationCohorts}];
	} else if (evaluationCohorts && typeof evaluationCohorts === 'object') {
		entries = Object.entries(evaluationCohorts)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([id, records]) => ({id, records}));
	} else {
		throw new TypeError(
			'evaluationCohorts must be a record array, cohort array, or object map.',
		);
	}
	if (entries.length === 0) {
		throw new TypeError('evaluationCohorts must not be empty.');
	}
	const seen = new Set();
	return entries.map(({id, records}) => {
		if (seen.has(id)) {
			throw new Error(`Duplicate evaluation cohort id ${id}.`);
		}
		seen.add(id);
		return {id, prepared: prepareRecords(records, `evaluationCohorts.${id}`)};
	});
}

function summarizeBaseFit(fit) {
	return {
		schemaVersion: fit.schemaVersion,
		dictionarySize: fit.dictionarySize,
		zeroId: fit.zeroId,
		maxIterations: fit.maxIterations,
		iterationsPerformed: fit.iterationsPerformed,
		converged: fit.converged,
		dictionaryHash: fit.dictionaryHash,
		seedRecordIds: fit.seedRecordIds,
		trainingOccupancy: fit.trainingOccupancy,
	};
}

function summarizeDeltaFit(fit, baseDictionarySize) {
	return {
		schemaVersion: fit.schemaVersion,
		baseDictionarySize,
		deltaDictionarySize: fit.dictionarySize,
		zeroId: fit.zeroId,
		maxIterations: fit.maxIterations,
		iterationsPerformed: fit.iterationsPerformed,
		converged: fit.converged,
		dictionaryHash: fit.dictionaryHash,
		seedRecordIds: fit.seedRecordIds,
		trainingOccupancy: fit.trainingOccupancy,
	};
}

function encodingEvidence(encoding, extraHashes = []) {
	const hashes = Object.values(encoding.hashes);
	return {
		...encoding.hashes,
		resultHash: combineHashes([...extraHashes, ...hashes]),
	};
}

function metricOptionsForEncoding(encoding) {
	return {
		baseAssignments: encoding.baseIds,
		baseDictionarySize: encoding.baseDictionarySize,
		deltaAssignments: encoding.deltaIds,
		deltaDictionarySize: encoding.deltaDictionarySize,
	};
}

function evaluateEncoding(
	cohort,
	encoding,
	materialFloor,
	memory,
	extraHashes,
) {
	const metrics = calculateMetricsPrepared(
		cohort.prepared,
		encoding.reconstruction,
		materialFloor,
		metricOptionsForEncoding(encoding),
	);
	return {
		cohortId: cohort.id,
		recordCount: cohort.prepared.count,
		memory,
		encoding: {
			formula: encoding.formula,
			negativeShapeRecordCount: encoding.negativeShapeRecordCount ?? 0,
			rejectedNegativeShapeCandidateCount:
				encoding.rejectedNegativeShapeCandidateCount ?? 0,
			recordsWithRejectedNegativeShapeCandidates:
				encoding.recordsWithRejectedNegativeShapeCandidates ?? 0,
			hashes: encodingEvidence(encoding, extraHashes),
		},
		metrics,
	};
}

function truthIdentity(prepared) {
	let state = FNV64_OFFSET;
	for (const id of prepared.ids) {
		state = hashLabel(state, id);
	}
	return combineHashes([
		formatHash(state),
		hashFloat32Values(prepared.values),
	]);
}

/**
 * Run the deterministic rough study. Sizes count total IDs, including the
 * exact-zero base/delta ID. Base assignments remain fixed while deltas fit.
 */
export function runNative15BaseGainDeltaStudy({
	trainingRecords,
	evaluationCohorts,
	baseSizes,
	sharedDeltaBaseSizes = baseSizes,
	sharedDeltaSizes,
	maxIterations = MAX_LLOYD_ITERATIONS,
	materialFloor = DEFAULT_MATERIAL_FLOOR,
}) {
	validateIterations(maxIterations);
	materialFloor = validateMaterialFloor(materialFloor);
	const normalizedBaseSizes = sortedUniqueSizes(baseSizes, 'baseSizes');
	const normalizedSharedBaseSizes = sortedUniqueSizes(
		sharedDeltaBaseSizes,
		'sharedDeltaBaseSizes',
		normalizedBaseSizes,
	);
	const normalizedDeltaSizes = sortedUniqueSizes(
		sharedDeltaSizes,
		'sharedDeltaSizes',
	);
	const training = prepareRecords(trainingRecords, 'trainingRecords');
	const cohorts = normalizeEvaluationCohorts(evaluationCohorts, trainingRecords);
	const allBaseSizes = [...new Set([
		...normalizedBaseSizes,
		...normalizedSharedBaseSizes,
	])].sort((left, right) => left - right);
	const baseFits = new Map();
	const trainingBaseEncodings = new Map();
	for (const dictionarySize of allBaseSizes) {
		const fit = fitSphericalBaseDictionaryPrepared(
			training,
			dictionarySize,
			maxIterations,
		);
		baseFits.set(dictionarySize, fit);
		trainingBaseEncodings.set(
			dictionarySize,
			encodeBaseGainPrepared(training, fit.dictionary),
		);
	}
	const candidateRecords = [];
	for (const baseDictionarySize of normalizedBaseSizes) {
		const fit = baseFits.get(baseDictionarySize);
		const candidate = {
			candidateId: `base-gain-b${baseDictionarySize}`,
			codec: 'base-gain',
			parameters: {baseDictionarySize},
			dictionaries: {base: summarizeBaseFit(fit)},
			cohorts: [],
		};
		for (const cohort of cohorts) {
			const encoding = encodeBaseGainPrepared(cohort.prepared, fit.dictionary);
			const memory = calculateBaseGainMemory({
				sampleCount: cohort.prepared.count,
				baseDictionarySize,
			});
			candidate.cohorts.push(evaluateEncoding(
				cohort,
				encoding,
				materialFloor,
				memory,
				[fit.dictionaryHash],
			));
		}
		candidate.resultHash = combineHashes(candidate.cohorts.map(
			(value) => value.encoding.hashes.resultHash,
		));
		candidateRecords.push(candidate);
	}
	const deltaFitSummaries = [];
	for (const baseDictionarySize of normalizedSharedBaseSizes) {
		const baseFit = baseFits.get(baseDictionarySize);
		const trainingBaseEncoding = trainingBaseEncodings.get(baseDictionarySize);
		for (const bits of [8, 16]) {
			const candidate = {
				candidateId: `base-gain-direct-int${bits}-b${baseDictionarySize}`,
				codec: `base-gain-direct-int${bits}-residual`,
				parameters: {baseDictionarySize, bits},
				dictionaries: {base: summarizeBaseFit(baseFit)},
				cohorts: [],
			};
			for (const cohort of cohorts) {
				const baseEncoding = encodeBaseGainPrepared(
					cohort.prepared,
					baseFit.dictionary,
				);
				const encoding = encodeDirectResidualPrepared(
					cohort.prepared,
					baseFit.dictionary,
					baseEncoding.baseIds,
					bits,
				);
				const memory = calculateDirectResidualMemory({
					sampleCount: cohort.prepared.count,
					baseDictionarySize,
					bits,
				});
				candidate.cohorts.push(evaluateEncoding(
					cohort,
					encoding,
					materialFloor,
					memory,
					[baseFit.dictionaryHash],
				));
			}
			candidate.resultHash = combineHashes(candidate.cohorts.map(
				(value) => value.encoding.hashes.resultHash,
			));
			candidateRecords.push(candidate);
		}
		for (const deltaDictionarySize of normalizedDeltaSizes) {
			const deltaFit = fitSharedResidualDictionaryPrepared(
				training,
				baseFit.dictionary,
				trainingBaseEncoding.baseIds,
				deltaDictionarySize,
				maxIterations,
			);
			const summarizedDelta = summarizeDeltaFit(
				deltaFit,
				baseDictionarySize,
			);
			deltaFitSummaries.push(summarizedDelta);
			const candidate = {
				candidateId:
					`base-gain-shared-delta-b${baseDictionarySize}-d${deltaDictionarySize}`,
				codec: 'base-gain-shared-delta',
				parameters: {baseDictionarySize, deltaDictionarySize},
				dictionaries: {
					base: summarizeBaseFit(baseFit),
					delta: summarizedDelta,
				},
				cohorts: [],
			};
			for (const cohort of cohorts) {
				const baseEncoding = encodeBaseGainPrepared(
					cohort.prepared,
					baseFit.dictionary,
				);
				const encoding = encodeSharedDeltaPrepared(
					cohort.prepared,
					baseFit.dictionary,
					baseEncoding.baseIds,
					deltaFit.dictionary,
				);
				const memory = calculateSharedDeltaMemory({
					sampleCount: cohort.prepared.count,
					baseDictionarySize,
					deltaDictionarySize,
				});
				candidate.cohorts.push(evaluateEncoding(
					cohort,
					encoding,
					materialFloor,
					memory,
					[baseFit.dictionaryHash, deltaFit.dictionaryHash],
				));
			}
			candidate.resultHash = combineHashes(candidate.cohorts.map(
				(value) => value.encoding.hashes.resultHash,
			));
			candidateRecords.push(candidate);
		}
	}
	const sampleCounts = Object.fromEntries(
		cohorts.map(({id, prepared}) => [id, prepared.count]),
	);
	const memoryProjections = createMemoryProjections({
		sampleCounts,
		baseSizes: normalizedBaseSizes,
		sharedDeltaBaseSizes: normalizedSharedBaseSizes,
		sharedDeltaSizes: normalizedDeltaSizes,
	});
	const trainingIdentity = truthIdentity(training);
	const resultHash = combineHashes([
		trainingIdentity,
		...candidateRecords.map((candidate) => candidate.resultHash),
	]);
	return {
		schemaVersion: 'native15-base-gain-delta-study-v1',
		config: {
			channelCount: NATIVE15_CHANNEL_COUNT,
			baseSizes: normalizedBaseSizes,
			sharedDeltaBaseSizes: normalizedSharedBaseSizes,
			sharedDeltaSizes: normalizedDeltaSizes,
			maxIterations,
			materialFloor,
			dictionarySizesIncludeReservedZeroId: true,
			floatPolicy: 'truth, dictionaries, gains, scales, and decode operations are Float32',
		},
		training: {
			recordCount: training.count,
			exactZeroCount: training.exactZero.reduce((sum, value) => sum + value, 0),
			truthIdentity: trainingIdentity,
			baseDictionaries: allBaseSizes.map((size) =>
				summarizeBaseFit(baseFits.get(size))),
			deltaDictionaries: deltaFitSummaries,
		},
		candidateRecords,
		memoryProjections,
		resultHash,
		hashPolicy: 'FNV-1a-64, deterministic non-cryptographic study identity',
	};
}
