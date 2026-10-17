import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer';
import {qualifyInputs} from './aerosol-inputs.mjs';
import {browserSources} from '../execution.mjs';
import {bundle, invoke, halfWidth} from './libradtran.mjs';
import {createRun, identity, readRepository, verifyRun, checkedAbsolute, repositoryRoot} from '../io/files.mjs';
import {colorimetry, ciePath} from '../horizon/diagnosis-color.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const root = 'tmp/experiments/sky-accuracy-dials/runs/', parent = root + '00288-h40-distant';
const centers = NATIVE_15_SPECTRAL_BASIS.channels.map(c => c.center.value);

/** Rebuild numerical evidence from finalized tool cases, preserving aggregate monitoring failure.
 * @param {string} source Sealed aggregate whose final verification rejected its timing gaps.
 * @returns {Promise<void>} New qualified numerical derivative; invalid inputs seal then reject.
 */
async function recover(source) {
	assert.match(source,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h44-aeroref$/);
	const sealPath=source+'/sealed.json',seal=JSON.parse(readRepository(sealPath).toString());
	assert.equal(seal.state,'accepted');assert.equal(seal.sourceFailures.length,0);assert.ok(!seal.heartbeatFailure&&seal.cleanup.absent);
	for(const a of seal.artifacts){assert.ok(a.path.startsWith(source+'/'));readRepository(a.path,a);}
	const events=readRepository(source+'/progress.jsonl').toString().trim().split(/\r?\n/).map(s=>JSON.parse(s));
	const monitoringGaps=events.slice(1).map((e,i)=>({seconds:(Date.parse(e.timestamp)-Date.parse(events[i].timestamp))/1000,before:events[i].timestamp,after:e.timestamp})).filter(g=>g.seconds>35);assert.ok(monitoringGaps.length);
	const readings=/** @type {HorizonLibReading[]} */(JSON.parse(readRepository(source+'/readings.json').toString()));assert.equal(readings.length,16);
	const summaries=/** @type {HorizonLibSummary[]} */(JSON.parse(readRepository(source+'/summary.json').toString()));
	const physical=/** @type {HorizonLibParent} */(JSON.parse(readRepository(parent+'/registration.json').toString()));
	const productionRoot=root+'00303-h44-prod-full',control=/** @type {HorizonProductionControl} */(JSON.parse(readRepository(productionRoot+'/control.json').toString()));
	const parents=[identity(sealPath),identity(source+'/readings.json'),identity(source+'/summary.json'),verifyRun(parent),verifyRun(productionRoot),identity(productionRoot+'/control.json'),identity(ciePath)];
	for(const r of readings)parents.push(identity(r.toolRun+'/manifest.json'));
	const run=createRun('h44-ref-qual',{parents,operation:'Reconstruct numerical reference from16 individually successful external tool runs. Original aggregate remains unqualified for monitoring gaps. Authenticate retained artifacts, actual solver inputs and raw spectra; recompute every mean and interval. No solver rerun or prior-evidence changes.',parameters:{source,monitoringGaps,originalAggregateMonitoringQualified:false,originalArtifactHashesChecked:true}});
	let failure=null;
	try {
		const inspectedParents=/** @type {DialFileIdentity[]} */([]);
		const inputQualification=qualifyInputs(readings,physical,control,inspectedParents,message=>run.progress('qualify',message));
		const evidenceParents=[...parents,...inspectedParents];
		for(const s of summaries) {
			const set=readings.filter(r=>r.configuration.id===s.id);assert.equal(set.length,4);assert.deepEqual(set.map(r=>r.configuration.repeat),[0,1,2,3]);
			const mean=centers.map((_,c)=>set.reduce((sum,r)=>sum+r.spectrum[c],0)/4);assert.deepEqual(mean,s.meanSpectrum);assert.deepEqual(colorimetry(mean,'bin-integrated'),s.color);
			assert.equal(halfWidth(set.map(r=>colorimetry([...r.spectrum],'bin-integrated').luminanceCdPerM2)),s.luminanceHalfWidth95);
			assert.equal(halfWidth(set.map(r=>colorimetry([...r.spectrum],'bin-integrated').redBlueRatio)),s.redBlueHalfWidth95);
			assert.equal(Math.max(...centers.map((_,c)=>halfWidth(set.map(r=>r.spectrum[c]))/mean[c])),s.maximumSpectralHalfWidth95Relative);
		}
		run.write('input-qualification.json',inputQualification,{parents:evidenceParents,operation:'Authenticate original and executed inputs; reconstruct actual phase; compare layer columns and production coefficients; raw radiance/1000 matches retained observations.'});
		run.write('readings.json',readings,{parents:evidenceParents,operation:'Observations reauthenticated against individually finalized external raw spectra.'});
		run.write('summary.json',summaries,{parents:evidenceParents,operation:'Means sum(L)/4 and conservative Student95 intervals recomputed from authenticated per-seed spectra, equal to retained values.'});
		run.write('registration.json',physical);run.write('recovery.json',{source,monitoringGaps,sourceArtifactsAuthenticated:true,allIndividualToolCasesSucceeded:true,noSolverRerun:true});
	} catch(e){failure=e;}
	finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,cases:readings.length});}
	verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Exact Legendre moments of normalized Cornette-Shanks, obtained by multiplying HG by 1+mu^2.
 * @param {number} g Production shape parameter, not a fitted HG replacement.
 * @returns {number[]} Moments k_l for p(mu)=sum (2l+1) k_l P_l(mu), integral p dmu=2.
 */
export function moments(g) {
	const result = Array.from({length: 96}, (_, l) => {
		const a = (l + 1) * (l + 2) / ((2 * l + 1) * (2 * l + 3));
		const b = (l + 1) ** 2 / ((2 * l + 1) * (2 * l + 3)) + (l ? l * l / ((2 * l + 1) * (2 * l - 1)) : 0);
		const c = l >= 2 ? l * (l - 1) / ((2 * l + 1) * (2 * l - 1)) : 0;
		return 3 / (2 * (2 + g * g)) * (g ** l * (1 + b) + a * g ** (l + 2) + (c ? c * g ** (l - 2) : 0));
	});
	assert.ok(Math.abs(result[0] - 1) < 1e-14);
	let maximumRelative = 0;
	for (let i = 0; i <= 2000; i++) {
		const mu = 2 * i / 2000 - 1;
		let p0 = 1, p1 = mu, value = result[0] + 3 * result[1] * mu;
		for (let l = 2; l < result.length; l++) {const p = ((2 * l - 1) * mu * p1 - (l - 1) * p0) / l; value += (2 * l + 1) * result[l] * p; p0 = p1; p1 = p;}
		const exact = 1.5 * (1 - g * g) / (2 + g * g) * (1 + mu * mu) / (1 + g * g - 2 * g * mu) ** 1.5;
		maximumRelative = Math.max(maximumRelative, Math.abs(value / exact - 1));
	}
	assert.ok(maximumRelative < 1e-8, `Phase reconstruction: ${maximumRelative}`);
	return result;
}

/** Construct explicit aerosol layers at their analytic exponential column averages.
 * @param {HorizonReferenceMedium} medium Exact retained full-aerosol medium.
 * @param {HorizonLibCase} config Frozen numerical controls.
 * @returns {Map<string,string>} Complete self-contained external case; assertions reject unsupported inputs.
 */
export function aerosolBundle(medium, config) {
	assert.equal(config.epsilon, 1); assert.equal(medium.albedo, 0.8); assert.equal(medium.g, 0.7);
	const files = bundle(medium, config), phase = moments(medium.g);
	const levels = new Set([0, 5, medium.topAltitude]);
	for (const [height, count] of [[medium.rayleighHeight, config.layers], [medium.mieHeight, config.layers / 2]])
		for (let i = 1; i < count; i++) levels.add(-height * Math.log1p(-(1 - i / count) * -Math.expm1(-medium.topAltitude / height)));
	const z = [...levels].sort((a,b) => b-a);
	const molecular = [z.map(x=>x/1000).join(' ')], absorption = [z.map(x=>x/1000).join(' ')];
	for (const c of config.channels) {
		molecular.push([centers[c], ...z.slice(1).map((lower,i)=>medium.rayleigh[c] * medium.rayleighHeight * (Math.exp(-lower/medium.rayleighHeight)-Math.exp(-z[i]/medium.rayleighHeight)))].join(' '));
		absorption.push([centers[c], ...z.slice(1).map(()=>0)].join(' '));
	}
	files.set('scattering.txt', molecular.join('\n')+'\n'); files.set('absorption.txt', absorption.join('\n')+'\n');
	files.set('atmosphere.txt', z.map(x=>`${x/1000} ${1013*Math.exp(-x/medium.rayleighHeight)} 288 ${2.545818e19*Math.exp(-x/medium.rayleighHeight)}`).join('\n')+'\n');
	const index = [`${z[0]/1000} NULL`];
	let maximumColumnError = 0;
	const total = medium.mie.map(()=>0);
	for (let i = 1; i < z.length; i++) {
		const name = `aerosol-${i}.txt`, lower=z[i], upper=z[i-1], integral=medium.mieHeight*(Math.exp(-lower/medium.mieHeight)-Math.exp(-upper/medium.mieHeight));
		const values = config.channels.map(c=>{
			const tau=medium.mie[c]*integral, extinction=tau/(upper-lower)*1000; total[c]+=tau;
			return [centers[c], extinction, medium.albedo, ...phase].join(' ');
		});
		files.set(name, values.join('\n')+'\n'); index.push(`${lower/1000} ${name}`);
	}
	for (const c of config.channels) maximumColumnError=Math.max(maximumColumnError,Math.abs(total[c]/(medium.mie[c]*medium.mieHeight*-Math.expm1(-medium.topAltitude/medium.mieHeight))-1));
	assert.ok(maximumColumnError < 1e-12);
	files.set('aerosols.txt', index.join('\n')+'\n');
	files.set('input.inp', files.get('input.inp').replace('mol_abs_param none','mol_abs_param none\naerosol_default\naerosol_file explicit aerosols.txt'));
	files.set('case.json', JSON.stringify({purpose:'H44 matched 100% production aerosol, all-order fully spherical independent transport',
		geometry:`Spherical R=${medium.radius}m, top=${medium.topAltitude}m, observer=5m, away-Sun elevation=${config.elevation}deg`,
		quantity:'Directional spectral radiance; use execution/mc.rad.spc, column 5.',units:'Source and raw radiance mW per nm; analysis explicitly divides radiance by 1000 to W.',
		limitations:['Scalar/unpolarized, black ground, no refraction or gas absorption.','Layer averages and finite photon statistics need convergence checks.','External all-order transport and production N4 have different order limits; their difference alone does not isolate numerical error.'],
		configuration:config,medium,phase:{family:'Cornette-Shanks',moments:phase,normalization:'integral p dmu=2; physical sr^-1 phase=p/(4pi)',maximumColumnError},layerCount:z.length-1},null,2));
	return files;
}

/** Run one serial external pilot or repeated full-spectrum package with retained input authentication.
 * @param {boolean} pilot Whether to limit the execution to a three-band operational probe.
 * @returns {Promise<void>} A new sealed external reference; solver failure seals then rejects.
 */
async function measure(pilot) {
	const physical=/** @type {HorizonLibParent} */(JSON.parse(readRepository(parent+'/registration.json').toString()));
	const rays=/** @type {LocalAerosolCase[]} */(JSON.parse(readRepository(parent+'/rays.json').toString()));
	const parents=[verifyRun(parent),identity(parent+'/registration.json'),identity(parent+'/rays.json'),identity(ciePath),identity('scripts/libradtran/cli.js'),identity('scripts/libradtran/worker.py'),identity('scripts/libradtran/installation.json'),identity('references/downloads/libradtran-2.0.1/libRadtran-2.0.1/src_py/aerosol_options.py')];
	const repeats=pilot?1:4, photons=pilot?10000:100000;
	const configs=pilot?[{id:'pilot',elevation:0.05,layers:256}]:[{id:'full-0.05',elevation:0.05,layers:256},{id:'full-3',elevation:3,layers:256},{id:'full-20',elevation:20,layers:256},{id:'full-fine',elevation:0.05,layers:512}];
	const channels=pilot?[2,5,8]:Array.from({length:15},(_,i)=>i);
	const run=createRun(pilot?'h44-aero-pilot':'h44-aeroref',{parents,operation:'Independent fully spherical MYSTIC with explicit matching Cornette-Shanks aerosol phase moments, exponential column-integrated Rayleigh/aerosol extinction, SSA0.8 and all scattering orders. Authenticate actual case bytes and preserve empirical uncertainty.',parameters:{repeats,photons,configs,channels,momentCount:96,physical}});
	console.log(JSON.stringify({run:run.path,pilot,cases:configs.length*repeats}));
	const readings=/** @type {HorizonLibReading[]} */([]), summaries=/** @type {HorizonLibSummary[]} */([]);
	let failure=null;
	try {
		run.write('registration.json',{...physical,phaseMoments:moments(physical.medium.g),configs,repeats,photons});
		for (const configuration of configs) {
			for (let repeat=0;repeat<repeats;repeat++) {
				const config={...configuration,repeat,photons,channels,epsilon:1,vroomOff:true};
				const files=aerosolBundle(physical.medium,config), directory=checkedAbsolute(path.join(run.scratchPath,`${config.id}-${repeat}`),false); mkdirSync(directory);
				let written=0;
				for (const [name,contents] of files) {writeFileSync(path.join(directory,name),contents,{flag:'wx'});if(++written%32===0)run.progress('staging',`Write case inputs: ${written}/${files.size}.`);}
				run.progress('solver',`${config.id} repetition ${repeat+1}/${repeats}; ${photons} photons per wavelength`,readings.length,configs.length*repeats);
				const started=Date.now(),launch=await invoke(directory,300);run.progress('authenticate',`Solver returned: ${config.id}, seed ${repeat}.`);run.write(`launch-${config.id}-${repeat}.json`,launch);
				const allocated=launch.stdout.match(/libRadtran run: (.+)/)?.[1].trim();assert.ok(allocated,launch.stderr);
				const toolRun=path.relative(repositoryRoot,checkedAbsolute(allocated)).split(path.sep).join('/');assert.ok(toolRun.startsWith('.codex-tmp/libradtran/runs/'));
				const manifestPath=toolRun+'/manifest.json',manifest=/** @type {HorizonLibManifest} */(JSON.parse(readRepository(manifestPath).toString()));
				assert.equal(launch.code,0,launch.stderr);assert.equal(manifest.status,'succeeded');
				for (const [name,contents] of files) {const a=manifest.artifacts.find(a=>a.path==='case/'+name);assert.ok(a);assert.equal(a.sha256,createHash('sha256').update(contents).digest('hex'));}
				const a=manifest.artifacts.find(a=>a.path==='execution/mc.rad.spc');assert.ok(a);
				const bytes=readRepository(toolRun+'/'+a.path,a.sha256),stderr=readRepository(toolRun+'/stderr.txt');
				assert.ok(!stderr.toString().includes('vroom not yet validated'));
				run.write(`raw-${config.id}-${repeat}.txt`,bytes,{parents:[identity(manifestPath),identity(toolRun+'/'+a.path)],operation:'Copy authenticated solver radiance; retain raw mW units.'});
				run.write(`solver-log-${config.id}-${repeat}.txt`,stderr,{parents:[identity(toolRun+'/stderr.txt')],operation:'Retain external solver diagnostics for explicit-option review.'});
				run.write(`input-${config.id}-${repeat}.json`,{toolRun,manifest:identity(manifestPath),caseFiles:files.size,caseBytesAuthenticated:true,configuration:config,metadata:JSON.parse(files.get('case.json'))});
				const rows=bytes.toString().trim().split(/\r?\n/).filter(x=>x.trim()&&!x.startsWith('#')).map(x=>x.trim().split(/\s+/).map(Number));assert.equal(rows.length,channels.length);
				const spectrum=rows.map((r,i)=>{assert.ok(r.length>=5&&r.every(Number.isFinite)&&Math.abs(r[0]-centers[channels[i]])<0.001&&r[4]>=0);return r[4]/1000;});
				readings.push({configuration:config,toolRun,spectrum,dividedSpectrum:spectrum,color:pilot?null:colorimetry(spectrum,'bin-integrated'),elapsedMilliseconds:Date.now()-started});
				run.write(`reading-${config.id}-${repeat}.json`,readings.at(-1));
				console.log(JSON.stringify({case:config.id,repeat,elapsedMilliseconds:Date.now()-started,spectrum}));
			}
			if (!pilot) {
				const set=readings.filter(r=>r.configuration.id===configuration.id),meanSpectrum=centers.map((_,c)=>set.reduce((s,r)=>s+r.spectrum[c],0)/set.length);
				const parentRay=rays.find(c=>c.fraction===1).rows.find(r=>r.heading==='away'&&r.elevation===configuration.elevation);assert.ok(parentRay);
				const color=colorimetry(meanSpectrum,'bin-integrated');
				summaries.push({...configuration,epsilon:1,repeats,meanSpectrum,meanDividedSpectrum:meanSpectrum,color,parentColor:parentRay.color,
					redBlueHalfWidth95:halfWidth(set.map(r=>r.color.redBlueRatio)),luminanceHalfWidth95:halfWidth(set.map(r=>r.color.luminanceCdPerM2)),
					maximumSpectralHalfWidth95Relative:Math.max(...centers.map((_,c)=>halfWidth(set.map(r=>r.spectrum[c]))/meanSpectrum[c])),maximumRelativeToParentN1:Math.max(...meanSpectrum.map((x,c)=>Math.abs(x/parentRay.spectrum[c]-1)))});
				run.write(`summary-${configuration.id}.json`,summaries.at(-1));
			}
		}
		run.write('readings.json',readings);run.write('summary.json',summaries);
	} catch(e){failure=e;}
	finally {run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,cases:readings.length});}
	verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Derive matching spectra, physical residuals and production-display comparison PNGs.
 * @param {string} productionRoot Accepted H44 production-full run.
 * @param {string} referenceRoot Accepted H44 external reference run.
 * @returns {Promise<void>} Accepted derivative with actual sampled colors; failures seal then reject.
 */
async function report(productionRoot,referenceRoot) {
	assert.match(productionRoot,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h44-prod-full$/);assert.match(referenceRoot,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h44-ref-qual$/);
	const parents=[verifyRun(productionRoot),verifyRun(referenceRoot),verifyRun(parent),identity(ciePath)];
	/** Authenticate a required retained input. @param {string} p @returns {unknown} Parsed parent JSON. */
	function input(p){parents.push(identity(p));return JSON.parse(readRepository(p).toString());}
	const readings=/** @type {HorizonProductionReading[]} */(input(productionRoot+'/readings.json'));
	const summaries=/** @type {HorizonLibSummary[]} */(input(referenceRoot+'/summary.json'));
	const physical=/** @type {HorizonLibParent} */(input(parent+'/registration.json'));
	const referenceReadings=/** @type {HorizonLibReading[]} */(input(referenceRoot+'/readings.json'));
	const inputQualification=input(referenceRoot+'/input-qualification.json');
	const compatibility=input(productionRoot+'/compatibility.json');
	const zeroRoot=root+'00299-h43-prod-full';parents.push(verifyRun(zeroRoot));
	const zeroRows=/** @type {HorizonProductionComparison[]} */(input(zeroRoot+'/comparison.json'));
	const control=/** @type {HorizonProductionControl} */(input(productionRoot+'/control.json'));
	const zeroControl=/** @type {HorizonProductionControl} */(input(zeroRoot+'/control.json'));
	const zs=zeroControl.request.transportSpec,cs=control.request.transportSpec;
	const changedZero={...zeroControl.request,transportSpec:{...zs,atmosphere:{...zs.atmosphere,mieAngstromBeta:cs.atmosphere.mieAngstromBeta},domains:{...zs.domains,spectrum:{...zs.domains.spectrum,channels:zs.domains.spectrum.channels.map((c,i)=>({...c,mieExtinctionPerMeter:cs.domains.spectrum.channels[i].mieExtinctionPerMeter}))}}}};
	assert.deepEqual(changedZero,control.request,'Zero/full production requests differ outside aerosol extinction.');
	parents.push(...browserSources(['src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js']));
	const display=new ColorResetSlope078P2ColorDisplayModel();
	const rows=[0.05,3,20].map(elevation=>{
		const production=readings.find(r=>r.elevation===elevation&&r.intervals===30),fine=readings.find(r=>r.elevation===elevation&&r.intervals===120);
		const reference=summaries.find(r=>r.id===(elevation===0.05?'full-fine':`full-${elevation}`));assert.ok(production&&fine&&reference);
		const n4=production.cumulative[3], n1=production.cumulative[0];
		return {elevation,production:n4,productionN1:n1,reference,relativeY:n4.color.luminanceCdPerM2/reference.color.luminanceCdPerM2-1,
			viewRefinementRelativeY:fine.cumulative[3].color.luminanceCdPerM2/n4.color.luminanceCdPerM2-1,
			maximumSpectralRelativeDifference:Math.max(...n4.spectrum.map((x,c)=>Math.abs(x/reference.meanSpectrum[c]-1)))};
	});
	const coarse=summaries.find(r=>r.id==='full-0.05'),fine=summaries.find(r=>r.id==='full-fine');assert.ok(coarse&&fine);
	const pairedLayerDifferences=Array.from({length:4},(_,i)=>referenceReadings.find(r=>r.configuration.id==='full-fine'&&r.configuration.repeat===i).color.luminanceCdPerM2-referenceReadings.find(r=>r.configuration.id==='full-0.05'&&r.configuration.repeat===i).color.luminanceCdPerM2);
	const layerRefinement={relativeY:fine.color.luminanceCdPerM2/coarse.color.luminanceCdPerM2-1,pairedDifferencesCdPerM2:pairedLayerDifferences,pairedDifferenceHalfWidth95:halfWidth(pairedLayerDifferences)};
	const zero=zeroRows.find(r=>r.elevation===0.05);assert.ok(zero);
	const aerosolEffect={productionFractionRemaining:rows[0].production.color.luminanceCdPerM2/colorimetry([...zero.productionN4],'bin-integrated').luminanceCdPerM2,referenceFractionRemaining:fine.color.luminanceCdPerM2/colorimetry([...zero.reference],'bin-integrated').luminanceCdPerM2,productionHorizonOver3:rows[0].production.color.luminanceCdPerM2/rows[1].production.color.luminanceCdPerM2,referenceHorizonOver3:fine.color.luminanceCdPerM2/rows[1].reference.color.luminanceCdPerM2};
	const legacy=/** @type {LocalAerosolCase[]} */(input(parent+'/rays.json'));
	const n1Comparison=rows.map(r=>{const independent=legacy.find(c=>c.fraction===1).rows.find(v=>v.heading==='away'&&v.elevation===r.elevation);return {elevation:r.elevation,independentColor:independent.color,quadratureRefinement:independent.refinement,productionColor:r.productionN1.color,relativeY:r.productionN1.color.luminanceCdPerM2/independent.color.luminanceCdPerM2-1};});
	const run=createRun('h44-report',{parents,operation:'Compare full-aerosol production compiler/cubic lookup N4 with independent all-order MYSTIC at exact matched physical inputs; fixed production p2 display, no color fitting.',parameters:{productionRoot,referenceRoot,lux:physical.lux,layerRefinementRelativeY:fine.color.luminanceCdPerM2/coarse.color.luminanceCdPerM2-1}});
	let browser,failure=null;
	try {
		run.write('analysis.json',{rows,coarseHorizon:coarse,fineHorizon:fine,layerRefinement,aerosolEffect,n1Comparison,inputQualification,limitations:['Same source/medium/geometry; production N4 vs external all-orders is not an equal-order numerical error estimate.','Zero gas absorption, black ground, scalar unpolarized atmosphere; these are solved spectral colors, not application screenshots.','Intervals are repeated-seed empirical uncertainty; layer and cache discretization remain distinct.']});run.write('compatibility.json',{productionMeasurement:compatibility,referenceParent:referenceRoot,physicalParent:parent,inputQualification,scope:'Actual full-aerosol reference; earlier zero-aerosol reference inside productionMeasurement is preserved provenance only.'});
		const cells=rows.map((r,i)=>{
			const colors=[r.production.spectrum,r.reference.meanSpectrum].map(s=>colorimetry([...s],'midpoint',false));
			return `<text x="20" y="${142+i*150}">${r.elevation}° elevation</text>${colors.map((c,j)=>{const rgb=display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...c.rgb]),{value:physical.lux,units:'lux'}).map(x=>Math.round(x*255));return `<rect x="${190+j*390}" y="${110+i*150}" width="360" height="95" fill="rgb(${rgb.join(',')})"/><text x="${190+j*390}" y="${227+i*150}">RGB ${rgb.join(', ')}; Y ${[r.production.color,r.reference.color][j].luminanceCdPerM2.toFixed(0)} cd/m²</text>`;}).join('')}`;
		}).join('');
		const comparison=`<svg xmlns="http://www.w3.org/2000/svg" width="990" height="610"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="28" font-size="21">100% aerosol: matched production and libRadtran</text><text x="20" y="53">San Jose noon, away-Sun; SSA 0.8, Cornette–Shanks g=0.7, black ground.</text><text x="190" y="88" font-size="18">Production N4 / Q30</text><text x="580" y="88" font-size="18">libRadtran / all orders</text>${cells}<text x="20" y="580">Same physical source and fixed production p2 display. Sampled spectra, not scene captures.</text><text x="20" y="601">External layer refinement and repeated-run uncertainty are retained in analysis.json.</text></g></svg>`;
		const spectra=`<svg xmlns="http://www.w3.org/2000/svg" width="990" height="760"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="35" y="27" font-size="21">Full-aerosol spectral radiance: production versus external reference</text>${rows.map((r,i)=>{const top=65+220*i,bottom=top+155,max=Math.max(...r.production.spectrum,...r.reference.meanSpectrum)*1.1;return `<text x="50" y="${top}">${r.elevation}°; production Y ${(100*r.relativeY).toFixed(2)}% relative to reference</text><path d="M65 ${top+10}V${bottom}H950" fill="none" stroke="#aaa"/>${[r.production.spectrum,r.reference.meanSpectrum].map((s,j)=>`<path d="${s.map((x,c)=>`${c?'L':'M'}${65+(centers[c]-centers[0])/(centers.at(-1)-centers[0])*885},${bottom-x/max*140}`).join(' ')}" fill="none" stroke="${['#b22561','#166ec1'][j]}" stroke-width="2"/>`).join('')}<text x="65" y="${bottom+18}">${centers[0].toFixed(1)}–${centers.at(-1).toFixed(1)} nm; scale ${max.toFixed(4)} W m^-2 sr^-1 nm^-1</text>`;}).join('')}<text x="65" y="745" fill="#b22561">Production N4</text><text x="360" y="745" fill="#166ec1">libRadtran all orders</text></g></svg>`;
		const effectInputs=[zero.productionN4,rows[0].production.spectrum,zero.reference,fine.meanSpectrum];
		const effectColors=effectInputs.map(s=>({color:colorimetry([...s],'bin-integrated'),rgb:display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry([...s],'midpoint',false).rgb]),{value:physical.lux,units:'lux'}).map(x=>Math.round(255*x))}));
		const effect=`<svg xmlns="http://www.w3.org/2000/svg" width="990" height="490"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="28" font-size="21">Aerosol effect on the matched distant horizon</text><text x="20" y="52">San Jose noon, 0.05° away-Sun; same source and fixed production p2 display.</text><text x="210" y="84" font-size="18">0% aerosol</text><text x="600" y="84" font-size="18">100% aerosol</text>${effectColors.map((r,i)=>{const x=210+(i%2)*390,y=110+Math.floor(i/2)*160;return `<rect x="${x}" y="${y}" width="360" height="100" fill="rgb(${r.rgb.join(',')})"/><text x="${x}" y="${y+123}">RGB ${r.rgb.join(', ')}; Y ${r.color.luminanceCdPerM2.toFixed(0)} cd/m²</text>`;}).join('')}<text x="20" y="150" font-size="17">Production N4</text><text x="20" y="310" font-size="17">libRadtran all orders</text><text x="20" y="450">Full-aerosol reference uses 768 layers and four independent repeated seeds.</text><text x="20" y="475">Solved spectral colors; atmosphere, source and display matching are qualified in the retained report.</text></g></svg>`;
		run.write('comparison.svg',comparison);run.write('spectra.svg',spectra);run.write('aerosol-effect.svg',effect);run.write('display-colors.json',effectColors);
		browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'chrome-profile'),false),protocolTimeout:60000,args:['--enable-gpu','--use-angle=d3d11']});const page=await browser.newPage();
		for (const [name,svg,height] of [['comparison',comparison,610],['spectra',spectra,760],['aerosol-effect',effect,490]]) {await page.setViewport({width:990,height:Number(height),deviceScaleFactor:1});await page.setContent(`<style>body{margin:0}</style>${svg}`);run.write(`${name}.png`,Buffer.from(await page.screenshot({type:'png'})));}
		run.write('tool.json',{node:process.version,browser:await browser.version()});
	} catch(e){failure=e;}
	finally {await browser?.close().catch(e=>{failure??=e;});run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
	verifyRun(run.path);console.log(JSON.stringify({run:run.path,rows:rows.map(r=>({elevation:r.elevation,relativeY:r.relativeY,viewRefinementRelativeY:r.viewRefinementRelativeY,referenceRelativeYHalfWidth95:r.reference.luminanceHalfWidth95/r.reference.color.luminanceCdPerM2}))}));if(failure)throw failure;
}

if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
	if(process.argv[2]==='recover'){assert.equal(process.argv.length,4);await recover(process.argv[3]);}
	else if(process.argv[2]==='report'){assert.equal(process.argv.length,5);await report(process.argv[3],process.argv[4]);}
	else {assert.equal(process.argv.length,3);assert.ok(['pilot','measure'].includes(process.argv[2]));await measure(process.argv[2]==='pilot');}
}
