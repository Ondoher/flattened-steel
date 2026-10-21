import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {queries} from '../interior-illumination/proposal.mjs';
import {direct} from '../interior-illumination/physics.mjs';
import {base,read,setup,pack,verifyRun,identity,miePhase,rayleighPhase,dot} from './common.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from './transfer-math.mjs';
import {lightBias} from '../reconstruction-mechanisms/metrics.mjs';
import {pairedProtection} from './protection.mjs';

const profile='toronto',target='node-90',channel=8,N=131072,seed=684729199,root=base+'00705-h137-polar-all',priorRoot=base+'00670-h137-transfer';
const run=createRun('h137-polar-query',{
 parents:[verifyRun(root),verifyRun(priorRoot)],
 operation:'Target only the independent angular-query uncertainty of the fixed polar-union Toronto/node-90/red witness. Its initial continuous-model absolute-error envelope straddles the0.001 allowance at upper0.0010674 despite qualified quadrature. Reuse every exact nodal value, physical setting and coefficient rule; generate one disjoint131072-direction truth wave. No new physical tuple or reference/threshold fitting.',
 parameters:{profile,target,channel,N,seed,batches:32,allowance:.001,costIsGate:false,completeSunDecision:'Combine this new error stream with the separately converged unchanged model integral; do not infer a new physical decision from source-light brightness alone.'},
});
let browser,failure;
try {
 const r=read(base+'00543-h92-broad-reg/registration.json.gz'),f=setup(r,profile,target,channel),prior=read(priorRoot+`/${profile}-${target}-b${channel}.json.gz`),packetPath=root+`/${profile}-${target}-b${channel}.json.gz`,packet=read(packetPath),scores=read(priorRoot+`/${profile}-${target}-allocation.json`).scores,union=polarUnion(f,scores);
 assert.deepEqual(packet.parameters,union.parameters);assert.deepEqual(packet.physical,f.px);
 const old=assemble(union.prior,prior.nodes,prior.added),nodes=Object.fromEntries(['n32','n64','n256'].map(key=>[key,assembleUnion(union,prior.nodes[key],prior.added[key],packet.fresh[key])]));
 const oldErrors=old.n256.map((_,i)=>lightBias(old,i)),nodeErrors=nodes.n256.map((_,i)=>lightBias(nodes,i)),qs=queries(f,N,seed),angular={},timings={},checks=[];
 run.write('queries.json.gz',pack({qs,N,seed}));assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();run.write('renderer.json',await page.evaluate(resident,{action:'init',shader:shader()}));
 for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){const got=await evaluate(page,run,f.px,qs.map(q=>q.d),Number(nv),Number(nc),`${profile}/${target}/b${channel} independent polar-query precision`);angular[key]=got.values;timings[key]=got.timings;}
 const scale=read(root+'/rows.json.gz').find(a=>a.profile===profile&&a.target===target&&a.channel===channel).scale;
 for(const i of [Math.floor(.31*N),Math.floor(.67*N)]){const cpu=direct(f.px,qs[i].d,64,256),gpu=angular.n256[i],difference=cpu.reduce((s,x,k)=>s+Math.abs(x-gpu[k]),0),relative=difference/Math.max(cpu[0]+cpu[1],1e-25),p=f.px,kernel=p.br*Math.exp(-p.h/8000)*rayleighPhase(dot(qs[i].d,f.out))+p.bm*p.ssa*Math.exp(-p.h/1200)*miePhase(p.table,dot(qs[i].d,f.out)),weighted=kernel*difference/qs[i].pdf/scale;assert.ok(relative<=2e-5||weighted<=2e-8);checks.push({i,cpu,gpu,relative,weighted});}
 const a=customAssess(f,qs,prior.nodes,angular,{original:linearPredictor(f),biRaw:d=>polar2DModel(union.prior.field,d,old.n256,oldErrors),polarUnion:d=>polar2DModel(union.field,d,nodes.n256,nodeErrors)},s=>run.progress('polar-query-assessment',s));assert.equal(a.scale,scale);
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;
 run.write('light.json.gz',pack({physical:f.px,angular,timings,checks,nodeParent:identity(packetPath)}));run.write('row.json.gz',pack({...a,protection:{midpoint:pairedProtection(a,'polarUnion')},seed,nodeParent:identity(packetPath)}));
 run.write('summary.json',{profile,target,channel,N,seed,componentProtected:a.comparisons.polarUnion.protected,midpoint:pairedProtection(a,'polarUnion'),scope:'Disjoint angular-query precision only. Complete-Sun physical decision still needs the separately retained model integral and numerical envelope.'});
 run.finish('accepted',{profile,target,channel,N,seed});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
