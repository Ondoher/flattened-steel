import * as THREE from 'three';
import {ThreeCacheBackend} from '../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {Algorithm32Bindings} from '../../src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {createOwners, cpuRays, viewDirections, residual, rayCoverage,sampleField,unit} from './rotation-model.js';
import {gpuRays} from './rotation-gpu.js';
import {opticalShellTransport} from './shell-transport.js';
import {primaryDensity,primaryRadiance} from './primary-oracle.js';
import {installShellAxisCache} from './shell-axis.js';
import {partitionedShellIncoming} from './shell-angular.js';
import {shellMiePhaseData,precomputedShellScatter} from './shell-scatter.js';
import {shellReconstructionData,shellExcessData} from './shell-reconstruction.js';
import {prepareShellMiePhase} from './shell-phase.js';
import {guardEmptyShellSlots} from './shell-omission.js';
import {probeShellFieldTransport} from './shell-field-probe.js';

/** Capture a fresh current-grid control and fresh shell candidate, without recording video.
 * @param {LocalSunShellCaptureRequest} request - Exact frozen state and layout.
 * @returns {Promise<string>} - JSON observations plus directly retained PNG data.
 */
async function capture(request) {
	const canvas=document.createElement('canvas');
	document.body.append(canvas);
	const gl=canvas.getContext('webgl2',{antialias:false,preserveDrawingBuffer:true});
	if(!gl?.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 required.');
	const renderer=new THREE.WebGLRenderer({canvas,context:gl});
	renderer.debug.onShaderError=()=>{throw new Error('Experimental GPU shader compilation failed.');};
	renderer.setSize(720,414,false);
	renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
	renderer.toneMapping=THREE.NoToneMapping;
	const results=[];
	/** @type {UnitValue<'cd m^-2'> | null} */
	let commonAdaptation=null;
	try {
		for(const candidate of [false,true]) {
			console.log(candidate ? 'fresh shell candidate' : 'fresh current-grid control');
			const preparationStarted=performance.now();
			const recipe={state:request.state,diagnostic:request.diagnostic,angles:[0],motion:false,
				...(candidate ? {candidate:/** @type {LocalSunCorrectionCandidate} */('axis'),shellLayout:request.layout,shellRuntime:request.runtime,
					...(request.incoming==='partitioned' || request.incoming==='partitioned-midpoint48' ? {shellIncoming:partitionedShellIncoming(request.incoming==='partitioned-midpoint48' ? 48 : 24,request.incoming==='partitioned-midpoint48' ? .5 : 0)} : {})} : {})};
			const owners=createOwners(recipe,0);
			const backend=new ThreeCacheBackend({THREE,renderer});
			const allocations=[];
			let live=0,peak=0;
			const allocate=backend.allocateField.bind(backend);
			const inspect=[];
			/** @type {Map<string,LocalSunRotationField>} */
			const primaryFields=new Map();
			const submit=backend.submitLayer.bind(backend);
			backend.submitLayer=r=>{
				submit(r);
				if(r.layer===r.output.storage.layers-1 && ['local-sun-l1','local-sun-l2','local-sun-l3','local-sun-j1','local-sun-j2','local-sun-j3','local-sun-j4'].includes(r.output.id)) {
					const binding=backend.createRuntimeBinding({field:r.output,valueKey:'cache.cumulativeScatteringDensity'});
					inspect.push(backend.readRuntimeBindingField(binding).then(field=>{primaryFields.set(r.output.id,field);}));
				}
				if(candidate && r.output.id==='local-sun-l2' && r.layer===r.output.storage.layers-1) {
					const binding=backend.createRuntimeBinding({field:r.output,valueKey:'cache.cumulativeScatteringDensity'});
					inspect.push(backend.readRuntimeBindingField(binding).then(field=>{
						const rows=[];
						for(let p=0;p<field.storage.height;p++) {
							let bad=0;
							for(let d=0;d<field.storage.width;d++)if(!Number.isFinite(field.values[p*field.storage.width+d]))bad++;
							if(bad)rows.push({p,bad,z:request.layout.nodes[p].z,rho:request.layout.nodes[p].rho});
						}
						console.log('L2 invalid positions: '+JSON.stringify(rows));
					}));
				}
			};
			backend.allocateField=spec=>{
				const bytes=spec.storage.width*spec.storage.height*spec.storage.layers*4;
				live+=bytes; peak=Math.max(peak,live); allocations.push({id:spec.id,bytes,storage:spec.storage});
				const field=allocate(spec),dispose=field.dispose.bind(field);
				let disposed=false;
				field.dispose=()=>{if(!disposed){live-=bytes;disposed=true;}dispose();};
				return field;
			};
			const compile=backend.compile.bind(backend);
			let lastPulse=performance.now(),phaseUiGapMilliseconds=0;
			const phasePulse=setInterval(()=>{const now=performance.now();phaseUiGapMilliseconds=Math.max(phaseUiGapMilliseconds,now-lastPulse);lastPulse=now;},8);
			let miePhases;
			try {
				miePhases=candidate && request.incoming && request.incoming!=='control' ?
					request.cooperative ? await prepareShellMiePhase(owners.domains,'/phase-worker.js') : shellMiePhaseData(owners.domains) : null;
			} finally {phaseUiGapMilliseconds=Math.max(phaseUiGapMilliseconds,performance.now()-lastPulse);clearInterval(phasePulse);}
			const precomputeMilliseconds=performance.now()-preparationStarted;
			if(candidate) backend.compile=shader=>{
				const adapted=opticalShellTransport({...shader,
				source:shader.source.includes('vec3 samplePositionMeters = ray.originMeters')
					? shader.source.replace('vec3 samplePositionMeters = ray.originMeters',
						'shellTransportRhoOverride = pointIndex == CACHE_TRANSPORT_INTERVAL_COUNT && ray.endsOnCylinder ? uCacheGeometryRadialMaximum : -1.0;\n\tvec3 samplePositionMeters = ray.originMeters') : shader.source,
				bindings:shader.bindings.map(binding=>{
				if(['uCacheGeometrySourceSubpoint','uCacheGeometrySourcePosition','uCacheLocalSunPosition'].includes(binding.spec.name)) {
					if(binding.spec.kind!=='uniform' || binding.spec.shaderType!=='vec3')throw new Error('Build position binding contract changed.');
					const p=/** @type {Position} */(binding.value);
					if(p.units!=='meters' || !Array.isArray(p.coordinates)) throw new Error('Invalid build position.');
					return /** @type {CacheBinding} */({...binding,value:{...p,coordinates:[0,0,p.coordinates[2]]}});
				}
				if(binding.spec.name==='uCacheGeometryRadialFallback') {
					if(binding.spec.kind!=='uniform' || binding.spec.shaderType!=='vec3')throw new Error('Build fallback binding contract changed.');
					return /** @type {CacheBinding} */({...binding,value:/** @type {UnitVector3} */([1,0,0])});
				}
				return binding;
			})},request.transport ?? 'uniform120');
				return compile(guardEmptyShellSlots(miePhases ? precomputedShellScatter(adapted,miePhases) : adapted,request.layout));
			};
			/** @type {LocalSunCacheController | undefined} */
			let controller;
			const createController=owners.source.createCacheController.bind(owners.source);
			owners.source.createCacheController=r=>{
				controller=createController({...r,...(candidate && request.cooperative ? {scheduler:{yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0))}} : {})});
				if(candidate) {
					const build=controller.createScatteringCache.bind(controller);
					controller.createScatteringCache=async request=>{
						const cache=await build(request);
						let texture,excessTexture;
						try {
							if(recipe.shellLayout.reconstruction) {
								const data=shellReconstructionData(recipe.shellLayout);
								texture=new THREE.DataTexture(new Float32Array(data.values),15,recipe.shellLayout.nodes.length,THREE.RedFormat,THREE.FloatType);
								texture.internalFormat='R32F';texture.unpackAlignment=1;texture.needsUpdate=true;
								const excess=shellExcessData(recipe.shellLayout);
								excessTexture=new THREE.DataTexture(new Float32Array(excess.values),recipe.shellLayout.nodes.length,1,THREE.RedFormat,THREE.FloatType);
								excessTexture.internalFormat='R32F';excessTexture.unpackAlignment=1;excessTexture.needsUpdate=true;
							}
							installShellAxisCache(cache,texture,excessTexture);return cache;
						} catch(error){texture?.dispose();excessTexture?.dispose();cache.dispose();throw error;}
					};
				}
				return controller;
			};
			/** @type {ShaderRuntimeComposer} */
			const composer={passes:[],addPass(p){this.passes.push(p);},removePass(p){const i=this.passes.indexOf(p);if(i>=0)this.passes.splice(i,1);}};
			const camera=new THREE.PerspectiveCamera(70,720/414,0.002,500);
			camera.position.set(0,0.005,0);camera.lookAt(0,0.005,-1);
			const bindings=Algorithm32Bindings.create(THREE,{value:500000,units:'meters'});
			Algorithm32Bindings.update({bindingValues:bindings,camera,props:{config:{...owners.facade.config.config,geometry:owners.geometry},sceneScale:{value:1000,units:'meters-per-scene-unit'}}});
			const black=new THREE.DataTexture(new Float32Array(4),1,1,THREE.RGBAFormat,THREE.FloatType);black.needsUpdate=true;
			let handle;
			try {
				const tick=performance.now();
				handle=await owners.facade.setupShader({THREE,composer,scene:new THREE.Scene(),camera,
					viewportSize:{width:720,height:414,units:'pixels'},sceneScale:{value:1000,units:'meters-per-scene-unit'},
					sceneDepthMax:{value:500000,units:'meters'},bindingValues:bindings,cacheBackend:backend});
				gl.finish();if(gl.getError()!==gl.NO_ERROR)throw new Error('Experimental GPU construction failed.');const buildMilliseconds=performance.now()-tick+precomputeMilliseconds;
				await Promise.all(inspect);
				console.log(`build ${buildMilliseconds} ms; ${owners.domains.positionCount} positions; field peak ${peak}`);
				const cache=controller?.active;if(!cache)throw new Error('No active cache.');
				const binding=cache.getRuntimeBindings().bindings.find(b=>b.valueKey==='cache.cumulativeScatteringDensity');
				if(!binding)throw new Error('Cumulative binding missing.');
				const field=await backend.readRuntimeBindingField(binding);
				let nonfinite=0,negative=0;
				for(const v of field.values){if(!Number.isFinite(v))nonfinite++;if(v< -1e-12)negative++;}
				console.log(`cumulative readback: ${nonfinite} nonfinite, ${negative} negative`);
				if(nonfinite)throw new Error(`Invalid cumulative build: ${nonfinite} nonfinite scalars.`);
				await handle.prepare(renderer);
				const receiver=await handle.measureReceiverEnvironmentLight({THREE,renderer,backend,diagnostics:true});
				if(!commonAdaptation)commonAdaptation=receiver.totalHorizontalLuminanceProxy;
				owners.facade.setAdaptingLuminance(commonAdaptation);
				const pass=/** @type {LocalSunControlViewPass} */(composer.passes.at(-1));
				if(!pass) throw new Error('No view pass.');
				pass.renderToScreen=true;pass.render(renderer,null,{texture:black});gl.finish();
				const image=canvas.toDataURL('image/png');
				const directions=viewDirections();
				const cpu=cpuRays(owners,field,directions);
				const gpu=await gpuRays({owners,cache,backend,renderer,directions});
				const cpuGpu=residual(gpu.flatMap(r=>r.radiance),cpu.flatMap(r=>r.radiance),1e-9,0.002);
				console.log('Continuous primary accuracy probes');
				const primary=probePrimary(owners,primaryFields,request.state,candidate ? request.layout.maximumRho : owners.geometry.configuration.cacheRadialMaximum.value);
				if(candidate && request.fieldProbe)console.log('Common-field L2 construction quadrature diagnosis');
				const fieldTransport=candidate && request.fieldProbe ? probeShellFieldTransport(owners,primaryFields,request.layout) : null;
				const center=owners.geometry.configuration.sourceSubpoint.coordinates;
				const axisExpected=[],axisMeasured=[];
				for(const z of [5,250,1500,7000,25000,62500,99000])for(const d of [[1,0,0],[0,1,0],[0,0,1],[1,1,1],[-1,2,3]].map(unit))
					for(const o of [[0.001,0],[-0.001,0],[0,0.001],[0,-0.001]]) {
						axisExpected.push(...sampleField(field,owners.geometry,[center[0],center[1],z],d));
						axisMeasured.push(...sampleField(field,owners.geometry,[center[0]+o[0],center[1]+o[1],z],d));
					}
				const axisContinuity=residual(axisMeasured,axisExpected,1e-12,0.0001);
				const secondary=[];
				for(const z of [5,250,1500,7000,25000,62500,99000])for(const fraction of [0,1/96,0.19,0.51,0.93,1])
					for(const direction of [[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[1,1,1],[-1,2,3]].map(unit)) {
						const point=[fraction*(candidate ? request.layout.maximumRho : owners.geometry.configuration.cacheRadialMaximum.value),0,z];
						const world=[center[0]+point[0],center[1],z];
						const orders=Object.fromEntries([1,2,3,4].flatMap(order=>{
							const f=primaryFields.get('local-sun-j'+order);
							return f ? [['J'+order,Array.from(sampleField(f,owners.geometry,world,direction))]] : [];
						}));
						secondary.push({point,direction,orders});
					}
				const digest=await crypto.subtle.digest('SHA-256',new Float32Array(field.values));
				const occupied=request.layout.occupiedNodeCount ?? request.layout.nodes.length;
				const occupiedValues=new Float32Array(occupied*field.storage.width*field.storage.layers);
				let emptyNonzero=0;
				if(candidate)for(let c=0;c<field.storage.layers;c++) {
					occupiedValues.set(field.values.slice(c*field.storage.height*field.storage.width,(c*field.storage.height+occupied)*field.storage.width),c*occupied*field.storage.width);
					for(let p=occupied;p<field.storage.height;p++)for(let d=0;d<field.storage.width;d++)if(field.values[(c*field.storage.height+p)*field.storage.width+d]!==0)emptyNonzero++;
				}
				const occupiedDigest=candidate ? await crypto.subtle.digest('SHA-256',occupiedValues) : null;
				const orderFields=[];
				if(candidate)for(const [id,pure] of primaryFields) {
					const values=new Float32Array(occupied*pure.storage.width*pure.storage.layers);
					let nonzero=0;
					for(let c=0;c<pure.storage.layers;c++) {
						values.set(pure.values.slice(c*pure.storage.height*pure.storage.width,(c*pure.storage.height+occupied)*pure.storage.width),c*occupied*pure.storage.width);
						for(let p=occupied;p<pure.storage.height;p++)for(let d=0;d<pure.storage.width;d++)if(pure.values[(c*pure.storage.height+p)*pure.storage.width+d]!==0)nonzero++;
					}
					const sha=await crypto.subtle.digest('SHA-256',values);
					orderFields.push({id,occupiedSha256:Array.from(new Uint8Array(sha),b=>b.toString(16).padStart(2,'0')).join(''),emptyNonzero:nonzero,storage:pure.storage});
				}
			results.push({candidate,positions:owners.domains.positionCount,incoming:owners.domains.incomingDirectionDomain.id,
					incomingCount:owners.domains.incomingDirectionCount,precomputeMilliseconds,phaseUiGapMilliseconds,
					phaseMatrix:miePhases ? {contentHash:miePhases.contentHash,shape:miePhases.shape,payloadBytes:miePhases.values.length*4,worker:!!request.cooperative} : null,
					buildMilliseconds,peakFieldBytes:peak,orderFields,
					allocations,receiver,image,commonAdaptation,primary,fieldTransport,secondary,axisContinuity,cpuGpu,coverage:rayCoverage(owners,cpu),cpuRays:cpu,gpuRays:gpu,
					field:{sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),nonfinite,negative,storage:field.storage,
						...(occupiedDigest ? {occupiedSha256:Array.from(new Uint8Array(occupiedDigest),b=>b.toString(16).padStart(2,'0')).join(''),occupiedNodes:occupied,emptyNonzero} : {})},
					diagnostics:handle.getDiagnostics()});
			} finally {handle?.dispose();owners.facade.dispose();black.dispose();backend.dispose();}
		}
		const errors=[];for(let e=gl.getError();e!==gl.NO_ERROR;e=gl.getError())errors.push(e);
		const debug=gl.getExtension('WEBGL_debug_renderer_info');
		return JSON.stringify({schema:'shell-fresh-capture-v1',results,glErrors:errors,
			gpu:debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
			claim:'Fresh layout comparison only; independent physical accuracy, omission equivalence, all-order field matrix and reuse remain unqualified.'});
	} finally {renderer.dispose();renderer.forceContextLoss();}
}

/** Compare independent continuous J1/L1 at declared nodes without using candidate fields as reference input.
 * @param {LocalSunRotationOwners} owners - Physical source and construction directions.
 * @param {Map<string,LocalSunRotationField>} fields - Measured primary fields.
 * @param {LocalSunFrozenPlacement} state - Frozen source calibration.
 * @param {number} radius - Explicit physical construction cylinder.
 * @returns {LocalSunShellPrimaryProof} - Samples, refinement and unchanged physical gate ratios.
 */
function probePrimary(owners,fields,state,radius) {
	const j=fields.get('local-sun-j1'),l=fields.get('local-sun-l1');
	if(!j || !l)return {schema:'shell-primary-proof-v1',samples:[],claim:'Reduced-order capture without both primary fields; physical accuracy remains open.'};
	const selected=[];
	for(const altitude of [0,250,1500,7000,25000,62500,99000]) {
		const zs=owners.domains.zNodes.map(z=>z.value);
		const z=zs.reduce((best,v)=>Math.abs(v-altitude)<Math.abs(best-altitude)?v:best,zs[0]);
		const row=owners.domains.positionNodes.filter(p=>/** @type {Distance} */(p.metadata.z).value===z);
		for(const column of [0,Math.floor(row.length/2),row.length-1])selected.push(row[column]);
	}
	const samples=[];
	for(const node of selected) {
		const point=[/** @type {Distance} */(node.metadata.rho).value,0,/** @type {Distance} */(node.metadata.z).value];
		for(const di of [0,Math.floor(owners.domains.incomingDirectionCount/4),Math.floor(owners.domains.incomingDirectionCount/2),
			Math.floor(3*owners.domains.incomingDirectionCount/4),owners.domains.incomingDirectionCount-1]) {
			const direction=owners.domains.incomingUnitVectors[di];
			const levels=[60,120,240,480,960].map(intervals=>({intervals,values:primaryRadiance(state,point,direction,radius,intervals)}));
			const reference=levels.at(-1).values;
			const observed=Array.from({length:15},(_,c)=>l.values[(c*l.storage.height+node.index)*l.storage.width+di]);
			const differences=levels.slice(1).map((level,i)=>Math.max(...level.values.map((v,c)=>Math.abs(v-levels[i].values[c])/(1e-9+0.1*Math.abs(reference[c])))));
			samples.push({quantity:'L1',position:point,directionIndex:di,direction,observed,reference,levels,
				physical:residual(observed,reference,1e-9,0.1),referenceDifferences:differences,
				converged:differences.at(-1)*2<=0.1 && (differences.at(-1)<1e-12 || differences.at(-1)<=differences.at(-2)/2)});
		}
		for(const di of [0,364,728,1457,2186,2915,4009]) {
			const direction=owners.domains.outgoingUnitVectors[di];
			const reference=primaryDensity(state,point,direction);
			const observed=Array.from({length:15},(_,c)=>j.values[(c*j.storage.height+node.index)*j.storage.width+di]);
			samples.push({quantity:'J1',position:point,directionIndex:di,direction,observed,reference,
				physical:residual(observed,reference,1e-12,0.1)});
		}
	}
	console.log('primary worst gate ratio '+Math.max(...samples.map(s=>s.physical.maximumRatio)));
	return {schema:'shell-primary-proof-v1',samples,
		claim:'Independent binary64 analytic J1 and Simpson L1 with 60/120/240/480/960 path refinements at 21 selected nodes; no higher-order or complete matrix claim.'};
}

/** @type {LocalSunShellBrowserBridge} */(/** @type {unknown} */(globalThis)).shellCapture=capture;
