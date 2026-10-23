import puppeteer from 'puppeteer';
import {read} from './io.mjs';
const marker='tmp/experiments/sky-aerosol-properties/scratch/00000-property-screen/DevToolsActivePort';
const [port,endpoint]=read(marker).toString().trim().split(/\r?\n/);
const browser=await puppeteer.connect({browserWSEndpoint:`ws://127.0.0.1:${port}${endpoint}`});
console.log('Closing only the experiment-owned pilot browser after preserving completed spectra and first images; the runner will seal the interrupted attempt.');
await browser.close();
