/** Three object surface used by distant-source lighting. */
type DistantThreeObject = {
	/** Renderer object name. */
	name: string;
	/** Mutable renderer position interface. */
	position: {
		/**
		 * Call this method to assign renderer position coordinates.
		 *
		 * @param coordinates - The renderer coordinates.
		 * @returns - No return value.
		 *
		 */
		set(...coordinates: number[]): void;
	};
	/** Renderer-neutral Algorithm32 metadata. */
	userData: Record<string, unknown>;
};

/** Three directional-light surface used by distant-source lighting. */
type DistantThreeDirectionalLight = DistantThreeObject & {
	/** Directional-light target. */
	target: DistantThreeObject;
	/** Whether the light casts renderer shadows. */
	castShadow: boolean;
	/** Optional renderer shadow configuration. */
	shadow?: {
		/** Optional shadow-map dimensions. */
		mapSize?: {
			/** Shadow-map width in pixels. */
			width: number;
			/** Shadow-map height in pixels. */
			height: number;
		};
		/** Optional directional shadow-camera state. */
		camera?: {
			/** Camera left plane in scene units. */
			left: number;
			/** Camera right plane in scene units. */
			right: number;
			/** Camera top plane in scene units. */
			top: number;
			/** Camera bottom plane in scene units. */
			bottom: number;
			/** Camera near plane in scene units. */
			near: number;
			/** Camera far plane in scene units. */
			far: number;
			/**
			 * Call this method to rebuild renderer projection state after camera changes.
			 *
			 * @returns - No return value.
			 *
			 */
			updateProjectionMatrix?(): void;
		};
		/** Renderer shadow bias. */
		bias: number;
		/** Renderer shadow normal bias in scene units. */
		normalBias: number;
		/** Renderer shadow blur radius in pixels. */
		radius: number;
		/** Renderer shadow intensity. */
		intensity: number;
	};
};

/** Three constructors used by distant-source lighting. */
type DistantThreeNamespace = {
	/** Three object constructor. */
	Object3D: new () => DistantThreeObject;
	/** Three directional-light constructor. */
	DirectionalLight: new (color: number, intensity: number) => DistantThreeDirectionalLight;
	/** Three ambient-light constructor. */
	AmbientLight: new (color: number, intensity: number) => DistantThreeObject;
};

/** Normalized distant-Sun shadow-object settings. */
type DistantSunNormalizedShadowObject = Readonly<{
	/** Unique caller-visible key for the shadow object. */
	objectKey: string;
	/** Optional Three layer index for the shadow camera. */
	layerIndex: number | null;
	/** Shadow target in scene units. */
	focus: ScenePosition;
	/** Symmetric default shadow extent in scene units. */
	extent: SceneDistance;
	/** Directional-light distance in scene units. */
	lightDistance: SceneDistance;
	/** Orthographic camera left plane in scene units. */
	cameraLeft: SceneDistance;
	/** Orthographic camera right plane in scene units. */
	cameraRight: SceneDistance;
	/** Orthographic camera top plane in scene units. */
	cameraTop: SceneDistance;
	/** Orthographic camera bottom plane in scene units. */
	cameraBottom: SceneDistance;
	/** Shadow-camera near plane in scene units. */
	cameraNear: SceneDistance;
	/** Shadow-camera far plane in scene units. */
	cameraFar: SceneDistance;
	/** Shadow-map dimensions in pixels. */
	mapSize: PixelSize;
	/** Renderer shadow bias. */
	bias: number;
	/** Renderer normal bias in scene units. */
	normalBias: SceneDistance;
	/** Renderer shadow blur radius in pixels. */
	radius: PixelDistance;
	/** Renderer shadow intensity. */
	shadowIntensity: number;
}>;

/** Normalized distant-Sun shadow policy and ordered object settings. */
type DistantSunNormalizedShadowRequest = Readonly<{
	/** Whether shadow-map lighting is enabled. */
	enabled: boolean;
	/** Ordered shadow-object settings. */
	objects: readonly DistantSunNormalizedShadowObject[];
}>;

/** Inputs for one distant-Sun directional-light and target pair. */
type DistantSunDirectionalLightRequest = Readonly<{
	/** Three constructors for the light and target. */
	THREE: DistantThreeNamespace;
	/** Normalized scene direction toward the source. */
	directionToSource: UnitVector3;
	/** Directional-light intensity. */
	intensity: number;
	/** Target point in scene units. */
	focus: ScenePosition;
	/** Light placement distance in scene units. */
	lightDistance: SceneDistance;
	/** Optional normalized shadow settings for the light. */
	shadowObject: DistantSunNormalizedShadowObject | null;
	/** Stable ordinal for the generated light and target names. */
	objectIndex: number;
}>;

/** Created distant-Sun directional light and target pair. */
type DistantSunDirectionalLightPair = Readonly<{
	/** Created directional light. */
	light: DistantThreeDirectionalLight;
	/** Created directional-light target. */
	target: DistantThreeObject;
}>;

/** Inputs for one distant-Sun ambient fill light. */
type DistantSunAmbientLightRequest = Readonly<{
	/** Three ambient-light constructor. */
	THREE: DistantThreeNamespace;
	/** Non-negative ambient intensity. */
	ambientIntensity: number;
}>;
