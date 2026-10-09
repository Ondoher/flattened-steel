/** Observe public backend allocations and their disposal without inspecting opaque resources.
 * The inventory counts committed R32F field payload and immutable program data;
 * renderer bookkeeping, compiled driver code and host readback are separate.
 * @implements {LocalSunShellResourceProofContract}
 */
export class ShellResourceProof {
	/** Committed field payload, bytes. @type {number} */ fields=0;
	/** Pending or live program data payload, bytes. @type {number} */ data=0;
	/** Largest simultaneous backend payload, bytes. @type {number} */ peak=0;
	/** Complete allocation/release events. @type {LocalSunShellBackendResourceEvent[]} */ events=[];

	/** Record one public resource lifetime transition.
	 * @param {string} kind - Allocation or release category.
	 * @param {string} id - Actual resource identity.
	 * @param {number} bytes - Signed payload change, bytes.
	 * @returns {void} - Throws on an inconsistent inventory.
	 */
	record(kind,id,bytes) {
		if(!Number.isSafeInteger(bytes))throw new Error('Integral resource payload required.');
		if(kind.includes('field'))this.fields+=bytes;else this.data+=bytes;
		if(this.fields<0 || this.data<0)throw new Error('Negative resource inventory.');
		const total=this.fields+this.data;this.peak=Math.max(this.peak,total);
		this.events.push({kind,id,bytes,fields:this.fields,data:this.data,total});
	}

	/** Instrument one newly owned backend before construction begins.
	 * @param {CacheGpuBackend} backend - Owned backend; no production prototype is changed.
	 * @returns {void} - Existing resource ownership and disposal contracts are preserved.
	 */
	attach(backend) {
		const allocate=backend.allocateField.bind(backend),compile=backend.compile.bind(backend);
		backend.allocateField=spec=>{
			if(spec.storage.format!=='R32F')throw new Error('Shell resource proof requires scalar R32F.');
			const field=allocate(spec),bytes=spec.storage.width*spec.storage.height*spec.storage.layers*4,dispose=field.dispose.bind(field);
			this.record('allocate-field',spec.id,bytes);let released=false;
			field.dispose=()=>{if(released)return;dispose();released=true;this.record('release-field',spec.id,-bytes);};
			return field;
		};
		backend.compile=async shader=>{
			let bytes=0;
			for(const binding of shader.bindings)if(binding.spec.kind==='data') {
				const data=/** @type {CacheData} */(binding.value);
				if(!data || !Array.isArray(data.shape) || data.shape.some(value=>!Number.isSafeInteger(value) || value<=0) || data.values.length!==data.shape.reduce((product,value)=>product*value,1))throw new Error('Complete immutable program data required.');
				bytes+=data.values.length*4;
			}
			this.record('prepare-program-data',shader.id,bytes);
			try {
				const program=await compile(shader),dispose=program.dispose.bind(program);let released=false;
				program.dispose=()=>{if(released)return;dispose();released=true;this.record('release-program-data',shader.id,-bytes);};
				return program;
			} catch(error){this.record('failed-program-data',shader.id,-bytes);throw error;}
		};
	}

	/** Return detached evidence of the current complete inventory.
	 * @returns {LocalSunShellBackendResourceSnapshot} - Logical payload, never physical driver memory.
	 */
	snapshot() {
		return {fields:this.fields,data:this.data,peak:this.peak,events:this.events.map(value=>({...value})),claim:'Public backend R32F allocations and immutable program-data lifetimes. Pending compile data is counted conservatively. Excludes runtime support textures, shared host phase, render targets, host readbacks and driver/program overhead; add their explicit inventories before complete admission.'};
	}
}
