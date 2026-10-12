import {CacheValues} from '../../gpu-cache-runtime/CacheValues.js';
import DistanceMath from '../../math/DistanceMath.js';
import VectorMath from '../../math/VectorMath.js';
import {GeometryDirections} from '../../geometry-support/GeometryDirections.js';
import {CompactLocalCacheTopology} from './CompactLocalCacheTopology.js';
import {FLAT_GEOMETRY_BOUNDARY_EPSILON, FLAT_INDEXED_TRANSPORT_TEXTURE_WIDTH} from './consts.js';

/**
 * Flat scattering-cache coordinates, physical directions, rays, and packed transport.
 */
export class FlatScatteringCacheGeometry {
	/**
	 * Called by FlatScatteringCacheGeometry to create evenly spaced nodes over one closed physical interval.
	 *
	 * @param {number} maximumMeters - The upper endpoint.
	 * @param {number} count - The node count.
	 * @returns {readonly Distance[]} - The ordered unit-bearing nodes.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_uniformDistanceNodes(maximumMeters, count) {
		if (!Number.isInteger(count) || count < 2) {
			throw new RangeError('Flat local cache axis node count must be an integer of at least two.');
		}

		return Array.from(
			{length: count},
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @param _unused - The intentionally unused callback value.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (_unused, index) => DistanceMath.inMeters((maximumMeters * index) / (count - 1)),
		);
	}

	/**
	 * Called by FlatScatteringCacheGeometry to resolve the radial, tangent, and vertical local cache frame.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - The geometry.
	 * @param {readonly number[]} position - The physical sample point.
	 * @returns {FlatLocalCacheDirectionFrame} - The right-handed local frame.
	 */
	_localCacheDirectionFrame(configuration, position) {
		const sourceSubpoint = configuration.sourceSubpoint.coordinates;
		const horizontal = [position[0] - sourceSubpoint[0], position[1] - sourceSubpoint[1], 0];
		const rhoMeters = Math.hypot(horizontal[0], horizontal[1]);
		const radial =
			rhoMeters <= FLAT_GEOMETRY_BOUNDARY_EPSILON
				? configuration.cacheRadialFallbackDirection
				: /** @type {UnitVector3} */ ([horizontal[0] / rhoMeters, horizontal[1] / rhoMeters, 0]);
		const tangent = /** @type {UnitVector3} */ ([-radial[1], radial[0], 0]);

		return {
			radial,
			tangent,
			vertical: [0, 0, 1],
		};
	}

	/**
	 * Called by FlatScatteringCacheGeometry to express one physical direction in the local radial frame.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - The geometry.
	 * @param {readonly number[]} position - The physical sample point.
	 * @param {UnitVector3} physicalDirection - The physical direction.
	 * @returns {UnitVector3} - The local direction.
	 */
	_localCacheDirection(configuration, position, physicalDirection) {
		const frame = this._localCacheDirectionFrame(configuration, position);

		return /** @type {UnitVector3} */ ([
			VectorMath.dot(physicalDirection, frame.radial),
			VectorMath.dot(physicalDirection, frame.tangent),
			VectorMath.dot(physicalDirection, frame.vertical),
		]);
	}

	/**
	 * Called by FlatScatteringCacheGeometry to express one local radial-frame direction in physical model space.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - The geometry.
	 * @param {readonly number[]} position - The physical sample point.
	 * @param {UnitVector3} cacheDirection - The local cache direction.
	 * @returns {UnitVector3} - The physical direction.
	 */
	_physicalCacheDirection(configuration, position, cacheDirection) {
		const frame = this._localCacheDirectionFrame(configuration, position);
		const direction = VectorMath.add(
			VectorMath.add(
				VectorMath.scale(frame.radial, cacheDirection[0]),
				VectorMath.scale(frame.tangent, cacheDirection[1]),
			),
			VectorMath.scale(frame.vertical, cacheDirection[2]),
		);
		const normalized = VectorMath.normalize(direction);

		return /** @type {UnitVector3} */ ([normalized[0], normalized[1], normalized[2]]);
	}

	/**
	 * Called by FlatScatteringCacheGeometry to resolve one scalar against an ordered physical node axis. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {number} valueMeters - The physical coordinate.
	 * @param {readonly Distance[]} nodes - The ordered nodes.
	 * @returns {FlatCacheAxisStencil} - The clamped one- or two-node stencil.
	 */
	_cacheAxisStencil(valueMeters, nodes) {
		const lastIndex = nodes.length - 1;
		if (valueMeters <= nodes[0].value) {
			return {
				lowerIndex: 0,
				upperIndex: 0,
				lowerWeight: 1,
				upperWeight: 0,
			};
		}
		if (valueMeters >= nodes[lastIndex].value) {
			return {
				lowerIndex: lastIndex,
				upperIndex: lastIndex,
				lowerWeight: 1,
				upperWeight: 0,
			};
		}

		let lowerIndex = 0;
		let upperIndex = lastIndex;
		while (upperIndex - lowerIndex > 1) {
			const middleIndex = Math.floor((lowerIndex + upperIndex) / 2);
			if (nodes[middleIndex].value <= valueMeters) {
				lowerIndex = middleIndex;
			} else {
				upperIndex = middleIndex;
			}
		}

		if (valueMeters === nodes[lowerIndex].value) {
			return {
				lowerIndex,
				upperIndex: lowerIndex,
				lowerWeight: 1,
				upperWeight: 0,
			};
		}
		if (valueMeters === nodes[upperIndex].value) {
			return {
				lowerIndex: upperIndex,
				upperIndex,
				lowerWeight: 1,
				upperWeight: 0,
			};
		}

		const upperWeight =
			(valueMeters - nodes[lowerIndex].value) / (nodes[upperIndex].value - nodes[lowerIndex].value);

		return {
			lowerIndex,
			upperIndex,
			lowerWeight: 1 - upperWeight,
			upperWeight,
		};
	}

	/**
	 * Called by FlatScatteringCacheGeometry to flatten one z-major, rho-minor position index.
	 *
	 * @param {number} zIndex - The altitude index.
	 * @param {number} rhoIndex - The radial index.
	 * @param {number} rhoCount - The radial extent.
	 * @returns {number} - The flattened index.
	 */
	_flattenPositionIndex(zIndex, rhoIndex, rhoCount) {
		return zIndex * rhoCount + rhoIndex;
	}

	/**
	 * Called by FlatScatteringCacheGeometry to read selected local executable position axes.
	 *
	 * @param {FlatLocalCachePositionDomainAxes | undefined} candidate - The optional axes.
	 * @param {FlatLocalCachePositionDomain} fallback - The default.
	 * @returns {FlatLocalCachePositionDomainAxes} - The executable axes.
	 */
	_cachePositionDomainAxes(candidate, fallback) {
		const axes = candidate ?? fallback;

		return {
			zNodes: axes.zNodes,
			rhoNodes: axes.rhoNodes,
			zCount: axes.zCount,
			rhoCount: axes.rhoCount,
		};
	}

	/**
	 * Called by FlatScatteringCacheGeometry to resolve the positive exit from the selected cache radial cylinder. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {readonly number[]} origin - The physical origin.
	 * @param {UnitVector3} direction - The physical direction.
	 * @param {number} maximumRhoMeters - The radial domain edge.
	 * @param {readonly number[]} sourceSubpoint - The cylinder center.
	 * @returns {number | null} - The exit distance or null for a vertical ray.
	 */
	_cacheRadialBoundaryDistance(origin, direction, maximumRhoMeters, sourceSubpoint) {
		const offsetX = origin[0] - sourceSubpoint[0];
		const offsetY = origin[1] - sourceSubpoint[1];
		const horizontalDirectionSquared = direction[0] ** 2 + direction[1] ** 2;
		if (horizontalDirectionSquared <= FLAT_GEOMETRY_BOUNDARY_EPSILON ** 2) {
			return null;
		}

		const halfLinearCoefficient = offsetX * direction[0] + offsetY * direction[1];
		const constantTerm = offsetX ** 2 + offsetY ** 2 - maximumRhoMeters ** 2;
		const discriminant = halfLinearCoefficient ** 2 - horizontalDirectionSquared * constantTerm;
		if (discriminant < -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return null;
		}

		const farDistance =
			(-halfLinearCoefficient + Math.sqrt(Math.max(0, discriminant))) / horizontalDirectionSquared;
		return farDistance >= -FLAT_GEOMETRY_BOUNDARY_EPSILON ? Math.max(0, farDistance) : null;
	}

	/**
	 * Called by FlatScatteringCacheGeometry to resolve one reusable construction ray's nearest selected boundary. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {readonly number[]} origin - The physical origin.
	 * @param {UnitVector3} direction - The physical direction.
	 * @returns {FlatReusableBoundary} - The selected finite boundary.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_resolveReusableBoundary(origin, direction) {
		const originPosition = DistanceMath.positionInMeters(origin);
		const candidates = [
			{
				kind: 'ground',
				distance: this._geometry.distanceToGroundBoundary(originPosition, direction),
			},
			{
				kind: 'top-atmosphere',
				distance: this._geometry.distanceToTopAtmosphereBoundary(originPosition, direction),
			},
			{
				kind: 'cache-radial-boundary',
				distance: this._cacheRadialBoundaryDistance(
					origin,
					direction,
					this._configuration.cacheRadialMaximum.value,
					this._configuration.sourceSubpoint.coordinates,
				),
			},
		].filter(
			/**
			 * Called by Array.prototype.filter to test whether one collection value is retained.
			 * @param candidate - The candidate value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (candidate) => candidate.distance !== null,
		);

		if (candidates.length === 0) {
			throw new RangeError('Flat reusable cache ray did not resolve a finite boundary.');
		}

		return /** @type {FlatReusableBoundary} */ (
			candidates.reduce(
				/**
				 * Called by Array.prototype.reduce to accumulate one collection value. It returns the candidate or retained accumulator according to the callback comparison.
				 * @param nearest - The nearest value accepted by the operation.
				 * @param candidate - The candidate value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (nearest, candidate) => (candidate.distance < nearest.distance ? candidate : nearest),
			)
		);
	}

	/**
	 * Creates the flat scattering-cache geometry paired with one physical geometry owner.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - The normalized flat geometry configuration.
	 * @param {FlatScatteringCacheGeometryOwner} geometry - The paired physical geometry operations.
	 * @param {ReconstructionDirectionDomain} outgoingDirectionDomain - Selected outgoing reconstruction owner.
	 */
	constructor(configuration, geometry, outgoingDirectionDomain) {
		this._configuration = configuration;
		this._geometry = geometry;
		this._cachePositionDomain = this.createLocalSunCachePositionDomain();
		this._outgoingDirectionDomain = outgoingDirectionDomain;
	}

	/**
	 * Retain profile-selected position and outgoing reconstruction owners.
	 *
	 * @param {Algorithm32ExecutionDomains} domains - Accepted aggregate profile domains.
	 */
	configureExecutionDomains(domains) {
		this._cachePositionDomain = /** @type {FlatLocalCachePositionDomain} */ (domains.positions);
		this._outgoingDirectionDomain = domains.outgoingDirections;
	}

	/**
	 * Call this method to create the selected flattened z-major, rho-minor local position domain.
	 *
	 * @param {FlatLocalCachePositionDomainRequest} [request] - The optional
	 * generated-axis count overrides.
	 * @returns {FlatLocalCachePositionDomain} - The executable domain packet.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	createLocalSunCachePositionDomain(request = {}) {
		const configured = this._configuration;
		const sourcePositionMeters = DistanceMath.toMetersPosition(configured.sourcePosition);
		const sourceSubpointMeters = [sourcePositionMeters[0], sourcePositionMeters[1], 0];
		const zCount = request.zCount ?? configured.cacheAltitudeNodes.length;
		const rhoCount = request.rhoCount ?? configured.cacheRadialNodes.length;
		if (
			configured.cacheAltitudeNodesExplicit &&
			request.zCount !== undefined &&
			request.zCount !== configured.cacheAltitudeNodes.length
		) {
			throw new RangeError('zCount must match explicitly configured cacheAltitudeNodes.');
		}
		if (
			configured.cacheRadialNodesExplicit &&
			request.rhoCount !== undefined &&
			request.rhoCount !== configured.cacheRadialNodes.length
		) {
			throw new RangeError('rhoCount must match explicitly configured cacheRadialNodes.');
		}
		const zNodes =
			configured.cacheAltitudeNodesExplicit || request.zCount === undefined
				? configured.cacheAltitudeNodes
				: this._uniformDistanceNodes(configured.topAltitude.value, zCount);
		const rhoNodes =
			configured.cacheRadialNodesExplicit || request.rhoCount === undefined
				? configured.cacheRadialNodes
				: this._uniformDistanceNodes(configured.cacheRadialMaximum.value, rhoCount);
		const fallbackRadial = configured.cacheRadialFallbackDirection;
		const definitions = [];

		for (let zIndex = 0; zIndex < zNodes.length; zIndex += 1) {
			for (let rhoIndex = 0; rhoIndex < rhoNodes.length; rhoIndex += 1) {
				const z = zNodes[zIndex];
				const radialDistanceMeters = rhoNodes[rhoIndex];
				const position = DistanceMath.positionInMeters([
					sourceSubpointMeters[0] + fallbackRadial[0] * radialDistanceMeters.value,
					sourceSubpointMeters[1] + fallbackRadial[1] * radialDistanceMeters.value,
					z.value,
				]);
				const index = this._flattenPositionIndex(zIndex, rhoIndex, rhoNodes.length);

				definitions.push({
					index,
					coordinate: z,
					role:
						zIndex === 0
							? 'ground-boundary-node'
							: zIndex === zNodes.length - 1
								? 'top-boundary-node'
								: 'interior-node',
					metadata: {
						position,
						z,
						rho: radialDistanceMeters,
						zIndex,
						rhoIndex,
					},
				});
			}
		}

		return {
			id: `algorithm32-flat-local-z${zNodes.length}-rho${rhoNodes.length}-position-v3`,
			nodes: definitions,
			zNodes,
			rhoNodes,
			zCount: zNodes.length,
			rhoCount: rhoNodes.length,
			count: definitions.length,
		};
	}

	/** Call this method to create the selected geometry-owned ragged topology from complete physical controls.
	 * The selected source height and slab must match this geometry; activation in transport is a later P1 step.
	 *
	 * @param {FlatCompactTopologyRequest} request - Accepted physical configuration and medium-derived refinement.
	 * @returns {FlatCompactTopology} - Actual compact positions, admission/stencils and source-distance bounds.
	 * @throws {RangeError} - Topology inputs or paired height/slab are incompatible.
	 */
	createCompactLocalSunCacheTopology(request) {
		let topology = new CompactLocalCacheTopology(request);
		if (
			topology.sourceHeight.value !== DistanceMath.toMeters(this._configuration.localLightSourceHeight) ||
			topology.sourceHeight.value !== DistanceMath.toMetersPosition(this._configuration.sourcePosition)[2] ||
			topology.atmosphereTop.value !== DistanceMath.toMeters(this._configuration.topAltitude)
		)
			throw new RangeError('Compact topology must match its paired geometry height/slab.');
		return topology;
	}

	/**
	 * Called by FlatScatteringCacheGeometry to build one local position-major transport query.
	 *
	 * @param {FlatTransportQueryRequest} request - The physical query.
	 * @returns {readonly FlatTransportTap[]} - The aggregated active taps.
	 */
	_createTransportQueryTaps(request) {
		const metadata = /** @type {FlatLocalCachePositionNodeMetadata} */ (request.positionNode.metadata);
		const origin = DistanceMath.acceptPositionInMeters(metadata.position, 'Flat transport position node');
		const physicalDirection = this._physicalCacheDirection(this._configuration, origin, request.cacheDirection);
		const boundary = this._resolveReusableBoundary(origin, physicalDirection);
		const intervalLengthMeters = boundary.distance / request.intervalCount;
		const channelCount = request.domains.spectralChannelCount;
		const viewTransmittance = new Float64Array(channelCount).fill(1);
		/** @type {readonly number[] | null} */
		let previousExtinction = null;
		const aggregate = new Map();

		for (let pointIndex = 0; pointIndex <= request.intervalCount; pointIndex += 1) {
			const distanceAlongRayMeters = intervalLengthMeters * pointIndex;
			const samplePosition = VectorMath.addScaled(origin, physicalDirection, distanceAlongRayMeters);
			if (boundary.kind === 'ground' && pointIndex === request.intervalCount) {
				samplePosition[2] = 0;
			}
			const position = DistanceMath.positionInMeters(samplePosition);
			const atmosphereCoordinate = this._geometry.resolveAtmosphereCoordinate(position);
			const medium = request.atmosphere.sampleMedium(atmosphereCoordinate);
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

			const positionStencil = this.resolveScatteringCacheConstructionPositionStencil({
				position,
				atmosphereCoordinate,
				positionAxes: request.domains,
			});
			const directionStencil = request.domains.resolveOutgoingDirectionStencil(
				this._localCacheDirection(this._configuration, samplePosition, physicalDirection),
			);
			const measureMeters =
				intervalLengthMeters * (pointIndex === 0 || pointIndex === request.intervalCount ? 0.5 : 1);

			for (let positionOffset = 0; positionOffset < positionStencil.indices.length; positionOffset += 1) {
				for (let directionOffset = 0; directionOffset < directionStencil.indices.length; directionOffset += 1) {
					const sourcePositionIndex = positionStencil.indices[positionOffset];
					const sourceDirectionIndex = directionStencil.indices[directionOffset];
					const interpolationWeight =
						positionStencil.weights[positionOffset] * directionStencil.weights[directionOffset];
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
			}

			previousExtinction = extinction;
		}

		return [...aggregate.values()];
	}

	/**
	 * Call this method to enumerate canonical active local transport rows without
	 * allocating their fixed-width packed representation.
	 *
	 * @param {FlatCacheTransportDataRequest} request - The physical transport inputs.
	 * @param {FlatTransportQueryTapVisitor} visit - The receiver of each active query row.
	 * @returns {void} - No value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	forEachTransportQueryTap(request, visit) {
		if (!Number.isInteger(request.intervalCount) || request.intervalCount < 1) {
			throw new RangeError('Flat transport intervalCount must be a positive integer.');
		}

		let queryIndex = 0;
		for (const positionNode of request.domains.positionNodes) {
			for (const cacheDirection of request.domains.incomingUnitVectors) {
				visit({
					queryIndex,
					taps: this._createTransportQueryTaps({
						atmosphere: request.atmosphere,
						domains: request.domains,
						positionNode,
						cacheDirection,
						intervalCount: request.intervalCount,
					}),
				});
				queryIndex += 1;
			}
		}
	}

	/**
	 * Call this method to build compact active-only CSR transport data for the
	 * Flat/local interim path. It performs two deterministic row enumerations so
	 * the final typed arrays have their exact active extent without retaining
	 * object rows or fixed-width padding.
	 *
	 * @param {FlatCacheTransportDataRequest} request - The physical transport inputs.
	 * @returns {FlatIndexedTransportData} - The active-only transport representation.
	 */
	createIndexedTransportData(request) {
		const queryCount = request.domains.positionNodes.length * request.domains.incomingDirectionCount;
		const queryOffsets = new Uint32Array(queryCount + 1);
		let activeTapCount = 0;

		this.forEachTransportQueryTap(request, ({queryIndex, taps}) => {
			queryOffsets[queryIndex] = activeTapCount;
			activeTapCount += taps.length;
			queryOffsets[queryIndex + 1] = activeTapCount;
		});

		const sourceDirectionIndices = new Uint32Array(activeTapCount);
		const sourcePositionNodeIds = new Uint32Array(activeTapCount);
		const coefficients = new Float32Array(activeTapCount * request.domains.spectralChannelCount);

		this.forEachTransportQueryTap(request, ({queryIndex, taps}) => {
			let activeTapIndex = queryOffsets[queryIndex];
			for (const tap of taps) {
				sourceDirectionIndices[activeTapIndex] = tap.sourceDirectionIndex;
				sourcePositionNodeIds[activeTapIndex] = tap.sourcePositionIndex;
				for (let wavelengthIndex = 0; wavelengthIndex < tap.coefficients.length; wavelengthIndex += 1) {
					coefficients[activeTapIndex * request.domains.spectralChannelCount + wavelengthIndex] =
						tap.coefficients[wavelengthIndex];
				}
				activeTapIndex += 1;
			}
		});

		return {
			queryCount,
			activeTapCount,
			queryOffsets,
			sourceDirectionIndices,
			sourcePositionNodeIds,
			coefficients,
		};
	}

	/**
	 * Call this method to create R32F shader resources from active-only Flat/local
	 * CSR transport data. Every stored integer is within Float32's exact range.
	 *
	 * @param {FlatCacheTransportDataRequest} request - The physical transport inputs.
	 * @returns {FlatIndexedTransportGpuData} - The GPU-bindable indexed transport data.
	 */
	createIndexedTransportGpuData(request) {
		const data = this.createIndexedTransportData(request);
		const idPrefix = `${request.domains.id}-flat-local-indexed-transport`;
		const channelCount = request.domains.spectralChannelCount;
		const textureWidth = FLAT_INDEXED_TRANSPORT_TEXTURE_WIDTH;
		const offsetTextureHeight = Math.ceil(data.queryOffsets.length / textureWidth);
		const tapTextureHeight = Math.ceil(data.activeTapCount / textureWidth);
		const offsetValues = new Float32Array(textureWidth * offsetTextureHeight);
		const sourceDirectionValues = new Float32Array(textureWidth * tapTextureHeight);
		const sourcePositionValues = new Float32Array(textureWidth * tapTextureHeight);
		const layeredCoefficients = new Float32Array(textureWidth * tapTextureHeight * channelCount);
		offsetValues.set(data.queryOffsets);
		sourceDirectionValues.set(data.sourceDirectionIndices);
		sourcePositionValues.set(data.sourcePositionNodeIds);
		for (let activeTapIndex = 0; activeTapIndex < data.activeTapCount; activeTapIndex += 1) {
			for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
				layeredCoefficients[wavelengthIndex * textureWidth * tapTextureHeight + activeTapIndex] =
					data.coefficients[activeTapIndex * channelCount + wavelengthIndex];
			}
		}
		return {
			kind: 'indexed',
			queryCount: data.queryCount,
			activeTapCount: data.activeTapCount,
			textureWidth,
			queryOffsets: CacheValues.createData({
				id: `${idPrefix}-offsets-v1`,
				quantity: 'transport-query-offset',
				units: '1',
				shape: [textureWidth, offsetTextureHeight],
				values: offsetValues,
			}),
			sourceDirectionIndices: CacheValues.createData({
				id: `${idPrefix}-source-directions-v1`,
				quantity: 'transport-source-direction-index',
				units: '1',
				shape: [textureWidth, tapTextureHeight],
				values: sourceDirectionValues,
			}),
			sourcePositionNodeIds: CacheValues.createData({
				id: `${idPrefix}-source-positions-v1`,
				quantity: 'transport-source-position-index',
				units: '1',
				shape: [textureWidth, tapTextureHeight],
				values: sourcePositionValues,
			}),
			coefficients: CacheValues.createData({
				id: `${idPrefix}-coefficients-v1`,
				quantity: 'transport-path-coefficient',
				units: 'meters',
				shape: [textureWidth, tapTextureHeight, channelCount],
				values: layeredCoefficients,
			}),
		};
	}

	/**
	 * Call this method to build packed local Jk-to-Lk transport data. The radial source frame is recomputed at every path sample. Position and direction interpolation therefore contribute arbitrary combined taps rather than the spherical cache's one-position specialization.
	 *
	 * @param {FlatCacheTransportDataRequest} request - The physical collaborators.
	 * @returns {CacheTransportData} - The reusable packed transport data.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	createTransportData(request) {
		const domains = request.domains;
		const tapsByQuery = [];
		this.forEachTransportQueryTap(request, ({taps}) => tapsByQuery.push(taps));

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
				id: `${domains.id}-flat-local-transport-sources-v2`,
				quantity: 'transport-source-address-and-active-flag',
				units: '1',
				shape: [tapCount * 3, queryCount],
				values: sourceValues,
			}),
			coefficients: CacheValues.createData({
				id: `${domains.id}-flat-local-transport-coefficients-v2`,
				quantity: 'transport-path-coefficient',
				units: 'meters',
				shape: [tapCount, queryCount, channelCount],
				values: coefficientValues,
			}),
		};
	}

	/**
	 * Call this method to resolve bilinear final-view interpolation over the selected z/rho grid.
	 *
	 * @param {FlatScatteringCachePositionStencilRequest} request - The
	 * physical coordinates and an optional matching position domain.
	 * @returns {ScatteringCachePositionStencil} - The weighted taps, with up to four entries.
	 *
	 */
	resolveScatteringCachePositionStencil(request) {
		const axes = this._cachePositionDomainAxes(request.positionAxes, this._cachePositionDomain);
		const altitudeMeters = DistanceMath.toMeters(request.atmosphereCoordinate.altitude);
		const radialDistanceMeters =
			request.atmosphereCoordinate.rho ?? this._geometry.resolveAtmosphereCoordinate(request.position).rho;
		const normalizedRadialDistanceMeters = DistanceMath.toMeters(radialDistanceMeters);
		const zStencil = this._cacheAxisStencil(altitudeMeters, axes.zNodes);
		const rhoStencil = this._cacheAxisStencil(normalizedRadialDistanceMeters, axes.rhoNodes);
		const taps = new Map();

		for (const [zIndex, zWeight] of [
			[zStencil.lowerIndex, zStencil.lowerWeight],
			[zStencil.upperIndex, zStencil.upperWeight],
		]) {
			for (const [rhoIndex, rhoWeight] of [
				[rhoStencil.lowerIndex, rhoStencil.lowerWeight],
				[rhoStencil.upperIndex, rhoStencil.upperWeight],
			]) {
				const weight = zWeight * rhoWeight;
				if (weight > 0) {
					const index = this._flattenPositionIndex(zIndex, rhoIndex, axes.rhoCount);
					taps.set(index, (taps.get(index) ?? 0) + weight);
				}
			}
		}

		return {
			indices: [...taps.keys()],
			weights: [...taps.values()],
		};
	}

	/**
	 * Call this method to resolve bilinear construction interpolation over the selected z/rho grid.
	 *
	 * @param {FlatScatteringCachePositionStencilRequest} request - The
	 * physical coordinates and an optional matching position domain.
	 * @returns {ScatteringCachePositionStencil} - The weighted taps, with up to four entries.
	 *
	 */
	resolveScatteringCacheConstructionPositionStencil(request) {
		return this.resolveScatteringCachePositionStencil(request);
	}

	/**
	 * Call this method to express a physical outgoing direction in the radial/tangent/vertical frame.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - The physical
	 * position and direction.
	 * @returns {UnitVector3} - The source-local direction.
	 *
	 */
	expressScatteringCacheDirection(request) {
		const position = DistanceMath.acceptPositionInMeters(request.position, 'Scattering-cache direction position');
		const direction = GeometryDirections.normalizeDirection(
			request.physicalOutgoingDirection,
			'Scattering-cache physical direction',
		);

		return this._localCacheDirection(this._configuration, position, direction);
	}

	/**
	 * Call this method to resolve a physical outgoing direction through W27 reconstruction.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - The physical
	 * position and direction.
	 * @returns {ScatteringCacheDirectionStencil} - The up to four W27 taps.
	 *
	 */
	resolveScatteringCacheDirectionStencil(request) {
		return this._outgoingDirectionDomain.resolveStencil(this.expressScatteringCacheDirection(request));
	}

	/** Call this method to resolve complete compact spatial support with a separate angular lookup at each tap.
	 * Ordinary taps retain the query radial frame. Axis taps preserve horizontal magnitude and vertical
	 * direction in the canonical meridian; there is no independent Sun-angle position axis.
	 * This capability supplies interpolation support only, without spectral density restoration or field sampling.
	 *
	 * @param {FlatCompactReconstructionRequest} request - Paired compact topology and physical unit-bearing query.
	 * @returns {readonly FlatCompactReconstructionTap[]} - Positive spatial taps with their W27 angular support.
	 * @throws {RangeError} - Topology pairing, direction or complete spatial support is invalid.
	 * @throws {TypeError} - Physical position or topology bounds lack finite supported distance units.
	 */
	resolveCompactLocalSunCacheStencil(request) {
		let topology = request.topology;
		this._assertCompactTopologyPairing(topology);
		let position = DistanceMath.acceptPositionInMeters(request.position, 'Compact reconstruction position');
		let direction = GeometryDirections.normalizeDirection(
			request.physicalOutgoingDirection,
			'Compact reconstruction direction',
		);
		let subpoint = this._configuration.sourceSubpoint.coordinates;
		let spatial = topology.resolvePositionStencil({
			horizontalDistance: DistanceMath.inMeters(Math.hypot(position[0] - subpoint[0], position[1] - subpoint[1])),
			altitude: DistanceMath.inMeters(position[2]),
		});
		let ordinary = this._outgoingDirectionDomain.resolveStencil(
			this._localCacheDirection(this._configuration, position, direction),
		);
		let fallback = this._configuration.cacheRadialFallbackDirection;
		let horizontal = Math.hypot(direction[0], direction[1]);
		let projected = /** @type {UnitVector3} */ ([fallback[0] * horizontal, fallback[1] * horizontal, direction[2]]);
		let axis = this.resolveScatteringCacheDirectionStencil({
			position: this._configuration.sourceSubpoint,
			physicalOutgoingDirection: projected,
		});
		return spatial.indices.map((positionIndex, index) => ({
			positionIndex,
			positionWeight: spatial.weights[index],
			directionStencil:
				DistanceMath.toMeters(topology.positionAt(positionIndex).horizontalDistance) === 0 ? axis : ordinary,
		}));
	}

	/** Called by compact lookup and node placement to require a compatible structural topology.
	 *
	 * @param {FlatCompactTopology} topology - Geometry-paired physical domain.
	 * @returns {void} - No value.
	 * @throws {RangeError} - Operations or geometry pairing are incompatible.
	 * @throws {TypeError} - Pairing dimensions lack supported finite units.
	 */
	_assertCompactTopologyPairing(topology) {
		if (
			!topology ||
			typeof topology.positionAt !== 'function' ||
			typeof topology.resolvePositionStencil !== 'function'
		)
			throw new RangeError('Compact reconstruction requires complete topology operations.');
		DistanceMath.assertDistance(topology.sourceHeight, 'Compact topology source height');
		DistanceMath.assertDistance(topology.atmosphereTop, 'Compact topology atmosphere top');
		let height = DistanceMath.toMeters(topology.sourceHeight);
		if (
			height !== DistanceMath.toMeters(this._configuration.localLightSourceHeight) ||
			height !== DistanceMath.toMetersPosition(this._configuration.sourcePosition)[2] ||
			DistanceMath.toMeters(topology.atmosphereTop) !== DistanceMath.toMeters(this._configuration.topAltitude)
		)
			throw new RangeError('Compact reconstruction requires a paired geometry-owned topology.');
	}

	/** Call this method to place an allocated compact node in the geometry's canonical source meridian.
	 *
	 * @param {FlatCompactNodePositionRequest} request - Paired topology and allocated position address.
	 * @returns {Position} - Physical unit-bearing node position.
	 * @throws {RangeError} - Pairing, address or node support is invalid.
	 * @throws {TypeError} - Node or topology dimensions lack supported finite units.
	 */
	resolveCompactLocalSunCacheNodePosition(request) {
		this._assertCompactTopologyPairing(request.topology);
		let node = request.topology.positionAt(request.positionIndex);
		DistanceMath.assertDistance(node.horizontalDistance, 'Compact node horizontal distance');
		DistanceMath.assertDistance(node.altitude, 'Compact node altitude');
		DistanceMath.assertDistance(request.topology.coverageRadius, 'Compact coverage radius');
		let rho = DistanceMath.toMeters(node.horizontalDistance),
			z = DistanceMath.toMeters(node.altitude);
		if (
			rho < 0 ||
			rho > DistanceMath.toMeters(request.topology.coverageRadius) ||
			z < 0 ||
			z > DistanceMath.toMeters(request.topology.atmosphereTop)
		)
			throw new RangeError('Compact node is outside complete support.');
		let subpoint = this._configuration.sourceSubpoint.coordinates,
			radial = this._configuration.cacheRadialFallbackDirection;
		return DistanceMath.positionInMeters([subpoint[0] + radial[0] * rho, subpoint[1] + radial[1] * rho, z]);
	}

	/**
	 * Call this method to express one radial-frame cache direction in physical model space.
	 *
	 * @param {FlatScatteringCacheFramedDirectionRequest} request - The
	 * physical position and source-local direction.
	 * @returns {UnitVector3} - The physical direction.
	 *
	 */
	expressPhysicalScatteringCacheDirection(request) {
		const position = DistanceMath.acceptPositionInMeters(request.position, 'Flat cache direction position');
		const cacheDirection = GeometryDirections.normalizeDirection(
			request.cacheDirection,
			'Flat cache local direction',
		);

		return this._physicalCacheDirection(this._configuration, position, cacheDirection);
	}

	/** Call this method to bound a physical compact ray using its actual topology cylinder, independently of rectangular defaults.
	 * The returned sampler corrects only analytic physical-endpoint roundoff; outside origins and interior samples reject.
	 *
	 * @param {FlatCompactRayRequest} request - Paired topology, physical origin/direction and optional shortening.
	 * @returns {FlatCompactRay} - Closed geometry-owned physical ray and sampler.
	 * @throws {TypeError} - Physical units or direction contract differs.
	 * @throws {RangeError} - Pairing, origin, shortening or sampled support is invalid.
	 */
	resolveCompactLocalSunCacheRay(request) {
		this._assertCompactTopologyPairing(request.topology);
		let origin = DistanceMath.acceptPositionInMeters(request.position, 'Compact ray origin');
		let direction = GeometryDirections.normalizeDirection(request.physicalDirection, 'Compact ray direction');
		let radius = DistanceMath.toMeters(request.topology.coverageRadius),
			top = DistanceMath.toMeters(request.topology.atmosphereTop);
		let center = DistanceMath.toMetersPosition(this._configuration.sourceSubpoint);
		request.topology.resolvePositionStencil({
			horizontalDistance: DistanceMath.inMeters(Math.hypot(origin[0] - center[0], origin[1] - center[1])),
			altitude: DistanceMath.inMeters(origin[2]),
		});
		let plane =
			direction[2] > 0
				? (top - origin[2]) / direction[2]
				: direction[2] < 0
					? -origin[2] / direction[2]
					: Infinity;
		let a = direction[0] ** 2 + direction[1] ** 2,
			b = (origin[0] - center[0]) * direction[0] + (origin[1] - center[1]) * direction[1];
		let rho = Math.hypot(origin[0] - center[0], origin[1] - center[1]),
			radialRemainder = (radius - rho) * (radius + rho);
		let root = Math.sqrt(Math.max(0, b * b + a * radialRemainder));
		let cylinder =
			a === 0 ? Infinity : b >= 0 ? (root + b === 0 ? 0 : radialRemainder / (root + b)) : (-b + root) / a;
		let length = Math.min(plane, cylinder);
		let boundary = /** @type {FlatCompactRay['boundary']} */ (
			plane <= cylinder ? (direction[2] > 0 ? 'top-atmosphere' : 'ground') : 'cache-radial-boundary'
		);
		if (request.maximumDistance !== undefined) {
			DistanceMath.assertDistance(request.maximumDistance, 'Compact ray shortening');
			let maximum = DistanceMath.toMeters(request.maximumDistance);
			if (maximum < 0) throw new RangeError('Nonnegative compact ray shortening required.');
			if (maximum < length) {
				length = maximum;
				boundary = 'shortened';
			}
		}
		if (!Number.isFinite(length) || length < 0) throw new RangeError('Finite compact ray bound required.');
		return Object.freeze({
			origin: DistanceMath.positionInMeters(origin),
			direction,
			length: DistanceMath.inMeters(length),
			boundary,
			/** Called by cache integration to obtain a supported point from this geometry-created ray.
			 *
			 * @param {Distance} distance - Physical distance along the closed ray.
			 * @returns {Position} - Physical supported sample.
			 * @throws {RangeError} - Distance or complete sample support is invalid.
			 */
			positionAt: (distance) => {
				DistanceMath.assertDistance(distance, 'Compact ray sample distance');
				let s = DistanceMath.toMeters(distance);
				if (s < 0 || s > length) throw new RangeError('Compact ray sample is outside its bounded segment.');
				let point = VectorMath.addScaled(origin, direction, s);
				if (s === length) {
					if (boundary === 'ground') point[2] = 0;
					if (boundary === 'top-atmosphere') point[2] = top;
					if (boundary === 'cache-radial-boundary' && length > 0) {
						// Construct the analytic cylinder endpoint inward by four binary64 epsilons, below 0.01 m in this admitted control.
						let scale =
							(radius * (1 - 4 * Number.EPSILON)) /
							Math.hypot(point[0] - center[0], point[1] - center[1]);
						point[0] = center[0] + (point[0] - center[0]) * scale;
						point[1] = center[1] + (point[1] - center[1]) * scale;
					}
				}
				request.topology.resolvePositionStencil({
					horizontalDistance: DistanceMath.inMeters(Math.hypot(point[0] - center[0], point[1] - center[1])),
					altitude: DistanceMath.inMeters(point[2]),
				});
				return DistanceMath.positionInMeters(point);
			},
		});
	}

	/**
	 * Call this method to resolve a source-owned cache coordinate into its reusable physical ray. Ground-bound rays retain the atmosphere segment up to their hit. The observer dome and scene cap never enter this reusable construction path.
	 *
	 * @param {CacheBuildCoordinate} coordinate - The cache coordinate.
	 * @returns {RaySegment} - The finite construction segment.
	 *
	 */
	resolveCacheBuildRay(coordinate) {
		const incomingDirection = coordinate.incomingDirection;
		const metadata = /** @type {FlatLocalCacheBuildCoordinateMetadata | undefined} */ (coordinate.metadata);
		let originPosition = metadata?.position;
		if (originPosition === undefined) {
			const radial = this._configuration.cacheRadialFallbackDirection;
			const sourceSubpoint = this._configuration.sourceSubpoint.coordinates;
			const altitudeMeters = DistanceMath.toMeters(coordinate.altitude);
			const rhoMeters = DistanceMath.toMeters(coordinate.rho);
			originPosition = DistanceMath.positionInMeters([
				sourceSubpoint[0] + radial[0] * rhoMeters,
				sourceSubpoint[1] + radial[1] * rhoMeters,
				altitudeMeters,
			]);
		}

		const origin = DistanceMath.toMetersPosition(originPosition);
		const direction = GeometryDirections.normalizeTrustedDirection(
			incomingDirection,
			'Flat cache build incomingDirection',
		);
		const boundary = this._resolveReusableBoundary(origin, direction);

		return {
			ray: {
				origin: DistanceMath.positionInMeters(origin),
				direction,
			},
			startDistance: DistanceMath.inMeters(0),
			endDistance: DistanceMath.inMeters(boundary.distance),
			metadata: {
				boundaryKind: boundary.kind,
				terminatedByGround: boundary.kind === 'ground',
				observerDomeApplied: false,
			},
		};
	}
}
