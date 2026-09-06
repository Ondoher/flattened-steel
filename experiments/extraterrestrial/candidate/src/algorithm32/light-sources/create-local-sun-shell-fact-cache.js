import {
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';
import {
	LocalSunShellFactCache,
} from './LocalSunShellFactCache.js';
import {
	LOCAL_SUN_SHELL_ATMOSPHERE_APEX_METERS,
	LOCAL_SUN_SHELL_BOUNDARY_COUNT,
	LOCAL_SUN_SHELL_COUNT,
	LOCAL_SUN_SHELL_FACT_ID,
	LOCAL_SUN_SHELL_FACT_SCHEMA,
	LOCAL_SUN_SHELL_MAP_RADIUS_METERS,
} from './local-sun-consts.js';

/**
 * Copy the physical source facts that own the shell identity.
 *
 * @param {LocalSunShellFactSourceConfiguration} configuration - Supplies
 * normalized source state.
 * @returns {LocalSunShellExecutableSourceFacts} Executable source facts.
 */
function copySourceFacts(configuration) {
	return {
		position: {
			coordinates:
				/** @type {readonly [number, number, number]} */ ([
				...configuration.position.coordinates,
				]),
			units: 'meters',
		},
		sourceIrradianceHash:
			configuration.sourceIrradiance.contentHash,
		referenceDistance: {
			value: configuration.referenceDistance.value,
			units: 'meters',
		},
		referenceSpectralIncidentScale:
			configuration.referenceSpectralIncidentScale,
		radius: {
			value: configuration.radius.value,
			units: 'meters',
		},
		distanceFalloff: configuration.distanceFalloff,
	};
}

/**
 * Derive the accepted whole-flat-world source-distance domain.
 *
 * @param {Position} sourcePosition - Supplies the physical source.
 * @returns {LocalSunShellExecutableDomain} Executable source-distance facts.
 */
function deriveWholeFlatWorldSourceDomain(sourcePosition) {
	const [sourceX, sourceY, sourceHeightMeters] =
		sourcePosition.coordinates;
	if (sourceHeightMeters <= 0) {
		throw new RangeError(
			'Local-Sun shell fact source height must be positive.',
		);
	}
	const horizontalOffsetMeters =
		Math.hypot(sourceX, sourceY);
	const apex = LOCAL_SUN_SHELL_ATMOSPHERE_APEX_METERS;
	const mapRadius = LOCAL_SUN_SHELL_MAP_RADIUS_METERS;
	const centerZ =
		(apex * apex - mapRadius * mapRadius) / (2 * apex);
	const sphereRadius =
		(apex * apex + mapRadius * mapRadius) / (2 * apex);
	const sourceToSphereCenter = Math.hypot(
		horizontalOffsetMeters,
		sourceHeightMeters - centerZ,
	);
	const minimumDistanceMeters =
		sourceToSphereCenter - sphereRadius;
	const maximumDistanceMeters = Math.hypot(
		mapRadius + horizontalOffsetMeters,
		sourceHeightMeters,
	);
	if (!(minimumDistanceMeters > 0)
		|| !(maximumDistanceMeters
			> minimumDistanceMeters)) {
		throw new RangeError(
			'Local-Sun shell fact domain must have positive ordered radii.',
		);
	}

	return {
		minimumDistance: {
			value: minimumDistanceMeters,
			units: 'meters',
		},
		maximumDistance: {
			value: maximumDistanceMeters,
			units: 'meters',
		},
		horizontalOffset: {
			value: horizontalOffsetMeters,
			units: 'meters',
		},
		sourceHeight: {
			value: sourceHeightMeters,
			units: 'meters',
		},
		mapRadius: {
			value: mapRadius,
			units: 'meters',
		},
		atmosphereApex: {
			value: apex,
			units: 'meters',
		},
	};
}

/**
 * Describe the source facts retained in shell identity metadata.
 *
 * @param {LocalSunShellExecutableSourceFacts} source - Supplies executable facts.
 * @returns {LocalSunShellFactSourceDescriptor} The source metadata.
 */
function createSourceDescriptor(source) {
	return {
		position: {
			coordinates: [
				...source.position.coordinates,
			],
			units: 'meters',
		},
		sourceIrradianceHash: source.sourceIrradianceHash,
		referenceDistance: {
			value: source.referenceDistance.value,
			units: 'meters',
		},
		referenceSpectralIncidentScale:
			source.referenceSpectralIncidentScale,
		radius: {
			value: source.radius.value,
			units: 'meters',
		},
		distanceFalloff: source.distanceFalloff,
	};
}

/**
 * Describe the whole-flat-world domain retained in shell identity metadata.
 *
 * @param {LocalSunShellExecutableDomain} domain - Supplies executable facts.
 * @returns {LocalSunShellFactDomainDescriptor} The domain metadata.
 */
function createDomainDescriptor(domain) {
	return {
		minimumDistance: {
			value: domain.minimumDistance.value,
			units: 'meters',
		},
		maximumDistance: {
			value: domain.maximumDistance.value,
			units: 'meters',
		},
		horizontalOffset: {
			value: domain.horizontalOffset.value,
			units: 'meters',
		},
		sourceHeight: {
			value: domain.sourceHeight.value,
			units: 'meters',
		},
		mapRadius: {
			value: domain.mapRadius.value,
			units: 'meters',
		},
		atmosphereApex: {
			value: domain.atmosphereApex.value,
			units: 'meters',
		},
	};
}

/**
 * Build all 2,049 exact binary64 boundary radii.
 *
 * @param {LocalSunShellExecutableDomain} domain - Supplies source domain.
 * @returns {Float64Array} Ordered equal-inverse-square boundaries.
 */
function createEqualInverseSquareBoundaries(domain) {
	const minimumDistanceMeters =
		domain.minimumDistance.value;
	const maximumDistanceMeters =
		domain.maximumDistance.value;
	const inverseMinimumSquared =
		1 / (minimumDistanceMeters * minimumDistanceMeters);
	const inverseMaximumSquared =
		1 / (maximumDistanceMeters * maximumDistanceMeters);
	const boundaries =
		new Float64Array(LOCAL_SUN_SHELL_BOUNDARY_COUNT);

	for (let index = 0;
		index < LOCAL_SUN_SHELL_BOUNDARY_COUNT;
		index += 1) {
		const fraction = index / LOCAL_SUN_SHELL_COUNT;
		boundaries[index] = 1 / Math.sqrt(
			inverseMinimumSquared
			- fraction * (
				inverseMinimumSquared
				- inverseMaximumSquared
			),
		);
	}

	return boundaries;
}

/**
 * Evaluate the normalized source's continuous incident scale.
 *
 * @param {number} distanceMeters - Supplies source distance.
 * @param {LocalSunShellExecutableSourceFacts} source - Supplies source facts.
 * @returns {number} Dimensionless incident scale.
 */
function continuousIncidentScale(distanceMeters, source) {
	const safeDistanceMeters = Math.max(
		source.radius.value,
		distanceMeters,
		Number.EPSILON,
	);
	const falloffScale = source.distanceFalloff
		? (
			source.referenceDistance.value
			/ safeDistanceMeters
		) ** 2
		: 1;

	return source.referenceSpectralIncidentScale
		* falloffScale;
}

/**
 * Build the arithmetic-mean incident amplitude for every shell.
 *
 * @param {Float64Array} boundaries - Supplies ordered radii.
 * @param {LocalSunShellExecutableSourceFacts} source - Supplies radiometry.
 * @returns {Float64Array} Fixed held scales.
 */
function createHeldIncidentScales(boundaries, source) {
	const scales = new Float64Array(LOCAL_SUN_SHELL_COUNT);

	for (let index = 0;
		index < LOCAL_SUN_SHELL_COUNT;
		index += 1) {
		scales[index] = 0.5 * (
			continuousIncidentScale(boundaries[index], source)
			+ continuousIncidentScale(
				boundaries[index + 1],
				source,
			)
		);
	}

	return scales;
}

/**
 * Create the fixed source-paired local-Sun shell facts.
 *
 * @param {Readonly<{
 *   sourceConfiguration: LocalSunShellFactSourceConfiguration,
 * }>} request - Supplies normalized physical source facts.
 * @returns {LocalSunShellFactCache} The canonical fact owner.
 */
export function createLocalSunShellFactCache(request) {
	const source =
		copySourceFacts(request.sourceConfiguration);
	const domain = deriveWholeFlatWorldSourceDomain(
		source.position,
	);
	const boundaries =
		createEqualInverseSquareBoundaries(domain);
	const heldIncidentScales =
		createHeldIncidentScales(boundaries, source);
	const identityBody = /** @type {const} */ ({
		kind: 'local-sun-shell-facts',
		id: LOCAL_SUN_SHELL_FACT_ID,
		schemaRevision: LOCAL_SUN_SHELL_FACT_SCHEMA,
		shellCount: LOCAL_SUN_SHELL_COUNT,
		boundaryCount: LOCAL_SUN_SHELL_BOUNDARY_COUNT,
		policy: {
			boundaries:
				'equal-inverse-square-source-distance',
			internalBoundaryOwnership: 'higher-index',
			heldIncidentScale:
				'arithmetic-mean-boundary-inverse-square',
			application: 'primary-j1-amplitude-only',
		},
		source: createSourceDescriptor(source),
		domain: createDomainDescriptor(domain),
	});
	const identity = sha256Descriptor(identityBody);

	return new LocalSunShellFactCache({
		descriptor: {
			...identityBody,
			identity,
		},
		boundaries,
		heldIncidentScales,
		minimumDistance: domain.minimumDistance,
		maximumDistance: domain.maximumDistance,
	});
}
