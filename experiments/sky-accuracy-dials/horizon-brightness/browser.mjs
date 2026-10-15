/** Probe the actual Three raw-material screen path with and without explicit sRGB encoding.
 * @param {string} library Authenticated self-contained Three CommonJS build.
 * @param {readonly number[]} values Linear neutral test values, bounded to [0,1].
 * @returns {HorizonBrightnessGpu} Canvas bytes; shader/context failures reject the enclosing browser evaluation.
 */
export function probe(library, values) {
	const exports = {};
	new Function('exports', library)(exports);
	const T = /** @type {HorizonBrightnessThree} */ (exports);
	const renderer = new T.WebGLRenderer({antialias: false, preserveDrawingBuffer: true});
	renderer.setSize(values.length, 1, false);
	renderer.outputColorSpace = T.SRGBColorSpace;
	renderer.toneMapping = T.NoToneMapping;
	const gl = renderer.getContext(),
		debug = gl.getExtension('WEBGL_debug_renderer_info');
	const scene = new T.Scene(),
		camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	const geometry = new T.PlaneGeometry(2, 2);
	const cases = values.map((v, i) => `if (int(gl_FragCoord.x)==${i}) v=${v.toFixed(12)};`).join('\n');
	const rawBytes = [],
		encodedBytes = [];
	try {
		for (const encoded of [false, true]) {
			const material = new T.RawShaderMaterial({
				glslVersion: T.GLSL3,
				depthTest: false,
				depthWrite: false,
				vertexShader: 'in vec3 position; void main(){gl_Position=vec4(position,1.0);}',
				fragmentShader: `precision highp float; out vec4 outColor; void main(){float v=0.0; ${cases}
				${encoded ? 'v=v<=0.0031308?12.92*v:1.055*pow(v,1.0/2.4)-0.055;' : ''}
				outColor=vec4(vec3(v),1.0);}`,
			});
			const mesh = new T.Mesh(geometry, material);
			scene.add(mesh);
			try {
				renderer.setRenderTarget(null);
				renderer.render(scene, camera);
				const bytes = new Uint8Array(values.length * 4);
				gl.readPixels(0, 0, values.length, 1, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
				(encoded ? encodedBytes : rawBytes).push(...values.map((_, i) => bytes[i * 4]));
			} finally {
				scene.remove(mesh);
				material.dispose();
			}
		}
		return {
			renderer: String(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)),
			revision: T.REVISION,
			values,
			rawBytes,
			encodedBytes,
			error: gl.getError(),
		};
	} finally {
		geometry.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
	}
}
