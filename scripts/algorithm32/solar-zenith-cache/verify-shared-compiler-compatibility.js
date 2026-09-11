import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import DistantSunSharedCacheGenerator from './DistantSunSharedCacheGenerator.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import DistantSunSharedCacheGenerationGraph from './DistantSunSharedCacheGenerationGraph.js';
import DistantSunSharedCacheGenerationCodec from './DistantSunSharedCacheGenerationCodec.js';
import {
	SHARED_PACKAGE_IDENTITY,
	SHARED_PACKAGE_REPORT,
	SHARED_PACKAGE_ROOT,
} from '../../../server/flat32/features/shared-cache/selection.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
const outputRoot = `tmp/algorithm32/point-local-cache-compiler/compatibility-${randomUUID()}`;
await files.directory(outputRoot);
const sourcePath = 'scripts/algorithm32/solar-zenith-cache/verify-shared-compiler-compatibility.js';
const source = await files.read(sourcePath);
const sourceArtifact = await files.write(`${outputRoot}/runner.js.txt`, source);
const cancellation = new AbortController();
const interrupt = () => cancellation.abort(new Error('Compiler compatibility verification interrupted.'));
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
try {
	const selectedRoot = path.relative(repositoryRoot, SHARED_PACKAGE_ROOT).split(path.sep).join('/');
	const graphReader = new DistantSunSharedCacheGenerationGraph();
	const selected = await graphReader.read({
		files,
		candidateRoot: selectedRoot,
		reportArtifact: SHARED_PACKAGE_REPORT,
		signal: cancellation.signal,
	});
	assert.equal(selected.report.packageSetIdentity, SHARED_PACKAGE_IDENTITY);
	const generated = await new DistantSunSharedCacheGenerator().run({
		chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		signal: cancellation.signal,
	});
	const candidate = await graphReader.read({
		files,
		candidateRoot: generated.publishedRoot,
		reportArtifact: {
			path: 'package-set.json',
			byteLength: (await files.read(`${generated.publishedRoot}/package-set.json`)).byteLength,
			sha256: generated.packageSetSha256,
		},
		signal: cancellation.signal,
	});
	assert.equal(candidate.blockIndex.blocks.length, selected.blockIndex.blocks.length);
	const codec = new DistantSunSharedCacheGenerationCodec();
	const blocks = [];
	for (const [ordinal, expected] of selected.blockIndex.blocks.entries()) {
		cancellation.signal.throwIfAborted();
		const actual = candidate.blockIndex.blocks[ordinal];
		assert.deepEqual(actual.coordinates, expected.coordinates);
		assert.deepEqual(actual.decoded, expected.decoded);
		const expectedBytes = await files.read(`${selectedRoot}/${expected.encoded.path}`, expected.encoded);
		const actualBytes = await files.read(`${generated.publishedRoot}/${actual.encoded.path}`, actual.encoded);
		assert.ok(actualBytes.equals(expectedBytes), `Compressed block ${ordinal} differs.`);
		const expectedDecoded = codec.decode(expectedBytes, expected.decoded.byteLength);
		const actualDecoded = codec.decode(actualBytes, actual.decoded.byteLength);
		assert.equal(files.hash(expectedDecoded), expected.decoded.sha256);
		assert.ok(actualDecoded.equals(expectedDecoded), `Decoded block ${ordinal} differs.`);
		blocks.push({ordinal, encoded: actual.encoded, decoded: actual.decoded});
	}
	const expectedDirection = selected.configuration.directionLayout.logicalToUniqueIndex;
	const actualDirection = candidate.configuration.directionLayout.logicalToUniqueIndex;
	assert.ok(
		(await files.read(`${selectedRoot}/${expectedDirection.path}`, expectedDirection)).equals(
			await files.read(`${generated.publishedRoot}/${actualDirection.path}`, actualDirection),
		),
	);
	assert.equal(candidate.scenes.length, selected.scenes.length);
	for (const [ordinal, expected] of selected.scenes.entries()) {
		const actual = candidate.scenes[ordinal];
		assert.deepEqual(actual.coordinates, expected.coordinates);
		assert.deepEqual(actual.ledger, expected.ledger);
		assert.deepEqual(actual.selection, expected.selection);
		assert.deepEqual(actual.reconstructedPayload, expected.reconstructedPayload);
	}
	assert.equal(files.hash(await files.read(sourcePath)), sourceArtifact.sha256);
	const result = {
		accepted: true,
		operation:
			'fresh complete Native15 GPU compilation; authenticated byte comparison of every encoded and decoded block and direction map; exact selection, ledger and all-scene payload identities',
		parent: {root: selectedRoot, report: SHARED_PACKAGE_REPORT},
		generated,
		implementation: sourceArtifact,
		tools: {node: process.version, zstandard: process.versions.zstd},
		sceneCount: candidate.scenes.length,
		blocks,
		direction: actualDirection,
		decodedBytes: blocks.reduce((sum, block) => sum + block.decoded.byteLength, 0),
		encodedBytes: blocks.reduce((sum, block) => sum + block.encoded.byteLength, 0),
	};
	const artifact = await files.write(`${outputRoot}/result.json`, Buffer.from(`${JSON.stringify(result)}\n`));
	await files.write(
		`${outputRoot}/sealed.json`,
		Buffer.from(`${JSON.stringify({accepted: true, result: artifact})}\n`),
	);
	process.stdout.write(`${JSON.stringify({outputRoot, result: artifact, accepted: true})}\n`);
} catch (error) {
	await files.write(
		`${outputRoot}/failure.json`,
		Buffer.from(`${JSON.stringify({accepted: false, error: String(error)})}\n`),
	);
	throw error;
} finally {
	process.removeListener('SIGINT', interrupt);
	process.removeListener('SIGTERM', interrupt);
}
