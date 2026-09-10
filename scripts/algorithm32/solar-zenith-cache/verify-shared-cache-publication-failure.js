import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import DistantSunSharedCacheGenerator from './DistantSunSharedCacheGenerator.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import DistantSunSharedCacheGenerationGraph from './DistantSunSharedCacheGenerationGraph.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
const cancellation = new AbortController();
process.once('SIGINT', () => cancellation.abort(new Error('Publication proof interrupted.')));
process.once('SIGTERM', () => cancellation.abort(new Error('Publication proof terminated.')));
let publishedRoot = '';

await assert.rejects(
	new DistantSunSharedCacheGenerator().run({
		chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		signal: cancellation.signal,
		onProgress: async (event) => {
			if (event.phase === 'publication-committed') {
				publishedRoot = String(event.publishedRoot);
				throw new Error('Injected failure after durable publication.');
			}
		},
	}),
	/publication completed.*final bookkeeping failed/u,
);
assert.ok(publishedRoot, 'The fault must occur after a real publication.');
const runRoot = path.posix.dirname(path.posix.dirname(publishedRoot));
const acceptance = JSON.parse((await files.read(`${runRoot}/acceptance.json`)).toString('utf8'));
const diagnosticBytes = await files.read(`${runRoot}/publication-bookkeeping-failure.json`);
const diagnostic = JSON.parse(diagnosticBytes.toString('utf8'));
assert.equal(diagnostic.published, true);
assert.equal(diagnostic.sealed, false);
assert.equal(diagnostic.publishedRoot, publishedRoot);
assert.equal(diagnostic.error, 'Injected failure after durable publication.');
assert.equal(
	JSON.parse((await files.read(`${runRoot}/progress.json`)).toString('utf8')).phase,
	'publication-bookkeeping-failed',
);
await assert.rejects(files.resolve(`${runRoot}/failure.json`), {code: 'ENOENT'});
await assert.rejects(files.resolve(`${runRoot}/sealed.json`), {code: 'ENOENT'});
const reportBytes = await files.read(`${publishedRoot}/package-set.json`);
const graph = await new DistantSunSharedCacheGenerationGraph().read({
	files,
	candidateRoot: publishedRoot,
	reportArtifact: {path: 'package-set.json', byteLength: reportBytes.byteLength, sha256: acceptance.packageSetSha256},
	signal: cancellation.signal,
});
assert.equal(graph.scenes.length, 109);
assert.equal(graph.metadataArtifactCount, 114);
const verifierParent = acceptance.parents.find(
	(parent) => parent.role === 'persisted-graph-and-all-control-verification',
);
const verification = JSON.parse(
	(await files.read(verifierParent.artifact.path, verifierParent.artifact)).toString('utf8'),
);
assert.equal(verification.accepted, true);
assert.equal(verification.scenes.length, 109);
assert.ok(verification.scenes.every((scene) => scene.exact));
const runnerPath = 'scripts/algorithm32/solar-zenith-cache/verify-shared-cache-publication-failure.js';
const runnerBytes = await files.read(runnerPath);
const proof = {
	schemaId: 'algorithm32-shared-cache-publication-fault-proof-v1',
	accepted: true,
	operation:
		'Inject observer rejection after durable publication; authenticate the complete published graph and exact verification; require explicit published/unsealed failure state.',
	parameters: {phase: 'publication-committed', sceneCount: 109, metadataArtifactCount: 114},
	implementation: {path: runnerPath, byteLength: runnerBytes.byteLength, sha256: files.hash(runnerBytes)},
	tools: {node: process.version},
	parents: [
		...acceptance.parents,
		{
			role: 'publication-failure',
			artifact: {
				path: `${runRoot}/publication-bookkeeping-failure.json`,
				byteLength: diagnosticBytes.byteLength,
				sha256: files.hash(diagnosticBytes),
			},
		},
		{
			role: 'published-package-root',
			artifact: {
				path: `${publishedRoot}/package-set.json`,
				byteLength: reportBytes.byteLength,
				sha256: files.hash(reportBytes),
			},
		},
	],
	publishedRoot,
	sealed: false,
};
const proofArtifact = await files.write(
	`${runRoot}/publication-fault-proof.json`,
	Buffer.from(`${JSON.stringify(proof)}\n`),
);
process.stdout.write(`${JSON.stringify({accepted: true, proofArtifact})}\n`);
