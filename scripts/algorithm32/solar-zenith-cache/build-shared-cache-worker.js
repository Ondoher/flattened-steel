import {createHash} from 'node:crypto';
import {readFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {DISTANT_SUN_SHARED_CACHE_DECODER_SHA256} from '../../../src/algorithm32/implementation/distant-sun/cache/consts.js';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
/**
 * Call this function to build the pinned Worker into explicit standalone or composed output directories.
 * Input ownership follows this module; output ownership follows the app builder's effective destination.
 *
 * @param {string|string[]} directories - Build-owned destination directories.
 * @returns {Promise<void>} - Complete module output with the pinned decoder bundled.
 */
export async function buildDistantSunSharedCacheWorker(directories) {
	const vendorPath = path.join(repositoryRoot, 'node_modules/three/examples/jsm/libs/zstddec.module.js');
	const vendorBytes = await readFile(vendorPath);
	if (createHash('sha256').update(vendorBytes).digest('hex') !== DISTANT_SUN_SHARED_CACHE_DECODER_SHA256) {
		throw new Error('Shared-cache decoder source differs from the qualified Three r180 pin.');
	}
	const input = path.join(
		repositoryRoot,
		'src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorker.js',
	);
	const bundle = await rollup({
		input,
		plugins: [nodeResolve({browser: true})],
		onwarn(warning) {
			if (warning.code === 'CIRCULAR_DEPENDENCY') {
				return;
			}
			throw new Error(`Shared-cache Worker build warning: ${warning.message}`);
		},
	});
	try {
		for (const directory of typeof directories === 'string' ? [directories] : directories) {
			const destination = path.resolve(directory);
			await mkdir(destination, {recursive: true});
			await bundle.write({
				file: path.join(destination, 'shared-cache-worker.js'),
				format: 'es',
				inlineDynamicImports: true,
			});
		}
	} finally {
		await bundle.close();
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await buildDistantSunSharedCacheWorker([
		path.join(repositoryRoot, 'dist/flat32'),
		path.join(repositoryRoot, 'dist/flat'),
	]);
	console.log('Built pinned production shared-cache module Worker.');
}
