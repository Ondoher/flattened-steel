import path from 'node:path';
import {readFile,mkdir} from 'node:fs/promises';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {ExperimentRun} from './ExperimentRun.js';
import {openNativeParent} from './native-parent-reader.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Bound normalized continuous primary sources with analytic interval endpoint envelopes.
 * Incidence increases with altitude; the Mie fraction decreases when HM<HR.
 * Every interval uses its upper incidence and larger endpoint phase mixture.
 * @param {LocalSunNativeOperatorInput} input - Authenticated native physical constants.
 * @returns {LocalSunNativePrimaryEnvelope[]} - Channel bounds with their maximizing altitude interval; no observed maxima enter.
 */
function primaryEnvelope(input) {
	const phaseR=3/(8*Math.PI),g=input.g,phaseM=3/(8*Math.PI)*(1-g*g)/(2+g*g)*2/(1-g)**3;
	if(!(input.height>input.top && input.rayleighHeight>input.mieHeight && input.mieHeight>0 && g>=0 && g<1 && input.albedo>=0 && input.albedo<=1))throw new Error('Unsupported analytic primary envelope.');
	return input.betaR.map((betaR,c)=>{
		const betaM=input.betaM[c],hr=input.rayleighHeight,hm=input.mieHeight;
		if(!(betaR>0 && betaM>0 && input.irradiance[c]>=0 && input.sourceScale>=0 && input.referenceDistance>0))throw new Error('Invalid spectral primary inputs.');
		let maximum=0,interval=[0,0];
		for(let low=0;low<input.top;low+=125) {
			const high=Math.min(input.top,low+125);
			const optical=betaR*hr*(Math.exp(-high/hr)-Math.exp(-input.top/hr))+betaM*hm*(Math.exp(-high/hm)-Math.exp(-input.top/hm));
			const incident=input.irradiance[c]*input.sourceScale*(input.referenceDistance/(input.height-high))**2*Math.exp(-optical);
			const mixture=(z)=>{const r=betaR*Math.exp(-z/hr),m=betaM*Math.exp(-z/hm);return (r*phaseR+input.albedo*m*phaseM)/(r+m);};
			const bound=incident*Math.max(mixture(low),mixture(high))*(1+256*Number.EPSILON);
			if(bound>maximum){maximum=bound;interval=[low,high];}
		}
		if(!Number.isFinite(maximum) || maximum<0)throw new Error('Invalid analytic primary bound.');
		return {maximum,interval};
	});
}

/** Derive finite positive-operator tail and roundoff bounds from unchanged authenticated native fields.
 * @returns {Promise<void>} - Sealed operator replay, analytic envelopes and conservative per-order bounds; numerical convergence remains separate.
 */
async function main() {
	await requireHeavyExecution();
	const run=await ExperimentRun.create('p3-op-bounds');
	try {
		const name=process.argv[2];if(!name)throw new Error('An exported native reference run is required.');
		const reader=await openNativeParent(name),native=JSON.parse(new TextDecoder().decode(reader.metadata.bytes));
		const inputParent=await reader.read('input.json'),provenanceParent=await reader.read('inputs.json'),sourceParent=await reader.read('ShellReference.cs');
		/** @type {LocalSunNativeOperatorInput} */const input=JSON.parse(new TextDecoder().decode(inputParent.bytes));
		const provenance=JSON.parse(new TextDecoder().decode(provenanceParent.bytes)),metadata=native.fields;
		if(provenance.sourceSha256!==sourceParent.artifactSha256 || metadata?.schema!=='binary64-native-source-function-grid-v1' || metadata.encoding!=='IEEE754-binary64-little-endian' || metadata.normalization!=='physical scattering density divided by local extinction' || metadata.channels!==15 || metadata.orders.join(',')!=='J2,J3,J4')throw new Error('Compatible authenticated native source and field schema required.');
		const implementation=[];let entry='';
		for(const file of ['prove-native-operators.js','NativeOperatorMain.cs','native-parent-reader.js','parent-evidence.js','run-boundary.js','heavy-execution-admission.js','ExperimentRun.js']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',file);await checkPath(repositoryRoot,target);const bytes=await readFile(target);
			implementation.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});await run.write('source-'+file,bytes);
			if(file==='NativeOperatorMain.cs')entry=new TextDecoder().decode(bytes);
		}
		const original=new TextDecoder().decode(sourceParent.bytes);
		const start='    /// <summary>Read only the runner-authenticated input; write one new requested result.</summary>',end='    /// <summary>Copy an independently computed source-function grid without changing its values or arithmetic.</summary>';
		const a=original.indexOf(start),b=original.indexOf(end);
		if(a<0 || b<=a || original.indexOf(start,a+1)>=0 || original.indexOf(end,b+1)>=0)throw new Error('Frozen reference entry anchors are ambiguous.');
		const derived=original.slice(0,a)+entry+'\n\n'+original.slice(b);
		await run.write('NativeOperators.cs',derived);
		await run.write('operator-input.json',JSON.stringify({...input,operatorOutMu:metadata.polar},null,'\t'));
		const compiler='C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe',scratch=path.join(run.root,'compiler-tmp');await checkPath(run.root,scratch);await mkdir(scratch);
		const executable=path.join(run.root,'NativeOperators.exe'),output=path.join(run.root,'operator.json');await checkPath(run.root,executable);await checkPath(run.root,output);
		const compileArgs=['/nologo','/optimize+','/platform:x64','/target:exe','/reference:System.Web.Extensions.dll','/out:'+executable,path.join(run.root,'NativeOperators.cs')];
		const parents=[reader.metadata,inputParent,provenanceParent,sourceParent];
		await run.write('inputs.json',JSON.stringify({schema:'native-operator-bound-input-v1',parents:parents.map(({bytes,...identity})=>identity),implementation,command:process.argv.slice(1),
			derivation:{operation:'Replace only the frozen reference entry between exact unique anchors; preserve its header and every numerical helper verbatim. Replay all grid packet and exact query scalar primary/higher-order positive transport kernels without source fields. Stream authenticated field maxima and rederive finite-operator tails/roundoff.',startAnchor:start,endAnchor:end,parentSourceSha256:sourceParent.artifactSha256,entrySha256:hash(new TextEncoder().encode(entry)),derivedSourceSha256:hash(new TextEncoder().encode(derived)),primaryAltitudeIntervalMeters:125,roundoffMultiplier:64},
			tools:{node:process.version,compiler,compilerSha256:hash(await readFile(compiler)),compileArgs}},null,'\t'));
		const compiled=await promisify(execFile)(compiler,compileArgs,{windowsHide:true,env:{...process.env,TEMP:scratch,TMP:scratch}});await run.write('compile.txt',compiled.stdout+compiled.stderr);
		await run.progress('operators','Replay the finite positive kernels from the exact frozen native source.');
		await new Promise((resolve,reject)=>{
			const child=spawn(executable,[path.join(run.root,'operator-input.json'),output],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,TEMP:scratch,TMP:scratch}});let failure='';
			child.stdout.on('data',bytes=>{const message=String(bytes).trim();console.log(message);void run.progress('operators',message);});
			child.stderr.on('data',bytes=>{failure=(failure+String(bytes)).slice(-16384);});child.once('error',reject);child.once('exit',code=>code===0 ? resolve(undefined) : reject(new Error('Operator replay exited '+code+': '+failure)));
		});
		/** @type {LocalSunNativePositiveOperatorMeasurement} */const operators=JSON.parse(await readFile(output,'utf8'));
		if(operators.schema!=='native-positive-operator-v1' || operators.maximumKernelMass.length!==2 || operators.maximumKernelMass.some(row=>row.length!==15 || row.some(v=>!Number.isFinite(v) || v<0)) || !Number.isSafeInteger(operators.maximumPathSamples) || operators.maximumPathSamples<0 || !Number.isSafeInteger(operators.cases) || operators.cases<=0 || ![operators.phaseGridMaximum,operators.phaseQueryMaximum].every(v=>Number.isFinite(v) && v>0))throw new Error('Invalid complete positive operator result.');
		const halfAzimuth=input.phiOffset===0 ? input.phi/2+1 : input.phiOffset===.5 ? input.phi/2 : NaN;
		const points=new Set(input.queries.map(query=>query.point.join(','))).size;
		const cases=2*input.mu.length*halfAzimuth*(input.radial.length*input.altitudes.length*Math.ceil(15/input.spectralBatch)+points*15)+input.queries.length*30;
		if(!Number.isSafeInteger(cases) || operators.cases!==cases || operators.positions!==input.radial.length*input.altitudes.length || operators.queryPoints!==points || !Number.isFinite(operators.elapsedMilliseconds) || operators.elapsedMilliseconds<0)throw new Error('Positive operator replay inventory is incomplete.');
		const maxima=[],fieldParents=[];
		const expected=metadata.shape.reduce((value,size)=>value*size,1);
		if(!Number.isSafeInteger(expected) || expected<=0)throw new Error('Invalid native field shape.');
		for(const order of metadata.orders) {
			const channels=[];
			for(let c=0;c<15;c++) {
				const parent=await reader.read(`fields/${order}-c${c}.bin`);if(parent.bytes.byteLength!==expected*8)throw new Error('Native field length differs.');
				const values=new DataView(parent.bytes.buffer,parent.bytes.byteOffset,parent.bytes.byteLength);let maximum=0;
				for(let i=0;i<expected;i++){const value=values.getFloat64(i*8,true);if(!Number.isFinite(value) || value< -1e-12)throw new Error('Invalid native source function.');maximum=Math.max(maximum,Math.abs(value));}
				channels.push(maximum);const {bytes,...identity}=parent;fieldParents.push(identity);
			}
			maxima.push(channels);await run.progress('envelopes','Authenticated and reduced all fifteen '+order+' field envelopes.');
		}
		const primary=primaryEnvelope(input),eps=Number.EPSILON,count=input.mu.length*input.phi,samples=Math.max(input.intervals,native.maximumPathSamples,operators.maximumPathSamples);
		const phase=Math.max(operators.phaseGridMaximum,operators.phaseQueryMaximum)*(1+64*eps*count);
		/** Reduce strictly ordered field support to its smallest positive interval.
		 * @param {number[]} nodes - Authenticated native support axis.
		 * @returns {number} - Minimum finite positive spacing.
		 */
		const gaps=(nodes)=>{const gap=Math.min(...nodes.slice(1).map((v,i)=>v-nodes[i]));if(!Number.isFinite(gap) || gap<=0)throw new Error('Invalid native support spacing.');return gap;};
		const spatialMargin=(1+2e-6/gaps(input.radial))*(1+2e-6/gaps(input.altitudes));
		const channels=primary.map((envelope,c)=>{
			const primaryNorm=operators.maximumKernelMass[0][c]*(1+64*eps*samples),transport=operators.maximumKernelMass[1][c]*(1+64*eps*samples)*spatialMargin;
			const S=[envelope.maximum,...maxima.map(order=>order[c])],L=[primaryNorm*S[0],...S.slice(1).map(value=>transport*value)];
			const sourceRoundoff=[0,0,0,0],radianceRoundoff=[64*eps*samples*L[0],0,0,0],sourceTail=[0,0,0,0],radianceTail=[S[0]*Math.exp(-32),0,0,0];
			for(let n=1;n<4;n++) {
				sourceRoundoff[n]=phase*(radianceRoundoff[n-1]+64*eps*count*L[n-1]);
				radianceRoundoff[n]=transport*(sourceRoundoff[n]+64*eps*samples*S[n]);
				sourceTail[n]=phase*radianceTail[n-1];radianceTail[n]=transport*sourceTail[n]+S[n]*Math.exp(-32);
			}
			return {primaryNorm,transport,maximumSourceFunctions:S,maximumIncomingRadiance:L,sourceRoundoff,radianceRoundoff,sourceTail,radianceTail};
		});
		if(channels.some(row=>Object.values(row).some(value=>Array.isArray(value) ? value.some(v=>!Number.isFinite(v) || v<0) : !Number.isFinite(value) || value<0)))throw new Error('Invalid derived positive bounds.');
		await run.write('field-inputs.json',JSON.stringify({parents:fieldParents,operation:'Reduce the maximum absolute binary64 source-function coefficient from each authenticated field, one artifact at a time; source fields remain unchanged.'},null,'\t'));
		await run.write('result.json',JSON.stringify({schema:'native-finite-operator-bounds-v1',nativeRun:name,nativeSourceSha256:sourceParent.artifactSha256,operators,primary,phase,spatialMargin,samples,channels,
			claim:'Finite native construction/query positive-operator tail and conservative roundoff bounds only. Source-function bounds are normalized J/extinction; multiply by physical extinction for J. View/receiver arithmetic and all empirical spatial/angular/path uncertainties remain separate. No candidate accuracy or convergence acceptance.'},null,'\t'));
		await run.finish('accepted');console.log(JSON.stringify({run:run.name,native:name,phase,samples,maximumRadianceRoundoff:Math.max(...channels.flatMap(c=>c.radianceRoundoff)),maximumRadianceTail:Math.max(...channels.flatMap(c=>c.radianceTail)),qualified:false}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
