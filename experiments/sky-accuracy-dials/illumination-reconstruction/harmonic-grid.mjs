import assert from 'node:assert/strict';
import {gauss} from '../interior-illumination/physics.mjs';
import {curve} from '../phase-cells/geometry.mjs';
const tau=2*Math.PI;

/** Outgoing-independent projection quadrature follows the actual reconstruction
 * and physical-sector knots. Resolve harmonic oscillations separately from the
 * base numerical quadrature order. @param {any} f @param {number} L
 * @param {number} n @returns {Generator<any>} */
export function* projectionGrid(f,L,n){
 const b=f.bases.H100,bs=f.bases.sector,polar=[...b.polar,...bs.polar,...(f.px.table?.mu??[])].sort((a,b)=>a-b),cuts=polar.filter((x,i)=>i===0||x-polar[i-1]>1e-12);assert.ok(cuts[0]===-1&&cuts.at(-1)===1);
 for(let panel=1;panel<cuts.length;panel++){
  const lo=cuts[panel-1],span=cuts[panel]-lo,thetaSpan=Math.acos(lo)-Math.acos(cuts[panel]),order=Math.max(n,n+Math.ceil(L*thetaSpan/4)),q=gauss(order);
  for(let j=0;j<order;j++){
   const angle=Math.PI*q.nodes[j],mu=lo+span*(1-Math.cos(angle))/2,weight=span*Math.PI*Math.sin(angle)/2*q.weights[j],phis=[...b.cuts(mu),...bs.cuts(mu)];let hi=0;while(hi<b.rings.length-1&&b.rings[hi].m<mu)hi++;
   const rowIndex=f.mesh.rows.findIndex(row=>mu<=row.hi),query=f.mesh.rows[rowIndex<0?f.mesh.rows.length-1:rowIndex];
   for(const basis of [b,bs])for(let ring=Math.max(0,hi-2);ring<=Math.min(basis.rings.length-1,hi+1);ring++)for(const s of basis.rings[ring].sectors){
    if(basis.mode==='legacy')phis.push(...s.phis,curve(basis.rings[ring].m,s.left,f.mesh.frame.a,f.mesh.horizon),curve(basis.rings[ring].m,s.right,f.mesh.frame.a,f.mesh.horizon));
    else{const match=query.sectors.find(q=>JSON.stringify([q.left,q.right])===s.key);if(!match)continue;const ql=curve(mu,match.left,f.mesh.frame.a,f.mesh.horizon),qr=curve(mu,match.right,f.mesh.frame.a,f.mesh.horizon),a=curve(basis.rings[ring].m,s.left,f.mesh.frame.a,f.mesh.horizon),z=curve(basis.rings[ring].m,s.right,f.mesh.frame.a,f.mesh.horizon);for(const p of s.phis)phis.push(ql+(qr-ql)*(p-a)/(z-a));}
   }
   phis.sort((a,b)=>a-b);const phiCuts=phis.filter((x,i)=>Number.isFinite(x)&&x>=0&&x<=tau&&(i===0||x-phis[i-1]>1e-12)),arcs=[];
   for(let k=1;k<phiCuts.length;k++){const a=phiCuts[k-1],b=phiCuts[k];if(b-a>1e-13)arcs.push({a,b,n:n+Math.ceil(L*(b-a)/4)});}
   yield {mu,weight,arcs,panel};
  }
 }
}
