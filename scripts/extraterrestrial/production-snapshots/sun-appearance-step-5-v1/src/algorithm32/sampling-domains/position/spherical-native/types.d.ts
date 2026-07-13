/** Definition of one supported executable spherical native position domain. */
type SphericalNativePositionDomainDefinition = Readonly<{
	/** Unique identifier for the executable domain. */
	readonly id: string;
	/** Supported number of nodes in the native spherical lattice. */
	readonly count: 4 | 16 | 48;
	/** Optional first-node altitude; defaults to the production 2-meter boundary. */
	readonly boundaryAltitude?: Distance;
}>;

/** Executable native spherical position domain. */
interface SphericalNativePositionDomain extends PositionDomain {
	/** Unit-bearing ground radius used to generate the domain. */
	readonly bottomRadius: Distance;
	/** Unit-bearing atmosphere-top radius used to generate the domain. */
	readonly topRadius: Distance;
	/** Unit-bearing first-node altitude used to generate the domain. */
	readonly boundaryAltitude: Distance;
}
