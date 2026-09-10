import DistantSunSharedCacheFormat from './DistantSunSharedCacheFormat.js';
import {DISTANT_SUN_SHARED_CACHE_METADATA_BYTES} from './consts.js';

/**
 * Authenticated browser metadata graph and immutable block-request owner.
 *
 * @implements {DistantSunSharedCachePackageSource}
 */
export default class DistantSunSharedCachePackage {
	/**
	 * Accepted, privately owned metadata graph.
	 *
	 * @type {DistantSunSharedCachePackageGraph}
	 */
	_graph;
	/**
	 * Contained same-origin immutable asset root.
	 *
	 * @type {URL}
	 */
	_root;
	/**
	 * Creates an internal package after every metadata edge has been authenticated.
	 *
	 * @private
	 * @param {URL} root - Validated immutable asset root.
	 * @param {DistantSunSharedCachePackageGraph} graph - Authenticated graph.
	 */
	constructor(root, graph) {
		this._root = root;
		this._graph = structuredClone(graph);
	}

	/**
	 * Called to hash exact artifact bytes.
	 *
	 * @param {Uint8Array} bytes - Complete bytes.
	 * @returns {Promise<string>} - Lowercase SHA-256 identity.
	 */
	static async _hash(bytes) {
		const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer);
		return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Call this method to authenticate the complete bounded package graph before any block preparation.
	 *
	 * @param {DistantSunSharedCachePackageRequest} request - Trusted root identity and browser capabilities.
	 * @returns {Promise<DistantSunSharedCachePackage>} - Authenticated package owner.
	 */
	static async load(request) {
		const root = new URL(request.rootUrl);
		if (
			!/^https?:$/u.test(root.protocol) ||
			root.username ||
			root.password ||
			root.search ||
			root.hash ||
			!root.pathname.endsWith('/') ||
			root.origin !== globalThis.location?.origin
		)
			throw new RangeError('Shared-cache package root must be a same-origin HTTP directory.');
		const format = new DistantSunSharedCacheFormat();
		const fetchFile = request.fetch ?? globalThis.fetch.bind(globalThis);
		let total = 0;
		const read = async (identity) => {
			request.signal.throwIfAborted();
			if (
				!identity ||
				!Number.isSafeInteger(identity.byteLength) ||
				identity.byteLength <= 0 ||
				!/^[a-f0-9]{64}$/u.test(identity.sha256) ||
				typeof identity.path !== 'string' ||
				!identity.path
					.split('/')
					.every((part) => /^[A-Za-z0-9._-]+$/u.test(part) && part !== '.' && part !== '..') ||
				total + identity.byteLength > DISTANT_SUN_SHARED_CACHE_METADATA_BYTES
			)
				throw new RangeError('Shared-cache metadata identity or total allocation bound is invalid.');
			total += identity.byteLength;
			const response = await fetchFile(new URL(identity.path, root), {
				signal: request.signal,
				redirect: 'error',
				credentials: 'same-origin',
			});
			if (!response.ok || !response.body) throw new Error('Shared-cache metadata request failed.');
			const bytes = new Uint8Array(identity.byteLength);
			const reader = response.body.getReader();
			try {
				let offset = 0;
				while (true) {
					const {done, value} = await reader.read();
					request.signal.throwIfAborted();
					if (done) break;
					if (offset + value.byteLength > bytes.length)
						throw new RangeError('Shared-cache metadata is oversized.');
					bytes.set(value, offset);
					offset += value.byteLength;
				}
				if (offset !== bytes.length || (await this._hash(bytes)) !== identity.sha256)
					throw new Error('Shared-cache metadata length or hash is incompatible.');
				request.signal.throwIfAborted();
				return bytes;
			} finally {
				await reader.cancel().catch(() => {});
				reader.releaseLock();
			}
		};
		const json = async (identity) => new TextDecoder('utf-8', {fatal: true}).decode(await read(identity));
		const report = format.parsePackageSetReport(await json(request.report));
		if (
			report.configurations.length !== 1 ||
			report.packageSetIdentity !==
				(await this._hash(
					new TextEncoder().encode(
						JSON.stringify({
							configuration: report.configurations[0],
							runtimeCatalog: report.runtimeCatalog,
						}),
					),
				))
		)
			throw new Error('Shared-cache package identity is incompatible.');
		const configuration = format.parseConfigurationManifest(await json(report.configurations[0]));
		const blockIndex = format.parseBlockIndex(await json(configuration.blockIndex), configuration);
		const mapBytes = await read(configuration.directionLayout.logicalToUniqueIndex);
		const logicalToUniqueIndex = new Uint16Array(mapBytes.buffer);
		const catalog = format.parseRuntimeCatalog(await json(report.runtimeCatalog));
		if (catalog.configurationIdentity !== configuration.configurationIdentity)
			throw new Error('Shared-cache catalog configuration is incompatible.');
		const scenes = [];
		for (const entry of catalog.scenes) {
			const scene = format.parseSceneManifest(await json(entry.manifest), configuration, blockIndex);
			if (
				scene.id !== entry.id ||
				scene.representativeSolarZenithDegrees !== entry.representativeSolarZenithDegrees
			)
				throw new Error('Shared-cache catalog and scene selection disagree.');
			scenes.push(scene);
		}
		return new DistantSunSharedCachePackage(root, {
			configuration,
			blockIndex,
			scenes,
			logicalToUniqueIndex,
			catalogSha256: report.runtimeCatalog.sha256,
		});
	}

	/**
	 * Call this method to obtain an independently owned authenticated metadata snapshot.
	 *
	 * @returns {DistantSunSharedCachePackageGraph} - Complete graph for one controller.
	 */
	getGraph() {
		return structuredClone(this._graph);
	}

	/**
	 * Call this method to obtain a contained block URL from its authenticated identity.
	 *
	 * @param {string} id - Logical block identity.
	 * @returns {string} - Same-origin artifact URL.
	 */
	getBlockUrl(id) {
		const block = this._graph.blockIndex.blocks.find((item) => item.id === id);
		if (!block) throw new RangeError('Shared-cache block is outside this package.');
		return new URL(block.encoded.path, this._root).href;
	}
}
