import {runShellApplicationWorker} from './shell-application-host.js';

const bridge=/** @type {LocalSunRotationBridge} */(/** @type {unknown} */(globalThis));

/** Execute the real transferred-canvas application with separate page/worker scheduling evidence.
 * @param {LocalSunRotationRecipe} recipe - Exact checked host recipe and source identity.
 * @returns {Promise<string>} - Serialized proof with independent page responsiveness measurements.
 */
async function execute(recipe) {
	const measured=await runShellApplicationWorker(recipe,'/application-worker.js');
	return JSON.stringify({...JSON.parse(measured.result),pageResponsiveness:{maximumGapMilliseconds:measured.maximumResponsivenessGapMilliseconds,elapsedMilliseconds:measured.elapsedMilliseconds,
		claim:'Actual page event-loop pulse during the real transferred-canvas GPU app. Worker-side preparation gaps remain separately recorded; no offline recording or simulated responsiveness.'}});
}
bridge.localSunShellApplicationWorker=execute;
