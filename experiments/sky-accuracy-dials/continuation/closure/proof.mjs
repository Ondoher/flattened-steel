import assert from 'node:assert/strict';
import {ALL_RAYS, RADIANCE_UNITS} from '../../analysis/boundary.mjs';
import {scoreBoundary, scoreDeltaIdentity, spectralDelta} from '../../analysis/metrics.mjs';
import {
	closureCoreTables,
	closureCsv,
	parseClosureCsv,
	checkedClosureTable,
	verifyClosureScore,
	verifyClosureTables,
} from './tables.mjs';
import {validateClosureJson} from './read.mjs';
import {verifyClosureContrastIdentity} from './assessment-tables.mjs';

/** Manufacture independent layout/accounting/serialization witnesses without filesystem or atmospheric work.
 * @returns {SkyClosureProof}
 */
export function closureImplementationProof() {
	let checks = 0;
	/** @param {() => void} action */ const rejects = (action) => {
		assert.throws(action);
		checks++;
	};
	const identity = {path: 'synthetic/sealed.json', byteLength: 10, sha256: '0'.repeat(64)};
	const times = ['09:30', '11:15', '13:30'],
		channels = [0, 8, 16, 24, 30, 39];
	/** @type {DialAnalysisBoundary} */ const measured = {
		configId: 'manufactured-measurement',
		quantity: 'radiance',
		units: RADIANCE_UNITS,
		sourceIdentity: identity,
		times,
		channels,
		rayIndices: ALL_RAYS,
		values: Float64Array.from(
			{length: times.length * 81 * channels.length},
			(_, index) => 0.01 + (index % 41) * 1e-5,
		),
	};
	const model = {
		...measured,
		configId: 'manufactured-model',
		values: Float64Array.from(measured.values, (value, index) => value + ((index % 7) - 3) * 2e-5),
	};
	const score = scoreBoundary(model, measured, [0, 8, 16, 24, 30]);
	checks += verifyClosureScore(model, measured, score);
	rejects(() => verifyClosureScore({...model, quantity: 'delta'}, measured, score));
	rejects(() => verifyClosureScore(model, measured, {...score, fullRegisteredBoundary: true}));
	rejects(() =>
		verifyClosureScore(model, measured, {...score, aggregateRmseMilliwatt: score.aggregateRmseMilliwatt + 0.1}),
	);
	const candidate = {
		...model,
		configId: 'manufactured-candidate',
		values: Float64Array.from(model.values, (value, index) => value + ((index % 3) - 1) * 1e-5),
	};
	const sse = scoreDeltaIdentity(model, measured, spectralDelta(model, candidate));
	let directBefore = 0,
		directAfter = 0;
	for (let index = 0; index < model.values.length; index++) {
		directBefore += (model.values[index] - measured.values[index]) ** 2;
		directAfter += (candidate.values[index] - measured.values[index]) ** 2;
	}
	const maximumSseResidual = Math.abs(directAfter - directBefore - sse.residualCrossTerm - sse.deltaSquaredNorm);
	assert.ok(maximumSseResidual < 1e-18);
	checks++;
	// Additive radiance can leave roundoff in the difference of four larger SSEs.
	const h = 1,
		a = 1.0001,
		b = 1.0001,
		t = a + b - h,
		direct = t * t - a * a - b * b + h * h,
		cross = 2 * (a - h) * (b - h),
		response = t - h,
		targetChange = 2 * h * response + response * response;
	/** @type {SkyInteractionContrast} */
	const cancellation = {
		id: 'manufactured-additive-cancellation',
		spectralScalarCount: 1,
		scoreScalarCount: 1,
		interactionNormW: 0,
		relativeInteraction: 0,
		squaredErrorInteraction: direct,
		additiveSquaredErrorCrossTerm: cross,
		interactionResidualCrossTerm: 0,
		interactionSquaredNorm: 0,
		identityResidual: direct - cross,
		actualSse: {
			residualCrossTerm: 2 * h * response,
			deltaSquaredNorm: response * response,
			predictedSquaredErrorChange: targetChange,
			actualSquaredErrorChange: t * t - h * h,
			identityResidual: t * t - h * h - targetChange,
		},
	};
	assert.ok(Math.abs(cancellation.identityResidual) > 1e-24 + 1024 * Number.EPSILON * 1e-6);
	verifyClosureContrastIdentity(cancellation);
	checks += 2;
	rejects(() => verifyClosureContrastIdentity({...cancellation, identityResidual: 0}));
	rejects(() => verifyClosureContrastIdentity({...cancellation, squaredErrorInteraction: direct + 1e-8}));
	rejects(() => verifyClosureContrastIdentity({...cancellation, identityResidual: NaN}));
	rejects(() => verifyClosureContrastIdentity({...cancellation, interactionSquaredNorm: Infinity}));
	/** @param {number} index @param {DialRunState} state @param {SkyContinuationJobKind} kind @param {boolean} [invalid] @returns {SkyClosureRun} */
	const source = (index, state, kind, invalid = false) => {
		const seal = {...identity, path: `synthetic/${index}/sealed.json`};
		return {
			index,
			run: `synthetic/${index}`,
			seal,
			retainedBytes: (index + 1) * 100,
			invalid: invalid
				? {
						seal,
						classification: 'invalid-evidence-accounted-only',
						reason: 'manufactured accounting exception',
						jobElapsedMilliseconds: index * 100,
					}
				: null,
			terminal: {
				run: `synthetic/${index}`,
				state,
				finishedAt: '2026-01-01T00:00:00.000Z',
				artifacts: [],
				recipe: {
					parents: [],
					parameters: {
						continuationRegistration: 'synthetic/0',
						jobKind: kind,
						scope: kind === 'gpu' ? 'screen' : 'component',
						phase: 'C2',
					},
				},
				result: {caseId: 'synthetic', jobElapsedMilliseconds: index * 100},
			},
		};
	};
	const inventory = [
		source(0, 'accepted', 'cpu'),
		source(1, 'failed', 'gpu'),
		source(2, 'accepted', 'cpu', true),
		source(3, 'accepted', 'gpu'),
	];
	/** @type {DialContinuationResourceCounters} */ const usage = {
		gpuConstructions: 2,
		fullCaptures: 0,
		gpuElapsedMilliseconds: 400,
		cpuElapsedMilliseconds: 200,
		newRetainedBytes: 1000,
		allocationAmendment: null,
		effectivePhaseAllocations: [],
		retainedBytesByPhase: {C0: 100, C1: 0, C2: 600, C3: 0, C4: 0, C5: 0, C6: 0, 'failure-and-sealing-reserve': 300},
	};
	/** @type {readonly SkyClosureModel[]} */ const models = [
		{
			index: 0,
			runIndex: 3,
			caseId: 'synthetic',
			scope: 'screen',
			representation: 'grouped',
			view: 8,
			solar: 'monotone-cubic',
			order: 4,
			numericalChannels: channels,
			score,
		},
	];
	const tables = closureCoreTables(inventory, models, usage);
	checks += verifyClosureTables(tables, models, inventory, usage);
	rejects(() => verifyClosureTables(tables, models, inventory, {...usage, gpuConstructions: 1}));
	rejects(() => verifyClosureTables(tables, [{...models[0], runIndex: 99}], inventory, usage));
	rejects(() => verifyClosureTables(tables, [{...models[0], scope: 'full'}], inventory, usage));
	rejects(() => verifyClosureTables(tables, [models[0], models[0]], inventory, usage));
	const corrupted = tables.map((table) =>
		table.id === 'models'
			? {
					...table,
					table: {
						...table.table,
						rows: table.table.rows.map((row) =>
							row.map((value, index) => (index === 4 ? 'density' : value)),
						),
					},
				}
			: table,
	);
	rejects(() => verifyClosureTables(corrupted, models, inventory, usage));
	const text = {
		columns: ['text', 'number', 'boolean', 'missing'],
		rows: [
			['comma, quote" newline\n', Number.MIN_VALUE, true, null],
			['null', -0, false, 1e100],
		],
	};
	assert.deepEqual(
		parseClosureCsv(closureCsv(text)),
		[text.columns, ...text.rows].map((row) => row.map(String)),
	);
	checks++;
	rejects(() => parseClosureCsv('"unfinished'));
	rejects(() => parseClosureCsv('unquoted\n'));
	rejects(() => checkedClosureTable({columns: ['duplicate', 'duplicate'], rows: []}));
	rejects(() => checkedClosureTable({columns: ['value'], rows: [[Infinity]]}));
	rejects(() => checkedClosureTable({columns: ['value'], rows: [[1, 2]]}));
	rejects(() => validateClosureJson({value: NaN}));
	validateClosureJson({missing: null, finite: 1, details: ['ordinary', true]});
	checks++;
	return {
		schemaId: 'sky-continuation-closure-proof-v1',
		checks,
		maximumSseResidual,
		scope: 'Manufactured CSV, selector, source-join, invalid/failed resource accounting, independent SSE and cancellation-preserving normalization checks only; no atmospheric execution, evidence allocation or reference qualification.',
	};
}
