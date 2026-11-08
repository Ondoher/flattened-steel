import {ATMOSPHERIC_VIEW_ENABLED_VALUE_KEY} from '../../../../algorithm32/atmospheric-transport/consts.js';
import {SUN_DISC_BRIGHTNESS_SCALE_VALUE_KEY} from '../../../../algorithm32/celestial-contribution-cache/consts.js';
import {DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY} from '../../../../algorithm32/implementation/color-reset-altitude-half-v1/consts.js';

/**
 * Applies view-only shader, Sun and ground-fill presentation to retained rendering resources.
 */
export class SphericalEarthShaderPresentation {
	/**
	 * Call this method to apply one complete model-owned selection without changing physical measurements.
	 *
	 * @param {SphericalEarthPreparedScene} frame - Retained scene, facade and bindings.
	 * @param {SphericalEarthShaderOptions} options - Complete effective presentation selection.
	 */
	static apply(frame, options) {
		frame.bindings[ATMOSPHERIC_VIEW_ENABLED_VALUE_KEY] = options.atmosphereEnabled;
		frame.bindings[SUN_DISC_BRIGHTNESS_SCALE_VALUE_KEY] = options.sunDiscBrightnessScale;
		frame.algorithm.setReceiverLightPresentationScale(options.sunIlluminationScale);
		for (let index = 0; index < frame.lighting.lights.length; index++) {
			let light = /** @type {SphericalEarthThreeLight} */ (frame.lighting.lights[index]);
			light.intensity = frame.sunLightIntensities[index] * options.sunIlluminationScale;
		}
		let displayIlluminance = frame.color.displayAdaptationIlluminance(
			{value: frame.algorithm.totalHorizontalIlluminance.value * options.sunIlluminationScale, units: 'lux'},
			frame.geometry.configuration.observerHeight,
		);
		frame.bindings[DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY] = displayIlluminance.value;
		let ambientGain = options.mode === 'no-atmosphere' ? frame.color.displayGain(displayIlluminance) : 1;
		frame.ambientLight.intensity = options.ambientLightIntensity / ambientGain;
	}

	/**
	 * Call this method to draw through the selected retained composition or direct-scene path.
	 *
	 * @param {SphericalEarthPreparedScene} frame - Retained scene and composer.
	 * @param {SphericalEarthThreeRenderer} renderer - Owning renderer.
	 * @param {SphericalEarthSkyRenderMode} mode - Canonical selected presentation.
	 */
	static render(frame, renderer, mode) {
		if (mode === 'shader-off') {
			renderer.setRenderTarget(null);
			renderer.render(frame.scene, frame.camera);
		} else {
			frame.composer.renderToScreen = true;
			frame.composer.render();
		}
	}
}
