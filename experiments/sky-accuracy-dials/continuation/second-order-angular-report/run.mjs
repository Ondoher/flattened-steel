import assert from 'node:assert/strict';
import {
	readSecondOrderCondition,
	assessSecondOrderTransferCompensation,
	secondOrderTransferProof,
} from '../second-order-transfer/context.mjs';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {readSecondOrderAssessmentParent} from '../second-order-analysis/run.mjs';
import {
	readSecondOrderOriginal,
	secondOrderReplacement,
	secondOrderAnalysisProof,
} from '../second-order-analysis/index.mjs';
import {readSecondOrderDialCaptures} from '../second-order-analysis/captures.mjs';
import {assessSecondOrderDial} from '../second-order-analysis/refinement.mjs';
import {secondOrderNumericalCore} from '../second-order-refine/run.mjs';
import {readSecondOrderIncidentAdmission, readSecondOrderIncidentUse} from '../second-order-refine/incident.mjs';
import {
	secondOrderAzimuthPolicy,
	secondOrderAngularBaselinePolicy,
	integrateSecondOrderAzimuth,
} from '../second-order-angular-refine/run.mjs';
import {assessSecondOrderReference} from '../second-order-angular-analysis/index.mjs';
import {secondOrderAngularAnalysisProof} from '../second-order-angular-analysis/proof.mjs';
import {secondOrderSharedReferenceContrast, secondOrderSharedContrastProof} from '../second-order-contrast/index.mjs';

const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
const angularPlanPath = `${topic}/second-order-angular-plan.md`;
const outerPlanPath = `${topic}/second-order-refinement-plan.md`;
const executorPath = 'experiments/sky-accuracy-dials/continuation/second-order-angular-refine/run.mjs';
const allocation = 4 * 1024 ** 2,
	reserve = 768 * 1024;

/** Authenticate the original executable without retaining a copy.
 * @param {DialContinuationToolIdentity} expected - Original C0 runtime.
 * @returns {Promise<void>} Throws on changed executable or version.
 */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let bytes = 0;
	for await (const chunk of createReadStream(expected.path)) {
		hash.update(chunk);
		bytes += chunk.length;
	}
	assert.equal(bytes, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Authenticate a complete held angular target and replay its exact positive-weight integrals.
 * @param {string} run - Accepted complete high-stage run.
 * @param {DialContinuationRegistrationRead} registration - Original C0 identity.
 * @param {SkySecondOrderAssessmentParent} baseline - Authenticated complete Gaussian8 parent.
 * @param {readonly DialFileIdentity[]} sources - Current unchanged numerical implementation.
 * @param {DialFileIdentity} angularPlan - Exact prospectively recorded plan.
 * @returns {SkySecondOrderAngularRead} Complete replayed angular evidence.
 */
export function readSecondOrderAngularReportParent(run, registration, baseline, sources, angularPlan) {
	assert.ok(baseline.complete && baseline.kind === 'gauss8');
	const source = acceptedMechanismInput(run),
		artifact = mechanismArtifact(source, 'view.json');
	const definition = mechanismArtifact(source, 'definition.json');
	/** @type {SkySecondOrderAngularDocument} */ const view = JSON.parse(
		readRepository(artifact.path, artifact).toString(),
	);
	/** @type {SkySecondOrderAngularDefinition} */ const original = JSON.parse(
		readRepository(definition.path, definition).toString(),
	);
	const controls = original.recipe.parameters;
	assert.equal(view.schemaId, 'sky-second-order-angular-view-v1');
	assert.equal(view.stage, 'high');
	assert.equal(controls.stage, 'high');
	assert.equal(view.continuationRegistration, registration.run);
	assert.equal(controls.continuationRegistration, registration.run);
	assert.equal(view.baselineViewRun, baseline.run);
	assert.equal(controls.baselineViewRun, baseline.run);
	const baselineArtifact = baseline.source.identities.find((item) => item.path.endsWith('/view.json'));
	assert.deepEqual(view.baselineViewArtifact, baselineArtifact);
	assert.deepEqual(controls.baselineViewArtifact, baselineArtifact);
	assert.deepEqual(view.nodes, baseline.view.nodes);
	assert.deepEqual(view.channels, [0, 8]);
	assert.deepEqual(view.angularPolicy, secondOrderAzimuthPolicy);
	assert.deepEqual(controls.angularPolicy, secondOrderAzimuthPolicy);
	assert.deepEqual(view.baselinePolicy, secondOrderAngularBaselinePolicy);
	assert.deepEqual(secondOrderNumericalCore(controls.numericalSources), secondOrderNumericalCore(sources));
	assert.deepEqual(
		controls.angularExecutionSources,
		sources.filter((item) => item.path === executorPath),
	);
	assert.deepEqual(
		source.terminal.recipe.parents.find((item) => item.path === angularPlan.path),
		angularPlan,
	);
	assert.ok(
		view.matrixComplete &&
			view.fullViewComplete &&
			view.predictionsPassed &&
			view.checks.every((row) => row.state === 'passed'),
	);
	assert.equal(view.points.length, 32);
	/** @type {DialFileIdentity[]} */ const incidentParents = [];
	const incident = view.points.some((point) => point.incidentCoordinate)
		? readSecondOrderIncidentAdmission(registration.run)
		: null;
	for (const point of view.points) {
		assert.equal(point.baselineParent.run, baseline.run);
		assert.deepEqual(point.baselineParent.artifact, baselineArtifact);
		if (incident) incidentParents.push(...readSecondOrderIncidentUse(point, incident.admission));
	}
	assert.deepEqual(view.baselineIntegrals, baseline.view.integrals);
	assert.deepEqual(view.integrals, integrateSecondOrderAzimuth(view.nodes, baseline.view.points, view.points));
	return {
		run,
		view,
		identities: [
			source.seal,
			definition,
			artifact,
			angularPlan,
			...(incident?.identities ?? []),
			...incidentParents,
		],
	};
}

/** Seal the predeclared angular/reference gates and comparisons of existing numerical controls.
 * @param {string} registrationRun - Original C0 owner.
 * @param {SkySecondOrderReportParents} targets - Explicit complete immutable target runs.
 * @param {string} [transferAdmissionRun] - Accepted adequate morning report for the registered noon condition.
 * @returns {Promise<SkySecondOrderAngularReportResult>} Verified scientific outcomes, including failed predicates.
 */
export async function runSecondOrderAngularReport(registrationRun, targets, transferAdmissionRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const condition = readSecondOrderCondition(registration, transferAdmissionRun);
	const admission = admitJob(registration, 'cpu', 'component', allocation, 'C5');
	await authenticateNode(registration.record.host.node);
	const sources = sourceIdentities(),
		core = secondOrderNumericalCore(sources);
	const angularBytes = readRepository(angularPlanPath),
		angularPlan = identity(angularPlanPath, angularBytes);
	const outerBytes = readRepository(outerPlanPath),
		outerPlan = identity(outerPlanPath, outerBytes);
	assert.ok(
		angularBytes.toString().includes('compensation-attribution-v1') && angularBytes.toString().includes('1e-8 W'),
	);
	const gauss4 = readSecondOrderAssessmentParent(targets.gauss4, registration, core, condition.probeId);
	const simpson4 = readSecondOrderAssessmentParent(targets.simpson4, registration, core, condition.probeId);
	const gauss8 = readSecondOrderAssessmentParent(targets.gauss8, registration, core, condition.probeId);
	const simpson8 = readSecondOrderAssessmentParent(targets.simpson8, registration, core, condition.probeId);
	const views = [gauss4, simpson4, gauss8, simpson8];
	assert.deepEqual(
		views.map((view) => view.kind),
		['gauss4', 'simpson4', 'gauss8', 'simpson8'],
	);
	assert.ok(views.every((view) => view.complete));
	for (const view of views.slice(1)) {
		const accepted = acceptedMechanismInput(view.run);
		assert.deepEqual(
			accepted.terminal.recipe.parents.find((item) => item.path === outerPlan.path),
			outerPlan,
		);
	}
	const angular = readSecondOrderAngularReportParent(targets.angular, registration, gauss8, sources, angularPlan);
	const original = readSecondOrderOriginal(registration),
		captures = readSecondOrderDialCaptures(registration, [condition.probeId]);
	const originalRows = original.rows.filter(
		(row) => row.probeId === condition.probeId && [0, 8].includes(row.channel),
	);
	assert.equal(originalRows.length, 2);
	const parents = [
		registration.seal,
		registration.record.inputs,
		angularPlan,
		outerPlan,
		...condition.identities,
		...views.flatMap((view) => view.source.identities),
		...angular.identities,
		...original.identities,
		...captures.flatMap((value) => value.identities),
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Authenticate exact held outer and angular targets, replay positive-weight integrals, apply prospectively frozen empirical-reference and numerical-dial predicates, and account for frozen-order measurement compensation.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'second-order-angular-assessment',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			caseId: 'second-order-angular-assessment',
			admission,
			targets,
			condition,
			sourceIdentities: sources,
			numericalSources: core,
			node: registration.record.host.node,
		},
	};
	const run = createRun(condition.transferPlan ? 'tr-ref-assess' : 'p2-ref-assess', recipe),
		definition = identity(`${run.path}/definition.json`);
	let written = definition.byteLength,
		failure = /** @type {Error|null} */ (null),
		referenceAdequate = false,
		dialPredictionsPassed = 0;
	/** Write an exclusive compact derived artifact with terminal headroom.
	 * @param {string} name - New artifact basename.
	 * @param {unknown} value - JSON or literal bytes.
	 * @param {DialDerivation} [derivation] - Specific parent/equation record.
	 * @returns {DialFileIdentity} Closed immutable artifact identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} using the frozen angular/reference plan, authenticated parent values and recorded implementation.`,
		},
	) {
		assert.ok(Date.now() - started < Math.min(300000, admission.timeoutMilliseconds) - 30000);
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(written + bytes.length < allocation - reserve);
		const result = run.write(name, bytes, derivation);
		written += result.byteLength;
		return result;
	}
	try {
		run.progress('assessment', 'Replaying held angular/outer reference and matched numerical-dial comparisons.');
		if (condition.transferPlan)
			write('transfer-plan.md', Buffer.from(condition.transferBytes), {
				parents: [condition.transferPlan],
				operation: 'Freeze the exact second-condition accuracy and compensation forecasts.',
			});
		write('angular-plan.md', angularBytes, {
			parents: [angularPlan],
			operation: 'Preserve exact prospective angular/reference admission.',
		});
		write('outer-plan.md', outerBytes, {
			parents: [outerPlan],
			operation: 'Preserve exact prospective outer and 80% dial predictions.',
		});
		const packed = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(packed, {level: 9}), {
			parents: sources,
			operation: 'Pack exact source bytes as base64 JSON and gzip level 9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: packed.length,
				uncompressedSha256: sha256(packed),
			},
		});
		const assessment = assessSecondOrderReference({
			nodes: gauss8.view.nodes,
			baselinePoints: gauss8.view.points,
			baselineAdmitted: gauss8.view.predictionsPassed,
			angularPoints: angular.view.points,
			angularAdmitted: angular.view.predictionsPassed,
			gauss4: {integrals: gauss4.view.integrals, admitted: gauss4.view.predictionsPassed},
			simpson4: {integrals: simpson4.view.integrals, admitted: simpson4.view.predictionsPassed},
			simpson8: {integrals: simpson8.view.integrals, admitted: simpson8.view.predictionsPassed},
			originalH: originalRows.map((row) => ({channel: row.channel, valueWatts: row.contributions[1]})),
		});
		referenceAdequate = assessment.channels.every((row) => row.adequate);
		assert.ok(
			assessment.channels.length === 2 &&
				assessment.channels.every(
					(row) =>
						row.referenceWatts !== null &&
						Number.isFinite(row.referenceWatts) &&
						row.allowanceWatts !== null &&
						Number.isFinite(row.allowanceWatts),
				),
			'A complete-target report must retain finite reference values and complete allowance terms, even when their gates fail.',
		);
		const dials = captures.flatMap((capture) =>
			capture.rows.map((row) => {
				const reference = assessment.channels.find((value) => value.channel === row.channel);
				assert.ok(reference);
				const control = captures
					.find((value) => value.selection.caseId === capture.selection.controlCaseId)
					?.rows.find((value) => value.channel === row.channel && value.probeId === row.probeId);
				const errorWatts = row.secondOrderWatts - reference.referenceWatts;
				const eligible = reference.adequate && row.allowanceWatts !== null && control?.allowanceWatts !== null;
				const controlError = control ? control.secondOrderWatts - reference.referenceWatts : null;
				const reduction = control ? Math.abs(controlError) - Math.abs(errorWatts) : null;
				const comparisonAllowance =
					control && eligible
						? row.allowanceWatts + control.allowanceWatts + 2 * reference.allowanceWatts
						: null;
				const sharedReferenceContrast =
					control && row.allowanceWatts !== null && control.allowanceWatts !== null
						? secondOrderSharedReferenceContrast(
								{value: row.secondOrderWatts, allowance: row.allowanceWatts},
								{value: control.secondOrderWatts, allowance: control.allowanceWatts},
								{value: reference.referenceWatts, allowance: reference.allowanceWatts},
								reference.adequate,
							)
						: null;
				const hypothesis = ['d48-factored', 'd55-raw'].some((name) => capture.selection.runName.endsWith(name));
				const prediction =
					hypothesis && control && eligible
						? assessSecondOrderDial(
								{value: row.secondOrderWatts, allowance: row.allowanceWatts},
								{value: control.secondOrderWatts, allowance: control.allowanceWatts},
								{value: reference.referenceWatts, allowance: reference.allowanceWatts},
							)
						: null;
				if (prediction?.state === 'passed') dialPredictionsPassed++;
				return {
					selection: capture.selection,
					probeId: row.probeId,
					channel: row.channel,
					valueWatts: row.secondOrderWatts,
					allowanceWatts: row.allowanceWatts,
					referenceWatts: reference.referenceWatts,
					referenceAllowanceWatts: reference.allowanceWatts,
					referenceAdequate: reference.adequate,
					errorWatts,
					controlErrorWatts: controlError,
					errorReductionWatts: reduction,
					comparisonAllowanceWatts: comparisonAllowance,
					sharedReferenceContrast,
					direction: !control
						? 'control'
						: comparisonAllowance === null
							? 'unresolved'
							: reduction > comparisonAllowance
								? 'improved'
								: reduction < -comparisonAllowance
									? 'regressed'
									: 'unresolved',
					heldEightyPercentHypothesis: hypothesis,
					prediction,
					predictionState: hypothesis ? (prediction?.state ?? 'unresolved') : null,
				};
			}),
		);
		const signPredictions = views.flatMap((view) =>
			view.view.integrals
				.filter(
					(row) => row.interval === 'all' && row.component === 'combined' && row.rule !== 'ordinary-coarse',
				)
				.map((row) => {
					const reference = assessment.channels.find((value) => value.channel === row.channel);
					const originalRow = originalRows.find((value) => value.channel === row.channel);
					assert.ok(reference && originalRow);
					const differenceWatts = originalRow.contributions[1] - row.valueWatts;
					const allowanceWatts =
						originalRow.allowances[1] === null
							? null
							: originalRow.allowances[1] +
								reference.allowanceWatts +
								Math.abs(row.valueWatts - reference.referenceWatts) +
								row.incidentAllowanceWatts +
								row.viewAllowanceWatts;
					return {
						sourceRun: view.run,
						channel: row.channel,
						rule: row.rule,
						differenceWatts,
						allowanceWatts,
						state:
							!reference.adequate || allowanceWatts === null
								? 'unresolved'
								: differenceWatts > allowanceWatts
									? 'passed'
									: 'failed',
					};
				}),
		);
		assert.equal(signPredictions.length, 16);
		const compensation = originalRows.map((row) => {
			const reference = assessment.channels.find((value) => value.channel === row.channel);
			assert.ok(reference);
			const replacement = secondOrderReplacement(
				row.physicalFirstResidual,
				row.contributions.slice(1),
				reference.referenceWatts,
			);
			return {
				probeId: row.probeId,
				time: row.time,
				channel: row.channel,
				referenceAdequate: reference.adequate,
				referenceAllowanceWatts: reference.allowanceWatts,
				originalP2AllowanceWatts: row.allowances[1],
				originalFirstNumericalWatts: row.firstNumerical,
				originalRawResidualWatts: row.remaining + row.firstNumerical,
				frozenThirdAndFourthWatts: row.contributions.slice(2),
				physicalFirstResidualWatts: row.physicalFirstResidual,
				replacement,
				jointSquaredScoreChange:
					replacement.afterResidualWatts ** 2 - (row.remaining + row.firstNumerical) ** 2,
				firstSecondScoreInteraction: -2 * row.firstNumerical * replacement.deltaWatts,
			};
		});
		if (condition.transferPlan)
			write('transfer-predictions.json', {
				schemaId: 'sky-second-order-transfer-assessment-v1',
				probeId: condition.probeId,
				rows: originalRows.map((row) =>
					assessSecondOrderTransferCompensation(
						row,
						assessment.channels.find((value) => value.channel === row.channel),
					),
				),
			});
		write('reference-assessment.json', {schemaId: 'sky-second-order-reference-assessment-v1', ...assessment});
		write('sign-predictions.json', {
			schemaId: 'sky-second-order-cache-sign-v1',
			operation:
				'For every original fine complete view X, require H-X greater than original H allowance plus U_R, abs(X-R), and original inner X allowance. The reference and every term must be admitted.',
			rows: signPredictions,
		});
		write('dial-comparisons.json', {
			schemaId: 'sky-second-order-physical-dials-v1',
			referenceAdequate,
			rows: dials,
			sharedReferenceContrastScope:
				'Descriptive interval for the difference of absolute errors using the same uncertain reference. It does not replace the prospectively frozen 80% predicate.',
		});
		write('compensation.json', {
			schemaId: 'sky-second-order-component-compensation-v1',
			scope: `Original ${condition.time} ray, channels 0/8; physical P1/P2 with effective original J3/J4 frozen, not a regenerated N4/Kider score.`,
			rows: compensation,
		});
		write('original-dial-captures.json', captures);
		write('proof.json', {
			algebra: secondOrderAnalysisProof(),
			transfer: secondOrderTransferProof(),
			angular: secondOrderAngularAnalysisProof(),
			sharedReference: secondOrderSharedContrastProof(),
			outerIntegralsReplayed: views.reduce((sum, view) => sum + view.view.integrals.length, 0),
			angularIntegralsReplayed: angular.view.integrals.length,
			checkedCaptureEnvelopes: captures.reduce(
				(sum, capture) => sum + capture.rows.reduce((n, row) => n + row.envelopes.length, 0),
				0,
			),
		});
		const report = [
			'# Second-order reference and dial assessment',
			'',
			`Reference adequate in both selected channels: ${referenceAdequate}.`,
			'',
			`Values below are spectral radiance mW. These are component comparisons at the original ${condition.time} ray; they do not qualify whole-N4 or the full Kider score.`,
			'',
			'| Channel | Physical P2 | Empirical allowance | Reference gate |',
			'| ---: | ---: | ---: | --- |',
			...assessment.channels.map(
				(row) =>
					`| ${row.channel} | ${(1000 * row.referenceWatts).toFixed(8)} | ${(1000 * row.allowanceWatts).toFixed(8)} | ${row.state} |`,
			),
			'',
			'| Parent | Channel | Candidate minus P2 | Matched numerical response | 80% hypothesis |',
			'| --- | ---: | ---: | --- | --- |',
			...dials.map(
				(row) =>
					`| ${row.selection.runName} | ${row.channel} | ${(1000 * row.errorWatts).toFixed(8)} | ${row.direction} | ${row.predictionState ?? 'not registered'} |`,
			),
			'',
			'The JSON artifacts retain every frozen outer/angular predicate, separate empirical allowance terms, original controls and envelopes, and exact score/compensation identities. Failed predictions remain evidence. Missing or inadequate references do not pass dial qualification.',
			'',
		];
		write('report.md', Buffer.from(report.join('\n')));
		for (const parent of parents) readRepository(parent.path, parent);
		for (const source of sources) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
		write('execution.json', {completed: true, referenceAdequate, dialPredictionsPassed, gpuJobsExecuted: 0});
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'second-order-angular-assessment',
		caseId: 'second-order-angular-assessment',
		referenceAdequate,
		dialPredictionsPassed,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes: allocation,
		gpuJobsExecuted: 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, item) => sum + item.byteLength, 0) <= allocation);
	if (failure) throw new Error(`Second-order angular assessment failed in ${run.path}: ${failure.message}`);
	return {run: run.path, seal, referenceAdequate, dialPredictionsPassed};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [registration, gauss4, simpson4, gauss8, simpson8, angular] = process.argv.slice(2);
	assert.equal(process.argv.length, 8);
	console.log(
		JSON.stringify(
			await runSecondOrderAngularReport(registration, {gauss4, simpson4, gauss8, simpson8, angular}),
			null,
			2,
		),
	);
}
