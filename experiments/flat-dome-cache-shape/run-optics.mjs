import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {cases, controlCases, medium, transportDirections} from './physical.mjs';
import {interval} from './geometry.mjs';
import {column} from './direct.mjs';
import {candidateShader} from './candidate-shader.mjs';
import {gauss} from './math.mjs';
import {createRun, checked, identity} from './io.mjs';

const run = createRun('m3-optics', [
	identity('tmp/experiments/flat-dome-cache-shape/runs/00014-m3-cache-sweep/manifest.json'),
]);
let browser;
let failure;
try {
	const physical = [...cases(), ...controlCases()];
	const build = candidateShader(transportDirections(), gauss(24), gauss(64)).build;
	const shader =
		build.slice(0, build.indexOf('layout(location=0)out')) +
		`
layout(location=0)out vec4 value;
void main(){int x=int(gl_FragCoord.x),i=int(gl_FragCoord.y),g=x%4;vec4 p=texelFetch(uQueries,ivec2(0,i),0),v=texelFetch(uQueries,ivec2(1,i),0);vec3 start=p.xyz+p.w*v.xyz;
if(x<4){vec3 delta=vec3(uSunRadius,0.0,4828032.0)-start;vec3 sun=normalize(delta);value=transmission(start,sun,min(length(delta),capExit(start,sun)),g);}
else value=transmission(start,v.xyz,max(0.0,v.w-p.w),g);}`;
	run.write('kernel.glsl', shader);
	const profile = path.join(run.root, 'browser');
	mkdirSync(profile);
	checked(profile, run.root);
	browser = await puppeteer.launch({
		headless: 'new',
		userDataDir: profile,
		args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
	});
	const page = await browser.newPage();
	const output = await page.evaluate(
		(source, selected) => {
			const canvas = document.createElement('canvas');
			const gl = canvas.getContext('webgl2');
			if (!gl?.getExtension('EXT_color_buffer_float')) {
				throw new Error('Actual WebGL2 float render targets required.');
			}
			const compile = (kind, text) => {
				const shader = gl.createShader(kind);
				gl.shaderSource(shader, text);
				gl.compileShader(shader);
				if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
					throw new Error(gl.getShaderInfoLog(shader));
				}
				return shader;
			};
			const program = gl.createProgram();
			gl.attachShader(
				program,
				compile(
					gl.VERTEX_SHADER,
					'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}',
				),
			);
			gl.attachShader(program, compile(gl.FRAGMENT_SHADER, source));
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				throw new Error(gl.getProgramInfoLog(program));
			}
			gl.useProgram(program);
			const rows = [];
			for (const sourceRadius of [...new Set(selected.map((item) => item.sourceRadius))]) {
				const group = selected.filter((item) => item.sourceRadius === sourceRadius);
				const input = gl.createTexture();
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, input);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				gl.texImage2D(
					gl.TEXTURE_2D,
					0,
					gl.RGBA32F,
					2,
					group.length,
					0,
					gl.RGBA,
					gl.FLOAT,
					new Float32Array(
						group.flatMap((item) => [...item.origin, item.entry, ...item.direction, item.end]),
					),
				);
				gl.uniform1i(gl.getUniformLocation(program, 'uQueries'), 0);
				gl.uniform1f(gl.getUniformLocation(program, 'uSunRadius'), sourceRadius);
				const target = gl.createTexture();
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, target);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 8, group.length, 0, gl.RGBA, gl.FLOAT, null);
				const fb = gl.createFramebuffer();
				gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
				gl.viewport(0, 0, 8, group.length);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
				const values = new Float32Array(group.length * 32);
				gl.readPixels(0, 0, 8, group.length, gl.RGBA, gl.FLOAT, values);
				for (let i = 0; i < group.length; i++) {
					rows.push({
						id: group[i].id,
						source: Array.from(values.slice(i * 32, i * 32 + 15)),
						view: Array.from(values.slice(i * 32 + 16, i * 32 + 31)),
					});
				}
				gl.deleteFramebuffer(fb);
				gl.deleteTexture(input);
				gl.deleteTexture(target);
			}
			gl.getExtension('WEBGL_lose_context')?.loseContext();
			return rows;
		},
		shader,
		physical,
	);
	const rows = output.map((row) => {
		const item = physical.find((item) => item.id === row.id);
		const start = item.origin.map((v, k) => v + item.entry * item.direction[k]);
		const delta = [item.sourceRadius - start[0], -start[1], 4828032 - start[2]];
		const direction = delta.map((v) => v / Math.hypot(...delta));
		const sourceLength = Math.min(Math.hypot(...delta), interval(start, direction).exit);
		const expected = (direction, distance) =>
			medium.wavelengths.map((_, c) =>
				Math.exp(
					-medium.rayleigh[c] * column(start[2], direction[2], distance, 8000) -
						medium.mie[c] * column(start[2], direction[2], distance, 1200),
				),
			);
		const source = expected(direction, sourceLength);
		const view = expected(item.direction, item.end - item.entry);
		assert.ok([...row.source, ...row.view].every((v) => Number.isFinite(v) && v >= 0 && v <= 1.000001));
		return {
			...row,
			expectedSource: source,
			expectedView: view,
			sourceAbsoluteError: Math.max(...source.map((v, c) => Math.abs(v - row.source[c]))),
			viewAbsoluteError: Math.max(...view.map((v, c) => Math.abs(v - row.view[c]))),
		};
	});
	run.write('results.json', {
		rows,
		scope: 'Actual candidate source/view transmission shader evaluated against independent binary64 cap intersections and exact exponential columns on567 development rays plus9 controls. This validates attenuation, not interpolation or scattering orders.',
		maximumSourceAbsoluteError: Math.max(...rows.map((r) => r.sourceAbsoluteError)),
		maximumViewAbsoluteError: Math.max(...rows.map((r) => r.viewAbsoluteError)),
	});
	console.log(
		JSON.stringify({
			run: run.root,
			maximumSourceAbsoluteError: Math.max(...rows.map((r) => r.sourceAbsoluteError)),
			maximumViewAbsoluteError: Math.max(...rows.map((r) => r.viewAbsoluteError)),
		}),
	);
} catch (error) {
	failure = error;
	run.write('failure.json', {error: String(error), stack: error.stack});
} finally {
	await browser?.close().catch((error) => {
		failure ??= error;
	});
	run.finish(failure ? 'failed' : 'accepted', {
		message: failure
			? String(failure)
			: 'Finite physical shader attenuation and independent binary64 comparisons retained.',
	});
}
if (failure) {
	throw failure;
}
