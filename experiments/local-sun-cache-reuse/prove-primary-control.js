import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {receiverPrimaryControl} from './native-receiver-primary-control.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS as atmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Validate exact phase-shaped primary fields against an independent dense periodic angular sum.
 * @returns {Promise<void>} - Analytic-model and dark-field calibration; physical transport convergence remains separately required.
 */
async function main() {
	const run = await ExperimentRun.create('p3-phase-cal');
	try {
		const raysParent = await readParent('00337-p3-native-view', 'result.json');
		const recipeParent = await readParent('00218-p3-shell-v3a', 'recipe.json');
		const rays = JSON.parse(raysParent.bytes.toString()), recipe = JSON.parse(recipeParent.bytes.toString());
		const source = recipe.state.geometry.sourcePosition.coordinates, observer = recipe.state.geometry.observerPosition.coordinates;
		const v = source.map((/** @type {number} */ x, /** @type {number} */ i) => x - observer[i]), length = Math.hypot(...v);
		const incoming = v.map((/** @type {number} */ x) => x / length), g = atmosphere.miePhaseFunctionG;
		const phase = /** @param {number} cosine - Physical phase cosine. */ cosine => [3 * (1 + cosine * cosine) / (16 * Math.PI),
			3 * (1 - g * g) * (1 + cosine * cosine) / (8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * cosine) ** 1.5)];
		/** @type {LocalSunNativeWeightedView[]} */
		const synthetic = rays.receiver.map((/** @type {LocalSunNativeWeightedView} */ row) => {
			const [r, m] = phase(row.path.direction.reduce((sum, x, i) => sum + x * incoming[i], 0));
			const orders = [Array.from({length: 15}, (_, c) => (1 + c / 20) * r + (0.25 + c / 60) * m), ...Array.from({length: 3}, () => new Array(15).fill(0))];
			return {...row, orders, total: orders[0]};
		});
		const control = receiverPrimaryControl(synthetic, 16, recipe.state);
		const reference = new Array(15).fill(0);
		for (let first = 0; first < synthetic.length; first += 16) {
			const group = synthetic.slice(first, first + 16), mu = group[0].path.direction[2];
			const mass = group.reduce((sum, row) => sum + row.weight, 0), horizontal = Math.sqrt(1 - mu * mu) * Math.hypot(incoming[0], incoming[1]);
			const means = [0, 0];
			for (let azimuth = 0; azimuth < 4096; azimuth++) {
				const values = phase(mu * incoming[2] + horizontal * Math.cos(2 * Math.PI * azimuth / 4096));
				for (let kind = 0; kind < 2; kind++) means[kind] += values[kind] / 4096;
			}
			for (let c = 0; c < 15; c++) reference[c] += mass * ((1 + c / 20) * means[0] + (0.25 + c / 60) * means[1]);
		}
		const observed = reference.map((_, c) => synthetic.reduce((sum, row) => sum + row.weight * row.orders[0][c], 0) + control.correction[c]);
		const dark = receiverPrimaryControl(synthetic.map(row => ({...row, orders: Array.from({length: 4}, () => new Array(15).fill(0))})), 16, recipe.state);
		const maximumError = Math.max(...observed.map((value, c) => Math.abs(value - reference[c])));
		const qualified = maximumError < 1e-12 && dark.correction.every(value => value === 0) && control.errorBounds.every(value => value >= 0 && value < 1e-12);
		const implementation = [];
		for (const name of ['prove-primary-control.js', 'native-receiver-primary-control.js', 'native-grid-reference.js', 'primary-oracle.js',
			'continuous-reference.js', 'ExperimentRun.js', 'parent-evidence.js', 'run-boundary.js']) {
			const target = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, target);
			const bytes = await readFile(target);
			await run.write('source-' + name, bytes); implementation.push({path: name, sha256: hash(bytes)});
		}
		await run.write('inputs.json', JSON.stringify({parents: [raysParent, recipeParent].map(({bytes, ...identity}) => identity), implementation,
			tools: {node: process.version}, operation: 'Replace raw primary radiance with known nonnegative Rayleigh/Cornette-Shanks mixtures; compare restored model integral to 4096-point periodic sum per polar row, and check dark-field zero. No candidate spectra or new transport.'}, null, '\t'));
		await run.write('result.json', JSON.stringify({reference, observed, maximumError, phaseBounds: control.errorBounds, qualified}, null, '\t'));
		await run.finish(qualified ? 'accepted' : 'rejected'); console.log(JSON.stringify({run: run.name, maximumError, qualified}));
	} catch (error) {await run.finish('failed', String(error)); throw error;}
}
await main();
