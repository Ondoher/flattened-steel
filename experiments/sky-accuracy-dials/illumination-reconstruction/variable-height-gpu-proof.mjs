import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {resident} from '../interior-illumination/gpu.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {variableHeightShader,variableHeightLight} from './variable-height-l1.mjs';
import {pairedPhysicalValues} from './partial-paired-reference.mjs';

const root=base+'00751-h138-paired-cpu',seal=verifyRun(root),summary=read(root+'/summary.json'),queries=read(root+'/queries.json.gz'),cpu=read(root+'/light-v64-c256.json.gz').light,p=summary.physical,run=createRun('h138-height-gpu',{
 parents:[seal,identity(root+'/queries.json.gz'),identity(root+'/light-v64-c256.json.gz')],operation:'Calibrate the variable-height cache-free direct-L1 hardware adapter on every already frozen paired-reference query. The same independent physical integration uses per-query actual altitude instead of a shared uniform altitude; analytic CS is evaluated from the physical Sun angle. Compare every Rayleigh/Mie input with retained independent binary6464/256 values and propagate absolute differences into partial-path species tallies. No reference query is selected by observed error and no cache field replaces light.',
 parameters:{count:queries.count,seed:queries.seed,nv:64,nc:256,pointRelativeTolerance:1e-4,weightedMeanAbsoluteTolerance:2e-5,channel:8,costIsGate:false},
});let browser,failure;
try{
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),renderer=await page.evaluate(resident,{action:'init',shader:variableHeightShader()}),got=await variableHeightLight(page,run,p,queries.queries,64,256);await page.evaluate(resident,{action:'close'});await browser.close();browser=null;run.write('light.json.gz',pack(got));const physicalGpu=pairedPhysicalValues(p,queries,got.values),physicalCpu=pairedPhysicalValues(p,queries,cpu),checks=cpu.map((v,i)=>{const absolute=v.reduce((a,x,s)=>a+Math.abs(x-got.values[i][s]),0),scale=v[0]+v[1];return {i,relative:scale>1e-25?absolute/scale:absolute===0?0:Infinity,absolute};}),meanCpu=physicalCpu.reduce((sum,v)=>sum+v[0]+v[1],0)/queries.count,weightedMeanAbsolute=physicalCpu.reduce((sum,v,i)=>sum+v.reduce((a,x,s)=>a+Math.abs(x-physicalGpu[i][s]),0),0)/queries.count/meanCpu,maximumRelative=Math.max(...checks.map(x=>x.relative)),qualified=maximumRelative<=1e-4&&weightedMeanAbsolute<=2e-5;
 run.write('checks.json.gz',pack(checks));run.write('summary.json',{qualified,maximumRelative,weightedMeanAbsolute,renderer,milliseconds:got.milliseconds,count:queries.count,scope:'Same-query physical-L1 GPU/binary64 calibration, paper band8 on the registered short-path query set. No candidate physical accuracy, full cache, later-order, external solver, B1 or image claim.'});run.finish('accepted',{qualified});console.log(JSON.stringify({run:run.path,qualified,maximumRelative,weightedMeanAbsolute,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
