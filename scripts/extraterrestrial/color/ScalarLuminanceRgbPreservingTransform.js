import { projectSpectrumToLinearRec709 } from './IndependentRgbEndpointTransform.js';

const LUMA = Object.freeze([0.2126, 0.7152, 0.0722]);
function requireCondition(value, message) { if (!value) throw new Error(message); }
function encodeSrgb(value) { return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055; }
function luminance(rgb) { return rgb.reduce((sum, value, index) => sum + LUMA[index] * value, 0); }

/** One scalar luminance mapping followed by an identical gain on linear R, G, and B. */
export class ScalarLuminanceRgbPreservingTransform {
	constructor({ projectionMatrix, lmsToXyzF, referenceAdaptingLuminance,
		blackReference, whiteReference, endpointAdaptationSlope, id }) {
		requireCondition(Number.isFinite(blackReference) && blackReference > 0
			&& Number.isFinite(whiteReference) && whiteReference > blackReference,
		'Scalar black and white endpoints must be positive and ordered.');
		requireCondition(Number.isFinite(referenceAdaptingLuminance) && referenceAdaptingLuminance > 0
			&& Number.isFinite(endpointAdaptationSlope) && endpointAdaptationSlope >= 0
			&& endpointAdaptationSlope < 1, 'Reference luminance and sublinear endpoint slope are required.');
		this.projectionMatrix = projectionMatrix; this.lmsToXyzF = lmsToXyzF;
		this.referenceAdaptingLuminance = referenceAdaptingLuminance;
		this.blackReference = blackReference; this.whiteReference = whiteReference;
		this.endpointAdaptationSlope = endpointAdaptationSlope; this.id = id;
	}
	rangeState(LA) { requireCondition(Number.isFinite(LA) && LA > 0, 'Local brightness must be positive.'); const scale = (LA / this.referenceAdaptingLuminance) ** this.endpointAdaptationSlope; return { adaptingLuminanceCdPerSquareMeter: LA, scale, blackThreshold: this.blackReference * scale, whiteThreshold: this.whiteReference * scale }; }
	mapLuminance(value, black, white) { if (!(value > black)) return 0; if (value >= white) return 1; return Math.log(value / black) / Math.log(white / black); }
	mapLinearRgb(signedLinearRec709, LA) {
		const range = this.rangeState(LA); const sourceY = luminance(signedLinearRec709);
		if (!(sourceY > range.blackThreshold)) return { range, sourceY, mappedY: 0, commonGain: 0, gamutScale: 1, gamutLimited: false, linearRec709: [0,0,0], encodedSrgb: [0,0,0], blackLimited: true, whiteLimited: false };
		const mappedY = this.mapLuminance(sourceY, range.blackThreshold, range.whiteThreshold); const commonGain = mappedY / sourceY; const uncontained = signedLinearRec709.map((value) => Math.max(0, value * commonGain)); const maximum = Math.max(...uncontained); const gamutScale = maximum > 1 ? 1 / maximum : 1; const linearRec709 = uncontained.map((value) => value * gamutScale);
		return { range, sourceY, mappedY, commonGain, uncontainedLinearRec709: uncontained, gamutScale, gamutLimited: gamutScale < 1, linearRec709, encodedSrgb: linearRec709.map(encodeSrgb), blackLimited: false, whiteLimited: sourceY >= range.whiteThreshold };
	}
	transformSpectrum(spectrum, LA) { requireCondition(spectrum.length === 15 && spectrum.every((value) => Number.isFinite(value) && value >= 0), 'Scalar transform requires one finite nonnegative native-15 spectrum.'); const projected = projectSpectrumToLinearRec709(this.projectionMatrix, this.lmsToXyzF, spectrum); return { spectrum: [...spectrum], ...projected, adaptingLuminanceCdPerSquareMeter: LA, ...this.mapLinearRgb(projected.signedLinearRec709, LA) }; }
	describe() { return { id: this.id, projection: 'native-15 to CIE 2006 LMS to CIE 2015 XYZ_F to signed linear Rec.709', brightness: 'one logarithmic scalar map of Rec.709 luminance', chromaticity: 'one identical gain on linear R, G, and B; common scale only for final positive-gamut containment', endpointAdaptationSlope: this.endpointAdaptationSlope, referenceAdaptingLuminanceCdPerSquareMeter: this.referenceAdaptingLuminance, blackReference: this.blackReference, whiteReference: this.whiteReference, sourceSpecificRules: false }; }
}
