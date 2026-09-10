import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import DistantSunSharedCacheFormat from '../../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheFormat.js';
import {
	FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID,
	FLAT32_DISTANT_SUN_SHARED_CACHE_FORMAT_ID,
} from '../../../../src/flat32/consts.js';

/** Authenticated immutable shared-package selection and complete-file delivery. */
export default class DistantSunSharedCachePackageService {
	/** Ordinary repository-contained package root. @type {string} */
	_root;
	/** Exact allowed artifact identities. @type {Map<string, DistantSunSharedCacheFileIdentity>} */
	_files = new Map();
	/** Authenticated report identity. @type {DistantSunSharedCacheFileIdentity} */
	_report;
	/** Content-addressed package identity. */
	_identity = '';

	/** Creates a service with an implementation-derived repository boundary.
	 *
	 * @param {string} root - Candidate package directory.
	 */
	constructor(root) {
		const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
		this._root = path.resolve(root);
		const relative = path.relative(repository, this._root);
		if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
			throw new RangeError('Shared package root must remain inside the repository.');
	}

	/** Call this method to resolve only ordinary contained path components.
	 *
	 * @param {string} name - Strict package-relative artifact path.
	 *
	 * @returns {Promise<string>} - Validated ordinary file path.
	 */
	async _resolve(name) {
		if (
			typeof name !== 'string' ||
			!/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u.test(name) ||
			name.split('/').some((part) => part === '.' || part === '..')
		)
			throw new RangeError('Invalid shared artifact path.');
		const target = path.join(this._root, ...name.split('/'));
		const parsed = path.parse(target);
		let current = parsed.root;
		for (const part of target.slice(parsed.root.length).split(path.sep)) {
			current = path.join(current, part);
			if (
				(await lstat(current)).isSymbolicLink() ||
				path.resolve(await realpath(current)).toLowerCase() !== current.toLowerCase()
			)
				throw new RangeError('Shared artifact path traverses an alias.');
		}
		if (!(await lstat(target)).isFile()) throw new RangeError('Shared artifact must be an ordinary file.');
		return target;
	}

	/** Call this method to authenticate one bounded complete artifact before exposing bytes.
	 *
	 * @param {DistantSunSharedCacheFileIdentity} identity - Exact trusted bytes.
	 *
	 * @returns {Promise<Buffer>} - Complete authenticated artifact.
	 */
	async _read(identity) {
		if (
			!Number.isSafeInteger(identity?.byteLength) ||
			identity.byteLength < 1 ||
			identity.byteLength > 32 * 1024 * 1024 ||
			!/^[a-f0-9]{64}$/u.test(identity.sha256)
		)
			throw new RangeError('Invalid shared artifact identity.');
		const file = await this._resolve(identity.path);
		if ((await lstat(file)).size !== identity.byteLength) throw new Error('Shared artifact length mismatch.');
		const bytes = await readFile(file);
		if (
			bytes.length !== identity.byteLength ||
			createHash('sha256').update(bytes).digest('hex') !== identity.sha256
		)
			throw new Error('Shared artifact authentication failed.');
		return bytes;
	}

	/** Call this method to admit a package only after its complete metadata graph authenticates.
	 *
	 * @param {DistantSunSharedCacheFileIdentity} reportIdentity - Trusted qualification report identity.
	 *
	 * @returns {Promise<DistantSunSharedCachePackageService>} - Initialized service.
	 */
	async load(reportIdentity) {
		if (this._identity) throw new Error('Shared package service is already initialized.');
		if (reportIdentity.path !== 'package-set.json') throw new RangeError('Shared report path is invalid.');
		const format = new DistantSunSharedCacheFormat();
		const accepted = new Map();
		let metadataBytes = 0;
		const read = async (identity) => {
			metadataBytes += identity.byteLength;
			if (metadataBytes > 32 * 1024 * 1024) throw new RangeError('Shared metadata exceeds its bound.');
			const bytes = await this._read(identity);
			accepted.set(identity.path, identity);
			return bytes;
		};
		const report = format.parsePackageSetReport((await read(reportIdentity)).toString('utf8'));
		if (
			report.configurations.length !== 1 ||
			report.packageSetIdentity !==
				createHash('sha256')
					.update(
						JSON.stringify({
							configuration: report.configurations[0],
							runtimeCatalog: report.runtimeCatalog,
						}),
					)
					.digest('hex')
		)
			throw new Error('Shared package identity mismatch.');
		const configuration = format.parseConfigurationManifest(
			(await read(report.configurations[0])).toString('utf8'),
		);
		const blocks = format.parseBlockIndex((await read(configuration.blockIndex)).toString('utf8'), configuration);
		await read(configuration.directionLayout.logicalToUniqueIndex);
		const catalog = format.parseRuntimeCatalog((await read(report.runtimeCatalog)).toString('utf8'));
		if (catalog.configurationIdentity !== configuration.configurationIdentity)
			throw new Error('Shared catalog configuration mismatch.');
		for (const entry of catalog.scenes) {
			const scene = format.parseSceneManifest(
				(await read(entry.manifest)).toString('utf8'),
				configuration,
				blocks,
			);
			if (
				scene.id !== entry.id ||
				scene.representativeSolarZenithDegrees !== entry.representativeSolarZenithDegrees
			)
				throw new Error('Shared scene identity mismatch.');
		}
		for (const block of blocks.blocks) accepted.set(block.encoded.path, block.encoded);
		this._files = accepted;
		this._identity = report.packageSetIdentity;
		this._report = {...reportIdentity};
		return this;
	}

	/** Call this method to select an authenticated package for one scalar input.
	 *
	 * @param {number} degrees - Observer solar zenith in degrees.
	 *
	 * @param {string} base - Application-owned asset URL directory.
	 *
	 * @returns {Flat32DistantSunCacheResolution} - Versioned ready or dark selection.
	 */
	resolve(degrees, base) {
		if (!this._identity) throw new Error('Shared package is not initialized.');
		if (!Number.isFinite(degrees) || degrees < 0 || degrees > 180) throw new RangeError('Invalid solar zenith.');
		if (typeof base !== 'string' || !base.endsWith('/')) throw new RangeError('Invalid asset base.');
		const common = /** @type {const} */ ({
			schemaId: FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID,
			cacheFormat: FLAT32_DISTANT_SUN_SHARED_CACHE_FORMAT_ID,
			requestedSolarZenithDegrees: degrees,
			asset: {
				rootUrl: `${base}${this._identity}/`,
				packageSetIdentity: this._identity,
				report: {...this._report},
				transitionQualification: {
					evidenceId: 'sha256:4544d8f0f881d9f32208adab945858b614cef22ee80b2ded0eb078ec4f2e5dce',
					targetId: 'NVIDIA GeForce RTX 2060 / Chrome 153 / ANGLE D3D11',
					maximumBytes: 859963392,
				},
			},
		});
		if (degrees >= 108) return {...common, status: 'dark'};
		return {
			...common,
			status: 'ready',
			representativeSolarZenithDegrees: Math.floor(degrees + 0.5),
		};
	}

	/** Call this method to return one whitelisted, authenticated complete file.
	 *
	 * @param {string} relativePath - Content-addressed request path.
	 *
	 * @returns {Promise<SharedCacheServedArtifact>} - Complete response data.
	 */
	async resolveAsset(relativePath) {
		const prefix = `${this._identity}/`;
		if (!this._identity || !relativePath.startsWith(prefix)) throw new RangeError('Unknown shared package.');
		const name = relativePath.slice(prefix.length);
		const identity = this._files.get(name);
		if (!identity) throw new RangeError('Unknown shared artifact.');
		return {
			bytes: await this._read(identity),
			byteLength: identity.byteLength,
			contentType: name.endsWith('.json') ? 'application/json' : 'application/octet-stream',
		};
	}
}
