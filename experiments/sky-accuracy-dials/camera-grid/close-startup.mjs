import assert from 'node:assert/strict';
import {appendFileSync,existsSync,rmSync,writeFileSync} from 'node:fs';
import {identity,readRepository,resolveRepository,listFiles,storage,verifyRun} from '../io/files.mjs';

// Narrow closure of this agent's unsealed constructor failure; never reopen evidence.
const root='tmp/experiments/sky-accuracy-dials/runs/00443-h66-camera-grid',scratch='tmp/experiments/sky-accuracy-dials/scratch/65fd75a8-09d1-47d7-bac4-34d1f547483f';
assert.ok(!existsSync(resolveRepository(root+'/sealed.json',root,false)));
assert.deepEqual(listFiles(root),[root+'/progress.jsonl']);assert.deepEqual(listFiles(scratch),[scratch+'/owner.json']);
const owner=JSON.parse(readRepository(scratch+'/owner.json').toString());assert.equal(owner.owner,root);
const ownerId=identity(scratch+'/owner.json'),helper=identity('experiments/sky-accuracy-dials/camera-grid/close-startup.mjs');
const failure={message:'createRun rejected process.execPath C:/Program Files/nodejs/node.exe because nodejs is an nvm junction. The process exited before returning the run, writing a definition or launching a browser. No GPU calculations occurred.',missingInitialDefinition:true,scientificOutputCount:0,scratchOwner:ownerId,recoveryImplementation:helper,progressQualification:'Actual allocation-to-recovery gap is preserved; no backdated heartbeat and no accepted scientific claim.'};
writeFileSync(resolveRepository(root+'/startup-failure.json',root,false),JSON.stringify(failure)+'\n',{flag:'wx'});
const scratchAbsolute=resolveRepository(scratch,'tmp/experiments/sky-accuracy-dials/scratch');readRepository(ownerId.path,ownerId);rmSync(scratchAbsolute,{recursive:true,force:false});
assert.ok(!existsSync(scratchAbsolute));
appendFileSync(resolveRepository(root+'/progress.jsonl',root),JSON.stringify({timestamp:new Date().toISOString(),phase:'terminal',message:failure.message,state:'failed'})+'\n');
const events=readRepository(root+'/progress.jsonl').toString().trim().split('\n').map(line=>JSON.parse(line)),gap=Date.parse(events.at(-1).timestamp)-Date.parse(events[0].timestamp);
const artifacts=listFiles(root).map(p=>({...identity(p),derivation:{parents:[helper,ownerId,...owner.recipe.parents],operation:'Preserve original startup event; record constructor rejection, authenticating and cleaning its owner-only scratch, then append actual terminal time.'}}));
const seal={schemaId:'sky-accuracy-run-seal-v1',run:root,state:'failed',finishedAt:new Date().toISOString(),result:failure,recipe:owner.recipe,sources:[helper],sourceFailures:[],artifacts,cleanup:{path:scratch,owner:root,highWaterBytes:ownerId.byteLength,absent:true},storage:storage(),heartbeatFailure:gap>35000?'Startup exited before monitoring; actual recovery gap retained.':null};
writeFileSync(resolveRepository(root+'/sealed.json',root,false),JSON.stringify(seal)+'\n',{flag:'wx'});
for(const a of artifacts)readRepository(a.path,a);
if(gap>35000)assert.throws(()=>verifyRun(root),/Progress heartbeat gap exceeds contract/);else verifyRun(root);
console.log(JSON.stringify({closed:root,state:'failed',gap,scientificOutputCount:0,storage:storage()}));
