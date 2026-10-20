import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,pack,verifyRun,miePhase,rayleighPhase,dot} from './common.mjs';
import {modelField} from './model-field.mjs';
import {fastModel} from './fast-model.mjs';
import {piecewiseQuadrature} from './piecewise-quadrature.mjs';
import {builderResident,integrationShader} from './builder-kernel.mjs';

const selected=[{profile:'paper',target:'node-89',channel:8},{profile:'toronto',target:'node-89',channel:8}],levels=[2,4],run=createRun('h136-gpu-cont',{parents:['00667-h136-native-row','00669-h136-native-row','00675-h136-fast-proof','00676-h136-fast-op'].map(n=>verifyRun(base+n)),operation:'Actual resident GPU source integration using boundary-partitioned convergent queries instead of the unqualified8192 finite row rule. Stream query/light tiles; compare independent binary64 reduction and successive angular levels on actual native-input fields. All physical inputs and reconstruction remain fixed.',parameters:{selected,levels,tile:8192,parityRelative:1e-4,convergenceRelative:1e-5,costIsGate:false,scope:'Selected complete source-operation witnesses; not all outgoing/full-cache physical qualification.'}});let browser,failure;
try{
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),rows=[];
 for(const c of selected){
  const z=modelField(c.profile,c.target,c.channel,true),model=z.models[0],sample=fastModel(model.field,model.nodes),p=z.f.px,beta=[p.br*Math.exp(-p.h/8000),p.bm*p.ssa*Math.exp(-p.h/1200)],results=[];
  for(const n of levels){
   const cpu=[0,0,0,0],gpu=[0,0,0,0],hash=createHash('sha256'),start=Date.now();let directions=[],light=[],count=0,tiles=0;
   const renderer=await page.evaluate(builderResident,{action:'init',shader:integrationShader(p)});
   const flush=async()=>{if(!light.length)return;const count=light.length/4,height=Math.ceil(count/256);while(directions.length<height*256*4){directions.push(0);light.push(0);}for(const data of [directions,light]){const f32=Float32Array.from(data);hash.update(Buffer.from(f32.buffer));}await page.evaluate(builderResident,{action:'upload',height,count,directions,light,outgoing:[...z.f.out,0],beta});const got=await page.evaluate(builderResident,{action:'draw',offset:0,count:1});for(let i=0;i<4;i++)gpu[i]+=got[i];directions=[];light=[];tiles++;run.progress('converged-GPU-source',`${c.profile}/b${c.channel} n${n} ${count} tile${tiles}`);};
   for(const q of piecewiseQuadrature(z.partition,n)){
    const v=sample(q.d),m=dot(q.d,z.f.out),pr=rayleighPhase(m)*beta[0]*q.w,pm=miePhase(p.table,m)*beta[1]*q.w;cpu[0]+=v[0]*pr;cpu[1]+=v[1]*pr;cpu[2]+=v[0]*pm;cpu[3]+=v[1]*pm;directions.push(...q.d,q.w);light.push(...v,0,0);count++;if(light.length===8192*4)await flush();
   }
   await flush();await page.evaluate(builderResident,{action:'close'});const cpuSum=cpu.reduce((s,x)=>s+x,0),gpuSum=gpu.reduce((s,x)=>s+x,0),relative=Math.abs(cpuSum-gpuSum)/Math.max(Math.abs(cpuSum),1e-25),previous=results.at(-1),change=previous?Math.abs(cpuSum-previous.cpuSum)/Math.max(Math.abs(cpuSum),1e-25):null,item={n,count,tiles,cpu,gpu,cpuSum,gpuSum,relative,change,uploadFloat32Sha256:hash.digest('hex'),milliseconds:Date.now()-start,renderer};assert.ok(relative<=1e-4,'Convergent GPU source operation disagrees with binary64');results.push(item);run.write(`${c.profile}-b${c.channel}-n${n}.json`,item);console.log(JSON.stringify({...c,...item}));
  }
  const last=results.at(-1);assert.ok(last.change<=1e-5,'Native reconstructed integral not numerically converged');rows.push({...c,results});
 }
 await browser.close();browser=null;run.write('rows.json.gz',pack(rows));run.write('summary.json',{rows,scope:'Hardware-GPU continuous source witnesses pass, with finite empirical angular convergence and independent same-function reduction. The earlier8192 whole-row rule stays unqualified for continuous accuracy; no blanket full-cache/N4 claim.'});run.finish('accepted',{cases:rows.length,levels});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
