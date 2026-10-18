import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,verifyRun,readRepository,identity,sha256,storage} from '../io/files.mjs';
import {directBundle} from '../distant-horizon/toronto-direct.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';
import {plan} from './geometry.mjs';

const [gpu,main,fine,report]=process.argv.slice(2);assert.ok(gpu&&main&&fine&&report);
const roots=[gpu,main,fine,report],parents=roots.map(r=>verifyRun(r)),control=JSON.parse(readRepository(gpu+'/control.json').toString()),installation=JSON.parse(readRepository('scripts/libradtran/installation.json').toString());
const checks={externalExecutions:0,externalBytes:0,gpuChannels:0,viewWitnesses:0,rawValues:0,layerCases:0};
let solverDataHash=null;
const support=plan(control);assert.equal(support.rays.length,18);assert.ok(support.queries.every(q=>q.every(Number.isFinite)&&q[3]>=0&&q[3]<8640));
for(const k of [1,.35]){
 const execution=JSON.parse(readRepository(gpu+`/k${k}/execution.json`).toString());assert.deepEqual(execution.witnesses,support.rays.map(r=>r.witness));
 for(let c=0;c<15;c++){const d=JSON.parse(gunzipSync(readRepository(gpu+`/k${k}/channel-${c}.json.gz`)).toString());assert.equal(d.channel,c);assert.equal(d.report.finalLiveFieldBytes,0);assert.equal(d.native.length,4);assert.equal(d.cumulative.length,4);for(const values of [...d.native,...d.cumulative]){assert.equal(values.length,18);assert.ok(values.every(x=>Number.isFinite(x)&&x>=0));}checks.gpuChannels++;}
 checks.viewWitnesses+=execution.witnesses.length;
}
for(const root of [main,fine]){
 const registration=JSON.parse(readRepository(root+'/registration.json').toString());assert.deepEqual(registration.control,control);
 const readings=JSON.parse(readRepository(root+'/readings.json').toString()),summaries=JSON.parse(readRepository(root+'/summary.json').toString());assert.equal(readings.length,root===main?36:12);assert.equal(summaries.length,root===main?9:3);
 for(const r of readings){
  const cfg=r.configuration,theta=cfg.zenith*Math.PI/180,medium={...control.medium,sourceDirection:[Math.sin(theta),0,Math.cos(theta)]},files=directBundle(medium,cfg,control.material,false);
  files.set('input.inp',String(files.get('input.inp')).replace('phi 180','phi 5').replace('mc_spherical 1D','mc_spherical 1D\nmc_backward'));
  const mp=r.toolRoot+'/manifest.json',manifest=JSON.parse(readRepository(mp).toString());parents.push(identity(mp));assert.equal(manifest.status,'succeeded');assert.equal(manifest.solver.sha256,installation.expectedSha256);assert.equal(manifest.data.sha256,solverDataHash??=manifest.data.sha256);
  for(const [name,contents]of files){if(name==='case.json')continue;const original=manifest.artifacts.find(x=>x.path==='case/'+name),executed=manifest.artifacts.find(x=>x.path==='execution/'+name);assert.equal(sha256(contents),original.sha256);readRepository(r.toolRoot+'/'+original.path,original.sha256);const expected=name==='input.inp'?String(contents).replaceAll('@LIBRADTRAN_DATA@',installation.dataDirectory):contents;assert.equal(sha256(expected),executed.sha256);readRepository(r.toolRoot+'/'+executed.path,executed.sha256);}
  const raw=manifest.artifacts.find(x=>x.path==='execution/mc.rad.spc'),bytes=readRepository(r.toolRoot+'/'+raw.path,raw.sha256);assert.equal(sha256(readRepository(root+`/raw-${cfg.id}-${cfg.repeat}.txt`)),raw.sha256);
  const spectrum=bytes.toString().trim().split(/\r?\n/).map(line=>line.trim().split(/\s+/).map(Number)[4]/1000);assert.deepEqual(spectrum,r.spectrum);assert.deepEqual(colorimetry(spectrum,'bin-integrated'),r.color);checks.rawValues+=spectrum.length;checks.externalBytes+=manifest.artifacts.reduce((s,a)=>s+a.bytes,0);checks.externalExecutions++;
 }
 for(const s of summaries){const set=readings.filter(r=>r.configuration.id===s.id),mean=Array.from({length:15},(_,c)=>set.reduce((a,r)=>a+r.spectrum[c],0)/4);assert.deepEqual(s.meanSpectrum,mean);assert.equal(s.luminanceHalfWidth95,halfWidth(set.map(r=>r.color.luminanceCdPerM2)));if(root===fine)checks.layerCases++;}
}
const analysis=JSON.parse(readRepository(report+'/analysis.json').toString());assert.equal(analysis.rows.length,9);assert.equal(analysis.quality.length,9);assert.equal(analysis.orderBudget.length,9);
for(const row of analysis.rows)for(let j=0;j<2;j++){
 const index=support.rays.findIndex(r=>r.witness.scene===row.scene.id&&r.witness.elevation===row.elevation&&r.witness.intervals===30);
 const spectrum=Array.from({length:15},(_,c)=>JSON.parse(gunzipSync(readRepository(gpu+`/k${[1,.35][j]}/channel-${c}.json.gz`)).toString()).cumulative[3][index]);assert.deepEqual(row.sets[j].spectrum,spectrum);assert.equal(row.relativeY[j],row.sets[j].color.luminanceCdPerM2/row.reference.color.luminanceCdPerM2-1);
}
const run=createRun('h64-dusk-verify',{parents,operation:'Independent reconstruction of external executed decks/optical bytes and unit conversion, seed statistics, GPU witness support and report input spectra; strict immutable run verification.',parameters:{gpu,main,fine,report}});let failure=null;try{run.write('verification.json',{checks,solverDataHash,storage:storage(),limits:'Scientific sampling precision is reported separately; execution and provenance acceptance do not make every ray converged.'});}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,checks}));if(failure)throw failure;
