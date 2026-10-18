import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {read,integrate,evaluate,launch} from '../adaptive-incoming/campaign.mjs';
import {sourceFrame,dot} from '../numerics/math.js';
import {phase} from '../horizon-reference/math.mjs';
import {aerosolPhase} from '../horizon/aerosol-optics.mjs';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {readRepository,identity,sha256,verifyRun,resolveRepository} from '../io/files.mjs';
import {make,eligible,proof} from './rules.mjs';

export const previous='tmp/experiments/sky-accuracy-dials/runs/00454-h70-layer-screen';
export const priorRegistration='tmp/experiments/sky-accuracy-dials/runs/00452-h69-registration';
export const placements=[0,.2718281828459045];
export {read,integrate,evaluate,launch,make,eligible};

/** A synthetic physical geometry; source is world+Z, labels do not imply civil instants.
 * @param {string} id @param {number} altitude @param {number} elevation @param {number} viewElevation @param {number} azimuth @param {number} radius @returns {any}
 */
export function target(id,altitude,elevation,viewElevation,azimuth,radius){
 const a=elevation*Math.PI/180,e=viewElevation*Math.PI/180,p=azimuth*Math.PI/180,up=[Math.cos(a),0,Math.sin(a)],point=/** @type {SkyVector3} */([up[0]*(radius+altitude),up[1]*(radius+altitude),up[2]*(radius+altitude)]),axes=sourceFrame(point),local=[Math.cos(e)*Math.cos(p),Math.cos(e)*Math.sin(p),Math.sin(e)],direction=[0,1,2].map(i=>local.reduce((s,x,j)=>s+x*axes[j][i],0));
 return {id,altitude,elevationDegrees:elevation,point,direction,axis:axes.map(v=>v[2]),viewElevationDegrees:viewElevation,azimuthDegrees:azimuth,kind:'synthetic-development'};
}

/** Register development/reserved geometry and native cost without exposing validation radiance.
 * @returns {any}
 */
export function registration(){
 const prior=read(priorRegistration+'/registration.json.gz'),radius=prior.profiles[0].control.medium.radius,dev=[[250,30,.05,5],[250,.25,3,90],[2500,30,20,180],[2500,.25,.05,5],[12000,30,3,90],[12000,-.75,20,180]].map((v,i)=>target('dev-'+i,v[0],v[1],v[2],v[3],radius));
 const original=prior.targets,reserved=prior.heldout.map(t=>({...t,axis:sourceFrame(t.point).map(v=>v[2]),kind:'reserved'}));
 for(let i=0;i<original.length;i++){const t=original[i],axes=sourceFrame(t.point),e=.3*Math.PI/180,a=[90,180,45,135][i]*Math.PI/180,local=[Math.cos(e)*Math.cos(a),Math.cos(e)*Math.sin(a),Math.sin(e)],direction=[0,1,2].map(k=>local.reduce((s,x,j)=>s+x*axes[j][k],0));reserved.push({...t,id:'reserved-out-'+i,direction,kind:'reserved-outgoing'});}
 const identities=new Set([...original,...dev].map(t=>JSON.stringify([t.point,t.direction])));assert.ok(reserved.every(t=>!identities.has(JSON.stringify([t.point,t.direction]))));
 const spec=prior.profiles[0].control.request.transportSpec,rows=spec.domains.position.count*spec.domains.solarZenith.count,J=spec.domains.outgoing.directionCount*rows*4;
 return {schema:'h75-geometry-incoming-v1',profiles:prior.profiles,original,development:dev,targets:[...original,...dev],reserved,channels:prior.channels,placements,proof:proof(),priorReferences:identity(previous+'/references.json'),geometryFrame:'Source world+Z; sourceFrame receiver-local axes, exact physical direction identity per native row.',boundary:prior.boundaries,phaseReference:'Toronto normalized piecewise-linear cosine PDF integrates exactly by trapezoids; paper CS phase integrated by independent Gauss256. Samples retain actual outgoing-dependent grid mass.',bootstrap:{replicates:2000,seed:1013904223,unit:'Each target group has independently offset histories; band batches within one target/profile share seeds and are resampled with identical indices. Profiles/groups independent. Percentiles empirical, not simultaneous guarantees.',decision:'Paired one-sided95% margins decide thresholds; coupled interval bounds are sensitivity checks and any disagreement is disclosed.'},costAudit:{rows,positionCount:spec.domains.position.count,solarCount:spec.domains.solarZenith.count,outgoingCount:spec.domains.outgoing.directionCount,JBytes:J,counts:[1024,1408,2048,4096].map(n=>({n,LBytes:n*rows*4,fullDirectionTableBytes:n*rows*16,conservativeTwoJTwoLBytes:2*J+2*n*rows*4,proceduralMetadataBytes:rows*8*4+n*2*4,groundFourSupportPathWorkFraction:4/spec.domains.position.count})),route:'Derive same physical directions/weights procedurally from per-row metadata and base mu/phi stream in builder-only GLSL; avoids full per-row direction records. Ground support re-evaluates transport at requested physical direction, not unlike indices. Preflight estimate, not implementation or measured build benchmark.',limits:'MAX_TEXTURE_SIZE/MAX_VIEWPORT_DIMS checked on hardware; native boundary implementation/proofs required before any full recurrence.'}};
}

/** Exact phase mass and grid numerator/denominator diagnostic at each witness.
 * @param {any} c @param {any} t @param {number} channel @param {any} g @returns {any}
 */
export function phaseLedger(c,t,channel,g){
 const table=c.material.phaseTables[channel],axes=sourceFrame(t.point),out=axes.map(a=>dot(a,t.direction));let exact;
 if(table){exact=0;for(let i=1;i<table.mu.length;i++)exact+=(table.mu[i]-table.mu[i-1])*(table.pdf[i]+table.pdf[i-1])/2;}else{const q=gauss(256);exact=4*Math.PI*q.nodes.reduce((s,x,i)=>s+q.weights[i]*phase(2*x-1,.7)[1],0);}
 assert.ok(Math.abs(exact-1)<1e-10);let sampled=0,rayleigh=0;for(let i=0;i<g.count;i++){const cosine=Math.max(-1,Math.min(1,dot(g.nodes[i],out)));sampled+=g.weights[i]*(table?aerosolPhase(table,cosine):phase(cosine,.7)[1]);rayleigh+=g.weights[i]*phase(cosine,.7)[0];}
 return {exactMass:exact,sampledMass:sampled,relativeMass:sampled/exact-1,rayleighMass:rayleigh,tableIdentity:sha256(JSON.stringify(table)),phaseConvention:'P per steradian; table.pdf is the normalized cosine density; divide by2*pi.'};
}

/** Reuse immutable independent histories and expose species-resolved N2 tallies.
 * @returns {any[]}
 */
export function oldReferences(){
 const refs=read(previous+'/references.json');for(const profile of ['paper','toronto'])for(const channel of [3,5,8]){
  const root=profile==='paper'?previous:'tmp/experiments/sky-accuracy-dials/runs/00447-h67-sunset-j2',name=profile==='paper'?`paper-reference-batches-${channel}.json.gz`:`microbatches-${channel}.json.gz`,micro=read(root+'/'+name);
  for(let group=0;group<4;group++){const selected=micro.filter(b=>b.group===group&&b.profile==='main'),row=refs.find(r=>r.profile===profile&&r.channel===channel&&r.id===['node-89','node-90','view-0','view-4'][group]);assert.equal(selected.length,256);
   row.batches=Array.from({length:32},(_,i)=>selected.slice(8*i,8*i+8).reduce((s,b)=>s+b.means[2],0)/8);
   row.rayleighBatches=Array.from({length:32},(_,i)=>selected.slice(8*i,8*i+8).reduce((s,b)=>s+b.means[12],0)/8);row.mieBatches=Array.from({length:32},(_,i)=>selected.slice(8*i,8*i+8).reduce((s,b)=>s+b.means[13],0)/8);
   row.rayleigh=row.rayleighBatches.reduce((s,x)=>s+x,0)/32;row.mie=row.mieBatches.reduce((s,x)=>s+x,0)/32;assert.ok(Math.abs((row.rayleigh+row.mie)/row.mean-1)<1e-5);row.parent=identity(root+'/'+name);
  }
 }
 return refs;
}

/** Compact directional identity; incident values can be reused across changed mixture weights.
 * @param {any} g @returns {string}
 */
export const nodeHash=g=>sha256(JSON.stringify(g.nodes));

/** Locate compatible retained incident values, without changing historical evidence.
 * @param {string} profile @param {any} t @param {number} channel @param {any} g @param {Map<string,any>} cache @returns {any|null}
 */
export function reuse(profile,t,channel,g,cache){
 const roots=['tmp/experiments/sky-accuracy-dials/runs/00476-h79-wave','tmp/experiments/sky-accuracy-dials/runs/00473-h79-wave','tmp/experiments/sky-accuracy-dials/runs/00471-h79-wave','tmp/experiments/sky-accuracy-dials/runs/00467-h79-wave','tmp/experiments/sky-accuracy-dials/runs/00464-h79-wave','tmp/experiments/sky-accuracy-dials/runs/00462-h79-wave','tmp/experiments/sky-accuracy-dials/runs/00458-h75-placement',previous];
 for(const root of roots){
  const file=root+`/${profile}-${t.id}.json.gz`,key=file;if(!cache.has(key)){
   if(!existsSync(resolveRepository(file,'',false))){cache.set(key,null);continue;}
   if(!cache.has(root)){verifyRun(root);cache.set(root,true);}cache.set(key,read(file));
  }
  const data=cache.get(key);if(!data)continue;
  const p=data.packets.find(p=>{const grid=p.grid??data.grids?.find(x=>x.id===p.geometry)?.grid;return grid&&p.channel===channel&&nodeHash(grid)===nodeHash(g);});if(!p)continue;
  const sums={};for(const v of Object.keys(p.result.incident))sums[v]=integrate(cache.get('controls')[profile],t,channel,g,p.result.incident[v]);const fine=sums[256]??sums[128];
  return {incident:p.result.incident,sums,fine,pathChange:sums[256]?sums[128].normalized/fine.normalized-1:sums[64].normalized/fine.normalized-1,evaluations:g.count*Object.keys(sums).length,milliseconds:p.result.milliseconds,renderer:p.result.renderer,reused:identity(file)};
 }
 return null;
}

/** Generic retained local screen, all actual grids pass preflight before tracing.
 * @param {any} page @param {DialRun} run @param {any} reg @param {any[]} targets @param {any[]} configs @param {number[]} offsets @returns {Promise<any>}
 */
export async function screen(page,run,reg,targets,configs,offsets=[0]){
 const index=[],cache=new Map(),rows=[];cache.set('controls',Object.fromEntries(reg.profiles.map(p=>[p.id,p.control])));let actualEvaluations=0,reusedEvaluations=0;
 for(const profile of reg.profiles)for(const t of targets){
  const c=profile.control,grids=[],packets=[],blocked=[];
  for(const config of configs)for(const offset of offsets){
   const g=make(config,t,c.medium.radius,offset),geometry=config.id+'-o'+offset,passing=eligible(g);grids.push({id:geometry,config,grid:g,passing});
   for(const channel of reg.channels){const ledger=phaseLedger(c,t,channel,g);if(!passing){blocked.push({config:config.id,offset,channel,ledger,reason:'Area/first-moment prelaunch gate; no atmospheric work.'});continue;}
    const prior=reuse(profile.id,t,channel,g,cache),result=prior??await evaluate(page,run,c,t,channel,g,profile.id+' '+t.id+' '+config.id+' '+offset);assert.ok(Math.abs(ledger.sampledMass-result.fine.mieMass)<1e-12);
    if(prior)reusedEvaluations+=result.evaluations;else actualEvaluations+=result.evaluations;
    packets.push({geometry,channel,result,phase:ledger});rows.push({profile:profile.id,target:t.id,channel,config:config.id,offset,count:g.count,counts:g.counts,value:result.fine.normalized,raw:result.fine.raw,rayleigh:result.fine.rayleigh,mie:result.fine.mie,mieRaw:result.fine.mieRaw,mieMass:result.fine.mieMass,phase:ledger,gridArea:g.relativeArea,moments:g.moments,finalistGeometry:eligible(g,true),pathChange:result.pathChange,evaluations:result.evaluations,milliseconds:result.milliseconds,reused:!!prior});
   }
  }
  const file=`${profile.id}-${t.id}.json.gz`;run.write(file,gzipSync(Buffer.from(JSON.stringify({profile:profile.id,target:t.id,grids,packets,blocked}))));index.push({profile:profile.id,target:t.id,file,cases:packets.length,blocked:blocked.length});console.log(JSON.stringify(index.at(-1)));
 }
 return {rows,index,actualEvaluations,reusedEvaluations};
}
