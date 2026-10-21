import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {polarNativeField} from './polar-native-field.mjs';
import {queryContext,plannedModel} from './query-plan.mjs';
import {ringQueries} from './query-ring-plan.mjs';
import {queryUpload,queryShader,queryResident} from './query-plan-gpu.mjs';
import {fourierShader,fourierResident} from './query-fourier-gpu.mjs';
import {projectionDispatch} from './query-projection-dispatch.mjs';
import {projectionGrid} from './harmonic-grid.mjs';
import {latitude,lm,convolve} from './harmonics.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {gauss} from '../interior-illumination/physics.mjs';

const channel=8,L=128,n=4,inputPath=base+'00712-h136-polar-row/paper-b8-nodes.json.gz',referencePath=base+'00712-h136-polar-row/paper-b8-n4.json.gz';
const run=createRun('h136-gpu-project',{
 parents:['00727-h136-query-dft','00726-h136-query-gpu','00724-h136-ring-plan','00725-h136-source-row'].map(name=>verifyRun(base+name)),
 operation:'Project one complete actual paper/red source field using the unchanged nonuniform quadrature, geometry-prepared positive interpolator and resident Fourier kernel. Reduce latitude coefficients in binary64. Compare the complete coefficients and physical operator with the retained CPU projection of that exact function/input. No new physical light or empirical fitting.',
 parameters:{channel,L,n,input:identity(inputPath),reference:identity(referencePath),uniformOperatorDiscrepancyTarget:1e-5,costIsGate:false,lightReadback:false},
});
let browser,failure;
try{
 const input=read(inputPath),reference=read(referencePath),{f,union}=polarNativeField(channel);assert.deepEqual(input.physical,f.px);assert.deepEqual(input.directions,union.field.g.nodes);const context=queryContext(union.field),model=plannedModel(union.field,input.levels.n256),size=(L+1)*(L+2)/2,real=[new Float64Array(size),new Float64Array(size)],imag=[new Float64Array(size),new Float64Array(size)];
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),renderer=await page.evaluate(projectionDispatch,{action:'init',L,querySource:queryResident.toString(),fourierSource:fourierResident.toString(),queryShader:queryShader(),fourierShader:fourierShader()});let rings=0,count=0,prepareMilliseconds=0,dispatchMilliseconds=0,reduceMilliseconds=0;const started=Date.now();
 for(const row of projectionGrid(union.field,L,n)){
  if(rings%8===0)run.progress('GPU-source-projection',`latitude${rings} queries${count}`);let start=Date.now();const prepare=ringQueries(union.field,context,row.mu),plans=[],quadrature=[];
  for(const arc of row.arcs){const g=gauss(arc.n);for(let j=0;j<g.nodes.length;j++){const phi=arc.a+(arc.b-arc.a)*g.nodes[j],weight=(arc.b-arc.a)*g.weights[j];plans.push(prepare(phi));quadrature.push(phi,weight,0,0);}}
  const query=queryUpload(union.field,plans,model);prepareMilliseconds+=Date.now()-start;start=Date.now();const values=await page.evaluate(projectionDispatch,{query,quadrature});dispatchMilliseconds+=Date.now()-start;start=Date.now();const Q=latitude(row.mu,L);
  for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weight=row.weight*Q[at];real[0][at]+=weight*values[m*4];imag[0][at]+=weight*values[m*4+1];real[1][at]+=weight*values[m*4+2];imag[1][at]+=weight*values[m*4+3];}
  reduceMilliseconds+=Date.now()-start;rings++;count+=plans.length;
 }
 await page.evaluate(projectionDispatch,{action:'close'});await browser.close();browser=null;
 const beta=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)],mie=phaseMoments(null,L),ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0);let bound=0;
 for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weight=(m===0?1:2)*Math.sqrt((2*l+1)/(4*Math.PI))*(beta[0]*ray[l]+beta[1]*mie[l]);for(let s=0;s<2;s++)bound+=weight*Math.hypot(real[s][at]-reference.real[s][at],imag[s][at]-reference.imag[s][at]);}
 const uniformOperatorDifference=bound/reference.result.scale,qualified=uniformOperatorDifference<=1e-5;
 const result={channel,L,n,rings,count,prepareMilliseconds,dispatchMilliseconds,reduceMilliseconds,milliseconds:Date.now()-started,uniformOperatorDifference,qualified,renderer,scope:'Complete same-input projection implementation proof only. Degree/input/physical accuracy and own-field recurrence remain separate.'};
 run.write('coefficients.json.gz',pack({L,n,real:real.map(x=>Array.from(x)),imag:imag.map(x=>Array.from(x)),reference:identity(referencePath)}));run.write('summary.json',result);run.finish('accepted',{qualified});console.log(JSON.stringify({run:run.path,...result,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
