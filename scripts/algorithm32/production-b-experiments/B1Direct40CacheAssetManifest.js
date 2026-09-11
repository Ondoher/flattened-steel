import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import DistantSunSceneCacheLedger from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheLedger.js';
import {SOLAR_ZENITH_180_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/solar-zenith/consts.js';

export const B1_DIRECT40_CACHE_ASSET_MANIFEST_SCHEMA = 'algorithm32-b1-direct40-cache-asset-manifest-v1';
export const B1_DIRECT40_CACHE_PAYLOAD_CODEC = 'algorithm32-b1-direct40-w27-exact-seam-f32le-v1';
export const B1_DIRECT40_DIRECTION_INDEX_CODEC = 'algorithm32-b1-direct40-w27-logical-to-unique-u16le-v1';
export const B1_DIRECT40_CACHE_LAYOUT = 'wavelength-major-position-major-unique-w27-direction';
/** Receiver-local rows carry altitude and solar-zenith support instead of one source-aligned altitude column. */
export const B1_POINT_LOCAL_CACHE_LAYOUT = 'wavelength-major-receiver-local-row-major-unique-w27-direction';
/** Explicit version for assets materialized from the unified production compiler. */
export const B1_POINT_LOCAL_CACHE_ASSET_SCHEMA = 'algorithm32-b1-point-local-cache-asset-manifest-v2';

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
			...(profile.numerical.viewPath.sampleDistribution === null
				? {}
				: {viewPathSampleDistribution: profile.numerical.viewPath.sampleDistribution.kind}),
			sourcePathTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
			cacheTransportIntervalCount: profile.numerical.cacheConstruction.transportIntervalCount,
			maximumScatteringOrder: profile.numerical.cacheConstruction.maximumScatteringOrder,
		},
	};
}

/** Exact content-addressed contract for one production-built B1 direct-40 cache asset. */
export default class B1Direct40CacheAssetManifest {
	/** Project the production profile's physical and numerical compatibility boundary. */
	static createProfileBoundary(profile, condition) {
		return expectedProfileBoundary(profile, condition);
	}
	/** Compute the complete-cache identity from every manifest field other than the identity itself. */
	static computeAssetIdentity(record) {
		return `${ASSET_IDENTITY_PREFIX}${CanonicalValueHash.sha256Value(identityPayload(record)).slice('sha256:'.length)}`;
	}

	/** Create a record whose asset identity covers its complete compatibility and payload boundary. */
	static createRecord(definition) {
		const record = {
			...definition,
			schemaId:
				definition.layout?.axisOrder === B1_POINT_LOCAL_CACHE_LAYOUT
					? B1_POINT_LOCAL_CACHE_ASSET_SCHEMA
					: B1_DIRECT40_CACHE_ASSET_MANIFEST_SCHEMA,
		};
		return Object.freeze({...record, assetIdentity: this.computeAssetIdentity(record)});
	}

	/** Validate one serialized B1 cache-asset record. */
	constructor(record) {
		if (
			!record ||
			![B1_DIRECT40_CACHE_ASSET_MANIFEST_SCHEMA, B1_POINT_LOCAL_CACHE_ASSET_SCHEMA].includes(record.schemaId)
		) {
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
		const requiredNumerical =
			record.numerical?.viewPathSampleDistribution === 'quadratic-near-observer-v1'
				? {
						viewPathIntervalCount: 30,
						viewPathSampleDistribution: 'quadratic-near-observer-v1',
						sourcePathTransmittanceIntervalCount: 20,
						cacheTransportIntervalCount: 40,
						maximumScatteringOrder: 4,
					}
				: REQUIRED_NUMERICAL;
		if (JSON.stringify(record.numerical) !== JSON.stringify(requiredNumerical)) {
			throw new RangeError('B1 direct-40 cache-asset numerical controls are incompatible.');
		}
		const pointLocal = record.schemaId === B1_POINT_LOCAL_CACHE_ASSET_SCHEMA;
		let rowCount = REQUIRED_COUNTS.positions;
		if (pointLocal) {
			if (!Array.isArray(record.ledger?.rows) || record.ledger.rows.length !== 48)
				throw new RangeError('Point-local asset requires all 48 altitude rows.');
			rowCount = 0;
			for (const [altitudeIndex, row] of record.ledger.rows.entries()) {
				if (
					row.altitudeIndex !== altitudeIndex ||
					!Number.isInteger(row.firstSolarZenithIndex) ||
					!Number.isInteger(row.lastSolarZenithIndex) ||
					row.firstSolarZenithIndex < 0 ||
					row.lastSolarZenithIndex >= 180 ||
					row.firstSolarZenithIndex > row.lastSolarZenithIndex ||
					row.firstPackedRow !== rowCount ||
					row.packedRowCount !== row.lastSolarZenithIndex - row.firstSolarZenithIndex + 1
				)
					throw new RangeError('Point-local asset ledger is inconsistent.');
				rowCount += row.packedRowCount;
			}
			if (record.ledger.retainedBlockCount !== rowCount)
				throw new RangeError('Point-local asset ledger count differs.');
		}
		if (
			record.layout?.axisOrder !== (pointLocal ? B1_POINT_LOCAL_CACHE_LAYOUT : B1_DIRECT40_CACHE_LAYOUT) ||
			record.layout?.scalarType !== 'float32-little-endian'
		) {
			throw new RangeError('B1 direct-40 cache-asset layout is incompatible.');
		}
		const cacheByteLength =
			REQUIRED_COUNTS.spectralChannels *
			rowCount *
			REQUIRED_COUNTS.uniqueOutgoingDirections *
			Float32Array.BYTES_PER_ELEMENT;
		const indexByteLength = REQUIRED_COUNTS.logicalOutgoingDirections * Uint16Array.BYTES_PER_ELEMENT;
		requirePayload(
			record.cumulativeScatteringDensity,
			B1_DIRECT40_CACHE_PAYLOAD_CODEC,
			cacheByteLength,
			'Cache payload',
		);
		requirePayload(
			record.logicalToUniqueIndex,
			B1_DIRECT40_DIRECTION_INDEX_CODEC,
			indexByteLength,
			'Direction index',
		);
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
		if (this.record.schemaId === B1_POINT_LOCAL_CACHE_ASSET_SCHEMA) {
			const {ledger} = this.record;
			const constants = profile.models.atmosphere.constants;
			const zenith = Math.acos(Math.max(-1, Math.min(1, expected.condition.directionToSource[2])));
			if (
				ledger.sceneSun.id !== condition.id ||
				ledger.sceneSun.instant !== expected.condition.instant ||
				ledger.sceneSun.sourceIdentity !== expected.condition.sourceIdentity ||
				ledger.support.observerAltitude.value !== 0 ||
				Math.abs(ledger.support.observerSolarZenith.value - zenith) > 1e-12 ||
				JSON.stringify(ledger.support.bottomRadius) !== JSON.stringify(constants.bottomRadius) ||
				JSON.stringify(ledger.support.topRadius) !== JSON.stringify(constants.topRadius) ||
				ledger.support.completeCameraRotation !== true ||
				ledger.support.arbitraryShortenedEndpoint !== true
			)
				throw new RangeError('Point-local ledger support does not match the B1 condition.');
			DistantSunSceneCacheLedger.fromRecord(ledger, {
				positionDomain: profile.domains.positions,
				solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
				outgoingDirectionDomain: profile.domains.outgoingDirections,
				spectralBasis: profile.spectral.basis,
			});
		}
	}

	/** Return the validated serializable record unchanged. */
	toRecord() {
		return this.record;
	}
}
