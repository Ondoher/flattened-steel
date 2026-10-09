import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {primaryDensity} from './primary-oracle.js';
import {residual} from './rotation-model.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Check every withheld first-order spectral packet against the independent analytic density.
 * @returns {Promise<void>} - New immutable physical and spatial measurements for J1 alone.
 */
async function main() {
	const run=await ExperimentRun.create('p3-primary-cmp');
	try {
		const name=process.argv[2];if(!name)throw new Error('A captured candidate run is required.');
		const parents=await Promise.all(['result.json','recipe.json','gates.json'].map(file=>readParent(name,file)));
		/** @type {LocalSunShellSecondaryCapture} */
		const capture=JSON.parse(new TextDecoder().decode(parents[0].bytes));
		/** @type {LocalSunShellCaptureRequest} */
		const recipe=JSON.parse(new TextDecoder().decode(parents[1].bytes));
		const gates=JSON.parse(new TextDecoder().decode(parents[2].bytes));
		const identities=[];
		for(const relative of ['compare-shell-primary.js','primary-oracle.js','continuous-reference.js','rotation-model.js','ExperimentRun.js','parent-evidence.js','run-boundary.js']) {
			const file=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',relative);await checkPath(repositoryRoot,file);
			const bytes=await readFile(file);identities.push({path:path.relative(repositoryRoot,file).replaceAll('\\','/'),sha256:hash(bytes)});await run.write('source-'+relative,bytes);
		}
		await run.write('inputs.json',JSON.stringify({schema:'shell-primary-comparison-input-v1',parents:parents.map(({bytes,...identity})=>identity),identities,
			operation:'Evaluate continuous binary64 analytic J1 at every captured withheld physical query; compare actual GPU field reconstruction and report each path separately',
			parameters:{state:recipe.state,roundoffRelativeBudget:1e-12},tools:{node:process.version},command:process.argv.slice(1)},null,'\t'));
		const results=[];
		for(const pathCapture of capture.results) {
			const queries=pathCapture.secondary;
			if(queries.length!==294 || queries.some(q=>q.orders.J1?.length!==15))throw new Error('The complete first-order query matrix was not captured.');
			const packets=queries.map(q=>{
				const reference=primaryDensity(recipe.state,q.point,q.direction),observed=q.orders.J1;
				const scale=Math.max(gates.comparison.normalizationFloor,...reference.map(Math.abs));
				const uncertainty=reference.map(v=>Math.abs(v)*1e-12),normalized=reference.map((v,c)=>(Math.abs(v-observed[c])+uncertainty[c])/scale);
				const physical=residual(observed,reference,1e-12,0.1);
				const accepted=reference.every((v,c)=>Number.isFinite(observed[c]) && observed[c]>=-1e-12 && Math.abs(v-observed[c])+uncertainty[c]<=1e-12+0.1*Math.abs(v));
				return {...q,reference,uncertainty,physical,accepted,normalizedLInf:Math.max(...normalized),normalizedRms:Math.sqrt(normalized.reduce((sum,v)=>sum+v*v,0)/15)};
			});
			const sorted=packets.map(p=>p.normalizedRms).sort((a,b)=>a-b);
			const spatial={maximumNormalizedLInf:Math.max(...packets.map(p=>p.normalizedLInf)),p95NormalizedRms:sorted[Math.ceil(sorted.length*.95)-1]};
			const qualified=packets.every(p=>p.accepted) && spatial.maximumNormalizedLInf<=gates.comparison.spatialMaximumNormalizedLInf && spatial.p95NormalizedRms<=gates.comparison.spatialMaximumP95NormalizedRms;
			results.push({candidate:pathCapture.candidate,packets,spatial,qualified});
		}
		await run.write('result.json',JSON.stringify({schema:'shell-primary-comparison-v1',results,claim:'J1 reconstruction only; no transported/higher-order, ray, reuse or resource qualification.'},null,'\t'));
		await run.finish(results.find(r=>r.candidate)?.qualified ? 'accepted' : 'rejected');
		console.log(JSON.stringify({run:run.name,results:results.map(({packets,...facts})=>({...facts,acceptedPackets:packets.filter(p=>p.accepted).length}))}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
