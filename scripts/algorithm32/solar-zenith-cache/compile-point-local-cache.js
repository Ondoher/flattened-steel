import path from 'node:path';
import {fileURLToPath} from 'node:url';
import DistantSunPointLocalCacheCompiler from './DistantSunPointLocalCacheCompiler.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';

function argument(name) {
	const index = process.argv.indexOf(name);
	return index < 0 ? null : process.argv[index + 1];
}

const inputPath = argument('--input');
const outputDirectory = argument('--output');
const chromePath = argument('--chrome') ?? process.env.CHROME_PATH;
if (!inputPath || !outputDirectory || !chromePath) {
	throw new Error('Usage: --input INPUT.json --output REPOSITORY/RELATIVE/RUN --chrome ABSOLUTE_CHROME_PATH');
}
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
const input = JSON.parse((await files.read(inputPath)).toString('utf8'));
const abort = new AbortController();
const interrupt = () => abort.abort(new Error('Point-local compilation interrupted.'));
process.once('SIGINT', interrupt);
try {
	const result = await new DistantSunPointLocalCacheCompiler({chromePath}).compile({
		outputDirectory,
		buildRequest: input.buildRequest,
		scenes: input.scenes,
		wavelengths: input.wavelengths,
		signal: abort.signal,
		onProgress: (event) => {
			process.stdout.write(`${JSON.stringify(event)}\n`);
		},
	});
	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
	process.removeListener('SIGINT', interrupt);
}
