import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';

import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import B1Direct40CacheAssetManifest from './B1Direct40CacheAssetManifest.js';
import B1Direct40CacheAssetSetManifest from './B1Direct40CacheAssetSetManifest.js';

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

async function requireRealFile(root, relativePath) {
	const target = path.resolve(root, relativePath);
	const canonicalRoot = await realpath(root);
	const canonicalTarget = await realpath(target);
	if (canonicalTarget !== target || !canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
		throw new Error('B1 cache asset file escapes its manifest directory.');
	}
	const information = await lstat(canonicalTarget);
	if (!information.isFile() || information.isSymbolicLink()) {
		throw new Error('B1 cache asset path must identify a real file.');
	}
	return {target: canonicalTarget, information};
}

async function readSingleManifest(directory, pattern, label) {
	const names = (await readdir(directory)).filter((name) => pattern.test(name));
	if (names.length !== 1) throw new Error(`${label} requires exactly one content-addressed manifest.`);
	const {target} = await requireRealFile(directory, names[0]);
	const bytes = await readFile(target);
	const digest = sha256(bytes);
	if (!names[0].includes(digest)) throw new Error(`${label} filename does not authenticate its bytes.`);
	return {path: target, relativePath: names[0], bytes, sha256: digest, record: JSON.parse(bytes.toString('utf8'))};
}

/** Independent post-build authentication for B1 direct-40 condition assets and complete sets. */
export default class B1Direct40CacheAssetVerifier {
	static async verifyAsset({assetDirectory, condition, productionRevision = null}) {
		const requestedDirectory = path.resolve(assetDirectory);
		const canonicalDirectory = await realpath(requestedDirectory);
		if (canonicalDirectory !== requestedDirectory) throw new Error('B1 cache asset directory may not traverse a link.');
		const information = await lstat(canonicalDirectory);
		if (!information.isDirectory() || information.isSymbolicLink()) {
			throw new Error('B1 cache asset directory must be a real directory.');
		}
		const source = await readSingleManifest(
			canonicalDirectory,
			/^asset-manifest-[a-f0-9]{64}\.json$/u,
			'B1 cache asset',
		);
		const manifest = new B1Direct40CacheAssetManifest(source.record);
		const profile = createBrunetonProductionProfile({
			time: condition.localTime,
			fittedAzimuthDegrees: condition.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
		});
		manifest.requireCompatibility(profile, {id: condition.id, localTime: condition.localTime});
		if (productionRevision !== null && source.record.derivation.productionRevision !== productionRevision) {
			throw new Error('B1 cache asset production revision does not match its set.');
		}
		for (const payload of [source.record.cumulativeScatteringDensity, source.record.logicalToUniqueIndex]) {
			const {target, information: payloadInformation} = await requireRealFile(canonicalDirectory, payload.path);
			if (payloadInformation.size !== payload.byteLength) throw new Error('B1 cache asset payload byte length is invalid.');
			if (sha256(await readFile(target)) !== payload.sha256) throw new Error('B1 cache asset payload hash is invalid.');
		}
		const evidence = source.record.derivation.inputs.compilerEvidence;
		if (
			!evidence ||
			typeof evidence.path !== 'string' ||
			!Number.isInteger(evidence.byteLength) ||
			!/^([a-f0-9]{64})$/u.test(evidence.sha256)
		) {
			throw new Error('B1 cache asset compiler-evidence reference is invalid.');
		}
		const {target: evidenceTarget, information: evidenceInformation} = await requireRealFile(
			canonicalDirectory,
			evidence.path,
		);
		const evidenceBytes = await readFile(evidenceTarget);
		if (evidenceInformation.size !== evidence.byteLength || sha256(evidenceBytes) !== evidence.sha256) {
			throw new Error('B1 cache asset compiler evidence is not authentic.');
		}
		return {
			assetDirectory: canonicalDirectory,
			manifestPath: source.path,
			manifestRelativePath: source.relativePath,
			manifestSha256: source.sha256,
			manifest: source.record,
			profile,
		};
	}

	static async verifySet({setDirectory, productionRevision = null}) {
		const requestedDirectory = path.resolve(setDirectory);
		const canonicalDirectory = await realpath(requestedDirectory);
		if (canonicalDirectory !== requestedDirectory) throw new Error('B1 cache asset-set directory may not traverse a link.');
		const source = await readSingleManifest(
			canonicalDirectory,
			/^asset-set-manifest-[a-f0-9]{64}\.json$/u,
			'B1 cache asset set',
		);
		const setManifest = new B1Direct40CacheAssetSetManifest(source.record);
		if (productionRevision !== null && source.record.productionRevision !== productionRevision) {
			throw new Error('B1 cache asset-set production revision is incompatible.');
		}
		const assets = [];
		for (const expected of source.record.assets) {
			const manifestDirectory = path.dirname(path.resolve(canonicalDirectory, expected.manifestPath));
			const verified = await this.verifyAsset({
				assetDirectory: manifestDirectory,
				condition: expected.condition,
				productionRevision: source.record.productionRevision,
			});
			if (
				verified.manifestRelativePath !== path.basename(expected.manifestPath) ||
				verified.manifestSha256 !== expected.manifestSha256 ||
				verified.manifest.assetIdentity !== expected.assetIdentity ||
				verified.manifest.profile.id !== expected.profile.id ||
				verified.manifest.profile.contentHash !== expected.profile.contentHash
			) {
				throw new Error('B1 cache asset-set entry does not authenticate its condition asset.');
			}
			assets.push(verified);
		}
		return {setDirectory: canonicalDirectory, manifestPath: source.path, manifestSha256: source.sha256, manifest: source.record, assets};
	}
}
