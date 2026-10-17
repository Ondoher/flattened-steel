import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {cpSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Called by verification to hash exact retained bytes.
 * Unreadable files throw; preserve the failed proof directory and restore access.
 *
 * @param {string} filename - Existing regular file.
 * @returns {string} - Lowercase SHA-256.
 */
function hashFile(filename) {
	return createHash('sha256').update(readFileSync(filename)).digest('hex');
}

/**
 * Called by verification to read an owned JSON artifact.
 * Missing/malformed evidence throws; the proof must fail rather than assume success.
 *
 * @param {string} filename - Evidence JSON file.
 * @returns {unknown} - Parsed evidence for independent assertions.
 */
function readJson(filename) {
	return JSON.parse(readFileSync(filename, 'utf8'));
}

/**
 * Called by proof scenarios to invoke the public CLI and check its exit disposition.
 * A wrong exit, launch failure or overall proof deadline throws; inspect retained
 * observations and repair the implementation before creating a new proof record.
 *
 * @param {LibradtranProofContext} context - Current proof owner.
 * @param {string} name - Behavioral scenario name.
 * @param {readonly string[]} argumentsList - Public CLI arguments.
 * @param {number} expected - Required exit status.
 * @returns {LibradtranProofObservation} - Captured result and allocated run identity.
 */
function invoke(context, name, argumentsList, expected) {
	let started = Date.now();
	let result = spawnSync(
		process.execPath,
		[path.join(context.repository, 'scripts/libradtran/cli.js'), ...argumentsList],
		{
			cwd: context.directory,
			encoding: 'utf8',
			windowsHide: true,
			timeout: 45000,
		},
	);
	let observation = {
		name,
		argumentsList,
		status: result.status,
		stdout: result.stdout ?? '',
		stderr: result.stderr ?? '',
		runDirectory: result.stdout?.match(/libRadtran run: (.+)/)?.[1].trim() ?? null,
		elapsedMilliseconds: Date.now() - started,
	};
	writeFileSync(path.join(context.directory, `${name}.json`), JSON.stringify(observation, null, 2), {flag: 'wx'});
	assert.equal(result.status, expected, JSON.stringify(observation));
	return observation;
}

/**
 * Called by verification to require the allocated run location.
 * Missing run identity throws; the proof reports the absent evidence.
 *
 * @param {LibradtranProofObservation} observation - Captured public invocation.
 * @returns {string} - Nonempty retained run path.
 */
function directoryFor(observation) {
	assert.ok(observation.runDirectory, 'Expected a retained run directory');
	return observation.runDirectory;
}

/**
 * Called by verification to read the worker fields asserted by the proof.
 * Missing or malformed evidence throws; preserve the failed invocation for diagnosis.
 *
 * @param {LibradtranProofObservation} observation - Completed CLI observation.
 * @returns {LibradtranResult} - Worker result consumed by explicit assertions.
 */
function manifestFor(observation) {
	return /** @type {LibradtranResult} */ (readJson(path.join(directoryFor(observation), 'manifest.json')));
}

/**
 * Called by proof scenarios to authenticate every worker-retained artifact independently.
 * Changed length or bytes throws; preserve the mismatching run for investigation.
 *
 * @param {string} runDirectory - Completed tool run.
 * @returns {void} - Assertion failure for any changed or missing artifact.
 */
function verifyArtifacts(runDirectory) {
	let manifest = /** @type {LibradtranResult} */ (readJson(path.join(runDirectory, 'manifest.json')));
	for (let artifact of manifest.artifacts) {
		let filename = path.join(runDirectory, artifact.path);
		assert.equal(lstatSync(filename).size, artifact.bytes);
		assert.equal(hashFile(filename), artifact.sha256);
	}
}

/**
 * Called by lifecycle proofs to assert the fixture process is no longer running.
 * A live process or WSL inspection failure throws; investigate cleanup before acceptance.
 *
 * @param {LibradtranProofContext} context - Current installed WSL lane.
 * @param {string} runDirectory - Failed fixture run with its retained PID.
 * @returns {void} - Successful assertion when Linux reports no such process.
 */
function verifyProcessGone(context, runDirectory) {
	let pid = readFileSync(path.join(runDirectory, 'execution/solver.pid'), 'utf8').trim();
	assert.match(pid, /^\d+$/);
	let result = spawnSync(
		context.installation.wslExecutable,
		[
			'-d',
			context.installation.distribution,
			'--user',
			context.installation.user,
			'--exec',
			'python3',
			'-c',
			'import os,sys;\ntry: os.kill(int(sys.argv[1]),0)\nexcept ProcessLookupError: print("gone")\nelse: print("alive")',
			pid,
		],
		{encoding: 'utf8', windowsHide: true, timeout: 10000},
	);
	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout.trim(), 'gone');
}

/**
 * Called by verification to request cooperative cancellation after the fixture starts.
 * Failure to start/cancel/finalize by the bounded deadline rejects; inspect retained
 * logs. The fixture's Linux timeout remains the final cleanup boundary.
 *
 * @param {LibradtranProofContext} context - Current proof owner.
 * @param {string} fixtureConfig - Alternate configuration for the temporary Python fixture.
 * @param {string} smokeCase - Trusted operational case source.
 * @returns {Promise<string>} - Failed tool run with confirmed cleanup.
 */
async function verifyCancellation(context, fixtureConfig, smokeCase) {
	return new Promise((resolve, reject) => {
		let child = spawn(
			process.execPath,
			[
				path.join(context.repository, 'scripts/libradtran/cli.js'),
				'run',
				'--case',
				smokeCase,
				'--installation',
				fixtureConfig,
				'--timeout-seconds',
				'10',
			],
			{cwd: context.directory, windowsHide: true},
		);
		let stdout = '',
			stderr = '',
			runDirectory = '',
			cancelled = false;
		let started = Date.now();
		child.stdout.on('data', (chunk) => {
			stdout += chunk;
			runDirectory = stdout.match(/libRadtran run: (.+)/)?.[1].trim() ?? '';
		});
		child.stderr.on('data', (chunk) => {
			stderr += chunk;
		});
		child.on('error', reject);
		let timer = setInterval(() => {
			if (runDirectory && !cancelled && existsSync(path.join(runDirectory, 'execution/solver.pid'))) {
				try {
					writeFileSync(path.join(runDirectory, 'cancel.request'), 'Maintained proof cancellation.\n', {
						flag: 'wx',
					});
					cancelled = true;
				} catch (error) {
					clearInterval(timer);
					reject(error);
				}
			}
			if (Date.now() - started > 15000) {
				clearInterval(timer);
				child.kill();
				reject(new Error('Cancellation proof deadline exceeded'));
			}
		}, 25);
		child.on('close', (status) => {
			clearInterval(timer);
			try {
				writeFileSync(
					path.join(context.directory, 'cancellation.json'),
					JSON.stringify({status, cancelled, runDirectory, stdout, stderr}, null, 2),
					{flag: 'wx'},
				);
				assert.equal(status, 1);
				assert.equal(cancelled, true);
				let manifest = /** @type {LibradtranResult} */ (readJson(path.join(runDirectory, 'manifest.json')));
				assert.ok(manifest.error);
				assert.equal(manifest.error.type, 'InterruptedError');
				verifyProcessGone(context, runDirectory);
				resolve(runDirectory);
			} catch (error) {
				reject(error);
			}
		});
	});
}

/**
 * Called by the one-shot verification command to exercise live solver and failure contracts.
 * Missing WSL/setup, assertion failure or inaccessible paths rejects; the CLI boundary
 * exits nonzero and reports the retained proof directory. Correct the issue and start
 * a new verification invocation; do not overwrite prior proof evidence.
 *
 * @returns {Promise<void>} - Completion after all public behavior assertions pass.
 */
async function main() {
	const repository = fileURLToPath(new URL('../../', import.meta.url));
	let outputRoot = path.join(repository, '.codex-tmp/libradtran/verification');
	let prefix = path.parse(repository).root;
	for (let component of outputRoot.slice(prefix.length).split(path.sep).filter(Boolean)) {
		prefix = path.join(prefix, component);
		if (!existsSync(prefix)) mkdirSync(prefix);
		assert.equal(lstatSync(prefix).isSymbolicLink(), false, `Linked proof output: ${prefix}`);
	}
	const directory = path.join(realpathSync(outputRoot), randomUUID());
	mkdirSync(directory);
	console.log(`libRadtran verification: ${directory}`);
	const installation = /** @type {LibradtranInstallation} */ (
		readJson(path.join(repository, 'scripts/libradtran/installation.json'))
	);
	const context = {repository, directory, installation};
	let smokeCase = path.join(repository, 'scripts/libradtran/cases/smoke');
	let records = [];
	let invalidCommand = invoke(context, 'invalid-command', ['unknown'], 1);
	assert.match(invalidCommand.stderr, /Choose doctor/);
	records.push(invalidCommand);
	let duplicateOption = invoke(
		context,
		'duplicate-option',
		['doctor', '--timeout-seconds', '2', '--timeout-seconds', '3'],
		1,
	);
	assert.match(duplicateOption.stderr, /duplicate option/);
	records.push(duplicateOption);
	let caseDirectory = path.join(directory, 'case with spaces');
	cpSync(smokeCase, caseDirectory, {recursive: true, errorOnExist: true, force: false});
	let originalMetadata = /** @type {LibradtranCase} */ (readJson(path.join(caseDirectory, 'case.json')));
	for (let change of [{purpose: ''}, {geometry: 7}, {limitations: [3]}, {limitations: ['']}]) {
		writeFileSync(path.join(caseDirectory, 'case.json'), JSON.stringify({...originalMetadata, ...change}));
		let observation = invoke(context, `malformed-metadata-${records.length}`, ['run', '--case', caseDirectory], 1);
		assert.match(observation.stderr, /Missing case metadata|limitations string array/);
		records.push(observation);
	}
	writeFileSync(path.join(caseDirectory, 'case.json'), JSON.stringify(originalMetadata));
	writeFileSync(path.join(caseDirectory, 'input.inp'), '\0');
	let badDeck = invoke(context, 'nontext-deck', ['run', '--case', caseDirectory], 1);
	assert.match(badDeck.stderr, /nonempty UTF-8/);
	records.push(badDeck);
	let wrongConfig = path.join(directory, 'wrong-installation.json');
	writeFileSync(wrongConfig, JSON.stringify({...installation, expectedSha256: '0'.repeat(64)}));
	let wrongHash = invoke(context, 'wrong-hash', ['doctor', '--installation', wrongConfig], 1);
	let wrongHashManifest = manifestFor(wrongHash);
	assert.ok(wrongHashManifest.error);
	assert.match(wrongHashManifest.error.message, /SHA-256/);
	records.push(wrongHash);
	writeFileSync(wrongConfig, JSON.stringify({...installation, wslExecutable: 'relative-wsl.exe'}));
	let relativeLauncher = invoke(context, 'relative-launcher', ['doctor', '--installation', wrongConfig], 1);
	assert.match(relativeLauncher.stderr, /absolute Windows/);
	records.push(relativeLauncher);
	let smoke = invoke(context, 'live-smoke', ['smoke'], 0);
	let smokeManifest = manifestFor(smoke);
	assert.equal(smokeManifest.status, 'succeeded');
	assert.ok(smokeManifest.smoke);
	assert.equal(smokeManifest.smoke.rows.length, 3);
	assert.equal(smokeManifest.accuracyQualified, false);
	let smokeDirectory = directoryFor(smoke);
	let originalManifestHash = hashFile(path.join(smokeDirectory, 'manifest.json'));
	records.push(smoke);
	let generic = invoke(context, 'live-generic', ['run', '--case', smokeCase], 0);
	assert.equal(manifestFor(generic).status, 'succeeded');
	assert.equal(manifestFor(generic).smoke, undefined);
	verifyArtifacts(directoryFor(generic));
	records.push(generic);
	let fixture = path.join(directory, 'fixture-uvspec.py');
	writeFileSync(
		fixture,
		'#!/usr/bin/python3\nimport sys,time,os,pathlib\nif "-v" in sys.argv:\n print("uvspec, version proof-fixture")\nelse:\n pathlib.Path("solver.pid").write_text(str(os.getpid()))\n time.sleep(60)\n print("450 1")\n',
	);
	let linuxFixture = `/mnt/${fixture[0].toLowerCase()}${fixture.slice(2).replaceAll('\\', '/')}`;
	let chmod = spawnSync(
		installation.wslExecutable,
		['-d', installation.distribution, '--user', installation.user, '--exec', 'chmod', '755', linuxFixture],
		{encoding: 'utf8', windowsHide: true, timeout: 10000},
	);
	assert.equal(chmod.status, 0, chmod.stderr);
	let fixtureConfig = path.join(directory, 'fixture.json');
	writeFileSync(
		fixtureConfig,
		JSON.stringify({
			...installation,
			executable: linuxFixture,
			expectedVersion: 'proof-fixture',
			expectedSha256: hashFile(fixture),
		}),
	);
	let timeout = invoke(
		context,
		'timeout',
		['run', '--case', smokeCase, '--installation', fixtureConfig, '--timeout-seconds', '1'],
		1,
	);
	let timeoutManifest = manifestFor(timeout);
	assert.ok(timeoutManifest.error);
	assert.equal(timeoutManifest.error.type, 'TimeoutError');
	verifyProcessGone(context, directoryFor(timeout));
	records.push(timeout);
	let cancellationRun = await verifyCancellation(context, fixtureConfig, smokeCase);
	assert.equal(hashFile(path.join(smokeDirectory, 'manifest.json')), originalManifestHash);
	verifyArtifacts(smokeDirectory);
	let result = {
		passed: true,
		assertions: records.length + 1,
		records,
		cancellationRun,
		earlierRunUnchanged: true,
		fixtureProcessesGone: true,
	};
	writeFileSync(path.join(directory, 'result.json'), JSON.stringify(result, null, 2), {flag: 'wx'});
	console.log(`libRadtran verification passed: ${result.assertions} scenarios`);
}

main().catch((error) => {
	console.error(`libRadtran verification failed: ${error.message}`);
	process.exitCode = 1;
});
