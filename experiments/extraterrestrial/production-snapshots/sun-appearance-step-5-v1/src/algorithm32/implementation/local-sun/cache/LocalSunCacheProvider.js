import {ScatteringOrderFieldOperations} from '../../../atmospheric-transport/ScatteringOrderFieldOperations.js';
import {createPhysicalLaterOrderScatteringKernel} from '../../../atmospheric-transport/later-order-scattering-density.js';
import {transportPureScatteringDensity} from '../../../atmospheric-transport/scattering-density-transport.js';
import {ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY} from '../../../atmospheric-transport/consts.js';
import {CanonicalValueHash} from '../../../value-identity/CanonicalValueHash.js';
import DistanceMath from '../../../math/DistanceMath.js';
import LocalSunConstructionDomainSelection from './LocalSunConstructionDomainSelection.js';
import LocalSunConstructionLightSource from './LocalSunConstructionLightSource.js';
import LocalSunCpuFields from './LocalSunCpuFields.js';
import {LocalSunCacheController} from './LocalSunCacheController.js';
import {LocalSunCacheSource} from './LocalSunCacheSource.js';
import {LocalSunShellFactCache} from './LocalSunShellFactCache.js';
import {SpectralCalculator} from '../../../atmospheric-transport/spectral/SpectralCalculator.js';
import {
	LOCAL_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY,
	LOCAL_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY,
	LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY,
} from './consts.js';
import {assertLocalSunGeometryPairing} from '../local-sun-geometry-pairing.js';

/**
 * Cache construction and attachment provider for one finite local Sun.
 */
export class LocalSunCacheProvider {
	/**
	 * Physical local-Sun facade retained for dynamic dispatch.
	 * @type {LocalSunCacheProviderSource}
	 */
	_source;
	/**
	 * Normalized physical source configuration retained by reference.
	 * @type {LocalSunLightSourceConfiguration}
	 */
	_configuration;
	/**
	 * Eager source-owned shell facts shared by construction attachments.
	 * @type {LocalSunShellFactCache}
	 */
	_constructionShellFactCache;
	/**
	 * Eager construction-only shell-held light source.
	 * @type {LocalSunConstructionLightSource}
	 */
	_constructionLightSource;

	/**
	 * Called by LocalSunCacheProvider to distinguish explicit boundaries while
	 * preserving omitted-black field identifiers. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {GroundBoundary | null | undefined} boundary - The selected executable boundary.
	 * @returns {string} - The field-identifier suffix.
	 */
	_boundaryFieldIdentitySuffix(boundary) {
		if (boundary == null) {
			return '';
		}

		return `-ground-${CanonicalValueHash.sha256Value({
			id: boundary.id,
			model: boundary.model,
			albedoContentHash: boundary.albedo.contentHash,
		})}`;
	}

	/**
	 * Called by LocalSunCacheProvider to express the accepted CPU graph options
	 * without restoring order-specific constant packets.
	 *
	 * @param {SupportedCacheScatteringOrder} order - The completed maximum order.
	 * @param {number} transportIntervalCount - The accepted transport interval count.
	 * @returns {CacheConstructionOptions} - The completed construction options.
	 */
	_optionsFor(order, transportIntervalCount) {
		return {
			transportIntervalCount,
			maximumScatteringOrder: order,
		};
	}

	/**
	 * Called by LocalSunCacheProvider to build the finite local Sun's continuous
	 * direct-primary L1 field. Every path sample uses the continuous-source
	 * calculator; this operation never reads shell facts or stored J1.
	 *
	 * @param {LocalSunPrimaryRadianceBuildRequest} request - The physical owners and incoming domain.
	 * @returns {CpuDirectionalSpectralFieldContract} - The sealed pure L1 field.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_buildPrimaryRadiance(request) {
		const domainSelection = request.domainSelection;
		const field = LocalSunCpuFields.createPureRadiance({
			id: request.id ?? 'algorithm32-local-sun-cpu-pure-l1-direct-v2',
			order: 1,
			provenanceIdentity: request.provenanceIdentity ?? LOCAL_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY,
			domainSelection,
		});
		const writer = field.createWriter();
		const pathIntervalCount = /** @type {number} */ (request.pathIntervalCount);
		writer.fill(0);

		try {
			for (const node of domainSelection.positionNodes) {
				const position = /** @type {Position} */ (node.metadata.position);

				for (
					let directionIndex = 0;
					directionIndex < domainSelection.incomingDirectionCount;
					directionIndex += 1
				) {
					const incomingDirection = request.geometry.expressPhysicalScatteringCacheDirection({
						position,
						cacheDirection: domainSelection.incomingUnitVectors[directionIndex],
					});
					const raySegment = request.geometry.resolveCacheBuildRay({
						coordinateKey:
							`local-z${domainSelection.zCount}` +
							`-rho${domainSelection.rhoCount}` +
							`-fibonacci${domainSelection.incomingDirectionCount}` +
							`:${node.index}:${directionIndex}`,
						coordinates: [node.index, directionIndex],
						zBinIndex: /** @type {number} */ (node.metadata.zIndex),
						rhoBinIndex: /** @type {number} */ (node.metadata.rhoIndex),
						altitude: /** @type {Distance} */ (node.metadata.z),
						rho: /** @type {Distance} */ (node.metadata.rho),
						incomingDirection,
						directionIndex,
						metadata: {
							position,
							positionIndex: node.index,
						},
					});
					const path = request.calculator.buildEndpointTrapezoidPathIntegrationPoints(
						raySegment,
						pathIntervalCount,
					);
					const radiance = request.calculator.computeDirectRadiance(raySegment, path).pathRadiance.values;

					for (
						let wavelengthIndex = 0;
						wavelengthIndex < domainSelection.radiancePacking.wavelengthCount;
						wavelengthIndex += 1
					) {
						writer.writeScalar(
							{
								directionIndex,
								positionIndex: node.index,
								wavelengthIndex,
							},
							radiance[wavelengthIndex],
						);
					}
				}

				request.onProgress?.({
					phase: 'transport',
					order: 1,
					completed: node.index + 1,
					total: domainSelection.positionNodes.length,
				});
			}

			field.seal();
			return field;
		} catch (error) {
			if (!field.isSealed) {
				writer.fill(0);
			}
			throw error;
		}
	}

	/**
	 * Called by LocalSunCacheProvider to build the local point Sun's pure
	 * primary scattering-density field with one source sample per position.
	 *
	 * @param {LocalSunPrimaryScatteringDensityBuildRequest} request - The physical owners.
	 * @returns {CpuDirectionalSpectralFieldContract} - The sealed pure J1 field.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_buildPrimaryScatteringDensity(request) {
		const domainSelection = request.domainSelection;
		const field = LocalSunCpuFields.createPureScatteringDensity({
			id: request.id ?? 'algorithm32-local-sun-cpu-pure-j1-v1',
			order: 1,
			provenanceIdentity: request.provenanceIdentity ?? LOCAL_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY,
			domainSelection,
		});
		const writer = field.createWriter();
		writer.fill(0);

		try {
			for (const node of domainSelection.positionNodes) {
				const position = /** @type {Position} */ (node.metadata.position);
				const atmosphereCoordinate = request.geometry.resolveAtmosphereCoordinate(position);
				const medium = request.atmosphere.sampleMedium(atmosphereCoordinate);
				const sourceRelativePosition = request.geometry.resolveSourceRelativePosition({
					position,
					atmosphereCoordinate,
				});
				const directLighting = request.lightSource.sampleDirectLighting({
					sourceRelativePosition,
					spectralBasis: request.spectralBasis,
				});
				const sourcePathLimit = request.lightSource.resolveSourcePathLimit({
					sourceRelativePosition,
					directLighting,
				});
				const sourcePath = request.geometry.resolveAtmospherePath({
					ray: {
						origin: position,
						direction: directLighting.directionToLight,
					},
					sourcePathLimit,
					sampleCount: request.sourceTransmittanceIntervalCount,
				});
				const sourceTransmittance = sourcePath.blockedByGround
					? new Float64Array(domainSelection.spectralChannelCount)
					: request.atmosphere.integrateOpticalDepth(sourcePath).transmittance.values;

				for (
					let directionIndex = 0;
					directionIndex < domainSelection.outgoingDirectionCount;
					directionIndex += 1
				) {
					const physicalOutgoingDirection = request.geometry.expressPhysicalScatteringCacheDirection({
						position,
						cacheDirection: domainSelection.outgoingUnitVectors[directionIndex],
					});
					const phase = request.atmosphere.samplePhase({
						viewDirection: physicalOutgoingDirection,
						incomingDirection: directLighting.directionToLight,
					});

					for (
						let wavelengthIndex = 0;
						wavelengthIndex < domainSelection.spectralChannelCount;
						wavelengthIndex += 1
					) {
						const scatteringPerMeter =
							medium.rayleighScattering.values[wavelengthIndex] * phase.rayleighPhase.value +
							medium.mieScattering.values[wavelengthIndex] * phase.miePhase.value;
						writer.writeScalar(
							{
								directionIndex,
								positionIndex: node.index,
								wavelengthIndex,
							},
							directLighting.sourceIrradiance.values[wavelengthIndex] *
								sourceTransmittance[wavelengthIndex] *
								scatteringPerMeter,
						);
					}
				}
				request.onProgress?.({
					phase: 'primary-scattering',
					order: 1,
					completed: node.index + 1,
					total: domainSelection.positionNodes.length,
				});
			}

			field.seal();
			return field;
		} catch (error) {
			if (!field.isSealed) {
				writer.fill(0);
			}
			throw error;
		}
	}

	/**
	 * Called by LocalSunCacheProvider to build one pure L2 or L3 field by
	 * transporting a stored pure scattering-density field.
	 *
	 * @param {LocalSunScatteringDensityTransportRequest} request - The stored field and physical owners.
	 * @returns {CpuDirectionalSpectralFieldContract} - The sealed pure radiance field.
	 */
	_buildTransportedRadiance(request) {
		const order = request.scatteringOrder;
		const domainSelection = request.domainSelection;
		const outputRadiance = LocalSunCpuFields.createPureRadiance({
			id: request.id ?? `algorithm32-local-sun-cpu-pure-l${order}-stored-transport-v1`,
			order,
			provenanceIdentity: ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY,
			domainSelection,
		});

		return transportPureScatteringDensity({
			scatteringDensity: request.scatteringDensity,
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
					positionAxes: domainSelection,
				}),
			/**
			 * Called by build transported radiance to resolve direction stencil.
			 * @param direction - The direction value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolveDirectionStencil: (direction) => domainSelection.resolveOutgoingDirectionStencil(direction),
			/**
			 * Called by build transported radiance to resolve build coordinate.
			 * @param coordinate - The coordinate value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolveBuildCoordinate: (coordinate) => ({
				coordinateKey:
					`local-z${domainSelection.zCount}` +
					`-rho${domainSelection.rhoCount}` +
					`-fibonacci${domainSelection.incomingDirectionCount}` +
					`:${coordinate.positionIndex}:${coordinate.directionIndex}`,
				coordinates: [coordinate.positionIndex, coordinate.directionIndex],
				zBinIndex: /** @type {number} */ (coordinate.positionNode.metadata.zIndex),
				rhoBinIndex: /** @type {number} */ (coordinate.positionNode.metadata.rhoIndex),
				altitude: /** @type {Distance} */ (coordinate.positionNode.metadata.z),
				rho: /** @type {Distance} */ (coordinate.positionNode.metadata.rho),
				incomingDirection: coordinate.incomingDirection,
				directionIndex: coordinate.directionIndex,
				metadata: {
					position: coordinate.positionNode.metadata.position,
					positionIndex: coordinate.positionIndex,
				},
			}),
			/**
			 * Called by build transported radiance to resolve physical radiance direction.
			 * @param coordinate - The coordinate value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolvePhysicalRadianceDirection: (coordinate) =>
				request.geometry.expressPhysicalScatteringCacheDirection({
					position: /** @type {Position} */ (coordinate.positionNode.metadata.position),
					cacheDirection: coordinate.cacheDirection,
				}),
			pathIntervalCount: /** @type {number} */ (request.pathIntervalCount),
			onProgress: request.onProgress,
		});
	}

	/**
	 * Called by LocalSunCacheProvider to read one exact incoming-direction
	 * spectrum across a position stencil.
	 *
	 * @param {CpuDirectionalSpectralFieldReader} reader - The radiance field reader.
	 * @param {ScatteringCachePositionStencil} positionStencil - The position taps.
	 * @param {number} directionIndex - The incoming direction index.
	 * @param {number} channelCount - The spectral channel count.
	 * @returns {Float64Array} - The interpolated spectrum.
	 */
	_readGroundIllumination(reader, positionStencil, directionIndex, channelCount) {
		const radiance = new Float64Array(channelCount);
		for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
			for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
				radiance[wavelengthIndex] +=
					reader.readScalar({
						directionIndex,
						positionIndex: positionStencil.indices[positionTap],
						wavelengthIndex,
					}) * positionStencil.weights[positionTap];
			}
		}

		return radiance;
	}

	/**
	 * Called by LocalSunCacheProvider to integrate one ground-owned atmosphere path. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - The reflection owners.
	 * @param {Ray} groundPathRay - The ground-owned ray.
	 * @param {Distance | undefined} endDistance - The optional end distance.
	 * @param {SourcePathLimit | undefined} sourcePathLimit - The optional source bound.
	 * @returns {readonly number[]} - The spectral transmittance.
	 */
	_groundPathTransmittance(request, groundPathRay, endDistance, sourcePathLimit) {
		const path = request.geometry.resolveAtmospherePath({
			ray: groundPathRay,
			...(endDistance === undefined ? {} : {endDistance}),
			...(sourcePathLimit === undefined ? {} : {sourcePathLimit}),
			sampleCount: request.sourceTransmittanceIntervalCount,
		});

		if (path.blockedByGround) {
			return Array(request.domainSelection.scatteringDensityPacking.wavelengthCount).fill(0);
		}

		return request.atmosphere.integrateOpticalDepth(path).transmittance.values;
	}

	/**
	 * Called by LocalSunCacheProvider to resolve exact ground-contact or
	 * transported return transmittance.
	 *
	 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - The reflection owners.
	 * @param {GroundIntersection} groundIntersection - The ground intersection.
	 * @param {UnitVector3} outgoingDirection - The ground-to-sample direction.
	 * @param {number} channelCount - The spectral channel count.
	 * @returns {readonly number[]} - The spectral transmittance.
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
	 * Called by LocalSunCacheProvider to return one three-vector dot product.
	 *
	 * @param {UnitVector3} left - The left direction.
	 * @param {UnitVector3} right - The right direction.
	 * @returns {number} - The dot product.
	 */
	_dot(left, right) {
		return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
	}

	/**
	 * Called by LocalSunCacheProvider to evaluate direct local-source reflection
	 * at one ground intersection. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - The reflection owners.
	 * @param {GroundIntersection} groundIntersection - The ground intersection.
	 * @param {UnitVector3} outgoingDirection - The ground-to-sample direction.
	 * @param {SpectralBasis} spectralBasis - The selected spectral basis.
	 * @returns {Float64Array} - The reflected radiance.
	 */
	_directGroundReflectedRadiance(request, groundIntersection, outgoingDirection, spectralBasis) {
		const atmosphereCoordinate = request.geometry.resolveAtmosphereCoordinate(groundIntersection.position);
		const sourceRelativePosition = request.geometry.resolveSourceRelativePosition({
			position: groundIntersection.position,
			atmosphereCoordinate,
		});
		const directLighting = request.lightSource.sampleDirectLighting({
			sourceRelativePosition,
			spectralBasis,
		});
		const incidenceCosine = Math.max(0, this._dot(groundIntersection.normal, directLighting.directionToLight));
		const reflected = new Float64Array(spectralBasis.channelCount);
		if (incidenceCosine === 0) {
			return reflected;
		}
		const sourcePathLimit = request.lightSource.resolveSourcePathLimit({
			sourceRelativePosition,
			directLighting,
		});
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
	 * Called by LocalSunCacheProvider to integrate pure L(k-2) illumination into
	 * one ground reflection.
	 *
	 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - The reflection owners.
	 * @param {CpuDirectionalSpectralFieldReader} reader - The pure L(k-2) reader.
	 * @param {GroundIntersection} groundIntersection - The ground intersection.
	 * @param {UnitVector3} outgoingDirection - The ground-to-sample direction.
	 * @param {SpectralBasis} spectralBasis - The selected spectral basis.
	 * @returns {Float64Array} - The reflected radiance.
	 */
	_indirectGroundReflectedRadiance(request, reader, groundIntersection, outgoingDirection, spectralBasis) {
		const atmosphereCoordinate = request.geometry.resolveAtmosphereCoordinate(groundIntersection.position);
		const positionStencil = request.geometry.resolveScatteringCacheConstructionPositionStencil({
			position: groundIntersection.position,
			atmosphereCoordinate,
			positionAxes: request.domainSelection,
		});
		const physicalIncomingDirections = request.domainSelection.incomingUnitVectors.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param cacheDirection - The cache direction value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (cacheDirection) =>
				request.geometry.expressPhysicalScatteringCacheDirection({
					position: groundIntersection.position,
					cacheDirection,
				}),
		);
		const weights = request.domainSelection.incomingIntegrationWeights.values;
		const reflected = new Float64Array(spectralBasis.channelCount);

		for (let directionIndex = 0; directionIndex < physicalIncomingDirections.length; directionIndex += 1) {
			const incomingDirection = physicalIncomingDirections[directionIndex];
			const incidenceCosine = Math.max(0, this._dot(groundIntersection.normal, incomingDirection));
			if (incidenceCosine === 0) {
				continue;
			}
			const radiance = this._readGroundIllumination(
				reader,
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

			for (let wavelengthIndex = 0; wavelengthIndex < reflected.length; wavelengthIndex += 1) {
				reflected[wavelengthIndex] +=
					radiance[wavelengthIndex] *
					bidirectionalReflectanceValues[wavelengthIndex] *
					incidenceCosine *
					weights[directionIndex];
			}
		}

		return reflected;
	}

	/**
	 * Called by LocalSunCacheProvider to create the inherited direct-J2 or pure
	 * L(k-2) ground-radiance contribution.
	 *
	 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - The reflection owners.
	 * @returns {LaterOrderIncomingRadianceContributor} - The incoming-radiance contributor.
	 */
	_createGroundIncomingRadianceContributor(request) {
		const illuminationReader =
			request.scatteringOrder === 2 ? null : request.groundIlluminationRadiance.createReader();

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
	 * Called by LocalSunCacheProvider to create the local-Sun adapter for the
	 * shared pure L(k-1)-to-Jk scattering kernel. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {LocalSunLaterOrderScatteringKernelRequest} request - The physical owners.
	 * @returns {ScatteringOrderKernel} - The synchronous pure-order kernel.
	 */
	_createLaterOrderScatteringKernel(request) {
		const contributeIncomingRadiance =
			request.groundBoundary == null ? undefined : this._createGroundIncomingRadianceContributor(request);

		return createPhysicalLaterOrderScatteringKernel({
			geometry: request.geometry,
			atmosphere: request.atmosphere,
			calculator: request.calculator,
			scatteringOrder: request.scatteringOrder,
			positionNodes: request.domainSelection.positionNodes,
			positionCount: request.domainSelection.positionCount,
			incomingUnitVectors: request.domainSelection.incomingUnitVectors,
			incomingDirectionCount: request.domainSelection.incomingDirectionCount,
			incomingIntegrationWeights: request.domainSelection.incomingIntegrationWeights,
			outgoingUnitVectors: request.domainSelection.outgoingUnitVectors,
			outgoingDirectionCount: request.domainSelection.outgoingDirectionCount,
			spectralBasis: request.domainSelection.spectralBasis,
			spectralChannelCount: request.domainSelection.spectralChannelCount,
			/**
			 * Called by create later order scattering kernel to resolve physical position.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolvePhysicalPosition: ({positionNode}) => /** @type {Position} */ (positionNode.metadata.position),
			/**
			 * Called by create later order scattering kernel to resolve physical incoming direction.
			 * @param directionRequest - The direction request value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolvePhysicalIncomingDirection: (directionRequest) =>
				request.geometry.expressPhysicalScatteringCacheDirection({
					position: directionRequest.position,
					cacheDirection: directionRequest.cacheDirection,
				}),
			/**
			 * Called by create later order scattering kernel to resolve physical outgoing direction.
			 * @param directionRequest - The direction request value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ resolvePhysicalOutgoingDirection: (directionRequest) =>
				request.geometry.expressPhysicalScatteringCacheDirection({
					position: directionRequest.position,
					cacheDirection: directionRequest.cacheDirection,
				}),
			onProgress: request.onProgress,
			...(contributeIncomingRadiance === undefined ? {} : {contributeIncomingRadiance}),
		});
	}

	/**
	 * Called by LocalSunCacheProvider to bind the unchanged pure-order operations to this local source.
	 *
	 * @param {LocalSunCpuRecurrenceContext} context - The physical recurrence owners.
	 * @returns {LocalSunCpuCacheOperations} - The recurrence operations.
	 */
	_createCpuRecurrenceOperations(context) {
		return {
			/**
			 * Called by create cpu recurrence operations to create scattering kernel.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ createScatteringKernel: ({scatteringOrder, groundIlluminationRadiance}) =>
				this._createLaterOrderScatteringKernel({
					geometry: context.request.geometry,
					atmosphere: context.request.atmosphere,
					calculator: context.calculator,
					domainSelection: context.domainSelection,
					scatteringOrder,
					groundIlluminationRadiance,
					groundBoundary: context.request.groundBoundary ?? null,
					lightSource: this._source,
					sourceTransmittanceIntervalCount: context.sourceTransmittanceIntervalCount,
					onProgress: context.request.onProgress,
				}),
			/**
			 * Called by create cpu recurrence operations to build transported radiance.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ buildTransportedRadiance: ({scatteringDensity, scatteringOrder, id}) =>
				this._buildTransportedRadiance({
					scatteringDensity,
					scatteringOrder,
					geometry: context.request.geometry,
					atmosphere: context.request.atmosphere,
					calculator: context.calculator,
					domainSelection: context.domainSelection,
					pathIntervalCount: context.transportIntervalCount,
					id,
					onProgress: context.request.onProgress,
				}),
			scatteringProvenanceIdentity: LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY,
		};
	}

	/**
	 * Called by LocalSunCacheProvider to construct the local-Sun binary64
	 * recurrence through the profile-selected order. Continuous direct L1 remains
	 * independent of shell-held J1, and only pure fields feed recurrence.
	 *
	 * @param {LocalSunCpuCacheBuildRequest} request - The accepted physical owners and operations.
	 * @returns {LocalSunCpuCacheResult} - The completed nonresident result.
	 */
	_buildCpuCache(request) {
		const maximumScatteringOrder = request.maximumScatteringOrder;
		const boundarySuffix = this._boundaryFieldIdentitySuffix(request.groundBoundary);
		const primaryScatteringDensity = this._buildPrimaryScatteringDensity({
			...request,
			id: `algorithm32-local-sun-cpu-pure-j1-v1${boundarySuffix}`,
		});
		const pureScatteringDensityByOrder = [primaryScatteringDensity];
		const pureRadianceByOrder = [];

		if (maximumScatteringOrder > 1) {
			let previousRadiance = this._buildPrimaryRadiance({
				geometry: request.geometry,
				calculator: request.calculator,
				domainSelection: request.domainSelection,
				pathIntervalCount: request.transportIntervalCount,
				id: `algorithm32-local-sun-cpu-pure-l1-direct-v2${boundarySuffix}`,
				onProgress: request.onProgress,
			});
			pureRadianceByOrder.push(previousRadiance);

			for (let scatteringOrder = 2; scatteringOrder <= maximumScatteringOrder; scatteringOrder += 1) {
				const outputScattering = LocalSunCpuFields.createPureScatteringDensity({
					id: `algorithm32-local-sun-cpu-pure-j${scatteringOrder}-v1${boundarySuffix}`,
					order: scatteringOrder,
					provenanceIdentity: request.operations.scatteringProvenanceIdentity,
					domainSelection: request.domainSelection,
				});
				const pureScatteringDensity = ScatteringOrderFieldOperations.buildNextScatteringOrder({
					previousRadiance,
					outputScattering,
					kernel: request.operations.createScatteringKernel({
						scatteringOrder: /** @type {2 | 3 | 4 | 5} */ (scatteringOrder),
						groundIlluminationRadiance:
							scatteringOrder < 3 ? null : pureRadianceByOrder[scatteringOrder - 3],
					}),
				});
				pureScatteringDensityByOrder.push(pureScatteringDensity);

				if (scatteringOrder < maximumScatteringOrder) {
					previousRadiance = request.operations.buildTransportedRadiance({
						scatteringDensity: pureScatteringDensity,
						scatteringOrder: /** @type {2 | 3 | 4} */ (scatteringOrder),
						id: `algorithm32-local-sun-cpu-pure-l${scatteringOrder}-v1${boundarySuffix}`,
					});
					pureRadianceByOrder.push(previousRadiance);
				}
			}
		}

		const cumulativeScatteringDensity = LocalSunCpuFields.createCumulativeScatteringDensity({
			id: `algorithm32-local-sun-cpu-j-through-${maximumScatteringOrder}-v1${boundarySuffix}`,
			cumulativeThroughOrder: maximumScatteringOrder,
			provenanceIdentity: `algorithm32-local-sun-cpu-recurrence-through-${maximumScatteringOrder}-v1${boundarySuffix}`,
			domainSelection: request.domainSelection,
		});
		request.onProgress?.({
			phase: 'accumulation',
			order: maximumScatteringOrder,
			completed: 0,
			total: cumulativeScatteringDensity.scalarCount,
		});
		ScatteringOrderFieldOperations.accumulatePureScatteringFields({
			pureFields: pureScatteringDensityByOrder,
			cumulativeField: cumulativeScatteringDensity,
			packing: request.domainSelection.scatteringDensityPacking,
		});
		request.onProgress?.({
			phase: 'accumulation',
			order: maximumScatteringOrder,
			completed: cumulativeScatteringDensity.scalarCount,
			total: cumulativeScatteringDensity.scalarCount,
		});

		return /** @type {LocalSunCpuCacheResult} */ ({
			maximumScatteringOrder,
			domainSelection: request.domainSelection,
			pureScatteringDensityByOrder,
			pureRadianceByOrder,
			cumulativeScatteringDensity,
			options: this._optionsFor(maximumScatteringOrder, request.transportIntervalCount),
		});
	}

	/**
	 * Creates the cache provider and its eager construction-only source state.
	 *
	 * @param {LocalSunCacheProviderDefinition} definition - The physical source and its normalized configuration.
	 */
	constructor({source, configuration}) {
		this._source = source;
		this._configuration = configuration;
		this._constructionShellFactCache = new LocalSunShellFactCache({
			sourceConfiguration: configuration,
		});
		this._constructionLightSource = new LocalSunConstructionLightSource({
			source,
			shellFactCache: this._constructionShellFactCache,
		});
	}

	/**
	 * Call this method to create one local-Sun cache controller for a renderer attachment.
	 *
	 * @param {CacheControllerRequest} request - The backend and scheduler.
	 * @returns {LocalSunCacheController} - The attachment-owned controller.
	 *
	 */
	createCacheController({model, backend, scheduler}) {
		const constructionSource = new LocalSunCacheSource({
			source: this._source,
			shellFactCache: this._constructionShellFactCache,
		});

		return new LocalSunCacheController({
			model,
			source: constructionSource,
			backend,
			scheduler,
		});
	}

	/**
	 * Call this method to build one complete nonresident local-Sun binary64 cache result. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {LocalSunCpuCacheRequest} request - The aggregate model and optional progress observer.
	 * @returns {LocalSunCpuCacheResult} - The completed profile-selected result.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	buildCpuScatteringCache(request) {
		const model = request.model;
		const profile = model.profile;
		const geometry = /** @type {LocalSunCpuCacheGeometry} */ (/** @type {unknown} */ (model.geometry));
		const atmosphere = model.atmosphere;
		assertLocalSunGeometryPairing(this._configuration, geometry.configuration);
		const maximumScatteringOrder = profile.numerical.cacheConstruction.maximumScatteringOrder;
		const domainSelection = LocalSunConstructionDomainSelection.fromProfile(profile);
		const spectralBasis = /** @type {SpectralBasis} */ (profile.spectral.basis);
		const sourceTransmittanceIntervalCount = profile.numerical.sourcePathTransmittance.intervalCount;
		const transportIntervalCount = profile.numerical.cacheConstruction.transportIntervalCount;
		const calculator = new SpectralCalculator({
			model: request.model,
		});
		const executionRequest = {
			...request,
			geometry,
			atmosphere,
			groundBoundary: model.groundBoundary,
			profile,
			spectralBasis,
			maximumScatteringOrder,
			lightSource: this._constructionLightSource,
			calculator,
			domainSelection,
			sourceTransmittanceIntervalCount,
			transportIntervalCount,
		};
		const context = {
			request: executionRequest,
			calculator,
			domainSelection,
			sourceTransmittanceIntervalCount,
			transportIntervalCount,
		};

		return this._buildCpuCache({
			...executionRequest,
			...(maximumScatteringOrder === 1
				? {}
				: {
						operations: this._createCpuRecurrenceOperations(context),
					}),
		});
	}
}
