import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {acceptControls} from '../numerics/profile.js';

/** Select the common retained cumulative Q30/cubic output without changing construction controls.
 * Additional retained outputs are immaterial to this comparison. Canonical defaults
 * admit historical controls that omitted viewRule and cases that omit default outputs.
 * @param {SkyControlInput} input - Declared numerical controls, including any retained output inventory.
 * @returns {SkyControls} Complete controls projected onto the required comparison output.
 */
export function cumulativeQ30Controls(input) {
	const controls = acceptControls(input);
	assert.ok(controls.viewIntervals.includes(30), 'Construction predictions require a retained Q30 output.');
	assert.ok(controls.solarInterpolations.includes('monotone-cubic'), 'Predictions require monotone-cubic output.');
	assert.ok(controls.representations.includes('cumulative'), 'Predictions require cumulative output.');
	return {
		...controls,
		viewIntervals: [30],
		solarInterpolations: ['monotone-cubic'],
		representations: ['cumulative'],
	};
}

/** Admit exactly one construction refinement, holding every other effective control fixed.
 * Product quadrature uses cosine-node resolution for the second-order model and
 * requires proportional azimuth refinement within the same positive rule family
 * and unchanged azimuth placement. A placement intervention is not a count refinement.
 * @param {SkyControlInput} coarseInput - First retained controls.
 * @param {SkyControlInput} mediumInput - Second retained controls.
 * @param {SkyControlInput} targetInput - Proposed future controls.
 * @returns {DialRefinementCounts} The three supported resolutions on the isolated axis.
 */
export function constructionRefinementCounts(coarseInput, mediumInput, targetInput) {
	const coarse = cumulativeQ30Controls(coarseInput),
		medium = cumulativeQ30Controls(mediumInput),
		target = cumulativeQ30Controls(targetInput);
	/** @type {(keyof SkyControls)[]} */
	const keys = /** @type {(keyof SkyControls)[]} */ ([
		...new Set([...Object.keys(coarse), ...Object.keys(medium), ...Object.keys(target)]),
	]);
	const changed = keys.filter(
		(key) => !isDeepStrictEqual(coarse[key], medium[key]) || !isDeepStrictEqual(medium[key], target[key]),
	);
	assert.equal(changed.length, 1, 'A construction prediction must refine exactly one effective control.');
	const axis = changed[0];
	if (axis === 'sourceIntervals' || axis === 'transportIntervals')
		return increasingCounts(coarse[axis], medium[axis], target[axis]);
	assert.equal(axis, 'incoming', 'Only source, transport or product-quadrature refinement is supported.');
	const rules = [coarse.incoming, medium.incoming, target.incoming];
	assert.ok(
		rules.every((rule) => rule.kind === 'gauss-legendre-product'),
		'Incoming refinement must stay within the Gauss-Legendre product family.',
	);
	assert.ok(
		rules.every((rule) => rule.azimuthPlacement === rules[0].azimuthPlacement),
		'Incoming count refinement must preserve azimuth placement.',
	);
	for (let index = 1; index < rules.length; index++) {
		const previous = rules[index - 1],
			next = rules[index];
		assert.equal(
			previous.muCount * next.azimuthCount,
			next.muCount * previous.azimuthCount,
			'Cosine and azimuth resolutions must refine proportionally.',
		);
	}
	return increasingCounts(rules[0].muCount, rules[1].muCount, rules[2].muCount);
}

/** Admit two retained final-view levels and validate the proposed doubled target.
 * Canonical validation keeps quadratic and altitude-segmented count domains distinct.
 * @param {SkyControlInput} input - Controls used for both preceding view levels.
 * @returns {DialRefinementCounts} Supported coarse, medium and future view resolutions.
 */
export function viewRefinementCounts(input) {
	const controls = acceptControls(input);
	assert.ok(controls.solarInterpolations.includes('monotone-cubic'), 'Predictions require monotone-cubic output.');
	assert.ok(controls.representations.includes('cumulative'), 'Predictions require cumulative output.');
	const available = [...controls.viewIntervals].sort((a, b) => a - b);
	assert.equal(available.length, 2, 'A view prediction requires exactly two preceding levels.');
	const [coarse, medium] = available;
	assert.equal(medium, 2 * coarse, 'The preceding view levels must have a twofold refinement.');
	const target = 2 * medium;
	acceptControls({...controls, viewIntervals: [target]});
	return increasingCounts(coarse, medium, target);
}

/** Reject equal, reversed or noninteger resolutions before constructing a predictor.
 * @param {number} coarse - First resolution.
 * @param {number} medium - Second resolution.
 * @param {number} target - Proposed resolution.
 * @returns {DialRefinementCounts} Strictly increasing positive integer counts.
 */
function increasingCounts(coarse, medium, target) {
	assert.ok(
		[coarse, medium, target].every((count) => Number.isSafeInteger(count) && count > 0) &&
			coarse < medium &&
			medium < target,
		'Refinement requires strictly increasing positive integer resolutions.',
	);
	return {coarse, medium, target};
}

/** Exercise valid historical/default selections and rejection of confounded or unsupported predictions.
 * @returns {DialPredictionContractProof} Named successful admission checks for a parent proof runner to retain.
 */
export function runPredictionContractProofs() {
	/** @type {string[]} */ const acceptedCases = [];
	/** @type {string[]} */ const rejectedCases = [];
	/** @param {string} name - Meaning of the positive check. @param {() => void} run - Assertions to execute. @returns {void} */
	function accept(name, run) {
		run();
		acceptedCases.push(name);
	}
	/** @param {string} name - Meaning of the negative check. @param {() => unknown} run - Admission expected to throw. @returns {void} */
	function reject(name, run) {
		assert.throws(run, undefined, name);
		rejectedCases.push(name);
	}
	/** @param {number} muCount - Cosine resolution. @param {number} azimuthCount - Azimuth resolution. @param {SkyAzimuthPlacement} [azimuthPlacement] - Fixed product-rule placement. @returns {SkyControlInput} */
	function product(muCount, azimuthCount, azimuthPlacement) {
		return {incoming: {kind: 'gauss-legendre-product', muCount, azimuthCount, azimuthPlacement}};
	}
	accept('Source 20/40/80 with canonical defaults', () =>
		assert.deepEqual(constructionRefinementCounts({}, {sourceIntervals: 40}, {sourceIntervals: 80}), {
			coarse: 20,
			medium: 40,
			target: 80,
		}),
	);
	accept('Transport 40/80/160 with canonical defaults', () =>
		assert.deepEqual(constructionRefinementCounts({}, {transportIntervals: 80}, {transportIntervals: 160}), {
			coarse: 40,
			medium: 80,
			target: 160,
		}),
	);
	accept('Continuation source 40/80/160 is explicitly admitted', () =>
		assert.deepEqual(
			constructionRefinementCounts({sourceIntervals: 40}, {sourceIntervals: 80}, {sourceIntervals: 160}),
			{
				coarse: 40,
				medium: 80,
				target: 160,
			},
		),
	);
	accept('Continuation transport 80/160/320 is explicitly admitted', () =>
		assert.deepEqual(
			constructionRefinementCounts(
				{transportIntervals: 80},
				{transportIntervals: 160},
				{transportIntervals: 320},
			),
			{
				coarse: 80,
				medium: 160,
				target: 320,
			},
		),
	);
	accept('Incoming I32/I128/I512 uses cosine resolution', () =>
		assert.deepEqual(constructionRefinementCounts(product(4, 8), product(8, 16), product(16, 32)), {
			coarse: 4,
			medium: 8,
			target: 16,
		}),
	);
	accept('Incoming I128/I512/I2048 preserves product aspect ratio', () =>
		assert.deepEqual(constructionRefinementCounts(product(8, 16), product(16, 32), product(32, 64)), {
			coarse: 8,
			medium: 16,
			target: 32,
		}),
	);
	accept('Endpoint-aware I128/I512/I2048 preserves placement and aspect ratio', () =>
		assert.deepEqual(
			constructionRefinementCounts(
				product(8, 16, 'endpoint-aware'),
				product(16, 32, 'endpoint-aware'),
				product(32, 64, 'endpoint-aware'),
			),
			{
				coarse: 8,
				medium: 16,
				target: 32,
			},
		),
	);
	accept('Explicit midpoint is the historical omitted-placement control', () =>
		assert.deepEqual(
			constructionRefinementCounts(
				product(8, 16),
				{...product(8, 16, 'midpoint'), sourceIntervals: 40},
				{...product(8, 16), sourceIntervals: 80},
			),
			{
				coarse: 20,
				medium: 40,
				target: 80,
			},
		),
	);
	accept('Unequal same-family refinement factors remain valid', () =>
		assert.deepEqual(constructionRefinementCounts(product(4, 8), product(8, 16), product(32, 64)), {
			coarse: 4,
			medium: 8,
			target: 32,
		}),
	);
	accept('Fixed nondefault controls and extra retained outputs do not confound a selected comparison', () => {
		/** @type {SkyControlInput} */
		const shared = {altitudeCount: 55, outgoingWidth: 39, transportIntervals: 80, ...product(8, 16)};
		assert.deepEqual(
			constructionRefinementCounts(
				{
					...shared,
					viewIntervals: [60, 30],
					solarInterpolations: ['linear', 'monotone-cubic'],
					representations: ['grouped', 'cumulative'],
				},
				{...shared, sourceIntervals: 40, viewRule: 'quadratic'},
				{...shared, sourceIntervals: 80},
			),
			{coarse: 20, medium: 40, target: 80},
		);
	});
	accept('Historical omitted viewRule canonicalizes to quadratic', () => {
		const input = {viewIntervals: [30, 60]};
		assert.deepEqual(cumulativeQ30Controls(input), cumulativeQ30Controls({...input, viewRule: 'quadratic'}));
		assert.deepEqual(input.viewIntervals, [30, 60]);
	});
	accept('Object property order does not create an incoming change', () =>
		assert.deepEqual(
			constructionRefinementCounts(
				product(8, 16),
				{sourceIntervals: 40, incoming: {azimuthCount: 16, kind: 'gauss-legendre-product', muCount: 8}},
				{sourceIntervals: 80, ...product(8, 16)},
			),
			{coarse: 20, medium: 40, target: 80},
		),
	);
	accept('Quadratic 30/60 predicts supported 120 without reordering the caller selection', () => {
		const input = {viewIntervals: [60, 30]};
		assert.deepEqual(viewRefinementCounts(input), {coarse: 30, medium: 60, target: 120});
		assert.deepEqual(input.viewIntervals, [60, 30]);
	});
	accept('Segmented 1/2 predicts supported 4', () =>
		assert.deepEqual(viewRefinementCounts({viewRule: 'altitude-segmented', viewIntervals: [1, 2]}), {
			coarse: 1,
			medium: 2,
			target: 4,
		}),
	);
	accept('Segmented 2/4 predicts supported 8', () =>
		assert.deepEqual(viewRefinementCounts({viewRule: 'altitude-segmented', viewIntervals: [2, 4]}), {
			coarse: 2,
			medium: 4,
			target: 8,
		}),
	);
	accept('Continuation segmented 4/8 predicts supported 16', () =>
		assert.deepEqual(viewRefinementCounts({viewRule: 'altitude-segmented', viewIntervals: [4, 8]}), {
			coarse: 4,
			medium: 8,
			target: 16,
		}),
	);
	/** @type {readonly SkyControlInput[]} */
	const coupled = [
		{altitudeCount: 51},
		{outgoingWidth: 39},
		{transportIntervals: 80},
		product(8, 16),
		{viewRule: 'altitude-segmented', viewIntervals: [1]},
	];
	for (const intervention of coupled) {
		const label = Object.keys(intervention)[0];
		reject(`Source refinement coupled to ${label} at medium`, () =>
			constructionRefinementCounts({}, {...intervention, sourceIntervals: 40}, {sourceIntervals: 80}),
		);
		reject(`Source refinement coupled to ${label} at target`, () =>
			constructionRefinementCounts({}, {sourceIntervals: 40}, {...intervention, sourceIntervals: 80}),
		);
	}
	reject('Transport refinement coupled to source', () =>
		constructionRefinementCounts({}, {transportIntervals: 80}, {transportIntervals: 160, sourceIntervals: 40}),
	);
	reject('Altitude alone is not a supported count model', () =>
		constructionRefinementCounts({}, {altitudeCount: 51}, {altitudeCount: 55}),
	);
	reject('Incoming refinement mixes F68 and product rules', () =>
		constructionRefinementCounts({}, product(8, 16), product(16, 32)),
	);
	reject('Incoming refinement changes cosine alone', () =>
		constructionRefinementCounts(product(4, 16), product(8, 16), product(16, 16)),
	);
	reject('Incoming target changes product aspect ratio', () =>
		constructionRefinementCounts(product(4, 8), product(8, 16), product(16, 64)),
	);
	reject('Incoming count refinement changes placement at its medium', () =>
		constructionRefinementCounts(product(8, 16), product(16, 32, 'endpoint-aware'), product(32, 64)),
	);
	reject('Incoming count refinement changes placement at its target', () =>
		constructionRefinementCounts(product(8, 16), product(16, 32), product(32, 64, 'endpoint-aware')),
	);
	reject('Incoming refinement is not increasing', () =>
		constructionRefinementCounts(product(16, 32), product(8, 16), product(32, 64)),
	);
	reject('Source refinement repeats its medium count', () =>
		constructionRefinementCounts({}, {sourceIntervals: 40}, {sourceIntervals: 40}),
	);
	reject('Transport refinement is reversed', () =>
		constructionRefinementCounts({transportIntervals: 80}, {}, {transportIntervals: 160}),
	);
	reject('Unchanged controls do not identify a refinement', () => constructionRefinementCounts({}, {}, {}));
	/** @type {readonly SkyControlInput[]} */
	const missingOutput = [{viewIntervals: [60]}, {solarInterpolations: ['linear']}, {representations: ['grouped']}];
	for (const output of missingOutput) {
		const label = Object.keys(output)[0];
		reject(`Construction comparison missing its required ${label}`, () =>
			constructionRefinementCounts(output, {sourceIntervals: 40}, {sourceIntervals: 80}),
		);
	}
	reject('Unsupported construction target count', () =>
		constructionRefinementCounts({}, {sourceIntervals: 80}, {sourceIntervals: 320}),
	);
	reject('Quadratic doubled target 240 is unsupported', () => viewRefinementCounts({viewIntervals: [60, 120]}));
	reject('Segmented doubled target 32 is unsupported', () =>
		viewRefinementCounts({viewRule: 'altitude-segmented', viewIntervals: [8, 16]}),
	);
	reject('View prediction requires two preceding levels', () => viewRefinementCounts({viewIntervals: [30]}));
	reject('View prediction cannot select three preceding levels', () =>
		viewRefinementCounts({viewIntervals: [30, 60, 120]}),
	);
	reject('View prediction cannot skip the middle doubling', () => viewRefinementCounts({viewIntervals: [30, 120]}));
	reject('View prediction requires a cubic output', () =>
		viewRefinementCounts({viewIntervals: [30, 60], solarInterpolations: ['linear']}),
	);
	reject('View prediction requires a cumulative output', () =>
		viewRefinementCounts({viewIntervals: [30, 60], representations: ['grouped']}),
	);
	reject('Canonical selection rejects repeated view levels', () => viewRefinementCounts({viewIntervals: [30, 30]}));
	reject('Canonical selection rejects unsupported construction settings', () =>
		viewRefinementCounts({viewIntervals: [30, 60], altitudeCount: 49}),
	);
	return {checks: acceptedCases.length + rejectedCases.length, acceptedCases, rejectedCases};
}
