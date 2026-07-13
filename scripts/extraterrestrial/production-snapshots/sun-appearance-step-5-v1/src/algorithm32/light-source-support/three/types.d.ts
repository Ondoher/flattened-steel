/** Type that configures source-owned neutral scene-light scale resolution. */
type LightSourceSceneLightScalesRequest = {
	/** Value that provides source-relative facts for local finite-source light scaling. */
	readonly sourceRelativePosition?: SourceRelativePosition;

	/** Value that provides the source direction in scene space. */
	readonly directionToSource?: UnitVector3;

	/** Value that stores local scene up direction at the observer. */
	readonly observerUp?: UnitVector3;

	/** Value that stores the source-up dot-product value where twilight ambient begins. */
	readonly twilightStartSourceUpDot?: number;

	/** Value that stores the source-up dot-product value where ambient reaches full daylight. */
	readonly fullAmbientSourceUpDot?: number;
};

/** Type that describes source-owned neutral scene-light scales. */
type LightSourceSceneLightScales = {
	/** Value that stores the neutral direct source-light scale. */
	readonly directLightScale: Dimensionless;

	/** Value that stores the neutral ambient/fill scene-light scale. */
	readonly ambientLightScale: Dimensionless;

	/** Value that stores the preferred aggregate neutral local-light scale. */
	readonly localLightScale: Dimensionless;

	/** Value that stores the source direction dot local up direction. */
	readonly sourceUpDot?: number;

	/** Value that stores owner-specific policy metadata. */
	readonly policy?: string;
};

/**
 * Local endpoint scene-light scaling policy.
 *
 * - **"endpoint-material-shading"** - Transport-neutral endpoint material lighting.
 * - **"observer-incident-scale"** - Endpoint lighting scaled to observer incident intensity.
 */
type LocalSunEndpointSceneLightScalePolicy = 'endpoint-material-shading' | 'observer-incident-scale';

/**
 * Local endpoint indirect-fill approximation policy.
 *
 * - **"general-ambient-fill"** - Additional scene-wide ambient fill.
 * - **"opposite-directional-fill"** - Directional fill opposite the source.
 * - **"source-direction-falloff-fill"** - Distance-decaying fill toward the source.
 */
type LocalSunEndpointIndirectFillPolicy =
	'general-ambient-fill' | 'opposite-directional-fill' | 'source-direction-falloff-fill';

/** Type that configures source-owned Three endpoint lighting object creation. */
type LightSourceThreeLightingRequest = {
	/** Value that provides the caller's Three namespace with lighting constructors. */
	readonly THREE: unknown;

	/** Optional callback that provides the Three scene to receive created lighting objects. */
	readonly scene?: unknown;

	/** Value that provides source-relative facts for local finite-source lighting. */
	readonly sourceRelativePosition?: SourceRelativePosition;

	/** Value that provides the finite source scene-space position for local sources. */
	readonly sourcePosition?: ScenePosition;

	/** Value that provides the observer scene-space position used for local source direction. */
	readonly observerPosition?: ScenePosition;

	/** Value that provides the focus/target scene-space point for distant directional lights. */
	readonly focus?: ScenePosition;

	/** Value that provides the source direction in scene space. */
	readonly directionToSource?: UnitVector3;

	/**
	 * Override distant directional light placement distance in scene units.
	 */
	readonly lightDistance?: SceneDistance;

	/**
	 * Override distant source Three light intensity.
	 */
	readonly intensity?: number;

	/** Value that stores local source endpoint light calibration scalar. */
	readonly calibrationScalar?: number;

	/** Value that stores ambient fill intensity. */
	readonly ambientIntensity?: number;

	/** Value that stores source-scaled ambient fill intensity bounds. */
	readonly ambientIntensityRange?: LightSourceSceneAmbientIntensityRange;

	/** Value that configures optional endpoint indirect fill for local sources. */
	readonly endpointIndirectFill?: LightSourceThreeEndpointIndirectFillRequest;

	/** Value that stores diagnostic endpoint color/shading status. */
	readonly endpointColorStatus?: string;

	/**
	 * Optional scaling policy for local endpoint scene lights.
	 */
	readonly endpointSceneLightScalePolicy?: LocalSunEndpointSceneLightScalePolicy;

	/** Value that configures optional Three shadow-map support. */
	readonly shadow?: LightSourceThreeShadowRequest;
};

/** Type that returns source-owned Three lighting objects. */
type LightSourceThreeLightingObjects = {
	/** Value that stores Three lights the app should add to the scene/composer render. */
	readonly lights: readonly unknown[];

	/** Value that stores required non-light scene objects such as directional-light targets. */
	readonly sceneObjects?: readonly unknown[];

	/** Value that stores owner-specific placement, intensity, shadow, and scale metadata. */
	readonly metadata: unknown;
};

/** Type that configures source-scaled ambient intensity bounds. */
type LightSourceSceneAmbientIntensityRange = {
	/** Value that stores the minimum ambient intensity. */
	readonly min?: number;

	/** Value that stores the maximum ambient intensity. */
	readonly max?: number;
};

/** Accepted lower and upper bounds for source-scaled ambient intensity. */
type LightSourceSceneAmbientIntensityBounds = Readonly<{
	/** Minimum ambient-light intensity. */
	readonly min: number;
	/** Maximum ambient-light intensity. */
	readonly max: number;
}>;

/** Type that configures optional source-owned Three shadow helpers. */
type LightSourceThreeShadowRequest = {
	/**
	 * Enable or disable shadow object creation/configuration.
	 */
	readonly enabled: boolean;

	/** Value that stores keyed shadow objects. Each object request creates one source-owned directional shadow light focused on that object. */
	readonly objects: readonly LightSourceThreeShadowObjectRequest[];
};

/** Type that configures one source-owned Three shadow object. */
type LightSourceThreeShadowObjectRequest = {
	/** Value that stores optional object key metadata. */
	readonly objectKey?: string;

	/** Value that stores optional Three layer index used to scope a source-owned shadow camera to matching casters. */
	readonly layerIndex?: number;

	/** Value that stores the shadow focus/target scene-space point. */
	readonly focus?: ScenePosition;

	/** Value that stores orthographic shadow extent in scene units. */
	readonly extent?: SceneDistance;

	/** Value that stores optional asymmetric orthographic shadow camera bounds. */
	readonly cameraLeft?: SceneDistance;
	/** Value that stores the camera right extent. */
	readonly cameraRight?: SceneDistance;
	/** Value that stores the camera top extent. */
	readonly cameraTop?: SceneDistance;
	/** Value that stores the camera bottom extent. */
	readonly cameraBottom?: SceneDistance;

	/** Value that stores light placement distance in scene units. */
	readonly lightDistance?: SceneDistance;

	/** Value that stores shadow camera near plane in scene units. */
	readonly cameraNear?: SceneDistance;

	/** Value that stores shadow camera far plane in scene units. */
	readonly cameraFar?: SceneDistance;

	/** Value that stores shadow-map width and height in pixels. */
	readonly mapSize?: PixelSize;

	/** Value that stores shadow bias. */
	readonly bias?: number;

	/** Value that stores normal shadow bias in scene units. */
	readonly normalBias?: SceneDistance;

	/** Value that stores Three shadow PCF radius in pixels. */
	readonly radius?: PixelDistance;

	/** Value that stores Three shadow opacity for source-owned shadow maps. */
	readonly shadowIntensity?: number;
};

/** Type that configures optional local endpoint indirect fill lighting. */
type LightSourceThreeEndpointIndirectFillRequest = {
	/**
	 * Enable or disable indirect fill lighting.
	 */
	readonly enabled: boolean;

	/**
	 * Optional indirect-fill approximation policy.
	 */
	readonly policy?: LocalSunEndpointIndirectFillPolicy;

	/** Value that stores fill intensity relative to the source-driven endpoint light. */
	readonly intensityRatio?: number;

	/** Value that stores fill placement distance in scene units. */
	readonly distance?: SceneDistance;
};

/** Source-owned metadata applied to a configured Three shadow object tree. */
type LightSourceThreeShadowOwner = Readonly<{
	/** Identifier of the light-source facade that owns the shadow policy. */
	readonly owner: string;
	/** Stable key of the source that owns the configured object tree. */
	readonly sourceKey: string;
	/** Renderer shadow policy associated with the source. */
	readonly shadowPolicy: string;
}>;

/** Mutable Three object surface configured for source shadows. */
type ThreeShadowNode = {
	/** Shadow-casting selection for this object. */
	castShadow?: boolean;
	/** Shadow-receiving selection for this object. */
	receiveShadow?: boolean;
	/** Renderer-neutral Algorithm32 metadata. */
	userData?: Record<string, unknown>;
	/** Optional renderer layer interface. */
	layers?: {
		/**
		 * Call this method to enable one renderer layer.
		 *
		 * @param layerIndex - The renderer layer index.
		 * @returns - No value.
		 *
		 */
		enable?(layerIndex: number): void;
	};
	/**
	 * Call this method to traverse this object and its descendants.
	 *
	 * @param callback - The node visitor.
	 * @returns - No value.
	 *
	 */
	traverse?(callback: ThreeLightingObjectVisitor): void;
};

/** Operation that visits one renderer object in a lighting subtree. */
type ThreeLightingObjectVisitor =
	/**
	 * Called by renderer traversal to visit one lighting object.
	 * @param node - The visited renderer object.
	 */ (node: unknown) => void;
