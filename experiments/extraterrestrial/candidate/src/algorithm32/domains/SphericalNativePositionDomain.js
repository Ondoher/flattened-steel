import {
	SPHERICAL_NATIVE_BOTTOM_RADIUS_METERS,
	SPHERICAL_NATIVE_BOUNDARY_ALTITUDE_METERS,
	SPHERICAL_NATIVE_POSITION_SCHEMA_REVISION,
	SPHERICAL_NATIVE_SUPPORTED_POSITION_COUNTS,
	SPHERICAL_NATIVE_TOP_RADIUS_METERS,
} from './domain-consts.js';
import { PositionDomainDescriptor } from './PositionDomainDescriptor.js';

/**
 * Own one executable native spherical position lattice independently of its
 * declarative descriptor copy.
 */
export default class SphericalNativePositionDomain {
	/** @readonly @type {PositionDomainDescriptor} */
	descriptor;
	/** @readonly @type {number} */
	count;
	/** @readonly @type {readonly PositionDomainNode[]} */
	nodes;
	/** @readonly @type {Distance} */
	bottomRadius;
	/** @readonly @type {Distance} */
	topRadius;

	/**
	 * Accept one complete supported domain definition.
	 *
	 * @param {SphericalNativePositionDomainDefinition} definition - Supplies
	 * the candidate definition.
	 * @returns {{ id: string, count: number, generatorRevision: string }} The
	 * accepted definition.
	 */
	_acceptDefinition(definition) {
		const count = definition.count;
		if (!SPHERICAL_NATIVE_SUPPORTED_POSITION_COUNTS.includes(count)) {
			throw new RangeError(
				'SphericalNativePositionDomain count must be one of 4, 16, or 48.',
			);
		}

		return {
			id: definition.id,
			count,
			generatorRevision: definition.generatorRevision === undefined
				? `native-${count}-legacy-altitude-nodes-v1`
				: definition.generatorRevision,
		};
	}

	/**
	 * Generate native nodes in the retained binary64 operation order.
	 *
	 * @param {number} count - Supplies the selected node count.
	 * @returns {readonly PositionDomainNode[]} The executable nodes.
	 */
	_createNodes(count) {
		const atmosphereHeight =
			SPHERICAL_NATIVE_TOP_RADIUS_METERS
			- SPHERICAL_NATIVE_BOTTOM_RADIUS_METERS;

		return Array.from({ length: count }, (_unused, index) => {
			const coordinateValue = index === 0
				? SPHERICAL_NATIVE_BOUNDARY_ALTITUDE_METERS
				: ((index + 0.5) / count) * atmosphereHeight;
			const role = index === 0
				? 'minimum-in-atmosphere-altitude'
				: 'uniform-altitude-bin-center';

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
		});
	}

	/**
	 * Create declarative metadata from executable owner facts.
	 *
	 * @param {{ id: string, count: number, generatorRevision: string }} definition
	 * - Supplies accepted identity values.
	 * @param {readonly PositionDomainNode[]} nodes - Supplies executable nodes.
	 * @param {Distance} bottomRadius - Supplies the executable ground radius.
	 * @param {Distance} topRadius - Supplies the executable atmosphere radius.
	 * @returns {PositionDomainDescriptor} The independent metadata descriptor.
	 */
	_createDescriptor(definition, nodes, bottomRadius, topRadius) {
		const atmosphereHeight =
			topRadius.value - bottomRadius.value;

		return new PositionDomainDescriptor({
			id: definition.id,
			schemaRevision: SPHERICAL_NATIVE_POSITION_SCHEMA_REVISION,
			generatorRevision: definition.generatorRevision,
			mapping: {
				kind: 'spherical-altitude-above-ground-v1',
				bottomRadius,
				topRadius,
				atmosphereHeight: {
					value: atmosphereHeight,
					units: 'meters',
				},
				boundary: {
					value: SPHERICAL_NATIVE_BOUNDARY_ALTITUDE_METERS,
					units: 'meters',
				},
				nodeFormula: {
					boundary: 'coordinate[0] = boundary',
					interior:
						'coordinate[i] = ((i + 0.5) / count) * atmosphereHeight',
				},
			},
			frame: {
				kind: 'spherical-radial-altitude-frame-v1',
				coordinate: 'altitude-above-ground',
				physicalDirection: 'geometry-owned-radial-direction',
			},
			interpolation: {
				kind: 'linear-actual-neighboring-nodes-v1',
				scope: 'final-view-only',
				outsideDomain: 'clamp',
				exactNode: 'single-tap',
				constructionLookup:
					'retained-legacy-altitude-bin-nearest-v1',
			},
			precision: 'binary64-generated',
			count: definition.count,
			nodes,
		});
	}

	/**
	 * Create one supported native spherical position lattice.
	 *
	 * @param {SphericalNativePositionDomainDefinition} definition - Supplies
	 * the domain identity, selected count, and optional generator identity.
	 */
	constructor(definition) {
		const accepted =
			this._acceptDefinition(definition);
		const nodes = this._createNodes(accepted.count);
		const bottomRadius = {
			value: SPHERICAL_NATIVE_BOTTOM_RADIUS_METERS,
			units: /** @type {"meters"} */ ('meters'),
		};
		const topRadius = {
			value: SPHERICAL_NATIVE_TOP_RADIUS_METERS,
			units: /** @type {"meters"} */ ('meters'),
		};

		this.count = accepted.count;
		this.nodes = nodes;
		this.bottomRadius = bottomRadius;
		this.topRadius = topRadius;
		this.descriptor = this._createDescriptor(
			accepted,
			nodes,
			bottomRadius,
			topRadius,
		);
	}
}
