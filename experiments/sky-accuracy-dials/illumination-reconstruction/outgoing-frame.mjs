import assert from 'node:assert/strict';
import {dot,cross,unit,sourceFrame} from '../numerics/math.js';

/** Production W27/source-aligned cube to receiver-local physical direction.
 * Mirrors the compiler's non-Fibonacci productionFrame, including its least-
 * aligned-axis tie order. @param {number[]} v @param {number[]} point
 * @param {number[]} [sun] @returns {number[]} */
export function outgoingPhysical(v,point,sun=[0,0,1]){
 const x=unit(sun),reference=[0,0,1];let raw=reference.map((a,i)=>a-dot(reference,x)*x[i]);
 if(Math.hypot(...raw)<=1e-10){let best=[1,0,0];for(const a of [[0,1,0],[0,0,1]])if(Math.abs(dot(a,x))<Math.abs(dot(best,x)))best=a;raw=best.map((a,i)=>a-dot(best,x)*x[i]);}
 const z=unit(raw),y=unit(cross(z,x)),world=unit(x.map((a,i)=>a*v[0]+y[i]*v[1]+z[i]*v[2])),axes=sourceFrame([point[0],point[1],point[2]]),local=axes.map(a=>dot(a,world));
 assert.ok(Math.abs(Math.hypot(...local)-1)<1e-10);return local;
}
