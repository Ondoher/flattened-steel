/** Scalar value paired with explicit physical units. */
type UnitValue<Units extends string = string> = Readonly<{
	/** Scalar magnitude. */
	value: number;
	/** Explicit unit spelling for the magnitude. */
	units: Units;
}>;

/**
 * Unit spelling accepted for a physical distance.
 *
 * - **"meters"** - Distance measured in meters.
 * - **"kilometers"** - Distance measured in kilometers.
 */
type DistanceUnits = 'meters' | 'kilometers';
/**
 * Unit spelling accepted for a physical angle.
 *
 * - **"radians"** - Angle measured in radians.
 * - **"degrees"** - Angle measured in degrees.
 */
type AngleUnits = 'radians' | 'degrees';
/**
 * Unit spelling accepted for a physical wavelength.
 *
 * - **"nanometers"** - Wavelength measured in nanometers.
 * - **"micrometers"** - Wavelength measured in micrometers.
 */
type WavelengthUnits = 'nanometers' | 'micrometers';
/** Type that describes the solid angle units contract. */
type SolidAngleUnits = 'steradians';
/** Type that describes the inverse solid angle units contract. */
type InverseSolidAngleUnits = 'sr^-1';
/** Type that describes the duration units contract. */
type DurationUnits = 'seconds';
/** Type that describes the scene distance units contract. */
type SceneDistanceUnits = 'scene-units';
/** Type that describes the scene scale units contract. */
type SceneScaleUnits = 'meters-per-scene-unit';
/**
 * Unit spelling accepted for an inverse physical distance.
 *
 * - **"m^-1"** - Inverse distance measured per meter.
 * - **"km^-1"** - Inverse distance measured per kilometer.
 */
type InverseDistanceUnits = 'm^-1' | 'km^-1';
/** Type that describes the calibrated Rayleigh coefficient-scale units contract. */
type RayleighCoefficientScaleUnits = 'm^-1 micrometers^4';
/** Type that describes the dimensionless units contract. */
type DimensionlessUnits = '1';
/** Type that describes the pixel units contract. */
type PixelUnits = 'pixels';

/** Type that describes the distance contract. */
type Distance = UnitValue<DistanceUnits>;
/** Type that describes the angle contract. */
type Angle = UnitValue<AngleUnits>;
/** Type that describes the wavelength contract. */
type Wavelength = UnitValue<WavelengthUnits>;
/** Type that describes the solid angle contract. */
type SolidAngle = UnitValue<SolidAngleUnits>;
/** Type that describes the inverse solid angle contract. */
type InverseSolidAngle = UnitValue<InverseSolidAngleUnits>;
/** Type that describes the duration contract. */
type Duration = UnitValue<DurationUnits>;
/** Type that describes the scene distance contract. */
type SceneDistance = UnitValue<SceneDistanceUnits>;
/** Type that describes the scene scale contract. */
type SceneScale = UnitValue<SceneScaleUnits>;
/** Type that describes the inverse distance contract. */
type InverseDistance = UnitValue<InverseDistanceUnits>;
/** Type that describes the calibrated Rayleigh coefficient scale contract. */
type RayleighCoefficientScale = UnitValue<RayleighCoefficientScaleUnits>;
/** Type that describes the dimensionless contract. */
type Dimensionless = UnitValue<DimensionlessUnits>;
/** Scalar pixel-distance value. */
type PixelDistance = UnitValue<PixelUnits>;

/** Unit-bearing pixel-size value. */
type PixelSize = Readonly<{
	/** Width in pixels. */
	width: number;
	/** Height in pixels. */
	height: number;
	/** Physical units. */
	units: PixelUnits;
}>;

/** Candidate object inspected at a pixel-size boundary. */
type PixelSizeCandidate = {
	/** Candidate width. */
	readonly width?: unknown;
	/** Candidate height. */
	readonly height?: unknown;
	/** Candidate units. */
	readonly units?: unknown;
};

/** Candidate object inspected at a pixel-distance boundary. */
type PixelDistanceCandidate = {
	/** Candidate scalar value. */
	readonly value?: unknown;
	/** Candidate units. */
	readonly units?: unknown;
};

/** Type that describes the unit series contract. */
type UnitSeries<Units extends string = string> = Readonly<{
	/** Value that stores the values. */
	values: readonly number[];
	/** Value that identifies the physical units. */
	units: Units;
}>;

/** Type that describes the distance series contract. */
type DistanceSeries = UnitSeries<DistanceUnits>;

/** Type that describes the unit position contract. */
type UnitPosition<Units extends string = string> = Readonly<{
	/** Value that stores the coordinates. */
	coordinates: readonly [number, number, number];
	/** Value that identifies the physical units. */
	units: Units;
}>;

/** Type that describes the position contract. */
type Position = UnitPosition<DistanceUnits>;
/** Type that describes the scene position contract. */
type ScenePosition = UnitPosition<SceneDistanceUnits>;

/** Public metadata for one supported unit-conversion family. */
type UnitFamilyContract = Readonly<{
	/** Canonical unit spelling for the family. */
	canonicalUnits: string;
	/** Supported unit spellings for the family. */
	supportedUnits: readonly string[];
}>;

/** Conversion metadata from one unit spelling into its physical-family canonical units. */
type UnitConversion = Readonly<{
	/** Physical-family identity shared by compatible units. */
	family: string;
	/** Value that scales from the unit spelling into the family's canonical units. */
	scale: number;
}>;
