import assert from 'node:assert/strict';
import {gauss} from '../interior-illumination/physics.mjs';
import {samplePartialSource,radialTau,segmentKernel} from './segment-transport.mjs';

/** Retain the actual computed source, removing only each known local density
 * from its stored payload. Storage is explicitly Float32; query restoration is
 * exactly once. @param {any} field @returns {any} */
export function normalizedPartialField(field){
 const rows=field.rows.map(row=>({...row,rayleigh:row.rayleigh.map(x=>Math.fround(x*Math.exp(row.physical.h/8000))),mie:row.mie.map(x=>Math.fround(x*Math.exp(row.physical.h/1200)))}));
 return {...field,rows,rayleigh:rows.flatMap(row=>row.rayleigh),mie:rows.flatMap(row=>row.mie),sum:field.sum,representation:'Separate last-Rayleigh/Mie source coefficients with exponential local density divided out; restore density once at the query'};
}

/** @param {any} normalized @param {number} h @returns {number[]} */
export function densityPartialSample(normalized,h){return samplePartialSource(normalized,h).map((x,s)=>x*Math.exp(-h/[8000,1200][s]));}

/** Independent knot-split exact-column transport of the normalized field.
 * @param {any} normalized @param {number} n @returns {number[]} */
export function densityPartialExact(normalized,n){const out=[0,0],q=gauss(n);for(let panel=1;panel<normalized.altitudes.length;panel++){const a=normalized.altitudes[panel-1],span=normalized.altitudes[panel]-a;for(let j=0;j<n;j++){const t=a+span*q.nodes[j],v=densityPartialSample(normalized,t),w=span*q.weights[j]*Math.exp(-radialTau(normalized.physical,t));v.forEach((x,s)=>out[s]+=w*x);}}return out;}

/** Independent unchanged finite trapezoid, source density restored per query.
 * @param {any} normalized @param {number} n @returns {number[]} */
export function densityPartialFinite(normalized,n){const out=[0,0],step=4375/n,p=normalized.physical;let T=1,previous=0;for(let j=0;j<=n;j++){const t=j*step,ext=p.br*Math.exp(-t/8000)+p.bm*Math.exp(-t/1200);if(j>0)T*=Math.exp(-.5*(previous+ext)*step);const v=densityPartialSample(normalized,t),w=T*step*(j===0||j===n?.5:1);v.forEach((x,s)=>out[s]+=w*x);previous=ext;}return out;}

/** Original scalar remains the physical-source linear control; split output
 * alone consumes normalized species and restores density. They are intentionally
 * different operators, so scalar/split equality is not a gate for this variant.
 * Both split channels must match an independent normalized finite calculation.
 * @param {any} f @param {number[]} altitudes @param {number} n @returns {any} */
export function densitySegmentKernel(f,altitudes,n){const packet=segmentKernel(f,altitudes,n);for(const [from,to]of [
 ['sampleJ(uPreviousJ, point, direction)','(sampleJ(uPreviousJ, point, direction)*exp(-altitudeAtPoint(point)/8000.0))'],
 ['sampleJ(uPreviousJM, point, direction)','(sampleJ(uPreviousJM, point, direction)*exp(-altitudeAtPoint(point)/1200.0))'],
 ]){assert.equal(packet.split.split(from).length,2);packet.split=packet.split.replace(from,to);}return {...packet,splitRepresentation:'Species-density normalized; scalar is the separate unmodified physical-source control'};}
