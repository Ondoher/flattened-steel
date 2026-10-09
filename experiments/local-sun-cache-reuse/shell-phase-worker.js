import {shellMiePhaseValues} from './shell-scatter.js';
import {identifyShellPhase} from './shell-phase-hash.js';

const scope=/** @type {LocalSunShellPhaseWorkerScope} */(/** @type {unknown} */(globalThis));

/** Accept one trusted host request, transfer one owned numeric payload, then await termination.
 * @param {MessageEvent<LocalSunShellPhaseRequest>} event - Structured direction inventory.
 * @returns {Promise<void>} - Phase bytes or an explicit failure reply after canonical hashing.
 */
async function prepare(event) {
	try {
		const data=await identifyShellPhase(shellMiePhaseValues(event.data));
		scope.postMessage({ok:true,data},[/** @type {Float32Array} */(data.values).buffer]);
	} catch(error) {
		scope.postMessage({ok:false,error:error instanceof Error ? error.message : String(error)},[]);
	}
}
scope.onmessage=prepare;
