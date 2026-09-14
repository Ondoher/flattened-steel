import {createHash} from 'node:crypto';
import {open, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {CreativeRunFiles} from '../../../distant-sun-shadow-animation-evidence/creative/node/CreativeRunFiles.js';

/**
 * Exclusive artifact publication for the browser's lossless captures, trace, and ordered MP4.
 *
 * @implements {CreativeNodeArtifacts}
 */
export class CreativeArtifactWriter {
	/**
	 * Creates an artifact writer restricted to a new validated run directory.
	 *
	 * @param {string} runDirectory - Newly allocated immutable-run destination.
	 * @param {StrobingRenderOptions} options - Accepted native capture dimensions and mode.
	 */
	constructor(runDirectory, options) {
		/** New run's validated absolute directory. */
		this._runDirectory = runDirectory;
		/** Native output configuration. */
		this._options = options;
		/** Published lossless capture identities. @type {CreativeNodeFileIdentity[]} */
		this.captures = [];
		/** Closed video identity. @type {CreativeNodeFileIdentity | undefined} */
		this.video = undefined;
		/** Published complete replay trace identity. @type {CreativeNodeFileIdentity | undefined} */
		this.trace = undefined;
		/** Owned open video stream. @type {CreativeNodeVideoHandle | undefined} */
		this._videoHandle = undefined;
		/** Exact accumulated MP4 content digest. */
		this._videoDigest = createHash('sha256');
		/** Accepted ordered chunk count. */
		this._chunkCount = 0;
		/** Appended video byte count. */
		this._videoBytes = 0;
		/** Concurrent artifact publication guard. */
		this._busy = false;
		/** Closed lifecycle guard against late browser callbacks. */
		this._closed = false;
	}

	/**
	 * Called by artifact entry points to acquire exclusive write ownership.
	 *
	 * @returns {void} - Exclusive publication ownership until the caller finishes.
	 */
	_claim() {
		if (this._closed || this._busy) throw new Error('Creative artifact writer is closed or already publishing.');
		this._busy = true;
	}

	/**
	 * Called by binary ingresses to validate bounded canonical Base64 before allocating bytes.
	 *
	 * @param {unknown} value - Encoded bytes from the browser.
	 * @param {number} maximumBytes - Maximum decoded byte length.
	 * @returns {Buffer} - Accepted nonempty bytes.
	 */
	_decode(value, maximumBytes) {
		if (
			typeof value !== 'string' ||
			value.length === 0 ||
			value.length > 4 * Math.ceil(maximumBytes / 3) ||
			value.length % 4 !== 0 ||
			!/^[A-Za-z0-9+/]*={0,2}$/u.test(value)
		) {
			throw new Error('Creative artifact Base64 payload is malformed or exceeds its bound.');
		}
		const bytes = Buffer.from(value, 'base64');
		if (bytes.byteLength === 0 || bytes.byteLength > maximumBytes || bytes.toString('base64') !== value) {
			throw new Error('Creative artifact bytes exceed their bound or use noncanonical encoding.');
		}
		return bytes;
	}

	/**
	 * Call this method to retain one native-resolution PNG with a safe capture name.
	 * Rejects duplicate names, dimensions different from the requested viewport, and oversized payloads.
	 *
	 * @param {unknown} name - Lowercase letters, digits, and hyphens without a path or extension.
	 * @param {unknown} dataUrl - PNG data URL produced by the rendered canvas.
	 * @returns {Promise<CreativeNodeFileIdentity>} - Closed lossless capture identity.
	 */
	async capture(name, dataUrl) {
		this._claim();
		try {
			if (typeof name !== 'string' || !/^[a-z0-9][a-z0-9-]{0,95}$/u.test(name) || this.captures.length >= 1800) {
				throw new Error('Creative capture name or capture count is invalid.');
			}
			if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
				throw new Error('Creative capture must be a PNG data URL.');
			}
			const bytes = this._decode(dataUrl.slice('data:image/png;base64,'.length), 64 * 1024 * 1024);
			if (
				bytes.byteLength < 33 ||
				!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
				bytes.toString('ascii', 12, 16) !== 'IHDR' ||
				bytes.readUInt32BE(16) !== this._options.width ||
				bytes.readUInt32BE(20) !== this._options.height
			) {
				throw new Error('Creative capture PNG signature or native dimensions are invalid.');
			}
			const relativePath = `captures/${name}.png`;
			const destination = CreativeRunFiles.resolve(this._runDirectory, relativePath);
			await CreativeRunFiles.requireRealPath(path.dirname(destination));
			await writeFile(destination, bytes, {flag: 'wx'});
			const identity = {path: relativePath, byteLength: bytes.byteLength, sha256: CreativeRunFiles.sha256(bytes)};
			this.captures.push(identity);
			return identity;
		} finally {
			this._busy = false;
		}
	}

	/**
	 * Call this method to append the next MP4 chunk in strict sequence.
	 * Rejects offsets or sequence numbers that differ from the retained stream and chunks above four MiB.
	 *
	 * @param {unknown} index - Zero-based monotonically increasing chunk index.
	 * @param {unknown} byteOffset - Exact current stream byte count.
	 * @param {unknown} base64 - Canonical Base64 chunk, at most four MiB decoded.
	 * @returns {Promise<number>} - Updated complete stream byte count.
	 */
	async writeVideoChunk(index, byteOffset, base64) {
		this._claim();
		try {
			if (
				this._options.mode !== 'video' ||
				this.video ||
				index !== this._chunkCount ||
				byteOffset !== this._videoBytes
			) {
				throw new Error('Creative video chunk mode, ordering, offset, or lifecycle is invalid.');
			}
			const bytes = this._decode(base64, 4 * 1024 * 1024);
			if (this._videoBytes + bytes.byteLength > 2 * 1024 * 1024 * 1024) {
				throw new Error('Creative video exceeded its two-GiB publication bound.');
			}
			if (!this._videoHandle) {
				if (bytes.byteLength < 12 || bytes.toString('ascii', 4, 8) !== 'ftyp') {
					throw new Error('Creative MP4 stream did not begin with a file-type box.');
				}
				const destination = CreativeRunFiles.resolve(this._runDirectory, 'captures/creative-full-day.mp4');
				await CreativeRunFiles.requireRealPath(path.dirname(destination));
				this._videoHandle = await open(destination, 'wx');
			}
			let written = 0;
			while (written < bytes.byteLength) {
				const result = await this._videoHandle.write(bytes, written, bytes.byteLength - written, null);
				if (result.bytesWritten < 1) throw new Error('Creative MP4 append made no progress.');
				written += result.bytesWritten;
			}
			this._videoDigest.update(bytes);
			this._videoBytes += bytes.byteLength;
			this._chunkCount += 1;
			return this._videoBytes;
		} finally {
			this._busy = false;
		}
	}

	/**
	 * Call this method to close the fully appended sixty-second video.
	 *
	 * @param {unknown} metadata - Browser encoder metadata, including exact bytes, frame count, and duration.
	 * @returns {Promise<CreativeNodeFileIdentity>} - Closed MP4 identity.
	 */
	async finalizeVideo(metadata) {
		this._claim();
		try {
			if (!metadata || typeof metadata !== 'object' || !this._videoHandle || this.video) {
				throw new Error('Creative video cannot be finalized in its current state.');
			}
			const accepted = /** @type {CreativeNodeVideoMetadata} */ (metadata);
			if (
				accepted.byteLength !== this._videoBytes ||
				accepted.frameCount !== this._options.durationSeconds * 30 ||
				accepted.durationSeconds !== this._options.durationSeconds
			) {
				throw new Error('Creative video metadata does not match the declared stream.');
			}
			await this._videoHandle.sync();
			await this._videoHandle.close();
			this._videoHandle = undefined;
			this.video = {
				path: 'captures/creative-full-day.mp4',
				byteLength: this._videoBytes,
				sha256: this._videoDigest.digest('hex'),
			};
			await CreativeRunFiles.writeJson(this._runDirectory, 'video-metadata.json', {
				...accepted,
				chunkCount: this._chunkCount,
				artifact: this.video,
			});
			return this.video;
		} finally {
			this._busy = false;
		}
	}

	/**
	 * Call this method to publish one complete deterministic scene replay trace.
	 *
	 * @param {unknown} trace - JSON-serializable trace object at most 32 MiB encoded.
	 * @returns {Promise<CreativeNodeFileIdentity>} - Closed trace identity.
	 */
	async writeTrace(trace) {
		this._claim();
		try {
			if (this.trace || !trace || typeof trace !== 'object')
				throw new Error('Creative trace must be a new object.');
			const bytes = Buffer.from(`${JSON.stringify(trace, null, 2)}\n`, 'utf8');
			if (bytes.byteLength > 32 * 1024 * 1024) throw new Error('Creative trace exceeded its 32-MiB bound.');
			await CreativeRunFiles.requireRealPath(this._runDirectory);
			await writeFile(path.join(this._runDirectory, 'scene-trace.json'), bytes, {flag: 'wx'});
			this.trace = {
				path: 'scene-trace.json',
				byteLength: bytes.byteLength,
				sha256: CreativeRunFiles.sha256(bytes),
			};
			return this.trace;
		} finally {
			this._busy = false;
		}
	}

	/**
	 * Call this method to close unfinished publication and reject all later browser callbacks.
	 *
	 * @returns {Promise<void>} - Closed writer lifecycle.
	 */
	async close() {
		this._closed = true;
		if (this._videoHandle) {
			await this._videoHandle.close();
			this._videoHandle = undefined;
		}
	}
}
