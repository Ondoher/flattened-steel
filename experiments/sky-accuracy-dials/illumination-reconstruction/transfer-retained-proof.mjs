import assert from 'node:assert/strict';
import {createRun,storage,listFiles,readRepository,identity,sha256} from '../io/files.mjs';
import {base,read,pack,verifyRun,setup} from './common.mjs';
import {interval} from '../reconstruction-mechanisms/metrics.mjs';
import {absoluteChange} from './physical-decisions.mjs';

const root=base+'00680-h137-op-phys',seal=read(root+'/sealed.json'),events=readRepository(root+'/progress.jsonl').toString().trim().split('\n').map(line=>JSON.parse(line));
const gaps=events.slice(1).map((event,i)=>({milliseconds:Date.parse(event.timestamp)-Date.parse(events[i].timestamp),before:events[i],after:event})).filter(x=>x.milliseconds>35000);
assert.equal(seal.state,'accepted');assert.deepEqual(seal.sourceFailures,[]);assert.ok(gaps.length>0);
assert.ok(seal.cleanup.absent&&!seal.heartbeatFailure);
const run=createRun('h137-xfer-replay',{
 parents:[identity(root+'/sealed.json'),verifyRun(base+'00670-h137-transfer'),verifyRun(base+'00675-h136-fast-proof')],
 operation:'Authenticate every retained transfer artifact and replay all24 physical decision calculations from the unchanged independent query-error bins, original complete-Sun outputs and stored continuous model integrals. Preserve the original56.676s monitoring failure; do not rerun or relabel its historical integration. The new proof qualifies retained identities and arithmetic, not the original monitoring or a fresh angular integration.',
 parameters:{root,allowance:.001,StudentFactor:2.46,monitorLimitMilliseconds:35000,costIsGate:false},
});
try {
 const inventory=[root+'/sealed.json'];
 for(const artifact of seal.artifacts){readRepository(artifact.path,artifact);assert.ok(artifact.derivation.operation&&Array.isArray(artifact.derivation.parents));inventory.push(artifact.path);}
 assert.deepEqual(listFiles(root),inventory.sort());assert.equal(events.at(-1).state,seal.state);
 const changedSources=[];
 for(const source of seal.sources){
  let bytes=readRepository(source.path);
  if(sha256(bytes)!==source.sha256){
   assert.equal(source.path,'experiments/sky-accuracy-dials/io/files.mjs');
   bytes=Buffer.from(bytes.toString().replace('// H136/H137 numerical integration and polar transfer diagnostics:1664MiB under standing owner budget-decision authority.','// H135 independent confirmation and builder evidence:1536MiB under standing owner budget-decision authority.').replace('const retainedLimit = 1664 * MiB;','const retainedLimit = 1536 * MiB;'));
   assert.equal(sha256(bytes),source.sha256);assert.equal(bytes.length,source.byteLength);
   run.write('original-files.mjs',bytes);changedSources.push({source,change:'Post-terminal disk allowance1536-to1664 only; original bytes exactly reconstructed and hash-verified.'});
  }
 }
 for(const name of ['transfer-operator.mjs','fast-model.mjs','piecewise-quadrature.mjs','physical-decisions.mjs']){
  const path='experiments/sky-accuracy-dials/illumination-reconstruction/'+name,source=seal.sources.find(s=>s.path===path);assert.ok(source);run.write('source-'+name,readRepository(path,source));
 }
 const old=read(root+'/rows.json.gz'),inputs=read(base+'00670-h137-transfer/rows.json.gz'),registration=read(base+'00543-h92-broad-reg/registration.json.gz'),rows=[];
 assert.equal(old.length,24);assert.equal(new Set(old.map(a=>[a.profile,a.target,a.channel].join('/'))).size,24);
 for(const a of old){
  run.progress('retained-decision-replay',`${a.profile}/${a.target}/b${a.channel}`);
  const input=inputs.find(x=>x.profile===a.profile&&x.target===a.target&&x.channel===a.channel);assert.ok(input);assert.equal(input.scale,a.scale);
  const f=setup(registration,a.profile,a.target,a.channel),sun=read(f.parent.path).packets.find(x=>x.geometry==='sun-4096-p1'&&x.channel===a.channel);
  const control={value:sun.result.fine.normalized/a.scale,bias:2*Math.abs(sun.result.sums[128].normalized-sun.result.sums[64].normalized)/a.scale+2e-5*Math.abs(sun.result.fine.normalized/a.scale)};
  for(const level of a.levels)assert.deepEqual(level,read(root+`/${a.profile}-${a.target}-b${a.channel}-n${level.n}.json`));
  const last=a.levels.at(-1),decisions={};
  for(const name of ['biRaw','biDense']){
   const z=input.results[name],e=interval(z.bins.map(b=>b.mE+b.rE),z.envelopes.m+z.envelopes.r),half=e.half*2.46/2.04,error={...e,half,lo:e.mean-half-e.bias,hi:e.mean+half+e.bias};
   const value=last.sums[name].reduce((s,x)=>s+x,0)/a.scale;assert.equal(value,last.normalized[name]);
   const change=Math.abs(value-a.levels.at(-2).normalized[name]);assert.equal(change,last.change[name]);
   const quadBias=2*change+2e-12,delta={lo:control.value-value-control.bias-quadBias,hi:control.value-value+control.bias+quadBias},gain=absoluteChange(error,delta),lower=-gain.upper,upper=-gain.lower;
   decisions[name]={lower,upper,passed:upper<=.001,rejected:lower>.001,inconclusive:lower<=.001&&upper>.001,error,control,value,quadBias,quadraturePrecision:quadBias<=1e-5};
   assert.deepEqual(decisions[name],a.decisions[name]);assert.ok(decisions[name].quadraturePrecision);
  }
  assert.deepEqual(decisions,read(root+`/${a.profile}-${a.target}-b${a.channel}-decision.json`));rows.push({...a,decisions});
 }
 const counts=['biRaw','biDense'].map(name=>({name,passed:rows.filter(a=>a.decisions[name].passed).length,rejected:rows.filter(a=>a.decisions[name].rejected).length,inconclusive:rows.filter(a=>a.decisions[name].inconclusive).length}));assert.deepEqual(counts,read(root+'/summary.json').models);
 run.write('rows.json.gz',pack(rows));run.write('monitoring-qualification.json',{root,gaps,changedSources,artifactsVerified:seal.artifacts.length,sourceIdentitiesVerified:seal.sources.length,originalVerifierPassed:false,scope:'Retained-data and arithmetic recovery only. The original integration has not been rerun and its heartbeat failure remains.'});
 run.write('summary.json',{root,cases:rows.length,counts,originalVerifierPassed:false,maximumOriginalHeartbeatGap:Math.max(...gaps.map(g=>g.milliseconds)),scope:'Authenticated retained numerical evidence, exact decision replay; original monitoring remains unqualified.'});
 run.finish('accepted',{cases:rows.length,counts});console.log(JSON.stringify({run:run.path,counts,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
