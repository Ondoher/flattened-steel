import path from 'node:path';
import {readFile,mkdir} from 'node:fs/promises';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {independentDirections} from './secondary-oracle.js';
import {nativeHemisphereQuadrature} from './native-hemisphere-quadrature.js';
import {nativeNestedOutgoingPolarSupport} from './native-outgoing-polar.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS as atmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../src/algorithm32/profiles/native-15/consts.js';

/** Independently bisect a physical reference axis without candidate nodes.
 * @param {number[]} original - Pinned production physical nodes.
 * @param {number} refinements - Zero through three bisections.
 * @returns {number[]} - Strictly ordered complete reference axis.
 */
function refine(original,refinements) {
	let values=original;
	for(let i=0;i<refinements;i++)values=values.flatMap((v,index)=>index===values.length-1 ? [v] : [v,(v+values[index+1])/2]);
	return values;
}

/** Compile and execute an experiment-owned independent binary64 recurrence proof.
 * Uses the installed framework compiler, not an added test suite or dependency.
 * @returns {Promise<void>} - New immutable native source, inputs, tool identity and result.
 */
async function main() {
	await requireHeavyExecution();
	const run=await ExperimentRun.create('p3-native-ref');
	try {
		const name=process.argv[2] ?? '00097-p3-shell-v3a',spatial=Number(process.argv[3] ?? 0),muCount=Number(process.argv[4] ?? 8),intervals=Number(process.argv[5] ?? 60),spectralBatch=process.argv.includes('--packet') ? 3 : 1,pathRule=process.argv.includes('--piecewise') ? 'piecewise-gauss-v1' : 'simpson-square-v2';
		if(![0,1,2,3].includes(spatial) || ![8,16,32,64,128].includes(muCount) || ![60,120,240,480,960].includes(intervals))throw new Error('Invalid independent reference refinement.');
		const threads=Number(process.argv.find(value=>value.startsWith('--threads='))?.slice('--threads='.length) ?? 4);
		if(![1,2,4].includes(threads))throw new Error('Native proof uses one, two or four owned compute workers.');
		const recipeParent=await readParent(name,'recipe.json'),captureParent=await readParent(name,'result.json'),controlParent=await readParent('00018-controls','controls.json'),gateParent=await readParent(name,'gates.json');
		/** @type {LocalSunShellCaptureRequest} */
		const recipe=JSON.parse(new TextDecoder().decode(recipeParent.bytes));
		/** @type {LocalSunShellSecondaryCapture} */
		const capture=JSON.parse(new TextDecoder().decode(captureParent.bytes));
		const controls=JSON.parse(new TextDecoder().decode(controlParent.bytes)),state=controls.states.find((/** @type {{id:string}} */ s)=>s.id==='flat-0');
		const queries=capture.results.find(r=>r.candidate)?.secondary;
		if(!queries?.length || !recipe.state.source.distanceFalloff || recipe.state.source.radius.value>recipe.layout.height-recipe.layout.top)throw new Error('Unsupported independent physical query/source.');
		const dualEndpoint=process.argv.includes('--hemisphere-sine');
		const quarticOutgoing=process.argv.includes('--outgoing-quartic');
		const nestedOutgoing=process.argv.includes('--nested-outgoing') || quarticOutgoing;
		const hemisphere=process.argv.includes('--hemisphere') || dualEndpoint,phi=muCount*2;
		const directionRule=hemisphere ? nativeHemisphereQuadrature(muCount,phi,dualEndpoint) : independentDirections(muCount,phi,'sinh5');
		const nodes=directionRule.filter((_,i)=>i%phi===0).sort((a,b)=>a.direction[2]-b.direction[2]);
		const baseRadial=state.geometry.cacheRadialNodes.map((/** @type {Distance} */ n)=>n.value/state.geometry.cacheRadialMaximum.value*recipe.layout.maximumRho);
		const boundaryExtinction= Math.max(...CANONICAL_SPECTRAL_CHANNELS.map(c=>atmosphere.rayleighCoefficientScale*(c.wavelength.value/1000)**-4+atmosphere.mieAngstromBeta/atmosphere.mieScaleHeight.value*(c.wavelength.value/1000)**-atmosphere.mieAngstromAlpha));
		if(process.argv.includes('--boundary-support'))for(const multiple of [.125,.25,.5,1,2,4,8,16,32,64]) {
			const rho=recipe.layout.maximumRho-multiple/boundaryExtinction;if(rho>0)baseRadial.push(rho);
		}
		baseRadial.sort((a,b)=>a-b);
		const input={schema:'binary64-flat-recurrence-input-v1',height:recipe.layout.height,top:recipe.layout.top,radius:recipe.layout.maximumRho,
			...(hemisphere ? {polarRule:dualEndpoint ? 'hemisphere-sine2-v1' : 'hemisphere-sinh5-v1'} : {}),
			...(nestedOutgoing ? {outgoingPolarRule:quarticOutgoing ? 'nested-sine4-v1' : 'nested-sine2-v1',outgoingMu:nativeNestedOutgoingPolarSupport(muCount,quarticOutgoing ? 4 : 2)} : {}),
			altitudes:refine(state.geometry.cacheAltitudeNodes.map((/** @type {Distance} */ n)=>n.value),spatial),
			radial:refine([...new Set(baseRadial)],spatial),
			mu:nodes.map(n=>n.direction[2]),muWeights:nodes.map(n=>n.weight*phi/(2*Math.PI)),phi,phiOffset:process.argv.includes('--midpoint') ? .5 : 0,intervals,threads,spectralBatch,pathRule,
			rayleighHeight:atmosphere.rayleighScaleHeight.value,mieHeight:atmosphere.mieScaleHeight.value,g:atmosphere.miePhaseFunctionG,albedo:atmosphere.mieSingleScatteringAlbedo,
			betaR:CANONICAL_SPECTRAL_CHANNELS.map(c=>atmosphere.rayleighCoefficientScale*(c.wavelength.value/1000)**-4),
			betaM:CANONICAL_SPECTRAL_CHANNELS.map(c=>atmosphere.mieAngstromBeta/atmosphere.mieScaleHeight.value*(c.wavelength.value/1000)**-atmosphere.mieAngstromAlpha),
			irradiance:recipe.state.source.sourceIrradiance.values,referenceDistance:recipe.state.source.referenceDistance.value,sourceScale:recipe.state.source.referenceSpectralIncidentScale,
			queries:queries.map(q=>({point:q.point,direction:q.direction}))};
		const compiler='C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe',source=path.join(repositoryRoot,'experiments/local-sun-cache-reuse/ShellReference.cs');
		await checkPath(repositoryRoot,source);
		const frozenSourceName=process.argv.find(value=>value.startsWith('--source-run='))?.slice('--source-run='.length);
		const frozenSource=frozenSourceName ? await readParent(frozenSourceName,'ShellReference.cs') : null;
		if(quarticOutgoing && frozenSource)throw new Error('Quartic outgoing control requires the current explicit-support reference source.');
		const sourceBytes=frozenSource?.bytes ?? await readFile(source);await run.write('ShellReference.cs',sourceBytes);
		const exportFields=process.argv.includes('--export-fields');
		if(exportFields && frozenSource)throw new Error('Frozen historical source does not own the new export protocol.');
		const implementation=[];
		for(const relative of ['experiments/local-sun-cache-reuse/run-native-reference.js','experiments/local-sun-cache-reuse/heavy-execution-admission.js','experiments/local-sun-cache-reuse/secondary-oracle.js','experiments/local-sun-cache-reuse/primary-oracle.js',
			'experiments/local-sun-cache-reuse/native-hemisphere-quadrature.js',
			'experiments/local-sun-cache-reuse/native-outgoing-polar.js',
			'experiments/local-sun-cache-reuse/ExperimentRun.js','experiments/local-sun-cache-reuse/parent-evidence.js','experiments/local-sun-cache-reuse/run-boundary.js',
			'src/algorithm32/implementation/canonical-atmosphere/consts.js','src/algorithm32/profiles/native-15/consts.js']) {
			const target=path.join(repositoryRoot,relative);await checkPath(repositoryRoot,target);const bytes=await readFile(target);
			implementation.push({path:relative,sha256:hash(bytes)});await run.write('source-'+relative.replaceAll('/','-'),bytes);
		}
		const executable=path.join(run.root,'ShellReference.exe'),output=path.join(run.root,'native.json'),scratch=path.join(run.root,'compiler-tmp');
		for(const target of [executable,output,scratch])await checkPath(run.root,target);await mkdir(scratch);
		const compileArgs=['/nologo','/optimize+','/platform:x64','/target:exe','/reference:System.Web.Extensions.dll','/out:'+executable,path.join(run.root,'ShellReference.cs')];
		await run.write('input.json',JSON.stringify(input,null,'\t'));
		const fieldDirectory=path.join(run.root,'fields');
		if(exportFields){await checkPath(run.root,fieldDirectory);await mkdir(fieldDirectory);}
		const executionArgs=[path.join(run.root,'input.json'),output,...(exportFields ? [fieldDirectory] : [])];
		await run.write('inputs.json',JSON.stringify({schema:'native-reference-provenance-v1',parents:[recipeParent,captureParent,controlParent,gateParent,...(frozenSource ? [frozenSource] : [])].map(({bytes,...identity})=>identity),implementation,
			operation:'Independent binary64 recurrence on bisected rho/z tensor grid and Gaussian sinh5/product azimuth domain. Simpson-squared or piecewise Gaussian transport is explicitly selected; the latter splits at reference rho/z/azimuth interpolation knots, physical density levels, closest approach and optical-depth levels. Interpolate J/extinction. Exact complex phase Fourier convolution is checked against direct scalar sums. Packet mode shares continuous columns/phase and retains tau>=32 in every channel; every path/angular policy requires fresh convergence evidence.',
			parameters:{spatial,muCount,phi,hemisphere,dualEndpoint,nestedOutgoing,quarticOutgoing,phiOffset:input.phiOffset,intervals,threads:input.threads,spectralBatch,pathRule,piecewiseGaussOrder:pathRule==='piecewise-gauss-v1' ? intervals/30 : null,boundarySupport:process.argv.includes('--boundary-support'),boundaryExtinction,boundaryExtinctionLengthMultiples:[.125,.25,.5,1,2,4,8,16,32,64]},sourceSha256:hash(sourceBytes),tools:{node:process.version,compiler,compilerSha256:hash(await readFile(compiler)),compileArgs},command:process.argv.slice(1),
			exportFields,executionArgs,limitations:'Developmental reference until separate spatial/angular/path convergence and tail budgets pass; no candidate data enters native computation. Optional raw grids are independently computed source functions, not candidate data. Frozen source selection retains its original hash and parent derivation.'},null,'\t'));
		const compiled=await promisify(execFile)(compiler,compileArgs,{windowsHide:true,env:{...process.env,TEMP:scratch,TMP:scratch}});
		await run.write('compile.txt',compiled.stdout+compiled.stderr);await run.progress('native','Compiled independent binary64 recurrence.');
		await new Promise((resolve,reject)=>{
			const child=spawn(executable,executionArgs,{windowsHide:true,env:{...process.env,TEMP:scratch,TMP:scratch},stdio:['ignore','pipe','pipe']});
			let failure='';
			child.stdout.on('data',bytes=>{const message=String(bytes).trim();console.log(message);void run.progress('native',message);});
			child.stderr.on('data',bytes=>{failure+=String(bytes);});child.once('error',reject);
			child.once('exit',code=>code===0 ? resolve(undefined) : reject(new Error(`Native reference exited ${code}: ${failure}`)));
		});
		const result=JSON.parse(await readFile(output,'utf8'));
		if(result.packets.length!==queries.length || result.packets.some((/** @type {Record<string,number[]>} */ p)=>Object.values(p).some(v=>v.length!==15 || v.some(x=>!Number.isFinite(x) || x< -1e-12))))throw new Error('Invalid independent native output.');
		await run.write('result.json',JSON.stringify({...result,refinement:{spatial,muCount,phi,intervals},qualified:false},null,'\t'));
		await run.finish('accepted');console.log(JSON.stringify({run:run.name,elapsed:result.elapsedMilliseconds,fftWorstAbsolute:result.fftWorstAbsolute,qualified:false}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
