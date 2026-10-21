import assert from 'node:assert/strict';
import {phaseMoments,convolution} from './phase-moments.mjs';
import {phaseSquareNorm} from './phase-tail.mjs';
import {phases} from './common.mjs';
import {prepareQuery,queryContext,plannedModel} from './query-plan.mjs';
import {spectralQueryResident} from './query-spectral-gpu.mjs';
import {reusableSpectralResident,reusableSpectralSource} from './query-reusable.mjs';

/** Exact mathematical kernel identity with separately declared finite-moment
 * sensitivity. The positive identical-phase moment products bound the omitted
 * series uniformly by its aligned tail. Floating moment/norm arithmetic is
 * covered empirically here; this is not an interval-arithmetic certificate.
 * @param {any} table @param {number} [degree] @returns {any} */
export function sourcePhaseKernel(table,degree=8192){
 assert.ok(table&&degree>=1024);const moments=phaseMoments(table,degree),norm=phaseSquareNorm(table);let partial=0,comp=0;for(let l=0;l<=degree;l++){const term=(2*l+1)*moments[l]**2/(4*Math.PI),y=term-comp,t=partial+y;comp=(t-partial)-y;partial=t;}
 const roundoffAllowance=1e-9*Math.max(1,norm);assert.ok(norm-partial>=-roundoffAllowance);return {degree,moments,norm,partial,rawTail:norm-partial,roundoffAllowance,uniformTailSensitivity:Math.max(0,norm-partial)+roundoffAllowance,scope:'Phase-pair kernel only. Analytic positive-series tail inequality uses finite endpoint moments with a declared empirical floating sensitivity; no atmospheric physical bound.'};
}

/** Amplitudes come only from the same owned illumination at the Sun direction.
 * @param {any} f @param {number[][]} nodes @returns {number[]} */
export function sourcePhaseAnchors(f,nodes){const model=plannedModel(f,nodes),plan=prepareQuery(queryContext(f),f.px.sun),value=model.evaluate(plan),P=phases(f.px,f.px.sun);assert.ok(P.every(x=>x>0));return value.map((x,s)=>x/P[s]);}

/** Four source-density transitions in the native-emission ordering.
 * @param {number} cosine @param {number[]} anchors @param {number[]} beta
 * @param {any} kernel @returns {number[]} */
export function sourcePhaseAnalytic(cosine,anchors,beta,kernel){const mu=Math.max(-1,Math.min(1,cosine)),P2=(3*mu*mu-1)/2,rr=(1+.05*P2)/(4*Math.PI),rm=(1+.5*kernel.moments[2]*P2)/(4*Math.PI),mm=convolution(kernel.moments,kernel.moments,mu,kernel.degree);return [beta[0]*anchors[0]*rr,beta[0]*anchors[1]*rm,beta[1]*anchors[0]*rm,beta[1]*anchors[1]*mm];}

/** Modify output after the unchanged nonlinear positive interpolation. Preserve
 * support fallbacks and allow signed residuals. A zero anchor leaves the shader
 * byte-identical rather than introducing a different zero-subtraction route.
 * @param {string} shader @param {number[][]} anchors @returns {string} */
export function sourcePhaseControlShader(shader,anchors){
 assert.ok(anchors.length>0&&anchors.every(v=>v.length===2&&v.every(x=>Number.isFinite(x)&&x>=0)));if(anchors.every(v=>v.every(x=>x===0)))return shader;
 const array=`const vec2 phaseControlAnchors[${anchors.length}]=vec2[${anchors.length}](${anchors.map(v=>`vec2(${v[0].toExponential(17)},${v[1].toExponential(17)})`).join(',')});\n`;
 let source=shader;for(const [from,to]of [
 ['void main(){',array+'void main(){'],
 ['result=vec4(restoration.zw,0,0);return;','result=vec4(restoration.zw-phaseControlAnchors[band]*restoration.xy,0,0);return;'],
 ['result=vec4(sum*restoration.xy,0,0);','result=vec4((sum-phaseControlAnchors[band])*restoration.xy,0,0);'],
 ]){assert.equal(source.split(from).length,2);source=source.replace(from,to);}return source;
}

/** Same quadrature/plan/reduction with only an additive pointwise control.
 * @param {any} page @param {number[][]} anchors @returns {any} */
export function sourcePhaseControlPage(page,anchors){const residentSource=reusableSpectralSource();return {evaluate:(fn,request)=>{if(fn!==spectralQueryResident)return page.evaluate(fn,request);const modified=request.action==='init'?{...request,queryShader:sourcePhaseControlShader(request.queryShader,anchors)}:request;return page.evaluate(reusableSpectralResident,{...modified,residentSource});}};}
