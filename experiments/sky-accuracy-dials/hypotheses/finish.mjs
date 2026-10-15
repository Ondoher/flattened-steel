import assert from 'node:assert/strict';
import {createRun, readRepository, storage, verifyRun} from '../io/files.mjs';
import {readParent, compareErrors, replayAllowance, requireUnusedStage} from './common.mjs';

/** Finish the bounded scientific assessment using only authenticated new and retained inputs.
 * @returns {void}
 */
export function finishRecovery() {
	requireUnusedStage('h14-finish');
	const started = Date.now(),
		before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const phase = /** @type {HypothesisPhaseP1Packet} */ (readParent('00257-h10-finish', 'phase-p1.json', parents));
	const old = /** @type {HypothesisJoinedPacket} */ (readParent('00251-h9-small-rays', 'joined.json', parents));
	const originalQuestions = /** @type {HypothesisQuestionPacket} */ (
		readParent('00256-h14-hypotheses', 'assessment.json', parents)
	);
	const directInputs = /** @type {SmallRayInputs} */ (readParent('00232-alternate-rays', 'inputs.json', parents));
	const alternate = /** @type {SmallRayDirectPacket} */ (
		readParent('00232-alternate-rays', 'results.json.gz', parents)
	);
	const firstInputs = /** @type {SmallRayInputs} */ (readParent('00230-direct-converge', 'inputs.json', parents));
	const direct = /** @type {SmallRayDirectPacket} */ (
		readParent('00230-direct-converge', 'results.json.gz', parents)
	);
	const nativeMatrix = /** @type {HypothesisNativeMatrixPacket} */ (
		readParent('00260-h12-native48-r2', 'p1-matrix.json', parents)
	);
	const flat = /** @type {HypothesisFlatPacket} */ (readParent('00261-h13-flat-r2', 'flat.json', parents));
	const phaseRows = phase.rows.map((row) => {
		const joined = old.joined.find((r) => r.probeId === row.ray && r.channel === row.channel);
		assert.ok(joined);
		return {
			...row,
			p1RelativeChange: row.p1ChangeW / row.control.total,
			continuousMinusLibW: joined.solverGapW,
			frozenHigherGapAfterW: joined.solverGapW + row.p1ChangeW,
			fractionOfRetainedGap: row.p1ChangeW / -joined.solverGapW,
			qualification:
				'Frozen-higher size comparison only; all-order phase propagation and exact external input deck remain unqualified.',
		};
	});
	const orderRows = [];
	for (const channel of [0, 8]) {
		const packet = /** @type {HypothesisSphericalResult} */ (
			readParent('00259-h11-orders-r2', 'channel-' + channel + '.json', parents)
		);
		for (const probeId of ['p-0930-5-7', 'p-1230-0-4']) {
			assert.ok(firstInputs.rays.some((r) => r.id === probeId));
			const rows = packet.rows.filter((r) => r.probeId === probeId),
				p1 = rows.find((r) => r.order === 1),
				n4 = rows.find((r) => r.order === 4),
				n6 = rows.find((r) => r.order === 6);
			const oracle = direct.rows.find((r) => r.ray === probeId && r.channel === channel),
				joined = old.joined.find((r) => r.probeId === probeId && r.channel === channel);
			assert.ok(oracle && joined);
			assert.ok(p1.refinedResolved && n4.refinedResolved && n6.refinedResolved && n6.pureW.length === 6);
			const target = oracle.total.mean - joined.solverGapW,
				trueHigher = oracle.total.mean - oracle.cpu[1];
			orderRows.push({
				probeId,
				channel,
				n4W: n4.rawW,
				n6W: n6.rawW,
				incrementW: n6.rawW - n4.rawW,
				pureW: n6.pureW,
				p1NumericalErrorW: p1.rawW - oracle.cpu[1],
				higherN4ErrorW: n4.rawW - p1.rawW - trueHigher,
				higherN6ErrorW: n6.rawW - p1.rawW - trueHigher,
				numericalComparison: compareErrors(n4.rawW, n6.rawW, oracle.total.mean, oracle.total.halfWidth95),
				higherComparison: compareErrors(
					n4.rawW - p1.rawW,
					n6.rawW - p1.rawW,
					trueHigher,
					oracle.total.halfWidth95,
				),
				libComparison: compareErrors(n4.rawW, n6.rawW, target, 0),
				direct: oracle.total,
				samplingResolved: oracle.samplingResolved,
				correctedRecurrenceCell: null,
				qualification: 'Raw H control only; no claim of a complete reconstruction-by-order factorial.',
			});
		}
	}
	/** Read one fixed-S20 matrix scalar; the second legacy source slot must be identical.
	 * @param {string} probeId @param {number} channel @param {number} mode @param {number} level @returns {number}
	 */
	function matrixValue(probeId, channel, mode, level) {
		const y = nativeMatrix.layout.findIndex((r) => r.probeId === probeId && r.subdivisions === level),
			c = nativeMatrix.channels.indexOf(channel);
		assert.ok(y >= 0 && c >= 0 && mode >= 0 && mode <= 12);
		const index = 4 * (y * nativeMatrix.matrix.width + c * 26 + mode),
			value = nativeMatrix.matrix.values[index];
		assert.equal(value, nativeMatrix.matrix.values[index + 13 * 4]);
		return value;
	}
	const nativeRows = [];
	for (const channel of [0, 8, 24]) {
		const packet = /** @type {HypothesisSphericalResult} */ (
			readParent('00260-h12-native48-r2', 'channel-' + channel + '.json', parents)
		);
		for (const probeId of ['p-1330-0-4', 'p-1330-5-4']) {
			const x = Number(probeId.split('-')[2]),
				ray = directInputs.rays.find((r) => r.time === '13:30' && r.x === x && r.y === 4);
			assert.ok(ray);
			const oracle = alternate.rows.find((r) => r.ray === ray.id && r.channel === channel);
			assert.ok(oracle);
			const first = packet.rows.find((r) => r.probeId === probeId && r.order === 1),
				total = packet.rows.find((r) => r.probeId === probeId && r.order === 4);
			assert.ok(first.refinedResolved && total.refinedResolved);
			const high = Array.from({length: 13}, (_, m) => matrixValue(probeId, channel, m, 16));
			const low = Array.from({length: 13}, (_, m) => matrixValue(probeId, channel, m, 8));
			const parityAllowance = replayAllowance(first.refinedW) + 2 * Math.abs(high[12] - low[12]);
			assert.ok(
				Math.abs(high[12] - first.refinedW) <= parityAllowance,
				'Native48 P1 control matrix does not reproduce its fixed field.',
			);
			const hybridW = total.refinedW - first.refinedW + high[7];
			const numericalAllowanceW =
				total.refinedAllowanceW +
				first.refinedAllowanceW +
				2 * Math.abs(high[7] - low[7]) +
				replayAllowance(high[7]);
			const beforeErrorW = total.rawW - oracle.total.mean,
				afterErrorW = hybridW - oracle.total.mean;
			const target = ray.models.libradtran[directInputs.channels.indexOf(channel)];
			const improvementFraction = 1 - Math.abs(afterErrorW) / Math.abs(beforeErrorW);
			const fractionScreen = [];
			const absoluteWorseningScreen = [];
			for (const reference of [
				oracle.total.mean - oracle.total.halfWidth95,
				oracle.total.mean + oracle.total.halfWidth95,
			])
				for (const shift of [-numericalAllowanceW, numericalAllowanceW]) {
					fractionScreen.push(1 - Math.abs(hybridW + shift - reference) / Math.abs(total.rawW - reference));
					absoluteWorseningScreen.push(
						Math.abs(hybridW + shift - reference) - Math.abs(total.rawW - reference),
					);
				}
			nativeRows.push({
				probeId,
				channel,
				rawTotalW: total.rawW,
				refinedTotalW: total.refinedW,
				cachedP1W: first.refinedW,
				hybridW,
				beforeErrorW,
				afterErrorW,
				improvementFraction,
				fractionScreen,
				absoluteWorseningScreen,
				numericalAllowanceW,
				direct: oracle.total,
				samplingResolved: oracle.samplingResolved,
				matrix: high,
				matrixCoarse: low,
				p1ControlParityW: high[12] - first.refinedW,
				p1ControlParityAllowanceW: parityAllowance,
				p1RawErrorW: high[12] - oracle.cpu[1],
				p1JointErrorW: high[7] - oracle.cpu[1],
				higherApproximationW: total.refinedW - first.refinedW - (oracle.total.mean - oracle.cpu[1]),
				pairInteractionsW: {
					densityPhase: high[3] - high[1] - high[2] + high[0],
					densityColumn: high[5] - high[1] - high[4] + high[0],
					phaseColumn: high[6] - high[2] - high[4] + high[0],
				},
				tripleInteractionW: high[7] - high[3] - high[5] - high[6] + high[1] + high[2] + high[4] - high[0],
				numericalComparison: compareErrors(
					total.rawW,
					hybridW,
					oracle.total.mean,
					oracle.total.halfWidth95,
					numericalAllowanceW,
				),
				libComparison: compareErrors(total.rawW, hybridW, target, 0, numericalAllowanceW),
				qualification:
					'Final-view/P1 correction with frozen incremental remainder, not regenerated corrected N4.',
			});
		}
	}
	const low454 = nativeRows.find((r) => r.probeId === 'p-1330-0-4' && r.channel === 8),
		upper454 = nativeRows.find((r) => r.probeId === 'p-1330-5-4' && r.channel === 8);
	assert.ok(Math.max(...low454.fractionScreen) < 0.25);
	assert.ok(Math.min(...upper454.absoluteWorseningScreen) > 0.0005);
	const flatRows = flat.rows.map((row) => {
		const maxRelativeError = Math.max(...row.signedErrors.map((v, c) => Math.abs(v) / row.reference[c]));
		const rawMaximumRelativeError = Math.max(
			...row.raw.map((v, c) => Math.abs(v - row.reference[c]) / row.reference[c]),
		);
		assert.ok(row.passed && maxRelativeError < 0.001);
		return {
			...row,
			maxRelativeError,
			rawMaximumRelativeError,
			redBlueShift: row.correctedColor.redBlueRatio - row.rawColor.redBlueRatio,
		};
	});
	const flat3 = flatRows.find((r) => r.elevationDegrees === 3),
		flat20 = flatRows.find((r) => r.elevationDegrees === 20);
	assert.ok(Math.abs(flat3.correctedColor.redBlueRatio - 0.9892) < 0.0001 && flat20.correctedColor.redBlueRatio < 1);
	/** @type {HypothesisDecisionRecord[]} */ const decisions = [
		{
			hypothesis: 'A',
			decision: 'supported within tested boundary',
			boundary: 'Phase-only P1 at six registered spherical scalars.',
			finding:
				'The adapter phase raises P1 by 3.66–5.26 percent. At 454 nm it supplies 57–63 percent of the retained near-Sun gap in a frozen-higher size comparison.',
			remaining:
				'All-order phase propagation, exact retained libRadtran execution deck/settings and convergence remain unqualified.',
		},
		{
			hypothesis: 'B',
			decision: 'unresolved',
			boundary: 'Raw H N4/N6 replay and shared-prefix qualification completed.',
			finding:
				'Raw replay agrees to rounding. N5/N6 increments are larger at 360 nm, but their effect on total numerical error and retained libRadtran agreement differs by ray/band.',
			remaining:
				'The full jointly corrected reconstruction-by-order cells remain unavailable; existing density-only/frozen-P1 drivers do not qualify that factorial.',
		},
		{
			hypothesis: 'C',
			decision: 'challenged',
			boundary: 'Exact Native48 replay, final-view contrast and full fixed-S20 P1 factorial.',
			finding:
				'Tested view/P1 corrections reduce low454 absolute approximation error by 19.08 percent, below 25 percent, and worsen upper454 by 1.157 mW, above 0.5 mW. Higher approximation remains dominant.',
			remaining:
				'This challenges the tested P1/view explanation. Consistent joint correction through later N4 fields is not measured and the broader higher-order mechanism remains open.',
		},
		{
			hypothesis: 'D',
			decision: 'supported within tested boundary',
			boundary:
				'Matched actual-topology CPU N1 cache and corrected geometry-specific column payload at all three Flat rays.',
			finding:
				'All 45 corrected scalars match the continuous same-quadrature reference within the registered screen; 3-degree R/B changes .990809 to .989226 and stays neutral. Upper control stays blue.',
			remaining:
				'The machine-level equality is an algebraic N1/flat-column check at shared quadrature, not independent physical validation or GPU/production qualification.',
		},
	];
	const names = [
		'00257-h10-finish',
		'00258-h11-orders-r2',
		'00259-h11-orders-r2',
		'00260-h12-native48-r2',
		'00261-h13-flat-r2',
	];
	const stages = names.map((name) => {
		const seal = verifyRun('tmp/experiments/sky-accuracy-dials/runs/' + name);
		parents.push(seal);
		const value = JSON.parse(readRepository(seal.path, seal).toString());
		return {
			run: name,
			state: value.state,
			result: value.result,
			retainedBytes: seal.byteLength + value.artifacts.reduce((sum, a) => sum + a.byteLength, 0),
			cleanup: value.cleanup,
		};
	});
	const run = createRun('h14-finish', {
		parents,
		operation:
			'Finish H10–H14 from authenticated phase/order/factorial/Flat evidence; shared-reference uncertainty and explicit unsupported recurrence boundaries. No new transport integration.',
		parameters: {maximumMilliseconds: 120000, maximumBytes: 2 * 1024 ** 2},
	});
	try {
		const decisionsLog = [
			...originalQuestions.questionDecisions,
			{
				question: 'Why stop on setup failures?',
				decision:
					'That was an agent-authored overbroad retry rule. The owner instructed completion; repair failures and continue within compute/storage caps.',
				reason: 'Pre-computation harness faults do not answer a scientific hypothesis.',
			},
			{
				question: 'How to repair the H11 post-processing fault?',
				decision:
					'Use the reference API’s one-based order argument; preserve sparse GPU outputs before reader evaluation.',
				reason: 'Completed GPU work must remain reusable if a reader fails.',
			},
			{
				question: 'Can P1/view results be called full corrected recurrence?',
				decision: 'No. Report C’s tested explanation as challenged and B’s complete interaction as unresolved.',
				reason: 'No qualified producer propagates all density/phase/column corrections through later fields at these fixed contracts.',
			},
			{
				question: 'Does exact Flat agreement establish physical correctness?',
				decision: 'No. It qualifies the geometry-specific N1 cache algebra and numerical reconstruction only.',
				reason: 'The reference and diagnostic share fixed physical assumptions and final quadrature.',
			},
			{
				question: 'Did every retention suballocation pass?',
				decision:
					'No: H11 retained 6,942,153 bytes including its reader failure; its accepted run alone was 4,382,846 bytes, slightly over the 4 MiB nominal target. Report the deviation and preserve evidence; compact later provenance.',
				reason: 'Repeated request data in default artifact derivations enlarged the immutable seal. The overall 16 MiB package and experiment-wide limits remain enforced.',
			},
		];
		const elapsed = stages.reduce((sum, s) => sum + s.result.elapsedMilliseconds, 0);
		const result = {
			decisions,
			phaseRows,
			orderRows,
			nativeRows,
			flatRows,
			stages,
			questionDecisions: decisionsLog,
			resources: {
				before,
				executionMillisecondsBeforeFinalReport: elapsed,
				gpuAttemptsStarted: 3,
				completedGpuStages: 2,
				liveScratchBytes: before.scratchBytes,
				scope: 'Includes the repaired reader failure; prior 00252–00256 remain retained. H11 per-stage retention target exceeded, aggregate package remains below 16 MiB.',
			},
			nextTests: [
				'Qualify a phase-consistent later-order reconstruction before a complete corrected-by-order factorial.',
				'Recover and converge an exact matched libRadtran input deck before treating retained agreement as a pure numerical-correctness metric.',
			],
			completion:
				'Bounded scientific sequence executed to its stated available/unsupported boundaries; unresolved cells are explicit, not setup blockers.',
		};
		run.write('assessment.json', result);
		/** Escape plain evidence labels for the offline HTML table. @param {string} value @returns {string} */
		const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
		const html =
			'<!doctype html><meta charset="utf-8"><title>Completed bounded hypothesis tests</title><style>body{font:16px system-ui;max-width:1250px;margin:30px auto;padding:0 20px;color:#222}table{border-collapse:collapse;width:100%;margin-bottom:24px}td,th{border:1px solid #aaa;padding:9px;text-align:left;vertical-align:top}h1{font-size:27px}small{color:#555}</style><h1>H10–H14 bounded hypothesis tests</h1><p>Phase P1 effect measured; raw order replay qualified; Native48 P1/view explanation challenged; Flat N1 neutrality reproduced.</p><table><tr><th>Hypothesis</th><th>Decision</th><th>Evidence</th><th>Limit</th></tr>' +
			decisions
				.map(
					(d) =>
						'<tr><td>' +
						d.hypothesis +
						'</td><td>' +
						d.decision +
						'</td><td>' +
						escape(d.finding) +
						'</td><td>' +
						escape(d.remaining) +
						'</td></tr>',
				)
				.join('') +
			'</table><h2>Native48 signed approximation error</h2><small>Spectral mW; lower absolute value is better. Joint P1 column is a frozen-remainder diagnostic.</small><table><tr><th>Ray</th><th>Channel</th><th>Raw</th><th>Joint P1/view</th><th>Higher remainder approximation</th></tr>' +
			nativeRows
				.map(
					(r) =>
						'<tr><td>' +
						r.probeId +
						'</td><td>' +
						r.channel +
						'</td><td>' +
						(1000 * r.beforeErrorW).toFixed(4) +
						'</td><td>' +
						(1000 * r.afterErrorW).toFixed(4) +
						'</td><td>' +
						(1000 * r.higherApproximationW).toFixed(4) +
						'</td></tr>',
				)
				.join('') +
			'</table><h2>Flat linear R/B</h2><table><tr><th>Elevation</th><th>Current cache</th><th>Corrected N1 cache</th><th>Continuous reference</th></tr>' +
			flatRows
				.map(
					(r) =>
						'<tr><td>' +
						r.elevationDegrees +
						'°</td><td>' +
						r.rawColor.redBlueRatio.toFixed(6) +
						'</td><td>' +
						r.correctedColor.redBlueRatio.toFixed(6) +
						'</td><td>' +
						r.referenceColor.redBlueRatio.toFixed(6) +
						'</td></tr>',
				)
				.join('') +
			'</table><p>Exact spectra, all 13 P1 modes, interactions, shared-reference error intervals, species, provenance, decisions and resource exceptions are retained in assessment.json.</p>';
		run.write('assessment.html', html);
		assert.ok(Date.now() - started < 110000 && elapsed + Date.now() - started < 1140000);
		const seal = run.finish('accepted', {
			stage: 'H14',
			elapsedMilliseconds: Date.now() - started,
			executionMillisecondsThroughPreSeal: elapsed + Date.now() - started,
			scope: 'Completed bounded assessment; missing full corrected recurrence and external-reference qualification remain explicit.',
		});
		const after = storage();
		assert.ok(after.retainedBytes - 407051357 < 16 * 1024 ** 2 && after.retainedBytes - 411819865 < 12 * 1024 ** 2);
		console.log(
			JSON.stringify({
				seal,
				verified: verifyRun(run.path),
				storage: after,
				executionMilliseconds: elapsed + Date.now() - started,
			}),
		);
	} catch (error) {
		run.write('failure.json', {message: String(error)});
		console.log(
			JSON.stringify({
				seal: run.finish('failed', {message: String(error), elapsedMilliseconds: Date.now() - started}),
			}),
		);
		process.exitCode = 1;
	}
}
