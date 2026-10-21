import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {direct} from '../interior-illumination/physics.mjs';
import {base,registration,pack,verifyRun,coordinates,dot,miePhase,rayleighPhase} from './common.mjs';
import {builderTarget,builderGeometry} from './builder-geometry.mjs';
import {paperPhaseTail} from './polar-native-field.mjs';
import {openBinaryProjection} from './query-binary.mjs';
import {projectSpectral} from './query-spectral-core.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {lm,convolve} from './harmonics.mjs';
import {harmonicShader,harmonicResident} from './harmonic-gpu.mjs';

const heights=(process.argv[2]??'1875').split(',').map(Number),channel=8,L=128,orders=[4,8,16,32],r=registration(),profile=r.profiles.find(p=>p.id==='paper'),config=r.configs.find(c=>c.k===.5);assert.ok(heights.every(h=>Number.isFinite(h)&&h>0&&h<profile.control.medium.topAltitude));

/** Uniform physical-kernel coefficient-difference bound. @param {any} a
 * @param {any} b @param {number[]} beta @param {number[]} ray
 * @param {number[]} mie @returns {number} */
function operatorDifference(a,b,beta,ray,mie){let sum=0;for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weight=(m===0?1:2)*Math.sqrt((2*l+1)/(4*Math.PI))*(beta[0]*Math.abs(ray[l])+beta[1]*Math.abs(mie[l]));for(let s=0;s<2;s++)sum+=weight*Math.hypot(a.real[s][at]-b.real[s][at],a.imag[s][at]-b.imag[s][at]);}return sum;}

/** Build an actual source row; every emitted value comes from this row's own
 * newly computed atmospheric L1. No independent reference field is substituted.
 * @param {number} height @returns {Promise<any>} */
async function buildRow(height){
 const target=builderTarget(profile.control.medium.radius,height,89.5,`own-source-h${height}`),{f,union}=builderGeometry(profile,target,channel,config),run=createRun('h138-source-row',{
  parents:['00725-h136-source-row','00732-h136-spec-row','00733-h138-row-frame','00735-h138-path-proof'].map(name=>verifyRun(base+name)),
  operation:'Build one actual paper/red native-cube pure-J2 row from its own panel/log direct-L1 field and the admitted full128-ring positive reconstruction. Emit separate final Rayleigh/Mie density fields for a registered short radial-path development pilot; no oracle field, missing-row fill or observer color.',
  parameters:{profile:'paper',height,solarZenithDegrees:89.5,channel,wavelengthNanometers:profile.control.request.transportSpec.domains.spectrum.channels[channel].centerNanometers,L,orders,inputLevels:{n32:[32,128],n64:[64,128],n256:[64,256]},numericalControl:'Fixed source-forward original4096 physical quadrature, numerical scale only',projectionTarget:1e-5,allNativeOutputs:true,costIsGate:false,groundAlbedo:0},
 });let browser,bridge,failure;
 try{
  assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();await page.evaluate(resident,{action:'init',shader:shader()});const levels={},inputTimings={};
  for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){const got=await evaluate(page,run,f.px,union.field.g.nodes,Number(nv),Number(nc),`own J2 h${height}`);levels[key]=got.values;inputTimings[key]=got.timings;}
  await page.evaluate(resident,{action:'close'});const beta=[f.px.br*Math.exp(-height/8000),f.px.bm*f.px.ssa*Math.exp(-height/1200)],original=Array(f.g.count);union.entries.forEach((entry,ring)=>{if(entry.origin==='original')for(let j=0;j<64;j++)original[entry.index*64+j]=levels.n256[ring*64+j];});
  const scale=original.reduce((sum,v,i)=>{const mu=dot(f.g.nodes[i],f.px.sun);return sum+f.g.weights[i]*(beta[0]*rayleighPhase(mu)+beta[1]*miePhase(null,mu))*(v[0]+v[1]);},0);assert.ok(scale>0&&Number.isFinite(scale));const calibration=[];
  for(const i of [Math.floor(.31*union.field.g.count),Math.floor(.67*union.field.g.count)]){run.progress('own-L1-binary64',`h${height} node${i}`);const d=union.field.g.nodes[i],cpu=direct(f.px,d,64,256),gpu=levels.n256[i],difference=cpu.reduce((sum,x,s)=>sum+Math.abs(x-gpu[s]),0),relative=difference/Math.max(cpu[0]+cpu[1],1e-25),mu=dot(d,f.px.sun),weighted=4*Math.PI*(beta[0]*rayleighPhase(mu)+beta[1]*miePhase(null,mu))*difference/scale;assert.ok(relative<=2e-5||weighted<=2e-8);calibration.push({i,cpu,gpu,relative,weighted});}
  run.write('input.json.gz',pack({physical:f.px,target,directions:union.field.g.nodes,levels,inputTimings,calibration,scale,controlDirection:f.px.sun}));bridge=await openBinaryProjection();await page.goto(bridge.origin+'/');const ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),mie=phaseMoments(null,L),amplitudeMax=[0,1].map(s=>Math.max(...levels.n256.map((v,i)=>v[s]/union.field.sourcePhases[i][s]))),massUpper=4*Math.PI*(amplitudeMax[0]*rayleighPhase(1)+amplitudeMax[1]*miePhase(null,1)),truncationUpper=beta[1]*massUpper*paperPhaseTail(L)/scale,projection=[];let previous,last,qualified=false;
  for(const n of orders){
   const got=await projectSpectral(page,run,[union.field],[levels.n256],L,n,bridge),c=got.coefficients[0],change=previous?operatorDifference(c,previous,beta,ray,mie)/scale:null,envelope=change===null?null:2*change+truncationUpper,item={n,change,envelope,truncationUpper,qualified:envelope!==null&&envelope<=1e-5,timings:got.timings,rings:got.rings,count:got.count,peakOwnedTextureBytes:got.peakOwnedTextureBytes,binary:got.binary};
   run.write(`coefficients-n${n}.json.gz`,pack({L,n,real:c.real.map(a=>Array.from(a)),imag:c.imag.map(a=>Array.from(a)),result:item,input:identity(run.path+'/input.json.gz')}));projection.push(item);previous=c;last=c;console.log(JSON.stringify({height,...item}));if(item.qualified){qualified=true;break;}
  }
  await bridge.close();bridge=null;
  if(qualified)await emitNative(page,run,f,union,last,beta,ray,mie,height,projection);
  await browser.close();browser=null;run.write('summary.json',{height,target,channel,projection,qualifiedNumerical:qualified,scope:'Own computed atmospheric L1-to-J2 source row. Physical reference, spatial/path interpolation, later orders and complete observer cache remain separate; no missing field is filled.'});run.finish('accepted',{height,qualifiedNumerical:qualified});verifyRun(run.path);console.log(JSON.stringify({run:run.path,height,qualifiedNumerical:qualified,storage:storage()}));return {run:run.path,qualified};
 }catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);await bridge?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
}

/** @param {any} page @param {any} run @param {any} f @param {any} union
 * @param {any} c @param {number[]} beta @param {number[]} ray @param {number[]} mie
 * @param {number} height @param {any[]} projection @returns {Promise<void>} */
async function emitNative(page,run,f,union,c,beta,ray,mie,height,projection){
 const native=f.p.control.request.transportSpec.domains.outgoing.unitVectors,vectors=[...native,f.px.sun,f.px.sun.map(x=>-x),[0,0,1]],angles=vectors.map(d=>coordinates(union.field.mesh,d)),outgoing=angles.flatMap(([mu,phi])=>[mu,Math.cos(phi),Math.sin(phi),0]),size=(L+1)*(L+2)/2,textureHeight=Math.ceil(size/256),real=new Float64Array(textureHeight*256*4),imag=new Float64Array(textureHeight*256*4);
 for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weights=[beta[0]*ray[l],beta[0]*ray[l],beta[1]*mie[l],beta[1]*mie[l]];for(let s=0;s<4;s++){real[at*4+s]=c.real[s%2][at]*weights[s];imag[at*4+s]=c.imag[s%2][at]*weights[s];}}
 const renderer=await page.evaluate(harmonicResident,{action:'init',shader:harmonicShader(L),height:textureHeight,real:Array.from(real),imag:Array.from(imag),outgoing,capacity:1024}),values=[];
 for(let at=0;at<vectors.length;at+=1024){run.progress('own-native-J2',`h${height} outgoing${at}/${vectors.length}`);values.push(...await page.evaluate(harmonicResident,{action:'draw',offset:at,count:Math.min(1024,vectors.length-at)}));}await page.evaluate(harmonicResident,{action:'close'});assert.ok(values.every(x=>Number.isFinite(x)&&x>=0));const checks=[];
 for(const i of [0,Math.floor(native.length/2),native.length-1,native.length,native.length+1,native.length+2]){const [mu,phi]=angles[i],r=convolve(c,mu,phi,ray),m=convolve(c,mu,phi,mie),cpu=[r[0]*beta[0],r[1]*beta[0],m[0]*beta[1],m[1]*beta[1]],gpu=values.slice(i*4,i*4+4),relative=Math.max(...cpu.map((x,k)=>Math.abs(x-gpu[k])/Math.max(Math.abs(x),1e-25)));assert.ok(relative<=1e-4);checks.push({i,direction:vectors[i],cpu,gpu,relative});}
 const rayleigh=native.map((_,i)=>Math.fround(values[i*4]+values[i*4+1])),aerosol=native.map((_,i)=>Math.fround(values[i*4+2]+values[i*4+3]));
 run.write('J2-native.json.gz',pack({physical:f.px,target:f.t,nativeDirections:native,rayleigh,mie:aerosol,allTransitionValues:values,checks,projection,renderer,coordinateContract:'scene-cache-receiver-local-v1',units:'Pure-J2 source density; local scattering coefficients/densities already included',derivation:'R=F32(transition0+transition1), M=F32(transition2+transition3); no ground component'}));
}

for(const height of heights)await buildRow(height);
