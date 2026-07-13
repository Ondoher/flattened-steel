/**
 * Build the selected Algorithm32-star direct primary-radiance CPU field.
 *
 * Provenance source:
 * `scripts/algorithm32-star/src/n-order-cache/build-cpu-distant-n-order-cache.js`,
 * function `createL1Field`.
 * SHA-256: `98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a`.
 * The path and digest record the promoted implementation identity; this
 * module has no runtime dependency on the preserved source.
 */
import { SpectralCalculator } from '../implementation/SpectralCalculator.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
} from '../profiles/index.js';
import { createDistantSunCpuPureRadianceField } from './DistantSunCpuFields.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	DISTANT_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY,
	DISTANT_SUN_CPU_PURE_L1_ID,
	DISTANT_SUN_PRIMARY_DIRECTION_TOLERANCE,
} from './consts.js';

/**
 * Require a normalized three-component direction.
 *
 * @param {UnitVector3} value - Supplies the candidate direction.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {UnitVector3} The validated direction.
 */
function requireUnitVector(value, label) {
	const magnitude = Math.hypot(value[0], value[1], value[2]);
	if (!Number.isFinite(magnitude)
		|| Math.abs(magnitude - 1)
			> DISTANT_SUN_PRIMARY_DIRECTION_TOLERANCE) {
		throw new RangeError(`${label} must be normalized.`);
	}

	return value;
}

/**
 * Select the typed native profile and its direct-source packet.
 *
 * @param {NativeProductionProfile | undefined} value - Supplies the profile.
 * @returns {{
 *   profile: NativeProductionProfile,
 *   sourcePacket: SpectralPacket,
 *   spectralBasis: SpectralBasis,
 * }} The selected native profile facts.
 */
function selectNativeProfile(value) {
	const profile = value === undefined
		? DEFAULT_NATIVE_PRODUCTION_PROFILE
		: value;

	return {
		profile,
		sourcePacket: profile.spectral.sourceIrradianceDensity,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	};
}

/**
 * Check one direct-source sample against the selected native profile.
 *
 * @param {DirectLightingSample} directLighting - Supplies the source sample.
 * @param {SpectralPacket} sourcePacket - Supplies the profile packet.
 * @returns {UnitVector3} The checked source direction.
 */
function assertDirectLightingSemantics(directLighting, sourcePacket) {
	const sourceIrradiance = directLighting.sourceIrradiance;

	if (sourceIrradiance.values.some((value, index) => value !== sourcePacket.values[index])) {
		throw new TypeError(
			'distant-Sun source irradiance must match the selected native profile packet.',
		);
	}
	if (directLighting.sourceTransmittance !== undefined) {
		throw new TypeError(
			'distant-Sun primary radiance integrates source transmittance along each direct path.',
		);
	}

	return requireUnitVector(
		directLighting.directionToLight,
		'distant-Sun directionToLight',
	);
}

/**
 * Resolve physical collaborators once before allocating L1.
 *
 * @param {DistantSunPrimaryRadianceBuildRequest} request - Supplies build dependencies.
 * @returns {{
 *   atmosphere: DistantSunPrimaryScatteringAtmosphere,
 *   geometry: DistantSunPrimaryRadianceGeometry,
 *   lightSource: DistantSunPrimaryScatteringLightSource,
 *   calculator: DistantSunPrimaryRadianceCalculator,
 *   profile: NativeProductionProfile,
 *   spectralBasis: SpectralBasis,
 *   domainSelection: DistantSunConstructionDomainSelection,
 *   transportIntervalCount: number,
 *   id: string,
 *   provenanceIdentity: string,
 * }} The resolved build inputs.
 */
function resolveBuildRequest(request) {
	const { profile, sourcePacket, spectralBasis } = selectNativeProfile(request.profile);
	const domainSelection = request.domainSelection
		?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const atmosphere = request.atmosphere;
	const geometry = request.geometry;
	const lightSource = request.lightSource;
	const calculator = request.calculator;
	const directLighting = lightSource.sampleDirectLighting({ spectralBasis });
	assertDirectLightingSemantics(directLighting, sourcePacket);

	return {
		atmosphere,
		geometry,
		lightSource,
		calculator,
		profile,
		spectralBasis,
		domainSelection,
		transportIntervalCount: request.transportIntervalCount,
		id: request.id === undefined ? DISTANT_SUN_CPU_PURE_L1_ID : request.id,
		provenanceIdentity: request.provenanceIdentity === undefined
			? DISTANT_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY
			: request.provenanceIdentity,
	};
}

/**
 * Create the one canonical spectral calculator shared by direct L1,
 * later-order scattering, and stored-field transport for a source build.
 *
 * @param {DistantSunCpuSpectralCalculatorRequest} request - Supplies source-owned physical collaborators.
 * @returns {SpectralCalculator} Return the canonical calculator.
 */
export function createDistantSunCpuSpectralCalculator(request) {
	const { profile, spectralBasis } = selectNativeProfile(request.profile);

	return new SpectralCalculator({
		geometry: /** @type {GeometryModel} */ (
			/** @type {unknown} */ (request.geometry)
		),
		atmosphere: /** @type {AtmosphereModel} */ (
			/** @type {unknown} */ (request.atmosphere)
		),
		lightSource: /** @type {LightSourceModel} */ (request.lightSource),
		spectralBasis,
		executionControls: {
			pathIntervalCount: request.transportIntervalCount,
			sourceTransmittanceIntervalCount:
				profile.numerical.sourcePathTransmittance.intervalCount,
		},
	});
}

/**
 * Write one complete native-15 radiance sample into L1.
 *
 * @param {CpuDirectionalSpectralFieldWriter} writer - Supplies the field writer.
 * @param {number} positionIndex - Supplies the native position index.
 * @param {number} directionIndex - Supplies the Fibonacci direction index.
 * @param {readonly number[]} values - Supplies the computed spectral radiance.
 * @param {number} spectralChannelCount - Supplies the executable channel count.
 * @returns {void}
 */
function writeRadianceSpectrum(
	writer,
	positionIndex,
	directionIndex,
	values,
	spectralChannelCount,
) {
	for (let wavelengthIndex = 0;
		wavelengthIndex < spectralChannelCount;
		wavelengthIndex += 1) {
		writer.writeScalar({
			directionIndex,
			positionIndex,
			wavelengthIndex,
		}, values[wavelengthIndex]);
	}
}

/**
 * Build sealed physical pure L1 over native-48 x Fibonacci-34 x native-15.
 *
 * This ports the direct branch of Algorithm32-star `createL1Field`: every
 * unblocked incoming ray is evaluated through the production direct-radiance
 * calculator. It does not transport or sample a stored J1 field.
 *
 * @param {DistantSunPrimaryRadianceBuildRequest} request - Supplies the
 * native atmosphere, spherical geometry, distant source, and profile.
 * @returns {CpuDirectionalSpectralFieldContract} Sealed pure L1.
 */
export function buildDistantSunCpuPrimaryRadiance(request) {
	const {
		atmosphere,
		geometry,
		lightSource,
		calculator,
		profile,
		spectralBasis,
		domainSelection,
		transportIntervalCount,
		id,
		provenanceIdentity,
	} = resolveBuildRequest(request);
	const field = createDistantSunCpuPureRadianceField({
		id,
		order: 1,
		provenanceIdentity,
		domainSelection,
	});
	const writer = field.createWriter();
	writer.fill(0);

	try {
		for (const node of domainSelection.positionNodes) {
			for (let directionIndex = 0;
				directionIndex < domainSelection.incomingDirectionCount;
				directionIndex += 1) {
				const incomingDirection =
					geometry.expressPhysicalIncomingRadianceDirection(
						domainSelection.incomingUnitVectors[directionIndex],
					);
				const raySegment = geometry.resolveCacheBuildRay({
					coordinateKey:
						`native-${domainSelection.positionCount}`
						+ `-fibonacci-${domainSelection.incomingDirectionCount}`
						+ `:${node.index}:${directionIndex}`,
					coordinates: [node.index, directionIndex],
					altitudeBinIndex: node.index,
					directionIndex,
					altitude: node.coordinate,
					incomingDirection,
				});

				if (raySegment === null) {
					continue;
				}

				const path = calculator.buildEndpointTrapezoidPathIntegrationPoints(
					raySegment,
					transportIntervalCount,
				);
				const radiance = calculator.computeDirectRadiance(
					raySegment,
					path,
				).pathRadiance.values;
				writeRadianceSpectrum(
					writer,
					node.index,
					directionIndex,
					radiance,
					domainSelection.spectralChannelCount,
				);
			}
		}

		field.seal();
		return field;
	} catch (error) {
		if (field.isSealed === false) {
			writer.fill(0);
		}
		throw error;
	}
}
