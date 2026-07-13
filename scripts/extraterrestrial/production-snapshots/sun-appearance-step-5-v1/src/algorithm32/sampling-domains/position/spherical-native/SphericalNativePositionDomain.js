import DistanceMath from '../../../math/DistanceMath.js';

const DEFAULT_BOUNDARY_ALTITUDE_METERS = 0;

/** Executable native spherical position lattice. */
export default class SphericalNativePositionDomain {
	/**
	 * Unique identifier for the executable domain.
	 *
	 * @readonly
	 * @type {string}
	 */
	id;
	/**
	 * Number of nodes in the native spherical lattice.
	 *
	 * @readonly
	 * @type {number}
	 */
	count;
	/**
	 * Executable nodes in native storage order.
	 *
	 * @readonly
	 * @type {readonly PositionDomainNode[]}
	 */
	nodes;
	/**
	 * Unit-bearing ground radius used to generate the domain.
	 *
	 * @readonly
	 * @type {Distance}
	 */
	bottomRadius;
	/**
	 * Unit-bearing atmosphere-top radius used to generate the domain.
	 *
	 * @readonly
	 * @type {Distance}
	 */
	topRadius;
	/**
	 * Unit-bearing first-node altitude used to generate the domain.
	 *
	 * @readonly
	 * @type {Distance}
	 */
	boundaryAltitude;

	/**
	 * Called by construction to accept one complete supported domain definition.
	 *
	 * @param {SphericalNativePositionDomainDefinition} definition - The candidate definition.
	 * @returns {SphericalNativePositionDomainDefinition} - The accepted definition.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_acceptDefinition(definition) {
		const count = definition.count;
		if (![4, 16, 48].includes(count)) {
			throw new RangeError('SphericalNativePositionDomain count must be one of 4, 16, or 48.');
		}

		const requestedBoundaryAltitude =
			definition.boundaryAltitude ?? DistanceMath.inMeters(DEFAULT_BOUNDARY_ALTITUDE_METERS);
		DistanceMath.assertDistance(requestedBoundaryAltitude, 'SphericalNativePositionDomain boundaryAltitude');
		const boundaryAltitude = DistanceMath.inMeters(DistanceMath.toMeters(requestedBoundaryAltitude));
		const atmosphereHeightMeters = 6420000 - 6360000;
		const firstInteriorAltitudeMeters = (1.5 / count) * atmosphereHeightMeters;
		if (boundaryAltitude.value < 0 || boundaryAltitude.value >= firstInteriorAltitudeMeters) {
			throw new RangeError(
				'SphericalNativePositionDomain boundaryAltitude must precede the first interior node.',
			);
		}

		return {
			id: definition.id,
			count,
			boundaryAltitude,
		};
	}

	/**
	 * Called by construction to generate native nodes in the retained binary64 operation order. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {number} count - The selected node count.
	 * @param {number} bottomRadiusMeters - The ground radius in meters.
	 * @param {number} topRadiusMeters - The atmosphere-top radius in meters.
	 * @returns {readonly PositionDomainNode[]} - The executable nodes.
	 */
	_createNodes(count, bottomRadiusMeters, topRadiusMeters, boundaryAltitudeMeters) {
		const atmosphereHeight = topRadiusMeters - bottomRadiusMeters;

		return Array.from(
			{length: count},
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @param _unused - The intentionally unused callback value.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (_unused, index) => {
				const coordinateValue =
					index === 0 ? boundaryAltitudeMeters : ((index + 0.5) / count) * atmosphereHeight;
				const role = index === 0 ? 'minimum-in-atmosphere-altitude' : 'uniform-altitude-bin-center';

				return {
					index,
					coordinate: {
						value: coordinateValue,
						units: 'meters',
					},
					role,
					metadata: {
						constructionNodePolicy: role,
					},
				};
			},
		);
	}

	/**
	 * Creates one supported native spherical position lattice.
	 *
	 * @param {SphericalNativePositionDomainDefinition} definition - The domain identity and selected count.
	 */
	constructor(definition) {
		const accepted = this._acceptDefinition(definition);
		const bottomRadiusMeters = 6360000;
		const topRadiusMeters = 6420000;
		const nodes = this._createNodes(
			accepted.count,
			bottomRadiusMeters,
			topRadiusMeters,
			accepted.boundaryAltitude.value,
		);
		const bottomRadius = {
			value: bottomRadiusMeters,
			units: /** @type {DistanceUnits} */ ('meters'),
		};
		const topRadius = {
			value: topRadiusMeters,
			units: /** @type {DistanceUnits} */ ('meters'),
		};

		this.id = accepted.id;
		this.count = accepted.count;
		this.nodes = nodes;
		this.bottomRadius = bottomRadius;
		this.topRadius = topRadius;
		this.boundaryAltitude = accepted.boundaryAltitude;
	}
}
