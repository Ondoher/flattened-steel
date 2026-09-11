import {DistantSunSceneCacheCompilerInputs as CurrentInputs} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js';
import reference from './bruneton-inputs.json' with {type: 'json'};

/** Current production inputs extended with the accepted point-local Bruneton physical data. */
export default class ProfileInputs {
	/** Call this method to obtain unchanged application inputs with an explicit coordinate contract.
	 * @returns {DistantSunSceneCacheCompilerBuildRequest} - Complete application transport request.
	 */
	application() {
		const input = CurrentInputs.createInputSet(CurrentInputs.createQualifiedSanJoseNauticalScene());
		return {
			...input.buildRequest,
			transportSpec: {
				...input.buildRequest.transportSpec,
				shaderProfile: {coordinateContract: 'scene-cache-receiver-local-v1'},
			},
		};
	}

	/** Call this method to extend the current request with the accepted Direct40 physical profile.
	 * Ozone remains supported by the application profile; this reference profile has zero absorption.
	 * @returns {DistantSunSceneCacheCompilerBuildRequest} - Full point-local Direct40/N4 transport request.
	 */
	bruneton() {
		const application = this.application();
		const spec = application.transportSpec;
		const channels = reference.channels.map((channel, index) => ({
			...channel,
			id: `b1-${index}`,
			binWidthNanometers: 11.75,
		}));
		return {
			id: 'point-local-bruneton-builder-v1',
			transportSpec: {
				...spec,
				id: 'point-local-bruneton-transport-v1',
				source: {
					...spec.source,
					spectralIrradianceDensity: channels.map(
						(channel) => channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
					),
				},
				atmosphere: {
					...spec.atmosphere,
					id: 'bruneton-b1-no-ozone',
					ozone: {
						...spec.atmosphere.ozone,
						absorptionEnabled: false,
						dobsonUnits: 0,
						maximumDensityPerCubicMeter: 0,
						crossSectionTable: {
							...spec.atmosphere.ozone.crossSectionTable,
							values: spec.atmosphere.ozone.crossSectionTable.values.map(() => 0),
						},
					},
				},
				ground: {id: 'bruneton-b1-spectral-grass'},
				numerical: {...spec.numerical, transportIntervalCount: 40},
				domains: {...spec.domains, spectrum: {id: 'bruneton-b1-direct40', channels}},
			},
		};
	}

	/** Call this method to obtain scene inputs from the accepted B1 observer/Sun data.
	 * @returns {BuilderScene[]} - Ordered input scenes, with counts determined by data.
	 */
	brunetonScenes() {
		return reference.scenes.map((state) => ({
			id: state.id,
			zenithDegrees: state.zenithDegrees,
			observerAltitudeMeters: 0,
			time: state.time,
			fittedAzimuthDegrees: state.fittedAzimuthDegrees,
		}));
	}
}
