import assert from 'node:assert/strict';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as domain} from '../../../src/algorithm32/sampling-domains/index.js';
import PacketLayout from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePacketLayout.js';
import {DistantSunSolarInterpolation} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';

/** Canonical representative used only for exact packet-bit verification. */
const firstLogicalByUnique = new Uint16Array(domain.uniqueDirectionCount).fill(65535);
for (const [logical, unique] of domain.logicalToUniqueDirectionIndices.entries())
	if (firstLogicalByUnique[unique] === 65535) firstLogicalByUnique[unique] = logical;

/** Sparse row indexes avoid scanning the entire matrix for every packet layer.
 * @type {WeakMap<P2PhysicalMatrix, Map<string, number[]>>}
 */
const coordinateRows = new WeakMap();

/** Index immutable parent coordinates once without changing their declared order.
 * @param {P2PhysicalMatrix} matrix - Authenticated physical coordinate inventory.
 * @returns {Map<string, number[]>} - Source indexes grouped by physical row.
 */
function coordinatesByRow(matrix) {
	if (!coordinateRows.has(matrix)) {
		const rows = new Map();
		for (const [index, coordinate] of matrix.coordinates.entries()) {
			const key = `${coordinate.position}:${coordinate.zenith}`;
			const entries = rows.get(key) ?? [];
			entries.push(index);
			rows.set(key, entries);
		}
		coordinateRows.set(matrix, rows);
	}
	return coordinateRows.get(matrix);
}

/** Resolve the continuous face coordinate from the complete executable bilinear stencil.
 * @param {P2PhysicalStencil} stencil - Physical matrix lookup support.
 * @returns {number[]} - Face index and continuous u/v node coordinates.
 */
function directionCoordinate(stencil) {
	const face = domain.unflattenNodeIndex(stencil.directionIndices[0]).faceIndex;
	let u = 0,
		v = 0;
	for (const [ordinal, logical] of stencil.directionIndices.entries()) {
		const address = domain.unflattenNodeIndex(logical);
		assert.equal(address.faceIndex, face, 'A production bilinear stencil must occupy one face.');
		u += stencil.directionWeights[ordinal] * address.uIndex;
		v += stencil.directionWeights[ordinal] * address.vIndex;
	}
	return [face, u, v];
}

/** Convert one physical matrix point into explicit production shader coordinates.
 * @param {P2PhysicalStencil} stencil - Complete physical support.
 * @param {number} altitude - Physical midpoint height in metres.
 * @param {number} step - Physical interval length in metres; zero for point lookups.
 * @returns {P2GpuViewSample} - Browser input without an inferred geometry change.
 */
function sampleInput(stencil, altitude, step) {
	return {
		direction: directionCoordinate(stencil).map(Math.fround),
		zenith: Math.fround(stencil.solarIndices[1] + stencil.solarFraction),
		altitudes: stencil.positionIndices.map((index, ordinal) => ({
			index,
			weight: Math.fround(ordinal === 0 ? 1 - stencil.positionFraction : stencil.positionFraction),
		})),
		altitude: Math.fround(altitude),
		step: Math.fround(step),
	};
}

/** Reconstruct the same field using the exact Float32 coordinates uploaded to WebGL.
 * This retains full bilinear precision; hardware filtering truncation is not incorporated into the oracle.
 * @param {P2GpuViewSample} sample - Actual uploaded lookup uniforms.
 * @param {P2PhysicalStencil} stencil - Authenticated cell identities corresponding to these coordinates.
 * @param {Float32Array} values - One selected order of the authenticated Float32 field.
 * @returns {number} - Binary64 arithmetic over identical shader inputs.
 */
export function reconstructP2GpuViewDensity(sample, stencil, values) {
	const lower = Math.min(Math.floor(sample.zenith), 178);
	assert.equal(lower, stencil.solarIndices[1], 'Float32 solar input requires unprovided interval support.');
	const weights = stencil.directionIndices.map((logical) => {
		const address = domain.unflattenNodeIndex(logical);
		return (
			Math.max(0, 1 - Math.abs(address.uIndex - sample.direction[1])) *
			Math.max(0, 1 - Math.abs(address.vIndex - sample.direction[2]))
		);
	});
	assert.ok(
		Math.abs(weights.reduce((sum, value) => sum + value, 0) - 1) < 1e-12,
		'Float32 direction input escaped its authenticated bilinear support.',
	);
	return stencil.indices.reduce((sum, solar, altitude) => {
		const knots = solar.map((directions) =>
			directions.reduce((value, index, ordinal) => value + weights[ordinal] * values[index], 0),
		);
		return (
			sum +
			sample.altitudes[altitude].weight *
				DistantSunSolarInterpolation.sample(
					stencil.firstSolarInterval ? undefined : knots[0],
					knots[1],
					knots[2],
					stencil.lastSolarInterval ? undefined : knots[3],
					sample.zenith - lower,
				)
		);
	}, 0);
}

/** Integrate in binary64 using the same Float32 geometry and medium uniforms consumed by the shader.
 * @param {P2GpuViewPreparedJob} prepared - Ordered midpoint samples and source-cell identities.
 * @param {Float32Array} values - Authenticated Float32 scattering-density field.
 * @param {P2GpuViewControl} control - Exact uploaded atmosphere coefficients and scale heights.
 * @param {number} channel - Native15 wavelength index.
 * @returns {{radiance: number; transmittance: number}} - Matched atmospheric-path result.
 */
export function integrateP2GpuViewJob(prepared, values, control, channel) {
	let radiance = 0,
		transmittance = 1;
	for (const [index, sample] of prepared.job.samples.entries()) {
		const density = reconstructP2GpuViewDensity(sample, prepared.stencils[index], values);
		const extinction =
			control.rayleigh[channel] * Math.exp(-sample.altitude / control.rayleighScaleHeight) +
			control.mie[channel] * Math.exp(-sample.altitude / control.mieScaleHeight);
		const halfStep = Math.exp(-0.5 * extinction * sample.step);
		transmittance *= halfStep;
		radiance += transmittance * density * sample.step;
		transmittance *= halfStep;
	}
	return {radiance, transmittance};
}

/** Build complete point/Q30 jobs in both physical angular traversals, bounded by eight packet layers.
 * @param {P2PhysicalMatrix} matrix - Authenticated physical query inventory.
 * @returns {P2GpuViewPreparedBatch[]} - Every query and nonempty/empty atmospheric ray, without dropped dark rays.
 */
export function prepareP2GpuViewBatches(matrix) {
	/** @type {P2GpuViewPreparedJob[]} */ const jobs = [];
	const raysByQuery = new Map(matrix.rays.map((ray, index) => [ray.queryIndex, {ray, index}]));
	for (const traversal of /** @type {const} */ (['sunset', 'sunrise']))
		for (const queryIndex of matrix.traversals[traversal]) {
			const query = matrix.queries[queryIndex];
			jobs.push({
				queryIndex,
				rayIndex: null,
				traversal,
				stencils: [query.stencil],
				job: {
					id: `${traversal}:point:${query.id}`,
					integrate: false,
					samples: [sampleInput(query.stencil, query.heightMeters, 0)],
				},
			});
			const entry = raysByQuery.get(queryIndex);
			if (entry)
				jobs.push({
					queryIndex,
					rayIndex: entry.index,
					traversal,
					stencils: entry.ray.samples.map((sample) => sample.stencil),
					job: {
						id: `${traversal}:q30:${query.id}`,
						integrate: true,
						samples: entry.ray.samples.map((sample) =>
							sampleInput(sample.stencil, sample.heightMeters, sample.stepMeters),
						),
					},
				});
		}
	/** @type {P2GpuViewPreparedBatch[]} */ const batches = [];
	/** @type {P2GpuViewPreparedJob[]} */ let current = [];
	let rows = new Set();
	for (const prepared of jobs) {
		const required = new Set(
			prepared.stencils.flatMap((stencil) =>
				stencil.positionIndices.flatMap((position) =>
					stencil.solarIndices.map((zenith) => `${position}:${zenith}`),
				),
			),
		);
		assert.ok(required.size <= 512, 'One Q30 ray exceeds the bounded staging capacity.');
		const union = new Set([...rows, ...required]);
		if (current.length && (union.size > 512 || current.length >= 400)) {
			batches.push({jobs: current, rows: [...rows]});
			current = [];
			rows = new Set();
		}
		current.push(prepared);
		for (const row of required) rows.add(row);
	}
	if (current.length) batches.push({jobs: current, rows: [...rows]});
	return batches;
}

/** Construct the four selected density fields using production Float32 accumulation order.
 * @param {Buffer} bytes - Authenticated pure J1/J2/J3/J4 values in field-major order.
 * @param {number} count - Authenticated sparse coordinate count.
 * @returns {Float32Array[]} - Pure N1/N2/N3 and cumulative N4 arrays.
 */
export function p2GpuViewFields(bytes, count) {
	assert.equal(bytes.byteLength, count * 4 * 4);
	const pure = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
	assert.ok(
		pure.every((value) => Number.isFinite(value) && value >= 0),
		'Parent density field is invalid.',
	);
	const fields = [pure.subarray(0, count), pure.subarray(count, 2 * count), pure.subarray(2 * count, 3 * count)];
	const cumulative = new Float32Array(count);
	for (let index = 0; index < count; index++)
		cumulative[index] = Math.fround(
			Math.fround(Math.fround(pure[index] + pure[count + index]) + pure[2 * count + index]) +
				pure[3 * count + index],
		);
	return [...fields, cumulative];
}

/** Stage exact sparse coordinate values through the production packet encoder.
 * Missing consumed support and inconsistent seam aliases reject before any GPU execution.
 * @param {P2PhysicalMatrix} matrix - Authenticated coordinate and stencil inventory.
 * @param {P2GpuViewPreparedBatch} batch - Complete rows needed by this draw batch.
 * @param {Float32Array[][]} fields - Channel then order, on the matrix coordinate inventory.
 * @param {number} order - Selected pure or cumulative order index.
 * @param {number} layer - Zero-based layer of at most eight in this batch.
 * @param {(bytes: Uint8Array) => string} hash - Exact byte identity function.
 * @returns {Float32Array} - Populated rows of one production RGBA32F packet layer.
 */
export function packP2GpuViewLayer(matrix, batch, fields, order, layer, hash) {
	const rows = batch.rows.slice(layer * 64, (layer + 1) * 64);
	const rowMap = new Map(rows.map((row, index) => [row, index]));
	const source = new Float32Array(15 * rows.length * domain.uniqueDirectionCount);
	const supplied = new Set();
	const directionMap = domain.logicalToUniqueDirectionIndices;
	for (const coordinateIndex of rows.flatMap((row) => coordinatesByRow(matrix).get(row) ?? [])) {
		const coordinate = matrix.coordinates[coordinateIndex];
		const row = rowMap.get(`${coordinate.position}:${coordinate.zenith}`);
		if (row === undefined) continue;
		const unique = directionMap[coordinate.direction];
		const key = `${row}:${unique}`;
		for (let channel = 0; channel < 15; channel++) {
			const index = (channel * rows.length + row) * domain.uniqueDirectionCount + unique;
			const value = fields[channel][order][coordinateIndex];
			if (supplied.has(key))
				assert.equal(source[index], value, 'Canonical seam aliases differ before packet staging.');
			source[index] = value;
		}
		supplied.add(key);
	}
	for (const prepared of batch.jobs)
		for (const stencil of prepared.stencils)
			for (const position of stencil.positionIndices)
				for (const zenith of stencil.solarIndices) {
					const row = rowMap.get(`${position}:${zenith}`);
					if (row === undefined) continue;
					for (const logical of stencil.directionIndices)
						assert.ok(
							supplied.has(`${row}:${directionMap[logical]}`),
							'A consumed direction cell lacks parent evidence.',
						);
				}
	const packet = new PacketLayout().pack({
		logicalBlockId: `p2-proof:${order}:${layer}`,
		decodedSha256: hash(new Uint8Array(source.buffer)),
		logicalToUniqueIndexSha256: hash(new Uint8Array(directionMap.buffer)),
		blockRowCount: rows.length,
		decodedValues: source,
		logicalToUniqueIndex: directionMap,
	});
	const inputBits = new Uint32Array(source.buffer),
		packedBits = new Uint32Array(packet.values.buffer);
	const layout = new PacketLayout();
	for (const key of supplied) {
		const [row, unique] = key.split(':').map(Number);
		const logical = firstLogicalByUnique[unique];
		for (let channel = 0; channel < 15; channel++) {
			const destination = layout.resolveDestination(channel, row, logical, 0);
			assert.equal(
				packedBits[(destination.y * packet.storage.width + destination.x) * 4 + destination.component],
				inputBits[(channel * rows.length + row) * domain.uniqueDirectionCount + unique],
				'Packet staging changed Float32 bits.',
			);
		}
	}
	return packet.values.subarray(0, rows.length * domain.faceWidth * packet.storage.width * 4);
}
