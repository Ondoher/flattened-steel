/**
 * Bright Star Catalogue V/50 import and deterministic roster selection.
 *
 * This module intentionally stops at catalog coordinates and V-band
 * photometry.  V/50 does not contain the native-15 spectral source packet
 * required by the atmospheric cache, so it must not be treated as one.
 */
export const BRIGHT_STAR_CATALOG_V50 = Object.freeze({
	catalogId: 'cds-v50-bright-star-catalogue-5th-revised',
	coordinateEpoch: 'J2000.0',
	coordinateFrame: 'eq-FK5-J2000',
	coordinateContract: 'celestial-rh-v1',
	sourceSha256: 'sha256:d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759',
	selection: 'finite-j2000-position-and-vmag; ascending-vmag; ascending-hr-tiebreak; first-500',
});

function finite(value, label) {
	if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
	return value;
}

function parseRightAscension(value) {
	const match = /^(\d{2})\s+(\d{2})\s+(\d{1,2}(?:\.\d+)?)$/.exec(value.trim());
	if (!match) throw new RangeError(`Invalid J2000 right ascension: ${value}`);
	const hours = Number(match[1]) + Number(match[2]) / 60 + Number(match[3]) / 3600;
	if (!(hours >= 0 && hours < 24)) throw new RangeError(`J2000 right ascension is outside [0, 24): ${value}`);
	return hours;
}

function parseDeclination(value) {
	const match = /^([+-])(\d{2})\s+(\d{2})\s+(\d{2})$/.exec(value.trim());
	if (!match) throw new RangeError(`Invalid J2000 declination: ${value}`);
	const degrees = Number(match[2]) + Number(match[3]) / 60 + Number(match[4]) / 3600;
	if (degrees > 90) throw new RangeError(`J2000 declination is outside [-90, 90]: ${value}`);
	return (match[1] === '-' ? -1 : 1) * degrees;
}

function longitudeFromRightAscensionHours(rightAscensionHours) {
	const longitude = rightAscensionHours * Math.PI / 12;
	return longitude >= Math.PI ? longitude - 2 * Math.PI : longitude;
}

/** Parse the checked-in VizieR TSV source without deriving a runtime cache. */
export function parseBrightStarCatalogV50(text) {
	if (typeof text !== 'string') throw new TypeError('V/50 TSV content must be text.');
	const records = [];
	for (const line of text.split(/\r?\n/)) {
		if (!/^\s*\d+\t/.test(line)) continue;
		const [hrField, nameField, rightAscensionField, declinationField, magnitudeField, magnitudeCodeField, magnitudeUncertaintyField, bMinusVField, spectralTypeField] = line.split('\t');
		const hr = Number(hrField.trim());
		const visualMagnitude = Number(magnitudeField.trim());
		if (!Number.isSafeInteger(hr) || !rightAscensionField.trim() || !declinationField.trim() || !Number.isFinite(visualMagnitude)) continue;
		const rightAscensionJ2000Hours = parseRightAscension(rightAscensionField);
		const declinationJ2000Degrees = parseDeclination(declinationField);
		const latitudeRadians = declinationJ2000Degrees * Math.PI / 180;
		const longitudeRadians = longitudeFromRightAscensionHours(rightAscensionJ2000Hours);
		const bMinusV = Number(bMinusVField.trim());
		records.push(Object.freeze({
			memberId: `bsc-v50-hr-${hr}`,
			hr,
			name: nameField.trim() || null,
			rightAscensionJ2000Hours,
			declinationJ2000Degrees,
			latitudeRadians,
			longitudeRadians,
			visualMagnitude,
			visualMagnitudeCode: magnitudeCodeField.trim() || null,
			visualMagnitudeUncertainty: magnitudeUncertaintyField.trim() || null,
			bMinusV: Number.isFinite(bMinusV) ? bMinusV : null,
			spectralType: spectralTypeField.trim() || null,
		}));
	}
	return Object.freeze(records);
}

/** Select a stable, location-ready roster.  V-band flux is relative only. */
export function selectBrightestBrightStarCatalogMembers(records, limit = 500) {
	if (!Array.isArray(records)) throw new TypeError('V/50 records must be an array.');
	if (!Number.isSafeInteger(limit) || limit < 1) throw new RangeError('Catalog roster limit must be a positive integer.');
	const ranked = records.map((record) => {
		finite(record?.latitudeRadians, 'Catalog latitudeRadians');
		finite(record?.longitudeRadians, 'Catalog longitudeRadians');
		finite(record?.visualMagnitude, 'Catalog visualMagnitude');
		if (!Number.isSafeInteger(record?.hr)) throw new TypeError('Catalog HR identifier must be an integer.');
		return record;
	}).sort((left, right) => left.visualMagnitude - right.visualMagnitude || left.hr - right.hr).slice(0, limit);
	if (ranked.length !== limit) throw new RangeError(`V/50 contains only ${ranked.length} valid records; ${limit} requested.`);
	if (new Set(ranked.map((record) => record.memberId)).size !== ranked.length) throw new RangeError('Selected V/50 roster contains duplicate member ids.');
	const brightestMagnitude = ranked[0].visualMagnitude;
	return Object.freeze(ranked.map((record) => Object.freeze({
		...record,
		relativeVBandFlux: 10 ** (-0.4 * (record.visualMagnitude - brightestMagnitude)),
	})));
}

export function canonicalDirectionFromCatalogCoordinate({ latitudeRadians, longitudeRadians }) {
	finite(latitudeRadians, 'Catalog latitudeRadians');
	finite(longitudeRadians, 'Catalog longitudeRadians');
	if (latitudeRadians < -Math.PI / 2 || latitudeRadians > Math.PI / 2) throw new RangeError('Catalog latitudeRadians is outside [-pi/2, pi/2].');
	if (longitudeRadians < -Math.PI || longitudeRadians >= Math.PI) throw new RangeError('Catalog longitudeRadians is outside [-pi, pi).');
	const cosineLatitude = Math.cos(latitudeRadians);
	return Object.freeze([cosineLatitude * Math.cos(longitudeRadians), cosineLatitude * Math.sin(longitudeRadians), Math.sin(latitudeRadians)]);
}

/**
 * Build the static source side of the existing geometry placement contract.
 * The caller still owns the live bodyFromCelestial transform and epoch.
 */
export function createCatalogPointSourceDefinitions(members, {
	celestialFrameId = 'celestial-rh-v1',
	timeScale = 'unix-seconds',
	placementProviderContractFingerprint = 'bright-star-catalog-v50-provider-v1',
} = {}) {
	if (!Array.isArray(members) || members.length < 1) throw new TypeError('Catalog source definitions require members.');
	return Object.freeze(members.map((member) => Object.freeze({
		sourceId: member.memberId,
		sourceKind: 'point',
		placementKind: 'infinite-direction',
		depth: 'infinite',
		sourceDefinitionFingerprint: `bright-star-catalog-v50:${member.memberId}:lat-${member.latitudeRadians}:lon-${member.longitudeRadians}:vmag-${member.visualMagnitude}`,
		placementProviderContractFingerprint,
		placementProviderContract: Object.freeze({
			frameId: celestialFrameId,
			originConvention: 'observer-independent-infinite-direction',
			directionConvention: 'receiver-to-source',
			timeScale,
		}),
		support: Object.freeze({ kind: 'point' }),
	})));
}

/** Produce live source placements in the canonical celestial frame only. */
export function createCatalogPointPlacementStates(members, {
	celestialFrameId = 'celestial-rh-v1',
	timeScale = 'unix-seconds',
	epoch,
	placementProviderContractFingerprint = 'bright-star-catalog-v50-provider-v1',
} = {}) {
	if (!Array.isArray(members) || members.length < 1) throw new TypeError('Catalog placements require members.');
	if (!epoch || epoch.units !== 'seconds' || epoch.timeScale !== timeScale || !Number.isFinite(epoch.value)) throw new TypeError('Catalog placements require a compatible epoch.');
	return Object.freeze(members.map((member) => Object.freeze({
		sourceId: member.memberId,
		direction: canonicalDirectionFromCatalogCoordinate(member),
		frameId: celestialFrameId,
		originConvention: 'observer-independent-infinite-direction',
		directionConvention: 'receiver-to-source',
		epoch: Object.freeze({ value: epoch.value, units: 'seconds', timeScale }),
		placementProviderContractFingerprint,
		placementStateFingerprint: `bright-star-catalog-v50:${member.memberId}:j2000:epoch-${epoch.value}`,
	})));
}
