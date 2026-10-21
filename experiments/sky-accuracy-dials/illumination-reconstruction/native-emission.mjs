import assert from 'node:assert/strict';
import {coordinates} from './common.mjs';
import {lm,convolve} from './harmonics.mjs';
import {harmonicShader,harmonicResident} from './harmonic-gpu.mjs';

/** Evaluate every actual native outgoing node and three named physical
 * directions. Preserve negative/near-zero diagnostic readbacks rather than
 * hiding truncation with clipping. The caller separately admits source fields.
 * @param {any} page @param {any} run @param {any} f @param {any} c
 * @param {number} L @param {number[]} beta @param {number[]} ray
 * @param {number[]} mie @param {number} scale @returns {Promise<any>} */
export async function emitNativeProjection(page,run,f,c,L,beta,ray,mie,scale){
 const native=f.p.control.request.transportSpec.domains.outgoing.unitVectors,vectors=[...native,f.px.sun,f.px.sun.map(x=>-x),[0,0,1]],angles=vectors.map(d=>coordinates(f.mesh,d)),outgoing=angles.flatMap(([mu,phi])=>[mu,Math.cos(phi),Math.sin(phi),0]),size=(L+1)*(L+2)/2,height=Math.ceil(size/256),real=new Float64Array(height*256*4),imag=new Float64Array(height*256*4);
 for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weights=[beta[0]*ray[l],beta[0]*ray[l],beta[1]*mie[l],beta[1]*mie[l]];for(let s=0;s<4;s++){real[at*4+s]=c.real[s%2][at]*weights[s];imag[at*4+s]=c.imag[s%2][at]*weights[s];}}
 const renderer=await page.evaluate(harmonicResident,{action:'init',shader:harmonicShader(L),height,real:Array.from(real),imag:Array.from(imag),outgoing,capacity:256}),values=[];
 try{for(let at=0;at<vectors.length;at+=256){run.progress('whole-native-source-evaluation',`degree${L} outgoing${at}/${vectors.length}`);values.push(...await page.evaluate(harmonicResident,{action:'draw',offset:at,count:Math.min(256,vectors.length-at)}));}}finally{await page.evaluate(harmonicResident,{action:'close'});}
 assert.ok(values.every(Number.isFinite));const checks=[];
 for(const i of [0,Math.floor(native.length/2),native.length-1,native.length,native.length+1,native.length+2]){run.progress('whole-native-binary64',`degree${L} selected${i}`);const [mu,phi]=angles[i],r=convolve(c,mu,phi,ray),m=convolve(c,mu,phi,mie),cpu=[r[0]*beta[0],r[1]*beta[0],m[0]*beta[1],m[1]*beta[1]],gpu=values.slice(i*4,i*4+4),absolute=cpu.reduce((sum,x,s)=>sum+Math.abs(x-gpu[s]),0),relative=absolute/Math.max(cpu.reduce((sum,x)=>sum+Math.abs(x),0),1e-25),weighted=absolute/scale;checks.push({i,cpu,gpu,relative,weighted,qualified:relative<=1e-4||weighted<=1e-8});}
 return {L,nativeDirections:native,extraDirections:vectors.slice(native.length),values,checks,gpuEvaluationQualified:checks.every(x=>x.qualified),negativeValues:values.filter(x=>x<0).length,minimum:Math.min(...values),renderer,coefficientTextureBytes:2*height*256*16,units:'Pure source density, four transitions: last-R/input0,last-R/input1,last-M/input0,last-M/input1; no ground contribution'};
}
