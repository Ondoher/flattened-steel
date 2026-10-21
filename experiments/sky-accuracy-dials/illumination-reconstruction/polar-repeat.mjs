import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {base,read,setup,channels,pack,verifyRun,identity,models,phases} from './common.mjs';
import {make} from '../structured-incoming/factory.mjs';
import {cells} from '../phase-cells/geometry.mjs';
import {augmented} from './repeat-refinement.mjs';
import {assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {polarUnionFromPrior,assembleUnion} from './polar-union.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from './transfer-math.mjs';
import {lightBias} from '../reconstruction-mechanisms/metrics.mjs';
import {pairedProtection} from './protection.mjs';
import {marginalSun} from './polar-marginal.mjs';
import {pool} from '../reconstruction-mechanisms/decisions.mjs';

const root=base+'00674-h137-repeat',r=read(base+'00543-h92-broad-reg/registration.json.gz'),target='node-89';
const run=createRun('h137-polar-again',{
 parents:[verifyRun(root),verifyRun(base+'00705-h137-polar-all')],
 operation:'Repeat the fixed full128-ring polar union under independent construction0 on the exposed near-Sun receiver, both profiles and all three bands. Reuse only exact construction0 original/prior values and independent query truth from00674. Generate the full proposal in that same construction, trace only genuinely new directions, and preserve original/candidate geometry identity. This does not inherit the construction1 light by index.',
 parameters:{target,profiles:['paper','toronto'],channels,construction:0,N:8192,querySeed:684729191,proposalRings:128,azimuthPerRing:64,costIsGate:false,freshUnexposed:8},
});
let browser,failure;
try {
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),rows=[];
 await page.evaluate(resident,{action:'init',shader:shader()});
 for(const profile of ['paper','toronto'])for(const channel of channels){
  const original=setup(r,profile,target,channel),g=make(original.g.config,original.t,original.px.radius,0),f={...original,g,mesh:cells(g)};f.bases=models(f);f.sourcePhases=g.nodes.map(d=>phases(f.px,d));
  const packetPath=root+`/${profile}-${target}-b${channel}.json.gz`,packet=read(packetPath),scores=read(root+`/${profile}-${target}-allocation.json`).scores,prior=augmented(f,scores,'targeted');
  assert.deepEqual(prior.parameters,packet.parameters);assert.deepEqual(f.px,packet.physical);
  const union=polarUnionFromPrior(f,prior),fresh={},timings={};
  for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){
   const got=await evaluate(page,run,f.px,union.added,Number(nv),Number(nc),`${profile}/b${channel} construction0 new polar directions`);fresh[key]=got.values;timings[key]=got.timings;
  }
  const old=assemble(prior,packet.nodes,packet.added),next=Object.fromEntries(['n32','n64','n256'].map(key=>[key,assembleUnion(union,packet.nodes[key],packet.added[key],fresh[key])]));
  const oldErrors=old.n256.map((_,i)=>lightBias(old,i)),nextErrors=next.n256.map((_,i)=>lightBias(next,i)),queryPath=root+`/${profile}-${target}-queries.json.gz`,qs=read(queryPath).qs;
  const a=customAssess(f,qs,packet.nodes,packet.angular,{original:linearPredictor(f),biRaw:d=>polar2DModel(prior.field,d,old.n256,oldErrors),polarUnion:d=>polar2DModel(union.field,d,next.n256,nextErrors)},s=>run.progress('construction0-polar-assessment',s));
  const protection={midpoint:pairedProtection(a,'polarUnion'),sun:marginalSun(f,a,f.ref)};rows.push({...a,protection,parameters:union.parameters,construction:0});
  run.write(`${profile}-${target}-b${channel}.json.gz`,pack({fresh,physical:f.px,parameters:union.parameters,proof:union.proof,timings,parents:[identity(packetPath),identity(queryPath)],construction:0}));
  console.log(JSON.stringify({profile,channel,ratio:a.comparisons.polarUnion.absoluteRatio,component:a.comparisons.polarUnion.protected,protection}));
 }
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;run.write('rows.json.gz',pack(rows));
 run.write('summary.json',{cases:rows.length,profiles:['paper','toronto'].map(profile=>pool(rows,profile,'polarUnion')),componentProtected:rows.every(a=>a.comparisons.polarUnion.protected),midpointProtected:rows.every(a=>a.protection.midpoint.passed),sunCounts:{passed:rows.filter(a=>a.protection.sun.passed).length,rejected:rows.filter(a=>a.protection.sun.rejected).length,inconclusive:rows.filter(a=>a.protection.sun.inconclusive).length},scope:'Exposed repeated physical construction; no fresh tuple, later order, whole cache or observer-color claim.'});
 run.finish('accepted',{cases:rows.length,construction:0});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
