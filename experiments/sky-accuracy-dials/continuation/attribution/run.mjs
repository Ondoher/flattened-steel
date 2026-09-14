import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {gzipSync, gunzipSync} from 'node:zlib';
import {
	checkedAbsolute, createRun, identity, readRepository, sha256,
	sourceIdentities, storage, verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';

const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/attribution-plan.md';
const allocatedBytes = 3 * 1024 ** 2;
const terminalReserve = 1024 ** 2;

/** Authenticate a complete original parent without altering it.
 * @param {string} path @param {string} registration @returns {SkyOrderAttributionParent}
 */
function parent(path, registration) {
	const id = verifyRun(path);
	/** @type {SkyOrderAttributionSeal} */ const seal = JSON.parse(readRepository(id.path, id).toString());
	assert.equal(seal.state, 'accepted');
	assert.equal(seal.run, path);
	assert.equal(seal.recipe.parameters.continuationRegistration, registration);
	return {identity: id, seal};
}

/** Read an exactly inventoried original artifact.
 * @param {SkyOrderAttributionParent} source @param {string} name @returns {Buffer}
 */
function artifact(source, name) {
	const item = source.seal.artifacts.find((value) => value.path === `${source.seal.run}/${name}`);
	assert.ok(item, `Missing sealed attribution input ${name}.`);
	return readRepository(item.path, item);
}

/** Require an algebra identity to fit operand-scaled floating-point roundoff.
 * @param {number} actual @param {number} expected @param {readonly number[]} operands
 */
function close(actual, expected, operands) {
	assert.ok([actual, expected, ...operands].every(Number.isFinite));
	const scale = operands.reduce((sum, value) => sum + Math.abs(value), 0);
	assert.ok(Math.abs(actual - expected) <= 256 * Number.EPSILON * Math.max(scale, Number.MIN_VALUE));
}

/** Telescope a matched fixed-field order vector without interpreting its additions as errors.
 * @param {SkyJ1AssessmentRow} row
 * @param {readonly SkyContinuationProbeDiagnostic[]} orders
 * @returns {SkyOrderAttributionRow}
 */
export function decomposeOrders(row, orders) {
	assert.equal(orders.length, 4);
	assert.ok(Number.isFinite(row.physicalW) && row.physicalW !== null && row.reasons.length === 0);
	for (const [index, order] of orders.entries()) {
		assert.equal(order.order, index + 1);
		assert.equal(order.probeId, row.probeId);
		assert.equal(order.time, row.time);
		assert.equal(order.representationId, 'grouped');
		assert.equal(order.methodId, 'reference-envelope');
		assert.ok(Number.isFinite(order.value));
	}
	const cumulative = orders.map((order) => order.value);
	assert.equal(cumulative[0], row.raw.firstOrderW);
	assert.equal(cumulative[3], row.raw.fourthOrderW);
	const physicalFirstResidual = row.physicalW - row.measuredW;
	const contributions = [physicalFirstResidual, ...cumulative.slice(1).map((value, index) => value - cumulative[index])];
	const firstNumerical = cumulative[0] - row.physicalW;
	const remaining = cumulative[3] - cumulative[0] + row.physicalW - row.measuredW;
	assert.equal(firstNumerical, row.raw.numericalW);
	assert.equal(remaining, row.raw.remainingW);
	const sum = contributions.reduce((total, value) => total + value, 0);
	close(sum, remaining, [...cumulative, row.physicalW, row.measuredW]);
	const allowances = [row.physicalAllowanceW, ...orders.slice(1).map((order, index) => {
		const prior = orders[index].errorAllowance;
		return order.errorAllowance === null || prior === null ? null : order.errorAllowance + prior;
	})];
	const cancellationContributions = contributions.map((value) => 2 * firstNumerical * value);
	close(cancellationContributions.reduce((total, value) => total + value, 0), row.raw.crossTermW2, cancellationContributions);
	return {probeId: row.probeId, time: row.time, channel: row.channel, physicalFirstResidual,
		cumulative, contributions, allowances, firstNumerical, remaining, cancellationContributions,
		identityResidual: Math.abs(sum - remaining)};
}

/** Describe signed contributions on one exact sample set.
 * @param {string} id @param {readonly SkyOrderAttributionRow[]} rows @returns {SkyOrderAttributionGroup}
 */
export function summarizeOrders(id, rows) {
	assert.ok(rows.length > 0);
	const sum = (/** @type {(row: SkyOrderAttributionRow) => number} */ select) => rows.reduce((total, row) => total + select(row), 0);
	const indices = [0, 1, 2, 3];
	const contributionDotProducts = indices.map((i) => indices.map((j) => sum((row) => row.contributions[i] * row.contributions[j])));
	const squares = sum((row) => row.remaining ** 2);
	const telescope = contributionDotProducts.flat().reduce((total, value) => total + value, 0);
	close(telescope, squares, contributionDotProducts.flat());
	return {id, count: rows.length,
		meanContributionsMilliwatt: indices.map((i) => 1000 * sum((row) => row.contributions[i]) / rows.length),
		rmsContributionsMilliwatt: indices.map((i) => 1000 * Math.sqrt(contributionDotProducts[i][i] / rows.length)),
		contributionDotProducts,
		cancellationContributions: indices.map((i) => sum((row) => row.cancellationContributions[i])),
		meanRemainingMilliwatt: 1000 * sum((row) => row.remaining) / rows.length,
		rmsRemainingMilliwatt: 1000 * Math.sqrt(squares / rows.length),
		negativeCount: rows.filter((row) => row.remaining < 0).length,
		positiveCount: rows.filter((row) => row.remaining > 0).length,
		squaredIdentityResidual: Math.abs(telescope - squares)};
}

/** Verify telescoping/cross-term arithmetic with signed manufactured quantities.
 * @returns {SkyOrderAttributionProof}
 */
export function attributionProof() {
	let checks = 0;
	for (const values of [[-3, 2, 4, -1], [1e-8, 1, -1, -2e-8], [0, 0, 0, 0]]) {
		const sum = values.reduce((total, value) => total + value, 0);
		const matrix = values.flatMap((a) => values.map((b) => a * b));
		close(matrix.reduce((total, value) => total + value, 0), sum ** 2, matrix);
		checks++;
		close(values.reduce((total, value) => total + 2 * -0.375 * value, 0), 2 * -0.375 * sum, values);
		checks++;
	}
	assert.throws(() => close(1, 1.1, [1, 1.1])); checks++;
	assert.throws(() => close(NaN, 0, [0])); checks++;
	return {schemaId: 'sky-order-attribution-proof-v1', checks};
}

/** Retain an exact signed decomposition of the existing C1 discrepancy in a new run.
 * @param {SkyOrderAttributionRequest} request @returns {Promise<DialExecutionResult>}
 */
export async function runOrderAttribution(request) {
	const started = Date.now(), registration = readRegistration(request.registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	assert.equal(checkedAbsolute(process.execPath), registration.record.host.node.path);
	assert.equal(process.version, registration.record.host.node.version);
	const hash = createHash('sha256'); let nodeBytes = 0;
	for await (const chunk of createReadStream(checkedAbsolute(process.execPath))) { hash.update(chunk); nodeBytes += chunk.length; }
	assert.equal(nodeBytes, registration.record.host.node.byteLength);
	assert.equal(hash.digest('hex'), registration.record.host.node.sha256);
	const capture = parent(request.captureRun, registration.run);
	const assessment = parent(request.assessmentRun, registration.run);
	assert.ok(assessment.seal.recipe.parents.some((item) => item.path === capture.identity.path && item.sha256 === capture.identity.sha256));
	const plan = identity(planPath), sources = sourceIdentities();
	const parents = [registration.seal, capture.identity, assessment.identity, plan,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : [])];
	const recipe = {parents, operation: 'Authenticate the original physical-J1 compensation rows and grouped N1-N4 fixed-field envelopes, telescope their signed additions, and decompose the measured cancellation without assigning higher-order numerical accuracy.',
		parameters: {continuationRegistration: registration.run, jobKind: 'cpu', scope: 'component', phase: 'C5',
			extensionId: 'compensation-attribution-v1', extensionStage: 'order-decomposition', admission, request,
			node: registration.record.host.node, allocatedBytes}};
	const initial = storage().retainedBytes, run = createRun('a-order-split', recipe);
	let terminal = false;
	try {
		const guard = () => {
			run.guard();
			assert.ok(Date.now() - started < Math.min(admission.timeoutMilliseconds, 3600000));
			assert.ok(storage().retainedBytes - initial < allocatedBytes - terminalReserve);
		};
		const write = (/** @type {string} */ name, /** @type {unknown} */ value, /** @type {DialDerivation} */ derivation = recipe) => {
			guard();
			const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value));
			assert.ok(storage().retainedBytes - initial + bytes.length < allocatedBytes - terminalReserve);
			return run.write(name, bytes, derivation);
		};
		run.progress('order-attribution', 'Authenticating all original grouped-order reference envelopes.');
		/** @type {SkyJ1AssessmentRow[]} */ const original = JSON.parse(artifact(assessment, 'rows.json').toString());
		assert.equal(original.length, registration.probes.length * registration.record.scopes.probeChannels.length);
		/** @type {SkyOrderAttributionRow[]} */ const rows = [];
		for (const channel of registration.record.scopes.probeChannels) {
			guard();
			const diagnostics = validateChannelDiagnostics(JSON.parse(gunzipSync(artifact(capture, `channel-${String(channel).padStart(2, '0')}-diagnostics.json.gz`), {maxOutputLength: 2 * 1024 ** 2}).toString()));
			const channelRows = original.filter((row) => row.channel === channel);
			assert.equal(channelRows.length, registration.probes.length);
			for (const probe of registration.probes) {
				const matches = channelRows.filter((row) => row.probeId === probe.probeId);
				assert.equal(matches.length, 1);
				const orders = diagnostics.probes.filter((row) => row.probeId === probe.probeId && row.representationId === 'grouped' && row.methodId === 'reference-envelope').sort((a, b) => a.order - b.order);
				rows.push(decomposeOrders(matches[0], orders));
			}
			run.progress('order-attribution', `Completed channel ${channel}.`, rows.length, original.length);
		}
		assert.equal(rows.length, original.length);
		const groups = [summarizeOrders('all-selected', rows), ...[...new Set(rows.map((row) => row.time))].map((time) => summarizeOrders(time, rows.filter((row) => row.time === time)))];
		write('attribution-plan.md', readRepository(plan.path, plan), {parents: [plan], operation: 'Preserve the exact governing extension plan before new numerical attribution.'});
		write('proof.json', attributionProof());
		write('rows.json.gz', gzipSync(Buffer.from(JSON.stringify(rows)), {level: 9}), {...recipe, operation: `${recipe.operation} Encode the resulting rows with JSON.stringify and lossless Node gzip level9.`});
		write('groups.json', groups);
		write('report.md', Buffer.from([
			'# Remaining Discrepancy By Represented Order',
			'',
			'The same 160 deliberately selected probe/channel values are decomposed using the admitted physical first-order reference and the original grouped fixed-field N1-N4 envelopes. These are signed radiance contributions, not independently established higher-order errors. They are not a full B1 score.',
			'',
			'Each row telescopes: remaining = (physical J1 - measurement) + effective J2 + effective J3 + effective J4. All table means and RMS values are in mW m^-2 sr^-1 nm^-1.',
			'',
			'| Scope | Samples | Mean P1-M | Mean J2 | Mean J3 | Mean J4 | Mean remaining | RMS remaining | Negative / positive |',
			'| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
			...groups.map((group) => `| ${group.id} | ${group.count} | ${group.meanContributionsMilliwatt.map((value) => value.toFixed(6)).join(' | ')} | ${group.meanRemainingMilliwatt.toFixed(6)} | ${group.rmsRemainingMilliwatt.toFixed(6)} | ${group.negativeCount} / ${group.positiveCount} |`),
			'',
			'Positive remaining discrepancy means the first-order-corrected calculation is above the measurement. With these represented contributions fixed, adding nonnegative omitted physical scattering orders cannot reduce that scalar overshoot. This does not establish the numerical accuracy of the represented higher orders or quantify the unknown H tail.',
			'',
			'groups.json retains the complete signed dot-product matrix and decomposition of the original first-order cancellation term. rows.json.gz retains exact scalar quantities and numerical integration allowances; physical-model and measurement uncertainty remain unestimated.',
			'',
		].join('\n')));
		const sourceBytes = Buffer.from(JSON.stringify(sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')}))));
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {parents: sources, operation: 'Snapshot exact authored source bytes as base64 records with path, byteLength and sha256; serialize using JSON.stringify and lossless Node gzip level9.', parameters: {schemaId: 'sky-source-base64-snapshot-v1', uncompressedByteLength: sourceBytes.length, uncompressedSha256: sha256(sourceBytes)}});
		write('summary.json', {schemaId: 'sky-order-attribution-v1', units: 'W m^-2 sr^-1 nm^-1', squaredUnits: 'W^2 m^-4 sr^-2 nm^-2', componentOrder: ['physical-first-minus-measurement', 'effective-order-2', 'effective-order-3', 'effective-order-4'],
			count: rows.length, groups, maximumIdentityResidual: Math.max(...rows.map((row) => row.identityResidual)),
			sourceSnapshot: {schemaId: 'sky-source-base64-snapshot-v1', uncompressedByteLength: sourceBytes.length, uncompressedSha256: sha256(sourceBytes)},
			limitations: ['Effective grouped radiance additions are not independently established higher-order numerical errors.', 'These deliberately selected four-channel probes do not estimate the full B1 score.', 'Physical-first and fixed-field integration allowances exclude physical-model and measurement uncertainty.', 'No historical N5/N6 increment is treated as the unmatched H configuration tail.']});
		for (const item of [...parents, ...sources]) readRepository(item.path, item);
		guard(); run.cleanup();
		const seal = run.finish('accepted', {caseId: 'order-attribution', rows: rows.length, jobElapsedMilliseconds: Date.now() - started, allocatedBytes, gpuJobsExecuted: 0});
		terminal = true;
		assert.deepEqual(verifyRun(run.path), seal);
		const completed = JSON.parse(readRepository(seal.path, seal).toString());
		assert.equal(completed.state, 'accepted');
		assert.ok(seal.byteLength + completed.artifacts.reduce((sum, item) => sum + item.byteLength, 0) <= allocatedBytes);
		return {run: run.path, seal, accepted: true};
	} catch (error) {
		if (!terminal) run.finish('failed', {caseId: 'order-attribution', message: String(error), jobElapsedMilliseconds: Date.now() - started, allocatedBytes, gpuJobsExecuted: 0});
		throw error;
	}
}
