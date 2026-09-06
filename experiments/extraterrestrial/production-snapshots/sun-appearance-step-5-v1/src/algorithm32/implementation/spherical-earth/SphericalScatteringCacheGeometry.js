import {
	CUBED_SPHERE_W27_UNIT_VECTORS,
	FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_NODES,
} from '../../sampling-domains/index.js';
import {CacheValues} from '../../gpu-cache-runtime/CacheValues.js';
import DistanceMath from '../../math/DistanceMath.js';
import ScalarMath from '../../math/ScalarMath.js';
import VectorMath from '../../math/VectorMath.js';
import {
	FIBONACCI_REFERENCE_SWITCH_DOT,
	SCATTERING_CACHE_BASIS_TOLERANCE,
	SCATTERING_CACHE_X_AXIS,
	SCATTERING_CACHE_Y_AXIS,
	SCATTERING_CACHE_Z_AXIS,
	SPHERICAL_GROUND_BOUNDARY_ROUNDOFF_ULPS,
} from './consts.js';

/** Spherical cache-coordinate, source-frame, stencil, and transport operations. */
export class SphericalScatteringCacheGeometry {
	/**
	 * Called by spherical frame construction and conversion to preserve positive zero in vector identities. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {number} value - The scalar component.
	 * @returns {number} - The canonical scalar component.
	 */
	_canonicalZero(value) {
		return value === 0 ? 0 : value;
	}

	/**
	 * Called by spherical frame construction and conversion to evaluate a dot product in retained order.
	 *
	 * @param {readonly number[]} left - The first vector.
	 * @param {readonly number[]} right - The second vector.
	 * @returns {number} - The scalar product.
	 */
	_dot(left, right) {
		return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
	}

	/**
	 * Called by spherical frame construction to subtract one three-component vector from another.
	 *
	 * @param {readonly number[]} left - The minuend.
	 * @param {readonly number[]} right - The subtrahend.
	 * @returns {UnitVector3} - The component difference.
	 */
	_subtract(left, right) {
		return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
	}

	/**
	 * Called by spherical frame construction to scale one vector with canonical zero components.
	 *
	 * @param {readonly number[]} vector - The vector components.
	 * @param {number} factor - The scalar factor.
	 * @returns {UnitVector3} - The scaled components.
	 */
	_scale(vector, factor) {
		return [
			this._canonicalZero(vector[0] * factor),
			this._canonicalZero(vector[1] * factor),
			this._canonicalZero(vector[2] * factor),
		];
	}

	/**
	 * Called by spherical frame construction to evaluate one three-component cross product.
	 *
	 * @param {readonly number[]} left - The first vector.
	 * @param {readonly number[]} right - The second vector.
	 * @returns {UnitVector3} - The cross product.
	 */
	_cross(left, right) {
		return [
			left[1] * right[2] - left[2] * right[1],
			left[2] * right[0] - left[0] * right[2],
			left[0] * right[1] - left[1] * right[0],
		];
	}

	/**
	 * Called by Fibonacci frame construction and conversion to normalize in retained square-root order.
	 *
	 * @param {readonly number[]} vector - The nonzero vector components.
	 * @returns {UnitVector3} - The normalized vector.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_normalizeWithSquareRoot(vector) {
		const length = Math.sqrt(this._dot(vector, vector));
		if (!(length > 0) || !Number.isFinite(length)) {
			throw new TypeError('Cannot normalize a zero or non-finite direction.');
		}

		return this._scale(vector, 1 / length);
	}

	/**
	 * Called by W27 frame construction and conversion to normalize in retained hypot order.
	 *
	 * @param {readonly number[]} vector - The nonzero vector components.
	 * @returns {UnitVector3} - The normalized vector.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_normalizeWithHypot(vector) {
		const length = Math.hypot(...vector);
		if (!(length > 0) || !Number.isFinite(length)) {
			throw new TypeError('Cannot normalize a zero or non-finite direction.');
		}

		return [
			this._canonicalZero(vector[0] / length),
			this._canonicalZero(vector[1] / length),
			this._canonicalZero(vector[2] / length),
		];
	}

	/**
	 * Called by W27 frame construction to select the least-aligned Cartesian fallback with retained tie order.
	 *
	 * @param {UnitVector3} direction - The source axis.
	 * @returns {UnitVector3} - The selected Cartesian axis.
	 */
	_leastAlignedCartesianAxis(direction) {
		return [SCATTERING_CACHE_X_AXIS, SCATTERING_CACHE_Y_AXIS, SCATTERING_CACHE_Z_AXIS].reduce(
			/**
			 * Called by Array.prototype.reduce to accumulate one collection value. It returns the candidate or retained accumulator according to the callback comparison.
			 * @param selected - The selected value accepted by the operation.
			 * @param candidate - The candidate value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (selected, candidate) =>
				Math.abs(this._dot(candidate, direction)) < Math.abs(this._dot(selected, direction))
					? candidate
					: selected,
		);
	}

	/**
	 * Called by both W27 conversion directions to create their shared source-aligned physical frame.
	 *
	 * @param {UnitVector3} directionToSource - The physical positive-X axis.
	 * @returns {ScatteringCacheDirectionFrame} - The physical basis.
	 */
	_createW27Frame(directionToSource) {
		const xAxis = directionToSource;
		let zAxis = this._subtract(
			SCATTERING_CACHE_Z_AXIS,
			this._scale(xAxis, this._dot(SCATTERING_CACHE_Z_AXIS, xAxis)),
		);
		if (Math.hypot(...zAxis) <= SCATTERING_CACHE_BASIS_TOLERANCE) {
			const fallback = this._leastAlignedCartesianAxis(xAxis);
			zAxis = this._subtract(fallback, this._scale(xAxis, this._dot(fallback, xAxis)));
		}
		zAxis = this._normalizeWithHypot(zAxis);
		const yAxis = this._normalizeWithHypot(this._cross(zAxis, xAxis));

		return {xAxis, yAxis, zAxis};
	}

	/**
	 * Called by cache-direction conversion to express one trusted source-local direction through a physical frame. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {UnitVector3} cacheDirection - The accepted source-local direction.
	 * @param {ScatteringCacheDirectionFrame} frame - The executable physical frame.
	 * @param {SphericalDirectionFrameNormalization} normalization - The retained normalization order.
	 * @returns {UnitVector3} - The physical direction.
	 */
	_physicalDirectionInFrame(cacheDirection, frame, normalization) {
		const physical = /** @type {UnitVector3} */ ([
			this._canonicalZero(
				frame.xAxis[0] * cacheDirection[0] +
					frame.yAxis[0] * cacheDirection[1] +
					frame.zAxis[0] * cacheDirection[2],
			),
			this._canonicalZero(
				frame.xAxis[1] * cacheDirection[0] +
					frame.yAxis[1] * cacheDirection[1] +
					frame.zAxis[1] * cacheDirection[2],
			),
			this._canonicalZero(
				frame.xAxis[2] * cacheDirection[0] +
					frame.yAxis[2] * cacheDirection[1] +
					frame.zAxis[2] * cacheDirection[2],
			),
		]);

		return normalization === 'w27' ? this._normalizeWithHypot(physical) : this._normalizeWithSquareRoot(physical);
	}

	/**
	 * Called by transport and incoming-radiance conversion to express one Fibonacci direction in physical space.
	 *
	 * @param {UnitVector3} cacheDirection - The accepted Fibonacci direction.
	 * @param {UnitVector3} directionToSource - The accepted physical source axis.
	 * @returns {UnitVector3} - The physical direction.
	 */
	_physicalFibonacciDirection(cacheDirection, directionToSource) {
		const xAxis = directionToSource;
		const reference =
			Math.abs(this._dot(xAxis, SCATTERING_CACHE_Z_AXIS)) < FIBONACCI_REFERENCE_SWITCH_DOT
				? SCATTERING_CACHE_Z_AXIS
				: SCATTERING_CACHE_Y_AXIS;
		const zAxis = this._normalizeWithSquareRoot(
			this._subtract(reference, this._scale(xAxis, this._dot(reference, xAxis))),
		);
		const yAxis = this._normalizeWithSquareRoot(this._cross(zAxis, xAxis));

		return this._physicalDirectionInFrame(cacheDirection, {xAxis, yAxis, zAxis}, 'fibonacci');
	}

	/**
	 * Called by outgoing-scattering conversion to express one W27 direction in physical space.
	 *
	 * @param {UnitVector3} cacheDirection - The accepted W27 direction.
	 * @param {UnitVector3} directionToSource - The accepted physical source axis.
	 * @returns {UnitVector3} - The physical direction.
	 */
	_physicalW27Direction(cacheDirection, directionToSource) {
		return this._physicalDirectionInFrame(cacheDirection, this._createW27Frame(directionToSource), 'w27');
	}

	/**
	 * Called by spherical cache lookup and transport to express a physical direction in the W27 frame.
	 *
	 * @param {UnitVector3} physicalDirection - The accepted physical direction.
	 * @param {UnitVector3} directionToSource - The accepted physical source axis.
	 * @returns {UnitVector3} - The W27-local direction.
	 */
	_localW27Direction(physicalDirection, directionToSource) {
		const frame = this._createW27Frame(directionToSource);

		return [
			this._dot(physicalDirection, frame.xAxis),
			this._dot(physicalDirection, frame.yAxis),
			this._dot(physicalDirection, frame.zAxis),
		];
	}

	/**
	 * Creates spherical scattering-cache operations for normalized geometry.
	 *
	 * @param {SphericalEarthGeometryConfiguration} configuration - The normalized spherical geometry configuration.
	 * @param {PositionDomain} positionDomain - Selected position reconstruction owner.
	 * @param {ReconstructionDirectionDomain} outgoingDirectionDomain - Selected outgoing reconstruction owner.
	 */
	constructor(configuration, positionDomain, outgoingDirectionDomain) {
		this._configuration = configuration;
		this._positionDomain = positionDomain;
		this._outgoingDirectionDomain = outgoingDirectionDomain;
	}

	/**
	 * Retain profile-selected position and outgoing reconstruction owners.
	 *
	 * @param {Algorithm32ExecutionDomains} domains - Accepted aggregate profile domains.
	 */
	configureExecutionDomains(domains) {
		if (domains.positions.count !== this._configuration.cacheAltitudeBinCount) {
			throw new RangeError('Spherical cache position-domain count must match cacheAltitudeBinCount.');
		}
		this._positionDomain = domains.positions;
		this._outgoingDirectionDomain = domains.outgoingDirections;
	}

	/**
	 * Called by transport packing and construction-position resolution to place one altitude on observer up.
	 *
	 * @param {number} altitudeMeters - The altitude above ground in meters.
	 * @returns {readonly number[]} - The physical position in meters.
	 */
	_cachePositionAtAltitude(altitudeMeters) {
		return VectorMath.scale(
			this._configuration.observerUpDirection,
			this._configuration.bottomRadius.value + altitudeMeters,
		);
	}

	/**
	 * Called by transport packing to resolve the nearest non-negative ground intersection.
	 *
	 * @param {readonly number[]} origin - The physical ray origin.
	 * @param {UnitVector3} direction - The physical ray direction.
	 * @returns {number | null} - The hit distance, or null when unblocked.
	 */
	_transportGroundDistance(origin, direction) {
		const radius = VectorMath.length(origin);
		const radialDirectionCosine = VectorMath.dot(origin, direction) / radius;
		const bottomRadiusMeters = this._configuration.bottomRadius.value;
		const discriminant =
			radius * radius * (radialDirectionCosine * radialDirectionCosine - 1) +
			bottomRadiusMeters * bottomRadiusMeters;

		if (radialDirectionCosine >= 0 || discriminant < 0) {
			return null;
		}

		const distanceMeters = -radius * radialDirectionCosine - Math.sqrt(discriminant);
		const boundaryToleranceMeters =
			SPHERICAL_GROUND_BOUNDARY_ROUNDOFF_ULPS * Number.EPSILON * Math.max(1, bottomRadiusMeters, radius);
		return distanceMeters >= -boundaryToleranceMeters ? Math.max(0, distanceMeters) : null;
	}

	/**
	 * Call this method to reproduce the binary64 CPU ground-contact classification for one incoming cache direction.
	 *
	 * @param {UnitVector3} cacheDirection - The source-local incoming direction.
	 * @returns {boolean} - Whether the exact first position node is CPU-ground-blocked.
	 */
	isIncomingGroundContactBlocked(cacheDirection) {
		const physicalDirection = this.expressPhysicalIncomingRadianceDirection(cacheDirection);
		const groundPosition = this._cachePositionAtAltitude(0);
		return this._transportGroundDistance(groundPosition, physicalDirection) !== null;
	}

	/**
	 * Called by transport packing to resolve the selected positive top-atmosphere distance.
	 *
	 * @param {readonly number[]} origin - The physical ray origin.
	 * @param {UnitVector3} direction - The physical ray direction.
	 * @returns {number} - The top-boundary distance.
	 */
	_transportTopDistance(origin, direction) {
		const radius = VectorMath.length(origin);
		const radialDirectionCosine = VectorMath.dot(origin, direction) / radius;
		const topRadiusMeters = this._configuration.topRadius.value;
		const discriminant =
			radius * radius * (radialDirectionCosine * radialDirectionCosine - 1) + topRadiusMeters * topRadiusMeters;

		return Math.max(0, -radius * radialDirectionCosine + Math.sqrt(Math.max(0, discriminant)));
	}

	/**
	 * Called by transport packing to resolve the retained containing-altitude-bin index.
	 *
	 * @param {readonly number[]} position - The physical position.
	 * @param {number} positionCount - The selected lattice extent.
	 * @returns {number} - The construction position index.
	 */
	_transportPositionIndex(position, positionCount) {
		const altitudeMeters = VectorMath.length(position) - this._configuration.bottomRadius.value;
		const atmosphereHeightMeters = this._configuration.topRadius.value - this._configuration.bottomRadius.value;
		const normalizedAltitude = ScalarMath.clamp(altitudeMeters / atmosphereHeightMeters, 0, 0.999999999);

		return ScalarMath.clamp(Math.floor(normalizedAltitude * positionCount), 0, positionCount - 1);
	}

	/**
	 * Called by transport packing to build one position-major query in the selected operation order. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {SphericalTransportQueryRequest} request - The physical transport query.
	 * @returns {readonly SphericalTransportTap[]} - The aggregated active transport taps.
	 */
	_createTransportQueryTaps(request) {
		const {atmosphere, direction, directionStencil, intervalCount, positionCount, positionNode} = request;
		const origin = this._cachePositionAtAltitude(positionNode.coordinate.value);
		if (this._transportGroundDistance(origin, direction) !== null) {
			return [];
		}

		const endDistanceMeters = this._transportTopDistance(origin, direction);
		const intervalLengthMeters = endDistanceMeters / intervalCount;
		const channelCount = request.spectralChannelCount;
		const viewTransmittance = new Float64Array(channelCount).fill(1);
		/** @type {readonly number[] | null} */
		let previousExtinction = null;
		/** @type {Map<string, SphericalTransportTap>} */
		const aggregate = new Map();

		for (let pointIndex = 0; pointIndex <= intervalCount; pointIndex += 1) {
			const distanceAlongRayMeters = intervalLengthMeters * pointIndex;
			const position = [
				origin[0] + direction[0] * distanceAlongRayMeters,
				origin[1] + direction[1] * distanceAlongRayMeters,
				origin[2] + direction[2] * distanceAlongRayMeters,
			];
			const altitudeMeters = VectorMath.length(position) - this._configuration.bottomRadius.value;
			const medium = atmosphere.sampleMedium({
				altitude: DistanceMath.inMeters(altitudeMeters),
			});
			const extinction = medium.extinction.values;

			if (previousExtinction !== null) {
				for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
					viewTransmittance[wavelengthIndex] *= Math.exp(
						-0.5 *
							(previousExtinction[wavelengthIndex] + extinction[wavelengthIndex]) *
							intervalLengthMeters,
					);
				}
			}

			const sourcePositionIndex = this._transportPositionIndex(position, positionCount);
			const measureMeters = intervalLengthMeters * (pointIndex === 0 || pointIndex === intervalCount ? 0.5 : 1);

			for (let directionOffset = 0; directionOffset < directionStencil.indices.length; directionOffset += 1) {
				const sourceDirectionIndex = directionStencil.indices[directionOffset];
				const interpolationWeight = directionStencil.weights[directionOffset];
				const key = `${sourcePositionIndex}:${sourceDirectionIndex}`;
				let interpolationTap = aggregate.get(key);
				if (interpolationTap === undefined) {
					interpolationTap = {
						sourceDirectionIndex,
						sourcePositionIndex,
						coefficients: new Float64Array(channelCount),
					};
					aggregate.set(key, interpolationTap);
				}

				for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
					interpolationTap.coefficients[wavelengthIndex] +=
						viewTransmittance[wavelengthIndex] * measureMeters * interpolationWeight;
				}
			}

			previousExtinction = extinction;
		}

		return [...aggregate.values()];
	}

	/**
	 * Call this method to detect the selected production construction lattice.
	 *
	 * @param {CacheConstructionDomains} domains - The executable domains.
	 * @returns {boolean} - Whether established default identities must be kept.
	 *
	 */
	usesDefaultConstructionDomains(domains) {
		return (
			domains.positionNodes === NATIVE_48_POSITION_NODES &&
			domains.incomingUnitVectors === REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors &&
			domains.incomingIntegrationWeights ===
				REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.integrationWeights &&
			domains.outgoingUnitVectors === CUBED_SPHERE_W27_UNIT_VECTORS
		);
	}

	/**
	 * Detect the retained ordinary-Fibonacci-34 diagnostic lattice.
	 *
	 * @param {CacheConstructionDomains} domains - The executable domains.
	 * @returns {boolean} - Whether the domains match the sealed parity oracle.
	 */
	usesOrdinaryFibonacci34ConstructionDomains(domains) {
		return (
			domains.positionNodes === NATIVE_48_POSITION_NODES &&
			domains.incomingUnitVectors === FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors &&
			domains.incomingIntegrationWeights === FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights &&
			domains.outgoingUnitVectors === CUBED_SPHERE_W27_UNIT_VECTORS
		);
	}

	/**
	 * Call this method to require geometry and source-domain alignment.
	 *
	 * @param {CacheConstructionDomains} domains - The executable domains.
	 * @returns {void} - No value after successful alignment validation.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	assertConstructionDomainAlignment(domains) {
		if (domains.positionCount !== this._configuration.cacheAltitudeBinCount) {
			throw new RangeError(
				'SphericalEarthGeometry cacheAltitudeBinCount must match the ' +
					'selected construction position count.',
			);
		}
	}

	/**
	 * Call this method to build geometry-resolved packed Jk-to-Lk transport data. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {CacheTransportDataRequest} request - The trusted physical collaborators.
	 * @returns {CacheTransportData} - The reusable packed transport data.
	 */
	createTransportData(request) {
		const domains = request.domains;
		this.assertConstructionDomainAlignment(domains);
		const defaultDomains = this.usesDefaultConstructionDomains(domains);
		const physicalDirections = domains.incomingUnitVectors.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param cacheDirection - The cache direction value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (cacheDirection) => this._physicalFibonacciDirection(cacheDirection, request.directionToSource),
		);
		const directionStencils = physicalDirections.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param physicalDirection - The physical direction value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (physicalDirection) =>
				domains.resolveOutgoingDirectionStencil(
					this._localW27Direction(physicalDirection, request.directionToSource),
				),
		);
		const tapsByQuery = [];

		for (const positionNode of domains.positionNodes) {
			for (let directionIndex = 0; directionIndex < physicalDirections.length; directionIndex += 1) {
				tapsByQuery.push(
					this._createTransportQueryTaps({
						atmosphere: request.atmosphere,
						direction: physicalDirections[directionIndex],
						directionStencil: directionStencils[directionIndex],
						intervalCount: request.intervalCount,
						positionCount: domains.positionCount,
						positionNode,
						spectralChannelCount: domains.spectralChannelCount,
					}),
				);
			}
		}

		const queryCount = tapsByQuery.length;
		const tapCount = Math.max(
			1,
			...tapsByQuery.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param taps - The taps value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (taps) => taps.length,
			),
		);
		const channelCount = domains.spectralChannelCount;
		const sourceValues = new Float32Array(queryCount * tapCount * 3);
		const coefficientValues = new Float32Array(queryCount * tapCount * channelCount);

		for (let queryIndex = 0; queryIndex < queryCount; queryIndex += 1) {
			const taps = tapsByQuery[queryIndex];
			for (let tapIndex = 0; tapIndex < taps.length; tapIndex += 1) {
				const interpolationTap = taps[tapIndex];
				const sourceOffset = (queryIndex * tapCount + tapIndex) * 3;
				sourceValues[sourceOffset] = interpolationTap.sourceDirectionIndex;
				sourceValues[sourceOffset + 1] = interpolationTap.sourcePositionIndex;
				sourceValues[sourceOffset + 2] = 1;

				for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
					const coefficientOffset = (wavelengthIndex * queryCount + queryIndex) * tapCount + tapIndex;
					coefficientValues[coefficientOffset] = interpolationTap.coefficients[wavelengthIndex];
				}
			}
		}

		return {
			queryCount,
			tapCount,
			sources: CacheValues.createData({
				id: defaultDomains
					? 'algorithm32-spherical-transport-sources-v1'
					: `${domains.id}-spherical-transport-sources-v1`,
				quantity: 'transport-source-address-and-active-flag',
				units: '1',
				shape: [tapCount * 3, queryCount],
				values: sourceValues,
			}),
			coefficients: CacheValues.createData({
				id: defaultDomains
					? 'algorithm32-spherical-transport-coefficients-v1'
					: `${domains.id}-spherical-transport-coefficients-v1`,
				quantity: 'transport-path-coefficient',
				units: 'meters',
				shape: [tapCount, queryCount, channelCount],
				values: coefficientValues,
			}),
		};
	}

	/**
	 * Call this method to resolve an altitude into the retained construction cache bin.
	 *
	 * @param {number} altitudeMeters - The altitude in meters.
	 * @returns {number} - The cache altitude bin index.
	 */
	altitudeToCacheBinIndex(altitudeMeters) {
		const atmosphereHeight = this._configuration.topRadius.value - this._configuration.bottomRadius.value;
		const normalized = ScalarMath.clamp(altitudeMeters / atmosphereHeight, 0, 0.999999999);

		return ScalarMath.clamp(
			Math.floor(normalized * this._configuration.cacheAltitudeBinCount),
			0,
			this._configuration.cacheAltitudeBinCount - 1,
		);
	}

	/**
	 * Call this method to reconstruct one executable native construction position.
	 *
	 * @param {PositionDomainNode} positionNode - The selected altitude node.
	 * @returns {Position} - The physical construction position.
	 */
	resolveScatteringCacheConstructionPosition(positionNode) {
		return DistanceMath.positionInMeters(
			this._cachePositionAtAltitude(DistanceMath.toMeters(positionNode.coordinate)),
		);
	}

	/**
	 * Call this method to resolve final-view interpolation over the actual Native-48 altitude nodes. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {ScatteringCachePositionStencilRequest} request - The physical position and atmosphere coordinate.
	 * @returns {ScatteringCachePositionStencil} - One exact or clamped tap, or two adjacent weighted taps.
	 */
	resolveScatteringCachePositionStencil(request) {
		const nodes = this._positionDomain.nodes;
		const altitudeMeters = DistanceMath.toMeters(request.atmosphereCoordinate.altitude);
		const lastIndex = nodes.length - 1;
		if (altitudeMeters < nodes[0].coordinate.value) {
			return {indices: [0], weights: [1]};
		}
		if (altitudeMeters === nodes[0].coordinate.value) {
			return {indices: [0], weights: [1]};
		}
		if (altitudeMeters > nodes[lastIndex].coordinate.value) {
			return {indices: [lastIndex], weights: [1]};
		}
		if (altitudeMeters === nodes[lastIndex].coordinate.value) {
			return {indices: [lastIndex], weights: [1]};
		}

		let lowerIndex = 0;
		let upperIndex = lastIndex;
		while (upperIndex - lowerIndex > 1) {
			const middleIndex = Math.floor((lowerIndex + upperIndex) / 2);
			if (nodes[middleIndex].coordinate.value <= altitudeMeters) {
				lowerIndex = middleIndex;
			} else {
				upperIndex = middleIndex;
			}
		}

		const lowerAltitudeMeters = nodes[lowerIndex].coordinate.value;
		const upperAltitudeMeters = nodes[upperIndex].coordinate.value;
		if (altitudeMeters === lowerAltitudeMeters) {
			return {indices: [lowerIndex], weights: [1]};
		}
		if (altitudeMeters === upperAltitudeMeters) {
			return {indices: [upperIndex], weights: [1]};
		}

		const upperWeight = (altitudeMeters - lowerAltitudeMeters) / (upperAltitudeMeters - lowerAltitudeMeters);

		return {
			indices: [lowerIndex, upperIndex],
			weights: [1 - upperWeight, upperWeight],
		};
	}

	/**
	 * Call this method to resolve the retained containing-altitude-bin construction lookup.
	 *
	 * @param {ScatteringCachePositionStencilRequest} request - The physical position and atmosphere coordinate.
	 * @returns {ScatteringCachePositionStencil} - The exact construction tap.
	 */
	resolveScatteringCacheConstructionPositionStencil(request) {
		const altitudeBinIndex = this.altitudeToCacheBinIndex(
			DistanceMath.toMeters(request.atmosphereCoordinate.altitude),
		);

		return {
			indices: [altitudeBinIndex],
			weights: [1],
		};
	}

	/**
	 * Call this method to express a physical direction in the executable W27 frame.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - The physical position and outgoing direction.
	 * @returns {UnitVector3} - The source-local direction.
	 */
	expressScatteringCacheDirection(request) {
		return this._localW27Direction(request.physicalOutgoingDirection, this._configuration.directionToSource);
	}

	/**
	 * Call this method to resolve a physical outgoing direction through W27 reconstruction.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - The physical position and outgoing direction.
	 * @returns {ScatteringCacheDirectionStencil} - The W27 stencil.
	 */
	resolveScatteringCacheDirectionStencil(request) {
		return this._outgoingDirectionDomain.resolveStencil(this.expressScatteringCacheDirection(request));
	}

	/**
	 * Call this method to express one W27 scattering direction in physical model space.
	 *
	 * @param {ScatteringCacheFramedDirectionRequest} request - The executable cache direction.
	 * @returns {UnitVector3} - The physical direction.
	 */
	expressPhysicalScatteringCacheDirection(request) {
		return this.expressPhysicalOutgoingScatteringDirection(request.cacheDirection);
	}

	/**
	 * Call this method to express one incoming-radiance direction in physical space.
	 *
	 * @param {UnitVector3} cacheDirection - The Fibonacci direction.
	 * @returns {UnitVector3} - The physical direction.
	 */
	expressPhysicalIncomingRadianceDirection(cacheDirection) {
		return this._physicalFibonacciDirection(cacheDirection, this._configuration.directionToSource);
	}

	/**
	 * Call this method to express one outgoing-scattering direction in physical space.
	 *
	 * @param {UnitVector3} cacheDirection - The W27 direction.
	 * @returns {UnitVector3} - The physical direction.
	 */
	expressPhysicalOutgoingScatteringDirection(cacheDirection) {
		return this._physicalW27Direction(cacheDirection, this._configuration.directionToSource);
	}
}
