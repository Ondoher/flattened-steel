import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import {DISTANT_SUN_SHARED_CACHE_DECODER_SHA256} from '../../../src/algorithm32/implementation/distant-sun/cache/consts.js';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
const vendorPath = await files.resolve('node_modules/three/examples/jsm/libs/zstddec.module.js');
const vendorBytes = await readFile(vendorPath);
if (createHash('sha256').update(vendorBytes).digest('hex') !== DISTANT_SUN_SHARED_CACHE_DECODER_SHA256) {
	throw new Error('Shared-cache decoder source differs from the qualified Three r180 pin.');
}
const input = await files.resolve('src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorker.js');
await files.directory('dist/flat32');
const output = fileURLToPath(new URL('../../../dist/flat32/shared-cache-worker.js', import.meta.url));
try {
	await files.resolve('dist/flat32/shared-cache-worker.js');
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
const bundle = await rollup({
	input,
	plugins: [nodeResolve({browser: true})],
	onwarn(warning) {
		if (warning.code === 'CIRCULAR_DEPENDENCY') return;
		throw new Error(`Shared-cache Worker build warning: ${warning.message}`);
	},
});
try {
	await bundle.write({file: output, format: 'es', inlineDynamicImports: true});
	console.log('Built pinned production shared-cache module Worker.');
} finally {
	await bundle.close();
}
