import * as THREE from 'three';
import {
	NeutralLambertianSceneLighting,
	NEUTRAL_LAMBERTIAN_REFLECTANCE,
} from '../../../../algorithm32/implementation/scene-lighting/NeutralLambertianSceneLighting.js';

/**
 * Measured finite-Sun and diffuse-sky lighting for retained Flat Earth endpoint objects.
 */
export class FlatEarthSceneLighting {
	/**
	 * Call this method to install initially dark lights before the first receiver measurement.
	 *
	 * @param {FlatEarthPreparedScene['scene']} scene - Owning retained scene.
	 * @returns {FlatEarthMeasuredLights} - Upper-hemisphere diffuse and finite-source direct lights.
	 */
	static create(scene) {
		let diffuse = new THREE.HemisphereLight(0, 0, 0);
		diffuse.position.set(0, 1, 0);
		let direct = new THREE.PointLight(0, 0, 0, 0);
		scene.add(diffuse, direct);
		return {lights: [diffuse, direct]};
	}

	/**
	 * Call this method to prepare measured light colors and placement without changing the displayed frame.
	 * Three applies the surface cosine; projection uses normal incidence to avoid applying it twice.
	 *
	 * @param {FlatEarthMeasuredLights} lighting - Retained scene lights.
	 * @param {ScenePosition} sourcePosition - Finite source in observer-local scene units.
	 * @param {ReceiverEnvironmentLightMeasurement} measurement - Accepted direct-normal and diffuse-horizontal spectra.
	 * @param {FlatEarthColorModel} color - Current physical-to-renderer color bridge, matching Flat32.
	 * @returns {LocalSunFrameSceneLighting} - Reversible publication of the matching light state.
	 */
	static prepare(lighting, sourcePosition, measurement, color) {
		let response = new NeutralLambertianSceneLighting().evaluate({
			identity: measurement.identity + ':flat-earth-ground',
			surfaceNormal: [0, 0, 1],
			directionToSource: [0, 0, 1],
			directNormal: measurement.directNormal,
			diffuseIrradiance: measurement.diffuseHorizontal,
		});
		let colors = [response.diffuseRadiance, response.directRadiance].map((packet) => this._project(color, packet));
		let position = new THREE.Vector3(...sourcePosition.coordinates);
		let previous = null;
		return {
			publish: () => {
				if (previous) {
					return;
				}
				previous = lighting.lights.map((light) => ({
					color: light.color.clone(),
					intensity: light.intensity,
					position: light.position.clone(),
				}));
				for (let [index, light] of lighting.lights.entries()) {
					let rgb = colors[index];
					let peak = Math.max(...rgb.map(Math.abs));
					light.color.setRGB(peak ? rgb[0] / peak : 0, peak ? rgb[1] / peak : 0, peak ? rgb[2] / peak : 0);
					light.intensity = peak;
				}
				lighting.lights[1].position.copy(position);
			},
			revert: () => {
				if (!previous) {
					return;
				}
				for (let [index, light] of lighting.lights.entries()) {
					let saved = previous[index];
					light.color.copy(saved.color);
					light.intensity = saved.intensity;
					light.position.copy(saved.position);
				}
				previous = null;
			},
		};
	}

	/**
	 * Called by measurement preparation to reproduce Flat32's spectral-to-Three incident-light conversion.
	 *
	 * @param {FlatEarthColorModel} color - Selected physical color projection.
	 * @param {SpectralRadiancePacket} radiance - Neutral Lambertian outgoing radiance.
	 * @returns {number[]} - Incident RGB in the renderer's linear color space.
	 */
	static _project(color, radiance) {
		let incident = color
			.radianceToLinearSrgb(radiance)
			.map((value) => (value * Math.PI) / NEUTRAL_LAMBERTIAN_REFLECTANCE);
		let toneMap = color.displayConstants.paperFigure1ToneMapK;
		return incident.map((value) => {
			let display = 1 - Math.exp(-Math.max(value, 0) * toneMap);
			return display <= 0.04045 ? display / 12.92 : ((display + 0.055) / 1.055) ** 2.4;
		});
	}
}
