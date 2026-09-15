import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runSecondOrderRefinement} from '../second-order-refine/run.mjs';
import {runSecondOrderAssessment} from '../second-order-analysis/run.mjs';
import {runSecondOrderAngularRefinement} from '../second-order-angular-refine/run.mjs';
import {runSecondOrderAngularReport} from './run.mjs';

const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
const root = 'tmp/experiments/sky-accuracy-dials/runs';

/** Execute the already registered remaining morning stages serially and stop on an unresolved gate.
 * Every scientific operation independently authenticates, admits and seals its
 * own run. This wrapper owns no separate evidence and never edits sources.
 * @param {string} lowRun - Accepted registered Gaussian8 lower-half parent.
 * @returns {Promise<void>} Emits exact child outcomes; failures need a bounded redirection.
 */
export async function continueSecondOrderSequence(lowRun) {
	const c0 = `${root}/00099-c0-registration`,
		g4 = `${root}/00164-p2-view-coarse`,
		s4 = `${root}/00165-p2-simpson4`;
	const g8 = await runSecondOrderRefinement(
		c0,
		`${topic}/attribution-plan.md`,
		`${topic}/second-order-refinement-plan.md`,
		'gauss8-high',
		[lowRun],
	);
	console.log(JSON.stringify({stage: 'gauss8-high', ...g8}));
	assert.ok(g8.matrixComplete && g8.predictionsPassed, 'Complete Gaussian8 physical admission failed.');
	const s8 = await runSecondOrderRefinement(
		c0,
		`${topic}/attribution-plan.md`,
		`${topic}/second-order-refinement-plan.md`,
		'simpson8',
		[s4],
	);
	console.log(JSON.stringify({stage: 'simpson8', ...s8}));
	assert.ok(s8.matrixComplete && s8.predictionsPassed, 'Complete Simpson8 physical admission failed.');
	const outer = await runSecondOrderAssessment(c0, [g4, s4, g8.run, s8.run]);
	console.log(JSON.stringify({stage: 'outer-assessment', ...outer}));
	assert.ok(outer.failed === 0 && outer.unresolved === 0, 'Outer prediction needs a bounded diagnostic redirection.');
	const low = await runSecondOrderAngularRefinement(
		c0,
		`${topic}/attribution-plan.md`,
		`${topic}/second-order-angular-plan.md`,
		'low',
		g8.run,
	);
	console.log(JSON.stringify({stage: 'azimuth64-low', ...low}));
	assert.ok(low.matrixComplete && low.predictionsPassed, 'Lower angular physical admission failed.');
	const high = await runSecondOrderAngularRefinement(
		c0,
		`${topic}/attribution-plan.md`,
		`${topic}/second-order-angular-plan.md`,
		'high',
		g8.run,
		low.run,
	);
	console.log(JSON.stringify({stage: 'azimuth64-high', ...high}));
	assert.ok(high.matrixComplete && high.predictionsPassed, 'Complete angular physical admission failed.');
	const report = await runSecondOrderAngularReport(c0, {
		gauss4: g4,
		simpson4: s4,
		gauss8: g8.run,
		simpson8: s8.run,
		angular: high.run,
	});
	console.log(JSON.stringify({stage: 'component-assessment', ...report}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3);
	await continueSecondOrderSequence(process.argv[2]);
}
