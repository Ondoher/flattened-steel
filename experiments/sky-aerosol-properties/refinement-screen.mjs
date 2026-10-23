import assert from 'node:assert/strict';
import {mkdirSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
import puppeteer from 'puppeteer';
import {parents,medium,measure,baseline} from './refinement-common.mjs';
import {createRun,checked,output,identity,read} from './io.mjs';
import {fragment,execute} from './refinement-n1-gpu.mjs';
import {ColorResetSlope078P2ColorDisplayModel as Display} from '../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
const {PNG}=createRequire(import.meta.url)('pngjs'),run=createRun('refine-screen',parents()),scratch=output+'/scratch/'+run.relative.split('/').at(-1),display=new Display(),lux=JSON.parse(read('tmp/experiments/sky-aerosol-properties/runs/00001-property-refine/registration.json').toString()).fixedDisplayLux;
const variants=[{id:'combo025',H:1200,alpha:.8,loading:.25,ssa:.95},{id:'height1800',H:1800,alpha:.8,loading:.25,ssa:.95},{id:'height2400',H:2400,alpha:.8,loading:.25,ssa:.95},... [0,.4,1.2].map(alpha=>({id:'alpha'+alpha,H:1200,alpha,loading:.25,ssa:.95})),...[.10,.15,.20].map(loading=>({id:'loading'+loading,H:1200,alpha:.8,loading,ssa:.95})),...[.98,1].map(ssa=>({id:'ssa'+ssa,H:1200,alpha:.8,loading:.25,ssa}))];
let browser,failure=null;const packets=[];
try{
 run.write('registration.json',{variants,lux,exposures:[1,.125],projection:'Same midpoint optical coefficients as authenticated baseline, bin-integrated CIE1931 color',tau550:.01*.55**(-.8),guards:{glowMaximumLoss:.1,absoluteNearMaximumLoss:.1},heldOut:'Actual tangent offsets left/right/down1/5degrees',baseline:identity('tmp/experiments/sky-aerosol-properties/runs/00001-property-refine/noon-combo025.json')});
 mkdirSync(checked(scratch,true),{recursive:true});browser=await puppeteer.launch({headless:'new',userDataDir:checked(scratch),protocolTimeout:600000,args:['--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11']});const page=await browser.newPage(),shader=fragment();run.write('kernel.glsl',shader);
 for(const v of variants){
  const m=medium(v.H,v.alpha,v.loading,v.ssa),packet=await measure(m,s=>run.progress('direct',v.id+': '+s));packets.push({variant:v,...packet});run.write(v.id+'.json',packets.at(-1));
  if(v.id==='combo025')for(const r of baseline.rays){const fresh=packet.rays.find(q=>q.id===r.id);assert.ok(Math.max(...r.spectrum.map((x,c)=>Math.abs(x/fresh.spectrum[c]-1)))<1e-12);}
  for(const view of [{id:'horizon',azimuthMinimum:150,azimuthMaximum:210,elevationMinimum:.05,elevationMaximum:20},{id:'sun',azimuthMinimum:-12,azimuthMaximum:12,elevationMinimum:-8,elevationMaximum:8}]){
   run.progress('image',v.id+' '+view.id);const selected=packet.rays.filter(r=>['h180-e0.05','h180-e3','sun-1','sun-5','hold-left-1','hold-down-5'].includes(r.id));
   const result=await page.evaluate(execute,{shader,width:240,height:160,directions:selected.map(r=>r.direction),medium:m,parameters:{amount:1,ssa:m.albedo,g:m.g,observerHeight:5,sourceDirection:m.sourceDirection},view}),item=result.cases[0];
   const parity=selected.map((r,i)=>({ray:r.id,maximumRelative:Math.max(...r.spectrum.map((x,c)=>Math.abs(item.spectra[i][c]/x-1)))}));assert.ok(parity.every(r=>r.maximumRelative<.005));run.write(v.id+'-'+view.id+'-gpu.json',{renderer:result.renderer,milliseconds:result.milliseconds,parity});
   run.write(v.id+'-'+view.id+'-linear.f32.gz',gzipSync(Buffer.from(Float32Array.from(item.pixels).buffer)));
   for(const exposure of [1,.125]){const png=new PNG({width:240,height:160});for(let y=0;y<160;y++)for(let x=0;x<240;x++){const i=4*(y*240+x),j=4*((159-y)*240+x),rgb=/** @type {[number,number,number]} */(item.pixels.slice(i,i+3).map(x=>x*exposure)),code=display.linearSrgbToDisplayRgb(rgb,{value:lux,units:'lux'});for(let c=0;c<3;c++)png.data[j+c]=Math.round(code[c]*255);png.data[j+3]=255;}run.write(v.id+'-'+view.id+(exposure===1?'':'-bracket')+'.png',PNG.sync.write(png));}
  }
  console.log(JSON.stringify({id:v.id,...packet.metrics}));
 }
 const base=packets[0],summary=packets.map(p=>({variant:p.variant,...p.metrics,relativeY:p.metrics.horizonY/base.metrics.horizonY-1,relativeNear:p.metrics.nearY/base.metrics.nearY-1,relativeGlow:p.metrics.glow/base.metrics.glow-1,glowRetained:p.metrics.nearY/base.metrics.nearY>=.9&&p.metrics.glow/base.metrics.glow>=.9}));
 const fixed=packets.filter(p=>p.variant.id.startsWith('ssa'));let molecular=0,aerosol=0;for(const p of fixed)for(let i=0;i<p.rays.length;i++){if(p.rays[i].ground)continue;for(let c=0;c<15;c++){molecular=Math.max(molecular,Math.abs(p.rays[i].molecular[c]/base.rays[i].molecular[c]-1));aerosol=Math.max(aerosol,Math.abs(p.rays[i].aerosol[c]/base.rays[i].aerosol[c]/(p.medium.albedo/.95)-1));}}assert.ok(molecular<1e-12&&aerosol<1e-12);
 run.write('controls.json',{molecularInvariant:molecular,aerosolSsaScaling:aerosol,columnCheck:'analytic finite exponential column matches tau550 at all H; exact baseline reproduction <1e-12'});run.write('summary.json',summary);run.write('metrics.tsv',['profile\tH_m\talpha\tloading\tSSA\thorizon_Y\tx\ty\tnear_Y\tglow\tretained',...summary.map(p=>[p.variant.id,p.variant.H,p.variant.alpha,p.variant.loading,p.variant.ssa,p.horizonY,...p.xy,p.nearY,p.glow,p.glowRetained].join('\t'))].join('\n')+'\n');run.write('tool.json',{browser:await browser.version()});
}catch(e){failure=e;run.write('failure.json',{error:String(e),completed:packets.map(p=>p.variant.id)});console.error(e);}finally{await browser?.close().catch(e=>failure??=e);if(browser)rmSync(checked(scratch),{recursive:true});run.finish(failure,{completed:packets.length});}if(failure)process.exitCode=1;
