import assert from 'node:assert/strict';
import path from 'node:path';
import {readdirSync,existsSync,readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {createRun,verifyRun,resolveRepository,checkedAbsolute,identity,storage} from '../io/files.mjs';
import {read} from '../geometry-incoming/common.mjs';

const target=process.argv[3],definition=read(target+'/definition.json');assert.ok(definition.command[1].replaceAll('\\','/').endsWith('/structured-incoming/report.mjs'));
const run=createRun('h96-render-stop',{parents:[identity(target+'/definition.json')],operation:'Recover one stalled experiment-owned figure browser by authenticated scratch-owner identity and DevTools endpoint. Do not touch numerical GPU browser or user processes.',parameters:{target}});let failure=null;
try{
 if(existsSync(resolveRepository(target+'/sealed.json','',false)))run.write('recovery.json',{target,action:'Already terminal; no browser touched.',seal:identity(target+'/sealed.json')});
 else{
  const scratch=resolveRepository('tmp/experiments/sky-accuracy-dials/scratch'),owners=[];
  for(const entry of readdirSync(scratch,{withFileTypes:true})){if(!entry.isDirectory())continue;const dir=checkedAbsolute(path.join(scratch,entry.name)),ownerFile=path.join(dir,'owner.json');if(!existsSync(ownerFile))continue;const owner=JSON.parse(readFileSync(checkedAbsolute(ownerFile),'utf8'));if(owner.owner===target)owners.push({dir,owner});}
  if(owners.length===0&&existsSync(resolveRepository(target+'/sealed.json','',false)))run.write('recovery.json',{target,action:'Report completed and cleaned its profile during ownership lookup; no browser touched.',seal:identity(target+'/sealed.json')});
  else{assert.equal(owners.length,1);const portFile=checkedAbsolute(path.join(owners[0].dir,'figures','DevToolsActivePort')),lines=readFileSync(portFile,'utf8').trim().split(/\r?\n/);assert.match(lines[0],/^\d+$/);assert.ok(lines[1].startsWith('/devtools/browser/'));
   run.progress('close','Closing the stalled report figure browser only.');const browser=await puppeteer.connect({browserWSEndpoint:`ws://127.0.0.1:${lines[0]}${lines[1]}`});await browser.close();
   run.write('recovery.json',{target,action:'Closed exact owned figures browser via authenticated DevTools profile.',scratchOwner:owners[0].owner.owner,profile:'figures',numericalBrowsersTouched:false});}
 }
 run.finish('accepted',{target});
}catch(e){failure=e;run.finish('failed',{failure:String(e)});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,storage:storage()}));if(failure)throw failure;
