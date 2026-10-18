import assert from 'node:assert/strict';
import {dot,unit} from '../numerics/math.js';
import {warp} from '../outgoing-focus/geometry.mjs';
import {phase} from '../horizon-reference/math.mjs';

export const sunK=.35,horizonWidth=.1;
const pi=Math.PI;
/** @param {number} x @returns {number} */
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};

/** Deterministic even component counts, preserving total and proposal support.
 * @param {number} n @param {number[]} fractions @returns {number[]}
 */
export function allocate(n,fractions){
 assert.ok(n%2===0&&fractions.every(x=>x>0));const s=fractions.reduce((a,b)=>a+b,0),exact=fractions.map(x=>n*x/s/2),counts=exact.map(x=>Math.floor(x));
 const indices=[0,1,2].sort((a,b)=>(exact[b]-counts[b])-(exact[a]-counts[a])||a-b);
 const missing=n/2-counts.reduce((a,b)=>a+b,0);for(let j=0;j<missing;j++)counts[indices[j%3]]++;
 assert.equal(2*counts.reduce((a,b)=>a+b,0),n);assert.ok(counts.every(x=>x>0));return counts.map(x=>2*x);
}

/** Shared sphere generator, with fixed azimuth offset for independent production placement.
 * @param {number} n @param {number} [offset] @returns {number[][]}
 */
export function sphere(n,offset=0){
 assert.ok(n>=4&&n%2===0);const half=n/2,golden=pi*(3-Math.sqrt(5));
 return Array.from({length:half},(_,i)=>{const mu=-1+2*(i+.5)/half,phi=(half/2-i)*golden+offset,r=Math.sqrt(Math.max(0,1-mu*mu));return [[r*Math.cos(phi),r*Math.sin(phi),mu],[r*Math.cos(phi),-r*Math.sin(phi),mu]];}).flat();
}

/** Physical, altitude-dependent ground horizon and analytic mapping parameters.
 * @param {number} altitude @param {number} radius @returns {any}
 */
export function horizon(altitude,radius){const h=Math.max(0,altitude),center=-Math.sqrt(h*(2*radius+h))/(radius+h),lo=Math.atan((-1-center)/horizonWidth),hi=Math.atan((1-center)/horizonWidth);return {center,lo,span:hi-lo};}

/** Three normalized proposal densities per steradian at one physical direction.
 * @param {readonly number[]} d @param {readonly number[]} axis @param {any} h @returns {number[]}
 */
export function densities(d,axis,h){const js=(1+sunK*sunK-(1-sunK*sunK)*dot(d,axis))**2/(4*sunK*sunK),jh=.5*h.span*(horizonWidth*horizonWidth+(d[2]-h.center)**2)/horizonWidth;return [1,1/js,1/jh].map(x=>x/(4*pi));}

/** Geometry-only allocation, fixed identically across paper and Toronto.
 * @param {number} altitude @param {number[]} axis @param {number} radius @returns {number[]}
 */
export function geometryFractions(altitude,axis,radius){
 const h=horizon(altitude,radius),solarElevation=Math.asin(Math.max(-1,Math.min(1,axis[2]))),groundElevation=Math.asin(h.center),dusk=1-smooth(Math.abs(solarElevation-groundElevation)/(8*pi/180)),high=smooth((altitude-500)/4500),low=[64,96,96].map((x,i)=>x*(1-dusk)+[64,64,128][i]*dusk);
 return low.map((x,i)=>(x*(1-high)+[96,128,32][i]*high)/256);
}

/** Layered fixed-proposal quadrature; pilots are never mixed into scored production.
 * @param {number[]} counts @param {number[]} axis @param {number} altitude
 * @param {number} radius @param {number} [offset] @returns {any}
 */
export function grid(counts,axis,altitude,radius,offset=0){
 const h=horizon(altitude,radius),nodes=[],weights=[],components=[];
 for(let component=0;component<3;component++)for(const d of sphere(counts[component],offset)){
  let mapped=d;
  if(component===1)mapped=[...unit(warp(d,axis,sunK))];
  if(component===2){const mu=Math.max(-1,Math.min(1,h.center+horizonWidth*Math.tan(h.lo+h.span*(d[2]+1)/2))),phi=Math.atan2(d[1],d[0]),r=Math.sqrt(Math.max(0,1-mu*mu));mapped=[r*Math.cos(phi),r*Math.sin(phi),mu];}
  const q=densities(mapped,axis,h),w=1/counts.reduce((s,n,i)=>s+n*q[i],0);assert.ok(w>0&&Number.isFinite(w));nodes.push([...mapped]);weights.push(w);components.push(component);
 }
 const count=nodes.length,area=weights.reduce((s,w)=>s+w,0),moments=[0,1,2].map(j=>nodes.reduce((s,d,i)=>s+d[j]*weights[i],0)/(4*pi));
 return {counts,count,axis,altitude,radius,offset,horizon:h,nodes,weights,components,relativeArea:area/(4*pi)-1,moments};
}

/** Uniformly charged fixed A or geometry B configuration.
 * @param {string} method @param {number} n @param {number[]} axis @param {number} h @param {number} radius @param {number} [offset] @returns {any}
 */
export function fixed(method,n,axis,h,radius,offset=0){assert.ok(['A','B'].includes(method));return grid(allocate(n,method==='A'?[.25,.375,.375]:geometryFractions(h,axis,radius)),axis,h,radius,offset);}

/** Manufactured area/moment gate, independently of atmospheric radiance.
 * @param {any} g @param {boolean} [finalist] @returns {boolean}
 */
export function qualifies(g,finalist=false){const limit=finalist?.005:.02;return Math.abs(g.relativeArea)<=limit&&g.moments.every(x=>Math.abs(x)<=limit);}

/** Pilot allocation indicator, same rule for all profiles; no fitting to references.
 * @param {number[]} indicators @returns {number[]}
 */
export function responseFractions(indicators){const total=indicators.reduce((s,x)=>s+x,0);return total<=1e-8?[.25,.375,.375]:indicators.map((x,i)=>[.25,.125,.125][i]+.5*x/total);}

/** Cheap manufactured qualification at preregistered angular/altitude regimes.
 * @returns {any} All individual residuals, including failures.
 */
export function proof(){
 const rows=[];for(const altitude of [0,53.17505217343569,1200,8000])for(const elevation of [-8,-.5,.5,45]){
  const a=elevation*pi/180,axis=[Math.cos(a),0,Math.sin(a)];for(const method of ['A','B'])for(const n of [256,512,1024]){
   const g=fixed(method,n,axis,altitude,6360000),phaseDirections=[[0,0,1],[1,0,0],[-1,0,0]],phaseMasses=phaseDirections.map(v=>[0,1].map(species=>g.nodes.reduce((s,d,i)=>s+g.weights[i]*phase(dot(d,v),.7)[species],0)));
   rows.push({method,n,altitude,elevation,counts:g.counts,area:g.relativeArea,moments:g.moments,phaseMasses,eligible:qualifies(g),finalist:qualifies(g,true)});
  }
 }
 let inverseResidual=0,mixtureResidual=0,rotationResidual=0;
 for(const row of rows){const a=row.elevation*pi/180,axis=[Math.cos(a),0,Math.sin(a)],g=fixed(row.method,row.n,axis,row.altitude,6360000);for(const d of g.nodes){const back=warp(warp(d,axis,sunK),axis,1/sunK);inverseResidual=Math.max(inverseResidual,...d.map((x,i)=>Math.abs(x-back[i])));const q=densities(d,axis,g.horizon),den=g.counts.reduce((s,n,i)=>s+n*q[i],0);mixtureResidual=Math.max(mixtureResidual,Math.abs(g.counts.reduce((s,n,i)=>s+n*q[i]/den,0)-1));}
  // Rotation must preserve dot products, density measure and physical-direction identity.
  const theta=.43,c=Math.cos(theta),s=Math.sin(theta),rot=v=>[c*v[0]-s*v[1],s*v[0]+c*v[1],v[2]];
  for(const d of g.nodes.slice(0,16)){const q=densities(d,axis,g.horizon),qr=densities(rot(d),rot(axis),g.horizon);rotationResidual=Math.max(rotationResidual,...q.map((x,i)=>Math.abs(x-qr[i])));}
 }
 assert.ok(inverseResidual<1e-12&&mixtureResidual<1e-12&&rotationResidual<1e-10);
 return {rows,inverseResidual,mixtureResidual,rotationResidual,parameters:{sunK,horizonWidth,altitudeTransition:[500,5000],duskSeparationDegrees:8},gate:'2% area and each first moment for local work; .5% for1024 full-build finalist. Phase-lobe masses retained without hidden rescale.'};
}
