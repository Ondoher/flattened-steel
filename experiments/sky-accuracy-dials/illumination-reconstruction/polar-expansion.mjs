import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {direct} from '../interior-illumination/physics.mjs';
import {base,registration,read,setup,retained,targets,channels,pack,verifyRun,identity,miePhase,rayleighPhase,dot} from './common.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from './transfer-math.mjs';
import {customAssess as localAssess} from '../reconstruction-mechanisms/custom-metrics.mjs';
import {lightBias,reference,interval} from '../reconstruction-mechanisms/metrics.mjs';
import {pairedProtection} from './protection.mjs';
import {pool} from '../reconstruction-mechanisms/decisions.mjs';

const gateRoot=process.argv[2];assert.ok(gateRoot,'Pass the completed four-case polar physical proof');
const gate=read(gateRoot+'/summary.json');assert.equal(gate.cases,4);assert.ok(gate.models.find(m=>m.name==='polarUnion'&&m.passed===4&&m.rejected===0&&m.inconclusive===0),'The fixed diagnostic must pass before this expansion');
const priorRoot=base+'00697-h137-polar-union',confirmation=base+'00658-h135-confirm',transfer=base+'00670-h137-transfer';
const cohorts=[...targets.map(target=>({target,cohort:'original'})),...['node-90','dev-2','dev-5','held-6'].map(target=>({target,cohort:'transfer'}))];
const cases=cohorts.flatMap(c=>['paper','toronto'].flatMap(profile=>channels.map(channel=>({...c,profile,channel}))));
const run=createRun('h137-polar-all',{
 parents:[verifyRun(gateRoot),verifyRun(priorRoot),verifyRun(confirmation),verifyRun(transfer)],
 operation:'Freeze the successful full128-ring polar union without further tuning, then expand over all36 original and24 exposed transfer fields. Retain unchanged64 azimuth nodes, original/prior/new-node identities and all atmosphere/reference/threshold contracts. Reuse disjoint32768-direction confirmation truth on the original cohort and8192 exposed transfer truth. Trace genuinely new nodal directions only. Strong physical admission is separate from component gains.',
 parameters:{cases,proposalRings:128,azimuthPerRing:64,originalQueries:32768,transferQueries:8192,reuseFourCaseFreshLight:true,freshUnexposed:8,costIsGate:false,physicalPrecision:'Conservative independent marginal protections first; unresolved decisions retain their status and require separately qualified precision or continuous-model reference recovery.'},
});

/** Existing widened independent marginal protection, with the correct frozen
 * reference owner for each exposed cohort. @param {any} f @param {any} row
 * @param {boolean} isTransfer @returns {any} */
function marginalSun(f,row,isTransfer){
 const ref=isTransfer?f.ref:reference(f).ref,scale=row.scale;
 const sun=read(f.parent.path).packets.find(x=>x.geometry==='sun-4096-p1'&&x.channel===f.packet.channel);assert.ok(sun);
 const value=sun.result.fine.normalized/scale,sunBias=2*Math.abs(sun.result.sums[128].normalized-sun.result.sums[64].normalized)/scale+2e-5*Math.abs(value),referenceBias=2*Math.abs(ref.quadratureChange??0)*Math.abs(ref.mean/scale),z=row.results.polarUnion;
 const widen=(xs,bias)=>{const q=interval(xs,bias),half=q.half*2.46/2.04;return {...q,half,lo:q.mean-half-bias,hi:q.mean+half+bias};};
 const control=widen(ref.batches.map(x=>value-x/scale),sunBias+referenceBias),candidate=widen(z.bins.map(x=>x.mE+x.rE),z.envelopes.m+z.envelopes.r);
 const range=x=>[x.lo<=0&&x.hi>=0?0:Math.min(Math.abs(x.lo),Math.abs(x.hi)),Math.max(Math.abs(x.lo),Math.abs(x.hi))],a=range(control),b=range(candidate),lower=b[0]-a[1],upper=b[1]-a[0];
 return {lower,upper,passed:upper<=.001,rejected:lower>.001,inconclusive:lower<=.001&&upper>.001,control,candidate,referenceBias,referenceOwner:isTransfer?'Registered broad physical reference':'Matched00613 independent references',scope:'Separate widened marginal errors; finite empirical local pure-J2 protection, not a global certificate.'};
}

let browser,failure;
try {
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),rows=[],checks=[];
 await page.evaluate(resident,{action:'init',shader:shader()});
 for(const test of cases){
  const {target,profile,channel}=test,isTransfer=test.cohort==='transfer',nodeRoot=isTransfer?transfer:base+'00654-h135-profile',queryRoot=isTransfer?transfer:confirmation;
  const r=isTransfer?read(base+'00543-h92-broad-reg/registration.json.gz'):registration(),f=setup(r,profile,target,channel),packetPath=nodeRoot+`/${profile}-${target}-b${channel}.json.gz`,parent=read(packetPath),scores=read(nodeRoot+`/${profile}-${target}-allocation.json`).scores;
  const original=isTransfer?parent.nodes:retained(profile,target,channel).x.nodes,truthPath=queryRoot+`/${profile}-${target}-b${channel}.json.gz`,truth=read(truthPath),queryPath=queryRoot+`/${profile}-${target}-queries.json.gz`,qs=read(queryPath).qs;
  assert.deepEqual(parent.physical,f.px);assert.equal(qs.length,isTransfer?8192:32768);
  const union=polarUnion(f,scores),reused=channel===8&&['dev-2','node-89'].includes(target),fresh={},timings={};
  run.progress('polar-expansion',`${profile}/${target}/b${channel} ${reused?'reuse exact new nodes':'trace new polar nodes'}`);
  if(reused){const old=read(priorRoot+`/${profile}-${target}-b${channel}.json.gz`);assert.deepEqual(old.physical,f.px);assert.deepEqual(old.parameters,union.parameters);Object.assign(fresh,old.fresh);}
  else for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){
   const result=await evaluate(page,run,f.px,union.added,Number(nv),Number(nc),`${profile}/${target}/b${channel} polar expansion`);fresh[key]=result.values;timings[key]=result.timings;
  }
  const old=assemble(union.prior,original,parent.added),next=Object.fromEntries(['n32','n64','n256'].map(key=>[key,assembleUnion(union,original[key],parent.added[key],fresh[key])]));
  const oldErrors=old.n256.map((_,i)=>lightBias(old,i)),nextErrors=next.n256.map((_,i)=>lightBias(next,i));
  for(const i of [Math.floor(union.added.length*.31),Math.floor(union.added.length*.67)]){
   const cpu=direct(f.px,union.added[i],64,256),gpu=fresh.n256[i],difference=cpu.reduce((s,x,k)=>s+Math.abs(x-gpu[k]),0),relative=difference/Math.max(cpu[0]+cpu[1],1e-25),p=f.px,kernel=p.br*Math.exp(-p.h/8000)*rayleighPhase(dot(union.added[i],f.out))+p.bm*p.ssa*Math.exp(-p.h/1200)*miePhase(p.table,dot(union.added[i],f.out)),weighted=kernel*difference*4*Math.PI/(isTransfer?Math.max(Math.abs(f.ref.mean),profile==='paper'?4.742795497816345e-14:4.888931382758012e-14):reference(f).scale);
   assert.ok(relative<=2e-5||weighted<=2e-8,'New-node hardware GPU versus independent binary64 light');checks.push({...test,i,cpu,gpu,relative,weighted});
  }
  const a=(isTransfer?customAssess:localAssess)(f,qs,original,truth.angular,{
   original:linearPredictor(f),biRaw:d=>polar2DModel(union.prior.field,d,old.n256,oldErrors),polarUnion:d=>polar2DModel(union.field,d,next.n256,nextErrors),
  },s=>run.progress('polar-expanded-assessment',s));
  const protection={midpoint:pairedProtection(a,'polarUnion'),sun:marginalSun(f,a,isTransfer)};
  rows.push({...a,cohort:test.cohort,protection,parameters:union.parameters});
  run.write(`${profile}-${target}-b${channel}.json.gz`,pack({fresh,physical:f.px,parameters:union.parameters,proof:union.proof,timings,reusedFreshParent:reused?identity(priorRoot+`/${profile}-${target}-b${channel}.json.gz`):null,parents:[identity(packetPath),identity(queryPath),identity(truthPath)]}));
  console.log(JSON.stringify({...test,ratio:a.comparisons.polarUnion.absoluteRatio,componentProtected:a.comparisons.polarUnion.protected,midpoint:protection.midpoint,sun:protection.sun}));
 }
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;
 run.write('rows.json.gz',pack(rows));run.write('checks.json',checks);
 const counts=cohorts.map(c=>({target:c.target,cohort:c.cohort,fields:rows.filter(a=>a.target===c.target).length}));
 const sunCounts={passed:rows.filter(a=>a.protection.sun.passed).length,rejected:rows.filter(a=>a.protection.sun.rejected).length,inconclusive:rows.filter(a=>a.protection.sun.inconclusive).length};
 run.write('summary.json',{cases:rows.length,counts,profiles:['original','transfer'].flatMap(cohort=>['paper','toronto'].map(profile=>({cohort,...pool(rows.filter(a=>a.cohort===cohort),profile,'polarUnion')}))),componentProtected:rows.every(a=>a.comparisons.polarUnion.protected),midpointProtected:rows.every(a=>a.protection.midpoint.passed),sunCounts,scope:'Fixed exposed polar representation expansion. Separate conservative physical protections and their unresolved decisions remain; no fresh/N4/B1/scene claim.'});
 run.finish('accepted',{cases:rows.length,sunCounts});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
