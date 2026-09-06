import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../quantities/index.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_15_SPECTRAL_CHANNEL_COUNT,
} from '../profiles/native-15-profile.js';

/**
 * Own the resident cumulative CPU field for one completed distant-Sun build.
 *
 * This is the source-specific CPU oracle cache. It owns neither GPU resources
 * nor source publication and does not retain diagnostic pure-order fields.
 *
 * @implements {CpuScatteringCache}
 */
export class DistantSunCpuCache {
	/** @type {ScatteringCacheDescriptor} */
	_descriptor;
	/** @type {CpuDirectionalSpectralFieldReader | null} */
	_cumulativeReader;
	/** @type {string} */
	_sampleProvenanceIdentity;

	/**
	 * Consume one completed N1, N2, or N4 distant-Sun CPU build result.
	 *
	 * @param {DistantSunCpuCacheResult} buildResult - Supplies the completed nonresident build.
	 */
	constructor(buildResult) {
		const cumulativeField = buildResult.cumulativeScatteringDensity;

		this._descriptor = buildResult.descriptor;
		this._cumulativeReader = cumulativeField.createReader();
		this._sampleProvenanceIdentity = cumulativeField.descriptor.provenanceIdentity;
	}

	/** @returns {ScatteringCacheDescriptor} The completed cache descriptor. */
	get descriptor() {
		return this._descriptor;
	}

	/**
	 * Require the resident reader while this cache remains usable.
	 *
	 * @returns {CpuDirectionalSpectralFieldReader} Return the resident reader.
	 */
	_requireCumulativeReader() {
		if (this._cumulativeReader === null) {
			throw new Error('DistantSunCpuCache has been disposed.');
		}

		return this._cumulativeReader;
	}

	/**
	 * Sample all wavelengths from geometry/domain-resolved physical stencils.
	 *
	 * @param {ScatteringCacheSampleRequest} request - Supplies resolved native-position and W27 stencils.
	 * @returns {SpectralScatteringDensityPacket} Return cumulative local scattering density.
	 */
	sampleResolved(request) {
		const reader = this._requireCumulativeReader();
		const positionStencil = request.positionStencil;
		const directionStencil = request.directionStencil;
		const values = new Float64Array(NATIVE_15_SPECTRAL_CHANNEL_COUNT);

		for (let positionTap = 0;
			positionTap < positionStencil.indices.length;
			positionTap += 1) {
			const positionIndex = positionStencil.indices[positionTap];
			const positionWeight = positionStencil.weights[positionTap];

			for (let directionTap = 0;
				directionTap < directionStencil.indices.length;
				directionTap += 1) {
				const directionIndex = directionStencil.indices[directionTap];
				const weight = positionWeight * directionStencil.weights[directionTap];

				for (let wavelengthIndex = 0;
					wavelengthIndex < values.length;
					wavelengthIndex += 1) {
					values[wavelengthIndex] += reader.readScalar({
						directionIndex,
						positionIndex,
						wavelengthIndex,
					}) * weight;
				}
			}
		}

		return /** @type {SpectralScatteringDensityPacket} */ (
			/** @type {unknown} */ (createSpectralPacket({
				quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
				units: SPECTRAL_UNITS.SCATTERING_DENSITY,
				basis: NATIVE_15_SPECTRAL_BASIS,
				semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
				values,
				provenanceIdentity: this._sampleProvenanceIdentity,
			}))
		);
	}

	/** Release this cache's resident reader. Repeated disposal is safe. */
	dispose() {
		this._cumulativeReader = null;
	}
}
