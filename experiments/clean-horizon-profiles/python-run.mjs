import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {createRun, identity, root, source, checked} from './io.mjs';
const name=process.argv[2],script=process.argv[3];
assert.match(script,/^[a-z][a-z0-9-]+\.py$/u);
checked(source+'/'+script);
const run=createRun(name,'Execute contained Python stage '+script,[identity(source+'/'+script),...process.argv.slice(4).map(identity)]);
let stdout='',stderr='';
try{
 const installation=script.startsWith('linux-')?JSON.parse((await import('node:fs')).readFileSync(checked('scripts/libradtran/installation.json'),'utf8')):null;
 const linuxPath=path=>'/mnt/'+path[0].toLowerCase()+path.slice(2).replaceAll('\\','/');
 const executable=installation?installation.wslExecutable:'python';
 const args=installation?['-d',installation.distribution,'--user',installation.user,'--exec','python3','-B',linuxPath(root+'/'+source+'/'+script),run.path]:[source+'/'+script,run.path];
 const code=await new Promise((resolve,reject)=>{const child=spawn(executable,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.on('data',value=>{stdout+=value;process.stdout.write(value);});child.stderr.on('data',value=>{stderr+=value;});child.on('error',reject);child.on('close',resolve);});
 run.write('execution.log',stdout+stderr);
 if(code!==0)throw Error(script+' exited '+code);
 run.finish('accepted',{meaning:'Stage completed; scientific qualification remains explicitly recorded by its result.'});
}catch(error){run.write('failure.json',{message:String(error)});run.write('error.log',stdout+stderr);run.finish('failed',{error:String(error)});process.exitCode=1;}
