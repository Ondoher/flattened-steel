import assert from 'node:assert/strict';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {dot,cross,unit} from '../numerics/math.js';
import {admission as smoothAdmission} from '../f68-overlay/rules.mjs';

const rules=new Map();
/** Immutable mathematical nodes, cached by exact order. @param {number} n @returns {any} */
function quadrature(n){if(!rules.has(n)){const q=gauss(n),pairs=q.nodes.map((x,i)=>[x,q.weights[i]]).sort((a,b)=>a[0]-b[0]);rules.set(n,{nodes:pairs.map(p=>p[0]),weights:pairs.map(p=>p[1])});}return rules.get(n);}
/** Sun-frame basis, with a deterministic up-alignment fallback. @param {number[]} axis @returns {any} */
export function frame(axis){const s=[...unit(axis)],a=s[2],p=[-a*s[0],-a*s[1],1-a*s[2]],fallback=Math.hypot(...p)<1e-10,u=unit(fallback?[1,0,0].map((x,j)=>x-s[0]*s[j]):p),v=unit(cross(s,u));assert.ok(Math.abs(dot(u,s))<1e-10);return {s,u:[...u],v:[...v],a,fallback};}
/** Physical horizon cosine for an incoming look ray. @param {number} h @param {number} radius @returns {number} */
export const horizon=(h,radius)=>-Math.sqrt(Math.max(0,h)*(2*radius+Math.max(0,h)))/(radius+Math.max(0,h));
/** Physical Sun cosine, its inverse and dOmega Jacobian. @param {number} mu @param {number} k @returns {number} */
export const forward=(mu,k)=>((1-k*k)+(1+k*k)*mu)/(1+k*k+(1-k*k)*mu);
/** @param {number} m @param {number} k @returns {number} */
export const inverse=(m,k)=>((1+k*k)*m-(1-k*k))/((1+k*k)-(1-k*k)*m);
/** @param {number} mu @param {number} k @returns {number} */
export const jacobian=(mu,k)=>4*k*k/(1+k*k+(1-k*k)*mu)**2;
/** Ordered nonempty panels with measure-preserving treatment of repeated endpoints. @param {number[]} x @returns {number[]} */
function unique(x){const sorted=[...x].sort((a,b)=>a-b);return sorted.filter((v,i)=>i===0||v-sorted[i-1]>1e-12);}
/** @param {number[]} breaks @returns {number[]} */
function bisect(breaks){return breaks.flatMap((x,i)=>i<breaks.length-1?[x,(x+breaks[i+1])/2]:[x]);}
/** Allocate a fixed budget with >=2 Gauss nodes per nonempty panel. @param {number[]} breaks @param {number} n @returns {number[]} */
function allocation(breaks,n){const lengths=breaks.slice(1).map((v,i)=>v-breaks[i]),m=lengths.length;assert.ok(n>=2*m);const remaining=n-2*m,sum=lengths.reduce((s,x)=>s+x,0),real=lengths.map(x=>remaining*x/sum),counts=real.map(x=>2+Math.floor(x));let left=n-counts.reduce((s,x)=>s+x,0);const order=real.map((x,i)=>({i,f:x-Math.floor(x)})).sort((a,b)=>b.f-a.f||a.i-b.i);for(let j=0;j<left;j++)counts[order[j].i]++;assert.equal(counts.reduce((s,x)=>s+x,0),n);return counts;}
/** Panel Gauss rule at an exact fixed total order. @param {number[]} breaks @param {number} n @returns {any[]} */
function panels(breaks,n){const counts=allocation(breaks,n),out=[];for(let i=0;i<counts.length;i++){const lo=breaks[i],span=breaks[i+1]-lo,q=quadrature(counts[i]);for(let j=0;j<q.nodes.length;j++)out.push({x:lo+span*q.nodes[j],w:span*q.weights[j],panel:i});}return out;}
/** Physical polar tangencies, including aligned and coalescent limits. @param {number} a @param {number} c @returns {number[]} */
export function tangencies(a,c){const b=Math.sqrt(Math.max(0,(1-a*a)*(1-c*c)));return unique([a*c-b,a*c+b].map(x=>Math.max(-1,Math.min(1,x))));}
/** Ring boundary sectors in the projected-up frame. @param {number} m @param {number} a @param {number} c @returns {number[]} */
export function azimuthBreaks(m,a,c){const den=Math.sqrt(Math.max(0,(1-a*a)*(1-m*m)));if(den<1e-13)return [0,2*Math.PI];const q=(c-a*m)/den;if(q<=-1||q>=1)return [0,2*Math.PI];const phi=Math.acos(q);return unique([0,phi,2*Math.PI-phi,2*Math.PI]);}

/** Structured full-sphere directions in receiver-local coordinates. @param {any} config @param {any} target @param {number} radius @param {number} [placement] @returns {any} */
export function make(config,target,radius,placement=0){
 const f=frame(target.axis),k=config.k??.35,c=horizon(target.altitude,radius),polarSplit=['Bmu','Bmuphi','C','Cmu','CmuBphi','Bboth','BpolarBoth'].includes(config.kind),azimuthSplit=['Bphi','Bmuphi','C','Cphi','CmuBphi','Bboth','BpolarBoth'].includes(config.kind),shamPolar=['C','Cmu','CmuBphi'].includes(config.kind),shamAzimuth=['C','Cphi'].includes(config.kind);
 const horizontal=['Bboth','BpolarBoth'].includes(config.kind);
 let polarBreaks=polarSplit?shamPolar?[-1,-1/3,1/3,1]:unique([-1,...([...tangencies(f.a,c),...(horizontal?tangencies(f.a,0):[])]).map(m=>inverse(m,k)).filter(x=>x>-1+1e-12&&x<1-1e-12),1]):[-1,1];
 if(placement===1&&polarSplit)polarBreaks=bisect(polarBreaks);
 const polar=panels(polarBreaks,config.mu),nodes=[],weights=[],rings=[];
 for(let ring=0;ring<polar.length;ring++){
  const q=polar[ring],m=forward(q.x,k),r=Math.sqrt(Math.max(0,1-m*m));let azimuth;
  let breaks=azimuthSplit?shamAzimuth?[0,Math.PI,2*Math.PI]:azimuthBreaks(m,f.a,c):[0,2*Math.PI];
  if(config.kind==='Bboth')breaks=unique([...breaks,...azimuthBreaks(m,f.a,0)]);
  if(azimuthSplit){if(placement===1)breaks=bisect(breaks);azimuth=panels(breaks,config.phi);}else azimuth=Array.from({length:config.phi},(_,j)=>({x:2*Math.PI*(j+(placement===1?.5:0))/config.phi,w:2*Math.PI/config.phi,panel:0}));
  assert.ok(Math.abs(azimuth.reduce((s,v)=>s+v.w,0)-2*Math.PI)<1e-11);
  rings.push({mu:q.x,m,polarWeight:q.w,polarPanel:q.panel,breaks,count:azimuth.length});
  for(const p of azimuth){const d=f.s.map((x,j)=>m*x+r*(Math.cos(p.x)*f.u[j]+Math.sin(p.x)*f.v[j]));nodes.push(d);weights.push(q.w*jacobian(q.x,k)*p.w);}
 }
 const area=weights.reduce((s,x)=>s+x,0),moments=[0,1,2].map(j=>nodes.reduce((s,d,i)=>s+d[j]*weights[i],0)/(4*Math.PI));assert.equal(nodes.length,config.mu*config.phi);assert.ok(weights.every(w=>Number.isFinite(w)&&w>0));assert.ok(nodes.every(d=>Math.abs(dot(d,d)-1)<1e-10));
 return {id:config.id,config,count:nodes.length,nodes,weights,axis:f.s,frame:f,k,horizon:c,polarBreaks,rings,placement,relativeArea:area/(4*Math.PI)-1,moments};
}

/** Admission plus exact-cap and off-axis diagnostics; no atmospheric measurements. @param {any} g @returns {any} */
export function admission(g){const smooth=smoothAdmission(g),c=g.horizon,cap=g.nodes.reduce((s,d,i)=>s+(d[2]>=c?g.weights[i]:0),0),capError=cap/(2*Math.PI*(1-c))-1,offAxis=[];
 for(const angle of [Math.PI/4,Math.PI/2])for(const sharpness of [64,256]){const axis=g.frame.s.map((x,j)=>Math.cos(angle)*x+Math.sin(angle)*g.frame.u[j]),exact=2*Math.PI*(-Math.expm1(-2*sharpness))/sharpness,value=g.nodes.reduce((s,d,i)=>s+g.weights[i]*Math.exp(sharpness*(dot(d,axis)-1)),0);offAxis.push({angle,sharpness,error:value/exact-1});}
 return {...smooth,capError,offAxis,local:smooth.local&&Math.abs(capError)<=.05,fine:smooth.fine&&Math.abs(capError)<=.02,gate:'Existing geometry/smooth gates plus horizon-cap5%local/2%fine; off-axis narrow lobes diagnostic only.'};
}
/** Mathematical map, panel, boundary-root and solver-sign checks. @returns {any} */
export function proof(){let inverseError=0,derivative=0,rootError=0,capError=0;const eps=1e-5;
 for(const k of [.2,.35,1])for(let i=0;i<41;i++){const x=-.98+i*1.96/40;inverseError=Math.max(inverseError,Math.abs(inverse(forward(x,k),k)-x));derivative=Math.max(derivative,Math.abs((forward(x+eps,k)-forward(x-eps,k))/(2*eps)/jacobian(x,k)-1));}
 for(const a of [-1,-1+1e-8,-.5,0,.5,1-1e-8,1])for(const h of [0,250,2500,12000]){const c=horizon(h,6360000);for(const m of tangencies(a,c)){const spread=Math.sqrt(Math.max(0,(1-a*a)*(1-m*m)));rootError=Math.max(rootError,Math.min(Math.abs(a*m+spread-c),Math.abs(a*m-spread-c)));}
  const t={axis:[Math.sqrt(Math.max(0,1-a*a)),0,a],altitude:h},g=make({id:'aligned-proof',kind:'Bmuphi',mu:64,phi:32},t,6360000);capError=Math.max(capError,Math.abs(g.nodes.reduce((s,d,i)=>s+(d[2]>=c?g.weights[i]:0),0)/(2*Math.PI*(1-c))-1));
 }
 assert.ok(inverseError<1e-12&&derivative<1e-7&&rootError<1e-8&&capError<.005);return {inverseError,derivative,rootError,capError,sign:'Incoming look ray ground hit iff muUp<negative physical tangent cosine, consistent with H67 initialEnd/directCpu.boundary.',limits:'Finite cap integration control; not atmospheric or native recurrence qualification.'};
}
