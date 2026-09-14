import puppeteer from 'puppeteer';
import {createDistantSunSceneCacheCommonShaderSource as original} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
import {createDistantSunSceneCacheCommonShaderSource as candidate} from './compiler/DistantSunSceneCacheGpuCompiler.js';
import {StrobingRun} from './StrobingRun.js';

const run = await StrobingRun.allocate('ground-probe');
let browser;
try {
	const configuration = {
		wavelengthNanometers: 550,
		sourceIrradiance: 1,
		ozoneCrossSection: 0,
		ozoneMaximumDensity: 0,
	};
	const shaders = {original: original(configuration), candidate: candidate(configuration)};
	await run.writeJson('shader-inputs.json', {
		configuration,
		shaders,
		derivation:
			'Exact common shader factory output; ground representative point at each of 180 solar knots; inspect radius error, outward intersection, inward branch, and source transmittance.',
	});
	browser = await puppeteer.launch({
		headless: 'new',
		executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		userDataDir: await StrobingRun.ensureDirectory(run.directory, 'browser-profile'),
		args: [
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			'--use-angle=d3d11',
			'--disable-software-rasterizer',
		],
	});
	const page = await browser.newPage();
	const measurements = await page.evaluate((sources) => {
		const gl = document.createElement('canvas').getContext('webgl2');
		if (!gl || !gl.getExtension('EXT_color_buffer_float'))
			throw new Error('Float WebGL2 measurement is unavailable.');
		const compile = (kind, source) => {
			const shader = gl.createShader(kind);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
			return shader;
		};
		const rows = {};
		for (const [name, common] of Object.entries(sources)) {
			const vertex = compile(
				gl.VERTEX_SHADER,
				'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0.0,1.0);}',
			);
			const fragment = compile(
				gl.FRAGMENT_SHADER,
				`#version 300 es\nprecision highp float;precision highp int;\n${common}\nlayout(location=0) out vec4 result;void main(){vec3 p=representativePoint(0,int(gl_FragCoord.x));vec3 n=normalize(p);result=vec4(length(p)-BOTTOM_RADIUS,firstPositiveRoot(sphereRoots(p,n,BOTTOM_RADIUS)),atmosphereBranchLength(p,-n),sourceTransmittance(p));}`,
			);
			const program = gl.createProgram();
			gl.attachShader(program, vertex);
			gl.attachShader(program, fragment);
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
			const texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 180, 1);
			const framebuffer = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
			if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
				throw new Error('Probe framebuffer is incomplete.');
			gl.useProgram(program);
			gl.viewport(0, 0, 180, 1);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			const values = new Float32Array(180 * 4);
			gl.readPixels(0, 0, 180, 1, gl.RGBA, gl.FLOAT, values);
			if (gl.getError() !== gl.NO_ERROR) throw new Error('GPU ground probe failed.');
			rows[name] = Array.from({length: 180}, (_, index) => ({
				zenithDegrees: index + 0.5,
				radiusError: values[index * 4],
				outwardGroundDistance: values[index * 4 + 1],
				inwardAtmosphereBranch: values[index * 4 + 2],
				sourceTransmittance: values[index * 4 + 3],
			}));
			gl.deleteFramebuffer(framebuffer);
			gl.deleteTexture(texture);
			gl.deleteProgram(program);
			gl.deleteShader(vertex);
			gl.deleteShader(fragment);
		}
		return rows;
	}, shaders);
	await run.writeJson('measurements.json', measurements);
	await browser.close();
	browser = undefined;
	await run.finish('accepted', {purpose: 'gpu-ground-intersection-diagnosis', variants: Object.keys(measurements)}, [
		'browser-profile',
	]);
} catch (error) {
	await browser?.close();
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)}, ['browser-profile']);
	process.exitCode = 1;
}
