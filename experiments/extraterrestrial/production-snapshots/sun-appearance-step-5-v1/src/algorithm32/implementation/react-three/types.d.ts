/** Mutable shader binding values owned by the Algorithm32 host adapter. */
type Algorithm32BindingValues = Record<string, unknown>;

/** Matrix operations required by the Algorithm32 camera-binding adapter. */
type Algorithm32BindingsMatrix4 = {
	/**
	 * Call this method to copy one camera matrix into the mutable binding matrix.
	 * @param matrix - The matrix value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	copy(matrix: Algorithm32BindingsMatrix4): Algorithm32BindingsMatrix4;
};

/** Vector operations required by the Algorithm32 camera-binding adapter. */
type Algorithm32BindingsVector3 = {
	/** World or model-space x coordinate. */
	readonly x: number;
	/** World or model-space y coordinate. */
	readonly y: number;
	/** World or model-space z coordinate. */
	readonly z: number;
	/**
	 * Call this method to create an independent vector with the same coordinates.
	 * @returns - The result produced by the operation.
	 */
	clone(): Algorithm32BindingsVector3;
	/**
	 * Call this method to replace all three mutable coordinates.
	 * @param x - The x value accepted by the operation.
	 * @param y - The y value accepted by the operation.
	 * @param z - The z value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	set(x: number, y: number, z: number): Algorithm32BindingsVector3;
};

/** Three constructor surface required by Algorithm32 camera-binding creation. */
type Algorithm32BindingsThreeNamespace = {
	/** Matrix constructor used for mutable camera bindings. */
	readonly Matrix4: new () => Algorithm32BindingsMatrix4;
	/** Vector constructor used for mutable camera bindings. */
	readonly Vector3: new () => Algorithm32BindingsVector3;
};

/** Live camera surface required by one Algorithm32 binding update. */
type Algorithm32BindingsCamera = {
	/** Inverse camera projection matrix. */
	readonly projectionMatrixInverse: Algorithm32BindingsMatrix4;
	/** Camera world matrix. */
	readonly matrixWorld: Algorithm32BindingsMatrix4;
	/** Mutable camera-local position. */
	readonly position: Algorithm32BindingsVector3;
	/** Call this method to update the camera projection matrix. */
	updateProjectionMatrix(): void;
	/** Call this method to update the camera world matrix. */
	updateMatrixWorld(): void;
	/**
	 * Call this method to write the current world position into a target vector.
	 * @param target - The target value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	getWorldPosition(target: Algorithm32BindingsVector3): Algorithm32BindingsVector3;
};

/** Live camera and configuration state for one binding update. */
type Algorithm32BindingsUpdateRequest = {
	/** Mutable shader binding values. */
	readonly bindingValues: Algorithm32BindingValues;
	/** Active Three camera. */
	readonly camera: Algorithm32BindingsCamera;
	/** Geometry configuration and scene scale. */
	readonly props: {
		/** Active Algorithm32 configuration. */
		readonly config: Config;
		/** Renderer scene-to-physical scale. */
		readonly sceneScale: SceneScale;
	};
};

/** Adapter context for geometry- and light-source-owned Three resources. */
type Algorithm32ThreeResourcesRequest = {
	/** Optional Algorithm32 configuration. */
	readonly config?: Partial<Config>;
	/** Optional Three namespace. */
	readonly THREE?: unknown;
	/** Optional renderer scene-to-physical scale. */
	readonly sceneScale?: SceneScale;
	/** Optional geometry endpoint request or request factory. */
	readonly geometryEndpointRequest?: unknown;
	/** Optional lighting request or request factory. */
	readonly lightingRequest?: unknown;
};

/** Resolved owner-specific fields supplied to a geometry or lighting request. */
type Algorithm32ThreeOwnerRequest = Readonly<Record<string, unknown>>;

/** Scene object carrying optional Algorithm32 scene-input metadata. */
type Algorithm32SceneInputObject = {
	/** Mutable owner metadata. */
	userData?: Record<string, unknown>;
};

/** Geometry and lighting metadata for one required-object packet. */
type Algorithm32RequiredThreeObjectsMetadata = {
	/** Geometry-owner metadata. */
	readonly geometry: unknown;
	/** Light-source-owner metadata. */
	readonly lighting: unknown;
};

/** Geometry- and light-source-owned Three objects required by Algorithm32. */
type Algorithm32RequiredThreeObjects = {
	/** Combined scene objects in deterministic owner order. */
	readonly objects: readonly unknown[];
	/** Geometry-owned endpoint objects, when available. */
	readonly endpointObjects: GeometryThreeEndpointObjects | null;
	/** Light-source-owned lighting objects, when available. */
	readonly lightingObjects: LightSourceThreeLightingObjects | null;
	/** Owner metadata. */
	readonly metadata: Algorithm32RequiredThreeObjectsMetadata;
};

/** Numeric Three data-type identifier accepted by a scene-color texture. */
type Algorithm32SceneColorTextureDataType =
	1009 | 1010 | 1011 | 1012 | 1013 | 1014 | 1015 | 1016 | 1017 | 1018 | 1020 | 35902 | 35899;

/** Texture configuration supplied to the scene-color render-target constructor. */
type Algorithm32SceneColorRenderTargetOptions = {
	/** Linear minification filter identifier. */
	readonly minFilter: 1006;
	/** Linear magnification filter identifier. */
	readonly magFilter: 1006;
	/** RGBA pixel-format identifier. */
	readonly format: 1023;
	/** Selected texture data-type identifier. */
	readonly type: Algorithm32SceneColorTextureDataType;
	/** Depth-buffer allocation state. */
	readonly depthBuffer: boolean;
	/** Stencil-buffer allocation state. */
	readonly stencilBuffer: boolean;
};

/** Mutable texture metadata exposed by an Algorithm32 scene-color target. */
type Algorithm32SceneColorTexture = {
	/** Texture data-type identifier. */
	readonly type: Algorithm32SceneColorTextureDataType;
	/** Mutable diagnostic texture name. */
	name: string;
	/** Mutable renderer color-space identifier. */
	colorSpace: string;
};

/** Scene-color render target returned to the Algorithm32 host adapter. */
type Algorithm32SceneColorRenderTarget = {
	/** Allocated pixel width. */
	readonly width: number;
	/** Allocated pixel height. */
	readonly height: number;
	/** Target-owned scene-color texture. */
	readonly texture: Algorithm32SceneColorTexture;
	/**
	 * Call this method to replace the allocated target dimensions.
	 * @param width - The width value accepted by the operation.
	 * @param height - The height value accepted by the operation.
	 */
	setSize(width: number, height: number): void;
	/** Call this method to release target-owned renderer resources. */
	dispose(): void;
};

/** Three constants and constructor required by scene-color target construction. */
type Algorithm32SceneColorThreeNamespace = {
	/** Half-float texture data-type identifier used by the default HDR target. */
	readonly HalfFloatType: 1016;
	/** Linear texture-filter identifier. */
	readonly LinearFilter: 1006;
	/** RGBA pixel-format identifier. */
	readonly RGBAFormat: 1023;
	/** Value that renders-target constructor used for scene-color allocation. */
	readonly WebGLRenderTarget: new (
		width?: number,
		height?: number,
		options?: Algorithm32SceneColorRenderTargetOptions,
	) => Algorithm32SceneColorRenderTarget;
};

/** Construction request for the default Algorithm32 scene-color render target. */
type Algorithm32SceneColorRenderTargetRequest = {
	/** Three namespace used for target construction. */
	readonly THREE: Algorithm32SceneColorThreeNamespace;
	/** Unit-bearing target size. */
	readonly viewportSize: PixelSize;
	/** Optional texture data type. */
	readonly type?: Algorithm32SceneColorTextureDataType;
	/** Optional texture name. */
	readonly name?: string;
	/** Optional texture color space. */
	readonly colorSpace?: string;
};
