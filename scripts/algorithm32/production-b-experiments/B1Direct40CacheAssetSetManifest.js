import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {CAPTURE_TIMES} from '../../experiments/b1-directional-sky-radiance/benchmark-domain.js';

export const B1_DIRECT40_CACHE_ASSET_SET_SCHEMA = 'algorithm32-b1-direct40-cache-asset-set-manifest-v1';
export const B1_DIRECT40_PROFILE_FAMILY = 'b1-bruneton-direct40-native48-f68-w27-j4-v1';

const SET_IDENTITY_PREFIX = 'algorithm32-b1-direct40-cache-set-sha256:';
const SHA256 = /^[a-f0-9]{64}$/u;
const CONTENT_HASH = /^sha256:[a-f0-9]{64}$/u;
const ASSET_IDENTITY = /^algorithm32-b1-direct40-cache-sha256:[a-f0-9]{64}$/u;

function identityPayload(record) {
	const {setIdentity: _setIdentity, ...payload} = record;
	return payload;
}

function requireRelativePath(value) {
	if (
		typeof value !== 'string' ||
		value.length === 0 ||
		value.startsWith('/') ||
		value.includes(':') ||
		value.includes('..') ||
		value.includes('\\')
	) {
		throw new RangeError('B1 asset-set manifest path must be normalized and set-relative.');
	}
}

/** Ordered content identity binding all 17 production B1 cache assets. */
export default class B1Direct40CacheAssetSetManifest {
	/** Call this method to identify the complete B1 asset family for a selected construction domain.
	 *
	 * @param {SphericalNativePositionDomainSelection} [positionDomain] - Explicit grid selection; omission retains Native48.
	 * @returns {string} - Versioned B1 asset family identity.
	 */
	static profileFamilyFor(positionDomain = 'native48') {
		if (positionDomain === 'native48') return B1_DIRECT40_PROFILE_FAMILY;
		if (positionDomain === 'native51-near-ground') return 'b1-bruneton-direct40-native51-near-ground-f68-w27-j4-v1';
		throw new RangeError('B1 direct-40 position domain is unsupported.');
	}

	static computeSetIdentity(record) {
		return `${SET_IDENTITY_PREFIX}${CanonicalValueHash.sha256Value(identityPayload(record)).slice('sha256:'.length)}`;
	}

	static createRecord(definition) {
		const record = {...definition, schemaId: B1_DIRECT40_CACHE_ASSET_SET_SCHEMA};
		return Object.freeze({...record, setIdentity: this.computeSetIdentity(record)});
	}

	constructor(record) {
		if (!record || record.schemaId !== B1_DIRECT40_CACHE_ASSET_SET_SCHEMA) {
			throw new RangeError('B1 direct-40 cache asset-set schema is incompatible.');
		}
		if (record.setIdentity !== B1Direct40CacheAssetSetManifest.computeSetIdentity(record)) {
			throw new RangeError('B1 direct-40 cache asset-set identity does not cover the manifest content.');
		}
		if (record.profileFamily !== B1Direct40CacheAssetSetManifest.profileFamilyFor(record.positionDomain)) {
			throw new RangeError('B1 direct-40 cache asset-set profile family is incompatible.');
		}
		if (typeof record.productionRevision !== 'string' || record.productionRevision.length === 0) {
			throw new TypeError('B1 direct-40 cache asset-set production revision is required.');
		}
		if (!Array.isArray(record.assets) || record.assets.length !== CAPTURE_TIMES.length) {
			throw new RangeError('B1 direct-40 cache asset set must contain all 17 conditions.');
		}
		record.assets.forEach((asset, index) => {
			const expectedTime = CAPTURE_TIMES[index];
			if (
				asset.condition?.id !== `b1-${expectedTime}` ||
				asset.condition?.localTime !== expectedTime ||
				!Number.isFinite(asset.condition?.fittedAzimuthDegrees)
			) {
				throw new RangeError('B1 direct-40 cache asset set is incomplete or out of canonical order.');
			}
			requireRelativePath(asset.manifestPath);
			if (!SHA256.test(asset.manifestSha256)) throw new RangeError('B1 asset manifest hash is invalid.');
			if (!ASSET_IDENTITY.test(asset.assetIdentity)) throw new RangeError('B1 cache asset identity is invalid.');
			if (typeof asset.profile?.id !== 'string' || !CONTENT_HASH.test(asset.profile?.contentHash)) {
				throw new RangeError('B1 asset-set profile identity is invalid.');
			}
		});
		this.record = record;
	}

	toRecord() {
		return this.record;
	}
}
