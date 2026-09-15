/** Independent final-view integration coordinate and quadrature family. */
type SkySecondOrderOuterKind = 'gauss-height' | 'gauss-distance' | 'simpson-height';

/** Complete fixed rule; every retained node is a distinct interval contribution. */
type SkySecondOrderOuterRule = Readonly<{
	/** Gaussian square-root height, Gaussian distance, or Simpson square-root height. */ kind: SkySecondOrderOuterKind;
	/** Gaussian node count or even Simpson panel count per physical interval. */ count: number;
	/** Ordered contributions, retaining duplicated physical interval endpoints. */ nodes: SkySecondOrderViewNode[];
	/** True only when the exact y=0 Simpson endpoint was omitted because ds/dy=0. */ groundEndpointAnalyticZero: boolean;
}>;

/** Manufactured constant-extinction integral comparison, without atmospheric evaluation. */
type SkySecondOrderOuterExtinctionError = Readonly<{
	/** Constant attenuation coefficient in inverse metres. */ extinctionPerMeter: number;
	/** Absolute error against the analytic path integral, in metres. */ absoluteErrorMeters: number;
}>;

/** Actual coarse-rule approximation errors; finite errors are observations, not admission bounds. */
type SkySecondOrderOuterObservation = Readonly<{
	/** Original frozen view. */ probeId: string;
	/** Actual integration formulation. */ kind: SkySecondOrderOuterKind;
	/** Gaussian nodes or Simpson panels per interval. */ count: number;
	/** Absolute constant-source integral error, in metres. */ pathErrorMeters: number;
	/** Errors against independent constant-extinction analytic integrals. */ extinctionErrors: readonly SkySecondOrderOuterExtinctionError[];
}>;

/** Independent dense Simpson convergence check; these counts are not public runtime controls. */
type SkySecondOrderOuterConvergence = Readonly<{
	/** Original frozen view. */ probeId: string;
	/** Zero means a constant source without extinction. */ extinctionPerMeter: number;
	/** Dense proof-only Simpson panels per interval. */ panelCounts: readonly number[];
	/** Absolute analytic integral errors in panel-count order, in metres. */ absoluteErrorsMeters: readonly number[];
}>;

/** Focused in-memory geometry and mathematics proof, never a sealed physical result. */
type SkySecondOrderOuterProof = Readonly<{
	/** Distinct proof identity. */ schemaId: string;
	/** Actual executed assertions. */ checks: number;
	/** Largest normalized polynomial-moment error. */ maximumMomentError: number;
	/** Public-rule approximation observations at both frozen views. */ observations: readonly SkySecondOrderOuterObservation[];
	/** Dense independent Simpson checks against analytic integrals. */ convergence: readonly SkySecondOrderOuterConvergence[];
}>;
