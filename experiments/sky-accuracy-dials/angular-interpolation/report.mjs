import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,readRepository,verifyRun,identity} from '../io/files.mjs';
import {color,rgb} from '../paper-rays/color.mjs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {checkedAbsolute} from '../io/files.mjs';

/** Escape an authored SVG label. @param {unknown} value @returns {string} */
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;');

/** Retain compact honest screen figures or full-spectrum swatches, without rerunning a solver.
 * @returns {Promise<void>}
 */
async function main(){
 const roots=process.argv.slice(2);assert.ok(roots.length);
 const reference='tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report';
 const comparison=JSON.parse(readRepository(reference+'/comparison.json').toString());
 const pureReference=JSON.parse(readRepository(reference+'/pure-orders.json').toString());
 const direct=JSON.parse(readRepository('tmp/experiments/sky-accuracy-dials/runs/00366-h58-independent/direct-n1.json').toString());
 const parents=[verifyRun(reference),identity('tmp/experiments/sky-accuracy-dials/runs/00366-h58-independent/direct-n1.json'),...roots.map(r=>verifyRun(r))];
 const cases=roots.map(root=>{const control=JSON.parse(readRepository(root+'/control.json').toString());return {root,control,channels:control.channels.map(c=>JSON.parse(gunzipSync(readRepository(root+`/channel-${String(c).padStart(2,'0')}.json.gz`)).toString()))};});
 const run=createRun('h59-report',{parents,operation:'Reduce paired angular controls and render signed relative changes, exact N1-reference residuals and optional all40-band common-p2 swatches. No solver run and no invented spectral interpolation.',parameters:{roots,reference,display:'Shared Direct40 CIE and fixed paper p2; screen bands use false-color error plots only.'}});let failure=null;
 let browser;
 try{
 const images=[];
 const rows=[];
 for(const c of cases)for(const d of c.channels)for(let ray=0;ray<3;ray++)for(let order=0;order<4;order++){
 const r=comparison.rows.find(x=>x.ray===ray&&x.order===order+1&&x.method==='Independent'),n1=direct.find(x=>x.channel===d.channel&&x.ray===comparison.rays[ray].id);
 const referenceValue=order===0?n1.N1:pureReference.find(x=>x.ray===ray&&x.order===order+1&&x.method==='Independent').spectrum[d.channel];
 const base=d.native[order][ray],bypass=d.direct[order][ray];rows.push({root:c.root,channel:d.channel,ray,order:order+1,base,bypass,reference:referenceValue,relativeChange:100*(bypass/base-1),baseError:base-referenceValue,bypassError:bypass-referenceValue,residualReduction:1-Math.abs(bypass-referenceValue)/Math.abs(base-referenceValue)});
 }
 run.write('angular-effects.json',rows);
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="${120+cases.reduce((s,c)=>s+c.channels.length,0)*100}"><rect width="100%" height="100%" fill="#fafafa"/><g font-family="sans-serif" fill="#222"><text x="24" y="30" font-size="21">H59 outgoing-angle interpolation: signed readout changes</text><text x="24" y="55" font-size="14">False-color diagnostic; direct angle minus native lookup. Physical inputs and anchors fixed.</text>`;
 let y=94;
 for(const c of cases)for(const d of c.channels){svg+=`<text x="24" y="${y}" font-size="13">${escape(c.root.split('/').at(-1))}: ${comparison.centers[d.channel]} nm</text>`;for(let ray=0;ray<3;ray++)for(let order=1;order<=4;order++){const r=rows.find(r=>r.root===c.root&&r.channel===d.channel&&r.ray===ray&&r.order===order),x=310+ray*250+(order-1)*60;svg+=`<rect x="${x}" y="${y-18}" width="56" height="48" fill="${r.relativeChange>=0?'#d6ebff':'#ffe0d5'}"/><text x="${x+3}" y="${y-3}" font-size="10">R${ray+1} N${order}</text><text x="${x+3}" y="${y+15}" font-size="11">${r.relativeChange.toFixed(3)}%</text>`;}y+=100;}
 svg+='</g></svg>';run.write('angular-effects.svg',svg);images.push({name:'angular-effects',svg});
 const spectral=cases.filter(c=>c.channels.length===40);
 if(spectral.length){
 let sw=`<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="${100+spectral.length*3*150}"><rect width="100%" height="100%" fill="#fafafa"/><g font-family="sans-serif" fill="#222"><text x="20" y="28" font-size="20">H59: fixed common CIE / production p2, all40 wavelengths</text><text x="20" y="52">Native N1 | Direct-angle N1 | Native cumulative N4 | Frozen-increment N4</text>`;let sy=80;const photometry=[];
 for(const c of spectral)for(let ray=0;ray<3;ray++){
 const spectra=[c.channels.map(d=>d.native[0][ray]),c.channels.map(d=>d.direct[0][ray]),c.channels.map(d=>d.cumulative[3][ray]),c.channels.map(d=>d.cumulative[3][ray]-d.cumulative[0][ray]+d.direct[0][ray])];
 sw+=`<text x="20" y="${sy+16}" font-size="12">${comparison.rays[ray].time} R${ray+1}</text>`;
 spectra.forEach((s,i)=>{const mapped=rgb(s,comparison.centers,comparison.lux),Y=color(s,comparison.centers).Y;sw+=`<rect x="${190+i*235}" y="${sy}" width="225" height="90" fill="rgb(${mapped.join(',')})"/><text x="${190+i*235}" y="${sy+110}" font-size="12">Y ${Y.toFixed(1)} cd/m²</text>`;photometry.push({root:c.root,ray,method:['nativeN1','directN1','nativeC4','frozenIncrementC4'][i],spectrum:s,Y,rgb:mapped});});sy+=150;
 }
 sw+='</g></svg>';run.write('swatches.svg',sw);images.push({name:'swatches',svg:sw});run.write('photometry.json',photometry);
 let sp='<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="850"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="24" y="25" font-size="20">N1 spectra: native blue, direct angle orange, dense reference black</text>';
 const first=spectral[0];for(let ray=0;ray<3;ray++){const sets=[first.channels.map(d=>d.native[0][ray]),first.channels.map(d=>d.direct[0][ray]),comparison.centers.map((_,ch)=>direct.find(d=>d.channel===ch&&d.ray===comparison.rays[ray].id).N1)],max=Math.max(...sets.flat())*1.05,y=65+ray*250;sp+=`<text x="24" y="${y}">${comparison.rays[ray].time}, ray ${ray+1}</text><path d="M70 ${y+15}V${y+205}H1050" fill="none" stroke="#999"/>`;sets.forEach((s,k)=>{sp+=`<polyline points="${s.map((v,i)=>`${70+i*980/39},${y+205-v/max*180}`).join(' ')}" fill="none" stroke="${['#3166b0','#e07321','#222'][k]}" stroke-width="2"/>`;});sp+=`<text x="70" y="${y+225}" font-size="12">360 nm</text><text x="980" y="${y+225}" font-size="12">818.25 nm</text>`;}sp+='</g></svg>';run.write('spectra.svg',sp);images.push({name:'spectra',svg:sp});
 }
 run.write('summary.json',{cases:cases.map(c=>({root:c.root,channels:c.control.channels,patch:c.control.patch})),nodeProofs:cases.map(c=>JSON.parse(readRepository(c.root+'/proof.json').toString())),interpretation:'Angular-only differences with original anchor interpolation. Pure higher-order references derived from matched cumulative independent estimates; N1 uses dense binary64. Higher-order uncertainty and grouping remainder remain in the parent references.'});
 browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'figures'),false)});const page=await browser.newPage();for(const image of images){const width=Number(/width="(\d+)"/.exec(image.svg)[1]),height=Number(/height="(\d+)"/.exec(image.svg)[1]);await page.setViewport({width,height,deviceScaleFactor:1});await page.setContent('<style>body{margin:0}</style>'+image.svg);run.write(image.name+'.png',Buffer.from(await page.screenshot({type:'png'})));run.progress('render','Captured '+image.name);}
 console.log(JSON.stringify({run:run.path,rows:rows.length,fullSpectrumCases:spectral.length}));
 }catch(e){failure=e;}finally{await browser?.close();run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);if(failure)throw failure;
}
await main();
