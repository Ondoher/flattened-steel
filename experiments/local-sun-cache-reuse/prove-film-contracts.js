import path from 'node:path';
import {readFile, realpath} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash, hashFile} from './run-boundary.js';

/** Remove only Acorn node location fields, retaining executable syntax and raw literals.
 * @param {unknown} value - Complete parsed syntax tree or one of its children.
 * @returns {unknown} - Structurally identical tree without node locations.
 */
function withoutLocations(value) {
	if (Array.isArray(value)) return value.map(withoutLocations);
	if (value === null || typeof value !== 'object') return value;
	const record = /** @type {Record<string, unknown>} */ (value);
	return Object.fromEntries(
		Object.entries(record)
			.filter(([key]) => !(typeof record.type === 'string' && ['start', 'end', 'loc', 'range'].includes(key)))
			.map(([key, child]) => [key, withoutLocations(child)]),
	);
}

/** Authenticate final film evidence and prove the narrowly permitted comment-only remediation.
 * @returns {Promise<void>} - New immutable equivalence proof; capture/media parents remain untouched.
 */
async function main() {
	const run = await ExperimentRun.create('p6-contracts');
	let failure = null;
	try {
		if (process.argv.length !== 2) throw new Error('This focused remediation proof accepts no arguments.');
		const filmParent = await readParent('00754-p6-film', 'inputs.json');
		const qualificationParent = await readParent('00756-p6-film-report', 'result.json');
		const input = JSON.parse(new TextDecoder().decode(filmParent.bytes));
		const qualification = JSON.parse(new TextDecoder().decode(qualificationParent.bytes));
		if (
			input.schema !== 'local-sun-p6-film-input-v1' ||
			!Array.isArray(input.sources) ||
			!input.command.includes('--stage=final') ||
			qualification.schema !== 'local-sun-p6-film-qualification-v1' ||
			qualification.qualified !== true ||
			qualification.filmRun !== filmParent.run ||
			qualification.stage !== 'final' ||
			qualification.decodedFrames !== 2700
		)
			throw new Error('Expected accepted final-film and complete media-qualification parents.');
		const changedPath = 'experiments/local-sun-cache-reuse/shell-celestial.js';
		const declarationPath = 'experiments/local-sun-cache-reuse/types.d.ts';
		const comparisons = [],
			seen = new Set();
		let capturedChanged;
		for (const identity of input.sources) {
			if (
				typeof identity.path !== 'string' ||
				!Number.isSafeInteger(identity.byteLength) ||
				!/^[a-f0-9]{64}$/u.test(identity.sha256) ||
				seen.has(identity.path)
			)
				throw new Error('Malformed or repeated captured source identity.');
			seen.add(identity.path);
			const file = path.resolve(repositoryRoot, identity.path);
			const current = await hashFile(repositoryRoot, file);
			const same = current.sha256 === identity.sha256 && current.byteLength === identity.byteLength;
			if (identity.path === changedPath) {
				if (same) throw new Error('Expected the documented raw source change to be present.');
				capturedChanged = identity;
			} else if (!same) throw new Error('Unexpected captured source/asset change: ' + identity.path);
			comparisons.push({
				path: identity.path,
				captured: {sha256: identity.sha256, byteLength: identity.byteLength},
				current,
				rawBytesIdentical: same,
			});
		}
		if (!capturedChanged || comparisons.filter((row) => !row.rawBytesIdentical).length !== 1)
			throw new Error('The sole permitted changed module is absent or not unique.');
		if (seen.has(declarationPath))
			throw new Error('Declaration unexpectedly belongs to the captured executable closure.');
		await run.progress('authenticated', `Compared every captured executable/asset input: ${comparisons.length}.`);
		const gitExecutable = 'C:/Program Files/Git/cmd/git.exe';
		await checkPath(path.dirname(gitExecutable), gitExecutable);
		const commit = 'bea658817b681c5208a1debf6a18287b0f8bd8b7';
		const argumentsList = ['show', `${commit}:${changedPath}`];
		const originalResult = await promisify(execFile)(gitExecutable, argumentsList, {
			cwd: repositoryRoot,
			windowsHide: true,
			encoding: 'buffer',
			maxBuffer: 8 * 1024 * 1024,
			env: {...process.env, GIT_OPTIONAL_LOCKS: '0'},
		});
		const original = originalResult.stdout;
		if (original.length !== capturedChanged.byteLength || hash(original) !== capturedChanged.sha256)
			throw new Error('Git original does not equal the exact captured source bytes.');
		const currentPath = path.resolve(repositoryRoot, changedPath);
		await checkPath(repositoryRoot, currentPath);
		const current = await readFile(currentPath);
		const require = createRequire(import.meta.url),
			parserResolver = createRequire(require.resolve('terser')),
			parserPath = parserResolver.resolve('acorn'),
			parserPackagePath = parserResolver.resolve('acorn/package.json');
		await checkPath(repositoryRoot, parserPath);
		await checkPath(repositoryRoot, parserPackagePath);
		const parserPackage = JSON.parse(await readFile(parserPackagePath, 'utf8'));
		if (parserPackage.version !== '8.17.0') throw new Error('Expected the installed supported Acorn version.');
		const {parse} = await import(pathToFileURL(parserPath).href);
		const originalSyntax = JSON.stringify(
			withoutLocations(parse(original.toString('utf8'), {ecmaVersion: 2022, sourceType: 'module'})),
		);
		const currentSyntax = JSON.stringify(
			withoutLocations(parse(current.toString('utf8'), {ecmaVersion: 2022, sourceType: 'module'})),
		);
		if (originalSyntax !== currentSyntax)
			throw new Error('Executable syntax differs after removing only AST node location fields.');
		const originalAstSha256 = hash(originalSyntax),
			currentAstSha256 = hash(currentSyntax);
		const sources = [];
		for (const relative of [
			'experiments/local-sun-cache-reuse/prove-film-contracts.js',
			'experiments/local-sun-cache-reuse/ExperimentRun.js',
			'experiments/local-sun-cache-reuse/parent-evidence.js',
			'experiments/local-sun-cache-reuse/run-boundary.js',
			declarationPath,
			'package-lock.json',
		]) {
			const file = path.resolve(repositoryRoot, relative);
			sources.push({path: relative, ...(await hashFile(repositoryRoot, file))});
		}
		const parser = {
			name: parserPackage.name,
			version: parserPackage.version,
			options: {ecmaVersion: 2022, sourceType: 'module'},
			resolution:
				'Resolve the existing Acorn dependency from installed terser; dynamically import that exact checked file URL.',
			module: {
				path: path.relative(repositoryRoot, parserPath).replaceAll('\\', '/'),
				...(await hashFile(repositoryRoot, parserPath)),
			},
			package: {
				path: path.relative(repositoryRoot, parserPackagePath).replaceAll('\\', '/'),
				...(await hashFile(repositoryRoot, parserPackagePath)),
			},
		};
		const nodeExecutable = await realpath(process.execPath);
		const tools = {
			node: {
				version: process.version,
				invocationPath: process.execPath,
				executable: nodeExecutable,
				...(await hashFile(path.dirname(nodeExecutable), nodeExecutable)),
			},
			git: {
				executable: gitExecutable,
				...(await hashFile(path.dirname(gitExecutable), gitExecutable)),
				command: argumentsList,
				commit,
			},
		};
		await run.write('shell-celestial.original.js', original);
		await run.write('shell-celestial.current.js', current);
		await run.write('syntax.json', originalSyntax);
		await run.write('comparisons.json', JSON.stringify(comparisons, null, '\t'));
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'local-sun-p6-contract-remediation-input-v1',
					command: process.argv,
					parents: [filmParent, qualificationParent].map(({bytes, ...identity}) => identity),
					changedPath,
					declarationPath,
					parser,
					sources,
					tools,
					operation:
						'Authenticate every artifact in both accepted parent inventories. Compare every captured source/asset byte identity to the current workspace; require exactly one changed module. Authenticate its Git original against the captured raw hash and byte length, parse both complete modules with Acorn, remove only node start/end/loc/range fields, and require byte-identical serialized ASTs including literal raw text. Record declaration remediation as a separate non-executable input.',
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'local-sun-p6-contract-remediation-v1',
					passed: true,
					filmRun: filmParent.run,
					qualificationRun: qualificationParent.run,
					comparedInputs: comparisons.length,
					unchangedInputs: comparisons.length - 1,
					changedPath,
					rawOriginal: {byteLength: original.length, sha256: hash(original)},
					rawCurrent: {byteLength: current.length, sha256: hash(current)},
					originalAstSha256,
					currentAstSha256,
					executableSyntaxIdentical: true,
					declarationInCapturedExecutableClosure: false,
					limitation:
						'This proves executable syntax equivalence for the single documented source-comment remediation and records separate declaration changes. It preserves the original raw-hash mismatch and does not relax or rerun the media qualifier freshness gate, alter parent media, or replace standards-review validation.',
				},
				null,
				'\t',
			),
		);
	} catch (error) {
		failure = error instanceof Error ? error.stack : String(error);
		process.exitCode = 1;
	} finally {
		await run.finish(failure ? 'failed' : 'accepted', failure);
		console.log(run.name);
		if (failure) console.error(failure);
	}
}
await main();
