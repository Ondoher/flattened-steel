import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createRun,storage} from '../io/files.mjs';
import {base,read,pack,verifyRun} from './common.mjs';

const root=base+'00705-h137-polar-all',parent=process.argv[2],nextOrder=Number(process.argv[3]??8),ids=(process.argv[4]??'paper:reserved-out-1:8').split(',');assert.ok(parent&&Number.isInteger(nextOrder)&&nextOrder>=8&&nextOrder<=64);
const prior=verifyRun(parent),history=read(parent+'/rows.json.gz'),cases=history.filter(a=>ids.includes([a.profile,a.target,a.channel].join(':'))).map(({profile,target,channel})=>({profile,target,channel}));assert.equal(cases.length,ids.length);
assert.equal(read(parent+'/definition.json').recipe.parameters.root,root);
const run=createRun('h137-polar-finer',{
 parents:[prior,verifyRun(root)],
 operation:'Refine only the measured numerical integration driver with one new boundary-partitioned order. Reuse every completed lower-level integral, exact nodal input, independent query-error stream, physical medium and registered common-reference protection equation. No source retrace, reference fitting, allowance change or historical artifact mutation.',
 parameters:{root,parent,cases,nextOrder,allowance:.001,costIsGate:false,CPUConcurrency:1},
});
/** @param {any} test @returns {Promise<any>} */
function compute(test){return new Promise((resolve,reject)=>{
 const worker=new Worker(new URL('./polar-refinement-worker.mjs',import.meta.url),{workerData:{root,parent,test,nextOrder}});let result,stopped=false;
 worker.on('message',m=>{if(stopped)return;try{if(m.type==='progress')run.progress('polar-integral-precision',`${test.profile}/${test.target}/b${test.channel} ${m.message}`);else if(m.type==='result')result=m.value;}catch(error){stopped=true;worker.terminate().then(()=>reject(error),()=>reject(error));}});
 worker.once('error',reject);worker.once('exit',code=>{if(!stopped)code===0&&result?resolve(result):reject(Error(`Precision worker exit${code}`));});
});}
try {
 const rows=[];
 for(const test of cases){const row=await compute(test);rows.push(row);run.write(`${test.profile}-${test.target}-b${test.channel}-n${nextOrder}.json`,row.results.at(-1));run.write(`${test.profile}-${test.target}-b${test.channel}-decisions.json`,row.decisions);console.log(JSON.stringify({...test,decisions:row.decisions}));}
 run.write('rows.json.gz',pack(rows));run.write('summary.json',{cases:rows.length,models:['biRaw','polarUnion'].map(name=>({name,passed:rows.filter(x=>x.decisions[name].passed).length,rejected:rows.filter(x=>x.decisions[name].rejected).length,inconclusive:rows.filter(x=>x.decisions[name].inconclusive).length})),scope:'Targeted numerical precision only, unchanged physical method and previous evidence retained.'});
 run.finish('accepted',{cases:rows.length,nextOrder});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
