import assert from 'node:assert/strict';
import {extractBoundary, loadSpectra} from '../../processing.mjs';
import {ALL_RAYS, CAPTURE_TIMES, RADIANCE_UNITS, SCORE_CHANNELS, selectBoundary} from '../../analysis/boundary.mjs';
import {scoreBoundary} from '../../analysis/metrics.mjs';

/** Encode every primitive without rounding or conflating null with zero.
 * @param {SkyContinuationAnalysisTable} table @returns {string}
 */
export function closureCsv(table) {
	/** @param {SkyContinuationAnalysisCell} cell @returns {string} */
	const encode = (cell) => `"${String(cell).replaceAll('"', '""')}"`;
	return [table.columns, ...table.rows].map((row) => row.map(encode).join(',')).join('\n') + '\n';
}

/** Parse the quoted CSV representation independently of its writer.
 * @param {string} text @returns {readonly (readonly string[])[]}
 */
export function parseClosureCsv(text) {
	/** @type {string[][]} */ const rows = [];
	/** @type {string[]} */ let row = [];
	let cell = '',
		quoted = false,
		started = false,
		closed = false;
	for (let index = 0; index < text.length; index++) {
		const ch = text[index];
		if (quoted) {
			if (ch === '"' && text[index + 1] === '"') {
				cell += '"';
				index++;
			} else if (ch === '"') {
				quoted = false;
				closed = true;
			} else cell += ch;
		} else if (ch === '"') {
			assert.ok(!started && !closed, 'Unexpected quote in normalized CSV.');
			quoted = true;
			started = true;
		} else if (ch === ',' || ch === '\n') {
			assert.ok(started && closed, 'CSV cells must use the declared quoted encoding.');
			row.push(cell);
			cell = '';
			started = false;
			closed = false;
			if (ch === '\n') {
				rows.push(row);
				row = [];
			}
		} else throw new Error('Unquoted CSV character.');
	}
	assert.ok(!quoted && !started && !closed && row.length === 0, 'Truncated normalized CSV.');
	return rows;
}

/** Validate a normalized evidence table while preserving its physical column names.
 * @param {unknown} value @returns {SkyContinuationAnalysisTable}
 */
export function checkedClosureTable(value) {
	assert.ok(value && typeof value === 'object' && !Array.isArray(value));
	const table = /** @type {SkyContinuationAnalysisTable} */ (value);
	assert.deepEqual(Object.keys(table).sort(), ['columns', 'rows']);
	assert.ok(Array.isArray(table.columns) && table.columns.length > 0 && table.columns.length <= 128);
	assert.equal(new Set(table.columns).size, table.columns.length);
	assert.ok(table.columns.every((name) => typeof name === 'string' && name.length > 0 && name.length <= 256));
	assert.ok(Array.isArray(table.rows) && table.rows.length <= 200000);
	for (const row of table.rows) {
		assert.ok(Array.isArray(row) && row.length === table.columns.length);
		for (const cell of row)
			assert.ok(
				cell === null ||
					typeof cell === 'string' ||
					typeof cell === 'boolean' ||
					(typeof cell === 'number' && Number.isFinite(cell)),
			);
	}
	return table;
}

/** Independent scalar residual accumulation checks the producer score and selector boundary.
 * @param {DialAnalysisBoundary} model @param {DialAnalysisBoundary} measured @param {DialBoundaryScore} score
 * @returns {number} Number of checked condition and aggregate identities.
 */
export function verifyClosureScore(model, measured, score) {
	assert.equal(model.quantity, 'radiance');
	assert.equal(model.units, RADIANCE_UNITS);
	assert.deepEqual(model.rayIndices, ALL_RAYS);
	assert.ok(
		score.selection.channels.length > 0 &&
			score.selection.channels.every((channel) => SCORE_CHANNELS.includes(channel)),
	);
	const chosen = selectBoundary(model, score.selection),
		truth = selectBoundary(measured, score.selection);
	assert.equal(chosen.values.length, score.sampleCount);
	let pooled = 0,
		conditionSquares = 0;
	for (let time = 0; time < chosen.times.length; time++) {
		let sum = 0;
		const count = chosen.rayIndices.length * chosen.channels.length;
		for (let scalar = time * count; scalar < (time + 1) * count; scalar++) {
			assert.ok(Number.isFinite(chosen.values[scalar]) && chosen.values[scalar] >= 0);
			const difference = chosen.values[scalar] - truth.values[scalar];
			sum += difference * difference;
		}
		const condition = score.conditions[time];
		assert.equal(condition.time, chosen.times[time]);
		assert.equal(condition.sampleCount, count);
		assert.ok(
			Math.abs(sum - condition.squaredError) <=
				1e-24 + 256 * Number.EPSILON * Math.max(sum, condition.squaredError),
		);
		assert.ok(Math.abs(1000 * Math.sqrt(sum / count) - condition.rmseMilliwatt) < 1e-10);
		pooled += sum;
		conditionSquares += sum / count;
	}
	assert.ok(
		Math.abs(1000 * Math.sqrt(conditionSquares / chosen.times.length) - score.aggregateRmseMilliwatt) < 1e-10,
	);
	assert.ok(
		Math.abs(pooled - score.squaredError) <= 1e-24 + 512 * Number.EPSILON * Math.max(pooled, score.squaredError),
	);
	const full =
		JSON.stringify(chosen.times) === JSON.stringify(CAPTURE_TIMES) &&
		JSON.stringify(chosen.channels) === JSON.stringify(SCORE_CHANNELS);
	assert.equal(
		score.fullRegisteredBoundary,
		full,
		'Screen/component selectors cannot become the complete score boundary.',
	);
	return chosen.times.length + 3;
}

/** Score all actual ordinary selectors from one accepted capture; seven source species still yield four radiance orders.
 * @param {SkyClosureRun} source @param {DialContinuationRegistrationRead} registration
 * @param {DialAnalysisBoundary} measured @param {number} startIndex @param {() => void} progress
 * @returns {readonly SkyClosureModel[]}
 */
export function closureModels(source, registration, measured, startIndex, progress) {
	assert.equal(source.terminal.state, 'accepted');
	assert.equal(source.invalid, null);
	assert.equal(source.terminal.recipe.parameters.jobKind, 'gpu');
	const scope = source.terminal.recipe.parameters.scope;
	assert.ok(scope === 'screen' || scope === 'full');
	const loaded = loadSpectra(source.run),
		control = loaded.control;
	assert.deepEqual(loaded.sealIdentity, source.seal);
	const expected = registration.record.scopes[scope];
	assert.deepEqual(control.channels, expected.channels);
	assert.deepEqual(
		control.scenes.map((scene) => scene.time),
		expected.times,
	);
	assert.ok(control.continuation, 'Only explicit continuation captures are admitted to new score tables.');
	/** @type {SkyClosureModel[]} */ const models = [];
	for (const representation of control.controls.representations)
		for (const view of control.controls.viewIntervals)
			for (const solar of control.controls.solarInterpolations)
				for (let order = 1; order <= 4; order++) {
					progress();
					const model = extractBoundary(loaded, representation, view, solar, order);
					const score = scoreBoundary(
						model,
						measured,
						control.channels.filter((channel) =>
							registration.record.scopes.scoreChannels.includes(channel),
						),
					);
					verifyClosureScore(model, measured, score);
					assert.equal(score.fullRegisteredBoundary, scope === 'full');
					models.push({
						index: startIndex + models.length,
						runIndex: source.index,
						caseId: loaded.caseId,
						scope,
						representation,
						view,
						solar,
						order,
						numericalChannels: [...control.channels],
						score,
					});
				}
	return models;
}

/** Normalize inventory, model selectors, condition scores and exact phase costs.
 * @param {readonly SkyClosureRun[]} inventory @param {readonly SkyClosureModel[]} models
 * @param {DialContinuationResourceCounters} usage @returns {readonly SkyClosureTable[]}
 */
export function closureCoreTables(inventory, models, usage) {
	const parents = inventory.map((source) => source.seal);
	return [
		{
			id: 'runs',
			description: 'Every C0-and-later terminal record; invalid evidence has accounting-only scope.',
			sources: parents,
			table: {
				columns: [
					'run_index',
					'run',
					'state',
					'classification',
					'phase',
					'job_kind',
					'scope',
					'case',
					'elapsed_ms',
					'retained_bytes',
					'seal_sha256',
				],
				rows: inventory.map((source) => [
					source.index,
					source.run,
					source.terminal.state,
					source.invalid ? 'invalid-evidence-accounted-only' : 'strictly-verified',
					source.index === 0 ? 'C0' : source.terminal.recipe.parameters.phase,
					source.index === 0 ? 'cpu' : source.terminal.recipe.parameters.jobKind,
					source.index === 0 ? 'component' : source.terminal.recipe.parameters.scope,
					source.terminal.result.caseId ?? source.terminal.result.targetCaseId ?? null,
					source.index === 0 ? 0 : source.terminal.result.jobElapsedMilliseconds,
					source.retainedBytes,
					source.seal.sha256,
				]),
			},
		},
		{
			id: 'models',
			description:
				'All accepted ordinary N1-N4 selectors; the six numerical channels and five score channels remain distinct.',
			sources: parents,
			table: {
				columns: [
					'model_index',
					'run_index',
					'case',
					'scope',
					'quantity',
					'units',
					'representation',
					'view',
					'solar',
					'order',
					'numerical_channels',
					'score_channels',
					'times',
					'full_registered_boundary',
				],
				rows: models.map((model) => [
					model.index,
					model.runIndex,
					model.caseId,
					model.scope,
					'radiance',
					RADIANCE_UNITS,
					model.representation,
					model.view,
					model.solar,
					model.order,
					model.numericalChannels.join(','),
					model.score.selection.channels.join(','),
					model.score.selection.times.join(','),
					model.score.fullRegisteredBoundary,
				]),
			},
		},
		{
			id: 'scores',
			description:
				'Lower RMSE is better. Aggregate is sqrt(mean(condition RMSE squared)); scores are never ranked across scopes.',
			sources: parents,
			table: {
				columns: ['model_index', 'time', 'scalar_count', 'squared_error_W2', 'Kider_RMSE_mW'],
				rows: models.flatMap((model) => [
					...model.score.conditions.map((condition) => [
						model.index,
						condition.time,
						condition.sampleCount,
						condition.squaredError,
						condition.rmseMilliwatt,
					]),
					[
						model.index,
						'aggregate',
						model.score.sampleCount,
						model.score.squaredError,
						model.score.aggregateRmseMilliwatt,
					],
				]),
			},
		},
		{
			id: 'resources',
			description:
				'Complete terminal accounting before this report; failed jobs retain their original allocation.',
			sources: parents,
			table: {
				columns: [
					'phase',
					'retained_bytes',
					'cpu_elapsed_ms',
					'gpu_elapsed_ms',
					'gpu_constructions',
					'full_captures',
				],
				rows: Object.entries(usage.retainedBytesByPhase).map(([phase, bytes]) => {
					const selected = inventory.filter(
						(source) =>
							(source.invalid
								? 'failure-and-sealing-reserve'
								: source.index === 0
									? 'C0'
									: source.terminal.recipe.parameters.phase) === phase,
					);
					const cpu = selected.filter(
						(source) => source.index !== 0 && source.terminal.recipe.parameters.jobKind === 'cpu',
					);
					const gpu = selected.filter(
						(source) => source.index !== 0 && source.terminal.recipe.parameters.jobKind === 'gpu',
					);
					return [
						phase,
						bytes,
						cpu.reduce((sum, source) => sum + source.terminal.result.jobElapsedMilliseconds, 0),
						gpu.reduce((sum, source) => sum + source.terminal.result.jobElapsedMilliseconds, 0),
						gpu.length,
						gpu.filter((source) => source.terminal.recipe.parameters.scope === 'full').length,
					];
				}),
			},
		},
	];
}

/** Verify exact CSV round trips, foreign-key joins, scope isolation and independently reconciled resource totals.
 * @param {readonly SkyClosureTable[]} tables @param {readonly SkyClosureModel[]} models
 * @param {readonly SkyClosureRun[]} inventory @param {DialContinuationResourceCounters} usage
 * @returns {number} Successful structural/arithmetic assertions.
 */
export function verifyClosureTables(tables, models, inventory, usage) {
	assert.equal(new Set(tables.map((table) => table.id)).size, tables.length);
	let checks = 1;
	for (const item of tables) {
		const table = checkedClosureTable(item.table);
		assert.deepEqual(
			parseClosureCsv(closureCsv(table)),
			[table.columns, ...table.rows].map((row) => row.map(String)),
		);
		checks += table.rows.length + 2;
	}
	const runs = new Set(inventory.map((source) => source.index));
	assert.equal(runs.size, inventory.length);
	assert.equal(new Set(models.map((model) => model.index)).size, models.length);
	assert.equal(
		new Set(
			models.map((model) =>
				JSON.stringify([model.runIndex, model.representation, model.view, model.solar, model.order]),
			),
		).size,
		models.length,
	);
	const selectors = tables.find((table) => table.id === 'models');
	assert.ok(selectors);
	assert.equal(selectors.table.rows.length, models.length);
	for (const row of selectors.table.rows) {
		const model = models.find((model) => model.index === row[0]);
		assert.ok(model);
		assert.equal(row[1], model.runIndex);
		assert.equal(row[3], model.scope);
		assert.equal(row[4], 'radiance');
		assert.equal(row[5], RADIANCE_UNITS);
		assert.equal(row[6], model.representation);
		assert.equal(row[7], model.view);
		assert.equal(row[8], model.solar);
		assert.equal(row[9], model.order);
		assert.equal(row[10], model.numericalChannels.join(','));
		assert.equal(row[11], model.score.selection.channels.join(','));
		assert.equal(row[12], model.score.selection.times.join(','));
		assert.equal(row[13], model.score.fullRegisteredBoundary);
		checks += 13;
	}
	for (const model of models) {
		assert.ok(runs.has(model.runIndex));
		assert.equal(model.score.conditions.length, model.score.selection.times.length);
		assert.equal(model.scope === 'full', model.score.fullRegisteredBoundary);
		assert.ok(!model.score.selection.channels.includes(39));
		assert.equal(
			model.score.sampleCount,
			model.score.selection.times.length * 81 * model.score.selection.channels.length,
		);
		checks += 5;
	}
	assert.equal(
		inventory.reduce((sum, source) => sum + source.retainedBytes, 0),
		usage.newRetainedBytes,
	);
	const resource = tables.find((table) => table.id === 'resources');
	assert.ok(resource);
	for (const [index, expected] of [
		[1, usage.newRetainedBytes],
		[2, usage.cpuElapsedMilliseconds],
		[3, usage.gpuElapsedMilliseconds],
		[4, usage.gpuConstructions],
		[5, usage.fullCaptures],
	])
		assert.equal(
			resource.table.rows.reduce((sum, row) => sum + Number(row[index]), 0),
			expected,
		);
	const scores = tables.find((table) => table.id === 'scores');
	assert.ok(scores);
	assert.equal(
		scores.table.rows.length,
		models.reduce((sum, model) => sum + model.score.conditions.length + 1, 0),
	);
	assert.equal(new Set(scores.table.rows.map((row) => `${row[0]}/${row[1]}`)).size, scores.table.rows.length);
	for (const row of scores.table.rows) {
		const model = models.find((model) => model.index === row[0]);
		assert.ok(model);
		const condition =
			row[1] === 'aggregate' ? null : model.score.conditions.find((condition) => condition.time === row[1]);
		assert.ok(condition || row[1] === 'aggregate');
		assert.equal(row[2], condition ? condition.sampleCount : model.score.sampleCount);
		assert.equal(row[3], condition ? condition.squaredError : model.score.squaredError);
		assert.equal(row[4], condition ? condition.rmseMilliwatt : model.score.aggregateRmseMilliwatt);
		checks += 5;
	}
	return checks + 11;
}
