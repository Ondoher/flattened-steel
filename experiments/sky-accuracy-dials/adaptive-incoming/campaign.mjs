import assert from 'node:assert/strict';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import puppeteer from 'puppeteer';
import {createRun,verifyRun,readRepository,identity,sha256,checkedAbsolute,storage} from '../io/files.mjs';
import {sourceFrame,dot} from '../numerics/math.js';
import {phase} from '../horizon-reference/math.mjs';
import {aerosolPhase} from '../horizon/aerosol-optics.mjs';
import {angularGpu} from '../distant-horizon/attribution-reference.mjs';
import {executeGpu} from '../horizon-reference/gpu.mjs';
import {kernel} from '../distant-horizon/toronto-orders.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {render} from '../distant-horizon/attribution-common.mjs';
import {rule as retainedRule,proof as mapProof} from '../incoming-sun/rules.mjs';
import {shader} from '../incoming-sun/incident.mjs';
import {allocate,grid,fixed,qualifies,responseFractions,proof,densities} from './rules.mjs';

export const parent='tmp/experiments/sky-accuracy-dials/runs/00449-h68-incoming-sun';
const original='tmp/experiments/sky-accuracy-dials/runs/00447-h67-sunset-j2';
const paper='tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1';
/** Bounded immutable artifact reader. @param {string} p @returns {any} */
export const read=p=>JSON.parse((p.endsWith('.gz')?gunzipSync(readRepository(p)):readRepository(p)).toString());

/** Authenticated profile inputs, preserving spectral sampling for the local contrast.
 * @returns {any} Complete local requests and independent-reference identities.
 */
export function registration(){
 const control=read(parent+'/control.json.gz'),paperControl=read(paper+'/control.json'),atmosphere=paperControl.buildRequest.transportSpec.atmosphere,toronto={id:'toronto',control:structuredClone(control)},p=structuredClone(control);
 for(const key of ['rayleighScaleHeightMeters','mieScaleHeightMeters','rayleighCoefficientScalePerMeter','mieAngstromAlpha','mieAngstromBeta','miePhaseFunctionG'])assert.equal(p.request.transportSpec.atmosphere[key],atmosphere[key]);
 p.material={phaseTables:p.material.phaseTables.map(()=>null),albedos:p.material.albedos.map(()=>atmosphere.mieSingleScatteringAlbedo)};p.request.transportSpec.atmosphere=structuredClone(atmosphere);p.medium.albedo=atmosphere.mieSingleScatteringAlbedo;
 const materials=[{id:'paper',control:p},toronto];
 const targets=control.targets.map(t=>{const axes=sourceFrame(t.point);return {...t,axis:axes.map(a=>a[2])};});
 const noon=read('tmp/experiments/sky-accuracy-dials/runs/00418-h63-tor-noon/focused-0.json'),pre=read('tmp/experiments/sky-accuracy-dials/runs/00437-h65-pre-gpu/control.json').scenes[0],dusk=read('tmp/experiments/sky-accuracy-dials/runs/00429-h64-dusk-gpu/control.json').scenes;
 const noonElevation=90-noon.solarZenithDegrees,preElevation=90-pre.zenith,twilightElevation=90-dusk.find(s=>s.id==='tw30').zenith,sunsetElevation=90-dusk.find(s=>s.id==='sunset').zenith;
 const heldout=[];for(const elevation of [noonElevation,noonElevation,preElevation,preElevation,twilightElevation,twilightElevation,sunsetElevation,sunsetElevation]){
  const i=heldout.length,h=[0,1200,0,1200,0,1200,8000,8000][i],a=elevation*Math.PI/180,r=control.medium.radius+h,up=/** @type {SkyVector3} */([Math.cos(a),0,Math.sin(a)]),axes=sourceFrame(up),local=[Math.cos(.05*Math.PI/180),0,Math.sin(.05*Math.PI/180)],direction=[0,1,2].map(k=>local.reduce((s,x,j)=>s+x*axes[j][k],0));heldout.push({id:'held-'+i,altitude:h,elevationDegrees:elevation,point:up.map(x=>x*r),direction,instant:i<2?noon.observation.instant:i<4?pre.instant:i<6?'2024-06-21T03:56:03.503Z':'2024-06-21T03:26:03.503Z'});
 }
 return {schema:'h69-layered-registration-v1',profiles:materials,targets,heldout,channels:control.channels,prototype:proof(),analyticMaps:mapProof(),boundaries:{local:'Atmospheric J2 only, same black boundary as H67/H68. Exact paper atmosphere coefficients/phase/SSA; not a paper ground-reflection qualification.',fullPaperGround:paperControl.buildRequest.transportSpec.ground},allocation:'Midpoint latitude Fibonacci strips with reflection pairs; no duplicated pole. Azimuth fixed before radiance scoring. A fixed25/37.5/37.5; B smoothstep altitude500-5000m and solar-ground horizon0-8deg; C pilot352 plus fresh160/672.',floors:'Per-profile fixed max(referenceMean)*1e-8, registered rule before scoring. Error denominator max(referenceMean,floor).',limits:{maximumDirections:1024,referenceMainHistories:262144,referenceControlHistories:65536,referenceReportedBatches:32,referenceRefinementsPerProfile:4},cost:'All actual incident directions including path controls and C pilot/placement validation. Standalone and reuse timings separate.',builderContract:'One per-location grid identity for L transport and J integration; exact physical direction at ground/support rows, no unlike-index cross-row interpolation. Required integration implementation deferred unless H70/H71 survives.',paperBaseline:identity(paper+'/control.json'),torontoBaseline:identity(parent+'/control.json.gz')};
}

/** Same spectral local source equation, species ledger and phase-mass normalization.
 * @param {any} control @param {any} target @param {number} channel @param {any} g @param {number[][]} incident @returns {any}
 */
export function integrate(control,target,channel,g,incident){
 const axes=sourceFrame(target.point),out=axes.map(a=>dot(a,target.direction)),table=control.material.phaseTables[channel],br=control.medium.rayleigh[channel]*Math.exp(-target.altitude/8000),bm=control.medium.mie[channel]*control.material.albedos[channel]*Math.exp(-target.altitude/1200);
 let r=0,m=0,mass=0,rmass=0;for(let i=0;i<g.count;i++){const c=Math.max(-1,Math.min(1,dot(g.nodes[i],out))),pr=phase(c,.7)[0],pm=table?aerosolPhase(table,c):phase(c,.7)[1],L=incident[i][0]+incident[i][1],w=g.weights[i];r+=br*pr*w*L;m+=bm*pm*w*L;mass+=pm*w;rmass+=pr*w;}
 assert.ok(mass>0);return {normalized:r+m/mass,raw:r+m,rayleigh:r,mie:m/mass,mieRaw:m,mieMass:mass,rayleighMass:rmass};
}

/** Hardware page with bounded owned profile. @param {DialRun} run @returns {Promise<any>} */
export async function launch(run){return puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});}

/** Independent paper local-J2 references, exact same initial geometry and coefficients.
 * @param {any} page @param {DialRun} run @param {any} registration @returns {Promise<any[]>}
 */
export async function references(page,run,registration){
 const c=registration.profiles.find(p=>p.id==='paper').control,medium={...c.medium,sourceDirection:[0,0,1]},packets=[];let channel=-1;
 await page.exposeFunction('retainBatch',b=>{packets.push({...b,channel});run.progress('reference',`paper channel${channel} point${b.group} ${b.profile} batch${b.batch}`);});
 const results=[];
 for(channel of c.channels){
  const generated=kernel(null,c.material.albedos[channel]);
  // Use the previously qualified full kernel; only its retained prefix tallies
  // enter local J2. The shortened prototype lost its context before any batches.
  const source=generated.shader;run.write(`paper-kernel-${channel}.glsl.gz`,gzipSync(Buffer.from(source)));
  const groups=registration.targets.map(t=>({id:t.id,origin:t.point,direction:t.direction,medium,channel,end:-1}));
  const telemetry=await page.evaluate(executeGpu,source,{groups,paths:1024,profiles:[{name:'main',batches:256,quadrature:128,roulette:8,seed:1879048192},{name:'control64',batches:64,quadrature:64,roulette:8,seed:1879048192}],maximumMilliseconds:900000});run.write(`paper-reference-telemetry-${channel}.json`,telemetry);
  for(let group=0;group<groups.length;group++){
   const selected=packets.filter(b=>b.channel===channel&&b.group===group&&b.profile==='main'),paired=packets.filter(b=>b.channel===channel&&b.group===group&&b.profile==='control64');assert.equal(selected.length,256);assert.equal(paired.length,64);
   const batches=Array.from({length:32},(_,i)=>selected.slice(i*8,i*8+8).reduce((s,b)=>s+b.means[2],0)/8),mean=batches.reduce((a,b)=>a+b,0)/32,width=halfWidth(batches),coarse=paired.reduce((s,b)=>s+b.means[2],0)/64,fine=selected.slice(0,64).reduce((s,b)=>s+b.means[2],0)/64;
   results.push({profile:'paper',id:groups[group].id,channel,mean,half95:width,relativeHalf95:width/mean,quadratureChange:coarse/fine-1,qualified:mean>0&&width/mean<=.05&&Math.abs(coarse/fine-1)<=.01,batches});
  }
  run.write(`paper-reference-batches-${channel}.json.gz`,gzipSync(Buffer.from(JSON.stringify(packets.filter(b=>b.channel===channel)))));
 }
 const prior=read(original+'/analysis.json').rows;for(const r of prior)results.push({profile:'toronto',id:r.id,channel:r.channel,mean:r.monteCarlo.J2,half95:r.monteCarlo.J2Half95,relativeHalf95:r.monteCarlo.relativeJ2Half95,quadratureChange:r.monteCarlo.quadrature64Relative,qualified:r.J2PrecisionMet,parent:identity(original+'/analysis.json')});
 return results;
}

/** GPU direct incident radiance at one fixed quadrature, with actual evaluation accounting.
 * @param {any} page @param {DialRun} run @param {any} c @param {any} target @param {number} channel @param {any} g @param {string} label @returns {Promise<any>}
 */
export async function evaluate(page,run,c,target,channel,g,label){
 const start=Date.now(),axes=sourceFrame(target.point),directions=g.nodes.map(d=>[0,1,2].map(i=>d.reduce((s,x,j)=>s+x*axes[j][i],0))),source=shader(c.material.phaseTables[channel],c.material.albedos[channel]),incident={},sums={};let renderer='',evaluations=0;
 for(const view of [64,128]){const values=[];for(let offset=0;offset<g.count;offset+=256){run.progress('local',`${label} channel${channel} view${view} ${offset}/${g.count}`);const result=await page.evaluate(angularGpu,source,{directions:directions.slice(offset,offset+256),origin:target.point,altitude:target.altitude,medium:{...c.medium,sourceDirection:[0,0,1]},channel,view});values.push(...result.values);renderer=result.renderer;evaluations+=result.values.length;}incident[view]=values;sums[view]=integrate(c,target,channel,g,values);}
 if(Math.abs(sums[64].normalized/sums[128].normalized-1)>.01){const values=[];for(let offset=0;offset<g.count;offset+=256){run.progress('local',`${label} channel${channel} view256 ${offset}/${g.count}`);const result=await page.evaluate(angularGpu,source,{directions:directions.slice(offset,offset+256),origin:target.point,altitude:target.altitude,medium:{...c.medium,sourceDirection:[0,0,1]},channel,view:256});values.push(...result.values);evaluations+=result.values.length;}incident[256]=values;sums[256]=integrate(c,target,channel,g,values);}
 const fine=sums[256]??sums[128],pathChange=sums[256]?sums[128].normalized/fine.normalized-1:sums[64].normalized/fine.normalized-1;
 return {incident,sums,fine,pathChange,evaluations,milliseconds:Date.now()-start,renderer};
}

/** Compact geometry plot, no invented sky colors. @param {DialRun} run @param {any} r @returns {Promise<void>} */
export async function geometryFigure(run,r){
 const target=r.targets[0],diagrams=['A','B'].map(method=>({method,g:fixed(method,256,target.axis,target.altitude,r.profiles[0].control.medium.radius)}));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="650"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="20" y="30" font-size="22">H69 layered incoming grids: fixed A and geometry B</text><text x="20" y="55">Same geometric rules for paper and Toronto; colors: base blue, Sun orange, horizon green. Not sky colors.</text>${diagrams.map(({method,g},i)=>`<text x="70" y="${95+265*i}">${method}: ${g.counts.join('/')} base/Sun/horizon; area error ${(100*g.relativeArea).toFixed(3)}%</text><rect x="70" y="${110+265*i}" width="1060" height="210" fill="#fafafa" stroke="#aaa"/>${g.nodes.map((d,j)=>`<circle cx="${70+(Math.atan2(d[1],d[0])+Math.PI)/(2*Math.PI)*1060}" cy="${110+265*i+(1-d[2])*105}" r="2.8" fill="${['#315e9e','#df8a22','#28875a'][g.components[j]]}" opacity=".7"/>`).join('')}`).join('')}</g></svg>`;
 await render(run,[{name:'geometry',svg,width:1200,height:650}]);
}

/** Freeze configuration and geometry proofs in a small immutable run.
 * @returns {Promise<void>}
 */
async function register(){
 const r=registration(),run=createRun('h69-registration',{parents:[verifyRun(parent),verifyRun(original),verifyRun(paper)],operation:'Freeze paired paper/Toronto profiles, A/B/C allocation and H69 manufactured midpoint-grid proofs, map identities, held-out geometry recipe and builder contract.',parameters:{profiles:['paper','toronto'],retainedMiB:768,maximumCount:1024}});let failure=null;
 try{run.write('registration.json.gz',gzipSync(Buffer.from(JSON.stringify(r))));run.write('manufactured.json',r.prototype);await geometryFigure(run,r);}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,storage:storage()}));if(failure)throw failure;
}

/** Concatenate one fresh pilot component block, weighting the complete fixed diagnostic mixture.
 * @param {any} base @param {any} extra @param {number} component @returns {any}
 */
function extend(base,extra,component){
 const counts=base.counts.map((n,i)=>n+(i===component?32:0)),indices=extra.components.map((v,i)=>v===component?i:-1).filter(i=>i>=0),nodes=[...base.nodes,...indices.map(i=>extra.nodes[i])],components=[...base.components,...indices.map(()=>component)],weights=nodes.map(d=>1/counts.reduce((s,n,i)=>s+n*densities(d,base.axis,base.horizon)[i],0));
 return {...base,counts,nodes,weights,components,count:nodes.length,relativeArea:weights.reduce((a,b)=>a+b,0)/(4*Math.PI)-1,moments:[0,1,2].map(j=>nodes.reduce((s,d,i)=>s+d[j]*weights[i],0)/(4*Math.PI))};
}

/** Frozen response allocation from pilot sensitivity, not independent reference fit.
 * @param {any} page @param {DialRun} run @param {any} c @param {any} target @param {string} profile @returns {Promise<any>}
 */
async function pilot(page,run,c,target,profile){
 const g=fixed('A',256,target.axis,target.altitude,c.medium.radius),extra=grid([32,32,32],target.axis,target.altitude,c.medium.radius,.2718281828),records=[],indicators=[0,0,0];
 for(const channel of c.channels){
  const main=await evaluate(page,run,c,target,channel,g,profile+' Cpilot'),additional=await evaluate(page,run,c,target,channel,extra,profile+' Cblocks');
  for(let component=0;component<3;component++){
   const joined=extend(g,extra,component),indices=extra.components.map((v,i)=>v===component?i:-1).filter(i=>i>=0),values=[...main.incident[128],...indices.map(i=>additional.incident[128][i])],s=integrate(c,target,channel,joined,values);
   for(const key of ['normalized','raw','rayleigh','mie'])indicators[component]=Math.max(indicators[component],Math.abs(s[key]-main.fine[key])/Math.max(Math.abs(main.fine[key]),Math.abs(main.fine.normalized)*1e-6,1e-30));
  }
  records.push({channel,base:g,extra,main,additional});
 }
 return {profile,target:target.id,indicators,fractions:responseFractions(indicators),records,evaluations:records.reduce((s,r)=>s+r.main.evaluations+r.additional.evaluations,0),milliseconds:records.reduce((s,r)=>s+r.main.milliseconds+r.additional.milliseconds,0),selection:'Maximum relative species/raw/normalized J2 change over three pilot bands. No external reference is consulted. Outgoing holdouts remain unscored.'};
}

/** Local error ledger with conservative reference-sensitivity envelopes.
 * @param {any[]} packets @param {any[]} refs @returns {any}
 */
export function analyze(packets,refs){
 const floors=Object.fromEntries(['paper','toronto'].map(p=>[p,Math.max(...refs.filter(r=>r.profile===p).map(r=>r.mean))*1e-8]));
 const rows=packets.map(p=>{const r=refs.find(r=>r.profile===p.profile&&r.id===p.target&&r.channel===p.channel);assert.ok(r);const value=p.result.fine.normalized,den=Math.max(r.mean,floors[p.profile]),lo=Math.max(0,r.mean-r.half95),hi=r.mean+r.half95,errors=[lo,hi,Math.max(lo,Math.min(hi,value))].map(x=>Math.abs(value-x)/den);return {profile:p.profile,id:p.target,channel:p.channel,method:p.method,budget:p.budget,production:p.grid.count,counts:p.grid.counts,mean:r.mean,half95:r.half95,value,raw:p.result.fine.raw,error:(value-r.mean)/den,absoluteError:Math.abs(value-r.mean)/den,errorLow:Math.min(...errors),errorHigh:Math.max(...errors),pathChange:p.result.pathChange,gridQualified:qualifies(p.grid),referenceQualified:r.qualified,evaluations:p.result.evaluations+(p.method==='C'?p.pilotEvaluations/3:0),milliseconds:p.result.milliseconds+(p.method==='C'?p.pilotMilliseconds/3:0),geometryArea:p.grid.relativeArea,moments:p.grid.moments};});
 const keys=[...new Set(rows.map(r=>[r.profile,r.method,r.budget].join('|')))];
 const summary=keys.map(key=>{const rr=rows.filter(r=>[r.profile,r.method,r.budget].join('|')===key);assert.equal(rr.length,12);return {profile:rr[0].profile,method:rr[0].method,budget:rr[0].budget,mean:rr.reduce((s,r)=>s+r.absoluteError,0)/12,worst:Math.max(...rr.map(r=>r.absoluteError)),meanLow:rr.reduce((s,r)=>s+r.errorLow,0)/12,meanHigh:rr.reduce((s,r)=>s+r.errorHigh,0)/12,worstLow:Math.max(...rr.map(r=>r.errorLow)),worstHigh:Math.max(...rr.map(r=>r.errorHigh)),evaluations:rr.reduce((s,r)=>s+r.evaluations,0),milliseconds:rr.reduce((s,r)=>s+r.milliseconds,0),qualified:rr.every(r=>r.gridQualified&&r.referenceQualified&&Math.abs(r.pathChange)<=.01)};});
 return {floors,rows,summary,decision:'Complete-control frontier, per-profile uncertainty envelopes. No automatic winner from pooled atmosphere scores.'};
}

/** Two-atmosphere H70 screen; conditional later stages consume only qualified survivors.
 * @param {string} registrationRoot @returns {Promise<void>}
 */
async function screen(registrationRoot){
 verifyRun(registrationRoot);const r=read(registrationRoot+'/registration.json.gz'),run=createRun('h70-layer-screen',{parents:[verifyRun(registrationRoot),verifyRun(parent),verifyRun(original)],operation:'H70 paired paper/Toronto continuous-L1 integration; midpoint fixed/geometry layers and fresh C production after charged pilots. New independent paper second-order paths; retained Toronto reference.',parameters:{counts:[256,1024],CBudgets:[512,1024],channels:r.channels,physicalTargets:r.targets.map(t=>t.id),paperBoundary:r.boundaries.local}});
 let browser,failure=null;const packets=[],pilots=[];try{
  run.write('registration.json.gz',gzipSync(Buffer.from(JSON.stringify(r))));browser=await launch(run);const page=await browser.newPage(),refs=await references(page,run,r);run.write('references.json',refs);
  for(const profile of r.profiles){const c=profile.control;
   for(const target of r.targets){
    for(const method of ['A','B','sun','hybrid','ordinary'])for(const budget of method==='ordinary'?[68]:[256,1024]){
     const g=['A','B'].includes(method)?fixed(method,budget,target.axis,target.altitude,c.medium.radius):retainedRule(method,budget,target.axis,target,c);
     g.moments=[0,1,2].map(j=>g.nodes.reduce((s,d,i)=>s+d[j]*g.weights[i],0)/(4*Math.PI));
     let result,reused=null;
     if(profile.id==='toronto'&&['sun','hybrid','ordinary'].includes(method)){
      const old=read(parent+'/packets.json.gz').find(p=>p.target===target.id&&p.channel===c.channels[0]&&p.family===method&&p.count===budget);assert.ok(old);
     }
     for(const channel of c.channels){
      if(profile.id==='toronto'&&['sun','hybrid','ordinary'].includes(method)){const old=read(parent+'/packets.json.gz').find(p=>p.target===target.id&&p.channel===channel&&p.family===method&&p.count===budget);const sums={64:integrate(c,target,channel,g,old.incident64),128:integrate(c,target,channel,g,old.incident128)};assert.ok(Math.abs(sums[128].normalized/old.main.normalized-1)<1e-12);result={incident:{64:old.incident64,128:old.incident128},sums,fine:sums[128],pathChange:sums[64].normalized/sums[128].normalized-1,evaluations:2*budget,milliseconds:old.milliseconds,renderer:old.renderer};reused=identity(parent+'/packets.json.gz');}
      else result=await evaluate(page,run,c,target,channel,g,profile.id+' '+method+budget);
      packets.push({profile:profile.id,target:target.id,channel,method,budget,grid:g,result,reused});
     }
    }
    const selected=await pilot(page,run,c,target,profile.id);pilots.push(selected);
    for(const budget of [512,1024]){const g=grid(allocate(budget-352,selected.fractions),target.axis,target.altitude,c.medium.radius,.61803398875);
     for(const channel of c.channels){const result=await evaluate(page,run,c,target,channel,g,profile.id+' C'+budget);packets.push({profile:profile.id,target:target.id,channel,method:'C',budget,grid:g,result,pilotEvaluations:selected.evaluations,pilotMilliseconds:selected.milliseconds});}
    }
    run.write(`${profile.id}-${target.id}.json.gz`,gzipSync(Buffer.from(JSON.stringify({packets:packets.filter(p=>p.profile===profile.id&&p.target===target.id),pilot:selected}))));
    console.log(JSON.stringify({profile:profile.id,target:target.id,completed:packets.length}));
   }
  }
  const analysis=analyze(packets,refs);run.write('analysis.json',analysis);run.write('summary.tsv',['profile\tmethod\tbudget\tmean\tworst\tmeanLow\tmeanHigh\tworstLow\tworstHigh\tevaluations\tmilliseconds\tqualified',...analysis.summary.map(s=>[s.profile,s.method,s.budget,s.mean,s.worst,s.meanLow,s.meanHigh,s.worstLow,s.worstHigh,s.evaluations,s.milliseconds,s.qualified].join('\t'))].join('\n'));
  run.write('timing.json',{caseMilliseconds:packets.filter(p=>!p.reused).reduce((s,p)=>s+p.result.milliseconds,0),pilotMilliseconds:pilots.reduce((s,p)=>s+p.milliseconds,0),limits:'All actual GPU incident evaluations retained. Reused controls carry historic costs, not new elapsed work. C reuses its one pilot across two budgets; standalone cost charged to each.'});
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,completed:packets.length});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,storage:storage()}));if(failure)throw failure;
}

if(process.argv[2]==='register')await register();
if(process.argv[2]==='screen')await screen(process.argv[3]);
