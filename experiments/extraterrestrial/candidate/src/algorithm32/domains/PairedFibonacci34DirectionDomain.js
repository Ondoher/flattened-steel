import { DirectionDomainDescriptor } from './DirectionDomainDescriptor.js';
import {
	PAIRED_FIBONACCI_34_DIRECTION_COUNT,
	PAIRED_FIBONACCI_34_DIRECTION_ID,
	PAIRED_FIBONACCI_34_DIRECTION_WEIGHT,
	PAIRED_FIBONACCI_34_GOLDEN_RATIO,
	PAIRED_FIBONACCI_34_PAIR_COUNT,
	PAIRED_FIBONACCI_34_PINNED_UNIT_VECTORS,
} from './domain-consts.js';

/**
 * Own the executable paired-Fibonacci-34 incoming quadrature independently
 * of its declarative descriptor copy.
 */
export default class PairedFibonacci34DirectionDomain {
	/** @readonly @type {DirectionDomainDescriptor} */
	descriptor;
	/** @readonly @type {number} */
	directionCount;
	/** @readonly @type {number} */
	pairCount;
	/** @readonly @type {readonly UnitVector3[]} */
	unitVectors;
	/** @readonly @type {SolidAngleWeights} */
	integrationWeights;

	/**
	 * Create declarative metadata from the executable quadrature facts.
	 *
	 * @returns {DirectionDomainDescriptor} The independent metadata descriptor.
	 */
	_createDescriptor() {
		return new DirectionDomainDescriptor({
			id: PAIRED_FIBONACCI_34_DIRECTION_ID,
			schemaRevision: 'algorithm32-direction-domain-v1',
			generatorRevision:
				'source-local-equal-area-hemisphere-fibonacci-antipodal-pinned-v1',
			frame: {
				kind: 'source-subpoint-radial-tangent-vertical',
				coordinates: 'source-subpoint-local',
				handedness: 'right',
				xAxisRole: 'radial-away-from-source-subpoint',
				yAxisRole: 'positive-planar-tangent',
				zAxisRole: 'vertical-up',
				worldProjection: 'geometry-owned-per-position',
			},
			topology: {
				kind: 'paired-fibonacci-equal-area-hemisphere-v1',
				count: this.directionCount,
				pairCount: this.pairCount,
				indexing: 'pair-major-positive-then-antipode',
				hemisphereCoordinate:
					'(pairIndex + 0.5) / pairCount',
				longitude:
					'2 * pi * pairIndex / goldenRatio',
				goldenRatio:
					PAIRED_FIBONACCI_34_GOLDEN_RATIO,
				antipodalCompletion: 'exact-negation',
			},
			interpolation: {
				kind: 'exact-quadrature-nodes-only',
			},
			precision: 'binary64-pinned',
			count: this.directionCount,
			unitVectors: this.unitVectors,
			integrationWeights: this.integrationWeights,
		});
	}

	/** Create the fixed production paired-Fibonacci-34 quadrature. */
	constructor() {
		const unitVectors =
			PAIRED_FIBONACCI_34_PINNED_UNIT_VECTORS.map(
				(vector) => /** @type {UnitVector3} */ ([
					vector[0],
					vector[1],
					vector[2],
				]),
			);
		const integrationWeights = {
			values: Array.from(
				{ length: PAIRED_FIBONACCI_34_DIRECTION_COUNT },
				() => PAIRED_FIBONACCI_34_DIRECTION_WEIGHT,
			),
			units: /** @type {const} */ ('steradians'),
		};

		this.directionCount =
			PAIRED_FIBONACCI_34_DIRECTION_COUNT;
		this.pairCount = PAIRED_FIBONACCI_34_PAIR_COUNT;
		this.unitVectors = unitVectors;
		this.integrationWeights = integrationWeights;
		this.descriptor = this._createDescriptor();
	}
}
