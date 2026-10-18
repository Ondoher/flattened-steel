import assert from 'node:assert/strict';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun,verifyRun,readRepository,identity,checkedAbsolute,resolveRepository,sha256,storage} from '../io/files.mjs';
import {adapt} from '../outgoing-focus/control.mjs';
import {normalized} from '../outgoing-scene/mapping.mjs';
import {originalPhase} from '../distant-horizon/toronto-phase.js';
import {colorimetry} from '../horizon/diagnosis-color.mjs';
import {camera,proof} from './control.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const base='tmp/experiments/sky-accuracy-dials/runs/',oldGpu=base+'00429-h64-dusk-gpu',oldReport=base+'00440-h65-probe-report';
const compilerPath='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',entry='experiments/sky-accuracy-dials/twilight-reference/browser.mjs';
/** Read a compact JSON artifact. @param {string} p @returns {any} */
const json=p=>JSON.parse(readRepository(p).toString());
/** Read an authenticated-channel payload after its run has been verified. @param {string} p @returns {any} */
const channel=p=>JSON.parse(gunzipSync(readRepository(p)).toString());
/** Photopic luminance of a Native15 spectrum. @param {number[]} s @returns {number} */
const Y=s=>colorimetry(s,'bin-integrated').luminanceCdPerM2;

/** Build and authenticate the exact retained physics before any allocation.
 * @param {string} kind @returns {string}
 */
function containedSource(kind){
 let source=readRepository(compilerPath).toString().replaceAll('\r\n','\n');assert.equal(source.split(originalPhase).length,2);
 source=`import {torontoPhaseGlsl} from '${resolveRepository('experiments/sky-accuracy-dials/distant-horizon/toronto-phase.js').split(path.sep).join('/')}';\n`+source.replace(originalPhase,'${torontoPhaseGlsl(wavelengthNanometers)}');
 return kind==='sun'?adapt(normalized(source),.35):camera(normalized(source));
}

/** Compare a Sun-focused replay with its exact retained matching witnesses.
 * @param {any} payload @param {any[]} witnesses @returns {number}
 */
function replay(payload,witnesses){
 const saved=channel(oldGpu+`/k0.35/channel-${payload.channel}.json.gz`),oldWitnesses=json(oldGpu+'/k0.35/execution.json').witnesses;let maximum=0;
 for(let i=0;i<witnesses.length;i++){
  const index=oldWitnesses.findIndex(w=>w.scene===witnesses[i].scene&&w.elevation===witnesses[i].elevation&&w.intervals===witnesses[i].intervals);assert.ok(index>=0);
  for(const field of ['native','cumulative'])for(let o=0;o<4;o++){const a=payload[field][o][i],b=saved[field][o][index];maximum=Math.max(maximum,Math.abs(a-b)/Math.max(Math.abs(b),1e-12));}
 }
 assert.ok(maximum<=5e-6,`Sun replay mismatch ${maximum}`);return maximum;
}

/** Derive tables exclusively from final camera payloads and authenticated H65 parents.
 * @param {string} root @param {any[]} witnesses @returns {any[]}
 */
function analysis(root,witnesses){
 const data=Array.from({length:15},(_,c)=>channel(root+`/camera/channel-${c}.json.gz`));
 return json(oldReport+'/analysis.json').rows.filter(r=>r.scene.id==='sunset').map(r=>{
  const i=witnesses.findIndex(w=>w.elevation===r.elevation&&w.intervals===30);assert.ok(i>=0);assert.equal(witnesses[i+1].intervals,120);
  const cumulative=[0,1,2,3].map(o=>data.map(d=>d.cumulative[o][i])),pure=[0,1,2,3].map(o=>data.map(d=>d.native[o][i])),view120=data.map(d=>d.cumulative[3][i+1]);
  const camera={cumulative,pure,spectrum:cumulative[3],view120,Y:Y(cumulative[3]),pureY:pure.map(Y),cumulativeY:cumulative.map(Y),viewRelativeY:Y(view120)/Y(cumulative[3])-1};
  const ordinary=r.cache[0],sun=r.cache[1],independent={prefix:r.metrics.slice(0,4).map(m=>({id:m.id,spectrum:m.spectrum,Y:m.color.luminanceCdPerM2,halfWidth:m.luminanceHalfWidth95})),all:{spectrum:r.metrics[4].spectrum,Y:r.metrics[4].color.luminanceCdPerM2,halfWidth:r.metrics[4].luminanceHalfWidth95}};
  const reference={spectrum:r.reference.meanSpectrum,Y:r.reference.color.luminanceCdPerM2,halfWidth:r.reference.luminanceHalfWidth95};
  return {elevation:r.elevation,displayLux:r.scene.displayLux,ordinary:{Y:ordinary.color.luminanceCdPerM2,spectrum:ordinary.spectrum},sun:{Y:sun.color.luminanceCdPerM2,spectrum:sun.spectrum,pureY:sun.pure.map(Y),cumulativeY:sun.cumulative.map(Y),cumulative:sun.cumulative},camera,independent,reference,relativeY:camera.Y/sun.color.luminanceCdPerM2-1,cameraOverReference:camera.Y/reference.Y,sunOverReference:sun.color.luminanceCdPerM2/reference.Y};
 });
}

/** Render common-exposure swatches, spectral overlays and primary cumulative orders.
 * @param {DialRun} run @param {any[]} rows @param {any} browser @returns {Promise<void>}
 */
async function figures(run,rows,browser){
 const display=new ColorResetSlope078P2ColorDisplayModel(),scale=1/8;
 const rgb=(s,lux)=>display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */(colorimetry(s,'midpoint',false).rgb.map(v=>v*scale)),{value:lux,units:'lux'}).map(v=>Math.round(v*255)).join(',');
 const headers=['Ordinary Corrected60','Sun-focused N1-4','Camera-focused N1-4','Independent all','libRadtran all'];
 const comparison=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="590"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="22">Toronto sunset: rotate the dense outgoing region toward the camera</text><text x="20" y="57">Same4374 slots, k=.35, F68, transport60; 5deg Sun-relative azimuth; physical Y cd/m2.</text><text x="20" y="80">One shared -3stop preview before unchanged sunset P2; no per-method fitting. Camera center:0.05deg elevation.</text>${headers.map((h,i)=>`<text x="${100+i*257}" y="120" font-size="15">${h}</text>`).join('')}${rows.map((r,i)=>`<text x="15" y="${170+i*140}">${r.elevation}deg</text>${[r.ordinary,r.sun,r.camera,r.independent.all,r.reference].map((s,j)=>`<rect x="${100+257*j}" y="${140+i*140}" width="240" height="85" fill="rgb(${rgb(s.spectrum,r.displayLux)})"/><text x="${100+257*j}" y="${250+i*140}">Y ${s.Y.toFixed(2)}${s.halfWidth?' +/-'+s.halfWidth.toFixed(2):''}</text>`).join('')}`).join('')}<text x="20" y="580">Caches N1-N4 versus reference all orders; H65 independent tail0.16-1.21%. Selected rays, not a scene capture.</text></g></svg>`;
 const spectral=`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="820"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="25" y="30" font-size="22">Sun-focused versus camera-focused sunset spectra</text><text x="25" y="55">Sun red; camera purple; independent N1-4 green; independent all blue; libRadtran black. W m^-2 sr^-1 nm^-1.</text>${rows.map((r,i)=>{const top=95+i*235,bottom=top+165,sets=[r.sun.spectrum,r.camera.spectrum,r.independent.prefix[3].spectrum,r.independent.all.spectrum,r.reference.spectrum],max=Math.max(...sets.flat())*1.05,x=c=>70+c/14*960,y=v=>bottom-145*v/max;return `<text x="70" y="${top}">${r.elevation}deg; range0-${max.toPrecision(4)}</text><path d="M70 ${top+10}V${bottom}H1030" fill="none" stroke="#aaa"/>${sets.map((s,j)=>`<path d="${s.map((v,c)=>`${c?'L':'M'}${x(c)},${y(v)}`).join(' ')}" fill="none" stroke="${['#c33','#923ba6','#298c35','#278bcc','#111'][j]}" stroke-width="2"/>`).join('')}<text x="70" y="${bottom+23}">375.7nm</text><text x="970" y="${bottom+23}">814.3nm</text>`;}).join('')}</g></svg>`;
 const primary=rows[0],orders=`<svg xmlns="http://www.w3.org/2000/svg" width="950" height="390"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="25" y="32" font-size="22">Primary0.05deg ray: cumulative-order brightness</text><text x="25" y="62">Photopic Y cd/m2; reference all-order Y ${primary.reference.Y.toFixed(2)} +/-${primary.reference.halfWidth.toFixed(2)}</text>${['Order','Sun-focused','Camera-focused','Independent'].map((s,i)=>`<text x="${30+i*225}" y="105">${s}</text>`).join('')}${[0,1,2,3].map(o=>[o===0?'N1':'N1-'+(o+1),primary.sun.cumulativeY[o].toFixed(2),primary.camera.cumulativeY[o].toFixed(2),primary.independent.prefix[o].Y.toFixed(2)].map((s,j)=>`<text x="${30+j*225}" y="${150+o*55}">${s}</text>`).join('')).join('')}</g></svg>`;
 const page=await browser.newPage();try{for(const [name,svg,width,height]of [['comparison',comparison,1400,590],['spectra',spectral,1100,820],['orders',orders,950,390]]){run.write(name+'.svg',svg);if(name==='orders')continue;await page.setViewport({width:Number(width),height:Number(height)});await page.setContent('<style>body{margin:0}</style>'+svg);run.write(name+'.png',await page.screenshot({type:'png'}));}}finally{await page.close();}
}

/** Verify accepted output without mutating any parent or current run.
 * @param {string} root @returns {void}
 */
function verify(root){
 verifyRun(root);verifyRun(oldGpu);verifyRun(oldReport);const c=channel(root+'/control.json.gz'),saved=json(oldGpu+'/control.json');
 assert.deepEqual(c.request,saved.request);assert.deepEqual(c.integrationSpec,saved.integrationSpec);assert.deepEqual(c.material,saved.material);assert.deepEqual(c.scenes,[saved.scenes[0]]);
 const witnesses=json(root+'/camera/execution.json').witnesses,rows=analysis(root,witnesses);assert.deepEqual(rows,json(root+'/analysis.json').rows);
 for(const ch of [3,5,8])replay(channel(root+`/sun/channel-${ch}.json.gz`),witnesses);
 for(const orientation of ['sun','camera']){const e=json(root+`/${orientation}/execution.json`);assert.ok(!/swiftshader|llvmpipe/i.test(e.renderer));assert.equal(e.rayCount,6);}
 console.log(JSON.stringify({verified:root,rows:rows.map(r=>({elevation:r.elevation,sunY:r.sun.Y,cameraY:r.camera.Y,relativeY:r.relativeY,referenceY:r.reference.Y})),storage:storage()}));
}

/** One serial GPU campaign with a compact final report and immutable proof.
 * @returns {Promise<void>}
 */
async function run(){
 const parents=[verifyRun(oldGpu),verifyRun(oldReport),identity(compilerPath),identity(oldReport+'/analysis.json')],control=json(oldGpu+'/control.json');control.scenes=[control.scenes[0]];control.schema='h66-camera-facing-grid-v1';
 const geometry=proof(control);assert.equal(sha256(containedSource('sun')),sha256(gunzipSync(readRepository(oldGpu+'/k0.35/compiler.js.gz'))));containedSource('camera');
 const current=storage();assert.ok(current.retainedBytes+640000<726*1024**2,'H66 compact evidence estimate exceeds remaining allowance.');
 if(process.argv[2]==='preflight'){console.log(JSON.stringify({preflight:true,storage:current,compressedControlBytes:gzipSync(Buffer.from(JSON.stringify(control))).length}));return;}
 const r=createRun('h66-camera-grid',{parents,operation:'Rigidly rotate same k=.35 Sun-focused outgoing grid to fixed camera-local0.05deg/5deg axis; matched forward and inverse mappings in all J generation/recurrence/readout. Full Native15 recurrence, three-band Sun replay; H65 references reused read-only.',parameters:{controlHash:sha256(JSON.stringify(control)),controlArtifact:'control.json.gz',axis:geometry.axis,scale:1/8}});
 let failure=null,browser,orientation='',replayMaximum=0;const completed=[];let witnesses;
 try{
  r.write('control.json.gz',gzipSync(Buffer.from(JSON.stringify(control))));r.write('geometry.json',geometry);
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(r.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});const page=await browser.newPage();
  await page.exposeFunction('__h61Progress',m=>r.progress('gpu',orientation+': '+String(m)));
  await page.exposeFunction('__h61Channel',d=>{assert.equal(d.report.finalLiveFieldBytes,0);assert.equal(d.report.fieldLayout.widthJ,4374);for(const field of ['native','cumulative']){assert.equal(d[field].length,4);assert.ok(d[field].every(a=>a.length===6&&a.every(x=>Number.isFinite(x)&&x>=0)));}r.write(`${orientation}/channel-${d.channel}.json.gz`,gzipSync(Buffer.from(JSON.stringify(d))));completed.push({orientation,channel:d.channel,milliseconds:d.milliseconds});console.log(JSON.stringify(completed.at(-1)));});
  for(const kind of ['sun','camera']){
   orientation=kind;const source=containedSource(kind);
   const browserSource=readRepository(entry).toString()+`\nimport * as compiler from '${resolveRepository(compilerPath).split(path.sep).join('/')}';globalThis['__h61Execute']=c=>execute(c,compiler);`;
   const build=await rollup({input:resolveRepository(entry),plugins:[{name:'h66-contained',transform(code,id){if(path.resolve(id)===resolveRepository(compilerPath))return{code:source,map:null};if(path.resolve(id)===resolveRepository(entry))return{code:browserSource,map:null};return null;}}]});let code;try{code=(await build.generate({format:'iife'})).output[0].code;}finally{await build.close();}
   if(kind==='camera'){r.write(`${kind}/compiler.js.gz`,gzipSync(Buffer.from(source)));r.write(`${kind}/browser.js.gz`,gzipSync(Buffer.from(code)));}else{assert.equal(sha256(source),sha256(gunzipSync(readRepository(oldGpu+'/k0.35/compiler.js.gz'))));r.write('sun/source-identity.json',{sourceHash:sha256(source),browserHash:sha256(code),retainedCompiler:identity(oldGpu+'/k0.35/compiler.js.gz'),operation:'Exact unchanged H64 compiler replay; browser differs only in local wrapper import path.'});}await page.addScriptTag({content:code});
   const selected={...control,channels:kind==='sun'?[3,5,8]:control.channels};const execution=await page.evaluate(c=>globalThis['__h61Execute'](c),selected);r.write(`${kind}/execution.json`,execution);witnesses=execution.witnesses;
   if(kind==='sun')for(const c of selected.channels)replayMaximum=Math.max(replayMaximum,replay(channel(r.path+`/sun/channel-${c}.json.gz`),witnesses));
  }
  assert.equal(completed.length,18);const rows=analysis(r.path,witnesses);r.write('analysis.json',{rows,replayMaximum,limitations:['Full recurrence and final readout change together, not an isolated final-lookup-only substitution.','Camera axis fixed in receiver-local frame; primary view bends in this frame along the ray, actual offsets retained.','Reference all-order and prefix distinctions/uncertainty inherited from H65.','Same-slot rigid rotation tests one outgoing representation and does not rule out every interpolation defect.']});
  r.write('summary.tsv',['elevation\tsunY\tcameraY\tchangePercent\tindependentAllY\tlibradtranY',...rows.map(row=>[row.elevation,row.sun.Y,row.camera.Y,100*row.relativeY,row.independent.all.Y,row.reference.Y].join('\t'))].join('\n'));
  await figures(r,rows,browser);r.write('verification.json',{completeCameraChannels:15,sunReplayChannels:3,rayCount:6,replayMaximum,geometryProof:true,hardwareGpu:true,unchangedControl:true,parents});r.progress('verification','All18 builds and row reductions checked; images generated; closing GPU.');
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);r.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,completed:completed.length,replayMaximum});}
 verifyRun(r.path);console.log(JSON.stringify({run:r.path,failure:failure?String(failure):null}));if(failure)throw failure;verify(r.path);
}

if(process.argv[2]==='verify')verify(process.argv[3]);else await run();
