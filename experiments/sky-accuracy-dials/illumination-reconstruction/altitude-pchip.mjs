import assert from 'node:assert/strict';

/** Nonuniform shape-preserving scalar Hermite coefficients. Density removal
 * is handled by the caller, independent of this interpolation arithmetic.
 * @param {number[]} nodes @param {number[]} values @returns {any} */
export function altitudePchip(nodes,values){
 assert.ok(nodes.length>=2&&nodes.length===values.length);assert.ok(nodes.every((x,i)=>Number.isFinite(x)&&(i===0||x>nodes[i-1]))&&values.every(Number.isFinite));const h=nodes.slice(1).map((x,i)=>x-nodes[i]),d=h.map((x,i)=>(values[i+1]-values[i])/x),slopes=[];
 if(nodes.length===2)return {nodes,values,slopes:[d[0],d[0]]};
 const endpoint=(a,b,u,v)=>{let m=((2*a+b)*u-a*v)/(a+b);if(m*u<=0)return 0;if(u*v<0&&Math.abs(m)>3*Math.abs(u))m=3*u;return m;};slopes[0]=endpoint(h[0],h[1],d[0],d[1]);
 for(let i=1;i<nodes.length-1;i++){if(d[i-1]*d[i]<=0)slopes[i]=0;else{const a=2*h[i]+h[i-1],b=h[i]+2*h[i-1];slopes[i]=(a+b)/(a/d[i-1]+b/d[i]);}}
 const n=h.length;slopes[n]=endpoint(h[n-1],h[n-2],d[n-1],d[n-2]);return {nodes,values,slopes};
}

/** @param {any} model @param {number} x @returns {number} */
export function altitudePchipValue(model,x){
 const {nodes,values,slopes}=model;assert.ok(x>=nodes[0]&&x<=nodes.at(-1));if(x===nodes[0])return values[0];if(x===nodes.at(-1))return values.at(-1);let hi=1;while(x>nodes[hi])hi++;const lo=hi-1,h=nodes[hi]-nodes[lo],t=(x-nodes[lo])/h;return (1+2*t)*(1-t)**2*values[lo]+t*t*(3-2*t)*values[hi]+t*(1-t)**2*h*slopes[lo]+t*t*(t-1)*h*slopes[hi];
}
