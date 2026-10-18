import assert from 'node:assert/strict';
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {checkedAbsolute,resolveRepository} from '../io/files.mjs';

/** Reject another experiment-owned GPU/legacy figure profile before GPU launch. @param {string} owner @returns {void} */
export function assertIdleGpu(owner){const root=resolveRepository('tmp/experiments/sky-accuracy-dials/scratch');for(const e of readdirSync(root,{withFileTypes:true})){if(!e.isDirectory())continue;const dir=checkedAbsolute(path.join(root,e.name)),file=path.join(dir,'owner.json');if(!existsSync(file))continue;const facts=JSON.parse(readFileSync(checkedAbsolute(file),'utf8'));if(facts.owner===owner)continue;assert.ok(!['gpu','figures'].some(name=>existsSync(path.join(dir,name))),`Another owned GPU/legacy figure profile is active: ${facts.owner}`);}}
/** CPU rasterization of scientific SVG plots; never competes with numerical GPU work. @param {DialRun} run @param {{name:string,svg:string,width:number,height:number}[]} figures @returns {Promise<void>} */
export async function render(run,figures){let browser;try{browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'charts-cpu'),false),protocolTimeout:45000,args:['--disable-gpu']});const page=await browser.newPage();for(const f of figures){run.progress('render',f.name);run.write(f.name+'.svg',f.svg);await page.setViewport({width:f.width,height:f.height,deviceScaleFactor:1});await page.setContent('<style>body{margin:0}</style>'+f.svg);run.write(f.name+'.png',Buffer.from(await page.screenshot({type:'png'})));}run.write('render-tool.json',{node:process.version,browser:await browser.version(),mode:'CPU2D SVG rasterization; GPU reserved for atmospheric computation.'});}finally{await browser?.close();}}
