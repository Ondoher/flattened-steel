import { multiply } from './ReceptorSpectralProjection.js';

const XYZ_TO_LINEAR_REC709 = Object.freeze([
	Object.freeze([3.2409699419045226, -1.537383177570094, -0.4986107602930034]),
	Object.freeze([-0.9692436362808796, 1.8759675015077202, 0.04155505740717559]),
	Object.freeze([0.05563007969699366, -0.20397695888897652, 1.0569715142428786]),
]);

function requireCondition(value, message) { if (!value) throw new Error(message); }
function encodeSrgb(value) { return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055; }

/**
 * Minimal global RGB-range experiment.
 *
 * Standard-observer integration remains linear. The condition-wide direct-light
 * state places the RGB response midpoint; the same monotonic range is then
 * applied independently to every linear Rec.709 channel and every pixel.
 */
export class BrightnessSelectedRgbRangeTransform {
	constructor({ projectionMatrix, lmsToXyzF, exponent, fullDiskSolidAngleSteradians,
		blackResponse = 0.01, whiteResponse = 0.99 }) {
		requireCondition(projectionMatrix.length === 3 && projectionMatrix.every((row) => row.length === 15
			&& row.every((value) => Number.isFinite(value) && value >= 0)),
		'Projection matrix must be finite, nonnegative, and three by fifteen.');
		requireCondition(lmsToXyzF.length === 3 && lmsToXyzF.every((row) => row.length === 3
			&& row.every(Number.isFinite)), 'LMS-to-XYZ_F matrix must be finite and three by three.');
		requireCondition(Number.isFinite(exponent) && exponent > 0, 'Response exponent must be positive.');
		requireCondition(Number.isFinite(fullDiskSolidAngleSteradians) && fullDiskSolidAngleSteradians > 0,
		'Full disk solid angle must be positive.');
		requireCondition(blackResponse > 0 && blackResponse < 0.5
			&& whiteResponse > 0.5 && whiteResponse < 1, 'Diagnostic crossings must straddle one half.');
		this.projectionMatrix = projectionMatrix;
		this.lmsToXyzF = lmsToXyzF;
		this.exponent = exponent;
		this.fullDiskSolidAngleSteradians = fullDiskSolidAngleSteradians;
		this.blackResponse = blackResponse;
		this.whiteResponse = whiteResponse;
	}

	rangeState(adaptingLuminanceCdPerSquareMeter) {
		requireCondition(Number.isFinite(adaptingLuminanceCdPerSquareMeter)
			&& adaptingLuminanceCdPerSquareMeter > 0, 'Local brightness must be positive and finite.');
		const midpoint = adaptingLuminanceCdPerSquareMeter * Math.PI / this.fullDiskSolidAngleSteradians;
		const crossing = (response) => midpoint * (response / (1 - response)) ** (1 / this.exponent);
		const black = crossing(this.blackResponse);
		const white = crossing(this.whiteResponse);
		return {
			adaptingLuminanceCdPerSquareMeter,
			midpoint,
			blackThresholds: [black, black, black],
			whiteThresholds: [white, white, white],
		};
	}

	respond(value, midpoint) {
		if (!(value > 0)) return 0;
		const ratioPower = (value / midpoint) ** this.exponent;
		return ratioPower / (ratioPower + 1);
	}

	mapLinearRgb(signedLinearRec709, adaptingLuminanceCdPerSquareMeter) {
		const range = this.rangeState(adaptingLuminanceCdPerSquareMeter);
		const linearRec709 = signedLinearRec709.map((value) => this.respond(value, range.midpoint));
		return {
			range,
			linearRec709,
			encodedSrgb: linearRec709.map(encodeSrgb),
			gamutLimited: false,
			blackLimited: signedLinearRec709.map((value) => value <= 0),
			whiteLimited: linearRec709.map((value) => value >= this.whiteResponse),
		};
	}

	transformSpectrum(spectrum, adaptingLuminanceCdPerSquareMeter) {
		requireCondition(spectrum.length === 15 && spectrum.every((value) => Number.isFinite(value) && value >= 0),
		'RGB-range transform requires one finite nonnegative native-15 spectrum.');
		const lms = multiply(this.projectionMatrix, spectrum);
		const sourceXyz = multiply(this.lmsToXyzF, lms);
		const signedLinearRec709 = multiply(XYZ_TO_LINEAR_REC709, sourceXyz);
		return {
			spectrum: [...spectrum], lms, sourceXyz, signedLinearRec709,
			adaptingLuminanceCdPerSquareMeter,
			...this.mapLinearRgb(signedLinearRec709, adaptingLuminanceCdPerSquareMeter),
		};
	}

	describe() {
		return {
			id: 'cie2015-xyzf-local-light-rgb-range-n074-v1',
			projection: 'native-15 to CIE 2006 2-degree LMS to CIE 2015 XYZ_F to signed linear Rec.709',
			rangeMidpoint: 'L_A * pi / full analytic solar-disk solid angle',
			response: `per-channel Naka-Rushton with n=${this.exponent}`,
			diagnosticCrossings: { black: this.blackResponse, white: this.whiteResponse },
			spatialScope: 'one condition-wide range state applied uniformly to every pixel',
			sourceSpecificRules: false,
		};
	}
}
