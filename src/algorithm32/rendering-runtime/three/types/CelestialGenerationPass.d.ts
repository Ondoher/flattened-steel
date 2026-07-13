/** Runtime methods required from the optional stellar child of the celestial coordinator. */
interface CelestialGenerationStellarChild extends StellarScreenPaletteGenerationPipelineParticipant {
	/** Execute generation for the captured frame. */
	render(renderer: ShaderRuntimePassRenderer): void;
	/** Allocate and initialize renderer-owned resources. */
	prepare(renderer: ShaderRuntimePassRenderer): Promise<void>;
	/** Return exact-zero consumer textures independent of publication state. */
	zeroConsumerBindingValues(): Readonly<{
		readonly 'runtime.celestial.stellarScreenIndex': unknown;
		readonly 'runtime.celestial.stellarPalette': unknown;
	}>;
}

/** Runtime methods required from the source-local Sun child of the celestial coordinator. */
interface CelestialGenerationSunChild {
	readonly stages: readonly CelestialGenerationStageDescription[];
	readonly publicationState: Readonly<{
		readonly active: CelestialSunTileGeneration | null;
		readonly dirtyReason: CelestialGenerationDirtyReason | null;
	}>;
	bindingValues(): Readonly<Record<string, unknown>> | null;
	consumerBindingValues(): Readonly<Record<string, unknown>>;
	zeroConsumerBindingValues(): Readonly<Record<string, unknown>>;
	markDirty(reason: CelestialGenerationDirtyReason): void;
	prepare(renderer: ShaderRuntimePassRenderer): Promise<void>;
	setSize(width: number, height: number): void;
	render(renderer: ShaderRuntimePassRenderer): void;
	handleContextLoss(): void;
	handleContextRestoration(): void;
	getDiagnostics(): unknown;
	dispose(): void;
}

/** Child stages coordinated as one all-or-zero celestial publication. */
type CelestialGenerationPassConfiguration = Readonly<{
	readonly stellar: CelestialGenerationStellarChild | null;
	readonly sun: CelestialGenerationSunChild;
}>;
