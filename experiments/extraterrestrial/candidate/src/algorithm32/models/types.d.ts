/**
 * Supplies construction dependencies for the spectral component model.
 */
type SpectralModelDependencies = {
	/**
	 * Store the accepted spectral basis for the facade configuration.
	 */
	readonly basis: SpectralBasis;

	/**
	 * Store a stable compatibility fingerprint for spectral resource checks.
	 * When omitted, the spectral model derives one from the basis.
	 */
	readonly fingerprint?: string;

	/**
	 * Store the facade-local spectral model version.
	 */
	readonly version: number;
};

/**
 * Describe a configured spectral model without exposing mutable model state.
 */
type SpectralModelDescriptor = {
	/**
	 * Identify the descriptor kind.
	 */
	readonly kind: "algorithm32-spectral-model";

	/**
	 * Store the complete unit-bearing spectral basis.
	 */
	readonly basis: SpectralBasis;

	/**
	 * Store the number of active spectral channels.
	 */
	readonly channelCount: number;

	/**
	 * Store a stable compatibility fingerprint for spectral resource checks.
	 */
	readonly fingerprint: string;

	/**
	 * Store the facade-local spectral model version.
	 */
	readonly version: number;
};

/** Describe the public spectral-model surface consumed across Algorithm32. */
interface SpectralModel {
	/** Store the canonical spectral basis. */
	readonly basis: SpectralBasis;
	/** Store the ordered unit-bearing channel centers. */
	readonly wavelengths: readonly Wavelength[];
	/** Store the active spectral channel count. */
	readonly channelCount: number;
	/** Store the spectral compatibility fingerprint. */
	readonly fingerprint: string;
	/** Store the facade-local model version. */
	readonly version: number;
	/** Describe the accepted spectral model. */
	describe(): SpectralModelDescriptor;
	/** Return one unit-bearing wavelength by channel index. */
	getWavelength(index: number): Wavelength;
	/** Replace the complete accepted basis. */
	replaceBasis(basis: SpectralBasis): SpectralModelDescriptor;
}

/**
 * Supplies construction dependencies for the shared Algorithm32 aggregate
 * model.
 */
type SharedModelDependencies = {
	/**
	 * Store the facade-local model version.
	 */
	readonly version: number;

	/**
	 * Store the configured light-source model.
	 */
	readonly lightSource: LightSourceModel;

	/**
	 * Store the configured atmosphere model.
	 */
	readonly atmosphere: AtmosphereModel;

	/**
	 * Store the configured geometry model.
	 */
	readonly geometry: GeometryModel;

	/**
	 * Store the accepted spectral basis used to construct the spectral model.
	 */
	readonly spectralBasis: SpectralBasis;

	/**
	 * Store an optional stable compatibility fingerprint for spectral resource
	 * checks. When omitted, the spectral model derives one from the basis.
	 */
	readonly spectralFingerprint?: string;
};

/**
 * Describe the shared model descriptors observed at one facade-local model
 * version.
 */
type SharedModelSnapshot = {
	/**
	 * Store the facade-local model version.
	 */
	readonly version: number;

	/**
	 * Store the configured light-source descriptor.
	 */
	readonly lightSource: LightSourceModelDescriptor;

	/**
	 * Store the configured atmosphere descriptor.
	 */
	readonly atmosphere: AtmosphereModelDescriptor;

	/**
	 * Store the configured geometry descriptor.
	 */
	readonly geometry: GeometryModelDescriptor;

	/**
	 * Store the configured spectral descriptor.
	 */
	readonly spectral: SpectralModelDescriptor;
};

/** Describe the public shared-model surface consumed by runtime collaborators. */
interface SharedModel {
	/** Store the facade-local model version. */
	readonly version: number;
	/** Store the configured light source. */
	readonly lightSource: LightSourceModel;
	/** Store the configured atmosphere. */
	readonly atmosphere: AtmosphereModel;
	/** Store the configured geometry. */
	readonly geometry: GeometryModel;
	/** Store the canonical spectral model. */
	readonly spectral: SpectralModel;
	/** Return the current descriptor snapshot. */
	snapshot(): SharedModelSnapshot;
}
