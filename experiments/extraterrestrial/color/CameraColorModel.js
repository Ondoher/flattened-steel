import {compileCameraColorProfile} from './CameraColorProfile.js';
import {applyCameraDevelopment} from './CameraDevelopment.js';

const PLANCK_CONSTANT = 6.62607015e-34;
const SPEED_OF_LIGHT = 299792458;

function requireSpectrum(spectrum) {
	if (!Array.isArray(spectrum) && !ArrayBuffer.isView(spectrum)) throw new TypeError('Spectrum must be an array-like native-15 value.');
	if (spectrum.length !== 15 || Array.from(spectrum).some((value) => !Number.isFinite(value))) throw new Error('Spectrum must contain fifteen finite values.');
}

function multiplyMatrixVector(matrix, vector) {
	return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function clamp(value, minimum, maximum) {
	return Math.min(maximum, Math.max(minimum, value));
}

function encodeSrgb(value) {
	const bounded = clamp(value, 0, 1);
	return bounded <= 0.0031308 ? 12.92 * bounded : 1.055 * bounded ** (1 / 2.4) - 0.055;
}

function equalTriplet(left, right) {
	return left.length === 3 && right.length === 3 && left.every((value, index) => Object.is(value, right[index]));
}

function requireTriplet(values, label) {
	if ((!Array.isArray(values) && !ArrayBuffer.isView(values))
		|| values.length !== 3
		|| Array.from(values).some((value) => !Number.isFinite(value) || value < 0)) {
		throw new Error(`${label} must contain three finite nonnegative values.`);
	}
}

function applyColorStages(profile, normalizedRaw) {
	requireTriplet(normalizedRaw, 'Normalized raw camera RGB');
	const whiteBalanced = Array.from(normalizedRaw, (value, index) => clamp(
		value * profile.color.whiteBalanceMultipliers[index],
		profile.color.whiteBalanceMinimum[index],
		profile.color.whiteBalanceMaximum[index],
	));
	const xyzD65 = multiplyMatrixVector(profile.color.sensorToXyzD65Matrix3x3, whiteBalanced);
	const preDevelopmentLinearRec709D65 = multiplyMatrixVector(profile.color.xyzToLinearRec709D65Matrix3x3, xyzD65);
	const developedLinearRec709D65 = applyCameraDevelopment(profile.development, preDevelopmentLinearRec709D65);
	const encodedSrgb = developedLinearRec709D65.map(encodeSrgb);
	return {whiteBalanced, xyzD65, preDevelopmentLinearRec709D65, developedLinearRec709D65, encodedSrgb};
}

export class CameraColorModel {
	constructor(profileSource) {
		this.profile = compileCameraColorProfile(profileSource);
		Object.freeze(this);
	}

	describe() {
		return Object.freeze({
			id: `camera-color-model:${this.profile.profileId}`,
			schemaId: this.profile.schemaId,
			profileId: this.profile.profileId,
			responseKind: this.profile.response.kind,
			nativeChannelCount: this.profile.nativeBasis.channelCount,
			claimLimit: this.profile.claimLimit,
		});
	}

	traceNormalizedRaw(normalizedRaw) {
		return Object.freeze(applyColorStages(this.profile, normalizedRaw));
	}

	traceRadiance(spectrum) {
		requireSpectrum(spectrum);
		const profile = this.profile;
		const sensorPhotonIntegrals = multiplyMatrixVector(profile.response.matrix3x15, spectrum);
		const lensFactor = Math.PI / (4 * profile.capture.apertureFNumber ** 2)
			* profile.device.opticalTransmission * profile.capture.filterTransmission;
		const electronScale = lensFactor * profile.device.pixelAreaSquareMeters
			* profile.capture.shutterSeconds / (PLANCK_CONSTANT * SPEED_OF_LIGHT);
		const photoelectrons = sensorPhotonIntegrals.map((value) => value * electronScale);
		const clippedElectrons = photoelectrons.map((value) => clamp(value, 0, profile.device.fullWellElectrons));
		const rawClipped = photoelectrons.map((value) => value >= profile.device.fullWellElectrons);
		const normalizedPostGain = clippedElectrons.map((value) => clamp(
			(value - profile.device.blackLevelElectrons) / profile.device.fullWellElectrons * profile.capture.postWellGain,
			0,
			1,
		));
		const adcMaximumCode = 2 ** profile.device.adcBits - 1;
		const adcCodes = normalizedPostGain.map((value) => Math.round(value * adcMaximumCode));
		const adcClipped = normalizedPostGain.map((value) => value >= 1);
		const colorTrace = applyColorStages(profile, normalizedPostGain);
		return Object.freeze({
			sensorPhotonIntegrals,
			lensFactor,
			electronScale,
			photoelectrons,
			clippedElectrons,
			rawClipped,
			rawClipChannelCount: rawClipped.filter(Boolean).length,
			fullWellFraction: photoelectrons.map((value) => value / profile.device.fullWellElectrons),
			normalizedPostGain,
			adcMaximumCode,
			adcCodes,
			adcClipped,
			...colorTrace,
		});
	}

	radianceToLinearOutput(spectrum) {
		return this.traceRadiance(spectrum).developedLinearRec709D65;
	}

	radianceToDisplayRgb(spectrum) {
		return this.traceRadiance(spectrum).encodedSrgb;
	}

	transformField(spectra) {
		if (!Array.isArray(spectra)) throw new TypeError('Field must be an array of native-15 spectra.');
		let rawClippedPixelCount = 0;
		let adcClippedPixelCount = 0;
		const displayRgb = spectra.map((spectrum) => {
			const trace = this.traceRadiance(spectrum);
			const publicValue = this.radianceToDisplayRgb(spectrum);
			if (!equalTriplet(publicValue, trace.encodedSrgb)) throw new Error('Public Color result diverged from trace terminal value.');
			if (trace.rawClipChannelCount > 0) rawClippedPixelCount += 1;
			if (trace.adcClipped.some(Boolean)) adcClippedPixelCount += 1;
			return publicValue;
		});
		return Object.freeze({displayRgb, rawClippedPixelCount, adcClippedPixelCount});
	}
}
