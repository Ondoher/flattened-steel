import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun,readRepository,verifyRun,identity,checkedAbsolute,resolveRepository,repositoryRoot,sha256} from '../io/files.mjs';
import {adapt} from '../outgoing-focus/control.mjs';
import {normalized} from '../outgoing-scene/mapping.mjs';
import {originalPhase} from '../distant-horizon/toronto-phase.js';
import {directBundle} from '../distant-horizon/toronto-direct.mjs';
import {invoke,halfWidth} from '../distant-horizon/libradtran.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';
import {plan} from './geometry.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const base='tmp/experiments/sky-accuracy-dials/runs/',entry='experiments/sky-accuracy-dials/twilight-reference/browser.mjs',compilerPath='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const parentNames=['00420-h63-tor-sunset','00422-h63-tor-tw30','00424-h63-tor-tw60'];
/** Freeze retained H63 material and physical defaults separately from compiler request.
 * @returns {any} Authenticated shared controls.
 */
function inputs(){
 const parents=parentNames.map(n=>verifyRun(base+n)),c=JSON.parse(readRepository(base+parentNames[0]+'/control.json').toString());
 const medium=JSON.parse(readRepository(base+'00288-h40-distant/registration.json').toString()).medium;
 parents.push(verifyRun(base+'00288-h40-distant'),identity(compilerPath),identity('scripts/libradtran/installation.json'));
 const request=c.baseline,integrationSpec=structuredClone(request.transportSpec);
 integrationSpec.domains.spectrum.channels.forEach((s,i)=>{assert.ok(Math.abs(medium.rayleigh[i]/(1.24062e-6*(s.centerNanometers/1000)**-4)-1)<1e-12);assert.ok(Math.abs(medium.mie[i]/((.04/1200)*(s.centerNanometers/1000)**-.8)-1)<1e-12);s.rayleighScatteringPerMeter=medium.rayleigh[i];s.mieExtinctionPerMeter=medium.mie[i];});
 const scenes=[{id:'sunset',zenith:89.9579152265},{id:'tw30',zenith:94.9954648168},{id:'tw60',zenith:99.7452502666}].map((s,i)=>{
  const result=JSON.parse(readRepository(base+parentNames[i]+'/result.json').toString());
  return {...s,displayLux:Math.PI*Number(result.production.canvas.flat32ColorBrightnessProxy)};
 });
 const control={schema:'h64-toronto-dusk-v1',request,integrationSpec,material:c.material,scenes,elevations:[.05,3,20],azimuth:5,channels:Array.from({length:15},(_,i)=>i),mode:'orders',medium};
 return {control,parents};
}

/** Rebuild both retained H63 cache algorithms and query every registered ray/order.
 * @param {any} [configuration] Matched controls and immutable parents.
 * @param {string} [name] New run label.
 * @returns {Promise<void>} Compact immutable GPU evidence.
 */
export async function gpu(configuration=inputs(),name='h64-dusk-gpu'){
 const {control,parents}=configuration,run=createRun(name,{parents,operation:'H63 Corrected60/Focused60 compiler equations; GPU pure and Float32 cumulative fields sampled at registered dusk rays, numerical final-view Q30/Q120.',parameters:{controlHash:sha256(JSON.stringify(control)),controlArtifact:'control.json'}});
 let failure=null,browser;const completed=[];
 try{
  run.write('control.json',control);const support=plan(control);run.write('geometry.json',support.rays.map(({samples,...r})=>r));
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});
  const page=await browser.newPage();let factor=1;
  await page.exposeFunction('__h61Progress',m=>run.progress('gpu','k'+factor+': '+String(m)));
  await page.exposeFunction('__h61Channel',d=>{assert.equal(d.report.finalLiveFieldBytes,0);assert.equal(d.report.fieldLayout.widthJ,4374);assert.ok(d.cumulative.flat().every(x=>Number.isFinite(x)&&x>=0));run.write(`k${factor}/channel-${d.channel}.json.gz`,gzipSync(Buffer.from(JSON.stringify(d))));completed.push({factor,channel:d.channel,milliseconds:d.milliseconds});console.log(JSON.stringify(completed.at(-1)));});
  for(const k of [1,.35]){
   factor=k;let source=readRepository(compilerPath).toString().replaceAll('\r\n','\n');assert.equal(source.split(originalPhase).length,2);
   source=`import {torontoPhaseGlsl} from '${resolveRepository('experiments/sky-accuracy-dials/distant-horizon/toronto-phase.js').split(path.sep).join('/')}';\n`+source.replace(originalPhase,'${torontoPhaseGlsl(wavelengthNanometers)}');source=adapt(normalized(source),k);
   const browserSource=readRepository(entry).toString()+`\nimport * as compiler from '${resolveRepository(compilerPath).split(path.sep).join('/')}';globalThis['__h61Execute']=c=>execute(c,compiler);`;
   const build=await rollup({input:resolveRepository(entry),plugins:[{name:'h64-contained',transform(code,id){if(path.resolve(id)===resolveRepository(compilerPath))return{code:source,map:null};if(path.resolve(id)===resolveRepository(entry))return{code:browserSource,map:null};return null;}}]});
   let code;try{code=(await build.generate({format:'iife'})).output[0].code;}finally{await build.close();}
   run.write(`k${k}/browser.js.gz`,gzipSync(Buffer.from(code)));run.write(`k${k}/compiler.js.gz`,gzipSync(Buffer.from(source)));await page.addScriptTag({content:code});const execution=await page.evaluate(c=>globalThis['__h61Execute'](c),control);run.write(`k${k}/execution.json`,execution);
  }
  run.write('completed.json',completed);
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,completed:completed.length});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Run repeated external fully spherical references, with no VROOM acceleration.
 * @param {string} mode Pilot, main or layer-refinement campaign.
 * @param {any} [configuration] Matched controls and immutable parents.
 * @param {string} [name] New run label.
 * @returns {Promise<void>} Authenticated solver records, not an assumed truth label.
 */
export async function reference(mode,configuration=inputs(),name='h64-dusk-'+mode){
 assert.ok(['pilot','main','fine'].includes(mode));const {control,parents}=configuration,pilot=mode==='pilot',layers=mode==='fine'?512:256,channels=pilot?[3,5,8]:control.channels,repeats=pilot?1:4,photons=pilot?10000:50000;
 const configurations=control.scenes.flatMap(s=>(pilot||mode==='fine'?[.05]:control.elevations).map(elevation=>({...s,id:s.id+'-'+elevation,elevation}))).filter(c=>!pilot||c.id!=='tw30-0.05');
 const run=createRun(name,{parents,operation:'Fully spherical MYSTIC VROOMoff direct Toronto optical library; native all-order radiance, independent repeated seeds and layer control.',parameters:{layers,channels,repeats,photons,azimuth:5,configurations,rawToW:0.001}});
 const readings=[],summaries=[],toolParents=[];let failure=null;
 try{
  run.write('registration.json',{control,configurations,layers,channels,repeats,photons});
  for(const selected of configurations){
   for(let repeat=0;repeat<repeats;repeat++){
    const config={...selected,repeat,layers,photons:!pilot&&selected.id.startsWith('tw60')?500000:photons,channels,epsilon:1,vroomOff:true},theta=selected.zenith*Math.PI/180,medium={...control.medium,sourceDirection:[Math.sin(theta),0,Math.cos(theta)]};
    const files=directBundle(medium,config,control.material,false),deck=String(files.get('input.inp'));assert.equal(deck.split('phi 180').length,2);files.set('input.inp',deck.replace('phi 180','phi 5').replace('mc_spherical 1D','mc_spherical 1D\nmc_backward'));
    const metadata=JSON.parse(String(files.get('case.json')));metadata.purpose='H64 Toronto dusk independent sky brightness';metadata.geometry=`Fully spherical, observer5m, sza=${selected.zenith}, elevation=${selected.elevation}, relative azimuth5deg`;metadata.limitations=['Native15 scalar spherical, no refraction/ozone, black ground.','Toronto phase/SSA above440nm; canonical amount/profile; not measured complete Toronto atmosphere.','All scattering orders; sample/layer uncertainty requires separate qualification.'];files.set('case.json',JSON.stringify(metadata));
    const directory=checkedAbsolute(path.join(run.scratchPath,selected.id+'-'+repeat),false);mkdirSync(directory);for(const [name,contents]of files)writeFileSync(path.join(directory,name),contents,{flag:'wx'});
    run.progress('external',selected.id+' seed '+repeat);console.log(JSON.stringify({mode,id:selected.id,repeat,phase:'start'}));const launched=await invoke(directory,600);assert.equal(launched.code,0,launched.stderr);
    const absolute=launched.stdout.match(/libRadtran run: (.+)/)?.[1].trim();assert.ok(absolute);const toolRoot=path.relative(repositoryRoot,checkedAbsolute(absolute)).split(path.sep).join('/');assert.ok(toolRoot.startsWith('.codex-tmp/libradtran/runs/'));
    const mp=toolRoot+'/manifest.json',manifest=JSON.parse(readRepository(mp).toString());assert.equal(manifest.status,'succeeded');
    for(const [name,contents]of files){const original=manifest.artifacts.find(x=>x.path==='case/'+name),executed=manifest.artifacts.find(x=>x.path==='execution/'+name);assert.ok(original&&executed);assert.equal(original.sha256,sha256(contents));if(name!=='input.inp')assert.equal(original.sha256,executed.sha256);}
    const actualDeck=readRepository(toolRoot+'/execution/input.inp').toString();assert.ok(actualDeck.includes('phi 5')&&actualDeck.includes('mc_vroom off')&&actualDeck.includes('mc_spherical 1D'));
    const raw=manifest.artifacts.find(x=>x.path==='execution/mc.rad.spc');assert.ok(raw);const bytes=readRepository(toolRoot+'/'+raw.path,raw.sha256),log=readRepository(toolRoot+'/stderr.txt');assert.ok(!/phase function .* negative|vroom not yet validated/i.test(log.toString()));
    const rows=bytes.toString().trim().split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>x.trim().split(/\s+/).map(Number));assert.equal(rows.length,channels.length);
    const spectrum=rows.map((r,i)=>{assert.ok(Math.abs(r[0]-control.request.transportSpec.domains.spectrum.channels[channels[i]].centerNanometers)<.001&&r[4]>=0&&Number.isFinite(r[4]));return r[4]/1000;});
    const reading={configuration:config,spectrum,color:pilot?null:colorimetry(spectrum,'bin-integrated'),toolRoot,libraryProof:metadata.actualBinaryOpticalProof,columnRelativeError:metadata.maximumColumnRelativeError,toolBytes:manifest.artifacts.reduce((s,x)=>s+(x.byteLength??x.bytes??0),0)};
    const identities=[identity(mp),identity(toolRoot+'/'+raw.path),identity(toolRoot+'/execution/input.inp'),identity(toolRoot+'/case/toronto.material.cdf')];toolParents.push(...identities);readings.push(reading);
    run.write(`reading-${selected.id}-${repeat}.json`,reading,{parents:identities,operation:'All staged/executed case hashes matched, optical binary qualified, native mW radiance divided by1000.'});run.write(`raw-${selected.id}-${repeat}.txt`,bytes,{parents:identities,operation:'Authenticated native MYSTIC radiance, original mW units.'});
    console.log(JSON.stringify({mode,id:selected.id,repeat,spectrum,Y:reading.color?.luminanceCdPerM2}));
   }
   if(!pilot){const set=readings.filter(r=>r.configuration.id===selected.id),meanSpectrum=channels.map((_,c)=>set.reduce((a,r)=>a+r.spectrum[c],0)/repeats),color=colorimetry(meanSpectrum,'bin-integrated');const summary={...selected,meanSpectrum,color,luminanceHalfWidth95:halfWidth(set.map(r=>r.color.luminanceCdPerM2)),spectralHalfWidth95:channels.map((_,c)=>halfWidth(set.map(r=>r.spectrum[c]))),zeroSampleBands:channels.filter((_,c)=>set.every(r=>r.spectrum[c]===0)),photonsPerBand:set[0].configuration.photons};summaries.push(summary);run.write(`summary-${selected.id}.json`,summary);}
  }
  run.write('summary.json',summaries);run.write('readings.json',readings,{parents:toolParents,operation:'All independently finalized external executions and qualified optical input identities.'});
 }catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,completed:readings.length,scope:'Execution accepted; numerical precision and geometry/reference matching assessed separately.'});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Publish fixed-context swatches and physical spectra; uncertainty never becomes an exposure fit.
 * @param {string} gpuRoot @param {string} mainRoot @param {string|undefined} fineRoot @returns {Promise<void>}
 */
async function report(gpuRoot,mainRoot,fineRoot){
 const sources=[gpuRoot,mainRoot,...(fineRoot?[fineRoot]:[])],parents=sources.map(s=>verifyRun(s));
 const control=JSON.parse(readRepository(gpuRoot+'/control.json').toString()),reference=JSON.parse(readRepository(mainRoot+'/summary.json').toString()),fine=fineRoot?JSON.parse(readRepository(fineRoot+'/summary.json').toString()):[];
 const witnesses=JSON.parse(readRepository(gpuRoot+'/k1/execution.json').toString()).witnesses;
 const values=[1,.35].map(k=>control.channels.map(c=>JSON.parse(gunzipSync(readRepository(gpuRoot+`/k${k}/channel-${c}.json.gz`)).toString())));
 const display=new ColorResetSlope078P2ColorDisplayModel();
 const rows=reference.map(ref=>{const index=witnesses.findIndex(w=>w.scene===ref.id.split('-')[0]&&w.elevation===ref.elevation&&w.intervals===30),fineIndex=index+1;assert.ok(index>=0);const sets=values.map(v=>{const cumulative=[0,1,2,3].map(o=>control.channels.map(c=>v[c].cumulative[o][index])),view=control.channels.map(c=>v[c].cumulative[3][fineIndex]);const pure=[0,1,2,3].map(o=>control.channels.map(c=>v[c].native[o][index]));return {cumulative,pure,spectrum:cumulative[3],color:colorimetry(cumulative[3],'bin-integrated'),view120Spectrum:view,viewRelativeY:colorimetry(view,'bin-integrated').luminanceCdPerM2/colorimetry(cumulative[3],'bin-integrated').luminanceCdPerM2-1};});
  const refined=fine.find(r=>r.id===ref.id),scene=control.scenes.find(s=>s.id===ref.id.split('-')[0]);return {id:ref.id,elevation:ref.elevation,scene,sets,reference:ref,refined,relativeY:sets.map(s=>s.color.luminanceCdPerM2/ref.color.luminanceCdPerM2-1)};
 });
 const run=createRun('h64-dusk-report',{parents,operation:'Absolute physical luminance and matched P2 display comparisons; cache cumulative N1-N4 versus MYSTIC all orders, Q30/Q120 and layer/seed controls.',parameters:{gpuRoot,mainRoot,fineRoot:fineRoot??null}});let failure=null;
 try{
  const quality=rows.map(r=>({id:r.id,luminanceRelativeHalfWidth95:r.reference.luminanceHalfWidth95/r.reference.color.luminanceCdPerM2,luminanceTargetMet:r.reference.luminanceHalfWidth95/r.reference.color.luminanceCdPerM2<=.05,zeroSampleBands:r.reference.zeroSampleBands,maximumSignificantVisibleRelativeHalfWidth95:Math.max(...r.reference.meanSpectrum.map((v,c)=>c>=3&&c<=10&&v>Math.max(...r.reference.meanSpectrum)*.01?r.reference.spectralHalfWidth95[c]/v:0)),viewRefinement:r.sets.map(s=>s.viewRelativeY),layerRelativeY:r.refined?r.refined.color.luminanceCdPerM2/r.reference.color.luminanceCdPerM2-1:null}));
  const orderBudget=rows.map(r=>({id:r.id,referenceY:r.reference.color.luminanceCdPerM2,referenceUpper95:r.reference.color.luminanceCdPerM2+r.reference.luminanceHalfWidth95,sets:r.sets.map(s=>{const n1=colorimetry(s.cumulative[0],'bin-integrated').luminanceCdPerM2,later=s.color.luminanceCdPerM2-n1;return {n1Y:n1,cumulativeY:s.cumulative.map(v=>colorimetry(v,'bin-integrated').luminanceCdPerM2),effectiveLaterY:later,pureOrderY:s.pure.map(v=>colorimetry(v,'bin-integrated').luminanceCdPerM2),laterY:s.pure.slice(1).reduce((a,v)=>a+colorimetry(v,'bin-integrated').luminanceCdPerM2,0),laterMinusReferenceUpper95:s.pure.slice(1).reduce((a,v)=>a+colorimetry(v,'bin-integrated').luminanceCdPerM2,0)-r.reference.color.luminanceCdPerM2-r.reference.luminanceHalfWidth95};})}));
  run.write('analysis.json',{rows,quality,orderBudget,limitations:['N1-N4 cache versus all-order external, tail not isolated.','Selected spectral probes, not app screenshots.','Monte Carlo intervals are empirical Student estimates, not formal correctness bounds; rare histories can make sample intervals optimistic.','Unresolved/zero samples do not establish a zero radiance or a zero uncertainty bound.','5deg side offset avoids solar disk.','Display context derived from H63 recorded adapting proxy times pi, default proxy floor0.','Positive-order diagnostic uses separately queried pure N2-N4 radiance. Its sum differs from C4-C1 because cubic interpolation is nonlinear and cumulative fields add in Float32. True N2+ cannot exceed true all-order radiance; diagnostic uses empirical reference upper interval, conditional on matched physics.']});
  const rgb=(s,lux)=>display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry(s,'midpoint',false).rgb]),{value:lux,units:'lux'}).map(x=>Math.round(255*x));
  for(const common of [false,true]){
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="${150+rows.length*140}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="28" font-size="21">Toronto dusk: corrected cache and fully spherical libRadtran</text><text x="20" y="53">5deg sideways from Sun; ${common?'common sunset exposure':'same H63 production exposure within each scene'}; absolute Y in cd/m2</text>${['Corrected60 N1-N4','Focused60 N1-N4','libRadtran all orders'].map((s,j)=>`<text x="${185+310*j}" y="85">${s}</text>`).join('')}${rows.map((r,i)=>`<text x="15" y="${120+140*i}">${r.scene.id} ${r.elevation}deg</text>${[...r.sets.map(s=>({spectrum:s.spectrum,color:s.color})),{spectrum:r.reference.meanSpectrum,color:r.reference.color}].map((s,j)=>`<rect x="${180+j*310}" y="${100+i*140}" width="295" height="85" fill="rgb(${rgb(s.spectrum,common?control.scenes[0].displayLux:r.scene.displayLux).join(',')})"/><text x="${180+j*310}" y="${209+i*140}">Y ${s.color.luminanceCdPerM2.toPrecision(4)}${j===2?' +/- '+r.reference.luminanceHalfWidth95.toPrecision(2):''}</text>`).join('')}`).join('')}<text x="20" y="${140+rows.length*140}">VROOM off; +60min colors provisional (high sampling uncertainty); no per-solver exposure fitting.</text></g></svg>`;
   run.write(common?'comparison-common.svg':'comparison.svg',svg);
  }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="${90+rows.length*230}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="30" y="25" font-size="21">Toronto dusk spectral radiance: W m^-2 sr^-1 nm^-1</text><text x="30" y="48">Corrected60 magenta; Focused60 green; MYSTIC all orders blue with 95% empirical band intervals.</text>${rows.map((r,i)=>{const top=75+i*230,bot=top+165,max=Math.max(...r.sets.flatMap(s=>s.spectrum),...r.reference.meanSpectrum.map((x,c)=>x+r.reference.spectralHalfWidth95[c]))*1.05,x=c=>65+c/14*1030,y=v=>bot-150*v/max;return `<text x="65" y="${top}">${r.id}; max ${max.toPrecision(4)}</text><path d="M65 ${top+8}V${bot}H1095" fill="none" stroke="#888"/>${[...r.sets.map(s=>s.spectrum),r.reference.meanSpectrum].map((v,j)=>`<path d="${v.map((z,c)=>`${c?'L':'M'}${x(c)},${y(z)}`).join(' ')}" fill="none" stroke="${['#b22561','#328632','#166ec1'][j]}" stroke-width="2"/>`).join('')}${r.reference.meanSpectrum.map((z,c)=>`<path d="M${x(c)} ${y(z+r.reference.spectralHalfWidth95[c])}V${y(Math.max(0,z-r.reference.spectralHalfWidth95[c]))}" stroke="#166ec1"/>`).join('')}<text x="65" y="${bot+20}">375.7nm</text><text x="1010" y="${bot+20}">814.3nm</text>`;}).join('')}</g></svg>`;run.write('spectra.svg',svg);
  run.write('summary.tsv',['scene\televation\tcorrectedY\tfocusedY\tlibradtranY\treference95\tcorrectedRelativeY\tfocusedRelativeY\tQ120relativeCorrected\tQ120relativeFocused\tlayerRelativeY',...rows.map(r=>[r.scene.id,r.elevation,...r.sets.map(s=>s.color.luminanceCdPerM2),r.reference.color.luminanceCdPerM2,r.reference.luminanceHalfWidth95,...r.relativeY,...r.sets.map(s=>s.viewRelativeY),r.refined?r.refined.color.luminanceCdPerM2/r.reference.color.luminanceCdPerM2-1:''].join('\t'))].join('\n'));
  const browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'images'),false)});try{const page=await browser.newPage();for(const file of ['comparison','comparison-common','spectra']){await page.setViewport({width:1140,height:file==='spectra'?90+rows.length*230:150+rows.length*140});await page.setContent('<style>body{margin:0}</style>'+readRepository(run.path+'/'+file+'.svg').toString());run.write(file+'.png',await page.screenshot({type:'png'}));}}finally{await browser.close();}
 }catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,rows:rows.map(r=>({id:r.id,relativeY:r.relativeY,Y:r.reference.color.luminanceCdPerM2,halfWidth:r.reference.luminanceHalfWidth95}))}));if(failure)throw failure;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const mode=process.argv[2];if(mode==='gpu')await gpu();else if(['pilot','main','fine'].includes(mode))await reference(mode);else if(mode==='report')await report(process.argv[3],process.argv[4],process.argv[5]);else throw new Error('Select gpu, pilot, main, fine or report.');}
