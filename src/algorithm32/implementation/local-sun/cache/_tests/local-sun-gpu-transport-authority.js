import {CanonicalAtmosphere, FlatEarthGeometry} from '../../../../implementation/index.js';
import ArrayMath from '../../../../math/ArrayMath.js';
import DistanceMath from '../../../../math/DistanceMath.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../../implementation/canonical-atmosphere/consts.js';
import {SpectralCalculator} from '../../../../atmospheric-transport/spectral/SpectralCalculator.js';
import {LocalSunLightSource} from '../../LocalSunLightSource.js';
import {PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/direction/fibonacci/consts.js';
import LocalSunConstructionDomainSelection from '../LocalSunConstructionDomainSelection.js';

/** Sealed paired-Fibonacci-34 construction-domain identity. */
const SEALED_AUTHORITY_DOMAIN_ID = 'algorithm32-local-sun-z19-rho15-paired-fibonacci34-w27-v2';
/** Sealed paired-Fibonacci-34 radiance-packing identity. */
const SEALED_AUTHORITY_RADIANCE_PACKING_ID = 'algorithm32-local-sun-z19-rho15-paired-fibonacci34-radiance-packing-v2';

/** Default production authority probe positions. */
const DEFAULT_POSITION_INDICES = [0, 14, 15, 16, 207, 268, 270, 284];
/** Default production authority probe incoming directions. */
const DEFAULT_INCOMING_DIRECTION_INDICES = [0, 1, 4, 5, 8, 9, 32, 33];
/** Default production authority spectral-layer count. */
const DEFAULT_WAVELENGTH_COUNT = 15;

/**
 * Call this method to create the physical collaborators for the default
 * sealed paired-Fibonacci-34 local-Sun authority profile.
 *
 * @returns {{atmosphere: CanonicalAtmosphere, geometry: FlatEarthGeometry, lightSource: LocalSunLightSource}} - The configured authority owners.
 */
export function createDefaultAuthorityOwners() {
	const geometry = new FlatEarthGeometry({
		observerPosition: {coordinates: [0, 0, 5], units: 'meters'},
		topAltitude: {value: 100_000, units: 'meters'},
		localLightSourceHeight: {value: 4_800_000, units: 'meters'},
		projectionRadius: {value: 48_000_000, units: 'meters'},
	});
	const atmosphere = new CanonicalAtmosphere({constants: CANONICAL_ATMOSPHERE_CONSTANTS});
	const lightSource = new LocalSunLightSource({
		sourceKey: 'local-sun-gpu-transport-step0-authority',
		referenceDistance: {value: 4_800_000, units: 'meters'},
		referenceSpectralIncidentScale: 1,
		radius: {value: 25_749.504, units: 'meters'},
		distanceFalloff: true,
		sourceTransmittanceIntervalCount: 15,
	});
	geometry.configureLightSource({
		lightSource,
		observation: {
			instant: '2026-03-20T12:00:00.000Z',
			location: {
				latitude: {value: -0.27940210679735955, units: 'degrees'},
				longitude: {value: -1.5903827852862762, units: 'degrees'},
			},
		},
	});

	return {atmosphere, geometry, lightSource};
}

/**
 * Call this method to select the immutable paired-Fibonacci-34 domain used by
 * the sealed transport snapshots. This is a legacy numerical authority, not
 * the current production quadrature default.
 *
 * @param {FlatEarthGeometry} geometry - The configured authority geometry.
 * @returns {LocalSunConstructionDomainSelection} - The sealed authority domains.
 */
export function createSealedAuthorityDomainSelection(geometry) {
	return LocalSunConstructionDomainSelection.fromGeometry(geometry, {
		id: SEALED_AUTHORITY_DOMAIN_ID,
		incomingDirectionDomainOwner: PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
		radiancePackingId: SEALED_AUTHORITY_RADIANCE_PACKING_ID,
	});
}

/**
 * Call this method to create the selected L2/L3 coordinates frozen for the
 * default maximum-quality production profile.
 *
 * @returns {readonly DirectionalSpectralFieldCoordinates[]} - The selected radiance coordinates.
 */
export function createDefaultAuthorityProbeCoordinates() {
	return DEFAULT_POSITION_INDICES.flatMap((positionIndex) =>
		DEFAULT_INCOMING_DIRECTION_INDICES.flatMap((directionIndex) =>
			Array.from({length: DEFAULT_WAVELENGTH_COUNT}, (_value, wavelengthIndex) => ({
				directionIndex,
				positionIndex,
				wavelengthIndex,
			})),
		),
	);
}

/**
 * Call this method to create a canonical local cache-build coordinate.
 *
 * @param {LocalSunConstructionDomainSelection} domains - The executable construction domains.
 * @param {number} positionIndex - The flattened output position index.
 * @param {number} directionIndex - The incoming radiance direction index.
 * @param {UnitVector3} incomingDirection - The physical incoming direction.
 * @returns {CacheBuildCoordinate} - The geometry-owned cache-build coordinate.
 */
function createBuildCoordinate(domains, positionIndex, directionIndex, incomingDirection) {
	const positionNode = domains.positionNodes[positionIndex];
	return {
		coordinateKey:
			`local-z${domains.zCount}` +
			`-rho${domains.rhoCount}` +
			`-fibonacci${domains.incomingDirectionCount}` +
			`:${positionIndex}:${directionIndex}`,
		coordinates: [positionIndex, directionIndex],
		zBinIndex: /** @type {number} */ (positionNode.metadata.zIndex),
		rhoBinIndex: /** @type {number} */ (positionNode.metadata.rhoIndex),
		altitude: /** @type {Distance} */ (positionNode.metadata.z),
		rho: /** @type {Distance} */ (positionNode.metadata.rho),
		incomingDirection,
		directionIndex,
		metadata: {
			position: /** @type {Position} */ (positionNode.metadata.position),
			positionIndex,
		},
	};
}

/**
 * Call this method to create a lazy binary64 evaluator for selected sealed
 * paired-Fibonacci-34 radiance samples. It retains only memoized scalar spectra and
 * never creates a complete CPU cache field.
 *
 * @param {(progress: Readonly<{completed: number, total: number, memoizedSamples: number}>) => void} [onProgress] - Optional selected-sample progress observer.
 * @returns {Readonly<{readRadiance: (order: 2 | 3, positionIndex: number, directionIndex: number) => Float64Array, reportProgress: (completed: number, total: number) => void}>} - The selected-sample evaluator.
 */
function createSelectedRadianceEvaluator(onProgress) {
	const {atmosphere, geometry, lightSource} = createDefaultAuthorityOwners();
	const domains = createSealedAuthorityDomainSelection(geometry);
	const calculator = new SpectralCalculator({
		geometry,
		atmosphere,
		lightSource,
		spectralBasis: domains.spectralBasis,
		executionOptions: {pathIntervalCount: 15, sourceTransmittanceIntervalCount: 15},
	});
	const memoizedRadiance = new Map();
	const memoizedScattering = new Map();
	let evaluatedSamples = 0;
	const spectrumKey = (order, positionIndex, directionIndex) => `${order}:${positionIndex}:${directionIndex}`;
	const reportDependencyProgress = () => {
		evaluatedSamples += 1;
		if (evaluatedSamples % 100 === 0) {
			onProgress?.({
				phase: 'selected-dependency',
				completed: evaluatedSamples,
				total: 0,
				memoizedSamples: memoizedRadiance.size + memoizedScattering.size,
			});
		}
	};

	/** @param {number} positionIndex @param {number} directionIndex @returns {Float64Array} */
	const readPrimaryRadiance = (positionIndex, directionIndex) => {
		const key = spectrumKey(1, positionIndex, directionIndex);
		const existing = memoizedRadiance.get(key);
		if (existing) return existing;
		reportDependencyProgress();
		const position = /** @type {Position} */ (domains.positionNodes[positionIndex].metadata.position);
		const incomingDirection = geometry.expressPhysicalScatteringCacheDirection({
			position,
			cacheDirection: domains.incomingUnitVectors[directionIndex],
		});
		const raySegment = geometry.resolveCacheBuildRay(
			createBuildCoordinate(domains, positionIndex, directionIndex, incomingDirection),
		);
		const path = calculator.buildEndpointTrapezoidPathIntegrationPoints(raySegment, 15);
		const result = calculator.computeDirectRadiance(raySegment, path).pathRadiance.values;
		memoizedRadiance.set(key, result);
		return result;
	};

	/** @param {2 | 3} order @param {number} positionIndex @param {number} outgoingDirectionIndex @returns {Float64Array} */
	const readScattering = (order, positionIndex, outgoingDirectionIndex) => {
		const key = spectrumKey(order, positionIndex, outgoingDirectionIndex);
		const existing = memoizedScattering.get(key);
		if (existing) return existing;
		reportDependencyProgress();
		const position = /** @type {Position} */ (domains.positionNodes[positionIndex].metadata.position);
		const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(position);
		const medium = atmosphere.sampleMedium(atmosphereCoordinate);
		const physicalOutgoingDirection = geometry.expressPhysicalScatteringCacheDirection({
			position,
			cacheDirection: domains.outgoingUnitVectors[outgoingDirectionIndex],
		});
		const result = new Float64Array(domains.spectralChannelCount);

		for (
			let incomingDirectionIndex = 0;
			incomingDirectionIndex < domains.incomingDirectionCount;
			incomingDirectionIndex += 1
		) {
			const physicalIncomingDirection = geometry.expressPhysicalScatteringCacheDirection({
				position,
				cacheDirection: domains.incomingUnitVectors[incomingDirectionIndex],
			});
			const phase = atmosphere.samplePhase({
				viewDirection: physicalOutgoingDirection,
				incomingDirection: physicalIncomingDirection,
			});
			const scattering = calculator.computeDirectScattering(
				medium.rayleighScattering,
				medium.mieScattering,
				phase.rayleighPhase,
				phase.miePhase,
			).values;
			const radiance =
				order === 2
					? readPrimaryRadiance(positionIndex, incomingDirectionIndex)
					: readRadiance(2, positionIndex, incomingDirectionIndex);
			const weight = domains.incomingIntegrationWeights.values[incomingDirectionIndex];
			for (let wavelengthIndex = 0; wavelengthIndex < result.length; wavelengthIndex += 1)
				result[wavelengthIndex] += radiance[wavelengthIndex] * scattering[wavelengthIndex] * weight;
		}

		memoizedScattering.set(key, result);
		return result;
	};

	/** @param {2 | 3} order @param {number} positionIndex @param {number} directionIndex @returns {Float64Array} */
	const readRadiance = (order, positionIndex, directionIndex) => {
		const key = spectrumKey(order, positionIndex, directionIndex);
		const existing = memoizedRadiance.get(key);
		if (existing) return existing;
		reportDependencyProgress();
		const positionNode = domains.positionNodes[positionIndex];
		const position = /** @type {Position} */ (positionNode.metadata.position);
		const incomingDirection = geometry.expressPhysicalScatteringCacheDirection({
			position,
			cacheDirection: domains.incomingUnitVectors[directionIndex],
		});
		const raySegment = geometry.resolveCacheBuildRay(
			createBuildCoordinate(domains, positionIndex, directionIndex, incomingDirection),
		);
		const path = calculator.buildEndpointTrapezoidPathIntegrationPoints(raySegment, 15);
		const result = new Float64Array(domains.spectralChannelCount);
		let viewTransmittance = new Float64Array(domains.spectralChannelCount).fill(1);
		let previousMedium = null;
		for (const point of path) {
			const samplePosition = DistanceMath.positionAlongRay(
				raySegment.ray.origin,
				raySegment.ray.direction,
				DistanceMath.toMeters(point.distanceAlongRay),
			);
			const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(samplePosition);
			const medium = atmosphere.sampleMedium(atmosphereCoordinate);
			if (previousMedium)
				viewTransmittance = ArrayMath.multiplyToFloat64(
					viewTransmittance,
					calculator.computeTrapezoidSegmentTransmittance(
						previousMedium.extinction,
						medium.extinction,
						point.intervalLengthFromPrevious,
					).values,
				);
			const positionStencil = geometry.resolveScatteringCacheConstructionPositionStencil({
				position: samplePosition,
				atmosphereCoordinate,
				positionAxes: domains,
			});
			const cacheDirection = geometry.expressScatteringCacheDirection({
				position: samplePosition,
				physicalOutgoingDirection: raySegment.ray.direction,
			});
			const directionStencil = domains.resolveOutgoingDirectionStencil(cacheDirection);
			for (let positionOffset = 0; positionOffset < positionStencil.indices.length; positionOffset += 1)
				for (let directionOffset = 0; directionOffset < directionStencil.indices.length; directionOffset += 1) {
					const scattering = readScattering(
						order,
						positionStencil.indices[positionOffset],
						directionStencil.indices[directionOffset],
					);
					const coefficient = viewTransmittance;
					const weight =
						positionStencil.weights[positionOffset] *
						directionStencil.weights[directionOffset] *
						DistanceMath.toMeters(point.measure);
					for (let wavelengthIndex = 0; wavelengthIndex < result.length; wavelengthIndex += 1)
						result[wavelengthIndex] += coefficient[wavelengthIndex] * scattering[wavelengthIndex] * weight;
				}
			previousMedium = medium;
		}
		memoizedRadiance.set(key, result);
		return result;
	};

	return {
		readRadiance,
		readPrimaryRadiance,
		readScattering,
		reportProgress: (completed, total) =>
			onProgress?.({
				phase: 'selected-probe',
				completed,
				total,
				memoizedSamples: memoizedRadiance.size + memoizedScattering.size,
			}),
	};
}

/** Return diagnostic-only selected CPU stages at one default cache coordinate. */
export function createDefaultCpuStageDiagnostic() {
	const evaluator = createSelectedRadianceEvaluator();
	return {
		l1: evaluator.readPrimaryRadiance(0, 0)[0],
		j2: evaluator.readScattering(2, 0, 0)[0],
		l2: evaluator.readRadiance(2, 0, 0)[0],
	};
}

/**
 * Call this method to regenerate the selected binary64 production authority.
 *
 * @param {(progress: LocalSunCpuCacheBuildProgress) => void} [onProgress] - Optional authority-build progress observer.
 * @returns {Readonly<{options: CacheConstructionOptions, l2: readonly CacheProbeSample[], l3: readonly CacheProbeSample[]}>} - The selected binary64 radiance authorities.
 */
export function createDefaultCpuAuthoritySnapshot(onProgress) {
	const coordinates = createDefaultAuthorityProbeCoordinates();
	const total = coordinates.length * 2;
	const evaluator = createSelectedRadianceEvaluator(onProgress);
	const readOrder = (order) =>
		coordinates.map((coordinate, completed) => {
			const spectrum = evaluator.readRadiance(order, coordinate.positionIndex, coordinate.directionIndex);
			evaluator.reportProgress(completed + 1 + (order - 2) * coordinates.length, total);
			return {coordinates: coordinate, value: spectrum[coordinate.wavelengthIndex]};
		});

	return {
		options: {transportIntervalCount: 15, maximumScatteringOrder: 4},
		l2: readOrder(2),
		l3: readOrder(3),
	};
}
