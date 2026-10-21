import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createRun,storage} from '../io/files.mjs';
import {base,pack,verifyRun} from './common.mjs';

const profile=process.argv[2]??'toronto',L=Number(process.argv[3]??512),n=Number(process.argv[4]??8);
const levels=(process.argv[5]??'2048,4096,8192').split(',').map(Number);
assert.ok(['paper','toronto'].includes(profile)&&Number.isInteger(L)&&L>=16&&n>=2);
assert.ok(levels.every(N=>Number.isInteger(N)&&N>2*L&&(N&(N-1))===0));
const run=createRun('h136-sh-fft',{
 parents:[verifyRun(base+'00692-h136-sh-field'),verifyRun(base+'00696-h136-phase-high')],
 operation:'Numerical Fourier-projection alternative for the unchanged positive reconstructed illumination. Keep the exact polar rule and physical moments; independently refine periodic midpoint azimuth resolution. Direct DFT primitive checks precede every worker projection. No new light, material fitting, source factor or acceptance margin.',
 parameters:{profile,L,n,levels,target:'node-89',channel:8,costIsGate:false,why:'The qualified high-degree shared integration can use a periodic FFT rather than summing every Fourier mode for every light query. Test convergence before using this adapter.'},
});

/** @param {number} N @returns {Promise<any>} */
function compute(N) {
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./harmonic-fft-worker.mjs',import.meta.url),{workerData:{profile,L,n,N}});let result,stopped=false;
  worker.on('message',m=>{
   if(stopped)return;
   try{if(m.type==='progress')run.progress('FFT-projection',String(m.message));else if(m.type==='result')result=m.value;}
   catch(error){stopped=true;worker.terminate().then(()=>reject(error),()=>reject(error));}
  });
  worker.once('error',reject);
  worker.once('exit',code=>{if(!stopped)code===0&&result?resolve(result):reject(Error(`FFT worker exit${code}, result${Boolean(result)}`));});
 });
}

try {
 const rows=[];
 for(const N of levels) {
  const {c,item}=await compute(N);
  item.azimuthChange=rows.length?item.normalized-rows.at(-1).normalized:null;
  rows.push(item);
  run.write(`fft-${N}.json.gz`,pack({L,real:c.real.map(x=>Array.from(x)),imag:c.imag.map(x=>Array.from(x)),item}));
  console.log(JSON.stringify(item));
 }
 run.write('summary.json',{rows,scope:'Independent azimuth/projection/degree convergence; no full spectral or global-cache qualification.'});
 run.finish('accepted',{cases:rows.length,profile,L});
 console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
