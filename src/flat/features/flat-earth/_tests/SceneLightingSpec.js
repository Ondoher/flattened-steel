import * as THREE from 'three';
import {FlatEarthSceneLighting} from '../runtime/FlatEarthSceneLighting.js';
import {FlatEarthShaderPresentation} from '../runtime/FlatEarthShaderPresentation.js';
import {ColorResetAltitudeHalfV1ColorDisplayModel} from '../../../../algorithm32/implementation/color-reset-altitude-half-v1/ColorResetAltitudeHalfV1ColorDisplayModel.js';
import {LocalSunSceneLighting} from '../../../../flat32/LocalSunSceneLighting.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../../algorithm32/profiles/index.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../../../algorithm32/spectral-values/index.js';

/**
 * Called by lighting fixtures to create a basis-aligned incident spectrum.
 *
 * @param {number} scale - Incident spectral irradiance scale.
 * @returns {SpectralIrradiancePacket} - Deterministic colored spectrum.
 */
function irradiance(scale) {
	return new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		values: NATIVE_15_SPECTRAL_BASIS.channels.map((channel, index) => scale * (1 + index / 10)),
		provenanceIdentity: 'ground-lighting-fixture:' + scale,
	});
}

/**
 * Called by comparisons to recover a Three light's incident renderer RGB.
 *
 * @param {THREE.Light} light - Measured renderer light.
 * @returns {number[]} - Incident renderer RGB.
 */
function incident(light) {
	return light.color.toArray().map((value) => value * light.intensity);
}

describe('Flat Earth measured ground lighting', () => {
	it('matches the Flat32 spectral bridge for direct and diffuse lighting, including a dark measurement', () => {
		let scene = new THREE.Scene();
		let lighting = FlatEarthSceneLighting.create(scene);
		let comparison = new LocalSunSceneLighting(new THREE.Group());
		let color = new ColorResetAltitudeHalfV1ColorDisplayModel();
		let position = {coordinates: [0, 4828, -2000], units: 'scene-units'};
		comparison.install();
		try {
			for (let scale of [2, 0.01, 0]) {
				let measurement = {
					identity: 'measured:' + scale,
					directNormal: irradiance(scale),
					diffuseHorizontal: irradiance(scale / 4),
				};
				FlatEarthSceneLighting.prepare(lighting, position, measurement, color).publish();
				comparison.prepareMeasuredLocalLighting(position, measurement, color).publish();
				let expected = comparison._lights;
				let diffuse = expected.find((light) => light instanceof THREE.HemisphereLight);
				let direct = expected.filter((light) => light instanceof THREE.DirectionalLight);
				for (let channel = 0; channel < 3; channel++) {
					expect(incident(lighting.lights[0])[channel]).toBeCloseTo(incident(diffuse)[channel], 12);
					expect(incident(lighting.lights[1])[channel]).toBeCloseTo(
						direct.reduce((sum, light) => sum + incident(light)[channel], 0),
						12,
					);
				}
				expect(lighting.lights[0].groundColor.getHex()).toBe(0);
				expect(lighting.lights[1].position.toArray()).toEqual(position.coordinates);
				expect(lighting.lights[1].decay).toBe(0);
			}
		} finally {
			comparison.dispose();
		}
	});

	it('stages and rolls back retained lights and restores their measured intensity after presentation changes', () => {
		let lighting = FlatEarthSceneLighting.create(new THREE.Scene());
		let color = new ColorResetAltitudeHalfV1ColorDisplayModel();
		let measurement = {identity: 'accepted', directNormal: irradiance(0.1), diffuseHorizontal: irradiance(0.02)};
		let position = {coordinates: [0, 4828, -2000], units: 'scene-units'};
		FlatEarthSceneLighting.prepare(lighting, position, measurement, color).publish();
		let accepted = lighting.lights.map(incident);
		let transaction = FlatEarthSceneLighting.prepare(
			lighting,
			{...position, coordinates: [40, 4827, 100]},
			{...measurement, identity: 'later', directNormal: irradiance(0.001)},
			color,
		);
		expect(lighting.lights.map(incident)).toEqual(accepted);
		transaction.publish();
		expect(lighting.lights.map(incident)).not.toEqual(accepted);
		transaction.revert();
		expect(lighting.lights.map(incident)).toEqual(accepted);
		expect(lighting.lights[1].position.toArray()).toEqual(position.coordinates);
		let frame = {
			lighting,
			color,
			bindings: {},
			sunLightIntensities: lighting.lights.map((light) => light.intensity),
			ambientLight: new THREE.AmbientLight(),
			algorithm: {
				setReceiverLightPresentationScale: () => {},
				totalHorizontalIlluminance: {value: 100, units: 'lux'},
			},
		};
		for (let mode of ['no-atmosphere', 'shader-off', 'full']) {
			FlatEarthShaderPresentation.apply(frame, {
				mode,
				atmosphereEnabled: mode === 'full',
				sunIlluminationScale: mode === 'full' ? 1 : 0,
				sunDiscBrightnessScale: 1,
				ambientLightIntensity: mode === 'full' ? 0 : 0.03,
			});
			expect(lighting.lights.map(incident)).toEqual(
				mode === 'full'
					? accepted
					: [
							[0, 0, 0],
							[0, 0, 0],
						],
			);
		}
	});
});
