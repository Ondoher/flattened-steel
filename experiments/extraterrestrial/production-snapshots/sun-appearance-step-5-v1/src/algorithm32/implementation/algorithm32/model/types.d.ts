/** Type that supplies construction dependencies for the spectral component model. */
type SpectralModelDependencies = {
	/** Value that stores the accepted spectral basis for the facade configuration. */
	readonly basis: SpectralBasis;

	/** Value that stores the facade-local spectral model version. */
	readonly version: number;
};

/** Contract that describes the public spectral-model surface consumed across Algorithm32. */
interface SpectralModel {
	/** Value that stores the canonical spectral basis. */
	readonly basis: SpectralBasis;
	/** Value that stores the ordered unit-bearing channel centers. */
	readonly wavelengths: readonly Wavelength[];
	/** Value that stores the active spectral channel count. */
	readonly channelCount: number;
	/** Value that stores the facade-local model version. */
	readonly version: number;
	/**
	 * Call this method to return one unit-bearing wavelength by channel index.
	 * @param index - The zero-based index accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	getWavelength(index: number): Wavelength;
}

/** Type that supplies construction dependencies for the shared Algorithm32 aggregate model. */
type SharedModelDependencies = {
	/** Value that stores the facade-local model version. */
	readonly version: number;

	/** Complete accepted profile retained for this model lifetime. */
	readonly profile: Algorithm32ExecutionProfile;
};

/** Contract that describes the public shared-model surface consumed by runtime collaborators. */
interface SharedModel {
	/** Value that stores the facade-local model version. */
	readonly version: number;
	/** Value that stores the exact complete execution profile. */
	readonly profile: Algorithm32ExecutionProfile;
	/** Value that stores the configured light source. */
	readonly lightSource: LightSourceModel;
	/** Value that stores the configured atmosphere. */
	readonly atmosphere: AtmosphereModel;
	/** Value that stores the configured geometry. */
	readonly geometry: GeometryModel;
	/** Value that stores the configured ground boundary or black-ground null. */
	readonly groundBoundary: GroundBoundary | null;
	/** Value that stores the profile-owned celestial source roster or disabled null. */
	readonly celestialSources: CelestialSourceRoster | null;
	/** Value that stores the canonical spectral model. */
	readonly spectral: SpectralModel;
}
