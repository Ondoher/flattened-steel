/** Describe the unit value contract. */
type UnitValue<Units extends string = string> = Readonly<{
	/** Store the value. */
	value: number;
	/** Identify the physical units. */
	units: Units;
}>;

/** Describe the distance units contract. */
type DistanceUnits = "meters" | "kilometers";
/** Describe the angle units contract. */
type AngleUnits = "radians" | "degrees";
/** Describe the wavelength units contract. */
type WavelengthUnits = "nanometers" | "micrometers";
/** Describe the solid angle units contract. */
type SolidAngleUnits = "steradians";
/** Describe the inverse solid angle units contract. */
type InverseSolidAngleUnits = "sr^-1";
/** Describe the duration units contract. */
type DurationUnits = "seconds";
/** Describe the scene distance units contract. */
type SceneDistanceUnits = "scene-units";
/** Describe the scene scale units contract. */
type SceneScaleUnits = "meters-per-scene-unit";
/** Describe the inverse distance units contract. */
type InverseDistanceUnits = "m^-1" | "km^-1";
/** Describe the calibrated Rayleigh coefficient-scale units contract. */
type RayleighCoefficientScaleUnits = "m^-1 micrometers^4";
/** Describe the dimensionless units contract. */
type DimensionlessUnits = "1";
/** Describe the pixel units contract. */
type PixelUnits = "pixels";

/** Describe the distance contract. */
type Distance = UnitValue<DistanceUnits>;
/** Describe the angle contract. */
type Angle = UnitValue<AngleUnits>;
/** Describe the wavelength contract. */
type Wavelength = UnitValue<WavelengthUnits>;
/** Describe the solid angle contract. */
type SolidAngle = UnitValue<SolidAngleUnits>;
/** Describe the inverse solid angle contract. */
type InverseSolidAngle = UnitValue<InverseSolidAngleUnits>;
/** Describe the duration contract. */
type Duration = UnitValue<DurationUnits>;
/** Describe the scene distance contract. */
type SceneDistance = UnitValue<SceneDistanceUnits>;
/** Describe the scene scale contract. */
type SceneScale = UnitValue<SceneScaleUnits>;
/** Describe the inverse distance contract. */
type InverseDistance = UnitValue<InverseDistanceUnits>;
/** Describe the calibrated Rayleigh coefficient scale contract. */
type RayleighCoefficientScale = UnitValue<RayleighCoefficientScaleUnits>;
/** Describe the dimensionless contract. */
type Dimensionless = UnitValue<DimensionlessUnits>;
/** Describe the pixel distance contract. */
type PixelDistance = UnitValue<PixelUnits>;

/** Describe the pixel size contract. */
type PixelSize = Readonly<{
	/** Store the width. */
	width: number;
	/** Store the height. */
	height: number;
	/** Identify the physical units. */
	units: PixelUnits;
}>;

/** Describe the unit series contract. */
type UnitSeries<Units extends string = string> = Readonly<{
	/** Store the values. */
	values: readonly number[];
	/** Identify the physical units. */
	units: Units;
}>;

/** Describe the distance series contract. */
type DistanceSeries = UnitSeries<DistanceUnits>;

/** Describe the unit position contract. */
type UnitPosition<Units extends string = string> = Readonly<{
	/** Store the coordinates. */
	coordinates: readonly [number, number, number];
	/** Identify the physical units. */
	units: Units;
}>;

/** Describe the position contract. */
type Position = UnitPosition<DistanceUnits>;
/** Describe the scene position contract. */
type ScenePosition = UnitPosition<SceneDistanceUnits>;

/** Describe the unit family descriptor contract. */
type UnitFamilyDescriptor = Readonly<{
	/** Indicate whether canonical units. */
	canonicalUnits: string;
	/** Store the supported units. */
	supportedUnits: readonly string[];
}>;

/** Describe the spectral sample semantics contract. */
type SpectralSampleSemantics =
	"contiguous-wavelength-bin-average";

/** Describe the spectral basis channel contract. */
type SpectralBasisChannel = Readonly<{
	/** Identify this value. */
	id: string;
	/** Store the center. */
	center: Wavelength;
	/** Store the width. */
	width: Wavelength;
}>;

/** Describe the spectral basis definition contract. */
type SpectralBasisDefinition = Readonly<{
	/** Identify this value. */
	id: string;
	/** Identify the schema revision. */
	schemaRevision?: string;
	/** Identify the sample semantics. */
	semantics?: SpectralSampleSemantics;
	/** Store the channels. */
	channels: readonly SpectralBasisChannel[];
}>;

/** Describe the spectral basis value contract. */
type SpectralBasisValue = Readonly<{
	/** Identify the contract kind. */
	kind: "algorithm32-spectral-basis";
	/** Identify this value. */
	id: string;
	/** Identify the schema revision. */
	schemaRevision: string;
	/** Identify the sample semantics. */
	semantics: SpectralSampleSemantics;
	/** Store the channels. */
	channels: readonly SpectralBasisChannel[];
	/** Store the channel count. */
	channelCount: number;
	/** Identify the normalized content. */
	contentHash: string;
}>;

/** Describe the spectral basis json contract. */
type SpectralBasisJson = SpectralBasisValue;

/** Describe the spectral basis contract. */
interface SpectralBasis extends SpectralBasisValue {
	/** Return the serializable spectral-basis contract. */
	toJSON(): SpectralBasisJson;
}

/** Describe the spectral quantity contract. */
type SpectralQuantity =
	| "spectral-irradiance-density"
	| "spectral-radiance-density"
	| "spectral-scattering-density"
	| "spectral-transmittance"
	| "spectral-optical-depth"
	| "spectral-extinction-coefficient"
	| "spectral-scattering-coefficient"
	| "spectral-absorption-coefficient"
	| "spectral-phase-weighted-scattering-coefficient"
	| "spectral-reflectance"
	| "spectral-brdf"
	| "spectral-phase";

/** Describe the spectral units contract. */
type SpectralUnits =
	| "1"
	| "m^-1"
	| "sr^-1"
	| "m^-1 sr^-1"
	| "W m^-2 nm^-1"
	| "W m^-2 sr^-1 nm^-1"
	| "W m^-3 sr^-1 nm^-1";

/** Describe the spectral packet definition contract. */
type SpectralPacketDefinition = Readonly<{
	/** Identify the physical quantity. */
	quantity: SpectralQuantity;
	/** Identify the physical units. */
	units: SpectralUnits | string;
	/** Identify the spectral basis. */
	basis: SpectralBasis;
	/** Identify the sample semantics. */
	semantics?: SpectralSampleSemantics;
	/** Store the values. */
	values: readonly number[] | ArrayLike<number>;
	/** Identify the value provenance. */
	provenanceIdentity: string;
}>;

/** Describe the spectral packet value contract. */
type SpectralPacketValue = Readonly<{
	/** Identify the contract kind. */
	kind: "algorithm32-spectral-packet";
	/** Identify the physical quantity. */
	quantity: SpectralQuantity;
	/** Identify the physical units. */
	units: SpectralUnits;
	/** Identify the spectral basis. */
	basis: SpectralBasis;
	/** Store the basis hash. */
	basisHash: string;
	/** Identify the sample semantics. */
	semantics: SpectralSampleSemantics;
	/** Store the values. */
	values: readonly number[];
	/** Identify the value provenance. */
	provenanceIdentity: string;
	/** Identify the normalized content. */
	contentHash: string;
}>;

/** Describe the spectral packet json contract. */
type SpectralPacketJson = Readonly<Omit<SpectralPacketValue, "basis">>;

/** Describe the spectral packet contract. */
interface SpectralPacket extends SpectralPacketValue {
	/** Return the serializable spectral-packet contract. */
	toJSON(): SpectralPacketJson;
}

/** Carry source spectral irradiance density with its canonical interpretation. */
type SpectralIrradiancePacket = SpectralPacket & Readonly<{
	quantity: "spectral-irradiance-density";
	units: "W m^-2 nm^-1";
}>;

/** Carry spectral radiance density with its canonical interpretation. */
type SpectralRadiancePacket = SpectralPacket & Readonly<{
	quantity: "spectral-radiance-density";
	units: "W m^-2 sr^-1 nm^-1";
}>;

/** Carry local spectral scattering density with its canonical interpretation. */
type SpectralScatteringDensityPacket = SpectralPacket & Readonly<{
	quantity: "spectral-scattering-density";
	units: "W m^-3 sr^-1 nm^-1";
}>;

/** Carry spectral transmittance with its canonical interpretation. */
type SpectralTransmittancePacket = SpectralPacket & Readonly<{
	quantity: "spectral-transmittance";
	units: "1";
}>;

/** Carry spectral optical depth with its canonical interpretation. */
type SpectralOpticalDepthPacket = SpectralPacket & Readonly<{
	quantity: "spectral-optical-depth";
	units: "1";
}>;

/** Carry spectral extinction coefficients with their canonical interpretation. */
type SpectralExtinctionCoefficientPacket = SpectralPacket & Readonly<{
	quantity: "spectral-extinction-coefficient";
	units: "m^-1";
}>;

/** Carry spectral scattering coefficients with their canonical interpretation. */
type SpectralScatteringCoefficientPacket = SpectralPacket & Readonly<{
	quantity: "spectral-scattering-coefficient";
	units: "m^-1";
}>;

/** Carry spectral absorption coefficients with their canonical interpretation. */
type SpectralAbsorptionCoefficientPacket = SpectralPacket & Readonly<{
	quantity: "spectral-absorption-coefficient";
	units: "m^-1";
}>;

/** Carry phase-weighted spectral scattering with its canonical interpretation. */
type SpectralPhaseWeightedScatteringCoefficientPacket = SpectralPacket & Readonly<{
	quantity: "spectral-phase-weighted-scattering-coefficient";
	units: "m^-1 sr^-1";
}>;

/** Carry spectral reflectance with its canonical interpretation. */
type SpectralReflectancePacket = SpectralPacket & Readonly<{
	quantity: "spectral-reflectance";
	units: "1";
}>;

/** Carry a spectral bidirectional reflectance distribution function. */
type SpectralBrdfPacket = SpectralPacket & Readonly<{
	quantity: "spectral-brdf";
	units: "sr^-1";
}>;

/** Describe the spectral packet expectation contract. */
type SpectralPacketExpectation = Readonly<{
	/** Identify the physical quantity. */
	quantity?: SpectralQuantity;
	/** Identify the physical units. */
	units?: SpectralUnits | string;
	/** Identify the spectral basis. */
	basis?: SpectralBasis;
	/** Identify the sample semantics. */
	semantics?: SpectralSampleSemantics;
}>;

/** Describe the spectral packet compatibility options contract. */
type SpectralPacketCompatibilityOptions = Readonly<{
	/** Store the same quantity. */
	sameQuantity?: boolean;
	/** Store the same units. */
	sameUnits?: boolean;
	/** Store the same semantics. */
	sameSemantics?: boolean;
}>;

/** Describe the spectral packet factory definition contract. */
type SpectralPacketFactoryDefinition = Readonly<{
	/** Identify the spectral basis. */
	basis: SpectralBasis;
	/** Identify the physical quantity. */
	quantity: SpectralQuantity;
	/** Identify the physical units. */
	units: SpectralUnits | string;
	/** Identify the sample semantics. */
	semantics?: SpectralSampleSemantics;
	/** Identify the value provenance. */
	provenanceIdentity: string;
}>;

/** Describe the spectral operation options contract. */
type SpectralOperationOptions = Readonly<{
	/** Identify the value provenance. */
	provenanceIdentity?: string;
}>;

/** Describe the spectral result interpretation contract. */
type SpectralResultInterpretation = Readonly<{
	/** Identify the physical quantity. */
	quantity: SpectralQuantity;
	/** Identify the physical units. */
	units: SpectralUnits | string;
	/** Identify the value provenance. */
	provenanceIdentity?: string;
}>;
