import {SpectralBasis} from '../../spectral-values/index.js';

/** Spectral basis shared by ShaderBuilder test doubles. */
const TEST_SPECTRAL_BASIS = new SpectralBasis({
	id: 'shader-builder-test-basis',
	channels: [
		{
			id: 'w550',
			center: {value: 550, units: 'nanometers'},
			width: {value: 20, units: 'nanometers'},
		},
	],
});

/**
 * Called by this module to create an unchecked pixel-size fixture.
 *
 * @param {number} width - The fixture width in pixels.
 * @param {number} height - The fixture height in pixels.
 * @returns {PixelSize} - The pixel-size fixture.
 *
 */
function pixelSize(width, height) {
	return {width, height, units: 'pixels'};
}

/**
 * Called by this module to create the automatic ShaderBuilder model fixture graph.
 *
 * @param {object} controller - The scattering cache-controller test double.
 * @param {object | null} [celestialController] - Optional celestial cache-controller test double.
 * @returns {object} - The automatic shader-model test double.
 *
 */
function createAutomaticShaderModel(controller, celestialController = null) {
	const observation = {
		instant: '2024-06-21T12:00:00.000Z',
		location: {latitude: 0, longitude: 0},
	};
	const placement = {
		sourceId: 'shader-builder-test-sun',
		kind: 'distant-uniform-sun',
		directionToSource: [0, 0, 1],
		support: {kind: 'uniform-disk', angularRadiusRadians: 0.004, classification: 'full', visibleFraction: 1},
	};
	const query = {kind: 'spherical-celestial-query-v1'};
	const geometry = {
		resolveSceneDepthMax: jasmine.createSpy('resolveSceneDepthMax').and.returnValue({value: 321, units: 'meters'}),
		resolveCelestialPlacements: jasmine.createSpy('resolveCelestialPlacements').and.returnValue([placement]),
		createCelestialQueryPacket: jasmine.createSpy('createCelestialQueryPacket').and.returnValue(query),
		/** @returns {ShaderContribution} - Celestial stencil fixture. */
		createCelestialCacheShaderContribution: jasmine
			.createSpy('createCelestialCacheShaderContribution')
			.and.callFake(() => {
				return createContribution({
					id: 'geometry-celestial-stencil-test',
					owner: 'geometry',
					provides: ['geometry.celestialCacheStencilTypes'],
					uniforms: [],
					functions: [
						{
							id: 'celestial-stencil-test-type',
							slot: 'declareTypes',
							order: 1,
							code: 'struct CelestialCacheBilinearStencil { ivec2 receiverIndices; vec2 receiverWeights; ivec2 directionIndices; vec2 directionWeights; };',
						},
					],
					bindingRequirements: [],
				});
			}),
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return createContribution({
				id: 'geometry-owner-test',
				owner: 'geometry',
				provides: ['geometry.test'],
				uniforms: [
					{
						name: 'uSceneDepthMaxMeters',
						type: 'float',
						valueKey: 'geometry.sceneDepthMax',
					},
				],
				functions: [],
				bindingRequirements: [],
			});
		},
	};
	const atmosphere = {
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return createContribution({
				id: 'atmosphere-owner-test',
				owner: 'atmosphere',
				provides: ['atmosphere.test'],
				uniforms: [],
				functions: [],
				bindingRequirements: [],
			});
		},
	};
	const lightSource = {
		id: placement.sourceId,
		kind: 'distant-uniform-sun',
		celestialSourceDefinition: {
			id: placement.sourceId,
			kind: 'distant-uniform-sun',
			angularRadius: {value: 0.004, units: 'radians'},
			surfaceRadiance: {
				basis: TEST_SPECTRAL_BASIS,
				values: [1],
				units: 'watts-per-square-meter-per-steradian-per-nanometer',
				contentHash: 'shader-builder-test-sun-radiance',
			},
			profile: 'uniform-disk',
		},
		describeCelestialSourceIdentity: jasmine
			.createSpy('describeCelestialSourceIdentity')
			.and.returnValue({definitionHash: 'shader-builder-test-sun'}),
		createCacheController: jasmine.createSpy('createCacheController').and.returnValue(controller),
		createDistantSunCelestialCacheController: jasmine
			.createSpy('createDistantSunCelestialCacheController')
			.and.returnValue(celestialController),
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return createContribution({
				id: 'light-owner-test',
				owner: 'lightSource',
				provides: ['light.test'],
				uniforms: [],
				functions: [],
				bindingRequirements: [],
			});
		},
	};

	return {
		version: 14,
		geometry,
		atmosphere,
		lightSource,
		celestialSources: null,
		spectral: {basis: TEST_SPECTRAL_BASIS},
		profile: {models: {sourcePlacement: {kind: 'geometry-observation', observation}}},
		_testCelestialPlacement: placement,
		_testCelestialQuery: query,
	};
}

/**
 * @param {string} [fieldId] - Opaque field identity represented by the cache.
 * @returns {object} - The distant-Sun celestial shader-cache test double.
 */
function createCelestialShaderCacheDouble(fieldId = 'test-celestial-cache-field') {
	const runtimeBindings = {
		backendId: 'test-cache-backend',
		bindings: [
			{
				id: 'test-celestial-cache-binding',
				valueKey: 'cache.celestial.sunTransport',
				fieldId,
				backendId: 'test-cache-backend',
			},
		],
	};
	return {
		getRuntimeBindings: () => runtimeBindings,
		/** @returns {ShaderContribution} - Celestial lookup fixture. */
		createShaderContribution() {
			return createContribution({
				id: 'cache-celestial-owner-test',
				owner: 'cache',
				provides: ['cache.sampleDistantSunCelestialRadiance'],
				requires: ['geometry.celestialCacheStencilTypes'],
				uniforms: [],
				textures: [
					{
						name: 'uDistantSunCelestialCache',
						type: 'sampler2DArray',
						valueKey: 'cache.celestial.sunTransport',
					},
				],
				functions: [],
				bindingRequirements: [
					{
						id: 'cache.celestial-sun-transport',
						owner: 'cache',
						kind: 'texture',
						updateFrequency: 'setup',
						valueKey: 'cache.celestial.sunTransport',
						required: true,
					},
				],
			});
		},
		/** @returns {ShaderContribution} - Live celestial raster fixture. */
		createLiveShaderContribution() {
			return createContribution({
				id: 'celestial-live-raster-test',
				owner: 'celestialCache',
				provides: ['celestial.evaluateRadiance'],
				requires: ['runtime.initialState', 'cache.sampleDistantSunCelestialRadiance'],
				uniforms: [],
				functions: [],
				bindingRequirements: [],
			});
		},
		dispose: jasmine.createSpy('celestialCache.dispose'),
	};
}

/** @param {string} [fieldId] - Opaque stellar field identity. @returns {object} - Stellar cache double. */
function createStellarShaderCacheDouble(fieldId = 'test-stellar-cache-field') {
	const runtimeBindings = {
		backendId: 'test-cache-backend',
		bindings: [
			{
				id: 'test-stellar-cache-binding',
				valueKey: 'cache.celestial.starTransport',
				fieldId,
				backendId: 'test-cache-backend',
			},
		],
	};
	return {
		getRuntimeBindings: () => runtimeBindings,
		createShaderContribution() {
			return createContribution({
				id: 'cache-stellar-owner-test',
				owner: 'cache',
				provides: ['cache.sampleStellarPointSetIrradiance'],
				requires: ['geometry.celestialCacheStencilTypes'],
				uniforms: [],
				textures: [
					{name: 'uStellarPointSetCache', type: 'sampler2DArray', valueKey: 'cache.celestial.starTransport'},
				],
				functions: [],
				bindingRequirements: [
					{
						id: 'cache.stellar-point-set-transport',
						owner: 'cache',
						kind: 'texture',
						updateFrequency: 'setup',
						valueKey: 'cache.celestial.starTransport',
						required: true,
					},
				],
			});
		},
		createLiveShaderContribution: jasmine.createSpy('stellarCache.createLiveShaderContribution').and.callFake(() =>
			createContribution({
				id: 'celestial-stellar-live-raster-test',
				owner: 'celestialCache',
				provides: ['celestial.evaluateStellarPointSetRadiance'],
				requires: ['celestial.evaluateRadiance', 'cache.sampleStellarPointSetIrradiance'],
				uniforms: [],
				functions: [],
				mainHooks: [],
				bindingRequirements: [],
			}),
		),
		dispose: jasmine.createSpy('stellarCache.dispose'),
	};
}

/**
 * @param {object} cache - Celestial cache returned by the controller.
 * @returns {object} - Celestial controller test double.
 */
function createCelestialCacheControllerDouble(cache) {
	return {
		active: cache,
		build: jasmine.createSpy('celestialController.build').and.resolveTo(cache),
		dispose: jasmine.createSpy('celestialController.dispose').and.callFake(() => cache.dispose()),
	};
}

/**
 * Called by this module to create a shader-cache protocol double.
 *
 * @returns {object} - The shader-cache test double.
 *
 */
function createShaderCacheDouble() {
	const runtimeBindings = {
		backendId: 'test-cache-backend',
		bindings: [
			{
				id: 'test-cumulative-cache-binding',
				valueKey: 'cache.cumulativeScatteringDensity',
				fieldId: 'test-cumulative-cache-field',
				backendId: 'test-cache-backend',
			},
		],
	};
	return {
		/**
		 * Called by create shader cache double to read runtime bindings.
		 * @returns - The callback result returned to its caller.
		 */ getRuntimeBindings: () => runtimeBindings,
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return createContribution({
				id: 'cache-owner-test',
				owner: 'cache',
				provides: ['cache.sampleCumulativeScatteringDensity'],
				uniforms: [],
				textures: [
					{
						name: 'uCumulativeScatteringDensityCache',
						type: 'sampler2DArray',
						valueKey: 'cache.cumulativeScatteringDensity',
					},
				],
				functions: [],
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
		},
		dispose: jasmine.createSpy('cache.dispose'),
	};
}

/**
 * Called by this module to create a cache-controller protocol double.
 *
 * @param {*} cache - The shader-cache test double controlled by the result.
 * @returns {object} - The cache-controller test double.
 *
 */
function createCacheControllerDouble(cache) {
	return {
		active: cache,
		createScatteringCache: jasmine.createSpy('createScatteringCache').and.resolveTo(cache),
		dispose: jasmine.createSpy('controller.dispose').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () => cache.dispose(),
		),
	};
}

/**
 * Called by this module to create a cache-backend protocol double.
 *
 * @returns {object} - The cache-backend test double.
 *
 */
function createCacheBackendDouble() {
	const runtimeTexture = {};
	return {
		id: 'test-cache-backend',
		capabilities: {id: 'test-cache-capabilities'},
		runtimeTexture,
		installRuntimeBindings: jasmine.createSpy('installRuntimeBindings').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param input1 - The destructured input accepted by the operation.
			 */ ({bindings, uniforms}) => {
				for (const binding of bindings.bindings) {
					uniforms[binding.valueKey].value = runtimeTexture;
				}
			},
		),
	};
}

/**
 * Called by this module to create a transport protocol double.
 *
 * @returns {object} - The transport test double.
 *
 */
function createTransportDouble() {
	return {
		/**
		 * Call this method to main required shader symbols.
		 * @returns - The result produced by the operation.
		 */ mainRequiredShaderSymbols() {
			return [
				'runtime.initialState',
				'cache.sampleCumulativeScatteringDensity',
				'transport.evaluatePathRadiance',
				'color.encodeOutput',
			];
		},
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return createContribution({
				id: 'transport-core-test',
				owner: 'transport',
				provides: ['transport.evaluatePathRadiance', 'composition.composeSpectralRadiance'],
				requires: ['cache.sampleCumulativeScatteringDensity'],
				uniforms: [],
				functions: [],
				bindingRequirements: [],
			});
		},
	};
}

/**
 * Called by this module to create a color-output protocol double.
 *
 * @returns {object} - The color-output test double.
 *
 */
function createColorDouble() {
	return {
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return createContribution({
				id: 'color-configured-output',
				owner: 'color',
				provides: ['color.composeSceneColor', 'color.encodeOutput'],
				requires: ['runtime.initialState'],
				uniforms: [],
				functions: [],
				mainHooks: [
					{
						id: 'color-compose-test',
						slot: 'composeSceneColor',
						order: 0,
						code: 'state.outputRgba = vec4(1.0);',
					},
					{
						id: 'color-encode-test',
						slot: 'encodeOutput',
						order: 0,
						code: 'outColor = state.outputRgba;',
					},
				],
				bindingRequirements: [],
			});
		},
	};
}

/**
 * Called by this module to create one shader-contribution fixture with optional overrides.
 *
 * @param {Partial<ShaderContribution>} [overrides] - The contribution overrides.
 * @returns {ShaderContribution} - The shader-contribution fixture.
 *
 */
function createContribution(overrides = {}) {
	return {
		id: 'runtime-state',
		owner: 'runtime',
		provides: ['createInitialShaderState'],
		requires: [],
		defines: [],
		uniforms: [
			{
				name: 'uRuntimeGain',
				type: 'float',
				valueKey: 'runtimeGain',
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
				id: 'uniform.runtime-gain',
				owner: 'runtime',
				kind: 'uniform',
				updateFrequency: 'config',
				valueKey: 'runtimeGain',
				required: true,
			},
		],
		...overrides,
	};
}

/**
 * Called by this module to create a composer double with add/remove pass support.
 *
 * @returns {object} - The composer test double.
 *
 */
function createComposerDouble() {
	return {
		passes: [],
		/**
		 * Call this method to add pass.
		 * @param pass - The pass value accepted by the operation.
		 */ addPass(pass) {
			this.passes.push(pass);
		},
		/**
		 * Call this method to remove pass.
		 * @param pass - The pass value accepted by the operation.
		 */ removePass(pass) {
			const index = this.passes.indexOf(pass);

			if (index !== -1) {
				this.passes.splice(index, 1);
			}
		},
	};
}

/**
 * Called by this module to create the Three constructor and constant test namespace.
 *
 * @returns {object} - The Three namespace test double.
 *
 */
function createThreeDouble() {
	return {
		GLSL3: 'GLSL3',
		RGBAFormat: 'RGBAFormat',
		UnsignedByteType: 'UnsignedByteType',
		FloatType: 'FloatType',
		NearestFilter: 'NearestFilter',
		LinearFilter: 'LinearFilter',
		ClampToEdgeWrapping: 'ClampToEdgeWrapping',
		Color: /** Color object. */ class Color {},
		Vector2: /** Vector2 object. */ class Vector2 {
			/**
			 * Creates a vector2 instance for the declared contract.
			 * @param x - The x value accepted by the operation.
			 * @param y - The y value accepted by the operation.
			 */ constructor(x, y) {
				this.x = x;
				this.y = y;
			}

			/**
			 * Call this method to set.
			 * @param x - The x value accepted by the operation.
			 * @param y - The y value accepted by the operation.
			 */ set(x, y) {
				this.x = x;
				this.y = y;
			}
		},
		Vector3: /** Vector3 object. */ class Vector3 {
			/**
			 * Creates a vector3 instance for the declared contract.
			 * @param x - The x value accepted by the operation.
			 * @param y - The y value accepted by the operation.
			 * @param z - The z value accepted by the operation.
			 */ constructor(x = 0, y = 0, z = 0) {
				this.set(x, y, z);
			}

			/**
			 * Call this method to set.
			 * @param x - The x value accepted by the operation.
			 * @param y - The y value accepted by the operation.
			 * @param z - The z value accepted by the operation.
			 */ set(x, y, z) {
				this.x = x;
				this.y = y;
				this.z = z;
			}
		},
		WebGLRenderTarget: /** Web gl render target object. */ class WebGLRenderTarget {
			/**
			 * Creates a web gl render target instance for the declared contract.
			 * @param width - The width value accepted by the operation.
			 * @param height - The height value accepted by the operation.
			 * @param options - The optional operation choices.
			 */ constructor(width, height, options) {
				this.width = width;
				this.height = height;
				this.options = options;
				this.texture = {};
				this.disposed = false;
			}

			/**
			 * Call this method to set size.
			 * @param width - The width value accepted by the operation.
			 * @param height - The height value accepted by the operation.
			 */ setSize(width, height) {
				this.width = width;
				this.height = height;
			}

			/** Call this method to dispose. */ dispose() {
				this.disposed = true;
			}
		},
		Data3DTexture: /** Data3 d texture object. */ class Data3DTexture {
			/**
			 * Creates a data3 d texture instance for the declared contract.
			 * @param data - The data value accepted by the operation.
			 * @param width - The width value accepted by the operation.
			 * @param height - The height value accepted by the operation.
			 * @param depth - The depth value accepted by the operation.
			 */ constructor(data, width, height, depth) {
				this.image = {
					data,
					width,
					height,
					depth,
				};
				this.disposed = false;
			}

			/** Call this method to dispose. */ dispose() {
				this.disposed = true;
			}
		},
		RawShaderMaterial: /** Raw shader material object. */ class RawShaderMaterial {
			/**
			 * Creates a raw shader material instance for the declared contract.
			 * @param parameters - The parameters value accepted by the operation.
			 */ constructor(parameters) {
				this.parameters = parameters;
				this.uniforms = parameters.uniforms;
				this.disposed = false;
			}

			/** Call this method to dispose. */ dispose() {
				this.disposed = true;
			}
		},
		ShaderMaterial: /** Shader material object. */ class ShaderMaterial {
			/**
			 * Creates a shader material instance for the declared contract.
			 * @param parameters - The parameters value accepted by the operation.
			 */ constructor(parameters) {
				this.parameters = parameters;
				this.uniforms = parameters.uniforms;
				this.disposed = false;
			}

			/** Call this method to dispose. */ dispose() {
				this.disposed = true;
			}
		},
		PlaneGeometry: /** Plane geometry object. */ class PlaneGeometry {
			/**
			 * Creates a plane geometry instance for the declared contract.
			 * @param width - The width value accepted by the operation.
			 * @param height - The height value accepted by the operation.
			 */ constructor(width, height) {
				this.width = width;
				this.height = height;
				this.disposed = false;
			}

			/** Call this method to dispose. */ dispose() {
				this.disposed = true;
			}
		},
		Mesh: /** Mesh object. */ class Mesh {
			/**
			 * Creates a mesh instance for the declared contract.
			 * @param geometry - The geometry value accepted by the operation.
			 * @param material - The material value accepted by the operation.
			 */ constructor(geometry, material) {
				this.geometry = geometry;
				this.material = material;
			}
		},
		Scene: /** Scene object. */ class Scene {
			/** Creates a scene instance for the declared contract. */ constructor() {
				this.children = [];
			}

			/**
			 * Call this method to add.
			 * @param child - The child value accepted by the operation.
			 */ add(child) {
				this.children.push(child);
			}
		},
		OrthographicCamera: /** Orthographic camera object. */ class OrthographicCamera {
			/**
			 * Creates a orthographic camera instance for the declared contract.
			 * @param left - The left value accepted by the operation.
			 * @param right - The right value accepted by the operation.
			 * @param topCoordinate - The top coordinate accepted by the operation.
			 * @param bottom - The bottom value accepted by the operation.
			 * @param near - The near value accepted by the operation.
			 * @param farPlaneDistance - The far-plane distance accepted by the operation.
			 */ constructor(left, right, topCoordinate, bottom, near, farPlaneDistance) {
				this.left = left;
				this.right = right;
				this.top = topCoordinate;
				this.bottom = bottom;
				this.near = near;
				this.far = farPlaneDistance;
			}
		},
	};
}

/** Shared ShaderBuilder fixture and protocol-double methods. */
export const ShaderBuilderTestSupport = {
	TEST_SPECTRAL_BASIS,
	pixelSize,
	createAutomaticShaderModel,
	createShaderCacheDouble,
	createCelestialShaderCacheDouble,
	createStellarShaderCacheDouble,
	createCacheControllerDouble,
	createCelestialCacheControllerDouble,
	createCacheBackendDouble,
	createTransportDouble,
	createColorDouble,
	createContribution,
	createComposerDouble,
	createThreeDouble,
};
