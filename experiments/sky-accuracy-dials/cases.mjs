/** Prospectively specified interventions. Unspecified controls retain the pinned baseline.
 * @type {readonly DialCase[]}
 */
export const cases = [
	{
		id: 's40-t80',
		controls: {sourceIntervals: 40, transportIntervals: 80},
		hypothesis:
			'Independently predictable source brightening and transport darkening may approximately add; test the locked sum and complete factorial before assuming cancellation is stable.',
	},
	{
		id: 's80-t160',
		controls: {sourceIntervals: 80, transportIntervals: 160},
		hypothesis:
			'Validate the additive source and transport model at their finer levels and withheld conditions; retain any nonadditive recurrence interaction.',
	},
	{
		id: 'i128-t80',
		controls: {incoming: {kind: 'gauss-legendre-product', muCount: 8, azimuthCount: 16}, transportIntervals: 80},
		hypothesis:
			'Both factors concentrate near the horizon and affect J2 onward. Test their locked additive prediction and measure the omitted interaction.',
	},
	{
		id: 'segmented',
		controls: {viewRule: 'altitude-segmented'},
		hypothesis:
			'Split final integration intervals at cache altitude knots. Test the same second-order prediction from 1/2 to 4 substeps and from 2/4 to 8, retaining any coarse-level failure.',
	},
	{
		id: 'baseline',
		controls: {},
		hypothesis:
			'Reproduce Native48 CPU Q30 and quantify grouping, analytic first-order and solar reconstruction differences on identical recurrence fields.',
	},
	{
		id: 'p51',
		controls: {altitudeCount: 51},
		hypothesis:
			'Known development control: refining only the lowest altitude interval removes much of its positive first-order reconstruction bias. Later-order changes are smaller.',
	},
	{
		id: 'p55',
		controls: {altitudeCount: 55},
		hypothesis:
			'Further retained-node refinement reduces first-order reconstruction bias with diminishing effect; analytic first-order output should be much less sensitive.',
	},
	{
		id: 'p63',
		controls: {altitudeCount: 63},
		hypothesis:
			'Third low-altitude refinement tests prediction from earlier levels and bounds nonmonotone later-order contributions.',
	},
	{
		id: 'w39',
		controls: {outgoingWidth: 39},
		hypothesis:
			'Angular refinement changes cached first-order near sharp phase gradients; the continuous first-order contribution remains invariant.',
	},
	{
		id: 'w51',
		controls: {outgoingWidth: 51},
		hypothesis:
			'A second angular refinement tests convergence at independent, nonnested nodes. No monotone Kider-fit guarantee is assumed.',
	},
	{
		id: 'i32',
		controls: {incoming: {kind: 'gauss-legendre-product', muCount: 4, azimuthCount: 8}},
		hypothesis:
			'Coarse positive product quadrature exposes incoming directional bias; J1 is unchanged and J2 is first affected.',
	},
	{
		id: 'i128',
		controls: {incoming: {kind: 'gauss-legendre-product', muCount: 8, azimuthCount: 16}},
		hypothesis:
			'Product-rule refinement reduces manufactured phase-integration error; actual sky effects begin at J2.',
	},
	{
		id: 'i512',
		controls: {incoming: {kind: 'gauss-legendre-product', muCount: 16, azimuthCount: 32}},
		hypothesis:
			'Higher product-rule resolution tests whether incoming error and Kider response converge; J1 remains invariant.',
	},
	{
		id: 'i2048',
		controls: {incoming: {kind: 'gauss-legendre-product', muCount: 32, azimuthCount: 64}},
		hypothesis:
			'Test whether the previously rotating incoming-direction response reaches a predictable finer regime. Lock the same second-order model from I128/I512 before I2048 executes; preserve J1 invariance and retain a miss without refitting.',
	},
	{
		id: 's40',
		controls: {sourceIntervals: 40},
		hypothesis: 'Finer source optical-depth quadrature changes J1 and its higher-order descendants.',
	},
	{
		id: 's80',
		controls: {sourceIntervals: 80},
		hypothesis:
			'Second source refinement tests the prospectively predicted midpoint/trapezoid convergence scale, allowing grazing-path exceptions.',
	},
	{
		id: 't80',
		controls: {transportIntervals: 80},
		hypothesis: 'Finer recurrence path integration leaves J1 unchanged and changes L1 and J2 onward.',
	},
	{
		id: 't160',
		controls: {transportIntervals: 160},
		hypothesis:
			'Second recurrence refinement tests whether the response converges despite fixed field interpolation.',
	},
	{
		id: 'p51-t80',
		controls: {altitudeCount: 51, transportIntervals: 80},
		hypothesis:
			'The full altitude by transport factorial tests whether path sampling and field interpolation errors interact in higher orders.',
	},
	{
		id: 'w39-i128',
		controls: {outgoingWidth: 39, incoming: {kind: 'gauss-legendre-product', muCount: 8, azimuthCount: 16}},
		hypothesis:
			'The incoming by outgoing factorial tests whether resolving the illumination integral changes sensitivity to directional reconstruction.',
	},
];

/** Resolve one declared case; unknown identifiers fail rather than selecting a fallback.
 * @param {string} id @returns {DialCase}
 */
export function selectCase(id) {
	const result = cases.find((candidate) => candidate.id === id);
	if (!result) throw new RangeError(`Unknown case: ${id}`);
	return result;
}
