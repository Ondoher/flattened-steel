import assert from 'node:assert/strict';
import {existsSync, lstatSync, readdirSync} from 'node:fs';
import {
	createRun,
	identity,
	outputRelative,
	readRepository,
	resolveRepository,
	storage,
	verifyRun,
} from './io/files.mjs';
import {inputRun} from './inputs.mjs';
import {extractBoundary, loadSpectra} from './processing.mjs';
import {
	ALL_CHANNELS,
	ALL_RAYS,
	CAPTURE_TIMES,
	RADIANCE_UNITS,
	SCREEN_SELECTION,
	SCORE_CHANNELS,
	parseBoundaryTsv,
	selectBoundary,
} from './analysis/boundary.mjs';
import {scoreBoundary, scoreDeltaIdentity} from './analysis/metrics.mjs';
import {predictionDigest} from './analysis/predictions.mjs';
import {renderScientificSvg} from './analysis/reports.mjs';

const artifactBudget = 4 * 1024 ** 2;

/** Snapshot exact terminal identities before allocating the new summary run. @returns {DialSummaryDiscoveredRun[]} */
function discoverRuns() {
	const root = `${outputRelative}/runs`;
	return readdirSync(resolveRepository(root))
		.sort()
		.map((name) => {
			assert.match(name, /^\d{5}-[a-z0-9]+(?:-[a-z0-9]+)*$/u);
			assert.ok(name.length <= 22);
			const path = `${root}/${name}`;
			assert.ok(lstatSync(resolveRepository(path, root)).isDirectory());
			const sealPath = `${path}/sealed.json`;
			if (!existsSync(resolveRepository(sealPath, root, false))) return {path, seal: null, identity: null};
			const bytes = readRepository(sealPath);
			const seal = /** @type {DialSummarySourceSeal} */ (JSON.parse(bytes.toString()));
			assert.equal(seal.run, path);
			return {path, seal, identity: identity(sealPath, bytes)};
		});
}

/** Read only a file explicitly included in the exact discovered seal. @param {DialSummaryDiscoveredRun} source @param {string} name @returns {Buffer} */
function artifactBytes(source, name) {
	const path = `${source.path}/${name}`;
	const artifact = source.seal?.artifacts.find((item) => item.path === path);
	assert.ok(artifact, `Missing sealed artifact ${path}`);
	return readRepository(path, artifact);
}

/** Check for an authenticated artifact without inferring from a filename elsewhere. @param {DialSummaryDiscoveredRun} source @param {string} name @returns {boolean} */
function hasArtifact(source, name) {
	return !!source.seal?.artifacts.some((artifact) => artifact.path === `${source.path}/${name}`);
}

/** Exact bytes of all files covered by a terminal source seal. @param {DialSummaryDiscoveredRun} source @returns {number} */
function retainedBytes(source) {
	assert.ok(source.seal && source.identity);
	return source.identity.byteLength + source.seal.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0);
}

/** Exact identity of a required artifact from an authenticated source seal. @param {DialSummaryDiscoveredRun} source @param {string} name @returns {DialFileIdentity} */
function artifactIdentity(source, name) {
	const artifact = source.seal.artifacts.find((item) => item.path === `${source.path}/${name}`);
	assert.ok(artifact, `Missing sealed artifact ${source.path}/${name}`);
	return {path: artifact.path, byteLength: artifact.byteLength, sha256: artifact.sha256};
}

/** Bound harmless binary64 aggregation-order differences while rejecting nonfinite arithmetic. @param {number} actual @param {number} expected @returns {number} */
function checkArithmetic(actual, expected) {
	assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
	const difference = Math.abs(actual - expected);
	assert.ok(
		difference <= 1e-12 * Math.max(1, Math.abs(expected)),
		`Summary arithmetic mismatch: ${actual} versus ${expected}.`,
	);
	return difference;
}

/** Admit the separate N6 score schema directly; this never decodes the six-order spectral layout as N4. @param {DialSummaryDiscoveredRun} source @param {number} index @returns {DialSummaryOrderDiagnostic} */
function orderDiagnostic(source, index) {
	assert.equal(source.seal.state, 'accepted');
	const control = /** @type {DialOrdersControl} */ (JSON.parse(artifactBytes(source, 'control.json').toString()));
	const scores = /** @type {DialSummaryOrderScoreDocument} */ (
		JSON.parse(artifactBytes(source, 'scores.json').toString())
	);
	const parity = /** @type {DialSummaryOrderParity} */ (
		JSON.parse(artifactBytes(source, 'parity-analysis.json').toString())
	);
	assert.equal(control.executionSchemaId, 'sky-six-order-control-v1');
	assert.deepEqual(control.actualOrders, [1, 2, 3, 4, 5, 6]);
	assert.deepEqual(source.seal.result.actualOrders, control.actualOrders);
	assert.equal(source.seal.result.prefixParityPassed, true);
	assert.equal(scores.schemaId, 'sky-six-order-scores-v1');
	assert.equal(scores.units, RADIANCE_UNITS);
	assert.deepEqual(scores.channels, [0, 8]);
	assert.deepEqual(control.channels, scores.channels);
	assert.equal(scores.fullRegisteredBoundary, false);
	assert.equal(scores.scope, 'Two-channel numerical diagnostic; not the full registered B1 score.');
	assert.equal(parity.schemaId, 'sky-six-order-prefix-parity-v1');
	assert.equal(parity.passed, true);
	assert.deepEqual(
		parity.channels.map((channel) => channel.channel),
		scores.channels,
	);
	assert.ok(parity.channels.every((channel) => channel.passed));
	assert.deepEqual(verifyRun(parity.parentRun), parity.parentSeal);
	assert.ok(['screen', 'all-times'].includes(source.seal.result.selection));
	const times = control.scenes.map((scene) => scene.time);
	assert.deepEqual(times, source.seal.result.selection === 'all-times' ? CAPTURE_TIMES : SCREEN_SELECTION.times);
	assert.ok(
		control.controls.representations.length > 0 &&
			new Set(control.controls.representations).size === control.controls.representations.length,
	);
	assert.equal(control.controls.viewIntervals.length, 1);
	assert.equal(control.controls.solarInterpolations.length, 1);
	assert.ok(['quadratic', 'altitude-segmented'].includes(control.controls.viewRule));
	const expectedKeys = control.controls.representations.flatMap((representation) =>
		control.actualOrders.map((order) => `${representation}/${order}`),
	);
	assert.deepEqual(scores.rows.map((row) => `${row.representation}/${row.order}`).sort(), [...expectedKeys].sort());
	for (const row of scores.rows) {
		const score = row.score;
		assert.deepEqual(score.selection, {times, rayIndices: ALL_RAYS, channels: [0, 8]});
		assert.equal(score.fullRegisteredBoundary, false);
		assert.deepEqual(
			score.conditions.map((condition) => condition.time),
			times,
		);
		for (const condition of score.conditions) {
			assert.equal(condition.sampleCount, 81 * 2);
			assert.ok(Number.isFinite(condition.squaredError) && condition.squaredError >= 0);
			checkArithmetic(condition.rmseW, Math.sqrt(condition.squaredError / condition.sampleCount));
			checkArithmetic(condition.rmseMilliwatt, condition.rmseW * 1000);
		}
		assert.equal(score.sampleCount, times.length * 81 * 2);
		checkArithmetic(
			score.squaredError,
			score.conditions.reduce((sum, condition) => sum + condition.squaredError, 0),
		);
		checkArithmetic(
			score.aggregateRmseMilliwatt,
			Math.sqrt(score.conditions.reduce((sum, condition) => sum + condition.rmseW ** 2, 0) / times.length) * 1000,
		);
		checkArithmetic(score.pooledRmseMilliwatt, Math.sqrt(score.squaredError / score.sampleCount) * 1000);
	}
	return {
		index,
		run: source.path,
		seal: source.identity,
		scoreArtifact: artifactIdentity(source, 'scores.json'),
		controlArtifact: artifactIdentity(source, 'control.json'),
		parityArtifact: artifactIdentity(source, 'parity-analysis.json'),
		caseId: source.seal.result.caseId,
		selection: /** @type {SkySixSelection} */ (source.seal.result.selection),
		actualOrders: [...control.actualOrders],
		channels: [...scores.channels],
		times,
		representations: [...control.controls.representations],
		radianceUnits: scores.units,
		fullRegisteredBoundary: false,
		scope: scores.scope,
		viewRule: control.controls.viewRule,
		viewCount: control.controls.viewIntervals[0],
		solar: control.controls.solarInterpolations[0],
		rows: scores.rows
			.filter((row) => row.order >= 4)
			.map((row) => ({
				representation: row.representation,
				order: row.order,
				aggregateRmseMilliwatt: row.score.aggregateRmseMilliwatt,
				conditions: row.score.conditions,
			})),
	};
}

/** Read an already sealed historical Direct40 table. @param {DialSummaryDiscoveredRun} inputs @param {string} name @param {string} configId @param {string} [modelId] @returns {DialAnalysisBoundary} */
function historicalBoundary(inputs, name, configId, modelId) {
	const bytes = artifactBytes(inputs, name);
	return parseBoundaryTsv(bytes.toString(), {
		configId,
		...(modelId ? {modelId} : {}),
		sourceIdentity: identity(`${inputs.path}/${name}`, bytes),
	});
}

/** Derive exact point and time summaries relative to the same selected historical N4/Q30 boundary. @param {DialAnalysisBoundary} model @param {DialAnalysisBoundary} baseline @param {DialAnalysisBoundary} measured @param {DialBoundaryScore} score @param {DialBoundaryScore} baselineScore @param {number} order @returns {DialSummaryCondition[]} */
function conditionChanges(model, baseline, measured, score, baselineScore, order) {
	return score.conditions.map((condition, timeIndex) => {
		let mean = 0,
			squares = 0;
		/** @type {DialSummaryPointChange|null} */
		let strongest = null;
		if (order === 4)
			for (let ray = 0; ray < 81; ray++) {
				let beforeError = 0,
					afterError = 0;
				for (let channel = 0; channel < model.channels.length; channel++) {
					const index = (timeIndex * 81 + ray) * model.channels.length + channel;
					const change = model.values[index] - baseline.values[index];
					mean += change;
					squares += change * change;
					beforeError += (baseline.values[index] - measured.values[index]) ** 2;
					afterError += (model.values[index] - measured.values[index]) ** 2;
				}
				const baselineRmseMilliwatt = Math.sqrt(beforeError / model.channels.length) * 1000;
				const candidateRmseMilliwatt = Math.sqrt(afterError / model.channels.length) * 1000;
				const point = {
					gridX: ray % 9,
					gridY: Math.floor(ray / 9),
					baselineRmseMilliwatt,
					candidateRmseMilliwatt,
					changeMilliwatt: candidateRmseMilliwatt - baselineRmseMilliwatt,
				};
				if (!strongest || Math.abs(point.changeMilliwatt) > Math.abs(strongest.changeMilliwatt))
					strongest = point;
			}
		return {
			time: condition.time,
			sampleCount: condition.sampleCount,
			rmseMilliwatt: condition.rmseMilliwatt,
			baselineRmseMilliwatt: baselineScore.conditions[timeIndex].rmseMilliwatt,
			changeMilliwatt: condition.rmseMilliwatt - baselineScore.conditions[timeIndex].rmseMilliwatt,
			meanSpectralChangeMilliwatt: order === 4 ? (mean / condition.sampleCount) * 1000 : null,
			rmsSpectralChangeMilliwatt: order === 4 ? Math.sqrt(squares / condition.sampleCount) * 1000 : null,
			strongestPointChange: strongest,
		};
	});
}

/** Check one locked prediction's Kider score forecast against an explicitly citing later target; do not fit outcomes. @param {DialSummaryDiscoveredRun} registration @param {DialSpectralPrediction} prediction @param {DialPredictionSelector} selector @param {DialSummaryDiscoveredRun} target @param {DialAnalysisBoundary} measured @returns {DialSummaryPredictionTarget} */
function forecastTarget(registration, prediction, selector, target, measured) {
	assert.equal(registration.seal.state, 'accepted');
	assert.equal(prediction.unseenMeasurementData, false);
	assert.equal(prediction.schema, 'sky-accuracy-dials/spectral-prediction/v1');
	const digest = predictionDigest(prediction);
	assert.equal(digest, registration.seal.result.predictionSha256);
	assert.equal(artifactBytes(registration, 'prediction-digest.txt').toString(), digest);
	assert.ok(
		target.seal.recipe.parents.some(
			(parent) =>
				parent.path === registration.identity.path &&
				parent.sha256 === registration.identity.sha256 &&
				parent.byteLength === registration.identity.byteLength,
		),
	);
	const started = JSON.parse(artifactBytes(target, 'progress.jsonl').toString().split('\n')[0]).timestamp;
	assert.ok(Number.isFinite(Date.parse(started)) && Date.parse(registration.seal.finishedAt) < Date.parse(started));
	const control = extractBoundary(
		loadSpectra(selector.controlRun),
		selector.representation,
		selector.controlQ,
		selector.solar,
		selector.order,
	);
	const actual = extractBoundary(
		loadSpectra(target.path),
		selector.representation,
		selector.targetQ,
		selector.solar,
		selector.order,
	);
	assert.equal(actual.configId, prediction.targetConfigId);
	assert.equal(control.configId, prediction.baselineConfigId);
	assert.deepEqual(control.sourceIdentity, prediction.baselineIdentity);
	for (const parent of prediction.development)
		assert.notEqual(
			parent.artifact.path,
			target.identity.path,
			'A locked forecast cannot consume its own target run.',
		);
	const predictionControl = selectBoundary(control, prediction);
	assert.equal(prediction.delta.length, predictionControl.values.length);
	assert.ok(prediction.delta.every(Number.isFinite));
	const predictedValues = Float64Array.from(
		predictionControl.values,
		(value, index) => value + prediction.delta[index],
	);
	assert.ok(
		predictedValues.every((value) => Number.isFinite(value) && value >= 0),
		'Forecast produced invalid physical radiance; retain a failed summary instead of clipping.',
	);
	/** @type {DialAnalysisBoundary} */
	const forecast = {
		...predictionControl,
		configId: `${prediction.targetConfigId}/locked-forecast`,
		sourceIdentity: registration.identity,
		values: predictedValues,
	};
	const scoreChannels = prediction.channels.filter((channel) => channel <= 30);
	assert.ok(scoreChannels.length && prediction.times.every((time) => actual.times.includes(time)));
	const selection = {times: prediction.times, channels: scoreChannels, rayIndices: prediction.rayIndices};
	const predictedScore = scoreBoundary(forecast, measured, scoreChannels);
	const actualScore = scoreBoundary(selectBoundary(actual, selection), measured, scoreChannels);
	const allActualScore = scoreBoundary(
		selectBoundary(actual, {...selection, times: actual.times}),
		measured,
		scoreChannels,
	);
	const conditions = allActualScore.conditions.map((condition) => {
		const index = prediction.times.indexOf(condition.time);
		if (index < 0)
			return {
				time: condition.time,
				predicted: false,
				actualRmseMilliwatt: condition.rmseMilliwatt,
				predictedRmseMilliwatt: null,
				forecastErrorMilliwatt: null,
				scoreIdentityResidual: null,
			};
		const scope = {...selection, times: [condition.time]};
		const before = selectBoundary(control, scope),
			reference = selectBoundary(measured, scope);
		/** @type {DialAnalysisBoundary} */
		const delta = {
			...selectBoundary(forecast, scope),
			quantity: 'delta',
			values: Float64Array.from(
				selectBoundary(forecast, scope).values,
				(value, position) => value - before.values[position],
			),
		};
		const expansion = scoreDeltaIdentity(before, reference, delta);
		assert.ok(
			Math.abs(expansion.identityResidual) <=
				1e-10 * Math.max(1, Math.abs(expansion.predictedSquaredErrorChange)),
		);
		return {
			time: condition.time,
			predicted: true,
			actualRmseMilliwatt: actualScore.conditions[index].rmseMilliwatt,
			predictedRmseMilliwatt: predictedScore.conditions[index].rmseMilliwatt,
			forecastErrorMilliwatt:
				predictedScore.conditions[index].rmseMilliwatt - actualScore.conditions[index].rmseMilliwatt,
			scoreIdentityResidual: expansion.identityResidual,
		};
	});
	return {
		targetRun: target.path,
		targetSeal: target.identity,
		scoreChannels,
		rayIndices: prediction.rayIndices,
		predictedConditionCount: prediction.times.length,
		full17ProspectiveScore:
			prediction.scope === 'prospective-intervention' && predictedScore.fullRegisteredBoundary,
		predictedAggregateRmseMilliwatt: predictedScore.aggregateRmseMilliwatt,
		actualAggregateRmseMilliwatt: actualScore.aggregateRmseMilliwatt,
		conditions,
	};
}

/** Build a fully escaped CSV document. @param {DialSummaryCsvTable} rows @returns {string} */
function csv(rows) {
	return (
		rows
			.map((row) =>
				row.map((value) => (value === null ? '' : `"${String(value).replaceAll('"', '""')}"`)).join(','),
			)
			.join('\n') + '\n'
	);
}

/** Normalize repeated model/run selectors once while preserving every numeric condition and aggregate row. @param {DialCampaignSummaryDocument} document @returns {DialSummaryTables} */
function summaryTables(document) {
	/** @type {Map<DialSummaryCsvName, DialSummaryCsvCell[][]>} */
	const tables = new Map([
		[
			'runs.csv',
			[
				[
					'run_index',
					'run',
					'seal_sha256',
					'seal_bytes',
					'scope',
					'case_id',
					'view_rule',
					'times',
					'retained_channels',
				],
			],
		],
		[
			'models.csv',
			[
				[
					'model_index',
					'run_index',
					'config_id',
					'representation',
					'view_count',
					'solar',
					'order',
					'score_channels',
					'full_registered_boundary',
				],
			],
		],
		[
			'scorecard.csv',
			[
				[
					'model_index',
					'time',
					'scalar_count',
					'rmse_mW_m-2_sr-1_nm-1',
					'historical_rmse_mW_m-2_sr-1_nm-1',
					'new_minus_historical_mW_m-2_sr-1_nm-1',
				],
			],
		],
		[
			'order-runs.csv',
			[
				[
					'diagnostic_index',
					'run',
					'seal_sha256',
					'score_artifact_sha256',
					'scope',
					'case_id',
					'view_rule',
					'view_count',
					'solar',
					'times',
					'channels',
					'full_registered_boundary',
				],
			],
		],
		['order-models.csv', [['order_model_index', 'diagnostic_index', 'representation', 'order']]],
		['order-scores.csv', [['order_model_index', 'time', 'scalar_count', 'rmse_mW_m-2_sr-1_nm-1']]],
	]);
	for (const run of document.gpuRuns)
		tables
			.get('runs.csv')
			.push([
				run.index,
				run.run,
				run.seal.sha256,
				run.seal.byteLength,
				run.selection,
				run.caseId,
				run.viewRule,
				run.times.join(';'),
				run.channels.join(';'),
			]);
	for (const [index, row] of document.scores.entries()) {
		tables
			.get('models.csv')
			.push([
				index,
				row.runIndex,
				row.configId,
				row.representation,
				row.viewCount,
				row.solar,
				row.order,
				row.scoreChannels.join(';'),
				row.fullRegisteredBoundary,
			]);
		for (const condition of row.conditions)
			tables
				.get('scorecard.csv')
				.push([
					index,
					condition.time,
					condition.sampleCount,
					condition.rmseMilliwatt,
					condition.baselineRmseMilliwatt,
					condition.changeMilliwatt,
				]);
		tables
			.get('scorecard.csv')
			.push([
				index,
				'aggregate',
				row.conditions.reduce((sum, condition) => sum + condition.sampleCount, 0),
				row.aggregateRmseMilliwatt,
				row.baselineAggregateRmseMilliwatt,
				row.aggregateChangeMilliwatt,
			]);
	}
	let orderModelIndex = 0;
	for (const diagnostic of document.orderDiagnostics) {
		tables
			.get('order-runs.csv')
			.push([
				diagnostic.index,
				diagnostic.run,
				diagnostic.seal.sha256,
				diagnostic.scoreArtifact.sha256,
				diagnostic.selection,
				diagnostic.caseId,
				diagnostic.viewRule,
				diagnostic.viewCount,
				diagnostic.solar,
				diagnostic.times.join(';'),
				diagnostic.channels.join(';'),
				false,
			]);
		for (const row of diagnostic.rows) {
			tables.get('order-models.csv').push([orderModelIndex, diagnostic.index, row.representation, row.order]);
			for (const condition of row.conditions)
				tables
					.get('order-scores.csv')
					.push([orderModelIndex, condition.time, condition.sampleCount, condition.rmseMilliwatt]);
			tables
				.get('order-scores.csv')
				.push([
					orderModelIndex,
					'aggregate',
					row.conditions.reduce((sum, condition) => sum + condition.sampleCount, 0),
					row.aggregateRmseMilliwatt,
				]);
			orderModelIndex++;
		}
	}
	return tables;
}

/** Decode the exact quoted CSV wire format independently of its serializer, including escaped quotes. @param {string} text @returns {string[][]} */
function readSummaryCsv(text) {
	assert.ok(text.endsWith('\n'));
	const rows = [],
		row = [];
	let position = 0;
	while (position < text.length) {
		let value = '';
		if (text[position] === '"') {
			position++;
			let closed = false;
			while (position < text.length) {
				const character = text[position++];
				if (character !== '"') value += character;
				else if (text[position] === '"') {
					value += '"';
					position++;
				} else {
					closed = true;
					break;
				}
			}
			assert.ok(closed, 'Unclosed quoted summary CSV value.');
		}
		row.push(value);
		assert.ok(text[position] === ',' || text[position] === '\n', 'Unexpected CSV delimiter.');
		if (text[position++] === '\n') {
			rows.push([...row]);
			row.length = 0;
		}
	}
	assert.equal(row.length, 0);
	return rows;
}

/** Verify complete model coverage, independent aggregate arithmetic and decoded normalized CSV joins before publication. @param {DialCampaignSummaryDocument} document @param {ReadonlyMap<DialSummaryCsvName,string>} serializedTables @returns {DialSummaryVerification} */
function verifySummaryData(document, serializedTables) {
	const expectedTables = summaryTables(document);
	assert.deepEqual([...serializedTables.keys()].sort(), [...expectedTables.keys()].sort());
	let csvDataRowCount = 0,
		maximumAggregateDifferenceMilliwatt = 0,
		conditionRowCount = 0,
		orderConditionRowCount = 0;
	/** @type {Map<DialSummaryCsvName,string[][]>} */
	const decoded = new Map();
	for (const [name, expected] of expectedTables) {
		const rows = readSummaryCsv(serializedTables.get(name));
		assert.deepEqual(
			rows,
			expected.map((row) => row.map((value) => (value === null ? '' : String(value)))),
		);
		csvDataRowCount += rows.length - 1;
		decoded.set(name, rows);
	}
	const runKeys = new Set(
		decoded
			.get('runs.csv')
			.slice(1)
			.map((row) => row[0]),
	);
	const modelKeys = new Set(
		decoded
			.get('models.csv')
			.slice(1)
			.map((row) => row[0]),
	);
	const orderRunKeys = new Set(
		decoded
			.get('order-runs.csv')
			.slice(1)
			.map((row) => row[0]),
	);
	const orderModelKeys = new Set(
		decoded
			.get('order-models.csv')
			.slice(1)
			.map((row) => row[0]),
	);
	assert.equal(runKeys.size, document.gpuRuns.length);
	assert.equal(modelKeys.size, document.scores.length);
	assert.equal(orderRunKeys.size, document.orderDiagnostics.length);
	assert.equal(
		orderModelKeys.size,
		document.orderDiagnostics.reduce((sum, diagnostic) => sum + diagnostic.rows.length, 0),
	);
	for (const row of decoded.get('models.csv').slice(1)) assert.ok(runKeys.has(row[1]));
	for (const row of decoded.get('scorecard.csv').slice(1)) assert.ok(modelKeys.has(row[0]));
	for (const row of decoded.get('order-models.csv').slice(1)) assert.ok(orderRunKeys.has(row[1]));
	for (const row of decoded.get('order-scores.csv').slice(1)) assert.ok(orderModelKeys.has(row[0]));
	for (const [index, run] of document.gpuRuns.entries()) {
		assert.equal(run.index, index);
		const rows = document.scores.filter((row) => row.runIndex === index);
		const expected = run.controls.representations.flatMap((representation) =>
			run.controls.viewIntervals.flatMap((count) =>
				run.controls.solarInterpolations.flatMap((solar) =>
					[1, 2, 3, 4].map((order) => `${representation}/${count}/${solar}/${order}`),
				),
			),
		);
		assert.deepEqual(
			rows.map((row) => `${row.representation}/${row.viewCount}/${row.solar}/${row.order}`).sort(),
			expected.sort(),
		);
		for (const row of rows) {
			assert.deepEqual(
				row.scoreChannels,
				run.channels.filter((channel) => channel <= 30),
			);
			assert.deepEqual(
				row.conditions.map((condition) => condition.time),
				run.times,
			);
			assert.equal(
				row.fullRegisteredBoundary,
				JSON.stringify(run.times) === JSON.stringify(CAPTURE_TIMES) &&
					JSON.stringify(row.scoreChannels) === JSON.stringify(SCORE_CHANNELS),
			);
			for (const condition of row.conditions) {
				assert.equal(condition.sampleCount, 81 * row.scoreChannels.length);
				assert.ok(condition.rmseMilliwatt >= 0 && condition.baselineRmseMilliwatt >= 0);
				checkArithmetic(condition.changeMilliwatt, condition.rmseMilliwatt - condition.baselineRmseMilliwatt);
				if (row.order !== 4)
					assert.ok(
						condition.meanSpectralChangeMilliwatt === null &&
							condition.rmsSpectralChangeMilliwatt === null &&
							condition.strongestPointChange === null,
					);
				else {
					assert.ok(
						Number.isFinite(condition.meanSpectralChangeMilliwatt) &&
							Number.isFinite(condition.rmsSpectralChangeMilliwatt),
					);
					assert.ok(
						condition.rmsSpectralChangeMilliwatt + 1e-12 >= Math.abs(condition.meanSpectralChangeMilliwatt),
					);
					const point = condition.strongestPointChange;
					assert.ok(
						point &&
							[point.gridX, point.gridY].every(
								(value) => Number.isInteger(value) && value >= 0 && value < 9,
							),
					);
					checkArithmetic(point.changeMilliwatt, point.candidateRmseMilliwatt - point.baselineRmseMilliwatt);
				}
			}
			maximumAggregateDifferenceMilliwatt = Math.max(
				maximumAggregateDifferenceMilliwatt,
				checkArithmetic(
					row.aggregateRmseMilliwatt,
					Math.sqrt(
						row.conditions.reduce((sum, condition) => sum + condition.rmseMilliwatt ** 2, 0) /
							row.conditions.length,
					),
				),
				checkArithmetic(
					row.baselineAggregateRmseMilliwatt,
					Math.sqrt(
						row.conditions.reduce((sum, condition) => sum + condition.baselineRmseMilliwatt ** 2, 0) /
							row.conditions.length,
					),
				),
			);
			checkArithmetic(
				row.aggregateChangeMilliwatt,
				row.aggregateRmseMilliwatt - row.baselineAggregateRmseMilliwatt,
			);
			conditionRowCount += row.conditions.length;
		}
	}
	for (const [index, diagnostic] of document.orderDiagnostics.entries()) {
		assert.equal(diagnostic.index, index);
		assert.deepEqual(diagnostic.actualOrders, [1, 2, 3, 4, 5, 6]);
		assert.deepEqual(diagnostic.channels, [0, 8]);
		assert.equal(diagnostic.fullRegisteredBoundary, false);
		assert.deepEqual(
			diagnostic.rows.map((row) => `${row.representation}/${row.order}`).sort(),
			diagnostic.representations
				.flatMap((representation) => [4, 5, 6].map((order) => `${representation}/${order}`))
				.sort(),
		);
		for (const row of diagnostic.rows) {
			assert.deepEqual(
				row.conditions.map((condition) => condition.time),
				diagnostic.times,
			);
			for (const condition of row.conditions) {
				assert.equal(condition.sampleCount, 162);
				checkArithmetic(condition.rmseMilliwatt, Math.sqrt(condition.squaredError / 162) * 1000);
			}
			maximumAggregateDifferenceMilliwatt = Math.max(
				maximumAggregateDifferenceMilliwatt,
				checkArithmetic(
					row.aggregateRmseMilliwatt,
					Math.sqrt(
						row.conditions.reduce((sum, condition) => sum + condition.rmseMilliwatt ** 2, 0) /
							row.conditions.length,
					),
				),
			);
			orderConditionRowCount += row.conditions.length;
		}
	}
	for (const prediction of document.predictions)
		for (const target of prediction.targets) {
			const predicted = target.conditions.filter((condition) => condition.predicted);
			assert.equal(predicted.length, target.predictedConditionCount);
			for (const condition of target.conditions)
				if (!condition.predicted)
					assert.ok(
						condition.predictedRmseMilliwatt === null &&
							condition.forecastErrorMilliwatt === null &&
							condition.scoreIdentityResidual === null,
					);
			assert.equal(
				target.full17ProspectiveScore,
				prediction.scope === 'prospective-intervention' &&
					JSON.stringify(predicted.map((condition) => condition.time)) === JSON.stringify(CAPTURE_TIMES) &&
					JSON.stringify(target.scoreChannels) === JSON.stringify(SCORE_CHANNELS) &&
					JSON.stringify(target.rayIndices) === JSON.stringify(ALL_RAYS),
			);
			checkArithmetic(
				target.predictedAggregateRmseMilliwatt,
				Math.sqrt(
					predicted.reduce((sum, condition) => sum + condition.predictedRmseMilliwatt ** 2, 0) /
						predicted.length,
				),
			);
			checkArithmetic(
				target.actualAggregateRmseMilliwatt,
				Math.sqrt(
					predicted.reduce((sum, condition) => sum + condition.actualRmseMilliwatt ** 2, 0) /
						predicted.length,
				),
			);
		}
	return {
		schemaId: 'sky-accuracy-summary-verification-v1',
		uniqueModelSelectors: true,
		modelCount: document.scores.length,
		conditionRowCount,
		orderDiagnosticCount: document.orderDiagnostics.length,
		orderConditionRowCount,
		csvDataRowCount,
		csvJoinsValid: true,
		aggregateChecksPassed: true,
		maximumAggregateDifferenceMilliwatt,
	};
}

/** Human-readable compact campaign report; no best-case selection is presented as qualification. @param {DialCampaignSummaryDocument} document @returns {string} */
function markdown(document) {
	const primary = document.scores.filter(
		(score) => score.order === 4 && score.representation === 'cumulative' && score.solar === 'monotone-cubic',
	);
	const rows = primary.map((score) => {
		const run = document.gpuRuns[score.runIndex];
		return `| ${run.run.split('/').at(-1)} | ${run.selection} | ${run.viewRule} / ${score.viewCount} | ${score.aggregateRmseMilliwatt} | ${score.aggregateChangeMilliwatt} |`;
	});
	const predictions = document.predictions.map(
		(prediction) =>
			`| ${prediction.run.split('/').at(-1)} | ${prediction.targetConfigId} | ${prediction.times.length} | ${prediction.targets.length} | ${
				prediction.assessmentRuns
					.map((path) => {
						const result = document.inventory.find((item) => item.run === path);
						return `${path.split('/').at(-1)}: ${result.state}`;
					})
					.join('; ') || 'No assessment retained'
			} |`,
	);
	const orderRows = document.orderDiagnostics.flatMap((diagnostic) =>
		diagnostic.rows
			.filter((row) => row.representation === 'cumulative')
			.map(
				(row) =>
					`| ${diagnostic.run.split('/').at(-1)} | ${diagnostic.caseId} | ${diagnostic.times.length} | N${row.order} | ${row.aggregateRmseMilliwatt} |`,
			),
	);
	return `Predictable sky accuracy dials: campaign snapshot\n\nDiscovery: ${document.discoveredAt}. This report derives existing evidence; it executes no new atmospheric model. Accepted GPU execution and passed prediction checks are separate facts.\n\n${document.gpuRuns.length} accepted normal GPU runs; ${document.scores.length} representation/view/order models; ${document.predictions.length} sealed predictions; ${document.orderDiagnostics.length} separate N6 diagnostics. All models and condition rows are retained in scorecard.json and normalized CSVs.\n\nCSV joins use zero-based indexes: scorecard.csv.model_index joins models.csv.model_index; models.csv.run_index joins runs.csv.run_index. These indexes also match scorecard.json scores and gpuRuns array positions. Each model has every condition plus one aggregate row; numeric precision is preserved. The separate N6 tables join order-scores.csv.order_model_index to order-models.csv, then diagnostic_index to order-runs.csv. Never join an N6 index to a normal-model table.\n\nKnown complete historical references (17 x 81 x 31):\n\n${document.historical.map((entry) => `- ${entry.id}: ${entry.score.aggregateRmseMilliwatt} mW m^-2 sr^-1 nm^-1.`).join('\n')}\n\nCumulative N4 scorecard (all runs, including repeats):\n\n| Source run | Scope | View rule / count | Kider RMSE | New minus historical |\n| --- | --- | --- | ---: | ---: |\n${rows.join('\n')}\n\nRMSE units are mW m^-2 sr^-1 nm^-1; lower is better. The comparison uses Native48 CPU N4/Q30 on exactly the selected times, rays and score channels. Full and screening values must not be ranked together. Counts for altitude-segmented views mean substeps per crossed altitude segment; global-quadratic counts mean intervals over the complete view. Earlier-order rows describe order progression and do not share the N4 reference's numerical contract.\n\nSeparate two-channel order diagnostics:\n\n| Source run | Case | Times | Cumulative order | Two-channel RMSE |\n| --- | --- | ---: | --- | ---: |\n${orderRows.join('\n')}\n\nThese rows use only channels 0 and 8 (360 and 454 nm), with 81 directions at each listed time. They are not the full registered B1 score and must not be compared numerically with the 31-channel table above. All four representations at N4/N5/N6 are retained in the separate order tables. Values are copied from authenticated producer scores; no six-order spectrum is passed to the normal four-order decoder. Prefix-parity artifacts remain linked. A higher-order change in Kider RMSE alone does not establish convergence or a tail-error bound.\n\nPrediction inventory:\n\n| Registration | Target | Predicted times | Completed citing targets | Retained assessments |\n| --- | --- | ---: | ---: | --- |\n${predictions.join('\n')}\n\nPrediction score tables retain every target time. A null forecast means that time was not prospectively predicted. In particular, fourteen-condition predictions do not become seventeen-condition holdouts. Existing Kider measurements have all been seen; only intervention outcomes were withheld.\n\nMeasured storage at ${document.storageMeasuredAt}: ${document.storage.retainedBytes} retained bytes, ${document.storage.scratchBytes} live scratch bytes, ${document.storage.freeBytes} free bytes. Browser durations and peak field-memory counters are in scorecard.json; they include the retained reconstruction work and are not isolated kernel timings or total-memory measurements.\n\nScientific limits:\n\n${document.limitations.map((limit) => `- ${limit}`).join('\n')}\n`;
}

/** Return complete scientific plots in bounded six-series pages, separating physical changes from Kider fit. @param {DialCampaignSummaryDocument} document @returns {Map<string,string>} */
function figures(document) {
	const result = new Map();
	const selected = document.scores.filter(
		(row) => row.order === 4 && row.representation === 'cumulative' && row.solar === 'monotone-cubic',
	);
	const groups = new Map();
	for (const row of selected) {
		const source = document.gpuRuns[row.runIndex];
		const key = JSON.stringify({selection: source.selection, times: source.times, channels: row.scoreChannels});
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(row);
	}
	let figureIndex = 0;
	for (const group of groups.values())
		for (let start = 0; start < group.length; start += 5) {
			const rows = /** @type {DialSummaryScoreRow[]} */ (group.slice(start, start + 5));
			const times = rows[0].conditions.map((condition) => condition.time);
			const provenance = {
				runSeals: rows.map((row) => document.gpuRuns[row.runIndex].seal),
				historical: document.historical[0].source,
				operation:
					'Condition scores and signed mean physical deltas from every selected cumulative N4 model; pages preserve all configurations without selecting winners.',
			};
			const label = (row) => {
				const source = document.gpuRuns[row.runIndex];
				return `${source.run.split('/').at(-1).slice(0, 5)} ${source.caseId} ${source.viewRule === 'altitude-segmented' ? 'segment' : 'Q'}${row.viewCount}`;
			};
			const base = {
				xLabel: 'Local EDT capture time on 2013-05-27',
				xTicks: times.map((time, index) => ({value: index, label: time})),
				provenance,
			};
			const x = times.map((_, index) => index);
			const prefix = `figures/${String(figureIndex++).padStart(3, '0')}`;
			result.set(
				`${prefix}-kider.svg`,
				renderScientificSvg({
					...base,
					title: 'Kider agreement: cumulative N4',
					description: `${document.gpuRuns[rows[0].runIndex].selection} scope; score channels ${rows[0].scoreChannels.join(',')}. Lower RMSE is better.`,
					yLabel: 'Spectral radiance RMSE (mW m^-2 sr^-1 nm^-1)',
					series: [
						{
							label: 'Historical Native48 CPU Q30',
							x,
							y: rows[0].conditions.map((condition) => condition.baselineRmseMilliwatt),
						},
						...rows.map((row) => ({
							label: label(row),
							x,
							y: row.conditions.map((condition) => condition.rmseMilliwatt),
						})),
					],
				}),
			);
			result.set(
				`${prefix}-physical.svg`,
				renderScientificSvg({
					...base,
					title: 'Physical spectral change: cumulative N4',
					description:
						'Signed mean radiance change from historical Native48 CPU Q30 on scored channels; cancellation is possible.',
					yLabel: 'Mean radiance change (mW m^-2 sr^-1 nm^-1)',
					series: rows.map((row) => ({
						label: label(row),
						x,
						y: row.conditions.map((condition) => condition.meanSpectralChangeMilliwatt),
					})),
				}),
			);
		}
	for (const [predictionIndex, prediction] of document.predictions.entries())
		for (const [targetIndex, target] of prediction.targets.entries()) {
			const predicted = target.conditions.filter((condition) => condition.predicted);
			const x = predicted.map((condition) => CAPTURE_TIMES.indexOf(condition.time));
			result.set(
				`figures/prediction-${predictionIndex}-${targetIndex}.svg`,
				renderScientificSvg({
					title: 'Locked Kider score forecast versus actual outcome',
					description: `${target.predictedConditionCount} ${prediction.scope === 'prospective-intervention' ? 'prospectively predicted' : 'development reconstruction'} times. Omitted times are not inferred; lower RMSE is better.`,
					xLabel: 'Local EDT capture time on 2013-05-27',
					xTicks: predicted.map((condition, index) => ({value: x[index], label: condition.time})),
					yLabel: 'Spectral radiance RMSE (mW m^-2 sr^-1 nm^-1)',
					series: [
						{
							label: 'Locked spectral-delta forecast',
							x,
							y: predicted.map((condition) => condition.predictedRmseMilliwatt),
						},
						{
							label: 'Actual later target',
							x,
							y: predicted.map((condition) => condition.actualRmseMilliwatt),
						},
					],
					provenance: {
						predictionSeal: prediction.seal,
						targetSeal: target.targetSeal,
						operation:
							'Forecast SSE = control SSE + 2(control-measured) dot locked delta + norm(locked delta)^2; no fitted target response.',
					},
				}),
			);
		}
	for (const diagnostic of document.orderDiagnostics) {
		const x = diagnostic.times.map((_, index) => index);
		const rows = [4, 5, 6].map((order) =>
			diagnostic.rows.find((row) => row.representation === 'cumulative' && row.order === order),
		);
		assert.ok(rows.every(Boolean));
		result.set(
			`figures/order-diagnostic-${diagnostic.index}.svg`,
			renderScientificSvg({
				title: `${diagnostic.caseId}: N4/N5/N6 two-channel diagnostic`,
				description: `Only 360 and 454 nm; ${diagnostic.times.length} times and 81 directions. Not the full registered B1 score. Lower RMSE is better.`,
				xLabel: 'Local EDT capture time on 2013-05-27',
				yLabel: 'Two-channel radiance RMSE (mW m^-2 sr^-1 nm^-1)',
				xTicks: diagnostic.times.map((time, index) => ({value: index, label: time})),
				series: rows.map((row) => ({
					label: `Cumulative N${row.order}`,
					x,
					y: row.conditions.map((condition) => condition.rmseMilliwatt),
				})),
				provenance: {
					runSeal: diagnostic.seal,
					scoreArtifact: diagnostic.scoreArtifact,
					controlArtifact: diagnostic.controlArtifact,
					parityArtifact: diagnostic.parityArtifact,
					operation:
						'Display exact retained N4/N5/N6 condition scores from the separate six-order producer; channels 0/8 only, no normal N4 decoding or spectrum regeneration.',
				},
			}),
		);
	}
	return result;
}

/** Summarize all discovered immutable campaign evidence in a fresh bounded run; normal four-order GPU evidence and other driver schemas remain distinct. @returns {Promise<DialCampaignSummaryResult>} */
export async function summarizeCampaign() {
	const discoveredAt = new Date().toISOString();
	const discovered = discoverRuns();
	const parents = discovered.flatMap((source) => (source.identity ? [source.identity] : []));
	const run = createRun('campaign-summary', {
		parents,
		operation:
			'Authenticate a fixed snapshot of terminal campaign runs; decode all normal GPU representation/view/order spectra, compute selected-channel Kider scores and physical changes, inventory prediction failures, and evaluate locked spectral-delta score forecasts without refitting or executing a GPU model.',
		parameters: {
			discoveredAt,
			outputBudgetBytes: artifactBudget,
			scoreInterval: 'Direct40 point channels 0-30; explicit intersections for screening',
			historicalComparison: 'Native48 CPU N4 global-quadratic Q30',
			otherDriverSchemas:
				'N6: exact two-channel producer score schema only. Other driver schemas: inventory only. Never decoded as normal N1-N4 streaming evidence.',
		},
	});
	let terminal = false;
	try {
		const inventory = /** @type {DialSummaryInventoryRow[]} */ ([]);
		for (const [index, source] of discovered.entries()) {
			run.progress(
				'authenticate',
				`Verifying source run ${index + 1}/${discovered.length}.`,
				index,
				discovered.length,
			);
			if (source.identity) assert.deepEqual(verifyRun(source.path), source.identity);
			let kind = /** @type {DialSummaryRunKind} */ (source.seal ? 'other' : 'open');
			if (hasArtifact(source, 'prediction.json') && hasArtifact(source, 'selector.json')) kind = 'prediction';
			else if (source.seal?.result.predictionId && typeof source.seal.result.passed === 'boolean')
				kind = 'prediction-assessment';
			inventory.push({
				run: source.path,
				kind,
				state: source.seal?.state ?? null,
				seal: source.identity,
				retainedBytes: source.seal ? retainedBytes(source) : null,
				failure: source.seal?.result.failure?.message ?? source.seal?.result.message ?? null,
				predictionPassed: kind === 'prediction-assessment' ? source.seal.result.passed : null,
			});
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
		const inputs = discovered.find((source) => source.path === inputRun);
		assert.ok(inputs?.seal?.state === 'accepted');
		const measured = historicalBoundary(inputs, 'measurements.tsv', 'known-kider');
		const historicalBoundaries = [
			historicalBoundary(inputs, 'native48-cpu.tsv', 'known-native48-cpu-n4-q30', 'production'),
			historicalBoundary(inputs, 'native48-gpu.tsv', 'known-native48-gpu-n4-q30', 'proposed'),
			historicalBoundary(inputs, 'native51-cpu.tsv', 'known-native51-cpu-n4-q30', 'native51-cpu-q30'),
		];
		const historical = historicalBoundaries.map((boundary) => ({
			id: boundary.configId,
			source: boundary.sourceIdentity,
			score: scoreBoundary(boundary, measured),
		}));
		assert.equal(historical[0].score.aggregateRmseMilliwatt, 11.419630255451395);
		const gpuRuns = /** @type {DialSummaryGpuRun[]} */ ([]),
			scores = /** @type {DialSummaryScoreRow[]} */ ([]);
		const orderDiagnostics = /** @type {DialSummaryOrderDiagnostic[]} */ ([]);
		for (const source of discovered) {
			if (
				source.seal?.state !== 'accepted' ||
				!hasArtifact(source, 'execution.json') ||
				!hasArtifact(source, 'control.json')
			)
				continue;
			const execution = /** @type {DialSummaryExecution} */ (
				JSON.parse(artifactBytes(source, 'execution.json').toString())
			);
			const driver = /** @type {DialSummaryDriverTag} */ (
				JSON.parse(artifactBytes(source, 'control.json').toString())
			);
			if (driver.executionSchemaId !== undefined) {
				if (driver.executionSchemaId === 'sky-six-order-control-v1') {
					orderDiagnostics.push(orderDiagnostic(source, orderDiagnostics.length));
					const inventoryIndex = inventory.findIndex((item) => item.run === source.path);
					inventory[inventoryIndex] = {...inventory[inventoryIndex], kind: 'order-diagnostic'};
					run.progress(
						'order-diagnostics',
						`Admitted separate two-channel N6 scores from ${source.path.split('/').at(-1)}.`,
						orderDiagnostics.length,
					);
					await new Promise((resolve) => setTimeout(resolve, 0));
				}
				continue;
			}
			assert.equal(
				driver.actualOrders,
				undefined,
				'An additional order ledger requires an explicit driver schema.',
			);
			if (execution.execution?.schemaId !== 'sky-gpu-host-result-v1') continue;
			assert.ok(
				execution.execution.executionSucceeded &&
					execution.execution.browser.schemaId === 'sky-gpu-browser-result-v1',
			);
			const loaded = loadSpectra(source.path);
			assert.deepEqual(loaded.sealIdentity, source.identity);
			assert.ok(['screen', 'full', 'repeat'].includes(source.seal.result.selection));
			const firstEvent = JSON.parse(artifactBytes(source, 'progress.jsonl').toString().split('\n')[0]);
			const browser = execution.execution.browser;
			assert.ok(
				[browser.elapsedMilliseconds, browser.peakLiveFieldBytes].every(
					(value) => Number.isFinite(value) && value >= 0,
				),
			);
			let viewRule = loaded.control.controls.viewRule;
			let viewRuleSource = source.seal.artifacts.find(
				(artifact) => artifact.path === `${source.path}/control.json`,
			);
			if (viewRule === undefined) {
				const sourceName = 'sources/experiments/sky-accuracy-dials/numerics/view.js.txt';
				viewRuleSource = source.seal.artifacts.find(
					(artifact) => artifact.path === `${source.path}/${sourceName}`,
				);
				assert.ok(viewRuleSource);
				// This immutable evaluator explicitly partitions distance as length*(i/Q)^2; it predates the viewRule field.
				assert.equal(viewRuleSource.sha256, '7e91021b7d4d6be2134218bbcfa9665c6bebefc6151b43e89c2cd23177a15245');
				artifactBytes(source, sourceName);
				viewRule = 'quadratic';
			}
			assert.ok(['quadratic', 'altitude-segmented'].includes(viewRule));
			const gpu = {
				index: gpuRuns.length,
				run: source.path,
				seal: source.identity,
				caseId: loaded.caseId,
				selection: /** @type {DialExecutionSelection} */ (source.seal.result.selection),
				controls: loaded.control.controls,
				viewRule,
				viewRuleSource,
				times: loaded.control.scenes.map((scene) => scene.time),
				channels: loaded.control.channels,
				browserElapsedMilliseconds: browser.elapsedMilliseconds,
				wallElapsedMilliseconds: Date.parse(source.seal.finishedAt) - Date.parse(firstEvent.timestamp),
				peakLiveFieldBytes: browser.peakLiveFieldBytes,
				retainedBytes: retainedBytes(source),
				scratchHighWaterBytes: source.seal.cleanup.highWaterBytes,
			};
			assert.ok(Number.isFinite(gpu.wallElapsedMilliseconds) && gpu.wallElapsedMilliseconds >= 0);
			assert.deepEqual(gpu.times, gpu.selection === 'full' ? CAPTURE_TIMES : SCREEN_SELECTION.times);
			assert.deepEqual(
				gpu.channels,
				gpu.selection === 'full' ? ALL_CHANNELS : gpu.selection === 'screen' ? SCREEN_SELECTION.channels : [24],
			);
			gpuRuns.push(gpu);
			const inventoryIndex = inventory.findIndex((item) => item.run === source.path);
			inventory[inventoryIndex] = {...inventory[inventoryIndex], kind: 'gpu'};
			const channels = loaded.control.channels.filter((channel) => channel <= 30);
			const selection = {times: gpu.times, channels, rayIndices: historicalBoundaries[0].rayIndices};
			const baseline = selectBoundary(historicalBoundaries[0], selection),
				reference = selectBoundary(measured, selection);
			const baselineScore = scoreBoundary(baseline, reference, channels);
			for (const representation of loaded.control.controls.representations)
				for (const viewCount of loaded.control.controls.viewIntervals)
					for (const solar of loaded.control.controls.solarInterpolations)
						for (let order = 1; order <= 4; order++) {
							const model = selectBoundary(
								extractBoundary(loaded, representation, viewCount, solar, order),
								selection,
							);
							const score = scoreBoundary(model, reference, channels);
							scores.push({
								runIndex: gpu.index,
								configId: model.configId,
								representation,
								viewCount,
								solar,
								order,
								scoreChannels: channels,
								fullRegisteredBoundary: score.fullRegisteredBoundary,
								aggregateRmseMilliwatt: score.aggregateRmseMilliwatt,
								baselineAggregateRmseMilliwatt: baselineScore.aggregateRmseMilliwatt,
								aggregateChangeMilliwatt:
									score.aggregateRmseMilliwatt - baselineScore.aggregateRmseMilliwatt,
								conditions: conditionChanges(model, baseline, reference, score, baselineScore, order),
							});
						}
			run.progress(
				'scores',
				`Scored all representations, views and orders for ${source.path.split('/').at(-1)}.`,
				gpuRuns.length,
			);
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
		const predictions = /** @type {DialSummaryPrediction[]} */ ([]);
		for (const source of discovered.filter(
			(candidate) =>
				candidate.seal?.state === 'accepted' &&
				hasArtifact(candidate, 'prediction.json') &&
				hasArtifact(candidate, 'selector.json'),
		)) {
			const prediction = /** @type {DialSpectralPrediction} */ (
				JSON.parse(artifactBytes(source, 'prediction.json').toString())
			);
			const selector = /** @type {DialPredictionSelector} */ (
				JSON.parse(artifactBytes(source, 'selector.json').toString())
			);
			const targets = gpuRuns
				.filter((gpu) => {
					const candidate = discovered.find((entry) => entry.path === gpu.run);
					return candidate.seal.recipe.parents.some(
						(parent) => parent.path === source.identity.path && parent.sha256 === source.identity.sha256,
					);
				})
				.map((gpu) =>
					forecastTarget(
						source,
						prediction,
						selector,
						discovered.find((entry) => entry.path === gpu.run),
						measured,
					),
				);
			const assessmentRuns = discovered
				.filter(
					(candidate) =>
						inventory.find((entry) => entry.run === candidate.path).kind === 'prediction-assessment' &&
						candidate.seal.recipe.parents.some(
							(parent) =>
								parent.path === source.identity.path && parent.sha256 === source.identity.sha256,
						),
				)
				.map((candidate) => candidate.path);
			predictions.push({
				run: source.path,
				seal: source.identity,
				predictionId: prediction.id,
				targetConfigId: prediction.targetConfigId,
				scope: prediction.scope,
				unseenMeasurementData: false,
				floorW: prediction.floorW,
				times: prediction.times,
				channels: prediction.channels,
				assessmentRuns,
				targets,
			});
			run.progress(
				'predictions',
				`Retained forecast and assessment inventory for ${prediction.id}.`,
				predictions.length,
			);
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
		/** @type {DialCampaignSummaryDocument} */
		const document = {
			schemaId: 'sky-accuracy-campaign-summary-v1',
			discoveredAt,
			storageMeasuredAt: new Date().toISOString(),
			storage: storage(),
			inventory,
			historical,
			gpuRuns,
			scores,
			predictions,
			orderDiagnostics,
			limitations: [
				'Numerical convergence and Kider agreement are separate; neither a lower score nor a smoother curve proves convergence.',
				'All seventeen measurement conditions were already known. Prospective claims apply only to the explicitly locked intervention coordinates.',
				'Frozen-increment and analytic-first-order representations retain their declared higher-order treatment; they are not silently relabelled as regenerated recurrence.',
				'Normal four-order results stay at N4. Separately admitted N6 scores use channels 0/8 only and never qualify the full registered B1 boundary; their N1-N4 prefix evidence remains linked.',
				'N4 physical and strongest-point changes compare against historical Native48 CPU N4/Q30 on the same scored coordinates. Signed means may cancel; RMS changes and complete parent spectra remain available.',
				'Repeated executions remain separate evidence rows. Screen/full/repeat selections and segmented/global integration counts remain explicitly distinct.',
				'Peak live field bytes exclude browser, CPU and driver memory. Measured browser duration includes compilation and final-view evaluation.',
				'No source run is reopened or modified; all detailed spectra, rejected hypotheses and failure evidence remain at their authenticated parent locations.',
			],
		};
		const serializedTables = new Map([...summaryTables(document)].map(([name, rows]) => [name, csv(rows)]));
		const verification = verifySummaryData(document, serializedTables);
		const outputs = new Map([
			['scorecard.json', JSON.stringify(document)],
			['verification.json', JSON.stringify(verification)],
			...serializedTables,
			['report.md', markdown(document)],
			...figures(document),
		]);
		const plannedBytes = [...outputs.values()].reduce((sum, value) => sum + Buffer.byteLength(value), 0);
		assert.ok(
			plannedBytes <= artifactBudget - 256 * 1024,
			`Compact summary exceeds its 4 MiB cap: ${plannedBytes} bytes.`,
		);
		for (const [name, value] of outputs) run.write(name, value);
		for (const source of discovered)
			if (source.identity) {
				assert.deepEqual(verifyRun(source.path), source.identity);
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		run.progress('finalize', 'All parent artifacts reauthenticated; sealing the compact summary.');
		const seal = run.finish('accepted', {
			gpuRunCount: gpuRuns.length,
			scoreRowCount: scores.length,
			predictionCount: predictions.length,
			orderDiagnosticCount: orderDiagnostics.length,
			summaryArtifactBytes: plannedBytes,
			outputBudgetBytes: artifactBudget,
			sourceRunCount: discovered.length,
		});
		terminal = true;
		assert.deepEqual(verifyRun(run.path), seal);
		const terminalSeal = /** @type {DialSummarySourceSeal} */ (
			JSON.parse(readRepository(seal.path, seal).toString())
		);
		const totalBytes =
			seal.byteLength + terminalSeal.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0);
		assert.ok(totalBytes <= artifactBudget);
		return {
			run: run.path,
			seal,
			accepted: terminalSeal.state === 'accepted',
			gpuRunCount: gpuRuns.length,
			scoreRowCount: scores.length,
			predictionCount: predictions.length,
			orderDiagnosticCount: orderDiagnostics.length,
			retainedArtifactBytes: totalBytes,
		};
	} catch (error) {
		if (!terminal) run.finish('failed', {message: String(error), stack: error.stack});
		throw error;
	}
}
