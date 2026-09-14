import {workingControls} from '../cases.mjs';

/** Build a complete mechanism control without sharing mutable selector arrays.
 * @param {SkyControlInput} [changes] - Explicit construction changes from H.
 * @returns {SkyControlInput} Grouped, cubic, altitude-segmented views 8 and 16.
 */
function controls(changes = {}) {
	return structuredClone({...workingControls, ...changes, representations: ['grouped'], viewIntervals: [8, 16]});
}

/** The complete prospective C3/C4 construction matrix; C0 is unchanged.
 * Every question is qualitative until a separate immutable quantitative prediction
 * is sealed. Split-raw controls preserve the species grouping used by factoring.
 * @type {readonly SkyMechanismCase[]}
 */
export const mechanismCases = [
	{
		id: 'v-raw',
		phase: 'C3',
		controls: controls(),
		finalFirstOrder: 'raw',
		higherRepresentation: 'combined-raw',
		referenceMode: 'adaptive',
		predictionRequired: false,
		hypothesis:
			'At matched total midpoint-evaluation budgets, allocating subdivisions using emission and downstream attenuation responses may reduce fixed-field view error relative to uniform allocation; retain failures.',
	},
	{
		id: 'v-factored',
		phase: 'C3',
		controls: controls(),
		finalFirstOrder: 'factored',
		higherRepresentation: 'combined-raw',
		referenceMode: 'adaptive',
		predictionRequired: false,
		hypothesis:
			'Test the same bounded adaptive allocation after final-J1 density factorization, with unchanged regenerated higher orders and explicit grouped reconstruction.',
	},
	{
		id: 'd48-split',
		phase: 'C3',
		controls: controls(),
		finalFirstOrder: 'raw',
		higherRepresentation: 'split-raw',
		referenceMode: 'component',
		predictionRequired: false,
		hypothesis:
			'At P48, separate raw Rayleigh/Mie higher-order fields and matched regeneration measure species grouping and storage effects before moving density to query locations.',
	},
	{
		id: 'd48-factored',
		phase: 'C3',
		controls: controls(),
		finalFirstOrder: 'raw',
		higherRepresentation: 'factored',
		referenceMode: 'component',
		predictionRequired: false,
		hypothesis:
			'Against P48 split-raw, apply density at transport and view queries to isolate its effect while regenerating J2-J4 and preserving analytic L1.',
	},
	{
		id: 'd55-raw',
		phase: 'C3',
		controls: controls({altitudeCount: 55}),
		finalFirstOrder: 'raw',
		higherRepresentation: 'combined-raw',
		referenceMode: 'component',
		predictionRequired: false,
		hypothesis:
			'Measure the P48-to-P55 response of ordinary combined-raw higher orders under working H integration controls.',
	},
	{
		id: 'd55-split',
		phase: 'C3',
		controls: controls({altitudeCount: 55}),
		finalFirstOrder: 'raw',
		higherRepresentation: 'split-raw',
		referenceMode: 'component',
		predictionRequired: false,
		hypothesis:
			'At P55, repeat the split-raw grouping control with the same species regeneration path used by density factoring.',
	},
	{
		id: 'd55-factored',
		phase: 'C3',
		controls: controls({altitudeCount: 55}),
		finalFirstOrder: 'raw',
		higherRepresentation: 'factored',
		referenceMode: 'component',
		predictionRequired: false,
		hypothesis:
			'Complete the three-representation by two-altitude matrix; test whether query density changes the altitude-refinement response after controlling species grouping.',
	},
	{
		id: 'i512-end',
		phase: 'C3',
		controls: controls({
			incoming: {
				kind: 'gauss-legendre-product',
				muCount: 16,
				azimuthCount: 32,
				azimuthPlacement: 'endpoint-aware',
			},
		}),
		finalFirstOrder: 'raw',
		higherRepresentation: 'combined-raw',
		referenceMode: 'component',
		predictionRequired: false,
		hypothesis:
			'At I512, change azimuth placement without changing count or positive weights; J1 must remain invariant and J2 is the first potentially affected density.',
	},
	{
		id: 'i512-aspect',
		phase: 'C3',
		controls: controls({incoming: {kind: 'gauss-legendre-product', muCount: 8, azimuthCount: 64}}),
		finalFirstOrder: 'raw',
		higherRepresentation: 'combined-raw',
		referenceMode: 'component',
		predictionRequired: false,
		hypothesis:
			'At I512, trade cosine resolution for azimuth resolution; distinguish sampling distribution from sample count without assuming a Kider improvement.',
	},
	{
		id: 'i2048-end',
		phase: 'C3',
		controls: controls({
			incoming: {
				kind: 'gauss-legendre-product',
				muCount: 32,
				azimuthCount: 64,
				azimuthPlacement: 'endpoint-aware',
			},
		}),
		finalFirstOrder: 'raw',
		higherRepresentation: 'combined-raw',
		referenceMode: 'component',
		predictionRequired: false,
		hypothesis:
			'Measure the finer endpoint-aware incoming response under working H spatial and path controls; finite agreement does not establish angular convergence.',
	},
	{
		id: 'j1-higher',
		phase: 'C4',
		controls: controls(),
		finalFirstOrder: 'factored',
		higherRepresentation: 'factored',
		referenceMode: 'component',
		predictionRequired: true,
		hypothesis:
			'Test the sealed additive prediction for final-J1 factoring combined with regenerated higher-order density factoring, retaining the full interaction spectrum.',
	},
	{
		id: 'h-t320',
		phase: 'C4',
		controls: controls({transportIntervals: 320}),
		finalFirstOrder: 'raw',
		higherRepresentation: 'combined-raw',
		referenceMode: 'component',
		predictionRequired: false,
		hypothesis:
			'Provide the exact H-to-T320 factorial vertex, with source80 and all remaining working H controls fixed.',
	},
	{
		id: 'end-t320',
		phase: 'C4',
		controls: controls({
			transportIntervals: 320,
			incoming: {
				kind: 'gauss-legendre-product',
				muCount: 16,
				azimuthCount: 32,
				azimuthPlacement: 'endpoint-aware',
			},
		}),
		finalFirstOrder: 'raw',
		higherRepresentation: 'combined-raw',
		referenceMode: 'component',
		predictionRequired: true,
		hypothesis:
			'Test the sealed additive incoming-placement by transport-refinement prediction; evaluate the joint response before assigning Kider residual effects.',
	},
	{
		id: 'higher-end',
		phase: 'C4',
		controls: controls({
			incoming: {
				kind: 'gauss-legendre-product',
				muCount: 16,
				azimuthCount: 32,
				azimuthPlacement: 'endpoint-aware',
			},
		}),
		finalFirstOrder: 'raw',
		higherRepresentation: 'factored',
		referenceMode: 'component',
		predictionRequired: true,
		hypothesis:
			'Test the sealed additive higher-order density-factorization by incoming-placement prediction with raw final J1 and matched grouped outputs.',
	},
];

/** Reject unknown identities rather than substituting a working control.
 * @param {string} id - Exact prospective mechanism case.
 * @returns {SkyMechanismCase} Complete independent copy of its registration definition.
 */
export function mechanismCase(id) {
	const candidate = mechanismCases.find((item) => item.id === id);
	if (!candidate) throw new RangeError(`Unknown mechanism case: ${id}`);
	return structuredClone(candidate);
}
