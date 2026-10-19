import assert from 'node:assert/strict';
import {read,integrate,nodeHash} from '../geometry-incoming/common.mjs';
import {make} from '../structured-incoming/factory.mjs';
import {cells} from './geometry.mjs';
import {sourceFrame,dot} from '../numerics/math.js';
import {identity} from '../io/files.mjs';

/** Authenticate a retained field and compute the fixed-Rayleigh controls.
 * @param {any} r @param {any} test @returns {any}
 */
export function field(r,test){
 const p=r.profiles.find(p=>p.id===test.profile),t=r.targets.find(t=>t.id===test.target),config=r.configs.find(c=>c.k===test.k),g=make(config,t,p.control.medium.radius,1),mesh=cells(g),base='tmp/experiments/sky-accuracy-dials/runs/',roots=test.k===.35?['00559-h90-grid-probe']:['00552-h90-grid-probe','00541-h90-grid-probe'];let parent,packet,path;
 for(const root of roots){const f=base+root+`/${test.profile}-${test.target}.json.gz`;try{parent=read(f);}catch(e){if(String(e).includes('Missing path'))continue;throw e;}packet=parent.packets.find(x=>x.channel===test.channel&&nodeHash(parent.grids.find(g=>g.geometry===x.geometry).grid)===nodeHash(g));if(packet){path=f;break;}}
 assert.ok(packet,`Missing actual-angle L ${JSON.stringify(test)}`);const incidents=packet.result.incident[128],A=integrate(p.control,t,test.channel,g,incidents);assert.deepEqual(A,packet.result.sums[128]);const b=integrate(p.control,t,test.channel,{...g,weights:mesh.list.map(c=>c.area)},incidents),B={...b,rayleigh:A.rayleigh,raw:A.rayleigh+b.mieRaw,normalized:A.rayleigh+b.mie},out=sourceFrame(t.point).map(a=>dot(a,t.direction)),outgoing=[mesh.frame.s,mesh.frame.u,mesh.frame.v].map(a=>dot(a,out)),table=p.control.material.phaseTables[test.channel],beta=p.control.medium.mie[test.channel]*p.control.material.albedos[test.channel]*Math.exp(-t.altitude/1200),ref=read(r.reference.path).find(x=>x.profile===p.id&&x.id===t.id&&x.channel===test.channel);
 return {p,t,g,mesh,packet,incidents,A,B,out,outgoing,table,beta,ref,parent:identity(path)};
}

/** Shared normalized operator and exact finite perturbation diagnostic.
 * @param {number[]} weights @param {number[][]} incidents @param {number} beta
 * @param {number} rayleigh @returns {any}
 */
export function operator(weights,incidents,beta,rayleigh){const mass=weights.reduce((s,x)=>s+x,0),mieRaw=beta*weights.reduce((s,x,i)=>s+x*(incidents[i][0]+incidents[i][1]),0);assert.ok(mass>0);return {mass,mieRaw,mie:mieRaw/mass,rayleigh,raw:rayleigh+mieRaw,value:rayleigh+mieRaw/mass};}
