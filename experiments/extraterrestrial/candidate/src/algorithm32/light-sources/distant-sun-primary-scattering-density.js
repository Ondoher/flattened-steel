import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
} from '../profiles/index.js';
import {
	assertCompatibleSpectralBases,
} from '../quantities/index.js';
import {
	createDistantSunCpuPureScatteringDensityField,
} from './DistantSunCpuFields.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	DISTANT_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY,
	DISTANT_SUN_CPU_PURE_J1_ID,
	DISTANT_SUN_PRIMARY_SCATTERING_DIRECTION_TOLERANCE,
	SOURCE_LOCAL_TOWARD_DISTANT_SUN,
} from './consts.js';

/**
 * Preserve the normalized-direction numerical contract without reconstructing
 * the JavaScript shape of an already typed direction.
 *
 * @param {UnitVector3} direction - Supplies the typed physical direction.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {void}
 */
function assertNormalizedDirection(direction, label) {
	const length = Math.hypot(
		direction[0],
		direction[1],
		direction[2],
	);
	if (!Number.isFinite(length)
		|| Math.abs(length - 1)
			> DISTANT_SUN_PRIMARY_SCATTERING_DIRECTION_TOLERANCE) {
		throw new RangeError(`${label} must be normalized.`);
	}
}

/**
 * Validate that the atmosphere's spectral basis matches native-15.
 *
 * @param {DistantSunPrimaryScatteringAtmosphere} atmosphere - Supplies the atmosphere.
 * @returns {void}
 */
function assertNativeAtmosphereBasis(atmosphere) {
	assertCompatibleSpectralBases(
		atmosphere.spectralBasis,
		NATIVE_15_SPECTRAL_BASIS,
		'distant-Sun primary scattering atmosphere basis',
	);
}

/**
 * Resolve the trusted Stage 3.2 physical collaborators and defaults.
 *
 * @param {DistantSunPrimaryScatteringDensityBuildRequest} request - Supplies build dependencies.
 * @returns {{
 *   atmosphere: DistantSunPrimaryScatteringAtmosphere,
 *   geometry: DistantSunPrimaryScatteringGeometry,
 *   lightSource: DistantSunPrimaryScatteringLightSource,
 *   profile: NativeProductionProfile,
 *   sourcePacket: SpectralPacket,
 *   domainSelection: DistantSunConstructionDomainSelection,
 *   id: string,
 *   provenanceIdentity: string,
 * }} The resolved build inputs.
 */
function resolveBuildRequest(request) {
	const profile = request.profile ?? DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const sourcePacket = profile.spectral.sourceIrradianceDensity;
	const domainSelection = request.domainSelection
		?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const atmosphere = request.atmosphere;
	const geometry = request.geometry;
	const lightSource = request.lightSource;

	assertNativeAtmosphereBasis(atmosphere);

	return {
		atmosphere,
		geometry,
		lightSource,
		profile,
		sourcePacket,
		domainSelection,
		id: request.id === undefined ? DISTANT_SUN_CPU_PURE_J1_ID : request.id,
		provenanceIdentity: request.provenanceIdentity === undefined
			? DISTANT_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY
			: request.provenanceIdentity,
	};
}

/**
 * Bind the trusted source sample's channel values to
 * the native profile's typed irradiance-density packet.
 *
 * @param {DirectLightingSample} directLighting - Supplies the source sample.
 * @param {SpectralPacket} sourcePacket - Supplies the typed profile packet.
 * @returns {{
 *   sourceIrradianceWattsPerSquareMeterPerNanometer: readonly number[],
 *   directionToLight: UnitVector3,
 * }} The accepted direct-source inputs.
 */
function resolveDirectLighting(directLighting, sourcePacket) {
	const sourceIrradiance = directLighting.sourceIrradiance;
	assertCompatibleSpectralBases(
		sourceIrradiance.basis,
		sourcePacket.basis,
		'distant-Sun source irradiance basis',
	);

	if (sourceIrradiance.values.some(
		(value, index) => value !== sourcePacket.values[index]
	)) {
		throw new TypeError(
			'distant-Sun source irradiance must match the selected native profile packet.',
		);
	}
	assertNormalizedDirection(
		directLighting.directionToLight,
		'distant-Sun directionToLight',
	);

	return {
		sourceIrradianceWattsPerSquareMeterPerNanometer: sourceIrradiance.values,
		directionToLight: directLighting.directionToLight,
	};
}

/**
 * Precompute the selected axisymmetric phase values in the source-local W27
 * frame. W27 declares positive x as toward-source, so its vectors and the
 * incoming positive-x direction form the same frame regardless of the
 * source's world-space direction.
 *
 * @param {DistantSunPrimaryScatteringAtmosphere} atmosphere - Supplies the phase sampler.
 * @param {DistantSunConstructionDomainSelection} domainSelection - Supplies
 * executable outgoing directions.
 * @returns {readonly PhaseSample[]} One phase pair per selected outgoing direction.
 */
function createSourceLocalPhaseSamples(atmosphere, domainSelection) {
	return domainSelection.outgoingUnitVectors.map((viewDirection) => {
		const phase = atmosphere.samplePhase({
			viewDirection,
			incomingDirection: SOURCE_LOCAL_TOWARD_DISTANT_SUN,
		});

		return phase;
	});
}

/**
 * Resolve sample-to-source transmittance for one physical position.
 *
 * @param {{
 *   atmosphere: DistantSunPrimaryScatteringAtmosphere,
 *   geometry: DistantSunPrimaryScatteringGeometry,
 *   raySegment: RaySegment,
 *   sourcePathLimit: SourcePathLimit,
 *   intervalCount: number,
 * }} request - Supplies physical path facts.
 * @returns {readonly number[]} The source-path spectral transmittance.
 */
function resolveSourceTransmittance(request) {
	const sourcePath = request.geometry.resolveAtmospherePath({
		ray: request.raySegment.ray,
		startDistance: request.raySegment.startDistance,
		endDistance: request.raySegment.endDistance,
		sourcePathLimit: request.sourcePathLimit,
		sampleCount: request.intervalCount,
	});
	const opticalDepth = request.atmosphere.integrateOpticalDepth(sourcePath);
	return opticalDepth.transmittance.values;
}

/**
 * Evaluate one physical primary-scattering-density scalar.
 *
 * @param {number} sourceIrradianceWattsPerSquareMeterPerNanometer - Supplies top-of-atmosphere irradiance density.
 * @param {number} sourceTransmittance - Supplies sample-to-source survival.
 * @param {number} rayleighScatteringPerMeter - Supplies local Rayleigh scattering coefficient.
 * @param {number} mieScatteringPerMeter - Supplies local Mie scattering coefficient.
 * @param {number} rayleighPhasePerSteradian - Supplies the Rayleigh phase value.
 * @param {number} miePhasePerSteradian - Supplies the Mie phase value.
 * @returns {number} Local scattering density in W m^-3 sr^-1 nm^-1.
 */
function primaryScatteringDensity(
	sourceIrradianceWattsPerSquareMeterPerNanometer,
	sourceTransmittance,
	rayleighScatteringPerMeter,
	mieScatteringPerMeter,
	rayleighPhasePerSteradian,
	miePhasePerSteradian,
) {
	return sourceTransmittance
		* sourceIrradianceWattsPerSquareMeterPerNanometer
		* (
			rayleighScatteringPerMeter * rayleighPhasePerSteradian
			+ mieScatteringPerMeter * miePhasePerSteradian
		);
}

/**
 * Build sealed physical pure J1 over native-48 x W27 x native-15.
 *
 * J1 stores observer-independent local spectral scattering density. It
 * includes direct-source transmittance and phase-weighted local scattering,
 * but excludes observer transmittance and view-path measure.
 *
 * @param {DistantSunPrimaryScatteringDensityBuildRequest} request - Supplies
 * the normalized atmosphere, spherical geometry, distant source, and profile.
 * @returns {CpuDirectionalSpectralFieldContract} Sealed pure J1.
 */
export function buildDistantSunCpuPrimaryScatteringDensity(request) {
	const {
		atmosphere,
		geometry,
		lightSource,
		profile,
		sourcePacket,
		domainSelection,
		id,
		provenanceIdentity,
	} = resolveBuildRequest(request);
	const directLighting = lightSource.sampleDirectLighting({
		spectralBasis: profile.spectral.basis,
	});
	const {
		sourceIrradianceWattsPerSquareMeterPerNanometer,
		directionToLight,
	} = resolveDirectLighting(directLighting, sourcePacket);
	const sourcePathLimit = lightSource.resolveSourcePathLimit({ directLighting });
	const intervalCount = profile.numerical.sourcePathTransmittance.intervalCount;
	const channelCount = sourcePacket.values.length;
	const sourceLocalPhaseSamples = createSourceLocalPhaseSamples(
		atmosphere,
		domainSelection,
	);
	const field = createDistantSunCpuPureScatteringDensityField({
		id,
		order: 1,
		provenanceIdentity,
		domainSelection,
	});
	const writer = field.createWriter();
	writer.fill(0);

	try {
		for (const node of domainSelection.positionNodes) {
			const raySegment = geometry.resolveCacheBuildRay({
				coordinateKey:
					`native-${domainSelection.positionCount}-position:${node.index}`,
				coordinates: [node.index],
				altitudeBinIndex: node.index,
				altitude: node.coordinate,
				incomingDirection: directionToLight,
			});

			if (raySegment === null) {
				continue;
			}

			const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(
				raySegment.ray.origin,
			);
			const medium = atmosphere.sampleMedium(atmosphereCoordinate);
			const rayleighScatteringPerMeter = medium.rayleighScattering.values;
			const mieScatteringPerMeter = medium.mieScattering.values;
			if (!rayleighScatteringPerMeter.some((value, index) =>
				value > 0 || mieScatteringPerMeter[index] > 0)) {
				continue;
			}
			const transmittance = resolveSourceTransmittance({
				atmosphere,
				geometry,
				raySegment,
				sourcePathLimit,
				intervalCount,
			});

			for (let directionIndex = 0;
				directionIndex < domainSelection.outgoingDirectionCount;
				directionIndex += 1) {
				const phase = sourceLocalPhaseSamples[directionIndex];

				for (let wavelengthIndex = 0;
					wavelengthIndex < channelCount;
					wavelengthIndex += 1) {
					writer.writeScalar({
						directionIndex,
						positionIndex: node.index,
						wavelengthIndex,
					}, primaryScatteringDensity(
						sourceIrradianceWattsPerSquareMeterPerNanometer[wavelengthIndex],
						transmittance[wavelengthIndex],
						rayleighScatteringPerMeter[wavelengthIndex],
						mieScatteringPerMeter[wavelengthIndex],
						phase.rayleighPhase.value,
						phase.miePhase.value,
					));
				}
			}
		}

		field.seal();
		return field;
	} catch (error) {
		if (!field.isSealed) {
			writer.fill(0);
		}
		throw error;
	}
}
