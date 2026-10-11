import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {radiusExcess, shellStencil} from './shell-layout.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Check positive compact support and Euclidean-radius/altitude moments throughout the clipped mesh.
 * @returns {Promise<void>} - New immutable CPU addressing proof; no GPU or physical-field acceptance.
 */
async function main() {
	const run = await ExperimentRun.create('p3-stencil-proof');
	try {
		const parent = await readParent(process.argv[2], 'layout.json');
		const current = process.argv[3] === '--current-contract';
		const currentParents = current
			? await Promise.all(['contract.json', 'gates.json'].map((file) => readParent(parent.run, file)))
			: [];
		if (
			current &&
			(currentParents[0].artifactSha256 !== '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704' ||
				currentParents[1].artifactSha256 !==
					'c5794fb707b7da7c87713e19ebaf77ae7e3816d6cc72e929958e12a4aa33210d' ||
				parent.artifactSha256 !== 'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864')
		)
			throw new Error('Current topology proof identities changed.');
		/** @type {LocalSunShellLayout} */
		const layout = JSON.parse(new TextDecoder().decode(parent.bytes));
		if (layout.interpolation !== 'euclidean-radius')
			throw new Error('An explicit Euclidean-radius stencil is required.');
		const identities = [];
		for (const name of [
			'prove-shell-stencil.js',
			'shell-layout.js',
			'types.d.ts',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
		]) {
			const target = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, target);
			const bytes = await readFile(target);
			identities.push({path: path.relative(repositoryRoot, target).replaceAll('\\', '/'), sha256: hash(bytes)});
			await run.write('source-' + name, bytes);
		}
		const limits = {weightSum: 1e-12, radiusMomentMeters: 1e-7, altitudeMomentMeters: 1e-7, nodeWeight: 1e-10};
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					parents: [parent, ...currentParents].map(({bytes, ...identity}) => identity),
					identities,
					limits,
					operation:
						'Probe every adjacent altitude-row pair at five interior fractions and radial node/cell/axis/boundary sentinels. Validate nonnegative compact weights, no omitted-band taps, on-node identity and affine Euclidean-radius/altitude moments using stable radius excess.',
					parameters: {
						altitudeFractions: [1e-7, 0.25, 0.5, 0.75, 1 - 1e-7],
						axisRhoMeters: [0, 0.001, 1, 250, 1000],
						boundaryInsetMeters: [0, 0.001, 1],
					},
					tools: {node: process.version},
					command: process.argv.slice(1),
				},
				null,
				'\t',
			),
		);
		let queries = 0,
			maximumRadiusMomentError = 0,
			maximumAltitudeMomentError = 0,
			maximumWeightSumError = 0,
			minimumPositiveWeight = 1,
			maximumNodeWeightError = 0;
		/** Validate one admitted physical query without changing it.
		 * @param {number} rho - Horizontal source-relative distance in meters.
		 * @param {number} z - Physical altitude in meters.
		 * @returns {void} - Throws on invalid support or a failed moment.
		 */
		const probe = (rho, z) => {
			const stencil = shellStencil(layout, rho, z);
			queries++;
			if (
				!stencil.indices.length ||
				stencil.indices.length > 4 ||
				stencil.weights.some((w) => !Number.isFinite(w) || w <= 0) ||
				stencil.indices.some((i) => !layout.nodes[i] || layout.omittedBands.includes(layout.nodes[i].band))
			)
				throw new Error('Invalid or omitted compact support.');
			const sum = stencil.weights.reduce((a, b) => a + b, 0),
				expected = radiusExcess(rho, layout.height - z);
			const radiusMoment = stencil.indices.reduce(
				(value, index, i) =>
					value + stencil.weights[i] * (layout.nodes[index].excess + (z - layout.nodes[index].z)),
				0,
			);
			const altitudeMoment = stencil.indices.reduce(
				(value, index, i) => value + stencil.weights[i] * (layout.nodes[index].z - z),
				0,
			);
			maximumWeightSumError = Math.max(maximumWeightSumError, Math.abs(sum - 1));
			maximumRadiusMomentError = Math.max(maximumRadiusMomentError, Math.abs(radiusMoment - expected));
			maximumAltitudeMomentError = Math.max(maximumAltitudeMomentError, Math.abs(altitudeMoment));
			minimumPositiveWeight = Math.min(minimumPositiveWeight, ...stencil.weights);
		};
		for (const node of layout.nodes) {
			probe(node.rho, node.z);
			const taps = shellStencil(layout, node.rho, node.z),
				own = taps.indices.indexOf(node.index);
			maximumNodeWeightError = Math.max(maximumNodeWeightError, Math.abs(1 - (own < 0 ? 0 : taps.weights[own])));
		}
		for (let row = 0; row < layout.rows.length - 1; row++) {
			const lower = layout.rows[row],
				upper = layout.rows[row + 1];
			const radii = [
				...new Set([...lower.indices, ...upper.indices].map((index) => layout.nodes[index].rho)),
			].sort((a, b) => a - b);
			const radialQueries = [
				0,
				0.001,
				1,
				250,
				1000,
				layout.maximumRho,
				layout.maximumRho - 0.001,
				layout.maximumRho - 1,
				...radii,
				...radii.slice(0, -1).map((value, i) => (value + radii[i + 1]) / 2),
			];
			for (const fraction of [1e-7, 0.25, 0.5, 0.75, 1 - 1e-7])
				for (const rho of radialQueries) probe(rho, lower.z + fraction * (upper.z - lower.z));
		}
		const qualified =
			maximumWeightSumError <= limits.weightSum &&
			maximumRadiusMomentError <= limits.radiusMomentMeters &&
			maximumAltitudeMomentError <= limits.altitudeMomentMeters &&
			maximumNodeWeightError <= limits.nodeWeight;
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'shell-positive-stencil-proof-v1',
					contractSha256: currentParents[0]?.artifactSha256 ?? null,
					gatesSha256: currentParents[1]?.artifactSha256 ?? null,
					queries,
					maximumRadiusMomentError,
					maximumAltitudeMomentError,
					maximumWeightSumError,
					minimumPositiveWeight,
					maximumNodeWeightError,
					qualified,
					claim: 'CPU compact stencil support and affine radius/altitude moments only. GPU precision, physical interpolation accuracy and complete movement rays remain open.',
				},
				null,
				'\t',
			),
		);
		await run.finish(qualified ? 'accepted' : 'rejected');
		console.log(
			JSON.stringify({run: run.name, qualified, queries, maximumRadiusMomentError, maximumAltitudeMomentError}),
		);
	} catch (error) {
		await run.finish('failed', error instanceof Error ? error.stack : String(error));
		throw error;
	}
}
await main();
