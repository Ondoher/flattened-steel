import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readdirSync} from 'node:fs';
import typescript from 'typescript';
import {identity, readRepository, verifyRun, repositoryRoot, resolveRepository} from '../io/files.mjs';

/** Authenticate an immutable run and selected artifact, preserving their derivation parents.
 * @param {string} name @param {string} file @param {DialFileIdentity[]} parents @returns {unknown}
 */
export function readParent(name, file, parents) {
	const root = 'tmp/experiments/sky-accuracy-dials/runs/' + name;
	if (!parents.some((p) => p.path === root + '/sealed.json')) parents.push(verifyRun(root));
	const record = identity(root + '/' + file);
	parents.push(record);
	const bytes = readRepository(record.path, record);
	return JSON.parse((file.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString());
}

/** Preserve the same uncertain reference in a before/after squared-error comparison.
 * @param {number} before @param {number} after @param {number} reference @param {number} halfWidth
 * @param {number} [numericalAllowance] @returns {HypothesisErrorComparison}
 */
export function compareErrors(before, after, reference, halfWidth, numericalAllowance = 0) {
	assert.ok([before, after, reference, halfWidth, numericalAllowance].every(Number.isFinite));
	assert.ok(halfWidth >= 0 && numericalAllowance >= 0);
	const deltaW = after - before,
		error = before - reference;
	const deltaSSE = 2 * error * deltaW + deltaW ** 2;
	const radius =
		2 * Math.abs(deltaW) * halfWidth +
		2 * (Math.abs(error + deltaW) + halfWidth) * numericalAllowance +
		numericalAllowance ** 2;
	const interval = [deltaSSE - radius, deltaSSE + radius];
	return {
		deltaW,
		deltaSSE,
		interval,
		direction: interval[1] < 0 ? 'improves' : interval[0] > 0 ? 'worsens' : 'unresolved',
	};
}

/** Prospectively registered Float32 replay screen, in spectral watts; not a certified bound.
 * @param {number} retained @returns {number}
 */
export function replayAllowance(retained) {
	return Math.max(0.00002, Math.abs(retained) * 0.0002);
}

/** Refuse completed scientific stages; explicitly authorized repair debits prior failed elapsed time.
 * Ordinary calls retain the strict rule. Repairs require the selected continuation authority.
 * @param {string} name @param {boolean} [repairFailures] Owner-directed repair within the remaining stage cap.
 * @returns {number} Elapsed milliseconds already consumed by failed repair runs.
 */
export function requireUnusedStage(name, repairFailures = false) {
	assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
	let elapsed = 0;
	for (const entry of readdirSync(resolveRepository('tmp/experiments/sky-accuracy-dials/runs')).filter((entry) =>
		entry.endsWith('-' + name),
	)) {
		const seal = verifyRun('tmp/experiments/sky-accuracy-dials/runs/' + entry),
			value = JSON.parse(readRepository(seal.path, seal).toString());
		assert.ok(
			repairFailures && value.state === 'failed' && !value.result.deadlineHit,
			'A completed scientific stage or reached deadline cannot be repeated automatically.',
		);
		assert.ok(Number.isFinite(value.result.elapsedMilliseconds));
		elapsed += value.result.elapsedMilliseconds;
	}
	return elapsed;
}

/** Pin the static production collaborator closure without importing another experiment or changing its files.
 * Only repository-relative JS imports/exports are traversed; other capabilities are rejected.
 * @param {string[]} entries @param {DialFileIdentity[]} parents @returns {void}
 */
export function pinProductionClosure(entries, parents) {
	const seen = new Set();
	/** @param {string} name */
	function visit(name) {
		if (seen.has(name)) return;
		seen.add(name);
		assert.ok(
			(name.startsWith('src/algorithm32/') || name.startsWith('node_modules/three/')) && name.endsWith('.js'),
		);
		const record = identity(name);
		parents.push(record);
		const text = readRepository(name, record).toString();
		const parsed = typescript.createSourceFile(
			name,
			text,
			typescript.ScriptTarget.Latest,
			true,
			typescript.ScriptKind.JS,
		);
		for (const statement of parsed.statements) {
			if (
				!(typescript.isImportDeclaration(statement) || typescript.isExportDeclaration(statement)) ||
				!statement.moduleSpecifier
			)
				continue;
			assert.ok(typescript.isStringLiteral(statement.moduleSpecifier));
			const specifier = statement.moduleSpecifier.text;
			if (specifier.startsWith('.'))
				visit(path.posix.normalize(path.posix.join(path.posix.dirname(name), specifier)));
			else {
				assert.equal(specifier, 'three', 'Production closure has an unqualified external import.');
				visit(
					path
						.relative(repositoryRoot, fileURLToPath(import.meta.resolve(specifier)))
						.split(path.sep)
						.join('/'),
				);
			}
		}
	}
	entries.forEach(visit);
}
