import {SpectralBasis as SpectralBasisClass} from '../../../spectral-values/index.js';

/** Object that owns the canonical spectral basis and spectral channel shape for one Algorithm32 configuration. */
export class SpectralModel {
	/**
	 * Called by spectral model to accept a spectral basis at the model ownership boundary.
	 *
	 * @param {SpectralBasis} basis - Supplies the spectral basis to accept.
	 * @returns {SpectralBasis} - The accepted model-owned spectral basis.
	 */
	_acceptBasis(basis) {
		return SpectralBasisClass.assert(basis, 'SpectralModel basis');
	}

	/**
	 * Creates a spectral component model from accepted spectral configuration.
	 *
	 * @param {SpectralModelDependencies} dependencies - Supplies the accepted
	 * spectral basis and facade-local version.
	 *
	 */
	constructor(dependencies) {
		const basis = this._acceptBasis(dependencies.basis);

		this._basis = basis;
		this._version = dependencies.version;
	}

	/**
	 * Value that returns the canonical spectral basis.
	 *
	 * @returns {SpectralBasis} - The active spectral basis.
	 */
	get basis() {
		return this._basis;
	}

	/**
	 * Value that returns the active wavelength samples.
	 *
	 * @returns {readonly Wavelength[]} - The active wavelength samples.
	 */
	get wavelengths() {
		return this._basis.channels.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param channel - The channel value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (channel) => channel.center,
		);
	}

	/**
	 * Value that returns the active spectral channel count.
	 *
	 * @returns {number} - The active spectral channel count.
	 */
	get channelCount() {
		return this._basis.channelCount;
	}

	/**
	 * Value that returns the facade-local spectral model version.
	 *
	 * @returns {number} - The spectral model version.
	 */
	get version() {
		return this._version;
	}

	/**
	 * Call this method to return the wavelength for one active channel.
	 *
	 * @param {number} index - Supplies the active channel index.
	 * @returns {Wavelength} - The wavelength.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	getWavelength(index) {
		if (!Number.isInteger(index) || index < 0 || index >= this.channelCount) {
			throw new RangeError(`Spectral channel index ${index} is outside the active channel range.`);
		}

		return this._basis.channels[index].center;
	}
}
