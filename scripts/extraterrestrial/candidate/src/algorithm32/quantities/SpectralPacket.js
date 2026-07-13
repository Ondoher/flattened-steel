import {
	requiredString,
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';
import { assertSpectralBasis } from './spectralBases.js';
import {
	normalizeSpectralUnits,
	normalizeSpectralValues,
	requireSpectralQuantity,
	spectralUnitsForQuantity,
} from './spectral-packet-contract.js';

/**
 * Own one immutable spectral value and its complete interpretation contract.
 */
export class SpectralPacket {
	/**
	 * Create a validated spectral packet.
	 *
	 * @param {SpectralPacketDefinition} definition - Supplies quantity, units,
	 * basis, values, and provenance.
	 */
	constructor(
		definition = /** @type {SpectralPacketDefinition} */ ({}),
	) {
		if (definition === null || typeof definition !== 'object' || Array.isArray(definition)) {
			throw new TypeError('SpectralPacket definition must be an object.');
		}

		const basis = assertSpectralBasis(definition.basis, 'SpectralPacket.basis');
		const quantity = requireSpectralQuantity(definition.quantity);

		const units = normalizeSpectralUnits(definition.units);
		const requiredUnits = spectralUnitsForQuantity(quantity);
		if (units !== requiredUnits) {
			throw new TypeError(
				`Spectral quantity ${quantity} requires units ${requiredUnits}; received ${units}.`,
			);
		}

		const semantics = requiredString(
			definition.semantics === undefined ? basis.semantics : definition.semantics,
			'SpectralPacket.semantics',
		);
		if (semantics !== basis.semantics) {
			throw new TypeError('SpectralPacket semantics must match its spectral basis.');
		}

		const values = normalizeSpectralValues(definition.values, basis.channelCount);
		const provenanceIdentity = requiredString(
			definition.provenanceIdentity,
			'SpectralPacket.provenanceIdentity',
		);
		const identity = /** @type {const} */ ({
			kind: 'algorithm32-spectral-packet',
			quantity,
			units,
			basisHash: basis.contentHash,
			semantics,
			values,
			provenanceIdentity,
		});

		this.kind = identity.kind;
		this.quantity = quantity;
		this.units = units;
		this.basis = basis;
		this.basisHash = basis.contentHash;
		this.semantics = semantics;
		this.values = values;
		this.provenanceIdentity = provenanceIdentity;
		this.contentHash = sha256Descriptor(identity);
	}

	/**
	 * Return plain readonly identity data.
	 *
	 * @returns {SpectralPacketJson} The serialized packet descriptor.
	 */
	toJSON() {
		return ({
			kind: this.kind,
			quantity: this.quantity,
			units: this.units,
			basisHash: this.basisHash,
			semantics: this.semantics,
			values: this.values,
			provenanceIdentity: this.provenanceIdentity,
			contentHash: this.contentHash,
		});
	}
}
