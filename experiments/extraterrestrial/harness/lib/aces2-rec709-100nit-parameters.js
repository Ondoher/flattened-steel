/*
 * Contained, fixed-profile parameter construction for the ACES 2 output
 * transform used by the Sun appearance GPU visual-candidate lane.
 *
 * Authority map:
 * - ACES release v2.0.0+2025.04.04:
 *   Lib.Academy.OutputTransform.ctl, Lib.Academy.Tonescale.ctl, and
 *   Output.Academy.Rec709-D65_100nit_in_Rec709-D65_sRGB-Piecewise.ctl.
 * - OpenColorIO 2.4.2 commit 6918fad3f5d22ac3ef2397c754bf4268c2b58dd0:
 *   src/OpenColorIO/ops/fixedfunction/ACES2/Transform.cpp and
 *   src/OpenColorIO/ops/fixedfunction/FixedFunctionOpGPU.cpp.
 *
 * The 362-row reach and cusp structures are internal analytic acceleration
 * tables from the official algorithm. They are rebuilt from the authored
 * equations on every browser execution. They are not an output transform LUT,
 * and no generated run artifact is read here.
 */

export const ACES2_TABLE_SIZE = 362;
export const ACES2_NOMINAL_TABLE_SIZE = 360;
export const ACES2_FIXED_SCENE_SCALE = 0.00029282576866764276;

const REFERENCE_LUMINANCE = 100;
const PEAK_LUMINANCE = 100;
const L_A = 100;
const Y_B = 20;
const SURROUND = [0.9, 0.59, 0.9];
const J_SCALE = 100;
const CAM_NL_OFFSET = 0.2713 * 100;
const CAM_NL_SCALE = 4 * 100;
const HUE_LIMIT = 360;
const BASE_INDEX = 1;
const FIRST_NOMINAL_INDEX = 1;
const LAST_NOMINAL_INDEX = 360;
const LOWER_WRAP_INDEX = 0;
const UPPER_WRAP_INDEX = 361;
const CUSP_CORNER_COUNT = 6;
const TOTAL_CORNER_COUNT = 8;
const REACH_CUSP_TOLERANCE = 1e-3;
const DISPLAY_CUSP_TOLERANCE = 1e-7;
const SMOOTH_CUSPS = 0.12;
const SMOOTH_M = 0.27;
const CUSP_MID_BLEND = 1.3;
const FOCUS_GAIN_BLEND = 0.3;
const FOCUS_DISTANCE = 1.35;
const FOCUS_DISTANCE_SCALING = 1.75;
const GAMMA_MINIMUM = 0;
const GAMMA_MAXIMUM = 5;
const GAMMA_SEARCH_STEP = 0.4;
const GAMMA_ACCURACY = 1e-5;

const AP0 = {
	red: [0.7347, 0.2653],
	green: [0, 1],
	blue: [0.0001, -0.077],
	white: [0.32168, 0.33767],
};
const AP1 = {
	red: [0.713, 0.293],
	green: [0.165, 0.83],
	blue: [0.128, 0.044],
	white: [0.32168, 0.33767],
};
const REC709_D65 = {
	red: [0.64, 0.33],
	green: [0.3, 0.6],
	blue: [0.15, 0.06],
	white: [0.3127, 0.329],
};
const CAM16 = {
	red: [0.8336, 0.1735],
	green: [2.3854, -1.4659],
	blue: [0.087, -0.125],
	white: [0.333, 0.333],
};
const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const BRADFORD_XYZ_TO_CONE = [0.8951, 0.2664, -0.1614, -0.7502, 1.7135, 0.0367, 0.0389, -0.0685, 1.0296].map(f32);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function f32(value) {
	return Math.fround(value);
}

function add(left, right) {
	return f32(f32(left) + f32(right));
}

function subtract(left, right) {
	return f32(f32(left) - f32(right));
}

function multiply(left, right) {
	return f32(f32(left) * f32(right));
}

function divide(left, right) {
	return f32(f32(left) / f32(right));
}

function power(base, exponent) {
	return f32(Math.pow(f32(base), f32(exponent)));
}

function squareRoot(value) {
	return f32(Math.sqrt(f32(value)));
}

function sumProducts3(a0, b0, a1, b1, a2, b2) {
	return add(add(multiply(a0, b0), multiply(a1, b1)), multiply(a2, b2));
}

function multiplyMatrixVector(matrix, vector) {
	return [
		sumProducts3(matrix[0], vector[0], matrix[1], vector[1], matrix[2], vector[2]),
		sumProducts3(matrix[3], vector[0], matrix[4], vector[1], matrix[5], vector[2]),
		sumProducts3(matrix[6], vector[0], matrix[7], vector[1], matrix[8], vector[2]),
	];
}

function multiplyMatrices(left, right) {
	const result = new Array(9);
	for (let row = 0; row < 3; row += 1) {
		for (let column = 0; column < 3; column += 1) {
			result[row * 3 + column] = sumProducts3(
				left[row * 3],
				right[column],
				left[row * 3 + 1],
				right[3 + column],
				left[row * 3 + 2],
				right[6 + column],
			);
		}
	}
	return result;
}

function invertMatrix(matrix) {
	const a = matrix[0];
	const b = matrix[1];
	const c = matrix[2];
	const d = matrix[3];
	const e = matrix[4];
	const f = matrix[5];
	const g = matrix[6];
	const h = matrix[7];
	const i = matrix[8];
	const cofactor00 = subtract(multiply(e, i), multiply(f, h));
	const cofactor01 = subtract(multiply(c, h), multiply(b, i));
	const cofactor02 = subtract(multiply(b, f), multiply(c, e));
	const cofactor10 = subtract(multiply(f, g), multiply(d, i));
	const cofactor11 = subtract(multiply(a, i), multiply(c, g));
	const cofactor12 = subtract(multiply(c, d), multiply(a, f));
	const cofactor20 = subtract(multiply(d, h), multiply(e, g));
	const cofactor21 = subtract(multiply(b, g), multiply(a, h));
	const cofactor22 = subtract(multiply(a, e), multiply(b, d));
	const determinant = add(add(multiply(a, cofactor00), multiply(b, cofactor10)), multiply(c, cofactor20));
	requireCondition(Number.isFinite(determinant) && determinant !== 0, 'ACES 2 matrix is singular.');
	return [
		divide(cofactor00, determinant),
		divide(cofactor01, determinant),
		divide(cofactor02, determinant),
		divide(cofactor10, determinant),
		divide(cofactor11, determinant),
		divide(cofactor12, determinant),
		divide(cofactor20, determinant),
		divide(cofactor21, determinant),
		divide(cofactor22, determinant),
	];
}

function diagonalMatrix(values) {
	return [values[0], 0, 0, 0, values[1], 0, 0, 0, values[2]];
}

function rgbToXyzMatrix(primaries) {
	const coordinates = [primaries.red, primaries.green, primaries.blue];
	const unscaled = [
		divide(coordinates[0][0], coordinates[0][1]),
		divide(coordinates[1][0], coordinates[1][1]),
		divide(coordinates[2][0], coordinates[2][1]),
		1,
		1,
		1,
		divide(subtract(subtract(1, coordinates[0][0]), coordinates[0][1]), coordinates[0][1]),
		divide(subtract(subtract(1, coordinates[1][0]), coordinates[1][1]), coordinates[1][1]),
		divide(subtract(subtract(1, coordinates[2][0]), coordinates[2][1]), coordinates[2][1]),
	];
	const white = [
		divide(primaries.white[0], primaries.white[1]),
		1,
		divide(subtract(subtract(1, primaries.white[0]), primaries.white[1]), primaries.white[1]),
	];
	const scales = multiplyMatrixVector(invertMatrix(unscaled), white);
	return multiplyMatrices(unscaled, diagonalMatrix(scales));
}

function rgbToRgbMatrix(source, destination) {
	return multiplyMatrices(invertMatrix(rgbToXyzMatrix(destination)), rgbToXyzMatrix(source));
}

function whiteXyz(white) {
	return [divide(white[0], white[1]), 1, divide(subtract(subtract(1, white[0]), white[1]), white[1])];
}

function bradfordChromaticAdaptation(sourceWhite, destinationWhite) {
	const sourceCone = multiplyMatrixVector(BRADFORD_XYZ_TO_CONE, whiteXyz(sourceWhite));
	const destinationCone = multiplyMatrixVector(BRADFORD_XYZ_TO_CONE, whiteXyz(destinationWhite));
	const vonKries = diagonalMatrix(destinationCone.map((value, index) => divide(value, sourceCone[index])));
	return multiplyMatrices(invertMatrix(BRADFORD_XYZ_TO_CONE), multiplyMatrices(vonKries, BRADFORD_XYZ_TO_CONE));
}

function rgbToRgbMatrixWithBradford(source, destination) {
	return multiplyMatrices(
		invertMatrix(rgbToXyzMatrix(destination)),
		multiplyMatrices(bradfordChromaticAdaptation(source.white, destination.white), rgbToXyzMatrix(source)),
	);
}

function signedValue(magnitude, signSource) {
	if (signSource === 0) return 0;
	return signSource < 0 ? -magnitude : magnitude;
}

function coneCompressionForward(value) {
	const magnitude = Math.abs(value);
	const powered = power(magnitude, 0.42);
	return signedValue(divide(powered, add(CAM_NL_OFFSET, powered)), value);
}

function coneCompressionInverse(value) {
	const magnitude = Math.min(Math.abs(value), 0.99);
	const powered = divide(multiply(CAM_NL_OFFSET, magnitude), subtract(1, magnitude));
	return signedValue(power(powered, divide(1, 0.42)), value);
}

function modelGamma() {
	return multiply(SURROUND[1], add(1.48, squareRoot(divide(Y_B, REFERENCE_LUMINANCE))));
}

function initJmhParameters(primaries) {
	const baseConeToAab = [2, 1, 1 / 20, 1, -12 / 11, 1 / 11, 1 / 9, 1 / 9, -2 / 9].map(f32);
	const matrix16 = invertMatrix(rgbToXyzMatrix(CAM16));
	const rgbToXyz = rgbToXyzMatrix(primaries);
	const xyzWhite = multiplyMatrixVector(rgbToXyz, [REFERENCE_LUMINANCE, REFERENCE_LUMINANCE, REFERENCE_LUMINANCE]);
	const whiteCone = multiplyMatrixVector(matrix16, xyzWhite);
	const k = divide(1, add(multiply(5, L_A), 1));
	const k4 = multiply(multiply(k, k), multiply(k, k));
	const fL = add(
		multiply(multiply(0.2, k4), multiply(5, L_A)),
		multiply(multiply(0.1, power(subtract(1, k4), 2)), power(multiply(5, L_A), divide(1, 3))),
	);
	const fLn = divide(fL, REFERENCE_LUMINANCE);
	const cz = modelGamma();
	const invCz = divide(1, cz);
	const dRgb = whiteCone.map((value) => divide(multiply(fLn, xyzWhite[1]), value));
	const adaptedWhite = whiteCone.map((value, index) => coneCompressionForward(multiply(dRgb[index], value)));
	const coneToAabBase = multiplyMatrices(diagonalMatrix([CAM_NL_SCALE, CAM_NL_SCALE, CAM_NL_SCALE]), baseConeToAab);
	const aw = sumProducts3(
		coneToAabBase[0],
		adaptedWhite[0],
		coneToAabBase[1],
		adaptedWhite[1],
		coneToAabBase[2],
		adaptedWhite[2],
	);
	const awJ = coneCompressionForward(fL);
	const rgbToCam = multiplyMatrices(rgbToRgbMatrix(primaries, CAM16), diagonalMatrix([100, 100, 100]));
	const rgbToCamAdapted = multiplyMatrices(diagonalMatrix(dRgb), rgbToCam);
	const coneToAab = [
		divide(coneToAabBase[0], aw),
		divide(coneToAabBase[1], aw),
		divide(coneToAabBase[2], aw),
		multiply(multiply(coneToAabBase[3], 43), SURROUND[2]),
		multiply(multiply(coneToAabBase[4], 43), SURROUND[2]),
		multiply(multiply(coneToAabBase[5], 43), SURROUND[2]),
		multiply(multiply(coneToAabBase[6], 43), SURROUND[2]),
		multiply(multiply(coneToAabBase[7], 43), SURROUND[2]),
		multiply(multiply(coneToAabBase[8], 43), SURROUND[2]),
	];
	return {
		rgbToCam: rgbToCamAdapted,
		camToRgb: invertMatrix(rgbToCamAdapted),
		coneToAab,
		aabToCone: invertMatrix(coneToAab),
		fLn,
		cz,
		invCz,
		awJ,
		invAwJ: divide(1, awJ),
	};
}

function rgbToAab(rgb, parameters) {
	const cone = multiplyMatrixVector(parameters.rgbToCam, rgb);
	return multiplyMatrixVector(parameters.coneToAab, cone.map(coneCompressionForward));
}

function aabToJmh(aab, parameters) {
	if (aab[0] <= 0) return [0, 0, 0];
	const j = multiply(J_SCALE, power(aab[0], parameters.cz));
	const m = squareRoot(add(multiply(aab[1], aab[1]), multiply(aab[2], aab[2])));
	let hue = f32((Math.atan2(aab[2], aab[1]) * 180) / Math.PI);
	if (hue < 0) hue = add(hue, HUE_LIMIT);
	return [j, m, hue];
}

function rgbToJmh(rgb, parameters) {
	return aabToJmh(rgbToAab(rgb, parameters), parameters);
}

function jmhToRgb(jmh, parameters) {
	const radians = f32((jmh[2] * Math.PI) / 180);
	const aab = [
		power(divide(jmh[0], J_SCALE), parameters.invCz),
		multiply(jmh[1], Math.cos(radians)),
		multiply(jmh[1], Math.sin(radians)),
	];
	const coneCompressed = multiplyMatrixVector(parameters.aabToCone, aab);
	return multiplyMatrixVector(parameters.camToRgb, coneCompressed.map(coneCompressionInverse));
}

function yToJ(y, parameters) {
	const magnitude = Math.abs(y);
	const response = coneCompressionForward(multiply(magnitude, parameters.fLn));
	const j = multiply(J_SCALE, power(multiply(response, parameters.invAwJ), parameters.cz));
	return signedValue(j, y);
}

function jToAchromatic(j, parameters) {
	return power(divide(j, J_SCALE), parameters.invCz);
}

function initToneScaleParameters() {
	const n = PEAK_LUMINANCE;
	const nR = 100;
	const g = 1.15;
	const t1 = 0.04;
	const rHit = 128;
	const m0 = divide(n, nR);
	const m1 = multiply(0.5, add(m0, squareRoot(multiply(m0, add(m0, multiply(4, t1))))));
	const u = power(divide(divide(rHit, m1), add(divide(rHit, m1), 1)), g);
	const m = divide(m1, u);
	const cT = divide(10.013, nR);
	const gIp = multiply(0.5, add(cT, squareRoot(multiply(cT, add(cT, multiply(4, t1))))));
	const gRatio = power(divide(gIp, m), divide(1, g));
	const gIpp2 = divide(-multiply(m1, gRatio), subtract(gRatio, 1));
	const w2 = divide(0.18, gIpp2);
	const s2 = multiply(multiply(w2, m1), REFERENCE_LUMINANCE);
	const u2 = power(divide(divide(rHit, m1), add(divide(rHit, m1), w2)), g);
	return {
		n,
		nR,
		g,
		t1,
		cT,
		s2,
		u2,
		m2: divide(m1, u2),
		forwardLimit: multiply(8, rHit),
		inverseLimit: divide(n, multiply(u2, nR)),
		logPeak: 0,
	};
}

function unitCubeCorner(index) {
	return [Number((index + 1) % 6 < 3), Number((index + 5) % 6 < 3), Number((index + 3) % 6 < 3)];
}

function buildLimitingCorners(parameters) {
	const temporaryRgb = [];
	const temporaryJmh = [];
	let minimumIndex = 0;
	for (let index = 0; index < CUSP_CORNER_COUNT; index += 1) {
		const rgb = unitCubeCorner(index);
		const jmh = rgbToJmh(rgb, parameters);
		temporaryRgb.push(rgb);
		temporaryJmh.push(jmh);
		if (jmh[2] < temporaryJmh[minimumIndex][2]) minimumIndex = index;
	}
	const rgbCorners = new Array(TOTAL_CORNER_COUNT);
	const jmhCorners = new Array(TOTAL_CORNER_COUNT);
	for (let index = 0; index < CUSP_CORNER_COUNT; index += 1) {
		rgbCorners[index + 1] = [...temporaryRgb[(index + minimumIndex) % CUSP_CORNER_COUNT]];
		jmhCorners[index + 1] = [...temporaryJmh[(index + minimumIndex) % CUSP_CORNER_COUNT]];
	}
	rgbCorners[0] = [...rgbCorners[6]];
	rgbCorners[7] = [...rgbCorners[1]];
	jmhCorners[0] = [...jmhCorners[6]];
	jmhCorners[7] = [...jmhCorners[1]];
	jmhCorners[0][2] = subtract(jmhCorners[0][2], HUE_LIMIT);
	jmhCorners[7][2] = add(jmhCorners[7][2], HUE_LIMIT);
	return {rgbCorners, jmhCorners};
}

function buildReachCorners(parameters, limitJ, maximumSource) {
	const temporary = [];
	const limitA = jToAchromatic(limitJ, parameters);
	let minimumIndex = 0;
	for (let index = 0; index < CUSP_CORNER_COUNT; index += 1) {
		const direction = unitCubeCorner(index);
		let lower = 0;
		let upper = maximumSource;
		while (subtract(upper, lower) > REACH_CUSP_TOLERANCE) {
			const sample = multiply(add(lower, upper), 0.5);
			const a = rgbToAab(
				direction.map((component) => multiply(sample, component)),
				parameters,
			)[0];
			if (a < limitA) lower = sample;
			else upper = sample;
		}
		const jmh = rgbToJmh(
			direction.map((component) => multiply(upper, component)),
			parameters,
		);
		temporary.push(jmh);
		if (jmh[2] < temporary[minimumIndex][2]) minimumIndex = index;
	}
	const corners = new Array(TOTAL_CORNER_COUNT);
	for (let index = 0; index < CUSP_CORNER_COUNT; index += 1) {
		corners[index + 1] = [...temporary[(index + minimumIndex) % CUSP_CORNER_COUNT]];
	}
	corners[0] = [...corners[6]];
	corners[7] = [...corners[1]];
	corners[0][2] = subtract(corners[0][2], HUE_LIMIT);
	corners[7][2] = add(corners[7][2], HUE_LIMIT);
	return corners;
}

function extractSortedHues(reachCorners, displayCorners) {
	const hues = [];
	let reachIndex = 1;
	let displayIndex = 1;
	while (reachIndex < 7 || displayIndex < 7) {
		const reachHue = reachCorners[reachIndex][2];
		const displayHue = displayCorners[displayIndex][2];
		if (reachHue === displayHue) {
			hues.push(reachHue);
			reachIndex += 1;
			displayIndex += 1;
		} else if (reachHue < displayHue) {
			hues.push(reachHue);
			reachIndex += 1;
		} else {
			hues.push(displayHue);
			displayIndex += 1;
		}
	}
	return hues;
}

function fillHueInterval(table, sampleCount, lower, upper, base) {
	const delta = divide(subtract(upper, lower), sampleCount);
	for (let index = 0; index < sampleCount; index += 1) table[base + index] = add(lower, multiply(index, delta));
}

function buildHueTable(sortedHues) {
	const table = new Float32Array(ACES2_TABLE_SIZE);
	const counts = [];
	let lastIndex = Number.MAX_SAFE_INTEGER;
	let minimumIndex = sortedHues[0] === 0 ? 0 : 1;
	for (let hueIndex = 0; hueIndex < sortedHues.length; hueIndex += 1) {
		let nominalIndex = Math.min(Math.max(Math.round(sortedHues[hueIndex]), minimumIndex), 359);
		if (lastIndex === nominalIndex) {
			if (hueIndex > 1 && counts[hueIndex - 2] !== counts[hueIndex - 1] - 1) counts[hueIndex - 1] -= 1;
			else nominalIndex += 1;
		}
		counts[hueIndex] = Math.min(nominalIndex, 359);
		lastIndex = nominalIndex;
		minimumIndex = nominalIndex;
	}
	let totalSamples = 0;
	fillHueInterval(table, counts[0], 0, sortedHues[0], 1);
	totalSamples += counts[0];
	for (let index = 1; index < sortedHues.length; index += 1) {
		const samples = counts[index] - counts[index - 1];
		fillHueInterval(table, samples, sortedHues[index - 1], sortedHues[index], totalSamples + 1);
		totalSamples += samples;
	}
	fillHueInterval(table, 360 - totalSamples, sortedHues.at(-1), 360, totalSamples + 1);
	table[LOWER_WRAP_INDEX] = subtract(table[LAST_NOMINAL_INDEX], 360);
	table[UPPER_WRAP_INDEX] = add(table[FIRST_NOMINAL_INDEX], 360);
	return table;
}

function lerpVector(lower, upper, weight) {
	return lower.map((value, index) => add(value, multiply(weight, subtract(upper[index], value))));
}

function findDisplayCusp(hue, rgbCorners, jmhCorners, parameters) {
	let upperCorner = 1;
	for (let index = 1; index < TOTAL_CORNER_COUNT; index += 1) {
		if (jmhCorners[index][2] > hue) {
			upperCorner = index;
			break;
		}
	}
	const lowerCorner = upperCorner - 1;
	if (jmhCorners[lowerCorner][2] === hue) return jmhCorners[lowerCorner].slice(0, 2);
	let lowerWeight = 0;
	let upperWeight = 1;
	while (subtract(upperWeight, lowerWeight) > DISPLAY_CUSP_TOLERANCE) {
		const weight = multiply(add(lowerWeight, upperWeight), 0.5);
		const jmh = rgbToJmh(lerpVector(rgbCorners[lowerCorner], rgbCorners[upperCorner], weight), parameters);
		if (jmh[2] < jmhCorners[lowerCorner][2]) upperWeight = weight;
		else if (jmh[2] >= jmhCorners[upperCorner][2]) lowerWeight = weight;
		else if (jmh[2] > hue) upperWeight = weight;
		else lowerWeight = weight;
	}
	const weight = multiply(add(lowerWeight, upperWeight), 0.5);
	const jmh = rgbToJmh(lerpVector(rgbCorners[lowerCorner], rgbCorners[upperCorner], weight), parameters);
	return jmh.slice(0, 2);
}

function buildCuspTable(hueTable, limiting, parameters) {
	const table = Array.from({length: ACES2_TABLE_SIZE}, () => [0, 0, 0]);
	for (let index = FIRST_NOMINAL_INDEX; index < UPPER_WRAP_INDEX; index += 1) {
		const jm = findDisplayCusp(hueTable[index], limiting.rgbCorners, limiting.jmhCorners, parameters);
		table[index] = [jm[0], multiply(jm[1], add(1, multiply(SMOOTH_M, SMOOTH_CUSPS))), hueTable[index]];
	}
	table[0] = [table[360][0], table[360][1], hueTable[0]];
	table[361] = [table[1][0], table[1][1], hueTable[361]];
	return table;
}

function buildReachTable(parameters, limitJ) {
	const table = new Float32Array(ACES2_TABLE_SIZE);
	for (let hue = 0; hue < 360; hue += 1) {
		let lower = 0;
		let upper = 50;
		let outside = false;
		while (!outside && upper < 1300) {
			outside = jmhToRgb([limitJ, upper, hue], parameters).some((value) => value < 0);
			if (!outside) {
				lower = upper;
				upper = add(upper, 50);
			}
		}
		while (subtract(upper, lower) > 1e-2) {
			const sample = multiply(add(upper, lower), 0.5);
			outside = jmhToRgb([limitJ, sample, hue], parameters).some((value) => value < 0);
			if (outside) upper = sample;
			else lower = sample;
		}
		table[hue + 1] = upper;
	}
	table[0] = table[360];
	table[361] = table[1];
	return table;
}

function focusJ(cuspJ, midJ, limitJ) {
	const weight = Math.min(1, subtract(CUSP_MID_BLEND, divide(cuspJ, limitJ)));
	return add(cuspJ, multiply(weight, subtract(midJ, cuspJ)));
}

function focusGain(j, threshold, limitJ, focusDistance) {
	let gain = multiply(limitJ, focusDistance);
	if (j > threshold) {
		let adjustment = f32(Math.log10(divide(subtract(limitJ, threshold), Math.max(0.0001, subtract(limitJ, j)))));
		adjustment = add(multiply(adjustment, adjustment), 1);
		gain = multiply(gain, adjustment);
	}
	return gain;
}

function solveJIntersect(j, m, focus, limitJ, slopeGain) {
	const scaledM = divide(m, slopeGain);
	const a = divide(scaledM, focus);
	if (j < focus) {
		const b = subtract(1, scaledM);
		const c = -j;
		const root = squareRoot(subtract(multiply(b, b), multiply(multiply(4, a), c)));
		return divide(multiply(-2, c), add(b, root));
	}
	const b = -add(add(1, scaledM), multiply(limitJ, a));
	const c = add(multiply(limitJ, scaledM), j);
	const root = squareRoot(subtract(multiply(b, b), multiply(multiply(4, a), c)));
	return divide(multiply(-2, c), subtract(b, root));
}

function gamutSlope(intersection, focus, limitJ, slopeGain) {
	const direction = intersection < focus ? intersection : subtract(limitJ, intersection);
	return divide(multiply(direction, subtract(intersection, focus)), multiply(focus, slopeGain));
}

function estimateBoundary(intersection, slope, inverseGamma, jMax, mMax, reference) {
	const shifted = multiply(reference, power(divide(intersection, reference), inverseGamma));
	return divide(multiply(shifted, mMax), subtract(jMax, multiply(slope, mMax)));
}

function gamutBoundary(cusp, limitJ, topGammaInverse, bottomGammaInverse, sourceIntersection, slope, cuspIntersection) {
	const lower = estimateBoundary(sourceIntersection, slope, bottomGammaInverse, cusp[0], cusp[1], cuspIntersection);
	const upper = estimateBoundary(
		subtract(limitJ, sourceIntersection),
		-slope,
		topGammaInverse,
		subtract(limitJ, cusp[0]),
		cusp[1],
		subtract(limitJ, cuspIntersection),
	);
	const smooth = multiply(SMOOTH_CUSPS, cusp[1]);
	const weight = divide(Math.max(subtract(smooth, Math.abs(subtract(lower, upper))), 0), smooth);
	return subtract(Math.min(lower, upper), multiply(multiply(multiply(weight, weight), weight), divide(smooth, 6)));
}

function gammaFits(cusp, hue, topGammaInverse, state) {
	const threshold = add(cusp[0], multiply(FOCUS_GAIN_BLEND, subtract(state.limitJ, cusp[0])));
	const focus = focusJ(cusp[0], state.midJ, state.limitJ);
	for (const position of [0.01, 0.1, 0.5, 0.8, 0.99]) {
		const j = add(cusp[0], multiply(position, subtract(state.limitJ, cusp[0])));
		const slopeGain = focusGain(j, threshold, state.limitJ, state.focusDistance);
		const sourceIntersection = solveJIntersect(j, cusp[1], focus, state.limitJ, slopeGain);
		const slope = gamutSlope(sourceIntersection, focus, state.limitJ, slopeGain);
		const cuspIntersection = solveJIntersect(cusp[0], cusp[1], focus, state.limitJ, slopeGain);
		const boundaryM = gamutBoundary(
			cusp,
			state.limitJ,
			topGammaInverse,
			state.lowerHullGammaInverse,
			sourceIntersection,
			slope,
			cuspIntersection,
		);
		const rgb = jmhToRgb(
			[add(sourceIntersection, multiply(slope, boundaryM)), boundaryM, hue],
			state.limitParameters,
		);
		if (!rgb.some((value) => value > 1)) return false;
	}
	return true;
}

function installUpperHullGamma(hueTable, cuspTable, state) {
	for (let index = 1; index < 361; index += 1) {
		const cusp = cuspTable[index];
		let lower = GAMMA_MINIMUM;
		let upper = GAMMA_SEARCH_STEP;
		while (!gammaFits(cusp, hueTable[index], divide(1, upper), state) && upper < GAMMA_MAXIMUM) {
			lower = upper;
			upper = add(upper, GAMMA_SEARCH_STEP);
		}
		while (subtract(upper, lower) > GAMMA_ACCURACY) {
			const sample = multiply(add(upper, lower), 0.5);
			if (gammaFits(cusp, hueTable[index], divide(1, sample), state)) upper = sample;
			else lower = sample;
		}
		cusp[2] = divide(1, upper);
	}
	cuspTable[0][2] = cuspTable[360][2];
	cuspTable[361][2] = cuspTable[1][2];
}

function wrapHue(hue) {
	const wrapped = hue % 360;
	return wrapped < 0 ? add(wrapped, 360) : wrapped;
}

function huePositionInUniformTable(hue, tableSize) {
	return Math.trunc(multiply(divide(wrapHue(hue), 360), tableSize));
}

function hueSearchRange(hueTable) {
	const range = [0, 1];
	for (let index = 1; index < 361; index += 1) {
		const position = huePositionInUniformTable(hueTable[index], ACES2_TABLE_SIZE);
		const delta = index - position;
		range[0] = Math.min(range[0], delta);
		range[1] = Math.max(range[1], delta + 1);
	}
	return range;
}

function flattenCuspTable(cuspTable, hueTable) {
	const values = new Float32Array(ACES2_TABLE_SIZE * 4);
	for (let index = 0; index < ACES2_TABLE_SIZE; index += 1) {
		values[index * 4] = cuspTable[index][0];
		values[index * 4 + 1] = cuspTable[index][1];
		values[index * 4 + 2] = cuspTable[index][2];
		values[index * 4 + 3] = hueTable[index];
	}
	return values;
}

function finiteArray(values, label) {
	requireCondition(values.every(Number.isFinite), `${label} contains a non-finite value.`);
}

export function buildAces2Rec709100NitParameters() {
	const inputParameters = initJmhParameters(AP0);
	const reachParameters = initJmhParameters(AP1);
	const limitParameters = initJmhParameters(REC709_D65);
	const tone = initToneScaleParameters();
	const limitJ = yToJ(PEAK_LUMINANCE, inputParameters);
	const modelGammaInverse = divide(1, modelGamma());
	const reachTable = buildReachTable(reachParameters, limitJ);
	const limiting = buildLimitingCorners(limitParameters);
	const reachCorners = buildReachCorners(reachParameters, limitJ, tone.forwardLimit);
	const hueTable = buildHueTable(extractSortedHues(reachCorners, limiting.jmhCorners));
	const cuspTable = buildCuspTable(hueTable, limiting, limitParameters);
	const midJ = yToJ(multiply(tone.cT, REFERENCE_LUMINANCE), inputParameters);
	const focusDistance = add(FOCUS_DISTANCE, multiply(multiply(FOCUS_DISTANCE, FOCUS_DISTANCE_SCALING), tone.logPeak));
	const lowerHullGammaInverse = divide(1, add(1.14, multiply(0.07, tone.logPeak)));
	const searchRange = hueSearchRange(hueTable);
	installUpperHullGamma(hueTable, cuspTable, {
		limitJ,
		midJ,
		focusDistance,
		lowerHullGammaInverse,
		limitParameters,
	});
	const cuspTexture = flattenCuspTable(cuspTable, hueTable);
	const matrices = {
		rec709ToAp0: rgbToRgbMatrixWithBradford(REC709_D65, AP0),
		ap0ToAp1: rgbToRgbMatrix(AP0, AP1),
		ap1ToAp0: rgbToRgbMatrix(AP1, AP0),
	};
	for (const [label, values] of Object.entries({
		...matrices,
		reachTable: [...reachTable],
		cuspTexture: [...cuspTexture],
	})) {
		finiteArray(values, label);
	}
	return {
		profile: {
			acesRelease: 'v2.0.0+2025.04.04',
			acesCommit: '35e1e6ac2c26ec75433547d5d0a3a881f39bd9f5',
			ocioRelease: '2.4.2',
			peakLuminance: PEAK_LUMINANCE,
			limitingPrimaries: 'Rec.709/D65',
			encoding: 'sRGB-piecewise',
			fixedSceneScale: ACES2_FIXED_SCENE_SCALE,
		},
		matrices,
		inputParameters,
		limitParameters,
		tone,
		compression: {
			limitJ,
			modelGammaInverse,
			saturation: 1.3,
			saturationThreshold: divide(0.5, PEAK_LUMINANCE),
			compression: 2.4,
			chromaCompressionScale: subtract(power(multiply(0.03379, PEAK_LUMINANCE), 0.30596), 0.45135),
			midJ,
			focusDistance,
			lowerHullGammaInverse,
			hueSearchRange: searchRange,
		},
		reachTable,
		cuspTexture,
	};
}
