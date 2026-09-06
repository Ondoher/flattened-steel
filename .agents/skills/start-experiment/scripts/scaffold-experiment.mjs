#!/usr/bin/env node

import {lstat, mkdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
import process from 'node:process';

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exitCode = 2;
}

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
		else if (key === '--slug') values.slug = value;
		else if (key === '--title') values.title = value;
		else if (key === '--objective') values.objective = value;
		else if (key === '--acceptance') values.acceptance = value;
		else throw new Error(`Unknown argument: ${key}`);
		index += 1;
	}
	return values;
}

function requireSingleLine(name, value) {
	if (!value?.trim() || /[\r\n]/u.test(value)) throw new Error(`${name} must be a nonempty single-line value.`);
	return value.trim();
}

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

async function pathExists(target) {
	try {
		await stat(target);
		return true;
	} catch (error) {
		if (error.code === 'ENOENT') return false;
		throw error;
	}
}

function topicReadme({title, objective, slug}) {
	return `# ${title} Experiment\n\nStatus: initialized.\n\n## Objective\n\n${objective}\n\n## Governing Documents\n\n- [Design](design.md)\n- [Plan](plan.md)\n- [Status](status.md)\n\n## Repository Surfaces\n\n- Authored source and controls: \`experiments/${slug}/\`\n- Generated output: \`tmp/experiments/${slug}/\`\n- Production and other experiments: read-only unless separately authorized\n`;
}

function design({title, objective, acceptance, slug, outputContract}) {
	return `# ${title} Experiment Design\n\n## Objective\n\n${objective}\n\n## Acceptance Question\n\n${acceptance}\n\n## Isolation Boundary\n\nAuthored experiment work remains below \`experiments/${slug}/\`. Generated output remains below \`tmp/experiments/${slug}/\`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.\n\n${outputContract.trim()}\n\n## Decisions\n\nNo experiment-specific architectural decisions have been recorded yet.\n\n## Open Questions\n\n- Which smallest proof can answer the acceptance question?\n- Which inputs and comparison authorities must be pinned before execution?\n`;
}

function plan({title, acceptance}) {
	return `# ${title} Experiment Plan\n\n## Acceptance Gate\n\n${acceptance}\n\n## Work\n\n- [ ] Pin inputs, comparison authorities, environment assumptions, and measurable acceptance criteria.\n- [ ] Design the smallest isolated implementation and runner.\n- [ ] Implement progress-file reporting for every operation expected to exceed one minute.\n- [ ] Execute focused proofs into a new run directory.\n- [ ] Verify artifact hashes, provenance, containment, and the terminal result.\n- [ ] Decide whether to reject, iterate, retain as evidence, or propose production promotion.\n\n## Promotion Boundary\n\nExperiment results are evidence, not production architecture. Promotion requires a separate production-owned design, implementation plan, and verification boundary.\n`;
}

function status({title, slug}) {
	return `# ${title} Experiment Status\n\nStatus: initialized.\n\n## Current State\n\nThe topic, source root, and ignored output root are established. No implementation or run is accepted yet.\n\n## Latest Verification\n\n- Scaffold structure created.\n- Output root: \`tmp/experiments/${slug}/\`.\n- Accepted run: none.\n\n## Blockers\n\nNone recorded.\n\n## Next Action\n\nDefine pinned inputs and measurable acceptance criteria in the design and plan.\n`;
}

function sourceInstructions({title, slug}) {
	return `# ${title} Experiment\n\nKeep authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests below this directory. Write every generated artifact below \`../../tmp/experiments/${slug}/\`; never write generated output into this source tree.\n\nRead the experiment [topic](../../agents/topics/poc-experiments/engineering-studies/${slug}/README.md), [design](../../agents/topics/poc-experiments/engineering-studies/${slug}/design.md), [plan](../../agents/topics/poc-experiments/engineering-studies/${slug}/plan.md), and [status](../../agents/topics/poc-experiments/engineering-studies/${slug}/status.md) before implementation.\n\nProduction and other experiments are read-only unless the engineer separately authorizes a broader write scope. Every long-running process must follow the design's monitorable-progress contract.\n`;
}

async function validateStructure(paths) {
	const required = [
		paths.topicReadme,
		paths.design,
		paths.plan,
		paths.status,
		paths.sourceInstructions,
		paths.outputRoot,
	];
	const missing = [];
	for (const target of required) {
		if (!(await pathExists(target))) missing.push(path.relative(paths.repoRoot, target).replaceAll('\\', '/'));
	}
	if (missing.length) throw new Error(`Missing scaffold paths: ${missing.join(', ')}`);
}

try {
	const args = parseArgs(process.argv.slice(2));
	const slug = requireSingleLine('slug', args.slug);
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) throw new Error('slug must be descriptive kebab-case.');
	const repoRoot = await realpath(path.resolve(requireSingleLine('repo', args.repo)));
	for (const marker of ['.git', 'AGENTS.md', 'agents/topics/standards/manifest.md']) {
		if (!(await pathExists(path.join(repoRoot, marker))))
			throw new Error(`Repository marker is missing: ${marker}`);
	}
	const paths = {
		repoRoot,
		topicRoot: path.join(repoRoot, 'agents', 'topics', 'poc-experiments', 'engineering-studies', slug),
		sourceRoot: path.join(repoRoot, 'experiments', slug),
		outputRoot: path.join(repoRoot, 'tmp', 'experiments', slug),
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
		process.stdout.write(`${JSON.stringify({ok: true, mode: 'check', slug, standardsSet: assignment.set}, null, 2)}\n`);
	} else {
		const title = requireSingleLine('title', args.title);
		const objective = requireSingleLine('objective', args.objective);
		const acceptance = requireSingleLine('acceptance', args.acceptance);
		for (const target of [paths.topicRoot, paths.sourceRoot, paths.outputRoot]) {
			if (await pathExists(target))
				throw new Error(`Refusing to overwrite existing path: ${path.relative(repoRoot, target)}`);
		}
		const outputContract = await readFile(new URL('../references/output-contract.md', import.meta.url), 'utf8');
		await mkdir(paths.topicRoot, {recursive: true});
		await mkdir(paths.sourceRoot, {recursive: true});
		await mkdir(paths.outputRoot, {recursive: true});
		await Promise.all([
			writeFile(paths.topicReadme, topicReadme({title, objective, slug}), {encoding: 'utf8', flag: 'wx'}),
			writeFile(paths.design, design({title, objective, acceptance, slug, outputContract}), {encoding: 'utf8', flag: 'wx'}),
			writeFile(paths.plan, plan({title, acceptance}), {encoding: 'utf8', flag: 'wx'}),
			writeFile(paths.status, status({title, slug}), {encoding: 'utf8', flag: 'wx'}),
			writeFile(paths.sourceInstructions, sourceInstructions({title, slug}), {encoding: 'utf8', flag: 'wx'}),
		]);
		await validateStructure(paths);
		process.stdout.write(
			`${JSON.stringify({ok: true, mode: 'create', slug, standardsSet: assignment.set}, null, 2)}\n`,
		);
	}
} catch (error) {
	fail(error.message);
}
