import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRun,root,identity} from './io.mjs';

const run=createRun('trace-plot-tools','Acquire prebuilt scientific plotting libraries into this ignored immutable run; no native compilation',[identity('experiments/clean-horizon-profiles/trace-plot-tools.mjs')]);let failure;
try{
 const output=await new Promise((resolve,reject)=>{const child=spawn('python',['-m','pip','install','--only-binary=:all:','--no-cache-dir','--disable-pip-version-check','--target',run.absolute+'/python','matplotlib'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);child.on('close',code=>resolve({code,stdout,stderr}));});run.write('installation.json',output);assert.equal(output['code'],0,output['stderr']);
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}run.finish(failure?'failed':'accepted',{failure});if(failure)process.exitCode=1;
