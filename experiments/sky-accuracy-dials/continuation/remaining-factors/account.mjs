import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readRepository, outputRelative} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';

/** Read only fixed authenticated prior artifacts, retaining each derivation edge.
 * @returns {SkyRemainingInputs}
 */
export function readRemainingInputs() {
	/** @type {DialFileIdentity[]} */ const parents = [];
	/** @param {string} run @param {string} name @returns {unknown} */
	function read(run, name) {
		const parent = acceptedMechanismInput(`${outputRelative}/runs/${run}`),
			id = mechanismArtifact(parent, name);
		parents.push(parent.seal, id);
		const bytes = readRepository(id.path, id);
		return JSON.parse(
			(name.endsWith('.gz') ? gunzipSync(bytes, {maxOutputLength: 16 * 1024 ** 2}) : bytes).toString(),
		);
	}
	const previous = /** @type {SkyTargetedAssessment} */ (read('00224-targeted-gpu', 'assessment.json.gz'));
	const references = /** @type {SkyJ1AssessmentRow[]} */ (read('00110-c1-j1-assess', 'rows.json'));
	/** @type {SkyRemainingCapture[]} */ const captures = [];
	const definitions = [
		['H', '00171-matched-h-n6'],
		['P55', '00173-matched-p55-n6'],
		['D48-split', '00130-c-d48-split'],
		['D48-factored', '00131-c-d48-factored'],
		['D55-raw', '00132-c-d55-raw'],
		['D55-split', '00133-c-d55-split'],
		['D55-factored', '00134-c-d55-factored'],
		['T320', '00140-c-h-t320'],
	];
	for (const [name, run] of definitions) {
		const rows = [0, 8].flatMap((channel) => {
			const data = /** @type {SkyRemainingDiagnosticBoundary} */ (
				read(run, `channel-${String(channel).padStart(2, '0')}-diagnostics.json.gz`)
			);
			assert.equal(data.units, 'W m^-2 sr^-1 nm^-1');
			const selected = (data.rows ?? data.probes).filter(
				(r) => r.methodId === 'reference-envelope' && r.representationId.startsWith('grouped'),
			);
			assert.equal(selected.length, 40 * (name === 'H' || name === 'P55' ? 6 : 4));
			return selected.map((r) => ({...r, channel}));
		});
		captures.push({name, run, numericalCandidate: !['H', 'D48-split', 'D55-split'].includes(name), rows});
	}
	const physicalSecond = [
		['p-0930-5-7', '00179-p2-ref-assess'],
		['p-1230-3-5', '00200-tr-ref-assess'],
	].flatMap(([probeId, run]) => {
		const data = /** @type {SkyRemainingP2Boundary} */ (read(run, 'reference-assessment.json'));
		assert.ok(data.channels.every((r) => r.adequate));
		return data.channels.map((r) => ({...r, probeId}));
	});
	return {
		corrected: previous.rows.filter((r) => r.mode === 7 && r.sourceCount === 160 && [0, 8].includes(r.channel)),
		references,
		captures,
		physicalSecond,
		parents: [...new Map(parents.map((id) => [id.path, id])).values()],
	};
}

/** Retain the exact source row; never substitute another reconstruction or method.
 * @param {SkyRemainingCapture} capture @param {string} probeId @param {number} channel @param {number} order
 * @returns {SkyRemainingOrderRow}
 */
function orderRow(capture, probeId, channel, order) {
	const rows = capture.rows.filter((r) => r.probeId === probeId && r.channel === channel && r.order === order);
	assert.equal(rows.length, 1);
	assert.ok(Number.isFinite(rows[0].value));
	return rows[0];
}

/** Signed residual accounting and the frozen new-GPU execution decision.
 * @param {SkyRemainingInputs} input @returns {SkyRemainingAssessment}
 */
export function accountRemaining(input) {
	assert.equal(input.corrected.length, 80);
	const h = input.captures.find((c) => c.name === 'H');
	/** @type {SkyRemainingRow[]} */ const rows = [];
	let prefixChecks = 0;
	for (const first of input.corrected) {
		const ref = input.references.find((r) => r.probeId === first.probeId && r.channel === first.channel);
		const h1 = orderRow(h, first.probeId, first.channel, 1),
			h4 = orderRow(h, first.probeId, first.channel, 4);
		assert.equal(h1.value, ref.raw.firstOrderW);
		assert.equal(h4.value, ref.raw.fourthOrderW);
		prefixChecks += 2;
		assert.equal(h4.value - h1.value, first.higherW);
		prefixChecks++;
		const baseline = first.first16W + first.higherW - first.measuredW;
		const p2 = input.physicalSecond.find((r) => r.probeId === first.probeId && r.channel === first.channel);
		for (const capture of input.captures) {
			for (const maximumOrder of ['H', 'P55'].includes(capture.name) ? [4, 6] : [4]) {
				const cumulative = Array.from({length: maximumOrder}, (_, i) =>
					orderRow(capture, first.probeId, first.channel, i + 1),
				);
				const higherOrders = cumulative.slice(1).map((r, i) => r.value - cumulative[i].value);
				const higher = cumulative.at(-1).value - cumulative[0].value;
				const residual = first.first16W + higher - first.measuredW,
					delta = residual - baseline;
				const crossTerm = 2 * baseline * delta,
					squaredChange = delta * delta;
				assert.ok(Math.abs(residual * residual - baseline * baseline - crossTerm - squaredChange) < 1e-13);
				const a = cumulative[0].errorAllowance,
					b = cumulative.at(-1).errorAllowance;
				rows.push({
					probeId: first.probeId,
					time: first.time,
					channel: first.channel,
					solarSeparation: ref.sunSeparationDegrees,
					elevation: ref.elevationDegrees,
					candidate: capture.name + (maximumOrder === 6 ? '+N56' : ''),
					first: first.first16W,
					measured: first.measuredW,
					higherOrders,
					residual,
					residual8: first.first8W + higher - first.measuredW,
					delta,
					crossTerm,
					squaredChange,
					higherAllowance: a === null || b === null ? null : a + b,
					secondError: p2 ? higherOrders[0] - p2.referenceWatts : null,
					physicalLowerBound: p2
						? first.physicalW +
							p2.referenceWatts -
							first.measuredW -
							p2.allowanceWatts -
							ref.physicalAllowanceW
						: null,
				});
			}
		}
		if (p2) {
			const original = rows.find(
				(r) => r.probeId === first.probeId && r.channel === first.channel && r.candidate === 'H',
			);
			const higherOrders = [p2.referenceWatts, ...original.higherOrders.slice(1)],
				delta = p2.referenceWatts - original.higherOrders[0];
			rows.push({
				...original,
				candidate: 'physical-P2',
				higherOrders,
				residual: baseline + delta,
				residual8: original.residual8 + delta,
				delta,
				crossTerm: 2 * baseline * delta,
				squaredChange: delta * delta,
				secondError: 0,
				higherAllowance:
					original.higherAllowance === null ? null : original.higherAllowance + p2.allowanceWatts,
			});
		}
	}
	const selectors = [
		'all',
		...new Set(rows.map((r) => r.time)),
		'channel-0',
		'channel-8',
		'near-sun',
		'middle-sun',
		'antisolar',
		'low-elevation',
		'zenith',
	];
	/** @type {SkyRemainingGroup[]} */ const groups = [];
	for (const candidate of new Set(rows.map((r) => r.candidate)))
		for (const group of selectors) {
			const chosen = rows.filter((r) => r.candidate === candidate && selected(r, group));
			if (!chosen.length) continue;
			groups.push({
				group,
				candidate,
				count: chosen.length,
				positive: chosen.filter((r) => r.residual > 0).length,
				negative: chosen.filter((r) => r.residual < 0).length,
				meanMw: (1000 * chosen.reduce((s, r) => s + r.residual, 0)) / chosen.length,
				rmseMw: (1000 * Math.hypot(...chosen.map((r) => r.residual))) / Math.sqrt(chosen.length),
				rmse8Mw: (1000 * Math.hypot(...chosen.map((r) => r.residual8))) / Math.sqrt(chosen.length),
				crossTerm: chosen.reduce((s, r) => s + r.crossTerm, 0),
				squaredChange: chosen.reduce((s, r) => s + r.squaredChange, 0),
				allowanceNorm: chosen.some((r) => r.higherAllowance === null)
					? null
					: Math.hypot(...chosen.map((r) => r.higherAllowance)),
			});
		}
	const original = groups.find((g) => g.group === 'all' && g.candidate === 'H');
	const gates = input.captures
		.filter((c) => c.numericalCandidate)
		.map((c) => {
			const group = groups.find((g) => g.group === 'all' && g.candidate === c.name);
			const referenced = rows.filter((r) => r.candidate === c.name && r.secondError !== null);
			const p2Improved = referenced.filter(
				(r) =>
					Math.abs(r.secondError) <
					Math.abs(
						rows.find((h) => h.candidate === 'H' && h.probeId === r.probeId && h.channel === r.channel)
							.secondError,
					),
			).length;
			const gainMw = original.rmseMw - group.rmseMw,
				gain8Mw = original.rmse8Mw - group.rmse8Mw;
			return {
				candidate: c.name,
				gainMw,
				gain8Mw,
				p2Improved,
				p2Count: referenced.length,
				admitted: gainMw >= 0.01 && p2Improved === 4 && referenced.length === 4,
			};
		});
	return {rows, groups, gates, runHigherFactorial: gates.some((g) => g.admitted), prefixChecks};
}

/** Membership in fixed overlapping diagnostic strata.
 * @param {SkyRemainingRow} row @param {string} group @returns {boolean}
 */
function selected(row, group) {
	if (group === 'all' || group === row.time || group === 'channel-' + row.channel) return true;
	if (group === 'near-sun') return row.solarSeparation <= 15;
	if (group === 'middle-sun') return row.solarSeparation > 15 && row.solarSeparation < 90;
	if (group === 'antisolar') return row.solarSeparation >= 90;
	if (group === 'low-elevation') return row.elevation <= 20;
	if (group === 'zenith') return row.elevation >= 75;
	return false;
}
