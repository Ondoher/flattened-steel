/** Explicit extended-order screen coverage.
 * - **"screen"** - Three development conditions and channels 0/8.
 * - **"all-times"** - All seventeen conditions and channels 0/8.
 */
type SkySixSelection = 'screen' | 'all-times';
/** Allocation parameters for a nearest-filtered recurrence texture. */
type SkySixTextureOptions = Readonly<{
	/** Texture columns. */ width: number;
	/** Texture rows. */ height: number;
	/** Sized WebGL internal format. */ internalFormat?: number;
	/** Input/output component format. */ format?: number;
	/** Input scalar type. */ type?: number;
	/** Optional initial packed data. */ data?: Float32Array | null;
}>;
/** Exact additional authenticated physical fields consumed by the common shader. */
type SkySixBuildRequest = SkyBuildRequest &
	Readonly<{
		/** Complete physical specification retained by the input snapshot. */ transportSpec: SkyTransportSpec &
			Readonly<{
				/** Source direction in the canonical coordinate contract. */ source: Readonly<{
					/** Unit direction towards illumination. */ directionToLight: SkyVector3;
				}>;
				/** Additional shader coefficients. */ atmosphere: SkyTransportSpec['atmosphere'] &
					Readonly<{
						/** Rayleigh coefficient scale. */ rayleighCoefficientScalePerMeter: number;
						/** Mie wavelength exponent. */ mieAngstromAlpha: number;
						/** Mie optical coefficient. */ mieAngstromBeta: number;
						/** Authenticated disabled-ozone table retained by production. */ ozone: SkyTransportSpec['atmosphere']['ozone'] &
							Readonly<{
								/** Ozone concentration scale. */ maximumDensityPerCubicMeter?: number;
								/** Uniform spectral absorption table. */ crossSectionTable: Readonly<{
									/** First wavelength in nanometres. */ minimumNanometers: number;
									/** Wavelength spacing in nanometres. */ spacingNanometers: number;
									/** Spectral cross sections. */ values: readonly number[];
								}>;
							}>;
					}>;
			}>;
	}>;
/** Authenticated production shader-generator capability; no compiler order override exists. */
interface SkySixCommonModule {
	/** Generate unchanged GLSL from exact physical/numerical parameters. */ createDistantSunSceneCacheCommonShaderSource(
		parameters: SkySixCommonParameters,
	): string;
}
/** Exact arguments passed to the authenticated production common-shader generator. */
type SkySixCommonParameters = Readonly<{
	/** Channel center in nanometres. */ wavelengthNanometers: number;
	/** Incident spectral irradiance. */ sourceIrradiance: number;
	/** Interpolated ozone cross section. */ ozoneCrossSection: number;
	/** Ozone number-density scale. */ ozoneMaximumDensity: number;
	/** Channel Rayleigh coefficient or the generator's formula. */ rayleighScattering: number | null;
	/** Channel Mie extinction or the generator's formula. */ mieExtinction: number | null;
	/** Lambertian reflectance. */ groundAlbedo: number;
	/** Ground sphere radius. */ bottomRadiusMeters: number;
	/** Atmosphere outer radius. */ topRadiusMeters: number;
	/** Molecular density scale height. */ rayleighScaleHeightMeters: number;
	/** Aerosol density scale height. */ mieScaleHeightMeters: number;
	/** Rayleigh coefficient scale. */ rayleighCoefficientScalePerMeter: number;
	/** Mie wavelength exponent. */ mieAngstromAlpha: number;
	/** Mie optical coefficient. */ mieAngstromBeta: number;
	/** Scattering to extinction ratio. */ mieSingleScatteringAlbedo: number;
	/** Cornette-Shanks asymmetry. */ miePhaseFunctionG: number;
	/** Source optical-depth quadrature count. */ sourcePathTransmittanceIntervalCount: number;
	/** Positive incoming quadrature count. */ incomingDirectionCount: number;
	/** Recurrence path quadrature count. */ transportIntervalCount: number;
	/** Logical cubed-sphere face width. */ outgoingFaceWidth: number;
	/** Exact physical altitude knots. */ positionAltitudesMeters: readonly number[];
	/** Exact physical solar-angle knots. */ solarZenithDegrees: readonly number[];
	/** Explicit receiver-local coordinate identity. */ coordinateContract: string;
	/** Canonical source direction. */ sourceDirection: SkyVector3;
	/** Authenticated geometry policy. */ numericalPolicy: SkyTransportSpec['numerical']['geometryPolicy'];
}>;
/** Live recurrence field owned by one wavelength. */
type SkySixField = Readonly<{
	/** Pure density or incoming radiance stage. */ id: string;
	/** Allocated WebGL texture. */ texture: WebGLTexture;
	/** Texture columns. */ width: number;
	/** Texture rows. */ height: number;
	/** Logical Float32 allocation size. */ bytes: number;
}>;
/** One explicit texture binding for an unchanged fragment program. */
type SkySixBinding = readonly [unit: number, texture: WebGLTexture, uniform: string, fieldId: string];
/** Row span gathered without reading a whole field. */
type SkySixSpan = {
	/** First requested column. */ first: number;
	/** Last requested column. */ last: number;
	/** Transient row readback. */ values?: Float32Array;
};
/** Sparse six-order recipe with a separately authenticated production-prefix recipe. */
type SkySixControl = SkyGpuControl &
	Readonly<{
		/** Parent recipe used to reproduce exact sparse hashes and four-order spectra. */ prefixControl: SkyGpuControl;
	}>;
/** Exact driver invocation; the common shader is an authenticated dynamic capability. */
type SkySixCompileRequest = SkyGpuCompileRequest &
	Readonly<{
		/** Production common-shader generator. */ commonModule: SkySixCommonModule;
	}>;
/** Retained source and manufactured evaluator parity before GPU execution. */
type SkySixImplementationProof = Readonly<{
	/** Separate diagnostic schema. */ schemaId: string;
	/** Production and adapted kernel identities. */ sources: readonly SkyGpuSourceIdentity[];
	/** Exact normalized template-body checks. */ fragments: readonly Readonly<{
		/** Original production function. */ name: string;
		/** Common retained body hash. */ normalizedBodySha256: string;
		/** Required exact equality. */ equal: boolean;
	}>[];
	/** Manufactured first-four-stage equality across every representation and view. */ manufacturedPrefix: Readonly<{
		/** Compared binary64 spectra count. */ comparisons: number;
		/** Required exact equality. */ bitExact: boolean;
		/** Synthetic field support count. */ coordinateCount: number;
		/** Parent four-stage output shape. */ shape: SkyEvaluationShape;
	}>;
	/** Explicit boundary of the source/manufactured claim. */ scope: string;
}>;
