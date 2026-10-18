import {DistantSunSharedCacheCubicLookup as lookup} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheCubicLookup.js';
import DistantSunSharedCache from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCache.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as domain} from '../../../src/algorithm32/sampling-domains/index.js';
import {outgoingStencil,solarCubic} from '../numerics/math.js';
import {warp} from '../outgoing-focus/geometry.mjs';

/** Reject a failed numerical/GL proof. @param {unknown} condition @param {string} message @returns {asserts condition} */
function check(condition,message){if(!condition)throw Error(message);}

/** Exercise actual transformed facade functions on real packed cumulative builder values.
 * @param {Float32Array[]} packets @param {any[]} slots @param {number} k @param {number} solarZenithDegrees
 * CPU reference uses
 * the independent numerical stencil/warp/Hermite implementation. @returns {Promise<any>}
 */
export async function packetProof(packets,slots,k,solarZenithDegrees){
 const gl=document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance'});check(gl,'GPU proof context missing');
 const owned=[],shaders=[];let program,buffer,fb;try{
 check(gl.getExtension('EXT_color_buffer_float'),'Float framebuffer missing');
 const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));check(!/swiftshader|llvmpipe/i.test(renderer),'Hardware GPU required');
 // Obtain the exact coordinate function emitted by the scene facade, without allocating a facade.
 const owner=Object.create(DistantSunSharedCache.prototype);owner._frame={solarInterpolation:'monotone-cubic',snapshot:{}};
 const functions=owner.createShaderContribution().functions[0].code;
 check(typeof functions==='string','Facade source contract missing');
 const start=functions.indexOf('vec3 distantSceneDirectionCoordinate(vec3 direction) {'),end=functions.indexOf('\nSpectralValue sampleCumulative',start);
 check(start>=0&&end>start,'Coordinate source missing');const coordinate=functions.slice(start,end);
 const zc=Math.max(0,Math.min(179,solarZenithDegrees-.5)),lower=Math.min(Math.floor(zc),178),rows=[zc],rowIndices=[...new Set(Array.from({length:4},(_,i)=>Math.max(0,Math.min(179,lower+i-1))))];
 const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[1,1,1],[1,-1,0],[.91,.12,.4],[-.1,.04,.995]].map(d=>d.map(v=>v/Math.hypot(...d))),queries=rows.flatMap(z=>dirs.map(d=>[...d,z]));
 const actualRows=new Map();
 for(const z of rowIndices){let found=null;for(let b=0;b<slots.length;b++){const row=slots[b].block.coordinates.findIndex(([alt,zenith])=>alt===0&&zenith===z);if(row>=0){found=packets[b].slice(row*27*648*4,(row+1)*27*648*4);break;}}check(found,'Required observer row absent from actual packets');actualRows.set(z,found);}
 const vertex='#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}';
 const fragment=`#version 300 es
precision highp float;precision highp int;precision highp sampler2DArray;precision highp usampler2D;
uniform sampler2DArray uDistantSunSharedPackets;uniform usampler2D uDistantSunSharedCoordinates;
uniform sampler2D queries;uniform float uH62WarpK;uniform int h62Plane;out vec4 outputValue;
${lookup.createShaderSource()}\n${coordinate}
void main(){vec4 q=texelFetch(queries,ivec2(int(gl_FragCoord.x),0),0);int lower=min(int(floor(q.w)),178);vec3 coordinates[4];for(int t=0;t<4;t++)coordinates[t]=h62Coordinate(q.xyz,clamp(lower+t-1,0,179));bool available;outputValue=distantCubicDensity(0,coordinates,q.w,h62Plane,available);if(!available)outputValue=vec4(-1);}`;
 /** @param {number} kind @param {string} source */
 function shader(kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);check(gl.getShaderParameter(s,gl.COMPILE_STATUS),gl.getShaderInfoLog(s));shaders.push(s);return s;}
 program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);check(gl.getProgramParameter(program,gl.LINK_STATUS),gl.getProgramInfoLog(program));gl.useProgram(program);
 const height=rowIndices.length*27,values=new Float32Array(648*height*4);rowIndices.forEach((z,i)=>values.set(actualRows.get(z),i*27*648*4));
 /** Read the exact component of an actual packed builder row. @param {number} z @param {number} logical @param {number} c @param {number} plane */
 function value(z,logical,c,plane){const face=Math.floor(logical/729),y=Math.floor((logical%729)/27),x=logical%27;return actualRows.get(z)[(y*648+plane*162+face*27+x)*4+c];}
 /** @param {number} unit @param {number} target @returns {WebGLTexture} */
 function texture(unit,target){gl.activeTexture(gl.TEXTURE0+unit);const t=gl.createTexture();owned.push(t);gl.bindTexture(target,t);gl.texParameteri(target,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(target,gl.TEXTURE_MAG_FILTER,gl.NEAREST);return t;}
 texture(0,gl.TEXTURE_2D_ARRAY);gl.texImage3D(gl.TEXTURE_2D_ARRAY,0,gl.RGBA32F,648,height,1,0,gl.RGBA,gl.FLOAT,values);gl.uniform1i(gl.getUniformLocation(program,'uDistantSunSharedPackets'),0);
 texture(1,gl.TEXTURE_2D);const addresses=new Uint16Array(360).fill(65535);rowIndices.forEach((z,i)=>{addresses[z*2]=0;addresses[z*2+1]=i;});gl.texImage2D(gl.TEXTURE_2D,0,gl.RG16UI,180,1,0,gl.RG_INTEGER,gl.UNSIGNED_SHORT,addresses);gl.uniform1i(gl.getUniformLocation(program,'uDistantSunSharedCoordinates'),1);
 texture(2,gl.TEXTURE_2D);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,queries.length,1,0,gl.RGBA,gl.FLOAT,new Float32Array(queries.flat()));gl.uniform1i(gl.getUniformLocation(program,'queries'),2);
 const result=texture(3,gl.TEXTURE_2D);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,queries.length,1,0,gl.RGBA,gl.FLOAT,null);fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,result,0);check(gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE,'Incomplete proof target');gl.viewport(0,0,queries.length,1);
 const reports=[];
 for(const plane of [0,1,2,3]){gl.uniform1i(gl.getUniformLocation(program,'h62Plane'),plane);gl.uniform1f(gl.getUniformLocation(program,'uH62WarpK'),k);gl.drawArrays(gl.TRIANGLES,0,3);const actual=new Float32Array(queries.length*4);gl.readPixels(0,0,queries.length,1,gl.RGBA,gl.FLOAT,actual);let maximumRelative=0,maximumAbsolute=0;
 for(let i=0;i<queries.length;i++){const q=queries[i],lower=Math.min(Math.floor(q[3]),178),fraction=q[3]-lower;for(let c=0;c<4;c++){const knots=[];for(let t=0;t<4;t++){const z=Math.max(0,Math.min(179,lower+t-1)),theta=(z+.5)*Math.PI/180,d=warp(q.slice(0,3),[Math.sin(theta),0,Math.cos(theta)],1/k),stencil=outgoingStencil([d[0],d[1],d[2]],27);knots.push(stencil.indices.reduce((s,index,j)=>s+stencil.weights[j]*value(z,index,c,plane),0));}const expected=solarCubic(lower===0?undefined:knots[0],knots[1],knots[2],lower===178?undefined:knots[3],fraction),error=Math.abs(expected-actual[i*4+c]);maximumAbsolute=Math.max(maximumAbsolute,error);maximumRelative=Math.max(maximumRelative,error/Math.max(1e-12,Math.abs(expected)));}}
 check(maximumRelative<5e-6,'Scene lookup CPU/GPU replay exceeds5e-6: '+maximumRelative);reports.push({k,plane,maximumRelative,maximumAbsolute,queries:queries.length,components:4});}
 check(gl.getError()===gl.NO_ERROR,'GPU proof error');return{accepted:true,renderer,reports,rows,directions:dirs,source:'Actual transformed scene helpers and exact packed real builder rows at observer altitude; all four RGBA planes, CPU independent warp/stencil/Hermite reference.'};
 }finally{for(const t of owned)gl.deleteTexture(t);for(const s of shaders)gl.deleteShader(s);if(program)gl.deleteProgram(program);if(fb)gl.deleteFramebuffer(fb);gl.getExtension('WEBGL_lose_context')?.loseContext();}
}
