import {writeFile} from 'node:fs/promises';
import path from 'node:path';

import {CreativeRunFiles} from './CreativeRunFiles.js';

/** Exact bounded JSON response snapshots that identify consumed rendering assets. */
export class CreativeResponseInputs {
	/**
	 * Creates a response snapshot owner for one newly allocated render run.
	 *
	 * @param {string} runDirectory - Validated new run directory.
	 */
	constructor(runDirectory) {
		/** Run-local response artifact directory. */
		this._runDirectory = runDirectory;
		/** Closed response identities and originating URLs. @type {CreativeNodeResponseIdentity[]} */
		this._records = [];
		/** Already retained bodies, keyed by exact SHA-256. @type {Set<string>} */
		this._bodyDigests = new Set();
		/** Pending small response reads, never binary payload reads. @type {Promise<void>[]} */
		this._pending = [];
		/** Cumulative retained unique bytes. */
		this._byteLength = 0;
		/** First snapshot failure, checked before run acceptance. @type {unknown} */
		this._failure = undefined;
		/** Terminal snapshot lifecycle guard. */
		this._closed = false;
	}

	/**
	 * Called by the response listener to identify only bounded cache selectors and content manifests.
	 *
	 * @param {string} responseUrl - Browser response URL.
	 * @returns {boolean} - Whether the exact response is an allowed provenance input.
	 */
	_accepts(responseUrl) {
		const url = new URL(responseUrl);
		if (url.origin !== 'http://127.0.0.1:8081') return false;
		return (
			url.pathname === '/flat32/api/distant-sun-scene-cache' ||
			/^\/flat32\/scene-caches\/packages\/[a-f0-9]{64}\/(?:scene-cache-manifest|packed-row-ledger)-[a-f0-9]{64}\.json$/u.test(
				url.pathname,
			) ||
			url.pathname === '/flat32/stellar-catalogs/brightest-2000-stellar-package-v1/manifest.json' ||
			url.pathname === '/flat32/presentation-filters/human-vision-filter-package-v1/manifest.json'
		);
	}

	/**
	 * Called by the response listener to retain one bounded exact body and URL association.
	 *
	 * @param {CreativeNodeBrowserResponse} response - Accepted loopback JSON response.
	 * @returns {Promise<void>} - Closed response snapshot publication.
	 */
	async _retain(response) {
		const declaredBytes = Number(response.headers()['content-length']);
		if (!Number.isSafeInteger(declaredBytes) || declaredBytes < 1 || declaredBytes > 256 * 1024) {
			throw new Error('Consumed render JSON response lacks a bounded Content-Length.');
		}
		const bytes = await response.buffer();
		if (bytes.byteLength !== declaredBytes) throw new Error('Consumed render JSON response length changed.');
		JSON.parse(bytes.toString('utf8'));
		const digest = CreativeRunFiles.sha256(bytes);
		const artifact = {path: `consumed-inputs/${digest}.json`, byteLength: bytes.byteLength, sha256: digest};
		if (!this._bodyDigests.has(digest)) {
			this._bodyDigests.add(digest);
			this._byteLength += bytes.byteLength;
			if (this._byteLength > 32 * 1024 * 1024) throw new Error('Consumed render JSON snapshots exceeded 32 MiB.');
			const destination = CreativeRunFiles.resolve(this._runDirectory, artifact.path);
			await CreativeRunFiles.requireRealPath(path.dirname(destination));
			await writeFile(destination, bytes, {flag: 'wx'});
		}
		this._records.push({url: response.url(), status: response.status(), artifact});
	}

	/**
	 * Call this method for a browser response to schedule a matching small JSON input snapshot.
	 * Binary cache payloads are excluded because the pinned production loader already authenticates them.
	 *
	 * @param {CreativeNodeBrowserResponse} response - Browser response observed during rendering.
	 * @returns {void} - Matching response scheduled for bounded retention.
	 */
	observe(response) {
		if (this._closed || !response.ok() || !this._accepts(response.url())) return;
		if (this._pending.length >= 8192) {
			this._failure ??= new Error('Consumed render JSON response count exceeded its bound.');
			return;
		}
		this._pending.push(
			this._retain(response).catch((error) => {
				this._failure ??= error;
			}),
		);
	}

	/**
	 * Call this method to close input capture and publish exact URL-to-body identities.
	 * Rejects any bounded-response capture failure before the render can be accepted.
	 *
	 * @returns {Promise<CreativeNodeConsumedInputs>} - Complete retained input metadata.
	 */
	async finalize() {
		this._closed = true;
		await Promise.all(this._pending);
		if (this._failure) throw this._failure;
		const summary = {
			schemaId: 'distant-sun-creative-consumed-inputs-v1',
			operation:
				'Retain exact small JSON response bytes, their URLs and body SHA-256 identities; preserve payload hashes and derivation identities carried by their manifests.',
			payloadValidationOwner:
				'src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheAssetLoader.js',
			payloadValidation:
				'The pinned production loader verifies manifest, ledger, exact-seam payload, and logical-index payload hashes before publishing each scene cache.',
			responseCount: this._records.length,
			uniqueBodyCount: this._bodyDigests.size,
			byteLength: this._byteLength,
			responses: [...this._records].sort((left, right) => left.url.localeCompare(right.url)),
		};
		await CreativeRunFiles.writeJson(this._runDirectory, 'consumed-inputs.json', summary);
		return summary;
	}
}
