import {validateCameraDevelopmentProfile} from './CameraDevelopment.js';

const PROFILE_SCHEMA_ID = 'camera-color-profile-v1';

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function finitePositive(value, label) {
	requireCondition(Number.isFinite(value) && value > 0, `${label} must be positive and finite.`);
}

function finiteNonnegative(value, label) {
	requireCondition(Number.isFinite(value) && value >= 0, `${label} must be nonnegative and finite.`);
}

function matrix(value, rows, columns, label) {
	requireCondition(Array.isArray(value) && value.length === rows, `${label} row count is invalid.`);
	for (const row of value) {
		requireCondition(Array.isArray(row) && row.length === columns, `${label} column count is invalid.`);
		requireCondition(row.every(Number.isFinite), `${label} contains a non-finite value.`);
	}
}

function triplet(value, label, {positive = false} = {}) {
	requireCondition(Array.isArray(value) && value.length === 3, `${label} must have three channels.`);
	requireCondition(value.every((entry) => Number.isFinite(entry) && (!positive || entry > 0)), `${label} is invalid.`);
}

function deepFreeze(value) {
	if (value && typeof value === 'object' && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const child of Object.values(value)) deepFreeze(child);
	}
	return value;
}

export function compileCameraColorProfile(source) {
	requireCondition(source && typeof source === 'object' && !Array.isArray(source), 'Camera Color profile must be an object.');
	const profile = structuredClone(source);
	requireCondition(profile.schemaId === PROFILE_SCHEMA_ID, `Camera Color profile schema must be ${PROFILE_SCHEMA_ID}.`);
	requireCondition(typeof profile.profileId === 'string' && profile.profileId.length > 0, 'Camera Color profile ID is required.');
	requireCondition(profile.nativeBasis?.channelCount === 15, 'Camera Color profile must use the native-15 basis.');
	requireCondition(profile.nativeBasis?.radianceUnits === 'W m^-2 sr^-1 nm^-1', 'Camera Color profile radiance units are invalid.');
	requireCondition(profile.response?.kind === 'quantum-efficiency-photon-integral', 'The initial physical model requires a QE photon-integral response.');
	requireCondition(profile.response?.matrixUnits === 'm', 'QE photon-integral weights must have meter units.');
	matrix(profile.response.matrix3x15, 3, 15, 'Sensor response matrix');
	finitePositive(profile.device.pixelAreaSquareMeters, 'Pixel area');
	finitePositive(profile.device.opticalTransmission, 'Optical transmission');
	requireCondition(profile.device.opticalTransmission <= 1, 'Optical transmission cannot exceed one.');
	finitePositive(profile.device.fullWellElectrons, 'Full well');
	requireCondition(Number.isInteger(profile.device.adcBits) && profile.device.adcBits >= 1 && profile.device.adcBits <= 32, 'ADC bit depth is invalid.');
	requireCondition(profile.device.noise?.enabled === false, 'D0/T0 requires deterministic noise-off operation.');
	finitePositive(profile.capture.shutterSeconds, 'Shutter time');
	finitePositive(profile.capture.apertureFNumber, 'Aperture f-number');
	finitePositive(profile.capture.filterTransmission, 'Filter transmission');
	requireCondition(profile.capture.filterTransmission <= 1, 'Filter transmission cannot exceed one.');
	finitePositive(profile.capture.postWellGain, 'Post-well gain');
	triplet(profile.color.whiteBalanceMultipliers, 'White-balance multipliers', {positive: true});
	triplet(profile.color.whiteBalanceMinimum, 'White-balance minimum');
	triplet(profile.color.whiteBalanceMaximum, 'White-balance maximum');
	for (let index = 0; index < 3; index += 1) requireCondition(profile.color.whiteBalanceMinimum[index] <= profile.color.whiteBalanceMaximum[index], 'White-balance bounds are reversed.');
	matrix(profile.color.sensorToXyzD65Matrix3x3, 3, 3, 'Sensor-to-XYZ matrix');
	matrix(profile.color.xyzToLinearRec709D65Matrix3x3, 3, 3, 'XYZ-to-Rec.709 matrix');
	validateCameraDevelopmentProfile(profile.development);
	requireCondition(profile.output?.encoding === 'iec-61966-2-1-srgb', 'D0/T0 requires IEC sRGB encoding.');
	requireCondition(Array.isArray(profile.parents) && profile.parents.length > 0, 'Profile parent evidence is required.');
	for (const parent of profile.parents) {
		requireCondition(typeof parent.runId === 'string' && /^[0-9]{6}-/u.test(parent.runId), 'Profile parent run ID is invalid.');
		requireCondition(typeof parent.artifactSetSha256 === 'string' && /^[a-f0-9]{64}$/u.test(parent.artifactSetSha256), 'Profile parent artifact-set hash is invalid.');
	}
	finiteNonnegative(profile.device.blackLevelElectrons, 'Black level');
	return deepFreeze(profile);
}

const DERIVABLE_FIELDS = new Set([
	'capture.shutterSeconds',
	'capture.apertureFNumber',
	'capture.filterTransmission',
	'device.pixelAreaSquareMeters',
	'device.fullWellElectrons',
	'device.adcBits',
	'capture.postWellGain',
	'color.whiteBalanceMultipliers',
	'color.whiteBalanceMinimum',
	'color.whiteBalanceMaximum',
	'color.sensorToXyzD65Matrix3x3',
]);

export function deriveCameraColorProfile(baseSource, {profileId, path, value, derivation}) {
	const base = compileCameraColorProfile(baseSource);
	requireCondition(typeof profileId === 'string' && profileId.length > 0 && profileId !== base.profileId, 'Derived profile ID is invalid.');
	requireCondition(DERIVABLE_FIELDS.has(path), `Profile field is not derivable in the current Camera Color model: ${path}`);
	requireCondition(derivation && typeof derivation === 'object' && !Array.isArray(derivation), 'Derived profile evidence is required.');
	const result = structuredClone(base);
	const [owner, field] = path.split('.');
	const priorValue = result[owner][field];
	result[owner][field] = value;
	result.profileId = profileId;
	result.derivedFrom = {profileId: base.profileId, changedField: path, priorValue, value, ...structuredClone(derivation)};
	return compileCameraColorProfile(result);
}

export {PROFILE_SCHEMA_ID};
