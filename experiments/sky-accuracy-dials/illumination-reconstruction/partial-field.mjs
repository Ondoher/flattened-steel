import assert from 'node:assert/strict';
import {identity} from '../io/files.mjs';
import {base,read,registration,setup,verifyRun} from './common.mjs';

/** Read only complete numerically qualified owned J2 rows. Native ground-row
 * assembly and new single-row schemas retain their separate parent identities.
 * @param {string} root @returns {any} */
export function ownedSourceRow(root){
 const seal=verifyRun(root);let data;
 if(root===base+'00725-h136-source-row'){
  const path=root+'/paper-source-row.json.gz',packet=read(path),row=packet.rows.find(r=>r.channel===8),directions=packet.directions.slice(0,packet.nativeOutgoing),f=setup(registration(),'paper','node-89',8);assert.ok(read(root+'/summary.json').projectionQualified);
  data={physical:row.physical,target:f.t,nativeDirections:directions,rayleigh:directions.map((_,i)=>Math.fround(row.values[i*4]+row.values[i*4+1])),mie:directions.map((_,i)=>Math.fround(row.values[i*4+2]+row.values[i*4+3])),parent:identity(path)};
 }else{
  const summary=read(root+'/summary.json');assert.equal(summary.qualifiedNumerical,true,'Unqualified source row cannot fill a cache slot');assert.equal(summary.channel,8);const path=root+'/J2-native.json.gz';data={...read(path),parent:identity(path)};assert.equal(data.coordinateContract,'scene-cache-receiver-local-v1');
 }
 assert.equal(data.physical.table,null,'Registered initial partial-path probe is paper band8 only');assert.equal(data.nativeDirections.length,4374);assert.ok(data.rayleigh.every(x=>Number.isFinite(x)&&x>=0)&&data.mie.every(x=>Number.isFinite(x)&&x>=0));return {...data,seal,root};
}

/** Assemble only explicitly complete source support. No nearest available row,
 * imputed light or zero-filled missing evidence is permitted.
 * @param {string[]} roots @param {number[]} expectedAltitudes @returns {any} */
export function ownedPartialField(roots,expectedAltitudes){
 const rows=roots.map(ownedSourceRow).sort((a,b)=>a.physical.h-b.physical.h);assert.deepEqual(rows.map(row=>row.physical.h),expectedAltitudes);assert.equal(expectedAltitudes[0],0);assert.equal(expectedAltitudes.at(-1),4375);
 const first=rows[0];for(const row of rows){assert.deepEqual(row.nativeDirections,first.nativeDirections);for(const key of ['radius','top','br','bm','ssa','irradiance'])assert.equal(row.physical[key],first.physical[key]);assert.ok(Math.abs(row.physical.sun[2]-first.physical.sun[2])<1e-14);assert.ok(Math.abs(Math.acos(row.physical.sun[2])*180/Math.PI-89.5)<1e-9);}
 const upIndex=first.nativeDirections.findIndex(d=>d[0]===0&&d[1]===0&&d[2]===1);assert.ok(upIndex>=0);
 return {rows,altitudes:expectedAltitudes,rayleigh:rows.flatMap(row=>row.rayleigh),mie:rows.flatMap(row=>row.mie),sum:rows.flatMap(row=>row.rayleigh.map((x,i)=>Math.fround(x+row.mie[i]))),widthJ:4374,upIndex,parents:rows.flatMap(row=>[row.seal,row.parent]),physical:first.physical,target:first.target,scope:'Complete support for radial0-4375m partial pure-L2 only, one registered wavelength/SZA; not a complete spatial cache'};
}
