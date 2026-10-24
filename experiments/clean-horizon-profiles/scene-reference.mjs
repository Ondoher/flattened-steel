import assert from 'node:assert/strict';
import {mkdirSync,readdirSync,readFileSync} from 'node:fs';
import {createRun,checked,identity,command,source} from './io.mjs';
import {physical,bundle,channels} from '../elevated-horizon-validation/physics.mjs';
import {directBundle} from '../sky-accuracy-dials/distant-horizon/toronto-direct.mjs';
import {interpolate} from './profile-sampling.mjs';
import {LocationTimeController} from '../../src/flat32/LocationTimeController.js';
import {createDistantSunSceneState} from '../../src/flat32/DistantSunSceneState.js';

const parent=process.argv[2],mode=process.argv[3]??'pilot';
assert.match(parent,/^tmp\/experiments\/clean-horizon-profiles\/runs\/\d{5}-reconstruction$/u);
const profile=JSON.parse(readFileSync(checked(parent+'/model.json'),'utf8'));
const variants=JSON.parse(readFileSync(checked(parent+'/variants.json'),'utf8'));
const recovery=process.argv[4];if(recovery)assert.match(recovery,/^tmp\/experiments\/clean-horizon-profiles\/runs\/\d{5}-scene-reference$/u);
const run=createRun('scene-reference','S2 matched full-spherical native15 reference with tabulated aerosol density and registered finite pixel quadrature',[identity(parent+'/manifest.json'),identity('scripts/libradtran/installation.json'),identity('experiments/sky-accuracy-dials/distant-horizon/toronto-direct.mjs'),...(recovery?[identity(recovery+'/manifest.json')]:[])]);
const controller=new LocationTimeController(),location=controller.selectLocation(controller.start(),0);
const scenes=mode==='pilot'?[{time:'noon',height:500},{time:'sunset',height:40000}]:[{time:'noon',height:5},{time:'noon',height:500},{time:'sunset',height:500},{time:'sunset',height:40000}];
const configs=[];
for(const scene of scenes)for(const model of ['bruneton',profile.id])for(const delta of [-.1,.1])for(let repeat=0;repeat<3;repeat++)for(const q of [-1,1]){
	const limb=-Math.acos(6360000/(6360000+scene.height))*180/Math.PI;
	const pixelNode=Math.atan(Math.tan(25*Math.PI/180)/576/Math.sqrt(3))*180/Math.PI;
	configs.push({...scene,model,delta,repeat,q,elevation:limb+delta+q*pixelNode,azimuth:pixelNode/Math.cos(limb*Math.PI/180),channels:Array.from({length:15},(_,i)=>i),layers:512,photons:100000,vroomOff:true,epsilon:1,id:`${scene.time}-${scene.height}-${model==='bruneton'?'b':'a'}-${delta<0?'lo':'hi'}-${repeat}-${q<0?0:1}`});
}
run.write('registration.json',{mode,configs,finitePixel:'2x2 Gaussian footprint at image-center angular scale; +/- horizontal azimuth contributions are identical by spherical/source-plane reflection symmetry, requiring two distinct vertical rays. Weights1/2. This is a local center-pixel approximation, not a fitted edge.',assumptions:'Native15 bin-average optics/source, fixed scalar phase and SSA; fully spherical all-orders MYSTIC, black ground, no gas/refraction. Production cache N4/order tail is separate.'});
const readings=[];let failure;
try{
 for(const [index,config]of configs.entries()){
  run.progress('solver',config.id,{completed:index,total:configs.length});
  if(recovery){
   const manifest=JSON.parse(readFileSync(checked(recovery+'/manifest.json'),'utf8'));
   const artifact=manifest.artifacts.find(a=>a.path===recovery+'/reading-'+config.id+'.json');
   if(artifact){assert.equal(identity(artifact.path).sha256,artifact.sha256);const previous=JSON.parse(readFileSync(checked(artifact.path),'utf8'));assert.deepEqual(previous.config,config);const reading={...previous,reuseParent:artifact};readings.push(reading);run.write('reading-'+config.id+'.json',reading);continue;}
  }
  const selected=controller.selectGlobeTime(location,config.time==='noon'?1:2),state=createDistantSunSceneState({observation:selected.observation,observerHeight:{value:config.height,units:'meters'},observerUpDirection:[0,0,1]});
  const medium={...physical(),geometry:/** @type {const} */('spherical'),sourceKind:/** @type {const} */('parallel'),observerAltitude:config.height,zenithDegrees:state.solarZenithDegrees,sourcePosition:[0,0,1],referenceDistance:1};
  medium.sourceDirection=[0,-Math.sin(state.solarZenithDegrees*Math.PI/180),Math.cos(state.solarZenithDegrees*Math.PI/180)];
  const candidate=config.model==='bruneton'?null:profile;
  if(candidate){medium.mie=candidate.mie;medium.albedo=candidate.albedo;}
  const exported=bundle({...medium,albedo:.8},config),files=exported.files;
  if(candidate){
   const optical=directBundle({...medium,albedo:.8},config,{phaseTables:Array(15).fill(candidate.phase),albedos:Array(15).fill(candidate.albedo),unsupportedCenters:[],changedChannels:[]},false);
   files.set('toronto.material.cdf',optical.get('toronto.material.cdf'));
   const z=[...new Set([...exported.proof.levels,...candidate.altitudesMeters])].sort((a,b)=>b-a);
   const density=h=>interpolate(candidate.altitudesMeters,candidate.extinction550PerMeter,h)/candidate.extinction550PerMeter[0];
   files.set('species.txt',z.map((h,i)=>`${h/1000} ${i===0?0:(density(h)+density(z[i-1]))/2}`).join('\n')+'\n');
   files.set('scattering.txt',[z.map(h=>h/1000).join(' '),...config.channels.map(c=>[channels[c].center.value,...z.slice(1).map((h,i)=>medium.rayleigh[c]*medium.rayleighHeight*(Math.exp(-h/medium.rayleighHeight)-Math.exp(-z[i]/medium.rayleighHeight)))].join(' '))].join('\n')+'\n');
   files.set('absorption.txt',[z.map(h=>h/1000).join(' '),...config.channels.map(c=>[channels[c].center.value,...z.slice(1).map(()=>0)].join(' '))].join('\n')+'\n');
   files.set('atmosphere.txt',z.map(h=>`${h/1000} ${1013*Math.exp(-h/medium.rayleighHeight)} 288 ${2.545818e19*Math.exp(-h/medium.rayleighHeight)}`).join('\n')+'\n');
   const projected=z.slice(1).reduce((sum,h,i)=>sum+(density(h)+density(z[i]))/2*(z[i]-h)*candidate.extinction550PerMeter[0],0);
   assert.ok(Math.abs(projected-candidate.fit.column550)<1e-10);
   files.set('case.json',JSON.stringify({purpose:'ARM-informed reconstruction reference, not Toronto',geometry:`Fully spherical R=6360000 m, observer=${config.height} m, elevation=${config.elevation}, azimuth=${config.azimuth}`,quantity:'Directional spectral radiance in execution/mc.rad.spc; divide mW by1000 for W per nm per sr.',config,observation:selected.observation,profileIdentity:candidate.id,profile:identity(parent+'/model.json'),projectedAod550:projected,binaryOpticalProof:JSON.parse(String(optical.get('case.json'))).actualBinaryOpticalProof,units:'Library extinction per km; species density is dimensionless normalized table shape, not measured aerosol mass.',limitations:['All-orders scalar spherical reference versus N4 production recurrence.','No refraction/gas absorption; black ground.']},null,2));
  }
  files.set('input.inp',String(files.get('input.inp')).replace(/^spline_file .*\r?\n/mu,''));
  const relative='cases/'+config.id;mkdirSync(run.absolute+'/'+relative,{recursive:true});for(const[name,value]of files)run.write(relative+'/'+name,value);
  mkdirSync(run.absolute+'/tools',{recursive:true});const before=new Set(readdirSync(run.absolute+'/tools'));
  const result=await command(run,config.id,[source+'/cli.js','run','--case',checked(run.path+'/'+relative),'--timeout-seconds','1200'],{HORIZON_TOOL_PARENT:run.absolute});assert.equal(result.code,0,result.stdout+result.stderr);
  const child=readdirSync(run.absolute+'/tools').find(n=>!before.has(n));assert.ok(child);
  const tool=run.path+'/tools/'+child,rows=readFileSync(checked(tool+'/execution/mc.rad.spc'),'utf8').trim().split(/\r?\n/u).map(line=>line.trim().split(/\s+/u).map(Number));assert.equal(rows.length,15);
  const spectrum=rows.map((r,c)=>{assert.ok(Math.abs(r[0]-channels[c].center.value)<.002&&r.at(-1)>=0&&Number.isFinite(r.at(-1)));return r.at(-1)/1000;});
  const reading={config,spectrum,tool,seconds:result.seconds,observation:selected.observation};readings.push(reading);run.write('reading-'+config.id+'.json',reading);console.log(JSON.stringify({case:config.id,seconds:result.seconds}));
 }
 run.write('readings.json',readings);
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}
run.finish(failure?'failed':'accepted',{cases:readings.length,failure});if(failure)process.exitCode=1;
