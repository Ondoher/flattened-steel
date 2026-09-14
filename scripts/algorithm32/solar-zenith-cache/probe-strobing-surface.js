import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import {DistantSunSceneCacheCompilerInputs} from './DistantSunSceneCacheCompilerInputs.js';
import {DistantSunPointLocalProfileCompilerInputs} from './DistantSunPointLocalProfileCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
import {createDistantSunSceneCacheCommonShaderSource} from './DistantSunSceneCacheGpuCompiler.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';

const repository = fileURLToPath(new URL('../../../', import.meta.url));
const files = new Files(repository);
assert.ok(
	process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--anchored'),
	'Usage: probe-strobing-surface.js [--anchored]',
);
const limits = process.argv.includes('--anchored') ? ['anchored'] : [2, 4, 8];
const run = `tmp/production-algorithm32/distant-sun-strobing-promotion/surface-${randomUUID()}`;
await files.directory(run);
const artifacts = [];
const write = async (name, value) => {
	const artifact = await files.write(`${run}/${name}`, Buffer.from(`${JSON.stringify(value)}\n`));
	artifacts.push(artifact);
	return artifact;
};
const profiles = [
	DistantSunSceneCacheCompilerInputs.createInputSet(
		DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene(),
	),
	DistantSunPointLocalProfileCompilerInputs.createInputSet(
		createBrunetonProductionProfile({
			time: '10:15',
			fittedAzimuthDegrees: 98.59994923191232,
			maximumScatteringOrder: 4,
		}),
	),
];
const altitudes = profiles[0].buildRequest.transportSpec.domains.position.nodes.map((node) => node.altitudeMeters);
const heights = [
	...new Set([0, 1.7, 2, 4, 8, altitudes[1], altitudes[2], altitudes[1] / 2, (altitudes[1] + altitudes[2]) / 2]),
];
const angles = [0.5, 30, 60, 80, 89.5, 89.75, 90, 90.25, 90.5, 90.75, 91, 91.5, 96, 107.5];

/** Independent binary64 direct-light solution at the logical physical height. */
function reference(spec, channel, height, degrees) {
	const radius = spec.planet.bottomRadiusMeters + height;
	const cosine = Math.cos((degrees * Math.PI) / 180);
	const projection = radius * cosine;
	const groundTerm = height * (radius + spec.planet.bottomRadiusMeters);
	const blocked = projection < 0 && projection * projection >= groundTerm;
	const topTerm = (radius - spec.planet.topRadiusMeters) * (radius + spec.planet.topRadiusMeters);
	const root = Math.sqrt(projection * projection - topTerm);
	const length = projection >= 0 ? -topTerm / (projection + root) : -projection + root;
	const atmosphere = spec.atmosphere;
	channel = {
		...channel,
		rayleighScatteringPerMeter:
			channel.rayleighScatteringPerMeter ??
			atmosphere.rayleighCoefficientScalePerMeter * (channel.centerNanometers / 1000) ** -4,
		mieExtinctionPerMeter:
			channel.mieExtinctionPerMeter ??
			(atmosphere.mieAngstromBeta / atmosphere.mieScaleHeightMeters) *
				(channel.centerNanometers / 1000) ** -atmosphere.mieAngstromAlpha,
	};
	const extinction = (altitude) =>
		channel.rayleighScatteringPerMeter * Math.exp(-altitude / atmosphere.rayleighScaleHeightMeters) +
		channel.mieExtinctionPerMeter * Math.exp(-altitude / atmosphere.mieScaleHeightMeters);
	let depth = 0;
	const count = spec.numerical.sourcePathTransmittanceIntervalCount,
		step = length / count;
	for (let index = 0; index <= count; index++) {
		const distance = step * index;
		const altitude =
			Math.sqrt(radius * radius + 2 * projection * distance + distance * distance) -
			spec.planet.bottomRadiusMeters;
		depth += (index === 0 || index === count ? 0.5 : 1) * extinction(Math.max(0, altitude)) * step;
	}
	const transmittance = blocked ? 0 : Math.exp(-depth);
	const density = (cosine) => {
		const rayleighPhase = (3 / (16 * Math.PI)) * (1 + cosine * cosine),
			g = atmosphere.miePhaseFunctionG;
		const miePhase =
			((((3 / (8 * Math.PI)) * (1 - g * g)) / (2 + g * g)) * (1 + cosine * cosine)) /
			(1 + g * g - 2 * g * cosine) ** 1.5;
		return (
			channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
			transmittance *
			(channel.rayleighScatteringPerMeter *
				Math.exp(-height / atmosphere.rayleighScaleHeightMeters) *
				rayleighPhase +
				channel.mieExtinctionPerMeter *
					atmosphere.mieSingleScatteringAlbedo *
					Math.exp(-height / atmosphere.mieScaleHeightMeters) *
					miePhase)
		);
	};
	return [transmittance, density(cosine), density(-cosine), density(-Math.sin((degrees * Math.PI) / 180))];
}

let browser;
const heartbeat = setInterval(
	() => process.stdout.write(`${JSON.stringify({run, phase: 'surface-direct-reference'})}\n`),
	25000,
);
try {
	const sources = [];
	for (const name of [
		'probe-strobing-surface.js',
		'DistantSunSceneCacheGpuCompiler.js',
		'DistantSunSceneCacheNumerics.js',
		'DistantSunSceneCacheCompilerInputs.js',
		'DistantSunPointLocalProfileCompilerInputs.js',
	]) {
		const relativePath = `scripts/algorithm32/solar-zenith-cache/${name}`,
			bytes = await files.read(relativePath);
		sources.push({path: relativePath, byteLength: bytes.length, sha256: files.hash(bytes)});
	}
	await write('definition.json', {
		profiles,
		heights,
		angles,
		limits,
		sources,
		operation:
			'Production common shader vs independent binary64 N1 and source transmittance at logical height; same trapezoidal source integration',
		limitations: ['Necessary first-order screen; N2, N3 and cumulative N4 remain separate.'],
	});
	browser = await puppeteer.launch({
		headless: true,
		executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		userDataDir: await files.directory(`${run}/browser-profile`),
		args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-software-rasterizer'],
	});
	const page = await browser.newPage();
	const comparisons = [],
		summaries = [];
	for (const [profileIndex, profile] of profiles.entries())
		for (const limit of limits) {
			const spec = profile.buildRequest.transportSpec;
			const numericalPolicy =
				limit === 'anchored'
					? DistantSunSceneCacheNumerics.createAnchoredRadial()
					: DistantSunSceneCacheNumerics.createSurfaceLimit(Number(limit));
			let failures = 0,
				maximumRatio = 0,
				worst;
			for (const [channelIndex, channel] of spec.domains.spectrum.channels.entries()) {
				const common = createDistantSunSceneCacheCommonShaderSource({
					wavelengthNanometers: channel.centerNanometers,
					sourceIrradiance: channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
					ozoneCrossSection: 0,
					ozoneMaximumDensity: 0,
					rayleighScattering: channel.rayleighScatteringPerMeter,
					mieExtinction: channel.mieExtinctionPerMeter,
					groundAlbedo: channel.groundAlbedo,
					...spec.planet,
					...spec.atmosphere,
					sourcePathTransmittanceIntervalCount: spec.numerical.sourcePathTransmittanceIntervalCount,
					positionAltitudesMeters: heights,
					solarZenithDegrees: angles,
					numericalPolicy,
				});
				const values = await page.evaluate(
					({common, width, height}) => {
						const gl = document.createElement('canvas').getContext('webgl2');
						if (!gl || !gl.getExtension('EXT_color_buffer_float'))
							throw new Error('Surface probe requires Float32 render targets.');
						const compile = (type, source) => {
							const shader = gl.createShader(type);
							gl.shaderSource(shader, source);
							gl.compileShader(shader);
							if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
								throw new Error(gl.getShaderInfoLog(shader));
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
						gl.attachShader(
							program,
							compile(
								gl.FRAGMENT_SHADER,
								`#version 300 es\nprecision highp float;precision highp int;\n${common}\nout vec4 result;void main(){vec3 p=representativePoint(int(gl_FragCoord.y),int(gl_FragCoord.x));vec3 up=normalize(p);vec3 tangent=normalize(vec3(up.z,0,-up.x));result=vec4(sourceTransmittance(p),directScatteringDensity(p,up),directScatteringDensity(p,-up),directScatteringDensity(p,tangent));}`,
							),
						);
						gl.linkProgram(program);
						if (!gl.getProgramParameter(program, gl.LINK_STATUS))
							throw new Error(gl.getProgramInfoLog(program));
						const texture = gl.createTexture();
						gl.bindTexture(gl.TEXTURE_2D, texture);
						gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, width, height);
						const framebuffer = gl.createFramebuffer();
						gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
						gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
						gl.useProgram(program);
						gl.viewport(0, 0, width, height);
						gl.drawArrays(gl.TRIANGLES, 0, 3);
						const result = new Float32Array(width * height * 4);
						gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, result);
						if (gl.getError() !== gl.NO_ERROR) throw new Error('Surface readback failed.');
						gl.getExtension('WEBGL_lose_context')?.loseContext();
						return Array.from(result);
					},
					{common, width: angles.length, height: heights.length},
				);
				for (const [heightIndex, height] of heights.entries())
					for (const [angleIndex, angle] of angles.entries()) {
						const expected = reference(spec, channel, height, angle);
						assert.ok(expected.every(Number.isFinite), 'Reference physical values must be finite.');
						for (let quantity = 0; quantity < 4; quantity++) {
							const actual = values[(heightIndex * angles.length + angleIndex) * 4 + quantity];
							const error = Math.abs(actual - expected[quantity]),
								tolerance =
									quantity === 0
										? 1e-6 + 0.001 * Math.abs(expected[quantity])
										: 1e-10 + 0.01 * Math.abs(expected[quantity]);
							const pass = Number.isFinite(actual) && actual >= 0 && error <= tolerance;
							const record = {
								profileIndex,
								limit,
								channelIndex,
								height,
								angle,
								quantity,
								actual,
								reference: expected[quantity],
								error,
								tolerance,
								pass,
							};
							comparisons.push(record);
							if (!pass) failures++;
							if (error / tolerance > maximumRatio) {
								maximumRatio = error / tolerance;
								worst = record;
							}
						}
					}
			}
			summaries.push({profileIndex, limit, failures, maximumRatio, worst});
			process.stdout.write(`${JSON.stringify(summaries.at(-1))}\n`);
		}
	await write('comparisons.json', comparisons);
	for (const source of sources) await files.read(source.path, source);
	const accepted = summaries.every((summary) => summary.failures === 0);
	await write('result.json', {
		accepted,
		summaries,
		sources,
		tools: {node: process.version, browser: await browser.version()},
	});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted, artifacts})}\n`));
	process.stdout.write(`${JSON.stringify({run, accepted})}\n`);
	if (!accepted) process.exitCode = 1;
} catch (error) {
	await write('failure.json', {error: String(error)});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted: false, artifacts})}\n`));
	throw error;
} finally {
	clearInterval(heartbeat);
	await browser?.close();
}
