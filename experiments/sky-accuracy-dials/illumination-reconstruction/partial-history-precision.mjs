import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {partialHistories,partialHistoryValue,historyStatistics} from './partial-history.mjs';

const root=base+'00741-h138-history-cpu',seal=verifyRun(root),previous=read(root+'/summary.json'),p=previous.physical,retained=read(root+'/histories.json.gz'),oldFine=read(root+'/histories-c256.json.gz'),{count,seed}=previous,run=createRun('h138-history-fp',{
 parents:[seal,identity(root+'/histories.json.gz'),identity(root+'/histories-c256.json.gz')],
 operation:'Measure common-history Float32 proposal-upload sensitivity and retain a fully binary64 physical reference. Reproduce the exact registered seed/proposals before and after explicit Float32 history conversion. Evaluate128/256 physical extinction columns on unrounded events; compare paired256 contributions against retained741. This diagnoses input rounding separately from Monte Carlo sampling and column quadrature without consuming a cache or fitting a candidate.',
 parameters:{count,seed,batches:32,columns:[128,256],physical:p,segmentMeters:[0,4375],arithmetic:'Binary64 unrounded positive event histories; same retained proposal stream as741',costIsGate:false},
});
try{
 run.progress('replay-history-stream',`${count} histories`);const exact=partialHistories(p,count,seed,false);assert.deepEqual(Array.from(Float32Array.from(exact.first)),retained.first);assert.deepEqual(Array.from(Float32Array.from(exact.tail)),retained.tail);const levels=[];
 for(const nc of [128,256]){
  const started=Date.now(),values=[],batches=[],batchSize=count/32;
  for(let batch=0;batch<32;batch++){run.progress('unrounded-physical-history',`column${nc} batch${batch+1}/32`);const sum=[0,0,0,0];for(let i=batch*batchSize;i<(batch+1)*batchSize;i++){if(i%4096===0)run.progress('unrounded-physical-history',`column${nc} history${i}/${count}`);const got=partialHistoryValue(p,exact.first.slice(i*4,i*4+4),exact.tail.slice(i*4,i*4+4),nc);assert.ok(got.every(x=>Number.isFinite(x)&&x>=0));values.push(...got);got.forEach((x,s)=>sum[s]+=x);}batches.push(sum.map(x=>x/batchSize));}
  const item={nc,batches,statistics:historyStatistics(batches),milliseconds:Date.now()-started};run.write(`unrounded-c${nc}.json.gz`,pack({values,item,derivation:{input:identity(root+'/histories.json.gz'),operation:'Regenerate unrounded stream with the same source/seed; Float32 replay exactly equals retained input'}}));levels.push(item);
 }
 const differences=levels[1].batches.map((x,i)=>x.map((v,s)=>v-oldFine.item.batches[i][s])),rounding=historyStatistics(differences),column=historyStatistics(levels[1].batches.map((x,i)=>x.map((v,s)=>v-levels[0].batches[i][s]))),fine=levels[1].statistics,finiteSensitivity=column.mean.map((x,s)=>2*(Math.abs(x)+column.threeSE[s])),summary={physical:p,count,seed,levels,rounding,column,finiteSensitivity,intervals:fine.mean.map((x,s)=>({mean:x,threeSE:fine.threeSE[s],finiteSensitivity:finiteSensitivity[s],lower:Math.max(0,x-fine.threeSE[s]-finiteSensitivity[s]),upper:x+fine.threeSE[s]+finiteSensitivity[s]})),scope:'Fully binary64 cache-free partial-L2 physical reference. Three-standard-error batch intervals are statistical, not guaranteed enclosures; column sensitivity remains empirical. Float32-upload sensitivity measured separately; no cache, ground, later-order, image or B1 result.'};
 run.write('summary.json',summary);run.finish('accepted',{unroundedPhysicalReference:true,inputStreamExactlyReproduced:true});console.log(JSON.stringify({run:run.path,intervals:summary.intervals,rounding,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
