/** Observe allocation payload through one experiment-owned WebGL context.
 * Texture, renderbuffer and buffer lifetimes include Three's scene and shadow
 * targets. Depth24 is conservatively charged four bytes per pixel. Driver
 * bookkeeping, compiled programs and host proof readbacks are separate.
 * @implements {LocalSunShellGlResourceContract}
 */
export class ShellWebGlResources {
	/** Current explicitly allocated payload, bytes. @type {number} */ bytes=0;
	/** Largest simultaneous explicitly allocated payload, bytes. @type {number} */ peak=0;
	/** Resource sequence for detached evidence. @type {number} */ sequence=0;
	/** Live allocation sizes, indexed by actual opaque GL resources. @type {Map<WebGLTexture|WebGLRenderbuffer|WebGLBuffer,LocalSunShellGlAllocation>} */ allocations=new Map();
	/** Allocation and release evidence. @type {LocalSunShellGlEvent[]} */ events=[];

	/** Update one complete resource suballocation after successful API return.
	 * @param {WebGLTexture|WebGLRenderbuffer|WebGLBuffer|null} resource - Actual bound resource.
	 * @param {string} kind - Texture, renderbuffer or buffer.
	 * @param {string} part - Storage identity; texture faces and levels remain distinct.
	 * @param {number} bytes - New payload for this suballocation.
	 * @returns {void} - Throws for an unaccounted or inconsistent allocation.
	 */
	set(resource,kind,part,bytes) {
		if(!resource || !Number.isSafeInteger(bytes) || bytes<0)throw new Error('Bound GL resource and integral allocation required.');
		let allocation=this.allocations.get(resource);
		if(!allocation){allocation={id:++this.sequence,kind,parts:new Map()};this.allocations.set(resource,allocation);}
		const change=bytes-(allocation.parts.get(part) ?? 0);allocation.parts.set(part,bytes);
		this.bytes+=change;this.peak=Math.max(this.peak,this.bytes);
		this.events.push({id:allocation.id,kind,operation:'allocate',change,total:this.bytes});
	}

	/** Retire precisely the deleted resource's remaining suballocations.
	 * @param {WebGLTexture|WebGLRenderbuffer|WebGLBuffer|null} resource - Deleted opaque resource, if any.
	 * @returns {void} - Unknown or repeated deletions have no retained payload.
	 */
	release(resource) {
		if(!resource)return;const allocation=this.allocations.get(resource);if(!allocation)return;
		const change=-[...allocation.parts.values()].reduce((sum,value)=>sum+value,0);
		this.allocations.delete(resource);this.bytes+=change;
		if(this.bytes<0)throw new Error('Negative GL resource inventory.');
		this.events.push({id:allocation.id,kind:allocation.kind,operation:'delete',change,total:this.bytes});
	}

	/** Attach before constructing the renderer; modify only this owned context.
	 * @param {WebGL2RenderingContext} gl - Owned instrumented context.
	 * @returns {void} - Allocation calls and resource identities retain their native behavior.
	 */
	attach(gl) {
		/** @type {Map<string,WebGLTexture|null>} */ const textures=new Map();
		/** @type {Map<number,WebGLBuffer|null>} */ const buffers=new Map();
		/** @type {WebGLRenderbuffer|null} */ let renderbuffer=null;
		/** @type {number} */ let unit=gl.TEXTURE0;
		const textureTarget=/** @param {number} target - GL texture target. */ target=>target>=gl.TEXTURE_CUBE_MAP_POSITIVE_X && target<=gl.TEXTURE_CUBE_MAP_NEGATIVE_Z ? gl.TEXTURE_CUBE_MAP : target;
		const boundTexture=/** @param {number} target - GL texture target. */ target=>textures.get(unit+':'+textureTarget(target)) ?? null;
		const formatBytes=/** @param {number} format - Sized or base GL format. @param {number} [type] - Scalar type for an unsized format. */ (format,type)=>{
			const sized=new Map(/** @type {[number,number][]} */([[gl.R8,1],[gl.R16F,2],[gl.R32F,4],[gl.RG8,2],[gl.RG16F,4],[gl.RG32F,8],[gl.RGB8,3],[gl.RGB16F,6],[gl.RGB32F,12],[gl.RGBA8,4],[gl.SRGB8_ALPHA8,4],[gl.RGBA16F,8],[gl.RGBA32F,16],[gl.DEPTH_COMPONENT16,2],[gl.DEPTH_COMPONENT24,4],[gl.DEPTH_COMPONENT32F,4],[gl.DEPTH24_STENCIL8,4],[gl.DEPTH32F_STENCIL8,8]]));
			const size=sized.get(format);if(size!==undefined)return size;
			const channels=new Map(/** @type {[number,number][]} */([[gl.RED,1],[gl.RG,2],[gl.RGB,3],[gl.RGBA,4],[gl.DEPTH_COMPONENT,1]])).get(format);
			const scalar=new Map(/** @type {[number,number][]} */([[gl.UNSIGNED_BYTE,1],[gl.BYTE,1],[gl.UNSIGNED_SHORT,2],[gl.SHORT,2],[gl.HALF_FLOAT,2],[gl.UNSIGNED_INT,4],[gl.INT,4],[gl.FLOAT,4]])).get(type ?? -1);
			if(channels===undefined || scalar===undefined)throw new Error('Unaccounted GL allocation format '+format+'/'+type);
			return channels*scalar;
		};
		const activeTexture=gl.activeTexture.bind(gl);gl.activeTexture=value=>{activeTexture(value);unit=value;};
		const bindTexture=gl.bindTexture.bind(gl);gl.bindTexture=(target,texture)=>{bindTexture(target,texture);textures.set(unit+':'+textureTarget(target),texture);};
		const deleteTexture=gl.deleteTexture.bind(gl);gl.deleteTexture=texture=>{deleteTexture(texture);this.release(texture);};
		const storage2=gl.texStorage2D.bind(gl);gl.texStorage2D=(target,levels,format,width,height)=>{
			const stride=formatBytes(format);storage2(target,levels,format,width,height);
			let bytes=0;for(let level=0;level<levels;level++)bytes+=Math.max(1,width>>level)*Math.max(1,height>>level)*stride;
			this.set(boundTexture(target),'texture','storage',bytes*(target===gl.TEXTURE_CUBE_MAP ? 6 : 1));
		};
		const storage3=gl.texStorage3D.bind(gl);gl.texStorage3D=(target,levels,format,width,height,depth)=>{
			const stride=formatBytes(format);storage3(target,levels,format,width,height,depth);
			let bytes=0;for(let level=0;level<levels;level++)bytes+=Math.max(1,width>>level)*Math.max(1,height>>level)*(target===gl.TEXTURE_3D ? Math.max(1,depth>>level) : depth)*stride;
			this.set(boundTexture(target),'texture','storage',bytes);
		};
		const image2=gl.texImage2D.bind(gl);
		gl.texImage2D=/** @type {typeof gl.texImage2D} */(/** @type {unknown} */((/** @type {unknown[]} */ ...args)=>{
			if(args.length<9 || args.slice(0,8).some(value=>typeof value!=='number'))throw new Error('Explicit numeric texImage2D extent required for resource proof.');
			const a=/** @type {number[]} */(args.slice(0,8)),bytes=a[3]*a[4]*formatBytes(a[2],a[7]);
			Reflect.apply(image2,gl,args);this.set(boundTexture(a[0]),'texture',a[0]+':'+a[1],bytes);
		}));
		const image3=gl.texImage3D.bind(gl);
		gl.texImage3D=/** @type {typeof gl.texImage3D} */(/** @type {unknown} */((/** @type {unknown[]} */ ...args)=>{
			if(args.length<10 || args.slice(0,9).some(value=>typeof value!=='number'))throw new Error('Explicit numeric texImage3D extent required for resource proof.');
			const a=/** @type {number[]} */(args.slice(0,9)),bytes=a[3]*a[4]*a[5]*formatBytes(a[2],a[8]);
			Reflect.apply(image3,gl,args);this.set(boundTexture(a[0]),'texture',a[0]+':'+a[1],bytes);
		}));
		const bindRenderbuffer=gl.bindRenderbuffer.bind(gl);gl.bindRenderbuffer=(target,value)=>{bindRenderbuffer(target,value);renderbuffer=value;};
		const storage=gl.renderbufferStorage.bind(gl);gl.renderbufferStorage=(target,format,width,height)=>{const bytes=width*height*formatBytes(format);storage(target,format,width,height);this.set(renderbuffer,'renderbuffer','storage',bytes);};
		const multisample=gl.renderbufferStorageMultisample.bind(gl);gl.renderbufferStorageMultisample=(target,samples,format,width,height)=>{const bytes=width*height*Math.max(samples,1)*formatBytes(format);multisample(target,samples,format,width,height);this.set(renderbuffer,'renderbuffer','storage',bytes);};
		const deleteRenderbuffer=gl.deleteRenderbuffer.bind(gl);gl.deleteRenderbuffer=value=>{deleteRenderbuffer(value);this.release(value);};
		const bindBuffer=gl.bindBuffer.bind(gl);gl.bindBuffer=(target,value)=>{bindBuffer(target,value);buffers.set(target,value);};
		const bufferData=gl.bufferData.bind(gl);
		gl.bufferData=/** @type {typeof gl.bufferData} */(/** @type {unknown} */((/** @type {unknown[]} */ ...args)=>{
			const target=/** @type {number} */(args[0]),value=args[1];
			if(typeof target!=='number' || !(typeof value==='number' || value instanceof ArrayBuffer || ArrayBuffer.isView(value)))throw new Error('Explicit GL buffer payload required.');
			const width=typeof value==='object' && value && 'BYTES_PER_ELEMENT' in value && typeof value.BYTES_PER_ELEMENT==='number' ? value.BYTES_PER_ELEMENT : 1;
			const bytes=typeof value==='number' ? value : typeof args[4]==='number' && args[4]!==0 ? args[4]*width : value.byteLength-(typeof args[3]==='number' ? args[3]*width : 0);
			Reflect.apply(bufferData,gl,args);this.set(buffers.get(target) ?? null,'buffer','storage',bytes);
		}));
		const deleteBuffer=gl.deleteBuffer.bind(gl);gl.deleteBuffer=value=>{deleteBuffer(value);this.release(value);};
	}

	/** Return detached complete payload evidence, excluding explicitly named non-GL categories.
	 * @param {boolean} [includeEvents] - Include the complete history only in the final inventory; frame snapshots refer to its prefix by eventCount.
	 * @returns {LocalSunShellGlSnapshot} - Accounted allocation lifetimes.
	 */
	snapshot(includeEvents = true) {
		return {bytes:this.bytes,peak:this.peak,live:[...this.allocations.values()].map(value=>({id:value.id,kind:value.kind,bytes:[...value.parts.values()].reduce((sum,bytes)=>sum+bytes,0)})),eventCount:this.events.length,events:includeEvents ? this.events.map(event=>({...event})) : [],
			claim:'Explicit texture, renderbuffer and buffer payload from actual allocation calls. Depth24 conservatively charged four bytes/pixel. Excludes default framebuffer, compiled driver programs/bookkeeping and host arrays/readbacks; this is allocation-backed logical accounting, not physical device-byte telemetry.'};
	}
}
