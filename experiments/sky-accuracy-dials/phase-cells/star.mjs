import assert from 'node:assert/strict';
import {dot,cross,unit} from '../numerics/math.js';
import {validateAerosolTable} from '../horizon/aerosol-optics.mjs';

/** Independent exact cosine CDF for paper CS(g=.7), and its density.
 * @param {number} c @returns {number}
 */
function paperCdf(c){const g=.7,a=1+g*g,b=2*g,B=.75*(1-g*g)/(2+g*g),F=x=>{const t=Math.sqrt(a-b*x);return 2/b*((1+a*a/(b*b))/t+2*a/(b*b)*t-t*t*t/(3*b*b));};return B*(F(c)-F(-1));}
/** Outgoing-centered phase-probability cosine representatives, binary64.
 * @param {any} table @param {number} n @returns {number[]}
 */
export function quantiles(table,n){if(table){validateAerosolTable(table);const out=[];let segment=0,mass=0;for(let i=0;i<n;i++){const u=(i+.5)/n;while(segment<table.mu.length-2){const d=table.mu[segment+1]-table.mu[segment],weight=d*(table.pdf[segment]+table.pdf[segment+1])/2;if(u<mass+weight)break;mass+=weight;segment++;}const d=table.mu[segment+1]-table.mu[segment],p=table.pdf[segment],slope=(table.pdf[segment+1]-p)/d,v=u-mass;out.push(table.mu[segment]+2*v/(p+Math.sqrt(Math.max(0,p*p+2*slope*v))));}return out;}assert.ok(Math.abs(paperCdf(1)-1)<1e-12);return Array.from({length:n},(_,i)=>{const u=(i+.5)/n;let a=-1,b=1;for(let j=0;j<45;j++){const m=(a+b)/2;if(paperCdf(m)<u)a=m;else b=m;}return (a+b)/2;});}
/** Independent selector uses projected physical coordinates and saved strip bounds.
 * It shares no GPU phase integration or cell-index implementation.
 * @param {any} mesh @param {number} m @param {number} x @param {number} y @returns {number}
 */
function member(mesh,m,x,y){let lo=0,hi=mesh.rows.length-1;while(lo<hi){const j=(lo+hi)>>1;if(m<mesh.rows[j].hi)hi=j;else lo=j+1;}const row=mesh.rows[lo],a=mesh.frame.a,den=Math.sqrt(Math.max(0,(1-a*a)*(1-m*m))),g=Math.acos(Math.max(-1,Math.min(1,(mesh.horizon-a*m)/Math.max(den,1e-300)))),h=Math.acos(Math.max(-1,Math.min(1,-a*m/Math.max(den,1e-300))));let phi=Math.atan2(y,x);if(phi<0)phi+=2*Math.PI;for(let j=0;j<row.sectors.length;j++){const s=row.sectors[j],l=s.left[0]+s.left[1]*g+s.left[2]*h,r=s.right[0]+s.right[1]*g+s.right[2]*h;if(phi<l-1e-12||phi>=r&&j<row.sectors.length-1)continue;assert.ok(r>l);const t=Math.max(0,Math.min(1,(phi-l)/(r-l)));let k=0,last=s.indices.length-1;while(k<last){const mid=(k+last)>>1;if(t<s.edges[mid+1])last=mid;else k=mid+1;}return s.indices[k];}throw Error('Independent membership gap');}
/** Refined outgoing-centered integral of the exact same piecewise-constant light field.
 * @param {any} mesh @param {number[]} outgoing @param {any} table @param {number[][]} incidents
 * @param {number} nMu @param {number} nPhi @param {(text:string)=>void} progress
 * @param {(m:number,x:number,y:number,index:number)=>number} [sample] @returns {any}
 */
export function star(mesh,outgoing,table,incidents,nMu,nPhi,progress,sample){const started=Date.now(),v=unit(outgoing),helper=Math.abs(v[2])<.9?[0,0,1]:[1,0,0],u=unit(cross(helper,v)),w=cross(v,u),basis=[mesh.frame.s,mesh.frame.u,mesh.frame.v],vv=basis.map(a=>dot(a,v)),uu=basis.map(a=>dot(a,u)),ww=basis.map(a=>dot(a,w)),mu=quantiles(table,nMu),cos=Array.from({length:nPhi},(_,j)=>Math.cos(2*Math.PI*(j+.5)/nPhi)),sin=Array.from({length:nPhi},(_,j)=>Math.sin(2*Math.PI*(j+.5)/nPhi)),counts=new Uint32Array(mesh.count);let sum=0;
 for(let i=0;i<nMu;i++){if(i%32===0)progress(`Independent phaseCDF ${i}/${nMu} x${nPhi}`);const m=mu[i],r=Math.sqrt(Math.max(0,1-m*m)),angle=2*Math.PI*((i*.6180339887498949+.17320508075688773)%1),ca=Math.cos(angle),sa=Math.sin(angle);for(let j=0;j<nPhi;j++){const c=cos[j]*ca-sin[j]*sa,s=sin[j]*ca+cos[j]*sa,cs=m*vv[0]+r*(c*uu[0]+s*ww[0]),x=m*vv[1]+r*(c*uu[1]+s*ww[1]),y=m*vv[2]+r*(c*uu[2]+s*ww[2]),index=member(mesh,cs,x,y);counts[index]++;sum+=sample?sample(cs,x,y,index):incidents[index][0]+incidents[index][1];}}
 const count=nMu*nPhi;assert.equal(counts.reduce((a,b)=>a+b,0),count);return {nMu,nPhi,samples:count,mean:sum/count,weights:[...counts].map(x=>x/count),milliseconds:Date.now()-started,phaseMass:1,method:'Exact material cosine-CDF inversion with outgoing-centered deterministic mass/azimuth grid, binary64 independent physical cell membership. '+(sample?'Registered outgoing-independent illumination reconstruction. ':'Piecewise-constant cell illumination. ')+'Empirical refinement, not statistical confidence or certified error.'};}
