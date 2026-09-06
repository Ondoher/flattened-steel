import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const resultDirectoryUrl = new URL(
	'../../../references/results/experiments/e1-finite-object-transfer/',
	import.meta.url,
);
const resultDirectory = fileURLToPath(resultDirectoryUrl);
const resultPath = fileURLToPath(new URL('result.md', resultDirectoryUrl));

let capturedOutput = '';
const originalWrite = process.stdout.write.bind(process.stdout);

process.stdout.write = (chunk, encoding, callback) => {
	capturedOutput += Buffer.isBuffer(chunk)
		? chunk.toString(typeof encoding === 'string' ? encoding : 'utf8')
		: String(chunk);

	if (typeof encoding === 'function') {
		encoding();
	} else if (typeof callback === 'function') {
		callback();
	}

	return true;
};

try {
	await import('./run.js');
} finally {
	process.stdout.write = originalWrite;
}

originalWrite(capturedOutput);

if (!process.exitCode) {
	mkdirSync(resultDirectory, {recursive: true});
	writeFileSync(resultPath, capturedOutput, 'utf8');
	console.log(`\nSaved accepted result: ${resultPath}`);
}
