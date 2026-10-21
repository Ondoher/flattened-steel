import assert from 'node:assert/strict';
import {createRun,readRepository,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,registration,setup,read,pack,verifyRun} from './common.mjs';
import {gauss} from '../interior-illumination/physics.mjs';
import {transportKernel,transportResident} from './builder-transport.mjs';

const mathPath='experiments/sky-accuracy-dials/illumination-reconstruction/builder-transport-proof.mjs',source=readRepository(mathPath).toString(),start=source.indexOf('/** Independent binary64 radial optical depth.'),end=source.indexOf('let browser,failure;');assert.ok(start>=0&&end>start);const {exactPath,finitePath}=Function('gauss',source.slice(start,end)+'\nreturn {exactPath,finitePath};')(gauss);
const altitudes=[0,1875,12000,30000,60000],zeniths=[.5,89.5,90.5,105.5],cases=[{n:1920,compensated:false},{n:1920,compensated:true},{n:3840,compensated:true}],run=createRun('h138-stable-path',{
 parents:[verifyRun(base+'00735-h138-path-proof'),verifyRun(base+'00736-h138-path-finer'),identity(mathPath)],
 operation:'Isolate the fine-step GPU arithmetic failure without weakening its gates. Reproduce original1920 with complete raw readback before checks; compare compensated radiance plus compensated optical-depth accumulation followed by exp(-tau) at1920/3840. Preserve independent finite/analytic radial references and original60 policy. This is numerical calibration, not a third physical cache candidate.',
 parameters:{altitudes,zeniths,cases,finiteRelativeTolerance:1e-4,scalarSplitRelativeTolerance:2e-5,actualGPUPhysicalManufactureTolerance:1e-5,costIsGate:false},
});
let browser,failure;
try{
 const f=setup(registration(),'paper','node-89',8),widthJ=f.p.control.request.transportSpec.domains.outgoing.unitVectors.length,rows=altitudes.length*zeniths.length,widthL=2,R=Math.fround(1e-7),M=Math.fround(2e-7),rayleigh=Array(widthJ*rows).fill(R),mie=Array(widthJ*rows).fill(M),sum=Array(widthJ*rows).fill(Math.fround(R+M)),directions=[];for(let row=0;row<rows;row++)for(let j=0;j<2;j++)directions.push(0,0,(row+j)%2===0?1:-1,0);
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),results=[],prior=read(base+'00736-h138-path-finer/paper-n960.json');
 for(const test of cases){
  const {n,compensated}=test,label=`${compensated?'stable':'original'}-n${n}`;run.progress('transport-arithmetic',label);const kernel=transportKernel(f,altitudes,zeniths,widthL,n,false,compensated),started=Date.now(),gpu=await page.evaluate(transportResident,{...kernel,widthJ,rows,widthL,rayleigh,mie,sum,directions});
  // Retain the complete affected readback even when the comparison is negative.
  run.write(label+'-gpu.json.gz',pack({test,widthJ,rows,widthL,sourceDensity:[R,M],gpu}));const checks=[];
  for(let row=0;row<rows;row++)for(let j=0;j<2;j++){
   const h=altitudes[row%altitudes.length],zenith=zeniths[Math.floor(row/altitudes.length)],sign=(row+j)%2===0?1:-1,length=sign>0?f.px.top-h:h,path=finitePath(f.px,h,sign,zenith,length,n),exact64=exactPath(f.px,h,sign,length,64),exact128=exactPath(f.px,h,sign,length,128),referenceBias=2*Math.abs(exact128-exact64),at=(row*2+j)*4,expected=[R*path,M*path],split=gpu.split.slice(at,at+2),scalar=gpu.scalar[at],finiteRelative=Math.max(...split.map((x,s)=>Math.abs(x-expected[s])/Math.max(Math.abs(expected[s]),1e-25))),scalarRelative=Math.abs(scalar-split[0]-split[1])/Math.max(Math.abs(scalar),1e-25),actualGPUPhysicalRelative=length>0?(split[0]+split[1]-(R+M)*exact128)/((R+M)*exact128):0;
   assert.ok(split.every(x=>Number.isFinite(x)&&x>=0)&&Number.isFinite(scalar)&&scalar>=0);assert.ok(referenceBias<=1e-8*Math.max(exact128,1));checks.push({row,j,h,zenith,sign,length,path,exact128,referenceBias,split,scalar,finiteRelative,scalarRelative,actualGPUPhysicalRelative,finitePassed:finiteRelative<=1e-4,scalarPassed:scalarRelative<=2e-5});
  }
  const previous=n===3840?results.find(r=>r.n===1920&&r.compensated):prior,empiricalPhysicalCPUEnvelope=Math.max(...checks.map((x,i)=>x.length>0?(2*Math.abs(x.path-previous.checks[i].path)+x.referenceBias)/x.exact128:0)),maximumActualGPUPhysicalRelative=Math.max(...checks.map(x=>Math.abs(x.actualGPUPhysicalRelative)+(x.length>0?x.referenceBias/x.exact128:0))),result={...test,checks,finitePassed:checks.every(x=>x.finitePassed),scalarPassed:checks.every(x=>x.scalarPassed),maximumFiniteRelative:Math.max(...checks.map(x=>x.finiteRelative)),maximumScalarRelative:Math.max(...checks.map(x=>x.scalarRelative)),maximumActualGPUPhysicalRelative,physicalManufactureQualified:maximumActualGPUPhysicalRelative<=1e-5,empiricalPhysicalCPUEnvelope,milliseconds:Date.now()-started,renderer:gpu.renderer};results.push(result);run.write(label+'.json',result);console.log(JSON.stringify({...result,checks:undefined}));
 }
 await browser.close();browser=null;const stable=results.filter(r=>r.compensated),qualified=stable.every(r=>r.finitePassed&&r.scalarPassed)&&stable.at(-1).physicalManufactureQualified&&stable.at(-1).empiricalPhysicalCPUEnvelope<=1e-5;
 run.write('summary.json',{results:results.map(({checks,...r})=>r),qualified,originalFailureReproduced:!results[0].finitePassed||!results[0].scalarPassed,scope:'Known-source numerical stability/physical manufacture only. Original60 comparison remains unchanged. No actual own-J2 cache, later-order or ground/observer qualification.'});run.finish('accepted',{qualified});console.log(JSON.stringify({run:run.path,qualified,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
