import {spawn, execFileSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {
	copyFileSync,
	constants,
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	realpathSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Called by CLI ingress to resolve a path with no symbolic-link or junction ancestors.
 * Missing or linked paths throw; callers must correct the selected path and retry.
 *
 * @param {string} candidate - Existing absolute or current-directory-relative path.
 * @returns {string} - Absolute verified path.
 */
function checkedPath(candidate) {
	let absolute = path.resolve(candidate);
	let prefix = path.parse(absolute).root;
	for (let component of absolute.slice(prefix.length).split(path.sep).filter(Boolean)) {
		prefix = path.join(prefix, component);
		if (lstatSync(prefix).isSymbolicLink()) throw new Error(`Linked path is unsupported: ${prefix}`);
	}
	return realpathSync(absolute);
}

/**
 * Called by the launcher to translate a Windows drive path for the selected WSL distribution.
 * Unsupported non-drive paths throw; callers must choose a local Windows drive location.
 *
 * @param {string} absolute - Verified absolute Windows path.
 * @returns {string} - Linux path under the default WSL drive mount.
 */
function linuxPath(absolute) {
	if (!/^[A-Za-z]:[\\/]/.test(absolute)) throw new Error('A local Windows drive path is required.');
	return `/mnt/${absolute[0].toLowerCase()}${absolute.slice(2).replaceAll('\\', '/')}`;
}

/**
 * Called by request staging to fingerprint an exact file.
 * Filesystem read failures throw; callers must restore access before retrying.
 *
 * @param {string} filename - Existing regular-file path.
 * @param {string} relativePath - Recorded run-relative identity.
 * @returns {LibradtranFile} - Exact file identity.
 */
function identify(filename, relativePath) {
	let bytes = readFileSync(filename);
	return {path: relativePath, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
}

/**
 * Called by CLI ingress to read a JSON object without trusting its property types.
 * Missing, malformed or non-object input throws; callers must correct the selected JSON file.
 *
 * @param {string} filename - Existing configuration or metadata file.
 * @returns {Record<string, unknown>} - Parsed ingress object.
 */
function readObject(filename) {
	let value = JSON.parse(readFileSync(filename, 'utf8'));
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Expected object: ${filename}`);
	return value;
}

/**
 * Called by CLI ingress to validate an explicit existing WSL installation.
 * Invalid fields throw; callers must correct installation JSON rather than install or substitute a solver.
 *
 * @param {string} filename - Verified installation JSON path.
 * @returns {LibradtranInstallation} - Validated immutable installation values.
 */
function readInstallation(filename) {
	let value = readObject(filename);
	for (let name of [
		'distribution',
		'user',
		'wslExecutable',
		'executable',
		'dataDirectory',
		'expectedVersion',
		'expectedSha256',
	]) {
		if (typeof value[name] !== 'string' || !value[name].trim() || /[\r\n\0]/.test(value[name])) {
			throw new Error(`Invalid installation property: ${name}`);
		}
	}
	const installation = /** @type {LibradtranInstallation} */ (/** @type {unknown} */ (value));
	if (!installation.executable.startsWith('/') || !installation.dataDirectory.startsWith('/')) {
		throw new Error('Executable and data directory must be absolute Linux paths.');
	}
	if (!/^[a-f0-9]{64}$/.test(installation.expectedSha256))
		throw new Error('Expected executable SHA-256 is required.');
	if (!/^[A-Za-z]:[\\/]/.test(installation.wslExecutable))
		throw new Error('WSL launcher must be an absolute Windows drive path.');
	checkedPath(installation.wslExecutable);
	if (!lstatSync(installation.wslExecutable).isFile()) throw new Error('WSL launcher must be a regular file.');
	return installation;
}

/**
 * Called by staging to validate trusted repository-authored scientific configuration.
 * Missing/invalid metadata or a nontext/empty deck throws; callers must correct the
 * selected bundle. Native libRadtran owns input-language semantics. This API does
 * not accept untrusted uploaded decks or restrict the solver's filesystem authority.
 *
 * @param {string} directory - Verified case directory containing case.json and input.inp.
 * @returns {LibradtranCase} - Authored interpretation, not an accuracy certificate.
 */
function readCase(directory) {
	let value = readObject(checkedPath(path.join(directory, 'case.json')));
	for (let name of ['purpose', 'geometry', 'quantity', 'units']) {
		if (typeof value[name] !== 'string' || !value[name].trim()) throw new Error(`Missing case metadata: ${name}`);
	}
	if (
		!Array.isArray(value.limitations) ||
		!value.limitations.every((item) => typeof item === 'string' && item.trim())
	) {
		throw new Error('case.json requires a limitations string array.');
	}
	let deck = new TextDecoder('utf-8', {fatal: true}).decode(
		readFileSync(checkedPath(path.join(directory, 'input.inp'))),
	);
	if (!deck.trim() || deck.includes('\0')) throw new Error('input.inp must be nonempty UTF-8 text without NUL.');
	return /** @type {LibradtranCase} */ (/** @type {unknown} */ (value));
}

/**
 * Called by CLI ingress to validate commands and explicit options.
 * Invalid, duplicate or missing arguments throw; callers must use the documented command shape.
 *
 * @param {readonly string[]} argumentsList - Arguments after the script path.
 * @param {string} repository - Verified repository root, independent of working directory.
 * @returns {LibradtranOptions} - Validated invocation.
 */
function parseOptions(argumentsList, repository) {
	let command = argumentsList[0];
	if (command !== 'doctor' && command !== 'smoke' && command !== 'run')
		throw new Error('Choose doctor, smoke or run.');
	const options = new Map();
	for (let index = 1; index < argumentsList.length; index += 2) {
		let option = argumentsList[index];
		let value = argumentsList[index + 1];
		if (!['--case', '--installation', '--timeout-seconds'].includes(option) || !value || options.has(option)) {
			throw new Error(`Invalid or duplicate option: ${option}`);
		}
		options.set(option, value);
	}
	if ((command === 'run') !== options.has('--case')) throw new Error('Only run requires --case DIRECTORY.');
	let timeoutSeconds = Number(options.get('--timeout-seconds') ?? 120);
	if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1)
		throw new Error('Timeout must be a positive integer in seconds.');
	return {
		command,
		installationPath: checkedPath(
			options.get('--installation') ?? path.join(repository, 'scripts/libradtran/installation.json'),
		),
		caseDirectory:
			command === 'doctor'
				? null
				: checkedPath(
						command === 'smoke'
							? path.join(repository, 'scripts/libradtran/cases/smoke')
							: options.get('--case'),
					),
		timeoutSeconds,
	};
}

/**
 * Called by staging to copy a self-contained case without modifying its source.
 * Linked, nonregular or unreadable entries throw; callers must repair the bundle and start a fresh run.
 *
 * @param {string} source - Verified source case directory.
 * @param {string} destination - Newly allocated case copy directory.
 * @returns {LibradtranFile[]} - Exact identities of all copied bundle files.
 */
function copyBundle(source, destination) {
	let entries = [];
	let pending = [''];
	for (let index = 0; index < pending.length; index++) {
		let relative = pending[index];
		let origin = path.join(source, relative);
		let target = path.join(destination, relative);
		let info = lstatSync(origin);
		if (info.isSymbolicLink()) throw new Error(`Linked case input: ${origin}`);
		if (info.isDirectory()) {
			mkdirSync(target);
			for (let name of readdirSync(origin).sort()) pending.push(path.join(relative, name));
		} else if (info.isFile()) {
			copyFileSync(origin, target, constants.COPYFILE_EXCL);
			entries.push(identify(target, `case/${relative.replaceAll('\\', '/')}`));
		} else throw new Error(`Nonregular case input: ${origin}`);
	}
	return entries;
}

/**
 * Called by main to execute one copied worker with bounded launch and progress reporting.
 * WSL startup failures return nonzero and retain launch logs; callers must repair WSL and create a new run.
 * Worker failure or timeout returns nonzero; inspect manifest.json before selecting another invocation.
 * A host receipt write failure rejects; preserve the pending run and restore filesystem access.
 *
 * @param {LibradtranRequest} request - Captured immutable execution request.
 * @param {string} runDirectory - Host directory receiving only this new run's artifacts.
 * @returns {Promise<number>} - Zero only for a successfully finalized worker run.
 */
async function launch(request, runDirectory) {
	return new Promise((resolve, reject) => {
		let child = spawn(request.installation.wslExecutable, [...request.launchArguments], {windowsHide: true});
		let stdout = '';
		let stderr = '';
		let launchError = '';
		let started = Date.now();
		child.stdout.on('data', (chunk) => {
			stdout += chunk.toString();
			process.stdout.write(chunk);
		});
		child.stderr.on('data', (chunk) => {
			stderr += chunk.toString();
			process.stderr.write(chunk);
		});
		child.on('error', (error) => {
			launchError = error.message;
		});
		let cancelled = false;
		/**
		 * Called by active host signal handlers to request cooperative Linux cleanup.
		 * A run-directory write failure records a host error; preserve its pending
		 * evidence and use the Linux execution deadline for eventual cleanup.
		 *
		 * @returns {void} - Cancellation marker persisted once for this invocation.
		 */
		let cancel = () => {
			if (!cancelled) {
				cancelled = true;
				try {
					writeFileSync(path.join(runDirectory, 'cancel.request'), 'Host cancellation requested.\n', {
						flag: 'wx',
					});
					console.error('libRadtran: cancellation requested; waiting for Linux cleanup.');
				} catch (error) {
					launchError = `Could not persist cancellation: ${String(error)}`;
					console.error(launchError);
				}
			}
		};
		process.on('SIGINT', cancel);
		process.on('SIGTERM', cancel);
		let timer = setInterval(() => {
			let elapsed = Date.now() - started;
			let ready = existsSync(path.join(runDirectory, 'started.json'));
			if ((!ready && elapsed > 30000) || elapsed > (request.timeoutSeconds + 120) * 1000) {
				launchError = ready
					? 'Worker exceeded total host deadline.'
					: 'WSL launch timed out; inspect WSLService.';
				child.kill('SIGKILL');
			}
		}, 1000);
		child.on('close', (code, signal) => {
			clearInterval(timer);
			process.removeListener('SIGINT', cancel);
			process.removeListener('SIGTERM', cancel);
			try {
				writeFileSync(
					path.join(runDirectory, 'launch.json'),
					JSON.stringify(
						{code, signal, launchError, stdout, stderr, elapsedMilliseconds: Date.now() - started},
						null,
						2,
					),
					{flag: 'wx'},
				);
			} catch (error) {
				reject(error);
				return;
			}
			if (launchError) console.error(launchError);
			resolve(
				code === 0 && !launchError && !cancelled && existsSync(path.join(runDirectory, 'manifest.json'))
					? 0
					: 1,
			);
		});
	});
}

/**
 * Called by the CLI to allocate an independent validation-tool run and launch the existing solver.
 * Invalid configuration, inaccessible paths or staging failure reject; the top-level boundary reports
 * the error and exits nonzero. Missing repository identity, an unignored output root, a case outside
 * the repository or a case containing the output root also reject. Use the installed repository CLI,
 * select a contained case, restore the declared ignored output root and create a new run.
 * Preserve any printed partial run directory rather than trying to overwrite it.
 *
 * @returns {Promise<void>} - Completion after the worker and host logs have finalized.
 */
async function main() {
	if (process.argv.length === 2 || process.argv[2] === '--help') {
		console.log(
			'Usage: npm run libradtran -- doctor|smoke|run [--case DIRECTORY] [--installation FILE] [--timeout-seconds N]\nSee scripts/libradtran/README.md for case and evidence contracts.',
		);
		return;
	}
	let repository = checkedPath(fileURLToPath(new URL('../../', import.meta.url)));
	if (!existsSync(path.join(repository, '.git')) || !existsSync(path.join(repository, 'package.json')))
		throw new Error('Repository identity is missing.');
	const options = parseOptions(process.argv.slice(2), repository);
	const installation = readInstallation(options.installationPath);
	let caseMetadata = options.caseDirectory ? readCase(options.caseDirectory) : null;
	let outputRoot = path.join(repository, '.codex-tmp/libradtran/runs');
	if (options.caseDirectory && !path.relative(options.caseDirectory, outputRoot).startsWith('..'))
		throw new Error('Case directory must not contain the output root.');
	if (options.caseDirectory && path.relative(repository, options.caseDirectory).startsWith('..'))
		throw new Error('Case bundle must be inside this repository.');
	execFileSync('git', ['check-ignore', '--quiet', '--no-index', '--', '.codex-tmp/libradtran/runs/probe'], {
		cwd: repository,
		windowsHide: true,
	});
	let prefix = repository;
	for (let component of ['.codex-tmp', 'libradtran', 'runs']) {
		prefix = path.join(prefix, component);
		if (!existsSync(prefix)) mkdirSync(prefix);
		checkedPath(prefix);
	}
	const runDirectory = path.join(outputRoot, `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${randomUUID()}`);
	mkdirSync(runDirectory);
	console.log(`libRadtran run: ${runDirectory}`);
	let inputs = options.caseDirectory ? copyBundle(options.caseDirectory, path.join(runDirectory, 'case')) : [];
	for (let name of ['worker.py', 'cli.js']) {
		copyFileSync(
			path.join(repository, 'scripts/libradtran', name),
			path.join(runDirectory, name),
			constants.COPYFILE_EXCL,
		);
		inputs.push(identify(path.join(runDirectory, name), name));
	}
	copyFileSync(options.installationPath, path.join(runDirectory, 'installation.json'), constants.COPYFILE_EXCL);
	inputs.push(identify(path.join(runDirectory, 'installation.json'), 'installation.json'));
	let workerPath = `${linuxPath(runDirectory)}/worker.py`;
	const launchArguments = [
		'-d',
		installation.distribution,
		'--user',
		installation.user,
		'--cd',
		linuxPath(runDirectory),
		'--exec',
		'python3',
		'-B',
		workerPath,
		`${linuxPath(runDirectory)}/request.json`,
	];
	const request = {
		schema: 'libradtran-tool-request/1',
		command: options.command,
		installation,
		runDirectory: linuxPath(runDirectory),
		inputs,
		case: caseMetadata,
		timeoutSeconds: options.timeoutSeconds,
		launchArguments,
		sourceCase: options.caseDirectory,
	};
	writeFileSync(path.join(runDirectory, 'request.json'), JSON.stringify(request, null, 2), {flag: 'wx'});
	process.exitCode = await launch(request, runDirectory);
}

main().catch((error) => {
	console.error(`libRadtran: ${error.message}`);
	process.exitCode = 1;
});
