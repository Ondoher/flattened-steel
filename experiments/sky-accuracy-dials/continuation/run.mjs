import assert from 'node:assert/strict';
import {executeContinuation, prepareContinuation} from './execute.mjs';
import {readRegistration, registerContinuation} from './registration/run.mjs';
import {campaignUsage} from './resources.mjs';
import {continuationProof} from './proof.mjs';
import {runPhysicalReferences} from './physical-run.mjs';
import {analyzeContinuation} from './analysis.mjs';
import {registerAllocationAmendment} from './amendment.mjs';
import {assessPhysicalJ1} from './j1-assessment.mjs';
import {runContractParityProof} from './contract-proof.mjs';
import {runSupportProof} from './support-proof.mjs';
import {runLocalJ2References} from './j2/run.mjs';
import {registerMechanismCases} from './mechanisms/registration.mjs';
import {prepareMechanism} from './mechanisms/prepare.mjs';
import {runMechanism} from './mechanisms/execute.mjs';
import {registerInteractionPrediction, assessInteraction} from './interaction/run.mjs';
import {assessReferenceLadder} from './ladder/run.mjs';
import {assessMechanisms} from './mechanism-analysis/run.mjs';
import {summarizeContinuation} from './closure/run.mjs';

const [command, ...args] = process.argv.slice(2);
if (command === 'register') {
	assert.equal(args.length, 0);
	console.log(JSON.stringify(registerContinuation(), null, 2));
} else if (command === 'run' || command === 'preflight') {
	assert.ok(args.length === 3 || args.length === 4, 'run <registration> <case> <screen|full> [view-counts]');
	const [registration, caseId, scope, counts] = args;
	assert.ok(scope === 'screen' || scope === 'full');
	const views = counts === undefined ? (scope === 'full' ? [8] : [8, 16]) : counts.split(',').map(Number);
	if (command === 'run') await executeContinuation(registration, caseId, scope, views);
	else {
		const prepared = prepareContinuation(registration, caseId, scope, views);
		console.log(
			JSON.stringify(
				{
					caseId,
					scope,
					views,
					layout: prepared.profile.layout,
					admission: prepared.admission,
					sourceCount: prepared.sources.length,
					currentDeviceAdmission: 'Pending the owned browser context and measured pilot.',
				},
				null,
				2,
			),
		);
	}
} else if (command === 'proof') {
	assert.equal(args.length, 1);
	console.log(JSON.stringify(await continuationProof(args[0]), null, 2));
} else if (command === 'physical-reference') {
	assert.ok(args.length === 1 || args.length === 2);
	const profile = args[1] ?? 'standard';
	assert.ok(profile === 'standard' || profile === 'simpson-expanded-medium');
	console.log(JSON.stringify(await runPhysicalReferences(args[0], profile), null, 2));
} else if (command === 'amend-allocations') {
	assert.equal(args.length, 1);
	console.log(JSON.stringify(registerAllocationAmendment(args[0]), null, 2));
} else if (command === 'assess-j1') {
	assert.equal(args.length, 4, 'assess-j1 <registration> <physical-reference> <raw-H> <factored-H>');
	console.log(JSON.stringify(await assessPhysicalJ1(args[0], args[1], args[2], args[3]), null, 2));
} else if (command === 'contract-parity') {
	assert.equal(args.length, 1, 'contract-parity <registration>');
	console.log(JSON.stringify(await runContractParityProof(args[0]), null, 2));
} else if (command === 'support-proof' || command === 'local-j2' || command === 'register-mechanisms') {
	assert.equal(args.length, 1);
	const result =
		command === 'support-proof'
			? await runSupportProof(args[0])
			: command === 'local-j2'
				? await runLocalJ2References(args[0])
				: await registerMechanismCases(args[0]);
	console.log(JSON.stringify(result, null, 2));
} else if (command === 'mechanism' || command === 'preflight-mechanism') {
	assert.ok(
		args.length === 3 || args.length === 4,
		'mechanism <registration> <case-registration> <case> [prediction]',
	);
	const options = args[3] ? {predictionRun: args[3]} : {};
	if (command === 'mechanism')
		console.log(JSON.stringify(await runMechanism(args[0], args[1], args[2], options), null, 2));
	else {
		const prepared = prepareMechanism(args[0], args[1], args[2], options);
		console.log(
			JSON.stringify(
				{
					case: prepared.candidate,
					admission: prepared.admission,
					estimatedPeakFieldBytes: prepared.estimatedPeakFieldBytes,
					sourceCount: prepared.sources.length,
				},
				null,
				2,
			),
		);
	}
} else if (command === 'predict-interaction') {
	assert.equal(
		args.length,
		6,
		'predict-interaction <registration> <case-registration> <target-case> <baseline> <first> <second>',
	);
	console.log(
		JSON.stringify(
			await registerInteractionPrediction(args[0], args[1], args[2], args[3], args[4], args[5]),
			null,
			2,
		),
	);
} else if (command === 'assess-interaction') {
	assert.equal(args.length, 3, 'assess-interaction <registration> <prediction> <target>');
	console.log(JSON.stringify(await assessInteraction(args[0], args[1], args[2]), null, 2));
} else if (command === 'assess-ladder') {
	assert.ok(args.length >= 2, 'assess-ladder <registration> <ordered-prefix-capture> [...]');
	console.log(JSON.stringify(await assessReferenceLadder(args[0], args.slice(1)), null, 2));
} else if (command === 'assess-mechanisms') {
	assert.equal(
		args.length,
		14,
		'assess-mechanisms <registration> <case-registration> <local-j2> <ladder-assessment> <ten-captures...>',
	);
	console.log(JSON.stringify(await assessMechanisms(args[0], args[1], args.slice(4), args[2], args[3]), null, 2));
} else if (command === 'close') {
	assert.ok(
		args.length >= 5,
		'close <registration> <skipped|not-executed> <C5-reason> <ladder-or-none> <mechanisms-or-none> [interaction-assessments...]',
	);
	const [registration, status, reason, ladder, mechanisms, ...interactions] = args;
	assert.ok(status === 'skipped' || status === 'not-executed', 'C5 closure status must be explicit.');
	assert.ok(reason.trim().length > 0, 'C5 closure requires its scientific or execution reason.');
	const ladderAssessmentRun = ladder === 'none' ? null : ladder;
	const mechanismAssessmentRun = mechanisms === 'none' ? null : mechanisms;
	const evidenceRuns = [ladderAssessmentRun, mechanismAssessmentRun, ...interactions].filter((run) => run !== null);
	console.log(
		JSON.stringify(
			await summarizeContinuation(registration, {
				ladderAssessmentRun,
				mechanismAssessmentRun,
				interactionAssessmentRuns: interactions,
				c5Decision: {status, reason, evidenceRuns},
			}),
			null,
			2,
		),
	);
} else if (command === 'analyze') {
	assert.ok(args.length >= 2, 'analyze <registration> <capture> [capture...]');
	console.log(JSON.stringify(analyzeContinuation(args[0], args.slice(1)), null, 2));
} else if (command === 'usage') {
	assert.equal(args.length, 1);
	console.log(JSON.stringify(campaignUsage(readRegistration(args[0])), null, 2));
} else
	throw new RangeError(
		'Expected an explicit continuation command: register, amend-allocations, proof, contract-parity, support-proof, local-j2, register-mechanisms, mechanism, preflight-mechanism, predict-interaction, assess-interaction, assess-ladder, assess-mechanisms, close, physical-reference, assess-j1, analyze, preflight, run or usage.',
	);
