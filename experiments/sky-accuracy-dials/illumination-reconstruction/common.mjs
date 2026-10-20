import assert from 'node:assert/strict';
import {setup,reconstruct,direction,channels} from '../reconstruction-mechanisms/common.mjs';
export * from '../reconstruction-mechanisms/common.mjs';
export const querySeed=684729181;

/** Use one active atmosphere's actual cached nodes only. Equal normalized
 * band/origin shares; a zero-signal share contributes zero, with deterministic
 * gap-index tie breaks in augmented(). No truth, outgoing phase or other profile.
 * @param {any} r @param {string} profile @param {string} target
 * @param {(s:string)=>void} progress @returns {number[]} */
export function activeTraining(r,profile,target,progress){
 const first=setup(r,profile,target,channels[0]),scores=Array(first.g.rings.length-1).fill(0);
 for(const channel of channels){
  progress(`${profile}/${target}/b${channel} active-profile curvature`);
  const f=setup(r,profile,target,channel);
  assert.equal(f.g.rings.length,first.g.rings.length);
  const values=f.g.rings.map(row=>Array.from({length:32},(_,j)=>reconstruct(f,direction(f,row.m,2*Math.PI*(j+.5)/32),f.incidents)));
  const parts=[scores.map(()=>0),scores.map(()=>0)];
  for(let i=1;i<f.g.rings.length-1;i++){
   const a=f.g.rings[i-1].m,b=f.g.rings[i].m,c=f.g.rings[i+1].m,t=(b-a)/(c-a);
   for(let j=0;j<32;j++)for(let s=0;s<2;s++){
    const chord=(1-t)*values[i-1][j][s]+t*values[i+1][j][s];
    const curvature=Math.abs(values[i][j][s]-chord)*(c-a)/2;
    parts[s][i-1]+=curvature/2;parts[s][i]+=curvature/2;
   }
  }
  for(const a of parts){const total=a.reduce((s,x)=>s+x,0);if(total>0)a.forEach((v,i)=>scores[i]+=v/total/(2*channels.length));}
 }
 assert.ok(scores.every(x=>x>=0&&Number.isFinite(x)));
 return scores;
}
