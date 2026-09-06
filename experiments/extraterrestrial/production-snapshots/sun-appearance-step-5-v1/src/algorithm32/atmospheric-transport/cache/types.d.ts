/**
 * Carry one geometry-resolved transport kernel in the selected production logical
 * shape, adapted to scalar CacheData textures.
 */
type CacheTransportData = Readonly<{
	/** Absent for the retained fixed-width packed representation. */
	kind?: undefined;
	/** Value that stores the number of position-major output queries. */
	queryCount: number;
	/** Value that stores the fixed packed-tap capacity of every query. */
	tapCount: number;
	/** Value that stores direction index, position index, and active flag for every tap. */
	sources: CacheData;
	/** Value that stores spectral T * ds * interpolation coefficients for every tap. */
	coefficients: CacheData;
}>;

/** Contract that exposes one coherent executable construction lattice. */
interface CacheConstructionDomains {
	/** Value that identifies the exact construction-domain selection. */
	readonly id: string;
	/** Selected spectral basis for every field packing in this lattice. */
	readonly spectralBasis: SpectralBasis;
	/** Selected spectral layer count. */
	readonly spectralChannelCount: number;
	/** Value that stores the executable position domain. */
	readonly positionDomain: PositionDomain;
	/** Value that stores executable ordered position nodes. */
	readonly positionNodes: readonly PositionDomainNode[];
	/** Value that stores the executable position extent. */
	readonly positionCount: number;
	/** Value that stores the executable incoming-radiance direction domain. */
	readonly incomingDirectionDomain: DirectionDomain;
	/** Value that stores executable incoming-radiance directions. */
	readonly incomingUnitVectors: readonly UnitVector3[];
	/** Value that stores one integration weight per incoming direction. */
	readonly incomingIntegrationWeights: SolidAngleWeights;
	/** Value that stores the executable incoming-direction extent. */
	readonly incomingDirectionCount: number;
	/** Value that stores the executable outgoing-scattering direction domain. */
	readonly outgoingDirectionDomain: DirectionDomain;
	/** Value that stores executable outgoing-scattering directions. */
	readonly outgoingUnitVectors: readonly UnitVector3[];
	/** Value that stores the executable outgoing-direction extent. */
	readonly outgoingDirectionCount: number;
	/**
	 * Call this method to resolve one source-local direction through the selected outgoing domain.
	 * @param direction - The direction value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	resolveOutgoingDirectionStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;
}

/** Type that supplies physical collaborators for geometry-owned transport packing. */
type CacheTransportDataRequest = Readonly<{
	/** Value that supplies atmosphere-owned extinction sampling. */
	atmosphere: Pick<AtmosphereModel, 'sampleMedium'>;
	/** Value that supplies the source-selected executable construction lattice. */
	domains: CacheConstructionDomains;
	/** Value that supplies the source-owned physical direction toward the source. */
	directionToSource: UnitVector3;
	/** Value that supplies the accepted construction path interval count. */
	intervalCount: number;
}>;

/** Contract that supplies geometry-resolved packed transport data to a source-owned plan. */
interface CacheTransportDataProvider<TransportRequest = CacheTransportDataRequest> {
	/**
	 * Call this method to create transport data.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ createTransportData(request: TransportRequest): CacheTransportData;
}
