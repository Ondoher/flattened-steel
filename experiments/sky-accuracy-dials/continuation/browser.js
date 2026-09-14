import {runGpuBrowser as runCapture} from '../gpu/browser.js';
import {benchmarkRay, evaluateOrders, integrateDensity, prepareViewPlan, sampleDensity} from '../numerics/view.js';
import {medium} from '../numerics/direct.js';
import {speciesFields} from '../probes/density.mjs';
import {prepareFixedFieldReference, evaluateFixedFieldReference} from './reference/fixed-field.mjs';
import {prepareGroundDensityCapture, evaluateGroundDensityCapture} from './capture/ground.js';
import {prepareAdaptiveCapture, evaluateAdaptiveCapture} from './capture/adaptive.js';

/** Authenticated continuation evaluator; extra reference taps never alter ordinary ray shapes.
 * @param {string} apiUrl - Owned loopback capability.
 * @param {string} compilerUrl - Authenticated unchanged N4 compiler.
 * @returns {Promise<SkyGpuBrowserResult>} Measured GPU capture result.
 */
export async function runGpuBrowser(apiUrl, compilerUrl) {
	/** @type {SkyFixedFieldReferencePlan | null} */ let reference = null;
	/** @type {SkyContinuationCaptureControl | null} */ let selection = null;
	/** @type {SkyGroundDensityPlan | null} */ let ground = null;
	/** @type {SkyAdaptiveCapturePlan | null} */ let adaptive = null;
	/** @type {number[]} */ const referenceIndexes = [];
	/** @type {number[]} */ const groundIndexes = [];
	/** @type {number[]} */ const adaptiveIndexes = [];
	/** @type {SkyGpuBrowserEvaluation} */
	const capability = {
		prepare(buildRequest, scenes, controls, continuation) {
			if (!continuation) throw new Error('Continuation capture requires an explicit registered selection.');
			selection = continuation;
			const normal = prepareViewPlan(buildRequest, scenes, controls);
			if (selection.referenceMode === 'none') return normal;
			if (!['component', 'adaptive'].includes(selection.referenceMode))
				throw new Error('Continuation reference mode is not admitted.');
			const probes = selection.probes.map((probe) => {
				const scene = selection.probeScenes.find((item) => item.time === probe.time);
				if (!scene) throw new Error('Frozen probe scene is absent.');
				return {
					id: probe.probeId,
					time: probe.time,
					gridX: probe.gridX,
					gridY: probe.gridY,
					ray: benchmarkRay(buildRequest.transportSpec, scene, probe.gridX, probe.gridY),
				};
			});
			reference = prepareFixedFieldReference(buildRequest, probes);
			ground = prepareGroundDensityCapture(buildRequest, selection);
			adaptive =
				selection.referenceMode === 'adaptive' ? prepareAdaptiveCapture(buildRequest, scenes, selection) : null;
			const coordinates = [...normal.coordinates];
			const indexes = new Map(coordinates.map((point, index) => [`${point.x}:${point.y}`, index]));
			for (const [
				points,
				target,
			] of /** @type {readonly (readonly [readonly SkyFieldCoordinate[], number[]])[]} */ ([
				[reference.coordinates, referenceIndexes],
				[ground?.coordinates ?? [], groundIndexes],
				[adaptive?.support.coordinates ?? [], adaptiveIndexes],
			]))
				for (const point of points) {
					const key = `${point.x}:${point.y}`;
					let index = indexes.get(key);
					if (index === undefined) {
						index = coordinates.length;
						indexes.set(key, index);
						coordinates.push(point);
					}
					target.push(index);
				}
			return {...normal, coordinates};
		},
		evaluate(buildRequest, plan, channel, pureOrders) {
			if (!selection) throw new Error('Continuation selection was not prepared.');
			const result = evaluateOrders(buildRequest, plan, channel, pureOrders);
			const spec = buildRequest.transportSpec;
			const fields =
				selection.finalFirstOrder === 'factored' ? speciesFields(spec, plan, channel, () => {}) : null;
			if (fields) {
				const group = plan.representations.indexOf('grouped');
				if (group < 0)
					throw new Error('Factored-first-order comparison requires an explicit grouped selector.');
				for (const [viewIndex, view] of plan.views.entries())
					for (const [rayIndex, ray] of view.rays.entries()) {
						const first = integrateDensity(spec, channel, ray, (sample) => {
							const coefficients = medium(spec, channel, sample.altitude);
							return (
								coefficients[1] *
									sampleDensity(fields.rayleighLighting, sample, view.solarInterpolation) +
								coefficients[2] * sampleDensity(fields.mieLighting, sample, view.solarInterpolation)
							);
						});
						const base = (group * plan.views.length + viewIndex) * 4 * plan.rayCount + rayIndex;
						const delta = first - result.values[base];
						for (let order = 0; order < 4; order++) result.values[base + order * plan.rayCount] += delta;
					}
			}
			const operations = adaptive
				? evaluateAdaptiveCapture(
						buildRequest,
						adaptive,
						plan,
						result,
						channel,
						pureOrders.map((field) => Float32Array.from(adaptiveIndexes, (index) => field[index])),
						fields
							? {
									rayleighLighting: Float32Array.from(
										adaptiveIndexes,
										(index) => fields.rayleighLighting[index],
									),
									mieLighting: Float32Array.from(
										adaptiveIndexes,
										(index) => fields.mieLighting[index],
									),
								}
							: null,
					)
				: undefined;
			if (!reference || !reference.channels.includes(channel))
				return operations
					? {
							...result,
							diagnostics: {
								schemaId: 'sky-continuation-channel-diagnostics-v1',
								scope: 'component-probes',
								units: 'W m^-2 sr^-1 nm^-1',
								queryCount: 0,
								preparationEvaluationCount: 0,
								allowancePolicy:
									'No fixed-field component reference at this channel; separately scoped operational comparisons only.',
								evaluationCount: 0,
								probes: [],
								operations,
							},
						}
					: result;
			const local = pureOrders.map((field) => Float32Array.from(referenceIndexes, (index) => field[index]));
			const rayleigh = fields
				? Float32Array.from(referenceIndexes, (index) => fields.rayleighLighting[index])
				: null;
			const mie = fields ? Float32Array.from(referenceIndexes, (index) => fields.mieLighting[index]) : null;
			/** @type {SkyFixedReferenceFirstOrder | undefined} */
			const factored =
				rayleigh && mie
					? {
							id: 'factored',
							density: (sample) => {
								const coefficients = medium(spec, channel, sample.altitude);
								return (
									coefficients[1] * sampleDensity(rayleigh, sample, 'monotone-cubic') +
									coefficients[2] * sampleDensity(mie, sample, 'monotone-cubic')
								);
							},
						}
					: undefined;
			const evaluated = evaluateFixedFieldReference(buildRequest, reference, channel, local, undefined, factored);
			/** @type {SkyContinuationProbeDiagnostic[]} */ const rows = [];
			for (const row of evaluated.rows) {
				const scene = selection.probeScenes.find((item) => item.time === row.time);
				const common = {
					probeId: row.probeId,
					sceneId: scene.id,
					time: row.time,
					gridX: row.gridX,
					gridY: row.gridY,
					order: row.order,
					representationId: row.representation,
				};
				for (const [method, value] of Object.entries(row.methods))
					rows.push({
						...common,
						methodId: method,
						value: value.radianceW,
						errorAllowance: value.columnsConverged ? value.attenuationAllowanceW : null,
						evaluationCount: value.evaluations,
					});
				rows.push({
					...common,
					methodId: 'reference-envelope',
					value: row.referenceW,
					errorAllowance: row.allowanceW,
					evaluationCount: 0,
					limitations: row.limitations,
				});
			}
			return {
				...result,
				diagnostics: {
					schemaId: 'sky-continuation-channel-diagnostics-v1',
					scope: 'component-probes',
					units: 'W m^-2 sr^-1 nm^-1',
					queryCount: reference.uniqueQueryCount,
					preparationEvaluationCount: reference.rays.reduce(
						(sum, ray) => sum + ray.columnEvaluations.gauss + ray.columnEvaluations.simpson,
						0,
					),
					allowancePolicy: `Method rows retain attenuation-only allowances; reference-envelope rows combine integration and attenuation. ${evaluated.allowancePolicy} ${evaluated.scope}`,
					evaluationCount: rows.reduce((sum, row) => sum + row.evaluationCount, 0),
					probes: rows,
					...(operations ? {operations} : {}),
					...(ground
						? {
								groundDensities: evaluateGroundDensityCapture(
									ground,
									pureOrders.map((field) =>
										Float32Array.from(groundIndexes, (index) => field[index]),
									),
									'monotone-cubic',
								),
							}
						: {}),
				},
			};
		},
	};
	return runCapture(apiUrl, compilerUrl, capability);
}
