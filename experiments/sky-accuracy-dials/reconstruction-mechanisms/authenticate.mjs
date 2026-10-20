import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {readRepository,listFiles,resolveRepository,identity,verifyRun} from '../io/files.mjs';
import {read} from './common.mjs';
/** Authenticate an explicitly disclosed monitoring failure without changing its seal.
 * Current original source bytes must still match before derivative recovery.
 * @param {string} root @returns {any} */
export function authenticate(root){const seal=read(root+'/sealed.json');for(const a of seal.artifacts)readRepository(a.path,a);for(const a of seal.sources)readRepository(a.path,a);assert.deepEqual(listFiles(root),[...seal.artifacts.map(x=>x.path),root+'/sealed.json'].sort());assert.deepEqual(seal.sourceFailures,[]);assert.equal(seal.heartbeatFailure,null);assert.ok(seal.cleanup.absent&&!existsSync(resolveRepository(seal.cleanup.path,'tmp/experiments/sky-accuracy-dials/scratch',false)));const events=readRepository(root+'/progress.jsonl').toString().trim().split('\n').map(x=>JSON.parse(x)),gaps=events.slice(1).map((after,i)=>({before:events[i],after,seconds:(Date.parse(after.timestamp)-Date.parse(events[i].timestamp))/1000})).filter(x=>x.seconds>35);if(gaps.length)assert.throws(()=>verifyRun(root),/Progress heartbeat gap exceeds contract/);else verifyRun(root);return {seal:identity(root+'/sealed.json'),gaps,originalMonitoringQualified:gaps.length===0,inventoryAuthenticated:true,sourceSnapshotAuthenticated:true,originalState:seal.state};}
