import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {createStellarGenerationSourceLayout} from './consts.js';

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
	_memberValues;
	/** Private channel-major binary32 spectra. @type {Float32Array} */
	_spectralValues;
	/** Accepted per-source layout. @type {StellarGenerationSourceTableLayout} */
	_layout;

	/**
	 * Create one immutable shader-input table from an accepted stellar definition.
	 *
	 * @param {StellarGenerationSourceTableConfiguration} configuration - Accepted definition and source identity.
	 */
	constructor(configuration) {
		const {definition, sourceIdentity} = configuration;
		const layout = createStellarGenerationSourceLayout(definition.members.length);
		if (
			definition.catalog.frame !== 'fk5-j2000-mean-equatorial-rh-v1' ||
			definition.members.length !== layout.memberCount
		) {
			throw new RangeError('Stellar generation source requires a reviewed FK5/J2000 table.');
		}

		this._sourceIdentity = sourceIdentity;
		this._frame = definition.catalog.frame;
		this._epoch = {...definition.catalog.epoch};
		this._layout = layout;
		this._memberIds = new Array(layout.memberCount);
		this._memberValues = new Float32Array(layout.memberCount * layout.memberComponentCount);
		this._spectralValues = new Float32Array(layout.memberCount * layout.spectralChannelCount);

		for (const [memberIndex, member] of definition.members.entries()) {
			const memberOffset = memberIndex * layout.memberComponentCount;
			this._memberIds[memberIndex] = member.id;
			this._memberValues.set(member.direction, memberOffset);
			this._memberValues[memberOffset + 3] = member.visualMagnitude ?? 0;
			for (let channelIndex = 0; channelIndex < layout.spectralChannelCount; channelIndex += 1) {
				this._spectralValues[channelIndex * layout.memberCount + memberIndex] =
					member.spectralIrradiance.values[channelIndex];
			}
		}

		this._identity = CanonicalValueHash.sha256Value({
			epoch: this._epoch,
			frame: this._frame,
			layout,
			memberIds: this._memberIds,
			sourceIdentity: this._sourceIdentity,
			memberValues: this._memberValues,
			spectralValues: this._spectralValues,
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
		return {...this._layout};
	}

	/** @returns {Float32Array} - Independent RGBA32F member texels safe for caller-owned upload. */
	copyMemberValues() {
		return new Float32Array(this._memberValues);
	}

	/** @returns {Float32Array} - Independent channel-major R32F spectra safe for caller-owned upload. */
	copySpectralValues() {
		return new Float32Array(this._spectralValues);
	}
}
