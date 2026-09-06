import {
	FIBONACCI_34_DIRECTION_COUNT,
	FIBONACCI_34_DIRECTION_WEIGHT,
	FIBONACCI_34_GOLDEN_RATIO,
	FIBONACCI_34_PINNED_UNIT_VECTORS,
} from './domain-consts.js';
import { DirectionDomainDescriptor } from
	'./DirectionDomainDescriptor.js';

/**
 * Own the executable spherical/distant Fibonacci-34 quadrature separately
 * from its declarative descriptor metadata.
 */
export default class Fibonacci34DirectionDomain {
	/** @readonly @type {DirectionDomainDescriptor} */
	descriptor;
	/** @readonly @type {number} */
	directionCount;
	/** @readonly @type {readonly UnitVector3[]} */
	unitVectors;
	/** @readonly @type {SolidAngleWeights} */
	integrationWeights;

	/**
	 * Emit declarative metadata from this owner's executable facts.
	 *
	 * @returns {DirectionDomainDescriptor} The direction metadata.
	 */
	_createDescriptor() {
		return new DirectionDomainDescriptor({
			id: 'algorithm32-fibonacci-34-incoming-v1',
			schemaRevision:
				'algorithm32-direction-domain-v1',
			generatorRevision:
				'source-oriented-fibonacci-sphere-pinned-v1',
			frame: {
				kind:
					'source-local-fibonacci-pinned-frame-v1',
				coordinates: 'source-local',
				handedness: 'right',
				xAxisRole: 'toward-source',
				yAxisRole:
					'cross-projected-reference-with-source',
				zAxisRole: 'projected-reference',
				worldProjection: {
					kind:
						'threshold-reference-projection-v1',
					primaryReference: [0, 0, 1],
					alternateReference: [0, 1, 0],
					switchAtAbsoluteDot: 0.95,
				},
			},
			topology: {
				kind: 'fibonacci-sphere-points-v1',
				count: this.directionCount,
				indexing: 'ascending-index',
				centeredIndex: 'index - count / 2',
				latitudeCoordinate:
					'2 * centeredIndex / count',
				longitude:
					'2 * pi * centeredIndex / goldenRatio',
				goldenRatio: FIBONACCI_34_GOLDEN_RATIO,
			},
			interpolation: {
				kind: 'exact-quadrature-nodes-only',
			},
			precision: 'binary64-generated',
			count: this.directionCount,
			unitVectors: this.unitVectors,
			integrationWeights: this.integrationWeights,
		});
	}

	/** Create the fixed production Fibonacci-34 incoming quadrature. */
	constructor() {
		this.directionCount = FIBONACCI_34_DIRECTION_COUNT;
		this.unitVectors = FIBONACCI_34_PINNED_UNIT_VECTORS.map(
			(vector) => /** @type {UnitVector3} */ ([
				vector[0],
				vector[1],
				vector[2],
			]),
		);
		this.integrationWeights = {
			values: Array.from(
				{ length: this.directionCount },
				() => FIBONACCI_34_DIRECTION_WEIGHT,
			),
			units: 'steradians',
		};
		this.descriptor = this._createDescriptor();
	}
}
