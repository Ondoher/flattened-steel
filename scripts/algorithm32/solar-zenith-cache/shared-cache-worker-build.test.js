import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdir, mkdtemp, readFile, realpath, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import feature from '../../../src/flat/features/spherical-earth/build.js';

test('the spherical feature builds its Worker in the effective output directory', async () => {
	const repository = fileURLToPath(new URL('../../../', import.meta.url));
	const temporaryRoot = path.join(repository, '.codex-tmp/flat-worker-build-tests');
	await mkdir(temporaryRoot, {recursive: true});
	const directory = await mkdtemp(path.join(temporaryRoot, 'parent-output-'));
	const indices = [],
		styles = [];
	try {
		await feature.build({
			destPath: directory,
			addFeatureIndex(index) {
				indices.push(index);
			},
			addMainCss(root, specs) {
				styles.push({root, specs});
			},
		});
		assert.ok((await readFile(path.join(directory, 'shared-cache-worker.js'))).byteLength > 0);
		assert.deepEqual(indices, ['features/spherical-earth/index.js']);
		assert.equal(styles[0].root, 'features/spherical-earth');
		assert.equal(styles[0].specs[0].dest, 'features/spherical-earth/styles');
	} finally {
		const actual = await realpath(directory);
		assert.equal(path.dirname(actual), await realpath(temporaryRoot));
		await rm(actual, {recursive: true, force: true});
	}
});
