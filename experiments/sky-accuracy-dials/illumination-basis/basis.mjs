import assert from 'node:assert/strict';
import {curve} from '../phase-cells/geometry.mjs';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {dot} from '../numerics/math.js';
const tau=2*Math.PI;
/** @typedef {number[][]} Stencil Each entry is [node index, nonnegative weight]. */
/** Explicit positive nodal basis. Legacy mode reproduces H100 including fallback.
 * Sector mode transports the same normalized physical-sector azimuth across rings.
 * @param {any} mesh @param {'legacy'|'sector'} [mode] @returns {any}
 */
export function basis(mesh,mode='legacy'){
 const kind=z=>(z>=mesh.horizon?1:0)+(z>=0?2:0),signature=s=>JSON.stringify([s.left,s.right]),rings=mesh.rows.map(row=>({...row,sectors:row.sectors.map(s=>({...s,key:signature(s),phis:s.indices.map(i=>{let p=Math.atan2(dot(mesh.list[i].node,mesh.frame.v),dot(mesh.list[i].node,mesh.frame.u));return p<0?p+tau:p;})}))}));
 const bounds=(row,m)=>row.sectors.map(s=>({...s,l:curve(m,s.left,mesh.frame.a,mesh.horizon),r:curve(m,s.right,mesh.frame.a,mesh.horizon)}));
 const search=(m,key)=>{let lo=0,hi=rings.length-1;while(lo<hi){const j=(lo+hi)>>1;if(m<rings[j][key])hi=j;else lo=j+1;}return lo;};
 const rowPair=m=>{if(m<=rings[0].m)return [0,0];if(m>=rings.at(-1).m)return [rings.length-1,rings.length-1];const hi=search(m,'m');return [hi-1,hi];};
 const z=(m,p)=>m*mesh.frame.s[2]+Math.sqrt(Math.max(0,1-m*m))*(Math.cos(p)*mesh.frame.u[2]+Math.sin(p)*mesh.frame.v[2]);
 const cellAt=(m,p)=>{const row=rings[search(m,'hi')];for(const s of bounds(row,m)){if(p<s.l-1e-12||p>=s.r&&s!==undefined&&s.key!==row.sectors.at(-1).key)continue;if(s.r<=s.l)continue;const t=Math.max(0,Math.min(1,(p-s.l)/(s.r-s.l)));let lo=0,hi=s.indices.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(t<s.edges[mid+1])hi=mid;else lo=mid+1;}return {index:s.indices[lo],sector:s};}throw Error('Basis physical coverage gap');};
 const ringStencil=(j,p,cls,query)=>{const row=rings[j];let phi=p,selected;
  if(mode==='sector'){selected=row.sectors.find(s=>s.key===query.sector.key);if(!selected)return null;const l=curve(row.m,selected.left,mesh.frame.a,mesh.horizon),r=curve(row.m,selected.right,mesh.frame.a,mesh.horizon),t=(p-query.sector.l)/(query.sector.r-query.sector.l);phi=l+(r-l)*t;}
  if(kind(z(row.m,phi))!==cls)return null;
  for(const s of row.sectors){if(selected&&s!==selected)continue;const l=curve(row.m,s.left,mesh.frame.a,mesh.horizon),r=curve(row.m,s.right,mesh.frame.a,mesh.horizon);if(phi<l||phi>r)continue;let lo=0,hi=s.indices.length-1;if(phi<=s.phis[lo])return [[s.indices[lo],1]];if(phi>=s.phis[hi])return [[s.indices[hi],1]];while(hi-lo>1){const j=(lo+hi)>>1;if(phi<s.phis[j])hi=j;else lo=j;}const t=(phi-s.phis[lo])/(s.phis[hi]-s.phis[lo]);return [[s.indices[lo],1-t],[s.indices[hi],t]];}return null;};
 /** @param {number} m @param {number} phi @returns {Stencil} */
 const stencil=(m,phi)=>{const query=cellAt(m,phi),cls=kind(z(m,phi)),[lo,hi]=rowPair(m),a=ringStencil(lo,phi,cls,query),b=hi===lo?a:ringStencil(hi,phi,cls,query);if(a===null)return b??[[query.index,1]];if(b===null||hi===lo)return a;const t=(m-rings[lo].m)/(rings[hi].m-rings[lo].m);return [...a.map(([i,w])=>[i,w*(1-t)]),...b.map(([i,w])=>[i,w*t])];};
 const cuts=m=>{const row=rings[search(m,'hi')],[lo,hi]=rowPair(m),q=bounds(row,m),values=[0,tau];for(const s of q){values.push(s.l,s.r);for(const t of s.edges)values.push(s.l+(s.r-s.l)*t);}for(const j of new Set([lo,hi]))for(const s of rings[j].sectors){if(mode==='legacy'){values.push(curve(rings[j].m,s.left,mesh.frame.a,mesh.horizon),curve(rings[j].m,s.right,mesh.frame.a,mesh.horizon),...s.phis);}else{const target=q.find(x=>x.key===s.key);if(!target)continue;const l=curve(rings[j].m,s.left,mesh.frame.a,mesh.horizon),r=curve(rings[j].m,s.right,mesh.frame.a,mesh.horizon);for(const p of s.phis)values.push(target.l+(target.r-target.l)*(p-l)/(r-l));}}values.sort((a,b)=>a-b);return values.filter((x,i)=>Number.isFinite(x)&&x>=0&&x<=tau&&(i===0||x-values[i-1]>1e-12));};
 return {mesh,mode,rings,stencil,cuts,polar:[...new Set([-1,1,...rings.flatMap(r=>[r.lo,r.m,r.hi])])].sort((a,b)=>a-b)};
}
/** Generate a bounded polar-slab CSR quadrature block; coefficients are independent of outgoing direction and L.
 * @param {any} b @param {number} n @param {(s:string)=>void} progress
 * @returns {Generator<{offsets:Uint32Array,records:Float64Array,samples:number,slab:number}>}
 */
export function* blocks(b,n,progress){const q=gauss(n);for(let slab=1;slab<b.polar.length;slab++){if(slab%16===1)progress(`basis${b.mode} n${n} slab${slab}/${b.polar.length-1}`);const lists=Array.from({length:b.mesh.count},()=>[]),lo=b.polar[slab-1],span=b.polar[slab]-lo;let samples=0;
 for(let i=0;i<n;i++){const a=Math.PI*q.nodes[i],m=lo+span*(1-Math.cos(a))/2,jac=span*Math.PI*Math.sin(a)/2,rad=Math.sqrt(Math.max(0,1-m*m)),cuts=b.cuts(m);for(let c=1;c<cuts.length;c++){const l=cuts[c-1],width=cuts[c]-l;if(width<=1e-14)continue;for(let j=0;j<n;j++){const p=l+width*q.nodes[j],x=rad*Math.cos(p),y=rad*Math.sin(p),weight=q.weights[i]*q.weights[j]*jac*width;for(const [index,k] of b.stencil(m,p)){assert.ok(k>=0&&Number.isFinite(k));if(k>0)lists[index].push(m,x,y,weight*k);}samples++;}}}
 const offsets=new Uint32Array(b.mesh.count+1);for(let i=0;i<lists.length;i++)offsets[i+1]=offsets[i]+lists[i].length/4;const records=new Float64Array(4*offsets.at(-1));for(let i=0;i<lists.length;i++)records.set(lists[i],4*offsets[i]);yield {offsets,records,samples,slab};
}}
