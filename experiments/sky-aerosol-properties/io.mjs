import assert from 'node:assert/strict';
import {lstatSync,realpathSync,readFileSync,writeFileSync,readdirSync,mkdirSync,openSync,writeSync,fsyncSync,closeSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const repository=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
export const output='tmp/experiments/sky-aerosol-properties';
assert.ok(lstatSync(path.join(repository,'AGENTS.md')).isFile());
/** Resolve each component without following links or junctions. @param {string} name @param {boolean} [missing] @returns {string} */
export function checked(name,missing=false){
 assert.ok(!path.isAbsolute(name)&&!name.split('/').some(x=>!x||x==='.'||x==='..'));
 let current=repository;
 for(const piece of ['',...name.split('/')]){if(piece)current=path.join(current,piece);try{const info=lstatSync(current);assert.ok(!info.isSymbolicLink());assert.equal(realpathSync(current).toLowerCase(),current.toLowerCase());}catch(error){if(missing&&error.code==='ENOENT')continue;throw error;}}
 return current;
}
/** Read an authenticated input. @param {string} name @returns {Buffer} */
export function read(name){return readFileSync(checked(name));}
/** Identify an ordinary repository artifact. @param {string} name @returns {AerosolArtifact} */
export function identity(name){const bytes=read(name);return {path:name,byteLength:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}
/** Allocate one immutable evidence execution. @param {string} name @param {AerosolArtifact[]} parents */
export function createRun(name,parents){
 assert.match(name,/^[a-z][a-z0-9-]{0,15}$/);
 const runs=output+'/runs';mkdirSync(checked(runs,true),{recursive:true});checked(runs);
 let highest=-1;
 for(const item of readdirSync(checked(runs))){if(/^\d{5}/.test(item)){assert.match(item,/^\d{5}-[a-z][a-z0-9-]{0,15}$/);highest=Math.max(highest,Number(item.slice(0,5)));}}
 assert.ok(highest<99999);const relative=runs+'/'+String(highest+1).padStart(5,'0')+'-'+name;
 mkdirSync(checked(relative,true));checked(relative);let terminal=false,phase='start',message='Run allocated';
 /** Append a flushed event. @param {string} nextPhase @param {string} text @param {object} [extra] */
 function progress(nextPhase,text,extra={}){assert.ok(!terminal);phase=nextPhase;message=text;const fd=openSync(checked(relative+'/progress.jsonl',true),'a');try{writeSync(fd,JSON.stringify({timestamp:new Date().toISOString(),phase,message,...extra})+'\n');fsyncSync(fd);}finally{closeSync(fd);}}
 /** Write a new artifact exclusively. @param {string} file @param {unknown} value */
 function write(file,value){assert.ok(!terminal);assert.ok(!file.includes('/'));writeFileSync(checked(relative+'/'+file,true),Buffer.isBuffer(value)||typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
 progress('start',message);const heartbeat=setInterval(()=>progress(phase,message,{heartbeat:true}),25000);
 /** Seal closed files and preserve failures. @param {Error|null} failure @param {object} facts */
 function finish(failure,facts){clearInterval(heartbeat);progress('terminal',failure?String(failure):'Completed',{state:failure?'failed':'accepted'});const artifacts=readdirSync(checked(relative)).map(file=>identity(relative+'/'+file));write('manifest.json',{state:failure?'failed':'accepted',finishedAt:new Date().toISOString(),command:process.argv,node:process.version,parents,facts,artifacts});terminal=true;}
 return {relative,absolute:checked(relative),write,progress,finish};
}
