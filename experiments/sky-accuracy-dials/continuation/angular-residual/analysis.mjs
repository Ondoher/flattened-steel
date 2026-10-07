import assert from 'node:assert/strict';

export const edges = [0, 20, 40, 60, 80, 100, 120, 140, 180];
export const bands = [
	{name: 'blue', channels: Array.from({length: 12}, (_, i) => i)},
	{name: 'middle', channels: Array.from({length: 9}, (_, i) => i + 12)},
	{name: 'red', channels: Array.from({length: 10}, (_, i) => i + 21)},
];
export const names = ['control', 'published', 'bruneton', 'libradtran', 'shared'];
/** @param {readonly number[]} xs */
export const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
/** @param {SkyReferenceRow} r */
export const ring = (r) => Math.max(Math.abs(r.x - 4), Math.abs(r.y - 4));
/** @param {number} angle */
export function bin(angle) {
	assert.ok(angle >= 0 && angle <= 180);
	return Math.min(7, Math.floor(angle / 20));
}
/** Fixed angular basis; the intercept is removed within each stratum. @param {number} angle */
export function basis(angle) {
	const c = Math.cos((angle * Math.PI) / 180);
	return [c, c * c, c * c * c];
}
/** @param {SkyReferenceRow} r @param {string} name @param {number} channel @param {string} mode */
export function residual(r, name, channel, mode = 'absolute') {
	const m =
			name === 'shared'
				? (r.models.bruneton[channel] + r.models.libradtran[channel]) / 2
				: r.models[name][channel],
		k = r.measured[channel];
	assert.ok(Number.isFinite(m) && Number.isFinite(k) && m >= 0 && k >= 0 && m + k > 0);
	return mode === 'absolute' ? 1000 * (m - k) : (2 * (m - k)) / (m + k);
}
/** Pivoted solve of three independent normal-equation columns.
 * @param {number[][]} matrix @param {number[]} rhs @returns {number[]}
 */
export function solve(matrix, rhs) {
	const a = matrix.map((row, i) => [...row, rhs[i]]),
		scale = Math.max(...matrix.flat().map(Math.abs));
	assert.ok(scale > 0 && a.flat().every(Number.isFinite));
	for (let c = 0; c < 3; c++) {
		let pivot = c;
		for (let r = c + 1; r < 3; r++) if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r;
		assert.ok(Math.abs(a[pivot][c]) > scale * 1e-12, 'Singular angular design');
		[a[c], a[pivot]] = [a[pivot], a[c]];
		const d = a[c][c];
		for (let k = c; k < 4; k++) a[c][k] /= d;
		for (let r = 0; r < 3; r++)
			if (r !== c) {
				const q = a[r][c];
				for (let k = c; k < 4; k++) a[r][k] -= q * a[c][k];
			}
	}
	return a.map((row) => row[3]);
}
/** @param {readonly SkyAngularPoint[]} points @returns {number[]} */
function fit(points) {
	const xx = Array.from({length: 3}, () => [0, 0, 0]),
		xy = [0, 0, 0];
	for (const p of points)
		for (let i = 0; i < 3; i++) {
			xy[i] += p.x[i] * p.y;
			for (let j = 0; j < 3; j++) xx[i][j] += p.x[i] * p.x[j];
		}
	return solve(xx, xy);
}
/** Center both sides at exact time/elevation, excluding uninformative groups.
 * @param {readonly SkyReferenceRow[]} rows @param {string} name @param {number} channel @param {string} mode
 * @returns {SkyAngularPoint[]}
 */
export function centered(rows, name, channel, mode) {
	/** @type {Map<string,SkyReferenceRow[]>} */ const groups = new Map();
	for (const r of rows) {
		if (r.separation < 20 || ring(r) === 0) continue;
		const key = r.time + '|' + ring(r);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(r);
	}
	const result = [];
	for (const group of groups.values()) {
		if (group.length < 4) continue;
		const xs = group.map((r) => basis(r.separation)),
			ys = group.map((r) => residual(r, name, channel, mode)),
			mx = [0, 1, 2].map((i) => mean(xs.map((x) => x[i]))),
			my = mean(ys);
		for (let i = 0; i < group.length; i++)
			result.push({
				time: group[i].time,
				ring: ring(group[i]),
				angle: group[i].separation,
				x: xs[i].map((v, j) => v - mx[j]),
				y: ys[i] - my,
			});
	}
	return result;
}
/** Leave whole times out; centering uses held-time means, not held-time angular fit.
 * @param {readonly SkyAngularPoint[]} points
 */
export function validate(points) {
	const times = [...new Set(points.map((p) => p.time))];
	assert.ok(times.length >= 3);
	const folds = times.map((time) => {
		const train = points.filter((p) => p.time !== time),
			test = points.filter((p) => p.time === time);
		assert.ok(train.every((p) => p.time !== time));
		const coefficients = fit(train);
		let baseline = 0,
			error = 0;
		for (const p of test) {
			const prediction = p.x.reduce((s, x, i) => s + x * coefficients[i], 0);
			baseline += p.y * p.y;
			error += (p.y - prediction) ** 2;
		}
		return {
			time,
			trainingTimes: times.filter((t) => t !== time),
			count: test.length,
			baseline,
			error,
			skill: baseline > 1e-20 ? 1 - error / baseline : null,
			coefficients,
		};
	});
	const baseline = folds.reduce((s, f) => s + f.baseline, 0),
		error = folds.reduce((s, f) => s + f.error, 0);
	return {
		coefficients: fit(points),
		folds,
		count: points.length,
		baseline,
		error,
		skill: baseline > 1e-20 ? 1 - error / baseline : null,
	};
}
/** All diagnostic tables; no atmospheric evaluation.
 * @param {readonly SkyReferenceRow[]} rows
 */
export function analyze(rows) {
	const times = [...new Set(rows.map((r) => r.time))];
	assert.equal(times.length, 17);
	assert.equal(rows.length, 1377);
	const coverage = edges.slice(0, -1).map((lo, b) => {
		const a = rows.filter((r) => bin(r.separation) === b);
		return {
			bin: b,
			lo,
			hi: edges[b + 1],
			rays: a.length,
			times: [...new Set(a.map((r) => r.time))],
			rings: [...new Set(a.map(ring))],
			meanAngle: a.length ? mean(a.map((r) => r.separation)) : null,
		};
	});
	const raw = [],
		stratified = [],
		angular = [],
		centeredBins = [],
		pairs = [];
	for (const name of names) {
		for (let channel = 0; channel < 31; channel++) {
			for (const cell of coverage) {
				const a = rows.filter((r) => bin(r.separation) === cell.bin),
					values = a.map((r) => residual(r, name, channel));
				if (values.length)
					raw.push({
						name,
						channel,
						bin: cell.bin,
						count: a.length,
						meanAngle: cell.meanAngle,
						bias: mean(values),
						rmse: Math.sqrt(mean(values.map((v) => v * v))),
					});
			}
			for (const mode of ['absolute', 'fractional']) {
				const points = centered(rows, name, channel, mode),
					test = validate(points);
				angular.push({name, channel, mode, ...test});
				if (mode === 'absolute')
					for (const cell of coverage) {
						const p = points.filter((p) => bin(p.angle) === cell.bin);
						if (p.length)
							centeredBins.push({
								name,
								channel,
								bin: cell.bin,
								count: p.length,
								meanAngle: mean(p.map((p) => p.angle)),
								bias: mean(p.map((p) => p.y)),
							});
					}
			}
		}
		for (const band of bands) {
			for (const dimension of ['time', 'ring'])
				for (const value of dimension === 'time' ? times : [0, 1, 2, 3, 4])
					for (const cell of coverage) {
						const a = rows.filter(
							(r) =>
								bin(r.separation) === cell.bin &&
								(dimension === 'time' ? r.time === value : ring(r) === value),
						);
						if (!a.length) continue;
						const values = a.flatMap((r) => band.channels.map((c) => residual(r, name, c)));
						stratified.push({
							name,
							band: band.name,
							dimension,
							value,
							bin: cell.bin,
							rays: a.length,
							bias: mean(values),
							rmse: Math.sqrt(mean(values.map((v) => v * v))),
						});
					}
			for (const time of times)
				for (const radius of [1, 2, 3, 4]) {
					const group = rows.filter((r) => r.time === time && ring(r) === radius && r.separation >= 20);
					const slopes = [];
					for (let i = 0; i < group.length; i++)
						for (let j = i + 1; j < group.length; j++) {
							const a = group[i],
								b = group[j],
								delta = b.separation - a.separation;
							if (Math.abs(delta) < 30) continue;
							slopes.push(
								(mean(band.channels.map((c) => residual(b, name, c))) -
									mean(band.channels.map((c) => residual(a, name, c)))) /
									delta,
							);
						}
					if (slopes.length)
						pairs.push({
							name,
							band: band.name,
							time,
							ring: radius,
							pairs: slopes.length,
							meanSlopeMwPerDegree: mean(slopes),
							positiveFraction: slopes.filter((s) => s > 0).length / slopes.length,
						});
				}
		}
	}
	const summaries = [];
	for (const name of names)
		for (const mode of ['absolute', 'fractional'])
			for (const band of [{name: 'all', channels: Array.from({length: 31}, (_, i) => i)}, ...bands]) {
				const a = angular.filter(
						(a) => a.name === name && a.mode === mode && band.channels.includes(a.channel),
					),
					count = a.reduce((s, a) => s + a.count, 0),
					baseline = a.reduce((s, a) => s + a.baseline, 0),
					error = a.reduce((s, a) => s + a.error, 0);
				const folds = times.map((time) => {
					const f = a.flatMap((a) => a.folds.filter((f) => f.time === time));
					const baseline = f.reduce((s, f) => s + f.baseline, 0),
						error = f.reduce((s, f) => s + f.error, 0);
					return {
						time,
						skill: 1 - error / baseline,
						baseline,
						error,
						count: f.reduce((s, f) => s + f.count, 0),
					};
				});
				summaries.push({
					name,
					mode,
					band: band.name,
					count,
					baselineRms: Math.sqrt(baseline / count),
					remainingRms: Math.sqrt(error / count),
					skill: 1 - error / baseline,
					positiveTimes: folds.filter((f) => f.skill > 0).length,
					folds,
				});
			}
	return {coverage, raw, centeredBins, angular, stratified, pairs, summaries};
}

/** Deterministic manufactured numerical/stratification checks. */
export function proof() {
	let checks = 0;
	assert.deepEqual(
		solve(
			[
				[1, 0, 0],
				[0, 2, 0],
				[0, 0, 3],
			],
			[2, 6, 12],
		),
		[2, 3, 4],
	);
	checks++;
	assert.throws(() =>
		solve(
			[
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
			],
			[1, 1, 1],
		),
	);
	checks++;
	for (const [a, b] of [
		[0, 0],
		[19.99, 0],
		[20, 1],
		[139.99, 6],
		[140, 7],
		[180, 7],
	]) {
		assert.equal(bin(a), b);
		checks++;
	}
	/** @type {SkyReferenceRow[]} */ const rows = [];
	for (let t = 0; t < 3; t++)
		for (let radius = 1; radius <= 2; radius++)
			for (let j = 0; j < 8; j++) {
				const angle = 25 + j * 14 + t,
					b = basis(angle),
					offset = 2 + t + radius,
					angular = 0.2 * b[0] - 0.3 * b[1] + 0.4 * b[2];
				rows.push({
					time: String(t),
					x: 4 + radius,
					y: 4,
					elevation: 90 - radius * 20,
					separation: angle,
					measured: [10],
					models: {known: [10 + offset + angular], offset: [10 + offset]},
				});
			}
	const points = centered(rows, 'known', 0, 'absolute'),
		result = validate(points);
	for (const c of result.coefficients.map((x, i) => x - [200, -300, 400][i])) {
		assert.ok(Math.abs(c) < 1e-8);
		checks++;
	}
	assert.ok(result.error < 1e-15);
	checks++;
	for (const f of result.folds) {
		assert.ok(!f.trainingTimes.includes(f.time));
		assert.equal(f.trainingTimes.length, 2);
		checks += 2;
	}
	const pure = centered(rows, 'offset', 0, 'absolute');
	assert.ok(pure.every((p) => Math.abs(p.y) < 1e-10));
	checks++;
	assert.ok(validate(pure).error < 1e-15);
	checks++;
	assert.equal(
		residual(rows[0], 'offset', 0, 'fractional'),
		(2 * (rows[0].models.offset[0] - 10)) / (rows[0].models.offset[0] + 10),
	);
	checks++;
	return checks;
}
