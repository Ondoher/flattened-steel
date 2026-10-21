import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {direct} from '../interior-illumination/physics.mjs';
import {base,registration,read,retained,pack,verifyRun,miePhase,rayleighPhase,dot} from './common.mjs';
import {builderGeometry} from './builder-geometry.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {sourceFrame} from '../numerics/math.js';

const profile=process.argv[2]??'toronto',r=registration(),p=r.profiles.find(p=>p.id===profile),t=r.targets.find(t=>t.id==='node-89'),config=r.configs.find(c=>c.k===.5);assert.ok(p&&t&&config);
const bands=Array.from({length:p.control.medium.rayleigh.length},(_,i)=>i);
const run=createRun('h136-input-wave',{
 parents:['00733-h138-row-frame','00720-h137-polar-qual','00705-h137-polar-all','00725-h136-source-row'].map(name=>verifyRun(base+name)),
 operation:'Prepare the complete actual15-band full-union input row from the profile/receiver constructor, independent of retained light lookup. Reuse exact compatible3/5/8 nodal evidence; trace only missing bands using the identical panel/log Gauss operation. Calibrate every band with two independent binary64 traces. Preserve registered analytic-CS fallbacks outside the measured Toronto phase/SSA range.',
 parameters:{profile,target:t.id,bands,levels:{n32:[32,128],n64:[64,128],n256:[64,256]},sourcePhaseKinds:p.control.material.phaseTables.map(table=>table?'registered-table':'analytic-CS'),calibrationRelative:2e-5,negligibleWeighted:2e-8,costIsGate:false},
});
let browser,failure;
try{
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();await page.evaluate(resident,{action:'init',shader:shader()});const rows=[];
 for(const channel of bands){
  const {f,union}=builderGeometry(p,t,channel,config),out=sourceFrame(t.point).map(a=>dot(a,t.direction)),levels={},inputTimings={};let inputParents=[];
  if([3,5,8].includes(channel)){
   const root=base+'00654-h135-profile',priorPath=root+`/${profile}-node-89-b${channel}.json.gz`,prior=read(priorPath),scores=read(root+`/${profile}-node-89-allocation.json`).scores,z=polarUnion(f,scores),freshPath=base+`00705-h137-polar-all/${profile}-node-89-b${channel}.json.gz`,fresh=read(freshPath),original=retained(profile,t.id,channel);
   assert.deepEqual(z.field.g.nodes,union.field.g.nodes);assert.deepEqual(fresh.physical,f.px);inputParents=[identity(priorPath),identity(freshPath),...original.parents];for(const key of ['n32','n64','n256'])levels[key]=assembleUnion(z,original.x.nodes[key],prior.added[key],fresh.fresh[key]);
  }else for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){const got=await evaluate(page,run,f.px,union.field.g.nodes,Number(nv),Number(nc),`${profile}/b${channel} actual builder row`);levels[key]=got.values;inputTimings[key]=got.timings;}
  const beta=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)],original=Array(f.g.count);union.entries.forEach((entry,ring)=>{if(entry.origin==='original')for(let j=0;j<64;j++)original[entry.index*64+j]=levels.n256[ring*64+j];});
  const controlScale=original.reduce((sum,L,i)=>{const mu=dot(f.g.nodes[i],out);return sum+f.g.weights[i]*(beta[0]*rayleighPhase(mu)+beta[1]*miePhase(f.px.table,mu))*(L[0]+L[1]);},0);assert.ok(controlScale>0&&Number.isFinite(controlScale));const calibration=[];
  for(const i of [Math.floor(.31*union.field.g.count),Math.floor(.67*union.field.g.count)]){run.progress('builder-L1-binary64',`${profile}/b${channel} node${i}`);const d=union.field.g.nodes[i],cpu=direct(f.px,d,64,256),gpu=levels.n256[i],difference=cpu.reduce((sum,x,s)=>sum+Math.abs(x-gpu[s]),0),relative=difference/Math.max(cpu[0]+cpu[1],1e-25),mu=dot(d,out),weighted=4*Math.PI*(beta[0]*rayleighPhase(mu)+beta[1]*miePhase(f.px.table,mu))*difference/controlScale;assert.ok(relative<=2e-5||weighted<=2e-8);calibration.push({i,cpu,gpu,relative,weighted});}
  const path=`${profile}-b${channel}-nodes.json.gz`;run.write(path,pack({levels,physical:f.px,directions:union.field.g.nodes,inputParents,inputTimings,calibration,controlScale,numericalControlDirection:out,units:'Directional pure atmospheric L1 by originating species'}));rows.push({channel,input:identity(run.path+'/'+path),controlScale,sourcePhaseKind:f.px.table?'registered-table':'analytic-CS',ssa:f.px.ssa,reused:inputParents.length>0,calibration});console.log(JSON.stringify({channel,reused:inputParents.length>0,sourcePhaseKind:rows.at(-1).sourcePhaseKind}));
 }
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;run.write('summary.json',{profile,target:t.id,bands,rows,fullSpectralInput:true,scope:'Complete actual nodal inputs only. Projection/convolution, whole-field Toronto phase truncation, own-field recurrence and observer accuracy are separately qualified.'});run.finish('accepted',{bands:bands.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
