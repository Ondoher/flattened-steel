/** Resident GPU evaluation of a complete outgoing row from physical phase-
 * weighted orthonormal harmonic coefficients. @param {number} L @returns {string} */
export function harmonicShader(L){return `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;
uniform sampler2D coefficientsReal,coefficientsImag,outgoing;uniform int offset,count;
out vec4 result;
int indexOf(int l,int m){return l*(l+1)/2+m;}
void append(int l,int m,float q,float cm,float sm,inout vec4 sum,inout vec4 compensation){int at=indexOf(l,m);ivec2 p=ivec2(at%256,at/256);vec4 z=(texelFetch(coefficientsReal,p,0)*cm-texelFetch(coefficientsImag,p,0)*sm)*q*(m==0?1.0:2.0);vec4 y=z-compensation,t=sum+y;compensation=(t-sum)-y;sum=t;}
void main(){int j=int(gl_FragCoord.x);result=vec4(0);if(j>=count)return;vec4 d=texelFetch(outgoing,ivec2(j+offset,0),0);float mu=d.x,s=sqrt(max(0.0,1.0-mu*mu)),cm=1.0,sm=0.0,diag=0.28209479177387814;vec4 sum=vec4(0),compensation=vec4(0);
 for(int m=0;m<=${L};m++){
  if(m>0)diag*=-sqrt(float(2*m+1)/float(2*m))*s;
  float previous=diag,older=0.0;append(m,m,diag,cm,sm,sum,compensation);
  for(int l=m+1;l<=${L};l++){
   float q;if(l==m+1)q=sqrt(float(2*m+3))*mu*diag;else{float den=float((l-m)*(l+m));q=sqrt(float(4*l*l-1)/den)*mu*previous-sqrt(float(2*l+1)*float((l-1)*(l-1)-m*m)/(float(2*l-3)*den))*older;}
   append(l,m,q,cm,sm,sum,compensation);older=previous;previous=q;
  }
  float next=cm*d.y-sm*d.z;sm=sm*d.y+cm*d.z;cm=next;
 }
 result=sum;
}`;}

/** @param {any} request @returns {any} */
export function harmonicResident(request){
 const key='__harmonicSource';
 if(request.action==='close'){const s=globalThis[key];if(s){s.gl.getExtension('WEBGL_lose_context')?.loseContext();globalThis[key]=null;}return true;}
 if(request.action==='init'){
  const gl=document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance',antialias:false});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float hardware GPU required');const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(/software|swiftshader|llvmpipe/i.test(renderer))throw Error('Hardware GPU required');
  const p=gl.createProgram();for(const [kind,source]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,request.shader]]){const sh=gl.createShader(Number(kind));gl.shaderSource(sh,String(source));gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh);gl.deleteShader(sh);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));const frame=gl.createFramebuffer(),vao=gl.createVertexArray(),textures=[];
  for(const [i,name,w,h,data]of [[0,'coefficientsReal',256,request.height,request.real],[1,'coefficientsImag',256,request.height,request.imag],[2,'outgoing',request.outgoing.length/4,1,request.outgoing],[3,null,64,1,null]]){const t=gl.createTexture();textures.push(t);gl.activeTexture(gl.TEXTURE0+Number(i));gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,Number(w),Number(h),0,gl.RGBA,gl.FLOAT,data?Float32Array.from(data):null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);if(name){gl.useProgram(p);gl.uniform1i(gl.getUniformLocation(p,String(name)),Number(i));}}
  gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,textures[3],0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Harmonic framebuffer');globalThis[key]={gl,p,frame,vao,textures,renderer};return {renderer};
 }
 const {gl,p,frame,vao}=globalThis[key];gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.bindVertexArray(vao);gl.useProgram(p);gl.uniform1i(gl.getUniformLocation(p,'offset'),request.offset);gl.uniform1i(gl.getUniformLocation(p,'count'),request.count);gl.viewport(0,0,64,1);gl.drawArrays(gl.TRIANGLES,0,3);const out=new Float32Array(256);gl.readPixels(0,0,64,1,gl.RGBA,gl.FLOAT,out);if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw Error('Harmonic GPU error');return Array.from(out.slice(0,request.count*4));
}
