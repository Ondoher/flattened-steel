/**
 * Interpretation of each value in an ordered spectral basis.
 *
 * - **"contiguous-wavelength-bin-average"** - Average value across one contiguous wavelength bin.
 * - **"point-sampled-spectral-density"** - Spectral-density value evaluated at one wavelength coordinate.
 */
type SpectralSampleSemantics = 'contiguous-wavelength-bin-average' | 'point-sampled-spectral-density';

/** One named wavelength coordinate and its integration support width in a spectral basis. */
type SpectralBasisChannel = Readonly<{
	/** Identifier unique within the ordered basis. */
	id: string;
	/** Physical center wavelength of the bin. */
	center: Wavelength;
	/** Physical wavelength support width used by spectral integration. Point-sampled values are not averages over this width. */
	width: Wavelength;
}>;

/** Caller-supplied definition for constructing a spectral basis. */
type SpectralBasisDefinition = Readonly<{
	/** Identifier for the represented spectral basis. */
	id: string;
	/** Optional schema revision, with the current revision used when omitted. */
	schemaRevision?: string;
	/** Optional channel interpretation, with contiguous bin averages used when omitted. */
	semantics?: SpectralSampleSemantics;
	/** Ordered wavelength coordinates and integration support widths defining the basis. */
	channels: readonly SpectralBasisChannel[];
}>;

/** Canonical value and identity contract exposed by a spectral basis. */
type SpectralBasisValue = Readonly<{
	/** Contract kind for spectral-basis values. */
	kind: 'algorithm32-spectral-basis';
	/** Identifier for the represented spectral basis. */
	id: string;
	/** Schema revision governing the basis value. */
	schemaRevision: string;
	/** Interpretation of every ordered channel value. */
	semantics: SpectralSampleSemantics;
	/** Ordered canonical wavelength coordinates and integration support widths. */
	channels: readonly SpectralBasisChannel[];
	/** Number of ordered wavelength bins. */
	channelCount: number;
	/** Canonical hash of the complete normalized physical identity. */
	contentHash: string;
}>;

/** Plain serializable value for a spectral basis. */
type SpectralBasisJson = SpectralBasisValue;

/** Immutable ordered wavelength basis with canonical physical identity. */
interface SpectralBasis extends SpectralBasisValue {
	/**
	 * Call this method to return the plain serializable spectral-basis value.
	 *
	 * @returns - The serialized basis value.
	 */
	toJSON(): SpectralBasisJson;
}

/**
 * Physical quantity carried by a spectral packet.
 *
 * - **"spectral-irradiance-density"** - Irradiance density across wavelength.
 * - **"spectral-radiance-density"** - Radiance density across wavelength.
 * - **"spectral-scattering-density"** - Local scattering-source density across wavelength.
 * - **"spectral-transmittance"** - Dimensionless path transmittance across wavelength.
 * - **"spectral-optical-depth"** - Dimensionless optical depth across wavelength.
 * - **"spectral-extinction-coefficient"** - Extinction per unit path length across wavelength.
 * - **"spectral-scattering-coefficient"** - Scattering per unit path length across wavelength.
 * - **"spectral-absorption-coefficient"** - Absorption per unit path length across wavelength.
 * - **"spectral-phase-weighted-scattering-coefficient"** - Phase-weighted scattering per path length and solid angle.
 * - **"spectral-reflectance"** - Dimensionless surface reflectance across wavelength.
 * - **"spectral-brdf"** - Bidirectional reflectance distribution across wavelength.
 * - **"spectral-phase"** - Scattering phase density across wavelength.
 */
type SpectralQuantity =
	| 'spectral-irradiance-density'
	| 'spectral-radiance-density'
	| 'spectral-scattering-density'
	| 'spectral-transmittance'
	| 'spectral-optical-depth'
	| 'spectral-extinction-coefficient'
	| 'spectral-scattering-coefficient'
	| 'spectral-absorption-coefficient'
	| 'spectral-phase-weighted-scattering-coefficient'
	| 'spectral-reflectance'
	| 'spectral-brdf'
	| 'spectral-phase';

/**
 * Canonical unit spelling carried by a supported spectral quantity.
 *
 * - **"1"** - Dimensionless value.
 * - **"m^-1"** - Value per meter of path length.
 * - **"sr^-1"** - Value per steradian.
 * - **"m^-1 sr^-1"** - Value per meter and steradian.
 * - **"W m^-2 nm^-1"** - Irradiance density per nanometer.
 * - **"W m^-2 sr^-1 nm^-1"** - Radiance density per steradian and nanometer.
 * - **"W m^-3 sr^-1 nm^-1"** - Scattering density per volume, steradian, and nanometer.
 */
type SpectralUnits =
	'1' | 'm^-1' | 'sr^-1' | 'm^-1 sr^-1' | 'W m^-2 nm^-1' | 'W m^-2 sr^-1 nm^-1' | 'W m^-3 sr^-1 nm^-1';

/** Caller-supplied definition for constructing a spectral packet. */
type SpectralPacketDefinition = Readonly<{
	/** Physical quantity carried by the packet. */
	quantity: SpectralQuantity;
	/** Physical units, normalized to the quantity's canonical spelling during construction. */
	units: SpectralUnits | string;
	/** Ordered spectral basis interpreting the packet values. */
	basis: SpectralBasis;
	/** Optional sample semantics, with the basis semantics used when omitted. */
	semantics?: SpectralSampleSemantics;
	/** Ordered channel values copied during construction. */
	values: readonly number[] | ArrayLike<number>;
	/** Provenance identity for the packet values. */
	provenanceIdentity: string;
}>;

/** Canonical value and identity contract exposed by a spectral packet. */
type SpectralPacketValue = Readonly<{
	/** Contract kind for spectral-packet values. */
	kind: 'algorithm32-spectral-packet';
	/** Physical quantity carried by the packet. */
	quantity: SpectralQuantity;
	/** Canonical units for the physical quantity. */
	units: SpectralUnits;
	/** Ordered spectral basis interpreting the values. */
	basis: SpectralBasis;
	/** Canonical content hash of the spectral basis. */
	basisHash: string;
	/** Interpretation shared by every ordered channel value. */
	semantics: SpectralSampleSemantics;
	/** Independently owned ordered channel values. */
	values: readonly number[];
	/** Provenance identity for the packet values. */
	provenanceIdentity: string;
	/** Canonical hash of the complete normalized packet identity. */
	contentHash: string;
}>;

/** Plain serializable value for a spectral packet without its live basis owner. */
type SpectralPacketJson = Readonly<Omit<SpectralPacketValue, 'basis'>>;

/** Immutable spectral value with its complete interpretation and physical identity. */
interface SpectralPacket extends SpectralPacketValue {
	/**
	 * Call this method to return the plain serializable spectral-packet value.
	 *
	 * @returns - The serialized packet value.
	 */
	toJSON(): SpectralPacketJson;
}

/** Source spectral irradiance density with its canonical interpretation. */
type SpectralIrradiancePacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-irradiance-density';
		/** Units value. */ units: 'W m^-2 nm^-1';
	}>;

/** Spectral radiance density with its canonical interpretation. */
type SpectralRadiancePacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-radiance-density';
		/** Units value. */ units: 'W m^-2 sr^-1 nm^-1';
	}>;

/** Local spectral scattering density with its canonical interpretation. */
type SpectralScatteringDensityPacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-scattering-density';
		/** Units value. */ units: 'W m^-3 sr^-1 nm^-1';
	}>;

/** Spectral transmittance with its canonical interpretation. */
type SpectralTransmittancePacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-transmittance';
		/** Units value. */ units: '1';
	}>;

/** Spectral optical depth with its canonical interpretation. */
type SpectralOpticalDepthPacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-optical-depth';
		/** Units value. */ units: '1';
	}>;

/** Spectral extinction coefficients with their canonical interpretation. */
type SpectralExtinctionCoefficientPacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-extinction-coefficient';
		/** Units value. */ units: 'm^-1';
	}>;

/** Spectral scattering coefficients with their canonical interpretation. */
type SpectralScatteringCoefficientPacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-scattering-coefficient';
		/** Units value. */ units: 'm^-1';
	}>;

/** Spectral absorption coefficients with their canonical interpretation. */
type SpectralAbsorptionCoefficientPacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-absorption-coefficient';
		/** Units value. */ units: 'm^-1';
	}>;

/** Phase-weighted spectral scattering with its canonical interpretation. */
type SpectralPhaseWeightedScatteringCoefficientPacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-phase-weighted-scattering-coefficient';
		/** Units value. */ units: 'm^-1 sr^-1';
	}>;

/** Spectral reflectance with its canonical interpretation. */
type SpectralReflectancePacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-reflectance';
		/** Units value. */ units: '1';
	}>;

/** Spectral bidirectional reflectance distribution function. */
type SpectralBrdfPacket = SpectralPacket &
	Readonly<{
		/** Quantity value. */ quantity: 'spectral-brdf';
		/** Units value. */ units: 'sr^-1';
	}>;

/** Optional interpretation expectations applied when accepting a spectral packet. */
type SpectralPacketExpectation = Readonly<{
	/** Required physical quantity when supplied. */
	quantity?: SpectralQuantity;
	/** Required physical units when supplied. */
	units?: SpectralUnits | string;
	/** Required compatible spectral basis when supplied. */
	basis?: SpectralBasis;
	/** Required sample semantics when supplied. */
	semantics?: SpectralSampleSemantics;
}>;

/** Caller-selected interpretation checks for comparing two spectral packets. */
type SpectralPacketCompatibilityOptions = Readonly<{
	/** Whether both packets must carry the same physical quantity. */
	sameQuantity?: boolean;
	/** Whether both packets must use the same canonical units. */
	sameUnits?: boolean;
	/** Whether both packets must use the same semantics; enabled unless explicitly false. */
	sameSemantics?: boolean;
}>;

/** Basis, interpretation, and provenance for a constant-valued spectral packet. */
type SpectralPacketFactoryDefinition = Readonly<{
	/** Ordered spectral basis interpreting the packet values. */
	basis: SpectralBasis;
	/** Physical quantity carried by the packet. */
	quantity: SpectralQuantity;
	/** Physical units normalized during packet construction. */
	units: SpectralUnits | string;
	/** Optional sample semantics, with the basis semantics used when omitted. */
	semantics?: SpectralSampleSemantics;
	/** Provenance identity for the constant channel values. */
	provenanceIdentity: string;
}>;

/** Optional provenance override for a derived spectral operation. */
type SpectralOperationOptions = Readonly<{
	/** Provenance identity used instead of deterministic derivation. */
	provenanceIdentity?: string;
}>;

/** Physical interpretation and optional provenance for a derived spectral result. */
type SpectralResultInterpretation = Readonly<{
	/** Physical quantity carried by the result. */
	quantity: SpectralQuantity;
	/** Physical units normalized during result construction. */
	units: SpectralUnits | string;
	/** Provenance identity used instead of deterministic derivation. */
	provenanceIdentity?: string;
}>;

/** Optional physical interpretation and provenance for a mapped spectral result. */
type SpectralMappingResult = Partial<SpectralResultInterpretation>;

/** Operation parameters included in a derived spectral provenance identity. */
type SpectralProvenanceParameters = Readonly<Record<string, unknown>>;

/**
 * Type used by SpectralMath.resolveProvenanceIdentity to derive an absent provenance identity.
 *
 * @returns - The derived provenance identity.
 *
 */
type SpectralProvenanceIdentityFactory =
	/**
	 * Called by spectral provenance identity factory to handle one invocation of the declared operation.
	 * @returns - The callback result returned to its caller.
	 */ () => string;

/**
 * Type used by SpectralMath.mapSpectralPacket to transform one ordered channel value.
 *
 * @param value - The source channel value.
 * @param index - The zero-based channel index.
 * @param packet - The accepted source packet.
 * @returns - The mapped channel value.
 *
 */
type SpectralPacketMapper =
	/**
	 * Called by spectral packet mapper to handle one invocation of the declared operation.
	 * @param value - The value accepted by the operation.
	 * @param index - The zero-based index accepted by the operation.
	 * @param packet - The packet value accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (value: number, index: number, packet: SpectralPacket) => number;
