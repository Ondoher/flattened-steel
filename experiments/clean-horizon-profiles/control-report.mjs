import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {createRun, checked, identity} from './io.mjs';
import {physical, ray, directTransmission} from '../elevated-horizon-validation/physics.mjs';
import {colorimetry, colorControls} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const parent = 'tmp/experiments/clean-horizon-profiles/runs/00016-control-spectrum';
const earlier = 'tmp/experiments/elevated-horizon-validation/runs/00046-opac-report';
const read = path => JSON.parse(readFileSync(checked(path), 'utf8'));
const run = createRun('control-report', 'M1 color opportunity report, immutable parent verification and comparison with prior continental-clean colors', [
	identity(parent + '/manifest.json'), identity(earlier + '/manifest.json'),
	identity('tmp/experiments/elevated-horizon-validation/runs/00026-opac-screen/manifest.json'),
	identity('tmp/experiments/elevated-horizon-validation/runs/00032-opac-controls/manifest.json'),
	identity('experiments/sky-accuracy-dials/horizon/diagnosis-color.mjs'),
	identity('references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv'),
	identity('src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js'),
	identity('experiments/elevated-horizon-validation/physics.mjs'),
]);
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const half = values => {
	const m = mean(values);
	assert.equal(values.length, 3);
	return 4.30265273 * Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / 2 / 3);
};
const contrast = (above, below) => {assert.ok(above + below > 0); return (above - below) / (above + below);};
let failure;
try {
	for (const path of [parent, earlier]) {
		const manifest = read(path + '/manifest.json'); assert.equal(manifest.state, 'accepted');
		for (const artifact of manifest.artifacts) assert.equal(identity(artifact.path).sha256, artifact.sha256);
	}
	const readings = read(parent + '/readings.json'), physics = physical();
	assert.equal(readings.length, 24);
	const controls = colorControls();
	const rows = [];
	for (const height of [5, 500]) for (const model of ['bruneton', 'molecular']) {
		const samples = [-0.1, 0.1].map(delta => {
			const selected = readings.filter(r => r.config.height === height && r.config.model === model && r.config.delta === delta);
			assert.equal(selected.length, 3);
			const spectrum = Array.from({length: 15}, (_, c) => mean(selected.map(r => r.spectrum[c])));
			const color = colorimetry(spectrum, 'bin-integrated');
			const medium = {...physics, mie: model === 'molecular' ? physics.mie.map(() => 0) : physics.mie};
			const direct = directTransmission(medium, ray(selected[0].config.elevation, height));
			return {delta, spectrum, color, direct, halfWidthY95: half(selected.map(r => colorimetry(r.spectrum, 'bin-integrated').luminanceCdPerM2))};
		});
		const contrasts = [0, 1, 2].map(repeat => {
			const get = delta => colorimetry(readings.find(r => r.config.height === height && r.config.model === model && r.config.delta === delta && r.config.repeat === repeat).spectrum, 'bin-integrated').luminanceCdPerM2;
			return contrast(get(0.1), get(-0.1));
		});
		rows.push({height, model, samples, contrast: mean(contrasts), contrastHalfWidth95: half(contrasts), contrastReplicates: contrasts});
	}
	const previous = read(earlier + '/analysis.json').groups.filter(g => g.altitude === 5 && g.scene === 'noon' && g.order === 2 && g.layers === 256 && ['bruneton', 'molecular', 'continental_clean'].includes(g.name));
	assert.equal(previous.length, 3);
	const authenticate = path => {
		const directory = /^tmp\/experiments\/elevated-horizon-validation\/runs\/\d{5}-[a-z0-9-]+/u.exec(path)[0];
		const previousManifest = read(directory + '/manifest.json');
		assert.equal(previousManifest.state, 'accepted');
		const expected = previousManifest.artifacts.find(a => a.path === path); assert.ok(expected);
		assert.equal(identity(path).sha256, expected.sha256);
	};
	const previousSummary = previous.map(group => {
		const samples = [-0.1, 0.1].map(delta => {
			const row = group.rows.find(r => r.offset === delta); assert.ok(row);
			for (const path of row.readings) {
				authenticate(path);
				const reading = read(path);
				const directory = path.slice(0, path.lastIndexOf('/'));
				const deckPath = directory + '/cases/' + reading.config.id + '/input.inp';
				authenticate(deckPath);
				const deck = readFileSync(checked(deckPath), 'utf8');
				assert.ok(Math.abs(Number(/^sza (.+)$/mu.exec(deck)[1]) - physics.zenithDegrees) < 1e-10);
				assert.ok(deck.includes('zout 0.005') && deck.includes('phi 180') && deck.includes('albedo 0'));
			}
			return {delta, rgb: row.rgb, Y: row.Y};
		});
		return {height: 5, model: group.name, samples, contrast: contrast(samples[1].Y, samples[0].Y), spectralSampling: 'Earlier two Gaussian wavelengths per native bin; current controls use bin centers. Appearance context matches; no combined CI or exact spectral-equivalence claim.'};
	});
	const display = new ColorResetSlope078P2ColorDisplayModel(), context = {value: physics.capture.physicalLux.value, units: /** @type {'lux'} */('lux')};
	let html = '<!doctype html><meta charset="utf-8"><title>Clean-horizon opportunity controls</title><style>body{font:16px system-ui;max-width:1080px;margin:24px auto;background:#20252c;color:#eee}table{width:100%;table-layout:fixed;text-align:center}td,th{padding:8px}img{width:100%}a{color:#a9d5ff}</style><h1>Near-ground aerosol opportunity</h1><p>Fully spherical libRadtran, San Jose noon, anti-Sun, black ground, common fixed p2 exposure. Each column contains two sampled colors: 0.1° above the true limb (top) and 0.1° below (bottom). These are swatches, not a full scene or a continuously resolved horizon. No artificial intermediate colors or edge smoothing.</p>';
	for (const height of [5, 500]) {
		const groups = rows.filter(r => r.height === height).map(r => ({model: r.model, contrast: r.contrast, samples: r.samples.map(s => ({rgb: s.color.rgb}))}));
		if (height === 5) {
			const old = previousSummary.find(r => r.model === 'continental_clean');
			groups.splice(1, 0, {model: old.model, contrast: old.contrast, samples: old.samples.map(s => ({rgb: s.rgb}))});
		}
		const image = new PNG({width: groups.length * 256, height: 256});
		for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
			const sample = groups[Math.floor(x / 256)].samples[y < 128 ? 1 : 0];
			const linear = sample.rgb;
			const rgb = display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */(linear), context);
			for (let c = 0; c < 3; c++) image.data[(y * image.width + x) * 4 + c] = Math.round(rgb[c] * 255);
			image.data[(y * image.width + x) * 4 + 3] = 255;
		}
		run.write(`colors-${height}m.png`, PNG.sync.write(image));
		html += `<h2>${height} m</h2><table><tr>${groups.map(g => '<th>' + g.model + (g.model === 'continental_clean' ? ' (earlier evidence)' : '') + '</th>').join('')}</tr></table><img alt="Paired diffuse horizon colors at ${height} meters" src="colors-${height}m.png"><table><tr>${groups.map(g => '<td>Contrast ' + g.contrast.toFixed(4) + '</td>').join('')}</tr></table>`;
	}
	const differences = [5, 500].map(height => {
		const baseline = rows.find(r => r.height === height && r.model === 'bruneton'), molecular = rows.find(r => r.height === height && r.model === 'molecular');
		const paired = baseline.contrastReplicates.map((v, i) => molecular.contrastReplicates[i] - v);
		return {height, difference: mean(paired), halfWidth95: half(paired)};
	});
	run.write('analysis.json', {rows, differences, previousSummary, controls, displayContext: context,
		limitations: ['Three fixed pilot replicates, no fixed five-replicate finalist confirmation.', 'Native-bin-center radiance with exact bin-integrated CIE weights; no within-bin radiance convergence claim.', 'Two infinitesimal viewing directions; pixel footprint/edge width unresolved.', 'Black-ground transport, not green-ground app appearance.', 'No ARM/ATom aerosol candidate has been substituted in these controls.']});
	run.write('comparison.html', html + '<p>The aerosol-free control tests available clarity; it is not a replacement recommendation. Continental-clean was previously unsatisfactory to the owner despite a contrast gain. ARM measurements and their qualifications are separate from these controls.</p><a href="analysis.json">Spectra, direct transmission, replicate intervals and limitations</a>');
	console.log(JSON.stringify({rows: rows.map(r => ({height: r.height, model: r.model, contrast: r.contrast, halfWidth95: r.contrastHalfWidth95, Y: r.samples.map(s => s.color.luminanceCdPerM2)})), differences}));
} catch (error) {failure = String(error); run.write('failure.json', {message: failure});}
run.finish(failure ? 'failed' : 'accepted', {failure});
if (failure) process.exitCode = 1;
