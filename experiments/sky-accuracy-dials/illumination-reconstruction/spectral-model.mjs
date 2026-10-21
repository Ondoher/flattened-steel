import assert from 'node:assert/strict';
import {base,read,registration,setup,physical,phases} from './common.mjs';
import {augmented} from '../reconstruction-mechanisms/refinement-mesh.mjs';

/** Assemble one actual native-input wavelength on the already frozen all-band
 * allocation. Reuse is by physical direction, never wavelength-index substitution.
 * @param {string} profile @param {number} channel @returns {any} */
export function spectralModel(profile,channel) {
 assert.ok(['paper','toronto'].includes(profile));
 const f=setup(registration(),profile,'node-89',3);
 assert.ok(Number.isInteger(channel)&&channel>=0&&channel<f.p.control.medium.rayleigh.length);
 f.packet={...f.packet,channel};
 f.px=physical(f);
 f.sourcePhases=f.g.nodes.map(d=>phases(f.px,d));
 const root=base+(profile==='paper'?'00667-h136-native-row':'00669-h136-native-row');
 const scores=read(root+'/allocation.json').scores;
 const original=read(root+`/original-${channel}.json.gz`).values[128];
 const added=read(root+`/row-${channel}.json.gz`).added[128];
 f.incidents=original;
 const z=augmented(f,scores,'targeted');
 const nodes=z.entries.flatMap(e=>e.old?original.slice(e.index*64,(e.index+1)*64):added.slice(e.index*64,(e.index+1)*64));
 assert.equal(nodes.length,z.field.g.count);
 assert.ok(nodes.flat().every(x=>Number.isFinite(x)&&x>=0));
 return {field:z.field,nodes,parent:root};
}
