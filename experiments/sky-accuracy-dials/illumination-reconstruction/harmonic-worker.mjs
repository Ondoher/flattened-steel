import {parentPort,workerData} from 'node:worker_threads';
import {base,read,direction,coordinates} from './common.mjs';
import {modelField} from './model-field.mjs';
import {fastModel} from './fast-model.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {project,convolve} from './harmonics.mjs';
import {projectionGrid} from './harmonic-grid.mjs';

if(!parentPort)throw Error('CPU projection worker requires its owned parent');
const port=parentPort,{profile,L,n}=workerData,progress=s=>port.postMessage({type:'progress',message:String(s)}),started=Date.now();
progress('Preparing immutable native model inputs');
const z=modelField(profile,'node-89',8,true),model=z.models[0],sample=fastModel(model.field,model.nodes),p=z.f.px,mie=phaseMoments(p.table,L),ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),out=coordinates(z.f.mesh,z.f.out),beta=[p.br*Math.exp(-p.h/8000),p.bm*p.ssa*Math.exp(-p.h/1200)],reference=read(base+'00676-h136-fast-op/rows.json.gz').find(x=>x.profile===profile).levels.at(-1).normalized.native2D;
const c=project(projectionGrid(model.field,L,n),(mu,phi)=>sample(direction(model.field,mu,phi)),L,progress),values=[];
for(const cutoff of [...new Set([16,32,64,128,256,512,L].filter(k=>k<=L))]){const r=convolve(c,out[0],out[1],ray,cutoff),m=convolve(c,out[0],out[1],mie,cutoff),parts=[r[0]*beta[0],r[1]*beta[0],m[0]*beta[1],m[1]*beta[1]],normalized=parts.reduce((s,x)=>s+x,0)/z.scale;values.push({cutoff,parts,normalized,difference:normalized-reference});}
port.postMessage({type:'result',value:{c,reference,item:{n,count:c.count,rings:c.rings,values,milliseconds:Date.now()-started}}},[...c.real.map(x=>x.buffer),...c.imag.map(x=>x.buffer)]);port.close();
