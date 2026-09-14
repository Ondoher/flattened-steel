import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import Reference from './DistantSunBinary64Reference.js';
import {DistantSunSceneCacheCompilerInputs as Inputs} from './DistantSunSceneCacheCompilerInputs.js';

const files = new Files(fileURLToPath(new URL('../../../', import.meta.url)));
const run = `tmp/production-algorithm32/distant-sun-strobing-promotion/reference-${randomUUID()}`;
await files.directory(run);
const input = Inputs.createInputSet(Inputs.createQualifiedSanJoseNauticalScene());
const channel = 7,
	position = 0,
	zenith = 90,
	direction = 4 * 729 + 364;
const sources = [];
for (const name of ['DistantSunBinary64Reference.js', 'probe-binary64-recurrence.js']) {
	const relativePath = `scripts/algorithm32/solar-zenith-cache/${name}`,
		bytes = await files.read(relativePath);
	sources.push({path: relativePath, byteLength: bytes.length, sha256: files.hash(bytes)});
}
const definition = await files.write(
	`${run}/definition.json`,
	Buffer.from(`${JSON.stringify({input, channel, position, zenith, direction, sources})}\n`),
);
const started = performance.now();
try {
	const reference = new Reference(input.buildRequest, channel, (event) =>
		process.stdout.write(`${JSON.stringify({run, ...event, elapsedMilliseconds: performance.now() - started})}\n`),
	);
	const orders = [];
	for (let order = 1; order <= 4; order++) {
		orders.push(reference.density(order, position, zenith, direction));
		process.stdout.write(
			`${JSON.stringify({run, order, value: orders.at(-1), elapsedMilliseconds: performance.now() - started})}\n`,
		);
	}
	for (const source of sources) await files.read(source.path, source);
	const result = await files.write(
		`${run}/result.json`,
		Buffer.from(
			`${JSON.stringify({orders, cumulativeN4: orders.reduce((sum, value) => sum + value, 0), evaluations: reference.evaluations, elapsedMilliseconds: performance.now() - started, tools: {node: process.version}, claim: 'Independent reference execution only; GPU comparison remains required.'})}\n`,
		),
	);
	await files.write(
		`${run}/sealed.json`,
		Buffer.from(
			`${JSON.stringify({accepted: orders.every((value) => Number.isFinite(value) && value >= 0), artifacts: [definition, result]})}\n`,
		),
	);
} catch (error) {
	const failure = await files.write(
		`${run}/failure.json`,
		Buffer.from(`${JSON.stringify({error: String(error)})}\n`),
	);
	await files.write(
		`${run}/sealed.json`,
		Buffer.from(`${JSON.stringify({accepted: false, artifacts: [definition, failure]})}\n`),
	);
	throw error;
}
