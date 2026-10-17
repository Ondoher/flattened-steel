import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {checkedAbsolute,createRun,identity,readRepository,repositoryRoot,verifyRun} from '../io/files.mjs';
import {browserSources} from '../execution.mjs';
import {runGpu} from './host.mjs';
import {scalarFigure} from './figures.mjs';
import {basePath,jointPath,compilerPath,browserPath,loadCase,caseScore} from './diagnosis-data.mjs';

/** Run one missing factorial corner without modifying the two accepted parents.
 * @param {B1Ablation} mode @returns {Promise<string>} Accepted new run path.
 */
async function capture(mode){
 const started=performance.now(),base=loadCase(basePath),joint=loadCase(jointPath);
 const normalized=mode==='normalize40',intervals=normalized?40:60,label=normalized?'Normalized40':'Transport60';
 const original=base.control,control={...original,buildRequest:{...original.buildRequest,id:'b1-h56-'+mode+'-direct40-n4-v1',transportSpec:{...original.buildRequest.transportSpec,numerical:{...original.buildRequest.transportSpec.numerical,transportIntervalCount:intervals}}},controls:{...original.controls,transportIntervals:intervals}};
 // Reuse the exact accepted normalization source, whose relative imports have
 // the same depth in every immutable run. No new numerical transform is authored.
 const parentCompiler=identity(jointPath+'/normalized-paper-compiler.js');
 const closure=browserSources([browserPath,compilerPath]);
 const run=createRun(normalized?'h56-norm40':'h56-t60',{
  parents:[base.seal,joint.seal,parentCompiler,...closure],
  operation:'Missing corner of fixed paper 2x2 transport40/60 by original/normalized Mie factorial; preserve all40 wavelengths, all17 times, all81 directions and four cumulative orders.',
  parameters:{mode,intervals,normalized,maximumMilliseconds:30*60*1000,baselineGit:'759b6a97',invariance:'Exact J1 and viewed N1 at all40 channels. Transport count already affects incoming L1, so higher-order changes can begin at J2.'}
 });
 /** @type {B1CapturedChannel[]} */const channels=[];
 let failure=null;
 try{
  run.write('control.json',control);
  const variant=normalized?run.write('normalized-paper-compiler.js',readRepository(parentCompiler.path,parentCompiler),{parents:[parentCompiler],operation:'Byte-identical copy of accepted H55 normalized compiler at the same path depth.',parameters:{normalized:true}}):identity(compilerPath);
  const sources=closure.map(s=>s.path===compilerPath?variant:s);
  const scratch=path.join(run.scratchPath,'capture');mkdirSync(scratch);checkedAbsolute(scratch);
  const result=await runGpu({repositoryRoot,scratchDirectory:scratch,chromePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',control,sourceIdentities:sources,browserModulePath:browserPath,compilerModulePath:variant.path,timeoutMilliseconds:30*60*1000,
   readSource:async file=>{const id=sources.find(s=>s.path===file);assert.ok(id);return readRepository(file,id);},
   onProgress:async e=>{run.guard();run.progress(e.phase,e.message,e.completed,e.total);},
   onChannel:async c=>{
    assert.equal(c.channel,channels.length);const old=base.channels[c.channel],n=c.shape.rayCount;assert.deepEqual(c.shape,old.metadata.shape);assert.deepEqual(c.fieldChecks[0],old.metadata.fieldChecks[0]);assert.deepEqual(c.values.slice(0,n),old.values.slice(0,n));
    const report=/** @type {B1GpuReport} */(c.compilerReport);assert.ok(report.pureRaySpectra.length===4&&report.pureRaySpectra.every(s=>s.length===n&&s.every(v=>Number.isFinite(v)&&v>=0)));
    const stem='channel-'+String(c.channel).padStart(2,'0'),b=Buffer.alloc(c.values.length*8);c.values.forEach((v,i)=>b.writeDoubleLE(v,i*8));const spectra=run.write(stem+'.f64',b),{values,...header}=c,metadata={...header,compilerReport:report,spectra};run.write(stem+'.json',metadata);channels.push({metadata,values});
    if(channels.length%10===0){const rows=channels.map((p,i)=>({label:String(control.buildRequest.transportSpec.domains.spectrum.channels[i].centerNanometers)+'nm',baseline:base.channels[i].values[3*n+17*81],candidate:p.values[3*n+17*81]}));const image=run.write('progress-'+channels.length+'.svg',scalarFigure(rows,label+': paper-profile 0.05-degree source-facing witness','Spectral radiance W m^-2 sr^-1 nm^-1',label));run.progress('visual',image.path,channels.length,40);console.log(JSON.stringify({mode,completed:channels.length,total:40,image:image.path}));}
   }
  });
  run.write('execution.json',result);assert.ok(result.executionSucceeded,result.failure??'GPU job failed.');assert.equal(channels.length,40);
  const candidate={path:run.path,seal:identity(run.path+'/control.json'),control,channels};
  run.write('paper-scores.json',{mode,baseline:caseScore(base),candidate:caseScore(candidate),j1ExactAllChannels:true});
  run.write('verification.json',{physicalInputsFixed:true,all40Channels:true,j1ExactAllChannels:true,minimumScoreElevationDegrees:12.115117462037233,scope:'B1 measurement fit; not a new independent mathematical oracle.'});
  console.log(JSON.stringify({mode,run:run.path,rmse:caseScore(candidate).aggregateRmseMilliwatt}));
 }catch(e){failure={message:String(e),stack:e.stack};}
 run.cleanup();const seal=run.finish(failure?'failed':'accepted',{failure,mode,completedChannels:channels.length,elapsedMilliseconds:performance.now()-started});verifyRun(run.path);assert.equal(JSON.parse(readRepository(seal.path).toString()).state,'accepted',JSON.stringify(failure));return run.path;
}

const requested=process.argv[2];assert.ok(requested==='transport60'||requested==='normalize40','Select transport60 or normalize40.');
await capture(/** @type {B1Ablation} */(requested));
