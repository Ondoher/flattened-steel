import {pathToFileURL} from 'node:url';

export const EXPERIMENT = 'E2';
export const NAME = 'Display-Referenced Convergence Criterion';
export const VISIBILITY_BOUNDARY = 1;
export const ACCEPTABLE_ACCURACY_BOUNDARY = 3;

const QUESTION = [
	'What display-referred colour-difference values distinguish potential',
	'visibility from practical acceptable accuracy for continuous SDR sRGB',
	'output, and what endpoint contract lets a numerical-control experiment',
	'apply them directly?',
].join(' ');

const ROOT_RESIDUAL_LIMIT = 1e-10;
const PRINTED_EXAMPLE_TOLERANCE = 5e-4;
const TRANSFORM_DISAGREEMENT_LIMIT = 1e-8;
const GRID_INTERVALS = 32;
const MAX_BISECTION_ITERATIONS = 80;

const W3C_LINEAR_SRGB_TO_XYZ = [
	[506752 / 1228815, 87881 / 245763, 12673 / 70218],
	[87098 / 409605, 175762 / 245763, 12673 / 175545],
	[7918 / 409605, 87881 / 737289, 1001167 / 1053270],
];

const BT2124_XYZ_TO_BT2100_RGB = [
	[1.716651187971268, -0.355670783776392, -0.25336628137366],
	[-0.666684351832489, 1.616481236634939, 0.015768545813911],
	[0.017639857445311, -0.042770613257809, 0.942103121235474],
];

const ICC_ABSOLUTE_BLACK_XYZ = [0.1901, 0.2, 0.2178];
const ICC_ABSOLUTE_WHITE_XYZ = [76.04, 80, 87.12];
const ICC_ABSOLUTE_SCALE = 79.8;

const PQ = {
	m1: 2610 / 16384,
	m2: (2523 / 4096) * 128,
	c1: 3424 / 4096,
	c2: (2413 / 4096) * 32,
	c3: (2392 / 4096) * 32,
};

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));

const multiplyMatrixVector = (matrix, vector) =>
	matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));

function invert3x3(matrix) {
	const [a, b, c] = matrix[0];
	const [d, e, f] = matrix[1];
	const [g, h, i] = matrix[2];
	const A = e * i - f * h;
	const B = c * h - b * i;
	const C = b * f - c * e;
	const D = f * g - d * i;
	const E = a * i - c * g;
	const F = c * d - a * f;
	const G = d * h - e * g;
	const H = b * g - a * h;
	const I = a * e - b * d;
	const determinant = a * A + b * D + c * G;

	if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-15) {
		throw new Error('Matrix is not invertible.');
	}

	return [
		[A / determinant, B / determinant, C / determinant],
		[D / determinant, E / determinant, F / determinant],
		[G / determinant, H / determinant, I / determinant],
	];
}

function deriveLinearSrgbToXyz() {
	const primaries = [
		{x: 0.64, y: 0.33},
		{x: 0.3, y: 0.6},
		{x: 0.15, y: 0.06},
	];
	const primaryMatrix = [
		primaries.map(({x, y}) => x / y),
		primaries.map(() => 1),
		primaries.map(({x, y}) => (1 - x - y) / y),
	];
	const white = [0.3127 / 0.329, 1, (1 - 0.3127 - 0.329) / 0.329];
	const scales = multiplyMatrixVector(invert3x3(primaryMatrix), white);

	return primaryMatrix.map((row) => row.map((value, column) => value * scales[column]));
}

const COLORIMETRY_DERIVED_LINEAR_SRGB_TO_XYZ = deriveLinearSrgbToXyz();

function assertTriplet(name, values, {inUnitRange = false} = {}) {
	if (!Array.isArray(values) || values.length !== 3) {
		throw new Error(`${name} must contain exactly three values.`);
	}
	if (values.some((value) => !Number.isFinite(value))) {
		throw new Error(`${name} must contain only finite values.`);
	}
	if (inUnitRange && values.some((value) => value < 0 || value > 1)) {
		throw new Error(`${name} must remain within [0, 1].`);
	}
}

function normalizedXyzToAbsolute(normalizedXyz) {
	return normalizedXyz.map((value, index) => ICC_ABSOLUTE_BLACK_XYZ[index] + ICC_ABSOLUTE_SCALE * value);
}

function pqOetf(luminance) {
	if (!Number.isFinite(luminance) || luminance < 0) {
		throw new Error('PQ input must be a finite non-negative luminance.');
	}
	const powered = luminance === 0 ? 0 : Math.pow(luminance / 10000, PQ.m1);
	return Math.pow((PQ.c1 + PQ.c2 * powered) / (1 + PQ.c3 * powered), PQ.m2);
}

function pqEotf(encoded) {
	if (!Number.isFinite(encoded) || encoded < 0 || encoded > 1) {
		throw new Error('PQ encoded input must remain within [0, 1].');
	}
	const powered = Math.pow(encoded, 1 / PQ.m2);
	const numerator = Math.max(powered - PQ.c1, 0);
	return 10000 * Math.pow(numerator / (PQ.c2 - PQ.c3 * powered), 1 / PQ.m1);
}

function bt2100RgbToItp([red, green, blue]) {
	const linearLms = [
		(1688 * red + 2146 * green + 262 * blue) / 4096,
		(683 * red + 2951 * green + 462 * blue) / 4096,
		(99 * red + 309 * green + 3688 * blue) / 4096,
	];
	const [l, m, s] = linearLms.map(pqOetf);

	return [
		0.5 * l + 0.5 * m,
		(0.5 * (6610 * l - 13613 * m + 7003 * s)) / 4096,
		(17933 * l - 17390 * m - 543 * s) / 4096,
	];
}

function pqOetfIndependent(luminance) {
	if (!Number.isFinite(luminance) || luminance < 0) {
		throw new Error('PQ input must be a finite non-negative luminance.');
	}
	const powered = luminance === 0 ? 0 : Math.exp(PQ.m1 * Math.log(luminance / 10000));
	const ratio = (PQ.c1 + PQ.c2 * powered) / (1 + PQ.c3 * powered);
	return Math.exp(PQ.m2 * Math.log(ratio));
}

function bt2100RgbToItpIndependent(rgb) {
	const lmsMatrix = [
		[1688 / 4096, 2146 / 4096, 262 / 4096],
		[683 / 4096, 2951 / 4096, 462 / 4096],
		[99 / 4096, 309 / 4096, 3688 / 4096],
	];
	const [l, m, s] = multiplyMatrixVector(lmsMatrix, rgb).map(pqOetfIndependent);
	return multiplyMatrixVector(
		[
			[0.5, 0.5, 0],
			[(0.5 * 6610) / 4096, (-0.5 * 13613) / 4096, (0.5 * 7003) / 4096],
			[17933 / 4096, -17390 / 4096, -543 / 4096],
		],
		[l, m, s],
	);
}

export function absoluteXyzToItp(absoluteXyz) {
	assertTriplet('absoluteXyz', absoluteXyz);
	return bt2100RgbToItp(multiplyMatrixVector(BT2124_XYZ_TO_BT2100_RGB, absoluteXyz));
}

export function linearSrgbToAbsoluteXyz(linearSrgb) {
	assertTriplet('linearSrgb', linearSrgb, {inUnitRange: true});
	return normalizedXyzToAbsolute(multiplyMatrixVector(W3C_LINEAR_SRGB_TO_XYZ, linearSrgb));
}

export function linearSrgbToItp(linearSrgb) {
	return absoluteXyzToItp(linearSrgbToAbsoluteXyz(linearSrgb));
}

export function linearSrgbToItpIndependent(linearSrgb) {
	assertTriplet('linearSrgb', linearSrgb, {inUnitRange: true});
	const normalizedXyz = multiplyMatrixVector(COLORIMETRY_DERIVED_LINEAR_SRGB_TO_XYZ, linearSrgb);
	const absoluteXyz = normalizedXyz.map(
		(value, index) =>
			ICC_ABSOLUTE_BLACK_XYZ[index] + value * (ICC_ABSOLUTE_WHITE_XYZ[1] - ICC_ABSOLUTE_BLACK_XYZ[1]),
	);

	const [x, y, z] = absoluteXyz;
	return bt2100RgbToItpIndependent([
		BT2124_XYZ_TO_BT2100_RGB[0][0] * x + BT2124_XYZ_TO_BT2100_RGB[0][1] * y + BT2124_XYZ_TO_BT2100_RGB[0][2] * z,
		BT2124_XYZ_TO_BT2100_RGB[1][0] * x + BT2124_XYZ_TO_BT2100_RGB[1][1] * y + BT2124_XYZ_TO_BT2100_RGB[1][2] * z,
		BT2124_XYZ_TO_BT2100_RGB[2][0] * x + BT2124_XYZ_TO_BT2100_RGB[2][1] * y + BT2124_XYZ_TO_BT2100_RGB[2][2] * z,
	]);
}

export function deltaEItp(left, right) {
	assertTriplet('left ITP', left);
	assertTriplet('right ITP', right);
	return 720 * Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
}

function encodeSrgbComponent(linear) {
	return linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
}

function decodeSrgbComponent(encoded) {
	return encoded <= 0.04045 ? encoded / 12.92 : Math.pow((encoded + 0.055) / 1.055, 2.4);
}

export const encodeSrgb = (linearSrgb) => {
	assertTriplet('linearSrgb', linearSrgb, {inUnitRange: true});
	return linearSrgb.map(encodeSrgbComponent);
};

export const quantizeSrgb8 = (linearSrgb) => encodeSrgb(linearSrgb).map((value) => Math.round(255 * clamp(value)));

function normalizeDirection(direction) {
	assertTriplet('direction', direction);
	const magnitude = Math.hypot(...direction);
	if (magnitude === 0) {
		throw new Error('direction must be non-zero.');
	}
	return direction.map((value) => value / magnitude);
}

function maximumInGamutDistance(reference, direction) {
	let maximum = Infinity;
	for (let channel = 0; channel < 3; channel += 1) {
		if (direction[channel] > 0) {
			maximum = Math.min(maximum, (1 - reference[channel]) / direction[channel]);
		} else if (direction[channel] < 0) {
			maximum = Math.min(maximum, -reference[channel] / direction[channel]);
		}
	}
	return maximum;
}

const addScaled = (origin, direction, distance) =>
	origin.map((value, index) => clamp(value + direction[index] * distance));

export function findVisibilityBoundary(reference, rawDirection) {
	assertTriplet('reference', reference, {inUnitRange: true});
	const direction = normalizeDirection(rawDirection);
	const maximumDistance = maximumInGamutDistance(reference, direction);

	if (!Number.isFinite(maximumDistance) || maximumDistance <= 0) {
		return null;
	}

	const referenceItp = linearSrgbToItp(reference);
	const gamutEndpoint = addScaled(reference, direction, maximumDistance);
	const endpointDelta = deltaEItp(referenceItp, linearSrgbToItp(gamutEndpoint));
	if (endpointDelta < VISIBILITY_BOUNDARY) {
		return null;
	}

	let lower = 0;
	let upper = maximumDistance;
	let candidate = gamutEndpoint;
	let candidateDelta = endpointDelta;
	let iterations = 0;

	while (iterations < MAX_BISECTION_ITERATIONS) {
		const distance = 0.5 * (lower + upper);
		candidate = addScaled(reference, direction, distance);
		candidateDelta = deltaEItp(referenceItp, linearSrgbToItp(candidate));
		iterations += 1;

		if (Math.abs(candidateDelta - VISIBILITY_BOUNDARY) <= ROOT_RESIDUAL_LIMIT) {
			break;
		}
		if (candidateDelta < VISIBILITY_BOUNDARY) {
			lower = distance;
		} else {
			upper = distance;
		}
	}

	const alternateDelta = deltaEItp(linearSrgbToItpIndependent(reference), linearSrgbToItpIndependent(candidate));
	const encodedReference = encodeSrgb(reference);
	const encodedCandidate = encodeSrgb(candidate);
	const quantizedReference = quantizeSrgb8(reference);
	const quantizedCandidate = quantizeSrgb8(candidate);

	return {
		reference: [...reference],
		direction,
		candidate,
		referenceXyz: linearSrgbToAbsoluteXyz(reference),
		candidateXyz: linearSrgbToAbsoluteXyz(candidate),
		referenceItp,
		candidateItp: linearSrgbToItp(candidate),
		deltaEItp: candidateDelta,
		alternateDeltaEItp: alternateDelta,
		transformDistanceDisagreement: Math.abs(candidateDelta - alternateDelta),
		maximumLinearChannelDelta: Math.max(...candidate.map((value, channel) => Math.abs(value - reference[channel]))),
		maximumEncodedChannelDelta: Math.max(
			...encodedCandidate.map((value, channel) => Math.abs(value - encodedReference[channel])),
		),
		maximumQuantizedCodeDelta: Math.max(
			...quantizedCandidate.map((value, channel) => Math.abs(value - quantizedReference[channel])),
		),
		rootResidual: Math.abs(candidateDelta - VISIBILITY_BOUNDARY),
		bisectionIterations: iterations,
	};
}

export function reproduceAnnex4() {
	const printedExpectedItp = [0.3554, 0.1346, -0.1613];
	const printedMeasuredItp = [0.3568, 0.1321, -0.1629];
	const printedDelta = deltaEItp(printedExpectedItp, printedMeasuredItp);
	const expectedLinearRgb = [296, 201, 582].map((code) => pqEotf(code / 1023));
	const fullExpectedItp = bt2100RgbToItp(expectedLinearRgb);
	const fullMeasuredItp = absoluteXyzToItp([36, 15, 190]);

	return {
		publishedDeltaEItp: 2.363,
		printedInputDeltaEItp: printedDelta,
		printedResidual: Math.abs(printedDelta - 2.363),
		expectedLinearRgb,
		fullExpectedItp,
		fullMeasuredItp,
		fullInputDeltaEItp: deltaEItp(fullExpectedItp, fullMeasuredItp),
	};
}

export function scanAdjacentNeutralCodes() {
	let minimum = {deltaEItp: Infinity, lowerCode: null, upperCode: null};
	let maximum = {deltaEItp: -Infinity, lowerCode: null, upperCode: null};

	for (let lowerCode = 0; lowerCode < 255; lowerCode += 1) {
		const lower = decodeSrgbComponent(lowerCode / 255);
		const upper = decodeSrgbComponent((lowerCode + 1) / 255);
		const difference = deltaEItp(linearSrgbToItp([lower, lower, lower]), linearSrgbToItp([upper, upper, upper]));
		const record = {
			deltaEItp: difference,
			lowerCode,
			upperCode: lowerCode + 1,
		};
		if (difference < minimum.deltaEItp) minimum = record;
		if (difference > maximum.deltaEItp) maximum = record;
	}

	return {minimum, maximum};
}

function surveyTransformDisagreement() {
	let maximum = {
		deltaEItp: -Infinity,
		linearSrgb: null,
		primaryItp: null,
		independentItp: null,
	};
	let evaluatedPoints = 0;

	for (let redIndex = 0; redIndex <= GRID_INTERVALS; redIndex += 1) {
		for (let greenIndex = 0; greenIndex <= GRID_INTERVALS; greenIndex += 1) {
			for (let blueIndex = 0; blueIndex <= GRID_INTERVALS; blueIndex += 1) {
				const linearSrgb = [redIndex / GRID_INTERVALS, greenIndex / GRID_INTERVALS, blueIndex / GRID_INTERVALS];
				const primaryItp = linearSrgbToItp(linearSrgb);
				const independentItp = linearSrgbToItpIndependent(linearSrgb);
				const difference = deltaEItp(primaryItp, independentItp);
				evaluatedPoints += 1;
				if (difference > maximum.deltaEItp) {
					maximum = {
						deltaEItp: difference,
						linearSrgb,
						primaryItp,
						independentItp,
					};
				}
			}
		}
	}

	return {
		gridIntervals: GRID_INTERVALS,
		evaluatedPoints,
		maximum,
		displayTransformUncertainty: 2 * maximum.deltaEItp,
	};
}

const referenceColours = [
	{name: 'black', value: [0, 0, 0]},
	{name: 'near-black neutral', value: [0.0001, 0.0001, 0.0001]},
	{name: 'dark neutral', value: [0.01, 0.01, 0.01]},
	{name: 'mid neutral', value: [0.18, 0.18, 0.18]},
	{name: 'white', value: [1, 1, 1]},
	{name: 'red primary', value: [1, 0, 0]},
	{name: 'green primary', value: [0, 1, 0]},
	{name: 'blue primary', value: [0, 0, 1]},
	{name: 'cyan secondary', value: [0, 1, 1]},
	{name: 'magenta secondary', value: [1, 0, 1]},
	{name: 'yellow secondary', value: [1, 1, 0]},
	{name: 'near-clamp chromatic', value: [0.99, 0.5, 0.01]},
];

const perturbationDirections = [
	{name: '+R', value: [1, 0, 0]},
	{name: '-R', value: [-1, 0, 0]},
	{name: '+G', value: [0, 1, 0]},
	{name: '-G', value: [0, -1, 0]},
	{name: '+B', value: [0, 0, 1]},
	{name: '-B', value: [0, 0, -1]},
	{name: '+R+G', value: [1, 1, 0]},
	{name: '-R-G', value: [-1, -1, 0]},
	{name: '+R-G', value: [1, -1, 0]},
	{name: '-R+G', value: [-1, 1, 0]},
	{name: '+R+B', value: [1, 0, 1]},
	{name: '-R-B', value: [-1, 0, -1]},
	{name: '+R-B', value: [1, 0, -1]},
	{name: '-R+B', value: [-1, 0, 1]},
	{name: '+G+B', value: [0, 1, 1]},
	{name: '-G-B', value: [0, -1, -1]},
	{name: '+G-B', value: [0, 1, -1]},
	{name: '-G+B', value: [0, -1, 1]},
	{name: '+RGB', value: [1, 1, 1]},
	{name: '-RGB', value: [-1, -1, -1]},
];

export function runExperiment() {
	const annex4 = reproduceAnnex4();
	const transformSurvey = surveyTransformDisagreement();
	const quantization = scanAdjacentNeutralCodes();
	const boundaryResults = [];
	let skippedGamutLimitedCases = 0;

	for (const reference of referenceColours) {
		for (const direction of perturbationDirections) {
			const result = findVisibilityBoundary(reference.value, direction.value);
			if (!result) {
				skippedGamutLimitedCases += 1;
				continue;
			}
			boundaryResults.push({
				referenceName: reference.name,
				directionName: direction.name,
				...result,
			});
		}
	}

	const maximumRootResidual = Math.max(...boundaryResults.map((result) => result.rootResidual));
	const maximumBoundaryTransformDisagreement = Math.max(
		...boundaryResults.map((result) => result.transformDistanceDisagreement),
	);
	const accepted =
		annex4.printedResidual <= PRINTED_EXAMPLE_TOLERANCE &&
		transformSurvey.maximum.deltaEItp <= TRANSFORM_DISAGREEMENT_LIMIT &&
		maximumRootResidual <= ROOT_RESIDUAL_LIMIT &&
		annex4.printedInputDeltaEItp < ACCEPTABLE_ACCURACY_BOUNDARY &&
		boundaryResults.length > 0;

	return {
		question: QUESTION,
		sources: {
			bt2124: 'ITU-R BT.2124-0, Annexes 1, 2, and 4',
			srgb: 'ICC interpretation of IEC 61966-2-1 sRGB',
			srgbMatrix: 'W3C CSS Color 4 exact-rational linear-sRGB to XYZ matrix',
		},
		display: {
			colourSpace: 'continuous clamped linear-display sRGB',
			whitePoint: 'D65',
			whiteLuminanceCdM2: 80,
			viewerObservedBlackLuminanceCdM2: 0.2,
			imageBackgroundCdM2: 16,
			surroundCdM2: 4.1,
			ambientIlluminanceLux: 64,
		},
		acceptance: {
			visibilityBoundaryDeltaEItp: VISIBILITY_BOUNDARY,
			acceptableAccuracyBoundaryDeltaEItp: ACCEPTABLE_ACCURACY_BOUNDARY,
			visibilityRule: 'observed Delta E ITP + all declared uncertainty < 1',
			referenceDisplayAccuracyRule: 'observed Delta E ITP + all declared uncertainty < 3',
			authorityScope: [
				'BT.2124 Annex 4 states that below 3 Delta E ITP may be acceptable',
				'for reference-display accuracy and that the appropriate tolerance',
				'can vary significantly by application',
			].join(' '),
			printedExampleTolerance: PRINTED_EXAMPLE_TOLERANCE,
			rootResidualLimit: ROOT_RESIDUAL_LIMIT,
			transformDisagreementLimit: TRANSFORM_DISAGREEMENT_LIMIT,
		},
		annex4,
		transformSurvey,
		quantization,
		attemptedBoundaryCases: referenceColours.length * perturbationDirections.length,
		skippedGamutLimitedCases,
		boundaryResults,
		maximumRootResidual,
		maximumBoundaryTransformDisagreement,
		accepted,
	};
}

const formatNumber = (value) => Number(value).toPrecision(9);
const formatTriplet = (values) => `[${values.map(formatNumber).join(', ')}]`;

export function renderReport(result = runExperiment()) {
	const lines = [];
	const pushJson = (heading, value) =>
		lines.push('', `## ${heading}`, '', '```json', JSON.stringify(value, null, 2), '```');
	lines.push(`# ${EXPERIMENT} - ${NAME}`);
	lines.push('', '## Question', '', result.question);
	pushJson('Inputs', {
		sources: result.sources,
		display: result.display,
		acceptance: result.acceptance,
		referenceColours,
		perturbationDirections,
		attemptedBoundaryCases: result.attemptedBoundaryCases,
		skippedGamutLimitedCases: result.skippedGamutLimitedCases,
	});
	pushJson('Published example reproduction', result.annex4);
	pushJson('Transform-disagreement survey', result.transformSurvey);
	pushJson('Eight-bit adjacent-neutral-code diagnostic', result.quantization);
	lines.push('', '## Results', '', `Iterations: ${result.boundaryResults.length}`, '');
	lines.push(
		'| iteration | reference | direction | reference linear sRGB | boundary linear sRGB | reference XYZ | boundary XYZ | reference ITP | boundary ITP | Delta E ITP | max linear delta | max encoded delta | max 8-bit code delta | root residual | transform disagreement | bisections |',
	);
	lines.push(
		'| ---: | --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
	);

	result.boundaryResults.forEach((row, index) => {
		lines.push(
			[
				`| ${index + 1}`,
				row.referenceName,
				row.directionName,
				formatTriplet(row.reference),
				formatTriplet(row.candidate),
				formatTriplet(row.referenceXyz),
				formatTriplet(row.candidateXyz),
				formatTriplet(row.referenceItp),
				formatTriplet(row.candidateItp),
				formatNumber(row.deltaEItp),
				formatNumber(row.maximumLinearChannelDelta),
				formatNumber(row.maximumEncodedChannelDelta),
				row.maximumQuantizedCodeDelta,
				formatNumber(row.rootResidual),
				formatNumber(row.transformDistanceDisagreement),
				`${row.bisectionIterations} |`,
			].join(' | '),
		);
	});

	const conclusion = result.accepted
		? [
				'Accepted. ITU-R BT.2124-0 supplies both the potential-visibility',
				'boundary of 1 Delta E ITP and an Annex 4 statement that a tolerance',
				'below 3 may be acceptable for reference-display accuracy, subject to',
				'application needs. The independently realized ICC',
				'sRGB-to-ITP transforms agree within the declared experiment limit, and',
				'every reported in-gamut boundary search reaches that value within the',
				'declared residual. Values below 1 and 3 are available as explicitly',
				'scoped display-difference diagnostics. They do not by themselves',
				'define acceptable atmospheric-model error; current E3 reports them',
				'without using either as an automatic count-selection gate.',
			].join(' ')
		: [
				'Rejected. The published-example reproduction, transform disagreement,',
				'or boundary residual exceeded its declared experiment limit.',
			].join(' ');

	lines.push('', '## Conclusion', '', conclusion);
	pushJson('Value supplied to E3', {
		visibilityBoundaryDeltaEItp: VISIBILITY_BOUNDARY,
		acceptableAccuracyBoundaryDeltaEItp: ACCEPTABLE_ACCURACY_BOUNDARY,
		displayTransformUncertainty: result.transformSurvey.displayTransformUncertainty,
		referenceDisplayAccuracyRule: ['observed Delta E ITP + U(reference) +', 'U(display transform) < 3'].join(' '),
		diagnosticRule: [
			'observed Delta E ITP + U(reference) +',
			'U(display transform) < 1 marks potential indistinguishability',
		].join(' '),
		scope: [
			'static per-location continuous display-referred SDR sRGB colour;',
			'not a standalone atmospheric-model correctness criterion',
		].join(' '),
	});

	return `${lines.join('\n')}\n`;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
	const result = runExperiment();
	process.stdout.write(renderReport(result));
	if (!result.accepted) process.exitCode = 1;
}
