/** Definition of one supported executable spherical native position domain. */
type SphericalNativePositionDomainDefinition = Readonly<{
	/** Unique identifier for the executable domain. */
	readonly id: string;
	/** Supported number of nodes in the native spherical lattice. */
	readonly count: 4 | 16 | 48;
	/** Optional first-node altitude; defaults to the production ground boundary at zero metres. */
	readonly boundaryAltitude?: Distance;
}>;

/** Closed distant-Sun construction-grid selection; the default is Native48.
 * - **"native48"** - Retained ground boundary and 47 native altitude-bin centres.
 * - **"native51-near-ground"** - Native48 plus point samples at 468.75, 937.5, and 1406.25 metres.
 */
type SphericalNativePositionDomainSelection = 'native48' | 'native51-near-ground';

/** Physical altitude-domain ingress; descriptive node metadata is not executable authority. */
type SphericalNativePositionDomainInput = Readonly<{
	/** Serialized identity checked after the physical grid is resolved. */
	id: string;
	/** Number of physical point samples. */
	count: number;
	/** Ordered, indexed point coordinates with explicit distance units. */
	nodes: readonly Pick<PositionDomainNode, 'index' | 'coordinate'>[];
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
