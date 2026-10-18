import {benchmarkRay,createPointStencilBuilder,viewPathIntervals} from '../numerics/view.js';

/** Smooth Sun-centered outgoing map; its inverse is obtained with reciprocal k.
 * @param {number[]} d @param {number[]} sun @param {number} k @returns {number[]}
 */
export function warp(d,sun,k){
 if(k===1)return d.slice();
 const c=d.reduce((s,v,i)=>s+v*sun[i],0),den=1+k*k+(1-k*k)*c;
 return d.map((v,i)=>(2*k*v+(1-k*k+(k-1)**2*c)*sun[i])/den);
}

/** Prepare query rows at each solar tap, preserving the original final-view operators.
 * @param {any} control @returns {any}
 */
export function plan(control){
 const witnesses=control.fullBoundary?control.scenes.flatMap((_,t)=>Array.from({length:81},(_,i)=>({t,x:Math.floor(i/9),y:i%9}))):control.witnesses;
 const queries=[],rays=[];
 for(const w of witnesses){const stencil=createPointStencilBuilder(control.request),g=benchmarkRay(control.request.transportSpec,control.scenes[w.t],w.x,w.y);
 const original=viewPathIntervals(control.request.transportSpec,g,'quadratic',30).map(({start,end})=>{const distance=(start+end)/2;return stencil.sample([g.origin[0]+g.direction[0]*distance,g.origin[1]+g.direction[1]*distance,g.origin[2]+g.direction[2]*distance],g.direction,end-start);});
 const p={coordinates:stencil.coordinates},r={...g,worldDirection:g.direction,samples:original};
 const samples=r.samples.map(s=>{const local=localFor(s.point,r.worldDirection),indices=[];
 for(let a=0;a<s.altitudeWeights.length;a++)for(let z=0;z<4;z++){const c=p.coordinates[s.indices[(a*4+z)*s.directionWeights.length]];indices.push(queries.length);queries.push([...local,c.y]);}
 return {...s,indices,directionWeights:[1]};});rays.push({...r,samples,witness:w});
 }
 return {queries,rays};
}
import {localDirection as localFor} from '../numerics/math.js';
