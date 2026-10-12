import DistanceMath from '../../math/DistanceMath.js';
import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';

/** Geometry-owned v9 compact positions and complete positive spatial support.
 *
 * @implements {FlatCompactTopology}
 */
export class CompactLocalCacheTopology {
	/** Normalized source height. @readonly @type {Distance} */
	sourceHeight;
	/** Normalized atmospheric top. @readonly @type {Distance} */
	atmosphereTop;
	/** Source-centered cylinder radius. @readonly @type {Distance} */
	coverageRadius;
	/** Executable normalized configuration identity. @readonly @type {string} */
	id;
	/** Configuration derivation identity. @readonly @type {string} */
	provenanceIdentity;
	/** Physical bands, including omitted bands without allocated nodes. @readonly @type {readonly FlatCompactBand[]} */
	bands;
	/** Contiguous ragged rows. @readonly @type {readonly FlatCompactRow[]} */
	rows;
	/** Compact physical positions. @readonly @type {readonly FlatCompactNode[]} */
	nodes;
	/** Omitted physical band IDs. @readonly @type {readonly number[]} */
	omittedBands;

	/** Called by constructor ingress to accept one unit-bearing physical length.
	 *
	 * @param {Distance} distance - Untrusted input length.
	 * @param {string} label - Input meaning for a rejected configuration.
	 * @returns {number} - Finite magnitude in metres.
	 * @throws {RangeError} - Units or magnitude are invalid.
	 */
	_meters(distance, label) {
		DistanceMath.assertDistance(distance, label);
		let value = DistanceMath.toMeters(distance);
		if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
		return value;
	}

	/** Called by constructor ingress to accept ordered complete physical axes.
	 *
	 * @param {readonly Distance[]} distances - Unit-bearing ordered controls.
	 * @param {number} maximumMeters - Required upper endpoint in metres.
	 * @returns {readonly number[]} - Accepted ordered metre values.
	 * @throws {RangeError} - Controls omit an endpoint or are not strictly increasing.
	 */
	_axisControls(distances, maximumMeters) {
		if (!Array.isArray(distances) || distances.length < 2)
			throw new RangeError('Complete ordered topology controls required.');
		let values = distances.map((distance) => this._meters(distance, 'Compact topology axis'));
		if (
			values[0] !== 0 ||
			values.at(-1) !== maximumMeters ||
			values.some((value, index) => index > 0 && value <= values[index - 1])
		)
			throw new RangeError('Compact topology axes require exact ordered endpoints.');
		return values;
	}

	/** Called by geometry reconstruction to avoid near-axis radius cancellation.
	 * The equation and operation order are retained from the P0-selected v9 contract.
	 *
	 * @param {number} horizontalMeters - Source-axis horizontal distance.
	 * @param {number} axisDistanceMeters - Source-to-row-axis distance.
	 * @returns {number} - Stable radius excess in metres.
	 */
	_excess(horizontalMeters, axisDistanceMeters) {
		return horizontalMeters === 0
			? 0
			: horizontalMeters *
					(horizontalMeters / (Math.hypot(horizontalMeters, axisDistanceMeters) + axisDistanceMeters));
	}

	/** Called by reconstruction to locate a supported ordered row/altitude coordinate.
	 * Boundary fan coordinates are already admitted; endpoint selection is not outside-coverage clamping.
	 *
	 * @param {readonly number[]} values - Ordered physical metre values.
	 * @param {number} query - Supported query coordinate in metres.
	 * @returns {FlatCacheAxisStencil} - One or two positive endpoint weights.
	 */
	_axis(values, query) {
		let lastIndex = values.length - 1;
		if (query <= values[0]) return {lowerIndex: 0, upperIndex: 0, lowerWeight: 1, upperWeight: 0};
		if (query >= values[lastIndex])
			return {lowerIndex: lastIndex, upperIndex: lastIndex, lowerWeight: 1, upperWeight: 0};
		let upperIndex = 1;
		while (values[upperIndex] < query) upperIndex++;
		if (values[upperIndex] === query) return {lowerIndex: upperIndex, upperIndex, lowerWeight: 1, upperWeight: 0};
		let lowerIndex = upperIndex - 1;
		let upperWeight = (query - values[lowerIndex]) / (values[upperIndex] - values[lowerIndex]);
		return {lowerIndex, upperIndex, lowerWeight: 1 - upperWeight, upperWeight};
	}

	/** Creates compact physical positions from accepted band/altitude controls and medium-derived boundary refinement.
	 * No expected node, stencil, experimental module or fixture is consumed by this implementation.
	 *
	 * @param {FlatCompactTopologyRequest} request - Complete physical controls and positive extinction-length refinement.
	 * @throws {RangeError} - Geometry, complete axes, or refinement inputs are unsupported.
	 * @throws {TypeError} - A physical length does not satisfy the unit-bearing input contract.
	 */
	constructor(request) {
		if (!request || typeof request !== 'object')
			throw new RangeError('Complete compact topology configuration required.');
		let heightMeters = this._meters(request.sourceHeight, 'Source height');
		let topMeters = this._meters(request.atmosphereTop, 'Atmosphere top');
		let coverageMeters = this._meters(request.coverageRadius, 'Coverage radius');
		if (!(heightMeters > topMeters && topMeters > 0 && coverageMeters > 0))
			throw new RangeError('Compact source must be above a positive slab/cylinder.');
		if (typeof request.provenanceIdentity !== 'string' || !request.provenanceIdentity.trim())
			throw new RangeError('Compact configuration provenance required.');
		let altitudes = this._axisControls(request.altitudes, topMeters);
		let radii = this._axisControls(request.bandRadii, Math.hypot(heightMeters, coverageMeters));
		let multiples = request.boundaryExtinctionLengthMultiples;
		if (
			!Array.isArray(multiples) ||
			!multiples.length ||
			multiples.some(
				(value, index) => !Number.isFinite(value) || value <= 0 || (index > 0 && value <= multiples[index - 1]),
			)
		)
			throw new RangeError('Positive ordered extinction-length multiples required.');
		if (!Array.isArray(request.boundaryExtinction) || request.boundaryExtinction.length !== altitudes.length)
			throw new RangeError('Boundary extinction must align with altitude rows.');
		let extinction = request.boundaryExtinction.map((quantity) => {
			if (
				!quantity ||
				!['m^-1', 'km^-1'].includes(quantity.units) ||
				!Number.isFinite(quantity.value) ||
				quantity.value <= 0
			)
				throw new RangeError('Positive unit-bearing boundary extinction required.');
			return quantity.units === 'km^-1' ? quantity.value / 1000 : quantity.value;
		});
		this.sourceHeight = DistanceMath.inMeters(heightMeters);
		this.atmosphereTop = DistanceMath.inMeters(topMeters);
		this.coverageRadius = DistanceMath.inMeters(coverageMeters);
		this.provenanceIdentity = request.provenanceIdentity;
		this.id = `algorithm32-flat-compact-v9:${CanonicalValueHash.sha256Value({heightMeters, topMeters, coverageMeters, altitudes, radii, extinction, multiples})}`;
		this.bands = radii.slice(0, -1).map((inner, bandId) => ({
			id: bandId,
			innerRadius: DistanceMath.inMeters(inner),
			outerRadius: DistanceMath.inMeters(radii[bandId + 1]),
			admitted: radii[bandId + 1] >= heightMeters - topMeters,
		}));
		this.omittedBands = this.bands.filter((band) => !band.admitted).map((band) => band.id);
		/** @type {FlatCompactNode[]} */
		let nodes = [];
		this.rows = altitudes.map((altitude, rowIndex) => {
			let axisDistance = heightMeters - altitude;
			let maximum = Math.hypot(axisDistance, coverageMeters);
			let rowRadii = [
				...new Set([
					axisDistance,
					...radii.filter((radius) => radius > axisDistance && radius < maximum),
					maximum,
				]),
			];
			let candidates = rowRadii.map((radius) => {
				let excess =
					radius === axisDistance
						? 0
						: radius === maximum
							? this._excess(coverageMeters, axisDistance)
							: radius - axisDistance;
				let horizontal = radius === maximum ? coverageMeters : Math.sqrt(excess * (2 * axisDistance + excess));
				return {radius, excess, horizontal};
			});
			for (let multiple of multiples) {
				let horizontal = coverageMeters - multiple / extinction[rowIndex];
				if (horizontal <= 0) continue;
				let excess = this._excess(horizontal, axisDistance);
				candidates.push({radius: axisDistance + excess, excess, horizontal});
			}
			candidates.sort((left, right) => left.excess - right.excess);
			let offset = nodes.length;
			for (let candidate of candidates) {
				if (nodes.length > offset && nodes.at(-1)?.radiusExcess.value === candidate.excess) continue;
				let next = radii.findIndex((radius) => radius > candidate.radius);
				let bandId = next < 0 ? this.bands.length - 1 : Math.max(0, next - 1);
				if (!this.bands[bandId].admitted) throw new RangeError('Compact refinement entered an omitted band.');
				nodes.push({
					index: nodes.length,
					rowIndex,
					bandId,
					altitude: DistanceMath.inMeters(altitude),
					horizontalDistance: DistanceMath.inMeters(candidate.horizontal),
					sourceDistance: DistanceMath.inMeters(candidate.radius),
					radiusExcess: DistanceMath.inMeters(candidate.excess),
				});
			}
			let count = nodes.length - offset;
			return {
				altitude: DistanceMath.inMeters(altitude),
				offset,
				count,
				radiusExcesses: nodes.slice(offset).map((node) => node.radiusExcess),
			};
		});
		this.nodes = nodes;
	}

	/** Number of actual compact physical positions; no rectangular axis product is implied.
	 *
	 * @returns {number} - Logical position count.
	 */
	get positionCount() {
		return this.nodes.length;
	}

	/** Source-centered amplitude distance bounds, distinct from scattering-position bands.
	 *
	 * @returns {SourceDistanceBounds} - Analytic cylinder support extrema in metres.
	 */
	get sourceDistanceBounds() {
		return {
			minimumDistance: DistanceMath.inMeters(this.sourceHeight.value - this.atmosphereTop.value),
			maximumDistance: DistanceMath.inMeters(Math.hypot(this.sourceHeight.value, this.coverageRadius.value)),
		};
	}

	/** Call this method to resolve one actual compact physical position.
	 *
	 * @param {number} index - Contiguous compact address.
	 * @returns {FlatCompactNode} - Readonly physical node with independent band identity.
	 * @throws {RangeError} - The address is not allocated.
	 */
	positionAt(index) {
		if (!Number.isSafeInteger(index) || index < 0 || index >= this.positionCount)
			throw new RangeError('Unallocated compact position.');
		return this.nodes[index];
	}

	/** Call this method to resolve complete positive spatial support inside the declared slab/cylinder.
	 * Axis and outer-cylinder fans preserve affine radius/altitude moments across ragged rows.
	 * Directional reconstruction is a separate remaining P1 capability.
	 *
	 * @param {FlatCompactPositionQuery} query - Source-centered physical horizontal distance and altitude.
	 * @returns {ScatteringCachePositionStencil} - Up to four positive compact-address weights.
	 * @throws {RangeError} - A finite query or any required support is outside the declared domain.
	 */
	resolvePositionStencil(query) {
		let horizontal = this._meters(query.horizontalDistance, 'Query horizontal distance');
		let altitude = this._meters(query.altitude, 'Query altitude');
		if (
			horizontal < 0 ||
			horizontal > this.coverageRadius.value ||
			altitude < 0 ||
			altitude > this.atmosphereTop.value
		)
			throw new RangeError('Compact query is outside complete slab/cylinder support.');
		let altitudeTap = this._axis(
			this.rows.map((row) => row.altitude.value),
			altitude,
		);
		let queryExcess = this._excess(horizontal, this.sourceHeight.value - altitude);
		let lowerExcess = queryExcess + (this.rows[altitudeTap.lowerIndex].altitude.value - altitude);
		let upperExcess = queryExcess + (this.rows[altitudeTap.upperIndex].altitude.value - altitude);
		if (altitudeTap.lowerIndex !== altitudeTap.upperIndex) {
			let upperMaximum = this.rows[altitudeTap.upperIndex].radiusExcesses.at(-1)?.value ?? 0;
			if (lowerExcess < 0) {
				lowerExcess = 0;
				upperExcess = queryExcess / altitudeTap.upperWeight;
			} else if (upperExcess > upperMaximum) {
				upperExcess = upperMaximum;
				lowerExcess = (queryExcess - altitudeTap.upperWeight * upperExcess) / altitudeTap.lowerWeight;
			}
		}
		/** @type {Map<number, number>} */
		let taps = new Map();
		for (let [rowIndex, rowWeight, excess] of [
			[altitudeTap.lowerIndex, altitudeTap.lowerWeight, lowerExcess],
			[altitudeTap.upperIndex, altitudeTap.upperWeight, upperExcess],
		]) {
			if (rowWeight === 0) continue;
			let row = this.rows[rowIndex];
			let radialTap = this._axis(
				row.radiusExcesses.map((value) => value.value),
				excess,
			);
			for (let [column, radialWeight] of [
				[radialTap.lowerIndex, radialTap.lowerWeight],
				[radialTap.upperIndex, radialTap.upperWeight],
			]) {
				let weight = rowWeight * radialWeight;
				if (weight > 0) {
					let index = row.offset + column;
					taps.set(index, (taps.get(index) ?? 0) + weight);
				}
			}
		}
		return {indices: [...taps.keys()], weights: [...taps.values()]};
	}
}
