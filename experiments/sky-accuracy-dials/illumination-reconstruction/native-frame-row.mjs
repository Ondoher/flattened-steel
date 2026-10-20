import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {physical} from '../interior-illumination/physics.mjs';
import {base,read,registration,setup,pack,verifyRun,phases,miePhase,rayleighPhase,dot} from './common.mjs';
import {augmented} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {fastModel} from './fast-model.mjs';
import {outgoingPhysical} from './outgoing-frame.mjs';
import {builderResident,integrationShader} from './builder-kernel.mjs';

const run=createRun('h136-frame-row',{parents:['00667-h136-native-row','00669-h136-native-row','00675-h136-fast-proof'].map(n=>verifyRun(base+n)),operation:'Correct explicit production W27 cube -> world -> receiver-local direction mapping in actual native-input spectral row. Reuse all native nodal data/all15-band allocations. Earlier GPU parity evidence remains valid for its stated vectors but its cube-index interpretation was incomplete; no old artifact is changed.',parameters:{profiles:['paper','toronto'],bands:15,outgoing:4374,quadrature:'Same finite8192 cloud for exact CPU/GPU frame parity, continuous accuracy separate.',costIsGate:false}});let browser,failure;
try{
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),rows=[],r=registration();
 for(const profile of ['paper','toronto']){
  const root=base+(profile==='paper'?'00667-h136-native-row':'00669-h136-native-row'),first=setup(r,profile,'node-89',3),scores=read(root+'/allocation.json').scores,qs=read(base+`00654-h135-profile/${profile}-node-89-queries.json.gz`).qs,cube=first.p.control.request.transportSpec.domains.outgoing.unitVectors,outgoing=[...cube.map(v=>outgoingPhysical(v,first.t.point)),first.out];
  run.write(`${profile}-frame.json`,{cube,outgoing,source:[0,0,1],receiver:first.t.point,physicalProbe:first.out,identity:'Explicit compiler non-Fibonacci productionFrame then receiver sourceFrame; no direction-indexed copying.'});
  for(let channel=0;channel<15;channel++){
   const f={...first,packet:{...first.packet,channel}};f.px=physical(f);f.sourcePhases=f.g.nodes.map(d=>phases(f.px,d));const old=read(root+`/original-${channel}.json.gz`).values[128],added=read(root+`/row-${channel}.json.gz`).added[128],z=augmented(f,scores,'targeted'),nodes=z.entries.flatMap(e=>e.old?old.slice(e.index*64,(e.index+1)*64):added.slice(e.index*64,(e.index+1)*64)),sample=fastModel(z.field,nodes),samples=qs.map(q=>sample(q.d)),directions=qs.flatMap(q=>[...q.d,1/q.pdf/qs.length]),light=samples.flatMap(v=>[...v,0,0]),p=f.px,beta=[p.br*Math.exp(-p.h/8000),p.bm*p.ssa*Math.exp(-p.h/1200)],started=Date.now(),renderer=await page.evaluate(builderResident,{action:'init',shader:integrationShader(p)});
   await page.evaluate(builderResident,{action:'upload',height:Math.ceil(qs.length/256),count:qs.length,directions,light,outgoing:outgoing.flatMap(d=>[...d,0]),beta});const values=[];
   for(let i=0;i<outgoing.length;i+=64){run.progress('frame-correct-J2',`${profile}/b${channel} ${i}/${outgoing.length}`);values.push(...await page.evaluate(builderResident,{action:'draw',offset:i,count:Math.min(64,outgoing.length-i)}));}await page.evaluate(builderResident,{action:'close'});
   const checks=[];for(const j of [0,Math.floor(cube.length/2),cube.length]){const cpu=[0,0,0,0];for(let i=0;i<qs.length;i++){const q=qs[i],m=dot(q.d,outgoing[j]),pr=rayleighPhase(m)*beta[0]/q.pdf/qs.length,pm=miePhase(p.table,m)*beta[1]/q.pdf/qs.length;cpu[0]+=samples[i][0]*pr;cpu[1]+=samples[i][1]*pr;cpu[2]+=samples[i][0]*pm;cpu[3]+=samples[i][1]*pm;}const gpu=values.slice(4*j,4*j+4),relative=Math.max(...cpu.map((v,i)=>Math.abs(v-gpu[i])/Math.max(Math.abs(v),1e-25)));checks.push({j,cubeVector:j<cube.length?cube[j]:null,physical:outgoing[j],cpu,gpu,relative});assert.ok(relative<=1e-4,'Frame-correct native GPU parity');}
   const row={profile,channel,checks,milliseconds:Date.now()-started,renderer};rows.push(row);run.write(`${profile}-row-${channel}.json.gz`,pack({values,checks}));console.log(JSON.stringify({profile,channel,maxRelative:Math.max(...checks.map(x=>x.relative))}));
  }
 }
 await browser.close();browser=null;run.write('summary.json',{rows,scope:'30 full spectral localJ2 rows, explicit production direction frames, finite-quadrature parity only.'});run.finish('accepted',{rows:rows.length,frameCorrect:true});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
