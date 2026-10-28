import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {mkdtemp, mkdir, writeFile, rm, symlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalAssetPackage} from '../LocalAssetPackage.js';

const repository = fileURLToPath(new URL('../../../../', import.meta.url));

/** Create unique disposable package inputs under the ignored task-output root. */
async function fixture(t) {
	const directory = await mkdtemp(path.join(repository, '.codex-tmp', 'flat32-server-assets-'));
	t.after(async () => {
		assert.ok(path.resolve(directory).startsWith(path.join(repository, '.codex-tmp') + path.sep));
		await rm(directory, {recursive: true, force: true});
	});
	return directory;
}

describe('local package file boundary', () => {
	it('reads JSON and streams exact bytes with content facts', async (t) => {
		let directory = await fixture(t);
		await writeFile(path.join(directory, 'manifest.json'), '{"accepted":true}');
		await writeFile(path.join(directory, 'payload.bin'), Buffer.from([1, 2, 3]));
		let assets = new LocalAssetPackage(directory);
		await assets.load();
		assert.deepEqual(await assets.readJson('manifest.json'), {accepted: true});
		let opened = await assets.openAsset('payload.bin');
		let chunks = [];
		for await (let chunk of opened.stream) chunks.push(chunk);
		assert.deepEqual(Buffer.concat(chunks), Buffer.from([1, 2, 3]));
		assert.equal(opened.byteLength, 3);
		assert.equal(opened.contentType, 'application/octet-stream');
	});

	it('rejects traversal, missing files, directories and junction traversal', async (t) => {
		let directory = await fixture(t);
		await mkdir(path.join(directory, 'folder'));
		await writeFile(path.join(directory, 'folder', 'data.json'), '{}');
		await symlink(path.join(directory, 'folder'), path.join(directory, 'alias'), 'junction');
		let assets = new LocalAssetPackage(directory);
		await assets.load();
		for (let value of ['../outside', '', '/absolute', 'folder/../manifest.json', 'folder', 'alias/data.json']) {
			await assert.rejects(assets.openAsset(value));
		}
		await assert.rejects(assets.openAsset('missing.json'), {code: 'ENOENT'});
	});
});
