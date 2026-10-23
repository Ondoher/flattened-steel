import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appendFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root = realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
export const source = 'experiments/twilight-exposure';
export const output = 'tmp/experiments/twilight-exposure';
assert.ok(existsSync(path.join(root, 'AGENTS.md')) && existsSync(path.join(root, '.git')));

/** Resolve a repository input, rejecting linked or escaping ancestors. */
export function checked(relative) {
	const absolute = path.resolve(root, relative);
	assert.ok(absolute.startsWith(root + path.sep), relative);
	let current = root;
	for (const part of path.relative(root, absolute).split(path.sep)) {
		current = path.join(current, part);
		assert.ok(!lstatSync(current).isSymbolicLink(), current);
	}
	assert.equal(realpathSync(absolute).toLowerCase(), absolute.toLowerCase());
	return absolute;
}

/** Identify an immutable input or closed output. */
export function identity(relative) {
	const absolute = checked(relative), before = lstatSync(absolute), bytes = readFileSync(absolute);
	const after = lstatSync(absolute);
	assert.equal(after.size, before.size); assert.equal(after.mtimeMs, before.mtimeMs);
	return {path: relative.replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
}

/** Remove only the current unsealed run's ephemeral owned browser profile after browser.close(). */
export function releaseBrowserWork(run) {
	const relative = run.path + '/work-browser', absolute = path.join(root, relative);
	if (!existsSync(absolute)) return;
	assert.ok(!existsSync(path.join(run.absolute, 'manifest.json')));
	assert.equal(path.dirname(checked(relative)).toLowerCase(), run.absolute.toLowerCase());
	const inspect = (folder) => {for (const entry of readdirSync(checked(folder), {withFileTypes: true})) {
		const child = folder + '/' + entry.name; checked(child); if (entry.isDirectory()) inspect(child);
	}};
	inspect(relative); rmSync(absolute, {recursive: true});
}

/** Allocate a new run; all writes and terminal evidence remain under its own directory. */
export function createRun(name, operation, parents = []) {
	assert.match(name, /^[a-z][a-z0-9-]{0,15}$/u);
	const repository = {head: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(), status: execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {cwd: root, encoding: 'utf8'})};
	const runs = path.join(checked(output), 'runs');
	if (!existsSync(runs)) mkdirSync(runs);
	checked(path.relative(root, runs));
	let maximum = -1;
	for (const entry of readdirSync(runs)) if (/^\d{5}/u.test(entry)) {
		assert.match(entry, /^\d{5}-[a-z][a-z0-9-]{0,15}$/u);
		maximum = Math.max(maximum, Number(entry.slice(0, 5)));
	}
	const relative = `${output}/runs/${String(maximum + 1).padStart(5, '0')}-${name}`;
	mkdirSync(path.join(root, relative)); checked(relative);
	const implementation = readdirSync(checked(source)).filter(n => /\.(mjs|js|json|ts)$/u.test(n)).map(n => identity(source + '/' + n));
	const started = Date.now(); let done = false;
	const write = (name, data) => {
		assert.ok(!done);
		const destination = path.resolve(root, relative, name);
		assert.ok(destination.startsWith(path.join(root, relative) + path.sep));
		mkdirSync(path.dirname(destination), {recursive: true}); checked(path.relative(root, path.dirname(destination)));
		if (existsSync(destination)) throw Error('Refusing artifact overwrite: ' + name);
		writeFileSync(destination, Buffer.isBuffer(data) || typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n', {flag: 'wx'});
	};
	const progress = (phase, message, extra = {}) => {
		assert.ok(!done); appendFileSync(path.join(root, relative, 'progress.jsonl'), JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...extra}) + '\n');
	};
	progress('start', operation);
	const timer = setInterval(() => progress('active', 'Execution active', {elapsedSeconds: (Date.now() - started) / 1000}), 20000);
	for (const item of implementation) write('implementation/' + path.basename(item.path), readFileSync(checked(item.path)));
	write('repository-start.json', repository);
	return {path: relative, absolute: path.join(root, relative), write, progress,
		finish(state, facts = {}) {
			clearInterval(timer); progress('complete', `Execution ${state}`, {state});
			const artifacts = [];
			const walk = (directory) => {for (const entry of readdirSync(checked(directory), {withFileTypes: true})) {
				const item = directory + '/' + entry.name;
				if (entry.isDirectory()) walk(item); else {assert.ok(entry.isFile()); artifacts.push(identity(item));}
			}};
			walk(relative);
			write('manifest.json', {state, operation, parents, implementation, artifacts, facts, elapsedSeconds: (Date.now() - started) / 1000, command: process.argv.slice(1), node: process.version});
			done = true; console.log(JSON.stringify({run: relative, state, ...facts}));
		},
	};
}
