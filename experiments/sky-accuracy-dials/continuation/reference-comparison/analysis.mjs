import assert from 'node:assert/strict';

/** Decode unique canonical rows; shared boundaries require all 40 finite channels.
 * @param {string} text @param {boolean} modelColumn @returns {Map<string,number[]>}
 */
export function spectra(text, modelColumn) {
	const lines = text.trim().split(/\r?\n/),
		header = lines.shift().split('\t'),
		offset = modelColumn ? 4 : 3;
	assert.equal(header.length, offset + 40);
	for (let c = 0; c < 40; c++) assert.equal(header[offset + c], `lambda_${c}`);
	const result = new Map();
	for (const line of lines) {
		const fields = line.split('\t');
		assert.equal(fields.length, header.length);
		const key = fields.slice(0, offset).join('|'),
			values = fields.slice(offset).map(Number);
		assert.ok(!result.has(key), 'Duplicate spectrum');
		assert.ok(values.every((x) => Number.isFinite(x) && x >= 0));
		result.set(key, values);
	}
	return result;
}

/** Compare fixed baseline error with uncertain direct equation solution.
 * @param {number} baseline @param {number} direct @param {number} measured @param {number} halfWidth
 * @returns {SkyReferenceBalance}
 */
export function balance(baseline, direct, measured, halfWidth) {
	assert.ok([baseline, direct, measured, halfWidth].every(Number.isFinite) && halfWidth >= 0);
	const n = baseline - direct,
		p = direct - measured,
		r = baseline - measured;
	assert.ok(Math.abs(r - n - p) < 1e-12);
	assert.ok(Math.abs(r * r - (n * n + p * p + 2 * n * p)) < 1e-12);
	const low = p - halfWidth,
		high = p + halfWidth,
		minSquare = low <= 0 && high >= 0 ? 0 : Math.min(low * low, high * high),
		maxSquare = Math.max(low * low, high * high);
	return {
		numerical: n,
		physicalResidual: p,
		residual: r,
		crossTerm: 2 * n * p,
		benefit: p * p - r * r,
		robustOpposition: Math.abs(n) > halfWidth && Math.abs(p) > halfWidth && n * p < 0,
		robustBenefit: minSquare > r * r,
		robustHarm: maxSquare < r * r,
	};
}

/** Fixed spatial partitions; near-Sun data remain present in the full score.
 * @param {SkyReferenceRow} row @param {string} region @returns {boolean}
 */
export function inRegion(row, region) {
	const near = row.separation < 20;
	switch (region) {
		case 'all':
			return true;
		case 'near-sun':
			return near;
		case 'away-sun':
			return !near;
		case 'away-low':
			return !near && row.elevation < 20;
		case 'away-middle':
			return !near && row.elevation >= 20 && row.elevation < 60;
		case 'away-high':
			return !near && row.elevation >= 60;
		default:
			throw new Error('Unknown region');
	}
}

/** Matched regional scalar summary with independent reference agreement diagnostics.
 * @param {readonly SkyReferenceRow[]} rows @param {readonly number[]} channels
 * @returns {SkyReferenceSummary}
 */
export function summarize(rows, channels) {
	assert.ok(rows.length && channels.length);
	const names = Object.keys(rows[0].models),
		count = rows.length * channels.length;
	const residuals = Object.fromEntries(
		names.map((name) => [name, rows.flatMap((r) => channels.map((c) => r.models[name][c] - r.measured[c]))]),
	);
	const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
	const rms = (xs) => Math.sqrt(mean(xs.map((x) => x * x)));
	const shared = residuals.bruneton.map((x, i) => (x + residuals.libradtran[i]) / 2);
	const compare = (a, b) => {
		const ma = mean(a),
			mb = mean(b);
		let ab = 0,
			aa = 0,
			bb = 0,
			eligible = 0,
			sameSign = 0;
		for (let i = 0; i < a.length; i++) {
			ab += (a[i] - ma) * (b[i] - mb);
			aa += (a[i] - ma) ** 2;
			bb += (b[i] - mb) ** 2;
			if (Math.abs(a[i]) > 1e-5 && Math.abs(b[i]) > 1e-5) {
				eligible++;
				if (a[i] * b[i] > 0) sameSign++;
			}
		}
		return {
			correlation: aa * bb > 0 ? ab / Math.sqrt(aa * bb) : null,
			sameSign,
			eligible,
			modelDifferenceRmsMw: 1000 * rms(a.map((x, i) => x - b[i])),
		};
	};
	return {
		rays: rows.length,
		count,
		models: Object.fromEntries(
			names.map((name) => [
				name,
				{
					rmseMw: 1000 * rms(residuals[name]),
					meanMw: 1000 * mean(residuals[name]),
					vsShared: compare(residuals[name], shared),
				},
			]),
		),
		referenceAgreement: compare(residuals.bruneton, residuals.libradtran),
	};
}

/** Manufactured cancellation, overshoot, uncertainty and parser proof checks. */
export function proof() {
	const cancelled = balance(12, 20, 10, 0.1);
	assert.ok(cancelled.robustBenefit && cancelled.robustOpposition);
	const overshot = balance(0, 12, 10, 0.1);
	assert.ok(overshot.robustOpposition && overshot.robustHarm);
	const unresolved = balance(11, 11, 10, 2);
	assert.ok(!unresolved.robustBenefit && !unresolved.robustOpposition && !unresolved.robustHarm);
	const header = ['time', 'x', 'y', ...Array.from({length: 40}, (_, i) => `lambda_${i}`)].join('\t');
	const row = ['12:30', '4', '4', ...Array(40).fill('0')].join('\t');
	assert.equal(spectra(header + '\n' + row, false).size, 1);
	assert.throws(() => spectra(header + '\n' + row + '\n' + row, false));
	assert.throws(() => spectra(header + '\n' + row.replace(/0$/, 'NaN'), false));
	for (const elevation of [12, 20, 40, 60, 90])
		for (const separation of [0, 19.99, 20, 60, 170]) {
			const r = {time: '12:30', x: 0, y: 0, elevation, separation, measured: [], models: {}};
			assert.equal(['near-sun', 'away-low', 'away-middle', 'away-high'].filter((s) => inRegion(r, s)).length, 1);
		}
	return 31;
}
