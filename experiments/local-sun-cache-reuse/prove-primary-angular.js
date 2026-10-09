import path from 'node:path';
import {readFile,mkdir} from 'node:fs/promises';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {ExperimentRun} from './ExperimentRun.js';
import {openNativeParent} from './native-parent-reader.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';
import {nativeHemisphereQuadrature} from './native-hemisphere-quadrature.js';
import {independentDirections} from './secondary-oracle.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Diagnose independent incoming angular axes with unchanged continuous primary helpers.
 * @returns {Promise<void>} - Parent reproduction and selected-case axis measurements, never complete physical acceptance.
 */
async function main() {
	await requireHeavyExecution();const run=await ExperimentRun.create('p3-primary-angle');
	try {
		const name=process.argv[2];if(!name)throw new Error('A sealed native reference parent is required.');
		const implementation=[];let entry='';
		for(const relative of [...['prove-primary-angular.js','PrimaryAngularMain.cs','native-parent-reader.js','native-hemisphere-quadrature.js','secondary-oracle.js','primary-oracle.js','continuous-reference.js','parent-evidence.js','run-boundary.js','heavy-execution-admission.js','ExperimentRun.js'].map(file=>'experiments/local-sun-cache-reuse/'+file),'src/algorithm32/implementation/canonical-atmosphere/consts.js','src/algorithm32/profiles/native-15/consts.js']) {
			const target=path.join(repositoryRoot,relative);await checkPath(repositoryRoot,target);const bytes=await readFile(target);
			implementation.push({path:relative,sha256:hash(bytes)});await run.write('source-'+relative.replaceAll('/','-'),bytes);
			if(relative.endsWith('/PrimaryAngularMain.cs'))entry=new TextDecoder().decode(bytes);
		}
		const reader=await openNativeParent(name),inputParent=await reader.read('input.json'),sourceParent=await reader.read('ShellReference.cs'),provenanceParent=await reader.read('inputs.json');
		/** @type {LocalSunPrimaryAngularInput} */const input=JSON.parse(new TextDecoder().decode(inputParent.bytes));
		/** @type {LocalSunNativeReferenceLevel['result']} */const parent=JSON.parse(new TextDecoder().decode(reader.metadata.bytes));
		const provenance=JSON.parse(new TextDecoder().decode(provenanceParent.bytes));
		if(provenance.sourceSha256!==sourceParent.artifactSha256 || input.polarRule!=='hemisphere-sine2-v1' || input.phiOffset!==.5 || input.pathRule!=='piecewise-gauss-v1' || !input.outgoingMu || input.mu.length!==input.muWeights.length || input.queries.length!==parent.packets.length)throw new Error('Compatible frozen explicit-support native parent required.');
		/** @type {LocalSunPrimaryAngularCase[]} */const cases=[];
		for(const [label,fraction,z,channel] of /** @type {Array<[string,number,number,number]>} */ ([
			['source-ground',0,5,14],['middle-ground',.19,1500,14],['outer-middle',.93,62500,2],['outer-horizon',.93,99000,1],['boundary-ground',1,1500,14],['boundary-horizon',1,99000,1],['source-low',0,1500,14]])) {
			const point=[input.radius*fraction,0,z],direction=[1,0,0],parentIndex=input.queries.findIndex(q=>q.point.every((v,i)=>v===point[i]) && q.direction.every((v,i)=>v===direction[i]));
			if(parentIndex<0)throw new Error('Declared physical diagnostic case is absent from parent inventory.');
			cases.push({name:label,point,direction,channel,parentIndex});
		}
		const base=process.argv.includes('--dense') ? 64 : 32,azimuthScale=process.argv.includes('--azimuth-refine') ? 4 : 1;
		/** @type {LocalSunNativeAzimuthRule} */const azimuthRule=process.argv.includes('--quadrant-gauss') ? 'quadrant-gauss' : 'uniform';
		/** @type {LocalSunPrimaryAngularLevel[]} */const levels=[{name:'parent',mu:input.mu,muWeights:input.muWeights,phi:input.phi}];
		for(const [label,polar,phi] of /** @type {Array<[string,number,number]>} */ ([['polar-coarse',base,base*8*azimuthScale],['polar-middle',base*2,base*8*azimuthScale],['fine',base*4,base*8*azimuthScale],['azimuth-coarse',base*4,base*2*azimuthScale],['azimuth-middle',base*4,base*4*azimuthScale]])) {
			// Derive the polar rule on one fixed small product grid, independently
			// of azimuth count; avoid duplicating identical polar weights thousands of times.
			const directions=nativeHemisphereQuadrature(polar,8,true),nodes=directions.filter((_,i)=>i%8===0).sort((a,b)=>a.direction[2]-b.direction[2]);
			const muWeights=nodes.map(n=>n.weight*8/(2*Math.PI));
			if(Math.abs(muWeights.reduce((sum,value)=>sum+value,0)-2)>1e-12)throw new Error('Diagnostic polar mass differs from the analytic full-sphere rule.');
			/** @type {LocalSunPrimaryAngularLevel} */const level={name:label,mu:nodes.map(n=>n.direction[2]),muWeights,phi};
			if(azimuthRule==='quadrant-gauss') {
				const azimuths=independentDirections(2,phi,'uniform',azimuthRule).slice(0,phi),mass=azimuths.reduce((sum,tap)=>sum+tap.weight,0);
				if(Math.abs(mass-2*Math.PI)>1e-11)throw new Error('Diagnostic quadrant azimuth mass differs from the analytic rule.');
				level.azimuth=azimuths.map(tap=>({phi:(Math.atan2(tap.direction[1],tap.direction[0])+2*Math.PI)%(2*Math.PI),weight:tap.weight*2*Math.PI/mass}));
			}
			levels.push(level);
		}
		const original=new TextDecoder().decode(sourceParent.bytes),start='    /// <summary>Read only the runner-authenticated input; write one new requested result.</summary>',end='    /// <summary>Copy an independently computed source-function grid without changing its values or arithmetic.</summary>';
		const a=original.indexOf(start),b=original.indexOf(end);if(a<0 || b<=a || original.indexOf(start,a+1)>=0 || original.indexOf(end,b+1)>=0)throw new Error('Frozen entry anchors are ambiguous.');
		const derived=original.slice(0,a)+entry+'\n\n'+original.slice(b);await run.write('PrimaryAngular.cs',derived);
		await run.write('diagnostic-input.json',JSON.stringify({...input,diagnosticCases:cases,diagnosticLevels:levels},null,'\t'));
		const compiler='C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe',scratch=path.join(run.root,'compiler-tmp'),executable=path.join(run.root,'PrimaryAngular.exe'),output=path.join(run.root,'diagnostic.json');
		for(const target of [scratch,executable,output])await checkPath(run.root,target);await mkdir(scratch);
		const compileArgs=['/nologo','/optimize+','/platform:x64','/target:exe','/reference:System.Web.Extensions.dll','/out:'+executable,path.join(run.root,'PrimaryAngular.cs')];
		await run.write('inputs.json',JSON.stringify({schema:'primary-angular-diagnostic-input-v1',parents:[reader.metadata,inputParent,sourceParent,provenanceParent].map(({bytes,...identity})=>identity),implementation,command:process.argv.slice(1),
			derivation:{operation:'Substitute only the entry between unique anchors; preserve every frozen helper. Evaluate scalar continuous primary rays and continuous physical phase factors with declared positive angular weights. Reproduce seven parent J2 quantities, then separately bisect incoming polar/azimuth support to the declared common finest grid. Derive polar nodes/weights through a fixed eight-azimuth product. Azimuth uses uniform midpoint or existing quadrant-Gaussian nodes with analytic constant-mass normalization; polar normalization cannot depend on azimuth count. No field or candidate values enter computation.',startAnchor:start,endAnchor:end,parentSourceSha256:sourceParent.artifactSha256,entrySha256:hash(new TextEncoder().encode(entry)),derivedSourceSha256:hash(new TextEncoder().encode(derived)),base,azimuthScale,azimuthRule,cases,levels},
			tools:{node:process.version,compiler,compilerSha256:hash(await readFile(compiler)),compileArgs}},null,'\t'));
		const compiled=await promisify(execFile)(compiler,compileArgs,{windowsHide:true,env:{...process.env,TEMP:scratch,TMP:scratch}});await run.write('compile.txt',compiled.stdout+compiled.stderr);
		await new Promise((resolve,reject)=>{const child=spawn(executable,[path.join(run.root,'diagnostic-input.json'),output],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,TEMP:scratch,TMP:scratch}});let failure='';
			child.stdout.on('data',bytes=>{const message=String(bytes).trim();console.log(message);void run.progress('primary-angular',message);});child.stderr.on('data',bytes=>{failure=(failure+String(bytes)).slice(-16384);});child.once('error',reject);child.once('exit',code=>code===0 ? resolve(undefined) : reject(new Error('Primary diagnostic exited '+code+': '+failure)));});
		/** @type {LocalSunPrimaryAngularResult} */const result=JSON.parse(await readFile(output,'utf8'));
		if(result.schema!=='native-primary-angular-v1' || result.measurements.length!==levels.length || !Number.isFinite(result.elapsedMilliseconds) || result.elapsedMilliseconds<0 || !Number.isSafeInteger(result.maximumPathSamples) || result.maximumPathSamples<0)throw new Error('Invalid diagnostic measurement inventory.');
		for(let i=0;i<levels.length;i++){const m=result.measurements[i],l=levels[i];if(m.name!==l.name || m.polarCount!==l.mu.length || m.azimuthCount!==l.phi || m.values.length!==cases.length || m.values.some(v=>!Number.isFinite(v) || v<0))throw new Error('Diagnostic grid/case inventory differs.');}
		const reproduction=cases.map((c,i)=>{const reference=parent.packets[c.parentIndex].J2[c.channel],value=result.measurements[0].values[i],difference=Math.abs(value-reference);if(!Number.isFinite(reference) || difference>1e-18+1e-11*Math.abs(reference))throw new Error('Frozen primary helper reproduction failed.');return {case:c.name,reference,value,difference};});
		const axes=[['polar','polar-coarse','polar-middle','fine'],['azimuth','azimuth-coarse','azimuth-middle','fine']].map(([axis,...names])=>({axis,cases:cases.map((c,i)=>{
			const values=names.map(label=>{const m=result.measurements.find(m=>m.name===label);if(!m)throw new Error('Missing common-grid diagnostic.');return m.values[i];}),delta1=Math.abs(values[1]-values[0]),delta2=Math.abs(values[2]-values[1]),uncertainty=2*delta2,tolerance=1e-12+.1*Math.abs(values[2]);
			return {case:c.name,values,delta1,delta2,uncertaintyFraction:uncertainty/tolerance,magnitudePass:uncertainty<=.1*tolerance,reductionPass:delta2<1e-15 || delta2<=delta1/2};})}));
		await run.write('result.json',JSON.stringify({schema:'primary-angular-axis-diagnostic-v1',cases,reproduction,axes,elapsedMilliseconds:result.elapsedMilliseconds,qualified:false,claim:'Selected scalar primary J2 diagnostic only; no higher-order, complete-grid, combined-uncertainty or candidate acceptance.'},null,'\t'));
		await run.finish('accepted');console.log(JSON.stringify({run:run.name,elapsedMilliseconds:result.elapsedMilliseconds,axes}));
	}catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
