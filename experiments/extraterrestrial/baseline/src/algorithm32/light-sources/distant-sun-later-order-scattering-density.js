/**
 * Adapt the distant Sun's native-48, Fibonacci-34, and W27 physical domains
 * to the generic selected-Star `L(k - 1) -> Jk` scattering kernel.
 *
 * Numerical authority:
 * `scripts/algorithm32-star/src/n-order-cache/build-cpu-distant-n-order-cache.js`
 * functions `buildNextScatteringDensity` and `incomingRadianceAtPosition`,
 * including the selected direct-J2 and pure-L(k-2) ground terms.
 * SHA-256: `98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a`.
 * W27 physical-basis acceptance authority:
 * `scripts/algorithm32-star/src/n-order-cache/CubedSphereDirectionDomain.js`
 * function `validateBasis`.
 * SHA-256: `9ae4788e34aaed042007534130a028a83cef9222d5c6a243ca9d341e38a51d7c`.
 */

import {
	createPhysicalLaterOrderScatteringKernel,
} from '../transport/later-order-scattering-density.js';
import DistanceMath from '../utils/DistanceMath.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	SOURCE_LOCAL_TOWARD_DISTANT_SUN,
	UNIT_VECTOR_TOLERANCE,
} from './consts.js';

/**
 * Require one finite normalized physical direction.
 *
 * @param {UnitVector3} value - Supplies the direction candidate.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {UnitVector3} Return the accepted direction.
 */
function assertUnitVector(value, label) {
	const magnitude = Math.hypot(value[0], value[1], value[2]);
	if (!Number.isFinite(magnitude)
		|| Math.abs(magnitude - 1)
		> UNIT_VECTOR_TOLERANCE) {
		throw new RangeError(`${label} must be normalized.`);
	}

	return value;
}

/**
 * Require matching physical source axes at the adapter boundary.
 *
 * @param {UnitVector3} directionToSource - Supplies the geometry axis.
 * @param {UnitVector3} directionToLight - Supplies the source axis.
 * @returns {void}
 */
function assertMatchingSourceDirections(directionToSource, directionToLight) {
	if (directionToSource.some((component, index) =>
		Math.abs(component - directionToLight[index]) > UNIT_VECTOR_TOLERANCE)) {
		throw new TypeError(
			'distant-Sun later-order geometry and source directions must match.',
		);
	}
}

/**
 * Return one dot product in the selected Star basis-validation order.
 *
 * @param {UnitVector3} left - Supplies the left axis.
 * @param {UnitVector3} right - Supplies the right axis.
 * @returns {number} Return the scalar dot product.
 */
function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

/**
 * Return one cross product in the selected Star basis-validation order.
 *
 * @param {UnitVector3} left - Supplies the left axis.
 * @param {UnitVector3} right - Supplies the right axis.
 * @returns {UnitVector3} Return the cross product.
 */
function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

/**
 * Apply Star's one-time cubed-sphere basis acceptance policy to the mapped
 * physical +X, +Y, and +Z cubed-sphere face centers.
 *
 * @param {readonly UnitVector3[]} physicalDirections - Supplies mapped cubed-sphere nodes.
 * @param {DistantSunConstructionDomainSelection} domainSelection - Supplies
 * executable center indices.
 * @returns {void}
 */
function assertPhysicalCubedSphereBasis(physicalDirections, domainSelection) {
	const centerIndices = domainSelection.outgoingPositiveFaceCenterIndices;
	const xAxis = physicalDirections[centerIndices.positiveX];
	const yAxis = physicalDirections[centerIndices.positiveY];
	const zAxis = physicalDirections[centerIndices.positiveZ];

	if (Math.abs(dot(xAxis, yAxis)) > UNIT_VECTOR_TOLERANCE
		|| Math.abs(dot(xAxis, zAxis)) > UNIT_VECTOR_TOLERANCE
		|| Math.abs(dot(yAxis, zAxis)) > UNIT_VECTOR_TOLERANCE) {
		throw new RangeError(
			'distant-Sun physical cubed-sphere basis axes must be mutually orthogonal.',
		);
	}
	if (dot(cross(xAxis, yAxis), zAxis) < 1 - UNIT_VECTOR_TOLERANCE) {
		throw new RangeError(
			'distant-Sun physical cubed-sphere basis axes must form a right-handed frame.',
		);
	}
}

/**
 * Check numerical source/geometry coherence once at kernel creation.
 *
 * @param {DistantSunLaterOrderScatteringKernelRequest} value - Supplies adapter inputs.
 * @returns {DistantSunLaterOrderScatteringContext}
 * Return accepted adapter inputs.
 */
function assertAdapterRequest(value) {
	const request = value;
	const domainSelection = request.domainSelection
		?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const geometryDirectionToSource = assertUnitVector(
		request.geometry.expressPhysicalIncomingRadianceDirection(
			SOURCE_LOCAL_TOWARD_DISTANT_SUN,
		),
		'distant-Sun geometry directionToSource',
	);
	const directionToLight = assertUnitVector(
		request.directionToLight,
		'distant-Sun source directionToLight',
	);
	assertMatchingSourceDirections(
		geometryDirectionToSource,
		directionToLight,
	);

	return {
		request,
		domainSelection,
	};
}

/**
 * Precompute geometry-owned native-altitude physical positions once when the
 * source kernel is created. Later scattering orders reuse these executable
 * positions without reconstructing them from metadata.
 *
 * @param {DistantSunLaterOrderScatteringGeometry} geometry - Supplies spherical reconstruction.
 * @param {DistantSunConstructionDomainSelection} domainSelection - Supplies
 * executable position nodes.
 * @returns {LaterOrderScatteringPositionResolver}
 * Return the native position resolver.
 */
function createPhysicalPositionResolver(
	geometry,
	domainSelection,
) {
	const physicalPositions = domainSelection.positionNodes.map(
		(positionNode) =>
			geometry.resolveScatteringCacheConstructionPosition(
				positionNode,
			),
	);

	return (request) => physicalPositions[request.positionIndex];
}

/**
 * Create source-specific physical direction mapping. The generic kernel
 * calls this independently for Fibonacci-34 and W27, preserving distinct
 * source-local frame policies and Star's unreversed direction convention.
 *
 * @param {DistantSunLaterOrderScatteringGeometry} geometry - Supplies frame mapping.
 * @param {DistantSunConstructionDomainSelection} domainSelection - Supplies
 * executable directions.
 * @returns {{
 *   incoming: LaterOrderScatteringDirectionResolver,
 *   outgoing: LaterOrderScatteringDirectionResolver,
 * }} Return distinct physical direction resolvers.
 */
function createPhysicalDirectionResolvers(geometry, domainSelection) {
	const physicalIncomingDirections = domainSelection.incomingUnitVectors.map(
		(cacheDirection) => assertUnitVector(
			geometry.expressPhysicalIncomingRadianceDirection(
				cacheDirection,
			),
			'distant-Sun physical Fibonacci-34 direction',
		),
	);
	const physicalOutgoingDirections = domainSelection.outgoingUnitVectors.map(
		(cacheDirection) => assertUnitVector(
			geometry.expressPhysicalOutgoingScatteringDirection(
				cacheDirection,
			),
			'distant-Sun physical cubed-sphere direction',
		),
	);
	assertPhysicalCubedSphereBasis(
		physicalOutgoingDirections,
		domainSelection,
	);

	return {
		incoming: (request) =>
			physicalIncomingDirections[request.directionIndex],
		outgoing: (request) =>
			physicalOutgoingDirections[request.directionIndex],
	};
}

/**
 * Select pure L(k-2) as the only higher-order ground illumination field.
 *
 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Supplies the selected Jk order and field.
 * @returns {CpuDirectionalSpectralFieldReader | null} Return null for J2 or the sealed pure reader.
 */
function groundIlluminationReader(request) {
	if (request.scatteringOrder === 2) {
		return null;
	}

	return /** @type {CpuDirectionalSpectralFieldContract} */ (
		request.groundIlluminationRadiance
	).createReader();
}

/**
 * Integrate atmosphere transmittance for one ground-owned ray segment.
 *
 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Supplies geometry, atmosphere, and controls.
 * @param {Ray} ray - Supplies the physical path ray.
 * @param {Distance | undefined} endDistance - Optionally supplies an explicit end distance.
 * @param {SourcePathLimit | undefined} sourcePathLimit - Optionally supplies the source-owned path limit.
 * @returns {readonly number[]} Return spectral transmittance values.
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
		...(sourcePathLimit === undefined ? {} : { sourcePathLimit }),
		sampleCount: request.sourceTransmittanceIntervalCount,
	});

	return request.atmosphere.integrateOpticalDepth(path).transmittance.values;
}

/**
 * Preserve Star's exact unit-transmittance ground-contact shortcut.
 *
 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Supplies transport owners.
 * @param {GroundIntersection} hit - Supplies the geometry-owned return distance.
 * @param {UnitVector3} outgoingDirection - Supplies the return direction.
 * @param {number} channelCount - Supplies the spectral channel count.
 * @returns {readonly number[]} Return the ground-to-position transmittance.
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
 * Evaluate the direct-source reflected radiance at one ground hit.
 *
 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Supplies source and boundary owners.
 * @param {GroundIntersection} hit - Supplies the geometry-owned hit.
 * @param {UnitVector3} outgoingDirection - Supplies the direction from ground toward the cache sample.
 * @param {SpectralBasis} spectralBasis - Supplies the requested native basis.
 * @returns {Float64Array} Return direct reflected radiance at the hit.
 */
function directGroundReflectedRadiance(
	request,
	hit,
	outgoingDirection,
	spectralBasis,
) {
	const directLighting = request.lightSource.sampleDirectLighting({ spectralBasis });
	const incidenceCosine = Math.max(
		0,
		dot(hit.normal, directLighting.directionToLight),
	);
	const reflected = new Float64Array(spectralBasis.channelCount);
	if (incidenceCosine === 0) {
		return reflected;
	}
	const sourcePathLimit = request.lightSource.resolveSourcePathLimit({
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
		reflected[wavelengthIndex] = directLighting.sourceIrradiance
			.values[wavelengthIndex]
			* sourceTransmittance[wavelengthIndex]
			* incidenceCosine
			* brdf[wavelengthIndex];
	}

	return reflected;
}

/**
 * Read one exact-direction spectrum through a geometry-owned position stencil.
 *
 * @param {CpuDirectionalSpectralFieldReader} reader - Supplies pure L(k-2).
 * @param {ScatteringCachePositionStencil} positionStencil - Supplies physical position weights.
 * @param {number} directionIndex - Supplies the exact quadrature direction.
 * @param {number} channelCount - Supplies the spectral channel count.
 * @returns {Float64Array} Return the interpolated pure radiance spectrum.
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
		const positionIndex = positionStencil.indices[positionTap];
		const positionWeight = positionStencil.weights[positionTap];
		for (let wavelengthIndex = 0;
			wavelengthIndex < channelCount;
			wavelengthIndex += 1) {
			radiance[wavelengthIndex] += reader.readScalar({
				directionIndex,
				positionIndex,
				wavelengthIndex,
			}) * positionWeight;
		}
	}

	return radiance;
}

/**
 * Integrate pure L(k-2) illumination into reflected radiance at one hit.
 *
 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Supplies geometry and boundary owners.
 * @param {CpuDirectionalSpectralFieldReader} illuminationReader - Supplies pure L(k-2).
 * @param {GroundIntersection} hit - Supplies the geometry-owned hit.
 * @param {UnitVector3} outgoingDirection - Supplies the direction from ground toward the cache sample.
 * @param {readonly UnitVector3[]} physicalIncomingDirections - Supplies physical quadrature directions.
 * @param {number} incomingDirectionCount - Supplies the quadrature extent.
 * @param {readonly number[]} angularWeightsSteradians - Supplies executable quadrature weights.
 * @param {SpectralBasis} spectralBasis - Supplies the requested native basis.
 * @returns {Float64Array} Return indirectly reflected radiance at the hit.
 */
function indirectGroundReflectedRadiance(
	request,
	illuminationReader,
	hit,
	outgoingDirection,
	physicalIncomingDirections,
	incomingDirectionCount,
	angularWeightsSteradians,
	spectralBasis,
) {
	const atmosphereCoordinate = request.geometry.resolveAtmosphereCoordinate(
		hit.position,
	);
	const positionStencil =
		request.geometry.resolveScatteringCacheConstructionPositionStencil({
			position: hit.position,
			atmosphereCoordinate,
		});
	const reflected = new Float64Array(spectralBasis.channelCount);

	for (let directionIndex = 0;
		directionIndex < incomingDirectionCount;
		directionIndex += 1) {
		const incomingDirection = physicalIncomingDirections[directionIndex];
		const incidenceCosine = Math.max(0, dot(hit.normal, incomingDirection));
		if (incidenceCosine === 0) {
			continue;
		}
		const radiance = readGroundIllumination(
			illuminationReader,
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
		const angularWeightSteradians = angularWeightsSteradians[directionIndex];

		for (let wavelengthIndex = 0;
			wavelengthIndex < reflected.length;
			wavelengthIndex += 1) {
			reflected[wavelengthIndex] += radiance[wavelengthIndex]
				* brdf[wavelengthIndex]
				* incidenceCosine
				* angularWeightSteradians;
		}
	}

	return reflected;
}

/**
 * Create the source-owned ground contribution injected before phase scatter.
 *
 * @param {DistantSunReflectiveGroundScatteringKernelRequest} request - Supplies the selected order and physical owners.
 * @param {DistantSunConstructionDomainSelection} domainSelection - Supplies
 * selected field identities.
 * @returns {LaterOrderIncomingRadianceContributor} Return the ground contributor.
 */
function createGroundIncomingRadianceContributor(request, domainSelection) {
	const illuminationReader = groundIlluminationReader(
		request,
	);

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
			const incomingDirection = physicalIncomingDirections[directionIndex];
			const hit = request.geometry.resolveGroundIntersection({
				origin: position,
				direction: incomingDirection,
			});
			if (hit === null) {
				continue;
			}
			const outgoingDirection = /** @type {UnitVector3} */ ([
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
					physicalIncomingDirections,
					incomingDirectionCount,
					domainSelection
						.incomingIntegrationWeights.values,
					spectralBasis,
				);
			const returnTransmittance = groundToPositionTransmittance(
				request,
				hit,
				outgoingDirection,
				spectralBasis.channelCount,
			);

			for (let wavelengthIndex = 0;
				wavelengthIndex < spectralBasis.channelCount;
				wavelengthIndex += 1) {
				incomingRadiance[directionIndex][wavelengthIndex] +=
					reflected[wavelengthIndex]
					* returnTransmittance[wavelengthIndex];
			}
		}
	};
}

/**
 * Create the source-owned distant-Sun physical later-order kernel adapter.
 *
 * @param {DistantSunLaterOrderScatteringKernelRequest} request - Supplies physical collaborators.
 * @returns {ScatteringOrderKernel} Return the synchronous physical kernel.
 */
export function createDistantSunLaterOrderScatteringKernel(request) {
	const accepted = assertAdapterRequest(request);
	const physicalDirectionResolvers = createPhysicalDirectionResolvers(
		accepted.request.geometry,
		accepted.domainSelection,
	);
	const contributeIncomingRadiance = accepted.request.groundBoundary == null
		? undefined
		: createGroundIncomingRadianceContributor(
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
		incomingUnitVectors:
			accepted.domainSelection.incomingUnitVectors,
		incomingDirectionCount:
			accepted.domainSelection.incomingDirectionCount,
		incomingIntegrationWeights:
			accepted.domainSelection.incomingIntegrationWeights,
		outgoingUnitVectors:
			accepted.domainSelection.outgoingUnitVectors,
		outgoingDirectionCount:
			accepted.domainSelection.outgoingDirectionCount,
		spectralBasis: accepted.domainSelection.spectralBasis,
		spectralChannelCount:
			accepted.domainSelection.spectralChannelCount,
		resolvePhysicalPosition: createPhysicalPositionResolver(
			accepted.request.geometry,
			accepted.domainSelection,
		),
		resolvePhysicalIncomingDirection:
			physicalDirectionResolvers.incoming,
		resolvePhysicalOutgoingDirection:
			physicalDirectionResolvers.outgoing,
		...(contributeIncomingRadiance === undefined
			? {}
			: { contributeIncomingRadiance }),
	});
}
