import assert from 'node:assert/strict';
import {phases} from './common.mjs';
import {queryShader,queryUpload} from './query-plan-gpu.mjs';

/** Reuse the qualified positive interpolation equation over a band dimension.
 * Geometry is shared; amplitudes, active source phase and CPU support fallback
 * values remain specific to each actual wavelength. @returns {string} */
export function spectralQueryShader(){
 let source=queryShader();const replace=(from,to)=>{assert.equal(source.split(from).length,2);source=source.replace(from,to);};
 replace('uniform sampler2D planData,amplitudes;uniform int count;', 'uniform sampler2D planData,amplitudes,restorationData;uniform int count,amplitudeRows;int band;');
 replace('ivec2(i%256,i/256)', 'ivec2(i%256,i/256+band*amplitudeRows)');
 replace('void main(){int q=int(gl_FragCoord.x);', 'void main(){band=int(gl_FragCoord.y);int q=int(gl_FragCoord.x);');
 replace('vec4 restoration=record(q,18);', 'vec4 restoration=texelFetch(restorationData,ivec2(q,band),0);');
 return source;
}

/** Same nonuniform negative-exponent Fourier integral. Partial256-query sums
 * expose enough independent GPU work; binary64 later sums partials in order.
 * No phase weights or light samples are altered. @returns {string} */
export function spectralFourierShader(){return `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;
uniform sampler2D light,quadrature;uniform int count,chunks;out vec4 result;
void main(){float m=gl_FragCoord.x-0.5;int row=int(gl_FragCoord.y),band=row/chunks,block=row%chunks;vec4 sum=vec4(0),comp=vec4(0);for(int j=0;j<256;j++){int i=block*256+j;if(i>=count)break;vec2 v=texelFetch(light,ivec2(i,band),0).xy;vec2 q=texelFetch(quadrature,ivec2(i,0),0).xy;float a=m*q.x,c=cos(a),s=-sin(a);vec4 term=vec4(v.x*c,v.x*s,v.y*c,v.y*s)*q.y,y=term-comp,t=sum+y;comp=(t-sum)-y;sum=t;}result=sum;}
`;}

/** Package one geometry with actual per-band light. The caller verifies exact
 * node/frame identity before sharing geometry. @param {any[]} fields
 * @param {any[]} models @param {any[]} plans @param {number[]} quadrature
 * @param {boolean[]} [factored] @returns {any} */
export function spectralQueryPacket(fields,models,plans,quadrature,factored=[true,true]){
 assert.equal(fields.length,models.length);assert.equal(quadrature.length,plans.length*4);
 const first=queryUpload(fields[0],plans,models[0],factored),bands=fields.length,amplitudeRows=first.ampHeight,amplitude=new Float32Array(amplitudeRows*256*4*bands),restore=new Float32Array(plans.length*4*bands);
 for(let b=0;b<bands;b++){
  assert.equal(models[b].amplitude.length,models[0].amplitude.length);
  models[b].amplitude.forEach((v,i)=>{amplitude[(b*amplitudeRows*256+i)*4]=v[0];amplitude[(b*amplitudeRows*256+i)*4+1]=v[1];});
  plans.forEach((p,i)=>{const phase=phases(fields[b].px,p.d),value=p.fallback?models[b].evaluate(p):[0,0],at=(b*plans.length+i)*4;restore.set([factored[0]?phase[0]:1,factored[1]?phase[1]:1,...value],at);});
 }
 const geometry=Float32Array.from(first.data),quad=Float32Array.from(quadrature),total=geometry.length+amplitude.length+restore.length+quad.length,data=new Float32Array(total);let at=0;for(const v of [geometry,amplitude,restore,quad]){data.set(v,at);at+=v.length;}
 return {data,count:plans.length,bands,height:first.height,amplitudeRows,geometryCount:geometry.length,amplitudeCount:amplitude.length,restoreCount:restore.length,total};
}

/** Caller-owned hardware evaluator. Binary packets arrive only from the owned
 * nonce bridge and are checked against the declared exact layout.
 * @param {any} request @returns {Promise<any>} */
export async function spectralQueryResident(request){
 const key='__spectralPreparedProjection';
 if(request.action==='close'){const s=globalThis[key];if(s){s.gl.getExtension('WEBGL_lose_context')?.loseContext();globalThis[key]=null;}return true;}
 if(request.action==='init'){
  const gl=document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance',antialias:false});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float hardware GPU required');const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(/software|swiftshader|llvmpipe/i.test(renderer))throw Error('Hardware GPU required');
  const programs=[];for(const fragment of [request.queryShader,request.fourierShader]){const program=gl.createProgram();for(const [kind,source]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,fragment]]){const shader=gl.createShader(Number(kind));gl.shaderSource(shader,String(source));gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));programs.push(program);}
  globalThis[key]={gl,programs,textures:[],frame:gl.createFramebuffer(),vao:gl.createVertexArray(),L:request.L,renderer};return {renderer};
 }
 const s=globalThis[key];if(!s)throw Error('Spectral projection must be initialized');const {gl}=s,response=await fetch(request.url,{cache:'no-store'});if(!response.ok)throw Error('Owned spectral packet unavailable');const buffer=await response.arrayBuffer();if(buffer.byteLength!==request.total*4)throw Error('Spectral packet length mismatch');const data=new Float32Array(buffer),{count,bands,height,amplitudeRows,geometryCount,amplitudeCount,restoreCount}=request,chunks=Math.ceil(count/256),limit=gl.getParameter(gl.MAX_TEXTURE_SIZE);
 if(Math.max(count,1024,256,s.L+1)>limit||Math.max(height,amplitudeRows*bands,bands*chunks)>limit)throw Error('Spectral tile exceeds actual GPU texture dimensions');
 for(const texture of s.textures)gl.deleteTexture(texture);s.textures=[];
 const arrays=[data.subarray(0,geometryCount),data.subarray(geometryCount,geometryCount+amplitudeCount),data.subarray(geometryCount+amplitudeCount,geometryCount+amplitudeCount+restoreCount),data.subarray(geometryCount+amplitudeCount+restoreCount),null,null],sizes=[[1024,height],[256,amplitudeRows*bands],[count,bands],[count,1],[count,bands],[s.L+1,bands*chunks]];let bytes=0;
 for(let i=0;i<sizes.length;i++){const [w,h]=sizes[i],texture=gl.createTexture();s.textures.push(texture);gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,w,h,0,gl.RGBA,gl.FLOAT,arrays[i]);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);bytes+=w*h*16;}
 gl.bindVertexArray(s.vao);gl.bindFramebuffer(gl.FRAMEBUFFER,s.frame);gl.useProgram(s.programs[0]);for(const [name,unit]of [['planData',0],['amplitudes',1],['restorationData',2]])gl.uniform1i(gl.getUniformLocation(s.programs[0],String(name)),Number(unit));gl.uniform1i(gl.getUniformLocation(s.programs[0],'count'),count);gl.uniform1i(gl.getUniformLocation(s.programs[0],'amplitudeRows'),amplitudeRows);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,s.textures[4],0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Spectral light framebuffer');gl.viewport(0,0,count,bands);gl.drawArrays(gl.TRIANGLES,0,3);
 gl.useProgram(s.programs[1]);gl.uniform1i(gl.getUniformLocation(s.programs[1],'light'),4);gl.uniform1i(gl.getUniformLocation(s.programs[1],'quadrature'),3);gl.uniform1i(gl.getUniformLocation(s.programs[1],'count'),count);gl.uniform1i(gl.getUniformLocation(s.programs[1],'chunks'),chunks);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,s.textures[5],0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Spectral Fourier framebuffer');gl.viewport(0,0,s.L+1,bands*chunks);gl.drawArrays(gl.TRIANGLES,0,3);const values=new Float32Array((s.L+1)*bands*chunks*4);gl.readPixels(0,0,s.L+1,bands*chunks,gl.RGBA,gl.FLOAT,values);if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw Error('Spectral projection GPU failure');return {values:Array.from(values),chunks,bytes};
}
