import assert from 'node:assert/strict';
import {constants, copyFile, lstat, mkdir, readFile, realpath, rename, rm, stat, writeFile} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {GlobeCacheInputs} from './GlobeCacheInputs.js';

/**
 * Repository-owned deployment preparation, GPU preflight, cache generation and Flat activation.
 */
class GlobeCacheDeployment {
	/**
	 * Creates paths from this tool's owning repository, independently of the invoking host directory.
	 */
	constructor() {
		this.root = fileURLToPath(new URL('../../../', import.meta.url));
		this.folder = fileURLToPath(new URL('./', import.meta.url));
		this.scratch = '.codex-tmp/flat-cache-deployment';
	}

	/**
	 * Called by deployment ingress to reject aliases and paths outside this repository.
	 *
	 * @param {string} relative - Repository-relative destination or source.
	 * @param {boolean} [create] - Whether to create an ordinary directory.
	 * @returns {Promise<string>} - Contained absolute path.
	 */
	async _path(relative, create = false) {
		if (!/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(relative) || relative.split('/').includes('..')) {
			throw new Error('Use an ordinary repository-relative path.');
		}
		let current = this.root;
		for (let part of relative.split('/')) {
			current = path.join(current, part);
			if (create) {
				await mkdir(current, {recursive: false}).catch((error) => {
					if (error.code !== 'EEXIST') {
						throw error;
					}
				});
			}
			let facts = await lstat(current);
			if (facts.isSymbolicLink() || (await realpath(current)).toLowerCase() !== current.toLowerCase()) {
				throw new Error('Deployment paths must not contain symlinks or junctions.');
			}
		}
		return current;
	}

	/**
	 * Called by file admission to identify bytes once at the deployment boundary.
	 *
	 * @param {Uint8Array} bytes - Complete artifact bytes.
	 * @returns {string} - SHA-256 digest.
	 */
	_hash(bytes) {
		return createHash('sha256').update(bytes).digest('hex');
	}

	/**
	 * Called by operational commands to load the existing compiler without activating any app.
	 *
	 * @param {string} relative - Repository-owned module path.
	 * @returns {Promise<any>} - Existing module exports.
	 */
	_module(relative) {
		return import(pathToFileURL(path.join(this.root, relative)).href);
	}

	/**
	 * Called by Chrome preflight and generation to resolve the operator's installed browser.
	 *
	 * @returns {Promise<string>} - Existing absolute Chrome/Chromium executable.
	 */
	async _chrome() {
		let candidates = process.env.CHROME_PATH
			? [process.env.CHROME_PATH]
			: ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
		for (let candidate of candidates) {
			if (
				path.isAbsolute(candidate) &&
				(await stat(candidate).then(
					(value) => value.isFile(),
					() => false,
				))
			) {
				return candidate;
			}
		}
		throw new Error('Set CHROME_PATH to an installed Chrome/Chromium executable.');
	}

	/**
	 * Call this method to restore the compact tracked seed without overwriting existing control bytes.
	 *
	 * @returns {Promise<void>} - Complete compiler control metadata is available.
	 */
	async prepare() {
		let manifest = JSON.parse(await readFile(path.join(this.folder, 'cache-control-seed.manifest.json'), 'utf8'));
		let archive = await readFile(path.join(this.folder, manifest.archive));
		assert.equal(archive.length, manifest.archiveByteLength);
		assert.equal(this._hash(archive), manifest.archiveSha256);
		let decoded = gunzipSync(archive, {maxOutputLength: manifest.decodedByteLength});
		assert.equal(decoded.length, manifest.decodedByteLength);
		let files = JSON.parse(decoded.toString('utf8'));
		assert.equal(files.length, manifest.fileCount);
		for (let [index, item] of files.entries()) {
			let expected = manifest.files[index];
			assert.equal(item.path, expected.path);
			let bytes = Buffer.from(item.base64, 'base64');
			assert.equal(bytes.length, expected.byteLength);
			assert.equal(this._hash(bytes), expected.sha256);
			let relative = manifest.targetRoot + '/' + item.path;
			await this._path(path.posix.dirname(relative), true);
			let target = path.join(this.root, relative);
			try {
				await writeFile(target, bytes, {flag: 'wx'});
			} catch (error) {
				if (error.code !== 'EEXIST') {
					throw error;
				}
			}
			assert.equal(this._hash(await readFile(await this._path(relative))), expected.sha256);
		}
		console.log(JSON.stringify({phase: 'controls-ready', files: manifest.fileCount, root: manifest.targetRoot}));
	}

	/**
	 * Call this method to prove WebGL2 floating-point rendering and identify software fallback before a full build.
	 *
	 * @returns {Promise<any>} - Recorded renderer, limits and float readback.
	 */
	async probe() {
		let chrome = await this._chrome();
		let backend = process.env.FLAT_CACHE_BROWSER_BACKEND ?? (process.platform === 'win32' ? 'd3d11' : 'gl');
		let {default: Host} = await this._module(
			'scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheCompilerHost.js',
		);
		let {default: puppeteer} = await this._module('node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js');
		let relative = this.scratch + '/probe-' + randomUUID();
		let directory = await this._path(relative, true);
		let profile = await this._path(relative + '/profile', true);
		let browser;
		try {
			let args = new Host()
				._browserArguments(profile, 'about:blank', backend)
				.slice(0, -1)
				.filter((value) => !value.startsWith('--user-data-dir='));
			browser = await puppeteer.launch({executablePath: chrome, headless: 'new', userDataDir: profile, args});
			let page = await browser.newPage();
			let report = await page.evaluate(() => {
				let canvas = document.createElement('canvas');
				let gl = canvas.getContext('webgl2');
				if (!gl || !gl.getExtension('EXT_color_buffer_float')) {
					throw new Error('WebGL2 with EXT_color_buffer_float is required.');
				}
				let debug = gl.getExtension('WEBGL_debug_renderer_info');
				let texture = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 1, 1);
				let framebuffer = gl.createFramebuffer();
				gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
				if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
					throw new Error('Float framebuffer is incomplete.');
				}
				gl.clearColor(0.25, 0.5, 0.75, 1);
				gl.clear(gl.COLOR_BUFFER_BIT);
				let pixels = new Float32Array(4);
				gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixels);
				let result = {
					renderer: String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER)),
					version: gl.getParameter(gl.VERSION),
					maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
					maxArrayLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS),
					pixels: Array.from(pixels),
					error: gl.getError(),
				};
				gl.deleteFramebuffer(framebuffer);
				gl.deleteTexture(texture);
				gl.getExtension('WEBGL_lose_context')?.loseContext();
				return result;
			});
			assert.deepEqual(report.pixels, [0.25, 0.5, 0.75, 1]);
			assert.equal(report.error, 0);
			let software = /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(report.renderer);
			await writeFile(
				path.join(directory, 'report.json'),
				JSON.stringify({chrome, backend, software, ...report}, null, 2),
			);
			console.log(JSON.stringify({phase: 'graphics-probe', chrome, backend, software, ...report}));
			if (software && backend !== 'swiftshader') {
				throw new Error(
					'Chrome selected software rendering. Configure GPU access/backend before the full build.',
				);
			}
			return report;
		} finally {
			try {
				await browser?.close();
			} finally {
				await rm(await this._path(relative + '/profile'), {
					recursive: true,
					force: true,
					maxRetries: 5,
					retryDelay: 100,
				});
			}
		}
	}

	/**
	 * Called by deployment checks to read a portable input receipt without requiring a browser.
	 *
	 * @param {boolean} installed - Whether to read the installed package's receipt.
	 * @returns {Promise<GlobeCacheBuildReceipt | null>} - Receipt, or null when none is recorded.
	 */
	async _receipt(installed) {
		let relative = this.scratch + (installed ? '/installed-build.json' : '/last-build.json');
		try {
			return JSON.parse(await readFile(await this._path(relative), 'utf8'));
		} catch (error) {
			if (error.code === 'ENOENT') {
				return null;
			}
			throw error;
		}
	}

	/**
	 * Called after successful generation or installation to publish a complete input receipt atomically.
	 *
	 * @param {string} name - Internal receipt filename below the deployment state directory.
	 * @param {GlobeCacheBuildReceipt} receipt - Accepted build result and optional input identities.
	 * @returns {Promise<void>} - Receipt replacement completed.
	 */
	async _saveReceipt(name, receipt) {
		let folder = await this._path(this.scratch, true);
		let temporary = path.join(folder, name + '.' + randomUUID() + '.tmp');
		await writeFile(temporary, JSON.stringify(receipt, null, 2), {flag: 'wx'});
		await rename(temporary, path.join(folder, name));
	}

	/**
	 * Called by build and deployment checks to compare inputs and inexpensive package metadata.
	 *
	 * @param {GlobeCacheInputRecord} inputs - Current checkout's desired inputs.
	 * @param {boolean} installed - Whether to check installed output instead of the local sealed build.
	 * @returns {Promise<GlobeCacheReuseStatus>} - Reuse decision without reading payload contents.
	 */
	async _reuse(inputs, installed) {
		let status = /** @type {GlobeCacheReuseStatus} */ ({
			fingerprint: inputs.fingerprint,
			installed,
			state: 'unrecorded',
			reusable: false,
			inputsMatch: null,
			reason: 'No recorded build-input fingerprint is available.',
		});
		let receipt;
		try {
			receipt = await this._receipt(installed);
		} catch (error) {
			return {...status, reason: 'Build-input receipt is unreadable: ' + error.message};
		}
		if (!receipt?.inputFingerprint) {
			return status;
		}
		status.packageSetIdentity = receipt.packageSetIdentity;
		status.publishedRoot = receipt.publishedRoot;
		status.inputsMatch = receipt.inputFingerprint === inputs.fingerprint;
		if (!status.inputsMatch) {
			return {...status, state: 'changed', reason: 'Cache source, settings or control metadata changed.'};
		}
		try {
			assert.match(receipt.packageSetIdentity, /^[a-f0-9]{64}$/);
			let relative = installed
				? 'server/flat/data/distant-sun-shared/' + receipt.packageSetIdentity
				: receipt.publishedRoot;
			let root =
				installed && process.env.FLAT_DISTANT_SUN_CACHE_ROOT
					? process.env.FLAT_DISTANT_SUN_CACHE_ROOT
					: await this._path(relative);
			let reportBytes = await readFile(path.join(root, 'package-set.json'));
			assert.equal(this._hash(reportBytes), receipt.packageSetSha256);
			if (!installed) {
				let run = path.posix.dirname(path.posix.dirname(relative));
				let acceptance = await readFile(await this._path(run + '/acceptance.json'));
				let seal = JSON.parse(await readFile(await this._path(run + '/sealed.json'), 'utf8'));
				assert.equal(seal.acceptanceSha256, this._hash(acceptance));
				assert.equal(seal.packageSetIdentity, receipt.packageSetIdentity);
				let accepted = JSON.parse(acceptance.toString('utf8'));
				assert.equal(accepted.accepted, true);
				assert.equal(accepted.packageSetSha256, receipt.packageSetSha256);
				assert.equal(accepted.publishedRoot, receipt.publishedRoot);
			}
			let {default: Package} = await this._module('server/common/DistantSunSharedCachePackageService.js');
			let admitted = await new Package(root, 'monotone-cubic', undefined, 'corrected60-sun035').load({
				path: 'package-set.json',
				byteLength: reportBytes.length,
				sha256: receipt.packageSetSha256,
			});
			for (let artifact of admitted.getFiles()) {
				let facts = await lstat(path.join(root, artifact.path));
				assert.ok(facts.isFile() && !facts.isSymbolicLink());
				assert.equal(facts.size, artifact.byteLength);
			}
			if (installed) {
				let selection = await this._module('server/common/distant-sun-package.js');
				status.activationRequired = selection.DISTANT_SUN_PACKAGE_IDENTITY !== receipt.packageSetIdentity;
			}
			return {
				...status,
				state: 'unchanged',
				reusable: true,
				reason: 'Cache inputs are unchanged and the package is available.',
			};
		} catch (error) {
			return {
				...status,
				state: 'missing',
				reason: 'Recorded cache is unavailable or incomplete: ' + error.message,
			};
		}
	}

	/**
	 * Call this method to report whether local or installed cache output matches current inputs.
	 *
	 * @param {boolean} [installed] - Check the installed package when true.
	 * @returns {Promise<void>} - JSON status printed without starting Chrome or rebuilding anything.
	 */
	async check(installed = false) {
		let inputs = await new GlobeCacheInputs(this.root).calculate();
		console.log(JSON.stringify(await this._reuse(inputs, installed)));
	}

	/**
	 * Call this method to reuse matching output or build the current Globe package into a new compiler run.
	 *
	 * @param {boolean} [force] - Explicitly rebuild even when recorded output matches.
	 * @returns {Promise<void>} - Verified sealed output, with its run recorded for activation.
	 */
	async build(force = false) {
		let inputs = await new GlobeCacheInputs(this.root).calculate();
		if (!force) {
			let reuse = await this._reuse(inputs, false);
			if (reuse.reusable) {
				console.log(JSON.stringify({phase: 'cache-reused', ...reuse}));
				return;
			}
		}
		assert.equal(inputs.settings.numericalPolicy, 'anchored-radial');
		await this.prepare();
		await this.probe();
		process.env.FLAT_CACHE_BROWSER_BACKEND ??= process.platform === 'win32' ? 'd3d11' : 'gl';
		let chromePath = await this._chrome();
		let {default: Generator} = await this._module(
			'scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerator.js',
		);
		let {DistantSunSceneCacheNumerics: Numerics} = await this._module(
			'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js',
		);
		let {CanonicalAtmosphere} = await this._module(
			'src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js',
		);
		let cancellation = new AbortController();
		let interrupt = () => cancellation.abort(new Error('Deployment cache generation interrupted.'));
		process.once('SIGINT', interrupt);
		process.once('SIGTERM', interrupt);
		try {
			let result = await new Generator({chromePath}).run({
				chromePath,
				numericalPolicy: Numerics.createAnchoredRadial(),
				solarInterpolation: inputs.settings.solarInterpolation,
				scatteringAccuracy: inputs.settings.scatteringAccuracy,
				aerosolConstants: new CanonicalAtmosphere().constants,
				maximumObserverAltitudeMeters: inputs.settings.maximumObserverAltitudeMeters,
				signal: cancellation.signal,
			});
			let after = await new GlobeCacheInputs(this.root).calculate();
			assert.equal(
				after.fingerprint,
				inputs.fingerprint,
				'Cache inputs changed during generation; sealed output is preserved, but cannot be marked current.',
			);
			let receipt = {...result, inputFingerprint: inputs.fingerprint, cacheInputs: inputs};
			await this._saveReceipt('last-build.json', receipt);
			console.log(JSON.stringify({phase: 'cache-built', ...receipt}));
		} finally {
			process.removeListener('SIGINT', interrupt);
			process.removeListener('SIGTERM', interrupt);
		}
	}

	/**
	 * Call this method to authenticate and install a completed package, then update Flat's server selection.
	 *
	 * @param {string} [run] - Sealed compiler run, or the most recent successful deployment build.
	 * @returns {Promise<void>} - New package and selection prepared for a host restart.
	 */
	async activate(run) {
		let result = JSON.parse(
			await readFile(
				run ? await this._path(run + '/acceptance.json') : await this._path(this.scratch + '/last-build.json'),
				'utf8',
			),
		);
		assert.equal(result.accepted, true);
		assert.match(result.packageSetIdentity, /^[a-f0-9]{64}$/);
		let runRoot = path.posix.dirname(path.posix.dirname(result.publishedRoot));
		let acceptance = await readFile(await this._path(runRoot + '/acceptance.json'));
		let seal = JSON.parse(await readFile(await this._path(runRoot + '/sealed.json'), 'utf8'));
		assert.equal(this._hash(acceptance), seal.acceptanceSha256);
		assert.equal(seal.packageSetIdentity, result.packageSetIdentity);
		let source = await this._path(result.publishedRoot);
		let reportBytes = await readFile(path.join(source, 'package-set.json'));
		assert.equal(this._hash(reportBytes), result.packageSetSha256);
		assert.equal(JSON.parse(reportBytes.toString('utf8')).packageSetIdentity, result.packageSetIdentity);
		let reportIdentity = {
			path: 'package-set.json',
			byteLength: reportBytes.length,
			sha256: result.packageSetSha256,
		};
		let {default: Package} = await this._module('server/common/DistantSunSharedCachePackageService.js');
		let admitted = await new Package(source, 'monotone-cubic', undefined, 'corrected60-sun035').load(
			reportIdentity,
		);
		let parent = 'server/flat/data/distant-sun-shared';
		await this._path(parent, true);
		let targetRelative = parent + '/' + result.packageSetIdentity;
		let target = path.join(this.root, targetRelative);
		let existing = await lstat(target).then(
			() => true,
			(error) => {
				if (error.code !== 'ENOENT') {
					throw error;
				}
				return false;
			},
		);
		if (!existing) {
			let staging = await this._path(parent + '/staging-' + randomUUID(), true);
			for (let artifact of admitted.getFiles()) {
				await admitted.resolveAsset(result.packageSetIdentity + '/' + artifact.path);
				let destination = path.join(staging, artifact.path);
				await mkdir(path.dirname(destination), {recursive: true});
				await copyFile(path.join(source, artifact.path), destination, constants.COPYFILE_EXCL);
			}
			await rename(staging, target);
		}
		let installed = await new Package(
			await this._path(targetRelative),
			'monotone-cubic',
			undefined,
			'corrected60-sun035',
		).load(reportIdentity);
		for (let artifact of installed.getFiles()) {
			await installed.resolveAsset(result.packageSetIdentity + '/' + artifact.path);
		}
		let selection = await this._path('server/common/distant-sun-package.js');
		let previous = await readFile(selection, 'utf8');
		let replacement = previous
			.replace(
				/(DISTANT_SUN_PACKAGE_IDENTITY = ')[a-f0-9]{64}(';)/,
				(_match, prefix, suffix) => prefix + result.packageSetIdentity + suffix,
			)
			.replace(
				/(byteLength: )\d+(,\s*sha256: ')[a-f0-9]{64}(')/,
				(_match, prefix, middle, suffix) =>
					prefix + reportIdentity.byteLength + middle + reportIdentity.sha256 + suffix,
			);
		assert.ok(replacement.includes(result.packageSetIdentity) && replacement.includes(reportIdentity.sha256));
		let activation = await this._path(this.scratch + '/activation-' + randomUUID(), true);
		await writeFile(path.join(activation, 'previous-selection.js'), previous);
		await writeFile(
			path.join(activation, 'activation.json'),
			JSON.stringify({runRoot, target, reportIdentity, packageSetIdentity: result.packageSetIdentity}, null, 2),
		);
		if (replacement !== previous) {
			let temporary = selection + '.' + randomUUID() + '.tmp';
			await writeFile(temporary, replacement, {flag: 'wx'});
			await rename(temporary, selection);
		}
		let receipt = await this._receipt(false);
		let recorded =
			receipt?.packageSetIdentity === result.packageSetIdentity &&
			receipt?.packageSetSha256 === result.packageSetSha256 &&
			receipt?.publishedRoot === result.publishedRoot;
		let installedReceipt = recorded ? receipt : result;
		await this._saveReceipt('installed-build.json', installedReceipt);
		console.log(
			JSON.stringify({
				phase: 'cache-activated-for-next-start',
				target,
				activation,
				packageSetIdentity: result.packageSetIdentity,
			}),
		);
	}

	/**
	 * Call this method to verify all files in Flat's selected installed package without launching a browser.
	 *
	 * @returns {Promise<void>} - Complete installed package authenticated.
	 */
	async verify() {
		let selection = await this._module('server/common/distant-sun-package.js');
		let relative = 'server/flat/data/distant-sun-shared/' + selection.DISTANT_SUN_PACKAGE_IDENTITY;
		let root = process.env.FLAT_DISTANT_SUN_CACHE_ROOT ?? (await this._path(relative));
		let installed = await selection.loadDistantSunPackage(root);
		let bytes = 0;
		for (let artifact of installed.getFiles()) {
			await installed.resolveAsset(selection.DISTANT_SUN_PACKAGE_IDENTITY + '/' + artifact.path);
			bytes += artifact.byteLength;
		}
		console.log(
			JSON.stringify({
				phase: 'installed-cache-verified',
				root,
				packageSetIdentity: selection.DISTANT_SUN_PACKAGE_IDENTITY,
				files: installed.getFiles().length,
				bytes,
			}),
		);
	}

	/**
	 * Call this method to dispatch the explicitly requested deployment operation.
	 *
	 * @param {string[]} args - Command and optional sealed-run path.
	 * @returns {Promise<void>} - Requested operation completed.
	 */
	async run(args) {
		assert.equal((await realpath(this.root)).toLowerCase(), path.resolve(this.root).toLowerCase());
		switch (args[0]) {
			case 'prepare':
				return this.prepare();
			case 'probe':
				await this.probe();
				return;
			case 'build':
				return this.build(args[1] === '--force');
			case 'check':
				return this.check(args[1] === '--installed');
			case 'activate':
				return this.activate(args[1]);
			case 'verify':
				return this.verify();
			default:
				throw new Error(
					'Usage: node agents/topics/deploy/GlobeCacheDeployment.js prepare|probe|check [--installed]|build [--force]|activate [SEALED_RUN]|verify',
				);
		}
	}
}

await new GlobeCacheDeployment().run(process.argv.slice(2));
