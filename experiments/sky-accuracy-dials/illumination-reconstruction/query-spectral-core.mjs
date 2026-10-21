import assert from 'node:assert/strict';
import {queryContext,plannedModel} from './query-plan.mjs';
import {ringQueries} from './query-ring-plan.mjs';
import {spectralQueryShader,spectralFourierShader,spectralQueryPacket,spectralQueryResident} from './query-spectral-gpu.mjs';
import {projectionGrid} from './harmonic-grid.mjs';
import {latitude,lm} from './harmonics.mjs';
import {gauss} from '../interior-illumination/physics.mjs';

/** Project actual compatible wavelength fields together; optical values are
 * never copied by band or direction index across unmatched geometry.
 * @param {any} page @param {any} run @param {any[]} fields
 * @param {number[][][]} nodes @param {number} L @param {number} n
 * @param {any} bridge @param {boolean[]} [factored] @returns {Promise<any>} */
export async function projectSpectral(page,run,fields,nodes,L,n,bridge,factored=[true,true]){
 assert.equal(fields.length,nodes.length);assert.ok(fields.length>0);fields.forEach((f,b)=>{assert.deepEqual(f.g.nodes,fields[0].g.nodes);assert.deepEqual(f.mesh.frame,fields[0].mesh.frame);assert.deepEqual(f.px.sun,fields[0].px.sun);for(const key of ['radius','top','h'])assert.equal(f.px[key],fields[0].px[key]);assert.equal(nodes[b].length,f.g.nodes.length);});
 // A low wavelength may use analytic CS while later bands use measured tables.
 // Share the union of every active source-phase knot, not just band0's table.
 const knots=fields.flatMap(f=>f.px.table?.mu??[]).sort((a,b)=>a-b),phaseKnots=knots.filter((x,i)=>i===0||x-knots[i-1]>1e-12),partition=phaseKnots.length?{...fields[0],px:{...fields[0].px,table:{mu:phaseKnots}}}:fields[0];
 const context=queryContext(fields[0]),models=fields.map((f,b)=>plannedModel(f,nodes[b],factored)),size=(L+1)*(L+2)/2,coefficients=fields.map(()=>({L,real:[new Float64Array(size),new Float64Array(size)],imag:[new Float64Array(size),new Float64Array(size)]}));
 const renderer=await page.evaluate(spectralQueryResident,{action:'init',L,queryShader:spectralQueryShader(),fourierShader:spectralFourierShader()});let rings=0,count=0,prepareMilliseconds=0,dispatchMilliseconds=0,reduceMilliseconds=0,peakOwnedTextureBytes=0;const started=Date.now();
 try{
  for(const row of projectionGrid(partition,L,n)){
   if(rings%8===0)run.progress('spectral-source-projection',`bands${fields.length} latitude${rings} queries${count}`);let start=Date.now();const prepare=ringQueries(fields[0],context,row.mu),plans=[],quadrature=[];
   for(const arc of row.arcs){const q=gauss(arc.n);for(let j=0;j<q.nodes.length;j++){const phi=arc.a+(arc.b-arc.a)*q.nodes[j];plans.push(prepare(phi));quadrature.push(phi,(arc.b-arc.a)*q.weights[j],0,0);}}
   const packet=spectralQueryPacket(fields,models,plans,quadrature,factored);bridge.state.input=Buffer.from(packet.data.buffer);bridge.state.peakBytes=Math.max(bridge.state.peakBytes,packet.data.byteLength);bridge.state.totalBytes+=packet.data.byteLength;prepareMilliseconds+=Date.now()-start;
   const {data,...meta}=packet;start=Date.now();const got=await page.evaluate(spectralQueryResident,{...meta,url:bridge.state.url});dispatchMilliseconds+=Date.now()-start;peakOwnedTextureBytes=Math.max(peakOwnedTextureBytes,got.bytes);start=Date.now();const modes=fields.map(()=>new Float64Array((L+1)*4));
   for(let b=0;b<fields.length;b++)for(let part=0;part<got.chunks;part++)for(let m=0;m<=L;m++)for(let k=0;k<4;k++)modes[b][m*4+k]+=got.values[((b*got.chunks+part)*(L+1)+m)*4+k];
   const Q=latitude(row.mu,L);for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weight=row.weight*Q[at];for(let b=0;b<fields.length;b++){const c=coefficients[b],v=modes[b];c.real[0][at]+=weight*v[m*4];c.imag[0][at]+=weight*v[m*4+1];c.real[1][at]+=weight*v[m*4+2];c.imag[1][at]+=weight*v[m*4+3];}}
   reduceMilliseconds+=Date.now()-start;rings++;count+=plans.length;
  }
 }finally{await page.evaluate(spectralQueryResident,{action:'close'});}
 return {coefficients,rings,count,phaseKnots,ringsOwner:'Union of actual geometry and every active wavelength source-phase knot',renderer,timings:{prepareMilliseconds,dispatchMilliseconds,reduceMilliseconds,milliseconds:Date.now()-started},peakOwnedTextureBytes,binary:{peakBytes:bridge.state.peakBytes,totalBytes:bridge.state.totalBytes}};
}
