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
	readonly spectralIrradiance: SpectralIrradiancePacket;
	readonly brightnessProxy: UnitValue<'cd m^-2'>;
	readonly diagnostics?: Readonly<{
		readonly gpuRadiances: readonly (readonly number[])[];
		readonly cpuRadiances: readonly (readonly number[])[];
		readonly gpuIrradiance: readonly number[];
		readonly cpuIrradiance: readonly number[];
		readonly gpuBrightnessProxy: number;
		readonly cpuBrightnessProxy: number;
	}>;
}>;

/** Batch transport callback used by the renderer-specific reduction pass. */
type ReceiverEnvironmentLightBuildRequest = Readonly<{
	readonly identity: string;
	readonly sampleIncomingRadiance: (
		directions: readonly ReceiverEnvironmentLightDirectionSample[],
	) => Promise<readonly SpectralRadiancePacket[]> | readonly SpectralRadiancePacket[];
	readonly reduceIncomingRadiance?: (
		radiances: readonly SpectralRadiancePacket[],
	) => Promise<SpectralIrradiancePacket> | SpectralIrradiancePacket;
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
