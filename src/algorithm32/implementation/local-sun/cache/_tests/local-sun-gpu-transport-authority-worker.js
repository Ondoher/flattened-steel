import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDefaultCpuAuthoritySnapshot} from './local-sun-gpu-transport-authority.js';

const directory = dirname(fileURLToPath(import.meta.url));
const fixtureDirectory = resolve(directory, '..', 'fixtures');
const policyPath = resolve(fixtureDirectory, 'local-sun-gpu-transport-offload-policy.json');

const policyText = await readFile(policyPath, 'utf8');
const policy = JSON.parse(policyText);
if (policy.status !== 'unsealed') {
	throw new Error('Step 0 CPU authority worker only writes an unsealed policy snapshot.');
}
const resultPath = resolve(fixtureDirectory, policy.authority.cpuSnapshot);

const startedAt = performance.now();
const snapshot = createDefaultCpuAuthoritySnapshot((progress) => {
	process.stdout.write(`${JSON.stringify(progress)}\n`);
});
const result = {
	id: 'algorithm32-local-sun-gpu-transport-cpu-authority-v2',
	policySha256: createHash('sha256').update(policyText).digest('hex'),
	defaultProfile: policy.defaultProfile,
	generatedDurationMilliseconds: performance.now() - startedAt,
	options: snapshot.options,
	l2: snapshot.l2,
	l3: snapshot.l3,
};
await mkdir(fixtureDirectory, {recursive: true});
await writeFile(resultPath, `${JSON.stringify(result, null, '\t')}\n`, {encoding: 'utf8', flag: 'wx'});
process.stdout.write(`${JSON.stringify({resultPath, l2: result.l2.length, l3: result.l3.length})}\n`);
