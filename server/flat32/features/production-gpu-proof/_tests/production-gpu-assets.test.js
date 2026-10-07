import assert from 'node:assert/strict';
import {mkdir, mkdtemp, symlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {ProductionGpuAssetService} from '../index.js';
import {ProductionGpuHost} from '../../../../../scripts/experiments/b1-directional-sky-radiance/ProductionGpuHost.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');

test('reads only admitted ordinary inputs and rejects an in-root junction to another directory', async () => {
	const task = path.resolve(
		repositoryRoot,
		process.env.ALGORITHM32_PROOF_TEST_OUTPUT_ROOT ?? '.codex-tmp/production-gpu-proof',
	);
	if (!task.startsWith(path.join(repositoryRoot, '.codex-tmp') + path.sep))
		throw new RangeError('Proof fixture output must remain below repository temporary output.');
	await mkdir(task, {recursive: true});
	const root = await mkdtemp(path.join(task, 'asset-proof-'));
	await mkdir(path.join(root, 'admitted'));
	await mkdir(path.join(root, 'outside'));
	await writeFile(path.join(root, 'admitted/module.js'), 'export const qualified = true;', {flag: 'wx'});
	await writeFile(path.join(root, 'outside/private.json'), '{"private":true}', {flag: 'wx'});
	const service = new ProductionGpuAssetService({repositoryRoot: root, allowedDirectories: ['admitted/']});
	assert.equal((await service.read('admitted/module.js')).contentType, 'text/javascript');
	assert.equal(
		new TextDecoder().decode((await service.read('admitted/module.js')).bytes),
		'export const qualified = true;',
	);
	await symlink(
		path.join(root, 'outside'),
		path.join(root, 'admitted/junction'),
		process.platform === 'win32' ? 'junction' : 'dir',
	);
	await assert.rejects(service.read('admitted/junction/private.json'), /alias/);
	await assert.rejects(service.read('admitted/../outside/private.json'), /Invalid/);
	await assert.rejects(service.read('outside/private.json'), /admitted/);
});

test('production GPU proof uses the Polylith listener and translates bounded transport requests', async () => {
	const host = new ProductionGpuHost();
	host._assetSet = {assets: []};
	const listener = await host._createServer();
	host._server = listener;
	assert.equal(listener, host._polylith.server);
	await new Promise((resolve, reject) => {
		listener.once('error', reject);
		listener.listen(0, '127.0.0.1', () => resolve(undefined));
	});
	try {
		const address = listener.address();
		assert.ok(address && typeof address !== 'string');
		const origin = `http://127.0.0.1:${address.port}`;
		assert.match(await (await fetch(origin)).text(), /algorithm32B1GpuReady/);
		const module = await fetch(
			`${origin}/scripts/experiments/b1-directional-sky-radiance/production-gpu-browser.js`,
		);
		assert.equal(module.status, 200);
		assert.match(await module.text(), /initializeGpuSession/);
		assert.equal((await fetch(origin, {method: 'POST'})).status, 405);
		assert.equal((await fetch(`${origin}/AGENTS.md`)).status, 403);
	} finally {
		await host.close();
	}
});
