import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,pack,verifyRun} from './common.mjs';
import {lm} from './harmonics.mjs';
import {harmonicShader,harmonicResident} from './harmonic-gpu.mjs';

const profile=process.argv[2]??'paper',L=Number(process.argv[3]??128);
const bands=(process.argv[4]??Array.from({length:15},(_,i)=>i).join(',')).split(',').map(Number);
assert.ok(['paper','toronto'].includes(profile)&&Number.isInteger(L)&&L>=32);
assert.ok(bands.length>0&&bands.every(c=>Number.isInteger(c)&&c>=0&&c<15));
const parent=base+(profile==='paper'?'00667-h136-native-row':'00669-h136-native-row');
const run=createRun('h136-sh-spectrum',{
 parents:[verifyRun(parent),verifyRun(base+'00684-h136-sh-proof'),verifyRun(base+'00688-h136-sh-field')],
 operation:'Actual native all-spectrum allocation; independently project each unchanged wavelength at orders4/8 and evaluate the complete outgoing local-J2 density row on GPU. Preserve projection, harmonic truncation and physical accuracy as separate quantities. No observer spectrum, physical color or actual recurrence claim.',
 parameters:{profile,L,bands,orders:[4,8],outgoing:4374,coordinateContract:'scene-cache-receiver-local-v1',costIsGate:false},
});

/** @param {number} channel @param {number} n @returns {Promise<any>} */
function compute(channel,n) {
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./spectral-worker.mjs',import.meta.url),{workerData:{profile,channel,L,n}});
  let result,stopped=false;
  worker.on('message',m=>{
   if(stopped)return;
   try{if(m.type==='progress')run.progress('spectral-projection',`b${channel}/n${n}: ${m.message}`);else if(m.type==='result')result=m.value;}
   catch(error){stopped=true;worker.terminate().then(()=>reject(error),()=>reject(error));}
  });
  worker.once('error',reject);
  worker.once('exit',code=>{if(!stopped)code===0&&result?resolve(result):reject(Error(`Spectral worker exit${code}, result${Boolean(result)}`));});
 });
}

let browser,failure;
try {
 assertIdleGpu(run.path);
 browser=await launch(run);
 const page=await browser.newPage(),rows=[];
 for(const channel of bands) {
  let previous;
  const levels=[];
  for(const n of [4,8]) {
   const {c,metadata:m}=await compute(channel,n);
   run.write(`b${channel}-n${n}-coefficients.json.gz`,pack({L,real:c.real.map(x=>Array.from(x)),imag:c.imag.map(x=>Array.from(x)),metadata:m}));
   const size=(L+1)*(L+2)/2,height=Math.ceil(size/256),real=new Float64Array(height*256*4),imag=new Float64Array(height*256*4);
   for(let l=0;l<=L;l++)for(let order=0;order<=l;order++) {
    const at=lm(l,order),weights=[m.beta[0]*m.ray[l],m.beta[0]*m.ray[l],m.beta[1]*m.mie[l],m.beta[1]*m.mie[l]];
    for(let s=0;s<4;s++){real[at*4+s]=c.real[s%2][at]*weights[s];imag[at*4+s]=c.imag[s%2][at]*weights[s];}
   }
   const outgoing=m.angles.flatMap(([mu,phi])=>[mu,Math.cos(phi),Math.sin(phi),0]),started=Date.now();
   const renderer=await page.evaluate(harmonicResident,{action:'init',shader:harmonicShader(L),height,real:Array.from(real),imag:Array.from(imag),outgoing}),values=[];
   for(let at=0;at<m.vectors.length;at+=64) {
    run.progress('spectral-GPU-row',`${profile}/b${channel}/n${n} ${at}/${m.vectors.length}`);
    values.push(...await page.evaluate(harmonicResident,{action:'draw',offset:at,count:Math.min(64,m.vectors.length-at)}));
   }
   await page.evaluate(harmonicResident,{action:'close'});
   const checks=m.checks.map(check=>{
    const gpu=values.slice(check.j*4,check.j*4+4),relative=Math.max(...check.value.map((x,s)=>Math.abs(x-gpu[s])/Math.max(Math.abs(x),1e-25)));
    assert.ok(relative<=1e-4,'Spectral GPU/binary64 parity');
    return {...check,gpu,relative};
   });
   const change=previous?Math.max(...values.map((x,i)=>Math.abs(x-previous[i]))):null;
   const item={profile,channel,L,n,count:m.count,rings:m.rings,checks,projectionMaxAbsoluteChange:change,minimum:Math.min(...values),projectionMilliseconds:m.milliseconds,gpuHostMilliseconds:Date.now()-started,renderer};
   run.write(`b${channel}-n${n}-row.json.gz`,pack({values,item,units:'Local J2 scattering density; no observer color.'}));
   levels.push(item);previous=values;
   console.log(JSON.stringify({profile,channel,L,n,parity:Math.max(...checks.map(x=>x.relative)),projectionMaxAbsoluteChange:change}));
  }
  rows.push({channel,levels});
 }
 await browser.close();browser=null;
 run.write('summary.json',{profile,L,bands,rows,fullSpectralRow:bands.length===15,scope:'Numerical native-input whole spectral/outgoing row. Projection convergence, harmonic degree convergence and physical validation are distinct. No full cache, own-field recurrence, observer spectrum or B1 claim.'});
 run.finish('accepted',{profile,L,bands:bands.length});
 console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{
 await browser?.close().catch(e=>failure??=e);
 if(failure)run.finish('failed',{failure:String(failure)});
}
verifyRun(run.path);
if(failure)throw failure;
