import assert from 'node:assert/strict';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {aerosolPhase} from '../horizon/aerosol-optics.mjs';
import {phase} from '../horizon-reference/math.mjs';
import {curve} from './geometry.mjs';

/** Exact azimuth integral of the piecewise-linear cosine phase table.
 * Split every crossed table knot and turning point; average the affine PDF
 * using the analytic cosine integral. No material refit or mass rescaling.
 * @param {any} table @param {number} a @param {number} b @param {number} center
 * @param {number} lo @param {number} hi @returns {number}
 */
export function azimuthIntegral(table,a,b,center,lo,hi){
 if(b<1e-18)return aerosolPhase(table,Math.max(-1,Math.min(1,a)))*(hi-lo);
 const points=[lo,hi],at=p=>a+b*Math.cos(p-center);for(let turn=-2;turn<=3;turn++){const p=center+turn*Math.PI;if(p>lo&&p<hi)points.push(p);}points.sort((x,y)=>x-y);let sum=0;
 for(let part=1;part<points.length;part++){
  const l=points[part-1],h=points[part],min=Math.min(at(l),at(h)),max=Math.max(at(l),at(h)),cuts=[l,h];let left=0,right=table.mu.length;while(left<right){const mid=(left+right)>>1;if(table.mu[mid]<=min)left=mid+1;else right=mid;}
  for(let j=left;j<table.mu.length&&table.mu[j]<max;j++){const root=Math.acos(Math.max(-1,Math.min(1,(table.mu[j]-a)/b)));for(const sign of [-1,1]){let p=center+sign*root;p+=2*Math.PI*Math.ceil((l-p)/(2*Math.PI));if(p>l+1e-14&&p<h-1e-14)cuts.push(p);}}
  cuts.sort((x,y)=>x-y);for(let j=1;j<cuts.length;j++){const d=cuts[j]-cuts[j-1],mid=(cuts[j]+cuts[j-1])/2,half=d/2,sinc=Math.abs(half)<1e-5?1-half*half/6+half**4/120:Math.sin(half)/half,average=a+b*Math.cos(mid-center)*sinc;sum+=d*aerosolPhase(table,Math.max(-1,Math.min(1,average)));}
 }
 return sum;
}

/** Binary64 physical-cell quadrature with endpoint smoothing and local refinement.
 * Independent from outgoing-CDF membership integration. Never rescale weights.
 * @param {any} mesh @param {number[]} out Sun-frame components
 * @param {any} table @param {(s:string)=>void} progress @returns {any}
 */
export function weights64(mesh,out,table,progress){
 const start=Date.now(),orders=[4,8,16,32,64,128,256,512],rules=orders.map(n=>{if(n<=256)return gauss(n);const q=gauss(256);return {nodes:[...q.nodes.map(x=>x/2),...q.nodes.map(x=>(x+1)/2)],weights:[...q.weights.map(x=>x/2),...q.weights.map(x=>x/2)]};}),weights=[],previous=[],previous2=[],unresolved=[],histogram={};let evaluations=0;
 for(const cell of mesh.list){if(cell.id%128===0)progress(`binary64 cell ${cell.id}/${mesh.count}`);const values=[];
  for(let level=0;level<orders.length;level++){
   const q=rules[level];let sum=0,comp=0;
   for(let i=0;i<q.nodes.length;i++){
    const angle=Math.PI*q.nodes[i],m=cell.lo+(cell.hi-cell.lo)*(1-Math.cos(angle))/2,jac=(cell.hi-cell.lo)*Math.PI*Math.sin(angle)/2,l=curve(m,cell.left,mesh.frame.a,mesh.horizon),span=curve(m,cell.right,mesh.frame.a,mesh.horizon)-l,rad=Math.sqrt(Math.max(0,1-m*m));
    if(table){const phiLo=l+span*cell.tlo,phiHi=l+span*cell.thi,integral=azimuthIntegral(table,m*out[0],rad*Math.hypot(out[1],out[2]),Math.atan2(out[2],out[1]),phiLo,phiHi),value=q.weights[i]*jac*integral,y=value-comp,t=sum+y;comp=(t-sum)-y;sum=t;continue;}
    for(let j=0;j<q.nodes.length;j++){
     const phi=l+span*(cell.tlo+(cell.thi-cell.tlo)*q.nodes[j]),c=Math.max(-1,Math.min(1,m*out[0]+rad*(Math.cos(phi)*out[1]+Math.sin(phi)*out[2]))),P=table?aerosolPhase(table,c):phase(c,.7)[1],value=q.weights[i]*q.weights[j]*jac*span*(cell.thi-cell.tlo)*P,y=value-comp,t=sum+y;comp=(t-sum)-y;sum=t;
    }
   }
   evaluations+=table?q.nodes.length:q.nodes.length**2;values.push(sum);const tolerance=1e-10+1e-8*sum;
   if(level>=2&&Math.abs(sum-values.at(-2))<=tolerance&&Math.abs(values.at(-2)-values.at(-3))<=tolerance)break;
  }
  const n=orders[values.length-1],w=values.at(-1);assert.ok(w>=0&&Number.isFinite(w));weights.push(w);previous.push(values.at(-2));previous2.push(values.at(-3));histogram[n]=(histogram[n]??0)+1;if(n===512&&(Math.abs(w-values.at(-2))>1e-10+1e-8*w||Math.abs(values.at(-2)-values.at(-3))>1e-10+1e-8*w))unresolved.push(cell.id);
 }
 const mass=weights.reduce((s,x)=>s+x,0),TV=weights.reduce((s,x,i)=>s+Math.abs(x-previous[i]),0),TV2=previous.reduce((s,x,i)=>s+Math.abs(x-previous2[i]),0);
 return {weights,previous,previous2,mass,massError:mass-1,TV,TV2,histogram,unresolved,evaluations,milliseconds:Date.now()-start,admitted:Math.abs(mass-1)<=1e-6&&TV<=5e-4&&TV2<=5e-4,method:'Binary64 physical-cell Gauss4..256 then two-panel composite256 (512nodes), cosine endpoint smoothing. Toronto azimuth integral exact between phase-table knots; paper tensor quadrature. Two successive per-cell differences <=1e-10+1e-8K; empirical diagnostics, no mass rescaling.'};
}
