import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from './ReceiverEnvironmentLightQuadrature.js';
import {LocalLightLevelCalculator} from './LocalLightLevelCalculator.js';

/** Atomic owner of the receiver-local environmental-light measurement. */
export class ReceiverEnvironmentLightController {
	/**
	 * @param {{calculator: LocalLightLevelCalculator}} dependencies - Physical reduction owner.
	 */
	constructor({calculator}) {
		if (typeof calculator?.measureEnvironmentIrradiance !== 'function') {
			throw new TypeError('Receiver environment-light controller requires a lighting calculator.');
		}
		this._calculator = calculator;
	}

	/** @type {LocalLightLevelCalculator} */ _calculator;
	/** @type {ReceiverEnvironmentLightMeasurement | null} */ _active = null;
	/** @type {boolean} */ _disposed = false;

	/** @returns {ReceiverEnvironmentLightMeasurement | null} - Last complete measurement. */
	get active() {
		return this._active;
	}

	/**
	 * Build and atomically publish one complete receiver-local measurement.
	 * A rejected or incomplete batch leaves the prior measurement active.
	 *
	 * @param {ReceiverEnvironmentLightBuildRequest} request - Identity and batch radiance sampler.
	 * @returns {Promise<ReceiverEnvironmentLightMeasurement>} - Published measurement.
	 */
	async build(request) {
		if (this._disposed) throw new Error('Receiver environment-light controller is disposed.');
		if (typeof request?.identity !== 'string' || request.identity.length === 0) {
			throw new TypeError('Receiver environment-light build identity must be a non-empty string.');
		}
		if (typeof request.sampleIncomingRadiance !== 'function') {
			throw new TypeError('Receiver environment-light build requires sampleIncomingRadiance.');
		}
		if (this._active?.identity === request.identity) return this._active;

		const radiances = await request.sampleIncomingRadiance(RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE);
		if (!Array.isArray(radiances) || radiances.length !== RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length) {
			throw new RangeError('Receiver environment-light build must return one radiance per quadrature direction.');
		}
		const spectralIrradiance = request.reduceIncomingRadiance
			? await request.reduceIncomingRadiance(radiances)
			: this._calculator.measureEnvironmentIrradiance({
			samples: radiances.map((spectralRadiance, index) => ({
				spectralRadiance,
				irradianceWeightSteradians:
					RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE[index].irradianceWeightSteradians,
			})),
		});
		const brightnessProxy = this._calculator.measureDirectIrradiance(spectralIrradiance).adaptingLuminanceProxy;
		const measurement = Object.freeze({identity: request.identity, spectralIrradiance, brightnessProxy});
		if (this._disposed) throw new Error('Receiver environment-light controller was disposed during build.');
		this._active = measurement;
		return measurement;
	}

	/** Release the published measurement and reject later builds. */
	dispose() {
		this._disposed = true;
		this._active = null;
	}
}
