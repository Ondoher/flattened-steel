import assert from 'node:assert/strict';
import {gauss as rawGauss} from '../continuation/direct-solver/math.mjs';
const pi=Math.PI;
const rules=new Map();
export function gauss(n){if(!rules.has(n))rules.set(n,rawGauss(n));return rules.get(n);}
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
/** Independent phase evaluation from physical tabulated cosine density or analytic CS.
 * @param {any} table @param {number} mu @returns {number} Per steradian. */
export function miePhase(table,mu){mu=Math.max(-1,Math.min(1,mu));if(!table)return 3*(1-.7*.7)*(1+mu*mu)/(8*pi*(2+.7*.7)*Math.pow(1+.7*.7-1.4*mu,1.5));let lo=0,hi=table.mu.length-1;while(hi-lo>1){const j=(lo+hi)>>1;if(mu<table.mu[j])hi=j;else lo=j;}const t=(mu-table.mu[lo])/(table.mu[hi]-table.mu[lo]);return (table.pdf[lo]*(1-t)+table.pdf[hi]*t)/(2*pi);}
export const rayleighPhase=mu=>3*(1+mu*mu)/(16*pi);
/** @param {any} f @returns {any} */
export function physical(f){const c=f.packet.channel,m=f.p.control.medium;return {radius:m.radius,top:m.topAltitude,h:f.t.altitude,sun:f.t.axis,br:m.rayleigh[c],bm:m.mie[c],ssa:f.p.control.material.albedos[c],irradiance:m.sourceIrradiance[c]*m.incidentScale,table:f.p.control.material.phaseTables[c]};}
/** Receiver-radial shell exit; no cache/basis membership is used.
 * @param {number} R @param {number} top @param {number} h @param {number} mu @returns {any} */
export function edge(R,top,h,mu){const r=R+h,b=r*mu,c=h*(2*R+h),d=b*b-c;if(mu<0&&d>=0)return {length:Math.max(0,c/(-b+Math.sqrt(d))),ground:true};const ct=(h-top)*(2*R+h+top),s=Math.sqrt(Math.max(0,b*b-ct));return {length:Math.max(0,b>=0?-ct/(b+s):-b+s),ground:false};}
/** Stable physical altitude along a local ray. @returns {number} */
export function altitude(R,h,mu,t){const r=R+h,d=t*(2*r*mu+t);return Math.max(0,h+d/(Math.sqrt(r*r+d)+r));}
/** Independent shell extinction column. @param {any} p @returns {number} */
export function column(p,h,mu,length,n){const q=gauss(n);let sum=0;for(let j=0;j<n;j++){const H=altitude(p.radius,h,mu,length*q.nodes[j]);sum+=q.weights[j]*(p.br*Math.exp(-H/8000)+p.bm*Math.exp(-H/1200));}return length*sum;}
/** Independent panel/log direct L1, physical query in receiver-local up coordinates.
 * @param {any} p @param {number[]} v @param {number} [nv] @param {number} [nc] @returns {number[]} */
export function direct(p,v,nv=32,nc=128){const e=edge(p.radius,p.top,p.h,v[2]),end=e.length;if(end<=0)return [0,0];const q=gauss(nv),mu=dot(v,p.sun),pr=rayleighPhase(mu),pm=miePhase(p.table,mu),r0=p.radius+p.h,A=1-mu*mu,B=2*r0*(v[2]-p.sun[2]*mu),C=p.h*(2*p.radius+p.h)-(r0*p.sun[2])**2,D=B*B-4*A*C,roots=[];if(A>1e-14&&D>0){const z=-.5*(B+(B>=0?1:-1)*Math.sqrt(D));roots.push(z/A,C/z);}const bounds=[0,1e4,5e4,1e5,3e5,1e6,end,...roots.filter(x=>x>0&&x<end)].map(t=>Math.min(t,end)).sort((a,b)=>a-b),sum=[0,0];for(let panel=1;panel<bounds.length;panel++){const a=bounds[panel-1],b=bounds[panel];if(b<=a)continue;const lo=Math.log1p(a/1000),span=Math.log1p(b/1000)-lo;for(let i=0;i<nv;i++){const t=1000*Math.expm1(lo+span*q.nodes[i]),h=altitude(p.radius,p.h,v[2],t),r=p.radius+h,sunMu=((p.radius+p.h)*p.sun[2]+t*mu)/r,sun=edge(p.radius,p.top,h,sunMu);if(sun.ground)continue;const T=Math.exp(-column(p,p.h,v[2],t,nc)-column(p,h,sunMu,sun.length,nc)),w=q.weights[i]*(t+1000)*span*p.irradiance*T;sum[0]+=w*p.br*Math.exp(-h/8000)*pr;sum[1]+=w*p.bm*p.ssa*Math.exp(-h/1200)*pm;}}assert.ok(sum.every(x=>Number.isFinite(x)&&x>=0));return sum;}
/** Stable orthonormal rotation about any physical unit direction. @returns {number[]} */
export function rotate(mu,phi,n){const h=Math.abs(n[2])<.9?[0,0,1]:[1,0,0],u=[h[1]*n[2]-h[2]*n[1],h[2]*n[0]-h[0]*n[2],h[0]*n[1]-h[1]*n[0]],len=Math.hypot(...u),a=u.map(x=>x/len),b=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]];return n.map((x,i)=>mu*x+Math.sqrt(Math.max(0,1-mu*mu))*(Math.cos(phi)*a[i]+Math.sin(phi)*b[i]));}
