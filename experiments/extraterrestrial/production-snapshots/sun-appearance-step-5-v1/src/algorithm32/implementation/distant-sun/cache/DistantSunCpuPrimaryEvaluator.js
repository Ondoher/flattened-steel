/**
 * Primary J1 and direct L1 evaluator for one configured distant-Sun provider.
 *
 * Numerical provenance source: the current production cache contract,
 * function `createL1Field`.
 * SHA-256: `98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a`.
 */

import {SpectralBasis} from '../../../spectral-values/index.js';
import {SpectralCalculator} from '../../../atmospheric-transport/spectral/SpectralCalculator.js';
import {
	DISTANT_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY,
	DISTANT_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY,
	DISTANT_SUN_CPU_PURE_J1_ID,
	DISTANT_SUN_CPU_PURE_L1_ID,
	DISTANT_SUN_PRIMARY_DIRECTION_TOLERANCE,
	DISTANT_SUN_PRIMARY_SCATTERING_DIRECTION_TOLERANCE,
	SOURCE_LOCAL_TOWARD_DISTANT_SUN,
} from './consts.js';
import DistantSunConstructionDomainSelection from './DistantSunConstructionDomainSelection.js';

/** Primary spectral, J1, direct L1, phase, and source-transmittance evaluator. */
export class DistantSunCpuPrimaryEvaluator {
	/**
	 * Configured physical source captured for the provider lifetime.
	 * @type {DistantSunCacheProviderSource}
	 */
	_source;
	/**
	 * Normalized source configuration captured for the provider lifetime.
	 * @type {DistantSunLightSourceConfiguration}
	 */
	_configuration;
	/**
	 * Provider-owned field allocation operations.
	 * @type {DistantSunCpuPrimaryFieldAllocators}
	 */
	_fieldAllocators;

	/**
	 * Creates a primary evaluator for one configured distant-Sun provider.
	 *
	 * @param {DistantSunCacheProviderSource} source - Configured physical source facade.
	 * @param {DistantSunLightSourceConfiguration} configuration - Normalized source configuration.
	 * @param {DistantSunCpuPrimaryFieldAllocators} fieldAllocators - Provider-owned field allocation operations.
	 */
	constructor(source, configuration, fieldAllocators) {
		this._source = source;
		this._configuration = configuration;
		this._fieldAllocators = fieldAllocators;
	}

	/**
	 * Called by primary evaluation to require a normalized three-component direction.
	 *
	 * @param {UnitVector3} value - Candidate physical direction.
	 * @param {string} label - Diagnostic label for an invalid direction.
	 * @returns {UnitVector3} - Accepted normalized direction.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_requireUnitVector(value, label) {
		const magnitude = Math.hypot(value[0], value[1], value[2]);
		if (!Number.isFinite(magnitude) || Math.abs(magnitude - 1) > DISTANT_SUN_PRIMARY_DIRECTION_TOLERANCE) {
			throw new RangeError(`${label} must be normalized.`);
		}

		return value;
	}

	/**
	 * Called by primary evaluation to select profile-owned spectral facts.
	 *
	 * @param {SharedModel} model - Aggregate execution model.
	 * @returns {DistantSunCpuPrimaryProfileFacts} - Selected profile, source packet, and basis.
	 */
	_selectProfile(model) {
		const profile = model.profile;

		return {
			profile,
			sourcePacket: profile.spectral.sourceIrradianceDensity,
			spectralBasis: profile.spectral.basis,
		};
	}

	/**
	 * Called by direct L1 evaluation to check one direct-source sample against
	 * the selected native profile.
	 *
	 * @param {DirectLightingSample} directLighting - Direct-light sample from the configured source.
	 * @param {SpectralPacket} sourcePacket - Profile-owned source irradiance packet.
	 * @returns {UnitVector3} - Accepted physical source direction.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_assertDirectLightingSemantics(directLighting, sourcePacket) {
		const sourceIrradiance = directLighting.sourceIrradiance;

		if (
			sourceIrradiance.values.some(
				/**
				 * Called by Array.prototype.some to test one collection value for a matching condition.
				 * @param value - The value accepted by the operation.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (value, index) => value !== sourcePacket.values[index],
			)
		) {
			throw new TypeError('distant-Sun source irradiance must match the selected native profile packet.');
		}
		if (directLighting.sourceTransmittance !== undefined) {
			throw new TypeError('distant-Sun primary radiance integrates source transmittance along each direct path.');
		}

		return this._requireUnitVector(directLighting.directionToLight, 'distant-Sun directionToLight');
	}

	/**
	 * Called by direct L1 evaluation to resolve physical collaborators and
	 * identities before output allocation. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {DistantSunCpuPrimaryRadianceEvaluationRequest} request - Direct-radiance evaluation request.
	 * @returns {DistantSunCpuPrimaryRadianceInputs} - Accepted direct-radiance inputs.
	 */
	_resolvePrimaryRadianceBuildRequest(request) {
		const model = request.model;
		const {profile, sourcePacket, spectralBasis} = this._selectProfile(model);
		const domainSelection = DistantSunConstructionDomainSelection.fromProfile(profile);
		const atmosphere = /** @type {DistantSunPrimaryScatteringAtmosphere} */ (model.atmosphere);
		const geometry = /** @type {DistantSunPrimaryRadianceGeometry} */ (/** @type {unknown} */ (model.geometry));
		const lightSource = /** @type {DistantSunPrimaryScatteringLightSource} */ (model.lightSource);
		const calculator = request.calculator;
		const directLighting = lightSource.sampleDirectLighting({spectralBasis});
		this._assertDirectLightingSemantics(directLighting, sourcePacket);

		return {
			atmosphere,
			geometry,
			lightSource,
			calculator,
			profile,
			spectralBasis,
			domainSelection,
			transportIntervalCount: profile.numerical.cacheConstruction.transportIntervalCount,
			id: request.id === undefined ? DISTANT_SUN_CPU_PURE_L1_ID : request.id,
			provenanceIdentity:
				request.provenanceIdentity === undefined
					? DISTANT_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY
					: request.provenanceIdentity,
			onProgress: request.onProgress,
		};
	}

	/**
	 * Called by direct L1 evaluation to write one complete spectral sample into
	 * the output field in wavelength-index order.
	 *
	 * @param {CpuDirectionalSpectralFieldWriter} writer - Mutable output-field writer.
	 * @param {number} positionIndex - Selected position index.
	 * @param {number} directionIndex - Selected incoming-direction index.
	 * @param {readonly number[]} values - Computed spectral radiance values.
	 * @param {number} spectralChannelCount - Executable spectral channel count.
	 * @returns {void} - No value.
	 */
	_writeRadianceSpectrum(writer, positionIndex, directionIndex, values, spectralChannelCount) {
		for (let wavelengthIndex = 0; wavelengthIndex < spectralChannelCount; wavelengthIndex += 1) {
			writer.writeScalar(
				{
					directionIndex,
					positionIndex,
					wavelengthIndex,
				},
				values[wavelengthIndex],
			);
		}
	}

	/**
	 * Call this method to create the canonical spectral calculator shared by
	 * direct L1, later-order scattering, and stored-field transport.
	 *
	 * @param {DistantSunCpuSpectralCalculatorEvaluationRequest} request - Physical calculator collaborators.
	 * @returns {SpectralCalculator} - Configured canonical calculator.
	 */
	createSpectralCalculator(request) {
		return new SpectralCalculator({model: request.model});
	}

	/**
	 * Call this method to build sealed physical pure L1 over the selected
	 * position, incoming-direction, and spectral domains. Allocation and loop
	 * order match the promoted direct-primary implementation.
	 *
	 * @param {DistantSunCpuPrimaryRadianceEvaluationRequest} request - Direct-primary physical collaborators.
	 * @returns {CpuDirectionalSpectralFieldContract} - Sealed pure L1 field.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	buildPrimaryRadiance(request) {
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
			onProgress,
		} = this._resolvePrimaryRadianceBuildRequest(request);
		const field = this._fieldAllocators.createPureRadianceField({
			id,
			order: 1,
			provenanceIdentity,
			domainSelection,
		});
		const writer = field.createWriter();
		writer.fill(0);

		try {
			for (const node of domainSelection.positionNodes) {
				for (
					let directionIndex = 0;
					directionIndex < domainSelection.incomingDirectionCount;
					directionIndex += 1
				) {
					const incomingDirection = geometry.expressPhysicalIncomingRadianceDirection(
						domainSelection.incomingUnitVectors[directionIndex],
					);
					const raySegment = geometry.resolveCacheBuildRay({
						coordinateKey:
							`native-${domainSelection.positionCount}` +
							`-fibonacci-${domainSelection.incomingDirectionCount}` +
							`:${node.index}:${directionIndex}`,
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
					const radiance = calculator.computeDirectRadiance(raySegment, path).pathRadiance.values;
					this._writeRadianceSpectrum(
						writer,
						node.index,
						directionIndex,
						radiance,
						domainSelection.spectralChannelCount,
					);
				}
				onProgress?.({
					phase: 'transport',
					order: 1,
					completed: node.index + 1,
					total: domainSelection.positionCount,
				});
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

	/**
	 * Called by primary J1 evaluation to preserve the normalized-direction
	 * numerical contract for one typed physical direction.
	 *
	 * @param {UnitVector3} direction - Typed physical direction.
	 * @param {string} label - Diagnostic label for an invalid direction.
	 * @returns {void} - No value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_assertNormalizedDirection(direction, label) {
		const length = Math.hypot(direction[0], direction[1], direction[2]);
		if (!Number.isFinite(length) || Math.abs(length - 1) > DISTANT_SUN_PRIMARY_SCATTERING_DIRECTION_TOLERANCE) {
			throw new RangeError(`${label} must be normalized.`);
		}
	}

	/**
	 * Called by primary J1 evaluation to require an atmosphere aligned with the selected basis.
	 *
	 * @param {DistantSunPrimaryScatteringAtmosphere} atmosphere - Atmosphere spectral owner.
	 * @returns {void} - No value.
	 */
	_assertAtmosphereBasis(atmosphere, spectralBasis) {
		SpectralBasis.assertCompatible(
			atmosphere.spectralBasis,
			spectralBasis,
			'distant-Sun primary scattering atmosphere basis',
		);
	}

	/**
	 * Called by primary J1 evaluation to resolve trusted physical collaborators,
	 * defaults, and output identities before allocation. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {DistantSunCpuPrimaryScatteringEvaluationRequest} request - Primary-scattering evaluation request.
	 * @returns {DistantSunCpuPrimaryScatteringInputs} - Accepted primary-scattering inputs.
	 */
	_resolvePrimaryScatteringBuildRequest(request) {
		const model = request.model;
		const profile = model.profile;
		const sourcePacket = profile.spectral.sourceIrradianceDensity;
		const domainSelection = DistantSunConstructionDomainSelection.fromProfile(profile);
		const atmosphere = /** @type {DistantSunPrimaryScatteringAtmosphere} */ (model.atmosphere);
		const geometry = /** @type {DistantSunPrimaryScatteringGeometry} */ (model.geometry);
		const lightSource = /** @type {DistantSunPrimaryScatteringLightSource} */ (model.lightSource);

		this._assertAtmosphereBasis(atmosphere, profile.spectral.basis);

		return {
			atmosphere,
			geometry,
			lightSource,
			profile,
			sourcePacket,
			domainSelection,
			id: request.id === undefined ? DISTANT_SUN_CPU_PURE_J1_ID : request.id,
			provenanceIdentity:
				request.provenanceIdentity === undefined
					? DISTANT_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY
					: request.provenanceIdentity,
			onProgress: request.onProgress,
		};
	}

	/**
	 * Called by primary J1 evaluation to bind direct-source channel values to the
	 * selected native profile packet.
	 *
	 * @param {DirectLightingSample} directLighting - Direct-light sample from the configured source.
	 * @param {SpectralPacket} sourcePacket - Profile-owned source irradiance packet.
	 * @returns {DistantSunCpuDirectLightingInputs} - Accepted irradiance values and source direction.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_resolveDirectLighting(directLighting, sourcePacket) {
		const sourceIrradiance = directLighting.sourceIrradiance;
		SpectralBasis.assertCompatible(
			sourceIrradiance.basis,
			sourcePacket.basis,
			'distant-Sun source irradiance basis',
		);

		if (
			sourceIrradiance.values.some(
				/**
				 * Called by Array.prototype.some to test one collection value for a matching condition.
				 * @param value - The value accepted by the operation.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (value, index) => value !== sourcePacket.values[index],
			)
		) {
			throw new TypeError('distant-Sun source irradiance must match the selected native profile packet.');
		}
		this._assertNormalizedDirection(directLighting.directionToLight, 'distant-Sun directionToLight');

		return {
			sourceIrradianceWattsPerSquareMeterPerNanometer: sourceIrradiance.values,
			directionToLight: directLighting.directionToLight,
		};
	}

	/**
	 * Called by primary J1 evaluation to resolve sample-to-source transmittance
	 * for one physical position.
	 *
	 * @param {DistantSunCpuSourceTransmittanceRequest} request - Source-path physical facts.
	 * @returns {readonly number[]} - Source-path spectral transmittance.
	 */
	_resolveSourceTransmittance(request) {
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
	 * Called by primary J1 evaluation to compute one physical spectral
	 * scattering-density scalar.
	 *
	 * @param {number} sourceIrradianceWattsPerSquareMeterPerNanometer - Top-of-atmosphere irradiance density.
	 * @param {number} sourceTransmittance - Sample-to-source survival fraction.
	 * @param {number} rayleighScatteringPerMeter - Local Rayleigh scattering coefficient.
	 * @param {number} mieScatteringPerMeter - Local Mie scattering coefficient.
	 * @param {number} rayleighPhasePerSteradian - Rayleigh phase value.
	 * @param {number} miePhasePerSteradian - Mie phase value.
	 * @returns {number} - Local scattering density in W m^-3 sr^-1 nm^-1.
	 */
	_primaryScatteringDensity(
		sourceIrradianceWattsPerSquareMeterPerNanometer,
		sourceTransmittance,
		rayleighScatteringPerMeter,
		mieScatteringPerMeter,
		rayleighPhasePerSteradian,
		miePhasePerSteradian,
	) {
		return (
			sourceTransmittance *
			sourceIrradianceWattsPerSquareMeterPerNanometer *
			(rayleighScatteringPerMeter * rayleighPhasePerSteradian + mieScatteringPerMeter * miePhasePerSteradian)
		);
	}

	/**
	 * Call this method to build sealed physical pure J1 over the selected
	 * position, outgoing-direction, and spectral domains. Source-local phase
	 * samples are constructed once and retained for the ordered field loops.
	 *
	 * @param {DistantSunCpuPrimaryScatteringEvaluationRequest} request - Primary-scattering physical collaborators.
	 * @returns {CpuDirectionalSpectralFieldContract} - Sealed pure J1 field.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	buildPrimaryScatteringDensity(request) {
		const {
			atmosphere,
			geometry,
			lightSource,
			profile,
			sourcePacket,
			domainSelection,
			id,
			provenanceIdentity,
			onProgress,
		} = this._resolvePrimaryScatteringBuildRequest(request);
		const directLighting = lightSource.sampleDirectLighting({
			spectralBasis: profile.spectral.basis,
		});
		const {sourceIrradianceWattsPerSquareMeterPerNanometer, directionToLight} = this._resolveDirectLighting(
			directLighting,
			sourcePacket,
		);
		const sourcePathLimit = lightSource.resolveSourcePathLimit({directLighting});
		const intervalCount = profile.numerical.sourcePathTransmittance.intervalCount;
		const channelCount = sourcePacket.values.length;
		const sourceLocalPhaseSamples = domainSelection.outgoingUnitVectors.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param viewDirection - The view direction value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (viewDirection) =>
				atmosphere.samplePhase({
					viewDirection,
					incomingDirection: SOURCE_LOCAL_TOWARD_DISTANT_SUN,
				}),
		);
		const field = this._fieldAllocators.createPureScatteringDensityField({
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
					coordinateKey: `native-${domainSelection.positionCount}-position:${node.index}`,
					coordinates: [node.index],
					altitudeBinIndex: node.index,
					altitude: node.coordinate,
					incomingDirection: directionToLight,
				});

				if (raySegment === null) {
					onProgress?.({
						phase: 'primary-scattering',
						order: 1,
						completed: node.index + 1,
						total: domainSelection.positionCount,
					});
					continue;
				}

				const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(raySegment.ray.origin);
				const medium = atmosphere.sampleMedium(atmosphereCoordinate);
				const rayleighScatteringPerMeter = medium.rayleighScattering.values;
				const mieScatteringPerMeter = medium.mieScattering.values;
				if (
					!rayleighScatteringPerMeter.some(
						/**
						 * Called by Array.prototype.some to test one collection value for a matching condition.
						 * @param value - The value accepted by the operation.
						 * @param index - The zero-based index accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ (value, index) => value > 0 || mieScatteringPerMeter[index] > 0,
					)
				) {
					onProgress?.({
						phase: 'primary-scattering',
						order: 1,
						completed: node.index + 1,
						total: domainSelection.positionCount,
					});
					continue;
				}
				const transmittance = this._resolveSourceTransmittance({
					atmosphere,
					geometry,
					raySegment,
					sourcePathLimit,
					intervalCount,
				});

				for (
					let directionIndex = 0;
					directionIndex < domainSelection.outgoingDirectionCount;
					directionIndex += 1
				) {
					const phase = sourceLocalPhaseSamples[directionIndex];

					for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
						writer.writeScalar(
							{
								directionIndex,
								positionIndex: node.index,
								wavelengthIndex,
							},
							this._primaryScatteringDensity(
								sourceIrradianceWattsPerSquareMeterPerNanometer[wavelengthIndex],
								transmittance[wavelengthIndex],
								rayleighScatteringPerMeter[wavelengthIndex],
								mieScatteringPerMeter[wavelengthIndex],
								phase.rayleighPhase.value,
								phase.miePhase.value,
							),
						);
					}
				}
				onProgress?.({
					phase: 'primary-scattering',
					order: 1,
					completed: node.index + 1,
					total: domainSelection.positionCount,
				});
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
}
