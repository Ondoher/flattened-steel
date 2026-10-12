/** Independent transport scalar/ray authority, frozen before candidate scoring. */
type LocalSunTransportFixture = Readonly<{
	/** Portable schema. */ schema: string;
	/** Selected policy. */ policy: string;
	/** Physical configuration in metres. */ geometry: Readonly<{height: number; top: number; radius: number}>;
	/** Independent selected physical rays and channel controls. */ rays: readonly Readonly<{
		label: string;
		origin: readonly number[];
		direction: readonly number[];
		maximumDistance?: number;
		full: number;
		boundary: string;
		channels: readonly Readonly<{
			retained: number;
			distances: readonly number[];
			radiance: number;
			transmission: number;
			physicalEnd: boolean;
		}>[];
	}>[];
	/** Independent exponential column controls, measured in metres. */ columns: readonly Readonly<{
		z: number;
		endAltitude: number;
		length: number;
		scaleHeight: number;
		expected: number;
	}>[];
	/** Independent positive attenuation integral weights. */ weights: readonly Readonly<{
		tau: number;
		expected: readonly number[];
	}>[];
	/** Predeclared gates, before observing production. */ limits: Readonly<{
		endpointMeters: number;
		sampleMeters: number;
		columnRelative: number;
		weightAbsolute: number;
		radianceAbsolute: number;
		radianceRelative: number;
		transmissionAbsolute: number;
	}>;
	/** Complete producer/ancestry/equation/tool identities. */ derivation: Readonly<{
		parents: readonly Readonly<{path: string; sha256: string}>[];
		producer: Readonly<{path: string; sha256: string}>;
		operation: string;
		tools: Readonly<{node: string}>;
	}>;
}>;

/** Selected synthetic transport comparison, without physical-field acceptance. */
type LocalSunTransportReport = Readonly<{
	/** Passed selected gates. */ status: 'PASSED';
	/** Number of independently controlled physical rays. */ rays: number;
	/** Compared spectral channels. */ channelComparisons: number;
	/** Compared physical sample distances. */ sampleComparisons: number;
	/** Interior tau64 prefixes exercised. */ cutoffPrefixes: number;
	/** Compared exponential density columns. */ columns: number;
	/** Compared attenuation-weight pairs. */ weights: number;
	/** Maximum density-column residual in metres. */ maxColumnError: number;
	/** Maximum dimensionless weight residual. */ maxWeightError: number;
	/** Maximum physical sample residual in metres. */ maxSampleError: number;
	/** Maximum radiance residual in W m^-2 sr^-1 nm^-1. */ maxRadianceError: number;
	/** Maximum dimensionless transmittance residual. */ maxTransmissionError: number;
	/** Stored physical J retained byte-for-byte. */ physicalValuesUnchanged: true;
	/** Signed finite physical inputs preserve sign. */ signedSamplesPreserved: true;
	/** Required rejection controls exercised. */ rejected: number;
	/** Full physical scattering fields remain open. */ physicalFieldsQualified: false;
}>;
