import assert from 'node:assert/strict';
import {fragment as sessionFragment,execute as sessionExecute} from './gpu-session.mjs';
import {baseline} from './refinement-common.mjs';
import {rgbWeights} from './color.mjs';

/** One keyed physical kernel; variable spectra/heights are actual uniforms. */
export function fragment(){
 const m=baseline.medium,view={id:'horizon',azimuthMinimum:150,azimuthMaximum:210,elevationMinimum:.05,elevationMaximum:20};let s=sessionFragment(m,rgbWeights,view);
 s=s.replace(/const float M\[15\]=float\[\]\([^;]+;/,'uniform float M[15];\nuniform float aerosolHeight;\nuniform int sunField;\nuniform vec3 sunVertical;');
 s=s.replaceAll(`vec2(${m.rayleighHeight}.0,${m.mieHeight}.0)`,`vec2(${m.rayleighHeight}.0,aerosolHeight)`);
 const needle='vec3 v=probe==1?probeDirection:vec3(sin(a)*cos(e),-cos(a)*cos(e),sin(e));';assert.ok(s.includes(needle));s=s.replace(needle,needle+'\n if(probe==0&&sunField==1)v=normalize(SUN+tan(radians(12.0))*(2.0*uv.x-1.0)*vec3(1,0,0)+tan(radians(8.0))*(2.0*uv.y-1.0)*sunVertical);');return s;
}
const needle='const {gl,program}=state,p=input.parameters,v=input.view;';let body=sessionExecute.toString();assert.ok(body.includes(needle));body=body.replace(needle,needle+`
 gl.uniform1fv(gl.getUniformLocation(program,'M'),Float32Array.from(input.medium.mie));
 gl.uniform1f(gl.getUniformLocation(program,'aerosolHeight'),input.medium.mieHeight);
 gl.uniform1i(gl.getUniformLocation(program,'sunField'),v.id==='sun'?1:0);
 const solar=input.medium.sourceDirection,up=[0,0,1].map((x,i)=>x-solar[2]*solar[i]),norm=Math.hypot(...up);
 gl.uniform3fv(gl.getUniformLocation(program,'sunVertical'),Float32Array.from(up.map(x=>x/norm)));
`);
/** Serialized browser callback derived from authenticated uniform session. @type {(input:any)=>Promise<any>} */
export const execute=Function('return ('+body+');')();
