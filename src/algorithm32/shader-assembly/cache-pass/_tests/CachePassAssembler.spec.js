import {CachePassAssembler} from '../CachePassAssembler.js';
import {CacheBuildModules} from '../CacheBuildModules.js';
import {CACHE_WAVELENGTH_LAYER_BINDING_NAME} from '../consts.js';
import {CacheValues} from '../../../gpu-cache-runtime/CacheValues.js';

/**
 * Called by this module to output field.
 * @param id - The id value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function outputField(id = 'result') {
	return {
		id,
		storage: {
			format: 'R32F',
			width: 4,
			height: 3,
			layers: 2,
		},
	};
}

/**
 * Called by this module to create module.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createModule(overrides = {}) {
	return CacheBuildModules.createBuildModule({
		id: overrides.id ?? 'test-module',
		owner: overrides.owner ?? 'cache',
		provides: overrides.provides ?? [],
		requires: overrides.requires ?? [],
		blocks: overrides.blocks ?? [],
		bindings: overrides.bindings ?? [],
	});
}

/**
 * Called by this module to create pass.
 * @param modules - The modules value accepted by the operation.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createPass(modules, overrides = {}) {
	return {
		id: overrides.id ?? 'test-pass',
		kind: overrides.kind ?? 'accumulate',
		order: overrides.order ?? 4,
		inputs: overrides.inputs ?? ['j-through-3'],
		output: overrides.output ?? 'result',
		modules,
	};
}

describe('CachePassAssembler', /** Called by Jasmine to register the named test suite. */ () => {
	it('assembles stable source independently of module arrival order', /** Called by Jasmine to exercise the named behavior. */ () => {
		const data = CacheValues.createData({
			id: 'test-values',
			quantity: 'dimensionless-test-data',
			units: '1',
			shape: [3],
			values: [1, 2, 3],
		});
		const provider = createModule({
			id: 'provider',
			owner: 'atmosphere',
			provides: ['test.provider'],
			blocks: [
				{
					id: 'provider-function',
					phase: 'function',
					order: 50,
					source: 'float providerValue() { return 2.0; }',
				},
			],
			bindings: [
				{
					spec: {
						id: 'test-count',
						name: 'CACHE_TEST_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'pass',
					},
					value: 3,
				},
			],
		});
		const consumer = createModule({
			id: 'consumer',
			owner: 'cache',
			provides: ['test.consumer'],
			requires: ['test.provider'],
			blocks: [
				{
					id: 'consumer-function',
					phase: 'function',
					order: 0,
					source: 'float consumerValue() { return providerValue(); }',
				},
				{
					id: 'consumer-main',
					phase: 'main',
					order: 0,
					source: 'a32CacheOutput = consumerValue();',
				},
			],
			bindings: [
				{
					spec: {
						id: 'test-values',
						name: 'uTestValues',
						kind: 'data',
						shaderType: 'sampler2D',
						frequency: 'build',
					},
					value: data,
				},
			],
		});
		const assembler = new CachePassAssembler();
		const output = outputField();
		const forward = assembler.assemble(createPass([provider, consumer]), output);
		const reversed = assembler.assemble(createPass([consumer, provider]), output);

		expect(reversed).toEqual(forward);
		expect(forward.source.match(/#define CACHE_TEST_COUNT 3/gu)).toHaveSize(1);
		expect(forward.source).not.toContain('#version');
		expect(forward.source).toContain('uniform sampler2D uTestValues;');
		expect(forward.source).toContain(
			`uniform highp sampler2DArray ${CacheBuildModules.fieldInputBindingName('j-through-3')};`,
		);
		expect(forward.source).toContain(`uniform int ${CACHE_WAVELENGTH_LAYER_BINDING_NAME};`);
		expect(forward.source.indexOf('providerValue()')).toBeLessThan(forward.source.indexOf('consumerValue()'));
		expect(forward.sourceHash).toMatch(/^fnv1a32:/);
		expect(forward.id).toMatch(/^cache-shader:fnv1a32:/);
		expect(forward.output).toBe(output);
	});
});
