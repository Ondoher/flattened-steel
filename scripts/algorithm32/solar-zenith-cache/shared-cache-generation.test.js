import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {getEventListeners} from 'node:events';
import {createConnection} from 'node:net';
import {spawnSync} from 'node:child_process';
import DistantSunSharedCacheGenerationCodec from './DistantSunSharedCacheGenerationCodec.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import DistantSunPointLocalCacheStaging from './DistantSunPointLocalCacheStaging.js';
import DistantSunSharedCacheGenerator from './DistantSunSharedCacheGenerator.js';
import DistantSunPointLocalCacheCompilerHost from './DistantSunPointLocalCacheCompilerHost.js';
import DistantSunSharedCacheGenerationInventory from './DistantSunSharedCacheGenerationInventory.js';
import {SHARED_GENERATION_RUN_ROOT} from './consts.js';

/** Creates a two-row control whose duplicated logical directions have independent expected bytes. */
function fixture() {
	const directionBytes = Buffer.alloc(4374 * 2);
	for (let logical = 0; logical < 4374; logical += 1) directionBytes.writeUInt16LE(logical % 4058, logical * 2);
	return {
		directionBytes,
		logicalDirectionCount: 4374,
		uniqueDirectionCount: 4058,
		channelCount: 15,
		wavelengths: Array.from({length: 15}, (_unused, index) => index),
		coordinates: [
			[0, 0],
			[0, 1],
		],
		blocks: [
			{
				tile: {altitudeIndex: 0, solarZenithIndex: 0},
				coordinates: [
					[0, 0],
					[0, 1],
				],
			},
		],
	};
}

/** Creates exact asymmetric logical rows with predictable unique-direction spectral values. */
function tile(channel) {
	const bytes = Buffer.alloc(2 * 4374 * 4);
	for (let row = 0; row < 2; row += 1)
		for (let logical = 0; logical < 4374; logical += 1)
			bytes.writeFloatLE(channel * 10000 + row * 5000 + (logical % 4058), (row * 4374 + logical) * 4);
	return bytes;
}

test('byte-lane codec preserves signed zero, subnormals, and all finite asymmetric Float32 bits', () => {
	const codec = new DistantSunSharedCacheGenerationCodec();
	const expected = Buffer.from('00000080010000000100803f0100807f0000803f0100003f', 'hex');
	const encoded = codec.encode(expected);
	assert.deepEqual(codec.decode(encoded, expected.byteLength), expected);
	assert.throws(() => codec.decode(encoded.subarray(0, encoded.length - 1), expected.length));
	assert.throws(() => codec.decode(encoded, expected.length - 4));
	assert.throws(() => codec.decode(encoded, 16 * 1024 * 1024 + 4));
	assert.throws(() => codec.encode(new Uint8Array(3)));
});

test('direct staging rejects gaps and duplicates and preserves wavelength-row-direction offsets', async () => {
	const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
	const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
	const runRoot = `${SHARED_GENERATION_RUN_ROOT}/fault-proof-${randomUUID()}`;
	const staging = new DistantSunPointLocalCacheStaging(fixture());
	await staging.allocate(files, runRoot);
	try {
		assert.throws(() => staging.complete(), /incomplete/u);
		await assert.rejects(staging.accept(1, 0, tile(1)), /order or extent/u);
		await assert.rejects(staging.accept(0, 1, tile(0)), /order or extent/u);
		await assert.rejects(staging.accept(0, 0, tile(0).subarray(1)), /order or extent/u);
		for (let channel = 0; channel < 15; channel += 1) await staging.accept(channel, 0, tile(channel));
		await assert.rejects(staging.accept(14, 0, tile(14)), /order or extent/u);
		assert.equal(staging.complete(), 15 * 2 * 4058 * 4);
	} finally {
		await staging.close();
	}
	const bytes = await readFile(await files.resolve(`${runRoot}/block-000.f32`));
	for (let channel = 0; channel < 15; channel += 1)
		for (let row = 0; row < 2; row += 1)
			for (const direction of [0, 1, 13, 4057])
				assert.equal(
					bytes.readFloatLE(((channel * 2 + row) * 4058 + direction) * 4),
					channel * 10000 + row * 5000 + direction,
				);
	await files.write(
		`${runRoot}/proof.json`,
		Buffer.from(
			`${JSON.stringify({accepted: true, proof: 'bounded-direct-staging-offsets-and-order', decodedSha256: files.hash(bytes)})}\n`,
		),
	);
});

test('seam bit disagreement and invalid spectra cannot complete or publish a block', async () => {
	const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
	const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
	for (const fault of ['seam', 'negative', 'nonfinite']) {
		const runRoot = `${SHARED_GENERATION_RUN_ROOT}/fault-proof-${randomUUID()}`;
		const staging = new DistantSunPointLocalCacheStaging(fixture());
		await staging.allocate(files, runRoot);
		try {
			const bytes = tile(0);
			if (fault === 'seam') bytes.writeUInt32LE(0x80000000, 4058 * 4);
			if (fault === 'negative') bytes.writeFloatLE(-1, 4);
			if (fault === 'nonfinite') bytes.writeFloatLE(Number.NaN, 4);
			await assert.rejects(staging.accept(0, 0, bytes), /seam|nonfinite or negative/u);
			assert.throws(() => staging.complete(), /incomplete/u);
		} finally {
			await staging.close();
		}
		await files.write(
			`${runRoot}/proof.json`,
			Buffer.from(`${JSON.stringify({accepted: true, rejectedFault: fault, published: false})}\n`),
		);
	}
});

test('filesystem and generator ingress reject traversal and precancelled execution', async () => {
	const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
	const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
	for (const unsafe of ['../outside', 'C:/outside', 'tmp/../outside', 'tmp/file:stream'])
		await assert.rejects(files.resolve(unsafe), /uncontained/u);
	const cancellation = new AbortController();
	cancellation.abort(new Error('proof cancellation'));
	await assert.rejects(
		new DistantSunSharedCacheGenerator().run({
			chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			signal: cancellation.signal,
		}),
		/proof cancellation/u,
	);
});

test('production command rejects ambiguous explicit inputs before generation', () => {
	const entry = fileURLToPath(new URL('./generate-shared-cache.js', import.meta.url));
	for (const argumentsList of [
		['--input', 'input.json'],
		['--output', 'tmp/example'],
		['--unknown', 'value'],
		['--chrome', 'first', '--chrome', 'second'],
		['--input', '--output'],
	]) {
		const result = spawnSync(process.execPath, [entry, ...argumentsList], {encoding: 'utf8', timeout: 10000});
		assert.equal(result.error, undefined);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Usage:|requires both --input and --output/u);
		assert.equal(result.stdout, '');
	}
});

test('cancellation during an allocated run leaves a failure record and no published package', async () => {
	const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
	const runs = path.join(repositoryRoot, SHARED_GENERATION_RUN_ROOT);
	const previous = new Set(await readdir(runs));
	const cancellation = new AbortController();
	await assert.rejects(
		new DistantSunSharedCacheGenerator().run({
			chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			signal: cancellation.signal,
			onProgress: (event) => {
				if (event.phase === 'common-field-computation')
					cancellation.abort(new Error('midrun proof cancellation'));
			},
		}),
		/midrun proof cancellation/u,
	);
	const created = (await readdir(runs)).filter((name) => !previous.has(name));
	assert.equal(created.length, 1);
	const run = path.join(runs, created[0]);
	assert.equal(JSON.parse(await readFile(path.join(run, 'failure.json'), 'utf8')).accepted, false);
	await assert.rejects(stat(path.join(run, 'published')), {code: 'ENOENT'});
});

for (const scenario of [
	'cancel-after-launch',
	'deadline',
	'browser-exit',
	'rejected-completion',
	'malformed-request',
]) {
	test(`GPU host ${scenario} rejects and releases its child, server, and abort listener`, async () => {
		const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
		const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
		const inventory = {
			...(await new DistantSunSharedCacheGenerationInventory().load(files)),
			logicalDirectionCount: 4374,
			uniqueDirectionCount: 4058,
			channelCount: 15,
			wavelengths: Array.from({length: 15}, (_unused, index) => index),
		};
		const runRoot = `${SHARED_GENERATION_RUN_ROOT}/host-fault-proof-${randomUUID()}`;
		await files.directory(runRoot);
		const cancellation = new AbortController();
		let processId = 0;
		let hostPort = 0;
		let operation = '';
		if (scenario === 'rejected-completion')
			operation = `await fetch(new URL('complete', this.root), {method:'POST',body:JSON.stringify({accepted:false,error:'host proof rejection'})});`;
		if (scenario === 'malformed-request')
			operation = `await fetch(new URL('progress', this.root), {method:'POST',body:'not-json'});`;
		const browserSource = Buffer.from(
			`export default class HostProofBrowser { constructor(root) { this.root = root; } async run() { ${operation} } }`,
		);
		const hostFiles = Object.create(files);
		hostFiles.read = async (relativePath, expected, maximumBytes) =>
			relativePath.endsWith('/DistantSunPointLocalCacheCompilerBrowser.js')
				? browserSource
				: files.read(relativePath, expected, maximumBytes);
		const expectedFailure =
			scenario === 'cancel-after-launch'
				? /host proof cancellation/u
				: scenario === 'deadline'
					? /exceeded/u
					: scenario === 'browser-exit'
						? /exited before completion/u
						: scenario === 'rejected-completion'
							? /host proof rejection/u
							: /JSON|Unexpected token/u;
		await assert.rejects(
			new DistantSunPointLocalCacheCompilerHost().run({
				files: hostFiles,
				runRoot,
				inventory,
				staging: {accept: async () => assert.fail('The lifecycle fixture must never deliver a GPU tile.')},
				chromePath:
					scenario === 'browser-exit'
						? process.execPath
						: (process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
				signal: cancellation.signal,
				maximumMilliseconds: scenario === 'deadline' ? 250 : 30000,
				progress: async (event) => {
					if (event.phase === 'browser-launched') {
						processId = Number(event.processId);
						hostPort = Number(event.hostPort);
						if (scenario === 'cancel-after-launch')
							cancellation.abort(new Error('host proof cancellation'));
					}
				},
			}),
			expectedFailure,
		);
		assert.ok(processId > 0, 'The failure must occur after a real child was launched.');
		assert.ok(hostPort > 0, 'The failure must occur after the local server began listening.');
		assert.throws(() => process.kill(processId, 0), {code: 'ESRCH'});
		assert.equal(getEventListeners(cancellation.signal, 'abort').length, 0);
		await assert.rejects(
			new Promise((resolve, reject) => {
				const connection = createConnection({host: '127.0.0.1', port: hostPort});
				connection.once('connect', () => {
					connection.destroy();
					resolve(undefined);
				});
				connection.once('error', reject);
			}),
			{code: 'ECONNREFUSED'},
		);
	});
}
