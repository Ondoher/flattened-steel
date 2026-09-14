import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun, identity, readRepository, storage, verifyRun} from '../io/files.mjs';
import {extractBoundary, loadSpectra, measurements, runScores} from '../processing.mjs';
import {ALL_RAYS, selectBoundary} from '../analysis/boundary.mjs';
import {geometricStrata, scoreBoundary} from '../analysis/metrics.mjs';
import {benchmarkRay} from '../numerics/view.js';
import {validateChannelDiagnostics} from './capture/diagnostics.js';
import {readRegistration} from './registration/run.mjs';
import {admitJob} from './resources.mjs';

const MiB = 1024 ** 2;
const sourcePaths = [
	'experiments/sky-accuracy-dials/continuation/analysis.mjs',
	'experiments/sky-accuracy-dials/continuation/analysis/types.d.ts',
	'experiments/sky-accuracy-dials/processing.mjs',
	'experiments/sky-accuracy-dials/analysis/boundary.mjs',
	'experiments/sky-accuracy-dials/analysis/metrics.mjs',
	'experiments/sky-accuracy-dials/continuation/capture/diagnostics.js',
	'experiments/sky-accuracy-dials/continuation/resources.mjs',
	'experiments/sky-accuracy-dials/continuation/registration/run.mjs',
	'experiments/sky-accuracy-dials/io/files.mjs',
	'experiments/sky-accuracy-dials/numerics/view.js',
	'experiments/sky-accuracy-dials/numerics/math.js',
	'experiments/sky-accuracy-dials/numerics/direct.js',
];

/** Read only an artifact declared by its verified immutable parent seal.
 * @param {string} path @param {SkyContinuationAnalysisSeal} seal @returns {Buffer}
 */
function artifactBytes(path, seal) {
	const artifact = seal.artifacts.find((item) => item.path === path);
	assert.ok(artifact, `Source seal does not declare ${path}.`);
	return readRepository(path, artifact);
}

/** Authenticate a source's registered construction and compact component evidence.
 * @param {string} run @param {DialContinuationRegistrationRead} registration
 * @returns {SkyContinuationAnalysisSource}
 */
function loadSource(run, registration) {
	const sealIdentity = verifyRun(run);
	/** @type {SkyContinuationAnalysisSeal} */
	const seal = JSON.parse(readRepository(sealIdentity.path, sealIdentity).toString());
	assert.equal(seal.state, 'accepted');
	assert.equal(seal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(seal.recipe.parameters.jobKind, 'gpu');
	assert.ok(['C1', 'C2'].includes(seal.recipe.parameters.phase));
	assert.ok(['screen', 'full'].includes(seal.recipe.parameters.scope));
	const loaded = loadSpectra(run);
	assert.ok(registration.record.constructionCases.some((item) => item.id === loaded.caseId));
	assert.ok(loaded.control.continuation, 'Source has no continuation capture identity.');
	assert.equal(loaded.control.continuation.referenceMode, 'component');
	assert.deepEqual(loaded.control.continuation.probes, registration.probes);
	assert.deepEqual(loaded.control.continuation.probeScenes, registration.probeScenes);
	/** @type {SkyContinuationAnalysisChannel[]} */ const channels = [];
	/** @type {SkyContinuationAnalysisDiagnostic[]} */ const diagnostics = [];
	for (const channel of loaded.control.channels) {
		/** @type {SkyContinuationAnalysisChannel} */
		const metadata = JSON.parse(
			artifactBytes(`${run}/channel-${String(channel).padStart(2, '0')}.json`, seal).toString(),
		);
		assert.equal(metadata.channel, channel);
		assert.equal(metadata.fieldChecks.length, 4);
		channels.push(metadata);
		assert.equal(
			Boolean(metadata.diagnosticArtifact),
			registration.record.scopes.probeChannels.includes(channel),
			'Component-channel coverage differs from its registered capture scope.',
		);
		if (metadata.diagnosticArtifact) {
			const artifact = metadata.diagnosticArtifact;
			assert.ok(artifact.path.startsWith(`${run}/`) && artifact.path.endsWith('-diagnostics.json.gz'));
			const sealedArtifact = seal.artifacts.find((item) => item.path === artifact.path);
			assert.ok(
				sealedArtifact &&
					sealedArtifact.byteLength === artifact.byteLength &&
					sealedArtifact.sha256 === artifact.sha256,
			);
			const decoded = gunzipSync(readRepository(artifact.path, artifact), {maxOutputLength: 2 * MiB});
			const record = validateChannelDiagnostics(JSON.parse(decoded.toString('utf8')));
			assert.ok(registration.record.scopes.probeChannels.includes(channel));
			for (const probe of record.probes) {
				const frozen = registration.probes.find((item) => item.probeId === probe.probeId);
				assert.ok(
					frozen &&
						frozen.time === probe.time &&
						frozen.gridX === probe.gridX &&
						frozen.gridY === probe.gridY,
				);
				assert.equal(registration.probeScenes.find((scene) => scene.time === probe.time)?.id, probe.sceneId);
			}
			const envelopes = record.probes.filter((probe) => probe.methodId === 'reference-envelope');
			assert.equal(
				envelopes.length,
				registration.probes.length * 4 * 2,
				'A component reference envelope is missing.',
			);
			for (const frozen of registration.probes)
				for (let order = 1; order <= 4; order++)
					for (const representation of [
						'cumulative',
						loaded.control.continuation.finalFirstOrder === 'factored' ? 'grouped-factored-n1' : 'grouped',
					])
						assert.ok(
							envelopes.some(
								(probe) =>
									probe.probeId === frozen.probeId &&
									probe.order === order &&
									probe.representationId === representation,
							),
						);
			diagnostics.push({channel, artifact, record});
		}
	}
	/** @type {{execution: SkyGpuHostResult | null}} */
	const execution = JSON.parse(artifactBytes(`${run}/execution.json`, seal).toString());
	assert.ok(execution.execution?.executionSucceeded && execution.execution.browser);
	const coordinateSha256 = execution.execution.browser.plan.coordinateSha256;
	assert.match(coordinateSha256, /^[a-f0-9]{64}$/u);
	return {
		run,
		phase: seal.recipe.parameters.phase,
		scope: seal.recipe.parameters.scope,
		loaded,
		scores: runScores(run),
		channels,
		diagnostics,
		coordinateSha256,
	};
}

/** Describe the final-view selector without hiding factored J1 inside the stored grouped name.
 * @param {SkyContinuationAnalysisSource} source @param {string} representation @returns {string}
 */
function representationLabel(source, representation) {
	if (representation === 'grouped')
		return source.loaded.control.continuation.finalFirstOrder === 'factored'
			? 'grouped-factored-n1'
			: 'grouped-raw-n1';
	return representation;
}

/** Assemble registered Kider scores; all channels/times remain explicitly scoped.
 * @param {readonly SkyContinuationAnalysisSource[]} sources @returns {SkyContinuationAnalysisTable}
 */
function scoreTable(sources) {
	return {
		columns: [
			'case',
			'scope',
			'representation',
			'view_subdivisions',
			'solar',
			'order',
			'time',
			'sample_count',
			'rmse_mW',
			'full_registered_boundary',
		],
		rows: sources.flatMap((source) =>
			source.scores.rows.flatMap((row) => [
				[
					source.loaded.caseId,
					source.scope,
					representationLabel(source, row.representation),
					row.q,
					row.solar,
					row.order,
					'aggregate',
					row.score.sampleCount,
					row.score.aggregateRmseMilliwatt,
					row.score.fullRegisteredBoundary,
				],
				...row.score.conditions.map((condition) => [
					source.loaded.caseId,
					source.scope,
					representationLabel(source, row.representation),
					row.q,
					row.solar,
					row.order,
					condition.time,
					condition.sampleCount,
					condition.rmseMilliwatt,
					row.score.fullRegisteredBoundary,
				]),
			]),
		),
	};
}

/** Compare the supplied C1 causal pair using exactly matched sparse support and all ordinary spectra.
 * @param {readonly SkyContinuationAnalysisSource[]} sources @returns {SkyContinuationCausalResult}
 */
function causalCheck(sources) {
	const raw = sources.find((source) => source.loaded.caseId === 'r0');
	const factored = sources.find((source) => source.loaded.caseId === 'h-factored');
	const interpretation =
		'Only the explicitly grouped final-view J1 selector changes. L1 still evaluates analytic direct density; this check does not qualify a regenerated density-factored higher-order solver.';
	if (!raw || !factored)
		return {
			assessed: false,
			passed: null,
			parents: [],
			coordinateParity: null,
			higherOrderChecks: 0,
			higherOrderParity: null,
			rawScalarChecks: 0,
			rawCumulativeParity: null,
			interpretation,
		};
	for (const key of ['buildRequest', 'controls', 'scenes', 'channels'])
		assert.deepEqual(
			raw.loaded.control[key],
			factored.loaded.control[key],
			'C1 causal controls differ beyond final J1.',
		);
	assert.deepEqual(raw.loaded.control.continuation, {
		...factored.loaded.control.continuation,
		finalFirstOrder: 'raw',
	});
	assert.equal(factored.loaded.control.continuation.finalFirstOrder, 'factored');
	const coordinateParity = raw.coordinateSha256 === factored.coordinateSha256;
	let higherOrderChecks = 0,
		higherOrderParity = coordinateParity,
		rawScalarChecks = 0,
		rawCumulativeParity = true;
	for (const [index, channel] of raw.channels.entries()) {
		const other = factored.channels[index];
		assert.equal(channel.channel, other.channel);
		for (let order = 1; order < 4; order++) {
			const a = channel.fieldChecks[order],
				b = other.fieldChecks[order];
			higherOrderChecks++;
			higherOrderParity &&=
				a.fieldId === `J${order + 1}` &&
				b.fieldId === a.fieldId &&
				a.count === b.count &&
				a.pureSha256 === b.pureSha256;
		}
	}
	for (const q of raw.loaded.control.controls.viewIntervals)
		for (const solar of raw.loaded.control.controls.solarInterpolations)
			for (let order = 1; order <= 4; order++) {
				const a = extractBoundary(raw.loaded, 'cumulative', q, solar, order);
				const b = extractBoundary(factored.loaded, 'cumulative', q, solar, order);
				for (const [index, value] of a.values.entries()) {
					rawScalarChecks++;
					rawCumulativeParity &&= Object.is(value, b.values[index]);
				}
			}
	return {
		assessed: true,
		passed: coordinateParity && higherOrderParity && rawCumulativeParity,
		parents: [raw.loaded.sealIdentity, factored.loaded.sealIdentity],
		coordinateParity,
		higherOrderChecks,
		higherOrderParity,
		rawScalarChecks,
		rawCumulativeParity,
		interpretation,
	};
}

/** Summarize only complete reference envelopes; per-method attenuation allowances are never promoted to total error.
 * @param {readonly SkyContinuationAnalysisSource[]} sources @param {DialContinuationScientificGates} gates
 * @returns {SkyContinuationAnalysisTable}
 */
function referenceTable(sources, gates) {
	/** @type {SkyContinuationAnalysisCell[][]} */ const rows = [];
	for (const source of sources) {
		/** @type {Map<string, SkyContinuationReferenceAccumulator>} */ const groups = new Map();
		/** @type {Map<string, DialAnalysisBoundary>} */ const boundaries = new Map();
		for (const diagnostic of source.diagnostics)
			for (const probe of diagnostic.record.probes.filter((item) => item.methodId === 'reference-envelope')) {
				assert.ok(['cumulative', 'grouped', 'grouped-factored-n1'].includes(probe.representationId));
				const representation = probe.representationId === 'cumulative' ? 'cumulative' : 'grouped';
				assert.equal(
					probe.representationId === 'grouped-factored-n1',
					representation === 'grouped' && source.loaded.control.continuation.finalFirstOrder === 'factored',
				);
				const key = `${diagnostic.channel}/${probe.time}/${probe.representationId}/${probe.order}`;
				if (!groups.has(key))
					groups.set(key, {
						time: probe.time,
						channel: diagnostic.channel,
						representation: probe.representationId,
						order: probe.order,
						count: 0,
						resolved: 0,
						squaredAllowance: 0,
						maximumAllowance: 0,
						squaredReference: 0,
						aligned: 0,
						squaredError8: 0,
						squaredError16: 0,
						limitations: new Set(),
					});
				const group = groups.get(key);
				group.count++;
				group.squaredReference += probe.value ** 2;
				if (probe.errorAllowance !== null) {
					group.resolved++;
					group.squaredAllowance += probe.errorAllowance ** 2;
					group.maximumAllowance = Math.max(group.maximumAllowance, probe.errorAllowance);
				}
				for (const limitation of probe.limitations ?? []) group.limitations.add(limitation);
				const controls = source.loaded.control.controls;
				if (
					!source.loaded.control.scenes.some((scene) => scene.time === probe.time) ||
					!controls.viewIntervals.includes(8) ||
					!controls.viewIntervals.includes(16) ||
					!controls.solarInterpolations.includes('monotone-cubic')
				)
					continue;
				group.aligned++;
				for (const q of [8, 16]) {
					const selector = `${representation}/${q}/${probe.order}`;
					if (!boundaries.has(selector))
						boundaries.set(
							selector,
							extractBoundary(source.loaded, representation, q, 'monotone-cubic', probe.order),
						);
					const boundary = boundaries.get(selector);
					const index =
						(boundary.times.indexOf(probe.time) * 81 + probe.gridY * 9 + probe.gridX) *
							boundary.channels.length +
						boundary.channels.indexOf(diagnostic.channel);
					const error = boundary.values[index] - probe.value;
					assert.ok(Number.isFinite(error));
					if (q === 8) group.squaredError8 += error ** 2;
					else group.squaredError16 += error ** 2;
				}
			}
		for (const group of groups.values()) {
			const resolved = group.resolved === group.count;
			const allowance = resolved ? Math.sqrt(group.squaredAllowance) : null;
			const aligned = group.aligned === group.count;
			const error8 = aligned ? Math.sqrt(group.squaredError8) : null;
			const error16 = aligned ? Math.sqrt(group.squaredError16) : null;
			const reduction = aligned ? error8 - error16 : null;
			const qualified =
				resolved &&
				aligned &&
				reduction > 0 &&
				allowance <= gates.maximumAllowanceToReduction * reduction &&
				reduction > gates.strictReductionAllowanceMultiplier * allowance;
			rows.push([
				source.loaded.caseId,
				group.channel,
				group.time,
				group.representation,
				group.order,
				group.count,
				group.resolved,
				allowance,
				resolved ? group.maximumAllowance : null,
				Math.sqrt(group.squaredReference),
				group.aligned,
				error8,
				error16,
				reduction,
				qualified,
				[...group.limitations].join(' | '),
			]);
		}
	}
	return {
		columns: [
			'case',
			'channel',
			'time',
			'representation',
			'order',
			'probe_count',
			'resolved_probe_count',
			'allowance_norm_W',
			'maximum_allowance_W',
			'reference_norm_W',
			'aligned_midpoint_probe_count',
			'midpoint8_error_norm_W',
			'midpoint16_error_norm_W',
			'error_norm_reduction_W',
			'reference_resolved_view_improvement',
			'limitations',
		],
		rows,
	};
}

/** Build the fixed geometry groups independently of outcomes; angular groups may overlap.
 * @param {SkyGpuControl} control @returns {readonly DialGeometricStratum[]}
 */
function strata(control) {
	return control.scenes.flatMap((scene) => [
		{id: `${scene.time}/all-rays`, time: scene.time, rayIndices: ALL_RAYS},
		...geometricStrata(
			scene.time,
			ALL_RAYS.map((rayIndex) => {
				const ray = benchmarkRay(
					control.buildRequest.transportSpec,
					scene,
					rayIndex % 9,
					Math.floor(rayIndex / 9),
				);
				const upDot =
					ray.origin.reduce((sum, value, axis) => sum + value * ray.direction[axis], 0) /
					Math.hypot(...ray.origin);
				return {
					rayIndex,
					elevationDegrees: (Math.asin(Math.max(-1, Math.min(1, upDot))) * 180) / Math.PI,
					sunSeparationDegrees: (Math.acos(Math.max(-1, Math.min(1, ray.direction[2]))) * 180) / Math.PI,
				};
			}),
		),
	]);
}

/** Compare declared ladder edges at identical selected views and sample coordinates.
 * @param {readonly SkyContinuationAnalysisSource[]} sources @param {DialAnalysisBoundary} measured
 * @returns {SkyContinuationAnalysisTable}
 */
function contrastTable(sources, measured) {
	/** @type {SkyContinuationAnalysisCell[][]} */ const rows = [];
	const lookup = new Map(sources.map((source) => [source.loaded.caseId, source]));
	const pairs = Array.from({length: 11}, (_unused, index) => [`r${index >= 7 ? 7 : index}`, `r${index + 1}`]);
	pairs.push(['r0', 'h-factored']);
	for (const [baselineId, candidateId] of pairs) {
		const baseline = lookup.get(baselineId),
			candidate = lookup.get(candidateId);
		if (!baseline || !candidate) continue;
		assert.deepEqual(
			baseline.loaded.control.scenes,
			candidate.loaded.control.scenes,
			'Ladder scopes must have identical scenes.',
		);
		assert.deepEqual(
			baseline.loaded.control.channels,
			candidate.loaded.control.channels,
			'Ladder scopes must have identical channels.',
		);
		const commonViews = [8, 16].filter(
			(q) =>
				baseline.loaded.control.controls.viewIntervals.includes(q) &&
				candidate.loaded.control.controls.viewIntervals.includes(q),
		);
		assert.ok(commonViews.length, 'No matched midpoint selector exists for this ladder edge.');
		const groups = strata(baseline.loaded.control).filter((item) => item.rayIndices.length);
		for (const representation of /** @type {const} */ (['cumulative', 'grouped']))
			for (const q of commonViews)
				for (let order = 1; order <= 4; order++) {
					const a = extractBoundary(baseline.loaded, representation, q, 'monotone-cubic', order);
					const b = extractBoundary(candidate.loaded, representation, q, 'monotone-cubic', order);
					for (const group of groups) {
						const selection = {times: [group.time], rayIndices: group.rayIndices, channels: a.channels};
						const first = selectBoundary(a, selection),
							second = selectBoundary(b, selection);
						let squared = 0,
							sum = 0;
						for (const [index, value] of second.values.entries()) {
							const delta = value - first.values[index];
							squared += delta ** 2;
							sum += delta;
						}
						const scoreChannels = a.channels.filter((channel) => channel <= 30);
						const firstScore = scoreBoundary(first, measured, scoreChannels),
							secondScore = scoreBoundary(second, measured, scoreChannels);
						rows.push([
							baselineId,
							candidateId,
							representationLabel(baseline, representation),
							representationLabel(candidate, representation),
							q,
							order,
							group.id,
							first.values.length,
							Math.sqrt(squared),
							Math.sqrt(squared / first.values.length),
							sum / first.values.length,
							firstScore.sampleCount,
							firstScore.aggregateRmseMilliwatt,
							secondScore.aggregateRmseMilliwatt,
							secondScore.aggregateRmseMilliwatt - firstScore.aggregateRmseMilliwatt,
						]);
					}
				}
	}
	return {
		columns: [
			'baseline',
			'candidate',
			'baseline_representation',
			'candidate_representation',
			'view_subdivisions',
			'order',
			'group',
			'numerical_sample_count',
			'radiance_change_norm_W',
			'radiance_change_rms_W',
			'mean_radiance_change_W',
			'score_sample_count',
			'baseline_Kider_rmse_mW',
			'candidate_Kider_rmse_mW',
			'candidate_minus_baseline_Kider_rmse_mW',
		],
		rows,
	};
}

/** Encode every table cell with correct CSV quoting and explicit unresolved nulls.
 * @param {SkyContinuationAnalysisTable} table @returns {string}
 */
function csv(table) {
	return (
		[table.columns, ...table.rows]
			.map((row) =>
				row
					.map((cell) => {
						const value = cell === null ? 'null' : String(cell);
						return /[",\r\n]/u.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
					})
					.join(','),
			)
			.join('\n') + '\n'
	);
}

/** Analyze accepted registered C1/C2 outputs without regenerating or modifying their evidence.
 * All numerical references are fixed-field final-view component references; lower
 * Kider RMSE alone never establishes recurrence, cache, tail or physical accuracy.
 * @param {string} registrationRun - Authenticated C0 campaign registration.
 * @param {readonly string[]} sourceRuns - One to thirteen distinct accepted C1/C2 construction runs.
 * @returns {DialExecutionResult} Verified immutable CPU analysis record, with its causal acceptance outcome.
 */
export function analyzeContinuation(registrationRun, sourceRuns) {
	assert.ok(sourceRuns.length > 0 && sourceRuns.length <= 13 && new Set(sourceRuns).size === sourceRuns.length);
	const registration = readRegistration(registrationRun);
	const started = Date.now(),
		initialBytes = storage().retainedBytes;
	const parentSeals = sourceRuns.map((run) => verifyRun(run));
	const sources = sourcePaths.map((path) => identity(path));
	const phase = sourceRuns.some((path) => {
		/** @type {SkyContinuationAnalysisSeal} */ const seal = JSON.parse(
			readRepository(`${path}/sealed.json`).toString(),
		);
		return seal.recipe.parameters.phase === 'C2';
	})
		? 'C2'
		: 'C1';
	const admission = admitJob(registration, 'cpu', 'component', 4 * MiB, phase);
	const recipe = {
		parents: [
			registration.seal,
			registration.record.inputs,
			...parentSeals,
			...sources,
			...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
			...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		],
		operation:
			'Authenticate immutable C1/C2 spectra and compressed diagnostic evidence; score explicit selectors; compare the exact C1 causal pair and registered ladder edges; summarize empirical fixed-field reference allowances without assuming numerical convergence from Kider agreement.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase,
			sourceRuns,
			nodeVersion: process.version,
			admission,
			equations: {
				radianceChange: 'candidate-control; L2=sqrt(sum(delta^2)); RMS=L2/sqrt(count)',
				reference:
					'For resolved independent fixed-field envelopes: Ugroup=sqrt(sum(Uprobe^2)); any unresolved probe makes Ugroup=null.',
				viewReduction:
					'D=norm(midpoint8-reference)-norm(midpoint16-reference); qualified only if U<=0.2D and D>2U using the frozen registration gates.',
				score: 'Kider RMSE on registered channels present in each source; delta=candidate-baseline, so negative means improved agreement.',
			},
		},
	};
	const run = createRun('c-analysis', recipe);
	/** @type {DialFileIdentity | null} */ let seal = null;
	let accepted = false;
	const guard = () => {
		const current = run.guard();
		assert.ok(
			Date.now() - started <= admission.timeoutMilliseconds,
			'CPU analysis exceeded the remaining campaign time.',
		);
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <= registration.budgets.newRetainedBytes,
		);
		assert.ok(
			current.retainedBytes - initialBytes < admission.allocatedBytes - 128 * 1024,
			'Analysis bytes exhausted the failure/seal reserve.',
		);
	};
	/** Preflight exact encoded bytes before writing a bounded analysis artifact.
	 * @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity}
	 */
	const write = (name, value, derivation = recipe) => {
		guard();
		const bytes = Buffer.isBuffer(value)
			? value
			: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
		assert.ok(
			bytes.length + storage().retainedBytes - initialBytes < admission.allocatedBytes - 128 * 1024,
			'Analysis artifact would exceed its byte allocation and seal reserve.',
		);
		return run.write(name, bytes, derivation);
	};
	try {
		/** @type {SkyContinuationAnalysisSource[]} */ const loaded = [];
		for (const [index, path] of sourceRuns.entries()) {
			guard();
			run.progress(
				'analysis',
				'Authenticating and scoring one immutable construction.',
				index,
				sourceRuns.length,
			);
			loaded.push(loadSource(path, registration));
		}
		assert.equal(
			new Set(loaded.map((item) => item.loaded.caseId)).size,
			loaded.length,
			'Only one source per named construction may enter this comparison.',
		);
		const causal = causalCheck(loaded);
		guard();
		const tables = {
			scores: scoreTable(loaded),
			references: referenceTable(loaded, registration.record.scientificGates),
			contrasts: contrastTable(loaded, measurements()),
		};
		guard();
		/** @type {DialFileIdentity[]} */ const tableArtifacts = [];
		for (const [name, table] of Object.entries(tables)) {
			for (const row of table.rows) {
				assert.equal(row.length, table.columns.length);
				assert.ok(
					row.every((cell) => typeof cell !== 'number' || Number.isFinite(cell)),
					'A nonfinite statistic cannot be serialized as an unresolved null.',
				);
			}
			const json = Buffer.from(JSON.stringify(table)),
				text = csv(table);
			assert.ok(
				json.length + Buffer.byteLength(text) + storage().retainedBytes - initialBytes <
					admission.allocatedBytes - 256 * 1024,
				'Planned analysis tables exceed their retained-data allocation.',
			);
			tableArtifacts.push(write(`${name}.json`, json));
			tableArtifacts.push(write(`${name}.csv`, text));
			guard();
		}
		const limitations = [
			'Component references hold Float32 recurrence fields and reconstruction fixed. Their resolved allowances apply only to final-view integration and independent optical-depth prefixes.',
			'A null allowance is unresolved; it is never zero. The empirical envelope is neither a rigorous bound nor a statistical confidence interval.',
			'Extra-time component probes are not additional ordinary scored scenes. Missing aligned midpoint comparisons remain null.',
			'All ladder differences are measured sensitivities, not proof of mathematical convergence. W51 remains a layout ceiling and N4 excludes an unresolved scattering tail.',
			'Angular strata overlap; their norms and scores must not be summed. Numerical channels and registered score channels differ on screen captures.',
			'Grouped/factored changes affect only the explicitly labelled final-J1 output. Effective cumulative increments do not establish separately integrated pure-order contributions.',
		];
		const summary = {
			schemaId: 'sky-continuation-analysis-v1',
			phase,
			causal,
			limitations,
			tables: tableArtifacts,
			sources: loaded.map((source) => ({
				run: source.run,
				caseId: source.loaded.caseId,
				scope: source.scope,
				seal: source.loaded.sealIdentity,
				controls: source.loaded.control.controls,
				finalFirstOrder: source.loaded.control.continuation.finalFirstOrder,
				channels: source.loaded.control.channels,
				times: source.loaded.control.scenes.map((scene) => scene.time),
				diagnostics: source.diagnostics.map((item) => ({
					channel: item.channel,
					artifact: item.artifact,
					allowancePolicy: item.record.allowancePolicy,
					queryCount: item.record.queryCount,
					evaluationCount: item.record.evaluationCount,
					preparationEvaluationCount: item.record.preparationEvaluationCount,
				})),
			})),
		};
		write('summary.json', summary);
		write(
			'report.md',
			`# Continuation C1/C2 analysis\n\n${loaded.length} authenticated constructions were analyzed. C1 causal parity: ${causal.assessed ? (causal.passed ? 'passed' : 'FAILED') : 'not assessed; the matched pair was not supplied'}.\n\n- [Scores](scores.csv): explicit representation, view, order and time; lower Kider RMSE means better measurement agreement.\n- [Component references](references.csv): resolved/null allowances and midpoint 8/16 errors on aligned frozen probes.\n- [Ladder contrasts](contrasts.csv): candidate-minus-control radiance and score changes by order and geometry.\n- [Complete source and derivation identities](summary.json).\n\n${limitations.map((item) => `- ${item}`).join('\n')}\n`,
		);
		for (const source of sources)
			write(`sources/${source.path}.txt`, readRepository(source.path, source), {
				parents: [source],
				operation: 'Preserve exact analysis implementation bytes.',
			});
		guard();
		accepted = causal.passed !== false;
		const cleanup = run.cleanup();
		seal = run.finish(accepted ? 'accepted' : 'rejected', {
			jobElapsedMilliseconds: Date.now() - started,
			sourceCount: loaded.length,
			causal,
			cleanup,
			tableRows: Object.fromEntries(Object.entries(tables).map(([name, table]) => [name, table.rows.length])),
		});
	} catch (error) {
		const cleanup = run.cleanup();
		run.finish('failed', {
			jobElapsedMilliseconds: Date.now() - started,
			message: String(error),
			stack: error.stack,
			cleanup,
		});
		verifyRun(run.path);
		throw error;
	}
	verifyRun(run.path);
	return {run: run.path, seal, accepted};
}
