import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun,identity,readRepository,verifyRun,checkedAbsolute,repositoryRoot} from '../io/files.mjs';
import {browserSources} from '../execution.mjs';
import {aerosolMaterial,aerosolPhase} from '../horizon/aerosol-optics.mjs';
import {colorimetry,ciePath} from '../horizon/diagnosis-color.mjs';
import {transport} from '../horizon/diagnosis-transport.mjs';
import {invoke,halfWidth} from './libradtran.mjs';
import {replay} from './production.mjs';
import {originalPhase} from './toronto-phase.js';
import {directBundle} from './toronto-direct.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const root='tmp/experiments/sky-accuracy-dials/runs/',h40=root+'00288-h40-distant',h44=root+'00303-h44-prod-full';
const opticalRoot=root+'00235-aerosol-screen',opticalPath=opticalRoot+'/inputs.json.gz';
const entry='experiments/sky-accuracy-dials/distant-horizon/production-browser.js';
const compiler='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const centers=NATIVE_15_SPECTRAL_BASIS.channels.map(c=>c.center.value);

/** Read authenticated input, preserving the earlier retrieval and every production parameter.
 * @returns {{parents:DialFileIdentity[],physical:HorizonLibParent,control:HorizonProductionControl,material:HorizonAerosolMaterial}}
 */
function inputs(){
	const parents=[verifyRun(h40),verifyRun(h44),verifyRun(opticalRoot),identity(opticalPath),identity(h40+'/registration.json'),identity(h44+'/control.json'),identity(ciePath),identity('scripts/libradtran/cli.js'),identity('scripts/libradtran/worker.py'),identity('scripts/libradtran/installation.json'),identity('references/downloads/libradtran-2.0.1/libRadtran-2.0.1/src_py/aerosol_options.py')];
	const physical=/** @type {HorizonLibParent} */(JSON.parse(readRepository(h40+'/registration.json').toString()));
	const control=/** @type {HorizonProductionControl} */(JSON.parse(readRepository(h44+'/control.json').toString()));
	const optical=JSON.parse(gunzipSync(readRepository(opticalPath)).toString()).optical;
	const material=aerosolMaterial(optical.bands,centers,physical.medium.albedo);
	assert.deepEqual(material.unsupportedCenters,centers.filter(w=>w<440));
	return {parents,physical,control:{...control,material},material};
}

/** Rasterize authored spectral-color evidence in a bounded browser, with owned scratch.
 * @param {DialRun} run Active evidence owner. @param {string} svg Authored figure.
 * @param {string} name Artifact stem. @param {number} height Pixel height.
 * @returns {Promise<void>} Retained SVG/PNG; browser always closed.
 */
async function image(run,svg,name,height){
	run.write(name+'.svg',svg);let browser;
	try{browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'image-'+name),false),args:['--enable-gpu','--use-angle=d3d11']});const page=await browser.newPage();await page.setViewport({width:1080,height,deviceScaleFactor:1});await page.setContent('<style>body{margin:0}</style>'+svg);run.write(name+'.png',Buffer.from(await page.screenshot({type:'png'})));}finally{await browser?.close();}
}

/** Execute the production algorithm with an explicitly contained Toronto phase/SSA adapter.
 * @returns {Promise<void>} Hardware spectra and same-input replay parity; no deployed changes.
 */
async function production(){
	const {parents,control,physical}=inputs();parents.push(...browserSources([entry]));
	const source=readRepository(compiler).toString().replaceAll('\r\n','\n');assert.equal(source.split(originalPhase).length,2);
	const adapter='experiments/sky-accuracy-dials/distant-horizon/toronto-phase.js';
	const replaced=source.replace(originalPhase,'${torontoPhaseGlsl(wavelengthNanometers)}');
	const transformed=`import {torontoPhaseGlsl} from '${path.resolve(repositoryRoot,adapter).split(path.sep).join('/')}';\n`+replaced;
	const run=createRun('h45-toronto-prod',{parents,operation:'Production Native48/Z180/W27/F68 compiler and cubic lookup with experiment-only normalized Toronto phase and wavelength SSA. All extinction, source, geometry, numerical settings and view samples equal H44. Production files/deployment unchanged.',parameters:{adapter,changedCompilerFunction:'miePhase only',perChannelSsa:control.material.albedos,unsupportedCenters:control.material.unsupportedCenters,lux:physical.lux}});
	let browser,failure=null;
	try{
		run.write('control.json',control);run.write('compiler-adapted.js.gz',gzipSync(Buffer.from(transformed)));
		const bundle=await rollup({input:checkedAbsolute(path.join(repositoryRoot,entry)),plugins:[{name:'contained-toronto-phase',transform(code,id){return path.resolve(id)===path.resolve(repositoryRoot,compiler)?{code:transformed,map:null}:null;}}]});
		let code;try{code=(await bundle.generate({format:'iife'})).output[0].code;}finally{await bundle.close();}
		run.write('browser.js.gz',gzipSync(Buffer.from(code)));
		browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu-profile'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});
		const page=await browser.newPage();await page.exposeFunction('__h43Progress',message=>run.progress('gpu',String(message)));await page.addScriptTag({content:code});
		const result=await page.evaluate(c=>window.__h43Evaluate(c),control),plan=control.plan,m=physical.medium;
		let maximumLookupRelative=0;
		for(const c of result.reports){const field=new Float32Array(plan.coordinates.length);for(let o=0;o<4;o++){c.pure[o].forEach((x,i)=>field[i]=o===0?x:Math.fround(field[i]+x));plan.jobs.forEach((job,j)=>{const expected=replay(job,plan,field,m.rayleigh[c.channel],m.rayleighHeight,m.mie[c.channel],m.mieHeight);maximumLookupRelative=Math.max(maximumLookupRelative,Math.abs(expected-c.spectra[o][j])/Math.max(1e-12,expected));});}}
		assert.ok(maximumLookupRelative<0.001);
		const readings=plan.jobs.map((job,j)=>({elevation:job.elevation,intervals:job.intervals,cumulative:[0,1,2,3].map(o=>{const spectrum=result.reports.map(c=>c.spectra[o][j]);return {order:o+1,spectrum,color:colorimetry(spectrum,'bin-integrated')};})}));
		run.write('readings.json',readings);run.write('channels.json.gz',gzipSync(Buffer.from(JSON.stringify(result.reports))));run.write('compatibility.json',{maximumLookupRelative,renderer:result.renderer,originalCompiler:identity(compiler),adaptedCompiler:identity(run.path+'/compiler-adapted.js.gz'),actualChannelSsa:control.material.albedos,scope:'Production algorithm with contained material adapter; not unchanged deployed optical model or app screenshots.'});
	}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
	verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Qualify the direct-table native input route cheaply before a repeated reference package.
 * @returns {Promise<void>} New immutable operational proof; not an accuracy/convergence claim.
 */
async function pilot(){
	const {parents,physical,material}=inputs(),configuration={id:'direct-pilot',elevation:0.05,layers:64,repeat:0,photons:1000,channels:Array.from({length:15},(_,i)=>i),epsilon:1,vroomOff:true};
	const run=createRun('h45-direct-pilot',{parents,operation:'Three-band operational qualification of existing MYSTIC direct angular optical-library input; no native solver changes.',parameters:{configuration}});let failure=null;
	try{
		const files=directBundle(physical.medium,configuration,material,false),directory=checkedAbsolute(path.join(run.scratchPath,'case'),false);mkdirSync(directory);for(const [name,value] of files)writeFileSync(path.join(directory,name),value,{flag:'wx'});
		run.write('metadata.json',JSON.parse(String(files.get('case.json'))));run.progress('solver','Direct optical library pilot, three bands/1000 photons.');const launch=await invoke(directory,120);run.write('launch.json',launch);assert.equal(launch.code,0,launch.stderr);
		const absolute=launch.stdout.match(/libRadtran run: (.+)/)?.[1].trim();assert.ok(absolute);const toolRun=path.relative(repositoryRoot,checkedAbsolute(absolute)).split(path.sep).join('/');assert.ok(toolRun.startsWith('.codex-tmp/libradtran/runs/'));
		const manifest=JSON.parse(readRepository(toolRun+'/manifest.json').toString());assert.equal(manifest.status,'succeeded');for(const [name,value] of files){const a=manifest.artifacts.find(a=>a.path==='case/'+name);assert.ok(a);assert.equal(a.sha256,createHash('sha256').update(value).digest('hex'));}
		const raw=readRepository(toolRun+'/execution/mc.rad.spc'),rows=raw.toString().trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));assert.equal(rows.length,15);assert.ok(rows.every((r,i)=>Math.abs(r[0]-centers[configuration.channels[i]])<0.001&&r[4]>0));
		run.write('raw.txt',raw,{parents:[...parents,identity(toolRun+'/manifest.json'),identity(toolRun+'/execution/mc.rad.spc')],operation:'Original mW output and native import success; three positive labelled bands.'});run.write('solver-log.txt',readRepository(toolRun+'/stderr.txt'));run.write('proof.json',{toolRun,actualInputHashesMatched:true,threePositiveBands:true,scientificAccuracyQualified:false});
	}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Run independently repeated all-order reference with explicit matched wavelength-dependent material.
 * @returns {Promise<void>} Sealed raw-tool provenance, means, uncertainty, phase/layer controls.
 */
async function reference(){
	const {parents,physical,material}=inputs(),m=physical.medium;
	const productionRoot=process.argv[3];assert.match(productionRoot,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h45-toronto-prod$/);
	parents.push(verifyRun(productionRoot),identity(productionRoot+'/readings.json'));
	const run=createRun('h45-toronto-ref',{parents,operation:'Fully spherical scalar MYSTIC all orders, VROOM off; same H44 extinction/source/geometry, Toronto phase+SSA above440nm, analytic CS/SSA0.8 below. Direct angular optical library avoids per-layer Legendre expansion; independent phase and layer refinements.',parameters:{repeats:4,photons:100000,lux:physical.lux,unsupportedCenters:material.unsupportedCenters}});
	const configs=[{id:'full-0.05',elevation:0.05,layers:256,angularRefinement:false},{id:'full-3',elevation:3,layers:256,angularRefinement:false},{id:'full-20',elevation:20,layers:256,angularRefinement:false},{id:'full-fine',elevation:0.05,layers:512,angularRefinement:false},{id:'phase-fine',elevation:0.05,layers:256,angularRefinement:true}];
	const readings=/** @type {HorizonLibReading[]} */([]),summaries=/** @type {HorizonLibSummary[]} */([]),allParents=[...parents];
	let failure=null;
	try{
		run.write('phase-proof.json',{representation:'Direct normalized linear-cosine phase above440nm, original83 nodes; refined inserts exact linear midpoints. Analytic CS below440nm sampled at0.1deg and refined0.05deg. No Legendre truncation. Actual binary library retained by shared tool; parser owns import validation.'});
		run.write('registration.json',{physical,material,configs,phaseRepresentation:'Direct angular phase library; measured linear-cosine PDF, positive by construction. Independent angular refinement control.'});
		for(const selected of configs)for(let repeat=0;repeat<4;repeat++){
			const started=Date.now();
			const config={...selected,repeat,photons:100000,channels:Array.from({length:15},(_,i)=>i),epsilon:1,vroomOff:true};
			const files=directBundle(m,config,material,selected.angularRefinement);
			const directory=checkedAbsolute(path.join(run.scratchPath,selected.id+'-'+repeat),false);mkdirSync(directory);let written=0;for(const [name,contents] of files){writeFileSync(path.join(directory,name),contents,{flag:'wx'});if(++written%16===0)run.progress('staging',`${selected.id} input ${written}/${files.size}.`);}
			run.progress('solver',`${selected.id}, repeat ${repeat+1}/4`,readings.length,20);console.log(JSON.stringify({phase:'solver',id:selected.id,repeat,completed:readings.length}));
			const launch=await invoke(directory,600);run.progress('authenticate',`${selected.id} solver returned.`);run.write(`launch-${selected.id}-${repeat}.json`,launch);assert.equal(launch.code,0,launch.stderr);
			const absolute=launch.stdout.match(/libRadtran run: (.+)/)?.[1].trim();assert.ok(absolute);const toolRun=path.relative(repositoryRoot,checkedAbsolute(absolute)).split(path.sep).join('/');assert.ok(toolRun.startsWith('.codex-tmp/libradtran/runs/'));
			const manifestPath=toolRun+'/manifest.json',manifest=/** @type {HorizonLibManifest} */(JSON.parse(readRepository(manifestPath).toString()));assert.equal(manifest.status,'succeeded');
			let checked=0;for(const [name,contents] of files){const a=manifest.artifacts.find(a=>a.path==='case/'+name),b=manifest.artifacts.find(a=>a.path==='execution/'+name);assert.ok(a&&b);assert.equal(a.sha256,createHash('sha256').update(contents).digest('hex'));if(name!=='input.inp')assert.equal(a.sha256,b.sha256);if(++checked%32===0)run.progress('authenticate',`${selected.id} checked ${checked}/${files.size} inputs.`);}
			const deck=readRepository(toolRun+'/execution/input.inp').toString();assert.ok(deck.includes('mc_spherical 1D')&&deck.includes('mc_vroom off')&&deck.includes('albedo 0')&&deck.includes('aerosol_species_file species.txt toronto'));
			const raw=manifest.artifacts.find(a=>a.path==='execution/mc.rad.spc');assert.ok(raw);const bytes=readRepository(toolRun+'/'+raw.path,raw.sha256),log=readRepository(toolRun+'/stderr.txt');assert.ok(!/phase function .* negative|vroom not yet validated/i.test(log.toString()));
			const rows=bytes.toString().trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));assert.equal(rows.length,15);const spectrum=rows.map((r,c)=>{assert.ok(Math.abs(r[0]-centers[c])<0.001&&r[4]>=0&&Number.isFinite(r[4]));return r[4]/1000;});
			const reading={configuration:config,toolRun,spectrum,dividedSpectrum:spectrum,color:colorimetry(spectrum,'bin-integrated'),elapsedMilliseconds:Date.now()-started};readings.push(reading);allParents.push(identity(manifestPath),identity(toolRun+'/'+raw.path),identity(toolRun+'/case/case.json'));
			const metadata=JSON.parse(String(files.get('case.json')));run.write(`input-proof-${selected.id}-${repeat}.json`,{toolRun,allOriginalAndExecutedInputsMatched:true,library:identity(toolRun+'/case/toronto.material.cdf'),actualBinaryOpticalProof:metadata.actualBinaryOpticalProof,maximumColumnRelativeError:metadata.maximumColumnRelativeError,phase:metadata.phase},{parents:allParents.slice(-3),operation:'Actual library bytes independently decoded for source wavelength/extinction/SSA/phase and normalization; exact exponential layer columns, all original/executed input hashes matched.'});
			run.write(`raw-${selected.id}-${repeat}.txt`,bytes,{parents:allParents.slice(-3),operation:'Authenticated external radiance copied in original mW units; derived spectrum divides by1000.'});run.write(`log-${selected.id}-${repeat}.txt`,log);run.write(`reading-${selected.id}-${repeat}.json`,reading);
			assert.ok(directory.startsWith(run.scratchPath+path.sep));checkedAbsolute(directory);for(const name of files.keys())checkedAbsolute(path.join(directory,name));rmSync(directory,{recursive:true});
			console.log(JSON.stringify({completed:readings.length,id:selected.id,repeat,Y:reading.color.luminanceCdPerM2,RB:reading.color.redBlueRatio}));
			if(repeat===3){const set=readings.filter(r=>r.configuration.id===selected.id),meanSpectrum=centers.map((_,c)=>set.reduce((s,r)=>s+r.spectrum[c],0)/4),color=colorimetry(meanSpectrum,'bin-integrated');const summary={...selected,epsilon:1,repeats:4,meanSpectrum,meanDividedSpectrum:meanSpectrum,color,parentColor:color,redBlueHalfWidth95:halfWidth(set.map(r=>r.color.redBlueRatio)),luminanceHalfWidth95:halfWidth(set.map(r=>r.color.luminanceCdPerM2)),maximumSpectralHalfWidth95Relative:Math.max(...meanSpectrum.map((x,c)=>halfWidth(set.map(r=>r.spectrum[c]))/x)),maximumRelativeToParentN1:0};summaries.push(summary);run.write(`summary-${selected.id}.json`,summary);
				if(selected.id==='full-0.05'){
					const prod=JSON.parse(readRepository(productionRoot+'/readings.json').toString()).find(r=>r.elevation===0.05&&r.intervals===30).cumulative[3];
					const display=new ColorResetSlope078P2ColorDisplayModel(),values=[prod.spectrum,meanSpectrum];
					const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="300"><rect width="100%" height="100%" fill="white"/><g fill="#111" font-family="sans-serif"><text x="20" y="30" font-size="22">Toronto horizon: preliminary comparison</text><text x="20" y="55">0.05° away-Sun; four seeds, standard layers/direct phase table. Refinements pending.</text>${values.map((v,j)=>{const c=colorimetry(v,'bin-integrated'),rgb=display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry(v,'midpoint',false).rgb]),{value:physical.lux,units:'lux'}).map(x=>Math.round(x*255)),x=30+j*530;return `<text x="${x}" y="90" font-size="18">${j?'libRadtran all orders':'Production algorithm N4'}</text><rect x="${x}" y="110" width="490" height="115" fill="rgb(${rgb.join(',')})"/><text x="${x}" y="250">Y ${c.luminanceCdPerM2.toFixed(0)}; R/B ${c.redBlueRatio.toFixed(3)}</text>`;}).join('')}<text x="20" y="285">Fixed display; sampled spectral colors, not a screenshot or final convergence result.</text></g></svg>`;
					await image(run,svg,'progress-horizon',300);console.log(JSON.stringify({preview:run.path+'/progress-horizon.png'}));
				}
			}
		}
		run.write('readings.json',readings,{parents:allParents,operation:'Twenty independently finalized external executions with authenticated original/executed optical bytes.'});run.write('summary.json',summaries);
	}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,cases:readings.length});}
	verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Create final fixed-display comparisons, numeric residuals and independent refinement controls.
 * @param {string} prod Accepted Toronto production-algorithm run.
 * @param {string} ref Accepted Toronto external reference run.
 * @returns {Promise<void>} New immutable figures/analysis; no numerical rerun.
 */
async function report(prod,ref){
	assert.match(prod,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h45-toronto-prod$/);assert.match(ref,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h45-toronto-ref$/);
	const {parents,physical}=inputs();parents.push(verifyRun(prod),verifyRun(ref),verifyRun(root+'00308-h44-report'),...browserSources(['src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js']));
	const files=[prod+'/readings.json',ref+'/readings.json',ref+'/summary.json',ref+'/phase-proof.json',prod+'/control.json',ref+'/registration.json',prod+'/compatibility.json',root+'00308-h44-report/analysis.json'];parents.push(...files.map(p=>identity(p)));
	const p=/** @type {HorizonProductionReading[]} */(JSON.parse(readRepository(files[0]).toString())),samples=/** @type {HorizonLibReading[]} */(JSON.parse(readRepository(files[1]).toString())),s=/** @type {HorizonLibSummary[]} */(JSON.parse(readRepository(files[2]).toString()));
	const old=JSON.parse(readRepository(files[7]).toString()),control=JSON.parse(readRepository(files[4]).toString()),registration=JSON.parse(readRepository(files[5]).toString());assert.deepEqual(control.material,registration.material);
	const originalControl=JSON.parse(readRepository(h44+'/control.json').toString()),{material,...rest}=control;assert.deepEqual(rest,originalControl);
	const originalReadings=/** @type {HorizonProductionReading[]} */(JSON.parse(readRepository(h44+'/readings.json').toString()));parents.push(identity(h44+'/readings.json'));
	let identicalUnsupportedValues=0;for(let j=0;j<p.length;j++)for(let o=0;o<4;o++)for(let c=0;c<3;c++){assert.equal(p[j].cumulative[o].spectrum[c],originalReadings[j].cumulative[o].spectrum[c]);identicalUnsupportedValues++;}
	const inputProofs=samples.map(r=>{const file=ref+`/input-proof-${r.configuration.id}-${r.configuration.repeat}.json`;parents.push(identity(file));return JSON.parse(readRepository(file).toString());});
	const rows=[0.05,3,20].map(elevation=>{const production=p.find(r=>r.elevation===elevation&&r.intervals===30).cumulative[3],view=p.find(r=>r.elevation===elevation&&r.intervals===120).cumulative[3],reference=s.find(r=>r.id===(elevation===0.05?'full-fine':`full-${elevation}`));return {elevation,production,reference,relativeY:production.color.luminanceCdPerM2/reference.color.luminanceCdPerM2-1,viewRefinementRelativeY:view.color.luminanceCdPerM2/production.color.luminanceCdPerM2-1,maximumSpectralRelativeDifference:Math.max(...production.spectrum.map((x,c)=>Math.abs(x/reference.meanSpectrum[c]-1)))};});
	const base=s.find(r=>r.id==='full-0.05'),fine=s.find(r=>r.id==='full-fine'),phase=s.find(r=>r.id==='phase-fine');
	const refinement=['full-fine','phase-fine'].map(id=>{const after=s.find(r=>r.id===id),d=Array.from({length:4},(_,i)=>samples.find(r=>r.configuration.id===id&&r.configuration.repeat===i).color.luminanceCdPerM2-samples.find(r=>r.configuration.id==='full-0.05'&&r.configuration.repeat===i).color.luminanceCdPerM2);return {id,relativeY:after.color.luminanceCdPerM2/base.color.luminanceCdPerM2-1,redBlueDifference:after.color.redBlueRatio-base.color.redBlueRatio,pairedLuminanceDifferences:d,pairedHalfWidth95:halfWidth(d)};});
	const run=createRun('h45-report',{parents,operation:'Matched Toronto aerosol production-algorithm versus libRadtran spectral and display comparison; independent layer and phase controls, fixed H44 illuminance, immutable parents. Diagnose unchanged constant-field angular quadrature and independent continuous N1, without extra transport campaigns.',parameters:{prod,ref,scope:'Toronto phase+SSA above440nm only; default extinction and San Jose noon remain. No claim of complete Toronto atmosphere or a measured Toronto sky.'}});
	let failure=null;
	try{
		const spec=control.request.transportSpec,inc=spec.domains.incoming,out=spec.domains.outgoing;
		assert.ok(Math.abs(inc.integrationWeightsSteradians.reduce((a,b)=>a+b,0)-4*Math.PI)<1e-10);
		const phaseMass=control.material.phaseTables.map((table,c)=>{
			let minimum=Infinity,maximum=0,sum=0,worst=0,canonicalMinimum=Infinity,canonicalMaximum=0;
			for(let j=0;j<out.unitVectors.length;j++){
				let value=0,canonical=0;for(let k=0;k<inc.unitVectors.length;k++){const mu=Math.max(-1,Math.min(1,out.unitVectors[j].reduce((z,x,i)=>z+x*inc.unitVectors[k][i],0))),g=physical.medium.g,cs=3*(1-g*g)*(1+mu*mu)/(8*Math.PI*(2+g*g)*(1+g*g-2*g*mu)**1.5);canonical+=inc.integrationWeightsSteradians[k]*cs;value+=inc.integrationWeightsSteradians[k]*(table?aerosolPhase(table,mu):cs);}
				minimum=Math.min(minimum,value);sum+=value;if(value>maximum){maximum=value;worst=j;}canonicalMinimum=Math.min(canonicalMinimum,canonical);canonicalMaximum=Math.max(canonicalMaximum,canonical);
			}run.progress('diagnostic',`Constant-field phase mass, channel ${c}.`);return {channel:c,wavelength:centers[c],minimum,maximum,arithmeticMeanOverW27Nodes:sum/out.unitVectors.length,worstOutgoingIndex:worst,canonicalMinimum,canonicalMaximum,continuousTarget:1};
		});
		const independentN1=rows.map(row=>{const angle=row.elevation*Math.PI/180,input={...physical.medium,rayleigh:[...physical.medium.rayleigh],mie:[...physical.medium.mie],sourcePosition:[...physical.medium.sourcePosition],sourceDirection:[...physical.medium.sourceDirection],sourceIrradiance:[...physical.medium.sourceIrradiance],direction:[0,Math.cos(angle),Math.sin(angle)],aerosolPhaseTables:material.phaseTables,aerosolAlbedos:material.albedos},a=transport(input,2048,128),b=transport(input,4096,128),color=colorimetry(b.spectrum,'bin-integrated'),production=p.find(r=>r.elevation===row.elevation&&r.intervals===30).cumulative[0];return {elevation:row.elevation,spectrum:b.spectrum,color,view2048To4096RelativeY:color.luminanceCdPerM2/colorimetry(a.spectrum,'bin-integrated').luminanceCdPerM2-1,productionN1Color:production.color,productionN1RelativeY:production.color.luminanceCdPerM2/color.luminanceCdPerM2-1,cumulativeProductionY:p.find(r=>r.elevation===row.elevation&&r.intervals===30).cumulative.map(v=>v.color.luminanceCdPerM2)};});
		run.write('diagnostics.json',{phaseMass,independentN1,interpretation:'Normalized continuous phase integrates to1. Existing F68 weights integrate the sharper measured shape poorly at some outgoing nodes, up to~6. This demonstrates a resolution defect for this experimental optical input and supports later-order overshoot as a hypothesis, but is not a causal radiance budget or a tested fix. Default canonical phase remains a separate case.'});
		run.write('input-qualification.json',{inputProofs,physicalAndNumericalControlsUnchanged:true,identicalUnsupportedValues,materialEquality:true,externalInputsAuthenticated:true});
		run.write('analysis.json',{rows,refinement,phaseProof:JSON.parse(readRepository(files[3]).toString()),baselineH44:old.rows,limitations:['Measured phase/SSA only; H44 extinction, height profiles, source and San Jose geometry retained.','Below440nm retains default material; exploratory AERONET Level1.5 retrieval.','Production algorithm uses experimental phase adapter; N4 vs all orders.','Direct angular Float32 representation error is separate from layer and sampling uncertainty; no Legendre truncation in qualified results.','Solved spectral colors, not application captures.']});run.write('compatibility.json',{production:JSON.parse(readRepository(files[6]).toString()),referenceRegistration:registration,refinement,actualMaterialEquality:true,productionFilesChanged:false});
		const display=new ColorResetSlope078P2ColorDisplayModel(),colors=rows.map(r=>[r.production.spectrum,r.reference.meanSpectrum].map(values=>display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry([...values],'midpoint',false).rgb]),{value:physical.lux,units:'lux'}).map(x=>Math.round(x*255))));
		const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="650"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="22">Toronto aerosol material: matched horizon probes</text><text x="20" y="56">Same San Jose noon rays and extinction; measured phase/SSA above 440 nm, default below.</text><text x="180" y="92" font-size="18">Production algorithm N4</text><text x="620" y="92" font-size="18">libRadtran all orders</text>${rows.map((r,i)=>`<text x="20" y="${155+i*150}">${r.elevation}° elevation</text>${colors[i].map((rgb,j)=>`<rect x="${180+j*440}" y="${115+i*150}" width="415" height="95" fill="rgb(${rgb.join(',')})"/><text x="${180+j*440}" y="${232+i*150}">RGB ${rgb.join(', ')}; Y ${[r.production.color,r.reference.color][j].luminanceCdPerM2.toFixed(0)} cd/m²</text>`).join('')}`).join('')}<text x="20" y="590">Fixed production p2 display; no white balance, exposure fit or production deployment change.</text><text x="20" y="617">Sampled spectra, not screenshots. External means: four seeds; phase/layer controls retained separately.</text></g></svg>`;
		await image(run,svg,'comparison',650);
		const effect=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="500"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="22">Horizon material response, 0.05° away from Sun</text><text x="220" y="85" font-size="18">Default 100% aerosol</text><text x="650" y="85" font-size="18">Toronto phase + SSA</text>${[old.rows[0].production.spectrum,rows[0].production.spectrum,old.rows[0].reference.meanSpectrum,rows[0].reference.meanSpectrum].map((v,i)=>{const c=colorimetry(v,'bin-integrated'),rgb=display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry(v,'midpoint',false).rgb]),{value:physical.lux,units:'lux'}).map(x=>Math.round(x*255)),x=220+i%2*430,y=115+Math.floor(i/2)*155;return `<rect x="${x}" y="${y}" width="405" height="100" fill="rgb(${rgb.join(',')})"/><text x="${x}" y="${y+123}">Y ${c.luminanceCdPerM2.toFixed(0)}; R/B ${c.redBlueRatio.toFixed(3)}; RGB ${rgb.join(', ')}</text>`;}).join('')}<text x="20" y="160">Production N4</text><text x="20" y="315">libRadtran</text><text x="20" y="470">Same physical source, extinction, view and fixed display. Toronto optical adapter is experimental.</text></g></svg>`;
		await image(run,effect,'material-effect',500);
		const spectra=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="770"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="30" y="28" font-size="22">Toronto material: spectral radiance comparison</text>${rows.map((r,i)=>{const top=65+i*220,bottom=top+155,max=Math.max(...r.production.spectrum,...r.reference.meanSpectrum)*1.1;return `<text x="55" y="${top}">${r.elevation}°; production Y ${(r.relativeY*100).toFixed(2)}% relative to libRadtran</text><path d="M65 ${top+10}V${bottom}H1020" fill="none" stroke="#999"/>${[r.production.spectrum,r.reference.meanSpectrum].map((v,j)=>`<path d="${v.map((x,c)=>`${c?'L':'M'}${65+(centers[c]-centers[0])/(centers.at(-1)-centers[0])*955},${bottom-x/max*140}`).join(' ')}" fill="none" stroke="${['#b22561','#166ec1'][j]}" stroke-width="2"/>`).join('')}<text x="65" y="${bottom+20}">${centers[0].toFixed(1)}–${centers.at(-1).toFixed(1)} nm; scale ${max.toFixed(4)} W m^-2 sr^-1 nm^-1</text>`;}).join('')}<text x="65" y="750" fill="#b22561">Production algorithm N4</text><text x="450" y="750" fill="#166ec1">libRadtran all orders</text></g></svg>`;
		await image(run,spectra,'spectra',770);run.write('display-colors.json',colors);console.log(JSON.stringify({rows:rows.map(r=>({elevation:r.elevation,Y:r.production.color.luminanceCdPerM2,referenceY:r.reference.color.luminanceCdPerM2,referenceY95:r.reference.luminanceHalfWidth95,relativeY:r.relativeY,RB:r.production.color.redBlueRatio,referenceRB:r.reference.color.redBlueRatio})),refinement}));
	}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
	verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

const mode=process.argv[2];
if(mode==='production'){assert.equal(process.argv.length,3);await production();}
else if(mode==='pilot'){assert.equal(process.argv.length,3);await pilot();}
else if(mode==='reference'){assert.equal(process.argv.length,4);await reference();}
else if(mode==='report'){assert.equal(process.argv.length,5);await report(process.argv[3],process.argv[4]);}
else throw new Error('Select internal production, reference, or report mode.');
