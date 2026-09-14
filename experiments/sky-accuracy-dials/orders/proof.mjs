import assert from 'node:assert/strict';
import {identity, readRepository, sha256} from '../io/files.mjs';
import {evaluateOrders, prepareViewPlan} from '../numerics/view.js';
import {evaluateSixOrders} from './view.js';

const productionPath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const kernelsPath = 'experiments/sky-accuracy-dials/orders/kernels.js';

/** Extract a complete named function body while preserving shader string bytes.
 * The copied templates contain no intervening top-level function definitions.
 * @param {string} source @param {string} name @returns {string}
 */
function functionBody(source, name) {
	const normalized = source.replaceAll('\r\n', '\n');
	const start = normalized.indexOf(`function ${name}(`);
	assert.ok(start >= 0, `Missing retained function ${name}`);
	const body = normalized.indexOf('{', start);
	const end = normalized.indexOf('\n}', body);
	// Fragment templates include GLSL main closing braces before the JS close.
	const terminator = normalized.indexOf('\n}`;\n}', body);
	return normalized.slice(body, terminator >= 0 && name.endsWith('Fragment') ? terminator + 7 : end + 2);
}

/** Prove unchanged fragment text and the four-order numerical prefix without GPU work.
 * This is a manufactured arithmetic check; historical captured fields are checked
 * separately by the run's authenticated parent hashes after actual GPU execution.
 * @param {SkyGpuControl} control - Exact parent screen recipe.
 * @returns {SkySixImplementationProof} Retainable source and arithmetic observations.
 */
export function verifyOrderImplementation(control) {
	const production = readRepository(productionPath).toString(),
		kernels = readRepository(kernelsPath).toString();
	const functions = ['directBaseFragment', 'j1Fragment', 'l1Fragment', 'scatterFragment', 'transportFragment'];
	const fragments = functions.map((name) => {
		const original = functionBody(production, name),
			adapted = functionBody(kernels, name);
		assert.equal(adapted, original, `Retained production fragment changed: ${name}`);
		return {name, normalizedBodySha256: sha256(original), equal: true};
	});
	const plan = prepareViewPlan(control.buildRequest, control.scenes, control.controls);
	const pure = Array.from({length: 6}, (_, order) =>
		Float32Array.from(plan.coordinates, (point) =>
			Math.fround(
				(order + 1) *
					1e-9 *
					(1 + point.altitudeIndex / 71) *
					(1 + point.solarIndex / 231) *
					(1 + point.x / 19001),
			),
		),
	);
	const original = evaluateOrders(control.buildRequest, plan, 0, pure.slice(0, 4));
	const candidate = evaluateSixOrders(control.buildRequest, plan, 0, pure);
	let comparisons = 0;
	for (let representation = 0; representation < original.shape.representationCount; representation++)
		for (let view = 0; view < original.shape.viewCount; view++)
			for (let order = 0; order < 4; order++)
				for (let ray = 0; ray < original.shape.rayCount; ray++) {
					const originalIndex =
						((representation * original.shape.viewCount + view) * 4 + order) * original.shape.rayCount +
						ray;
					const candidateIndex =
						((representation * candidate.shape.viewCount + view) * 6 + order) * candidate.shape.rayCount +
						ray;
					assert.equal(
						candidate.values[candidateIndex],
						original.values[originalIndex],
						'Six-order evaluator changed a four-order prefix scalar.',
					);
					comparisons++;
				}
	assert.equal(candidate.shape.orderCount, 6);
	return {
		schemaId: 'sky-six-order-implementation-proof-v1',
		sources: [identity(productionPath), identity(kernelsPath)],
		fragments,
		manufacturedPrefix: {
			comparisons,
			bitExact: true,
			coordinateCount: plan.coordinates.length,
			shape: original.shape,
		},
		scope: 'Source template equality and manufactured CPU prefix; actual GPU parity remains a separate mandatory retained check.',
	};
}
