import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {shellMiePhaseValues} from './shell-scatter.js';
import {identifyShellPhase} from './shell-phase-hash.js';
import {partitionedShellIncoming} from './shell-angular.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as outgoing} from '../../src/algorithm32/sampling-domains/direction/cubed-sphere/consts.js';
import {rollup} from 'rollup';
import {CacheValues} from '../../src/algorithm32/gpu-cache-runtime/CacheValues.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Verify the optimized phase hash against the original canonical factory and captured matrix identity.
 * @returns {Promise<void>} - Complete immutable matrix-identity evidence, with diagnostic host timing.
 */
async function main() {
	const run=await ExperimentRun.create('p3-phase-proof');
	try {
		const name=process.argv[2],recipeParent=await readParent(name,'recipe.json'),captureParent=await readParent(name,'result.json');
		/** @type {LocalSunShellCaptureRequest} */
		const recipe=JSON.parse(new TextDecoder().decode(recipeParent.bytes));
		const expected=JSON.parse(new TextDecoder().decode(captureParent.bytes)).results.find((/** @type {{candidate:boolean}} */ r)=>r.candidate).phaseMatrix;
		if(recipe.incoming!=='partitioned-midpoint48' || !expected)throw new Error('Matching captured midpoint48 phase identity required.');
		const incoming=partitionedShellIncoming(48,.5);
		const identities=[];
		const graph=await rollup({input:path.join(repositoryRoot,'experiments/local-sun-cache-reuse/prove-shell-phase.js'),external:id=>!id.startsWith('.') && !path.isAbsolute(id),onwarn:()=>{}});
		const closure=[...graph.watchFiles].sort();await graph.close();
		for(const target of closure) {
			const relative=path.relative(repositoryRoot,target).replaceAll('\\','/');
			await checkPath(repositoryRoot,target);const bytes=await readFile(target);identities.push({path:relative,sha256:hash(bytes)});await run.write('source-'+relative.replaceAll('/','-'),bytes);
		}
		await run.write('inputs.json',JSON.stringify({parents:[recipeParent,captureParent].map(({bytes,...identity})=>identity),identities,
			operation:'Compute the complete physical Float32 phase matrix once; compare original canonical numeric-array serialization/hash with explicitly sorted JSON serialization/native SHA-256 and the unchanged captured identity.',
			parameters:{incoming:incoming.id,outgoing:outgoing.id,expected},tools:{node:process.version,rollup:'repository-installed module-graph discovery; no emitted code'},command:process.argv.slice(1)},null,'\t'));
			const started=performance.now(),definition=shellMiePhaseValues({id:incoming.id+'-w27-mie-phase-v1',incoming:incoming.unitVectors,outgoing:outgoing.unitVectors}),matrixMilliseconds=performance.now()-started;
			const originalStarted=performance.now(),original=CacheValues.createData(definition),originalHashMilliseconds=performance.now()-originalStarted;
			const nativeStarted=performance.now(),native=await identifyShellPhase(definition),nativeHashMilliseconds=performance.now()-nativeStarted;
			const qualified=original.contentHash===native.contentHash && native.contentHash===expected.contentHash && JSON.stringify(native.shape)===JSON.stringify(expected.shape);
			await run.write('result.json',JSON.stringify({schema:'shell-phase-hash-proof-v1',qualified,values:definition.values.length,contentHash:native.contentHash,matrixMilliseconds,originalHashMilliseconds,nativeHashMilliseconds,
				claim:'Exact complete phase-matrix canonical identity equivalence. Single host timings are diagnostic, not app responsiveness or repeated resource qualification.'},null,'\t'));
			await run.finish(qualified ? 'accepted' : 'rejected');console.log(JSON.stringify({run:run.name,qualified,matrixMilliseconds,originalHashMilliseconds,nativeHashMilliseconds}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
