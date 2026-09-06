import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../spectral-values/index.js';
import {NEUTRAL_LAMBERTIAN_REFLECTANCE, NeutralLambertianSceneLighting} from '../NeutralLambertianSceneLighting.js';

function irradiance(value, identity) {
	return /** @type {SpectralIrradiancePacket} */ (
		new SpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
			values: NATIVE_15_SPECTRAL_BASIS.channels.map((_channel, index) => value * (index + 1)),
			provenanceIdentity: identity,
		})
	);
}

describe('NeutralLambertianSceneLighting', () => {
	it('reproduces the accepted direct-only, diffuse-only, and additive combined equations', () => {
		const response = new NeutralLambertianSceneLighting().evaluate({
			identity: 'neutral-lambertian-additivity',
			directNormal: irradiance(2, 'neutral-direct'),
			diffuseIrradiance: irradiance(3, 'neutral-diffuse'),
			surfaceNormal: [0, 0, 1],
			directionToSource: [Math.sqrt(0.75), 0, 0.5],
		});
		const scale = NEUTRAL_LAMBERTIAN_REFLECTANCE / Math.PI;

		expect(response.reflectance).toBe(0.18);
		expect(response.directCosine).toBeCloseTo(0.5, 15);
		for (let index = 0; index < NATIVE_15_SPECTRAL_BASIS.channelCount; index += 1) {
			const direct = response.directIrradiance.values[index] * scale;
			const diffuse = 3 * (index + 1) * scale;
			expect(response.directRadiance.values[index]).toBe(direct);
			expect(response.diffuseRadiance.values[index]).toBe(diffuse);
			expect(response.combinedRadiance.values[index]).toBe(
				response.directRadiance.values[index] + response.diffuseRadiance.values[index],
			);
		}
	});

	it('preserves diffuse light while direct support is zero below the surface horizon', () => {
		const response = new NeutralLambertianSceneLighting().evaluate({
			identity: 'neutral-lambertian-dark-direct',
			directNormal: irradiance(2, 'below-horizon-direct'),
			diffuseIrradiance: irradiance(0.25, 'twilight-diffuse'),
			surfaceNormal: [0, 0, 1],
			directionToSource: [0, 0, -1],
		});

		expect(response.directCosine).toBe(0);
		expect(response.directRadiance.values.every((value) => value === 0)).toBeTrue();
		expect(response.diffuseRadiance.values.every((value) => value > 0)).toBeTrue();
		expect(response.combinedRadiance.values).toEqual(response.diffuseRadiance.values);
	});

	it('uses no Color or photopic input and rejects incompatible physical values', () => {
		const lighting = new NeutralLambertianSceneLighting();
		const request = {
			identity: 'neutral-lambertian-validation',
			directNormal: irradiance(1, 'validation-direct'),
			diffuseIrradiance: irradiance(1, 'validation-diffuse'),
			surfaceNormal: [0, 0, 1],
			directionToSource: [0, 0, 1],
		};

		expect(Object.keys(request)).not.toContain('color');
		expect(Object.keys(request)).not.toContain('photopicIlluminance');
		expect(() => lighting.evaluate({...request, reflectance: 1.01})).toThrowError(RangeError);
		expect(() => lighting.evaluate({...request, surfaceNormal: [0, 0, 0]})).toThrowError(RangeError);
	});
});
