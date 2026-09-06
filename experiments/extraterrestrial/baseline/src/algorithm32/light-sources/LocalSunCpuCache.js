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
 * Own the resident cumulative binary64 field for one completed local-Sun
 * build.
 *
 * @implements {CpuScatteringCache}
 */
export default class LocalSunCpuCache {
	/** @type {ScatteringCacheDescriptor} */
	_descriptor;
	/** @type {CpuDirectionalSpectralFieldReader | null} */
	_cumulativeReader;
	/** @type {string} */
	_sampleProvenanceIdentity;

	/**
	 * Consume one completed local-Sun N1, N2, or N4 result.
	 *
	 * @param {LocalSunCpuCacheResult} buildResult - Supplies the completed build.
	 */
	constructor(buildResult) {
		const cumulativeField =
			buildResult.cumulativeScatteringDensity;

		this._descriptor = buildResult.descriptor;
		this._cumulativeReader = cumulativeField.createReader();
		this._sampleProvenanceIdentity =
			cumulativeField.descriptor.provenanceIdentity;
	}

	/** @returns {ScatteringCacheDescriptor} The completed descriptor. */
	get descriptor() {
		return this._descriptor;
	}

	/**
	 * Require a live resident reader.
	 *
	 * @returns {CpuDirectionalSpectralFieldReader} The reader.
	 */
	_requireCumulativeReader() {
		if (this._cumulativeReader === null) {
			throw new Error('LocalSunCpuCache has been disposed.');
		}

		return this._cumulativeReader;
	}

	/**
	 * Sample all channels from geometry-resolved z-by-rho and W stencils.
	 *
	 * @param {ScatteringCacheSampleRequest} request - Supplies resolved stencils.
	 * @returns {SpectralScatteringDensityPacket} The cumulative density.
	 */
	sampleResolved(request) {
		const reader = this._requireCumulativeReader();
		const values =
			new Float64Array(NATIVE_15_SPECTRAL_CHANNEL_COUNT);

		for (let positionTap = 0;
			positionTap < request.positionStencil.indices.length;
			positionTap += 1) {
			const positionIndex =
				request.positionStencil.indices[positionTap];
			const positionWeight =
				request.positionStencil.weights[positionTap];

			for (let directionTap = 0;
				directionTap
					< request.directionStencil.indices.length;
				directionTap += 1) {
				const directionIndex =
					request.directionStencil.indices[directionTap];
				const weight = positionWeight
					* request.directionStencil
						.weights[directionTap];

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
				quantity:
					SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
				units: SPECTRAL_UNITS.SCATTERING_DENSITY,
				basis: NATIVE_15_SPECTRAL_BASIS,
				semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
				values,
				provenanceIdentity:
					this._sampleProvenanceIdentity,
			}))
		);
	}

	/** Release the resident reader. Repeated disposal is safe. */
	dispose() {
		this._cumulativeReader = null;
	}
}
