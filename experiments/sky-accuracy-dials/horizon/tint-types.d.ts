/** Source/geometry lane for retained tint readings.
 * - **"local"** - Flat atmosphere with finite local Sun.
 * - **"distant"** - Spherical atmosphere with parallel sunlight.
 */
type HorizonTintLane = 'local'|'distant';
/** Authenticated run definition subset supplying exact recorded input identities. */
type HorizonTintDefinition = {
	/** Parent artifact identities, operation and material parameters. */ readonly recipe: DialDerivation;
};
/** Authenticated distant aerosol registration subset used only for fixed display adaptation. */
type HorizonTintDistantRegistration = {
	/** Original baseline total-horizontal illuminance, in lux. */ readonly lux: number;
};
/** Linear RGB with corresponding tristimulus descriptors; units follow the named stage. */
type HorizonTintColor = {
	/** Signed linear sRGB, never encoded code values. */ readonly rgb: readonly number[];
	/** CIE XYZ; physical ray Y is cd/m², nominal screen Y is relative. */ readonly xyz: readonly number[];
	/** Dimensionless CIE xy. */ readonly xy: readonly number[];
	/** Linear red/blue ratio; descriptive, not a perceptual error score. */ readonly redBlueRatio: number;
};
/** Frozen accepted input selection for the saved-spectrum color diagnosis. */
type HorizonTintParent = {
	/** Geometry/source lane, not a claim of matched source placement. */ readonly geometry: HorizonTintLane;
	/** Immutable accepted aerosol run. */ readonly root: string;
	/** Original fixed baseline illuminance in lux. */ readonly lux: number;
	/** Retained physical input cases and ray spectra. */ readonly cases: readonly LocalAerosolCase[];
};
/** Derived color stages for one retained ray; no transport is recomputed. */
type HorizonTintReading = {
	/** Parent geometry/source lane. */ readonly geometry: HorizonTintLane;
	/** Remaining aerosol amplitude. */ readonly fraction: number;
	/** Azimuth selector and elevation in degrees. */ readonly heading: string; readonly elevation: number;
	/** Physical color before display gain. */ readonly physical: HorizonTintColor;
	/** After achromatic p2 gain; XYZ remains in radiance-derived physical units. */ readonly gained: HorizonTintColor;
	/** Final p2 RGB for the common independent CIE input, before PNG quantization. */ readonly encoded: readonly number[];
	/** Nominal display color after standard-sRGB decoding, Y relative to screen white. */ readonly screen: HorizonTintColor;
	/** Source irradiance chromaticity; Y of this projection is in lux, not cd/m². */ readonly source: HorizonTintColor;
	/** p2 scalar gain and ratios of red/blue changes across stages. */ readonly gain: number; readonly sourceRelativeRB: number; readonly displayRelativeRB: number;
};
/** Projection-only cross-check of the production midpoint convention against independent bin integration. */
type HorizonTintProjection = {
	/** Parent ray selectors. */ readonly geometry: HorizonTintLane; readonly fraction: number; readonly heading: string; readonly elevation: number;
	/** Production midpoint/rounded-matrix color, before tone mapping. */ readonly production: HorizonTintColor;
	/** Production projection plus p2 output, interpreted as nominal standard-sRGB screen color. */ readonly screen: HorizonTintColor;
	/** Final production-projected p2 code values, before quantization. */ readonly encoded: readonly number[];
	/** Relative per-channel difference against independently coded midpoint/rounded-matrix projection. */ readonly parity: number;
	/** Relative change of R/B versus independent bin-integrated physical color. */ readonly relativeRB: number;
};
