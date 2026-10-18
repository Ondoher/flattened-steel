import assert from 'node:assert/strict';
import {dot,unit} from '../numerics/math.js';
import {warp} from '../outgoing-focus/geometry.mjs';
import {allocate} from '../adaptive-incoming/rules.mjs';

/** @param {number} x @returns {number} */
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};

/** Both registered placements use the identical reflection/azimuth convention.
 * @param {number} n @param {string} placement @param {number} offset @returns {number[][]}
 */
export function sphere(n,placement,offset){
 assert.ok(n%2===0&&n>=4);assert.ok(['endpoint','midpoint'].includes(placement));const m=n/2,golden=Math.PI*(3-Math.sqrt(5));
 return Array.from({length:m},(_,i)=>{const mu=-1+2*(i+(placement==='midpoint'?.5:0))/m,phi=(m/2-i)*golden+offset,r=Math.sqrt(Math.max(0,1-mu*mu));return [[r*Math.cos(phi),r*Math.sin(phi),mu],[r*Math.cos(phi),-r*Math.sin(phi),mu]];}).flat();
}

/** Registered physical horizon parameters; width is radial cosine, never degrees.
 * @param {number} altitude @param {number} radius @param {number} width @returns {any}
 */
export function horizon(altitude,radius,width){const h=Math.max(0,altitude),center=-Math.sqrt(h*(2*radius+h))/(radius+h),lo=Math.atan((-1-center)/width),hi=Math.atan((1-center)/width);return {center,lo,span:hi-lo,width};}

/** Exact proposal densities in physical solid angle.
 * @param {readonly number[]} d @param {readonly number[]} axis @param {any} h @param {number} k @returns {number[]}
 */
export function densities(d,axis,h,k){const js=(1+k*k-(1-k*k)*dot(d,axis))**2/(4*k*k),jh=.5*h.span*(h.width*h.width+(d[2]-h.center)**2)/h.width;return [1,1/js,1/jh].map(x=>x/(4*Math.PI));}

/** Smooth geometry allocation; identical physical rule for both atmospheres.
 * @param {number[]} axis @param {number} altitude @param {number} radius @param {string} allocation @returns {number[]}
 */
export function fractions(axis,altitude,radius,allocation){
 if(allocation==='fixed-heavy')return [32,160,64];
 const h=horizon(altitude,radius,.1),separation=Math.abs(Math.asin(axis[2])-Math.asin(h.center)),dusk=1-smooth(separation/(8*Math.PI/180)),high=smooth((altitude-500)/4500),sets=allocation==='old-B'?[[64,96,96],[64,64,128],[96,128,32]]:allocation==='sparse-dusk'?[[32,192,32],[4,236,16],[64,176,16]]:[[32,192,32],[32,160,64],[64,176,16]];
 return sets[0].map((x,i)=>(x*(1-dusk)+sets[1][i]*dusk)*(1-high)+sets[2][i]*high);
}

/** Build a complete registered rule, with optional inherited Sun stream.
 * @param {any} config @param {any} target @param {number} radius @param {number} [offset] @returns {any}
 */
export function make(config,target,radius,offset=0){
 const width=config.width??.1,placement=config.placement??'midpoint',h=horizon(target.altitude,radius,width),axis=target.axis,high=smooth((target.altitude-500)/4500),dusk=1-smooth(Math.abs(Math.asin(axis[2])-Math.asin(h.center))/(8*Math.PI/180)),k=config.focusMode==='geometry'?.2+.15*(1-(1-high)*dusk):config.k??.35;
 let counts=config.counts;
 if(!counts)counts=config.kind==='sun'?[0,config.n,0]:allocate(config.n,fractions(axis,target.altitude,radius,config.allocation));
 assert.ok(counts.every(n=>n===0||n>=4&&n%2===0));const nodes=[],weights=[],components=[];
 for(let component=0;component<3;component++)if(counts[component])for(const d of sphere(counts[component],component===1?(config.sunPlacement??placement):placement,offset+(config.componentOffsets?.[component]??0))){
  let mapped=d;if(component===1)mapped=[...unit(warp(d,axis,k))];if(component===2){const mu=Math.max(-1,Math.min(1,h.center+width*Math.tan(h.lo+h.span*(d[2]+1)/2))),r=Math.sqrt(Math.max(0,1-mu*mu)),phi=Math.atan2(d[1],d[0]);mapped=[r*Math.cos(phi),r*Math.sin(phi),mu];}
  const q=densities(mapped,axis,h,k),weight=1/counts.reduce((s,n,i)=>s+n*q[i],0);assert.ok(weight>0&&Number.isFinite(weight));nodes.push(mapped);weights.push(weight);components.push(component);
 }
 const area=weights.reduce((a,b)=>a+b,0),moments=[0,1,2].map(j=>nodes.reduce((s,d,i)=>s+d[j]*weights[i],0)/(4*Math.PI));
 return {count:nodes.length,counts,nodes,weights,components,axis,altitude:target.altitude,radius,placement,sunPlacement:config.sunPlacement??placement,k,width,offset,horizon:h,relativeArea:area/(4*Math.PI)-1,moments};
}

/** Mandatory manufactured preflight, before every actual incident evaluation.
 * @param {any} g @param {boolean} [fine] @returns {boolean}
 */
export function eligible(g,fine=false){const tolerance=fine?.005:.02;return Math.abs(g.relativeArea)<=tolerance&&g.moments.every(x=>Math.abs(x)<=tolerance);}

/** Numerical analytic map checks independent of atmospheric scores.
 * @returns {any}
 */
export function proof(){
 let inverse=0,jacobian=0,massIdentity=0;const eps=1e-5;
 for(const k of [.2,.35,.5])for(const width of [.01,.03,.1])for(const altitude of [0,250,2500,12000]){
  const h=horizon(altitude,6360000,width),axis=[1,0,0];for(let i=0;i<41;i++){
   const mu=-.95+1.9*i/40,d=[Math.sqrt(1-mu*mu),0,mu],mapped=warp(d,axis,k),back=warp(mapped,axis,1/k);inverse=Math.max(inverse,...d.map((x,j)=>Math.abs(x-back[j])));
   const f=x=>h.center+width*Math.tan(h.lo+h.span*(x+1)/2),physical=f(mu),numeric=(f(mu+eps)-f(mu-eps))/(2*eps),analytic=.5*h.span*(width*width+(physical-h.center)**2)/width;jacobian=Math.max(jacobian,Math.abs(numeric/analytic-1));
   const q=densities(d,axis,h,k),counts=[128,640,256],den=counts.reduce((s,n,j)=>s+n*q[j],0);massIdentity=Math.max(massIdentity,Math.abs(counts.reduce((s,n,j)=>s+n*q[j]/den,0)-1));
  }
 }
 assert.ok(inverse<1e-12&&jacobian<1e-6&&massIdentity<1e-12);return {inverse,jacobian,massIdentity,limits:'Analytic map identities, not finite phase-lobe/integrand accuracy.'};
}
