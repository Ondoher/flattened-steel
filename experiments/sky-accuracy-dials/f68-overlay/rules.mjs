import assert from 'node:assert/strict';
import {dot,unit} from '../numerics/math.js';
import {warp} from '../outgoing-focus/geometry.mjs';
import {sphere} from '../geometry-incoming/rules.mjs';
import {gauss} from '../continuation/direct-solver/math.mjs';

export const placements=[0,.2718281828459045];
export const k=.35;
/** Physical solid-angle Jacobian of the Sun map. @param {number[]} d @param {number[]} axis @returns {number} */
export const jacobian=(d,axis)=>(1+k*k-(1-k*k)*dot(d,axis))**2/(4*k*k);
/** Fixed source-relative partition, independent of outgoing direction/material. @param {any} config @param {number[]} d @param {number[]} axis @returns {number} */
export function window(config,d,axis){
 if(config.kind==='balance'){const alpha=config.n/(68+config.n),q=alpha/jacobian(d,axis);return q/(1-alpha+q);}
 const theta=Math.acos(Math.max(-1,Math.min(1,dot(d,axis))))*180/Math.PI,[inner,outer]=config.width??[15,45],t=Math.max(0,Math.min(1,(theta-inner)/(outer-inner)));
 return 1-t*t*(3-2*t);
}
/** Exact F68 backbone and a separately generated Sun stream, with a shared partition. @param {any} config @param {any} target @param {any} control @param {number} [offset] @returns {any} */
export function make(config,target,control,offset=0){
 const original=control.request.transportSpec.domains.incoming,nodes=[],weights=[],components=[],axis=target.axis;
 if(config.kind==='original'){
  nodes.push(...original.unitVectors.map(d=>[...d]));weights.push(...original.integrationWeightsSteradians);components.push(...nodes.map(()=>0));
 }else{
  if(config.kind!=='sun')for(let i=0;i<original.unitVectors.length;i++){
   const d=[...original.unitVectors[i]];nodes.push(d);weights.push(original.integrationWeightsSteradians[i]*(1-window(config,d,axis)));components.push(0);
  }
  for(const d of sphere(config.n,'midpoint',offset)){
   const v=[...unit(warp(d,axis,k))],w=4*Math.PI/config.n*jacobian(v,axis);nodes.push(v);weights.push(w*(config.kind==='sun'?1:window(config,v,axis)));components.push(1);
  }
 }
 assert.equal(original.unitVectors.length,68);assert.ok(weights.every(w=>Number.isFinite(w)&&w>=0));
 const active=weights.flatMap((w,i)=>w>0?[i]:[]),area=weights.reduce((s,w)=>s+w,0),moments=[0,1,2].map(j=>nodes.reduce((s,d,i)=>s+d[j]*weights[i],0)/(4*Math.PI));
 const grid={config:config.id,count:nodes.length,nodes,weights,components,axis,offset,active,activeCount:active.length,relativeArea:area/(4*Math.PI)-1,moments};
 if(config.kind!=='sun'&&config.kind!=='original')assert.deepEqual(nodes.slice(0,68),original.unitVectors);
 return grid;
}
/** Full grid and exact active-index map; no approximate direction merging. @param {any} g @returns {any} */
export function activeGrid(g){return {...g,count:g.active.length,nodes:g.active.map(i=>g.nodes[i]),weights:g.active.map(i=>g.weights[i]),components:g.active.map(i=>g.components[i])};}
/** Manufactured admission; mass ledgers remain separate diagnostics. @param {any} g @returns {any} */
export function admission(g){
 const quadrature=gauss(256),lobes=[4,16].map(a=>{const exact=2*Math.PI*(-Math.expm1(-2*a))/a,value=g.nodes.reduce((s,d,i)=>s+g.weights[i]*Math.exp(a*(dot(d,g.axis)-1)),0);return {a,exact,value,error:value/exact-1};});
 const exact=4*Math.PI*quadrature.nodes.reduce((s,x,i)=>s+quadrature.weights[i]*Math.exp(-(((2*x-1)/.1)**2)/2),0),value=g.nodes.reduce((s,d,i)=>s+g.weights[i]*Math.exp(-((d[2]/.1)**2)/2),0),horizon={exact,value,error:value/exact-1};
 const geometry=Math.max(Math.abs(g.relativeArea),...g.moments.map(Math.abs)),manufactured=Math.max(...lobes.map(x=>Math.abs(x.error)),Math.abs(horizon.error));
 assert.ok(g.nodes.every(d=>Math.abs(dot(d,d)-1)<1e-10));
 return {geometry,manufactured,lobes,horizon,local:geometry<=.02&&manufactured<=.05,fine:geometry<=.005&&manufactured<=.02};
}
/** Analytic map/partition closure and independent finite-difference Jacobian. @returns {any} */
export function proof(){
 let inverse=0,derivative=0,partition=0;const eps=1e-5,axis=[0,0,1];
 for(let i=0;i<81;i++){
  const mu=-.98+i*1.96/80,d=[Math.sqrt(1-mu*mu),0,mu],mapped=[...warp(d,axis,k)],back=warp(mapped,axis,1/k),f=x=>((1-k*k)+(1+k*k)*x)/(1+k*k+(1-k*k)*x);
  inverse=Math.max(inverse,...d.map((x,j)=>Math.abs(x-back[j])));derivative=Math.max(derivative,Math.abs((f(mu+eps)-f(mu-eps))/(2*eps)/jacobian(mapped,axis)-1));
  for(const config of [{kind:'balance',n:256},{kind:'compact',n:256},{kind:'compact',n:256,width:[30,90]}]){const s=window(config,d,axis);assert.ok(s>=0&&s<=1);partition=Math.max(partition,Math.abs(1-s+s-1));}
 }
 assert.ok(inverse<1e-12&&derivative<1e-7&&partition<1e-14);return {inverse,derivative,partition,convention:'Physical dOmega weights; analytic partition, no post-hoc area normalization.'};
}
