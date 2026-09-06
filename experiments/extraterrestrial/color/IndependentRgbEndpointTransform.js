import { multiply } from './ReceptorSpectralProjection.js';

const XYZ_TO_LINEAR_REC709 = Object.freeze([
	Object.freeze([3.2409699419045226, -1.537383177570094, -0.4986107602930034]),
	Object.freeze([-0.9692436362808796, 1.8759675015077202, 0.04155505740717559]),
	Object.freeze([0.05563007969699366, -0.20397695888897652, 1.0569715142428786]),
]);
function requireCondition(value, message) { if (!value) throw new Error(message); }
function encodeSrgb(value) { return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055; }

export function projectSpectrumToLinearRec709(projectionMatrix, lmsToXyzF, spectrum) {
	const lms = multiply(projectionMatrix, spectrum); const sourceXyz = multiply(lmsToXyzF, lms);
	return { lms, sourceXyz, signedLinearRec709: multiply(XYZ_TO_LINEAR_REC709, sourceXyz) };
}

/** Fixed-shape logarithmic mapping between independently calibrated RGB endpoints. */
export class IndependentRgbEndpointTransform {
	constructor({ projectionMatrix, lmsToXyzF, referenceAdaptingLuminance,
		blackReference, whiteReference, endpointAdaptationSlope, id }) {
		requireCondition(projectionMatrix.length === 3 && projectionMatrix.every((row) => row.length === 15), 'Projection matrix must be three by fifteen.');
		requireCondition([blackReference, whiteReference].every((entry) => entry.length === 3 && entry.every((value) => Number.isFinite(value) && value > 0)), 'RGB endpoints must be positive finite triplets.');
		requireCondition(whiteReference.every((value, index) => value > blackReference[index]), 'Every white endpoint must exceed its black endpoint.');
		requireCondition(Number.isFinite(referenceAdaptingLuminance) && referenceAdaptingLuminance > 0 && Number.isFinite(endpointAdaptationSlope) && endpointAdaptationSlope >= 0 && endpointAdaptationSlope < 1, 'Reference luminance and sublinear endpoint slope are required.');
		this.projectionMatrix = projectionMatrix; this.lmsToXyzF = lmsToXyzF; this.referenceAdaptingLuminance = referenceAdaptingLuminance; this.blackReference = [...blackReference]; this.whiteReference = [...whiteReference]; this.endpointAdaptationSlope = endpointAdaptationSlope; this.id = id;
	}
	rangeState(LA) { requireCondition(Number.isFinite(LA) && LA > 0, 'Local brightness must be positive.'); const scale = (LA / this.referenceAdaptingLuminance) ** this.endpointAdaptationSlope; return { adaptingLuminanceCdPerSquareMeter: LA, scale, blackThresholds: this.blackReference.map((value) => value * scale), whiteThresholds: this.whiteReference.map((value) => value * scale) }; }
	mapChannel(value, black, white) { if (!(value > black)) return 0; if (value >= white) return 1; return Math.log(value / black) / Math.log(white / black); }
	mapLinearRgb(signedLinearRec709, LA) { const range = this.rangeState(LA); const linearRec709 = signedLinearRec709.map((value, index) => this.mapChannel(value, range.blackThresholds[index], range.whiteThresholds[index])); return { range, linearRec709, encodedSrgb: linearRec709.map(encodeSrgb), gamutLimited: false, blackLimited: signedLinearRec709.map((value, index) => value <= range.blackThresholds[index]), whiteLimited: signedLinearRec709.map((value, index) => value >= range.whiteThresholds[index]) }; }
	transformSpectrum(spectrum, LA) { requireCondition(spectrum.length === 15 && spectrum.every((value) => Number.isFinite(value) && value >= 0), 'Endpoint transform requires one finite nonnegative native-15 spectrum.'); const projected = projectSpectrumToLinearRec709(this.projectionMatrix, this.lmsToXyzF, spectrum); return { spectrum: [...spectrum], ...projected, adaptingLuminanceCdPerSquareMeter: LA, ...this.mapLinearRgb(projected.signedLinearRec709, LA) }; }
	describe() { return { id: this.id, projection: 'native-15 to CIE 2006 LMS to CIE 2015 XYZ_F to signed linear Rec.709', mapping: 'independent logarithmic RGB black-to-white endpoint mapping', endpointAdaptationSlope: this.endpointAdaptationSlope, referenceAdaptingLuminanceCdPerSquareMeter: this.referenceAdaptingLuminance, blackReference: this.blackReference, whiteReference: this.whiteReference, sourceSpecificRules: false }; }
}
