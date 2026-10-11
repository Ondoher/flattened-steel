import * as THREE from 'three';

/** Determine disjoint circle/pixel-square support without cancellation of areas.
 * @param {number} x - Relative pixel centre, pixels.
 * @param {number} y - Relative pixel centre, pixels.
 * @param {number} radius - Actual binary32 uniform radius, pixels.
 * @returns {boolean} - True when mathematical coverage is exactly zero.
 */
function outside(x, y, radius) {
	return Math.hypot(Math.max(Math.abs(x) - 0.5, 0), Math.max(Math.abs(y) - 0.5, 0)) >= radius;
}

/** Draw the unchanged shared coverage shader and read its actual GPU tile.
 * @param {SunCoverageDiagnosticInput} input - Authenticated source shader and captured parameters.
 * @returns {Promise<SunCoverageDiagnosticResult>} - Readback evidence; no atmosphere construction or image modification.
 */
async function readSunCoverage(input) {
	const canvas = document.createElement('canvas');
	document.body.append(canvas);
	const context = canvas.getContext('webgl2', {antialias: false});
	if (!context?.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 required.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.setSize(720, 414, false);
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	const tile = new THREE.WebGLRenderTarget(input.resolution, input.resolution, {
		format: THREE.RedFormat,
		type: THREE.FloatType,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		depthBuffer: false,
		stencilBuffer: false,
		generateMipmaps: false,
	});
	tile.texture.internalFormat = 'R32F';
	const sampleTarget = new THREE.WebGLRenderTarget(10, 10, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: false,
		stencilBuffer: false,
	});
	sampleTarget.texture.internalFormat = 'RGBA32F';
	const strip = /** @param {string} code - Exact GLSL3 input. */ (code) => code.replace(/^#version 300 es\s*/u, '');
	const uniforms = {
		uSunRadiusPixels: {value: input.radius},
		uSunTileSamplesPerPixel: {value: input.samples},
		uSunTileResolution: {value: new THREE.Vector2(input.resolution, input.resolution)},
	};
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader: strip(input.vertex),
		fragmentShader: strip(input.fragment),
		uniforms,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NoBlending,
	});
	const sampler = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader: strip(input.vertex),
		fragmentShader: `precision highp float;
uniform sampler2D uSunCoverageTile;
uniform float uSunRadiusPixels;
uniform vec2 uViewportSizePixels;
uniform vec2 uSunScreenCenterPixels;
uniform float uSunTileSamplesPerPixel;
uniform vec2 uSunTileResolution;
struct ShaderState {vec2 textureCoordinates;};
layout(location=0) out vec4 outValue;
${input.consumer}
void main(){ShaderState state;state.textureCoordinates=(vec2(355.0,202.0)+gl_FragCoord.xy)/uViewportSizePixels;
outValue=vec4(sampleSunCoverageTile(state),0.0,0.0,1.0);}`,
		uniforms: {
			...uniforms,
			uSunCoverageTile: {value: tile.texture},
			uViewportSizePixels: {value: new THREE.Vector2(720, 414)},
			uSunScreenCenterPixels: {value: new THREE.Vector2(input.center[0], input.center[1])},
		},
		depthTest: false,
		depthWrite: false,
		blending: THREE.NoBlending,
	});
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	const scene = new THREE.Scene();
	scene.add(mesh);
	const camera = new THREE.Camera();
	try {
		await renderer.compileAsync(scene, camera);
		renderer.setRenderTarget(tile);
		renderer.render(scene, camera);
		const values = new Float32Array(input.resolution ** 2);
		renderer.readRenderTargetPixels(tile, 0, 0, input.resolution, input.resolution, values);
		mesh.material = sampler;
		await renderer.compileAsync(scene, camera);
		renderer.setRenderTarget(sampleTarget);
		renderer.render(scene, camera);
		const pixels = new Float32Array(10 * 10 * 4);
		renderer.readRenderTargetPixels(sampleTarget, 0, 0, 10, 10, pixels);
		const radius = Math.fround(input.radius);
		/** @type {SunCoverageOutsideSample[]} */ const positive = [];
		let outsideCount = 0;
		for (let y = 0; y < input.resolution; y++)
			for (let x = 0; x < input.resolution; x++) {
				const px = (x + 0.5 - input.resolution / 2) / input.samples,
					py = (y + 0.5 - input.resolution / 2) / input.samples,
					coverage = values[y * input.resolution + x];
				if (!Number.isFinite(coverage) || coverage < 0 || coverage > 1)
					throw new Error('Invalid coverage value.');
				if (outside(px, py, radius)) {
					outsideCount++;
					if (coverage > 0) positive.push({x, y, coverage});
				}
			}
		positive.sort((a, b) => b.coverage - a.coverage);
		/** @type {SunCoverageScreenSample[]} */ const screen = [];
		for (let y = 0; y < 10; y++)
			for (let x = 0; x < 10; x++)
				screen.push({
					x: 355 + x,
					y: 413 - (202 + y),
					coverage: pixels[(y * 10 + x) * 4],
					outside: outside(
						355 + x + 0.5 - Math.fround(input.center[0]),
						202 + y + 0.5 - Math.fround(input.center[1]),
						radius,
					),
				});
		const glError = context.getError();
		if (glError !== 0 || !values.some((v) => v > 0.01)) throw new Error('GPU readback failed.');
		const debug = context.getExtension('WEBGL_debug_renderer_info');
		return {
			schema: 'sun-coverage-readback-v1',
			input,
			tile: Array.from(values),
			outsideCount,
			positiveOutsideCount: positive.length,
			maximumOutsideCoverage: positive[0]?.coverage ?? 0,
			largestOutside: positive.slice(0, 32),
			screen,
			glError,
			renderer: debug ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : 'unavailable',
			scope: 'Unchanged production analytic tile and exact consumer lookup with captured Flat180 parameters; no atmosphere, source spectrum or display conversion.',
		};
	} finally {
		renderer.setRenderTarget(null);
		material.dispose();
		sampler.dispose();
		geometry.dispose();
		tile.dispose();
		sampleTarget.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
	}
}
/** @type {SunCoverageDiagnosticBridge} */ (/** @type {unknown} */ (globalThis)).readSunCoverage = readSunCoverage;
