/**
 * Frozen extraction of the recorded Native15 path-radiance proxy corpus.
 * The returned records retain their distinct physical semantics; this is not
 * a claim that they form one cache population.
 */

export const NATIVE15_BASIS_ID =
	'algorithm32-native-15-spectral-basis-v1';
export const NATIVE15_BASIS_CONTENT_HASH =
	'sha256:a03a3c7f45d9bd4ff8adf6482e9d1aac1acd72423758ecf797ac24f6dffba891';
export const NATIVE15_CHANNEL_COUNT = 15;
export const NATIVE15_WAVELENGTHS_NANOMETERS = Object.freeze([
	375.6666666666667,
	407,
	438.3333333333333,
	469.6666666666667,
	501,
	532.3333333333334,
	563.6666666666666,
	595,
	626.3333333333334,
	657.6666666666666,
	689,
	720.3333333333334,
	751.6666666666666,
	783,
	814.3333333333334,
]);
export const NATIVE15_PATH_RADIANCE_QUANTITY =
	'spectral-radiance-density';
export const NATIVE15_PATH_RADIANCE_UNITS =
	'W m^-2 sr^-1 nm^-1';
export const NATIVE15_BASIS = Object.freeze({
	id: NATIVE15_BASIS_ID,
	contentHash: NATIVE15_BASIS_CONTENT_HASH,
	channelCount: NATIVE15_CHANNEL_COUNT,
	wavelengthsNanometers: NATIVE15_WAVELENGTHS_NANOMETERS,
	quantity: NATIVE15_PATH_RADIANCE_QUANTITY,
	units: NATIVE15_PATH_RADIANCE_UNITS,
});

export const RECORDED_NATIVE15_PARENT_RUN_IDS = Object.freeze({
	stage1Ledger: '000258-spectral-color-stage1-ledger',
	reflectionControl:
		'000471-san-jose-plus-one-hour-fibonacci-reflection-control',
	nauticalW39:
		'000493-san-jose-nautical-twilight-ozone-f68-w39-preview',
	nauticalCameraPatch:
		'000494-san-jose-nautical-twilight-ozone-f68-camera-patch-preview',
	actualPointJ1:
		'000497-san-jose-nautical-twilight-actual-point-j1-control',
});

const RUN258_HOLDOUT_CONDITIONS = new Set([
	'noon-plus-30',
	'sunset',
	'sunset-plus-10',
	'sunset-plus-120',
]);
const RUN493_HOLDOUT_ELEVATIONS = new Set([0, 5, 20, 75]);
const RUN493_HOLDOUT_OFFSETS = new Set([-50, 0, 50]);

function requireCondition(value, message) {
	if (!value) {
		throw new Error(message);
	}
}

function assertBasis(value, label) {
	requireCondition(
		value?.id === NATIVE15_BASIS_ID
		&& value?.contentHash === NATIVE15_BASIS_CONTENT_HASH
		&& value?.channelCount === NATIVE15_CHANNEL_COUNT,
		`${label} Native15 identity differs from the frozen corpus.`,
	);
}

function validatedValues(value, id) {
	requireCondition(
		Array.isArray(value) && value.length === NATIVE15_CHANNEL_COUNT,
		`${id} does not contain one Native15 spectrum.`,
	);
	for (let channel = 0; channel < value.length; channel += 1) {
		requireCondition(
			Number.isFinite(value[channel]) && value[channel] >= 0,
			`${id} channel ${channel} is not finite and nonnegative.`,
		);
	}
	return [...value];
}

function createRecord({
	runId,
	localId,
	values,
	semantic,
	configuration,
	groupId,
	metadata,
}) {
	const id = `${runId}/${localId}`;
	return Object.freeze({
		id,
		values: Object.freeze(validatedValues(values, id)),
		runId,
		semantic,
		configuration,
		groupId,
		metadata: Object.freeze({...metadata}),
	});
}

function extractRun258(document) {
	const runId = RECORDED_NATIVE15_PARENT_RUN_IDS.stage1Ledger;
	assertBasis(document?.spectralBasis, runId);
	requireCondition(
		document?.radianceQuantity === NATIVE15_PATH_RADIANCE_QUANTITY
		&& document?.radianceUnits === NATIVE15_PATH_RADIANCE_UNITS,
		`${runId} path-radiance quantity or units changed.`,
	);
	requireCondition(
		Array.isArray(document?.spherical?.conditions),
		`${runId} spherical conditions are missing.`,
	);
	const records = [];
	for (const condition of document.spherical.conditions) {
		for (const container of ['samples', 'hemisphere']) {
			for (const sample of condition[container] ?? []) {
				if (!Array.isArray(sample.pathRadiance)) {
					continue;
				}
				records.push(createRecord({
					runId,
					localId: `${condition.id}/${container}/${sample.id}`,
					values: sample.pathRadiance,
					semantic: 'spherical cumulative path radiance',
					configuration: 'stage1 distant-Sun multi-state ledger',
					groupId: condition.id,
					metadata: {
						conditionId: condition.id,
						series: condition.series,
						offsetMinutes: condition.offsetMinutes,
						timeIso: condition.timeIso,
						solarElevationRadians: condition.solarElevationRadians,
						container,
						role: sample.role,
						directionModel: sample.directionModel,
					},
				}));
			}
		}
	}
	requireCondition(records.length === 652, `${runId} must yield 652 spectra.`);
	return records;
}

function extractGridRun(document, runId, configuration) {
	assertBasis(document?.spectralBasis, runId);
	requireCondition(
		Array.isArray(document?.samples) && document.samples.length === 585,
		`${runId} must contain the frozen 585-sample grid.`,
	);
	return document.samples.map((sample) => createRecord({
		runId,
		localId: sample.id,
		values: sample.pathRadiance,
		semantic: 'nautical-twilight cumulative N4 path radiance',
		configuration,
		groupId: `elevation-${sample.elevationDegrees}`,
		metadata: {
			index: sample.index,
			sourceAzimuthOffsetDegrees: sample.sourceAzimuthOffsetDegrees,
			elevationDegrees: sample.elevationDegrees,
			outgoingReconstructionKind: sample.outgoingReconstruction?.kind ?? null,
		},
	}));
}

function extractRun471(document) {
	const runId = RECORDED_NATIVE15_PARENT_RUN_IDS.reflectionControl;
	requireCondition(
		Array.isArray(document?.result?.conditions)
		&& document.result.conditions.length === 6,
		`${runId} must contain six order/quadrature conditions.`,
	);
	const records = [];
	for (const condition of document.result.conditions) {
		requireCondition(
			Array.isArray(condition.samples) && condition.samples.length === 361,
			`${runId}/${condition.id} must contain 361 samples.`,
		);
		for (const sample of condition.samples) {
			records.push(createRecord({
				runId,
				localId: `${condition.id}/${sample.index}`,
				values: sample.pathRadiance,
				semantic: 'order-separated nautical horizon path radiance',
				configuration:
					`${condition.quadratureId}/N${condition.maximumScatteringOrder}`,
				groupId: condition.id,
				metadata: {
					conditionId: condition.id,
					quadratureId: condition.quadratureId,
					maximumScatteringOrder: condition.maximumScatteringOrder,
					index: sample.index,
					offsetDegrees: sample.offsetDegrees,
				},
			}));
		}
	}
	requireCondition(records.length === 2166, `${runId} must yield 2166 spectra.`);
	return records;
}

function extractRun497(document) {
	const runId = RECORDED_NATIVE15_PARENT_RUN_IDS.actualPointJ1;
	assertBasis(document?.configuration?.spectralBasis, runId);
	const convergence = document?.convergence?.[2];
	assertBasis(convergence?.spectralBasis, `${runId} convergence[2]`);
	requireCondition(
		convergence?.viewIntervalCount === 320
		&& convergence?.sourceIntervalCount === 320
		&& Array.isArray(convergence?.samples)
		&& convergence.samples.length === 3,
		`${runId} converged actual-point control changed.`,
	);
	return convergence.samples.map((sample) => createRecord({
		runId,
		localId: `view320-source320/${sample.id}`,
		values: sample.pathRadiance,
		semantic: 'actual-point direct first-order path radiance',
		configuration: 'binary64 view320/source320 no-cache J1 oracle',
		groupId: 'actual-point-j1-320x320',
		metadata: {
			sourceAzimuthOffsetDegrees: sample.sourceAzimuthOffsetDegrees,
			elevationDegrees: sample.elevationDegrees,
			viewIntervalCount: 320,
			sourceIntervalCount: 320,
		},
	}));
}

function cohort(id, records, semanticLabel) {
	return Object.freeze({
		id,
		records: Object.freeze([...records].sort((left, right) =>
			left.id.localeCompare(right.id, 'en'))),
		semanticLabel,
	});
}

function exactZero(record) {
	return record.values.every((value) => value === 0);
}

/**
 * Extract and split the five immutable proxy data sources.
 *
 * @param {Record<string, object> | Map<string, object>} parentJsonByRunId
 * @returns {object}
 */
export function extractRecordedNative15Corpus(parentJsonByRunId) {
	const get = (runId) => parentJsonByRunId instanceof Map
		? parentJsonByRunId.get(runId)
		: parentJsonByRunId[runId];
	for (const runId of Object.values(RECORDED_NATIVE15_PARENT_RUN_IDS)) {
		requireCondition(get(runId), `Missing immutable parent JSON: ${runId}.`);
	}

	const run258 = extractRun258(get(RECORDED_NATIVE15_PARENT_RUN_IDS.stage1Ledger));
	const run471 = extractRun471(
		get(RECORDED_NATIVE15_PARENT_RUN_IDS.reflectionControl),
	);
	const run493 = extractGridRun(
		get(RECORDED_NATIVE15_PARENT_RUN_IDS.nauticalW39),
		RECORDED_NATIVE15_PARENT_RUN_IDS.nauticalW39,
		'300-DU ozone/F68/W39/N4',
	);
	const run494 = extractGridRun(
		get(RECORDED_NATIVE15_PARENT_RUN_IDS.nauticalCameraPatch),
		RECORDED_NATIVE15_PARENT_RUN_IDS.nauticalCameraPatch,
		'300-DU ozone/F68/W39 plus camera-facing W77 patch/N4',
	);
	const run497 = extractRun497(
		get(RECORDED_NATIVE15_PARENT_RUN_IDS.actualPointJ1),
	);

	const run258Training = run258.filter(
		(record) => !RUN258_HOLDOUT_CONDITIONS.has(record.metadata.conditionId),
	);
	const run258Holdout = run258.filter(
		(record) => RUN258_HOLDOUT_CONDITIONS.has(record.metadata.conditionId),
	);
	const run493Training = run493.filter((record) =>
		!RUN493_HOLDOUT_ELEVATIONS.has(record.metadata.elevationDegrees)
		&& !RUN493_HOLDOUT_OFFSETS.has(
			record.metadata.sourceAzimuthOffsetDegrees,
		));
	const run493Holdout = run493.filter(
		(record) => !run493Training.includes(record),
	);

	const coreAllFit = [...run258, ...run493].sort(
		(left, right) => left.id.localeCompare(right.id, 'en'),
	);
	const blockedTraining = [...run258Training, ...run493Training].sort(
		(left, right) => left.id.localeCompare(right.id, 'en'),
	);
	const internalCohorts = [
		cohort(
			'internal-run258-held-sun-states',
			run258Holdout,
			'whole held-out distant-Sun conditions',
		),
		cohort(
			'internal-run493-held-grid-blocks',
			run493Holdout,
			'whole elevation rows and source-offset columns',
		),
	];
	const externalCohorts = [
		cohort(
			'external-run494-camera-patch',
			run494.filter(
				(record) => record.metadata.outgoingReconstructionKind === 'camera-patch',
			),
			'paired W77-density camera-facing outgoing reconstruction',
		),
		cohort(
			'external-run494-w39-fallback',
			run494.filter(
				(record) => record.metadata.outgoingReconstructionKind === 'w39-fallback',
			),
			'paired W39 fallback outside the camera patch',
		),
		...documentConditionsToCohorts(run471),
		cohort(
			'external-run497-actual-point-j1',
			run497,
			'converged binary64 actual-point direct J1',
		),
	];
	const records = [...run258, ...run471, ...run493, ...run494, ...run497]
		.sort((left, right) => left.id.localeCompare(right.id, 'en'));
	const internalHoldoutCount = internalCohorts.reduce(
		(sum, item) => sum + item.records.length,
		0,
	);
	const externalCount = externalCohorts.reduce(
		(sum, item) => sum + item.records.length,
		0,
	);
	const exactVectorCount = new Set(
		records.map((record) => JSON.stringify(record.values)),
	).size;
	const exactZeroCount = records.filter(exactZero).length;
	const byRunId = Object.fromEntries(
		Object.values(RECORDED_NATIVE15_PARENT_RUN_IDS).map((runId) => [
			runId,
			records.filter((record) => record.runId === runId).length,
		]),
	);

	requireCondition(run258Training.length === 489, 'Run 258 training count changed.');
	requireCondition(run258Holdout.length === 163, 'Run 258 holdout count changed.');
	requireCondition(run493Training.length === 396, 'Run 493 training count changed.');
	requireCondition(run493Holdout.length === 189, 'Run 493 holdout count changed.');
	requireCondition(coreAllFit.length === 1237, 'Core all-fit count changed.');
	requireCondition(blockedTraining.length === 885, 'Blocked training count changed.');
	requireCondition(internalHoldoutCount === 352, 'Internal holdout count changed.');
	requireCondition(externalCount === 2754, 'External holdout count changed.');
	requireCondition(records.length === 3991, 'Complete corpus count changed.');
	requireCondition(exactZeroCount === 722, 'Exact-zero count changed.');
	requireCondition(exactVectorCount === 3270, 'Exact-vector census changed.');

	return Object.freeze({
		schemaId: 'recorded-native15-path-radiance-proxy-corpus-v1',
		basis: NATIVE15_BASIS,
		census: Object.freeze({
			recordCount: records.length,
			scalarCount: records.length * NATIVE15_CHANNEL_COUNT,
			coreAllFitCount: coreAllFit.length,
			blockedTrainingCount: blockedTraining.length,
			internalHoldoutCount,
			externalCount,
			exactZeroCount,
			exactVectorCount,
			exactDuplicateCount: records.length - exactVectorCount,
			byRunId: Object.freeze(byRunId),
		}),
		records: Object.freeze(records),
		coreAllFit: Object.freeze(coreAllFit),
		blockedTraining: Object.freeze(blockedTraining),
		internalCohorts: Object.freeze(internalCohorts),
		externalCohorts: Object.freeze(externalCohorts),
	});
}

function documentConditionsToCohorts(records) {
	const groups = new Map();
	for (const record of records) {
		if (!groups.has(record.groupId)) {
			groups.set(record.groupId, []);
		}
		groups.get(record.groupId).push(record);
	}
	return [...groups.entries()]
		.sort(([left], [right]) => left.localeCompare(right, 'en'))
		.map(([conditionId, conditionRecords]) => cohort(
			`external-run471-${conditionId}`,
			conditionRecords,
			`complete order/quadrature condition ${conditionId}`,
		));
}
