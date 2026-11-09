import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';

/**
 * Call this function to create a caller-owned composer whose sizes are already physical drawing-buffer pixels.
 * The renderer applies device scaling; the composer must not apply it again to targets or shader passes.
 *
 * @param {SceneComposerRenderer} renderer - Scene renderer that owns device-pixel scaling.
 * @param {SceneComposerTarget} target - Initial target sized in physical pixels.
 * @returns {SceneComposer} - Owned composer accepting physical pixels in setSize.
 */
export function createSceneComposer(renderer, target) {
	let composer = new EffectComposer(renderer, target);
	composer.setPixelRatio(1);
	return composer;
}
