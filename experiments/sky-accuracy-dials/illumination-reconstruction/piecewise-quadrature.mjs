import {gauss,dot} from '../interior-illumination/physics.mjs';
import {curve} from '../phase-cells/geometry.mjs';
import {direction} from './common.mjs';
const tau=2*Math.PI;
/** Quadrature partition follows actual source-coordinate reconstruction knots,
 * physical sector boundaries, and outgoing phase knots/tangencies. Numerical
 * integration changes; reconstructed illumination and physical phase do not.
 * @param {any} f @param {number} n @returns {Generator<any>} */
export function* piecewiseQuadrature(f,n){
 const b=f.bases.H100,bs=f.bases.sector,table=f.px.table,nu=dot(f.mesh.frame.s,f.out),polar=[...b.polar,...bs.polar,...(table?.mu??[])];
 if(table)for(const k of table.mu){const d=Math.sqrt(Math.max(0,(1-nu*nu)*(1-k*k)));polar.push(nu*k-d,nu*k+d);}
 polar.sort((a,b)=>a-b);const muCuts=polar.filter((x,i)=>x>=-1&&x<=1&&(i===0||x-polar[i-1]>1e-12)),qm=gauss(Math.max(8,n)),qp=gauss(n);
 for(let panel=1;panel<muCuts.length;panel++)for(let j=0;j<qm.nodes.length;j++){
  const lo=muCuts[panel-1],span=muCuts[panel]-lo,angle=Math.PI*qm.nodes[j],m=lo+span*(1-Math.cos(angle))/2,jac=span*Math.PI*Math.sin(angle)/2*qm.weights[j],cuts=[...b.cuts(m),...bs.cuts(m)];
  let hi=0;while(hi<b.rings.length-1&&b.rings[hi].m<m)hi++;const rowIndex=f.mesh.rows.findIndex(row=>m<=row.hi),query=f.mesh.rows[rowIndex<0?f.mesh.rows.length-1:rowIndex];
  for(const basis of [b,bs])for(let ring=Math.max(0,hi-2);ring<=Math.min(basis.rings.length-1,hi+1);ring++)for(const s of basis.rings[ring].sectors){
   if(basis.mode==='legacy')cuts.push(...s.phis,curve(basis.rings[ring].m,s.left,f.mesh.frame.a,f.mesh.horizon),curve(basis.rings[ring].m,s.right,f.mesh.frame.a,f.mesh.horizon));
   else{const match=query.sectors.find(q=>JSON.stringify([q.left,q.right])===s.key);if(!match)continue;const ql=curve(m,match.left,f.mesh.frame.a,f.mesh.horizon),qr=curve(m,match.right,f.mesh.frame.a,f.mesh.horizon),a=curve(basis.rings[ring].m,s.left,f.mesh.frame.a,f.mesh.horizon),z=curve(basis.rings[ring].m,s.right,f.mesh.frame.a,f.mesh.horizon);for(const p of s.phis)cuts.push(ql+(qr-ql)*(p-a)/(z-a));}
  }
  const A=m*nu,r=Math.sqrt(Math.max(0,1-m*m)),B=r*dot(f.mesh.frame.u,f.out),C=r*dot(f.mesh.frame.v,f.out),R=Math.hypot(B,C),center=Math.atan2(C,B);
  for(const k of [...(table?.mu??[]),A+R,A-R])if(R>1e-14){const q=(k-A)/R;if(q>=-1&&q<=1)for(const sign of [-1,1]){let phi=(center+sign*Math.acos(q))%tau;if(phi<0)phi+=tau;cuts.push(phi);}}
  cuts.sort((a,b)=>a-b);const phiCuts=cuts.filter((x,i)=>Number.isFinite(x)&&x>=0&&x<=tau&&(i===0||x-cuts[i-1]>1e-12));
  for(let a=1;a<phiCuts.length;a++)for(let k=0;k<n;k++){const width=phiCuts[a]-phiCuts[a-1];if(width<=1e-13)continue;const phi=phiCuts[a-1]+width*qp.nodes[k];yield {d:direction(f,m,phi),w:jac*width*qp.weights[k],panel,arc:a};}
 }
}
