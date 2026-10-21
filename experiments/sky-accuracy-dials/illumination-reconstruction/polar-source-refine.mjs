// Precision orchestration from experiments/sky-accuracy-dials/illumination-reconstruction/polar-native-row.mjs
// Source SHA256 965f9c2a193b6d57a99b4ba8fd49066745af0c3a743f6066aee0f0ae9806e13c. Source/integration equations preserved.
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createRun,storage,identity} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {direct} from '../interior-illumination/physics.mjs';
import {base,read,pack,verifyRun,retained,coordinates,miePhase,rayleighPhase,dot} from './common.mjs';
import {polarNativeField,paperPhaseTail} from './polar-native-field.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {lm} from './harmonics.mjs';
import {harmonicResident,harmonicShader} from './harmonic-gpu.mjs';

const parent=process.argv[2],nextOrder=Number(process.argv[3]??16),L=128;assert.ok(parent&&Number.isInteger(nextOrder)&&nextOrder>=16&&nextOrder<=128);
const parentIdentity=verifyRun(parent),parentSummary=read(parent+'/summary.json'),requested=process.argv[4]?.split(',').map(Number);
const selected=parentSummary.rows.filter(row=>requested?requested.includes(row.channel):!row.levels.at(-1).projectionQualified);assert.ok(selected.length>0);
const run=createRun('h136-polar-finer',{
 parents:[parentIdentity],operation:'Refine only unresolved numerical projection envelopes of fixed actual polar source rows. Reuse exact nodal inputs and completed coefficient levels; retain physical phase, reconstruction, numerical control, per-band envelope and all-outgoing CPU/GPU parity. No light retrace or historical mutation.',
 parameters:{parent,nextOrder,bands:selected.map(row=>row.channel),L,CPUConcurrency:4,costIsGate:false},
});
/** @param {number} channel @param {number} n @param {any} input @returns {Promise<any>} */
function projectBand(channel,n,input){return new Promise((resolve,reject)=>{
 const worker=new Worker(new URL('./polar-native-worker.mjs',import.meta.url),{workerData:{channel,L,n,input}});let result,stopped=false;
 worker.on('message',m=>{if(stopped)return;try{if(m.type==='progress')run.progress('native-polar-projection',`b${channel}/n${n} ${m.message}`);else if(m.type==='result')result=m.value;}catch(error){stopped=true;worker.terminate().then(()=>reject(error),()=>reject(error));}});
 worker.once('error',reject);worker.once('exit',code=>{if(!stopped)code===0&&result?resolve(result):reject(Error(`Native projection worker exit${code}`));});
});}
let browser,failure;
try {
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),rows=[];
 for(let at=0;at<selected.length;at+=4){
  const settled=await Promise.allSettled(selected.slice(at,at+4).map(async row=>{
   const channel=row.channel,previousLevel=row.levels.at(-1);assert.equal(previousLevel.L,L);assert.ok(nextOrder>previousLevel.n);
   const inputRoot=row.inputRoot??row.reusedParent??parentSummary.originalInputRoot??parent,input=identity(inputRoot+'/paper-b'+channel+'-nodes.json.gz'),oldPath=parent+'/paper-b'+channel+'-n'+previousLevel.n+'.json.gz',old=read(oldPath),inputPacket=read(input.path);assert.equal(old.result.scale,previousLevel.scale);
   const result=await projectBand(channel,nextOrder,input);return {channel,row,previousLevel,inputRoot,input,old,oldPath,controlScale:inputPacket.controlScale??previousLevel.scale,result};
  }));let batchFailure;
  for(const settledItem of settled){
   if(settledItem.status==='rejected'){batchFailure??=settledItem.reason;continue;}
   const data=settledItem.value,{channel,controlScale}=data,{f}=polarNativeField(channel),priorCoefficients=data.old;
  const beta=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)],mie=phaseMoments(null,L),ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),vectors=[...f.p.control.request.transportSpec.domains.outgoing.unitVectors,f.out,f.px.sun,f.px.sun.map(x=>-x)],outgoing=vectors.flatMap(d=>{const [mu,phi]=coordinates(f.mesh,d);return [mu,Math.cos(phi),Math.sin(phi),0];}),band=[];let previous=priorCoefficients;

   const n=nextOrder,{c,cpuValues,item}=data.result;
assert.equal(item.scale,controlScale);let uniformChange=null;
   if(previous){let bound=0;for(let l=0;l<=L;l++){const y=Math.sqrt((2*l+1)/(4*Math.PI)),weight=beta[0]*ray[l]+beta[1]*mie[l];for(let m=0;m<=l;m++)for(let s=0;s<2;s++){const j=lm(l,m);bound+=(m===0?1:2)*weight*y*Math.hypot(c.real[s][j]-previous.real[s][j],c.imag[s][j]-previous.imag[s][j]);}}uniformChange=bound/item.scale;}
   const size=(L+1)*(L+2)/2,height=Math.ceil(size/256),real=new Float64Array(height*256*4),imag=new Float64Array(height*256*4);
   for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),w=[beta[0]*ray[l],beta[0]*ray[l],beta[1]*mie[l],beta[1]*mie[l]];for(let s=0;s<4;s++){real[at*4+s]=c.real[s%2][at]*w[s];imag[at*4+s]=c.imag[s%2][at]*w[s];}}
   const started=Date.now(),renderer=await page.evaluate(harmonicResident,{action:'init',shader:harmonicShader(L),height,real:Array.from(real),imag:Array.from(imag),outgoing,capacity:1024}),gpu=[];
   for(let at=0;at<vectors.length;at+=1024){run.progress('native-polar-GPU',`b${channel}/n${n} ${at}/${vectors.length}`);gpu.push(...await page.evaluate(harmonicResident,{action:'draw',offset:at,count:Math.min(1024,vectors.length-at)}));}
   await page.evaluate(harmonicResident,{action:'close'});
   const gpuMilliseconds=Date.now()-started,maxRelative=Math.max(...gpu.map((x,i)=>Math.abs(x-cpuValues[i])/Math.max(Math.abs(cpuValues[i]),1e-25))),minimum=Math.min(...gpu);assert.ok(maxRelative<=1e-4&&minimum>=0,'Every outgoing GPU component must match independent binary64 and remain nonnegative');
   const projectionEnvelope=uniformChange===null?null:2*uniformChange+item.truncationUpper;
   const result={...item,uniformChange,projectionEnvelope,projectionQualified:projectionEnvelope!==null&&projectionEnvelope<=1e-5,maxRelative,minimum,gpuMilliseconds,renderer,outgoing:4374,extraPhysicalDirections:3};band.push(result);
   run.write(`paper-b${channel}-n${n}.json.gz`,pack({L,real:c.real.map(a=>Array.from(a)),imag:c.imag.map(a=>Array.from(a)),cpuValues:Array.from(cpuValues),gpu,result,units:'Local pure-J2 density; not observer radiance'}));previous=c;
   console.log(JSON.stringify(result));
   rows.push({channel,inputRoot:data.inputRoot,previousCoefficient:identity(data.oldPath),levels:[...data.row.levels,...band]});
  }
  if(batchFailure)throw batchFailure;
 }
 await browser.close();browser=null;run.write('summary.json',{bands:rows.map(row=>row.channel),rows,projectionQualified:rows.every(row=>row.levels.at(-1).projectionQualified),allOutgoingParity:true,originalInputRoot:parentSummary.originalInputRoot??parent,scope:'Only new projection precision on the same source row; previous inputs/levels stay immutable. No physical/higher-order/observer qualification.'});
 run.finish('accepted',{bands:rows.length,nextOrder});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
