import assert from 'node:assert/strict';
import {shader,resident} from '../interior-illumination/gpu.mjs';

/** Keep the independent direct-L1 integration operation, with actual receiver
 * height carried in each query instead of one uniform height. Only the paper
 * analytic CS material is supported by this explicit adapter.
 * @returns {string} */
export function variableHeightShader(){let source=shader();assert.ok(source.includes('pm=q.w;'));source=source.replace('pm=q.w;','pm=3.0*(1.0-.7*.7)*(1.0+mu*mu)/(8.0*3.141592653589793*(2.0+.7*.7)*pow(1.0+.7*.7-1.4*clamp(mu,-1.0,1.0),1.5));');assert.ok(source.includes('shell.z'));return source.replaceAll('shell.z','q.w');}

/** Bounded dispatch, every query carries its actual source-probe altitude.
 * @param {any} page @param {any} run @param {any} p @param {number[]} queries
 * @param {number} nv @param {number} nc @returns {Promise<any>} */
export async function variableHeightLight(page,run,p,queries,nv,nc){
 assert.equal(p.table,null);const values=[],started=Date.now();for(let at=0;at<queries.length/4;at+=256){run.progress('cache-free-variable-L1',`${nv}/${nc} query${at}/${queries.length/4}`);const got=await page.evaluate(resident,{action:'draw',p,queries:queries.slice(at*4,(at+256)*4),nv,nc});assert.ok(got.flat().every(x=>Number.isFinite(x)&&x>=0));values.push(...got);}return {values,nv,nc,milliseconds:Date.now()-started};
}
