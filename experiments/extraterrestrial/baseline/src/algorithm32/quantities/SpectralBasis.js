import {
	requiredString,
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';
import {
	SPECTRAL_BASIS_SCHEMA_REVISION,
	SPECTRAL_SAMPLE_SEMANTICS,
	normalizeSpectralBasisChannels,
} from './spectralBasisContract.js';

/**
 * Own one immutable ordered wavelength-bin basis.
 */
export class SpectralBasis {
	/**
	 * Create a validated spectral basis.
	 *
	 * @param {SpectralBasisDefinition} definition - Supplies id, schema,
	 * semantics, and channels.
	 */
	constructor(
		definition = /** @type {SpectralBasisDefinition} */ ({}),
	) {
		if (definition === null || typeof definition !== 'object' || Array.isArray(definition)) {
			throw new TypeError('SpectralBasis definition must be an object.');
		}

		const id = requiredString(definition.id, 'SpectralBasis.id');
		const schemaRevision = requiredString(
			definition.schemaRevision === undefined
				? SPECTRAL_BASIS_SCHEMA_REVISION
				: definition.schemaRevision,
			'SpectralBasis.schemaRevision',
		);
		const semantics = requiredString(
			definition.semantics === undefined
				? SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE
				: definition.semantics,
			'SpectralBasis.semantics',
		);

		if (semantics !== SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE) {
			throw new RangeError(
				`SpectralBasis.semantics must be ${SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE}.`,
			);
		}

		const channels = normalizeSpectralBasisChannels(definition.channels);
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
		this.contentHash = sha256Descriptor(identity);
	}

	/**
	 * Return plain readonly identity data.
	 *
	 * @returns {SpectralBasisJson} The serialized basis descriptor.
	 */
	toJSON() {
		return ({
			kind: this.kind,
			id: this.id,
			schemaRevision: this.schemaRevision,
			semantics: this.semantics,
			channels: this.channels,
			channelCount: this.channelCount,
			contentHash: this.contentHash,
		});
	}
}
