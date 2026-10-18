import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createRun,verifyRun,identity,storage} from '../io/files.mjs';
import {read,phaseLedger} from '../geometry-incoming/common.mjs';
import {integrate,launch} from '../adaptive-incoming/campaign.mjs';
import {angularGpu} from '../distant-horizon/attribution-reference.mjs';
import {shader} from '../incoming-sun/incident.mjs';
import {sourceFrame} from '../numerics/math.js';
import {score} from '../geometry-incoming/analysis.mjs';
import {admission} from './rules.mjs';
import {make} from './factory.mjs';
import {assertIdleGpu} from './runtime.mjs';

/** Retain species/raw/total convergence with the fixed material floor. @param {any} a @param {any} b @param {number} floor @returns {number} */
export function change(a,b,floor){return Math.max(...['normalized','raw','rayleigh','mie'].map(key=>Math.abs(a[key]-b[key])/Math.max(Math.abs(b[key]),floor)));}
/** Exact-node pool scoped to one physical point and material. @param {any} page @param {DialRun} run @param {any} c @param {any} t @param {number} ch @param {any} g @param {number} view @param {Map<string,any>} pool @param {string} geometry @returns {Promise<any>} */
async function trace(page,run,c,t,ch,g,view,pool,geometry){
 const values=Array(g.count),origins=Array(g.count),missing=[],axes=sourceFrame(t.point);let reused=0,renderer='';
 for(let i=0;i<g.count;i++){const key=JSON.stringify([ch,view,g.nodes[i]]);if(pool.has(key)){const p=pool.get(key);values[i]=p.value;origins[i]=p.origin;renderer=p.renderer;reused++;}else missing.push(i);}
 const source=shader(c.material.phaseTables[ch],c.material.albedos[ch]);
 for(let offset=0;offset<missing.length;offset+=256){const indices=missing.slice(offset,offset+256),directions=indices.map(i=>[0,1,2].map(j=>g.nodes[i].reduce((s,x,k)=>s+x*axes[k][j],0)));if(offset===0)run.progress('local',`${t.id} ${geometry} band${ch} path${view}: ${offset}/${missing.length}`);const result=await page.evaluate(angularGpu,source,{directions,origin:t.point,altitude:t.altitude,medium:{...c.medium,sourceDirection:[0,0,1]},channel:ch,view});renderer=result.renderer;assert.ok(!/swiftshader|llvmpipe|software/i.test(renderer));
  for(let j=0;j<indices.length;j++){const i=indices[j],value=result.values[j],origin={geometry,index:i,channel:ch,view};values[i]=value;origins[i]=origin;pool.set(JSON.stringify([ch,view,g.nodes[i]]),{value,origin,renderer});}
 }
 assert.ok(values.flat().every(x=>Number.isFinite(x)&&x>=0));return {values,origins,actual:missing.length,reused,renderer};
}
/** Raw sector sums use one denominator, including an empty/black sector. @param {any} c @param {any} t @param {number} ch @param {any} g @param {number[][]} values @param {any} full @returns {any} */
export function closure(c,t,ch,g,values,full){const parts=[false,true].map(above=>{const weights=g.weights.map((w,i)=>(g.nodes[i][2]>=g.horizon)===above?w:0);if(weights.every(x=>x===0))return {rayleigh:0,mieRaw:0,mieMass:0};const s=integrate(c,t,ch,{...g,weights},values);return {rayleigh:s.rayleigh,mieRaw:s.mieRaw,mieMass:s.mieMass};}),R=parts.reduce((s,p)=>s+p.rayleigh,0),M=parts.reduce((s,p)=>s+p.mieRaw,0),D=parts.reduce((s,p)=>s+p.mieMass,0),error=Math.abs((R+M/D)/full.normalized-1);assert.ok(error<1e-12);return {parts,error,interpretation:'Below/above ground-tangent directions; sum raw species and phase mass before normalization.'};}

const root=process.argv[3],ids=process.argv[4].split(','),placement=Number(process.argv[5]??0),r=read(root+'/registration.json.gz'),configs=ids.map(id=>r.configs.find(c=>c.id===id));assert.ok(configs.every(Boolean));const mode=process.argv[6]??'development';assert.ok(mode==='development'||(mode==='validation'&&r.validation),'Fresh validation requires a dedicated frozen registration.');
const run=createRun(mode==='validation'?'h93-val-probe':'h90-grid-probe',{parents:[verifyRun(root),identity(r.reference.path)],operation:'Registered actual-angle continuous L1 and local atmospheric J2 for structured/boundary rules; exact per-index reuse within each point/material; shared phase normalization and path convergence.',parameters:{ids,placement,mode,targets:r.targets.map(t=>t.id),caseCount:r.targets.length*r.profiles.length*r.channels.length*configs.length,decision:r.decision}});let browser,failure=null;const rows=[],index=[],blocked=[];let actual=0,reused=0;
try{assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();
 for(const profile of r.profiles)for(const t of r.targets){const grids=[],packets=[],pool=new Map();
  for(const config of configs){const g=make(config,t,profile.control.medium.radius,placement),check=admission(g),geometry=config.id+'-p'+placement;grids.push({geometry,config,grid:g,check});if(!check.local){blocked.push({profile:profile.id,target:t.id,geometry,check});continue;}
   for(const ch of r.channels){const started=Date.now(),incident={},origins={},sums={};let renderer='',caseActual=0,caseReused=0;
    for(const view of [64,128]){const a=await trace(page,run,profile.control,t,ch,g,view,pool,geometry);incident[view]=a.values;origins[view]=a.origins;sums[view]=integrate(profile.control,t,ch,g,a.values);actual+=a.actual;reused+=a.reused;caseActual+=a.actual;caseReused+=a.reused;renderer=a.renderer;}
    if(r.validation?.minimumView===256||change(sums[64],sums[128],r.floors[profile.id])>.01){const a=await trace(page,run,profile.control,t,ch,g,256,pool,geometry);incident[256]=a.values;origins[256]=a.origins;sums[256]=integrate(profile.control,t,ch,g,a.values);actual+=a.actual;reused+=a.reused;caseActual+=a.actual;caseReused+=a.reused;}
    const view=sums[256]?256:128,coarse=view===256?128:64,fine=sums[view],pathChange=change(sums[coarse],fine,r.floors[profile.id]),phase=phaseLedger(profile.control,t,ch,g),sectorClosure=closure(profile.control,t,ch,g,incident[view],fine);assert.ok(pathChange<=.01);assert.ok(Math.abs(phase.sampledMass-fine.mieMass)<1e-12);
    const result={incident,origins,sums,fine,pathChange,selectedView:view,renderer,actual:caseActual,reused:caseReused,milliseconds:Date.now()-started,sectorClosure};packets.push({geometry,channel:ch,result,phase});rows.push({profile:profile.id,target:t.id,channel:ch,config:config.id,offset:placement,count:g.count,value:fine.normalized,raw:fine.raw,rayleigh:fine.rayleigh,mie:fine.mie,mieRaw:fine.mieRaw,mieMass:fine.mieMass,phase,gridArea:g.relativeArea,moments:g.moments,capError:check.capError,finalistGeometry:check.fine,pathChange,selectedView:view,evaluations:g.count*view,milliseconds:result.milliseconds,reused:caseReused===g.count*Object.keys(sums).length,actualDirections:caseActual,reusedDirections:caseReused,coarseValue:sums[coarse].normalized,sectorClosure:sectorClosure.error});
   }
  }
  const file=`${profile.id}-${t.id}.json.gz`;run.write(file,gzipSync(Buffer.from(JSON.stringify({profile:profile.id,target:t.id,grids,packets}))));index.push({profile:profile.id,target:t.id,file,cases:packets.length});console.log(JSON.stringify(index.at(-1)));
 }
 await browser.close();browser=null;const analysis=score(rows,read(r.reference.path));run.write('rows.json.gz',gzipSync(Buffer.from(JSON.stringify(rows))));run.write('index.json',index);run.write('blocked.json',blocked);run.write('analysis.json.gz',gzipSync(Buffer.from(JSON.stringify(analysis))));run.write('summary.json',analysis.summary);run.write('work.json',{cases:rows.length,actualDirections:actual,reusedDirections:reused,limits:'Exact-node reuse saves campaign execution only; all standalone directions/path work remain charged.'});
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,cases:rows.length});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,storage:storage()}));if(failure)throw failure;
