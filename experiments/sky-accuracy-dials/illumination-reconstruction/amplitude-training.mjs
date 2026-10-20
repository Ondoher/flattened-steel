import {setup,reconstruct,direction,channels} from './common.mjs';
/** Freeze refinement from the quantity actually reconstructed: source-phase-free
 * amplitude of the active profile's native nodal values. No reference/outgoing
 * weight enters selection. @param {any} r @param {string} profile @param {string} target
 * @param {(s:string)=>void} progress @returns {number[]} */
export function amplitudeTraining(r,profile,target,progress){
 const first=setup(r,profile,target,3),scores=Array(first.g.rings.length-1).fill(0);
 for(const channel of channels){
  progress(`${profile}/${target}/b${channel} amplitude curvature`);const f=setup(r,profile,target,channel);
  const values=f.g.rings.map((row,i)=>Array.from({length:32},(_,j)=>reconstruct(f,direction(f,row.m,2*Math.PI*(j+.5)/32),f.incidents).map((v,s)=>v/f.sourcePhases[i*64][s]))),parts=[scores.map(()=>0),scores.map(()=>0)];
  for(let i=1;i<f.g.rings.length-1;i++){
   const a=f.g.rings[i-1].m,b=f.g.rings[i].m,c=f.g.rings[i+1].m,t=(b-a)/(c-a);
   for(let j=0;j<32;j++)for(let s=0;s<2;s++){const chord=(1-t)*values[i-1][j][s]+t*values[i+1][j][s],v=Math.abs(values[i][j][s]-chord)*(c-a)/2;parts[s][i-1]+=v/2;parts[s][i]+=v/2;}
  }
  for(const a of parts){const total=a.reduce((s,x)=>s+x,0);if(total>0)a.forEach((v,i)=>scores[i]+=v/total/(2*channels.length));}
 }
 return scores;
}
