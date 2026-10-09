import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {nativeGridSample,nativeViewRadiance} from './native-grid-reference.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS as medium} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../src/algorithm32/profiles/native-15/consts.js';

/** Prove an independent view integrator against a closed-form constant source function.
 * @returns {Promise<void>} - Sealed analytic invariant and endpoint evidence; no candidate physics acceptance.
 */
async function main() {
	const run=await ExperimentRun.create('p3-native-ray-ok');
	try {
		const name=process.argv[2];if(!name)throw new Error('Frozen physical ray ingress capture required.');
		const recipeParent=await readParent(name,'recipe.json'),captureParent=await readParent(name,'result.json');
		/** @type {LocalSunShellCaptureRequest} */ const recipe=JSON.parse(new TextDecoder().decode(recipeParent.bytes));
		/** @type {LocalSunNativeViewCapture} */ const capture=JSON.parse(new TextDecoder().decode(captureParent.bytes));
		const rays=capture.results.find(result=>result.candidate)?.cpuRays;if(rays?.length!==96)throw new Error('Complete frozen ray ingress required.');
		const altitudes=[0,250,1000,8000,recipe.layout.top],radial=[0,recipe.layout.maximumRho/2,recipe.layout.maximumRho],polar=[-1,0,1],azimuthCount=8;
		const count=altitudes.length*radial.length*polar.length*azimuthCount;
		/** @type {LocalSunNativeFieldGrid} */ const grid={top:recipe.layout.top,radius:recipe.layout.maximumRho,altitudes,radial,polar,azimuthCount,
			rayleighHeight:medium.rayleighScaleHeight.value,mieHeight:medium.mieScaleHeight.value,
			betaR:CANONICAL_SPECTRAL_CHANNELS.map(channel=>medium.rayleighCoefficientScale*(channel.wavelength.value/1000)**-4),
			betaM:CANONICAL_SPECTRAL_CHANNELS.map(channel=>medium.mieAngstromBeta/medium.mieScaleHeight.value*(channel.wavelength.value/1000)**-medium.mieAngstromAlpha),
			fields:[1,2,3].map(value=>Array.from({length:15},()=>new Float64Array(count).fill(value)))};
		const state={...recipe.state,source:{...recipe.state.source,referenceSpectralIncidentScale:0}};
		let stencilWorst=0;
		for(const point of [[0,0,5],[grid.radius*.37,grid.radius*.19,12345],[grid.radius,0,grid.top]])for(const direction of [[1,0,0],[0,0,1],[0,0,-1],[Math.SQRT1_2,Math.SQRT1_2,0]])for(let n=0;n<3;n++)stencilWorst=Math.max(stencilWorst,Math.abs(nativeGridSample(grid,grid.fields[n][0],point,direction)-(n+1)));
		const levels=[];
		for(const order of [4,8,16]) {
			let maximumAbsolute=0,endpointMaximumMeters=0,scalars=0;
			for(const ray of rays) {
				const result=nativeViewRadiance(grid,state,ray.segment.ray.direction,order);
				endpointMaximumMeters=Math.max(endpointMaximumMeters,Math.abs(result.path.length-ray.segment.endDistance.value));
				for(let n=0;n<4;n++)for(let c=0;c<15;c++){const expected=n*(1-result.path.transmittance[c]);maximumAbsolute=Math.max(maximumAbsolute,Math.abs(result.orders[n][c]-expected));scalars++;}
			}
			levels.push({order,maximumAbsolute,endpointMaximumMeters,scalars});await run.progress('analytic',`Completed ${order}-point Gaussian analytic invariant.`);
		}
		const implementation=[];
		for(const relative of ['prove-native-view-contract.js','native-grid-reference.js','primary-oracle.js','continuous-reference.js','ExperimentRun.js','parent-evidence.js','run-boundary.js','../../src/algorithm32/implementation/canonical-atmosphere/consts.js','../../src/algorithm32/profiles/native-15/consts.js']) {
			const file=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',relative);await checkPath(repositoryRoot,file);const bytes=await readFile(file);implementation.push({path:path.relative(repositoryRoot,file).replaceAll('\\','/'),sha256:hash(bytes)});await run.write('source-'+relative.replaceAll('/','-'),bytes);
		}
		const qualified=stencilWorst<1e-12 && levels.at(-1).maximumAbsolute<1e-10 && levels.every(level=>Number.isFinite(level.maximumAbsolute) && level.endpointMaximumMeters<=.01);
		await run.write('inputs.json',JSON.stringify({parents:[recipeParent,captureParent].map(({bytes,...identity})=>identity),implementation,parameters:{altitudes,radial,polar,azimuthCount,sourceScale:0,normalizedSourceFunctions:[1,2,3]},operation:'Analytic invariant: for constant J/extinction=k and a zero primary source, finite-path radiance equals k*(1-T) in each order and wavelength. Compare independently solved endpoints to captured geometric ingress; candidate field or radiance values do not enter.',tools:{node:process.version},command:process.argv.slice(1)},null,'\t'));
		await run.write('result.json',JSON.stringify({schema:'native-view-analytic-invariant-v1',stencilWorst,levels,finestAnalyticAbsoluteBound:1e-10,qualified,claim:'Finest-rule analytic view invariant and independent finite endpoint contract only. Coarser rules retain their measured errors; not scattering-field, reference convergence or candidate physical acceptance.'},null,'\t'));
		await run.finish(qualified ? 'accepted' : 'rejected');console.log(JSON.stringify({run:run.name,stencilWorst,levels,qualified}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
