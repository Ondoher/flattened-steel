import {spawn} from 'node:child_process';
import {createRun,identity,root,source} from './io.mjs';
const role=process.argv[2]??'lidar';if(!['lidar','surface'].includes(role))throw Error('Choose lidar or surface');
const run=createRun(role==='lidar'?'arm-acquire':'arm-surface','Acquire input-ranked clean-date ARM '+role+' data; credentials remain ephemeral',[identity('tmp/experiments/clean-horizon-profiles/runs/00008-arm-optics/manifest.json'),identity('tmp/experiments/clean-horizon-profiles/runs/00012-surface-streams/manifest.json')]);
try{
 const code=await new Promise((resolve,reject)=>{const child=spawn('python',[source+'/arm-acquire.py',run.path,role],{cwd:root,windowsHide:true,stdio:'inherit'});child.on('error',reject);child.on('close',resolve);});
 if(code!==0)throw Error('ARM acquisition exited '+code);
 run.finish('accepted',{meaning:'Acquisition inventory complete; inspect per-file results before scientific use.'});
}catch(error){run.write('failure.json',{message:String(error)});run.finish('failed',{error:String(error)});process.exitCode=1;}
