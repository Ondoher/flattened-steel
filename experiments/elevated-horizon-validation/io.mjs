import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {
	appendFileSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	realpathSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root = realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
export const source = 'experiments/elevated-horizon-validation';
export const output = 'tmp/experiments/elevated-horizon-validation';
assert.ok(existsSync(path.join(root, 'AGENTS.md')) && existsSync(path.join(root, '.git')));

/** Resolve an existing repository input without linked ancestors. */
export function checked(relative) {
	const absolute = path.resolve(root, relative);
	assert.ok(absolute.startsWith(root + path.sep));
	let current = root;
	for (const segment of path.relative(root, absolute).split(path.sep)) {
		current = path.join(current, segment);
		assert.ok(!lstatSync(current).isSymbolicLink());
	}
	assert.equal(realpathSync(absolute).toLowerCase(), absolute.toLowerCase());
	return absolute;
}

/** Authenticate a read-only parent artifact. */
export function identity(relative) {
	const bytes = readFileSync(checked(relative));
	return {
		path: relative.replaceAll('\\', '/'),
		bytes: bytes.length,
		sha256: createHash('sha256').update(bytes).digest('hex'),
	};
}

/** Allocate one immutable, monitorable evidence execution. */
export function createRun(name, operation, parents = []) {
	assert.match(name, /^[a-z][a-z0-9-]{0,15}$/u);
	const runs = path.join(checked(output), 'runs');
	if (!existsSync(runs)) mkdirSync(runs);
	let sequence = -1;
	for (const entry of readdirSync(runs)) {
		if (/^\d{5}/u.test(entry)) {
			assert.match(entry, /^\d{5}-[a-z][a-z0-9-]{0,15}$/u);
			sequence = Math.max(sequence, Number(entry.slice(0, 5)));
		}
	}
	const relative = `${output}/runs/${String(sequence + 1).padStart(5, '0')}-${name}`;
	mkdirSync(path.join(root, relative));
	checked(relative);
	const implementation = readdirSync(checked(source))
		.filter((n) => /\.(mjs|js|py|json|ts)$/u.test(n))
		.map((n) => identity(source + '/' + n));
	const head = readFileSync(path.join(root, '.git/HEAD'), 'utf8').trim();
	const ref = head.startsWith('ref: ') ? head.slice(5) : null;
	const revision = ref
		? existsSync(path.join(root, '.git', ref))
			? readFileSync(path.join(root, '.git', ref), 'utf8').trim()
			: readFileSync(path.join(root, '.git/packed-refs'), 'utf8')
					.split(/\r?\n/u)
					.find((line) => line.endsWith(' ' + ref))
					.split(' ')[0]
		: head;
	const started = Date.now();
	let done = false;
	const progress = (phase, message, extra = {}) => {
		assert.ok(!done);
		appendFileSync(
			path.join(root, relative, 'progress.jsonl'),
			JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...extra}) + '\n',
		);
	};
	progress('start', operation);
	const heartbeat = setInterval(
		() => progress('active', 'Execution active', {elapsedSeconds: (Date.now() - started) / 1000}),
		20000,
	);
	const write = (name, data) => {
		assert.ok(!done);
		const destination = path.resolve(root, relative, name);
		assert.ok(destination.startsWith(path.join(root, relative) + path.sep));
		mkdirSync(path.dirname(destination), {recursive: true});
		checked(path.relative(root, path.dirname(destination)));
		writeFileSync(
			destination,
			Buffer.isBuffer(data) || typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n',
			{flag: 'wx'},
		);
	};
	for (const entry of implementation)
		write('implementation/' + path.basename(entry.path), readFileSync(checked(entry.path)));
	return {
		path: relative,
		absolute: path.join(root, relative),
		write,
		progress,
		finish(state, facts = {}) {
			clearInterval(heartbeat);
			progress('complete', `Execution ${state}`, {state});
			const artifacts = [];
			const walk = (directory) => {
				for (const entry of readdirSync(checked(directory), {withFileTypes: true})) {
					const item = directory + '/' + entry.name;
					if (entry.isDirectory()) walk(item);
					else {
						assert.ok(entry.isFile());
						artifacts.push(identity(item));
					}
				}
			};
			walk(relative);

			write('manifest.json', {
				state,
				operation,
				parents,
				implementation,
				artifacts,
				facts,
				elapsedSeconds: (Date.now() - started) / 1000,
				revision,
				command: process.argv.slice(1),
				node: process.version,
			});
			done = true;
			console.log(JSON.stringify({run: relative, state, ...facts}));
		},
	};
}

/** Run a child with logs owned by the current run. */
export async function command(run, name, args, env = {}) {
	const start = Date.now();
	return await new Promise((resolve, reject) => {
		const child = spawn(process.execPath, args, {
			cwd: root,
			windowsHide: true,
			env: {...process.env, ...env},
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		let stdout = '',
			stderr = '';
		child.stdout.on('data', (b) => {
			stdout += b;
		});
		child.stderr.on('data', (b) => {
			stderr += b;
		});
		child.on('error', reject);
		child.on('close', (code) => {
			run.write(name + '.log', stdout + stderr);
			resolve({code, stdout, stderr, seconds: (Date.now() - start) / 1000});
		});
	});
}
