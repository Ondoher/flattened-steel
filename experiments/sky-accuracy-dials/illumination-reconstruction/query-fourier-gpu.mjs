/** Fourier reduction of the already evaluated prepared-query light texture.
 * The caller supplies the original nonuniform quadrature, not new samples or
 * fitted weights. The negative-exponent convention matches harmonics.mjs.
 * @returns {string} */
export function fourierShader(){return `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;
uniform sampler2D light,quadrature;uniform int count;out vec4 result;
void main(){float m=gl_FragCoord.x-0.5;vec4 sum=vec4(0),comp=vec4(0);for(int i=0;i<count;i++){vec2 v=texelFetch(light,ivec2(i,0),0).xy;vec2 q=texelFetch(quadrature,ivec2(i,0),0).xy;float a=m*q.x,c=cos(a),s=-sin(a);vec4 term=vec4(v.x*c,v.x*s,v.y*c,v.y*s)*q.y,y=term-comp,t=sum+y;comp=(t-sum)-y;sum=t;}result=sum;}
`;}

/** Use the prepared-query evaluator's caller-owned context; no second GPU job.
 * @param {any} request @returns {any} */
export function fourierResident(request){
 const state=globalThis.__polarPreparedQueries;if(!state)throw Error('Prepared-query context must be initialized first');const {gl}=state;
 if(request.action==='init'){
  if(state.fourier)throw Error('Fourier reducer is already initialized');
  const program=gl.createProgram();for(const [kind,source]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,request.shader]]){const shader=gl.createShader(Number(kind));gl.shaderSource(shader,String(source));gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  const textures=[gl.createTexture(),gl.createTexture()],frame=gl.createFramebuffer();state.fourier={program,textures,frame,L:request.L};gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,textures[1]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,request.L+1,1,0,gl.RGBA,gl.FLOAT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,textures[1],0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Fourier framebuffer');return true;
 }
 const s=state.fourier;if(!s)throw Error('Fourier reducer is not initialized');
 if(request.action==='close'){s.textures.forEach(t=>gl.deleteTexture(t));gl.deleteFramebuffer(s.frame);gl.deleteProgram(s.program);state.fourier=null;return true;}
 if(request.count!==request.quadrature.length/4)throw Error('Fourier quadrature count mismatch');
 gl.useProgram(s.program);gl.bindVertexArray(state.vao);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,state.textures[2]);gl.uniform1i(gl.getUniformLocation(s.program,'light'),2);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,s.textures[0]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,request.count,1,0,gl.RGBA,gl.FLOAT,Float32Array.from(request.quadrature));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.uniform1i(gl.getUniformLocation(s.program,'quadrature'),3);gl.uniform1i(gl.getUniformLocation(s.program,'count'),request.count);gl.bindFramebuffer(gl.FRAMEBUFFER,s.frame);gl.viewport(0,0,s.L+1,1);gl.drawArrays(gl.TRIANGLES,0,3);const result=new Float32Array((s.L+1)*4);gl.readPixels(0,0,s.L+1,1,gl.RGBA,gl.FLOAT,result);if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw Error('Fourier GPU failure');return Array.from(result);
}
