/** Prepare the real transferred-canvas app while measuring the independent page event loop.
 * @param {LocalSunRotationRecipe} recipe - Exact authenticated shell application controls.
 * @param {string} url - Same-origin provenance-pinned application worker bundle.
 * @returns {Promise<LocalSunShellApplicationHostMeasurement>} - Complete GPU proof and actual page responsiveness.
 */
export async function runShellApplicationWorker(recipe,url) {
	if(!recipe.shellApplication)throw new Error('Application worker requires a complete application recipe.');
	const canvas=document.createElement('canvas');canvas.width=720;canvas.height=414;document.body.append(canvas);
	const transferred=canvas.transferControlToOffscreen(),worker=new Worker(url);
	const bridge=/** @type {LocalSunRotationBridge} */(/** @type {unknown} */(globalThis));
	const started=performance.now();let lastPulse=started,maximumResponsivenessGapMilliseconds=0;
	const pulse=setInterval(()=>{const now=performance.now();maximumResponsivenessGapMilliseconds=Math.max(maximumResponsivenessGapMilliseconds,now-lastPulse);lastPulse=now;},8);
	try {
		const result=await new Promise((resolve,reject)=>{
			let settled=false;
			const fail=(/** @type {string} */ text)=>{if(!settled){settled=true;reject(new Error(text));}};
			worker.onerror=event=>fail(event.message || 'Owned application worker failed.');
			worker.onmessageerror=()=>fail('Application worker payload could not be decoded.');
			worker.onmessage=/** @param {MessageEvent<LocalSunShellApplicationWire>} event - Checked owned worker response. */ async event=>{
				const message=event.data;if(settled)return;
				if(message.kind==='artifact') {
					if(!Number.isSafeInteger(message.id) || typeof message.name!=='string' || typeof message.payload!=='string'){fail('Malformed application artifact envelope.');return;}
					try {await bridge.localSunRotationArtifact(message.name,message.payload);worker.postMessage({kind:'ack',id:message.id});}
					catch(error){worker.postMessage({kind:'ack',id:message.id,payload:String(error)});}return;
				}
				if(message.kind==='failed'){fail(message.payload || 'Owned application worker failed.');return;}
				if(message.kind!=='complete' || typeof message.payload!=='string'){fail('Malformed application terminal outcome.');return;}
				settled=true;resolve(message.payload);
			};
			worker.postMessage({kind:'execute',recipe,canvas:transferred},[transferred]);
		});
		maximumResponsivenessGapMilliseconds=Math.max(maximumResponsivenessGapMilliseconds,performance.now()-lastPulse);
		return {result,maximumResponsivenessGapMilliseconds,elapsedMilliseconds:performance.now()-started};
	} finally {clearInterval(pulse);worker.terminate();}
}
