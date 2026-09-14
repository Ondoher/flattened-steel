import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {lstat, mkdir, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createNativeProductionProfile} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import {loadKiderDataset} from '../../experiments/b1-directional-sky-radiance/benchmark.js';
import {
	SHARED_PACKAGE_IDENTITY,
	SHARED_PACKAGE_REPORT,
} from '../../../server/flat32/features/shared-cache/selection.js';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import {DistantSunSceneCacheCompilerInputs} from './DistantSunSceneCacheCompilerInputs.js';
import {DistantSunPointLocalProfileCompilerInputs} from './DistantSunPointLocalProfileCompilerInputs.js';

const repository = fileURLToPath(new URL('../../../', import.meta.url));
const files = new Files(repository);
const outputRoot = 'tmp/production-algorithm32/distant-sun-strobing-promotion';
const run = `${outputRoot}/p0-${randomUUID()}`;
const artifacts = [];
const parents = [];
let phase = 'initialize';

/** Identify one ordinary input without allocating its complete contents.
 * @param {string} relativePath - Repository-relative input.
 * @returns {Promise<DistantSunSharedCacheFileIdentity>} - Streamed SHA-256 identity.
 */
async function identify(relativePath) {
	const absolute = await files.resolve(relativePath);
	const facts = await lstat(absolute);
	assert.ok(facts.isFile());
	const hash = createHash('sha256');
	for await (const chunk of createReadStream(absolute)) hash.update(chunk);
	return {path: relativePath, byteLength: facts.size, sha256: hash.digest('hex')};
}

/** Read and pin a bounded JSON parent.
 * @param {string} relativePath - Repository-relative JSON input.
 * @returns {Promise<Record<string, unknown>>} - JSON object; consumers validate fields before use.
 */
async function readParent(relativePath) {
	const bytes = await files.read(relativePath);
	parents.push({path: relativePath, byteLength: bytes.length, sha256: files.hash(bytes)});
	const value = /** @type {unknown} */ (JSON.parse(bytes.toString()));
	assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), 'Parent JSON must be an object.');
	return /** @type {Record<string, unknown>} */ (value);
}

/** Write an exclusive derived artifact.
 * @param {string} name - New basename.
 * @param {unknown} value - Complete JSON value.
 * @returns {Promise<void>} - Rejects on an unsafe or existing destination.
 */
async function write(name, value) {
	artifacts.push(await files.write(`${run}/${name}`, Buffer.from(`${JSON.stringify(value, null, 2)}\n`)));
}

/** Independently authenticate the complete declared inventory of a sealed parent.
 * @param {string} root - Repository-relative evidence root.
 * @param {string | undefined} expectedSet - Previously pinned set identity, when present.
 * @returns {Promise<unknown>} - Authentication result and manifest identity.
 */
async function authenticate(root, expectedSet = undefined) {
	phase = `authenticate:${root}`;
	const manifest = await readParent(`${root}/artifact-manifest.json`);
	assert.equal(manifest.state, 'accepted');
	assert.ok(Array.isArray(manifest.artifacts) && Array.isArray(manifest.excludedPaths));
	const excludedPaths = manifest.excludedPaths;
	assert.equal(files.hash(JSON.stringify(manifest.artifacts)), manifest.artifactSetSha256);
	if (expectedSet) assert.equal(manifest.artifactSetSha256, expectedSet);
	const actual = [];
	/** Visit every ordinary file, preserving the parent's declared inventory order.
	 * @param {string} relative - Parent-relative directory.
	 * @returns {Promise<void>} - Rejects for aliases or unexpected identities.
	 */
	async function visit(relative) {
		for (const name of (await readdir(await files.resolve(relative ? `${root}/${relative}` : root))).sort()) {
			const child = relative ? `${relative}/${name}` : name;
			if (excludedPaths.includes(child)) continue;
			const absolute = await files.resolve(`${root}/${child}`);
			if ((await lstat(absolute)).isDirectory()) await visit(child);
			else actual.push({...(await identify(`${root}/${child}`)), path: child});
		}
	}
	await visit('');
	assert.deepEqual(actual, manifest.artifacts, `Sealed evidence changed: ${root}`);
	return {root, artifactSetSha256: manifest.artifactSetSha256, artifactCount: actual.length};
}

/** Run an unchanged positive control and retain its complete output and exit status.
 * @param {string} name - Result identity.
 * @param {string[]} argumentsList - Arguments passed directly to Node without a shell.
 * @returns {Promise<void>} - Rejects when the control fails.
 */
async function control(name, argumentsList) {
	phase = `control:${name}`;
	const child = spawn(process.execPath, argumentsList, {cwd: repository, windowsHide: true});
	let output = '';
	child.stdout.on('data', (chunk) => {
		output += chunk;
	});
	child.stderr.on('data', (chunk) => {
		output += chunk;
	});
	const code = await new Promise((resolve, reject) => {
		child.once('error', reject);
		child.once('close', resolve);
	});
	await write(`${name}.json`, {command: [process.execPath, ...argumentsList], code, output});
	assert.equal(code, 0, `Unchanged control failed: ${name}`);
}

assert.equal(process.argv.length, 3, 'Supply the captured review baseline as the sole argument.');
await files.directory(outputRoot);
await mkdir(path.join(await files.resolve(outputRoot), path.posix.basename(run)));
await files.resolve(run);
const heartbeat = setInterval(() => process.stdout.write(`${JSON.stringify({run, phase})}\n`), 25_000);
try {
	const baseline = await readParent(process.argv[2]);
	await write('review-unit.json', {
		baseline: process.argv[2],
		head: baseline.head,
		initialPatchSha256: baseline.diff,
		scope: 'P0 controls/policies; P1 compiler numerical policy, cubic cache/residency, candidate inputs and matched lookup proof',
		preexistingDirtyWork: 'Preserved as baseline; only task deltas enter the review unit.',
		reviewMilestone:
			'Coupled numerical/color milestone after P1-P3; implementation-completion review gates remain open.',
	});
	const policyPath = 'agents/topics/production-algorithm32/caches/distant-sun-strobing-acceptance.md';
	parents.push(await identify(policyPath));
	await write('acceptance-policy.json', {identity: parents.at(-1), text: (await files.read(policyPath)).toString()});
	const evidenceRoot = 'tmp/experiments/distant-sun-recording-strobing/runs';
	const verified = [];
	for (const id of [
		'00000-pin-control',
		'00012-field-compile',
		'00013-field-compile',
		'00014-field-compile',
		'00015-stable-ground',
		'00032-cubic-proof',
		'00053-color-proof',
		'00057-final-verifier',
	]) {
		verified.push(
			await authenticate(
				`${evidenceRoot}/${id}`,
				id === '00015-stable-ground'
					? 'eade8a3252a7ce1149f8474e32512df2bfd6ea43bf35fa982218d226d42a2698'
					: undefined,
			),
		);
	}
	for (const id of ['1788974488678-creative-animation', '1789171222384-creative-strobing-diagnosis']) {
		const pin = await readParent(`${evidenceRoot}/00000-pin-control/parent-${id}.json`);
		assert.ok(typeof pin.sourceRoot === 'string');
		assert.ok(pin.manifest !== null && typeof pin.manifest === 'object' && 'artifactSetSha256' in pin.manifest);
		assert.ok(typeof pin.manifest.artifactSetSha256 === 'string');
		verified.push(await authenticate(pin.sourceRoot, pin.manifest.artifactSetSha256));
	}
	await write('authenticated-evidence.json', verified);
	phase = 'pin-production';
	const packageRoot = `server/flat32/data/shared-block/${SHARED_PACKAGE_IDENTITY}`;
	await files.read(`${packageRoot}/${SHARED_PACKAGE_REPORT.path}`, SHARED_PACKAGE_REPORT);
	const packageInventory = [];
	/** Pin every deployed package file, including compressed blocks.
	 * @param {string} relative - Repository-relative directory.
	 * @returns {Promise<void>} - Completes after streamed authentication.
	 */
	async function pinDirectory(relative) {
		for (const name of (await readdir(await files.resolve(relative))).sort()) {
			const child = `${relative}/${name}`;
			if ((await lstat(await files.resolve(child))).isDirectory()) await pinDirectory(child);
			else packageInventory.push(await identify(child));
		}
	}
	await pinDirectory(packageRoot);
	await write('deployed-package.json', {
		identity: SHARED_PACKAGE_IDENTITY,
		report: SHARED_PACKAGE_REPORT,
		inventory: packageInventory,
	});
	const dataset = loadKiderDataset();
	const profiles = dataset.conditions.map((condition) =>
		createBrunetonProductionProfile({
			time: condition.time,
			fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
		}),
	);
	const nativeInput = DistantSunSceneCacheCompilerInputs.createInputSet(
		DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene(),
	);
	await write('profiles.json', {
		native: {
			profile: createNativeProductionProfile(),
			buildRequest: nativeInput.buildRequest,
			numericalIdentity: nativeInput.numericalIdentity,
		},
		bruneton: {profiles, construction: DistantSunPointLocalProfileCompilerInputs.createBatch(profiles), dataset},
	});
	await write('source-baseline.json', baseline);
	const lock = await readParent('package-lock.json');
	await write('tools.json', {
		node: process.version,
		versions: process.versions,
		platform: process.platform,
		architecture: process.arch,
		packages: lock.packages,
	});
	await control('point-local-control', [
		'--test',
		'--test-isolation=none',
		'scripts/algorithm32/solar-zenith-cache/point-local-cache-compiler.test.js',
	]);
	await control('bruneton-control', [
		'--test',
		'--test-isolation=none',
		'scripts/algorithm32/solar-zenith-cache/bruneton-production.test.js',
	]);
	await control('compiler-compatibility-control', [
		'scripts/algorithm32/solar-zenith-cache/verify-shared-compiler-compatibility.js',
	]);
	parents.push(await identify('scripts/algorithm32/solar-zenith-cache/pin-strobing-promotion.js'));
	await write('derivation.json', {
		operation:
			'Stream-authenticate sealed parent inventories and deployed package; serialize unchanged profiles, tool versions, source baseline and fixed acceptance policy; execute unchanged positive controls.',
		parents,
		command: [process.execPath, ...process.argv.slice(1)],
		limitations:
			'Scientific candidate acceptance, source recurrence, source review/audits, and owner inspection remain open.',
	});
	await files.write(
		`${run}/manifest.json`,
		Buffer.from(
			`${JSON.stringify({schemaId: 'strobing-promotion-p0-v1', state: 'accepted', artifacts, artifactSetSha256: files.hash(JSON.stringify(artifacts))}, null, 2)}\n`,
		),
	);
	process.stdout.write(`${JSON.stringify({run, state: 'accepted'})}\n`);
} catch (error) {
	await write('failure.json', {phase, message: error.message});
	await files.write(
		`${run}/manifest.json`,
		Buffer.from(
			`${JSON.stringify({schemaId: 'strobing-promotion-p0-v1', state: 'failed', artifacts, artifactSetSha256: files.hash(JSON.stringify(artifacts))}, null, 2)}\n`,
		),
	);
	throw error;
} finally {
	clearInterval(heartbeat);
}
