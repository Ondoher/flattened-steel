import assert from 'node:assert/strict';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun,identity,readRepository,verifyRun,repositoryRoot,checkedAbsolute} from '../io/files.mjs';
import {browserSources} from '../execution.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';
import {inputs,productionParent,centers} from './attribution-common.mjs';
import {originalPhase} from './toronto-phase.js';
import {makePlan} from './production-plan.mjs';

const compiler='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',entry='experiments/sky-accuracy-dials/distant-horizon/production-browser.js';

/** Dot product of physical vectors. @param {readonly number[]} a @param {readonly number[]} b @returns {number} */
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
/** Unit vector with explicit nonzero length. @param {readonly number[]} a @returns {number[]} */
const unit=a=>a.map(x=>x/Math.hypot(...a));

/** Fixed off-grid view samples and nearby exact cache-node queries.
 * @param {HorizonProductionControl} control @param {HorizonLibParent} physical
 * @returns {{points:AttributionPoint[],nodes:AttributionNode[]}} Canonical frame registration.
 */
function targets(control,physical){
 const job=control.plan.jobs.find(j=>j.elevation===0.05&&j.intervals===30);assert.ok(job);
 const nodes=control.request.transportSpec.domains.position.nodes,solar=control.request.transportSpec.domains.solarZenith.nodes;
 /** @type {AttributionPoint[]} */const points=[];
 /** @type {AttributionNode[]} */const selected=[];
 for(const index of [0,4,9]){
  const s=job.samples[index],distance=job.length*((index/30)**2+((index+1)/30)**2)/2,p=physical.origin.map((v,k)=>v+distance*job.direction[k]),up=unit(p),mu=dot(up,physical.medium.sourceDirection),along=unit(physical.medium.sourceDirection.map((v,k)=>v-mu*up[k])),local=[dot(job.direction,along),0,dot(job.direction,up)];
  const theta=(s.zenith+.5)*Math.PI/180,canonicalUp=[Math.sin(theta),0,Math.cos(theta)],canonicalAlong=[-Math.cos(theta),0,Math.sin(theta)],direction=canonicalUp.map((v,k)=>v*local[2]+canonicalAlong[k]*local[0]),point=canonicalUp.map(v=>v*(physical.medium.radius+s.height));
  points.push({id:`view-${index}`,kind:'off-grid',point,direction,altitude:s.height});
  const position=s.altitudeIndices[0],zenith=Math.max(0,Math.min(179,Math.floor(s.zenith))),row=zenith*nodes.length+position;
  if(selected.some(n=>n.row===row))continue;
  const a=solar[zenith].solarZenithDegrees*Math.PI/180,pointAt=[(physical.medium.radius+nodes[position].altitudeMeters)*Math.sin(a),0,(physical.medium.radius+nodes[position].altitudeMeters)*Math.cos(a)];
  const incoming=control.request.transportSpec.domains.incoming.unitVectors;
  let tangentIndex=0;for(let j=1;j<incoming.length;j++)if(Math.abs(incoming[j][2])<Math.abs(incoming[tangentIndex][2]))tangentIndex=j;
  selected.push({row,position,zenith,point:pointAt,altitude:nodes[position].altitudeMeters,tangentIndex});
  const first=s.taps[0][1][0],outgoingIndex=control.plan.coordinates[first].x,localOut=control.request.transportSpec.domains.outgoing.unitVectors[outgoingIndex],u=unit(pointAt),alongNode=[-Math.cos(a),0,Math.sin(a)],nodeDirection=u.map((v,k)=>v*localOut[2]+alongNode[k]*localOut[0]+(k===1?-localOut[1]:0));
  points.push({id:`node-${row}`,kind:'node',point:pointAt,direction:nodeDirection,altitude:nodes[position].altitudeMeters,row,outgoingIndex});
 }
 return {points,nodes:selected};
}

/** Run one unchanged or controlled recurrence with complete physical domains.
 * @returns {Promise<void>} Matched spectra, field probes and optional live-field diagnostics.
 */
async function main(){
 const mode=process.argv[2];assert.ok(['instrument','transport30','transport60','normalized','normalize2','normalized60','normalized120','normalized60full','normalized60source80','altitude'].includes(mode));assert.equal(process.argv.length,3);
 const {parents,control:original,physical}=inputs();parents.push(...browserSources([entry]),identity(productionParent+'/channels.json.gz'));
 const originalData=JSON.parse(gunzipSync(readRepository(productionParent+'/channels.json.gz')).toString());
 const mutable=JSON.parse(JSON.stringify(original));mutable.channels=mode==='normalized60full'?centers.map((_,i)=>i):[2,3,5,8];
 if(mode==='transport30')mutable.request.transportSpec.numerical.transportIntervalCount=30;
 if(['transport60','normalized60','normalized60full','normalized60source80'].includes(mode))mutable.request.transportSpec.numerical.transportIntervalCount=60;
 if(mode==='normalized120')mutable.request.transportSpec.numerical.transportIntervalCount=120;
 if(mode==='normalized60source80')mutable.request.transportSpec.numerical.sourcePathTransmittanceIntervalCount=80;
 if(mode==='altitude'){
  const positions=mutable.request.transportSpec.domains.position;const hs=[...positions.nodes.map(n=>n.altitudeMeters),125,250,500,750,1000,1500].sort((a,b)=>a-b);positions.nodes=hs.map((altitudeMeters,index)=>({index,altitudeMeters}));positions.count=hs.length;positions.id+='-lower-refined';mutable.plan=makePlan(mutable.request,physical.medium);
 }
 const control=/** @type {AttributionControl} */(mutable);if(mode==='instrument')control.diagnostic=targets(control,physical);
 let source=readRepository(compiler).toString().replaceAll('\r\n','\n');assert.equal(source.split(originalPhase).length,2);
 source=`import {torontoPhaseGlsl} from '${path.resolve(repositoryRoot,'experiments/sky-accuracy-dials/distant-horizon/toronto-phase.js').split(path.sep).join('/')}';\n`+source.replace(originalPhase,'${torontoPhaseGlsl(wavelengthNanometers)}');
 if(mode==='instrument'){
  source=`import {inspect} from '${path.resolve(repositoryRoot,'experiments/sky-accuracy-dials/distant-horizon/attribution-inspect.js').split(path.sep).join('/')}';\n`+source;
  const needle='if (onFieldProbes === null) return;';assert.equal(source.split(needle).length,2);source=source.replace(needle,"await inspect({gl,fieldId,resource,common,transport:transportFragment(common,sourceAligned),f68:f68Texture});\n\t\t"+needle);
 }
 if(mode.startsWith('normal')){
  const begin=source.indexOf('function scatterFragment('),end=source.indexOf('function transportFragment(',begin);let part=source.slice(begin,end);
  const needle="'sum += incomingRadiance * scattering * incomingRecord.w;'";assert.equal(part.split(needle).length,2);
  part=part.replace(needle,"'sum += incomingRadiance * scattering * incomingRecord.w; mieSum += incomingRadiance * medium.mieScattering * miePhase(outgoing,incoming) * incomingRecord.w; mieMass += miePhase(outgoing,incoming) * incomingRecord.w;'");
  part=part.replace('uniform sampler2D uPreviousL;','uniform sampler2D uPreviousL;\nuniform int uAttributionOrder;');
  part=part.replace('float sum = 0.0;','float sum = 0.0; float mieSum=0.0; float mieMass=0.0;');
  part=part.replace('outputValue = sum;',`outputValue = ${mode==='normalize2'?'uAttributionOrder==2 ? ':''}sum - mieSum + mieSum/max(mieMass,1e-12)${mode==='normalize2'?' : sum':''};`);
  source=source.slice(0,begin)+part+source.slice(end);
  for(const order of [2,3,4]){
   const needle=`uniforms: sourceAligned\n\t\t\t\t? [(program) => gl.uniform1i(gl.getUniformLocation(program, 'uScatteringOrder'), ${order})]\n\t\t\t\t: [],`;
   assert.equal(source.split(needle).length,2);source=source.replace(needle,`uniforms: [(program) => {gl.uniform1i(gl.getUniformLocation(program,'uAttributionOrder'),${order});if(sourceAligned)gl.uniform1i(gl.getUniformLocation(program,'uScatteringOrder'),${order});}],`);
  }
 }
 let browserSource=readRepository(entry).toString().replaceAll('\r\n','\n');
 browserSource=browserSource.replace('if (control.material) setTorontoMaterial(control.material);',"if (control.material) setTorontoMaterial(control.material);globalThis['__h49Control']=control;globalThis['__h49Telemetry']=[];");
 browserSource=browserSource.replace('for (const channel of control.channels) {',"for (const channel of control.channels) {globalThis['__h49Channel']=channel;");
 browserSource=browserSource.replace("fieldProbeCoordinates: Object.fromEntries(['J1', 'J2', 'J3', 'J4'].map(id => [id, control.plan.coordinates])),","fieldProbeCoordinates: Object.fromEntries(['J1','J2','J3','J4','L1','L2','L3'].map(id => [id,id.startsWith('J')?control.plan.coordinates:(control.diagnostic?.nodes??[]).flatMap(n=>Array.from({length:control.request.transportSpec.domains.incoming.directionCount},(_,x)=>({x,y:n.row})))])),");
 browserSource=browserSource.replace("const pure = [], cumulative",'const observedFields = []; const pure = [], cumulative');
 browserSource=browserSource.replace("if (fieldId.startsWith('L')) return;","if (fieldId.startsWith('L')) {observedFields.push({fieldId,values});return;}");
 browserSource=browserSource.replace('reports.push({channel, report, pure, spectra});',"reports.push({channel, report, pure, spectra,observedFields,diagnostics:globalThis['__h49Telemetry'].filter(d=>d.channel===channel)});");
 browserSource=browserSource.replaceAll('180 * 48 * 2','180 * control.request.transportSpec.domains.position.count * 2').replace('180, 48);','180, control.request.transportSpec.domains.position.count);').replace('180, 48, gl.RG_INTEGER','180, control.request.transportSpec.domains.position.count, gl.RG_INTEGER');
 const names={instrument:'h49-instrument',transport30:'h50-q30',transport60:'h50-q60',normalized:'h51-normalized',normalize2:'h51-normalize2',normalized60:'h51-norm-q60',normalized120:'h51-norm-q120',normalized60full:'h51-norm-full',normalized60source80:'h51-norm-s80',altitude:'h51-altitude'};
 const run=createRun(names[mode],{parents,operation:'Contained production recurrence replay; explicit single-variable controls and/or live-field diagnostics. Original compiler and deployment remain read-only.',parameters:{mode,channels:control.channels,transportIntervals:control.request.transportSpec.numerical.transportIntervalCount,scope:'Complete existing angular/solar/position domains; optional lower-position refinement. Aerosol phase-mass normalization is a diagnostic intervention, not an accepted physical correction.'}});
 let browser,failure=null;
 try{
  run.write('control.json',control);run.write('compiler-adapted.js.gz',gzipSync(Buffer.from(source)));run.write('entry-adapted.js.gz',gzipSync(Buffer.from(browserSource)));
  const bundle=await rollup({input:checkedAbsolute(path.join(repositoryRoot,entry)),plugins:[{name:'contained-attribution',transform(code,id){if(path.resolve(id)===path.resolve(repositoryRoot,compiler))return {code:source,map:null};if(path.resolve(id)===path.resolve(repositoryRoot,entry))return {code:browserSource,map:null};return null;}}]});let code;try{code=(await bundle.generate({format:'iife'})).output[0].code;}finally{await bundle.close();}run.write('browser.js.gz',gzipSync(Buffer.from(code)));
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});const page=await browser.newPage();
  await page.exposeFunction('__h43Progress',message=>{run.progress('gpu',String(message));if(String(message).includes('complete:'))console.log(JSON.stringify({progress:message}));});await page.addScriptTag({content:code});const result=await page.evaluate(c=>window.__h43Evaluate(c),control);
  const data=/** @type {(HorizonProductionChannel&{diagnostics:AttributionFieldDiagnostic[],observedFields:{fieldId:string,values:{x:number,y:number,value:number}[]}[]})[]} */(result.reports);
  let baselineMaximum=0,n1Maximum=0;
  for(const c of data){const old=originalData.find(x=>x.channel===c.channel);assert.ok(old);if(mode==='instrument'){for(let o=0;o<4;o++)for(let j=0;j<c.spectra[o].length;j++)baselineMaximum=Math.max(baselineMaximum,Math.abs(c.spectra[o][j]/old.spectra[o][j]-1));}if(mode!=='altitude')for(let j=0;j<c.spectra[0].length;j++)n1Maximum=Math.max(n1Maximum,Math.abs(c.spectra[0][j]/old.spectra[0][j]-1));}
  if(mode==='instrument')assert.ok(baselineMaximum<1e-6);if(mode.startsWith('normal')&&mode!=='normalized60source80')assert.ok(n1Maximum<1e-6);
  run.write('channels.json.gz',gzipSync(Buffer.from(JSON.stringify(data))));run.write('spectra.json',data.map(c=>({channel:c.channel,wavelength:centers[c.channel],cumulative:c.spectra.map(s=>s[0])})));run.write('proof.json',{renderer:result.renderer,baselineMaximum,n1Maximum,completePositionDomain:true,mode,originalCompiler:identity(compiler)});
  console.log(JSON.stringify({mode,baselineMaximum,n1Maximum,diagnosticFields:data.reduce((s,c)=>s+c.diagnostics.length,0),spectra:data.map(c=>({channel:c.channel,cumulative:c.spectra.map(s=>s[0])}))}));
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}
await main();
