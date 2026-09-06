#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {
	createMemoryProjections,
	runNative15BaseGainDeltaStudy,
} from '../codecs/native15-base-gain-delta-study.js';
import {
	NATIVE15_BASIS,
	extractRecordedNative15Corpus,
} from '../corpus/recorded-native15-path-radiance.js';
import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	sha256,
	sha256File,
} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {
	CONTAINMENT_POLICY_PATH,
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	PRODUCTION_SOURCE_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';

const COMMAND =
	'node experiments/extraterrestrial/solar-zenith-cache/runners/'
	+ 'run-native15-base-gain-delta-experiment.js';
const RUNNER_RELATIVE_PATH =
	'solar-zenith-cache/runners/run-native15-base-gain-delta-experiment.js';
const CODEC_RELATIVE_PATH =
	'solar-zenith-cache/codecs/native15-base-gain-delta-study.js';
const CORPUS_RELATIVE_PATH =
	'solar-zenith-cache/corpus/recorded-native15-path-radiance.js';
const DECLARED_RUNNER_ROOT =
	'experiments/extraterrestrial/solar-zenith-cache/runners';
const LANE_POLICY_RELATIVE_PATH =
	'solar-zenith-cache/containment-policy.json';
const LANE_POLICY_PATH = path.join(EXPERIMENT_ROOT, LANE_POLICY_RELATIVE_PATH);
const EXPECTED_SHARED_CONTAINMENT_POLICY_SHA256 =
	'228cfb87bdc319277aa3b8aa064914e1d08738d9da5197ab1d99b2aada1a990c';
const EXPECTED_LANE_CONTAINMENT_POLICY_SHA256 =
	'b65c3b021973153fd15f45c803ea3c117b48e4c22eae9ce575ca0c243cd77f24';
const SLUG = 'native15-base-gain-delta-rough-study';

const PARENTS = Object.freeze([
	Object.freeze({
		runId: '000258-spectral-color-stage1-ledger',
		artifactSetSha256:
			'abe89535535f523d4d04a0a5e9fe5cef86bff441f274cd998103e0121a7cacd5',
		artifactRelativePath: 'evidence/spectral-ledger.json',
		artifactSha256:
			'a1574e12645f3f0c5eff1694d609f9e73cc39ec2661cf131ad0356a09f1c55d0',
		role: 'multi-state spherical distant-Sun path-radiance proxy',
	}),
	Object.freeze({
		runId: '000471-san-jose-plus-one-hour-fibonacci-reflection-control',
		artifactSetSha256:
			'de0db263796363d29102006e27a3a352cdadde960cac524c4b4e93a27d1bd882',
		artifactRelativePath: 'evidence/fibonacci-reflection-control.json',
		artifactSha256:
			'750899955ab2ebb484c57a8f82b2097ac89b70416896420f4b2094bca4a67573',
		role: 'order-separated and quadrature-separated stress corpus',
	}),
	Object.freeze({
		runId: '000493-san-jose-nautical-twilight-ozone-f68-w39-preview',
		artifactSetSha256:
			'63ccccc8ce9e2796781dc6ac0fbd4c912c4340815050215f85dd263ea8ea966f',
		artifactRelativePath: 'evidence/sky-path-radiance-spectra.json',
		artifactSha256:
			'dc462d451e9a9e4c9332ba229e24d8beb6ac882ce35e1c5e0b472f989d9ac515',
		role: 'focused ozone/F68/W39 nautical grid',
	}),
	Object.freeze({
		runId:
			'000494-san-jose-nautical-twilight-ozone-f68-camera-patch-preview',
		artifactSetSha256:
			'74f1724881af45188802a178819a8e737bb94f5c3d05c7b3112a18e365b84084',
		artifactRelativePath: 'evidence/sky-path-radiance-spectra.json',
		artifactSha256:
			'af560d19510535c0f887f6d5b5cc06ca4cafebef3ac008b76f5459518241bf7d',
		role: 'paired camera-facing outgoing-reconstruction perturbation',
	}),
	Object.freeze({
		runId:
			'000497-san-jose-nautical-twilight-actual-point-j1-control',
		artifactSetSha256:
			'3460c9e3b4d450757861ad57ef9ae459d0a34b2d52af729611a68638cae82877',
		artifactRelativePath: 'evidence/node-binary64-direct-l1-oracle.json',
		artifactSha256:
			'6e259bd36643feb6f59bca942a4bbcaf38d4ee285616f174db0e3f40d3b934ba',
		role: 'converged actual-point direct-J1 adversarial holdout',
	}),
]);

const STUDY_CONFIGURATION = Object.freeze({
	baseSizes: Object.freeze([16, 32, 64, 128, 256]),
	sharedDeltaBaseSizes: Object.freeze([64, 256]),
	sharedDeltaSizes: Object.freeze([16, 64]),
	maxIterations: 8,
	materialFloor: 1e-12,
	dictionarySizeConvention:
		'sizes include reserved exact-zero ID 0',
	fitSemantics:
		'deterministic L2-normalized spherical base dictionaries; least-squares nonnegative Float32 gain; fixed-base signed shared deltas; shader-like Float32 decode',
});

const PROJECTED_SAMPLE_COUNTS = Object.freeze({
	currentProductionW27Field: 48 * 4374,
	run498InterpolationSafeBracket: 617 * 4374,
	run498InterpolationSafeHalo: 713 * 4374,
	fullNative48W27By180Zenith: 48 * 4374 * 180,
});

function requireCondition(value, message) {
	if (!value) {
		throw new Error(message);
	}
}

function countCohortRecords(cohorts) {
	return cohorts.reduce((sum, cohort) => sum + cohort.records.length, 0);
}

function float32TruthCensus(records) {
	let scalarCount = 0;
	let changedScalarCount = 0;
	let maxAbsoluteInputToFloat32Error = 0;
	let errorSquared = 0;
	let truthSquared = 0;
	const vectors = new Set();
	for (const record of records) {
		const rounded = record.values.map((value) => Math.fround(value));
		vectors.add(JSON.stringify(rounded));
		for (let channel = 0; channel < rounded.length; channel += 1) {
			const source = record.values[channel];
			const difference = rounded[channel] - source;
			scalarCount += 1;
			changedScalarCount += difference === 0 ? 0 : 1;
			maxAbsoluteInputToFloat32Error = Math.max(
				maxAbsoluteInputToFloat32Error,
				Math.abs(difference),
			);
			errorSquared += difference * difference;
			truthSquared += source * source;
		}
	}
	return {
		scalarCount,
		changedScalarCount,
		maxAbsoluteInputToFloat32Error,
		frobeniusRelativeInputToFloat32Error:
			truthSquared === 0 ? 0 : Math.sqrt(errorSquared / truthSquared),
		exactFloat32VectorCount: vectors.size,
		exactFloat32DuplicateCount: records.length - vectors.size,
	};
}

function csvCell(value) {
	if (value === null || value === undefined) {
		return '';
	}
	const text = String(value);
	return /[",\r\n]/u.test(text)
		? `"${text.replaceAll('"', '""')}"`
		: text;
}

function candidateRows(studyId, study) {
	const rows = [];
	for (const candidate of study.candidateRecords) {
		for (const cohort of candidate.cohorts) {
			const metrics = cohort.metrics;
			rows.push({
				study: studyId,
				candidateId: candidate.candidateId,
				codec: candidate.codec,
				baseDictionarySize:
					candidate.parameters.baseDictionarySize ?? '',
				deltaDictionarySize:
					candidate.parameters.deltaDictionarySize ?? '',
				bits: candidate.parameters.bits ?? '',
				cohortId: cohort.cohortId,
				recordCount: cohort.recordCount,
				logicalTotalBytes: cohort.memory.totalBytes,
				logicalBytesPerSample: cohort.memory.perSampleBytes,
				relativeL2P50Percent: metrics.relativeL2.percent?.p50 ?? '',
				relativeL2P95Percent: metrics.relativeL2.percent?.p95 ?? '',
				relativeL2P99Percent: metrics.relativeL2.percent?.p99 ?? '',
				relativeL2MaxPercent: metrics.relativeL2.percent?.max ?? '',
				globalFrobeniusPercent:
					metrics.global.frobeniusRelative * 100,
				maxAbsoluteError: metrics.global.maxAbsoluteError,
				materialRelativeP99Percent:
					metrics.materialFloorRelative.percent?.p99 ?? '',
				materialRelativeMaxPercent:
					metrics.materialFloorRelative.percent?.max ?? '',
				blueBandP99Percent:
					metrics.bands.blue.materialFloorRelativeError.percent?.p99 ?? '',
				blueBandMaxPercent:
					metrics.bands.blue.materialFloorRelativeError.percent?.max ?? '',
				ratio470To626P99Percent:
					metrics.ratio470To626.relativeError.percent?.p99 ?? '',
				ratio470To626MaxPercent:
					metrics.ratio470To626.relativeError.percent?.max ?? '',
				exactZeroTruthCount: metrics.invariants.exactZeroTruthCount,
				exactZeroViolatedCount:
					metrics.invariants.exactZeroViolatedCount,
				falseZeroCount: metrics.invariants.falseZeroCount,
				negativeScalarCount: metrics.invariants.negativeScalarCount,
				nonfiniteScalarCount: metrics.invariants.nonfiniteScalarCount,
				usedBaseIds: metrics.occupancy.base?.usedCount ?? '',
				usedDeltaIds: metrics.occupancy.delta?.usedCount ?? '',
				zeroDeltaFraction:
					metrics.occupancy.delta?.zeroFraction ?? '',
				worstRelativeL2RecordId:
					metrics.worstIds.relativeL2?.recordId ?? '',
			});
		}
	}
	return rows;
}

function candidateSummaryCsv(allFitStudy, blockedStudy) {
	const rows = [
		...candidateRows('all-fit-core-proxy', allFitStudy),
		...candidateRows('blocked-heldout-transfer', blockedStudy),
	];
	const headers = Object.keys(rows[0]);
	return [
		headers.map(csvCell).join(','),
		...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
		'',
	].join('\n');
}

function allCodecCohorts(study) {
	return study.candidateRecords.flatMap((candidate) => candidate.cohorts);
}

function findCandidate(study, candidateId) {
	const candidate = study.candidateRecords.find(
		(value) => value.candidateId === candidateId,
	);
	requireCondition(candidate, `Missing candidate ${candidateId}.`);
	return candidate;
}

function findCohort(candidate, cohortId) {
	const cohort = candidate.cohorts.find((value) => value.cohortId === cohortId);
	requireCondition(cohort, `Missing cohort ${candidate.candidateId}/${cohortId}.`);
	return cohort;
}

function formatPercent(fraction) {
	return fraction === null || fraction === undefined
		? 'n/a'
		: `${(100 * fraction).toPrecision(6)}%`;
}

function formatMiB(bytes) {
	return `${(bytes / (2 ** 20)).toFixed(3)} MiB`;
}

function projection(memory, populationId, kind, parameters) {
	const population = memory.cohorts.find((value) => value.id === populationId);
	requireCondition(population, `Missing memory population ${populationId}.`);
	const value = population.projections.find((candidate) =>
		candidate.kind === kind
		&& Object.entries(parameters).every(
			([key, expected]) => candidate.parameters[key] === expected,
		));
	requireCondition(value, `Missing memory projection ${populationId}/${kind}.`);
	return value;
}

function report(runId, corpusEvidence, allFitStudy, blockedStudy, memory) {
	const selected = [
		'base-gain-b64',
		'base-gain-b256',
		'base-gain-shared-delta-b64-d64',
		'base-gain-shared-delta-b256-d64',
		'base-gain-direct-int8-b64',
		'base-gain-direct-int16-b64',
	];
	const tableRows = selected.map((candidateId) => {
		const candidate = findCandidate(blockedStudy, candidateId);
		const heldGrid = findCohort(
			candidate,
			'internal-run493-held-grid-blocks',
		);
		const actualPoint = findCohort(
			candidate,
			'external-run497-actual-point-j1',
		);
		return `| ${candidateId} | ${candidate.cohorts[0].memory.perSampleBytes} | `
			+ `${formatPercent(heldGrid.metrics.relativeL2.p99)} | `
			+ `${formatPercent(heldGrid.metrics.relativeL2.max)} | `
			+ `${formatPercent(actualPoint.metrics.relativeL2.max)} |`;
	});
	const activeRaw = projection(
		memory.fixedUint16Direct15,
		'run498InterpolationSafeHalo',
		'raw-native15-f32',
		{},
	);
	const activeBase64 = projection(
		memory.fixedUint16Direct15,
		'run498InterpolationSafeHalo',
		'base-gain',
		{baseDictionarySize: 64},
	);
	const activeDelta64 = projection(
		memory.fixedUint16Direct15,
		'run498InterpolationSafeHalo',
		'base-gain-shared-delta',
		{baseDictionarySize: 64, deltaDictionarySize: 64},
	);
	return [
		`# ${runId}: Native15 base/gain/delta rough study`,
		'',
		'Conclusion: **accepted as a deterministic rough experiment**.',
		'',
		'This conclusion says the predeclared experiment executed and its evidence',
		'is internally consistent. It is not a codec selection or cache-quality pass.',
		'',
		'## Corpus',
		'',
		`- ${corpusEvidence.census.recordCount} recorded Native15 spectra;`,
		`- ${corpusEvidence.census.exactVectorCount} exact input vectors;`,
		`- ${corpusEvidence.census.exactZeroCount} exact-zero records, all from the `
			+ 'two run-471 N1 controls;',
		`- ${corpusEvidence.census.blockedTrainingCount} blocked-fit records;`,
		`- ${corpusEvidence.census.internalHoldoutCount} internal held-out records; and`,
		`- ${corpusEvidence.census.externalCount} separately labeled external stress records.`,
		'',
		'## Selected rate-distortion rows',
		'',
		'Every row below was retained regardless of error.',
		'',
		'| candidate | logical bytes/sample | held run-493 L2 p99 | held run-493 L2 max | actual-point J1 L2 max |',
		'| --- | ---: | ---: | ---: | ---: |',
		...tableRows,
		'',
		'The complete all-fit and held-out matrices, per-channel errors, blue/red',
		'bands, 470/626 ratio errors, exact-zero behavior, negative values, occupancy,',
		'worst identities, and dictionary hashes are retained in the JSON/CSV evidence.',
		'',
		'## Illustrative memory',
		'',
		'Using fixed uint16 base/delta IDs, direct 15-float dictionaries, and the',
		`run-498 halo population of ${activeRaw.sampleCount.toLocaleString('en-US')} spectra:`,
		'',
		`- raw Native15 R32F: ${formatMiB(activeRaw.totalBytes)};`,
		`- 64-entry base + gain: ${formatMiB(activeBase64.totalBytes)} `
			+ `(${activeBase64.reductionPercent.toFixed(3)}% fewer logical bytes); and`,
		`- 64-entry base + gain + 64-entry shared delta: `
			+ `${formatMiB(activeDelta64.totalBytes)} `
			+ `(${activeDelta64.reductionPercent.toFixed(3)}% fewer logical bytes).`,
		'',
		'Compact minimum-width IDs and four-RGBA-padded dictionaries are reported as',
		'separate ledgers so neither packing assumption is hidden.',
		'',
		'## Claim boundary',
		'',
		'The inputs are downstream path-integrated probes, not raw `(r, mu, mu_s, nu)`',
		'cache density or an offline N4 successor asset. They can reject obviously poor',
		'coding ideas and estimate rate-distortion plausibility; they cannot qualify',
		'a production cache, prove cross-zenith continuity, or project full-pool error.',
		'',
	].join('\n');
}

async function loadAndVerifyParents() {
	const verifications = await Promise.all(
		PARENTS.map((parent) => verifyRun(parent.runId)),
	);
	const parentJsonByRunId = {};
	const records = [];
	for (let index = 0; index < PARENTS.length; index += 1) {
		const parent = PARENTS[index];
		const verification = verifications[index];
		requireCondition(
			verification.verified
			&& verification.conclusion === 'accepted'
			&& verification.artifactSetSha256 === parent.artifactSetSha256,
			`Immutable parent verification failed: ${parent.runId}.`,
		);
		const parentDirectory = path.join(RUNS_ROOT, parent.runId);
		const artifactPath = path.join(
			parentDirectory,
			...parent.artifactRelativePath.split('/'),
		);
		await assertExistingRealPathContained(
			parentDirectory,
			artifactPath,
			`${parent.runId} source artifact`,
		);
		const [artifactHash, artifactText] = await Promise.all([
			sha256File(artifactPath),
			readFile(artifactPath, 'utf8'),
		]);
		requireCondition(
			artifactHash === parent.artifactSha256,
			`Immutable parent artifact changed: ${parent.runId}.`,
		);
		parentJsonByRunId[parent.runId] = JSON.parse(artifactText);
		records.push({...parent, verification});
	}
	return {parentJsonByRunId, records, verifications};
}

async function main() {
	requireCondition(
		process.argv.length === 2,
		'The Native15 rough study accepts no arguments.',
	);
	const run = await initializeRunRecord({
		slug: SLUG,
		command: COMMAND,
		inputs: {
			schemaId: 'native15-base-gain-delta-rough-study-inputs-v1',
			claimBoundary:
				'rough downstream path-radiance proxy rate-distortion only; no cache codec selection, raw-cache qualification, physical packing, GPU implementation, or production claim',
			parents: PARENTS,
			basis: NATIVE15_BASIS,
			studyConfiguration: STUDY_CONFIGURATION,
			projectedSampleCounts: PROJECTED_SAMPLE_COUNTS,
		},
		provenance: {
			schemaId: 'native15-base-gain-delta-rough-study-provenance-v1',
			operation:
				'round immutable Native15 proxy spectra to Float32 truth; fit deterministic global normalized-shape dictionaries on either the complete core proxy or blocked training groups; encode nonnegative least-squares gain; test fixed-base shared signed deltas and per-sample int8/int16 residual controls; decode with Float32 operations; score every predeclared result without a quality gate',
			implementation: [
				`experiments/extraterrestrial/${RUNNER_RELATIVE_PATH}`,
				`experiments/extraterrestrial/${CODEC_RELATIVE_PATH}`,
				`experiments/extraterrestrial/${CORPUS_RELATIVE_PATH}`,
			],
		},
		environment: {
			schemaId: 'native15-base-gain-delta-rough-study-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		references: {
			schemaId: 'native15-base-gain-delta-rough-study-references-v1',
			canonicalDesign:
				'agents/topics/algorithm32/cache/solar-zenith-cache-design.md#shared-spectral-dictionary-design',
			canonicalPlan:
				'agents/topics/algorithm32/cache/distant-sun-solar-zenith-cache-plan.md',
			implementedContract:
				'agents/topics/algorithm32/cache/cache-contract.md',
		},
	});

	try {
		await assertRepositoryIdentity();
		await Promise.all([
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				CONTAINMENT_POLICY_PATH,
				'shared containment policy',
			),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				LANE_POLICY_PATH,
				'solar-zenith lane containment policy',
			),
			assertNoReparseEntries(
				EXPERIMENT_ROOT,
				'Experiment source/control tree',
			),
		]);
		const [
			sharedPolicyText,
			lanePolicyText,
			sharedPolicyHashBefore,
			lanePolicyHashBefore,
		] = await Promise.all([
			readFile(CONTAINMENT_POLICY_PATH, 'utf8'),
			readFile(LANE_POLICY_PATH, 'utf8'),
			sha256File(CONTAINMENT_POLICY_PATH),
			sha256File(LANE_POLICY_PATH),
		]);
		const sharedPolicy = JSON.parse(sharedPolicyText);
		const lanePolicy = JSON.parse(lanePolicyText);
		requireCondition(
			sharedPolicy.policyId === 'algorithm32-extraterrestrial-g0-containment-v1'
			&& sharedPolicy.proofPolicy?.unitTestTree === 'prohibited'
			&& sharedPolicyHashBefore
				=== EXPECTED_SHARED_CONTAINMENT_POLICY_SHA256,
			'Shared containment policy differs from its pinned input.',
		);
		requireCondition(
			lanePolicy.policyId
				=== 'algorithm32-solar-zenith-cache-contained-lane-v1'
			&& lanePolicy.implementationRoot
				=== 'experiments/extraterrestrial/solar-zenith-cache'
			&& lanePolicy.generatedOutputRoot === 'tmp/extraterrestrial'
			&& lanePolicy.qualifyingRunnerRoot === DECLARED_RUNNER_ROOT
			&& lanePolicy.productionComparisonAccess === 'read-only'
			&& lanePolicy.unitTestTree === 'prohibited'
			&& lanePolicy.testFrameworkDependency === 'prohibited'
			&& lanePolicyHashBefore === EXPECTED_LANE_CONTAINMENT_POLICY_SHA256
			&& `experiments/extraterrestrial/${RUNNER_RELATIVE_PATH}`.startsWith(
				`${DECLARED_RUNNER_ROOT}/`,
			),
			'Solar-zenith containment policy does not authorize this runner.',
		);

		const flat32Root = path.join(REPOSITORY_ROOT, 'src', 'flat32');
		const [algorithm32Before, flat32Before] = await Promise.all([
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(flat32Root),
		]);
		const parentsBefore = await loadAndVerifyParents();
		const corpus = extractRecordedNative15Corpus(
			parentsBefore.parentJsonByRunId,
		);
		const truthCensus = float32TruthCensus(corpus.records);

		const allFitStudy = runNative15BaseGainDeltaStudy({
			trainingRecords: corpus.coreAllFit,
			evaluationCohorts: [{
				id: 'all-fit-core-proxy',
				records: corpus.coreAllFit,
			}],
			...STUDY_CONFIGURATION,
		});
		const blockedCohorts = [
			{
				id: 'blocked-training',
				records: corpus.blockedTraining,
			},
			...corpus.internalCohorts,
			...corpus.externalCohorts,
		];
		const blockedStudy = runNative15BaseGainDeltaStudy({
			trainingRecords: corpus.blockedTraining,
			evaluationCohorts: blockedCohorts,
			...STUDY_CONFIGURATION,
		});

		const determinismConfiguration = {
			trainingRecords: corpus.blockedTraining.slice(0, 128),
			evaluationCohorts: [{
				id: 'determinism-probe',
				records: corpus.internalCohorts[0].records.slice(0, 32),
			}],
			baseSizes: [16],
			sharedDeltaBaseSizes: [16],
			sharedDeltaSizes: [8],
			maxIterations: 4,
			materialFloor: STUDY_CONFIGURATION.materialFloor,
		};
		const determinismFirst = runNative15BaseGainDeltaStudy(
			determinismConfiguration,
		);
		const determinismSecond = runNative15BaseGainDeltaStudy(
			determinismConfiguration,
		);
		const determinismFirstJson = JSON.stringify(determinismFirst);
		const determinismSecondJson = JSON.stringify(determinismSecond);
		requireCondition(
			determinismFirstJson === determinismSecondJson,
			'Determinism probe changed across two independent executions.',
		);

		const memory = {
			schemaId: 'native15-base-gain-delta-memory-projections-v1',
			populations: PROJECTED_SAMPLE_COUNTS,
			rawDirectR32fBytes: Object.fromEntries(
				Object.entries(PROJECTED_SAMPLE_COUNTS).map(([id, count]) => [
					id,
					count * 15 * 4,
				]),
			),
			rawFourRgba32fBytes: Object.fromEntries(
				Object.entries(PROJECTED_SAMPLE_COUNTS).map(([id, count]) => [
					id,
					count * 16 * 4,
				]),
			),
			compactMinimumWidthDirect15: createMemoryProjections({
				sampleCounts: PROJECTED_SAMPLE_COUNTS,
				...STUDY_CONFIGURATION,
			}),
			fixedUint16Direct15: createMemoryProjections({
				sampleCounts: PROJECTED_SAMPLE_COUNTS,
				baseIndexBytes: 2,
				deltaIndexBytes: 2,
				...STUDY_CONFIGURATION,
			}),
			fixedUint16FourRgba32fDictionary: createMemoryProjections({
				sampleCounts: PROJECTED_SAMPLE_COUNTS,
				baseIndexBytes: 2,
				deltaIndexBytes: 2,
				dictionaryStoredChannelCount: 16,
				...STUDY_CONFIGURATION,
			}),
		};

		for (const cohort of [
			...allCodecCohorts(allFitStudy),
			...allCodecCohorts(blockedStudy),
		]) {
			requireCondition(
				cohort.metrics.invariants.nonfiniteScalarCount === 0,
				`${cohort.cohortId} produced nonfinite reconstructed values.`,
			);
			requireCondition(
				cohort.metrics.invariants.exactZeroViolatedCount === 0,
				`${cohort.cohortId} failed exact-zero preservation.`,
			);
		}
		requireCondition(
			corpus.census.recordCount === 3991
			&& corpus.census.coreAllFitCount === 1237
			&& corpus.census.blockedTrainingCount === 885
			&& corpus.census.internalHoldoutCount === 352
			&& corpus.census.externalCount === 2754
			&& corpus.census.exactZeroCount === 722
			&& corpus.census.exactVectorCount === 3270,
			'Frozen corpus census changed.',
		);
		requireCondition(
			countCohortRecords(corpus.internalCohorts) === 352
			&& countCohortRecords(corpus.externalCohorts) === 2754,
			'Cohort membership changed.',
		);
		requireCondition(
			allFitStudy.candidateRecords.length === 13
			&& blockedStudy.candidateRecords.length === 13
			&& blockedCohorts.length === 12,
			'Predeclared candidate or cohort count changed.',
		);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [RUNNER_RELATIVE_PATH],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process',
				'node:crypto',
				'node:fs',
				'node:fs/promises',
				'node:module',
				'node:os',
				'node:path',
				'node:url',
				'node:util',
			],
		});
		requireCondition(
			closure.files.every(
				(file) => !file.startsWith('../') && !path.isAbsolute(file),
			)
			&& closure.bareResolutions.length === 0,
			'Static module closure escaped containment or used a bare dependency.',
		);

		const [algorithm32After, flat32After] = await Promise.all([
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(flat32Root),
		]);
		assertFileInventoriesEqual(
			algorithm32Before,
			algorithm32After,
			'Algorithm32 production inventory',
		);
		assertFileInventoriesEqual(
			flat32Before,
			flat32After,
			'Flat32 production inventory',
		);
		const parentsAfter = await loadAndVerifyParents();
		requireCondition(
			JSON.stringify(parentsAfter.verifications)
				=== JSON.stringify(parentsBefore.verifications),
			'One or more immutable parents changed during the experiment.',
		);
		const [sharedPolicyHashAfter, lanePolicyHashAfter] = await Promise.all([
			sha256File(CONTAINMENT_POLICY_PATH),
			sha256File(LANE_POLICY_PATH),
		]);
		requireCondition(
			sharedPolicyHashAfter === sharedPolicyHashBefore
			&& lanePolicyHashAfter === lanePolicyHashBefore,
			'Containment policy changed during the experiment.',
		);

		const sourceFiles = [
			RUNNER_RELATIVE_PATH,
			CODEC_RELATIVE_PATH,
			CORPUS_RELATIVE_PATH,
		];
		const sourceRecords = [];
		for (const relativePath of sourceFiles) {
			sourceRecords.push({
				path: `experiments/extraterrestrial/${relativePath}`,
				sha256: await sha256File(path.join(EXPERIMENT_ROOT, relativePath)),
			});
		}
		const sourceIdentity = {
			schemaId: 'native15-base-gain-delta-source-identities-v1',
			runId: run.runId,
			implementation: sourceRecords,
			parents: parentsAfter.records,
			containmentPolicies: {
				shared: {
					path: 'experiments/extraterrestrial/containment-policy.json',
					sha256: sharedPolicyHashAfter,
					policyId: sharedPolicy.policyId,
				},
				lane: {
					path:
						`experiments/extraterrestrial/${LANE_POLICY_RELATIVE_PATH}`,
					sha256: lanePolicyHashAfter,
					policyId: lanePolicy.policyId,
				},
			},
			productionInventories: {
				algorithm32: {
					fileCount: algorithm32After.fileCount,
					totalBytes: algorithm32After.totalBytes,
					aggregateSha256: algorithm32After.aggregateSha256,
				},
				flat32: {
					fileCount: flat32After.fileCount,
					totalBytes: flat32After.totalBytes,
					aggregateSha256: flat32After.aggregateSha256,
				},
			},
			staticClosure: {
				schemaId: closure.schemaId,
				entries: closure.entries,
				fileCount: closure.files.length,
				edgeCount: closure.edges.length,
				nodeBuiltins: closure.nodeBuiltins,
				bareResolutions: closure.bareResolutions,
			},
		};

		const corpusEvidence = {
			schemaId: 'native15-base-gain-delta-corpus-census-v1',
			runId: run.runId,
			basis: corpus.basis,
			census: corpus.census,
			float32Truth: truthCensus,
			fitAndHoldout: {
				coreAllFitCount: corpus.coreAllFit.length,
				blockedTrainingCount: corpus.blockedTraining.length,
				internalCohorts: corpus.internalCohorts.map((cohort) => ({
					id: cohort.id,
					recordCount: cohort.records.length,
					semanticLabel: cohort.semanticLabel,
				})),
				externalCohorts: corpus.externalCohorts.map((cohort) => ({
					id: cohort.id,
					recordCount: cohort.records.length,
					semanticLabel: cohort.semanticLabel,
				})),
			},
			limitations: [
				'These are downstream path-integrated spectra rather than raw successor-cache density values.',
				'Run 494 is a paired perturbation of run 493, not independent geometry.',
				'Run 471 pure-order records and run 497 direct J1 retain separate semantic cohorts.',
				'Only run-471 N1 contributes exact-zero duplicates; there are no cross-run exact duplicate spectra.',
			],
		};
		const rateDistortion = {
			schemaId: 'native15-base-gain-delta-rate-distortion-v1',
			runId: run.runId,
			qualityGate: null,
			qualityGatePolicy:
				'No quality threshold was selected; every predeclared candidate is retained.',
			allFitCoreProxy: allFitStudy,
			blockedHeldoutTransfer: blockedStudy,
			cryptographicContentSha256: sha256(JSON.stringify({
				allFitStudy,
				blockedStudy,
			})),
		};
		const derivation = {
			schemaId: 'native15-base-gain-delta-derivation-v1',
			runId: run.runId,
			parents: PARENTS.map((parent) => ({
				runId: parent.runId,
				artifactSetSha256: parent.artifactSetSha256,
				consumedArtifact: {
					path: parent.artifactRelativePath,
					sha256: parent.artifactSha256,
				},
				role: parent.role,
			})),
			operation:
				'R32F truth conversion; deterministic normalized-shape dictionary fit; per-sample least-squares gain; optional fixed-base shared relative delta or direct quantized residual; Float32 endpoint decode; separate cohort error measurement; exact byte projection',
			implementation: sourceRecords,
			materialParameters: STUDY_CONFIGURATION,
			outputs: [
				'native15-base-gain-delta-corpus-census-v1',
				'native15-base-gain-delta-rate-distortion-v1',
				'native15-base-gain-delta-memory-projections-v1',
				'native15-base-gain-delta-proof-v1',
			],
			resultIdentity:
				`${run.runId}:${rateDistortion.cryptographicContentSha256}`,
		};
		const assertions = [
			'All five immutable parents remained accepted and byte-identical before and after the experiment.',
			'The canonical extraction yielded exactly 3,991 labeled Native15 records, 3,270 exact vectors, and 722 exact-zero N1 records.',
			'The blocked split retained 885 training, 352 internal held-out, and 2,754 external records without random-neighbor leakage.',
			'Every spectrum was finite and nonnegative before Float32 conversion.',
			'Every predeclared base, shared-delta, int8, and int16 candidate was evaluated and retained without a quality gate.',
			'Every decoder result was finite and every exact-zero input was reconstructed as exact zero.',
			'Two independent deterministic probe executions produced byte-identical JSON results.',
			'Logical compact-ID, fixed-uint16, and four-RGBA-padded dictionary memory ledgers were calculated separately.',
			'Algorithm32 and Flat32 production inventories remained byte-identical.',
			'The static module closure remained contained and used no bare runtime dependency.',
		];
		const proof = {
			proofId: 'native15-base-gain-delta-proof-v1',
			accepted: true,
			claimBoundary:
				'accepted deterministic rough proxy experiment only; no representation selection or cache qualification',
			assertions,
			determinism: {
				firstSha256: sha256(determinismFirstJson),
				secondSha256: sha256(determinismSecondJson),
				byteIdentical: true,
			},
			corpus: corpus.census,
			candidateCounts: {
				allFit: allFitStudy.candidateRecords.length,
				blockedHeldout: blockedStudy.candidateRecords.length,
				blockedCohorts: blockedCohorts.length,
			},
			qualityOutcome:
				'informational; inspect rate-distortion evidence, no pass/fail threshold exists',
			limitations: corpusEvidence.limitations,
		};

		await run.writeJsonArtifact('evidence/corpus-census.json', corpusEvidence);
		await run.writeJsonArtifact('evidence/rate-distortion.json', rateDistortion);
		await run.writeArtifact(
			'evidence/candidate-summary.csv',
			candidateSummaryCsv(allFitStudy, blockedStudy),
		);
		await run.writeJsonArtifact('evidence/memory-projections.json', memory);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentity);
		await run.writeJsonArtifact('evidence/derivation.json', derivation);
		await run.writeJsonArtifact('evidence/proof.json', proof);

		const terminalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: proof.proofId,
				accepted: true,
				claimBoundary: proof.claimBoundary,
				corpus: corpus.census,
				candidateCounts: proof.candidateCounts,
				rateDistortionSha256:
					rateDistortion.cryptographicContentSha256,
			},
			report: report(
				run.runId,
				corpusEvidence,
				allFitStudy,
				blockedStudy,
				memory,
			),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: terminalManifest.artifactSetSha256,
			rateDistortionSha256: rateDistortion.cryptographicContentSha256,
			corpus: corpus.census,
		}, null, 2)}\n`);
	} catch (error) {
		const serialized = {
			name: error instanceof Error ? error.name : 'Error',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		};
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const terminalManifest = await run.finalize({
				conclusion: 'failed',
				result: {
					proofId: 'native15-base-gain-delta-proof-v1',
					accepted: false,
					error: serialized,
				},
				report: `# ${run.runId}: Native15 base/gain/delta rough study\n\n`
					+ `Conclusion: **failed**.\n\n${serialized.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: terminalManifest.artifactSetSha256,
				error: serialized,
			}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'partial-unfinalized',
				error: serialized,
				finalizationError:
					finalizationError instanceof Error
						? finalizationError.message
						: String(finalizationError),
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	}
}

await main();
