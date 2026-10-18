import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,readRepository,verifyRun,identity,sha256,storage} from '../io/files.mjs';
import {inputs,oldMain,oldGpu,oldFine} from './control.mjs';
import {reduce} from './run.mjs';
import {qualify} from './rounding.mjs';
import {kernel} from '../distant-horizon/toronto-orders.mjs';
import {directBundle} from '../distant-horizon/toronto-direct.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';

const [own,preGpu,preRef,preFine,report]=process.argv.slice(2);assert.ok(own&&preGpu&&preRef&&preFine&&report);
const {control,parents}=inputs();for(const r of [own,preGpu,preRef,preFine,report]){parents.push(verifyRun(r));assert.equal(JSON.parse(readRepository(r+'/sealed.json').toString()).state,'accepted');}
const run=createRun('h65-probe-verify',{parents,operation:'Verify independent shader/material, complete raw batch streams, geometric controls, same-ray cache observations, exact external inputs and solver identity, seed reductions, source reuse and final image/report provenance.',parameters:{own,preGpu,preRef,preFine,report,oldGpu,oldMain,oldFine}});
let failure=null;const checks={independentBatches:0,independentChannels:0,gpuChannels:0,externalExecutions:0,externalBytes:0,rows:0,reusedChannels:0};
try{
 assert.deepEqual(JSON.parse(readRepository(own+'/control.json').toString()),control);
 const batch=JSON.parse(gunzipSync(readRepository(own+'/batches.json.gz')).toString());assert.equal(batch.length,2880);const keys=new Set();
 for(const b of batch){qualify(b.means);assert.ok(b.channel>=0&&b.channel<15&&b.group>=0&&b.group<6&&['main','control64'].includes(b.profile));assert.ok(b.batch>=0&&b.batch<(b.profile==='main'?24:8));const key=[b.channel,b.group,b.profile,b.batch].join('/');assert.ok(!keys.has(key));keys.add(key);checks.independentBatches++;}
 for(let c=0;c<15;c++){
  const generated=kernel(control.material.phaseTables[c],control.material.albedos[c]);assert.equal(gunzipSync(readRepository(own+`/shader-${c}.glsl.gz`)).toString(),generated.shader);assert.deepEqual(JSON.parse(readRepository(own+`/phase-proof-${c}.json`).toString()),generated.proof);
  assert.deepEqual(JSON.parse(gunzipSync(readRepository(own+`/batches-${c}.json.gz`)).toString()),batch.filter(b=>b.channel===c));const d=JSON.parse(readRepository(own+`/direct-${c}.json`).toString());assert.equal(d.length,6);assert.ok(d.every(x=>Number.isFinite(x.Q64)&&Number.isFinite(x.Q128)&&x.Q64>=0&&x.Q128>=0));checks.independentChannels++;
 }
 for(const t of JSON.parse(readRepository(own+'/telemetry.json').toString()).filter(x=>x.reused)){verifyRun(t.parent);assert.deepEqual(JSON.parse(readRepository(t.parent+'/control.json').toString()),control);for(const name of [`batches-${t.channel}.json.gz`,`direct-${t.channel}.json`,`shader-${t.channel}.glsl.gz`])assert.equal(identity(own+'/'+name).sha256,identity(t.parent+'/'+name).sha256);checks.reusedChannels++;}
 run.progress('independent','Verified all raw independent batches and shader identities.');
 const reduced=reduce(batch,control),analysis=JSON.parse(readRepository(report+'/analysis.json').toString());assert.equal(analysis.rows.length,6);
 for(const row of analysis.rows){const r=reduced.find(x=>x.id===row.id);assert.ok(r);assert.deepEqual(row.metrics,r.metrics);assert.deepEqual(row.integrationControl,r.integrationControl);const root=row.scene.id==='sunset'?oldGpu:preGpu,witnesses=JSON.parse(readRepository(root+'/k1/execution.json').toString()).witnesses,index=witnesses.findIndex(w=>w.scene===row.scene.id&&w.elevation===row.elevation&&w.intervals===30);assert.ok(index>=0);
  for(const k of [1,.35]){const data=Array.from({length:15},(_,c)=>JSON.parse(gunzipSync(readRepository(root+`/k${k}/channel-${c}.json.gz`)).toString()));assert.deepEqual(row.cache.find(x=>x.k===k).spectrum,data.map(c=>c.cumulative[3][index]));}
  const referenceRoot=row.scene.id==='sunset'?oldMain:preRef,ref=JSON.parse(readRepository(referenceRoot+'/summary.json').toString()).find(x=>x.id===row.id);assert.deepEqual(row.reference,ref);assert.equal(row.independentAllOverReference,row.metrics[4].color.luminanceCdPerM2/ref.color.luminanceCdPerM2-1);checks.rows++;
 }
 const preControl=JSON.parse(readRepository(preGpu+'/control.json').toString());assert.deepEqual(preControl,inputs(true).control);for(const k of [1,.35]){const execution=JSON.parse(readRepository(preGpu+`/k${k}/execution.json`).toString());assert.equal(execution.witnesses.length,6);for(let c=0;c<15;c++){const d=JSON.parse(gunzipSync(readRepository(preGpu+`/k${k}/channel-${c}.json.gz`)).toString());assert.equal(d.report.finalLiveFieldBytes,0);assert.equal(d.report.fieldLayout.widthJ,4374);assert.ok(d.cumulative.flat().every(x=>Number.isFinite(x)&&x>=0));checks.gpuChannels++;}}
 const install=JSON.parse(readRepository('scripts/libradtran/installation.json').toString());let dataHash=null;
 for(const root of [preRef,preFine]){
  const registration=JSON.parse(readRepository(root+'/registration.json').toString());assert.deepEqual(registration.control,preControl);const rows=JSON.parse(readRepository(root+'/readings.json').toString());assert.equal(rows.length,root===preRef?12:4);
  for(const reading of rows){
   const cfg=reading.configuration;assert.equal(cfg.zenith,preControl.scenes[0].zenith);assert.ok(preControl.elevations.includes(cfg.elevation));assert.equal(cfg.layers,root===preRef?256:512);assert.equal(cfg.photons,50000);
   const theta=cfg.zenith*Math.PI/180,medium={...control.medium,sourceDirection:[Math.sin(theta),0,Math.cos(theta)]},files=directBundle(medium,cfg,control.material,false);
   files.set('input.inp',String(files.get('input.inp')).replace('phi 180','phi 5').replace('mc_spherical 1D','mc_spherical 1D\nmc_backward'));
   const mp=reading.toolRoot+'/manifest.json',manifest=JSON.parse(readRepository(mp).toString());assert.equal(manifest.status,'succeeded');assert.equal(manifest.solver.sha256,install.expectedSha256);assert.equal(manifest.data.sha256,dataHash??=manifest.data.sha256);
   for(const [name,contents]of files){if(name==='case.json')continue;const original=manifest.artifacts.find(x=>x.path==='case/'+name),executed=manifest.artifacts.find(x=>x.path==='execution/'+name);assert.equal(original.sha256,sha256(contents));readRepository(reading.toolRoot+'/'+original.path,original.sha256);assert.equal(executed.sha256,sha256(name==='input.inp'?String(contents).replaceAll('@LIBRADTRAN_DATA@',install.dataDirectory):contents));readRepository(reading.toolRoot+'/'+executed.path,executed.sha256);}
   const raw=manifest.artifacts.find(x=>x.path==='execution/mc.rad.spc'),bytes=readRepository(reading.toolRoot+'/'+raw.path,raw.sha256);assert.equal(sha256(readRepository(root+`/raw-${cfg.id}-${cfg.repeat}.txt`)),raw.sha256);const spectrum=bytes.toString().trim().split(/\r?\n/).map(line=>line.trim().split(/\s+/).map(Number)[4]/1000);assert.deepEqual(spectrum,reading.spectrum);assert.deepEqual(colorimetry(spectrum,'bin-integrated'),reading.color);checks.externalExecutions++;checks.externalBytes+=manifest.artifacts.reduce((s,a)=>s+a.bytes,0);
  }
  for(const summary of JSON.parse(readRepository(root+'/summary.json').toString())){const set=rows.filter(r=>r.configuration.id===summary.id);assert.equal(set.length,4);assert.deepEqual(summary.meanSpectrum,control.channels.map((_,c)=>set.reduce((s,r)=>s+r.spectrum[c],0)/4));assert.equal(summary.luminanceHalfWidth95,halfWidth(set.map(r=>r.color.luminanceCdPerM2)));}run.progress('external','Verified '+root);
 }
 for(const name of ['comparison','spectra','orders']){const bytes=readRepository(report+'/'+name+'.png');assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');}
 run.write('verification.json',{checks,dataHash,storage:storage(),limits:'Source, reduction and execution acceptance; scientific precision/quad/source-rounding qualifications remain in the result owner.'});
}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,checks,failure:failure?String(failure):null}));if(failure)throw failure;
