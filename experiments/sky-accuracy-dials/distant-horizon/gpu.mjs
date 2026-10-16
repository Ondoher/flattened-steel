import {gauss} from '../continuation/direct-solver/math.mjs';

/** Generate cache-free spherical/parallel N1 transport in stable local coordinates.
 * @param {HorizonReferenceMedium} m Physical coefficients; absolute origin is radius plus five meters.
 * @param {number[][]} rgb Native15-to-linear-RGB weights from independent bin-integrated CIE data.
 * @returns {string} Complete WebGL2 shader; no production transport or cache sampling is used.
 */
export function fragment(m, rgb) {
	const q=gauss(64),c=gauss(32);
	const array=(name,values)=>`const float ${name}[${values.length}]=float[](${values.map(x=>x.toExponential(16)).join(',')});`;
	return `#version 300 es
precision highp float; precision highp int;
out vec4 outputColor;
uniform vec2 imageSize; uniform vec3 probeDirection; uniform int probe,outputGroup; uniform float amount;
const float R=${m.radius}.0, TOP=${m.topAltitude}.0, PI=3.141592653589793;
const vec3 SUN=vec3(${m.sourceDirection.join(',')});
${array('VX',q.nodes)} ${array('VW',q.weights)} ${array('CX',c.nodes)} ${array('CW',c.weights)}
${array('B',m.rayleigh)} ${array('M',m.mie)} ${array('E',m.sourceIrradiance)}
${array('RR',rgb.map(x=>x[0]))} ${array('RG',rgb.map(x=>x[1]))} ${array('RB',rgb.map(x=>x[2]))}
float h(vec3 p){float d=dot(p,p)+2.0*R*p.z;return max(0.0,d/(sqrt(R*R+d)+R));}
float edge(vec3 p,vec3 v){float b=dot(p,v)+R*v.z,c=dot(p,p)+2.0*R*p.z;
 if(b<0.0&&b*b>=c)return -1.0;
 float ct=c-TOP*(2.0*R+TOP),s=sqrt(max(0.0,b*b-ct));return b>=0.0?-ct/(b+s):-b+s;}
vec2 columns(vec3 p,vec3 v,float t){vec2 sum=vec2(0);
 for(int j=0;j<32;j++)sum+=CW[j]*exp(-h(p+v*t*CX[j])/vec2(${m.rayleighHeight}.0,${m.mieHeight}.0));return sum*t;}
void main(){
 vec2 uv=gl_FragCoord.xy/imageSize;
 float a=radians(150.0+60.0*uv.x),e=radians(0.05+24.95*uv.y);
 vec3 v=probe==1?probeDirection:vec3(sin(a)*cos(e),-cos(a)*cos(e),sin(e));
 vec3 o=vec3(0,0,5);float end=edge(o,v),spectrum[15];for(int k=0;k<15;k++)spectrum[k]=0.0;
 float cosine=dot(v,SUN),pR=3.0*(1.0+cosine*cosine)/(16.0*PI),g=${m.g};
 float pM=3.0*(1.0-g*g)*(1.0+cosine*cosine)/(8.0*PI*(2.0+g*g)*pow(1.0+g*g-2.0*g*cosine,1.5));
 float edges[7]=float[](0.0,10000.0,50000.0,100000.0,300000.0,1000000.0,end);
 for(int bin=0;bin<6;bin++){float lo=min(end,edges[bin]),hi=min(end,edges[bin+1]);if(hi<=lo)continue;
  float la=log(1.0+lo/1000.0),dz=log(1.0+hi/1000.0)-la;
  for(int j=0;j<64;j++){float t=1000.0*(exp(la+dz*VX[j])-1.0),jac=(t+1000.0)*dz*VW[j];vec3 p=o+v*t;
   float se=edge(p,SUN);if(se<0.0)continue;
   vec2 d=exp(-h(p)/vec2(${m.rayleighHeight}.0,${m.mieHeight}.0)),col=columns(p,SUN,se)+columns(o,v,t);
   for(int k=0;k<15;k++)spectrum[k]+=jac*E[k]*${m.incidentScale}.0*exp(-B[k]*col.x-amount*M[k]*col.y)*(B[k]*d.x*pR+amount*M[k]*${m.albedo}*d.y*pM);
  }
 }
 if(outputGroup>=0){int k=outputGroup*4;outputColor=vec4(spectrum[k],spectrum[k+1],spectrum[k+2],k+3<15?spectrum[k+3]:0.0);}
 else {vec3 rgb=vec3(0);for(int k=0;k<15;k++)rgb+=spectrum[k]*vec3(RR[k],RG[k],RB[k]);outputColor=vec4(rgb,1);}
}`;
}

/** Render independent angular sky images and sparse spectra on a hardware WebGL2 adapter.
 * @param {DistantAerosolGpuInput} input Frozen shader, image dimensions and unit probe directions.
 * @returns {Promise<DistantAerosolGpuResult>} Float readback and telemetry; shader/device failures reject.
 * Owned WebGL objects are deleted on every exit; the caller owns browser retirement.
 */
export async function execute(input) {
	const start=performance.now(),canvas=document.createElement('canvas');
	const gl=canvas.getContext('webgl2',{powerPreference:'high-performance',antialias:false});
	if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw new Error('Float WebGL2 required');
	const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));
	if(/swiftshader|software|llvmpipe/i.test(renderer))throw new Error('Hardware GPU required');
	const program=gl.createProgram(),texture=gl.createTexture(),frame=gl.createFramebuffer(),shaders=[];
	try {
		for(const [kind,source] of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,input.shader]]){
			const shader=gl.createShader(Number(kind));shaders.push(shader);gl.shaderSource(shader,String(source));gl.compileShader(shader);
			if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);
		}
		gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
		gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA32F,input.width,input.height);
		gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
		if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Incomplete float target');
		gl.uniform2f(gl.getUniformLocation(program,'imageSize'),input.width,input.height);
		const cases=[];
		for(const fraction of [1,0]){
			gl.uniform1f(gl.getUniformLocation(program,'amount'),fraction);gl.uniform1i(gl.getUniformLocation(program,'probe'),0);gl.uniform1i(gl.getUniformLocation(program,'outputGroup'),-1);
			gl.viewport(0,0,input.width,input.height);gl.drawArrays(gl.TRIANGLES,0,3);
			const pixels=new Float32Array(input.width*input.height*4);gl.readPixels(0,0,input.width,input.height,gl.RGBA,gl.FLOAT,pixels);
			const spectra=[];gl.uniform1i(gl.getUniformLocation(program,'probe'),1);gl.viewport(0,0,1,1);
			for(const direction of input.directions){const spectrum=[];gl.uniform3fv(gl.getUniformLocation(program,'probeDirection'),Float32Array.from(direction));
				for(let group=0;group<4;group++){gl.uniform1i(gl.getUniformLocation(program,'outputGroup'),group);gl.drawArrays(gl.TRIANGLES,0,3);const p=new Float32Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.FLOAT,p);spectrum.push(...p);}spectra.push(spectrum.slice(0,15));}
			if(gl.getError()!==gl.NO_ERROR||![...pixels].every(Number.isFinite))throw new Error('GPU readback failed');
			cases.push({fraction,pixels:[...pixels],spectra});await new Promise(resolve=>setTimeout(resolve,0));
		}
		return {renderer,milliseconds:performance.now()-start,cases};
	} finally {for(const shader of shaders)gl.deleteShader(shader);gl.deleteProgram(program);gl.deleteFramebuffer(frame);gl.deleteTexture(texture);gl.getExtension('WEBGL_lose_context')?.loseContext();}
}
