import {SpectralMath} from '../../spectral-values/index.js';
import {
	RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE,
	RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE_IDENTITY,
} from './ReceiverEnvironmentLightQuadrature.js';
import {LocalLightLevelCalculator} from './LocalLightLevelCalculator.js';

/** Atomic owner of the receiver-local environmental-light measurement. */
export class ReceiverEnvironmentLightController {
	/**
	 * @param {ReceiverEnvironmentControllerConfiguration} dependencies - Physical reduction owner and fixed direct state.
	 */
	constructor({calculator, directLight, identity}) {
		if (typeof calculator?.measureEnvironmentIrradiance !== 'function') {
			throw new TypeError('Receiver environment-light controller requires a lighting calculator.');
		}
		if (!directLight?.directNormal || !directLight?.directHorizontal) {
			throw new TypeError('Receiver environment-light controller requires complete direct light.');
		}
		this._calculator = calculator;
		this._directLight = directLight;
		const diffuseHorizontal = /** @type {SpectralIrradiancePacket} */ (
			SpectralMath.scaleSpectralPacket(directLight.directHorizontal, 0, {
				provenanceIdentity: `receiver-diffuse-horizontal:unmeasured-dark:${directLight.directHorizontal.contentHash}`,
			})
		);
		this._active = calculator.combineReceiverLight({
			identity: this._measurementIdentity(identity, diffuseHorizontal),
			directNormal: directLight.directNormal,
			directHorizontal: directLight.directHorizontal,
			diffuseHorizontal,
			stellarAdaptationLuminance: {value: 0, units: 'cd m^-2'},
		});
	}

	/** @type {ReceiverEnvironmentCalculator} */ _calculator;
	/** @type {ReceiverDirectLightMeasurement} */ _directLight;
	/** @type {ReceiverEnvironmentLightMeasurement | null} */ _active;
	/** @type {string | null} */ _activeRequestIdentity = null;
	/** @type {boolean} */ _disposed = false;
	/** @type {number} */ _generation = 0;

	/** @returns {ReceiverEnvironmentLightMeasurement | null} - Last complete measurement. */
	get active() {
		return this._active;
	}

	/** Call this method to adopt a complete independently prepared live-scene measurement.
	 * @param {ReceiverEnvironmentLightMeasurement} measurement - Complete native spectral light state.
	 * @returns {ReceiverEnvironmentLightMeasurement} - Revalidated current measurement.
	 */
	adoptPreparedMeasurement(measurement) {
		if (this._disposed) throw new Error('Receiver environment-light controller is disposed.');
		const accepted = this._calculator.combineReceiverLight({
			identity: measurement.identity,
			directNormal: measurement.directNormal,
			directHorizontal: measurement.directHorizontal,
			diffuseHorizontal: measurement.diffuseHorizontal,
			stellarAdaptationLuminance: measurement.stellarAdaptationLuminance,
		});
		this._generation += 1;
		this._activeRequestIdentity = null;
		this._active = accepted;
		this._directLight = {
			...this._directLight,
			directNormal: accepted.directNormal,
			directHorizontal: accepted.directHorizontal,
		};
		return accepted;
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
		if (this._activeRequestIdentity === request.identity)
			return /** @type {ReceiverEnvironmentLightMeasurement} */ (this._active);
		const generation = ++this._generation;
		this._assertBuildCurrent(generation, request.signal);

		const radiances = await request.sampleIncomingRadiance(RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE);
		this._assertBuildCurrent(generation, request.signal);
		if (!Array.isArray(radiances) || radiances.length !== RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length) {
			throw new RangeError('Receiver environment-light build must return one radiance per quadrature direction.');
		}
		const diffuseHorizontal = request.reduceIncomingRadiance
			? await request.reduceIncomingRadiance(radiances)
			: this._calculator.measureEnvironmentIrradiance({
					samples: radiances.map((spectralRadiance, index) => ({
						spectralRadiance,
						irradianceWeightSteradians:
							RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE[index].irradianceWeightSteradians,
					})),
				});
		const stellarAdaptationLuminance = this._calculator.measureMedianSkyLuminance(radiances);
		this._assertBuildCurrent(generation, request.signal);
		const measurement = this._calculator.combineReceiverLight({
			identity: this._measurementIdentity(request.identity, diffuseHorizontal),
			directNormal: this._directLight.directNormal,
			directHorizontal: this._directLight.directHorizontal,
			diffuseHorizontal,
			stellarAdaptationLuminance,
		});
		this._assertBuildCurrent(generation, request.signal);
		this._active = measurement;
		this._activeRequestIdentity = request.identity;
		return measurement;
	}

	/** Derive a complete invalidation identity from every fixed and measured input. */
	_measurementIdentity(identity, diffuseHorizontal) {
		if (typeof identity !== 'string' || identity.length === 0) {
			throw new TypeError('Receiver environment-light identity must be a non-empty string.');
		}
		return [
			identity,
			`basis-${this._directLight.directNormal.basis.contentHash}`,
			`direct-normal-${this._directLight.directNormal.contentHash}`,
			`direct-horizontal-${this._directLight.directHorizontal.contentHash}`,
			`diffuse-horizontal-${diffuseHorizontal?.contentHash ?? 'pending'}`,
			RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE_IDENTITY,
		].join(':');
	}

	/** Reject aborted, disposed, or superseded work before publication. */
	_assertBuildCurrent(generation, signal) {
		if (signal?.aborted) {
			const error = new Error('Receiver environment-light build was cancelled.');
			error.name = 'AbortError';
			throw error;
		}
		if (this._disposed) throw new Error('Receiver environment-light controller was disposed during build.');
		if (generation !== this._generation) {
			throw new Error('Receiver environment-light build was superseded.');
		}
	}

	/** Release the published measurement and reject later builds. */
	dispose() {
		this._disposed = true;
		this._generation += 1;
		this._active = null;
		this._activeRequestIdentity = null;
	}
}
