import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {resident} from '../interior-illumination/gpu.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {variableHeightLight} from './variable-height-l1.mjs';
import {stableVariableHeightShader} from './variable-height-stable.mjs';
import {pairedPhysicalValues} from './partial-paired-reference.mjs';

const root=base+'00751-h138-paired-cpu',summary=read(root+'/summary.json'),queries=read(root+'/queries.json.gz'),cpu=read(root+'/light-v64-c256.json.gz').light,p=summary.physical,run=createRun('h138-log1p-gpu',{
 parents:[verifyRun(root),verifyRun(base+'00761-h138-height-gpu'),identity(root+'/queries.json.gz'),identity(root+'/light-v64-c256.json.gz')],operation:'Repair only the diagnosed variable-height GPU direct-L1 short-branch arithmetic. Original761 misses its1e-4 relative point gate at one of16384 queries, height0.1205m, while weighted mean absolute error is2.86e-7. Use stable degree-six log1p/expm1 below1/16 and the same original formulas elsewhere. Re-evaluate all frozen queries against binary6464/256 and preserve the original failed calibration. This is a numerical backend repair, not a change to cached physical fields or reference751.',
 parameters:{count:queries.count,seed:queries.seed,nv:64,nc:256,pointRelativeTolerance:1e-4,weightedMeanAbsoluteTolerance:2e-5,smallArgumentThreshold:1/16,seriesDegree:6,channel:8,costIsGate:false},
});let browser,failure;
try{
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),renderer=await page.evaluate(resident,{action:'init',shader:stableVariableHeightShader()}),got=await variableHeightLight(page,run,p,queries.queries,64,256);await page.evaluate(resident,{action:'close'});await browser.close();browser=null;run.write('light.json.gz',pack(got));const physicalGpu=pairedPhysicalValues(p,queries,got.values),physicalCpu=pairedPhysicalValues(p,queries,cpu),checks=cpu.map((v,i)=>{const absolute=v.reduce((a,x,s)=>a+Math.abs(x-got.values[i][s]),0),scale=v[0]+v[1];return {i,relative:scale>1e-25?absolute/scale:absolute===0?0:Infinity,absolute};}),meanCpu=physicalCpu.reduce((sum,v)=>sum+v[0]+v[1],0)/queries.count,weightedMeanAbsolute=physicalCpu.reduce((sum,v,i)=>sum+v.reduce((a,x,s)=>a+Math.abs(x-physicalGpu[i][s]),0),0)/queries.count/meanCpu,maximumRelative=Math.max(...checks.map(x=>x.relative)),qualified=maximumRelative<=1e-4&&weightedMeanAbsolute<=2e-5;
 run.write('checks.json.gz',pack(checks));run.write('summary.json',{qualified,maximumRelative,weightedMeanAbsolute,renderer,milliseconds:got.milliseconds,count:queries.count,repairedWitness:checks.find(x=>x.i===5014),scope:'Same-query GPU/binary64 arithmetic repair only; original761 is preserved. No candidate physical, global cache, higher-order, B1 or image qualification.'});run.finish('accepted',{qualified});console.log(JSON.stringify({run:run.path,qualified,maximumRelative,weightedMeanAbsolute,repairedWitness:checks.find(x=>x.i===5014),storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
