import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {registration,base} from '../positive-mixture/common.mjs';
import {read} from '../geometry-incoming/common.mjs';
import {field} from '../phase-cells/field.mjs';
import {basis} from '../illumination-basis/basis.mjs';
import {dot} from '../numerics/math.js';
export {registration,base,read,field};
export const channels=[3,5,8],pilotTargets=['node-89','reserved-out-1'];
export const pack=x=>gzipSync(Buffer.from(JSON.stringify(x)));
/** @param {any} f @returns {any} */
export function models(f){const a=basis(f.mesh),b=basis(f.mesh,'sector');return {H100:a,sector:b,midpoint:{stencil:(m,p)=>[...a.stencil(m,p).map(([i,w])=>[i,w/2]),...b.stencil(m,p).map(([i,w])=>[i,w/2])]}};}
/** @param {any} mesh @param {number[]} d @returns {number[]} */
export function coordinates(mesh,d){let p=Math.atan2(dot(d,mesh.frame.v),dot(d,mesh.frame.u));if(p<0)p+=2*Math.PI;return [Math.max(-1,Math.min(1,dot(d,mesh.frame.s))),p];}
/** @param {any} b @param {number[]} uv @param {number[][]} L @returns {number[]} */
export function interpolate(b,uv,L){const st=b.stencil(...uv);return [0,1].map(k=>st.reduce((s,[i,w])=>s+w*L[i][k],0));}
/** @param {any} f @param {string} name @returns {number[]} */
export function retainedWeights(f,name){if(f.controlWeights?.[name])return f.controlWeights[name];if(name==='H100')assert.equal(f.packet.channel,8,'Historical H100 packet has red-phase weights only; derive per-band controls from midpoint/sector.');const file=name==='midpoint'?'00596-h114-mix-panel/weights.json.gz':name==='H100'?`00587-h106-knot-repair/${f.t.id}-moments.json.gz`:`00590-h108-sector-wave/${f.t.id}-weights.json.gz`,x=read(base+file);if(name==='midpoint')return x.find(r=>r.profile===f.p.id&&r.target===f.t.id&&r.channel===f.packet.channel).K;return x.levels.at(-1).rows.find(r=>r.profile===f.p.id&&(name==='H100'||r.channel===f.packet.channel)).weights;}
