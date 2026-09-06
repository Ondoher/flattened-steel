import {
	immutableDescriptorData,
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';
import { canonicalZero } from './domainDescriptorSupport.js';

/**
 * Copy explicit unit vectors without changing their numeric identity.
 *
 * @param {readonly UnitVector3[]} unitVectors - Supplies trusted typed vectors.
 * @returns {readonly UnitVector3[]} Return independent vector metadata.
 */
function copyUnitVectors(unitVectors) {
	return unitVectors.map((vector) => /** @type {UnitVector3} */ ([
		canonicalZero(vector[0]),
		canonicalZero(vector[1]),
		canonicalZero(vector[2]),
	]));
}

/**
 * Copy optional solid-angle integration-weight metadata.
 *
 * @param {SolidAngleWeights | null | undefined} integrationWeights - Supplies
 * trusted typed weights.
 * @returns {SolidAngleWeights | null} Return independent weights or null.
 */
function copyIntegrationWeights(integrationWeights) {
	if (integrationWeights === undefined || integrationWeights === null) {
		return null;
	}

	return ({
		values: Array.from(integrationWeights.values),
		units: integrationWeights.units,
	});
}

/**
 * Own the immutable identity of one physical direction domain.
 *
 * Direction indices are descriptor-local identities. A matching integer in a
 * different direction domain never identifies the same physical direction.
 */
export class DirectionDomainDescriptor {
	/**
	 * Create direction-domain metadata from one trusted typed definition.
	 *
	 * @param {DirectionDomainDefinition} definition - Supplies complete domain
	 * identity, vectors, and optional integration weights.
	 */
	constructor(definition) {
		const frame = /** @type {Readonly<Record<string, unknown>>} */ (
			immutableDescriptorData(definition.frame)
		);
		const topology = /** @type {Readonly<Record<string, unknown>>} */ (
			immutableDescriptorData(definition.topology)
		);
		const interpolation = /** @type {Readonly<Record<string, unknown>>} */ (
			immutableDescriptorData(definition.interpolation)
		);
		const unitVectors = copyUnitVectors(definition.unitVectors);
		const count = definition.count === undefined
			? unitVectors.length
			: definition.count;
		const integrationWeights = copyIntegrationWeights(definition.integrationWeights);
		const identity = ({
			kind: 'direction-domain',
			id: definition.id,
			schemaRevision: definition.schemaRevision,
			generatorRevision: definition.generatorRevision,
			frame,
			topology,
			interpolation,
			precision: definition.precision,
			count,
			unitVectors,
			integrationWeights,
		});

		/** @type {"direction-domain"} */
		this.kind = 'direction-domain';
		/** @type {string} */
		this.id = definition.id;
		/** @type {string} */
		this.schemaRevision = definition.schemaRevision;
		/** @type {string} */
		this.generatorRevision = definition.generatorRevision;
		/** @type {Readonly<Record<string, unknown>>} */
		this.frame = frame;
		/** @type {Readonly<Record<string, unknown>>} */
		this.topology = topology;
		/** @type {Readonly<Record<string, unknown>>} */
		this.interpolation = interpolation;
		/** @type {string} */
		this.precision = definition.precision;
		/** @type {number} */
		this.count = count;
		/** @type {readonly UnitVector3[]} */
		this.unitVectors = unitVectors;
		/** @type {SolidAngleWeights | null} */
		this.integrationWeights = integrationWeights;
		/** @type {string} */
		this.contentHash = sha256Descriptor(identity);
	}
}
