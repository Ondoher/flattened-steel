#!/usr/bin/env node

import {lstat, mkdir, readFile, readdir, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
import process from 'node:process';

/** Folder-name prefix pattern for numbered experiments. */
const experimentPrefixPattern = /^(\d{5})-/u;
/** Largest sequence representable by the five-digit folder prefix. */
const maximumExperimentSequence = 99999;

/**
 * Called by the command entry to report a terminal scaffold failure.
 *
 * @param {string} message - Failure description written to standard error.
 * @returns {void}
 */
function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exitCode = 2;
}

/**
 * Called by the command entry to parse supported command-line arguments.
 *
 * @param {string[]} argv - Command-line arguments excluding the runtime and script paths.
 * @returns {ExperimentScaffoldArguments} - Parsed scaffold arguments.
 */
function parseArgs(argv) {
	const values = {};
	for (let index = 0; index < argv.length; index += 1) {
		const key = argv[index];
		if (key === '--check') {
			values.check = true;
			continue;
		}
		const value = argv[index + 1];
		if (!value) throw new Error(`${key} requires a value.`);
		if (key === '--repo') values.repo = value;
		else if (key === '--prefix') values.prefix = value;
		else if (key === '--slug') values.slug = value;
		else if (key === '--title') values.title = value;
		else if (key === '--objective') values.objective = value;
		else if (key === '--acceptance') values.acceptance = value;
		else throw new Error(`Unknown argument: ${key}`);
		index += 1;
	}
	return values;
}

/**
 * Called by ingress validation to require a nonempty single-line string.
 *
 * @param {string} name - Argument name used in failure diagnostics.
 * @param {string | undefined} value - Untrusted argument value.
 * @returns {string} - Trimmed single-line value.
 */
function requireSingleLine(name, value) {
	if (!value?.trim() || /[\r\n]/u.test(value)) throw new Error(`${name} must be a nonempty single-line value.`);
	return value.trim();
}

/**
 * Called by scaffold modes to validate a five-digit sequence prefix.
 *
 * Rejects missing, multiline, and non-five-digit values before filesystem paths are derived.
 *
 * @param {string | undefined} value - Untrusted prefix argument.
 * @returns {string} - Validated five-digit prefix.
 */
function requirePrefix(value) {
	const prefix = requireSingleLine('prefix', value);
	if (!/^\d{5}$/u.test(prefix)) throw new Error('prefix must contain exactly five decimal digits.');
	return prefix;
}

/**
 * Called by prefix allocation to identify every managed experiment parent root.
 *
 * @param {string} repoRoot - Real repository root.
 * @returns {string[]} - Topic, authored-source, and generated-output parent roots.
 */
function experimentParentRoots(repoRoot) {
	return [
		path.join(repoRoot, 'agents', 'topics', 'poc-experiments', 'engineering-studies'),
		path.join(repoRoot, 'experiments'),
		path.join(repoRoot, 'tmp', 'experiments'),
	];
}

/**
 * Called by creation mode to allocate the next nonreused experiment prefix.
 *
 * Rejects conflicting identities, prefix-bearing non-directories or links, and exhaustion at `99999`.
 *
 * @param {string} repoRoot - Real repository root.
 * @returns {Promise<string>} - Next five-digit experiment prefix.
 */
async function nextExperimentPrefix(repoRoot) {
	const identitiesByPrefix = new Map();
	for (const parentRoot of experimentParentRoots(repoRoot)) {
		let parentInfo;
		try {
			parentInfo = await lstat(parentRoot);
		} catch (error) {
			if (error.code === 'ENOENT') continue;
			throw error;
		}
		if (
			!parentInfo.isDirectory() ||
			parentInfo.isSymbolicLink() ||
			(await realpath(parentRoot)).toLowerCase() !== parentRoot.toLowerCase()
		) {
			throw new Error(`Experiment parent is not a real directory: ${parentRoot}`);
		}
		const entries = await readdir(parentRoot, {withFileTypes: true});
		for (const entry of entries) {
			const match = experimentPrefixPattern.exec(entry.name);
			if (!match) continue;
			const entryPath = path.join(parentRoot, entry.name);
			const info = await lstat(entryPath);
			if (
				!info.isDirectory() ||
				info.isSymbolicLink() ||
				(await realpath(entryPath)).toLowerCase() !== entryPath.toLowerCase()
			) {
				throw new Error(`Prefix-bearing experiment entry is not a real directory: ${entryPath}`);
			}
			const previousIdentity = identitiesByPrefix.get(match[1]);
			if (previousIdentity && previousIdentity !== entry.name) {
				throw new Error(`Experiment prefix ${match[1]} is already used by conflicting folder names.`);
			}
			identitiesByPrefix.set(match[1], entry.name);
		}
	}
	const highestSequence = Math.max(-1, ...Array.from(identitiesByPrefix.keys(), Number));
	if (highestSequence >= maximumExperimentSequence) throw new Error('No five-digit experiment prefixes remain.');
	return String(highestSequence + 1).padStart(5, '0');
}

/**
 * Called by scaffold modes to resolve the source root's configured standards set.
 *
 * Rejects canonical standards outside the Codex standards root and configured standards folders that are absent.
 *
 * @param {ExperimentScaffoldPaths} paths - Resolved scaffold paths.
 * @returns {Promise<ExperimentStandardsAssignment>} - Selected source-root standards assignment.
 */
async function resolveFolderStandards(paths) {
	const codexRoot = await realpath(process.env.CODEX_HOME || path.join(homedir(), '.codex'));
	const parserUrl = pathToFileURL(path.join(codexRoot, 'skills/normalize-standards/scripts/standards-config.mjs'));
	const {parseManifest, parseOverlay, standardsForPath} = await import(parserUrl.href);
	const manifestPath = path.join(paths.repoRoot, 'agents/topics/standards/manifest.md');
	const manifest = parseManifest((await readFile(manifestPath, 'utf8')).replaceAll('\r\n', '\n'));
	const overlay = parseOverlay(
		await readFile(path.join(paths.repoRoot, 'agents/topics/standards/overlay.md'), 'utf8'),
		manifest.selected,
	);
	const standardsRoot = await realpath(path.join(codexRoot, 'documentation/standards'));
	for (const standard of manifest.selected.values()) {
		const target = await realpath(path.resolve(path.dirname(manifestPath), standard.href));
		const relative = path.relative(standardsRoot, target);
		if (relative.startsWith('..') || path.isAbsolute(relative))
			throw new Error('Canonical standards must resolve below the Codex standards root.');
	}
	for (const folder of [
		...manifest.assignments.map((entry) => entry.folder),
		...overlay.filter((entry) => entry.kind === 'folder').map((entry) => entry.folder),
	]) {
		if (!(await stat(path.join(paths.repoRoot, folder))).isDirectory())
			throw new Error('A standards folder is not a directory: ' + folder);
	}
	return standardsForPath(
		manifest,
		path.relative(paths.repoRoot, paths.sourceInstructions).replaceAll('\\', '/'),
	).assignment;
}

/**
 * Called before scaffold reads or writes to enforce the repository boundary.
 *
 * Rejects destinations outside the repository and destinations containing a symbolic link or junction.
 *
 * @param {string} repoRoot - Real repository root.
 * @param {string} destination - Destination to validate.
 * @returns {Promise<void>}
 */
async function validateDestination(repoRoot, destination) {
	const relative = path.relative(repoRoot, destination);
	if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
		throw new Error('Scaffold destination escapes its repository.');
	let current = repoRoot;
	for (const segment of relative.split(path.sep)) {
		current = path.join(current, segment);
		try {
			const info = await lstat(current);
			if (info.isSymbolicLink() || (await realpath(current)).toLowerCase() !== current.toLowerCase())
				throw new Error('Scaffold destination contains a symlink or junction: ' + current);
		} catch (error) {
			if (error.code !== 'ENOENT') throw error;
		}
	}
}

/**
 * Called by validation and creation guards to detect an existing filesystem entry.
 *
 * @param {string} target - Filesystem path to inspect.
 * @returns {Promise<boolean>} - Whether the target exists.
 */
async function pathExists(target) {
	try {
		await stat(target);
		return true;
	} catch (error) {
		if (error.code === 'ENOENT') return false;
		throw error;
	}
}

/**
 * Called by creation mode to render the experiment topic entry.
 *
 * @param {ExperimentTopicOptions} options - Topic document values.
 * @returns {string} - Complete topic entry Markdown.
 */
function topicReadme({title, objective, experimentFolder}) {
	return `# ${title} Experiment\n\nStatus: initialized.\n\n## Objective\n\n${objective}\n\n## Governing Documents\n\n- [Design](design.md)\n- [Plan](plan.md)\n- [Status](status.md)\n\n## Repository Surfaces\n\n- Authored source and controls: \`experiments/${experimentFolder}/\`\n- Generated output: \`tmp/experiments/${experimentFolder}/\`\n- Production and other experiments: read-only unless separately authorized\n`;
}

/**
 * Called by creation mode to render the experiment design.
 *
 * @param {ExperimentDesignOptions} options - Design document values.
 * @returns {string} - Complete design Markdown.
 */
function design({title, objective, acceptance, experimentFolder, outputContract}) {
	return `# ${title} Experiment Design\n\n## Objective\n\n${objective}\n\n## Acceptance Question\n\n${acceptance}\n\n## Isolation Boundary\n\nAuthored experiment work remains below \`experiments/${experimentFolder}/\`. Generated output remains below \`tmp/experiments/${experimentFolder}/\`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.\n\n${outputContract.trim()}\n\n## Decisions\n\nNo experiment-specific architectural decisions have been recorded yet.\n\n## Open Questions\n\n- Which smallest proof can answer the acceptance question?\n- Which inputs and comparison authorities must be pinned before execution?\n`;
}

/**
 * Called by creation mode to render the experiment plan.
 *
 * @param {ExperimentPlanOptions} options - Plan document values.
 * @returns {string} - Complete plan Markdown.
 */
function plan({title, acceptance}) {
	return `# ${title} Experiment Plan\n\n## Acceptance Gate\n\n${acceptance}\n\n## Work\n\n- [ ] Pin inputs, comparison authorities, environment assumptions, and measurable acceptance criteria.\n- [ ] Design the smallest isolated implementation and runner.\n- [ ] Implement progress-file reporting for every operation expected to exceed one minute.\n- [ ] Execute focused proofs into a new run directory.\n- [ ] Verify artifact hashes, provenance, containment, and the terminal result.\n- [ ] Decide whether to reject, iterate, retain as evidence, or propose production promotion.\n\n## Promotion Boundary\n\nExperiment results are evidence, not production architecture. Promotion requires a separate production-owned design, implementation plan, and verification boundary.\n`;
}

/**
 * Called by creation mode to render the experiment status.
 *
 * @param {ExperimentDocumentOptions} options - Status document values.
 * @returns {string} - Complete status Markdown.
 */
function status({title, experimentFolder}) {
	return `# ${title} Experiment Status\n\nStatus: initialized.\n\n## Current State\n\nThe topic, source root, and ignored output root are established. No implementation or run is accepted yet.\n\n## Latest Verification\n\n- Scaffold structure created.\n- Output root: \`tmp/experiments/${experimentFolder}/\`.\n- Accepted run: none.\n\n## Blockers\n\nNone recorded.\n\n## Next Action\n\nDefine pinned inputs and measurable acceptance criteria in the design and plan.\n`;
}

/**
 * Called by creation mode to render source-root instructions.
 *
 * @param {ExperimentDocumentOptions} options - Instruction document values.
 * @returns {string} - Complete source-root instructions.
 */
function sourceInstructions({title, experimentFolder}) {
	return `# ${title} Experiment\n\nKeep authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests below this directory. Write every generated artifact below \`../../tmp/experiments/${experimentFolder}/\`; never write generated output into this source tree.\n\nRead the experiment [topic](../../agents/topics/poc-experiments/engineering-studies/${experimentFolder}/README.md), [design](../../agents/topics/poc-experiments/engineering-studies/${experimentFolder}/design.md), [plan](../../agents/topics/poc-experiments/engineering-studies/${experimentFolder}/plan.md), and [status](../../agents/topics/poc-experiments/engineering-studies/${experimentFolder}/status.md) before implementation.\n\nProduction and other experiments are read-only unless the engineer separately authorizes a broader write scope. Every long-running process must follow the design's monitorable-progress contract.\n`;
}

/**
 * Called by check and creation modes to validate the complete scaffold shape.
 *
 * Rejects missing paths and entries whose file or directory kind does not match the scaffold contract.
 *
 * @param {ExperimentScaffoldPaths} paths - Resolved scaffold paths.
 * @returns {Promise<void>}
 */
async function validateStructure(paths) {
	const requiredDirectories = [paths.topicRoot, paths.sourceRoot, paths.outputRoot];
	const requiredFiles = [
		paths.topicReadme,
		paths.design,
		paths.plan,
		paths.status,
		paths.sourceInstructions,
	];
	const missing = [];
	const malformed = [];
	for (const target of requiredDirectories) {
		if (!(await pathExists(target))) {
			missing.push(path.relative(paths.repoRoot, target).replaceAll('\\', '/'));
		} else {
			const info = await lstat(target);
			if (
				!info.isDirectory() ||
				info.isSymbolicLink() ||
				(await realpath(target)).toLowerCase() !== target.toLowerCase()
			) {
				malformed.push(`${path.relative(paths.repoRoot, target).replaceAll('\\', '/')} must be a real directory`);
			}
		}
	}
	for (const target of requiredFiles) {
		if (!(await pathExists(target))) missing.push(path.relative(paths.repoRoot, target).replaceAll('\\', '/'));
		else {
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink() || (await realpath(target)).toLowerCase() !== target.toLowerCase()) {
				malformed.push(`${path.relative(paths.repoRoot, target).replaceAll('\\', '/')} must be a real file`);
			}
		}
	}
	if (missing.length) throw new Error(`Missing scaffold paths: ${missing.join(', ')}`);
	if (malformed.length) throw new Error(`Malformed scaffold paths: ${malformed.join(', ')}`);
}

/**
 * Called by the executable entry to create or validate an experiment scaffold.
 *
 * Invalid arguments, unsafe filesystem boundaries, conflicting prefixes, existing destinations, and malformed
 * scaffolds are reported on standard error and set a nonzero process exit code.
 *
 * @param {string[]} argv - Command-line arguments excluding the runtime and script paths.
 * @returns {Promise<void>}
 */
async function main(argv = process.argv.slice(2)) {
	try {
		const args = parseArgs(argv);
		const slug = requireSingleLine('slug', args.slug);
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) throw new Error('slug must be descriptive kebab-case.');
		const repoRoot = await realpath(path.resolve(requireSingleLine('repo', args.repo)));
		for (const marker of ['.git', 'AGENTS.md', 'agents/topics/standards/manifest.md']) {
			if (!(await pathExists(path.join(repoRoot, marker))))
				throw new Error(`Repository marker is missing: ${marker}`);
		}
		let prefix;
		if (args.check) {
			prefix = requirePrefix(args.prefix);
		} else {
			const nextPrefix = await nextExperimentPrefix(repoRoot);
			if (args.prefix && requirePrefix(args.prefix) !== nextPrefix) {
				throw new Error(`The next experiment prefix is ${nextPrefix}.`);
			}
			prefix = nextPrefix;
		}
		const experimentFolder = `${prefix}-${slug}`;
		const paths = {
			repoRoot,
			topicRoot: path.join(
				repoRoot,
				'agents',
				'topics',
				'poc-experiments',
				'engineering-studies',
				experimentFolder,
			),
			sourceRoot: path.join(repoRoot, 'experiments', experimentFolder),
			outputRoot: path.join(repoRoot, 'tmp', 'experiments', experimentFolder),
		};
		Object.assign(paths, {
			topicReadme: path.join(paths.topicRoot, 'README.md'),
			design: path.join(paths.topicRoot, 'design.md'),
			plan: path.join(paths.topicRoot, 'plan.md'),
			status: path.join(paths.topicRoot, 'status.md'),
			sourceInstructions: path.join(paths.sourceRoot, 'AGENTS.md'),
		});
		for (const destination of [paths.topicRoot, paths.sourceRoot, paths.outputRoot]) {
			await validateDestination(repoRoot, destination);
		}
		const assignment = await resolveFolderStandards(paths);
		if (args.check) {
			await validateStructure(paths);
			process.stdout.write(
				`${JSON.stringify({ok: true, mode: 'check', prefix, slug, experimentFolder, standardsSet: assignment.set}, null, 2)}\n`,
			);
		} else {
			const title = requireSingleLine('title', args.title);
			const objective = requireSingleLine('objective', args.objective);
			const acceptance = requireSingleLine('acceptance', args.acceptance);
			for (const target of [paths.topicRoot, paths.sourceRoot, paths.outputRoot]) {
				if (await pathExists(target))
					throw new Error(`Refusing to overwrite existing path: ${path.relative(repoRoot, target)}`);
			}
			const outputContract = (
				await readFile(new URL('../references/output-contract.md', import.meta.url), 'utf8')
			).replaceAll('<experiment-folder>', experimentFolder);
			await mkdir(paths.topicRoot, {recursive: true});
			await mkdir(paths.sourceRoot, {recursive: true});
			await mkdir(paths.outputRoot, {recursive: true});
			await Promise.all([
				writeFile(paths.topicReadme, topicReadme({title, objective, experimentFolder}), {
					encoding: 'utf8',
					flag: 'wx',
				}),
				writeFile(paths.design, design({title, objective, acceptance, experimentFolder, outputContract}), {
					encoding: 'utf8',
					flag: 'wx',
				}),
				writeFile(paths.plan, plan({title, acceptance}), {encoding: 'utf8', flag: 'wx'}),
				writeFile(paths.status, status({title, experimentFolder}), {encoding: 'utf8', flag: 'wx'}),
				writeFile(paths.sourceInstructions, sourceInstructions({title, experimentFolder}), {
					encoding: 'utf8',
					flag: 'wx',
				}),
			]);
			await validateStructure(paths);
			process.stdout.write(
				`${JSON.stringify({ok: true, mode: 'create', prefix, slug, experimentFolder, standardsSet: assignment.set}, null, 2)}\n`,
			);
		}
	} catch (error) {
		fail(error.message);
	}
}

export {main, nextExperimentPrefix, requirePrefix, validateStructure};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
