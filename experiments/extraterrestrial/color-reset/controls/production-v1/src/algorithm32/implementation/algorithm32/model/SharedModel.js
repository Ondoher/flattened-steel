import {SpectralModel} from './SpectralModel.js';

/**
 * Aggregate the canonical Algorithm32 configuration/facts component models.
 */
export class SharedModel {
	/**
	 * Creates the shared configuration/facts model for one facade instance.
	 *
	 * @param {SharedModelDependencies} dependencies - Supplies accepted
	 * component models and the facade-local model version.
	 *
	 */
	constructor(dependencies) {
		this._version = dependencies.version;
		this._profile = dependencies.profile;
		this._spectral = new SpectralModel({
			basis: dependencies.profile.spectral.basis,
			version: dependencies.version,
		});
	}

	/** @returns {Algorithm32ExecutionProfile} - The exact accepted execution profile. */
	get profile() {
		return this._profile;
	}

	/**
	 * Value that returns the facade-local shared model version.
	 *
	 * @returns {number} - The shared model version.
	 */
	get version() {
		return this._version;
	}

	/**
	 * Value that returns the configured light-source model.
	 *
	 * @returns {LightSourceModel} - The configured light-source model.
	 */
	get lightSource() {
		return this._profile.models.lightSource;
	}

	/**
	 * Value that returns the configured atmosphere model.
	 *
	 * @returns {AtmosphereModel} - The configured atmosphere model.
	 */
	get atmosphere() {
		return this._profile.models.atmosphere;
	}

	/**
	 * Value that returns the configured geometry model.
	 *
	 * @returns {GeometryModel} - The configured geometry model.
	 */
	get geometry() {
		return this._profile.models.geometry;
	}

	/** @returns {GroundBoundary | null} - The configured ground boundary. */
	get groundBoundary() {
		return this._profile.models.groundBoundary;
	}

	/** @returns {CelestialSourceRoster | null} - The profile-owned celestial source roster. */
	get celestialSources() {
		return this._profile.models.celestialSources;
	}

	/**
	 * Value that returns the configured spectral model.
	 *
	 * @returns {SpectralModel} - The configured spectral model.
	 */
	get spectral() {
		return this._spectral;
	}
}
