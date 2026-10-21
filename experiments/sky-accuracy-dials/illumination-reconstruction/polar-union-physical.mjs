import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {availableParallelism} from 'node:os';
import {createRun,storage} from '../io/files.mjs';
import {base,read,pack,verifyRun} from './common.mjs';

const root=process.argv[2];assert.ok(root,'Pass the accepted polar-union screen root');
const parent=verifyRun(root),inputs=read(root+'/rows.json.gz'),selection=process.argv[5]??'all',selected=selection==='all'?inputs:selection==='unresolved'?inputs.filter(a=>a.protection.sun&&!a.protection.sun.passed):inputs.filter(a=>selection.split(',').includes(`${a.profile}:${a.target}:${a.channel}`)),cases=selected.map(({profile,target,channel})=>({profile,target,channel})),levels=(process.argv[3]??'2,4').split(',').map(Number);assert.ok(cases.length>0);
const transferReplay=process.argv[4];assert.ok(transferReplay,'Pass the separately verified retained transfer replay root');assert.equal(read(transferReplay+'/summary.json').root,base+'00680-h137-op-phys');
const concurrency=Number(process.argv[6]??2);assert.ok(Number.isInteger(concurrency)&&concurrency>=1&&concurrency<=availableParallelism());
assert.ok(levels.length>=2&&levels.every(n=>Number.isInteger(n)&&n>=2&&n<=64));
const run=createRun('h137-polar-phys',{
 parents:[parent,verifyRun(base+'00696-h136-phase-high'),verifyRun(transferReplay)],
 operation:'Continuous same-function source integral and covariance-preserving physical protection for the fixed exposed polar-union diagnostic. Use both the unchanged4864-node control and the new polar model, with original complete-Sun control, retained independent error batches and unchanged finite envelopes. An owned CPU worker retains the primary progress/heartbeat loop.',
 parameters:{root,cases,selection,levels,transferReplay,originalTransferMonitoringQualified:false,CPUConcurrency:concurrency,StudentFactor:2.46,allowance:.001,costIsGate:false},
});

/** @param {any} test @returns {Promise<any>} */
function compute(test) {
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./polar-union-worker.mjs',import.meta.url),{workerData:{root,test,levels}});let result,stopped=false;
  worker.on('message',m=>{
   if(stopped)return;
   try {
    if(m.type==='progress')run.progress('polar-physical',`${test.profile}/${test.target}/b${test.channel} ${m.message}`);
    else if(m.type==='level')run.write(`${test.profile}-${test.target}-b${test.channel}-n${m.value.n}.json`,m.value);
    else if(m.type==='result')result=m.value;
   }catch(error){stopped=true;worker.terminate().then(()=>reject(error),()=>reject(error));}
  });
  worker.once('error',reject);
  worker.once('exit',code=>{if(!stopped)code===0&&result?resolve(result):reject(Error(`Polar worker exit${code}, result${Boolean(result)}`));});
 });
}

try {
 const rows=[];
 for(let at=0;at<cases.length;at+=concurrency) {
  const batch=await Promise.allSettled(cases.slice(at,at+concurrency).map(test=>compute(test)));
  let failure;
  for(const result of batch) {
   if(result.status==='rejected'){failure??=result.reason;continue;}
   const row=result.value;rows.push(row);
   run.write(`${row.profile}-${row.target}-b${row.channel}-decisions.json`,row.decisions);
   console.log(JSON.stringify({profile:row.profile,target:row.target,decisions:row.decisions}));
  }
  if(failure)throw failure;
 }
 run.write('rows.json.gz',pack(rows));
 run.write('summary.json',{cases:rows.length,models:['biRaw','polarUnion'].map(name=>({name,passed:rows.filter(x=>x.decisions[name].passed).length,rejected:rows.filter(x=>x.decisions[name].rejected).length,inconclusive:rows.filter(x=>x.decisions[name].inconclusive).length})),scope:'Exposed local pure-J2 diagnostic only; no global recurrence qualification.'});
 run.finish('accepted',{cases:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
