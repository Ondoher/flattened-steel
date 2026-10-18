import {setTorontoMaterial} from '../distant-horizon/toronto-phase.js';
import {plan} from './geometry.mjs';
import {sampleDensity,integrateDensity} from '../numerics/view.js';

/** Compile one disposable observation shader. @param {WebGL2RenderingContext} gl @param {string} fragment @returns {WebGLProgram} */
function program(gl,fragment){const p=gl.createProgram(),ss=[];try{for(const [kind,source]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}'],[gl.FRAGMENT_SHADER,fragment]]){const s=gl.createShader(Number(kind));ss.push(s);gl.shaderSource(s,String(source));gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}catch(e){gl.deleteProgram(p);throw e;}finally{ss.forEach(s=>gl.deleteShader(s));}}

/** Complete-domain compiler with same-count outgoing warp and live pure/cumulative queries.
 * @param {any} control @param {any} compiler @returns {Promise<any>}
 */
export async function execute(control,compiler){
 setTorontoMaterial(control.material); const support=plan(control),canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{powerPreference:'high-performance',antialias:false});if(!gl)throw new Error('WebGL2 required');
 const ext=gl.getExtension('WEBGL_debug_renderer_info'),renderer=gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);if(/swiftshader|llvmpipe/i.test(renderer))throw new Error('Hardware GPU required');
 const frame=gl.createFramebuffer(),vao=gl.createVertexArray(),owned=[],programs=[];let acc=[],queryProgram,queryTexture,qw,qh,channel,current=[],cumulative=[],nativeReport;
 /** @param {number} w @param {number} h @param {Float32Array|null} data @param {boolean} red @returns {WebGLTexture} */
 function texture(w,h,data=null,red=false){const t=gl.createTexture();owned.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,red?gl.R32F:gl.RGBA32F,w,h,0,red?gl.RED:gl.RGBA,gl.FLOAT,data);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);return t;}
 /** @param {WebGLProgram} p @param {string} name @param {number} unit @param {WebGLTexture} t */
 function bind(p,name,unit,t){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(gl.getUniformLocation(p,name),unit);}
 /** @param {WebGLProgram} p @param {WebGLTexture} t @param {number} w @param {number} h */
 function target(p,t,w,h){gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Observer framebuffer');gl.viewport(0,0,w,h);gl.useProgram(p);gl.bindVertexArray(vao);}
 const sum=program(gl,'#version 300 es\nprecision highp float;precision highp int;uniform sampler2D uA,uB;uniform bool uFirst;out vec4 value;void main(){ivec2 p=ivec2(gl_FragCoord.xy);float b=texelFetch(uB,p,0).r;value=vec4(uFirst?b:texelFetch(uA,p,0).r+b,0,0,0);}');programs.push(sum);
 try{
 qw=Math.min(8192,gl.getParameter(gl.MAX_TEXTURE_SIZE));qh=Math.ceil(support.queries.length/qw);const q=new Float32Array(qw*qh*4);support.queries.forEach((v,i)=>q.set(v,i*4));queryTexture=texture(qw,qh,q);const output=texture(qw,qh);
 globalThis['__h61Observe']=async({fieldId,resource,common})=>{
 const order=Number(fieldId.slice(1));if(!queryProgram){queryProgram=program(gl,`#version 300 es\nprecision highp float;precision highp int;uniform sampler2D uField,uQueries;${common}\nout vec4 value;void main(){vec4 q=texelFetch(uQueries,ivec2(gl_FragCoord.xy),0);value=vec4(sampleJDirection(uField,int(q.w),q.xyz),0,0,0);}`);programs.push(queryProgram);}
 /** @param {WebGLTexture} t @returns {number[]} */
 const view=t=>{target(queryProgram,output,qw,qh);bind(queryProgram,'uField',0,t);bind(queryProgram,'uQueries',1,queryTexture);gl.drawArrays(gl.TRIANGLES,0,3);const a=new Float32Array(qw*qh*4);gl.readPixels(0,0,qw,qh,gl.RGBA,gl.FLOAT,a);const values=Float32Array.from({length:support.queries.length},(_,i)=>a[i*4]);return support.rays.map(r=>integrateDensity(control.integrationSpec,channel,r,s=>sampleDensity(values,s,'monotone-cubic')));};
 current.push(view(resource.texture));
 if(control.mode==='n1'){cumulative.push(current[0]);throw new Error('H61_N1_COMPLETE');}
 if(!acc.length)acc=[texture(4374,8640,null,true),texture(4374,8640,null,true)];const dest=acc[(order-1)%2];target(sum,dest,4374,8640);bind(sum,'uA',0,acc[order%2]);bind(sum,'uB',1,resource.texture);gl.uniform1i(gl.getUniformLocation(sum,'uFirst'),order===1?1:0);gl.drawArrays(gl.TRIANGLES,0,3);cumulative.push(view(dest));
 if(gl.getError()!==gl.NO_ERROR)throw new Error('Observer GPU error');await globalThis['__h61Progress']('channel '+channel+' observed '+fieldId);
 };
 for(channel of control.channels){const started=performance.now();current=[];cumulative=[];nativeReport=null;try{nativeReport=await compiler.compileDistantSunSceneCacheWavelength({gl,buildRequest:{...control.request,transportSpec:{...control.request.transportSpec,atmosphere:{...control.request.transportSpec.atmosphere,mieSingleScatteringAlbedo:control.material.albedos[channel]}}},wavelengthIndex:channel,compileSceneCaches:false,reportProgress:async stage=>{if(stage==='programs-compiled'||stage.endsWith(':180/180'))await globalThis['__h61Progress']('channel '+channel+': '+stage);}});}catch(e){if(!(control.mode==='n1'&&String(e).includes('H61_N1_COMPLETE')&&current.length===1))throw e;}
 if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw new Error('Invalid final GPU state');
 await globalThis['__h61Channel']({channel,native:current,cumulative,report:nativeReport,milliseconds:performance.now()-started,extraAccumulatorBytes:control.mode==='n1'?0:2*4374*8640*4,queryCount:support.queries.length});await globalThis['__h61Progress']('channel '+channel+' complete');
 }
 return {renderer,queryCount:support.queries.length,rayCount:support.rays.length,witnesses:support.rays.map(r=>r.witness)};
 }finally{globalThis['__h61Observe']=null;programs.forEach(p=>gl.deleteProgram(p));owned.forEach(t=>gl.deleteTexture(t));gl.deleteVertexArray(vao);gl.deleteFramebuffer(frame);gl.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();}
}
