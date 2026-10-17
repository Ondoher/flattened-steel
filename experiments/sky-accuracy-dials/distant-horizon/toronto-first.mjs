import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync,readdirSync,rmSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {createRun,verifyRun,identity,readRepository,checkedAbsolute,repositoryRoot} from '../io/files.mjs';
import {browserSources} from '../execution.mjs';
import {directBundle} from './toronto-direct.mjs';
import {invoke,halfWidth} from './libradtran.mjs';
import {colorimetry,ciePath} from '../horizon/diagnosis-color.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const root='tmp/experiments/sky-accuracy-dials/runs/',prod=root+'00310-h45-toronto-prod',full=root+'00315-h45-toronto-ref',diagnostic=root+'00316-h45-report',geometry=root+'00288-h40-distant';
const centers=NATIVE_15_SPECTRAL_BASIS.channels.map(c=>c.center.value);

/** Frozen Toronto physical target and provenance; original values remain immutable.
 * @returns {{parents:DialFileIdentity[],physical:HorizonLibParent,material:HorizonAerosolMaterial}}
 */
function inputs(){
	const parents=[prod,full,diagnostic,geometry].map(verifyRun),registration=geometry+'/registration.json',control=prod+'/control.json';parents.push(identity(registration),identity(control),identity(ciePath),identity('scripts/libradtran/cli.js'),identity('scripts/libradtran/worker.py'),identity('scripts/libradtran/installation.json'));
	return {parents,physical:/** @type {HorizonLibParent} */(JSON.parse(readRepository(registration).toString())),material:/** @type {HorizonProductionControl} */(JSON.parse(readRepository(control).toString())).material};
}

/** Scale both species' scattering at fixed total extinction, retaining actual molecular input checks.
 * @param {HorizonReferenceMedium} medium Physical target before the mathematical intervention.
 * @param {HorizonAerosolMaterial} material Original Toronto phase/SSA.
 * @param {HorizonLibCase} config Actual numerical, seed and scattering-fraction controls.
 * @returns {Map<string,string|Buffer>} Native case, with unchanged attenuation and epsilon-scaled scattering.
 */
function weakBundle(medium,material,config){
	const e=config.epsilon;assert.ok(e>0&&e<=1);
	const effective={...material,albedos:material.albedos.map(x=>e*x)},files=directBundle(medium,{...config,epsilon:1},effective,false);
	const original=String(files.get('scattering.txt')).trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));
	const sca=[original[0].join(' ')],abs=[original[0].join(' ')];let maximumTotalExtinctionRelativeError=0;
	for(const row of original.slice(1)){
		const a=row.slice(1).map(x=>e*x),b=row.slice(1).map(x=>(1-e)*x);
		a.forEach((x,i)=>maximumTotalExtinctionRelativeError=Math.max(maximumTotalExtinctionRelativeError,Math.abs((x+b[i])/row[i+1]-1)));
		sca.push([row[0],...a].join(' '));abs.push([row[0],...b].join(' '));
	}
	assert.ok(maximumTotalExtinctionRelativeError<1e-12);files.set('scattering.txt',sca.join('\n')+'\n');files.set('absorption.txt',abs.join('\n')+'\n');
	const metadata=JSON.parse(String(files.get('case.json')));metadata.purpose='H46 Toronto libRadtran weak-scattering first-order limit at fixed total extinction';metadata.configuration=config;metadata.originalMaterial=material;metadata.scatteringIntervention={epsilon:e,rayleighScatteringScale:e,aerosolScatteringScale:e,aerosolExtinctionScale:1,molecularScatteringPlusAbsorptionPreserved:true,maximumTotalExtinctionRelativeError,equation:'L(e)=sum_{n>=1} e^n L_n. Phase, extinction, source and boundaries fixed; no ground source.'};metadata.limitations.push('This weak-scattering calculation is a mathematical first-order control, not a different physical atmosphere.');files.set('case.json',JSON.stringify(metadata));return files;
}

/** Execute serial native cases with actual-input authentication and bounded photon counts.
 * @param {boolean} pilot Whether to run only a cheap supported-band operational pilot.
 * @returns {Promise<void>} Immutable successful/failed package; no prior evidence is changed.
 */
async function measure(pilot){
	const {parents,physical,material}=inputs(),repeats=pilot?1:4,channels=pilot?[3,5,8]:Array.from({length:15},(_,i)=>i);
	const configurations=pilot?[{id:'pilot',elevation:0.05,epsilon:0.05,layers:128}]:[0.05,3,20].flatMap(elevation=>[0.1,0.05].map(epsilon=>({id:`e${elevation}-s${epsilon}`,elevation,epsilon,layers:elevation===0.05?512:256})));
	const photons=pilot?10000:1000000;
	const run=createRun(pilot?'h46-n1-pilot':'h46-n1-measure',{parents,operation:'Independent fully spherical MYSTIC, VROOM off, Toronto direct angular material; reduce Rayleigh and aerosol scattering together at fixed extinction. Extrapolate paired epsilon0.1/0.05, preserving all-order parent, empirical uncertainty and finite-epsilon bracket separately.',parameters:{configurations,repeats,photons,channels,precisionTargets:{luminanceRelativeHalfWidth95:0.02,maximumBandRelativeHalfWidth95:0.05},orderMethod:'Q=2L(.05)/.05-L(.1)/.1; exact-mean Q<=L1<=(Q+.005Lfull)/1.005'}});
	const readings=/** @type {HorizonLibReading[]} */([]);let failure=null;
	try{
		run.write('registration.json',{physical,material,configurations,repeats,photons,sourceOrderIndependence:'No production evaluator is imported; only authenticated physical data is reused.'});
		for(const selected of configurations)for(let repeat=0;repeat<repeats;repeat++){
			const config={...selected,repeat,photons,channels,vroomOff:true},files=weakBundle(physical.medium,material,config),directory=checkedAbsolute(path.join(run.scratchPath,selected.id+'-'+repeat),false);mkdirSync(directory);
			for(const [name,contents] of files)writeFileSync(path.join(directory,name),contents,{flag:'wx'});
			run.progress('solver',`${selected.elevation}deg, scattering ${selected.epsilon}, seed ${repeat+1}/${repeats}`,readings.length,configurations.length*repeats);console.log(JSON.stringify({phase:'solver',configuration:config,completed:readings.length}));
			const started=Date.now(),launch=await invoke(directory,pilot?120:300);run.progress('authenticate','External solver returned.');run.write(`launch-${selected.id}-${repeat}.json`,launch);assert.equal(launch.code,0,launch.stderr);
			const absolute=launch.stdout.match(/libRadtran run: (.+)/)?.[1].trim();assert.ok(absolute);const toolRun=path.relative(repositoryRoot,checkedAbsolute(absolute)).split(path.sep).join('/');assert.ok(toolRun.startsWith('.codex-tmp/libradtran/runs/'));
			const manifestPath=toolRun+'/manifest.json',manifest=/** @type {HorizonLibManifest} */(JSON.parse(readRepository(manifestPath).toString()));assert.equal(manifest.status,'succeeded');
			for(const [name,contents] of files){const a=manifest.artifacts.find(a=>a.path==='case/'+name),b=manifest.artifacts.find(a=>a.path==='execution/'+name);assert.ok(a&&b);assert.equal(a.sha256,createHash('sha256').update(contents).digest('hex'));if(name!=='input.inp')assert.equal(a.sha256,b.sha256);}
			const deckArtifact=manifest.artifacts.find(a=>a.path==='execution/input.inp');assert.ok(deckArtifact);const deck=readRepository(toolRun+'/'+deckArtifact.path,deckArtifact.sha256).toString();for(const line of ['mc_spherical 1D','mc_vroom off','albedo 0','mol_tau_file abs absorption.txt','aerosol_species_file species.txt toronto'])assert.ok(deck.split(/\r?\n/).includes(line));assert.ok(!/mc_maxscatters|no_absorption/.test(deck));
			const raw=manifest.artifacts.find(a=>a.path==='execution/mc.rad.spc');assert.ok(raw);const bytes=readRepository(toolRun+'/'+raw.path,raw.sha256),log=readRepository(toolRun+'/stderr.txt');assert.ok(!/phase function .* negative|vroom not yet validated/i.test(log.toString()));
			const rows=bytes.toString().trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));assert.equal(rows.length,channels.length);const spectrum=rows.map((r,c)=>{assert.ok(Math.abs(r[0]-centers[channels[c]])<0.001&&Number.isFinite(r[4])&&r[4]>=0);return r[4]/1000;}),dividedSpectrum=spectrum.map(x=>x/config.epsilon);
			const reading={configuration:config,toolRun,spectrum,dividedSpectrum,color:pilot?null:colorimetry(dividedSpectrum,'bin-integrated'),elapsedMilliseconds:Date.now()-started};readings.push(reading);
			const derivation={parents:[identity(manifestPath),identity(toolRun+'/'+raw.path),identity(toolRun+'/case/case.json')],operation:'Authenticate original/executed input hashes and resolved native deck; raw mW radiance/1000 ->W, then divide by epsilon for the first-order limit.'};
			run.write(`raw-${selected.id}-${repeat}.txt`,bytes,derivation);run.write(`input-proof-${selected.id}-${repeat}.json`,{toolRun,actualInputHashesMatched:true,configuration:config,metadata:JSON.parse(String(files.get('case.json')))},derivation);run.write(`reading-${selected.id}-${repeat}.json`,reading,derivation);run.write(`log-${selected.id}-${repeat}.txt`,log);
			assert.ok(directory.startsWith(run.scratchPath+path.sep));checkedAbsolute(directory);assert.deepEqual(readdirSync(directory).sort(),[...files.keys()].sort());for(const name of files.keys())checkedAbsolute(path.join(directory,name));rmSync(directory,{recursive:true});
			console.log(JSON.stringify({completed:readings.length,total:configurations.length*repeats,elevation:config.elevation,epsilon:config.epsilon,Y:reading.color?.luminanceCdPerM2}));
		}
		run.write('readings.json',readings);
	}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,cases:readings.length});}
	verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Derive an external first-order estimate and empirical intervals from four paired seed sets.
 * @param {string} source Accepted full-spectrum weak-scattering measurement.
 * @returns {Promise<void>} New sealed numeric, swatch and spectral comparison evidence.
 */
async function report(source){
	assert.match(source,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h46-n1-measure$/);
	const {parents,physical}=inputs();parents.push(verifyRun(source),...browserSources(['src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js']));
	/** Read authenticated saved data. @param {string} p @returns {unknown} Parsed parent artifact. */
	function read(p){const bytes=readRepository(p);parents.push(identity(p,bytes));return JSON.parse(bytes.toString());}
	const readings=/** @type {HorizonLibReading[]} */(read(source+'/readings.json')),all=/** @type {HorizonLibSummary[]} */(read(full+'/summary.json'));
	const production=/** @type {HorizonProductionReading[]} */(read(prod+'/readings.json')),direct=/** @type {{independentN1:{elevation:number,spectrum:number[],color:HorizonColorReading}[]}} */(read(diagnostic+'/diagnostics.json'));
	assert.equal(readings.length,24);
	const rows=[0.05,3,20].map(elevation=>{
		const hi=readings.filter(r=>r.configuration.elevation===elevation&&r.configuration.epsilon===0.1).sort((a,b)=>a.configuration.repeat-b.configuration.repeat),lo=readings.filter(r=>r.configuration.elevation===elevation&&r.configuration.epsilon===0.05).sort((a,b)=>a.configuration.repeat-b.configuration.repeat);assert.equal(hi.length,4);assert.equal(lo.length,4);hi.forEach((r,i)=>{assert.equal(r.configuration.repeat,i);assert.equal(lo[i].configuration.repeat,i);});
		const estimates=lo.map((r,i)=>r.dividedSpectrum.map((x,c)=>2*x-hi[i].dividedSpectrum[c])),mean=centers.map((_,c)=>estimates.reduce((s,r)=>s+r[c],0)/4),colors=estimates.map(s=>colorimetry(s,'bin-integrated')),color=colorimetry(mean,'bin-integrated');assert.ok(mean.every(x=>x>0));
		const externalFull=all.find(r=>r.id===(elevation===0.05?'full-fine':`full-${elevation}`));assert.ok(externalFull);const upper=mean.map((x,c)=>(x+0.005*externalFull.meanSpectrum[c])/1.005),maximumBracketRelativeWidth=Math.max(...upper.map((x,c)=>Math.abs(x/mean[c]-1)));
		const directN1=direct.independentN1.find(r=>r.elevation===elevation),p=production.find(r=>r.elevation===elevation&&r.intervals===30);assert.ok(directN1&&p);
		const y95=halfWidth(colors.map(c=>c.luminanceCdPerM2)),band95=centers.map((_,c)=>halfWidth(estimates.map(s=>s[c])));
		return {elevation,externalN1:{spectrum:mean,color,perSeedSpectra:estimates,luminanceHalfWidth95:y95,redBlueHalfWidth95:halfWidth(colors.map(c=>c.redBlueRatio)),bandHalfWidths95:band95,finiteEpsilonUpperSpectrum:upper,maximumBracketRelativeWidth,precision:{luminanceTargetPassed:y95/color.luminanceCdPerM2<=0.02,allBandTargetsPassed:band95.every((x,c)=>x/mean[c]<=0.05)}},directN1,productionN1:p.cumulative[0],productionFull:p.cumulative[3],externalFull,externalN1RelativeToDirectY:color.luminanceCdPerM2/directN1.color.luminanceCdPerM2-1};
	});
	const run=createRun('h46-n1-report',{parents,operation:'Paired fixed-extinction epsilon0.1/0.05 external first-order extrapolation; conservative Student95 intervals, positive-order finite-epsilon bracket evaluated separately from sampling uncertainty. Compare saved direct and production N1 and retained full scattering; no transport rerun.',parameters:{source,epsilon:[0.1,0.05],repeats:4,lux:physical.lux,formula:'Q=2L(.05)/.05-L(.1)/.1; exact-mean Q<=L1<=(Q+.005Lfull)/1.005',limitations:['Extrapolated first-order estimate, not a native exactly order-limited run.','Finite-epsilon bracket is exact for true means; plugging in stochastic sample means is not a rigorous combined confidence bound.','Native angular/layer/source controls are inherited from matched H45, not a claim of real Toronto sky accuracy.']}});
	let browser,failure=null;
	try{
		run.write('analysis.json',{rows,precisionSatisfied:rows.every(r=>r.externalN1.precision.luminanceTargetPassed&&r.externalN1.precision.allBandTargetsPassed)});
		const display=new ColorResetSlope078P2ColorDisplayModel();
		/** @param {readonly number[]} values @returns {number[]} Same fixed production p2 RGB8. */
		function rgb(values){return display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry([...values],'midpoint',false).rgb]),{value:physical.lux,units:'lux'}).map(x=>Math.round(x*255));}
		const comparison=`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="640"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="22">Toronto aerosol: three first-order calculations</text><text x="20" y="56">Same geometry, source, extinction and fixed p2 display; external N1 is a weak-scattering limit estimate.</text>${['Production N1','Independent direct N1','libRadtran N1 estimate'].map((t,j)=>`<text x="${155+j*315}" y="92" font-size="17">${t}</text>`).join('')}${rows.map((r,i)=>`<text x="20" y="${153+i*150}">${r.elevation}° elevation</text>${[r.productionN1,r.directN1,r.externalN1].map((v,j)=>{const x=155+j*315,y=115+i*150,codes=rgb(v.spectrum);return `<rect x="${x}" y="${y}" width="295" height="90" fill="rgb(${codes.join(',')})"/><text x="${x}" y="${y+112}" font-size="13">Y ${v.color.luminanceCdPerM2.toFixed(0)}; R/B ${v.color.redBlueRatio.toFixed(3)}</text>`;}).join('')}`).join('')}<text x="20" y="590">All fifteen spectral channels. Native estimates retain four paired seeds, sampling intervals and finite-epsilon brackets.</text><text x="20" y="615">Solved spectral colors, not screenshots; the physical Toronto intervention remains partial above 440 nm.</text></g></svg>`;
		const horizon=rows[0],paired=`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="485"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="22">Toronto horizon: first order beside full scattering</text><text x="20" y="56">0.05° elevation, away from Sun; same fixed production p2 display.</text><text x="220" y="92" font-size="18">First scattering only</text><text x="665" y="92" font-size="18">Full scattering</text>${[[horizon.productionN1.spectrum,horizon.productionFull.spectrum],[horizon.externalN1.spectrum,horizon.externalFull.meanSpectrum]].map((row,i)=>`<text x="20" y="${152+i*145}" font-size="17">${i?'libRadtran':'Production algorithm'}</text>${row.map((values,j)=>{const x=220+j*445,y=115+i*145,c=colorimetry([...values],'bin-integrated'),codes=rgb(values);return `<text x="${x}" y="${y-7}" font-size="13">${i?(j?'All orders':'First-order limit estimate'):(j?'Cumulative N4':'N1 / Q30')}</text><rect x="${x}" y="${y}" width="420" height="88" fill="rgb(${codes.join(',')})"/><text x="${x}" y="${y+110}" font-size="13">Y ${c.luminanceCdPerM2.toFixed(0)}; R/B ${c.redBlueRatio.toFixed(3)}; RGB ${codes.join(', ')}</text>`;}).join('')}`).join('')}<text x="20" y="445">External N1 uses paired epsilon 0.1/0.05 at unchanged total extinction; no production changes.</text><text x="20" y="469">N1 sampling and finite-epsilon uncertainty are retained in analysis.json.</text></g></svg>`;
		const height=790,spectra=`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="25" y="30" font-size="22">Toronto first-order spectral radiance: independent checks</text>${rows.map((r,i)=>{const top=75+i*220,bottom=top+155,values=[r.productionN1.spectrum,r.directN1.spectrum,r.externalN1.spectrum],max=Math.max(...values.flat())*1.12;return `<text x="40" y="${top-12}">${r.elevation}°; external N1 Y ${(100*r.externalN1RelativeToDirectY).toFixed(2)}% relative to direct integral</text><path d="M70 ${top}V${bottom}H1060" stroke="#999" fill="none"/>${values.map((s,j)=>`<path d="${s.map((x,c)=>`${c?'L':'M'}${70+(centers[c]-centers[0])/(centers.at(-1)-centers[0])*990},${bottom-x/max*155}`).join(' ')}" stroke="${['#b22561','#555','#166ec1'][j]}" stroke-width="2" fill="none"/>`).join('')}<text x="70" y="${bottom+19}" font-size="12">${centers[0].toFixed(1)}–${centers.at(-1).toFixed(1)} nm; scale ${max.toFixed(4)} W m⁻² sr⁻¹ nm⁻¹</text>`;}).join('')}<text x="40" y="752" fill="#b22561">Production N1</text><text x="350" y="752" fill="#555">Independent direct N1</text><text x="720" y="752" fill="#166ec1">libRadtran N1 estimate</text><text x="40" y="778" font-size="12">Curves show means; empirical sampling intervals and finite-epsilon bounds are retained separately.</text></g></svg>`;
		browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'chrome-profile'),false),args:['--enable-gpu','--use-angle=d3d11']});const page=await browser.newPage();
		for(const [name,svg,h] of [['comparison',comparison,640],['horizon',paired,485],['spectra',spectra,height]]){run.progress('render',String(name));run.write(name+'.svg',svg);await page.setViewport({width:1120,height:Number(h),deviceScaleFactor:1});await page.setContent('<style>body{margin:0}</style>'+svg);run.write(name+'.png',Buffer.from(await page.screenshot({type:'png'})));}
		run.write('tool.json',{node:process.version,browser:await browser.version()});console.log(JSON.stringify(rows.map(r=>({elevation:r.elevation,externalN1Y:r.externalN1.color.luminanceCdPerM2,Y95:r.externalN1.luminanceHalfWidth95,relativeToDirect:r.externalN1RelativeToDirectY,finiteBracket:r.externalN1.maximumBracketRelativeWidth,precision:r.externalN1.precision}))));
	}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
	verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

if(process.argv[2]==='pilot'){assert.equal(process.argv.length,3);await measure(true);}
else if(process.argv[2]==='measure'){assert.equal(process.argv.length,3);await measure(false);}
else if(process.argv[2]==='report'){assert.equal(process.argv.length,4);await report(process.argv[3]);}
else throw new Error('Select internal pilot, measure or report mode.');
