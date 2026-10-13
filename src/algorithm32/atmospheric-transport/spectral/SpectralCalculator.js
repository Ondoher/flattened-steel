import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket as SpectralPacketClass,
	SpectralBasis as SpectralBasisClass,
	UnitMath,
} from '../../spectral-values/index.js';
import ArrayMath from '../../math/ArrayMath.js';
import DistanceMath from '../../math/DistanceMath.js';

/** Object that owns reusable spectral calculations shared by reference evaluation and source-owned CPU cache construction. */
export class SpectralCalculator {
	/**
	 * Called by SpectralCalculator to create deterministic provenance for one result.
	 *
	 * @param {string} operation - Supplies the operation identity.
	 * @param {readonly string[]} inputs - Supplies accepted packet identities.
	 * @param {readonly (string | number)[]} [parameters] - Supplies normalized parameters.
	 * @returns {string} - The derived provenance identity.
	 */
	_calculatorProvenance(operation, inputs, parameters = []) {
		return ['algorithm32-spectral-calculator', operation, ...inputs, ...parameters.map(String)].join(':');
	}

	/**
	 * Called by SpectralCalculator to accept one inverse-solid-angle value without conversion.
	 *
	 * @param {unknown} value - Supplies the candidate value.
	 * @param {string} label - Supplies the diagnostic label.
	 * @returns {InverseSolidAngle} - The accepted value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_acceptInverseSolidAngle(value, label) {
		const accepted = UnitMath.assertUnitValue(value, label);
		if (accepted.units !== SPECTRAL_UNITS.INVERSE_SOLID_ANGLE) {
			throw new TypeError(`${label} must use ${SPECTRAL_UNITS.INVERSE_SOLID_ANGLE}.`);
		}

		return /** @type {InverseSolidAngle} */ (accepted);
	}

	/**
	 * Called by SpectralCalculator to create zero-valued binary64 working storage.
	 *
	 * This implementation-only operation handles values whose physical
	 * interpretation has already been accepted at an owning boundary. It does
	 * no validation and never publishes a unitless spectral value.
	 *
	 * @param {number} channelCount - Supplies the accepted spectral channel count.
	 * @returns {Float64Array<ArrayBuffer>} - Zero-valued working storage.
	 */
	_zeroSpectralValues(channelCount) {
		return new Float64Array(channelCount);
	}

	/**
	 * Called by SpectralCalculator to create unit-valued binary64 working storage.
	 *
	 * @param {number} channelCount - Supplies the accepted spectral channel count.
	 * @returns {Float64Array<ArrayBuffer>} - Unit-valued working storage.
	 */
	_oneSpectralValues(channelCount) {
		return new Float64Array(channelCount).fill(1);
	}

	/**
	 * Called by SpectralCalculator to convert finite optical depth to transmittance.
	 *
	 * @param {ArrayLike<number>} opticalDepth - Supplies dimensionless optical depth.
	 * @returns {Float64Array<ArrayBuffer>} - Dimensionless transmittance.
	 */
	_sourceTransmittanceValues(opticalDepth) {
		return Float64Array.from(opticalDepth, (value) => Math.exp(-value));
	}

	/**
	 * Called by SpectralCalculator to compute trapezoid transmittance over one meter segment.
	 *
	 * @param {ArrayLike<number>} previousExtinctionPerMeter - Supplies previous endpoint extinction.
	 * @param {ArrayLike<number>} currentExtinctionPerMeter - Supplies current endpoint extinction.
	 * @param {number} intervalLengthMeters - Supplies normalized segment length.
	 * @returns {Float64Array<ArrayBuffer>} - Dimensionless segment transmittance.
	 */
	_trapezoidSegmentTransmittanceValues(previousExtinctionPerMeter, currentExtinctionPerMeter, intervalLengthMeters) {
		return Float64Array.from(previousExtinctionPerMeter, (previous, index) =>
			Math.exp(-0.5 * (previous + currentExtinctionPerMeter[index]) * intervalLengthMeters),
		);
	}

	/**
	 * Called by SpectralCalculator to combine scattering coefficients with phase values.
	 *
	 * @param {ArrayLike<number>} rayleighScatteringPerMeter - Supplies Rayleigh scattering.
	 * @param {ArrayLike<number>} mieScatteringPerMeter - Supplies Mie scattering.
	 * @param {number} rayleighPhasePerSteradian - Supplies Rayleigh phase.
	 * @param {number} miePhasePerSteradian - Supplies Mie phase.
	 * @returns {Float64Array<ArrayBuffer>} - Phase-weighted scattering in m^-1 sr^-1.
	 */
	_phaseWeightedScatteringValues(
		rayleighScatteringPerMeter,
		mieScatteringPerMeter,
		rayleighPhasePerSteradian,
		miePhasePerSteradian,
	) {
		return Float64Array.from(
			rayleighScatteringPerMeter,
			(rayleigh, index) =>
				rayleigh * rayleighPhasePerSteradian + mieScatteringPerMeter[index] * miePhasePerSteradian,
		);
	}

	/**
	 * Called by SpectralCalculator to compute direct in-scattering over one meter path measure.
	 *
	 * @param {ArrayLike<number>} viewTransmittance - Supplies observer survival.
	 * @param {ArrayLike<number>} sourceTransmittance - Supplies source-path survival.
	 * @param {ArrayLike<number>} sourceIrradianceWattsPerSquareMeterPerNanometer - Supplies source irradiance density.
	 * @param {ArrayLike<number>} scatteringPerMeterPerSteradian - Supplies phase-weighted scattering.
	 * @param {number} measureMeters - Supplies normalized path measure.
	 * @returns {Float64Array<ArrayBuffer>} - Radiance density values.
	 */
	_directInScatteringValues(
		viewTransmittance,
		sourceTransmittance,
		sourceIrradianceWattsPerSquareMeterPerNanometer,
		scatteringPerMeterPerSteradian,
		measureMeters,
	) {
		return Float64Array.from(
			viewTransmittance,
			(viewSurvival, index) =>
				viewSurvival *
				sourceTransmittance[index] *
				sourceIrradianceWattsPerSquareMeterPerNanometer[index] *
				scatteringPerMeterPerSteradian[index] *
				measureMeters,
		);
	}

	/**
	 * Called by SpectralCalculator to accumulate one spectrum into working storage.
	 *
	 * @param {Float64Array<ArrayBufferLike>} target - Supplies mutable accumulation storage.
	 * @param {ArrayLike<number>} contribution - Supplies the contribution.
	 * @returns {void} -
	 */
	_accumulateSpectralValues(target, contribution) {
		for (let index = 0; index < target.length; index += 1) {
			target[index] += contribution[index];
		}
	}

	/**
	 * Creates a spectral calculator from stable calculation collaborators.
	 *
	 * @param {SpectralCalculatorDependencies} dependencies - Supplies exactly one execution model or genuine packet-arithmetic basis.
	 *
	 */
	constructor(dependencies) {
		if (!dependencies || (dependencies.model === undefined) === (dependencies.spectralBasis === undefined))
			throw new TypeError('Supply exactly one execution model or genuine spectral basis.');
		if (dependencies.spectralBasis !== undefined) SpectralBasisClass.assert(dependencies.spectralBasis);
		this._dependencies = {...dependencies};
	}

	/** Call this method to create shared packet/phase arithmetic from a genuine spectral basis.
	 * Model-dependent ray operations require a full execution model.

	 *
	 * @param {SpectralBasis} basis - Accepted physical spectral interpretation.
	 * @returns {SpectralCalculator} - Calculator without a fabricated execution profile.
	 * @throws {TypeError} - The basis is not a validated spectral basis.
	 */
	static forScatteringBasis(basis) {
		return new SpectralCalculator({spectralBasis: SpectralBasisClass.assert(basis)});
	}

	/**
	 * Value that returns the stable calculation dependencies.
	 *
	 * @returns {SpectralCalculatorDependencies} - The calculator dependencies.
	 */
	get dependencies() {
		return this._dependencies;
	}

	/**
	 * Called by spectral calculator to accept one packet with an exact interpretation and basis. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {unknown} value - Supplies the candidate packet.
	 * @param {SpectralQuantity} quantity - Supplies the expected quantity.
	 * @param {SpectralUnits} units - Supplies the expected units.
	 * @param {SpectralBasis | undefined} [basis] - Supplies the expected basis.
	 * @returns {SpectralPacket} - The accepted packet.
	 */
	_acceptPacket(
		value,
		quantity,
		units,
		basis = this.dependencies.spectralBasis ?? this.dependencies.model?.profile.spectral.basis,
	) {
		return SpectralPacketClass.assert(value, basis === undefined ? {quantity, units} : {quantity, units, basis});
	}

	/**
	 * Call this method to build endpoint/trapezoid integration points for a geometry-resolved finite ray segment.
	 *
	 * @param {RaySegment} viewRaySegment - Supplies the geometry-resolved ray segment.
	 * @param {number} pathIntervalCount - Supplies the number of uniform intervals.
	 * @returns {readonly PathIntegrationPoint[]} - The path integration points.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	buildEndpointTrapezoidPathIntegrationPoints(viewRaySegment, pathIntervalCount) {
		if (!Number.isInteger(pathIntervalCount) || pathIntervalCount < 1) {
			throw new RangeError('pathIntervalCount must be a positive integer.');
		}
		if (this.dependencies.model?.profile.numerical.viewPath?.kind === 'local-positive-column-v1')
			return new PositiveColumnViewTransport().createPathPoints(
				viewRaySegment,
				pathIntervalCount,
				/** @type {PositiveColumnViewAtmosphere} */ (this.dependencies.model.atmosphere),
			);

		const startDistanceMeters = DistanceMath.toMeters(viewRaySegment.startDistance);
		const endDistanceMeters = DistanceMath.toMeters(viewRaySegment.endDistance);

		const intervalLengthMeters = (endDistanceMeters - startDistanceMeters) / pathIntervalCount;
		const points = [];

		for (let pointIndex = 0; pointIndex <= pathIntervalCount; pointIndex += 1) {
			const isEndpoint = pointIndex === 0 || pointIndex === pathIntervalCount;
			const trapezoidWeight = isEndpoint ? 0.5 : 1;

			points.push({
				pointIndex,
				distanceAlongRay: DistanceMath.inMeters(startDistanceMeters + intervalLengthMeters * pointIndex),
				intervalLengthFromPrevious: DistanceMath.inMeters(pointIndex === 0 ? 0 : intervalLengthMeters),
				trapezoidWeight,
				measure: DistanceMath.inMeters(intervalLengthMeters * trapezoidWeight),
			});
		}

		return points;
	}

	/** Build quadratic interval boundaries and one distance midpoint per interval. */
	buildQuadraticMidpointPathIntegrationPoints(viewRaySegment, pathIntervalCount) {
		if (!Number.isInteger(pathIntervalCount) || pathIntervalCount < 1) {
			throw new RangeError('pathIntervalCount must be a positive integer.');
		}
		const startDistanceMeters = DistanceMath.toMeters(viewRaySegment.startDistance);
		const endDistanceMeters = DistanceMath.toMeters(viewRaySegment.endDistance);
		const pathLengthMeters = endDistanceMeters - startDistanceMeters;

		return Array.from({length: pathIntervalCount}, (_unused, pointIndex) => {
			const lowerFraction = pointIndex / pathIntervalCount;
			const upperFraction = (pointIndex + 1) / pathIntervalCount;
			const lowerDistanceMeters = startDistanceMeters + pathLengthMeters * lowerFraction * lowerFraction;
			const upperDistanceMeters = startDistanceMeters + pathLengthMeters * upperFraction * upperFraction;
			const intervalLengthMeters = upperDistanceMeters - lowerDistanceMeters;
			return {
				integrationKind: /** @type {const} */ ('quadratic-midpoint'),
				pointIndex,
				distanceAlongRay: DistanceMath.inMeters(0.5 * (lowerDistanceMeters + upperDistanceMeters)),
				intervalLengthFromPrevious: DistanceMath.inMeters(intervalLengthMeters),
				trapezoidWeight: 1,
				measure: DistanceMath.inMeters(intervalLengthMeters),
			};
		});
	}

	/**
	 * Call this method to compute source-path transmittance from finite source optical depth.
	 *
	 * @param {SpectralOpticalDepthPacket} sourceOpticalDepth - Supplies optical depth.
	 * @returns {SpectralTransmittancePacket} - The source transmittance.
	 */
	computeSourceTransmittance(sourceOpticalDepth) {
		const opticalDepth = /** @type {SpectralOpticalDepthPacket} */ (
			/** @type {unknown} */ (
				this._acceptPacket(sourceOpticalDepth, SPECTRAL_QUANTITIES.OPTICAL_DEPTH, SPECTRAL_UNITS.DIMENSIONLESS)
			)
		);

		return /** @type {SpectralTransmittancePacket} */ (
			/** @type {unknown} */ (
				new SpectralPacketClass({
					basis: opticalDepth.basis,
					quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
					units: SPECTRAL_UNITS.DIMENSIONLESS,
					values: this._sourceTransmittanceValues(opticalDepth.values),
					provenanceIdentity: this._calculatorProvenance('source-transmittance', [opticalDepth.contentHash]),
				})
			)
		);
	}

	/**
	 * Call this method to compute endpoint/trapezoid transmittance for one view-path segment.
	 *
	 * @param {SpectralExtinctionCoefficientPacket} previousExtinction - Supplies previous extinction.
	 * @param {SpectralExtinctionCoefficientPacket} currentExtinction - Supplies current extinction.
	 * @param {Distance} intervalLength - Supplies the interval length.
	 * @returns {SpectralTransmittancePacket} - The segment transmittance.
	 */
	computeTrapezoidSegmentTransmittance(previousExtinction, currentExtinction, intervalLength) {
		const acceptedPrevious = /** @type {SpectralExtinctionCoefficientPacket} */ (
			/** @type {unknown} */ (
				this._acceptPacket(
					previousExtinction,
					SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
				)
			)
		);
		const acceptedCurrent = /** @type {SpectralExtinctionCoefficientPacket} */ (
			/** @type {unknown} */ (
				this._acceptPacket(
					currentExtinction,
					SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					acceptedPrevious.basis,
				)
			)
		);
		DistanceMath.assertDistance(intervalLength, 'intervalLength');
		const intervalLengthMeters = DistanceMath.toMeters(intervalLength);

		return /** @type {SpectralTransmittancePacket} */ (
			/** @type {unknown} */ (
				new SpectralPacketClass({
					basis: acceptedPrevious.basis,
					quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
					units: SPECTRAL_UNITS.DIMENSIONLESS,
					values: this._trapezoidSegmentTransmittanceValues(
						acceptedPrevious.values,
						acceptedCurrent.values,
						intervalLengthMeters,
					),
					provenanceIdentity: this._calculatorProvenance(
						'trapezoid-segment-transmittance',
						[acceptedPrevious.contentHash, acceptedCurrent.contentHash],
						[intervalLengthMeters],
					),
				})
			)
		);
	}

	/**
	 * Call this method to combine Rayleigh and Mie scattering coefficients with phase values.
	 *
	 * @param {SpectralScatteringCoefficientPacket} rayleighScattering - Supplies Rayleigh scattering.
	 * @param {SpectralScatteringCoefficientPacket} mieScattering - Supplies Mie scattering.
	 * @param {InverseSolidAngle} rayleighPhase - Supplies Rayleigh phase.
	 * @param {InverseSolidAngle} miePhase - Supplies Mie phase.
	 * @returns {SpectralPhaseWeightedScatteringCoefficientPacket} - Phase-weighted scattering.
	 */
	computeDirectScattering(rayleighScattering, mieScattering, rayleighPhase, miePhase) {
		const acceptedRayleigh = /** @type {SpectralScatteringCoefficientPacket} */ (
			/** @type {unknown} */ (
				this._acceptPacket(
					rayleighScattering,
					SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
				)
			)
		);
		const acceptedMie = /** @type {SpectralScatteringCoefficientPacket} */ (
			/** @type {unknown} */ (
				this._acceptPacket(
					mieScattering,
					SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					acceptedRayleigh.basis,
				)
			)
		);
		const acceptedRayleighPhase = this._acceptInverseSolidAngle(rayleighPhase, 'rayleighPhase');
		const acceptedMiePhase = this._acceptInverseSolidAngle(miePhase, 'miePhase');

		return /** @type {SpectralPhaseWeightedScatteringCoefficientPacket} */ (
			/** @type {unknown} */ (
				new SpectralPacketClass({
					basis: acceptedRayleigh.basis,
					quantity: SPECTRAL_QUANTITIES.PHASE_WEIGHTED_SCATTERING_COEFFICIENT,
					units: SPECTRAL_UNITS.INVERSE_LENGTH_SOLID_ANGLE,
					values: this._phaseWeightedScatteringValues(
						acceptedRayleigh.values,
						acceptedMie.values,
						acceptedRayleighPhase.value,
						acceptedMiePhase.value,
					),
					provenanceIdentity: this._calculatorProvenance(
						'phase-weighted-scattering',
						[acceptedRayleigh.contentHash, acceptedMie.contentHash],
						[acceptedRayleighPhase.value, acceptedMiePhase.value],
					),
				})
			)
		);
	}

	/**
	 * Call this method to compute direct light-source in-scattering for one path point.
	 *
	 * @param {SpectralTransmittancePacket} viewTransmittance - Supplies observer survival.
	 * @param {SpectralTransmittancePacket} sourceTransmittance - Supplies source survival.
	 * @param {SpectralIrradiancePacket} sourceIrradiance - Supplies source irradiance.
	 * @param {SpectralPhaseWeightedScatteringCoefficientPacket} scattering - Supplies scattering.
	 * @param {Distance} measure - Supplies effective path measure.
	 * @returns {SpectralRadiancePacket} - The direct in-scattering contribution.
	 */
	computeDirectInScattering(viewTransmittance, sourceTransmittance, sourceIrradiance, scattering, measure) {
		const acceptedView = /** @type {SpectralTransmittancePacket} */ (
			/** @type {unknown} */ (
				this._acceptPacket(viewTransmittance, SPECTRAL_QUANTITIES.TRANSMITTANCE, SPECTRAL_UNITS.DIMENSIONLESS)
			)
		);
		const acceptedSource = /** @type {SpectralTransmittancePacket} */ (
			/** @type {unknown} */ (
				this._acceptPacket(
					sourceTransmittance,
					SPECTRAL_QUANTITIES.TRANSMITTANCE,
					SPECTRAL_UNITS.DIMENSIONLESS,
					acceptedView.basis,
				)
			)
		);
		const acceptedIrradiance = /** @type {SpectralIrradiancePacket} */ (
			/** @type {unknown} */ (
				this._acceptPacket(
					sourceIrradiance,
					SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
					SPECTRAL_UNITS.IRRADIANCE_DENSITY,
					acceptedView.basis,
				)
			)
		);
		const acceptedScattering = /** @type {SpectralPhaseWeightedScatteringCoefficientPacket} */ (
			/** @type {unknown} */ (
				this._acceptPacket(
					scattering,
					SPECTRAL_QUANTITIES.PHASE_WEIGHTED_SCATTERING_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH_SOLID_ANGLE,
					acceptedView.basis,
				)
			)
		);
		DistanceMath.assertDistance(measure, 'measure');
		const measureMeters = DistanceMath.toMeters(measure);

		return /** @type {SpectralRadiancePacket} */ (
			/** @type {unknown} */ (
				new SpectralPacketClass({
					basis: acceptedView.basis,
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values: this._directInScatteringValues(
						acceptedView.values,
						acceptedSource.values,
						acceptedIrradiance.values,
						acceptedScattering.values,
						measureMeters,
					),
					provenanceIdentity: this._calculatorProvenance(
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
			)
		);
	}

	/**
	 * Call this method to compute source-owned direct-primary radiance for cache construction. This operation retains the selected direct `L1` construction algorithm. Final-view evaluation uses `computeRadiance` and never calls this method.
	 *
	 * @param {RaySegment} viewRaySegment - Supplies the geometry-resolved segment.
	 * @param {readonly PathIntegrationPoint[]} pathIntegrationPoints - Supplies the integration schedule.
	 * @returns {PathRadiance} - The direct-primary path result.
	 */
	computeDirectRadiance(viewRaySegment, pathIntegrationPoints) {
		const {model} = this.dependencies;
		if (!model) throw new TypeError('An execution model is required for direct ray transport.');
		const {geometry, atmosphere, lightSource} = model;
		const acceptedSpectralBasis = /** @type {SpectralBasis} */ (model.profile.spectral.basis);
		const channelCount = acceptedSpectralBasis.channelCount;
		const pathRadianceValues = this._zeroSpectralValues(channelCount);
		/** @type {Float64Array<ArrayBufferLike>} */
		let viewTransmittanceValues = this._oneSpectralValues(channelCount);
		/** @type {AtmosphereSample | null} */
		let previousMedium = null;

		for (const point of pathIntegrationPoints) {
			const distanceAlongRayMeters = DistanceMath.toMeters(point.distanceAlongRay);
			const intervalLengthFromPreviousMeters = DistanceMath.toMeters(point.intervalLengthFromPrevious);
			const measureMeters = DistanceMath.toMeters(point.measure);
			const position = DistanceMath.positionAlongRay(
				/** @type {Position} */ (viewRaySegment.ray.origin),
				viewRaySegment.ray.direction,
				distanceAlongRayMeters,
			);
			const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(position);
			const medium = atmosphere.sampleMedium(atmosphereCoordinate);

			if (previousMedium) {
				const segmentTransmittanceValues = this._trapezoidSegmentTransmittanceValues(
					previousMedium.extinction.values,
					medium.extinction.values,
					intervalLengthFromPreviousMeters,
				);
				viewTransmittanceValues = ArrayMath.multiplyToFloat64(
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
				sampleCount: model.profile.numerical.sourcePathTransmittance.intervalCount,
			});
			const sourceOpticalDepth = atmosphere.integrateOpticalDepth(sourceAtmospherePath);
			const sourceTransmittance = directLighting.sourceTransmittance ?? sourceOpticalDepth.transmittance;
			const directPhase = atmosphere.samplePhase({
				viewDirection: viewRaySegment.ray.direction,
				incomingDirection: directLighting.directionToLight,
			});
			const directScatteringValues = this._phaseWeightedScatteringValues(
				medium.rayleighScattering.values,
				medium.mieScattering.values,
				directPhase.rayleighPhase.value,
				directPhase.miePhase.value,
			);
			const directContributionValues = this._directInScatteringValues(
				viewTransmittanceValues,
				sourceTransmittance.values,
				directLighting.sourceIrradiance.values,
				directScatteringValues,
				measureMeters,
			);
			this._accumulateSpectralValues(pathRadianceValues, directContributionValues);
			previousMedium = medium;
		}

		return {
			pathRadiance: /** @type {SpectralRadiancePacket} */ (
				/** @type {unknown} */ (
					new SpectralPacketClass({
						basis: acceptedSpectralBasis,
						quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
						units: SPECTRAL_UNITS.RADIANCE_DENSITY,
						values: pathRadianceValues,
						provenanceIdentity: this._calculatorProvenance('path-radiance', [
							acceptedSpectralBasis.contentHash,
						]),
					})
				)
			),
			transmittance: /** @type {SpectralTransmittancePacket} */ (
				/** @type {unknown} */ (
					new SpectralPacketClass({
						basis: acceptedSpectralBasis,
						quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
						units: SPECTRAL_UNITS.DIMENSIONLESS,
						values: viewTransmittanceValues,
						provenanceIdentity: this._calculatorProvenance('view-transmittance', [
							acceptedSpectralBasis.contentHash,
						]),
					})
				)
			),
		};
	}

	/**
	 * Call this method to integrate one cumulative local scattering-density cache along a geometry-resolved view ray. At every path point this follows the selected production final-view order: update view transmittance, resolve the actual-node position stencil, express and reconstruct the outgoing W27 direction, issue exactly one cumulative cache query, then multiply by path measure and accumulate.
	 *
	 * @param {RaySegment} viewRaySegment - Supplies the geometry-resolved segment.
	 * @param {readonly PathIntegrationPoint[]} pathIntegrationPoints - Supplies the integration schedule.
	 * @param {ComputeRadianceOptions} options - Supplies the cumulative CPU cache.
	 * @returns {PathRadiance} - The cumulative path-radiance result.
	 */
	computeRadiance(viewRaySegment, pathIntegrationPoints, options) {
		const {model} = this.dependencies;
		if (!model) throw new TypeError('An execution model is required for cumulative ray transport.');
		if (model.profile.numerical.viewPath?.kind === 'local-positive-column-v1')
			return new PositiveColumnViewTransport().computeRadiance({
				model,
				atmosphere: /** @type {PositiveColumnViewAtmosphere} */ (model.atmosphere),
				segment: viewRaySegment,
				points: pathIntegrationPoints,
				scatteringCache: options.scatteringCache,
			});
		const {geometry, atmosphere} = model;
		const scatteringCache = options.scatteringCache;
		const cacheContentIdentity = scatteringCache.sampleProvenanceIdentity;
		const acceptedSpectralBasis = /** @type {SpectralBasis} */ (model.profile.spectral.basis);
		const channelCount = acceptedSpectralBasis.channelCount;
		const pathRadianceValues = this._zeroSpectralValues(channelCount);
		/** @type {Float64Array<ArrayBufferLike>} */
		let viewTransmittanceValues = this._oneSpectralValues(channelCount);
		/** @type {AtmosphereSample | null} */
		let previousMedium = null;

		for (const point of pathIntegrationPoints) {
			const distanceAlongRayMeters = DistanceMath.toMeters(point.distanceAlongRay);
			const intervalLengthFromPreviousMeters = DistanceMath.toMeters(point.intervalLengthFromPrevious);
			const position = DistanceMath.positionAlongRay(
				/** @type {Position} */ (viewRaySegment.ray.origin),
				viewRaySegment.ray.direction,
				distanceAlongRayMeters,
			);
			const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(position);
			const medium = atmosphere.sampleMedium(atmosphereCoordinate);
			const isQuadraticMidpoint = point.integrationKind === 'quadratic-midpoint';

			if (isQuadraticMidpoint) {
				const halfIntervalTransmittanceValues = Float64Array.from(medium.extinction.values, (value) =>
					Math.exp(-0.5 * value * intervalLengthFromPreviousMeters),
				);
				viewTransmittanceValues = ArrayMath.multiplyToFloat64(
					viewTransmittanceValues,
					halfIntervalTransmittanceValues,
				);
			}

			if (!isQuadraticMidpoint && previousMedium) {
				const segmentTransmittanceValues = this._trapezoidSegmentTransmittanceValues(
					previousMedium.extinction.values,
					medium.extinction.values,
					intervalLengthFromPreviousMeters,
				);
				viewTransmittanceValues = ArrayMath.multiplyToFloat64(
					viewTransmittanceValues,
					segmentTransmittanceValues,
				);
			}

			const scatteringDensity = scatteringCache.sampleCumulativeScatteringDensity({
				context: {
					position,
					atmosphereCoordinate,
					physicalOutgoingDirection: viewRaySegment.ray.direction,
				},
				geometry,
			});
			const measureMeters = DistanceMath.toMeters(point.measure);

			for (let channelIndex = 0; channelIndex < pathRadianceValues.length; channelIndex += 1) {
				pathRadianceValues[channelIndex] +=
					viewTransmittanceValues[channelIndex] * scatteringDensity.values[channelIndex] * measureMeters;
			}
			if (isQuadraticMidpoint) {
				const halfIntervalTransmittanceValues = Float64Array.from(medium.extinction.values, (value) =>
					Math.exp(-0.5 * value * intervalLengthFromPreviousMeters),
				);
				viewTransmittanceValues = ArrayMath.multiplyToFloat64(
					viewTransmittanceValues,
					halfIntervalTransmittanceValues,
				);
			}

			previousMedium = medium;
		}

		return {
			pathRadiance: /** @type {SpectralRadiancePacket} */ (
				/** @type {unknown} */ (
					new SpectralPacketClass({
						basis: acceptedSpectralBasis,
						quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
						units: SPECTRAL_UNITS.RADIANCE_DENSITY,
						values: pathRadianceValues,
						provenanceIdentity: this._calculatorProvenance('cumulative-cache-path-radiance', [
							acceptedSpectralBasis.contentHash,
							cacheContentIdentity,
						]),
					})
				)
			),
			transmittance: /** @type {SpectralTransmittancePacket} */ (
				/** @type {unknown} */ (
					new SpectralPacketClass({
						basis: acceptedSpectralBasis,
						quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
						units: SPECTRAL_UNITS.DIMENSIONLESS,
						values: viewTransmittanceValues,
						provenanceIdentity: this._calculatorProvenance('view-transmittance', [
							acceptedSpectralBasis.contentHash,
						]),
					})
				)
			),
		};
	}
}
import {PositiveColumnViewTransport} from '../PositiveColumnViewTransport.js';
