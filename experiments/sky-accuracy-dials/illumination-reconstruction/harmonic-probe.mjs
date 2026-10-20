import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createRun,storage} from '../io/files.mjs';
import {base,read,pack,verifyRun,identity} from './common.mjs';

const L=Number(process.argv[2]??64),orders=(process.argv[3]??'2,4').split(',').map(Number),selected=(process.argv[4]??'paper,toronto').split(','),replay=process.argv.includes('--replay-685');
assert.ok(selected.every(p=>['paper','toronto'].includes(p))&&Number.isInteger(L)&&L>=16);
const run=createRun('h136-sh-field',{parents:['00676-h136-fast-op','00682-h136-gpu-cont','00687-h136-cpu-repair'].map(n=>verifyRun(base+n)).concat(replay?[identity(base+'00685-h136-sh-field/paper-n4.json.gz')]:[]),operation:'Project unchanged native illumination once and convolve with physical phase moments. An owned JavaScript worker performs synchronous CPU work while the primary event loop retains progress/heartbeat and immutable writes. Angular projection and degree errors remain separate; no physics or threshold change.',parameters:{selected,target:'node-89',channel:8,L,orders,replay,costIsGate:false,scope:'CPU numerical adapter; not a new physical source model, complete build or N4 result.'}});

/** Keep synchronous CPU work off the monitoring owner. @param {string} profile
 * @param {number} n @returns {Promise<any>} */
function compute(profile,n){return new Promise((resolve,reject)=>{
 const worker=new Worker(new URL('./harmonic-worker.mjs',import.meta.url),{workerData:{profile,L,n}});let result;
 worker.on('message',m=>{if(m.type==='progress')run.progress('harmonic-field',`${profile} n${n} ${m.message}`);else if(m.type==='result')result=m.value;});
 worker.once('error',reject);worker.once('exit',code=>{if(code===0&&result)resolve(result);else reject(Error(`Projection worker exit${code}, result${Boolean(result)}`));});
});}

try{
 const rows=[];
 for(const profile of selected){
  const results=[];let reference;
  for(const n of orders){
   run.progress('CPU-worker-start',`${profile} L${L} n${n}`);const {c,item,reference:ref}=await compute(profile,n);reference=ref;item.projectionChange=results.length?item.values.at(-1).normalized-results.at(-1).values.at(-1).normalized:null;
   if(replay){assert.ok(profile==='paper'&&L===64&&n===4);const old=read(base+'00685-h136-sh-field/paper-n4.json.gz');assert.deepEqual(c.real.map(x=>Array.from(x)),old.real);assert.deepEqual(c.imag.map(x=>Array.from(x)),old.imag);assert.deepEqual(item.values,old.item.values);item.exactNumericalReplay=true;}
   results.push(item);run.write(`${profile}-n${n}.json.gz`,pack({L,real:c.real.map(x=>Array.from(x)),imag:c.imag.map(x=>Array.from(x)),item}));console.log(JSON.stringify({profile,L,...item}));
  }
  rows.push({profile,L,reference,results});
 }
 run.write('summary.json',{rows,scope:'Projection/truncation errors separate. Worker orchestration retains the heartbeat contract. No full-cache, physical improvement, later-order or optimized timing claim.'});run.finish('accepted',{cases:rows.length,L,replay});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
