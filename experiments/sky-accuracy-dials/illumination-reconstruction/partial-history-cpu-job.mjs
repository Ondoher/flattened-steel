import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {base,registration,setup,pack,verifyRun} from './common.mjs';
import {partialHistories,partialHistoryValue,historyStatistics} from './partial-history.mjs';

const count=Number(process.argv[2]??131072),seed=684729241,p=setup(registration(),'paper','node-89',8).px;assert.ok(Number.isInteger(count)&&count>=131072&&count%32===0);
const run=createRun('h138-history-cpu',{
 parents:[verifyRun(base+'00735-h138-path-proof')],
 operation:'Independent binary64 cache-free two-event physical reference for the registered radial partial-L2 probe. GPU remains occupied constructing actual source rows; a measured4096-history CPU pilot takes107ms, so this bounded reference proceeds concurrently without a second GPU job. This is the same frozen unbiased physical proposal and seed, never a cache/source-field reference. Retain all positive contributions and common-random128/256 column sensitivity.',
 parameters:{profile:'paper',channel:8,physical:p,count,seed,batches:32,columns:[128,256],segmentMeters:[0,4375],observer:[0,0,1],groundAlbedo:0,arithmetic:'binary64 physical columns and event weights; explicit retained Float32 history inputs shared with subsequent GPU calibration',costIsGate:false},
});
try{
 run.progress('prepare-independent-histories',`${count} seed${seed}`);const histories=partialHistories(p,count,seed);run.write('histories.json.gz',pack({physical:p,...histories}));const levels=[];
 for(const nc of [128,256]){
  const started=Date.now(),values=[],batches=[],batchSize=count/32;
  for(let batch=0;batch<32;batch++){run.progress('binary64-two-event',`column${nc} batch${batch+1}/32`);const sum=[0,0,0,0];for(let i=batch*batchSize;i<(batch+1)*batchSize;i++){if(i%4096===0)run.progress('binary64-two-event',`column${nc} history${i}/${count}`);const got=partialHistoryValue(p,histories.first.slice(i*4,i*4+4),histories.tail.slice(i*4,i*4+4),nc);assert.ok(got.every(x=>x>=0&&Number.isFinite(x)));values.push(...got);got.forEach((x,s)=>sum[s]+=x);}batches.push(sum.map(x=>x/batchSize));}
  const item={nc,batches,statistics:historyStatistics(batches),milliseconds:Date.now()-started};run.write(`histories-c${nc}.json.gz`,pack({values,item,input:identity(run.path+'/histories.json.gz')}));levels.push(item);console.log(JSON.stringify({...item,batches:undefined}));
 }
 const paired=levels[1].batches.map((x,i)=>x.map((v,s)=>v-levels[0].batches[i][s])),pairedStatistics=historyStatistics(paired),fine=levels[1].statistics,finiteSensitivity=pairedStatistics.mean.map((x,s)=>2*(Math.abs(x)+pairedStatistics.threeSE[s])),intervals=fine.mean.map((x,s)=>({mean:x,threeSE:fine.threeSE[s],finiteSensitivity:finiteSensitivity[s],lower:Math.max(0,x-fine.threeSE[s]-finiteSensitivity[s]),upper:x+fine.threeSE[s]+finiteSensitivity[s]}));
 const summary={physical:p,count,seed,levels,pairedStatistics,finiteSensitivity,intervals,arithmetic:'Binary64 event evaluation on the retained explicitly rounded histories',samplingQualification:'Three-standard-error32-batch Monte Carlo intervals plus common-random finite-column sensitivity; not deterministic physical enclosures',scope:'One wavelength, radial0-4375m atmospheric pure-L2; no cache/reconstruction read, full radiance, external solver, image or N4/B1 qualification.'};run.write('summary.json',summary);run.finish('accepted',{count,independentCacheFree:true});console.log(JSON.stringify({run:run.path,intervals,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
