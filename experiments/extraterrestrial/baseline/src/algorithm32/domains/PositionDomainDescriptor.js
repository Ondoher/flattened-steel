import {
	immutableDescriptorData,
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';

/**
 * Copy one trusted typed physical node.
 *
 * @param {PositionDomainNodeDefinition} node - Supplies canonical node data.
 * @param {number} index - Supplies the ordered node index.
 * @returns {PositionDomainNode} Return independent node metadata.
 */
function copyNode(node, index) {
	const metadata = node.metadata === undefined
		? ({})
		: /** @type {Readonly<Record<string, unknown>>} */ (immutableDescriptorData(
			node.metadata,
		));

	return ({
		index: node.index === undefined ? index : node.index,
		coordinate: {
			value: node.coordinate.value,
			units: node.coordinate.units,
		},
		role: node.role === undefined ? 'interior-node' : node.role,
		metadata,
	});
}

/**
 * Copy ordered physical nodes whose owner already supplied canonical units.
 *
 * @param {readonly PositionDomainNodeDefinition[]} nodes - Supplies trusted nodes.
 * @returns {readonly PositionDomainNode[]} Return independent node metadata.
 */
function copyNodes(nodes) {
	return nodes.map(copyNode);
}

/**
 * Own the immutable identity of one ordered physical position domain.
 *
 * Position indices are meaningful only inside this descriptor. Consumers use
 * the explicit unit-bearing node coordinates and mapping identity rather than
 * deriving physical coordinates from a storage dimension.
 */
export class PositionDomainDescriptor {
	/**
	 * Create position-domain metadata from one trusted typed definition.
	 *
	 * @param {PositionDomainDefinition} definition - Supplies complete domain
	 * identity and ordered physical nodes in owner-selected canonical units.
	 */
	constructor(definition) {
		const mapping = /** @type {Readonly<Record<string, unknown>>} */ (
			immutableDescriptorData(definition.mapping)
		);
		const frame = /** @type {Readonly<Record<string, unknown>>} */ (
			immutableDescriptorData(definition.frame)
		);
		const interpolation = /** @type {Readonly<Record<string, unknown>>} */ (
			immutableDescriptorData(definition.interpolation)
		);
		const nodes = copyNodes(definition.nodes);
		const count = definition.count === undefined
			? nodes.length
			: definition.count;

		const identity = ({
			kind: 'position-domain',
			id: definition.id,
			schemaRevision: definition.schemaRevision,
			generatorRevision: definition.generatorRevision,
			mapping,
			frame,
			interpolation,
			precision: definition.precision,
			count,
			nodes,
		});

		/** @type {"position-domain"} */
		this.kind = 'position-domain';
		/** @type {string} */
		this.id = definition.id;
		/** @type {string} */
		this.schemaRevision = definition.schemaRevision;
		/** @type {string} */
		this.generatorRevision = definition.generatorRevision;
		/** @type {Readonly<Record<string, unknown>>} */
		this.mapping = mapping;
		/** @type {Readonly<Record<string, unknown>>} */
		this.frame = frame;
		/** @type {Readonly<Record<string, unknown>>} */
		this.interpolation = interpolation;
		/** @type {string} */
		this.precision = definition.precision;
		/** @type {number} */
		this.count = count;
		/** @type {readonly PositionDomainNode[]} */
		this.nodes = nodes;
		/** @type {string} */
		this.contentHash = sha256Descriptor(identity);
	}
}
