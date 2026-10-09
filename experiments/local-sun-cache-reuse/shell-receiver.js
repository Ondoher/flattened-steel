import {gpuRays} from './rotation-gpu.js';
import {LocalLightLevelCalculator} from '../../src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js';
import {ReceiverEnvironmentLightController} from '../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightController.js';
import {ReceiverEnvironmentLightGpuReducer} from '../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightGpuReducer.js';
import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from '../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightQuadrature.js';
import {SpectralPacket,SPECTRAL_QUANTITIES,SPECTRAL_UNITS} from '../../src/algorithm32/spectral-values/index.js';

/** Measure exact receiver lighting with cooperative GPU readback and owned retention.
 * The canonical 32 directions, transport equations, FP32 ingress and GPU
 * irradiance reduction are retained. No film-time interpolation is applied.
 * @implements {LocalSunShellReceiverContract}
 */
export class ShellReceiver {
	/** Frame-owned receiver material retained until that frame retires. @type {LocalSunShellReceiverProgram} */ program={material:null,source:''};
	/** Frame-owned fixed-quadrature GPU reducer. @type {ReceiverEnvironmentLightGpuReducer} */ reducer;
	/** Terminal resource state. @type {boolean} */ disposed=false;

	/** Own receiver resources over the external shared cache backend.
	 * @param {CacheGpuBackend & CacheProbeReader} backend - Borrowed resource-owned backend.
	 */
	constructor(backend){this.reducer=new ReceiverEnvironmentLightGpuReducer({backend,retainProgram:true});}

	/** Prepare a complete receiver packet; publication remains the frame owner's responsibility.
	 * @param {LocalSunShellReceiverRequest} request - Exact model, cache and renderer; directions are supplied internally.
	 * @param {GeometryObservation} observation - Exact same-state observation.
	 * @param {string} identity - Complete current frame identity.
	 * @returns {Promise<ReceiverEnvironmentLightMeasurement>} - Unpublished exact-state measurement.
	 */
	async prepare(request,observation,identity) {
		if(this.disposed)throw new Error('Shell receiver is disposed.');
		const {owners}=request,calculator=new LocalLightLevelCalculator({lightSource:owners.source});
		const directLight=calculator.measureConfiguredReceiverDirectLight({geometry:owners.geometry,atmosphere:owners.model.atmosphere,observation});
		const controller=new ReceiverEnvironmentLightController({calculator,directLight,identity});
		const directions=RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.map(sample=>owners.geometry.mapObserverLocalSceneDirectionToModelDirection([sample.directionLocal[0],sample.directionLocal[2],sample.directionLocal[1]]));
		try {
			return await controller.build({identity,signal:request.signal,sampleIncomingRadiance:async()=>{
				const rays=await gpuRays({...request,directions,receiverDirections:true,cooperativeReadback:true,programRetention:this.program});
				return rays.map(ray=>/** @type {SpectralRadiancePacket} */(new SpectralPacket({basis:owners.model.spectral.basis,quantity:SPECTRAL_QUANTITIES.RADIANCE_DENSITY,units:SPECTRAL_UNITS.RADIANCE_DENSITY,
					semantics:'contiguous-wavelength-bin-average',values:ray.radiance,provenanceIdentity:'shell-exact-cooperative-receiver-v1:'+owners.profile.contentHash})));
			},reduceIncomingRadiance:radiances=>this.reducer.reduce({radiances,signal:request.signal})});
		} finally {controller.dispose();}
	}

	/** Retire the receiver after every in-flight preparation has settled.
	 * @returns {void} - Idempotent; shared fields/backend remain borrowed.
	 */
	dispose(){if(this.disposed)return;this.disposed=true;try{this.program.material?.dispose();this.program.material=null;}finally{this.reducer.dispose();}}
}
