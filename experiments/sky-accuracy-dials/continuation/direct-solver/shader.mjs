import assert from 'node:assert/strict';
import {gauss} from './math.mjs';

/** Literal float for authored numerical quadrature and original physical inputs. @param {number} x */
const f = (x) => {
	assert.ok(Number.isFinite(x));
	return x.toExponential(16);
};
/** Build direct nested integration, with recursion expanded only to the requested order.
 * Every transmission and incident radiance is recomputed at its physical query.
 * @param {SkyDirectMedium} medium @param {SkyDirectProfile} p @param {SkyDirectRay} ray @param {number} order
 * @returns {string}
 */
export function fragment(medium, p, ray, order) {
	assert.ok(order >= 1 && order <= 4 && Number.isInteger(order));
	const array = (name, values) => `const float ${name}[${values.length}]=float[](${values.map(f).join(',')});`;
	const rule = (name, n) => {
		const q = gauss(n);
		return array(name + 'X', q.nodes) + '\n' + array(name + 'W', q.weights);
	};
	const vec = (xs) => `vec${xs.length}(${xs.map(f).join(',')})`;
	let source = `#version 300 es
precision highp float;
precision highp int;
out vec4 outputValue;
uniform int offset;
const float PI=3.14159265358979323846;
const float R=${f(medium.bottom)}, RT=${f(medium.top)};
const float HR=${f(medium.rayleighHeight)}, HM=${f(medium.mieHeight)}, G=${f(medium.g)}, W=${f(medium.albedo)};
const vec4 BR=${vec(medium.rayleigh)}, BM=${vec(medium.mie)}, ES=${vec(medium.sun)}, A=${vec(medium.ground)};
${rule('P', p.path)}
${rule('V', p.view)}
${rule('T', p.transmission)}
${rule('M', p.mu)}
vec2 boundary(vec3 x,vec3 v){
 float r=length(x), b=dot(x,v), c=(r-R)*(r+R), disc=b*b-c;
 if(b<0.0 && disc>=0.0)return vec2(max(0.0,c/(-b+sqrt(disc))),1.0);
 float ct=(r-RT)*(r+RT), root=sqrt(b*b-ct);
 return vec2(b>=0.0?-ct/(b+root):-b+root,0.0);
}
vec4 extinction(vec3 x){float h=max(0.0,length(x)-R);return BR*exp(-h/HR)+BM*exp(-h/HM);}
vec4 transmission(vec3 x,vec3 v,float d){
 vec4 tau=vec4(0.0);
 for(int i=0;i<${p.transmission};i++)tau+=TW[i]*extinction(x+d*TX[i]*v);
 return exp(-d*tau);
}
vec4 sunlight(vec3 x){vec2 b=boundary(x,vec3(0,0,1));return b.y>0.5?vec4(0):ES*transmission(x,vec3(0,0,1),b.x);}
vec4 kernel(vec3 x,float c){
 float h=max(0.0,length(x)-R), pr=3.0/(16.0*PI)*(1.0+c*c);
 float pm=3.0/(8.0*PI)*(1.0-G*G)/(2.0+G*G)*(1.0+c*c)/pow(1.0+G*G-2.0*G*c,1.5);
 return BR*exp(-h/HR)*pr+BM*W*exp(-h/HM)*pm;
}
vec3 direction(float mu,float phi,vec3 n){
 vec3 helper=abs(n.z)<0.9?vec3(0,0,1):vec3(1,0,0);
 vec3 a=normalize(cross(helper,n)), b=cross(n,a);
 return mu*n+sqrt(max(0.0,1.0-mu*mu))*(cos(phi)*a+sin(phi)*b);
}
`;
	for (let n = 1; n <= order; n++) {
		source += `vec4 ground${n}(vec3 x){\n`;
		if (n === 1) source += 'return A/PI*sunlight(x)*max(0.0,normalize(x).z);}\n';
		else
			source += `vec4 sum=vec4(0);vec3 normal=normalize(x);
 for(int m=0;m<${p.mu};m++)for(int j=0;j<${p.phi};j++){
 vec3 u=direction(MX[m],2.0*PI*(float(j)+0.5)/${f(p.phi)},normal);
 sum+=MW[m]*MX[m]*light${n - 1}(x,u);}
 return A*${f(2 / p.phi)}*sum;}\n`;
		source += `vec4 source${n}(vec3 x,vec3 v){\n`;
		if (n === 1) source += 'return sunlight(x)*kernel(x,v.z);}\n';
		else
			source += `vec4 sum=vec4(0);
 for(int m=0;m<${p.mu};m++)for(int j=0;j<${p.phi};j++){
 vec3 u=direction(2.0*MX[m]-1.0,2.0*PI*(float(j)+0.5)/${f(p.phi)},vec3(0,0,1));
 sum+=MW[m]*kernel(x,dot(v,u))*light${n - 1}(x,u);}
 return ${f((4 * Math.PI) / p.phi)}*sum;}\n`;
		source += `vec4 light${n}(vec3 x,vec3 v){
 vec2 b=boundary(x,v);vec4 sum=vec4(0);
 if(b.y>0.5)sum=transmission(x,v,b.x)*ground${n}(x+b.x*v);
 for(int i=0;i<${p.path};i++){float t=b.x*PX[i];sum+=b.x*PW[i]*transmission(x,v,t)*source${n}(x+t*v,v);}
 return sum;}\n`;
	}
	// Parallelize independent terms of the outer integrals, not a cached intermediate field.
	source += `void main(){
 int index=offset+int(gl_FragCoord.x);vec3 x=${vec(ray.origin)},v=${vec(ray.direction)};
 vec2 b=boundary(x,v);
 `;
	if (order === 1)
		source += `if(index>=${p.view}){outputValue=vec4(0);return;}
 float t=b.x*VX[index];outputValue=b.x*VW[index]*transmission(x,v,t)*source1(x+t*v,v);`;
	else
		source += `if(index>=${p.view * p.mu * p.phi}){outputValue=vec4(0);return;}
 int i=index/${p.mu * p.phi},m=(index/${p.phi})%${p.mu},j=index%${p.phi};
 float t=b.x*VX[i];vec3 at=x+t*v;
 vec3 u=direction(2.0*MX[m]-1.0,2.0*PI*(float(j)+0.5)/${f(p.phi)},vec3(0,0,1));
 outputValue=b.x*VW[i]*transmission(x,v,t)*${f((4 * Math.PI) / p.phi)}*MW[m]*kernel(at,dot(v,u))*light${order - 1}(at,u);`;
	source += '\n}';
	assert.ok(!/sampler|texture\s*\(/.test(source), 'Physical lookup is forbidden');
	return source;
}

/** Execute a small direct-integration shader in hardware; output texture is readback only.
 * @param {string} shader @param {number} count @returns {Promise<SkyDirectGpuResult>}
 */
export async function gpu(shader, count) {
	const start = performance.now(),
		canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {powerPreference: 'high-performance', antialias: false});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 unavailable');
	const debug = gl.getExtension('WEBGL_debug_renderer_info'),
		renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
	if (/swiftshader|software|llvmpipe/i.test(renderer)) throw new Error('Hardware GPU required');
	const shaders = [];
	const program = gl.createProgram(),
		target = gl.createTexture(),
		frame = gl.createFramebuffer();
	if (!program || !target || !frame) throw new Error('WebGL allocation failed');
	try {
		for (const [kind, text] of [
			[
				gl.VERTEX_SHADER,
				'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}',
			],
			[gl.FRAGMENT_SHADER, shader],
		]) {
			const s = gl.createShader(Number(kind));
			if (!s) throw new Error('Shader allocation failed');
			shaders.push(s);
			gl.shaderSource(s, String(text));
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(String(gl.getShaderInfoLog(s)));
			gl.attachShader(program, s);
		}
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(String(gl.getProgramInfoLog(program)));
		gl.useProgram(program);
		gl.bindTexture(gl.TEXTURE_2D, target);
		const width = Math.min(128, count);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, 1, 0, gl.RGBA, gl.FLOAT, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
			throw new Error('Incomplete output framebuffer');
		gl.viewport(0, 0, width, 1);
		const values = [0, 0, 0, 0],
			pixels = new Float32Array(width * 4);
		for (let offset = 0; offset < count; offset += width) {
			gl.uniform1i(gl.getUniformLocation(program, 'offset'), offset);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			gl.readPixels(0, 0, width, 1, gl.RGBA, gl.FLOAT, pixels);
			if (gl.getError() !== gl.NO_ERROR || gl.isContextLost()) throw new Error('GPU execution failed');
			for (let j = 0; j < Math.min(width, count - offset); j++)
				for (let c = 0; c < 4; c++) {
					const x = pixels[j * 4 + c];
					if (!Number.isFinite(x) || x < 0) throw new Error('Invalid direct contribution');
					values[c] += x;
				}
			if (offset % 1024 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
		}
		return {values, renderer, milliseconds: performance.now() - start, contributions: count};
	} finally {
		for (const s of shaders) gl.deleteShader(s);
		gl.deleteProgram(program);
		gl.deleteTexture(target);
		gl.deleteFramebuffer(frame);
		gl.getExtension('WEBGL_lose_context')?.loseContext();
	}
}
