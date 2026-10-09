import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {secondaryDensity} from './secondary-oracle.js';
import {residual} from './rotation-model.js';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER as domain} from '../../src/algorithm32/sampling-domains/direction/fibonacci/consts.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {balancedShellIncoming,partitionedShellIncoming} from './shell-angular.js';

/** Diagnose the inherited angular control independently of candidate spatial lookup.
 * @returns {Promise<void>} - Immutable bounded alternatives, never physical acceptance alone.
 */
async function main() {
	const run=await ExperimentRun.create('p3-angular-diag');
	try {
		const referenceParent=await readParent(process.argv[2],'result.json',true);
		const sourceParent=await readParent(process.argv[3],'recipe.json');
		/** @type {LocalSunShellSecondaryProofSubset} */
		const reference=JSON.parse(new TextDecoder().decode(referenceParent.bytes));
		/** @type {LocalSunShellCaptureRequest} */
		const recipe=JSON.parse(new TextDecoder().decode(sourceParent.bytes));
		const nodes=domain.unitVectors.map((direction,i)=>({direction,weight:domain.integrationWeights.values[i]}));
		const balanced=balancedShellIncoming();
		const balancedNodes=balanced.unitVectors.map((direction,i)=>({direction,weight:balanced.integrationWeights.values[i]}));
		const partitioned=partitionedShellIncoming();
		const partitionedNodes=partitioned.unitVectors.map((direction,i)=>({direction,weight:partitioned.integrationWeights.values[i]}));
		const shifted=partitionedShellIncoming(48,.5),shiftedNodes=shifted.unitVectors.map((direction,i)=>({direction,weight:shifted.integrationWeights.values[i]}));
		const results=[];
		const selected=process.argv[4]?.split(',').map(Number);
		for(const point of reference.results.filter(p=>!selected || selected.includes(p.index))) {
			const paths=[];
			for(const candidate of ['control','midpoint','partitioned','shifted48'])for(const normalized of [false,true]) {
				const values=await secondaryDensity(recipe.state,point.point,point.outgoing,recipe.layout.maximumRho,8,16,960,
					async()=>{await new Promise(resolve=>setImmediate(resolve));},candidate==='shifted48' ? shiftedNodes : candidate==='partitioned' ? partitionedNodes : candidate==='midpoint' ? balancedNodes : nodes,normalized);
				paths.push({candidate,normalized,values,referenceResidual:residual(values.flat(),point.reference.flat(),1e-12,0.1),
					gpuControlResidual:residual(point.observed.flat(),values.flat(),1e-12,0.002)});
			}
			results.push({point:point.point,paths});
		}
		const inputs=[];
		for(const relative of ['diagnose-shell-angular.js','secondary-oracle.js','primary-oracle.js','continuous-reference.js','rotation-model.js','ExperimentRun.js','parent-evidence.js','run-boundary.js','shell-angular.js']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',relative);await checkPath(repositoryRoot,target);inputs.push({path:relative,sha256:hash(await readFile(target))});
		}
		await run.write('result.json',JSON.stringify({schema:'shell-angular-diagnosis-v1',results,nodes,balancedNodes,partitionedNodes,shiftedNodes,
			claim:'Continuous primary L1 under inherited F68, raw and normalized phase-kernel quadrature; independent GL references retain their recorded uncertainty. Bounded diagnosis only.'},null,'\t'));
		await run.write('inputs.json',JSON.stringify({parents:[referenceParent,sourceParent].map(({bytes,...identity})=>identity),inputs,
			operation:'Keep F68 nodes and weights; separate spatial/build error from discrete angular-integral bias; optional phase-kernel normalization',tools:{node:process.version}},null,'\t'));
		await run.finish('accepted');console.log(run.name);
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
