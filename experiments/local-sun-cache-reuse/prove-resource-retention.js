import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {ShellWebGlResources} from './shell-webgl-resources.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash, hashFile, outputRoot} from './run-boundary.js';

/** Check compact snapshot prefixes and bounded hashing against immutable known artifacts.
 * @returns {Promise<void>} - New self-verifying retention evidence; actual GL interception is exercised separately through application captures.
 */
async function main() {
	const run = await ExperimentRun.create('resource-proof');
	try {
		const inventory = new ShellWebGlResources(), frames = [];
		for (let frame = 0; frame < 120; frame++) {
			for (let i = 0; i < 50; i++) {
				const resource = /** @type {WebGLTexture} */ (/** @type {unknown} */ ({}));
				inventory.set(resource, 'texture', 'storage', 4096);
				inventory.release(resource);
			}
			frames.push(inventory.snapshot(false));
		}
		const complete = inventory.snapshot(), prefixes = frames.every((frame, i) =>
			frame.events.length === 0 && frame.eventCount === (i + 1) * 100 && frame.bytes === 0 && frame.peak === 4096);
		const parent = await readParent('00309-p3-native-ref', 'input.json');
		const digest = await hashFile(outputRoot, path.join(outputRoot, 'runs', parent.run, parent.artifact));
		const hashMatches = digest.sha256 === parent.artifactSha256 && digest.byteLength === parent.bytes.byteLength;
		const compactBytes = Buffer.byteLength(JSON.stringify({frames, complete}));
		const duplicatedBytes = Buffer.byteLength(JSON.stringify({frames: frames.map(frame => ({...frame, events: complete.events.slice(0, frame.eventCount)})), complete}));
		const qualified = prefixes && complete.events.length === 12000 && hashMatches && compactBytes < duplicatedBytes / 20;
		const implementation = [];
		for (const name of ['prove-resource-retention.js', 'shell-webgl-resources.js', 'ExperimentRun.js', 'parent-evidence.js', 'run-boundary.js']) {
			const target = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name); await checkPath(repositoryRoot, target);
			const bytes = await readFile(target); await run.write('source-' + name, bytes); implementation.push({path: name, sha256: hash(bytes)});
		}
		await run.write('inputs.json', JSON.stringify({parents: [(({bytes, ...identity}) => identity)(parent)], implementation,
			tools: {node: process.version}, operation: '120 snapshots after 50 allocation/delete pairs each: preserve complete event order once, validate frame prefix identities and peak/live bytes, compare retained representation sizes. Stream-authenticate an entire sealed native export inventory and compare selected input hash/length.'}, null, '\t'));
		await run.write('result.json', JSON.stringify({prefixes, events: complete.events.length, hashMatches, compactBytes, duplicatedBytes, qualified}, null, '\t'));
		await run.finish(qualified ? 'accepted' : 'rejected'); console.log(JSON.stringify({run: run.name, compactBytes, duplicatedBytes, qualified}));
	} catch (error) {await run.finish('failed', String(error)); throw error;}
}
await main();
