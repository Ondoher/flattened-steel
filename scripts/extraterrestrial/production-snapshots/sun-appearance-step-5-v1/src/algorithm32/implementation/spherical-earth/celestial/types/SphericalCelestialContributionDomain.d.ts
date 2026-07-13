/** Geometry operations delegated back to the current spherical boundary authority. */
interface SphericalCelestialGeometryOwner {
	/** Express one global celestial direction in the retained model frame. */
	expressCelestialDirectionInModel(direction: UnitVector3, observation: GeometryObservation): UnitVector3;
	/** Create the retained-frame receiver at one altitude above spherical ground. */
	createCelestialReceiverPositionAtAltitude(altitude: Distance): Position;
	/** Resolve the radial direction cosine of the local spherical horizon. */
	resolveCelestialHorizonRadialCosine(position: Position): number;
	/** Classify whether spherical ground blocks one receiver-to-source direction. */
	isCelestialDirectionGroundBlocked(position: Position, direction: UnitVector3): boolean;
	/** Resolve model-space position into the geometry's atmosphere coordinate. */
	resolveAtmosphereCoordinate(position: Position): AtmosphereCoordinate;
	/** Resolve a source ray through the geometry's current atmosphere-path policy. */
	resolveAtmospherePath(request: AtmospherePathRequest): AtmospherePath;
}

/** Configuration accepted by the spherical celestial contribution collaborator. */
type SphericalCelestialContributionDomainConfiguration = Readonly<{
	/** Current spherical geometry boundary authority. */
	readonly geometry: SphericalCelestialGeometryOwner;
	/** Normalized ground radius. */
	readonly bottomRadius: Distance;
	/** Normalized atmosphere-top radius. */
	readonly topRadius: Distance;
	/** Configured observer altitude. */
	readonly observerHeight: Distance;
	/** Configured construction-time observation. */
	readonly observation: GeometryObservation;
	/** Atmospheric light source shared with the celestial roster. */
	readonly lightSource: GeometryConfigurableLightSource;
	/** Configured atmospheric direction toward the distant Sun. */
	readonly directionToSource: UnitVector3;
}>;
