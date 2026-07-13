import {
	LOCAL_SUN_SHELL_ATMOSPHERE_APEX_METERS,
	LOCAL_SUN_SHELL_BOUNDARY_COUNT,
	LOCAL_SUN_SHELL_COUNT,
	LOCAL_SUN_SHELL_FACT_ID,
	LOCAL_SUN_SHELL_MAP_RADIUS_METERS,
} from './consts.js';

/** Fixed N=2048 local-Sun construction-fact owner with copy-returning accessors. */
export class LocalSunShellFactCache {
	/**
	 * Called by local sun shell fact cache to copy the physical source facts that own the shell identity.
	 *
	 * @param {LocalSunShellFactSourceConfiguration} configuration - The normalized source state.
	 * @returns {LocalSunShellExecutableSourceFacts} - The executable source facts.
	 *
	 */
	_copySourceFacts(configuration) {
		return {
			position: {
				coordinates: /** @type {readonly [number, number, number]} */ ([...configuration.position.coordinates]),
				units: 'meters',
			},
			referenceDistance: {
				value: configuration.referenceDistance.value,
				units: 'meters',
			},
			referenceSpectralIncidentScale: configuration.referenceSpectralIncidentScale,
			radius: {
				value: configuration.radius.value,
				units: 'meters',
			},
			distanceFalloff: configuration.distanceFalloff,
		};
	}

	/**
	 * Called by local sun shell fact cache to derive the accepted whole-flat-world source-distance domain.
	 *
	 * @param {Position} sourcePosition - The physical source position.
	 * @returns {LocalSunShellExecutableDomain} - The executable source-distance facts.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_deriveWholeFlatWorldSourceDomain(sourcePosition) {
		const [sourceX, sourceY, sourceHeightMeters] = sourcePosition.coordinates;
		if (sourceHeightMeters <= 0) {
			throw new RangeError('Local-Sun shell fact source height must be positive.');
		}
		const horizontalOffsetMeters = Math.hypot(sourceX, sourceY);
		const apex = LOCAL_SUN_SHELL_ATMOSPHERE_APEX_METERS;
		const mapRadius = LOCAL_SUN_SHELL_MAP_RADIUS_METERS;
		const centerZ = (apex * apex - mapRadius * mapRadius) / (2 * apex);
		const sphereRadius = (apex * apex + mapRadius * mapRadius) / (2 * apex);
		const sourceToSphereCenter = Math.hypot(horizontalOffsetMeters, sourceHeightMeters - centerZ);
		const minimumDistanceMeters = sourceToSphereCenter - sphereRadius;
		const maximumDistanceMeters = Math.hypot(mapRadius + horizontalOffsetMeters, sourceHeightMeters);
		if (!(minimumDistanceMeters > 0) || !(maximumDistanceMeters > minimumDistanceMeters)) {
			throw new RangeError('Local-Sun shell fact domain must have positive ordered radii.');
		}

		return {
			minimumDistance: {
				value: minimumDistanceMeters,
				units: 'meters',
			},
			maximumDistance: {
				value: maximumDistanceMeters,
				units: 'meters',
			},
			horizontalOffset: {
				value: horizontalOffsetMeters,
				units: 'meters',
			},
			sourceHeight: {
				value: sourceHeightMeters,
				units: 'meters',
			},
			mapRadius: {
				value: mapRadius,
				units: 'meters',
			},
			atmosphereApex: {
				value: apex,
				units: 'meters',
			},
		};
	}

	/**
	 * Called by local sun shell fact cache to create all exact binary64 boundary radii.
	 *
	 * @param {LocalSunShellExecutableDomain} domain - The source-distance domain.
	 * @returns {Float64Array} - The ordered equal-inverse-square boundaries.
	 *
	 */
	_createEqualInverseSquareBoundaries(domain) {
		const minimumDistanceMeters = domain.minimumDistance.value;
		const maximumDistanceMeters = domain.maximumDistance.value;
		const inverseMinimumSquared = 1 / (minimumDistanceMeters * minimumDistanceMeters);
		const inverseMaximumSquared = 1 / (maximumDistanceMeters * maximumDistanceMeters);
		const boundaries = new Float64Array(LOCAL_SUN_SHELL_BOUNDARY_COUNT);

		for (let index = 0; index < LOCAL_SUN_SHELL_BOUNDARY_COUNT; index += 1) {
			const fraction = index / LOCAL_SUN_SHELL_COUNT;
			boundaries[index] =
				1 / Math.sqrt(inverseMinimumSquared - fraction * (inverseMinimumSquared - inverseMaximumSquared));
		}

		return boundaries;
	}

	/**
	 * Called by local sun shell fact cache to evaluate the normalized source's continuous incident scale.
	 *
	 * @param {number} distanceMeters - The source distance in meters.
	 * @param {LocalSunShellExecutableSourceFacts} source - The normalized source facts.
	 * @returns {number} - The dimensionless incident scale.
	 *
	 */
	_continuousIncidentScale(distanceMeters, source) {
		const safeDistanceMeters = Math.max(source.radius.value, distanceMeters, Number.EPSILON);
		const falloffScale = source.distanceFalloff ? (source.referenceDistance.value / safeDistanceMeters) ** 2 : 1;

		return source.referenceSpectralIncidentScale * falloffScale;
	}

	/**
	 * Called by local sun shell fact cache to create the arithmetic-mean incident amplitude for every shell.
	 *
	 * @param {Float64Array} boundaries - The ordered boundary radii.
	 * @param {LocalSunShellExecutableSourceFacts} source - The normalized source radiometry.
	 * @returns {Float64Array} - The fixed held incident scales.
	 *
	 */
	_createHeldIncidentScales(boundaries, source) {
		const scales = new Float64Array(LOCAL_SUN_SHELL_COUNT);

		for (let index = 0; index < LOCAL_SUN_SHELL_COUNT; index += 1) {
			scales[index] =
				0.5 *
				(this._continuousIncidentScale(boundaries[index], source) +
					this._continuousIncidentScale(boundaries[index + 1], source));
		}

		return scales;
	}

	/**
	 * Executable shell-fact owner identity.
	 *
	 * @readonly
	 * @type {string}
	 */
	id;

	/**
	 * Ordered shell-boundary radii in meters.
	 *
	 * @type {Float64Array}
	 */
	_boundaries;
	/**
	 * Held dimensionless incident scale for each shell.
	 *
	 * @type {Float64Array}
	 */
	_heldIncidentScales;
	/**
	 * Minimum represented source distance.
	 *
	 * @type {Distance}
	 */
	_minimumDistance;
	/**
	 * Maximum represented source distance.
	 *
	 * @type {Distance}
	 */
	_maximumDistance;

	/**
	 * Creates a local sun shell fact cache instance that calls this constructor to create one fixed source-paired shell-fact owner.
	 *
	 * @param {LocalSunShellFactCacheConfiguration} configuration - The normalized physical source facts.
	 *
	 */
	constructor(configuration) {
		const source = this._copySourceFacts(configuration.sourceConfiguration);
		const domain = this._deriveWholeFlatWorldSourceDomain(source.position);
		const boundaries = this._createEqualInverseSquareBoundaries(domain);
		const heldIncidentScales = this._createHeldIncidentScales(boundaries, source);

		this.id = LOCAL_SUN_SHELL_FACT_ID;
		this._boundaries = Float64Array.from(boundaries);
		this._heldIncidentScales = Float64Array.from(heldIncidentScales);
		this._minimumDistance = {
			value: domain.minimumDistance.value,
			units: 'meters',
		};
		this._maximumDistance = {
			value: domain.maximumDistance.value,
			units: 'meters',
		};
	}

	/**
	 * Executable shell count.
	 *
	 * @returns {number} - The number of held-scale shells.
	 */
	get shellCount() {
		return this._heldIncidentScales.length;
	}

	/**
	 * Executable boundary count.
	 *
	 * @returns {number} - The number of ordered shell boundaries.
	 */
	get boundaryCount() {
		return this._boundaries.length;
	}

	/**
	 * Executable lower clamp.
	 *
	 * @returns {Distance} - The minimum represented source distance.
	 */
	get minimumDistance() {
		return {...this._minimumDistance};
	}

	/**
	 * Executable upper clamp.
	 *
	 * @returns {Distance} - The maximum represented source distance.
	 */
	get maximumDistance() {
		return {...this._maximumDistance};
	}

	/**
	 * Independent copy of all ordered meter boundaries.
	 *
	 * @returns {Float64Array} - The 2,049 binary64 radii.
	 */
	get boundaries() {
		return Float64Array.from(this._boundaries);
	}

	/**
	 * Independent copy of all held dimensionless incident scales.
	 *
	 * @returns {Float64Array} - The 2,048 binary64 scales.
	 */
	get heldIncidentScales() {
		return Float64Array.from(this._heldIncidentScales);
	}

	/**
	 * Retained binary64 payload without mutable storage exposure.
	 *
	 * @returns {LocalSunShellFactResourceUsage} - The exact typed-array storage.
	 */
	get resourceUsage() {
		const boundaries = this._boundaries.byteLength;
		const heldIncidentScales = this._heldIncidentScales.byteLength;

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
				value: boundaries + heldIncidentScales,
				units: 'bytes',
			},
		};
	}

	/**
	 * Call this method to resolve higher-index boundary ownership and the precomputed held scale.
	 *
	 * @param {number} distanceFromSourceMeters - The source distance in meters.
	 * @returns {LocalSunResolvedShell} - The containing shell facts.
	 */
	resolveShell(distanceFromSourceMeters) {
		const minimumDistanceMeters = this._minimumDistance.value;
		const maximumDistanceMeters = this._maximumDistance.value;
		const distanceMeters = Math.max(
			minimumDistanceMeters,
			Math.min(maximumDistanceMeters, distanceFromSourceMeters),
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
			heldIncidentScale: this._heldIncidentScales[lower],
			distanceFromSource: {
				value: distanceMeters,
				units: 'meters',
			},
			clamped: distanceMeters !== distanceFromSourceMeters,
		};
	}
}
