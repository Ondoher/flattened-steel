import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../spectral-values/index.js';
import {CanonicalValueHash} from '../../../value-identity/CanonicalValueHash.js';

const FIELD_ID = 'algorithm32-distant-sun-celestial-transport-v1';
const DIRECTION_COUNT = 11;
const RECEIVER_COUNT = 13;
const CHANNEL_COUNT = 15;
const SCALAR_COUNT = DIRECTION_COUNT * RECEIVER_COUNT * CHANNEL_COUNT;

/** Sealed binary64 reference field for spherical distant-Sun direct transport. */
export class DistantSunCelestialCpuCache {
	/** @type {DistantSunCelestialLogicalFieldDescription} */
	description;
	/** @type {DistantSunCelestialSupportMask} */
	supportMask;
	/** @type {Float64Array} */
	_values;
	/** @type {DistantSunCelestialLogicalCacheSource} */
	_source;

	/**
	 * Creates and completely builds one binary64 logical field.
	 *
	 * @param {DistantSunCelestialCpuCacheBuildRequest} request - Accepted model, domain, placement, and source.
	 */
	constructor(request) {
		if (request === null || typeof request !== 'object') {
			throw new TypeError('DistantSunCelestialCpuCache request is required.');
		}

		const {model, domain, placement, source} = request;
		const geometry = /** @type {GeometryModel & CelestialGeometryCapability} */ (model?.geometry);
		if (
			geometry === null ||
			typeof geometry !== 'object' ||
			typeof geometry.describeCelestialContributionDomain !== 'function' ||
			typeof geometry.createCelestialBuildSample !== 'function'
		) {
			throw new TypeError('Distant-Sun celestial CPU construction requires celestial geometry.');
		}
		if (source === null || typeof source !== 'object' || source.kind !== 'distant-uniform-sun') {
			throw new TypeError('Distant-Sun celestial CPU construction requires its distant-Sun source.');
		}
		if (placement?.kind !== 'distant-uniform-sun' || placement.sourceId !== source.id) {
			throw new RangeError('Distant-Sun celestial CPU placement does not match its source.');
		}
		const roster = model.celestialSources;
		if (
			!Object.is(model.lightSource, source) ||
			roster?.family !== 'spherical-sun-stars-radial-v1' ||
			!Object.is(roster.sun, source)
		) {
			throw new RangeError('Distant-Sun celestial CPU source must be the configured atmospheric and roster Sun.');
		}

		const geometryDomain = geometry.describeCelestialContributionDomain();
		if (domain?.contentHash !== geometryDomain.contentHash) {
			throw new RangeError('Distant-Sun celestial CPU domain does not match its geometry owner.');
		}
		if (domain.altitudeNodes.length !== RECEIVER_COUNT || domain.directionCoordinates.length !== DIRECTION_COUNT) {
			throw new RangeError('Distant-Sun celestial CPU construction requires the exact 13 by 11 domain.');
		}

		const definition = source.celestialSourceDefinition;
		const surfaceRadiance = definition.surfaceRadiance;
		if (surfaceRadiance.values.length !== CHANNEL_COUNT) {
			throw new RangeError('Distant-Sun celestial CPU construction requires exactly 15 spectral channels.');
		}
		if (surfaceRadiance.basisHash !== model.atmosphere.spectralBasis.contentHash) {
			throw new RangeError('Distant-Sun celestial CPU source and atmosphere spectral bases do not match.');
		}

		const intervalCount = model.profile.numerical.sourcePathTransmittance.intervalCount;
		if (!Number.isInteger(intervalCount) || intervalCount < 1) {
			throw new RangeError('Distant-Sun celestial CPU source-path interval count must be positive.');
		}

		const sourceIdentity = source.describeCelestialSourceIdentity();
		const atmosphereTransportIdentity = CanonicalValueHash.sha256Value({
			kind: 'algorithm32-distant-sun-celestial-atmosphere-transport-v1',
			atmosphereId: model.atmosphere.id,
			spectralBasis: model.atmosphere.spectralBasis.contentHash,
		});
		const numericalIdentity = CanonicalValueHash.sha256Value({
			kind: 'algorithm32-distant-sun-celestial-source-path-numerics-v1',
			intervalCount,
		});
		const descriptionFacts = {
			id: FIELD_ID,
			sourceId: source.id,
			sourceDefinitionHash: sourceIdentity.definitionHash,
			domainIdentity: domain.contentHash,
			atmosphereTransportIdentity,
			numericalIdentity,
			shape: /** @type {const} */ ({
				directionCount: DIRECTION_COUNT,
				receiverCount: RECEIVER_COUNT,
				channelCount: CHANNEL_COUNT,
			}),
			quantity: /** @type {const} */ ('spectral-radiance-density'),
			units: /** @type {const} */ ('W m^-2 sr^-1 nm^-1'),
		};
		this.description = Object.freeze({
			...descriptionFacts,
			shape: Object.freeze(descriptionFacts.shape),
			contentHash: CanonicalValueHash.sha256Value(descriptionFacts),
		});
		this._source = source;
		this._values = new Float64Array(SCALAR_COUNT);

		const supportValues = /** @type {(0 | 1)[]} */ ([]);
		for (let receiverIndex = 0; receiverIndex < RECEIVER_COUNT; receiverIndex += 1) {
			for (let directionIndex = 0; directionIndex < DIRECTION_COUNT; directionIndex += 1) {
				const sample = geometry.createCelestialBuildSample({
					domain,
					placement,
					receiverIndex,
					directionIndex,
				});
				if (sample.sourceId !== source.id) {
					throw new RangeError('Celestial geometry returned a construction sample for another source.');
				}
				supportValues.push(sample.supported ? 1 : 0);
				if (!sample.supported) continue;

				if (sample.sourcePath.samples?.length !== intervalCount + 1) {
					throw new RangeError('Celestial geometry source path does not match the profile interval count.');
				}
				const opticalDepth = model.atmosphere.integrateOpticalDepth(sample.sourcePath);
				if (opticalDepth.blockedByGround) {
					throw new RangeError('Supported celestial geometry sample produced ground-blocked transmittance.');
				}
				const transmittance = opticalDepth.transmittance.values;
				if (transmittance.length !== CHANNEL_COUNT) {
					throw new RangeError('Distant-Sun celestial transmittance requires exactly 15 channels.');
				}

				for (let wavelengthIndex = 0; wavelengthIndex < CHANNEL_COUNT; wavelengthIndex += 1) {
					const transport = transmittance[wavelengthIndex];
					const radiance = surfaceRadiance.values[wavelengthIndex] * transport;
					if (!Number.isFinite(transport) || transport < 0 || transport > 1) {
						throw new RangeError('Distant-Sun celestial transmittance must be finite and within [0, 1].');
					}
					if (!Number.isFinite(radiance) || radiance < 0) {
						throw new RangeError(
							'Distant-Sun celestial transport radiance must be finite and nonnegative.',
						);
					}
					this._values[this._offset({receiverIndex, directionIndex, wavelengthIndex})] = radiance;
				}
			}
		}

		const supportFacts = {
			shape: /** @type {const} */ ({directionCount: DIRECTION_COUNT, receiverCount: RECEIVER_COUNT}),
			values: supportValues,
		};
		this.supportMask = Object.freeze({
			shape: Object.freeze(supportFacts.shape),
			values: Object.freeze(supportValues),
			contentHash: CanonicalValueHash.sha256Value(supportFacts),
		});
	}

	/** @returns {2145} - Number of resident binary64 scalars. */
	get scalarCount() {
		return /** @type {2145} */ (SCALAR_COUNT);
	}

	/**
	 * Called by field reads to validate and pack one coordinate.
	 *
	 * @param {DistantSunCelestialFieldCoordinate} coordinate - Candidate field coordinate.
	 * @returns {number} - Dense receiver-major scalar offset.
	 */
	_offset(coordinate) {
		const {receiverIndex, directionIndex, wavelengthIndex} = coordinate ?? {};
		if (![receiverIndex, directionIndex, wavelengthIndex].every(Number.isInteger)) {
			throw new TypeError('Distant-Sun celestial field coordinates must be integers.');
		}
		if (
			receiverIndex < 0 ||
			receiverIndex >= RECEIVER_COUNT ||
			directionIndex < 0 ||
			directionIndex >= DIRECTION_COUNT ||
			wavelengthIndex < 0 ||
			wavelengthIndex >= CHANNEL_COUNT
		) {
			throw new RangeError('Distant-Sun celestial field coordinate is outside the exact field shape.');
		}
		return (receiverIndex * DIRECTION_COUNT + directionIndex) * CHANNEL_COUNT + wavelengthIndex;
	}

	/**
	 * Call this method to read one validated scalar coordinate.
	 *
	 * @param {DistantSunCelestialFieldCoordinate} coordinate - Exact field coordinate.
	 * @returns {number} - Stored binary64 scalar.
	 */
	readScalar(coordinate) {
		return this._values[this._offset(coordinate)];
	}

	/** @returns {DistantSunCelestialCpuField} - Independently owned binary64 snapshot. */
	snapshot() {
		return {description: this.description, supportMask: this.supportMask, values: this._values.slice()};
	}

	/**
	 * Called by lookup to validate one geometry-owned two-tap stencil.
	 *
	 * @param {CelestialReceiverStencil | CelestialDirectionStencil} stencil - Geometry-owned stencil.
	 * @param {number} count - Exact axis count.
	 * @returns {void} - No return value.
	 */
	_validateStencil(stencil, count) {
		if (
			stencil.indices.length !== 2 ||
			stencil.weights.length !== 2 ||
			!stencil.indices.every((index) => Number.isInteger(index) && index >= 0 && index < count) ||
			!stencil.weights.every((weight) => Number.isFinite(weight) && weight >= 0 && weight <= 1)
		) {
			throw new RangeError('Distant-Sun celestial lookup requires a bounded two-tap geometry stencil.');
		}
		const weightSum = stencil.weights[0] + stencil.weights[1];
		if (Math.abs(weightSum - 1) > 32 * Number.EPSILON) {
			throw new RangeError('Distant-Sun celestial lookup stencil weights must sum to one.');
		}
	}

	/**
	 * Call this method to reconstruct one spectral packet from geometry-owned stencils.
	 *
	 * @param {DistantSunCelestialCpuLookupRequest} request - Exact receiver and direction stencils.
	 * @returns {DistantSunCelestialCpuLookupResult} - Interpolated radiance or exact zero.
	 */
	lookup(request) {
		const {receiverStencil, directionStencil} = request ?? {};
		if (receiverStencil?.classification !== 'valid' || !receiverStencil.valid) {
			return this._createLookupResult('out-of-domain', new Float64Array(CHANNEL_COUNT));
		}
		if (directionStencil?.classification !== 'clear' || !directionStencil.valid) {
			const classification =
				directionStencil?.classification === 'ground-horizon' ? 'ground-horizon' : 'out-of-domain';
			return this._createLookupResult(classification, new Float64Array(CHANNEL_COUNT));
		}

		this._validateStencil(receiverStencil, RECEIVER_COUNT);
		this._validateStencil(directionStencil, DIRECTION_COUNT);
		const values = new Float64Array(CHANNEL_COUNT);
		for (let wavelengthIndex = 0; wavelengthIndex < CHANNEL_COUNT; wavelengthIndex += 1) {
			for (let receiverTap = 0; receiverTap < 2; receiverTap += 1) {
				for (let directionTap = 0; directionTap < 2; directionTap += 1) {
					values[wavelengthIndex] +=
						receiverStencil.weights[receiverTap] *
						directionStencil.weights[directionTap] *
						this.readScalar({
							receiverIndex: receiverStencil.indices[receiverTap],
							directionIndex: directionStencil.indices[directionTap],
							wavelengthIndex,
						});
				}
			}
		}
		return this._createLookupResult('clear', values);
	}

	/**
	 * Called by lookup to materialize one validated radiance packet.
	 *
	 * @param {DistantSunCelestialCpuLookupClassification} classification - Geometry support classification.
	 * @param {Float64Array} values - Exact lookup values.
	 * @returns {DistantSunCelestialCpuLookupResult} - Typed lookup result.
	 */
	_createLookupResult(classification, values) {
		const definition = this._source.celestialSourceDefinition;
		return {
			classification,
			radiance: /** @type {SpectralRadiancePacket} */ (
				new SpectralPacket({
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					basis: definition.surfaceRadiance.basis,
					semantics: definition.surfaceRadiance.semantics,
					values,
					provenanceIdentity: `${this.description.contentHash}:cpu-lookup:${classification}`,
				})
			),
		};
	}
}
