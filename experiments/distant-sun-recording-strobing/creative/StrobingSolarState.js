import {CreativeSolarState} from '../../distant-sun-shadow-animation-evidence/creative/CreativeSolarState.js';
import {StrobingHermite} from './StrobingHermite.js';

/** Original astronomical choreography adapted to the current dynamic source binding. */
export class StrobingSolarState extends CreativeSolarState {
	/** @param {CreativeApplication} application Existing application.
	 * @param {StrobingRenderConfiguration} configuration Exact diagnostic interval.
	 */
	constructor(application, configuration) {
		super(application);
		/** Only the selected integer-second samples are needed for a short control. */
		this._captureConfiguration = configuration;
	}

	/** Restore the live geometry owner before its coherent observation publication.
	 * @param {Flat32ApplicationState} state Exact requested observation.
	 * @param {number} zenith Exact zenith in degrees.
	 * @returns {Promise<boolean>} Whether the cache scene changed.
	 */
	async _ensureRuntime(state, zenith) {
		const controller = this._application._modeController;
		const celestial = controller._activeRuntime._shaderHandle._buildResult.celestialGenerationParticipant;
		celestial._sun._geometry = controller._activeMode.geometry;
		if (celestial._stellar) celestial._stellar._geometry = controller._activeMode.geometry;
		return super._ensureRuntime(state, zenith);
	}

	/** Prepare the same one-second lighting samples for just the retained interval.
	 * @param {CreativeSolarInitializeOptions} options Awaited progress publisher.
	 * @returns {Promise<void>}
	 */
	async _prepareLighting(options) {
		const configuration = this._captureConfiguration;
		if (configuration.fullFilm) return super._prepareLighting(options);
		const padding = configuration.lightingInterpolation === 'monotone-cubic' ? 1 : 0;
		const count = configuration.durationSeconds + 1 + 2 * padding;
		for (let index = 0; index < count; index += 1) {
			const seconds = configuration.startSeconds - padding + index;
			const state = this._stateAt(this._instantAt(seconds));
			const scene = this._application._createSphericalDistantSceneState(state);
			await this._ensureRuntime(state, scene.solarZenithDegrees);
			const mode = this._createExactMode(scene);
			try {
				this._lightingSamples.push({
					seconds,
					instant: state.observation.instant,
					measurement: await this._measureLight(mode),
				});
			} finally {
				mode.dispose();
			}
			await options.onProgress?.({
				phase: 'prepare-lighting',
				completed: index + 1,
				total: count,
				message: `Measured diagnostic receiver light ${index + 1}/${count}.`,
			});
		}
	}
	/** Interpolate physical diffuse spectra with shared tangents; direct light stays exact-time.
	 * @param {number} seconds @param {CreativeSolarMode} exactMode
	 * @returns {ReceiverEnvironmentLightMeasurement}
	 */
	_interpolateLight(seconds, exactMode) {
		if (this._captureConfiguration.lightingInterpolation !== 'monotone-cubic')
			return super._interpolateLight(seconds, exactMode);
		const samples = this._lightingSamples;
		let first = samples.findIndex((sample) => sample.seconds > seconds) - 1;
		if (first < 0) first = seconds >= samples.at(-1).seconds ? samples.length - 2 : 0;
		const b = samples[first],
			c = samples[first + 1];
		const a = samples[Math.max(0, first - 1)],
			d = samples[Math.min(samples.length - 1, first + 2)];
		const t = Math.max(0, Math.min(1, (seconds - b.seconds) / (c.seconds - b.seconds)));
		const values = b.measurement.diffuseHorizontal.values.map((value, channel) =>
			StrobingHermite.value(
				a.measurement.diffuseHorizontal.values[channel],
				value,
				c.measurement.diffuseHorizontal.values[channel],
				d.measurement.diffuseHorizontal.values[channel],
				t,
			),
		);
		const template = b.measurement.diffuseHorizontal;
		const diffuseHorizontal = /** @type {SpectralIrradiancePacket} */ (
			new window.__creativeSpectralPacket({
				quantity: template.quantity,
				units: template.units,
				basis: template.basis,
				semantics: template.semantics,
				values,
				provenanceIdentity: `strobing-physical-cubic:${[a, b, c, d].map((sample) => sample.measurement.diffuseHorizontal.contentHash).join(':')}:${seconds}`,
			})
		);
		const direct = exactMode.algorithm32.receiverLight;
		return exactMode.algorithm32._localLightLevelCalculator.combineReceiverLight({
			identity: `creative-receiver:${exactMode.algorithm32.config.config.observation.instant}:${diffuseHorizontal.contentHash}`,
			directNormal: direct.directNormal,
			directHorizontal: direct.directHorizontal,
			diffuseHorizontal,
			stellarAdaptationLuminance: {
				value: StrobingHermite.value(
					a.measurement.stellarAdaptationLuminance.value,
					b.measurement.stellarAdaptationLuminance.value,
					c.measurement.stellarAdaptationLuminance.value,
					d.measurement.stellarAdaptationLuminance.value,
					t,
				),
				units: 'cd m^-2',
			},
		});
	}
	/**
	 * Publish exact source direction through the current shared runtime's binding owner.
	 * The original adapter assigns the shader uniform; the current runtime refreshes it
	 * from this binding on each render, so both must describe the same exact instant.
	 * @param {CreativeSolarMode} exactMode Exact-time model.
	 * @param {ReceiverEnvironmentLightMeasurement} receiverLight Physical lighting.
	 * @returns {void}
	 */
	_publishBindings(exactMode, receiverLight) {
		super._publishBindings(exactMode, receiverLight);
		const runtime = /** @type {StrobingAtmosphereRuntime} */ (this._application._modeController._activeRuntime);
		const direction = exactMode.geometry.configuration.directionToSource;
		const binding = runtime._bindingValues['lightSource.direction'];
		if (binding) binding.set(...direction);
	}
	/** @returns {CreativeSolarDescription} - Actual physical interpolation provenance. */
	describe() {
		const description = super.describe();
		if (this._captureConfiguration.lightingInterpolation === 'monotone-cubic')
			description.lightingPolicy =
				'Exact-time direct spectra; monotone cubic interpolation through the original one-second GPU-measured Native15 diffuse spectra and sky adaptation, preserving every measured endpoint.';
		return description;
	}
}
