import assert from 'node:assert/strict';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {aerosolPhase} from '../horizon/aerosol-optics.mjs';
import {phase} from '../horizon-reference/math.mjs';
/** Exact zeroth and first azimuth moments for Toronto's affine cosine PDF.
 * @param {any} table @param {number} a @param {number} b @param {number} center
 * @param {number} lo @param {number} hi @returns {number[]}
 */
export function tableMoments(table,a,b,center,lo,hi){
 if(b<1e-18){const p=aerosolPhase(table,Math.max(-1,Math.min(1,a))),d=hi-lo;return [d*p,d*d*p/2];}
 const turns=[lo,hi],at=p=>a+b*Math.cos(p-center);for(let j=-2;j<=3;j++){const p=center+j*Math.PI;if(p>lo&&p<hi)turns.push(p);}turns.sort((x,y)=>x-y);let I0=0,I1=0;
 for(let part=1;part<turns.length;part++){const l=turns[part-1],h=turns[part],min=Math.min(at(l),at(h)),max=Math.max(at(l),at(h)),cuts=[l,h];let left=0,right=table.mu.length;while(left<right){const mid=(left+right)>>1;if(table.mu[mid]<=min)left=mid+1;else right=mid;}
 for(let j=left;j<table.mu.length&&table.mu[j]<max;j++){const root=Math.acos(Math.max(-1,Math.min(1,(table.mu[j]-a)/b)));for(const sign of [-1,1]){let p=center+sign*root;p+=2*Math.PI*Math.ceil((l-p)/(2*Math.PI));if(p>l+1e-14&&p<h-1e-14)cuts.push(p);}}
 cuts.sort((x,y)=>x-y);for(let j=1;j<cuts.length;j++){const mid=(cuts[j]+cuts[j-1])/2,half=(cuts[j]-cuts[j-1])/2,c=Math.max(-1,Math.min(1,at(mid)));let low=0,high=table.mu.length-1;while(high-low>1){const k=(low+high)>>1;if(c>=table.mu[k])low=k;else high=k;}
 const slope=(table.pdf[high]-table.pdf[low])/(table.mu[high]-table.mu[low])/(2*Math.PI),P=aerosolPhase(table,c),x=half*half,sincMinusOne=Math.abs(half)<.001?-x/6+x*x/120-x*x*x/5040:Math.sin(half)/half-1,odd=Math.abs(half)<.001?-half*x/3+half*x*x/30-half*x*x*x/840:half*Math.cos(half)-Math.sin(half),v=2*half*(P+slope*b*Math.cos(mid-center)*sincMinusOne),first=(mid-lo)*v+2*slope*b*Math.sin(mid-center)*odd;
 I0+=v;I1+=first;}}
 assert.ok(Number.isFinite(I0)&&I0>=0);return [I0,I1];
}
/** Qualified small binary64 calibration route. Phase-weighted azimuth centroid
 * integrates each affine basis segment exactly once its phase moments are known.
 * @param {any} b @param {any[]} fields @param {number} n @param {(s:string)=>void} progress
 * @returns {any}
 */
export function momentWeights(b,fields,n,progress){const start=Date.now(),q=gauss(n),phiRule=gauss(Math.min(256,Math.max(8,n))),weights=fields.map(()=>new Float64Array(b.mesh.count));let patches=0,phaseEvaluations=0,minimumWeight=1;
 const critical=[];for(const f of fields)if(f.table)for(const mu of f.table.mu){const center=f.outgoing[0]*mu,spread=Math.hypot(f.outgoing[1],f.outgoing[2])*Math.sqrt(Math.max(0,1-mu*mu));critical.push(center-spread,center+spread);}const all=[...b.polar,...critical.filter(x=>x>-1&&x<1)].sort((a,b)=>a-b),polar=all.filter((x,i)=>i===0||x-all[i-1]>1e-13);
 for(let slab=1;slab<polar.length;slab++){if(slab%8===1)progress(`moment order${n} slab${slab}/${polar.length-1}`);const lo=polar[slab-1],span=polar[slab]-lo;
 for(let i=0;i<n;i++){const angle=Math.PI*q.nodes[i],m=lo+span*(1-Math.cos(angle))/2,jac=q.weights[i]*span*Math.PI*Math.sin(angle)/2,rad=Math.sqrt(Math.max(0,1-m*m)),cuts=b.cuts(m);
 for(let p=1;p<cuts.length;p++){const l=cuts[p-1],h=cuts[p],width=h-l;if(width<=1e-14)continue;patches++;
 fields.forEach((f,k)=>{const out=f.outgoing,a=m*out[0],bb=rad*Math.hypot(out[1],out[2]),center=Math.atan2(out[2],out[1]);let zero=0,first=0;if(f.table){[zero,first]=tableMoments(f.table,a,bb,center,l,h);}else{for(let j=0;j<phiRule.nodes.length;j++){const t=width*phiRule.nodes[j],P=phase(Math.max(-1,Math.min(1,a+bb*Math.cos(l+t-center))),.7)[1],w=width*phiRule.weights[j]*P;zero+=w;first+=w*t;}phaseEvaluations+=phiRule.nodes.length;}
 if(zero===0)return;const mean=l+first/zero;assert.ok(mean>=l-1e-12&&mean<=h+1e-12);const st=b.stencil(m,mean);for(const [node,c] of st){assert.ok(c>=0);minimumWeight=Math.min(minimumWeight,c);weights[k][node]+=jac*zero*c;}});
 }}}
 return {weights:weights.map(x=>[...x]),milliseconds:Date.now()-start,patches,phaseEvaluations,minimumWeight,polarPanels:polar.length-1,method:'Binary64 split polar/node/support geometry plus phase-knot polar tangencies m=v0*mu +/- sqrt(1-v0^2)*sqrt(1-mu^2); exact Toronto phase-knot/turning-point zeroth and first azimuth moments; paper Gauss azimuth. Phase-centroid evaluation is exact for the affine basis on each declared segment. No normalization repair.'};}
