import assert from 'node:assert/strict';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {checkedAbsolute,identity,readRepository,repositoryRoot} from '../io/files.mjs';
// Consume the read-only paper renderer through an explicit boundary; do not
// extend its older inferred literal-key Map types into this experiment project.
const figureModuleUrl=new URL('../../../scripts/experiments/b1-directional-sky-radiance/figure5.js',import.meta.url).href;
/** @type {B1FigureApi} */
const {FIGURE5_SCENES,FIGURE5_ERROR_COLORS,loadPublishedFigure5Panels,renderAlgorithm32Figure5Panel,renderFigure5ComparisonSvg}=await import(figureModuleUrl);
const oracleModuleUrl=new URL('../../../scripts/experiments/b1-directional-sky-radiance/published-oracle.js',import.meta.url).href;
/** @type {{PUBLISHED_RMSE_ORACLE:{perTime:Record<string,Record<string,number>>}}} */
const {PUBLISHED_RMSE_ORACLE}=await import(oracleModuleUrl);
for(const f of [loadPublishedFigure5Panels,renderAlgorithm32Figure5Panel,renderFigure5ComparisonSvg])assert.equal(typeof f,'function');

/** Escape authored labels for standalone SVG. @param {unknown} v @returns {string} */
function xml(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}

/** Common-scale progress or RMSE bars. No color-to-radiance conversion is applied.
 * @param {readonly B1ScalarRow[]} rows @param {string} title @param {string} [units]
 * @returns {string} Standalone SVG.
 */
export function scalarFigure(rows,title,units='Spectral radiance W m^-2 sr^-1 nm^-1'){
 const width=1050,height=130+rows.length*28,max=Math.max(1e-20,...rows.flatMap(r=>[r.baseline??0,r.candidate??0]));
 const out=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#202124"><text x="20" y="30" font-size="18">${xml(title)}</text><text x="20" y="55" font-size="13">${xml(units)}</text><text x="20" y="79" fill="#4c78a8">Paper baseline40</text><text x="190" y="79" fill="#e07b32">Normalized60</text>`];
 rows.forEach((r,i)=>{const y=100+i*28;out.push(`<text x="20" y="${y+12}" font-size="12">${xml(r.label)}</text>`);for(const [j,v] of [r.baseline,r.candidate].entries()){if(v===undefined)continue;out.push(`<rect x="110" y="${y+j*10}" width="${650*v/max}" height="8" fill="${j?'#e07b32':'#4c78a8'}"/><text x="${790+j*120}" y="${y+12}" font-size="12">${v.toFixed(6)}</text>`);}});
 return out.join('')+'</g></svg>';
}

/** Reorder the authenticated canonical boundary to the paper renderer's X/Y grid.
 * @param {DialAnalysisBoundary} b @param {string} time @returns {number[][][]}
 */
function grid(b,time){const t=b.times.indexOf(time);assert.ok(t>=0);assert.equal(b.channels.length,40);assert.equal(b.rayIndices.length,81);return Array.from({length:9},(_,x)=>Array.from({length:9},(_,y)=>Array.from({length:40},(_,c)=>b.values[(t*81+y*9+x)*40+c])));}

/** Publish interval scores and paper Figure5 domes, then rasterize the retained SVGs.
 * Published images are authenticated, unchanged PDF image objects; locally rendered
 * domes use measured band-integrated relative error, not a display sky color.
 * @param {DialRun} run @param {DialAnalysisBoundary} baseline @param {DialAnalysisBoundary} candidate
 * @param {DialAnalysisBoundary} measured @param {DialBoundaryScore} baseScore @param {DialBoundaryScore} candScore
 * @returns {Promise<void>} All artifacts retained; the browser closes on failure too.
 */
export async function writePaperFigures(run,baseline,candidate,measured,baseScore,candScore){
 const published=loadPublishedFigure5Panels();
 const inputs=published.map(p=>{const name=path.relative(repositoryRoot,p.path).replaceAll('\\','/');const r=identity(name);assert.equal(r.sha256,p.sha256);readRepository(name,r);return r;});
 inputs.push(...['figure5.js','benchmark.js','published-oracle.js'].map(f=>identity('scripts/experiments/b1-directional-sky-radiance/'+f)));
 const provenance={parents:[baseline.sourceIdentity,candidate.sourceIdentity,measured.sourceIdentity,...inputs],operation:'Original Figure5 spectral RMSE and band-integrated relative-error transform, same spherical interpolation, palette, sample and Sun markers.',parameters:{scoreChannels:[0,30],computedChannels:[0,39],candidate:'Normalized60',publishedPanels:'Unchanged authenticated Figure5 PDF image objects'}};
 run.write('figure-inputs.json',inputs,provenance);
 const headers=['time','baseline40_RMSE_mW','normalized60_RMSE_mW','delta_mW','change_percent'];
 const lines=baseScore.conditions.map((b,i)=>{const c=candScore.conditions[i];assert.equal(b.time,c.time);return [b.time,b.rmseMilliwatt,c.rmseMilliwatt,c.rmseMilliwatt-b.rmseMilliwatt,100*(c.rmseMilliwatt/b.rmseMilliwatt-1)].join('\t');});
 lines.push(['aggregate',baseScore.aggregateRmseMilliwatt,candScore.aggregateRmseMilliwatt,candScore.aggregateRmseMilliwatt-baseScore.aggregateRmseMilliwatt,100*(candScore.aggregateRmseMilliwatt/baseScore.aggregateRmseMilliwatt-1)].join('\t'));
 run.write('interval-rmse.tsv',headers.join('\t')+'\n'+lines.join('\n')+'\n',provenance);
 const sets=[baseline,candidate].map((b,k)=>FIGURE5_SCENES.map(scene=>{const p=renderAlgorithm32Figure5Panel(grid(b,scene.time),grid(measured,scene.time),scene);const score=(k?candScore:baseScore).conditions.find(c=>c.time===scene.time);assert.ok(Math.abs(p.score.rmseMilliwatt-score.rmseMilliwatt)<1e-10,'Figure score differs from canonical interval score.');run.write(`${k?'candidate':'baseline'}-${scene.fileTime}.png`,p.png,provenance);return p;}));
 const full=renderFigure5ComparisonSvg(published,sets[1],{candidateLabel:'Normalized60',...provenance});
 const width=1240,height=1130;
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>B1 Figure5: paper models, baseline40, normalized60</title><metadata>${xml(JSON.stringify(provenance))}</metadata><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#202124"><text x="20" y="32" font-size="23">B1 dome comparison: baseline40 versus normalized60</text><text x="20" y="57" font-size="14">Color: band-integrated relative error. Labels: spectral RMSE (mW m^-2 sr^-1 nm^-1).</text>`];
 ['Bruneton (paper)','libRadtran (paper)','Paper baseline40','Normalized60'].forEach((s,i)=>parts.push(`<text x="${230+i*280}" y="90" text-anchor="middle" font-size="17">${s}</text>`));
 FIGURE5_SCENES.forEach((scene,r)=>{const y=110+r*310;parts.push(`<text x="12" y="${y+115}" font-size="15">${scene.time}</text><text x="12" y="${y+137}" font-size="13">Z ${scene.roundedSolarZenithDegrees}°</text>`);for(let c=0;c<4;c++){const p=c<2?published.find(p=>p.model===(c?'libradtran':'bruneton')&&p.time===scene.time):sets[c-2][r];assert.ok(p);const rmse=c<2?PUBLISHED_RMSE_ORACLE.perTime[scene.time][c?'libradtran':'bruneton']:sets[c-2][r].score.rmseMilliwatt;parts.push(`<image x="${102+c*280}" y="${y}" width="256" height="256" href="data:image/png;base64,${p.png.toString('base64')}"/><text x="${230+c*280}" y="${y+278}" text-anchor="middle" font-size="15">${rmse.toFixed(c<2?1:3)}</text>`);}});
 FIGURE5_ERROR_COLORS.forEach(([r,g,b],i)=>parts.push(`<rect x="${230+i*20}" y="1047" width="20" height="16" fill="rgb(${r},${g},${b})"/>`));
 for(let v=-200;v<=200;v+=50)parts.push(`<text x="${230+(v+200)/400*820}" y="1082" font-size="12" text-anchor="middle">${v}%</text>`);
 parts.push('<text x="20" y="1110" font-size="12">Published model panels are original Figure5 images. Candidate and baseline use the same fixed paper controls and measured directions.</text></g></svg>');
 const figures=[{name:'domes',svg:full},{name:'dome-comparison',svg:parts.join('')},{name:'interval-rmse',svg:scalarFigure(baseScore.conditions.map((b,i)=>({label:b.time,baseline:b.rmseMilliwatt,candidate:candScore.conditions[i].rmseMilliwatt})),'B1 paper RMSE by time: baseline40 versus normalized60','RMSE mW m^-2 sr^-1 nm^-1; lower is better')}];
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'figures'),false),args:['--enable-gpu','--use-angle=d3d11']});
  const page=await browser.newPage();
  for(const f of figures){run.progress('render',f.name);const svg=run.write(f.name+'.svg',f.svg,provenance);const w=Number(/<svg[^>]* width="(\d+)"/.exec(f.svg)?.[1]),h=Number(/<svg[^>]* height="(\d+)"/.exec(f.svg)?.[1]);assert.ok(w>0&&h>0);await page.setViewport({width:w,height:h,deviceScaleFactor:1});await page.setContent('<style>body{margin:0}</style>'+f.svg);await page.evaluate(async()=>{await Promise.all(Array.from(document.querySelectorAll('image')).map(el=>new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=reject;im.src=el.getAttribute('href');})));});run.write(f.name+'.png',Buffer.from(await page.screenshot({type:'png'})),{parents:[svg],operation:'Rasterize the retained standalone scientific SVG with Chrome at device scale1.',parameters:{width:w,height:h,browser:await browser.version()}});}
  run.write('figure-verification.json',{intervalCount:17,sampleCount:candScore.sampleCount,figureScoreParity:true,publishedPanelHashesVerified:27,browser:await browser.version(),node:process.version},provenance);
 }finally{await browser?.close();}
}
