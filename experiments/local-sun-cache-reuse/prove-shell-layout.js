import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {createShellLayout, radiusExcess, shellStencil} from './shell-layout.js';
import {checkPath, repositoryRoot, hash} from './run-boundary.js';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

/** Freeze and prove shell topology before evaluating rendered candidates.
 * @returns {Promise<void>} - New immutable contract/proof run.
 */
async function main() {
	const run = await ExperimentRun.create('p3-shell-proof');
	try {
		const parent = await readParent('00018-controls', 'controls.json');
		const acceptance = await readParent('00019-acceptance', 'gates.json');
		const controls = JSON.parse(new TextDecoder().decode(parent.bytes));
		const state = controls.states.find((/** @type {{id:string}} */ s) => s.id === 'flat-0');
		if (!state) throw new Error('Flat 0 control missing.');
		const g = state.geometry;
		/** @type {LocalSunShellLayoutRequest} */
		const request = {
			height: g.sourcePosition.coordinates[2], top: g.topAltitude.value,
			maximumRho: 33378000,
			altitudes: g.cacheAltitudeNodes.map((/** @type {Distance} */ n) => n.value),
			radialFractions: g.cacheRadialNodes.map((/** @type {Distance} */ n) => n.value / g.cacheRadialMaximum.value),
		};
		const layout = createShellLayout(request);
		let maximumNodeWeightError = 0;
		let maximumWeightSumError = 0;
		let queries = 0;
		for (const node of layout.nodes) {
			const tap = shellStencil(layout, node.rho, node.z);
			const own = tap.indices.indexOf(node.index);
			maximumNodeWeightError = Math.max(maximumNodeWeightError, Math.abs(1 - (own < 0 ? 0 : tap.weights[own])));
		}
		for (const row of layout.rows)
			for (const rho of [0, 0.001, 1, 250, 1000, ...row.indices.map(i => layout.nodes[i].rho)]) {
				const tap = shellStencil(layout, rho, row.z);
				queries++;
				maximumWeightSumError = Math.max(maximumWeightSumError, Math.abs(1 - tap.weights.reduce((a, b) => a + b, 0)));
				if(tap.indices.some(i => i < 0 || i >= layout.nodes.length) || tap.weights.some(w => w < 0 || !Number.isFinite(w)))
					throw new Error('Invalid compact address/support.');
			}
		const precision = [0.001, 1, 250, 1000, 1000000].map(rho => {
			const d = request.height - 250;
			const e = radiusExcess(rho, d);
			const recovered = Math.sqrt(e * (2 * d + e));
			return {rho, excess: e, recovered, absoluteRadiusLostOffset: Math.hypot(d,rho) === d,
				errorMeters: Math.abs(recovered-rho), fp32ExcessPositive: Math.fround(e)>0};
		});
		if(maximumNodeWeightError > 1e-10 || maximumWeightSumError > 1e-12 || precision.some(p => p.errorMeters>0.01 || !p.fp32ExcessPositive))
			throw new Error('Shell topology/precision proof failed.');
		const gates = JSON.parse(new TextDecoder().decode(acceptance.bytes));
		gates.schema = 'local-sun-shell-layout-gates-v1';
		gates.parent = {run: acceptance.run, artifact: acceptance.artifact, sha256: acceptance.artifactSha256};
		gates.matrix.spatial = 'All compact shell nodes and cross-shell/altitude cell interiors; curved support, axis approaches, shell seams, ground/top/cylinder edges; independent sentinels retain pinned physical XYZ queries.';
		gates.reference.spatialLevels = 'Independent old-grid rho/z product grid refined twice; fixed physical cylinder R=33378000m, unchanged slab; candidate topology is never the reference grid.';
		gates.layout = {sourceHeightMeters: request.height, atmosphereTopMeters: request.top, maximumRhoMeters: request.maximumRho,
			axisContinuityAbsolute: 1e-12, axisContinuityRelative: 0.0001,
			omission: 'Equivalent occupied samples and equations; no missing/tangent support, no clamp or redirected skipped addresses.',
			coordinate: 'Euclidean radius excess at each row axis; rho retained as physical ingress, never recovered from rounded absolute r.',
			placement: 'Physical cylinder and source-amplitude domain fixed in source-relative coordinates; placement-independent claims need fresh/reused proofs.'};
		const implementation = [];
		for (const name of ['shell-layout.js','prove-shell-layout.js','types.d.ts']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',name);
			await checkPath(repositoryRoot,target);
			implementation.push({path: name, sha256: hash(await readFile(target))});
		}
		await run.write('request.json',JSON.stringify(request,null,'\t'));
		await run.write('layout.json',JSON.stringify(layout,null,'\t'));
		await run.write('gates.json',JSON.stringify(gates,null,'\t'));
		await run.write('result.json',JSON.stringify({schema:'shell-topology-proof-v1',queries,maximumNodeWeightError,maximumWeightSumError,precision,
			bands:layout.bands.length,omittedBands:layout.omittedBands,compactSamples:layout.nodes.length,
			oneOutgoingFieldBytes:layout.nodes.length*4374*15*4,
			limits:'CPU topology and excess arithmetic only; GPU interpolation, rendering, physical accuracy, omission equivalence and resource admission remain open.'},null,'\t'));
		await run.write('provenance.json',JSON.stringify({parents:[{...parent,bytes:undefined},{...acceptance,bytes:undefined}],
			implementation,operation:'source-centered shell intersections with slab and fixed finite cylinder; explicit row-axis/outer support; compact per-altitude rows; CPU weight and stable-excess inverse checks',
			parameters:request,tools:{node:process.version}},null,'\t'));
		await run.finish('accepted');
		console.log(run.name);
	} catch(error) {
		await run.finish('failed',error instanceof Error ? error.message : String(error));
		throw error;
	}
}
await main();
