import { CAM16_DIM_SURROUND, forwardCam16 } from './Cam16Reference.js';
import { Stage2bNormalDisplayTransform } from './Stage2bNormalDisplayTransform.js';

const XYZ_TO_REC709 = [
	[3.2409699419045226, -1.537383177570094, -0.4986107602930034],
	[-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
	[0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];

function requireCondition(value, message) { if (!value) throw new Error(message); }
function multiply(matrix, vector) { return matrix.map((row) => row.reduce((sum, coefficient, index) => sum + coefficient * vector[index], 0)); }
function encode(value) { return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055; }
function hueDifference(left, right) { const difference = Math.abs(left - right) % 360; return Math.min(difference, 360 - difference); }
function chromaticity(xyz) { const sum = xyz.reduce((total, value) => total + value, 0); return sum > 0 ? [xyz[0] / sum, xyz[1] / sum] : [0, 0]; }

function outputCamRequest(xyz, output) {
	return {
		xyz,
		whiteXyz: output.whiteChromaticityXyzRelative,
		adaptingLuminanceCdPerSquareMeter: output.adaptingLuminanceCdPerSquareMeter,
		backgroundRelativeY: output.backgroundRelativeY,
		surround: CAM16_DIM_SURROUND,
		discountIlluminant: output.discountIlluminant,
	};
}

export class Stage2bPreserveColorfulnessTransform extends Stage2bNormalDisplayTransform {
	evaluateColorfulnessScale(desiredQ, desiredM, h, scale) {
		const output = this.inverse(desiredQ, desiredM * scale, h);
		return { scale, Q: desiredQ, M: desiredM * scale, h, xyz: output.xyz, linearRgb: this.linearRgb(output.xyz) };
	}

	transformAppearance({ Q, M, h }) {
		requireCondition([Q, M, h].every(Number.isFinite) && Q >= 0 && M >= 0, 'The M-preserving transform requires finite nonnegative Q and M.');
		const t = this.masteringCoordinate(Q);
		const desiredQ = t * this.q0;
		const desiredM = M;
		let mapped = this.evaluateColorfulnessScale(desiredQ, desiredM, h, 1);
		let boundaryLimited = false;
		if (!this.inGamut(mapped.linearRgb)) {
			boundaryLimited = true;
			let lower = 0;
			let upper = 1;
			for (let iteration = 0; iteration < this.iterations; iteration += 1) {
				const middle = (lower + upper) / 2;
				const candidate = this.evaluateColorfulnessScale(desiredQ, desiredM, h, middle);
				if (this.inGamut(candidate.linearRgb, 0)) lower = middle;
				else upper = middle;
			}
			mapped = this.evaluateColorfulnessScale(desiredQ, desiredM, h, lower);
		}
		const boundedLinearRgb = mapped.linearRgb.map((value) => Math.max(0, Math.min(1, value)));
		const encodedSrgb = boundedLinearRgb.map(encode);
		const roundTrip = forwardCam16(outputCamRequest(mapped.xyz, this.output));
		return {
			input: { Q, M, h },
			masteringCoordinate: t,
			desired: { Q: desiredQ, M: desiredM, h },
			boundaryLimited,
			boundaryScale: mapped.scale,
			output: { Q: mapped.Q, M: mapped.M, h, xyz: mapped.xyz, linearRgb: boundedLinearRgb, encodedSrgb },
			roundTrip: { Q: roundTrip.Q, M: roundTrip.M, h: roundTrip.h, hueErrorDegrees: M > 1e-12 ? hueDifference(roundTrip.h, h) : 0 },
		};
	}

	describe() {
		return {
			...super.describe(),
			id: 'stage2b-normal-q-log-preserve-m-fixed-q-boundary-v1',
			colorfulness: 'preserve source-condition CIECAM16 M while mapping Q; reduce M only at fixed Q and hue when required by the display boundary',
			gamut: 'bounded bisection of output M toward the neutral at fixed mastered Q and hue',
		};
	}
}

export function chromaticityPreservingControl({ absoluteXyz, targetQ, outputViewingCondition, bisectionIterations = 56 }) {
	requireCondition(Array.isArray(absoluteXyz) && absoluteXyz.length === 3 && absoluteXyz.every(Number.isFinite) && absoluteXyz[1] > 0, 'The chromaticity control requires positive finite absolute XYZ.');
	requireCondition(Number.isFinite(targetQ) && targetQ > 0, 'The chromaticity control requires a positive target Q.');
	const direction = absoluteXyz.map((value) => value / absoluteXyz[1]);
	const appearanceAtY = (Y) => forwardCam16(outputCamRequest(direction.map((value) => value * Y), outputViewingCondition));
	let upperY = outputViewingCondition.referenceWhiteLuminanceCdPerSquareMeter;
	while (appearanceAtY(upperY).Q < targetQ && upperY < 1e6) upperY *= 2;
	requireCondition(appearanceAtY(upperY).Q >= targetQ, 'The chromaticity control could not bracket target Q.');
	let lowerY = 0;
	for (let iteration = 0; iteration < bisectionIterations; iteration += 1) {
		const middleY = (lowerY + upperY) / 2;
		if (appearanceAtY(middleY).Q < targetQ) lowerY = middleY;
		else upperY = middleY;
	}
	const targetY = (lowerY + upperY) / 2;
	const targetXyz = direction.map((value) => value * targetY);
	const neutralXyz = outputViewingCondition.whiteChromaticityXyzRelative.map((value) => value * targetY / 100);
	const linearRgbForXyz = (xyz) => multiply(XYZ_TO_REC709, xyz).map((value) => value / outputViewingCondition.referenceWhiteLuminanceCdPerSquareMeter);
	const inGamut = (rgb) => rgb.every((value) => Number.isFinite(value) && value >= 0 && value <= 1);
	let gamutScale = 1;
	let mappedXyz = targetXyz;
	let linearRgb = linearRgbForXyz(mappedXyz);
	if (!inGamut(linearRgb)) {
		let lower = 0;
		let upper = 1;
		for (let iteration = 0; iteration < bisectionIterations; iteration += 1) {
			const middle = (lower + upper) / 2;
			const candidateXyz = neutralXyz.map((value, index) => value + middle * (targetXyz[index] - value));
			if (inGamut(linearRgbForXyz(candidateXyz))) lower = middle;
			else upper = middle;
		}
		gamutScale = lower;
		mappedXyz = neutralXyz.map((value, index) => value + gamutScale * (targetXyz[index] - value));
		linearRgb = linearRgbForXyz(mappedXyz);
	}
	const boundedLinearRgb = linearRgb.map((value) => Math.max(0, Math.min(1, value)));
	const outputAppearance = forwardCam16(outputCamRequest(mappedXyz, outputViewingCondition));
	return {
		targetQ,
		targetY,
		targetXyz,
		targetChromaticityXy: chromaticity(targetXyz),
		gamutLimited: gamutScale < 1,
		gamutScale,
		output: {
			Q: outputAppearance.Q,
			M: outputAppearance.M,
			h: outputAppearance.h,
			xyz: mappedXyz,
			chromaticityXy: chromaticity(mappedXyz),
			linearRgb: boundedLinearRgb,
			encodedSrgb: boundedLinearRgb.map(encode),
		},
	};
}
