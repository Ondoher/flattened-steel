import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

import {
	buildProductionIncidentRadianceCache,
	createProductionAlgorithm32,
} from '../scripts/algorithm32-star/src/production-dome/production-algorithm32.js';
import { sceneById } from '../scripts/algorithm32-star/src/production-dome/figure1-scenes.js';
import {
	buildCpuDistantNOrderCache,
} from '../scripts/algorithm32-star/src/n-order-cache/build-cpu-distant-n-order-cache.js';
import {
	CubedSphereDirectionDomain,
	createSourceAlignedCubedSphereBasis,
} from '../scripts/algorithm32-star/src/n-order-cache/CubedSphereDirectionDomain.js';

import { CanonicalAtmosphere } from '../src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	CANONICAL_SPECTRAL_CHANNELS,
} from '../src/algorithm32/constants/Algorithm32CanonicalData.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	FIBONACCI_34_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../src/algorithm32/domains/index.js';
import { SphericalEarthGeometry } from '../src/algorithm32/geometries/SphericalEarthGeometry.js';
import { DistantSunLightSource } from '../src/algorithm32/light-sources/DistantSunLightSource.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
} from '../src/algorithm32/profiles/index.js';
import WavelengthMath from '../src/algorithm32/utils/WavelengthMath.js';

const SCENE_ID = 'figure1-06h00-z87';
const EXPECTED_STAR_SHA256 =
	'98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a';
const REPORT_PATH = '.tmp/production-star-n1-n2-comparison.json';
const GATES = {
	positionMetersAbsolute: 1e-9,
	directionComponentAbsolute: 1e-14,
	weightAbsolute: 1e-15,
	wavelengthNanometersAbsolute: 1e-12,
	sourceIrradianceAbsolute: 1e-15,
	radiance: { absolute: 1e-16, relative: 1e-12 },
	scatteringDensity: { absolute: 1e-18, relative: 1e-12 },
	cumulativeScatteringDensity: { absolute: 4e-18, relative: 1e-12 },
};
const startedAt = performance.now();

function log(message) {
	const elapsedSeconds = ((performance.now() - startedAt) / 1000).toFixed(1);
	process.stdout.write(`[${elapsedSeconds}s] ${message}\n`);
}

function maximumAbsoluteDifference(left, right) {
	if (left.length !== right.length) {
		throw new RangeError(`Compared arrays differ in length: ${left.length} and ${right.length}.`);
	}
	let maximum = 0;
	let worstIndex = -1;
	for (let index = 0; index < left.length; index += 1) {
		const difference = Math.abs(left[index] - right[index]);
		if (difference > maximum) {
			maximum = difference;
			worstIndex = index;
		}
	}
	return { maximumAbsoluteDifference: maximum, worstIndex };
}

function maximumVectorComponentDifference(left, right) {
	if (left.length !== right.length) {
		throw new RangeError(`Compared vector domains differ in length: ${left.length} and ${right.length}.`);
	}
	let maximum = 0;
	let worstVectorIndex = -1;
	let worstComponentIndex = -1;
	for (let vectorIndex = 0; vectorIndex < left.length; vectorIndex += 1) {
		for (let componentIndex = 0; componentIndex < 3; componentIndex += 1) {
			const difference = Math.abs(
				left[vectorIndex][componentIndex] - right[vectorIndex][componentIndex],
			);
			if (difference > maximum) {
				maximum = difference;
				worstVectorIndex = vectorIndex;
				worstComponentIndex = componentIndex;
			}
		}
	}
	return { maximumAbsoluteDifference: maximum, worstVectorIndex, worstComponentIndex };
}

function createFieldMetrics(label, gate) {
	return {
		label,
		absoluteTolerance: gate.absolute,
		relativeTolerance: gate.relative,
		comparedScalarCount: 0,
		bitExactScalarCount: 0,
		mismatchCount: 0,
		nonFiniteCount: 0,
		maximumAbsoluteError: 0,
		maximumRelativeError: 0,
		sumSquaredAbsoluteError: 0,
		worstAbsolute: null,
		worstRelative: null,
	};
}

function observe(metrics, expected, actual, coordinates) {
	metrics.comparedScalarCount += 1;
	if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
		metrics.nonFiniteCount += 1;
		metrics.mismatchCount += 1;
		return;
	}
	if (expected === actual) metrics.bitExactScalarCount += 1;
	const absoluteError = Math.abs(actual - expected);
	const relativeError = expected === 0
		? (actual === 0 ? 0 : Number.POSITIVE_INFINITY)
		: absoluteError / Math.abs(expected);
	metrics.sumSquaredAbsoluteError += absoluteError * absoluteError;
	if (absoluteError > metrics.maximumAbsoluteError) {
		metrics.maximumAbsoluteError = absoluteError;
		metrics.worstAbsolute = { coordinates, expected, actual, absoluteError, relativeError };
	}
	if (relativeError > metrics.maximumRelativeError) {
		metrics.maximumRelativeError = relativeError;
		metrics.worstRelative = { coordinates, expected, actual, absoluteError, relativeError };
	}
	if (absoluteError > metrics.absoluteTolerance
		&& relativeError > metrics.relativeTolerance) {
		metrics.mismatchCount += 1;
	}
}

function finishMetrics(metrics) {
	const { sumSquaredAbsoluteError, ...reported } = metrics;
	return {
		...reported,
		rmsAbsoluteError: Math.sqrt(
			sumSquaredAbsoluteError / Math.max(metrics.comparedScalarCount, 1),
		),
		passed: metrics.mismatchCount === 0 && metrics.nonFiniteCount === 0,
	};
}

function assertMatchingFieldShape(starField, productionField, label) {
	const star = {
		positionCount: starField.descriptor.positionDomain.count,
		directionCount: starField.descriptor.directionDomain.count,
		wavelengthCount: starField.descriptor.spectralBasis.channelCount,
	};
	const production = {
		positionCount: productionField.descriptor.positionDomain.count,
		directionCount: productionField.descriptor.directionDomain.count,
		wavelengthCount: productionField.descriptor.basis.channelCount,
	};
	if (JSON.stringify(star) !== JSON.stringify(production)) {
		throw new RangeError(`${label} field shapes differ: ${JSON.stringify({ star, production })}.`);
	}
	return star;
}

function compareField(starField, productionField, label, gate) {
	const shape = assertMatchingFieldShape(starField, productionField, label);
	const reader = productionField.createReader();
	const metrics = createFieldMetrics(label, gate);
	for (let positionIndex = 0; positionIndex < shape.positionCount; positionIndex += 1) {
		for (let directionIndex = 0;
			directionIndex < shape.directionCount;
			directionIndex += 1) {
			const starOffset = (
				positionIndex * shape.directionCount + directionIndex
			) * shape.wavelengthCount;
			for (let wavelengthIndex = 0;
				wavelengthIndex < shape.wavelengthCount;
				wavelengthIndex += 1) {
				const productionOffset = directionIndex + shape.directionCount * (
					positionIndex + shape.positionCount * wavelengthIndex
				);
				observe(
					metrics,
					starField.values[starOffset + wavelengthIndex],
					reader.readScalarAtOffset(productionOffset),
					{ positionIndex, directionIndex, wavelengthIndex },
				);
			}
		}
	}
	return finishMetrics(metrics);
}

async function sha256(url) {
	return createHash('sha256').update(await readFile(url)).digest('hex');
}

function createProductionSetup(directionToLight) {
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralChannels: CANONICAL_SPECTRAL_CHANNELS,
	});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: { value: 2, units: 'meters' },
		observerUpDirection: [0, 0, 1],
		directionToSource: directionToLight,
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: { value: 2, units: 'meters' },
		sourceTransmittanceIntervalCount: 20,
	});
	const lightSource = new DistantSunLightSource({
		directionToLight,
		spectralChannels: CANONICAL_SPECTRAL_CHANNELS,
		angularRadius: { value: 0, units: 'radians' },
		cacheAltitudeBinCount: 48,
		cacheDirectionCount: 34,
		cacheBoundaryAltitude: { value: 2, units: 'meters' },
	});
	return { atmosphere, geometry, lightSource };
}

function constructionIdentities(suffix) {
	return {
		source: { id: `parity-source-${SCENE_ID}-${suffix}`, contentHash: `sha256:live-parity-source-${suffix}` },
		atmosphere: { id: `parity-native-atmosphere-${suffix}`, contentHash: `sha256:live-parity-atmosphere-${suffix}` },
		geometry: { id: `parity-native-spherical-geometry-${suffix}`, contentHash: `sha256:live-parity-geometry-${suffix}` },
	};
}

function compareDomains(star, production) {
	const sourceState = production.lightSource.describe();
	const productionFibonacciPhysical = FIBONACCI_34_DIRECTION_DOMAIN.unitVectors.map(
		(cacheDirection) => production.geometry.expressPhysicalScatteringCacheDirection({
			cacheDirection,
			directionDomain: FIBONACCI_34_DIRECTION_DOMAIN,
			sourceState,
		}),
	);
	const productionW27Physical = CUBED_SPHERE_W27_DIRECTION_DOMAIN.unitVectors.map(
		(cacheDirection) => production.geometry.expressPhysicalScatteringCacheDirection({
			cacheDirection,
			directionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN,
			sourceState,
		}),
	);
	const outwardDirection = production.geometry.describe().observerLocalSceneFrame.up;
	const productionPositions = NATIVE_48_POSITION_DOMAIN.nodes.map((node) => {
		const ray = production.geometry.resolveCacheBuildRay({
			coordinateKey: `parity-position:${node.index}`,
			coordinates: [node.index],
			altitudeBinIndex: node.index,
			altitude: node.coordinate,
			incomingDirection: outwardDirection,
		});
		if (ray === null) throw new Error(`Could not reconstruct production position ${node.index}.`);
		return ray.ray.origin.coordinates;
	});
	const productionWavelengths = NATIVE_15_SPECTRAL_BASIS.channels.map(
		(channel) => WavelengthMath.toNanometers(channel.center),
	);
	const comparisons = {
		position: maximumVectorComponentDifference(
			star.domains.positionDomain.nodes.map((node) => node.positionMeters),
			productionPositions,
		),
		fibonacciDirections: maximumVectorComponentDifference(
			star.domains.radianceDirectionDomain.unitVectors,
			productionFibonacciPhysical,
		),
		w27Directions: maximumVectorComponentDifference(
			star.domains.scatteringDirectionDomain.unitVectors,
			productionW27Physical,
		),
		weights: maximumAbsoluteDifference(
			star.domains.radianceDirectionDomain.integrationWeights,
			FIBONACCI_34_DIRECTION_DOMAIN.integrationWeights.values,
		),
		wavelengths: maximumAbsoluteDifference(
			star.domains.spectralBasis.wavelengths,
			productionWavelengths,
		),
	};
	const tolerances = {
		position: GATES.positionMetersAbsolute,
		fibonacciDirections: GATES.directionComponentAbsolute,
		w27Directions: GATES.directionComponentAbsolute,
		weights: GATES.weightAbsolute,
		wavelengths: GATES.wavelengthNanometersAbsolute,
	};
	return Object.fromEntries(Object.entries(comparisons).map(([key, comparison]) => [
		key,
		{
			...comparison,
			tolerance: tolerances[key],
			passed: comparison.maximumAbsoluteDifference <= tolerances[key],
		},
	]));
}

const starSourceUrl = new URL(
	'../scripts/algorithm32-star/src/n-order-cache/build-cpu-distant-n-order-cache.js',
	import.meta.url,
);
const starSourceSha256 = await sha256(starSourceUrl);
if (starSourceSha256 !== EXPECTED_STAR_SHA256) {
	throw new Error(`Star source hash changed: ${starSourceSha256}.`);
}

const scene = sceneById(SCENE_ID);
log(`Building current Star incident cache for ${SCENE_ID}.`);
const starCalculation = createProductionAlgorithm32(scene);
const incidentStartedAt = performance.now();
const starIncident = buildProductionIncidentRadianceCache(starCalculation);
const starIncidentMilliseconds = performance.now() - incidentStartedAt;
const starW27 = new CubedSphereDirectionDomain({
	faceWidth: 27,
	basis: createSourceAlignedCubedSphereBasis(scene.directionToLight),
	id: `live-production-parity-w27-${SCENE_ID}`,
});
log('Building current Star N2 fields.');
const starStartedAt = performance.now();
const starResult = buildCpuDistantNOrderCache({
	calculation: starCalculation,
	builtIncidentCache: starIncident,
	maximumScatteringOrder: 2,
	scatteringOutputDirectionDomain: starW27.descriptor,
	scatteringDirectionCount: 4374,
	transportPathIntervalCount: 40,
	groundBoundary: null,
	onProgress: ({ stage, order }) => log(`Star ${stage} order ${order}.`),
});
const starBuildMilliseconds = performance.now() - starStartedAt;

log('Building production N2 fields.');
const productionN2 = createProductionSetup(scene.directionToLight);
const productionN2StartedAt = performance.now();
const productionN2Result = productionN2.lightSource.buildCpuScatteringCache({
	atmosphere: productionN2.atmosphere,
	geometry: productionN2.geometry,
	profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
	maximumScatteringOrder: 2,
	constructionIdentities: constructionIdentities('n2'),
});
const productionN2BuildMilliseconds = performance.now() - productionN2StartedAt;

log('Building production N1 fields.');
const productionN1 = createProductionSetup(scene.directionToLight);
const productionN1StartedAt = performance.now();
const productionN1Result = productionN1.lightSource.buildCpuScatteringCache({
	atmosphere: productionN1.atmosphere,
	geometry: productionN1.geometry,
	profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
	maximumScatteringOrder: 1,
	constructionIdentities: constructionIdentities('n1'),
});
const productionN1BuildMilliseconds = performance.now() - productionN1StartedAt;

log('Comparing physical domains and source values.');
const domains = compareDomains(starResult, productionN2);
const sourceIrradiance = maximumAbsoluteDifference(
	starCalculation.lightSource.sampleDirectLighting().incidentRadiance,
	productionN2.lightSource.sampleDirectLighting().sourceIrradiance,
);
sourceIrradiance.tolerance = GATES.sourceIrradianceAbsolute;
sourceIrradiance.passed = sourceIrradiance.maximumAbsoluteDifference
	<= GATES.sourceIrradianceAbsolute;

const fields = {};
log('Comparing production N2 J1.');
fields.N2J1 = compareField(
	starResult.pureScatteringDensityByOrder[0],
	productionN2Result.pureScatteringDensityByOrder[0],
	'N2J1',
	GATES.scatteringDensity,
);
log('Comparing production N2 L1.');
fields.N2L1 = compareField(
	starResult.pureRadianceByOrder[0],
	productionN2Result.pureRadianceByOrder[0],
	'N2L1',
	GATES.radiance,
);
log('Comparing production N2 J2.');
fields.N2J2 = compareField(
	starResult.pureScatteringDensityByOrder[1],
	productionN2Result.pureScatteringDensityByOrder[1],
	'N2J2',
	GATES.scatteringDensity,
);
log('Comparing actual production Jthrough2.');
fields.N2Jthrough2 = compareField(
	starResult.cumulativeScatteringDensityByOrder[1],
	productionN2Result.cumulativeScatteringDensity,
	'N2Jthrough2',
	GATES.cumulativeScatteringDensity,
);
log('Comparing production N1 J1.');
fields.N1J1 = compareField(
	starResult.pureScatteringDensityByOrder[0],
	productionN1Result.pureScatteringDensityByOrder[0],
	'N1J1',
	GATES.scatteringDensity,
);
log('Comparing actual production Jthrough1.');
fields.N1Jthrough1 = compareField(
	starResult.cumulativeScatteringDensityByOrder[0],
	productionN1Result.cumulativeScatteringDensity,
	'N1Jthrough1',
	GATES.cumulativeScatteringDensity,
);

const report = {
	schema: 'algorithm32-production-star-live-n1-n2-parity-v1',
	createdAt: new Date().toISOString(),
	scene: {
		id: scene.id,
		directionToLight: scene.directionToLight,
		solarZenithDegrees: scene.solarZenithDegrees,
	},
	starSource: {
		path: 'scripts/algorithm32-star/src/n-order-cache/build-cpu-distant-n-order-cache.js',
		sha256: starSourceSha256,
	},
	contract: {
		profile: 'native production default; not paper comparison',
		ground: 'black',
		starMaximumScatteringOrder: 2,
		productionRequestedOrders: [1, 2],
		positionCount: 48,
		incomingDirectionCount: 34,
		outgoingDirectionCount: 4374,
		wavelengthCount: 15,
		transportIntervalCount: 40,
		packingComparison: 'logical position/direction/wavelength coordinates; raw offsets intentionally differ',
	},
	gates: GATES,
	timingsMilliseconds: {
		starIncident: starIncidentMilliseconds,
		starN2: starBuildMilliseconds,
		productionN2: productionN2BuildMilliseconds,
		productionN1: productionN1BuildMilliseconds,
		total: performance.now() - startedAt,
	},
	domains,
	sourceIrradiance,
	fields,
};
report.passed = Object.values(domains).every((entry) => entry.passed)
	&& sourceIrradiance.passed
	&& Object.values(fields).every((entry) => entry.passed);

await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
log(`Comparison ${report.passed ? 'PASSED' : 'FAILED'}; report: ${REPORT_PATH}.`);
process.stdout.write(`${JSON.stringify({
	passed: report.passed,
	timingsMilliseconds: report.timingsMilliseconds,
	domains: report.domains,
	sourceIrradiance: report.sourceIrradiance,
	fields: Object.fromEntries(Object.entries(report.fields).map(([key, value]) => [
		key,
		{
			comparedScalarCount: value.comparedScalarCount,
			bitExactScalarCount: value.bitExactScalarCount,
			maximumAbsoluteError: value.maximumAbsoluteError,
			maximumRelativeError: value.maximumRelativeError,
			rmsAbsoluteError: value.rmsAbsoluteError,
			mismatchCount: value.mismatchCount,
			passed: value.passed,
		},
	])),
}, null, 2)}\n`);
if (!report.passed) process.exitCode = 1;
