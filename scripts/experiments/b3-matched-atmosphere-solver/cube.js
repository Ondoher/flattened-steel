import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {
	DIRECTION_CONTRACT,
	FIXED_CONDITIONS,
	FULL_WAVELENGTHS_NM,
	PUBLISHED,
	SCORED_WAVELENGTHS_NM,
	enumerateCoarseGrid,
} from './contract.js';

export const CUBE_SCHEMA = 'b3-directional-spectral-radiance-cube-v1';
export const RADIANCE_UNITS = 'W m^-2 sr^-1 nm^-1';
export const PUBLISHED_RMSE_TOLERANCE_MILLIWATT = 0.02;
const AXIS_TOLERANCE = 1e-8;

const close = (left, right, tolerance = AXIS_TOLERANCE) => Math.abs(left - right) <= tolerance;

function assertFiniteNumber(value, label) {
	if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
}

function validateAxes(cube) {
	if (cube.schema !== CUBE_SCHEMA) {
		throw new TypeError(`Cube schema must be ${CUBE_SCHEMA}.`);
	}
	if (cube.units !== RADIANCE_UNITS) {
		throw new TypeError(`Cube units must be ${RADIANCE_UNITS}.`);
	}
	if (
		!Array.isArray(cube.wavelengthsNm) ||
		cube.wavelengthsNm.length !== SCORED_WAVELENGTHS_NM.length ||
		cube.wavelengthsNm.some((value, index) => !close(value, SCORED_WAVELENGTHS_NM[index]))
	) {
		throw new TypeError('Cube wavelength axis does not match the 31-sample Bruneton scoring grid.');
	}
	if (!Array.isArray(cube.conditions) || cube.conditions.length !== FIXED_CONDITIONS.length) {
		throw new TypeError('Cube must contain all 17 pinned conditions.');
	}
	cube.conditions.forEach((condition, index) => {
		const expected = FIXED_CONDITIONS[index];
		if (
			condition.id !== expected.id ||
			!close(condition.sunZenithDeg, expected.sunZenithDeg) ||
			!close(condition.sunAzimuthDeg, expected.sunAzimuthDeg)
		) {
			throw new TypeError(`Cube condition ${index} does not match ${expected.id}.`);
		}
	});
	if (!Array.isArray(cube.directions) || cube.directions.length !== DIRECTION_CONTRACT.directions.length) {
		throw new TypeError('Cube must contain all 81 pinned directions.');
	}
	cube.directions.forEach((direction, index) => {
		const expected = DIRECTION_CONTRACT.directions[index];
		if (
			direction.index !== expected.index ||
			direction.i !== expected.i ||
			direction.j !== expected.j ||
			!close(direction.viewZenithDeg, expected.viewZenithDeg) ||
			!close(direction.viewAzimuthDeg, expected.viewAzimuthDeg)
		) {
			throw new TypeError(`Cube direction ${index} does not match the Shirley-Chiu grid.`);
		}
	});
}

export function validateCube(cube) {
	if (!cube || typeof cube !== 'object') throw new TypeError('Cube must be an object.');
	validateAxes(cube);
	if (!Array.isArray(cube.values) || cube.values.length !== FIXED_CONDITIONS.length) {
		throw new TypeError('Cube values must have 17 condition planes.');
	}
	cube.values.forEach((conditionValues, conditionIndex) => {
		if (!Array.isArray(conditionValues) || conditionValues.length !== DIRECTION_CONTRACT.directions.length) {
			throw new TypeError(`Cube condition ${conditionIndex} must have 81 directions.`);
		}
		conditionValues.forEach((directionValues, directionIndex) => {
			if (!Array.isArray(directionValues) || directionValues.length !== SCORED_WAVELENGTHS_NM.length) {
				throw new TypeError(
					`Cube condition ${conditionIndex}, direction ${directionIndex} must have 31 wavelengths.`,
				);
			}
			directionValues.forEach((value, wavelengthIndex) =>
				assertFiniteNumber(value, `Cube value ${conditionIndex}/${directionIndex}/${wavelengthIndex}`),
			);
		});
	});
	return cube;
}

export function makeCube(values, provenance = {}) {
	const cube = {
		schema: CUBE_SCHEMA,
		units: RADIANCE_UNITS,
		dimensions: Object.freeze({
			conditions: FIXED_CONDITIONS.length,
			directions: DIRECTION_CONTRACT.directions.length,
			wavelengths: SCORED_WAVELENGTHS_NM.length,
		}),
		wavelengthsNm: [...SCORED_WAVELENGTHS_NM],
		conditions: FIXED_CONDITIONS.map((condition) => ({
			id: condition.id,
			sunZenithDeg: condition.sunZenithDeg,
			sunAzimuthDeg: condition.sunAzimuthDeg,
		})),
		directions: DIRECTION_CONTRACT.directions.map((direction) => ({
			index: direction.index,
			i: direction.i,
			j: direction.j,
			viewZenithDeg: direction.viewZenithDeg,
			viewAzimuthDeg: direction.viewAzimuthDeg,
		})),
		provenance,
		values,
	};
	return validateCube(cube);
}

export function readCube(filename) {
	return validateCube(JSON.parse(readFileSync(filename, 'utf8')));
}

export function parseMeasurementBoundary(
	text,
	provenance = {
		source: 'B1 independently processed official Kider boundary TSV',
	},
) {
	if (text.trimStart().startsWith('{')) return validateCube(JSON.parse(text));
	const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#'));
	if (lines.length === 0) throw new TypeError('Measurement boundary is empty.');
	const header = lines.shift().split('\t');
	if (header.length !== 43 || header[0] !== 'time' || header[1] !== 'grid_x' || header[2] !== 'grid_y') {
		throw new TypeError('Measurement TSV requires time, grid_x, grid_y, and 40 wavelength columns.');
	}
	const values = FIXED_CONDITIONS.map(() => Array.from({length: 81}, () => null));
	for (const line of lines) {
		const fields = line.split('\t');
		if (fields.length !== 43) throw new TypeError('Malformed measurement TSV row.');
		const conditionIndex = FIXED_CONDITIONS.findIndex((condition) => condition.localTime.slice(0, 5) === fields[0]);
		const i = Number(fields[1]);
		const j = Number(fields[2]);
		if (conditionIndex < 0 || !Number.isInteger(i) || !Number.isInteger(j) || i < 0 || i > 8 || j < 0 || j > 8) {
			throw new TypeError(`Invalid measurement boundary coordinates: ${fields.slice(0, 3).join('/')}.`);
		}
		const directionIndex = i * 9 + j;
		if (values[conditionIndex][directionIndex]) {
			throw new TypeError(`Duplicate measurement boundary row ${fields[0]}/${i}/${j}.`);
		}
		const spectrum = fields.slice(3).map(Number);
		if (spectrum.some((value) => !Number.isFinite(value))) {
			throw new TypeError(`Non-finite measurement boundary spectrum ${fields[0]}/${i}/${j}.`);
		}
		values[conditionIndex][directionIndex] = spectrum.slice(0, SCORED_WAVELENGTHS_NM.length);
	}
	if (values.some((condition) => condition.some((spectrum) => !spectrum))) {
		throw new TypeError('Measurement boundary does not contain all 17x81 rows.');
	}
	return makeCube(values, provenance);
}

export function readMeasurementBoundary(filename) {
	return parseMeasurementBoundary(readFileSync(filename, 'utf8'), {
		source: 'B1 independently processed official Kider boundary TSV',
		path: resolve(filename),
	});
}

export function parseUvspecOutput(text, conditionId = 'unknown') {
	const tokens = text.trim().split(/\s+/).filter(Boolean);
	const gridColumnCount =
		DIRECTION_CONTRACT.uvspecViewZenithsDeg.length * DIRECTION_CONTRACT.uvspecViewAzimuthsDeg.length;
	const rowWidth = 1 + gridColumnCount;
	const expectedTokenCount = FULL_WAVELENGTHS_NM.length * rowWidth;
	if (tokens.length !== expectedTokenCount) {
		throw new TypeError(
			`${conditionId} uvspec output has ${tokens.length} numeric fields; expected ${expectedTokenCount}.`,
		);
	}
	const rows = [];
	for (let wavelengthIndex = 0; wavelengthIndex < FULL_WAVELENGTHS_NM.length; wavelengthIndex += 1) {
		const offset = wavelengthIndex * rowWidth;
		const wavelength = Number(tokens[offset]);
		assertFiniteNumber(wavelength, `${conditionId} wavelength ${wavelengthIndex}`);
		if (!close(wavelength, FULL_WAVELENGTHS_NM[wavelengthIndex], 1e-5)) {
			throw new TypeError(
				`${conditionId} wavelength ${wavelength} does not match ${FULL_WAVELENGTHS_NM[wavelengthIndex]}.`,
			);
		}
		const radiances = tokens.slice(offset + 1, offset + rowWidth).map(Number);
		radiances.forEach((value, column) =>
			assertFiniteNumber(value, `${conditionId} radiance ${wavelengthIndex}/${column}`),
		);
		rows.push(radiances);
	}

	return DIRECTION_CONTRACT.directions.map((direction) => {
		const column =
			direction.gridZenithIndex * DIRECTION_CONTRACT.uvspecViewAzimuthsDeg.length + direction.gridAzimuthIndex;
		return SCORED_WAVELENGTHS_NM.map((_, wavelengthIndex) => rows[wavelengthIndex][column]);
	});
}

export function cubeFromExternalOutputs(directory) {
	const values = FIXED_CONDITIONS.map((condition) => {
		const filename = resolve(join(directory, `${condition.id}.out`));
		return parseUvspecOutput(readFileSync(filename, 'utf8'), condition.id);
	});
	return makeCube(values, {
		source: 'external libRadtran uvspec outputs',
		directory: resolve(directory),
	});
}

export function scoreCubes(referenceCube, candidateCube) {
	validateCube(referenceCube);
	validateCube(candidateCube);
	const conditions = [];
	let aggregateSquareSum = 0;
	let aggregateCount = 0;
	let maximumAbsoluteResidual = 0;
	for (let conditionIndex = 0; conditionIndex < FIXED_CONDITIONS.length; conditionIndex += 1) {
		let squareSum = 0;
		let count = 0;
		let conditionMaximum = 0;
		for (let directionIndex = 0; directionIndex < DIRECTION_CONTRACT.directions.length; directionIndex += 1) {
			for (let wavelengthIndex = 0; wavelengthIndex < SCORED_WAVELENGTHS_NM.length; wavelengthIndex += 1) {
				const residual =
					candidateCube.values[conditionIndex][directionIndex][wavelengthIndex] -
					referenceCube.values[conditionIndex][directionIndex][wavelengthIndex];
				squareSum += residual * residual;
				count += 1;
				conditionMaximum = Math.max(conditionMaximum, Math.abs(residual));
			}
		}
		const rmseWatt = Math.sqrt(squareSum / count);
		conditions.push(
			Object.freeze({
				conditionId: FIXED_CONDITIONS[conditionIndex].id,
				sampleCount: count,
				rmseWatt,
				rmseMilliwatt: rmseWatt * 1000,
				maximumAbsoluteResidualWatt: conditionMaximum,
			}),
		);
		aggregateSquareSum += squareSum;
		aggregateCount += count;
		maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, conditionMaximum);
	}
	const rmseWatt = Math.sqrt(aggregateSquareSum / aggregateCount);
	const rmseMilliwatt = rmseWatt * 1000;
	return Object.freeze({
		formula: 'sqrt(sum((candidate-reference)^2)/(17*81*31))',
		sampleCount: aggregateCount,
		rmseWatt,
		rmseMilliwatt,
		paperRoundedRmseMilliwatt: Math.round(rmseMilliwatt * 10) / 10,
		maximumAbsoluteResidualWatt: maximumAbsoluteResidual,
		conditions: Object.freeze(conditions),
	});
}

export function evaluatePublishedFixedTarget(measurementCube, libRadtranCube) {
	const score = scoreCubes(measurementCube, libRadtranCube);
	const residualFromPublishedMilliwatt = score.rmseMilliwatt - PUBLISHED.coarse.rmseMilliwatt;
	return Object.freeze({
		...score,
		publishedRmseMilliwatt: PUBLISHED.coarse.rmseMilliwatt,
		toleranceMilliwatt: PUBLISHED_RMSE_TOLERANCE_MILLIWATT,
		residualFromPublishedMilliwatt,
		accepted: Math.abs(residualFromPublishedMilliwatt) <= PUBLISHED_RMSE_TOLERANCE_MILLIWATT,
	});
}

function gridKey({alpha, beta, g}) {
	return `${Number(alpha).toFixed(1)}|${Number(beta).toFixed(2)}|${Number(g).toFixed(1)}`;
}

export function evaluateCoarseResults(payload) {
	const rows = Array.isArray(payload) ? payload : payload?.cases;
	if (!Array.isArray(rows)) {
		throw new TypeError('Coarse-search results require a cases array.');
	}
	const expected = enumerateCoarseGrid();
	const expectedKeys = new Set(expected.map(gridKey));
	const observed = new Map();
	for (const row of rows) {
		assertFiniteNumber(row?.alpha, 'coarse alpha');
		assertFiniteNumber(row?.beta, 'coarse beta');
		assertFiniteNumber(row?.g, 'coarse g');
		assertFiniteNumber(row?.rmseMilliwatt, 'coarse RMSE');
		const key = gridKey(row);
		if (!expectedKeys.has(key)) throw new TypeError(`Unexpected coarse-grid case ${key}.`);
		if (observed.has(key)) throw new TypeError(`Duplicate coarse-grid case ${key}.`);
		observed.set(
			key,
			Object.freeze({
				alpha: Number(row.alpha),
				beta: Number(row.beta),
				g: Number(row.g),
				rmseMilliwatt: Number(row.rmseMilliwatt),
			}),
		);
	}
	const complete = observed.size === expected.length;
	const sorted = [...observed.values()].sort((left, right) => left.rmseMilliwatt - right.rmseMilliwatt);
	const minimum = sorted[0] ?? null;
	const target = observed.get(gridKey(PUBLISHED.coarse)) ?? null;
	const targetIsMinimum = Boolean(minimum && target && close(target.rmseMilliwatt, minimum.rmseMilliwatt, 1e-12));
	const publishedRmseAccepted = Boolean(
		target && Math.abs(target.rmseMilliwatt - PUBLISHED.coarse.rmseMilliwatt) <= PUBLISHED_RMSE_TOLERANCE_MILLIWATT,
	);
	return Object.freeze({
		expectedCaseCount: expected.length,
		observedCaseCount: observed.size,
		complete,
		minimum,
		target,
		cases: Object.freeze(expected.map((item) => observed.get(gridKey(item))).filter(Boolean)),
		targetIsMinimum,
		publishedRmseAccepted,
		accepted: complete && targetIsMinimum && publishedRmseAccepted,
	});
}

export function readCoarseResults(filename) {
	return evaluateCoarseResults(JSON.parse(readFileSync(filename, 'utf8')));
}

export function readMismatchMap(filename) {
	const payload = JSON.parse(readFileSync(filename, 'utf8'));
	if (!payload || !Array.isArray(payload.mismatches)) {
		throw new TypeError('A mismatch map requires a mismatches array (empty is allowed).');
	}
	payload.mismatches.forEach((mismatch, index) => {
		if (!mismatch || typeof mismatch.field !== 'string' || typeof mismatch.disposition !== 'string') {
			throw new TypeError(`Mismatch ${index} requires field and disposition strings.`);
		}
	});
	if (payload.matches != null && !Array.isArray(payload.matches)) {
		throw new TypeError('A mismatch map matches property must be an array when supplied.');
	}
	(payload.matches ?? []).forEach((match, index) => {
		if (!match || typeof match.field !== 'string' || typeof match.disposition !== 'string') {
			throw new TypeError(`Match ${index} requires field and disposition strings.`);
		}
	});
	return payload;
}

export function readJudgmentRules(filename) {
	const payload = JSON.parse(readFileSync(filename, 'utf8'));
	if (
		payload?.declaredBeforeProposedResults !== true ||
		!Array.isArray(payload.rules) ||
		payload.rules.length === 0
	) {
		throw new TypeError('Judgment rules must be nonempty and declare declaredBeforeProposedResults=true.');
	}
	return payload;
}

export function makeConstantCube(value, provenance = {source: 'test fixture'}) {
	assertFiniteNumber(value, 'constant cube value');
	return makeCube(
		FIXED_CONDITIONS.map(() => DIRECTION_CONTRACT.directions.map(() => SCORED_WAVELENGTHS_NM.map(() => value))),
		provenance,
	);
}
