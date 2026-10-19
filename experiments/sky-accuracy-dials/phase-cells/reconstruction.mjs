import {curve} from './geometry.mjs';
import {dot} from '../numerics/math.js';

/** Positive, outgoing-independent reconstruction from unchanged retained nodes.
 * Every ring interpolation stays inside its original curved sector; donors
 * must share the query's physical ground/horizontal support. Clamp endpoints,
 * blend adjacent rings only when both are supported, never extrapolate.
 * @param {any} mesh @param {number[][]} incidents @param {'azimuth'|'bilinear'} mode
 * @returns {(m:number,x:number,y:number,index:number)=>number}
 */
export function reconstruction(mesh,incidents,mode){
 const frame=mesh.frame,kind=z=>(z>=mesh.horizon?1:0)+(z>=0?2:0),value=i=>incidents[i][0]+incidents[i][1],rings=mesh.rows.map(row=>({...row,sectors:row.sectors.map(s=>({...s,phis:s.indices.map(i=>{let p=Math.atan2(dot(mesh.list[i].node,frame.v),dot(mesh.list[i].node,frame.u));if(p<0)p+=2*Math.PI;return p;})}))}));
 const ringValue=(j,phi,cls)=>{const row=rings[j],radius=Math.sqrt(Math.max(0,1-row.m*row.m)),z=row.m*frame.s[2]+radius*(Math.cos(phi)*frame.u[2]+Math.sin(phi)*frame.v[2]);if(kind(z)!==cls)return null;for(const s of row.sectors){const l=curve(row.m,s.left,frame.a,mesh.horizon),r=curve(row.m,s.right,frame.a,mesh.horizon);if(phi<l||phi>r)continue;let lo=0,hi=s.indices.length-1;if(phi<=s.phis[lo])return value(s.indices[lo]);if(phi>=s.phis[hi])return value(s.indices[hi]);while(hi-lo>1){const mid=(lo+hi)>>1;if(phi<s.phis[mid])hi=mid;else lo=mid;}const t=(phi-s.phis[lo])/(s.phis[hi]-s.phis[lo]);return (1-t)*value(s.indices[lo])+t*value(s.indices[hi]);}return null;};
 return (m,x,y,index)=>{let phi=Math.atan2(y,x);if(phi<0)phi+=2*Math.PI;const cls=kind(m*frame.s[2]+x*frame.u[2]+y*frame.v[2]),fallback=value(index);if(mode==='azimuth')return ringValue(mesh.list[index].ring,phi,cls)??fallback;let lo=0,hi=rings.length-1;if(m<=rings[0].m)return ringValue(0,phi,cls)??fallback;if(m>=rings[hi].m)return ringValue(hi,phi,cls)??fallback;while(hi-lo>1){const mid=(lo+hi)>>1;if(m<rings[mid].m)hi=mid;else lo=mid;}const a=ringValue(lo,phi,cls),b=ringValue(hi,phi,cls);if(a===null)return b??fallback;if(b===null)return a;const t=(m-rings[lo].m)/(rings[hi].m-rings[lo].m);return (1-t)*a+t*b;};
}
