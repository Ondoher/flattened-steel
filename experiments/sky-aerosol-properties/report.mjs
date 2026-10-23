import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {gunzipSync} from 'node:zlib';
import {read,identity,createRun} from './io.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../src/algorithm32/profiles/native-15/native-15-profile.js';
const {PNG}=createRequire(import.meta.url)('pngjs');
const source=process.argv[2],verification=process.argv[3];
assert.match(source??'',/^tmp\/experiments\/sky-aerosol-properties\/runs\/\d{5}-property-refine$/);
assert.match(verification??'',/^tmp\/experiments\/sky-aerosol-properties\/runs\/\d{5}-verify-report$/);
const manifest=JSON.parse(read(source+'/manifest.json').toString()),proof=JSON.parse(read(verification+'/manifest.json').toString());
assert.equal(manifest.state,'accepted');assert.equal(proof.state,'accepted');
for(const input of [...manifest.artifacts,...proof.artifacts])assert.deepEqual(identity(input.path),input);
const run=createRun('visual-report',[identity(source+'/manifest.json'),identity(verification+'/manifest.json'),identity('experiments/sky-aerosol-properties/report.mjs'),...manifest.artifacts,...proof.artifacts]);
let failure=null;
try{
 const refinement=JSON.parse(read(source+'/refinement.json').toString());
 const summary=JSON.parse(read(verification+'/summary.json').toString());
 const raw=manifest.artifacts.filter(a=>a.path.endsWith('-linear.f32.gz'));
 assert.equal(raw.length,42);let nonfinite=0;
 for(const artifact of raw){const bytes=gunzipSync(read(artifact.path));assert.equal(bytes.length,240*150*4*4);for(let i=0;i<bytes.length;i+=4)if(!Number.isFinite(bytes.readFloatLE(i)))nonfinite++;}
 assert.equal(nonfinite,0);
 const variants=['original','zero','ssa100','amount025','amount050','phase085','combo025','combo010'];
 const rows=variants.map(id=>({id,metrics:summary.find(s=>s.condition==='noon'&&s.setting===id)}));
 const html=`<!doctype html><meta charset="utf-8"><title>Aerosol properties: matched N1 comparison</title><style>body{font:16px system-ui;background:#eee;color:#111}td,th{padding:8px;text-align:left}img{width:480px}table{border-collapse:collapse}small{display:block;max-width:960px}</style><h1>Aerosol properties: independent N1 screen</h1><p>Horizon columns share the primary P2 display. Sun columns share an additional exposure multiplier of ${refinement.bracketExposure}; it is identical across all cases. Original primary images, raw linear RGB and full spectra are retained. The direct solar disk is excluded.</p><p>This is a diffuse, spherical, first-scattering angular field, not an app scene or a measured-sky validation. Baseline noon geometry and 5 m observer height are fixed.</p><table><tr><th>Setting</th><th>Away-Sun horizon</th><th>Solar surround, common exposure bracket</th></tr>${rows.map(row=>`<tr><th>${row.id}<small>Horizon luminance: ${row.metrics.horizonY.toFixed(1)} cd/m²<br>xy: ${row.metrics.horizonXY.map(x=>x.toFixed(4)).join(', ')}<br>Glow contrast: ${row.metrics.glowContrast.toFixed(3)}</small></th><td><img src="../${source.split('/').at(-1)}/noon-${row.id}-horizon.png"></td><td><img src="../${source.split('/').at(-1)}/noon-${row.id}-sun-bracket.png"></td></tr>`).join('')}</table><h2>Full physical spectra</h2><p><a href="spectra.svg">Selected away-Sun horizon spectra: absolute radiance and equal-luminance shape</a></p>`;
 run.write('comparison.html',html);
 const selected=['original','zero','combo025'];
 const pair=new PNG({width:720,height:300});
 for(let column=0;column<selected.length;column++)for(let row=0;row<2;row++){
  const suffix=row===0?'horizon':'sun-bracket';const panel=PNG.sync.read(read(source+`/noon-${selected[column]}-${suffix}.png`));PNG.bitblt(panel,pair,0,0,240,150,column*240,row*150);
 }
 run.write('appearance-comparison.png',PNG.sync.write(pair));
 const colors=['#333','#8c6200','#2582c7','#a63271','#23803a'];
 const plotted=['original','zero','ssa100','amount025','combo025'].map(id=>{
  /** @type {AerosolMeasurement} */ const packet=JSON.parse(read(source+`/noon-${id}.json`).toString());return {id,ray:packet.rays.find(r=>r.id==='h180-e0.05')};
 });
 const wavelengths=NATIVE_15_SPECTRAL_BASIS.channels.map(c=>c.center.value),width=600,height=280;
 const panels=[false,true].map((equalY,index)=>{
  const curves=plotted.map(p=>p.ray.spectrum.map(x=>x*(equalY?1000/p.ray.color.Y:1))),maximum=1.05*Math.max(...curves.flat());
  return `<g transform="translate(${index*width},0)"><text x="50" y="22">${equalY?'Shape at equal Y=1000 cd/m²':'Absolute directional spectral radiance'}</text><path d="M50 35V230H580" fill="none" stroke="#333"/>${curves.map((values,c)=>`<polyline fill="none" stroke="${colors[c]}" stroke-width="2" points="${values.map((value,k)=>`${50+(wavelengths[k]-360)/470*530},${230-value/maximum*190}`).join(' ')}"/>`).join('')}<text x="50" y="251">360</text><text x="545" y="251">830 nm</text><text x="50" y="273">Maximum axis value: ${maximum.toPrecision(4)} W m⁻² sr⁻¹ nm⁻¹</text></g>`;
 });
 run.write('spectra.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330"><rect width="1200" height="330" fill="white"/><g font-family="sans-serif" font-size="14">${panels.join('')}${plotted.map((p,k)=>`<text x="${50+k*230}" y="315" fill="${colors[k]}">${p.id}</text>`).join('')}</g></svg>`);
 run.write('controls.json',{rawFields:raw.length,nonfinite,commonBracket:refinement.bracketExposure,columns:selected,rows:['horizon at primary exposure','Sun surround at shared bracket exposure'],source,verification,order:1});
 console.log(JSON.stringify({run:run.relative,source,verification,rawFields:raw.length,nonfinite,commonBracket:refinement.bracketExposure}));
}catch(error){failure=error;run.write('failure.json',{error:String(error)});}
finally{run.finish(failure,{source,verification,operation:'Authenticate full evidence, inspect raw finite float fields, derive actual-color comparison and physical spectra plots. No transport rerun.'});}
if(failure)throw failure;
