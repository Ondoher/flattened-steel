import assert from 'node:assert/strict';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import puppeteer from 'puppeteer';
import {createRun,verifyRun,readRepository,identity,sha256,checkedAbsolute,storage} from '../io/files.mjs';
import {sourceFrame,dot} from '../numerics/math.js';
import {phase} from '../horizon-reference/math.mjs';
import {aerosolPhase} from '../horizon/aerosol-optics.mjs';
import {angularGpu} from '../distant-horizon/attribution-reference.mjs';
import {render} from '../distant-horizon/attribution-common.mjs';
import {counts,families,k,horizonWidth,rule,proof} from './rules.mjs';
import {shader} from './incident.mjs';

const parent='tmp/experiments/sky-accuracy-dials/runs/00447-h67-sunset-j2',qualified='tmp/experiments/sky-accuracy-dials/runs/00448-h67-j2-verify';
/** Bounded JSON artifact reader. @param {string} p @returns {any} */
const read=p=>JSON.parse((p.endsWith('.gz')?gunzipSync(readRepository(p)):readRepository(p)).toString());

/** Same scattering equation, with raw and normalized aerosol terms retained.
 * @param {any} control @param {any} target @param {number} channel @param {any} grid @param {number[][]} incident @returns {any}
 */
function integrate(control,target,channel,grid,incident){
 const axes=sourceFrame(target.point),outgoing=axes.map(a=>dot(a,target.direction)),table=control.material.phaseTables[channel],br=control.medium.rayleigh[channel]*Math.exp(-target.altitude/8000),bm=control.medium.mie[channel]*control.material.albedos[channel]*Math.exp(-target.altitude/1200);
 let rayleigh=0,mie=0,rayleighMass=0,mieMass=0;
 for(let i=0;i<grid.count;i++){const c=Math.max(-1,Math.min(1,dot(grid.nodes[i],outgoing))),p=phase(c,.7),pm=table?aerosolPhase(table,c):p[1],L=incident[i][0]+incident[i][1],w=grid.weights[i];rayleigh+=br*p[0]*w*L;mie+=bm*pm*w*L;rayleighMass+=p[0]*w;mieMass+=pm*w;}
 assert.ok(mieMass>0);return {raw:rayleigh+mie,normalized:rayleigh+mie/mieMass,rayleigh,mieRaw:mie,mieNormalized:mie/mieMass,rayleighMass,mieMass,relativeArea:grid.relativeArea};
}

/** Recompute comparisons against immutable H67 references.
 * @param {any[]} packets @param {any[]} refs @returns {any}
 */
function reduce(packets,refs){
 const rows=packets.map(p=>{const r=refs.find(r=>r.channel===p.channel&&r.id===p.target);assert.ok(r);const fine=p.fine??p.main;return {id:p.target,channel:p.channel,wavelength:r.wavelength,family:p.family,count:p.count,normalized: fine.normalized,raw:fine.raw,reference:r.monteCarlo.J2,half95:r.monteCarlo.J2Half95,ratio:fine.normalized/r.monteCarlo.J2,rawRatio:fine.raw/r.monteCarlo.J2,normalizedError:fine.normalized/r.monteCarlo.J2-1,rawError:fine.raw/r.monteCarlo.J2-1,mieMass:fine.mieMass,rayleighMass:fine.rayleighMass,relativeArea:fine.relativeArea,path64Relative:p.coarse.normalized/p.main.normalized-1,path256Relative:p.fine?p.main.normalized/p.fine.normalized-1:null,milliseconds:p.milliseconds,geometry:p.geometry};});
 const summary=families.flatMap(family=>counts.map(count=>{const selected=rows.filter(r=>r.family===family&&r.count===count);assert.equal(selected.length,12);return {family,count,meanAbsoluteRelative:selected.reduce((s,r)=>s+Math.abs(r.normalizedError),0)/12,worstAbsoluteRelative:Math.max(...selected.map(r=>Math.abs(r.normalizedError))),rawMeanAbsoluteRelative:selected.reduce((s,r)=>s+Math.abs(r.rawError),0)/12,rawWorstAbsoluteRelative:Math.max(...selected.map(r=>Math.abs(r.rawError))),meanMilliseconds:selected.reduce((s,r)=>s+r.milliseconds,0)/12,maximumPathChange:Math.max(...selected.map(r=>Math.abs(r.path256Relative??r.path64Relative)))};}));
 const baseline=summary.find(s=>s.family==='ordinary'&&s.count===68);for(const s of summary){s['promising']=s.meanAbsoluteRelative<=baseline.meanAbsoluteRelative*.8&&s.worstAbsoluteRelative<=baseline.worstAbsoluteRelative&&s.maximumPathChange<=.01;}
 return {rows,summary,baseline,selection:'All12 previously observed H67 targets; no held-out validation. Promising gate is relative to ordinary68, not a full-cache qualification.'};
}

/** Scientific heatmaps and a physical incoming node/weight diagram.
 * @param {DialRun} run @param {any} analysis @param {any[]} grids @returns {Promise<void>}
 */
async function figures(run,analysis,grids){
 const columns=families.flatMap(family=>counts.map(count=>({family,count}))),cases=analysis.rows.filter(r=>r.family==='ordinary'&&r.count===68);
 const heat=(raw=false)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1370" height="830"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="23">Sunset incoming grids: ${raw?'raw weighted':'existing Mie-normalized'} J2 / independent J2</text><text x="20" y="56">Three wavelengths, same four physical targets.1.00 is the independent answer; all individual cases retained.</text>${columns.map((c,j)=>`<text x="${255+120*j}" y="90" font-size="13">${c.family}</text><text x="${255+120*j}" y="109" font-size="13">${c.count} nodes</text>`).join('')}${cases.map((c,i)=>`<text x="15" y="${151+52*i}">${c.id} ${c.wavelength.toFixed(1)}nm</text>${columns.map((g,j)=>{const r=analysis.rows.find(r=>r.id===c.id&&r.channel===c.channel&&r.family===g.family&&r.count===g.count),v=raw?r.rawRatio:r.ratio,e=Math.abs(v-1),fill=e<.05?'#c7e8d0':e<.2?'#e2edce':e<.5?'#f4dfad':e<1?'#efbd9c':'#e6a1a1';return `<rect x="${245+120*j}" y="${127+52*i}" width="114" height="44" fill="${fill}"/><text x="${260+120*j}" y="${154+52*i}">${v.toFixed(3)}</text>`;}).join('')}`).join('')}<text x="20" y="795">Sun k=.35; hybrid50:50 Sun/physical horizon, Cauchy width.1; proper map/MIS weights. Not a full-cache or color result.</text><text x="20" y="818">Reference empirical95% half-widths1.60-2.59%; GPU view integration64/128 (256 where needed).</text></g></svg>`;
 const selected=grids.filter(g=>g.target==='node-89'&&g.count===256),diagram=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1000"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="25" y="30" font-size="23">Incoming node placement at89.5degree solar zenith</text><text x="25" y="57">256 nodes each; x=local azimuth, y=radial cosine. Circle size shows solid-angle integration weight.</text>${selected.map((g,i)=>{const x0=85,y0=100+290*i,w=1050,h=210;return `<text x="${x0}" y="${y0}">${g.family}; total area error ${(100*g.relativeArea).toFixed(2)}%</text><rect x="${x0}" y="${y0+15}" width="${w}" height="${h}" fill="#f7f7f7" stroke="#aaa"/><path d="M${x0} ${y0+15+h/2}H${x0+w}" stroke="#999" stroke-dasharray="4 4"/>${g.nodes.map((d,j)=>`<circle cx="${x0+(Math.atan2(d[1],d[0])+Math.PI)/(2*Math.PI)*w}" cy="${y0+15+(1-d[2])/2*h}" r="${Math.max(1,Math.min(8,Math.sqrt(g.weights[j])*6))}" fill="#325fa0" opacity=".65"/>`).join('')}<circle cx="${x0+w/2}" cy="${y0+15+(1-g.axis[2])/2*h}" r="6" fill="#e09312"/><text x="${x0}" y="${y0+244}">-180deg</text><text x="${x0+w/2-20}" y="${y0+244}">0deg / Sun</text><text x="${x0+w-65}" y="${y0+244}">180deg</text>`;}).join('')}</g></svg>`;
 await render(run,[{name:'normalized',svg:heat(false),width:1370,height:830},{name:'raw',svg:heat(true),width:1370,height:830},{name:'grids',svg:diagram,width:1200,height:1000}]);
}

/** Qualify every packet, quadrature reduction and saved comparison without mutation.
 * @param {string} root @returns {any} Compact verification result.
 */
function verify(root){
 verifyRun(root);verifyRun(parent);verifyRun(qualified);const control=read(root+'/control.json.gz');assert.deepEqual(control,read(parent+'/control.json.gz'));const grids=read(root+'/grids.json.gz'),packets=read(root+'/packets.json.gz'),refs=read(parent+'/analysis.json').rows;
 assert.equal(grids.length,36);assert.equal(packets.length,108);let replay=0;
 for(const p of packets){const target=control.targets.find(t=>t.id===p.target),g=grids.find(g=>g.id===p.geometry),axes=sourceFrame(target.point),axis=axes.map(a=>a[2]),expected=rule(p.family,p.count,axis,target,control);assert.deepEqual(JSON.parse(JSON.stringify({...g,id:undefined,target:undefined})),JSON.parse(JSON.stringify({...expected,id:undefined,target:undefined})));
  for(const [key,view]of [['coarse',64],['main',128],...(p.fine?[['fine',256]]:[])]){const data=p['incident'+view];assert.equal(data.length,p.count);assert.ok(data.flat().every(x=>Number.isFinite(x)&&x>=0));assert.deepEqual(integrate(control,target,p.channel,g,data),p[key]);}
  if(p.family==='ordinary'&&p.count===68){const r=refs.find(r=>r.id===p.target&&r.channel===p.channel);replay=Math.max(replay,Math.abs(p.main.normalized/r.B.J2-1));}
 }
 assert.ok(replay<5e-5);assert.deepEqual(reduce(packets,refs),read(root+'/analysis.json'));const result={verified:root,grids:36,cases:108,replayMaximum:replay,proof:proof(),summary:read(root+'/analysis.json').summary,storage:storage()};console.log(JSON.stringify(result));return result;
}

/** Stream GPU incident radiance through every frozen rule and reuse H67 independent means.
 * @returns {Promise<void>}
 */
async function main(){
 const parents=[verifyRun(parent),verifyRun(qualified),identity(parent+'/analysis.json')],control=read(parent+'/control.json.gz'),refs=read(parent+'/analysis.json').rows,grids=[];
 const mappingProof=proof();for(const target of control.targets){const axes=sourceFrame(target.point),axis=axes.map(a=>a[2]);for(const family of families)for(const count of counts)grids.push({id:`${target.id}-${family}-${count}`,target:target.id,...rule(family,count,axis,target,control)});}
 if(process.argv[2]==='preflight'){console.log(JSON.stringify({proof:mappingProof,grids:grids.length,estimatedDirectionEvaluations:3*grids.reduce((s,g)=>s+2*g.count,0),storage:storage()}));return;}
 const run=createRun('h68-incoming-sun',{parents,operation:'H68 matched continuous incoming L1 with ordinary, Sun-warped and Sun/horizon MIS quadrature; analytic solid-angle weights, raw and existing normalized Mie integrals; exact H67 physical points and independent references.',parameters:{counts,families,k,horizonWidth,controlHash:sha256(JSON.stringify(control)),controlArtifact:'control.json.gz',chunkDirections:256,viewCounts:[64,128],refinement:'256 if normalized J2 changes above1%',promising:'Mean absolute relative error at least20% lower and worst no worse than ordinary68; path control at most1%.'}});
 let browser,failure=null;const packets=[],timingStart=Date.now();
 try{
  run.write('control.json.gz',gzipSync(Buffer.from(JSON.stringify(control))));run.write('proof.json',mappingProof);run.write('grids.json.gz',gzipSync(Buffer.from(JSON.stringify(grids))));
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});const page=await browser.newPage(),medium={...control.medium,sourceDirection:[0,0,1]};
  for(const channel of control.channels){const generated=shader(control.material.phaseTables[channel],control.material.albedos[channel]);run.write(`shader-${channel}.glsl.gz`,gzipSync(Buffer.from(generated)));
   for(const target of control.targets)for(const g of grids.filter(g=>g.target===target.id)){
    const started=Date.now(),axes=sourceFrame(target.point),directions=g.nodes.map(d=>[0,1,2].map(i=>d.reduce((s,x,j)=>s+x*axes[j][i],0))),record={channel,target:target.id,family:g.family,count:g.count,geometry:g.id};
    for(const view of [64,128]){
     const incident=[];for(let offset=0;offset<directions.length;offset+=256){run.progress('gpu',`channel${channel} ${g.id} view${view} directions${offset}-${Math.min(offset+256,directions.length)}`);const result=await page.evaluate(angularGpu,generated,{directions:directions.slice(offset,offset+256),origin:target.point,altitude:target.altitude,medium,channel,view});incident.push(...result.values);record['renderer']=result.renderer;}
     record['incident'+view]=incident;record[view===64?'coarse':'main']=integrate(control,target,channel,g,incident);
    }
    if(Math.abs(record['coarse'].normalized/record['main'].normalized-1)>.01){const incident=[];for(let offset=0;offset<directions.length;offset+=256){run.progress('gpu',`Refine ${g.id} channel${channel} view256 chunk${offset/256}`);const result=await page.evaluate(angularGpu,generated,{directions:directions.slice(offset,offset+256),origin:target.point,altitude:target.altitude,medium,channel,view:256});incident.push(...result.values);}record['incident256']=incident;record['fine']=integrate(control,target,channel,g,incident);}
    record['milliseconds']=Date.now()-started;packets.push(record);run.write(`case-${channel}-${g.id}.json.gz`,gzipSync(Buffer.from(JSON.stringify(record))));console.log(JSON.stringify({channel,id:g.id,ratio:record['main'].normalized/refs.find(r=>r.channel===channel&&r.id===target.id).monteCarlo.J2,milliseconds:record['milliseconds']}));
   }
  }
  run.write('packets.json.gz',gzipSync(Buffer.from(JSON.stringify(packets))));const analysis=reduce(packets,refs);run.write('analysis.json',analysis);run.write('summary.tsv',['family\tdirections\tmeanAbsoluteRelative\tworstAbsoluteRelative\trawMeanAbsoluteRelative\trawWorstAbsoluteRelative\tmeanMilliseconds\tmaximumPathChange\tpromising',...analysis.summary.map(s=>[s.family,s.count,s.meanAbsoluteRelative,s.worstAbsoluteRelative,s.rawMeanAbsoluteRelative,s.rawWorstAbsoluteRelative,s.meanMilliseconds,s.maximumPathChange,s.promising].join('\t'))].join('\n'));
  await browser.close();browser=null;await figures(run,analysis,grids);run.write('timing.json',{wallMillisecondsBeforeSeal:Date.now()-timingStart,sumMeasuredCaseMilliseconds:packets.reduce((s,p)=>s+p.milliseconds,0),limits:'Case timings include GL context/program/upload/readback per <=256-direction chunk and both64/128 controls. They are not measured production-cache build multipliers.'});
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,completed:packets.length});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;verify(run.path);
}

if(process.argv[2]==='verify'){
 const result=verify(process.argv[3]);if(process.argv[4]==='--record'){const run=createRun('h68-sun-verify',{parents:[verifyRun(process.argv[3]),identity('experiments/sky-accuracy-dials/incoming-sun/run.mjs')],operation:'Read-only H68 verification: exact serialized geometry including JSON signed-zero equivalence, all108 raw/normalized reductions, baseline replay, analytic mapping proofs and comparisons. No radiance change or GPU rerun.'});let failure=null;try{run.write('verification.json',result);}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({verificationRun:run.path}));if(failure)throw failure;}
}else await main();
