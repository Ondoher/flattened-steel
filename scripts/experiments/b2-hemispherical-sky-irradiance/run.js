import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {
	CONDITION_NAMES,
	DATASET_REFERENCE_PATH,
	DEFAULT_DATASET_ROOT,
	FIGURE_8_SPECTRAL_RANGE,
	QUADRATURE,
	SOURCE_COMMIT,
	SOURCE_SPECTRAL_PACKET,
	PUBLISHED_MODEL_NAMES,
	reproduceFigure8MeasurementCurve,
	reproduceFigure8ModelCurves,
	reproduceFigure8PublishedModelCurves,
} from './benchmark.js';
import {classifyB2} from '../benchmark-judgment.js';
import {ProductionRun} from '../b1-directional-sky-radiance/ProductionRun.js';

export const EXPERIMENT = 'B2';
export const NAME = 'Hemispherical Sky-Irradiance Benchmark';
export const STAGE_NAME = 'Figure 8 diffuse-sky measurement aggregate';
export const QUESTION =
	'What 360-720 nm diffuse-sky irradiance curve follows from applying ' +
	"Bruneton's published interpolation and integration procedure to the 17 " +
	'Kider directional spectral-radiance fields?';

const MODEL_LABELS = Object.freeze({
	nishita93: 'Nishita93',
	nishita96: 'Nishita96',
	preetham: 'Preetham',
	oneal: "O'Neal",
	haber: 'Haber',
	bruneton: 'Bruneton',
	elek: 'Elek',
	hosek: 'Hosek',
	libradtran: 'libRadtran',
});

export const CANONICAL_INPUTS = Object.freeze({
	publishedModelsPath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/published-models.tsv',
			import.meta.url,
		),
	),
	proposedPath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-proposed.tsv',
			import.meta.url,
		),
	),
	proposedJ2Path: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-j2-proposed.tsv',
			import.meta.url,
		),
	),
	proposedJ3Path: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-j3-proposed.tsv',
			import.meta.url,
		),
	),
	proposedJ4Path: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-j4-proposed.tsv',
			import.meta.url,
		),
	),
	proposedJ5Path: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-j5-proposed.tsv',
			import.meta.url,
		),
	),
	judgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-judgment-rules.json', import.meta.url)),
	j2JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j2-judgment-rules.json', import.meta.url)),
	j3JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j3-judgment-rules.json', import.meta.url)),
	j4JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j4-judgment-rules.json', import.meta.url)),
	j5JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j5-judgment-rules.json', import.meta.url)),
});

export const PAPER_CANONICAL_INPUTS = Object.freeze({
	...CANONICAL_INPUTS,
	proposedPath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-paper-proposed.tsv',
			import.meta.url,
		),
	),
	proposedJ2Path: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-paper-j2-proposed.tsv',
			import.meta.url,
		),
	),
	proposedJ3Path: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-paper-j3-proposed.tsv',
			import.meta.url,
		),
	),
	proposedJ4Path: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-paper-j4-proposed.tsv',
			import.meta.url,
		),
	),
	proposedJ5Path: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/algorithm32-paper-j5-proposed.tsv',
			import.meta.url,
		),
	),
	judgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-judgment-rules.json', import.meta.url)),
	j2JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-j2-judgment-rules.json', import.meta.url)),
	j3JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-j3-judgment-rules.json', import.meta.url)),
	j4JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-j4-judgment-rules.json', import.meta.url)),
	j5JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-j5-judgment-rules.json', import.meta.url)),
});

const CANDIDATE_LABEL_FAMILIES = Object.freeze({
	native: Object.freeze({
		default: 'Algorithm32 Default',
		j2: 'Algorithm32 J2',
		j3: 'Algorithm32 J3',
		j4: 'Algorithm32 J4',
		j5: 'Algorithm32 J5',
	}),
	paper: Object.freeze({
		default: 'Algorithm32 Paper',
		j2: 'Algorithm32 Paper J2',
		j3: 'Algorithm32 Paper J3',
		j4: 'Algorithm32 Paper J4',
		j5: 'Algorithm32 Paper J5',
	}),
	'paper-lebedev38': Object.freeze({
		default: 'Algorithm32 Paper',
		j2: 'Algorithm32 Paper J2',
		j3: 'Algorithm32 Paper J3',
		j4: 'Algorithm32 Paper J4 Experimental Lebedev-38',
		j5: 'Algorithm32 Paper J5',
	}),
	'paper-lebedev38-rotated': Object.freeze({
		default: 'Algorithm32 Paper',
		j2: 'Algorithm32 Paper J2',
		j3: 'Algorithm32 Paper J3',
		j4: 'Algorithm32 Paper J4 Experimental Lebedev-38 Rotated',
		j5: 'Algorithm32 Paper J5',
	}),
	'paper-lebedev38-near-horizon': Object.freeze({
		default: 'Algorithm32 Paper',
		j2: 'Algorithm32 Paper J2',
		j3: 'Algorithm32 Paper J3',
		j4: 'Algorithm32 Paper J4 Experimental Lebedev-38 Near-Horizon',
		j5: 'Algorithm32 Paper J5',
	}),
	...Object.fromEntries(
		[34, 38, 42, 46, 50].map((count) => [
			`paper-paired-fibonacci-${count}`,
			Object.freeze({
				default: 'Algorithm32 Paper',
				j2: 'Algorithm32 Paper J2',
				j3: 'Algorithm32 Paper J3',
				j4: `Algorithm32 Paper J4 Experimental Paired Fibonacci-${count}`,
				j5: 'Algorithm32 Paper J5',
			}),
		]),
	),
});

function resolveCandidateLabels(family = 'native') {
	const labels = CANDIDATE_LABEL_FAMILIES[family];
	if (!labels) throw new RangeError(`Unknown candidate profile family: ${family}`);
	return labels;
}

const PATH_ARGUMENT_KEYS = Object.freeze({
	'--production-run': 'productionRunPath',
	'--output-root': 'outputRoot',
	'--published-models': 'publishedModelsPath',
	'--proposed': 'proposedPath',
	'--proposed-j2': 'proposedJ2Path',
	'--proposed-j3': 'proposedJ3Path',
	'--proposed-j4': 'proposedJ4Path',
	'--proposed-j5': 'proposedJ5Path',
	'--judgment-rules': 'judgmentRulesPath',
	'--j2-judgment-rules': 'j2JudgmentRulesPath',
	'--j3-judgment-rules': 'j3JudgmentRulesPath',
	'--j4-judgment-rules': 'j4JudgmentRulesPath',
	'--j5-judgment-rules': 'j5JudgmentRulesPath',
});

export function parseArguments(argv) {
	const options = {};
	for (let index = 0; index < argv.length; index += 1) {
		if (argv[index] === '--canonical') {
			options.canonical = true;
			continue;
		}
		if (argv[index] === '--profile-family') {
			if (!argv[index + 1]) throw new Error('--profile-family requires a known candidate family.');
			options.profileFamily = argv[++index];
			resolveCandidateLabels(options.profileFamily);
			continue;
		}
		if (Object.hasOwn(PATH_ARGUMENT_KEYS, argv[index])) {
			if (!argv[index + 1]) throw new Error(`${argv[index]} requires a path.`);
			const key = PATH_ARGUMENT_KEYS[argv[index]];
			options[key] = resolve(argv[++index]);
		} else {
			throw new Error(`Unknown argument: ${argv[index]}`);
		}
	}
	return options;
}

function loadJudgmentRules(path) {
	if (!existsSync(path)) throw new Error(`Judgment rules do not exist: ${path}`);
	const bytes = readFileSync(path);
	const value = JSON.parse(bytes.toString('utf8'));
	if (value?.declaredBeforeProposedResults !== true || !Array.isArray(value.rules) || value.rules.length === 0) {
		throw new Error('Judgment rules must declare pre-result creation and contain at least one rule.');
	}
	return Object.freeze({
		path,
		sha256: createHash('sha256').update(bytes).digest('hex'),
		bytes: bytes.byteLength,
		schema: value.schema,
		publishedComparatorScale: value.publishedComparatorScale,
		rules: Object.freeze([...value.rules]),
	});
}

function scoreProposedCurve(measurement, proposed) {
	const conditions = measurement.conditions.map((measured, index) => {
		const candidate = proposed.conditions[index];
		if (candidate.localTime !== measured.localTime) {
			throw new Error(`Proposed time ${candidate.localTime} does not match ${measured.localTime}.`);
		}
		const value = candidate.diffuseSkyIrradiance.proposed;
		const residual = value - measured.skyIrradiance;
		return Object.freeze({
			localTime: measured.localTime,
			measured: measured.skyIrradiance,
			proposed: value,
			residual,
			relativeResidual: residual / measured.skyIrradiance,
		});
	});
	const squareSum = conditions.reduce((sum, item) => sum + item.residual ** 2, 0);
	const bias = conditions.reduce((sum, item) => sum + item.residual, 0) / conditions.length;
	const worst = conditions.reduce((a, b) => (Math.abs(a.residual) >= Math.abs(b.residual) ? a : b));
	return Object.freeze({
		conditions: Object.freeze(conditions),
		rmseWattsPerSquareMeter: Math.sqrt(squareSum / conditions.length),
		biasWattsPerSquareMeter: bias,
		worstCondition: worst,
	});
}

function proposedOutputIsValid(score) {
	return Boolean(
		score &&
		score.conditions.length === CONDITION_NAMES.length &&
		score.conditions.every((condition) => Number.isFinite(condition.proposed) && condition.proposed >= 0),
	);
}

function assessProposedScore(score, outputValid, judgmentRules) {
	return score && judgmentRules?.publishedComparatorScale
		? classifyB2(
				{
					rmseWattsPerSquareMeter: score.rmseWattsPerSquareMeter,
					biasWattsPerSquareMeter: score.biasWattsPerSquareMeter,
					worstAbsoluteResidualWattsPerSquareMeter: Math.abs(score.worstCondition.residual),
					outputValid,
				},
				judgmentRules,
			)
		: null;
}

export function runExperiment(options = {}) {
	if (typeof options === 'string') options = {datasetRoot: options};
	let productionBoundary = null;
	if (options.productionRunPath) {
		if (options.profileFamily && options.profileFamily !== 'paper') {
			throw new Error('--production-run uses the benchmark-owned paper profile family.');
		}
		const run = ProductionRun.load(options.productionRunPath);
		productionBoundary = ProductionRun.boundaryRecord(run);
		options = {
			publishedModelsPath: PAPER_CANONICAL_INPUTS.publishedModelsPath,
			judgmentRulesPath: PAPER_CANONICAL_INPUTS.judgmentRulesPath,
			...ProductionRun.candidatePaths(run),
			...options,
			canonical: false,
			profileFamily: 'paper',
		};
	}
	const profileFamily = options.profileFamily ?? 'native';
	const candidateLabels = resolveCandidateLabels(profileFamily);
	const normalized = options.canonical
		? {
				...(profileFamily.startsWith('paper') ? PAPER_CANONICAL_INPUTS : CANONICAL_INPUTS),
				...options,
			}
		: options;
	if (normalized.proposedPath && !normalized.judgmentRulesPath) {
		throw new Error('--proposed requires --judgment-rules declared before proposed results.');
	}
	if (normalized.proposedJ2Path && !normalized.j2JudgmentRulesPath) {
		throw new Error(`--proposed-j2 requires --j2-judgment-rules declared before ${candidateLabels.j2} results.`);
	}
	if (normalized.proposedJ3Path && !normalized.j3JudgmentRulesPath) {
		throw new Error(`--proposed-j3 requires --j3-judgment-rules declared before ${candidateLabels.j3} results.`);
	}
	if (normalized.proposedJ4Path && !normalized.j4JudgmentRulesPath) {
		throw new Error(`--proposed-j4 requires --j4-judgment-rules declared before ${candidateLabels.j4} results.`);
	}
	if (normalized.proposedJ5Path && !normalized.j5JudgmentRulesPath) {
		throw new Error(`--proposed-j5 requires --j5-judgment-rules declared before ${candidateLabels.j5} results.`);
	}
	if (
		normalized.canonical &&
		(!normalized.proposedPath ||
			!normalized.proposedJ2Path ||
			!normalized.proposedJ3Path ||
			!normalized.proposedJ4Path ||
			!normalized.proposedJ5Path)
	) {
		throw new Error(`Canonical B2 requires ${candidateLabels.default} and J2 through J5 candidate paths.`);
	}
	const reproduction = reproduceFigure8MeasurementCurve(normalized.datasetRoot ?? DEFAULT_DATASET_ROOT);
	const publishedModels = normalized.publishedModelsPath
		? reproduceFigure8PublishedModelCurves(normalized.publishedModelsPath)
		: null;
	const proposedCurve = normalized.proposedPath
		? reproduceFigure8ModelCurves(normalized.proposedPath, ['proposed'])
		: null;
	const proposedJ2Curve = normalized.proposedJ2Path
		? reproduceFigure8ModelCurves(normalized.proposedJ2Path, ['proposed'])
		: null;
	const proposedJ3Curve = normalized.proposedJ3Path
		? reproduceFigure8ModelCurves(normalized.proposedJ3Path, ['proposed'])
		: null;
	const proposedJ4Curve = normalized.proposedJ4Path
		? reproduceFigure8ModelCurves(normalized.proposedJ4Path, ['proposed'])
		: null;
	const proposedJ5Curve = normalized.proposedJ5Path
		? reproduceFigure8ModelCurves(normalized.proposedJ5Path, ['proposed'])
		: null;
	const judgmentRules = normalized.judgmentRulesPath ? loadJudgmentRules(normalized.judgmentRulesPath) : null;
	const j2JudgmentRules = normalized.j2JudgmentRulesPath ? loadJudgmentRules(normalized.j2JudgmentRulesPath) : null;
	const j3JudgmentRules = normalized.j3JudgmentRulesPath ? loadJudgmentRules(normalized.j3JudgmentRulesPath) : null;
	const j4JudgmentRules = normalized.j4JudgmentRulesPath ? loadJudgmentRules(normalized.j4JudgmentRulesPath) : null;
	const j5JudgmentRules = normalized.j5JudgmentRulesPath ? loadJudgmentRules(normalized.j5JudgmentRulesPath) : null;
	const proposedScore = proposedCurve ? scoreProposedCurve(reproduction, proposedCurve) : null;
	const proposedJ2Score = proposedJ2Curve ? scoreProposedCurve(reproduction, proposedJ2Curve) : null;
	const proposedJ3Score = proposedJ3Curve ? scoreProposedCurve(reproduction, proposedJ3Curve) : null;
	const proposedJ4Score = proposedJ4Curve ? scoreProposedCurve(reproduction, proposedJ4Curve) : null;
	const proposedJ5Score = proposedJ5Curve ? scoreProposedCurve(reproduction, proposedJ5Curve) : null;
	const proposedOutputValid = proposedOutputIsValid(proposedScore);
	const proposedJ2OutputValid = proposedOutputIsValid(proposedJ2Score);
	const proposedJ3OutputValid = proposedOutputIsValid(proposedJ3Score);
	const proposedJ4OutputValid = proposedOutputIsValid(proposedJ4Score);
	const proposedJ5OutputValid = proposedOutputIsValid(proposedJ5Score);
	const proposedAssessment = assessProposedScore(proposedScore, proposedOutputValid, judgmentRules);
	const proposedJ2Assessment = assessProposedScore(proposedJ2Score, proposedJ2OutputValid, j2JudgmentRules);
	const proposedJ3Assessment = assessProposedScore(proposedJ3Score, proposedJ3OutputValid, j3JudgmentRules);
	const proposedJ4Assessment = assessProposedScore(proposedJ4Score, proposedJ4OutputValid, j4JudgmentRules);
	const proposedJ5Assessment = assessProposedScore(proposedJ5Score, proposedJ5OutputValid, j5JudgmentRules);
	const conditionsComplete =
		reproduction.conditions.length === CONDITION_NAMES.length &&
		reproduction.conditions.every(
			(condition) =>
				condition.fileCount === 81 &&
				condition.sampleCount === QUADRATURE.totalDirections &&
				Number.isFinite(condition.skyIrradiance) &&
				condition.skyIrradiance > 0 &&
				condition.directSunIrradiance === 0 &&
				condition.plottedTotalIrradiance === condition.skyIrradiance,
		);

	const comparativeProfilesComplete = Boolean(
		proposedScore && proposedJ2Score && proposedJ3Score && proposedJ4Score && proposedJ5Score,
	);

	return Object.freeze({
		reproduction,
		productionBoundary,
		profileFamily,
		candidateLabels,
		publishedReferenceStage: Object.freeze({
			status: 'adopted',
			authority: 'Bruneton Figure 8 and pinned comparison source',
			localReproductionRequired: false,
		}),
		publishedModels,
		proposedCurve,
		proposedJ2Curve,
		proposedJ3Curve,
		proposedJ4Curve,
		proposedJ5Curve,
		proposedScore,
		proposedJ2Score,
		proposedJ3Score,
		proposedJ4Score,
		proposedJ5Score,
		proposedOutputValid,
		proposedJ2OutputValid,
		proposedJ3OutputValid,
		proposedJ4OutputValid,
		proposedJ5OutputValid,
		proposedAssessment,
		proposedJ2Assessment,
		proposedJ3Assessment,
		proposedJ4Assessment,
		proposedJ5Assessment,
		judgmentRules,
		j2JudgmentRules,
		j3JudgmentRules,
		j4JudgmentRules,
		j5JudgmentRules,
		measurementStageCompleted: conditionsComplete,
		publishedModelColumnsStatus: publishedModels ? 'generated from pinned source boundary' : 'pending',
		proposedMethodColumnStatus: proposedScore ? 'scored' : 'pending',
		proposedJ2ColumnStatus: proposedJ2Score ? 'scored' : 'pending',
		proposedJ3ColumnStatus: proposedJ3Score ? 'scored' : 'pending',
		proposedJ4ColumnStatus: proposedJ4Score ? 'scored' : 'pending',
		proposedJ5ColumnStatus: proposedJ5Score ? 'scored' : 'pending',
		comparativeProfilesComplete,
		fullBenchmarkAccepted:
			conditionsComplete && Boolean(proposedScore) && (!normalized.canonical || comparativeProfilesComplete),
	});
}

function fixed(value, digits = 6) {
	return Number(value).toFixed(digits);
}

function renderCandidateSummary(label, score, assessment) {
	if (!score) return `${label} was not supplied.`;
	return (
		`${label}: RMSE ${fixed(score.rmseWattsPerSquareMeter)} W m^-2, ` +
		`bias ${fixed(score.biasWattsPerSquareMeter)} W m^-2, worst absolute ` +
		`residual ${fixed(Math.abs(score.worstCondition.residual))} W m^-2 at ` +
		`${score.worstCondition.localTime}.` +
		(assessment
			? ` Its classification is **${assessment.classification}** under the rules fixed before its results.`
			: ' Its supplied rules did not contain structured comparator thresholds, so no favorable/limited/adverse classification was applied.')
	);
}

export function renderReport(run) {
	const {reproduction} = run;
	const inputSummary = {
		productionBoundary: run.productionBoundary,
		scientificBoundary:
			"Aggregate of B1's 17x81 measured directional spectral-radiance field; " +
			'not pyranometer evidence and not an independent measurement observable.',
		authorities: {
			paper: 'Eric Bruneton, A Qualitative and Quantitative Evaluation of 8 Clear Sky Models, arXiv:1612.04336v1, Figure 8',
			measurement:
				'Kider et al., A Framework for the Experimental Comparison of Solar and Skydome Illumination (2014)',
			comparisonSource: `https://github.com/ebruneton/clear-sky-models/tree/${SOURCE_COMMIT}`,
		},
		dataset: {
			path: DATASET_REFERENCE_PATH,
			conditions: reproduction.conditions.length,
			directionalFilesPerCondition: 81,
			directionalFilesTotal: reproduction.fileCount,
			bytes: reproduction.byteLength,
			sha256: reproduction.datasetSha256,
			identityAlgorithm: reproduction.datasetIdentityAlgorithm,
			rawWavelengthRangeNanometers: [350, 2500],
			rawSpacingNanometers: 1,
			units: 'W m^-2 sr^-1 nm^-1',
		},
		preprocessing: {
			sourceSpectralPacket: SOURCE_SPECTRAL_PACKET,
			rawToPacketInterpolation: 'linear',
			directionMap:
				'Kider sample order -> source 9x9 Shirley-Chiu square/disk field; flip square y for counterclockwise-to-clockwise azimuth conversion',
			knownBadSample: 'sample 0 / grid[8][4] replaced by mean(grid[8][3], grid[8][5])',
			angularInterpolation:
				'Bruneton HemisphericalFunction bicubic rings, zenith derivative extrapolation, and horizon second-derivative extrapolation',
			angularQuadrature: QUADRATURE,
			spectralIntegration: {
				rangeNanometers: FIGURE_8_SPECTRAL_RANGE,
				rule: 'pinned dimensional_types subset integral: fixed packet value over each clipped [sample(i), sample(i+1)) bin',
				linearReordering:
					'the scalar runner integrates each of the 81 spectral packets before bicubic angular integration; the independent test proves this commutes with the source order because resampling, bicubic interpolation, angular quadrature, and spectral integration are linear',
			},
			directSunTreatment:
				'excluded: MeasuredAtmosphere::GetSunIrradiance returns the zero spectrum; plotted measurement total equals diffuse sky',
		},
		pendingInputs: {
			paperModelCurves: run.publishedModels
				? 'generated; independent numeric extraction of Figure 8 remains pending'
				: 'pending faithful regeneration or source-authored numeric tables',
			proposedMethodDirectionalSpectra: run.proposedCurve
				? `${run.candidateLabels.default} supplied and scored with predeclared judgment rules`
				: `${run.candidateLabels.default} pending independently supplied boundary data`,
			...(run.productionBoundary
				? {}
				: {
						proposedJ2DirectionalSpectra: run.proposedJ2Curve
							? `${run.candidateLabels.j2} supplied and independently scored with its pre-result judgment record`
							: `${run.candidateLabels.j2} candidate not supplied`,
						proposedJ3DirectionalSpectra: run.proposedJ3Curve
							? `${run.candidateLabels.j3} supplied and independently scored with its pre-result judgment record`
							: `${run.candidateLabels.j3} candidate not supplied`,
						proposedJ4DirectionalSpectra: run.proposedJ4Curve
							? `${run.candidateLabels.j4} supplied and independently scored with its pre-result judgment record`
							: `${run.candidateLabels.j4} candidate not supplied`,
						proposedJ5DirectionalSpectra: run.proposedJ5Curve
							? `${run.candidateLabels.j5} supplied and independently scored with its pre-result judgment record`
							: `${run.candidateLabels.j5} candidate not supplied`,
					}),
		},
		proposedInput: run.proposedCurve
			? {
					path: run.proposedCurve.path,
					bytes: run.proposedCurve.byteLength,
					sha256: run.proposedCurve.sha256,
				}
			: null,
		proposedJ2Input: run.proposedJ2Curve
			? {
					path: run.proposedJ2Curve.path,
					bytes: run.proposedJ2Curve.byteLength,
					sha256: run.proposedJ2Curve.sha256,
				}
			: null,
		proposedJ3Input: run.proposedJ3Curve
			? {
					path: run.proposedJ3Curve.path,
					bytes: run.proposedJ3Curve.byteLength,
					sha256: run.proposedJ3Curve.sha256,
				}
			: null,
		proposedJ4Input: run.proposedJ4Curve
			? {
					path: run.proposedJ4Curve.path,
					bytes: run.proposedJ4Curve.byteLength,
					sha256: run.proposedJ4Curve.sha256,
				}
			: null,
		proposedJ5Input: run.proposedJ5Curve
			? {
					path: run.proposedJ5Curve.path,
					bytes: run.proposedJ5Curve.byteLength,
					sha256: run.proposedJ5Curve.sha256,
				}
			: null,
		judgmentRules: run.judgmentRules
			? {
					path: run.judgmentRules.path,
					bytes: run.judgmentRules.bytes,
					sha256: run.judgmentRules.sha256,
					schema: run.judgmentRules.schema,
				}
			: null,
		j2JudgmentRules: run.j2JudgmentRules
			? {
					path: run.j2JudgmentRules.path,
					bytes: run.j2JudgmentRules.bytes,
					sha256: run.j2JudgmentRules.sha256,
					schema: run.j2JudgmentRules.schema,
				}
			: null,
		j3JudgmentRules: run.j3JudgmentRules
			? {
					path: run.j3JudgmentRules.path,
					bytes: run.j3JudgmentRules.bytes,
					sha256: run.j3JudgmentRules.sha256,
					schema: run.j3JudgmentRules.schema,
				}
			: null,
		j4JudgmentRules: run.j4JudgmentRules
			? {
					path: run.j4JudgmentRules.path,
					bytes: run.j4JudgmentRules.bytes,
					sha256: run.j4JudgmentRules.sha256,
					schema: run.j4JudgmentRules.schema,
				}
			: null,
		j5JudgmentRules: run.j5JudgmentRules
			? {
					path: run.j5JudgmentRules.path,
					bytes: run.j5JudgmentRules.bytes,
					sha256: run.j5JudgmentRules.sha256,
					schema: run.j5JudgmentRules.schema,
				}
			: null,
	};
	const statusDetail = !run.fullBenchmarkAccepted
		? ', full B2 not accepted'
		: run.comparativeProfilesComplete
			? ` and ${run.candidateLabels.default} plus J2 through J5 boundaries scored`
			: ` and the ${run.candidateLabels.default} boundary scored`;

	const lines = [
		`# ${EXPERIMENT} - ${NAME}`,
		'',
		`Status: ${run.fullBenchmarkAccepted ? 'accepted' : 'in progress'}; ${STAGE_NAME} completed${statusDetail}.`,
		'',
		'## Question',
		'',
		QUESTION,
		'',
		'## Inputs',
		'',
		'```json',
		JSON.stringify(inputSummary, null, 2),
		'```',
		'',
		'## Iterations',
		'',
		`Iterations: ${reproduction.conditions.length}`,
		'',
		'| iteration | local time | measured diffuse sky (W m^-2) | ' +
			PUBLISHED_MODEL_NAMES.map((model) => `${MODEL_LABELS[model]} (W m^-2)`).join(' | ') +
			(run.productionBoundary
				? ` | ${run.candidateLabels.default} current-production J4 (W m^-2) | residual (W m^-2) | stage result |`
				: ` | ${run.candidateLabels.default} (W m^-2) | Default residual (W m^-2) | ` +
					`${run.candidateLabels.j2} (W m^-2) | J2 residual (W m^-2) | ` +
					`${run.candidateLabels.j3} (W m^-2) | J3 residual (W m^-2) | ` +
					`${run.candidateLabels.j4} (W m^-2) | J4 residual (W m^-2) | ` +
					`${run.candidateLabels.j5} (W m^-2) | J5 residual (W m^-2) | stage result |`),
		'| ---: | --- | ---: | ' +
			PUBLISHED_MODEL_NAMES.map(() => '---:').join(' | ') +
			(run.productionBoundary
				? ' | ---: | ---: | --- |'
				: ' | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |'),
	];

	reproduction.conditions.forEach((condition, index) => {
		const modelCondition = run.publishedModels?.conditions[index];
		const proposedCondition = run.proposedScore?.conditions[index];
		const proposedJ2Condition = run.proposedJ2Score?.conditions[index];
		const proposedJ3Condition = run.proposedJ3Score?.conditions[index];
		const proposedJ4Condition = run.proposedJ4Score?.conditions[index];
		const proposedJ5Condition = run.proposedJ5Score?.conditions[index];
		if (modelCondition && modelCondition.localTime !== condition.localTime) {
			throw new Error(
				`Published-model time ${modelCondition.localTime} does not match measurement time ${condition.localTime}.`,
			);
		}
		lines.push(
			`| ${index + 1} | ${condition.localTime} | ${fixed(condition.skyIrradiance)} | ` +
				PUBLISHED_MODEL_NAMES.map((model) =>
					modelCondition ? fixed(modelCondition.diffuseSkyIrradiance[model]) : 'pending',
				).join(' | ') +
				` | ${proposedCondition ? fixed(proposedCondition.proposed) : 'pending'} | ` +
				`${proposedCondition ? fixed(proposedCondition.residual) : 'pending'} | ` +
				(run.productionBoundary
					? ''
					: `${proposedJ2Condition ? fixed(proposedJ2Condition.proposed) : 'pending'} | ` +
						`${proposedJ2Condition ? fixed(proposedJ2Condition.residual) : 'pending'} | ` +
						`${proposedJ3Condition ? fixed(proposedJ3Condition.proposed) : 'pending'} | ` +
						`${proposedJ3Condition ? fixed(proposedJ3Condition.residual) : 'pending'} | ` +
						`${proposedJ4Condition ? fixed(proposedJ4Condition.proposed) : 'pending'} | ` +
						`${proposedJ4Condition ? fixed(proposedJ4Condition.residual) : 'pending'} | ` +
						`${proposedJ5Condition ? fixed(proposedJ5Condition.proposed) : 'pending'} | ` +
						`${proposedJ5Condition ? fixed(proposedJ5Condition.residual) : 'pending'} | `) +
				`${
					condition.fileCount === 81 && condition.sampleCount === QUADRATURE.totalDirections
						? modelCondition
							? proposedCondition
								? run.productionBoundary
									? 'measurement, source models, and current-production J4 aggregate scored'
									: run.comparativeProfilesComplete
										? 'measurement, source models, Default, and J2 through J5 aggregates scored'
										: 'measurement, source models, and Default aggregate scored'
								: 'measurement and source-model aggregates generated'
							: 'measurement aggregate reproduced'
						: 'incomplete'
				} |`,
		);
	});

	for (const {label, assessment} of [
		{label: run.candidateLabels.default, assessment: run.proposedAssessment},
		{label: run.candidateLabels.j2, assessment: run.proposedJ2Assessment},
		{label: run.candidateLabels.j3, assessment: run.proposedJ3Assessment},
		{label: run.candidateLabels.j4, assessment: run.proposedJ4Assessment},
		{label: run.candidateLabels.j5, assessment: run.proposedJ5Assessment},
	]) {
		if (!assessment) continue;
		lines.push(
			'',
			`## Predeclared B2 classification - ${label}`,
			'',
			`Classification: **${assessment.classification.toUpperCase()}**.`,
			'',
			'| criterion | observed | favorable maximum | limited maximum | result |',
			'| --- | ---: | ---: | ---: | --- |',
		);
		for (const check of assessment.checks) {
			lines.push(
				`| ${check.label} | ${fixed(check.observed)} | ${fixed(check.favorableThreshold)} | ` +
					`${fixed(check.limitedThreshold)} | ${check.classification} |`,
			);
		}
	}

	lines.push(
		'',
		'## Conclusion',
		'',
		run.measurementStageCompleted
			? `${run.fullBenchmarkAccepted ? 'Accepted' : 'In progress'}. The 17-point diffuse-sky measurement curve was regenerated from B1's measured directional-radiance field with the pinned Figure 8 source procedure. This is an integral transform of the same Kider radiance measurements, not independent pyranometer evidence. The source measurement contributes no direct-Sun term. ` +
					(run.publishedModels
						? 'The nine source-model curves were also integrated from the complete pinned-source B1 spectral boundary. This generates the local Figure 8 model columns but does not by itself prove agreement with a separately digitized published plot. '
						: 'The paper-model numeric columns remain pending. ') +
					(run.productionBoundary
						? `${renderCandidateSummary(run.candidateLabels.default, run.proposedScore, run.proposedAssessment)} The authenticated production run selects cumulative J4; the retained five-profile comparison is a separate workflow.`
						: [
								renderCandidateSummary(
									run.candidateLabels.default,
									run.proposedScore,
									run.proposedAssessment,
								),
								renderCandidateSummary(
									run.candidateLabels.j2,
									run.proposedJ2Score,
									run.proposedJ2Assessment,
								),
								renderCandidateSummary(
									run.candidateLabels.j3,
									run.proposedJ3Score,
									run.proposedJ3Assessment,
								),
								renderCandidateSummary(
									run.candidateLabels.j4,
									run.proposedJ4Score,
									run.proposedJ4Assessment,
								),
								renderCandidateSummary(
									run.candidateLabels.j5,
									run.proposedJ5Score,
									run.proposedJ5Assessment,
								),
							].join(' '))
			: 'Incomplete. The Figure 8 measurement aggregate could not be regenerated for every declared condition.',
		'',
		'## Acceptance boundary',
		'',
		`- Measurement aggregate stage completed: ${run.measurementStageCompleted ? 'yes' : 'no'}.`,
		`- Published external Figure 8 reference adopted: ${run.publishedReferenceStage.status}.`,
		`- Published paper-model columns completed: ${run.publishedModelColumnsStatus}.`,
		`- ${run.candidateLabels.default} column completed: ${run.proposedMethodColumnStatus}.`,
		...(run.productionBoundary
			? [
					`- Authenticated current-production order: J${run.productionBoundary.order}.`,
					'- Retained five-profile comparison: separate non-production workflow.',
				]
			: [
					`- ${run.candidateLabels.j2} column completed: ${run.proposedJ2ColumnStatus}.`,
					`- ${run.candidateLabels.j3} column completed: ${run.proposedJ3ColumnStatus}.`,
					`- ${run.candidateLabels.j4} column completed: ${run.proposedJ4ColumnStatus}.`,
					`- ${run.candidateLabels.j5} column completed: ${run.proposedJ5ColumnStatus}.`,
					`- All five candidate profiles scored: ${run.comparativeProfilesComplete ? 'yes' : 'no'}.`,
				]),
		`- Full B2 accepted: ${run.fullBenchmarkAccepted ? 'yes' : 'no'}.`,
	);
	return `${lines.join('\n')}\n`;
}

const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) {
	try {
		const run = runExperiment(parseArguments(process.argv.slice(2)));
		process.stdout.write(renderReport(run));
		if (!run.measurementStageCompleted) process.exitCode = 1;
	} catch (error) {
		console.error(error instanceof Error ? error.stack : error);
		process.exitCode = 1;
	}
}
