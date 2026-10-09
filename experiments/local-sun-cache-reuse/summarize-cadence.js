import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Derive the five-state fresh visual cadence from authenticated immutable captures.
 * @returns {Promise<void>} - New sealed comparison sheet and derivation facts.
 */
async function main() {
	const names = process.argv.slice(2);
	if (names.length !== 5) throw new Error('Supply Flat 0/45/90/135/180 capture names in order.');
	const run = await ExperimentRun.create('p2-cadence');
	let failure = null;
	try {
		const rows = [],
			parents = [];
		const sheet = new PNG({width: 720 * 5, height: 448});
		for (const [index, name] of names.entries()) {
			const recipeParent = await readParent(name, 'recipe.json');
			const imageParent = await readParent(name, 'angle-0-comparison.png');
			const factsParent = await readParent(name, 'angle-0.json');
			const recipe = JSON.parse(new TextDecoder().decode(recipeParent.bytes));
			const facts = JSON.parse(new TextDecoder().decode(factsParent.bytes));
			if (
				recipe.diagnostic ||
				recipe.state.id !== `flat-${index * 45}` ||
				recipe.candidate !== 'precision' ||
				facts.profile.order !== 4 ||
				facts.profile.channels !== 15
			)
				throw new Error('Cadence control/profile identity mismatch.');
			const image = PNG.sync.read(Buffer.from(imageParent.bytes));
			if (image.width !== 2160 || image.height !== 448) throw new Error('Cadence image dimensions changed.');
			for (let y = 0; y < 448; y++)
				image.data.copy(
					sheet.data,
					(y * sheet.width + index * 720) * 4,
					y * image.width * 4,
					(y * image.width + 720) * 4,
				);
			parents.push(...[recipeParent, imageParent, factsParent].map((parent) => ({...parent, bytes: undefined})));
			rows.push({
				state: recipe.state.id,
				observation: recipe.state.observation,
				source: facts.source,
				profile: facts.profile,
				maximumRayRadiance: facts.maximumRayRadiance,
				role: 'Independently built fresh orbital-time control; no cross-placement cache reuse admission.',
			});
		}
		const source = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/summarize-cadence.js');
		const tool = path.join(repositoryRoot, 'node_modules/pngjs/package.json');
		await checkPath(repositoryRoot, source);
		await checkPath(repositoryRoot, tool);
		await run.write('cadence.png', PNG.sync.write(sheet));
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'local-sun-p2-cadence-v1',
					rows,
					parents,
					derivation: {
						operation:
							'Copy the fresh left 720x448 panel from each authenticated comparison PNG; concatenate in Flat 0/45/90/135/180 order without colour/exposure changes.',
						implementation: path.relative(repositoryRoot, source).replaceAll('\\', '/'),
						implementationSha256: hash(await readFile(source)),
						pngjsMetadataSha256: hash(await readFile(tool)),
						parameters: {width: 3600, height: 448},
					},
				},
				null,
				'\t',
			),
		);
	} catch (error) {
		failure = String(error.stack ?? error);
	}
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(JSON.stringify({run: run.name, failure}));
	if (failure) process.exitCode = 1;
}
await main();
