import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createRun,checked,output,repository,identity,read} from './io.mjs';
import {parents,authenticate} from './refinement-common.mjs';
const reuseIndex=process.argv.indexOf('--reuse-baseline'),reuseBaseline=reuseIndex<0?null:process.argv[reuseIndex+1];
const run=createRun('refine-campaign',[...parents(),...(reuseBaseline?[authenticate(reuseBaseline)]:[]),identity('agents/topics/poc-experiments/engineering-studies/sky-aerosol-properties/refinement-plan.md')]);let failure=null;
/** One child at a time owns the hardware GPU. @param {string[]} args @param {string} label */
async function child(args,label){
 const before=new Set(readdirSync(checked(output+'/runs')));run.progress('launch',label);
 const result=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,args,{cwd:repository,windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';p.stdout.on('data',b=>{stdout+=b;run.progress('child',label+': '+b.toString().trim().slice(-160));});p.stderr.on('data',b=>stderr+=b);p.on('error',reject);p.on('close',code=>resolve({code,stdout,stderr}));});
 run.write(label+'-launch.json',{args,...result});assert.equal(result.code,0,result.stderr+'\n'+result.stdout);
 const allocated=readdirSync(checked(output+'/runs')).filter(n=>!before.has(n)).filter(n=>{const root=output+'/runs/'+n;if(!readdirSync(checked(root)).includes('manifest.json'))return false;const m=JSON.parse(read(root+'/manifest.json').toString());return m.command[1].replaceAll('\\','/').endsWith('/'+args[0])&&JSON.stringify(m.command.slice(2))===JSON.stringify(args.slice(1));});assert.equal(allocated.length,1);const root=output+'/runs/'+allocated[0],seal=authenticate(root);run.write(label+'-result.json',{root,seal});console.log(JSON.stringify({label,root}));return root;
}
try{
 const jobs=[{id:'baseline272',file:'refinement-cache.mjs',args:['--incoming','272','--conditions']},{id:'H2400-272',file:'refinement-cache.mjs',args:['--height','2400','--incoming','272','--conditions']},
 {id:'H2400-noon',file:'refinement-independent.mjs',args:['--height','2400']},
 ...[500,2000].flatMap(h=>[1200,2400].map(H=>({id:`H${H}-h${h}`,file:'refinement-independent.mjs',args:['--height',String(H),'--observer',String(h)]}))),
 ...[1200,2400].map(H=>({id:`H${H}-sun15`,file:'refinement-independent.mjs',args:['--height',String(H),'--sun','15']}))];
 run.write('registration.json',{jobs,selection:'Only H2400 advances initially; loading loses absolute glow and alpha/SSA have much smaller N1 horizon effects. A second finalist requires a distinct measured tradeoff.',numericalSeparation:'Both full caches use the single admitted incoming272 numerical refinement; retain original68 control independently.',order:'Serial GPU, no production writes',estimatedMinutes:'15–25 for this queue from measured pilots; external collection remains separate'});
 for(const job of jobs){if(job.id==='baseline272'&&reuseBaseline){const c=JSON.parse(read(reuseBaseline+'/control.json').toString());assert.equal(c.medium.mieHeight,1200);assert.equal(c.request.transportSpec.domains.incoming.directionCount,272);assert.equal(c.channels.length,15);assert.equal(c.jobs.length,4);run.write(job.id+'-result.json',{root:reuseBaseline,seal:authenticate(reuseBaseline),reused:true});await child(['experiments/sky-aerosol-properties/refinement-cache-report.mjs',reuseBaseline],job.id+'-colors');continue;}const root=await child(['experiments/sky-aerosol-properties/'+job.file,...job.args],job.id);if(job.file==='refinement-cache.mjs')await child(['experiments/sky-aerosol-properties/refinement-cache-report.mjs',root],job.id+'-colors');}
}catch(e){failure=e;run.write('failure.json',{error:String(e)});console.error(e);}finally{run.finish(failure,{purpose:'M1 angular qualification and bounded M3 finalist comparisons across protected conditions'});}if(failure)process.exitCode=1;
