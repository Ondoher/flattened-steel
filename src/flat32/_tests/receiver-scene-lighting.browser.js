import * as THREE from 'three';

import {BrunetonColorDisplayModel} from '../../algorithm32/implementation/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../algorithm32/profiles/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../algorithm32/spectral-values/index.js';
import {LocalSunSceneLighting} from '../LocalSunSceneLighting.js';

function irradiance(value, identity) {
	return /** @type {SpectralIrradiancePacket} */ (
		new SpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
			values: NATIVE_15_SPECTRAL_BASIS.channels.map((_channel, index) => value * (1 + index / 20)),
			provenanceIdentity: identity,
		})
	);
}

function receiverLight(directValue, diffuseValue, identity) {
	return {
		identity,
		directNormal: irradiance(directValue, `${identity}:direct`),
		diffuseHorizontal: irradiance(diffuseValue, `${identity}:diffuse`),
	};
}

describe('Flat32 receiver-driven scene lighting', () => {
	it('retains the newest illustration scale across measured publication and rollback', () => {
		const lighting = new LocalSunSceneLighting(new THREE.Group()),
			color = new BrunetonColorDisplayModel();
		lighting.install();
		try {
			lighting.updateFromDistantSun([0, 0, 1], receiverLight(2, 0.5, 'accepted'), color);
			const physical = lighting.describe();
			lighting.setSunIlluminationScale(0.5);
			const transaction = lighting.prepareMeasuredLocalLighting(
				{coordinates: [0, 4828, -2000], units: 'scene-units'},
				receiverLight(4, 1, 'pending'),
				color,
			);
			lighting.setSunIlluminationScale(0);
			transaction.publish();
			expect(lighting.describe().directionalIntensity).toBe(0);
			lighting.setSunIlluminationScale(0.25);
			transaction.revert();
			expect(lighting.describe().directionalIntensity).toBeCloseTo(physical.directionalIntensity * 0.25, 12);
			expect(lighting.describe().ambientIntensity).toBeCloseTo(physical.ambientIntensity * 0.25, 12);
			lighting.setSunIlluminationScale(1);
			expect(lighting.describe().directionalIntensity).toBeCloseTo(physical.directionalIntensity, 12);
		} finally {
			lighting.dispose();
		}
	});
	it('stages measured local lighting without changing the displayed lights, then publishes and restores it', () => {
		const parent = new THREE.Group(),
			lighting = new LocalSunSceneLighting(parent),
			color = new BrunetonColorDisplayModel();
		lighting.install();
		const original = lighting.describe();
		const group = parent.children[0],
			ambient = group.children.find((object) => object instanceof THREE.HemisphereLight);
		const previousRgb = ambient.color.toArray();
		const transaction = lighting.prepareMeasuredLocalLighting(
			{coordinates: [0, 4828, -2000], units: 'scene-units'},
			receiverLight(2, 0.5, 'exact-local'),
			color,
		);
		expect(lighting.describe()).toEqual(original);
		expect(ambient.color.toArray()).toEqual(previousRgb);
		transaction.publish();
		expect(ambient.userData.receiverLightIdentity).toBe('exact-local');
		expect(ambient.groundColor.toArray()).toEqual([0, 0, 0]);
		expect(
			group.children
				.filter((object) => object instanceof THREE.DirectionalLight)
				.every((light) => light.userData.receiverLightIdentity === 'exact-local'),
		).toBeTrue();
		transaction.revert();
		expect(lighting.describe()).toEqual(original);
		expect(ambient.color.toArray()).toEqual(previousRgb);
		lighting.dispose();
	});
	it('routes direct-normal and diffuse-horizontal spectra to existing Three lights', () => {
		const parent = new THREE.Group();
		const lighting = new LocalSunSceneLighting(parent);
		const color = new BrunetonColorDisplayModel();
		const dayReceiver = receiverLight(2, 0.5, 'receiver-day');
		lighting.install();

		lighting.updateFromDistantSun([0, 0, 1], dayReceiver, color);
		const day = lighting.describe();
		const group = parent.children[0];
		const ambient = group.children.find((object) => object instanceof THREE.HemisphereLight);
		const directionals = group.children.filter((object) => object instanceof THREE.DirectionalLight);

		expect(day.ambientIntensity).toBeGreaterThan(0);
		expect(day.directionalIntensity).toBeGreaterThan(0);
		expect(ambient.position.toArray()).toEqual([0, 1, 0]);
		expect(ambient.groundColor.toArray()).toEqual([0, 0, 0]);
		expect(ambient.userData.receiverLightIdentity).toBe('receiver-day');
		expect(directionals.every((light) => light.userData.receiverLightIdentity === 'receiver-day')).toBeTrue();
		const rendererAmbient = [
			ambient.color.r * ambient.intensity,
			ambient.color.g * ambient.intensity,
			ambient.color.b * ambient.intensity,
		];
		const recoveredAmbient = color.displayRgbToLinearSrgb(color.rendererLinearSrgbToDisplayRgb(rendererAmbient));
		const projectedAmbient = color.radianceToLinearSrgb(
			new SpectralPacket({
				basis: NATIVE_15_SPECTRAL_BASIS,
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
				values: dayReceiver.diffuseHorizontal.values,
				provenanceIdentity: 'receiver-day:expected-incident-radiance-projection',
			}),
		);
		const expectedAmbient = color.displayRgbToLinearSrgb(color.linearSrgbToDisplayRgb(projectedAmbient));
		for (let channel = 0; channel < 3; channel += 1) {
			expect(recoveredAmbient[channel]).toBeCloseTo(expectedAmbient[channel], 6);
		}
		expect(group.userData.lightingPolicy).toBe('neutral-lambertian-figure1-renderer-bridge-upper-hemisphere-v3');

		lighting.updateFromDistantSun([0, 0, -1], receiverLight(0, 0.25, 'receiver-twilight'), color);
		const twilight = lighting.describe();
		expect(twilight.directionalIntensity).toBe(0);
		expect(twilight.ambientIntensity).toBeGreaterThan(0);
		expect(ambient.userData.receiverLightIdentity).toBe('receiver-twilight');

		lighting.updateFromLocalSun({coordinates: [0, 10, 0]});
		expect(ambient.color.getHex()).toBe(ambient.groundColor.getHex());
		expect(directionals.every((light) => light.color.getHex() === ambient.color.getHex())).toBeTrue();
		lighting.dispose();
		expect(parent.children).toEqual([]);
	});
});
