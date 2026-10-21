import {shader} from '../interior-illumination/gpu.mjs';

/** Independent cache-free two-event physical estimator. Reuses only the
 * previously calibrated stable shell/column primitives, never source fields.
 * @returns {string} */
export function partialHistoryShader(){return shader().split('void main(){')[0]+`
uniform sampler2D historyTail;
float pr(float mu){return 3.0*(1.0+mu*mu)/(16.0*3.141592653589793);}
float pm(float mu){return 3.0*(1.0-.7*.7)*(1.0+mu*mu)/(8.0*3.141592653589793*(2.0+.7*.7)*pow(1.0+.7*.7-1.4*clamp(mu,-1.0,1.0),1.5));}
void main(){int i=int(gl_FragCoord.x)+256*int(gl_FragCoord.y);result=vec4(0);if(i>=count)return;
 vec4 q=texelFetch(queries,ivec2(i%256,i/256),0),a=texelFetch(historyTail,ivec2(i%256,i/256),0);vec3 d=q.xyz;float s=q.w,t=a.x,h=heightAt(s,d.z,t),mu=dot(d,sun),sm=((shell.x+s)*sun.z+t*mu)/(shell.x+h);vec2 se=edge(h,sm);if(se.y>0.5)return;
 float outer=phys.x*8000.0*(1.0-exp(-s/8000.0))+phys.y*1200.0*(1.0-exp(-s/1200.0)),weight=phys.w*a.y*exp(-outer-column(s,d.z,t)-column(h,sm,se.x));
 vec2 origin=vec2(phys.x*exp(-h/8000.0)*a.z,phys.y*phys.z*exp(-h/1200.0)*a.w),last=vec2(phys.x*exp(-s/8000.0)*pr(d.z),phys.y*phys.z*exp(-s/1200.0)*pm(d.z));
 result=weight*vec4(last.x*origin.x,last.x*origin.y,last.y*origin.x,last.y*origin.y);
}`;}

/** One caller-owned hardware context, bounded batches, explicit teardown.
 * @param {any} request @returns {any} */
export function partialHistoryResident(request){
 const key='__ownPartialHistory';if(request.action==='close'){const state=globalThis[key];if(state){state.gl.getExtension('WEBGL_lose_context')?.loseContext();globalThis[key]=null;}return true;}
 if(request.action==='init'){
  const gl=document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance',antialias:false});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float hardware GPU required');const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(/software|swiftshader|llvmpipe/i.test(renderer))throw Error('Hardware GPU required');const program=gl.createProgram();
  for(const [kind,source]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,request.shader]]){const sh=gl.createShader(Number(kind));gl.shaderSource(sh,String(source));gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(program,sh);gl.deleteShader(sh);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));globalThis[key]={gl,program,textures:[],frame:gl.createFramebuffer(),vao:gl.createVertexArray(),renderer};return {renderer};
 }
 const state=globalThis[key],{gl,program,frame,vao}=state,{p,nc}=request,n=request.first.length/4,height=Math.ceil(n/256),limit=gl.getParameter(gl.MAX_TEXTURE_SIZE);if(height>limit||256>limit)throw Error('Actual history texture limit');state.textures.forEach(x=>gl.deleteTexture(x));state.textures=[];gl.useProgram(program);gl.bindVertexArray(vao);
 for(const [unit,input,name]of [[0,request.first,'queries'],[1,request.tail,'historyTail'],[2,null,null]]){const texture=gl.createTexture();state.textures.push(texture);gl.activeTexture(gl.TEXTURE0+Number(unit));gl.bindTexture(gl.TEXTURE_2D,texture);const pixels=input?new Float32Array(256*height*4):null;if(pixels)pixels.set(input);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,256,height,0,gl.RGBA,gl.FLOAT,pixels);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);if(name)gl.uniform1i(gl.getUniformLocation(program,String(name)),Number(unit));}
 gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,state.textures[2],0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('History framebuffer');gl.uniform1i(gl.getUniformLocation(program,'count'),n);gl.uniform1i(gl.getUniformLocation(program,'nc'),nc);gl.uniform3fv(gl.getUniformLocation(program,'sun'),p.sun);gl.uniform4fv(gl.getUniformLocation(program,'phys'),[p.br,p.bm,p.ssa,p.irradiance]);gl.uniform3fv(gl.getUniformLocation(program,'shell'),[p.radius,p.top,p.h]);gl.viewport(0,0,256,height);gl.drawArrays(gl.TRIANGLES,0,3);const out=new Float32Array(256*height*4);gl.readPixels(0,0,256,height,gl.RGBA,gl.FLOAT,out);if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw Error('History GPU failure');return {values:Array.from(out.slice(0,n*4)),ownedTextureBytes:3*256*height*16};
}
