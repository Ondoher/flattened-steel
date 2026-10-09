import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {primaryRadiance,primaryRadianceControl,PRIMARY_ORACLE_POLICY} from './primary-oracle.js';
import {residual} from './rotation-model.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Prove algebraic reference acceleration over the withheld physical query inventory.
 * @returns {Promise<void>} - Sealed equivalence and timing evidence, not candidate acceptance.
 */
async function main() {
	const run=await ExperimentRun.create('p3-primary-fast');
	try {
		const name=process.argv[2] ?? '00073-p3-shell-v3a';
		const recipeParent=await readParent(name,'recipe.json'),captureParent=await readParent(name,'result.json');
		/** @type {LocalSunShellCaptureRequest} */
		const recipe=JSON.parse(new TextDecoder().decode(recipeParent.bytes));
		/** @type {LocalSunShellSecondaryCapture} */
		const capture=JSON.parse(new TextDecoder().decode(captureParent.bytes));
		const queries=capture.results.find(r=>r.candidate)?.secondary;
		if(!queries?.length)throw new Error('Missing physical query inventory.');
		const identities=[];
		for(const name of ['prove-primary-fast.js','primary-oracle.js','continuous-reference.js','ExperimentRun.js','parent-evidence.js','run-boundary.js']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',name);await checkPath(repositoryRoot,target);
			const bytes=await readFile(target);identities.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});await run.write('source-'+name,bytes);
		}
		await run.write('inputs.json',JSON.stringify({parents:[recipeParent,captureParent].map(({bytes,...identity})=>identity),identities,
			operation:'Compare scalar-allocation reference and exponent-combined reference at identical continuous coordinates, 480 Simpson square-coordinate intervals',policy:PRIMARY_ORACLE_POLICY,
			tools:{node:process.version},command:process.argv.slice(1)},null,'\t'));
		let start=performance.now();
		const control=queries.flatMap(q=>primaryRadianceControl(recipe.state,q.point,q.direction,recipe.layout.maximumRho,480));
		const controlMilliseconds=performance.now()-start;start=performance.now();
		const accelerated=queries.flatMap(q=>primaryRadiance(recipe.state,q.point,q.direction,recipe.layout.maximumRho,480));
		const acceleratedMilliseconds=performance.now()-start;
		const parity=residual(accelerated,control,1e-18,1e-10);
		await run.write('result.json',JSON.stringify({schema:'primary-reference-equivalence-v1',queries:queries.length,channels:15,intervals:480,parity,
			controlMilliseconds,acceleratedMilliseconds,claim:'Measured algebraic equivalence only. Candidate and higher-order convergence gates remain unchanged.'},null,'\t'));
		await run.finish(parity.failures ? 'rejected' : 'accepted');console.log(JSON.stringify({run:run.name,parity,controlMilliseconds,acceleratedMilliseconds}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
