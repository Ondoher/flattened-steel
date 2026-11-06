/**
 * Runtime pass public boundary reused unchanged from the production renderer.
 */
declare module 'dome-runtime-pass' {
	export class ShaderRuntimePass {
		constructor(configuration: {
			THREE: typeof import('three');
			uniforms: Record<string, {value: unknown}>;
			fragmentShaderSource: string;
			sourceHash: string;
			viewportSize: {width: number; height: number; units: 'pixels'};
			logger: null;
		});
		prepare(renderer: import('three').WebGLRenderer): Promise<void>;
		setSize(width: number, height: number): void;
		render(
			renderer: import('three').WebGLRenderer,
			target: import('three').WebGLRenderTarget,
			input?: unknown,
		): void;
		getDiagnostics(): {
			frameCount: number;
			renderErrorCount: number;
			lastRenderError: string | null;
			sourceHash: string;
		};
		dispose(): void;
	}
}

/**
 * Existing Three resources exposed through experiment-owned interfaces.
 */
type DomeThreeRenderer = import('three').WebGLRenderer;
type DomeThreeTarget = import('three').WebGLRenderTarget;
type DomeThreeTexture = import('three').Texture;
type DomeThreeRawMaterial = import('three').RawShaderMaterial;
type DomeThreeUniforms = Record<string, {value: unknown}>;

/**
 * Actual live texture generation identity, independent of camera presentation.
 */
type DomeSceneCacheIdentity = {generation: number; cumulative: string; positions: string; rows: string};

/**
 * Measured spectral and geometric values at an actual shader fragment.
 */
type DomeScenePixel = {
	x: number;
	y: number;
	direction: number[];
	actualDirection: number[];
	bounds: number[];
	expectedHit: boolean;
	air: number[];
	transmission: number[];
	radiance: number[];
	withoutHigher: number[];
	displayed: number[];
	vacuumRadiance?: number[];
	vacuumDisplay?: number[];
};

/**
 * Renderer evidence used by independent Node-side scene checks.
 */
type DomeSceneTelemetry = {
	identity: DomeSceneCacheIdentity;
	frames: {
		name: string;
		width: number;
		height: number;
		cacheIdentity: DomeSceneCacheIdentity;
		groundDrawCalls: number;
		diagnostics: DomeScenePixel[];
	}[];
	cameraControls: {
		origin: number[];
		direction: number[];
		bounds: number[];
		cacheIdentity: DomeSceneCacheIdentity;
		shaderIdentity: string;
	}[];
};

/**
 * Explicit browser-side request frozen by the Node evidence runner.
 */
type DomeSceneRequest = {
	layout: DomeTopology;
	shaders: {build: string; view: string; scene: string; groundVertex: string; ground: string};
	queries: DomeCase[];
	groundSpectrum: number[];
	groundRgb: number[];
	origin: number[];
	diskRadius: number;
	distanceInside: number;
	width: number;
	height: number;
	final: boolean;
	stage: 'cache' | 'pilot' | 'final';
};

/**
 * Browser-to-runner retained artifacts and progress without browser file writes.
 */
interface Window {
	domeScene: {execute(request: DomeSceneRequest): Promise<unknown>};
	domeProgress(phase: string, message: string, counts?: Record<string, unknown>): Promise<void>;
	domeArtifact(name: string, value: unknown): Promise<void>;
}
