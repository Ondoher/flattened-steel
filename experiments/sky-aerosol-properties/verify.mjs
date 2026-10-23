import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {read,identity,createRun,checked} from './io.mjs';
import {color,xyzWeights} from './color.mjs';
import {gauss} from './reference.mjs';
const {PNG}=createRequire(import.meta.url)('pngjs');
const source=process.argv[2];assert.match(source??'',/^tmp\/experiments\/sky-aerosol-properties\/runs\/\d{5}-property-(?:screen|refine)$/);
const manifest=JSON.parse(read(source+'/manifest.json').toString());assert.equal(manifest.state,'accepted');
for(const artifact of manifest.artifacts){const current=identity(artifact.path);assert.deepEqual(current,artifact);}
for(const parent of manifest.parents){assert.deepEqual(identity(parent.path),parent);}
/** Accepted selected-ray measurements. @type {AerosolMeasurement[]} */
const packets=manifest.artifacts.filter(a=>/\/(?:noon|high|low)-(?:original|zero|ssa\d+|fixed-scattering|amount\d+|phase\d+|combo\d+)\.json$/.test(a.path)).map(a=>JSON.parse(read(a.path).toString()));
assert.equal(packets.length,manifest.facts.completed);
const run=createRun('verify-report',[identity(source+'/manifest.json'),...manifest.artifacts,identity('experiments/sky-aerosol-properties/verify.mjs')]);
let failure=null;
try{
 for(const n of [64,128,256,512]){const q=gauss(n);assert.ok(Math.abs(q.weights.reduce((a,b)=>a+b,0)-1)<1e-12);assert.ok(Math.abs(q.weights.reduce((s,w,i)=>s+w*q.nodes[i]**4,0)-.2)<1e-12);}
 const equalEnergy=color(Array(15).fill(1));assert.ok(equalEnergy.xy.every(x=>Math.abs(x-1/3)<.0002));assert.ok(xyzWeights.every(row=>row.every(x=>Number.isFinite(x)&&x>=0)));
 const old='tmp/experiments/sky-accuracy-dials/runs/00288-h40-distant/rays.json';
 const legacy=JSON.parse(read(old).toString()).find(c=>c.fraction===1);
 const baseline=packets.find(m=>m.condition==='noon'&&m.setting.id==='original');let reproduction=0;
 for(const row of legacy.rows){const azimuth={toward:0,cross:90,away:180}[row.heading];const current=baseline.rays.find(r=>r.id===`h${azimuth}-e${row.elevation}`);if(!current)continue;for(let c=0;c<15;c++)reproduction=Math.max(reproduction,Math.abs(current.spectrum[c]/row.spectrum[c]-1));}
 assert.ok(reproduction<1e-10);
 const invariants=JSON.parse(read(source+'/species-invariants.json').toString());assert.ok(invariants.molecularError<1e-10&&invariants.aerosolScalingError<1e-10);
 const events=read(source+'/progress.jsonl').toString().trim().split('\n').map(line=>JSON.parse(line));
 const maximumHeartbeatGap=Math.max(...events.slice(1).map((e,i)=>(Date.parse(e.timestamp)-Date.parse(events[i].timestamp))/1000));assert.ok(maximumHeartbeatGap<=30.5);
 const frames=manifest.artifacts.filter(a=>a.path.endsWith('-gpu.json')).map(a=>JSON.parse(read(a.path).toString()));assert.equal(frames.length,2*packets.length);assert.ok(frames.every(f=>!/software|swiftshader|llvmpipe/i.test(f.renderer)&&f.parity.every(p=>p.maximumRelative<.005)));
 const summary=packets.map(m=>{
  const base=packets.find(b=>b.condition===m.condition&&b.setting.id==='original');
  const horizon=m.rays.find(r=>r.id==='h180-e0.05'),baseH=base.rays.find(r=>r.id===horizon.id);
  return {condition:m.condition,setting:m.setting.id,...m.setting,horizonY:horizon.color.Y,horizonYRelative:horizon.color.Y/baseH.color.Y-1,horizonXY:horizon.color.xy,sourceRelativeRB:horizon.color.sourceRelativeRB,glowContrast:m.glowContrast,glowRelative:m.glowContrast/base.glowContrast-1,maximumRefinement:Math.max(...m.rays.map(r=>r.refinement))};
 });
 run.write('summary.json',summary);
 run.write('controls.json',{reproduction,invariants,maximumHeartbeatGap,frames:frames.length,maximumGpuRelative:Math.max(...frames.flatMap(f=>f.parity.map(p=>p.maximumRelative))),equalEnergy,scatteringOrder:1,units:'spectral radiance W m^-2 sr^-1 nm^-1'});
 const variants=packets.filter(p=>p.condition==='noon').map(p=>p.setting.id);
 const panels=[];
 for(const setting of variants){const sourceImage=source+`/noon-${setting}-horizon.png`;panels.push({setting,horizon:PNG.sync.read(read(sourceImage)),sun:PNG.sync.read(read(source+`/noon-${setting}-sun.png`))});}
 // Selectable HTML labels surround actual image panels; numbers remain text.
 run.write('comparison.html',`<!doctype html><meta charset="utf-8"><title>Aerosol properties — independent N1</title><style>body{font:16px system-ui;background:#eee}table{border-collapse:collapse}td,th{padding:6px;text-align:left}img{width:480px;image-rendering:auto}</style><h1>Aerosol properties: diffuse N1 only</h1><p>All panels share the same solar geometry, atmosphere scale heights and fixed P2 display/exposure. Left: away-Sun horizon (0.05–25°). Right: near-Sun sky. The direct solar disk is excluded. These are angular sky fields, not app scene captures.</p><table><tr><th>Setting</th><th>Horizon</th><th>Solar surround</th></tr>${panels.map(p=>`<tr><th>${p.setting}</th><td><img src="../${source.split('/').at(-1)}/noon-${p.setting}-horizon.png"></td><td><img src="../${source.split('/').at(-1)}/noon-${p.setting}-sun.png"></td></tr>`).join('')}</table>`);
 // Two representative actual-color pairs are compact visual progress artifacts.
 for(const kind of ['horizon','sun']){
  const a=PNG.sync.read(read(source+`/noon-original-${kind}.png`)),b=PNG.sync.read(read(source+`/noon-amount050-${kind}.png`));
  const image=new PNG({width:a.width*2,height:a.height});PNG.bitblt(a,image,0,0,a.width,a.height,0,0);PNG.bitblt(b,image,0,0,b.width,b.height,a.width,0);run.write(`${kind}-comparison.png`,PNG.sync.write(image));
 }
 run.write('report.md','# Aerosol-property screen\n\nIndependent first scattering only; matched full-scattering production/libRadtran confirmation remains future work.\n\n| Condition | Setting | Horizon Y relative to original | Source-relative R/B | Glow contrast |\n| --- | --- | ---: | ---: | ---: |\n'+summary.map(s=>`| ${s.condition} | ${s.setting} | ${(100*s.horizonYRelative).toFixed(2)}% | ${s.sourceRelativeRB.toFixed(4)} | ${s.glowContrast.toFixed(4)} |`).join('\n')+'\n');
 console.log(JSON.stringify({source,verification:run.relative,controls:{reproduction,maximumHeartbeatGap,frames:frames.length},summary}));
}catch(error){failure=error;run.write('failure.json',{error:String(error)});}
finally{run.finish(failure,{source,operation:'Hash verification, positive controls, exact earlier baseline reproduction and actual-image derivation. Production unchanged.'});}
if(failure)throw failure;
