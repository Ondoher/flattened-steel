/** One physical cache lookup, with construction coordinates retained in binary64. */
type P2GpuViewSample = {
	direction: number[];
	zenith: number;
	altitudes: {index: number; weight: number}[];
	altitude: number;
	step: number;
};
/** One point lookup or complete Q30 atmosphere ray. */
type P2GpuViewJob = {id: string; integrate: boolean; samples: P2GpuViewSample[]};
/** One bounded set of complete packet rows for all requested scattering orders. */
type P2GpuViewBatch = {
	jobs: P2GpuViewJob[];
	addresses: string;
	packets: string[][];
};
/** Explicit physical coefficients and authenticated packet inputs sent to the browser. */
type P2GpuViewControl = {
	batches: P2GpuViewBatch[];
	rayleigh: number[];
	mie: number[];
	rayleighScaleHeight: number;
	mieScaleHeight: number;
};
/** Matrix identity and stencils used by a browser job and its independent arithmetic oracle. */
type P2GpuViewPreparedJob = {
	job: P2GpuViewJob;
	queryIndex: number;
	rayIndex: number | null;
	traversal: 'sunrise' | 'sunset';
	stencils: P2PhysicalStencil[];
};
/** Bounded staging inventory prior to serialized packet creation. */
type P2GpuViewPreparedBatch = {jobs: P2GpuViewPreparedJob[]; rows: string[]};
