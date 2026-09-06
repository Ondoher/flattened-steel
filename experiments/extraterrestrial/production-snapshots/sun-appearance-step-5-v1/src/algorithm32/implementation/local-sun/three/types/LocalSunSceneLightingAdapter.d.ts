/** Point-light construction facts owned by the local-Sun scene adapter. */
type LocalSunPointLightRequest = Readonly<{
	/** Three lighting constructors. */
	THREE: LocalThreeNamespace;
	/** Configured source identity. */
	sourceKey: string;
	/** Renderer light intensity. */
	intensity: number;
	/** Source position in scene coordinates. */
	sourcePosition: ScenePosition;
	/** Physical incident scale at the observer. */
	observerIncidentScale: number;
	/** Selected endpoint scene incident scale. */
	endpointSceneIncidentScale: number;
	/** Scene-light calibration scalar. */
	calibrationScalar: number;
	/** Selected endpoint scene-light scaling policy. */
	endpointSceneLightScalePolicy: LocalSunEndpointSceneLightScalePolicy;
}>;

/** Directional shadow-light construction facts owned by the local-Sun scene adapter. */
type LocalSunShadowDirectionalLightRequest = Readonly<{
	/** Three lighting constructors. */
	THREE: LocalThreeNamespace;
	/** Configured source identity. */
	sourceKey: string;
	/** Renderer light intensity. */
	intensity: number;
	/** Source position in scene coordinates. */
	sourcePosition: ScenePosition;
	/** Normalized shadow-object facts. */
	shadowObject: LocalSunNormalizedShadowObject;
	/** Ordered shadow-object index. */
	objectIndex?: number;
	/** Mutable scene-object collection receiving the directional target. */
	sceneObjects: LocalThreeObject[];
}>;

/** Opposite-direction endpoint-fill construction facts. */
type LocalSunOppositeDirectionalFillLightRequest = Readonly<{
	/** Three lighting constructors. */
	THREE: LocalThreeNamespace;
	/** Configured source identity. */
	sourceKey: string;
	/** Renderer fill intensity. */
	intensity: number;
	/** Unit direction from the observer toward the source. */
	directionToSource: UnitVector3;
	/** Fill focus in scene coordinates. */
	focus: ScenePosition;
	/** Directional-light placement distance. */
	distance: SceneDistance;
	/** Mutable scene-object collection receiving the directional target. */
	sceneObjects: LocalThreeObject[];
}>;

/** Source-direction falloff-fill construction facts. */
type LocalSunSourceDirectionFalloffFillLightRequest = Readonly<{
	/** Three lighting constructors. */
	THREE: LocalThreeNamespace;
	/** Configured source identity. */
	sourceKey: string;
	/** Desired point-light intensity at the focus. */
	targetIntensity: number;
	/** Unit direction from the observer toward the source. */
	directionToSource: UnitVector3;
	/** Fill focus in scene coordinates. */
	focus: ScenePosition;
	/** Point-light placement distance. */
	distance: SceneDistance;
	/** Mutable scene-object collection receiving the fill anchor. */
	sceneObjects: LocalThreeObject[];
}>;

/** Normalized local-Sun endpoint lighting facts. */
type LocalSunEndpointLightingFacts = Readonly<{
	/** Physical direct-lighting sample. */
	directLighting: DirectLightingSample;
	/** Source-owned sample metadata. */
	metadata: Readonly<Record<string, unknown>>;
	/** Incident scaling at the observer. */
	observerIncidentScale: number;
	/** Accepted scene-light calibration scalar. */
	calibrationScalar: number;
	/** Accepted ambient intensity bounds. */
	ambientIntensityRange: Readonly<{
		/** Minimum ambient intensity. */
		min: number;
		/** Maximum ambient intensity. */
		max: number;
	}>;
	/** Unit-bearing ambient light scale. */
	ambientLightScale: Dimensionless;
	/** Endpoint scene-light scaling policy. */
	endpointSceneLightScalePolicy: LocalSunEndpointSceneLightScalePolicy;
	/** Resulting endpoint incident scale. */
	endpointSceneIncidentScale: number;
	/** Resolved ambient intensity. */
	ambientIntensity: number;
}>;

/** Shadow-object request with its resolved caller-visible identity. */
type LocalSunShadowObjectNormalizationRequest = LightSourceThreeShadowObjectRequest &
	Readonly<{
		/** Resolved shadow-object identity. */
		objectKey: string;
	}>;

/** Normalized request for one local-Sun shadow object. */
type LocalSunNormalizedShadowObject = Readonly<{
	/** Shadow focus in scene coordinates. */
	focus: ScenePosition;
	/** Orthographic shadow extent. */
	extent: SceneDistance;
	/** Directional-light placement distance. */
	lightDistance: SceneDistance;
	/** Orthographic camera left plane. */
	cameraLeft: SceneDistance;
	/** Orthographic camera right plane. */
	cameraRight: SceneDistance;
	/** Orthographic camera top plane. */
	cameraTop: SceneDistance;
	/** Orthographic camera bottom plane. */
	cameraBottom: SceneDistance;
	/** Shadow camera near plane. */
	cameraNear: SceneDistance;
	/** Shadow camera far plane. */
	cameraFar: SceneDistance;
	/** Shadow-map pixel dimensions. */
	mapSize: PixelSize;
	/** Renderer shadow depth bias. */
	bias: number;
	/** Unit-bearing renderer shadow normal bias. */
	normalBias: SceneDistance;
	/** Unit-bearing renderer shadow blur radius. */
	radius: PixelDistance;
	/** Renderer shadow opacity. */
	shadowIntensity: number;
	/** Caller-visible shadow-object identity. */
	objectKey: string;
	/** Optional renderer layer index. */
	layerIndex: number | null;
}>;

/** Normalized canonical local-Sun shadow request. */
type LocalSunNormalizedShadowRequest = Readonly<{
	/** Whether source-owned shadow lights are enabled. */
	enabled: boolean;
	/** Ordered normalized shadow objects. */
	objects: readonly LocalSunNormalizedShadowObject[];
}>;

/** Normalized enabled endpoint indirect-fill request. */
type LocalSunNormalizedEndpointIndirectFill = Readonly<{
	/** Enabled fill selection. */
	enabled: true;
	/** Selected indirect-fill policy. */
	policy: LocalSunEndpointIndirectFillPolicy;
	/** Fill intensity relative to the source-driven endpoint light. */
	intensityRatio: number;
	/** Fill placement distance in scene units. */
	distance: SceneDistance;
}>;

/** Ambient-light construction request with an optional pre-resolved intensity. */
type LocalSunAmbientLightRequest = LightSourceThreeLightingRequest &
	Readonly<{
		/** Optional pre-resolved ambient intensity. */
		resolvedAmbientIntensity?: number;
	}>;

/** Common Three light surface used by local-source lighting. */
type LocalThreeLight = {
	/** Renderer light name. */
	name: string;
	/** Renderer light intensity. */
	intensity: number;
	/** Mutable renderer position interface. */
	position: {
		/**
		 * Call this method to assign renderer position coordinates.
		 *
		 * @param coordinates - The renderer coordinates.
		 * @returns - No return value.
		 */
		set(...coordinates: number[]): void;
	};
	/** Renderer-neutral Algorithm32 metadata. */
	userData: Record<string, unknown>;
	/** Whether the light casts renderer shadows. */
	castShadow?: boolean;
};

/** Three object surface used by local-source lighting. */
type LocalThreeObject = {
	/** Renderer object name. */
	name: string;
	/** Mutable renderer position interface. */
	position: {
		/**
		 * Call this method to assign renderer position coordinates.
		 *
		 * @param coordinates - The renderer coordinates.
		 * @returns - No return value.
		 */
		set(...coordinates: number[]): void;
	};
	/** Renderer-neutral Algorithm32 metadata. */
	userData: Record<string, unknown>;
};

/** Three directional-light surface used by a local source. */
type LocalThreeDirectionalLight = LocalThreeLight & {
	/** Directional-light target. */
	target: LocalThreeObject;
	/** Optional renderer shadow configuration. */
	shadow?: {
		/** Optional shadow-map dimensions. */
		mapSize?: {
			/** Shadow-map width. */
			width: number;
			/** Shadow-map height. */
			height: number;
		};
		/** Optional directional shadow-camera state. */
		camera?: {
			/** Camera left plane. */
			left: number;
			/** Camera right plane. */
			right: number;
			/** Camera top plane. */
			top: number;
			/** Camera bottom plane. */
			bottom: number;
			/** Camera near plane. */
			near: number;
			/** Camera far plane. */
			far: number;
			/**
			 * Call this method to rebuild renderer projection state after camera changes.
			 *
			 * @returns - No return value.
			 */
			updateProjectionMatrix?(): void;
		};
		/** Renderer shadow bias. */
		bias: number;
		/** Renderer shadow normal bias. */
		normalBias: number;
		/** Renderer shadow blur radius. */
		radius: number;
		/** Renderer shadow intensity. */
		intensity: number;
	};
};

/** Three constructors used by local-source lighting. */
type LocalThreeNamespace = {
	/** Renderer object constructor. */
	Object3D: new () => LocalThreeObject;
	/** Renderer ambient-light constructor. */
	AmbientLight: new (color: number, intensity: number) => LocalThreeLight;
	/** Renderer point-light constructor. */
	PointLight: new (color: number, intensity: number, distance?: number, decay?: number) => LocalThreeLight;
	/** Renderer directional-light constructor. */
	DirectionalLight: new (color: number, intensity: number) => LocalThreeDirectionalLight;
};
