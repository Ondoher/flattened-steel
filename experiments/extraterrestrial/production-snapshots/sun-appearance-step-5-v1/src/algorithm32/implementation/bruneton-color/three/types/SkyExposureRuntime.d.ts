/** Mutable private texture owned by the sky-exposure runtime. */
type SkyExposurePrivateTexture = ShaderRuntimePassTexture & {
	/** Renderer diagnostic name. */
	name: string;
	/** Whether mipmaps should be generated. */
	generateMipmaps: boolean;
	/** Optional renderer color-space marker. */
	colorSpace?: unknown;
};

/** Private single-channel render target owned by the sky-exposure runtime. */
type SkyExposurePrivateRenderTarget = ShaderRuntimePassRenderTarget & {
	/** Single texture attached to the target. */
	readonly texture: SkyExposurePrivateTexture;
	/** Target width in pixels. */
	readonly width: number;
	/** Target height in pixels. */
	readonly height: number;
	/** Release target GPU resources. */
	dispose(): void;
};

/** Private shader material owned by one sky-exposure pass. */
type SkyExposurePrivateMaterial = ShaderRuntimePassMaterial & {
	/** Release material GPU resources. */
	dispose(): void;
};

/** Private resource constructors used by the sky-exposure runtime. */
type SkyExposurePrivateThreeNamespace = ShaderRuntimePassResourceNamespace & {
	/** Allocate one fixed render target. */
	readonly WebGLRenderTarget: new (
		width: number,
		height: number,
		configuration: object,
	) => SkyExposurePrivateRenderTarget;
	/** Single-channel texture format runtime value. */
	readonly RedFormat: unknown;
	/** 32-bit floating-point texture type runtime value. */
	readonly FloatType: unknown;
	/** Nearest-neighbor texture filter runtime value. */
	readonly NearestFilter: unknown;
	/** Renderer-neutral no-color-space runtime value. */
	readonly NoColorSpace?: unknown;
};
