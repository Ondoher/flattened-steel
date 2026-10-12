/** Frozen selected construction controls; physical values have their explicitly declared fixture units. */
type LocalSunAssemblyFixture = Readonly<{
	/** Portable authority schema. */ schema: string;
	/** Selected W27 face-centre directions. */ directions: readonly Readonly<{
		index: number;
		vector: readonly number[];
	}>[];
	/** Independent primary physical J in W m^-3 sr^-1 nm^-1 at logical node/direction indices. */ primary: readonly Readonly<{
		positionIndex: number;
		rho: number;
		altitude: number;
		heldBand: number;
		samples: readonly (readonly number[])[];
	}>[];
	/** Independently integrated physical primary-J rays; length in metres, radiance in W m^-2 sr^-1 nm^-1. */ rays: readonly Readonly<{
		positionIndex: number;
		directionIndex: number;
		length: number;
		radiance: readonly number[];
	}>[];
	/** Explicit physical compact node selection for the manufactured scattering step. */ scatterPositions: readonly number[];
	/** Explicit logical W27 outgoing selection for the manufactured step. */ scatterDirections: readonly number[];
	/** Independent manufactured L-to-J2 spectral results in physical J units. */ scatter: readonly Readonly<{
		positionIndex: number;
		directionIndex: number;
		values: readonly number[];
	}>[];
	/** Pre-scoring algebra/fidelity comparison gates. */ limits: Readonly<{
		primaryAbsolute: number;
		primaryRelative: number;
		radianceAbsolute: number;
		radianceRelative: number;
		scatterAbsolute: number;
		scatterRelative: number;
	}>;
	/** Complete parent, producer, equation and tool identities. */ derivation: Readonly<{
		parents: readonly Readonly<{path: string; sha256: string}>[];
		producer: Readonly<{path: string; sha256: string}>;
		operation: string;
		tools: Readonly<{node: string}>;
	}>;
}>;

/** Selected physical construction and separate manufactured scattering comparison with bounded cost observations. */
type LocalSunAssemblyReport = Readonly<{
	/** Passed predeclared selected gates. */ status: 'PASSED';
	/** Compared primary node/direction/channel scalars. */ primaryComparisons: number;
	/** Actual selected primary nodes. */ primaryNodes: number;
	/** Compared selected-ray channel radiance. */ rayComparisons: number;
	/** Compared manufactured subset J2 scalars. */ scatterComparisons: number;
	/** Full incoming measure used for each selected scattering output. */ incomingCount: number;
	/** Genuine subset output buffer scalar count. */ selectedFieldScalars: number;
	/** Previous/output spectral buffers, excluding working arrays/object overhead. */ selectedSpectralBytes: number;
	/** Observed lazy primary spectrum count. */ memoSpectra: number;
	/** Observed memoized binary64 spectral payload. */ memoSpectralBytes: number;
	/** Maximum physical primary J residual. */ maximumPrimaryError: number;
	/** Maximum selected primary-J radiance residual. */ maximumRadianceError: number;
	/** Maximum manufactured physical J2 residual. */ maximumScatterError: number;
	/** Required selected ingress rejections. */ rejected: number;
	/** Measured setup cost in milliseconds. */ setupMilliseconds: number;
	/** Measured selected primary cost in milliseconds. */ primaryMilliseconds: number;
	/** Measured selected ray costs in milliseconds, not full-grid estimates. */ rayMilliseconds: readonly number[];
	/** Measured subset full-measure scattering cost in milliseconds. */ scatterMilliseconds: number;
	/** Measured total proof cost, excluding process startup, in milliseconds. */ elapsedMilliseconds: number;
	/** Free-host-memory preflight point sample in bytes. */ freeBeforeBytes: number;
	/** Process RSS after proof in bytes; not peak telemetry. */ rssAfterBytes: number;
	/** Full physical fields remain open. */ fullFieldsQualified: false;
	/** Complete physical recurrence remains open. */ fullRecurrenceQualified: false;
	/** Continuous direct/source packet preserved across selected construction. */ directSourceUnchanged: true;
	/** Zero and finite signed incoming samples preserve meaning. */ zeroAndSignedInputsPreserved: true;
}>;
