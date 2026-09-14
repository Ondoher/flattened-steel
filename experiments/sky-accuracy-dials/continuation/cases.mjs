/** Working control H; this is a new combination, not a qualified preset.
 * @type {SkyControlInput}
 */
export const workingControls = {
	altitudeCount: 48,
	outgoingWidth: 27,
	incoming: {kind: 'gauss-legendre-product', muCount: 16, azimuthCount: 32},
	sourceIntervals: 80,
	transportIntervals: 160,
	viewRule: 'altitude-segmented',
	viewIntervals: [8, 16],
	solarInterpolations: ['monotone-cubic'],
	representations: ['cumulative', 'grouped', 'analytic-n1', 'frozen-increment-analytic-n1'],
};

/** Ordered finite-N4 reference changes; source/transport return rows use R7.
 * @type {readonly SkyControlInput[]}
 */
const ladder = [
	{},
	{sourceIntervals: 160},
	{transportIntervals: 320},
	{altitudeCount: 55},
	{altitudeCount: 63},
	{outgoingWidth: 39},
	{outgoingWidth: 51},
	{incoming: {kind: 'gauss-legendre-product', muCount: 32, azimuthCount: 64}},
	{incoming: {kind: 'gauss-legendre-product', muCount: 32, azimuthCount: 64, azimuthPlacement: 'endpoint-aware'}},
	{sourceIntervals: 80},
	{transportIntervals: 160},
	{altitudeCount: 55},
];
const questions = [
	'Validate the combined working control and identify component numerical errors.',
	'Measure remaining source integration sensitivity without assuming a Kider improvement.',
	'Measure remaining transport sensitivity after source refinement.',
	'Test the first bottom-interval altitude refinement under finer integration.',
	'Test whether the altitude radiance response diminishes.',
	'Measure outgoing reconstruction sensitivity.',
	'Refine outgoing reconstruction up to the admitted layout ceiling; the ceiling is not convergence.',
	'Measure incoming sensitivity on the finest admitted spatial profile.',
	'Compare endpoint-aware and midpoint azimuth placement at fixed count.',
	'Retest source sensitivity in the final reference background.',
	'Retest transport sensitivity in the final reference background.',
	'Retest altitude sensitivity in the final reference background.',
];

/** Complete named C1/C2 construction identities. @type {readonly SkyContinuationCase[]} */
export const continuationCases = (() => {
	/** @type {SkyContinuationCase[]} */ const cases = [];
	let controls = {...workingControls};
	/** @type {SkyControlInput | null} */ let finest = null;
	for (const [index, change] of ladder.entries()) {
		controls = {...(index >= 8 ? finest : controls), ...change};
		if (index === 7) finest = controls;
		cases.push({
			id: `r${index}`,
			phase: index === 0 ? 'C1' : 'C2',
			controls,
			finalFirstOrder: 'raw',
			hypothesis: questions[index],
		});
	}
	cases.push({
		id: 'h-factored',
		phase: 'C1',
		controls: workingControls,
		finalFirstOrder: 'factored',
		hypothesis:
			'Final-view J1 factorization changes J1 reconstruction while matched J2-J4 remain invariant because L1 evaluates analytic direct density.',
	});
	return cases;
})();

/** Reject an unknown case instead of silently substituting controls.
 * @param {string} id - Exact registered construction identifier.
 * @returns {SkyContinuationCase} Named profile and hypothesis.
 */
export function continuationCase(id) {
	const result = continuationCases.find((item) => item.id === id);
	if (!result) throw new RangeError(`Unknown continuation case: ${id}`);
	return result;
}
