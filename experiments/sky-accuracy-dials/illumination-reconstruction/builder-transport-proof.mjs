import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,registration,setup,verifyRun} from './common.mjs';
import {gauss} from '../interior-illumination/physics.mjs';
import {transportKernel,transportResident} from './builder-transport.mjs';

const altitudes=[0,1875,12000,30000,60000],zeniths=[.5,89.5,90.5,105.5],levels=[60,120,240],run=createRun('h138-path-proof',{
 parents:['00733-h138-row-frame','00732-h136-spec-row','00725-h136-source-row'].map(name=>verifyRun(base+name)),
 operation:'Prove the actual contained path operator with known constant previous-source fields: scalar-sum versus separate atmospheric R/M transport, row-specific directions, vacuum units and independent binary64 finite quadrature. Compare attenuating radial paths with independent analytic optical columns and Gauss integration; report finite-operation correctness separately from physical path convergence. This does not claim an actual own-J2 cache or ground recurrence.',
 parameters:{altitudes,zeniths,radialDirectionsPerRow:2,levels,sourceDensity:[1e-7,2e-7],finiteRelativeTolerance:1e-4,scalarSplitRelativeTolerance:2e-5,physicalEnvelopeTarget:1e-5,costIsGate:false},
});
/** Independent binary64 radial optical depth. @param {any} p @param {number} h
 * @param {number} sign @param {number} t @returns {number} */
function tau(p,h,sign,t){return [[p.br,8000],[p.bm,1200]].reduce((sum,[beta,H])=>sum+beta*H*Math.exp(-h/H)*(-Math.expm1(-sign*t/H))/sign,0);}
/** @param {any} p @param {number} h @param {number} sign @param {number} length
 * @param {number} n @returns {number} */
function exactPath(p,h,sign,length,n){if(length<=0)return 0;const q=gauss(n);let total=0;const cuts=[0,Math.min(1000,length),Math.min(5000,length),Math.min(20000,length),length];for(let panel=1;panel<cuts.length;panel++){const a=cuts[panel-1],span=cuts[panel]-a;for(let j=0;j<n;j++)total+=span*q.weights[j]*Math.exp(-tau(p,h,sign,a+span*q.nodes[j]));}return total;}
/** Reproduce the finite trapezoid independently, with stable radial geometry.
 * @param {any} p @param {number} h @param {number} sign @param {number} zenith
 * @param {number} length @param {number} n @returns {number} */
function finitePath(p,h,sign,zenith,length,n){
 if(length<=0)return 0;const cuts=[0,length];if(zenith>90){const t=(p.radius/Math.sin(zenith*Math.PI/180)-(p.radius+h))/sign;if(t>.001&&t<length-.001)cuts.push(t);}cuts.sort((a,b)=>a-b);let T=1,sum=0;
 for(let panel=1;panel<cuts.length;panel++){const a=cuts[panel-1],step=(cuts[panel]-a)/n;let previous=0;for(let j=0;j<=n;j++){const height=Math.max(0,h+sign*(a+j*step)),ext=p.br*Math.exp(-height/8000)+p.bm*Math.exp(-height/1200);if(j>0)T*=Math.exp(-.5*(previous+ext)*step);sum+=T*step*(j===0||j===n?.5:1);previous=ext;}}
 return sum;
}
let browser,failure;
try{
 const f=setup(registration(),'paper','node-89',8),widthJ=f.p.control.request.transportSpec.domains.outgoing.unitVectors.length,rows=altitudes.length*zeniths.length,widthL=2,R=Math.fround(1e-7),M=Math.fround(2e-7),rayleigh=Array(widthJ*rows).fill(R),mie=Array(widthJ*rows).fill(M),sum=Array(widthJ*rows).fill(Math.fround(R+M)),directions=[];
 for(let row=0;row<rows;row++)for(let j=0;j<2;j++)directions.push(0,0,(row+j)%2===0?1:-1,0);
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),results=[];
 for(const vacuum of [true,false])for(const n of vacuum?[60]:levels){
  run.progress('known-source-transport',`${vacuum?'vacuum':'paper'} intervals${n}`);const kernel=transportKernel(f,altitudes,zeniths,widthL,n,vacuum),started=Date.now(),gpu=await page.evaluate(transportResident,{...kernel,widthJ,rows,widthL,rayleigh,mie,sum,directions}),p=vacuum?{...f.px,br:0,bm:0}:f.px,checks=[];
  for(let row=0;row<rows;row++)for(let j=0;j<2;j++){
   const h=altitudes[row%altitudes.length],zenith=zeniths[Math.floor(row/altitudes.length)],sign=(row+j)%2===0?1:-1,length=sign>0?p.top-h:h,path=finitePath(p,h,sign,zenith,length,n),exact64=exactPath(p,h,sign,length,64),exact128=exactPath(p,h,sign,length,128),referenceBias=2*Math.abs(exact128-exact64),at=(row*2+j)*4,expected=[R*path,M*path],split=gpu.split.slice(at,at+2),scalar=gpu.scalar[at],finiteRelative=Math.max(...split.map((x,s)=>Math.abs(x-expected[s])/Math.max(Math.abs(expected[s]),1e-25))),scalarRelative=Math.abs(scalar-split[0]-split[1])/Math.max(Math.abs(scalar),1e-25),physicalRelative=length>0?(path-exact128)/exact128:0;
   assert.ok(split.every(x=>Number.isFinite(x)&&x>=0)&&Number.isFinite(scalar)&&scalar>=0);assert.ok(finiteRelative<=1e-4,'Transport GPU differs from independent finite path');assert.ok(scalarRelative<=2e-5,'R/M transport does not sum to scalar');assert.ok(referenceBias<=1e-8*Math.max(exact128,1),'Independent physical manufacture integration is unresolved');checks.push({row,j,h,zenith,sign,length,path,exact128,referenceBias,split,scalar,finiteRelative,scalarRelative,physicalRelative});
  }
  const previous=results.filter(r=>r.vacuum===vacuum).at(-1),envelope=previous?Math.max(...checks.map((x,i)=>x.length>0?(2*Math.abs(x.path-previous.checks[i].path)+x.referenceBias)/x.exact128:0)):null;
  const result={vacuum,n,checks,maximumFiniteRelative:Math.max(...checks.map(x=>x.finiteRelative)),maximumScalarRelative:Math.max(...checks.map(x=>x.scalarRelative)),maximumPhysicalRelative:Math.max(...checks.map(x=>Math.abs(x.physicalRelative))),empiricalPhysicalEnvelope:envelope,physicalEnvelopeQualified:envelope!==null&&envelope<=1e-5,milliseconds:Date.now()-started,renderer:gpu.renderer,ownedTextureBytes:gpu.ownedTextureBytes,parent:kernel.parent};results.push(result);run.write(`${vacuum?'vacuum':'paper'}-n${n}.json`,result);console.log(JSON.stringify({...result,checks:undefined}));
 }
 await browser.close();browser=null;run.write('summary.json',{results:results.map(({checks,...result})=>result),finiteOperatorQualified:true,physicalPathQualified:results.filter(r=>!r.vacuum).at(-1).physicalEnvelopeQualified,scope:'Known-source black-boundary operator proof only. Actual own-field recurrence, boundary reflection and observer accuracy are not qualified.'});run.finish('accepted',{finiteOperatorQualified:true});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
