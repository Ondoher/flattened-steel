import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import Service from '../../../server/flat32/features/shared-cache/DistantSunSharedCachePackageService.js';
import {
	SHARED_PACKAGE_IDENTITY,
	SHARED_PACKAGE_REPORT,
	SHARED_PACKAGE_ROOT,
} from '../../../server/flat32/features/shared-cache/selection.js';

const repository = fileURLToPath(new URL('../../../', import.meta.url));
const files = new Files(repository);
const parent = `tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-09-12T00-24-02-253Z-703e6867-62cf-43b2-a2e0-faa218aaa9a2/published/${SHARED_PACKAGE_IDENTITY}`;
const output = path.relative(repository, SHARED_PACKAGE_ROOT).split(path.sep).join('/');
const run = `tmp/production-algorithm32/distant-sun-shared-block-cache/qualification/${new Date().toISOString().replace(/[:.]/gu, '-')}-${randomUUID()}`;
await files.directory(run);
const source = await new Service(await files.resolve(parent)).load(SHARED_PACKAGE_REPORT);
const artifacts = [];
let alreadyPublished = false;
try {
	await files.resolve(`${output}/package-set.json`);
	alreadyPublished = true;
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
// The authenticated report is the publication marker and is written only after every other file verifies.
const identities = [...source._files.values()].sort(
	(a, b) => Number(a.path === 'package-set.json') - Number(b.path === 'package-set.json'),
);
for (const identity of identities) {
	const bytes = await files.read(`${parent}/${identity.path}`, identity, 32 * 1024 * 1024);
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
const deployed = await new Service(await files.resolve(output)).load(SHARED_PACKAGE_REPORT);
const selection = deployed.resolve(90, '/flat32/scene-caches/');
if (
	selection.status !== 'ready' ||
	selection.cacheFormat !== 'algorithm32-distant-sun-shared-block-v1' ||
	selection.asset.packageSetIdentity !== SHARED_PACKAGE_IDENTITY
)
	throw new Error('Deployed identity differs from qualification.');
const sourceBytes = await files.read('scripts/algorithm32/solar-zenith-cache/publish-shared-runtime.js');
const result = {
	accepted: true,
	parent,
	report: SHARED_PACKAGE_REPORT,
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
