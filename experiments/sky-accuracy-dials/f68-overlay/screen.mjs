import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createRun,verifyRun,identity,storage} from '../io/files.mjs';
import {read,phaseLedger,reuse} from '../geometry-incoming/common.mjs';
import {integrate,launch,evaluate} from '../adaptive-incoming/campaign.mjs';
import {make,activeGrid,admission} from './rules.mjs';
import {sourceFrame,dot} from '../numerics/math.js';
import {shader} from '../incoming-sun/incident.mjs';
import {angularGpu} from '../distant-horizon/attribution-reference.mjs';
import {score,paired} from '../geometry-incoming/analysis.mjs';

/** Species/raw/total change against the same registered numerical floors. @param {any} a @param {any} b @param {number} floor @returns {number} */
export function change(a,b,floor){return Math.max(...['normalized','raw','rayleigh','mie'].map(key=>Math.abs(a[key]-b[key])/Math.max(Math.abs(b[key]),floor)));}
/** Additional fixed-resolution direct-L1 control, never interpolating saved angles. @param {any} page @param {DialRun} run @param {any} c @param {any} t @param {number} channel @param {any} g @param {number} view @returns {Promise<number[][]>} */
async function trace(page,run,c,t,channel,g,view){const axes=sourceFrame(t.point),directions=g.nodes.map(d=>[0,1,2].map(i=>d.reduce((s,x,j)=>s+x*axes[j][i],0))),source=shader(c.material.phaseTables[channel],c.material.albedos[channel]),values=[];for(let offset=0;offset<g.count;offset+=256){run.progress('path-control',`${t.id} band${channel} ${view}: ${offset}/${g.count}`);const result=await page.evaluate(angularGpu,source,{directions:directions.slice(offset,offset+256),origin:t.point,altitude:t.altitude,medium:{...c.medium,sourceDirection:[0,0,1]},channel,view});values.push(...result.values);}return values;}
/** Shared-denominator two-stream closure, including absent/zero-weight streams. @param {any} c @param {any} t @param {number} channel @param {any} g @param {number[][]} values @param {any} full @returns {any} */
export function streamProof(c,t,channel,g,values,full){
 const parts=[0,1].map(component=>{const weights=g.weights.map((w,i)=>g.components[i]===component?w:0),mass=weights.reduce((s,w)=>s+w,0);if(mass===0)return {rayleigh:0,mieRaw:0,mieMass:0};return integrate(c,t,channel,{...g,weights},values);});
 const rayleigh=parts.reduce((s,p)=>s+p.rayleigh,0),mieRaw=parts.reduce((s,p)=>s+p.mieRaw,0),mieMass=parts.reduce((s,p)=>s+p.mieMass,0),normalized=rayleigh+mieRaw/mieMass;
 assert.ok(Math.abs(normalized-full.normalized)<=1e-12*Math.max(Math.abs(full.normalized),1e-25));return {parts,normalized,closure:Math.abs(normalized/full.normalized-1)};
}

const root=process.argv[2],ids=(process.argv[3]??'balance-256,balance-512,sun-324,sun-580,F68').split(','),offset=Number(process.argv[4]??0),r=read(root+'/registration.json.gz'),references=read(r.reference.path),configs=ids.map(id=>r.configs.find(c=>c.id===id));assert.ok(configs.every(Boolean));
const run=createRun('h84-overlay',{parents:[verifyRun(root),identity(r.reference.path)],operation:'Registered actual-angle continuous L1, same-input two-stream raw/normalized J2 and species/path controls for both atmospheres. No held-out radiance or native recurrence.',parameters:{ids,offset,targets:r.targets.map(t=>t.id),frozenDecision:r.decision,legacyF68Diagnostic:true}}),cache=new Map();cache.set('controls',Object.fromEntries(r.profiles.map(p=>[p.id,p.control])));
let browser,failure=null;const rows=[],blocked=[],index=[];let actual=0,reused=0;
try{
 browser=await launch(run);const page=await browser.newPage();
 for(const profile of r.profiles)for(const target of r.targets){const packets=[],grids=[];
  for(const config of configs){const full=make(config,target,profile.control,offset),check=admission(full),g=activeGrid(full),geometry=config.id+'-o'+offset;grids.push({geometry,config,full,grid:g,check});
   if(!check.local&&config.kind!=='original'){blocked.push({profile:profile.id,target:target.id,geometry,check});continue;}
   for(const channel of r.channels){const c=profile.control,floor=r.floors[profile.id],prior=reuse(profile.id,target,channel,g,cache);let result=prior??await evaluate(page,run,c,target,channel,g,`${profile.id} ${target.id} ${geometry}`);if(prior)reused+=result.evaluations;else actual+=result.evaluations;
    if(change(result.sums[64],result.sums[128],floor)>.01&&!result.sums[256]){result.incident[256]=await trace(page,run,c,target,channel,g,256);result.sums[256]=integrate(c,target,channel,g,result.incident[256]);actual+=g.count;}
    const view=result.sums[256]?256:128,coarse=view===256?128:64,fine=result.sums[view],pathChange=change(result.sums[coarse],fine,floor),ledger=phaseLedger(c,target,channel,g),streams=streamProof(c,target,channel,g,result.incident[view],fine);assert.ok(Math.abs(ledger.sampledMass-fine.mieMass)<1e-12);
    const numerical={...result,fine,pathChange,selectedView:view,convergence:change(result.sums[64],result.sums[128],floor),streams};packets.push({geometry,channel,result:numerical,phase:ledger});
    rows.push({profile:profile.id,target:target.id,channel,config:config.id,offset,count:g.count,nominal:full.count,counts:[g.components.filter(x=>x===0).length,g.components.filter(x=>x===1).length],value:fine.normalized,raw:fine.raw,rayleigh:fine.rayleigh,mie:fine.mie,mieRaw:fine.mieRaw,mieMass:fine.mieMass,phase:ledger,gridArea:g.relativeArea,moments:g.moments,finalistGeometry:check.fine,pathChange,selectedView:view,evaluations:g.count*view,campaignDirectionEvaluations:g.count*Object.keys(result.sums).length,milliseconds:prior?0:result.milliseconds,reused:!!prior,coarseValue:result.sums[coarse].normalized,streams});
   }
  }
  const file=`${profile.id}-${target.id}.json.gz`;run.write(file,gzipSync(Buffer.from(JSON.stringify({profile:profile.id,target:target.id,grids,packets}))));index.push({profile:profile.id,target:target.id,file,cases:packets.length});console.log(JSON.stringify(index.at(-1)));
 }
 await browser.close();browser=null;
 const analysis=score(rows,references),comparisons=[];for(const profile of r.profiles)for(const candidate of configs.filter(c=>c.kind==='balance'||c.kind==='compact'))for(const control of configs.filter(c=>c.kind==='sun')){const a=rows.filter(x=>x.profile===profile.id&&x.config===candidate.id),b=rows.filter(x=>x.profile===profile.id&&x.config===control.id);if(a.length===30&&b.length===30)comparisons.push(paired(rows,references,profile.id,candidate.id,control.id,offset));}
 run.write('index.json',index);run.write('rows.json.gz',gzipSync(Buffer.from(JSON.stringify(rows))));run.write('blocked.json',blocked);run.write('analysis.json',{...analysis,comparisons});run.write('work.json',{actualContinuousL1Directions:actual,reusedContinuousL1Directions:reused,qualifiedPathCases:rows.filter(x=>x.pathChange<=.01).length,cases:rows.length,renderer:rows.length?'Hardware receipt in packets':null});
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,cases:rows.length});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,storage:storage()}));if(failure)throw failure;
