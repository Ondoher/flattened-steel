import { invert3, multiply } from './ReceptorSpectralProjection.js';

const XYZ_TO_LINEAR_REC709 = Object.freeze([
	Object.freeze([3.2409699419045226, -1.537383177570094, -0.4986107602930034]),
	Object.freeze([-0.9692436362808796, 1.8759675015077202, 0.04155505740717559]),
	Object.freeze([0.05563007969699366, -0.20397695888897652, 1.0569715142428786]),
]);
function requireCondition(value, message) { if (!value) throw new Error(message); }
function encodeSrgb(value) { return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055; }

/** CIE 170-2 MacLeod-Boynton chromaticity with a separate global brightness response. */
export class MacleodBoyntonNormalDisplayTransform {
	constructor({ projectionMatrix, lmsToXyzF, d65XyzRelative, scaledConeCoefficients,
		exponent, halfSaturationNumerator, peakLuminanceCdPerSquareMeter = 100 }) {
		requireCondition(projectionMatrix.length === 3 && projectionMatrix.every((row) => row.length === 15 && row.every((value) => Number.isFinite(value) && value >= 0)), 'Projection matrix must be finite, nonnegative, and three by fifteen.');
		requireCondition(lmsToXyzF.length === 3 && lmsToXyzF.every((row) => row.length === 3 && row.every(Number.isFinite)), 'LMS-to-XYZ_F matrix must be finite and three by three.');
		requireCondition(scaledConeCoefficients.length === 3 && scaledConeCoefficients.every((value) => Number.isFinite(value) && value > 0), 'MacLeod-Boynton coefficients must be positive.');
		this.projectionMatrix = projectionMatrix; this.lmsToXyzF = lmsToXyzF; this.xyzFToLms = invert3(lmsToXyzF); this.linearRec709ToXyz = invert3(XYZ_TO_LINEAR_REC709); this.d65XyzRelative = d65XyzRelative; this.coefficients = scaledConeCoefficients; this.exponent = exponent; this.halfSaturationNumerator = halfSaturationNumerator; this.peak = peakLuminanceCdPerSquareMeter;
		const d65Lms = multiply(this.xyzFToLms, d65XyzRelative); this.d65Chromaticity = this.chromaticity(d65Lms);
	}
	FL(LA) { const k = 1 / (5 * LA + 1); const k4 = k ** 4; return 0.2 * k4 * 5 * LA + 0.1 * (1 - k4) ** 2 * (5 * LA) ** (1 / 3); }
	sigma(LA) { requireCondition(Number.isFinite(LA) && LA > 0, 'Adapting luminance must be positive.'); return this.halfSaturationNumerator / this.FL(LA); }
	brightnessResponse(Y, LA) { requireCondition(Number.isFinite(Y) && Y >= 0, 'Y_F must be finite and nonnegative.'); if (Y === 0) return 0; const p = Y ** this.exponent; return p / (p + this.sigma(LA) ** this.exponent); }
	chromaticity(lms) { const [a, b, c] = this.coefficients; const Y = a * lms[0] + b * lms[1]; if (!(Y > 0)) return { Y: 0, l: this?.d65Chromaticity?.l ?? 0, s: this?.d65Chromaticity?.s ?? 0 }; return { Y, l: a * lms[0] / Y, s: c * lms[2] / Y }; }
	reconstructLms({ Y, l, s }) { const [a, b, c] = this.coefficients; return [l * Y / a, (1 - l) * Y / b, s * Y / c]; }
	mapChromaticity(chromaticity, displayY) {
		if (displayY === 0) return { xyzRelative: [0,0,0], signedLinearRec709: [0,0,0], neutralLinearRec709: [0,0,0], gamutScale: 1, gamutLimited: false, linearRec709: [0,0,0], encodedSrgb: [0,0,0], mappedChromaticity: { ...this.d65Chromaticity, Y: 0 } };
		const targetLms = this.reconstructLms({ ...chromaticity, Y: displayY }); const xyzRelative = multiply(this.lmsToXyzF, targetLms); const signedLinearRec709 = multiply(XYZ_TO_LINEAR_REC709, xyzRelative).map((value) => value / this.peak);
		const neutralXyz = this.d65XyzRelative.map((value) => value * displayY / 100); const neutralLinearRec709 = multiply(XYZ_TO_LINEAR_REC709, neutralXyz).map((value) => value / this.peak);
		let gamutScale = 1; for (let index = 0; index < 3; index += 1) { const origin = neutralLinearRec709[index]; const delta = signedLinearRec709[index] - origin; if (delta > 0) gamutScale = Math.min(gamutScale, (1 - origin) / delta); else if (delta < 0) gamutScale = Math.min(gamutScale, -origin / delta); }
		gamutScale = Math.max(0, Math.min(1, gamutScale)); const linearRec709 = neutralLinearRec709.map((value, index) => value + gamutScale * (signedLinearRec709[index] - value)); const encodedSrgb = linearRec709.map((value) => encodeSrgb(Math.max(0, Math.min(1, value))));
		const mappedXyz = multiply(this.linearRec709ToXyz, linearRec709).map((value) => value * this.peak); const mappedChromaticity = this.chromaticity(multiply(this.xyzFToLms, mappedXyz));
		return { xyzRelative, signedLinearRec709, neutralLinearRec709, gamutScale, gamutLimited: gamutScale < 1, linearRec709, encodedSrgb, mappedChromaticity };
	}
	transformSpectrum(spectrum, LA) { requireCondition(spectrum.length === 15 && spectrum.every((value) => Number.isFinite(value) && value >= 0), 'Transform requires one finite nonnegative native-15 spectrum.'); const lms = multiply(this.projectionMatrix, spectrum); const sourceChromaticity = this.chromaticity(lms); const response = this.brightnessResponse(sourceChromaticity.Y, LA); const displayY = this.peak * response; return { spectrum: [...spectrum], lms, sourceChromaticity, adaptingLuminanceCdPerSquareMeter: LA, sigma: this.sigma(LA), brightnessResponse: response, displayY, ...this.mapChromaticity(sourceChromaticity, displayY) }; }
	describe() { return { id: 'cie170-2-macleod-boynton-separated-brightness-rec709-v1', chromaticity: 'CIE 170-2 l_MB and s_MB from linear CIE 2006 LMS excitation', brightness: `single Y_F Naka-Rushton n=${this.exponent}; CAM16-F_L half-saturation placement`, display: 'D65 100-nit Rec.709 with same-Y neutral-directed gamut containment', sourceSpecificRules: false, exposure: null }; }
}
