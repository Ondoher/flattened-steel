import { projectSpectrumToLinearRec709 } from './IndependentRgbEndpointTransform.js';

function requireCondition(value, message) { if (!value) throw new Error(message); }
function encodeSrgb(value) { return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055; }

/** Diagnostic scene-linear RGB exposure. It has no local-light or adapting-state input. */
export class FixedExposureLinearRgbTransform {
	constructor({ projectionMatrix, lmsToXyzF, exposure, id, projectionDescription = 'native-15 to CIE 2006 LMS to CIE 2015 XYZ_F to signed linear Rec.709' }) {
		requireCondition(Number.isFinite(exposure) && exposure > 0, 'A positive fixed exposure is required.');
		this.projectionMatrix = projectionMatrix; this.lmsToXyzF = lmsToXyzF;
		this.exposure = exposure; this.id = id; this.projectionDescription = projectionDescription;
	}
	transformSpectrum(spectrum) {
		requireCondition(spectrum.length === 15 && spectrum.every((value) => Number.isFinite(value) && value >= 0), 'Fixed exposure requires one finite nonnegative native-15 spectrum.');
		const projected = projectSpectrumToLinearRec709(this.projectionMatrix, this.lmsToXyzF, spectrum);
		const exposedLinearRec709 = projected.signedLinearRec709.map((value) => value * this.exposure);
		const linearRec709 = exposedLinearRec709.map((value) => Math.max(0, Math.min(1, value)));
		const clipped = linearRec709.some((value, index) => value !== exposedLinearRec709[index]);
		return { spectrum: [...spectrum], ...projected, exposedLinearRec709, linearRec709,
			encodedSrgb: linearRec709.map(encodeSrgb), gamutLimited: clipped,
			blackLimited: linearRec709.every((value) => value === 0),
			whiteLimited: linearRec709.every((value) => value === 1) };
	}
	describe() { return { id: this.id, projection: this.projectionDescription, exposure: this.exposure, mapping: 'one fixed scalar multiplication in scene-linear RGB, then display clipping and standard sRGB encoding', localBrightnessInput: false, adaptation: false, toneCurve: false, channelAdjustment: false, sourceSpecificRules: false }; }
}
