import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	assertSpectralPacket,
	assertUnitValue,
	createSpectralPacket,
} from '../quantities/index.js';
import DistanceMath from '../utils/DistanceMath.js';
import VectorMath from '../utils/VectorMath.js';
import {
	accumulateSpectralValues,
	directInScatteringValues,
	multiplySpectralValues,
	oneSpectralValues,
	phaseWeightedScatteringValues,
	sourceTransmittanceValues,
	trapezoidSegmentTransmittanceValues,
	zeroSpectralValues,
} from './spectralNumericKernels.js';

/**
 * Create deterministic provenance for one calculator result.
 *
 * @param {string} operation - Supplies the operation identity.
 * @param {readonly string[]} inputs - Supplies accepted packet identities.
 * @param {readonly (string | number)[]} [parameters] - Supplies normalized parameters.
 * @returns {string} The derived provenance identity.
 */
function calculatorProvenance(operation, inputs, parameters = []) {
	return [
		'algorithm32-spectral-calculator',
		operation,
		...inputs,
		...parameters.map(String),
	].join(':');
}

/**
 * Accept one inverse-solid-angle value without converting its physical unit.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {InverseSolidAngle} The accepted value.
 */
function acceptInverseSolidAngle(value, label) {
	const accepted = assertUnitValue(value, label);
	if (accepted.units !== SPECTRAL_UNITS.INVERSE_SOLID_ANGLE) {
		throw new TypeError(`${label} must use ${SPECTRAL_UNITS.INVERSE_SOLID_ANGLE}.`);
	}

	return /** @type {InverseSolidAngle} */ (accepted);
}
/**
 * Own reusable spectral calculations shared by reference evaluation and
 * source-owned CPU cache construction.
 */
export class SpectralCalculator {
	/**
	 * Create a spectral calculator from stable calculation collaborators.
	 *
	 * @param {SpectralCalculatorDependencies} [dependencies] - Supplies
	 * geometry, atmosphere, light-source, spectral, and execution facts.
	 */
	constructor(dependencies = {}) {
		if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) {
			throw new TypeError('SpectralCalculator dependencies must be an object when supplied.');
		}

		this._dependencies = { ...dependencies };
	}

	/**
	 * Return the stable calculation dependencies.
	 *
	 * @returns {SpectralCalculatorDependencies} The calculator dependencies.
	 */
	get dependencies() {
		return this._dependencies;
	}

	/**
	 * Accept one packet with an exact interpretation and basis.
	 *
	 * @param {unknown} value - Supplies the candidate packet.
	 * @param {SpectralQuantity} quantity - Supplies the expected quantity.
	 * @param {SpectralUnits} units - Supplies the expected units.
	 * @param {SpectralBasis | undefined} [basis] - Supplies the expected basis.
	 * @returns {SpectralPacket} The accepted packet.
	 */
	_acceptPacket(value, quantity, units, basis = this.dependencies.spectralBasis) {
		return assertSpectralPacket(value, basis === undefined
			? { quantity, units }
			: { quantity, units, basis });
	}

	/**
	 * Convert a production position packet into meter coordinates and add a
	 * normalized meter scale along one direction.
	 *
	 * @param {Position} origin - Supplies the ray origin.
	 * @param {UnitVector3} direction - Supplies the ray direction.
	 * @param {number} scaleMeters - Supplies the normalized scale.
	 * @returns {Position} The calculated position in meters.
	 */
	_addScaled(origin, direction, scaleMeters) {
		const originMeters = DistanceMath.toMetersPosition(origin);
		const positionMeters = VectorMath.addScaled(originMeters, direction, scaleMeters);

		return {
			coordinates: [positionMeters[0], positionMeters[1], positionMeters[2]],
			units: 'meters',
		};
	}

	/**
	 * Assert that a ray segment has the shape needed for transport.
	 *
	 * @param {RaySegment} raySegment - Supplies the candidate ray segment.
	 * @returns {void}
	 */
	_assertRaySegment(raySegment) {
		if (!raySegment || typeof raySegment !== 'object') {
			throw new TypeError('RaySegment must be an object.');
		}

		const { ray, startDistance, endDistance } = raySegment;

		if (!ray || !Array.isArray(ray.direction)) {
			throw new TypeError('RaySegment.ray must include a position and direction tuple.');
		}

		DistanceMath.assertPosition(ray.origin, 'RaySegment.ray.origin');
		DistanceMath.assertDistance(startDistance, 'RaySegment.startDistance');
		DistanceMath.assertDistance(endDistance, 'RaySegment.endDistance');

		if (ray.direction.length !== 3
			|| ray.direction.some((value) => !Number.isFinite(value))) {
			throw new TypeError('Ray direction must be a finite three-component tuple.');
		}
	}

	/**
	 * Assert that required collaborators are present.
	 *
	 * @param {Record<string, unknown>} collaborators - Supplies collaborators by name.
	 * @returns {void}
	 */
	_assertCollaborators(collaborators) {
		for (const [name, collaborator] of Object.entries(collaborators)) {
			if (!collaborator) {
				throw new TypeError(`SpectralCalculator requires ${name} to compute radiance.`);
			}
		}
	}

	/**
	 * Assert that path integration points are usable.
	 *
	 * @param {readonly PathIntegrationPoint[]} points - Supplies candidate points.
	 * @returns {void}
	 */
	_assertPathIntegrationPoints(points) {
		if (!Array.isArray(points) || points.length < 1) {
			throw new TypeError('Path integration points must be a non-empty array.');
		}

		for (const point of points) {
			if (!Number.isInteger(point.pointIndex)) {
				throw new TypeError('Path integration points must contain integer point indices.');
			}

			DistanceMath.assertDistance(
				point.distanceAlongRay,
				'PathIntegrationPoint.distanceAlongRay',
			);
			DistanceMath.assertDistance(
				point.intervalLengthFromPrevious,
				'PathIntegrationPoint.intervalLengthFromPrevious',
			);
			DistanceMath.assertDistance(point.measure, 'PathIntegrationPoint.measure');
		}
	}

	/**
	 * Build endpoint/trapezoid integration points for a geometry-resolved
	 * finite ray segment.
	 *
	 * @param {RaySegment} viewRaySegment - Supplies the geometry-resolved ray segment.
	 * @param {number} pathIntervalCount - Supplies the number of uniform intervals.
	 * @returns {readonly PathIntegrationPoint[]} The path integration points.
	 */
	buildEndpointTrapezoidPathIntegrationPoints(viewRaySegment, pathIntervalCount) {
		this._assertRaySegment(viewRaySegment);

		if (!Number.isInteger(pathIntervalCount) || pathIntervalCount < 1) {
			throw new RangeError('pathIntervalCount must be a positive integer.');
		}

		const startDistanceMeters = DistanceMath.toMeters(viewRaySegment.startDistance);
		const endDistanceMeters = DistanceMath.toMeters(viewRaySegment.endDistance);

		if (endDistanceMeters < startDistanceMeters) {
			throw new RangeError(
				'RaySegment endDistance must be greater than or equal to startDistance.',
			);
		}

		const intervalLengthMeters = (endDistanceMeters - startDistanceMeters)
			/ pathIntervalCount;
		const points = [];

		for (let pointIndex = 0; pointIndex <= pathIntervalCount; pointIndex += 1) {
			const isEndpoint = pointIndex === 0 || pointIndex === pathIntervalCount;
			const trapezoidWeight = isEndpoint ? 0.5 : 1;

			points.push({
				pointIndex,
				distanceAlongRay: DistanceMath.inMeters(
					startDistanceMeters + intervalLengthMeters * pointIndex,
				),
				intervalLengthFromPrevious: DistanceMath.inMeters(
					pointIndex === 0 ? 0 : intervalLengthMeters,
				),
				trapezoidWeight,
				measure: DistanceMath.inMeters(intervalLengthMeters * trapezoidWeight),
			});
		}

		return points;
	}

	/**
	 * Compute source-path transmittance from finite source optical depth.
	 *
	 * @param {SpectralOpticalDepthPacket} sourceOpticalDepth - Supplies optical depth.
	 * @returns {SpectralTransmittancePacket} The source transmittance.
	 */
	computeSourceTransmittance(sourceOpticalDepth) {
		const opticalDepth = /** @type {SpectralOpticalDepthPacket} */ (
			/** @type {unknown} */ (this._acceptPacket(
				sourceOpticalDepth,
				SPECTRAL_QUANTITIES.OPTICAL_DEPTH,
				SPECTRAL_UNITS.DIMENSIONLESS,
			))
		);

		return /** @type {SpectralTransmittancePacket} */ (/** @type {unknown} */ (
			createSpectralPacket({
				basis: opticalDepth.basis,
				quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				values: sourceTransmittanceValues(opticalDepth.values),
				provenanceIdentity: calculatorProvenance(
					'source-transmittance',
					[opticalDepth.contentHash],
				),
			})
		));
	}

	/**
	 * Compute endpoint/trapezoid transmittance for one view-path segment.
	 *
	 * @param {SpectralExtinctionCoefficientPacket} previousExtinction - Supplies previous extinction.
	 * @param {SpectralExtinctionCoefficientPacket} currentExtinction - Supplies current extinction.
	 * @param {Distance} intervalLength - Supplies the interval length.
	 * @returns {SpectralTransmittancePacket} The segment transmittance.
	 */
	computeTrapezoidSegmentTransmittance(
		previousExtinction,
		currentExtinction,
		intervalLength,
	) {
		const acceptedPrevious = /** @type {SpectralExtinctionCoefficientPacket} */ (
			/** @type {unknown} */ (this._acceptPacket(
				previousExtinction,
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
			))
		);
		const acceptedCurrent = /** @type {SpectralExtinctionCoefficientPacket} */ (
			/** @type {unknown} */ (this._acceptPacket(
				currentExtinction,
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				acceptedPrevious.basis,
			))
		);
		DistanceMath.assertDistance(intervalLength, 'intervalLength');
		const intervalLengthMeters = DistanceMath.toMeters(intervalLength);

		return /** @type {SpectralTransmittancePacket} */ (/** @type {unknown} */ (
			createSpectralPacket({
				basis: acceptedPrevious.basis,
				quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				values: trapezoidSegmentTransmittanceValues(
					acceptedPrevious.values,
					acceptedCurrent.values,
					intervalLengthMeters,
				),
				provenanceIdentity: calculatorProvenance(
					'trapezoid-segment-transmittance',
					[acceptedPrevious.contentHash, acceptedCurrent.contentHash],
					[intervalLengthMeters],
				),
			})
		));
	}

	/**
	 * Combine Rayleigh and Mie scattering coefficients with phase values.
	 *
	 * @param {SpectralScatteringCoefficientPacket} rayleighScattering - Supplies Rayleigh scattering.
	 * @param {SpectralScatteringCoefficientPacket} mieScattering - Supplies Mie scattering.
	 * @param {InverseSolidAngle} rayleighPhase - Supplies Rayleigh phase.
	 * @param {InverseSolidAngle} miePhase - Supplies Mie phase.
	 * @returns {SpectralPhaseWeightedScatteringCoefficientPacket} Phase-weighted scattering.
	 */
	computeDirectScattering(
		rayleighScattering,
		mieScattering,
		rayleighPhase,
		miePhase,
	) {
		const acceptedRayleigh = /** @type {SpectralScatteringCoefficientPacket} */ (
			/** @type {unknown} */ (this._acceptPacket(
				rayleighScattering,
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
			))
		);
		const acceptedMie = /** @type {SpectralScatteringCoefficientPacket} */ (
			/** @type {unknown} */ (this._acceptPacket(
				mieScattering,
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				acceptedRayleigh.basis,
			))
		);
		const acceptedRayleighPhase = acceptInverseSolidAngle(
			rayleighPhase,
			'rayleighPhase',
		);
		const acceptedMiePhase = acceptInverseSolidAngle(miePhase, 'miePhase');

		return /** @type {SpectralPhaseWeightedScatteringCoefficientPacket} */ (
			/** @type {unknown} */ (createSpectralPacket({
				basis: acceptedRayleigh.basis,
				quantity: SPECTRAL_QUANTITIES.PHASE_WEIGHTED_SCATTERING_COEFFICIENT,
				units: SPECTRAL_UNITS.INVERSE_LENGTH_SOLID_ANGLE,
				values: phaseWeightedScatteringValues(
					acceptedRayleigh.values,
					acceptedMie.values,
					acceptedRayleighPhase.value,
					acceptedMiePhase.value,
				),
				provenanceIdentity: calculatorProvenance(
					'phase-weighted-scattering',
					[acceptedRayleigh.contentHash, acceptedMie.contentHash],
					[acceptedRayleighPhase.value, acceptedMiePhase.value],
				),
			}))
		);
	}

	/**
	 * Compute direct light-source in-scattering for one path point.
	 *
	 * @param {SpectralTransmittancePacket} viewTransmittance - Supplies observer survival.
	 * @param {SpectralTransmittancePacket} sourceTransmittance - Supplies source survival.
	 * @param {SpectralIrradiancePacket} sourceIrradiance - Supplies source irradiance.
	 * @param {SpectralPhaseWeightedScatteringCoefficientPacket} scattering - Supplies scattering.
	 * @param {Distance} measure - Supplies effective path measure.
	 * @returns {SpectralRadiancePacket} The direct in-scattering contribution.
	 */
	computeDirectInScattering(
		viewTransmittance,
		sourceTransmittance,
		sourceIrradiance,
		scattering,
		measure,
	) {
		const acceptedView = /** @type {SpectralTransmittancePacket} */ (
			/** @type {unknown} */ (this._acceptPacket(
				viewTransmittance,
				SPECTRAL_QUANTITIES.TRANSMITTANCE,
				SPECTRAL_UNITS.DIMENSIONLESS,
			))
		);
		const acceptedSource = /** @type {SpectralTransmittancePacket} */ (
			/** @type {unknown} */ (this._acceptPacket(
				sourceTransmittance,
				SPECTRAL_QUANTITIES.TRANSMITTANCE,
				SPECTRAL_UNITS.DIMENSIONLESS,
				acceptedView.basis,
			))
		);
		const acceptedIrradiance = /** @type {SpectralIrradiancePacket} */ (
			/** @type {unknown} */ (this._acceptPacket(
				sourceIrradiance,
				SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				SPECTRAL_UNITS.IRRADIANCE_DENSITY,
				acceptedView.basis,
			))
		);
		const acceptedScattering = /** @type {SpectralPhaseWeightedScatteringCoefficientPacket} */ (
			/** @type {unknown} */ (this._acceptPacket(
				scattering,
				SPECTRAL_QUANTITIES.PHASE_WEIGHTED_SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH_SOLID_ANGLE,
				acceptedView.basis,
			))
		);
		DistanceMath.assertDistance(measure, 'measure');
		const measureMeters = DistanceMath.toMeters(measure);

		return /** @type {SpectralRadiancePacket} */ (/** @type {unknown} */ (
			createSpectralPacket({
				basis: acceptedView.basis,
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				values: directInScatteringValues(
					acceptedView.values,
					acceptedSource.values,
					acceptedIrradiance.values,
					acceptedScattering.values,
					measureMeters,
				),
				provenanceIdentity: calculatorProvenance(
					'direct-in-scattering',
					[
						acceptedView.contentHash,
						acceptedSource.contentHash,
						acceptedIrradiance.contentHash,
						acceptedScattering.contentHash,
					],
					[measureMeters],
				),
			})
		));
	}

	/**
	 * Compute source-owned direct-primary radiance for cache construction.
	 *
	 * This operation retains the selected direct `L1` construction algorithm.
	 * Final-view evaluation uses `computeRadiance` and never calls this method.
	 *
	 * @param {RaySegment} viewRaySegment - Supplies the geometry-resolved segment.
	 * @param {readonly PathIntegrationPoint[]} pathIntegrationPoints - Supplies the integration schedule.
	 * @returns {PathRadiance} The direct-primary path result.
	 */
	computeDirectRadiance(viewRaySegment, pathIntegrationPoints) {
		this._assertRaySegment(viewRaySegment);
		this._assertPathIntegrationPoints(pathIntegrationPoints);

		const {
			geometry,
			atmosphere,
			lightSource,
			spectralBasis,
			executionControls,
		} = this.dependencies;
		this._assertCollaborators({ geometry, atmosphere, lightSource, spectralBasis });

		const acceptedSpectralBasis = /** @type {SpectralBasis} */ (spectralBasis);
		const channelCount = acceptedSpectralBasis.channelCount;
		const pathRadianceValues = zeroSpectralValues(channelCount);
		let viewTransmittanceValues = oneSpectralValues(channelCount);
		/** @type {AtmosphereSample | null} */
		let previousMedium = null;

		for (const point of pathIntegrationPoints) {
			const distanceAlongRayMeters = DistanceMath.toMeters(point.distanceAlongRay);
			const intervalLengthFromPreviousMeters = DistanceMath.toMeters(
				point.intervalLengthFromPrevious,
			);
			const measureMeters = DistanceMath.toMeters(point.measure);
			const position = this._addScaled(
				/** @type {Position} */ (viewRaySegment.ray.origin),
				viewRaySegment.ray.direction,
				distanceAlongRayMeters,
			);
			const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(position);
			const medium = atmosphere.sampleMedium(atmosphereCoordinate);

			if (previousMedium) {
				const segmentTransmittanceValues = trapezoidSegmentTransmittanceValues(
					previousMedium.extinction.values,
					medium.extinction.values,
					intervalLengthFromPreviousMeters,
				);
				viewTransmittanceValues = multiplySpectralValues(
					viewTransmittanceValues,
					segmentTransmittanceValues,
				);
			}

			const sourceRelativePosition = geometry.resolveSourceRelativePosition({
				position,
				atmosphereCoordinate,
				viewDirection: viewRaySegment.ray.direction,
			});
			const directLighting = lightSource.sampleDirectLighting({
				sourceRelativePosition,
				atmosphereCoordinate,
				spectralBasis: acceptedSpectralBasis,
			});
			const sourcePathLimit = lightSource.resolveSourcePathLimit({
				sourceRelativePosition,
				directLighting,
			});
			const sourceAtmospherePath = geometry.resolveAtmospherePath({
				ray: {
					origin: position,
					direction: directLighting.directionToLight,
				},
				sourcePathLimit,
				sampleCount: executionControls?.sourceTransmittanceIntervalCount,
			});
			const sourceOpticalDepth = atmosphere.integrateOpticalDepth(sourceAtmospherePath);
			const sourceTransmittance = directLighting.sourceTransmittance
				?? sourceOpticalDepth.transmittance;
			const directPhase = atmosphere.samplePhase({
				viewDirection: viewRaySegment.ray.direction,
				incomingDirection: directLighting.directionToLight,
			});
			const directScatteringValues = phaseWeightedScatteringValues(
				medium.rayleighScattering.values,
				medium.mieScattering.values,
				directPhase.rayleighPhase.value,
				directPhase.miePhase.value,
			);
			const directContributionValues = directInScatteringValues(
				viewTransmittanceValues,
				sourceTransmittance.values,
				directLighting.sourceIrradiance.values,
				directScatteringValues,
				measureMeters,
			);
			accumulateSpectralValues(pathRadianceValues, directContributionValues);
			previousMedium = medium;
		}

		return {
			pathRadiance: /** @type {SpectralRadiancePacket} */ (/** @type {unknown} */ (
				createSpectralPacket({
					basis: acceptedSpectralBasis,
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values: pathRadianceValues,
					provenanceIdentity: calculatorProvenance(
						'path-radiance',
						[acceptedSpectralBasis.contentHash],
					),
				})
			)),
			transmittance: /** @type {SpectralTransmittancePacket} */ (
				/** @type {unknown} */ (createSpectralPacket({
					basis: acceptedSpectralBasis,
					quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
					units: SPECTRAL_UNITS.DIMENSIONLESS,
					values: viewTransmittanceValues,
					provenanceIdentity: calculatorProvenance(
						'view-transmittance',
						[acceptedSpectralBasis.contentHash],
					),
				}))
			),
		};
	}

	/**
	 * Integrate one cumulative local scattering-density cache along a
	 * geometry-resolved view ray.
	 *
	 * At every path point this follows the selected Star final-view order:
	 * update view transmittance, resolve the actual-node position stencil,
	 * express and reconstruct the outgoing W27 direction, issue exactly one
	 * cumulative cache query, then multiply by path measure and accumulate.
	 *
	 * @param {RaySegment} viewRaySegment - Supplies the geometry-resolved segment.
	 * @param {readonly PathIntegrationPoint[]} pathIntegrationPoints - Supplies the integration schedule.
	 * @param {ComputeRadianceOptions} options - Supplies the cumulative CPU cache.
	 * @returns {PathRadiance} The cumulative path-radiance result.
	 */
	computeRadiance(viewRaySegment, pathIntegrationPoints, options) {
		this._assertRaySegment(viewRaySegment);
		this._assertPathIntegrationPoints(pathIntegrationPoints);

		const {
			geometry,
			atmosphere,
			spectralBasis,
		} = this.dependencies;
		this._assertCollaborators({ geometry, atmosphere, spectralBasis });

		const scatteringCache = options.scatteringCache;
		const cacheContentIdentity = scatteringCache.descriptor.field.contentHash;
		const acceptedSpectralBasis = /** @type {SpectralBasis} */ (spectralBasis);
		const channelCount = acceptedSpectralBasis.channelCount;
		const pathRadianceValues = zeroSpectralValues(channelCount);
		let viewTransmittanceValues = oneSpectralValues(channelCount);
		/** @type {AtmosphereSample | null} */
		let previousMedium = null;

		for (const point of pathIntegrationPoints) {
			const distanceAlongRayMeters = DistanceMath.toMeters(point.distanceAlongRay);
			const intervalLengthFromPreviousMeters = DistanceMath.toMeters(
				point.intervalLengthFromPrevious,
			);
			const position = this._addScaled(
				/** @type {Position} */ (viewRaySegment.ray.origin),
				viewRaySegment.ray.direction,
				distanceAlongRayMeters,
			);
			const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(position);
			const medium = atmosphere.sampleMedium(atmosphereCoordinate);

			if (previousMedium) {
				const segmentTransmittanceValues = trapezoidSegmentTransmittanceValues(
					previousMedium.extinction.values,
					medium.extinction.values,
					intervalLengthFromPreviousMeters,
				);
				viewTransmittanceValues = multiplySpectralValues(
					viewTransmittanceValues,
					segmentTransmittanceValues,
				);
			}

			const positionStencil = geometry.resolveScatteringCachePositionStencil({
				position,
				atmosphereCoordinate,
			});
			const directionStencil = geometry.resolveScatteringCacheDirectionStencil({
				position,
				physicalOutgoingDirection: viewRaySegment.ray.direction,
			});
			const scatteringDensity = scatteringCache.sampleResolved({
				positionStencil,
				directionStencil,
			});
			const measureMeters = DistanceMath.toMeters(point.measure);

			for (let channelIndex = 0;
				channelIndex < pathRadianceValues.length;
				channelIndex += 1) {
				pathRadianceValues[channelIndex] += viewTransmittanceValues[channelIndex]
					* scatteringDensity.values[channelIndex]
					* measureMeters;
			}

			previousMedium = medium;
		}

		return {
			pathRadiance: /** @type {SpectralRadiancePacket} */ (/** @type {unknown} */ (
				createSpectralPacket({
					basis: acceptedSpectralBasis,
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values: pathRadianceValues,
					provenanceIdentity: calculatorProvenance(
						'cumulative-cache-path-radiance',
						[
							acceptedSpectralBasis.contentHash,
							cacheContentIdentity,
						],
					),
				})
			)),
			transmittance: /** @type {SpectralTransmittancePacket} */ (
				/** @type {unknown} */ (createSpectralPacket({
					basis: acceptedSpectralBasis,
					quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
					units: SPECTRAL_UNITS.DIMENSIONLESS,
					values: viewTransmittanceValues,
					provenanceIdentity: calculatorProvenance(
						'view-transmittance',
						[acceptedSpectralBasis.contentHash],
					),
				}))
			),
		};
	}
}
