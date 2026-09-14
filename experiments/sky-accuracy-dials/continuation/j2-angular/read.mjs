import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readRepository, sha256, verifyRun} from '../../io/files.mjs';
import {loadInputs} from '../../execution.mjs';
import {readMechanismLocalJ2} from '../mechanism-analysis/read.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {incidentGroups, localJ2Rules} from '../j2/angular.mjs';
import {accumulateNode, createSums} from '../j2/evaluate.mjs';
import {angularGroups, angularRules} from './rules.mjs';
import {angularPredictions} from './evaluate.mjs';

const originalRun = 'tmp/experiments/sky-accuracy-dials/runs/00113-c2-local-j2';

/** Authenticate original incident values and reproduce every original accumulated value exactly.
 * @param {DialContinuationRegistrationRead} registration - Exact original C0 controls.
 * @returns {SkyAngularOriginal} Immutable reference plus authenticated reusable nodes.
 */
export function readOriginal(registration) {
	const old = readMechanismLocalJ2(originalRun, registration);
	assert.deepEqual(old.input.seal, {
		path: `${originalRun}/sealed.json`,
		byteLength: 152779,
		sha256: 'edc6a8461c9d6d07eb4ee87712cc1ebfa69194f52bc9660bc00ac1ef1b08d7be',
	});
	const artifact = mechanismArtifact(old.input, 'incident-nodes.json.gz');
	const terminal = JSON.parse(readRepository(old.input.seal.path, old.input.seal).toString());
	const derivation = terminal.artifacts.find((item) => item.path === artifact.path).derivation;
	assert.equal(derivation.parameters.schemaId, 'sky-local-j2-nodes-v1');
	const expanded = gunzipSync(readRepository(artifact.path, artifact), {maxOutputLength: 16 * 1024 ** 2});
	assert.equal(expanded.length, derivation.parameters.uncompressedByteLength);
	assert.equal(sha256(expanded), derivation.parameters.uncompressedSha256);
	/** @type {SkyJ2NodeRecord[]} */ const nodes = JSON.parse(expanded.toString());
	assert.ok(Array.isArray(nodes));
	const keys = nodes.map((node) => `${node.time}:${node.ruleIndex}:${node.index}`);
	assert.equal(new Set(keys).size, keys.length);
	assert.equal(nodes.filter((node) => node.ruleIndex >= 0).length, 9536);
	const spec = loadInputs().native48.transportSpec;
	let exactReplayValues = 0;
	for (const result of old.record.rules) {
		const ordinal = localJ2Rules.findIndex((rule) => rule.id === result.ruleId);
		assert.ok(ordinal >= 0);
		const targets = old.record.targets.filter((target) => target.time === result.time);
		const sums = createSums(targets, old.record.channels, ordinal < 2 ? 4 : 0);
		for (const [index, incident] of incidentGroups(localJ2Rules[ordinal]).entries()) {
			const node = nodes.find(
				(item) => item.time === result.time && item.ruleIndex === ordinal && item.index === index,
			);
			assert.ok(node && node.resolved);
			accumulateNode(spec, targets, old.record.channels, incident, node, sums);
		}
		assert.deepEqual(sums, result.rows, 'Original addition order must reproduce original sums exactly.');
		exactReplayValues += sums.reduce((sum, row) => sum + 3 + row.finite.length, 0);
	}
	return {
		seal: old.input.seal,
		artifacts: [old.artifact, old.definition, artifact],
		reference: old.record,
		nodes,
		exactReplayValues,
	};
}

/** Reject malformed, missing, duplicated or nonfinite admitted local sums.
 * @param {SkyAngularDocument} record - JSON document authenticated by its seal.
 * @param {SkyAngularOriginal} original - Fixed scientific boundary.
 * @returns {void} Throws instead of supplying default or partial values.
 */
function validateDocument(record, original) {
	assert.equal(record.schemaId, 'sky-j2-angular-attribution-v1');
	assert.equal(record.extensionId, 'compensation-attribution-v1');
	assert.equal(record.units, 'W m^-3 sr^-1 nm^-1');
	assert.deepEqual(record.targets, original.reference.targets);
	assert.deepEqual(record.channels, original.reference.channels);
	assert.equal(record.matrixComplete, true, 'Incomplete stages cannot authorize dependent stages.');
	assert.equal(record.stopReason, null);
	assert.ok(['derive', 'development', 'predict', 'fine'].includes(record.stage));
	assert.ok(Array.isArray(record.rules) && Array.isArray(record.predictions) && Array.isArray(record.outcomes));
	assert.ok(Array.isArray(record.rankings));
	const expectedRules = angularRules.slice(0, record.stage === 'derive' ? 7 : record.stage === 'fine' ? 13 : 9);
	assert.deepEqual(
		record.rules.map((rule) => `${rule.ruleId}:${rule.time}`).sort(),
		expectedRules.flatMap((rule) => ['09:30', '12:30'].map((time) => `${rule.id}:${time}`)).sort(),
	);
	if (record.stage === 'derive' || record.stage === 'development') assert.deepEqual(record.predictions, []);
	else assert.deepEqual(record.predictions, angularPredictions(record.targets, record.channels, record.rules));
	if (record.stage !== 'fine') {
		assert.deepEqual(record.outcomes, []);
		assert.deepEqual(record.rankings, []);
	}
	const keys = record.rules.map((row) => `${row.time}:${row.ruleId}`);
	assert.equal(new Set(keys).size, keys.length);
	for (const rule of record.rules) {
		const declared = angularRules.find((candidate) => candidate.id === rule.ruleId);
		assert.ok(declared);
		assert.equal(rule.finiteAngularResolved, true);
		assert.equal(rule.completedNodes, rule.expectedNodes);
		assert.equal(rule.expectedNodes, angularGroups(declared).length);
		const targets = record.targets.filter((target) => target.time === rule.time);
		assert.equal(targets.length, 2);
		assert.equal(rule.rows.length, 8);
		for (const target of targets)
			for (const channel of record.channels) {
				const rows = rule.rows.filter((row) => row.targetId === target.id && row.channel === channel);
				assert.equal(rows.length, 1);
				assert.deepEqual(rows[0].finite, []);
				assert.ok(
					[rows[0].gauss, rows[0].simpson, rows[0].allowance].every(
						(value) => Number.isFinite(value) && value >= 0,
					),
				);
			}
	}
}

/** Read a complete directly preceding stage and require exact new-plan ancestry.
 * @param {string} run - Immutable parent run path.
 * @param {SkyAngularStage} stage - Required predecessor stage.
 * @param {DialContinuationRegistrationRead} registration - Original campaign identity.
 * @param {DialFileIdentity} plan - Exact current extension plan bytes.
 * @param {SkyAngularOriginal} original - Authenticated initial local J2 evidence.
 * @returns {SkyAngularParent} Authenticated scientific predecessor.
 */
export function readParent(run, stage, registration, plan, original) {
	const input = acceptedMechanismInput(run),
		artifact = mechanismArtifact(input, 'reference.json');
	/** @type {SkyAngularDocument} */ const record = JSON.parse(readRepository(artifact.path, artifact).toString());
	validateDocument(record, original);
	assert.equal(record.stage, stage);
	assert.equal(record.continuationRegistration, registration.run);
	assert.deepEqual(record.plan, plan);
	const parameters = JSON.parse(readRepository(input.seal.path, input.seal).toString()).recipe.parameters;
	assert.equal(parameters.extensionId, record.extensionId);
	assert.equal(parameters.extensionStage, stage);
	assert.equal(parameters.continuationRegistration, registration.run);
	assert.equal(parameters.phase, 'C5');
	assert.equal(parameters.jobKind, 'cpu');
	assert.equal(parameters.scope, 'component');
	for (const identity of [plan, original.seal, registration.seal])
		assert.ok(
			input.terminal.recipe.parents.some(
				(parent) =>
					parent.path === identity.path &&
					parent.sha256 === identity.sha256 &&
					parent.byteLength === identity.byteLength,
			),
		);
	assert.deepEqual(verifyRun(run), input.seal);
	return {seal: input.seal, artifact, record};
}
