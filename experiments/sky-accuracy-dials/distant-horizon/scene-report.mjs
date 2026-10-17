import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {createRun, identity, readRepository, verifyRun} from '../io/files.mjs';

/** Decode the display's sRGB transfer, without recovering atmospheric radiance.
 * @param {number} byte @returns {number} Display-linear component relative to white.
 */
function linear(byte) {
 const v=byte/255;
 return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
}

/** Quantify a sky elevation band in the unobstructed right-hand scene strip.
 * @param {ReturnType<typeof PNG.sync.read>} before
 * @param {ReturnType<typeof PNG.sync.read>} after
 * @param {number} low @param {number} high
 * @param {{pitchDegrees:number,verticalFovDegrees:number}} camera
 * @returns {{elevation:number[],count:number,beforeRgb:number[],afterRgb:number[],beforeDisplayY:number,afterDisplayY:number,relativeDisplayY:number}}
 */
function band(before,after,low,high,camera) {
 const pitch=camera.pitchDegrees*Math.PI/180,tangent=Math.tan(camera.verticalFovDegrees*Math.PI/360);
 const rgb0=[0,0,0],rgb1=[0,0,0],weights=[0.2126,0.7152,0.0722];
 let count=0,y0=0,y1=0;
 for(let y=0;y<before.height;y++)for(let x=880;x<1000;x++){
  const u=(2*(x+0.5)/before.width-1)*tangent*before.width/before.height;
  const v=(1-2*(y+0.5)/before.height)*tangent;
  const elevation=Math.asin((Math.sin(pitch)+v*Math.cos(pitch))/Math.sqrt(1+u*u+v*v))*180/Math.PI;
  if(elevation<low||elevation>=high)continue;
  const i=(y*before.width+x)*4;count++;
  for(let c=0;c<3;c++){
   rgb0[c]+=before.data[i+c];rgb1[c]+=after.data[i+c];
   y0+=weights[c]*linear(before.data[i+c]);y1+=weights[c]*linear(after.data[i+c]);
  }
 }
 assert.ok(count>0&&y0>0);
 return {elevation:[low,high],count,beforeRgb:rgb0.map(v=>v/count),afterRgb:rgb1.map(v=>v/count),beforeDisplayY:y0/count,afterDisplayY:y1/count,relativeDisplayY:y1/y0-1};
}

/** Compare complete decoded image components, including alpha.
 * @param {ReturnType<typeof PNG.sync.read>} a @param {ReturnType<typeof PNG.sync.read>} b
 * @returns {{maximumByteDifference:number,meanByteDifference:number,changedComponents:number}}
 */
function difference(a,b){
 assert.equal(a.width,b.width);assert.equal(a.height,b.height);
 let maximum=0,sum=0,changed=0;
 for(let i=0;i<a.data.length;i++){const d=Math.abs(a.data[i]-b.data[i]);maximum=Math.max(maximum,d);sum+=d;if(d)changed++;}
 return {maximumByteDifference:maximum,meanByteDifference:sum/a.data.length,changedComponents:changed};
}

/** Authenticate two sealed pairs, retain display measurements, and stack their unchanged comparison pixels.
 * @returns {void} Accepted immutable report or preserved failure; no new GPU/scattering work.
 */
function main(){
 assert.equal(process.argv.length,4,'Pass canonical and Toronto scene runs.');
 const paths=process.argv.slice(2),parents=paths.map(verifyRun);
 for(const parent of parents){
  const seal=JSON.parse(readRepository(parent.path,parent).toString());
  assert.equal(seal.state,'accepted');assert.equal(seal.heartbeatFailure,null);assert.equal(seal.cleanup.absent,true);
 }
 parents.push(identity('node_modules/pngjs/package.json'),identity('package-lock.json'));
 const data=paths.map((root,i)=>{
  /** Read and identify each exact parent artifact. @param {string} name @returns {Buffer} */
  const read=name=>{const bytes=readRepository(root+'/'+name);parents.push(identity(root+'/'+name,bytes));return bytes;};
  const result=JSON.parse(read('result.json').toString()),baseline=JSON.parse(read('baseline.json').toString()),candidate=JSON.parse(read('candidate.json').toString());
  const inputs=JSON.parse(read('inputs.json').toString());
  const deployed=PNG.sync.read(read('deployed-noon.png')),before=PNG.sync.read(read('baseline-noon.png')),after=PNG.sync.read(read('candidate-noon.png')),panel=PNG.sync.read(read('comparison.png'));
  assert.equal(result.profile,i?'toronto':'canonical');assert.equal(result.accepted,true);
  assert.equal(before.width,1024);assert.equal(before.height,768);
  assert.deepEqual(baseline.camera,candidate.camera);assert.deepEqual(baseline.observation,candidate.observation);
  assert.equal(candidate.unchangedFirstOrder,true);assert.equal(inputs.control.baseline.transportSpec.numerical.transportIntervalCount,15);assert.equal(inputs.control.candidate.transportSpec.numerical.transportIntervalCount,60);
  const {id:baseId,transportSpec:baseSpec,...baseRest}=inputs.control.baseline;
  const {id:candidateId,transportSpec:candidateSpec,...candidateRest}=inputs.control.candidate;
  assert.deepEqual(baseRest,candidateRest);
  assert.deepEqual({...baseSpec,numerical:{...baseSpec.numerical,transportIntervalCount:60}},candidateSpec);
  const parity=difference(deployed,before);
  if(i===0){assert.equal(baseline.parity.maximumRelative,0);assert.equal(parity.maximumByteDifference,0);}
  return {panel,summary:{run:root,profile:result.profile,camera:baseline.camera,observation:baseline.observation,solarZenithDegrees:baseline.solarZenithDegrees,renderer:baseline.renderer,baselineMilliseconds:baseline.elapsedMilliseconds,candidatePhaseMilliseconds:candidate.elapsedMilliseconds-baseline.elapsedMilliseconds,totalMilliseconds:result.elapsedMilliseconds,deployedComparison:parity,unchangedFirstOrder:true,atlasBytes:candidate.logicalCandidateAtlasBytes,bands:[[0.05,1],[1,3],[3,10],[10,25]].map(([lo,hi])=>band(before,after,lo,hi,baseline.camera)),imageDifference:difference(before,after)}};
 });
 const run=createRun('h53-scene-report',{parents,operation:'Decode authenticated before/after PNGs, compute fixed-camera sky-band display metrics, verify canonical deployed-image equality and N1/physical-control checks, and stack the two existing comparison PNGs without resampling or color changes.',parameters:{sourceRuns:paths,strip:{firstX:880,endXExclusive:1000},bandsDegrees:[[0.05,1],[1,3],[3,10],[10,25]],scope:'Actual production renderer and experiment-owned atlases; optical material differs between pairs, never within a pair. Display Y is not spectral radiance or paper RMSE.'}});
 let failure=null;
 try{
  assert.equal(data[0].panel.width,data[1].panel.width);
  const overview=new PNG({width:data[0].panel.width,height:data.reduce((s,d)=>s+d.panel.height,0)});
  let y=0;
  for(const {panel} of data){PNG.bitblt(panel,overview,0,0,panel.width,panel.height,0,y);y+=panel.height;}
  run.write('comparison.png',PNG.sync.write(overview));
  run.write('analysis.json',{pairs:data.map(d=>d.summary),method:'sRGB OETF inverse, D65 display-linear luminance coefficients; pixel-center perspective elevation; unobstructed x880..999 strip. Overview copies decoded comparison pixels exactly.',limitations:['Scene images quantify appearance; not independent physical correctness or paper RMSE.','Toronto is supported-band phase/SSA only, with original extinction and San Jose noon geometry.','Timings include full-scene extraction, packing, browser setup and rendering; not pure GPU timings or controlled production-build benchmarks.','No twilight, local-source, other-location or production adoption qualification.']});
 }catch(error){failure=error;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,pairs:data.map(d=>d.summary)}));
 if(failure)throw failure;
}
main();
