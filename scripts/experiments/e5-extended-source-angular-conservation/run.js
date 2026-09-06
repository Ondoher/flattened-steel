import {pathToFileURL} from 'node:url';

export const EXPERIMENT = 'E5';
export const NAME = 'Extended-Source Angular Conservation';
export const QUESTION = [
	'What angular-integration relationship conserves extended spectral radiance',
	'over ordinary and cosine-projected solid angle?',
].join(' ');

export const CHANNEL_COUNT = 15;
const ROUNDING_SAFETY_FACTOR = 16;

const packet = (factory) => Object.freeze(Array.from({length: CHANNEL_COUNT}, (_, channel) => factory(channel)));

export const BASE_RADIANCE = packet((channel) => (0.75 + (channel + 1) * 0.4 + ((channel * 7) % 5) * 0.11) * 1e-5);

export const CASES = Object.freeze([
	Object.freeze({
		id: 'uniform-spherical-cap',
		description: 'A fully visible, wide uniform spherical cap.',
		profile: 'uniform',
		angularRadiusRadians: 0.7,
		radialBands: 12,
		azimuthSamples: 24,
		onRasterAzimuthSamples: 24,
		compareOrdinary: true,
		compareProjected: true,
	}),
	Object.freeze({
		id: 'uniform-angular-disk',
		description: 'A fully visible uniform angular disk.',
		profile: 'uniform',
		angularRadiusRadians: 0.08,
		radialBands: 8,
		azimuthSamples: 20,
		onRasterAzimuthSamples: 20,
		compareOrdinary: true,
		compareProjected: true,
	}),
	Object.freeze({
		id: 'normalized-linear-limb-profile',
		description: 'A projected-flux-normalized linear limb-darkening profile.',
		profile: 'linear-limb',
		angularRadiusRadians: 0.00465,
		limbCoefficient: 0.6,
		radialBands: 32,
		azimuthSamples: 16,
		onRasterAzimuthSamples: 16,
		compareOrdinary: false,
		compareProjected: true,
	}),
	Object.freeze({
		id: 'clipped-support',
		description: 'Three eighths of a uniform cap remain on raster.',
		profile: 'uniform',
		angularRadiusRadians: 0.14,
		radialBands: 10,
		azimuthSamples: 8,
		onRasterAzimuthSamples: 3,
		compareOrdinary: true,
		compareProjected: true,
	}),
	Object.freeze({
		id: 'fully-off-raster',
		description: 'The complete uniform cap lies off raster.',
		profile: 'uniform',
		angularRadiusRadians: 0.11,
		radialBands: 6,
		azimuthSamples: 12,
		onRasterAzimuthSamples: 0,
		compareOrdinary: true,
		compareProjected: true,
	}),
	Object.freeze({
		id: 'resolved-small-angle',
		description: 'A small uniform disk represented by many directional samples.',
		profile: 'uniform',
		angularRadiusRadians: 1e-5,
		radialBands: 8,
		azimuthSamples: 16,
		onRasterAzimuthSamples: 16,
		compareOrdinary: true,
		compareProjected: true,
	}),
	Object.freeze({
		id: 'collapsed-small-angle',
		description: 'The same small uniform disk collapsed to one angular sample.',
		profile: 'collapsed-uniform',
		angularRadiusRadians: 1e-5,
		radialBands: 1,
		azimuthSamples: 1,
		onRasterAzimuthSamples: 1,
		compareOrdinary: true,
		compareProjected: true,
	}),
]);

const zeros = () => Array(CHANNEL_COUNT).fill(0);
const scalePacket = (value, scale) => value.map((channel) => channel * scale);

function addPacket(target, addition) {
	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
		target[channel] += addition[channel];
	}
	return target;
}

function assertPacket(name, value) {
	if (!Array.isArray(value) || value.length !== CHANNEL_COUNT) {
		throw new TypeError(`${name} must contain exactly ${CHANNEL_COUNT} channels.`);
	}
	if (value.some((channel) => !Number.isFinite(channel) || channel < 0)) {
		throw new TypeError(`${name} must contain finite nonnegative values.`);
	}
}

export function capSolidAngle(angularRadiusRadians) {
	if (!Number.isFinite(angularRadiusRadians) || angularRadiusRadians <= 0 || angularRadiusRadians >= Math.PI / 2) {
		throw new RangeError('Angular radius must be between zero and pi/2 radians.');
	}
	return 4 * Math.PI * Math.sin(angularRadiusRadians / 2) ** 2;
}

export function projectedCapSolidAngle(angularRadiusRadians) {
	if (!Number.isFinite(angularRadiusRadians) || angularRadiusRadians <= 0 || angularRadiusRadians >= Math.PI / 2) {
		throw new RangeError('Angular radius must be between zero and pi/2 radians.');
	}
	return Math.PI * Math.sin(angularRadiusRadians) ** 2;
}

function assertDescriptor(descriptor) {
	capSolidAngle(descriptor.angularRadiusRadians);
	if (
		!Number.isInteger(descriptor.radialBands) ||
		descriptor.radialBands <= 0 ||
		!Number.isInteger(descriptor.azimuthSamples) ||
		descriptor.azimuthSamples <= 0
	) {
		throw new RangeError('Generator sample counts must be positive integers.');
	}
	if (
		!Number.isInteger(descriptor.onRasterAzimuthSamples) ||
		descriptor.onRasterAzimuthSamples < 0 ||
		descriptor.onRasterAzimuthSamples > descriptor.azimuthSamples
	) {
		throw new RangeError('On-raster azimuth count must lie within the azimuth sample count.');
	}
}

function uniformSamples(descriptor) {
	const omega = capSolidAngle(descriptor.angularRadiusRadians);
	const oneMinusCos = omega / (2 * Math.PI);
	const solidAngleSteradians = omega / (descriptor.radialBands * descriptor.azimuthSamples);
	const samples = [];

	for (let radial = 0; radial < descriptor.radialBands; radial += 1) {
		const projectionCosine = 1 - (oneMinusCos * (radial + 0.5)) / descriptor.radialBands;
		for (let azimuth = 0; azimuth < descriptor.azimuthSamples; azimuth += 1) {
			samples.push(
				Object.freeze({
					radiance: BASE_RADIANCE,
					solidAngleSteradians,
					projectionCosine,
					onRaster: azimuth < descriptor.onRasterAzimuthSamples,
				}),
			);
		}
	}
	return Object.freeze(samples);
}

function averageSqrtOneMinusQ(q0, q1) {
	return ((2 / 3) * ((1 - q0) ** 1.5 - (1 - q1) ** 1.5)) / (q1 - q0);
}

function linearLimbSamples(descriptor) {
	const coefficient = descriptor.limbCoefficient;
	if (!Number.isFinite(coefficient) || coefficient < 0 || coefficient > 1) {
		throw new RangeError('Linear limb coefficient must lie between zero and one.');
	}
	const normalization = 1 / (1 - coefficient / 3);
	const projectedOmega = projectedCapSolidAngle(descriptor.angularRadiusRadians);
	const projectedWeight = projectedOmega / (descriptor.radialBands * descriptor.azimuthSamples);
	const sinRadiusSquared = Math.sin(descriptor.angularRadiusRadians) ** 2;
	const samples = [];

	for (let radial = 0; radial < descriptor.radialBands; radial += 1) {
		const q0 = radial / descriptor.radialBands;
		const q1 = (radial + 1) / descriptor.radialBands;
		const qMidpoint = (q0 + q1) / 2;
		const projectionCosine = Math.sqrt(1 - sinRadiusSquared * qMidpoint);
		const averageMu = averageSqrtOneMinusQ(q0, q1);
		const profileScale = normalization * (1 - coefficient + coefficient * averageMu);
		const radiance = Object.freeze(scalePacket(BASE_RADIANCE, profileScale));
		const solidAngleSteradians = projectedWeight / projectionCosine;

		for (let azimuth = 0; azimuth < descriptor.azimuthSamples; azimuth += 1) {
			samples.push(
				Object.freeze({
					radiance,
					solidAngleSteradians,
					projectionCosine,
					onRaster: azimuth < descriptor.onRasterAzimuthSamples,
				}),
			);
		}
	}
	return Object.freeze(samples);
}

function collapsedUniformSample(descriptor) {
	return Object.freeze([
		Object.freeze({
			radiance: BASE_RADIANCE,
			solidAngleSteradians: capSolidAngle(descriptor.angularRadiusRadians),
			projectionCosine: Math.cos(descriptor.angularRadiusRadians / 2) ** 2,
			onRaster: descriptor.onRasterAzimuthSamples === 1,
		}),
	]);
}

export function generateSamples(descriptor) {
	assertDescriptor(descriptor);
	if (descriptor.profile === 'uniform') return uniformSamples(descriptor);
	if (descriptor.profile === 'linear-limb') return linearLimbSamples(descriptor);
	if (descriptor.profile === 'collapsed-uniform') return collapsedUniformSample(descriptor);
	throw new TypeError(`Unknown angular profile ${descriptor.profile}.`);
}

export function integrateSamples(samples) {
	if (!Array.isArray(samples) || samples.length === 0) {
		throw new TypeError('Angular integration requires at least one sample.');
	}
	const ordinaryOn = zeros();
	const ordinaryOff = zeros();
	const projectedOn = zeros();
	const projectedOff = zeros();

	for (const [index, sample] of samples.entries()) {
		assertPacket(`sample ${index} radiance`, sample.radiance);
		if (!Number.isFinite(sample.solidAngleSteradians) || sample.solidAngleSteradians <= 0) {
			throw new RangeError(`sample ${index} solid angle must be positive.`);
		}
		if (!Number.isFinite(sample.projectionCosine) || sample.projectionCosine < 0 || sample.projectionCosine > 1) {
			throw new RangeError(`sample ${index} projection cosine must lie in [0, 1].`);
		}
		if (typeof sample.onRaster !== 'boolean') {
			throw new TypeError(`sample ${index} requires an on-raster classification.`);
		}

		const ordinary = scalePacket(sample.radiance, sample.solidAngleSteradians);
		const projected = scalePacket(ordinary, sample.projectionCosine);
		addPacket(sample.onRaster ? ordinaryOn : ordinaryOff, ordinary);
		addPacket(sample.onRaster ? projectedOn : projectedOff, projected);
	}

	return Object.freeze({
		ordinaryOn: Object.freeze(ordinaryOn),
		ordinaryOff: Object.freeze(ordinaryOff),
		ordinaryTotal: Object.freeze(addPacket([...ordinaryOn], ordinaryOff)),
		projectedOn: Object.freeze(projectedOn),
		projectedOff: Object.freeze(projectedOff),
		projectedTotal: Object.freeze(addPacket([...projectedOn], projectedOff)),
	});
}

function gamma(operationCount) {
	const product = operationCount * Number.EPSILON;
	if (product >= 1) throw new RangeError('Floating-point operation bound is invalid.');
	return product / (1 - product);
}

function comparePackets(actual, expected, operationCount) {
	assertPacket('actual packet', actual);
	assertPacket('expected packet', expected);
	const relativeBound = ROUNDING_SAFETY_FACTOR * gamma(operationCount);
	let maximumAbsoluteResidual = 0;
	let maximumLimit = 0;
	let accepted = true;

	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
		const residual = Math.abs(actual[channel] - expected[channel]);
		const scale = Math.max(Math.abs(actual[channel]), Math.abs(expected[channel]), Number.MIN_VALUE);
		const limit = scale * relativeBound;
		maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, residual);
		maximumLimit = Math.max(maximumLimit, limit);
		accepted &&= residual <= limit;
	}
	return Object.freeze({maximumAbsoluteResidual, maximumLimit, accepted});
}

function expectedPackets(descriptor) {
	const fraction = descriptor.onRasterAzimuthSamples / descriptor.azimuthSamples;
	const ordinaryFull = scalePacket(BASE_RADIANCE, capSolidAngle(descriptor.angularRadiusRadians));
	const projectedFull = scalePacket(BASE_RADIANCE, projectedCapSolidAngle(descriptor.angularRadiusRadians));
	return Object.freeze({
		fraction,
		ordinaryOn: scalePacket(ordinaryFull, fraction),
		ordinaryOff: scalePacket(ordinaryFull, 1 - fraction),
		ordinaryTotal: ordinaryFull,
		projectedOn: scalePacket(projectedFull, fraction),
		projectedOff: scalePacket(projectedFull, 1 - fraction),
		projectedTotal: projectedFull,
	});
}

export function evaluateCase(descriptor) {
	const samples = generateSamples(descriptor);
	const observed = integrateSamples(samples);
	const expected = expectedPackets(descriptor);
	const operationCount = 6 * samples.length + 12;
	const ordinaryComparisons = descriptor.compareOrdinary
		? Object.freeze({
				on: comparePackets(observed.ordinaryOn, expected.ordinaryOn, operationCount),
				off: comparePackets(observed.ordinaryOff, expected.ordinaryOff, operationCount),
				total: comparePackets(observed.ordinaryTotal, expected.ordinaryTotal, operationCount),
			})
		: null;
	const projectedComparisons = descriptor.compareProjected
		? Object.freeze({
				on: comparePackets(observed.projectedOn, expected.projectedOn, operationCount),
				off: comparePackets(observed.projectedOff, expected.projectedOff, operationCount),
				total: comparePackets(observed.projectedTotal, expected.projectedTotal, operationCount),
			})
		: null;
	const comparisons = [ordinaryComparisons, projectedComparisons]
		.filter(Boolean)
		.flatMap((group) => Object.values(group));

	return Object.freeze({
		id: descriptor.id,
		description: descriptor.description,
		descriptor,
		sampleCount: samples.length,
		samples,
		observed,
		expected,
		ordinaryComparisons,
		projectedComparisons,
		maximumResidual: Math.max(...comparisons.map((item) => item.maximumAbsoluteResidual)),
		maximumLimit: Math.max(...comparisons.map((item) => item.maximumLimit)),
		accepted: comparisons.every((item) => item.accepted),
	});
}

export function runExperiment() {
	const results = CASES.map(evaluateCase);
	const resolved = results.find((result) => result.id === 'resolved-small-angle');
	const collapsed = results.find((result) => result.id === 'collapsed-small-angle');
	const smallAngleOrdinaryComparison = comparePackets(
		collapsed.observed.ordinaryTotal,
		resolved.observed.ordinaryTotal,
		6 * (resolved.sampleCount + collapsed.sampleCount) + 12,
	);
	const smallAngleProjectedComparison = comparePackets(
		collapsed.observed.projectedTotal,
		resolved.observed.projectedTotal,
		6 * (resolved.sampleCount + collapsed.sampleCount) + 12,
	);
	const accepted =
		results.every((result) => result.accepted) &&
		smallAngleOrdinaryComparison.accepted &&
		smallAngleProjectedComparison.accepted;

	return Object.freeze({
		experiment: EXPERIMENT,
		name: NAME,
		question: QUESTION,
		results: Object.freeze(results),
		smallAngleComparison: Object.freeze({
			ordinary: smallAngleOrdinaryComparison,
			projected: smallAngleProjectedComparison,
		}),
		maxima: Object.freeze({
			analyticResidual: Math.max(...results.map((result) => result.maximumResidual)),
			resolvedCollapsedResidual: Math.max(
				smallAngleOrdinaryComparison.maximumAbsoluteResidual,
				smallAngleProjectedComparison.maximumAbsoluteResidual,
			),
		}),
		accepted,
	});
}

const format = (value) => Number(value).toExponential(6);
const comparisonCell = (comparison) =>
	comparison
		? `${format(comparison.total.maximumAbsoluteResidual)} / ${format(comparison.total.maximumLimit)}`
		: 'not tested';

export function renderReport(experimentResult) {
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
					sampleMeaning: 'spectral-radiance-density packet on the adopted canonical basis',
				},
				physicalDataTypes: {
					samplePacket: 'spectral radiance density',
					solidAngleWeight: 'solid angle',
					projectionCosine: 'dimensionless directional projection',
					integratedOrdinaryPacket: 'solid-angle-integrated spectral radiance density',
					integratedProjectedPacket: 'cosine-projected spectral irradiance density',
				},
				formulas: {
					ordinary: 'I_lambda = sum_j(L_lambda_j * DeltaOmega_j)',
					projected: 'E_lambda = sum_j(L_lambda_j * cosTheta_j * DeltaOmega_j)',
					capSolidAngle: 'Omega = 2*pi*(1-cos(alpha))',
					projectedCapSolidAngle: 'Omega_projected = pi*sin(alpha)^2',
					normalizedLinearLimbProfile: [
						'L(mu) = L_base * ((1-u)+u*mu)/(1-u/3)',
						'mu = sqrt(1-(sin(theta)/sin(alpha))^2)',
					],
					rasterAccounting: 'on-raster integral + off-raster integral = full-support integral',
				},
				deterministicGenerators: {
					uniform: 'equal-solid-angle radial bands in cos(theta), crossed with equal azimuth sectors',
					linearLimb: 'equal projected-area annuli using exact annular mean of mu',
					collapsed: 'one sample with full cap solid angle and mean projection cos(alpha/2)^2',
				},
				roundingBound: {
					arithmetic: 'IEEE-754 binary64',
					gamma: 'gamma(n) = n*epsilon/(1-n*epsilon)',
					safetyFactor: ROUNDING_SAFETY_FACTOR,
				},
				baseRadiancePacket: BASE_RADIANCE,
				cases: CASES,
			},
			null,
			2,
		),
		'```',
		'',
		'## Iterations',
		'',
		`Iterations: ${experimentResult.results.length}`,
		'',
		'| iteration | case | samples | on/off support | ordinary residual / limit | projected residual / limit | maximum partition residual | accepted |',
		'| ---: | --- | ---: | --- | --- | --- | ---: | --- |',
	];

	experimentResult.results.forEach((result, index) => {
		const partitionComparisons = [
			result.ordinaryComparisons?.on,
			result.ordinaryComparisons?.off,
			result.projectedComparisons?.on,
			result.projectedComparisons?.off,
		].filter(Boolean);
		const partitionResidual = Math.max(
			...partitionComparisons.map((comparison) => comparison.maximumAbsoluteResidual),
		);
		lines.push(
			[
				`| ${index + 1}`,
				result.id,
				result.sampleCount,
				`${format(result.expected.fraction)} / ${format(1 - result.expected.fraction)}`,
				comparisonCell(result.ordinaryComparisons),
				comparisonCell(result.projectedComparisons),
				format(partitionResidual),
				`${result.accepted ? 'yes' : 'no'} |`,
			].join(' | '),
		);
	});

	lines.push('', '## Resolved/collapsed small-angle comparison', '', '```json');
	lines.push(JSON.stringify(experimentResult.smallAngleComparison, null, 2));
	lines.push('```', '', '## Maximum observed residuals', '', '```json');
	lines.push(JSON.stringify(experimentResult.maxima, null, 2));
	lines.push('```', '', '## Conclusion', '');
	lines.push(
		experimentResult.accepted
			? [
					'Accepted. Extended spectral radiance is conserved by summing',
					'L_lambda_j * DeltaOmega_j for ordinary angular integration and',
					'L_lambda_j * cosTheta_j * DeltaOmega_j for projected integration.',
					'Normalized limb profiles preserve their declared projected integral;',
					'on-raster and off-raster support partition the full result without',
					'renormalization; and resolved and collapsed representations converge',
					'to the same analytic small-angle integral.',
				].join(' ')
			: [
					'Rejected. At least one ordinary, projected, limb-normalization,',
					'raster-partition, or resolved/collapsed criterion failed.',
				].join(' '),
	);

	return `${lines.join('\n')}\n`;
}

const invokedPath = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invokedPath === import.meta.url) {
	const result = runExperiment();
	process.stdout.write(renderReport(result));
	if (!result.accepted) process.exitCode = 1;
}
