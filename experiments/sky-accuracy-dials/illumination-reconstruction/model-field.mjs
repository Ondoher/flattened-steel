import {base,read,registration,setup,retained} from './common.mjs';
import {reference} from '../reconstruction-mechanisms/metrics.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {refineAzimuth,assembleAzimuth} from './azimuth-refinement.mjs';

/** Load exact immutable model inputs, preserving the distinction between native
 * actual-builder data and independent nodal controls. @param {string} profile
 * @param {string} target @param {number} channel @param {boolean} native
 * @returns {any} */
export function modelField(profile,target,channel,native=false){
 const f=setup(registration(),profile,target,channel),scale=reference(f).scale;
 if(native){
  if(target!=='node-89')throw Error('Only the measured complete native row is supported');
  const root=base+(profile==='paper'?'00667-h136-native-row':'00669-h136-native-row'),scores=read(root+'/allocation.json').scores,old=read(root+`/original-${channel}.json.gz`).values,added=read(root+`/row-${channel}.json.gz`).added,z=augmented(f,scores,'targeted'),nodes=z.entries.flatMap(e=>e.old?old[128].slice(e.index*64,(e.index+1)*64):added[128].slice(e.index*64,(e.index+1)*64));
  return {f,scale,models:[{name:'native2D',field:z.field,nodes}],partition:z.field,parents:[root],scope:'Actual native128 inputs; all15-band frozen allocation.'};
 }
 const root=base+'00654-h135-profile',scores=read(root+`/${profile}-${target}-allocation.json`).scores,p=read(root+`/${profile}-${target}-b${channel}.json.gz`),old=retained(profile,target,channel),z=augmented(f,scores,'targeted'),pn=assemble(z,old.x.nodes,p.added),a=read(base+`00657-h135-az-grid/${profile}-${target}-b${channel}.json.gz`),dense=refineAzimuth(z.field),dn=assembleAzimuth(dense,pn,a.added);
 return {f,scale,models:[{name:'biRaw',field:z.field,nodes:pn.n256},{name:'biDense',field:dense.field,nodes:dn.n256}],partition:dense.field,parents:[root,base+'00657-h135-az-grid'],scope:'Independent nodal controls; original three-band native allocation.'};
}
