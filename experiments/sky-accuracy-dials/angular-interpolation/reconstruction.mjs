import assert from 'node:assert/strict';
import {benchmarkRay,createPointStencilBuilder,viewPathIntervals,sampleDensity,integrateDensity} from '../numerics/view.js';
import {localDirection,dot} from '../numerics/math.js';
import {phase} from '../numerics/direct.js';

/** Prepare a single Q30 ray with original sparse anchor and face conventions.
 * @param {SkyBuildRequest} request @param {SkyScene} scene @param {number} x @param {number} y
 * @returns {H59PreparedRay}
 */
export function prepareRay(request,scene,x,y){
 const stencil=createPointStencilBuilder(request),geometry=benchmarkRay(request.transportSpec,scene,x,y);
 const samples=viewPathIntervals(request.transportSpec,geometry,'quadratic',30).map(({start,end})=>{const distance=(start+end)/2;return stencil.sample([geometry.origin[0]+geometry.direction[0]*distance,geometry.origin[1]+geometry.direction[1]*distance,geometry.origin[2]+geometry.direction[2]*distance],geometry.direction,end-start);});
 const ray={...geometry,sceneIndex:0,sceneId:scene.id,time:scene.time,gridX:x,gridY:y,worldDirection:geometry.direction,samples};
 return {ray,coordinates:stencil.coordinates};
}

/** Evaluate native rounded phase-bearing nodes and direct requested phase from identical GPU bases.
 * Binary64 phase arithmetic is a controlled readout, validated against GPU witness controls.
 * @param {SkyBuildRequest} request @param {H59PreparedRay} prepared @param {number} channel
 * @param {readonly number[]} bases @returns {{native:number,direct:number}}
 */
export function evaluateRay(request,prepared,channel,bases){
 const spec=request.transportSpec,domain=spec.domains,coordinates=prepared.coordinates;
 assert.equal(bases.length,2*domain.position.count*domain.solarZenith.count);
 const value=(row,local)=>{const z=Math.floor(row/domain.position.count),theta=domain.solarZenith.nodes[z].solarZenithDegrees*Math.PI/180,source=[Math.sin(theta),0,Math.cos(theta)],p=phase(spec,dot(local,source));return bases[2*row]*p[0]+bases[2*row+1]*p[1];};
 const nodes=Float32Array.from(coordinates,c=>value(c.y,domain.outgoing.unitVectors[c.x]));
 const native=integrateDensity(spec,channel,prepared.ray,s=>sampleDensity(nodes,s,'monotone-cubic'));
 const direct=integrateDensity(spec,channel,prepared.ray,s=>{const local=localDirection(s.point,prepared.ray.worldDirection),values=[];for(let a=0;a<s.altitudeWeights.length;a++)for(let z=0;z<4;z++){const c=coordinates[s.indices[(a*4+z)*s.directionWeights.length]];values.push(value(c.y,local));}return sampleDensity(Float32Array.from(values),{...s,directionWeights:[1],indices:values.map((_,i)=>i)},'monotone-cubic');});
 assert.ok(Number.isFinite(native)&&native>=0&&Number.isFinite(direct)&&direct>=0);
 return {native,direct};
}
