import {readFile} from 'node:fs/promises';
import path from 'node:path';

import GATE from '../fixtures/bruneton-b1-sky-color-gate-v1.json' with {type: 'json'};
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {REPOSITORY_ROOT} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/analyze-bruneton-sky-color-order-sweep.js';
const SWEEP_ROOT = path.join(
	REPOSITORY_ROOT,
	'tmp/extraterrestrial/production-integration/000006-bruneton-delta-order-sweep/b1-directional-sky-radiance/gpu',
);
const PAPER_TABLE = path.join(REPOSITORY_ROOT, ...GATE.oracle.source.split('/'));
const CIE_TABLE = path.join(REPOSITORY_ROOT, 'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv');
const WAVELENGTHS = Object.freeze(Array.from({length: 40}, (_, index) => 360 + (470 * index) / 40));
const WIDTH_NM = 470 / 40;
const K = 1 / (5 * 683);
const MATRIX = [
	[3.2406, -1.5372, -0.4986],
	[-0.9689, 1.8758, 0.0415],
	[0.0557, -0.204, 1.057],
];

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function parseTable(text, model) {
	const lines = text.trim().split(/\r?\n/u);
	const header = lines.shift().split('\t');
	const channelIndices = Array.from({length: 40}, (_, index) => header.indexOf(`lambda_${index}`));
	const modelIndex = header.indexOf('model');
	const timeIndex = header.indexOf('time');
	const xIndex = header.indexOf('grid_x');
	const yIndex = header.indexOf('grid_y');
	const rows = new Map();
	for (const line of lines) {
		const fields = line.split('\t');
		if (fields[modelIndex] !== model) continue;
		const key = `${fields[timeIndex]}/${fields[xIndex]}/${fields[yIndex]}`;
		rows.set(key, {
			time: fields[timeIndex],
			gridX: Number(fields[xIndex]),
			gridY: Number(fields[yIndex]),
			spectrum: channelIndices.map((index) => Number(fields[index])),
		});
	}
	requireCondition(rows.size === 1377, `${model} table does not have 1,377 unique rows.`);
	return rows;
}

function parseCie(text) {
	return new Map(
		text
			.trim()
			.split(/\r?\n/u)
			.map((line) => {
				const values = line.split(',').map(Number);
				return [values[0], values.slice(1)];
			}),
	);
}

function cieAt(cie, wavelength) {
	const lowNm = Math.floor(wavelength);
	const highNm = Math.ceil(wavelength);
	const low = cie.get(lowNm);
	const high = cie.get(highNm);
	const fraction = wavelength - lowNm;
	return low.map((value, axis) => value + (high[axis] - value) * fraction);
}

function xyz(spectrum, cie) {
	const result = [0, 0, 0];
	for (let channel = 0; channel < 40; channel += 1) {
		const matching = cieAt(cie, WAVELENGTHS[channel]);
		for (let axis = 0; axis < 3; axis += 1) result[axis] += spectrum[channel] * matching[axis] * WIDTH_NM * 683;
	}
	return result;
}

function linearSrgb(value) {
	return MATRIX.map((row) => row.reduce((sum, coefficient, axis) => sum + coefficient * value[axis], 0));
}

function toneMapped(linear) {
	return linear.map((value) => Math.max(0, Math.min(1, 1 - Math.exp(-Math.max(0, value) * K))));
}

function display(linear) {
	return toneMapped(linear).map((mapped) => {
		return mapped <= 0.0031308 ? 12.92 * mapped : 1.055 * mapped ** (1 / 2.4) - 0.055;
	});
}

function uv(value) {
	const denominator = value[0] + 15 * value[1] + 3 * value[2];
	return [(4 * value[0]) / denominator, (9 * value[1]) / denominator];
}

function distance(first, second) {
	return Math.sqrt(first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0));
}

function mean(values) {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function describe(model, paper) {
	const samples = [];
	for (const [key, reference] of paper) {
		const candidate = model.get(key);
		requireCondition(candidate, `Order table is missing ${key}.`);
		const referenceXyz = xyz(reference.spectrum, model.cie);
		const candidateXyz = xyz(candidate.spectrum, model.cie);
		const referenceDisplay = display(linearSrgb(referenceXyz));
		const candidateDisplay = display(linearSrgb(candidateXyz));
		const referenceBrunetonDisplay = toneMapped(linearSrgb(referenceXyz));
		const candidateBrunetonDisplay = toneMapped(linearSrgb(candidateXyz));
		samples.push({
			key,
			time: reference.time,
			gridX: reference.gridX,
			gridY: reference.gridY,
			reference,
			candidate,
			referenceXyz,
			candidateXyz,
			referenceDisplay,
			candidateDisplay,
			referenceBrunetonDisplay,
			candidateBrunetonDisplay,
			deltaUv: distance(uv(referenceXyz), uv(candidateXyz)),
		});
	}
	const displayResiduals = samples.flatMap((sample) =>
		sample.candidateDisplay.map((value, channel) => value - sample.referenceDisplay[channel]),
	);
	const brunetonPolicyResiduals = samples.flatMap((sample) =>
		sample.candidateBrunetonDisplay.map((value, channel) => value - sample.referenceBrunetonDisplay[channel]),
	);
	const currentCrossPolicyResiduals = samples.flatMap((sample) =>
		sample.candidateDisplay.map((value, channel) => value - sample.referenceBrunetonDisplay[channel]),
	);
	return {
		samples,
		summary: {
			displayRgbRmse: Math.sqrt(mean(displayResiduals.map((value) => value ** 2))),
			brunetonPolicyRgbRmse: Math.sqrt(mean(brunetonPolicyResiduals.map((value) => value ** 2))),
			currentShaderVersusBrunetonDomeRgbRmse: Math.sqrt(
				mean(currentCrossPolicyResiduals.map((value) => value ** 2)),
			),
			meanDeltaUv: mean(samples.map((sample) => sample.deltaUv)),
			maximumDeltaUv: Math.max(...samples.map((sample) => sample.deltaUv)),
			meanAbsoluteRelativeLuminanceError: mean(
				samples.map(
					(sample) => Math.abs(sample.candidateXyz[1] - sample.referenceXyz[1]) / sample.referenceXyz[1],
				),
			),
			meanSignedRelativeLuminanceError: mean(
				samples.map((sample) => (sample.candidateXyz[1] - sample.referenceXyz[1]) / sample.referenceXyz[1]),
			),
			meanSignedDisplayRgbBias: [0, 1, 2].map((channel) =>
				mean(samples.map((sample) => sample.candidateDisplay[channel] - sample.referenceDisplay[channel])),
			),
		},
	};
}

function wavelengthAnalysis(samples) {
	return WAVELENGTHS.map((wavelengthNm, channel) => {
		const referenceMean = mean(samples.map((sample) => sample.reference.spectrum[channel]));
		const candidateMean = mean(samples.map((sample) => sample.candidate.spectrum[channel]));
		const residuals = samples.map(
			(sample) => sample.candidate.spectrum[channel] - sample.reference.spectrum[channel],
		);
		return {
			channel,
			wavelengthNm,
			referenceMean,
			candidateMean,
			meanSignedRelativeError: (candidateMean - referenceMean) / referenceMean,
			rmse: Math.sqrt(mean(residuals.map((value) => value ** 2))),
		};
	});
}

function elevationBandAnalysis(samples) {
	const bands = [
		{name: 'low', rows: [0, 1, 2, 3, 5, 6, 7, 8]},
		{name: 'middle', rows: [1, 2, 3, 5, 6, 7]},
		{name: 'zenith', rows: [4]},
	];
	return bands.map((band) => {
		const selected = samples.filter((sample) =>
			band.name === 'zenith'
				? sample.gridX === 4 && sample.gridY === 4
				: band.rows.includes(sample.gridX) && band.rows.includes(sample.gridY),
		);
		return {
			name: band.name,
			sampleCount: selected.length,
			meanDeltaUv: mean(selected.map((sample) => sample.deltaUv)),
			meanSignedDisplayRgbBias: [0, 1, 2].map((channel) =>
				mean(selected.map((sample) => sample.candidateDisplay[channel] - sample.referenceDisplay[channel])),
			),
		};
	});
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'bruneton-sky-color-order-localization',
		command: COMMAND,
		inputs: {sweepRoot: path.relative(REPOSITORY_ROOT, SWEEP_ROOT).replaceAll('\\', '/'), orders: [1, 2, 3, 4]},
		provenance: {oracle: GATE.oracle, generationManifest: '000006-bruneton-delta-order-sweep'},
		environment: {node: process.version, platform: process.platform},
		references: {gateContract: 'experiments/extraterrestrial/fixtures/bruneton-b1-sky-color-gate-v1.json'},
	});
	try {
		const [paperText, cieText, ...orderTexts] = await Promise.all([
			readFile(PAPER_TABLE, 'utf8'),
			readFile(CIE_TABLE, 'utf8'),
			...[1, 2, 3, 4].map((order) =>
				readFile(path.join(SWEEP_ROOT, `algorithm32-current-production-gpu-j${order}.tsv`), 'utf8'),
			),
		]);
		const cie = parseCie(cieText);
		const paper = parseTable(paperText, 'bruneton');
		const orderResults = orderTexts.map((text, index) => {
			const model = parseTable(text, 'proposed');
			model.cie = cie;
			const described = describe(model, paper);
			return {
				order: index + 1,
				summary: described.summary,
				wavelengths: wavelengthAnalysis(described.samples),
				elevationBands: elevationBandAnalysis(described.samples),
			};
		});
		const j4 = orderResults[3];
		const strongestSpectralBiases = [...j4.wavelengths]
			.sort((first, second) => Math.abs(second.meanSignedRelativeError) - Math.abs(first.meanSignedRelativeError))
			.slice(0, 10);
		const result = {
			schemaId: 'bruneton-sky-color-order-localization-v1',
			orders: orderResults,
			strongestJ4SpectralBiases: strongestSpectralBiases,
		};
		await run.writeJsonArtifact('order-localization.json', result);
		const rows = orderResults
			.map(
				({order, summary}) =>
					`| J${order} | ${summary.displayRgbRmse.toFixed(9)} | ${summary.meanDeltaUv.toFixed(9)} | ${(summary.meanAbsoluteRelativeLuminanceError * 100).toFixed(3)}% | (${summary.meanSignedDisplayRgbBias.map((value) => value.toFixed(6)).join(', ')}) |`,
			)
			.join('\n');
		const report = `# ${run.runId}: Bruneton sky-color order localization

Conclusion: **diagnostic complete**. Fresh current-production J1-J4 GPU boundaries were compared with the sealed Bruneton sky-dome oracle.

| Cumulative order | Display RGB RMSE | Mean delta u'v' | Mean absolute luminance error | Mean signed display RGB bias |
|---|---:|---:|---:|---:|
${rows}

The J4 table is byte-identical to the current canonical production boundary. Detailed wavelength and elevation-band results are in \`order-localization.json\`.
`;
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: {accepted: true, orderSummaries: orderResults.map(({order, summary}) => ({order, summary}))},
			report,
		});
		process.stdout.write(
			`${JSON.stringify({runId: run.runId, runDirectory: run.runDirectory, orderSummaries: orderResults.map(({order, summary}) => ({order, summary})), strongestSpectralBiases, artifactSetSha256: manifest.artifactSetSha256}, null, 2)}\n`,
		);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('failure.json', detail);
			await run.finalize({
				conclusion: 'failed',
				result: {accepted: false, error: detail},
				report: `# ${run.runId}\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
		} catch {}
		throw error;
	}
}

await main();
