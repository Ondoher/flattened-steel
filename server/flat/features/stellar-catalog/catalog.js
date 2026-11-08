import {Service} from '@polylith/core';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Owns filesystem access and integrity checks for Flat's catalog and human presentation packages.
 *
 * @implements {FlatStellarCatalog}
 */
export class StellarCatalog extends Service {
	/**
	 * Registers the package owner without depending on another application's files at runtime.
	 *
	 * @param {unknown} registry - Owning application registry.
	 * @param {string} [root] - Explicit deployment data directory.
	 * @param {string} [humanRoot] - Explicit human presentation data directory.
	 */
	constructor(
		registry,
		root = process.env.FLAT_STELLAR_CATALOG_ROOT ??
			fileURLToPath(new URL('../../data/brightest-2000-stellar-package-v1/', import.meta.url)),
		humanRoot = process.env.FLAT_HUMAN_VISION_ROOT ??
			fileURLToPath(new URL('../../data/human-vision-filter-package-v1/', import.meta.url)),
	) {
		super('stellar-catalog', registry);
		this.root = path.resolve(root);
		this.humanRoot = path.resolve(humanRoot);
		this.implement(['start', 'load']);
		/** @type {Map<FlatStellarPackageKind, Promise<ReadonlyMap<string, FlatStellarAsset>>>} */
		this.pending = new Map();
	}

	/**
	 * Call this method to reset the package lifetime before server startup.
	 */
	start() {
		this.pending.clear();
	}

	/**
	 * Call this method to share authenticated bytes or retry a previous filesystem failure.
	 *
	 * @param {FlatStellarPackageKind} [kind] - Catalog or human presentation data.
	 * @returns {Promise<ReadonlyMap<string, FlatStellarAsset>>} - Complete package, never a partial set.
	 */
	load(kind = 'stars') {
		if (!this.pending.has(kind)) {
			let pending = this._load(kind).catch((error) => {
				if (this.pending.get(kind) === pending) {
					this.pending.delete(kind);
				}
				throw error;
			});
			this.pending.set(kind, pending);
		}
		return this.pending.get(kind);
	}

	/**
	 * Called by loading to authenticate manifest-declared files before exposing any asset.
	 *
	 * @param {FlatStellarPackageKind} kind - Selected operational package.
	 * @returns {Promise<ReadonlyMap<string, FlatStellarAsset>>} - Immutable-lifetime asset inventory.
	 */
	async _load(kind) {
		let human = kind === 'human-vision';
		let root = human ? this.humanRoot : this.root;
		let packageId = human ? 'human-vision-filter-package-v1' : 'brightest-2000-stellar-package-v1';
		let stat = await lstat(root);
		if (stat.isSymbolicLink() || !stat.isDirectory() || path.normalize(await realpath(root)) !== root) {
			throw new Error('The stellar package root must be an ordinary directory without links.');
		}
		let manifestBytes = await this._read(root, 'manifest.json');
		let manifest = JSON.parse(manifestBytes.toString('utf8'));
		if (
			manifest.schemaId !== `algorithm32-production-${packageId}` ||
			manifest.packageId !== packageId ||
			(!human && (manifest.memberCount !== 2000 || manifest.spectralChannelCount !== 15))
		) {
			throw new Error('The stellar package format is incompatible.');
		}
		let assets = new Map([['manifest.json', {bytes: manifestBytes, mediaType: 'application/json'}]]);
		let artifacts = human
			? [manifest.artifact]
			: ['roster', 'packets', 'members', 'spectra'].map((key) => manifest.artifacts?.[key]);
		for (let artifact of artifacts) {
			if (
				!artifact ||
				typeof artifact.path !== 'string' ||
				!/^[\w-]+\.(json|bin)$/.test(artifact.path) ||
				assets.has(artifact.path)
			) {
				throw new Error('The stellar package contains an invalid artifact filename.');
			}
			let bytes = await this._read(root, artifact.path);
			if (
				bytes.length !== artifact.byteLength ||
				createHash('sha256').update(bytes).digest('hex') !== artifact.sha256
			) {
				throw new Error(`Stellar artifact ${artifact.path} failed authentication.`);
			}
			assets.set(artifact.path, {
				bytes,
				mediaType: artifact.path.endsWith('.json') ? 'application/json' : 'application/octet-stream',
			});
		}
		return assets;
	}

	/**
	 * Called by authentication to read an ordinary contained file, rejecting symlinks and junctions.
	 *
	 * @param {string} root - Selected ordinary package directory.
	 * @param {string} name - Manifest filename already checked at the external boundary.
	 * @returns {Promise<Buffer>} - Exact operational bytes.
	 */
	async _read(root, name) {
		let filename = path.join(root, name);
		let stat = await lstat(filename);
		if (!stat.isFile() || stat.isSymbolicLink() || path.normalize(await realpath(filename)) !== filename) {
			throw new Error('Stellar artifacts must be ordinary contained files.');
		}
		return readFile(filename);
	}
}
new StellarCatalog();
