import assert from 'node:assert/strict';
import {createRun, identity, readRepository, verifyRun} from '../io/files.mjs';
import {inputRun} from '../inputs.mjs';
import {loadInputs} from '../execution.mjs';
import {extractBoundary, loadSpectra, measurements} from '../processing.mjs';
import {
	ALL_CHANNELS,
	ALL_RAYS,
	CAPTURE_TIMES,
	SCORE_CHANNELS,
	RADIANCE_UNITS,
	selectBoundary,
} from '../analysis/boundary.mjs';
import {scoreBoundary} from '../analysis/metrics.mjs';
import {deriveProfile} from '../numerics/profile.js';
import {benchmarkRay} from '../numerics/view.js';

/** Require a complete accepted four-order run and unchanged pinned physical inputs.
 * @param {string} runPath @param {DialInputs} inputs @returns {DialLoadedSpectra}
 */
function admittedRun(runPath, inputs) {
	const loaded = loadSpectra(runPath);
	const seal = JSON.parse(readRepository(loaded.sealIdentity.path, loaded.sealIdentity).toString());
	assert.equal(seal.result.selection, 'full');
	assert.equal(seal.result.channelCount, 40);
	assert.equal(seal.result.failure, null);
	assert.deepEqual(Object.keys(loaded.control).sort(), ['buildRequest', 'channels', 'controls', 'scenes']);
	assert.deepEqual(loaded.control.channels, ALL_CHANNELS);
	assert.deepEqual(loaded.control.scenes, inputs.scenes);
	assert.deepEqual(
		loaded.control.scenes.map((scene) => scene.time),
		CAPTURE_TIMES,
	);
	assert.equal(loaded.control.controls.viewRule, 'quadratic');
	const expected = deriveProfile(inputs.native48, loaded.control.controls);
	assert.deepEqual(loaded.control.controls, expected.controls);
	assert.deepEqual(loaded.control.buildRequest, expected.buildRequest);
	for (const channel of loaded.spectra) assert.equal(channel.shape.orderCount, 4);
	return loaded;
}

/** Sum a set without rounding, retaining the cross terms required by both identities.
 * @param {readonly DialResidualPoint[]} points @returns {DialResidualTotals}
 */
function totals(points) {
	/** @param {(point: DialResidualPoint) => number} select @returns {number} */
	const sum = (select) => points.reduce((value, point) => value + select(point), 0);
	const controlSse = sum((point) => point.controlSse),
		candidateSse = sum((point) => point.candidateSse);
	const scalarCount = points.length * SCORE_CHANNELS.length;
	return {
		pointCount: points.length,
		scalarCount,
		controlSse,
		candidateSse,
		controlRmseMilliwatt: scalarCount ? 1000 * Math.sqrt(controlSse / scalarCount) : null,
		candidateRmseMilliwatt: scalarCount ? 1000 * Math.sqrt(candidateSse / scalarCount) : null,
		deltaEnergy: sum((point) => point.deltaEnergy),
		firstOrderDeltaEnergy: sum((point) => point.firstOrderDeltaEnergy),
		higherOrderDeltaEnergy: sum((point) => point.higherOrderDeltaEnergy),
		orderCrossTerm: sum((point) => point.orderCrossTerm),
		residualCrossTerm: sum((point) => point.residualCrossTerm),
	};
}

/** Include intersection and union explicitly so overlapping groups cannot be mistaken for a partition.
 * @param {readonly DialResidualPoint[]} points @returns {DialResidualGroups}
 */
function groups(points) {
	return {
		all: totals(points),
		nearSun: totals(points.filter((point) => point.nearSun)),
		lowElevation: totals(points.filter((point) => point.lowElevation)),
		overlap: totals(points.filter((point) => point.nearSun && point.lowElevation)),
		union: totals(points.filter((point) => point.nearSun || point.lowElevation)),
		neither: totals(points.filter((point) => !point.nearSun && !point.lowElevation)),
	};
}

/** Authenticate and derive the report in memory; this function never allocates or writes an evidence run.
 * @param {string} controlRun @param {string} candidateRun @returns {DialResidualReport}
 */
export function deriveResidualReport(controlRun, candidateRun) {
	assert.notEqual(controlRun, candidateRun);
	const inputs = loadInputs(),
		control = admittedRun(controlRun, inputs),
		candidate = admittedRun(candidateRun, inputs);
	const selection = {times: CAPTURE_TIMES, channels: SCORE_CHANNELS, rayIndices: ALL_RAYS};
	/** @param {DialLoadedSpectra} loaded @param {number} order @returns {DialAnalysisBoundary} */
	const boundary = (loaded, order) =>
		selectBoundary(extractBoundary(loaded, 'cumulative', 30, 'monotone-cubic', order), selection);
	const before = boundary(control, 4),
		after = boundary(candidate, 4),
		firstBefore = boundary(control, 1),
		firstAfter = boundary(candidate, 1);
	const measured = selectBoundary(measurements(), selection);
	const controlScore = scoreBoundary(before, measured),
		candidateScore = scoreBoundary(after, measured);
	assert.ok(controlScore.fullRegisteredBoundary && candidateScore.fullRegisteredBoundary);
	/** @type {DialResidualPoint[]} */
	const points = [];
	let maximumRelativeIdentityError = 0;
	/** Roundoff-only consistency check; no user-facing values are rounded before retention.
	 * @param {number} actual @param {number} expected @param {number} scale
	 */
	function close(actual, expected, scale) {
		const relative = Math.abs(actual - expected) / Math.max(Math.abs(scale), 1e-30);
		maximumRelativeIdentityError = Math.max(maximumRelativeIdentityError, relative);
		assert.ok(relative <= 1e-12, `Residual identity exceeded binary64 roundoff tolerance: ${relative}`);
	}
	for (const [timeIndex, time] of CAPTURE_TIMES.entries()) {
		const scene = control.control.scenes[timeIndex],
			spec = control.control.buildRequest.transportSpec;
		for (const rayIndex of ALL_RAYS) {
			const gridX = rayIndex % 9,
				gridY = Math.floor(rayIndex / 9);
			const ray = benchmarkRay(spec, scene, gridX, gridY);
			/** @param {number} value @returns {number} */
			const clamp = (value) => Math.min(1, Math.max(-1, value));
			const elevationDegrees =
				(Math.asin(
					clamp(
						ray.origin.reduce((sum, value, axis) => sum + value * ray.direction[axis], 0) /
							spec.planet.bottomRadiusMeters,
					),
				) *
					180) /
				Math.PI;
			const sunSeparationDegrees = (Math.acos(clamp(ray.direction[2])) * 180) / Math.PI;
			let measuredSum = 0,
				controlSum = 0,
				candidateSum = 0,
				controlResidualSum = 0,
				candidateResidualSum = 0;
			let controlSse = 0,
				candidateSse = 0,
				deltaEnergy = 0,
				firstOrderDeltaEnergy = 0,
				higherOrderDeltaEnergy = 0;
			let orderCrossTerm = 0,
				residualCrossTerm = 0,
				deltaSum = 0,
				firstSum = 0,
				higherSum = 0;
			for (let channel = 0; channel < SCORE_CHANNELS.length; channel++) {
				const index = (timeIndex * 81 + rayIndex) * SCORE_CHANNELS.length + channel;
				const reference = measured.values[index],
					a = before.values[index],
					b = after.values[index];
				const residualA = a - reference,
					residualB = b - reference,
					delta = b - a;
				const first = firstAfter.values[index] - firstBefore.values[index];
				const higher = b - firstAfter.values[index] - (a - firstBefore.values[index]);
				close(delta, first + higher, Math.abs(a) + Math.abs(b));
				measuredSum += reference;
				controlSum += a;
				candidateSum += b;
				controlResidualSum += residualA;
				candidateResidualSum += residualB;
				controlSse += residualA ** 2;
				candidateSse += residualB ** 2;
				deltaEnergy += delta ** 2;
				firstOrderDeltaEnergy += first ** 2;
				higherOrderDeltaEnergy += higher ** 2;
				orderCrossTerm += 2 * first * higher;
				residualCrossTerm += 2 * residualA * delta;
				deltaSum += delta;
				firstSum += first;
				higherSum += higher;
			}
			const count = SCORE_CHANNELS.length,
				controlRmseMilliwatt = 1000 * Math.sqrt(controlSse / count),
				candidateRmseMilliwatt = 1000 * Math.sqrt(candidateSse / count);
			close(candidateSse - controlSse, residualCrossTerm + deltaEnergy, controlSse + candidateSse);
			close(
				deltaEnergy,
				firstOrderDeltaEnergy + higherOrderDeltaEnergy + orderCrossTerm,
				deltaEnergy + firstOrderDeltaEnergy + higherOrderDeltaEnergy,
			);
			points.push({
				time,
				rayIndex,
				gridX,
				gridY,
				elevationDegrees,
				sunSeparationDegrees,
				nearSun: sunSeparationDegrees <= 15,
				lowElevation: elevationDegrees <= 20,
				measuredMeanW: measuredSum / count,
				controlMeanW: controlSum / count,
				candidateMeanW: candidateSum / count,
				controlResidualMeanW: controlResidualSum / count,
				candidateResidualMeanW: candidateResidualSum / count,
				controlSse,
				candidateSse,
				controlRmseMilliwatt,
				candidateRmseMilliwatt,
				rmseChangeMilliwatt: candidateRmseMilliwatt - controlRmseMilliwatt,
				controlConditionSseShare: controlSse / controlScore.conditions[timeIndex].squaredError,
				candidateConditionSseShare: candidateSse / candidateScore.conditions[timeIndex].squaredError,
				deltaEnergy,
				firstOrderDeltaEnergy,
				higherOrderDeltaEnergy,
				orderCrossTerm,
				deltaMeanW: deltaSum / count,
				firstOrderDeltaMeanW: firstSum / count,
				higherOrderDeltaMeanW: higherSum / count,
				residualCrossTerm,
			});
		}
	}
	const conditions = CAPTURE_TIMES.map((time, timeIndex) => {
		const selected = points.filter((point) => point.time === time),
			grouped = groups(selected);
		close(grouped.all.controlSse, controlScore.conditions[timeIndex].squaredError, grouped.all.controlSse);
		close(grouped.all.candidateSse, candidateScore.conditions[timeIndex].squaredError, grouped.all.candidateSse);
		const topControl = [...selected]
			.sort((a, b) => b.controlSse - a.controlSse || a.rayIndex - b.rayIndex)
			.slice(0, 5);
		const topCandidate = [...selected]
			.sort((a, b) => b.candidateSse - a.candidateSse || a.rayIndex - b.rayIndex)
			.slice(0, 5);
		return {
			time,
			groups: grouped,
			topControl,
			topCandidate,
			worstPointUnchanged: topControl[0].rayIndex === topCandidate[0].rayIndex,
		};
	});
	const grouped = groups(points);
	close(grouped.all.controlSse, controlScore.squaredError, controlScore.squaredError);
	close(grouped.all.candidateSse, candidateScore.squaredError, candidateScore.squaredError);
	for (const set of [grouped, ...conditions.map((condition) => condition.groups)]) {
		assert.equal(
			set.nearSun.pointCount + set.lowElevation.pointCount - set.overlap.pointCount,
			set.union.pointCount,
		);
		assert.equal(set.union.pointCount + set.neither.pointCount, set.all.pointCount);
	}
	return {
		schemaId: 'sky-residual-attribution-v1',
		parents: [
			control.sealIdentity,
			candidate.sealIdentity,
			identity(`${inputRun}/sealed.json`),
			measured.sourceIdentity,
			identity(`${inputRun}/controls.json`),
		],
		control: control.control,
		candidate: candidate.control,
		selection,
		units: RADIANCE_UNITS,
		equations: [
			'Point RMSE = sqrt(sum_channel((C4 - measurement)^2) / 31); reported RMSE multiplies W values by 1000.',
			'Point condition SSE share = point SSE / sum of 81 point SSE values at that time.',
			'delta = C4_candidate - C4_control; deltaSSE = 2 * residual_control dot delta + delta dot delta.',
			'delta_first = C1_candidate - C1_control; delta_higher = (C4-C1)_candidate - (C4-C1)_control.',
			'Energy(delta) = energy(delta_first) + energy(delta_higher) + 2 * delta_first dot delta_higher.',
			'C1 is the reconstructed first-order radiance; C4-C1 is a frozen boundary subtraction, not separately reconstructed pure higher-order fields.',
			'Near-Sun means separation <= 15 degrees; low elevation means elevation <= 20 degrees. Their totals overlap; intersection, union and neither are explicit.',
			'Points are ordered time, then gridY*9+gridX, with channel indices 0..30. Means are arithmetic spectral means, not wavelength-integrated brightness.',
		],
		controlScore,
		candidateScore,
		points,
		conditions,
		groups: grouped,
		worstPointUnchangedCount: conditions.filter((condition) => condition.worstPointUnchanged).length,
		maximumRelativeIdentityError,
	};
}

/** Build a standalone, linear-scale noon grid figure with common before/after limits.
 * @param {DialResidualReport} report @returns {string}
 */
function noonSvg(report) {
	const points = report.points.filter((point) => point.time === '12:30');
	assert.equal(points.length, 81);
	const maximum = Math.max(...points.flatMap((point) => [point.controlRmseMilliwatt, point.candidateRmseMilliwatt]));
	const changeMaximum = Math.max(...points.map((point) => Math.abs(point.rmseChangeMilliwatt))) || 1;
	const panels = [
		{title: 'Control RMSE', values: points.map((point) => point.controlRmseMilliwatt)},
		{title: 'Candidate RMSE', values: points.map((point) => point.candidateRmseMilliwatt)},
		{title: 'Candidate - control RMSE', values: points.map((point) => point.rmseChangeMilliwatt)},
	];
	const parts = [
		'<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="490" viewBox="0 0 1120 490" role="img" aria-labelledby="title desc">',
		'<title id="title">12:30 Kider residual RMSE at all 81 rays</title>',
		'<desc id="desc">Three 9 by 9 grids show control RMSE, candidate RMSE, and candidate minus control RMSE. Rows are grid Y increasing downward and columns are grid X increasing rightward. The first two panels use one common linear color axis. The difference panel uses a symmetric axis; blue is improvement and red is worsening.</desc>',
		'<rect width="1120" height="490" fill="white"/><g font-family="Arial, sans-serif" fill="#17202a">',
		'<text x="25" y="26" font-size="19">12:30 EDT: point spectral RMSE against Kider, channels 0–30</text>',
		'<text x="25" y="48" font-size="12">mW m⁻² sr⁻¹ nm⁻¹ · arithmetic RMSE over 31 wavelengths · Y-major index = 9Y + X</text>',
	];
	for (const [panelIndex, panel] of panels.entries()) {
		const left = 45 + panelIndex * 365,
			top = 100,
			size = 34;
		parts.push(`<text x="${left}" y="78" font-size="15">${panel.title}</text>`);
		for (let axis = 0; axis < 9; axis++)
			parts.push(
				`<text x="${left + axis * size + 14}" y="94" font-size="10">${axis}</text><text x="${left - 17}" y="${top + axis * size + 21}" font-size="10">${axis}</text>`,
			);
		for (const [index, value] of panel.values.entries()) {
			const strength = Math.min(1, Math.abs(value) / (panelIndex === 2 ? changeMaximum : maximum));
			const color = panelIndex === 2 ? (value < 0 ? [35, 90, 180] : [190, 45, 40]) : [65, 30, 120];
			const fill = `rgb(${color.map((component) => Math.round(255 + strength * (component - 255))).join(',')})`;
			const x = left + (index % 9) * size,
				y = top + Math.floor(index / 9) * size;
			parts.push(
				`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" stroke="#d7dbe0"><title>X=${index % 9}, Y=${Math.floor(index / 9)}, ray=${index}, value=${value}</title></rect><text x="${x + size / 2}" y="${y + 21}" text-anchor="middle" fill="${strength > 0.58 ? 'white' : '#17202a'}" font-size="8.5">${value.toFixed(1)}</text>`,
			);
		}
		parts.push(
			`<text x="${left}" y="431" font-size="11">${panelIndex === 2 ? `Symmetric scale: ±${changeMaximum.toFixed(3)}; blue better, red worse` : `Common linear scale: 0 to ${maximum.toFixed(3)}`}</text>`,
		);
	}
	parts.push(
		'<text x="25" y="463" font-size="12">Cell labels are rounded for display only; points.csv and result.json retain binary64 values.</text></g></svg>',
	);
	return parts.join('\n');
}

/** Retain derived attribution without modifying either parent run.
 * @param {string} controlRun @param {string} candidateRun @returns {string}
 */
export function retainResidualReport(controlRun, candidateRun) {
	const report = deriveResidualReport(controlRun, candidateRun);
	const run = createRun('residuals', {
		parents: [...report.parents],
		operation:
			'Authenticate two full N4 boundaries; reconstruct cumulative Q30/cubic C1 and C4, select all 17x81x31 registered coordinates, and apply the retained point residual, SSE, geometry and order-change equations.',
		parameters: {selection: report.selection, equations: report.equations, controlRun, candidateRun},
	});
	try {
		run.progress('reporting', 'Retaining per-point residual attribution and equal-scale noon comparison.');
		const encoded = JSON.stringify(report);
		assert.deepEqual(JSON.parse(encoded), report, 'JSON round trip must preserve every retained numeric value.');
		const columns = Object.keys(report.points[0]);
		const csv =
			[
				columns.join(','),
				...report.points.map((point) => columns.map((key) => String(point[key])).join(',')),
			].join('\n') + '\n';
		for (const [index, line] of csv.trimEnd().split('\n').slice(1).entries()) {
			const tokens = line.split(',');
			for (const [column, key] of columns.entries())
				if (typeof report.points[index][key] === 'number')
					assert.equal(Number(tokens[column]), report.points[index][key]);
		}
		const markdown = [
			'# Spatial residual attribution',
			'',
			`Control: ${controlRun}. Candidate: ${candidateRun}.`,
			'',
			'All 17 times, 81 directions and registered channels 0–30; cumulative N4, quadratic Q30 and monotone cubic solar reconstruction. Means are arithmetic spectral radiance means. Numerical change energy is not measurement error.',
			'',
			`Aggregate RMSE: ${report.controlScore.aggregateRmseMilliwatt.toFixed(6)} → ${report.candidateScore.aggregateRmseMilliwatt.toFixed(6)} mW m^-2 sr^-1 nm^-1. The worst ray is unchanged at ${report.worstPointUnchangedCount}/17 times.`,
			'',
			'| Time | Control RMSE | Candidate RMSE | Worst control (X,Y) | Its before → after RMSE | Its before → after SSE share |',
			'| --- | ---: | ---: | --- | ---: | ---: |',
			...report.conditions.map((condition, index) => {
				const point = condition.topControl[0];
				return `| ${condition.time} | ${report.controlScore.conditions[index].rmseMilliwatt.toFixed(3)} | ${report.candidateScore.conditions[index].rmseMilliwatt.toFixed(3)} | (${point.gridX},${point.gridY}) | ${point.controlRmseMilliwatt.toFixed(3)} → ${point.candidateRmseMilliwatt.toFixed(3)} | ${(100 * point.controlConditionSseShare).toFixed(2)}% → ${(100 * point.candidateConditionSseShare).toFixed(2)}% |`;
			}),
			'',
			'## Interpretation and reproducibility',
			'',
			...report.equations.map((equation) => `- ${equation}`),
			'',
			`Canonical scorer totals, per-point SSE expansion, first/higher-order energy closure, and geometric overlap counts were checked. Largest relative identity residual: ${report.maximumRelativeIdentityError}. JSON and CSV numeric values round-trip exactly.`,
			'',
			'Every time has separate control and candidate top-five point rankings in result.json. Near-Sun, low-elevation, their overlap, union and complement retain independent sample counts and SSE/response-energy totals. The SVG is a grid-index figure, not an equal-angle hemisphere image. Parent seals retain full source, tool and execution identities; this run records its own implementation identities.',
			'',
		].join('\n');
		const svg = noonSvg(report);
		assert.ok(
			Buffer.byteLength(encoded) + Buffer.byteLength(csv) + Buffer.byteLength(markdown) + Buffer.byteLength(svg) <
				4 * 1024 ** 2,
			'Residual report exceeds its 4 MiB artifact budget.',
		);
		run.write('result.json', encoded + '\n');
		run.write('points.csv', csv);
		run.write('report.md', markdown);
		run.write('noon-residuals.svg', svg);
		run.finish('accepted', {
			controlRun,
			candidateRun,
			pointCount: report.points.length,
			scalarCount: report.groups.all.scalarCount,
			maximumRelativeIdentityError: report.maximumRelativeIdentityError,
			losslessNumericSerialization: true,
		});
	} catch (error) {
		run.finish('failed', {message: String(error), stack: error.stack});
		throw error;
	}
	verifyRun(run.path);
	return run.path;
}
