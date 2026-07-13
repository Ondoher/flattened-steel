import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {
	COARSE_GRID,
	DIRECTION_CONTRACT,
	EXPERIMENT,
	FIXED_CONDITIONS,
	LIBRADTRAN_VERSION,
	MATCHED_ATMOSPHERE,
	NAME,
	PUBLISHED,
	QUESTION,
	SCORED_WAVELENGTHS_NM,
	SOURCE_REVISION,
	enumerateCoarseGrid,
	verifyContract,
} from './contract.js';
import {
	cubeFromExternalOutputs,
	evaluatePublishedFixedTarget,
	readCoarseResults,
	readCube,
	readMeasurementBoundary,
	readJudgmentRules,
	readMismatchMap,
	scoreCubes,
} from './cube.js';
import {classifyB1, classifyB3} from '../benchmark-judgment.js';
import {ProductionRun} from '../b1-directional-sky-radiance/ProductionRun.js';
import {DEFAULT_EXPERIMENT_RESULTS_ROOT, resolveProductionResultRoot} from '../production-result-paths.js';
import {executeFixedCases, fingerprintUvspecExecutable} from './libradtran-input.js';

const DEFAULT_WORK_DIRECTORY = fileURLToPath(new URL('./.work/published-fixed/', import.meta.url));
const DEFAULT_RESULT_PATH = fileURLToPath(
	new URL('../../../references/results/experiments/b3-matched-atmosphere-solver/result.md', import.meta.url),
);
const DEFAULT_REFERENCE_RESULT_NAME = 'libRadtran-reference-cube.json';

export const CANONICAL_INPUTS = Object.freeze({
	measurementCubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b1-directional-sky-radiance/measurement-boundary.tsv',
			import.meta.url,
		),
	),
	proposedCubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-proposed-cube.json',
			import.meta.url,
		),
	),
	proposedJ2CubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-j2-proposed-cube.json',
			import.meta.url,
		),
	),
	proposedJ3CubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-j3-proposed-cube.json',
			import.meta.url,
		),
	),
	proposedJ4CubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-j4-proposed-cube.json',
			import.meta.url,
		),
	),
	proposedJ5CubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-j5-proposed-cube.json',
			import.meta.url,
		),
	),
	mismatchMapPath: fileURLToPath(new URL('./algorithm32-mismatch-map.json', import.meta.url)),
	j2MismatchMapPath: fileURLToPath(new URL('./algorithm32-j2-mismatch-map.json', import.meta.url)),
	j3MismatchMapPath: fileURLToPath(new URL('./algorithm32-j3-mismatch-map.json', import.meta.url)),
	j4MismatchMapPath: fileURLToPath(new URL('./algorithm32-j4-mismatch-map.json', import.meta.url)),
	j5MismatchMapPath: fileURLToPath(new URL('./algorithm32-j5-mismatch-map.json', import.meta.url)),
	judgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-judgment-rules.json', import.meta.url)),
	j2JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j2-judgment-rules.json', import.meta.url)),
	j3JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j3-judgment-rules.json', import.meta.url)),
	j4JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j4-judgment-rules.json', import.meta.url)),
	j5JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-j5-judgment-rules.json', import.meta.url)),
	b1ResultPath: fileURLToPath(
		new URL('../../../references/results/experiments/b1-directional-sky-radiance/result.md', import.meta.url),
	),
});

export const PAPER_CANONICAL_INPUTS = Object.freeze({
	...CANONICAL_INPUTS,
	proposedCubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-paper-proposed-cube.json',
			import.meta.url,
		),
	),
	proposedJ2CubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-paper-j2-proposed-cube.json',
			import.meta.url,
		),
	),
	proposedJ3CubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-paper-j3-proposed-cube.json',
			import.meta.url,
		),
	),
	proposedJ4CubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-paper-j4-proposed-cube.json',
			import.meta.url,
		),
	),
	proposedJ5CubePath: fileURLToPath(
		new URL(
			'../../../references/results/experiments/b3-matched-atmosphere-solver/algorithm32-paper-j5-proposed-cube.json',
			import.meta.url,
		),
	),
	mismatchMapPath: fileURLToPath(new URL('./algorithm32-paper-mismatch-map.json', import.meta.url)),
	j2MismatchMapPath: fileURLToPath(new URL('./algorithm32-paper-j2-mismatch-map.json', import.meta.url)),
	j3MismatchMapPath: fileURLToPath(new URL('./algorithm32-paper-j3-mismatch-map.json', import.meta.url)),
	j4MismatchMapPath: fileURLToPath(new URL('./algorithm32-paper-j4-mismatch-map.json', import.meta.url)),
	j5MismatchMapPath: fileURLToPath(new URL('./algorithm32-paper-j5-mismatch-map.json', import.meta.url)),
	judgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-judgment-rules.json', import.meta.url)),
	j2JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-j2-judgment-rules.json', import.meta.url)),
	j3JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-j3-judgment-rules.json', import.meta.url)),
	j4JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-j4-judgment-rules.json', import.meta.url)),
	j5JudgmentRulesPath: fileURLToPath(new URL('../whole-algorithm-paper-j5-judgment-rules.json', import.meta.url)),
});

const CANDIDATE_LABEL_FAMILIES = Object.freeze({
	native: Object.freeze({
		default: 'Algorithm32',
		j2: 'Algorithm32-J2',
		j3: 'Algorithm32-J3',
		j4: 'Algorithm32-J4',
		j5: 'Algorithm32-J5',
	}),
	paper: Object.freeze({
		default: 'Algorithm32-Paper',
		j2: 'Algorithm32-Paper-J2',
		j3: 'Algorithm32-Paper-J3',
		j4: 'Algorithm32-Paper-J4',
		j5: 'Algorithm32-Paper-J5',
	}),
	'paper-lebedev38': Object.freeze({
		default: 'Algorithm32-Paper',
		j2: 'Algorithm32-Paper-J2',
		j3: 'Algorithm32-Paper-J3',
		j4: 'Algorithm32-Paper-J4-Lebedev38',
		j5: 'Algorithm32-Paper-J5',
	}),
	'paper-lebedev38-rotated': Object.freeze({
		default: 'Algorithm32-Paper',
		j2: 'Algorithm32-Paper-J2',
		j3: 'Algorithm32-Paper-J3',
		j4: 'Algorithm32-Paper-J4-Lebedev38-Rotated',
		j5: 'Algorithm32-Paper-J5',
	}),
	'paper-lebedev38-near-horizon': Object.freeze({
		default: 'Algorithm32-Paper',
		j2: 'Algorithm32-Paper-J2',
		j3: 'Algorithm32-Paper-J3',
		j4: 'Algorithm32-Paper-J4-Lebedev38-Near-Horizon',
		j5: 'Algorithm32-Paper-J5',
	}),
	...Object.fromEntries(
		[34, 38, 42, 46, 50].map((count) => [
			`paper-paired-fibonacci-${count}`,
			Object.freeze({
				default: 'Algorithm32-Paper',
				j2: 'Algorithm32-Paper-J2',
				j3: 'Algorithm32-Paper-J3',
				j4: `Algorithm32-Paper-J4-Paired-Fibonacci-${count}`,
				j5: 'Algorithm32-Paper-J5',
			}),
		]),
	),
});

const CANDIDATE_DISPLAY_LABEL_FAMILIES = Object.freeze({
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

function resolveCandidateFamily(family = 'native') {
	const labels = CANDIDATE_LABEL_FAMILIES[family];
	const displayLabels = CANDIDATE_DISPLAY_LABEL_FAMILIES[family];
	if (!labels || !displayLabels) {
		throw new RangeError(`Unknown candidate profile family: ${family}`);
	}
	return Object.freeze({id: family, labels, displayLabels});
}

export function parseArguments(argv) {
	const options = {
		save: false,
		requireComplete: false,
		workDirectory: DEFAULT_WORK_DIRECTORY,
	};
	const valued = new Map([
		['--uvspec', 'uvspecPath'],
		['--wsl-user', 'wslUser'],
		['--external-output', 'externalOutputDirectory'],
		['--reference-cube', 'referenceCubePath'],
		['--measurements', 'measurementCubePath'],
		['--coarse-results', 'coarseResultsPath'],
		['--proposed-cube', 'proposedCubePath'],
		['--proposed-j2-cube', 'proposedJ2CubePath'],
		['--proposed-j3-cube', 'proposedJ3CubePath'],
		['--proposed-j4-cube', 'proposedJ4CubePath'],
		['--proposed-j5-cube', 'proposedJ5CubePath'],
		['--mismatch-map', 'mismatchMapPath'],
		['--j2-mismatch-map', 'j2MismatchMapPath'],
		['--j3-mismatch-map', 'j3MismatchMapPath'],
		['--j4-mismatch-map', 'j4MismatchMapPath'],
		['--j5-mismatch-map', 'j5MismatchMapPath'],
		['--judgment-rules', 'judgmentRulesPath'],
		['--j2-judgment-rules', 'j2JudgmentRulesPath'],
		['--j3-judgment-rules', 'j3JudgmentRulesPath'],
		['--j4-judgment-rules', 'j4JudgmentRulesPath'],
		['--j5-judgment-rules', 'j5JudgmentRulesPath'],
		['--b1-result', 'b1ResultPath'],
		['--workdir', 'workDirectory'],
		['--result', 'resultPath'],
		['--reference-result', 'referenceResultPath'],
		['--output-root', 'outputRoot'],
		['--production-run', 'productionRunPath'],
	]);
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--save') options.save = true;
		else if (argument === '--canonical') options.canonical = true;
		else if (argument === '--profile-family') {
			const value = argv[index + 1];
			if (!value || value.startsWith('--')) {
				throw new TypeError('--profile-family requires native or paper.');
			}
			options.profileFamily = value;
			resolveCandidateFamily(value);
			index += 1;
		} else if (argument === '--require-complete') options.requireComplete = true;
		else if (argument === '--help') options.help = true;
		else if (valued.has(argument)) {
			const value = argv[index + 1];
			if (!value || value.startsWith('--')) throw new TypeError(`${argument} requires a value.`);
			options[valued.get(argument)] = value;
			index += 1;
		} else {
			throw new TypeError(`Unknown argument: ${argument}`);
		}
	}
	return options;
}

export const HELP = `Usage: node run.js [options]

Scientific inputs:
  --canonical               Bind the durable Default and J2-J5 boundaries.
  --production-run PATH     Bind all candidate cubes from one current-production run.
  --uvspec PATH             Run the 17 fixed alpha=.8 beta=.04 g=.7 cases.
  --wsl-user USER           WSL user for a Linux uvspec path.
  --external-output DIR     Consume 09h30.out ... 13h30.out raw uvspec files.
  --reference-cube FILE     Consume a complete pinned libRadtran cube instead.
  --measurements FILE       Complete Kider measurement cube used for proposed scoring.
  --coarse-results FILE     All 550 alpha/beta/g RMSE rows.
  --proposed-cube FILE      Complete proposed-method cube on the same axes.
  --proposed-j2-cube FILE   Complete Algorithm32 J2 cube on the same axes.
  --proposed-j3-cube FILE   Complete Algorithm32 J3 cube on the same axes.
  --proposed-j4-cube FILE   Complete Algorithm32 J4 cube on the same axes.
  --proposed-j5-cube FILE   Complete Algorithm32 J5 cube on the same axes.
  --mismatch-map FILE       Required field-by-field model mismatch declaration.
  --j2-mismatch-map FILE    Required Algorithm32 J2 mismatch declaration.
  --j3-mismatch-map FILE    Required Algorithm32 J3 mismatch declaration.
  --j4-mismatch-map FILE    Required Algorithm32 J4 mismatch declaration.
  --j5-mismatch-map FILE    Required Algorithm32 J5 mismatch declaration.
  --judgment-rules FILE     Required predeclared whole-algorithm judgment rules.
  --j2-judgment-rules FILE  Required pre-result Algorithm32 J2 judgment record.
  --j3-judgment-rules FILE  Required pre-result Algorithm32 J3 judgment record.
  --j4-judgment-rules FILE  Required pre-result Algorithm32 J4 judgment record.
  --j5-judgment-rules FILE  Required pre-result Algorithm32 J5 judgment record.
  --b1-result FILE          Durable B1 Markdown with candidate-labelled aggregates.

Run control:
  --workdir DIR             Generated support files and uvspec outputs.
  --save                    Save the Markdown report, including partial status.
  --result FILE             Override the durable Markdown report path.
  --reference-result FILE   Override the saved normalized libRadtran cube path.
  --output-root DIR         Parent folder for backend-specific B-level results.
  --require-complete        Exit nonzero unless all B3 acceptance stages complete.
  --help                    Show this message.
`;

function fileInput(path) {
	if (!path) return null;
	const absolute = resolve(path);
	if (!existsSync(absolute)) throw new Error(`Input does not exist: ${absolute}`);
	const bytes = readFileSync(absolute);
	return Object.freeze({
		path: absolute,
		sha256: createHash('sha256').update(bytes).digest('hex'),
		bytes: bytes.length,
	});
}

export function readB1AggregateResult(path, candidateLabel = 'Algorithm32') {
	const input = fileInput(path);
	const text = readFileSync(input.path, 'utf8');
	if (typeof candidateLabel !== 'string' || candidateLabel.length === 0) {
		throw new TypeError('B1 candidate label must be a nonempty string.');
	}
	const escapedLabel = candidateLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(`^Candidate aggregate RMSE \\[${escapedLabel}\\]:\\s*([0-9]+(?:\\.[0-9]+)?)\\s+mW`, 'm');
	const match =
		text.match(pattern) ??
		(candidateLabel === 'Algorithm32'
			? text.match(/^Proposed aggregate RMSE:\s*([0-9]+(?:\.[0-9]+)?)\s+mW/m)
			: null);
	if (!match) {
		throw new TypeError(`${input.path} does not contain the durable B1 aggregate RMSE for ${candidateLabel}.`);
	}
	return Object.freeze({
		...input,
		candidateLabel,
		aggregateRmseMilliwatt: Number(match[1]),
	});
}

function stage(id, name, status, detail, accepted = null) {
	return Object.freeze({id, name, status, detail, accepted});
}

function resolveReferenceMode(options) {
	const requested = [
		options.referenceCubePath && '--reference-cube',
		options.externalOutputDirectory && '--external-output',
		options.uvspecPath && '--uvspec',
	].filter(Boolean);
	if (requested.length > 1) {
		throw new TypeError(`Choose one fixed-reference source, not ${requested.join(', ')}.`);
	}
	return requested[0] ?? null;
}

function scoreCandidateProfile({
	candidateLabel,
	cubeArgument,
	cubePath,
	mismatchArgument,
	mismatchMapPath,
	rulesArgument,
	judgmentRulesPath,
	b1ResultPath,
	measurementCube,
	inputKeys,
}) {
	if (!cubePath) return null;
	if (!measurementCube) {
		throw new TypeError(`${cubeArgument} requires --measurements on the same 17x81x31 boundary.`);
	}
	if (!mismatchMapPath || !judgmentRulesPath) {
		throw new TypeError(`${cubeArgument} requires ${mismatchArgument} and predeclared ${rulesArgument}.`);
	}

	const inputs = {
		[inputKeys.cube]: fileInput(cubePath),
		[inputKeys.mismatchMap]: fileInput(mismatchMapPath),
		[inputKeys.judgmentRules]: fileInput(judgmentRulesPath),
	};
	const mismatchMap = readMismatchMap(inputs[inputKeys.mismatchMap].path);
	const judgmentRules = readJudgmentRules(inputs[inputKeys.judgmentRules].path);
	const measurementScore = scoreCubes(measurementCube, readCube(inputs[inputKeys.cube].path));
	const score = Object.freeze({
		...measurementScore,
		candidateLabel,
		reference: 'Kider directional spectral-radiance measurements',
		publishedLibRadtranRmseMilliwatt: PUBLISHED.coarse.rmseMilliwatt,
		differenceFromPublishedLibRadtranMilliwatt: measurementScore.rmseMilliwatt - PUBLISHED.coarse.rmseMilliwatt,
		ratioToPublishedLibRadtran: measurementScore.rmseMilliwatt / PUBLISHED.coarse.rmseMilliwatt,
	});
	const conditionRmseByTime = Object.fromEntries(
		score.conditions.map((condition) => [condition.conditionId.replace('h', ':'), condition.rmseMilliwatt]),
	);
	const b1Assessment = judgmentRules?.publishedComparatorScale
		? classifyB1(
				{
					aggregateRmseMilliwatt: score.rmseMilliwatt,
					conditionRmseByTime,
					outputValid: true,
				},
				judgmentRules,
			)
		: null;
	let b1Result = null;
	let assessment = null;
	if (b1ResultPath && b1Assessment) {
		b1Result = readB1AggregateResult(b1ResultPath, candidateLabel);
		inputs[inputKeys.b1Result] = b1Result;
		assessment = classifyB3({
			b1AggregateRmseMilliwatt: b1Result.aggregateRmseMilliwatt,
			b1Classification: b1Assessment.classification,
			b3AggregateRmseMilliwatt: score.rmseMilliwatt,
			mismatchMap,
			requiredMismatchFields: judgmentRules.b3MismatchBoundary?.expectedFields,
		});
	}
	return Object.freeze({
		candidateLabel,
		inputs: Object.freeze(inputs),
		score,
		mismatchMap,
		judgmentRules,
		b1Result,
		b1Assessment,
		assessment,
	});
}

export function runExperiment(options = {}) {
	if (options.productionRunPath) {
		if (options.profileFamily && options.profileFamily !== 'paper') {
			throw new TypeError('--production-run uses the benchmark-owned paper profile family.');
		}
		if (!options.b1ResultPath) {
			throw new TypeError('--production-run requires --b1-result from B1 scoring of the same run.');
		}
		const run = ProductionRun.load(options.productionRunPath);
		options = {
			measurementCubePath: PAPER_CANONICAL_INPUTS.measurementCubePath,
			mismatchMapPath: PAPER_CANONICAL_INPUTS.mismatchMapPath,
			judgmentRulesPath: PAPER_CANONICAL_INPUTS.judgmentRulesPath,
			...ProductionRun.candidatePaths(run),
			...options,
			canonical: false,
			profileFamily: 'paper',
		};
	}
	const requested = {
		save: false,
		requireComplete: false,
		workDirectory: DEFAULT_WORK_DIRECTORY,
		...options,
	};
	const candidateFamily = resolveCandidateFamily(requested.profileFamily ?? 'native');
	const normalized = requested.canonical
		? {
				...(candidateFamily.id.startsWith('paper') ? PAPER_CANONICAL_INPUTS : CANONICAL_INPUTS),
				...requested,
			}
		: requested;
	const inputs = {};
	const stages = [];
	const contract = verifyContract();
	stages.push(
		stage(
			'contract',
			'Contract verification',
			contract.accepted ? 'passed' : 'failed',
			`${contract.checks.filter((check) => check.accepted).length}/${contract.checks.length} pinned-contract checks passed.`,
			contract.accepted,
		),
	);
	const publishedReferenceAdopted = true;
	stages.push(
		stage(
			'published-reference',
			'Published benchmark reference',
			'adopted',
			`Adopted Bruneton's published coarse minimum alpha=${PUBLISHED.coarse.alpha}, beta=${PUBLISHED.coarse.beta}, g=${PUBLISHED.coarse.g}, RMSE=${PUBLISHED.coarse.rmseMilliwatt} mW/(m^2 sr nm), plus the published refined result, without requiring a local rerun of all 550 cases.`,
			true,
		),
	);

	let referenceCube = null;
	let fixedExecutions = [];
	const referenceMode = resolveReferenceMode(normalized);
	if (referenceMode === '--reference-cube') {
		inputs.referenceCube = fileInput(normalized.referenceCubePath);
		referenceCube = readCube(inputs.referenceCube.path);
		stages.push(
			stage(
				'fixed',
				'Fixed-parameter reference cases',
				'complete',
				'Consumed a complete externally supplied 17x81x31 libRadtran cube at alpha=.8, beta=.04, g=.7.',
				true,
			),
		);
	} else if (referenceMode === '--external-output') {
		const outputDirectory = resolve(normalized.externalOutputDirectory);
		inputs.externalOutputDirectory = outputDirectory;
		referenceCube = cubeFromExternalOutputs(outputDirectory);
		fixedExecutions = FIXED_CONDITIONS.map((condition) => {
			const output = fileInput(resolve(outputDirectory, `${condition.id}.out`));
			return {
				conditionId: condition.id,
				outputPath: output.path,
				outputSha256: output.sha256,
				mode: 'supplied raw uvspec output',
			};
		});
		stages.push(
			stage(
				'fixed',
				'Fixed-parameter reference cases',
				'complete',
				'Parsed all 17 raw uvspec outputs into the pinned 17x81x31 cube.',
				true,
			),
		);
	} else if (referenceMode === '--uvspec') {
		const workDirectory = resolve(normalized.workDirectory);
		const uvspecPath = normalized.uvspecPath.startsWith('/')
			? normalized.uvspecPath
			: resolve(normalized.uvspecPath);
		const wslUser = normalized.wslUser ?? null;
		if (wslUser) inputs.wslUser = wslUser;
		inputs.uvspec = Object.freeze({
			path: uvspecPath,
			sha256: fingerprintUvspecExecutable({uvspecPath, wslUser}),
		});
		inputs.workDirectory = workDirectory;
		fixedExecutions = executeFixedCases({
			uvspecPath,
			workDirectory,
			wslUser,
		});
		referenceCube = cubeFromExternalOutputs(workDirectory);
		stages.push(
			stage(
				'fixed',
				'Fixed-parameter reference cases',
				'complete',
				'Generated the source-equivalent support files and ran uvspec as a separate process for all 17 conditions.',
				true,
			),
		);
	} else {
		stages.push(
			stage(
				'fixed',
				'Fixed-parameter reference cases',
				'not-run',
				'Needs --uvspec, --external-output, or --reference-cube. No solver output was fabricated.',
				null,
			),
		);
	}

	let measurementCube = null;
	if (normalized.measurementCubePath) {
		inputs.measurements = fileInput(normalized.measurementCubePath);
		measurementCube = readMeasurementBoundary(inputs.measurements.path);
	}

	let fixedTarget = null;
	if (measurementCube && referenceCube) {
		fixedTarget = evaluatePublishedFixedTarget(measurementCube, referenceCube);
		stages.push(
			stage(
				'published-score',
				'Published fixed-target score',
				fixedTarget.accepted ? 'passed' : 'failed',
				`Computed ${fixedTarget.rmseMilliwatt.toFixed(6)} mW/(m^2 sr nm) against the published 11.48 target (tolerance ${fixedTarget.toleranceMilliwatt}).`,
				fixedTarget.accepted,
			),
		);
	} else {
		stages.push(
			stage(
				'published-score',
				'Published fixed-target score',
				'not-run',
				'Optional cross-check needs both --measurements and a complete local libRadtran reference cube.',
				null,
			),
		);
	}

	let coarse = null;
	if (normalized.coarseResultsPath) {
		inputs.coarseResults = fileInput(normalized.coarseResultsPath);
		coarse = readCoarseResults(inputs.coarseResults.path);
		stages.push(
			stage(
				'coarse',
				'Optional local coarse-search cross-check',
				coarse.accepted ? 'passed' : 'failed',
				`${coarse.observedCaseCount}/${coarse.expectedCaseCount} cases supplied; ` +
					(coarse.minimum
						? `minimum ${coarse.minimum.rmseMilliwatt} at alpha=${coarse.minimum.alpha}, beta=${coarse.minimum.beta}, g=${coarse.minimum.g}.`
						: 'no minimum available.'),
				coarse.accepted,
			),
		);
	} else {
		stages.push(
			stage(
				'coarse',
				'Optional local coarse-search cross-check',
				'not-run',
				'The exact 550-case grid is represented, but no externally computed complete table was supplied.',
				null,
			),
		);
	}

	const proposedProfile = scoreCandidateProfile({
		candidateLabel: candidateFamily.labels.default,
		cubeArgument: '--proposed-cube',
		cubePath: normalized.proposedCubePath,
		mismatchArgument: '--mismatch-map',
		mismatchMapPath: normalized.mismatchMapPath,
		rulesArgument: '--judgment-rules',
		judgmentRulesPath: normalized.judgmentRulesPath,
		b1ResultPath: normalized.b1ResultPath,
		measurementCube,
		inputKeys: {
			cube: 'proposedCube',
			mismatchMap: 'mismatchMap',
			judgmentRules: 'judgmentRules',
			b1Result: 'b1Result',
		},
	});
	if (proposedProfile) {
		Object.assign(inputs, proposedProfile.inputs);
		stages.push(
			stage(
				'proposed',
				`${candidateFamily.displayLabels.default} scoring`,
				'complete',
				`Scored the ${candidateFamily.displayLabels.default} 17x81x31 cube against the same Kider measurements: RMSE ${proposedProfile.score.rmseMilliwatt.toFixed(6)} mW/(m^2 sr nm), versus the paper's published libRadtran ${PUBLISHED.coarse.rmseMilliwatt}.`,
				true,
			),
		);
	} else {
		stages.push(
			stage(
				'proposed',
				'Proposed-method scoring',
				'not-run',
				'Needs --proposed-cube, the shared Kider --measurements boundary, a mismatch map, and rules declared before viewing proposed results.',
				null,
			),
		);
	}

	const proposedJ2Profile = scoreCandidateProfile({
		candidateLabel: candidateFamily.labels.j2,
		cubeArgument: '--proposed-j2-cube',
		cubePath: normalized.proposedJ2CubePath,
		mismatchArgument: '--j2-mismatch-map',
		mismatchMapPath: normalized.j2MismatchMapPath,
		rulesArgument: '--j2-judgment-rules',
		judgmentRulesPath: normalized.j2JudgmentRulesPath,
		b1ResultPath: normalized.b1ResultPath,
		measurementCube,
		inputKeys: {
			cube: 'proposedJ2Cube',
			mismatchMap: 'mismatchMapJ2',
			judgmentRules: 'judgmentRulesJ2',
			b1Result: 'b1ResultJ2',
		},
	});
	if (proposedJ2Profile) {
		Object.assign(inputs, proposedJ2Profile.inputs);
		stages.push(
			stage(
				'proposed-j2',
				`${candidateFamily.displayLabels.j2} comparative scoring`,
				'complete',
				`Independently scored the W27 cumulative-through-order-2 17x81x31 cube against the same Kider measurements: RMSE ${proposedJ2Profile.score.rmseMilliwatt.toFixed(6)} mW/(m^2 sr nm), versus the paper's published libRadtran ${PUBLISHED.coarse.rmseMilliwatt}.`,
				true,
			),
		);
	} else {
		stages.push(
			stage(
				'proposed-j2',
				`${candidateFamily.displayLabels.j2} comparative scoring`,
				'not-run',
				'Needs --proposed-j2-cube, the shared Kider --measurements boundary, its own mismatch map, and its pre-result judgment record.',
				null,
			),
		);
	}

	const proposedJ3Profile = scoreCandidateProfile({
		candidateLabel: candidateFamily.labels.j3,
		cubeArgument: '--proposed-j3-cube',
		cubePath: normalized.proposedJ3CubePath,
		mismatchArgument: '--j3-mismatch-map',
		mismatchMapPath: normalized.j3MismatchMapPath,
		rulesArgument: '--j3-judgment-rules',
		judgmentRulesPath: normalized.j3JudgmentRulesPath,
		b1ResultPath: normalized.b1ResultPath,
		measurementCube,
		inputKeys: {
			cube: 'proposedJ3Cube',
			mismatchMap: 'mismatchMapJ3',
			judgmentRules: 'judgmentRulesJ3',
			b1Result: 'b1ResultJ3',
		},
	});
	if (proposedJ3Profile) {
		Object.assign(inputs, proposedJ3Profile.inputs);
		stages.push(
			stage(
				'proposed-j3',
				`${candidateFamily.displayLabels.j3} comparative scoring`,
				'complete',
				`Independently scored the W27 cumulative-through-order-3 17x81x31 cube against the same Kider measurements: RMSE ${proposedJ3Profile.score.rmseMilliwatt.toFixed(6)} mW/(m^2 sr nm), versus the paper's published libRadtran ${PUBLISHED.coarse.rmseMilliwatt}.`,
				true,
			),
		);
	} else {
		stages.push(
			stage(
				'proposed-j3',
				`${candidateFamily.displayLabels.j3} comparative scoring`,
				'not-run',
				'Needs --proposed-j3-cube, the shared Kider --measurements boundary, its own mismatch map, and its pre-result judgment record.',
				null,
			),
		);
	}

	const proposedJ4Profile = scoreCandidateProfile({
		candidateLabel: candidateFamily.labels.j4,
		cubeArgument: '--proposed-j4-cube',
		cubePath: normalized.proposedJ4CubePath,
		mismatchArgument: '--j4-mismatch-map',
		mismatchMapPath: normalized.j4MismatchMapPath,
		rulesArgument: '--j4-judgment-rules',
		judgmentRulesPath: normalized.j4JudgmentRulesPath,
		b1ResultPath: normalized.b1ResultPath,
		measurementCube,
		inputKeys: {
			cube: 'proposedJ4Cube',
			mismatchMap: 'mismatchMapJ4',
			judgmentRules: 'judgmentRulesJ4',
			b1Result: 'b1ResultJ4',
		},
	});
	if (proposedJ4Profile) {
		Object.assign(inputs, proposedJ4Profile.inputs);
		stages.push(
			stage(
				'proposed-j4',
				`${candidateFamily.displayLabels.j4} comparative scoring`,
				'complete',
				`Independently scored the W27 cumulative-through-order-4 17x81x31 cube against the same Kider measurements: RMSE ${proposedJ4Profile.score.rmseMilliwatt.toFixed(6)} mW/(m^2 sr nm), versus the paper's published libRadtran ${PUBLISHED.coarse.rmseMilliwatt}.`,
				true,
			),
		);
	} else {
		stages.push(
			stage(
				'proposed-j4',
				`${candidateFamily.displayLabels.j4} comparative scoring`,
				'not-run',
				'Needs --proposed-j4-cube, the shared Kider --measurements boundary, its own mismatch map, and its pre-result judgment record.',
				null,
			),
		);
	}

	const proposedJ5Profile = scoreCandidateProfile({
		candidateLabel: candidateFamily.labels.j5,
		cubeArgument: '--proposed-j5-cube',
		cubePath: normalized.proposedJ5CubePath,
		mismatchArgument: '--j5-mismatch-map',
		mismatchMapPath: normalized.j5MismatchMapPath,
		rulesArgument: '--j5-judgment-rules',
		judgmentRulesPath: normalized.j5JudgmentRulesPath,
		b1ResultPath: normalized.b1ResultPath,
		measurementCube,
		inputKeys: {
			cube: 'proposedJ5Cube',
			mismatchMap: 'mismatchMapJ5',
			judgmentRules: 'judgmentRulesJ5',
			b1Result: 'b1ResultJ5',
		},
	});
	if (proposedJ5Profile) {
		Object.assign(inputs, proposedJ5Profile.inputs);
		stages.push(
			stage(
				'proposed-j5',
				`${candidateFamily.displayLabels.j5} comparative scoring`,
				'complete',
				`Independently scored the W27 cumulative-through-order-5 17x81x31 cube against the same Kider measurements: RMSE ${proposedJ5Profile.score.rmseMilliwatt.toFixed(6)} mW/(m^2 sr nm), versus the paper's published libRadtran ${PUBLISHED.coarse.rmseMilliwatt}.`,
				true,
			),
		);
	} else {
		stages.push(
			stage(
				'proposed-j5',
				`${candidateFamily.displayLabels.j5} comparative scoring`,
				'not-run',
				'Needs --proposed-j5-cube, the shared Kider --measurements boundary, its own mismatch map, and its pre-result judgment record.',
				null,
			),
		);
	}

	const accepted = contract.accepted && publishedReferenceAdopted && Boolean(proposedProfile);
	stages.push(
		stage(
			'acceptance',
			'B3 acceptance',
			accepted ? 'accepted' : 'incomplete',
			accepted
				? `The published benchmark reference was adopted and ${candidateFamily.displayLabels.default} was scored under predeclared rules.${proposedJ2Profile ? ` ${candidateFamily.displayLabels.j2} was also independently scored.` : ''}${proposedJ3Profile ? ` ${candidateFamily.displayLabels.j3} was also independently scored.` : ''}${proposedJ4Profile ? ` ${candidateFamily.displayLabels.j4} was also independently scored.` : ''}${proposedJ5Profile ? ` ${candidateFamily.displayLabels.j5} was also independently scored.` : ''}`
				: 'The published benchmark reference is adopted. B3 remains incomplete only because proposed-method scoring has not been supplied.',
			accepted,
		),
	);

	return Object.freeze({
		experiment: EXPERIMENT,
		name: NAME,
		question: QUESTION,
		candidateFamily,
		inputs: Object.freeze(inputs),
		contract,
		fixedExecutions: Object.freeze(fixedExecutions),
		referenceCube,
		measurementCube,
		referenceMode,
		publishedReferenceAdopted,
		fixedTarget,
		coarse,
		proposed: proposedProfile?.score ?? null,
		mismatchMap: proposedProfile?.mismatchMap ?? null,
		judgmentRules: proposedProfile?.judgmentRules ?? null,
		b1Result: proposedProfile?.b1Result ?? null,
		b1Assessment: proposedProfile?.b1Assessment ?? null,
		proposedAssessment: proposedProfile?.assessment ?? null,
		proposedJ2: proposedJ2Profile?.score ?? null,
		mismatchMapJ2: proposedJ2Profile?.mismatchMap ?? null,
		judgmentRulesJ2: proposedJ2Profile?.judgmentRules ?? null,
		b1ResultJ2: proposedJ2Profile?.b1Result ?? null,
		b1AssessmentJ2: proposedJ2Profile?.b1Assessment ?? null,
		proposedJ2Assessment: proposedJ2Profile?.assessment ?? null,
		proposedJ3: proposedJ3Profile?.score ?? null,
		mismatchMapJ3: proposedJ3Profile?.mismatchMap ?? null,
		judgmentRulesJ3: proposedJ3Profile?.judgmentRules ?? null,
		b1ResultJ3: proposedJ3Profile?.b1Result ?? null,
		b1AssessmentJ3: proposedJ3Profile?.b1Assessment ?? null,
		proposedJ3Assessment: proposedJ3Profile?.assessment ?? null,
		proposedJ4: proposedJ4Profile?.score ?? null,
		mismatchMapJ4: proposedJ4Profile?.mismatchMap ?? null,
		judgmentRulesJ4: proposedJ4Profile?.judgmentRules ?? null,
		b1ResultJ4: proposedJ4Profile?.b1Result ?? null,
		b1AssessmentJ4: proposedJ4Profile?.b1Assessment ?? null,
		proposedJ4Assessment: proposedJ4Profile?.assessment ?? null,
		proposedJ5: proposedJ5Profile?.score ?? null,
		mismatchMapJ5: proposedJ5Profile?.mismatchMap ?? null,
		judgmentRulesJ5: proposedJ5Profile?.judgmentRules ?? null,
		b1ResultJ5: proposedJ5Profile?.b1Result ?? null,
		b1AssessmentJ5: proposedJ5Profile?.b1Assessment ?? null,
		proposedJ5Assessment: proposedJ5Profile?.assessment ?? null,
		comparativeProfilesComplete: Boolean(
			proposedProfile && proposedJ2Profile && proposedJ3Profile && proposedJ4Profile && proposedJ5Profile,
		),
		canonical: Boolean(normalized.canonical),
		complete:
			accepted &&
			(!normalized.canonical ||
				Boolean(
					proposedProfile && proposedJ2Profile && proposedJ3Profile && proposedJ4Profile && proposedJ5Profile,
				)),
		stages: Object.freeze(stages),
		accepted,
	});
}

const number = (value, digits = 6) => Number(value).toExponential(digits);

function appendScoreTable(lines, heading, score) {
	if (!score) return;
	lines.push(
		'',
		`## ${heading}`,
		'',
		'| iteration | condition | samples | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) |',
		'| ---: | --- | ---: | ---: | ---: |',
	);
	score.conditions.forEach((condition, index) =>
		lines.push(
			`| ${index + 1} | ${condition.conditionId} | ${condition.sampleCount} | ${number(condition.rmseMilliwatt)} | ${number(condition.maximumAbsoluteResidualWatt)} |`,
		),
	);
	lines.push(
		'',
		`Aggregate: ${score.sampleCount} samples; RMSE ${number(score.rmseMilliwatt)} mW m^-2 sr^-1 nm^-1; maximum absolute residual ${number(score.maximumAbsoluteResidualWatt)} W m^-2 sr^-1 nm^-1.`,
	);
}

function appendCandidateAssessment(lines, {heading, assessment, b1Result, mismatchMap}) {
	if (!assessment) return;
	const mismatch = assessment.mismatchAssessment;
	lines.push(
		'',
		`## ${heading}`,
		'',
		`Classification inherited from B1: **${assessment.classification.toUpperCase()}**.`,
		'',
		`Durable B1 result: \`${b1Result.path}\` (SHA-256 \`${b1Result.sha256}\`; ${b1Result.bytes} bytes).`,
		'',
		'| consistency value | result |',
		'| --- | ---: |',
		`| B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | ${number(assessment.b1AggregateRmseMilliwatt)} |`,
		`| B3 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | ${number(assessment.b3AggregateRmseMilliwatt)} |`,
		`| B3 minus B1 (mW m^-2 sr^-1 nm^-1) | ${number(assessment.differenceMilliwatt)} |`,
		`| permitted absolute difference | ${number(assessment.toleranceMilliwatt)} |`,
		`| consistency result | ${assessment.consistent ? 'passed' : 'failed'} |`,
		'',
		`Comparison-map completeness: **${mismatch.complete ? 'passed' : 'failed'}**; ` +
			`${mismatch.observedFieldCount}/${mismatch.expectedFieldCount} required declarations supplied ` +
			`(${mismatch.observedMismatchCount} mismatches; ${mismatch.observedMatchCount} matches).`,
		'',
		'| declared mismatch | disposition |',
		'| --- | --- |',
	);
	for (const item of mismatchMap.mismatches) {
		lines.push(`| ${item.field} | ${item.disposition.replaceAll('|', '\\|')} |`);
	}
	if (Array.isArray(mismatchMap.matches) && mismatchMap.matches.length > 0) {
		lines.push('', '| matched input | disposition |', '| --- | --- |');
		for (const item of mismatchMap.matches) {
			lines.push(`| ${item.field} | ${item.disposition.replaceAll('|', '\\|')} |`);
		}
	}
	if (!mismatch.complete) {
		lines.push(
			'',
			`Missing fields: ${mismatch.missingFields.join(', ') || 'none'}; ` +
				`unexpected fields: ${mismatch.unexpectedFields.join(', ') || 'none'}; ` +
				`duplicates: ${mismatch.duplicateFields.join(', ') || 'none'}; ` +
				`invalid dispositions: ${mismatch.invalidDispositions.join(', ') || 'none'}.`,
		);
	}
}

function candidateConclusion(label, score, assessment) {
	if (!score) return '';
	const map = assessment?.mismatchAssessment;
	const consistency = assessment
		? ` It inherits B1 classification **${assessment.classification}**, agrees with its candidate-labelled B1 aggregate within ${number(assessment.toleranceMilliwatt)}, and has a complete ${map.expectedFieldCount}-field comparison map (${map.observedMismatchCount} mismatches; ${map.observedMatchCount} matches).`
		: ' Its B1/B3 consistency classification remains unavailable because a candidate-labelled B1 aggregate was not supplied.';
	return ` ${label} was independently scored at ${number(score.rmseMilliwatt)} mW m^-2 sr^-1 nm^-1.${consistency}`;
}

export function serializeReferenceCube(run) {
	if (!run.referenceCube) {
		throw new TypeError('A complete fixed-reference cube is required for serialization.');
	}
	return `${JSON.stringify({
		...run.referenceCube,
		provenance: {
			source: 'B3 normalized fixed-parameter libRadtran reference result',
			generator: 'scripts/experiments/b3-matched-atmosphere-solver/run.js',
			brunetonComparisonRevision: SOURCE_REVISION,
			libRadtranVersion: LIBRADTRAN_VERSION,
			sourceMode: run.referenceMode,
			uvspecExecutable: run.inputs.uvspec ?? null,
			aerosolParameters: PUBLISHED.coarse,
		},
	})}\n`;
}

export function renderReport(run, durableArtifacts = {}) {
	const lines = [
		`# ${EXPERIMENT} - ${NAME}`,
		'',
		'## Question',
		'',
		QUESTION,
		'',
		'## Inputs',
		'',
		'```json',
		JSON.stringify(
			{
				authorities: {
					brunetonComparisonRevision: SOURCE_REVISION,
					libRadtranVersion: LIBRADTRAN_VERSION,
				},
				fixedAtmosphere: MATCHED_ATMOSPHERE,
				publishedTargets: PUBLISHED,
				axes: {
					conditions: FIXED_CONDITIONS.length,
					conditionRange: `${FIXED_CONDITIONS[0].id}-${FIXED_CONDITIONS.at(-1).id}`,
					directions: DIRECTION_CONTRACT.directions.length,
					fullWavelengthFormula: 'lambda_i = 360 nm + i * 11.75 nm, i=0..39',
					scoredWavelengthsNm: SCORED_WAVELENGTHS_NM,
					scoreShape: [17, 81, 31],
				},
				coarseGrid: {
					alpha: COARSE_GRID.alpha,
					beta: COARSE_GRID.beta,
					g: COARSE_GRID.g,
					caseCount: enumerateCoarseGrid().length,
				},
				suppliedInputs: run.inputs,
				durableArtifacts,
				mismatchMap: run.mismatchMap,
				mismatchMapJ2: run.mismatchMapJ2,
				mismatchMapJ3: run.mismatchMapJ3,
				mismatchMapJ4: run.mismatchMapJ4,
				mismatchMapJ5: run.mismatchMapJ5,
				judgmentRules: run.judgmentRules,
				judgmentRulesJ2: run.judgmentRulesJ2,
				judgmentRulesJ3: run.judgmentRulesJ3,
				judgmentRulesJ4: run.judgmentRulesJ4,
				judgmentRulesJ5: run.judgmentRulesJ5,
			},
			null,
			2,
		),
		'```',
		'',
		'## Iterations',
		'',
		`Stage iterations: ${run.stages.length}`,
		'',
		'| iteration | stage | status | detail |',
		'| ---: | --- | --- | --- |',
	];
	run.stages.forEach((item, index) =>
		lines.push(`| ${index + 1} | ${item.name} | ${item.status} | ${item.detail.replaceAll('|', '\\|')} |`),
	);

	lines.push('', '## Contract verification', '', '| check | accepted |', '| --- | --- |');
	run.contract.checks.forEach((check) => lines.push(`| ${check.name} | ${check.accepted ? 'yes' : 'no'} |`));

	if (run.fixedExecutions.length > 0) {
		lines.push(
			'',
			'## Fixed-case execution records',
			'',
			'| iteration | condition | source/output | output SHA-256 |',
			'| ---: | --- | --- | --- |',
		);
		run.fixedExecutions.forEach((execution, index) =>
			lines.push(
				`| ${index + 1} | ${execution.conditionId} | ${execution.outputPath} | ${execution.outputSha256 ?? 'not recorded'} |`,
			),
		);
	}

	appendScoreTable(lines, 'Published fixed-target score', run.fixedTarget);
	appendScoreTable(
		lines,
		`Proposed method versus Kider measurements - ${run.candidateFamily.displayLabels.default}`,
		run.proposed,
	);
	appendScoreTable(
		lines,
		`Proposed method versus Kider measurements - ${run.candidateFamily.displayLabels.j2}`,
		run.proposedJ2,
	);
	appendScoreTable(
		lines,
		`Proposed method versus Kider measurements - ${run.candidateFamily.displayLabels.j3}`,
		run.proposedJ3,
	);
	appendScoreTable(
		lines,
		`Proposed method versus Kider measurements - ${run.candidateFamily.displayLabels.j4}`,
		run.proposedJ4,
	);
	appendScoreTable(
		lines,
		`Proposed method versus Kider measurements - ${run.candidateFamily.displayLabels.j5}`,
		run.proposedJ5,
	);

	for (const score of [run.proposed, run.proposedJ2, run.proposedJ3, run.proposedJ4, run.proposedJ5].filter(
		Boolean,
	)) {
		lines.push(
			'',
			`## Published libRadtran comparison - ${score.candidateLabel}`,
			'',
			`${score.candidateLabel}'s measurement RMSE is ${number(score.rmseMilliwatt)} mW m^-2 sr^-1 nm^-1. The paper reports ${PUBLISHED.coarse.rmseMilliwatt} for the matched libRadtran coarse result and ${PUBLISHED.refined.rmseMilliwatt} for its refined result. The candidate-minus-published-coarse difference is ${number(score.differenceFromPublishedLibRadtranMilliwatt)} mW m^-2 sr^-1 nm^-1, and the ratio is ${number(score.ratioToPublishedLibRadtran)}. These are scores against the same measurements, not a sample-by-sample candidate-versus-libRadtran residual.`,
		);
	}

	appendCandidateAssessment(lines, {
		heading: `Predeclared B3 classification - ${run.candidateFamily.displayLabels.default}`,
		assessment: run.proposedAssessment,
		b1Result: run.b1Result,
		mismatchMap: run.mismatchMap,
	});
	appendCandidateAssessment(lines, {
		heading: `Predeclared B3 classification - ${run.candidateFamily.displayLabels.j2}`,
		assessment: run.proposedJ2Assessment,
		b1Result: run.b1ResultJ2,
		mismatchMap: run.mismatchMapJ2,
	});
	appendCandidateAssessment(lines, {
		heading: `Predeclared B3 classification - ${run.candidateFamily.displayLabels.j3}`,
		assessment: run.proposedJ3Assessment,
		b1Result: run.b1ResultJ3,
		mismatchMap: run.mismatchMapJ3,
	});
	appendCandidateAssessment(lines, {
		heading: `Predeclared B3 classification - ${run.candidateFamily.displayLabels.j4}`,
		assessment: run.proposedJ4Assessment,
		b1Result: run.b1ResultJ4,
		mismatchMap: run.mismatchMapJ4,
	});
	appendCandidateAssessment(lines, {
		heading: `Predeclared B3 classification - ${run.candidateFamily.displayLabels.j5}`,
		assessment: run.proposedJ5Assessment,
		b1Result: run.b1ResultJ5,
		mismatchMap: run.mismatchMapJ5,
	});

	if (run.coarse) {
		lines.push(
			'',
			'## Coarse-search reproduction',
			'',
			`Cases: ${run.coarse.observedCaseCount}/${run.coarse.expectedCaseCount}.`,
			'',
			'| iteration | alpha | beta | g | RMSE (mW m^-2 sr^-1 nm^-1) | published target |',
			'| ---: | ---: | ---: | ---: | ---: | --- |',
		);
		run.coarse.cases.forEach((item, index) =>
			lines.push(
				`| ${index + 1} | ${item.alpha} | ${item.beta} | ${item.g} | ${number(item.rmseMilliwatt)} | ${item.alpha === PUBLISHED.coarse.alpha && item.beta === PUBLISHED.coarse.beta && item.g === PUBLISHED.coarse.g ? 'yes' : ''} |`,
			),
		);
		lines.push(
			'',
			`Minimum: ${run.coarse.minimum ? `alpha=${run.coarse.minimum.alpha}, beta=${run.coarse.minimum.beta}, g=${run.coarse.minimum.g}, RMSE=${run.coarse.minimum.rmseMilliwatt}` : 'unavailable'}.`,
			'',
			`Coarse-search accepted: ${run.coarse.accepted ? 'yes' : 'no'}.`,
		);
	}

	lines.push(
		'',
		'## Acceptance meaning',
		'',
		`The paper and pinned comparison source are the authority for the published 550-case aerosol-search result; rerunning that search locally is an optional cross-check, not an acceptance prerequisite. Contract verification proves only that the runner encodes the published comparison boundary. A local fixed-case execution or supplied coarse table proves only the stated cross-check. Each candidate cube is independently scored against the same Kider measurements and its RMSE is placed beside the paper's published libRadtran RMSE; no candidate requires a locally regenerated libRadtran cube. Because the aerosol parameters were fitted to these measurements, these are in-sample comparisons rather than independent validation, and without a published pointwise libRadtran cube they do not establish sample-by-sample solver agreement. Each candidate requires its explicit mismatch map and pre-result judgment record. ${run.candidateFamily.displayLabels.default} is the selected family baseline; its J2 through J5 variants are the active n-order candidates.`,
		'',
		'## Conclusion',
		'',
		run.accepted
			? `Accepted. The published libRadtran benchmark and aerosol-search result were adopted as the external reference, and ${run.candidateFamily.displayLabels.default} was scored against the same Kider measurements at the 17x81x31 directional spectral-radiance boundary under predeclared judgment rules.${run.proposedAssessment ? ` Its B3 classification remains **${run.proposedAssessment.classification}** by inheritance from B1: its ${number(run.proposedAssessment.b3AggregateRmseMilliwatt)} mW m^-2 sr^-1 nm^-1 score agrees with durable B1 within ${number(run.proposedAssessment.toleranceMilliwatt)}, and the complete mismatch map records all ${run.proposedAssessment.mismatchAssessment.expectedFieldCount} required declarations.` : ' Its B3 consistency classification remains unavailable because no durable B1 result was supplied.'}${candidateConclusion(run.candidateFamily.displayLabels.j2, run.proposedJ2, run.proposedJ2Assessment)}${candidateConclusion(run.candidateFamily.displayLabels.j3, run.proposedJ3, run.proposedJ3Assessment)}${candidateConclusion(run.candidateFamily.displayLabels.j4, run.proposedJ4, run.proposedJ4Assessment)}${candidateConclusion(run.candidateFamily.displayLabels.j5, run.proposedJ5, run.proposedJ5Assessment)}`
			: run.fixedTarget?.accepted
				? 'Incomplete. The published libRadtran reference is adopted and the optional fixed-case cross-check reproduced 11.48 mW/(m^2 sr nm). Only proposed-method scoring under predeclared rules remains open.'
				: 'Incomplete. The published libRadtran reference is adopted without requiring a local 550-case rerun. Proposed-method scoring under predeclared rules remains open.',
	);
	return `${lines.join('\n')}\n`;
}

function main(argv) {
	const options = parseArguments(argv);
	if (options.help) {
		process.stdout.write(HELP);
		return;
	}
	const run = runExperiment(options);
	const resultRoot = options.productionRunPath
		? resolveProductionResultRoot(
				options.outputRoot,
				'b3-matched-atmosphere-solver',
				ProductionRun.load(options.productionRunPath).manifest.backend,
			)
		: resolve(options.outputRoot ?? DEFAULT_EXPERIMENT_RESULTS_ROOT);
	const resultPath = resolve(
		options.resultPath ??
			(options.outputRoot || options.productionRunPath
				? join(resultRoot, ...(options.productionRunPath ? [] : ['b3-matched-atmosphere-solver']), 'result.md')
				: DEFAULT_RESULT_PATH),
	);
	const durableArtifacts = {};
	if (options.save && run.referenceCube) {
		const referenceResultPath = resolve(
			options.referenceResultPath ?? join(dirname(resultPath), DEFAULT_REFERENCE_RESULT_NAME),
		);
		if (
			run.referenceMode === '--reference-cube' &&
			resolve(run.inputs.referenceCube.path) === referenceResultPath
		) {
			durableArtifacts.referenceCube = Object.freeze({
				path: referenceResultPath,
				sha256: run.inputs.referenceCube.sha256,
				bytes: run.inputs.referenceCube.bytes,
				disposition: 'reused unchanged',
			});
			process.stderr.write(`Reused existing normalized libRadtran cube unchanged: ${referenceResultPath}\n`);
		} else {
			const referenceContent = serializeReferenceCube(run);
			mkdirSync(dirname(referenceResultPath), {recursive: true});
			writeFileSync(referenceResultPath, referenceContent, 'utf8');
			durableArtifacts.referenceCube = Object.freeze({
				path: referenceResultPath,
				sha256: createHash('sha256').update(referenceContent).digest('hex'),
				bytes: Buffer.byteLength(referenceContent),
			});
			process.stderr.write(`Saved normalized libRadtran cube: ${referenceResultPath}\n`);
		}
	}
	const report = renderReport(run, durableArtifacts);
	process.stdout.write(report);
	if (options.save) {
		mkdirSync(dirname(resultPath), {recursive: true});
		writeFileSync(resultPath, report, 'utf8');
		process.stderr.write(`Saved B3 status report: ${resultPath}\n`);
	}
	if (options.requireComplete && !run.complete) process.exitCode = 2;
}

const invokedPath = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invokedPath === import.meta.url) {
	try {
		main(process.argv.slice(2));
	} catch (error) {
		process.stderr.write(`${error.stack ?? error.message}\n`);
		process.exitCode = 1;
	}
}
