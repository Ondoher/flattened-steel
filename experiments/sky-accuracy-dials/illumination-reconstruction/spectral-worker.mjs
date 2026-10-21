import {parentPort,workerData} from 'node:worker_threads';
import {spectralModel} from './spectral-model.mjs';
import {fastModel} from './fast-model.mjs';
import {direction,coordinates} from './common.mjs';
import {projectionGrid} from './harmonic-grid.mjs';
import {project,convolve} from './harmonics.mjs';
import {phaseMoments} from './phase-moments.mjs';

if(!parentPort)throw Error('Spectral worker requires its owned parent');
const port=parentPort,{profile,channel,L,n}=workerData,started=Date.now();
const progress=message=>port.postMessage({type:'progress',message});
progress(`Preparing ${profile}/b${channel}`);
const {field:f,nodes}=spectralModel(profile,channel),sample=fastModel(f,nodes);
const c=project(projectionGrid(f,L,n),(mu,phi)=>sample(direction(f,mu,phi)),L,progress);
const p=f.px,ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),mie=phaseMoments(p.table,L);
const beta=[p.br*Math.exp(-p.h/8000),p.bm*p.ssa*Math.exp(-p.h/1200)];
const vectors=[...f.p.control.request.transportSpec.domains.outgoing.unitVectors,f.out];
const angles=vectors.map(d=>coordinates(f.mesh,d));
const witnessIndices=[0,Math.floor((vectors.length-1)/2),vectors.length-1];
const checks=witnessIndices.map(j=>{
 const [mu,phi]=angles[j],r=convolve(c,mu,phi,ray),m=convolve(c,mu,phi,mie);
 return {j,direction:vectors[j],value:[r[0]*beta[0],r[1]*beta[0],m[0]*beta[1],m[1]*beta[1]]};
});
const metadata={profile,channel,L,n,beta,ray,mie,angles,vectors,checks,count:c.count,rings:c.rings,milliseconds:Date.now()-started};
port.postMessage({type:'result',value:{c,metadata}},[...c.real.map(x=>x.buffer),...c.imag.map(x=>x.buffer)]);
port.close();
