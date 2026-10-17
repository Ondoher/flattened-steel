import assert from 'node:assert/strict';
import {createRun,verifyRun,identity,readRepository} from '../io/files.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';
import {halfWidth} from './libradtran.mjs';
import {inputs,runRoot,centers,rgb,render,panel} from './attribution-common.mjs';

/** Saved 0.05-degree cumulative-order comparison, preserving paired Monte Carlo covariance.
 * @returns {Promise<void>} Authenticated analysis and reviewable images, no new transport.
 */
async function main(){
 assert.equal(process.argv.length,2);const {parents,physical,production,batches}=inputs();
 const ext=runRoot+'00325-h47-order-report';parents.push(verifyRun(ext),identity(ext+'/analysis.json'));
 const external=JSON.parse(readRepository(ext+'/analysis.json').toString()).external[0].externalFull;
 const p=production.find(p=>p.elevation===0.05&&p.intervals===30);assert.ok(p);
 const samples=Array.from({length:24},(_,b)=>centers.map((_,c)=>{const row=batches.find(r=>r.profile==='main'&&r.group===0&&r.channel===c&&r.batch===b);assert.ok(row);return row.means;}));
 const rows=p.cumulative.map((prod,i)=>{
  const cumulative=samples.map(row=>row.map(m=>m.slice(1,i+2).reduce((s,x)=>s+x,0))),pure=samples.map(row=>row.map(m=>m[i+1]));
  const spectrum=centers.map((_,c)=>cumulative.reduce((s,row)=>s+row[c],0)/24),increment=prod.spectrum.map((x,c)=>x-(i?p.cumulative[i-1].spectrum[c]:0));
  const pureSpectrum=centers.map((_,c)=>pure.reduce((s,row)=>s+row[c],0)/24),difference=prod.spectrum.map((x,c)=>x-spectrum[c]),incrementDifference=increment.map((x,c)=>x-pureSpectrum[c]);
  const color=colorimetry(spectrum,'bin-integrated'),pureColor=colorimetry(pureSpectrum,'bin-integrated'),incrementColor=colorimetry(increment,'bin-integrated');
  return {order:i+1,production:prod,independent:{spectrum,color,luminanceHalfWidth95:halfWidth(cumulative.map(s=>colorimetry(s,'bin-integrated').luminanceCdPerM2)),bandHalfWidths95:centers.map((_,c)=>halfWidth(cumulative.map(s=>s[c])))},difference,relativeSpectralExcess:difference.map((x,c)=>x/spectrum[c]),relativeLuminanceExcess:prod.color.luminanceCdPerM2/color.luminanceCdPerM2-1,productionApparentIncrement:{spectrum:increment,color:incrementColor},independentPure:{spectrum:pureSpectrum,color:pureColor,luminanceHalfWidth95:halfWidth(pure.map(s=>colorimetry(s,'bin-integrated').luminanceCdPerM2))},excessAddedByStage:{spectrum:incrementDifference,luminance:incrementColor.luminanceCdPerM2-pureColor.luminanceCdPerM2,halfWidth95:halfWidth(pure.map(s=>colorimetry(s,'bin-integrated').luminanceCdPerM2))},viewControls:production.filter(r=>r.elevation===0.05).map(v=>({intervals:v.intervals,relativeY:v.cumulative[i].color.luminanceCdPerM2/prod.color.luminanceCdPerM2-1}))};
 });
 const run=createRun('h48-order-budget',{parents,operation:'Cumulative N1..N4 and paired stage-excess budget from saved production and cache-free GPU samples at0.05degrees. Exact independent pure tallies; production apparent increments include nonlinear view reconstruction. No numerical transport rerun.',parameters:{elevation:0.05,awaySun:true,lux:physical.lux,independentBatches:24,channels:15}});
 let failure=null;
 try{
  run.write('analysis.json',{rows,externalEndpoint:external,units:'Spectra W m^-2 sr^-1 nm^-1; luminance cd/m2',uncertainty:'Empirical marginal95 from common per-batch cumulative/pure sums; production deterministic discretization error is not included.',limitations:['Production cumulative increments are not exact isolated physical orders.','Existing physical target and H47 precision/geometry qualifications remain.']});
  const width=1200,height=850;
  const comparison=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="25" y="32" font-size="24">Toronto horizon: where the production excess develops</text><text x="25" y="59" font-size="14">0.05 degrees away from Sun. Same source, atmosphere and fixed production p2 display; no exposure fitting.</text><text x="180" y="96" font-size="19">Production cumulative</text><text x="690" y="96" font-size="19">Independent cumulative</text>${rows.map((r,i)=>{const y=125+i*155;return `<text x="25" y="${y+40}" font-size="19">N1-${r.order}</text>${[r.production,r.independent].map((v,j)=>`<rect x="${180+j*510}" y="${y}" width="465" height="85" fill="rgb(${rgb(v.spectrum,physical.lux).join(',')})"/><text x="${180+j*510}" y="${y+108}" font-size="14">Y ${v.color.luminanceCdPerM2.toFixed(1)}${j?` +/- ${r.independent.luminanceHalfWidth95.toFixed(1)}`:''}; R/B ${v.color.redBlueRatio.toFixed(3)}</text>`).join('')}<text x="180" y="${y+132}" font-size="14">Production brightness excess: ${(100*r.relativeLuminanceExcess).toFixed(2)}%; additional stage excess ${r.excessAddedByStage.luminance.toFixed(1)} cd/m2</text>`;}).join('')}<text x="25" y="790" font-size="14">libRadtran all-order endpoint Y ${external.color.luminanceCdPerM2.toFixed(1)} +/- ${external.luminanceHalfWidth95.toFixed(1)} cd/m2.</text><text x="25" y="820" font-size="13">Scientific swatches; +/- is sampling95. Stage differences retain nonlinear production reconstruction, not exact isolated production orders.</text></g></svg>`;
  const spectraHeight=1210,spectra=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${spectraHeight}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="25" y="32" font-size="24">Toronto horizon: cumulative spectral radiance and signed excess</text><text x="25" y="59" font-size="14">Magenta: production. Green: independent. Right: production minus independent; different vertical scales per panel.</text>${rows.map((r,i)=>{const y=105+i*255;return `<text x="25" y="${y-12}" font-size="18">N1-${r.order}</text>${panel([{s:r.production.spectrum,color:'#b22561'},{s:r.independent.spectrum,color:'#20834d'}],85,y,460,175)}${panel([{s:r.difference,color:'#9b4a0b'}],705,y,460,175)}<text x="85" y="${y+218}" font-size="12">W m^-2 sr^-1 nm^-1</text><text x="705" y="${y+218}" font-size="12">Signed excess, W m^-2 sr^-1 nm^-1</text>`;}).join('')}<text x="25" y="1170" font-size="13">Retained analysis includes paired sampling intervals and Q30/Q60/Q120 view controls. No new transport or libRadtran solve.</text></g></svg>`;
  await render(run,[{name:'comparison',svg:comparison,width,height},{name:'spectra',svg:spectra,width,height:spectraHeight}]);
  console.log(JSON.stringify(rows.map(r=>({order:r.order,productionY:r.production.color.luminanceCdPerM2,independentY:r.independent.color.luminanceCdPerM2,independent95:r.independent.luminanceHalfWidth95,excess:100*r.relativeLuminanceExcess,stageExcess:r.excessAddedByStage.luminance}))));
 }catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}
await main();
