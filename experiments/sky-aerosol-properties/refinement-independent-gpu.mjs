import {gauss} from './reference.mjs';

/** Generate a cache-free transport kernel; only mathematical Gauss rules are shared with the old reference.
 * @param {AerosolMedium} m Matched physical material.
 * @returns {string} Standalone GLSL, with physical inputs supplied exclusively as uniforms.
 */
export function fragment(m) {
	const array = (name, x) =>
		`const float ${name}[${x.length}]=float[](${x.map((v) => v.toExponential(16)).join(',')});`;
	const a = gauss(64),
		b = gauss(128);
	return `#version 300 es
precision highp float;precision highp int;
layout(location=0) out vec4 o0;layout(location=1) out vec4 o1;
layout(location=2) out vec4 o2;layout(location=3) out vec4 o3;
uniform vec3 origin,viewing,sunPosition,sunDirection;
uniform vec4 physical;
uniform float endDistance,sourceScale,referenceDistance;
uniform int flatGeometry,finiteSource,quadrature,rouletteStart;
uniform uint firstSeed;
const float R=6360000.0,PI=3.14159265358979323846,G=${m.g},W=${m.albedo},HR=${m.rayleighHeight}.0,HM=${m.mieHeight}.0;
${array('X64', a.nodes)} ${array('W64', a.weights)} ${array('X128', b.nodes)} ${array('W128', b.weights)}
uint state;
float random(){state=state*747796405u+2891336453u;uint word=((state>>((state>>28u)+4u))^state)*277803737u;word=(word>>22u)^word;return (float(word>>9u)+0.5)/8388608.0;}
float altitude(vec3 x){return flatGeometry==1?x.z:length(x)-R;}
vec2 edge(vec3 x,vec3 v){
 if(flatGeometry==1)return vec2(v.z>0.0?(100000.0-x.z)/v.z:v.z<0.0?-x.z/v.z:1e30,v.z<0.0?1.0:0.0);
 float r=length(x),b=dot(x,v),c=(r-R)*(r+R),d=b*b-c;
 if(b<0.0&&d>=0.0)return vec2(max(0.0,c/(-b+sqrt(d))),1.0);
 float ct=(r-R-60000.0)*(r+R+60000.0),root=sqrt(max(0.0,b*b-ct));
 return vec2(max(0.0,b>=0.0?-ct/(b+root):-b+root),0.0);
}
vec2 density(vec3 x){return physical.xy*exp(-max(0.0,altitude(x))/vec2(HR,HM));}
float column(float h,float vz,float t,float H){float a=vz*t/H;return exp(-h/H)*t*(abs(a)<0.001?1.0-a/2.0+a*a/6.0:(1.0-exp(-a))/a);}
float tau(vec3 x,vec3 v,float t){
 if(flatGeometry==1)return physical.x*column(x.z,v.z,t,HR)+physical.y*column(x.z,v.z,t,HM);
 float s=0.0;for(int i=0;i<quadrature;i++){float u=quadrature==64?X64[i]:X128[i],w=quadrature==64?W64[i]:W128[i];vec2 b=density(x+v*t*u);s+=w*(b.x+b.y);}return s*t;
}
vec4 sunlight(vec3 x){vec3 delta=sunPosition-x;float d=length(delta);vec3 v=finiteSource==1?delta/d:sunDirection;vec2 e=edge(x,v);if(e.y>0.5)return vec4(v,0);
 float t=finiteSource==1?min(e.x,d):e.x;return vec4(v,physical.z*sourceScale*(finiteSource==1?pow(referenceDistance/d,2.0):1.0)*exp(-tau(x,v,t)));}
vec2 phases(float c){return vec2(3.0*(1.0+c*c)/(16.0*PI),3.0*(1.0-G*G)*(1.0+c*c)/(8.0*PI*(2.0+G*G)*pow(1.0+G*G-2.0*G*c,1.5)));}
vec3 rotate(float mu,float phi,vec3 n){vec3 helper=abs(n.z)<0.9?vec3(0,0,1):vec3(1,0,0);vec3 a=normalize(cross(helper,n)),b=cross(n,a);return normalize(mu*n+sqrt(max(0.0,1.0-mu*mu))*(cos(phi)*a+sin(phi)*b));}
vec3 scatter(vec3 v,bool mie){float c=0.0;for(int j=0;j<256;j++){float u=random();if(mie){float z=(1.0-G*G)/(1.0-G+2.0*G*u);c=clamp((1.0+G*G-z*z)/(2.0*G),-1.0,1.0);}else c=2.0*u-1.0;if(2.0*random()<=1.0+c*c)return rotate(c,2.0*PI*random(),v);}return vec3(0);}
// Exact mixture optical-depth inversion in a slab avoids arbitrarily long null-collision walks.
float flatFlight(vec3 x,vec3 v,float limit){float target=-log(random()),whole=tau(x,v,limit);if(target>=whole)return limit;
 if(v.z==0.0){vec2 d=density(x);return target/(d.x+d.y);}
 float lo=0.0,hi=limit;for(int i=0;i<40;i++){float mid=(lo+hi)*0.5;if(tau(x,v,mid)<target)lo=mid;else hi=mid;}return (lo+hi)*0.5;}
void fail(){o0=vec4(-1);o1=o0;o2=o0;o3=o0;}
void main(){
 state=firstSeed+uint(gl_FragCoord.x)+256u*uint(gl_FragCoord.y);state^=state>>16u;state*=2246822519u;state^=state>>13u;state*=3266489917u;state^=state>>16u;
 float logEnd=log(1.0+max(0.0,endDistance)/1000.0),t=endDistance<0.0?0.0:1000.0*(exp(random()*logEnd)-1.0),invq=endDistance<0.0?1.0:(t+1000.0)*logEnd;
 vec3 x=origin+t*viewing,v=viewing;float finalT=exp(-tau(origin,viewing,t));vec2 b=density(x);float scattering=b.x+W*b.y;
 vec4 sun=sunlight(x);vec2 terms=invq*sun.w*b*vec2(1,W)*phases(dot(v,sun.xyz));
 float one=terms.x+terms.y,total=one,two=0.0,three=0.0,four=0.0,weight=scattering*invq;
 bool firstMie=random()*scattering>=b.x;float rayleigh=terms.x,mie=terms.y;
 float historyFar=t>=100000.0?one:0.0,weightedLength=one*t,weightedTau=one*(-log(max(finalT,1e-38))),travel=t,maxRadius=t,travelTau=-log(max(finalT,1e-38));
 v=scatter(v,firstMie);if(length(v)==0.0){fail();return;}
 bool finished=false;int depth=1;float rayTwo=0.0,mieTwo=0.0;
 for(int step=0;step<100000;step++){
  vec2 e=edge(x,v);float distance;
  if(flatGeometry==1)distance=flatFlight(x,v,e.x);
  else {
   float closest=clamp(-dot(x,v),0.0,e.x),minH=max(0.0,length(x+closest*v)-R);vec2 maximum=physical.xy*exp(-minH/vec2(HR,HM));float majorant=maximum.x+maximum.y;
   distance=0.0;bool accepted=false;
   for(int j=0;j<100000;j++){distance+=-log(random())/majorant;if(distance>=e.x){accepted=true;break;}vec2 at=density(x+v*distance);if(random()*majorant<at.x+at.y){accepted=true;break;}}
   if(!accepted){fail();return;}
  }
  if(distance>=e.x){finished=true;break;}
  travel+=distance;travelTau+=tau(x,v,distance);x+=distance*v;maxRadius=max(maxRadius,length(x-origin));depth++;
  b=density(x);float extinction=b.x+b.y;sun=sunlight(x);vec2 p=phases(dot(v,sun.xyz));float contribution=weight*sun.w*(b.x*p.x+W*b.y*p.y)/extinction;
  total+=contribution;if(depth==2){two+=contribution;if(firstMie)mieTwo+=contribution;else rayTwo+=contribution;}if(depth==3)three+=contribution;if(depth==4)four+=contribution;
  if(firstMie)mie+=contribution;else rayleigh+=contribution;
  if(maxRadius>=100000.0)historyFar+=contribution;weightedLength+=contribution*travel;weightedTau+=contribution*travelTau;
  scattering=b.x+W*b.y;weight*=scattering/extinction;bool species=random()*scattering>=b.x;
  if(depth>=rouletteStart){if(random()>=0.8){finished=true;break;}weight/=0.8;}
  v=scatter(v,species);if(length(v)==0.0){fail();return;}
 }
 if(!finished){fail();return;}
 o0=finalT*vec4(total,one,two,three);o1=vec4(finalT*four,total,one,t);
 o2=finalT*vec4(rayleigh,mie,historyFar,weightedLength/1000.0);o3=vec4(finalT*weightedTau,float(depth),finalT*rayTwo,finalT*mieTwo);
}`;
}

/** Stream compact moments from one owned browser/GPU job. Rejects unsupported hardware, invalid paths and safety-cap hits.
 * Caller must retain batches, preserve failures, close the browser and respect the outer deadline.
 * @param {string} shader @param {any} request
 * @returns {Promise<any>} Actual hardware telemetry; rejects on shader/device/deadline failures.
 */
export async function executeGpu(shader, request) {
	const start = performance.now(),
		canvas = document.createElement('canvas'),
		gl = canvas.getContext('webgl2', {powerPreference: 'high-performance', antialias: false});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 required');
	const debug = gl.getExtension('WEBGL_debug_renderer_info'),
		renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
	if (/swiftshader|software|llvmpipe/i.test(renderer)) throw new Error('Hardware GPU required');
	const program = gl.createProgram(),
		frame = gl.createFramebuffer(),
		textures = [],
		shaders = [];
	if (!program || !frame) throw new Error('GPU allocation failed');
	const paths = request.paths,
		height = paths / 256;
	if (!Number.isInteger(height)) throw new Error('Batch paths must be a multiple of 256');
	let completed = 0;
	try {
		for (const [kind, source] of [
			[
				gl.VERTEX_SHADER,
				'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}',
			],
			[gl.FRAGMENT_SHADER, shader],
		]) {
			const s = gl.createShader(Number(kind));
			if (!s) throw new Error('Shader allocation failed');
			shaders.push(s);
			gl.shaderSource(s, String(source));
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(String(gl.getShaderInfoLog(s)));
			gl.attachShader(program, s);
		}
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(String(gl.getProgramInfoLog(program)));
		gl.useProgram(program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
		for (let i = 0; i < 4; i++) {
			const texture = gl.createTexture();
			textures.push(texture);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 256, height, 0, gl.RGBA, gl.FLOAT, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
		}
		gl.drawBuffers([0, 1, 2, 3].map((i) => gl.COLOR_ATTACHMENT0 + i));
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
			throw new Error('Incomplete framebuffer');
		gl.viewport(0, 0, 256, height);
		const pixels = Array.from({length: 4}, () => new Float32Array(paths * 4));
		for (const profile of request.profiles) {
			gl.uniform1i(gl.getUniformLocation(program, 'quadrature'), profile.quadrature);
			gl.uniform1i(gl.getUniformLocation(program, 'rouletteStart'), profile.roulette);
			for (let batch = 0; batch < profile.batches; batch++)
				for (let group = 0; group < request.groups.length; group++) {
					if (performance.now() - start > request.maximumMilliseconds)
						throw new Error('Reference GPU deadline');
					const item = request.groups[group],
						m = item.medium,
						c = item.channel;
					for (const [name, value] of [
						['origin', item.origin],
						['viewing', item.direction],
						['sunPosition', m.sourcePosition],
						['sunDirection', m.sourceDirection],
					])
						gl.uniform3fv(
							gl.getUniformLocation(program, String(name)),
							Array.from(/** @type {readonly number[]} */ (value)),
						);
					gl.uniform4fv(gl.getUniformLocation(program, 'physical'), [
						m.rayleigh[c],
						m.mie[c],
						m.sourceIrradiance[c],
						0,
					]);
					gl.uniform1f(gl.getUniformLocation(program, 'endDistance'), item.end);
					gl.uniform1f(gl.getUniformLocation(program, 'sourceScale'), m.incidentScale);
					gl.uniform1f(gl.getUniformLocation(program, 'referenceDistance'), m.referenceDistance);
					gl.uniform1i(gl.getUniformLocation(program, 'flatGeometry'), m.geometry === 'flat' ? 1 : 0);
					gl.uniform1i(gl.getUniformLocation(program, 'finiteSource'), m.sourceKind === 'finite' ? 1 : 0);
					gl.uniform1ui(
						gl.getUniformLocation(program, 'firstSeed'),
						(profile.seed + group * 4194304 + batch * paths) >>> 0,
					);
					gl.drawArrays(gl.TRIANGLES, 0, 3);
					for (let attachment = 0; attachment < 4; attachment++) {
						gl.readBuffer(gl.COLOR_ATTACHMENT0 + attachment);
						gl.readPixels(0, 0, 256, height, gl.RGBA, gl.FLOAT, pixels[attachment]);
					}
					if (gl.getError() !== gl.NO_ERROR || gl.isContextLost()) throw new Error('GPU context failed');
					// 0..13 path metrics, followed by six bins of [total, preTotal, N1, N2, N3, N4, Rayleigh, Mie].
					const sums = Array(62).fill(0);
					let maximumDepth = 0;
					for (let i = 0; i < paths; i++) {
						const p = pixels.map((a) => Array.from(a.subarray(i * 4, i * 4 + 4)));
						if (p.flat().some((x) => !Number.isFinite(x) || x < 0))
							throw new Error('Invalid path or safety cap reached');
						const values = [...p[0], p[1][0], p[1][1], p[1][2], ...p[2], p[3][0], p[3][2], p[3][3]];
						for (let k = 0; k < 14; k++) sums[k] += values[k];
						maximumDepth = Math.max(maximumDepth, p[3][1]);
						const bin = [1e4, 5e4, 1e5, 3e5, 1e6, Infinity].findIndex((edge) => p[1][3] < edge),
							base = 14 + 8 * bin;
						for (const [k, value] of [
							p[0][0],
							p[1][1],
							p[0][1],
							p[0][2],
							p[0][3],
							p[1][0],
							p[2][0],
							p[2][1],
						].entries())
							sums[base + k] += value;
					}
					await globalThis['retainBatch']({
						profile: profile.name,
						group,
						batch,
						means: sums.map((x) => x / paths),
						maximumDepth,
					});
					completed++;
				}
		}
		return {renderer, milliseconds: performance.now() - start, completed};
	} finally {
		for (const s of shaders) gl.deleteShader(s);
		for (const t of textures) gl.deleteTexture(t);
		gl.deleteProgram(program);
		gl.deleteFramebuffer(frame);
		gl.getExtension('WEBGL_lose_context')?.loseContext();
	}
}
