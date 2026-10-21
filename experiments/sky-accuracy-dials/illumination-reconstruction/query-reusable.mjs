import assert from 'node:assert/strict';
import {spectralQueryResident} from './query-spectral-gpu.mjs';

/** Equivalent hardware evaluator with persistent bounded textures. Every input
 * update covers its exact logical rectangle. Amplitude input is immutable for
 * this projection lifetime and is checked byte-for-byte on every packet before
 * skipping a redundant GPU upload. Allocated dimensions may grow to the next
 * power of two, bounded by the actual device limit; no memory reserve is added.
 * @returns {string} */
export function reusableSpectralSource(){
 let source=spectralQueryResident.toString();const replace=(a,b)=>{assert.equal(source.split(a).length,2);source=source.replace(a,b);};
 replace("const key='__spectralPreparedProjection';","const key='__spectralReusableProjection';");
 replace('for(const texture of s.textures)gl.deleteTexture(texture);s.textures=[];','if(!s.capacities)s.capacities=[];');
 const start=source.indexOf('for(let i=0;i<sizes.length;i++){'),end=source.indexOf('\n gl.bindVertexArray',start);assert.ok(start>=0&&end>start);
 source=source.slice(0,start)+`for(let i=0;i<sizes.length;i++){
 const [w,h]=sizes[i];if(!s.textures[i])s.textures[i]=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,s.textures[i]);
 const old=s.capacities[i]??[0,0],width=Math.min(limit,Math.max(old[0],2**Math.ceil(Math.log2(w)))),height=Math.min(limit,Math.max(old[1],2**Math.ceil(Math.log2(h)))),grew=width!==old[0]||height!==old[1];
 if(grew){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,width,height,0,gl.RGBA,gl.FLOAT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);s.capacities[i]=[width,height];}
 if(i===1){const now=new Uint32Array(arrays[i].buffer,arrays[i].byteOffset,arrays[i].length);if(!s.amplitudeBytes){s.amplitudeBytes=Uint32Array.from(now);s.amplitudeShape=[w,h];}else{if(w!==s.amplitudeShape[0]||h!==s.amplitudeShape[1]||now.length!==s.amplitudeBytes.length)throw Error('Amplitude shape changed during projection');for(let j=0;j<now.length;j++)if(now[j]!==s.amplitudeBytes[j])throw Error('Amplitude bytes changed during projection');}if(grew)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,w,h,gl.RGBA,gl.FLOAT,arrays[i]);}
 else if(arrays[i])gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,w,h,gl.RGBA,gl.FLOAT,arrays[i]);bytes+=width*height*16;
 }`+source.slice(end);
 return source;
}

/** @param {any} request @returns {Promise<any>} */
export async function reusableSpectralResident(request){return Function('return ('+request.residentSource+');')()(request);}

/** Inject only the equivalent evaluator; all geometry preparation, quadrature,
 * phase kernels, partial sums and CPU reduction remain the original operation.
 * @param {any} page @returns {any} */
export function reusableSpectralPage(page){const residentSource=reusableSpectralSource();return {evaluate:(fn,request)=>fn===spectralQueryResident?page.evaluate(reusableSpectralResident,{...request,residentSource}):page.evaluate(fn,request)};}
