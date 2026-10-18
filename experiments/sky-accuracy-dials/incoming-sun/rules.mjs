import assert from 'node:assert/strict';
import {dot,unit} from '../numerics/math.js';
import {warp} from '../outgoing-focus/geometry.mjs';

export const counts=[68,256,1024],families=['ordinary','sun','hybrid'];
export const k=.35,horizonWidth=.1;

/** Pinned-latitude Fibonacci with exact source-plane reflection completion.
 * @param {number} n @param {any} original @returns {number[][]}
 */
function base(n,original){
 if(n===68)return original.unitVectors.map(v=>[...v]);
 assert.ok(n%2===0);const m=n/2,golden=Math.PI*(3-Math.sqrt(5));
 return Array.from({length:m},(_,i)=>{const mu=-1+2*i/m,phi=(m/2-i)*golden,r=Math.sqrt(Math.max(0,1-mu*mu));return [[r*Math.cos(phi),r*Math.sin(phi),mu],[r*Math.cos(phi),-r*Math.sin(phi),mu]];}).flat();
}

/** Forward-map physical solid-angle Jacobian, evaluated at the physical direction.
 * @param {readonly number[]} d @param {readonly number[]} axis @returns {number}
 */
function sunJac(d,axis){return (1+k*k-(1-k*k)*dot(d,axis))**2/(4*k*k);}

/** Physical ground-horizon cosine and truncated Cauchy inverse-CDF geometry.
 * @param {any} target @param {number} radius @returns {any}
 */
function horizon(target,radius){const h=Math.max(0,target.altitude),center=-Math.sqrt(h*(2*radius+h))/(radius+h),lo=Math.atan((-1-center)/horizonWidth),hi=Math.atan((1-center)/horizonWidth);return {center,lo,span:hi-lo};}

/** Physical horizon-map Jacobian dmuPhysical/dmuBase.
 * @param {number} mu @param {any} h @returns {number}
 */
function horizonJac(mu,h){return .5*h.span*(horizonWidth*horizonWidth+(mu-h.center)**2)/horizonWidth;}

/** Incoming local nodes and physical integration weights; no mass-fitting rescale.
 * @param {string} family @param {number} n @param {number[]} axis @param {any} target @param {any} control @returns {any}
 */
export function rule(family,n,axis,target,control){
 const original=control.request.transportSpec.domains.incoming,h=horizon(target,control.medium.radius),nodes=[],weights=[];
 if(family==='ordinary'){nodes.push(...base(n,original));weights.push(...(n===68?original.integrationWeightsSteradians:Array(n).fill(4*Math.PI/n)));}
 else if(family==='sun'){
  for(const d of base(n,original)){const mapped=unit(warp(d,axis,k));nodes.push([...mapped]);weights.push(4*Math.PI/n*sunJac(mapped,axis));}
 }else{
  assert.equal(family,'hybrid');const half=n/2;assert.ok(half%2===0);
  for(const component of ['sun','horizon'])for(const d of base(half,original)){
   let mapped;
   if(component==='sun')mapped=unit(warp(d,axis,k));
   else{const mu=Math.max(-1,Math.min(1,h.center+horizonWidth*Math.tan(h.lo+h.span*(d[2]+1)/2))),r=Math.sqrt(Math.max(0,1-mu*mu)),phi=Math.atan2(d[1],d[0]);mapped=[r*Math.cos(phi),r*Math.sin(phi),mu];}
   const reciprocalMixture=.5/sunJac(mapped,axis)+.5/horizonJac(mapped[2],h);
   nodes.push([...mapped]);weights.push(4*Math.PI/n/reciprocalMixture);
  }
 }
 assert.equal(nodes.length,n);assert.equal(weights.length,n);assert.ok(weights.every(w=>w>0&&Number.isFinite(w)));
 const area=weights.reduce((s,w)=>s+w,0),moments=[0,1,2].map(j=>nodes.reduce((s,d,i)=>s+d[j]*weights[i],0));
 return {family,count:n,axis,k,horizonWidth,horizon:h,nodes,weights,area,relativeArea:area/(4*Math.PI)-1,moments};
}

/** Independent inverse/Jacobian/mixture checks for the declared maps.
 * @returns {any} Maximum residuals, not a claim that finite quadrature integrates every field.
 */
export function proof(){
 let inverseError=0,sunDerivativeError=0,horizonDerivativeError=0,mixtureError=0;
 const target={altitude:53.17505217343569},h=horizon(target,6360000),axis=[0,0,1],eps=1e-5;
 for(let i=0;i<99;i++){
  const c=-.98+i*1.96/98,d=[Math.sqrt(1-c*c),0,c],mapped=warp(d,axis,k),back=warp(mapped,axis,1/k);inverseError=Math.max(inverseError,...d.map((v,j)=>Math.abs(v-back[j])));
  const f=x=>((1-k*k)+(1+k*k)*x)/(1+k*k+(1-k*k)*x),numeric=(f(c+eps)-f(c-eps))/(2*eps),jac=4*k*k/(1+k*k+(1-k*k)*c)**2;sunDerivativeError=Math.max(sunDerivativeError,Math.abs(numeric/jac-1));
  const hm=x=>h.center+horizonWidth*Math.tan(h.lo+h.span*(x+1)/2),mu=hm(c),hn=(hm(c+eps)-hm(c-eps))/(2*eps);horizonDerivativeError=Math.max(horizonDerivativeError,Math.abs(hn/horizonJac(mu,h)-1));
  const js=sunJac(mapped,axis),jh=horizonJac(mapped[2],h),mix=.5/js+.5/jh;mixtureError=Math.max(mixtureError,Math.abs(.5/js/mix+.5/jh/mix-1));
 }
 assert.ok(inverseError<1e-12&&sunDerivativeError<1e-7&&horizonDerivativeError<1e-7&&mixtureError<1e-14);
 return {inverseError,sunDerivativeError,horizonDerivativeError,mixtureError,measures:'Exact solid-angle change of variables; hybrid uses balance density .5*qSun+.5*qHorizon. Finite constant-field/moment residuals are measured rather than renormalized.'};
}
