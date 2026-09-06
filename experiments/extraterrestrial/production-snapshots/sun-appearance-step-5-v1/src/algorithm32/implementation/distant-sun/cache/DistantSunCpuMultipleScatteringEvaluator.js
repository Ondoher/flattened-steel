/**
 * Later-order scattering and stored-field transport evaluator for one
 * configured distant-Sun provider.
 *
 * Numerical provenance source: the current production cache contract,
 * functions `buildNextScatteringDensity` and `incomingRadianceAtPosition`.
 * SHA-256: `98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a`.
 */

import {ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY} from '../../../atmospheric-transport/consts.js';
import {createPhysicalLaterOrderScatteringKernel} from '../../../atmospheric-transport/later-order-scattering-density.js';
import {transportPureScatteringDensity} from '../../../atmospheric-transport/scattering-density-transport.js';
import DistanceMath from '../../../math/DistanceMath.js';
import {SOURCE_LOCAL_TOWARD_DISTANT_SUN, UNIT_VECTOR_TOLERANCE} from './consts.js';

/** Stored-field transport, later-order scattering, and ground-reflection evaluator. */
export class DistantSunCpuMultipleScatteringEvaluator {
	/**
	 * Configured physical source captured for the provider lifetime.
	 * @type {DistantSunCacheProviderSource}
	 */
	_source;
	/**
	 * Normalized source configuration captured for the provider lifetime.
	 * @type {DistantSunLightSourceConfiguration}
	 */
	_configuration;
	/**
	 * Provider-owned field allocation operations.
	 * @type {DistantSunCpuMultipleScatteringFieldAllocators}
	 */
	_fieldAllocators;

	/**
	 * Creates a multiple-scattering evaluator for one configured distant-Sun provider.
	 *
	 * @param {DistantSunCacheProviderSource} source - Configured physical source facade.
	 * @param {DistantSunLightSourceConfiguration} configuration - Normalized source configuration.
	 * @param {DistantSunCpuMultipleScatteringFieldAllocators} fieldAllocators - Provider-owned field allocation operations.
	 */
	constructor(source, configuration, fieldAllocators) {
		this._source = source;
		this._configuration = configuration;
		this._fieldAllocators = fieldAllocators;
	}

	/**
	 * Called by later-order evaluation to require one finite normalized physical direction.
	 *
	 * @param {UnitVector3} value - Candidate physical direction.
	 * @param {string} label - Diagnostic label for an invalid direction.
	 * @returns {UnitVector3} - Accepted normalized direction.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_assertUnitVector(value, label) {
		const magnitude = Math.hypot(value[0], value[1], value[2]);
		if (!Number.isFinite(magnitude) || Math.abs(magnitude - 1) > UNIT_VECTOR_TOLERANCE) {
			throw new RangeError(`${label} must be normalized.`);
		}

		return value;
	}

	/**
	 * Called by later-order evaluation to require matching physical source axes
	 * at the geometry/source boundary.
	 *
	 * @param {UnitVector3} directionToSource - Geometry-owned physical source axis.
	 * @param {UnitVector3} directionToLight - Configured source-owned physical axis.
	 * @returns {void} - No value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_assertMatchingSourceDirections(directionToSource, directionToLight) {
		if (
			directionToSource.some(
				/**
				 * Called by Array.prototype.some to test one collection value for a matching condition.
				 * @param component - The component value accepted by the operation.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (component, index) => Math.abs(component - directionToLight[index]) > UNIT_VECTOR_TOLERANCE,
			)
		) {
			throw new TypeError('distant-Sun later-order geometry and source directions must match.');
		}
	}

	/**
	 * Called by later-order evaluation to compute one dot product in the selected
	 * production basis-validation order.
	 *
	 * @param {UnitVector3} left - Left physical axis.
	 * @param {UnitVector3} right - Right physical axis.
	 * @returns {number} - Scalar dot product.
	 */
	_dot(left, right) {
		return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
	}

	/**
	 * Called by later-order evaluation to compute one cross product in the
	 * selected production basis-validation order.
	 *
	 * @param {UnitVector3} left - Left physical axis.
	 * @param {UnitVector3} right - Right physical axis.
	 * @returns {UnitVector3} - Physical cross product.
	 */
	_cross(left, right) {
		return [
			left[1] * right[2] - left[2] * right[1],
			left[2] * right[0] - left[0] * right[2],
			left[0] * right[1] - left[1] * right[0],
		];
	}

	/**
	 * Called by later-order evaluation to apply the one-time cubed-sphere basis
	 * acceptance policy to mapped positive face centers.
	 *
	 * @param {readonly UnitVector3[]} physicalDirections - Mapped cubed-sphere directions.
	 * @param {DistantSunConstructionDomainSelection} domainSelection - Executable face-center indices.
	 * @returns {void} - No value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_assertPhysicalCubedSphereBasis(physicalDirections, domainSelection) {
		const centerIndices = domainSelection.outgoingPositiveFaceCenterIndices;
		const xAxis = physicalDirections[centerIndices.positiveX];
		const yAxis = physicalDirections[centerIndices.positiveY];
		const zAxis = physicalDirections[centerIndices.positiveZ];

		if (
			Math.abs(this._dot(xAxis, yAxis)) > UNIT_VECTOR_TOLERANCE ||
			Math.abs(this._dot(xAxis, zAxis)) > UNIT_VECTOR_TOLERANCE ||
			Math.abs(this._dot(yAxis, zAxis)) > UNIT_VECTOR_TOLERANCE
		) {
			throw new RangeError('distant-Sun physical cubed-sphere basis axes must be mutually orthogonal.');
		}
		if (this._dot(this._cross(xAxis, yAxis), zAxis) < 1 - UNIT_VECTOR_TOLERANCE) {
			throw new RangeError('distant-Sun physical cubed-sphere basis axes must form a right-handed frame.');
		}
	}

	/**
	 * Called by later-order evaluation to bind provider-captured source facts and
	 * check numerical source/geometry coherence before kernel construction.
	 *
	 * @param {DistantSunCpuLaterOrderKernelEvaluationRequest} value - Later-order evaluation request.
	 * @returns {DistantSunLaterOrderScatteringContext} - Accepted adapter request and domains.
	 */
	_assertAdapterRequest(value) {
		const request = /** @type {DistantSunLaterOrderScatteringKernelRequest} */ (
			value.groundBoundary == null
				? {
						...value,
						directionToLight: this._configuration.directionToLight,
					}
				: {
						...value,
						directionToLight: this._configuration.directionToLight,
						lightSource: this._source,
					}
		);
		const domainSelection = request.domainSelection;
		const geometryDirectionToSource = this._assertUnitVector(
			request.geometry.expressPhysicalIncomingRadianceDirection(SOURCE_LOCAL_TOWARD_DISTANT_SUN),
			'distant-Sun geometry directionToSource',
		);
		const directionToLight = this._assertUnitVector(
			request.directionToLight,
			'distant-Sun source directionToLight',
		);
		this._assertMatchingSourceDirections(geometryDirectionToSource, directionToLight);

		return {
			request,
			domainSelection,
		};
	}

	/**
	 * Called by kernel construction to precompute geometry-owned physical
	 * positions for every selected native node and return their reusable resolver.
	 *
	 * @param {DistantSunLaterOrderScatteringGeometry} geometry - Spherical position reconstruction.
	 * @param {DistantSunConstructionDomainSelection} domainSelection - Executable position nodes.
	 * @returns {LaterOrderScatteringPositionResolver} - Precomputed physical position resolver.
	 */
	_createPhysicalPositionResolver(geometry, domainSelection) {
		const physicalPositions = domainSelection.positionNodes.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param positionNode - The position node value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (positionNode) => geometry.resolveScatteringCacheConstructionPosition(positionNode),
		);

		return (
			/**
			 * Called by create physical position resolver to handle one invocation of the declared operation.
			 * @param request - The request accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (request) => physicalPositions[request.positionIndex]
		);
	}

	/**
	 * Called by kernel construction to precompute the distinct physical incoming
	 * and outgoing direction sets and return their reusable resolvers.
	 *
	 * @param {DistantSunLaterOrderScatteringGeometry} geometry - Source-frame direction mapping.
	 * @param {DistantSunConstructionDomainSelection} domainSelection - Executable direction domains.
	 * @returns {DistantSunCpuPhysicalDirectionResolvers} - Precomputed direction resolvers.
	 */
	_createPhysicalDirectionResolvers(geometry, domainSelection) {
		const physicalIncomingDirections = domainSelection.incomingUnitVectors.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param cacheDirection - The cache direction value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (cacheDirection) =>
				this._assertUnitVector(
					geometry.expressPhysicalIncomingRadianceDirection(cacheDirection),
					'distant-Sun physical Fibonacci-34 direction',
				),
		);
		const physicalOutgoingDirections = domainSelection.outgoingUnitVectors.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param cacheDirection - The cache direction value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (cacheDirection) =>
				this._assertUnitVector(
					geometry.expressPhysicalOutgoingScatteringDirection(cacheDirection),
					'distant-Sun physical cubed-sphere direction',
				),
		);
		this._assertPhysicalCubedSphereBasis(physicalOutgoingDirections, domainSelection);

		return {
			/**
			 * Called by create physical direction resolvers to incoming.
			 * @param request - The request accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ incoming: (request) => physicalIncomingDirections[request.directionIndex],
			/**
			 * Called by create physical direction resolvers to outgoing.
			 * @param request - The request accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ outgoing: (request) => physicalOutgoingDirections[request.directionIndex],
		};
	}

	/**
	 * Called by reflective-ground evaluation to select pure L(k-2) as the only
	 * higher-order ground-illumination field.
	 *
	 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Selected scattering order and field.
	 * @returns {CpuDirectionalSpectralFieldReader | null} - No reader for J2 or the sealed pure-field reader.
	 */
	_groundIlluminationReader(request) {
		if (request.scatteringOrder === 2) {
			return null;
		}

		return /** @type {CpuDirectionalSpectralFieldContract} */ (request.groundIlluminationRadiance).createReader();
	}

	/**
	 * Called by reflective-ground evaluation to integrate atmosphere
	 * transmittance for one ground-owned ray segment.
	 *
	 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Ground transport owners and options.
	 * @param {Ray} groundPathRay - Physical path ray.
	 * @param {Distance | undefined} endDistance - Optional explicit path end distance.
	 * @param {SourcePathLimit | undefined} sourcePathLimit - Optional source-owned path limit.
	 * @returns {readonly number[]} - Spectral transmittance values.
	 */
	_groundPathTransmittance(request, groundPathRay, endDistance, sourcePathLimit) {
		const path = request.geometry.resolveAtmospherePath({
			ray: groundPathRay,
			...(endDistance === undefined ? {} : {endDistance}),
			...(sourcePathLimit === undefined ? {} : {sourcePathLimit}),
			sampleCount: request.sourceTransmittanceIntervalCount,
		});

		return request.atmosphere.integrateOpticalDepth(path).transmittance.values;
	}

	/**
	 * Called by reflective-ground evaluation to preserve the exact unit-
	 * transmittance shortcut for a cache position at ground contact. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Ground transport owners.
	 * @param {GroundIntersection} groundIntersection - Geometry-owned ground intersection.
	 * @param {UnitVector3} outgoingDirection - Direction from ground toward the cache sample.
	 * @param {number} channelCount - Spectral channel count.
	 * @returns {readonly number[]} - Ground-to-position spectral transmittance.
	 */
	_groundToPositionTransmittance(request, groundIntersection, outgoingDirection, channelCount) {
		if (DistanceMath.toMeters(groundIntersection.distance) === 0) {
			return Array(channelCount).fill(1);
		}

		return this._groundPathTransmittance(
			request,
			{
				origin: groundIntersection.position,
				direction: outgoingDirection,
			},
			groundIntersection.distance,
			undefined,
		);
	}

	/**
	 * Called by J2 ground evaluation to compute direct-source reflected radiance
	 * at one ground intersection. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Source and boundary owners.
	 * @param {GroundIntersection} groundIntersection - Geometry-owned ground intersection.
	 * @param {UnitVector3} outgoingDirection - Direction from ground toward the cache sample.
	 * @param {SpectralBasis} spectralBasis - Requested native spectral basis.
	 * @returns {Float64Array} - Direct reflected radiance at the intersection.
	 */
	_directGroundReflectedRadiance(request, groundIntersection, outgoingDirection, spectralBasis) {
		const directLighting = request.lightSource.sampleDirectLighting({spectralBasis});
		const incidenceCosine = Math.max(0, this._dot(groundIntersection.normal, directLighting.directionToLight));
		const reflected = new Float64Array(spectralBasis.channelCount);
		if (incidenceCosine === 0) {
			return reflected;
		}
		const sourcePathLimit = request.lightSource.resolveSourcePathLimit({directLighting});
		const sourceTransmittance = this._groundPathTransmittance(
			request,
			{
				origin: groundIntersection.position,
				direction: directLighting.directionToLight,
			},
			undefined,
			sourcePathLimit,
		);
		const bidirectionalReflectanceValues = request.groundBoundary.evaluateBrdf({
			hit: groundIntersection,
			incomingDirection: directLighting.directionToLight,
			outgoingDirection,
			spectralBasis,
		}).values;

		for (let wavelengthIndex = 0; wavelengthIndex < reflected.length; wavelengthIndex += 1) {
			reflected[wavelengthIndex] =
				directLighting.sourceIrradiance.values[wavelengthIndex] *
				sourceTransmittance[wavelengthIndex] *
				incidenceCosine *
				bidirectionalReflectanceValues[wavelengthIndex];
		}

		return reflected;
	}

	/**
	 * Called by indirect ground evaluation to read one exact-direction spectrum
	 * through a geometry-owned position stencil.
	 *
	 * @param {CpuDirectionalSpectralFieldReader} reader - Pure L(k-2) field reader.
	 * @param {ScatteringCachePositionStencil} positionStencil - Physical position interpolation stencil.
	 * @param {number} directionIndex - Exact quadrature direction index.
	 * @param {number} channelCount - Spectral channel count.
	 * @returns {Float64Array} - Interpolated pure-radiance spectrum.
	 */
	_readGroundIllumination(reader, positionStencil, directionIndex, channelCount) {
		const radiance = new Float64Array(channelCount);
		for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
			const positionIndex = positionStencil.indices[positionTap];
			const positionWeight = positionStencil.weights[positionTap];
			for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
				radiance[wavelengthIndex] +=
					reader.readScalar({
						directionIndex,
						positionIndex,
						wavelengthIndex,
					}) * positionWeight;
			}
		}

		return radiance;
	}

	/**
	 * Called by higher-order ground evaluation to integrate pure L(k-2)
	 * illumination into reflected radiance at one ground intersection.
	 *
	 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Geometry and boundary owners.
	 * @param {CpuDirectionalSpectralFieldReader} illuminationReader - Pure L(k-2) field reader.
	 * @param {GroundIntersection} groundIntersection - Geometry-owned ground intersection.
	 * @param {UnitVector3} outgoingDirection - Direction from ground toward the cache sample.
	 * @param {readonly UnitVector3[]} physicalIncomingDirections - Physical quadrature directions.
	 * @param {number} incomingDirectionCount - Quadrature direction count.
	 * @param {readonly number[]} angularWeightsSteradians - Executable angular weights.
	 * @param {SpectralBasis} spectralBasis - Requested native spectral basis.
	 * @returns {Float64Array} - Indirectly reflected radiance at the intersection.
	 */
	_indirectGroundReflectedRadiance(
		request,
		illuminationReader,
		groundIntersection,
		outgoingDirection,
		physicalIncomingDirections,
		incomingDirectionCount,
		angularWeightsSteradians,
		spectralBasis,
	) {
		const atmosphereCoordinate = request.geometry.resolveAtmosphereCoordinate(groundIntersection.position);
		const positionStencil = request.geometry.resolveScatteringCacheConstructionPositionStencil({
			position: groundIntersection.position,
			atmosphereCoordinate,
		});
		const reflected = new Float64Array(spectralBasis.channelCount);

		for (let directionIndex = 0; directionIndex < incomingDirectionCount; directionIndex += 1) {
			const incomingDirection = physicalIncomingDirections[directionIndex];
			const incidenceCosine = Math.max(0, this._dot(groundIntersection.normal, incomingDirection));
			if (incidenceCosine === 0) {
				continue;
			}
			const radiance = this._readGroundIllumination(
				illuminationReader,
				positionStencil,
				directionIndex,
				spectralBasis.channelCount,
			);
			const bidirectionalReflectanceValues = request.groundBoundary.evaluateBrdf({
				hit: groundIntersection,
				incomingDirection,
				outgoingDirection,
				spectralBasis,
			}).values;
			const angularWeightSteradians = angularWeightsSteradians[directionIndex];

			for (let wavelengthIndex = 0; wavelengthIndex < reflected.length; wavelengthIndex += 1) {
				reflected[wavelengthIndex] +=
					radiance[wavelengthIndex] *
					bidirectionalReflectanceValues[wavelengthIndex] *
					incidenceCosine *
					angularWeightSteradians;
			}
		}

		return reflected;
	}

	/**
	 * Called by reflective kernel construction to create the captured ground
	 * contribution injected before phase scattering. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Selected order and physical owners.
	 * @param {DistantSunConstructionDomainSelection} domainSelection - Executable field domains.
	 * @returns {LaterOrderIncomingRadianceContributor} - Captured ground-radiance contributor.
	 */
	_createGroundIncomingRadianceContributor(request, domainSelection) {
		const illuminationReader = this._groundIlluminationReader(request);

		return (
			/**
			 * Called by create ground incoming radiance contributor to handle one invocation of the declared operation.
			 * @param input1 - The destructured input accepted by the operation.
			 */ ({position, spectralBasis, incomingDirectionCount, physicalIncomingDirections, incomingRadiance}) => {
				for (let directionIndex = 0; directionIndex < incomingDirectionCount; directionIndex += 1) {
					const incomingDirection = physicalIncomingDirections[directionIndex];
					const groundIntersection = request.geometry.resolveGroundIntersection({
						origin: position,
						direction: incomingDirection,
					});
					if (groundIntersection === null) {
						continue;
					}
					const outgoingDirection = /** @type {UnitVector3} */ ([
						-incomingDirection[0],
						-incomingDirection[1],
						-incomingDirection[2],
					]);
					const reflected =
						request.scatteringOrder === 2
							? this._directGroundReflectedRadiance(
									request,
									groundIntersection,
									outgoingDirection,
									spectralBasis,
								)
							: this._indirectGroundReflectedRadiance(
									request,
									/** @type {CpuDirectionalSpectralFieldReader} */ (illuminationReader),
									groundIntersection,
									outgoingDirection,
									physicalIncomingDirections,
									incomingDirectionCount,
									domainSelection.incomingIntegrationWeights.values,
									spectralBasis,
								);
					const returnTransmittance = this._groundToPositionTransmittance(
						request,
						groundIntersection,
						outgoingDirection,
						spectralBasis.channelCount,
					);

					for (let wavelengthIndex = 0; wavelengthIndex < spectralBasis.channelCount; wavelengthIndex += 1) {
						incomingRadiance[directionIndex][wavelengthIndex] +=
							reflected[wavelengthIndex] * returnTransmittance[wavelengthIndex];
					}
				}
			}
		);
	}

	/**
	 * Call this method to create the configured distant-Sun physical later-order
	 * scattering kernel with precomputed position/direction resolvers and the
	 * optional captured ground contribution. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {DistantSunCpuLaterOrderKernelEvaluationRequest} request - Later-order physical collaborators.
	 * @returns {ScatteringOrderKernel} - Synchronous physical scattering kernel.
	 */
	createLaterOrderScatteringKernel(request) {
		const accepted = this._assertAdapterRequest(request);
		const physicalDirectionResolvers = this._createPhysicalDirectionResolvers(
			accepted.request.geometry,
			accepted.domainSelection,
		);
		const contributeIncomingRadiance =
			accepted.request.groundBoundary == null
				? undefined
				: this._createGroundIncomingRadianceContributor(
						/** @type {DistantSunReflectiveGroundScatteringKernelRequest} */ (
							/** @type {unknown} */ (accepted.request)
						),
						accepted.domainSelection,
					);

		return createPhysicalLaterOrderScatteringKernel({
			geometry: accepted.request.geometry,
			atmosphere: accepted.request.atmosphere,
			calculator: accepted.request.calculator,
			scatteringOrder: accepted.request.scatteringOrder,
			positionNodes: accepted.domainSelection.positionNodes,
			positionCount: accepted.domainSelection.positionCount,
			incomingUnitVectors: accepted.domainSelection.incomingUnitVectors,
			incomingDirectionCount: accepted.domainSelection.incomingDirectionCount,
			incomingIntegrationWeights: accepted.domainSelection.incomingIntegrationWeights,
			outgoingUnitVectors: accepted.domainSelection.outgoingUnitVectors,
			outgoingDirectionCount: accepted.domainSelection.outgoingDirectionCount,
			spectralBasis: accepted.domainSelection.spectralBasis,
			spectralChannelCount: accepted.domainSelection.spectralChannelCount,
			resolvePhysicalPosition: this._createPhysicalPositionResolver(
				accepted.request.geometry,
				accepted.domainSelection,
			),
			resolvePhysicalIncomingDirection: physicalDirectionResolvers.incoming,
			resolvePhysicalOutgoingDirection: physicalDirectionResolvers.outgoing,
			onProgress: accepted.request.onProgress,
			...(contributeIncomingRadiance === undefined ? {} : {contributeIncomingRadiance}),
		});
	}

	/**
	 * Called by stored-field transport to resolve one native-altitude cache
	 * coordinate in the distant source's executable domains.
	 *
	 * @param {PureScatteringDensityBuildCoordinateRequest} request - Logical transport coordinate.
	 * @param {DistantSunConstructionDomainSelection} domainSelection - Executable source domains.
	 * @returns {CacheBuildCoordinate} - Native construction coordinate.
	 */
	_resolveDistantSunBuildCoordinate(request, domainSelection) {
		return {
			coordinateKey:
				`native-${domainSelection.positionCount}` +
				`-fibonacci-${domainSelection.incomingDirectionCount}` +
				`:${request.positionIndex}:${request.directionIndex}`,
			coordinates: [request.positionIndex, request.directionIndex],
			altitudeBinIndex: request.positionIndex,
			directionIndex: request.directionIndex,
			altitude: request.positionNode.coordinate,
			incomingDirection: request.incomingDirection,
		};
	}

	/**
	 * Called by stored-field transport to resolve source-owned executable facts
	 * before output allocation. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {DistantSunScatteringDensityTransportRequest} request - Stored-field transport request.
	 * @returns {DistantSunCpuTransportInputs} - Accepted transport allocation facts.
	 */
	_normalizeTransportRequest(request) {
		const domainSelection = request.domainSelection;

		return {
			scatteringDensity: request.scatteringDensity,
			order: request.scatteringOrder,
			id:
				request.id === undefined
					? `algorithm32-distant-sun-cpu-pure-l${request.scatteringOrder}-stored-transport-v1`
					: request.id,
			domainSelection,
			transportIntervalCount: request.transportIntervalCount,
		};
	}

	/**
	 * Call this method to allocate and build one distant-Sun pure Lk field through
	 * the selected stored-field transport operation. The physical radiance-
	 * direction callback is inlined because it has no independent construction
	 * lifecycle or precomputed state.
	 *
	 * @param {DistantSunScatteringDensityTransportRequest} request - Accepted transport collaborators and pure Jk.
	 * @returns {CpuDirectionalSpectralFieldContract} - Sealed pure Lk field.
	 */
	buildTransportedRadiance(request) {
		const {scatteringDensity, order, id, domainSelection, transportIntervalCount} =
			this._normalizeTransportRequest(request);
		const outputRadiance = this._fieldAllocators.createPureRadianceField({
			id,
			order,
			provenanceIdentity: ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY,
			domainSelection,
		});

		return transportPureScatteringDensity({
			scatteringDensity,
			outputRadiance,
			geometry: request.geometry,
			atmosphere: request.atmosphere,
			calculator: request.calculator,
			scatteringOrder: order,
			positionNodes: domainSelection.positionNodes,
			positionCount: domainSelection.positionCount,
			radianceUnitVectors: domainSelection.incomingUnitVectors,
			radianceDirectionCount: domainSelection.incomingDirectionCount,
			spectralChannelCount: domainSelection.spectralChannelCount,
			/**
			 * Called by build transported radiance to resolve position stencil.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolvePositionStencil: ({position, atmosphereCoordinate}) =>
				request.geometry.resolveScatteringCacheConstructionPositionStencil({
					position,
					atmosphereCoordinate,
				}),
			/**
			 * Called by build transported radiance to resolve direction stencil.
			 * @param direction - The direction value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolveDirectionStencil: (direction) => domainSelection.resolveOutgoingDirectionStencil(direction),
			/**
			 * Called by build transported radiance to resolve build coordinate.
			 * @param coordinateRequest - The coordinate request value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolveBuildCoordinate: (coordinateRequest) =>
				this._resolveDistantSunBuildCoordinate(coordinateRequest, domainSelection),
			/**
			 * Called by build transported radiance to resolve physical radiance direction.
			 * @param directionRequest - The direction request value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolvePhysicalRadianceDirection: (directionRequest) =>
				request.geometry.expressPhysicalIncomingRadianceDirection(directionRequest.cacheDirection),
			pathIntervalCount: transportIntervalCount,
			onProgress: request.onProgress,
		});
	}
}
