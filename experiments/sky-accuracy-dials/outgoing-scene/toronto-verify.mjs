import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,verifyRun,identity,readRepository,storage,sha256,resolveRepository} from '../io/files.mjs';
import {originalPhase} from '../distant-horizon/toronto-phase.js';
import {normalized,compiler,mapping} from './mapping.mjs';

/** Verify the complete matched Toronto six-view campaign and immutable report derivations.
 * @returns {void} Accepted verification run, or a preserved failure with an exception.
 */
function main(){
 const roots=process.argv.slice(2);assert.equal(roots.length,8,'Four capture/report pairs required');
 const parents=roots.map(root=>verifyRun(root));
 const materialRoot='tmp/experiments/sky-accuracy-dials/runs/00310-h45-toronto-prod';
 parents.push(verifyRun(materialRoot));
 const material=JSON.parse(readRepository(materialRoot+'/control.json').toString()).material;
 const canonicalRoots={noon:'00401-h62-noon',sunset:'00406-h62-sunset',twilight:'00407-h62-twilight',twilight60:'00415-h62-twilight60'};
 for(let i=0;i<roots.length;i+=2){const control=JSON.parse(readRepository(roots[i]+'/control.json').toString());assert.ok(canonicalRoots[control.scene]);parents.push(identity('tmp/experiments/sky-accuracy-dials/runs/'+canonicalRoots[control.scene]+'/control.json'));}
 const run=createRun('h63-tor-verify',{parents,operation:'Verify matched Toronto Original15/Corrected60/Focused60 scene captures, runtime graph, phase/SSA material, authenticated compiler transforms, real lookup proofs, immutable report inputs, six-view coverage and cleanup. No production or external-reference accuracy claim.',parameters:{roots,materialHash:sha256(JSON.stringify(material))}});
 let failure=null;
 try{
  const scenes=[];
  for(let i=0;i<roots.length;i+=2){
   const root=roots[i],reportRoot=roots[i+1];
   for(const r of [root,reportRoot]){const seal=JSON.parse(readRepository(r+'/sealed.json').toString());assert.equal(seal.state,'accepted');assert.deepEqual(seal.sourceFailures,[]);assert.equal(seal.heartbeatFailure,null);assert.equal(seal.cleanup.absent,true);}
   const control=JSON.parse(readRepository(root+'/control.json').toString());
   const result=JSON.parse(readRepository(root+'/result.json').toString());
   const transform=JSON.parse(readRepository(root+'/transform.json').toString());
   assert.equal(control.profile,'toronto');assert.equal(result.atmosphereProfile,'toronto');assert.equal(result.accepted,true);
   assert.deepEqual(control.material,material);assert.deepEqual(control.mapping,mapping);assert.equal(transform.materialHash,sha256(JSON.stringify(material)));
   const canonicalRoot='tmp/experiments/sky-accuracy-dials/runs/'+canonicalRoots[control.scene];
   assert.ok(canonicalRoots[control.scene]);
   const canonical=JSON.parse(readRepository(canonicalRoot+'/control.json').toString());
   assert.deepEqual(control.observation,canonical.observation);assert.deepEqual(control.baseline,canonical.baseline);assert.deepEqual(control.candidate,canonical.candidate);
   const spec=control.baseline.transportSpec;assert.equal(spec.domains.spectrum.channels.length,15);assert.equal(spec.domains.position.count,48);assert.equal(spec.domains.incoming.directionCount,68);assert.equal(spec.domains.outgoing.directionCount,4374);assert.equal(spec.numerical.maximumScatteringOrder,4);assert.equal(spec.numerical.transportIntervalCount,60);assert.equal(spec.numerical.sourcePathTransmittanceIntervalCount,20);
   assert.deepEqual(control.original.transportSpec,{...spec,numerical:{...spec.numerical,transportIntervalCount:15}});
   assert.equal(result.serverFailures.length,0);assert.deepEqual(result.missingRequests,[{path:'/favicon.ico',status:404}]);
   assert.equal(result.baseline.originalCorrectedFirstOrderWitnesses,true);
   assert.ok(!result.consoleMessages.some(m=>m.type==='pageerror'));
   assert.ok(result.consoleMessages.filter(m=>m.type==='error').every(m=>m.text==='Failed to load resource: the server responded with a status of 404 (Not Found)'));
   const graph=JSON.parse(readRepository(root+'/inputs.json').toString());for(const source of graph.sources)readRepository(source.path,source);
   assert.equal(graph.controlHash,sha256(JSON.stringify(control)));
   const compilerPath='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
   let original=readRepository(compilerPath).toString().replaceAll('\r\n','\n');assert.equal(original.split(originalPhase).length,2);
   const phasePath=resolveRepository('experiments/sky-accuracy-dials/distant-horizon/toronto-phase.js').replaceAll('\\','/');
   original=`import {torontoPhaseGlsl} from '${phasePath}';\n`+original.replace(originalPhase,'${torontoPhaseGlsl(wavelengthNanometers)}');
   for(const [name,source]of [['original',original],['baseline',compiler(normalized(original),1)],['candidate',compiler(normalized(original),.35)]]){
    const bytes=gunzipSync(readRepository(root+'/'+name+'-compiler.js.gz'));assert.equal(bytes.toString(),source);assert.equal(transform[name+'Sha256'],sha256(bytes));
   }
   const captures=JSON.parse(readRepository(root+'/captures.json').toString());const headings=control.scene==='noon'?[0,90,180]:[0];assert.equal(captures.length,headings.length*3);
   for(const heading of headings){const group=captures.filter(c=>c.heading===heading);assert.deepEqual(group.map(c=>c.variant).sort(),['corrected','focused','original']);
    for(const c of group){assert.equal(c.facts.observation.instant,control.observation.instant);assert.deepEqual(c.facts.direction,group[0].facts.direction);assert.deepEqual(c.facts.viewport,{width:1024,height:768});assert.equal(c.facts.horizontalFovDegrees,60);assert.equal(c.facts.pitchDegrees,5);assert.equal(c.facts.gpuMilliseconds.length,12);assert.equal(c.facts.cpuSubmitMilliseconds.length,12);assert.equal(c.facts.timerUnavailable,null);for(const v of [...c.facts.gpuMilliseconds,...c.facts.cpuSubmitMilliseconds])assert.ok(Number.isFinite(v)&&v>=0);identity(root+'/'+c.file);}
   }
   for(const [key,count]of [['original',15],['baseline',30],['candidate',45]]){
    const stage=result[key];assert.equal(stage.buildTimings.length,count);
    for(const p of stage.packetReports.actualLookup.reports){assert.ok(p.maximumRelative<5e-6);assert.ok(Number.isFinite(p.maximumAbsolute));}
    for(const p of stage.packetReports.densitySpectra){assert.equal(p.spectrum.length,15);assert.ok(p.spectrum.every(v=>Number.isFinite(v)&&v>=0));}
   }
   const metrics=JSON.parse(readRepository(reportRoot+'/toronto-'+control.scene+'-metrics.json').toString());assert.equal(metrics.atmosphereProfile,'toronto');assert.equal(metrics.scene,control.scene);assert.equal(metrics.entries.length,headings.length);
   for(const entry of metrics.entries)for(const variant of ['original','corrected','focused'])assert.deepEqual(entry.variants[variant].facts,captures.find(c=>c.heading===entry.heading&&c.variant===variant).facts);
   if(control.scene==='noon'){assert.equal(metrics.identityPublication.maximumCodeDifference,0);assert.ok(metrics.legacyIdentity.maximumCodeDifference<=1,'Toronto H53 corrected identity differs beyond display rounding');}
   const reportSeal=JSON.parse(readRepository(reportRoot+'/sealed.json').toString());assert.ok(reportSeal.recipe.parents.some(p=>p.path===root+'/sealed.json'));assert.ok(reportSeal.recipe.parents.some(p=>p.path==='tmp/experiments/sky-accuracy-dials/runs/00344-h53-scene-tor/sealed.json'));
   scenes.push({scene:control.scene,root,reportRoot,instant:control.observation.instant,views:headings.length,metrics});
  }
  assert.deepEqual(scenes.map(s=>s.scene).sort(),['noon','sunset','twilight','twilight60']);
  const sunset=Date.parse(scenes.find(s=>s.scene==='sunset').instant);assert.equal(Date.parse(scenes.find(s=>s.scene==='twilight').instant)-sunset,1800000);assert.equal(Date.parse(scenes.find(s=>s.scene==='twilight60').instant)-sunset,3600000);
  run.write('verification.json',{accepted:true,scenes,materialHash:sha256(JSON.stringify(material)),storage:storage(),scope:'Toronto measured phase/SSA only, canonical aerosol amount/profile; actual matched GPU scene and lookup evidence, not complete measured Toronto weather, new external validation or production promotion.'});
  console.log(JSON.stringify({run:run.path,scenes:scenes.map(s=>s.scene),storage:storage()}));
 }catch(error){failure=error;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
 verifyRun(run.path);if(failure)throw failure;
}
main();
