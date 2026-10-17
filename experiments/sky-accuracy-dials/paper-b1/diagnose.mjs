import assert from 'node:assert/strict';
import {createRun,identity,readRepository,verifyRun} from '../io/files.mjs';
import {scoreBoundary} from '../analysis/metrics.mjs';
import {parseBoundaryTsv} from '../analysis/boundary.mjs';
import {renderScientificSvg} from '../analysis/reports.mjs';
import {benchmarkRay} from '../numerics/view.js';
import {dot,unit} from '../numerics/math.js';
import {render} from '../distant-horizon/attribution-common.mjs';
import {basePath,jointPath,loadCase,caseBoundary,measurements} from './diagnosis-data.mjs';

/** Floating-point bookkeeping identity with a scale-aware tolerance.
 * @param {number} a @param {number} b @returns {void}
 */
function near(a,b){assert.ok(Math.abs(a-b)<=2e-10*Math.max(1,Math.abs(a),Math.abs(b)),`Identity failed: ${a} versus ${b}`);}

/** Independently evaluate the paper Cornette-Shanks phase equation.
 * @param {number} cosine @param {number} g @returns {number} Phase in sr^-1.
 */
function phase(cosine,g){return 3/(8*Math.PI)*(1-g*g)/(2+g*g)*(1+cosine*cosine)/Math.pow(1+g*g-2*g*cosine,1.5);}

/** Uniform-field energy and directional-shape moment checks. The high-resolution
 * reference integrates the analytic equation directly, independently of F68.
 * @param {B1DiagnosticCase} base @returns {B1PhaseDiagnostic}
 */
function phaseDiagnostic(base){
 const spec=base.control.buildRequest.transportSpec,g=spec.atmosphere.miePhaseFunctionG;
 /** @param {number} n @returns {number[]} */
 function moments(n){const m=[0,0,0];for(let i=0;i<=n;i++){const c=-1+2*i/n,w=(i===0||i===n?1:i%2?4:2)*2/n/3*2*Math.PI,p=phase(c,g);m[0]+=w*p;m[1]+=w*p*c;m[2]+=w*p*c*c;}return m;}
 const reference=moments(32768),coarse=moments(16384);reference.forEach((v,i)=>near(v,coarse[i]));near(reference[0],1);
 const incoming=spec.domains.incoming,records=spec.domains.outgoing.unitVectors.map((outgoing,index)=>{const m=[0,0,0];incoming.unitVectors.forEach((v,i)=>{const c=dot(outgoing,v),p=phase(Math.max(-1,Math.min(1,c)),g),w=incoming.integrationWeightsSteradians[i];m[0]+=p*w;m[1]+=p*w*c;m[2]+=p*w*c*c;});return {index,mass:m[0],firstMoment:m[1],normalizedFirstMoment:m[1]/m[0],secondMoment:m[2],normalizedSecondMoment:m[2]/m[0]};});
 return {g,reference,coarse,referenceCount:32768,records,massMinimum:Math.min(...records.map(r=>r.mass)),massMaximum:Math.max(...records.map(r=>r.mass)),firstMomentRmse:Math.sqrt(records.reduce((s,r)=>s+(r.firstMoment-reference[1])**2,0)/records.length),normalizedFirstMomentRmse:Math.sqrt(records.reduce((s,r)=>s+(r.normalizedFirstMoment-reference[1])**2,0)/records.length),scope:'Moment diagnostics for analytic paper phase, not a complete scattering oracle. Normalizing mass does not refine angular resolution.'};
}

/** Common signed heatmap of time/wavelength score change.
 * @param {readonly number[][]} values @param {readonly string[]} times @param {readonly number[]} centers
 * @param {string} title @param {number} [commonLimit] @returns {string} Standalone exact-cell SVG.
 */
function heatmap(values,times,centers,title,commonLimit){
 const limit=commonLimit??Math.max(1e-20,...values.flat().map(Math.abs)),out=[`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="650"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#202124"><text x="20" y="30" font-size="22">${title}</text><text x="20" y="55" font-size="14">Sum of spectral squared-error change over 81 rays; blue improves, red worsens. No display color model.</text>`];
 values.forEach((row,t)=>{out.push(`<text x="20" y="${100+t*27}" font-size="13">${times[t]}</text>`);row.forEach((v,c)=>{const a=Math.min(1,Math.abs(v)/limit),color=v>=0?`rgb(255,${Math.round(255-165*a)},${Math.round(255-190*a)})`:`rgb(${Math.round(255-200*a)},${Math.round(255-115*a)},255)`;out.push(`<rect x="${90+c*31}" y="${82+t*27}" width="30" height="26" fill="${color}"><title>${times[t]} ${centers[c]}nm: ${v} W^2</title></rect>`);});});
 for(let c=0;c<centers.length;c+=3)out.push(`<text x="${90+c*31}" y="565" font-size="12">${centers[c]}</text>`);
 out.push(`<text x="90" y="590" font-size="14">Wavelength (nm). Color extremes: +/- ${(limit*1e6).toPrecision(5)} (mW m^-2 sr^-1 nm^-1)^2.</text><text x="90" y="618" font-size="13">Spatial cells are summed, not averaged. This is a score ledger, not a sky image or a causal decomposition.</text></g></svg>`);return out.join('');
}

/** Analyze the saved joint result first, then all four factorial corners once
 * the two missing numerical cases exist. Every figure derives from new immutable
 * output; original inputs are authenticated and never modified.
 * @returns {Promise<void>}
 */
async function main(){
 const started=performance.now(),base=loadCase(basePath),joint=loadCase(jointPath),extra=process.argv.slice(2);
 assert.ok(extra.length===0||extra.length===2,'Supply transport60 and normalized40 run paths, or neither.');
 const cases=extra.length?[base,loadCase(extra[0]),loadCase(extra[1]),joint]:[base,joint],labels=extra.length?['Baseline40','Transport60','Normalized40','Normalized60']:['Baseline40','Normalized60'];
 const measured=measurements(),boundaries=cases.map(c=>caseBoundary(c)),scores=boundaries.map(b=>scoreBoundary(b,measured));
 const publishedPath='references/results/experiments/b1-directional-sky-radiance/published-models.tsv';
 const published=identity(publishedPath),publishedSidecar=identity('references/results/experiments/b1-directional-sky-radiance/published-models.sha256');
 const publishedHash='4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4';
 assert.equal(published.sha256,publishedHash);assert.ok(readRepository(publishedSidecar.path,publishedSidecar).toString().startsWith(publishedHash));
 const publishedText=readRepository(published.path,published).toString();
 const references=['libradtran','bruneton'].map(model=>{const boundary=parseBoundaryTsv(publishedText,{modelId:model,configId:'retained-'+model,sourceIdentity:published}),score=scoreBoundary(boundary,measured);near(score.aggregateRmseMilliwatt,model==='libradtran'?11.48054693568567:11.283238587982387);return {model,boundary,score};});
 const spec=base.control.buildRequest.transportSpec,centers=spec.domains.spectrum.channels.map(c=>c.centerNanometers),rays=base.control.scenes.flatMap((scene,t)=>Array.from({length:81},(_,r)=>{const geometry=benchmarkRay(spec,scene,r%9,Math.floor(r/9));return {time:scene.time,t,ray:r,x:r%9,y:Math.floor(r/9),elevation:Math.asin(Math.max(-1,Math.min(1,dot(unit(geometry.origin),geometry.direction))))*180/Math.PI,separation:Math.acos(Math.max(-1,Math.min(1,geometry.direction[2])))*180/Math.PI};}));
 const run=createRun(extra.length?'h56-factorial':'h56-joint-map',{parents:[...cases.map(c=>c.seal),measured.sourceIdentity,published,publishedSidecar,identity('experiments/sky-accuracy-dials/paper-b1/diagnose.mjs')],operation:'Exact spectral residual/SSE accounting by time, wavelength, geometry and cumulative order; factorial separation of transport and Mie normalization when all four corners are supplied; distinguish agreement with retained published models from the measured paper target.',parameters:{labels,scoreChannels:[0,30],computedChannels:[0,39],partitionElevations:[20,45],partitionSunAngles:[15,45,90],orders:'Bookkeeping increments Cn-C(n-1), distinct from separately integrated physical-order spectra.',baselineGit:'759b6a97'}});
 let failure=null;
 try{
  const analysis=boundaries.slice(1).map((b,k)=>{
   const cells=[],spectral=Array.from({length:31},()=>({count:0,baselineBias:0,candidateBias:0,change:0,deltaSSE:0,cross:0,square:0})),heat=Array.from({length:17},()=>Array(31).fill(0));
   for(const ray of rays){let baselineSSE=0,candidateSSE=0,cross=0,square=0,meanResidual=0,meanChange=0,darkeningDeficit=0;
    for(let c=0;c<31;c++){const i=(ray.t*81+ray.ray)*40+c,r=boundaries[0].values[i]-measured.values[i],d=b.values[i]-boundaries[0].values[i],after=r+d,delta=2*r*d+d*d;baselineSSE+=r*r;candidateSSE+=after*after;cross+=2*r*d;square+=d*d;meanResidual+=r/31;meanChange+=d/31;if(r<0&&d<0)darkeningDeficit+=delta;
     const s=spectral[c];s.count++;s.baselineBias+=r;s.candidateBias+=after;s.change+=d;s.deltaSSE+=delta;s.cross+=2*r*d;s.square+=d*d;heat[ray.t][c]+=delta;
    }
    cells.push({...ray,baselineSSE,candidateSSE,deltaSSE:candidateSSE-baselineSSE,cross,square,meanResidual,meanChange,darkeningDeficit});
   }
   const total=cells.reduce((s,c)=>s+c.deltaSSE,0),cross=cells.reduce((s,c)=>s+c.cross,0),square=cells.reduce((s,c)=>s+c.square,0);near(total,scores[k+1].squaredError-scores[0].squaredError);near(total,cross+square);
   const group=/** @param {(r:typeof cells[number])=>string} key */(key)=>[...new Set(cells.map(key))].map(name=>{const a=cells.filter(r=>key(r)===name);return {name,rayCount:a.length,sampleCount:a.length*31,baselineSSE:a.reduce((s,r)=>s+r.baselineSSE,0),candidateSSE:a.reduce((s,r)=>s+r.candidateSSE,0),deltaSSE:a.reduce((s,r)=>s+r.deltaSSE,0),meanResidual:a.reduce((s,r)=>s+r.meanResidual,0)/a.length,meanChange:a.reduce((s,r)=>s+r.meanChange,0)/a.length};});
   const elevation=group(r=>r.elevation<20?'12.1deg':r.elevation<45?'33.7deg':'53.4deg-and-above'),sunAngle=group(r=>r.separation<15?'0-15deg':r.separation<45?'15-45deg':r.separation<90?'45-90deg':'90-180deg');near(elevation.reduce((s,g)=>s+g.deltaSSE,0),total);near(sunAngle.reduce((s,g)=>s+g.deltaSSE,0),total);
   // The telescoping increments exactly recover the actually reconstructed
   // cumulative result. Nonlinear cubic means these are not pure physical orders.
   const orderBounds=Array.from({length:4},(_,n)=>caseBoundary(cases[k+1],n)),baseOrders=Array.from({length:4},(_,n)=>caseBoundary(base,n));
   const orders=Array.from({length:4},(_,n)=>{let allocated=0,responseSquared=0,mean=0;for(let t=0;t<17;t++)for(let r=0;r<81;r++)for(let c=0;c<31;c++){const i=(t*81+r)*40+c,totalD=b.values[i]-boundaries[0].values[i],residual=boundaries[0].values[i]-measured.values[i],d=(orderBounds[n].values[i]-(n?orderBounds[n-1].values[i]:0))-(baseOrders[n].values[i]-(n?baseOrders[n-1].values[i]:0));allocated+=2*residual*d+d*totalD;responseSquared+=d*d;mean+=d;}return {order:n+1,allocatedDeltaSSE:allocated,rmsChange:Math.sqrt(responseSquared/42687),meanChange:mean/42687};});near(orders.reduce((s,o)=>s+o.allocatedDeltaSSE,0),total);near(orders[0].rmsChange,0);
   const pureOrders=Array.from({length:5},(_,n)=>({component:n<4?'Separate pure order '+(n+1):'Cumulative reconstruction remainder',allocatedDeltaSSE:0,responseSquared:0,meanChange:0}));
   for(let t=0;t<17;t++)for(let ray=0;ray<81;ray++)for(let c=0;c<31;c++){
    const i=(t*81+ray)*40+c,j=t*81+(ray%9)*9+Math.floor(ray/9),totalD=b.values[i]-boundaries[0].values[i],residual=boundaries[0].values[i]-measured.values[i],old=base.channels[c].metadata.compilerReport.pureRaySpectra,current=cases[k+1].channels[c].metadata.compilerReport.pureRaySpectra,d=old.map((s,n)=>current[n][j]-s[j]);
    d.push(totalD-d.reduce((a,v)=>a+v,0));
    d.forEach((v,n)=>{pureOrders[n].allocatedDeltaSSE+=2*residual*v+v*totalD;pureOrders[n].responseSquared+=v*v;pureOrders[n].meanChange+=v/42687;});
   }
   const pureOrderLedger=pureOrders.map(o=>({...o,rmsChange:Math.sqrt(o.responseSquared/42687)}));near(pureOrderLedger.reduce((s,o)=>s+o.allocatedDeltaSSE,0),total);near(pureOrderLedger[0].rmsChange,0);
   const result={label:labels[k+1],totalDeltaSSE:total,cross,square,positive:cells.filter(c=>c.deltaSSE>0).reduce((s,c)=>s+c.deltaSSE,0),negative:cells.filter(c=>c.deltaSSE<0).reduce((s,c)=>s+c.deltaSSE,0),darkeningDeficit:cells.reduce((s,c)=>s+c.darkeningDeficit,0),spectral,elevation,sunAngle,orders,pureOrderLedger,worst:[...cells].sort((a,b)=>b.deltaSSE-a.deltaSSE).slice(0,12),best:[...cells].sort((a,b)=>a.deltaSSE-b.deltaSSE).slice(0,12)};
   run.write('cells-'+labels[k+1]+'.json',cells);run.write('attribution-'+labels[k+1]+'.json',result);return {result,heat};
  });
  let factorial=null;
  if(extra.length){let norm=0,interactionMean=0;for(let t=0;t<17;t++)for(let r=0;r<81;r++)for(let c=0;c<31;c++){const i=(t*81+r)*40+c,d=boundaries[3].values[i]-boundaries[1].values[i]-boundaries[2].values[i]+boundaries[0].values[i];norm+=d*d;interactionMean+=d;}factorial={spectralInteractionNorm:Math.sqrt(norm),spectralInteractionRms:Math.sqrt(norm/42687),spectralInteractionMean:interactionMean/42687,scoreInteraction:scores[3].squaredError-scores[1].squaredError-scores[2].squaredError+scores[0].squaredError,scope:'Score interaction includes the quadratic cross term even for additive spectra.'};run.write('factorial.json',factorial);}
  const phaseCheck=phaseDiagnostic(base);run.write('phase-moments.json',phaseCheck);
  const retainedReferences=references.map(ref=>{const agreement=boundaries.map(b=>scoreBoundary(b,ref.boundary));return {model:ref.model,rmseToMeasurement:ref.score.aggregateRmseMilliwatt,scope:'Agreement with authenticated retained published-code outputs, not a newly matched/convergence-qualified mathematical reference.',cases:boundaries.map((b,k)=>{let approximationCross=0,referenceMeasurementCross=0,square=0;for(let t=0;t<17;t++)for(let r=0;r<81;r++)for(let c=0;c<31;c++){const i=(t*81+r)*40+c,d=b.values[i]-boundaries[0].values[i];approximationCross+=2*(boundaries[0].values[i]-ref.boundary.values[i])*d;referenceMeasurementCross+=2*(ref.boundary.values[i]-measured.values[i])*d;square+=d*d;}near(approximationCross+square,agreement[k].squaredError-agreement[0].squaredError);near(approximationCross+referenceMeasurementCross+square,scores[k].squaredError-scores[0].squaredError);return {label:labels[k],agreementRmse:agreement[k].aggregateRmseMilliwatt,approximationCross,referenceMeasurementCross,square,deltaSSEToReference:approximationCross+square,deltaSSEToMeasurement:approximationCross+referenceMeasurementCross+square};})};});
  run.write('retained-reference.json',retainedReferences);
  const summary={labels,scores:labels.map((label,i)=>({label,rmse:scores[i].aggregateRmseMilliwatt,delta:scores[i].aggregateRmseMilliwatt-scores[0].aggregateRmseMilliwatt})),minimumElevation:Math.min(...rays.map(r=>r.elevation)),maximumElevation:Math.max(...rays.map(r=>r.elevation)),analysis:analysis.map(a=>a.result),factorial,retainedReferences,phase:{reference:phaseCheck.reference,massMinimum:phaseCheck.massMinimum,massMaximum:phaseCheck.massMaximum,firstMomentRmse:phaseCheck.firstMomentRmse,normalizedFirstMomentRmse:phaseCheck.normalizedFirstMomentRmse}};
  run.write('summary.json',summary);run.write('scores.tsv','case\tRMSE_mW\tdelta_mW\n'+summary.scores.map(r=>[r.label,r.rmse,r.delta].join('\t')).join('\n')+'\n');
  run.write('interval-factorial.tsv','time\t'+labels.join('\t')+'\n'+measured.times.map((time,t)=>[time,...scores.map(s=>s.conditions[t].rmseMilliwatt)].join('\t')).join('\n')+'\n');
  const selected=analysis.at(-1).result.worst[0],selectedIndex=selected.t*81+selected.ray;
  const spectralPlot=renderScientificSvg({title:`Largest joint score regression: ${selected.time}, ray (${selected.x},${selected.y})`,description:`Elevation ${selected.elevation.toFixed(2)} deg; Sun separation ${selected.separation.toFixed(2)} deg. Fixed paper atmosphere; descriptive selection.`,xLabel:'Wavelength (nm)',yLabel:'Spectral radiance (W m^-2 sr^-1 nm^-1)',series:[{label:'Measurement',x:centers,y:Array.from(measured.values.slice(selectedIndex*40,(selectedIndex+1)*40))},...boundaries.map((b,i)=>({label:labels[i],x:centers,y:Array.from(b.values.slice(selectedIndex*40,(selectedIndex+1)*40))}))],provenance:{parents:cases.map(c=>c.seal),selection:selected}});
  const commonLimit=Math.max(1e-20,...analysis.flatMap(a=>a.heat.flat()).map(Math.abs));
  await render(run,[...analysis.map(a=>({name:'score-map-'+a.result.label,svg:heatmap(a.heat,measured.times,centers.slice(0,31),a.result.label+': where the B1 score changes',commonLimit),width:1120,height:650})),{name:'selected-spectrum',svg:spectralPlot,width:1280,height:730}]);
  run.write('verification.json',{scoreIdentities:true,geometryPartitions:true,orderBookkeepingIdentity:true,j1ResponseZero:true,analyticPhaseMass:phaseCheck.reference[0],phaseRefinementDifference:phaseCheck.reference.map((v,i)=>v-phaseCheck.coarse[i]),scope:'Causal comparison of two controlled numerical interventions; mathematical phase moments and observational RMSE are separate.'});
  console.log(JSON.stringify({run:run.path,scores:summary.scores,minimumElevation:summary.minimumElevation,factorial}));
 }catch(e){failure={message:String(e),stack:e.stack};}
 run.cleanup();const seal=run.finish(failure?'failed':'accepted',{failure,elapsedMilliseconds:performance.now()-started});verifyRun(run.path);assert.equal(JSON.parse(readRepository(seal.path).toString()).state,'accepted',JSON.stringify(failure));
}

await main();
