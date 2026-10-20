import assert from 'node:assert/strict';
import {gauss,miePhase} from '../interior-illumination/physics.mjs';
/** @param {number} x @param {number} L @returns {number[]} */
export function legendre(x,L){const p=[1,x];for(let l=2;l<=L;l++)p[l]=((2*l-1)*x*p[l-1]-(l-1)*p[l-2])/l;return p.slice(0,L+1);}

/** Exact analytic CS moments, or endpoint-antiderivative integration of the
 * physical piecewise-linear cosine PDF. No material fitting/renormalization.
 * @param {any} table @param {number} L @returns {number[]} */
export function phaseMoments(table,L){
 if(!table){const g=.7,c=3/(2*(2+g*g));return Array.from({length:L+1},(_,l)=>{const A=(l+1)*(l+2)/((2*l+1)*(2*l+3)),B=(l+1)**2/((2*l+1)*(2*l+3))+(l===0?0:l*l/((2*l+1)*(2*l-1))),C=l<2?0:l*(l-1)/((2*l+1)*(2*l-1));return c*((1+B)*g**l+A*g**(l+2)+(l<2?0:C*g**(l-2)));});}
 const values=table.mu.map(x=>legendre(x,L+2)),out=Array(L+1).fill(0),comp=Array(L+1).fill(0),F=(x,p,l)=>l===0?x:(p[l+1]-p[l-1])/(2*l+1),G=(x,p,l)=>l===0?x*x/2:l===1?x*x*x/3:((l+1)*F(x,p,l+1)+l*F(x,p,l-1))/(2*l+1);
 for(let i=1;i<table.mu.length;i++){
  const a=table.mu[i-1],b=table.mu[i],A=values[i-1],B=values[i],pdf=table.pdf[i-1],slope=(table.pdf[i]-pdf)/(b-a);
  for(let l=0;l<=L;l++){const zero=F(b,B,l)-F(a,A,l),first=G(b,B,l)-G(a,A,l),v=pdf*zero+slope*(first-a*zero),y=v-comp[l],sum=out[l]+y;comp[l]=(sum-out[l])-y;out[l]=sum;}
 }
 assert.ok(Math.abs(out[0]-1)<1e-8&&out.every(x=>Math.abs(x)<=1.00001));return out;
}

/** Independent Gauss polynomial integration of table moments; n256 integrates
 * degree<=511 exactly in exact arithmetic on every linear-PDF interval.
 * @param {any} table @param {number} L @returns {number[]} */
export function numericalMoments(table,L){const q=gauss(256),out=Array(L+1).fill(0),cuts=table?table.mu:[-1,1];for(let i=1;i<cuts.length;i++)for(let j=0;j<q.nodes.length;j++){const x=cuts[i-1]+(cuts[i]-cuts[i-1])*q.nodes[j],w=(cuts[i]-cuts[i-1])*q.weights[j]*2*Math.PI*miePhase(table,x),P=legendre(x,L);for(let l=0;l<=L;l++)out[l]+=w*P[l];}return out;}

/** Axisymmetric spherical convolution. Source Rayleigh has only a0=1,a2=.1;
 * outgoing Rayleigh similarly. Mie/Mie tails remain finite precision checks.
 * @param {number[]} a @param {number[]} b @param {number} cosine @param {number} L
 * @returns {number} */
export function convolution(a,b,cosine,L){const P=legendre(cosine,L);let sum=0,c=0;for(let l=0;l<=L;l++){const term=(2*l+1)*a[l]*b[l]*P[l]/(4*Math.PI),y=term-c,t=sum+y;c=(t-sum)-y;sum=t;}return sum;}
