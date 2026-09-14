/** Native48 refinement with three additional point samples in its first altitude interval.
 *
 * @implements {PositionDomain}
 */
export default class NearGround51PositionDomain {
	/** Versioned identity of the fixed near-ground refinement. @readonly @type {string} */
	id = 'algorithm32-native-51-near-ground-position-v1';
	/** Number of retained physical altitude samples. @readonly @type {number} */
	count;
	/** Point samples in increasing altitude order, with metre units. @readonly @type {readonly PositionDomainNode[]} */
	nodes;
	/** Ground radius inherited from the accepted Native48 owner. @readonly @type {Distance} */
	bottomRadius;
	/** Atmosphere-top radius inherited from the accepted Native48 owner. @readonly @type {Distance} */
	topRadius;
	/** Retained ground-level first sample. @readonly @type {Distance} */
	boundaryAltitude;

	/**
	 * Creates the fixed refinement from the accepted Native48 construction owner.
	 *
	 * @param {SphericalNativePositionDomain} baseDomain - Canonical Native48 owner supplied by this module's owner registry.
	 */
	constructor(baseDomain) {
		const firstIntervalUpperMeters = baseDomain.nodes[1].coordinate.value;
		const additions = [1, 2, 3].map((quarter) => ({
			index: quarter,
			coordinate: {
				value: (quarter * firstIntervalUpperMeters) / 4,
				units: /** @type {DistanceUnits} */ ('meters'),
			},
			role: 'near-ground-interval-quarter',
			metadata: {
				constructionNodePolicy: 'near-ground-interval-quarter',
				sourceDomainIdentity: baseDomain.id,
			},
		}));
		this.nodes = [baseDomain.nodes[0], ...additions, ...baseDomain.nodes.slice(1)].map((node, index) => ({
			...node,
			index,
		}));
		this.count = this.nodes.length;
		this.bottomRadius = baseDomain.bottomRadius;
		this.topRadius = baseDomain.topRadius;
		this.boundaryAltitude = baseDomain.boundaryAltitude;
	}
}
