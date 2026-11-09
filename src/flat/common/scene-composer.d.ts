declare global {
	/**
	 * Renderer owning CSS-to-drawing-buffer pixel scaling.
	 */
	type SceneComposerRenderer = import('three').WebGLRenderer;

	/**
	 * Scene target sized in physical drawing-buffer pixels.
	 */
	type SceneComposerTarget = import('three').WebGLRenderTarget;

	/**
	 * Caller-owned postprocessing composition using physical pixel dimensions.
	 */
	type SceneComposer = import('three/examples/jsm/postprocessing/EffectComposer.js').EffectComposer;
}

/**
 * Call this function to create a composer that accepts physical drawing-buffer dimensions without rescaling.
 *
 * @param renderer - Renderer owning the device-pixel ratio.
 * @param target - Initial physical-pixel target.
 * @returns - Caller-owned scene composer.
 */
export function createSceneComposer(renderer: SceneComposerRenderer, target: SceneComposerTarget): SceneComposer;
