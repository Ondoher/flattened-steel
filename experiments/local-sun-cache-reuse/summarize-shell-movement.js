import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Require the complete measured scalar inventory to be finite, nonnegative and within its frozen limit.
 * @param {LocalSunRotationResidual} residual - Actual complete measurement.
 * @returns {boolean} - Numerical parity disposition, without physical-reference authority.
 */
function passed(residual) {
	return residual.count>0 && residual.failures===0 && residual.nonfinite===0 && residual.negative===0 && residual.maximumRatio<=1;
}

/** Qualify the complete synthetic shell movement matrix from authenticated immutable inputs.
 * @returns {Promise<void>} - Measured movement-only admission, with every excluded obligation stated.
 */
async function main() {
	const run=await ExperimentRun.create('p3-move-proof');
	try {
		const name=process.argv[2],parents=await Promise.all(['result.json','recipe.json','gates.json','inputs.json'].map(artifact=>readParent(name,artifact)));
		/** @type {LocalSunRotationCapture} */ const capture=JSON.parse(new TextDecoder().decode(parents[0].bytes));
		/** @type {LocalSunRotationRecipe} */ const recipe=JSON.parse(new TextDecoder().decode(parents[1].bytes));
		const gates=JSON.parse(new TextDecoder().decode(parents[2].bytes)),layout=recipe.shellLayout;
		if(!layout || capture.schema!=='local-sun-shell-rotation-v1' || capture.diagnostic || recipe.motion || recipe.shellApplication || capture.glErrors.length)throw new Error('Selected still-only shell movement capture required.');
		if(gates.quantities.some((/** @type {{reuseRelative:number,cpuGpuRelative:number}} */ quantity)=>quantity.reuseRelative!==.0001 || quantity.cpuGpuRelative!==.002))throw new Error('Frozen parity limits changed.');
		const expected=[...gates.matrix.rotationDegrees.map((/** @type {number} */ degrees)=>({degrees,offset:[0,0],key:degrees})),...gates.matrix.translationsMeters.filter((/** @type {number[]} */ offset)=>offset.some(value=>value!==0)).map((/** @type {number[]} */ offset,/** @type {number} */ index)=>({degrees:0,offset,key:1000+index}))];
		if(JSON.stringify(recipe.shellPoses)!==JSON.stringify(expected) || capture.results.length!==expected.length || capture.images.length!==expected.length)throw new Error('Incomplete rotation/translation matrix.');
		const fieldIds=['local-sun-j1','local-sun-j2','local-sun-j3','local-sun-j4','local-sun-l1','local-sun-l2','local-sun-l3','local-sun-j-through-2','local-sun-j-through-3','local-sun-j-through-4'].sort();
		const canonical=capture.results[0],rows=[];
		for(let index=0;index<expected.length;index++) {
			const parent=await readParent(name,`angle-${expected[index].key}.json`);parents.push(parent);
			/** @type {LocalSunRotationAngleSummary & {artifactKey:number,translationMeters:number[]}} */ const entry=JSON.parse(new TextDecoder().decode(parent.bytes));
			const row=capture.results[index],pose=expected[index],image=capture.images[index];
			if(entry.artifactKey!==pose.key || entry.degrees!==pose.degrees || JSON.stringify(entry.translationMeters)!==JSON.stringify(pose.offset) || row.degrees!==pose.degrees || image.degrees!==pose.key || JSON.stringify(row.fields)!==JSON.stringify(entry.fields))throw new Error('Captured pose/field identities differ.');
			if(JSON.stringify(row.fields.map(field=>field.id).sort())!==JSON.stringify(fieldIds) || row.fields.some(field=>field.storage.format!=='R32F' || field.storage.height!==layout.nodes.length || field.storage.layers!==15 || field.storage.width!==(field.id.includes('-l') ? 1920 : 4374) || field.reuse.count!==field.storage.width*layout.nodes.length*15 || !/^[a-f0-9]{64}$/u.test(field.sha256)))throw new Error('Incomplete selected field inventory.');
			if(row.orderSpatial.length!==4 || row.orderSpatial.some((value,i)=>/** @type {LocalSunRotationSpatialResult & {order:number}} */(value).order!==i+1))throw new Error('Missing pure-order reconstruction inventory.');
			const spatial=[row.spatial,...row.orderSpatial];
			if(spatial.some(value=>value.queries!==row.spatial.queries || value.directFrame.count!==value.queries*15 || value.inverseTransformAwayFromAxis.count+value.inverseTransformAtAxis.count!==value.queries*15))throw new Error('Incomplete spatial/angular scalar inventory.');
			const source=row.sourceInvariants;
			const checks={fields:row.fields.every(field=>passed(field.reuse)),bitExactFields:row.fields.every(field=>field.sha256===canonical.fields.find(value=>value.id===field.id)?.sha256),
				reconstruction:spatial.every(value=>passed(value.directFrame) && passed(value.inverseTransformAwayFromAxis) && passed(value.inverseTransformAtAxis)),axisApproach:passed(row.axisApproach),
				cpuReuse:passed(row.rayReuse),gpuReuse:passed(row.gpuReuse),cpuGpu:passed(row.cpuGpu),transmission:passed(row.transmission),equivalentCpu:passed(row.equivalentCpuResidual),equivalentGpu:passed(row.equivalentGpuResidual),
				completeRays:[row.rayReuse,row.gpuReuse,row.cpuGpu,row.transmission,row.equivalentCpuResidual,row.equivalentGpuResidual].every(value=>value.count===96*15),
				coverage:row.coverage.admitted.length===96 && row.equivalentCoverage.admitted.length===96 && row.coverage.excluded.length===0 && row.equivalentCoverage.excluded.length===0,
				endpoints:row.endpointFailures===0 && row.endpointMaximumMeters<=.01,source:source.maximumDistanceResidualMeters<=.01 && source.maximumInverseSquareRelative<=1e-4 && source.maximumTransmissionResidual<=1e-7,
				image:image.maximum<=2 && image.p95<=1};
			rows.push({pose,checks,qualified:Object.values(checks).every(Boolean),maximumSpatialRatio:Math.max(...spatial.flatMap(value=>[value.directFrame.maximumRatio,value.inverseTransformAwayFromAxis.maximumRatio,value.inverseTransformAtAxis.maximumRatio])),image});
		}
		const identities=[];
		for(const relative of ['summarize-shell-movement.js','ExperimentRun.js','parent-evidence.js','run-boundary.js']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',relative);await checkPath(repositoryRoot,target);const bytes=await readFile(target);identities.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});await run.write('source-'+relative,bytes);
		}
		const qualified=rows.every(row=>row.qualified);
		await run.write('inputs.json',JSON.stringify({parents:parents.map(({bytes,...identity})=>identity),identities,command:process.argv.slice(1),tools:{node:process.version},operation:'Require every pure/transported/cumulative field scalar, positive reconstruction stencil, exact ray, source invariant, compensated endpoint and paired RGB image gate across the complete frozen synthetic rotation/translation matrix.'},null,'\t'));
		await run.write('result.json',JSON.stringify({schema:'shell-synthetic-movement-proof-v1',qualified,rows,layout:hash(parents[1].bytes),claim:'Synthetic movement numerical parity only. Does not establish independent physical accuracy, ordinary orbital-time placement cadence, continuous-time motion, app replacement, resource benefit or source-review completion.'},null,'\t'));
		await run.finish(qualified ? 'accepted' : 'rejected');console.log(JSON.stringify({run:run.name,qualified,rows:rows.map(({image,...row})=>row)}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
