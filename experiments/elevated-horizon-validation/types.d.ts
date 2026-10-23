/** Ambient contracts owned by this contained experiment. */

/** Captured GPU output and diagnostic source from the installed production pass. */
type HorizonGpuProbeData = {
	/** Registered analytic view endpoints. */
	views: {elevation: number; direction: number[]; ground: boolean; length: number; observerAltitude: number}[];
	/** RGBA32F rows: path radiance, transmittance, endpoint distance and ground flag. */
	snapshots: {intervals: number; data: number[]}[];
	/** Original production helpers with diagnostic main only. */
	controlledShader: string;
	/** Actual camera-column scene, transport and color outputs. */
	column: {
		x: number;
		height: number;
		transport: number[];
		sceneInput: number[];
		final: number[];
		pathRgb: number[];
		groundRgb: number[];
	};
	/** Actual camera matrices and scene-depth normalization. */
	camera: {inverseProjection: number[]; inverseView: number[]; origin: number[]; sceneDepthMax: number; fov: number};
	/** Scene-to-physical right/up/forward basis. */
	basis: number[][];
	/** Fixed adaptation context in lux. */
	lux: number;
};
