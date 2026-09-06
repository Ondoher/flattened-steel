import {pathToFileURL} from 'node:url';

const wavelengthsNanometers = [
	375.666666666667, 407, 438.333333333333, 469.666666666667, 501, 532.333333333333, 563.666666666667, 595,
	626.333333333333, 657.666666666667, 689, 720.333333333333, 751.666666666667, 783, 814.333333333333,
];

const solarIrradiance = [
	1.068866666667, 1.729673, 1.862071666667, 2.022063333333, 1.908154, 1.883391, 1.834246666667, 1.76744, 1.65952,
	1.548102333333, 1.45078, 1.340960333333, 1.262433333333, 1.175208, 1.090824,
];

const sunCases = [
	{
		id: 'low-sun-z87',
		solarZenithDegrees: 87,
		solarAltitudeDegrees: 3,
		solarAzimuthDegrees: 0,
	},
	{
		id: 'sun-z41',
		solarZenithDegrees: 41,
		solarAltitudeDegrees: 49,
		solarAzimuthDegrees: 0,
	},
	{
		id: 'sun-z31',
		solarZenithDegrees: 31,
		solarAltitudeDegrees: 59,
		solarAzimuthDegrees: 0,
	},
	{
		id: 'high-sun-z21',
		solarZenithDegrees: 21,
		solarAltitudeDegrees: 69,
		solarAzimuthDegrees: 0,
	},
];

function skyDirectionsForSun(sun) {
	return [
		{id: 'zenith', viewZenithDegrees: 0, viewAzimuthDegrees: 0},
		{
			id: 'solar-axis',
			viewZenithDegrees: sun.solarZenithDegrees,
			viewAzimuthDegrees: 0,
			note: 'direct solar disc is excluded; this is atmospheric radiance on the source axis',
		},
		{
			id: 'circumsolar-zenithward-5deg',
			viewZenithDegrees: Math.max(0, sun.solarZenithDegrees - 5),
			viewAzimuthDegrees: 0,
		},
		{id: 'horizon-sunward', viewZenithDegrees: 87, viewAzimuthDegrees: 0},
		{id: 'horizon-cross-sun', viewZenithDegrees: 87, viewAzimuthDegrees: 90},
		{id: 'horizon-antisunward', viewZenithDegrees: 87, viewAzimuthDegrees: 180},
	];
}

const sharedControls = {
	pathIntervals: 40,
	sourceTransmittanceIntervals: 20,
	incidentAltitudeBins: 48,
};

const currentAlgorithm32Controls = {
	...sharedControls,
	incidentQuadrature: 'algorithm32-source-oriented-fibonacci',
	incidentDirections: 34,
	incidentRotationTurns: 0,
};

const brunetonReferenceControls = {
	...sharedControls,
	incidentQuadrature: 'bruneton-query-oriented-16x32-midpoint',
	incidentDirections: 512,
};

export function generateData() {
	const cases = [];
	for (const sun of sunCases) {
		for (const skyDirection of skyDirectionsForSun(sun)) {
			cases.push({
				id: `${sun.id}--${skyDirection.id}`,
				sunCaseId: sun.id,
				skyDirectionId: skyDirection.id,
				viewZenithDegrees: skyDirection.viewZenithDegrees,
				viewAzimuthDegrees: skyDirection.viewAzimuthDegrees,
				note: skyDirection.note ?? null,
				endpoint: 'top-atmosphere boundary with zero incoming endpoint radiance',
			});
		}
	}
	if (cases.length !== 24) {
		throw new Error(`Expected 24 physical cases; generated ${cases.length}.`);
	}

	return {
		schemaVersion: 4,
		experiment: {
			id: 'E3',
			name: 'Bruneton-Referenced Sky-Ray Direction Characterization',
			question: [
				'How does completed sky-ray output differ from the pinned Bruneton',
				'16 by 32 incident-direction benchmark as Algorithm32 Fibonacci',
				'direction count increases through the practical 4-to-68 cost',
				'envelope, and where does the current count 34 lie on that curve?',
			].join(' '),
		},
		generation: {
			method: 'deterministic Cartesian physical matrix',
			physicalCaseCount: cases.length,
			pairedComparison: [
				'Every candidate and reference receives the same atmosphere, distant',
				'Sun, observer, view ray to the top-atmosphere boundary, non-angular',
				'numerical controls, spectral basis, and display mapping. Only the',
				'incident angular quadrature differs.',
			].join(' '),
		},
		spectralBasis: {
			channelCount: wavelengthsNanometers.length,
			supportNanometers: [360, 830],
			binWidthNanometers: 31.333333333333332,
			wavelengthsNanometers,
			solarIrradiance,
			sampleMeaning: 'centered samples representing contiguous spectral bins',
		},
		physicalDataTypes: {
			sourcePosition: 'solar direction',
			viewDirection: 'observer sky-ray direction',
			distance: 'derived distance from observer to top-atmosphere boundary',
			atmosphereExtinction: 'spectral extinction coefficient',
			transmittance: 'dimensionless spectral transmittance',
			pathRadiance: 'spectral-radiance density',
			displayedColour: 'continuous clamped linear-display sRGB',
		},
		atmosphere: {
			geometry: 'spherical Earth atmosphere; ground observer and upward sky rays terminating at top atmosphere',
			bottomRadiusMeters: 6_360_000,
			topRadiusMeters: 6_420_000,
			observerHeightMeters: 2,
			rayleighScaleHeightMeters: 8_000,
			mieScaleHeightMeters: 1_200,
			rayleighCoefficientScale: 1.24062e-6,
			mieAngstromAlpha: 0.8,
			mieAngstromBeta: 0.04,
			mieSingleScatteringAlbedo: 0.8,
			miePhaseAsymmetry: 0.7,
			ozoneAbsorption: 0,
			groundCoupling: false,
		},
		displayMapping: {
			cieDataset: 'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv',
			cieObserver: 'CIE 1931 2 degree',
			cieInterpolation: 'linear at each canonical wavelength',
			spectralIntegration: 'sum CMF(lambda_i) * L_i * 31.333333333333332 nm',
			luminousEfficacyLumensPerWatt: 683,
			xyzToLinearSrgbMatrix: [
				[3.2406, -1.5372, -0.4986],
				[-0.9689, 1.8758, 0.0415],
				[0.0557, -0.204, 1.057],
			],
			negativePolicy: 'clamp each negative linear-sRGB channel to zero',
			exposureAndToneMap: '1 - exp(-max(0, linearSrgb) / (5 * 683))',
			outputClamp: [0, 1],
			transferFunction: 'none before the E2 continuous display comparison',
			scope: 'retained Bruneton Figure 1 first-release comparison display',
		},
		displayDifferenceDiagnostics: {
			visibilityBoundaryDeltaEItp: 1,
			acceptableAccuracyBoundaryDeltaEItp: 3,
			displayTransformUncertaintyDeltaEItp: 1.485163121927885e-10,
			referenceUncertaintyDeltaEItp: 0,
			interpretation: [
				'Delta E ITP is reported as a common display-difference scale. The',
				'below-1 potential-visibility and below-3 reference-display accuracy',
				'values are diagnostics, not an automatic atmospheric-model validity',
				'gate. A visible model difference is not by itself a physically wrong',
				'sky result.',
			].join(' '),
			authorityScope: [
				'ITU-R BT.2124-0 Annex 4 says below 3 Delta E ITP may be acceptable',
				'for reference-display accuracy and that application needs vary; it',
				'does not define acceptable physical-model error',
			].join(' '),
		},
		referenceQuadrature: {
			...brunetonReferenceControls,
			id: 'bruneton-compute-scattering-density-16x32-midpoint-34f14e745cff-v1',
			polarSampleCount: 16,
			azimuthSampleCount: 32,
			solidAngleWeight: 'sin(theta) * (pi / 16) * (pi / 16)',
			normalization: 'published midpoint weights are not renormalized',
			frame: 'query-oriented local frame with local zenith as +z and outgoing direction in the x/z plane',
			source: {
				author: 'Eric Bruneton',
				repository: 'https://github.com/ebruneton/precomputed_atmospheric_scattering',
				commit: '34f14e745cff948f4ca3157d1b62a445ffa7286f',
				file: 'atmosphere/functions.glsl',
				function: 'ComputeScatteringDensity',
				lines: '1163-1220',
				retainedPath: 'references/downloads/bruneton-precomputed-atmosphere-34f14e7/functions.glsl',
				retainedSha256: 'fae5b16bdd2b5a1d1a8b423c5b76973984eaf9b7514c349fe74b1d44d0c9f498',
				license: 'BSD-3-Clause',
			},
		},
		sharedControls,
		currentAlgorithm32Controls,
		incidentDirectionSearch: {
			fixedControls: {
				...sharedControls,
				incidentQuadrature: 'algorithm32-source-oriented-fibonacci',
				incidentRotationTurns: 0,
			},
			minimumCount: 4,
			maximumCount: 68,
			method: [
				'evaluate every integer in the declared practical envelope because',
				'Fibonacci-lattice error is not monotonic; report accuracy and work',
				'without selecting a count from a post hoc perceptual threshold',
			].join(' '),
		},
		firstReleaseDecisionPolicy: {
			authority: 'project engineering policy informed by the measured curve and qualitative dome comparison',
			maximumProductionDirectionCount: 34,
			rule: 'within the cost-neutral envelope, retain the tested count with the lowest benchmark error',
			interpretation:
				'selects a practical first-release approximation; does not assert perceptual indistinguishability or numerical convergence',
		},
		sunCases,
		skyDirectionRoles: [
			'zenith',
			'solar-axis',
			'circumsolar-zenithward-5deg',
			'horizon-sunward',
			'horizon-cross-sun',
			'horizon-antisunward',
		],
		diagnostics: {
			spectralNorm: 'maximum absolute per-channel difference',
			displayMetric: 'Delta E ITP after the declared common display mapping',
			reportedStatistics: 'mean, median, 95th percentile, and maximum across all declared sky rays',
			costMetric: 'incident-direction count relative to current count 34',
			interpretation: [
				'agreement with the pinned Bruneton-512 benchmark under the declared',
				'sky-query and display boundary; not proof of continuous quadrature',
				'convergence, perceptual indistinguishability, or independent physical',
				'accuracy',
			].join(' '),
		},
		cases,
	};
}

const invokedPath = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invokedPath === import.meta.url) {
	console.log(JSON.stringify(generateData(), null, 2));
}
