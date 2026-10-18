import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createRun,verifyRun,identity,storage} from '../io/files.mjs';
import {render} from '../distant-horizon/attribution-common.mjs';
import {read,registration,oldReferences,screen,launch,previous,priorRegistration,placements} from './common.mjs';

/** Hardware capability query only; no atmosphere or validation samples.
 * @returns {any}
 */
function capabilities(){const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{powerPreference:'high-performance'});if(!gl)throw Error('WebGL2 required');const debug=gl.getExtension('WEBGL_debug_renderer_info'),result={renderer:String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER)),maximumTexture:gl.getParameter(gl.MAX_TEXTURE_SIZE),maximumViewport:Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS))};assertUnused();gl.getExtension('WEBGL_lose_context')?.loseContext();return result;function assertUnused(){/* Self-contained page query: no Node imports or physical samples. */}}

/** Freeze physical inputs, placement contrast and inexpensive native feasibility.
 * @returns {Promise<void>}
 */
async function init(){
 const r=registration(),run=createRun('h75-registration',{parents:[verifyRun(previous),verifyRun(priorRegistration),identity('agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/geometry-incoming-refinement-plan.md')],operation:'Freeze H75-H82 paper/Toronto development and fresh validation geometry, paired sampling procedure, parameterized analytic maps and native-builder cost estimates. No validation radiance.',parameters:{development:r.targets.map(t=>t.id),reserved:r.reserved.map(t=>t.id),retainedMiB:896}});let browser,failure=null;
 try{
  run.write('registration.json.gz',gzipSync(Buffer.from(JSON.stringify(r))));run.write('reference-development.json.gz',gzipSync(Buffer.from(JSON.stringify(oldReferences()))));browser=await launch(run);const page=await browser.newPage(),caps=await page.evaluate(capabilities);assert.ok(!/swiftshader|software|llvmpipe/i.test(caps.renderer));assert.ok(r.costAudit.rows<=caps.maximumTexture&&r.costAudit.rows<=caps.maximumViewport[1]);run.write('native-feasibility.json',{...r.costAudit,caps,dimensionFits:r.costAudit.counts.map(x=>({n:x.n,fit:x.n<=caps.maximumTexture&&x.n<=caps.maximumViewport[0]}))});await browser.close();browser=null;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1150" height="400"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="20" y="30" font-size="22">H75 native-builder feasibility: estimated fields, not measured allocation</text><text x="20" y="60">${r.costAudit.rows} rows; outgoing4374. Procedural rule metadata avoids a full direction table at every row.</text><text x="25" y="100">Directions</text><text x="210" y="100">One L field</text><text x="430" y="100">Full direction table</text><text x="700" y="100">Conservative2J+2L</text>${r.costAudit.counts.map((x,i)=>`<text x="25" y="${140+i*45}">${x.n}</text><text x="210" y="${140+i*45}">${(x.LBytes/1048576).toFixed(1)}MiB</text><text x="430" y="${140+i*45}">${(x.fullDirectionTableBytes/1048576).toFixed(1)}MiB</text><text x="700" y="${140+i*45}">${(x.conservativeTwoJTwoLBytes/1048576).toFixed(1)}MiB</text>`).join('')}<text x="20" y="355">Ground cross-row values must be evaluated at the same physical direction. Builder implementation/proofs remain conditional.</text><text x="20" y="380">These are build-time fields; no added incoming axis or direction search in runtime lookup.</text></g></svg>`;await render(run,[{name:'feasibility',svg,width:1150,height:400}]);
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,storage:storage()}));if(failure)throw failure;
}

/** Generic small registered screen; new waves use immutable JSON configuration inputs.
 * @param {string} registrationRoot @param {string} mode @param {string|undefined} waveInput @returns {Promise<void>}
 */
async function measure(registrationRoot,mode,waveInput){
 verifyRun(registrationRoot);const r=read(registrationRoot+'/registration.json.gz');let configs,targets=r.original,offsets=[0],wave;
 if(mode==='place75')configs=[256,1024].flatMap(n=>['endpoint','midpoint'].flatMap(placement=>[{id:`sun-${placement}-${n}`,kind:'sun',n,placement},{id:`B-${placement}-${n}`,kind:'layered',allocation:'old-B',n,placement}]));
 else{assert.ok(waveInput);wave=read(waveInput);configs=wave.configs;targets=wave.targets==='original'?r.original:wave.targets==='development'?r.targets:wave.targets==='reserved'?r.reserved:wave.targetValues;assert.ok(Array.isArray(targets)&&targets.length);offsets=wave.offsets??[0];}
 const run=createRun(mode==='place75'?'h75-placement':'h79-wave',{parents:[verifyRun(registrationRoot),...(waveInput?[identity(waveInput)]:[])],operation:'Preflight every actual generated grid and phase mass, then stream matched continuous incoming L1 and raw/normalized/species scattering integrals. Compatible old incident values reused; fresh validation only when explicit wave selects reserved.',parameters:{mode,configs,targets:targets.map(t=>t.id),offsets,referenceScope:'Development profiles separate; no pooled material score.'}});let browser,failure=null,result;
 try{run.write('wave.json',{mode,configs,targets,offsets,source:waveInput??null});browser=await launch(run);const page=await browser.newPage();result=await screen(page,run,r,targets,configs,offsets);run.write('index.json',result.index);run.write('rows.json',result.rows);run.write('work.json',{actualEvaluations:result.actualEvaluations,reusedEvaluations:result.reusedEvaluations,cases:result.rows.length});}
 catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,cases:result?.rows.length??null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,storage:storage()}));if(failure)throw failure;
}

if(process.argv[2]==='init75')await init();
else if(['place75','wave79'].includes(process.argv[2]))await measure(process.argv[3],process.argv[2],process.argv[4]);
