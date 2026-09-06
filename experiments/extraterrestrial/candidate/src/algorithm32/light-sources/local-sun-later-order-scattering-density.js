import {
	createPhysicalLaterOrderScatteringKernel,
} from '../transport/later-order-scattering-density.js';
import DistanceMath from '../utils/DistanceMath.js';

/**
 * Create the local-Sun adapter for the shared pure L(k-1) to Jk kernel.
 *
 * @param {LocalSunLaterOrderScatteringKernelRequest} request - Supplies physical owners.
 * @returns {ScatteringOrderKernel} The synchronous pure-order kernel.
 */
export function createLocalSunLaterOrderScatteringKernel(request) {
	const contributeIncomingRadiance = request.groundBoundary == null
		? undefined
		: createGroundIncomingRadianceContributor(request);

	return createPhysicalLaterOrderScatteringKernel({
		geometry: request.geometry,
		atmosphere: request.atmosphere,
		calculator: request.calculator,
		scatteringOrder: request.scatteringOrder,
		positionNodes: request.domainSelection.positionNodes,
		positionCount: request.domainSelection.positionCount,
		incomingUnitVectors:
			request.domainSelection.incomingUnitVectors,
		incomingDirectionCount:
			request.domainSelection.incomingDirectionCount,
		incomingIntegrationWeights:
			request.domainSelection.incomingIntegrationWeights,
		outgoingUnitVectors:
			request.domainSelection.outgoingUnitVectors,
		outgoingDirectionCount:
			request.domainSelection.outgoingDirectionCount,
		spectralBasis: request.domainSelection.spectralBasis,
		spectralChannelCount:
			request.domainSelection.spectralChannelCount,
		resolvePhysicalPosition: ({ positionNode }) =>
			/** @type {Position} */ (positionNode.metadata.position),
		resolvePhysicalIncomingDirection: (directionRequest) =>
			request.geometry.expressPhysicalScatteringCacheDirection({
				position: directionRequest.position,
				cacheDirection: directionRequest.cacheDirection,
			}),
		resolvePhysicalOutgoingDirection: (directionRequest) =>
			request.geometry.expressPhysicalScatteringCacheDirection({
				position: directionRequest.position,
				cacheDirection: directionRequest.cacheDirection,
			}),
		onProgress: request.onProgress,
		...(contributeIncomingRadiance === undefined
			? {}
			: { contributeIncomingRadiance }),
	});
}

/**
 * Create the inherited direct-J2 and pure-L(k-2) ground contribution.
 *
 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - Supplies reflection owners.
 * @returns {LaterOrderIncomingRadianceContributor} The contributor.
 */
function createGroundIncomingRadianceContributor(request) {
	const illuminationReader = request.scatteringOrder === 2
		? null
		: request.groundIlluminationRadiance.createReader();

	return ({
		position,
		spectralBasis,
		incomingDirectionCount,
		physicalIncomingDirections,
		incomingRadiance,
	}) => {
		for (let directionIndex = 0;
			directionIndex < incomingDirectionCount;
			directionIndex += 1) {
			const incomingDirection =
				physicalIncomingDirections[directionIndex];
			const hit = request.geometry.resolveGroundIntersection({
				origin: position,
				direction: incomingDirection,
			});
			if (hit === null) {
				continue;
			}
			const outgoingDirection =
				/** @type {UnitVector3} */ ([
					-incomingDirection[0],
					-incomingDirection[1],
					-incomingDirection[2],
				]);
			const reflected = request.scatteringOrder === 2
				? directGroundReflectedRadiance(
					request,
					hit,
					outgoingDirection,
					spectralBasis,
				)
				: indirectGroundReflectedRadiance(
					request,
					/** @type {CpuDirectionalSpectralFieldReader} */ (
						illuminationReader
					),
					hit,
					outgoingDirection,
					spectralBasis,
				);
			const returnTransmittance =
				groundToPositionTransmittance(
					request,
					hit,
					outgoingDirection,
					spectralBasis.channelCount,
				);

			for (let wavelengthIndex = 0;
				wavelengthIndex < spectralBasis.channelCount;
				wavelengthIndex += 1) {
				incomingRadiance[directionIndex][wavelengthIndex]
					+= reflected[wavelengthIndex]
						* returnTransmittance[wavelengthIndex];
			}
		}
	};
}

/**
 * Evaluate direct local-source reflection at one ground hit.
 *
 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - Supplies owners.
 * @param {GroundIntersection} hit - Supplies the ground hit.
 * @param {UnitVector3} outgoingDirection - Supplies ground-to-sample direction.
 * @param {SpectralBasis} spectralBasis - Supplies the spectral basis.
 * @returns {Float64Array} The reflected radiance.
 */
function directGroundReflectedRadiance(
	request,
	hit,
	outgoingDirection,
	spectralBasis,
) {
	const atmosphereCoordinate =
		request.geometry.resolveAtmosphereCoordinate(hit.position);
	const sourceRelativePosition =
		request.geometry.resolveSourceRelativePosition({
			position: hit.position,
			atmosphereCoordinate,
		});
	const directLighting = request.lightSource.sampleDirectLighting({
		sourceRelativePosition,
		spectralBasis,
	});
	const incidenceCosine = Math.max(
		0,
		dot(hit.normal, directLighting.directionToLight),
	);
	const reflected = new Float64Array(spectralBasis.channelCount);
	if (incidenceCosine === 0) {
		return reflected;
	}
	const sourcePathLimit = request.lightSource.resolveSourcePathLimit({
		sourceRelativePosition,
		directLighting,
	});
	const sourceTransmittance = groundPathTransmittance(
		request,
		{
			origin: hit.position,
			direction: directLighting.directionToLight,
		},
		undefined,
		sourcePathLimit,
	);
	const brdf = request.groundBoundary.evaluateBrdf({
		hit,
		incomingDirection: directLighting.directionToLight,
		outgoingDirection,
		spectralBasis,
	}).values;

	for (let wavelengthIndex = 0;
		wavelengthIndex < reflected.length;
		wavelengthIndex += 1) {
		reflected[wavelengthIndex] =
			directLighting.sourceIrradiance.values[wavelengthIndex]
			* sourceTransmittance[wavelengthIndex]
			* incidenceCosine
			* brdf[wavelengthIndex];
	}

	return reflected;
}

/**
 * Integrate pure L(k-2) illumination into one ground reflection.
 *
 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - Supplies owners.
 * @param {CpuDirectionalSpectralFieldReader} reader - Supplies pure L(k-2).
 * @param {GroundIntersection} hit - Supplies the ground hit.
 * @param {UnitVector3} outgoingDirection - Supplies ground-to-sample direction.
 * @param {SpectralBasis} spectralBasis - Supplies the spectral basis.
 * @returns {Float64Array} The reflected radiance.
 */
function indirectGroundReflectedRadiance(
	request,
	reader,
	hit,
	outgoingDirection,
	spectralBasis,
) {
	const atmosphereCoordinate =
		request.geometry.resolveAtmosphereCoordinate(hit.position);
	const positionStencil =
		request.geometry.resolveScatteringCacheConstructionPositionStencil({
			position: hit.position,
			atmosphereCoordinate,
			positionAxes: request.domainSelection,
		});
	const physicalIncomingDirections =
		request.domainSelection.incomingUnitVectors.map(
			(cacheDirection) =>
				request.geometry
					.expressPhysicalScatteringCacheDirection({
						position: hit.position,
						cacheDirection,
					}),
		);
	const weights =
		request.domainSelection.incomingIntegrationWeights.values;
	const reflected = new Float64Array(spectralBasis.channelCount);

	for (let directionIndex = 0;
		directionIndex < physicalIncomingDirections.length;
		directionIndex += 1) {
		const incomingDirection =
			physicalIncomingDirections[directionIndex];
		const incidenceCosine = Math.max(
			0,
			dot(hit.normal, incomingDirection),
		);
		if (incidenceCosine === 0) {
			continue;
		}
		const radiance = readGroundIllumination(
			reader,
			positionStencil,
			directionIndex,
			spectralBasis.channelCount,
		);
		const brdf = request.groundBoundary.evaluateBrdf({
			hit,
			incomingDirection,
			outgoingDirection,
			spectralBasis,
		}).values;

		for (let wavelengthIndex = 0;
			wavelengthIndex < reflected.length;
			wavelengthIndex += 1) {
			reflected[wavelengthIndex] +=
				radiance[wavelengthIndex]
				* brdf[wavelengthIndex]
				* incidenceCosine
				* weights[directionIndex];
		}
	}

	return reflected;
}

/**
 * Read one exact incoming-direction spectrum across a position stencil.
 *
 * @param {CpuDirectionalSpectralFieldReader} reader - Supplies radiance.
 * @param {ScatteringCachePositionStencil} positionStencil - Supplies position taps.
 * @param {number} directionIndex - Supplies the direction index.
 * @param {number} channelCount - Supplies the channel count.
 * @returns {Float64Array} The interpolated spectrum.
 */
function readGroundIllumination(
	reader,
	positionStencil,
	directionIndex,
	channelCount,
) {
	const radiance = new Float64Array(channelCount);
	for (let positionTap = 0;
		positionTap < positionStencil.indices.length;
		positionTap += 1) {
		for (let wavelengthIndex = 0;
			wavelengthIndex < channelCount;
			wavelengthIndex += 1) {
			radiance[wavelengthIndex] += reader.readScalar({
				directionIndex,
				positionIndex:
					positionStencil.indices[positionTap],
				wavelengthIndex,
			}) * positionStencil.weights[positionTap];
		}
	}

	return radiance;
}

/**
 * Resolve exact ground-contact or transported return transmittance.
 *
 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - Supplies owners.
 * @param {GroundIntersection} hit - Supplies the ground hit.
 * @param {UnitVector3} outgoingDirection - Supplies ground-to-sample direction.
 * @param {number} channelCount - Supplies channel count.
 * @returns {readonly number[]} The transmittance.
 */
function groundToPositionTransmittance(
	request,
	hit,
	outgoingDirection,
	channelCount,
) {
	if (DistanceMath.toMeters(hit.distance) === 0) {
		return Array(channelCount).fill(1);
	}

	return groundPathTransmittance(
		request,
		{
			origin: hit.position,
			direction: outgoingDirection,
		},
		hit.distance,
		undefined,
	);
}

/**
 * Integrate one ground-owned atmosphere path.
 *
 * @param {LocalSunReflectiveGroundScatteringKernelRequest} request - Supplies owners.
 * @param {Ray} ray - Supplies the ray.
 * @param {Distance | undefined} endDistance - Supplies an optional end.
 * @param {SourcePathLimit | undefined} sourcePathLimit - Supplies an optional source bound.
 * @returns {readonly number[]} The spectral transmittance.
 */
function groundPathTransmittance(
	request,
	ray,
	endDistance,
	sourcePathLimit,
) {
	const path = request.geometry.resolveAtmospherePath({
		ray,
		...(endDistance === undefined ? {} : { endDistance }),
		...(sourcePathLimit === undefined
			? {}
			: { sourcePathLimit }),
		sampleCount: request.sourceTransmittanceIntervalCount,
	});

	if (path.blockedByGround) {
		return Array(
			request.domainSelection.scatteringDensityPacking
				.wavelengthCount,
		).fill(0);
	}

	return request.atmosphere.integrateOpticalDepth(path)
		.transmittance.values;
}

/**
 * Return one dot product.
 *
 * @param {UnitVector3} left - Supplies left direction.
 * @param {UnitVector3} right - Supplies right direction.
 * @returns {number} The dot product.
 */
function dot(left, right) {
	return left[0] * right[0]
		+ left[1] * right[1]
		+ left[2] * right[2];
}
