import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

import {
	buildProductionIncidentRadianceCache,
	createProductionAlgorithm32,
} from '../scripts/algorithm32-star/src/production-dome/production-algorithm32.js';
import {
	sceneById,
} from '../scripts/algorithm32-star/src/production-dome/figure1-scenes.js';
import {
	buildCpuDistantNOrderCache,
	createLinearAltitudePositionLookupDomain,
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
	createCubedSphereW27DirectionStencil,
	flattenCubedSphereW27NodeIndex,
} from '../src/algorithm32/domains/index.js';
import { SphericalEarthGeometry } from '../src/algorithm32/geometries/SphericalEarthGeometry.js';
import { DistantSunLightSource } from '../src/algorithm32/light-sources/DistantSunLightSource.js';
import { DistantSunScatteringCache } from '../src/algorithm32/light-sources/DistantSunScatteringCache.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
} from '../src/algorithm32/profiles/index.js';
import WavelengthMath from '../src/algorithm32/utils/WavelengthMath.js';

const SCENE_ID = 'figure1-06h00-z87';
const EXPECTED_STAR_SHA256 =
	'98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a';
const REPORT_PATH = '.tmp/production-star-n4-comparison.json';
const GATES = {
	positionMetersAbsolute: 1e-9,
	directionComponentAbsolute: 1e-14,
	weightAbsolute: 1e-15,
	resolvedPositionWeightAbsolute: 1e-15,
	resolvedDirectionWeightAbsolute: 1e-14,
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

function createFieldMetrics(label, absoluteTolerance, relativeTolerance) {
	return {
		label,
		absoluteTolerance,
		relativeTolerance,
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
	const {
		sumSquaredAbsoluteError,
		...reported
	} = metrics;
	return {
		...reported,
		rmsAbsoluteError: Math.sqrt(
			sumSquaredAbsoluteError / Math.max(metrics.comparedScalarCount, 1),
		),
		passed: metrics.mismatchCount === 0 && metrics.nonFiniteCount === 0,
	};
}

function normalize(vector) {
	const length = Math.hypot(...vector);
	return vector.map((component) => component / length);
}

function compareStencil(expected, actual, weightTolerance) {
	const indicesMatch = JSON.stringify(expected.indices) === JSON.stringify(actual.indices);
	const weights = expected.weights.length === actual.weights.length
		? maximumAbsoluteDifference(expected.weights, actual.weights)
		: { maximumAbsoluteDifference: Number.POSITIVE_INFINITY, worstIndex: -1 };
	return {
		expectedIndices: [...expected.indices],
		actualIndices: [...actual.indices],
		indicesMatch,
		expectedWeights: [...expected.weights],
		actualWeights: [...actual.weights],
		maximumWeightAbsoluteDifference: weights.maximumAbsoluteDifference,
		weightTolerance,
		passed: indicesMatch
			&& weights.maximumAbsoluteDifference <= weightTolerance,
	};
}

function compareResidentSampling(starResult, starCalculation, productionResult, production) {
	const starField = starResult.cumulativeScatteringDensityByOrder[3];
	const starPositionLookupDomain = createLinearAltitudePositionLookupDomain(
		starResult.domains.positionDomain,
	);
	const residentCache = new DistantSunScatteringCache(productionResult);
	const productionSourceState = production.lightSource.describe();
	const productionGeometryFacts = production.geometry.describe();
	const bottomRadiusMeters = productionGeometryFacts.bottomRadius.value;
	const up = productionGeometryFacts.observerLocalSceneFrame.up;
	const nodes = NATIVE_48_POSITION_DOMAIN.nodes;
	const exactDirection = CUBED_SPHERE_W27_DIRECTION_DOMAIN.unitVectors[
		flattenCubedSphereW27NodeIndex(0, 13, 13)
	];
	const gridHalfStep = 0.5 / 13;
	const cases = [
		{
			id: 'exact-position-and-direction-node',
			altitudeMeters: nodes[24].coordinate.value,
			cacheDirection: exactDirection,
		},
		{
			id: 'off-grid-altitude-only',
			altitudeMeters: nodes[10].coordinate.value
				+ 0.25 * (nodes[11].coordinate.value - nodes[10].coordinate.value),
			cacheDirection: exactDirection,
		},
		{
			id: 'two-tap-w27-direction',
			altitudeMeters: nodes[10].coordinate.value,
			cacheDirection: normalize([1, 0, gridHalfStep]),
		},
		{
			id: 'two-position-by-four-direction',
			altitudeMeters: nodes[18].coordinate.value
				+ 0.375 * (nodes[19].coordinate.value - nodes[18].coordinate.value),
			cacheDirection: normalize([1, gridHalfStep, gridHalfStep]),
		},
		{
			id: 'w27-face-seam-tie',
			altitudeMeters: nodes[30].coordinate.value
				+ 0.5 * (nodes[31].coordinate.value - nodes[30].coordinate.value),
			cacheDirection: normalize([1, 1, gridHalfStep]),
		},
		{
			id: 'upper-altitude-endpoint-clamp',
			altitudeMeters: nodes[nodes.length - 1].coordinate.value + 1000,
			cacheDirection: normalize([1, gridHalfStep, gridHalfStep]),
		},
	];
	const metrics = createFieldMetrics(
		'resident-Jthrough4-sampling',
		GATES.cumulativeScatteringDensity.absolute,
		GATES.cumulativeScatteringDensity.relative,
	);
	const rows = [];

	for (const query of cases) {
		const radiusMeters = bottomRadiusMeters + query.altitudeMeters;
		const position = {
			coordinates: up.map((component) => component * radiusMeters),
			units: 'meters',
		};
		const physicalOutgoingDirection = production.geometry
			.expressPhysicalScatteringCacheDirection({
				cacheDirection: query.cacheDirection,
				directionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN,
				sourceState: productionSourceState,
			});
		const starPositionStencil = starCalculation.geometry.resolveCachePositionStencil({
			position,
			atmosphereCoordinate: { altitudeMeters: query.altitudeMeters },
			positionDomain: starPositionLookupDomain,
		});
		const productionPositionStencil = production.geometry
			.resolveScatteringCachePositionStencil({
				position,
				atmosphereCoordinate: {
					altitude: { value: query.altitudeMeters, units: 'meters' },
				},
				positionDomain: NATIVE_48_POSITION_DOMAIN,
				sourceState: productionSourceState,
			});
		const starDirectionStencil = starField.directionStencil(physicalOutgoingDirection);
		const productionCacheDirection = production.geometry.expressScatteringCacheDirection({
			position,
			physicalOutgoingDirection,
			outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN,
			sourceState: productionSourceState,
		});
		const productionDirectionStencil = createCubedSphereW27DirectionStencil(
			productionCacheDirection,
		);
		const starValues = starField.sampleWithStencils(
			starPositionStencil,
			starDirectionStencil,
		);
		const productionValues = residentCache.sampleResolved({
			positionStencil: productionPositionStencil,
			directionStencil: productionDirectionStencil,
		}).values;
		for (let wavelengthIndex = 0; wavelengthIndex < starValues.length; wavelengthIndex += 1) {
			observe(
				metrics,
				starValues[wavelengthIndex],
				productionValues[wavelengthIndex],
				{ caseId: query.id, wavelengthIndex },
			);
		}
		rows.push({
			id: query.id,
			altitudeMeters: query.altitudeMeters,
			physicalOutgoingDirection,
			positionStencil: compareStencil(
				starPositionStencil,
				productionPositionStencil,
				GATES.resolvedPositionWeightAbsolute,
			),
			directionStencil: compareStencil(
				starDirectionStencil,
				productionDirectionStencil,
				GATES.resolvedDirectionWeightAbsolute,
			),
		});
	}

	residentCache.dispose();
	const values = finishMetrics(metrics);
	return {
		caseCount: rows.length,
		rows,
		values,
		passed: rows.every((row) => row.positionStencil.passed && row.directionStencil.passed)
			&& values.passed,
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
	const metrics = createFieldMetrics(label, gate.absolute, gate.relative);
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

function compareCumulativePrefix(starField, productionPureFields, label, gate) {
	const shape = assertMatchingFieldShape(starField, productionPureFields[0], label);
	const readers = productionPureFields.map((field) => field.createReader());
	const metrics = createFieldMetrics(label, gate.absolute, gate.relative);
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
				let actual = 0;
				for (const reader of readers) {
					actual += reader.readScalarAtOffset(productionOffset);
				}
				observe(
					metrics,
					starField.values[starOffset + wavelengthIndex],
					actual,
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
	const starWavelengths = star.domains.spectralBasis.wavelengths;
	const position = maximumVectorComponentDifference(
		star.domains.positionDomain.nodes.map((node) => node.positionMeters),
		productionPositions,
	);
	const fibonacciDirections = maximumVectorComponentDifference(
		star.domains.radianceDirectionDomain.unitVectors,
		productionFibonacciPhysical,
	);
	const w27Directions = maximumVectorComponentDifference(
		star.domains.scatteringDirectionDomain.unitVectors,
		productionW27Physical,
	);
	const weights = maximumAbsoluteDifference(
		star.domains.radianceDirectionDomain.integrationWeights,
		FIBONACCI_34_DIRECTION_DOMAIN.integrationWeights.values,
	);
	const wavelengths = maximumAbsoluteDifference(
		starWavelengths,
		productionWavelengths,
	);
	return {
		position: {
			...position,
			tolerance: GATES.positionMetersAbsolute,
			passed: position.maximumAbsoluteDifference <= GATES.positionMetersAbsolute,
		},
		fibonacciDirections: {
			...fibonacciDirections,
			tolerance: GATES.directionComponentAbsolute,
			passed: fibonacciDirections.maximumAbsoluteDifference
				<= GATES.directionComponentAbsolute,
		},
		w27Directions: {
			...w27Directions,
			tolerance: GATES.directionComponentAbsolute,
			passed: w27Directions.maximumAbsoluteDifference
				<= GATES.directionComponentAbsolute,
		},
		weights: {
			...weights,
			tolerance: GATES.weightAbsolute,
			passed: weights.maximumAbsoluteDifference <= GATES.weightAbsolute,
		},
		wavelengths: {
			...wavelengths,
			tolerance: GATES.wavelengthNanometersAbsolute,
			passed: wavelengths.maximumAbsoluteDifference
				<= GATES.wavelengthNanometersAbsolute,
		},
	};
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
log('Building current Star N4 fields.');
const starStartedAt = performance.now();
const starResult = buildCpuDistantNOrderCache({
	calculation: starCalculation,
	builtIncidentCache: starIncident,
	maximumScatteringOrder: 4,
	scatteringOutputDirectionDomain: starW27.descriptor,
	scatteringDirectionCount: 4374,
	transportPathIntervalCount: 40,
	groundBoundary: null,
	onProgress: ({ stage, order }) => log(`Star ${stage} order ${order}.`),
});
const starBuildMilliseconds = performance.now() - starStartedAt;
log('Building production N4 fields.');
const production = createProductionSetup(scene.directionToLight);
const productionStartedAt = performance.now();
const productionResult = production.lightSource.buildCpuScatteringCache({
	atmosphere: production.atmosphere,
	geometry: production.geometry,
	profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
	maximumScatteringOrder: 4,
	constructionIdentities: {
		source: { id: `parity-source-${SCENE_ID}`, contentHash: 'sha256:live-parity-source' },
		atmosphere: { id: 'parity-native-atmosphere', contentHash: 'sha256:live-parity-atmosphere' },
		geometry: { id: 'parity-native-spherical-geometry', contentHash: 'sha256:live-parity-geometry' },
	},
});
const productionBuildMilliseconds = performance.now() - productionStartedAt;

log('Comparing physical domains.');
const domains = compareDomains(starResult, production);
const starSourceIrradiance = starCalculation.lightSource.sampleDirectLighting().incidentRadiance;
const productionSourceIrradiance = production.lightSource.sampleDirectLighting().sourceIrradiance;
const sourceIrradiance = maximumAbsoluteDifference(
	starSourceIrradiance,
	productionSourceIrradiance,
);
sourceIrradiance.tolerance = GATES.sourceIrradianceAbsolute;
sourceIrradiance.passed = sourceIrradiance.maximumAbsoluteDifference
	<= GATES.sourceIrradianceAbsolute;

const fields = {};
for (let order = 1; order <= 4; order += 1) {
	log(`Comparing pure J${order}.`);
	fields[`J${order}`] = compareField(
		starResult.pureScatteringDensityByOrder[order - 1],
		productionResult.pureScatteringDensityByOrder[order - 1],
		`J${order}`,
		GATES.scatteringDensity,
	);
}
for (let order = 1; order <= 3; order += 1) {
	log(`Comparing pure L${order}.`);
	fields[`L${order}`] = compareField(
		starResult.pureRadianceByOrder[order - 1],
		productionResult.pureRadianceByOrder[order - 1],
		`L${order}`,
		GATES.radiance,
	);
}
for (let order = 1; order <= 3; order += 1) {
	log(`Comparing derived production Jthrough${order}.`);
	fields[`Jthrough${order}Derived`] = compareCumulativePrefix(
		starResult.cumulativeScatteringDensityByOrder[order - 1],
		productionResult.pureScatteringDensityByOrder.slice(0, order),
		`Jthrough${order}Derived`,
		GATES.cumulativeScatteringDensity,
	);
}
log('Comparing stored production Jthrough4.');
fields.Jthrough4 = compareField(
	starResult.cumulativeScatteringDensityByOrder[3],
	productionResult.cumulativeScatteringDensity,
	'Jthrough4',
	GATES.cumulativeScatteringDensity,
);
log('Comparing Stage 3.5 resident stencils and sampled Jthrough4 output.');
const residentSampling = compareResidentSampling(
	starResult,
	starCalculation,
	productionResult,
	production,
);

const report = {
	schema: 'algorithm32-production-star-live-n4-parity-v1',
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
		maximumScatteringOrder: 4,
		positionCount: 48,
		incomingDirectionCount: 34,
		outgoingDirectionCount: 4374,
		wavelengthCount: 15,
		transportIntervalCount: 40,
		packingComparison: 'logical position/direction/wavelength coordinates; raw offsets intentionally differ',
		resolvedStencilGateRationale:
			'Position weights share one scalar altitude and retain the 1e-15 gate. Direction weights include independent physical/source-basis round trips and W27 coordinate scaling, so they use a distinct 1e-14 binary64 gate. Indices must still match exactly.',
	},
	gates: GATES,
	timingsMilliseconds: {
		starIncident: starIncidentMilliseconds,
		starN4: starBuildMilliseconds,
		productionN4: productionBuildMilliseconds,
		total: performance.now() - startedAt,
	},
	domains,
	sourceIrradiance,
	fields,
	residentSampling,
};
report.passed = Object.values(domains).every((entry) => entry.passed)
	&& sourceIrradiance.passed
	&& Object.values(fields).every((entry) => entry.passed)
	&& residentSampling.passed;

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
	residentSampling: {
		passed: report.residentSampling.passed,
		caseCount: report.residentSampling.caseCount,
		comparedScalarCount: report.residentSampling.values.comparedScalarCount,
		maximumAbsoluteError: report.residentSampling.values.maximumAbsoluteError,
		maximumRelativeError: report.residentSampling.values.maximumRelativeError,
		mismatchCount: report.residentSampling.values.mismatchCount,
		stencils: report.residentSampling.rows.map((row) => ({
			id: row.id,
			positionPassed: row.positionStencil.passed,
			directionPassed: row.directionStencil.passed,
		})),
	},
}, null, 2)}\n`);
if (!report.passed) process.exitCode = 1;
