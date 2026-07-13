import { CanonicalAtmosphere } from
	'../../atmospheres/CanonicalAtmosphere.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
} from '../../domains/consts.js';
import { FlatEarthGeometry } from
	'../../geometries/FlatEarthGeometry.js';
import {
	UniformLambertianGroundBoundary,
} from '../../ground-boundaries/index.js';
import {
	createLocalSunShellFactCache,
} from '../../light-sources/create-local-sun-shell-fact-cache.js';
import { LocalSunCacheSource } from
	'../../light-sources/LocalSunCacheSource.js';
import LocalSunConstructionDomainSelection from
	'../../light-sources/LocalSunConstructionDomainSelection.js';
import { LocalSunLightSource } from
	'../../light-sources/LocalSunLightSource.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../../quantities/index.js';

/**
 * Create one unit-bearing meter distance.
 *
 * @param {number} value - Supplies the distance scalar.
 * @returns {Distance} The unit-bearing distance.
 */
function distance(value) {
	return { value, units: 'meters' };
}

/**
 * Create one policy-selected uniform Lambertian boundary.
 *
 * @param {number} value - Supplies every native-15 albedo channel.
 * @param {string} id - Supplies the boundary identity.
 * @returns {UniformLambertianGroundBoundary} The bounded test boundary.
 */
export function createLocalSunGpuParityGroundBoundary(value, id) {
	return new UniformLambertianGroundBoundary({
		id,
		albedo: createSpectralPacket({
			quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			basis: NATIVE_15_SPECTRAL_BASIS,
			values: Array(15).fill(value),
			provenanceIdentity: `${id}-native15-albedo`,
		}),
	});
}

/**
 * Construct the exact bounded z2/rho2, paired-F34, W3, native-15 owners.
 *
 * @returns {{
 *   atmosphere: CanonicalAtmosphere,
 *   geometry: FlatEarthGeometry,
 *   physicalSource: LocalSunLightSource,
 *   shellFactCache: LocalSunShellFactCache,
 *   cacheSource: LocalSunCacheSource,
 *   domainSelection: LocalSunConstructionDomainSelection,
 * }} The shared conformance owners.
 */
export function createLocalSunGpuParityOwners() {
	const sourcePosition = {
		coordinates: [4_800_000, 0, 4_800_000],
		units: 'meters',
	};
	const topAltitude = distance(100_000);
	const rhoMaximum = distance(4_800_000);
	const geometry = new FlatEarthGeometry({
		observerPosition: {
			coordinates: [0, 0, 5],
			units: 'meters',
		},
		sourcePosition,
		topAltitude,
		cacheRadialMaximum: rhoMaximum,
		cacheAltitudeNodes: [distance(0), topAltitude],
		cacheRadialNodes: [distance(0), rhoMaximum],
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const physicalSource = new LocalSunLightSource({
		sourceKey: 'algorithm32-stage-9.6.3-local-sun',
		position: sourcePosition,
		sourceIrradiance:
			NATIVE_SOURCE_IRRADIANCE_DENSITY,
		referenceDistance: distance(4_800_000),
		referenceSpectralIncidentScale: 1,
		radius: distance(25_749.504),
		distanceFalloff: true,
		sourceTransmittanceIntervalCount: 15,
	});
	const shellFactCache = createLocalSunShellFactCache({
		sourceConfiguration: physicalSource.configuration,
	});
	const cacheSource = new LocalSunCacheSource({
		source: physicalSource,
		shellFactCache,
	});
	const domainSelection =
		LocalSunConstructionDomainSelection.fromGeometry(
			geometry,
			{
				id:
					'algorithm32-stage-9.6.3-z2-rho2-paired-f34-w3',
				outgoingDirectionDomainOwner:
					CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
				spectralBasis: NATIVE_15_SPECTRAL_BASIS,
				radiancePackingId:
					'algorithm32-stage-9.6.3-paired-f34-radiance',
				scatteringDensityPackingId:
					'algorithm32-stage-9.6.3-w3-scattering-density',
			},
		);

	return {
		atmosphere,
		geometry,
		physicalSource,
		shellFactCache,
		cacheSource,
		domainSelection,
	};
}
