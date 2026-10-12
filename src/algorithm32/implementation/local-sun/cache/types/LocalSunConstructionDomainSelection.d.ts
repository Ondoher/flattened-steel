/**
 * Coherent executable z-by-rho, Fibonacci, and cubed-sphere
 * selection for local-Sun CPU and GPU fields.
 */
export default class LocalSunConstructionDomainSelection {
	/**
	 * Creates one source-owned construction-domain selection.
	 *
	 * @param definition - The executable owners and identities.
	 */
	constructor(definition: LocalSunConstructionDomainSelectionDefinition);

	/** Construction-domain contract kind. */
	readonly kind: 'local-sun-construction-domain-selection';
	/** Unique identifier for the construction-domain selection. */
	readonly id: string;
	/** Executable position domain. */
	readonly positionDomain: LocalSunPositionDomainOwner;
	/** Z-major, rho-fast flattened position nodes. */
	readonly positionNodes: readonly PositionDomainNode[];
	/** Ordered altitude nodes. */
	readonly zNodes: readonly Distance[];
	/** Ordered radial nodes. */
	readonly rhoNodes: readonly Distance[];
	/** Number of altitude nodes. */
	readonly zCount: number;
	/** Number of radial nodes. */
	readonly rhoCount: number;
	/** Number of flattened position nodes. */
	readonly positionCount: number;
	/** Executable spectral basis. */
	readonly spectralBasis: SpectralBasis;
	/** Number of executable spectral channels. */
	readonly spectralChannelCount: number;
	/** Executable incoming-direction domain. */
	readonly incomingDirectionDomain: LocalSunIncomingDirectionDomain;
	/** Fibonacci incoming unit vectors. */
	readonly incomingUnitVectors: readonly UnitVector3[];
	/** Fibonacci solid-angle weights. */
	readonly incomingIntegrationWeights: SolidAngleWeights;
	/** Number of executable incoming directions. */
	readonly incomingDirectionCount: number;
	/** Executable outgoing-direction domain. */
	readonly outgoingDirectionDomain: CubedSphereDirectionDomain;
	/** Cubed-sphere outgoing unit vectors. */
	readonly outgoingUnitVectors: readonly UnitVector3[];
	/** Number of executable outgoing directions. */
	readonly outgoingDirectionCount: number;
	/** Positive-axis cubed-sphere face-center addresses. */
	readonly outgoingPositiveFaceCenterIndices: CubedSpherePositiveFaceCenterIndices;
	/** Executable incoming-radiance packing. */
	readonly radiancePacking: LocalSunFieldPacking;
	/** Executable outgoing scattering-density packing. */
	readonly scatteringDensityPacking: LocalSunFieldPacking;

	/**
	 * Call this method to resolve one source-local outgoing direction through
	 * the selected W domain.
	 *
	 * @param direction - The source-local direction.
	 * @returns - The four-tap W stencil.
	 */
	resolveOutgoingDirectionStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;

	/**
	 * Call this method to derive the selected production domain from active flat
	 * geometry and optional convergence overrides.
	 *
	 * @param geometry - The z-by-rho geometry owner.
	 * @param options - The optional convergence overrides.
	 * @returns - The coherent construction-domain selection.
	 */
	static fromGeometry(
		geometry: LocalSunConstructionDomainGeometry,
		options?: LocalSunConstructionDomainGeometryOptions,
	): LocalSunConstructionDomainSelection;

	/** Construct a profile-sized selection without Native domain fallbacks. */
	static fromProfile(profile: Algorithm32ExecutionProfile): LocalSunConstructionDomainSelection;

	/** Select actual compact domains with no rectangular axes or resident fields. */
	static fromCompactProfile(profile: unknown): LocalSunCompactConstructionDomains;
}
