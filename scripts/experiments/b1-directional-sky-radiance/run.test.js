import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

import {
	CAPTURE_TIMES,
	EXPECTED_DATASET_FINGERPRINTS,
	SCORE_SAMPLE_INDICES,
	SAMPLE_COORDINATES,
	SPECTRUM,
	aggregateConditionScores,
	canonicalCoordinate,
	computeTheoreticalSunDirection,
	getSampleDirection,
	integrateCommonInterval,
	loadKiderDataset,
	parseKiderSpectrum,
	resampleToBruneton40,
	scoreCondition,
	wavelengthAt,
} from './benchmark.js';
import {PUBLISHED_MODELS, PUBLISHED_RMSE_ORACLE} from './published-oracle.js';
import {
	algorithm32DisplayName,
	CANDIDATE_PROFILES,
	N_ORDER_PROFILE_KEYS,
	PAPER_CANDIDATE_PROFILES,
	verifyCandidateProvenance,
} from './candidate-provenance.js';
import {N_ORDER_CANDIDATE_DEFINITIONS, parseArguments, renderReport, runExperiment} from './run.js';
import {NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/position/spherical-native/consts.js';

const dataset = loadKiderDataset();
const resultDirectory = new URL(
	'../../../references/results/experiments/b1-directional-sky-radiance/',
	import.meta.url,
);
const canonicalOptions = Object.freeze({
	canonical: true,
	proposedPath: fileURLToPath(new URL('algorithm32-proposed.tsv', resultDirectory)),
	proposedProvenancePath: fileURLToPath(new URL('algorithm32-boundary-provenance.json', resultDirectory)),
	judgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-judgment-rules.json', import.meta.url)),
	proposedJ2Path: fileURLToPath(new URL('algorithm32-j2-proposed.tsv', resultDirectory)),
	proposedJ2ProvenancePath: fileURLToPath(new URL('algorithm32-j2-boundary-provenance.json', resultDirectory)),
	j2JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j2-judgment-rules.json', import.meta.url)),
	proposedJ3Path: fileURLToPath(new URL('algorithm32-j3-proposed.tsv', resultDirectory)),
	proposedJ3ProvenancePath: fileURLToPath(new URL('algorithm32-j3-boundary-provenance.json', resultDirectory)),
	j3JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j3-judgment-rules.json', import.meta.url)),
	proposedJ4Path: fileURLToPath(new URL('algorithm32-j4-proposed.tsv', resultDirectory)),
	proposedJ4ProvenancePath: fileURLToPath(new URL('algorithm32-j4-boundary-provenance.json', resultDirectory)),
	j4JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j4-judgment-rules.json', import.meta.url)),
	proposedJ5Path: fileURLToPath(new URL('algorithm32-j5-proposed.tsv', resultDirectory)),
	proposedJ5ProvenancePath: fileURLToPath(new URL('algorithm32-j5-boundary-provenance.json', resultDirectory)),
	j5JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j5-judgment-rules.json', import.meta.url)),
});

const acceptedThreeCandidateOptions = Object.freeze({
	proposedPath: canonicalOptions.proposedPath,
	proposedProvenancePath: canonicalOptions.proposedProvenancePath,
	judgmentRulesPath: canonicalOptions.judgmentRulesPath,
	proposedJ2Path: canonicalOptions.proposedJ2Path,
	proposedJ2ProvenancePath: canonicalOptions.proposedJ2ProvenancePath,
	j2JudgmentRulesPath: canonicalOptions.j2JudgmentRulesPath,
	proposedJ4Path: canonicalOptions.proposedJ4Path,
	proposedJ4ProvenancePath: canonicalOptions.proposedJ4ProvenancePath,
	j4JudgmentRulesPath: canonicalOptions.j4JudgmentRulesPath,
});

function constantGrid(value) {
	return Array.from({length: 9}, () => Array.from({length: 9}, () => Float64Array.from({length: 40}, () => value)));
}

function withSyntheticAdjacentOrderProvenance(callback) {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-b1-adjacent-orders-'));
	try {
		const source = JSON.parse(readFileSync(canonicalOptions.proposedJ2ProvenancePath, 'utf8'));
		const paths = {};
		for (const order of [3, 5]) {
			const path = join(directory, `algorithm32-j${order}-boundary-provenance.json`);
			writeFileSync(
				path,
				JSON.stringify({
					...source,
					runId: `synthetic-j${order}-profile-wiring`,
					profileId: `j${order}`,
					numericalControls: {
						...source.numericalControls,
						maximumScatteringOrder: order,
					},
				}),
				'utf8',
			);
			paths[`j${order}`] = path;
		}
		return callback(Object.freeze(paths));
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
}

test('Algorithm32 display names assume order 4 and subscript every explicit order', () => {
	assert.equal(algorithm32DisplayName(4, {explicitDefault: false}), 'Algorithm32');
	assert.equal(algorithm32DisplayName(4), 'Algorithm32₄');
	assert.equal(algorithm32DisplayName(2), 'Algorithm32₂');
	assert.equal(algorithm32DisplayName(15), 'Algorithm32₁₅');
	assert.throws(() => algorithm32DisplayName(0), /positive integer/);
});

test('the retained spectrum has exactly 40 samples at 11.75 nm spacing', () => {
	assert.equal(SPECTRUM.spacingNm, 11.75);
	assert.equal(wavelengthAt(0), 360);
	assert.equal(wavelengthAt(1), 371.75);
	assert.equal(wavelengthAt(39), 818.25);
	assert.equal(wavelengthAt(40), 830);
});

test('the paper RMSE predicate selects exactly 31 samples ending at 712.5 nm', () => {
	assert.equal(SCORE_SAMPLE_INDICES.length, 31);
	assert.deepEqual(
		SCORE_SAMPLE_INDICES,
		Array.from({length: 31}, (_, i) => i),
	);
	assert.equal(wavelengthAt(SCORE_SAMPLE_INDICES.at(-1)), 712.5);
	assert.ok(wavelengthAt(31) > 720);
});

test('linear source interpolation reproduces an exact fractional 40-sample point', () => {
	const text = ['Wavelength\ttest', ...Array.from({length: 2151}, (_, i) => `${350 + i}\t${2 * (350 + i) + 1}`)].join(
		'\n',
	);
	const source = parseKiderSpectrum(text);
	const sampled = resampleToBruneton40(source);
	assert.equal(sampled[0], 721);
	assert.equal(sampled[1], 744.5);
	assert.equal(sampled[39], 1637.5);
});

test('malformed source spectra are rejected', () => {
	assert.throws(() => parseKiderSpectrum('Wavelength\ttest\n350\t1'));
});

test('the Kider traversal is a bijection onto the canonical 9x9 grid', () => {
	assert.equal(SAMPLE_COORDINATES.length, 81);
	const coordinates = new Set(
		Array.from({length: 81}, (_, i) => {
			const {gridX, gridY} = canonicalCoordinate(i);
			return `${gridX},${gridY}`;
		}),
	);
	assert.equal(coordinates.size, 81);
	assert.deepEqual(canonicalCoordinate(0), {gridX: 8, gridY: 4});
	assert.deepEqual(canonicalCoordinate(1), {gridX: 8, gridY: 3});
	assert.deepEqual(canonicalCoordinate(31), {gridX: 8, gridY: 5});
});

test('the retained Shirley-Chiu map preserves zenith and north sample directions', () => {
	const zenith = getSampleDirection(4, 4);
	assert.equal(zenith.zenithDegrees, 0);
	const north = getSampleDirection(8, 4);
	assert.ok(Math.abs(north.azimuthDegrees) < 1e-12);
	assert.ok(Math.abs(north.zenithDegrees - (90 - 12.1151)) < 5e-5);
});

test('the solar mapping uses all 17 local captures and a four-hour UTC offset', () => {
	assert.deepEqual(CAPTURE_TIMES, [
		'09:30',
		'09:45',
		'10:00',
		'10:15',
		'10:30',
		'10:45',
		'11:00',
		'11:15',
		'11:30',
		'11:45',
		'12:00',
		'12:15',
		'12:30',
		'12:45',
		'13:00',
		'13:15',
		'13:30',
	]);
	assert.equal(computeTheoreticalSunDirection('09:30').utcTime, '13:30');
	assert.equal(computeTheoreticalSunDirection('13:30').utcTime, '17:30');
});

test('each capture reproduces the retained measurement-symmetry solar-azimuth fit', () => {
	for (const condition of dataset.conditions) {
		assert.ok(Number.isFinite(condition.sun.fittedAzimuthDegrees));
		assert.ok(Number.isFinite(condition.sun.azimuthSymmetryError));
		assert.ok(Math.abs(condition.sun.fittedAzimuthDegrees - condition.sun.theoreticalAzimuthDegrees) <= 20.0000001);
		const quantizedOffset =
			(condition.sun.fittedAzimuthDegrees - (condition.sun.theoreticalAzimuthDegrees - 20)) / 0.2;
		assert.ok(Math.abs(quantizedOffset - Math.round(quantizedOffset)) < 1e-9);
	}
});

test('all 17x81 official spectra validate and are resampled exactly once', () => {
	assert.equal(dataset.captureCount, 17);
	assert.equal(dataset.spectrumCount, 1377);
	assert.equal(dataset.sourceValueCount, 2_961_927);
	assert.equal(dataset.resampledValueCount, 55_080);
	assert.equal(dataset.scoreValueCount, 42_687);
	assert.equal(dataset.rawAcquisitionSha256, EXPECTED_DATASET_FINGERPRINTS.rawAcquisitionSha256);
	assert.equal(dataset.processedGridSha256, EXPECTED_DATASET_FINGERPRINTS.processedGridSha256);
});

test('each condition applies the published north-sample repair', () => {
	for (const condition of dataset.conditions) {
		for (let i = 0; i < 40; i += 1) {
			assert.equal(condition.grid[8][4][i], (condition.grid[8][3][i] + condition.grid[8][5][i]) * 0.5);
		}
	}
});

test('identity scoring is zero over exactly 81x31 values', () => {
	const score = scoreCondition(dataset.conditions[0].grid, dataset.conditions[0].grid);
	assert.equal(score.sampleCount, 81 * 31);
	assert.equal(score.rmseW, 0);
	assert.equal(score.paperRoundedRmseMilliwatt, 0);
});

test('RMSE includes index 30 and excludes index 31', () => {
	const measured = constantGrid(0);
	const model = constantGrid(0);
	for (let x = 0; x < 9; x += 1) for (let y = 0; y < 9; y += 1) model[x][y][30] = 1;
	assert.ok(Math.abs(scoreCondition(model, measured).rmseW - 1 / Math.sqrt(31)) < 1e-15);
	for (let x = 0; x < 9; x += 1)
		for (let y = 0; y < 9; y += 1) {
			model[x][y][30] = 0;
			model[x][y][31] = 1;
		}
	assert.equal(scoreCondition(model, measured).rmseW, 0);
});

test('the directional integral clips the final scoring bin at 720 nm', () => {
	const spectrum = new Float64Array(40);
	spectrum[30] = 2;
	spectrum[31] = 1000;
	assert.equal(integrateCommonInterval(spectrum), 15);
});

test('aggregate scoring is RMS over all 17 per-time RMSE values', () => {
	const scores = CAPTURE_TIMES.map((_, i) => ({rmseW: i + 1}));
	const expected = Math.sqrt(scores.reduce((sum, item) => sum + item.rmseW ** 2, 0) / 17);
	assert.equal(aggregateConditionScores(scores).rmseW, expected);
});

test('the published oracle contains all nine models, three Figure 5 times, and aggregate values', () => {
	assert.equal(PUBLISHED_MODELS.length, 9);
	assert.deepEqual(Object.keys(PUBLISHED_RMSE_ORACLE.perTime), ['10:15', '11:15', '13:15']);
	for (const values of [...Object.values(PUBLISHED_RMSE_ORACLE.perTime), PUBLISHED_RMSE_ORACLE.aggregate]) {
		assert.deepEqual(Object.keys(values), PUBLISHED_MODELS);
	}
	assert.equal(PUBLISHED_RMSE_ORACLE.aggregate.bruneton, 11.3);
	assert.equal(PUBLISHED_RMSE_ORACLE.aggregate.libradtran, 11.5);
});

test('the ready run passes its available stage without accepting B1 prematurely', () => {
	const run = runExperiment();
	assert.equal(run.measurementStage.status, 'READY');
	assert.equal(run.publishedStage.status, 'UNRUN');
	assert.equal(run.proposedStage.status, 'UNRUN');
	assert.equal(run.status, 'IN PROGRESS');
	assert.equal(run.readyStagePassed, true);
	assert.equal(run.accepted, false);
});

test('canonical argument parsing retains Default and all four n-order boundaries and provenance sidecars', () => {
	const options = parseArguments([
		'--canonical',
		'--proposed',
		canonicalOptions.proposedPath,
		'--proposed-provenance',
		canonicalOptions.proposedProvenancePath,
		'--judgment-rules',
		canonicalOptions.judgmentRulesPath,
		'--proposed-j2',
		canonicalOptions.proposedJ2Path,
		'--proposed-j2-provenance',
		canonicalOptions.proposedJ2ProvenancePath,
		'--j2-judgment-rules',
		canonicalOptions.j2JudgmentRulesPath,
		'--proposed-j3',
		canonicalOptions.proposedJ3Path,
		'--proposed-j3-provenance',
		canonicalOptions.proposedJ3ProvenancePath,
		'--j3-judgment-rules',
		canonicalOptions.j3JudgmentRulesPath,
		'--proposed-j4',
		canonicalOptions.proposedJ4Path,
		'--proposed-j4-provenance',
		canonicalOptions.proposedJ4ProvenancePath,
		'--j4-judgment-rules',
		canonicalOptions.j4JudgmentRulesPath,
		'--proposed-j5',
		canonicalOptions.proposedJ5Path,
		'--proposed-j5-provenance',
		canonicalOptions.proposedJ5ProvenancePath,
		'--j5-judgment-rules',
		canonicalOptions.j5JudgmentRulesPath,
	]);
	assert.equal(options.canonical, true);
	assert.equal(options.proposedPath, canonicalOptions.proposedPath);
	assert.equal(options.proposedJ2Path, canonicalOptions.proposedJ2Path);
	assert.equal(options.proposedJ3Path, canonicalOptions.proposedJ3Path);
	assert.equal(options.proposedJ4Path, canonicalOptions.proposedJ4Path);
	assert.equal(options.proposedJ5Path, canonicalOptions.proposedJ5Path);
	assert.equal(options.proposedProvenancePath, canonicalOptions.proposedProvenancePath);
	assert.equal(options.proposedJ2ProvenancePath, canonicalOptions.proposedJ2ProvenancePath);
	assert.equal(options.proposedJ3ProvenancePath, canonicalOptions.proposedJ3ProvenancePath);
	assert.equal(options.proposedJ4ProvenancePath, canonicalOptions.proposedJ4ProvenancePath);
	assert.equal(options.proposedJ5ProvenancePath, canonicalOptions.proposedJ5ProvenancePath);
});

test('current-production scoring accepts one run manifest path', () => {
	assert.equal(
		parseArguments(['--production-run', 'tmp/current-production-run']).productionRunPath,
		join(process.cwd(), 'tmp/current-production-run'),
	);
});

test('paper candidate-family parsing is explicit and rejects unknown families', () => {
	assert.equal(parseArguments(['--profile-family', 'paper']).profileFamily, 'paper');
	assert.throws(() => parseArguments(['--profile-family', 'unknown']), /Unknown candidate profile family/);
});

test('paper candidate provenance identifies direct 40-coordinate transport', (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-paper-provenance-'));
	t.after(() => rmSync(directory, {recursive: true, force: true}));
	const path = join(directory, 'paper.json');
	writeFileSync(
		path,
		JSON.stringify({
			schema: 'algorithm32-kider-boundary-provenance-v1',
			runId: 'paper-test',
			modelNameInBenchmarkTables: 'proposed',
			profileId: 'paper',
			presentationName: 'Algorithm32 Paper',
			rowCount: 1377,
			spectralBoundary: {
				channelCount: 40,
				projection: PAPER_CANDIDATE_PROFILES.default.spectralProjection,
			},
			physicalProfileId: PAPER_CANDIDATE_PROFILES.default.physicalProfileId,
			physicalProfileContentHash: PAPER_CANDIDATE_PROFILES.default.physicalProfileContentHash,
			numericalControls: PAPER_CANDIDATE_PROFILES.default.controls,
		}),
		'utf8',
	);
	const provenance = verifyCandidateProvenance(path, PAPER_CANDIDATE_PROFILES.default);
	assert.equal(provenance.spectralChannelCount, 40);
	assert.throws(() => verifyCandidateProvenance(path, CANDIDATE_PROFILES.default), /channelCount/);
	const invalid = JSON.parse(readFileSync(path, 'utf8'));
	invalid.spectralBoundary.projection = 'native-15-resample';
	writeFileSync(path, JSON.stringify(invalid), 'utf8');
	assert.throws(
		() => verifyCandidateProvenance(path, PAPER_CANDIDATE_PROFILES.default),
		/spectralBoundary\.projection/,
	);
	invalid.spectralBoundary.projection = PAPER_CANDIDATE_PROFILES.default.spectralProjection;
	invalid.physicalProfileContentHash = 'sha256:wrong';
	writeFileSync(path, JSON.stringify(invalid), 'utf8');
	assert.throws(
		() => verifyCandidateProvenance(path, PAPER_CANDIDATE_PROFILES.default),
		/physicalProfileContentHash/,
	);
});

test('paper Native51 candidate provenance requires the exact named nodes and unchanged physical controls', (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-native51-provenance-'));
	t.after(() => rmSync(directory, {recursive: true, force: true}));
	const path = join(directory, 'candidate.json');
	const profile = PAPER_CANDIDATE_PROFILES.j4;
	const candidate = {
		schema: 'algorithm32-current-production-b1-provenance-v2',
		runId: 'native51-provenance-gate-test',
		backend: 'gpu-production-shaders-r32f',
		modelNameInBenchmarkTables: 'proposed',
		profileId: profile.provenanceProfileId,
		presentationName: profile.presentationName,
		rowCount: 1377,
		nativeSpectralBoundary: {channelCount: 40, projection: 'identity-direct-40'},
		physicalProfileId: profile.physicalProfileId,
		physicalProfileContentHash: profile.physicalProfileContentHash,
		cacheRepresentation: 'receiver-local-native51-near-ground-z180-w27',
		numericalControls: {
			...profile.controls,
			pathIntervalCount: 30,
			pathSampleDistribution: 'quadratic-near-observer-v1',
			incidentAltitudeBinCount: 51,
			positionNodeCount: 51,
			scatteringOutputDomain: 'receiver-local-boundary-inclusive-gnomonic-cubed-sphere-w27',
			positionDomain: {
				selection: 'native51-near-ground',
				id: NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER.id,
				nodes: NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER.nodes,
			},
		},
	};
	for (const selected of [profile, PAPER_CANDIDATE_PROFILES.default]) {
		writeFileSync(
			path,
			JSON.stringify({
				...candidate,
				profileId: selected.provenanceProfileId,
				presentationName: selected.presentationName,
			}),
		);
		assert.equal(verifyCandidateProvenance(path, selected).numericalControls.positionNodeCount, 51);
	}
	for (const mutate of [
		(value) => {
			delete value.numericalControls.positionDomain;
		},
		(value) => {
			value.numericalControls.positionDomain.selection = 'native48';
		},
		(value) => {
			value.numericalControls.positionDomain.id = 'unregistered-51-node-domain';
		},
		(value) => {
			value.numericalControls.positionDomain.nodes[1].coordinate.value = 469;
		},
		(value) => {
			value.numericalControls.positionDomain.nodes[1].coordinate.units = 'kilometers';
		},
		(value) => {
			value.numericalControls.incidentAltitudeBinCount = 48;
		},
		(value) => {
			value.numericalControls.positionNodeCount = 48;
		},
		(value) => {
			value.cacheRepresentation = 'receiver-local-native48-z180-w27';
		},
		(value) => {
			value.backend = 'cpu-reference-binary64';
		},
		(value) => {
			value.numericalControls.pathIntervalCount = 40;
		},
		(value) => {
			delete value.numericalControls.pathSampleDistribution;
		},
		(value) => {
			value.numericalControls.maximumScatteringOrder = 3;
		},
		(value) => {
			value.numericalControls.incidentDirectionCount = 34;
		},
		(value) => {
			value.numericalControls.scatteringOutputDomain =
				'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27';
		},
		(value) => {
			value.numericalControls.sourceTransmittanceIntervalCount = 40;
		},
		(value) => {
			value.physicalProfileContentHash = 'sha256:wrong';
		},
		(value) => {
			value.nativeSpectralBoundary.channelCount = 15;
		},
		(value) => {
			value.rowCount = 81;
		},
	]) {
		const invalid = structuredClone(candidate);
		mutate(invalid);
		for (const selected of [profile, PAPER_CANDIDATE_PROFILES.default]) {
			writeFileSync(
				path,
				JSON.stringify({
					...invalid,
					profileId: selected.provenanceProfileId,
					presentationName: selected.presentationName,
				}),
			);
			assert.throws(() => verifyCandidateProvenance(path, selected));
		}
	}
	const original = structuredClone(candidate);
	delete original.numericalControls.positionDomain;
	original.numericalControls.incidentAltitudeBinCount = 48;
	original.numericalControls.positionNodeCount = 48;
	original.cacheRepresentation = 'receiver-local-native48-z180-w27';
	writeFileSync(path, JSON.stringify(original));
	assert.equal(verifyCandidateProvenance(path, profile).numericalControls.positionNodeCount, 48);
	original.numericalControls.incidentAltitudeBinCount = 51;
	original.numericalControls.positionNodeCount = 51;
	writeFileSync(path, JSON.stringify(original));
	assert.throws(() => verifyCandidateProvenance(path, profile), /incidentAltitudeBinCount/);
});

test('candidate labels require exact independently supplied production provenance', () => {
	assert.deepEqual(N_ORDER_PROFILE_KEYS, ['j2', 'j3', 'j4', 'j5']);
	assert.deepEqual(
		N_ORDER_CANDIDATE_DEFINITIONS.map(({order}) => order),
		[2, 3, 4, 5],
	);
	const defaultProvenance = verifyCandidateProvenance(
		canonicalOptions.proposedProvenancePath,
		CANDIDATE_PROFILES.default,
	);
	const j2Provenance = verifyCandidateProvenance(canonicalOptions.proposedJ2ProvenancePath, CANDIDATE_PROFILES.j2);
	const j4Provenance = verifyCandidateProvenance(canonicalOptions.proposedJ4ProvenancePath, CANDIDATE_PROFILES.j4);
	assert.deepEqual(defaultProvenance.numericalControls, {
		pathIntervalCount: 40,
		sourceTransmittanceIntervalCount: 20,
		incidentDirectionCount: 34,
		incidentAltitudeBinCount: 48,
	});
	assert.equal(j2Provenance.numericalControls.scatteringOutputFaceWidth, 27);
	assert.equal(j2Provenance.numericalControls.maximumScatteringOrder, 2);
	assert.equal(j4Provenance.numericalControls.maximumScatteringOrder, 4);
	withSyntheticAdjacentOrderProvenance(({j3, j5}) => {
		const j3Provenance = verifyCandidateProvenance(j3, CANDIDATE_PROFILES.j3);
		const j5Provenance = verifyCandidateProvenance(j5, CANDIDATE_PROFILES.j5);
		assert.equal(j3Provenance.numericalControls.maximumScatteringOrder, 3);
		assert.equal(j5Provenance.numericalControls.maximumScatteringOrder, 5);
		assert.throws(() => verifyCandidateProvenance(j3, CANDIDATE_PROFILES.j5), /maximumScatteringOrder/);
	});
	assert.equal(defaultProvenance.modelName, 'proposed');
	assert.equal(j2Provenance.nativeChannelCount, 15);
	assert.equal(j4Provenance.rowCount, 1377);
	assert.throws(
		() => verifyCandidateProvenance(canonicalOptions.proposedProvenancePath, CANDIDATE_PROFILES.j2),
		/incomingDirectionDomain/,
	);
});

test('canonical scoring requires Default plus J2, J3, J4, and J5', () => {
	assert.throws(
		() =>
			runExperiment({
				...canonicalOptions,
				proposedJ5ProvenancePath: undefined,
			}),
		/missing --proposed-j5-provenance/,
	);
});

test('existing Default, J2, and J4 scores remain unchanged while adjacent orders are unrun', () => {
	const run = runExperiment(acceptedThreeCandidateOptions);
	assert.equal(run.status, 'ACCEPTED');
	assert.equal(run.accepted, true);
	assert.equal(run.profileComparisonComplete, false);
	assert.equal(run.proposedStage.candidateLabel, 'Algorithm32 (Default, 34 incident directions)');
	assert.equal(run.proposedJ2Stage.candidateLabel, 'Algorithm32₂ (cumulative scattering through order 2)');
	assert.equal(run.proposedJ4Stage.candidateLabel, 'Algorithm32₄ (cumulative scattering through order 4)');
	assert.equal(run.proposedJ3Stage.status, 'UNRUN');
	assert.equal(run.proposedJ5Stage.status, 'UNRUN');
	assert.ok(Math.abs(run.proposedStage.score.aggregate.rmseMilliwatt - 14.635671245903296) < 1e-12);
	assert.equal(run.proposedStage.assessment.classification, 'favorable');
	assert.equal(run.proposedStage.validity.valueCount, 17 * 81 * 40);
	assert.equal(run.proposedJ2Stage.validity.valueCount, 17 * 81 * 40);
	assert.equal(run.proposedJ4Stage.validity.valueCount, 17 * 81 * 40);

	const report = renderReport(run);
	assert.match(report, /Candidate aggregate RMSE \[Algorithm32\]: 14\.635671 mW m\^-2 sr\^-1 nm\^-1\./);
	assert.match(report, /Candidate aggregate RMSE \[Algorithm32-J2\]:/);
	assert.match(report, /Candidate aggregate RMSE \[Algorithm32-J4\]:/);
	assert.doesNotMatch(report, /Algorithm32-hi/i);
});

test(
	'synthetic adjacent-order wiring scores all five candidates without J3 or J5 result artifacts',
	{
		timeout: 30000,
	},
	() =>
		withSyntheticAdjacentOrderProvenance(({j3, j5}) => {
			const run = runExperiment({
				...canonicalOptions,
				proposedJ3Path: canonicalOptions.proposedJ2Path,
				proposedJ3ProvenancePath: j3,
				j3JudgmentRulesPath: canonicalOptions.j2JudgmentRulesPath,
				proposedJ5Path: canonicalOptions.proposedJ4Path,
				proposedJ5ProvenancePath: j5,
				j5JudgmentRulesPath: canonicalOptions.j4JudgmentRulesPath,
			});
			assert.equal(run.status, 'ACCEPTED');
			assert.equal(run.profileComparisonComplete, true);
			assert.deepEqual(
				run.candidateStages.map(({candidateId}) => candidateId),
				['Algorithm32', 'Algorithm32-J2', 'Algorithm32-J3', 'Algorithm32-J4', 'Algorithm32-J5'],
			);
			assert.equal(run.proposedJ3Stage.profile.controls.maximumScatteringOrder, 3);
			assert.equal(run.proposedJ5Stage.profile.controls.maximumScatteringOrder, 5);
			assert.equal(
				run.proposedJ3Stage.score.aggregate.rmseMilliwatt,
				run.proposedJ2Stage.score.aggregate.rmseMilliwatt,
			);
			assert.equal(
				run.proposedJ5Stage.score.aggregate.rmseMilliwatt,
				run.proposedJ4Stage.score.aggregate.rmseMilliwatt,
			);
			const report = renderReport(run);
			assert.match(report, /Candidate aggregate RMSE \[Algorithm32-J3\]:/);
			assert.match(report, /Candidate aggregate RMSE \[Algorithm32-J5\]:/);
			assert.match(report, /All five complete boundaries were scored/);
			const figureSection = report.slice(
				report.indexOf('## Figure 5 relative-error visualization'),
				report.indexOf('## Conclusion'),
			);
			assert.match(figureSection, /three locally generated panels and ten total columns/);
			assert.match(figureSection, /b1-figure5-algorithm32-10h15-z41\.png/);
			assert.doesNotMatch(figureSection, /b1-figure5-algorithm32-j[2-5]-/);
			assert.doesNotMatch(figureSection, /Algorithm32-J5 \|/);
		}),
);
