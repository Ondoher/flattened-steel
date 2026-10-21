import assert from 'node:assert/strict';
import {transportKernel,transportResident} from './builder-transport.mjs';
import {gauss} from '../interior-illumination/physics.mjs';

/** Restrict only the actual ray endpoint; the physical atmosphere remains60km.
 * Output row0 starts at ground and has complete supplied source support.
 * @param {any} f @param {number[]} altitudes @param {number} intervals
 * @returns {any} */
export function segmentKernel(f,altitudes,intervals){
 assert.equal(altitudes[0],0);assert.equal(altitudes.at(-1),4375);const packet=transportKernel(f,altitudes,[89.5],1,intervals,false,false),from='float lengthMeters = atmosphereBranchLength(origin, direction);',to=from+'\nif(lengthMeters > 0.0) lengthMeters = min(lengthMeters,4375.0);';
 for(const key of ['scalar','split']){assert.equal(packet[key].split(from).length,2);packet[key]=packet[key].replace(from,to);}return {...packet,segmentLengthMeters:4375};
}

/** Same owned evaluator, reading only the requested origin row while retaining
 * the complete supplied source textures. @returns {string} */
export function segmentResidentSource(){let source=transportResident.toString();for(const [from,to]of [
 ['gl.viewport(0,0,widthL,rows)','gl.viewport(0,0,widthL,request.outputRows??rows)'],
 ['new Float32Array(widthL*rows*4)','new Float32Array(widthL*(request.outputRows??rows)*4)'],
 ['gl.readPixels(0,0,widthL,rows,gl.RGBA,gl.FLOAT,values)','gl.readPixels(0,0,widthL,request.outputRows??rows,gl.RGBA,gl.FLOAT,values)'],
 ]){assert.equal(source.split(from).length,2);source=source.replace(from,to);}return source;}

/** @param {any} request @returns {any} */
export function segmentResident(request){return Function('return ('+request.residentSource+');')()(request);}

/** Exact prescribed exponential-density radial optical column.
 * @param {any} p @param {number} t @returns {number} */
export function radialTau(p,t){return p.br*8000*(-Math.expm1(-t/8000))+p.bm*1200*(-Math.expm1(-t/1200));}

/** Unchanged linear position stencil, sampled at the exact native up direction.
 * @param {any} field @param {number} h @returns {number[]} */
export function samplePartialSource(field,h){
 const nodes=field.altitudes;assert.ok(h>=0&&h<=nodes.at(-1)+1e-8);let hi=1;while(hi<nodes.length-1&&h>nodes[hi])hi++;const lo=hi-1,t=(h-nodes[lo])/(nodes[hi]-nodes[lo]);return ['rayleigh','mie'].map(key=>(1-t)*field.rows[lo][key][field.upIndex]+t*field.rows[hi][key][field.upIndex]);
}

/** Independent same-field, physically attenuated radial transport. Splits at
 * every source interpolation knot; neither a source oracle nor full radiance.
 * @param {any} field @param {number} n @returns {number[]} */
export function exactPartialTransport(field,n){const q=gauss(n),out=[0,0];for(let panel=1;panel<field.altitudes.length;panel++){const a=field.altitudes[panel-1],span=field.altitudes[panel]-a;for(let j=0;j<n;j++){const t=a+span*q.nodes[j],source=samplePartialSource(field,t),weight=span*q.weights[j]*Math.exp(-radialTau(field.physical,t));for(let s=0;s<2;s++)out[s]+=weight*source[s];}}return out;}

/** Independent implementation of the unchanged finite60/120/240 operator.
 * @param {any} field @param {number} n @returns {number[]} */
export function finitePartialTransport(field,n){const out=[0,0],step=4375/n,p=field.physical;let T=1,previous=0;for(let j=0;j<=n;j++){const t=j*step,ext=p.br*Math.exp(-t/8000)+p.bm*Math.exp(-t/1200);if(j>0)T*=Math.exp(-.5*(previous+ext)*step);const value=samplePartialSource(field,t),weight=T*step*(j===0||j===n?.5:1);for(let s=0;s<2;s++)out[s]+=weight*value[s];previous=ext;}return out;}
