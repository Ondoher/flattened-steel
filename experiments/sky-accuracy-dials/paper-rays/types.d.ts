/** Frozen matched paper ray and cache-free physical packet. */
type PaperRayWitness = {
	id: string;
	time: string;
	t: number;
	x: number;
	y: number;
	ray: number;
	elevation: number;
	separation: number;
	heading: number;
	medium: HorizonReferenceMedium;
	origin: number[];
	direction: number[];
	end: number;
};
/** Inputs shared by all three independent implementations; spectral arrays use Direct40. */
type PaperRayPacket = {
	parents: DialFileIdentity[];
	centers: number[];
	grass: number[];
	lux: number;
	rays: PaperRayWitness[];
	base: B1DiagnosticCase;
	joint: B1DiagnosticCase;
};
/** One external MYSTIC prefix or all-order case. */
type PaperRayLibConfig = {
	id: string;
	ray: number;
	order: number;
	repeat: number;
	photons: number;
	layers: number;
	importance: boolean;
	channels: number[];
	black?: boolean;
};
/** One authenticated external result in W spectral-radiance units. */
type PaperRayLibReading = {
	config: PaperRayLibConfig;
	spectrum: number[];
	toolRun: string;
	elapsedMilliseconds: number;
	raw: DialFileIdentity;
};
/** One independent GPU batch with an explicit Direct40 channel. */
type PaperRayGpuBatch = HorizonReferenceBatch & {channel: number};
/** Physical-order radiance and empirical reference sampling interval. */
type PaperRayBudgetRow = {
	ray: number;
	method: string;
	order: number;
	spectrum: number[];
	Y: number;
	Yhalf: number;
	interpretation: string;
};
