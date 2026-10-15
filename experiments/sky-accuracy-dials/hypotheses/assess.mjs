import assert from 'node:assert/strict';
import {createRun, readRepository, storage, verifyRun} from '../io/files.mjs';
import {readParent, requireUnusedStage} from './common.mjs';

/** Close the allocated package honestly even when numerical stages fail before producing comparisons.
 * @returns {void}
 */
export function assessHypotheses() {
	requireUnusedStage('h14-hypotheses');
	const started = Date.now(),
		before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const admission = /** @type {HypothesisAdmission} */ (readParent('00252-h10-audit', 'admission.json', parents));
	const audit = /** @type {HypothesisAuditRead} */ (readParent('00252-h10-audit', 'audit.json', parents));
	const names = ['00252-h10-audit', '00253-h11-orders', '00254-h12-native48', '00255-h13-flat-cache'];
	const stages = names.map((name) => {
		const seal = verifyRun('tmp/experiments/sky-accuracy-dials/runs/' + name);
		parents.push(seal);
		const value = JSON.parse(readRepository(seal.path, seal).toString());
		return {
			run: name,
			state: value.state,
			result: value.result,
			bytes: seal.byteLength + value.artifacts.reduce((sum, a) => sum + a.byteLength, 0),
			cleanup: value.cleanup,
		};
	});
	assert.deepEqual(
		stages.map((s) => s.state),
		['accepted', 'failed', 'failed', 'failed'],
	);
	const decisions = [
		{
			hypothesis: 'A',
			decision: 'unresolved',
			tested: 'Pinned adapter phase/normalization audit; no P1 or all-order radiance intervention.',
			observation:
				'Forward-only 20-moment representation is 6.56–7.04 percent stronger at the three registered near-Sun cosines. Effective retained reference setup and radiance consequence remain unqualified.',
			missing:
				'Exact reference execution deck/settings and a matched radiance contrast; phase ratios are not radiance ratios.',
		},
		{
			hypothesis: 'B',
			decision: 'unresolved',
			tested: 'Recomputed retained H9 N4/N6 accounting; new stage failed before GPU.',
			observation:
				'Retained N5/N6 increments remain larger at 360 nm; A454 numerical higher-order error worsens. This is prior evidence, not confirmation after consistent correction.',
			missing: 'New raw replay/prefix qualification and the full corrected-reconstruction by order matrix.',
		},
		{
			hypothesis: 'C',
			decision: 'unresolved',
			tested: 'Prepared exact Native48 Q30 and S20/T40 witness recipes; new stage failed before GPU.',
			observation:
				'No new baseline replay, view comparison or P1 factorial. Retained +9.412 mW low454 approximation remains unattributed.',
			missing:
				'Passed Native48 replay, then the registered nested attribution. No H-profile delta was substituted.',
		},
		{
			hypothesis: 'D',
			decision: 'unresolved',
			tested: 'Implemented sparse actual-topology N1 control, independent species parity and geometry-specialized normalized-column payload; local off-witness proof only.',
			observation:
				'Scientific stage stopped on signed-zero source identity before any horizon integration. No new 3-degree spectrum or cache-convergence conclusion exists.',
			missing: 'New matched 0.05/3/20-degree comparison with spectral, species, convergence and hue gates.',
		},
	];
	const questionDecisions = [
		[
			'Output location',
			'Scientific evidence/scratch stays under the experiment output root; orchestration/reviews under .codex-tmp.',
			'Explicit experiment instructions override the generic skill scratch default.',
		],
		[
			'Reference moment normalization',
			'Trace pinned aerosol.c and ancillary.c; normalize moments by moment zero.',
			'Source shows the division explicitly; do not infer behavior from current defaults.',
		],
		[
			'Can the phase contrast prove radiance improvement?',
			'No; report represented-phase ratios and leave A unresolved.',
			'The plan requires a matched radiance intervention and retained execution qualification.',
		],
		[
			'Can an analytic P1 substitution complete B/C?',
			'No; full jointly corrected later-order cells remain missing.',
			'Later scattering consumes the affected representation.',
		],
		[
			'Native48 final view and geometry',
			'Use Q30 and the original alternate-ray physical directions, not H-profile corrections or the C0 subset.',
			'Native48 and H have different numerical and witness contracts.',
		],
		[
			'How to handle virtual bundle entries?',
			'Exclude the explicitly authored virtual entry from filesystem checks and retain its exact text as bundle derivation.',
			'A virtual module has no physical path; all real modules still require real-path checks.',
		],
		[
			'Chrome path rejection',
			'Normalize the installed absolute Windows path before strict path validation.',
			'Forward slashes and backslashes identify the same Windows file but the I/O owner requires normalized spelling.',
		],
		[
			'Flat source signed zero',
			'Use exact finite numeric coordinate equality, treating +0 and -0 as the same physical coordinate.',
			'Deep structural equality incorrectly treated JSON round-trip zero sign as a changed geometry.',
		],
		[
			'CPU or GPU for sparse Flat N1?',
			'Use a CPU sparse diagnostic payload and label GPU arithmetic unqualified.',
			'No full cache is needed to inspect N1 interpolation; this implementation choice must not become a GPU parity claim.',
		],
		[
			'What to do after the three failed stage allocations?',
			'Preserve failures, fix identified harness errors, finish H14, and do not retry automatically.',
			'The selected plan explicitly consumes each failed stage allocation and prohibits automatic retries.',
		],
		[
			'Can unused GPU/time allowance fund another test?',
			'No.',
			'Stage allocations cannot be transferred or extended to obtain a favorable result.',
		],
		[
			'Does the prior GPU count establish actual historical attempts?',
			'No: 194 in admission is a lexical GPU-related-run count, not an authenticated GPU-attempt total.',
			'H14 identifies this preflight limitation; no GPU actually started and prior closed authorizations remain untouched.',
		],
	].map(([question, decision, reason]) => ({question, decision, reason}));
	const run = createRun('h14-hypotheses', {
		parents,
		operation:
			'Join the new source audit, immutable failed-stage seals, retained order accounting and resource/decision limits; generate no new radiance integration or GPU work.',
		parameters: {maximumMilliseconds: 120000, maximumBytes: 2 * 1024 ** 2, allocation: admission},
	});
	try {
		const executionMilliseconds = stages.reduce((sum, s) => sum + s.result.elapsedMilliseconds, 0);
		const assessment = {
			decisions,
			questionDecisions,
			phaseRows: audit.phaseRows,
			forwardMass: audit.forwardMass,
			retainedOrderAccounting: audit.accounting,
			stages,
			resources: {
				before,
				executionMillisecondsBeforeH14: executionMilliseconds,
				gpuAttemptsStarted: 0,
				consumedNumericalStageAllocations: 3,
				missingPriorGpuAttemptQualification: true,
			},
			limitations: [
				'No new hypothesis has reached a radiance-based support/challenge decision.',
				'All five original direct-solver sampling-precision misses remain unchanged.',
				'Failed setup stages are implementation failures, not scientific falsifiers.',
				'Current source includes corrections after the recorded failures; those corrections have not been exercised in new scientific runs.',
				'H10 admission accepted the source audit but did not finish authenticating all reference/attempt-count prerequisites.',
			],
			nextBoundary:
				'A separately selected recovery package must freeze a qualified driver, corrected preflight and fresh single-attempt allocations. Preserve 00252–00256; do not reopen these runs.',
		};
		run.write('assessment.json', assessment);
		run.write(
			'assessment.html',
			'<!doctype html><meta charset="utf-8"><title>H10–H14 hypothesis decisions</title><style>body{font:16px system-ui;max-width:1100px;margin:32px auto;padding:0 20px;color:#222}table{border-collapse:collapse}td,th{border:1px solid #aaa;padding:10px;text-align:left;vertical-align:top}</style><h1>H10–H14: incomplete numerical tests</h1><p>A source-backed phase discrepancy was identified. All numerical comparisons remain unresolved after setup failures; no GPU job started.</p><table><tr><th>Hypothesis</th><th>Decision</th><th>Observed</th><th>Missing evidence</th></tr>' +
				decisions
					.map(
						(d) =>
							'<tr><td>' +
							d.hypothesis +
							'</td><td>' +
							d.decision +
							'</td><td>' +
							d.observation +
							'</td><td>' +
							d.missing +
							'</td></tr>',
					)
					.join('') +
				'</table><h2>Phase representation only</h2><table><tr><th>Ray</th><th>Adapter / analytic phase</th></tr>' +
				audit.phaseRows
					.map((r) => '<tr><td>' + r.ray + '</td><td>' + r.ratio.toFixed(6) + '</td></tr>')
					.join('') +
				'</table><p>These ratios do not measure radiance improvement. The JSON retains exact values, derivation, failures, decisions and resource accounting.</p>',
		);
		assert.ok(
			Date.now() - started < 110000 &&
				executionMilliseconds + Date.now() - started < admission.maximumMilliseconds,
		);
		assert.ok(storage().retainedBytes - before.retainedBytes < 2 * 1024 ** 2 - 200000);
		const seal = run.finish('accepted', {
			scope: 'H14 reporting completed; H11–H13 scientific comparisons failed before execution.',
			elapsedMilliseconds: Date.now() - started,
			totalExecutionMillisecondsThroughRetention: executionMilliseconds + Date.now() - started,
			gpuAttemptsStarted: 0,
		});
		console.log(
			JSON.stringify({
				seal,
				verified: verifyRun(run.path),
				storage: storage(),
				elapsedMilliseconds: Date.now() - started,
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
