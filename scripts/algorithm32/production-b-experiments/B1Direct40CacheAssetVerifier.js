import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import DistantSunSharedCacheGenerationFiles from '../solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';
import DistantSunPointLocalCacheReader from '../solar-zenith-cache/DistantSunPointLocalCacheReader.js';
import {DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY} from '../solar-zenith-cache/consts.js';
import B1ReferenceInputs from '../../experiments/b1-directional-sky-radiance/B1ReferenceInputs.js';
import {EXPECTED_DATASET_FINGERPRINTS} from '../../experiments/b1-directional-sky-radiance/benchmark.js';

import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import B1Direct40CacheAssetManifest, {B1_POINT_LOCAL_CACHE_ASSET_SCHEMA} from './B1Direct40CacheAssetManifest.js';
import B1Direct40CacheAssetSetManifest from './B1Direct40CacheAssetSetManifest.js';

/** Called by evidence authentication to hash exact input bytes.
 *
 * @param {Uint8Array|string} bytes - Bytes or canonical JSON text to authenticate.
 * @returns {string} - Lowercase SHA-256 digest.
 */
function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

/** Called by evidence reads to reject aliases and require an ordinary contained file.
 *
 * @param {string} root - Absolute evidence root.
 * @param {string} relativePath - Evidence-relative file name.
 * @returns {Promise<object>} - Checked target and filesystem facts.
 */
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

/** Called by evidence authentication to read the sole content-addressed manifest.
 *
 * @param {string} directory - Absolute evidence directory.
 * @param {RegExp} pattern - Accepted manifest filename pattern.
 * @param {string} label - Evidence owner used in diagnostics.
 * @returns {Promise<object>} - Authenticated manifest bytes, identity, and parsed record.
 */
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
	/** Authenticate the successful compiler record, its inputs, and the indexed scene consumed by this asset. */
	static async _verifyPointLocalEvidence(evidence, manifest, compilationPayloads) {
		const {compilation, sourceIdentity, scene} = evidence;
		const expectedInputs = {bundle: B1ReferenceInputs.identity(), ...EXPECTED_DATASET_FINGERPRINTS};
		if (
			evidence.schemaId !== 'algorithm32-b1-point-local-compiler-evidence-v1' ||
			compilation?.accepted !== true ||
			compilation.compilerIdentity !== DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY ||
			manifest.derivation.compilerIdentity !== compilation.compilerIdentity ||
			evidence.packageIdentity !== compilation.packageIdentity ||
			manifest.derivation.inputs.packageIdentity !== compilation.packageIdentity ||
			sourceIdentity?.identity !== manifest.derivation.productionRevision ||
			sourceIdentity.identity !== `sha256:${sha256(JSON.stringify(sourceIdentity.sources))}` ||
			JSON.stringify(evidence.referenceInputs) !== JSON.stringify(expectedInputs) ||
			JSON.stringify(manifest.derivation.inputs.referenceInputs) !== JSON.stringify(expectedInputs) ||
			JSON.stringify(scene?.ledger) !== JSON.stringify(manifest.ledger) ||
			scene.request.id !== manifest.condition.id ||
			scene.request.profileIdentity.contentHash !== manifest.profile.contentHash
		)
			throw new Error('Point-local compiler evidence is incompatible with the asset derivation.');
		const files = new DistantSunSharedCacheGenerationFiles(
			path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
		);
		const root = compilation.outputDirectory;
		if (typeof root !== 'string' || !root.startsWith('tmp/algorithm32/point-local-cache-compiler/'))
			throw new Error('Point-local compilation evidence must remain in its production output root.');
		const readArtifact = async (artifact) => {
			if (!artifact?.path?.startsWith(`${root}/`))
				throw new Error('Point-local compiler artifact escapes its compilation.');
			return JSON.parse((await files.read(artifact.path, artifact)).toString('utf8'));
		};
		const [packet, input, implementation] = await Promise.all([
			readArtifact(compilation.manifest),
			readArtifact(compilation.input),
			readArtifact(compilation.implementation),
		]);
		const completion = JSON.parse((await files.read(`${root}/complete.json`)).toString('utf8'));
		const {packageIdentity, ...packageRecord} = packet;
		if (
			JSON.stringify(completion) !== JSON.stringify(compilation) ||
			packageIdentity !== compilation.packageIdentity ||
			packageIdentity !== `sha256:${sha256(JSON.stringify(packageRecord))}` ||
			JSON.stringify(packet.implementation) !== JSON.stringify(implementation) ||
			JSON.stringify(packet.buildRequest) !== JSON.stringify(input.buildRequest) ||
			JSON.stringify(packet.scenes[scene.ordinal]) !== JSON.stringify(scene) ||
			JSON.stringify(input.scenes[scene.ordinal]) !== JSON.stringify(scene.request) ||
			compilation.sceneCount !== 17 ||
			compilation.channelCount !== 40
		)
			throw new Error(
				'Point-local compiler artifacts do not authenticate the declared successful scene compilation.',
			);
		if (!compilationPayloads.has(compilation.manifest.sha256)) {
			const reader = new DistantSunPointLocalCacheReader();
			await reader.prepareStaging(files, packet, `${root}/staging`);
			const directions = await reader.readDirectionMap(files, packet);
			const hashes = packet.scenes.map(() => createHash('sha256'));
			for (let channel = 0; channel < packet.layout.channelCount; channel += 1) {
				const shared = await reader.readChannel(files, packet, channel);
				for (const candidate of packet.scenes)
					hashes[candidate.ordinal].update(reader.expandUnique(files, packet, candidate.ordinal, shared));
			}
			compilationPayloads.set(compilation.manifest.sha256, {
				directionsSha256: sha256(directions),
				sceneSha256: hashes.map((hash) => hash.digest('hex')),
			});
		}
		const payloads = compilationPayloads.get(compilation.manifest.sha256);
		if (
			payloads.directionsSha256 !== manifest.logicalToUniqueIndex.sha256 ||
			payloads.sceneSha256[scene.ordinal] !== manifest.cumulativeScatteringDensity.sha256
		)
			throw new Error('Point-local asset payload does not reproduce its authenticated compiler scene.');
	}
	static async verifyAsset({assetDirectory, condition, productionRevision = null, compilationPayloads = new Map()}) {
		const requestedDirectory = path.resolve(assetDirectory);
		const canonicalDirectory = await realpath(requestedDirectory);
		if (canonicalDirectory !== requestedDirectory)
			throw new Error('B1 cache asset directory may not traverse a link.');
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
			positionDomain: source.record.domains.position.selection,
		});
		manifest.requireCompatibility(profile, {id: condition.id, localTime: condition.localTime});
		if (productionRevision !== null && source.record.derivation.productionRevision !== productionRevision) {
			throw new Error('B1 cache asset production revision does not match its set.');
		}
		for (const payload of [source.record.cumulativeScatteringDensity, source.record.logicalToUniqueIndex]) {
			const {target, information: payloadInformation} = await requireRealFile(canonicalDirectory, payload.path);
			if (payloadInformation.size !== payload.byteLength)
				throw new Error('B1 cache asset payload byte length is invalid.');
			if (sha256(await readFile(target)) !== payload.sha256)
				throw new Error('B1 cache asset payload hash is invalid.');
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
		if (source.record.schemaId === B1_POINT_LOCAL_CACHE_ASSET_SCHEMA)
			await this._verifyPointLocalEvidence(
				JSON.parse(evidenceBytes.toString('utf8')),
				source.record,
				compilationPayloads,
			);
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
		if (canonicalDirectory !== requestedDirectory)
			throw new Error('B1 cache asset-set directory may not traverse a link.');
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
		const compilationPayloads = new Map();
		for (const expected of source.record.assets) {
			const manifestDirectory = path.dirname(path.resolve(canonicalDirectory, expected.manifestPath));
			const verified = await this.verifyAsset({
				assetDirectory: manifestDirectory,
				condition: expected.condition,
				productionRevision: source.record.productionRevision,
				compilationPayloads,
			});
			if (
				(verified.manifest.domains.position.selection ?? 'native48') !==
					(source.record.positionDomain ?? 'native48') ||
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
		return {
			setDirectory: canonicalDirectory,
			manifestPath: source.path,
			manifestSha256: source.sha256,
			manifest: source.record,
			assets,
		};
	}
}
