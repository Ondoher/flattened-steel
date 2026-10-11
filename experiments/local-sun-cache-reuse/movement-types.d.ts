/** Exact saved current-movement artifact, including independent numerical packets. */
type LocalSunCurrentMovementEntry = LocalSunRotationAngleSummary & {
	/** Unique key from the frozen synthetic or orbital matrix. */ artifactKey: number;
	/** Exact frozen orbital fixture id; synthetic poses use Flat0. */ stateId: string;
	/** Exact unmodified observation, without film-time interpolation. */ exactTime: GeometryObservation;
	/** Same-state fresh/reused receiver direction radiances, Native15. */ receiverRays: {
		/** Complete fixed 32-direction quadrature on the fresh cache. */ fresh: LocalSunRotationGpuRayResult[];
		/** Same directions on the retained canonical cache. */ reused: LocalSunRotationGpuRayResult[];
	};
	/** Complete measured receiver reuse residual. */ receiverReuse: LocalSunRotationResidual;
	/** All 96 directions and Native15 packets; equivalent directions transform observer and source together. */ rays: {
		/** Fresh field, world-fixed camera. */ cpuFresh: LocalSunRotationRayResult[];
		/** Retained canonical field, current camera/source frame. */ cpuReused: LocalSunRotationRayResult[];
		/** Actual fresh GPU cache packets. */ gpuFresh: LocalSunRotationGpuRayResult[];
		/** Actual retained canonical GPU cache packets. */ gpuReused: LocalSunRotationGpuRayResult[];
		/** Co-transformed CPU paths, preserving continuous-model symmetry. */ equivalentCpu: LocalSunRotationRayResult[];
		/** Co-transformed GPU paths at identical physical state. */ equivalentGpu: LocalSunRotationGpuRayResult[];
	};
};
