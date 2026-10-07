import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import Files from './DistantSunSharedCacheGenerationFiles.js';

const files = new Files(fileURLToPath(new URL('../../../', import.meta.url)));
const outputRoot =
	process.argv.find((argument) => argument.startsWith('--output-root='))?.slice(14) ??
	'.codex-tmp/shared-runtime-dependencies';
if (!/^\.codex-tmp\/[A-Za-z0-9_-]+$/u.test(outputRoot))
	throw new RangeError('Dependency proof requires a task-contained output root.');
const run = `${outputRoot}/runs/${new Date().toISOString().replace(/[:.]/gu, '-')}-${randomUUID()}`;
await files.directory(run);
const bundle = await rollup({
	input: await files.resolve('src/flat32/Flat32Application.js'),
	plugins: [
		{
			name: 'production-environment',
			transform: (code) => ({code: code.replaceAll('process.env.NODE_ENV', '"production"'), map: null}),
		},
		nodeResolve({browser: true}),
		/** @type {SharedQualificationCommonJsFactory} */ (/** @type {unknown} */ (commonjs))(),
	],
	onwarn: (warning) => {
		if (!['CIRCULAR_DEPENDENCY', 'THIS_IS_UNDEFINED'].includes(warning.code)) throw new Error(warning.message);
	},
});
try {
	const {output} = await bundle.generate({format: 'es', inlineDynamicImports: true});
	const root = fileURLToPath(new URL('../../../', import.meta.url)).replaceAll('\\', '/');
	const modules = bundle.cache.modules.map((module) => ({
		path: module.id.replaceAll('\\', '/').replaceAll(root, ''),
		sha256: files.hash(module.code),
	}));
	const forbidden = modules.filter((module) =>
		/(?:^|\/)(?:experiments|_tests)(?:\/)|poly-gc-react|DistantSunSceneCacheAssetLoader|DistantSunSceneCacheController/u.test(
			module.path,
		),
	);
	if (forbidden.length) throw new Error(`Forbidden production dependencies: ${JSON.stringify(forbidden)}`);
	console.log(
		JSON.stringify(
			await files.write(
				`${run}/result.json`,
				Buffer.from(
					JSON.stringify(
						{
							accepted: true,
							entry: 'src/flat32/Flat32Application.js',
							operation:
								'resolve and bundle production browser imports; reject experiment, test/reference, external comparison, and retired dense-loader modules',
							node: process.version,
							bundleSha256: files.hash(output[0].code),
							modules,
						},
						null,
						2,
					) + '\n',
				),
			),
		),
	);
} finally {
	await bundle.close();
}
