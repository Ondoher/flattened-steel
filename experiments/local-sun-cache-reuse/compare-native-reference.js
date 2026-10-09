import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {residual} from './rotation-model.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Prove unchanged native recurrence values after implementation-only acceleration.
 * @returns {Promise<void>} - Sealed numerical equivalence, never convergence qualification.
 */
async function main() {
	const run=await ExperimentRun.create('p3-native-parity');
	try {
		const names=process.argv.slice(2);if(names.length!==2)throw new Error('Two native reference runs required.');
		const parents=[],results=[];
		for(const name of names) {
			const result=await readParent(name,'result.json'),input=await readParent(name,'input.json');parents.push(result,input);
			results.push({result:JSON.parse(new TextDecoder().decode(result.bytes)),input:JSON.parse(new TextDecoder().decode(input.bytes))});
		}
		const normalized=results.map(result=>Object.fromEntries(Object.entries(result.input).filter(([key])=>key!=='threads')));
		if(JSON.stringify(normalized[0])!==JSON.stringify(normalized[1]))throw new Error('Native numerical equivalence inputs differ.');
		const keys=['J2','J3','J4','L1','L2','L3','gridJ2','gridJ3','gridJ4'];
		if(results.every(result=>result.result.packets.every((/** @type {Record<string,number[]>} */ packet)=>Array.isArray(packet.L4))))keys.push('L4');
		const measurements=keys.map(quantity=>{const actual=results[1].result.packets.flatMap((/** @type {Record<string,number[]>} */ p)=>p[quantity]),expected=results[0].result.packets.flatMap((/** @type {Record<string,number[]>} */ p)=>p[quantity]);
			return {quantity,parity:residual(actual,expected,1e-18,1e-10),bitIdentical:actual.length===expected.length && actual.every((value,index)=>Object.is(value,expected[index]))};});
		const source=path.join(repositoryRoot,'experiments/local-sun-cache-reuse/compare-native-reference.js');await checkPath(repositoryRoot,source);const bytes=await readFile(source);await run.write('source.js',bytes);
		await run.write('inputs.json',JSON.stringify({parents:parents.map(({bytes,...identity})=>identity),sourceSha256:hash(bytes),tools:{node:process.version},command:process.argv.slice(1),
			operation:'Compare every shared native withheld packet channel under identical physical and refinement inputs. Worker count changes scheduling of independent point calculations, not arithmetic inside a point. Include L4 only when both parents supply it. Record exact equality separately from tolerance-based equivalence; no candidate data or convergence-gate change.'},null,'\t'));
		await run.write('result.json',JSON.stringify({schema:'native-recurrence-equivalence-v1',measurements,elapsedMilliseconds:results.map(r=>r.result.elapsedMilliseconds),
			claim:'Native implementation equivalence only; physical convergence remains unqualified.'},null,'\t'));
		await run.finish(measurements.some(m=>m.parity.failures) ? 'rejected' : 'accepted');console.log(JSON.stringify({run:run.name,measurements}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
