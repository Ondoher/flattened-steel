import {gauss,rotate,miePhase,dot} from '../interior-illumination/physics.mjs';
import {inverse} from '../interior-illumination/proposal.mjs';
const tau=2*Math.PI,width=.02;
/** Deterministic positive mixture quadrature. Independently split physical
 * ground/horizontal azimuth crossings; actual phase CDF knots remain explicit.
 * This is an operator-convergence probe, not new independent atmospheric truth.
 * @param {any} f @param {number} n @returns {Generator<any>} */
export function* mixtureQuadrature(f,n){
 const p=f.px,h=f.mesh.horizon,lo=Math.atan((-1-h)/width),span=Math.atan((1-h)/width)-lo,q=gauss(n),cdf=x=>(Math.atan((x-h)/width)-lo)/span;
 const density=d=>(1/(4*Math.PI)+miePhase(p.table,dot(d,p.sun))+miePhase(p.table,dot(d,f.out))+width/(tau*span*(width*width+(d[2]-h)**2)))/4;
 for(let component=0;component<4;component++){
  const axis=component===1?f.out:component===2?p.sun:[0,0,1],panels=[0,1];
  if(component===0)panels.push((h+1)/2,.5);else if(component===3)panels.push(cdf(h),cdf(0));else if(p.table){let s=0;for(let i=1;i<p.table.mu.length-1;i++){s+=(p.table.mu[i]-p.table.mu[i-1])*(p.table.pdf[i]+p.table.pdf[i-1])/2;if(s>0&&s<1)panels.push(s);}}
  panels.sort((a,b)=>a-b);const cuts=panels.filter((x,i)=>i===0||x-panels[i-1]>1e-14);
  for(let panel=1;panel<cuts.length;panel++)for(let i=0;i<n;i++){
   const u=cuts[panel-1]+(cuts[panel]-cuts[panel-1])*q.nodes[i],mu=component===0?2*u-1:component===3?h+width*Math.tan(lo+u*span):inverse(p.table,u),A=axis[2]*mu,B=rotate(mu,0,axis)[2]-A,C=rotate(mu,Math.PI/2,axis)[2]-A,r=Math.hypot(B,C),center=Math.atan2(C,B),phis=[0,tau];
   if(r>1e-14)for(const boundary of [h,0]){const x=(boundary-A)/r;if(x>-1&&x<1)for(const sign of [-1,1]){let phi=(center+sign*Math.acos(x))%tau;if(phi<0)phi+=tau;phis.push(phi);}}
   phis.sort((a,b)=>a-b);const arcs=phis.filter((x,j)=>j===0||x-phis[j-1]>1e-13);
   for(let arc=1;arc<arcs.length;arc++)for(let j=0;j<n;j++){const phi=arcs[arc-1]+(arcs[arc]-arcs[arc-1])*q.nodes[j],d=rotate(mu,phi,axis),w=.25*(cuts[panel]-cuts[panel-1])*q.weights[i]*(arcs[arc]-arcs[arc-1])*q.weights[j]/tau/density(d);yield {d,w,component,panel,arc};}
  }
 }
}
