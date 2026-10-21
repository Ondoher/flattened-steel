import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {base,registration,read,setup,retained,pack,verifyRun,identity} from './common.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from './transfer-math.mjs';
import {customAssess as localAssess} from '../reconstruction-mechanisms/custom-metrics.mjs';
import {lightBias} from '../reconstruction-mechanisms/metrics.mjs';
import {pairedProtection} from './protection.mjs';

const cases=['dev-2','node-89'].flatMap(target=>['paper','toronto'].map(profile=>({target,profile,channel:8})));
const run=createRun('h137-polar-union',{
 parents:[verifyRun(base+'00670-h137-transfer'),verifyRun(base+'00655-h135-azimuth')],
 operation:'Bounded polar-refinement diagnostic after both fixed configurations worsen complete-Sun total accuracy at Toronto/dev-2/red. Retain all original and12 added rings, add remaining physical128-proposal rings, keep64 azimuth nodes per ring and the same source-amplitude interpolation. Freeze exposed adverse/control cases before new light; reuse exact query truth, trace only genuinely new directions.',
 parameters:{cases,proposalRings:128,phaseFactor:[true,true],azimuthPerRing:64,costIsGate:false,prediction:'If remaining polar reconstruction causes the dim bias exposed by removing azimuth error, polar refinement reduces that bias without fitting phase or reference totals. Reconstruction and total protection remain separate.'},
});
let browser,failure;
try {
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),rows=[];
 await page.evaluate(resident,{action:'init',shader:shader()});
 for(const test of cases) {
  const {target,profile,channel}=test,isTransfer=target==='dev-2',root=base+(isTransfer?'00670-h137-transfer':'00654-h135-profile');
  const r=isTransfer?read(base+'00543-h92-broad-reg/registration.json.gz'):registration(),f=setup(r,profile,target,channel);
  const packetPath=root+`/${profile}-${target}-b${channel}.json.gz`,parent=read(packetPath),scores=read(root+`/${profile}-${target}-allocation.json`).scores;
  const original=isTransfer?parent.nodes:retained(profile,target,channel).x.nodes;
  const queryPath=root+`/${profile}-${target}-queries.json.gz`,qs=read(queryPath).qs;
  run.progress('polar-union-geometry',`${profile}/${target}/b${channel}`);
  const union=polarUnion(f,scores),fresh={},timings={};
  for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]) {
   const result=await evaluate(page,run,f.px,union.added,Number(nv),Number(nc),`${profile}/${target} new polar nodes`);
   fresh[key]=result.values;timings[key]=result.timings;
  }
  const old=assemble(union.prior,original,parent.added);
  const next=Object.fromEntries(['n32','n64','n256'].map(key=>[key,assembleUnion(union,original[key],parent.added[key],fresh[key])]));
  const oldErrors=old.n256.map((_,i)=>lightBias(old,i)),nextErrors=next.n256.map((_,i)=>lightBias(next,i));
  const assess=isTransfer?customAssess:localAssess;
  const assessment=assess(f,qs,original,parent.angular,{
   original:linearPredictor(f),
   biRaw:d=>polar2DModel(union.prior.field,d,old.n256,oldErrors),
   polarUnion:d=>polar2DModel(union.field,d,next.n256,nextErrors),
  },s=>run.progress('polar-union-assessment',s));
  assert.ok(assessment.comparisons.polarUnion);
  const protection={midpoint:pairedProtection(assessment,'polarUnion')};
  rows.push({...assessment,protection,parameters:union.parameters});
  run.write(`${profile}-${target}-b${channel}.json.gz`,pack({fresh,parameters:union.parameters,proof:union.proof,timings,parents:[identity(packetPath),identity(queryPath)],physical:f.px}));
  console.log(JSON.stringify({profile,target,parameters:union.parameters,comparison:assessment.comparisons.polarUnion,protection}));
 }
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;
 run.write('rows.json.gz',pack(rows));run.write('summary.json',{cases:rows.length,scope:'Bounded exposed red-band polar refinement screen. Complete-Sun physical protection requires a separately converged new model integral; no whole-profile/fresh/cache/recurrence qualification.'});
 run.finish('accepted',{cases:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
