const FINGERPRINT_VERSION = 'fnv1a64-canonical-json-v1';

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
	if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('Stellar catalog identity must contain finite numbers.');
	return value;
}

function fingerprint(value) {
	let hash = 0xcbf29ce484222325n;
	for (const character of JSON.stringify(canonical(value))) {
		hash ^= BigInt(character.codePointAt(0));
		hash = BigInt.asUintN(64, hash * 0x100000001b3n);
	}
	return `${FINGERPRINT_VERSION}:${hash.toString(16).padStart(16, '0')}`;
}

function finite(value, label) {
	if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
	return value;
}

function requireIdentifier(value, label) {
	if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${label} must be a nonempty string.`);
	return value;
}

function normalizeMember(member) {
	if (!member || typeof member !== 'object') throw new TypeError('Stellar catalog member must be an object.');
	const memberId = requireIdentifier(member.memberId, 'Stellar catalog memberId');
	const hr = member.hr;
	if (!Number.isSafeInteger(hr) || hr < 1) throw new TypeError('Stellar catalog HR identifier must be a positive integer.');
	const latitudeRadians = finite(member.latitudeRadians, 'Stellar catalog latitudeRadians');
	const longitudeRadians = finite(member.longitudeRadians, 'Stellar catalog longitudeRadians');
	const visualMagnitude = finite(member.visualMagnitude, 'Stellar catalog visualMagnitude');
	if (latitudeRadians < -Math.PI / 2 || latitudeRadians > Math.PI / 2) throw new RangeError('Stellar catalog latitudeRadians is outside [-pi/2, pi/2].');
	if (longitudeRadians < -Math.PI || longitudeRadians >= Math.PI) throw new RangeError('Stellar catalog longitudeRadians is outside [-pi, pi).');
	const bMinusV = finite(member.bMinusV, 'Stellar catalog B-V');
	const spectralType = requireIdentifier(member.spectralType, 'Stellar catalog spectral type');
	return Object.freeze({ memberId, hr, latitudeRadians, longitudeRadians, visualMagnitude, bMinusV, spectralType, visualMagnitudeCode: member.visualMagnitudeCode ?? null, visualMagnitudeUncertainty: member.visualMagnitudeUncertainty ?? null });
}

function canonicalDirection(member) {
	const cosineLatitude = Math.cos(member.latitudeRadians);
	return Object.freeze([
		cosineLatitude * Math.cos(member.longitudeRadians),
		cosineLatitude * Math.sin(member.longitudeRadians),
		Math.sin(member.latitudeRadians),
	]);
}

function normalizeEpoch(epoch, timeScale) {
	if (!epoch || epoch.units !== 'seconds' || epoch.timeScale !== timeScale || !Number.isFinite(epoch.value)) throw new TypeError('Stellar source placement requires a compatible seconds epoch.');
	return Object.freeze({ value: epoch.value, units: 'seconds', timeScale });
}

/**
 * Placement-only source for a fixed catalog of directional point stars.
 * It intentionally has no radiometric packet or cache-fragment method.
 */
export class StellarCelestialSource {
	constructor({ sourceId = 'stellar-catalog-v50', catalog, members, stellarSpectralPhotometry = null, materializedTransportMembers = null, materializedTransportIdentity = null }) {
		this.sourceId = requireIdentifier(sourceId, 'Stellar celestial sourceId');
		if (!catalog || typeof catalog !== 'object') throw new TypeError('Stellar celestial source requires catalog identity.');
		this.catalog = Object.freeze({
			catalogId: requireIdentifier(catalog.catalogId, 'Stellar catalogId'),
			coordinateEpoch: requireIdentifier(catalog.coordinateEpoch, 'Stellar coordinate epoch'),
			coordinateFrame: requireIdentifier(catalog.coordinateFrame, 'Stellar coordinate frame'),
			coordinateContract: requireIdentifier(catalog.coordinateContract, 'Stellar coordinate contract'),
			sourceSha256: requireIdentifier(catalog.sourceSha256, 'Stellar catalog source checksum'),
			selection: requireIdentifier(catalog.selection, 'Stellar catalog selection'),
		});
		if (this.catalog.coordinateContract !== 'celestial-rh-v1') throw new RangeError('Stellar celestial source requires celestial-rh-v1 coordinates.');
		if (!Array.isArray(members) || members.length !== 500) throw new RangeError('Stellar celestial source requires exactly 500 selected members.');
		this.members = Object.freeze(members.map(normalizeMember).sort((left, right) => left.visualMagnitude - right.visualMagnitude || left.hr - right.hr));
		if (new Set(this.members.map((member) => member.memberId)).size !== this.members.length) throw new RangeError('Stellar celestial source member identifiers must be unique.');
		if (this.members.some((member, index) => index > 0 && (this.members[index - 1].visualMagnitude > member.visualMagnitude || (this.members[index - 1].visualMagnitude === member.visualMagnitude && this.members[index - 1].hr >= member.hr)))) throw new RangeError('Stellar celestial source members must have a stable Vmag/HR order.');
		this.catalogFingerprint = fingerprint({ catalog: this.catalog, members: this.members });
		if (stellarSpectralPhotometry !== null && materializedTransportMembers !== null) throw new TypeError('Stellar celestial source accepts either photometry policy or materialized packets, not both.');
		if (stellarSpectralPhotometry !== null && (typeof stellarSpectralPhotometry.describeStaticIdentity !== 'function' || typeof stellarSpectralPhotometry.materialize !== 'function')) throw new TypeError('Stellar spectral photometry must expose describeStaticIdentity() and materialize().');
		if (materializedTransportMembers !== null && (!Array.isArray(materializedTransportMembers) || materializedTransportMembers.length !== this.members.length || !materializedTransportIdentity || typeof materializedTransportIdentity.id !== 'string' || typeof materializedTransportIdentity.contentHash !== 'string')) throw new TypeError('Materialized stellar packets require a complete roster and immutable identity.');
		this.stellarSpectralPhotometry = stellarSpectralPhotometry;
		this.materializedTransportIdentity = materializedTransportIdentity;
		this.transportMembers = stellarSpectralPhotometry === null
			? materializedTransportMembers === null ? null : Object.freeze([...materializedTransportMembers])
			: Object.freeze(stellarSpectralPhotometry.materialize(this.members));
		if (this.transportMembers !== null && (new Set(this.transportMembers.map((member) => member?.memberId)).size !== this.members.length || this.members.some((member) => !this.transportMembers.some((transport) => transport.memberId === member.memberId)))) throw new RangeError('Materialized stellar packets must exactly cover the selected roster.');
	}

	describeStaticIdentity() {
		return Object.freeze({ sourceId: this.sourceId, kind: 'catalog-point-set', catalogId: this.catalog.catalogId, coordinateContract: this.catalog.coordinateContract, catalogFingerprint: this.catalogFingerprint, stellarPhotometry: this.stellarSpectralPhotometry?.describeStaticIdentity() ?? this.materializedTransportIdentity, memberCount: this.members.length });
	}

	/** Source-owned apparent top-of-atmosphere packets, when photometry is configured. */
	createTransportMembers() {
		if (this.transportMembers === null) throw new Error('Stellar celestial source has no configured spectral-photometry policy.');
		return this.transportMembers;
	}

	/** Canonical catalog directions before the later live body/epoch transform. */
	describeCanonicalPointDirections() {
		return Object.freeze(this.members.map((member) => Object.freeze({
			memberId: member.memberId,
			direction: canonicalDirection(member),
			frameId: this.catalog.coordinateContract,
		})));
	}

	/** Static geometry-contract records; no cache payload or radiometry is created. */
	describePointSourceDefinitions({ celestialFrameId = 'celestial-rh-v1', timeScale = 'unix-seconds' } = {}) {
		requireIdentifier(celestialFrameId, 'Stellar celestial frame id');
		requireIdentifier(timeScale, 'Stellar source time scale');
		if (celestialFrameId !== this.catalog.coordinateContract) throw new RangeError('Stellar source frame must match its catalog coordinate contract.');
		const placementProviderContractFingerprint = fingerprint({ sourceId: this.sourceId, catalogFingerprint: this.catalogFingerprint, celestialFrameId, timeScale, directionConvention: 'receiver-to-source' });
		return Object.freeze(this.members.map((member) => Object.freeze({
			sourceId: member.memberId,
			sourceKind: 'point',
			placementKind: 'infinite-direction',
			depth: 'infinite',
			sourceDefinitionFingerprint: fingerprint({ catalogFingerprint: this.catalogFingerprint, member }),
			placementProviderContractFingerprint,
			placementProviderContract: Object.freeze({ frameId: celestialFrameId, originConvention: 'observer-independent-infinite-direction', directionConvention: 'receiver-to-source', timeScale }),
			support: Object.freeze({ kind: 'point' }),
		})));
	}

	/** Live canonical placements. Geometry owns body rotation and presentation. */
	createPointPlacementStates({ epoch, celestialFrameId = 'celestial-rh-v1', timeScale = 'unix-seconds' } = {}) {
		const normalizedEpoch = normalizeEpoch(epoch, timeScale);
		const definitions = this.describePointSourceDefinitions({ celestialFrameId, timeScale });
		return Object.freeze(this.members.map((member, index) => Object.freeze({
			sourceId: member.memberId,
			direction: canonicalDirection(member),
			frameId: celestialFrameId,
			originConvention: 'observer-independent-infinite-direction',
			directionConvention: 'receiver-to-source',
			epoch: normalizedEpoch,
			placementProviderContractFingerprint: definitions[index].placementProviderContractFingerprint,
			placementStateFingerprint: fingerprint({ catalogFingerprint: this.catalogFingerprint, memberId: member.memberId, epoch: normalizedEpoch }),
		})));
	}
}

export default StellarCelestialSource;
