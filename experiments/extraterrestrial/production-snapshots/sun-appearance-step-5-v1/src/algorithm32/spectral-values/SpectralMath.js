import {CanonicalValueHash} from '../value-identity/CanonicalValueHash.js';
import {ValueValidation} from '../validation/ValueValidation.js';
import {SpectralBasis} from './SpectralBasis.js';
import {SpectralPacket as SpectralPacketClass} from './SpectralPacket.js';

/**
 * Called by this module to assert that an operation declares both parts of its result interpretation. Conditional result values are selected from the accepted input and current state.
 *
 * @param {unknown} result - The result interpretation candidate.
 * @param {string} label - The diagnostic label.
 * @returns {SpectralResultInterpretation} - The validated result interpretation.
 * @throws {TypeError} - When the candidate lacks a quantity, units, or a valid provenance identity.
 */
function assertResultInterpretation(result, label) {
	if (result === null || typeof result !== 'object' || Array.isArray(result)) {
		throw new TypeError(`${label} requires explicit result quantity and units.`);
	}
	const candidate = /** @type {Partial<SpectralResultInterpretation>} */ (result);

	return /** @type {SpectralResultInterpretation} */ ({
		quantity: ValueValidation.requiredString(candidate.quantity, `${label} result quantity`),
		units: ValueValidation.requiredString(candidate.units, `${label} result units`),
		provenanceIdentity:
			candidate.provenanceIdentity === undefined
				? undefined
				: ValueValidation.requiredString(candidate.provenanceIdentity, `${label} provenanceIdentity`),
	});
}

/**
 * Called by this module to accept optional spectral-operation provenance at a public boundary. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} options - The optional operation-options candidate.
 * @param {string} label - The diagnostic label.
 * @returns {SpectralOperationOptions} - The accepted operation options.
 * @throws {TypeError} - When supplied options are not an object or contain invalid provenance.
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
		ValueValidation.requiredString(candidate.provenanceIdentity, `${label} provenanceIdentity`);
	}

	return candidate;
}

/**
 * Called by this module to accept an optional spectral-mapping result interpretation. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} result - The optional mapping-result candidate.
 * @returns {SpectralMappingResult} - The accepted mapping result.
 * @throws {TypeError} - When supplied data is not an object or contains an incomplete interpretation.
 */
function acceptMappingResult(result) {
	if (result === undefined) {
		return {};
	}

	if (result === null || typeof result !== 'object' || Array.isArray(result)) {
		throw new TypeError('Spectral mapping result must be an object when supplied.');
	}

	const candidate = /** @type {SpectralMappingResult} */ (result);
	const replacesInterpretation = candidate.quantity !== undefined || candidate.units !== undefined;

	if (replacesInterpretation) {
		return assertResultInterpretation(candidate, 'Spectral mapping');
	}

	return {
		provenanceIdentity:
			candidate.provenanceIdentity === undefined
				? undefined
				: ValueValidation.requiredString(candidate.provenanceIdentity, 'Spectral mapping provenanceIdentity'),
	};
}

/**
 * Called by this module to accept explicit provenance or derive it only when the explicit property is absent.
 *
 * @param {unknown} value - The optional explicit provenance identity.
 * @param {string} label - The diagnostic label.
 * @param {SpectralProvenanceIdentityFactory} createDefault - The absent-value provenance factory.
 * @returns {string} - The accepted or derived provenance identity.
 * @throws {TypeError} - When an explicit provenance identity is invalid.
 */
function resolveProvenanceIdentity(value, label, createDefault) {
	return value === undefined ? createDefault() : ValueValidation.requiredString(value, `${label} provenanceIdentity`);
}

/**
 * Called by this module to derive deterministic provenance for one spectral-packet operation.
 *
 * @param {string} operation - The operation identity.
 * @param {readonly string[]} inputs - The ordered input-packet hashes.
 * @param {SpectralProvenanceParameters} [parameters] - The operation parameters.
 * @returns {string} - The derived provenance identity.
 *
 */
function derivedProvenanceIdentity(operation, inputs, parameters = {}) {
	return `derived:${operation}:${CanonicalValueHash.sha256Value({operation, inputs, parameters})}`;
}

/**
 * Called by this module to create a fresh zero-valued packet with an explicit physical interpretation. Conditional result values are selected from the accepted input and current state.
 *
 * @param {SpectralPacketFactoryDefinition} definition - The basis, interpretation, and provenance.
 * @returns {SpectralPacket} - The zero-valued packet.
 */
function zeroSpectralPacket(definition) {
	const basis = SpectralBasis.assert(definition.basis);
	return new SpectralPacketClass({
		basis,
		quantity: definition.quantity,
		units: definition.units,
		semantics: definition.semantics === undefined ? basis.semantics : definition.semantics,
		values: Array.from(
			{length: basis.channelCount},
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () => 0,
		),
		provenanceIdentity: ValueValidation.requiredString(
			definition.provenanceIdentity,
			'zeroSpectralPacket.provenanceIdentity',
		),
	});
}

/**
 * Called by this module to create a fresh one-valued packet with an explicit physical interpretation. Conditional result values are selected from the accepted input and current state.
 *
 * @param {SpectralPacketFactoryDefinition} definition - The basis, interpretation, and provenance.
 * @returns {SpectralPacket} - The one-valued packet.
 */
function oneSpectralPacket(definition) {
	const basis = SpectralBasis.assert(definition.basis);
	return new SpectralPacketClass({
		basis,
		quantity: definition.quantity,
		units: definition.units,
		semantics: definition.semantics === undefined ? basis.semantics : definition.semantics,
		values: Array.from(
			{length: basis.channelCount},
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () => 1,
		),
		provenanceIdentity: ValueValidation.requiredString(
			definition.provenanceIdentity,
			'oneSpectralPacket.provenanceIdentity',
		),
	});
}

/**
 * Called by this module to scale a spectral packet without changing its physical interpretation.
 *
 * @param {unknown} packet - The source packet.
 * @param {number} scalar - The finite scalar.
 * @param {SpectralOperationOptions} [options] - The optional result provenance.
 * @returns {SpectralPacket} - The scaled packet.
 * @throws {TypeError} - When the packet, scalar, options, or provenance is invalid.
 */
function scaleSpectralPacket(packet, scalar, options) {
	const checked = SpectralPacketClass.assert(packet);
	const acceptedOptions = acceptOperationOptions(options, 'Spectral scale');
	if (!Number.isFinite(scalar)) {
		throw new TypeError('Spectral scale must be finite.');
	}

	return new SpectralPacketClass({
		basis: checked.basis,
		quantity: checked.quantity,
		units: checked.units,
		semantics: checked.semantics,
		values: checked.values.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => value * scalar,
		),
		provenanceIdentity: resolveProvenanceIdentity(
			acceptedOptions.provenanceIdentity,
			'Spectral scale',
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () => derivedProvenanceIdentity('scale', [checked.contentHash], {scalar}),
		),
	});
}

/**
 * Called by this module to add packets with identical quantity, units, basis, and sample semantics.
 *
 * @param {unknown} left - The first packet.
 * @param {unknown} right - The second packet.
 * @param {SpectralOperationOptions} [options] - The optional result provenance.
 * @returns {SpectralPacket} - The packet sum.
 * @throws {TypeError} - When either packet, their compatibility, options, or provenance is invalid.
 */
function addSpectralPackets(left, right, options) {
	const acceptedOptions = acceptOperationOptions(options, 'Spectral addition');
	const [checkedLeft, checkedRight] = SpectralPacketClass.assertCompatible(left, right, {
		sameQuantity: true,
		sameUnits: true,
		sameSemantics: true,
	});

	return new SpectralPacketClass({
		basis: checkedLeft.basis,
		quantity: checkedLeft.quantity,
		units: checkedLeft.units,
		semantics: checkedLeft.semantics,
		values: checkedLeft.values.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param value - The value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value, index) => value + checkedRight.values[index],
		),
		provenanceIdentity: resolveProvenanceIdentity(
			acceptedOptions.provenanceIdentity,
			'Spectral addition',
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () => derivedProvenanceIdentity('add', [checkedLeft.contentHash, checkedRight.contentHash]),
		),
	});
}

/**
 * Called by this module to multiply compatible packets under an explicit result quantity and units.
 *
 * @param {unknown} left - The first packet.
 * @param {unknown} right - The second packet.
 * @param {SpectralResultInterpretation} result - The required result interpretation.
 * @returns {SpectralPacket} - The packet product.
 * @throws {TypeError} - When either packet, their compatibility, or the result interpretation is invalid.
 */
function multiplySpectralPackets(left, right, result) {
	const definition = assertResultInterpretation(result, 'Spectral multiplication');
	const [checkedLeft, checkedRight] = SpectralPacketClass.assertCompatible(left, right, {sameSemantics: true});

	return new SpectralPacketClass({
		basis: checkedLeft.basis,
		quantity: definition.quantity,
		units: definition.units,
		semantics: checkedLeft.semantics,
		values: checkedLeft.values.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param value - The value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value, index) => value * checkedRight.values[index],
		),
		provenanceIdentity: resolveProvenanceIdentity(
			definition.provenanceIdentity,
			'Spectral multiplication',
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				derivedProvenanceIdentity('multiply', [checkedLeft.contentHash, checkedRight.contentHash], {
					quantity: definition.quantity,
					units: definition.units,
				}),
		),
	});
}

/**
 * Called by this module to divide compatible packets under an explicit result quantity and units.
 *
 * @param {unknown} numerator - The numerator packet.
 * @param {unknown} denominator - The denominator packet.
 * @param {SpectralResultInterpretation} result - The required result interpretation.
 * @returns {SpectralPacket} - The packet quotient.
 * @throws {TypeError} - When either packet, their compatibility, or the result interpretation is invalid.
 * @throws {RangeError} - When any denominator channel is zero.
 */
function divideSpectralPackets(numerator, denominator, result) {
	const definition = assertResultInterpretation(result, 'Spectral division');
	const [checkedNumerator, checkedDenominator] = SpectralPacketClass.assertCompatible(numerator, denominator, {
		sameSemantics: true,
	});

	if (
		checkedDenominator.values.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => value === 0,
		)
	) {
		throw new RangeError('Spectral division denominator must not contain zero.');
	}

	return new SpectralPacketClass({
		basis: checkedNumerator.basis,
		quantity: definition.quantity,
		units: definition.units,
		semantics: checkedNumerator.semantics,
		values: checkedNumerator.values.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param value - The value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value, index) => value / checkedDenominator.values[index],
		),
		provenanceIdentity: resolveProvenanceIdentity(
			definition.provenanceIdentity,
			'Spectral division',
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				derivedProvenanceIdentity('divide', [checkedNumerator.contentHash, checkedDenominator.contentHash], {
					quantity: definition.quantity,
					units: definition.units,
				}),
		),
	});
}

/**
 * Called by this module to map packet values while retaining or explicitly replacing their physical interpretation. Replacing an interpretation requires both quantity and units.
 *
 * @param {unknown} packet - The source packet.
 * @param {SpectralPacketMapper} mapper - The channel mapper.
 * @param {SpectralMappingResult} [result] - The optional result interpretation.
 * @returns {SpectralPacket} - The mapped packet.
 * @throws {TypeError} - When the packet, mapper, or result interpretation is invalid.
 */
function mapSpectralPacket(packet, mapper, result) {
	const checked = SpectralPacketClass.assert(packet);
	const acceptedResult = acceptMappingResult(result);
	if (typeof mapper !== 'function') {
		throw new TypeError('Spectral mapper must be a function.');
	}

	const replacesInterpretation = acceptedResult.quantity !== undefined || acceptedResult.units !== undefined;
	const interpretation = replacesInterpretation ? acceptedResult : {quantity: checked.quantity, units: checked.units};

	return new SpectralPacketClass({
		basis: checked.basis,
		quantity: interpretation.quantity,
		units: interpretation.units,
		semantics: checked.semantics,
		values: checked.values.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param value - The value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value, index) => mapper(value, index, checked),
		),
		provenanceIdentity: resolveProvenanceIdentity(
			acceptedResult.provenanceIdentity,
			'Spectral mapping',
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				derivedProvenanceIdentity('map', [checked.contentHash], {
					quantity: interpretation.quantity,
					units: interpretation.units,
				}),
		),
	});
}

/** Spectral-packet arithmetic, mapping, interpretation, and provenance methods. */
export const SpectralMath = {
	acceptMappingResult,
	acceptOperationOptions,
	addSpectralPackets,
	assertResultInterpretation,
	derivedProvenanceIdentity,
	divideSpectralPackets,
	mapSpectralPacket,
	multiplySpectralPackets,
	oneSpectralPacket,
	resolveProvenanceIdentity,
	scaleSpectralPacket,
	zeroSpectralPacket,
};
