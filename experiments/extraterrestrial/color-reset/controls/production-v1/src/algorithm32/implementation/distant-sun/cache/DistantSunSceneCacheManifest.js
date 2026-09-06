import {
	DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
	DISTANT_SUN_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID,
} from './consts.js';

/** Accepted external manifest for one complete point-local distant-Sun scene cache. */
export default class DistantSunSceneCacheManifest {
	/** @readonly @type {DistantSunSceneCacheManifestRecord} */ record;

	/**
	 * Called by manifest acceptance to require one lowercase SHA-256 value.
	 *
	 * @param {string} value - The candidate content hash.
	 * @param {string} label - The diagnostic label.
	 * @returns {void} - No value.
	 */
	_requireSha256(value, label) {
		if (!/^[a-f0-9]{64}$/u.test(value)) {
			throw new RangeError(`${label} must be a lowercase SHA-256 hash.`);
		}
	}

	/**
	 * Called by manifest acceptance to validate one content-addressed payload reference.
	 *
	 * @param {DistantSunSceneCachePayloadReference} payload - The external payload reference.
	 * @param {string} expectedCodecId - The required codec identity.
	 * @param {string} label - The diagnostic label.
	 * @returns {void} - No value.
	 */
	_requirePayload(payload, expectedCodecId, label) {
		if (!payload || payload.codecId !== expectedCodecId) {
			throw new RangeError(`${label} codec identity is incompatible.`);
		}
		if (!Number.isInteger(payload.byteLength) || payload.byteLength <= 0) {
			throw new RangeError(`${label} byte length must be a positive integer.`);
		}
		if (!payload.path || payload.path.startsWith('/') || payload.path.includes('..')) {
			throw new RangeError(`${label} path must be asset-relative.`);
		}
		this._requireSha256(payload.sha256, `${label} hash`);
	}

	/**
	 * Creates an accepted manifest after validating the serialized external ingress once.
	 *
	 * @param {DistantSunSceneCacheManifestRecord} record - The serialized scene-cache manifest.
	 */
	constructor(record) {
		if (record.schemaId !== DISTANT_SUN_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID) {
			throw new RangeError('Distant-Sun scene-cache manifest schema is incompatible.');
		}
		if (!record.cacheIdentity || !record.sceneSun?.id || !record.derivation) {
			throw new RangeError('Distant-Sun scene-cache manifest identity and derivation are required.');
		}
		if (!record.ledgerPath || record.ledgerPath.startsWith('/') || record.ledgerPath.includes('..')) {
			throw new RangeError('Distant-Sun scene-cache ledger path must be asset-relative.');
		}
		this._requireSha256(record.ledgerSha256, 'Distant-Sun scene-cache ledger hash');
		if (
			!Number.isInteger(record.selection?.representativeSolarZenithDegrees) ||
			!Number.isFinite(record.selection?.minimumInputDegrees) ||
			!Number.isFinite(record.selection?.maximumInputExclusiveDegrees) ||
			record.selection.minimumInputDegrees < 0 ||
			record.selection.maximumInputExclusiveDegrees > 180 ||
			record.selection.minimumInputDegrees >= record.selection.maximumInputExclusiveDegrees ||
			record.selection.representativeSolarZenithDegrees < record.selection.minimumInputDegrees ||
			record.selection.representativeSolarZenithDegrees > record.selection.maximumInputExclusiveDegrees
		) {
			throw new RangeError('Distant-Sun runtime scene-cache selection interval is incompatible.');
		}
		this._requirePayload(
			record.exactSeamPayload,
			DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
			'Exact-seam payload',
		);
		this._requirePayload(
			record.logicalToUniqueIndex,
			DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
			'Logical-to-unique index',
		);

		this.record = record;
	}

	/**
	 * Call this method to require an exact cache identity before loading any payload.
	 *
	 * @param {string} cacheIdentity - The requested complete-cache identity.
	 * @returns {void} - No value.
	 * @throws {RangeError} - When the manifest does not identify the requested cache.
	 */
	requireCacheIdentity(cacheIdentity) {
		if (this.record.cacheIdentity !== cacheIdentity) {
			throw new RangeError('Distant-Sun scene-cache manifest does not match the requested cache identity.');
		}
	}
}
