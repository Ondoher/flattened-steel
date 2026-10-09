import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {primaryOpticalDepth} from './primary-oracle.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS as atmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../src/algorithm32/profiles/native-15/consts.js';

/** Bound omitted construction tails using positivity, analytic incident bounds and phase maxima.
 * @returns {Promise<void>} - Independent positive-source bound, never quadrature accuracy qualification.
 */
async function main() {
	const run=await ExperimentRun.create('p3-tail-bound');
	try {
		const parent=await readParent(process.argv[2],'layout.json'),controlsParent=await readParent('00018-controls','controls.json');
		/** @type {LocalSunShellLayout} */
		const layout=JSON.parse(new TextDecoder().decode(parent.bytes));
		const controls=JSON.parse(new TextDecoder().decode(controlsParent.bytes));
		/** @type {LocalSunFrozenPlacement} */
		const state=controls.states.find((/** @type {{id:string}} */ s)=>s.id==='flat-0');
		const g=atmosphere.miePhaseFunctionG,phaseR=3/(8*Math.PI),phaseM=3/(8*Math.PI)*(1-g*g)/(2+g*g)*2/(1-g)**3;
		const gamma=4*Math.PI*Math.max(phaseR,atmosphere.mieSingleScatteringAlbedo*phaseM)*(1+1e-5);
		const minimum=layout.height-layout.top,maximum=Math.hypot(layout.height,layout.maximumRho);
		const tau=primaryOpticalDepth(0,layout.top,layout.top*maximum/layout.height),tail=Math.exp(-64);
		const channels=CANONICAL_SPECTRAL_CHANNELS.map((channel,c)=>{
			const wavelength=channel.wavelength.value/1000;
			const beta=atmosphere.rayleighCoefficientScale*wavelength**-4+atmosphere.mieAngstromBeta/atmosphere.mieScaleHeight.value*wavelength**-atmosphere.mieAngstromAlpha;
			const amplification=(maximum/minimum)**2*Math.exp(tau[c])*(1+1e-4);
			const maximumPrimarySource=state.source.sourceIrradiance.values[c]*state.source.referenceSpectralIncidentScale*(state.source.referenceDistance.value/minimum)**2*Math.max(phaseR,phaseM);
			const L1=maximumPrimarySource*tail,J2=gamma*L1,L2=2*amplification*gamma*L1,J3=gamma*L2,L3=3*amplification**2*gamma**2*L1,J4=gamma*L3;
			const bounds={L1,L2,L3,J2:beta*J2,J3:beta*J3,J4:beta*J4};
			const passed=Object.entries(bounds).every(([quantity,value])=>Number.isFinite(value) && value>=0 && value<=(quantity.startsWith('J') ? 1e-13 : 1e-10));
			return {wavelengthNanometers:channel.wavelength.value,maximumIncidentOpticalDepth:tau[c],amplification,maximumPrimarySource,bounds,passed};
		});
		const identities=[];
		for(const relative of ['experiments/local-sun-cache-reuse/prove-shell-tail.js','experiments/local-sun-cache-reuse/primary-oracle.js','experiments/local-sun-cache-reuse/continuous-reference.js','experiments/local-sun-cache-reuse/shell-transport.js',
			'experiments/local-sun-cache-reuse/ExperimentRun.js','experiments/local-sun-cache-reuse/parent-evidence.js','experiments/local-sun-cache-reuse/run-boundary.js',
			'src/algorithm32/implementation/canonical-atmosphere/consts.js','src/algorithm32/profiles/native-15/consts.js']) {
			const file=path.join(repositoryRoot,relative);await checkPath(repositoryRoot,file);const bytes=await readFile(file);identities.push({path:relative,sha256:hash(bytes)});await run.write('source-'+relative.replaceAll('/','-'),bytes);
		}
		await run.write('inputs.json',JSON.stringify({schema:'shell-tail-bound-input-v1',parents:[parent,controlsParent].map(({bytes,...identity})=>identity),identities,
			operation:'Positive attenuation kernel integrates to at most one. Phase operator norm <= sphere mass times maximum phase. Factor-aware spatial interpolation amplifies source functions by at most Emax/Emin. Recursively bound removed tau>=64 tails through J4.',
			parameters:{cutoff:64,phaseBound:gamma,phaseRoundoffMargin:1e-5,reconstructionRoundoffMargin:1e-4,maximumBudgetFraction:.1},command:process.argv.slice(1),tools:{node:process.version}},null,'\t'));
		await run.write('result.json',JSON.stringify({schema:'shell-tail-bound-v1',channels,qualified:channels.every(c=>c.passed),
			claim:'Construction-tail contribution only, bounded below one tenth of every absolute physical limit. Does not establish path quadrature, interpolation, reference convergence, views or app qualification.'},null,'\t'));
		await run.finish(channels.every(c=>c.passed) ? 'accepted' : 'rejected');console.log(JSON.stringify({run:run.name,qualified:channels.every(c=>c.passed),maximumTail:Math.max(...channels.flatMap(c=>Object.values(c.bounds)))}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
