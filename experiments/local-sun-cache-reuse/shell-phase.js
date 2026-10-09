/** Prepare invariant phase values off the UI thread, with cancellation and single ownership.
 * @param {LocalSunConstructionDomainSelection} domains - Selected unit directions.
 * @param {string} url - Same-origin, provenance-pinned worker bundle.
 * @param {AbortSignal} [signal] - Optional preparation cancellation.
 * @returns {Promise<CacheData>} - Transferred scalar payload with its worker-derived canonical identity.
 */
export async function prepareShellMiePhase(domains,url,signal) {
	if(signal?.aborted)throw new DOMException('Phase preparation cancelled.','AbortError');
	const worker=new Worker(url);
	/** @type {LocalSunShellPhaseRequest} */
	const request={id:domains.incomingDirectionDomain.id+'-w27-mie-phase-v1',incoming:domains.incomingUnitVectors,outgoing:domains.outgoingUnitVectors};
	return new Promise((resolve,reject)=>{
		let settled=false;
		/** End this worker exactly once and detach its cancellation listener.
		 * @returns {boolean} - Whether this invocation acquired the settlement.
		 */
		function close() {if(settled)return false;settled=true;signal?.removeEventListener('abort',abort);worker.terminate();return true;}
		/** Cancel the owned preparation without publishing partial data.
		 * @returns {void} - Rejected preparation after worker termination.
		 */
		function abort() {if(close())reject(new DOMException('Phase preparation cancelled.','AbortError'));}
		worker.onerror=event=>{if(close())reject(new Error(event.message || 'Phase worker failed.'));};
		worker.onmessageerror=()=>{if(close())reject(new Error('Phase worker message could not be decoded.'));};
		worker.onmessage=/** @param {MessageEvent<LocalSunShellPhaseReply>} event - Owned worker result. */ event=>{
			if(!close())return;
			const reply=event.data;
			if(reply.ok!==true){reject(new Error(reply.error));return;}
			const data=reply.data;
			if(data.id!==request.id || data.quantity!=='phase-function' || data.units!=='sr^-1' || data.shape.length!==2 ||
				data.shape[0]!==request.incoming.length || data.shape[1]!==request.outgoing.length || !(data.values instanceof Float32Array) ||
				data.values.length!==request.incoming.length*request.outgoing.length || !/^sha256:[a-f0-9]{64}$/u.test(data.contentHash)) {
				reject(new Error('Phase worker result does not match the requested matrix.'));return;
			}
			resolve(data);
		};
		signal?.addEventListener('abort',abort,{once:true});
		if(signal?.aborted){abort();return;}
		try {worker.postMessage(request);} catch(error){if(close())reject(error);}
	});
}
