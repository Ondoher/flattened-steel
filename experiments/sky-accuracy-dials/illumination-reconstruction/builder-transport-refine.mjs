import assert from 'node:assert/strict';
import {createRun,readRepository,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,registration,setup,read,verifyRun} from './common.mjs';
import {gauss} from '../interior-illumination/physics.mjs';
import {transportKernel,transportResident} from './builder-transport.mjs';

const parent=base+'00735-h138-path-proof',mathPath='experiments/sky-accuracy-dials/illumination-reconstruction/builder-transport-proof.mjs',source=readRepository(mathPath).toString(),start=source.indexOf('/** Independent binary64 radial optical depth.'),end=source.indexOf('let browser,failure;');assert.ok(start>=0&&end>start);
// Reuse the exact qualified independent formulas without executing their runner.
const {exactPath,finitePath}=Function('gauss',source.slice(start,end)+'\nreturn {exactPath,finitePath};')(gauss),levels=[480,960,1920,3840],altitudes=[0,1875,12000,30000,60000],zeniths=[.5,89.5,90.5,105.5];
const run=createRun('h138-path-finer',{
 parents:[verifyRun(parent),identity(mathPath)],operation:'Refine only the unresolved constant-source radial physical quadrature from the completed transport proof. Reuse the exact independent formulas and prior240 result; do not repeat vacuum or old levels. The first-intervention60-interval comparison remains unchanged.',
 parameters:{levels,altitudes,zeniths,finiteRelativeTolerance:1e-4,scalarSplitRelativeTolerance:2e-5,physicalCPUEnvelopeTarget:1e-5,costIsGate:false},
});
let browser,failure;
try{
 const f=setup(registration(),'paper','node-89',8),widthJ=f.p.control.request.transportSpec.domains.outgoing.unitVectors.length,rows=altitudes.length*zeniths.length,widthL=2,R=Math.fround(1e-7),M=Math.fround(2e-7),rayleigh=Array(widthJ*rows).fill(R),mie=Array(widthJ*rows).fill(M),sum=Array(widthJ*rows).fill(Math.fround(R+M)),directions=[];for(let row=0;row<rows;row++)for(let j=0;j<2;j++)directions.push(0,0,(row+j)%2===0?1:-1,0);
 let previous=read(parent+'/paper-n240.json');const results=[];assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();
 for(const n of levels){
  run.progress('radial-path-precision',`intervals${n}`);const kernel=transportKernel(f,altitudes,zeniths,widthL,n,false),started=Date.now(),gpu=await page.evaluate(transportResident,{...kernel,widthJ,rows,widthL,rayleigh,mie,sum,directions}),checks=[];
  for(let row=0;row<rows;row++)for(let j=0;j<2;j++){
   const h=altitudes[row%altitudes.length],zenith=zeniths[Math.floor(row/altitudes.length)],sign=(row+j)%2===0?1:-1,length=sign>0?f.px.top-h:h,path=finitePath(f.px,h,sign,zenith,length,n),exact64=exactPath(f.px,h,sign,length,64),exact128=exactPath(f.px,h,sign,length,128),referenceBias=2*Math.abs(exact128-exact64),at=(row*2+j)*4,expected=[R*path,M*path],split=gpu.split.slice(at,at+2),scalar=gpu.scalar[at],finiteRelative=Math.max(...split.map((x,s)=>Math.abs(x-expected[s])/Math.max(Math.abs(expected[s]),1e-25))),scalarRelative=Math.abs(scalar-split[0]-split[1])/Math.max(Math.abs(scalar),1e-25),physicalRelative=length>0?(path-exact128)/exact128:0,actualGPUPhysicalRelative=length>0?(split[0]+split[1]-(R+M)*exact128)/((R+M)*exact128):0;
   assert.ok(split.every(x=>Number.isFinite(x)&&x>=0));assert.ok(finiteRelative<=1e-4&&scalarRelative<=2e-5);assert.ok(referenceBias<=1e-8*Math.max(exact128,1));checks.push({row,j,h,zenith,sign,length,path,exact128,referenceBias,split,scalar,finiteRelative,scalarRelative,physicalRelative,actualGPUPhysicalRelative});
  }
  const empiricalPhysicalCPUEnvelope=Math.max(...checks.map((x,i)=>x.length>0?(2*Math.abs(x.path-previous.checks[i].path)+x.referenceBias)/x.exact128:0)),result={n,checks,maximumFiniteRelative:Math.max(...checks.map(x=>x.finiteRelative)),maximumScalarRelative:Math.max(...checks.map(x=>x.scalarRelative)),maximumPhysicalCPURelative:Math.max(...checks.map(x=>Math.abs(x.physicalRelative))),maximumActualGPUPhysicalRelative:Math.max(...checks.map(x=>Math.abs(x.actualGPUPhysicalRelative))),empiricalPhysicalCPUEnvelope,physicalCPUEnvelopeQualified:empiricalPhysicalCPUEnvelope<=1e-5,milliseconds:Date.now()-started,renderer:gpu.renderer};results.push(result);run.write(`paper-n${n}.json`,result);previous=result;console.log(JSON.stringify({...result,checks:undefined}));
 }
 await browser.close();browser=null;run.write('summary.json',{results:results.map(({checks,...r})=>r),finiteOperatorQualified:true,physicalCPUQuadratureQualified:results.at(-1).physicalCPUEnvelopeQualified,scope:'Fixed manufactured radial-source numerical refinement; GPU arithmetic and physical CPU quadrature are distinct. No change to the actual60-interval control, own-field cache, ground or observer qualification.'});run.finish('accepted',{levels});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
