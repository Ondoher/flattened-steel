import assert from 'node:assert/strict';
import {kernel} from '../distant-horizon/toronto-orders.mjs';
import {gauss} from '../continuation/direct-solver/math.mjs';

/** H67's continuous L1 shader, retaining64/128 math and adding an optional256 view control.
 * @param {any} table @param {number} ssa @returns {string} Independent, cache-free GLSL.
 */
export function shader(table,ssa){
 let base=kernel(table,ssa).shader;const start=base.lastIndexOf('void main(){');assert.ok(start>0);base=base.slice(0,start);
 const q=gauss(256),array=(name,x)=>`const float ${name}[256]=float[](${x.map(v=>v.toExponential(16)).join(',')});`;
 return base+array('X256',q.nodes)+array('W256',q.weights)+`
uniform sampler2D queries;uniform int viewQuadrature,queryCount;uniform float initialAltitude;
float initialEnd(float mu){float r=R+initialAltitude,b=r*mu,c=initialAltitude*(2.0*R+initialAltitude),d=b*b-c;if(mu<0.0&&d>=0.0)return max(0.0,c/(-b+sqrt(d)));float ct=(initialAltitude-60000.0)*(2.0*R+initialAltitude+60000.0),s=sqrt(max(0.0,b*b-ct));return max(0.0,b>=0.0?-ct/(b+s):-b+s);}
void main(){int i=int(gl_FragCoord.x)+256*int(gl_FragCoord.y);o0=vec4(0);o1=o0;o2=o0;o3=o0;if(i>=queryCount)return;vec4 query=texelFetch(queries,ivec2(i%256,i/256),0);vec3 v=query.xyz;float end=initialEnd(query.w);if(end<=0.0)return;float q=log(1.0+end/1000.0);vec2 sum=vec2(0);for(int j=0;j<viewQuadrature;j++){float u=viewQuadrature==64?X64[j]:(viewQuadrature==256?X256[j]:X128[j]),w=viewQuadrature==64?W64[j]:(viewQuadrature==256?W256[j]:W128[j]),t=1000.0*(exp(u*q)-1.0);vec3 x=origin+t*v;vec2 b=density(x);vec4 sun=sunlight(x);sum+=w*(t+1000.0)*q*exp(-tau(origin,v,t))*sun.w*b*vec2(1.0,W)*phases(dot(v,sun.xyz));}o0=vec4(sum,0,0);}
`;
}
