import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,setup,pack,verifyRun} from './common.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {compilerRow,evaluateCompilerRow} from './compiler-row.mjs';

const intervals=(process.argv[2]??'15,60,120').split(',').map(Number);
assert.ok(intervals.every(n=>Number.isInteger(n)&&n>=15));
const run=createRun('h136-compiler-l1',{
 parents:[verifyRun(base+'00667-h136-native-row'),verifyRun(base+'00669-h136-native-row')],
 operation:'Measure the current compiler L1 template and a separately split atmospheric R/M template on the same native receiver geometry and registered original4096 incoming directions. Preserve the distinction from inherited Gauss64/128 cache-free inputs. Black boundary, actual common source physics, matched registered medium; no deployed-output or complete-cache claim.',
 parameters:{profiles:['paper','toronto'],target:'node-89',bands:[3,5,8],intervals,sourceColumns:'Registered compiler sourcePathTransmittanceIntervalCount',costIsGate:false},
});
let browser,failure;
try {
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),rows=[],r=registration();
 for(const profile of ['paper','toronto'])for(const channel of [3,5,8]) {
  const f=setup(r,profile,'node-89',channel),levels=[];
  for(const n of intervals) {
   run.progress('compiler-L1',`${profile}/b${channel} ${n} intervals`);
   const sources=compilerRow(f,n),started=Date.now(),result=await page.evaluate(evaluateCompilerRow,{...sources,directions:f.g.nodes});
   assert.ok(result.scalar.every(x=>Number.isFinite(x)&&x>=0)&&result.split.flat().every(x=>Number.isFinite(x)&&x>=0));
   const splitParity=Math.max(...result.scalar.map((x,i)=>Math.abs(x-result.split[i][0]-result.split[i][1])/Math.max(Math.abs(x),1e-25)));
   assert.ok(splitParity<=1e-4,'Actual compiler scalar/split atmospheric L1 parity');
   const item={profile,channel,n,count:f.g.nodes.length,splitParity,milliseconds:Date.now()-started,renderer:result.renderer,parameters:sources.parameters};
   levels.push(item);run.write(`${profile}-b${channel}-n${n}.json.gz`,pack({...item,...result}));
   run.write(`${profile}-b${channel}-n${n}-scalar.glsl.gz`,gzipSync(Buffer.from(sources.scalar)));
   run.write(`${profile}-b${channel}-n${n}-split.glsl.gz`,gzipSync(Buffer.from(sources.split)));
   console.log(JSON.stringify(item));
  }
  rows.push({profile,channel,levels});
 }
 await browser.close();browser=null;run.write('summary.json',{rows,scope:'Actual compiler L1 input operation and split arithmetic. Differences among quadrature schemes are not by themselves physical-error estimates; no full-cache, recurrence, B1 or observer-color claim.'});
 run.finish('accepted',{fields:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
