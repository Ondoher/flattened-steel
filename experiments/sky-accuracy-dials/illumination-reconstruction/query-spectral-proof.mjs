import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,read,pack,verifyRun,registration,setup,retained} from './common.mjs';
import {polarNativeField} from './polar-native-field.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {queryContext,plannedModel} from './query-plan.mjs';
import {ringQueries} from './query-ring-plan.mjs';
import {spectralQueryShader,spectralFourierShader,spectralQueryPacket,spectralQueryResident} from './query-spectral-gpu.mjs';
import {openBinaryProjection} from './query-binary.mjs';
import {projectionGrid} from './harmonic-grid.mjs';
import {gauss} from '../interior-illumination/physics.mjs';

const L=128,indices=[0,311,933],run=createRun('h136-spec-proof',{
 parents:['00730-h136-bin-project','00727-h136-query-dft','00725-h136-source-row','00705-h137-polar-all'].map(name=>verifyRun(base+name)),
 operation:'Validate shared-geometry multi-wavelength hardware interpolation and256-query partial Fourier sums against independent binary64 on fixed actual projection rings. Cover all15 paper bands and three independently tabulated Toronto bands, with distinct-band analytic constant-radiance controls. No new light, physical gain, complete projection or higher-order claim.',
 parameters:{L,n:4,indices,profiles:{paper:15,toronto:[3,5,8]},partialQueries:256,absoluteErrorOverAzimuthLightMass:1e-4,costIsGate:false},
});
let browser,bridge,failure;
try{
 assertIdleGpu(run.path);bridge=await openBinaryProjection();browser=await launch(run);const page=await browser.newPage();await page.goto(bridge.origin+'/');const renderer=await page.evaluate(spectralQueryResident,{action:'init',L,queryShader:spectralQueryShader(),fourierShader:spectralFourierShader()}),rows=[],r=registration();let peakBytes=0;
 for(const profile of ['paper','toronto']){
  const fields=[],nodes=[],inputs=[],bands=profile==='paper'?Array.from({length:15},(_,i)=>i):[3,5,8];
  for(const channel of bands){
   if(profile==='paper'){const item=read(base+'00725-h136-source-row/summary.json').rows.find(row=>row.channel===channel),packet=read(item.input.path),{union}=polarNativeField(channel);assert.deepEqual(packet.physical,union.field.px);assert.deepEqual(packet.directions,union.field.g.nodes);fields.push(union.field);nodes.push(packet.levels.n256);inputs.push(item.input);}
   else{const f=setup(r,profile,'node-89',channel),root=base+'00654-h135-profile',prior=read(root+`/${profile}-node-89-b${channel}.json.gz`),scores=read(root+`/${profile}-node-89-allocation.json`).scores,union=polarUnion(f,scores),freshPath=base+`00705-h137-polar-all/${profile}-node-89-b${channel}.json.gz`,fresh=read(freshPath),original=retained(profile,'node-89',channel).x.nodes;assert.deepEqual(fresh.physical,f.px);fields.push(union.field);nodes.push(assembleUnion(union,original.n256,prior.added.n256,fresh.fresh.n256));inputs.push(identity(freshPath));}
  }
  fields.forEach(f=>{assert.deepEqual(f.g.nodes,fields[0].g.nodes);assert.deepEqual(f.mesh.frame,fields[0].mesh.frame);});const context=queryContext(fields[0]),models=fields.map((f,b)=>plannedModel(f,nodes[b])),constants=fields.map((f,b)=>plannedModel(f,nodes[b].map(()=>[2+.1*b,3+.2*b]),[false,false]));let index=0;
  for(const row of projectionGrid(fields[0],L,4)){
   const current=index++;if(!indices.includes(current))continue;run.progress('spectral-primitive',`${profile} latitude${current}`);const prepare=ringQueries(fields[0],context,row.mu),plans=[],quadrature=[];
   for(const arc of row.arcs){const q=gauss(arc.n);for(let j=0;j<q.nodes.length;j++){const phi=arc.a+(arc.b-arc.a)*q.nodes[j];plans.push(prepare(phi));quadrature.push(phi,(arc.b-arc.a)*q.weights[j],0,0);}}
   const cpu=fields.map(()=>new Float64Array((L+1)*4)),mass=fields.map(()=>0);
   for(let i=0;i<plans.length;i++){
    const v=models.map(model=>model.evaluate(plans[i])),phi=quadrature[i*4],weight=quadrature[i*4+1];v.forEach((x,b)=>mass[b]+=weight*(x[0]+x[1]));
    for(let m=0;m<=L;m++){const c=Math.cos(m*phi)*weight,s=-Math.sin(m*phi)*weight;for(let b=0;b<fields.length;b++){cpu[b][m*4]+=v[b][0]*c;cpu[b][m*4+1]+=v[b][0]*s;cpu[b][m*4+2]+=v[b][1]*c;cpu[b][m*4+3]+=v[b][1]*s;}}
   }
   const errors=[],started=Date.now();
   for(const raw of [false,true]){
    const packet=spectralQueryPacket(fields,raw?constants:models,plans,quadrature,raw?[false,false]:[true,true]);bridge.state.input=Buffer.from(packet.data.buffer);const {data,...meta}=packet,got=await page.evaluate(spectralQueryResident,{...meta,url:bridge.state.url});peakBytes=Math.max(peakBytes,got.bytes);
    for(let b=0;b<fields.length;b++){
     let maximum=0;for(let m=0;m<=L;m++)for(let k=0;k<4;k++){
      let value=0;for(let part=0;part<got.chunks;part++)value+=got.values[((b*got.chunks+part)*(L+1)+m)*4+k];assert.ok(Number.isFinite(value));const expected=raw?(m===0&&k%2===0?(k===0?2+.1*b:3+.2*b)*2*Math.PI:0):cpu[b][m*4+k],scale=raw?(5+.3*b)*2*Math.PI:Math.max(mass[b],1e-25);maximum=Math.max(maximum,Math.abs(value-expected)/scale);
     }
     assert.ok(maximum<=1e-4,'Spectral band/partial Fourier mismatch');errors.push({channel:bands[b],raw,maximum});
    }
   }
   rows.push({profile,index:current,mu:row.mu,queries:plans.length,bands,inputs,milliseconds:Date.now()-started,errors});console.log(JSON.stringify({profile,index:current,maximum:Math.max(...errors.map(e=>e.maximum))}));
  }
 }
 await page.evaluate(spectralQueryResident,{action:'close'});await browser.close();browser=null;await bridge.close();bridge=null;run.write('rows.json.gz',pack(rows));run.write('summary.json',{rows:rows.map(({inputs,errors,...row})=>({...row,maximum:Math.max(...errors.map(e=>e.maximum))})),peakOwnedTextureBytes:peakBytes,renderer,scope:'Selected same-input multi-band implementation proof, including active Toronto phase tables; not complete projection or physical/recurrence qualification.'});run.finish('accepted',{rings:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);await bridge?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
