/**
 * Contract-preserving CPU implementation of pure `Jk -> Lk`
 * `buildTransportedRadiance` and `integrateScatteringDensityAlongPath` flow.
 *
 * Numerical authority:
 * the current production cache contract
 * SHA-256: `98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a`.
 * Production owns this standalone port and has no runtime dependency on the
 * experimental source tree.
 */

import ArrayMath from '../math/ArrayMath.js';
import DistanceMath from '../math/DistanceMath.js';
import {ScatteringOrderFieldOperations} from './ScatteringOrderFieldOperations.js';

/**
 * Called by this module to sample one spectrum through position-major, direction-minor tap loops.
 *
 * @param {CpuDirectionalSpectralFieldReader} scatteringDensity - Supplies sealed Jk values.
 * @param {ScatteringCachePositionStencil} positionStencil - Supplies construction position taps.
 * @param {ScatteringCacheDirectionStencil} directionStencil - Supplies W27 direction taps.
 * @param {number} wavelengthCount - Supplies the spectral channel count.
 * @returns {Float64Array} - Return the reconstructed scattering-density spectrum.
 */
function sampleScatteringDensity(scatteringDensity, positionStencil, directionStencil, wavelengthCount) {
	const result = new Float64Array(wavelengthCount);

	for (let positionOffset = 0; positionOffset < positionStencil.indices.length; positionOffset += 1) {
		const positionIndex = positionStencil.indices[positionOffset];
		const positionWeight = positionStencil.weights[positionOffset];

		for (let directionOffset = 0; directionOffset < directionStencil.indices.length; directionOffset += 1) {
			const directionIndex = directionStencil.indices[directionOffset];
			const weight = positionWeight * directionStencil.weights[directionOffset];

			for (let wavelengthIndex = 0; wavelengthIndex < wavelengthCount; wavelengthIndex += 1) {
				result[wavelengthIndex] +=
					scatteringDensity.readScalar({
						directionIndex,
						positionIndex,
						wavelengthIndex,
					}) * weight;
			}
		}
	}

	return result;
}

/**
 * Called by this module to integrate stored pure scattering density along one geometry-owned ray. Medium sampling, segment transmittance, construction lookup, W27 lookup, and spectral accumulation retain the selected production order.
 *
 * @param {CpuDirectionalSpectralFieldReader} scatteringDensity - Supplies sealed Jk values.
 * @param {PureScatteringDensityTransportGeometry} geometry - Supplies geometry operations.
 * @param {PureScatteringDensityTransportAtmosphere} atmosphere - Supplies medium sampling.
 * @param {PureScatteringDensityTransportCalculator} calculator - Supplies transport calculations.
 * @param {PureScatteringDensityPositionStencilResolver} resolvePositionStencil - Supplies executable position lookup.
 * @param {PureScatteringDensityDirectionStencilResolver} resolveDirectionStencil - Supplies source-owned direction lookup.
 * @param {number} spectralChannelCount - Supplies the executable spectral width.
 * @param {RaySegment} raySegment - Supplies the physical construction ray.
 * @param {readonly PathIntegrationPoint[]} path - Supplies ordered trapezoid points.
 * @returns {Float64Array} - Return the transported spectral radiance.
 */
function integrateScatteringDensityAlongPath(
	scatteringDensity,
	geometry,
	atmosphere,
	calculator,
	resolvePositionStencil,
	resolveDirectionStencil,
	spectralChannelCount,
	raySegment,
	path,
) {
	const result = new Float64Array(spectralChannelCount);
	/** @type {Float64Array<ArrayBufferLike>} */
	let viewTransmittance = new Float64Array(spectralChannelCount).fill(1);
	/** @type {AtmosphereSample | null} */
	let previousMedium = null;
	const rayOrigin = /** @type {Position} */ (raySegment.ray.origin);

	for (const point of path) {
		const distanceAlongRayMeters = DistanceMath.toMeters(point.distanceAlongRay);
		const position = DistanceMath.positionAlongRay(rayOrigin, raySegment.ray.direction, distanceAlongRayMeters);
		const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(position);
		const medium = atmosphere.sampleMedium(atmosphereCoordinate);

		if (previousMedium) {
			const segmentTransmittance = calculator.computeTrapezoidSegmentTransmittance(
				previousMedium.extinction,
				medium.extinction,
				point.intervalLengthFromPrevious,
			);
			viewTransmittance = ArrayMath.multiplyToFloat64(viewTransmittance, segmentTransmittance.values);
		}

		const positionStencil = resolvePositionStencil({
			position,
			atmosphereCoordinate,
		});
		const cacheDirection = geometry.expressScatteringCacheDirection({
			position,
			physicalOutgoingDirection: raySegment.ray.direction,
		});
		const directionStencil = resolveDirectionStencil(cacheDirection);
		const density = sampleScatteringDensity(
			scatteringDensity,
			positionStencil,
			directionStencil,
			spectralChannelCount,
		);
		const measureMeters = DistanceMath.toMeters(point.measure);

		for (let wavelengthIndex = 0; wavelengthIndex < result.length; wavelengthIndex += 1) {
			result[wavelengthIndex] += viewTransmittance[wavelengthIndex] * density[wavelengthIndex] * measureMeters;
		}

		previousMedium = medium;
	}

	return result;
}

/**
 * Call this function to transport one sealed pure stored scattering-density field `Jk` into a mutable pure radiance field `Lk` through the selected production calculation. Order 1 is accepted for diagnostics, but production `L1` remains the separate source-owned direct-primary field and must not be wired here.
 *
 * @param {PureScatteringDensityTransportRequest} request - Supplies accepted fields and collaborators.
 * @returns {CpuDirectionalSpectralFieldContract} - Return the sealed pure Lk field.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 * @throws {Error} - When the operation cannot complete its caller-observable contract.
 */
export function transportPureScatteringDensity(request) {
	const outputRadiance = request.outputRadiance;
	if (outputRadiance.isSealed !== false) {
		throw new TypeError('transport output radiance field must be mutable before construction.');
	}
	const outputWriter = outputRadiance.createWriter();
	outputWriter.fill(0);

	try {
		const scatteringDensity = request.scatteringDensity;
		if (scatteringDensity === outputRadiance) {
			throw new TypeError('transport scattering-density and output radiance fields must not alias.');
		}
		if (scatteringDensity.isSealed !== true) {
			throw new TypeError('transport scattering-density field must be sealed before it can be consumed.');
		}

		const scatteringReader = scatteringDensity.createReader();

		for (let positionIndex = 0; positionIndex < request.positionCount; positionIndex += 1) {
			const positionNode = request.positionNodes[positionIndex];

			for (let directionIndex = 0; directionIndex < request.radianceDirectionCount; directionIndex += 1) {
				const cacheDirection = request.radianceUnitVectors[directionIndex];
				const physicalDirection = request.resolvePhysicalRadianceDirection({
					positionIndex,
					positionNode,
					directionIndex,
					cacheDirection,
				});
				const buildCoordinate = request.resolveBuildCoordinate({
					positionIndex,
					directionIndex,
					positionNode,
					incomingDirection: physicalDirection,
				});
				const raySegment = request.geometry.resolveCacheBuildRay(buildCoordinate);

				if (!raySegment) {
					continue;
				}

				const path = request.calculator.buildEndpointTrapezoidPathIntegrationPoints(
					raySegment,
					request.pathIntervalCount,
				);
				const radiance = integrateScatteringDensityAlongPath(
					scatteringReader,
					request.geometry,
					request.atmosphere,
					request.calculator,
					request.resolvePositionStencil,
					request.resolveDirectionStencil,
					request.spectralChannelCount,
					raySegment,
					path,
				);

				for (let wavelengthIndex = 0; wavelengthIndex < radiance.length; wavelengthIndex += 1) {
					outputWriter.writeScalar(
						{
							directionIndex,
							positionIndex,
							wavelengthIndex,
						},
						radiance[wavelengthIndex],
					);
				}
			}
			request.onProgress?.({
				phase: 'transport',
				order: request.scatteringOrder,
				completed: positionIndex + 1,
				total: request.positionCount,
			});
		}

		outputRadiance.seal();
		return outputRadiance;
	} catch (error) {
		ScatteringOrderFieldOperations.zeroMutableField(outputRadiance, outputWriter);
		throw error;
	}
}
