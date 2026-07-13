import {Algorithm32ShaderAssembler} from '../Algorithm32ShaderAssembler.js';

/**
 * Called by this module to create one shader contribution.
 *
 * @param {Partial<ShaderContribution>} [overrides] - Supplies overrides.
 * @returns {ShaderContribution} - Return contribution.
 */
function createContribution(overrides = {}) {
	return {
		id: 'runtime-state',
		owner: 'runtime',
		provides: ['createInitialShaderState'],
		requires: [],
		defines: ['#define A32_TEST_MODE 1'],
		uniforms: [
			{
				name: 'uExposure',
				type: 'float',
				valueKey: 'exposure',
			},
		],
		textures: [],
		functions: [
			{
				id: 'state-type',
				slot: 'declareTypes',
				order: 0,
				code: 'struct ShaderState { vec2 textureCoordinates; vec3 color; };',
			},
			{
				id: 'create-state',
				slot: 'declareHelpers',
				order: 0,
				code: 'ShaderState createInitialShaderState(vec2 textureCoordinates) { return ShaderState(textureCoordinates, vec3(0.0)); }',
			},
		],
		mainHooks: [],
		bindingRequirements: [
			{
				id: 'uniform.exposure',
				owner: 'runtime',
				kind: 'uniform',
				updateFrequency: 'config',
				valueKey: 'exposure',
				required: true,
			},
		],
		...overrides,
	};
}

describe('Algorithm32ShaderAssembler', /** Called by Jasmine to register the named test suite. */ () => {
	it('assembles deterministic fragment source from compatible contributions', /** Called by Jasmine to exercise the named behavior. */ () => {
		const assembler = new Algorithm32ShaderAssembler();
		const colorContribution = createContribution({
			id: 'color-output',
			owner: 'color',
			provides: ['encodeOutput'],
			defines: [],
			uniforms: [],
			functions: [],
			mainHooks: [
				{
					id: 'encode-output',
					slot: 'encodeOutput',
					order: 0,
					code: 'state.color = vec3(uExposure);\noutColor = vec4(state.color, 1.0);',
				},
			],
			bindingRequirements: [],
		});
		const first = assembler.assemble({
			contributions: [colorContribution, createContribution()],
			mainRequiredSymbols: ['createInitialShaderState', 'encodeOutput'],
		});
		const second = assembler.assemble({
			contributions: [createContribution(), colorContribution],
			mainRequiredSymbols: ['createInitialShaderState', 'encodeOutput'],
		});

		expect(first.status).toBe('accepted');
		expect(first.fragmentShaderSource).toBe(second.fragmentShaderSource);
		expect(first.sourceHash).toBe(second.sourceHash);
		expect(first.fragmentShaderSource).toContain('#version 300 es');
		expect(first.fragmentShaderSource).toContain('uniform float uExposure;');
		expect(first.fragmentShaderSource).toContain(
			'ShaderState state = createInitialShaderState(screenTextureCoordinates);',
		);
		expect(first.fragmentShaderSource).toContain('outColor = vec4(state.color, 1.0);');
		expect(
			first.bindingRequirements.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param binding - The binding value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (binding) => binding.id,
			),
		).toEqual(['uniform.exposure']);
	});

	it('declares array-sampler precision and emits cumulative-cache helpers in their slot', /** Called by Jasmine to exercise the named behavior. */ () => {
		const cacheContribution = createContribution({
			id: 'cumulative-cache',
			owner: 'cache',
			provides: ['cache.sampleCumulativeScatteringDensity'],
			defines: [],
			uniforms: [],
			textures: [
				{
					name: 'uCumulativeScatteringDensityCache',
					type: 'sampler2DArray',
					valueKey: 'cache.cumulativeScatteringDensity',
				},
			],
			functions: [
				{
					id: 'cumulative-cache-sample',
					slot: 'sampleScatteringCache',
					order: 0,
					code: 'float sampleCumulativeScatteringDensity() { return 1.0; }',
				},
			],
			bindingRequirements: [
				{
					id: 'cache.cumulative-scattering-density',
					owner: 'cache',
					kind: 'texture',
					updateFrequency: 'setup',
					valueKey: 'cache.cumulativeScatteringDensity',
					required: true,
				},
			],
		});
		const assembly = new Algorithm32ShaderAssembler().assemble({
			contributions: [createContribution(), cacheContribution],
			mainRequiredSymbols: ['createInitialShaderState', 'cache.sampleCumulativeScatteringDensity'],
		});
		const source = assembly.fragmentShaderSource;

		expect(source).toContain('precision highp sampler2DArray;');
		expect(source).toContain('uniform sampler2DArray uCumulativeScatteringDensityCache;');
		expect(source.indexOf('uniform sampler2DArray')).toBeLessThan(
			source.indexOf('float sampleCumulativeScatteringDensity'),
		);
		expect(assembly.bindingRequirements[0].id).toBe('cache.cumulative-scattering-density');
	});

	it('orders celestial cache sampling, evaluation, and spectral composition between scattering and Color', /** Called by Jasmine to exercise the named behavior. */ () => {
		const assembler = new Algorithm32ShaderAssembler();
		const scatteringContribution = createContribution({
			id: 'scattering-cache',
			owner: 'cache',
			provides: [],
			defines: [],
			uniforms: [],
			functions: [
				{
					id: 'scattering-sample',
					slot: 'sampleScatteringCache',
					order: 0,
					code: 'void sampleScatteringForOrderTest() {}',
				},
			],
			bindingRequirements: [],
		});
		const celestialContribution = createContribution({
			id: 'celestial-cache',
			owner: 'celestialCache',
			provides: [],
			defines: [],
			uniforms: [],
			functions: [
				{
					id: 'celestial-sample',
					slot: 'sampleCelestialCache',
					order: 0,
					code: 'void sampleCelestialForOrderTest() {}',
				},
				{
					id: 'celestial-evaluate',
					slot: 'evaluateCelestialRadiance',
					order: 0,
					code: 'void evaluateCelestialForOrderTest() {}',
				},
				{
					id: 'celestial-compose',
					slot: 'composeSpectralRadiance',
					order: 0,
					code: 'void composeSpectralForOrderTest() {}',
				},
			],
			mainHooks: [
				{
					id: 'celestial-evaluate-main',
					slot: 'evaluateCelestialRadiance',
					order: 0,
					code: 'evaluateCelestialForOrderTest();',
				},
				{
					id: 'celestial-compose-main',
					slot: 'composeSpectralRadiance',
					order: 0,
					code: 'composeSpectralForOrderTest();',
				},
			],
			bindingRequirements: [],
		});
		const transportContribution = createContribution({
			id: 'transport',
			owner: 'transport',
			provides: [],
			defines: [],
			uniforms: [],
			functions: [
				{
					id: 'transport-evaluate',
					slot: 'evaluateTransport',
					order: 0,
					code: 'void evaluateTransportForOrderTest() {}',
				},
			],
			mainHooks: [
				{
					id: 'transport-evaluate-main',
					slot: 'evaluateTransport',
					order: 0,
					code: 'evaluateTransportForOrderTest();',
				},
			],
			bindingRequirements: [],
		});
		const colorContribution = createContribution({
			id: 'color',
			owner: 'color',
			provides: [],
			defines: [],
			uniforms: [],
			functions: [],
			mainHooks: [
				{
					id: 'color-compose-main',
					slot: 'composeSceneColor',
					order: 0,
					code: 'composeColorForOrderTest();',
				},
			],
			bindingRequirements: [],
		});
		const assembly = assembler.assemble({
			contributions: [
				colorContribution,
				celestialContribution,
				transportContribution,
				scatteringContribution,
				createContribution(),
			],
			mainRequiredSymbols: ['createInitialShaderState'],
		});
		const source = assembly.fragmentShaderSource;

		expect(source.indexOf('sampleScatteringForOrderTest')).toBeLessThan(
			source.indexOf('sampleCelestialForOrderTest'),
		);
		expect(source.indexOf('sampleCelestialForOrderTest')).toBeLessThan(
			source.indexOf('evaluateTransportForOrderTest'),
		);
		expect(source.indexOf('evaluateTransportForOrderTest')).toBeLessThan(
			source.indexOf('evaluateCelestialForOrderTest'),
		);
		expect(source.indexOf('evaluateCelestialForOrderTest')).toBeLessThan(
			source.indexOf('composeSpectralForOrderTest'),
		);
		expect(source.indexOf('composeSpectralForOrderTest')).toBeLessThan(source.indexOf('composeColorForOrderTest'));
		expect(assembly.diagnostics.ownerOrder).toEqual([
			'runtime',
			'geometry',
			'lightSource',
			'atmosphere',
			'cache',
			'celestialCache',
			'transport',
			'color',
		]);
	});

	it('sorts binding requirements by stable id', /** Called by Jasmine to exercise the named behavior. */ () => {
		const assembler = new Algorithm32ShaderAssembler();
		const assembly = assembler.assemble({
			contributions: [
				createContribution({
					bindingRequirements: [
						{
							id: 'z-binding',
							owner: 'runtime',
							kind: 'uniform',
							updateFrequency: 'frame',
							valueKey: 'z',
							required: true,
						},
						{
							id: 'a-binding',
							owner: 'runtime',
							kind: 'uniform',
							updateFrequency: 'frame',
							valueKey: 'a',
							required: true,
						},
					],
				}),
			],
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(
			assembly.bindingRequirements.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param binding - The binding value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (binding) => binding.id,
			),
		).toEqual(['a-binding', 'z-binding']);
	});

	it('throws a structured setup-time error when validation rejects the request', /** Called by Jasmine to exercise the named behavior. */ () => {
		const assembler = new Algorithm32ShaderAssembler();
		let caughtError;

		try {
			assembler.assemble({
				contributions: [],
				mainRequiredSymbols: ['createInitialShaderState'],
			});
		} catch (error) {
			caughtError = error;
		}

		expect(caughtError).toEqual(jasmine.any(Error));
		expect(caughtError.name).toBe('ShaderConfigurationError');
		expect(caughtError.code).toBe('SHADER_SYMBOL_VALIDATION_FAILED');
		expect(caughtError.details.missingRequiredSymbols).toEqual(['createInitialShaderState']);
	});
});
