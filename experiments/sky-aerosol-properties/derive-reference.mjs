import {readFileSync,writeFileSync,lstatSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const repository=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
/** Read an ordinary repository file; reject aliases before consuming code. @param {string} name */
function read(name){const target=path.join(repository,name);let current=repository;for(const part of name.split('/')){current=path.join(current,part);if(lstatSync(current).isSymbolicLink()||realpathSync(current).toLowerCase()!==current.toLowerCase())throw Error('Aliased source');}return readFileSync(target,'utf8');}
let gauss=read('experiments/sky-accuracy-dials/continuation/direct-solver/math.mjs');
gauss=gauss.slice(0,gauss.indexOf('/** Direct binary64'));
gauss=gauss.replace('SkyDirectRule','AerosolRule').replace('count <= 256','count <= 512').replace('export function gauss(count) {','const rules=new Map();\nexport function gauss(count) {\n if(rules.has(count))return rules.get(count);');
gauss=gauss.replace('return {nodes, weights};','const result={nodes,weights};rules.set(count,result);return result;');
let math=read('experiments/sky-accuracy-dials/horizon-reference/math.mjs');
math=math.slice(math.indexOf('/** Euclidean'),math.indexOf('/** Conservative Student'));
math=math.replaceAll('HorizonReference','Aerosol');
writeFileSync(new URL('reference.mjs',import.meta.url),gauss+'\n'+math,{flag:'wx'});
let gpu=read('experiments/sky-accuracy-dials/distant-horizon/gpu.mjs');
gpu=gpu.replace("'../continuation/direct-solver/math.mjs'","'./reference.mjs'")
 .replaceAll('HorizonReferenceMedium','AerosolMedium').replaceAll('DistantAerosolGpuInput','AerosolGpuInput').replaceAll('DistantAerosolGpuResult','AerosolGpuResult')
 .replace('@returns {string} Complete','@param {AerosolView} view Angular sky field.\n * @returns {string} Complete')
 .replace('function fragment(m, rgb) {','function fragment(m, rgb, view) {')
 .replace('gauss(64),c=gauss(32)','gauss(96),c=gauss(64)')
 .replace('j<64','j<96').replace('j<32','j<64')
 .replace('float a=radians(150.0+60.0*uv.x),e=radians(0.05+24.95*uv.y);','float a=radians(${view.azimuthMinimum.toFixed(8)}+${(view.azimuthMaximum-view.azimuthMinimum).toFixed(8)}*uv.x),e=radians(${view.elevationMinimum.toFixed(8)}+${(view.elevationMaximum-view.elevationMinimum).toFixed(8)}*uv.y);')
 .replace('vec3 o=vec3(0,0,5);','vec3 o=vec3(0,0,${m.observerHeight.toFixed(8)});')
 .replace('for(const fraction of [1,0])','for(const fraction of [1])');
writeFileSync(new URL('gpu.mjs',import.meta.url),gpu,{flag:'wx'});
