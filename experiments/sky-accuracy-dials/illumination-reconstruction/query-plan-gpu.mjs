import {phases} from './common.mjs';

/** Geometry pointers and affine-normalized intervals are material-independent.
 * Restoration and explicit CPU support fallbacks are recomputed for the active
 * field. @param {any} f @param {any[]} plans @param {any} model @param {boolean[]} [factored]
 * @returns {any} */
export function queryUpload(f,plans,model,factored=[true,true]){
 const height=Math.ceil(plans.length*20/1024),data=new Float32Array(height*1024*4),ampHeight=Math.ceil(model.amplitude.length/256),amplitude=new Float32Array(ampHeight*256*4);
 model.amplitude.forEach((v,i)=>{amplitude[i*4]=v[0];amplitude[i*4+1]=v[1];});
 const put=(q,t,a)=>data.set(a,(q*20+t)*4);
 plans.forEach((p,q)=>{
  const P=phases(f.px,p.d),restore=P.map((x,s)=>factored[s]?x:1);
  if(p.fallback){const value=model.evaluate(p);put(q,18,[...restore,...value]);put(q,19,[1,0,0,0]);return;}
  p.bases.forEach((b,k)=>{
   put(q,k,[b.t,b.x0,b.x3,0]);
   b.rows.forEach((row,j)=>{
    const at=2+(k*4+j)*2;
    if(!row){put(q,at,[-1,-1,-1,-1]);put(q,at+1,[0,-1,2,0]);}
    else{put(q,at,row.indices);put(q,at+1,[row.t,row.x0,row.x3,row.kind]);}
   });
  });
  put(q,18,[...restore,0,0]);
 });
 return {count:plans.length,height,ampHeight,data:Array.from(data),amplitude:Array.from(amplitude)};
}

/** @returns {string} */
export function queryShader(){return `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;
uniform sampler2D planData,amplitudes;uniform int count;out vec4 result;
vec4 record(int q,int t){int at=q*20+t;return texelFetch(planData,ivec2(at%1024,at/1024),0);}
vec2 node(int i){return i<0?vec2(0):texelFetch(amplitudes,ivec2(i%256,i/256),0).xy;}
float harmonic(float a,float b,float ha,float hb){if(a==0.0||b==0.0||(a<0.0)!=(b<0.0))return 0.0;float w1=2.0*hb+ha,w2=hb+2.0*ha;return (w1+w2)/(w1/a+w2/b);}
float cubic(vec4 y,float x0,float x3,float t,bool left,bool right){float d=y.z-y.y,a=left?harmonic((y.y-y.x)/(-x0),d,-x0,1.0):d,b=right?harmonic(d,(y.w-y.z)/(x3-1.0),1.0,x3-1.0):d;return max(0.0,(1.0+2.0*t)*(1.0-t)*(1.0-t)*y.y+t*t*(3.0-2.0*t)*y.z+t*(1.0-t)*(1.0-t)*a+t*t*(t-1.0)*b);}
vec2 ring(int q,int k,int j){int at=2+(k*4+j)*2;ivec4 ids=ivec4(record(q,at));vec4 m=record(q,at+1);if(m.w<0.5)return vec2(0);if(m.w<1.5)return node(ids.y);vec2 a=node(ids.x),b=node(ids.y),c=node(ids.z),d=node(ids.w);return vec2(cubic(vec4(a.x,b.x,c.x,d.x),m.y,m.z,m.x,ids.x>=0,ids.w>=0),cubic(vec4(a.y,b.y,c.y,d.y),m.y,m.z,m.x,ids.x>=0,ids.w>=0));}
void main(){int q=int(gl_FragCoord.x);result=vec4(0);if(q>=count)return;vec4 restoration=record(q,18);if(record(q,19).x>0.5){result=vec4(restoration.zw,0,0);return;}vec2 sum=vec2(0);for(int k=0;k<2;k++){vec4 m=record(q,k);vec2 a=ring(q,k,0),b=ring(q,k,1),c=ring(q,k,2),d=ring(q,k,3);bool left=record(q,3+k*8).w>0.5,right=record(q,9+k*8).w>0.5;sum+=0.5*vec2(cubic(vec4(a.x,b.x,c.x,d.x),m.y,m.z,m.x,left,right),cubic(vec4(a.y,b.y,c.y,d.y),m.y,m.z,m.x,left,right));}result=vec4(sum*restoration.xy,0,0);}
`;}

/** Caller-owned resident hardware evaluator. @param {any} request @returns {any} */
export function queryResident(request){
 const key='__polarPreparedQueries';
 if(request.action==='close'){const s=globalThis[key];if(s){s.gl.getExtension('WEBGL_lose_context')?.loseContext();globalThis[key]=null;}return true;}
 if(request.action==='init'){
  const gl=document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance',antialias:false});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float hardware GPU required');
  const ext=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(/software|swiftshader|llvmpipe/i.test(renderer))throw Error('Hardware GPU required');
  const program=gl.createProgram();for(const [kind,source]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,request.shader]]){const shader=gl.createShader(Number(kind));gl.shaderSource(shader,String(source));gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  globalThis[key]={gl,program,frame:gl.createFramebuffer(),vao:gl.createVertexArray(),textures:[],renderer};return {renderer};
 }
 const s=globalThis[key],{gl,program,frame,vao}=s;
 if(request.count>gl.getParameter(gl.MAX_TEXTURE_SIZE)||request.height>gl.getParameter(gl.MAX_TEXTURE_SIZE)||request.ampHeight>gl.getParameter(gl.MAX_TEXTURE_SIZE))throw Error('Prepared query texture exceeds actual device limit');
 for(const texture of s.textures)gl.deleteTexture(texture);s.textures=[];gl.useProgram(program);
 for(const [i,name,w,h,data]of [[0,'planData',1024,request.height,request.data],[1,'amplitudes',256,request.ampHeight,request.amplitude],[2,null,request.count,1,null]]){
  const texture=gl.createTexture();s.textures.push(texture);gl.activeTexture(gl.TEXTURE0+Number(i));gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,Number(w),Number(h),0,gl.RGBA,gl.FLOAT,data?Float32Array.from(data):null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);if(name)gl.uniform1i(gl.getUniformLocation(program,String(name)),Number(i));
 }
 gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,s.textures[2],0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Prepared query framebuffer');
 gl.bindVertexArray(vao);gl.uniform1i(gl.getUniformLocation(program,'count'),request.count);gl.viewport(0,0,request.count,1);gl.drawArrays(gl.TRIANGLES,0,3);
 if(request.retainLightOnly){if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw Error('Prepared source GPU failure');return true;}
 const out=new Float32Array(request.count*4);gl.readPixels(0,0,request.count,1,gl.RGBA,gl.FLOAT,out);if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw Error('Prepared source GPU failure');return Array.from(out);
}
