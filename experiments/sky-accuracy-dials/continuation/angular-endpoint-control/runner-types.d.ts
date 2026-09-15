/** Immutable replay rows supplement the unchanged original analytic input. */
type SkyAngularEndpointInput = SkyAngularFrameControlInput &
	Readonly<{
		replay: readonly SkyAngularFrameControlRule[];
	}>;
