import assert from 'node:assert/strict';
import {mkdirSync,readdirSync,readFileSync} from 'node:fs';
import {createRun,checked,identity,command,source,root} from './io.mjs';
import {physical,bundle,directTransmission,ray} from '../elevated-horizon-validation/physics.mjs';

const run=createRun('control-pilot','M1 matched baseline and molecular-only spherical grazing-ray pilot',[identity('experiments/elevated-horizon-validation/physics.mjs'),identity('experiments/elevated-horizon-validation/cli.js'),identity('experiments/elevated-horizon-validation/worker.py'),identity('scripts/libradtran/installation.json')]);
const configs=[];
for(const height of [5,100,500])for(const model of ['bruneton','molecular'])for(const delta of [-.1,.1]){
 const horizon=-Math.acos(6360000/(6360000+height))*180/Math.PI;
 configs.push({id:model+'-'+height+'-'+(delta<0?'below':'above'),height,model,delta,elevation:horizon+delta,channels:[6],layers:256,repeat:0,vroomOff:true,epsilon:1,photons:100000,surfaceAlbedo:0,azimuth:180});
}
run.write('registration.json',{configs,interpretation:'Single green-channel pilot, not a spectrum/color or precision-qualified comparison. All-order spherical MYSTIC, actual limb, black ground; production molecular/aerosol inputs unchanged.'});
const readings=[];
let failure;
try{
 for(const [index,config]of configs.entries()){
  run.progress('solver',config.id,{completed:index,total:configs.length});
  const medium={...physical(),observerAltitude:config.height};if(config.model==='molecular')medium.mie=medium.mie.map(()=>0);
  const exported=bundle(medium,config),relative='cases/'+config.id;
  exported.files.set('input.inp',String(exported.files.get('input.inp')).replace(/^spline_file .*\r?\n/mu,''));
  mkdirSync(run.absolute+'/'+relative,{recursive:true});
  for(const[name,bytes]of exported.files)run.write(relative+'/'+name,bytes);
  const tools=run.absolute+'/tools';mkdirSync(tools,{recursive:true});const before=new Set(readdirSync(tools));
  const result=await command(run,config.id,[source+'/cli.js','run','--case',checked(run.path+'/'+relative),'--timeout-seconds','1200'],{HORIZON_TOOL_PARENT:run.absolute});
  assert.equal(result.code,0,result.stdout+result.stderr);
  const child=readdirSync(tools).find(name=>!before.has(name));assert(child);
  const raw=readFileSync(tools+'/'+child+'/execution/mc.rad.spc','utf8').trim().split(/\s+/u).map(Number);
  const radiance=raw.at(-1)/1000;assert(Number.isFinite(radiance)&&radiance>=0);
  const view=ray(config.elevation,config.height),transmission=directTransmission(medium,view);
  const item={config,radiance,transmission,seconds:result.seconds,tool:run.path+'/tools/'+child};readings.push(item);run.write('reading-'+config.id+'.json',item);console.log(JSON.stringify({id:config.id,radiance,seconds:result.seconds}));
 }
 run.write('readings.json',readings);
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}
run.finish(failure?'failed':'accepted',{cases:readings.length,failure});if(failure)process.exitCode=1;
