import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,read,registration,pack,verifyRun} from './common.mjs';
import {builderGeometry} from './builder-geometry.mjs';
import {openBinaryProjection} from './query-binary.mjs';
import {projectSpectral} from './query-spectral-core.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {lm} from './harmonics.mjs';
import {emitNativeProjection} from './native-emission.mjs';
import {reusableSpectralPage} from './query-reusable.mjs';

const degrees=(process.argv[2]??'128,256,512,1024').split(',').map(Number),orders=[4,8,16,32],channel=8,r=registration(),p=r.profiles.find(x=>x.id==='toronto'),t=r.targets.find(x=>x.id==='node-89'),config=r.configs.find(x=>x.k===.5),{f,union}=builderGeometry(p,t,channel,config),inputPath=base+'00734-h136-input-wave/toronto-b8-nodes.json.gz',input=read(inputPath),scale=input.controlScale,beta=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)];assert.ok(degrees.every((L,i)=>[128,256,512,1024].includes(L)&&(i===0||L===2*degrees[i-1])));assert.deepEqual(input.directions,union.field.g.nodes);assert.deepEqual(input.physical,f.px);
const reuseRoot=process.argv[3]?(process.argv[3].startsWith(base)?process.argv[3]:base+process.argv[3]):null,reuseParent=reuseRoot?verifyRun(reuseRoot):null;if(reuseRoot){assert.equal(read(reuseRoot+'/summary.json').qualified,true);assert.equal(read(reuseRoot+'/calibration.json').identical,true);}
const run=createRun('h136-tor-native',{
 parents:[verifyRun(base+'00734-h136-input-wave'),verifyRun(base+'00762-h136-phase-1024'),identity(inputPath),...(reuseParent?[reuseParent]:[])],operation:'Investigate finite-degree Toronto convolution on the complete actual4374-node outgoing row, retaining three physical directions as well. Reuse its own already-calibrated full128-union L1 inputs; no light is retraced. Each degree must first converge its outgoing-independent projection with a weighted uniform coefficient-difference envelope. Then compare complete native source outputs across degrees. This is an empirical native-node phase-truncation diagnostic, not an analytic arbitrary-outgoing tail bound or independent physical accuracy result. An independent same-function driver check remains required before Toronto native-source admission.',
 parameters:{profile:'toronto',channel,physical:f.px,degrees,orders,projectionTarget:1e-5,nativePhaseTarget:1e-5,consecutiveDegreeChanges:2,sourceInput:identity(inputPath),scale,reusableResources:reuseRoot,groundAlbedo:0,costIsGate:false},
});let browser,bridge,failure;

/** Uniform bound on a finite-degree coefficient difference, not on the omitted
 * infinite physical-phase tail. @param {any} a @param {any} b
 * @param {number} L @param {number[]} ray @param {number[]} mie
 * @returns {number} */
function difference(a,b,L,ray,mie){let sum=0;for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),w=(m===0?1:2)*Math.sqrt((2*l+1)/(4*Math.PI))*(beta[0]*Math.abs(ray[l])+beta[1]*Math.abs(mie[l]));for(let s=0;s<2;s++)sum+=w*Math.hypot(a.real[s][at]-b.real[s][at],a.imag[s][at]-b.imag[s][at]);}return sum/scale;}

try{
 assertIdleGpu(run.path);bridge=await openBinaryProjection();browser=await launch(run);const page=await browser.newPage();await page.goto(bridge.origin+'/');const view=reuseRoot?reusableSpectralPage(page):page,results=[];let lastNative=null;
 for(const L of degrees){
  const ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),mie=phaseMoments(f.px.table,L),projection=[];let previous,last,qualified=false;
  for(const n of orders){const got=await projectSpectral(view,run,[union.field],[input.levels.n256],L,n,bridge),c=got.coefficients[0],change=previous?difference(c,previous,L,ray,mie):null,envelope=change===null?null:2*change,item={L,n,change,envelope,qualified:envelope!==null&&envelope<=1e-5,rings:got.rings,count:got.count,timings:got.timings,peakOwnedTextureBytes:got.peakOwnedTextureBytes,binary:got.binary};run.write(`L${L}-n${n}.json.gz`,pack({L,n,real:c.real.map(x=>Array.from(x)),imag:c.imag.map(x=>Array.from(x)),item}));projection.push(item);previous=c;last=c;console.log(JSON.stringify(item));if(item.qualified){qualified=true;break;}}
  if(!qualified){results.push({L,projection,projectionQualified:false});break;}
  const native=await emitNativeProjection(page,run,union.field,last,L,beta,ray,mie,scale);run.write(`L${L}-native.json.gz`,pack(native));let nativeChange=null,driver=null;
  if(lastNative){let maximum=-1;for(let i=0;i<native.values.length/4;i++){let d=0;for(let s=0;s<4;s++)d+=Math.abs(native.values[i*4+s]-lastNative.values[i*4+s]);if(d>maximum){maximum=d;driver=i;}}nativeChange=maximum/scale;}
  const prior=results.at(-1),nativeEmpiricalEnvelope=nativeChange!==null&&prior?.nativeChange!==null&&prior?.nativeChange!==undefined?2*Math.max(nativeChange,prior.nativeChange):null,item={L,projection,projectionQualified:true,nativeChange,nativeEmpiricalEnvelope,nativeEmpiricallyConverged:nativeEmpiricalEnvelope!==null&&nativeEmpiricalEnvelope<=1e-5,driver,negativeValues:native.negativeValues,gpuEvaluationQualified:native.gpuEvaluationQualified,independentDriverCheckComplete:false};results.push(item);lastNative=native;run.write(`L${L}-summary.json`,item);console.log(JSON.stringify({...item,projection:undefined}));if(item.nativeEmpiricallyConverged&&native.gpuEvaluationQualified&&native.negativeValues===0)break;
 }
 await browser.close();browser=null;await bridge.close();bridge=null;const final=results.at(-1);run.write('summary.json',{profile:'toronto',channel,physical:f.px,degrees,results,nativeEmpiricallyConverged:final.nativeEmpiricallyConverged??false,qualifiedNumerical:false,independentDriverCheckComplete:false,scope:'Whole finite native-row phase-truncation investigation only. Native empirical convergence is not a uniform arbitrary-outgoing physical-kernel bound. Independent driver validation and source-field admission remain open; no later-order, global cache, observer image or B1 qualification.'});run.finish('accepted',{nativeEmpiricallyConverged:final.nativeEmpiricallyConverged??false,qualifiedNumerical:false});console.log(JSON.stringify({run:run.path,results:results.map(({projection,...x})=>x),storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);await bridge?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
