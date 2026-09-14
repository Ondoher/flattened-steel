import assert from 'node:assert/strict';
import path from 'node:path';
import {readdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {outputRelative, readRepository, resolveRepository, sha256, verifyRun} from '../../io/files.mjs';
import {accountInvalidEvidence} from '../invalid-evidence.mjs';
import {readInteractionPrediction} from '../interaction/run.mjs';
import {readInteractionSource} from '../interaction/contracts.mjs';
import {evaluateInteractionForecast, interactionStrata} from '../interaction/metrics.mjs';

/** Snapshot every ordinary terminal directory; an open or malformed run blocks closure.
 * Run only before allocating the reporting run.
 * @param {DialContinuationRegistrationRead} registration
 * @param {() => void} [progress]
 * @returns {readonly SkyClosureRun[]}
 */
export function readClosureInventory(registration, progress = () => {}) {
	const first = Number(path.posix.basename(registration.run).slice(0, 5));
	/** @type {SkyClosureRun[]} */ const records = [];
	const entries = readdirSync(resolveRepository(`${outputRelative}/runs`), {withFileTypes: true});
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		assert.ok(entry.isDirectory() && !entry.isSymbolicLink(), 'Run inventory contains a nonordinary directory.');
		assert.match(entry.name, /^\d{5}-[a-z][a-z0-9-]{0,15}$/u);
		if (Number(entry.name.slice(0, 5)) < first) continue;
		progress();
		const run = `${outputRelative}/runs/${entry.name}`;
		resolveRepository(run);
		const invalid = accountInvalidEvidence(run, registration.run);
		const seal = invalid?.seal ?? verifyRun(run);
		const terminal = /** @type {SkyClosureTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
		assert.equal(terminal.run, run);
		assert.ok(['accepted', 'rejected', 'failed', 'interrupted'].includes(terminal.state));
		assert.ok(Number.isFinite(Date.parse(terminal.finishedAt)));
		if (run !== registration.run) {
			assert.equal(terminal.recipe.parameters.continuationRegistration, registration.run);
			assert.ok(['cpu', 'gpu'].includes(terminal.recipe.parameters.jobKind));
			assert.ok(['screen', 'full', 'component'].includes(terminal.recipe.parameters.scope));
			assert.ok(['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].includes(terminal.recipe.parameters.phase));
			assert.ok(
				Number.isFinite(terminal.result.jobElapsedMilliseconds) && terminal.result.jobElapsedMilliseconds >= 0,
			);
		}
		const retainedBytes = seal.byteLength + terminal.artifacts.reduce((sum, item) => sum + item.byteLength, 0);
		assert.ok(Number.isSafeInteger(retainedBytes) && retainedBytes > 0);
		records.push({index: records.length, run, seal, terminal, retainedBytes, invalid});
	}
	assert.equal(records[0]?.run, registration.run);
	return records;
}

/** Require an artifact's exact unique run-local ownership and bytes.
 * @param {SkyClosureRun} source @param {string} name @returns {DialArtifact}
 */
export function closureArtifact(source, name) {
	assert.ok(name.length > 0 && !name.includes('\\') && !path.posix.isAbsolute(name));
	assert.ok(name.split('/').every((part) => part !== '' && part !== '.' && part !== '..'));
	const matches = source.terminal.artifacts.filter((item) => item.path === `${source.run}/${name}`);
	assert.equal(matches.length, 1, `Missing unique closure parent artifact ${name}.`);
	readRepository(matches[0].path, matches[0]);
	return matches[0];
}

/** Determine artifact presence from the authenticated inventory only.
 * @param {SkyClosureRun} source @param {string} name @returns {boolean}
 */
export function hasClosureArtifact(source, name) {
	return source.terminal.artifacts.some((item) => item.path === `${source.run}/${name}`);
}

/** Bounded structural validation at the JSON input boundary; scientific schemas are checked by consumers.
 * @param {unknown} value @returns {void}
 */
export function validateClosureJson(value) {
	let count = 0;
	/** @param {unknown} item @param {number} depth */
	const visit = (item, depth) => {
		assert.ok(++count <= 2000000 && depth <= 32, 'Closure JSON exceeds its bounded structural contract.');
		if (item === null || typeof item === 'boolean') return;
		if (typeof item === 'number') return assert.ok(Number.isFinite(item));
		if (typeof item === 'string') return assert.ok(item.length <= 4 * 1024 ** 2);
		assert.equal(typeof item, 'object');
		if (Array.isArray(item)) for (const child of item) visit(child, depth + 1);
		else
			for (const [key, child] of Object.entries(item)) {
				assert.ok(key.length > 0 && key.length <= 4096);
				visit(child, depth + 1);
			}
	};
	visit(value, 0);
}

/** Read bounded JSON, including lossless gzip and any producer-declared uncompressed identity.
 * @param {SkyClosureRun} source @param {string} name @returns {SkyClosureJson}
 */
export function readClosureJson(source, name) {
	const artifact = closureArtifact(source, name);
	assert.ok(artifact.byteLength <= 16 * 1024 ** 2, 'Closure source is not a compact artifact.');
	const encoded = readRepository(artifact.path, artifact);
	const bytes = name.endsWith('.gz') ? gunzipSync(encoded, {maxOutputLength: 64 * 1024 ** 2}) : encoded;
	const parameters = /** @type {{uncompressedByteLength?:number,uncompressedSha256?:string}|undefined} */ (
		artifact.derivation.parameters
	);
	if (parameters?.uncompressedByteLength !== undefined) assert.equal(bytes.length, parameters.uncompressedByteLength);
	if (parameters?.uncompressedSha256 !== undefined) assert.equal(sha256(bytes), parameters.uncompressedSha256);
	const value = /** @type {unknown} */ (JSON.parse(bytes.toString()));
	validateClosureJson(value);
	return {identity: {path: artifact.path, byteLength: artifact.byteLength, sha256: artifact.sha256}, value};
}

/** Admit an exact successful assessment without excluding other runs from the inventory.
 * @param {readonly SkyClosureRun[]} inventory @param {string} run @returns {SkyClosureRun}
 */
export function acceptedClosureSource(inventory, run) {
	const source = inventory.find((item) => item.run === run);
	assert.ok(source && !source.invalid, 'Selected closure source is absent or invalid evidence.');
	assert.equal(source.terminal.state, 'accepted', 'Selected science source must be an accepted immutable execution.');
	return source;
}

/** Validate every successful C4 registration and assessment before creating the closure run.
 * Failed/rejected execution records remain in the complete inventory, not this science list.
 * @param {DialContinuationRegistrationRead} registration
 * @param {readonly SkyClosureRun[]} inventory
 * @param {readonly string[]} requested
 * @returns {{predictions:readonly SkyInteractionPredictionRead[],assessments:readonly SkyClosureInteraction[]}}
 */
export function readClosureInteractions(registration, inventory, requested) {
	assert.equal(new Set(requested).size, requested.length);
	const predictions = inventory
		.filter(
			(source) =>
				!source.invalid &&
				source.terminal.state === 'accepted' &&
				hasClosureArtifact(source, 'prediction.json'),
		)
		.map((source) => {
			assert.equal(source.terminal.recipe.parameters.phase, 'C4');
			return readInteractionPrediction(registration.run, source.run);
		});
	const assessments = inventory
		.filter(
			(source) =>
				!source.invalid &&
				source.terminal.state === 'accepted' &&
				hasClosureArtifact(source, 'assessment.json.gz'),
		)
		.map((source) => {
			assert.equal(source.terminal.recipe.parameters.phase, 'C4');
			const parsed = readClosureJson(source, 'assessment.json.gz');
			const record = /** @type {SkyClosureInteractionAssessment} */ (parsed.value);
			assert.equal(record.schemaId, 'sky-interaction-assessment-v1');
			assert.equal(record.scope, 'screen');
			assert.equal(record.held14Assessed, false);
			assert.equal(record.full17Assessed, false);
			assert.equal(record.numericalAccuracyQualified, false);
			assert.deepEqual(record.gates, registration.record.scientificGates);
			const prediction = predictions.find((item) => item.input.seal.path === record.prediction.path);
			assert.ok(prediction, 'Assessment lacks its authenticated earlier prediction.');
			assert.deepEqual(prediction.input.seal, record.prediction);
			assert.equal(record.targetCaseId, prediction.record.targetCaseId);
			const target = readInteractionSource(
				path.posix.dirname(record.target.path),
				record.targetCaseId,
				registration,
				prediction.catalog,
			);
			assert.deepEqual(target.input.seal, record.target);
			for (const parent of [record.prediction, record.target])
				assert.ok(
					source.terminal.recipe.parents.some(
						(item) =>
							item.path === parent.path &&
							item.sha256 === parent.sha256 &&
							item.byteLength === parent.byteLength,
					),
				);
			return {
				source,
				artifact: parsed.identity,
				record,
				prediction,
				target,
				targetSource: acceptedClosureSource(inventory, target.input.run),
			};
		});
	for (const run of requested)
		assert.ok(
			assessments.some((source) => source.source.run === run),
			'Requested interaction assessment is not present and accepted.',
		);
	return {predictions, assessments};
}

/** Independently repeat the exact frozen arithmetic and selector gates of one accepted assessment.
 * @param {SkyClosureInteraction} assessment @param {DialContinuationRegistrationRead} registration
 * @param {DialAnalysisBoundary} measured @returns {number}
 */
export function verifyClosureInteraction(assessment, registration, measured) {
	const {prediction, target, record} = assessment;
	const progress = closureArtifact(assessment.targetSource, 'progress.jsonl');
	const event = /** @type {SkyInteractionProgressTime} */ (
		JSON.parse(readRepository(progress.path, progress).toString().split('\n')[0])
	);
	assert.ok(Date.parse(prediction.lockedAt) < Date.parse(event.timestamp));
	const metadata = {
		predictionSeal: prediction.input.seal,
		predictionSha256: '',
		lockedAt: prediction.lockedAt,
		candidateStartedAt: event.timestamp,
		candidateIdentity: target.input.seal,
	};
	const expected = prediction.forecasts.map((forecast) =>
		evaluateInteractionForecast(
			forecast,
			[...prediction.sources, target],
			measured,
			{...metadata, predictionSha256: forecast.predictionSha256},
			interactionStrata(target.loaded.control),
			registration.record.scientificGates,
		),
	);
	assert.deepEqual(record.rows, expected, 'C4 assessment arithmetic or gates no longer reproduce.');
	assert.equal(expected.length, 8);
	return expected.length;
}
