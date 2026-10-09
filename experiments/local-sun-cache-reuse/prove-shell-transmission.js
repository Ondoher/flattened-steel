import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {transmission} from './continuous-reference.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Diagnose measured CPU/GPU view transmission against analytic flat columns.
 * @returns {Promise<void>} - Immutable transmission-only physical evidence.
 */
async function main() {
	const run=await ExperimentRun.create('p3-view-t-proof');
	try {
		const name=process.argv[2],parents=await Promise.all(['result.json','recipe.json','gates.json'].map(file=>readParent(name,file)));
		const capture=JSON.parse(new TextDecoder().decode(parents[0].bytes)),recipe=JSON.parse(new TextDecoder().decode(parents[1].bytes));
		const identities=[];
		for(const relative of ['experiments/local-sun-cache-reuse/prove-shell-transmission.js','experiments/local-sun-cache-reuse/continuous-reference.js',
			'experiments/local-sun-cache-reuse/ExperimentRun.js','experiments/local-sun-cache-reuse/parent-evidence.js','experiments/local-sun-cache-reuse/run-boundary.js',
			'src/algorithm32/implementation/canonical-atmosphere/consts.js','src/algorithm32/profiles/native-15/consts.js']) {
			const file=path.join(repositoryRoot,relative);await checkPath(repositoryRoot,file);const bytes=await readFile(file);
			identities.push({path:relative,sha256:hash(bytes)});await run.write('source-'+relative.replaceAll('/','-'),bytes);
		}
		const results=capture.results.map((/** @type {LocalSunShellTransmissionCapturePath} */ captured)=>{
			const rays=captured.cpuRays.map((q,index)=>{
				const s=q.segment,length=s.endDistance.value-s.startDistance.value;
				const a=s.ray.origin.coordinates[2]+s.ray.direction[2]*s.startDistance.value,b=s.ray.origin.coordinates[2]+s.ray.direction[2]*s.endDistance.value;
				if(a< -1e-6 || b< -1e-6 || a>recipe.layout.top+1e-6 || b>recipe.layout.top+1e-6)throw new Error('Transmission ray outside slab.');
				const reference=transmission(Math.max(0,a),Math.min(recipe.layout.top,Math.max(0,b)),length);
				const checks=[q.transmittance,captured.gpuRays[index].transmittance].map(values=>{
					const ratios=values.map((v,c)=>Math.abs(v-reference[c])/(1e-7+.02*Math.abs(reference[c])));
					return {maximumGateRatio:Math.max(...ratios),failedChannels:ratios.filter(v=>!Number.isFinite(v) || v>1).length};
				});
				return {index,reference,cpu:checks[0],gpu:checks[1]};
			});
			return {candidate:captured.candidate,rays,qualified:rays.every(r=>!r.cpu.failedChannels && !r.gpu.failedChannels)};
		});
		await run.write('inputs.json',JSON.stringify({schema:'shell-view-transmission-input-v1',parents:parents.map(({bytes,...identity})=>identity),identities,
			operation:'Analytic exponential flat-medium columns at captured physical view segments; compare all CPU and GPU spectral transmission channels',
			parameters:{absoluteTolerance:1e-7,relativeTolerance:.02,slabRoundoffMeters:1e-6},tools:{node:process.version},command:process.argv.slice(1)},null,'\t'));
		await run.write('result.json',JSON.stringify({schema:'shell-view-transmission-v1',results,claim:'Transmission only; ray radiance and direct/receiver lighting remain separate physical gates.'},null,'\t'));
		await run.finish(results.find(r=>r.candidate)?.qualified ? 'accepted' : 'rejected');
		console.log(JSON.stringify({run:run.name,results:results.map(r=>({candidate:r.candidate,qualified:r.qualified,cpuFailures:r.rays.reduce((n,r)=>n+r.cpu.failedChannels,0),gpuFailures:r.rays.reduce((n,r)=>n+r.gpu.failedChannels,0)}))}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
