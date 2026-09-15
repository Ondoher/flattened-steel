import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
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
import {readSecondOrderRefinementParent, secondOrderNumericalCore} from '../second-order-refine/run.mjs';
import {secondOrderOuterRule} from '../second-order-rule/geometry.mjs';
import {integrateSecondOrderView} from '../second-order-view/integrate.mjs';
import {viewAngularRules} from '../second-order-view/geometry.mjs';
import {readSecondOrderOriginal, diagnoseSecondOrderView, secondOrderAnalysisProof} from './index.mjs';
import {readSecondOrderDialCaptures} from './captures.mjs';
import {assessSecondOrderOuter, secondOrderRefinementProof} from './refinement.mjs';
import {readSecondOrderCondition} from '../second-order-transfer/context.mjs';

const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/second-order-refinement-plan.md';
const allocatedBytes = 4 * 1024 ** 2,
	terminalReserve = 768 * 1024;

/** Authenticate the original pinned runtime without retaining its executable bytes.
 * @param {DialContinuationToolIdentity} expected - Original C0 tool identity.
 * @returns {Promise<void>} Throws if any runtime identity changes.
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

/** Reproduce an entire stored view from the authenticated physical points and original rule.
 * @param {string} run - Exact accepted source run.
 * @param {DialContinuationRegistrationRead} registration - Original C0 owner.
 * @param {readonly DialFileIdentity[]} numericalSources - Exact unchanged core used for physical reuse.
 * @param {SkySecondOrderProbeId} [probeId] - Exact original or registered transfer ray.
 * @returns {SkySecondOrderAssessmentParent} Completely replayed integral, including missing states.
 */
export function readSecondOrderAssessmentParent(run, registration, numericalSources, probeId = 'p-0930-5-7') {
	assert.ok(['p-0930-5-7', 'p-1230-3-5'].includes(probeId));
	/** @type {SkySecondOrderReusePolicy} */ const policy = {
		channels: [0, 8],
		physicalProfile: 'simpson-expanded-medium',
		outerStrategy: 'global',
		angularRules: viewAngularRules,
	};
	const source = readSecondOrderRefinementParent(run, registration, policy, numericalSources);
	const viewArtifact = source.identities.find((item) => item.path.endsWith('/view.json'));
	assert.ok(viewArtifact);
	/** @type {SkySecondOrderAssessmentView} */ const view = JSON.parse(
		readRepository(viewArtifact.path, viewArtifact).toString(),
	);
	/** @type {SkySecondOrderAssessmentKind} */ let kind;
	if (!view.stage) {
		assert.equal(run, 'tmp/experiments/sky-accuracy-dials/runs/00164-p2-view-coarse');
		assert.equal(source.identities[0].sha256, 'b6c7281c93fe8d8c1e0ca1e41c480cd7b63100215c03bc60434ac16f6174eefe');
		kind = 'gauss4';
	} else if (view.stage === 'gauss4') {
		assert.equal(probeId, 'p-1230-3-5');
		kind = 'gauss4';
	} else {
		assert.ok(['simpson4', 'gauss8-low', 'gauss8-high', 'simpson8'].includes(view.stage));
		kind = view.stage.startsWith('gauss8') ? 'gauss8' : /** @type {'simpson4'|'simpson8'} */ (view.stage);
	}
	const rule = secondOrderOuterRule(
		registration,
		loadInputs().native48.transportSpec,
		probeId,
		kind.startsWith('gauss') ? 'gauss-height' : 'simpson-height',
		kind.endsWith('4') ? 4 : 8,
	);
	assert.deepEqual(view.nodes, rule.nodes);
	assert.deepEqual(integrateSecondOrderView(view.nodes, view.points, view.channels), view.integrals);
	return {
		run,
		kind,
		view,
		source,
		complete: view.points.length === view.nodes.length && view.integrals.every((row) => row.complete),
	};
}

/** Seal progressive outer-prediction evidence and frozen-increment diagnostic tables.
 * Accepted assessment evidence preserves failed and missing predictions; it never
 * closes physical-reference admission without the separate angular comparison.
 * @param {string} registrationRun - Original C0 owner.
 * @param {readonly string[]} parentRuns - Explicit original Gauss4 and subsequent held configurations.
 * @param {string} [transferAdmissionRun] - Accepted adequate morning reference for noon transfer.
 * @returns {Promise<SkySecondOrderAssessmentResult>} Verified accepted evidence with honest outcomes.
 */
export async function runSecondOrderAssessment(registrationRun, parentRuns, transferAdmissionRun) {
	assert.ok(parentRuns.length >= 2 && parentRuns.length <= 6 && new Set(parentRuns).size === parentRuns.length);
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const condition = readSecondOrderCondition(registration, transferAdmissionRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const sources = sourceIdentities(),
		core = secondOrderNumericalCore(sources);
	const views = parentRuns.map((run) => readSecondOrderAssessmentParent(run, registration, core, condition.probeId));
	const original = readSecondOrderOriginal(registration),
		captures = readSecondOrderDialCaptures(registration, [condition.probeId]);
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.ok(planBytes.toString().includes('compensation-attribution-v1') && planBytes.toString().includes('1e-7 W'));
	/** @type {Map<SkySecondOrderAssessmentKind,SkySecondOrderAssessmentParent>} */ const complete = new Map();
	for (const view of views.filter((value) => value.complete)) {
		assert.ok(!complete.has(view.kind), `Multiple complete ${view.kind} targets were supplied.`);
		complete.set(view.kind, view);
	}
	assert.ok(complete.has('gauss4') && complete.has('simpson4'));
	const parents = [
		registration.seal,
		registration.record.inputs,
		plan,
		...condition.identities,
		...views.flatMap((view) => view.source.identities),
		...original.identities,
		...captures.flatMap((capture) => capture.identities),
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Reauthenticate original controls, replay complete/partial physical viewing integrals exactly, apply the prospectively registered outer response inequalities, and derive explicitly unqualified frozen-increment diagnostics. Preserve missing targets and pending angular/reference gates.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'second-order-outer-assessment',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			caseId: 'second-order-outer-assessment',
			admission,
			sourceIdentities: sources,
			numericalSources: core,
			node: registration.record.host.node,
			parentRuns,
			condition,
			forecastPlan: plan,
			referenceAdequate: false,
		},
	};
	const run = createRun(condition.transferPlan ? 'tr-outer-assess' : 'p2-outer-assess', recipe),
		definition = identity(`${run.path}/definition.json`);
	let written = definition.byteLength,
		failure = /** @type {Error|null} */ (null);
	/** @type {SkySecondOrderAddressedOuterCheck[]} */ const checks = [];
	/** Write a compact exclusive artifact with retained terminal capacity.
	 * @param {string} name - New artifact basename.
	 * @param {unknown} value - JSON or explicit bytes.
	 * @param {DialDerivation} [derivation] - Specific parent and operation identities.
	 * @returns {DialFileIdentity} Closed artifact identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} using the authenticated inputs, fixed prediction equations and recorded implementation.`,
		},
	) {
		assert.ok(Date.now() - started < Math.min(300000, admission.timeoutMilliseconds) - 30000);
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(written + bytes.length < allocatedBytes - terminalReserve);
		const artifact = run.write(name, bytes, derivation);
		written += artifact.byteLength;
		return artifact;
	}
	try {
		run.progress('assessment', 'Replaying exact viewing integrals and applying frozen outer predictions.');
		if (condition.transferPlan)
			write('transfer-plan.md', Buffer.from(condition.transferBytes), {
				parents: [condition.transferPlan],
				operation: 'Preserve the prospective second-condition transfer criteria.',
			});
		write('prediction-plan.md', planBytes, {
			parents: [plan],
			operation: 'Preserve the exact prospective outer/dial inequalities used by this assessment.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON, then gzip level 9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', {
			algebra: secondOrderAnalysisProof(),
			refinement: secondOrderRefinementProof(),
			replayedIntegralCount: views.reduce((sum, view) => sum + view.view.integrals.length, 0),
			checkedCaptureEnvelopes: captures.reduce(
				(sum, capture) => sum + capture.rows.reduce((count, row) => count + row.envelopes.length, 0),
				0,
			),
		});
		for (const channel of [0, 8])
			for (const rule of /** @type {SkySecondOrderAngularRule[]} */ (['ordinary-fine', 'mapped-fine'])) {
				/** @param {SkySecondOrderAssessmentKind} kind - Exact complete outer configuration. @returns {SkySecondOrderOuterValue|undefined} Complete estimate or missing target. */
				const get = (kind) => {
					const parent = complete.get(kind);
					if (!parent) return undefined;
					const rows = parent.view.integrals.filter(
						(row) =>
							row.interval === 'all' &&
							row.rule === rule &&
							row.channel === channel &&
							row.component === 'combined',
					);
					assert.equal(rows.length, 1);
					const row = rows[0];
					assert.ok(row.complete);
					return {value: row.valueWatts, innerAllowance: row.incidentAllowanceWatts + row.viewAllowanceWatts};
				};
				checks.push(
					...assessSecondOrderOuter({
						gauss4: get('gauss4'),
						simpson4: get('simpson4'),
						gauss8: get('gauss8'),
						simpson8: get('simpson8'),
					}).map((check) => ({...check, channel, rule})),
				);
			}
		write('outer-predictions.json', {
			schemaId: 'sky-second-order-outer-assessment-v1',
			forecastPlan: plan,
			checks,
			available: views.map((view) => ({run: view.run, kind: view.kind, fullViewComplete: view.complete})),
			referenceAdequate: false,
			pending: [
				'Additional fixed-point azimuth refinement and complete angular/outer reference allowance.',
				'Uncertainty-aware physical dial comparison after reference admission.',
			],
		});
		write(
			'integrals.json',
			views.map((view) => ({run: view.run, kind: view.kind, integrals: view.view.integrals})),
		);
		write('original-dial-captures.json', captures);
		write('frozen-increment-diagnostics.json', {
			schemaId: 'sky-second-order-unqualified-diagnostics-v1',
			referenceAdequate: false,
			limitation:
				'Complete outer estimates only; these numbers do not independently establish physical P2 reference adequacy or a regenerated N4/Kider improvement.',
			rows: [...complete.values()].flatMap((view) =>
				diagnoseSecondOrderView(condition.probeId, view.view.integrals, original.rows).map((row) => ({
					...row,
					sourceRun: view.run,
					outerKind: view.kind,
				})),
			),
		});
		for (const parent of parents) readRepository(parent.path, parent);
		for (const source of sources) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
		write('execution.json', {
			completed: true,
			gpuJobsExecuted: 0,
			checks: checks.length,
			failed: checks.filter((check) => check.state === 'failed').length,
			unresolved: checks.filter((check) => check.state === 'unresolved').length,
			sourceChecks: views.map((view) => view.source.sourceCheck),
		});
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const summary = {
		checks: checks.length,
		passed: checks.filter((check) => check.state === 'passed').length,
		failed: checks.filter((check) => check.state === 'failed').length,
		unresolved: checks.filter((check) => check.state === 'unresolved').length,
	};
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'second-order-outer-assessment',
		caseId: 'second-order-outer-assessment',
		...summary,
		referenceAdequate: false,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(
		seal.byteLength + terminal.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0) <= allocatedBytes,
	);
	if (failure) throw new Error(`Second-order assessment failed in ${run.path}: ${failure.message}`);
	return {run: run.path, seal, ...summary};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [registrationRun, parentsCsv] = process.argv.slice(2);
	assert.equal(process.argv.length, 4);
	console.log(JSON.stringify(await runSecondOrderAssessment(registrationRun, parentsCsv.split(',')), null, 2));
}
