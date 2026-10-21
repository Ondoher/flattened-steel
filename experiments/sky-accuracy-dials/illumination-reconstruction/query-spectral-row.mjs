import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {polarNativeField} from './polar-native-field.mjs';
import {openBinaryProjection} from './query-binary.mjs';
import {projectSpectral} from './query-spectral-core.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {lm} from './harmonics.mjs';

const L=128,n=4,sourceRoot=base+'00725-h136-source-row',originalRoot=base+'00721-h136-polar-spec',run=createRun('h136-spec-row',{
 parents:[verifyRun(base+'00731-h136-spec-proof'),verifyRun(sourceRoot),verifyRun(originalRoot)],
 operation:'Complete15-band same-input paper source projection with geometry shared across wavelengths and256-query partial GPU reductions. Compare every band with its exact retained binary64 degree128/order4 coefficients under the unchanged1e-5 uniform physical-operator discrepancy target. No new light traces or physical/observer claims.',
 parameters:{L,n,bands:15,partialQueries:256,uniformOperatorDiscrepancyTarget:1e-5,costIsGate:false},
});
let browser,bridge,failure;
try{
 const items=read(sourceRoot+'/summary.json').rows,original=read(originalRoot+'/summary.json').rows,fields=[],nodes=[];
 for(let channel=0;channel<15;channel++){const item=items.find(row=>row.channel===channel),packet=read(item.input.path),{union}=polarNativeField(channel);assert.deepEqual(packet.physical,union.field.px);assert.deepEqual(packet.directions,union.field.g.nodes);fields.push(union.field);nodes.push(packet.levels.n256);}
 assertIdleGpu(run.path);bridge=await openBinaryProjection();browser=await launch(run);const page=await browser.newPage();await page.goto(bridge.origin+'/');const got=await projectSpectral(page,run,fields,nodes,L,n,bridge);await browser.close();browser=null;await bridge.close();bridge=null;const rows=[],mie=phaseMoments(null,L),ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0);
 for(let channel=0;channel<15;channel++){
  const f=fields[channel],c=got.coefficients[channel],old=original.find(row=>row.channel===channel),path=(old.reusedParent??originalRoot)+`/paper-b${channel}-n4.json.gz`,reference=read(path),beta=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)];let bound=0;
  for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weight=(m===0?1:2)*Math.sqrt((2*l+1)/(4*Math.PI))*(beta[0]*ray[l]+beta[1]*mie[l]);for(let s=0;s<2;s++)bound+=weight*Math.hypot(c.real[s][at]-reference.real[s][at],c.imag[s][at]-reference.imag[s][at]);}
  const uniformOperatorDifference=bound/reference.result.scale,qualified=uniformOperatorDifference<=1e-5;rows.push({channel,uniformOperatorDifference,qualified,input:items[channel].input,reference:identity(path)});run.write(`paper-b${channel}.json.gz`,pack({L,n,real:c.real.map(x=>Array.from(x)),imag:c.imag.map(x=>Array.from(x)),comparison:rows.at(-1)}));
 }
 const result={L,n,bands:15,rings:got.rings,count:got.count,rows,qualified:rows.every(row=>row.qualified),timings:got.timings,renderer:got.renderer,peakOwnedTextureBytes:got.peakOwnedTextureBytes,binary:got.binary,scope:'One complete shared-geometry GPU implementation projection; numerical implementation error is distinct from projection convergence, phase tail, actual physical light and full recurrence.'};
 run.write('summary.json',result);run.finish('accepted',{qualified:result.qualified,bands:15});console.log(JSON.stringify({run:run.path,...result,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);await bridge?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
