import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import CompilerHost from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheCompilerHost.js';
import {GlobeCacheInputs} from './GlobeCacheInputs.js';

let repository = fileURLToPath(new URL('../../../', import.meta.url));
let source = fileURLToPath(new URL('./', import.meta.url));
let scratch = path.join(repository, '.codex-tmp');

/**
 * Called by deployment tests to run the real CLI in its isolated repository fixture.
 *
 * @param {string} root - Fixture repository.
 * @param {string[]} args - Actual deployment command arguments.
 * @param {Record<string, string>} [environment] - Explicit child environment overrides.
 * @returns {ReturnType<typeof spawnSync>} - Child status and captured diagnostics.
 */
function invoke(root, args, environment = {}) {
	return spawnSync(process.execPath, ['agents/topics/deploy/GlobeCacheDeployment.js', ...args], {
		cwd: root,
		encoding: 'utf8',
		windowsHide: true,
		timeout: 30000,
		env: {...process.env, ...environment},
	});
}

test('graphics selection preserves Windows support and supports explicit Linux hardware without software fallback', () => {
	let host = new CompilerHost();
	for (let backend of ['gl', 'vulkan']) {
		let args = host._browserArguments('/tmp/profile', 'http://127.0.0.1/', backend);
		assert.ok(args.includes('--use-angle=' + backend));
		assert.ok(args.includes('--disable-software-rasterizer'));
		assert.ok(!args.includes('--use-angle=d3d11'));
		assert.ok(!args.includes('--no-sandbox'));
	}
	assert.ok(host._browserArguments('profile', 'url', 'd3d11').includes('--use-angle=d3d11'));
	assert.ok(host._browserArguments('profile', 'url', 'swiftshader').includes('--enable-unsafe-swiftshader'));
	assert.throws(() => host._browserArguments('profile', 'url', 'invalid'), /Unsupported/u);
});

test('fresh-checkout seed restoration is idempotent and preserves conflicting existing bytes', async () => {
	await mkdir(scratch, {recursive: true});
	let root = await mkdtemp(path.join(scratch, 'deploy-seed-test-'));
	try {
		let folder = path.join(root, 'agents/topics/deploy');
		await mkdir(folder, {recursive: true});
		for (let name of [
			'GlobeCacheDeployment.js',
			'GlobeCacheInputs.js',
			'cache-control-seed.manifest.json',
			'cache-control-seed.json.gz',
		]) {
			await copyFile(path.join(source, name), path.join(folder, name));
		}
		await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
		let manifest = JSON.parse(await readFile(path.join(folder, 'cache-control-seed.manifest.json'), 'utf8'));
		let result = invoke(root, ['prepare']);
		assert.ifError(result.error);
		assert.equal(result.status, 0, String(result.stderr));
		assert.equal(JSON.parse(String(result.stdout)).files, 328);
		result = invoke(root, ['prepare']);
		assert.equal(result.status, 0, String(result.stderr));
		let catalog = path.join(root, manifest.targetRoot, manifest.catalog);
		await writeFile(catalog, 'existing-conflicting-control');
		result = invoke(root, ['prepare']);
		assert.equal(result.status, 1);
		assert.equal(await readFile(catalog, 'utf8'), 'existing-conflicting-control');
	} finally {
		assert.equal(path.dirname(await realpath(root)), await realpath(scratch));
		await rm(root, {recursive: true, force: true});
	}
});

test('copied output activates, reuses unchanged inputs without a GPU and invalidates changed or missing inputs', async () => {
	await mkdir(scratch, {recursive: true});
	let root = await mkdtemp(path.join(scratch, 'deploy-activation-test-'));
	try {
		let folder = path.join(root, 'agents/topics/deploy');
		let common = path.join(root, 'server/common');
		await mkdir(folder, {recursive: true});
		await mkdir(common, {recursive: true});
		await copyFile(path.join(source, 'GlobeCacheDeployment.js'), path.join(folder, 'GlobeCacheDeployment.js'));
		await copyFile(path.join(source, 'GlobeCacheInputs.js'), path.join(folder, 'GlobeCacheInputs.js'));
		await copyFile(path.join(source, 'cache-build-settings.json'), path.join(folder, 'cache-build-settings.json'));
		await copyFile(
			path.join(source, 'cache-control-seed.manifest.json'),
			path.join(folder, 'cache-control-seed.manifest.json'),
		);
		await copyFile(
			path.join(source, 'cache-control-seed.json.gz'),
			path.join(folder, 'cache-control-seed.json.gz'),
		);
		await mkdir(path.join(root, 'src/algorithm32'), {recursive: true});
		await mkdir(path.join(root, 'scripts/algorithm32/solar-zenith-cache'), {recursive: true});
		await writeFile(path.join(root, 'src/algorithm32/physical.js'), 'export const physical = 1;\n');
		await writeFile(
			path.join(root, 'scripts/algorithm32/solar-zenith-cache/compiler.js'),
			'export const compiler = 1;\n',
		);
		await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
		let old = 'a'.repeat(64),
			selected = 'b'.repeat(64);
		let selection =
			"export const DISTANT_SUN_PACKAGE_IDENTITY = '" +
			old +
			"';\nexport const REPORT = {byteLength: 1, sha256: '" +
			old +
			"'};\n";
		await writeFile(path.join(common, 'distant-sun-package.js'), selection);
		// The fixture substitutes only the package-format reader; the deployment filesystem and selection path are real.
		await writeFile(
			path.join(common, 'DistantSunSharedCachePackageService.js'),
			`
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export default class Package {
 constructor(root) { this.root=root; }
 async load(report) { this.report=report; return this; }
 getFiles() { return [{path:'package-set.json',byteLength:this.report.byteLength},{path:'blocks/fixture.zst',byteLength:19}]; }
 async resolveAsset(value) { return readFile(path.join(this.root,value.split('/').slice(1).join('/'))); }
}
`,
		);
		let run = 'tmp/production-algorithm32/distant-sun-shared-block-cache/runs/deployment-fixture';
		let publishedRoot = run + '/published/' + selected;
		await mkdir(path.join(root, publishedRoot, 'blocks'), {recursive: true});
		let report = Buffer.from(JSON.stringify({packageSetIdentity: selected}));
		await writeFile(path.join(root, publishedRoot, 'package-set.json'), report);
		await writeFile(path.join(root, publishedRoot, 'blocks/fixture.zst'), 'fixture cache bytes');
		let receipt = {
			accepted: true,
			publishedRoot,
			packageSetIdentity: selected,
			packageSetSha256: createHash('sha256').update(report).digest('hex'),
		};
		let acceptance = JSON.stringify(receipt) + '\n';
		await writeFile(path.join(root, run, 'acceptance.json'), acceptance);
		let rejected = invoke(root, ['activate', run]);
		assert.equal(rejected.status, 1);
		assert.equal(await readFile(path.join(common, 'distant-sun-package.js'), 'utf8'), selection);
		await writeFile(
			path.join(root, run, 'sealed.json'),
			JSON.stringify({
				packageSetIdentity: selected,
				acceptanceSha256: createHash('sha256').update(acceptance).digest('hex'),
			}),
		);
		let inputs = await new GlobeCacheInputs(root).calculate();
		await mkdir(path.join(root, '.codex-tmp/flat-cache-deployment'), {recursive: true});
		await writeFile(
			path.join(root, '.codex-tmp/flat-cache-deployment/last-build.json'),
			JSON.stringify({
				...receipt,
				inputFingerprint: inputs.fingerprint,
				cacheInputs: inputs,
			}),
		);
		let check = invoke(root, ['check']);
		assert.equal(check.status, 0, String(check.stderr));
		assert.equal(JSON.parse(String(check.stdout)).reusable, true);
		let reused = invoke(root, ['build']);
		assert.equal(reused.status, 0, String(reused.stderr));
		assert.equal(JSON.parse(String(reused.stdout)).phase, 'cache-reused');
		let forced = invoke(root, ['build', '--force'], {CHROME_PATH: path.join(root, 'missing-browser')});
		assert.equal(forced.status, 1);
		assert.match(String(forced.stderr), /Set CHROME_PATH/u);
		let result = invoke(root, ['activate', run]);
		assert.ifError(result.error);
		assert.equal(result.status, 0, String(result.stderr));
		let activation = JSON.parse(String(result.stdout));
		assert.equal(await readFile(path.join(activation.activation, 'previous-selection.js'), 'utf8'), selection);
		assert.equal(
			await readFile(
				path.join(root, 'server/flat/data/distant-sun-shared', selected, 'blocks/fixture.zst'),
				'utf8',
			),
			'fixture cache bytes',
		);
		let current = await readFile(path.join(common, 'distant-sun-package.js'), 'utf8');
		assert.ok(current.includes(selected));
		assert.ok(current.includes(receipt.packageSetSha256));
		assert.ok(current.includes('byteLength: ' + report.length));
		assert.equal(invoke(root, ['activate', run]).status, 0);
		let installed = invoke(root, ['check', '--installed']);
		assert.equal(installed.status, 0, String(installed.stderr));
		assert.equal(JSON.parse(String(installed.stdout)).reusable, true);
		assert.equal(JSON.parse(String(installed.stdout)).activationRequired, false);
		await writeFile(path.join(root, 'README.md'), 'Unrelated documentation change');
		await mkdir(path.join(root, 'src/flat/components'), {recursive: true});
		await writeFile(path.join(root, 'src/flat/components/Toolbar.jsx'), 'export const Toolbar = null;');
		assert.equal((await new GlobeCacheInputs(root).calculate()).fingerprint, inputs.fingerprint);
		let controlFile = path.join(folder, 'cache-control-seed.manifest.json');
		let originalControl = await readFile(controlFile, 'utf8');
		let changedControl = JSON.parse(originalControl);
		changedControl.files[0].sha256 = 'c'.repeat(64);
		await writeFile(controlFile, JSON.stringify(changedControl));
		assert.equal(JSON.parse(String(invoke(root, ['check']).stdout)).state, 'changed');
		await writeFile(controlFile, originalControl);
		await writeFile(path.join(root, 'src/algorithm32/physical.js'), 'export const physical = 1;\r\n');
		assert.equal((await new GlobeCacheInputs(root).calculate()).fingerprint, inputs.fingerprint);
		let settingsFile = path.join(folder, 'cache-build-settings.json');
		let originalSettings = await readFile(settingsFile, 'utf8');
		await writeFile(
			settingsFile,
			JSON.stringify({...JSON.parse(originalSettings), maximumObserverAltitudeMeters: 2000}),
		);
		assert.equal(JSON.parse(String(invoke(root, ['check']).stdout)).state, 'changed');
		await writeFile(settingsFile, originalSettings);
		await writeFile(path.join(root, 'src/algorithm32/physical.js'), 'export const physical = 2;\n');
		assert.equal(JSON.parse(String(invoke(root, ['check']).stdout)).state, 'changed');
		await writeFile(path.join(root, 'src/algorithm32/physical.js'), 'export const physical = 1;\n');
		await rm(path.join(root, publishedRoot, 'blocks/fixture.zst'));
		let missing = JSON.parse(String(invoke(root, ['check']).stdout));
		assert.equal(missing.state, 'missing');
		assert.equal(missing.inputsMatch, true);
		assert.equal(missing.reusable, false);
	} finally {
		assert.equal(path.dirname(await realpath(root)), await realpath(scratch));
		await rm(root, {recursive: true, force: true});
	}
});
