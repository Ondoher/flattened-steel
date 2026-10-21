import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {polarNativeField} from './polar-native-field.mjs';
import {projectPrepared} from './query-projection-core.mjs';
import {openBinaryProjection} from './query-binary.mjs';
import {lm} from './harmonics.mjs';
import {phaseMoments} from './phase-moments.mjs';

const channel=8,L=128,n=4,inputPath=base+'00712-h136-polar-row/paper-b8-nodes.json.gz',referencePath=base+'00712-h136-polar-row/paper-b8-n4.json.gz',priorRoot=base+'00728-h136-gpu-project';
const run=createRun('h136-bin-project',{
 parents:[verifyRun(priorRoot),verifyRun(base+'00727-h136-query-dft'),verifyRun(base+'00725-h136-source-row')],
 operation:'Repeat the complete same-input GPU projection over a nonce-owned loopback binary float channel, preserving all quadrature, phases and resident arithmetic. Verify exact dispatch parity on fixed rings and complete coefficient equality against the prior GPU route, then retain the independent CPU operator comparison. Report transfer/preparation/dispatch costs without a scientific speed gate.',
 parameters:{channel,L,n,input:identity(inputPath),reference:identity(referencePath),uniformOperatorDiscrepancyTarget:1e-5,binaryCalibrationRings:[0,311],costIsGate:false},
});
let browser,bridge,failure;
try{
 const input=read(inputPath),reference=read(referencePath),prior=read(priorRoot+'/coefficients.json.gz'),{f,union}=polarNativeField(channel);assert.deepEqual(input.physical,f.px);assert.deepEqual(input.directions,union.field.g.nodes);
 assertIdleGpu(run.path);bridge=await openBinaryProjection();browser=await launch(run);const page=await browser.newPage();await page.goto(bridge.origin+'/');const {c,timings,renderer,calibrated,binary}=await projectPrepared(page,run,union.field,input.levels.n256,L,n,bridge);
 await browser.close();browser=null;await bridge.close();bridge=null;
 const beta=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)],mie=phaseMoments(null,L),ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0);let bound=0,maximumPrior=0;
 for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weight=(m===0?1:2)*Math.sqrt((2*l+1)/(4*Math.PI))*(beta[0]*ray[l]+beta[1]*mie[l]);for(let s=0;s<2;s++){bound+=weight*Math.hypot(c.real[s][at]-reference.real[s][at],c.imag[s][at]-reference.imag[s][at]);maximumPrior=Math.max(maximumPrior,Math.abs(c.real[s][at]-prior.real[s][at]),Math.abs(c.imag[s][at]-prior.imag[s][at]));}}
 assert.equal(maximumPrior,0,'Binary route changes the complete retained GPU projection');const uniformOperatorDifference=bound/reference.result.scale,qualified=uniformOperatorDifference<=1e-5;
 const result={channel,L,n,rings:c.rings,count:c.count,...timings,uniformOperatorDifference,qualified,maximumPrior,calibrated,binary,renderer,scope:'Same-input numerical implementation and transfer comparison; not new physical or recurrence qualification.'};
 run.write('coefficients.json.gz',pack({L,n,real:c.real.map(x=>Array.from(x)),imag:c.imag.map(x=>Array.from(x)),reference:identity(referencePath)}));run.write('summary.json',result);run.finish('accepted',{qualified,binaryExact:true});console.log(JSON.stringify({run:run.path,...result,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);await bridge?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
