import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createRun,verifyRun,readRepository,identity,storage,sha256} from '../io/files.mjs';
import {sourceFrame} from '../numerics/math.js';
import {render} from '../distant-horizon/attribution-common.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {rule as retainedRule} from '../incoming-sun/rules.mjs';
import {allocate,grid,fixed,responseFractions,qualifies,proof} from './rules.mjs';
import {read,integrate,analyze,parent} from './campaign.mjs';

/** JSON's exact representable geometry deliberately identifies signed zero with zero.
 * @param {any} value @returns {any}
 */
const serialized=value=>JSON.parse(JSON.stringify(value));

/** Recompute and authenticate numerical payloads, references and proposal identities.
 * @param {string} root @returns {any}
 */
function verify(root){
 verifyRun(root);const reg=read(root+'/registration.json.gz'),refs=read(root+'/references.json'),packets=[],pilots=[];assert.deepEqual(proof(),reg.prototype);let maximumReplay=0,maximumPath=0,actualEvaluations=0,reusedEvaluations=0;
 for(const profile of reg.profiles)for(const target of reg.targets){
  const data=read(root+`/${profile.id}-${target.id}.json.gz`);assert.equal(data.packets.length,33);pilots.push(data.pilot);packets.push(...data.packets);
  const c=profile.control,pilot=data.pilot,indicators=[0,0,0];assert.equal(pilot.records.length,3);
  for(const pr of pilot.records){
   assert.deepEqual(serialized(pr.base),serialized(fixed('A',256,target.axis,target.altitude,c.medium.radius)));assert.deepEqual(serialized(pr.extra),serialized(grid([32,32,32],target.axis,target.altitude,c.medium.radius,.2718281828)));
   for(const record of [pr.main,pr.additional])for(const view of Object.keys(record.sums)){const g=record===pr.main?pr.base:pr.extra;assert.deepEqual(integrate(c,target,pr.channel,g,record.incident[view]),record.sums[view]);}
   for(let component=0;component<3;component++){
    const counts=pr.base.counts.map((n,i)=>n+(i===component?32:0)),indices=pr.extra.components.map((v,i)=>v===component?i:-1).filter(i=>i>=0),nodes=[...pr.base.nodes,...indices.map(i=>pr.extra.nodes[i])];
    // Reuse exact serialized proposal density equation through a retained diagnostic helper below.
    const weights=nodes.map(d=>mixtureWeight(d,counts,pr.base.axis,pr.base.horizon)),joined={...pr.base,count:nodes.length,counts,nodes,weights},values=[...pr.main.incident[128],...indices.map(i=>pr.additional.incident[128][i])],s=integrate(c,target,pr.channel,joined,values);
    for(const key of ['normalized','raw','rayleigh','mie'])indicators[component]=Math.max(indicators[component],Math.abs(s[key]-pr.main.fine[key])/Math.max(Math.abs(pr.main.fine[key]),Math.abs(pr.main.fine.normalized)*1e-6,1e-30));
   }
   actualEvaluations+=pr.main.evaluations+pr.additional.evaluations;
  }
  assert.deepEqual(indicators,pilot.indicators);assert.deepEqual(responseFractions(indicators),pilot.fractions);
  for(const p of data.packets){
   assert.equal(p.target,target.id);assert.equal(p.profile,profile.id);let expected;
   if(['A','B'].includes(p.method))expected=fixed(p.method,p.budget,target.axis,target.altitude,c.medium.radius);
   else if(p.method==='C')expected=grid(allocate(p.budget-352,pilot.fractions),target.axis,target.altitude,c.medium.radius,.61803398875);
   else expected=retainedRule(p.method,p.budget,target.axis,target,c);
   expected.moments=[0,1,2].map(j=>expected.nodes.reduce((s,d,i)=>s+d[j]*expected.weights[i],0)/(4*Math.PI));assert.deepEqual(serialized(p.grid),serialized(expected));
   assert.ok(!/software|swiftshader|llvmpipe/i.test(p.result.renderer));
   for(const view of Object.keys(p.result.sums)){assert.equal(p.result.incident[view].length,p.grid.count);assert.ok(p.result.incident[view].flat().every(x=>Number.isFinite(x)&&x>=0));assert.deepEqual(integrate(c,target,p.channel,p.grid,p.result.incident[view]),p.result.sums[view]);}
   const fine=p.result.sums[256]??p.result.sums[128];assert.deepEqual(fine,p.result.fine);maximumPath=Math.max(maximumPath,Math.abs(p.result.pathChange));
   if(p.reused){const old=read(parent+'/packets.json.gz').find(r=>r.target===p.target&&r.channel===p.channel&&r.family===p.method&&r.count===p.budget);maximumReplay=Math.max(maximumReplay,Math.abs(p.result.fine.normalized/old.main.normalized-1));reusedEvaluations+=p.result.evaluations;}else actualEvaluations+=p.result.evaluations;
  }
 }
 assert.equal(packets.length,264);assert.equal(new Set(packets.map(p=>[p.profile,p.target,p.channel,p.method,p.budget].join('|'))).size,264);assert.ok(maximumReplay<1e-12);assert.equal(sha256(JSON.stringify(analyze(packets,refs))),sha256(JSON.stringify(read(root+'/analysis.json'))),'Exact JSON-representable analysis replay');
 const c=reg.profiles.find(p=>p.id==='paper').control;for(const channel of reg.channels){
  const batches=read(root+`/paper-reference-batches-${channel}.json.gz`);assert.equal(batches.length,1280);
  for(let group=0;group<4;group++){
   const main=batches.filter(b=>b.group===group&&b.profile==='main'),coarse=batches.filter(b=>b.group===group&&b.profile==='control64');assert.equal(main.length,256);assert.equal(coarse.length,64);assert.deepEqual(main.map(b=>b.batch),Array.from({length:256},(_,i)=>i));assert.deepEqual(coarse.map(b=>b.batch),Array.from({length:64},(_,i)=>i));
   const combined=Array.from({length:32},(_,i)=>main.slice(i*8,i*8+8).reduce((s,b)=>s+b.means[2],0)/8),r=refs.find(r=>r.profile==='paper'&&r.channel===channel&&r.id===reg.targets[group].id);assert.deepEqual(combined,r.batches);assert.equal(combined.reduce((s,x)=>s+x,0)/32,r.mean);assert.equal(halfWidth(combined),r.half95);
  }
 }
 assert.ok(refs.every(r=>r.qualified));
 return {root,registration:reg,packets,pilots,references:refs,analysis:read(root+'/analysis.json'),verification:{cases:264,uniqueCases:264,pilotLocations:8,paperReferenceMicrobatches:3840,exactGeometryAndReductions:true,maximumRetainedReplay:maximumReplay,maximumPathChange:maximumPath,actualIncidentEvaluations:actualEvaluations,reusedControlEvaluations:reusedEvaluations,allHardware:true,referencePhysics:{profiles:['paper','toronto'],sharedAtmosphericBoundary:true,paperGrassReflectionQualified:false},heldoutInputs:[identity('tmp/experiments/sky-accuracy-dials/runs/00418-h63-tor-noon/focused-0.json'),identity('tmp/experiments/sky-accuracy-dials/runs/00437-h65-pre-gpu/control.json'),identity('tmp/experiments/sky-accuracy-dials/runs/00429-h64-dusk-gpu/control.json')]}};
}

import {densities} from './rules.mjs';
/** Independently replay a complete fixed-proposal balance weight.
 * @param {number[]} d @param {number[]} counts @param {number[]} axis @param {any} h @returns {number}
 */
function mixtureWeight(d,counts,axis,h){const q=densities(d,axis,h);return 1/counts.reduce((s,n,i)=>s+n*q[i],0);}

/** Rebound sensitivity envelope with the reference in both residual and denominator.
 * Raw payloads/nominal errors stay immutable; new report explicitly records derivation.
 * @param {any} verified @returns {any}
 */
function decision(verified){
 const a=verified.analysis,rows=a.rows.map(r=>{const lo=Math.max(0,r.mean-r.half95),hi=r.mean+r.half95,floor=a.floors[r.profile],values=[lo,hi,Math.max(lo,Math.min(hi,r.value))],e=values.map(x=>Math.abs(r.value-x)/Math.max(x,floor));return {...r,errorLow:Math.min(...e),errorHigh:Math.max(...e)};}),summary=a.summary.map(s=>{const rr=rows.filter(r=>r.profile===s.profile&&r.method===s.method&&r.budget===s.budget);return {...s,meanLow:rr.reduce((x,r)=>x+r.errorLow,0)/12,meanHigh:rr.reduce((x,r)=>x+r.errorHigh,0)/12,worstLow:Math.max(...rr.map(r=>r.errorLow)),worstHigh:Math.max(...rr.map(r=>r.errorHigh))};});
 const verdicts=[];for(const method of ['A','B','C'])for(const budget of method==='C'?[512,1024]:[256,1024]){
  const profileVerdicts=['paper','toronto'].map(profile=>{const candidate=summary.find(s=>s.profile===profile&&s.method===method&&s.budget===budget),controls=summary.filter(s=>s.profile===profile&&s.qualified&&['sun','hybrid'].includes(s.method)),comparisons=controls.map(control=>{
   const worseMean=candidate.meanLow>control.meanHigh*1.2&&candidate.meanLow-control.meanHigh>.02,worseWorst=candidate.worstLow>control.worstHigh*1.2&&candidate.worstLow-control.worstHigh>.02;
   const material=worseMean||worseWorst,sameCost=candidate.evaluations===control.evaluations,route1=sameCost&&(candidate.meanHigh<=.8*control.meanLow||candidate.worstHigh<=.8*control.worstLow)&&!material,route2=candidate.evaluations<=.75*control.evaluations&&candidate.meanHigh<=1.1*control.meanLow&&candidate.worstHigh<=1.1*control.worstLow;
   return {method:control.method,budget:control.budget,materialRegression:material,worseMean,worseWorst,route1,route2};
  });
  return {profile,qualified:candidate.qualified,comparisons,resolvedRegression:comparisons.some(c=>c.materialRegression),resolvedGain:comparisons.some(c=>c.route1||c.route2),status:!candidate.qualified?'unqualified':comparisons.some(c=>c.materialRegression)?'rejected':comparisons.some(c=>c.route1||c.route2)?'promising':'inconclusive'};
  });
  const rejected=profileVerdicts.some(p=>p.resolvedRegression||!p.qualified),advance=!rejected&&profileVerdicts.some(p=>p.resolvedGain);verdicts.push({method,budget,status:rejected?'rejected':advance?'requires-further-validation':'inconclusive-do-not-expand',profiles:profileVerdicts});
 }
 assert.ok(verdicts.every(v=>v.status==='rejected'),'A surviving configuration requires continued execution, not a local-screen closeout.');
 return {rows,summary,verdicts,advancing:[],laterStages:'H71-H74 not reached under the planned H70 rejection gate. No full-cache/scene/paper claim.',qualification:'C placement validation and extra matched-cost controls are unnecessary for rejection; no C advancement or convergence claim. Rejection does not prove that every layered/adaptive design fails.',sensitivityCorrection:'00454 analysis used a fixed central-reference denominator in its sensitivity bounds. This report recomputes bounds with denominator max(variableReference,floor), preserving nominal errors and every radiance. All rejection decisions remain resolved. Bounds are sensitivity envelopes, not simultaneous statistical coverage.'};
}

/** Scientific ratio/error figures, not three-band display swatches.
 * @param {DialRun} run @param {any} d @returns {Promise<void>}
 */
async function figures(run,d){
 const columns=[['sun',256],['sun',1024],['hybrid',1024],['A',256],['A',1024],['B',256],['B',1024],['C',512],['C',1024]],profiles=['paper','toronto'];
 const heat=`<svg xmlns="http://www.w3.org/2000/svg" width="1390" height="1430"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="23">H70 local J2 / independent reference: paper and Toronto</text><text x="20" y="57">Same geometry and bands;1.00 is the reference mean. C budgets include352 pilot directions; its production has160/672.</text>${profiles.map((profile,p)=>{const top=95+p*650,rr=d.rows.filter(r=>r.profile===profile&&r.method==='sun'&&r.budget===256);return `<text x="20" y="${top}" font-size="20">${profile.toUpperCase()}</text>${columns.map(([m,n],j)=>`<text x="${268+123*j}" y="${top+22}" font-size="13">${m} ${n}</text>`).join('')}${rr.map((r,i)=>`<text x="15" y="${top+63+i*46}">${r.id} / band${r.channel}</text>${columns.map(([m,n],j)=>{const v=d.rows.find(x=>x.profile===profile&&x.id===r.id&&x.channel===r.channel&&x.method===m&&x.budget===n),ratio=v.value/v.mean,e=Math.abs(ratio-1),fill=e<.025?'#d6eadc':e<.05?'#e5edc7':e<.15?'#f0ddb0':e<.5?'#e8bc9f':'#dfa0a0';return `<rect x="${253+123*j}" y="${top+37+i*46}" width="117" height="40" fill="${fill}"/><text x="${270+123*j}" y="${top+63+i*46}">${ratio.toFixed(3)}</text>`;}).join('')}`).join('')}`;}).join('')}<text x="20" y="1403">Reference intervals and every signed error remain in analysis.json. These are three-band numerical ratios, not horizon colors.</text></g></svg>`;
 const chart=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1080"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="23">H70 aggregate local errors: no layered candidate advances</text><text x="20" y="57">Mean / worst absolute relative J2 error (%). Controls and candidates use complete configurations; profiles scored separately.</text>${profiles.map((profile,p)=>{const top=100+p*465;return `<text x="20" y="${top}" font-size="20">${profile.toUpperCase()}</text><text x="420" y="${top}">Mean</text><text x="600" y="${top}">Worst</text><text x="800" y="${top}">Charged evaluations</text>${columns.map(([m,n],j)=>{const s=d.summary.find(x=>x.profile===profile&&x.method===m&&x.budget===n),y=top+35+j*43;return `<text x="35" y="${y}">${m} ${n}</text><rect x="400" y="${y-22}" width="175" height="31" fill="${m==='sun'||m==='hybrid'?'#e7edf8':'#e9e4f2'}"/><text x="420" y="${y}">${(100*s.mean).toFixed(2)}%</text><text x="600" y="${y}">${(100*s.worst).toFixed(2)}%</text><text x="800" y="${y}">${s.evaluations}</text><text x="1030" y="${y}">${s.qualified?'qualified':'grid gate failed'}</text>`;}).join('')}`;}).join('')}<text x="20" y="1052">Evaluations include64/128 path controls; C charges its pilot for each standalone budget. No production/cache RMSE was rerun.</text></g></svg>`;
 await render(run,[{name:'comparison',svg:heat,width:1390,height:1430},{name:'errors',svg:chart,width:1200,height:1080}]);
}

const root=process.argv[2];assert.match(root,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h70-layer-screen$/);
const verified=verify(root),d=decision(verified),run=createRun('h70-final-report',{parents:[verifyRun(root),identity(root+'/analysis.json'),identity('agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/adaptive-incoming-plan.md')],operation:'Read-only264-case replay,3840 paper-reference batch replay, corrected reference-denominator sensitivity envelopes, joint rejection decisions and scientific ratio/error images. No numerical rerun.',parameters:{profiles:['paper','toronto'],advance:0,conditionalStagesNotReached:['H71','H72','H73','H74']}});let failure=null;
try{run.write('verification.json',verified.verification);run.write('analysis.json',d);run.write('summary.tsv',['profile\tmethod\tbudget\tmeanPercent\tworstPercent\tmeanLow\tmeanHigh\tworstLow\tworstHigh\tqualified',...d.summary.map(s=>[s.profile,s.method,s.budget,100*s.mean,100*s.worst,s.meanLow,s.meanHigh,s.worstLow,s.worstHigh,s.qualified].join('\t'))].join('\n'));run.write('decision.json',{verdicts:d.verdicts,advancing:d.advancing,qualification:d.qualification,laterStages:d.laterStages,sensitivityCorrection:d.sensitivityCorrection});await figures(run,d);}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,completed:264,advancing:0});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,verification:verified.verification,storage:storage()}));if(failure)throw failure;
