import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,registration,read,setup,retained,verifyRun} from './common.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {queryContext,plannedModel} from './query-plan.mjs';
import {ringQueries} from './query-ring-plan.mjs';
import {queryUpload,queryShader,queryResident} from './query-plan-gpu.mjs';
import {fourierShader,fourierResident} from './query-fourier-gpu.mjs';
import {projectionGrid} from './harmonic-grid.mjs';
import {gauss} from '../interior-illumination/physics.mjs';

const L=128,cases=['node-89','dev-2'].flatMap(target=>['paper','toronto'].map(profile=>({target,profile,channel:8})));
const prerequisite=process.argv[2];assert.ok(prerequisite,'Qualified prepared-query hardware proof required');
const run=createRun('h136-query-dft',{
 parents:[verifyRun(prerequisite),verifyRun(base+'00724-h136-ring-plan'),verifyRun(base+'00720-h137-polar-qual')],
 operation:'Reduce the unchanged nonuniform quadrature with a resident negative-exponent Fourier kernel after prepared hardware interpolation. Compare every mode with independent binary64 point evaluation and Fourier summation; include analytic constant-radiance closure. This primitive permits a complete operator proof, not physical/global qualification.',
 parameters:{cases,L,n:4,latitudeStride:311,allFourierModes:true,absoluteErrorOverAzimuthMass:1e-4,costIsGate:false},
});
let browser,failure;
try{
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),renderer=await page.evaluate(queryResident,{action:'init',shader:queryShader()});await page.evaluate(fourierResident,{action:'init',L,shader:fourierShader()});const rows=[];
 for(const test of cases){
  const {target,profile,channel}=test,isTransfer=target==='dev-2',r=isTransfer?read(base+'00543-h92-broad-reg/registration.json.gz'):registration(),priorRoot=base+(isTransfer?'00670-h137-transfer':'00654-h135-profile'),f=setup(r,profile,target,channel),p=read(priorRoot+`/${profile}-${target}-b${channel}.json.gz`),scores=read(priorRoot+`/${profile}-${target}-allocation.json`).scores,union=polarUnion(f,scores),original=isTransfer?p.nodes:retained(profile,target,channel).x.nodes,fresh=read(base+`00705-h137-polar-all/${profile}-${target}-b${channel}.json.gz`).fresh,nodes=assembleUnion(union,original.n256,p.added.n256,fresh.n256),context=queryContext(union.field),model=plannedModel(union.field,nodes),constant=plannedModel(union.field,nodes.map(()=>[2,3]),[false,false]);let latitudeIndex=0;
  for(const row of projectionGrid(union.field,L,4)){
   const index=latitudeIndex++;if(index%311!==0)continue;run.progress('query-Fourier-parity',`${profile}/${target} latitude${index}`);const prepare=ringQueries(union.field,context,row.mu),plans=[],quadrature=[];
   for(const arc of row.arcs){const g=gauss(arc.n);for(let i=0;i<g.nodes.length;i++){const phi=arc.a+(arc.b-arc.a)*g.nodes[i],weight=(arc.b-arc.a)*g.weights[i];plans.push(prepare(phi));quadrature.push(phi,weight,0,0);}}
   const cpu=new Float64Array((L+1)*4);let mass=0;
   for(let i=0;i<plans.length;i++){const v=model.evaluate(plans[i]),phi=quadrature[4*i],weight=quadrature[4*i+1];mass+=weight*(v[0]+v[1]);for(let m=0;m<=L;m++){const c=Math.cos(m*phi)*weight,s=-Math.sin(m*phi)*weight;cpu[m*4]+=v[0]*c;cpu[m*4+1]+=v[0]*s;cpu[m*4+2]+=v[1]*c;cpu[m*4+3]+=v[1]*s;}}
   const started=Date.now();await page.evaluate(queryResident,queryUpload(union.field,plans,model));const gpu=await page.evaluate(fourierResident,{count:plans.length,quadrature}),milliseconds=Date.now()-started,maximum=Math.max(...gpu.map((x,i)=>{assert.ok(Number.isFinite(x));return Math.abs(x-cpu[i])/Math.max(mass,1e-25);}));assert.ok(maximum<=1e-4,'Resident Fourier differs from binary64 quadrature');
   await page.evaluate(queryResident,queryUpload(union.field,plans,constant,[false,false]));const manufacture=await page.evaluate(fourierResident,{count:plans.length,quadrature});let analyticError=0;for(let m=0;m<=L;m++)for(let k=0;k<4;k++){const value=m===0&&k%2===0?(k===0?2:3)*2*Math.PI:0;analyticError=Math.max(analyticError,Math.abs(manufacture[m*4+k]-value)/(10*Math.PI));}assert.ok(analyticError<=1e-4);
   rows.push({...test,index,mu:row.mu,queries:plans.length,mass,maximum,analyticError,milliseconds});console.log(JSON.stringify(rows.at(-1)));
  }
 }
 await page.evaluate(fourierResident,{action:'close'});await page.evaluate(queryResident,{action:'close'});await browser.close();browser=null;run.write('summary.json',{rows,renderer,scope:'Finite Fourier primitive and analytic constant-radiance proof. Complete projection error, actual recurrence and physical accuracy remain separate.'});run.finish('accepted',{rows:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
