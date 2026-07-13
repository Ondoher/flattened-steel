import { requiredString } from '../descriptors/descriptorSupport.js';
import { assertSpectralBasis } from '../quantities/index.js';

/**
 * Own the canonical spectral basis and spectral channel shape for one
 * Algorithm32 configuration.
 */
export class SpectralModel {

	/**
	 * Accept a spectral basis at the model ownership boundary.
	 *
	 * @param {SpectralBasis} basis - Supplies the spectral basis to accept.
	 * @returns {SpectralBasis} The accepted model-owned spectral basis.
	 */
	_acceptBasis(basis) {
		return assertSpectralBasis(basis, 'SpectralModel basis');
	}

	/**
	 * Create a deterministic fingerprint for a spectral basis.
	 *
	 * @param {SpectralBasis} basis - Supplies the spectral basis to fingerprint.
	 * @returns {string} The deterministic spectral basis fingerprint.
	 */
	_createFingerprint(basis) {
		return `spectral:${basis.contentHash}`;
	}
	/**
	 * Create a spectral component model from accepted spectral configuration.
	 *
	 * @param {SpectralModelDependencies} dependencies - Supplies the accepted
	 * spectral basis and descriptor metadata.
	 */
	constructor(dependencies) {
		const basis = this._acceptBasis(dependencies.basis);

		this._basis = basis;
		this._fingerprint = dependencies.fingerprint === undefined
			? this._createFingerprint(basis)
			: requiredString(dependencies.fingerprint, 'SpectralModel fingerprint');
		this._version = dependencies.version;
	}

	/**
	 * Return the canonical spectral basis.
	 *
	 * @returns {SpectralBasis} The active spectral basis.
	 */
	get basis() {
		return this._basis;
	}

	/**
	 * Return the active wavelength samples.
	 *
	 * @returns {readonly Wavelength[]} The active wavelength samples.
	 */
	get wavelengths() {
		return this._basis.channels.map((channel) => channel.center);
	}

	/**
	 * Return the active spectral channel count.
	 *
	 * @returns {number} The active spectral channel count.
	 */
	get channelCount() {
		return this._basis.channelCount;
	}

	/**
	 * Return the stable compatibility fingerprint for this spectral model.
	 *
	 * @returns {string} The spectral compatibility fingerprint.
	 */
	get fingerprint() {
		return this._fingerprint;
	}

	/**
	 * Return the facade-local spectral model version.
	 *
	 * @returns {number} The spectral model version.
	 */
	get version() {
		return this._version;
	}

	/**
	 * Return a serializable descriptor for compatibility checks and shader
	 * construction.
	 *
	 * @returns {SpectralModelDescriptor} The spectral model descriptor.
	 */
	describe() {
		return {
			kind: 'algorithm32-spectral-model',
			basis: this.basis,
			channelCount: this.channelCount,
			fingerprint: this.fingerprint,
			version: this.version,
		};
	}

	/**
	 * Return the wavelength for one active channel.
	 *
	 * @param {number} index - Supplies the active channel index.
	 * @returns {Wavelength} The wavelength.
	 */
	getWavelength(index) {
		if (!Number.isInteger(index) || index < 0 || index >= this.channelCount) {
			throw new RangeError(`Spectral channel index ${index} is outside the active channel range.`);
		}

		return this._basis.channels[index].center;
	}

	/**
	 * Replace the active spectral basis and derived descriptor identity.
	 *
	 * @param {SpectralBasis} basis - Supplies the replacement spectral basis.
	 * @returns {SpectralModelDescriptor} The updated spectral model descriptor.
	 */
	replaceBasis(basis) {
		const nextBasis = this._acceptBasis(basis);

		this._basis = nextBasis;
		this._fingerprint = this._createFingerprint(nextBasis);
		this._version += 1;

		return this.describe();
	}
}
