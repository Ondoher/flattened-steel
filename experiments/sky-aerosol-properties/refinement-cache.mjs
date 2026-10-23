import assert from 'node:assert/strict';
import {mkdirSync,rmSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun,read,identity,checked,output} from './io.mjs';
import {parents,medium,queries,direction,baseline} from './refinement-common.mjs';
import {unit} from './reference.mjs';
import {DistantSunSceneCacheCompilerInputs as Inputs} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js';

import {DistantSunSceneCacheNumerics as Numerics} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js';
const option=(name,fallback)=>process.argv.includes(name)?Number(process.argv[process.argv.indexOf(name)+1]):fallback;
const H=option('--height',1200),alpha=option('--alpha',.8),loading=option('--loading',.25),ssa=option('--ssa',.95),m=medium(H,alpha,loading,ssa),run=createRun('refine-cache',parents()),scratch=output+'/scratch/'+run.relative.split('/').at(-1);let browser,failure=null;
try{
 const initial=Inputs.createQualifiedSanJoseNauticalScene(),input=Inputs.createInputSet(initial,{mieAngstromBeta:.01,numericalPolicy:Numerics.createAnchoredRadial(),solarInterpolation:'monotone-cubic',scatteringAccuracy:'corrected60-sun035',positionDomain:'native51-near-ground'}),request=input.buildRequest,s=request.transportSpec;
 Object.assign(s.atmosphere,{id:'experiment-combo025-H'+H,mieScaleHeightMeters:H,mieAngstromAlpha:alpha,mieAngstromBeta:.01*(loading/.25)*Math.pow(.55,alpha-.8)/-Math.expm1(-60000/H),mieSingleScatteringAlbedo:ssa,miePhaseFunctionG:.85});
 s.domains.spectrum.channels.forEach((c,k)=>Object.assign(c,{rayleighScatteringPerMeter:m.rayleigh[k],mieExtinctionPerMeter:m.mie[k],sourceIrradianceDensityWattsPerSquareMeterPerNanometer:m.sourceIrradiance[k]}));
 Object.assign(s.numerical,{transportIntervalCount:option('--path',60)});
 const incoming=option('--incoming',68);if(incoming!==68){assert.equal(incoming,272);Object.assign(s.domains,{incoming:{id:'experiment-fibonacci272-numerical-diagnostic',directionCount:incoming,unitVectors:Array.from({length:incoming},(_,i)=>{const z=1-2*(i+.5)/incoming,a=i*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-z*z);return [r*Math.cos(a),r*Math.sin(a),z];}),integrationWeightsSteradians:Array(incoming).fill(4*Math.PI/incoming)}});}
 const frozen=queries(m),dirs=frozen.map(q=>q.direction),fields=[];const size=[120,80],e=Math.asin(m.sourceDirection[2])*180/Math.PI;
 for(const view of ['horizon','sun']){const first=dirs.length;for(let y=0;y<size[1];y++)for(let x=0;x<size[0];x++){
  if(view==='horizon')dirs.push(direction(.05+(20-.05)*(y+.5)/size[1],150+60*(x+.5)/size[0]));
  else {const center=m.sourceDirection,up=unit([0,0,1].map((v,i)=>v-center[2]*center[i])),xx=Math.tan(12*Math.PI/180)*(2*(x+.5)/size[0]-1),yy=Math.tan(8*Math.PI/180)*(2*(y+.5)/size[1]-1);dirs.push(unit(center.map((v,i)=>v+xx*[1,0,0][i]+yy*up[i])));}
 }fields.push({view,first,count:dirs.length-first,width:size[0],height:size[1],projection:view==='sun'?'Sun-centered rectilinear24x16degrees':'away-Sun azimuth150–210 elevation0.05–20degrees'});}
 const pilot=process.argv.includes('--pilot'),control={request,directions:dirs,jobs:[{id:'noon5',height:5,zenith:90-e,sunRotation:0}],channels:pilot?[5]:Array.from({length:15},(_,i)=>i),intervals:96,sunFieldFirst:fields.find(f=>f.view==='sun').first};
 if(process.argv.includes('--conditions'))control.jobs.push({id:'noon500',height:500,zenith:90-e,sunRotation:0},{id:'low15',height:5,zenith:75,sunRotation:15-e},{id:'noon2000',height:2000,zenith:90-e,sunRotation:0});
 run.write('control.json',{...control,medium:m,rays:frozen,fields,retention:'Global recurrence fields are ephemeral; retain all pure and cumulative spectral view queries, not an app-loadable cache package.'});
 const entry=checked('experiments/sky-aerosol-properties/refinement-cache-browser.mjs'),compiler=checked('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js'),source=read('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js').toString(),needle='if (onFieldProbes === null) return;';assert.equal(source.split(needle).length,2);
 let modified=source.replace(needle,"if(fieldId.startsWith('J'))await globalThis['__aerosolObserve']({fieldId,resource,common});\n\t\t"+needle);
 if(option('--path',60)===120){const gate="if (accuracy !== 'legacy' && intervals !== 60)";assert.equal(modified.split(gate).length,2);modified=modified.replace(gate,"if (accuracy !== 'legacy' && intervals !== 60 && intervals !== 120)");}
 const sources=[];const bundle=await rollup({input:entry,plugins:[{name:'contained-readonly-observer',load(id){if(id.startsWith(checked('src'))||id.startsWith(checked('scripts')))sources.push(identity(id.slice(checked('AGENTS.md').length-'AGENTS.md'.length).replaceAll('\\','/')));return null;},transform(code,id){if(id===compiler)return{code:modified,map:null};if(id===entry)return{code:code+"\nglobalThis['aerosolCache']=execute;",map:null};return null;}}]});let code;try{code=(await bundle.generate({format:'iife'})).output[0].code;}finally{await bundle.close();}
 run.write('implementation.json',{sources,compiler:identity('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js'),operation:'Read-only live-J observer inserted before optional probes; equations and recurrence unchanged'});run.write('browser.js.gz',gzipSync(Buffer.from(code)));
 mkdirSync(checked(scratch,true),{recursive:true});browser=await puppeteer.launch({headless:'new',userDataDir:checked(scratch),protocolTimeout:1800000,args:['--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11']});const page=await browser.newPage();
 await page.exposeFunction('aerosolProgress',s=>{run.progress('build',String(s));console.log(s);});await page.exposeFunction('aerosolChannel',c=>{assert.equal(c.records.length,4);assert.equal(c.report.finalLiveFieldBytes,0);run.write(`channel-${c.channel}.json.gz`,gzipSync(Buffer.from(JSON.stringify(c))));run.progress('channel',`Closed channel${c.channel}`,{completed:c.channel+1,total:15});});await page.addScriptTag({content:code});
 const started=Date.now(),result=await page.evaluate(c=>globalThis['aerosolCache'](c),control);run.write('telemetry.json',{...result,milliseconds:Date.now()-started,nodeMemory:process.memoryUsage(),browser:await browser.version()});console.log(JSON.stringify({run:run.relative,result}));
}catch(e){failure=e;run.write('failure.json',{error:String(e)});console.error(e);}finally{await browser?.close().catch(e=>failure??=e);if(browser){const target=checked(scratch);assert.ok(target.startsWith(checked(output+'/scratch')+'\\'));rmSync(target,{recursive:true});}run.finish(failure,{purpose:'Full global recurrence, compact retained observations; production unchanged'});}if(failure)process.exitCode=1;
