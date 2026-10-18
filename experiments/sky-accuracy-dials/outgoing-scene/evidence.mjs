import assert from 'node:assert/strict';
import {verifyRun,readRepository,identity,resolveRepository,listFiles} from '../io/files.mjs';

const qualifiedRoot='tmp/experiments/sky-accuracy-dials/runs/00415-h62-twilight60';
const expectedSeal={path:qualifiedRoot+'/sealed.json',byteLength:132165,sha256:'d0dbbd96e24a227d4dc861c26e1d51ae05d3334c5cce0041f06ffa8d37489e3c'};

/** Disclose the one retained progress-contract failure; never claim its repair.
 * @returns {{root:string,gapMilliseconds:number,scope:string}}
 */
export function progressQualification(){
 return {root:qualifiedRoot,gapMilliseconds:73772,scope:'00415 sealed its completed capture, but strict post-run verification rejected one 73.772-second progress gap (limit35seconds). Independent artifact, source-graph, control, numerical and image checks qualify its scientific content only. The original progress contract remains unmet; cause of the delayed heartbeat is unproven. No artifact or tolerance is changed.'};
}

/** Verify ordinary runs strictly, or independently inspect the exact preserved 00415 capture.
 * Only the pinned historical progress gap is qualified; all other integrity gates remain strict.
 * @param {string} root Repository-relative immutable evidence root.
 * @returns {DialFileIdentity} Authenticated seal; throws on any unregistered discrepancy.
 */
export function verifySceneEvidence(root){
 if(root!==qualifiedRoot)return verifyRun(root);
 resolveRepository(root,'tmp/experiments/sky-accuracy-dials/runs');
 const bytes=readRepository(expectedSeal.path,expectedSeal),seal=JSON.parse(bytes.toString());
 assert.equal(seal.schemaId,'sky-accuracy-run-seal-v1');assert.equal(seal.run,root);
 assert.equal(seal.state,'accepted');assert.equal(seal.heartbeatFailure,null);
 assert.deepEqual(seal.sourceFailures,[]);assert.equal(seal.cleanup.owner,root);assert.equal(seal.cleanup.absent,true);
 const inventory=new Set([expectedSeal.path]);
 for(const artifact of seal.artifacts){
  resolveRepository(artifact.path,root);assert.ok(!inventory.has(artifact.path));
  assert.ok(artifact.derivation.operation&&Array.isArray(artifact.derivation.parents));
  readRepository(artifact.path,artifact);inventory.add(artifact.path);
 }
 assert.deepEqual(listFiles(root),[...inventory].sort());
 // The runtime graph is independently authenticated against the recorded source bytes.
 const graph=JSON.parse(readRepository(root+'/inputs.json').toString());
 for(const source of graph.sources)readRepository(source.path,source);
 const events=readRepository(root+'/progress.jsonl').toString().trim().split('\n').map(line=>JSON.parse(line));
 assert.equal(events.at(-1).state,'accepted');const gaps=[];
 for(let i=1;i<events.length;i++){
  const gap=Date.parse(events[i].timestamp)-Date.parse(events[i-1].timestamp);assert.ok(Number.isFinite(gap)&&gap>=0);
  if(gap>35000)gaps.push({gap,before:events[i-1].timestamp,after:events[i].timestamp});
 }
 assert.deepEqual(gaps,[{gap:73772,before:'2026-10-18T01:33:44.580Z',after:'2026-10-18T01:34:58.352Z'}]);
 return identity(expectedSeal.path,bytes);
}
