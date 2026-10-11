/** Exact admitted-prefix field identity, not a physical accuracy score. */
type LocalSunOccupiedFieldIdentity = {
	/** SHA-256 of the complete actual FP32 field bytes. */ sha256: string;
	/** SHA-256 of layer-major FP32 admitted sample bytes. */ occupiedSha256: string;
	/** Number of admitted positional rows. */ occupiedNodes: number;
	/** Nonzero scalar count in proof-only empty rows. */ emptyNonzero: number;
};
/** Complete order readback observations, retained after its array is released. */
type LocalSunObservedOrderField = LocalSunOccupiedFieldIdentity & {
	/** Actual pure J or transported L field identity. */ id: string;
	/** Exact storage dimensions and format. */ storage: CacheFieldStorage;
	/** Nonfinite scalar count across every channel/sample. */ nonfinite: number;
	/** All negative scalar values, including numerical allowance. */ negative: number;
	/** Negative values exceeding the retained quantity allowance. */ negativeBeyondAbsolute: number;
	/** Absolute negative allowance in the field's density/radiance units. */ absolute: number;
};
/** Additive consistency observations for a fresh selected-policy field. */
type LocalSunLayoutChecks = {
	/** Versioned additive diagnostic schema. */ schema: string;
	/** Sum of pure J1-J4 against every cumulative scalar. */ cumulativeClosure: LocalSunRotationResidual;
	/** Complete CPU/GPU view transmissions. */ transmittance: LocalSunRotationResidual;
	/** Maximum reconstructed CPU/GPU start/end difference, meters. */ maximumEndpointDifferenceMeters: number;
	/** Ray coverage and slot inventory. */ coverage: LocalSunRotationCoverage;
	/** Direct lookup consistency by quantity, never independent physical accuracy. */ lookups: LocalSunLayoutFieldLookup[];
	/** Whether all required consistency checks passed. */ qualified: boolean;
};
/** One direct GPU/CPU spatial-angular reconstruction check. */
type LocalSunLayoutFieldLookup = {
	/** Pure, transported or cumulative field identity. */ id: string;
	/** Spectral density or radiance units. */ units: string;
	/** Number of admitted physical point/direction pairs. */ queries: number;
	/** All-channel GPU lookup versus CPU reconstruction residual. */ residual: LocalSunRotationResidual;
};
/** Source-relative shader ingress, shared by all sampled fields. */
type LocalSunLayoutLookupQuery = {
	/** FP32 source-relative XYZ meters; CPU reads exactly this ingress. */ position: UnitVector3;
	/** FP32 outgoing direction, renormalized identically for the CPU comparison. */ direction: UnitVector3;
};

/** Capture JSON after standalone images are extracted by its host. */
type LocalSunP3StoredCapture = Omit<LocalSunShellHostCapture, 'results'> & {
	/** Complete numerical observations without the removed browser image data URL. */ results: Omit<
		LocalSunShellHostCapture['results'][number],
		'image'
	>[];
};
