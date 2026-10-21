import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,registration,setup,pack,verifyRun} from './common.mjs';
import {partialHistories,partialHistoryValue,historyStatistics} from './partial-history.mjs';
import {partialHistoryShader,partialHistoryResident} from './partial-history-gpu.mjs';

const count=Number(process.argv[2]??131072),seed=684729241,p=setup(registration(),'paper','node-89',8).px;
assert.ok(Number.isInteger(count)&&count>=131072&&count%32===0);
const run=createRun('h138-history-gpu',{
 parents:[verifyRun(base+'00735-h138-path-proof')],
 operation:'Cache-free positive two-event physical reference for the frozen radial0-4375m pure atmospheric L2 development pilot. Draw both event positions and the incoming direction with explicitly divided physical proposal PDFs; no cache/source row, angular reconstruction or harmonic coefficient is consumed. Common histories compare128/256 Gauss extinction columns. Calibrate against independently implemented binary64 event values and retain raw contributions.',
 parameters:{profile:'paper',channel:8,wavelengthNanometers:626.3333333333334,physical:p,sourceZenithDegrees:89.5,observerDirection:[0,0,1],segmentMeters:[0,4375],count,seed,batches:32,columns:[128,256],cpuRelativeTolerance:1e-4,confidence:'Three standard errors from32 history batch means plus paired finite-column sensitivity; not deterministic enclosure',groundAlbedo:0,costIsGate:false},
});let browser,failure;
try{
 run.progress('generate-history-proposals',`${count} histories seed${seed}`);const histories=partialHistories(p,count,seed);run.write('histories.json.gz',pack({physical:p,...histories}));const calibrations=[];
 for(let j=0;j<64;j++){if(j%8===0)run.progress('independent-history-calibration',`${j}/64 positive histories`);const i=Math.floor((j+.5)*count/64),first=histories.first.slice(i*4,i*4+4),tail=histories.tail.slice(i*4,i*4+4);calibrations.push({i,first,tail,values128:partialHistoryValue(p,first,tail,128),values256:partialHistoryValue(p,first,tail,256)});}
 run.write('cpu-calibration.json',{calibrations});assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),renderer=await page.evaluate(partialHistoryResident,{action:'init',shader:partialHistoryShader()}),levels=[];
 for(const nc of [128,256]){
  const started=Date.now(),values=[],batches=[],batchSize=count/32;let ownedTextureBytes=0;
  for(let batch=0;batch<32;batch++){
   const sums=[0,0,0,0],offset=batch*batchSize;
   for(let j=0;j<batchSize;j+=2048){const from=offset+j,to=Math.min(offset+batchSize,from+2048);run.progress('cache-free-two-event',`column${nc} batch${batch+1}/32 histories${from}/${count}`);const got=await page.evaluate(partialHistoryResident,{action:'draw',p,nc,first:histories.first.slice(from*4,to*4),tail:histories.tail.slice(from*4,to*4)});assert.ok(got.values.every(x=>Number.isFinite(x)&&x>=0));ownedTextureBytes=Math.max(ownedTextureBytes,got.ownedTextureBytes);values.push(...got.values);got.values.forEach((x,i)=>sums[i%4]+=x);}
   batches.push(sums.map(x=>x/batchSize));
  }
  const stats=historyStatistics(batches),checks=calibrations.map(c=>{const cpu=c['values'+nc],gpu=values.slice(c.i*4,c.i*4+4),sum=cpu.reduce((a,b)=>a+b,0),absolute=cpu.reduce((a,x,s)=>a+Math.abs(x-gpu[s]),0);return {...c,cpu,gpu,relative:sum>1e-30?absolute/sum:absolute===0?0:Infinity};}),maximumCpuRelative=Math.max(...checks.map(c=>c.relative)),item={nc,batches,statistics:stats,calibration:checks,maximumCpuRelative,milliseconds:Date.now()-started,renderer,ownedTextureBytes};
  run.write(`histories-c${nc}.json.gz`,pack({values,item,input:identity(run.path+'/histories.json.gz')}));assert.ok(maximumCpuRelative<=1e-4,'Independent positive-history GPU/binary64 calibration unresolved');levels.push({item,values});console.log(JSON.stringify({...item,calibration:undefined,batches:undefined}));
 }
 await page.evaluate(partialHistoryResident,{action:'close'});await browser.close();browser=null;
 const paired=Array.from({length:32},(_,batch)=>levels[1].item.batches[batch].map((x,s)=>x-levels[0].item.batches[batch][s])),pairedStats=historyStatistics(paired),fine=levels[1].item.statistics,finiteSensitivity=pairedStats.mean.map((x,s)=>2*(Math.abs(x)+pairedStats.threeSE[s])),summary={physical:p,count,seed,levels:levels.map(x=>x.item),paired:pairedStats,finiteSensitivity,intervals:fine.mean.map((x,s)=>({mean:x,threeSE:fine.threeSE[s],finiteSensitivity:finiteSensitivity[s],lower:Math.max(0,x-fine.threeSE[s]-finiteSensitivity[s]),upper:x+fine.threeSE[s]+finiteSensitivity[s]})),samplingQualification:'32-batch Monte Carlo intervals with common-random finite-column sensitivity, not guaranteed physical bounds',scope:'One wavelength, partial radial pure atmospheric L2 only. No observer color, full cache, ground recurrence, N4, external solver or B1 claim.'};
 run.write('summary.json',summary);run.finish('accepted',{count,calibrationQualified:true});console.log(JSON.stringify({run:run.path,intervals:summary.intervals,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
