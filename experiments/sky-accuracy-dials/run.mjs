import assert from 'node:assert/strict';
import {snapshotInputs} from './inputs.mjs';
import {executeCase} from './execution.mjs';
import {cases} from './cases.mjs';
import {summarizeCampaign} from './summary.mjs';
import {runFullCampaign} from './full-campaign.mjs';
import {retainRepresentationContrast} from './relationships.mjs';
import {retainResidualReport} from './residuals/run.mjs';
import {storage, verifyRun} from './io/files.mjs';
import {
	assessPrediction,
	calibrateFloor,
	compareRuns,
	densityRun,
	factorialRun,
	firstOrderInvariance,
	lockConstructionRefinement,
	lockAdditive,
	lockFirstOrder,
	lockViewRefinement,
	proofRun,
	representationFactorial,
	scoreRun,
} from './campaign.mjs';

const [command, first, second, third, fourth, fifth] = process.argv.slice(2);
try {
	if (command === 'inputs') console.log(snapshotInputs());
	else if (command === 'verify') console.log(JSON.stringify(verifyRun(first)));
	else if (command === 'storage') console.log(JSON.stringify(storage()));
	else if (command === 'proof') console.log(proofRun());
	else if (command === 'summary') console.log(JSON.stringify(await summarizeCampaign()));
	else if (command === 'full-campaign') console.log(JSON.stringify(await runFullCampaign(first)));
	else if (command === 'score') console.log(scoreRun(first));
	else if (command === 'floor') console.log(calibrateFloor(first, second));
	else if (command === 'predict-view') console.log(lockViewRefinement(first, second));
	else if (command === 'predict-j1') console.log(lockFirstOrder(first, second, third));
	else if (command === 'predict-count') console.log(lockConstructionRefinement(first, second, third, fourth));
	else if (command === 'predict-additive') console.log(lockAdditive(first, second, third, fourth, fifth));
	else if (command === 'density') console.log(densityRun(first));
	else if (command === 'assess') console.log(assessPrediction(first, second));
	else if (command === 'compare')
		console.log(
			compareRuns(
				first,
				second,
				/** @type {SkyRepresentation} */ (third ?? 'cumulative'),
				fourth ? Number(fourth) : 30,
			),
		);
	else if (command === 'factorial') console.log(factorialRun(first, second, third, fourth, fifth));
	else if (command === 'representation') console.log(representationFactorial(first, second, third));
	else if (command === 'representation-contrast') console.log(retainRepresentationContrast(first, second, third));
	else if (command === 'residuals') console.log(retainResidualReport(first, second));
	else if (command === 'j1-invariance') console.log(firstOrderInvariance(first, second));
	else if (command === 'run') {
		assert.ok(['screen', 'full', 'repeat'].includes(second));
		const selection = /** @type {DialExecutionSelection} */ (second);
		const views = third ? third.split(',').map(Number) : [30];
		await executeCase(first, selection, views, ['monotone-cubic'], fourth);
	} else if (command === 'solar') {
		await executeCase(first ?? 'baseline', 'screen', [30], ['monotone-cubic', 'linear']);
	} else {
		console.log(
			'Usage: node experiments/sky-accuracy-dials/run.mjs inputs | storage | verify <run> | proof | summary | full-campaign <floor> | score <run> | floor <baseline> <repeat> | predict-view <two-level-run> <floor> | predict-count <coarse> <medium> <target-case> <floor> | predict-j1 <control> <target-case> <floor> | predict-additive <control> <factorA> <factorB> <target-case> <floor> | assess <prediction> <candidate> | compare <control> <candidate> [representation] [view-count] | factorial <control> <factorA> <factorB> <combined> <floor> | representation <baseline> <altitude> <floor> | representation-contrast <baseline> <candidate> <floor> | residuals <baseline> <candidate> | j1-invariance <baseline> <candidate> | density <run> | run <case> <screen|full|repeat> [viewCounts] [predictionRun] | solar [case]',
		);
		console.log(`Cases: ${cases.map((item) => item.id).join(', ')}`);
		if (command) process.exitCode = 2;
	}
} catch (error) {
	console.error(error.stack ?? String(error));
	process.exitCode = 1;
}
