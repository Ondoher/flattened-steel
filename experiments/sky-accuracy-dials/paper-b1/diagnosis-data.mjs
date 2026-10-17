import assert from 'node:assert/strict';
import {identity,readRepository,verifyRun} from '../io/files.mjs';
import {parseBoundaryTsv} from '../analysis/boundary.mjs';
import {scoreBoundary} from '../analysis/metrics.mjs';

export const basePath='tmp/experiments/sky-angular-quadrature/runs/00007-q2-base-full';
export const jointPath='tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1';
export const compilerPath='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
export const browserPath='experiments/sky-angular-quadrature/gpu/browser.js';

/** Authenticate every immutable input artifact before a new consumer uses it.
 * @param {string} root @returns {DialFileIdentity} Parent seal identity.
 */
export function authenticate(root){
 if(root!==basePath)return verifyRun(root);
 const file=root+'/sealed.json',bytes=readRepository(file,undefined,64*1024**2),seal=JSON.parse(bytes.toString());
 assert.equal(seal.schemaId,'sky-angular-run-seal-v1');assert.equal(seal.run,root);assert.equal(seal.state,'accepted');assert.equal(seal.heartbeatFailure,null);assert.deepEqual(seal.sourceFailures,[]);assert.equal(seal.cleanup.absent,true);
 for(const a of seal.artifacts){assert.ok(a.path.startsWith(root+'/'));readRepository(a.path,a,64*1024**2);}
 return identity(file,bytes);
}

/** Load all forty complete channel histories with exact binary payload identities.
 * @param {string} root @returns {B1DiagnosticCase}
 */
export function loadCase(root){
 const seal=authenticate(root),control=/** @type {B1GpuControl} */(JSON.parse(readRepository(root+'/control.json').toString()));
 assert.deepEqual(control.channels,Array.from({length:40},(_,i)=>i));assert.equal(control.scenes.length,17);
 const channels=control.channels.map(c=>{
  const metadata=/** @type {B1CapturedMetadata} */(JSON.parse(readRepository(root+'/channel-'+String(c).padStart(2,'0')+'.json').toString()));
  const b=readRepository(metadata.spectra.path,metadata.spectra),n=metadata.shape.rayCount;
  assert.equal(metadata.channel,c);assert.equal(n,1386);assert.equal(b.length,n*4*8);
  const values=Float64Array.from({length:n*4},(_,i)=>b.readDoubleLE(i*8));assert.ok(values.every(v=>Number.isFinite(v)&&v>=0));
  return {metadata,values};
 });
 return {path:root,seal,control,channels};
}

/** Preserve canonical time/Y/X/channel order for any cumulative order.
 * @param {B1DiagnosticCase} input @param {number} [order=3] @returns {DialAnalysisBoundary}
 */
export function caseBoundary(input,order=3){
 assert.ok(Number.isInteger(order)&&order>=0&&order<4);
 const values=new Float64Array(17*81*40);
 for(const {metadata,values:raw} of input.channels)for(let t=0;t<17;t++)for(let y=0;y<9;y++)for(let x=0;x<9;x++)values[(t*81+y*9+x)*40+metadata.channel]=raw[order*1386+t*81+x*9+y];
 return {configId:input.control.buildRequest.id+'-cumulative'+(order+1),quantity:'radiance',units:'W m^-2 sr^-1 nm^-1',times:input.control.scenes.map(s=>s.time),channels:Array.from({length:40},(_,i)=>i),rayIndices:Array.from({length:81},(_,i)=>i),values,sourceIdentity:input.seal};
}

/** Load the unchanged original spectral scoring target.
 * @returns {DialAnalysisBoundary}
 */
export function measurements(){const name='tmp/experiments/sky-accuracy-dials/runs/00000-inputs/measurements.tsv',sourceIdentity=identity(name);return parseBoundaryTsv(readRepository(name,sourceIdentity).toString(),{configId:'paper-measurement',sourceIdentity});}

/** Score only the registered 31 channels, retaining all forty in the boundary.
 * @param {B1DiagnosticCase} input @returns {DialBoundaryScore}
 */
export function caseScore(input){return scoreBoundary(caseBoundary(input),measurements());}
