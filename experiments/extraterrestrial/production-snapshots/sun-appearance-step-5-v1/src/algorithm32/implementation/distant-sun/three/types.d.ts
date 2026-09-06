/** Facade-owned scene-scale operation used by distant-Sun Three lighting. */
type DistantSunSceneLightingSource = Readonly<{
	/**
	 * Call this method to resolve neutral distant-source scene-light scales.
	 *
	 * @param request - The optional source direction, local up vector, and twilight bounds.
	 * @returns - The direct and twilight-aware ambient scales.
	 */
	resolveSceneLightScales(request?: LightSourceSceneLightScalesRequest): LightSourceSceneLightScales;
}>;
