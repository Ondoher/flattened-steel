import CATALOG from '../fixtures/named-atmosphere-compositions-v1.json' with {type: 'json'};
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requireCondition(condition, message) {
	if (!condition) throw new TypeError(message);
}

function freezeConstants(constants) {
	return Object.freeze({
		...constants,
		bottomRadius: Object.freeze({...constants.bottomRadius}),
		topRadius: Object.freeze({...constants.topRadius}),
		rayleighScaleHeight: Object.freeze({...constants.rayleighScaleHeight}),
		mieScaleHeight: Object.freeze({...constants.mieScaleHeight}),
	});
}

function aerosolOpticalDepthAt(constants, wavelengthMicrometers) {
	requireCondition(Number.isFinite(wavelengthMicrometers) && wavelengthMicrometers > 0,
		'wavelengthMicrometers must be positive and finite.');
	return constants.mieAngstromBeta * wavelengthMicrometers ** -constants.mieAngstromAlpha;
}

function createExecutableDefinition(entry) {
	requireCondition(ID_PATTERN.test(entry.id), `Invalid atmosphere composition id: ${entry.id}`);
	requireCondition(typeof entry.name === 'string' && entry.name.length > 0,
		`Atmosphere composition ${entry.id} requires a name.`);
	requireCondition(Number.isFinite(entry.mieLoadingMultiplier) && entry.mieLoadingMultiplier >= 0,
		`Atmosphere composition ${entry.id} requires a nonnegative Mie loading multiplier.`);

	const constants = freezeConstants({
		...CANONICAL_ATMOSPHERE_CONSTANTS,
		mieAngstromBeta:
			CANONICAL_ATMOSPHERE_CONSTANTS.mieAngstromBeta * entry.mieLoadingMultiplier,
	});
	const wavelength = CATALOG.parameterization.referenceWavelengthMicrometers;

	return Object.freeze({
		id: entry.id,
		name: entry.name,
		description: entry.description,
		availability: 'executable',
		mieLoadingMultiplier: entry.mieLoadingMultiplier,
		constants,
		derived: Object.freeze({
			mieVerticalOpticalDepthAtReferenceWavelength:
				aerosolOpticalDepthAt(constants, wavelength),
			referenceWavelengthMicrometers: wavelength,
			mieVerticalOpticalDepthAtOneMicrometer:
				aerosolOpticalDepthAt(constants, 1),
		}),
	});
}

function createUnsupportedDefinition(entry) {
	requireCondition(ID_PATTERN.test(entry.id), `Invalid atmosphere composition id: ${entry.id}`);
	return Object.freeze({
		id: entry.id,
		name: entry.name,
		availability: 'unsupported',
		reason: entry.reason,
		requiredCapabilities: Object.freeze([...entry.requiredCapabilities]),
	});
}

const EXECUTABLE = Object.freeze(CATALOG.executable.map(createExecutableDefinition));
const UNSUPPORTED = Object.freeze(CATALOG.declaredUnsupported.map(createUnsupportedDefinition));
const ALL = Object.freeze([...EXECUTABLE, ...UNSUPPORTED]);
const BY_ID = new Map(ALL.map((definition) => [definition.id, definition]));

requireCondition(BY_ID.size === ALL.length, 'Atmosphere composition ids must be unique.');

/** Return every named atmosphere composition, including declared unsupported designs. */
export function listNamedAtmosphereCompositions() {
	return ALL;
}

/** Resolve one executable composition or fail loudly for unknown/unsupported ids. */
export function resolveNamedAtmosphereComposition(id) {
	const definition = BY_ID.get(id);
	if (!definition) throw new RangeError(`Unknown atmosphere composition: ${id}`);
	if (definition.availability !== 'executable') {
		throw new RangeError(`Atmosphere composition ${id} is not executable: ${definition.reason}`);
	}
	return definition;
}

/** Return the Mie vertical optical depth implied by this model's normalized profile. */
export function mieVerticalOpticalDepthAt(constants, wavelengthMicrometers) {
	return aerosolOpticalDepthAt(constants, wavelengthMicrometers);
}

export const NAMED_ATMOSPHERE_COMPOSITION_CATALOG = Object.freeze({
	schemaId: CATALOG.schemaId,
	claimBoundary: CATALOG.claimBoundary,
	parameterization: Object.freeze({...CATALOG.parameterization}),
	executable: EXECUTABLE,
	unsupported: UNSUPPORTED,
});
