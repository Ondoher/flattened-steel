/** Physical local-Sun facade contract used by endpoint scene lighting. */
type LocalSunSceneLightingSource = Pick<LightSourceModel, 'sampleDirectLighting'> &
	Readonly<{
		/**
		 * Call this method to resolve source-owned neutral scene-light scales.
		 *
		 * @param request - The source-relative observer facts.
		 * @returns - The neutral scene-light scales.
		 */
		resolveSceneLightScales(request?: LightSourceSceneLightScalesRequest): LightSourceSceneLightScales;
	}>;

/** Constructor values for a local-Sun endpoint scene-lighting adapter. */
type LocalSunSceneLightingAdapterDefinition = Readonly<{
	/** Physical source facade used for dynamically dispatched lighting samples. */
	readonly source: LocalSunSceneLightingSource;
	/** Normalized source configuration retained by reference. */
	readonly configuration: LocalSunLightSourceConfiguration;
}>;
