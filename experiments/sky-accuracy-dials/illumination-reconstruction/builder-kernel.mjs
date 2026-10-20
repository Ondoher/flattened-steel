/** Resident reduction of sampled reconstructed illumination, shared across every
 * outgoing direction of a row. Shader phase evaluation is independently compared
 * with binary64 CPU reduction of the identical finite physical quadrature.
 * @param {any} p @returns {string} */
export function integrationShader(p){
 const array=(name,a)=>`const float ${name}[${a.length}]=float[](${a.map(x=>x.toExponential(14)).join(',')});`;
 const phase=p.table?array('MU',p.table.mu)+array('PDF',p.table.pdf)+`float PM(float m){int lo=0,hi=${p.table.mu.length-1};for(int k=0;k<16;k++){if(hi-lo<=1)break;int j=(lo+hi)/2;if(m<MU[j])hi=j;else lo=j;}float t=clamp((m-MU[lo])/(MU[hi]-MU[lo]),0.0,1.0);return mix(PDF[lo],PDF[hi],t)/(2.0*PI);}`:'float PM(float m){float g=0.7;return 3.0*(1.0-g*g)*(1.0+m*m)/(8.0*PI*(2.0+g*g)*pow(1.0+g*g-2.0*g*m,1.5));}';
 return `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;
uniform sampler2D directions,light,outgoing;uniform int count,offset,outCount;uniform vec2 beta;out vec4 result;
const float PI=3.141592653589793;
${phase}
void main(){int j=int(gl_FragCoord.x);result=vec4(0);if(j>=outCount)return;vec3 outDir=texelFetch(outgoing,ivec2(j+offset,0),0).xyz;vec4 sum=vec4(0),comp=vec4(0);
 for(int i=0;i<count;i++){ivec2 at=ivec2(i%256,i/256);vec4 q=texelFetch(directions,at,0);vec2 L=texelFetch(light,at,0).xy;float m=clamp(dot(q.xyz,outDir),-1.0,1.0),pr=3.0*(1.0+m*m)/(16.0*PI),pm=PM(m);vec4 value=vec4(L*pr*beta.x,L*pm*beta.y)*q.w;vec4 y=value-comp,t=sum+y;comp=(t-sum)-y;sum=t;}result=sum;}`;
}

/** @param {any} q @returns {any} */
export function builderResident(q){
 const key='__illuminationBuilder';
 if(q.action==='close'){const s=globalThis[key];if(s){s.gl.getExtension('WEBGL_lose_context')?.loseContext();globalThis[key]=null;}return true;}
 if(q.action==='init'){
  const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{powerPreference:'high-performance',antialias:false});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float hardware GPU required');
  const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(/software|swiftshader|llvmpipe/i.test(renderer))throw Error('Hardware GPU required');
  const p=gl.createProgram();for(const [kind,src]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,q.shader]]){const sh=gl.createShader(Number(kind));gl.shaderSource(sh,String(src));gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh);gl.deleteShader(sh);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  const frame=gl.createFramebuffer(),vao=gl.createVertexArray();globalThis[key]={gl,p,frame,vao,textures:[],renderer};return {renderer};
 }
 const s=globalThis[key],{gl,p,frame,vao}=s;
 if(q.action==='upload'){
  for(const t of s.textures)gl.deleteTexture(t);s.textures=[];gl.useProgram(p);gl.bindVertexArray(vao);
  const inputs=[['directions',256,q.height,q.directions],['light',256,q.height,q.light],['outgoing',q.outgoing.length/4,1,q.outgoing]];
  for(let i=0;i<inputs.length;i++){
   const [name,w,h,data]=inputs[i],t=gl.createTexture();s.textures.push(t);gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,Number(w),Number(h),0,gl.RGBA,gl.FLOAT,new Float32Array(data));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.uniform1i(gl.getUniformLocation(p,String(name)),i);
  }
  const out=gl.createTexture();s.textures.push(out);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,out);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,64,1,0,gl.RGBA,gl.FLOAT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,out,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Builder framebuffer');
  gl.uniform1i(gl.getUniformLocation(p,'count'),q.count);gl.uniform2fv(gl.getUniformLocation(p,'beta'),q.beta);return true;
 }
 gl.useProgram(p);gl.bindVertexArray(vao);gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.uniform1i(gl.getUniformLocation(p,'offset'),q.offset);gl.uniform1i(gl.getUniformLocation(p,'outCount'),q.count);gl.viewport(0,0,64,1);gl.drawArrays(gl.TRIANGLES,0,3);const result=new Float32Array(64*4);gl.readPixels(0,0,64,1,gl.RGBA,gl.FLOAT,result);if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw Error('Builder integration GPU failure');return Array.from(result.slice(0,q.count*4));
}
