import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Compare three independently refined native recurrence levels, retaining every unresolved channel.
 * @returns {Promise<void>} - One-dimensional convergence evidence; complete reference uncertainty needs all dimensions.
 */
async function main() {
	const run=await ExperimentRun.create('p3-ref-converge');
	try {
		const dimension=process.argv[2],names=process.argv.slice(3);
		if(!['spatial','angular','path'].includes(dimension) || names.length!==3)throw new Error('One refinement dimension and three native runs required.');
		const parents=[],levels=[],sourceHashes=[];
		for(const name of names) {
			const input=await readParent(name,'input.json'),result=await readParent(name,'result.json'),provenance=await readParent(name,'inputs.json');parents.push(input,result,provenance);
			/** @type {LocalSunNativeReferenceLevel} */
			const level={input:JSON.parse(new TextDecoder().decode(input.bytes)),result:JSON.parse(new TextDecoder().decode(result.bytes))};levels.push(level);
			const sourceHash=JSON.parse(new TextDecoder().decode(provenance.bytes)).sourceSha256;
			if(typeof sourceHash!=='string' || !/^[0-9a-f]{64}$/u.test(sourceHash))throw new Error('Missing independent reference source identity.');sourceHashes.push(sourceHash);
		}
		if(sourceHashes.some(value=>value!==sourceHashes[0]))throw new Error('One-dimensional convergence requires identical native implementation source.');
		const omitted=dimension==='spatial' ? ['radial','altitudes'] : dimension==='angular' ? ['mu','muWeights','phi'] : ['intervals'];
		const normalized=levels.map(l=>Object.fromEntries(Object.entries(l.input).filter(([key])=>!omitted.includes(key) && key!=='threads')));
		if(normalized.some(v=>JSON.stringify(v)!==JSON.stringify(normalized[0])))throw new Error('Refinement changes more than the declared reference dimension.');
		if(levels.some(l=>l.result.packets.length!==l.input.queries.length || l.input.spectralBatch!==levels[0].input.spectralBatch))throw new Error('Reference inventory or path policy mismatch.');
		for(let i=1;i<3;i++) {
			const a=levels[i-1].input,b=levels[i].input;
			if(dimension==='path' && b.intervals!==a.intervals*2 || dimension==='angular' && (b.mu.length!==a.mu.length*2 || b.phi!==a.phi*2) ||
				dimension==='spatial' && (b.radial.length!==(a.radial.length-1)*2+1 || b.altitudes.length!==(a.altitudes.length-1)*2+1))throw new Error('Reference levels are not successive independent bisections.');
		}
		const identities=[];
		for(const name of ['prove-native-convergence.js','ExperimentRun.js','parent-evidence.js','run-boundary.js']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',name);await checkPath(repositoryRoot,target);const bytes=await readFile(target);
			identities.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});await run.write('source-'+name,bytes);
		}
		await run.write('inputs.json',JSON.stringify({schema:'native-convergence-input-v1',parents:parents.map(({bytes,...identity})=>identity),identities,
			operation:'Three-level independent recurrence refinement: require successive changes to reduce by at least two and retain twice the final change as empirical uncertainty; no candidate values enter',
			parameters:{dimension,maximumBudgetFraction:.1,tinyDifferenceAbsolute:1e-15,nativeSourceSha256:sourceHashes[0]},command:process.argv.slice(1),tools:{node:process.version}},null,'\t'));
		const quantities=['J2','J3','J4','L1','L2','L3','gridJ2','gridJ3','gridJ4'],measurements=[];
		const includesFourth=levels.map(level=>level.result.packets.every(packet=>Array.isArray(packet.L4)));
		if(includesFourth.some(Boolean) && !includesFourth.every(Boolean))throw new Error('Fourth-order radiance coverage differs across reference levels.');
		if(includesFourth.every(Boolean))quantities.push('L4');
		for(const quantity of quantities) {
			const absolute=quantity.includes('J') ? 1e-12 : 1e-9;
			const packets=levels[2].input.queries.map((query,index)=>{
				const values=levels.map(l=>l.result.packets[index][quantity]);
				if(values.some(v=>v?.length!==15 || v.some(x=>!Number.isFinite(x))))throw new Error('Incomplete native spectral packet.');
				const delta1=values[1].map((v,c)=>Math.abs(v-values[0][c])),delta2=values[2].map((v,c)=>Math.abs(v-values[1][c]));
				const uncertainty=delta2.map(v=>2*v);
				const converged=uncertainty.map((v,c)=>v<=.1*(absolute+.1*Math.abs(values[2][c])) && (delta2[c]<1e-15 || delta2[c]<=delta1[c]/2));
				return {point:query.point,direction:query.direction,reference:values[2],delta1,delta2,uncertainty,converged};
			});
			const unresolvedChannels=packets.reduce((sum,p)=>sum+p.converged.filter(v=>!v).length,0);
			measurements.push({quantity,packets,unresolvedChannels,qualified:unresolvedChannels===0});
		}
		await run.write('result.json',JSON.stringify({schema:'native-convergence-v1',dimension,measurements,
			qualified:measurements.every(m=>m.qualified),claim:'One-dimensional empirical convergence only. Sum spatial/angular/path estimates with independently bounded tail and roundoff before candidate acceptance.'},null,'\t'));
		await run.finish('accepted');console.log(JSON.stringify({run:run.name,dimension,measurements:measurements.map(({packets,...summary})=>summary)}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
