import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createBrunetonProductionProfile} from '../../scripts/experiments/b1-directional-sky-radiance/production-profile.js';
import {DistantSunProfileCompilerInputs} from '../../scripts/algorithm32/production-b-experiments/DistantSunProfileCompilerInputs.js';
import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';
import ExperimentRun from './ExperimentRun.js';
import CompilerDerivation from './CompilerDerivation.js';
import GpuProofHost from './GpuProofHost.js';

const run = new ExperimentRun();
await run.start('direct40');
/** Currently open run-owned payload, closed on every terminal path. @type {SharedGenerationFileHandle | null} */
let output = null;
try {
	const root = 'tmp/extraterrestrial/production-color-reset/p8/c1-9-canonical-v8-assets-000001';
	const manifestHash = '7b5d94048dc51a45b42d3e5ed62f147b88578eeef372535dd6437d590660deb5';
	const setBytes = await run.read(`${root}/asset-set-manifest-${manifestHash}.json`);
	assert.equal(run.files.hash(setBytes), manifestHash);
	const set = JSON.parse(setBytes.toString('utf8'));
	const jobs = [];
	const manifests = [];
	for (const entry of set.assets) {
		const manifestBytes = await run.read(`${root}/${entry.manifestPath}`);
		assert.equal(run.files.hash(manifestBytes), entry.manifestSha256);
		const manifest = JSON.parse(manifestBytes.toString('utf8'));
		const base = `${root}/${path.posix.dirname(entry.manifestPath)}`;
		const evidenceIdentity = manifest.derivation.inputs.compilerEvidence;
		const evidence = JSON.parse(
			(await run.read(`${base}/${evidenceIdentity.path}`, evidenceIdentity)).toString('utf8'),
		);
		const profile = createBrunetonProductionProfile({
			time: entry.condition.localTime,
			fittedAzimuthDegrees: entry.condition.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
		});
		assert.equal(profile.contentHash, entry.profile.contentHash);
		const inputs = DistantSunProfileCompilerInputs.createInputSet(profile);
		assert.equal(CanonicalValueHash.sha256Value(inputs.buildRequest), evidence.buildRequestContentHash);
		const buildRequest = JSON.parse(
			JSON.stringify(inputs.buildRequest, (_key, value) =>
				ArrayBuffer.isView(value) ? Array.from(/** @type {Float64Array} */ (value)) : value,
			),
		);
		const rows = buildRequest.transportSpec.domains.position.nodes.map((node, altitudeIndex) => ({
			altitudeIndex,
			altitude: {value: node.altitudeMeters, units: 'meters'},
			firstSolarZenithIndex: 0,
			lastSolarZenithIndex: 0,
			firstPackedRow: altitudeIndex,
			packedRowCount: 1,
		}));
		jobs.push({
			id: entry.condition.id,
			buildRequest,
			ledger: {rows, retainedBlockCount: rows.length},
			wavelengths: buildRequest.transportSpec.domains.spectrum.channels.map((_channel, index) => index),
		});
		manifests.push({manifest, base});
	}
	await run.read('scripts/experiments/b1-directional-sky-radiance/production-profile.js');
	await run.read('scripts/algorithm32/production-b-experiments/DistantSunProfileCompilerInputs.js');
	await run.read('src/algorithm32/value-identity/CanonicalValueHash.js');
	const original = (
		await run.read('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js')
	).toString('utf8');
	const compiler = new CompilerDerivation().derive(original);
	await run.write('compiler.js', Buffer.from(compiler));
	await run.write('parameters.json', {
		jobs,
		parentSetIdentity: set.setIdentity,
		operation: 'retained GPU lifecycle with unchanged complete direct-40 numerical profiles and shader arithmetic',
		exact: true,
	});
	const sourceRoot = 'experiments/00000-shared-cache-calculation-reuse';
	const sources = new Map([
		['compiler.js', Buffer.from(compiler)],
		['RetainedGpuSession.js', await run.read(`${sourceRoot}/RetainedGpuSession.js`)],
		['browser.js', await run.read(`${sourceRoot}/browser.js`)],
	]);
	let nextJob = 0,
		nextChannel = 0;
	let expected, directionIndex, digest;
	const results = [];
	const acceptTile = async (jobIndex, channel, firstRow, bytes) => {
		assert.equal(jobIndex, nextJob);
		assert.equal(channel, nextChannel);
		assert.equal(firstRow, 0);
		const job = jobs[jobIndex];
		assert.equal(bytes.length, job.ledger.retainedBlockCount * 4374 * 4);
		const {manifest, base} = manifests[jobIndex];
		if (channel === 0) {
			expected = await run.read(
				`${base}/${manifest.cumulativeScatteringDensity.path}`,
				manifest.cumulativeScatteringDensity,
			);
			directionIndex = await run.read(
				`${base}/${manifest.logicalToUniqueIndex.path}`,
				manifest.logicalToUniqueIndex,
			);
			output = await run.files.create(`${run.root}/condition-${String(jobIndex).padStart(3, '0')}.f32`);
			digest = createHash('sha256');
		}
		const unique = Buffer.alloc(job.ledger.retainedBlockCount * 4058 * 4);
		for (let row = 0; row < job.ledger.retainedBlockCount; row++) {
			const seen = new Uint8Array(4058);
			for (let direction = 0; direction < 4374; direction++) {
				const index = directionIndex.readUInt16LE(direction * 2);
				assert.ok(index < 4058);
				const word = bytes.readUInt32LE((row * 4374 + direction) * 4);
				const offset = (row * 4058 + index) * 4;
				if (seen[index]) assert.equal(unique.readUInt32LE(offset), word);
				unique.writeUInt32LE(word, offset);
				seen[index] = 1;
			}
			assert.ok(seen.every(Boolean));
		}
		assert.ok(
			unique.equals(expected.subarray(channel * unique.length, (channel + 1) * unique.length)),
			`${job.id} wavelength ${channel} differs.`,
		);
		await output.writeFile(unique);
		digest.update(unique);
		nextChannel++;
		if (nextChannel === job.wavelengths.length) {
			await output.sync();
			await output.close();
			output = null;
			const sha256 = digest.digest('hex');
			assert.equal(sha256, manifest.cumulativeScatteringDensity.sha256);
			const artifact = {
				path: `${run.root}/condition-${String(jobIndex).padStart(3, '0')}.f32`,
				byteLength: expected.length,
				sha256,
			};
			run.artifacts.push(artifact);
			results.push({id: job.id, exact: true, artifact});
			nextJob++;
			nextChannel = 0;
			expected = null;
			run.progress({
				phase: 'exact-condition',
				completed: nextJob,
				total: jobs.length,
				message: `${job.id}: all 40 channels exactly match.`,
			});
		}
	};
	const abort = new AbortController();
	const interrupt = () => abort.abort(new Error('Interrupted by owner.'));
	process.once('SIGINT', interrupt);
	let gpu;
	try {
		gpu = await new GpuProofHost().run({
			run,
			jobs,
			sources,
			signal: abort.signal,
			acceptTile,
			maximumMilliseconds: 5400000,
		});
	} finally {
		process.removeListener('SIGINT', interrupt);
	}
	assert.equal(nextJob, jobs.length);
	assert.equal(nextChannel, 0);
	await run.write('gpu.json', gpu);
	await run.finish('accepted', {
		stage: 'E5',
		results,
		elapsedGpuMilliseconds: gpu.elapsedMilliseconds,
		stats: gpu.stats,
		benchmarkAcceptance: 'Unchanged and separately owned; this run proves optimization equivalence only.',
	});
} catch (error) {
	if (output) await output.close();
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
