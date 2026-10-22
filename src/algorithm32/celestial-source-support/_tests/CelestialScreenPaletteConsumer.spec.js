import {CelestialScreenPaletteConsumerShaderContribution} from '../CelestialScreenPaletteConsumerShaderContribution.js';

const SURFACE_RADIANCE = {
	basis: {id: 'native-15'},
	values: Array.from({length: 15}, (_, index) => index + 1),
	units: 'watts-per-square-meter-per-steradian-per-nanometer',
	contentHash: 'sun-surface-radiance-test',
};

describe('CelestialScreenPaletteConsumerShaderContribution', () => {
	it('declares the fixed-cost source-local Sun lookup in front of the optional stellar lookup', () => {
		const contribution = new CelestialScreenPaletteConsumerShaderContribution({
			includeStars: true,
			surfaceRadiance: SURFACE_RADIANCE,
		}).createShaderContribution();
		const source = contribution.functions.map((block) => block.code).join('\n');
		const textureNames = contribution.textures.map((texture) => texture.name);

		expect(textureNames).toEqual(['uStellarScreenIndex', 'uStellarPalette', 'uSunCoverageTile']);
		expect((source.match(/texture\(uSunCoverageTile/g) ?? []).length).toBe(1);
		expect((source.match(/texelFetch\(uStellarScreenIndex/g) ?? []).length).toBe(1);
		expect((source.match(/texelFetch\(\s*uStellarPalette/g) ?? []).length).toBe(1);
		expect(source.indexOf('float sunCoverage = sampleSunCoverageTile(state);')).toBeLessThan(
			source.indexOf('uint paletteIndex = texelFetch(uStellarScreenIndex'),
		);
		expect(source).toContain('if (sunCoverage > 0.0)');
		expect(source).toContain('* sunCoverage');
		expect(source).toContain('* uSunSurfaceRadiance[channelIndex]');
		expect(source).toContain('* uSunSurfaceRadiance[channelIndex] * uSunDiscBrightnessScale');
		expect(
			contribution.uniforms.find((uniform) => uniform.valueKey === 'presentation.sunDiscBrightnessScale'),
		).toEqual(jasmine.objectContaining({name: 'uSunDiscBrightnessScale', defaultValue: 1}));
		expect(source).toContain('if (state.sceneHitMask >= 0.5) return result;');
		expect(contribution.diagnostics).toEqual(
			jasmine.objectContaining({
				layers: 'stars-then-sun',
				sunClaim: 'any-positive-coverage-opaque',
				transport: 'view-path-transmittance-once',
			}),
		);
	});

	it('assembles the Flat/local Sun-only family without stellar bindings or source-specific Color', () => {
		const contribution = new CelestialScreenPaletteConsumerShaderContribution({
			includeStars: false,
			surfaceRadiance: SURFACE_RADIANCE,
		}).createShaderContribution();
		const source = contribution.functions.map((block) => block.code).join('\n');

		expect(contribution.textures.map((texture) => texture.name)).toEqual(['uSunCoverageTile']);
		expect(contribution.bindingRequirements.map((binding) => binding.valueKey)).not.toContain(
			'runtime.celestial.stellarScreenIndex',
		);
		expect(source).not.toContain('uStellarScreenIndex');
		expect(source).not.toContain('uStellarPalette');
		expect(source).not.toContain('color.');
		expect(contribution.provides).toEqual(['celestial.evaluateRadiance']);
	});
});
