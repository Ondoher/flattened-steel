import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runSecondOrderRefinement} from '../second-order-refine/run.mjs';
import {runSecondOrderAssessment} from '../second-order-analysis/run.mjs';
import {runSecondOrderAngularRefinement} from '../second-order-angular-refine/run.mjs';
import {runSecondOrderAngularReport} from '../second-order-angular-report/run.mjs';

const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
const C0 = 'tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration';

/** Execute the independently registered noon reference after adequate morning admission.
 * Each child owns independent resource admission and a new immutable seal.
 * Complete captures and passed prospective reference gates remain distinct.
 * @param {string} admissionRun - Accepted adequate original morning reference.
 * @param {string} [existingGauss4Run] - Existing coarse transfer, authenticated by each consuming child.
 * @returns {Promise<void>} Exact per-child results and explicit unresolved stop.
 */
export async function runSecondOrderTransferSequence(admissionRun, existingGauss4Run) {
	/** @param {SkySecondOrderRefinementStage} stage @param {readonly string[]} parents @returns {Promise<string>} */
	async function outer(stage, parents) {
		const result = await runSecondOrderRefinement(
			C0,
			topic + '/attribution-plan.md',
			topic + '/second-order-refinement-plan.md',
			stage,
			parents,
			admissionRun,
		);
		console.log(JSON.stringify({stage: 'transfer-' + stage, ...result}));
		assert.ok(
			result.matrixComplete && result.predictionsPassed,
			'Transfer outer physical admission needs bounded redirection.',
		);
		return result.run;
	}
	const gauss4 = existingGauss4Run ?? (await outer('gauss4', []));
	const simpson4 = await outer('simpson4', [gauss4]);
	const low = await outer('gauss8-low', [gauss4]);
	const gauss8 = await outer('gauss8-high', [low]);
	const simpson8 = await outer('simpson8', [simpson4]);
	const assessment = await runSecondOrderAssessment(C0, [gauss4, simpson4, gauss8, simpson8], admissionRun);
	console.log(JSON.stringify({stage: 'transfer-outer-assessment', ...assessment}));
	assert.ok(
		assessment.failed === 0 && assessment.unresolved === 0,
		'Transfer outer prediction requires a bounded diagnostic.',
	);
	const angularLow = await runSecondOrderAngularRefinement(
		C0,
		topic + '/attribution-plan.md',
		topic + '/second-order-angular-plan.md',
		'low',
		gauss8,
		undefined,
		admissionRun,
	);
	console.log(JSON.stringify({stage: 'transfer-az64-low', ...angularLow}));
	assert.ok(angularLow.matrixComplete && angularLow.predictionsPassed, 'Transfer lower angular admission failed.');
	const angular = await runSecondOrderAngularRefinement(
		C0,
		topic + '/attribution-plan.md',
		topic + '/second-order-angular-plan.md',
		'high',
		gauss8,
		angularLow.run,
		admissionRun,
	);
	console.log(JSON.stringify({stage: 'transfer-az64-high', ...angular}));
	assert.ok(angular.matrixComplete && angular.predictionsPassed, 'Transfer complete angular admission failed.');
	const report = await runSecondOrderAngularReport(
		C0,
		{gauss4, simpson4, gauss8, simpson8, angular: angular.run},
		admissionRun,
	);
	console.log(JSON.stringify({stage: 'transfer-component-assessment', ...report}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.ok(process.argv.length === 3 || process.argv.length === 4);
	await runSecondOrderTransferSequence(process.argv[2], process.argv[3]);
}
