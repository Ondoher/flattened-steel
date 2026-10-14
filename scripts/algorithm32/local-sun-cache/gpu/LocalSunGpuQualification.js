import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	existsSync,
	createReadStream,
	openSync,
	writeSync,
	closeSync,
} from 'node:fs';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {LocalSunNormalizationControls} from '../normalization/LocalSunNormalizationControls.js';
import {rollup, VERSION as rollupVersion} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {babel} from '@rollup/plugin-babel';
import {transformSync} from '@babel/core';
import puppeteer from 'puppeteer';
import {LocalSunAssemblyControls} from '../assembly/LocalSunAssemblyControls.js';

/** Owner-authorized free-memory reserve for subsequent runs, 2026-10-13. */
const FREE_MEMORY_RESERVE_BYTES = 4 * 1024 ** 3;
/** Unchanged sampled working-set ceiling for this job's owned process tree. */
const OWNED_PROCESS_CEILING_BYTES = 8 * 1024 ** 3;

/** Serialized, resource-bounded offline host for immutable production GPU qualification. */
export class LocalSunGpuQualification {
	/** Existing repository-identity/real-path boundary.
	 *
	 * @type {LocalSunNormalizationControls}
	 */
	_paths = new LocalSunAssemblyControls().paths;

	/** Called by the host to sample the owned Node/Chrome process tree without inspecting command-line contents.
	 *
	 * @param {number} browserPid - This job's owned Chrome root process.
	 * @returns {number} - Sum of sampled working sets in bytes; shared pages may be counted more than once.
	 */
	_processBytes(browserPid) {
		let script = `$rows=Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,WorkingSetSize; $owned=@(${process.pid},${browserPid}); $changed=$true; while($changed){$changed=$false; foreach($row in $rows){if(($owned -contains [int]$row.ParentProcessId) -and -not($owned -contains [int]$row.ProcessId)){$owned+=[int]$row.ProcessId;$changed=$true}}}; ($rows | Where-Object {$owned -contains [int]$_.ProcessId} | Measure-Object -Property WorkingSetSize -Sum).Sum`;
		return Number(
			execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
				encoding: 'utf8',
				windowsHide: true,
				timeout: 10000,
			}).trim(),
		);
	}

	/** Call this method to sample a sibling bounded proof's owned process tree with the existing host monitor.
	 *
	 * @param {number} rootPid - Explicit proof-owned browser/process root.
	 * @returns {number} - Observed total working-set bytes, including this Node host.
	 */
	sampleOwnedProcessBytes(rootPid) {
		return this._processBytes(rootPid);
	}

	/** Called by execution to authenticate complete independent fields and their frozen whole-field identities.
	 *
	 * @returns {LocalSunGpuIndependentFields} - Immutable complete physical control inventory.
	 * @throws {Error} - Independent inputs are missing, changed or incompatible.
	 */
	_readIndependentFields() {
		let root = 'tmp/production-local-sun-cache-promotion/runs/00034-p2-independent-fields';
		if (
			this._paths.hash(
				'tmp/production-local-sun-cache-promotion/runs/00023-physical-recurrence-controls/controls.json',
			) !== '47f8caa14878f1329811b612cffb6ec911715d5a8fe3769e81f4a77c2de1216b' ||
			this._paths.hash(
				'tmp/production-local-sun-cache-promotion/runs/00023-physical-recurrence-controls/manifest.json',
			) !== 'e80306d151411c478c6a5486acccf9e6b9b7e135f66baa49393e19b42bf98f7c' ||
			this._paths.hash(root + '/manifest.json') !==
				'362cfb7a5cb5488302b1b97eef42b47d1d718de9fb97740de2fa1a4769c2ab26'
		)
			throw new Error('Frozen parent identities changed');
		let manifest = /** @type {LocalSunGpuIndependentFields} */ (
			JSON.parse(readFileSync(this._paths.checkedPath(root + '/manifest.json'), 'utf8'))
		);
		if (
			manifest.schema !== 'local-sun-independent-full-fields-v1' ||
			manifest.state !== 'passed' ||
			manifest.fields.length !== 8
		)
			throw new Error('Authenticated independent full fields required.');
		let frozen = /** @type {LocalSunPhysicalControls} */ (
			JSON.parse(
				readFileSync(
					this._paths.checkedPath(
						'tmp/production-local-sun-cache-promotion/runs/00023-physical-recurrence-controls/controls.json',
					),
					'utf8',
				),
			)
		);
		for (let field of manifest.fields) {
			let control = frozen.controls.find((control) => control.id === field.id);
			if (
				!control ||
				field.sha256 !== control.observation.sha256 ||
				this._paths.hash(root + '/' + field.path) !== field.sha256 ||
				field.bytes !== control.width * control.height * 15 * 4
			)
				throw new Error('Independent field identity differs: ' + field.id);
		}
		return manifest;
	}

	/** Call this method to execute one explicitly selected GPU proof and seal its new evidence.
	 * Preflight rejection creates no run. After allocation, failures preserve the run
	 * and close owned browser, server and file handles. Jobs reject for unsupported inputs,
	 * changed parents, low free memory, excessive sampled process memory or the deadline.
	 *
	 * @param {LocalSunGpuQualificationRequest} request - Exact order, new serial and bounded proof mode.
	 * @returns {Promise<string>} - Repository-relative immutable result directory.
	 */
	async run(request) {
		let started = performance.now();
		const trajectoryMode = request.mode === 'trajectory';
		const frameProof = request.mode === 'reuse' || trajectoryMode;
		const schema = trajectoryMode
			? 'local-sun-p5-trajectory-proof-v1'
			: frameProof
				? 'local-sun-p3-frame-proof-v1'
				: 'local-sun-p2-gpu-proof-v1';
		if (
			![1, 2, 4].includes(request.order) ||
			!/^\d{5}$/.test(request.serial) ||
			!['fields', 'runtime', 'omission', 'cleanup', 'zero', 'reuse', 'trajectory'].includes(request.mode) ||
			!['float16', 'float32'].includes(request.sceneColorPrecision ?? 'float32') ||
			(request.sceneColorPrecision !== undefined && !frameProof) ||
			(trajectoryMode &&
				(request.order !== 1 ||
					!['flat-0', 'flat-45', 'flat-90', 'flat-135', 'flat-180'].includes(request.trajectory))) ||
			(!trajectoryMode && request.trajectory !== undefined)
		)
			throw new RangeError('Supported order, five-digit new serial and declared GPU proof mode required.');
		let destination =
			'tmp/production-local-sun-cache-promotion/runs/' +
			request.serial +
			(trajectoryMode ? '-p5-trajectory-' + request.trajectory : (frameProof ? '-p3-' : '-p2-') + request.mode);
		let root = this._paths.checkedPath(destination);
		if (existsSync(root)) throw new Error('New immutable qualification run required.');
		let freeBefore = os.freemem();
		if (freeBefore < FREE_MEMORY_RESERVE_BYTES) throw new Error('Four GiB free-memory reserve required.');
		let independent = this._readIndependentFields();
		let p0Path = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json';
		if (this._paths.hash(p0Path) !== '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6')
			throw new Error('Frozen P0 inputs changed.');
		let parentPaths = [
			p0Path,
			'tmp/production-local-sun-cache-promotion/runs/00023-physical-recurrence-controls/manifest.json',
			'tmp/production-local-sun-cache-promotion/runs/00023-physical-recurrence-controls/controls.json',
			'tmp/production-local-sun-cache-promotion/runs/00034-p2-independent-fields/manifest.json',
			'experiments/local-sun-cache-reuse/shell-runtime-calculator.js',
			'experiments/local-sun-cache-reuse/shell-runtime-math.js',
			'experiments/local-sun-cache-reuse/shell-omission.js',
		];
		let parents = parentPaths.map((path) => ({path, sha256: this._paths.hash(path)}));
		/** @type {LocalSunFrameGpuMovementState[]} */ let movement = [];
		let qualifiedFieldHash;
		if (frameProof) {
			const movementPath = 'tmp/experiments/local-sun-cache-reuse/runs/00535-p3-shell-move/inputs.json';
			const fieldPath = 'tmp/production-local-sun-cache-promotion/runs/00035-p2-gpu-pilot/result.json';
			if (
				this._paths.hash(movementPath) !== '5f31e5758c743153b6dd25938031a2e5b3db003b486b460b2175e50ef0336cec' ||
				this._paths.hash(fieldPath) !== '72c86d5aabfbbbae2a1fc451802a35669a502cc2f6bcfae5956e5949b6736163'
			)
				throw new Error('Frozen movement or independently qualified P2 field identity changed');
			const input = JSON.parse(readFileSync(this._paths.checkedPath(movementPath), 'utf8'));
			movement = input.parameters.currentOrbitalStates.map((state) => ({
				observation: state.observation,
				sourcePosition: state.geometry.sourcePosition,
				receiverPosition: state.geometry.observerPosition,
			}));
			const fields = JSON.parse(readFileSync(this._paths.checkedPath(fieldPath), 'utf8'));
			qualifiedFieldHash = fields.observations.find(
				(field) => field.id === (request.order === 1 ? 'compact-j1' : 'compact-j-through-' + request.order),
			)?.sha256;
			if (movement.length !== 5 || !qualifiedFieldHash)
				throw new Error('Required independent case or field control missing');
			parents.push(
				{path: movementPath, sha256: this._paths.hash(movementPath)},
				{path: fieldPath, sha256: this._paths.hash(fieldPath)},
			);
		}
		/** @type {readonly LocalSunFrameGpuPose[]|undefined} */ let trajectoryPoses;
		if (trajectoryMode) {
			const statesPath = 'tmp/experiments/local-sun-cache-reuse/runs/00265-p5-time-inputs/states.json';
			const manifestPath = 'tmp/experiments/local-sun-cache-reuse/runs/00265-p5-time-inputs/manifest.json';
			const statesHash = '58afc1e8b4bcf50e6897292f4649bc2d96807d791746bf9828f994ffa8a6c5cb';
			if (this._paths.hash(statesPath) !== statesHash)
				throw new Error('Authenticated P5 trajectory inputs changed.');
			const manifest = JSON.parse(readFileSync(this._paths.checkedPath(manifestPath), 'utf8'));
			if (
				manifest.state !== 'accepted' ||
				manifest.artifacts.find((artifact) => artifact.path === 'states.json')?.sha256 !== statesHash
			)
				throw new Error('Accepted P5 manifest does not authenticate the trajectory.');
			const input = /** @type {LocalSunGpuTrajectoryInputs} */ (
				JSON.parse(readFileSync(this._paths.checkedPath(statesPath), 'utf8'))
			);
			const trajectory = input.trajectories.find((candidate) => candidate.id === request.trajectory);
			if (
				input.schema !== 'shell-temporal-states-v1' ||
				trajectory?.states.length !== 120 ||
				trajectory.states.some((state, index) => state.slot !== index)
			)
				throw new Error('All 120 original ordered P5 slots are required.');
			trajectoryPoses = trajectory.states.map(({slot, state}) => ({
				label: request.trajectory + '-slot-' + slot,
				observation: state.observation,
				receiverPosition: state.geometry.observerPosition,
				expectedSourcePosition: state.geometry.sourcePosition,
			}));
			for (const path of [
				statesPath,
				manifestPath,
				'scripts/algorithm32/local-sun-cache/gpu/LocalSunGpuQualification.js',
				'scripts/algorithm32/local-sun-cache/normalization/LocalSunNormalizationControls.js',
				'package-lock.json',
			])
				parents.push({path, sha256: this._paths.hash(path)});
		}
		mkdirSync(root, {recursive: true});
		let browser, server, interval, deadline;
		/** @type {Map<string, LocalSunGpuFieldWriter>} */
		let writers = new Map();
		/** @type {LocalSunGpuHostSample[]} */
		let samples = [];
		/** @type {string[]} */
		let diagnostics = [];
		/** @type {Map<LocalSunFrameGpuHashLabel,LocalSunFrameGpuDigestState>} */ const frameDigests = new Map();
		let failure;
		try {
			const environment = {
				name: 'qualification-production-environment',
				/** Called by offline bundling to resolve the exact installed application environment constant.
				 *
				 * @param {string} code - Installed module source.
				 * @param {string} id - Exact source identity.
				 * @returns {LocalSunGpuEnvironmentTransformResult} - Bounded AST substitution, or no applicable change.
				 */
				transform(code, id) {
					if (!code.includes('process.env.NODE_ENV')) return null;
					const result = transformSync(code, {
						filename: id,
						babelrc: false,
						configFile: false,
						presets: ['@babel/preset-react'],
						plugins: [
							/** Called by Babel setup to provide the bounded JavaScript environment visitor. */ ({
								types,
							}) => ({
								visitor: {
									/** Called by Babel to substitute only the exact NODE_ENV member expression.
									 *
									 * @param {LocalSunGpuEnvironmentMemberPath} path - Babel-owned JavaScript member path.
									 */
									MemberExpression(path) {
										if (path.matchesPattern('process.env.NODE_ENV'))
											path.replaceWith(types.stringLiteral('production'));
									},
								},
							}),
						],
					});
					return {code: result.code, map: null};
				},
			};
			let bundle = await rollup({
				input: this._paths.checkedPath('scripts/algorithm32/local-sun-cache/gpu/LocalSunGpuBrowserProof.js'),
				plugins: [
					environment,
					nodeResolve({browser: true}),
					/** @type {LocalSunGpuCommonJsFactory} */ (
						/**
						 *
						 * @type {unknown}
						 */ (commonjs)
					)(),
					babel({
						babelHelpers: 'bundled',
						babelrc: false,
						configFile: false,
						presets: ['@babel/preset-react'],
						extensions: ['.js', '.jsx'],
						exclude: 'node_modules/**',
					}),
				],
				/** Called by bundling to reject unexpected dependency warnings.
				 *
				 * @param {LocalSunGpuRollupWarning} warning - Bundler diagnostic; known internal cycles remain allowed.
				 */
				onwarn: (warning) => {
					if (warning.code !== 'CIRCULAR_DEPENDENCY') throw new Error(warning.message);
				},
			});
			let generated;
			try {
				generated = await bundle.generate({
					format: 'iife',
					name: 'LocalSunGpuProof',
					inlineDynamicImports: true,
				});
			} finally {
				await bundle.close();
			}
			let source = generated.output[0].code;
			for (let path of bundle.watchFiles) {
				let relative = path.replaceAll('\\', '/').split('/flattened-steel/')[1];
				if (
					relative &&
					(relative.startsWith('src/') ||
						relative.startsWith('scripts/') ||
						relative.startsWith('experiments/'))
				)
					parents.push({path: relative, sha256: this._paths.hash(relative)});
			}
			writeFileSync(root + '/host.js', readFileSync(fileURLToPath(import.meta.url)), {flag: 'wx'});
			writeFileSync(root + '/bundle.js', source, {flag: 'wx'});
			server = createServer(async (incoming, response) => {
				try {
					const digestUpload = /^\/frame-digest\/(retained|fresh)\/(\d+)$/.exec(incoming.url);
					const digestRead = /^\/frame-digest\/(retained|fresh)$/.exec(incoming.url);
					if (frameProof && incoming.method === 'POST' && digestUpload) {
						const id = /** @type {LocalSunFrameGpuHashLabel} */ (digestUpload[1]),
							offset = Number(digestUpload[2]);
						let record = frameDigests.get(id);
						if (!record) {
							if (offset !== 0) throw new Error('First field digest offset must be zero');
							record = {hash: createHash('sha256'), received: 0, sha256: null};
							frameDigests.set(id, record);
						}
						if (record.sha256 || offset !== record.received)
							throw new Error('Duplicate or out-of-order whole-field digest transfer');
						let bytes = 0;
						for await (const chunk of incoming) {
							bytes += chunk.length;
							if (bytes > 2 * 1024 * 1024 || record.received + chunk.length > 275299560)
								throw new Error('Bounded whole-field digest transfer exceeded its declared size');
							record.hash.update(chunk);
							record.received += chunk.length;
						}
						response.end('ok');
						return;
					}
					if (frameProof && incoming.method === 'GET' && digestRead) {
						const record = frameDigests.get(/** @type {LocalSunFrameGpuHashLabel} */ (digestRead[1]));
						if (!record || record.received !== 275299560)
							throw new Error('Complete whole-field digest required');
						record.sha256 ??= record.hash.digest('hex');
						response.setHeader('Content-Type', 'application/json');
						response.end(JSON.stringify({bytes: record.received, sha256: record.sha256}));
						return;
					}
					let gold = /^\/gold\/(local-sun-[jl][1-4]|cumulative)$/.exec(incoming.url);
					if (incoming.method === 'GET' && gold) {
						let field = independent.fields.find((field) => field.id === gold[1]);
						if (!field) throw new Error('Unknown independent field.');
						response.setHeader('Content-Type', 'application/octet-stream');
						response.setHeader('Content-Length', field.bytes);
						let stream = createReadStream(
							this._paths.checkedPath(
								'tmp/production-local-sun-cache-promotion/runs/00034-p2-independent-fields/' +
									field.path,
							),
						);
						stream.on('error', (error) => response.destroy(error));
						stream.pipe(response);
						return;
					}
					let output = /^\/field\/(compact-(?:j[1-4]|l[1-3]|j-through-[124]))\/(\d+)$/.exec(incoming.url);
					if (incoming.method === 'POST' && output && request.mode === 'fields') {
						let fieldId = output[1],
							offset = Number(output[2]);
						let record = writers.get(fieldId);
						if (!record) {
							if (offset !== 0) throw new Error('First field offset must be zero.');
							record = {
								fd: openSync(this._paths.checkedPath(destination + '/' + fieldId + '.f32'), 'wx'),
								received: 0,
							};
							writers.set(fieldId, record);
						}
						if (offset !== record.received) throw new Error('Candidate field offset mismatch.');
						let count = 0;
						for await (let chunk of incoming) {
							count += chunk.length;
							if (
								count > 4194304 ||
								record.received + chunk.length > 1049 * (fieldId.includes('-l') ? 1920 : 4374) * 15 * 4
							)
								throw new Error('Oversized field transfer.');
							writeSync(record.fd, chunk);
							record.received += chunk.length;
						}
						response.end('ok');
						return;
					}
					if (incoming.method === 'GET' && incoming.url === '/bundle.js') {
						response.setHeader('Content-Type', 'text/javascript');
						response.end(source);
						return;
					}
					if (incoming.method === 'GET' && incoming.url === '/') {
						response.end('<script src="/bundle.js"></script>');
						return;
					}
					response.statusCode = 404;
					response.end();
				} catch (error) {
					response.statusCode = 500;
					response.end(String(error));
				}
			});
			await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
			let profilePath = this._paths.checkedPath('.codex-tmp/local-sun-gpu-qualification/' + request.serial);
			browser = await puppeteer.launch({
				executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
				headless: 'new',
				userDataDir: profilePath,
				args: [
					'--enable-gpu',
					'--use-angle=d3d11',
					'--ignore-gpu-blocklist',
					'--disable-background-timer-throttling',
				],
				protocolTimeout: 600000,
			});
			let page = await browser.newPage();
			samples.push({
				elapsedMilliseconds: performance.now() - started,
				freeBytes: os.freemem(),
				ownedProcessBytes: this._processBytes(browser.process().pid),
			});
			if (
				samples[0].freeBytes < FREE_MEMORY_RESERVE_BYTES ||
				samples[0].ownedProcessBytes > OWNED_PROCESS_CEILING_BYTES
			)
				throw new Error('Qualification memory admission failed.');
			page.on('console', (message) => {
				diagnostics.push(message.text());
				if (!message.text().includes('Program Info Log')) console.log(message.text());
			});
			page.on('pageerror', (error) => diagnostics.push(String(error)));
			interval = setInterval(() => {
				try {
					let sample = {
						elapsedMilliseconds: performance.now() - started,
						freeBytes: os.freemem(),
						ownedProcessBytes: this._processBytes(browser.process().pid),
					};
					samples.push(sample);
					console.log(
						(trajectoryMode ? 'P5 ' : frameProof ? 'P3 ' : 'P2 ') +
							request.mode +
							' progress ' +
							Math.round(sample.elapsedMilliseconds / 1000) +
							's; free GiB=' +
							(sample.freeBytes / 1024 ** 3).toFixed(2),
					);
					if (
						sample.freeBytes < FREE_MEMORY_RESERVE_BYTES ||
						sample.ownedProcessBytes > OWNED_PROCESS_CEILING_BYTES
					) {
						failure = new Error('Qualification memory admission failed.');
						browser.close();
					}
				} catch (error) {
					failure = error;
					browser.close();
				}
			}, 20000);
			let address = server.address();
			if (address === null || typeof address === 'string')
				throw new Error('Owned loopback listener address required.');
			await page.goto('http://127.0.0.1:' + address.port);
			let input = /** @type {LocalSunGpuBrowserProofRequest} */ ({
				p0: JSON.parse(readFileSync(this._paths.checkedPath(p0Path), 'utf8')),
				controls: JSON.parse(readFileSync(this._paths.checkedPath(parentPaths[2]), 'utf8')),
				order: request.order,
				full: request.mode === 'fields',
				runtime: request.mode === 'runtime' || request.mode === 'zero',
				omission: request.mode === 'omission',
				cleanup: request.mode === 'cleanup',
				reuse: frameProof,
				trajectoryPoses,
				movement,
				qualifiedFieldHash,
				sceneColorPrecision: request.sceneColorPrecision ?? 'float32',
				sourceScale: request.mode === 'zero' ? 0 : 1,
			});
			let result = await Promise.race([
				page.evaluate(
					(input) =>
						/** @type {LocalSunGpuProofBrowserScope} */ (
							/**
							 *
							 * @type {unknown}
							 */ (globalThis)
						).runCompactGpu(input),
					input,
				),
				new Promise((_, reject) => {
					deadline = setTimeout(
						() => {
							failure = new Error('Ten-minute qualification deadline.');
							reject(failure);
						},
						Math.max(1, 600000 - (performance.now() - started)),
					);
				}),
			]);
			if (failure) throw failure;
			if (
				result.state !== 'passed' ||
				result.order !== request.order ||
				result.glError !== 0 ||
				(frameProof &&
					(result.reuse?.state !== 'passed' || result.reuse.frames.length !== (trajectoryMode ? 120 : 16))) ||
				result.observations.some(
					(field) => field.nonfinite || field.comparison.failures || field.comparison.whole?.failures,
				)
			)
				throw new Error('Owned browser result failed its declared gates.');
			for (let record of writers.values()) {
				closeSync(record.fd);
				record.fd = null;
			}
			result.fields = [...writers].map(([id, record]) => ({
				id,
				path: id + '.f32',
				bytes: record.received,
				sha256: this._paths.hash(destination + '/' + id + '.f32'),
			}));
			for (let field of result.fields)
				if (field.bytes !== 1049 * (field.id.includes('-l') ? 1920 : 4374) * 15 * 4)
					throw new Error('Short complete candidate field.');
			writeFileSync(
				root + '/result.json',
				JSON.stringify(
					{
						...result,
						host: {
							elapsedMilliseconds: performance.now() - started,
							freeBeforeBytes: freeBefore,
							freeMemoryReserveBytes: FREE_MEMORY_RESERVE_BYTES,
							ownedProcessCeilingBytes: OWNED_PROCESS_CEILING_BYTES,
							rssAfterBytes: process.memoryUsage().rss,
							samples,
							limitation:
								'Working-set samples are observations, include shared-page double counting and do not establish a continuous peak. Logical GPU payload is separate from driver memory.',
						},
					},
					null,
					2,
				),
				{flag: 'wx'},
			);
			writeFileSync(root + '/diagnostics.json', JSON.stringify(diagnostics), {flag: 'wx'});
			writeFileSync(
				root + '/manifest.json',
				JSON.stringify(
					{
						schema,
						state: 'passed',
						selection: request,
						parents,
						operation: trajectoryMode
							? 'All 120 authenticated original trajectory slots, two independent canonical N1 fields, exact live shader/receiver staging and unchanged CPU/paired/endpoint/adaptation/composed-pixel gates. This is not full-scene image or visible-celestial parity.'
							: frameProof
								? 'Separate canonical production field constructions verified in full against qualified P2 identity. Sixteen independently staged exact live rotation/translation/day frames use unchanged physical owners, ordinary shaders and receiver measurements. Matched J/L/T/endpoint/receiver/composed-output fresh-reused comparisons use predeclared 0.0001 and original floors; physical CPU-field controls retain 0.002. Complete construction sharing is recorded explicitly.'
								: 'Production owner contributors and ordinary controller/cache; frozen full physical fields and selected CPU controls; original J/L/T/endpoint gates, exact omission identities and candidate-only resource cleanup. Zero mode is the analytic zero-intensity consequence with unchanged medium transmission.',
						tools: {node: process.version, browser: await browser.version(), rollup: rollupVersion},
						artifacts: ['host.js', 'bundle.js', 'result.json', 'diagnostics.json'].map((path) => ({
							path,
							sha256: this._paths.hash(destination + '/' + path),
						})),
						fields: result.fields,
					},
					null,
					2,
				),
				{flag: 'wx'},
			);
			console.log('PASSED ' + destination);
			return destination;
		} catch (error) {
			if (!existsSync(root + '/diagnostics.json'))
				writeFileSync(root + '/diagnostics.json', JSON.stringify(diagnostics), {flag: 'wx'});
			writeFileSync(
				root + '/manifest.json',
				JSON.stringify(
					{
						schema,
						state: 'failed',
						selection: request,
						parents,
						error: String(failure ?? error),
						freeMemoryReserveBytes: FREE_MEMORY_RESERVE_BYTES,
						ownedProcessCeilingBytes: OWNED_PROCESS_CEILING_BYTES,
						samples,
						artifacts: [
							{path: 'diagnostics.json', sha256: this._paths.hash(destination + '/diagnostics.json')},
						],
						elapsedMilliseconds: performance.now() - started,
					},
					null,
					2,
				),
				{flag: 'wx'},
			);
			throw error;
		} finally {
			for (let record of writers.values()) if (record.fd !== null) closeSync(record.fd);
			clearInterval(interval);
			clearTimeout(deadline);
			await browser?.close();
			server?.closeAllConnections();
			await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
		}
	}
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	await new LocalSunGpuQualification().run({
		order: /** @type {SupportedCacheScatteringOrder} */ (Number(process.argv[2])),
		serial: process.argv[3],
		mode: /** @type {LocalSunGpuQualificationMode} */ (process.argv[4] ?? 'fields'),
		...(process.argv[6] === undefined
			? {}
			: {trajectory: /** @type {LocalSunGpuTrajectoryId} */ (process.argv[6])}),
		...(process.argv[5] === undefined
			? {}
			: {sceneColorPrecision: /** @type {Flat32SceneColorPrecision} */ (process.argv[5])}),
	});
}
