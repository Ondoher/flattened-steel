import {pathToFileURL} from 'node:url';

export const EXPERIMENT = 'E6';
export const NAME = 'Direction-Resolved Extended-Source Transport';
export const QUESTION =
	'What integrated spectrum results from independently applying visibility and atmospheric attenuation to every declared source direction?';
export const CHANNEL_COUNT = 15;

const packet = (f) => Object.freeze(Array.from({length: CHANNEL_COUNT}, (_, i) => f(i)));
const ones = packet(() => 1);
const base = (seed) => packet((i) => (seed + (i + 1) * (0.2 + seed * 0.03)) * 1e-5);
const transmittance = (seed) => packet((i) => Math.max(0.05, 0.98 - seed * 0.08 - i * (0.006 + seed * 0.001)));
const direction = (id, radiance, weight, visibility, T) =>
	Object.freeze({id, radiance, weight, visibility, transmittance: T});

const baselineDirections = Object.freeze([
	direction('a', base(1), 0.1, 1, transmittance(1)),
	direction('b', base(2), 0.2, 0.75, transmittance(2)),
	direction('c', base(3), 0.3, 0.25, transmittance(3)),
	direction('d', base(4), 0.4, 0, transmittance(4)),
]);
const changedDirections = Object.freeze(
	baselineDirections.map((item) =>
		item.id === 'c' ? direction(item.id, item.radiance, item.weight, 0.65, item.transmittance) : item,
	),
);

export const CASES = Object.freeze([
	Object.freeze({
		id: 'fully-visible',
		directions: Object.freeze([
			direction('a', base(1), 0.25, 1, ones),
			direction('b', base(2), 0.35, 1, ones),
			direction('c', base(3), 0.4, 1, ones),
		]),
	}),
	Object.freeze({
		id: 'fully-blocked',
		directions: Object.freeze([direction('a', base(1), 0.25, 0, ones), direction('b', base(2), 0.75, 0, ones)]),
	}),
	Object.freeze({
		id: 'partial-visibility',
		directions: Object.freeze([
			direction('a', base(1), 0.2, 1, ones),
			direction('b', base(2), 0.3, 0.5, ones),
			direction('c', base(3), 0.5, 0.1, ones),
		]),
	}),
	Object.freeze({
		id: 'wavelength-dependent',
		directions: Object.freeze([
			direction('a', base(1), 0.45, 1, transmittance(1)),
			direction('b', base(2), 0.55, 1, transmittance(3)),
		]),
	}),
	Object.freeze({id: 'direction-dependent', directions: baselineDirections}),
	Object.freeze({id: 'permuted', directions: Object.freeze([...baselineDirections].reverse())}),
	Object.freeze({id: 'one-direction-changed', directions: changedDirections}),
]);

const zeros = () => Array(CHANNEL_COUNT).fill(0);
function assertDirection(item) {
	for (const [name, value] of [
		['radiance', item.radiance],
		['transmittance', item.transmittance],
	]) {
		if (!Array.isArray(value) || value.length !== CHANNEL_COUNT || value.some((v) => !Number.isFinite(v)))
			throw new TypeError(`${name} must be a finite 15-channel packet.`);
	}
	if (!(item.weight >= 0) || !(item.visibility >= 0 && item.visibility <= 1))
		throw new RangeError('Weight and visibility are outside their contracts.');
	if (item.transmittance.some((v) => v < 0 || v > 1)) throw new RangeError('Transmittance must lie in [0,1].');
}

export function integrateDirections(directions) {
	const output = zeros();
	for (const item of directions) {
		assertDirection(item);
		for (let i = 0; i < CHANNEL_COUNT; i += 1)
			output[i] += item.radiance[i] * item.transmittance[i] * item.visibility * item.weight;
	}
	return Object.freeze(output);
}

function oracle(directions) {
	return packet((channel) =>
		directions.reduce(
			(sum, item) => sum + item.visibility * item.transmittance[channel] * item.radiance[channel] * item.weight,
			0,
		),
	);
}
function compare(actual, expected, operations) {
	const relativeLimit = (16 * operations * Number.EPSILON) / (1 - operations * Number.EPSILON);
	let residual = 0,
		limit = 0;
	for (let i = 0; i < CHANNEL_COUNT; i += 1) {
		residual = Math.max(residual, Math.abs(actual[i] - expected[i]));
		limit = Math.max(limit, Math.max(Math.abs(actual[i]), Math.abs(expected[i]), Number.MIN_VALUE) * relativeLimit);
	}
	return Object.freeze({maximumResidual: residual, maximumLimit: limit, accepted: residual <= limit});
}
export function evaluateCase(input) {
	const observed = integrateDirections(input.directions);
	const expected = oracle(input.directions);
	const comparison = compare(observed, expected, 6 * input.directions.length + 4);
	return Object.freeze({
		id: input.id,
		directionCount: input.directions.length,
		observed,
		expected,
		comparison,
		accepted: comparison.accepted,
	});
}
export function runExperiment() {
	const results = CASES.map(evaluateCase);
	const baseline = results.find((r) => r.id === 'direction-dependent');
	const permuted = results.find((r) => r.id === 'permuted');
	const changed = results.find((r) => r.id === 'one-direction-changed');
	const permutation = compare(permuted.observed, baseline.observed, 64);
	const changedItem = changedDirections.find((d) => d.id === 'c');
	const priorItem = baselineDirections.find((d) => d.id === 'c');
	const expectedDelta = packet(
		(i) =>
			(changedItem.visibility - priorItem.visibility) *
			priorItem.transmittance[i] *
			priorItem.radiance[i] *
			priorItem.weight,
	);
	const observedDelta = packet((i) => changed.observed[i] - baseline.observed[i]);
	const oneDirectionDelta = compare(observedDelta, expectedDelta, 64);
	return Object.freeze({
		results,
		permutation,
		oneDirectionDelta,
		accepted: results.every((r) => r.accepted) && permutation.accepted && oneDirectionDelta.accepted,
	});
}
const f = (v) => Number(v).toExponential(6);
export function renderReport(run) {
	const lines = [
		`# ${EXPERIMENT} - ${NAME}`,
		'',
		'## Question',
		'',
		QUESTION,
		'',
		'## Inputs',
		'',
		'```json',
		JSON.stringify(
			{
				basis: {
					channelCount: CHANNEL_COUNT,
					data: 'incident spectral-radiance-density packets',
				},
				formula: 'sum_j(visibility_j*T_lambda_j*L_lambda_j*weight_j)',
				cases: CASES,
			},
			null,
			2,
		),
		'```',
		'',
		'## Iterations',
		'',
		`Iterations: ${run.results.length}`,
		'',
		'| iteration | case | directions | maximum residual | limit | accepted |',
		'| ---: | --- | ---: | ---: | ---: | --- |',
	];
	run.results.forEach((r, i) =>
		lines.push(
			`| ${i + 1} | ${r.id} | ${r.directionCount} | ${f(r.comparison.maximumResidual)} | ${f(r.comparison.maximumLimit)} | ${r.accepted ? 'yes' : 'no'} |`,
		),
	);
	lines.push(
		'',
		'## Cross-case invariants',
		'',
		'```json',
		JSON.stringify(
			{
				permutation: run.permutation,
				oneDirectionDelta: run.oneDirectionDelta,
			},
			null,
			2,
		),
		'```',
		'',
		'## Conclusion',
		'',
		run.accepted
			? "Accepted. The integrated spectrum is the channel-wise sum of each direction's incident radiance multiplied by that direction's visibility, spectral transmittance, and integration weight. Direction ordering has no effect, and changing one direction changes the result by exactly that direction's weighted transported contribution."
			: 'Rejected. A direction-resolved transport or cross-case invariant failed.',
	);
	return `${lines.join('\n')}\n`;
}
const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) {
	const run = runExperiment();
	process.stdout.write(renderReport(run));
	if (!run.accepted) process.exitCode = 1;
}
