import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';

export const B1_DIRECT40_CACHE_ASSET_MANIFEST_SCHEMA = 'algorithm32-b1-direct40-cache-asset-manifest-v1';
export const B1_DIRECT40_CACHE_PAYLOAD_CODEC = 'algorithm32-b1-direct40-w27-exact-seam-f32le-v1';
export const B1_DIRECT40_DIRECTION_INDEX_CODEC = 'algorithm32-b1-direct40-w27-logical-to-unique-u16le-v1';
export const B1_DIRECT40_CACHE_LAYOUT = 'wavelength-major-position-major-unique-w27-direction';

const ASSET_IDENTITY_PREFIX = 'algorithm32-b1-direct40-cache-sha256:';
const SHA256 = /^[a-f0-9]{64}$/u;
const CONTENT_HASH = /^sha256:[a-f0-9]{64}$/u;
const REQUIRED_COUNTS = Object.freeze({
	spectralChannels: 40,
	positions: 48,
	incomingDirections: 68,
	logicalOutgoingDirections: 4374,
	uniqueOutgoingDirections: 4058,
});
const REQUIRED_NUMERICAL = Object.freeze({
	viewPathIntervalCount: 40,
	sourcePathTransmittanceIntervalCount: 20,
	cacheTransportIntervalCount: 40,
	maximumScatteringOrder: 4,
});

function requireString(value, label) {
	if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${label} must be a nonempty string.`);
}

function requireContentHash(value, label) {
	if (!CONTENT_HASH.test(value)) throw new RangeError(`${label} must use canonical SHA-256 spelling.`);
}

function requireUnitVector(value, label) {
	if (
		!Array.isArray(value) ||
		value.length !== 3 ||
		value.some((component) => !Number.isFinite(component)) ||
		Math.abs(Math.hypot(...value) - 1) > 1e-10
	) {
		throw new RangeError(`${label} must be a finite unit vector.`);
	}
}

function requirePayload(payload, codec, expectedByteLength, label) {
	if (!payload || payload.codecId !== codec) throw new RangeError(`${label} codec identity is incompatible.`);
	if (
		typeof payload.path !== 'string' ||
		payload.path.length === 0 ||
		payload.path.startsWith('/') ||
		payload.path.includes(':') ||
		payload.path.includes('..') ||
		payload.path.includes('\\')
	) {
		throw new RangeError(`${label} path must be a normalized asset-relative path.`);
	}
	if (payload.byteLength !== expectedByteLength) throw new RangeError(`${label} byte shape is incompatible.`);
	if (!SHA256.test(payload.sha256)) throw new RangeError(`${label} hash must be a lowercase SHA-256 value.`);
}

function identityPayload(record) {
	const {assetIdentity: _assetIdentity, ...payload} = record;
	return payload;
}

function expectedProfileBoundary(profile, condition) {
	if (!profile || profile.kind !== 'algorithm32-execution-profile') {
		throw new TypeError('B1 asset compatibility requires one production execution profile.');
	}
	return {
		profile: {
			id: profile.id,
			contentHash: profile.contentHash,
			schemaRevision: profile.schemaRevision,
			provenanceIdentity: profile.provenanceIdentity,
		},
		condition: {
			id: condition.id,
			localTime: condition.localTime,
			instant: profile.models.sourcePlacement.observation.instant,
			directionToSource: profile.models.sourcePlacement.placement.directionToLight,
			sourceIdentity: profile.models.lightSource.id,
		},
		physical: {
			spectralBasisId: profile.spectral.basis.id,
			spectralBasisContentHash: profile.spectral.basis.contentHash,
			sourceIrradianceContentHash: profile.spectral.sourceIrradianceDensity.contentHash,
			atmosphereId: profile.models.atmosphere.id,
			geometryId: profile.models.geometry.id,
			groundId: profile.models.groundBoundary.id,
			groundAlbedoContentHash: profile.models.groundBoundary.albedo.contentHash,
		},
		domains: {
			position: {id: profile.domains.positions.id, count: profile.domains.positions.count},
			incoming: {
				id: profile.domains.incomingDirections.id,
				count: profile.domains.incomingDirections.directionCount,
			},
			outgoing: {
				id: profile.domains.outgoingDirections.id,
				faceWidth: profile.domains.outgoingDirections.faceWidth,
				logicalCount: profile.domains.outgoingDirections.directionCount,
				uniqueCount: profile.domains.outgoingDirections.uniqueDirectionCount,
			},
			spectrum: {
				id: profile.spectral.basis.id,
				contentHash: profile.spectral.basis.contentHash,
				channelCount: profile.spectral.basis.channelCount,
			},
		},
		numerical: {
			viewPathIntervalCount: profile.numerical.viewPath.intervalCount,
			sourcePathTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
			cacheTransportIntervalCount: profile.numerical.cacheConstruction.transportIntervalCount,
			maximumScatteringOrder: profile.numerical.cacheConstruction.maximumScatteringOrder,
		},
	};
}

/** Exact content-addressed contract for one production-built B1 direct-40 cache asset. */
export default class B1Direct40CacheAssetManifest {
	/** Compute the complete-cache identity from every manifest field other than the identity itself. */
	static computeAssetIdentity(record) {
		return `${ASSET_IDENTITY_PREFIX}${CanonicalValueHash.sha256Value(identityPayload(record)).slice('sha256:'.length)}`;
	}

	/** Create a record whose asset identity covers its complete compatibility and payload boundary. */
	static createRecord(definition) {
		const record = {...definition, schemaId: B1_DIRECT40_CACHE_ASSET_MANIFEST_SCHEMA};
		return Object.freeze({...record, assetIdentity: this.computeAssetIdentity(record)});
	}

	/** Validate one serialized B1 cache-asset record. */
	constructor(record) {
		if (!record || record.schemaId !== B1_DIRECT40_CACHE_ASSET_MANIFEST_SCHEMA) {
			throw new RangeError('B1 direct-40 cache-asset manifest schema is incompatible.');
		}
		if (record.assetIdentity !== B1Direct40CacheAssetManifest.computeAssetIdentity(record)) {
			throw new RangeError('B1 direct-40 cache-asset identity does not cover the manifest content.');
		}
		for (const [value, label] of [
			[record.profile?.id, 'Profile identity'],
			[record.profile?.schemaRevision, 'Profile schema revision'],
			[record.profile?.provenanceIdentity, 'Profile provenance identity'],
			[record.condition?.id, 'Condition identity'],
			[record.condition?.localTime, 'Condition local time'],
			[record.condition?.instant, 'Condition instant'],
			[record.condition?.sourceIdentity, 'Condition source identity'],
			[record.physical?.spectralBasisId, 'Spectral-basis identity'],
			[record.physical?.atmosphereId, 'Atmosphere identity'],
			[record.physical?.geometryId, 'Geometry identity'],
			[record.physical?.groundId, 'Ground identity'],
			[record.domains?.position?.id, 'Position-domain identity'],
			[record.domains?.incoming?.id, 'Incoming-domain identity'],
			[record.domains?.outgoing?.id, 'Outgoing-domain identity'],
			[record.domains?.spectrum?.id, 'Spectrum-domain identity'],
		]) {
			requireString(value, label);
		}
		for (const [value, label] of [
			[record.profile?.contentHash, 'Profile content hash'],
			[record.physical?.spectralBasisContentHash, 'Spectral-basis content hash'],
			[record.physical?.sourceIrradianceContentHash, 'Source-irradiance content hash'],
			[record.physical?.groundAlbedoContentHash, 'Ground-albedo content hash'],
			[record.domains?.spectrum?.contentHash, 'Spectrum-domain content hash'],
		]) {
			requireContentHash(value, label);
		}
		requireUnitVector(record.condition.directionToSource, 'Condition source direction');
		if (
			record.domains.spectrum.channelCount !== REQUIRED_COUNTS.spectralChannels ||
			record.domains.position.count !== REQUIRED_COUNTS.positions ||
			record.domains.incoming.count !== REQUIRED_COUNTS.incomingDirections ||
			record.domains.outgoing.faceWidth !== 27 ||
			record.domains.outgoing.logicalCount !== REQUIRED_COUNTS.logicalOutgoingDirections ||
			record.domains.outgoing.uniqueCount !== REQUIRED_COUNTS.uniqueOutgoingDirections
		) {
			throw new RangeError('B1 direct-40 cache-asset domain shape is incompatible.');
		}
		if (JSON.stringify(record.numerical) !== JSON.stringify(REQUIRED_NUMERICAL)) {
			throw new RangeError('B1 direct-40 cache-asset numerical controls are incompatible.');
		}
		if (
			record.layout?.axisOrder !== B1_DIRECT40_CACHE_LAYOUT ||
			record.layout?.scalarType !== 'float32-little-endian'
		) {
			throw new RangeError('B1 direct-40 cache-asset layout is incompatible.');
		}
		const cacheByteLength =
			REQUIRED_COUNTS.spectralChannels *
			REQUIRED_COUNTS.positions *
			REQUIRED_COUNTS.uniqueOutgoingDirections *
			Float32Array.BYTES_PER_ELEMENT;
		const indexByteLength = REQUIRED_COUNTS.logicalOutgoingDirections * Uint16Array.BYTES_PER_ELEMENT;
		requirePayload(record.cumulativeScatteringDensity, B1_DIRECT40_CACHE_PAYLOAD_CODEC, cacheByteLength, 'Cache payload');
		requirePayload(record.logicalToUniqueIndex, B1_DIRECT40_DIRECTION_INDEX_CODEC, indexByteLength, 'Direction index');
		for (const [value, label] of [
			[record.derivation?.compilerIdentity, 'Derivation compiler identity'],
			[record.derivation?.productionRevision, 'Derivation production revision'],
			[record.derivation?.operation, 'Derivation operation'],
		]) {
			requireString(value, label);
		}
		if (!record.derivation.inputs || typeof record.derivation.inputs !== 'object') {
			throw new TypeError('Derivation inputs are required.');
		}

		this.record = record;
	}

	/** Require exact compatibility with the selected production profile and B1 condition. */
	requireCompatibility(profile, condition) {
		const expected = expectedProfileBoundary(profile, condition);
		for (const key of ['profile', 'condition', 'physical', 'domains', 'numerical']) {
			if (JSON.stringify(this.record[key]) !== JSON.stringify(expected[key])) {
				throw new RangeError(`B1 direct-40 cache asset is incompatible with the requested ${key} boundary.`);
			}
		}
	}

	/** Return the validated serializable record unchanged. */
	toRecord() {
		return this.record;
	}
}
