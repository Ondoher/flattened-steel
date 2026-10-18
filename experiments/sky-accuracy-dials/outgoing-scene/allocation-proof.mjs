import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createRun,verifyRun,resolveRepository} from '../io/files.mjs';

/** Verify serialized reservation with two real concurrent worker processes. @returns {Promise<void>} */
async function main(){
 const parents=['tmp/experiments/sky-accuracy-dials/runs/00407-h62-report','tmp/experiments/sky-accuracy-dials/runs/00407-h62-twilight'].map(root=>verifyRun(root));
 const run=createRun('h62-allocation',{parents,operation:'Prove that a short exclusive allocator lock prevents a new shared-prefix collision under concurrent same-name requests; preserve the earlier distinct00407 paths unchanged.',parameters:{workers:2,historicalCollisionPreserved:true}});
 let failure=null;
 try{
 /** @returns {Promise<string>} */
 const child=()=>new Promise((resolve,reject)=>execFile(process.execPath,[resolveRepository('experiments/sky-accuracy-dials/outgoing-scene/allocation-worker.mjs'),run.path+'/definition.json'],{windowsHide:true},(error,stdout,stderr)=>error?reject(Error(String(error)+' '+stderr)):resolve(JSON.parse(stdout.trim()).run)));
 const paths=await Promise.all([child(),child()]);assert.equal(new Set(paths).size,2);const prefixes=paths.map(p=>Number(p.split('/').at(-1).slice(0,5)));assert.equal(new Set(prefixes).size,2);assert.equal(Math.abs(prefixes[0]-prefixes[1]),1);
 const seals=paths.map(p=>verifyRun(p));run.write('allocation.json',{accepted:true,paths,prefixes,seals,historicalCollision:'00407-h62-report and00407-h62-twilight retain their original distinct paths and hashes; no overwrite or rename.'});console.log(JSON.stringify({run:run.path,paths}));
 }catch(error){failure=error;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
 verifyRun(run.path);if(failure)throw failure;
}
await main();
