/** Executable local-solar-zenith interpolation domain. */
export default class SolarZenithDomain implements SolarZenithDomain {
	/** Creates one uniform cell-center local-solar-zenith domain. */
	constructor(definition: SolarZenithDomainDefinition);
	readonly id: string;
	readonly count: number;
	readonly firstCenter: Angle;
	readonly spacing: Angle;
	readonly nodes: readonly SolarZenithNode[];
	/** Call this method to resolve a physical local-solar-zenith angle. */
	resolveStencil(angle: Angle): SolarZenithStencil;
}
