import { SpectralPacket } from './SpectralPacket.js';
import { assertCompatibleSpectralBases } from './spectralBases.js';
import { normalizeSpectralUnits } from './spectral-packet-contract.js';

/**
 * Create a readonly spectral packet.
 *
 * @param {SpectralPacketDefinition | SpectralPacket} definition - Supplies packet data.
 * @returns {SpectralPacket} The validated packet.
 */
export function createSpectralPacket(definition) {
	return definition instanceof SpectralPacket ? definition : new SpectralPacket(definition);
}

/**
 * Assert a packet and optional expected interpretation.
 *
 * @param {unknown} value - Supplies the candidate packet.
 * @param {SpectralPacketExpectation} [expected] - Supplies optional quantity,
 * units, basis, or semantics.
 * @returns {SpectralPacket} The validated packet.
 */
export function assertSpectralPacket(value, expected = {}) {
	if (!(value instanceof SpectralPacket)) {
		throw new TypeError('Expected a SpectralPacket.');
	}

	if (expected.quantity !== undefined && value.quantity !== expected.quantity) {
		throw new TypeError(
			`Expected spectral quantity ${expected.quantity}; received ${value.quantity}.`,
		);
	}

	if (expected.units !== undefined
		&& value.units !== normalizeSpectralUnits(expected.units)) {
		throw new TypeError(
			`Expected spectral units ${normalizeSpectralUnits(expected.units)}; received ${value.units}.`,
		);
	}

	if (expected.basis !== undefined) {
		assertCompatibleSpectralBases(value.basis, expected.basis, 'Spectral packet bases');
	}

	if (expected.semantics !== undefined && value.semantics !== expected.semantics) {
		throw new TypeError(
			`Expected spectral semantics ${expected.semantics}; received ${value.semantics}.`,
		);
	}

	return value;
}

/**
 * Assert packets use compatible bases and optional matching interpretations.
 *
 * @param {unknown} left - Supplies the first packet.
 * @param {unknown} right - Supplies the second packet.
 * @param {SpectralPacketCompatibilityOptions} [options] - Selects quantity,
 * unit, and semantics checks.
 * @returns {readonly [SpectralPacket, SpectralPacket]} The validated packets.
 */
export function assertCompatibleSpectralPackets(left, right, options = {}) {
	const checkedLeft = assertSpectralPacket(left);
	const checkedRight = assertSpectralPacket(right);
	assertCompatibleSpectralBases(
		checkedLeft.basis,
		checkedRight.basis,
		'Spectral packet bases',
	);

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
