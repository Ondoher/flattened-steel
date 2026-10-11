import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Compare full occupied-field hashes and explicit zero slots in a bounded unculled build.
 * @returns {Promise<void>} - Immutable omission equivalence and logical allocation savings.
 */
async function main() {
	const run = await ExperimentRun.create('p3-omission');
	try {
		const current = process.argv[2] === '--current-contract';
		const names = process.argv.slice(current ? 3 : 2);
		if (names.length !== 2) throw new Error('Compact and unculled captures required.');
		const parents = [],
			levels = [];
		const currentParents = current
			? await Promise.all(['contract.json', 'gates.json'].map((file) => readParent('00478-p3-contract', file)))
			: [];
		if (
			current &&
			(currentParents[0].artifactSha256 !== '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704' ||
				currentParents[1].artifactSha256 !== 'c5794fb707b7da7c87713e19ebaf77ae7e3816d6cc72e929958e12a4aa33210d')
		)
			throw new Error('Current omission identities changed.');
		parents.push(...currentParents);
		for (const name of names) {
			const artifacts = await Promise.all(
				['result.json', 'recipe.json', 'inputs.json'].map((file) => readParent(name, file)),
			);
			parents.push(...artifacts);
			const result = JSON.parse(new TextDecoder().decode(artifacts[0].bytes)),
				recipe = JSON.parse(new TextDecoder().decode(artifacts[1].bytes)),
				inputs = JSON.parse(new TextDecoder().decode(artifacts[2].bytes));
			levels.push({
				recipe,
				inputs,
				candidate: result.results.find((/** @type {{candidate:boolean}} */ r) => r.candidate),
			});
		}
		const [compact, unculled] = levels,
			count = compact.recipe.layout.nodes.length;
		if (
			current &&
			(count !== 1049 ||
				!compact.recipe.qualifyLayout ||
				!unculled.recipe.qualifyLayout ||
				!compact.candidate.layoutChecks?.qualified ||
				!unculled.candidate.layoutChecks?.qualified)
		)
			throw new Error('Current candidate correctness or topology is incomplete.');
		if (compact.recipe.layout.occupiedNodeCount !== undefined || unculled.recipe.layout.occupiedNodeCount !== count)
			throw new Error('Invalid compact/unculled mapping.');
		const canonical = unculled.recipe.layout;
		const {occupiedNodeCount, ...original} = canonical;
		original.nodes = canonical.nodes.slice(0, count);
		original.schema = compact.recipe.layout.schema;
		if (JSON.stringify({...unculled.recipe, layout: original}) !== JSON.stringify(compact.recipe))
			throw new Error('Physical equations, occupied topology or numerical policy differ.');
		const closures = levels.map((level) =>
			[...level.inputs.inputs].sort((/** @type {{path:string}} */ a, /** @type {{path:string}} */ b) =>
				a.path.localeCompare(b.path),
			),
		);
		if (JSON.stringify(closures[0]) !== JSON.stringify(closures[1]))
			throw new Error('Source closure differs between omission controls.');
		if (
			canonical.nodes
				.slice(count)
				.some(
					(/** @type {LocalSunShellLayoutNode} */ n) =>
						!n.emptyBand || n.z <= canonical.top || canonical.bands[n.band].admitted,
				)
		)
			throw new Error('An appended slot intersects the atmosphere.');
		const required = [
			'local-sun-j1',
			'local-sun-j2',
			'local-sun-j3',
			'local-sun-j4',
			'local-sun-l1',
			'local-sun-l2',
			'local-sun-l3',
		];
		const fields = required.map((id) => {
			const a = compact.candidate.orderFields.find((/** @type {{id:string}} */ f) => f.id === id),
				b = unculled.candidate.orderFields.find((/** @type {{id:string}} */ f) => f.id === id);
			if (!a || !b) throw new Error('Incomplete all-order omission inventory.');
			return {id, bitIdentical: a.occupiedSha256 === b.occupiedSha256, emptyNonzero: b.emptyNonzero};
		});
		fields.push({
			id: 'cumulative',
			bitIdentical: compact.candidate.field.occupiedSha256 === unculled.candidate.field.occupiedSha256,
			emptyNonzero: unculled.candidate.field.emptyNonzero,
		});
		const allocation = compact.candidate.allocations.map((/** @type {LocalSunControlAllocation} */ a) => {
			const b = unculled.candidate.allocations.find((/** @type {{id:string}} */ b) => b.id === a.id);
			if (!b) throw new Error('Allocation inventory mismatch.');
			return {id: a.id, compactBytes: a.bytes, unculledBytes: b.bytes, savedBytes: b.bytes - a.bytes};
		});
		const qualified = fields.every((f) => f.bitIdentical && f.emptyNonzero === 0);
		const source = [];
		for (const name of ['prove-shell-omission.js', 'ExperimentRun.js', 'parent-evidence.js', 'run-boundary.js']) {
			const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			source.push({path: path.relative(repositoryRoot, file).replaceAll('\\', '/'), sha256: hash(bytes)});
			await run.write('source-' + name, bytes);
		}
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'shell-omission-input-v1',
					parents: parents.map(({bytes, ...identity}) => identity),
					source,
					operation:
						'Compare all occupied pure, transported and cumulative field hashes under identical equations/source closure; require zero empty-band slots and retain actual logical GPU allocations',
					parameters: {
						compactNodes: count,
						emptySlots: canonical.nodes.length - count,
						omittedBands: canonical.omittedBands,
					},
					tools: {node: process.version},
					command: process.argv.slice(1),
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'shell-omission-v1',
					contractSha256: currentParents[0]?.artifactSha256 ?? null,
					gatesSha256: currentParents[1]?.artifactSha256 ?? null,
					qualified,
					fields,
					allocation,
					compactPeakFieldBytes: compact.candidate.peakFieldBytes,
					unculledPeakFieldBytes: unculled.candidate.peakFieldBytes,
					avoidedDispatchPositions: canonical.nodes.length - count,
					actualScalarWritesSaved: current
						? unculled.candidate.executedWork.scalarOutputInvocations -
							compact.candidate.executedWork.scalarOutputInvocations
						: null,
					claim: 'Bounded equivalent unculled control with one empty slot per band/altitude row; complete occupied field equivalence and logical allocation/dispatch saving, not physical accuracy, timing benefit or device-memory telemetry.',
				},
				null,
				'\t',
			),
		);
		await run.finish(qualified ? 'accepted' : 'rejected');
		console.log(
			JSON.stringify({
				run: run.name,
				qualified,
				fields,
				peakSavedBytes: unculled.candidate.peakFieldBytes - compact.candidate.peakFieldBytes,
			}),
		);
	} catch (error) {
		await run.finish('failed', error instanceof Error ? error.stack : String(error));
		throw error;
	}
}
await main();
