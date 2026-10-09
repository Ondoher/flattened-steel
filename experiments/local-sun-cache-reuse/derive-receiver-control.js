import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {receiverPrimaryControl} from './native-receiver-primary-control.js';
import {residual} from './native-spectral-comparison.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Apply a new reference integration operation to immutable, already measured rays.
 * @returns {Promise<void>} - New complete-view derivative with original transport provenance; no reference grids or transport values are regenerated.
 */
async function main() {
	const run = await ExperimentRun.create('p3-receiver-cv');
	try {
		if (process.argv.length !== 3) throw new Error('One complete raw receiver run required.');
		const measuredParent = await readParent(process.argv[2], 'result.json');
		const ingressParent = await readParent(process.argv[2], 'inputs.json');
		const measured = JSON.parse(measuredParent.bytes.toString());
		const ingress = JSON.parse(ingressParent.bytes.toString());
		if (measured.schema !== 'native-complete-view-v1' || measured.receiverPrimaryControl || !ingress.parameters.receiverAzimuth || ingress.parameters.receiverRule !== 'product-native-knots-tail-gauss-v1')
			throw new Error('Unmodified bounded polar-product reference capture required.');
		const recipeIdentity = ingress.parents.find((/** @type {LocalSunParentArtifact} */ parent) => parent.artifact === 'recipe.json');
		if (!recipeIdentity) throw new Error('Captured physical ingress recipe required.');
		const recipeParent = await readParent(recipeIdentity.run, 'recipe.json');
		if (recipeParent.artifactSha256 !== recipeIdentity.artifactSha256) throw new Error('Physical recipe identity changed.');
		const recipe = JSON.parse(recipeParent.bytes.toString());
		const control = receiverPrimaryControl(measured.receiver, ingress.parameters.receiverAzimuth, recipe.state);
		const candidateParent = await readParent(recipeIdentity.run, 'result.json');
		const candidate = JSON.parse(candidateParent.bytes.toString()).results.find((/** @type {{candidate:boolean}} */ row) => row.candidate);
		if (!candidate?.receiver?.diffuseHorizontal?.values) throw new Error('Original measured candidate receiver comparison required.');
		const irradiance = measured.irradiance.map((/** @type {number} */ value, /** @type {number} */ c) => value + control.correction[c]);
		const implementation = [];
		for (const name of ['derive-receiver-control.js', 'native-receiver-primary-control.js', 'native-grid-reference.js',
			'primary-oracle.js', 'continuous-reference.js', 'native-spectral-comparison.js', 'ExperimentRun.js', 'parent-evidence.js', 'run-boundary.js']) {
			const target = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name); await checkPath(repositoryRoot, target);
			const bytes = await readFile(target); await run.write('source-' + name, bytes);
			implementation.push({path: path.relative(repositoryRoot, target).replaceAll('\\', '/'), sha256: hash(bytes)});
		}
		await run.write('inputs.json', JSON.stringify({...ingress,
			parents: [...ingress.parents, ...[measuredParent, ingressParent].map(({bytes, ...identity}) => identity)],
			implementation: [...ingress.implementation, ...implementation], parameters: {...ingress.parameters, primaryControl: true},
			derivation: {operation: control.operation, command: process.argv.slice(1), tools: {node: process.version}}}, null, '\t'));
		await run.write('result.json', JSON.stringify({...measured, receiverPrimaryControl: control,
			irradiance, rawReceiverPhysical: residual(candidate.receiver.diffuseHorizontal.values, irradiance, 1e-9, 0.1),
			qualified: false, claim: 'Reference phase-integration derivative of immutable raw rays. All physical refinement and candidate admission gates remain required.'}, null, '\t'));
		await run.finish('accepted'); console.log(JSON.stringify({run: run.name, parent: process.argv[2], maximumPhaseBound: Math.max(...control.errorBounds)}));
	} catch (error) {await run.finish('failed', String(error)); throw error;}
}
await main();
