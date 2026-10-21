import assert from 'node:assert/strict';
import {parentPort,workerData} from 'node:worker_threads';
import {gunzipSync} from 'node:zlib';
import {readRepository} from '../io/files.mjs';
import {direction,coordinates,miePhase,rayleighPhase,dot} from './common.mjs';
import {polarNativeField,paperPhaseTail} from './polar-native-field.mjs';
import {fastModel} from './fast-model.mjs';
import {projectionGrid} from './harmonic-grid.mjs';
import {project,convolve} from './harmonics.mjs';
import {phaseMoments} from './phase-moments.mjs';

if(!parentPort)throw Error('Native polar projection requires its owned parent');
const port=parentPort,{channel,L,n,input}=workerData,started=Date.now(),progress=message=>port.postMessage({type:'progress',message});
progress('Preparing fixed actual nodal inputs');
const packet=JSON.parse(gunzipSync(readRepository(input.path,input)).toString()),z=polarNativeField(channel),{f,union}=z,p=f.px;
assert.deepEqual(packet.physical,p);assert.deepEqual(packet.directions,union.field.g.nodes);
const nodes=packet.levels.n256,sample=fastModel(union.field,nodes),c=project(projectionGrid(union.field,L,n),(mu,phi)=>sample(direction(union.field,mu,phi)),L,progress);
const beta=[p.br*Math.exp(-p.h/8000),p.bm*p.ssa*Math.exp(-p.h/1200)],ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),mie=phaseMoments(null,L);
const original=Array(f.g.count);union.entries.forEach((entry,ring)=>{if(entry.origin==='original')for(let j=0;j<64;j++)original[entry.index*64+j]=nodes[ring*64+j];});
assert.ok(original.every(Boolean));let scale=0;
for(let j=0;j<f.g.count;j++){const mu=dot(f.g.nodes[j],f.out),kernel=beta[0]*rayleighPhase(mu)+beta[1]*miePhase(null,mu);scale+=f.g.weights[j]*kernel*(original[j][0]+original[j][1]);}
assert.ok(Number.isFinite(scale)&&scale>0,'Fixed original4096 numerical-control scale');
const maxAmplitude=[0,1].map(s=>Math.max(...nodes.map((v,i)=>v[s]/union.field.sourcePhases[i][s]))),massUpper=4*Math.PI*(maxAmplitude[0]*rayleighPhase(1)+maxAmplitude[1]*miePhase(null,1));
const truncationUpper=beta[1]*massUpper*paperPhaseTail(L)/scale;
const vectors=[...f.p.control.request.transportSpec.domains.outgoing.unitVectors,f.out,p.sun,p.sun.map(x=>-x)],cpuValues=new Float64Array(vectors.length*4);
for(let j=0;j<vectors.length;j++){
 if(j%64===0)progress(`binary64 whole row ${j}/${vectors.length}`);
 const [mu,phi]=coordinates(f.mesh,vectors[j]),r=convolve(c,mu,phi,ray),m=convolve(c,mu,phi,mie);
 cpuValues.set([r[0]*beta[0],r[1]*beta[0],m[0]*beta[1],m[1]*beta[1]],j*4);
}
port.postMessage({type:'result',value:{c,cpuValues,item:{channel,L,n,count:c.count,rings:c.rings,scale,scaleOwner:'Unchanged original4096 finite quadrature under the same actual direct-L1 inputs; numerical normalization only, not physical truth.',massUpper,truncationUpper,milliseconds:Date.now()-started}}},[...c.real.map(x=>x.buffer),...c.imag.map(x=>x.buffer),cpuValues.buffer]);
port.close();
