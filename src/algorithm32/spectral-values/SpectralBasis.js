import {CanonicalValueHash} from '../value-identity/CanonicalValueHash.js';
import {ValueValidation} from '../validation/ValueValidation.js';
import {UnitMath} from '../physical-quantities/UnitMath.js';
import {CANONICAL_CHANNEL_UNITS, SPECTRAL_BASIS_SCHEMA_REVISION, SPECTRAL_SAMPLE_SEMANTICS} from './consts.js';

/** Immutable ordered wavelength-bin basis with canonical physical identity. */
export class SpectralBasis {
	/**
	 * Called by SpectralBasis construction to compare derived binary64 bin
	 * boundaries at the basis-specific machine-scale tolerance.
	 *
	 * @param {number} left - The first boundary.
	 * @param {number} right - The second boundary.
	 * @returns {boolean} - Whether the boundaries agree within tolerance.
	 */
	_nearlyEqual(left, right) {
		const scale = Math.max(1, Math.abs(left), Math.abs(right));
		return Math.abs(left - right) <= 32 * Number.EPSILON * scale;
	}

	/**
	 * Called by SpectralBasis construction to validate and normalize ordered
	 * channels into canonical wavelength units.
	 *
	 * @param {unknown} value - The candidate channels.
	 * @param {SpectralSampleSemantics} semantics - The accepted channel semantics.
	 * @returns {readonly SpectralBasisChannel[]} - The ordered canonical channels.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_normalizeChannels(value, semantics) {
		if (!Array.isArray(value) || value.length < 1) {
			throw new TypeError('SpectralBasis.channels must be a non-empty array.');
		}

		const channelIdentifiers = new Set();
		let previousCenter = Number.NEGATIVE_INFINITY;
		let previousUpperBoundary = null;
		const channels = value.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param channel - The channel value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
			 * @throws {RangeError} - When an accepted value is outside the supported range.
			 */ (channel, index) => {
				const label = `SpectralBasis.channels[${index}]`;

				if (channel === null || typeof channel !== 'object' || Array.isArray(channel)) {
					throw new TypeError(`${label} must be an object.`);
				}

				const keys = Object.keys(channel).sort();
				if (keys.length !== 3 || keys[0] !== 'center' || keys[1] !== 'id' || keys[2] !== 'width') {
					throw new TypeError(`${label} must have exactly id, center, and width properties.`);
				}

				const id = ValueValidation.requiredString(channel.id, `${label}.id`);
				if (channelIdentifiers.has(id)) {
					throw new RangeError(`SpectralBasis channel id ${id} is duplicated.`);
				}
				channelIdentifiers.add(id);

				UnitMath.assertUnitValue(channel.center, `${label}.center`);
				UnitMath.assertUnitValue(channel.width, `${label}.width`);
				const center = UnitMath.normalizeUnitValue(channel.center, CANONICAL_CHANNEL_UNITS, `${label}.center`);
				const width = UnitMath.normalizeUnitValue(channel.width, CANONICAL_CHANNEL_UNITS, `${label}.width`);

				if (center.value <= 0) {
					throw new RangeError(`${label}.center.value must be greater than zero.`);
				}

				if (width.value <= 0) {
					throw new RangeError(`${label}.width.value must be greater than zero.`);
				}

				if (center.value <= previousCenter) {
					throw new RangeError('SpectralBasis channel centers must be strictly increasing.');
				}

				const lowerBoundary = center.value - width.value / 2;
				const upperBoundary = center.value + width.value / 2;

				if (semantics === SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE) {
					if (lowerBoundary <= 0) {
						throw new RangeError('SpectralBasis wavelength bins must remain greater than zero.');
					}

					if (previousUpperBoundary !== null && !this._nearlyEqual(lowerBoundary, previousUpperBoundary)) {
						throw new RangeError(
							'SpectralBasis channels must describe contiguous, nonoverlapping wavelength bins.',
						);
					}
				}

				previousCenter = center.value;
				previousUpperBoundary = upperBoundary;

				return {id, center, width};
			},
		);

		return channels;
	}

	/**
	 * Creates a validated spectral basis with normalized ordered channels and a
	 * canonical content identity.
	 *
	 * @param {SpectralBasisDefinition} definition - The id, schema, semantics,
	 * and channels.
	 * @throws {TypeError} - When the definition or one of its required values is invalid.
	 * @throws {RangeError} - When channel ordering, bin geometry, or sample semantics is unsupported.
	 */
	constructor(definition = /** @type {SpectralBasisDefinition} */ ({})) {
		if (definition === null || typeof definition !== 'object' || Array.isArray(definition)) {
			throw new TypeError('SpectralBasis definition must be an object.');
		}

		const id = ValueValidation.requiredString(definition.id, 'SpectralBasis.id');
		const schemaRevision = ValueValidation.requiredString(
			definition.schemaRevision === undefined ? SPECTRAL_BASIS_SCHEMA_REVISION : definition.schemaRevision,
			'SpectralBasis.schemaRevision',
		);
		const semantics = ValueValidation.requiredString(
			definition.semantics === undefined ? SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE : definition.semantics,
			'SpectralBasis.semantics',
		);

		if (
			semantics !== SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE &&
			semantics !== SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY
		) {
			throw new RangeError('SpectralBasis.semantics is not supported.');
		}

		const channels = this._normalizeChannels(definition.channels, semantics);
		const identity = /** @type {const} */ ({
			kind: 'algorithm32-spectral-basis',
			id,
			schemaRevision,
			semantics,
			channels,
		});

		this.kind = identity.kind;
		this.id = id;
		this.schemaRevision = schemaRevision;
		this.semantics = semantics;
		this.channels = channels;
		this.channelCount = channels.length;
		this.contentHash = CanonicalValueHash.sha256Value(identity);
	}

	/**
	 * Call this method to assert that a candidate is a validated spectral basis.
	 *
	 * @param {unknown} value - The candidate basis.
	 * @param {string} [label] - The diagnostic label.
	 * @returns {SpectralBasis} - The validated basis.
	 * @throws {TypeError} - When the candidate is not a SpectralBasis instance.
	 */
	static assert(value, label = 'Spectral basis') {
		if (!(value instanceof SpectralBasis)) {
			throw new TypeError(`${label} must be a SpectralBasis.`);
		}

		return /** @type {SpectralBasis} */ (value);
	}

	/**
	 * Call this method to assert that two bases have identical ordered physical
	 * content and semantics.
	 *
	 * @param {unknown} left - The first basis.
	 * @param {unknown} right - The second basis.
	 * @param {string} [label] - The diagnostic label.
	 * @returns {void} - No value.
	 * @throws {TypeError} - When either candidate is invalid or their content identities differ.
	 */
	static assertCompatible(left, right, label = 'Spectral bases') {
		const checkedLeft = SpectralBasis.assert(left, `${label} left`);
		const checkedRight = SpectralBasis.assert(right, `${label} right`);

		if (checkedLeft.contentHash !== checkedRight.contentHash) {
			throw new TypeError(`${label} are incompatible: ${checkedLeft.id} and ${checkedRight.id}.`);
		}
	}

	/**
	 * Call this method to return the plain readonly spectral-basis identity.
	 *
	 * @returns {SpectralBasisJson} - The serialized basis value.
	 */
	toJSON() {
		return {
			kind: this.kind,
			id: this.id,
			schemaRevision: this.schemaRevision,
			semantics: this.semantics,
			channels: this.channels,
			channelCount: this.channelCount,
			contentHash: this.contentHash,
		};
	}
}
