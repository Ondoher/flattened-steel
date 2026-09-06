import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from './ReceiverEnvironmentLightQuadrature.js';

/** Independent binary64/reference sampler for the fixed receiver hemisphere. */
export class ReceiverEnvironmentLightTransportCpuSampler {
	/** @param {{reference: ReferenceExecution}} dependencies - Configured CPU reference execution. */
	constructor({reference}) {
		this._reference = reference;
	}

	/** Execute the CPU transport oracle for every canonical receiver-local direction. */
	sample() {
		return RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.map((sample) => {
			const directionSceneLocal = /** @type {UnitVector3} */ ([
				sample.directionLocal[0],
				sample.directionLocal[2],
				sample.directionLocal[1],
			]);
			const direction = this._reference.model.geometry.mapObserverLocalSceneDirectionToModelDirection(
				directionSceneLocal,
			);
			return this._reference.evaluate({viewRay: {direction}}).pathRadiance;
		});
	}
}
