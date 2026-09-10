import {createHash} from 'node:crypto';
import {zstdCompressSync} from 'node:zlib';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/index.js';
import DistantSunSharedCacheBlockPreparer from '../DistantSunSharedCacheBlockPreparer.js';
import DistantSunSharedCacheDecoder from '../DistantSunSharedCacheDecoder.js';
import DistantSunSharedCacheTransport from '../DistantSunSharedCacheTransport.js';
import DistantSunSharedCacheRetention from '../DistantSunSharedCacheRetention.js';
import {
	DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
	DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH,
	DISTANT_SUN_SHARED_CACHE_SHUFFLE_ID,
} from '../consts.js';

/** Exact source-byte identity for independently constructed fixtures. */
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
/** Explicitly controlled asynchronous completion. */
const deferred = () => {
	let resolve, reject;
	const promise = new Promise((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return {promise, resolve, reject};
};
/** One-row spectral fixture with signed zero, subnormal, and channel-specific exact bits. */
function fixture() {
	const values = new Float32Array(DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH / 4);
	const bits = new Uint32Array(values.buffer);
	for (let offset = 0; offset < bits.length; offset += 1)
		bits[offset] = offset % 997 === 0 ? 0x80000000 : offset % 991 === 0 ? 1 : 0x3f000000 + offset;
	const bytes = new Uint8Array(values.buffer),
		shuffled = new Uint8Array(bytes.length);
	for (let lane = 0; lane < 4; lane += 1)
		for (let offset = 0; offset < values.length; offset += 1)
			shuffled[lane * values.length + offset] = bytes[offset * 4 + lane];
	const encoded = new Uint8Array(zstdCompressSync(shuffled));
	const logicalToUniqueIndex = new Uint16Array(
		CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices,
	);
	return {
		values,
		shuffled,
		request: {
			encoded: encoded.buffer,
			logicalToUniqueIndex,
			logicalToUniqueIndexSha256: sha256(new Uint8Array(logicalToUniqueIndex.buffer)),
			block: {
				id: 'fixture',
				rowCount: 1,
				shuffle: DISTANT_SUN_SHARED_CACHE_SHUFFLE_ID,
				decoded: {byteLength: bytes.length, sha256: sha256(bytes)},
				encoded: {byteLength: encoded.length, sha256: sha256(encoded)},
			},
		},
	};
}

describe('Shared-cache decode and packet correctness', () => {
	it('restores every exact source bit and canonical packet component with the pinned WASM fallback', async () => {
		const source = fixture(),
			native = globalThis.DecompressionStream;
		try {
			globalThis.DecompressionStream = undefined;
			const result = await new DistantSunSharedCacheBlockPreparer().prepare(
				source.request,
				new AbortController().signal,
			);
			expect(result.timings.decoder).toBe('wasm');
			const expected = new Uint32Array(DISTANT_SUN_SHARED_CACHE_PACKET_BYTES / 4);
			const sourceBits = new Uint32Array(source.values.buffer);
			for (let face = 0; face < 6; face += 1)
				for (let vertical = 0; vertical < 27; vertical += 1)
					for (let horizontal = 0; horizontal < 27; horizontal += 1) {
						const unique = source.request.logicalToUniqueIndex[face * 729 + vertical * 27 + horizontal];
						for (let channel = 0; channel < 15; channel += 1) {
							const column = Math.floor(channel / 4) * 162 + face * 27 + horizontal;
							expected[(vertical * 648 + column) * 4 + (channel % 4)] =
								sourceBits[channel * 4058 + unique];
						}
					}
			expect(Buffer.compare(Buffer.from(expected.buffer), Buffer.from(result.packet.values.buffer))).toBe(0);
		} finally {
			globalThis.DecompressionStream = native;
		}
	});

	it('uses the detected decoder and rejects framing, bound, encoded-hash and decoded-hash corruption', async () => {
		const source = fixture(),
			decoder = new DistantSunSharedCacheDecoder(),
			signal = new AbortController().signal;
		const decoded = await decoder.decode(new Uint8Array(source.request.encoded), source.shuffled.length, signal);
		expect(Buffer.compare(Buffer.from(decoded), Buffer.from(source.shuffled))).toBe(0);
		await expectAsync(
			decoder.decode(new Uint8Array(source.request.encoded).slice(0, -1), source.shuffled.length, signal),
		).toBeRejected();
		await expectAsync(
			decoder.decode(new Uint8Array(source.request.encoded), 32 * 1024 * 1024, signal),
		).toBeRejected();
		const preparer = new DistantSunSharedCacheBlockPreparer();
		const corrupt = structuredClone(source.request);
		new Uint8Array(corrupt.encoded)[10] ^= 1;
		await expectAsync(preparer.prepare(corrupt, signal)).toBeRejected();
		const wrongDecoded = structuredClone(source.request);
		wrongDecoded.block.decoded.sha256 = '0'.repeat(64);
		await expectAsync(preparer.prepare(wrongDecoded, signal)).toBeRejected();
	});
});

describe('Shared-cache transport accounting', () => {
	let transport;
	const packet = {values: new Float32Array(DISTANT_SUN_SHARED_CACHE_PACKET_BYTES / 4)};
	const preparer = {prepare: async () => ({packet, timings: {decoder: 'wasm'}}), dispose() {}};
	/** Independently identified request with a caller-owned cancellation signal. */
	const request = (ordinal, signal = new AbortController().signal) => ({
		url: `https://example.test/${ordinal}.zst`,
		signal,
		block: {
			id: `block-${ordinal}`,
			rowCount: 1,
			decoded: {sha256: 'b'.repeat(64), byteLength: 243480},
			encoded: {sha256: ordinal.toString(16).padStart(64, '0'), byteLength: 8},
		},
		logicalToUniqueIndex: new Uint16Array(4374),
		logicalToUniqueIndexSha256: 'c'.repeat(64),
		pin: {kind: 'candidate', owner: 'test'},
	});
	afterEach(() => {
		transport?.dispose();
		transport = undefined;
	});
	it('rejects cross-origin artifact requests before pin reservation or network access', async () => {
		const previous = Object.getOwnPropertyDescriptor(globalThis, 'location');
		let fetches = 0;
		try {
			Object.defineProperty(globalThis, 'location', {
				value: {origin: 'https://application.test'},
				configurable: true,
			});
			transport = new DistantSunSharedCacheTransport({
				preparer,
				fetch: async () => {
					fetches += 1;
					return new Response(new Uint8Array(8));
				},
			});
			await expectAsync(transport.request(request(1))).toBeRejected();
			expect(fetches).toBe(0);
			expect(transport.diagnostics().retention.pinnedBytes).toBe(0);
		} finally {
			if (previous) Object.defineProperty(globalThis, 'location', previous);
			else delete globalThis.location;
		}
	});

	it('coalesces subscribers and preserves another subscriber after partial cancellation', async () => {
		const pending = deferred();
		let fetches = 0,
			underlying;
		transport = new DistantSunSharedCacheTransport({
			preparer,
			fetch: (_url, options) => {
				fetches += 1;
				underlying = options.signal;
				return pending.promise;
			},
		});
		const cancellation = new AbortController();
		const canceled = transport.request(request(1, cancellation.signal)).catch((error) => error);
		const kept = transport.request(request(1));
		cancellation.abort();
		expect(underlying.aborted).toBeFalse();
		pending.resolve(new Response(new Uint8Array(8)));
		const lease = await kept;
		await canceled;
		expect(fetches).toBe(1);
		expect(transport.diagnostics().coalesced).toBe(1);
		lease.repin({kind: 'published', owner: 'window'});
		lease.release();
		const reused = await transport.request(request(1));
		reused.release();
		expect(fetches).toBe(1);
		expect(transport.diagnostics().retention.pins.published).toBe(0);
	});

	it('caps concurrent complete jobs at four and drains queued work', async () => {
		const responses = [];
		const fourth = deferred();
		transport = new DistantSunSharedCacheTransport({
			preparer,
			fetch: () => {
				const pending = deferred();
				responses.push(pending);
				if (responses.length === 4) fourth.resolve();
				return pending.promise;
			},
		});
		const first = [1, 2, 3, 4].map((ordinal) => transport.request(request(ordinal)));
		await fourth.promise;
		const fifth = transport.request(request(5));
		expect(responses.length).toBe(4);
		expect(transport.diagnostics().queued).toBe(1);
		responses[0].resolve(new Response(new Uint8Array(8)));
		const firstLease = await first[0];
		firstLease.release();
		for (let ordinal = 1; ordinal < 4; ordinal += 1) responses[ordinal].resolve(new Response(new Uint8Array(8)));
		for (const lease of await Promise.all(first.slice(1))) lease.release();
		expect(responses.length).toBe(5);
		responses[4].resolve(new Response(new Uint8Array(8)));
		(await fifth).release();
		expect(transport.diagnostics().peakActive).toBe(4);
	});

	it('aborts the underlying request after final cancellation and rejects oversized response bytes', async () => {
		let underlying;
		transport = new DistantSunSharedCacheTransport({
			preparer,
			fetch: (_url, options) => {
				underlying = options.signal;
				return new Promise((_resolve, reject) =>
					options.signal.addEventListener('abort', () => reject(options.signal.reason), {once: true}),
				);
			},
		});
		const cancellation = new AbortController();
		const pending = transport.request(request(1, cancellation.signal)).catch((error) => error);
		cancellation.abort();
		await pending;
		expect(underlying.aborted).toBeTrue();
		expect(transport.diagnostics().retention.pinnedBytes).toBe(0);
		transport.dispose();
		transport = new DistantSunSharedCacheTransport({preparer, fetch: async () => new Response(new Uint8Array(9))});
		await expectAsync(transport.request(request(2))).toBeRejected();
		expect(transport.diagnostics().retention.pinnedBytes).toBe(0);
	});

	it('enforces route admission, preserves pins, and evicts only unpinned packets above 64 MiB', () => {
		const retention = new DistantSunSharedCacheRetention(8 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES);
		const pinned = retention.reserve('pinned', {kind: 'published', owner: 'window'});
		retention.publish('pinned', packet);
		for (let ordinal = 0; ordinal < 5; ordinal += 1) {
			const key = String(ordinal),
				token = retention.reserve(key, {kind: 'candidate', owner: 'transaction'});
			retention.publish(key, packet);
			retention.release(key, token);
		}
		expect(retention.get('pinned')).toBe(packet);
		expect(retention.diagnostics().evictions).toBe(2);
		expect(retention.diagnostics().unpinnedBytes).toBe(3 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES);
		retention.reserve('route-1', {
			kind: 'prepared-route',
			owner: 'route',
			maximumBytes: DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
		});
		expect(() =>
			retention.reserve('route-2', {
				kind: 'prepared-route',
				owner: 'route',
				maximumBytes: DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
			}),
		).toThrowError(/budget/);
		retention.release('pinned', pinned);
		retention.dispose();
	});
});
