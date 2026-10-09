/** Own serialized exact-state publication and shared cache leases in the experimental app.
 * Construction identity and conservative byte estimates come from the qualified
 * caller; this coordinator does not declare numerical or device-memory admission.
 * @implements {LocalSunShellFramePublicationContract}
 */
export class ShellFramePublication {
	/** Frozen combined logical payload limit, bytes. @type {number} */ maximumBytes;
	/** Complete resources still leased by frames. @type {Map<string,LocalSunShellSharedResource>} */ resources=new Map();
	/** Latest complete frame; staging never alters it. @type {LocalSunShellFrameRecord|null} */ current=null;
	/** Completion tail serializes cache preparation. @type {Promise<void>} */ tail=Promise.resolve();
	/** Latest preparation cancellation owner. @type {AbortController|null} */ cancellation=null;
	/** Supersession generation. @type {number} */ generation=0;
	/** Terminal owner state. @type {boolean} */ disposed=false;
	/** Cleanup failures remain observable after a successful atomic publication. @type {string[]} */ cleanupErrors=[];
	/** Largest conservatively admitted logical payload, not device telemetry. @type {number} */ peakAdmittedBytes=0;

	/** Create one application publication owner.
	 * @param {number} maximumBytes - Frozen positive logical active/staging payload ceiling.
	 */
	constructor(maximumBytes) {
		if(!Number.isSafeInteger(maximumBytes) || maximumBytes<=0)throw new Error('Positive logical resource ceiling required.');
		this.maximumBytes=maximumBytes;
	}

	/** Return the current frame borrowed until the next publication; async consumers acquire a lease.
	 * @returns {LocalSunShellPublishedFrame|null} - Complete visible state, never staging.
	 */
	get active(){return this.current?.frame ?? null;}

	/** Keep the complete current frame alive across an asynchronous renderer operation.
	 * @returns {LocalSunShellFrameLease} - Idempotent release retains other consumers.
	 */
	acquireFrame() {
		if(this.disposed || !this.current)throw new Error('No live shell frame.');
		const record=this.current;record.leases++;
		let released=false;
		return {frame:record.frame,release:()=>{if(released)return;released=true;this.releaseFrame(record);}};
	}

	/** Retire a frame only after publication ownership and all renderer leases end.
	 * @param {LocalSunShellFrameRecord} record - Owned exact frame.
	 * @returns {void} - Cleanup failures are recorded without changing publication outcome.
	 */
	releaseFrame(record) {
		if(record.disposed || --record.leases!==0)return;
		record.disposed=true;
		try {record.frame.dispose();}catch(error){this.cleanupErrors.push(String(error));}
		for(const borrowed of record.borrowed)try {borrowed.dispose();}catch(error){this.cleanupErrors.push(String(error));}
	}

	/** Release one shared cache owner after its last borrowed-controller lease ends.
	 * @param {LocalSunShellSharedResource} resource - Owned complete or staging resource.
	 * @returns {void} - Resource cleanup never retires another live cache owner.
	 */
	releaseResource(resource) {
		if(resource.disposed || --resource.leases!==0)return;
		resource.disposed=true;this.resources.delete(resource.identity);
		try {resource.controller.dispose();}catch(error){this.cleanupErrors.push(String(error));}
	}

	/** Prepare then publish a complete compatible frame, preserving the previous state on failure.
	 * @param {LocalSunShellFrameRequest} request - Complete identity, conservative admission and owned preparation.
	 * @returns {Promise<LocalSunShellPublishedFrame>} - Published state; stale requests reject with AbortError.
	 */
	request(request) {
		if(this.disposed)return Promise.reject(new Error('Shell publication owner is disposed.'));
		if(!request.identity || !request.cacheIdentity || [request.retainedCacheBytes,request.peakBuildBytes,request.otherPersistentBytes].some(value=>!Number.isSafeInteger(value) || value<0) || request.retainedCacheBytes===0 || request.peakBuildBytes<request.retainedCacheBytes)return Promise.reject(new Error('Complete frame identity and conservative resource bounds required.'));
		if(request.signal?.aborted)return Promise.reject(request.signal.reason ?? new DOMException('Cancelled shell frame.','AbortError'));
		this.cancellation?.abort();
		const cancellation=new AbortController(),generation=++this.generation;
		this.cancellation=cancellation;
		const fromCaller=()=>cancellation.abort(request.signal?.reason);
		request.signal?.addEventListener('abort',fromCaller,{once:true});
		const operation=this.tail.then(async()=>{
			cancellation.signal.throwIfAborted();
			const existing=this.resources.get(request.cacheIdentity);
			if(existing && existing.retainedBytes!==request.retainedCacheBytes)throw new Error('Same cache identity changed its retention contract.');
			const retained=[...this.resources.values()].reduce((sum,value)=>sum+value.retainedBytes,0);
			const admitted=retained+(existing ? 0 : request.peakBuildBytes)+request.otherPersistentBytes;
			if(admitted>this.maximumBytes)throw new Error('Shell active/staging logical resource admission failed.');
			this.peakAdmittedBytes=Math.max(this.peakAdmittedBytes,admitted);
			/** @type {CacheController[]} */ const borrowed=[];
			/** @type {LocalSunShellPublishedFrame|null} */ let prepared=null;
			try {
				prepared=await request.prepare({signal:cancellation.signal,borrowController:factory=>{
					cancellation.signal.throwIfAborted();
					let resource=this.resources.get(request.cacheIdentity);
					if(!resource) {
						resource={identity:request.cacheIdentity,controller:factory(),cache:null,pending:null,leases:0,retainedBytes:request.retainedCacheBytes,disposed:false};
						this.resources.set(resource.identity,resource);
					}
					resource.leases++;
					const owned=resource;
					let released=false;
					/** @type {LocalSunShellOwnedCacheController} */ const lease={
						backend:owned.controller.backend,
						get active(){return released ? null : owned.cache;},
						createScatteringCache:async build=>{
							if(released || owned.disposed)throw new Error('Shell cache lease is disposed.');
							cancellation.signal.throwIfAborted();build.signal?.throwIfAborted();
							const fromBuild=()=>cancellation.abort(build.signal?.reason);
							build.signal?.addEventListener('abort',fromBuild,{once:true});
							try {
								if(!owned.pending)owned.pending=owned.controller.createScatteringCache({...build,signal:cancellation.signal}).then(cache=>{owned.cache=cache;return cache;});
								const cache=await owned.pending;
								cancellation.signal.throwIfAborted();build.signal?.throwIfAborted();
								if(released || owned.disposed)throw new Error('Shell cache lease retired during construction.');
								return cache;
							} finally {build.signal?.removeEventListener('abort',fromBuild);}
						},
						dispose:()=>{if(released)return;released=true;this.releaseResource(owned);},
					};
					borrowed.push(lease);return lease;
				}});
				cancellation.signal.throwIfAborted();
				if(this.disposed || generation!==this.generation)throw new DOMException('Superseded shell frame.','AbortError');
				if(prepared.identity!==request.identity || prepared.cacheIdentity!==request.cacheIdentity || !borrowed.length || borrowed.some(controller=>!controller.active))throw new Error('Prepared shell frame has incomplete identity or fields.');
				const next={frame:prepared,leases:1,borrowed,disposed:false},previous=this.current;
				this.current=next;prepared=null;
				if(previous)this.releaseFrame(previous);
				return next.frame;
			} catch(error) {
				if(prepared)try {prepared.dispose();}catch(cleanup){this.cleanupErrors.push(String(cleanup));}
				for(const lease of borrowed)lease.dispose();
				throw error;
			}
		});
		this.tail=operation.then(()=>{},()=>{});
		return operation.finally(()=>{request.signal?.removeEventListener('abort',fromCaller);if(this.cancellation===cancellation)this.cancellation=null;});
	}

	/** Stop staging and release publication ownership; leased renderer snapshots remain valid.
	 * @returns {void} - In-flight operations reject and perform their own cleanup.
	 */
	dispose() {
		if(this.disposed)return;
		this.disposed=true;this.generation++;this.cancellation?.abort();this.cancellation=null;
		const previous=this.current;this.current=null;if(previous)this.releaseFrame(previous);
	}
}

