import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {secondaryDensity} from './secondary-oracle.js';
import {PRIMARY_ORACLE_POLICY} from './primary-oracle.js';
import {residual} from './rotation-model.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Measure second-order candidate error against independently refined primary transport.
 * @returns {Promise<void>} - One sealed diagnostic or acceptance/rejection proof.
 */
async function main() {
	const run=await ExperimentRun.create('p3-j2-reference');
	try {
		const parentName=process.argv[2];if(!parentName)throw new Error('Captured source run is required.');
		const parent=await readParent(parentName,'result.json');
		const recipeParent=await readParent(parentName,'recipe.json');
		const gatesParent=await readParent(parentName,'gates.json');
		/** @type {LocalSunShellSecondaryCapture} */
		const capture=JSON.parse(new TextDecoder().decode(parent.bytes));
		/** @type {LocalSunShellCaptureRequest} */
		const recipe=JSON.parse(new TextDecoder().decode(recipeParent.bytes));
		const queries=capture.results.find(r=>r.candidate)?.secondary;
		if(!queries?.length)throw new Error('Captured candidate secondary queries absent.');
		const points=[...new Map(queries.map(q=>[q.point.join(','),q.point])).values()];
		const selected=process.argv[3]==='all' ? points.map((_,i)=>i) : (process.argv[3] ?? '6').split(',').map(Number);
		if(selected.some(i=>!Number.isInteger(i) || i<0 || i>=points.length))throw new Error('Invalid point selection.');
		const diagnostic=process.argv[4]==='diagnostic';
		const maximumMu=diagnostic ? 32 : Number(process.argv[4] ?? 32);
		const polarTransform=process.argv[5]==='sinh10' ? 'sinh10' : process.argv[5]==='sinh5' ? 'sinh5' : 'uniform';
		const azimuthRule=process.argv.includes('--gauss-azimuth') ? 'quadrant-gauss' : 'uniform';
		if(![32,64,128,256,512].includes(maximumMu))throw new Error('Invalid reference refinement cap.');
		const implementations=[];
		for(const name of ['prove-shell-secondary.js','secondary-oracle.js','primary-oracle.js','continuous-reference.js','ExperimentRun.js','run-boundary.js','parent-evidence.js']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',name);await checkPath(repositoryRoot,target);
			const bytes=await readFile(target);
			implementations.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});
			await run.write('source-'+name,bytes);
		}
		for(const relative of ['src/algorithm32/implementation/canonical-atmosphere/consts.js','src/algorithm32/profiles/native-15/consts.js','experiments/local-sun-cache-reuse/rotation-model.js']) {
			const target=path.join(repositoryRoot,relative);await checkPath(repositoryRoot,target);implementations.push({path:relative,sha256:hash(await readFile(target))});
		}
		await run.write('inputs.json',JSON.stringify({schema:'shell-secondary-reference-inputs-v1',
			parents:[parent,recipeParent,gatesParent].map(({bytes,...identity})=>identity),implementations,
			command:process.argv.slice(1),parameters:{selected,diagnostic,maximumMu,polarTransform,azimuthRule,radius:recipe.layout.maximumRho,state:recipe.state},
			operation:'Binary64 continuous L1 with analytic primary/extinction and Simpson t=L*u^2; independent Gauss-Legendre product angular J2; candidate fields only supply comparison values',referencePolicy:PRIMARY_ORACLE_POLICY,
			tools:{node:process.version}},null,'\t'));
		const results=[],started=performance.now();
		for(const index of selected) {
			const point=points[index],group=queries.filter(q=>q.point.join(',')===point.join(','));
			const outgoing=group.map(q=>q.direction);
			/** @type {Map<string,number[][]>} */
			const levels=new Map();
			const sequence=diagnostic ? [[8,16,240]] : [[maximumMu/4,maximumMu/2,960],[maximumMu/2,maximumMu,960],
				[maximumMu,maximumMu*2,240],[maximumMu,maximumMu*2,480],[maximumMu,maximumMu*2,960]];
			for(const [mu,az,intervals] of sequence) {
				const key=`m${mu}-n${intervals}`;
				await run.progress('reference',`point ${index}: ${mu}x${az} angular, ${intervals} path intervals`);
				console.log(`point ${index}: ${mu}x${az}, ${intervals}`);
				let last=performance.now();
				const values=await secondaryDensity(recipe.state,point,outgoing,recipe.layout.maximumRho,mu,az,intervals,
					async(completed,total)=>{
						await new Promise(resolve=>setImmediate(resolve));
						if(performance.now()-last>20000){await run.progress('reference',`point ${index} ${key}: ${completed}/${total}`);last=performance.now();}
					},undefined,false,polarTransform,azimuthRule);
				levels.set(key,values);
				await run.write(`point-${index}-${key}.json`,JSON.stringify({point,outgoing,mu,az,intervals,values},null,'\t'));
			}
			const reference=levels.get(diagnostic ? 'm8-n240' : `m${maximumMu}-n960`);
			const physical=residual(group.flatMap(q=>q.orders.J2),reference.flat(),1e-12,0.1);
			let converged=!diagnostic,maximumBudgetRatio=0;
			const uncertainty=reference.map(()=>new Array(15).fill(0));
			if(!diagnostic)for(let d=0;d<group.length;d++)for(let c=0;c<15;c++) {
				const angularFirst=Math.abs(levels.get(`m${maximumMu/2}-n960`)[d][c]-levels.get(`m${maximumMu/4}-n960`)[d][c]);
				const angularLast=Math.abs(reference[d][c]-levels.get(`m${maximumMu/2}-n960`)[d][c]);
				const pathFirst=Math.abs(levels.get(`m${maximumMu}-n480`)[d][c]-levels.get(`m${maximumMu}-n240`)[d][c]);
				const pathLast=Math.abs(reference[d][c]-levels.get(`m${maximumMu}-n480`)[d][c]);
				const tolerance=1e-12+0.1*Math.abs(reference[d][c]);
				const budget=2*(angularLast+pathLast);
				uncertainty[d][c]=budget;maximumBudgetRatio=Math.max(maximumBudgetRatio,budget/tolerance);
				if(budget>0.1*tolerance || (angularLast>1e-15 && angularLast>angularFirst/2) || (pathLast>1e-15 && pathLast>pathFirst/2))converged=false;
			}
			const result={index,point,outgoing,observed:group.map(q=>q.orders.J2),reference,physical,uncertainty,maximumBudgetRatio,converged};
			results.push(result);console.log(JSON.stringify({index,physical,maximumBudgetRatio,converged}));
		}
		const rejected=results.some(r=>r.converged && r.observed.some((packet,d)=>packet.some((v,c)=>Math.abs(v-r.reference[d][c])-r.uncertainty[d][c]>1e-12+0.1*Math.abs(r.reference[d][c]))));
		await run.write('result.json',JSON.stringify({schema:'shell-secondary-reference-proof-v1',results,diagnostic,rejected,
			elapsedMilliseconds:performance.now()-started,claim:diagnostic ? 'Bounded low-resolution diagnosis, no physical qualification.' :
				'Independent J2 at selected points; rejection requires converged uncertainty, higher orders and full matrix remain open.'},null,'\t'));
		await run.finish(rejected?'rejected':'accepted');console.log(run.name);
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
