import assert from 'node:assert/strict';
import {queryContext,plannedModel} from './query-plan.mjs';
import {ringQueries} from './query-ring-plan.mjs';
import {projectionGrid} from './harmonic-grid.mjs';
import {gauss} from '../interior-illumination/physics.mjs';
import {spectralQueryShader,spectralFourierShader,spectralQueryPacket,spectralQueryResident} from './query-spectral-gpu.mjs';
import {reusableSpectralPage} from './query-reusable.mjs';

/** Exact same-packet arithmetic with actual grow/shrink/reuse before a complete
 * implementation projection. Each evaluator owns one hardware context in turn.
 * @param {any} page @param {any} run @param {any} bridge @param {any} f
 * @param {number[][]} nodes @param {number} L @param {number} n
 * @returns {Promise<any[]>} */
export async function calibrateReusable(page,run,bridge,f,nodes,L,n){
 const context=queryContext(f),model=plannedModel(f,nodes),packets=new Map();let index=0;
 for(const row of projectionGrid(f,L,n)){if([0,311,933].includes(index)){run.progress('resident-reuse-calibration',`prepare latitude${index}`);const prepare=ringQueries(f,context,row.mu),plans=[],quad=[];for(const arc of row.arcs){const q=gauss(arc.n);for(let j=0;j<q.nodes.length;j++){const phi=arc.a+(arc.b-arc.a)*q.nodes[j];plans.push(prepare(phi));quad.push(phi,(arc.b-arc.a)*q.weights[j],0,0);}}packets.set(index,spectralQueryPacket([f],[model],plans,quad));}if(index++>=933)break;}
 const sequence=[933,0,311,933],baseline=[],checks=[];
 for(const reusable of [false,true]){const view=reusable?reusableSpectralPage(page):page;await view.evaluate(spectralQueryResident,{action:'init',L,queryShader:spectralQueryShader(),fourierShader:spectralFourierShader()});for(let j=0;j<sequence.length;j++){const packet=packets.get(sequence[j]),{data,...meta}=packet;bridge.state.input=Buffer.from(data.buffer);run.progress('resident-reuse-calibration',`${reusable?'reusable':'original'} latitude${sequence[j]}`);const got=await view.evaluate(spectralQueryResident,{...meta,url:bridge.state.url});if(!reusable)baseline.push(got);else{assert.deepEqual(got.values,baseline[j].values,'Persistent allocation changes an actual partial Fourier output');checks.push({latitude:sequence[j],count:meta.count,identical:true,originalTextureBytes:baseline[j].bytes,reusableTextureBytes:got.bytes});}}await view.evaluate(spectralQueryResident,{action:'close'});}
 return checks;
}
