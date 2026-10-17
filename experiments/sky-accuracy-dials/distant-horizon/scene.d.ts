/** Exact physical controls for paired scene captures. */
type AttributionSceneControl={readonly baseline:DistantSunSceneCacheCompilerBuildRequest;readonly candidate:DistantSunSceneCacheCompilerBuildRequest;readonly profile:'canonical'|'toronto';readonly material:HorizonAerosolMaterial|null};
/** Ordered Float32 cumulative source density and sparse pure-order witnesses. */
type AttributionSceneChannel={readonly total:Float32Array;readonly orders:readonly (readonly number[])[]};
