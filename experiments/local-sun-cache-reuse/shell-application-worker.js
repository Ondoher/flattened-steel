import {runShellApplication} from './rotation-browser.js';
import {partitionedShellIncoming} from './shell-angular.js';

const scope=/** @type {LocalSunShellApplicationWorkerScope} */(/** @type {unknown} */(globalThis));
const bridge=/** @type {LocalSunRotationBridge} */(/** @type {unknown} */(globalThis));
/** @type {Map<number,{resolve:()=>void,reject:(error:Error)=>void}>} */ const pending=new Map();
let sequence=0,started=false;

bridge.localSunRotationArtifact=(name,payload)=>new Promise((resolve,reject)=>{
	const id=++sequence;pending.set(id,{resolve:()=>resolve(undefined),reject});scope.postMessage({kind:'artifact',id,name,payload});
});

/** Execute exactly one transferred-canvas proof and retain artifact ownership until host acknowledgement.
 * @param {MessageEvent<LocalSunShellApplicationWire>} event - Trusted checked host protocol.
 * @returns {Promise<void>} - Terminal result after GPU retirement, or explicit failure.
 */
async function receive(event) {
	const message=event.data;
	if(message.kind==='ack') {
		const waiting=pending.get(message.id);if(!waiting)throw new Error('Unknown application artifact acknowledgement.');
		pending.delete(message.id);if(message.payload)waiting.reject(new Error(message.payload));else waiting.resolve();return;
	}
	try {
		if(started || message.kind!=='execute' || !(message.canvas instanceof OffscreenCanvas) || !message.recipe?.shellApplication)throw new Error('One transferred application canvas and exact recipe required.');
		started=true;
		const recipe={...message.recipe,shellIncoming:partitionedShellIncoming(48,.5),shellRuntime:true,candidate:/** @type {LocalSunCorrectionCandidate} */('precision'),motion:false};
		const result=await runShellApplication(recipe,message.canvas);
		if(pending.size)throw new Error('Application artifacts remain unacknowledged.');
		scope.postMessage({kind:'complete',payload:result});
	} catch(error){scope.postMessage({kind:'failed',payload:error instanceof Error ? error.stack ?? error.message : String(error)});}
}
scope.onmessage=receive;
