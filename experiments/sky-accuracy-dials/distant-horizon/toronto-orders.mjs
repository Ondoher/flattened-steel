import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer';
import {createRun, verifyRun, identity, readRepository, checkedAbsolute} from '../io/files.mjs';
import {fragment, executeGpu} from '../horizon-reference/gpu.mjs';
import {boundary} from '../horizon-reference/math.mjs';
import {validateAerosolTable} from '../horizon/aerosol-optics.mjs';
import {colorimetry, ciePath} from '../horizon/diagnosis-color.mjs';
import {halfWidth} from './libradtran.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const root='tmp/experiments/sky-accuracy-dials/runs/';
const physicalRun=root+'00288-h40-distant', productionRun=root+'00310-h45-toronto-prod', externalRun=root+'00320-h46-n1-report';
const elevations=[0.05,3,20], centers=NATIVE_15_SPECTRAL_BASIS.channels.map(c=>c.center.value);

/** Authenticate physical inputs and saved comparisons, without importing a production evaluator.
 * @returns {{parents:DialFileIdentity[],physical:HorizonLibParent,material:HorizonAerosolMaterial,external:HorizonTorontoExternalRow[]}}
 */
function inputs(){
 const parents=[physicalRun,productionRun,externalRun].map(verifyRun);
 const read=p=>{const b=readRepository(p);parents.push(identity(p,b));return JSON.parse(b.toString());};
 return {parents,physical:read(physicalRun+'/registration.json'),material:read(productionRun+'/control.json').material,external:read(externalRun+'/analysis.json').rows};
}

/** Analytic cumulative mass for the original piecewise-linear cosine PDF.
 * @param {HorizonAerosolPhaseTable} table @returns {number[]} Unit-normalized CDF, without angular fitting.
 */
function cumulative(table){
 validateAerosolTable(table);const cdf=[0];
 for(let i=1;i<table.mu.length;i++)cdf.push(cdf[i-1]+(table.mu[i]-table.mu[i-1])*(table.pdf[i]+table.pdf[i-1])/2);
 assert.ok(Math.abs(cdf.at(-1)-1)<1e-12);return cdf;
}

/** Independent cache-free shader with measured SSA and exact table-density evaluation/sampling.
 * Retains the existing transport estimator, replacing only its canonical aerosol optics.
 * @param {HorizonAerosolPhaseTable|null} table @param {number} albedo
 * @returns {{shader:string,proof:{mass:number,maximumInverseResidual:number}}} Kernel and deterministic CDF inversion checks.
 */
export function kernel(table,albedo){
 assert.ok(albedo>0&&albedo<=1);let shader=fragment().replace('W=0.8',`W=${albedo.toExponential(16)}`);
 if(!table)return {shader,proof:{mass:1,maximumInverseResidual:0}};
 const cdf=cumulative(table);let maximumInverseResidual=0;
 // Verify the stable quadratic inverse at 10,001 quantiles, including each segment boundary.
 for(const u of [...Array.from({length:10001},(_,i)=>i/10000),...cdf]){
  let k=0;while(k<81&&u>=cdf[k+1])k++;
  const p=table.pdf[k],s=(table.pdf[k+1]-p)/(table.mu[k+1]-table.mu[k]),area=Math.max(0,u-cdf[k]);
  const d=area===0?0:2*area/(p+Math.sqrt(Math.max(0,p*p+2*s*area)));
  maximumInverseResidual=Math.max(maximumInverseResidual,Math.abs(cdf[k]+p*d+s*d*d/2-u));
  assert.ok(d>=-1e-12&&d<=table.mu[k+1]-table.mu[k]+1e-10);
 }
 assert.ok(maximumInverseResidual<1e-12);
 const array=(name,values)=>`const float ${name}[83]=float[](${values.map(x=>x.toExponential(16)).join(',')});`;
 const optics=`${array('TMU',table.mu)}\n${array('TPDF',table.pdf)}\n${array('TCDF',cdf)}
 float miePdf(float c){int lo=0,hi=82;for(int j=0;j<7;j++){int mid=(lo+hi)/2;if(c>=TMU[mid])lo=mid;else hi=mid;}lo=min(lo,81);return mix(TPDF[lo],TPDF[lo+1],clamp((c-TMU[lo])/(TMU[lo+1]-TMU[lo]),0.0,1.0));}
 float mieCosine(float u){int lo=0,hi=82;for(int j=0;j<7;j++){int mid=(lo+hi)/2;if(u>=TCDF[mid])lo=mid;else hi=mid;}lo=min(lo,81);float p=TPDF[lo],s=(TPDF[lo+1]-p)/(TMU[lo+1]-TMU[lo]),a=max(0.0,u-TCDF[lo]);float d=2.0*a/(p+sqrt(max(0.0,p*p+2.0*s*a)));return clamp(TMU[lo]+d,TMU[lo],TMU[lo+1]);}
 `;
 shader=shader.replace('uint state;',optics+'\nuint state;');
 const phaseStart=shader.indexOf('vec2 phases('),phaseEnd=shader.indexOf('\nvec3 rotate(',phaseStart);assert.ok(phaseStart>0&&phaseEnd>phaseStart);
 shader=shader.slice(0,phaseStart)+'vec2 phases(float c){return vec2(3.0*(1.0+c*c)/(16.0*PI),miePdf(c)/(2.0*PI));}'+shader.slice(phaseEnd);
 const start=shader.indexOf('vec3 scatter('),end=shader.indexOf('\n// Exact mixture',start);assert.ok(start>0&&end>start);
 shader=shader.slice(0,start)+`vec3 scatter(vec3 v,bool mie){if(mie)return rotate(mieCosine(random()),2.0*PI*random(),v);for(int j=0;j<256;j++){float c=2.0*random()-1.0;if(2.0*random()<=1.0+c*c)return rotate(c,2.0*PI*random(),v);}return vec3(0);}`+shader.slice(end);
 return {shader,proof:{mass:cdf.at(-1),maximumInverseResidual}};
}

/** Run serial wavelength jobs on hardware, retaining separate orders and the all-order roulette estimate.
 * @param {boolean} pilot Operational pilot or full three-angle measurement.
 * @returns {Promise<void>} Sealed immutable evidence, with all owned GPU/browser resources released.
 */
async function measure(pilot){
 const {parents,physical,material}=inputs();
 assert.equal(physical.medium.radius,6360000);assert.equal(physical.medium.topAltitude,60000);assert.equal(physical.medium.geometry,'spherical');assert.equal(physical.medium.sourceKind,'parallel');assert.equal(physical.medium.rayleighHeight,8000);assert.equal(physical.medium.mieHeight,1200);
 const channels=pilot?[3,5,8]:centers.map((_,i)=>i),paths=pilot?2048:8192;
 const profiles=pilot?[{name:'pilot',batches:4,quadrature:128,roulette:8,seed:71303168}]:[{name:'main',batches:24,quadrature:128,roulette:8,seed:268435456},{name:'control64',batches:8,quadrature:64,roulette:8,seed:268435456}];
 const run=createRun(pilot?'h47-gpu-pilot':'h47-gpu-orders',{parents,operation:'Cache-free backward Monte Carlo in continuous spherical exponential medium. Match Toronto wavelength SSA and normalized piecewise-linear phase; analytic inverse-CDF sampling, no production evaluator or cache. Retain pure N1,N2,N3,N4, cumulative N1-4 and all-order roulette estimates.',parameters:{channels,paths,profiles,precisionTargets:{luminanceRelative95:0.03,maximumBandRelative95:0.10},roulette:'Compensated survival0.8 begins at order8, after separately tallied orders1-4',physicalInputsOnly:true}});
 /** @type {(HorizonReferenceBatch&{channel:number})[]} */const batches=[];
 let browser,failure=null;
 try{
  run.write('registration.json',{physical,material,channels,paths,profiles,elevations,coordinateConvention:'Observer-to-scene directions, away-Sun azimuth, black spherical ground; no atmospheric cache.',metrics:['all','N1','N2','N3','N4'],precisionTargets:{Y95:0.03,band95:0.10}});
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu-profile'),false),protocolTimeout:1200000,args:['--enable-gpu','--ignore-gpu-blocklist','--disable-software-rasterizer','--use-angle=d3d11','--disable-background-timer-throttling']});
  const page=await browser.newPage();let currentChannel=-1;
  await page.exposeFunction('retainBatch',/** @param {HorizonReferenceBatch} b */b=>{batches.push({...b,channel:currentChannel});run.progress('gpu',`channel ${currentChannel+1}/15, ${b.profile} batch ${b.batch+1}, angle ${elevations[b.group]}`);});
  const telemetry=[];
  for(const channel of channels){
   currentChannel=channel;const generated=kernel(material.phaseTables[channel],material.albedos[channel]);run.write(`shader-${channel}.glsl`,generated.shader);run.write(`sampling-proof-${channel}.json`,generated.proof);
   const groups=elevations.map(elevation=>{const a=elevation*Math.PI/180,direction=[0,Math.cos(a),Math.sin(a)];return {id:`toronto-${elevation}`,medium:physical.medium,origin:physical.origin,direction,channel,end:boundary(physical.medium,physical.origin,direction).distance};});
   const result=await page.evaluate(executeGpu,generated.shader,{groups,paths,profiles,maximumMilliseconds:900000});telemetry.push({channel,...result});
   run.write(`batches-${channel}.json`,batches.filter(b=>b.channel===channel));console.log(JSON.stringify({channel,renderer:result.renderer,milliseconds:result.milliseconds,completed:result.completed}));
  }
  run.write('batches.json',batches);run.write('telemetry.json',telemetry);
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,batches:batches.length});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Reduce independent per-channel batch means, retaining sampling intervals and paired integration controls.
 * @param {readonly (HorizonReferenceBatch&{channel:number})[]} batches
 * @returns {HorizonTorontoProbeRow[]} Spectra with common batch identities for color intervals.
 */
function reduce(batches){
 return elevations.map((elevation,group)=>{
  const profiles=['main','control64'].map(profile=>{
   const count=profile==='main'?24:8;
   const perBatch=Array.from({length:count},(_,batch)=>centers.map((_,channel)=>{const r=batches.find(b=>b.profile===profile&&b.group===group&&b.channel===channel&&b.batch===batch);assert.ok(r);return r.means;}));
   const metrics=[{id:'N1',indices:[1]},{id:'N4',indices:[1,2,3,4]},{id:'all',indices:[0]}].map(({id,indices})=>{
    const samples=perBatch.map(row=>row.map(m=>indices.reduce((s,k)=>s+m[k],0))),spectrum=centers.map((_,c)=>samples.reduce((s,row)=>s+row[c],0)/count),color=colorimetry(spectrum,'bin-integrated');
    return {id,spectrum,color,bandHalfWidths95:centers.map((_,c)=>halfWidth(samples.map(row=>row[c]))),luminanceHalfWidth95:halfWidth(samples.map(row=>colorimetry(row,'bin-integrated').luminanceCdPerM2)),samples};
   });
   return {profile,metrics};
  });
  const main=profiles[0].metrics,control=profiles[1].metrics;
  const integrationControl=main.map((m,i)=>{const paired=control[i].samples.map((s,b)=>colorimetry(s,'bin-integrated').luminanceCdPerM2-colorimetry(m.samples[b],'bin-integrated').luminanceCdPerM2);return {id:m.id,Y64Minus128:paired.reduce((s,x)=>s+x,0)/paired.length,pairedHalfWidth95:halfWidth(paired)};});
  for(let c=0;c<15;c++){assert.ok(main[1].spectrum[c]>=main[0].spectrum[c]);assert.ok(main[2].spectrum[c]>=main[1].spectrum[c]-1e-12);}
  return {elevation,metrics:main,control:control,integrationControl};
 });
}

/** Produce the requested three-method, three-angle order comparison without rerunning saved solvers.
 * @param {string} source Accepted matched GPU measurement.
 * @returns {Promise<void>} Sealed scientific spectra and fixed-display color images.
 */
async function report(source){
 assert.match(source,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h47-gpu-orders$/);
 const {parents,physical,external}=inputs();parents.push(verifyRun(source),identity(source+'/batches.json'),identity(ciePath),identity('src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js'));
 const rows=reduce(JSON.parse(readRepository(source+'/batches.json').toString()));
 const run=createRun('h47-order-report',{parents,operation:'Three-method first and cumulative fourth/all-order comparison from authenticated saved Toronto spectra; independent GPU measurement is new, production and external solvers are not rerun.',parameters:{source,lux:physical.lux,display:'Production midpoint CIE/p2; fixed illumination, no exposure fit, no equal-Y scaling or white balance',limits:'Production cumulative N4, libRadtran all orders and extrapolated N1; independent separate cumulative N4 and all-order roulette estimate. Native15 point samples, partial Toronto optics only above440nm.'}});
 let browser,failure=null;
 try{
  const display=new ColorResetSlope078P2ColorDisplayModel();
  const rgb=s=>display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry(s,'midpoint',false).rgb]),{value:physical.lux,units:'lux'}).map(x=>Math.round(x*255));
  const width=1440,height=1530;
  const swatch=(s,x,y,w,label,uncertainty='')=>{const c=colorimetry(s,'bin-integrated');return `<text x="${x}" y="${y-7}" font-size="14">${label}</text><rect x="${x}" y="${y}" width="${w}" height="84" fill="rgb(${rgb(s).join(',')})"/><text x="${x}" y="${y+104}" font-size="13">Y ${c.luminanceCdPerM2.toFixed(0)}${uncertainty}; R/B ${c.redBlueRatio.toFixed(3)}</text>`;};
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="25" y="32" font-size="25">Toronto aerosol: production, libRadtran and independent transport</text><text x="25" y="59" font-size="15">Away-Sun rays; fixed production p2 display, source, extinction and physical boundaries. No brightness normalization.</text><text x="230" y="93" font-size="20">First scattering (N1)</text><text x="740" y="93" font-size="20">Cumulative fourth / full scattering</text>${rows.map((row,i)=>{const ext=external.find(r=>r.elevation===row.elevation);assert.ok(ext);const y=145+i*440;return `<text x="25" y="${y-25}" font-size="20">${row.elevation} degrees elevation</text>${['Production algorithm','libRadtran','Independent GPU'].map((label,j)=>`<text x="25" y="${y+44+j*130}" font-size="17">${label}</text>`).join('')}${swatch(ext.productionN1.spectrum,230,y,460,'Production N1')}${swatch(ext.productionFull.spectrum,740,y,660,'Production cumulative N1-4')}${swatch(ext.externalN1.spectrum,230,y+130,460,'First-order extrapolation',` +/- ${ext.externalN1.luminanceHalfWidth95.toFixed(0)}`)}${swatch(ext.externalFull.meanSpectrum,740,y+130,660,'All orders',` +/- ${ext.externalFull.luminanceHalfWidth95.toFixed(0)}`)}${swatch(row.metrics[0].spectrum,230,y+260,460,'Independent Monte Carlo N1',` +/- ${row.metrics[0].luminanceHalfWidth95.toFixed(0)}`)}${swatch(row.metrics[1].spectrum,740,y+260,315,'Independent cumulative N1-4',` +/- ${row.metrics[1].luminanceHalfWidth95.toFixed(0)}`)}${swatch(row.metrics[2].spectrum,1085,y+260,315,'Independent all orders',` +/- ${row.metrics[2].luminanceHalfWidth95.toFixed(0)}`)}`;}).join('')}<text x="25" y="1480" font-size="14">Y in cd/m2; +/- values are empirical 95% sampling half-widths. Scientific swatches, not scene screenshots.</text><text x="25" y="1506" font-size="14">Toronto phase/SSA above 440 nm; same original aerosol amount and San Jose noon geometry. See analysis.json for uncertainty.</text></g></svg>`;
  const plotHeight=1090;
  const spectra=`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="${plotHeight}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="25" y="32" font-size="25">Toronto spectral radiance: first order and cumulative fourth / full</text><text x="25" y="61" font-size="14">Common vertical scale across both columns for each angle. Native15 samples joined by straight lines; shaded ranges: sampling 95%.</text><text x="85" y="93" font-size="20">First scattering</text><text x="785" y="93" font-size="20">Cumulative fourth / full scattering</text>${rows.map((row,i)=>{const ext=external.find(r=>r.elevation===row.elevation);assert.ok(ext);const values=[[{s:ext.productionN1.spectrum,c:'#b22561'},{s:ext.externalN1.spectrum,c:'#166ec1',h:ext.externalN1.bandHalfWidths95},{s:row.metrics[0].spectrum,c:'#20834d',h:row.metrics[0].bandHalfWidths95}],[{s:ext.productionFull.spectrum,c:'#b22561'},{s:ext.externalFull.meanSpectrum,c:'#166ec1'},{s:row.metrics[2].spectrum,c:'#20834d',h:row.metrics[2].bandHalfWidths95},{s:row.metrics[1].spectrum,c:'#20834d',dash:true}]];const maximum=Math.max(...values.flat().flatMap(v=>v.s.map((x,c)=>x+('h'in v?v.h[c]:0))))*1.08,top=135+i*285,bottom=top+195;return `<text x="25" y="${top-15}" font-size="18">${row.elevation} degrees</text>${values.map((curves,j)=>{const x=80+j*700,w=600,px=c=>x+(centers[c]-centers[0])/(centers.at(-1)-centers[0])*w,py=v=>bottom-v/maximum*195;return `<path d="M${x} ${top}V${bottom}H${x+w}" stroke="#777" fill="none"/>${[0,.5,1].map(f=>`<path d="M${x} ${py(f*maximum)}H${x+w}" stroke="#ddd"/><text x="${x-7}" y="${py(f*maximum)+4}" text-anchor="end" font-size="12">${(f*maximum).toFixed(3)}</text>`).join('')}${curves.map(v=>`${'h'in v?`<path d="M${v.s.map((s,c)=>`${px(c)},${py(s+v.h[c])}`).join(' L')} L${v.s.map((s,c)=>`${px(c)},${py(Math.max(0,s-v.h[c]))}`).reverse().join(' L')}Z" fill="${v.c}" opacity=".10"/>`:''}<path d="${v.s.map((s,c)=>`${c?'L':'M'}${px(c)},${py(s)}`).join(' ')}" stroke="${v.c}" stroke-width="2.5" ${'dash'in v?'stroke-dasharray="8 5"':''} fill="none"/>`).join('')}<text x="${x}" y="${bottom+22}" font-size="13">${centers[0].toFixed(1)} to ${centers.at(-1).toFixed(1)} nm</text><text x="${x}" y="${bottom+44}" font-size="12">W m^-2 sr^-1 nm^-1</text>`;}).join('')}`;}).join('')}<text x="30" y="1025" fill="#b22561" font-size="16">Production N1 / cumulative N4</text><text x="495" y="1025" fill="#166ec1" font-size="16">libRadtran N1 estimate / all orders</text><text x="1010" y="1025" fill="#20834d" font-size="16">Independent N1 / all orders</text><text x="30" y="1057" font-size="14">Dashed green: independent cumulative N1-4. Bands show sampling only, not model/discretization or N1 finite-epsilon uncertainty.</text></g></svg>`;
  run.write('analysis.json',{rows,external,precisionSatisfied:rows.every(r=>r.metrics.every(m=>m.luminanceHalfWidth95/m.color.luminanceCdPerM2<=.03&&m.bandHalfWidths95.every((h,c)=>h/m.spectrum[c]<=.10))),limitations:['Sampling-only intervals; retain precision flags and paired quadrature responses.','Independent all-order roulette and finite N4 are separate physical estimates.','Production cubic reconstruction cumulative increments are not exact isolated physical orders.','External N1 is a finite-epsilon extrapolation; its prior precision limitations remain.']});
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'images'),false),args:['--enable-gpu','--use-angle=d3d11']});const page=await browser.newPage();
  for(const [name,figure,h] of [['comparison',svg,height],['spectra',spectra,plotHeight]]){run.progress('render',String(name));run.write(name+'.svg',figure);await page.setViewport({width,height:Number(h),deviceScaleFactor:1});await page.setContent('<style>body{margin:0}</style>'+figure);run.write(name+'.png',Buffer.from(await page.screenshot({type:'png'})));}
  console.log(JSON.stringify(rows.map(r=>({elevation:r.elevation,metrics:r.metrics.map(m=>({id:m.id,Y:m.color.luminanceCdPerM2,Y95:m.luminanceHalfWidth95,maxBand95:Math.max(...m.bandHalfWidths95.map((v,c)=>v/m.spectrum[c]))})),integrationControl:r.integrationControl}))));
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const mode=process.argv[2];if(mode==='pilot'||mode==='measure'){assert.equal(process.argv.length,3);await measure(mode==='pilot');}else{assert.equal(mode,'report');assert.equal(process.argv.length,4);await report(process.argv[3]);}
}
