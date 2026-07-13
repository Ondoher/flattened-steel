import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CachePassAssembler} from '../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {IntegratedCacheTransport} from '../IntegratedCacheTransport.js';

/** Construction options used by the integrated transport contract check. */
const TEST_CONSTRUCTION_OPTIONS = {
	transportIntervalCount: 15,
	maximumScatteringOrder: 4,
};

/** Create one scalar field specification for structural transport checks. */
function createField(id) {
	return {
		id,
		storage: {
			width: 34,
			height: 285,
			layers: 15,
			format: 'R32F',
		},
	};
}

/** Create the geometry capabilities required by one integrated transport pass. */
function createGeometryModule() {
	return CacheBuildModules.createBuildModule({
		id: 'test-integrated-transport-geometry',
		owner: 'geometry',
		provides: [
			'geometry.cachePosition',
			'geometry.integratedTransportRay',
			'geometry.constructionPositionStencil',
			'geometry.constructionDirectionStencil',
		],
		requires: [],
		blocks: [
			{
				id: 'test-integrated-transport-geometry-types',
				phase: 'declare',
				order: 0,
				source: `struct CacheTransportRay {
	vec3 originMeters;
	vec3 direction;
	float distanceMeters;
	bool endsOnGround;
};

struct CachePositionStencil {
	ivec4 indices;
	vec4 weights;
};

struct CacheDirectionStencil {
	ivec4 indices;
	vec4 weights;
};`,
			},
			{
				id: 'test-integrated-transport-geometry-functions',
				phase: 'function',
				order: 0,
				source: `vec3 cachePosition(int positionIndex) {
	return vec3(0.0, 0.0, float(positionIndex));
}

CacheTransportRay cacheIntegratedTransportRay(
	int positionIndex,
	int incomingDirectionIndex
) {
	return CacheTransportRay(
		cachePosition(positionIndex),
		vec3(0.0, 0.0, 1.0),
		float(incomingDirectionIndex + 1),
		false
	);
}

CachePositionStencil cacheConstructionPositionStencil(
	vec3 positionMeters
) {
	return CachePositionStencil(
		ivec4(int(positionMeters.z), 0, 0, 0),
		vec4(1.0, 0.0, 0.0, 0.0)
	);
}

CacheDirectionStencil cacheConstructionDirectionStencil(
	vec3 positionMeters,
	vec3 physicalDirection
) {
	return CacheDirectionStencil(
		ivec4(int(positionMeters.x + physicalDirection.x), 0, 0, 0),
		vec4(1.0, 0.0, 0.0, 0.0)
	);
}`,
			},
		],
		bindings: [],
	});
}

/** Create the atmosphere medium capability required by one integrated transport pass. */
function createAtmosphereModule() {
	return CacheBuildModules.createBuildModule({
		id: 'test-integrated-transport-atmosphere',
		owner: 'atmosphere',
		provides: ['atmosphere.medium'],
		requires: ['geometry.cachePosition'],
		blocks: [
			{
				id: 'test-integrated-transport-extinction',
				phase: 'function',
				order: 0,
				source: `float cacheExtinction(
	vec3 positionMeters,
	int wavelengthIndex
) {
	return max(positionMeters.z + float(wavelengthIndex), 0.0);
}`,
			},
		],
		bindings: [],
	});
}

/** Create the layout-owned input accessor and scalar-output capability. */
function createLayoutModule(input) {
	const inputSampler = CacheBuildModules.fieldInputBindingName(input.id);

	return CacheBuildModules.createBuildModule({
		id: 'test-integrated-transport-layout',
		owner: 'cache',
		provides: ['cache.storedScatteringDensity', 'cache.outputLayout'],
		requires: [],
		blocks: [
			{
				id: 'test-integrated-transport-stored-density',
				phase: 'function',
				order: 0,
				source: `float cacheStoredScatteringDensity(
	int directionIndex,
	int positionIndex,
	int wavelengthIndex
) {
	return texelFetch(
		${inputSampler},
		ivec3(directionIndex, positionIndex, wavelengthIndex),
		0
	).r;
}`,
			},
		],
		bindings: [],
	});
}

describe('IntegratedCacheTransport', /** Called by Jasmine to register the named test suite. */ () => {
	it('emits the fixed fused stored-field transport contract', /** Called by Jasmine to exercise the named behavior. */ () => {
		const input = createField('local-sun-j2');
		const output = createField('local-sun-l2');
		const module = new IntegratedCacheTransport().createCacheModule({
			kind: 'transport',
			order: 2,
			inputs: [input],
			output,
			options: TEST_CONSTRUCTION_OPTIONS,
		});

		expect(module.id).toBe('algorithm32-cache-integrated-transport-operation-v1');
		expect(module.owner).toBe('transport');
		expect(module.provides).toEqual(['cache.operation.transport']);
		expect(module.requires).toEqual([
			'atmosphere.medium',
			'cache.outputLayout',
			'cache.storedScatteringDensity',
			'geometry.cachePosition',
			'geometry.constructionDirectionStencil',
			'geometry.constructionPositionStencil',
			'geometry.integratedTransportRay',
		]);
		expect(module.bindings).toEqual([
			jasmine.objectContaining({
				spec: jasmine.objectContaining({name: 'CACHE_TRANSPORT_DIRECTION_TAP_COUNT', kind: 'define'}),
				value: 4,
			}),
			jasmine.objectContaining({
				spec: jasmine.objectContaining({name: 'CACHE_TRANSPORT_INTERVAL_COUNT', kind: 'define'}),
				value: 15,
			}),
			jasmine.objectContaining({
				spec: jasmine.objectContaining({name: 'CACHE_TRANSPORT_POSITION_TAP_COUNT', kind: 'define'}),
				value: 4,
			}),
		]);
		const source = module.blocks[0].source;
		expect(source).toContain('cacheIntegratedTransportRay(');
		expect(source).toContain('pointIndex <= CACHE_TRANSPORT_INTERVAL_COUNT');
		expect(source).toContain('cacheExtinction(');
		expect(source).toContain('cacheConstructionPositionStencil(samplePositionMeters)');
		expect(source).toContain('cacheConstructionDirectionStencil(samplePositionMeters, ray.direction)');
		expect(source).toContain('cacheStoredScatteringDensity(');
		expect(source).toContain('a32CacheOutput = radiance;');
	});

	it('assembles against resolved owner capabilities with one layout-owned input sampler and scalar output', /** Called by Jasmine to exercise the named behavior. */ () => {
		const input = createField('local-sun-j2');
		const output = createField('local-sun-l2');
		const operationModule = new IntegratedCacheTransport().createCacheModule({
			kind: 'transport',
			order: 2,
			inputs: [input],
			output,
			options: TEST_CONSTRUCTION_OPTIONS,
		});
		const geometryModule = createGeometryModule();
		const atmosphereModule = createAtmosphereModule();
		const layoutModule = createLayoutModule(input);
		const modules = [operationModule, layoutModule, atmosphereModule, geometryModule];
		const providedCapabilities = new Set(
			modules.flatMap(
				/**
				 * Called by Array.prototype.flatMap to collect one module's capabilities.
				 * @param module - The cache-build module.
				 * @returns - The capabilities supplied by the module.
				 */ (module) => module.provides,
			),
		);

		expect(operationModule.requires.every((capability) => providedCapabilities.has(capability))).toBeTrue();

		const shader = new CachePassAssembler().assemble(
			{
				id: 'test-integrated-transport-pass',
				kind: 'transport',
				order: 2,
				inputs: [input.id],
				output: output.id,
				modules,
			},
			output,
		);
		const inputSampler = CacheBuildModules.fieldInputBindingName(input.id);
		const inputSamplerDeclaration = `uniform highp sampler2DArray ${inputSampler};`;
		const samplerDeclarations = shader.source.match(/uniform highp sampler2DArray [A-Za-z0-9_]+;/g) ?? [];

		expect(samplerDeclarations).toEqual([inputSamplerDeclaration]);
		expect(layoutModule.blocks[0].source).toContain(inputSampler);
		expect(operationModule.blocks[0].source).not.toContain(inputSampler);
		expect(shader.source).toContain('layout(location = 0) out float a32CacheOutput;');
		expect(shader.source).toContain('a32CacheOutput = radiance;');
		expect(shader.output).toBe(output);
		expect(shader.source.indexOf('CacheTransportRay cacheIntegratedTransportRay(')).toBeLessThan(
			shader.source.indexOf('CacheTransportRay ray = cacheIntegratedTransportRay('),
		);
		expect(shader.source.indexOf('float cacheExtinction(')).toBeLessThan(
			shader.source.indexOf('float extinction = cacheExtinction('),
		);
		expect(shader.source.indexOf('float cacheStoredScatteringDensity(')).toBeLessThan(
			shader.source.indexOf('density += cacheStoredScatteringDensity('),
		);
	});
});
