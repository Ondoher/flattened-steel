import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {STELLAR_ONE_PIXEL_PRESENTATION} from './StellarPointPresentation.js';

const R16UI_MAX_INDEX = 65_535;

/** Numerical rules fixed by the base stellar screen-palette generation path. */
export const STELLAR_SCREEN_PALETTE_NUMERICAL_POLICY = /** @type {const} */ ({
	projection: 'geometry-owned-iau-2000-usno-mean-fixed-observation-v1',
	viewport: 'top-left-row-major-half-open-v1',
	pointResponse: 'unit-weight-one-pixel-v1',
	presentation: STELLAR_ONE_PIXEL_PRESENTATION.id,
	collisionRepresentative: 'lowest-canonical-member',
	accumulationOrder: 'canonical-member-order',
	packing: 'binary32-r32f-entry-major-v1',
});

/** Validated sparse capacity, format, and numerical-policy ingress for stellar generation. */
export class StellarScreenPaletteGenerationPolicy {
	/** Accepted sparse layout. @type {StellarScreenPaletteLayout} */
	_layout;
	/** Accepted numerical rules. @type {StellarScreenPaletteNumericalPolicy} */
	_numericalPolicy;
	/** Canonical identity of the complete accepted policy. @type {string} */
	_identity;

	/**
	 * Validate one complete stellar generation policy before shader construction.
	 *
	 * @param {StellarScreenPaletteGenerationPolicyConfiguration} configuration - Requested source and output rules.
	 */
	constructor(configuration) {
		const {sourceLayout, layout, numericalPolicy} = configuration;
		if (
			sourceLayout.schema !== 'stellar-generation-source-table-v2' ||
			sourceLayout.storageFormat !== 'RGBA32F+R32F' ||
			sourceLayout.memberOrder !== 'canonical-selection-order' ||
			!Number.isSafeInteger(sourceLayout.memberCount) ||
			sourceLayout.memberCount < 0 ||
			sourceLayout.spectralChannelCount !== 15
		) {
			throw new RangeError('Stellar generation requires a canonical R32F native-15 source layout.');
		}

		if (!Number.isSafeInteger(layout.entryCapacity) || layout.entryCapacity !== sourceLayout.memberCount + 1) {
			throw new RangeError('Stellar generation entry capacity must equal member count plus reserved zero.');
		}

		if (sourceLayout.memberCount > R16UI_MAX_INDEX) {
			throw new RangeError('Stellar generation member index exceeds the accepted R16UI range.');
		}

		if (
			layout.zeroIndex !== 0 ||
			layout.candidateSlotPolicy !== 'canonical-member-index-plus-one' ||
			layout.collisionRepresentative !== 'lowest-canonical-member' ||
			layout.accumulationOrder !== 'canonical-member-order' ||
			layout.memberCount !== sourceLayout.memberCount ||
			layout.indexFormat !== 'R16UI' ||
			layout.paletteFormat !== 'R32F' ||
			layout.channelCount !== 15
			|| layout.rowCount !== 16
			|| layout.visualMagnitudeRow !== 15
		) {
			throw new RangeError('Stellar generation layout does not match the accepted sparse R16UI/R32F contract.');
		}

		for (const [key, acceptedValue] of Object.entries(STELLAR_SCREEN_PALETTE_NUMERICAL_POLICY)) {
			if (numericalPolicy[key] !== acceptedValue) {
				throw new RangeError(`Stellar generation numerical policy mismatch for ${key}.`);
			}
		}

		if (Object.keys(numericalPolicy).length !== Object.keys(STELLAR_SCREEN_PALETTE_NUMERICAL_POLICY).length) {
			throw new RangeError('Stellar generation numerical policy contains unsupported rules.');
		}

		this._layout = {...layout};
		this._numericalPolicy = {...numericalPolicy};
		this._identity = CanonicalValueHash.sha256Value({
			layout: this._layout,
			numericalPolicy: this._numericalPolicy,
			pointPresentation: STELLAR_ONE_PIXEL_PRESENTATION,
			sourceLayout: {...sourceLayout},
		});
	}

	/**
	 * Construct the fixed base policy for one immutable source table.
	 *
	 * @param {StellarGenerationSourceTableLayout} sourceLayout - Immutable source-table layout.
	 * @returns {StellarScreenPaletteGenerationPolicy} - Validated base generation policy.
	 */
	static createBase(sourceLayout) {
		return new StellarScreenPaletteGenerationPolicy({
			sourceLayout,
			layout: {
				zeroIndex: 0,
				candidateSlotPolicy: 'canonical-member-index-plus-one',
				collisionRepresentative: 'lowest-canonical-member',
				accumulationOrder: 'canonical-member-order',
				memberCount: sourceLayout.memberCount,
				entryCapacity: sourceLayout.memberCount + 1,
				indexFormat: 'R16UI',
				paletteFormat: 'R32F',
				channelCount: 15,
				rowCount: 16,
				visualMagnitudeRow: 15,
			},
			numericalPolicy: STELLAR_SCREEN_PALETTE_NUMERICAL_POLICY,
		});
	}

	/** @returns {string} - Canonical identity of capacity, formats, and numerical rules. */
	get identity() {
		return this._identity;
	}

	/** @returns {StellarScreenPaletteLayout} - Independent accepted sparse-layout snapshot. */
	get layout() {
		return {...this._layout};
	}

	/** @returns {StellarScreenPaletteNumericalPolicy} - Independent accepted numerical-policy snapshot. */
	get numericalPolicy() {
		return {...this._numericalPolicy};
	}
}
