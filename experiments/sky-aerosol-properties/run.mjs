import assert from 'node:assert/strict';
import {readdirSync,mkdirSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {setImmediate as yieldNow} from 'node:timers/promises';
import puppeteer from 'puppeteer';
import {boundary,direct} from './reference.mjs';
import {fragment,execute} from './gpu.mjs';
import {color,rgbWeights,ciePath} from './color.mjs';
import {checked,read,identity,createRun,output} from './io.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
const {PNG}=createRequire(import.meta.url)('pngjs');
const parent='tmp/experiments/sky-accuracy-dials/runs/00288-h40-distant';
const parentSeal=JSON.parse(read(parent+'/sealed.json').toString());assert.equal(parentSeal.state,'accepted');
const registration=JSON.parse(read(parent+'/registration.json').toString());
const registrationIdentity=identity(parent+'/registration.json');
const originalIdentity=parentSeal.artifacts.find(a=>a.path===registrationIdentity.path);
assert.ok(originalIdentity);assert.equal(originalIdentity.sha256,registrationIdentity.sha256);
/** Initial source and physical geometry are authenticated earlier observations, not an assumed clear-day truth. @type {AerosolMedium} */
const initial={...registration.medium,observerHeight:5};
assert.equal(initial.albedo,.8);assert.equal(initial.g,.7);assert.equal(initial.mieHeight,1200);
/** Frozen interventions; duplicated baseline settings are represented once. @type {AerosolSetting[]} */
const settings=[{id:'original',amount:1,ssa:.8,g:.7},{id:'zero',amount:0,ssa:.8,g:.7},
 {id:'ssa090',amount:1,ssa:.9,g:.7},{id:'ssa095',amount:1,ssa:.95,g:.7},{id:'ssa100',amount:1,ssa:1,g:.7},
 {id:'fixed-scattering',amount:.8,ssa:1,g:.7},
 {id:'amount010',amount:.1,ssa:.95,g:.7},{id:'amount025',amount:.25,ssa:.95,g:.7},{id:'amount050',amount:.5,ssa:.95,g:.7},
 {id:'phase055',amount:.5,ssa:.95,g:.55},{id:'phase085',amount:.5,ssa:.95,g:.85}];
const parents=[identity(parent+'/sealed.json'),registrationIdentity,identity(ciePath),identity('package-lock.json')];
for(const name of readdirSync(checked('experiments/sky-aerosol-properties')).filter(n=>/\.(mjs|json|ts)$/.test(n)))parents.push(identity('experiments/sky-aerosol-properties/'+name));
for(const name of ['experiments/sky-accuracy-dials/horizon-reference/math.mjs','experiments/sky-accuracy-dials/distant-horizon/gpu.mjs','experiments/sky-accuracy-dials/continuation/direct-solver/math.mjs','src/algorithm32/implementation/canonical-atmosphere/consts.js'])parents.push(identity(name));
const run=createRun('property-screen',parents),start=Date.now(),display=new ColorResetSlope078P2ColorDisplayModel();
const profileRelative=output+'/scratch/'+run.relative.split('/').at(-1);
let browser,failure=null,numericalFloor=1e-12;
/** Complete measured packets. @type {AerosolMeasurement[]} */
const measurements=[];
const sourceRB=color(initial.sourceIrradiance).rgb[0]/color(initial.sourceIrradiance).rgb[2];
/** Unit ray in Sun-relative azimuth/elevation coordinates. @param {number} elevation @param {number} azimuth */
function direction(elevation,azimuth){const e=elevation*Math.PI/180,a=azimuth*Math.PI/180;return [Math.sin(a)*Math.cos(e),-Math.cos(a)*Math.cos(e),Math.sin(e)];}
/** Measure one configuration with nested quadrature refinement. @param {AerosolSetting} setting @param {string} condition @param {AerosolMedium} base @returns {Promise<AerosolMeasurement>} */
async function measure(setting,condition,base){
 const medium={...base,mie:base.mie.map(x=>x*setting.amount),albedo:setting.ssa,g:setting.g};
 const solarElevation=Math.asin(medium.sourceDirection[2])*180/Math.PI;
 const queries=[];
 for(const azimuth of [0,90,180])for(const elevation of [.05,1,3,10,20])queries.push({id:`h${azimuth}-e${elevation}`,direction:direction(elevation,azimuth)});
 for(const offset of [.5,1,2,5,10])queries.push({id:'sun-'+offset,direction:direction(solarElevation+offset,0)});
 const origin=[0,0,medium.radius+medium.observerHeight],rays=[];
 for(const query of queries){
  run.progress('spectra',`${condition}: ${setting.id}, ${query.id}`,{completed:rays.length,total:queries.length});
  const end=boundary(medium,origin,query.direction).distance;
  const groups=Array.from({length:15},(_,channel)=>({id:query.id,medium,origin,direction:query.direction,channel,end}));
  let coarse=groups.map(g=>direct(g,64)),fine=groups.map(g=>direct(g,128)),nodes=128;
  /** Spectral relative quadrature change with a frozen radiance floor. @returns {number} */
  const error=()=>Math.max(...fine.map((x,c)=>Math.abs(x.total-coarse[c].total)/Math.max(numericalFloor,Math.abs(x.total))));
  while(error()>.002&&nodes<512){coarse=fine;nodes*=2;fine=groups.map(g=>direct(g,nodes));}
  assert.ok(error()<.002,`Unconverged ${condition}/${setting.id}/${query.id}: ${error()}`);
  const spectrum=fine.map(x=>x.total);rays.push({id:query.id,direction:query.direction,spectrum,molecular:fine.map(x=>x.species[0]),aerosol:fine.map(x=>x.species[1]),color:color(spectrum,sourceRB),refinement:error(),nodes});
  await yieldNow();
 }
 const near=rays.filter(r=>['sun-0.5','sun-1','sun-2'].includes(r.id)),far=rays.filter(r=>['sun-5','sun-10'].includes(r.id));
 const glowContrast=(near.reduce((s,r)=>s+r.color.Y,0)/near.length)/(far.reduce((s,r)=>s+r.color.Y,0)/far.length);
 const result={setting,condition,medium,rays,glowContrast};measurements.push(result);
 run.write(`${condition}-${setting.id}.json`,result);console.log(JSON.stringify({condition,setting:setting.id,glowContrast,seconds:(Date.now()-start)/1000}));return result;
}
/** Emit physical color fields; GPU sparse spectra qualify every rendered panel. @param {AerosolMeasurement[]} packets @param {string} condition */
async function images(packets,condition){
 const page=await browser.newPage();
 try{
  for(const packet of packets){
   const elevation=Math.asin(packet.medium.sourceDirection[2])*180/Math.PI;
   /** Actual sky fields, not screenshot/app-comparison claims. @type {AerosolView[]} */
   const views=[{id:'horizon',azimuthMinimum:150,azimuthMaximum:210,elevationMinimum:.05,elevationMaximum:25},
    {id:'sun',azimuthMinimum:-15,azimuthMaximum:15,elevationMinimum:elevation-12,elevationMaximum:Math.min(89.8,elevation+12)}];
   for(const view of views){
    run.progress('gpu',`${condition}: ${packet.setting.id} ${view.id}`);
    const shader=fragment(packet.medium,rgbWeights,view);run.write(`${condition}-${packet.setting.id}-${view.id}.glsl`,shader);
    const probes=packet.rays.filter(r=>['h180-e0.05','h180-e3','h180-e20','sun-1','sun-5'].includes(r.id));
    const result=await page.evaluate(execute,{shader,width:240,height:150,directions:probes.map(r=>r.direction)});
    const item=result.cases[0],parity=item.spectra.map((s,i)=>({ray:probes[i].id,maximumRelative:Math.max(...s.map((x,c)=>Math.abs(x-probes[i].spectrum[c])/Math.max(numericalFloor,Math.abs(probes[i].spectrum[c]))))}));
    run.write(`${condition}-${packet.setting.id}-${view.id}-gpu.json`,{renderer:result.renderer,milliseconds:result.milliseconds,parity});
    assert.ok(parity.every(r=>r.maximumRelative<.005),'GPU reference mismatch: '+JSON.stringify(parity));
    const png=new PNG({width:240,height:150});
    for(let y=0;y<150;y++)for(let x=0;x<240;x++){
     const i=4*(y*240+x),j=4*((149-y)*240+x);
     const rgb=/** @type {[number,number,number]} */(item.pixels.slice(i,i+3));
     const code=display.linearSrgbToDisplayRgb(rgb,{value:registration.lux,units:'lux'});
     for(let c=0;c<3;c++)png.data[j+c]=Math.round(code[c]*255);png.data[j+3]=255;
    }
    run.write(`${condition}-${packet.setting.id}-${view.id}.png`,PNG.sync.write(png));
   }
  }
 }finally{await page.close();}
}
try{
 run.write('registration.json',{settings,initial,sourceParent:registrationIdentity,sourceRB,display:display.id,fixedDisplayLux:registration.lux,projection:'Native15 bin-integrated CIE1931 / D65 signed linear sRGB',scope:'Independent diffuse N1 only; no direct solar disk, app scene or full cache. Constant primary exposure across media and geometric conditions.',units:'Spectral radiance W m^-2 sr^-1 nm^-1',glow:'mean Y at 0.5/1/2 degrees divided by mean Y at 5/10 degrees toward zenith from Sun center',numericalTolerance:.002,gpuTolerance:.005});
 const original=await measure(settings[0],'noon',initial);
 numericalFloor=Math.max(...original.rays.flatMap(r=>r.spectrum))*1e-8;
 run.write('floor.json',{numericalFloor,derivation:'original maximum selected-ray radiance times 1e-8',parents:[identity(run.relative+'/noon-original.json')]});
 mkdirSync(checked(profileRelative,true),{recursive:true});
 browser=await puppeteer.launch({headless:'new',userDataDir:checked(profileRelative),protocolTimeout:600000,args:['--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11']});
 for(const setting of settings.slice(1))await measure(setting,'noon',initial);
 // Fixed-extinction SSA controls analytically separate the molecular and aerosol terms.
 let molecularError=0,aerosolScalingError=0;
 for(const packet of measurements.filter(m=>m.condition==='noon'&&m.setting.amount===1))for(let i=0;i<packet.rays.length;i++)for(let c=0;c<15;c++){
  molecularError=Math.max(molecularError,Math.abs(packet.rays[i].molecular[c]/original.rays[i].molecular[c]-1));
  aerosolScalingError=Math.max(aerosolScalingError,Math.abs(packet.rays[i].aerosol[c]/original.rays[i].aerosol[c]/(packet.setting.ssa/.8)-1));
 }
 assert.ok(molecularError<1e-10&&aerosolScalingError<1e-10);run.write('species-invariants.json',{molecularError,aerosolScalingError});
 await images(measurements.filter(m=>m.condition==='noon'),'noon');
 // Preselected informative settings and separate geometric perturbations, not a fitted winner.
 const subset=settings.filter(s=>['original','zero','ssa100','amount050'].includes(s.id));
 for(const [condition,base] of [['high',{...initial,observerHeight:500}],['low',{...initial,sourceDirection:direction(15,0)}]]){
  const packets=[];for(const setting of subset)packets.push(await measure(setting,/** @type {string} */(condition),/** @type {AerosolMedium} */(base)));
  await images(packets,/** @type {string} */(condition));
 }
 run.write('summary.json',measurements.map(m=>({condition:m.condition,setting:m.setting,glowContrast:m.glowContrast,rays:m.rays.map(r=>({id:r.id,...r.color,refinement:r.refinement,nodes:r.nodes}))})));
 const header=['condition','setting','amount','ssa','g','glow','ray','Y','x','y','sourceRelativeRB'];
 run.write('metrics.tsv',[header.join('\t'),...measurements.flatMap(m=>m.rays.map(r=>[m.condition,m.setting.id,m.setting.amount,m.setting.ssa,m.setting.g,m.glowContrast,r.id,r.color.Y,...r.color.xy,r.color.sourceRelativeRB].join('\t')))].join('\n')+'\n');
 run.write('tool.json',{browser:await browser.version(),elapsedMilliseconds:Date.now()-start});
}catch(error){failure=error;run.write('failure.json',{error:String(error),completed:measurements.map(m=>({condition:m.condition,setting:m.setting.id}))});}
finally{
 try{await browser?.close();if(browser){assert.ok(profileRelative.startsWith(output+'/scratch/'));rmSync(checked(profileRelative),{recursive:true});}}catch(error){failure??=error;}
 run.finish(failure,{elapsedMilliseconds:Date.now()-start,completed:measurements.length,scope:'N1-screen only; production untouched'});
}
console.log(JSON.stringify({run:run.relative,failure:failure?String(failure):null}));if(failure)throw failure;
