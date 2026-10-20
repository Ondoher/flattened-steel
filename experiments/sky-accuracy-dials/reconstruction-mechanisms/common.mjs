import assert from 'node:assert/strict';
import {base,registration,read,field,models,coordinates,pack} from '../interior-illumination/common.mjs';
import {physical,miePhase,rayleighPhase,dot,edge} from '../interior-illumination/physics.mjs';
import {identity,verifyRun} from '../io/files.mjs';
export {base,registration,read,field,models,coordinates,pack,physical,miePhase,rayleighPhase,dot,edge,identity,verifyRun};
export const channels=[3,5,8],pilots=['node-89','reserved-out-1'],targets=[...pilots,'held-0','held-1','held-2','held-3'];
export const seed=684729171,mechanismSeed=684729173;
/** Read the precise selected independent light, with its original query measure. @param {string} profile @param {string} target @param {number} channel @param {boolean} [maximum] @returns {any} */
export function retained(profile,target,channel,maximum=false){const root=base+(!pilots.includes(target)?'00626-h123-int-xfer':maximum?(profile==='toronto'&&target==='node-89'?'00628-h122-int-wave':'00627-h122-int-cells'):'00622-h122-int-wave'),packet=root+`/${profile}-${target}-b${channel}.json.gz`,query=root+`/${profile}-${target}-queries.json.gz`,x=read(packet),qs=read(query).qs;return {x,qs,root,parents:[identity(packet),identity(query)],scope:root.includes('00622')?'Numerical recovery00623; original monitoring failed.':'Authenticated accepted inventory.'};}
/** Source-frame inverse, independently audited against actual donor vectors. @param {any} f @param {number} m @param {number} phi @returns {number[]} */
export function direction(f,m,phi){const a=Math.sqrt(Math.max(0,1-m*m));return f.mesh.frame.s.map((v,i)=>m*v+a*(Math.cos(phi)*f.mesh.frame.u[i]+Math.sin(phi)*f.mesh.frame.v[i]));}
/** @param {any} p @param {number[]} d @returns {number[]} */
export function phases(p,d){const m=dot(p.sun,d);return [rayleighPhase(m),miePhase(p.table,m)];}
/** Actual positive original stencil; midpoint keeps its exact donor multiset. @param {any} f @param {number[]} d @param {string} [name] @returns {number[][]} */
export function stencil(f,d,name='midpoint'){return f.bases[name].stencil(...coordinates(f.mesh,d));}
/** @param {any} f @param {number[]} d @param {number[][]} nodes @param {string} [name] @param {boolean[]} [factored] @returns {number[]} */
export function reconstruct(f,d,nodes,name='midpoint',factored=[false,false]){const st=stencil(f,d,name),P=phases(f.px,d);return [0,1].map(s=>st.reduce((sum,[i,w])=>sum+w*nodes[i][s]*(factored[s]?P[s]/f.sourcePhases[i][s]:1),0));}
/** @param {any} r @param {string} profile @param {string} target @param {number} channel @returns {any} */
export function setup(r,profile,target,channel){const f=field(r,{profile,target,channel,k:.5});f.bases=models(f);f.px=physical(f);f.sourcePhases=f.g.nodes.map(d=>phases(f.px,d));assert.ok(f.sourcePhases.every(a=>a.every(x=>x>0&&Number.isFinite(x))));return f;}
/** Independent physical ray support from exact shadow cylinder intersections, not a basis cell label. @param {any} p @param {number[]} d @returns {any} */
export function support(p,d){const e=edge(p.radius,p.top,p.h,d[2]),r=p.radius+p.h,mu=dot(d,p.sun),A=1-mu*mu,B=2*r*(d[2]-p.sun[2]*mu),C=p.h*(2*p.radius+p.h)-(r*p.sun[2])**2,D=B*B-4*A*C,roots=[];if(A>1e-14&&D>0){const z=-.5*(B+(B>=0?1:-1)*Math.sqrt(D));roots.push(z/A,C/z);}const cuts=[0,e.length,...roots.filter(t=>t>0&&t<e.length)].sort((a,b)=>a-b);let lit=0,segments=0;for(let i=1;i<cuts.length;i++){const t=(cuts[i]+cuts[i-1])/2,v=[t*d[0],t*d[1],r+t*d[2]],rad=Math.hypot(...v),h=(rad*rad-p.radius*p.radius)/(rad+p.radius),sunMu=dot(v,p.sun)/rad;if(!edge(p.radius,p.top,Math.max(0,h),sunMu).ground){lit+=cuts[i]-cuts[i-1];segments++;}}return {ground:e.ground,end:e.length,litFraction:e.length>0?lit/e.length:0,segments,shadow:lit===0?'dark':lit<e.length*(1-1e-12)?'partial':'lit'};}
/** Immutable parent acceptance helper;00622 is authenticated through00623. @returns {any[]} */
export function parents(){return ['00634-h125-int-proof','00623-h122-int-replay','00620-h121-int-oracle','00626-h123-int-xfer','00627-h122-int-cells','00628-h122-int-wave'].map(p=>verifyRun(base+p));}
