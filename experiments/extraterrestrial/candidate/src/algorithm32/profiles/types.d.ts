/** Retain another immutable descriptor by exact identity. */
type NativeProfileDescriptorReference = Readonly<{
	/** Identify the referenced descriptor kind. */
	readonly kind: string;
	/** Identify the referenced descriptor. */
	readonly id: string;
	/** Identify the referenced schema revision. */
	readonly schemaRevision: string;
	/** Identify the referenced generator revision. */
	readonly generatorRevision?: string;
	/** Identify the referenced normalized content. */
	readonly contentHash: string;
}>;

/** Describe the native production atmosphere constants. */
type NativePhysicalProfile = Readonly<{
	/** Identify the native physical-profile kind. */
	readonly kind: "algorithm32-native-physical-profile";
	/** Identify the physical profile. */
	readonly id: string;
	/** Identify the physical-profile schema revision. */
	readonly schemaRevision: string;
	/** Identify the physical-profile revision. */
	readonly revision: number;
	/** Identify the profile's production role. */
	readonly role: "native-production-default";
	/** Indicate that the profile does not target comparison parity. */
	readonly comparisonParity: false;
	/** Store the spherical geometry dimensions. */
	readonly geometry: Readonly<{
		/** Store the ground radius. */
		readonly bottomRadius: Distance;
		/** Store the top-of-atmosphere radius. */
		readonly topRadius: Distance;
	}>;
	/** Store the atmospheric constituent constants. */
	readonly atmosphere: Readonly<{
		/** Store Rayleigh scattering constants. */
		readonly rayleigh: Readonly<{
			/** Store the Rayleigh density scale height. */
			readonly scaleHeight: Distance;
			/** Store the Rayleigh coefficient scale. */
			readonly coefficientScale: InverseDistance;
		}>;
		/** Store Mie scattering constants. */
		readonly mie: Readonly<{
			/** Store the Mie density scale height. */
			readonly scaleHeight: Distance;
			/** Store the Angstrom alpha exponent. */
			readonly angstromAlpha: Dimensionless;
			/** Store the Angstrom beta coefficient. */
			readonly angstromBeta: Dimensionless;
			/** Store the Mie single-scattering albedo. */
			readonly singleScatteringAlbedo: Dimensionless;
			/** Store the Mie phase-function asymmetry. */
			readonly phaseAsymmetry: Dimensionless;
		}>;
		/** Store ozone absorption selections. */
		readonly ozone: Readonly<{
			/** Indicate whether ozone absorption is enabled. */
			readonly absorptionEnabled: boolean;
		}>;
	}>;
	/** Store explicitly configured physical ground facts. */
	readonly ground?: Readonly<{
		/** Store the profile-owned spectral hemispherical reflectance. */
		readonly albedo: SpectralReflectancePacket;
	}>;
	/** Identify the normalized physical-profile content. */
	readonly contentHash: string;
}>;

/** Supply native physical-profile facts before the content hash is derived. */
type NativePhysicalProfileDefinition = Omit<NativePhysicalProfile, "contentHash" | "ground">;

/** Describe native production numerical selections and owned references. */
type NativeNumericalProfile = Readonly<{
	/** Identify the native numerical-profile kind. */
	readonly kind: "algorithm32-native-numerical-profile";
	/** Identify the numerical profile. */
	readonly id: string;
	/** Identify the numerical-profile schema revision. */
	readonly schemaRevision: string;
	/** Identify the numerical-profile revision. */
	readonly revision: number;
	/** Identify the profile's production role. */
	readonly role: "native-production-default";
	/** Indicate that the profile does not target comparison parity. */
	readonly comparisonParity: false;
	/** Store source-path transmittance controls. */
	readonly sourcePathTransmittance: Readonly<{
		/** Store the source-path integration interval count. */
		readonly intervalCount: number;
	}>;
	/** Reference the cache-construction controls. */
	readonly cacheConstruction: NativeProfileDescriptorReference;
	/** Reference the selected numerical domains. */
	readonly domains: Readonly<{
		/** Reference the position domain. */
		readonly position: NativeProfileDescriptorReference;
		/** Reference the incoming-direction domain. */
		readonly incomingDirection: NativeProfileDescriptorReference;
		/** Reference the outgoing-direction domain. */
		readonly outgoingDirection: NativeProfileDescriptorReference;
	}>;
	/** Identify the normalized numerical-profile content. */
	readonly contentHash: string;
}>;

/** Supply native numerical-profile facts before the content hash is derived. */
type NativeNumericalProfileDefinition = Omit<NativeNumericalProfile, "contentHash">;

/** Describe the content-hashed identity of one native production profile. */
type NativeProductionProfileIdentity = Readonly<{
	/** Identify the native production-profile contract. */
	readonly kind: "algorithm32-native-production-profile";
	/** Identify this production profile. */
	readonly id: string;
	/** Identify the profile schema revision. */
	readonly schemaRevision: string;
	/** Identify the profile revision. */
	readonly revision: number;
	/** Identify the native production role. */
	readonly role: "native-production-default";
	/** Indicate that this identity does not request comparison parity. */
	readonly comparisonParity: false;
	/** Identify the selected spectral basis content. */
	readonly spectralBasisHash: string;
	/** Identify the selected source irradiance-density content. */
	readonly sourceIrradianceDensityHash: string;
	/** Identify the selected physical-profile content. */
	readonly physicalProfileHash: string;
	/** Identify the selected numerical-profile content. */
	readonly numericalProfileHash: string;
}>;

/** Require the runtime-validated, nominal spectral packet class. */
type NativeSourceIrradianceDensity = SpectralPacket;

/** Retain a runtime-validated native ground-albedo packet. */
type NativeGroundAlbedo = SpectralReflectancePacket;

/** Supply native production profile identity and source overrides. */
type CreateNativeProductionProfileOptions = Readonly<{
	/** Override the production-profile identity. */
	readonly id?: string;
	/** Override the production-profile revision. */
	readonly revision?: number;
	/** Override the native source irradiance density. */
	readonly sourceIrradianceDensity?: NativeSourceIrradianceDensity;
	/** Explicitly configure native-basis ground albedo. */
	readonly albedo?: NativeGroundAlbedo;
}>;

/** Describe the immutable default native production profile. */
type NativeProductionProfile = Readonly<{
	/** Identify the native production-profile kind. */
	readonly kind: "algorithm32-native-production-profile";
	/** Identify the production profile. */
	readonly id: string;
	/** Identify the production-profile schema revision. */
	readonly schemaRevision: string;
	/** Identify the production-profile revision. */
	readonly revision: number;
	/** Identify the profile's production role. */
	readonly role: "native-production-default";
	/** Indicate that the profile does not target comparison parity. */
	readonly comparisonParity: false;
	/** Store the profile's spectral selections. */
	readonly spectral: Readonly<{
		/** Identify the selected spectral basis. */
		readonly basis: unknown;
		/** Store the native source irradiance density. */
		readonly sourceIrradianceDensity: NativeSourceIrradianceDensity;
	}>;
	/** Store the native physical profile. */
	readonly physical: NativePhysicalProfile;
	/** Store the native numerical profile. */
	readonly numerical: NativeNumericalProfile;
	/** Identify the normalized production-profile content. */
	readonly contentHash: string;
}>;
