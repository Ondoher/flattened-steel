import assert from 'node:assert/strict';
import {adapt} from '../outgoing-focus/control.mjs';
import {warp} from '../outgoing-focus/geometry.mjs';
import {cross,dot,unit,localDirection} from '../numerics/math.js';
import {plan} from '../twilight-reference/geometry.mjs';

/** Frozen receiver-local viewing axis: the primary sunset ray, in backward-ray convention. */
export const axis=unit([Math.cos(.05*Math.PI/180)*Math.cos(5*Math.PI/180),Math.cos(.05*Math.PI/180)*Math.sin(5*Math.PI/180),Math.sin(.05*Math.PI/180)]);

/** Shortest rigid rotation; registered axes never approach the antipodal singularity.
 * @param {readonly number[]} d @param {readonly number[]} a @param {readonly number[]} b @returns {number[]}
 */
export function rotate(d,a,b){const v=cross(a,b),c=dot(a,b),vd=cross(v,d),vvd=cross(v,vd);assert.ok(c>-.99);return d.map((x,i)=>x+vd[i]+vvd[i]/(1+c));}

/** Rotate node placement and every inverse J lookup together in a contained compiler copy.
 * @param {string} input @returns {string}
 */
export function camera(input){
 let s=adapt(input,.35);const start=s.indexOf('vec3 h61Warp('),end=s.indexOf('float sampleJDirection(',start);assert.ok(start>=0&&end>start);
 const helper=`vec3 h66Rotate(vec3 d,vec3 a,vec3 b){vec3 v=cross(a,b);float c=dot(a,b);return normalize(d+cross(v,d)+cross(v,cross(v,d))/(1.0+c));}
vec3 h61Warp(vec3 d,int row,bool inverse){
 vec3 sun=j1SourceDirection(row/POSITION_COUNT),camera=vec3(${axis.map(x=>x.toPrecision(17)).join(',')});
 if(inverse)d=h66Rotate(d,camera,sun);
 float k=inverse?1.0/0.35:0.35,c=dot(d,sun);
 vec3 mapped=normalize((2.0*k*d+(1.0-k*k+(k-1.0)*(k-1.0)*c)*sun)/(1.0+k*k+(1.0-k*k)*c));
 return inverse?mapped:h66Rotate(mapped,sun,camera);
}
`;
 s=s.slice(0,start)+helper+s.slice(end);assert.equal(s.split('direction=h61Warp(direction,row,true);').length,2);
 assert.equal(s.split('h61Warp(texelFetch(uOutgoingDirections').length,3);return s;
}

/** Independent binary64 mapping checks and actual primary-ray query offsets.
 * @param {any} control @returns {any}
 */
export function proof(control){
 const nodes=control.request.transportSpec.domains.outgoing.unitVectors;let unitError=0,inverseError=0,pairError=0;const coverage=[];
 for(const row of [0,30,89,90,120,179]){
  const t=(row+.5)*Math.PI/180,sun=[Math.sin(t),0,Math.cos(t)],seen=new Map(),counts=[0,0];
  for(let i=0;i<nodes.length;i++){
   const d=nodes[i],w=unit(warp(d,sun,.35)),r=unit(rotate(w,sun,axis)),back=warp([...unit(rotate(r,axis,sun))],sun,1/.35);
   unitError=Math.max(unitError,Math.abs(Math.hypot(...r)-1));inverseError=Math.max(inverseError,...d.map((x,j)=>Math.abs(x-back[j])));
   const key=d.map(Math.fround).join(','),bits=r.map(Math.fround).join(',');if(seen.has(key))assert.equal(seen.get(key),bits);else seen.set(key,bits);
   if(dot(w,axis)>Math.cos(10*Math.PI/180))counts[0]++;if(dot(r,axis)>Math.cos(10*Math.PI/180))counts[1]++;
   if(i%31===0){const other=unit(warp(nodes[(i+197)%nodes.length],sun,.35));pairError=Math.max(pairError,Math.abs(dot(w,other)-dot(r,unit(rotate(other,sun,axis)))));}
  }
  coverage.push({row,sun,camera:axis,nodesWithin10DegreesOfCamera:counts});
 }
 const support=plan(control),paths=support.rays.map(r=>({witness:r.witness,offsetDegrees:r.samples.map(s=>Math.acos(Math.max(-1,Math.min(1,dot(localDirection(s.point,r.direction),axis))))*180/Math.PI)}));
 assert.ok(unitError<1e-12&&inverseError<1e-11&&pairError<1e-12);
 assert.equal(nodes.length,4374);assert.equal(control.request.transportSpec.domains.incoming.directionCount,68);
 return {axis,unitError,inverseError,pairError,coverage,paths,convention:'Camera backward view direction; fixed receiver-local axis, not a physical source rotation.'};
}
