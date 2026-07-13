import {CanonicalValueHash} from '../value-identity/CanonicalValueHash.js';
import {ValueValidation} from '../validation/ValueValidation.js';
import {SpectralBasis} from './SpectralBasis.js';
import {ALLOWED_SPECTRAL_QUANTITIES, SPECTRAL_QUANTITY_UNITS} from './consts.js';

/** Immutable spectral value with its complete interpretation and physical identity. */
export class SpectralPacket {
	/**
	 * Called by SpectralPacket construction to accept one supported physical
	 * quantity.
	 *
	 * @param {unknown} value - The candidate quantity.
	 * @returns {SpectralQuantity} - The accepted quantity.
	 * @throws {RangeError} - When the quantity is not supported.
	 */
	_requireQuantity(value) {
		const checked = ValueValidation.requiredString(value, 'SpectralPacket.quantity');
		if (!ALLOWED_SPECTRAL_QUANTITIES.has(checked)) {
			throw new RangeError(`Unsupported spectral quantity: ${checked}.`);
		}

		return /** @type {SpectralQuantity} */ (checked);
	}

	/**
	 * Called by SpectralPacket construction to select the canonical units for
	 * one accepted quantity.
	 *
	 * @param {SpectralQuantity} quantity - The accepted quantity.
	 * @returns {SpectralUnits} - The required canonical units.
	 */
	_unitsForQuantity(quantity) {
		return SPECTRAL_QUANTITY_UNITS.get(quantity);
	}

	/**
	 * Call this method to normalize supported punctuation variants to canonical
	 * spectral-unit spelling. This method changes spelling only and never
	 * rescales density values between wavelength measures.
	 *
	 * @param {unknown} value - The candidate units.
	 * @returns {string} - The canonical unit spelling.
	 */
	static normalizeUnits(value) {
		const checked = ValueValidation.requiredString(value, 'SpectralPacket.units');
		return checked
			.trim()
			.replace(/[.\u00b7]/gu, ' ')
			.replace(/\s+/gu, ' ');
	}

	/**
	 * Called by SpectralPacket construction to copy and validate one spectral
	 * numeric vector.
	 *
	 * @param {unknown} value - The candidate values.
	 * @param {number} channelCount - The exact channel count.
	 * @returns {readonly number[]} - The independently owned finite vector.
	 * @throws {RangeError} - When the vector has the wrong number of channels.
	 * @throws {TypeError} - When a channel value is not finite.
	 */
	_normalizeValues(value, channelCount) {
		if ((!Array.isArray(value) && !ValueValidation.isTypedArray(value)) || value.length !== channelCount) {
			throw new RangeError(`SpectralPacket.values must contain exactly ${channelCount} channels.`);
		}

		const copy = Array.from(value);
		if (!copy.every(Number.isFinite)) {
			throw new TypeError('SpectralPacket.values must all be finite.');
		}

		return copy;
	}

	/**
	 * Creates a validated spectral packet with normalized interpretation,
	 * independently owned values, and canonical content identity.
	 *
	 * @param {SpectralPacketDefinition} definition - The quantity, units,
	 * basis, values, and provenance.
	 * @throws {TypeError} - When the definition, interpretation, values, basis, or provenance is invalid.
	 * @throws {RangeError} - When the quantity or channel count is unsupported.
	 */
	constructor(definition = /** @type {SpectralPacketDefinition} */ ({})) {
		if (definition === null || typeof definition !== 'object' || Array.isArray(definition)) {
			throw new TypeError('SpectralPacket definition must be an object.');
		}

		const basis = SpectralBasis.assert(definition.basis, 'SpectralPacket.basis');
		const quantity = this._requireQuantity(definition.quantity);

		const units = SpectralPacket.normalizeUnits(definition.units);
		const requiredUnits = this._unitsForQuantity(quantity);
		if (units !== requiredUnits) {
			throw new TypeError(`Spectral quantity ${quantity} requires units ${requiredUnits}; received ${units}.`);
		}

		const semantics = ValueValidation.requiredString(
			definition.semantics === undefined ? basis.semantics : definition.semantics,
			'SpectralPacket.semantics',
		);
		if (semantics !== basis.semantics) {
			throw new TypeError('SpectralPacket semantics must match its spectral basis.');
		}

		const values = this._normalizeValues(definition.values, basis.channelCount);
		const provenanceIdentity = ValueValidation.requiredString(
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
		this.contentHash = CanonicalValueHash.sha256Value(identity);
	}

	/**
	 * Call this method to assert a packet and its optional expected
	 * interpretation.
	 *
	 * @param {unknown} value - The candidate packet.
	 * @param {SpectralPacketExpectation} [expected] - The optional quantity,
	 * units, basis, and semantics expectations.
	 * @returns {SpectralPacket} - The validated packet.
	 * @throws {TypeError} - When the candidate or an expected interpretation is incompatible.
	 */
	static assert(value, expected = {}) {
		if (!(value instanceof SpectralPacket)) {
			throw new TypeError('Expected a SpectralPacket.');
		}

		if (expected.quantity !== undefined && value.quantity !== expected.quantity) {
			throw new TypeError(`Expected spectral quantity ${expected.quantity}; received ${value.quantity}.`);
		}

		if (expected.units !== undefined && value.units !== SpectralPacket.normalizeUnits(expected.units)) {
			throw new TypeError(
				`Expected spectral units ${SpectralPacket.normalizeUnits(expected.units)}; received ${value.units}.`,
			);
		}

		if (expected.basis !== undefined) {
			SpectralBasis.assertCompatible(value.basis, expected.basis, 'Spectral packet bases');
		}

		if (expected.semantics !== undefined && value.semantics !== expected.semantics) {
			throw new TypeError(`Expected spectral semantics ${expected.semantics}; received ${value.semantics}.`);
		}

		return value;
	}

	/**
	 * Call this method to assert that two packets use compatible bases and any
	 * caller-selected matching interpretations.
	 *
	 * @param {unknown} left - The first packet.
	 * @param {unknown} right - The second packet.
	 * @param {SpectralPacketCompatibilityOptions} [options] - The quantity,
	 * unit, and semantics checks.
	 * @returns {readonly [SpectralPacket, SpectralPacket]} - The validated packets.
	 * @throws {TypeError} - When the packets or selected interpretations are incompatible.
	 */
	static assertCompatible(left, right, options = {}) {
		const checkedLeft = SpectralPacket.assert(left);
		const checkedRight = SpectralPacket.assert(right);
		SpectralBasis.assertCompatible(checkedLeft.basis, checkedRight.basis, 'Spectral packet bases');

		if (options.sameQuantity === true && checkedLeft.quantity !== checkedRight.quantity) {
			throw new TypeError('Spectral packet quantities are incompatible.');
		}

		if (options.sameUnits === true && checkedLeft.units !== checkedRight.units) {
			throw new TypeError('Spectral packet units are incompatible.');
		}

		if (options.sameSemantics !== false && checkedLeft.semantics !== checkedRight.semantics) {
			throw new TypeError('Spectral packet semantics are incompatible.');
		}

		return [checkedLeft, checkedRight];
	}

	/**
	 * Call this method to return the plain readonly spectral-packet identity.
	 *
	 * @returns {SpectralPacketJson} - The serialized packet value.
	 */
	toJSON() {
		return {
			kind: this.kind,
			quantity: this.quantity,
			units: this.units,
			basisHash: this.basisHash,
			semantics: this.semantics,
			values: this.values,
			provenanceIdentity: this.provenanceIdentity,
			contentHash: this.contentHash,
		};
	}
}
