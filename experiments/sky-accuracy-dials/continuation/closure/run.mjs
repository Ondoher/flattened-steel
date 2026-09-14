import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {freemem} from 'node:os';
import {gzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {measurements} from '../../processing.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob, campaignUsage} from '../resources.mjs';
import {readMechanismAssessment} from '../mechanism-analysis/read.mjs';
import {
	readClosureInventory,
	readClosureJson,
	acceptedClosureSource,
	hasClosureArtifact,
	readClosureInteractions,
	verifyClosureInteraction,
	validateClosureJson,
} from './read.mjs';
import {
	closureAssessmentTables,
	closureJ1,
	closureLadder,
	closureLocalJ2,
	closureInteractionTables,
} from './assessment-tables.mjs';
import {closureCoreTables, closureCsv, closureModels, verifyClosureTables} from './tables.mjs';
import {buildCoverage} from './coverage.mjs';
import {renderClosureReport} from './report.mjs';
import {buildClosureFigures} from './figures.mjs';
import {renderClosurePlot} from './plotting/render.mjs';
import {closureImplementationProof} from './proof.mjs';

const MIB = 1024 ** 2;
const CLOSURE_FORECAST_BYTES = 12 * MIB;
const CLOSURE_TERMINAL_RESERVE_BYTES = MIB;
const TOPIC = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';

/** Stream and authenticate the actual registered Node tool without retaining its executable.
 * @param {DialContinuationToolIdentity} expected @param {() => void} progress @returns {Promise<void>}
 */
async function authenticateNode(expected, progress) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let bytes = 0,
		last = Date.now();
	for await (const chunk of createReadStream(checkedAbsolute(process.execPath))) {
		hash.update(chunk);
		bytes += chunk.length;
		if (Date.now() - last > 5000) {
			progress();
			last = Date.now();
		}
	}
	assert.equal(bytes, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
	progress();
}

/** Remove duplicate parents only when their complete identities agree.
 * @param {readonly DialFileIdentity[]} values @returns {DialFileIdentity[]}
 */
function uniqueParents(values) {
	const result = new Map();
	for (const value of values) {
		const prior = result.get(value.path);
		if (prior) assert.deepEqual(prior, value);
		else result.set(value.path, value);
	}
	return [...result.values()];
}

/** Validate explicit conditional-phase scope before any reporting allocation.
 * @param {SkyClosureOptions} options @param {readonly SkyClosureRun[]} inventory @returns {readonly DialFileIdentity[]}
 */
function decisionParents(options, inventory) {
	assert.ok(options && typeof options === 'object');
	assert.ok(options.c5Decision && ['skipped', 'not-executed'].includes(options.c5Decision.status));
	assert.ok(
		typeof options.c5Decision.reason === 'string' &&
			options.c5Decision.reason.trim().length > 0 &&
			options.c5Decision.reason.length <= 4096,
	);
	assert.ok(Array.isArray(options.c5Decision.evidenceRuns) && options.c5Decision.evidenceRuns.length <= 32);
	assert.equal(new Set(options.c5Decision.evidenceRuns).size, options.c5Decision.evidenceRuns.length);
	assert.ok((options.c5Decision.candidateCaseIds ?? []).length <= 2);
	for (const id of options.c5Decision.candidateCaseIds ?? []) assert.match(id, /^[a-z][a-z0-9-]{0,31}$/u);
	// Existing attempts remain reportable; no full-qualification success is inferred.
	if (options.c5Decision.status === 'not-executed')
		assert.ok(
			!inventory.some(
				(source) =>
					source.index > 0 &&
					source.terminal.recipe.parameters.phase === 'C5' &&
					source.terminal.recipe.parameters.jobKind === 'gpu',
			),
			'A C5 attempt cannot be labelled not executed. Use an explicit decision to skip remaining qualification.',
		);
	return options.c5Decision.evidenceRuns.map((run) => {
		const source = inventory.find((item) => item.run === run);
		assert.ok(source && !source.invalid);
		return source.seal;
	});
}

/** Build final evidence in a new bounded CPU record. All plots derive retained numbers; no model is executed.
 * Omitted assessments preserve a limited outcome, never an implicit passed phase.
 * @param {string} registrationRun @param {SkyClosureOptions} options @returns {Promise<DialExecutionResult>}
 */
export async function summarizeContinuation(registrationRun, options) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	// Both accounting calls must precede createRun: their scanners require every run sealed.
	const beforeUsage = campaignUsage(registration),
		inventory = readClosureInventory(registration);
	const decisionEvidence = decisionParents(options, inventory),
		admission = admitJob(registration, 'cpu', 'component', CLOSURE_FORECAST_BYTES, 'C6');
	assert.deepEqual(admission.usage, beforeUsage);
	await authenticateNode(registration.record.host.node, () => {});
	const interactions = readClosureInteractions(registration, inventory, options.interactionAssessmentRuns ?? []);
	const planSnapshot = {...registration.record.plan, path: `${registration.run}/continuation-plan.md`};
	readRepository(planSnapshot.path, planSnapshot);
	const documentSources = ['results.md', 'continuation-goals.md', 'continuation-plan.md'].map((name) =>
		identity(`${TOPIC}/${name}`),
	);
	const sources = sourceIdentities(),
		historical = /** @type {DialCampaignSummaryDocument} */ (
			JSON.parse(readRepository(registration.record.summary.path, registration.record.summary).toString())
		);
	validateClosureJson(historical);
	assert.equal(historical.schemaId, 'sky-accuracy-campaign-summary-v1');
	assert.equal(historical.inventory.length, registration.record.historicalRuns.length - 1);
	for (const row of historical.historical) assert.equal(row.score.fullRegisteredBoundary, true);
	const measured = measurements();
	const parents = uniqueParents([
		registration.seal,
		planSnapshot,
		registration.record.inputs,
		registration.record.summary,
		measured.sourceIdentity,
		...inventory.map((source) => source.seal),
		...documentSources,
		...sources,
		...decisionEvidence,
		...(beforeUsage.allocationAmendment ? [beforeUsage.allocationAmendment.seal] : []),
	]);
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Authenticate the complete sealed continuation inventory, reproduce ordinary selected Kider scores and accepted assessment arithmetic, retain every failed/invalid attempt and unresolved reference, and publish scoped tables, standard-tool figures and an explicit conditional-phase decision without executing an atmospheric model.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C6',
			caseId: 'continuation-closure',
			options,
			admission,
			node: registration.record.host.node,
			sources,
			documentSources,
			equations: {
				score: 'Condition RMSE=sqrt(sum((L-M)^2)/count); aggregate=sqrt(mean(condition RMSE squared)); channel39 excluded.',
				compensation:
					'r=n+p; SSE(r)=SSE(n)+SSE(p)+2*n.p. Remaining p includes unseparated higher numerical, tail, physical and observation discrepancies.',
				interaction: 'e=LAB-LA-LB+LH; SSEAB-SSEA-SSEB+SSEH=2*dA.dB+2*(r+dA+dB).e+e.e.',
				resources:
					'Each terminal artifact and its seal counted exactly once; failed jobs retain declared phase; exact00100 is accounting-only failure reserve.',
				reference:
					'Null material components remain unresolved. A fixed-field or local density reference never supplies whole-N4, full17 or scattering-tail adequacy.',
			},
			outputForecastBytes: CLOSURE_FORECAST_BYTES,
			terminalReserveBytes: CLOSURE_TERMINAL_RESERVE_BYTES,
		},
	};
	const initial = storage().retainedBytes,
		run = createRun('c6-closure', recipe),
		definition = identity(`${run.path}/definition.json`);
	let terminal = false,
		lastProgress = 0;
	const guard = () => {
		if (Date.now() - lastProgress >= 15000) {
			run.progress('closure', 'Authenticating, scoring and retaining bounded continuation evidence.');
			lastProgress = Date.now();
		}
		const current = run.guard();
		assert.ok(Date.now() - started < admission.timeoutMilliseconds, 'Closure exhausted its admitted CPU-job time.');
		assert.ok(freemem() >= registration.budgets.hostHeadroomBytes, 'Host-memory headroom reached.');
		assert.ok(
			current.freeBytes >= registration.budgets.minimumFreeDiskBytes &&
				current.scratchBytes <= registration.budgets.liveScratchBytes,
		);
		assert.ok(
			current.retainedBytes <= registration.budgets.totalRetainedBytes &&
				current.retainedBytes - registration.initialStorage.retainedBytes <=
					registration.budgets.newRetainedBytes,
		);
		assert.ok(
			current.retainedBytes - initial < admission.allocatedBytes - CLOSURE_TERMINAL_RESERVE_BYTES,
			'Preserve closure failure and seal reserve.',
		);
	};
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	const write = (
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} using the exact parents, sources, tools, selectors and equations in this immutable closure definition.`,
		},
	) => {
		guard();
		const bytes = Buffer.isBuffer(value)
			? value
			: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
		assert.ok(
			bytes.length + storage().retainedBytes - initial <
				admission.allocatedBytes - CLOSURE_TERMINAL_RESERVE_BYTES,
			'Artifact exceeds remaining closure forecast.',
		);
		return run.write(name, bytes, derivation);
	};
	/** @param {string} name @param {unknown} value @param {readonly DialFileIdentity[]} inputParents @returns {DialFileIdentity} */
	const compressed = (name, value, inputParents) => {
		const bytes = Buffer.from(JSON.stringify(value));
		return write(name, gzipSync(bytes, {level: 9}), {
			parents: uniqueParents([definition, ...inputParents]),
			operation:
				'Losslessly encode exact normalized JSON with Node zlib gzip level9; null remains unavailable, never zero.',
			parameters: {
				node: process.version,
				uncompressedByteLength: bytes.length,
				uncompressedSha256: sha256(bytes),
			},
		});
	};
	try {
		guard();
		write('admission.json', admission);
		const snapshot = [];
		for (const source of sources) {
			guard();
			snapshot.push({...source, base64: readRepository(source.path, source).toString('base64')});
			if (snapshot.length % 32 === 0) await new Promise((resolve) => setImmediate(resolve));
		}
		compressed('sources.json.gz', snapshot, sources);
		/** @type {SkyClosureModel[]} */ const models = [];
		for (const source of inventory) {
			guard();
			if (
				source.index === 0 ||
				source.invalid ||
				source.terminal.state !== 'accepted' ||
				source.terminal.recipe.parameters.jobKind !== 'gpu'
			)
				continue;
			run.progress(
				'scores',
				`Reproduce every ordinary selector from ${path.posix.basename(source.run)}.`,
				source.index,
				inventory.length,
			);
			models.push(...closureModels(source, registration, measured, models.length, guard));
			await new Promise((resolve) => setImmediate(resolve));
		}
		/** @type {SkyClosureTable[]} */ const tables = [...closureCoreTables(inventory, models, beforeUsage)];
		const c1Source = inventory.find(
			(source) =>
				!source.invalid &&
				source.terminal.state === 'accepted' &&
				source.terminal.result.caseId === 'physical-j1-assessment',
		);
		const c1 = c1Source ? closureJ1(c1Source, registration) : null;
		if (c1) {
			tables.push(...c1.tables);
			compressed('c1-summary.json.gz', c1.summary, [c1.artifact]);
		}
		const ladder = options.ladderAssessmentRun ? closureLadder(inventory, options.ladderAssessmentRun) : null;
		if (ladder) {
			tables.push(...ladder.tables);
			compressed('c2-summary.json.gz', ladder.summary, [ladder.artifact]);
		}
		/** @type {SkyMechanismAssessmentRead|null} */ let mechanisms = null;
		if (options.mechanismAssessmentRun) {
			const source = acceptedClosureSource(inventory, options.mechanismAssessmentRun),
				parsed = readClosureJson(source, 'summary.json');
			const summary = /** @type {SkyMechanismAssessmentSummary} */ (parsed.value);
			assert.equal(summary.schemaId, 'sky-mechanism-assessment-v1');
			mechanisms = readMechanismAssessment(
				registration.run,
				path.posix.dirname(summary.sources.catalog.path),
				source.run,
			);
			assert.deepEqual(mechanisms.summary, summary);
			tables.push(
				...closureAssessmentTables(source, 'c3', [
					'scores',
					'adaptive',
					'adaptive-work',
					'adaptive-scores',
					'density-contrasts',
					'incoming-density',
					'incoming-finite-controls',
					'invariance',
					'fixed-field-integration',
					'density-spectrum-layout',
				]),
			);
			compressed('c3-summary.json.gz', summary, [parsed.identity]);
		}
		const localJ2 = inventory
			.filter(
				(source) =>
					!source.invalid &&
					source.terminal.state === 'accepted' &&
					source.terminal.recipe.parameters.phase === 'C2' &&
					hasClosureArtifact(source, 'reference.json'),
			)
			.map((source) => closureLocalJ2(source, registration));
		for (const local of localJ2) tables.push(local.table);
		for (const assessment of interactions.assessments) {
			guard();
			verifyClosureInteraction(assessment, registration, measured);
			await new Promise((resolve) => setImmediate(resolve));
		}
		tables.push(...closureInteractionTables(interactions.assessments));
		const factors = buildCoverage();
		tables.push({
			id: 'factor-coverage',
			description:
				'All original hypotheses and operational/generation controls; scientific outcomes remain explicitly scoped in linked assessments.',
			sources: documentSources,
			table: {
				columns: [
					'factor',
					'stage',
					'controls',
					'range',
					'regeneration',
					'original_prediction',
					'method',
					'historical_outcome',
					'continuation_question',
					'current_assessment',
					'restrictions',
				],
				rows: factors.map((factor) => {
					const owner = ['source', 'transport', 'altitude', 'outgoing', 'incoming-count'].includes(
						factor.factorId,
					)
						? ladder?.source.run
						: ['adaptive-view', 'higher-density', 'incoming-placement-aspect'].includes(factor.factorId)
							? options.mechanismAssessmentRun
							: factor.factorId === 'final-j1'
								? c1Source?.run
								: null;
					return [
						factor.factorId,
						factor.stage,
						factor.controls,
						factor.range,
						factor.regeneration,
						factor.originalPrediction,
						factor.method,
						factor.historicalOutcome,
						factor.currentEvidenceQuestion,
						owner ?? 'No new isolated assessment; historical evidence and declared deferral only.',
						factor.restrictions.join(' '),
					];
				}),
			},
		});
		const proof = closureImplementationProof(),
			tableChecks = verifyClosureTables(tables, models, inventory, beforeUsage);
		/** @type {DialFileIdentity[]} */ const tableArtifacts = [];
		for (const item of tables) {
			guard();
			tableArtifacts.push(compressed(`${item.id}.json.gz`, item.table, item.sources));
			const csv = closureCsv(item.table);
			tableArtifacts.push(
				write(
					`${item.id}.csv${csv.length > 128 * 1024 ? '.gz' : ''}`,
					csv.length > 128 * 1024 ? gzipSync(csv, {level: 9}) : csv,
					{
						parents: uniqueParents([definition, ...item.sources]),
						operation:
							'Encode the normalized columns and primitive cells as fully quoted CSV without rounding; optional gzip level9 preserves exact UTF-8 text.',
						parameters: {
							node: process.version,
							uncompressedByteLength: Buffer.byteLength(csv),
							uncompressedSha256: sha256(Buffer.from(csv)),
						},
					},
				),
			);
			await new Promise((resolve) => setImmediate(resolve));
		}
		const c5 = {
			schemaId: 'sky-continuation-c5-decision-v1',
			...options.c5Decision,
			evidence: decisionEvidence,
			newFullCaptures: 0,
			priorConstructionAttempts: inventory.filter(
				(source) =>
					source.index > 0 &&
					source.terminal.recipe.parameters.phase === 'C5' &&
					source.terminal.recipe.parameters.jobKind === 'gpu',
			).length,
			qualificationEstablished: false,
			wholeN4ReferenceAdequate: false,
			reasonScope:
				'The supplied decision closes or leaves unexecuted conditional qualification only; it does not convert component or screen evidence into a full accuracy claim.',
		};
		write('c5-decision.json', c5, {
			parents: uniqueParents([
				definition,
				...decisionEvidence,
				...(ladder ? [ladder.artifact] : []),
				...(mechanisms ? mechanisms.artifacts : []),
			]),
			operation:
				'Seal the explicit conditional C5 decision with exact supporting assessments; this CPU report constructs zero new full captures.',
		});
		/** @type {SkyClosureClaim[]} */ const claims = [];
		if (c1) {
			const group = c1.summary.overall;
			claims.push({
				category: 'understanding',
				statement: `C1 resolves ${c1.summary.physicalResolvedCount}/${registration.probes.length * registration.record.scopes.probeChannels.length} physical J1 references. Selected-probe J1 error norm changes from ${group.raw.numericalNormW} to ${group.factored.numericalNormW} W; measured N4 component RMSE changes from ${group.raw.componentRmseMilliwatt} to ${group.factored.componentRmseMilliwatt} mW. The signed SSE decomposition identifies compensation without assigning the remaining discrepancy to physics alone.`,
				evidence: ['c1-summary.json.gz', 'c1-compensation.csv'],
			});
			claims.push({
				category: 'numerical-control',
				statement: `C1 final-J1 factoring passes the local error-reduction gate in ${c1.summary.groupReductionQualifiedCount}/${c1.summary.groupCount} declared groups. These are biased component references, not whole-N4 accuracy qualification.`,
				evidence: ['c1-summary.json.gz'],
			});
		}
		if (ladder)
			claims.push({
				category: 'numerical-control',
				statement: `C2 assessed ${ladder.summary.prefix.length}/12 reference rungs; fixed-field view refinement qualifies ${ladder.summary.localView.qualified}/${ladder.summary.localView.groupCount} local groups. Missing rungs: ${ladder.summary.missingCases.join(', ') || 'none'}. Whole finite-N4 allowance remains null.`,
				evidence: ['c2-summary.json.gz', 'c2-adequacy.csv'],
			});
		if (mechanisms)
			for (const [name, part] of Object.entries(mechanisms.summary.packages))
				claims.push({
					category: 'understanding',
					statement: `C3 ${name}: ${part.classification} Local comparisons: ${part.localNumericalComparisons.improved} improved, ${part.localNumericalComparisons.worsened} worsened, ${part.localNumericalComparisons.unresolved} unresolved. ${part.kiderImprovementCount} scoped Kider comparisons improve. C3 supplies observed responses, not prospective quantitative passes or whole-solver accuracy.`,
					evidence: ['c3-summary.json.gz'],
				});
		for (const item of interactions.assessments)
			claims.push({
				category: 'predictable-response',
				statement: `C4 ${item.record.targetCaseId}: ${item.record.rows.filter((row) => row.spectralPassed).length}/8 selectors pass every spectral group and ${item.record.rows.filter((row) => row.scorePassed).length}/8 pass every score forecast. ${item.record.causalCheck ? `Causal additivity within roundoff: ${item.record.causalCheck.withinRoundoff}. ` : ''}These remain screen predictions; no numerical accuracy qualification follows from predictability alone.`,
				evidence: ['c4-forecasts.csv', 'c4-interactions.json.gz'],
			});
		if (!interactions.assessments.length)
			claims.push({
				category: 'predictable-response',
				statement: `No new joint target assessment is available. ${interactions.predictions.length} accepted quantitative registrations remain inventory evidence, not successful forecasts.`,
				evidence: ['runs.csv'],
			});
		claims.push({
			category: 'measurement-improving-accuracy',
			statement: `No new full-scope measurement-improving accuracy dial is qualified. C5 ${options.c5Decision.status}: ${options.c5Decision.reason}`,
			evidence: ['c5-decision.json'],
		});
		for (const local of localJ2)
			claims.push({
				category: 'unresolved',
				statement: `Local J2 has ${local.record.envelopes.filter((row) => row.angularAdequate).length}/${local.record.envelopes.length} adequate angular density envelopes; matrix complete: ${local.record.matrixComplete}. These density references do not bound N4 radiance or a scattering tail.`,
				evidence: [`${local.table.id}.csv`],
			});
		const missingInteractionTargets = ['j1-higher', 'end-t320', 'higher-end'].filter(
			(target) => !interactions.assessments.some((item) => item.record.targetCaseId === target),
		);
		const missing = [
			!ladder ? 'C2 assessment' : null,
			!mechanisms ? 'C3 assessment' : null,
			missingInteractionTargets.length ? `C4 targets ${missingInteractionTargets.join(', ')}` : null,
		].filter(Boolean);
		claims.push({
			category: 'unresolved',
			statement: `Whole-N4 reference components and interactions remain inadequate for a complete accuracy claim. ${missing.length ? `Closure is explicitly limited by missing ${missing.join(', ')}.` : 'The registered assessment packages are present; their reference limitations remain.'} Operational/sample-distribution controls, precision, geometry, solar interpolation and scattering-tail restrictions remain in the factor coverage record.`,
			evidence: ['factor-coverage.csv', 'c5-decision.json'],
		});
		const plotRequests = buildClosureFigures(
			historical,
			registration.record.summary,
			models,
			inventory,
			tables,
			c1?.rows ?? null,
			c1?.rowArtifact ?? null,
		);
		assert.ok(plotRequests.length <= 12);
		compressed(
			'plot-requests.json.gz',
			plotRequests,
			uniqueParents(plotRequests.flatMap((request) => request.sources)),
		);
		/** @type {SkyClosureReportFigure[]} */ const figures = [];
		for (const request of plotRequests) {
			guard();
			run.progress(
				'plot',
				`Render ${request.name} using standard .NET Charting.`,
				figures.length,
				plotRequests.length,
			);
			/** @type {unknown} */ let heartbeatError = null;
			const heartbeat = setInterval(() => {
				try {
					guard();
				} catch (error) {
					heartbeatError = error;
				}
			}, 10000);
			let rendered;
			try {
				rendered = await renderClosurePlot(request);
			} finally {
				clearInterval(heartbeat);
			}
			if (heartbeatError) throw heartbeatError;
			guard();
			write(request.name, rendered.contents, {
				parents: uniqueParents([definition, ...request.sources, rendered.renderer]),
				operation:
					'Render exact retained plot coordinates with System.Windows.Forms.DataVisualization.Charting to PNG in memory; no atmospheric calculation or scratch file.',
				parameters: {request, tool: rendered.tool, format: rendered.format},
			});
			figures.push({path: request.name, caption: request.caption, scope: request.scope});
		}
		const counts = {accepted: 0, rejected: 0, failed: 0, interrupted: 0, invalidAccounted: 0};
		for (const source of inventory)
			if (source.invalid) counts.invalidAccounted++;
			else counts[source.terminal.state]++;
		const fullModels = models.filter((model) => model.scope === 'full').length;
		const limitations = [
			'Accepted execution and scientific success are separate. Failed, rejected and exact progress-invalid evidence is preserved and charged.',
			'Screen spectra use three times, 81 rays and six channels; Kider screens use five channels. Components retain their separately declared forty-probe/four-channel or sixteen local-density scopes.',
			'Historical full17 figures remain historical. Sparse noon/early-morning point plots are selected probes, not full 81-direction domes or equal-angle maps.',
			'A fixed-field view reference qualifies integration only; local J2 uses density units. Missing whole-N4 terms, precision/grouping interactions and the scattering tail are never replaced by zero or an assumed Richardson remainder.',
			'Geometric groups overlap; their counts and SSE values cannot be summed as disjoint global contributions. Cumulative-order differences are effective reconstructed increments.',
			'Whole-job costs include shared construction/readback/reference work and are not isolated per-view kernel timings. Report resource tables exclude this reporting run; its seal and post-seal reconciliation add its exact debit.',
			'All Kider measurements were already known. A prospective claim concerns intervention outcomes withheld until after an immutable prediction, not unseen measurements.',
		];
		/** @type {SkyClosureReportView} */ const report = {
			title: 'Predictable sky accuracy dials: continuation closure',
			registrationRun: registration.run,
			counts,
			scopes: {
				historicalFull:
					'The accepted first-campaign summary supplies separately authenticated 17-time, 81-ray, 31-score-channel history; its separate two-channel N6 evidence is not a full-spectrum oracle.',
				newMeasurements: fullModels
					? `${fullModels} actual full-boundary model selectors and ${models.length - fullModels} screen selectors are retained separately; no C5 qualification is inferred.`
					: `${models.length} actual three-time screen model selectors; no new complete seventeen-time qualification.`,
				components:
					'Adaptive rows include 243 ordinary rays plus sixteen component-only rays. Independent view references cover forty frozen probes at four channels; local J2 covers four ground queries at those four channels.',
			},
			c5: {status: options.c5Decision.status, reason: options.c5Decision.reason},
			claims,
			factors,
			figures,
			limitations,
			resourceSummary: `Before this reporting run: ${beforeUsage.gpuConstructions} GPU jobs, ${beforeUsage.fullCaptures} full captures, ${beforeUsage.gpuElapsedMilliseconds} GPU-job ms, ${beforeUsage.cpuElapsedMilliseconds} CPU-job ms, ${beforeUsage.newRetainedBytes} new retained bytes. Failed attempts are included. This report has an ${admission.allocatedBytes}-byte forecast within C6; exact own bytes/time are supplied by its terminal seal.`,
		};
		write('report.md', renderClosureReport(report));
		write('proof.json', {
			...proof,
			actualTableChecks: tableChecks,
			actualModelCount: models.length,
			actualInventoryCount: inventory.length,
			maximumC1SseResidual: c1?.maximumResidual ?? null,
			recomputedInteractionSelectors: interactions.assessments.reduce(
				(sum, item) => sum + item.record.rows.length,
				0,
			),
		});
		write('summary.json', {
			schemaId: 'sky-continuation-closure-v1',
			registration: registration.seal,
			scope: 'explicit-mixed-scopes-not-pooled',
			counts,
			inventory: inventory.map(({index, run, seal, retainedBytes, invalid, terminal}) => ({
				index,
				run,
				seal,
				retainedBytes,
				state: terminal.state,
				invalidClassification: invalid?.classification ?? null,
			})),
			models,
			assessmentSelections: options,
			limitedOutcome: missing.length > 0,
			missingAssessments: missing,
			missingInteractionTargets,
			wholeN4ReferenceAdequate: false,
			measurementImprovingAccuracyQualified: false,
			c5,
			claims,
			resourcesBeforeReport: beforeUsage,
			resourceSelfAccounting:
				'Own seal contains exact bytes and elapsed time; post-seal reconciliation in command output includes this record.',
			tableArtifacts,
			figures,
			limitations,
		});
		for (const parent of parents) {
			guard();
			readRepository(parent.path, parent);
			await new Promise((resolve) => setImmediate(resolve));
		}
		await authenticateNode(registration.record.host.node, guard);
		guard();
		const cleanup = run.cleanup(),
			seal = run.finish('accepted', {
				caseId: 'continuation-closure',
				jobElapsedMilliseconds: Date.now() - started,
				limitedOutcome: missing.length > 0,
				ordinaryModelCount: models.length,
				tableChecks,
				wholeN4ReferenceAdequate: false,
				measurementImprovingAccuracyQualified: false,
				cleanup,
			});
		terminal = true;
		assert.deepEqual(verifyRun(run.path), seal);
		const own = /** @type {SkyClosureTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
		assert.ok(
			seal.byteLength + own.artifacts.reduce((sum, item) => sum + item.byteLength, 0) <= admission.allocatedBytes,
		);
		const after = campaignUsage(registration);
		assert.equal(after.gpuConstructions, beforeUsage.gpuConstructions);
		assert.equal(after.fullCaptures, beforeUsage.fullCaptures);
		assert.equal(
			after.cpuElapsedMilliseconds,
			beforeUsage.cpuElapsedMilliseconds + own.result.jobElapsedMilliseconds,
		);
		assert.equal(
			after.retainedBytesByPhase.C6 - beforeUsage.retainedBytesByPhase.C6,
			seal.byteLength + own.artifacts.reduce((sum, item) => sum + item.byteLength, 0),
		);
		console.log(JSON.stringify({run: run.path, closureReconciliation: after}));
		return {run: run.path, seal, accepted: true};
	} catch (error) {
		if (!terminal) {
			run.finish('failed', {
				caseId: 'continuation-closure',
				jobElapsedMilliseconds: Date.now() - started,
				message: String(error),
				cleanup: run.cleanup(),
			});
			terminal = true;
			verifyRun(run.path);
		}
		throw error;
	}
}
