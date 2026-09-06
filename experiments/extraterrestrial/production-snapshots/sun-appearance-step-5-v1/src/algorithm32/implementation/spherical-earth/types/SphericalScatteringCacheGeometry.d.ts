/** Source-aligned physical direction basis used by spherical cache conversion. */
type ScatteringCacheDirectionFrame = Readonly<{
	/** Physical source-aligned X axis. */
	readonly xAxis: UnitVector3;
	/** Physical source-aligned Y axis. */
	readonly yAxis: UnitVector3;
	/** Physical source-aligned Z axis. */
	readonly zAxis: UnitVector3;
}>;

/**
 * Normalization order retained by one spherical cache-direction frame.
 *
 * - **"fibonacci"** - Square-root normalization retained by the Fibonacci frame.
 * - **"w27"** - Hypotenuse normalization retained by the W27 frame.
 */
type SphericalDirectionFrameNormalization = 'fibonacci' | 'w27';

/** Aggregated transport tap used only by spherical transport packing. */
type SphericalTransportTap = {
	/** Source direction index in the selected construction domain. */
	readonly sourceDirectionIndex: number;
	/** Source position index in the selected construction domain. */
	readonly sourcePositionIndex: number;
	/** Spectral path coefficients for the aggregated tap. */
	readonly coefficients: Float64Array;
};

/** Internal physical request for one spherical transport query. */
type SphericalTransportQueryRequest = Readonly<{
	/** Atmosphere medium sampler for path extinction. */
	readonly atmosphere: Pick<AtmosphereModel, 'sampleMedium'>;
	/** Physical incoming-radiance direction. */
	readonly direction: UnitVector3;
	/** Outgoing-domain interpolation stencil for the physical direction. */
	readonly directionStencil: ScatteringCacheDirectionStencil;
	/** Accepted transport integration interval count. */
	readonly intervalCount: number;
	/** Selected construction position count. */
	readonly positionCount: number;
	/** Selected spectral channel count. */
	readonly spectralChannelCount: number;
	/** Selected construction position node. */
	readonly positionNode: PositionDomainNode;
}>;
