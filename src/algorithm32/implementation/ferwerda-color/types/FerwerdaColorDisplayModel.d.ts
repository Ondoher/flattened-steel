export declare class FerwerdaColorDisplayModel implements Color {
	constructor(configuration: FerwerdaColorDisplayModelConfiguration);
	readonly id: string;
	readonly adaptation: FerwerdaAdaptationInput;
	readonly parameters: FerwerdaSteadyStateParameters;
	convert(request: ColorConversionRequest): ColorSample;
	composeSceneLinearSrgb(request: SceneDisplayCompositionRequest): readonly [number, number, number];
	composeSceneDisplayRgb(request: SceneDisplayCompositionRequest): readonly [number, number, number];
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution;
}
