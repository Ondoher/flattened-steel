import path from 'node:path';
import {StrobingRun} from './StrobingRun.js';

const ids = process.argv.slice(2);
if (!ids.length || ids.some((id) => !/^\d{5}-[a-z][a-z0-9-]{0,15}$/u.test(id)))
	throw new Error('Supply sealed experiment run identifiers to verify read-only.');
const run = await StrobingRun.allocate('final-verifier');
try {
	const verified = [];
	for (const [index, id] of ids.entries()) {
		await run.progress({
			phase: 'verify-run',
			completed: index,
			total: ids.length,
			message: `Authenticating sealed ${id}.`,
		});
		const directory = await StrobingRun.checkedPath(
			StrobingRun.repositoryRoot,
			`${StrobingRun.outputRelative}/runs/${id}`,
		);
		const manifest = /** @type {StrobingParentManifest} */ (
			await StrobingRun.readJson(directory, 'artifact-manifest.json')
		);
		const inventory = await StrobingRun.inventory(directory, manifest.excludedPaths);
		if (
			inventory.artifactSetSha256 !== manifest.artifactSetSha256 ||
			JSON.stringify(inventory.artifacts) !== JSON.stringify(manifest.artifacts)
		)
			throw new Error(`Sealed artifact inventory mismatch: ${id}`);
		verified.push({
			id,
			artifactSetSha256: inventory.artifactSetSha256,
			artifactCount: inventory.artifacts.length,
			manifest: await StrobingRun.identity(directory, 'artifact-manifest.json'),
		});
	}
	const historical = [];
	for (const id of ['1788974488678-creative-animation', '1789171222384-creative-strobing-diagnosis']) {
		const pinned = /** @type {StrobingPinnedParent} */ (
			await StrobingRun.readJson(
				StrobingRun.repositoryRoot,
				`${StrobingRun.outputRelative}/runs/00000-pin-control/parent-${id}.json`,
			)
		);
		const directory = await StrobingRun.checkedPath(StrobingRun.repositoryRoot, pinned.sourceRoot);
		const actual = await StrobingRun.inventory(directory, pinned.manifest.excludedPaths);
		if (
			actual.artifactSetSha256 !== pinned.manifest.artifactSetSha256 ||
			JSON.stringify(actual.artifacts) !== JSON.stringify(pinned.manifest.artifacts)
		)
			throw new Error(`Historical parent changed: ${id}`);
		historical.push({id, artifactSetSha256: actual.artifactSetSha256, unchanged: true});
	}
	await run.writeJson('exclusive-proof.json', {value: 'preserve-original-bytes'});
	const before = await StrobingRun.identity(run.directory, 'exclusive-proof.json');
	let duplicateRejected = false,
		traversalRejected = false,
		readEscapeRejected = false;
	try {
		await run.writeJson('exclusive-proof.json', {value: 'replacement'});
	} catch (error) {
		duplicateRejected = error.code === 'EEXIST';
	}
	try {
		await run.writeJson('../escaped-proof.json', {});
	} catch {
		traversalRejected = true;
	}
	try {
		await StrobingRun.checkedPath(run.directory, '..');
	} catch {
		readEscapeRejected = true;
	}
	if (
		!duplicateRejected ||
		!traversalRejected ||
		!readEscapeRejected ||
		(await StrobingRun.identity(run.directory, 'exclusive-proof.json')).sha256 !== before.sha256
	)
		throw new Error('Exclusive-write or containment cleanup proof failed.');
	await run.writeJson('verification.json', {
		verified,
		historical,
		cleanup: {duplicateRejected, traversalRejected, readEscapeRejected, originalBytesPreserved: true},
	});
	await run.writeJson('provenance.json', {
		operation:
			'Read-only recomputation of every selected sealed manifest; isolated new-run duplicate-write and path-escape rejection proofs.',
		implementation: await StrobingRun.identity(
			StrobingRun.repositoryRoot,
			'experiments/distant-sun-recording-strobing/verify-evidence.js',
		),
		runImplementation: await StrobingRun.identity(
			StrobingRun.repositoryRoot,
			'experiments/distant-sun-recording-strobing/StrobingRun.js',
		),
		node: process.version,
		verificationArtifact: 'verification.json',
		scope: ids.map((id) => path.posix.join(StrobingRun.outputRelative, 'runs', id)),
	});
	await run.finish('accepted', {
		purpose: 'read-only-sealed-evidence-verification',
		verifiedRuns: ids.length,
		cleanupPass: true,
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
