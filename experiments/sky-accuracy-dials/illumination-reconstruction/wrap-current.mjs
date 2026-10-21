import assert from 'node:assert/strict';
import path from 'node:path';
import {existsSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {createRun,identity,listFiles,readRepository,resolveRepository,checkedAbsolute,storage} from '../io/files.mjs';
import {base,read,verifyRun} from './common.mjs';

const target=base+'00765-h136-tor-native',level=target+'/L128-n16.json.gz',run=createRun('h140-owner-wrap',{
 parents:[identity(target+'/definition.json'),verifyRun(base+'00768-h138-precision'),verifyRun(base+'00769-h137-source-save')],operation:'Owner requested wrapping current work and a conclusions report. Allow only the in-progress degree128/order16 Toronto projection level to save its completed artifact, then close the browser whose exact scratch ownership names the active target. Do not mutate its source or artifacts. Its existing controller catches the owned browser shutdown, closes resources and seals its own run failed; record that terminal state as owner-directed interruption, not a scientific rejection. Do not launch further projection degrees or a new experiment.',
 parameters:{target,completedBoundary:level,pollMilliseconds:500,waitLimitMilliseconds:15*60*1000,ownerDirective:'wrap up your current work then produce a report with your conclusions'},
});
try{
 const deadline=Date.now()+15*60*1000;let last=0;
 while(!existsSync(resolveRepository(level,target,false))&&!existsSync(resolveRepository(target+'/sealed.json',target,false))){if(Date.now()-last>5000){run.progress('await-current-level','Wait for the already-running L128/n16 artifact; no new scientific work requested.');last=Date.now();}assert.ok(Date.now()<deadline,'Current-level completion deadline requires an explicit new disposition');await new Promise(resolve=>setTimeout(resolve,500));}
 if(!existsSync(resolveRepository(target+'/sealed.json',target,false))){
  const packet=read(level);assert.equal(packet.L,128);assert.equal(packet.n,16);run.progress('close-owned-browser','Current projection level saved. Close only the target-owned Chrome instance before continued expansion.');
  const owners=listFiles('tmp/experiments/sky-accuracy-dials/scratch').filter(p=>p.endsWith('/owner.json')).map(p=>({file:p,record:read(p)})).filter(x=>x.record.owner===target);assert.equal(owners.length,1);const directory=path.posix.dirname(owners[0].file),ports=listFiles(directory).filter(p=>p.endsWith('/DevToolsActivePort'));assert.equal(ports.length,1);const port=readRepository(ports[0]).toString().trim().split(/\r?\n/)[0];assert.match(port,/^\d+$/);const ownedDirectory=resolveRepository(directory,'tmp/experiments/sky-accuracy-dials/scratch');checkedAbsolute(ownedDirectory);const browser=await puppeteer.connect({browserURL:'http://127.0.0.1:'+port,protocolTimeout:30000});await browser.close();
 }
 const terminalDeadline=Date.now()+60000;while(!existsSync(resolveRepository(target+'/sealed.json',target,false))){run.progress('await-owned-finalizer','Original controller is sealing artifacts and cleaning its scratch after browser shutdown.');assert.ok(Date.now()<terminalDeadline,'Owned controller did not finalize after shutdown');await new Promise(resolve=>setTimeout(resolve,1000));}
 const seal=verifyRun(target),terminal=read(target+'/sealed.json'),completed=existsSync(resolveRepository(level,target,false))?identity(level):null;assert.ok(terminal.cleanup.absent);run.write('summary.json',{target,terminalState:terminal.state,result:terminal.result,targetSeal:seal,completedBoundary:completed,sourceFailures:terminal.sourceFailures,heartbeatFailure:terminal.heartbeatFailure,interpretation:'Owner-directed wrap; a closed-browser failure is not a failed numerical gate. Completed level data remain immutable and may be assessed in a new derivative report. No full-native phase, recurrence, B1 or scene result is claimed.'});run.finish('accepted',{targetTerminal:terminal.state,completedBoundary:!!completed});console.log(JSON.stringify({run:run.path,targetTerminal:terminal.state,completedBoundary:!!completed,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
