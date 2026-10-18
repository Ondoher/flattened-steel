import assert from 'node:assert/strict';
import {outgoingStencil} from '../numerics/math.js';
import {warp} from './geometry.mjs';

/** Check invertibility/unit vectors and exact shared-face identities before a GPU run.
 * @param {any} request @returns {any}
 */
export function geometryProof(request){
 let unitError=0,inverseError=0,weightMassError=0;const nodes=request.transportSpec.domains.outgoing.unitVectors;
 for(const k of [1,.75,.5,.35])for(const z of [0,30,89,120,179]){
 const theta=(z+.5)*Math.PI/180,sun=[Math.sin(theta),0,Math.cos(theta)],seen=new Map();
 for(const d of nodes){const w=warp(d,sun,k),back=warp(w,sun,1/k);unitError=Math.max(unitError,Math.abs(Math.hypot(...w)-1));inverseError=Math.max(inverseError,...d.map((v,i)=>Math.abs(back[i]-v)));const key=d.map(Math.fround).join(','),bits=w.map(Math.fround).join(',');if(seen.has(key))assert.equal(seen.get(key),bits);else seen.set(key,bits);}
 for(let i=0;i<80;i++){const c=1-2*(i+.5)/80,phi=i*2.399963229728653,d=[Math.sqrt(1-c*c)*Math.cos(phi),Math.sqrt(1-c*c)*Math.sin(phi),c],mapped=warp(d,sun,1/k),tap=outgoingStencil([mapped[0],mapped[1],mapped[2]],27);assert.ok(tap.weights.every(w=>w>=0));weightMassError=Math.max(weightMassError,Math.abs(tap.weights.reduce((s,w)=>s+w,0)-1));}
 }
 assert.ok(unitError<1e-12&&inverseError<1e-12&&weightMassError<1e-14);
 return {unitError,inverseError,weightMassError,slots:nodes.length,incomingCount:request.transportSpec.domains.incoming.directionCount,seams:'Equal Float32 base nodes remain equal after the same row-dependent warp.',constantPreservation:'Positive bilinear tap weights sum to one across1600 fixed non-node queries; inverse mapping changes query coordinates only.'};
}

/** Adapt only J node placement and every J direction lookup in an immutable compiler copy.
 * @param {string} input @param {number} k @returns {string}
 */
export function adapt(input,k){
 let s=input.replaceAll('\r\n','\n');
 const marker='float sampleJDirection(sampler2D field, int row, vec3 direction) {';
 assert.equal(s.split(marker).length,2);
 const helper=`vec3 h61Warp(vec3 d,int row,bool inverse){\n if(${k.toFixed(8)}==1.0)return d;\n float k=inverse?1.0/${k.toFixed(8)}:${k.toFixed(8)};vec3 sun=j1SourceDirection(row/POSITION_COUNT);float c=dot(d,sun);return normalize((2.0*k*d+(1.0-k*k+(k-1.0)*(k-1.0)*c)*sun)/(1.0+k*k+(1.0-k*k)*c));\n}\n`;
 s=s.replace(marker,helper+marker+'\n direction=h61Warp(direction,row,true);');
 for(const index of ['directionIndex','outgoingIndex']){const text=`texelFetch(uOutgoingDirections, ivec2(${index}, 0), 0).xyz`;assert.equal(s.split(text).length,2);s=s.replace(text,`h61Warp(${text},row,false)`);}
 const hook='if (onFieldProbes === null) return;';assert.equal(s.split(hook).length,2);s=s.replace(hook,`if(fieldId.startsWith('J'))await globalThis['__h61Observe']({gl,fieldId,resource,common});\n\t\t${hook}`);
 return s;
}
