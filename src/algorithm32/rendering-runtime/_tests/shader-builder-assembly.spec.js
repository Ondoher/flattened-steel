import {ShaderBuilder} from '../ShaderBuilder.js';
import {ShaderBuilderTestSupport} from './ShaderBuilderTestSupport.js';

/** {pixel size, test spectral basis, create color double, create contribution} constant. */
const {pixelSize, TEST_SPECTRAL_BASIS, createColorDouble, createContribution} = ShaderBuilderTestSupport;

describe('ShaderBuilder assembly', /** Called by Jasmine to register the named test suite. */ () => {
	it('builds a setup-time artifact packet from required attachment handles', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const model = {
			version: 7,
		};
		const builder = new ShaderBuilder({model});
		const setup = {
			composer: {},
			scene: {},
			camera: {},
			viewportSize: pixelSize(1, 1),
		};

		const result = await builder.build({setup});

		expect(result).toEqual({
			modelVersion: 7,
			setup,
			scatteringCacheController: null,
			scatteringCache: null,
			scatteringCacheControllerIdentity: null,
			distantSunCelestialCacheController: null,
			distantSunCelestialCache: null,
			distantSunCelestialCacheIdentity: null,
			stellarPointSetCacheController: null,
			stellarPointSetCache: null,
			stellarPointSetCacheIdentity: null,
			flatFiniteSunCacheController: null,
			flatFiniteSunCache: null,
			flatFiniteSunCacheIdentity: null,
			diagnostics: {
				status: 'deferred',
			},
		});
	});

	it('requires the canonical unit-bearing viewport size', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const builder = new ShaderBuilder({
			model: {
				version: 1,
			},
		});
		const setup = {
			composer: {},
			scene: {},
			camera: {},
		};

		await expectAsync(builder.build({setup})).toBeRejectedWithError(/viewportSize/);
		await expectAsync(
			builder.build({
				setup: {
					...setup,
					viewportSize: [8, 4],
				},
			}),
		).toBeRejectedWithError(/units "pixels"/);
	});

	it('assembles shader source from direct contributions', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const builder = new ShaderBuilder({
			model: {
				version: 2,
			},
		});
		const setup = {
			composer: {},
			scene: {},
			camera: {},
			viewportSize: pixelSize(1, 1),
		};

		const result = await builder.build({
			setup,
			contributions: [createContribution()],
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(result.modelVersion).toBe(2);
		expect(result.diagnostics).toEqual({
			status: 'assembled',
		});
		expect(result.assembly.status).toBe('accepted');
		expect(result.assembly.fragmentShaderSource).toContain('uniform float uRuntimeGain;');
		expect(
			result.bindingRequirements.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param binding - The binding value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (binding) => binding.id,
			),
		).toEqual(['uniform.runtime-gain']);
	});

	it('collects optional owner-provided shader contributions from configured models', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		let receivedProviderRequest;
		const model = {
			version: 10,
			spectral: {basis: TEST_SPECTRAL_BASIS},
			geometry: {
				/**
				 * Call this method to create shader contribution.
				 * @param request - The request accepted by the operation.
				 * @returns - The result produced by the operation.
				 */ createShaderContribution(request) {
					receivedProviderRequest = request;

					return createContribution({
						id: 'geometry-state',
						owner: 'geometry',
						provides: ['createInitialShaderState'],
						uniforms: [],
						bindingRequirements: [],
					});
				},
			},
		};
		const builder = new ShaderBuilder({model});

		const result = await builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
			},
			config: {config: {}},
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(receivedProviderRequest).toEqual({model});
		expect(
			result.assembly.contributions.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param contribution - The contribution value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (contribution) => contribution.id,
			),
		).toContain('geometry-state');
		expect(result.assembly.validationReport.status).toBe('accepted');
	});

	it('adds the shared runtime contribution when owner contributions require runtime initial state', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const model = {
			version: 11,
			spectral: {basis: TEST_SPECTRAL_BASIS},
			geometry: {
				/**
				 * Call this method to create shader contribution.
				 * @returns - The result produced by the operation.
				 */ createShaderContribution() {
					return {
						id: 'geometry-ray',
						owner: 'geometry',
						provides: ['geometry.reconstructViewRay'],
						requires: ['runtime.initialState'],
						defines: [],
						uniforms: [],
						textures: [],
						functions: [],
						mainHooks: [],
						bindingRequirements: [],
					};
				},
			},
		};
		const builder = new ShaderBuilder({model});

		const result = await builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
			},
			config: {
				config: {
					color: createColorDouble(),
				},
			},
			mainRequiredSymbols: ['runtime.initialState', 'geometry.reconstructViewRay'],
		});

		expect(
			result.assembly.contributions.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param contribution - The contribution value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (contribution) => contribution.id,
			),
		).toContain('runtime-three-single-camera');
		expect(result.assembly.validationReport.providedSymbols).toContain('runtime.initialState');
		expect(result.assembly.fragmentShaderSource).toContain(
			'ShaderState createInitialShaderState(vec2 textureCoordinates)',
		);
		expect(result.assembly.fragmentShaderSource).toContain('texelFetch(uSceneDepthTexture, sceneInputPixel, 0)');
		expect(result.assembly.fragmentShaderSource).toContain('texelFetch(uSceneHitTexture, sceneInputPixel, 0)');
		expect(result.assembly.fragmentShaderSource).toContain(
			'state.sceneDisplayRgb = texelFetch(uSceneColorTexture, sceneInputPixel, 0).rgb;',
		);
		expect(result.assembly.fragmentShaderSource).not.toContain('endpointRadiance');
		expect(result.assembly.fragmentShaderSource).toContain('const int SPECTRAL_CHANNEL_COUNT = 1;');
	});

	it('rejects encoded color assembly without configured Color', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const model = {
			version: 12,
			spectral: {basis: TEST_SPECTRAL_BASIS},
		};
		const builder = new ShaderBuilder({model});

		await expectAsync(
			builder.build({
				setup: {
					composer: {},
					scene: {},
					camera: {},
					viewportSize: pixelSize(1, 1),
				},
				mainRequiredSymbols: ['runtime.initialState', 'color.encodeOutput'],
			}),
		).toBeRejectedWithError(/Shader contributions do not satisfy the required symbol inventory/u);
	});

	it('collects Color shader contributions from the accepted facade config', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		let receivedProviderRequest;
		const color = {
			/**
			 * Call this method to convert.
			 * @returns - The result produced by the operation.
			 */ convert() {
				return {rgba: [1, 1, 1, 1]};
			},
			/**
			 * Call this method to create shader contribution.
			 * @param request - The request accepted by the operation.
			 * @returns - The result produced by the operation.
			 */ createShaderContribution(request) {
				receivedProviderRequest = request;

				return {
					id: 'color-configured-output',
					owner: 'color',
					provides: ['color.encodeOutput'],
					requires: ['runtime.initialState'],
					defines: [],
					uniforms: [],
					textures: [],
					functions: [],
					mainHooks: [
						{
							id: 'configured-color-output',
							slot: 'encodeOutput',
							order: 0,
							code: 'outColor = vec4(1.0);',
						},
					],
					bindingRequirements: [],
				};
			},
		};
		const model = {
			version: 13,
			spectral: {basis: TEST_SPECTRAL_BASIS},
		};
		const builder = new ShaderBuilder({model});

		const result = await builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
			},
			config: {
				config: {
					color,
				},
			},
			mainRequiredSymbols: ['runtime.initialState', 'color.encodeOutput'],
		});

		expect(receivedProviderRequest).toEqual({model});
		expect(
			result.assembly.contributions.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param contribution - The contribution value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (contribution) => contribution.id,
			),
		).toContain('color-configured-output');
		expect(result.assembly.fragmentShaderSource).toContain('outColor = vec4(1.0);');
	});
});
