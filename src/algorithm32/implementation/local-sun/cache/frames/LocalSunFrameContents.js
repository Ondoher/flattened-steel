/**
 * Complete engine-owned staging result, assembled from one accepted request.
 * Consumers borrow these facts without mutation; operations retain their own lifetimes.
 */
export class LocalSunFrameContents {
	/** @type {true} */ shaderReady = true;
	/** @type {ReceiverEnvironmentLightMeasurement} */ receiverLight;
	/** @type {LocalSunFrameCelestialInputs} */ celestialInputs;
	/** @type {Record<string, unknown>} */ bindingValues;
	/** @type {LocalSunFrameRenderOperation} */ renderFrame;
	/** @type {() => void} */ dispose;
	/** @type {LocalSunFrameSceneLighting | undefined} */ sceneView;
	/** @type {LocalSunFrameSceneLighting | undefined} */ sceneLighting;
	/** @type {ShaderHandle['getDiagnostics'] | undefined} */ getDiagnostics;
	/** @type {(() => void) | undefined} */ validateView;
	/** @type {LocalSunFramePreflight | undefined} */ preflight;

	/**
	 * Creates a staged aggregate from accepted physical facts, completed light and owned operations.
	 * This internal constructor is used by owned renderer collaborators, not arbitrary providers.
	 *
	 * @param {LocalSunFrameStageRequest} request - Accepted immutable candidate.
	 * @param {ReceiverEnvironmentLightMeasurement} receiverLight - Matching completed engine measurement.
	 * @param {LocalSunOwnedFrameOperations} operations - Compiled/preflighted rendering and exact cleanup.
	 */
	constructor(request, receiverLight, operations) {
		Object.assign(this, operations);
		this.receiverLight = receiverLight;
		let geometry = request.profile.models.geometry.configuration;
		let source = request.profile.models.lightSource.configuration;
		this.celestialInputs = {
			observation: geometry.observation,
			sourcePosition: source.position,
			receiverPosition: geometry.observerPosition,
			sourceRadius: source.radius,
			stellarAdaptationLuminance: receiverLight.stellarAdaptationLuminance,
			receiverLightIdentity: receiverLight.identity,
		};
	}
}
