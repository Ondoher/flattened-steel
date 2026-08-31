import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket as SpectralPacketClass,
} from '../../../spectral-values/index.js';

/**
 * Object that owns the resident cumulative binary64 field for one completed local-Sun build.
 *
 * @implements {CpuScatteringCache}
 *
 */
export default class LocalSunCpuCache {
	/**
	 * Cumulative reader value.
	 *
	 *  @type {CpuDirectionalSpectralFieldReader | null}
	 *
	 */
	_cumulativeReader;
	/**
	 * Provenance identity of the stored samples.
	 *
	 *  @type {string}
	 *
	 */
	_sampleProvenanceIdentity;

	/**
	 * Creates a local sun cpu cache instance that consumes one completed local-Sun N1, N2, or N4 result.
	 *
	 * @param {LocalSunCpuCacheResult} buildResult - Supplies the completed build.
	 *
	 */
	constructor(buildResult) {
		const cumulativeField = buildResult.cumulativeScatteringDensity;

		this._cumulativeReader = cumulativeField.createReader();
		this._sampleProvenanceIdentity = cumulativeField.provenanceIdentity;
		this._spectralBasis = buildResult.domainSelection.spectralBasis;
	}

	/**
	 * Provenance identity of the stored samples.
	 *
	 *  @returns {string} - The physical sample provenance identity.
	 */
	get sampleProvenanceIdentity() {
		return this._sampleProvenanceIdentity;
	}

	/**
	 * Called by local sun cpu cache to require a live resident reader.
	 *
	 * @returns {CpuDirectionalSpectralFieldReader} - The reader.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_requireCumulativeReader() {
		if (this._cumulativeReader === null) {
			throw new Error('LocalSunCpuCache has been disposed.');
		}

		return this._cumulativeReader;
	}

	/**
	 * Call this method to sample all channels from pairing-neutral physical context.
	 *
	 * @param {ScatteringCacheSampleRequest} request - Supplies physical context and the active geometry interpreter.
	 * @returns {SpectralScatteringDensityPacket} - The cumulative density.
	 */
	sampleCumulativeScatteringDensity(request) {
		const reader = this._requireCumulativeReader();
		const values = new Float64Array(this._spectralBasis.channelCount);
		const positionStencil = request.geometry.resolveScatteringCachePositionStencil({
			position: request.context.position,
			atmosphereCoordinate: request.context.atmosphereCoordinate,
		});
		const directionStencil = request.geometry.resolveScatteringCacheDirectionStencil({
			position: request.context.position,
			physicalOutgoingDirection: request.context.physicalOutgoingDirection,
		});

		for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
			const positionIndex = positionStencil.indices[positionTap];
			const positionWeight = positionStencil.weights[positionTap];

			for (let directionTap = 0; directionTap < directionStencil.indices.length; directionTap += 1) {
				const directionIndex = directionStencil.indices[directionTap];
				const weight = positionWeight * directionStencil.weights[directionTap];

				for (let wavelengthIndex = 0; wavelengthIndex < values.length; wavelengthIndex += 1) {
					values[wavelengthIndex] +=
						reader.readScalar({
							directionIndex,
							positionIndex,
							wavelengthIndex,
						}) * weight;
				}
			}
		}

		return /** @type {SpectralScatteringDensityPacket} */ (
			/** @type {unknown} */ (
				new SpectralPacketClass({
					quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
					units: SPECTRAL_UNITS.SCATTERING_DENSITY,
					basis: this._spectralBasis,
					semantics: this._spectralBasis.semantics,
					values,
					provenanceIdentity: this._sampleProvenanceIdentity,
				})
			)
		);
	}

	/** Call this method to release the resident reader. Repeated disposal is safe. */
	dispose() {
		this._cumulativeReader = null;
	}
}
