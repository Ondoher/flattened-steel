import LocalSunCpuFields from './LocalSunCpuFields.js';
import {
	LOCAL_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY,
	LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
} from './local-sun-consts.js';

/**
 * Build the finite local Sun's continuous direct-primary L1 field.
 *
 * Every path sample is evaluated by the continuous-source spectral
 * calculator. This operation never reads shell facts or stored J1.
 *
 * @param {LocalSunPrimaryRadianceBuildRequest} request - Supplies physical
 * owners and the paired incoming domain.
 * @returns {CpuDirectionalSpectralFieldContract} The sealed pure L1 field.
 */
export function buildLocalSunCpuPrimaryRadiance(request) {
	const domainSelection = request.domainSelection;
	const field = LocalSunCpuFields.createPureRadiance({
		id: request.id
			?? 'algorithm32-local-sun-cpu-pure-l1-direct-v2',
		order: 1,
		provenanceIdentity:
			request.provenanceIdentity
			?? LOCAL_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY,
		domainSelection,
	});
	const writer = field.createWriter();
	const pathIntervalCount = request.pathIntervalCount
		?? LOCAL_SUN_TRANSPORT_INTERVAL_COUNT;
	writer.fill(0);

	try {
		for (const node of domainSelection.positionNodes) {
			const position =
				/** @type {Position} */ (
					node.metadata.position
				);

			for (let directionIndex = 0;
				directionIndex
					< domainSelection.incomingDirectionCount;
				directionIndex += 1) {
				const incomingDirection =
					request.geometry
						.expressPhysicalScatteringCacheDirection({
							position,
							cacheDirection:
								domainSelection
									.incomingUnitVectors[
										directionIndex
									],
						});
				const raySegment =
					request.geometry.resolveCacheBuildRay({
						coordinateKey:
							`local-z${domainSelection.zCount}`
							+ `-rho${domainSelection.rhoCount}`
							+ `-paired-fibonacci${domainSelection.incomingDirectionCount}`
							+ `:${node.index}:${directionIndex}`,
						coordinates: [
							node.index,
							directionIndex,
						],
						zBinIndex:
							/** @type {number} */ (
								node.metadata.zIndex
							),
						rhoBinIndex:
							/** @type {number} */ (
								node.metadata.rhoIndex
							),
						altitude:
							/** @type {Distance} */ (
								node.metadata.z
							),
						rho:
							/** @type {Distance} */ (
								node.metadata.rho
							),
						incomingDirection,
						directionIndex,
						metadata: {
							position,
							positionIndex:
								node.index,
						},
					});
				const path = request.calculator
					.buildEndpointTrapezoidPathIntegrationPoints(
						raySegment,
						pathIntervalCount,
					);
				const radiance = request.calculator
					.computeDirectRadiance(
						raySegment,
						path,
					).pathRadiance.values;

				for (let wavelengthIndex = 0;
					wavelengthIndex
						< domainSelection.radiancePacking
							.wavelengthCount;
					wavelengthIndex += 1) {
					writer.writeScalar({
						directionIndex,
						positionIndex: node.index,
						wavelengthIndex,
					}, radiance[wavelengthIndex]);
				}
			}

			request.onProgress?.({
				phase: 'transport',
				order: 1,
				completed: node.index + 1,
				total:
					domainSelection.positionNodes.length,
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
