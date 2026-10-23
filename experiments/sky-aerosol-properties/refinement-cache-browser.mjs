import {compileDistantSunSceneCacheWavelength} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';

/** Experimental read-only observer of production recurrence fields. @param {any} c */
export async function execute(c){
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{antialias:false,powerPreference:'high-performance'});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float WebGL2 required');
 const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(/software|swiftshader|llvmpipe/i.test(renderer))throw Error('Hardware GPU required');
 const owned=[],programs=[],frame=gl.createFramebuffer(),vao=gl.createVertexArray();let queryProgram,currentChannel=0,records=[];
 function texture(w,h,data=null,red=false){const t=gl.createTexture();owned.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,red?gl.R32F:gl.RGBA32F,w,h,0,red?gl.RED:gl.RGBA,gl.FLOAT,data);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);return t;}
 function program(fragment){const p=gl.createProgram();programs.push(p);for(const [kind,s]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}'],[gl.FRAGMENT_SHADER,fragment]]){const a=gl.createShader(Number(kind));gl.shaderSource(a,String(s));gl.compileShader(a);if(!gl.getShaderParameter(a,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(a));gl.attachShader(p,a);gl.deleteShader(a);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
 function bind(p,n,u,t){gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(gl.getUniformLocation(p,n),u);}
 function target(p,t,w,h){gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.drawBuffers([gl.COLOR_ATTACHMENT0]);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Query framebuffer');gl.useProgram(p);gl.bindVertexArray(vao);gl.viewport(0,0,w,h);}
 const spec=c.request.transportSpec,w=spec.domains.outgoing.directionCount,h=spec.domains.position.count*spec.domains.solarZenith.count,acc=[texture(w,h,null,true),texture(w,h,null,true)];
 const sum=program('#version 300 es\nprecision highp float;precision highp int;uniform sampler2D a,b;uniform bool first;out vec4 value;void main(){ivec2 q=ivec2(gl_FragCoord.xy);value=vec4((first?0.:texelFetch(a,q,0).r)+texelFetch(b,q,0).r,0,0,0);}');
 const qw=512,qh=Math.ceil(c.directions.length/qw),data=new Float32Array(qw*qh*4);c.directions.forEach((d,i)=>data.set([...d,0],4*i));const qt=texture(qw,qh,data),out=texture(qw,qh);
 globalThis['__aerosolObserve']=async({fieldId,resource,common})=>{
  if(!fieldId.startsWith('J'))return;const order=Number(fieldId.slice(1));
  if(!queryProgram)queryProgram=program(`#version 300 es
precision highp float;precision highp int;uniform sampler2D field,queries;uniform float observer,zenith;uniform int intervals;out vec4 value;
${common}
float slope(float a,float b){if(a*b<=0.)return 0.;float lo=min(abs(a),abs(b)),hi=max(abs(a),abs(b));return sign(a)*2.*lo/(1.+lo/hi);}
float interp(float p,float a,float b,float n,float t){float d=b-a,m=slope(a-p,d),v=slope(d,n-b),t2=t*t,t3=t2*t;return (2.*t3-3.*t2+1.)*a+(t3-2.*t2+t)*m+(-2.*t3+3.*t2)*b+(t3-t2)*v;}
float row(int z,int p,vec3 d){return sampleJDirection(field,z*POSITION_COUNT+p,d);}
float at(vec3 p,vec3 v){int a,b,z0,z1;float fp,fz;positionStencil(altitudeAtPoint(p),a,b,fp);solarZenithStencil(sourceZenithDegreesAtPoint(p),z0,z1,fz);vec3 d=outgoingLocalDirection(p,v);int zp=max(0,z0-1),zn=min(SOLAR_ZENITH_COUNT-1,z1+1);float u=interp(row(zp,a,d),row(z0,a,d),row(z1,a,d),row(zn,a,d),fz),v1=interp(row(zp,b,d),row(z0,b,d),row(z1,b,d),row(zn,b,d),fz);return mix(u,v1,fp);}
void main(){vec3 local=texelFetch(queries,ivec2(gl_FragCoord.xy),0).xyz;float theta=radians(zenith);vec3 up=vec3(sin(theta),0,cos(theta)),tangent=vec3(-cos(theta),0,sin(theta)),across=vec3(0,-1,0);vec3 origin=(BOTTOM_RADIUS+observer)*up,v=normalize(-local.y*tangent+local.x*across+local.z*up);
 radialAnchorPoint=origin;radialAnchorHeight=observer;radialAnchorCosine=cos(theta);radialAnchorZenithDegrees=zenith;radialAnchorDirection=v;radialAnchorDirectionCosine=local.z;
 float end=atmosphereBranchLength(origin,v),scale=log(1.+end/1000.),tau=0.,sum=0.,previous=0.;
 for(int i=0;i<192;i++){if(i>=intervals)break;float a=1000.*(exp(scale*float(i)/float(intervals))-1.),b=1000.*(exp(scale*float(i+1)/float(intervals))-1.),dt=b-a,t=(a+b)*.5;vec3 p=origin+v*t;float extinction=sampleMediumAtPoint(p).extinction;sum+=exp(-tau-extinction*dt*.5)*at(p,v)*dt;tau+=extinction*dt;}
 value=vec4(sum,0,0,1);}`);
  const dest=acc[(order-1)%2];target(sum,dest,w,h);bind(sum,'a',0,acc[order%2]);bind(sum,'b',1,resource.texture);gl.uniform1i(gl.getUniformLocation(sum,'first'),order===1?1:0);gl.drawArrays(gl.TRIANGLES,0,3);
  const jobs=[];
  for(const job of c.jobs){
   const angle=(job.sunRotation??0)*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle);
   c.directions.forEach((d,i)=>{const v=((i>=15&&i<26)||i>=c.sunFieldFirst)?[d[0],cs*d[1]+sn*d[2],-sn*d[1]+cs*d[2]]:d;data.set([...v,0],4*i);});
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,qt);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,qw,qh,gl.RGBA,gl.FLOAT,data);
   const readings=[];for(const t of [resource.texture,dest]){target(queryProgram,out,qw,qh);bind(queryProgram,'field',0,t);bind(queryProgram,'queries',1,qt);gl.uniform1f(gl.getUniformLocation(queryProgram,'observer'),job.height);gl.uniform1f(gl.getUniformLocation(queryProgram,'zenith'),job.zenith);gl.uniform1i(gl.getUniformLocation(queryProgram,'intervals'),c.intervals??96);gl.drawArrays(gl.TRIANGLES,0,3);const pixels=new Float32Array(qw*qh*4);gl.readPixels(0,0,qw,qh,gl.RGBA,gl.FLOAT,pixels);const values=Array.from({length:c.directions.length},(_,i)=>pixels[4*i]);if(values.some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid cache query');readings.push(values);}gl.uniform1i(gl.getUniformLocation(queryProgram,'intervals'),192);gl.viewport(0,0,26,1);gl.drawArrays(gl.TRIANGLES,0,3);const fine=new Float32Array(26*4);gl.readPixels(0,0,26,1,gl.RGBA,gl.FLOAT,fine);jobs.push({id:job.id,pure:readings[0],cumulative:readings[1],refinedRays:Array.from({length:26},(_,i)=>fine[4*i])});}
  records.push({order,jobs});if(gl.getError()!==gl.NO_ERROR)throw Error('Query GPU error');await globalThis['aerosolProgress'](`channel${currentChannel} J${order} observed`);
 };
 try{for(const channel of c.channels){currentChannel=channel;queryProgram=undefined;records=[];const started=performance.now();const report=await compileDistantSunSceneCacheWavelength({gl,buildRequest:c.request,wavelengthIndex:channel,reportProgress:async stage=>{if(stage==='programs-compiled'||stage.endsWith(':180/180'))await globalThis['aerosolProgress'](`channel${channel} ${stage}`);}});await globalThis['aerosolChannel']({channel,records,report,milliseconds:performance.now()-started});}return {renderer,extraAccumulatorBytes:2*w*h*4,queryCount:c.directions.length};}
 finally{globalThis['__aerosolObserve']=null;owned.forEach(t=>gl.deleteTexture(t));programs.forEach(p=>gl.deleteProgram(p));gl.deleteFramebuffer(frame);gl.deleteVertexArray(vao);gl.getExtension('WEBGL_lose_context')?.loseContext();}
}
