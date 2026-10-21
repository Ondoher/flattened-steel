import assert from 'node:assert/strict';
import {queryContext,plannedModel} from './query-plan.mjs';
import {ringQueries} from './query-ring-plan.mjs';
import {queryUpload,queryShader,queryResident} from './query-plan-gpu.mjs';
import {fourierShader,fourierResident} from './query-fourier-gpu.mjs';
import {projectionDispatch} from './query-projection-dispatch.mjs';
import {projectionGrid} from './harmonic-grid.mjs';
import {latitude,lm} from './harmonics.mjs';
import {gauss} from '../interior-illumination/physics.mjs';
import {binaryProjectionDispatch} from './query-binary.mjs';

/** Same projection equations as query-projection-proof.mjs, parameterized for
 * actual builder fields. The optional binary bridge preserves exact GPU inputs;
 * two fixed rings are compared byte-for-byte against ordinary dispatch.
 * @param {any} page @param {any} run @param {any} f @param {number[][]} nodes
 * @param {number} L @param {number} n @param {any} [bridge]
 * @param {boolean[]} [factored] @returns {Promise<any>} */
export async function projectPrepared(page,run,f,nodes,L,n,bridge=null,factored=[true,true]){
 const context=queryContext(f),model=plannedModel(f,nodes,factored),size=(L+1)*(L+2)/2,real=[new Float64Array(size),new Float64Array(size)],imag=[new Float64Array(size),new Float64Array(size)];
 const renderer=await page.evaluate(projectionDispatch,{action:'init',L,querySource:queryResident.toString(),fourierSource:fourierResident.toString(),queryShader:queryShader(),fourierShader:fourierShader()});let rings=0,count=0,prepareMilliseconds=0,dispatchMilliseconds=0,reduceMilliseconds=0,calibrationMilliseconds=0;const started=Date.now(),calibrated=[];
 try{
  for(const row of projectionGrid(f,L,n)){
   if(rings%8===0)run.progress('prepared-source-projection',`latitude${rings} queries${count}`);let start=Date.now();const prepare=ringQueries(f,context,row.mu),plans=[],quadrature=[];
   for(const arc of row.arcs){const g=gauss(arc.n);for(let j=0;j<g.nodes.length;j++){const phi=arc.a+(arc.b-arc.a)*g.nodes[j],weight=(arc.b-arc.a)*g.weights[j];plans.push(prepare(phi));quadrature.push(phi,weight,0,0);}}
   const query=queryUpload(f,plans,model,factored);prepareMilliseconds+=Date.now()-start;let control;
   if(bridge&&(rings===0||rings===311)){start=Date.now();control=await page.evaluate(projectionDispatch,{query,quadrature});calibrationMilliseconds+=Date.now()-start;}
   start=Date.now();const values=bridge?await binaryProjectionDispatch(page,bridge,query,quadrature):await page.evaluate(projectionDispatch,{query,quadrature});dispatchMilliseconds+=Date.now()-start;
   if(control){assert.deepEqual(values,control,'Binary transfer changes resident Fourier values');calibrated.push({ring:rings,queries:plans.length,exact:true,positiveMass:values[0]+values[2]>0});}
   start=Date.now();const Q=latitude(row.mu,L);
   for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weight=row.weight*Q[at];real[0][at]+=weight*values[m*4];imag[0][at]+=weight*values[m*4+1];real[1][at]+=weight*values[m*4+2];imag[1][at]+=weight*values[m*4+3];}
   reduceMilliseconds+=Date.now()-start;rings++;count+=plans.length;
  }
 }finally{await page.evaluate(projectionDispatch,{action:'close'});}
 return {c:{L,real,imag,count,rings},timings:{prepareMilliseconds,dispatchMilliseconds,reduceMilliseconds,calibrationMilliseconds,milliseconds:Date.now()-started},renderer,calibrated,binary:bridge?{peakBytes:bridge.state.peakBytes,totalBytes:bridge.state.totalBytes}:null};
}
