import LocalSunCpuFields from './LocalSunCpuFields.js';
import {
	LOCAL_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY,
} from './local-sun-consts.js';

/**
 * Build the local point Sun's pure primary scattering-density field.
 *
 * The source sample is resolved independently at every z-by-rho node so its
 * changing direction, inverse-square scale, radius clamp, and finite path
 * remain source-owned.
 *
 * @param {LocalSunPrimaryScatteringDensityBuildRequest} request - Supplies physical owners.
 * @returns {CpuDirectionalSpectralFieldContract} The sealed pure J1 field.
 */
export function buildLocalSunCpuPrimaryScatteringDensity(request) {
	const domainSelection = request.domainSelection;
	const field = LocalSunCpuFields.createPureScatteringDensity({
		id: request.id
			?? 'algorithm32-local-sun-cpu-pure-j1-v1',
		order: 1,
		provenanceIdentity:
			request.provenanceIdentity
			?? LOCAL_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY,
		domainSelection,
	});
	const writer = field.createWriter();
	writer.fill(0);

	try {
		for (const node of domainSelection.positionNodes) {
			const position = /** @type {Position} */ (node.metadata.position);
			const atmosphereCoordinate =
				request.geometry.resolveAtmosphereCoordinate(position);
			const medium = request.atmosphere.sampleMedium(
				atmosphereCoordinate,
			);
			const sourceRelativePosition =
				request.geometry.resolveSourceRelativePosition({
					position,
					atmosphereCoordinate,
				});
			const directLighting = request.lightSource.sampleDirectLighting({
				sourceRelativePosition,
				spectralBasis:
					request.spectralBasis,
			});
			const sourcePathLimit =
				request.lightSource.resolveSourcePathLimit({
					sourceRelativePosition,
					directLighting,
				});
			const sourcePath = request.geometry.resolveAtmospherePath({
				ray: {
					origin: position,
					direction: directLighting.directionToLight,
				},
				sourcePathLimit,
				sampleCount:
					request.sourceTransmittanceIntervalCount,
			});
			const sourceTransmittance = sourcePath.blockedByGround
				? new Float64Array(
					domainSelection.spectralChannelCount,
				)
				: request.atmosphere.integrateOpticalDepth(sourcePath)
					.transmittance.values;

			for (let directionIndex = 0;
				directionIndex
					< domainSelection.outgoingDirectionCount;
				directionIndex += 1) {
				const physicalOutgoingDirection =
					request.geometry
						.expressPhysicalScatteringCacheDirection({
							position,
							cacheDirection:
								domainSelection
									.outgoingUnitVectors[
										directionIndex
									],
						});
				const phase = request.atmosphere.samplePhase({
					viewDirection: physicalOutgoingDirection,
					incomingDirection:
						directLighting.directionToLight,
				});

				for (let wavelengthIndex = 0;
					wavelengthIndex
						< domainSelection.spectralChannelCount;
					wavelengthIndex += 1) {
					const scatteringPerMeter =
						medium.rayleighScattering
							.values[wavelengthIndex]
							* phase.rayleighPhase.value
						+ medium.mieScattering
							.values[wavelengthIndex]
							* phase.miePhase.value;
					writer.writeScalar({
						directionIndex,
						positionIndex: node.index,
						wavelengthIndex,
					}, directLighting.sourceIrradiance
						.values[wavelengthIndex]
						* sourceTransmittance[wavelengthIndex]
						* scatteringPerMeter);
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
