import { readFile } from 'node:fs/promises';
import path from 'node:path';

import PARAMETERS from '../fixtures/spectral-color-receptor-parameter-v1.json' with { type: 'json' };
import BRIDGE from '../fixtures/spectral-color-stage2b-reference-bridge-v1.json' with { type: 'json' };
import { createProjectionMatrix, multiply, parseCieLms, parseCieXyz, samplePiecewiseLinear } from '../color/ReceptorSpectralProjection.js';
import { RUNS_ROOT, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const RUN_ID = '000316-spectral-color-fixed-exposure-sweep';
const XYZ_TO_REC709 = [[3.2409699419045226,-1.537383177570094,-0.4986107602930034],[-0.9692436362808796,1.8759675015077202,0.04155505740717559],[0.05563007969699366,-0.20397695888897652,1.0569715142428786]];
const requireCondition = (value, message) => { if (!value) throw new Error(message); };
const normalize = (values) => { const sum = values.reduce((total, value) => total + value, 0); return sum === 0 ? values.map(() => 0) : values.map((value) => value / sum); };
const xy = (xyz) => normalize(xyz).slice(0, 2);
const uv = (xyz) => { const denominator = xyz[0] + 15 * xyz[1] + 3 * xyz[2]; return denominator === 0 ? [0,0] : [4 * xyz[0] / denominator, 9 * xyz[1] / denominator]; };
const distance = (left, right) => Math.hypot(...left.map((value, index) => value - right[index]));

function binCenterXyzMatrix(rows, basis) {
	const matrix = [[],[],[]];
	for (const channel of basis.channels) {
		const matching = samplePiecewiseLinear(rows, channel.center.value);
		for (let axis = 0; axis < 3; axis += 1) matrix[axis].push(matching[axis] * channel.width.value * 683);
	}
	return matrix;
}

function decodeFrame(frame, width, height) {
	const pixelCount = width * height;
	const groups = frame.spectralGroupsFloat32Base64.map((encoded) => { const bytes = Buffer.from(encoded, 'base64'); requireCondition(bytes.byteLength === pixelCount * 16, 'Unexpected spectral group size.'); return new Float32Array(bytes.buffer, bytes.byteOffset, pixelCount * 4); });
	return (x, y) => Array.from({length: 15}, (_, channel) => Math.max(0, groups[Math.floor(channel / 4)][(y * width + x) * 4 + channel % 4]));
}

const dom = await readFile(path.join(RUNS_ROOT, RUN_ID, 'browser', 'dom.html'), 'utf8');
const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(dom); requireCondition(match, 'Run has no browser result.');
const browser = JSON.parse(match[1]); requireCondition(browser.frames?.length === 4, 'Run does not contain four frames.');
const [ledger, lmsRows, xyzRows] = await Promise.all([
	readFile(path.join(RUNS_ROOT, BRIDGE.input.runId, BRIDGE.input.ledgerPath), 'utf8').then(JSON.parse),
	readFile(path.join(EXPERIMENT_ROOT, 'references', 'cie-2006-lms-2deg', 'CIE_lms_cf_2deg.csv'), 'utf8').then(parseCieLms),
	readFile(path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv'), 'utf8').then(parseCieXyz),
]);
const basis = ledger.spectralBasis; const lmsMatrix = createProjectionMatrix(lmsRows, basis); const xyzExactMatrix = createProjectionMatrix(xyzRows, basis); const xyzProductionMatrix = binCenterXyzMatrix(xyzRows, basis);
const width = 481; const height = 271; const cx = Math.floor(width / 2); const cy = Math.floor(height / 2); const degree = Math.round(height / 15);
const samples = [{id:'center',x:cx,y:cy},{id:'one-degree-right',x:cx+degree,y:cy},{id:'three-degree-right',x:cx+3*degree,y:cy},{id:'six-degree-right',x:cx+6*degree,y:cy},{id:'six-degree-up',x:cx,y:cy+6*degree},{id:'six-degree-down',x:cx,y:cy-6*degree},{id:'upper-left',x:24,y:height-25},{id:'lower-left',x:24,y:24}];
const rows = [];
for (const frame of browser.frames) {
	const spectrumAt = decodeFrame(frame, width, height);
	for (const sample of samples) {
		const spectrum = spectrumAt(sample.x, sample.y); const rawLms = multiply(lmsMatrix, spectrum); const xyzF = multiply(PARAMETERS.absoluteNormalization.lmsToCie2015XyzF, rawLms); const xyz1931Exact = multiply(xyzExactMatrix, spectrum); const xyz1931Production = multiply(xyzProductionMatrix, spectrum);
		const rgbF = multiply(XYZ_TO_REC709, xyzF); const rgb1931Exact = multiply(XYZ_TO_REC709, xyz1931Exact); const rgb1931Production = multiply(XYZ_TO_REC709, xyz1931Production);
		rows.push({ condition: frame.id, sample: sample.id, spectrumRange: [Math.min(...spectrum),Math.max(...spectrum)], cie2015: {xy:xy(xyzF),uv:uv(xyzF),linearRec709:rgbF,rgbRatio:normalize(rgbF)}, cie1931Exact: {xy:xy(xyz1931Exact),uv:uv(xyz1931Exact),linearRec709:rgb1931Exact,rgbRatio:normalize(rgb1931Exact)}, algorithm32ProductionProjection: {xy:xy(xyz1931Production),uv:uv(xyz1931Production),linearRec709:rgb1931Production,rgbRatio:normalize(rgb1931Production)}, differences: {cie2015ToProductionUv:distance(uv(xyzF),uv(xyz1931Production)), exact1931ToProductionUv:distance(uv(xyz1931Exact),uv(xyz1931Production))} });
	}
}
const summary = { runId: RUN_ID, sampleCount: rows.length, maximumCie2015ToProductionUv: Math.max(...rows.map((row) => row.differences.cie2015ToProductionUv)), maximumExact1931ToProductionUv: Math.max(...rows.map((row) => row.differences.exact1931ToProductionUv)), rows };
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
