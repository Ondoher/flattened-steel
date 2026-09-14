import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {angularEnvelopes} from '../j2/evaluate.mjs';
import {acceptedClosureSource, readClosureJson, hasClosureArtifact} from './read.mjs';
import {checkedClosureTable} from './tables.mjs';

/** Preserve producer-normalized tables without inventing absent columns or replacing nulls.
 * @param {SkyClosureRun} source @param {string} prefix @param {readonly string[]} names
 * @returns {readonly SkyClosureTable[]}
 */
export function closureAssessmentTables(source, prefix, names) {
	return names
		.filter((name) => hasClosureArtifact(source, `${name}.json.gz`))
		.map((name) => {
			const parsed = readClosureJson(source, `${name}.json.gz`);
			return {
				id: `${prefix}-${name}`,
				description: `Exact normalized ${name} from ${source.run}; original scope, units and nulls preserved.`,
				sources: [parsed.identity],
				table: checkedClosureTable(parsed.value),
			};
		});
}

/** Authenticate the selected C2 assessment and each exact accepted rung parent.
 * @param {readonly SkyClosureRun[]} inventory @param {string} run
 * @returns {{source:SkyClosureRun,artifact:DialFileIdentity,summary:SkyClosureLadderSummary,tables:readonly SkyClosureTable[]}}
 */
export function closureLadder(inventory, run) {
	const source = acceptedClosureSource(inventory, run),
		parsed = readClosureJson(source, 'summary.json');
	const summary = /** @type {SkyClosureLadderSummary} */ (parsed.value);
	assert.equal(summary.schemaId, 'sky-continuation-reference-ladder-assessment-v1');
	assert.equal(source.terminal.recipe.parameters.phase, 'C2');
	assert.equal(summary.finiteN4ReferenceAdequate, false);
	assert.equal(summary.totalReferenceAllowanceW, null);
	assert.deepEqual(
		summary.prefix,
		Array.from({length: summary.prefix.length}, (_, index) => `r${index}`),
	);
	assert.deepEqual(
		summary.missingCases,
		Array.from({length: 12 - summary.prefix.length}, (_, index) => `r${index + summary.prefix.length}`),
	);
	assert.deepEqual(
		summary.sources.map((item) => item.caseId),
		summary.prefix,
	);
	for (const item of summary.sources) assert.deepEqual(acceptedClosureSource(inventory, item.run).seal, item.seal);
	for (const artifact of summary.artifacts) {
		assert.ok(
			source.terminal.artifacts.some(
				(item) =>
					item.path === artifact.path &&
					item.sha256 === artifact.sha256 &&
					item.byteLength === artifact.byteLength,
			),
		);
		readRepository(artifact.path, artifact);
	}
	assert.equal(
		summary.localView.qualified + summary.localView.rejected + summary.localView.unavailable,
		summary.localView.groupCount,
	);
	/** @type {SkyClosureTable[]} */ const tables = [];
	for (const artifact of summary.artifacts) {
		const name = artifact.path.slice(source.run.length + 1);
		if (!/^[a-z][a-z0-9-]*\.json\.gz$/u.test(name)) continue;
		const data = readClosureJson(source, name),
			value = data.value;
		if (value && typeof value === 'object' && !Array.isArray(value) && ('columns' in value || 'rows' in value))
			tables.push({
				id: `c2-${name.slice(0, -8)}`,
				description: `Exact ${name} from the authenticated ladder assessment; original units, scope and unresolved values are preserved.`,
				sources: [data.identity],
				table: checkedClosureTable(value),
			});
	}
	assert.ok(tables.some((table) => table.id === 'c2-adequacy') && tables.some((table) => table.id === 'c2-scores'));
	return {source, artifact: parsed.identity, summary, tables};
}

/** Recheck the accepted C1 causal decomposition from the retained scalar rows.
 * @param {SkyClosureRun} source @param {DialContinuationRegistrationRead} registration
 * @returns {{summary:SkyClosureJ1Summary,artifact:DialFileIdentity,rows:readonly SkyJ1AssessmentRow[],rowArtifact:DialFileIdentity,tables:readonly SkyClosureTable[],maximumResidual:number}}
 */
export function closureJ1(source, registration) {
	const summaryFile = readClosureJson(source, 'summary.json'),
		rowsFile = readClosureJson(source, 'rows.json');
	const summary = /** @type {SkyClosureJ1Summary} */ (summaryFile.value),
		rows = /** @type {readonly SkyJ1AssessmentRow[]} */ (rowsFile.value);
	assert.equal(summary.schemaId, 'sky-continuation-physical-j1-assessment-v1');
	assert.equal(rows.length, registration.probes.length * registration.record.scopes.probeChannels.length);
	assert.equal(new Set(rows.map((row) => `${row.probeId}/${row.channel}`)).size, rows.length);
	let maximumResidual = 0;
	for (const row of rows) {
		const probe = registration.probes.find((item) => item.probeId === row.probeId);
		assert.ok(probe && registration.record.scopes.probeChannels.includes(row.channel));
		assert.equal(row.time, probe.time);
		assert.equal(row.gridX, probe.gridX);
		assert.equal(row.gridY, probe.gridY);
		for (const part of [row.raw, row.factored]) {
			assert.equal(part.residualW, part.fourthOrderW - row.measuredW);
			if (row.physicalW === null) {
				assert.equal(part.numericalW, null);
				assert.equal(part.remainingW, null);
				continue;
			}
			assert.equal(part.numericalW, part.firstOrderW - row.physicalW);
			assert.equal(part.remainingW, part.fourthOrderW - part.firstOrderW + row.physicalW - row.measuredW);
			const expanded = part.numericalW ** 2 + part.remainingW ** 2 + 2 * part.numericalW * part.remainingW;
			const residual = Math.abs(part.residualW ** 2 - expanded);
			maximumResidual = Math.max(maximumResidual, residual);
			assert.ok(
				residual <=
					1e-24 +
						512 *
							Number.EPSILON *
							Math.max(
								part.residualW ** 2,
								part.numericalW ** 2,
								part.remainingW ** 2,
								Math.abs(2 * part.numericalW * part.remainingW),
							),
			);
		}
	}
	/** @type {SkyContinuationAnalysisCell[][]} */ const cells = rows.flatMap((row) =>
		['raw', 'factored'].map((name) => {
			const part = name === 'raw' ? row.raw : row.factored;
			return [
				row.probeId,
				row.time,
				row.gridX,
				row.gridY,
				row.channel,
				name,
				part.numericalW,
				part.remainingW,
				part.residualW,
				part.crossTermW2,
				row.reductionW,
				row.reductionAllowanceW,
				row.reductionQualified,
			];
		}),
	);
	return {
		summary,
		artifact: summaryFile.identity,
		rows,
		rowArtifact: rowsFile.identity,
		maximumResidual,
		tables: [
			{
				id: 'c1-compensation',
				description:
					'Biased forty-probe four-channel decomposition r=n+p; p includes higher numerical, tail, physical and observation discrepancies.',
				sources: [summaryFile.identity, rowsFile.identity],
				table: {
					columns: [
						'probe',
						'time',
						'grid_x',
						'grid_y',
						'channel',
						'representation',
						'J1_numerical_error_W',
						'remaining_residual_W',
						'N4_measured_residual_W',
						'signed_cross_term_W2',
						'J1_reduction_W',
						'reduction_allowance_W',
						'local_J1_reduction_qualified',
					],
					rows: cells,
				},
			},
		],
	};
}

/** Preserve local density envelopes separately from any Kider radiance score.
 * @param {SkyClosureRun} source @param {DialContinuationRegistrationRead} registration
 * @returns {{artifact:DialFileIdentity,record:SkyJ2ReferenceDocument,table:SkyClosureTable}}
 */
export function closureLocalJ2(source, registration) {
	const parsed = readClosureJson(source, 'reference.json'),
		record = /** @type {SkyJ2ReferenceDocument} */ (parsed.value);
	assert.equal(record.schemaId, 'sky-local-j2-reference-v1');
	assert.equal(record.units, 'W m^-3 sr^-1 nm^-1');
	assert.deepEqual(record.channels, registration.record.scopes.probeChannels);
	assert.equal(record.targets.length, 4);
	assert.equal(record.envelopes.length, 16);
	assert.deepEqual(record.envelopes, angularEnvelopes(record.targets, record.channels, record.rules));
	assert.equal(new Set(record.envelopes.map((row) => `${row.targetId}/${row.channel}`)).size, 16);
	for (const row of record.envelopes) {
		assert.ok(record.targets.some((target) => target.id === row.targetId));
		assert.ok(record.channels.includes(row.channel));
		assert.equal(row.empiricalAllowance !== null, row.angularAdequate);
		if (row.angularAdequate) assert.ok(row.estimate !== null && row.shrinking && row.reason === null);
	}
	return {
		artifact: parsed.identity,
		record,
		table: {
			id: `local-j2-${source.index}`,
			description:
				'Sixteen local source-density envelopes; missing or inadequate angular references retain null allowances and cannot qualify N4 radiance.',
			sources: [parsed.identity],
			table: {
				columns: [
					'target',
					'time',
					'grid_x',
					'grid_y',
					'channel',
					'quantity',
					'units',
					'reference_density',
					'empirical_allowance',
					'last_midpoint_change',
					'placement_difference',
					'density_floor',
					'shrinking',
					'angular_adequate',
					'reason',
				],
				rows: record.envelopes.map((row) => {
					const target = record.targets.find((target) => target.id === row.targetId);
					return [
						row.targetId,
						target.time,
						target.gridX,
						target.gridY,
						row.channel,
						'density',
						record.units,
						row.estimate,
						row.empiricalAllowance,
						row.lastMidpointChange,
						row.placementDifference,
						row.densityFloor,
						row.shrinking,
						row.angularAdequate,
						row.reason,
					];
				}),
			},
		},
	};
}

/** Check lossless normalization after the caller has replayed the producer's
 * operand-scaled SSE validation with verifyClosureInteraction. A bound scaled
 * only by the small factorial difference would reject valid cancellation.
 * @param {SkyInteractionContrast} contrast @returns {void}
 */
export function verifyClosureContrastIdentity(contrast) {
	const expected =
		contrast.additiveSquaredErrorCrossTerm +
		contrast.interactionResidualCrossTerm +
		contrast.interactionSquaredNorm;
	for (const value of [expected, contrast.squaredErrorInteraction, contrast.identityResidual])
		assert.ok(Number.isFinite(value), 'C4 SSE normalization requires finite terms.');
	assert.equal(
		contrast.squaredErrorInteraction - expected,
		contrast.identityResidual,
		'C4 table normalization changed the producer SSE identity residual.',
	);
}

/** Normalize fully replayed C4 diagnostics, preserving misses and the complete SSE interaction equation.
 * @param {readonly SkyClosureInteraction[]} assessments @returns {readonly SkyClosureTable[]}
 */
export function closureInteractionTables(assessments) {
	/** @type {SkyContinuationAnalysisCell[][]} */ const scores = [],
		contrasts = [];
	for (const item of assessments)
		for (const row of item.record.rows) {
			for (const score of row.scores)
				scores.push([
					item.source.run,
					item.record.targetCaseId,
					row.view,
					row.order,
					score.time ?? 'aggregate',
					score.sampleCount,
					score.predictedGainMilliwatt,
					score.actualGainMilliwatt,
					score.forecastErrorMilliwatt,
					score.allowanceMilliwatt,
					score.directionPassed,
					score.passed,
					row.spectralPassed,
					false,
				]);
			for (const contrast of row.contrasts) {
				verifyClosureContrastIdentity(contrast);
				contrasts.push([
					item.source.run,
					item.record.targetCaseId,
					row.view,
					row.order,
					contrast.id,
					contrast.spectralScalarCount,
					contrast.scoreScalarCount,
					contrast.interactionNormW,
					contrast.relativeInteraction,
					contrast.squaredErrorInteraction,
					contrast.additiveSquaredErrorCrossTerm,
					contrast.interactionResidualCrossTerm,
					contrast.interactionSquaredNorm,
					contrast.identityResidual,
				]);
			}
		}
	const sources = assessments.map((item) => item.artifact);
	return [
		{
			id: 'c4-forecasts',
			description:
				'Prospective screen forecasts only; positive gain is H RMSE minus target RMSE. Scientific misses remain accepted diagnostics.',
			sources,
			table: {
				columns: [
					'assessment',
					'case',
					'view',
					'order',
					'time',
					'score_scalars',
					'predicted_gain_mW',
					'actual_gain_mW',
					'forecast_error_mW',
					'allowed_error_mW',
					'direction_passed',
					'score_passed',
					'spectral_passed',
					'whole_N4_accuracy_qualified',
				],
				rows: scores,
			},
		},
		{
			id: 'c4-interactions',
			description:
				'Spectral interaction is separate from SSE interaction; the SSE expansion includes the additive main-effect cross term even with zero spectral interaction.',
			sources,
			table: {
				columns: [
					'assessment',
					'case',
					'view',
					'order',
					'group',
					'spectral_scalars',
					'score_scalars',
					'interaction_norm_W',
					'relative_interaction',
					'SSE_interaction_W2',
					'additive_cross_W2',
					'interaction_residual_cross_W2',
					'interaction_squared_W2',
					'identity_residual_W2',
				],
				rows: contrasts,
			},
		},
	];
}
