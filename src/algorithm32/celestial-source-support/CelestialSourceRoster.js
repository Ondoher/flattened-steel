import {GeometryDirections} from '../geometry-support/GeometryDirections.js';
import DistanceMath from '../math/DistanceMath.js';
import VectorMath from '../math/VectorMath.js';
import {UnitMath} from '../physical-quantities/UnitMath.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../spectral-values/index.js';
import {ValueValidation} from '../validation/ValueValidation.js';

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const EXPLICIT_UTC_OFFSET_PATTERN = /(?:Z|[+-]\d{2}:\d{2})$/u;
const SUPPORTED_STELLAR_MEMBER_COUNTS = new Set([500, 2000]);

/**
 * Called by roster validation to require one exact supported capability implementation.
 *
 * @param {unknown} value - Candidate source capability.
 * @param {CelestialSourceKind} kind - Required source kind.
 * @param {string} label - Diagnostic label.
 * @returns {CelestialSourceProvider} - Accepted source capability and internal production provider.
 */
function acceptSource(value, kind, label) {
	if (!value || typeof value !== 'object') {
		throw new TypeError(`${label} must be a celestial source capability.`);
	}
	const source = /** @type {CelestialSourceProvider} */ (value);
	ValueValidation.requiredString(source.id, `${label} id`);
	if (source.kind !== kind) {
		throw new RangeError(`${label} kind must be ${kind}.`);
	}
	const definition = source.celestialSourceDefinition;
	if (!definition || typeof definition !== 'object') {
		throw new TypeError(`${label} must expose celestialSourceDefinition.`);
	}
	if (definition.id !== source.id || definition.kind !== source.kind) {
		throw new RangeError(`${label} definition identity must match its source capability.`);
	}
	for (const method of [
		'describeCelestialSourceIdentity',
		'createCelestialPlacementState',
		'createCelestialCacheFragment',
	]) {
		if (typeof source[method] !== 'function') {
			throw new TypeError(`${label} must implement ${method}.`);
		}
	}
	return source;
}

/**
 * Called by roster validation to require one aligned, nonnegative spectral packet.
 *
 * @param {unknown} packet - Candidate spectral packet.
 * @param {SpectralBasis} basis - Required spectral basis.
 * @param {SpectralQuantity} quantity - Required spectral quantity.
 * @param {SpectralUnits} units - Required spectral units.
 * @param {string} label - Diagnostic label.
 * @returns {SpectralPacket} - Accepted packet.
 */
function acceptNonnegativePacket(packet, basis, quantity, units, label) {
	const accepted = SpectralPacket.assert(packet, {
		basis,
		quantity,
		units,
		semantics: basis.semantics,
	});
	if (accepted.values.some((value) => value < 0)) {
		throw new RangeError(`${label} values must be nonnegative.`);
	}
	return accepted;
}

/**
 * Called by roster validation to require one positive angle.
 *
 * @param {unknown} value - Candidate angle.
 * @param {string} label - Diagnostic label.
 * @returns {number} - Angle in radians.
 */
function acceptPositiveAngle(value, label) {
	const radians = UnitMath.convertUnitValue(value, 'radians', label).value;
	if (!(radians > 0 && radians < Math.PI / 2)) {
		throw new RangeError(`${label} must be between zero and pi/2 radians.`);
	}
	return radians;
}

/**
 * Called by roster validation to require one distance and return meters.
 *
 * @param {unknown} value - Candidate distance.
 * @param {string} label - Diagnostic label.
 * @param {boolean} positive - Whether zero is rejected.
 * @returns {number} - Distance in meters.
 */
function acceptDistance(value, label, positive) {
	DistanceMath.assertDistance(value, label);
	const meters = UnitMath.convertUnitValue(value, 'meters', label).value;
	if (meters < 0 || (positive && meters === 0)) {
		throw new RangeError(`${label} must be ${positive ? 'positive' : 'nonnegative'}.`);
	}
	return meters;
}

/**
 * Called by roster validation to require one canonical SHA-256 value.
 *
 * @param {unknown} value - Candidate hash.
 * @param {string} label - Diagnostic label.
 * @returns {string} - Accepted hash.
 */
function acceptSha256(value, label) {
	if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
		throw new TypeError(`${label} must use canonical SHA-256 spelling.`);
	}
	return value;
}

/**
 * Called by roster validation to require one explicit UTC epoch.
 *
 * @param {unknown} value - Candidate epoch.
 * @returns {CelestialEpoch} - Accepted epoch.
 */
function acceptEpoch(value) {
	if (!value || typeof value !== 'object') {
		throw new TypeError('Stellar catalog epoch must be an object.');
	}
	const epoch = /** @type {CelestialEpoch} */ (value);
	if (
		epoch.timeScale !== 'utc' ||
		typeof epoch.instant !== 'string' ||
		!EXPLICIT_UTC_OFFSET_PATTERN.test(epoch.instant) ||
		!Number.isFinite(Date.parse(epoch.instant))
	) {
		throw new RangeError('Stellar catalog epoch must be a valid explicit UTC instant.');
	}
	return epoch;
}

/**
 * Called by roster validation to require the declared geometry capability without invoking it.
 *
 * @param {GeometryModel} geometry - Configured geometry.
 * @param {CelestialCapabilityFamily} family - Required family.
 * @returns {CelestialGeometryCapability} - Accepted geometry capability.
 */
function acceptGeometryCapability(geometry, family) {
	const capability = /** @type {GeometryModel & CelestialGeometryCapability} */ (geometry);
	if (capability.celestialCapabilityFamily !== family) {
		throw new RangeError(`Algorithm32 geometry does not support celestial family ${family}.`);
	}
	for (const method of [
		'describeCelestialContributionDomain',
		'resolveCelestialPlacements',
		'createCelestialBuildSample',
		'createCelestialQueryPacket',
	]) {
		if (typeof capability[method] !== 'function') {
			throw new TypeError(`Algorithm32 celestial geometry must implement ${method}.`);
		}
	}
	return capability;
}

/**
 * Called by roster validation to accept one distant-Sun definition.
 *
 * @param {DistantSunCelestialSource} source - Candidate source.
 * @param {SpectralBasis} basis - Active basis.
 * @returns {DistantSunCelestialSourceIdentityFacts} - Canonical distant-Sun facts.
 */
function acceptDistantSun(source, basis) {
	const definition = source.celestialSourceDefinition;
	if (definition.profile !== 'uniform-disk') {
		throw new RangeError('Distant celestial Sun must use the uniform-disk profile.');
	}
	const angularRadiusRadians = acceptPositiveAngle(definition.angularRadius, 'Distant celestial Sun angular radius');
	const surfaceRadiance = acceptNonnegativePacket(
		definition.surfaceRadiance,
		basis,
		SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		SPECTRAL_UNITS.RADIANCE_DENSITY,
		'Distant celestial Sun surface radiance',
	);
	return {
		id: source.id,
		kind: source.kind,
		profile: definition.profile,
		angularRadiusRadians,
		surfaceRadiance: surfaceRadiance.contentHash,
	};
}

/**
 * Called by roster validation to accept one finite local-Sun definition.
 *
 * @param {FiniteLocalSunCelestialSource} source - Candidate source.
 * @param {SpectralBasis} basis - Active basis.
 * @returns {FlatFiniteSunCelestialSourceIdentityFacts} - Canonical finite-Sun facts.
 */
function acceptFiniteSun(source, basis) {
	const definition = source.celestialSourceDefinition;
	if (definition.profile !== 'uniform-disk') {
		throw new RangeError('Finite celestial Sun must use the uniform-disk profile.');
	}
	const radiusMeters = acceptDistance(definition.radius, 'Finite celestial Sun radius', true);
	const centerHeightMeters = acceptDistance(definition.centerHeight, 'Finite celestial Sun center height', false);
	const surfaceRadiance = acceptNonnegativePacket(
		definition.surfaceRadiance,
		basis,
		SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		SPECTRAL_UNITS.RADIANCE_DENSITY,
		'Finite celestial Sun surface radiance',
	);
	return {
		id: source.id,
		kind: source.kind,
		profile: definition.profile,
		radiusMeters,
		centerHeightMeters,
		surfaceRadiance: surfaceRadiance.contentHash,
	};
}

/**
 * Called by roster validation to accept one stellar point-set definition.
 *
 * @param {StellarPointSetCelestialSource} source - Candidate source.
 * @param {SpectralBasis} basis - Active basis.
 * @returns {StellarPointSetSourceIdentityFacts} - Canonical stellar point-set facts.
 */
function acceptStars(source, basis) {
	const definition = source.celestialSourceDefinition;
	if (!Array.isArray(definition.members) || !SUPPORTED_STELLAR_MEMBER_COUNTS.has(definition.members.length)) {
		throw new RangeError('Stellar point-set must contain exactly 500 or 2,000 members.');
	}
	const catalog = definition.catalog;
	if (!catalog || typeof catalog !== 'object') {
		throw new TypeError('Stellar point-set catalog identity is required.');
	}
	const catalogFacts = {
		catalogId: ValueValidation.requiredString(catalog.catalogId, 'Stellar catalog id'),
		catalogVersion: ValueValidation.requiredString(catalog.catalogVersion, 'Stellar catalog version'),
		catalogSha256: acceptSha256(catalog.catalogSha256, 'Stellar catalog hash'),
		selectionId: ValueValidation.requiredString(catalog.selectionId, 'Stellar selection id'),
		selectionSha256: acceptSha256(catalog.selectionSha256, 'Stellar selection hash'),
		frame: catalog.frame,
		epoch: acceptEpoch(catalog.epoch),
	};
	if (catalogFacts.frame !== 'fk5-j2000-mean-equatorial-rh-v1') {
		throw new RangeError('Stellar catalog must use the FK5/J2000 mean-equatorial frame.');
	}
	const memberIds = new Set();
	const members = definition.members.map((member, index) => {
		const id = ValueValidation.requiredString(member?.id, `Stellar member ${index} id`);
		if (memberIds.has(id)) {
			throw new RangeError(`Stellar member id ${id} is duplicated.`);
		}
		memberIds.add(id);
		const direction = GeometryDirections.directionTuple(member.direction, `Stellar member ${index} direction`);
		if (Math.abs(VectorMath.length(direction) - 1) > 1e-12) {
			throw new RangeError(`Stellar member ${index} direction must be a unit vector.`);
		}
		const irradiance = acceptNonnegativePacket(
			member.spectralIrradiance,
			basis,
			SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			`Stellar member ${index} irradiance`,
		);
		return {
			id,
			direction: /** @type {UnitVector3} */ ([...direction]),
			spectralIrradiance: irradiance.contentHash,
		};
	});
	return {
		id: source.id,
		kind: source.kind,
		catalog: catalogFacts,
		members,
	};
}

/**
 * Accept an optional celestial source roster against the configured model facts.
 *
 * @param {CelestialSourceRosterAcceptanceRequest} request - Candidate roster and profile owners.
 * @returns {CelestialSourceRoster | null} - Exact accepted roster reference or null.
 */
function acceptCelestialSourceRoster(request) {
	const roster = request.roster;
	if (roster === undefined) {
		throw new TypeError('Algorithm32 celestialSources must be a roster object or null.');
	}
	if (roster === null) {
		return null;
	}
	if (typeof roster !== 'object') {
		throw new TypeError('Algorithm32 celestialSources must be a roster object or null.');
	}
	ValueValidation.requiredString(roster.id, 'Algorithm32 celestial roster id');
	acceptGeometryCapability(request.geometry, roster.family);
	if (roster.family === 'spherical-sun-stars-radial-v1') {
		const sun = /** @type {DistantSunCelestialSource} */ (
			acceptSource(roster.sun, 'distant-uniform-sun', 'Spherical celestial Sun')
		);
		if (!Object.is(sun, request.lightSource)) {
			throw new RangeError('Spherical celestial Sun must be the exact configured light source.');
		}
		acceptDistantSun(sun, request.basis);
		if (roster.stars !== undefined && roster.stars !== null) {
			acceptStars(
				/** @type {StellarPointSetCelestialSource} */ (
					acceptSource(roster.stars, 'static-stellar-point-set', 'Stellar point-set')
				),
				request.basis,
			);
		}
		return roster;
	}
	if (roster.family === 'flat-local-finite-sun-v1') {
		const localSun = /** @type {FiniteLocalSunCelestialSource} */ (
			acceptSource(roster.localSun, 'finite-local-sun', 'Flat finite celestial Sun')
		);
		if (!Object.is(localSun, request.lightSource)) {
			throw new RangeError('Flat finite celestial Sun must be the exact configured light source.');
		}
		acceptFiniteSun(localSun, request.basis);
		return roster;
	}
	throw new RangeError('Algorithm32 celestial source roster family is not supported.');
}

/**
 * Return canonical executable roster facts without serializing implementation objects.
 *
 * @param {CelestialSourceRoster} roster - Previously accepted roster.
 * @param {SpectralBasis} basis - Active profile basis.
 * @returns {CelestialSourceRosterIdentityFacts} - Canonical identity facts.
 */
function describeCelestialSourceRosterIdentity(roster, basis) {
	if (roster.family === 'spherical-sun-stars-radial-v1') {
		return {
			id: roster.id,
			family: roster.family,
			sun: acceptDistantSun(roster.sun, basis),
			stars: roster.stars === undefined || roster.stars === null ? null : acceptStars(roster.stars, basis),
		};
	}
	return {
		id: roster.id,
		family: roster.family,
		localSun: acceptFiniteSun(roster.localSun, basis),
	};
}

/** Celestial source-roster acceptance and canonical-identity methods. */
export const CelestialSourceRoster = {
	/** Call this method to accept a roster against configured model facts. */
	accept: acceptCelestialSourceRoster,
	/** Call this method to return canonical executable roster identity facts. */
	describeIdentity: describeCelestialSourceRosterIdentity,
};
