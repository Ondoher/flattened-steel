import assert from 'node:assert/strict';
import {gunzipSync,gzipSync} from 'node:zlib';
import {readRepository,identity} from '../io/files.mjs';
import {base,read,verifyRun} from './common.mjs';

/** Load the exact existing binary64 physical-light prefix. Later waves append
 * only new values; immutable parent evidence is never modified or duplicated.
 * @param {string} root @param {number} nv @param {number} nc
 * @returns {number[][]} */
export function precisionLight(root,nv,nc){
 verifyRun(root);if(root===base+'00751-h138-paired-cpu')return read(root+`/light-v${nv}-c${nc}.json.gz`).light;
 const summary=read(root+'/summary.json'),key=`${nv}-${nc}`,record=summary.lightTails[key],prefix=precisionLight(summary.prefixRoot,nv,nc);assert.equal(prefix.length,summary.prefixCount);const bytes=gunzipSync(readRepository(record.path));assert.equal(bytes.byteLength,(summary.count-summary.prefixCount)*2*8);assert.equal(new Uint8Array(new Uint16Array([1]).buffer)[0],1,'Recorded precision stream is little-endian IEEE754 Float64');const values=new Float64Array(Uint8Array.from(bytes).buffer);for(let i=0;i<values.length;i+=2){assert.ok(Number.isFinite(values[i])&&Number.isFinite(values[i+1])&&values[i]>=0&&values[i+1]>=0);prefix.push([values[i],values[i+1]]);}assert.equal(prefix.length,summary.count);return prefix;
}

/** @param {any} run @param {number[][]} values @param {number} prefixCount
 * @param {number} nv @param {number} nc @returns {any} */
export function writePrecisionTail(run,values,prefixCount,nv,nc){
 const array=Float64Array.from(values.slice(prefixCount).flat());assert.equal(new Uint8Array(new Uint16Array([1]).buffer)[0],1);const path=`light-v${nv}-c${nc}-tail.f64.gz`;run.write(path,gzipSync(Buffer.from(array.buffer)));return {...identity(run.path+'/'+path),nv,nc,count:values.length-prefixCount,encoding:'Little-endian IEEE754 Float64 pairs, originating Rayleigh/Mie direct L1; gzip'};
}
