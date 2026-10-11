import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from '../ExperimentRun.js';
import {readParent} from '../parent-evidence.js';
import {repositoryRoot, checkPath, hash} from '../run-boundary.js';
import {shellStencil} from '../shell-layout.js';

/** Pin the current claim contract and prove admitted layout bookkeeping only.
 * @returns {Promise<void>} - New sealed contract evidence; no cache construction or accuracy study.
 */
async function main() {
	const run = await ExperimentRun.create('p3-contract');
	try {
		const controlPath = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/p3-contract.json');
		await checkPath(repositoryRoot, controlPath);
		const controlBytes = await readFile(controlPath),
			control = JSON.parse(controlBytes.toString('utf8'));
		if (control.schema !== 'local-sun-p3-defensibility-contract-v1') throw new Error('Unsupported P3 contract.');
		const selectionParent = await readParent(control.selection.run, control.selection.artifact);
		const layoutParent = await readParent(control.layout.run, control.layout.artifact);
		const gatesParent = await readParent(control.legacyGates.run, control.legacyGates.artifact);
		const selection = JSON.parse(Buffer.from(selectionParent.bytes).toString('utf8'));
		/** @type {LocalSunShellLayout} */ const layout = JSON.parse(Buffer.from(layoutParent.bytes).toString('utf8'));
		const legacy = JSON.parse(Buffer.from(gatesParent.bytes).toString('utf8'));
		if (
			selection.identity !== control.selection.identity ||
			selection.layoutSha256 !== layoutParent.artifactSha256 ||
			selection.gatesSha256 !== gatesParent.artifactSha256 ||
			legacy.schema !== control.legacyGates.schema
		)
			throw new Error('Frozen selection or parent identities disagree.');
		for (const key of ['schema', 'height', 'top', 'maximumRho', 'interpolation', 'reconstruction'])
			if (layout[key] !== control.layout[key]) throw new Error('Selected layout changed: ' + key);
		if (layout.nodes.length !== control.layout.nodes) throw new Error('Selected node count changed.');
		for (const [key, value] of Object.entries(control.numericalPolicy))
			if (selection[key] !== value) throw new Error('Frozen numerical policy differs: ' + key);
		const minimum = layout.height - layout.top;
		for (const band of layout.bands)
			if (band.admitted !== band.outer >= minimum || layout.omittedBands.includes(band.id) === band.admitted)
				throw new Error('Empty/tangent band admission changed.');
		let maximumNodeWeightError = 0,
			maximumWeightSumError = 0,
			queries = 0;
		for (const node of layout.nodes) {
			if (!layout.bands[node.band]?.admitted || node.index < 0 || layout.nodes[node.index] !== node)
				throw new Error('Empty band allocation or invalid compact node address.');
			const taps = shellStencil(layout, node.rho, node.z),
				own = taps.indices.indexOf(node.index);
			maximumNodeWeightError = Math.max(maximumNodeWeightError, Math.abs(1 - (own < 0 ? 0 : taps.weights[own])));
		}
		for (let row = 0; row < layout.rows.length; row++) {
			const z0 = layout.rows[row].z,
				z1 = layout.rows[Math.min(row + 1, layout.rows.length - 1)].z;
			for (const z of [z0, (z0 + z1) / 2])
				for (const rho of [0, 0.001, 1, layout.maximumRho / 2, layout.maximumRho]) {
					const taps = shellStencil(layout, rho, z);
					queries++;
					if (
						taps.indices.some((i) => !Number.isSafeInteger(i) || !layout.nodes[i]) ||
						taps.weights.some((w) => !Number.isFinite(w) || w < 0)
					)
						throw new Error('Invalid admitted stencil.');
					maximumWeightSumError = Math.max(
						maximumWeightSumError,
						Math.abs(1 - taps.weights.reduce((a, b) => a + b, 0)),
					);
				}
		}
		if (maximumNodeWeightError > 1e-10 || maximumWeightSumError > 1e-12)
			throw new Error('Layout bookkeeping failed.');
		let rejected = 0;
		for (const [rho, z] of [
			[-1, 0],
			[layout.maximumRho + 1, 0],
			[0, -1],
			[0, layout.top + 1],
		]) {
			try {
				shellStencil(layout, rho, z);
			} catch {
				rejected++;
			}
		}
		if (rejected !== 4) throw new Error('Unsupported query was admitted.');
		const quantities = legacy.quantities.map((q) => ({
			id: q.id,
			units: q.units,
			absolute: q.absolute,
			cpuGpuRelative: q.cpuGpuRelative,
			reuseRelative: q.reuseRelative,
		}));
		const gates = {
			schema: 'local-sun-current-correctness-gates-v1',
			quantities,
			comparison: {
				channelRule: legacy.comparison.channelRule,
				finite: legacy.comparison.finite,
				negativeTolerance: legacy.comparison.negativeTolerance,
			},
			completeRay: legacy.completeRay,
			temporal: legacy.temporal,
			resources: legacy.resources,
			matrix: {
				...legacy.matrix,
				policyComparisons: ['old/new behavior control', 'same-policy fresh/reused consistency'],
			},
			layout: {...legacy.layout},
			deferredAccuracy: {
				disposition: 'deferred, not passed or a current completion gate',
				quantities: legacy.quantities.map((q) => ({id: q.id, physicalRelative: q.physicalRelative})),
				comparison: legacy.comparison,
				reference: legacy.reference,
			},
		};
		const contract = {
			...control,
			currentGatesSha256: hash(JSON.stringify(gates)),
			layoutSha256: layoutParent.artifactSha256,
			selectionArtifactSha256: selectionParent.artifactSha256,
		};
		const implementation = [];
		for (const name of [
			'p3-contract/freeze.js',
			'p3-contract.json',
			'shell-layout.js',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
		]) {
			const source = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, source);
			const bytes = await readFile(source);
			implementation.push({path: name, sha256: hash(bytes)});
			await run.write('source-' + name.replaceAll('/', '-'), bytes);
		}
		const serializedGates = JSON.stringify(gates);
		await run.write('gates.json', serializedGates);
		await run.write('layout.json', layoutParent.bytes);
		await run.write('contract.json', JSON.stringify(contract, null, '\t'));
		await run.write(
			'provenance.json',
			JSON.stringify(
				{
					parents: [selectionParent, layoutParent, gatesParent].map(({bytes, ...identity}) => identity),
					implementation,
					tools: {node: process.version},
					operation:
						'Retain exact selected layout/numerics and compatible correctness gates; separately disclose deferred accuracy thresholds. Verify compact-node/stencil bookkeeping and explicit coverage rejection. No physical accuracy calculation.',
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'p3-contract-freeze-result-v1',
					nodes: layout.nodes.length,
					bands: layout.bands.length,
					omittedBands: layout.omittedBands.length,
					queries,
					maximumNodeWeightError,
					maximumWeightSumError,
					rejectedUnsupportedQueries: rejected,
					contractSha256: hash(JSON.stringify(contract, null, '\t')),
					gatesSha256: hash(serializedGates),
					claim: 'P3-A contract and CPU topology bookkeeping only; no new cache, image, reuse, physical-error or performance qualification.',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(run.name);
	} catch (error) {
		await run.finish('failed', String(error));
		throw error;
	}
}
await main();
