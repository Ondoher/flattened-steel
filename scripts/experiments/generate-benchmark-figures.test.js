import assert from 'node:assert/strict';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {makeCube} from './b3-matched-atmosphere-solver/cube.js';
import {PUBLISHED_MODELS} from './b1-directional-sky-radiance/published-oracle.js';
import {
	computeB1Scores,
	computeB3ResidualSummary,
	generateB1Figures,
	generateBenchmarkFigures,
	parseArguments,
	parseMeasurementPacketBoundary,
	renderB1AggregateFigure,
	renderB1PerTimeFigure,
	renderB2Figure,
	renderB3Figure,
	validateAlgorithm32ProfileProvenance,
} from './generate-benchmark-figures.js';

function measurementBoundaryText(value = 1) {
	const header = ['time', 'grid_x', 'grid_y', ...Array.from({length: 40}, (_, index) => `lambda_${index}`)].join(
		'\t',
	);
	const rows = [header];
	for (let condition = 0; condition < 17; condition += 1) {
		const minutes = 9 * 60 + 30 + condition * 15;
		const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
		for (let x = 0; x < 9; x += 1) {
			for (let y = 0; y < 9; y += 1) {
				rows.push([time, x, y, ...Array(40).fill(value)].join('\t'));
			}
		}
	}
	return rows.join('\n');
}

function constantCube(value) {
	return makeCube(Array.from({length: 17}, () => Array.from({length: 81}, () => Array(31).fill(value))));
}

function constantSpectraModels(value, modelNames) {
	return new Map(
		modelNames.map((model) => [
			model,
			new Map(
				Array.from({length: 17}, (_, condition) => {
					const minutes = 9 * 60 + 30 + condition * 15;
					const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
					return [time, Array.from({length: 9}, () => Array.from({length: 9}, () => Array(40).fill(value)))];
				}),
			),
		]),
	);
}

function algorithm32IrradianceCurve(values) {
	return Object.freeze({
		conditions: Object.freeze(
			values.map((value, index) =>
				Object.freeze({
					localTime: `${index}`,
					diffuseSkyIrradiance: Object.freeze({proposed: value}),
				}),
			),
		),
	});
}

test('measurement packet parsing requires and preserves the complete canonical boundary', () => {
	const parsed = parseMeasurementPacketBoundary(measurementBoundaryText(0.125));
	assert.equal(parsed.size, 17);
	assert.equal(parsed.get('09:30')[0][0].length, 40);
	assert.equal(parsed.get('13:30')[8][8][39], 0.125);
});

test('B3 summaries retain the time, wavelength, and zenith-ring axes', () => {
	const measurement = constantCube(0.01);
	const reference = constantCube(0.012);
	const summary = computeB3ResidualSummary(measurement, reference);
	assert.equal(summary.score.sampleCount, 17 * 81 * 31);
	assert.ok(Math.abs(summary.score.rmseMilliwatt - 2) < 1e-12);
	assert.equal(summary.score.conditions.length, 17);
	assert.equal(summary.spectral.length, 31);
	assert.equal(summary.angular.length, 5);
	assert.ok(summary.spectral.every((item) => Math.abs(item.rmseMilliwatt - 2) < 1e-12));
	assert.ok(summary.angular.every((item) => Math.abs(item.rmseMilliwatt - 2) < 1e-12));
});

test('B1 figures render only the selected J4 boundary as Algorithm32', () => {
	const measurements = parseMeasurementPacketBoundary(measurementBoundaryText(0.01));
	const publishedScores = computeB1Scores(measurements, constantSpectraModels(0.012, PUBLISHED_MODELS));
	const algorithm32Score = computeB1Scores(measurements, constantSpectraModels(0.015, ['proposed']), [
		'proposed',
	]).get('proposed');
	const perTime = renderB1PerTimeFigure(publishedScores, algorithm32Score);
	const aggregate = renderB1AggregateFigure(publishedScores, algorithm32Score);
	assert.match(perTime, />Algorithm32</);
	assert.match(perTime, /stroke="#b00020"/);
	const algorithmLegendY = Number(perTime.match(/<text class="legend"[^>]*y="([^"]+)">Algorithm32<\/text>/)[1]);
	const publishedValueKeyY = Number(perTime.match(/data-role="published-value-key" data-y="([^"]+)"/)[1]);
	assert.ok(publishedValueKeyY > algorithmLegendY + 20);
	assert.match(aggregate, /Algorithm32/);
	assert.doesNotMatch(`${perTime}\n${aggregate}`, /Algorithm32 \(Default\)/);
	assert.doesNotMatch(`${perTime}\n${aggregate}`, />Algorithm32 J[2-5]</);
	assert.doesNotMatch(`${perTime}\n${aggregate}`, /Algorithm32-hi/);
	assert.doesNotMatch(`${perTime}\n${aggregate}`, /proposed method absent|not shown/i);
});

test('B2 SVG rendering is deterministic and shows only the selected Algorithm32 boundary', () => {
	const curve = Array.from({length: 17}, (_, index) => ({
		localTime: `${String(9 + Math.floor((30 + index * 15) / 60)).padStart(2, '0')}:${String((30 + index * 15) % 60).padStart(2, '0')}`,
		diffuseSkyIrradiance: 50 + index,
	}));
	const algorithm32 = algorithm32IrradianceCurve(curve.map((item) => item.diffuseSkyIrradiance - 2));
	const first = renderB2Figure(curve, null, algorithm32, {source: '<synthetic & fixture>'});
	const second = renderB2Figure(curve, null, algorithm32, {source: '<synthetic & fixture>'});
	assert.equal(first, second);
	assert.match(first, /^<\?xml version="1\.0"/);
	assert.match(first, />Algorithm32</);
	assert.match(first, /stroke="#b00020"/);
	assert.doesNotMatch(first, /Algorithm32 \(Default\)/);
	assert.doesNotMatch(first, />Algorithm32 J[2-5]</);
	assert.match(first, /No optional local comparison-model spectra table was available/);
	assert.match(first, /&lt;synthetic &amp; fixture&gt;/);
	assert.doesNotMatch(first, /proposed method absent|not shown/i);
	assert.doesNotMatch(first, /Algorithm32-hi/);
	assert.doesNotMatch(first, /<script|(?:href|src)=["']https?:\/\//);
});

test('B3 figure limits published libRadtran to aggregates and displays only Algorithm32', () => {
	const measurement = constantCube(0.01);
	const algorithm32 = constantCube(0.014);
	const summary = computeB3ResidualSummary(measurement, algorithm32);
	const svg = renderB3Figure(summary, algorithm32);
	assert.match(svg, /Algorithm32 RMSE: 4/);
	assert.match(svg, /11\.48 coarse; 11\.45 refined/);
	assert.match(svg, /Diagnostics are not pointwise libRadtran comparisons/);
	assert.match(svg, /stroke="#b00020"/);
	assert.doesNotMatch(svg, /Algorithm32 \(Default\)/);
	assert.doesNotMatch(svg, />Algorithm32 J[2-5]</);
	assert.doesNotMatch(svg, /Algorithm32-hi/);
	assert.doesNotMatch(svg, /proposed method absent|not shown/i);
});

test('profile provenance must identify the exact Default and J2 through J5 controls', () => {
	const base = {
		schema: 'algorithm32-kider-boundary-provenance-v1',
		modelNameInBenchmarkTables: 'proposed',
		productionSource: {
			calculationBoundary: 'complete production Algorithm32 CPU Reference calculation',
		},
		nativeSpectralBoundary: {channelCount: 15},
	};
	const regular = {
		...base,
		runId: 'regular',
		profileId: 'default',
		presentationName: 'Algorithm32 — production Default 40/20/34/48, native 15-channel packet',
		numericalControls: {
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 34,
			incidentAltitudeBinCount: 48,
		},
	};
	const nOrderControls = {
		pathIntervalCount: 40,
		sourceTransmittanceIntervalCount: 20,
		incidentDirectionCount: 34,
		incidentAltitudeBinCount: 48,
		incomingDirectionDomain: 'source-oriented-fibonacci-pinned-34',
		scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
		scatteringOutputFaceWidth: 27,
		scatteringOutputDirectionCount: 4374,
		positionNodeCount: 48,
		positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
	};
	const j2 = {
		...base,
		runId: 'j2',
		profileId: 'j2',
		presentationName:
			'Algorithm32 J2 - W27 cumulative scattering through order 2 with view-only physical-altitude interpolation, native 15-channel packet',
		numericalControls: {
			...nOrderControls,
			maximumScatteringOrder: 2,
		},
	};
	const j3 = {
		...base,
		runId: 'j3',
		profileId: 'j3',
		presentationName:
			'Algorithm32 J3 - W27 cumulative scattering through order 3 with view-only physical-altitude interpolation, native 15-channel packet',
		numericalControls: {
			...nOrderControls,
			maximumScatteringOrder: 3,
		},
	};
	const j4 = {
		...base,
		runId: 'j4',
		profileId: 'j4',
		presentationName:
			'Algorithm32 J4 - W27 cumulative scattering through order 4 with view-only physical-altitude interpolation, native 15-channel packet',
		numericalControls: {
			...nOrderControls,
			maximumScatteringOrder: 4,
		},
	};
	const j5 = {
		...base,
		runId: 'j5',
		profileId: 'j5',
		presentationName:
			'Algorithm32 J5 - W27 cumulative scattering through order 5 with view-only physical-altitude interpolation, native 15-channel packet',
		numericalControls: {
			...nOrderControls,
			maximumScatteringOrder: 5,
		},
	};
	assert.equal(validateAlgorithm32ProfileProvenance(regular, 'default').controls.incidentDirectionCount, 34);
	assert.equal(validateAlgorithm32ProfileProvenance(j2, 'j2').controls.maximumScatteringOrder, 2);
	assert.equal(validateAlgorithm32ProfileProvenance(j3, 'j3').controls.maximumScatteringOrder, 3);
	assert.equal(validateAlgorithm32ProfileProvenance(j4, 'j4').controls.maximumScatteringOrder, 4);
	assert.equal(validateAlgorithm32ProfileProvenance(j5, 'j5').controls.maximumScatteringOrder, 5);
	assert.equal(
		validateAlgorithm32ProfileProvenance({...regular, profileId: undefined}, 'default').controls
			.incidentDirectionCount,
		34,
	);
	assert.throws(
		() =>
			validateAlgorithm32ProfileProvenance(
				{
					...j4,
					numericalControls: {...j4.numericalControls, maximumScatteringOrder: 3},
				},
				'j4',
			),
		/must be 4/,
	);
});

test('argument parsing accepts J3 and J5 spectra, cube, and provenance paths', () => {
	const options = parseArguments([
		'--algorithm32-j3-spectra',
		'j3.tsv',
		'--algorithm32-j3-cube',
		'j3.json',
		'--algorithm32-j3-provenance',
		'j3-provenance.json',
		'--algorithm32-j5-spectra',
		'j5.tsv',
		'--algorithm32-j5-cube',
		'j5.json',
		'--algorithm32-j5-provenance',
		'j5-provenance.json',
	]);
	assert.equal(options.algorithm32J3Spectra, resolve('j3.tsv'));
	assert.equal(options.algorithm32J3Cube, resolve('j3.json'));
	assert.equal(options.algorithm32J3Provenance, resolve('j3-provenance.json'));
	assert.equal(options.algorithm32J5Spectra, resolve('j5.tsv'));
	assert.equal(options.algorithm32J5Cube, resolve('j5.json'));
	assert.equal(options.algorithm32J5Provenance, resolve('j5-provenance.json'));
});

test('Q30 receiver-local figure provenance preserves the selected view and rejects legacy controls', () => {
	const receiverLocal = {
		modelNameInBenchmarkTables: 'proposed',
		profileId: 'paper',
		presentationName: 'Algorithm32 Paper',
		spectralBoundary: {channelCount: 40, projection: 'identity-direct-40'},
		physicalProfileId: 'algorithm32-paper-comparison-v1',
		physicalProfileContentHash: 'sha256:d47601d954167ca8775c0a88cd8ca9b9527ae8e74a6f42ae6041eec3244aeecc',
		schema: 'algorithm32-current-production-b1-provenance-v2',
		executionBoundary: 'production GPU Q30 final-view shader',
		cacheRepresentation: 'receiver-local-native48-z180-w27',
		numericalControls: {
			sourceTransmittanceIntervalCount: 20,
			incidentAltitudeBinCount: 48,
			incidentDirectionCount: 68,
			pathIntervalCount: 30,
			pathSampleDistribution: 'quadratic-near-observer-v1',
		},
	};
	assert.equal(validateAlgorithm32ProfileProvenance(receiverLocal, 'paper').controls.pathIntervalCount, 30);
	for (const mutation of [
		(value) => {
			delete value.numericalControls.pathSampleDistribution;
		},
		(value) => {
			value.numericalControls.pathIntervalCount = 40;
		},
	]) {
		const changed = structuredClone(receiverLocal);
		mutation(changed);
		assert.throws(() => validateAlgorithm32ProfileProvenance(changed, 'paper'), /provenance path/);
	}
});

test('paper profile provenance requires direct 40-coordinate spectral transport', () => {
	const paper = {
		schema: 'algorithm32-kider-boundary-provenance-v1',
		modelNameInBenchmarkTables: 'proposed',
		profileId: 'paper',
		presentationName: 'Algorithm32 Paper',
		productionSource: {calculationBoundary: 'Algorithm32 paper-comparison CPU evaluation'},
		spectralBoundary: {channelCount: 40, projection: 'identity-direct-40'},
		physicalProfileId: 'algorithm32-paper-comparison-v1',
		physicalProfileContentHash: 'sha256:d47601d954167ca8775c0a88cd8ca9b9527ae8e74a6f42ae6041eec3244aeecc',
		numericalControls: {
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 34,
			incidentAltitudeBinCount: 48,
		},
	};
	assert.equal(validateAlgorithm32ProfileProvenance(paper, 'paper').label, 'Algorithm32 Paper');

	assert.equal(
		validateAlgorithm32ProfileProvenance(
			{
				...paper,
				schema: 'algorithm32-current-production-b1-provenance-v2',
				executionBoundary: 'production GPU cache and final-view shader',
				productionSource: undefined,
			},
			'paper',
		).label,
		'Algorithm32 Paper',
	);
	assert.throws(
		() =>
			validateAlgorithm32ProfileProvenance(
				{
					...paper,
					spectralBoundary: {channelCount: 15},
				},
				'paper',
			),
		/must be 40/,
	);
	assert.throws(
		() =>
			validateAlgorithm32ProfileProvenance(
				{
					...paper,
					spectralBoundary: {channelCount: 40, projection: 'native-15-resample'},
				},
				'paper',
			),
		/spectral projection must be identity-direct-40/,
	);
	assert.throws(
		() =>
			validateAlgorithm32ProfileProvenance(
				{
					...paper,
					physicalProfileContentHash: 'sha256:wrong',
				},
				'paper',
			),
		/physicalProfileContentHash/,
	);
	assert.equal(parseArguments(['--profile-family', 'paper']).profileFamily, 'paper');
});

test('reflection-completed paper profile provenance accepts the experimental 136-direction boundary', () => {
	const provenance = {
		schema: 'algorithm32-current-production-b1-provenance-v2',
		modelNameInBenchmarkTables: 'proposed',
		profileId: 'paper-j4-reflection-completed-136',
		presentationName: 'Algorithm32 Paper J4 Experimental Reflection-Completed 136',
		executionBoundary: 'production GPU cache and final-view shader',
		spectralBoundary: {channelCount: 40, projection: 'identity-direct-40'},
		physicalProfileId: 'algorithm32-paper-comparison-v1',
		physicalProfileContentHash: 'sha256:d47601d954167ca8775c0a88cd8ca9b9527ae8e74a6f42ae6041eec3244aeecc',
		numericalControls: {
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 136,
			incidentAltitudeBinCount: 48,
			incomingDirectionDomain: 'b1-reflection-completed-paired-rotated-fibonacci-136-v1',
			scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
			scatteringOutputFaceWidth: 27,
			scatteringOutputDirectionCount: 4374,
			positionNodeCount: 48,
			positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
			maximumScatteringOrder: 4,
		},
	};
	assert.equal(
		validateAlgorithm32ProfileProvenance(provenance, 'paper-j4-reflection-completed-136').controls
			.incidentDirectionCount,
		136,
	);
});

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const b1ResultRoot = join(repositoryRoot, 'references', 'results', 'experiments', 'b1-directional-sky-radiance');
const b3ResultRoot = join(repositoryRoot, 'references', 'results', 'experiments', 'b3-matched-atmosphere-solver');
const existingCandidateArtifacts = Object.freeze({
	j2Spectra: join(b1ResultRoot, 'algorithm32-j2-proposed.tsv'),
	j2Provenance: join(b1ResultRoot, 'algorithm32-j2-boundary-provenance.json'),
	j2Cube: join(b3ResultRoot, 'algorithm32-j2-proposed-cube.json'),
	j3Spectra: join(b1ResultRoot, 'algorithm32-j3-proposed.tsv'),
	j3Provenance: join(b1ResultRoot, 'algorithm32-j3-boundary-provenance.json'),
	j3Cube: join(b3ResultRoot, 'algorithm32-j3-proposed-cube.json'),
	j4Spectra: join(b1ResultRoot, 'algorithm32-j4-proposed.tsv'),
	j4Provenance: join(b1ResultRoot, 'algorithm32-j4-boundary-provenance.json'),
	j4Cube: join(b3ResultRoot, 'algorithm32-j4-proposed-cube.json'),
	j5Spectra: join(b1ResultRoot, 'algorithm32-j5-proposed.tsv'),
	j5Provenance: join(b1ResultRoot, 'algorithm32-j5-boundary-provenance.json'),
	j5Cube: join(b3ResultRoot, 'algorithm32-j5-proposed-cube.json'),
});
const existingCandidateArtifactsAvailable = Object.values(existingCandidateArtifacts).every(existsSync);
const durableJBoundariesAvailable = [
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b1-directional-sky-radiance',
		'algorithm32-j2-proposed.tsv',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b1-directional-sky-radiance',
		'algorithm32-j2-boundary-provenance.json',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b3-matched-atmosphere-solver',
		'algorithm32-j2-proposed-cube.json',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b1-directional-sky-radiance',
		'algorithm32-j3-proposed.tsv',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b1-directional-sky-radiance',
		'algorithm32-j3-boundary-provenance.json',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b3-matched-atmosphere-solver',
		'algorithm32-j3-proposed-cube.json',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b1-directional-sky-radiance',
		'algorithm32-j4-proposed.tsv',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b1-directional-sky-radiance',
		'algorithm32-j4-boundary-provenance.json',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b3-matched-atmosphere-solver',
		'algorithm32-j4-proposed-cube.json',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b1-directional-sky-radiance',
		'algorithm32-j5-proposed.tsv',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b1-directional-sky-radiance',
		'algorithm32-j5-boundary-provenance.json',
	),
	join(
		repositoryRoot,
		'references',
		'results',
		'experiments',
		'b3-matched-atmosphere-solver',
		'algorithm32-j5-proposed-cube.json',
	),
].every(existsSync);

test(
	'full temporary generation displays only selected J4 as Algorithm32',
	{
		timeout: 30000,
		skip: existingCandidateArtifactsAvailable
			? false
			: 'Existing Default/J2/J3/J4/J5 boundaries required by the integration fixture are unavailable.',
	},
	() => {
		const directory = mkdtempSync(join(tmpdir(), 'algorithm32-benchmark-adjacent-orders-'));
		try {
			const run = generateBenchmarkFigures({outputRoot: join(directory, 'output')});
			assert.equal(run.artifacts.length, 8);
			assert.equal(run.artifacts.filter(({path}) => path.endsWith('.svg')).length, 5);
			assert.equal(run.artifacts.filter(({path}) => path.endsWith('.png')).length, 3);
			assert.equal(Object.hasOwn(run, 'b1Figure5J2Panels'), false);
			assert.equal(Object.hasOwn(run, 'b1Figure5J3Panels'), false);
			assert.equal(Object.hasOwn(run, 'b1Figure5J5Panels'), false);
			assert.equal(run.b1Figure5Panels.length, 3);
			assert.equal(run.b1Figure5J4Panels.length, 3);
			assert.equal(run.b2Algorithm32.conditions.length, 17);
			assert.ok(Number.isFinite(run.b1Algorithm32Score.aggregateRmseMilliwatt));
			assert.ok(Number.isFinite(run.b3Algorithm32Summary.score.rmseMilliwatt));
			for (const artifact of run.artifacts.filter(({path}) => path.endsWith('.svg'))) {
				const svg = readFileSync(artifact.path, 'utf8');
				assert.match(svg, />Algorithm32<\/text>/);
				assert.doesNotMatch(svg, />Algorithm32 \(Default\)<\/text>/);
				assert.doesNotMatch(svg, />Algorithm32 J[2-5]<\/text>/);
				assert.doesNotMatch(svg, /Algorithm32-hi/);
			}
			for (const artifact of run.artifacts.filter(({path}) => path.endsWith('.png'))) {
				assert.match(artifact.path, /b1-figure5-algorithm32-\d/);
				assert.doesNotMatch(artifact.path, /-j[2-5]-/);
			}
		} finally {
			rmSync(directory, {recursive: true, force: true});
		}
	},
);

test(
	'B1-only generation writes every original B1 figure without B2 or B3 inputs',
	{
		timeout: 30000,
		skip: existingCandidateArtifactsAvailable
			? false
			: 'Existing selected J4 boundary required by the integration fixture is unavailable.',
	},
	() => {
		const directory = mkdtempSync(join(tmpdir(), 'algorithm32-b1-figures-'));
		try {
			const run = generateB1Figures({outputRoot: directory, colorModel: 'basic-bruneton'});
			assert.equal(run.artifacts.length, 6);
			assert.equal(run.artifacts.filter(({path}) => path.endsWith('.svg')).length, 3);
			assert.equal(run.artifacts.filter(({path}) => path.endsWith('.png')).length, 3);
			assert.equal(run.b1Figure5PublishedPanels.length, 27);
			assert.equal(run.b1Figure5Panels.length, 3);
			assert.deepEqual(run.figureColorControl, {
				schemaId: 'algorithm32-b1-figure-color-control-v1',
				selectionId: 'basic-bruneton',
				implementationId: 'bruneton-figure1-display',
				role: 'six-b1-visual-comparison-figures-only',
				artifactCount: 6,
				participatesInPhysicalScoring: false,
			});
			assert.ok(run.artifacts.every(({path}) => path.includes('b1-directional-sky-radiance')));
			assert.equal(existsSync(join(directory, 'b2-hemispherical-sky-irradiance')), false);
			assert.equal(existsSync(join(directory, 'b3-matched-atmosphere-solver')), false);
		} finally {
			rmSync(directory, {recursive: true, force: true});
		}
	},
);

test(
	'durable figure generation displays selected J4 as Algorithm32',
	{
		timeout: 30000,
		skip: durableJBoundariesAvailable ? false : 'J3/J5 durable benchmark boundaries have not been generated yet.',
	},
	() => {
		const directory = mkdtempSync(join(tmpdir(), 'algorithm32-benchmark-figures-'));
		try {
			const run = generateBenchmarkFigures({outputRoot: directory});
			assert.equal(run.artifacts.length, 8);
			assert.equal(run.b1Figure5PublishedPanels.length, 27);
			assert.equal(run.b1Figure5Panels.length, 3);
			assert.equal(Object.hasOwn(run, 'b1Figure5J2Panels'), false);
			assert.equal(Object.hasOwn(run, 'b1Figure5J3Panels'), false);
			assert.equal(run.b1Figure5J4Panels.length, 3);
			assert.equal(Object.hasOwn(run, 'b1Figure5J5Panels'), false);
			assert.ok(Number.isFinite(run.b1Algorithm32Score.aggregateRmseMilliwatt));
			assert.equal(run.b2Algorithm32.conditions.length, 17);
			assert.ok(Number.isFinite(run.b3Algorithm32Summary.score.rmseMilliwatt));
			for (const artifact of run.artifacts) {
				if (artifact.path.endsWith('.svg')) {
					const svg = readFileSync(artifact.path, 'utf8');
					assert.match(svg, />Algorithm32<\/text>/);
					assert.doesNotMatch(svg, />Algorithm32 \(Default\)<\/text>/);
					assert.doesNotMatch(svg, />Algorithm32 J[2-5]<\/text>/);
					assert.doesNotMatch(svg, /Algorithm32-hi/);
					assert.doesNotMatch(
						svg,
						/proposed method absent|Proposed-method results are not shown|do not show the proposed method/i,
					);
				} else {
					const png = readFileSync(artifact.path);
					assert.ok(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
					assert.match(artifact.path, /b1-figure5-algorithm32-\d/);
					assert.doesNotMatch(artifact.path, /-j[2-5]-/);
				}
			}
		} finally {
			rmSync(directory, {recursive: true, force: true});
		}
	},
);
