import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {createRun,storage,listFiles,readRepository,identity,repositoryRoot} from '../io/files.mjs';
import {pack,verifyRun} from './common.mjs';

const topic='agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/';
const paths=[...listFiles('experiments/sky-accuracy-dials/illumination-reconstruction'),'experiments/sky-accuracy-dials/io/files.mjs','agents/topics/active-topic.md',...['README.md','status.md','design.md','illumination-reconstruction-plan.md','illumination-reconstruction-results.md','illumination-reconstruction-execution.md'].map(name=>topic+name)].sort();
const run=createRun('h137-source-save',{
 parents:paths.map(path=>identity(path)),
 operation:'Preserve an exact immutable recovery snapshot of the active experiment source and owning documents while an authorized Git object write is denied. This is a source recovery artifact, not a Git commit, scientific qualification or repair of historical run monitoring. Replay every archived byte identity and run the local type check.',
 parameters:{paths,gitCheckpointCreated:false,reason:'Git add cannot write the object database; inherited deny entries remain intact.',costIsGate:false},
});
try {
 const files=[];
 for(const path of paths){run.progress('source-recovery-snapshot',path);const bytes=readRepository(path);files.push({...identity(path,bytes),encoding:'base64',bytes:bytes.toString('base64')});}
 const archive=pack({schemaId:'sky-accuracy-source-recovery-v1',files});
 for(const file of JSON.parse(gunzipSync(archive).toString()).files){const bytes=Buffer.from(file.bytes,'base64');assert.deepEqual(identity(file.path,bytes),{path:file.path,byteLength:file.byteLength,sha256:file.sha256});assert.deepEqual(bytes,readRepository(file.path));}
 run.write('source-recovery.json.gz',archive);
 const types=await new Promise((resolve,reject)=>{execFile(process.execPath,['node_modules/typescript/bin/tsc','-p','experiments/sky-accuracy-dials/jsconfig.json'],{cwd:repositoryRoot,windowsHide:true},(error,stdout,stderr)=>{const result={exitCode:error?.code??0,stdout,stderr};error?reject(Object.assign(error,{result})):resolve(result);});});
 run.write('types.json',types);run.write('summary.json',{files:files.length,archiveBytes:archive.length,exactRecoveryReplay:true,typeCheckPassed:true,gitCheckpointCreated:false,scope:'Immutable source recovery only; scientific results retain their own scope and parent qualification.'});
 run.finish('accepted',{files:files.length,gitCheckpointCreated:false});console.log(JSON.stringify({run:run.path,files:files.length,archiveBytes:archive.length,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
