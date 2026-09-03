interface ViewPresentationFilterRegistry {
	readonly id: string;
	readonly identity: string;
	readonly enabled: boolean;
	readonly filters: readonly Readonly<Record<string, unknown>>[];
	createShaderContribution(): ShaderContribution;
	createStellarSourceLinearShaderHook(): Readonly<{
		readonly id: string;
		readonly registryIdentity: string;
		readonly scotopicWeightsIdentity: string | null;
		readonly stage: 'source-linear';
		readonly target: 'stellar';
		readonly source: string;
	}>;
}
