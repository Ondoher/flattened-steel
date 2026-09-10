import DistantSunSharedCacheWorkerClient from '../DistantSunSharedCacheWorkerClient.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/index.js';

/** Exact SHA-256 for independently constructed browser fixtures. */
async function hash(bytes) {
	const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
	return Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
}

/** Dictionary-free single-segment Zstandard fixture containing bounded raw blocks. */
async function fixture(rowCount = 1) {
	const values = new Float32Array(4058 * 15 * rowCount);
	for (let channel = 0; channel < 15; channel += 1)
		values.fill(channel + 0.25, channel * 4058 * rowCount, (channel + 1) * 4058 * rowCount);
	const bytes = new Uint8Array(values.buffer),
		shuffled = new Uint8Array(bytes.length);
	for (let lane = 0; lane < 4; lane += 1)
		for (let offset = 0; offset < values.length; offset += 1)
			shuffled[lane * values.length + offset] = bytes[offset * 4 + lane];
	const encoded = new Uint8Array(9 + 3 * Math.ceil(shuffled.length / 131072) + shuffled.length);
	const view = new DataView(encoded.buffer);
	view.setUint32(0, 0xfd2fb528, true);
	encoded[4] = 0xa0;
	view.setUint32(5, shuffled.length, true);
	let offset = 9;
	for (let first = 0; first < shuffled.length; first += 131072) {
		const count = Math.min(131072, shuffled.length - first);
		const final = first + count === shuffled.length;
		const header = count * 8 + Number(final);
		encoded[offset++] = header & 255;
		encoded[offset++] = (header >> 8) & 255;
		encoded[offset++] = (header >> 16) & 255;
		encoded.set(shuffled.subarray(first, first + count), offset);
		offset += count;
	}
	const logicalToUniqueIndex = new Uint16Array(
		CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices,
	);
	const expected = new Float32Array(648 * 1728 * 4);
	for (let vertical = 0; vertical < 27 * rowCount; vertical += 1)
		for (let column = 0; column < 648; column += 1)
			for (let component = 0; component < 4; component += 1) {
				const channel = Math.floor(column / 162) * 4 + component;
				if (channel < 15) expected[(vertical * 648 + column) * 4 + component] = channel + 0.25;
			}
	return {
		expectedHash: await hash(expected.buffer),
		request: {
			encoded: encoded.buffer,
			logicalToUniqueIndex,
			logicalToUniqueIndexSha256: await hash(logicalToUniqueIndex.buffer),
			block: {
				id: 'browser-fixture',
				rowCount,
				shuffle: 'float32-byte-lane-v1',
				encoded: {byteLength: encoded.length, sha256: await hash(encoded.buffer)},
				decoded: {byteLength: bytes.length, sha256: await hash(bytes.buffer)},
			},
		},
	};
}

describe('Shared-cache module Worker', () => {
	let client;
	afterEach(() => client?.dispose());
	it('transfers exact packet bits, reuses one Worker, and rejects corrupted data', async () => {
		let workers = 0;
		client = new DistantSunSharedCacheWorkerClient({
			workerUrl: '/base/dist/flat32/shared-cache-worker.js',
			createWorker: (url) => {
				workers += 1;
				return new Worker(url, {type: 'module'});
			},
		});
		const first = await fixture(64);
		const prepared = client.prepare(first.request, new AbortController().signal);
		expect(first.request.encoded.byteLength).toBe(0);
		expect(first.request.logicalToUniqueIndex.byteLength).toBe(0);
		const result = await prepared;
		expect(await hash(result.packet.values.buffer)).toBe(first.expectedHash);
		const corrupt = await fixture();
		corrupt.request.block.decoded.sha256 = '0'.repeat(64);
		await expectAsync(client.prepare(corrupt.request, new AbortController().signal)).toBeRejected();
		const next = await fixture();
		expect(
			await hash((await client.prepare(next.request, new AbortController().signal)).packet.values.buffer),
		).toBe(next.expectedHash);
		expect(workers).toBe(1);
	});
	it('rejects a failed Worker and creates a fresh instance for the next request', async () => {
		const crashUrl = URL.createObjectURL(
			new Blob(['throw new Error("Injected Worker failure");'], {type: 'text/javascript'}),
		);
		let attempts = 0;
		client = new DistantSunSharedCacheWorkerClient({
			workerUrl: '/base/dist/flat32/shared-cache-worker.js',
			createWorker: (url) => new Worker(++attempts === 1 ? crashUrl : url, {type: 'module'}),
		});
		try {
			await expectAsync(client.prepare((await fixture()).request, new AbortController().signal)).toBeRejected();
			const next = await fixture();
			expect(
				await hash((await client.prepare(next.request, new AbortController().signal)).packet.values.buffer),
			).toBe(next.expectedHash);
			expect(attempts).toBe(2);
		} finally {
			URL.revokeObjectURL(crashUrl);
		}
	});
	it('rejects final cancellation and disposal without delivering a stale packet', async () => {
		client = new DistantSunSharedCacheWorkerClient({workerUrl: '/base/dist/flat32/shared-cache-worker.js'});
		const source = await fixture(),
			cancellation = new AbortController();
		const pending = client.prepare(source.request, cancellation.signal);
		cancellation.abort();
		await expectAsync(pending).toBeRejected();
		client.dispose();
		await expectAsync(client.prepare((await fixture()).request, new AbortController().signal)).toBeRejected();
	});
});
