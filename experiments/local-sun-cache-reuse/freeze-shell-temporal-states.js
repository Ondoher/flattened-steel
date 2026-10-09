import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';
import {resolveShellState} from './resolve-shell-state.js';

/** Resolve the frozen exact-time trajectory inventory without evaluating a candidate or recording.
 * @returns {Promise<void>} - Sealed physical ingress for 120 states around each of five standard angles.
 */
async function main() {
	const run=await ExperimentRun.create('p5-time-inputs');
	try {
		const controlsParent=await readParent('00018-controls','controls.json'),gateParent=await readParent('00019-acceptance','gates.json');
		const controls=JSON.parse(new TextDecoder().decode(controlsParent.bytes)),gates=JSON.parse(new TextDecoder().decode(gateParent.bytes));
		if(!gates.matrix.temporal.startsWith('120 successive exact states') || gates.temporal.presentationInterpolationDuringQualification!==false)throw new Error('Frozen exact-time trajectory or unsmoothed-light contract changed.');
		const entry=path.join(repositoryRoot,'experiments/local-sun-cache-reuse/resolve-shell-state.js');await checkPath(repositoryRoot,entry);
		const commonjs=createRequire(import.meta.url)('@rollup/plugin-commonjs'),warnings=[];
		const bundle=await rollup({input:entry,plugins:[nodeResolve(),commonjs()],onwarn(warning){warnings.push({code:warning.code,message:warning.message});}});
		let files;try {files=bundle.watchFiles;}finally{await bundle.close();}
		const implementation=[];
		for(const target of [...new Set([...files,...['freeze-shell-temporal-states.js','ExperimentRun.js','parent-evidence.js','run-boundary.js'].map(name=>path.join(repositoryRoot,'experiments/local-sun-cache-reuse',name))])].filter(name=>!name.startsWith('\0'))) {
			await checkPath(repositoryRoot,target);const bytes=await readFile(target);implementation.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});
		}
		const trajectories=[];
		for(const id of ['flat-0','flat-45','flat-90','flat-135','flat-180']) {
			const center=controls.states.find(state=>state.id===id);if(!center)throw new Error('Missing frozen standard cadence.');
			const centerMilliseconds=Date.parse(center.observation.instant);
			if(!Number.isFinite(centerMilliseconds))throw new Error('Invalid frozen standard instant.');
			/** @type {LocalSunShellTemporalState[]} */ const states=[];
			for(let slot=0;slot<120;slot++) {
				const frameOffset=slot-60,presentationSeconds=frameOffset/30,physicalMilliseconds=presentationSeconds/60*86400000;
				const observation={...center.observation,instant:new Date(centerMilliseconds+physicalMilliseconds).toISOString()};
				states.push({slot,frameOffset,presentationSeconds,state:resolveShellState(observation)});
			}
			trajectories.push({id,centerInstant:center.observation.instant,states});await run.progress('physical-inputs',`Resolved ${id}: all 120 exact states, no candidate values.`);
		}
		if(trajectories.some(trajectory=>trajectory.states.length!==120 || trajectory.states.some((sample,index)=>index>0 && Date.parse(sample.state.observation.instant)-Date.parse(trajectory.states[index-1].state.observation.instant)!==48000)))throw new Error('Exact temporal clock inventory failed.');
		await run.write('inputs.json',JSON.stringify({schema:'shell-temporal-physical-inputs-v1',parents:[controlsParent,gateParent].map(({bytes,...identity})=>identity),implementation,warnings,parameters:{framesPerTrajectory:120,framesPerSecond:30,filmDurationSeconds:60,physicalHoursPerFilm:24,centerSlot:60},
			operation:'For slots 0..119, instant=centerInstant+(slot-60)/30/60*86400000 milliseconds. Resolve each exact source, geometry and execution state through the ordinary FlatLocalMode. No candidate cache, holdout outputs, lighting interpolation or video is evaluated.',command:process.argv.slice(1),tools:{node:process.version}},null,'\t'));
		await run.write('states.json',JSON.stringify({schema:'shell-temporal-states-v1',trajectories,claim:'Frozen exact physical input inventory only. Candidate accuracy, motion, frame timing, build avoidance and source review remain separate gates.'},null,'\t'));
		await run.finish('accepted');console.log(JSON.stringify({run:run.name,trajectories:trajectories.length,states:trajectories.reduce((sum,t)=>sum+t.states.length,0),candidateEvaluated:false}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
