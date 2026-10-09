import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {shellLogReconstructionFactor} from './shell-reconstruction.js';
import {createShellLayout,shellStencil} from './shell-layout.js';
import {addShellBoundarySupport} from './shell-layout-refinement.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Freeze a distinct reconstruction policy without altering historical layout evidence.
 * @returns {Promise<void>} - Sealed new layout and compatible unchanged limits.
 */
async function main() {
	const run=await ExperimentRun.create('p3-layout-v2');
	try {
		const parent=await readParent(process.argv[2] ?? '00049-p3-shell-proof','layout.json'),gateParent=await readParent(parent.run,'gates.json');
		/** @type {LocalSunShellLayout} */
		let layout={...JSON.parse(new TextDecoder().decode(parent.bytes)),schema:'local-sun-shell-layout-v2',reconstruction:'incident-density'};
		const controlParent=await readParent('00018-controls','controls.json');
		let addedAltitudes=[];
		if(process.argv.includes('--refine')) {
			const controls=JSON.parse(new TextDecoder().decode(controlParent.bytes)),state=controls.states.find((/** @type {{id:string}} */ s)=>s.id==='flat-0');
			const fractions=state.geometry.cacheRadialNodes.map((/** @type {Distance} */ n)=>n.value/state.geometry.cacheRadialMaximum.value);
			const refined=fractions.flatMap((/** @type {number} */ f,/** @type {number} */ i)=>i===fractions.length-1 ? [f] : [f,(f+fractions[i+1])/2]);
			const altitudes=layout.rows.map(r=>r.z),scale=CANONICAL_ATMOSPHERE_CONSTANTS.rayleighScaleHeight.value;
			if(process.argv.includes('--vertical-refine')) {
				for(let i=0;i<altitudes.length-1;i++)if(altitudes[i]<4*scale && altitudes[i+1]-altitudes[i]>scale/2)addedAltitudes.push((altitudes[i]+altitudes[i+1])/2);
			}
			layout={...createShellLayout({height:layout.height,top:layout.top,maximumRho:layout.maximumRho,altitudes:[...altitudes,...addedAltitudes].sort((a,b)=>a-b),radialFractions:refined,axisSupport:process.argv.includes('--axis-support')}),schema:addedAltitudes.length ? 'local-sun-shell-layout-v5' : process.argv.includes('--axis-support') ? 'local-sun-shell-layout-v4' : 'local-sun-shell-layout-v3',reconstruction:'incident-density'};
		}
		if(process.argv.includes('--radius-stencil'))layout={...layout,schema:'local-sun-shell-layout-v6',interpolation:'euclidean-radius'};
		if(process.argv.includes('--geometric-density'))layout={...layout,schema:'local-sun-shell-layout-v7',reconstruction:'geometric-density'};
		const boundaryMultiples=process.argv.includes('--boundary-bisect') ? [.25,.5,1,2,4,8,16] : [.25,1,4,16];
		if(process.argv.includes('--boundary-support') || process.argv.includes('--boundary-bisect'))layout=addShellBoundarySupport(layout,boundaryMultiples);
		const gates=JSON.parse(new TextDecoder().decode(gateParent.bytes));
		gates.schema='local-sun-shell-layout-gates-v2';gates.parent={run:gateParent.run,artifact:gateParent.artifact,sha256:gateParent.artifactSha256};
		gates.layout.reconstruction='Positive physical J samples interpolated after removing continuous canonical extinction times direct incident decay, then restored at the query; physical equations, omission and all acceptance limits unchanged. Resolution derives from the recorded refinement parameters.';
		if(layout.reconstruction==='geometric-density')gates.layout.reconstruction='Positive physical J samples interpolated after removing canonical extinction times unattenuated inverse-square geometric dilution, then restored at the query. Direct-beam attenuation is retained in physical J1, not used as a higher-order interpolation factor. Physical equations, nodes, omission and numerical limits are unchanged.';
		const implementation=[];
		for(const name of ['derive-shell-layout.js','shell-layout.js','shell-layout-refinement.js','shell-reconstruction.js','ExperimentRun.js','parent-evidence.js','run-boundary.js','../../src/algorithm32/implementation/canonical-atmosphere/consts.js','../../src/algorithm32/profiles/native-15/consts.js']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',name);await checkPath(repositoryRoot,target);
			const bytes=await readFile(target);implementation.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});await run.write('source-'+name.replaceAll('/','-'),bytes);
		}
		let factors=0,maximumNodeWeightError=0;
		for(const node of layout.nodes) {const taps=shellStencil(layout,node.rho,node.z),own=taps.indices.indexOf(node.index);maximumNodeWeightError=Math.max(maximumNodeWeightError,Math.abs(1-(own<0 ? 0 : taps.weights[own])));}
		if(maximumNodeWeightError>1e-10)throw new Error('Refined compact-node round trip failed.');
		for(const node of layout.nodes)for(let c=0;c<15;c++) {
			const factor=shellLogReconstructionFactor(layout,node.rho,node.z,c);
			if(!Number.isFinite(factor) || Math.exp(factor)<=0)throw new Error('Nonpositive reconstruction factor.');factors++;
		}
		await run.write('inputs.json',JSON.stringify({parents:[parent,gateParent,controlParent].map(({bytes,...identity})=>identity),implementation,command:process.argv.slice(1),
			operation:'Derive analytic reconstruction policy, optionally bisect frozen radial seeds, add ground-referenced near-axis shell radii, bisect altitude intervals wider than half a Rayleigh scale height below four scale heights, preserve Euclidean radius with positive boundary fans, select geometric rather than direct-attenuated normalization, and add row-local cylinder support at extinction length scales, optionally geometrically bisecting its existing scale intervals; no empirical fit or tolerance change',parameters:{refine:process.argv.includes('--refine'),axisSupport:process.argv.includes('--axis-support'),verticalRefine:process.argv.includes('--vertical-refine'),radiusStencil:process.argv.includes('--radius-stencil'),geometricDensity:process.argv.includes('--geometric-density'),boundarySupport:process.argv.includes('--boundary-support') || process.argv.includes('--boundary-bisect'),boundaryExtinctionLengthMultiples:boundaryMultiples,addedAltitudes},tools:{node:process.version}},null,'\t'));
		await run.write('layout.json',JSON.stringify(layout,null,'\t'));await run.write('gates.json',JSON.stringify(gates,null,'\t'));
		await run.write('result.json',JSON.stringify({schema:'shell-reconstruction-contract-v1',factors,maximumNodeWeightError,retainedNodes:layout.nodes.length,omittedBands:layout.omittedBands,
			claim:'Positive analytic factor and compact-node address round trips only; rendered accuracy requires a new candidate run.'},null,'\t'));
		await run.finish('accepted');console.log(run.name);
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
