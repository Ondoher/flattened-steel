import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {scatterFragment, l1Fragment, transportFragment} from '../../orders/kernels.js';
import {createProductQuadrature} from '../../numerics/profile.js';
import {groundBoundaryScatterFragment, groundBoundaryReplacements, patchGroundBoundaryScatter} from './kernels.js';
import {groundBoundaryDigest, hashGroundBoundaryRows, groundBoundaryMemory} from './driver.js';

/** Check exact source edits, complete hash coverage and independent half-space algebra.
 * Manufactured angular values and row arrays query no physical medium or GPU.
 * @returns {Promise<SkyGroundBoundaryProof>} Actual focused local assertions.
 */
export async function groundBoundaryProof() {
	let checks = 0,
		maximumPackedRayleighDeviation = 0;
	const original = scatterFragment('// authenticated common placeholder', false),
		corrected = groundBoundaryScatterFragment('// authenticated common placeholder');
	let restored = corrected;
	for (const {original: anchor, replacement} of [...groundBoundaryReplacements].reverse()) {
		assert.equal(restored.split(replacement).length, 2);
		checks++;
		restored = restored.replace(replacement, anchor);
	}
	assert.equal(restored, original);
	checks++;
	assert.throws(() =>
		patchGroundBoundaryScatter(original.replace(groundBoundaryReplacements[0].original, 'missing')),
	);
	checks++;
	assert.throws(() => patchGroundBoundaryScatter(original + original));
	checks++;
	assert.throws(() => patchGroundBoundaryScatter(corrected));
	checks++;
	assert.ok(corrected.includes('positionIndex == 0 && incomingRecord.z < 0.0'));
	checks++;
	assert.ok(corrected.includes('SOURCE_IRRADIANCE * sourceTransmittance(point)'));
	checks++;
	assert.ok(!l1Fragment('', false).includes('boundaryDirectRadiance'));
	checks++;
	assert.ok(!transportFragment('', false).includes('boundaryDirectRadiance'));
	checks++;
	assert.equal(
		(transportFragment('', false).match(/radiance \+= transmittance \* irradiance \* GROUND_ALBEDO \/ PI/g) ?? [])
			.length,
		1,
	);
	checks++;
	assert.equal(
		await groundBoundaryDigest(new TextEncoder().encode('abc')),
		'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
	);
	checks++;
	const values = Float32Array.from({length: 24}, (_, index) => index + 0.5);
	/** @param {Float32Array} field - Manufactured four-column six-row texture.
	 * @returns {Promise<SkyGroundBoundaryFieldHash>} Complete selected-row manifest. */
	const hash = (field) =>
		hashGroundBoundaryRows(
			4,
			3,
			2,
			(firstRow, rowCount, target) => {
				target.set(field.subarray(firstRow * 4, (firstRow + rowCount) * 4));
			},
			async () => {},
		);
	const baseline = await hash(values),
		changedGround = values.slice();
	for (const index of [0, 1, 2, 3, 12, 13, 14, 15]) changedGround[index] += 2;
	assert.deepEqual(await hash(changedGround), baseline);
	checks++;
	assert.deepEqual(
		baseline.chunks.map((chunk) => [chunk.firstRow, chunk.rowCount]),
		[
			[1, 2],
			[4, 2],
		],
	);
	checks++;
	assert.equal(baseline.scalarCount, 16);
	checks++;
	assert.equal(baseline.maximumReadbackBytes, 32);
	checks++;
	for (const index of [4, 11, 16, 23]) {
		const changed = values.slice();
		changed[index] += 1;
		assert.notEqual((await hash(changed)).manifestSha256, baseline.manifestSha256);
		checks++;
	}
	const invalid = values.slice();
	invalid[4] = NaN;
	await assert.rejects(() => hash(invalid));
	checks++;
	await assert.rejects(() =>
		hashGroundBoundaryRows(
			1,
			1,
			1,
			() => {},
			async () => {},
		),
	);
	checks++;
	await assert.rejects(() =>
		hashGroundBoundaryRows(
			1024 ** 3,
			2,
			1,
			() => {},
			async () => {},
		),
	);
	checks++;
	const sentinel = new Error('Manufactured hash cancellation');
	await assert.rejects(
		() =>
			hashGroundBoundaryRows(
				4,
				3,
				2,
				(row, count, target) => target.fill(1),
				async () => {
					throw sentinel;
				},
			),
		(error) => error === sentinel,
	);
	checks++;
	for (const [positions, expected, alternate] of [
		[48, 186554880, 320025600],
		[55, 213760800, 366696000],
	]) {
		const memory = groundBoundaryMemory(4374, 512, positions * 180);
		assert.equal(memory.peakScalarBytes, expected);
		checks++;
		assert.equal(memory.simultaneousShadowBytes, alternate);
		checks++;
		assert.ok(memory.peakScalarBytes < 1024 ** 3 && memory.shadowReleasedBeforeCorrected);
		checks++;
	}
	assert.throws(() => groundBoundaryMemory(4374, 512, 1000000));
	checks++;
	const incoming = createProductQuadrature(16, 32);
	assert.equal(incoming.directionCount, 512);
	checks++;
	const outgoing = [
		[0, 0, 1],
		[0, 0, -1],
		[1, 0, 0],
		[Math.SQRT1_2, 0, Math.SQRT1_2],
	];
	const packed = incoming.unitVectors.map((vector) => vector.map(Math.fround)),
		weights = incoming.integrationWeightsSteradians.map(Math.fround),
		g = 0.8;
	const halfMie = [];
	for (const direction of outgoing) {
		let rayleigh = 0,
			mie = 0;
		for (let index = 0; index < packed.length; index++) {
			const vector = packed[index];
			if (!(vector[2] < 0)) continue;
			const cosine = Math.max(
				-1,
				Math.min(
					1,
					direction.reduce((sum, value, axis) => sum + value * vector[axis], 0),
				),
			);
			rayleigh += ((weights[index] * 3) / (16 * Math.PI)) * (1 + cosine * cosine);
			mie +=
				(((weights[index] * 3) / (8 * Math.PI)) * ((1 - g * g) / (2 + g * g)) * (1 + cosine * cosine)) /
				(1 + g * g - 2 * g * cosine) ** 1.5;
		}
		maximumPackedRayleighDeviation = Math.max(maximumPackedRayleighDeviation, Math.abs(rayleigh - 0.5));
		assert.ok(Math.abs(rayleigh - 0.5) <= 8 * 2 ** -24);
		checks++;
		assert.ok(mie > 0 && Number.isFinite(mie));
		checks++;
		halfMie.push(mie);
	}
	assert.ok(Math.abs(halfMie[0] - halfMie[1]) > 0.1);
	checks++;
	const albedo = 0.2,
		irradiance = 2,
		transmittance = 0.4,
		incidence = 0.3;
	const b0 = (albedo * irradiance * transmittance * incidence) / Math.PI;
	assert.ok(b0 > 0 && b0 < (albedo * irradiance * incidence) / Math.PI);
	checks++;
	assert.equal((albedo * irradiance * transmittance * Math.max(0, -incidence)) / Math.PI, 0);
	checks++;
	return {schemaId: 'sky-ground-boundary-proof-v1', checks, maximumPackedRayleighDeviation, gpuExecuted: false};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
	console.log(JSON.stringify(await groundBoundaryProof(), null, 2));
