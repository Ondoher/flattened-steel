import assert from 'node:assert/strict';
import {read} from './io.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../src/algorithm32/profiles/native-15/native-15-profile.js';
export const ciePath='references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv';
const rows=read(ciePath).toString().trim().split(/\r?\n/).map(line=>line.split(',').map(Number));
assert.equal(rows.length,471);
const matrix=[[12831/3959,-329/214,-1974/3959],[-851781/878810,1648619/878810,36519/878810],[705/12673,-2585/12673,705/667]];
/** Piecewise-linear publisher CIE functions. @param {number} wavelength */
function matching(wavelength){const i=Math.floor(wavelength)-360,t=wavelength-Math.floor(wavelength);return [1,2,3].map(k=>rows[i][k]*(1-t)+(t?rows[i+1][k]*t:0));}
export const xyzWeights=NATIVE_15_SPECTRAL_BASIS.channels.map(channel=>{
 const lower=channel.center.value-channel.width.value/2,upper=channel.center.value+channel.width.value/2,sum=[0,0,0];
 for(let a=lower;a<upper;){const b=Math.min(upper,Math.floor(a+1e-9)+1),left=matching(a),right=matching(b);sum.forEach((_,k)=>sum[k]+=(left[k]+right[k])*.5*(b-a)*683);a=b;}
 return sum;
});
export const rgbWeights=xyzWeights.map(xyz=>matrix.map(row=>row.reduce((s,x,k)=>s+x*xyz[k],0)));
/** Physical bin-integrated CIE projection. @param {number[]} spectrum @param {number} sourceRB @returns {AerosolColor} */
export function color(spectrum,sourceRB=1){assert.equal(spectrum.length,15);assert.ok(spectrum.every(x=>Number.isFinite(x)&&x>=0));const xyz=[0,1,2].map(k=>spectrum.reduce((s,x,c)=>s+x*xyzWeights[c][k],0)),total=xyz.reduce((a,b)=>a+b,0),rgb=matrix.map(row=>row.reduce((s,x,k)=>s+x*xyz[k],0));return {xyz,xy:xyz.map(x=>x/total).slice(0,2),Y:xyz[1],rgb,sourceRelativeRB:rgb[0]/rgb[2]/sourceRB};}
