import assert from 'node:assert/strict';
import {gauss} from './math.mjs';

/** Straight stochastic evaluation of the same transport equation; no physical lookup fields.
 * @param {SkyDirectMedium} m @returns {string}
 */
export function monteCarloFragment(m) {
	assert.ok(m.g > 0 && m.g < 1 && m.albedo >= 0 && m.albedo <= 1);
	const f = (x) => x.toExponential(16);
	const q = gauss(64);
	// Two rules occupy separate mathematical arrays; neither contains physical data.
	const a = (name, xs) => `const float ${name}[${xs.length}]=float[](${xs.map(f).join(',')});`;
	const low = gauss(32);
	return `#version 300 es
precision highp float;
precision highp int;
out vec4 outputValue;
uniform vec3 origin, viewing;
uniform vec4 physical;
uniform uint firstSeed;
uniform int transmissionCount, safetyLimit, rejectionLimit, rouletteStart;
const float PI=3.14159265358979323846;
const float R=${f(m.bottom)}, RT=${f(m.top)}, HR=${f(m.rayleighHeight)}, HM=${f(m.mieHeight)};
const float G=${f(m.g)}, W=${f(m.albedo)};
${a('X32', low.nodes)} ${a('W32', low.weights)}
${a('X64', q.nodes)} ${a('W64', q.weights)}
uint state;
float random(){
 state=state*747796405u+2891336453u;
 uint word=((state>>((state>>28u)+4u))^state)*277803737u;
 word=(word>>22u)^word;
 return (float(word>>9u)+0.5)/8388608.0;
}
vec2 boundary(vec3 x,vec3 v){
 float r=length(x), b=dot(x,v), c=(r-R)*(r+R), disc=b*b-c;
 if(b<0.0 && disc>=0.0)return vec2(max(0.0,c/(-b+sqrt(disc))),1.0);
 float ct=(r-RT)*(r+RT), root=sqrt(max(0.0,b*b-ct));
 return vec2(max(0.0,b>=0.0?-ct/(b+root):-b+root),0.0);
}
vec2 density(vec3 x){float h=max(0.0,length(x)-R);return physical.xy*exp(-h/vec2(HR,HM));}
float sunlight(vec3 x){
 vec2 edge=boundary(x,vec3(0,0,1));if(edge.y>0.5)return 0.0;
 float tau=0.0;
 for(int i=0;i<transmissionCount;i++){
 float t=transmissionCount==32?X32[i]:X64[i];
 float w=transmissionCount==32?W32[i]:W64[i];
 vec2 d=density(x+vec3(0,0,edge.x*t));tau+=w*(d.x+d.y);}
 return physical.z*exp(-edge.x*tau);
}
float kernel(vec2 b,float c){
 float pr=3.0*(1.0+c*c)/(16.0*PI);
 float pm=3.0*(1.0-G*G)*(1.0+c*c)/(8.0*PI*(2.0+G*G)*pow(1.0+G*G-2.0*G*c,1.5));
 return b.x*pr+b.y*W*pm;
}
vec3 direction(float mu,float phi,vec3 n){
 vec3 helper=abs(n.z)<0.9?vec3(0,0,1):vec3(1,0,0);
 vec3 a=normalize(cross(helper,n)),b=cross(n,a);
 return normalize(mu*n+sqrt(max(0.0,1.0-mu*mu))*(cos(phi)*a+sin(phi)*b));
}
void main(){
 state=firstSeed+uint(gl_FragCoord.x)+256u*uint(gl_FragCoord.y);
 // Scramble adjacent independent path starts before drawing the first variate.
 state^=state>>16u;state*=2246822519u;state^=state>>13u;state*=3266489917u;state^=state>>16u;
 vec3 x=origin,v=normalize(viewing);float weight=1.0,total=0.0,one=0.0,two=0.0;
 float majorant=physical.x+physical.y;
 int depth=0;bool finished=false;
 vec2 edge=boundary(x,v);float distance=0.0;
 for(int step=0;step<safetyLimit;step++){
 distance+=majorant>0.0?-log(random())/majorant:1e30;
 bool ground=distance>=edge.x && edge.y>0.5;
 if(distance>=edge.x && !ground){finished=true;break;}
 vec3 at=x+min(distance,edge.x)*v;
 vec2 b=density(at);float extinction=b.x+b.y;
 if(!ground && random()*majorant>=extinction)continue;
 depth++;
 float contribution;
 if(ground){
 vec3 normal=normalize(at);at=R*normal;
 contribution=weight*physical.w/PI*sunlight(at)*max(0.0,normal.z);
 weight*=physical.w;
 v=direction(sqrt(random()),2.0*PI*random(),normal);
 }else{
 contribution=weight*sunlight(at)*kernel(b,v.z)/extinction;
 float scattering=b.x+W*b.y;weight*=scattering/extinction;
 bool mie=random()*scattering>=b.x;
 float cosine=0.0;bool accepted=false;
 for(int j=0;j<rejectionLimit;j++){
 float u=random();
 if(mie){float z=(1.0-G*G)/(1.0-G+2.0*G*u);cosine=clamp((1.0+G*G-z*z)/(2.0*G),-1.0,1.0);}
 else cosine=2.0*u-1.0;
 if(2.0*random()<=1.0+cosine*cosine){accepted=true;break;}}
 if(!accepted){outputValue=vec4(-1);return;}
 v=direction(cosine,2.0*PI*random(),v);
 }
 total+=contribution;if(depth==1)one+=contribution;if(depth==2)two+=contribution;
 if(weight==0.0){finished=true;break;}
 if(depth>=rouletteStart){if(random()>=0.8){finished=true;break;}weight/=0.8;}
 x=at;edge=boundary(x,v);distance=0.0;
 }
 outputValue=finished?vec4(total,one,two,float(depth)):vec4(-1);
}`;
}

/** Browser-side streaming Monte Carlo; only shader program and mathematical rules are reused.
 * Each path independently recomputes densities, solar transmission and all scattering.
 * @param {string} shader @param {SkyMcRequest} request @returns {Promise<SkyMcExecution>}
 */
export async function monteCarloGpu(shader, request) {
	const start = performance.now();
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {powerPreference: 'high-performance', antialias: false});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 unavailable');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
	if (/swiftshader|software|llvmpipe/i.test(renderer)) throw new Error('Hardware GPU required');
	const program = gl.createProgram(),
		target = gl.createTexture(),
		frame = gl.createFramebuffer();
	const shaders = [];
	if (!program || !target || !frame) throw new Error('GPU allocation failed');
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
		const compileMilliseconds = performance.now() - start;
		gl.useProgram(program);
		gl.bindTexture(gl.TEXTURE_2D, target);
		const width = 256,
			height = request.pathsPerBatch / width;
		if (!Number.isInteger(height)) throw new Error('Invalid batch dimensions');
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
			throw new Error('Incomplete framebuffer');
		gl.viewport(0, 0, width, height);
		gl.uniform1i(gl.getUniformLocation(program, 'safetyLimit'), 100000);
		gl.uniform1i(gl.getUniformLocation(program, 'rejectionLimit'), 128);
		const pixels = new Float32Array(request.pathsPerBatch * 4);
		let completed = 0;
		for (const profile of request.profiles) {
			gl.uniform1i(gl.getUniformLocation(program, 'transmissionCount'), profile.transmission);
			gl.uniform1i(gl.getUniformLocation(program, 'rouletteStart'), profile.rouletteStart);
			for (let batch = 0; batch < profile.batches; batch++) {
				for (let group = 0; group < request.groups.length; group++) {
					if (performance.now() - start > request.maximumMilliseconds)
						throw new Error('Monte Carlo execution deadline');
					const item = request.groups[group];
					gl.uniform3fv(gl.getUniformLocation(program, 'origin'), item.origin);
					gl.uniform3fv(gl.getUniformLocation(program, 'viewing'), item.direction);
					gl.uniform4fv(gl.getUniformLocation(program, 'physical'), item.physical);
					// Disjoint initial states across groups/batches; repeated profiles use common random numbers.
					gl.uniform1ui(
						gl.getUniformLocation(program, 'firstSeed'),
						(group * 16777216 + batch * request.pathsPerBatch + profile.seedOffset) >>> 0,
					);
					gl.drawArrays(gl.TRIANGLES, 0, 3);
					gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);
					if (gl.getError() !== gl.NO_ERROR || gl.isContextLost()) throw new Error('GPU execution failed');
					const sums = [0, 0, 0, 0];
					let maximumDepth = 0;
					for (let i = 0; i < pixels.length; i += 4) {
						for (let c = 0; c < 4; c++)
							if (!Number.isFinite(pixels[i + c]) || pixels[i + c] < 0)
								throw new Error('Invalid path or safety limit reached');
						for (let c = 0; c < 3; c++) sums[c] += pixels[i + c];
						sums[3] += pixels[i] - pixels[i + 1] - pixels[i + 2];
						maximumDepth = Math.max(maximumDepth, pixels[i + 3]);
					}
					await globalThis['retainBatch']({
						profile: profile.name,
						group,
						batch,
						means: sums.map((x) => x / request.pathsPerBatch),
						maximumDepth,
					});
					completed++;
				}
			}
		}
		return {renderer, compileMilliseconds, milliseconds: performance.now() - start, completed};
	} finally {
		for (const s of shaders) gl.deleteShader(s);
		gl.deleteProgram(program);
		gl.deleteTexture(target);
		gl.deleteFramebuffer(frame);
		gl.getExtension('WEBGL_lose_context')?.loseContext();
	}
}

/** Independent batch uncertainty; interval describes sampling only, not model/input error.
 * @param {readonly number[]} values @returns {SkyMcEstimate}
 */
export function estimate(values) {
	assert.ok(values.length >= 2 && values.every(Number.isFinite));
	const mean = values.reduce((s, x) => s + x, 0) / values.length;
	const standardError = Math.sqrt(
		values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length * (values.length - 1)),
	);
	return {mean, standardError, halfWidth95: 2.04 * standardError, batches: values.length};
}
