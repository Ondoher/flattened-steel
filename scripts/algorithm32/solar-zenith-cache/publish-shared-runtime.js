import {randomUUID} from 'node:crypto';

/** Production publication entry. Explicit pinned candidates may be staged with --prepare=true before deployment approval. */
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import {DistantSunSharedCachePackageService as Service} from '../../../server/flat32/features/shared-cache/index.js';
import Graph from './DistantSunSharedCacheGenerationGraph.js';
import {
	SHARED_PACKAGE_IDENTITY,
	SHARED_PACKAGE_REPORT,
} from '../../../server/flat32/features/shared-cache/selection.js';

const repository = fileURLToPath(new URL('../../../', import.meta.url));
const files = new Files(repository);
const argumentsByName = new Map(
	process.argv.slice(2).map(
		/** Called by CLI ingress to admit supported named publication arguments. */ (value) => {
			const match =
				/^--(source-root|source-package|package-identity|report-sha256|report-bytes|task-root|prepare)=(.+)$/u.exec(
					value,
				);
			if (!match) throw new RangeError('Unsupported shared publication argument.');
			return [match[1], match[2]];
		},
	),
);
if (argumentsByName.size !== process.argv.length - 2) throw new RangeError('Duplicate publication argument.');
const selectedIdentity = argumentsByName.get('package-identity') ?? SHARED_PACKAGE_IDENTITY;
if (!/^[a-f0-9]{64}$/u.test(selectedIdentity)) throw new RangeError('Invalid publication package identity.');
const taskRoot = argumentsByName.get('task-root') ?? '.codex-tmp/shared-runtime-publication';
if (!/^\.codex-tmp\/[A-Za-z0-9_-]+$/u.test(taskRoot))
	throw new RangeError('Publication output requires a contained task root.');
const prepare = argumentsByName.get('prepare');
if (prepare !== undefined && prepare !== 'true') throw new RangeError('Preparation must explicitly select true.');
const parent =
	argumentsByName.get('source-package') ??
	`tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-09-12T00-24-02-253Z-703e6867-62cf-43b2-a2e0-faa218aaa9a2/published/${SHARED_PACKAGE_IDENTITY}`;
const sourceFiles = new Files(path.resolve(repository, argumentsByName.get('source-root') ?? '.'));
const reportIdentity = argumentsByName.size
	? {
			path: 'package-set.json',
			byteLength: Number(argumentsByName.get('report-bytes')),
			sha256: argumentsByName.get('report-sha256') ?? '',
		}
	: SHARED_PACKAGE_REPORT;
if (
	!Number.isSafeInteger(reportIdentity.byteLength) ||
	reportIdentity.byteLength < 1 ||
	!/^[a-f0-9]{64}$/u.test(reportIdentity.sha256 ?? '')
)
	throw new RangeError('Publication requires an exact trusted report identity.');
const output = prepare
	? `${taskRoot}/staged/${selectedIdentity}`
	: `server/flat32/data/shared-block/${selectedIdentity}`;
const run = `${taskRoot}/runs/${new Date().toISOString().replace(/[:.]/gu, '-')}-${randomUUID()}`;
await files.directory(run);
const graph = await new Graph().read({
	files: sourceFiles,
	candidateRoot: parent,
	reportArtifact: reportIdentity,
	signal: new AbortController().signal,
});
if (graph.report.packageSetIdentity !== selectedIdentity)
	throw new Error('Publication source differs from qualified identity.');
let artifacts = [];
let alreadyPublished = false;
try {
	await files.resolve(`${output}/package-set.json`);
	alreadyPublished = true;
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
// The authenticated report is the publication marker and is written only after every other file verifies.
const identities = [
	reportIdentity,
	...graph.report.configurations,
	graph.report.runtimeCatalog,
	graph.configuration.blockIndex,
	graph.configuration.directionLayout.logicalToUniqueIndex,
	...graph.catalog.scenes.map((scene) => scene.manifest),
	...graph.blockIndex.blocks.map((block) => block.encoded),
].sort((a, b) => Number(a.path === 'package-set.json') - Number(b.path === 'package-set.json'));
for (const identity of identities) {
	const bytes = await sourceFiles.read(`${parent}/${identity.path}`, identity, 32 * 1024 * 1024);
	if (!alreadyPublished) await files.directory(path.posix.dirname(`${output}/${identity.path}`));
	try {
		await files.read(`${output}/${identity.path}`, identity, 32 * 1024 * 1024);
	} catch (error) {
		if (alreadyPublished || error.code !== 'ENOENT') throw error;
		await files.write(`${output}/${identity.path}`, bytes);
	}
	await files.read(`${output}/${identity.path}`, identity, 32 * 1024 * 1024);
	artifacts.push(identity);
}
const deployed = await new Service(await files.resolve(output)).load(reportIdentity);
const selection = deployed.resolve(90, '/flat32/scene-caches/');
if (
	selection.status !== 'ready' ||
	selection.cacheFormat !== 'algorithm32-distant-sun-shared-block-v1' ||
	selection.asset.packageSetIdentity !== selectedIdentity
)
	throw new Error('Deployed identity differs from qualification.');
const sourceBytes = await files.read('scripts/algorithm32/solar-zenith-cache/publish-shared-runtime.js');
const result = {
	accepted: true,
	parent,
	report: reportIdentity,
	sourceRoot: path.resolve(repository, argumentsByName.get('source-root') ?? '.'),
	prepare: Boolean(prepare),
	output,
	alreadyPublished,
	operation:
		'verify sealed publication read-only, or copy exclusively and publish report last after complete SHA-256 verification',
	implementation: files.hash(sourceBytes),
	node: process.version,
	bytes: artifacts.reduce((sum, item) => sum + item.byteLength, 0),
	artifacts,
};
console.log(
	JSON.stringify(await files.write(`${run}/result.json`, Buffer.from(JSON.stringify(result, null, 2) + '\n'))),
);
