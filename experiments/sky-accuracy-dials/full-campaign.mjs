import {executeCase} from './execution.mjs';
import {
	assessPrediction,
	compareRuns,
	factorialRun,
	lockAdditive,
	lockConstructionRefinement,
	lockViewRefinement,
	scoreRun,
} from './campaign.mjs';

/** Execute the predeclared full-boundary ladders serially, sealing each target prediction first.
 * The fourteen conditions outside the development screen are selected by the prediction functions.
 * Each underlying operation owns its immutable progress and terminal record; any execution failure stops the campaign.
 * A rejected scientific prediction is retained and does not suppress later independent experiments.
 * @param {string} floorRun - Earlier accepted implementation/repeatability floor.
 * @returns {Promise<DialFullCampaignResult>} - Exact source and assessment run identities.
 */
export async function runFullCampaign(floorRun) {
	const baseline = (await executeCase('baseline', 'full')).run;
	scoreRun(baseline);
	const source40 = (await executeCase('s40', 'full')).run;
	const transport80 = (await executeCase('t80', 'full')).run;
	const sourcePrediction = lockConstructionRefinement(baseline, source40, 's80', floorRun);
	const transportPrediction = lockConstructionRefinement(baseline, transport80, 't160', floorRun);
	const source80 = (await executeCase('s80', 'full', [30], ['monotone-cubic'], sourcePrediction)).run;
	const sourceCheck = assessPrediction(sourcePrediction, source80);
	const transport160 = (await executeCase('t160', 'full', [30], ['monotone-cubic'], transportPrediction)).run;
	const transportCheck = assessPrediction(transportPrediction, transport160);
	const combinedPrediction = lockAdditive(baseline, source80, transport160, 's80-t160', floorRun);
	const combined = (await executeCase('s80-t160', 'full', [30], ['monotone-cubic'], combinedPrediction)).run;
	const combinedCheck = assessPrediction(combinedPrediction, combined);
	factorialRun(baseline, source80, transport160, combined, floorRun);
	for (const run of [source40, source80, transport80, transport160, combined]) {
		scoreRun(run);
		compareRuns(baseline, run);
	}
	const segmentedLower = (await executeCase('segmented', 'full', [2, 4])).run;
	const segmentedPrediction = lockViewRefinement(segmentedLower, floorRun);
	const segmentedFine = (await executeCase('segmented', 'full', [8], ['monotone-cubic'], segmentedPrediction)).run;
	const segmentedCheck = assessPrediction(segmentedPrediction, segmentedFine);
	scoreRun(segmentedLower);
	scoreRun(segmentedFine);
	compareRuns(baseline, segmentedFine, 'cumulative', 8);
	return {
		baseline,
		source40,
		source80,
		transport80,
		transport160,
		combined,
		segmentedLower,
		segmentedFine,
		predictionChecks: [sourceCheck, transportCheck, combinedCheck, segmentedCheck],
	};
}
