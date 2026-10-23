import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {createRun, checked, identity, output} from './io.mjs';
import {physical, ray, directTransmission} from './physics.mjs';
import {colorimetry} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const paths = ['00003-reference-full', '00011-ref-aerosol50', '00014-ref-aerosol0', '00015-ref-glow'].map(
	(n) => output + '/runs/' + n,
);
const read = (p) => JSON.parse(readFileSync(checked(p), 'utf8'));
const run = createRun(
	'profile-report',
	'Fixed-physics libRadtran aerosol-loading mechanism controls at the elevated horizon and near Sun.',
	paths.map((p) => identity(p + '/manifest.json')),
);
let failure;
try {
	const medium = physical(),
		horizon = (-Math.acos(medium.radius / (medium.radius + 10000)) * 180) / Math.PI,
		mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
	const half = (a) => {
		const m = mean(a);
		return 4.30265273 * Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / 2 / 3);
	};
	for (const p of paths) {
		const m = read(p + '/manifest.json');
		assert.equal(m.state, 'accepted');
		for (const a of m.artifacts) assert.equal(identity(a.path).sha256, a.sha256);
	}
	const inputs = paths.map((p) => read(p + '/readings.json'));
	const profiles = [1, 0.5, 0].map((fraction, j) => {
		const selected = inputs[j],
			data = [-0.1, 0.1].map((delta) => {
				const readings = selected.filter((r) => Math.abs(r.config.elevation - horizon - delta) < 1e-9),
					spectrum = Array.from({length: 15}, (_, c) => mean(readings.map((r) => r.spectrum[c]))),
					view = ray(horizon + delta),
					density = {...medium, mie: medium.mie.map((x) => x * fraction)};
				assert.equal(readings.length, 3);
				return {
					delta,
					spectrum,
					color: colorimetry(spectrum, 'bin-integrated'),
					halfWidthY95: half(readings.map((r) => colorimetry(r.spectrum, 'bin-integrated').luminanceCdPerM2)),
					direct: directTransmission(density, view),
				};
			});
		const glowReadings = (j === 0 ? inputs[3] : selected).filter((r) => (r.config.azimuth ?? 180) === 0),
			glowValues = glowReadings.map((r) => colorimetry(r.spectrum, 'bin-integrated').luminanceCdPerM2);
		const c = (a, b) => (a - b) / (a + b),
			replicates = [0, 1, 2].map((repeat) => {
				const above = selected.find(
						(r) => r.config.repeat === repeat && Math.abs(r.config.elevation - horizon - 0.1) < 1e-9,
					),
					below = selected.find(
						(r) => r.config.repeat === repeat && Math.abs(r.config.elevation - horizon + 0.1) < 1e-9,
					);
				return c(
					colorimetry(above.spectrum, 'bin-integrated').luminanceCdPerM2,
					colorimetry(below.spectrum, 'bin-integrated').luminanceCdPerM2,
				);
			});
		return {
			fraction,
			data,
			contrast: c(data[1].color.luminanceCdPerM2, data[0].color.luminanceCdPerM2),
			contrastHalfWidth95: half(replicates),
			glow: {
				elevation: 89 - medium.zenithDegrees,
				azimuth: 0,
				meanY: mean(glowValues),
				halfWidthY95: half(glowValues),
				replicates: glowValues,
			},
		};
	});
	const model = new ColorResetSlope078P2ColorDisplayModel(),
		lux = medium.capture.physicalLux.value,
		image = new PNG({width: 720, height: 200});
	for (let y = 0; y < 200; y++)
		for (let x = 0; x < 720; x++) {
			const profile = profiles[Math.floor(x / 240)],
				row = profile.data[y < 100 ? 1 : 0],
				rgb = model.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */ (row.color.rgb), {
					value: lux,
					units: 'lux',
				});
			for (let c = 0; c < 3; c++) image.data[(y * 720 + x) * 4 + c] = Math.round(rgb[c] * 255);
			image.data[(y * 720 + x) * 4 + 3] = 255;
		}
	run.write('profiles.json', {
		profiles,
		unchanged:
			'All physics except aerosol extinction/scattering amount; original scale height, SSA, phase, source, geometry, black boundary and display.',
		interpretation:
			'Two sampled directions per column, not a full-scene render or sharpness prescription. Three-seed profile controls, empirical uncertainty only.',
	});
	run.write('profiles.png', PNG.sync.write(image));
	run.write(
		'profiles.html',
		'<meta charset="utf-8"><title>Aerosol sensitivity at 10 km</title><style>body{font:16px sans-serif;background:#20252c;color:white}table{width:720px;text-align:center}img{max-width:100%}</style><table><tr><th>100% aerosols</th><th>50% aerosols</th><th>0% aerosols</th></tr></table><img src="profiles.png"><p>libRadtran all orders only. Upper half: 0.1 degree above the geometric horizon; lower half: 0.1 degree below. Black ground, identical native-bin CIE conversion and production p2 exposure. These are two sampled directions, not a continuously rendered sky. Production was not changed.</p><a href="profiles.json">Spectra, confidence intervals and optical-depth controls</a>',
	);
	console.log(
		JSON.stringify(
			profiles.map((p) => ({
				fraction: p.fraction,
				contrast: p.contrast,
				half: p.contrastHalfWidth95,
				Y: p.data.map((r) => r.color.luminanceCdPerM2),
				transmittance564: p.data[0].direct.transmittance[6],
				glow: p.glow,
			})),
		),
	);
} catch (error) {
	failure = String(error);
}
run.finish(failure ? 'failed' : 'accepted', {failure});
if (failure) throw new Error(failure);
