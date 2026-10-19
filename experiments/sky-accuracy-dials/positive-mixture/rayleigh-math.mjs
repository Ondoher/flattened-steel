import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createRun,verifyRun,storage} from '../io/files.mjs';
import {read} from '../geometry-incoming/common.mjs';
import {field} from '../phase-cells/field.mjs';
import {basis} from '../illumination-basis/basis.mjs';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {render} from '../structured-incoming/runtime.mjs';
import {base,registration} from './common.mjs';

/** Fixed midpoint basis; phase/material and outgoing direction do not choose donors.
 * @param {any} mesh @returns {any} */
export function midpoint(mesh){const a=basis(mesh),b=basis(mesh,'sector');return {mesh,polar:a.polar,stencil:(m,p)=>[...a.stencil(m,p).map(([i,v])=>[i,v/2]),...b.stencil(m,p).map(([i,v])=>[i,v/2])],cuts:m=>[...new Set([...a.cuts(m),...b.cuts(m)])].sort((a,b)=>a-b)};}

/** Exact Rayleigh azimuth moments of quadratic cosine phase, binary64.
 * @param {number} a @param {number} b @param {number} center @param {number} lo @param {number} hi @returns {number[]} */
export function rayleighMoments(a,b,center,lo,hi){const h=(hi-lo)/2,mid=(lo+hi)/2-center,k=3/(16*Math.PI),A=k*(1+a*a+b*b/2),B=k*2*a*b,C=k*b*b/2,sinc=x=>Math.abs(x)<1e-4?1-x*x/6+x**4/120:Math.sin(x)/x,odd=x=>Math.abs(x)<1e-3?-(x**3)/3+x**5/30-x**7/840:x*Math.cos(x)-Math.sin(x),zero=2*h*(A+B*Math.cos(mid)*sinc(h)+C*Math.cos(2*mid)*sinc(2*h)),first=h*zero+2*B*Math.sin(mid)*odd(h)+C*Math.sin(2*mid)*odd(2*h)/2;return [zero,first];}

/** @param {any} b @param {number[]} out @param {number} n @param {(text:string)=>void} progress @returns {any} */
export function rayleighWeights(b,out,n,progress){const start=Date.now(),q=gauss(n),w=new Float64Array(b.mesh.count);let patches=0;for(let slab=1;slab<b.polar.length;slab++){if(slab%8===1)progress(`Rayleigh order${n} slab${slab}/${b.polar.length-1}`);const lo=b.polar[slab-1],span=b.polar[slab]-lo;for(let j=0;j<n;j++){const angle=Math.PI*q.nodes[j],m=lo+span*(1-Math.cos(angle))/2,jac=q.weights[j]*span*Math.PI*Math.sin(angle)/2,cuts=b.cuts(m),a=m*out[0],bb=Math.sqrt(1-m*m)*Math.hypot(out[1],out[2]),center=Math.atan2(out[2],out[1]);for(let p=1;p<cuts.length;p++){const l=cuts[p-1],h=cuts[p];if(h-l<1e-14)continue;patches++;const [zero,first]=rayleighMoments(a,bb,center,l,h);assert.ok(zero>=0);const phi=l+first/zero;assert.ok(phi>=l-1e-11&&phi<=h+1e-11);for(const [i,c] of b.stencil(m,phi)){assert.ok(c>=0);w[i]+=jac*zero*c;}}}}return {weights:[...w],milliseconds:Date.now()-start,patches,mass:w.reduce((s,x)=>s+x,0)};}

