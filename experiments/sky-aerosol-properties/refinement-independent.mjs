import assert from 'node:assert/strict';
import {mkdirSync,rmSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {createRun,identity,checked,output} from './io.mjs';
import {parents,medium,queries,centers} from './refinement-common.mjs';
import {direct,boundary} from './reference.mjs';
import {fragment,executeGpu} from './refinement-independent-gpu.mjs';
const option=(n,d)=>process.argv.includes(n)?Number(process.argv[process.argv.indexOf(n)+1]):d;
const H=option('--height',1200),m=medium(H);m.observerHeight=option('--observer',5);if(process.argv.includes('--sun')){const e=option('--sun',15)*Math.PI/180;m.sourceDirection=[0,-Math.cos(e),Math.sin(e)];}
const run=createRun('refine-independ',[...parents(),identity('experiments/sky-accuracy-dials/horizon-reference/gpu.mjs')]),scratch=output+'/scratch/'+run.relative.split('/').at(-1),pilot=process.argv.includes('--pilot'),channels=pilot?[5]:centers.map((_,i)=>i),batches=[];
const pathCount=process.argv.includes('--paths')?Number(process.argv[process.argv.indexOf('--paths')+1]):(pilot?8192:2048);assert.ok([2048,8192].includes(pathCount));
let browser,failure=null,current=0;const started=Date.now();
try{
 const origin=[0,0,m.radius+m.observerHeight],rays=queries(m).filter(r=>['h180-e0.05','h180-e3','sun-1','sun-5'].includes(r.id)).map(r=>({...r,end:boundary(m,origin,r.direction).distance}));
 const profiles=[{name:'main',batches:pilot?8:16,quadrature:128,roulette:8,seed:0x53800000},{name:'refine64',batches:pilot?4:8,quadrature:64,roulette:8,seed:0x53800000}];
 run.write('registration.json',{medium:m,rays,channels,profiles,paths:pathCount,source:identity('experiments/sky-accuracy-dials/horizon-reference/gpu.mjs'),operation:'Only g, SSA and aerosol scale height parameterized in copied cache-free Monte Carlo; no cache or production transport functions',orders:'Pure interactions1/2/3/4 plus unbiased roulette all-orders; black ground',controlVariate:'N1 replaced by converged direct N1 in each batch; higher orders unchanged; raw Monte Carlo N1 retained to test implementation'});
 mkdirSync(checked(scratch,true),{recursive:true});browser=await puppeteer.launch({headless:'new',userDataDir:checked(scratch),protocolTimeout:1800000,args:['--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});const page=await browser.newPage();
 await page.exposeFunction('retainBatch',b=>{batches.push({...b,channel:current});run.progress('monte-carlo',`channel${current} ray${b.group} ${b.profile} batch${b.batch}`,{completed:batches.length,total:channels.length*(pilot?12:24)*4});});
 const shader=fragment(m);run.write('kernel.glsl',shader);const exact=[],telemetry=[];
 for(const channel of channels){current=channel;for(const ray of rays){const group={id:ray.id,medium:m,origin,direction:ray.direction,end:ray.end,channel},a=direct(group,64).total,b=direct(group,128).total;assert.ok(Math.abs(a/b-1)<.002);exact.push({channel,ray:ray.id,value:b,refinement:a/b-1});}
  const result=await page.evaluate(executeGpu,shader,{paths:pathCount,maximumMilliseconds:1800000,profiles,groups:rays.map(r=>({id:r.id,medium:m,origin,direction:r.direction,end:r.end,channel}))});telemetry.push({channel,...result});run.write('batches-'+channel+'.json',batches.filter(b=>b.channel===channel));console.log(JSON.stringify({channel,milliseconds:result.milliseconds}));
 }
 const summaries=[];for(const channel of channels)for(let group=0;group<rays.length;group++)for(const profile of profiles){const rows=batches.filter(b=>b.channel===channel&&b.group===group&&b.profile===profile.name),n1=exact.find(r=>r.channel===channel&&r.ray===rays[group].id).value;const values=rows.map(r=>[n1,r.means[2],r.means[3],r.means[4],r.means[0]-r.means[1]+n1,r.means[1]]),mean=values[0].map((_,k)=>values.reduce((s,r)=>s+r[k],0)/values.length),half=mean.map((mu,k)=>2.365*Math.sqrt(values.reduce((s,r)=>s+(r[k]-mu)**2,0)/(values.length*(values.length-1))));summaries.push({channel,ray:rays[group].id,profile:profile.name,mean,half95:half,cumulativeN4:mean.slice(0,4).reduce((a,b)=>a+b),N4half95:2.365*Math.sqrt(values.reduce((s,r)=>s+(r.slice(0,4).reduce((a,b)=>a+b)-mean.slice(0,4).reduce((a,b)=>a+b))**2,0)/(values.length*(values.length-1)))});}
 run.write('exact.json',exact);run.write('summary.json',summaries);run.write('telemetry.json',{telemetry,milliseconds:Date.now()-started,browser:await browser.version()});
}catch(e){failure=e;run.write('failure.json',{error:String(e),channel:current,completedBatches:batches.length});console.error(e);}finally{await browser?.close().catch(e=>failure??=e);if(browser)rmSync(checked(scratch),{recursive:true});run.finish(failure,{milliseconds:Date.now()-started,batches:batches.length});}if(failure)process.exitCode=1;
