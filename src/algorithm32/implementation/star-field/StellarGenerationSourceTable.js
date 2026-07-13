import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {STELLAR_GENERATION_SOURCE_LAYOUT} from './consts.js';

/** Immutable member-major binary32 input for the standard stellar generation shader. */
export class StellarGenerationSourceTable {
	/** Stable packed-table identity. @type {string} */
	_identity;
	/** Complete normalized source identity. @type {string} */
	_sourceIdentity;
	/** FK5/J2000 catalog frame. @type {StellarCatalogFrame} */
	_frame;
	/** Catalog epoch retained independently from the source object. @type {CelestialEpoch} */
	_epoch;
	/** Canonical member identifiers. @type {string[]} */
	_memberIds;
	/** Private member-major binary32 values. @type {Float32Array} */
	_values;

	/**
	 * Create one immutable shader-input table from an accepted stellar definition.
	 *
	 * @param {StellarGenerationSourceTableConfiguration} configuration - Accepted definition and source identity.
	 */
	constructor(configuration) {
		const {definition, sourceIdentity} = configuration;
		const layout = STELLAR_GENERATION_SOURCE_LAYOUT;
		if (
			definition.catalog.frame !== 'fk5-j2000-mean-equatorial-rh-v1' ||
			definition.members.length !== layout.memberCount
		) {
			throw new RangeError('Stellar generation source requires the reviewed 500-member FK5/J2000 table.');
		}

		this._sourceIdentity = sourceIdentity;
		this._frame = definition.catalog.frame;
		this._epoch = {...definition.catalog.epoch};
		this._memberIds = new Array(layout.memberCount);
		this._values = new Float32Array(layout.memberCount * layout.componentCount);

		for (const [memberIndex, member] of definition.members.entries()) {
			const memberOffset = memberIndex * layout.componentCount;
			this._memberIds[memberIndex] = member.id;
			this._values.set(member.direction, memberOffset + layout.directionOffset);
			this._values.set(member.spectralIrradiance.values, memberOffset + layout.spectralOffset);
		}

		this._identity = CanonicalValueHash.sha256Value({
			epoch: this._epoch,
			frame: this._frame,
			layout,
			memberIds: this._memberIds,
			sourceIdentity: this._sourceIdentity,
			values: this._values,
		});
	}

	/** @returns {string} - Stable identity of the packed binary32 table and metadata. */
	get identity() {
		return this._identity;
	}

	/** @returns {string} - Complete normalized stellar-source identity. */
	get sourceIdentity() {
		return this._sourceIdentity;
	}

	/** @returns {StellarCatalogFrame} - FK5/J2000 mean-equatorial catalog frame. */
	get frame() {
		return this._frame;
	}

	/** @returns {CelestialEpoch} - Independent catalog-epoch snapshot. */
	get epoch() {
		return {...this._epoch};
	}

	/** @returns {readonly string[]} - Independent canonical member-id sequence. */
	get memberIds() {
		return [...this._memberIds];
	}

	/** @returns {StellarGenerationSourceTableLayout} - Exact member-major scalar layout. */
	get layout() {
		return {...STELLAR_GENERATION_SOURCE_LAYOUT};
	}

	/** @returns {Float32Array} - Independent packed values safe for caller-owned upload. */
	copyValues() {
		return new Float32Array(this._values);
	}
}
