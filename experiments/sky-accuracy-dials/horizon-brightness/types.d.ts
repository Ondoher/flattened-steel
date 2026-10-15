/** One channel's integrated diagnostic terms, in spectral radiance units except the altitude moment. */
type HorizonBrightnessIntegral = readonly [
	/** Radiance with both attenuation factors. */ both: number,
	/** Radiance with source attenuation only. */ sourceOnly: number,
	/** Radiance with view attenuation only. */ viewOnly: number,
	/** Radiance without either attenuation factor. */ neither: number,
	/** Attenuated Rayleigh radiance. */ rayleigh: number,
	/** Attenuated aerosol radiance. */ aerosol: number,
	/** Attenuated radiance times altitude, meters times spectral radiance. */ altitudeMoment: number,
];
/** Frozen physical state at a specified view optical depth. */
type HorizonBrightnessSample = {
	/** View elevation in degrees. */ readonly elevation: number;
	/** Native15 channel index. */ readonly channel: number;
	/** View optical depth. */ readonly tau: number;
	/** Distance in meters. */ readonly distance: number;
	/** Physical altitude in meters. */ readonly altitude: number;
	/** Rayleigh scattering coefficient, inverse meters. */ readonly rayleigh: number;
	/** Aerosol extinction coefficient, inverse meters. */ readonly aerosol: number;
	/** Direct source transmittance. */ readonly sourceTransmittance: number;
	/** Unattenuated incident irradiance density after dilution. */ readonly incident: number;
	/** Rayleigh and aerosol source densities, per meter per steradian. */ readonly source: readonly number[];
	/** Combined source density divided by extinction, in spectral radiance units. */ readonly sourceFunction: number;
};
/** Measured default-framebuffer behavior of a Three RawShaderMaterial. */
type HorizonBrightnessGpu = {
	/** Actual WebGL renderer description. */ readonly renderer: string;
	/** Three library revision. */ readonly revision: string;
	/** Requested linear neutral values. */ readonly values: readonly number[];
	/** Canvas bytes from direct raw output. */ readonly rawBytes: readonly number[];
	/** Canvas bytes from explicit sRGB transfer. */ readonly encodedBytes: readonly number[];
	/** WebGL error code after both passes. */ readonly error: number;
};

/** Minimal browser ownership required for cleanup after failed evaluation. */
interface HorizonBrightnessBrowserLifetime {
	/** Close this run's owned browser before scratch cleanup. */ close(): Promise<void>;
}
/** Three resource that the probe must release. */
interface HorizonBrightnessDisposable {
	/** Release owned GPU allocations. */ dispose(): void;
}
/** Opaque Three scene object accepted by the renderer and scene. */
type HorizonBrightnessObject = {
	/** Three's object identity marker, not an application domain type. */ readonly isObject3D: boolean;
};
/** Minimal scene operations used by the isolated probe. */
interface HorizonBrightnessScene extends HorizonBrightnessObject {
	/** Attach the owned fullscreen mesh. */ add(mesh: HorizonBrightnessObject): void;
	/** Detach it before releasing its material. */ remove(mesh: HorizonBrightnessObject): void;
}
/** Minimal screen renderer used by the isolated probe. */
interface HorizonBrightnessRenderer extends HorizonBrightnessDisposable {
	/** Declared screen color space. */ outputColorSpace: string;
	/** Selected tone-mapping mode. */ toneMapping: number;
	/** Set the tiny framebuffer size without CSS changes. */ setSize(
		width: number,
		height: number,
		updateStyle: boolean,
	): void;
	/** Obtain the WebGL2 context for framebuffer readback. */ getContext(): WebGL2RenderingContext;
	/** Select the default screen framebuffer. */ setRenderTarget(target: null): void;
	/** Draw the fullscreen mesh. */ render(scene: HorizonBrightnessScene, camera: HorizonBrightnessObject): void;
	/** Release the probe's owned context. */ forceContextLoss(): void;
}
/** Frozen raw-material creation request. */
type HorizonBrightnessMaterialOptions = {
	/** Explicit GLSL version. */ readonly glslVersion: string;
	/** Fullscreen pass bypasses depth testing. */ readonly depthTest: boolean;
	/** Fullscreen pass does not write depth. */ readonly depthWrite: boolean;
	/** Explicit vertex program. */ readonly vertexShader: string;
	/** Explicit fragment program. */ readonly fragmentShader: string;
};
/** Frozen renderer creation request. */
type HorizonBrightnessRendererOptions = {
	/** Keep exact pixel values without multisampling. */ readonly antialias: boolean;
	/** Permit immediate framebuffer readback. */ readonly preserveDrawingBuffer: boolean;
};
/** Narrow substitutable Three capability loaded from the authenticated CommonJS build. */
interface HorizonBrightnessThree {
	/** Installed Three revision. */ readonly REVISION: string;
	/** GLSL3 token. */ readonly GLSL3: string;
	/** sRGB output declaration token. */ readonly SRGBColorSpace: string;
	/** Disabled built-in tone mapping token. */ readonly NoToneMapping: number;
	/** Construct this run's screen renderer. */ readonly WebGLRenderer: new (
		options: HorizonBrightnessRendererOptions,
	) => HorizonBrightnessRenderer;
	/** Construct an empty scene. */ readonly Scene: new () => HorizonBrightnessScene;
	/** Construct the fullscreen camera. */ readonly OrthographicCamera: new (
		left: number,
		right: number,
		top: number,
		bottom: number,
		near: number,
		far: number,
	) => HorizonBrightnessObject;
	/** Construct the fullscreen plane. */ readonly PlaneGeometry: new (
		width: number,
		height: number,
	) => HorizonBrightnessDisposable;
	/** Construct a raw material with explicitly supplied programs. */ readonly RawShaderMaterial: new (
		options: HorizonBrightnessMaterialOptions,
	) => HorizonBrightnessDisposable;
	/** Bind the geometry and material in a scene object. */ readonly Mesh: new (
		geometry: HorizonBrightnessDisposable,
		material: HorizonBrightnessDisposable,
	) => HorizonBrightnessObject;
}
