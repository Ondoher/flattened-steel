import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {residual} from './rotation-model.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Compare a new candidate to preserved independent J2 evidence with exact physical compatibility.
 * @returns {Promise<void>} - New derivative proof; inconclusive references never supply acceptance.
 */
async function main() {
	const run=await ExperimentRun.create('p3-reference-cmp');
	try {
		const name=process.argv[2];if(!name)throw new Error('Candidate capture is required.');
		const captureParent=await readParent(name,'result.json'),recipeParent=await readParent(name,'recipe.json'),gateParent=await readParent(name,'gates.json');
		/** @type {LocalSunShellSecondaryCapture} */
		const capture=JSON.parse(new TextDecoder().decode(captureParent.bytes));
		/** @type {LocalSunShellCaptureRequest} */
		const recipe=JSON.parse(new TextDecoder().decode(recipeParent.bytes));
		const gates=JSON.parse(new TextDecoder().decode(gateParent.bytes)),queries=capture.results.find(r=>r.candidate)?.secondary;
		if(!queries?.length)throw new Error('Missing captured physical query inventory.');
		const parents=[captureParent,recipeParent,gateParent],referenceNames=process.argv.slice(3);
		if(!referenceNames.length)throw new Error('Independent reference runs are required.');
		const points=[];
		for(const referenceName of referenceNames) {
			const parent=await readParent(referenceName,'result.json',true),inputParent=await readParent(referenceName,'inputs.json',true);parents.push(parent,inputParent);
			/** @type {LocalSunShellSecondaryProofSubset} */
			const reference=JSON.parse(new TextDecoder().decode(parent.bytes));
			const inputs=JSON.parse(new TextDecoder().decode(inputParent.bytes)),state=inputs.parameters.state;
			if(inputs.parameters.diagnostic || inputs.referencePolicy!=='binary64-primary-simpson-square-coordinate-v2' ||
				inputs.parameters.radius!==recipe.layout.maximumRho || JSON.stringify(state.source)!==JSON.stringify(recipe.state.source) ||
				state.geometry.sourcePosition.coordinates[2]!==recipe.layout.height || state.geometry.topAltitude.value!==recipe.layout.top)
				throw new Error('Independent reference physical/schema compatibility failed.');
			for(const p of reference.results) {
				const previous=points.findIndex(q=>q.point.join(',')===p.point.join(','));
				if(previous>=0) {
					if(points[previous].converged)throw new Error('Cannot replace a qualified reference cell in this comparison.');
					points[previous]=p;
				}else points.push(p);
			}
		}
		const identities=[];
		for(const name of ['compare-shell-reference.js','rotation-model.js','ExperimentRun.js','parent-evidence.js','run-boundary.js']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',name);await checkPath(repositoryRoot,target);
			const bytes=await readFile(target);identities.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});await run.write('source-'+name,bytes);
		}
		await run.write('inputs.json',JSON.stringify({schema:'shell-reference-comparison-inputs-v1',parents:parents.map(({bytes,...identity})=>identity),identities,
			operation:'Compare new physical J2 packets to unchanged compatible binary64 reference values; preserve convergence flags and add measured uncertainty to acceptance error',
			command:process.argv.slice(1),tools:{node:process.version}},null,'\t'));
		const results=[],spatialRms=[],spatialLinf=[];
		let inconclusive=0,rejected=0,accepted=0;
		for(const point of points) {
			const group=queries.filter(q=>q.point.join(',')===point.point.join(','));
			if(group.length!==point.outgoing.length || group.some((q,i)=>JSON.stringify(q.direction)!==JSON.stringify(point.outgoing[i])))throw new Error('Physical direction/query inventory mismatch.');
			const observed=group.map(q=>q.orders.J2),physical=residual(observed.flat(),point.reference.flat(),1e-12,0.1);
			let pass=point.converged,fail=false;
			for(let d=0;d<group.length;d++) {
				const scale=Math.max(...point.reference[d].map(Math.abs),gates.comparison.normalizationFloor);
				let sum=0,maximum=0;
				for(let c=0;c<15;c++) {
					const error=Math.abs(observed[d][c]-point.reference[d][c]),budget=point.uncertainty[d][c],tolerance=1e-12+0.1*Math.abs(point.reference[d][c]);
					pass &&= Number.isFinite(error) && observed[d][c]>=-1e-12 && error+budget<=tolerance;
					fail ||= point.converged && (!Number.isFinite(error) || error-budget>tolerance);
					const normalized=(error+budget)/scale;sum+=normalized*normalized;maximum=Math.max(maximum,normalized);
				}
				spatialRms.push(Math.sqrt(sum/15));spatialLinf.push(maximum);
			}
			const disposition=fail ? 'rejected' : pass ? 'accepted' : 'inconclusive';
			if(disposition==='rejected')rejected++;else if(disposition==='accepted')accepted++;else inconclusive++;
			results.push({index:point.index,point:point.point,physical,referenceConverged:point.converged,disposition});
		}
		spatialRms.sort((a,b)=>a-b);
		const spatial={maximumNormalizedLInf:Math.max(...spatialLinf),p95NormalizedRms:spatialRms[Math.ceil(spatialRms.length*.95)-1]};
		const full=points.length*7===queries.length,spatialPass=spatial.maximumNormalizedLInf<=gates.comparison.spatialMaximumNormalizedLInf && spatial.p95NormalizedRms<=gates.comparison.spatialMaximumP95NormalizedRms;
		await run.write('result.json',JSON.stringify({schema:'shell-reference-comparison-v1',results,accepted,rejected,inconclusive,full,spatial,spatialPass,qualified:full && !rejected && !inconclusive && spatialPass,
			claim:'J2 only; complete higher-order fields/rays, omission, movement and resource gates remain open.'},null,'\t'));
		await run.finish(rejected || !spatialPass ? 'rejected' : 'accepted');console.log(JSON.stringify({run:run.name,accepted,rejected,inconclusive,full,spatial,spatialPass}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
