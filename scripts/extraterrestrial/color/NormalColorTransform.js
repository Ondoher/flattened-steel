const XYZ_TO_LINEAR_SRGB = [
	[3.2406, -1.5372, -0.4986],
	[-0.9689, 1.8758, 0.0415],
	[0.0557, -0.204, 1.057],
];
const D65_XYZ = [0.95047, 1, 1.08883];

function requireCondition(value, message) { if (!value) throw new Error(message); }
function multiply(matrix, vector) { return matrix.map((row) => row.reduce((sum, coefficient, index) => sum + coefficient * vector[index], 0)); }
function encodeSrgbChannel(value) { return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055; }

/** Fixed, source-independent Stage 2 diagnostic spectral Color transform. */
export class NormalColorTransform {
	constructor({ cieRows, spectralBasis, displayPeakNits, luminancePivotCdPerSquareMeter, nitsPerStop }) {
		requireCondition(cieRows instanceof Map && cieRows.size === 471, 'Normal Color requires the official 471-row CIE table.');
		requireCondition(spectralBasis?.channels?.length === 15, 'Normal Color requires the retained native-15 basis.');
		for (const [name, value] of Object.entries({ displayPeakNits, luminancePivotCdPerSquareMeter, nitsPerStop })) requireCondition(Number.isFinite(value) && value > 0, `${name} must be positive and finite.`);
		this.cieRows = cieRows; this.spectralBasis = spectralBasis; this.displayPeakNits = displayPeakNits; this.luminancePivotCdPerSquareMeter = luminancePivotCdPerSquareMeter; this.nitsPerStop = nitsPerStop;
	}

	cieAt(wavelength) {
		const lowerIndex = Math.floor(wavelength); const upperIndex = Math.ceil(wavelength); const lower = this.cieRows.get(lowerIndex); const upper = this.cieRows.get(upperIndex);
		requireCondition(lower && upper, `CIE table does not bracket ${wavelength} nm.`); if (lowerIndex === upperIndex) return lower;
		const fraction = wavelength - lowerIndex; return lower.map((value, index) => value + fraction * (upper[index] - value));
	}

	projectSpectrum(values) {
		requireCondition(Array.isArray(values) && values.length === 15 && values.every((value) => Number.isFinite(value) && value >= 0), 'Normal Color requires one finite nonnegative native-15 spectrum.');
		const xyz = [0, 0, 0];
		for (let index = 0; index < values.length; index += 1) { const channel = this.spectralBasis.channels[index]; const matching = this.cieAt(channel.center.value); const weighted = values[index] * channel.width.value * 683; for (let axis = 0; axis < 3; axis += 1) xyz[axis] += matching[axis] * weighted; }
		return xyz;
	}

	mapLuminance(luminance) { return this.nitsPerStop * Math.log2(1 + Math.max(0, luminance) / this.luminancePivotCdPerSquareMeter); }

	transformXyz(xyz) {
		requireCondition(Array.isArray(xyz) && xyz.length === 3 && xyz.every(Number.isFinite) && xyz[1] >= 0, 'Normal Color requires finite XYZ with nonnegative Y.');
		const inputY = xyz[1]; const mappedY = this.mapLuminance(inputY); const mappedXyz = inputY > 0 ? xyz.map((value) => value * mappedY / inputY) : [0, 0, 0];
		const signedDisplayLinearSrgb = multiply(XYZ_TO_LINEAR_SRGB, mappedXyz).map((value) => value / this.displayPeakNits);
		const neutral = D65_XYZ.map((value) => value * mappedY); const neutralLinearSrgb = multiply(XYZ_TO_LINEAR_SRGB, neutral).map((value) => value / this.displayPeakNits);
		let gamutScale = 1;
		for (let index = 0; index < 3; index += 1) { const origin = neutralLinearSrgb[index]; const delta = signedDisplayLinearSrgb[index] - origin; if (delta > 0) gamutScale = Math.min(gamutScale, (1 - origin) / delta); else if (delta < 0) gamutScale = Math.min(gamutScale, (0 - origin) / delta); }
		gamutScale = Math.max(0, Math.min(1, gamutScale));
		const gamutMappedLinearSrgb = neutralLinearSrgb.map((value, index) => value + gamutScale * (signedDisplayLinearSrgb[index] - value));
		const encodedSrgb = gamutMappedLinearSrgb.map((value) => encodeSrgbChannel(Math.max(0, Math.min(1, value))));
		const xyzSum = xyz.reduce((sum, value) => sum + value, 0); const mappedSum = mappedXyz.reduce((sum, value) => sum + value, 0);
		return { inputXyz: xyz, inputLuminanceCdPerSquareMeter: inputY, inputChromaticityXy: xyzSum > 0 ? [xyz[0] / xyzSum, xyz[1] / xyzSum] : [0, 0], mappedLuminanceNitsUnbounded: mappedY, mappedXyz, mappedChromaticityXy: mappedSum > 0 ? [mappedXyz[0] / mappedSum, mappedXyz[1] / mappedSum] : [0, 0], signedDisplayLinearSrgb, neutralLinearSrgb, gamutScale, gamutMappedLinearSrgb, encodedSrgb };
	}

	transformSpectrum(values) { return { inputSpectrum: [...values], ...this.transformXyz(this.projectSpectrum(values)) }; }

	describe() { return { id: 'normal-color-stage2-log-luminance-d65-rgb-line-v1', observer: 'CIE 1931 2-degree native-bin-center projection', luminanceMapping: { kind: 'unbounded-log2-one-plus', pivot: { value: this.luminancePivotCdPerSquareMeter, units: 'candelas-per-square-meter' }, nitsPerStop: this.nitsPerStop }, gamutMapping: 'same-luminance D65 neutral to signed-linear-sRGB line intersection', display: { primaries: 'Rec.709', white: 'D65', peak: { value: this.displayPeakNits, units: 'nits' }, encoding: 'IEC 61966-2-1 sRGB piecewise' }, sourceSpecificRules: false };
}
}

export function parseCie1931(text) {
	const rows = new Map(); for (const line of text.trim().split(/\r?\n/u)) { const values = line.split(',').map(Number); if (values.length === 4 && values.every(Number.isFinite)) rows.set(values[0], values.slice(1)); }
	requireCondition(rows.size === 471, 'Official CIE table must contain 471 rows.'); return rows;
}
