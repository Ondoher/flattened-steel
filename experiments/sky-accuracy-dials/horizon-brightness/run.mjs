import assert from 'node:assert/strict';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {createRun, identity, readRepository, checkedAbsolute, verifyRun, storage} from '../io/files.mjs';
import {readParent, requireUnusedStage, pinProductionClosure} from '../hypotheses/common.mjs';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {
	along,
	dot,
	unit,
	height,
	phase,
	illumination,
	opticalDepth,
	boundary,
	direct,
} from '../horizon-reference/math.mjs';
import {colorimetry, ciePath} from '../horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {probe} from './browser.mjs';

/** Independently integrate the local N1 source, retaining a source/view attenuation factorial.
 * @param {HorizonReferenceGroup} group Frozen ray/channel data.
 * @param {number} n Gauss nodes per logarithmic distance segment.
 * @returns {HorizonBrightnessIntegral} Both attenuations, source only, view only, neither, Rayleigh, aerosol, altitude moment.
 */
function integrate(group, n) {
	const {medium: m, origin: o, direction: v, channel: c, end} = group;
	const q = gauss(n),
		edges = [0, 1e4, 5e4, 1e5, 3e5, 1e6, end],
		result = Array(7).fill(0);
	for (let b = 1; b < edges.length; b++) {
		const a = Math.min(end, edges[b - 1]),
			z = Math.min(end, edges[b]);
		if (z <= a) continue;
		const la = Math.log1p(a / 1000),
			dz = Math.log1p(z / 1000) - la;
		for (let i = 0; i < n; i++) {
			const t = 1000 * Math.expm1(la + dz * q.nodes[i]),
				jac = (t + 1000) * dz * q.weights[i];
			const x = along(o, v, t),
				h = height(m, x),
				s = illumination(m, x, c),
				p = phase(dot(v, s.slice(0, 3)), m.g);
			const d = Math.hypot(...m.sourcePosition.map((u, k) => u - x[k]));
			const E = m.sourceIrradiance[c] * m.incidentScale * (m.referenceDistance / d) ** 2;
			const R = m.rayleigh[c] * Math.exp(-h / m.rayleighHeight) * p[0];
			const M = m.mie[c] * m.albedo * Math.exp(-h / m.mieHeight) * p[1];
			const Tv = Math.exp(-opticalDepth(m, o, v, t, c)),
				j = (R + M) * jac;
			const terms = [
				j * s[3] * Tv,
				j * s[3],
				j * E * Tv,
				j * E,
				R * jac * s[3] * Tv,
				M * jac * s[3] * Tv,
				h * j * s[3] * Tv,
			];
			terms.forEach((u, k) => {
				result[k] += u;
			});
		}
	}
	return [result[0], result[1], result[2], result[3], result[4], result[5], result[6]];
}

/** Trace the source function at the same optical depth on two different rays.
 * @param {HorizonReferenceGroup} g Frozen local ray/channel.
 * @param {number} elevation Physical degrees above horizontal.
 * @param {number} tau Target view optical depth, required inside the ray.
 * @returns {HorizonBrightnessSample} Independent density, illumination and scattering terms; unreachable tau fails.
 */
function sample(g, elevation, tau) {
	const {medium: m, origin: o, direction: v, channel: c, end} = g;
	assert.ok(opticalDepth(m, o, v, end, c) > tau);
	let lo = 0,
		hi = end;
	for (let k = 0; k < 64; k++) {
		const mid = (lo + hi) / 2;
		if (opticalDepth(m, o, v, mid, c) < tau) lo = mid;
		else hi = mid;
	}
	const distance = (lo + hi) / 2,
		x = along(o, v, distance),
		h = height(m, x),
		s = illumination(m, x, c);
	const p = phase(dot(v, s.slice(0, 3)), m.g),
		R = m.rayleigh[c] * Math.exp(-h / m.rayleighHeight),
		M = m.mie[c] * Math.exp(-h / m.mieHeight);
	const incident =
		m.sourceIrradiance[c] *
		m.incidentScale *
		(m.referenceDistance / Math.hypot(...m.sourcePosition.map((u, i) => u - x[i]))) ** 2;
	const source = [R * p[0] * s[3], M * m.albedo * p[1] * s[3]];
	assert.ok(Math.abs(opticalDepth(m, o, v, distance, c) - tau) < 1e-12);
	return {
		elevation,
		channel: c,
		tau,
		distance,
		altitude: h,
		rayleigh: R,
		aerosol: M,
		sourceTransmittance: s[3] / incident,
		incident,
		source,
		sourceFunction: (source[0] + source[1]) / (R + M),
	};
}

/** Standard sRGB output transfer, for a declared display counterfactual only.
 * @param {number} x Bounded linear channel. @returns {number} Encoded channel.
 */
function encode(x) {
	return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
}

/** Decode a captured normalized screen channel for relative display luminance.
 * @param {number} x Encoded sRGB channel. @returns {number} Linear display channel, relative to screen white.
 */
function decode(x) {
	return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

/** Measure relative display luminance with the fixed sRGB luminance coefficients.
 * @param {readonly number[]} rgb Encoded screen RGB. @returns {number} Relative luminance, no monitor-nit claim.
 */
function displayY(rgb) {
	return dot(rgb.map(decode), [0.2126, 0.7152, 0.0722]);
}

/** Execute one compact brightness diagnosis; retains failure in a fresh immutable run.
 * @returns {Promise<void>} Sealed output path; malformed evidence, failed proofs or exhausted budget reject.
 */
async function main() {
	const spent = requireUnusedStage('h27-brightness', true),
		start = Date.now(),
		before = storage();
	const deadline = start + 180000 - spent;
	/** @type {DialFileIdentity[]} */ const parents = [];
	const registration = /** @type {HorizonReferenceParent} */ (
		readParent('00264-h16-h20-audit', 'registration.json', parents)
	);
	const observations = ['local', 'distant'].map(
		(mode) =>
			/** @type {HorizonAuditObservation} */ (
				readParent('00239-horizon-stages', mode + '-observation.json', parents)
			),
	);
	parents.push(
		identity(ciePath),
		identity('node_modules/three/build/three.cjs'),
		identity('src/flat32/ThreeSceneRuntime.js'),
		identity('src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js'),
		identity('agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/horizon-diagnosis-plan.md'),
	);
	pinProductionClosure(
		['src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js'],
		parents,
	);
	const run = createRun('h27-brightness', {
		parents,
		operation:
			'Sparse independent local N1 brightness/source-function attribution and fixed-spectrum p2/default-framebuffer replay; no cache or production changes.',
		parameters: {
			maximumMilliseconds: 180000,
			previousFailureMilliseconds: spent,
			maximumNewBytes: 2 * 1024 ** 2,
			elevations: [0.05, 0.25, 0.5, 1, 2, 3, 4, 5, 7, 10, 15, 20],
			quadrature: [64, 128],
			factorial: ['both', 'source-only', 'view-only', 'neither'],
			gpu: 'One tiny display-only Three raw-material context',
		},
	});
	let browser = /** @type {HorizonBrightnessBrowserLifetime|null} */ (null);
	try {
		const m = registration.inputs[0];
		assert.equal(m.geometry, 'flat');
		assert.equal(m.sourceKind, 'finite');
		const elevations = [0.05, 0.25, 0.5, 1, 2, 3, 4, 5, 7, 10, 15, 20];
		let maximumRefinement = 0,
			maximumParity = 0;
		const rows = elevations.map((elevation) => {
			assert.ok(Date.now() < deadline);
			run.guard();
			const e = (elevation * Math.PI) / 180,
				direction = [0, Math.cos(e), Math.sin(e)],
				origin = [0, 0, 5];
			const end = boundary(m, origin, direction).distance;
			const channels = Array.from({length: 15}, (_, channel) => {
				const g = {id: 'local-away', medium: m, origin, direction, channel, end};
				const coarse = integrate(g, 64),
					fine = integrate(g, 128);
				maximumRefinement = Math.max(maximumRefinement, ...fine.map((v, k) => Math.abs(coarse[k] / v - 1)));
				maximumParity = Math.max(maximumParity, Math.abs(fine[0] / direct(g, 128).total - 1));
				return fine;
			});
			const spectra = Array.from({length: 4}, (_, k) => channels.map((c) => c[k]));
			const readings = spectra.map((s) => colorimetry(s, 'bin-integrated'));
			const rayleighY = colorimetry(
				channels.map((c) => c[4]),
				'bin-integrated',
			).luminanceCdPerM2;
			const aerosolY = colorimetry(
				channels.map((c) => c[5]),
				'bin-integrated',
			).luminanceCdPerM2;
			assert.ok(Math.abs((rayleighY + aerosolY) / readings[0].luminanceCdPerM2 - 1) < 1e-12);
			run.progress('transport', 'Completed elevation ' + elevation);
			return {
				elevation,
				end,
				spectra,
				readings,
				rayleighY,
				aerosolY,
				meanAltitude:
					colorimetry(
						channels.map((c) => c[6]),
						'bin-integrated',
					).luminanceCdPerM2 / readings[0].luminanceCdPerM2,
			};
		});
		assert.ok(maximumRefinement < 1e-5 && maximumParity < 1e-12);
		const samples = [0.05, 3].flatMap((elevation) =>
			[2, 6, 9].flatMap((channel) =>
				[0.1, 0.5, 1, 2].map((tau) => {
					const e = (elevation * Math.PI) / 180,
						origin = [0, 0, 5],
						direction = [0, Math.cos(e), Math.sin(e)];
					return sample(
						{
							id: 'tau',
							medium: m,
							origin,
							direction,
							channel,
							end: boundary(m, origin, direction).distance,
						},
						elevation,
						tau,
					);
				}),
			),
		);
		const model = new ColorResetSlope078P2ColorDisplayModel();
		const display = observations.map((observation, mode) => {
			const lux = observation.facts.uniforms.uColorResetTotalHorizontalIlluminanceLux;
			const illuminance = {value: lux, units: /** @type {const} */ ('lux')};
			const gain = model.displayGain(illuminance);
			const rays = observation.rays
				.filter((r) => Math.abs(r.uv[0] - 0.5) < 1e-6)
				.map((ray) => {
					const rgb = ray.stages[2].slice(0, 3),
						captured = ray.stages[0].slice(0, 3);
					const tone = model.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */ (rgb), illuminance);
					assert.ok(Math.max(...tone.map((v, i) => Math.abs(v - captured[i]))) < 2e-6);
					const Y = dot(rgb, [0.2126, 0.7152, 0.0722]);
					const variants = [0.5, 1, 2].map((exposure) =>
						model.linearSrgbToDisplayRgb(
							/** @type {[number,number,number]} */ (rgb.map((v) => v * exposure)),
							illuminance,
						),
					);
					const neutral = model.linearSrgbToDisplayRgb([Y, Y, Y], illuminance);
					const equalY = model.linearSrgbToDisplayRgb(
						/** @type {[number,number,number]} */ (rgb.map((v) => (v * 3000) / Y)),
						illuminance,
					);
					return {
						elevation: ray.elevationDegrees,
						rgb,
						captured,
						tone,
						relativeDisplayY: displayY(tone),
						explicitEncoded: tone.map(encode),
						explicitEncodedY: displayY(tone.map(encode)),
						variants,
						neutral,
						equalY,
					};
				});
			const cards = [0.18, 0.9].map((reflectance) => {
				const L = (reflectance * lux) / Math.PI;
				const tone = model.linearSrgbToDisplayRgb([L, L, L], illuminance);
				return {reflectance, L, tone, relativeDisplayY: displayY(tone)};
			});
			return {mode: mode ? 'distant-N4' : 'local-N1', lux, gain, rays, cards};
		});
		run.progress('display', 'Tiny Three raw-material framebuffer probe');
		const launched = await puppeteer.launch({
			executablePath: checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),
			headless: true,
			userDataDir: checkedAbsolute(path.join(run.scratchPath, 'profile'), false),
			timeout: 20000,
			protocolTimeout: 30000,
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--disable-software-rasterizer',
				'--use-angle=d3d11',
				'--disable-background-networking',
				'--no-first-run',
			],
		});
		browser = launched;
		const page = await launched.newPage();
		const gpu = await page.evaluate(
			probe,
			readRepository('node_modules/three/build/three.cjs', undefined, 4 * 1024 ** 2).toString(),
			[0.1, 0.25, 0.5, 0.75],
		);
		await browser.close();
		browser = null;
		assert.equal(gpu.error, 0);
		gpu.values.forEach((v, i) => {
			assert.ok(Math.abs(gpu.rawBytes[i] - 255 * v) <= 1);
			assert.ok(Math.abs(gpu.encodedBytes[i] - 255 * encode(v)) <= 1);
		});
		run.write('brightness.json', {
			rows,
			samples,
			display,
			gpu,
			proofs: {maximumRefinement, maximumParity},
			scope: 'Independent infinite-slab N1; app display uses exact retained center rays. Screenshot is qualitative, not pixel registered. Attenuation removals and encoding/exposure/card replays are diagnostic counterfactuals.',
		});
		const header =
			'elevation_degrees,Y_cd_m2,Rayleigh_Y,aerosol_Y,mean_altitude_m,Y_no_view_attenuation,Y_no_source_attenuation,Y_neither';
		run.write(
			'profile.csv',
			header +
				'\n' +
				rows
					.map((r) =>
						[
							r.elevation,
							r.readings[0].luminanceCdPerM2,
							r.rayleighY,
							r.aerosolY,
							r.meanAltitude,
							...r.readings.slice(1).map((c) => c.luminanceCdPerM2),
						].join(','),
					)
					.join('\n') +
				'\n',
		);
		const css = (/** @type {readonly number[]} */ rgb) =>
			`rgb(${rgb.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255)).join(',')})`;
		const cells = display[0].rays.flatMap((r, i) =>
			[r.tone, r.tone.map(encode), r.neutral, r.equalY].map(
				(v, k) => `<rect x="${155 + k * 150}" y="${65 + i * 55}" width="145" height="50" fill="${css(v)}"/>`,
			),
		);
		const labels = display[0].rays.map(
			(r, i) => `<text x="10" y="${95 + i * 55}">${r.elevation.toFixed(2)} degrees</text>`,
		);
		run.write(
			'display-strips.svg',
			`<svg xmlns="http://www.w3.org/2000/svg" width="760" height="450"><rect width="760" height="450" fill="white"/><g font-family="sans-serif" font-size="13" fill="black"><text x="10" y="22">Retained local N1 rays; same noon adaptation. Diagnostic swatches, not a scene render.</text>${['Current raw output', 'Explicit sRGB transfer', 'Neutral at same Y', 'Color at Y=3000'].map((v, k) => `<text x="${155 + k * 150}" y="50">${v}</text>`).join('')}${cells.join('')}${labels.join('')}<text x="10" y="425">Encoding column is conditional on interpreting the tone result as linear; no production fix applied.</text></g></svg>`,
		);
		assert.ok(Date.now() < deadline);
		run.cleanup();
		const elapsedMilliseconds = Date.now() - start;
		assert.ok(storage().retainedBytes - before.retainedBytes < 2 * 1024 ** 2);
		run.finish('accepted', {elapsedMilliseconds, maximumRefinement, maximumParity, gpuAttempts: 1});
		verifyRun(run.path);
		console.log(JSON.stringify({run: run.path, elapsedMilliseconds, maximumRefinement, gpu}));
	} catch (error) {
		if (browser) await browser.close();
		run.finish('failed', {
			elapsedMilliseconds: Date.now() - start,
			message: String(error),
			deadlineHit: Date.now() >= deadline,
		});
		throw error;
	}
}
await main();
