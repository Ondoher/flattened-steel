import assert from 'node:assert/strict';
import {angularGpu} from '../distant-horizon/attribution-reference.mjs';
import {shader as nativeShader} from '../incoming-sun/incident.mjs';
import {sourceFrame} from '../numerics/math.js';
import {reconstruct,direction} from './common.mjs';
/** @param {any[]} fields @param {any} run @returns {number[]} */
export function curvature(fields,run){const scores=Array(fields[0].g.rings.length-1).fill(0);for(const f of fields){run.progress('native-curvature',`b${f.packet.channel}`);const values=f.g.rings.map(row=>Array.from({length:32},(_,j)=>reconstruct(f,direction(f,row.m,2*Math.PI*(j+.5)/32),f.incidents))),parts=[scores.map(()=>0),scores.map(()=>0)];for(let i=1;i<f.g.rings.length-1;i++){const a=f.g.rings[i-1].m,b=f.g.rings[i].m,c=f.g.rings[i+1].m,t=(b-a)/(c-a);for(let j=0;j<32;j++)for(let s=0;s<2;s++){const v=Math.abs(values[i][j][s]-(1-t)*values[i-1][j][s]-t*values[i+1][j][s])*(c-a)/2;parts[s][i-1]+=v/2;parts[s][i]+=v/2;}}for(const a of parts){const total=a.reduce((s,x)=>s+x,0);if(total>0)a.forEach((v,i)=>scores[i]+=v/total/(2*fields.length));}}return scores;}

/** Trace the inherited native L1 operation at actual additional directions.
 * @param {any} page @param {any} run @param {any} f @param {number[][]} ds
 * @param {number} view @returns {Promise<any>} */
export async function trace(page,run,f,ds,view){const result=[],axes=sourceFrame(f.t.point),start=Date.now(),source=nativeShader(f.p.control.material.phaseTables[f.packet.channel],f.p.control.material.albedos[f.packet.channel]);for(let i=0;i<ds.length;i+=256){run.progress('native-L1',`${f.p.id}/${f.t.id}/b${f.packet.channel} ${view} ${i}/${ds.length}`);const directions=ds.slice(i,i+256).map(d=>[0,1,2].map(k=>d.reduce((s,x,j)=>s+x*axes[j][k],0))),x=await page.evaluate(angularGpu,source,{directions,origin:f.t.point,altitude:f.t.altitude,medium:{...f.p.control.medium,sourceDirection:[0,0,1]},channel:f.packet.channel,view});assert.ok(x.values.flat().every(v=>v>=0&&Number.isFinite(v)));result.push(...x.values);}return {values:result,milliseconds:Date.now()-start};}

