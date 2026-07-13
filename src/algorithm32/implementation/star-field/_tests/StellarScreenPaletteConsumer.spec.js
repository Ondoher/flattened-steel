import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {Algorithm32ShaderAssembler} from '../../../shader-assembly/runtime/Algorithm32ShaderAssembler.js';
import {StellarPointSetSource} from '../StellarPointSetSource.js';

describe('stellar screen-palette consumer', () => {
	it('declares one unsigned index fetch and 15 palette fetches with one view-path transmittance application', () => {
		const contribution = new StellarPointSetSource().createStellarScreenPaletteConsumerShaderContribution();
		const code = contribution.functions.map((block) => block.code).join('\n');

		expect(contribution).toEqual(
			jasmine.objectContaining({
				id: 'celestial-stellar-screen-palette-consumer',
				owner: 'stellarSource',
				provides: ['celestial.evaluateStellarScreenPaletteRadiance'],
			}),
		);
		expect(contribution.textures).toEqual([
			{
				name: 'uStellarScreenIndex',
				type: 'usampler2D',
				valueKey: 'runtime.celestial.stellarScreenIndex',
			},
			{name: 'uStellarPalette', type: 'sampler2D', valueKey: 'runtime.celestial.stellarPalette'},
		]);
		expect(code.match(/texelFetch\(uStellarScreenIndex/gu)?.length).toBe(1);
		expect(code.match(/texelFetch\(uStellarPalette/gu)?.length).toBe(1);
		expect(code.match(/state\.transmittance\.channels\[channelIndex\]/gu)?.length).toBe(1);
		expect(code).toContain('if (state.sceneHitMask > 0.5) return;');
		expect(code).toContain('if (paletteIndex == 0u) return;');
		expect(code).not.toContain('memberIndex');
		expect(contribution.bindingRequirements.every((binding) => binding.required === false)).toBeTrue();
	});

	it('assembles after the celestial initializer and before common spectral composition', () => {
		const contribution = new StellarPointSetSource().createStellarScreenPaletteConsumerShaderContribution();
		const dependency = (id, provides, code = '') =>
			ShaderContributions.createShaderContribution({
				id,
				owner: 'runtime',
				provides,
				functions: code
					? [ShaderContributions.createShaderSourceBlock(`${id}-source`, 'declareTypes', 0, code)]
					: [],
			});
		const runtime = dependency(
			'consumer-runtime-test',
			['runtime.initialState'],
			`const int SPECTRAL_CHANNEL_COUNT = 15;
			struct SpectralValue { float channels[15]; };
			struct ShaderState { vec2 textureCoordinates; float sceneHitMask; SpectralValue transmittance; };
			SpectralValue zeroSpectral() { SpectralValue value; for (int i = 0; i < 15; i += 1) value.channels[i] = 0.0; return value; }
			ShaderState createInitialShaderState(vec2 uv) { ShaderState state; state.textureCoordinates = uv; state.sceneHitMask = 0.0; state.transmittance = zeroSpectral(); return state; }`,
		);
		const transport = dependency('consumer-transport-test', ['transport.evaluatePathRadiance']);
		const celestial = ShaderContributions.createShaderContribution({
			id: 'consumer-celestial-test',
			owner: 'celestialCache',
			provides: ['celestial.evaluateRadiance'],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'consumer-celestial-init',
					'evaluateCelestialRadiance',
					0,
					'SpectralValue celestialRadiance = zeroSpectral();',
				),
			],
		});
		const assembly = new Algorithm32ShaderAssembler().assemble({
			contributions: [runtime, transport, celestial, contribution],
			mainRequiredSymbols: [
				'runtime.initialState',
				'transport.evaluatePathRadiance',
				'celestial.evaluateRadiance',
				'celestial.evaluateStellarScreenPaletteRadiance',
			],
			systemProvidedSymbols: [],
		});
		const initializerOffset = assembly.fragmentShaderSource.indexOf(
			'SpectralValue celestialRadiance = zeroSpectral();',
		);
		const consumerOffset = assembly.fragmentShaderSource.indexOf(
			'addStellarScreenPaletteRadiance(celestialRadiance, state);',
		);
		expect(initializerOffset).toBeGreaterThan(-1);
		expect(consumerOffset).toBeGreaterThan(initializerOffset);
		expect(assembly.fragmentShaderSource).toContain('precision highp usampler2D;');
	});
});
