import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {polarNativeField} from './polar-native-field.mjs';
import {openBinaryProjection} from './query-binary.mjs';
import {projectSpectral} from './query-spectral-core.mjs';
import {reusableSpectralPage} from './query-reusable.mjs';
import {lm} from './harmonics.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {calibrateReusable} from './query-reusable-calibration.mjs';

const reference=base+'00730-h136-bin-project',source=read(base+'00725-h136-source-row/summary.json').rows.find(x=>x.channel===8),input=read(source.input.path),{union}=polarNativeField(8),f=union.field,L=128,n=4,run=createRun('h136-reuse-gpu',{
 parents:[verifyRun(reference),verifyRun(base+'00725-h136-source-row'),source.input],operation:'Calibrate persistent versus original texture allocation on identical actual spectral projection packets with grow/shrink/reuse, requiring exact partial-output equality. Then complete paper/red degree128/order4 projection with byte-checked amplitudes and unchanged spectral shaders/quadrature/reduction. Compare every coefficient with retained730 as a numerical reference;730 used a different pre-partial-sum route, so its elapsed time/equality is not an isolated resident-only benchmark. This changes no scientific admission or construction-cost gate.',
 parameters:{L,n,profile:'paper',channel:8,uniformOperatorTolerance:1e-5,costIsGate:false},
});let browser,bridge,failure;
try{
 assert.deepEqual(input.physical,f.px);assert.deepEqual(input.directions,f.g.nodes);assertIdleGpu(run.path);bridge=await openBinaryProjection();browser=await launch(run);const page=await browser.newPage();await page.goto(bridge.origin+'/');const calibration=await calibrateReusable(page,run,bridge,f,input.levels.n256,L,n);run.write('calibration.json',{calibration,identical:true});const got=await projectSpectral(reusableSpectralPage(page),run,[f],[input.levels.n256],L,n,bridge);await browser.close();browser=null;await bridge.close();bridge=null;
 const old=read(reference+'/coefficients.json.gz'),c=got.coefficients[0],ref=old.coefficients??old,ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),mie=phaseMoments(null,L),beta=[f.px.br,f.px.bm*f.px.ssa];let bound=0,maximumCoefficientDifference=0,identical=true;
 for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weight=(m===0?1:2)*Math.sqrt((2*l+1)/(4*Math.PI))*(beta[0]*ray[l]+beta[1]*mie[l]);for(let s=0;s<2;s++){const dr=c.real[s][at]-ref.real[s][at],di=c.imag[s][at]-ref.imag[s][at];bound+=weight*Math.hypot(dr,di);maximumCoefficientDifference=Math.max(maximumCoefficientDifference,Math.abs(dr),Math.abs(di));identical&&=dr===0&&di===0;}}
 const uniformOperatorDifference=bound/source.scale;run.write('coefficients.json.gz',pack({L,n,real:c.real.map(a=>Array.from(a)),imag:c.imag.map(a=>Array.from(a))}));const qualified=uniformOperatorDifference<=1e-5;run.write('summary.json',{qualified,identical,maximumCoefficientDifference,uniformOperatorDifference,timings:got.timings,rings:got.rings,count:got.count,peakOwnedTextureBytes:got.peakOwnedTextureBytes,binary:got.binary,renderer:got.renderer,reference:identity(reference+'/coefficients.json.gz'),scope:'Equivalent actual projection implementation replay, one paper wavelength/row; no new physical, whole-cache, later-order or B1 claim. Wall times include host/driver/transport/scheduling and are not isolated GPU benchmarks.'});run.finish('accepted',{qualified,identical});console.log(JSON.stringify({run:run.path,qualified,identical,maximumCoefficientDifference,uniformOperatorDifference,timings:got.timings,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);await bridge?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
