import {invert3, multiply} from './ReceptorSpectralProjection.js';

const XYZ_TO_LINEAR_REC709 = Object.freeze([
	Object.freeze([3.2409699419045226, -1.537383177570094, -0.4986107602930034]),
	Object.freeze([-0.9692436362808796, 1.8759675015077202, 0.04155505740717559]),
	Object.freeze([0.05563007969699366, -0.20397695888897652, 1.0569715142428786]),
]);

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function encodeSrgb(value) {
	return value <= 0.0031308
		? 12.92 * value
		: 1.055 * value ** (1 / 2.4) - 0.055;
}

function finiteTriplet(value, label, {nonnegative = false} = {}) {
	requireCondition(Array.isArray(value) && value.length === 3
		&& value.every((entry) => Number.isFinite(entry) && (!nonnegative || entry >= 0)),
	`${label} must be one finite${nonnegative ? ' nonnegative' : ''} triplet.`);
}

function opponentHue(response, neutralResponse) {
	const delta = response.map((value) => value - neutralResponse);
	const a = delta[0] - delta[1];
	const b = delta[2] - (delta[0] + delta[1]) / 2;
	return {
		a,
		b,
		magnitude: Math.hypot(a, b),
		degrees: (Math.atan2(b, a) * 180 / Math.PI + 360) % 360,
	};
}

/** Fixed global receptor response and D65-normalized display bridge. */
export class ReceptorNormalDisplayTransform {
	constructor({projectionMatrix, channelScale, lmsToXyzF, d65XyzRelative,
		exponent, halfSaturationNumerator}) {
		requireCondition(Array.isArray(projectionMatrix) && projectionMatrix.length === 3
			&& projectionMatrix.every((row) => Array.isArray(row) && row.length === 15
				&& row.every((value) => Number.isFinite(value) && value >= 0)),
		'Projection matrix must be finite, nonnegative, and three by fifteen.');
		finiteTriplet(channelScale, 'channelScale', {nonnegative: true});
		finiteTriplet(d65XyzRelative, 'd65XyzRelative', {nonnegative: true});
		requireCondition(Array.isArray(lmsToXyzF) && lmsToXyzF.length === 3
			&& lmsToXyzF.every((row) => Array.isArray(row) && row.length === 3
				&& row.every(Number.isFinite)), 'lmsToXyzF must be one finite three by three matrix.');
		requireCondition(Number.isFinite(exponent) && exponent > 0
			&& Number.isFinite(halfSaturationNumerator) && halfSaturationNumerator > 0,
		'Receptor response parameters must be positive and finite.');
		this.projectionMatrix = projectionMatrix;
		this.channelScale = channelScale;
		this.lmsToXyzF = lmsToXyzF;
		this.xyzFToLms = invert3(lmsToXyzF);
		this.d65XyzRelative = d65XyzRelative;
		this.linearRec709ToXyz = invert3(XYZ_TO_LINEAR_REC709);
		this.exponent = exponent;
		this.halfSaturationNumerator = halfSaturationNumerator;
	}

	FL(adaptingLuminance) {
		requireCondition(Number.isFinite(adaptingLuminance) && adaptingLuminance > 0,
			'Adapting luminance must be positive and finite.');
		const k = 1 / (5 * adaptingLuminance + 1);
		const k4 = k ** 4;
		return 0.2 * k4 * 5 * adaptingLuminance
			+ 0.1 * (1 - k4) ** 2 * (5 * adaptingLuminance) ** (1 / 3);
	}

	sigma(adaptingLuminance) {
		return this.halfSaturationNumerator / this.FL(adaptingLuminance);
	}

	respond(normalizedLms, adaptingLuminance) {
		finiteTriplet(normalizedLms, 'normalizedLms', {nonnegative: true});
		const sigmaPower = this.sigma(adaptingLuminance) ** this.exponent;
		return normalizedLms.map((value) => {
			const power = value ** this.exponent;
			return power / (power + sigmaPower);
		});
	}

	mapResponse(response) {
		finiteTriplet(response, 'response', {nonnegative: true});
		requireCondition(response.every((value) => value <= 1),
			'Receptor responses must not exceed one.');
		const normalizedDisplayLms = response.map((value) => 100 * value);
		const rawDisplayLms = normalizedDisplayLms.map((value, index) =>
			value / this.channelScale[index]);
		const xyzRelative = multiply(this.lmsToXyzF, rawDisplayLms);
		const signedLinearRec709 = multiply(XYZ_TO_LINEAR_REC709, xyzRelative)
			.map((value) => value / 100);
		const relativeY = xyzRelative[1] / 100;
		const neutralXyzRelative = this.d65XyzRelative.map((value) => value * relativeY);
		const neutralLinearRec709 = multiply(XYZ_TO_LINEAR_REC709, neutralXyzRelative)
			.map((value) => value / 100);
		let gamutScale = 1;
		for (let index = 0; index < 3; index += 1) {
			const origin = neutralLinearRec709[index];
			const delta = signedLinearRec709[index] - origin;
			if (delta > 0) gamutScale = Math.min(gamutScale, (1 - origin) / delta);
			else if (delta < 0) gamutScale = Math.min(gamutScale, -origin / delta);
		}
		gamutScale = Math.max(0, Math.min(1, gamutScale));
		const linearRec709 = neutralLinearRec709.map((value, index) =>
			value + gamutScale * (signedLinearRec709[index] - value));
		const encodedSrgb = linearRec709.map((value) => encodeSrgb(Math.max(0, Math.min(1, value))));
		const mappedXyzRelative = multiply(this.linearRec709ToXyz, linearRec709)
			.map((value) => value * 100);
		const mappedRawLms = multiply(this.xyzFToLms, mappedXyzRelative);
		const mappedResponseEquivalent = mappedRawLms.map((value, index) =>
			value * this.channelScale[index] / 100);
		const neutralResponse = relativeY;
		return {
			response: [...response],
			normalizedDisplayLms,
			rawDisplayLms,
			xyzRelative,
			relativeY,
			signedLinearRec709,
			neutralLinearRec709,
			gamutScale,
			gamutLimited: gamutScale < 1,
			linearRec709,
			encodedSrgb,
			mappedXyzRelative,
			mappedResponseEquivalent,
			inputOpponent: opponentHue(response, neutralResponse),
			outputOpponent: opponentHue(mappedResponseEquivalent, neutralResponse),
		};
	}

	transformSpectrum(spectrum, adaptingLuminance) {
		requireCondition(Array.isArray(spectrum) && spectrum.length === 15
			&& spectrum.every((value) => Number.isFinite(value) && value >= 0),
		'Receptor transform requires one finite nonnegative native-15 spectrum.');
		const normalizedLms = multiply(this.projectionMatrix, spectrum);
		const response = this.respond(normalizedLms, adaptingLuminance);
		return {
			spectrum: [...spectrum],
			adaptingLuminanceCdPerSquareMeter: adaptingLuminance,
			normalizedLms,
			sigma: this.sigma(adaptingLuminance),
			...this.mapResponse(response),
		};
	}

	describe() {
		return {
			id: 'cie2006-receptor-linear-display-d65-neutral-boundary-v1',
			response: `Naka-Rushton n=${this.exponent}; CAM16-F_L half-saturation placement`,
			displayScale: 'zero response to black; equal unit response to D65 100-nit white',
			gamut: 'analytic same-luminance D65-neutral line intersection with Rec.709',
			encoding: 'IEC 61966-2-1 sRGB piecewise',
			toneCurve: null,
			exposure: null,
			sourceSpecificRules: false,
		};
	}
}
