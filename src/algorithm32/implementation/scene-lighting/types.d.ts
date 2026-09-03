/** Optional construction binding for the receiver-local calculator. */
type LocalLightLevelCalculatorConfiguration = Readonly<{
	/** Configured primary source whose receiver-local direct sample is measured. */
	readonly lightSource?: LightSourceModel;
}>;

/** Inputs needed to measure the configured primary source at its configured receiver. */
type ConfiguredLocalDirectLightRequest = Readonly<{
	/** Geometry that owns receiver/source placement and horizon support. */
	readonly geometry: GeometryModel;
	/** Observation used by geometry-owned celestial placement. */
	readonly observation: GeometryObservation;
	/** Optional configured roster used for exact extended-source horizon support. */
	readonly celestialSources?: CelestialSourceRoster | null;
	/** Optional atmosphere whose source-path transmittance is applied before photopic reduction. */
	readonly atmosphere?: AtmosphereModel;
}>;

/** Inputs for combining a fixed Color baseline with a separate exposure factor. */
type LocalExposureModificationRequest = Readonly<{
	/** Unchanged positive baseline exposure owned by the Color implementation. */
	readonly baselineExposure: number;
	/** Optional positive achromatic factor; identity when omitted. */
	readonly exposureModifier?: number;
}>;

/** Auditable result of applying a separate achromatic exposure factor. */
type LocalExposureModification = Readonly<{
	/** Unchanged baseline supplied by the caller. */
	readonly baselineExposure: number;
	/** Positive achromatic factor applied to the baseline. */
	readonly exposureModifier: number;
	/** Product of baselineExposure and exposureModifier. */
	readonly effectiveExposure: number;
}>;

/** Facade-published target exposure state for one receiver-local brightness proxy. */
type LocalExposureAdaptation = Readonly<{
	/** Accepted receiver-local brightness proxy retained under the legacy setter field name. */
	readonly adaptingLuminanceProxy: UnitValue<'cd m^-2'>;
	/** Positive achromatic target modifier derived from the accepted luminance. */
	readonly exposureModifier: number;
}>;

/** Production direct-light measures at one local observation point. */
type LocalDirectLightLevel = Readonly<{
	/** Local direct spectral irradiance retained for lighting consumers. */
	readonly directSpectralIrradiance: SpectralIrradiancePacket;
	/** CIE 1931 photopic direct illuminance. */
	readonly photopicDirectIlluminance: UnitValue<'lux'>;
	/** Coarse local-light luminance proxy E_v / pi. */
	readonly adaptingLuminanceProxy: UnitValue<'cd m^-2'>;
}>;

/** Geometry-supported configured-source irradiance at one receiver. */
type ReceiverDirectLightMeasurement = Readonly<{
	/** Atmosphere-transmitted direct irradiance on a source-normal surface. */
	readonly directNormal: SpectralIrradiancePacket;
	/** Direct irradiance projected onto the receiver-local horizontal surface. */
	readonly directHorizontal: SpectralIrradiancePacket;
	/** Clamped receiver-up dot source-center direction used for projection. */
	readonly sourceCenterCosine: number;
	readonly photopicDirectNormalIlluminance: UnitValue<'lux'>;
	readonly photopicDirectHorizontalIlluminance: UnitValue<'lux'>;
}>;

/** Complete component inputs for one receiver-light publication. */
type ReceiverLightCombinationRequest = Readonly<{
	readonly identity: string;
	readonly directNormal: SpectralIrradiancePacket;
	readonly directHorizontal: SpectralIrradiancePacket;
	readonly diffuseHorizontal: SpectralIrradiancePacket;
	readonly stellarAdaptationLuminance?: UnitValue<'cd m^-2'>;
}>;

/** One fixed-direction receiver-local incoming-radiance quadrature sample. */
type ReceiverEnvironmentLightRadianceSample = Readonly<{
	/** Incoming native-basis spectral radiance at the receiver. */
	readonly spectralRadiance: SpectralRadiancePacket;
	/** Cosine-weighted solid-angle contribution to irradiance. */
	readonly irradianceWeightSteradians: number;
}>;

/** Inputs to the camera-independent receiver environmental-light reduction. */
type ReceiverEnvironmentLightReductionRequest = Readonly<{
	readonly samples: readonly ReceiverEnvironmentLightRadianceSample[];
}>;

/** One fixed receiver-local direction and its irradiance weight. */
type ReceiverEnvironmentLightDirectionSample = Readonly<{
	readonly directionLocal: UnitVector3;
	readonly irradianceWeightSteradians: number;
}>;

/** One complete published receiver-local environmental-light measurement. */
type ReceiverEnvironmentLightMeasurement = Readonly<{
	readonly identity: string;
	readonly directNormal: SpectralIrradiancePacket;
	readonly directHorizontal: SpectralIrradiancePacket;
	readonly diffuseHorizontal: SpectralIrradiancePacket;
	readonly totalHorizontal: SpectralIrradiancePacket;
	readonly photopicDirectNormalIlluminance: UnitValue<'lux'>;
	readonly photopicDirectHorizontalIlluminance: UnitValue<'lux'>;
	readonly photopicDiffuseHorizontalIlluminance: UnitValue<'lux'>;
	readonly photopicTotalHorizontalIlluminance: UnitValue<'lux'>;
	/** E_v / pi retained only for the pre-P3 Color implementation. */
	readonly totalHorizontalLuminanceProxy: UnitValue<'cd m^-2'>;
	/** Fixed-hemisphere approximation to median physical unmasked-sky luminance. */
	readonly stellarAdaptationLuminance: UnitValue<'cd m^-2'>;
	readonly diagnostics?: Readonly<{
		readonly gpuRadiances: readonly (readonly number[])[];
		readonly cpuRadiances: readonly (readonly number[])[];
		readonly gpuDiffuseHorizontal: readonly number[];
		readonly cpuDiffuseHorizontal: readonly number[];
		readonly gpuTotalHorizontal: readonly number[];
		readonly cpuTotalHorizontal: readonly number[];
		readonly gpuTotalHorizontalIlluminanceLux: number;
		readonly cpuTotalHorizontalIlluminanceLux: number;
	}>;
}>;

/** Batch transport callback used by the renderer-specific reduction pass. */
type ReceiverEnvironmentLightBuildRequest = Readonly<{
	readonly identity: string;
	readonly signal?: AbortSignal;
	readonly sampleIncomingRadiance: (
		directions: readonly ReceiverEnvironmentLightDirectionSample[],
	) => Promise<readonly SpectralRadiancePacket[]> | readonly SpectralRadiancePacket[];
	readonly reduceIncomingRadiance?: (
		radiances: readonly SpectralRadiancePacket[],
	) => Promise<SpectralIrradiancePacket> | SpectralIrradiancePacket;
}>;

/** Inputs to the production neutral Lambertian spectral response. */
type NeutralLambertianSceneLightingRequest = Readonly<{
	readonly identity: string;
	/** Source-normal incident spectral irradiance. */
	readonly directNormal: SpectralIrradiancePacket;
	/** Diffuse irradiance already integrated for surfaceNormal. */
	readonly diffuseIrradiance: SpectralIrradiancePacket;
	readonly surfaceNormal: UnitVector3;
	readonly directionToSource: UnitVector3;
	/** Wavelength-independent neutral reflectance; defaults to 0.18. */
	readonly reflectance?: number;
}>;

/** Separate and exactly additive output of the neutral Lambertian evaluator. */
type NeutralLambertianSceneLightingResponse = Readonly<{
	readonly identity: string;
	readonly reflectance: number;
	readonly directCosine: number;
	readonly directIrradiance: SpectralIrradiancePacket;
	readonly diffuseIrradiance: SpectralIrradiancePacket;
	readonly combinedIrradiance: SpectralIrradiancePacket;
	readonly directRadiance: SpectralRadiancePacket;
	readonly diffuseRadiance: SpectralRadiancePacket;
	readonly combinedRadiance: SpectralRadiancePacket;
}>;

/** Inputs needed to derive local direct irradiance from transported uniform-disk radiance. */
type LocalUniformDiskLightLevelRequest = Readonly<{
	/** Transported spectral radiance at the observation point. */
	readonly spectralRadiance: SpectralRadiancePacket;
	/** Disk-center elevation relative to the local horizon. */
	readonly elevationRadians: number;
	/** Uniform disk angular radius. */
	readonly angularRadiusRadians: number;
	/** Optional nonnegative floor for the coarse luminance proxy. */
	readonly adaptingLuminanceFloor?: number;
}>;

/** Direct-light measures plus the locally visible uniform-disk support. */
type LocalUniformDiskLightLevel = LocalDirectLightLevel &
	Readonly<{
		/** Projected disk fraction above the local horizon. */
		readonly visibleFraction: number;
		/** Visible projected disk solid angle in steradians. */
		readonly visibleProjectedSolidAngleSteradians: number;
	}>;
