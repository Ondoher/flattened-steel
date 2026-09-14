import assert from 'node:assert/strict';
import {CAPTURE_TIMES, SCORE_CHANNELS} from '../../analysis/boundary.mjs';

const rmseUnits = 'Spectral radiance RMSE (mW m^-2 sr^-1 nm^-1)';
const probeChannels = [0, 8, 24, 30];

/** Deduplicate exact parents, rejecting conflicting identities at one path.
 * @param {readonly DialFileIdentity[]} values @returns {readonly DialFileIdentity[]}
 */
function sources(values) {
	/** @type {Map<string, DialFileIdentity>} */ const result = new Map();
	for (const value of values) {
		if (result.has(value.path)) assert.deepEqual(result.get(value.path), value);
		else result.set(value.path, value);
	}
	return [...result.values()];
}

/** Convert a checked clock time to minutes after midnight.
 * @param {string} time @returns {number}
 */
function minutes(time) {
	assert.match(time, /^\d{2}:\d{2}$/);
	const [hour, minute] = time.split(':').map(Number);
	assert.ok(hour < 24 && minute < 60);
	return hour * 60 + minute;
}

/** Require named columns even when the normalized table is empty.
 * @param {SkyClosureTable} input @param {readonly string[]} names @returns {void}
 */
function columns(input, names) {
	for (const name of names) assert.ok(input.table.columns.includes(name), `${input.id} plot requires ${name}.`);
}

/** Access a declared table coordinate without conflating null with zero.
 * @param {SkyClosureTable} input @param {readonly SkyContinuationAnalysisCell[]} row
 * @param {string} name @returns {SkyContinuationAnalysisCell}
 */
function cell(input, row, name) {
	const index = input.table.columns.indexOf(name);
	assert.ok(index >= 0, `${input.id} plot requires ${name}.`);
	return row[index];
}

/** Narrow an available finite numerical value.
 * @param {SkyContinuationAnalysisCell} value @returns {value is number}
 */
function finite(value) {
	return typeof value === 'number' && Number.isFinite(value);
}

/** Prepare three complete historical authorities, preserving their own source identities.
 * @param {DialCampaignSummaryDocument} document @param {DialFileIdentity} identity
 * @returns {SkyClosurePlotRequest}
 */
function historicalPlot(document, identity) {
	assert.equal(document.historical.length, 3);
	for (const model of document.historical) {
		assert.equal(model.score.fullRegisteredBoundary, true);
		assert.deepEqual(model.score.selection.times, CAPTURE_TIMES);
		assert.deepEqual(model.score.selection.channels, SCORE_CHANNELS);
		assert.equal(model.score.sampleCount, 17 * 81 * 31);
		assert.deepEqual(
			model.score.conditions.map((row) => row.time),
			CAPTURE_TIMES,
		);
	}
	return {
		name: 'historical-full-rmse.png',
		title: 'Historical full-boundary Kider agreement',
		description:
			'Historical controls only: all 17 times, 81 rays and registered channels 0-30. Lower RMSE is better.',
		xLabel: 'Local EDT capture time on 2013-05-27',
		yLabel: rmseUnits,
		xTicks: CAPTURE_TIMES.map((time) => ({value: minutes(time), label: time})),
		series: document.historical.map((model) => ({
			label: model.id.replace('known-', ''),
			x: model.score.conditions.map((row) => minutes(row.time)),
			y: model.score.conditions.map((row) => row.rmseMilliwatt),
		})),
		sources: sources([identity, ...document.historical.map((model) => model.source)]),
		scope: 'Historical complete 17-time, 81-ray, 31-channel measurement boundary; no continuation output.',
		caption: 'Historical complete-condition Kider scores, shown separately from continuation screens.',
		provenance: {
			operation:
				'Copy authenticated historical condition RMSE without interpolation, rescoring or changed selectors.',
			selectors: document.historical.map((model) => ({id: model.id, selection: model.score.selection})),
			omittedModels: 0,
		},
	};
}

/** Prepare all admitted screen captures in four pages; prefer the declared working view8.
 * @param {readonly SkyClosureModel[]} models @param {readonly SkyClosureRun[]} inventory
 * @returns {readonly SkyClosurePlotRequest[]}
 */
function screenPlots(models, inventory) {
	const runs = new Map(inventory.map((source) => [source.index, source]));
	const eligible = models.filter(
		(model) =>
			model.scope === 'screen' &&
			model.order === 4 &&
			model.representation === 'grouped' &&
			model.solar === 'monotone-cubic' &&
			[8, 16].includes(model.view),
	);
	/** @type {Map<number, SkyClosureModel>} */ const selected = new Map();
	for (const model of [...eligible].sort((a, b) => a.runIndex - b.runIndex || a.view - b.view || a.index - b.index))
		if (!selected.has(model.runIndex)) selected.set(model.runIndex, model);
	const ordered = [...selected.values()];
	assert.ok(
		ordered.length <= 32,
		'More than 32 accepted screen captures require an explicit plotting selection plan; no capture is silently omitted.',
	);
	for (const model of ordered) {
		assert.equal(model.score.fullRegisteredBoundary, false);
		assert.deepEqual(model.score.selection.times, ['09:30', '11:15', '13:30']);
		assert.deepEqual(model.score.selection.channels, [0, 8, 16, 24, 30]);
		assert.deepEqual(
			model.score.conditions.map((row) => row.time),
			model.score.selection.times,
		);
		assert.equal(model.score.sampleCount, 3 * 81 * 5);
		const source = runs.get(model.runIndex);
		assert.ok(source && source.terminal.state === 'accepted' && source.invalid === null);
	}
	const plotted = ordered,
		ids = new Set(plotted.map((model) => model.index));
	const omitted = eligible.filter((model) => !ids.has(model.index)).map((model) => model.index);
	/** @type {SkyClosurePlotRequest[]} */ const result = [];
	for (let start = 0; start < plotted.length; start += 8) {
		const page = plotted.slice(start, start + 8),
			pageIndex = start / 8 + 1;
		result.push({
			name: `new-screen-rmse-${String(pageIndex).padStart(2, '0')}.png`,
			title: `New screen Kider agreement: page ${pageIndex}/${Math.ceil(plotted.length / 8)}`,
			description: `All ${plotted.length} eligible captures shown at one explicit view each. Three times, 81 rays, five score channels; ${omitted.length} alternate-view selectors remain in CSV. Lower is better.`,
			xLabel: 'Local EDT capture time on 2013-05-27',
			yLabel: rmseUnits,
			xTicks: page[0].score.selection.times.map((time) => ({value: minutes(time), label: time})),
			series: page.map((model) => ({
				label: `${runs.get(model.runIndex).run.split('/').at(-1).slice(0, 5)} ${model.caseId.slice(0, 20)} v${model.view}`,
				x: model.score.conditions.map((row) => minutes(row.time)),
				y: model.score.conditions.map((row) => row.rmseMilliwatt),
			})),
			sources: sources(page.map((model) => runs.get(model.runIndex).seal)),
			scope: 'New three-time screen, grouped N4, score channels 0,8,16,24,30; never the complete B1 boundary.',
			caption: `New screen scores, page ${pageIndex}; working view8 per run, falling back to view16 only when view8 is absent.`,
			provenance: {
				operation:
					'Choose working view8 per accepted run, otherwise view16. All admitted captures appear chronologically in at most four pages of eight series. More than 32 captures blocks plotting until an explicit selection plan exists. No score-based ranking; all selectors remain in CSV.',
				omittedCaptures: 0,
				plottedModelIndices: plotted.map((model) => model.index),
				omittedEligibleModelIndices: omitted,
				totalModelsInCsv: models.length,
				selectors: page.map((model) => ({
					modelIndex: model.index,
					run: runs.get(model.runIndex).run,
					caseId: model.caseId,
					representation: model.representation,
					view: model.view,
					solar: model.solar,
					order: model.order,
					selection: model.score.selection,
				})),
			},
		});
	}
	return result;
}

/** Derive complete four-channel point RMSE while retaining all missing grid coordinates.
 * @param {readonly SkyJ1AssessmentRow[]} rows @returns {readonly SkyClosurePointFigureValue[]}
 */
function pointValues(rows) {
	const times = ['09:30', '12:30'];
	/** @type {Map<string, Map<number, SkyJ1AssessmentRow>>} */ const points = new Map();
	for (const row of rows.filter((row) => times.includes(row.time))) {
		assert.ok(probeChannels.includes(row.channel));
		assert.ok(
			Number.isInteger(row.gridX) &&
				row.gridX >= 0 &&
				row.gridX < 9 &&
				Number.isInteger(row.gridY) &&
				row.gridY >= 0 &&
				row.gridY < 9,
		);
		assert.ok(Number.isFinite(row.raw.residualW) && Number.isFinite(row.factored.residualW));
		const key = `${row.time}/${row.gridX}/${row.gridY}`;
		if (!points.has(key)) points.set(key, new Map());
		assert.ok(!points.get(key).has(row.channel));
		points.get(key).set(row.channel, row);
	}
	return times.flatMap((time) =>
		Array.from({length: 81}, (_, index) => {
			const gridX = index % 9,
				gridY = Math.floor(index / 9),
				channels = points.get(`${time}/${gridX}/${gridY}`);
			const selected = channels
				? probeChannels.flatMap((channel) => (channels.has(channel) ? [channels.get(channel)] : []))
				: [];
			assert.ok(new Set(selected.map((row) => row.probeId)).size <= 1);
			const complete = selected.length === 4;
			const raw = complete
				? 1000 * Math.sqrt(selected.reduce((sum, row) => sum + row.raw.residualW ** 2, 0) / 4)
				: null;
			const factored = complete
				? 1000 * Math.sqrt(selected.reduce((sum, row) => sum + row.factored.residualW ** 2, 0) / 4)
				: null;
			return {
				time,
				gridX,
				gridY,
				probeId: selected[0]?.probeId ?? null,
				channelCount: selected.length,
				raw,
				factored,
				delta: complete ? factored - raw : null,
			};
		}),
	);
}

/** Prepare raw/factored comparisons with shared axes and a separate signed-change plot.
 * @param {readonly SkyJ1AssessmentRow[]} rows @param {DialFileIdentity} identity
 * @returns {readonly SkyClosurePlotRequest[]}
 */
function pointPlots(rows, identity) {
	const points = pointValues(rows),
		selected = points.filter((point) => point.channelCount > 0);
	const complete = selected.map((point, index) => ({point, index})).filter(({point}) => point.raw !== null);
	if (!complete.length) return [];
	const x = complete.map((item) => item.index);
	const common = {
		description: `${complete.length}/162 grid points have four-channel evidence at 09:30/12:30; ${162 - complete.length} are omitted, not zero. This is a subset of the frozen 40-probe campaign.`,
		xLabel: 'Selected point: capture time and grid (x,y); spacing is not angular',
		xTicks: selected.map((point, index) => ({
			value: index,
			label: `${point.time} (${point.gridX},${point.gridY})`,
		})),
		sources: [identity],
		scope: 'Selected 09:30/12:30 component probes, channels 0,8,24,30; not an angular dome or 81-ray condition score.',
		provenance: {
			operation:
				'RMSE_mW = 1000*sqrt(sum residualW^2 over exactly channels 0,8,24,30 /4). Delta = factored minus raw. Missing points remain null.',
			points,
			selectedPoints: selected.length,
			completePoints: complete.length,
			omittedGridPoints: 162 - complete.length,
			xInterpretation:
				'Chronological time, then gridY*9+gridX rank among points with at least one retained channel.',
		},
	};
	return [
		{
			...common,
			name: 'c1-selected-point-rmse.png',
			title: 'C1 selected-point N4 measurement residuals',
			yLabel: rmseUnits,
			kind: 'point',
			series: [
				{label: 'Raw final J1, grouped N4', x, y: complete.map(({point}) => point.raw)},
				{label: 'Factored final J1, grouped N4', x, y: complete.map(({point}) => point.factored)},
			],
			caption: 'C1 raw/factored N4 residual RMSE at matched points; both times and representations share axes.',
		},
		{
			...common,
			name: 'c1-selected-point-change.png',
			title: 'C1 selected-point RMSE change',
			yLabel: 'Factored minus raw RMSE (mW m^-2 sr^-1 nm^-1)',
			kind: 'point',
			series: [{label: 'Negative improves; positive worsens', x, y: complete.map(({point}) => point.delta)}],
			caption: 'C1 matched selected-point RMSE change; incomplete points are not imputed.',
		},
	];
}

/** Prepare fixed 09:30 local view errors for first/middle/last available C2 rungs.
 * @param {SkyClosureTable} input @returns {SkyClosurePlotRequest|null}
 */
function ladderPlot(input) {
	columns(input, [
		'case',
		'group',
		'order',
		'count',
		'error8_norm_W',
		'error16_norm_W',
		'reference_allowance_norm_W',
		'representation',
	]);
	const candidates = input.table.rows
		.map((row, index) => ({row, index}))
		.filter(
			({row}) =>
				cell(input, row, 'group') === 'component/09:30/all-rays' &&
				cell(input, row, 'order') === 4 &&
				cell(input, row, 'representation') === 'grouped',
		)
		.sort((a, b) =>
			String(cell(input, a.row, 'case')).localeCompare(String(cell(input, b.row, 'case')), 'en', {numeric: true}),
		);
	assert.equal(new Set(candidates.map(({row}) => cell(input, row, 'case'))).size, candidates.length);
	const selected = [...new Set([0, Math.floor((candidates.length - 1) / 2), candidates.length - 1])]
		.filter((index) => index >= 0 && index < candidates.length)
		.map((index) => candidates[index]);
	/** @type {DialPlotSeries[]} */ const series = [];
	let available = 0;
	for (const {row} of selected) {
		const allowance = cell(input, row, 'reference_allowance_norm_W');
		const pairs = [8, 16]
			.map((view) => ({view, error: cell(input, row, `error${view}_norm_W`)}))
			.filter((pair) => finite(pair.error) && finite(allowance));
		available += pairs.length;
		if (pairs.length) {
			series.push({
				label: `${cell(input, row, 'case')} error (${pairs.length}/2)`,
				x: pairs.map((pair) => pair.view),
				y: pairs.map((pair) => 1000 * Number(pair.error)),
			});
			series.push({
				label: `${cell(input, row, 'case')} reference allowance`,
				x: pairs.map((pair) => pair.view),
				y: pairs.map(() => 1000 * Number(allowance)),
			});
		}
	}
	if (!series.length) return null;
	return {
		name: 'c2-fixed-field-view-error.png',
		title: 'C2 local fixed-field view integration',
		description: `Selected ${selected.length}/${candidates.length} rungs; ${selected.length * 2 - available}/${selected.length * 2} error values lack complete allowances. Fields have separate references; all rows remain in CSV.`,
		xLabel: 'View subdivisions per altitude segment (within-case work proxy)',
		yLabel: 'L2 error / allowance (mW m^-2 sr^-1 nm^-1)',
		series,
		sources: input.sources,
		scope: 'Component/09:30/all-rays, grouped N4, channels 0,8,24,30; fixed-field integration only.',
		caption: 'C2 local view-integration error versus subdivisions, with empirical reference allowances.',
		provenance: {
			operation:
				'Select fixed 09:30 N4 all-rays group and first/middle/last rungs; multiply L2 errors and allowances by 1000. Missing pairs omitted, never zero.',
			selectedRowIndices: selected.map((item) => item.index),
			candidateRowIndices: candidates.map((item) => item.index),
			columns: input.table.columns,
			rows: selected.map((item) => item.row),
			xInterpretation:
				'Work proxy within each case; not measured time or total query count across altitude grids.',
		},
	};
}

/** Prepare exact C4 scored interaction terms for separate complete screen conditions.
 * @param {SkyClosureTable} input @returns {SkyClosurePlotRequest|null}
 */
function interactionPlot(input) {
	const metrics = [
		'SSE_interaction_W2',
		'additive_cross_W2',
		'interaction_residual_cross_W2',
		'interaction_squared_W2',
	];
	columns(input, ['assessment', 'case', 'view', 'order', 'group', ...metrics]);
	const candidates = input.table.rows
		.map((row, index) => ({row, index}))
		.filter(
			({row}) =>
				cell(input, row, 'view') === 16 &&
				cell(input, row, 'order') === 4 &&
				/^\d{2}:\d{2}\/all-selected-rays$/.test(String(cell(input, row, 'group'))),
		);
	const keys = [
		...new Set(candidates.map(({row}) => `${cell(input, row, 'assessment')}|${cell(input, row, 'case')}`)),
	]
		.sort()
		.slice(0, 3);
	const selected = candidates
		.filter(({row}) => keys.includes(`${cell(input, row, 'assessment')}|${cell(input, row, 'case')}`))
		.sort(
			(a, b) =>
				String(cell(input, a.row, 'assessment')).localeCompare(String(cell(input, b.row, 'assessment'))) ||
				String(cell(input, a.row, 'group')).localeCompare(String(cell(input, b.row, 'group'))),
		);
	const labels = [
		'Actual SSE interaction',
		'Additive main-effect cross term',
		'Interaction with additive residual',
		'Squared spectral interaction',
	];
	const series = metrics
		.map((metric, index) => {
			const values = selected
				.map((item, x) => ({value: cell(input, item.row, metric), x}))
				.filter((item) => finite(item.value));
			return {label: labels[index], x: values.map((item) => item.x), y: values.map((item) => Number(item.value))};
		})
		.filter((item) => item.x.length);
	if (!series.length) return null;
	return {
		name: 'c4-sse-interaction.png',
		title: 'C4 measured-score interaction accounting',
		description: `N4/view16, five score channels; ${selected.length}/${candidates.length} complete-condition rows shown. Terms are not independent errors; all contrasts remain in CSV.`,
		xLabel: 'Joint case and capture time; each group contains all 81 rays',
		yLabel: 'SSE interaction (W^2 m^-4 sr^-2 nm^-2)',
		kind: 'column',
		series,
		xTicks: selected.map(({row}, index) => ({
			value: index,
			label: `${cell(input, row, 'case')} ${String(cell(input, row, 'group')).slice(0, 5)}`,
		})),
		sources: input.sources,
		scope: 'Separate complete screen conditions; five Kider score channels. Overlapping angular subgroups excluded.',
		caption: 'C4 actual SSE interaction and its additive, residual-cross and interaction-square terms.',
		provenance: {
			operation:
				'Copy SSEinteraction = additive_cross + interaction_residual_cross + interaction_squared. No summing of overlapping groups.',
			selectedRowIndices: selected.map((item) => item.index),
			omittedRows: candidates.length - selected.length,
			columns: input.table.columns,
			rows: selected.map((item) => item.row),
		},
	};
}

/** Compare complete fixed-field error vectors at the registered adaptive budget caps.
 * @param {SkyClosureTable} input @returns {SkyClosurePlotRequest|null}
 */
function adaptivePlot(input) {
	columns(input, [
		'case',
		'channel',
		'probe',
		'order',
		'budget_multiplier',
		'runtime_budget',
		'empirical_allowance_W',
		'uniform_absolute_error_W',
		'adaptive_absolute_error_W',
	]);
	const candidates = input.table.rows
		.map((row, index) => ({row, index}))
		.filter(({row}) => cell(input, row, 'order') === 4);
	const cases = [...new Set(candidates.map(({row}) => String(cell(input, row, 'case'))))].sort();
	assert.ok(cases.length <= 2 && cases.every((id) => ['v-raw', 'v-factored'].includes(id)));
	/** @type {DialPlotSeries[]} */ const series = [];
	const groups = [];
	let omitted = 0;
	for (const caseId of cases) {
		const metrics = ['uniform_absolute_error_W', 'adaptive_absolute_error_W', 'empirical_allowance_W'];
		const labels = ['uniform error', 'adaptive error', 'reference allowance'];
		const budgets = [4, 8, 16].map((budget) => {
			const selected = candidates.filter(
				({row}) => cell(input, row, 'case') === caseId && cell(input, row, 'budget_multiplier') === budget,
			);
			assert.equal(
				new Set(selected.map(({row}) => `${cell(input, row, 'probe')}/${cell(input, row, 'channel')}`)).size,
				selected.length,
			);
			const complete =
				selected.length === 160 &&
				selected.every(
					({row}) =>
						metrics.every((metric) => finite(cell(input, row, metric))) &&
						finite(cell(input, row, 'runtime_budget')),
				);
			if (!complete) omitted++;
			const budgetCap = complete
				? selected.reduce((sum, {row}) => sum + Number(cell(input, row, 'runtime_budget')), 0)
				: null;
			const norms = metrics.map((metric) =>
				complete
					? 1000 * Math.sqrt(selected.reduce((sum, {row}) => sum + Number(cell(input, row, metric)) ** 2, 0))
					: null,
			);
			groups.push({
				caseId,
				budgetMultiplier: budget,
				scalarCount: selected.length,
				expectedScalarCount: 160,
				complete,
				runtimeBudgetCap: budgetCap,
				normsMilliwatt: norms,
				selectedRowIndices: selected.map((item) => item.index),
			});
			return {budgetCap, norms, complete};
		});
		for (const [index, label] of labels.entries()) {
			const present = budgets.filter((budget) => budget.complete);
			if (present.length)
				series.push({
					label: `${caseId} ${label}`,
					x: present.map((budget) => budget.budgetCap),
					y: present.map((budget) => budget.norms[index]),
				});
		}
	}
	if (!series.length) return null;
	return {
		name: 'c3-adaptive-fixed-field-error.png',
		title: 'C3 adaptive versus uniform view integration',
		description: `N4 on 40 selected probes x 4 channels; ${omitted}/${cases.length * 3} complete vectors unavailable and omitted. Budgets include trial queries; construction work is separate.`,
		xLabel: 'Allowed runtime query evaluations across 40 probes x 4 channels',
		yLabel: 'L2 fixed-field error / allowance (mW m^-2 sr^-1 nm^-1)',
		series,
		sources: input.sources,
		scope: 'All 40 selected component probes and four channels; each background uses its own fixed-field reference. No whole-solver accuracy claim.',
		caption:
			'C3 equal-budget view-error comparison; horizontal values are permitted query caps, not measured time or actual spent queries.',
		provenance: {
			operation:
				'Require every 160 scalar coordinate per case/budget and finite allowances. Compute 1000*sqrt(sum scalar_error^2) and the same allowance norm. Sum runtime_budget across exactly those coordinates; retain missing groups without zero substitution.',
			groups,
			allowedBudgets: [4, 8, 16],
			channels: probeChannels,
			constructionExcludedFromAbscissa: true,
			actualWorkRemainsInAdaptiveWorkTable: true,
		},
	};
}

/** Show the two registered altitude interactions without treating their norms as true error.
 * @param {SkyClosureTable} input @returns {SkyClosurePlotRequest|null}
 */
function densityPlot(input) {
	columns(input, ['contrast', 'view_subdivisions', 'order', 'group', 'delta_RMS_W']);
	const ids = ['density-by-altitude', 'grouping-by-altitude'];
	const selected = input.table.rows
		.map((row, index) => ({row, index}))
		.filter(
			({row}) =>
				ids.includes(String(cell(input, row, 'contrast'))) &&
				cell(input, row, 'view_subdivisions') === 16 &&
				cell(input, row, 'group') === 'all-three-times/all-rays',
		);
	const series = ids
		.map((id) => {
			const rows = selected
				.filter(({row}) => cell(input, row, 'contrast') === id && finite(cell(input, row, 'delta_RMS_W')))
				.sort((a, b) => Number(cell(input, a.row, 'order')) - Number(cell(input, b.row, 'order')));
			assert.equal(new Set(rows.map(({row}) => cell(input, row, 'order'))).size, rows.length);
			return {
				label: id,
				x: rows.map(({row}) => Number(cell(input, row, 'order'))),
				y: rows.map(({row}) => 1000 * Number(cell(input, row, 'delta_RMS_W'))),
			};
		})
		.filter((item) => item.x.length);
	if (!series.length) return null;
	const available = series.reduce((sum, item) => sum + item.x.length, 0);
	return {
		name: 'c3-density-altitude-interaction.png',
		title: 'C3 density and grouping interactions with altitude',
		description: `View16, all three screen times, six numerical channels. ${available}/8 order/interaction values available; these are response magnitudes, not true-error estimates.`,
		xLabel: 'Cumulative scattering order',
		yLabel: 'Spectral interaction RMS (mW m^-2 sr^-1 nm^-1)',
		series,
		xTicks: [1, 2, 3, 4].map((value) => ({value, label: `N${value}`})),
		sources: input.sources,
		scope: 'All three screen times x 81 rays x 6 numerical channels, including unscored channel 39; fixed grouped view16.',
		caption: 'C3 matched density/altitude and grouping/altitude interactions through cumulative N4.',
		provenance: {
			operation:
				'Copy 1000*delta_RMS_W for registered 2x2 altitude interaction vectors; no measured-score channels or reference errors substituted.',
			selectedRowIndices: selected.map((item) => item.index),
			columns: input.table.columns,
			rows: selected.map((item) => item.row),
			expectedValues: 8,
			availableValues: available,
			cumulativeDifferencesAreNotPureOrders: true,
		},
	};
}

/** Keep local source-density discrepancies separate from all integrated radiance figures.
 * @param {SkyClosureTable} input @returns {SkyClosurePlotRequest|null}
 */
function incomingPlot(input) {
	columns(input, [
		'baseline',
		'candidate',
		'probe',
		'time',
		'channel',
		'empirical_density_allowance',
		'baseline_abs_error',
		'candidate_abs_error',
		'units',
	]);
	/** @type {Map<string, Map<string, number|null>>} */ const values = new Map();
	/** @type {Map<string, number|null>} */ const allowances = new Map();
	for (const row of input.table.rows) {
		assert.equal(cell(input, row, 'units'), 'W m^-3 sr^-1 nm^-1');
		const key = `${cell(input, row, 'time')}|${cell(input, row, 'probe')}|${cell(input, row, 'channel')}`;
		const allowance = cell(input, row, 'empirical_density_allowance');
		assert.ok(allowance === null || finite(allowance));
		if (allowances.has(key)) assert.equal(allowances.get(key), allowance);
		else allowances.set(key, finite(allowance) ? allowance : null);
		for (const prefix of ['baseline', 'candidate']) {
			const caseId = String(cell(input, row, prefix)),
				error = cell(input, row, `${prefix}_abs_error`);
			assert.ok(error === null || finite(error));
			if (!values.has(caseId)) values.set(caseId, new Map());
			const checked = finite(error) && finite(allowance) ? error : null;
			if (values.get(caseId).has(key)) assert.equal(values.get(caseId).get(key), checked);
			else values.get(caseId).set(key, checked);
		}
	}
	const keys = [...allowances.keys()].sort((a, b) => a.localeCompare(b, 'en', {numeric: true}));
	assert.ok(keys.length <= 16 && values.size <= 4);
	const series = [...values]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([caseId, points]) => {
			const present = keys
				.map((key, index) => ({index, value: points.get(key)}))
				.filter((item) => item.value !== undefined && item.value !== null);
			return {label: caseId, x: present.map((item) => item.index), y: present.map((item) => item.value)};
		})
		.filter((item) => item.x.length);
	const present = keys
		.map((key, index) => ({index, value: allowances.get(key)}))
		.filter((item) => item.value !== null);
	if (present.length)
		series.push({
			label: 'Angular reference allowance',
			x: present.map((item) => item.index),
			y: present.map((item) => item.value),
		});
	if (!series.length) return null;
	return {
		name: 'c3-local-j2-discrepancy.png',
		title: 'C3 local J2 density discrepancies',
		description: `${present.length}/16 reference coordinates have admitted angular allowances; ${16 - present.length} omitted, not zero. GPU differences also include finite S/T, packing and reconstruction.`,
		xLabel: 'Ground probe: time, grid suffix and channel; spacing is categorical',
		yLabel: 'Absolute density discrepancy / allowance (W m^-3 sr^-1 nm^-1)',
		kind: 'point',
		series,
		xTicks: keys.map((key, index) => {
			const [time, probe, channel] = key.split('|');
			return {value: index, label: `${time} ${probe.slice(-3)} c${channel}`};
		}),
		sources: input.sources,
		scope: 'Four exact-ground probes x 4 channels. Source-density units, not Kider radiance; angular reference adequacy does not bound complete N4 error.',
		caption:
			'C3 distinct incoming-rule source-density discrepancies at coordinates with admitted angular allowances.',
		provenance: {
			operation:
				'Copy absolute GPU-minus-angular-reference density discrepancies and empirical allowance. Deduplicate repeated baseline/candidate values only after exact equality checks. Omit every coordinate whose allowance is null.',
			coordinateKeys: keys,
			omittedKeys: keys.filter((key) => allowances.get(key) === null),
			plottedCases: [...values.keys()],
			expectedReferenceCoordinates: 16,
			admittedReferenceCoordinates: present.length,
			quantity: 'source-density',
			units: 'W m^-3 sr^-1 nm^-1',
		},
	};
}

/** Build bounded standard-plot requests without filesystem or atmospheric execution.
 * @param {DialCampaignSummaryDocument} historical @param {DialFileIdentity} historicalIdentity
 * @param {readonly SkyClosureModel[]} models @param {readonly SkyClosureRun[]} inventory
 * @param {readonly SkyClosureTable[]} tables @param {readonly SkyJ1AssessmentRow[]|null} j1Rows
 * @param {DialFileIdentity|null} j1Identity @returns {readonly SkyClosurePlotRequest[]}
 */
export function buildClosureFigures(historical, historicalIdentity, models, inventory, tables, j1Rows, j1Identity) {
	assert.equal(j1Rows === null, j1Identity === null);
	const result = [historicalPlot(historical, historicalIdentity), ...screenPlots(models, inventory)];
	if (j1Rows !== null) result.push(...pointPlots(j1Rows, j1Identity));
	const ladder = tables.find((table) => table.id === 'c2-views');
	if (ladder) {
		const plot = ladderPlot(ladder);
		if (plot) result.push(plot);
	}
	const interactions = tables.find((table) => table.id === 'c4-interactions');
	if (interactions) {
		const plot = interactionPlot(interactions);
		if (plot) result.push(plot);
	}
	const adaptive = tables.find((table) => table.id === 'c3-adaptive');
	if (adaptive) {
		const plot = adaptivePlot(adaptive);
		if (plot) result.push(plot);
	}
	const density = tables.find((table) => table.id === 'c3-density-contrasts');
	if (density) {
		const plot = densityPlot(density);
		if (plot) result.push(plot);
	}
	const incoming = tables.find((table) => table.id === 'c3-incoming-density');
	if (incoming) {
		const plot = incomingPlot(incoming);
		if (plot) result.push(plot);
	}
	assert.ok(result.length <= 12);
	assert.equal(new Set(result.map((plot) => plot.name)).size, result.length);
	return result;
}
