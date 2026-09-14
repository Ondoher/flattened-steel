import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import {p2GpuViewFields, reconstructP2GpuViewDensity} from './DistantSunP2GpuViewInputs.js';

/** Authenticate the rejected shader proof and diagnose its largest positive N4 lookup residual.
 * This is an arithmetic diagnosis, never an alternative acceptance oracle.
 */
async function main() {
	const [parent, expectedSeal] = process.argv.slice(2);
	assert.ok(
		parent?.startsWith('tmp/production-algorithm32/distant-sun-strobing-promotion/p2-gpu-view-') &&
			/^[a-f0-9]{64}$/u.test(expectedSeal ?? ''),
		'Usage: DistantSunP2GpuViewFilterDiagnosis.js FAILED_LOOKUP_RUN SEALED_SHA256',
	);
	const files = new Files(fileURLToPath(new URL('../../../', import.meta.url)));
	const run = `tmp/production-algorithm32/distant-sun-strobing-promotion/p2-filter-diagnosis-${randomUUID()}`;
	await files.directory(run);
	const parents = [],
		sources = [],
		artifacts = [];
	/** Read exact ordinary bytes and retain the input identity. */
	const read = async (name, identity = null) => {
		const bytes = await files.read(name, identity, 256 * 1024 * 1024);
		parents.push({path: name, byteLength: bytes.length, sha256: files.hash(bytes)});
		return bytes;
	};
	/** Retain one new derived JSON artifact. */
	const write = async (name, value) => {
		const artifact = await files.write(`${run}/${name}`, Buffer.from(`${JSON.stringify(value)}\n`));
		artifacts.push(artifact);
		return artifact;
	};
	try {
		const queue = [
			'scripts/algorithm32/solar-zenith-cache/DistantSunP2GpuViewFilterDiagnosis.js',
			'package-lock.json',
		];
		const seen = new Set();
		while (queue.length) {
			const name = queue.shift();
			if (seen.has(name)) continue;
			seen.add(name);
			const bytes = await read(name);
			sources.push({path: name, byteLength: bytes.length, sha256: files.hash(bytes)});
			for (const match of bytes
				.toString('utf8')
				.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/gu))
				if (match[1].startsWith('.'))
					queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(name), match[1])));
		}
		const sealBytes = await read(`${parent}/sealed.json`);
		assert.equal(files.hash(sealBytes), expectedSeal);
		const seal = JSON.parse(sealBytes.toString('utf8'));
		assert.equal(seal.accepted, false, 'Diagnosis requires the retained failing shader proof.');
		/** Read one artifact authenticated by the rejected proof seal. */
		const artifact = async (name) => {
			const identity = seal.artifacts.find((candidate) => candidate.path === `${parent}/${name}`);
			assert.ok(identity, `Missing authenticated ${name}.`);
			return JSON.parse((await read(identity.path, identity)).toString('utf8'));
		};
		const definition = await artifact('definition.json');
		const result = await artifact('result.json');
		const failures = await artifact('failures-0-3.json');
		const worst = failures
			.filter((failure) => failure.actual >= 0 && failure.row >= 2)
			.sort((left, right) => right.error / right.limit - left.error / left.limit)[0];
		assert.ok(worst);
		const job = definition.control.batches[0].jobs[worst.jobIndex];
		const sampleIndex = worst.row - 2;
		const original = job.samples[sampleIndex];
		/** @type {P2GpuViewSample} */
		const input = {
			...original,
			direction: original.direction.map(Math.fround),
			zenith: Math.fround(original.zenith),
			altitudes: original.altitudes.map((altitude) => ({...altitude, weight: Math.fround(altitude.weight)})),
			altitude: Math.fround(original.altitude),
			step: Math.fround(original.step),
		};
		const matrixIdentity = result.parents.find((identity) => identity.path === `${definition.parent}/matrix.json`);
		const densityIdentity = result.parents.find(
			(identity) => identity.path === `${definition.parent}/native15/channel-07/gpu-density.f32`,
		);
		assert.ok(matrixIdentity && densityIdentity);
		/** @type {P2PhysicalMatrix} */
		const matrix = JSON.parse((await read(matrixIdentity.path, matrixIdentity)).toString('utf8'));
		const rayId = job.id.replace(/^(sunrise|sunset):q30:/u, '');
		const stencil = matrix.rays.find((ray) => ray.id === rayId).samples[sampleIndex].stencil;
		const values = p2GpuViewFields(await read(densityIdentity.path, densityIdentity), matrix.coordinates.length)[3];
		const exactUploadedInputReference = reconstructP2GpuViewDensity(input, stencil, values);
		const truncated = {
			...input,
			direction: input.direction.map((value, axis) => (axis === 0 ? value : Math.floor(value * 256) / 256)),
		};
		const truncatedFilterReference = reconstructP2GpuViewDensity(truncated, stencil, values);
		const diagnosis = {
			job: job.id,
			sampleIndex,
			channel: 7,
			order: 'cumulative-N4',
			physicalSample: original,
			uploadedInput: input,
			stencil,
			actual: worst.actual,
			originalReference: worst.reference,
			exactUploadedInputReference,
			inputConversionDelta: exactUploadedInputReference - worst.reference,
			truncatedFilterInput: truncated,
			truncatedFilterReference,
			idealFilterError: Math.abs(worst.actual - exactUploadedInputReference),
			truncatedFilterResidual: Math.abs(worst.actual - truncatedFilterReference),
			registeredLimit: worst.limit,
			inference:
				'The observed result agrees with truncating each direction fraction to eight bits. Input Float32 conversion alone does not explain the rejected lookup residual. This diagnostic approximation must not replace the full-precision fixed-policy oracle.',
			operation:
				'Authenticate failed proof and Float32 pure-density parents -> exact ordered Float32 N4 accumulation -> binary64 Hermite/altitude reconstruction using uploaded Float32 uniforms -> separately substitute floor(direction*256)/256 -> compare both with retained GPU readback',
			tools: {node: process.version},
			parents,
			sources,
		};
		await write('diagnosis.json', diagnosis);
		for (const source of sources) await files.read(source.path, source);
		await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted: true, artifacts})}\n`));
		process.stdout.write(
			`${JSON.stringify({run, idealFilterError: diagnosis.idealFilterError, truncatedFilterResidual: diagnosis.truncatedFilterResidual})}\n`,
		);
	} catch (error) {
		await write('failure.json', {error: String(error), parents, sources});
		await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted: false, artifacts})}\n`));
		throw error;
	}
}
await main();
