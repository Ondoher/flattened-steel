function requireCondition(value, message) { if (!value) throw new Error(message); }

export function multiply(matrix, vector) {
	return matrix.map((row) => row.reduce((sum, coefficient, index) => sum + coefficient * vector[index], 0));
}

export function invert3(matrix) {
	const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
	const A = e * i - f * h; const B = -(d * i - f * g); const C = d * h - e * g;
	const D = -(b * i - c * h); const E = a * i - c * g; const F = -(a * h - b * g);
	const G = b * f - c * e; const H = -(a * f - c * d); const I = a * e - b * d;
	const determinant = a * A + b * B + c * C;
	requireCondition(Number.isFinite(determinant) && Math.abs(determinant) > 1e-15, 'Matrix must be invertible.');
	return [[A, D, G], [B, E, H], [C, F, I]].map((row) => row.map((value) => value / determinant));
}

export function parseCieLms(text) {
	const rows = text.trim().split(/\r?\n/u).map((line) => {
		const fields = line.split(','); const wavelength = Number(fields[0]);
		return [wavelength, ...fields.slice(1).map((field, index) => field === 'NaN' && index === 2 && wavelength > 615 ? 0 : Number(field))];
	});
	requireCondition(rows.length === 89 && rows.every((row, index) => row.length === 4 && row.every(Number.isFinite) && row[0] === 390 + 5 * index), 'CIE LMS rows must be the pinned 390-830 nm grid.');
	return rows;
}

export function parseCieXyz(text) {
	const rows = text.trim().split(/\r?\n/u).map((line) => line.split(',').map(Number));
	requireCondition(rows.length === 471 && rows.every((row, index) => row.length === 4 && row.every(Number.isFinite) && row[0] === 360 + index), 'CIE XYZ rows must be the pinned 360-830 nm grid.');
	return rows;
}

export function samplePiecewiseLinear(rows, wavelength) {
	if (wavelength < rows[0][0] || wavelength > rows.at(-1)[0]) return [0, 0, 0];
	let upper = 1; while (upper < rows.length && rows[upper][0] < wavelength) upper += 1;
	if (upper === rows.length) return rows.at(-1).slice(1);
	const high = rows[upper]; if (high[0] === wavelength) return high.slice(1);
	const low = rows[upper - 1]; const t = (wavelength - low[0]) / (high[0] - low[0]);
	return low.slice(1).map((value, index) => value + t * (high[index + 1] - value));
}

function integrateIntervals(rows, lower, upper, breaks, method) {
	const result = [0, 0, 0]; const points = [lower, ...breaks.filter((value) => value > lower && value < upper), upper].sort((a, b) => a - b);
	for (let index = 1; index < points.length; index += 1) {
		const a = points[index - 1]; const b = points[index]; const width = b - a;
		const value = method === 'midpoint' ? samplePiecewiseLinear(rows, (a + b) / 2) : samplePiecewiseLinear(rows, a).map((left, axis) => (left + samplePiecewiseLinear(rows, b)[axis]) / 2);
		for (let axis = 0; axis < 3; axis += 1) result[axis] += value[axis] * width;
	}
	return result;
}

export function createProjectionMatrix(rows, spectralBasis, {referenceStepNanometers = null, luminousEfficacy = 683} = {}) {
	requireCondition(spectralBasis?.semantics === 'contiguous-wavelength-bin-average' && spectralBasis.channels?.length === 15, 'Projection requires the frozen contiguous native-15 basis.');
	const matrix = [[], [], []];
	for (const channel of spectralBasis.channels) {
		const channelLower = channel.center.value - channel.width.value / 2; const channelUpper = channel.center.value + channel.width.value / 2;
		const lower = Math.max(channelLower, rows[0][0]); const upper = Math.min(channelUpper, rows.at(-1)[0]);
		if (upper <= lower) { for (let axis = 0; axis < 3; axis += 1) matrix[axis].push(0); continue; }
		const breaks = referenceStepNanometers === null
			? rows.map((row) => row[0])
			: Array.from({length: Math.floor((upper - lower) / referenceStepNanometers) + 2}, (_, index) => Math.ceil(lower / referenceStepNanometers) * referenceStepNanometers + index * referenceStepNanometers);
		const integral = integrateIntervals(rows, lower, upper, breaks, referenceStepNanometers === null ? 'trapezoid' : 'midpoint');
		for (let axis = 0; axis < 3; axis += 1) matrix[axis].push(integral[axis] * luminousEfficacy);
	}
	return matrix;
}

export function normalizeLmsMatrix(rawMatrix, lmsToXyzF, d65XyzRelative) {
	const d65Lms = multiply(invert3(lmsToXyzF), d65XyzRelative); const channelScale = d65Lms.map((value) => 100 / value);
	return {d65Lms, channelScale, matrix: rawMatrix.map((row, axis) => row.map((value) => value * channelScale[axis]))};
}
