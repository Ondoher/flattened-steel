import {CIE_1931_2_DEG_SOURCE_ROWS, FIGURE1_DISPLAY_CONSTANTS} from '../bruneton-color/consts.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralMath, SpectralPacket} from '../../spectral-values/index.js';
import AngleMath from '../../math/AngleMath.js';
import VectorMath from '../../math/VectorMath.js';

/** Photopic luminance at and above which fixed Bruneton remains the exact baseline. */
const PHOTOPIC_BASELINE_LUMINANCE = 5;

/** Published Ward visibility-model offset. */
const WARD_VISIBILITY_OFFSET = 1.219;

/** Published Ward luminance exponent. */
const WARD_LUMINANCE_EXPONENT = 0.4;

/** Published Ward visibility-gain exponent. */
const WARD_GAIN_EXPONENT = 2.5;

/** Production calculator for receiver-local light levels and exposure composition.
 * @implements {ReceiverEnvironmentCalculator}
 */
export class LocalLightLevelCalculator {
	/**
	 * Create a receiver-local calculator optionally bound to one configured primary source.
	 * @param {LocalLightLevelCalculatorConfiguration} [configuration] - Optional primary source owner.
	 */
	constructor(configuration = {}) {
		if (
			configuration.lightSource !== undefined &&
			typeof configuration.lightSource?.sampleDirectLighting !== 'function'
		) {
			throw new TypeError('Local light source must provide sampleDirectLighting.');
		}
		this._lightSource = configuration.lightSource ?? null;
	}

	/** @type {LightSourceModel | null} */
	_lightSource;

	/**
	 * Measure the configured primary source at the configured receiver.
	 *
	 * This input includes source-owned incident scale, finite-source distance
	 * falloff, geometry-owned horizon support, and atmosphere-owned source-path
	 * transmittance when the request supplies an atmosphere.
	 *
	 * @param {ConfiguredLocalDirectLightRequest} request - Geometry, observation, and optional roster.
	 * @returns {ConfiguredDirectNormalMeasurement} - Existing direct-normal result and source-center orientation.
	 */
	_measureConfiguredDirectNormal(request) {
		const {geometry, observerPosition, directSample, sourceIrradiance, elevationRadians, sourceCenterCosine} =
			this._sampleConfiguredDirectSource(request);
		let visibleFraction = null;
		const celestialGeometry = /** @type {GeometryModel & CelestialGeometryCapability} */ (geometry);

		if (request.celestialSources && typeof celestialGeometry.resolveCelestialPlacements === 'function') {
			const placement = celestialGeometry
				.resolveCelestialPlacements({roster: request.celestialSources, observation: request.observation})
				.find((candidate) => candidate.sourceId === this._lightSource.id);
			if (placement?.kind === 'distant-uniform-sun') {
				visibleFraction = placement.support.visibleFraction;
			}
		}

		if (visibleFraction === null) {
			const metadata = /** @type {ConfiguredDirectSourceMetadata} */ (directSample.metadata ?? {});
			let angularRadiusRadians = 0;
			if (metadata.angularRadius !== undefined) {
				angularRadiusRadians = AngleMath.toRadians(metadata.angularRadius);
			} else if (metadata.radius && metadata.safeDistance) {
				angularRadiusRadians = Math.asin(Math.min(1, metadata.radius.value / metadata.safeDistance.value));
			}
			visibleFraction =
				angularRadiusRadians > 0
					? this.visibleProjectedDiskFraction(elevationRadians, angularRadiusRadians)
					: elevationRadians > 0
						? 1
						: 0;
		}

		let supportedIrradiance = /** @type {SpectralIrradiancePacket} */ (
			new SpectralPacket({
				basis: sourceIrradiance.basis,
				quantity: sourceIrradiance.quantity,
				units: sourceIrradiance.units,
				semantics: sourceIrradiance.semantics,
				values: sourceIrradiance.values.map((value) => value * visibleFraction),
				provenanceIdentity: `receiver-local-direct-source:${sourceIrradiance.contentHash}:${visibleFraction}`,
			})
		);
		if (request.atmosphere) {
			const metadata = /** @type {ConfiguredDirectSourceMetadata} */ (directSample.metadata ?? {});
			const sourcePath = geometry.resolveAtmospherePath({
				ray: {origin: observerPosition, direction: directSample.directionToLight},
				sourcePathLimit: {
					maxDistance: metadata.distanceFromSource ?? null,
					reason:
						metadata.distanceFromSource === undefined || metadata.distanceFromSource === null
							? 'distant-source-to-atmosphere-boundary'
							: 'finite-local-source-distance',
				},
			});
			const transmittance =
				directSample.sourceTransmittance ?? request.atmosphere.integrateOpticalDepth(sourcePath).transmittance;
			supportedIrradiance = /** @type {SpectralIrradiancePacket} */ (
				new SpectralPacket({
					basis: supportedIrradiance.basis,
					quantity: supportedIrradiance.quantity,
					units: supportedIrradiance.units,
					semantics: supportedIrradiance.semantics,
					values: supportedIrradiance.values.map(
						(value, channelIndex) => value * transmittance.values[channelIndex],
					),
					provenanceIdentity: `atmosphere-transmitted-direct-source:${supportedIrradiance.contentHash}:${transmittance.contentHash}`,
				})
			);
		}
		return {directNormal: supportedIrradiance, sourceCenterCosine};
	}

	/**
	 * Measure the configured primary source through the retained direct-normal algorithm.
	 *
	 * @param {ConfiguredLocalDirectLightRequest} request - Geometry, observation, and optional roster.
	 * @returns {LocalDirectLightLevel} - Existing direct-normal spectral and photopic result.
	 */
	measureConfiguredDirectSource(request) {
		return this.measureDirectIrradiance(this._measureConfiguredDirectNormal(request).directNormal);
	}

	/**
	 * Publish the retained direct-normal result plus its separate horizontal projection.
	 *
	 * @param {ConfiguredLocalDirectLightRequest} request - Geometry, observation, and optional roster.
	 * @returns {ReceiverDirectLightMeasurement} - Receiver-local direct-normal and direct-horizontal light.
	 */
	measureConfiguredReceiverDirectLight(request) {
		const measuredDirect = this._measureConfiguredDirectNormal(request);
		const directNormal = measuredDirect.directNormal;
		const sourceCenterCosine = Math.max(0, measuredDirect.sourceCenterCosine);
		const directHorizontal = /** @type {SpectralIrradiancePacket} */ (
			SpectralMath.scaleSpectralPacket(directNormal, sourceCenterCosine, {
				provenanceIdentity: `receiver-direct-horizontal:${directNormal.contentHash}:source-center-cosine-${sourceCenterCosine}`,
			})
		);
		return {
			directNormal,
			directHorizontal,
			sourceCenterCosine,
			photopicDirectNormalIlluminance: this.measureDirectIrradiance(directNormal).photopicDirectIlluminance,
			photopicDirectHorizontalIlluminance:
				this.measureDirectIrradiance(directHorizontal).photopicDirectIlluminance,
		};
	}

	/**
	 * Combine compatible direct and diffuse receiver irradiance into one complete
	 * horizontal-light publication.
	 *
	 * @param {ReceiverLightCombinationRequest} request - Identity and complete component packets.
	 * @returns {ReceiverEnvironmentLightMeasurement} - Four-packet receiver-light state and photopic projections.
	 */
	combineReceiverLight(request) {
		if (typeof request?.identity !== 'string' || request.identity.length === 0) {
			throw new TypeError('Receiver-light identity must be a non-empty string.');
		}
		const directNormal = this._assertReceiverIrradiance(request.directNormal, 'direct-normal');
		const directHorizontal = this._assertReceiverIrradiance(request.directHorizontal, 'direct-horizontal');
		const diffuseHorizontal = this._assertReceiverIrradiance(request.diffuseHorizontal, 'diffuse-horizontal');
		SpectralPacket.assertCompatible(directNormal, directHorizontal, {
			sameQuantity: true,
			sameUnits: true,
			sameSemantics: true,
		});
		SpectralPacket.assertCompatible(directHorizontal, diffuseHorizontal, {
			sameQuantity: true,
			sameUnits: true,
			sameSemantics: true,
		});
		const totalHorizontal = /** @type {SpectralIrradiancePacket} */ (
			SpectralMath.addSpectralPackets(directHorizontal, diffuseHorizontal, {
				provenanceIdentity: `receiver-total-horizontal:${directHorizontal.contentHash}:${diffuseHorizontal.contentHash}`,
			})
		);
		const directNormalPhotopic = this.measureDirectIrradiance(directNormal);
		const directHorizontalPhotopic = this.measureDirectIrradiance(directHorizontal);
		const diffuseHorizontalPhotopic = this.measureDirectIrradiance(diffuseHorizontal);
		const totalHorizontalPhotopic = this.measureDirectIrradiance(totalHorizontal);
		const stellarAdaptationLuminance = request.stellarAdaptationLuminance ?? {value: 0, units: 'cd m^-2'};
		if (
			stellarAdaptationLuminance.units !== 'cd m^-2' ||
			!Number.isFinite(stellarAdaptationLuminance.value) ||
			stellarAdaptationLuminance.value < 0
		) {
			throw new RangeError('Stellar adaptation luminance must be finite, nonnegative, and use cd m^-2.');
		}

		return {
			identity: request.identity,
			directNormal,
			directHorizontal,
			diffuseHorizontal,
			totalHorizontal,
			photopicDirectNormalIlluminance: directNormalPhotopic.photopicDirectIlluminance,
			photopicDirectHorizontalIlluminance: directHorizontalPhotopic.photopicDirectIlluminance,
			photopicDiffuseHorizontalIlluminance: diffuseHorizontalPhotopic.photopicDirectIlluminance,
			photopicTotalHorizontalIlluminance: totalHorizontalPhotopic.photopicDirectIlluminance,
			totalHorizontalLuminanceProxy: totalHorizontalPhotopic.adaptingLuminanceProxy,
			stellarAdaptationLuminance: {...stellarAdaptationLuminance},
		};
	}

	/** Approximate the physical unmasked-sky median from the fixed receiver hemisphere samples. */
	measureMedianSkyLuminance(radiances) {
		if (!Array.isArray(radiances) || radiances.length === 0) {
			throw new RangeError('Sky adaptation requires at least one spectral-radiance sample.');
		}
		const luminances = radiances
			.map((candidate) => {
				const packet = SpectralPacket.assert(candidate, {
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				});
				if (!packet.values.every((value) => Number.isFinite(value) && value >= 0)) {
					throw new RangeError('Sky adaptation radiance must be finite and nonnegative.');
				}
				return packet.values.reduce((sum, value, channelIndex) => {
					const channel = packet.basis.channels[channelIndex];
					return (
						sum +
						value *
							channel.width.value *
							this._ciePhotopicResponseAt(channel.center.value) *
							FIGURE1_DISPLAY_CONSTANTS.maxLuminousEfficacy.value
					);
				}, 0);
			})
			.sort((left, right) => left - right);
		const middle = Math.floor(luminances.length / 2);
		const value =
			luminances.length % 2 === 0 ? (luminances[middle - 1] + luminances[middle]) / 2 : luminances[middle];
		return {value, units: /** @type {const} */ ('cd m^-2')};
	}

	/** Assert one finite nonnegative spectral irradiance packet. */
	_assertReceiverIrradiance(value, label) {
		const packet = /** @type {SpectralIrradiancePacket} */ (
			SpectralPacket.assert(value, {
				quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			})
		);
		if (packet.values.some((channel) => !Number.isFinite(channel) || channel < 0)) {
			throw new RangeError(`Receiver ${label} irradiance must be finite and nonnegative.`);
		}
		return packet;
	}

	/**
	 * Measure the configured source's photopic brightness before receiver support
	 * or adaptation policy. This is the radiometric scale for local scene light.
	 *
	 * @param {ConfiguredLocalDirectLightRequest} request - Geometry and observation inputs.
	 * @returns {UnitValue<'cd m^-2'>} - Full-source photopic E/pi brightness.
	 */
	measureSourceBrightness(request) {
		const {sourceIrradiance} = this._sampleConfiguredDirectSource(request);
		return this.measureDirectIrradiance(sourceIrradiance).adaptingLuminanceProxy;
	}

	/**
	 * Reduce receiver-local incoming spectral-radiance samples to one physical
	 * environmental spectral-irradiance packet.
	 *
	 * @param {ReceiverEnvironmentLightReductionRequest} request - Fixed quadrature radiance samples.
	 * @returns {SpectralIrradiancePacket} - Receiver-local environmental irradiance.
	 */
	measureEnvironmentIrradiance(request) {
		if (!request || !Array.isArray(request.samples) || request.samples.length === 0) {
			throw new TypeError('Receiver environment-light reduction requires radiance samples.');
		}
		const first = /** @type {SpectralRadiancePacket} */ (
			SpectralPacket.assert(request.samples[0].spectralRadiance, {
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			})
		);
		const values = new Float64Array(first.basis.channelCount);
		let weightSum = 0;

		for (const sample of request.samples) {
			const radiance = /** @type {SpectralRadiancePacket} */ (
				SpectralPacket.assert(sample.spectralRadiance, {
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				})
			);
			if (radiance.basis.contentHash !== first.basis.contentHash) {
				throw new TypeError('Receiver environment-light samples must share one spectral basis.');
			}
			if (radiance.values.some((value) => !Number.isFinite(value) || value < 0)) {
				throw new RangeError('Receiver environment-light radiance must be finite and nonnegative.');
			}
			const weight = sample.irradianceWeightSteradians;
			if (!Number.isFinite(weight) || weight <= 0) {
				throw new RangeError('Receiver environment-light irradiance weights must be positive and finite.');
			}
			weightSum += weight;
			for (let channelIndex = 0; channelIndex < values.length; channelIndex += 1) {
				values[channelIndex] += radiance.values[channelIndex] * weight;
			}
		}
		if (Math.abs(weightSum - Math.PI) > 1e-12) {
			throw new RangeError('Receiver environment-light irradiance weights must sum to pi steradians.');
		}

		return /** @type {SpectralIrradiancePacket} */ (
			new SpectralPacket({
				basis: first.basis,
				quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
				semantics: first.semantics,
				values,
				provenanceIdentity: `receiver-environment-irradiance:${first.basis.contentHash}:${request.samples.length}`,
			})
		);
	}

	/**
	 * Sample the configured source once and derive its receiver-local elevation.
	 *
	 * @param {ConfiguredLocalDirectLightRequest} request - Geometry and observation inputs.
	 * @returns {ConfiguredDirectSourceFacts} - Shared source facts.
	 */
	_sampleConfiguredDirectSource(request) {
		if (this._lightSource === null) {
			throw new Error('Configured direct-source measurement requires a light source.');
		}
		const geometry = request?.geometry;
		if (!geometry || typeof geometry.resolveSourceRelativePosition !== 'function') {
			throw new TypeError('Configured direct-source measurement requires source-relative geometry.');
		}
		const observerPosition = geometry.resolveViewRaySegment({direction: [0, 0, 1]}).ray.origin;
		const sourceRelativePosition = geometry.resolveSourceRelativePosition({position: observerPosition});
		const directSample = this._lightSource.sampleDirectLighting({sourceRelativePosition});
		const sourceIrradiance = /** @type {SpectralIrradiancePacket} */ (
			SpectralPacket.assert(directSample.sourceIrradiance, {
				quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			})
		);
		const receiverVector = observerPosition.coordinates;
		const up =
			VectorMath.length(receiverVector) > 0
				? VectorMath.normalize(receiverVector)
				: /** @type {UnitVector3} */ ([0, 0, 1]);
		const sourceCenterCosine = Math.max(-1, Math.min(1, VectorMath.dot(up, directSample.directionToLight)));
		const elevationRadians = Math.asin(sourceCenterCosine);

		return {geometry, observerPosition, directSample, sourceIrradiance, elevationRadians, sourceCenterCosine};
	}

	/**
	 * Derive one finite achromatic exposure modifier from receiver-local adapting luminance.
	 *
	 * The fixed Bruneton mapping is preserved exactly throughout the photopic range.
	 * Below that boundary, the normalized Ward visibility relationship provides a
	 * finite dark-adapted endpoint without replacing semantic zero with physical light.
	 *
	 * @param {UnitValue<'cd m^-2'>} adaptingLuminanceProxy - Receiver-local adapting luminance.
	 * @returns {number} - Positive achromatic exposure modifier.
	 */
	deriveExposureModifier(adaptingLuminanceProxy) {
		if (!adaptingLuminanceProxy || typeof adaptingLuminanceProxy !== 'object') {
			throw new TypeError('adaptingLuminanceProxy is required.');
		}
		if (adaptingLuminanceProxy.units !== 'cd m^-2') {
			throw new TypeError('adaptingLuminanceProxy.units must be "cd m^-2".');
		}
		const luminance = adaptingLuminanceProxy.value;
		if (!Number.isFinite(luminance) || luminance < 0) {
			throw new RangeError('adaptingLuminanceProxy.value must be finite and nonnegative.');
		}
		if (luminance >= PHOTOPIC_BASELINE_LUMINANCE) {
			return 1;
		}

		const baselineVisibility = WARD_VISIBILITY_OFFSET + PHOTOPIC_BASELINE_LUMINANCE ** WARD_LUMINANCE_EXPONENT;
		const localVisibility = WARD_VISIBILITY_OFFSET + luminance ** WARD_LUMINANCE_EXPONENT;
		return (baselineVisibility / localVisibility) ** WARD_GAIN_EXPONENT;
	}

	/**
	 * Combine the unchanged baseline exposure with one separate achromatic modifier.
	 *
	 * This operation does not select or smooth the modifier and does not mutate the
	 * supplied baseline. Those policies remain with the facade's adaptation owner.
	 *
	 * @param {LocalExposureModificationRequest} request - Baseline and caller-selected modifier.
	 * @returns {LocalExposureModification} - Auditable baseline, modifier, and effective exposure.
	 */
	modifyExposure(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('Exposure modification request is required.');
		}
		const {baselineExposure, exposureModifier = 1} = request;
		if (!Number.isFinite(baselineExposure) || baselineExposure <= 0) {
			throw new RangeError('baselineExposure must be positive and finite.');
		}
		if (!Number.isFinite(exposureModifier) || exposureModifier <= 0) {
			throw new RangeError('exposureModifier must be positive and finite.');
		}

		const effectiveExposure = baselineExposure * exposureModifier;
		if (!Number.isFinite(effectiveExposure) || effectiveExposure <= 0) {
			throw new RangeError('Modified exposure must be positive and finite.');
		}

		return {
			baselineExposure,
			exposureModifier,
			effectiveExposure,
		};
	}

	/**
	 * Interpolate the accepted one-nanometer CIE 1931 photopic response.
	 *
	 * @param {number} wavelengthNanometers - Wavelength within the accepted table.
	 * @returns {number} - Interpolated y-bar response.
	 */
	_ciePhotopicResponseAt(wavelengthNanometers) {
		const lowerWavelength = Math.floor(wavelengthNanometers);
		const upperWavelength = Math.ceil(wavelengthNanometers);
		const lower = CIE_1931_2_DEG_SOURCE_ROWS[lowerWavelength - 360];
		const upper = CIE_1931_2_DEG_SOURCE_ROWS[upperWavelength - 360];
		if (lower?.[0] !== lowerWavelength || upper?.[0] !== upperWavelength) {
			throw new RangeError(`CIE 1931 photopic response does not bracket ${wavelengthNanometers} nm.`);
		}

		const fraction = wavelengthNanometers - lowerWavelength;
		return lower[2] + (upper[2] - lower[2]) * fraction;
	}

	/**
	 * Resolve the projected visible fraction of a uniform circular disk at a flat local horizon.
	 *
	 * @param {number} elevationRadians - Disk-center elevation.
	 * @param {number} angularRadiusRadians - Positive disk angular radius.
	 * @returns {number} - Visible projected fraction in [0, 1].
	 */
	visibleProjectedDiskFraction(elevationRadians, angularRadiusRadians) {
		if (!Number.isFinite(elevationRadians)) {
			throw new RangeError('elevationRadians must be finite.');
		}
		if (!Number.isFinite(angularRadiusRadians) || angularRadiusRadians <= 0) {
			throw new RangeError('angularRadiusRadians must be positive and finite.');
		}

		const normalizedHeight = elevationRadians / angularRadiusRadians;
		if (normalizedHeight >= 1) return 1;
		if (normalizedHeight <= -1) return 0;
		return (
			(Math.acos(-normalizedHeight) + normalizedHeight * Math.sqrt(1 - normalizedHeight * normalizedHeight)) /
			Math.PI
		);
	}

	/**
	 * Measure photopic direct illuminance from spectral irradiance.
	 *
	 * @param {SpectralIrradiancePacket} spectralIrradiance - Local direct spectral irradiance density.
	 * @param {number} [adaptingLuminanceFloor] - Nonnegative floor for the coarse luminance proxy.
	 * @returns {LocalDirectLightLevel} - Direct-light spectral and photopic measures.
	 */
	measureDirectIrradiance(spectralIrradiance, adaptingLuminanceFloor = 0) {
		const packet = /** @type {SpectralIrradiancePacket} */ (
			SpectralPacket.assert(spectralIrradiance, {
				quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			})
		);
		if (!packet.values.every((value) => value >= 0)) {
			throw new RangeError('Local direct spectral irradiance must be nonnegative.');
		}
		if (!Number.isFinite(adaptingLuminanceFloor) || adaptingLuminanceFloor < 0) {
			throw new RangeError('adaptingLuminanceFloor must be finite and nonnegative.');
		}

		const photopicIlluminanceLux = packet.values.reduce((sum, value, channelIndex) => {
			const channel = packet.basis.channels[channelIndex];
			return (
				sum +
				value *
					channel.width.value *
					this._ciePhotopicResponseAt(channel.center.value) *
					FIGURE1_DISPLAY_CONSTANTS.maxLuminousEfficacy.value
			);
		}, 0);

		return {
			directSpectralIrradiance: packet,
			photopicDirectIlluminance: {value: photopicIlluminanceLux, units: 'lux'},
			adaptingLuminanceProxy: {
				value: Math.max(photopicIlluminanceLux / Math.PI, adaptingLuminanceFloor),
				units: 'cd m^-2',
			},
		};
	}

	/**
	 * Convert transported uniform-disk radiance at the observer into a local direct-light record.
	 *
	 * @param {LocalUniformDiskLightLevelRequest} request - Transported disk and local support facts.
	 * @returns {LocalUniformDiskLightLevel} - Local direct-light record.
	 */
	measureUniformDisk(request) {
		const radiance = /** @type {SpectralRadiancePacket} */ (
			SpectralPacket.assert(request.spectralRadiance, {
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			})
		);
		if (!radiance.values.every((value) => value >= 0)) {
			throw new RangeError('Transported disk spectral radiance must be nonnegative.');
		}

		const visibleFraction = this.visibleProjectedDiskFraction(
			request.elevationRadians,
			request.angularRadiusRadians,
		);
		const visibleProjectedSolidAngleSteradians =
			visibleFraction * Math.PI * Math.sin(request.angularRadiusRadians) ** 2;
		const directSpectralIrradiance = /** @type {SpectralIrradiancePacket} */ (
			new SpectralPacket({
				basis: radiance.basis,
				quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
				semantics: radiance.semantics,
				values: radiance.values.map((value) => value * visibleProjectedSolidAngleSteradians),
				provenanceIdentity: `local-uniform-disk-irradiance:${radiance.contentHash}:${visibleProjectedSolidAngleSteradians}`,
			})
		);

		return {
			visibleFraction,
			visibleProjectedSolidAngleSteradians,
			...this.measureDirectIrradiance(directSpectralIrradiance, request.adaptingLuminanceFloor),
		};
	}
}
