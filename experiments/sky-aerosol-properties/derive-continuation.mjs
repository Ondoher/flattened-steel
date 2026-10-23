import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {read,checked} from './io.mjs';
let source=read('experiments/sky-aerosol-properties/run.mjs').toString();
/** Require every intended derivation to match the pinned original runner. @param {string} before @param {string} after */
function replace(before,after){assert.ok(source.includes(before),before);source=source.replace(before,after);}
replace("import {fragment,execute} from './gpu.mjs';","import {fragment,execute} from './gpu-session.mjs';\nimport {gzipSync} from 'node:zlib';\nimport path from 'node:path';");
replace("{id:'phase085',amount:.5,ssa:.95,g:.85}];","{id:'phase085',amount:.5,ssa:.95,g:.85},{id:'combo025',amount:.25,ssa:.95,g:.85},{id:'combo010',amount:.1,ssa:.95,g:.85}];");
replace("const run=createRun('property-screen',parents)",`
const pilot='tmp/experiments/sky-aerosol-properties/runs/00000-property-screen';
const pilotManifest=JSON.parse(read(pilot+'/manifest.json').toString());
assert.equal(pilotManifest.state,'failed');
for(const artifact of pilotManifest.artifacts)assert.deepEqual(identity(artifact.path),artifact);
for(const name of ['reference.mjs','color.mjs','io.mjs','run.mjs']){
 const recorded=pilotManifest.parents.find(p=>p.path==='experiments/sky-aerosol-properties/'+name);assert.ok(recorded);assert.deepEqual(identity(recorded.path),recorded);
}
parents.push(identity(pilot+'/manifest.json'),...pilotManifest.artifacts);
// Include the actual production display/source graph; only experiment output is written.
const graphSeen=new Set();
function graph(name){if(graphSeen.has(name))return;graphSeen.add(name);parents.push(identity(name));const text=read(name).toString();for(const match of text.matchAll(/(?:from\\s*|import\\s*)['"](\\.[^'"]+)['"]/g))graph(path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1])));}
graph('src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js');
graph('src/algorithm32/profiles/native-15/native-15-profile.js');
const run=createRun('property-refine',parents)`);
replace('let browser,failure=null,numericalFloor=1e-12;','let browser,gpuPage,failure=null,numericalFloor=1e-12,bracketExposure=1;');
replace('const solarElevation=Math.asin(medium.sourceDirection[2])*180/Math.PI;',`
 if(condition==='noon'){
  const found=pilotManifest.artifacts.find(a=>a.path===pilot+'/noon-'+setting.id+'.json');
  if(found){const packet=JSON.parse(read(found.path).toString());assert.deepEqual(packet.medium,medium);assert.deepEqual(packet.setting,setting);measurements.push(packet);run.write(condition+'-'+setting.id+'.json',packet);run.progress('reuse','Authenticated '+setting.id+' CPU packet from deliberately interrupted pilot');return packet;}
 }
 const solarElevation=Math.asin(medium.sourceDirection[2])*180/Math.PI;`);
replace('const page=await browser.newPage();','const page=gpuPage??=await browser.newPage();');
replace('const shader=fragment(packet.medium,rgbWeights,view);','const shader=fragment(initial,rgbWeights,view);');
replace('const result=await page.evaluate(execute,{shader,width:240,height:150,directions:probes.map(r=>r.direction)});','const result=await page.evaluate(execute,{shader,width:240,height:150,directions:probes.map(r=>r.direction),parameters:{...packet.setting,observerHeight:packet.medium.observerHeight,sourceDirection:packet.medium.sourceDirection},view});');
replace('const png=new PNG({width:240,height:150});','run.write(`${condition}-${packet.setting.id}-${view.id}-linear.f32.gz`,gzipSync(Buffer.from(Float32Array.from(item.pixels).buffer)));\n    const png=new PNG({width:240,height:150}),bracket=new PNG({width:240,height:150});');
replace('for(let c=0;c<3;c++)png.data[j+c]=Math.round(code[c]*255);png.data[j+3]=255;',`
     const bracketCode=display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */(rgb.map(x=>x*bracketExposure)),{value:registration.lux,units:'lux'});
     for(let c=0;c<3;c++){png.data[j+c]=Math.round(code[c]*255);bracket.data[j+c]=Math.round(bracketCode[c]*255);}png.data[j+3]=255;bracket.data[j+3]=255;`);
replace('run.write(`${condition}-${packet.setting.id}-${view.id}.png`,PNG.sync.write(png));','run.write(`${condition}-${packet.setting.id}-${view.id}.png`,PNG.sync.write(png));\n    run.write(`${condition}-${packet.setting.id}-${view.id}-bracket.png`,PNG.sync.write(bracket));');
replace('}finally{await page.close();}','}finally{/* The single owned page is retired by browser.close after all comparisons. */}');
replace("await images(measurements.filter(m=>m.condition==='noon'),'noon');",`
 // A single, recorded exposure for every secondary image, chosen jointly from the
 // brightest selected near-Sun physical ray. The primary display remains unchanged.
 const brightest=measurements.flatMap(m=>m.rays.filter(r=>r.id.startsWith('sun-'))).sort((a,b)=>Math.max(...b.color.rgb)-Math.max(...a.color.rgb))[0];
 while(Math.max(...display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */(brightest.color.rgb.map(x=>x*bracketExposure)),{value:registration.lux,units:'lux'}))>.7)bracketExposure*=.5;
 run.write('refinement.json',{pilot,pilotState:pilotManifest.state,disposition:'Deliberately stopped the owned browser after near-Sun images saturated and per-variant compilation took about 40 seconds. Reuse only closed/hash-authenticated CPU packets; preserve failed original disposition. Numerical code unchanged.',kernel:'Same N1 equations and quadrature, uniform-controlled physical parameters and one retained hardware program',bracketExposure,exposureDerivation:'One common multiplier chosen so the brightest selected noon near-Sun ray among all cases has maximum display code <=0.7; no per-case auto exposure.',adaptiveBranch:'Combine 25% or 10% loading with g=0.85 at SSA0.95 after independent low-loading and forward-phase screens showed complementary effects.'});
 await images(measurements.filter(m=>m.condition==='noon'),'noon');`);
writeFileSync(checked('experiments/sky-aerosol-properties/run-refined.mjs',true),source,{flag:'wx'});
