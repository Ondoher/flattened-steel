import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {queries} from '../interior-illumination/proposal.mjs';
import {base,registration,setup,retained,channels,targets,pack,verifyRun,identity,activeTraining,querySeed} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {combinedAssess} from '../reconstruction-mechanisms/combination-math.mjs';
import {pool} from '../reconstruction-mechanisms/decisions.mjs';
import {directPhysical} from './physical-decisions.mjs';

const selected=process.argv[2]?.split(',')??targets,N=Number(process.argv[3]??8192);assert.ok(selected.every(t=>targets.includes(t)));assert.ok(N>=8192&&N%512===0);
storage();const r=registration(),run=createRun('h135-profile',{parents:[verifyRun(base+'00653-h134-recon-reg'),verifyRun(base+'00652-h133-mech-proof')],operation:'Test active-profile cached-curvature refinement plus exact source-phase amplitude cubic on disjoint new angular directions. Independently trace added nodes and direct light. Retain original/cubic/density/composed ablations, MC cross-check and separately paired continuous-L1 pure-J2 physical estimator.',parameters:{targets:selected,channels,N,seed:querySeed,extraNodes:768,costIsGate:false,physicalEstimator:'Continuous black-boundary J2 integral of cache-free direct L1; reconstruction-minus-direct paired integrands, original path MC retained separately.',scope:'No reflective ground, fresh reserved tuple, later order, sky color or paper score claim.'}});let browser,failure;
try{
 const rows=[];assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();run.write('renderer.json',await page.evaluate(resident,{action:'init',shader:shader()}));
 for(const target of selected)for(const profile of ['paper','toronto']){
  const scores=activeTraining(r,profile,target,s=>run.progress('active-curvature',s));run.write(`${profile}-${target}-allocation.json`,{scores,source:'Only this profile actual original cached nodes, channels3/5/8; no independent interior light.'});
  const qs=queries(setup(r,profile,target,3),N,querySeed);run.write(`${profile}-${target}-queries.json.gz`,pack({qs,seed:querySeed,N}));
  for(const channel of channels){
   const f=setup(r,profile,target,channel),old=retained(profile,target,channel),z=augmented(f,scores,'targeted'),angular={},added={},timings={};
   for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){
    const a=await evaluate(page,run,f.px,qs.map(q=>q.d),Number(nv),Number(nc),`${profile}/${target}/b${channel} direct`),b=await evaluate(page,run,f.px,z.added,Number(nv),Number(nc),`${profile}/${target}/b${channel} added768`);
    angular[key]=a.values;added[key]=b.values;timings[key]={direct:a.milliseconds,added:b.milliseconds,directStages:a.timings,addedStages:b.timings};
   }
   const nodes=assemble(z,old.x.nodes,added),a=combinedAssess(f,qs,old.x.nodes,angular,z.field,nodes,s=>run.progress('profile-assessment',s)),physical=directPhysical(f,qs,angular,a);
   rows.push({...a,physicalDirect:physical,parent:old.parents,newQueryParent:identity(run.path+`/${profile}-${target}-queries.json.gz`)});
   run.write(`${profile}-${target}-b${channel}.json.gz`,pack({physical:f.px,angular,added,timings,parameters:z.parameters,proof:z.proof,nodalParent:old.parents}));
   run.progress('completed-field',`${profile}/${target}/b${channel}`);console.log(JSON.stringify({profile,target,channel,combinedRatio:a.comparisons.combined.absoluteRatio,protected:a.comparisons.combined.protected,physical:{vsOriginal:physical.models.combined.vsOriginal,vsSun:physical.models.combined.vsSun},mcAgreement:physical.mcAgreement}));
  }
 }
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;
 run.write('rows.json.gz',pack(rows));const profiles=['paper','toronto'].flatMap(p=>['cubicFactored','nodal','combined'].map(n=>pool(rows,p,n)));
 run.write('summary.json',{fields:rows.length,N,profiles,pairedDirectProtection:rows.map(x=>({profile:x.profile,target:x.target,channel:x.channel,vsOriginal:x.physicalDirect.models.combined.vsOriginal,vsSun:x.physicalDirect.models.combined.vsSun,mcAgreement:x.physicalDirect.mcAgreement})),freshUnexposed:8,costIsGate:false});
 run.finish('accepted',{fields:rows.length,N,seed:querySeed,freshUnexposed:8});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
