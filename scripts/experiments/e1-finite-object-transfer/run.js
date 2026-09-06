const EXPERIMENT = 'E1';
const NAME = 'Finite-Object Atmospheric Transfer';
const QUESTION = [
	'What finite-object invariants and material-boundary requirements follow',
	"from applying Bruneton's channel-wise endpoint-radiance-times-transmittance",
	'plus in-scatter relation to the simplified opaque-matte',
	'boundary?',
].join(' ');

const CHANNEL_COUNT = 15;
const ABSOLUTE_TOLERANCE = 1e-14;
const RELATIVE_TOLERANCE = 1e-12;

const zeros = () => Array(CHANNEL_COUNT).fill(0);
const constant = (value) => Array(CHANNEL_COUNT).fill(value);
const combine = (left, right, leftScale = 1, rightScale = 1) =>
	left.map((value, channel) => leftScale * value + rightScale * right[channel]);
const multiply = (left, right) => left.map((value, channel) => value * right[channel]);

function assertPacket(name, packet) {
	if (!Array.isArray(packet) || packet.length !== CHANNEL_COUNT) {
		throw new Error(`${name} must contain exactly ${CHANNEL_COUNT} channels.`);
	}

	if (packet.some((value) => !Number.isFinite(value))) {
		throw new Error(`${name} must contain only finite numeric values.`);
	}
}

function evaluateTransfer(endpointRadiance, transmittance, pathRadiance) {
	assertPacket('endpointRadiance', endpointRadiance);
	assertPacket('transmittance', transmittance);
	assertPacket('pathRadiance', pathRadiance);

	return endpointRadiance.map((value, channel) => transmittance[channel] * value + pathRadiance[channel]);
}

function beerLambertTransmittance(extinctionPerMeter, distanceMeters) {
	assertPacket('extinctionPerMeter', extinctionPerMeter);
	return extinctionPerMeter.map((extinction) => Math.exp(-extinction * distanceMeters));
}

function comparePackets(actual, expected) {
	assertPacket('actual', actual);
	assertPacket('expected', expected);

	let maximumAbsoluteResidual = 0;
	let maximumRelativeResidual = 0;
	let comparisonScale = 1;

	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
		const absoluteResidual = Math.abs(actual[channel] - expected[channel]);
		const scale = Math.max(Math.abs(expected[channel]), Number.MIN_VALUE);
		const relativeResidual = absoluteResidual / scale;

		maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, absoluteResidual);
		maximumRelativeResidual = Math.max(maximumRelativeResidual, relativeResidual);
		comparisonScale = Math.max(comparisonScale, Math.abs(expected[channel]));
	}

	const limit = ABSOLUTE_TOLERANCE + RELATIVE_TOLERANCE * comparisonScale;

	return {
		maximumAbsoluteResidual,
		maximumRelativeResidual,
		limit,
		accepted: maximumAbsoluteResidual <= limit,
	};
}

const packets = {
	black: zeros(),
	neutral: constant(1),
	redBiased: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 1, 1, 1, 1, 1, 1, 1],
	blueBiased: [1, 1, 1, 1, 1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
	darkForestGreen: [0.02, 0.02, 0.03, 0.05, 0.12, 0.28, 0.42, 0.31, 0.16, 0.08, 0.04, 0.03, 0.02, 0.02, 0.02],
	varyingTransmittance: Array.from(
		{length: CHANNEL_COUNT},
		(_, channel) => 0.15 + (0.8 * channel) / (CHANNEL_COUNT - 1),
	),
	pathRadiance: Array.from({length: CHANNEL_COUNT}, (_, channel) => 0.01 * (channel + 1)),
	extinctionPerMeter: Array.from({length: CHANNEL_COUNT}, (_, channel) => 2e-6 + channel * 4e-7),
	farTransmittance: Array.from({length: CHANNEL_COUNT}, (_, channel) => 0.82 - channel * 0.01),
	farPathRadiance: Array.from({length: CHANNEL_COUNT}, (_, channel) => 0.002 * (channel + 1)),
	nearTransmittance: Array.from({length: CHANNEL_COUNT}, (_, channel) => 0.9 - channel * 0.008),
	nearPathRadiance: Array.from({length: CHANNEL_COUNT}, (_, channel) => 0.003 * (CHANNEL_COUNT - channel)),
};

for (const [name, packet] of Object.entries(packets)) {
	assertPacket(name, packet);
}

const scalarInputs = {
	linearityLeftScale: 0.25,
	linearityRightScale: 1.75,
	beerLambertDistanceMeters: 25_000,
	perturbedChannel: 9,
	perturbation: 3,
};

const iterations = [
	{
		name: 'zero-distance identity',
		inputs: 'endpoint=redBiased; distance=0 m; extinction=extinctionPerMeter; path=zeros',
		evaluate() {
			const transmittance = beerLambertTransmittance(packets.extinctionPerMeter, 0);
			return {
				actual: evaluateTransfer(packets.redBiased, transmittance, zeros()),
				expected: packets.redBiased,
			};
		},
	},
	{
		name: 'black endpoint isolates path radiance',
		inputs: 'endpoint=black; transmittance=varyingTransmittance; path=pathRadiance',
		evaluate() {
			return {
				actual: evaluateTransfer(packets.black, packets.varyingTransmittance, packets.pathRadiance),
				expected: packets.pathRadiance,
			};
		},
	},
	{
		name: 'zero transmittance removes endpoint',
		inputs: 'endpoint=neutral; transmittance=zeros; path=pathRadiance',
		evaluate() {
			return {
				actual: evaluateTransfer(packets.neutral, zeros(), packets.pathRadiance),
				expected: packets.pathRadiance,
			};
		},
	},
	{
		name: 'attenuated endpoint is linear',
		inputs: 'endpoints=blueBiased,redBiased; scales=0.25,1.75; transmittance=varyingTransmittance; path=zeros',
		evaluate() {
			const combinedEndpoint = combine(
				packets.blueBiased,
				packets.redBiased,
				scalarInputs.linearityLeftScale,
				scalarInputs.linearityRightScale,
			);
			const left = evaluateTransfer(combinedEndpoint, packets.varyingTransmittance, zeros());
			const right = combine(
				evaluateTransfer(packets.blueBiased, packets.varyingTransmittance, zeros()),
				evaluateTransfer(packets.redBiased, packets.varyingTransmittance, zeros()),
				scalarInputs.linearityLeftScale,
				scalarInputs.linearityRightScale,
			);
			return {actual: left, expected: right};
		},
	},
	{
		name: 'spectral channels remain independent',
		inputs: 'endpoint=darkForestGreen; changedChannel=9; delta=3; transmittance=varyingTransmittance; path=pathRadiance',
		evaluate() {
			const changedEndpoint = [...packets.darkForestGreen];
			changedEndpoint[scalarInputs.perturbedChannel] += scalarInputs.perturbation;

			const baseline = evaluateTransfer(
				packets.darkForestGreen,
				packets.varyingTransmittance,
				packets.pathRadiance,
			);
			const changed = evaluateTransfer(changedEndpoint, packets.varyingTransmittance, packets.pathRadiance);
			const actualDelta = combine(changed, baseline, 1, -1);
			const expectedDelta = zeros();
			expectedDelta[scalarInputs.perturbedChannel] =
				scalarInputs.perturbation * packets.varyingTransmittance[scalarInputs.perturbedChannel];

			return {actual: actualDelta, expected: expectedDelta};
		},
	},
	{
		name: 'Beer-Lambert transmittance',
		inputs: 'endpoint=neutral; extinction=extinctionPerMeter; distance=25000 m; path=zeros',
		evaluate() {
			const transmittance = beerLambertTransmittance(
				packets.extinctionPerMeter,
				scalarInputs.beerLambertDistanceMeters,
			);
			return {
				actual: evaluateTransfer(packets.neutral, transmittance, zeros()),
				expected: packets.extinctionPerMeter.map((extinction) =>
					Math.exp(-extinction * scalarInputs.beerLambertDistanceMeters),
				),
			};
		},
	},
	{
		name: 'consecutive segments compose',
		inputs: 'endpoint=redBiased; segments=far,near; each segment supplies transmittance and path radiance',
		evaluate() {
			const afterFarSegment = evaluateTransfer(
				packets.redBiased,
				packets.farTransmittance,
				packets.farPathRadiance,
			);
			const actual = evaluateTransfer(afterFarSegment, packets.nearTransmittance, packets.nearPathRadiance);

			const combinedTransmittance = multiply(packets.nearTransmittance, packets.farTransmittance);
			const transportedFarPath = multiply(packets.nearTransmittance, packets.farPathRadiance);
			const combinedPathRadiance = combine(packets.nearPathRadiance, transportedFarPath);
			const expected = combine(multiply(combinedTransmittance, packets.redBiased), combinedPathRadiance);

			return {actual, expected};
		},
	},
];

console.log(`# ${EXPERIMENT} - ${NAME}`);
console.log(`\n## Question\n\n${QUESTION}`);
console.log('\n## Inputs\n\n```json');
console.log(
	JSON.stringify(
		{
			basis: {
				channelCount: CHANNEL_COUNT,
				supportNanometers: [360, 830],
				sampleMeaning: 'contiguous-bin-average spectral-radiance density',
			},
			physicalDataTypes: {
				endpointRadiance: 'spectral-radiance density',
				pathRadiance: 'spectral-radiance density',
				transmittance: 'dimensionless spectral transmittance',
				extinction: 'spectral extinction coefficient',
				distance: 'path length',
			},
			formula: 'L_observed[i] = T[i] * L_endpoint[i] + L_path[i]',
			tolerances: {
				absolute: ABSOLUTE_TOLERANCE,
				relative: RELATIVE_TOLERANCE,
			},
			scalarInputs,
			packets,
		},
		null,
		2,
	),
);
console.log('```');

const results = iterations.map((iteration, index) => {
	const {actual, expected} = iteration.evaluate();
	const comparison = comparePackets(actual, expected);

	return {
		iteration: index + 1,
		case: iteration.name,
		inputs: iteration.inputs,
		maximumAbsoluteResidual: comparison.maximumAbsoluteResidual.toExponential(6),
		maximumRelativeResidual: comparison.maximumRelativeResidual.toExponential(6),
		limit: comparison.limit.toExponential(6),
		accepted: comparison.accepted ? 'yes' : 'no',
	};
});

console.log(`\n## Iterations\n\nIterations: ${results.length}`);
console.log('| iteration | case | inputs | maximum absolute residual | maximum relative residual | limit | accepted |');
console.log('| ---: | --- | --- | ---: | ---: | ---: | --- |');
for (const result of results) {
	console.log(
		[
			`| ${result.iteration}`,
			result.case,
			result.inputs,
			result.maximumAbsoluteResidual,
			result.maximumRelativeResidual,
			result.limit,
			`${result.accepted} |`,
		].join(' | '),
	);
}

const accepted = results.every((result) => result.accepted === 'yes');
const conclusion = accepted
	? [
			'Accepted. The channel-wise finite-transfer relation satisfies the',
			'zero-distance, endpoint-isolation, endpoint-linearity, spectral-channel,',
			'Beer-Lambert, and consecutive-segment invariants using only endpoint',
			'radiance, spectral transmittance, and path radiance. It therefore supports',
			'replacing the RGB band-average proxy with a spectral finite-object boundary.',
		].join(' ')
	: [
			'Rejected. At least one required finite-transfer invariant failed, so the',
			'relation does not yet justify the proposed spectral finite-object boundary.',
		].join(' ');

console.log(`\n## Conclusion\n\n${conclusion}`);

if (!accepted) {
	process.exitCode = 1;
}
