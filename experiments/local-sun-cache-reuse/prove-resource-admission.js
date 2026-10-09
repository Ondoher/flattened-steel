import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Prove live-wrapper admission or expected rejection without launching heavy computation.
 * @returns {Promise<void>} - New sealed launch-policy observation, separate from memory sampling.
 */
async function main() {
	const run = await ExperimentRun.create('resource-admit');
	try {
		const expectDenied = process.argv.includes('--expect-denied');
		let admitted = false;
		try {await requireHeavyExecution(); admitted = true;} catch (error) {
			if (!expectDenied) throw error;
		}
		if (admitted === expectDenied) throw new Error('Unexpected heavy-execution admission result.');
		const identities = [];
		for (const name of ['prove-resource-admission.js', 'heavy-execution-admission.js', 'run-boundary.js', 'ExperimentRun.js']) {
			const target = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, target);
			const bytes = await readFile(target);
			identities.push({path: path.relative(repositoryRoot, target).replaceAll('\\', '/'), sha256: hash(bytes)});
			await run.write('source-' + name, bytes);
		}
		await run.write('inputs.json', JSON.stringify({schema: 'heavy-admission-proof-input-v1', identities,
			command: process.argv.slice(1), expectDenied, tools: {node: process.version},
			operation: 'Check inherited capability against exact checked exclusive lock and live wrapper PID; no heavy workload.'}, null, '\t'));
		await run.write('result.json', JSON.stringify({schema: 'heavy-admission-proof-v1', admitted, expectDenied, passed: true}, null, '\t'));
		await run.finish('accepted'); console.log(JSON.stringify({run: run.name, admitted, expectDenied, passed: true}));
	} catch (error) {await run.finish('failed', String(error)); throw error;}
}
await main();
