import {
	immutableDescriptorData,
} from '../descriptors/descriptorSupport.js';

/**
 * Own the fixed N=2048 local-Sun construction facts.
 *
 * Executable clamp facts and binary64 arrays remain independent of the
 * declarative descriptor. Array accessors return independent copies.
 */
export class LocalSunShellFactCache {
	/** @type {LocalSunShellFactDescriptor} */
	_descriptor;
	/** @type {Float64Array} */
	_boundaries;
	/** @type {Float64Array} */
	_heldIncidentScales;
	/** @type {Distance} */
	_minimumDistance;
	/** @type {Distance} */
	_maximumDistance;

	/**
	 * Create one trusted source-derived fact owner.
	 *
	 * @param {LocalSunShellFactCacheDefinition} definition - Supplies the
	 * canonical descriptor and exact binary64 facts.
	 */
	constructor(definition) {
		this._descriptor =
			/** @type {LocalSunShellFactDescriptor} */ (
				immutableDescriptorData(definition.descriptor)
			);
		this._boundaries = Float64Array.from(
			definition.boundaries,
		);
		this._heldIncidentScales = Float64Array.from(
			definition.heldIncidentScales,
		);
		this._minimumDistance = {
			value: definition.minimumDistance.value,
			units: 'meters',
		};
		this._maximumDistance = {
			value: definition.maximumDistance.value,
			units: 'meters',
		};
	}

	/**
	 * Return the canonical fact descriptor.
	 *
	 * @returns {LocalSunShellFactDescriptor} The descriptor.
	 */
	get descriptor() {
		return this._descriptor;
	}

	/**
	 * Return an independent copy of all ordered meter boundaries.
	 *
	 * @returns {Float64Array} The 2,049 binary64 radii.
	 */
	get boundaries() {
		return Float64Array.from(this._boundaries);
	}

	/**
	 * Return an independent copy of all held dimensionless incident scales.
	 *
	 * @returns {Float64Array} The 2,048 binary64 scales.
	 */
	get heldIncidentScales() {
		return Float64Array.from(this._heldIncidentScales);
	}

	/**
	 * Report retained binary64 payload without exposing mutable storage.
	 *
	 * @returns {LocalSunShellFactResourceUsage} The exact typed-array storage.
	 */
	get resourceUsage() {
		const boundaries = this._boundaries.byteLength;
		const heldIncidentScales =
			this._heldIncidentScales.byteLength;

		return {
			boundaries: {
				value: boundaries,
				units: 'bytes',
			},
			heldIncidentScales: {
				value: heldIncidentScales,
				units: 'bytes',
			},
			total: {
				value:
					boundaries
					+ heldIncidentScales,
				units: 'bytes',
			},
		};
	}

	/**
	 * Resolve higher-index boundary ownership and the precomputed held scale.
	 *
	 * @param {number} distanceFromSourceMeters - Supplies source distance in
	 * meters.
	 * @returns {LocalSunResolvedShell} The containing shell facts.
	 */
	resolveShell(distanceFromSourceMeters) {
		const minimumDistanceMeters =
			this._minimumDistance.value;
		const maximumDistanceMeters =
			this._maximumDistance.value;
		const distanceMeters = Math.max(
			minimumDistanceMeters,
			Math.min(
				maximumDistanceMeters,
				distanceFromSourceMeters,
			),
		);
		let lower = 0;
		let upper = this._boundaries.length - 1;

		if (distanceMeters === this._boundaries[upper]) {
			lower = upper - 1;
		} else {
			while (upper - lower > 1) {
				const middle = Math.floor((lower + upper) / 2);
				if (this._boundaries[middle] <= distanceMeters) {
					lower = middle;
				} else {
					upper = middle;
				}
			}
		}

		return {
			shellIndex: lower,
			heldIncidentScale:
				this._heldIncidentScales[lower],
			distanceFromSource: {
				value: distanceMeters,
				units: 'meters',
			},
			clamped: distanceMeters
				!== distanceFromSourceMeters,
		};
	}
}
