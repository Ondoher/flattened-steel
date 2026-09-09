const DECODED_RETENTION_BYTES = 64 * 1024 * 1024;
const MAXIMUM_DECODED_BLOCK_BYTES = 16 * 1024 * 1024;

/** @param {unknown} value - Candidate JSON record. @param {string} label - Contract location. @returns {Record<string, unknown>} - Closed record candidate. */
function requireRecord(value, label) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
	return /** @type {Record<string, unknown>} */ (value);
}

/** @param {Record<string, unknown>} value - Candidate closed record. @param {string[]} keys - Required keys. @param {string} label - Contract location. */
function requireExactKeys(value, keys, label) {
	if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) throw new TypeError(`${label} has an unsupported shape.`);
}

/** @param {unknown} value - Candidate count. @param {string} label - Contract location. @returns {number} - Safe nonnegative count. */
function requireCount(value, label) {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} must be a nonnegative safe integer.`);
	return value;
}

/** @param {unknown} value - Candidate path. @param {string} label - Contract location. @returns {string} - Normalized relative path. */
function requirePath(value, label) {
	if (typeof value !== 'string' || !/^(?!.*(?:^|\/)\.)[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(value)) throw new TypeError(`${label} is unsafe.`);
	return value;
}

/** @param {unknown} value - Candidate digest. @param {string} label - Contract location. @returns {string} - Lowercase SHA-256. */
function requireSha256(value, label) {
	if (typeof value !== 'string' || !/^[a-f0-9]{64}$/u.test(value)) throw new TypeError(`${label} must be a SHA-256.`);
	return value;
}

/** @param {unknown} value - Candidate metadata identity. @param {string} label - Contract location. @returns {CacheOptimizationE2FileIdentity} - Accepted identity. */
function acceptFileIdentity(value, label) {
	const identity = requireRecord(value, label);
	requireExactKeys(identity, ['byteLength', 'path', 'sha256'], label);
	return {path: requirePath(identity.path, `${label} path`), byteLength: requireCount(identity.byteLength, `${label} bytes`), sha256: requireSha256(identity.sha256, `${label} SHA-256`)};
}

/** @param {unknown} value - E1 catalog JSON. @returns {CacheOptimizationE2Catalog} - Browser-safe validated catalog. */
function acceptCatalog(value) {
	const catalog = requireRecord(value, 'E2 catalog');
	requireExactKeys(catalog, ['schemaId', 'scenes', 'selection'], 'E2 catalog');
	if (catalog.schemaId !== 'distant-sun-cache-runtime-catalog-v1' || !Array.isArray(catalog.scenes) || catalog.scenes.length !== 109) throw new TypeError('E2 catalog is unsupported.');
	const scenes = catalog.scenes.map((entry, index) => {
		const scene = requireRecord(entry, `E2 catalog scene ${index}`);
		requireExactKeys(scene, ['id', 'manifest', 'representativeSolarZenithDegrees'], `E2 catalog scene ${index}`);
		const degrees = requireCount(scene.representativeSolarZenithDegrees, `E2 catalog scene ${index} degrees`);
		if (degrees !== index || scene.id !== `solar-zenith-${String(index).padStart(3, '0')}-degrees`) throw new TypeError('E2 catalog coverage is invalid.');
		return {degrees, manifest: acceptFileIdentity(scene.manifest, `E2 catalog scene ${index} manifest`)};
	});
	return {scenes};
}

/** @param {unknown} value - E1 configuration JSON. @returns {CacheOptimizationE2Configuration} - Browser-safe validated layout. */
function acceptConfiguration(value) {
	const configuration = requireRecord(value, 'E2 configuration');
	requireExactKeys(configuration, ['atmosphereIdentity', 'blockGrid', 'blockIndex', 'codec', 'configurationIdentity', 'coordinateDomains', 'directionLayout', 'distinctCoordinateCount', 'geometryIdentity', 'groundIdentity', 'layout', 'numericalIdentity', 'rowByteLength', 'schemaId', 'shuffle', 'spectralLayout'], 'E2 configuration');
	if (configuration.schemaId !== 'distant-sun-cache-configuration-manifest-v1' || configuration.shuffle !== 'float32-byte-lane-v1') throw new TypeError('E2 configuration is unsupported.');
	const direction = requireRecord(configuration.directionLayout, 'E2 direction layout');
	const spectral = requireRecord(configuration.spectralLayout, 'E2 spectral layout');
	requireExactKeys(direction, ['id', 'logicalDirectionCount', 'logicalToUniqueIndexSha256', 'uniqueDirectionCount'], 'E2 direction layout');
	requireExactKeys(spectral, ['channelCount', 'id', 'order'], 'E2 spectral layout');
	const uniqueDirectionCount = requireCount(direction.uniqueDirectionCount, 'E2 unique direction count');
	const channelCount = requireCount(spectral.channelCount, 'E2 channel count');
	const rowByteLength = requireCount(configuration.rowByteLength, 'E2 row byte length');
	if (direction.id !== 'algorithm32-distant-sun-w27-exact-seam-u16-v1' || spectral.id !== 'Native15' || spectral.order !== 'wavelength-major' || channelCount !== 15 || uniqueDirectionCount !== 4058 || rowByteLength !== channelCount * uniqueDirectionCount * Float32Array.BYTES_PER_ELEMENT) throw new TypeError('E2 configuration layout is incoherent.');
	return {blockIndex: acceptFileIdentity(configuration.blockIndex, 'E2 block index'), channelCount, uniqueDirectionCount, rowByteLength};
}

/** @param {unknown} value - E1 block-index JSON. @returns {CacheOptimizationE2BlockIndex} - Browser-safe bounded block index. */
function acceptBlockIndex(value) {
	const index = requireRecord(value, 'E2 block index');
	requireExactKeys(index, ['blocks', 'distinctCoordinateCount', 'rowByteLength', 'schemaId'], 'E2 block index');
	if (index.schemaId !== 'distant-sun-cache-block-index-v1' || !Array.isArray(index.blocks)) throw new TypeError('E2 block index is unsupported.');
	return {blocks: index.blocks.map((entry, number) => {
		const block = requireRecord(entry, `E2 block ${number}`);
		requireExactKeys(block, ['coordinates', 'decodedByteLength', 'decodedSha256', 'derivation', 'encodedByteLength', 'encodedSha256', 'id', 'path', 'rowCount', 'tile'], `E2 block ${number}`);
		const rowCount = requireCount(block.rowCount, `E2 block ${number} row count`);
		const decodedByteLength = requireCount(block.decodedByteLength, `E2 block ${number} decoded bytes`);
		const encodedByteLength = requireCount(block.encodedByteLength, `E2 block ${number} encoded bytes`);
		if (decodedByteLength === 0 || decodedByteLength > MAXIMUM_DECODED_BLOCK_BYTES || encodedByteLength === 0 || !Array.isArray(block.coordinates) || block.coordinates.length !== rowCount) throw new TypeError('E2 block allocation bounds are invalid.');
		return {encodedSha256: requireSha256(block.encodedSha256, `E2 block ${number} encoded SHA-256`), decodedSha256: requireSha256(block.decodedSha256, `E2 block ${number} decoded SHA-256`), encodedByteLength, decodedByteLength, path: requirePath(block.path, `E2 block ${number} path`), rowCount};
	})};
}

/** @param {unknown} value - E1 scene JSON. @param {CacheOptimizationE2Configuration} configuration - Validated layout. @param {CacheOptimizationE2BlockIndex} blockIndex - Validated blocks. @returns {CacheOptimizationE2Scene} - Browser-safe scene. */
function acceptScene(value, configuration, blockIndex) {
	const scene = requireRecord(value, 'E2 scene');
	requireExactKeys(scene, ['compatibility', 'id', 'ledger', 'payloadByteLength', 'payloadSha256', 'representativeSolarZenithDegrees', 'schemaId', 'sceneSun', 'segments', 'selection', 'sourceManifestSha256'], 'E2 scene');
	if (scene.schemaId !== 'distant-sun-cache-scene-manifest-v1' || !Array.isArray(scene.segments)) throw new TypeError('E2 scene is unsupported.');
	const payloadByteLength = requireCount(scene.payloadByteLength, 'E2 scene payload bytes');
	if (payloadByteLength === 0 || payloadByteLength % configuration.rowByteLength !== 0) throw new TypeError('E2 scene payload length is incoherent.');
	const rowCount = payloadByteLength / configuration.rowByteLength;
	let rows = 0;
	const segments = scene.segments.map((entry, number) => {
		const segment = requireRecord(entry, `E2 segment ${number}`);
		requireExactKeys(segment, ['blockIndex', 'firstBlockRow', 'rowCount'], `E2 segment ${number}`);
		const blockNumber = requireCount(segment.blockIndex, `E2 segment ${number} block`);
		const firstBlockRow = requireCount(segment.firstBlockRow, `E2 segment ${number} first row`);
		const segmentRowCount = requireCount(segment.rowCount, `E2 segment ${number} row count`);
		const block = blockIndex.blocks[blockNumber];
		if (!block || segmentRowCount === 0 || firstBlockRow + segmentRowCount > block.rowCount) throw new TypeError('E2 segment exceeds a validated block.');
		rows += segmentRowCount;
		return {blockIndex: blockNumber, firstBlockRow, rowCount: segmentRowCount};
	});
	if (rows !== rowCount) throw new TypeError('E2 scene segments do not cover its payload.');
	return {segments, payloadByteLength, payloadSha256: requireSha256(scene.payloadSha256, 'E2 scene payload SHA-256')};
}

/** @returns {number | null} - Chrome heap bytes when the proof browser exposes them. */
function heapBytes() {
	return Number.isFinite(performance.memory?.usedJSHeapSize) ? performance.memory.usedJSHeapSize : null;
}

/** @param {ArrayBuffer} value - Bytes to hash. @returns {Promise<string>} - Lowercase SHA-256. */
async function sha256(value) {
	const digest = await crypto.subtle.digest('SHA-256', value);
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** @param {string} message - Error message. @returns {DOMException} - Abort-shaped rejection. */
function abortError(message) {
	return new DOMException(message, 'AbortError');
}

/** @param {unknown} value - Worker postMessage payload. @returns {CacheOptimizationE2WorkerResponse} - Closed Worker response. */
function acceptWorkerResponse(value) {
	const response = requireRecord(value, 'E2 Worker response');
	if ('error' in response) {
		requireExactKeys(response, ['error', 'id'], 'E2 Worker error response');
		const error = requireRecord(response.error, 'E2 Worker error');
		requireExactKeys(error, ['message', 'name'], 'E2 Worker error');
		const id = response.id;
		const name = error.name;
		const message = error.message;
		if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 0 || typeof name !== 'string' || typeof message !== 'string') throw new TypeError('E2 Worker error response is invalid.');
		return {id, error: {name, message}};
	}
	requireExactKeys(response, ['decodeMilliseconds', 'decoded', 'id', 'inverseShuffleMilliseconds', 'queueMilliseconds', 'workerHeapBytes'], 'E2 Worker success response');
	const {id, decoded, queueMilliseconds, decodeMilliseconds, inverseShuffleMilliseconds, workerHeapBytes} = response;
	if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 || !(decoded instanceof ArrayBuffer)) throw new TypeError('E2 Worker success identity is invalid.');
	if (typeof queueMilliseconds !== 'number' || !Number.isFinite(queueMilliseconds) || queueMilliseconds < 0 || typeof decodeMilliseconds !== 'number' || !Number.isFinite(decodeMilliseconds) || decodeMilliseconds < 0 || typeof inverseShuffleMilliseconds !== 'number' || !Number.isFinite(inverseShuffleMilliseconds) || inverseShuffleMilliseconds < 0) throw new TypeError('E2 Worker timing is invalid.');
	const workerHeap = workerHeapBytes === null ? null : requireCount(workerHeapBytes, 'E2 Worker heap measurement');
	return {id, decoded, queueMilliseconds, decodeMilliseconds, inverseShuffleMilliseconds, workerHeapBytes: workerHeap};
}

/**
 * Fetch one JSON value from the contained proof host.
 *
 * @param {string} url - Same-origin immutable metadata URL.
 * @returns {Promise<unknown>} - Parsed untrusted JSON.
 */
async function json(url) {
	const response = await fetch(url, {cache: 'force-cache'});
	if (!response.ok) throw new Error(`E2 metadata request failed with HTTP ${response.status}.`);
	const value = await response.json();
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('E2 metadata is not an object.');
	return value;
}

/** Persistent module-Worker decoder with transferred request and response buffers. */
class WorkerDecoder {
	/** @type {Worker} */ #worker;
	/** @type {number} */ #nextId = 1;
	/** @type {Map<number, CacheOptimizationE2WorkerPending>} */ #pending = new Map();

	constructor() {
		this.#worker = new Worker('/modules/experiment/browser/e2-decode-worker.js', {type: 'module'});
		this.#worker.addEventListener('message', (event) => {
			const response = acceptWorkerResponse(event.data);
			const pending = this.#pending.get(response.id);
			if (!pending) return;
			this.#pending.delete(response.id);
			if ('error' in response) pending.reject(new Error(`${response.error.name}: ${response.error.message}`));
			else pending.resolve(response);
		});
		this.#worker.addEventListener('error', (event) => {
			for (const pending of this.#pending.values()) pending.reject(event.error ?? new Error(event.message));
			this.#pending.clear();
		});
	}

	/**
	 * Decode one transferred compressed block.
	 *
	 * @param {ArrayBuffer} encoded - Owned encoded bytes.
	 * @param {number} decodedByteLength - Prevalidated bounded decoded length.
	 * @returns {Promise<CacheOptimizationE2WorkerSuccess>} - Decoded bytes and Worker timings.
	 */
	decode(encoded, decodedByteLength) {
		if (!Number.isSafeInteger(decodedByteLength) || decodedByteLength <= 0 || decodedByteLength > MAXIMUM_DECODED_BLOCK_BYTES) {
			return Promise.reject(new RangeError('E2 rejects an unbounded decoded block.'));
		}
		const id = this.#nextId++;
		return new Promise((resolve, reject) => {
			this.#pending.set(id, {resolve, reject});
			this.#worker.postMessage({id, requestedAtEpoch: Date.now(), encoded, decodedByteLength}, [encoded]);
		});
	}

	/** Stop the Worker once the proof is complete. */
	dispose() {
		this.#worker.terminate();
		for (const pending of this.#pending.values()) pending.reject(new Error('E2 Worker was disposed.'));
		this.#pending.clear();
	}
}

/** E2 transport owner: four-slot scheduler, artifact coalescing, isolated abort, byte LRU, and last-good publication. */
class E2Transport {
	/** @type {WorkerDecoder} */ #decoder = new WorkerDecoder();
	/** @type {Map<string, Uint8Array>} */ #lru = new Map();
	/** @type {Map<string, CacheOptimizationE2InflightBlock>} */ #inflight = new Map();
	/** @type {Set<string>} */ #pins = new Set();
	/** @type {Array<() => void>} */ #queue = [];
	/** @type {number} */ #activeRequests = 0;
	/** @type {number} */ #retainedBytes = 0;
	/** @type {number} */ #generation = 0;
	/** @type {number} */ #requestCount = 0;
	/** @type {number} */ #maximumObservedRequests = 0;
	/** @type {Set<string>} */ #requestedPaths = new Set();
	/** @type {number | null} */ #peakMainHeapBytes = null;
	/** @type {number | null} */ #peakWorkerHeapBytes = null;
	/** @type {{degrees: number, texture: WebGLTexture, payloadSha256: string} | null} */ #active = null;
	/** @type {WebGL2RenderingContext} */ #gl;

	constructor() {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('webgl2');
		if (!context) throw new Error('E2 requires WebGL2 for measured consumer upload.');
		this.#gl = context;
	}

	/** @returns {number} - Bytes retained after unpinned LRU eviction. */
	get retainedBytes() {
		return this.#retainedBytes;
	}

	/** @returns {number} - Maximum permitted concurrent encoded-block requests. */
	get concurrency() {
		return 4;
	}

	/** @returns {CacheOptimizationE2TransportMetrics} - Observed browser transport counters. */
	get metrics() {
		return {requestCount: this.#requestCount, uniqueRequestCount: this.#requestedPaths.size, maximumObservedRequests: this.#maximumObservedRequests, peakMainHeapBytes: this.#peakMainHeapBytes, peakWorkerHeapBytes: this.#peakWorkerHeapBytes};
	}

	/** Sample a supported main-thread heap value without inventing unavailable values. */
	#sampleMainHeap() {
		const value = heapBytes();
		if (value !== null) this.#peakMainHeapBytes = Math.max(this.#peakMainHeapBytes ?? 0, value);
	}

	/**
	 * Run the work under the four-request scheduler.
	 *
	 * @param {() => Promise<CacheOptimizationE2BlockResult>} operation - One encoded-block request/decode operation.
	 * @returns {Promise<CacheOptimizationE2BlockResult>} - Operation result.
	 */
	#schedule(operation) {
		return new Promise((resolve, reject) => {
			const start = () => {
				this.#activeRequests += 1;
				void operation().then(resolve, reject).finally(() => {
					this.#activeRequests -= 1;
					this.#queue.shift()?.();
				}).catch(() => undefined);
			};
			if (this.#activeRequests < this.concurrency) start();
			else this.#queue.push(start);
		});
	}

	/** @param {string} identity - Artifact identity. @returns {void} - Makes entry most recently used. */
	#touch(identity) {
		const value = this.#lru.get(identity);
		if (!value) return;
		this.#lru.delete(identity);
		this.#lru.set(identity, value);
	}

	/** Evict only unpinned least-recent blocks until retention is bounded. */
	#evict() {
		for (const [identity, value] of this.#lru) {
			if (this.#retainedBytes <= DECODED_RETENTION_BYTES) break;
			if (this.#pins.has(identity)) continue;
			this.#lru.delete(identity);
			this.#retainedBytes -= value.byteLength;
		}
		if (this.#retainedBytes > DECODED_RETENTION_BYTES && ![...this.#lru.keys()].every((identity) => this.#pins.has(identity))) {
			throw new Error('E2 LRU failed to evict an available unpinned block.');
		}
	}

	/**
	 * Subscribe to a coalesced artifact fetch/decode. A cancelled final subscriber aborts the underlying fetch; a cancelled peer cannot cancel another subscriber.
	 *
	 * @param {{encodedSha256: string, decodedSha256: string, encodedByteLength: number, decodedByteLength: number, path: string}} block - Validated block descriptor.
	 * @param {string} root - Candidate root with optional deterministic fault route.
	 * @param {AbortSignal | undefined} signal - Independent subscriber cancellation.
	 * @returns {Promise<{value: Uint8Array, reused: boolean, transferMilliseconds: number, queueMilliseconds: number, decodeMilliseconds: number, inverseShuffleMilliseconds: number}>} - Decoded artifact and metrics.
	 */
	#block(block, root, signal) {
		const cached = this.#lru.get(block.encodedSha256);
		if (cached) {
			this.#touch(block.encodedSha256);
			return Promise.resolve({value: cached, reused: true, transferMilliseconds: 0, queueMilliseconds: 0, decodeMilliseconds: 0, inverseShuffleMilliseconds: 0});
		}
		let shared = this.#inflight.get(block.encodedSha256);
		if (!shared) {
			const controller = new AbortController();
			const promise = this.#schedule(async () => {
				const transferStarted = performance.now();
				this.#requestCount += 1;
				this.#maximumObservedRequests = Math.max(this.#maximumObservedRequests, this.#activeRequests);
				this.#requestedPaths.add(block.path);
				const response = await fetch(`${root}${block.path}`, {cache: 'force-cache', signal: controller.signal});
				if (!response.ok) throw new Error(`E2 block ${block.encodedSha256} failed with HTTP ${response.status}.`);
				const encoded = await response.arrayBuffer();
				const transferMilliseconds = performance.now() - transferStarted;
				if (encoded.byteLength !== block.encodedByteLength) throw new Error('E2 encoded block length is invalid.');
				if ((await sha256(encoded)) !== block.encodedSha256) throw new Error('E2 encoded block identity is invalid.');
				const decoded = await this.#decoder.decode(encoded, block.decodedByteLength);
				if (decoded.workerHeapBytes !== null) this.#peakWorkerHeapBytes = Math.max(this.#peakWorkerHeapBytes ?? 0, decoded.workerHeapBytes);
				if ((await sha256(decoded.decoded)) !== block.decodedSha256) throw new Error('E2 decoded block identity is invalid.');
				const value = new Uint8Array(decoded.decoded);
				this.#lru.set(block.encodedSha256, value);
				this.#retainedBytes += value.byteLength;
				this.#evict();
				this.#sampleMainHeap();
				return {value, reused: false, transferMilliseconds, ...decoded};
			}).finally(() => this.#inflight.delete(block.encodedSha256));
			void promise.catch(() => undefined);
			shared = {promise, controller, subscribers: 0};
			this.#inflight.set(block.encodedSha256, shared);
		}
		shared.subscribers += 1;
		return new Promise((resolve, reject) => {
			let settled = false;
			const release = () => {
				if (settled) return;
				settled = true;
				shared.subscribers -= 1;
				if (shared.subscribers === 0) shared.controller.abort();
			};
			const aborted = () => {
				release();
				reject(abortError('E2 subscriber cancelled.'));
			};
			if (signal?.aborted) return aborted();
			signal?.addEventListener('abort', aborted, {once: true});
			shared.promise.then(
				(value) => {
					signal?.removeEventListener('abort', aborted);
					if (!settled) {
						settled = true;
						shared.subscribers -= 1;
						resolve(value);
					}
				},
				(error) => {
					signal?.removeEventListener('abort', aborted);
					if (!settled) {
						settled = true;
						shared.subscribers -= 1;
						reject(error);
					}
				},
			);
		});
	}

	/**
	 * Fetch, exact-reconstruct, upload, and atomically publish one scene. A stale or failed transaction preserves the current active texture.
	 *
	 * @param {number} degrees - Representative scene selection.
	 * @param {{root?: string, signal?: AbortSignal, expectedStale?: boolean}} [options] - Fault route, independent signal, and stale expectation.
	 * @returns {Promise<CacheOptimizationE2SceneRecord>} - Raw per-scene decompaction and publication record.
	 */
	async loadScene(degrees, options = {}) {
		const root = options.root ?? '/candidate/';
		const signal = options.signal;
		const started = performance.now();
		const token = ++this.#generation;
		const catalog = acceptCatalog(await json(`${root}metadata/catalogs/runtime-catalog-fe937a81e6d804a8e854b3d0db31f9bdafa9420358e5fc0deef18b8d656391fe.json`));
		const configuration = acceptConfiguration(await json(`${root}metadata/configurations/configuration-manifest-e530e88a8ad7535a7c0039831362586409c7b950fdec776960ba46d808a7be56.json`));
		const blockIndex = acceptBlockIndex(await json(`${root}${configuration.blockIndex.path}`));
		const sceneEntry = catalog.scenes.find((entry) => entry.degrees === degrees);
		if (!sceneEntry) throw new Error(`E2 catalog lacks ${degrees}-degree scene.`);
		const scene = acceptScene(await json(`${root}${sceneEntry.manifest.path}`), configuration, blockIndex);
		const requiredIndexes = [...new Set(scene.segments.map((segment) => segment.blockIndex))];
		const blocks = requiredIndexes.map((index) => blockIndex.blocks[index]);
		for (const block of blocks) this.#pins.add(block.encodedSha256);
		const records = [];
		try {
			const settledBlocks = await Promise.all(
				blocks.map((block) =>
					this.#block(block, root, signal).then(
						(value) => ({value}),
						(error) => ({error}),
					),
				),
			);
			const failedBlock = settledBlocks.find((item) => 'error' in item);
			if (failedBlock && 'error' in failedBlock) throw failedBlock.error;
			const decoded = settledBlocks.map((item) => {
				if (!('value' in item)) throw new Error('E2 block outcome is unavailable.');
				return item.value;
			});
			if (signal?.aborted) throw abortError('E2 scene subscriber cancelled.');
			const byIndex = new Map(requiredIndexes.map((index, position) => [index, decoded[position].value]));
			const reconstruction = new Uint8Array(scene.payloadByteLength);
			const channelCount = configuration.channelCount;
			const directionRowByteLength = configuration.uniqueDirectionCount * Float32Array.BYTES_PER_ELEMENT;
			const sceneRowCount = scene.payloadByteLength / configuration.rowByteLength;
			let sceneRow = 0;
			for (const segment of scene.segments) {
				const bytes = byIndex.get(segment.blockIndex);
				const block = blockIndex.blocks[segment.blockIndex];
				if (!bytes || !block) throw new Error('E2 validated scene block is unavailable.');
				for (let channel = 0; channel < channelCount; channel += 1) {
					const firstByte = (channel * block.rowCount + segment.firstBlockRow) * directionRowByteLength;
					const targetByte = (channel * sceneRowCount + sceneRow) * directionRowByteLength;
					reconstruction.set(bytes.subarray(firstByte, firstByte + segment.rowCount * directionRowByteLength), targetByte);
				}
				sceneRow += segment.rowCount;
			}
			if (sceneRow !== sceneRowCount || (await sha256(reconstruction.buffer)) !== scene.payloadSha256) throw new Error('E2 scene reconstruction is not exact.');
			const uploadStarted = performance.now();
			const texture = this.#gl.createTexture();
			if (!texture) throw new Error('E2 could not allocate the measured upload texture.');
			this.#gl.bindTexture(this.#gl.TEXTURE_2D, texture);
			this.#gl.texParameteri(this.#gl.TEXTURE_2D, this.#gl.TEXTURE_MIN_FILTER, this.#gl.NEAREST);
			this.#gl.texParameteri(this.#gl.TEXTURE_2D, this.#gl.TEXTURE_MAG_FILTER, this.#gl.NEAREST);
			this.#gl.pixelStorei(this.#gl.UNPACK_ALIGNMENT, 4);
			this.#gl.texImage2D(this.#gl.TEXTURE_2D, 0, this.#gl.R32F, configuration.uniqueDirectionCount, reconstruction.byteLength / 4 / configuration.uniqueDirectionCount, 0, this.#gl.RED, this.#gl.FLOAT, new Float32Array(reconstruction.buffer));
			if (this.#gl.getError() !== this.#gl.NO_ERROR) throw new Error('E2 measured texture upload failed.');
			const uploadMilliseconds = performance.now() - uploadStarted;
			const publicationStarted = performance.now();
			let published = false;
			if (token === this.#generation) {
				const prior = this.#active;
				this.#active = {degrees, texture, payloadSha256: scene.payloadSha256};
				if (prior) this.#gl.deleteTexture(prior.texture);
				published = true;
			} else this.#gl.deleteTexture(texture);
			const publicationMilliseconds = performance.now() - publicationStarted;
			if (options.expectedStale !== undefined && published === options.expectedStale) throw new Error('E2 stale-publication expectation was not met.');
			for (const item of decoded) records.push(item);
			this.#sampleMainHeap();
			return /** @type {CacheOptimizationE2SceneRecord} */ ({
				degrees,
				requiredBlockCount: blocks.length,
				reusedBlockCount: decoded.filter((item) => item.reused).length,
				newlyDecodedBlockCount: decoded.filter((item) => !item.reused).length,
				encodedByteLength: blocks.reduce((sum, block) => sum + block.encodedByteLength, 0),
				decodedByteLength: blocks.reduce((sum, block) => sum + block.decodedByteLength, 0),
				workerQueueMilliseconds: decoded.reduce((sum, item) => sum + item.queueMilliseconds, 0),
				decompressionMilliseconds: decoded.reduce((sum, item) => sum + item.decodeMilliseconds, 0),
				inverseShuffleMilliseconds: decoded.reduce((sum, item) => sum + item.inverseShuffleMilliseconds, 0),
				transferMilliseconds: decoded.reduce((sum, item) => sum + item.transferMilliseconds, 0),
				uploadMilliseconds,
				publicationMilliseconds,
				elapsedMilliseconds: performance.now() - started,
				retainedBytes: this.#retainedBytes,
				published,
				payloadSha256: scene.payloadSha256,
			});
		} finally {
			for (const block of blocks) this.#pins.delete(block.encodedSha256);
			this.#evict();
		}
	}

	/** @returns {boolean} - Whether an active last-good texture exists. */
	hasActive() {
		return this.#active !== null;
	}

	/** Release owned browser resources. */
	dispose() {
		if (this.#active) this.#gl.deleteTexture(this.#active.texture);
		this.#decoder.dispose();
	}
}

/**
 * Execute browser E2 scenarios against the sealed E1 candidate graph.
 *
 * @returns {Promise<Record<string, unknown>>} - Accepted browser transport evidence.
 */
export async function runE2Browser() {
	const nativeZstandardSupported = (() => {
		try {
			new DecompressionStream(/** @type {any} */ ('zstd'));
			return true;
		} catch {
			return false;
		}
	})();
	const transport = new E2Transport();
	const heapBeforeBytes = heapBytes();
	let responsivenessTicks = 0;
	const responsivenessProbe = setInterval(() => {
		responsivenessTicks += 1;
	}, 5);
	try {
		const cold = await transport.loadScene(90);
		const adjacent = await transport.loadScene(91);
		const warm = await transport.loadScene(90);
		const nonadjacent = await transport.loadScene(30);
		const isolatedCancellationController = new AbortController();
		const coalescedCancelled = transport.loadScene(90, {root: '/delayed-candidate/', signal: isolatedCancellationController.signal}).then(
			() => ({name: 'resolved'}),
			(error) => ({name: error?.name ?? typeof error}),
		);
		const coalescedSurvivor = transport.loadScene(90, {root: '/delayed-candidate/'});
		await new Promise((resolve) => setTimeout(resolve, 20));
		const isolatedCancellationStarted = performance.now();
		isolatedCancellationController.abort();
		const isolatedCancellationOutcome = await coalescedCancelled;
		const isolatedCancellation = {name: isolatedCancellationOutcome.name, elapsedMilliseconds: performance.now() - isolatedCancellationStarted};
		const coalesced = await Promise.all([coalescedSurvivor]);
		if (isolatedCancellation?.name !== 'AbortError' || coalesced[0].published !== true) throw new Error('E2 independent subscriber cancellation was not isolated.');
		const activeBeforeFailure = transport.hasActive();
		let corruption;
		try {
			await transport.loadScene(30, {root: '/corrupt-candidate/'});
		} catch (error) {
			corruption = {name: error?.name ?? typeof error, message: error?.message ?? String(error), preservedActive: transport.hasActive() === activeBeforeFailure};
		}
		if (!corruption?.preservedActive) throw new Error('E2 corruption did not preserve the last-good texture.');
		const cancellationController = new AbortController();
		const cancelled = transport.loadScene(93, {root: '/delayed-candidate/', signal: cancellationController.signal}).then(
			() => ({name: 'resolved'}),
			(error) => ({name: error?.name ?? typeof error}),
		);
		await new Promise((resolve) => setTimeout(resolve, 20));
		const finalCancellationStarted = performance.now();
		cancellationController.abort();
		const cancellationOutcome = await cancelled;
		const cancellation = {name: cancellationOutcome.name, elapsedMilliseconds: performance.now() - finalCancellationStarted, preservedActive: transport.hasActive() === activeBeforeFailure};
		if (cancellation?.name !== 'AbortError' || !cancellation.preservedActive) throw new Error('E2 final-subscriber cancellation is not isolated.');
		const stale = transport.loadScene(91, {root: '/delayed-candidate/', expectedStale: true});
		await new Promise((resolve) => setTimeout(resolve, 20));
		const replacement = await transport.loadScene(92);
		const staleResult = await stale;
		if (staleResult.published !== false || replacement.published !== true) throw new Error('E2 stale response published over its replacement.');
		return /** @type {CacheOptimizationE2BrowserResult} */ ({
			schemaId: 'distant-sun-cache-optimization-e2-browser-result-v1',
			accepted: true,
			decoder: {nativeZstandardSupported, selected: 'three-r180-zstddec-wasm', implementation: 'WebAssembly fallback'},
			concurrency: transport.concurrency,
			retentionTargetBytes: DECODED_RETENTION_BYTES,
			retainedBytes: transport.retainedBytes,
			heapBeforeBytes,
			heapAfterBytes: heapBytes(),
			mainThreadResponsivenessTicks: responsivenessTicks,
			metrics: transport.metrics,
			perSceneDecompaction: [cold, adjacent, warm, nonadjacent, ...coalesced, replacement, staleResult],
			faults: {corruption, isolatedCancellation, cancellation, stalePublicationRejected: true},
		});
	} finally {
		clearInterval(responsivenessProbe);
		transport.dispose();
	}
}
