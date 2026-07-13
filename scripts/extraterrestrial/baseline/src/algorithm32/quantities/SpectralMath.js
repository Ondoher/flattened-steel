import {
	requiredString,
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';
import { assertSpectralBasis } from './spectralBases.js';
import {
	assertCompatibleSpectralPackets,
	assertSpectralPacket,
	createSpectralPacket,
} from './spectral-packets.js';

/**
 * Assert an operation declares both parts of its result interpretation.
 *
 * @param {unknown} result - Supplies result data.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {SpectralResultInterpretation} The validated result data.
 */
function assertResultInterpretation(result, label) {
	if (result === null || typeof result !== 'object' || Array.isArray(result)) {
		throw new TypeError(`${label} requires explicit result quantity and units.`);
	}
	const candidate = /** @type {Partial<SpectralResultInterpretation>} */ (result);

	return /** @type {SpectralResultInterpretation} */ ({
		quantity: requiredString(candidate.quantity, `${label} result quantity`),
		units: requiredString(candidate.units, `${label} result units`),
		provenanceIdentity: candidate.provenanceIdentity === undefined
			? undefined
			: requiredString(candidate.provenanceIdentity, `${label} provenanceIdentity`),
	});
}

/**
 * Accept optional spectral operation options at the public boundary.
 *
 * @param {unknown} options - Supplies optional operation options.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {SpectralOperationOptions} The accepted options.
 */
function acceptOperationOptions(options, label) {
	if (options === undefined) {
		return {};
	}

	if (options === null || typeof options !== 'object' || Array.isArray(options)) {
		throw new TypeError(`${label} options must be an object when supplied.`);
	}

	const candidate = /** @type {SpectralOperationOptions} */ (options);
	if (candidate.provenanceIdentity !== undefined) {
		requiredString(candidate.provenanceIdentity, `${label} provenanceIdentity`);
	}

	return candidate;
}

/**
 * Accept the optional mapping result interpretation.
 *
 * @param {unknown} result - Supplies optional result interpretation data.
 * @returns {Partial<SpectralResultInterpretation>} The accepted result data.
 */
function acceptMappingResult(result) {
	if (result === undefined) {
		return {};
	}

	if (result === null || typeof result !== 'object' || Array.isArray(result)) {
		throw new TypeError('Spectral mapping result must be an object when supplied.');
	}

	const candidate = /** @type {Partial<SpectralResultInterpretation>} */ (result);
	const replacesInterpretation = candidate.quantity !== undefined || candidate.units !== undefined;

	if (replacesInterpretation) {
		return assertResultInterpretation(candidate, 'Spectral mapping');
	}

	return {
		provenanceIdentity: candidate.provenanceIdentity === undefined
			? undefined
			: requiredString(candidate.provenanceIdentity, 'Spectral mapping provenanceIdentity'),
	};
}

/**
 * Use explicit provenance or derive it only when the property is absent.
 *
 * @param {unknown} value - Supplies optional explicit provenance.
 * @param {string} label - Supplies a diagnostic label.
 * @param {() => string} createDefault - Derives provenance for an absent value.
 * @returns {string} The accepted or derived provenance identity.
 */
function resolveProvenanceIdentity(value, label, createDefault) {
	return value === undefined
		? createDefault()
		: requiredString(value, `${label} provenanceIdentity`);
}

/**
 * Create deterministic provenance for a derived packet.
 *
 * @param {string} operation - Supplies operation identity.
 * @param {readonly string[]} inputs - Supplies input packet hashes.
 * @param {Readonly<Record<string, unknown>>} [parameters] - Supplies operation parameters.
 * @returns {string} The derived provenance identity.
 */
function derivedProvenanceIdentity(operation, inputs, parameters = {}) {
	return `derived:${operation}:${sha256Descriptor({ operation, inputs, parameters })}`;
}

/**
 * Create a zero-valued packet with an explicit interpretation.
 *
 * @param {SpectralPacketFactoryDefinition} definition - Supplies basis, quantity, units, and provenance.
 * @returns {SpectralPacket} The zero packet.
 */
export function zeroSpectralPacket(definition) {
	const basis = assertSpectralBasis(definition.basis);
	return createSpectralPacket({
		basis,
		quantity: definition.quantity,
		units: definition.units,
		semantics: definition.semantics === undefined ? basis.semantics : definition.semantics,
		values: Array.from({ length: basis.channelCount }, () => 0),
		provenanceIdentity: requiredString(
			definition.provenanceIdentity,
			'zeroSpectralPacket.provenanceIdentity',
		),
	});
}

/**
 * Create a one-valued packet with an explicit interpretation.
 *
 * @param {SpectralPacketFactoryDefinition} definition - Supplies basis, quantity, units, and provenance.
 * @returns {SpectralPacket} The one packet.
 */
export function oneSpectralPacket(definition) {
	const basis = assertSpectralBasis(definition.basis);
	return createSpectralPacket({
		basis,
		quantity: definition.quantity,
		units: definition.units,
		semantics: definition.semantics === undefined ? basis.semantics : definition.semantics,
		values: Array.from({ length: basis.channelCount }, () => 1),
		provenanceIdentity: requiredString(
			definition.provenanceIdentity,
			'oneSpectralPacket.provenanceIdentity',
		),
	});
}

/**
 * Scale a spectral packet without changing its physical interpretation.
 *
 * @param {unknown} packet - Supplies the source packet.
 * @param {number} scalar - Supplies the finite scalar.
 * @param {SpectralOperationOptions} [options] - Supplies optional derived provenance identity.
 * @returns {SpectralPacket} The scaled packet.
 */
export function scaleSpectralPacket(packet, scalar, options) {
	const checked = assertSpectralPacket(packet);
	const acceptedOptions = acceptOperationOptions(options, 'Spectral scale');
	if (!Number.isFinite(scalar)) {
		throw new TypeError('Spectral scale must be finite.');
	}

	return createSpectralPacket({
		basis: checked.basis,
		quantity: checked.quantity,
		units: checked.units,
		semantics: checked.semantics,
		values: checked.values.map((value) => value * scalar),
		provenanceIdentity: resolveProvenanceIdentity(
			acceptedOptions.provenanceIdentity,
			'Spectral scale',
			() => derivedProvenanceIdentity('scale', [checked.contentHash], { scalar }),
		),
	});
}

/**
 * Add packets with identical quantity, units, basis, and semantics.
 *
 * @param {unknown} left - Supplies the first packet.
 * @param {unknown} right - Supplies the second packet.
 * @param {SpectralOperationOptions} [options] - Supplies optional derived provenance identity.
 * @returns {SpectralPacket} The sum.
 */
export function addSpectralPackets(left, right, options) {
	const acceptedOptions = acceptOperationOptions(options, 'Spectral addition');
	const [checkedLeft, checkedRight] = assertCompatibleSpectralPackets(left, right, {
		sameQuantity: true,
		sameUnits: true,
		sameSemantics: true,
	});

	return createSpectralPacket({
		basis: checkedLeft.basis,
		quantity: checkedLeft.quantity,
		units: checkedLeft.units,
		semantics: checkedLeft.semantics,
		values: checkedLeft.values.map((value, index) =>
			value + checkedRight.values[index]),
		provenanceIdentity: resolveProvenanceIdentity(
			acceptedOptions.provenanceIdentity,
			'Spectral addition',
			() => derivedProvenanceIdentity(
				'add',
				[checkedLeft.contentHash, checkedRight.contentHash],
			),
		),
	});
}

/**
 * Multiply compatible packets with an explicit result quantity and units.
 *
 * @param {unknown} left - Supplies the first packet.
 * @param {unknown} right - Supplies the second packet.
 * @param {SpectralResultInterpretation} result - Supplies required result quantity and units.
 * @returns {SpectralPacket} The product.
 */
export function multiplySpectralPackets(left, right, result) {
	const definition = assertResultInterpretation(result, 'Spectral multiplication');
	const [checkedLeft, checkedRight] = assertCompatibleSpectralPackets(
		left,
		right,
		{ sameSemantics: true },
	);

	return createSpectralPacket({
		basis: checkedLeft.basis,
		quantity: definition.quantity,
		units: definition.units,
		semantics: checkedLeft.semantics,
		values: checkedLeft.values.map((value, index) =>
			value * checkedRight.values[index]),
		provenanceIdentity: resolveProvenanceIdentity(
			definition.provenanceIdentity,
			'Spectral multiplication',
			() => derivedProvenanceIdentity(
				'multiply',
				[checkedLeft.contentHash, checkedRight.contentHash],
				{ quantity: definition.quantity, units: definition.units },
			),
		),
	});
}

/**
 * Divide compatible packets with an explicit result quantity and units.
 *
 * @param {unknown} numerator - Supplies the numerator packet.
 * @param {unknown} denominator - Supplies the denominator packet.
 * @param {SpectralResultInterpretation} result - Supplies required result quantity and units.
 * @returns {SpectralPacket} The quotient.
 */
export function divideSpectralPackets(numerator, denominator, result) {
	const definition = assertResultInterpretation(result, 'Spectral division');
	const [checkedNumerator, checkedDenominator] = assertCompatibleSpectralPackets(
		numerator,
		denominator,
		{ sameSemantics: true },
	);

	if (checkedDenominator.values.some((value) => value === 0)) {
		throw new RangeError('Spectral division denominator must not contain zero.');
	}

	return createSpectralPacket({
		basis: checkedNumerator.basis,
		quantity: definition.quantity,
		units: definition.units,
		semantics: checkedNumerator.semantics,
		values: checkedNumerator.values.map((value, index) =>
			value / checkedDenominator.values[index]),
		provenanceIdentity: resolveProvenanceIdentity(
			definition.provenanceIdentity,
			'Spectral division',
			() => derivedProvenanceIdentity(
				'divide',
				[checkedNumerator.contentHash, checkedDenominator.contentHash],
				{ quantity: definition.quantity, units: definition.units },
			),
		),
	});
}

/**
 * Map packet values while retaining or explicitly replacing interpretation.
 *
 * Replacing an interpretation requires both quantity and units so a caller
 * cannot accidentally relabel only half of the physical contract.
 *
 * @param {unknown} packet - Supplies the source packet.
 * @param {(value: number, index: number, packet: SpectralPacket) => number} mapper - Supplies the channel mapper.
 * @param {Partial<SpectralResultInterpretation>} [result] - Supplies optional result interpretation.
 * @returns {SpectralPacket} The mapped packet.
 */
export function mapSpectralPacket(packet, mapper, result) {
	const checked = assertSpectralPacket(packet);
	const acceptedResult = acceptMappingResult(result);
	if (typeof mapper !== 'function') {
		throw new TypeError('Spectral mapper must be a function.');
	}

	const replacesInterpretation = acceptedResult.quantity !== undefined
		|| acceptedResult.units !== undefined;
	const interpretation = replacesInterpretation
		? acceptedResult
		: { quantity: checked.quantity, units: checked.units };

	return createSpectralPacket({
		basis: checked.basis,
		quantity: interpretation.quantity,
		units: interpretation.units,
		semantics: checked.semantics,
		values: checked.values.map((value, index) => mapper(value, index, checked)),
		provenanceIdentity: resolveProvenanceIdentity(
			acceptedResult.provenanceIdentity,
			'Spectral mapping',
			() => derivedProvenanceIdentity(
				'map',
				[checked.contentHash],
				{ quantity: interpretation.quantity, units: interpretation.units },
			),
		),
	});
}
